import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mapshaper from "mapshaper";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const reportDirectory = path.join(os.tmpdir(), "ibm-m4-03b");
const workDirectory = path.join(os.tmpdir(), "ibm-m4-03b-compose");
const partitionWorkDirectory = path.join(os.tmpdir(), "ibm-m4-03b-work");
const outputAreasPath = path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson");
const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";

const AREA_ORDER = [
  "arabia",
  "commagene",
  "cappadocia",
  "galatia",
  "pamphylia",
  "lycia",
  "bithynia",
  "achaia",
  "macedonia",
  "asia",
  "cyprus",
  "crete-cyrene",
  "egypt",
  "italy",
  "sicily",
  "illyricum"
];

const OMITTED = [
  ["judea-samaria-idumea", "Herod's outline must be cut by Jordan/lake and Josephus lines; this pass does not yet build that cut without guessing unknown anchors."],
  ["galilee-perea", "Same Herodian cut dependency as Judea/Samaria/Idumea."],
  ["philip-tetrarchy-lands", "Same Herodian cut dependency; Abilene also needs Research Lead decision because it is outside Herod's outline."],
  ["syria", "Requires subtracting Cilicia and Herodian/Nabataean/Commagene pieces from the merged Syria face; left out rather than reusing broken cells."],
  ["cilicia", "Requires AD 200 Cilicia/Syria cut from the merged Syria face; left out until the cut is implemented fully in mapshaper."],
  ["cilicia-tracheia", "Requires the Cilicia result split by the Lamus; left out until Cilicia exists."],
  ["thrace", "Requires a straits cut from the Bithynia/Thrace merged face; left out rather than selecting by a box."],
  ["parthian-empire", "Requires east-of-Euphrates remainder of the outside face; left out rather than using a map-edge box."],
  ["armenia", "Requires extracting the Armenian part of the AD 117 extent/outside face; left out rather than using a map-edge box."]
];

const SOURCE_BY_AREA = {
  arabia: ["bib:livius-nabataeans"],
  commagene: ["bib:tacitus-annals", "bib:josephus-jewish-war"],
  cappadocia: ["bib:tacitus-annals", "bib:isbe-galatia"],
  galatia: ["bib:isbe-galatia"],
  pamphylia: ["bib:livius-pamphylia"],
  lycia: ["bib:livius-pamphylia", "bib:strabo-geography"],
  bithynia: ["bib:isbe-bithynia", "bib:isbe-pontus"],
  achaia: ["awmc:roman-empire-ad-69-provinces"],
  macedonia: ["bib:isbe-macedonia", "bib:livius-macedonia"],
  asia: ["bib:isbe-asia"],
  cyprus: ["awmc:roman-empire-ad-69-provinces"],
  "crete-cyrene": ["bib:isbe-crete"],
  egypt: ["bib:tacitus-annals"],
  italy: ["awmc:roman-empire-ad-69-provinces"],
  sicily: ["awmc:roman-empire-ad-69-provinces"],
  illyricum: ["awmc:roman-empire-ad-69-provinces"]
};

function quote(filePath) {
  return `"${filePath.replaceAll("\\", "/")}"`;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function featureCollection(features) {
  return { type: "FeatureCollection", features };
}

function ensureFeatureCollection(geojson) {
  if (geojson.type === "FeatureCollection") return geojson;
  return {
    type: "FeatureCollection",
    features: (geojson.geometries ?? []).map((geometry, index) => ({
      type: "Feature",
      properties: { faceId: `raw-${String(index + 1).padStart(4, "0")}` },
      geometry
    }))
  };
}

function polygonsFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function ringAreaKm2(ring) {
  const radiusKm = 6371.0088;
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index].map((value) => (value * Math.PI) / 180);
    const [lon2, lat2] = ring[index + 1].map((value) => (value * Math.PI) / 180);
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * radiusKm * radiusKm) / 2);
}

function geometryAreaKm2(geometry) {
  return polygonsFromGeometry(geometry).reduce((sum, polygon) => {
    const [outer, ...holes] = polygon;
    return sum + Math.max(0, ringAreaKm2(outer) - holes.reduce((holeSum, ring) => holeSum + ringAreaKm2(ring), 0));
  }, 0);
}

