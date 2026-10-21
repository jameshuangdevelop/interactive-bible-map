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
const ALLOWED_DROPPED_ISLAND_PARTS = Object.freeze({
  pontus: [{ name: "pontus-lower-halys-coastal-islet", maxAreaKm2: 10 }]
});

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
  const measured = polygons.map((polygon) => ({
    polygon,
    areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon })
  }));
  const kept = measured
    .filter((entry) => entry.areaKm2 >= MIN_NON_ISLAND_PART_KM2)
    .map((entry) => entry.polygon);
  if (kept.length === 0) {
    throw new Error(`${feature.id}: removing parts under ${MIN_NON_ISLAND_PART_KM2} km² removed the entire geometry.`);
  }
  const dominant = kept
    .map((polygon) => ({ polygon, areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon }) }))
    .sort((left, right) => right.areaKm2 - left.areaKm2);
  const dropped = dominant.slice(1);
  if (dropped.length > 0) {
    const droppedSummary = dropped.map((entry) => entry.areaKm2.toFixed(3)).join(", ");
    console.warn(`${feature.id}: dropping ${dropped.length} detached part(s) after simplification (${droppedSummary} km²).`);
    const allowed = ALLOWED_DROPPED_ISLAND_PARTS[feature.id] ?? [];
    if (allowed.length > 0) {
      console.warn(
        `${feature.id}: allowed dropped island exceptions: ${allowed
          .map((island) => `${island.name} <= ${island.maxAreaKm2} km²`)
          .join("; ")}.`
      );
    }
    const largeDrop = dropped.find((entry) => {
      if (entry.areaKm2 < MIN_NON_ISLAND_PART_KM2) return false;
      return !allowed.some((island) => entry.areaKm2 <= island.maxAreaKm2);
    });
    if (largeDrop) {
      throw new Error(`${feature.id}: dropped detached part ${largeDrop.areaKm2.toFixed(3)} km² (>= ${MIN_NON_ISLAND_PART_KM2} km²); refusing silent geometry loss.`);
    }
  }
  const selected = dominant.length > 1 ? [dominant[0].polygon] : kept;
  const geometry = selected.length === 1
    ? { type: "Polygon", coordinates: selected[0] }
    : { type: "MultiPolygon", coordinates: selected };
  return { ...feature, geometry };
}

function simplifyMetresByRegion(regionId) {
  // 25 m for Levant neighbours that share one synthetic split line; this keeps that seam
  // visually stable while preserving precise coastline/river turns near each anchor.
  if (regionId === "galilee") return 25;
  if (regionId === "samaria") return 25;
  if (regionId === "judea") return 25;
  // 600 m for the rest: island extracts are already coarse from area parts, and Pontus follows
  // long coast/river stretches where this tolerance keeps gzip size within the lazy-load cap.
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
      sources: ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678163", "pleiades:678378", "bib:isbe-en-gannim", "osm:relation/2246907"],
      confidence: "medium",
      note: "Galilee as Josephus bounds it (Jewish War 3.3.1): Ptolemais's territory and Mount Carmel to the west, Samaria and Scythopolis to the south, the Jordan and the lake to the east, and Tyre's country to the north. Josephus says Carmel 'had formerly belonged to the Galileans, but now belonged to the Tyrians'. The edges are approximate. The line runs through the eastern end of Carmel, through Ginea and Scythopolis, and includes the north-east Jordan strip from this project's Herodian-area build where Josephus gives no exact line. It takes the western half of the Sea of Galilee."
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
      note: "Cyrenaica, 'the parts of Libya around Cyrene' (Acts 2:10), as this project's AD 69 area draws it. Its west edge meets the coast of the Great Syrtis 158 km east of the Euphrantas Tower (Euphranta, modern Sirte), which Strabo gives as the boundary 'as it was under Ptolemy' (17.3.20), and 79 km west of the Altars of the Philaeni, which Strabo and Pliny (5.4) name at the head of the gulf. No source this project cites gives the first-century line, so the west, desert and east edges are approximate."
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
    if (!samariaPieces.some((feature) => pointInGeometry(anchorPoint(anchorsById, "samaria-point"), feature.geometry))) {
      throw new Error("Samaria/Judea split failed: the Samaria anchor is not inside the Samaria side.");
    }
    if (!judeaPiecesRaw.some((feature) => pointInGeometry(anchorPoint(anchorsById, "akrabatta"), feature.geometry))) {
      throw new Error("Samaria/Judea split failed: Akrabatta is not inside the Judea side.");
    }
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
      sources: ["bib:josephus-jewish-war", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403", "pleiades:678163", "pleiades:678378", "wikidata:Q374748", "wikidata:Q185318", "bib:isbe-en-gannim", "osm:relation/2246907"],
      confidence: "medium",
      note: "Samaria, which Josephus says 'begins at a village...called Ginea, and ends at the Acrabbene toparchy' (Jewish War 3.3.4). Its south edge runs through Anouath Borkeos, 'the northern boundary of Judea' (3.3.5), and north of Akraba (Acrabatta), a toparchy that both Josephus and Pliny count in Judea; between those places the line is approximate. The coast is split with Judea on that line as a convention: Josephus gives Judea's breadth from the Jordan to Joppa and says its maritime places reach Ptolemais, while Pliny calls the coast from Ascalon to Caesarea 'the region of Samaria' but lists Joppa among Judea's toparchies (Natural History 5.14-15)."
    });
    addFeature(features, {
      id: "judea",
      geometry: judea.geometry,
      sources: ["bib:josephus-jewish-war", "bib:josephus-antiquities", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403", "awmc:ad69-face-raw-0001", "osm:relation/2246907"],
      confidence: "medium",
      note: "Judea as Josephus describes it (Jewish War 3.3.5), with Idumea, which he counts among Judea's portions; Pliny counts Idumea separately (Natural History 5.14–15). Its north edge, shared with Samaria, runs through Anouath Borkeos and north of Akraba (Acrabatta), and is approximate. The coast is split with Samaria along that line, a convention neither author states: Josephus gives Judea's breadth from the Jordan to Joppa and says its maritime places reach Ptolemais, while Pliny calls the coast from Ascalon to Caesarea 'the region of Samaria' but lists Joppa among Judea's toparchies (5.14–15). The coast from Raphia to Rhinocolura is left out: Pliny places those towns and Gaza in Idumaea and Palaestina, and Josephus says Augustus added Gaza to Syria (Antiquities 17.11.4). The districts of Gaza and of Ascalon, which Pliny calls a free town, aren't drawn separately and lie inside this outline."
    });

    // Pontus option A: pontus union bithynia east of lower Halys (Kızılırmak) downstream to mouth.
    const pontusArea = areaById(areas, "pontus");
    const bithyniaArea = areaById(areas, "bithynia");
    const kizilirmak = findKizilirmakFeature(naturalEarthRiversMain);
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
        [42.5, 40.5],
        [35.621, 40.5],
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
      sources: ["bib:strabo-geography", "bib:isbe-pontus", "bib:isbe-galatia", "pleiades:857024", "pleiades:857350", "naturalearth:ne-10m-rivers-lake-centerlines"],
      confidence: "medium",
      note: "The kingdom of Pontus, including Pontus Galaticus and Lesser Armenia as this project's Pontus area draws them, since no source draws a line between these lands, plus the coast east of the lower Halys with Amisus and Themiscyra (Strabo 12.3.9; ISBE, 'Pontus'). The west cut follows Natural Earth's Kızılırmak line from the 35.621°E, 41.287°N tripoint downstream; one short straight segment ties the tripoint to the first river vertex, and a second runs north to the sea where the river line ends."
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
