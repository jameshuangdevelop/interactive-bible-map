import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mapshaper from "mapshaper";
import booleanValid from "@turf/boolean-valid";
import { pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { ancientGeoCache, fetchPinnedInputs, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import { geometryAreaKm2, polygonsOf } from "./lib/geometry-cleanup.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const areasPath = path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson");
const anchorsPath = path.join(repositoryRoot, "data", "geo", "region-anchors.json");
const gazaFacePath = path.join(repositoryRoot, "data", "geo", "sources", "gaza-rhinocolura-face.geojson");
const outputPath = path.join(repositoryRoot, "data", "geo", "region-outlines.geojson");

const OUTPUT_PRECISION = 0.00001;
const MIN_NON_ISLAND_PART_KM2 = 1;
const ISLAND_REGION_IDS = new Set(["crete", "chios", "cos", "malta", "rhodes", "samos"]);

function featureCollection(features) {
  return { type: "FeatureCollection", features };
}

function geometryFeature(geometry, properties = {}, id = undefined) {
  return { type: "Feature", ...(id ? { id } : {}), properties, geometry };
}

function geometriesAsFeatures(document) {
  if (!document) return [];
  if (document.type === "FeatureCollection") return (document.features ?? []).filter((feature) => feature.geometry);
  if (document.type === "GeometryCollection") {
    return (document.geometries ?? []).filter(Boolean).map((geometry) => geometryFeature(geometry));
  }
  if (document.type === "Feature") return document.geometry ? [document] : [];
  if (document.type && document.coordinates) return [geometryFeature(document)];
  return [];
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function booleanOp({ workDirectory, tag, operation, subjectFeatures, maskFeatures }) {
  const subjectPath = path.join(workDirectory, `${tag}-${operation}-subject.geojson`);
  const maskPath = path.join(workDirectory, `${tag}-${operation}-mask.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-${operation}-output.geojson`);
  await writeJson(subjectPath, featureCollection(subjectFeatures.map((feature) => geometryFeature(feature.geometry))));
  await writeJson(maskPath, featureCollection(maskFeatures.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(
    `-i ${subjectPath} name=subject -i ${maskPath} name=mask -target subject -${operation} mask -o format=geojson ${outputPath}`
  );
  return geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
}

function totalAreaKm2(features) {
  return (features ?? []).reduce((sum, feature) => sum + geometryAreaKm2(feature.geometry), 0);
}

async function booleanOpStrict({
  workDirectory,
  tag,
  operation,
  subjectFeatures,
  maskFeatures,
  expectNonEmpty = true,
  expectAreaChangeKm2 = null
}) {
  const beforeAreaKm2 = totalAreaKm2(subjectFeatures);
  const result = await booleanOp({ workDirectory, tag, operation, subjectFeatures, maskFeatures });
  if (expectNonEmpty && result.length === 0) {
    throw new Error(`${tag}: ${operation} produced no geometry.`);
  }
  if (expectAreaChangeKm2 != null) {
    const afterAreaKm2 = totalAreaKm2(result);
    const deltaKm2 = Math.abs(beforeAreaKm2 - afterAreaKm2);
    if (deltaKm2 < expectAreaChangeKm2) {
      throw new Error(`${tag}: ${operation} changed area by only ${deltaKm2.toFixed(3)} km² (< ${expectAreaChangeKm2} km²).`);
    }
  }
  return result;
}

async function unionOne({ workDirectory, tag, features }) {
  if (!Array.isArray(features) || features.length === 0) {
    throw new Error(`Union ${tag} received no features.`);
  }
  const inputPath = path.join(workDirectory, `${tag}-union-in.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-union-out.geojson`);
  await writeJson(
    inputPath,
    featureCollection(features.map((feature) => geometryFeature(feature.geometry, { group: 1 })))
  );
  await mapshaper.runCommands(`-i ${inputPath} -dissolve2 group -o format=geojson ${outputPath}`);
  const featuresOut = geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
  if (featuresOut.length !== 1) throw new Error(`Union ${tag} produced ${featuresOut.length} features.`);
  return featuresOut[0];
}

async function explode({ workDirectory, tag, features }) {
  if (!Array.isArray(features) || features.length === 0) return [];
  const inputPath = path.join(workDirectory, `${tag}-explode-in.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-explode-out.geojson`);
  await writeJson(inputPath, featureCollection(features.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(`-i ${inputPath} -explode -o format=geojson ${outputPath}`);
  return geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
}

function bbox(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return [minX, minY, maxX, maxY];
}

function areaById(collection, areaId) {
  const found = (collection.features ?? []).find((feature) => feature?.properties?.areaId === areaId);
  if (!found) throw new Error(`Missing area '${areaId}'.`);
  return found;
}

function polygonPart(collection, areaId, partIndex) {
  const area = areaById(collection, areaId);
  const { geometry } = area;
  if (geometry.type === "Polygon") {
    if (partIndex !== 0) throw new Error(`Area '${areaId}' has no part ${partIndex}.`);
    return { type: "Polygon", coordinates: geometry.coordinates };
  }
  if (geometry.type !== "MultiPolygon") throw new Error(`Area '${areaId}' has unsupported type '${geometry.type}'.`);
  if (partIndex < 0 || partIndex >= geometry.coordinates.length) throw new Error(`Area '${areaId}' has no part ${partIndex}.`);
  return { type: "Polygon", coordinates: geometry.coordinates[partIndex] };
}

function addFeature(features, { id, geometry, sources, confidence, note }) {
  features.push({
    type: "Feature",
    id,
    properties: { sources, confidence, note },
    geometry
  });
}

function mapAnchors(anchors) {
  return new Map((anchors.anchors ?? []).map((anchor) => [anchor.id, anchor]));
}

function anchorPoint(anchorsById, anchorId) {
  const anchor = anchorsById.get(anchorId);
  if (!anchor) throw new Error(`Missing anchor '${anchorId}'.`);
  return anchor.coordinates;
}

function nearestVertexIndex(line, point) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < line.length; index += 1) {
    const candidate = line[index];
    const distance = (candidate[0] - point[0]) ** 2 + (candidate[1] - point[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function lowerHalysFromTripoint(riverCoordinates, tripoint) {
  if (!Array.isArray(riverCoordinates) || riverCoordinates.length < 2) {
    throw new Error("Lower Halys build received an empty river line.");
  }
  const startIndex = nearestVertexIndex(riverCoordinates, tripoint);
  const toStart = riverCoordinates.slice(0, startIndex + 1).reverse();
  const toEnd = riverCoordinates.slice(startIndex);
  const mouthSide = toStart.at(-1)[1] > toEnd.at(-1)[1] ? toStart : toEnd;
  return [tripoint, ...mouthSide.slice(1)];
}

function normalizedText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/gu, "");
}

function findKizilirmakFeature(...collections) {
  const features = collections.flatMap((collection) => collection?.features ?? []);
  const candidates = features.filter((feature) => /kiz.*rmak/u.test(normalizedText(feature?.properties?.name)));
  if (candidates.length === 0) throw new Error("Could not find Kızılırmak in pinned Natural Earth rivers inputs.");
  const scored = candidates.map((feature) => {
    const lines = feature.geometry?.type === "LineString" ? [feature.geometry.coordinates] : (feature.geometry?.coordinates ?? []);
    const allPoints = lines.flat();
    const minY = Math.min(...allPoints.map((point) => point[1]));
    const maxY = Math.max(...allPoints.map((point) => point[1]));
    return { feature, score: maxY - minY };
  });
  return scored.sort((left, right) => right.score - left.score)[0].feature;
}

function pointAtMaxLatitude(line) {
  return [...line].sort((left, right) => right[1] - left[1])[0];
}

function partCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") return 1;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.length;
  return 0;
}

function pruneSmallParts(feature) {
  if (ISLAND_REGION_IDS.has(feature.id)) return feature;
  const polygons = polygonsOf(feature.geometry);
  if (polygons.length <= 1) return feature;
  const kept = polygons.filter((polygon) => geometryAreaKm2({ type: "Polygon", coordinates: polygon }) >= MIN_NON_ISLAND_PART_KM2);
  if (kept.length === 0) {
    throw new Error(`${feature.id}: removing parts under ${MIN_NON_ISLAND_PART_KM2} km² removed the entire geometry.`);
  }
  const dominant = kept
    .map((polygon) => ({ polygon, areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon }) }))
    .sort((left, right) => right.areaKm2 - left.areaKm2);
  const selected = dominant.length > 1 ? [dominant[0].polygon] : kept;
  const geometry = selected.length === 1
    ? { type: "Polygon", coordinates: selected[0] }
    : { type: "MultiPolygon", coordinates: selected };
  return { ...feature, geometry };
}

function simplifyMetresByRegion(regionId) {
  if (regionId === "galilee") return 25;
  if (regionId === "samaria") return 25;
  if (regionId === "judea") return 25;
  if (regionId === "pontus") return 600;
  return 600;
}

async function simplifyCollection({ workDirectory, collection }) {
  const inputPath = path.join(workDirectory, "region-outlines-raw.geojson");
  const outputPath = path.join(workDirectory, "region-outlines-simplified.geojson");
  const withTolerance = featureCollection(
    (collection.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        simplifyMetres: simplifyMetresByRegion(feature.id)
      }
    }))
  );
  await writeJson(inputPath, withTolerance);
  await mapshaper.runCommands(
    `-i ${inputPath} -simplify dp variable interval="simplifyMetres" keep-shapes -o format=geojson precision=${OUTPUT_PRECISION} ${outputPath}`
  );
  const simplified = JSON.parse(await fs.readFile(outputPath, "utf8"));
  for (const feature of simplified.features ?? []) {
    if (feature?.properties) delete feature.properties.simplifyMetres;
  }
  return simplified;
}