function centroidApprox(geometry) {
  const points = [];
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      points.push(node);
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry.coordinates);
  return [
    points.reduce((sum, point) => sum + point[0], 0) / Math.max(1, points.length),
    points.reduce((sum, point) => sum + point[1], 0) / Math.max(1, points.length)
  ];
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  return polygonsFromGeometry(geometry).some(([outer, ...holes]) => pointInRing(point, outer) && !holes.some((hole) => pointInRing(point, hole)));
}

function distancePointToSegmentKm(point, start, end) {
  const lat = (point[1] * Math.PI) / 180;
  const project = ([lon, pointLat]) => [(lon - point[0]) * 111.32 * Math.cos(lat), (pointLat - point[1]) * 110.574];
  const a = project(start);
  const b = project(end);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, (-(a[0] * dx + a[1] * dy)) / denominator));
  return Math.hypot(a[0] + t * dx, a[1] + t * dy);
}

function distanceToGeometryKm(point, geometry) {
  let minimum = Number.POSITIVE_INFINITY;
  for (const polygon of polygonsFromGeometry(geometry)) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        minimum = Math.min(minimum, distancePointToSegmentKm(point, ring[index - 1], ring[index]));
      }
    }
  }
  return minimum;
}

function namedFace(collection, exactName) {
  const match = collection.features.find((feature) => String(feature.properties.name) === exactName);
  if (!match) throw new Error(`Named face not found: ${exactName}`);
  return match;
}

function roughArea(collection, areaId) {
  const match = collection.features.find((feature) => feature.properties.areaId === areaId);
  if (!match) throw new Error(`Rough area not found: ${areaId}`);
  return match;
}

async function dissolveArea(areaId, sourceFeatures, detail, upstreamIds) {
  const inputPath = path.join(workDirectory, `${areaId}-input.geojson`);
  const outputPath = path.join(workDirectory, `${areaId}-output.geojson`);
  await writeJson(inputPath, featureCollection(sourceFeatures.map((feature) => ({
    type: "Feature",
    properties: { areaId },
    geometry: feature.geometry
  }))));
  await mapshaper.runCommands(`-i ${quote(inputPath)} -dissolve2 areaId -clean -o format=geojson ${quote(outputPath)}`);
  const dissolved = await readJson(outputPath);
  const out = dissolved.features[0];
  out.properties = {
    areaId,
    provenance: {
      dataset: "AWMC geodata",
      version: `commit:${AWMC_COMMIT}`,
      upstreamFeatureIds: upstreamIds,
      changes: [{ kind: "mapshaper-compose", detail, sources: SOURCE_BY_AREA[areaId] }]
    }
  };
  return out;
}

async function clipArea(areaId, sourceFeature, clipFeature, detail, upstreamIds) {
  const sourcePath = path.join(workDirectory, `${areaId}-clip-source.geojson`);
  const clipPath = path.join(workDirectory, `${areaId}-clip-mask.geojson`);
  const outputPath = path.join(workDirectory, `${areaId}-clip-output.geojson`);
  await writeJson(sourcePath, featureCollection([{ type: "Feature", properties: { areaId }, geometry: sourceFeature.geometry }]));
  await writeJson(clipPath, featureCollection([{ type: "Feature", properties: { clip: areaId }, geometry: clipFeature.geometry }]));
  await mapshaper.runCommands(`-i ${quote(sourcePath)} name=source -i ${quote(clipPath)} name=clip -target source -clip clip -clean -o format=geojson ${quote(outputPath)}`);
  const clipped = await readJson(outputPath);
  if ((clipped.features ?? []).length === 0) throw new Error(`Clip produced no geometry for ${areaId}`);
  return dissolveArea(areaId, clipped.features, detail, upstreamIds);
}

function selectItalyRawFaces(ad69Raw) {
  return ad69Raw.features.filter((feature) => {
    const [lon, lat] = centroidApprox(feature.geometry);
    const inItalianPeninsula = lon >= 9 && lon <= 19 && lat >= 38.3 && lat <= 47.2;
    const likelyDalmatia = lon > 14.2 && lat > 42.0;
    return inItalianPeninsula && !likelyDalmatia;
  });
}

async function loadTimelineBranchLocations() {
  const { stdout } = await execFileAsync("git", ["ls-tree", "-r", "--name-only", "data/m4-timeline:data/locations"], {
    cwd: repositoryRoot,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 10
  });
  const files = stdout.split(/\r?\n/).filter((line) => line.endsWith(".json"));
  const records = [];
  for (const file of files) {
    const show = await execFileAsync("git", ["show", `data/m4-timeline:data/locations/${file}`], {
      cwd: repositoryRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 5
    });
    records.push({ file, record: JSON.parse(show.stdout) });
  }
  return records;
}

