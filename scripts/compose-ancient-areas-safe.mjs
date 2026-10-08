// Composes data/geo/ancient-areas.geojson from AWMC faces, cut lines and OpenStreetMap rivers.
// Run through `npm run build:ancient-geo` (after scripts/build-ancient-geo.mjs). It writes the report
// %TEMP%/ibm-m4-03b/composition-report.md and PNG previews in %TEMP%/ibm-m4-03c/.
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mapshaper from "mapshaper";
import booleanValid from "@turf/boolean-valid";
import {
  assembleWayChains,
  distanceKm,
  extendLineEnd,
  fetchOsmRelationFull,
  orientFrom,
  relationMainStreamWays
} from "./lib/osm-waterways.mjs";
import { cleanPolygonGeometry, geometryAreaKm2, polygonFromLineAndFrame, polygonsOf } from "./lib/geometry-cleanup.mjs";
import {
  coverageRows,
  distancePointToSegmentKm,
  distanceToGeometryKm,
  labelPoint,
  overlapRows,
  placeRows,
  pointInGeometry,
  validityRows,
  writePreviewPng
} from "./lib/ancient-area-checks.mjs";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const reportDirectory = path.join(os.tmpdir(), "ibm-m4-03b");
const previewDirectory = path.join(os.tmpdir(), "ibm-m4-03c");
const workDirectory = path.join(os.tmpdir(), "ibm-m4-03b-compose");
const partitionWorkDirectory = path.join(os.tmpdir(), "ibm-m4-03b-work");
const buildWorkDirectory = path.join(os.tmpdir(), "ibm-m4-03-build");
const osmCacheDirectory = path.join(os.tmpdir(), "ibm-m4-03-osm");
const outputAreasPath = path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson");
const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
const NATURAL_EARTH_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const TIMELINE_BRANCH = "data/m4-timeline";

// Parts smaller than this are slivers left where two datasets' lines nearly coincide.
const MIN_PART_KM2 = 1;
// Coverage gaps up to this size are reported only as a count.
const COVERAGE_TOLERANCE_KM2 = 5;
// Douglas-Peucker tolerances for the written file: no vertex moves more than this many metres. The
// Herodian areas follow the meandering Jordan, with sites on its banks (the two Bethany candidates are
// 360 m apart, one of them a few metres from the river), so they keep a fine tolerance.
const FINE_SIMPLIFY_AREAS = ["judea-samaria-idumea", "galilee-perea", "philip-tetrarchy-lands"];
const FINE_SIMPLIFY_METRES = 25;
const COARSE_SIMPLIFY_METRES = 600;
// Coordinates are written to 5 decimals (about 1 m), the precision the app's build uses.
const OUTPUT_PRECISION = 0.00001;

