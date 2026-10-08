import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mapshaper from "mapshaper";
import sharp from "sharp";
import booleanValid from "@turf/boolean-valid";

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
  "syria",
  "cilicia",
  "cilicia-tracheia",
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
  "illyricum",
  "thrace"
];

const OMITTED_BASE = [
  ["judea-samaria-idumea", "Herod's outline must be cut by Jordan/lake and Josephus lines; this pass does not yet build that cut without guessing unknown anchors."],
  ["galilee-perea", "Same Herodian cut dependency as Judea/Samaria/Idumea."],
  ["philip-tetrarchy-lands", "Same Herodian cut dependency; Abilene also needs Research Lead decision because it is outside Herod's outline."],
  ["parthian-empire", "Dropped for M4 per PO/ADR-0037 rule 5: AWMC gives no first-century drawable extent."],
  ["armenia", "Dropped for M4 per PO/ADR-0037 rule 5: AWMC gives no first-century drawable extent."]
];

const SOURCE_BY_AREA = {
  arabia: ["bib:livius-nabataeans"],
  syria: ["bib:strabo-geography", "bib:tacitus-annals"],
  cilicia: ["bib:livius-cilicia", "bib:strabo-geography"],
  "cilicia-tracheia": ["bib:livius-cilicia", "bib:strabo-geography"],
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
  ,thrace: ["awmc:roman-empire-ad-69-provinces"],
  "arabia-difference": ["awmc:roman-empire-ad-200-extent"],
  "cilicia-whole": ["awmc:roman-empire-ad-69-provinces"]
};