async function checkPlaces(areaCollection) {
  const rows = [];
  const areaById = new Map(areaCollection.features.map((feature) => [feature.properties.areaId, feature]));
  const records = await loadTimelineBranchLocations();
  for (const { file, record } of records) {
    const checks = [];
    if (record.politicalAreaId && record.candidates?.[0]?.coordinates) checks.push({ areaId: record.politicalAreaId, point: record.candidates[0].coordinates, label: record.id ?? file });
    for (const [index, candidate] of (record.candidates ?? []).entries()) {
      if (candidate.politicalAreaId) checks.push({ areaId: candidate.politicalAreaId, point: candidate.coordinates, label: `${record.id ?? file} candidate ${index}` });
    }
    for (const check of checks) {
      const area = areaById.get(check.areaId);
      if (!area) {
        rows.push(`${check.label}: area ${check.areaId} is not built`);
        continue;
      }
      if (pointInGeometry(check.point, area.geometry)) continue;
      const distanceKm = distanceToGeometryKm(check.point, area.geometry);
      rows.push(`${check.label}: outside ${check.areaId}${distanceKm <= 3 ? `, near border (${distanceKm.toFixed(1)} km)` : ` (${distanceKm.toFixed(1)} km)`}`);
    }
  }
  return rows;
}

function projectPoint([lon, lat], bounds, width, height) {
  return [
    ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width,
    ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height
  ];
}