const AREA_ORDER = [
  "judea-samaria-idumea",
  "galilee-perea",
  "philip-tetrarchy-lands",
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

const OMITTED_BY_RULING = [
  ["parthian-empire", "Dropped for M4 per PO/ADR-0037 rule 5: AWMC gives no first-century drawable extent."],
  ["armenia", "Dropped for M4 per PO/ADR-0037 rule 5: AWMC gives no first-century drawable extent."]
];

const SOURCE_BY_AREA = {
  arabia: ["bib:livius-nabataeans", "awmc:roman-empire-ad-200-extent", "awmc:roman-empire-ad-69-extent"],
  syria: ["bib:strabo-geography", "bib:tacitus-annals", "bib:josephus-antiquities", "awmc:roman-empire-ad-69-provinces"],
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
  italy: ["awmc:italy-shading", "awmc:roman-empire-ad-69-provinces"],
  sicily: ["awmc:roman-empire-ad-69-provinces"],
  illyricum: ["awmc:roman-empire-ad-69-provinces"],
  thrace: ["awmc:roman-empire-ad-69-provinces"],
  "judea-samaria-idumea": ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378"],
  "galilee-perea": ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378", "pleiades:678326", "pleiades:697728"],
  "philip-tetrarchy-lands": ["bib:josephus-jewish-war"]
};

const POINTS = {
  petra: [35.444, 30.328],
  bostra: [36.48, 32.52],
  stCatherine: [33.975, 28.556],
  tarsus: [34.896467, 36.914043],
  anazarbus: [35.9, 37.26],
  soli: [34.55, 36.74],
  antioch: [36.181667, 36.204722],
  damascus: [36.309102, 33.511612],
  emesa: [36.72, 34.73],
  coracesium: [31.99, 36.54],
  seleuciaCalycadnus: [33.93, 36.38],
  olba: [33.94, 36.58],
  corycus: [34.155, 36.464],
  elaeussa: [34.17, 36.48],
  laranda: [33.22, 37.18],
  lamusMouth: [34.26, 36.56],
  philippopolis: [24.75, 42.15],
  perinthus: [27.96, 40.98],
  bizye: [27.74, 41.57],
  byzantium: [28.9769, 41.0122],
  nicomedia: [29.92, 40.77],
  malta: [14.4, 35.9],
  patmos: [26.5417, 37.325],
  samos: [26.98, 37.75],
  chios: [26.14, 38.37],
  lesbos: [26.36, 39.11],
  cos: [27.29, 36.89],
  rhodes: [28.22, 36.18],
  nicopolis: [20.75, 39.02],
  rome: [12.4913, 41.89]
};

const HEROD_ANCHORS = {
  mountCarmel: [35.02, 32.67],
  gineaJenin: [35.3, 32.46],
  scythopolis: [35.5, 32.5],
  pella: [35.62, 32.45],
  philadelphia: [35.93, 31.95],
  jerusalem: [35.234156, 31.776679],
  nazareth: [35.303, 32.699],
  capernaum: [35.575, 32.8811],
  machaerus: [35.6233, 31.5658],
  caesareaPhilippi: [35.693333, 33.246111],
  bethsaida: [35.6305, 32.91],
  hippos: [35.65, 32.78],
  gadara: [35.6858, 32.6556],
  qasrAlYahud: [35.5465, 31.8371],
  alMaghtas: [35.5503, 31.8372]
};

// Cut lines between named anchors (approximate: straight segments where no path is described).
// The rift runs north to south: a straight connector north of the Jordan's source, then the Jordan
// (OpenStreetMap), median lines across the Sea of Galilee and the Dead Sea, and the Arabah.
// Straight connector north of the Jordan's source; its first point lies outside Herod's outline.
const RIFT_NORTH_CONNECTOR = [[35.65, 33.45], [35.65, 33.35]];
const SEA_OF_GALILEE_MEDIAN = [[35.58, 32.82], [35.58, 32.72]];
const DEAD_SEA_MEDIAN_AND_ARABAH = [[35.5, 31.72], [35.5, 31.2], [35.48, 30.75], [35.18, 30.15]];
const GALILEE_SAMARIA_LINE = [[34.65, 32.86], HEROD_ANCHORS.mountCarmel, HEROD_ANCHORS.gineaJenin, HEROD_ANCHORS.scythopolis, [35.63, 32.5]];
const PELLA_LINE = [HEROD_ANCHORS.scythopolis, HEROD_ANCHORS.pella, HEROD_ANCHORS.philadelphia, [36.15, 31.62]];

// OpenStreetMap waterway relations (© OpenStreetMap contributors, ODbL 1.0).
const OSM_RIVERS = {
  jordan: { relationId: 2246907, label: "Jordan", throughSeaOfGalileeWayId: 1421105372 },
  yarmuk: { relationId: 1355013, label: "Yarmuk" },
  lamus: { relationId: 15952690, label: "Lamus (Limonlu Çayı)" }
};
const LAMUS_SEA_EXTENSION_KM = 5;
const LAMUS_NORTH_EXTENSION_LATITUDE = 37.55;

// Points inside AD 69 provinces that M4-02's area list leaves out; used to label coverage gaps.
const OUTSIDE_LIST_PROBES = [
  ["Pannonia", [[16.37, 45.48], [19.61, 44.98], [15.87, 46.42], [16.62, 47.23], [18.9, 47.4]]],
  ["Moesia", [[21.9, 43.32], [21.21, 44.74], [24.47, 43.7], [27.27, 44.12], [25.39, 43.61], [28.65, 44.17]]],
  ["Noricum", [[14.37, 46.7], [15.26, 46.23], [13.04, 47.8]]],
  ["Raetia", [[9.74, 47.5], [9.53, 46.85], [10.31, 47.73], [11.4, 47.27]]],
  ["Africa Proconsularis", [[10.32, 36.85], [10.64, 35.83], [10.71, 35.3], [14.29, 32.64], [12.48, 32.8], [13.18, 32.89], [10.1, 33.88], [9.5, 35.5], [11.0, 31.0], [10.91, 33.8]]],
  ["Sardinia et Corsica", [[9.11, 39.22], [9.5, 40.92], [9.51, 42.11]]],
  ["Alpine provinces", [[9.1, 46.2], [9.6, 46.4]]]
];

// Names for the island (and cut-off peninsula) faces that no area holds, so the coverage report can be
// read without a map. Each point lies inside the named land.
const ISLAND_NAMES = [
  ["Euboea", [23.78, 38.55]], ["Cephallenia", [20.59, 38.19]], ["Corcyra (Corfu)", [19.77, 39.72]], ["Lemnos", [25.14, 39.93]],
  ["Naxos", [25.48, 37.05]], ["Brattia (Brač)", [16.62, 43.32]], ["Curicta (Krk)", [14.58, 45.1]], ["Thasos", [24.67, 40.69]],
  ["Acte (the Athos peninsula, cut off in the partition)", [24.03, 40.35]], ["Andros", [24.88, 37.85]], ["Zacynthus", [20.79, 37.77]],
  ["Pallene (the Kassandra peninsula, cut off in the partition)", [23.43, 40.02]], ["Crexa (Cres)", [14.4, 44.85]], ["Leucas", [20.65, 38.73]],
  ["Cythera", [22.99, 36.24]], ["Imbros", [25.82, 40.16]], ["Icaria", [26.08, 37.59]], ["Carpathos", [27.16, 35.55]],
  ["the Cnidian peninsula (Datça, cut off in the partition)", [27.62, 36.72]], ["Paros", [25.2, 37.06]], ["Scyros", [24.52, 38.9]],
  ["Tenos", [25.18, 37.59]], ["Samothrace", [25.58, 40.46]], ["Ceos", [24.32, 37.62]]
];

function quote(filePath) {
  return `"${filePath.replaceAll("\\", "/")}"`;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function featureCollection(features) {
  return { type: "FeatureCollection", features };
}

function geometryFeature(geometry, properties = {}) {
  return { type: "Feature", properties, geometry };
}

function ensureFeatureCollection(geojson) {
  if (geojson.type === "FeatureCollection") return geojson;
  return featureCollection((geojson.geometries ?? []).map((geometry, index) => geometryFeature(geometry, { faceId: `raw-${String(index + 1).padStart(4, "0")}` })));
}

function rounded(value, digits = 0) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function bboxOf(geometry) {
  let box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const polygon of polygonsOf(geometry)) {
    for (const [lon, lat] of polygon[0]) box = [Math.min(box[0], lon), Math.min(box[1], lat), Math.max(box[2], lon), Math.max(box[3], lat)];
  }
  return box;
}

function namedFace(collection, exactName) {
  const match = collection.features.find((feature) => String(feature.properties.name) === exactName);
  if (!match) throw new Error(`Named face not found: ${exactName}`);
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

function optionalFeatureAtPointOrNearest(collection, point, label, notes, maxKm = 15) {
  try {
    return featureAtPointOrNearest(collection, point, label, maxKm);
  } catch (error) {
    notes.push(`${label} was not added: ${error.message}.`);
    return null;
  }
}

// Province-cell index ids ("f0228") are only stable for one build of the AD 200 cells, so cells are
// found by a point they contain and the id is reported.
function cellAtPoint(cells, point, label) {
  const index = cells.features.findIndex((feature) => pointInGeometry(point, feature.geometry));
  if (index < 0) throw new Error(`No AD 200 cell contains ${label}`);
  return { feature: cells.features[index], cellId: `f${String(index + 1).padStart(4, "0")}` };
}

// Every area is AWMC linework cut to Natural Earth land; areas cut along rivers also use OpenStreetMap.
function provenance(upstreamIds, detail, areaId, extraChanges = []) {
  const changes = [{ kind: "mapshaper-compose", detail, sources: SOURCE_BY_AREA[areaId] }, ...extraChanges];
  const usesOsm = [...upstreamIds, ...changes.flatMap((change) => change.sources)].some((id) => id.startsWith("osm:"));
  return {
    dataset: usesOsm ? "AWMC geodata; Natural Earth; OpenStreetMap" : "AWMC geodata; Natural Earth",
    version: `commit:${AWMC_COMMIT}; naturalearth-commit:${NATURAL_EARTH_COMMIT}${usesOsm ? "; osm: current ways via the OSM API (ids and versions in the composition report)" : ""}`,
    upstreamFeatureIds: upstreamIds,
    changes
  };
}

async function removeIfExists(filePath) {
  await fs.rm(filePath, { force: true });
}

// mapshaper clip/erase of `subject` by the union of `mask`; returns the output features (possibly none).
async function booleanOp(tag, operation, subjectFeatures, maskFeatures) {
  const subjectPath = path.join(workDirectory, `${tag}-${operation}-subject.geojson`);
  const maskPath = path.join(workDirectory, `${tag}-${operation}-mask.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-${operation}-output.geojson`);
  await removeIfExists(outputPath);
  await writeJson(subjectPath, featureCollection(subjectFeatures.map((feature) => geometryFeature(feature.geometry))));
  await writeJson(maskPath, featureCollection(maskFeatures.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(`-i ${quote(subjectPath)} name=subject -i ${quote(maskPath)} name=mask -target subject -${operation} mask -o format=geojson ${quote(outputPath)}`);
  try {
    return ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry);
  } catch {
    return [];
  }
}

// Unions features into one feature (dissolve2 also merges overlapping input).
async function unionFeatures(tag, features) {
  const inputPath = path.join(workDirectory, `${tag}-union-input.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-union-output.geojson`);
  await removeIfExists(outputPath);
  await writeJson(inputPath, featureCollection(features.map((feature) => geometryFeature(feature.geometry, { group: 1 }))));
  await mapshaper.runCommands(`-i ${quote(inputPath)} -dissolve2 group -o format=geojson ${quote(outputPath)}`);
  const output = ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry);
  if (output.length !== 1) throw new Error(`Union ${tag} produced ${output.length} features`);
  return output[0];
}

async function explodeFeatures(tag, features) {
  const inputPath = path.join(workDirectory, `${tag}-explode-input.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-explode-output.geojson`);
  await removeIfExists(outputPath);
  await writeJson(inputPath, featureCollection(features.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(`-i ${quote(inputPath)} -explode -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry);
}

// Builds an area feature from pieces: union, then the clean-up every area gets (repeated vertices,
// degenerate rings and parts under MIN_PART_KM2 removed), then a validity check.
async function finishArea(areaId, pieces, detail, upstreamIds, notes, extraChanges = []) {
  const union = await unionFeatures(areaId, pieces);
  const { geometry, dropped } = cleanPolygonGeometry(union.geometry, { minPartKm2: MIN_PART_KM2 });
  if (!geometry) throw new Error(`${areaId}: nothing left after clean-up`);
  if (dropped.smallParts > 0 || dropped.degenerateRings > 0) {
    notes.push(`${areaId}: clean-up removed ${dropped.smallParts} part(s) under ${MIN_PART_KM2} km² (${rounded(dropped.smallPartsKm2, 2)} km² in all) and ${dropped.degenerateRings} degenerate ring(s).`);
  }
  const feature = geometryFeature(geometry, { areaId, provenance: provenance(upstreamIds, detail, areaId, extraChanges) });
  if (!booleanValid(feature)) throw new Error(`${areaId}: geometry is invalid after composition`);
  return feature;
}

async function extractShapefileFeature(shapefilePath, outputName, commands = "") {
  const outputPath = path.join(workDirectory, outputName);
  await removeIfExists(outputPath);
  await mapshaper.runCommands(`-i ${quote(shapefilePath)} ${commands} -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features;
}

async function clippedHerodOutline(herodRecord12, landMaskPath) {
  const herodPath = path.join(workDirectory, "herod-record-12-source.geojson");
  const outputPath = path.join(workDirectory, "herod-record-12-land.geojson");
  await removeIfExists(outputPath);
  await writeJson(herodPath, featureCollection([herodRecord12]));
  await mapshaper.runCommands(`-i ${quote(herodPath)} name=herod -clip ${quote(landMaskPath)} -clean -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features[0];
}

async function loadRiver(key) {
  const river = OSM_RIVERS[key];
  const relation = await fetchOsmRelationFull(river.relationId, osmCacheDirectory);
  const excluded = river.throughSeaOfGalileeWayId ? [river.throughSeaOfGalileeWayId] : [];
  const ways = relationMainStreamWays(relation, { excludeWayIds: excluded });
  const chains = assembleWayChains(ways).filter((chain) => chain.coordinates.length >= 10);
  return { ...river, ways, chains };
}

// Ways actually drawn: the assembled main-stream chains (stray short pieces such as culverts are left out).
function usedWays(river) {
  const used = new Set(river.chains.flatMap((chain) => chain.wayIds));
  return river.ways.filter((way) => used.has(way.id));
}

function osmWayIds(river) {
  return usedWays(river).map((way) => `osm:way/${way.id}`);
}

function osmWayVersions(river) {
  return usedWays(river).map((way) => `${way.id} (v${way.version})`).join(", ");
}

// The Jordan relation's main stream, with its course through the Sea of Galilee removed, gives two
// chains: the upper Jordan (source to lake) and the lower Jordan (lake to Dead Sea).
function buildRiftLine(jordan) {
  if (jordan.chains.length !== 2) throw new Error(`Expected the upper and lower Jordan as two chains, got ${jordan.chains.length}`);
  const [upperChain, lowerChain] = [...jordan.chains].sort((left, right) => Math.max(...right.coordinates.map((point) => point[1])) - Math.max(...left.coordinates.map((point) => point[1])));
  const upper = orientFrom(upperChain.coordinates, RIFT_NORTH_CONNECTOR.at(-1));
  const lower = orientFrom(lowerChain.coordinates, SEA_OF_GALILEE_MEDIAN.at(-1));
  if (upper.at(-1)[1] > 32.92 || upper.at(-1)[1] < 32.86) throw new Error(`Upper Jordan does not end at the Sea of Galilee (${upper.at(-1).join(",")})`);
  if (lower[0][1] > 32.74 || lower.at(-1)[1] > 31.8) throw new Error("Lower Jordan does not run from the Sea of Galilee to the Dead Sea");
  return {
    coordinates: [...RIFT_NORTH_CONNECTOR, ...upper, ...SEA_OF_GALILEE_MEDIAN, ...lower, ...DEAD_SEA_MEDIAN_AND_ARABAH],
    upperMouth: upper.at(-1),
    lowerSource: lower[0],
    lowerMouth: lower.at(-1),
    upperSource: upper[0]
  };
}

function polygonFeature(lineCoordinates, framePoints) {
  return geometryFeature(polygonFromLineAndFrame(lineCoordinates, framePoints));
}

// Anchor towns must fall inside the area they define. Coastal towns may sit just beyond the AWMC
// coastline; up to COASTAL_ANCHOR_KM outside is accepted and noted.
const COASTAL_ANCHOR_KM = 2;

function assertInside(feature, points, areaLabel, notes = null) {
  for (const [name, point] of Object.entries(points)) {
    if (pointInGeometry(point, feature.geometry)) continue;
    const distance = distanceToGeometryKm(point, feature.geometry);
    if (notes && distance <= COASTAL_ANCHOR_KM) {
      notes.push(`${areaLabel}: anchor ${name} lies ${rounded(distance, 2)} km beyond the coastline of its area.`);
      continue;
    }
    throw new Error(`${areaLabel} does not contain ${name} (${point.join(",")}); it is ${distance.toFixed(2)} km away`);
  }
}

function assertOutside(feature, points, label) {
  for (const [name, point] of Object.entries(points)) {
    if (pointInGeometry(point, feature.geometry)) throw new Error(`${label}: ${name} (${point.join(",")}) must lie outside the base so the cut crosses it`);
  }
}

// Splits Herod's land outline, together with AWMC's AD 69 Judaea face, along the rift, the
// Galilee/Samaria line, the Yarmuk and Perea's northern line at Pella. Each split uses a polygon that
// covers everything on one side of a line, so the pieces share exactly the same borders.
async function buildHerodianPieces(herodBase, jordan, yarmuk, notes) {
  const rift = buildRiftLine(jordan);
  assertOutside(herodBase, { "the rift's north end": rift.coordinates[0], "the rift's south end": rift.coordinates.at(-1) }, "Rift line");
  const westOfRift = polygonFeature(rift.coordinates, [[33.5, rift.coordinates.at(-1)[1]], [33.5, 33.8], [RIFT_NORTH_CONNECTOR[0][0], 33.8]]);
  const northOfGalileeSamaria = polygonFeature(GALILEE_SAMARIA_LINE, [[36.0, 32.5], [36.0, 33.9], [34.0, 33.9], [34.0, GALILEE_SAMARIA_LINE[0][1]]]);
  if (yarmuk.chains.length < 1) throw new Error("No Yarmuk main stream");
  const yarmukLine = orientFrom(yarmuk.chains[0].coordinates, [35.56, 32.65]);
  const confluenceKm = distanceKm(yarmukLine[0], rift.coordinates.reduce((best, point) => (distanceKm(point, yarmukLine[0]) < distanceKm(best, yarmukLine[0]) ? point : best)));
  if (confluenceKm > 0.2) throw new Error(`The Yarmuk's mouth is ${confluenceKm.toFixed(2)} km from the Jordan`);
  const yarmukEnd = yarmukLine.at(-1);
  const northOfYarmuk = polygonFeature(yarmukLine, [[37.0, yarmukEnd[1]], [37.0, 33.9], [35.0, 33.9], [35.0, yarmukLine[0][1]]]);
  const northOfPellaLine = polygonFeature(PELLA_LINE, [[37.0, PELLA_LINE.at(-1)[1]], [37.0, 33.9], [35.0, 33.9], [35.0, PELLA_LINE[0][1]]]);
  for (const [name, feature] of Object.entries({ westOfRift, northOfGalileeSamaria, northOfYarmuk, northOfPellaLine })) {
    if (!booleanValid(feature)) throw new Error(`Half-plane polygon ${name} is not simple`);
  }
  await writeJson(path.join(workDirectory, "herod-cut-lines.geojson"), featureCollection([
    geometryFeature({ type: "LineString", coordinates: rift.coordinates }, { cutId: "rift" }),
    geometryFeature({ type: "LineString", coordinates: GALILEE_SAMARIA_LINE }, { cutId: "galilee-samaria" }),
    geometryFeature({ type: "LineString", coordinates: yarmukLine }, { cutId: "yarmuk" }),
    geometryFeature({ type: "LineString", coordinates: PELLA_LINE }, { cutId: "perea-north-pella" })
  ]));

  const westSide = await booleanOp("herod-west", "clip", [herodBase], [westOfRift]);
  const eastSide = await booleanOp("herod-east", "erase", [herodBase], [westOfRift]);
  const galilee = await booleanOp("herod-galilee", "clip", westSide, [northOfGalileeSamaria]);
  const judea = await booleanOp("herod-judea", "erase", westSide, [northOfGalileeSamaria]);
  const philip = await booleanOp("herod-philip", "clip", eastSide, [northOfYarmuk]);
  const southOfYarmuk = await booleanOp("herod-south-of-yarmuk", "erase", eastSide, [northOfYarmuk]);
  const gadaraSide = await booleanOp("herod-gadara", "clip", southOfYarmuk, [northOfPellaLine]);
  let perea = await booleanOp("herod-perea", "erase", southOfYarmuk, [northOfPellaLine]);

  // Only the land between the Yarmuk and Pella is Gadara's (and Pella's) Decapolis territory. A piece
  // of Herod's Perea that lies east of the straight Pella–Philadelphia segment stays with Perea.
  const gadaraParts = await explodeFeatures("herod-gadara-parts", gadaraSide);
  const gadara = gadaraParts.filter((part) => pointInGeometry(HEROD_ANCHORS.gadara, part.geometry) || distanceToGeometryKm(HEROD_ANCHORS.pella, part.geometry) < 1 || pointInGeometry(HEROD_ANCHORS.pella, part.geometry));
  const pereaExtra = gadaraParts.filter((part) => !gadara.includes(part));
  if (pereaExtra.length > 0) {
    notes.push(`${pereaExtra.length} piece(s) (${rounded(pereaExtra.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0), 1)} km²) north-east of the straight Pella–Philadelphia segment are not connected to Gadara's land and stay with Perea.`);
    perea = [...perea, ...pereaExtra];
  }
  return { rift, yarmukLine, judea, galilee, perea, philip, gadara };
}

async function buildCiliciaWhole(f0031, ad200Cells, notes) {
  const cells = [
    { ...cellAtPoint(ad200Cells, POINTS.tarsus, "Tarsus"), expected: "f0228" },
    { ...cellAtPoint(ad200Cells, POINTS.lamusMouth, "the Lamus mouth (Corycus coast)"), expected: "f14078" },
    { ...cellAtPoint(ad200Cells, POINTS.coracesium, "Coracesium"), expected: "f14001" }
  ];
  for (const cell of cells) {
    if (cell.cellId !== cell.expected) notes.push(`AD 200 cell ${cell.cellId} was used where ${cell.expected} was expected; the AD 200 cells were renumbered.`);
  }
  const union = await unionFeatures("cilicia-ad200", cells.map((cell) => cell.feature));
  const clipped = await booleanOp("cilicia-whole", "clip", [f0031], [union]);
  if (clipped.length === 0) throw new Error("Cilicia whole: clip produced no geometry");
  const whole = await unionFeatures("cilicia-whole", clipped);
  const areaKm2 = geometryAreaKm2(whole.geometry);
  notes.push(`Cilicia whole (AD 69 face f0031 clipped by AD 200 cells ${cells.map((cell) => cell.cellId).join(" + ")}): ${rounded(areaKm2)} km², bbox ${bboxOf(whole.geometry).map((value) => value.toFixed(2)).join(", ")}.`);
  return { whole, cellIds: cells.map((cell) => cell.cellId) };
}

// Strabo 14.5.6: the Lamus divides Cilicia Tracheia (west) from the plain (east).
async function splitCiliciaAtLamus(ciliciaWhole, lamus, notes) {
  if (lamus.chains.length < 1) throw new Error("No Lamus main stream");
  const river = orientFrom(lamus.chains[0].coordinates, [33.8, 37.0]);
  const toSea = extendLineEnd(river, { atEnd: true, baseKm: 1, lengthKm: LAMUS_SEA_EXTENSION_KM });
  const northwards = extendLineEnd(toSea.coordinates, { atEnd: false, baseKm: 3, untilLatitude: LAMUS_NORTH_EXTENSION_LATITUDE });
  const line = northwards.coordinates;
  assertOutside(ciliciaWhole, { "the extended Lamus line's north end": line[0], "the extended Lamus line's sea end": line.at(-1) }, "Lamus line");
  const bearing = (direction) => ((Math.atan2(direction.east, direction.north) * 180) / Math.PI + 360) % 360;
  notes.push(`Lamus line: OSM river from its source (${river[0].map((value) => value.toFixed(4)).join(", ")}) to its mouth (${river.at(-1).map((value) => value.toFixed(4)).join(", ")}); extended ${rounded(toSea.lengthKm, 1)} km into the sea on bearing ${rounded(bearing(toSea.direction))}° and ${rounded(northwards.lengthKm, 1)} km north on bearing ${rounded(bearing(northwards.direction))}° (the direction of its last ${rounded(northwards.direction.measuredOverKm, 1)} km) to ${LAMUS_NORTH_EXTENSION_LATITUDE}°N. Both extensions are approximate.`);
  const westOfLamus = polygonFeature(line, [[line.at(-1)[0], 35.6], [30.5, 35.6], [30.5, 38.3], [line[0][0], 38.3]]);
  if (!booleanValid(westOfLamus)) throw new Error("West-of-Lamus polygon is not simple");
  await writeJson(path.join(workDirectory, "lamus-cut-line.geojson"), featureCollection([geometryFeature({ type: "LineString", coordinates: line }, { cutId: "lamus-extended" })]));
  const tracheia = await booleanOp("cilicia-tracheia", "clip", [ciliciaWhole], [westOfLamus]);
  const pedias = await booleanOp("cilicia-pedias", "erase", [ciliciaWhole], [westOfLamus]);
  return { line, westOfLamus, tracheia, pedias, northExtensionKm: northwards.lengthKm, seaExtensionKm: toSea.lengthKm };
}

// AD 69 faces between Aegyptus and Judaea that carry no reference town: north-west Sinai (outside
// AWMC's AD 69 extent) and the coast and desert south of Gaza (inside it). The Research Lead ruled
// Sinai into Arabia.
function sinaiFaces(ad69Raw, namedFaces) {
  const namedGeometries = new Set(namedFaces.map((named) => JSON.stringify(named.geometry.coordinates)));
  return ad69Raw.features.filter((feature) => {
    if (namedGeometries.has(JSON.stringify(feature.geometry.coordinates))) return false;
    const point = labelPoint(feature.geometry);
    return point && point[0] > 32 && point[0] < 35.6 && point[1] > 29.5 && point[1] < 31.4;
  });
}

async function buildThrace(ad69Raw, notes) {
  // Byzantium sits on the coast; its own face may be missing from the land faces, and the nearest face
  // is then Bithynia's across the Bosporus. Only faces on the European side are used.
  const references = [
    ["Philippopolis", POINTS.philippopolis],
    ["Perinthus", POINTS.perinthus],
    ["Bizye", POINTS.bizye],
    ["Byzantium", POINTS.byzantium]
  ];
  const faces = [];
  for (const [label, point] of references) {
    const face = featureAtPointOrNearest(ad69Raw, point, label);
    if (labelPoint(face.geometry)[0] > 29.0 || pointInGeometry(POINTS.nicomedia, face.geometry)) {
      notes.push(`Thrace: the face nearest ${label} lies across the Bosporus (it holds Nicomedia), so it was not added to Thrace.`);
      continue;
    }
    if (!faces.includes(face)) faces.push(face);
  }
  return faces;
}

// Builds a coarse grid of an area's boundary segments so that "how much of this piece's edge runs
// along that area" can be measured quickly.
function segmentGrid(geometry, cellDegrees = 0.05) {
  const grid = new Map();
  for (const polygon of polygonsOf(geometry)) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        const start = ring[index - 1];
        const end = ring[index];
        const minX = Math.floor(Math.min(start[0], end[0]) / cellDegrees);
        const maxX = Math.floor(Math.max(start[0], end[0]) / cellDegrees);
        const minY = Math.floor(Math.min(start[1], end[1]) / cellDegrees);
        const maxY = Math.floor(Math.max(start[1], end[1]) / cellDegrees);
        for (let x = minX; x <= maxX; x += 1) {
          for (let y = minY; y <= maxY; y += 1) {
            const key = `${x}:${y}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push([start, end]);
          }
        }
      }
    }
  }
  return { grid, cellDegrees };
}

function nearSegmentGrid(point, { grid, cellDegrees }, toleranceKm) {
  const cellX = Math.floor(point[0] / cellDegrees);
  const cellY = Math.floor(point[1] / cellDegrees);
  for (let x = cellX - 1; x <= cellX + 1; x += 1) {
    for (let y = cellY - 1; y <= cellY + 1; y += 1) {
      for (const [start, end] of grid.get(`${x}:${y}`) ?? []) {
        if (distancePointToSegmentKm(point, start, end) <= toleranceKm) return true;
      }
    }
  }
  return false;
}

// Share of a piece's boundary vertices that lie on (within toleranceKm of) each candidate's boundary.
function sharedBoundaryShares(piece, candidates, toleranceKm = 0.2) {
  const vertices = polygonsOf(piece.geometry).flatMap((polygon) => polygon.flatMap((ring) => ring.slice(1)));
  const [minLon, minLat, maxLon, maxLat] = bboxOf(piece.geometry);
  const margin = 0.05;
  return candidates
    .filter((candidate) => {
      const box = bboxOf(candidate.geometry);
      return box[0] <= maxLon + margin && box[2] >= minLon - margin && box[1] <= maxLat + margin && box[3] >= minLat - margin;
    })
    .map((candidate) => {
      const index = segmentGrid(candidate.geometry);
      const shared = vertices.filter((vertex) => nearSegmentGrid(vertex, index, toleranceKm)).length;
      return { candidate, share: shared / Math.max(1, vertices.length) };
    })
    .filter((row) => row.share > 0)
    .sort((left, right) => right.share - left.share);
}

// ADR-0037 rule 4: land whose border no source describes stays with the area around it. AD 69 land
// faces (or parts of them) that no area covers are given to the one area they border; pieces that
// border nothing (islands), border an unlisted province, or border two areas about equally are left
// for the coverage report.
async function assignLeftoverLand(built, domainFeatures, explanations, notes) {
  const leftover = await booleanOp("leftover", "erase", domainFeatures, built);
  const pieces = (await explodeFeatures("leftover", leftover)).filter((piece) => geometryAreaKm2(piece.geometry) > COVERAGE_TOLERANCE_KM2);
  const outsideList = pieces.filter((piece) => explanations.some((explanation) => pointInGeometry(explanation.point, piece.geometry)));
  const additions = new Map();
  for (const piece of pieces) {
    if (outsideList.includes(piece)) continue;
    const touchesOutsideList = sharedBoundaryShares(piece, outsideList.filter((other) => other !== piece), 0.05).length > 0;
    const shares = sharedBoundaryShares(piece, built);
    if (touchesOutsideList || shares.length === 0) continue;
    const [first, second] = shares;
    if (second && second.share > first.share * 0.33) continue;
    const areaId = first.candidate.properties.areaId;
    if (!additions.has(areaId)) additions.set(areaId, []);
    additions.get(areaId).push(piece);
    notes.push(`Rule 4: ${rounded(geometryAreaKm2(piece.geometry), 1)} km² of AD 69 land at ${labelPoint(piece.geometry).map((value) => value.toFixed(2)).join(", ")} borders only \`${areaId}\` (${rounded(first.share * 100)}% of its edge) and joins it.`);
  }
  for (const [areaId, extraPieces] of additions) {
    const index = built.findIndex((feature) => feature.properties.areaId === areaId);
    const current = built[index];
    const change = { kind: "rule-4-leftover", detail: `Added ${extraPieces.length} piece(s) of AWMC AD 69 land (${rounded(extraPieces.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0))} km²) that no area covered and that border only this area (ADR-0037 rule 4).`, sources: ["awmc:roman-empire-ad-69-provinces"] };
    built[index] = await finishArea(areaId, [current, ...extraPieces], current.properties.provenance.changes[0].detail, current.properties.provenance.upstreamFeatureIds, notes, [...current.properties.provenance.changes.slice(1), change]);
  }
}

async function buildItaly(culturalRoot, ad69Raw, notes) {
  // The AD 69 partition is framed at 9°E and 48°N and its Italian faces were once picked by a box, which
  // took in half of Sardinia and Corsica and the Alpine provinces. Italy is now the AD 69 faces that lie
  // within AWMC's own outline of Roman Italy (Italy_shading), united with that outline on land so that
  // north-west Italy beyond the 9°E frame is included.
  const landPath = path.join(partitionWorkDirectory, "ne_10m_land.geojson");
  const italyShapefile = path.join(culturalRoot, "political_shading", "Italy_shading", "Italy_shading.shp");
  const outputPath = path.join(workDirectory, "italy-shading-land.geojson");
  const outlinePath = path.join(workDirectory, "italy-shading.geojson");
  await removeIfExists(outputPath);
  await removeIfExists(outlinePath);
  await mapshaper.runCommands(`-i ${quote(italyShapefile)} -o format=geojson ${quote(outlinePath)}`);
  await mapshaper.runCommands(`-i ${quote(landPath)} name=land -clip bbox=5,36,20,48.5 -i ${quote(italyShapefile)} name=italy -target italy -clip land -o format=geojson ${quote(outputPath)}`);
  const outline = ensureFeatureCollection(await readJson(outlinePath)).features[0];
  const outlineLand = ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry);
  if (outlineLand.length === 0) throw new Error("Italy_shading clipped to land is empty");
  const faces = ad69Raw.features.filter((feature) => {
    const point = labelPoint(feature.geometry);
    return point && pointInGeometry(point, outline.geometry);
  });
  notes.push(`Italy: ${faces.length} AD 69 land faces lie within AWMC Italy_shading; united with Italy_shading on Natural Earth 10m land (${rounded(outlineLand.reduce((sum, feature) => sum + geometryAreaKm2(feature.geometry), 0))} km²).`);
  return { faces, outlineLand };
}

// Location records with `politicalAreaId` links: the timeline branch's copies while it is unmerged,
// otherwise the local records.
async function loadLocationRecordsForPlaceCheck(notes) {
  try {
    const { stdout } = await execFileAsync("git", ["ls-tree", "-r", "--name-only", `${TIMELINE_BRANCH}:data/locations`], {
      cwd: repositoryRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 10
    });
    const files = stdout.split(/\r?\n/).filter((line) => line.endsWith(".json"));
    const records = [];
    for (const file of files) {
      const show = await execFileAsync("git", ["show", `${TIMELINE_BRANCH}:data/locations/${file}`], {
        cwd: repositoryRoot,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 5
      });
      records.push(JSON.parse(show.stdout));
    }
    notes.push(`Place check uses the ${files.length} location records on branch ${TIMELINE_BRANCH}.`);
    return records;
  } catch {
    const directory = path.join(repositoryRoot, "data", "locations");
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json"));
    notes.push(`Place check uses the ${files.length} local location records (branch ${TIMELINE_BRANCH} not found).`);
    return Promise.all(files.map((file) => readJson(path.join(directory, file))));
  }
}

// Explanations for place-check results that are not border-precision issues.
const PLACE_EXPLANATIONS = {
  pisidia: "Label point for the region. The research note keeps AWMC's whole AD 14 'Pamphylia' face with `pamphylia`, so southern Pisidia's hills are drawn there; the point is in that face, not in Galatia's.",
  cappadocia: "Label point for the province, placed near Caesarea Mazaca; AWMC's AD 14 face for Cappadocia ends a few kilometres away.",
  "malta candidate 1": "The alternative identification of Melita, Mljet in the Adriatic, lies in Illyricum. The record links the place, not each candidate, to `sicily`.",
  galilee: "Label point for the region, in the hills north of AWMC's Herod outline and AD 69 Judaea face, in the land AWMC gives to Tyre (Syria).",
  nicopolis: "Coastal city on the Preveza isthmus: AWMC's coastline at the Ambracian Gulf leaves it in the sea (a boundary-precision issue, per the research note's Nicopolis ruling).",
  "sea-of-galilee": "Label point for the lake, 0.9 km east of the median line that divides the lake between Galilee and Philip's lands."
};

function placeExplanation(row) {
  const specific = PLACE_EXPLANATIONS[row.label] ?? PLACE_EXPLANATIONS[row.label.split(" candidate")[0]];
  if (specific) return specific;
  if (row.status === "near-border" && row.actualAreaIds.length === 0) return "Coastal site just beyond AWMC's coastline of its area.";
  return "";
}

async function writeReport({ collection, omitted, notes, validity, overlaps, coverage, places, jordanSites, previewPaths, osmSummary, simplifyNote }) {
  const lines = ["# M4-03 area composition", ""];
  lines.push(`Built ${collection.features.length} of ${AREA_ORDER.length} areas. ${simplifyNote}`, "");
  lines.push("## Areas", "", "| Area | km² | Parts | Valid | Repeated vertices | Composition |", "|---|---:|---:|---|---:|---|");
  const validityById = new Map(validity.map((row) => [row.areaId, row]));
  for (const feature of collection.features) {
    const row = validityById.get(feature.properties.areaId);
    lines.push(`| \`${row.areaId}\` | ${rounded(row.areaKm2)} | ${row.parts} | ${row.valid ? "yes" : "**no**"} | ${row.duplicateVertices} | ${feature.properties.provenance.changes[0].detail} |`);
  }
  lines.push("", "## Not built", "");
  for (const [areaId, reason] of omitted) lines.push(`- \`${areaId}\`: ${reason}`);
  lines.push("", "## Overlaps between areas", "");
  const bigOverlaps = overlaps.filter((row) => row.areaKm2 > 1);
  lines.push(bigOverlaps.length === 0 ? `None larger than 1 km² (largest: ${overlaps[0] ? `${overlaps[0].pair}, ${rounded(overlaps[0].areaKm2, 3)} km²` : "none"}).` : "Overlaps larger than 1 km²:");
  for (const row of bigOverlaps) lines.push(`- ${row.pair}: ${rounded(row.areaKm2, 2)} km²`);
  lines.push("", "## Coverage", "", `Domain: AWMC's AD 69 land faces inside the AD 69 extent (Natural Earth land cut by AWMC's lines, within 9–50°E, 22.5–48°N), plus Nabataea and Sinai outside it. Gaps of ${COVERAGE_TOLERANCE_KM2} km² or less: ${coverage.smallCount} (${rounded(coverage.smallKm2, 1)} km² in all).`, "");
  lines.push("| Gap km² | Centre (lon, lat) | Explanation |", "|---:|---|---|");
  for (const row of coverage.rows) lines.push(`| ${rounded(row.areaKm2, 1)} | ${row.point.map((value) => value.toFixed(3)).join(", ")} | ${row.explanation ?? "**unexplained**"} |`);
  lines.push("", "## Place check", "", "Each candidate site is tested against its record's `politicalAreaId` (or its own candidate-level link). Near the border means within 3 km.", "");
  const mismatches = places.filter((row) => row.status !== "inside");
  lines.push(`${places.length} checks; ${places.length - mismatches.length} inside; ${mismatches.filter((row) => row.status === "near-border").length} near the border; ${mismatches.filter((row) => row.status === "outside").length} further out; ${mismatches.filter((row) => row.status === "area-not-built").length} with no area.`, "");
  lines.push("| Place | Link | Expected area | Result | Distance km | Lies in | Note |", "|---|---|---|---|---:|---|---|");
  for (const row of mismatches) {
    lines.push(`| ${row.label} | ${row.linkLevel} | \`${row.areaId}\` | ${row.status} | ${row.distanceKm === null ? "" : rounded(row.distanceKm, 2)} | ${row.actualAreaIds.join(", ") || "no area"} | ${placeExplanation(row)} |`);
  }
  lines.push("", "## Jordan check: Bethany beyond the Jordan", "");
  for (const site of jordanSites) lines.push(`- ${site.name} (${site.point.join(", ")}): in ${site.areaIds.map((areaId) => `\`${areaId}\``).join(", ") || "no area"}; ${rounded(site.riverKm * 1000)} m from the OSM Jordan.`);
  lines.push("", "## OpenStreetMap ways", "");
  for (const line of osmSummary) lines.push(`- ${line}`);
  lines.push("", "## Composition notes", "");
  for (const note of notes) lines.push(`- ${note}`);
  lines.push("", "## Previews", "");
  for (const previewPath of previewPaths) lines.push(`- ${previewPath}`);
  await fs.mkdir(reportDirectory, { recursive: true });
  await fs.writeFile(path.join(reportDirectory, "composition-report.md"), `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  await fs.mkdir(workDirectory, { recursive: true });
  // ANCIENT_GEO_REUSE_PREP=1 reuses the previous partition-prep outputs (a debugging shortcut).
  if (process.env.ANCIENT_GEO_REUSE_PREP !== "1") {
    await execFileAsync(process.execPath, [path.join(repositoryRoot, "scripts", "report-ancient-partition-prep.mjs")], {
      cwd: repositoryRoot,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 20
    });
  }

  const ad69Named = await readJson(path.join(reportDirectory, "ad69-named-faces.geojson"));
  const ad14Named = await readJson(path.join(reportDirectory, "ad14-named-faces.geojson"));
  const ad69Raw = ensureFeatureCollection(await readJson(path.join(partitionWorkDirectory, "ad69", "land-faces.geojson")));
  const culturalRoot = path.join(partitionWorkDirectory, "awmc-cultural");
  const ad200Cells = ensureFeatureCollection(await readJson(path.join(buildWorkDirectory, "province-cells.geojson")));
  const landMaskPath = path.join(partitionWorkDirectory, "ad69", "ne-land-mask.geojson");
  const landMask = ensureFeatureCollection(await readJson(landMaskPath)).features;
  const ad69Extent = (await extractShapefileFeature(path.join(culturalRoot, "political_shading", "roman_empire_ad_69_extent", "roman_empire_ad_69_extent.shp"), "ad69-extent.geojson", "-dissolve"))[0];
  const ad200Extent = (await extractShapefileFeature(path.join(culturalRoot, "political_shading", "roman_empire_ad_200_extent", "roman_empire_ad_200_extent.shp"), "ad200-extent.geojson", "-dissolve"))[0];
  const herodRecord12 = (await extractShapefileFeature(path.join(culturalRoot, "political_shading", "herod", "herod.shp"), "herod-record-12.geojson", `-each "_idx=this.id" -filter "_idx==12"`))[0];
  const herodLand = await clippedHerodOutline(herodRecord12, landMaskPath);
  const notes = [];
  const omitted = [...OMITTED_BY_RULING];
  const built = [];

  const addDirect = async (areaId, collection, name, layer, extraFaces = [], extraDetail = "", extraIds = []) => {
    const face = namedFace(collection, name);
    built.push(await finishArea(areaId, [face, ...extraFaces], `${layer.toUpperCase()} face ${face.properties.faceId} (${name}).${extraDetail}`, [`awmc:${layer}-face-${face.properties.faceId}`, ...extraIds], notes));
  };

  // Areas taken whole from AWMC's AD 69 and AD 14 province faces.
  await addDirect("commagene", ad69Named, "Commagene", "ad69");
  await addDirect("cappadocia", ad14Named, "Armenia Minor / Cappadocia / Pontus Galaticus / Pontus Polemoniacus", "ad14");
  await addDirect("galatia", ad14Named, "Galatia", "ad14");
  await addDirect("pamphylia", ad14Named, "Pamphylia", "ad14");
  await addDirect("lycia", ad14Named, "Lycia", "ad14");
  // Bithynia: the AD 14 face, plus the AD 69 Bithynia et Pontus face's coast east of it (western,
  // coastal Pontus round Amisus, which the research note places in Bithynia; the AD 14 extent leaves it out).
  const bithyniaAd14 = namedFace(ad14Named, "Bithynia et Pontus / Thracia");
  const bithyniaAd69 = namedFace(ad69Named, "Bithynia et Pontus / Thracia");
  const pontusCoast = await booleanOp("bithynia-ad69-pontus-coast", "erase", [bithyniaAd69], [bithyniaAd14, ...built.filter((feature) => ["cappadocia", "galatia"].includes(feature.properties.areaId))]);
  built.push(await finishArea("bithynia", [bithyniaAd14, ...pontusCoast], `AD14 face ${bithyniaAd14.properties.faceId} (Bithynia et Pontus / Thracia), plus the AD69 face ${bithyniaAd69.properties.faceId}'s Pontic coast east of it (${rounded(pontusCoast.reduce((sum, feature) => sum + geometryAreaKm2(feature.geometry), 0))} km²), per the research note's ruling that coastal, western Pontus lies in Bithynia.`, [`awmc:ad14-face-${bithyniaAd14.properties.faceId}`, `awmc:ad69-face-${bithyniaAd69.properties.faceId}`], notes));
  await addDirect("macedonia", ad69Named, "Macedonia", "ad69");
  await addDirect("cyprus", ad69Named, "Cyprus", "ad69");
  await addDirect("egypt", ad69Named, "Aegyptus", "ad69");
  await addDirect("illyricum", ad69Named, "Dalmatia", "ad69");
  await addDirect("achaia", ad69Named, "Achaia", "ad69", [featureAtPointOrNearest(ad69Raw, POINTS.nicopolis, "Nicopolis/Epirus", 20)], " Added the AD69 raw face containing Nicopolis/Epirus per Research Lead ruling.", ["awmc:ad69-epirus-face"]);
  await addDirect("sicily", ad69Named, "Sicilia", "ad69", [featureAtPointOrNearest(ad69Raw, POINTS.malta, "Malta", 20)], " Added the AD69 raw face containing Malta per Research Lead ruling.", ["awmc:ad69-malta-face"]);

  // Asia's islands: AD 69 land faces where they exist; otherwise (Patmos is under the partition's
  // 50 km² face minimum) the Natural Earth land polygon around the island.
  const islandFaces = [];
  for (const [label, point] of [["Samos", POINTS.samos], ["Chios", POINTS.chios], ["Lesbos", POINTS.lesbos], ["Cos", POINTS.cos], ["Rhodes", POINTS.rhodes]]) {
    const face = optionalFeatureAtPointOrNearest(ad69Raw, point, `Asia island ${label}`, notes, 20);
    if (face) islandFaces.push(face);
  }
  const landParts = await explodeFeatures("land-mask", landMask);
  const patmosLand = landParts.find((part) => pointInGeometry(POINTS.patmos, part.geometry) || distanceToGeometryKm(POINTS.patmos, part.geometry) < 2);
  if (patmosLand && geometryAreaKm2(patmosLand.geometry) < 100) {
    islandFaces.push(patmosLand);
    notes.push(`Asia: added Patmos from Natural Earth 10m land (${rounded(geometryAreaKm2(patmosLand.geometry), 1)} km²), per the Research Lead's ruling (the AD 69 partition drops land faces under 50 km²).`);
  } else {
    notes.push("Asia: no Natural Earth land polygon found for Patmos.");
  }
  await addDirect("asia", ad69Named, "Asia", "ad69", islandFaces, " Added AD69 raw island faces for Samos, Chios, Lesbos, Cos and Rhodes, and Natural Earth land for Patmos, per Research Lead ruling.", ["awmc:ad69-asia-island-faces"]);

  const thraceFaces = await buildThrace(ad69Raw, notes);
  built.push(await finishArea("thrace", thraceFaces, `Union of ${thraceFaces.length} AD69 face(s) on the European side containing Philippopolis, Perinthus, Bizye and Byzantium; the Bosporus and Hellespont divide it from Bithynia.`, thraceFaces.map((_, index) => `awmc:ad69-thrace-face-${index + 1}`), notes));

  const crete = namedFace(ad69Named, "Creta");
  const cyrenaica = namedFace(ad69Named, "Cyrenaica");
  built.push(await finishArea("crete-cyrene", [crete, cyrenaica], `Union of AD69 faces ${crete.properties.faceId} (Creta) and ${cyrenaica.properties.faceId} (Cyrenaica).`, [`awmc:ad69-face-${crete.properties.faceId}`, `awmc:ad69-face-${cyrenaica.properties.faceId}`], notes));

  const italy = await buildItaly(culturalRoot, ad69Raw, notes);
  const illyricumArea = built.find((feature) => feature.properties.areaId === "illyricum");
  const sicilyArea = built.find((feature) => feature.properties.areaId === "sicily");
  const italyUnion = await unionFeatures("italy-sources", [...italy.faces, ...italy.outlineLand]);
  const italyPieces = await booleanOp("italy", "erase", [italyUnion], [illyricumArea, sicilyArea]);
  built.push(await finishArea("italy", italyPieces, `Union of ${italy.faces.length} AD69 land faces lying within AWMC Italy_shading (Roman Italy) and Italy_shading itself on Natural Earth 10m land, minus Dalmatia and Sicily.`, ["awmc:italy-shading", "awmc:roman-empire-ad-69-provinces"], notes, [{ kind: "clip", detail: `Italy_shading clipped to Natural Earth 10m land (commit ${NATURAL_EARTH_COMMIT}); it supplies Italy west of the AD 69 partition's 9°E frame.`, sources: ["awmc:italy-shading"] }]));

  // Herod's lands, Gadara's Decapolis land, Syria, Cilicia and Arabia.
  const jordan = await loadRiver("jordan");
  const yarmuk = await loadRiver("yarmuk");
  const lamus = await loadRiver("lamus");
  const judaeaFace = namedFace(ad69Named, "Judaea");
  const herodBase = await unionFeatures("herod-base", [herodLand, judaeaFace]);
  notes.push(`Herodian base: AWMC Herod record 12 (clipped to land, ${rounded(geometryAreaKm2(herodLand.geometry))} km²) united with AWMC's AD 69 Judaea face ${judaeaFace.properties.faceId}, so that the Dead Sea, the Carmel and Gaza coasts and the Jordan valley by Pella, which the AD 69 face holds but Herod's outline leaves out, are cut by the same lines: ${rounded(geometryAreaKm2(herodBase.geometry))} km².`);
  const herod = await buildHerodianPieces(herodBase, jordan, yarmuk, notes);
  const jordanIds = osmWayIds(jordan);
  const yarmukIds = osmWayIds(yarmuk);
  const riftChange = {
    kind: "osm-river-cut",
    detail: `Rift line: a straight connector from ${RIFT_NORTH_CONNECTOR.map((point) => point.join(" ")).join(" through ")} to the Jordan's OSM source, the OSM Jordan to the Sea of Galilee, a median across the lake (from the OSM river mouth through ${SEA_OF_GALILEE_MEDIAN.map((point) => point.join(" ")).join(" and ")}), the OSM lower Jordan, then a Dead Sea median and the Arabah (${DEAD_SEA_MEDIAN_AND_ARABAH.map((point) => point.join(" ")).join("; ")}). The connector and medians are approximate repairs across water or above the source.`,
    sources: ["bib:josephus-jewish-war", `osm:relation/${OSM_RIVERS.jordan.relationId}`, ...jordanIds]
  };
  const anchorChange = {
    kind: "anchor-line",
    detail: "Galilee/Samaria line through Mount Carmel, Ginea (Jenin, after ISBE 'En-gannim') and Scythopolis, and Perea's northern line through Pella and Philadelphia: straight segments between named anchors (approximate).",
    sources: ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378", "pleiades:678326", "pleiades:697728"]
  };
  const yarmukChange = {
    kind: "osm-river-cut",
    detail: "Yarmuk (OSM main stream), the southern edge of Gaulanitis (ISBE, 'Golan; Gaulonitis').",
    sources: [`osm:relation/${OSM_RIVERS.yarmuk.relationId}`, ...yarmukIds]
  };
  const herodUpstream = ["awmc:herod-record-12-land-clipped", `awmc:ad69-face-${judaeaFace.properties.faceId}`];
  const judea = await finishArea("judea-samaria-idumea", herod.judea, "Herod record 12 with the AD 69 Judaea face, west of the Jordan and the Dead Sea median and south of the Galilee/Samaria line.", [...herodUpstream, ...jordanIds], notes, [riftChange, anchorChange]);
  assertInside(judea, { Jerusalem: HEROD_ANCHORS.jerusalem, "Qasr al-Yahud": HEROD_ANCHORS.qasrAlYahud }, "judea-samaria-idumea");
  const galileePerea = await finishArea("galilee-perea", [...herod.galilee, ...herod.perea], "Herod record 12 with the AD 69 Judaea face: Galilee (west of the Jordan, north of the Galilee/Samaria line) and Perea (east of the Jordan and the Dead Sea median, south of the Yarmuk and of Perea's northern line at Pella).", [...herodUpstream, ...jordanIds, ...yarmukIds], notes, [riftChange, anchorChange, yarmukChange]);
  assertInside(galileePerea, { Nazareth: HEROD_ANCHORS.nazareth, Capernaum: HEROD_ANCHORS.capernaum, "Al-Maghtas": HEROD_ANCHORS.alMaghtas, Machaerus: HEROD_ANCHORS.machaerus }, "galilee-perea");
  const philip = await finishArea("philip-tetrarchy-lands", herod.philip, "Herod record 12 east of the Jordan and north of the Yarmuk (Gaulanitis, Batanea, Trachonitis, Auranitis); keeps Caesarea Philippi, Bethsaida and Hippos.", [...herodUpstream, ...jordanIds, ...yarmukIds], notes, [riftChange, yarmukChange]);
  assertInside(philip, { "Caesarea Philippi": HEROD_ANCHORS.caesareaPhilippi, Bethsaida: HEROD_ANCHORS.bethsaida, Hippos: HEROD_ANCHORS.hippos }, "philip-tetrarchy-lands");
  built.push(judea, galileePerea, philip);
  notes.push(`Gadara's land (east of the Jordan, between the Yarmuk and Perea's line at Pella): ${rounded(herod.gadara.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0))} km², given to Syria.`);

  const f0031 = namedFace(ad69Named, "Agrippa II kingdom / Cilicia / Emesa / Syria");
  const commagene = built.find((feature) => feature.properties.areaId === "commagene");
  const cilicia = await buildCiliciaWhole(f0031, ad200Cells, notes);
  const lamusSplit = await splitCiliciaAtLamus(cilicia.whole, lamus, notes);
  const lamusIds = osmWayIds(lamus);
  const lamusChange = {
    kind: "osm-river-cut",
    detail: `Split along the river Lamus (OSM Limonlu Çayı) per Strabo 14.5.6; the line is extended ${rounded(lamusSplit.seaExtensionKm, 1)} km into the sea at the mouth and ${rounded(lamusSplit.northExtensionKm, 1)} km north from the source along the direction of its last 3 km, to ${LAMUS_NORTH_EXTENSION_LATITUDE}°N. Both extensions are approximate.`,
    sources: ["bib:strabo-geography", `osm:relation/${OSM_RIVERS.lamus.relationId}`, ...lamusIds]
  };
  const ciliciaUpstream = [`awmc:ad69-face-${f0031.properties.faceId}`, ...cilicia.cellIds.map((cellId) => `awmc:ad200-province-cell-${cellId}`)];
  // Syria is what the AD 69 merged face keeps once Cilicia's whole, the Herodian base and Commagene are
  // taken out: its main body, plus Gadara's land. Detached pieces that touch Cilicia's whole are Cilicia's
  // own coast and edges (the AD 69 and AD 200 lines do not quite meet), so they go to the Cilicia area
  // on their side of the Lamus instead of becoming Syrian exclaves.
  const syriaRemainder = await explodeFeatures("syria-remainder", await booleanOp("syria", "erase", [f0031], [cilicia.whole, herodBase, commagene]));
  const syriaMain = syriaRemainder.filter((part) => [POINTS.antioch, POINTS.damascus, POINTS.emesa].some((point) => pointInGeometry(point, part.geometry)));
  const detached = syriaRemainder.filter((part) => !syriaMain.includes(part));
  const ciliciaEdges = detached.filter((part) => sharedBoundaryShares(part, [cilicia.whole], 0.05).length > 0);
  const syriaKeeps = detached.filter((part) => !ciliciaEdges.includes(part));
  const edgesWest = ciliciaEdges.length > 0 ? await booleanOp("cilicia-edges-west", "clip", ciliciaEdges, [lamusSplit.westOfLamus]) : [];
  const edgesEast = ciliciaEdges.length > 0 ? await booleanOp("cilicia-edges-east", "erase", ciliciaEdges, [lamusSplit.westOfLamus]) : [];
  notes.push(`Syria: the AD 69 merged face minus Cilicia, the Herodian base and Commagene leaves ${syriaMain.length} main part and ${detached.length} detached part(s); ${ciliciaEdges.length} of them (${rounded(ciliciaEdges.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0), 1)} km²) touch Cilicia's whole and join Cilicia (${rounded(edgesWest.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0), 1)} km² west of the Lamus, ${rounded(edgesEast.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0), 1)} km² east of it).`);
  const ciliciaEdgeChange = { kind: "edge-pieces", detail: "Adds the AD 69 merged face's land along Cilicia's coast and edges that the AD 200 cells leave out (rule 4: it borders only Cilicia).", sources: ["awmc:roman-empire-ad-69-provinces"] };
  const ciliciaPedias = await finishArea("cilicia", [...lamusSplit.pedias, ...edgesEast], `AD69 face ${f0031.properties.faceId} clipped by AD200 Cilicia cells ${cilicia.cellIds.join(" + ")}; the part east of the Lamus (the plain).`, [...ciliciaUpstream, ...lamusIds], notes, [lamusChange, ciliciaEdgeChange]);
  assertInside(ciliciaPedias, { Tarsus: POINTS.tarsus, Anazarbus: POINTS.anazarbus, Soli: POINTS.soli }, "cilicia", notes);
  const ciliciaTracheia = await finishArea("cilicia-tracheia", [...lamusSplit.tracheia, ...edgesWest], `AD69 face ${f0031.properties.faceId} clipped by AD200 Cilicia cells ${cilicia.cellIds.join(" + ")}; the part west of the Lamus (the rough west).`, [...ciliciaUpstream, ...lamusIds], notes, [lamusChange, ciliciaEdgeChange]);
  const tracheiaAnchors = { "Seleucia on the Calycadnus": POINTS.seleuciaCalycadnus, Olba: POINTS.olba, Corycus: POINTS.corycus, Elaeussa: POINTS.elaeussa, Laranda: POINTS.laranda, Coracesium: POINTS.coracesium };
  assertInside(ciliciaTracheia, tracheiaAnchors, "cilicia-tracheia", notes);
  built.push(ciliciaPedias, ciliciaTracheia);

  const syria = await finishArea("syria", [...syriaMain, ...syriaKeeps, ...herod.gadara], `AD69 merged face ${f0031.properties.faceId} (Agrippa II kingdom / Cilicia / Emesa / Syria) minus Cilicia's whole, the Herodian base and Commagene, plus Gadara's land between the Yarmuk and Pella (Decapolis, held by Syria). Small units such as Abilene, Chalcis and Emesa stay inside Syria (ADR-0037 rule 4).`, [`awmc:ad69-face-${f0031.properties.faceId}`, "awmc:herod-record-12-land-clipped", ...yarmukIds], notes, [yarmukChange, anchorChange]);
  assertInside(syria, { Antioch: POINTS.antioch, Damascus: POINTS.damascus, Emesa: POINTS.emesa, Gadara: HEROD_ANCHORS.gadara }, "syria");
  built.push(syria);

  // Arabia: the AD 200 cell holding Petra and Bostra and, outside the AD 69 extent, the AD 200 cell
  // holding Mount Sinai, both clipped to the AD 200 extent; then the AD 69 Sinai faces east of
  // Aegyptus; minus Aegyptus, the AD 69 Syria face and the Herodian base.
  const petraCell = cellAtPoint(ad200Cells, POINTS.petra, "Petra");
  const bostraCell = cellAtPoint(ad200Cells, POINTS.bostra, "Bostra");
  if (petraCell.cellId !== bostraCell.cellId) throw new Error(`Petra (${petraCell.cellId}) and Bostra (${bostraCell.cellId}) are in different AD 200 cells`);
  const sinaiCell = cellAtPoint(ad200Cells, POINTS.stCatherine, "Mount Sinai (St Catherine)");
  const outsideFace = featureAtPoint(ad69Raw, POINTS.petra, "Petra in the AD 69 land faces");
  if (pointInGeometry(POINTS.petra, ad69Extent.geometry)) throw new Error("Petra lies inside AWMC's AD 69 extent; the outside-the-empire face cannot be identified");
  const sinaiOutsideParts = await explodeFeatures("sinai-outside", await booleanOp("sinai-outside", "clip", [sinaiCell.feature], [outsideFace]));
  const sinaiOutside = sinaiOutsideParts.filter((part) => pointInGeometry(POINTS.stCatherine, part.geometry));
  if (sinaiOutside.length !== 1) throw new Error("Could not isolate Sinai outside the AD 69 extent");
  const egyptArea = built.find((feature) => feature.properties.areaId === "egypt");
  const sinaiAd69Faces = sinaiFaces(ad69Raw, ad69Named.features);
  notes.push(`Sinai: AD 69 faces east of Aegyptus: ${sinaiAd69Faces.map((face) => `${rounded(geometryAreaKm2(face.geometry))} km² at ${labelPoint(face.geometry).map((value) => value.toFixed(2)).join(", ")} (${pointInGeometry(labelPoint(face.geometry), ad69Extent.geometry) ? "inside" : "outside"} the AD 69 extent)`).join("; ")}. Outside the AD 69 extent, AD 200 cell ${sinaiCell.cellId} adds ${rounded(geometryAreaKm2(sinaiOutside[0].geometry))} km² (southern Sinai, Aila and the Hejaz coast inside the AD 200 extent).`);
  const ad200Sources = await booleanOp("arabia-ad200", "clip", [await unionFeatures("arabia-ad200-sources", [petraCell.feature, sinaiOutside[0]])], [ad200Extent]);
  const arabiaPieces = await booleanOp("arabia", "erase", [...ad200Sources, ...sinaiAd69Faces], [egyptArea, f0031, herodBase]);
  const arabia = await finishArea("arabia", arabiaPieces, `AD200 cell ${petraCell.cellId} (Petra and Bostra) and, outside the AD 69 extent, AD200 cell ${sinaiCell.cellId} (Sinai), clipped to the AD 200 extent; plus the AD69 Sinai faces east of Aegyptus; minus Aegyptus, the AD69 Syria face and the Herodian base.`, [`awmc:ad200-province-cell-${petraCell.cellId}`, `awmc:ad200-province-cell-${sinaiCell.cellId}`, "awmc:ad69-sinai-faces", "awmc:roman-empire-ad-200-extent", "awmc:herod-record-12-land-clipped"], notes);
  assertInside(arabia, { Petra: POINTS.petra, Bostra: POINTS.bostra, "Mount Sinai": POINTS.stCatherine }, "arabia");
  built.push(arabia);

  // Coverage is measured on AWMC's AD 69 land faces inside the extent (NE land, cut by AWMC's lines),
  // so slivers where AWMC's coastline and Natural Earth's disagree are not counted as gaps.
  const ad69FacesInside = ad69Raw.features.filter((feature) => {
    const point = labelPoint(feature.geometry);
    return point && pointInGeometry(point, ad69Extent.geometry);
  });
  const nabataeaLand = await booleanOp("coverage-nabataea-land", "clip", [petraCell.feature, sinaiOutside[0], ...sinaiAd69Faces], landMask);
  const coverageDomain = [...ad69FacesInside, ...nabataeaLand];
  const explanations = OUTSIDE_LIST_PROBES.flatMap(([label, probes]) => probes.map((point) => ({ label, point })));
  await assignLeftoverLand(built, coverageDomain, explanations, notes);

  // Final file: fixed area order, topology-aware simplification (shared borders are simplified once, so
  // neighbours keep identical edges), coordinates rounded to OUTPUT_PRECISION, then the same clean-up
  // again (simplification and rounding can leave repeated vertices).
  const ordered = AREA_ORDER.filter((areaId) => built.some((feature) => feature.properties.areaId === areaId)).map((areaId) => built.find((feature) => feature.properties.areaId === areaId));
  for (const areaId of AREA_ORDER) if (!built.some((feature) => feature.properties.areaId === areaId)) omitted.push([areaId, "Not built; see composition notes."]);
  const rawOutputPath = path.join(workDirectory, "ancient-areas-raw.geojson");
  const simplifiedPath = path.join(workDirectory, "ancient-areas-simplified.geojson");
  await writeJson(rawOutputPath, featureCollection(ordered));
  await removeIfExists(simplifiedPath);
  const intervalExpression = `${JSON.stringify(FINE_SIMPLIFY_AREAS).replaceAll('"', "'")}.includes(areaId) ? ${FINE_SIMPLIFY_METRES} : ${COARSE_SIMPLIFY_METRES}`;
  await mapshaper.runCommands(`-i ${quote(rawOutputPath)} -simplify dp variable interval="${intervalExpression}" keep-shapes -o format=geojson precision=${OUTPUT_PRECISION} ${quote(simplifiedPath)}`);
  const simplified = await readJson(simplifiedPath);
  const finalFeatures = simplified.features.map((feature) => {
    const { geometry } = cleanPolygonGeometry(feature.geometry, { minPartKm2: 0 });
    const cleaned = geometryFeature(geometry, feature.properties);
    if (!booleanValid(cleaned)) throw new Error(`${feature.properties.areaId}: invalid after simplification`);
    return cleaned;
  });
  const collection = featureCollection(finalFeatures);
  await fs.writeFile(outputAreasPath, `${JSON.stringify(collection)}\n`, "utf8");

  // Checks.
  const validity = validityRows(collection);
  const overlaps = await overlapRows(collection);
  const coverage = await coverageRows(coverageDomain, collection, explanations, COVERAGE_TOLERANCE_KM2);
  const explainedGaps = coverage.rows.filter((row) => row.explanation);
  for (const row of explainedGaps) row.explanation = `${row.explanation}: AD 69 province(s) not in M4-02's area list`;
  for (const row of coverage.rows.filter((candidate) => !candidate.explanation)) {
    const piece = geometryFeature(row.geometry);
    const touchingUnlisted = sharedBoundaryShares(piece, explainedGaps.map((gap) => geometryFeature(gap.geometry, { explanation: gap.explanation })), 0.05)[0];
    if (touchingUnlisted) {
      row.explanation = `Borders ${touchingUnlisted.candidate.properties.explanation}`;
      continue;
    }
    const touchingAreas = sharedBoundaryShares(piece, collection.features);
    if (touchingAreas.length > 0) {
      row.explanation = `Borders ${touchingAreas.map((share) => `\`${share.candidate.properties.areaId}\` (${rounded(share.share * 100)}% of its edge)`).join(" and ")} about equally; no ruling picks one`;
      continue;
    }
    const name = ISLAND_NAMES.find(([, point]) => pointInGeometry(point, row.geometry))?.[0] ?? "Island face";
    const nearest = collection.features
      .map((feature) => ({ areaId: feature.properties.areaId, distanceKm: distanceToGeometryKm(row.point, feature.geometry) }))
      .sort((left, right) => left.distanceKm - right.distanceKm)[0];
    row.explanation = `${name}: detached land that no area holds and no ruling assigns (nearest area \`${nearest.areaId}\`, ${rounded(nearest.distanceKm, 1)} km from its centre)`;
  }
  const records = await loadLocationRecordsForPlaceCheck(notes);
  const places = placeRows(records, collection);
  const jordanSites = [
    ["Qasr al-Yahud (west bank)", HEROD_ANCHORS.qasrAlYahud],
    ["Al-Maghtas (east bank)", HEROD_ANCHORS.alMaghtas]
  ].map(([name, point]) => ({
    name,
    point,
    areaIds: collection.features.filter((feature) => pointInGeometry(point, feature.geometry)).map((feature) => feature.properties.areaId),
    riverKm: Math.min(...herod.rift.coordinates.slice(1).map((coordinate, index) => distancePointToSegmentKm(point, herod.rift.coordinates[index], coordinate)))
  }));

  const anchorPoints = Object.entries(HEROD_ANCHORS).map(([name, coordinates]) => ({ name, coordinates }));
  const previewPaths = [
    await writePreviewPng(path.join(previewDirectory, "areas-italy-to-mesopotamia.png"), {
      title: `Ancient areas (${collection.features.length}) — Italy to Mesopotamia`,
      bounds: [6.5, 26, 46, 48.5],
      areas: collection
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-levant-anchors.png"), {
      title: "Levant: Herodian cuts, Gadara, Syria and Arabia, with anchor points",
      bounds: [34.15, 30.85, 37.0, 33.55],
      areas: collection,
      lines: [
        { coordinates: herod.rift.coordinates, color: "#1a4fd6" },
        { coordinates: herod.yarmukLine, color: "#1a4fd6" },
        { coordinates: GALILEE_SAMARIA_LINE, color: "#a00", dash: "6,4" },
        { coordinates: PELLA_LINE, color: "#a00", dash: "6,4" }
      ],
      points: [...anchorPoints, { name: "petra", coordinates: POINTS.petra }, { name: "bostra", coordinates: POINTS.bostra }, { name: "damascus", coordinates: POINTS.damascus }]
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-sinai-arabia.png"), {
      title: "Southern Levant, Sinai and Arabia",
      bounds: [31.5, 27.4, 38.5, 34.0],
      areas: collection,
      points: [{ name: "petra", coordinates: POINTS.petra }, { name: "bostra", coordinates: POINTS.bostra }, { name: "Mount Sinai", coordinates: POINTS.stCatherine }]
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-cilicia.png"), {
      title: "Cilicia: the Lamus divides Tracheia (west) from the plain (east)",
      bounds: [31.3, 35.8, 37.2, 38.1],
      areas: collection,
      lines: [{ coordinates: lamusSplit.line, color: "#1a4fd6" }],
      points: Object.entries({ Tarsus: POINTS.tarsus, Anazarbus: POINTS.anazarbus, Soli: POINTS.soli, Seleucia: POINTS.seleuciaCalycadnus, Olba: POINTS.olba, Corycus: POINTS.corycus, Elaeussa: POINTS.elaeussa, Laranda: POINTS.laranda, Coracesium: POINTS.coracesium, Antioch: POINTS.antioch }).map(([name, coordinates]) => ({ name, coordinates }))
    })
  ];

  const osmSummary = [
    `Jordan, relation ${OSM_RIVERS.jordan.relationId} main stream without way ${OSM_RIVERS.jordan.throughSeaOfGalileeWayId} (its course drawn through the Sea of Galilee): ${osmWayVersions(jordan)}.`,
    `Yarmuk, relation ${OSM_RIVERS.yarmuk.relationId} main stream: ${osmWayVersions(yarmuk)}.`,
    `Lamus (Limonlu Çayı), relation ${OSM_RIVERS.lamus.relationId} main stream: ${osmWayVersions(lamus)}.`,
    `Fetched from ${"https://api.openstreetmap.org/api/0.6"} and cached in ${osmCacheDirectory}; © OpenStreetMap contributors, ODbL 1.0.`
  ];
  await writeReport({
    collection,
    omitted,
    notes,
    validity,
    overlaps,
    coverage,
    places,
    jordanSites,
    previewPaths,
    osmSummary,
    simplifyNote: `Written after topology-aware Douglas–Peucker simplification (${FINE_SIMPLIFY_METRES} m for ${FINE_SIMPLIFY_AREAS.map((areaId) => `\`${areaId}\``).join(", ")}, whose borders follow the Jordan; ${COARSE_SIMPLIFY_METRES} m elsewhere) with coordinates rounded to ${OUTPUT_PRECISION}°; areas are cleaned before and after.`
  });
  console.log(`Wrote ${outputAreasPath} (${collection.features.length} areas)`);
  console.log(`Wrote ${path.join(reportDirectory, "composition-report.md")}`);
  for (const previewPath of previewPaths) console.log(`Wrote ${previewPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