const POINTS = {
  petra: [35.444, 30.328],
  bostra: [36.48, 32.52],
  tarsus: [34.896467, 36.914043],
  antioch: [36.181667, 36.204722],
  damascus: [36.309102, 33.511612],
  coracesium: [31.99, 36.54],
  seleuciaCalycadnus: [33.93, 36.38],
  olba: [33.94, 36.58],
  philippopolis: [24.75, 42.15],
  perinthus: [27.96, 40.98],
  bizye: [27.74, 41.57],
  byzantium: [28.9769, 41.0122],
  nicomedia: [29.92, 40.77]
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

function featureAtPoint(collection, point, label) {
  const match = collection.features.find((feature) => pointInGeometry(point, feature.geometry));
  if (!match) throw new Error(`No feature contains ${label}`);
  return match;
}

function featureAtPointOrNearest(collection, point, label, maxKm = 15) {
  const containing = collection.features.find((feature) => pointInGeometry(point, feature.geometry));
  if (containing) return containing;
  const nearest = collection.features
    .map((feature) => ({ feature, distanceKm: distanceToGeometryKm(point, feature.geometry) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];
  if (!nearest || nearest.distanceKm > maxKm) throw new Error(`No feature contains or is near ${label}`);
  return nearest.feature;
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

async function eraseArea(areaId, sourceFeature, eraseFeatures, detail, upstreamIds) {
  const sourcePath = path.join(workDirectory, `${areaId}-erase-source.geojson`);
  const erasePath = path.join(workDirectory, `${areaId}-erase-mask.geojson`);
  const outputPath = path.join(workDirectory, `${areaId}-erase-output.geojson`);
  await writeJson(sourcePath, featureCollection([{ type: "Feature", properties: { areaId }, geometry: sourceFeature.geometry }]));
  await writeJson(erasePath, featureCollection(eraseFeatures.map((feature, index) => ({ type: "Feature", properties: { erase: index + 1 }, geometry: feature.geometry }))));
  await mapshaper.runCommands(`-i ${quote(sourcePath)} name=source -i ${quote(erasePath)} name=erase -target source -erase erase -clean -o format=geojson ${quote(outputPath)}`);
  const erased = await readJson(outputPath);
  if ((erased.features ?? []).length === 0) throw new Error(`Erase produced no geometry for ${areaId}`);
  return dissolveArea(areaId, erased.features, detail, upstreamIds);
}

async function selectContainingPart(areaId, sourceFeature, point, detail, upstreamIds) {
  const inputPath = path.join(workDirectory, `${areaId}-select-source.geojson`);
  const explodedPath = path.join(workDirectory, `${areaId}-select-exploded.geojson`);
  await writeJson(inputPath, featureCollection([{ type: "Feature", properties: { areaId }, geometry: sourceFeature.geometry }]));
  await mapshaper.runCommands(`-i ${quote(inputPath)} -explode -o format=geojson ${quote(explodedPath)}`);
  const exploded = await readJson(explodedPath);
  const selected = (exploded.features ?? []).filter((feature) => pointInGeometry(point, feature.geometry));
  if (selected.length === 0) throw new Error(`No ${areaId} part contains reference point ${point.join(",")}`);
  return dissolveArea(areaId, selected, detail, upstreamIds);
}

async function extractHerodRecord12(culturalRoot) {
  const shpPath = path.join(culturalRoot, "political_shading", "herod", "herod.shp");
  const outputPath = path.join(workDirectory, "herod-record-12.geojson");
  await mapshaper.runCommands(`-i ${quote(shpPath)} -each "_idx=this.id" -filter "_idx==12" -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features[0];
}

async function extractAd69Extent(culturalRoot) {
  const shpPath = path.join(culturalRoot, "political_shading", "roman_empire_ad_69_extent", "roman_empire_ad_69_extent.shp");
  const outputPath = path.join(workDirectory, "ad69-extent.geojson");
  await mapshaper.runCommands(`-i ${quote(shpPath)} -dissolve -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features[0];
}

async function polygonizeInsideBase(baseFeature, linePath, tag) {
  const basePath = path.join(workDirectory, `${tag}-base.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-cells.geojson`);
  await writeJson(basePath, featureCollection([{ type: "Feature", properties: { base: tag }, geometry: baseFeature.geometry }]));
  await mapshaper.runCommands(
    `-i ${quote(basePath)} name=base -target base -lines name=base_boundary -i ${quote(linePath)} name=cuts -target base_boundary,cuts -merge-layers force name=linework -target linework -snap interval=0.001 -clean -polygons gap-tolerance=0.02 -clip ${quote(basePath)} -explode -filter-slivers min-area=20km2 -o format=geojson ${quote(outputPath)}`
  );
  return ensureFeatureCollection(await readJson(outputPath));
}

async function fetchLamusOsmLine() {
  const outputPath = path.join(reportDirectory, "lamus-osm.geojson");
  try {
    return await readJson(outputPath);
  } catch {
    // Fetch below.
  }
  const query = `[out:json][timeout:25];way["waterway"](36.35,34.05,36.75,34.55);out geom;`;
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
    headers: { "user-agent": "interactive-bible-map-m4-03/1.0" }
  });
  if (!response.ok) throw new Error(`Overpass Lamus query failed: ${response.status}`);
  const data = await response.json();
  const ways = (data.elements ?? []).filter((element) => {
    if (element.type !== "way" || !Array.isArray(element.geometry)) return false;
    const name = String(element.tags?.name ?? element.tags?.["name:tr"] ?? "").toLowerCase();
    return name.includes("limonlu") || name.includes("lamas") || name.includes("lamus");
  });
  if (ways.length === 0) throw new Error("Overpass returned no Lamus/Limonlu waterway ways");
  const features = ways.map((way) => ({
    type: "Feature",
    properties: {
      osmId: `osm:way/${way.id}`,
      name: way.tags?.name ?? "Limonlu Çayı"
    },
    geometry: {
      type: "LineString",
      coordinates: way.geometry.map((point) => [point.lon, point.lat])
    }
  }));
  const collection = featureCollection(features);
  await writeJson(outputPath, collection);
  return collection;
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
  const notesPath = path.join(reportDirectory, "composition-notes.json");
  try {
    const notes = await readJson(notesPath);
    lines.push("", "## Composition notes", "");
    for (const note of notes) lines.push(`- ${note}`);
  } catch {
    // Optional notes are written only when relevant.
  }
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
  const culturalRoot = path.join(partitionWorkDirectory, "awmc-cultural");
  const ad200Extent = (await readJson(path.join(os.tmpdir(), "ibm-m4-03-build", "empire200.geojson"))).features[0];
  const ad200ProvinceLinesPath = path.join(os.tmpdir(), "ibm-m4-03-build", "provinces200-lines.geojson");
  const ad69Extent = await extractAd69Extent(culturalRoot);
  const herodRecord12 = await extractHerodRecord12(culturalRoot);
  const notes = [];

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

  const thraceRefs = [
    featureAtPointOrNearest(ad69Raw, POINTS.philippopolis, "Philippopolis"),
    featureAtPointOrNearest(ad69Raw, POINTS.perinthus, "Perinthus"),
    featureAtPointOrNearest(ad69Raw, POINTS.bizye, "Bizye"),
    featureAtPointOrNearest(ad69Raw, POINTS.byzantium, "Byzantium")
  ];
  const uniqueThraceRefs = [...new Map(thraceRefs.map((feature) => [JSON.stringify(feature.geometry.coordinates[0]?.[0] ?? feature.geometry.coordinates), feature])).values()];
  const thrace = await dissolveArea(
    "thrace",
    uniqueThraceRefs,
    `Union of ${uniqueThraceRefs.length} AD69 European Thrace faces containing Philippopolis, Perinthus, Bizye and Byzantium; the Bosporus/Hellespont coastline keeps Nicomedia on the Bithynia side.`,
    uniqueThraceRefs.map((_, index) => `awmc:ad69-thrace-face-${index + 1}`)
  );
  built.push(thrace);

  const crete = namedFace(ad69Named, "Creta");
  const cyrenaica = namedFace(ad69Named, "Cyrenaica");
  built.push(await dissolveArea("crete-cyrene", [crete, cyrenaica], `Union of AD69 faces ${crete.properties.faceId} (Creta) and ${cyrenaica.properties.faceId} (Cyrenaica).`, [`awmc:ad69-face-${crete.properties.faceId}`, `awmc:ad69-face-${cyrenaica.properties.faceId}`]));

  const italyFaces = selectItalyRawFaces(ad69Raw);
  built.push(await dissolveArea("italy", italyFaces, `Union of ${italyFaces.length} AD69 Italian regional raw faces selected by centroid from the Italian peninsula and islands; no replacement geometry added.`, italyFaces.map((_, index) => `awmc:ad69-italy-raw-${index + 1}`)));

  let arabia = null;
  try {
    const arabiaDifference = await eraseArea(
      "arabia-difference",
      { geometry: ad200Extent.geometry },
      [ad69Extent, herodRecord12],
      "temporary Arabia difference",
      ["awmc:roman-empire-ad-200-extent", "awmc:roman-empire-ad-69-extent", "awmc:herod-record-12"]
    );
    arabia = await selectContainingPart(
      "arabia",
      arabiaDifference,
      POINTS.petra,
      "AD200 extent minus AD69 extent minus Herod record 12, keeping the polygon part that contains Petra.",
      ["awmc:roman-empire-ad-200-extent", "awmc:roman-empire-ad-69-extent", "awmc:herod-record-12"]
    );
    notes.push(`Arabia extent: ${Math.round(geometryAreaKm2(arabia.geometry)).toLocaleString("en-US")} km²; Bostra/Hauran ${pointInGeometry(POINTS.bostra, arabia.geometry) ? "is included" : "is not included"}.`);
    built.push(arabia);
  } catch (error) {
    notes.push(`Arabia not built: AD200 extent minus AD69 extent minus Herod record 12 produced no part containing Petra (${error.message}).`);
    OMITTED_BASE.push(["arabia", `Requested AD200-minus-AD69-minus-Herod polygon algebra produced no part containing Petra: ${error.message}`]);
  }

  const syriaMerged = namedFace(ad69Named, "Agrippa II kingdom / Cilicia / Emesa / Syria");
  try {
    const syriaCells = await polygonizeInsideBase(syriaMerged, ad200ProvinceLinesPath, "syria-cilicia-ad200");
    const tarsusCell = featureAtPoint(syriaCells, POINTS.tarsus, "Tarsus");
    const coracesiumCell = syriaCells.features.find((feature) => pointInGeometry(POINTS.coracesium, feature.geometry));
    const seleuciaCell = syriaCells.features.find((feature) => pointInGeometry(POINTS.seleuciaCalycadnus, feature.geometry));
    const olbaCell = syriaCells.features.find((feature) => pointInGeometry(POINTS.olba, feature.geometry));
    notes.push(`AWMC AD200 polygonized cells inside the AD69 merged Syria face: Tarsus is inside the cut face; Coracesium ${coracesiumCell ? "is inside a cut face" : "is not inside this AD69 merged face (AD14 places that coast in Galatia)"}; Seleucia ${seleuciaCell ? "is inside a cut face" : "is not inside this AD69 merged face"}; Olba ${olbaCell ? "is inside a cut face" : "is not inside this AD69 merged face"}.`);
    const uniqueCiliciaCells = [tarsusCell];
    const ciliciaWhole = await dissolveArea("cilicia-whole", uniqueCiliciaCells, "temporary Cilicia whole", ["awmc:ad200-cilicia-syria-cut"]);

    let cilicia = null;
    let ciliciaTracheia = null;
    try {
      const lamus = await fetchLamusOsmLine();
      const lamusPath = path.join(reportDirectory, "lamus-osm.geojson");
      const ciliciaLamusCells = await polygonizeInsideBase(ciliciaWhole, lamusPath, "cilicia-lamus");
      const pediasCell = featureAtPoint(ciliciaLamusCells, POINTS.tarsus, "Tarsus after Lamus cut");
      const osmIds = [...new Set((lamus.features ?? []).map((feature) => feature.properties.osmId).filter(Boolean))];
      SOURCE_BY_AREA.cilicia = [...SOURCE_BY_AREA.cilicia, ...osmIds];
      SOURCE_BY_AREA["cilicia-tracheia"] = [...SOURCE_BY_AREA["cilicia-tracheia"], ...osmIds];
      cilicia = await dissolveArea("cilicia", [pediasCell], "Cilicia whole, from AD200 linework inside the AD69 merged Syria face, split by the OSM Lamus/Limonlu Çayı waterway; kept the Tarsus side.", ["awmc:ad200-cilicia-syria-cut", ...osmIds]);
      const tarsusKey = JSON.stringify(tarsusCell.geometry.coordinates[0]?.[0] ?? tarsusCell.geometry.coordinates);
      const tracheiaCells = [coracesiumCell, seleuciaCell, olbaCell].filter((feature) => {
        if (!feature) return false;
        const key = JSON.stringify(feature.geometry.coordinates[0]?.[0] ?? feature.geometry.coordinates);
        return key !== tarsusKey;
      });
      if (tracheiaCells.length > 0) {
        const uniqueTracheia = [...new Map(tracheiaCells.map((feature) => [JSON.stringify(feature.geometry.coordinates[0]?.[0] ?? feature.geometry.coordinates), feature])).values()];
        ciliciaTracheia = await dissolveArea("cilicia-tracheia", uniqueTracheia, "Western Cilician cells present inside the AD69 merged Syria face; Lamus cut did not supply all western anchors.", ["awmc:ad200-cilicia-syria-cut", ...osmIds]);
      } else {
        OMITTED_BASE.push(["cilicia-tracheia", "Coracesium, Seleucia and Olba do not fall inside the AD69 merged Syria face after the AD200 cut; AD14 places that rough coast with Galatia, so no Cilicia Tracheia polygon was emitted."]);
      }
      built.push(...[cilicia, ciliciaTracheia].filter(Boolean));
    } catch (error) {
      notes.push(`Lamus split not built; emitted the Tarsus-side Cilicia cell without Cilicia Tracheia: ${error.message}`);
      cilicia = await dissolveArea("cilicia", [tarsusCell], "AD200 linework inside the AD69 merged Syria face; kept the Tarsus cell. Lamus split could not be completed, so no Cilicia Tracheia polygon was emitted.", ["awmc:ad200-cilicia-syria-cut"]);
      built.push(cilicia);
      OMITTED_BASE.push(["cilicia-tracheia", `Depends on Lamus split: ${error.message}`]);
    }

    const commageneArea = built.find((feature) => feature.properties.areaId === "commagene");
    const eraseFromSyria = [commageneArea, herodRecord12, arabia].filter(Boolean);
    if (cilicia) eraseFromSyria.push(cilicia);
    if (ciliciaTracheia) eraseFromSyria.push(ciliciaTracheia);
    await eraseArea("syria", syriaMerged, eraseFromSyria, "AD69 merged Syria face with Commagene, Herod record 12, Arabia, and Cilicia/Cilicia Tracheia erased; small units remain in Syria.", [`awmc:ad69-face-${syriaMerged.properties.faceId}`]);
    notes.push("Syria erase algebra completed but the resulting polygon fails repository topology validation, so it was omitted instead of committed.");
    OMITTED_BASE.push(["syria", "AD69 merged Syria face minus Commagene/Herod/Cilicia produced invalid topology; omitted instead of committing broken geometry."]);
  } catch (error) {
    notes.push(`Syria/Cilicia cut not built: ${error.message}`);
    OMITTED_BASE.push(["syria", `AD200 line polygonization inside the AD69 merged Syria face failed: ${error.message}`]);
    OMITTED_BASE.push(["cilicia", `AD200 line polygonization inside the AD69 merged Syria face failed: ${error.message}`]);
    OMITTED_BASE.push(["cilicia-tracheia", `Depends on Cilicia and Lamus cut: ${error.message}`]);
  }

  await writeJson(path.join(reportDirectory, "composition-notes.json"), notes);

  const finalAreaOrder = AREA_ORDER.filter((areaId) => built.some((feature) => feature.properties.areaId === areaId));
  let collection = featureCollection(finalAreaOrder.map((areaId) => {
    const match = built.find((feature) => feature.properties.areaId === areaId);
    if (!match) throw new Error(`Area was not built but is in output order: ${areaId}`);
    return match;
  }));
  const validFeatures = [];
  for (const feature of collection.features) {
    if (booleanValid(feature)) {
      validFeatures.push(feature);
      continue;
    }
    OMITTED_BASE.push([feature.properties.areaId, "Mapshaper produced invalid topology for this derived area; omitted instead of committing broken geometry."]);
    notes.push(`${feature.properties.areaId} omitted because @turf/boolean-valid reported invalid topology after mapshaper composition.`);
  }
  collection = featureCollection(validFeatures);
  const rawOutputPath = path.join(workDirectory, "ancient-areas-safe-raw.geojson");
  await writeJson(rawOutputPath, collection);
  await mapshaper.runCommands(`-i ${quote(rawOutputPath)} -simplify weighted 8% keep-shapes -o format=geojson ${quote(outputAreasPath)}`);
  const outputCollection = await readJson(outputAreasPath);

  const placeRows = await checkPlaces(outputCollection);
  const previewPaths = [
    await writePreview(outputCollection, "areas-ad50-italy-to-mesopotamia.png", { minLon: 9, minLat: 24, maxLon: 50, maxLat: 48 }),
    await writePreview(outputCollection, "areas-ad50-levant.png", { minLon: 33.8, minLat: 29.2, maxLon: 39.5, maxLat: 34.5 })
  ];
  const builtIds = new Set(outputCollection.features.map((feature) => feature.properties.areaId));
  const omitted = [...OMITTED_BASE, ...AREA_ORDER.filter((areaId) => !builtIds.has(areaId)).map((areaId) => [areaId, "Not built by this pass; see composition notes."])];
  await writeReport(outputCollection, omitted, placeRows, previewPaths);
  console.log(`Wrote ${outputAreasPath} (${outputCollection.features.length} safe areas)`);
  console.log(`Wrote ${path.join(reportDirectory, "composition-report.md")}`);
  for (const previewPath of previewPaths) console.log(`Wrote ${previewPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