function svgPathForRing(ring, bounds, width, height) {
  return ring.map((point, index) => {
    const [x, y] = projectPoint(point, bounds, width, height);
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function colorForKey(key) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash << 5) - hash + key.charCodeAt(index);
  return `hsl(${Math.abs(hash) % 360},58%,76%)`;
}

async function writePreview(collection, fileName, bounds) {
  const width = 1800;
  const height = 1050;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#eef3f7"/><rect width="${width}" height="${height}" fill="#f8f1df" opacity="0.85"/>`;
  for (const feature of collection.features) {
    for (const polygon of polygonsFromGeometry(feature.geometry)) {
      svg += `<path d="${svgPathForRing(polygon[0], bounds, width, height)} Z" fill="${colorForKey(feature.properties.areaId)}" stroke="#333" stroke-width="0.8" fill-opacity="0.78"/>`;
    }
  }
  for (const feature of collection.features) {
    const [x, y] = projectPoint(centroidApprox(feature.geometry), bounds, width, height);
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke">${feature.properties.areaId}</text>`;
  }
  svg += "</svg>";
  const outputPath = path.join(reportDirectory, fileName);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

async function writeReport(collection, omitted, placeRows, previewPaths) {
  const lines = ["# M4-03 safe area composition", "", "| Area | km² | Composition | Sources |", "|---|---:|---|---|"];
  for (const feature of collection.features) {
    const change = feature.properties.provenance.changes[0];
    lines.push(`| \`${feature.properties.areaId}\` | ${Math.round(geometryAreaKm2(feature.geometry)).toLocaleString("en-US")} | ${change.detail} | ${change.sources.join("; ")} |`);
  }
  lines.push("", "## Not built", "");
  for (const [areaId, reason] of omitted) lines.push(`- \`${areaId}\`: ${reason}`);
  lines.push("", "## Coverage check", "");
  lines.push("- Full target coverage cannot pass until the omitted areas above are built; no placeholder geometry was emitted.");
  lines.push("- Built-area polygons were generated by mapshaper `-dissolve2`, `-clip`, and `-clean`; repository validation checks them for malformed topology.");
  lines.push("", "## Place check", "");
  if (placeRows.length === 0) lines.push("No mismatches found among built areas.");
  for (const row of placeRows) lines.push(`- ${row}`);
  lines.push("", "## Previews", "");
  for (const previewPath of previewPaths) lines.push(`- ${previewPath}`);
  await fs.writeFile(path.join(reportDirectory, "composition-report.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  await fs.mkdir(workDirectory, { recursive: true });
  await execFileAsync(process.execPath, [path.join(repositoryRoot, "scripts", "report-ancient-partition-prep.mjs")], {
    cwd: repositoryRoot,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20
  });

  const rough = await readJson(outputAreasPath);
  const ad69Named = await readJson(path.join(reportDirectory, "ad69-named-faces.geojson"));
  const ad14Named = await readJson(path.join(reportDirectory, "ad14-named-faces.geojson"));
  const ad69Raw = ensureFeatureCollection(await readJson(path.join(partitionWorkDirectory, "ad69", "land-faces.geojson")));

  const built = [];
  const addDirect = async (areaId, collection, name, layer) => {
    const face = namedFace(collection, name);
    built.push(await dissolveArea(areaId, [face], `${layer.toUpperCase()} face ${face.properties.faceId} (${name}).`, [`awmc:${layer}-face-${face.properties.faceId}`]));
  };

  await addDirect("commagene", ad69Named, "Commagene", "ad69");
  await addDirect("cappadocia", ad14Named, "Armenia Minor / Cappadocia / Pontus Galaticus / Pontus Polemoniacus", "ad14");
  await addDirect("galatia", ad14Named, "Galatia", "ad14");
  await addDirect("pamphylia", ad14Named, "Pamphylia", "ad14");
  await addDirect("lycia", ad14Named, "Lycia", "ad14");
  await addDirect("bithynia", ad14Named, "Bithynia et Pontus / Thracia", "ad14");
  await addDirect("achaia", ad69Named, "Achaia", "ad69");
  await addDirect("macedonia", ad69Named, "Macedonia", "ad69");
  await addDirect("asia", ad69Named, "Asia", "ad69");
  await addDirect("cyprus", ad69Named, "Cyprus", "ad69");
  await addDirect("egypt", ad69Named, "Aegyptus", "ad69");
  await addDirect("sicily", ad69Named, "Sicilia", "ad69");
  await addDirect("illyricum", ad69Named, "Dalmatia", "ad69");

  const crete = namedFace(ad69Named, "Creta");
  const cyrenaica = namedFace(ad69Named, "Cyrenaica");
  built.push(await dissolveArea("crete-cyrene", [crete, cyrenaica], `Union of AD69 faces ${crete.properties.faceId} (Creta) and ${cyrenaica.properties.faceId} (Cyrenaica).`, [`awmc:ad69-face-${crete.properties.faceId}`, `awmc:ad69-face-${cyrenaica.properties.faceId}`]));

  const italyFaces = selectItalyRawFaces(ad69Raw);
  built.push(await dissolveArea("italy", italyFaces, `Union of ${italyFaces.length} AD69 Italian regional raw faces selected by centroid from the Italian peninsula and islands; no replacement geometry added.`, italyFaces.map((_, index) => `awmc:ad69-italy-raw-${index + 1}`)));

  const outside = namedFace(ad69Named, "Armenia / Nabataea / Parthia");
  const arabiaMask = roughArea(rough, "arabia");
  built.push(await clipArea("arabia", outside, arabiaMask, "AD69 outside face clipped by the AWMC/AD200 Arabia-derived province mask from the reproducible builder; no box geometry.", [`awmc:ad69-face-${outside.properties.faceId}`, "awmc:rough-area-arabia"]));

  const collection = featureCollection(AREA_ORDER.map((areaId) => {
    const match = built.find((feature) => feature.properties.areaId === areaId);
    if (!match) throw new Error(`Area was not built but is in output order: ${areaId}`);
    return match;
  }));
  const rawOutputPath = path.join(workDirectory, "ancient-areas-safe-raw.geojson");
  await writeJson(rawOutputPath, collection);
  await mapshaper.runCommands(`-i ${quote(rawOutputPath)} -simplify weighted 8% keep-shapes -clean -o format=geojson ${quote(outputAreasPath)}`);
  const outputCollection = await readJson(outputAreasPath);

  const placeRows = await checkPlaces(outputCollection);
  const previewPaths = [
    await writePreview(outputCollection, "areas-ad50-italy-to-mesopotamia.png", { minLon: 9, minLat: 24, maxLon: 50, maxLat: 48 }),
    await writePreview(outputCollection, "areas-ad50-levant.png", { minLon: 33.8, minLat: 29.2, maxLon: 39.5, maxLat: 34.5 })
  ];
  await writeReport(outputCollection, OMITTED, placeRows, previewPaths);
  console.log(`Wrote ${outputAreasPath} (${outputCollection.features.length} safe areas)`);
  console.log(`Wrote ${path.join(reportDirectory, "composition-report.md")}`);
  for (const previewPath of previewPaths) console.log(`Wrote ${previewPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