export async function buildRegionOutlinesData({ writeOutput = false } = {}) {
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-region-outlines-"));
  try {
    const areas = JSON.parse(await fs.readFile(areasPath, "utf8"));
    const anchors = JSON.parse(await fs.readFile(anchorsPath, "utf8"));
    const anchorsById = mapAnchors(anchors);

    const cache = ancientGeoCache();
    const inputFiles = await fetchPinnedInputs(cache.inputs);
    const naturalEarthLand = await readJsonFile(inputFiles.naturalEarthLand);
    const naturalEarthRiversMain = await readJsonFile(inputFiles.naturalEarthRiversMain);
    const naturalEarthRiversEurope = await readJsonFile(inputFiles.naturalEarthRiversEurope);
    const gazaFaceSource = await readJsonFile(gazaFacePath);
    const landMask = (naturalEarthLand.features ?? []).filter((feature) => feature.geometry);

    const features = [];
    const allowedInputGeometries = [
      ...(areas.features ?? []).map((feature) => feature.geometry),
      ...landMask.map((feature) => feature.geometry)
    ];

    // Unchanged region/part extractions.
    addFeature(features, {
      id: "galilee",
      geometry: polygonPart(areas, "galilee-perea", 0),
      sources: ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678163", "pleiades:678378"],
      confidence: "medium",
      note: "Extracted from galilee-perea part 0. It keeps inherited coastline/river edges from the ancient area build."
    });
    addFeature(features, {
      id: "crete",
      geometry: polygonPart(areas, "crete-cyrene", 0),
      sources: ["bib:strabo-geography", "bib:isbe-crete", "pleiades:589748"],
      confidence: "high",
      note: "Extracted whole from crete-cyrene part 0; Cauda is excluded."
    });
    addFeature(features, {
      id: "libya",
      geometry: polygonPart(areas, "crete-cyrene", 1),
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-libya", "bib:isbe-cyrene", "pleiades:373777", "pleiades:363959", "pleiades:363924", "scripture:Acts 2:10"],
      confidence: "medium",
      note: "Extracted whole from crete-cyrene part 1, with inherited AWMC land edges."
    });
    addFeature(features, { id: "chios", geometry: polygonPart(areas, "asia", 2), sources: ["bib:strabo-geography", "bib:isbe-chios"], confidence: "high", note: "Extracted whole from asia part 2." });
    addFeature(features, { id: "cos", geometry: polygonPart(areas, "asia", 4), sources: ["bib:strabo-geography", "bib:isbe-cos"], confidence: "high", note: "Extracted whole from asia part 4." });
    addFeature(features, { id: "malta", geometry: polygonPart(areas, "sicily", 1), sources: ["bib:pliny-natural-history", "bib:hmml-contesting-shipwreck", "pleiades:462311"], confidence: "high", note: "Extracted whole from sicily part 1 (Malta only; Mljet remains the low-confidence candidate)." });
    addFeature(features, { id: "rhodes", geometry: polygonPart(areas, "asia", 5), sources: ["bib:strabo-geography", "bib:isbe-rhodes"], confidence: "high", note: "Extracted whole from asia part 5." });
    addFeature(features, { id: "samos", geometry: polygonPart(areas, "asia", 1), sources: ["bib:strabo-geography", "bib:isbe-samos"], confidence: "high", note: "Extracted whole from asia part 1." });

    // Samaria + Judea from existing area edges + G1.1 line + Gaza-Rhinocolura exclusion.
    const judeaSamariaIdumea = areaById(areas, "judea-samaria-idumea");
    const gazaFaceFeatures = geometriesAsFeatures(gazaFaceSource);
    if (gazaFaceFeatures.length === 0) throw new Error("Missing gaza-rhinocolura-face source geometry.");
    allowedInputGeometries.push(...gazaFaceFeatures.map((feature) => feature.geometry));
    const [minX, , maxX, maxY] = bbox(judeaSamariaIdumea.geometry);
    const g11Line = [
      [minX - 1, 32.0954],
      anchorPoint(anchorsById, "anouath-borkeos"),
      [35.3125, 32.1704],
      [maxX + 1, 32.1704]
    ];
    allowedInputGeometries.push({ type: "LineString", coordinates: g11Line });
    const g11NorthMask = geometryFeature({
      type: "Polygon",
      coordinates: [[
        ...g11Line,
        [maxX + 2, maxY + 2],
        [minX - 2, maxY + 2],
        g11Line[0]
      ]]
    });
    const westClip = await booleanOpStrict({
      workDirectory,
      tag: "samaria-judea-west",
      operation: "clip",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: [g11NorthMask],
      expectAreaChangeKm2: 1
    });
    const westErase = await booleanOpStrict({
      workDirectory,
      tag: "samaria-judea-east",
      operation: "erase",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: [g11NorthMask],
      expectAreaChangeKm2: 1
    });
    const samariaPieces = westClip.some((feature) => pointInGeometry(anchorPoint(anchorsById, "samaria-point"), feature.geometry)) ? westClip : westErase;
    const judeaPiecesRaw = samariaPieces === westClip ? westErase : westClip;
    const gazaFaceInArea = await booleanOpStrict({
      workDirectory,
      tag: "gaza-rhinocolura-face-from-ad69",
      operation: "clip",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: gazaFaceFeatures,
      expectAreaChangeKm2: 1
    });
    const judeaPieces = await booleanOpStrict({
      workDirectory,
      tag: "judea-minus-gaza-face",
      operation: "erase",
      subjectFeatures: judeaPiecesRaw,
      maskFeatures: gazaFaceInArea,
      expectAreaChangeKm2: 1
    });
    const samaria = await unionOne({ workDirectory, tag: "samaria-union", features: samariaPieces });
    const judea = await unionOne({ workDirectory, tag: "judea-union", features: judeaPieces });
    addFeature(features, {
      id: "samaria",
      geometry: samaria.geometry,
      sources: ["bib:josephus-jewish-war", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403", "pleiades:678163", "wikidata:Q374748", "wikidata:Q185318", "bib:isbe-en-gannim"],
      confidence: "medium",
      note: "Computed from judea-samaria-idumea with G1.1 line (coast at 32.0954°N → Anouath Borkeos → midpoint north of Akraba → due east to Jordan edge), so coast and Jordan come from the area geometry and Samaria/Judea share the divider exactly."
    });
    addFeature(features, {
      id: "judea",
      geometry: judea.geometry,
      sources: ["bib:josephus-jewish-war", "bib:josephus-antiquities", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403"],
      confidence: "medium",
      note: "Computed as judea-samaria-idumea south of G1.1, then removing the existing Gaza–Rhinocolura face piece (G3.1), with Idumea retained."
    });

    // Pontus option A: pontus union bithynia east of lower Halys (Kızılırmak) downstream to mouth.
    const pontusArea = areaById(areas, "pontus");
    const bithyniaArea = areaById(areas, "bithynia");
    const kizilirmak = findKizilirmakFeature(naturalEarthRiversMain, naturalEarthRiversEurope);
    const riverCoordinates = kizilirmak.geometry?.type === "LineString"
      ? kizilirmak.geometry.coordinates
      : (kizilirmak.geometry?.coordinates?.[0] ?? []);
    const halysLine = lowerHalysFromTripoint(riverCoordinates, [35.621, 41.287]);
    allowedInputGeometries.push({ type: "LineString", coordinates: halysLine });
    const halysMouth = pointAtMaxLatitude(halysLine);
    const eastMask = geometryFeature({
      type: "Polygon",
      coordinates: [[
        [35.621, 41.287],
        ...halysLine.slice(1),
        [halysMouth[0], 43.5],
        [42.5, 43.5],
        [42.5, 39.0],
        [35.621, 39.0],
        [35.621, 41.287]
      ]]
    });
    const eastPiece = await booleanOpStrict({
      workDirectory,
      tag: "pontus-bithynia-halys-east",
      operation: "clip",
      subjectFeatures: [bithyniaArea],
      maskFeatures: [eastMask],
      expectAreaChangeKm2: 1
    });
    const pontusUnion = await unionOne({
      workDirectory,
      tag: "pontus-option-a",
      features: [pontusArea, ...eastPiece]
    });
    addFeature(features, {
      id: "pontus",
      geometry: pontusUnion.geometry,
      sources: ["bib:strabo-geography", "bib:isbe-pontus", "bib:isbe-galatia", "pleiades:857024", "pleiades:857350", "naturalearth:ne_10m_rivers_lake_centerlines", "naturalearth:ne_10m_rivers_europe"],
      confidence: "medium",
      note: "Option A: pontus plus the part of bithynia east of the lower Halys (Natural Earth's Kızılırmak), cut from the 35.621°E 41.287°N tripoint downstream to the Black Sea mouth."
    });

    // Clip every region to land.
    const clipped = [];
    for (const feature of features) {
      const pieces = await booleanOpStrict({
        workDirectory,
        tag: `clip-land-${feature.id}`,
        operation: "clip",
        subjectFeatures: [feature],
        maskFeatures: landMask,
        expectNonEmpty: true
      });
      const merged = await unionOne({ workDirectory, tag: `clip-land-${feature.id}-union`, features: pieces });
      clipped.push({ ...feature, geometry: merged.geometry });
    }

    const simplified = await simplifyCollection({
      workDirectory,
      collection: featureCollection(clipped)
    });
    const cleanedFeatures = [];
    for (const feature of simplified.features ?? []) {
      const cleaned = pruneSmallParts(feature);
      if (!booleanValid(cleaned)) throw new Error(`${cleaned.id} is invalid after simplification.`);
      cleanedFeatures.push(cleaned);
    }
    const cleanedCollection = featureCollection(cleanedFeatures);

    if (writeOutput) {
      await fs.writeFile(outputPath, `${JSON.stringify(cleanedCollection, null, 2)}\n`, "utf8");
    }

    return {
      collection: cleanedCollection,
      allowedInputGeometries,
      sanity: {
        pontusBaseAreaKm2: geometryAreaKm2(pontusArea.geometry),
        judeaSamariaCombinedKm2: geometryAreaKm2(samaria.geometry) + geometryAreaKm2(judea.geometry),
        partCounts: Object.fromEntries(cleanedFeatures.map((feature) => [feature.id, partCount(feature.geometry)])),
        nonIslandIds: cleanedFeatures.map((feature) => feature.id).filter((id) => !ISLAND_REGION_IDS.has(id))
      }
    };
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

async function main() {
  const result = await buildRegionOutlinesData({ writeOutput: true });
  console.log(`Wrote ${result.collection.features.length} region outlines to data/geo/region-outlines.geojson.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
