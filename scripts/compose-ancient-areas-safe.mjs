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
  OVERPASS_ENDPOINTS,
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
import { validateGeometryTopology } from "./lib/validator.mjs";
import { EXCLUDED_POST_AD100_ROADS, roadLines, selectAncientRoads } from "./lib/ancient-roads.mjs";

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

// Parts smaller than this are slivers left where two datasets' lines nearly coincide.
const MIN_PART_KM2 = 1;
// Coverage gaps up to this size are reported only as a count.
const COVERAGE_TOLERANCE_KM2 = 5;
// G10: land inside AWMC's AD 69 extent that no AWMC face covers is land to cover only where AWMC's
// shoreline doesn't run along its outline. Where it does, AWMC draws water there: a gulf that has
// silted up since antiquity (the Latmian Gulf, the bay by Ephesus), a lagoon (the Po's) or an estuary.
// A piece is water when at least AWMC_SHORE_OUTLINE_SHARE of its outline's vertices lie within
// AWMC_SHORE_TOLERANCE_KM of the shoreline, of any period; the composition report gives the margin.
const AWMC_SHORE_TOLERANCE_KM = 0.2;
const AWMC_SHORE_OUTLINE_SHARE = 0.1;
// Points in that old sea, which must stay in no area: the Fact-Checker's G10 points, and the IJ by
// Velsen, which AWMC outlines as water too (it was G4's check point when the IJ was filled).
const OLD_SEA_POINTS = [
  ["the Latmian Gulf by Miletus", [27.38, 37.55]],
  ["the Latmian Gulf towards Heraclea", [27.47, 37.5]],
  ["the old bay by Ephesus", [27.3, 37.97]],
  ["the lagoons of the Po", [12.24, 44.6]],
  ["the IJ by Velsen", [4.75, 52.42]]
];
// Douglas-Peucker tolerances for the written file: no vertex moves more than this many metres. The
// Herodian areas follow the meandering Jordan, with sites on its banks (the two Bethany candidates are
// 360 m apart, one of them a few metres from the river), so they keep a fine tolerance.
const FINE_SIMPLIFY_AREAS = ["judea-samaria-idumea", "galilee-perea", "philip-tetrarchy-lands"];
const FINE_SIMPLIFY_METRES = 25;
const COARSE_SIMPLIFY_METRES = 600;
// `other-roman-lands` lies far from our places, so its own borders are simplified more coarsely, which
// keeps the app's ancient files within their size budget; its islands within NEAR_PLACES_KM of one of
// our places (such as the Aegean's) keep COARSE_SIMPLIFY_METRES like the areas around them. Edges it
// shares with another area are simplified once, at the finer of the two tolerances, so neighbours keep
// identical edges.
const OTHER_ROMAN_LANDS_SIMPLIFY_METRES = 3500;
const NEAR_PLACES_KM = 150;
const NEAR_ISLAND_MAX_KM2 = 10000;
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
  "thrace",
  "other-roman-lands"
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
  asia: ["bib:isbe-asia", "bib:isbe-rhodes"],
  cyprus: ["awmc:roman-empire-ad-69-provinces"],
  "crete-cyrene": ["bib:isbe-crete"],
  egypt: ["bib:tacitus-annals"],
  italy: ["awmc:italy-shading", "awmc:roman-empire-ad-69-provinces"],
  sicily: ["awmc:roman-empire-ad-69-provinces"],
  illyricum: ["awmc:roman-empire-ad-69-provinces"],
  thrace: ["awmc:roman-empire-ad-69-provinces"],
  "judea-samaria-idumea": ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378"],
  "galilee-perea": ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378", "pleiades:678326", "pleiades:697728"],
  "philip-tetrarchy-lands": ["bib:josephus-jewish-war"],
  "other-roman-lands": ["awmc:roman-empire-ad-69-extent", "awmc:roman-empire-ad-69-provinces"]
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
  rome: [12.4913, 41.89],
  // Strabo 12.2.7: Mazaca, the metropolis of the Cappadocians. The label point is the one on the
  // `cappadocia` location record.
  caesareaMazaca: [35.48, 38.72],
  raphia: [34.25, 31.29],
  cappadociaLabel: [34.8392, 38.6706]
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
// Where AWMC's AD 200 Cilicia cells cut the AD 69 face, chiefly on the edge with Syria, the line is
// AD 200's, an approximation for the first century (ADR-0037 rule 3).
const CILICIA_RULE_3_NOTE = " Rule 3: where the AD 200 cells cut the AD 69 face, as on the edge with Syria, AWMC's AD 200 line is an approximation for the first century.";

// Perea ends just south of Machaerus (Josephus, War 3.3.3), so the fortress itself stays in Perea.
const MACHAERUS_CUT_MARGIN_KM = 1;

// Galatia–Cappadocia (ADR-0037 rule 2; the Research Lead's RL4 anchors, docs/research/M4-timeline.md
// §2.24, row 9). Strabo puts Tyana and Garsaura in Cappadocia's prefectures (12.1.4, 12.2.7), and Lake
// Tatta (12.5.4) and the Lycaonian cities Iconium, Lystra and Derbe, which joined Galatia in 25 BC,
// lie on Galatia's side. The line runs equidistant between the nearest anchors of the two sides.
const GALATIA_CAPPADOCIA_ANCHORS = {
  cappadocia: [
    { name: "Tyana", point: [34.5722, 37.8232], source: "pleiades:648801" },
    { name: "Garsaura", point: [34.0269, 38.3705], source: "pleiades:619164" }
  ],
  galatia: [
    { name: "Lake Tatta", point: [33.3333, 38.8333], source: "pleiades:619268" },
    { name: "Iconium", point: [32.4923, 37.8725], source: "pleiades:648647" },
    { name: "Lystra", point: [32.3445, 37.5883], source: "pleiades:648699" },
    { name: "Derbe", point: [33.3615, 37.3486], source: "pleiades:648620" }
  ]
};

// Land outside every area but joined by land to exactly one of them, and smaller than this, is a
// peninsula that AWMC's extent cut off at its neck (or the rest of an island an area already holds).
const PENINSULA_MAX_KM2 = 2000;
// Peninsulas that AWMC's coastline leaves out altogether, joined by land to one area at the neck; the
// Fact-Checker found them (docs/verification/M4-ancient-geometry.md, G7). Each point lies on the land.
const NAMED_CUT_OFF_PENINSULAS = [
  { name: "the Preveza peninsula (Nicopolis)", point: [20.738, 38.99], areaId: "achaia" },
  { name: "the Actium promontory", point: [20.774, 38.918], areaId: "achaia" },
  { name: "Sinope's peninsula (Boztepe)", point: [35.175, 42.032], areaId: "bithynia" },
  // Joined to both Macedonia and Achaia at its neck, so the Research Lead ruled on it (RL5).
  {
    name: "the Acroceraunian promontory (Karaburun)",
    point: [19.39, 40.34],
    areaId: "achaia",
    ruling: "the Research Lead's ruling RL5: Smith's Dictionary of Greek and Roman Geography, \"Epeirus\", makes the promontory Epirus's northern tip, and Cassius Dio's \"Greece with Epirus\" (27 BC) puts Epirus in Achaia",
    sources: ["bib:smith-dictionary-epeirus", "bib:cassius-dio-roman-history"]
  }
];
// Natural Earth land polygons up to this size are islands (Sicily is the largest the map draws).
const ISLAND_MAX_KM2 = 30000;
// Islands inside AWMC's AD 69 extent smaller than this are left out of `other-roman-lands`.
const MIN_ISLAND_KM2 = 5;
// ADR-0037 item 2: an island joins one of the timeline's areas only where a cited source places it
// there. These are the Research Lead's sourced islands (docs/research/M4-timeline.md §2.25, "Islands",
// quoting Smith's Dictionary of Greek and Roman Geography); every other island stays in
// `other-roman-lands`. Each point lies inside the island.
const SOURCED_ISLANDS = [
  { name: "Euboea", point: [23.78, 38.55], areaId: "achaia", citation: "Smith's Dictionary of Greek and Roman Geography, \"Euboea\": \"Under the Romans, Euboea was included in the province of Achaia.\"" },
  { name: "Brattia (Brač)", point: [16.62, 43.32], areaId: "illyricum", citation: "Smith's Dictionary of Greek and Roman Geography, \"Brattia\": \"an island off the Dalmatian coast of Illyricum.\"" },
  { name: "Curicta (Krk)", point: [14.58, 45.1], areaId: "illyricum", citation: "Smith's Dictionary of Greek and Roman Geography, \"Curicta\" (citing Pliny, Natural History 3.21): \"an island off the coast of Illyricum.\"" }
];
// Natural Earth land is clipped to this frame only to keep the computation small; the frame lies well
// outside AWMC's AD 69 extent, so no area or edge touches it. Land that reaches the frame is part of a
// land mass beyond the empire.
const ROMAN_WORLD_FRAME = "-14,18,56,60";
// Londinium and Lutetia identify Great Britain and the continent in Natural Earth's land polygons.
const BRITAIN_POINT = [-0.12, 51.51];
const CONTINENT_POINT = [2.35, 48.86];

// The empire's edge is the shared boundary between the Roman world and land beyond the empire, less any
// stretch within EDGE_COAST_TOLERANCE_KM of today's coastline and pieces shorter than EDGE_MIN_PIECE_KM.
// The report also lists its stretches within EDGE_COAST_TEST_KM of the coast (G2's test).
const EDGE_COAST_TOLERANCE_KM = 2;
const EDGE_MIN_PIECE_KM = 3;
const EDGE_COAST_TEST_KM = 5;
// Land beyond the empire is simplified with the areas under this id, then dropped.
const OUTSIDE_PSEUDO_AREA_ID = "__beyond-the-empire__";
const outputEmpireEdgePath = path.join(repositoryRoot, "data", "geo", "ancient-empire-edge.geojson");
const outputRoadsPath = path.join(repositoryRoot, "data", "geo", "ancient-roads.geojson");
const AWMC_ROADS_PATH = "Cultural-Data/roads/roads.geojson";

// Points inside AD 69 provinces that M4-02's area list leaves out. The rule-4 pass never gives their
// land to a listed area, and the coverage report names them.
const OUTSIDE_LIST_PROBES = [
  ["Pannonia", [[16.37, 45.48], [19.61, 44.98], [15.87, 46.42], [16.62, 47.23], [18.9, 47.4]]],
  ["Moesia", [[21.9, 43.32], [21.21, 44.74], [24.47, 43.7], [27.27, 44.12], [25.39, 43.61], [28.65, 44.17]]],
  ["Noricum", [[14.37, 46.7], [15.26, 46.23], [13.04, 47.8]]],
  ["Raetia", [[9.74, 47.5], [9.53, 46.85], [10.31, 47.73], [11.4, 47.27], [10.89, 48.37]]],
  ["Africa Proconsularis", [[10.32, 36.85], [10.64, 35.83], [10.71, 35.3], [14.29, 32.64], [12.48, 32.8], [13.18, 32.89], [10.1, 33.88], [9.5, 35.5], [11.0, 31.0], [10.91, 33.8], [8.12, 35.4]]],
  ["Mauretania and Numidia", [[2.19, 36.6], [-5.8, 35.77], [-1.0, 35.2], [6.6, 36.37], [5.4, 35.55]]],
  ["Sardinia et Corsica", [[9.11, 39.22], [9.5, 40.92], [9.51, 42.11]]],
  ["Gallia and the Alps", [[4.83, 45.76], [3.0, 43.18], [-0.58, 44.84], [2.35, 48.86], [6.9, 45.6], [7.03, 45.14], [9.1, 46.2], [9.6, 46.4]]],
  ["Germania", [[6.96, 50.94], [8.27, 50.0], [7.6, 47.56], [5.7, 51.8]]],
  ["Hispania", [[1.25, 41.12], [-4.78, 37.88], [-6.34, 38.92], [-3.7, 40.4], [-8.6, 42.9]]],
  ["Britannia", [[-0.09, 51.51], [0.9, 51.89], [-3.53, 50.72], [-2.89, 53.19], [-1.08, 53.96]]]
];

// Names for detached land (islands and peninsulas cut off at the neck), so the report can be read
// without a map. Each point lies inside the named land.
const LAND_NAMES = [
  ["Euboea", [23.78, 38.55]], ["Cephallenia", [20.59, 38.19]], ["Corcyra (Corfu)", [19.77, 39.72]], ["Lemnos", [25.14, 39.93]],
  ["Naxos", [25.48, 37.05]], ["Brattia (Brač)", [16.62, 43.32]], ["Curicta (Krk)", [14.58, 45.1]], ["Thasos", [24.67, 40.69]],
  ["Acte (the Athos peninsula)", [24.03, 40.35]], ["Andros", [24.88, 37.85]], ["Zacynthus", [20.79, 37.77]],
  ["Pallene (the Kassandra peninsula)", [23.43, 40.02]], ["Crexa (Cres)", [14.4, 44.85]], ["Leucas", [20.65, 38.73]],
  ["Cythera", [22.99, 36.24]], ["Imbros", [25.82, 40.16]], ["Icaria", [26.08, 37.59]], ["Carpathos", [27.16, 35.55]],
  ["the Cnidian peninsula (Datça)", [27.62, 36.72]], ["Paros", [25.2, 37.06]], ["Scyros", [24.52, 38.9]],
  ["Tenos", [25.18, 37.59]], ["Samothrace", [25.58, 40.46]], ["Ceos", [24.32, 37.62]],
  ["the Pelješac peninsula", [17.1, 43.0]], ["western Cos", [26.95, 36.74]], ["the Nile delta by Damietta", [32.0, 31.41]],
  ["the south of the Magnesia (Pelion) peninsula", [23.24, 39.16]],
  ["the Preveza peninsula (Nicopolis)", [20.738, 38.99]], ["the Actium promontory", [20.774, 38.918]],
  ["Sinope's peninsula (Boztepe)", [35.175, 42.032]], ["Pharos (Hvar)", [16.497, 43.188]],
  ["the Acroceraunian promontory (Karaburun)", [19.39, 40.34]],
  ["Corcyra (Corfu)", [20.068, 39.414]], ["Ilva (Elba)", [10.396, 42.801]], ["Cossyra (Pantelleria)", [12.031, 36.774]],
  ["the Karpas peninsula of Cyprus", [34.46, 35.62]], ["the Akrotiri peninsula of Cyprus", [32.98, 34.6]]
];

function landName(geometry, fallback) {
  return LAND_NAMES.find(([, point]) => pointInGeometry(point, geometry))?.[0] ?? fallback;
}

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
    version: `commit:${AWMC_COMMIT}; naturalearth-commit:${NATURAL_EARTH_COMMIT}${usesOsm ? "; osm: current ways read through Overpass (ids and versions in the composition report)" : ""}`,
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
  return { ...river, ways, chains, dataTimestamp: relation.osm3s?.timestamp_osm_base ?? null };
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

  // Josephus (War 3.3.3): "the length of Perea is from Machaerus to Pella". Perea ends at an east–west
  // line just south of the fortress, so Machaerus stays in Perea; the land beyond is Moab (Nabataea).
  const machaerusCutLatitude = HEROD_ANCHORS.machaerus[1] - MACHAERUS_CUT_MARGIN_KM / 110.574;
  const southOfMachaerus = geometryFeature({ type: "Polygon", coordinates: [[[35.0, machaerusCutLatitude], [37.0, machaerusCutLatitude], [37.0, 29.5], [35.0, 29.5], [35.0, machaerusCutLatitude]]] });
  const pereaSouth = await booleanOp("herod-perea-south-of-machaerus", "clip", perea, [southOfMachaerus]);
  perea = await booleanOp("herod-perea-north-of-machaerus", "erase", perea, [southOfMachaerus]);
  notes.push(`Perea ends ${MACHAERUS_CUT_MARGIN_KM} km south of Machaerus (${machaerusCutLatitude.toFixed(4)}°N): ${rounded(pereaSouth.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0))} km² south of it, Herod's outline and the AD 69 Judaea face's Dead Sea shore, go to Arabia.`);
  return { rift, yarmukLine, judea, galilee, perea, pereaSouth, machaerusCutLatitude, philip, gadara };
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
  notes.push(`Cilicia whole (AD 69 face ${f0031.properties.faceId} clipped by AD 200 cells ${cells.map((cell) => cell.cellId).join(" + ")}): ${rounded(areaKm2)} km², bbox ${bboxOf(whole.geometry).map((value) => value.toFixed(2)).join(", ")}.`);
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
// Sinai into Arabia; the coastal face between Rhinocolura and Gaza is Judea's (G11).
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

// Builds a coarse grid of line segments so that "how much of this piece's edge runs along those
// lines" can be measured quickly.
function segmentGridOfLines(lines, cellDegrees = 0.05) {
  const grid = new Map();
  for (const line of lines) {
    for (let index = 1; index < line.length; index += 1) {
      const start = line[index - 1];
      const end = line[index];
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
  return { grid, cellDegrees };
}

// The same grid for an area's boundary.
function segmentGrid(geometry, cellDegrees = 0.05) {
  return segmentGridOfLines(polygonsOf(geometry).flat(), cellDegrees);
}

// Share of a piece's outline vertices that lie within toleranceKm of the segments in `index`.
function outlineShareNear(piece, index, toleranceKm) {
  const vertices = polygonsOf(piece.geometry).flatMap((polygon) => polygon.flatMap((ring) => ring.slice(1)));
  return vertices.filter((vertex) => nearSegmentGrid(vertex, index, toleranceKm)).length / Math.max(1, vertices.length);
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
// Segment grids are cached per candidate, because large candidates are tested against many pieces.
const segmentGridCache = new WeakMap();

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
      if (!segmentGridCache.has(candidate.geometry)) segmentGridCache.set(candidate.geometry, segmentGrid(candidate.geometry));
      const index = segmentGridCache.get(candidate.geometry);
      const shared = vertices.filter((vertex) => nearSegmentGrid(vertex, index, toleranceKm)).length;
      return { candidate, share: shared / Math.max(1, vertices.length) };
    })
    .filter((row) => row.share > 0)
    .sort((left, right) => right.share - left.share);
}

// ADR-0037 rule 4: land whose border no source describes stays with the area around it. AD 69 land
// faces (or parts of them) that no area covers are given to the one area they border. Pieces that
// border nothing (islands), belong to an unlisted province (they hold one of OUTSIDE_LIST_PROBES or are
// joined to such a piece), or border two areas about equally are left for `other-roman-lands`.
async function assignLeftoverLand(built, domainFeatures, explanations, notes) {
  const leftover = await booleanOp("leftover", "erase", domainFeatures, built);
  const pieces = (await explodeFeatures("leftover", leftover)).filter((piece) => geometryAreaKm2(piece.geometry) > COVERAGE_TOLERANCE_KM2);
  const unlisted = new Set(pieces.filter((piece) => explanations.some((explanation) => pointInGeometry(explanation.point, piece.geometry))));
  let grew = true;
  while (grew) {
    grew = false;
    for (const piece of pieces) {
      if (unlisted.has(piece)) continue;
      if (sharedBoundaryShares(piece, [...unlisted], 0.05).length > 0) {
        unlisted.add(piece);
        grew = true;
      }
    }
  }
  const additions = new Map();
  for (const piece of pieces) {
    if (unlisted.has(piece)) continue;
    const shares = sharedBoundaryShares(piece, built);
    if (shares.length === 0) continue;
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

// Natural Earth land around the Roman world, as separate land polygons (continents and islands).
async function prepareRomanWorldLand() {
  const sourcePath = path.join(partitionWorkDirectory, "ne_10m_land.geojson");
  const outputPath = path.join(workDirectory, "roman-world-land.geojson");
  await removeIfExists(outputPath);
  await mapshaper.runCommands(`-i ${quote(sourcePath)} -clip bbox=${ROMAN_WORLD_FRAME} -explode -o format=geojson ${quote(outputPath)}`);
  return ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry);
}

function featureContaining(features, point) {
  return features.find((feature) => {
    const [minLon, minLat, maxLon, maxLat] = bboxOf(feature.geometry);
    return point[0] >= minLon && point[0] <= maxLon && point[1] >= minLat && point[1] <= maxLat && pointInGeometry(point, feature.geometry);
  });
}

// Great Britain and its islands: land in Britain's Natural Earth polygon, or islands in the British
// Isles' waters that lie nearer to it than to the continent (so the Channel Islands stay with Gaul).
async function britainTest(landParts) {
  const britain = featureContaining(landParts, BRITAIN_POINT);
  const continent = featureContaining(landParts, CONTINENT_POINT);
  if (!britain || !continent) throw new Error("Natural Earth land lacks Great Britain or the continent");
  const continentNearBritain = await booleanOp("continent-near-britain", "clip", [continent], [geometryFeature({ type: "Polygon", coordinates: [[[-12, 46], [10, 46], [10, 60], [-12, 60], [-12, 46]]] })]);
  return (geometry) => {
    const point = labelPoint(geometry);
    if (!point) return false;
    if (pointInGeometry(point, britain.geometry)) return true;
    if (point[1] < 49 || point[0] > 2.5) return false;
    const toBritain = distanceToGeometryKm(point, britain.geometry);
    const toContinent = Math.min(...continentNearBritain.map((part) => distanceToGeometryKm(point, part.geometry)));
    return toBritain < toContinent;
  };
}

// AWMC's AD 69 extent on Natural Earth land, minus the areas, as separate pieces.
async function extentLandOutsideAreas(tag, extentFeature, landParts, built) {
  const extentLand = await booleanOp(`${tag}-extent-land`, "clip", [extentFeature], landParts);
  return explodeFeatures(`${tag}-inside`, await booleanOp(`${tag}-inside`, "erase", extentLand, built));
}

// ADR-0037: a peninsula belongs to the area it's attached to. AWMC's extent sometimes cuts a peninsula
// off at its neck, leaving a piece of Roman land that touches no area. Where the Natural Earth land
// outside every area that holds such a piece is joined to exactly one area (and is not continent-sized),
// that land joins the area: peninsula, neck and all.
async function attachCutOffPeninsulas(built, extentFeature, landParts, notes) {
  const insidePieces = await extentLandOutsideAreas("peninsula", extentFeature, landParts, built);
  const landPieces = await explodeFeatures("peninsula-land", await booleanOp("peninsula-land", "erase", landParts, built));
  const detached = insidePieces.filter((piece) => geometryAreaKm2(piece.geometry) >= MIN_ISLAND_KM2 && sharedBoundaryShares(piece, built, 0.05).length === 0);
  const attachments = new Map();
  for (const piece of detached) {
    const landPiece = featureContaining(landPieces, labelPoint(piece.geometry));
    if (!landPiece || attachments.has(landPiece) || geometryAreaKm2(landPiece.geometry) > PENINSULA_MAX_KM2) continue;
    const shares = sharedBoundaryShares(landPiece, built, 0.05);
    if (shares.length === 0) continue;
    const [first, second] = shares;
    if (second && second.share > first.share * 0.33) {
      notes.push(`Peninsula check: land at ${labelPoint(landPiece.geometry).map((value) => value.toFixed(2)).join(", ")} is joined to two areas about equally and is left out.`);
      continue;
    }
    attachments.set(landPiece, first.candidate.properties.areaId);
  }
  // Peninsulas that AWMC's coastline leaves out altogether, so that no piece of the extent marks them.
  const rulings = new Map();
  for (const peninsula of NAMED_CUT_OFF_PENINSULAS) {
    const landPiece = featureContaining(landPieces, peninsula.point);
    if (!landPiece) {
      notes.push(`Peninsula check: ${peninsula.name} already lies in an area.`);
      continue;
    }
    if (attachments.has(landPiece)) continue;
    const touches = sharedBoundaryShares(landPiece, built, 0.05).map((share) => share.candidate.properties.areaId);
    const joined = peninsula.ruling ? touches.includes(peninsula.areaId) : touches.length === 1 && touches[0] === peninsula.areaId;
    if (geometryAreaKm2(landPiece.geometry) > PENINSULA_MAX_KM2 || !joined) {
      throw new Error(`${peninsula.name}: the land there touches ${touches.join(", ") || "no area"}, not ${peninsula.ruling ? "" : "only "}${peninsula.areaId}`);
    }
    attachments.set(landPiece, peninsula.areaId);
    if (peninsula.ruling) rulings.set(peninsula.areaId, [...(rulings.get(peninsula.areaId) ?? []), peninsula]);
  }
  const byArea = new Map();
  for (const [landPiece, areaId] of attachments) {
    if (!byArea.has(areaId)) byArea.set(areaId, []);
    byArea.get(areaId).push(landPiece);
    notes.push(`Peninsula: ${landName(landPiece.geometry, "land")} (${rounded(geometryAreaKm2(landPiece.geometry))} km² at ${labelPoint(landPiece.geometry).map((value) => value.toFixed(2)).join(", ")}) is cut off from \`${areaId}\` by AWMC's extent or coastline but joined to it by land, and joins it.`);
  }
  for (const [areaId, pieces] of byArea) {
    const index = built.findIndex((feature) => feature.properties.areaId === areaId);
    const current = built[index];
    const change = { kind: "peninsula", detail: `Adds ${pieces.map((piece) => landName(piece.geometry, "a peninsula")).join(", ")}: Natural Earth land joined to this area by land that AWMC's AD 69 extent or coastline cuts off (ADR-0037: a peninsula belongs to the area it is attached to).`, sources: ["awmc:roman-empire-ad-69-extent"] };
    const rulingChanges = (rulings.get(areaId) ?? []).map((peninsula) => ({ kind: "ruling", detail: `${peninsula.name} is joined to more than one area at its neck; it belongs here by ${peninsula.ruling}.`, sources: peninsula.sources }));
    built[index] = await finishArea(areaId, [current, ...pieces], current.properties.provenance.changes[0].detail, current.properties.provenance.upstreamFeatureIds, notes, [...current.properties.provenance.changes.slice(1), change, ...rulingChanges]);
  }
  return [...attachments.keys()];
}

// ADR-0037: an island the map draws belongs to its area as a whole. Where AWMC's extent or coastline
// leaves part of an island out (as on Corfu, Hvar or Cyprus's Karpas), the rest of the island joins the
// one area that holds the rest. Natural Earth land polygons up to ISLAND_MAX_KM2 are islands.
async function attachIslandRemainders(built, landParts, notes) {
  const islandParts = landParts.filter((part) => geometryAreaKm2(part.geometry) <= ISLAND_MAX_KM2);
  const pieces = (await explodeFeatures("island-remainders", await booleanOp("island-remainders", "erase", islandParts, built))).filter((piece) => geometryAreaKm2(piece.geometry) >= MIN_PART_KM2);
  const byArea = new Map();
  for (const piece of pieces) {
    const shares = sharedBoundaryShares(piece, built, 0.05);
    if (shares.length !== 1) continue;
    const areaId = shares[0].candidate.properties.areaId;
    if (!byArea.has(areaId)) byArea.set(areaId, []);
    byArea.get(areaId).push(piece);
  }
  for (const [areaId, areaPieces] of byArea) {
    const index = built.findIndex((feature) => feature.properties.areaId === areaId);
    const current = built[index];
    const km2 = areaPieces.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0);
    const named = [...new Set(areaPieces.map((piece) => landName(piece.geometry, null)).filter(Boolean))];
    const change = { kind: "island-remainder", detail: `Adds ${areaPieces.length} piece(s) of islands this area holds (${rounded(km2, 1)} km²${named.length > 0 ? `, among them ${named.join(", ")}` : ""}) that AWMC's extent or coastline leaves out: Natural Earth land of the same island, joined to this area only (ADR-0037: a peninsula belongs to the area it is attached to).`, sources: ["awmc:roman-empire-ad-69-extent"] };
    built[index] = await finishArea(areaId, [current, ...areaPieces], current.properties.provenance.changes[0].detail, current.properties.provenance.upstreamFeatureIds, notes, [...current.properties.provenance.changes.slice(1), change]);
    notes.push(`Island remainders: ${areaPieces.length} piece(s), ${rounded(km2, 1)} km², join \`${areaId}\`${named.length > 0 ? ` (${named.join(", ")})` : ""}.`);
  }
}

// AWMC's AD 69 lines leave thin inland strips of the extent without a face (the partition drops faces
// thinner than its sliver limit), as along the Hauran's frontier. A strip that no area holds after the
// steps above joins the area it shares the most border with: it lies inside AWMC's extent, and no line
// of AWMC's divides it from that area (ADR-0037 rule 4).
async function attachExtentSlivers(built, inlandExtentGaps, notes) {
  const left = (await explodeFeatures("extent-slivers", await booleanOp("extent-slivers", "erase", inlandExtentGaps, built))).filter((piece) => geometryAreaKm2(piece.geometry) >= MIN_PART_KM2);
  const byArea = new Map();
  for (const piece of left) {
    const shares = sharedBoundaryShares(piece, built, 0.05);
    if (shares.length === 0) continue;
    const areaId = shares[0].candidate.properties.areaId;
    if (!byArea.has(areaId)) byArea.set(areaId, []);
    byArea.get(areaId).push({ piece, shares });
  }
  for (const [areaId, entries] of byArea) {
    const index = built.findIndex((feature) => feature.properties.areaId === areaId);
    const current = built[index];
    const km2 = entries.reduce((sum, entry) => sum + geometryAreaKm2(entry.piece.geometry), 0);
    const largest = [...entries].sort((left, right) => geometryAreaKm2(right.piece.geometry) - geometryAreaKm2(left.piece.geometry))[0];
    const change = { kind: "extent-sliver", detail: `Adds ${entries.length} thin strip(s) of AWMC's AD 69 extent that no AWMC face covers (${rounded(km2, 1)} km²; the largest ${rounded(geometryAreaKm2(largest.piece.geometry), 1)} km² at ${labelPoint(largest.piece.geometry).map((value) => value.toFixed(2)).join(", ")}), each joined to the area it shares the most border with (ADR-0037 rule 4).`, sources: ["awmc:roman-empire-ad-69-extent", "awmc:roman-empire-ad-69-provinces"] };
    built[index] = await finishArea(areaId, [current, ...entries.map((entry) => entry.piece)], current.properties.provenance.changes[0].detail, current.properties.provenance.upstreamFeatureIds, notes, [...current.properties.provenance.changes.slice(1), change]);
    notes.push(`Extent strips: ${entries.length} piece(s), ${rounded(km2, 1)} km², join \`${areaId}\` (largest at ${labelPoint(largest.piece.geometry).map((value) => value.toFixed(2)).join(", ")}, ${largest.shares.map((share) => `${share.candidate.properties.areaId} ${rounded(share.share * 100)}%`).join(", ")}).`);
  }
}

// G10: AWMC's water stays out of every area, whichever step took it in; Italy's outline (AWMC's
// Italy_shading on Natural Earth land), for example, holds lagoons of the Po and of Venice. Each area
// that loses some records it in its provenance. The loss is measured from the erase itself, because
// mapshaper's clip counts a piece that only touches an area's edge as inside it.
async function leaveOutOldSea(built, oldSea, notes) {
  const seaBoxes = oldSea.map((piece) => bboxOf(piece.geometry));
  const totalKm2 = (pieces) => pieces.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0);
  for (const [index, area] of built.entries()) {
    const box = bboxOf(area.geometry);
    const nearby = oldSea.filter((piece, pieceIndex) => seaBoxes[pieceIndex][0] <= box[2] && seaBoxes[pieceIndex][2] >= box[0] && seaBoxes[pieceIndex][1] <= box[3] && seaBoxes[pieceIndex][3] >= box[1]);
    if (nearby.length === 0) continue;
    const { areaId } = area.properties;
    const rest = await booleanOp(`old-sea-${areaId}`, "erase", [area], nearby);
    const lostKm2 = geometryAreaKm2(area.geometry) - totalKm2(rest);
    // mapshaper can return nothing when it erases from a very large polygon; no area may lose more than
    // the old sea near it.
    if (rest.length === 0 || lostKm2 > totalKm2(nearby) + 1) throw new Error(`${areaId}: leaving out the old sea removed ${rounded(lostKm2, 1)} km², more than the ${rounded(totalKm2(nearby), 1)} km² of old sea near it`);
    if (lostKm2 < MIN_PART_KM2) continue;
    const change = { kind: "left-out", detail: `Leaves out ${rounded(lostKm2, 1)} km² of today's land that AWMC's shoreline outlines as water: a gulf that has silted up since antiquity, a lagoon or an estuary (G10).`, sources: ["awmc:shoreline"] };
    built[index] = await finishArea(areaId, rest, area.properties.provenance.changes[0].detail, area.properties.provenance.upstreamFeatureIds, notes, [...area.properties.provenance.changes.slice(1), change]);
    notes.push(`Old sea (G10): ${rounded(lostKm2, 1)} km² left out of \`${areaId}\`.`);
  }
  const held = oldSea.filter((piece) => built.some((area) => pointInGeometry(labelPoint(piece.geometry), area.geometry)));
  if (held.length > 0) throw new Error(`Old sea still inside an area (G10): ${held.map((piece) => `${rounded(geometryAreaKm2(piece.geometry), 1)} km² at ${labelPoint(piece.geometry).map((value) => value.toFixed(3)).join(", ")}`).join("; ")}`);
}

// Natural Earth's outline of Lake Tatta (Tuz Gölü): the lake that holds Pleiades' point for it.
async function loadLakeTatta() {
  const anchor = GALATIA_CAPPADOCIA_ANCHORS.galatia.find((entry) => entry.name === "Lake Tatta");
  const lakes = ensureFeatureCollection(await readJson(path.join(partitionWorkDirectory, "ne_10m_lakes.geojson"))).features;
  const lake = lakes.find((feature) => feature.geometry && pointInGeometry(anchor.point, feature.geometry));
  if (!lake) throw new Error("Natural Earth has no lake at Lake Tatta's point");
  const shore = polygonsOf(lake.geometry).flatMap((polygon) => polygon[0].slice(0, -1));
  const eastShore = shore.reduce((best, point) => (point[0] > best[0] ? point : best), shore[0]);
  return { shore, eastShore };
}

// Galatia–Cappadocia (rule 2): the land nearer to a Cappadocian anchor than to every Galatian one is the
// union of the Cappadocian anchors' Voronoi cells, computed in a local projection where a degree of
// longitude is scaled by cos(latitude) so that equal distances are equal. The part of Galatia in it that
// holds the Cappadocian anchors moves to Cappadocia; north of where the dividing line meets AWMC's AD 14
// edge, that edge stays (rule 3). Returns the dividing line for the preview.
async function drawGalatiaCappadociaLine(built, lakeTatta, notes) {
  const cappadociaIndex = built.findIndex((feature) => feature.properties.areaId === "cappadocia");
  const galatiaIndex = built.findIndex((feature) => feature.properties.areaId === "galatia");
  const cappadocia = built[cappadociaIndex];
  const galatia = built[galatiaIndex];
  const scale = Math.cos((38.1 * Math.PI) / 180);
  const project = ([lon, lat]) => [lon * scale, lat];
  const unproject = ([x, y]) => [x / scale, y];
  // Keeps the part of a convex ring on the side of the bisector `middle`–`normal` that `normal` points away from.
  const clipHalfPlane = (ring, middle, normal) => {
    const side = (point) => (point[0] - middle[0]) * normal[0] + (point[1] - middle[1]) * normal[1];
    const kept = [];
    for (let index = 0; index < ring.length - 1; index += 1) {
      const [start, end] = [ring[index], ring[index + 1]];
      const [startSide, endSide] = [side(start), side(end)];
      if (startSide <= 0) kept.push(start);
      if ((startSide < 0 && endSide > 0) || (startSide > 0 && endSide < 0)) {
        const t = startSide / (startSide - endSide);
        kept.push([start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])]);
      }
    }
    return kept.length > 0 ? [...kept, kept[0]] : kept;
  };
  const frame = [[26, 33], [44, 33], [44, 44], [26, 44], [26, 33]].map(project);
  // Lake Tatta is Galatian as a whole (Strabo 12.5.4), so every point of its shore (Natural Earth's lake
  // outline) is a Galatian anchor too, not only Pleiades' point in the middle of it.
  const galatianSites = [...GALATIA_CAPPADOCIA_ANCHORS.galatia.map((anchor) => anchor.point), ...lakeTatta.shore];
  const cells = GALATIA_CAPPADOCIA_ANCHORS.cappadocia.map((anchor) => {
    const own = project(anchor.point);
    let ring = frame;
    for (const site of galatianSites) {
      const theirs = project(site);
      ring = clipHalfPlane(ring, [(own[0] + theirs[0]) / 2, (own[1] + theirs[1]) / 2], [theirs[0] - own[0], theirs[1] - own[1]]);
    }
    return geometryFeature({ type: "Polygon", coordinates: [ring.map(unproject)] });
  });
  const cappadocianSide = await unionFeatures("galatia-cappadocia-side", cells);
  const pieces = await explodeFeatures("galatia-cappadocia-moved", await booleanOp("galatia-cappadocia-moved", "clip", [galatia], [cappadocianSide]));
  const moved = pieces.filter((piece) => GALATIA_CAPPADOCIA_ANCHORS.cappadocia.some((anchor) => pointInGeometry(anchor.point, piece.geometry)));
  if (moved.length === 0) throw new Error("Galatia–Cappadocia: no part of Galatia holds a Cappadocian anchor");
  const galatiaRest = await booleanOp("galatia-cappadocia-rest", "erase", [galatia], moved);
  const movedKm2 = moved.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0);
  const names = (side) => side.map((anchor) => anchor.name).join(", ");
  const detail = `Galatia–Cappadocia (rule 2; the Research Lead's RL4 anchors): the line runs equidistant between the nearest anchors of the two sides, ${names(GALATIA_CAPPADOCIA_ANCHORS.cappadocia)} in Cappadocia's prefectures (Strabo 12.1.4, 12.2.7) and ${names(GALATIA_CAPPADOCIA_ANCHORS.galatia)} on Galatia's side (Lake Tatta, all of whose shore counts, Strabo 12.5.4; Lycaonia's cities joined Galatia in 25 BC), in straight segments from where it meets AWMC's AD 14 edge north-east of Lake Tatta to Galatia's southern border. The land east of it, ${rounded(movedKm2)} km² with Tyana and Garsaura, belongs to Cappadocia; north of that meeting point the edge is still AWMC's AD 14 extent (rule 3). Strabo gives the districts, not the line, so the exact course between the anchors is approximate.`;
  const sources = ["bib:strabo-geography", ...[...GALATIA_CAPPADOCIA_ANCHORS.cappadocia, ...GALATIA_CAPPADOCIA_ANCHORS.galatia].map((anchor) => anchor.source).filter(Boolean)];
  const change = { kind: "described-line", detail, sources };
  built[cappadociaIndex] = await finishArea("cappadocia", [cappadocia, ...moved], cappadocia.properties.provenance.changes[0].detail, cappadocia.properties.provenance.upstreamFeatureIds, notes, [...cappadocia.properties.provenance.changes.slice(1), change]);
  built[galatiaIndex] = await finishArea("galatia", galatiaRest, galatia.properties.provenance.changes[0].detail, galatia.properties.provenance.upstreamFeatureIds, notes, [...galatia.properties.provenance.changes.slice(1), change]);
  assertInside(built[cappadociaIndex], Object.fromEntries([...GALATIA_CAPPADOCIA_ANCHORS.cappadocia.map((anchor) => [anchor.name, anchor.point]), ["Caesarea Mazaca", POINTS.caesareaMazaca]]), "cappadocia");
  assertInside(built[galatiaIndex], Object.fromEntries([...GALATIA_CAPPADOCIA_ANCHORS.galatia.map((anchor) => [anchor.name, anchor.point]), ["Lake Tatta's east shore", lakeTatta.eastShore]]), "galatia");
  notes.push(`Galatia–Cappadocia: ${rounded(movedKm2)} km² east of the anchor line move from Galatia to Cappadocia.`);
  // The border as drawn: the edge between the land that moved and the rest of Galatia.
  const borderInput = path.join(workDirectory, "galatia-cappadocia-border-input.geojson");
  const borderOutput = path.join(workDirectory, "galatia-cappadocia-border.geojson");
  await writeJson(borderInput, featureCollection([geometryFeature((await unionFeatures("galatia-cappadocia-moved-union", moved)).geometry, { side: "cappadocia" }), ...galatiaRest.map((piece) => geometryFeature(piece.geometry, { side: "galatia" }))]));
  await removeIfExists(borderOutput);
  await mapshaper.runCommands(`-i ${quote(borderInput)} snap -innerlines where="A.side != B.side" -o format=geojson ${quote(borderOutput)}`);
  return ensureFeatureCollection(await readJson(borderOutput)).features.flatMap((feature) => roadLines(feature.geometry));
}

// A piece is coastal when part of its outline is today's coastline (Natural Earth's land outlines).
function isCoastalPiece(piece, landParts) {
  return sharedBoundaryShares(piece, landParts, 0.1).some((share) => share.share >= 0.05);
}

// AWMC's AD 69 extent on land, less its land faces: inland pieces only (coastal ones are slivers where
// AWMC's coastline and Natural Earth's differ). Pieces whose outline runs along AWMC's shoreline are
// water in AWMC's geography, such as gulfs that have silted up since antiquity, and are returned apart
// with their share of outline on the shoreline (G10).
async function inlandExtentLandWithoutFaces(extentFeature, facesInside, landParts, awmcShore) {
  const extentLand = await booleanOp("extent-land", "clip", [extentFeature], landParts);
  const faces = await unionFeatures("extent-faces", facesInside);
  const pieces = await explodeFeatures("extent-without-faces", await booleanOp("extent-without-faces", "erase", extentLand, [faces]));
  const inland = pieces
    .filter((piece) => geometryAreaKm2(piece.geometry) >= MIN_PART_KM2 && !isCoastalPiece(piece, landParts))
    .map((piece) => ({ piece, shoreShare: outlineShareNear(piece, awmcShore, AWMC_SHORE_TOLERANCE_KM) }));
  const land = inland.filter((row) => row.shoreShare < AWMC_SHORE_OUTLINE_SHARE);
  return { land: land.map((row) => row.piece), water: inland.filter((row) => !land.includes(row)), largestLandShare: Math.max(0, ...land.map((row) => row.shoreShare)) };
}

// ADR-0037: Roman land that isn't one of the timeline's areas is `other-roman-lands`, held by the Roman
// Empire. It is AWMC's AD 69 land faces inside the extent, less the areas, plus the islands inside the
// extent that no area holds, less Great Britain and its islands (Roman only from AD 43). Using AWMC's
// faces keeps its coastline the same as its neighbours', so no slivers run along their coasts. Land
// inside the extent that no face covers (where AWMC draws a river as water, as along the Danube by
// Carsium, or where the partition dropped a thin face) joins it too when it touches its faces and
// either touches no other area or lies inland (G4), unless AWMC's shoreline outlines it as water (G10).
async function buildOtherRomanLands(built, ad69Raw, extentFeature, landParts, isBritain, awmcShore, notes) {
  const facesInside = ad69Raw.features.filter((feature) => {
    const point = labelPoint(feature.geometry);
    return point && pointInGeometry(point, extentFeature.geometry);
  });
  const fromFaces = await booleanOp("other-roman-lands-faces", "erase", facesInside, built);
  const insidePieces = await extentLandOutsideAreas("other-roman-lands", extentFeature, landParts, built);
  const islands = insidePieces.filter((piece) => geometryAreaKm2(piece.geometry) >= MIN_ISLAND_KM2 && sharedBoundaryShares(piece, built, 0.05).length === 0);
  const faceUnion = await unionFeatures("other-roman-lands-face-union", fromFaces);
  const uncovered = await explodeFeatures("other-roman-lands-uncovered", await booleanOp("other-roman-lands-uncovered", "erase", insidePieces, [faceUnion]));
  const isOldSea = (piece) => !isCoastalPiece(piece, landParts) && outlineShareNear(piece, awmcShore, AWMC_SHORE_TOLERANCE_KM) >= AWMC_SHORE_OUTLINE_SHARE;
  const extentGaps = uncovered.filter((piece) => sharedBoundaryShares(piece, [faceUnion], 0.05).length > 0 && (sharedBoundaryShares(piece, built, 0.05).length === 0 || !isCoastalPiece(piece, landParts)) && !isOldSea(piece));
  const extentGapKm2 = extentGaps.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0);
  const parts = await explodeFeatures("other-roman-lands-parts", [await unionFeatures("other-roman-lands-sources", [...fromFaces, ...extentGaps, ...islands])]);
  const britain = parts.filter((part) => isBritain(part.geometry));
  const kept = parts.filter((part) => !isBritain(part.geometry));
  const britainKm2 = britain.reduce((sum, part) => sum + geometryAreaKm2(part.geometry), 0);
  notes.push(`other-roman-lands: ${facesInside.length} AD 69 land faces inside the extent less the areas, plus ${extentGaps.length} piece(s) of the extent's land that no face covers (${rounded(extentGapKm2)} km²), plus ${islands.length} island piece(s) of ${MIN_ISLAND_KM2} km² or more; Great Britain and its islands left out (${britain.length} part(s), ${rounded(britainKm2)} km²).`);
  return finishArea(
    "other-roman-lands",
    kept,
    "AWMC's AD 69 extent on land (its AD 69 land faces, the extent's land that no face covers where it touches them, unless AWMC's shoreline outlines it as water, and islands from Natural Earth land), less the 23 timeline areas and less Great Britain and its islands. Rule 3: the extent's edge is AWMC's, an approximation for the whole period.",
    ["awmc:roman-empire-ad-69-extent", "awmc:roman-empire-ad-69-provinces"],
    notes,
    [{ kind: "left-out", detail: `Great Britain and its islands (${rounded(britainKm2)} km²) are left out: Rome conquered Britain from AD 43, after the timeline begins (ADR-0037).`, sources: ["awmc:roman-empire-ad-69-extent"] }]
  );
}

// AWMC's AD 69 lines leave thin faces where they do not quite meet, and the partition drops faces thinner
// than its sliver limit, but the coverage domain (AWMC's land faces, dissolved) still holds that land.
// A gap that touches `other-roman-lands` is part of the extent less the other areas (ADR-0037 item 1),
// so it joins it. Britain stays out.
async function fillRomanWorldGaps(built, coverageDomain, isBritain, notes) {
  const otherIndex = built.findIndex((feature) => feature.properties.areaId === "other-roman-lands");
  const other = built[otherIndex];
  const { rows } = await coverageRows(coverageDomain, featureCollection(built), [], 0);
  const gaps = rows.filter((row) => !isBritain(row.geometry) && sharedBoundaryShares(geometryFeature(row.geometry), [other], 0.05).length > 0);
  if (gaps.length === 0) return;
  const gapKm2 = gaps.reduce((sum, row) => sum + row.areaKm2, 0);
  const largest = gaps[0];
  const change = { kind: "extent-gaps", detail: `Adds ${gaps.length} gap(s) inside AWMC's AD 69 extent (${rounded(gapKm2, 1)} km² in all; the largest, ${rounded(largest.areaKm2, 1)} km² at ${largest.point.map((value) => value.toFixed(2)).join(", ")}) where AWMC's lines do not quite meet and no area holds the land (ADR-0037 item 1: the extent less the other areas).`, sources: ["awmc:roman-empire-ad-69-extent", "awmc:roman-empire-ad-69-provinces"] };
  built[otherIndex] = await finishArea("other-roman-lands", [other, ...gaps.map((row) => geometryFeature(row.geometry))], other.properties.provenance.changes[0].detail, other.properties.provenance.upstreamFeatureIds, notes, [...other.properties.provenance.changes.slice(1), change]);
  notes.push(`other-roman-lands: ${change.detail}`);
}

// Moves each sourced island (SOURCED_ISLANDS) from `other-roman-lands` to the area its source names.
// The island must be a separate part of `other-roman-lands` that touches no other area.
async function assignSourcedIslands(built, notes) {
  const otherIndex = built.findIndex((feature) => feature.properties.areaId === "other-roman-lands");
  const other = built[otherIndex];
  const neighbours = built.filter((feature) => feature !== other);
  const remaining = [];
  const moves = new Map();
  for (const polygon of polygonsOf(other.geometry)) {
    const part = geometryFeature({ type: "Polygon", coordinates: polygon });
    const island = SOURCED_ISLANDS.find((entry) => pointInGeometry(entry.point, part.geometry));
    if (!island) {
      remaining.push(part);
      continue;
    }
    if (sharedBoundaryShares(part, neighbours, 0.05).length > 0) throw new Error(`${island.name} is not a separate island in other-roman-lands`);
    if (!moves.has(island.areaId)) moves.set(island.areaId, []);
    moves.get(island.areaId).push({ island, part });
  }
  const found = [...moves.values()].flat().map(({ island }) => island.name);
  const missing = SOURCED_ISLANDS.filter((entry) => !found.includes(entry.name));
  if (missing.length > 0) throw new Error(`Sourced island(s) not found in other-roman-lands: ${missing.map((entry) => entry.name).join(", ")}`);
  for (const [areaId, entries] of moves) {
    const index = built.findIndex((feature) => feature.properties.areaId === areaId);
    const current = built[index];
    const detail = entries.map(({ island, part }) => `${island.name} (${rounded(geometryAreaKm2(part.geometry))} km²): ${island.citation}`).join(" ");
    const change = { kind: "sourced-island", detail: `Adds ${entries.length === 1 ? "an island" : "islands"} that a cited source places in this area (ADR-0037 item 2; the Research Lead's §2.25 "Islands" table). ${detail}`, sources: ["awmc:roman-empire-ad-69-extent"] };
    built[index] = await finishArea(areaId, [current, ...entries.map(({ part }) => part)], current.properties.provenance.changes[0].detail, current.properties.provenance.upstreamFeatureIds, notes, [...current.properties.provenance.changes.slice(1), change]);
    for (const { island, part } of entries) notes.push(`Sourced island: ${island.name} (${rounded(geometryAreaKm2(part.geometry))} km²) moves from \`other-roman-lands\` to \`${areaId}\`.`);
  }
  const movedNames = SOURCED_ISLANDS.map((entry) => `${entry.name} (\`${entry.areaId}\`)`).join(", ");
  const otherChange = { kind: "sourced-islands-moved", detail: `${movedNames} are left to the areas a cited source places them in (the Research Lead's §2.25 "Islands" table); every other island inside the extent stays here (ADR-0037 item 2).`, sources: ["awmc:roman-empire-ad-69-extent"] };
  built[otherIndex] = await finishArea("other-roman-lands", remaining, other.properties.provenance.changes[0].detail, other.properties.provenance.upstreamFeatureIds, notes, [...other.properties.provenance.changes.slice(1), otherChange]);
}

// The frame's sides, from ROMAN_WORLD_FRAME. Land touching them runs on beyond the map's frame.
const [FRAME_MIN_LON, FRAME_MIN_LAT, FRAME_MAX_LON, FRAME_MAX_LAT] = ROMAN_WORLD_FRAME.split(",").map(Number);

function touchesFrame(geometry) {
  const onSide = ([lon, lat]) => Math.abs(lon - FRAME_MIN_LON) < 1e-6 || Math.abs(lon - FRAME_MAX_LON) < 1e-6 || Math.abs(lat - FRAME_MIN_LAT) < 1e-6 || Math.abs(lat - FRAME_MAX_LAT) < 1e-6;
  return polygonsOf(geometry).some((polygon) => polygon[0].some(onSide));
}

// Natural Earth land outside every area, sorted into land beyond the empire (pieces of the land masses
// that run on past the frame, such as Germania, the Sahara or Arabia), enclosed land (pieces that Roman
// land and the sea surround, such as the marshes at the Guadalquivir's mouth or slivers where AWMC's
// coastline and Natural Earth's differ) and islands that touch no area (Great Britain, or islands
// outside AWMC's extent). Only land beyond the empire has an edge with the Roman world (G2, G3).
// `waterFeatures` is today's land that AWMC draws as water (G10): it is neither, so where it reaches
// the frontier, as the IJ does, it doesn't join the land beyond it.
async function classifyOutsideLand(tag, areaFeatures, landParts, waterFeatures = []) {
  const romanWorld = await unionFeatures(`${tag}-roman-world`, [...areaFeatures, ...waterFeatures]);
  const pieces = await explodeFeatures(`${tag}-outside`, await booleanOp(`${tag}-outside`, "erase", landParts, [romanWorld]));
  const beyond = [];
  const enclosed = [];
  const islands = [];
  for (const piece of pieces) {
    if (touchesFrame(piece.geometry)) beyond.push(piece);
    else if (sharedBoundaryShares(piece, [romanWorld], 0.05).length > 0) enclosed.push(piece);
    else islands.push(piece);
  }
  return { romanWorld, beyond, enclosed, islands };
}

// Lengths of the edge's stretches that run within `withinKm` of today's coastline (G2's test: none of
// them should be longer than about 10 km). Distances use a 0.1° grid of Natural Earth's land outlines.
function coastHuggingStretches(lines, landParts, withinKm) {
  const grids = landParts.map((part) => ({ box: bboxOf(part.geometry), grid: segmentGrid(part.geometry, 0.1) }));
  const nearCoast = (point) => grids.some(({ box, grid }) => point[0] >= box[0] - 0.1 && point[0] <= box[2] + 0.1 && point[1] >= box[1] - 0.1 && point[1] <= box[3] + 0.1 && nearSegmentGrid(point, grid, withinKm));
  const stretches = [];
  for (const line of lines) {
    let start = null;
    let lengthKm = 0;
    for (let index = 0; index < line.length; index += 1) {
      const near = nearCoast(line[index]);
      if (near && start === null) {
        start = line[index];
        lengthKm = 0;
      } else if (near) {
        lengthKm += distanceKm(line[index - 1], line[index]);
      }
      if ((!near || index === line.length - 1) && start !== null) {
        stretches.push({ start, lengthKm });
        start = null;
      }
    }
  }
  return stretches.sort((left, right) => right.lengthKm - left.lengthKm);
}

// The empire's edge (ADR-0037): where the Roman world's land meets land beyond the empire. Land beyond
// the empire was simplified in the same topology as the areas, so the edge is exactly their shared
// boundary and follows AWMC's line within the areas' tolerance (G4). Stretches within
// EDGE_COAST_TOLERANCE_KM of today's coastline are left out, and the pieces left must be at least
// EDGE_MIN_PIECE_KM long.
async function buildEmpireEdge(simplifiedPath, areaCount, landParts, notes) {
  const rawPath = path.join(workDirectory, "empire-edge-raw.geojson");
  await removeIfExists(rawPath);
  await mapshaper.runCommands(`-i ${quote(simplifiedPath)} -innerlines where="A.side != B.side" -o format=geojson ${quote(rawPath)}`);
  const rawLines = ensureFeatureCollection(await readJson(rawPath)).features.flatMap((feature) => (feature.geometry?.type === "LineString" ? [feature.geometry.coordinates] : feature.geometry?.type === "MultiLineString" ? feature.geometry.coordinates : []));
  const coastGrids = landParts.map((part) => ({ box: bboxOf(part.geometry), part }));
  const nearCoast = (point) => coastGrids.some(({ box, part }) => {
    const margin = 0.05;
    if (point[0] < box[0] - margin || point[0] > box[2] + margin || point[1] < box[1] - margin || point[1] > box[3] + margin) return false;
    if (!segmentGridCache.has(part.geometry)) segmentGridCache.set(part.geometry, segmentGrid(part.geometry));
    return nearSegmentGrid(point, segmentGridCache.get(part.geometry), EDGE_COAST_TOLERANCE_KM);
  });
  const pieces = [];
  for (const line of rawLines) {
    let run = [];
    const flush = () => {
      const lengthKm = run.slice(1).reduce((sum, point, index) => sum + distanceKm(run[index], point), 0);
      if (run.length >= 2 && lengthKm >= EDGE_MIN_PIECE_KM) pieces.push(run.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))]));
      run = [];
    };
    for (const point of line) {
      if (nearCoast(point)) flush();
      else run.push(point);
    }
    flush();
  }
  const lengthKm = pieces.reduce((sum, piece) => sum + piece.slice(1).reduce((total, point, index) => total + distanceKm(piece[index], point), 0), 0);
  const edge = featureCollection([
    geometryFeature(
      { type: "MultiLineString", coordinates: pieces },
      {
        edgeId: "roman-world-ad-69",
        provenance: {
          dataset: "AWMC geodata; Natural Earth",
          version: `commit:${AWMC_COMMIT}; naturalearth-commit:${NATURAL_EARTH_COMMIT}`,
          upstreamFeatureIds: ["awmc:roman-empire-ad-69-extent"],
          changes: [
            {
              kind: "union-boundary",
              detail: `Where the union of all ${areaCount} areas (AWMC's AD 69 extent and the timeline areas on Natural Earth land) meets Natural Earth land beyond the empire: land that runs on past the map's frame. Land that Roman land and the sea enclose, such as the marshes at the Guadalquivir's mouth or slivers between AWMC's coastline and today's, is not land beyond the empire. Stretches within ${EDGE_COAST_TOLERANCE_KM} km of today's coastline are left out. Static: every area is on Rome's side in every year; before AD 9 it follows the Rhine rather than the Elbe, an approximation (ADR-0037).`,
              sources: ["awmc:roman-empire-ad-69-extent", "awmc:roman-empire-ad-69-provinces"]
            }
          ]
        }
      }
    )
  ]);
  await fs.writeFile(outputEmpireEdgePath, `${JSON.stringify(edge)}\n`, "utf8");
  const coastStretches = coastHuggingStretches(pieces, landParts, EDGE_COAST_TEST_KM);
  notes.push(`Empire edge: ${pieces.length} piece(s), ${rounded(lengthKm)} km. Longest stretch within ${EDGE_COAST_TEST_KM} km of today's coast: ${coastStretches[0] ? `${rounded(coastStretches[0].lengthKm, 1)} km from ${coastStretches[0].start.map((value) => value.toFixed(2)).join(", ")}` : "none"}.`);
  return { edge, lengthKm, pieceCount: pieces.length, coastStretches };
}

// Roads stop where the drawn Roman world ends (G5): the parts on land beyond the empire, or on islands
// that no area holds, are cut off. Enclosed land keeps its roads, which gives a tolerance at coasts
// where AWMC's coastline and Natural Earth's differ.
async function clipRoadsToRomanWorld(roads, outsideLand, notes) {
  const mask = [...outsideLand.beyond, ...outsideLand.islands];
  const roadsPath = path.join(workDirectory, "roads-selected.geojson");
  const maskPath = path.join(workDirectory, "roads-clip-mask.geojson");
  const outputPath = path.join(workDirectory, "roads-clipped.geojson");
  await writeJson(roadsPath, featureCollection(roads.features.map((feature) => geometryFeature(feature.geometry, { roadId: feature.properties.roadId }))));
  await writeJson(maskPath, featureCollection(mask.map((piece) => geometryFeature(piece.geometry))));
  await removeIfExists(outputPath);
  await mapshaper.runCommands(`-i ${quote(roadsPath)} name=roads -i ${quote(maskPath)} name=mask -target roads -erase mask -o format=geojson ${quote(outputPath)}`);
  const clippedById = new Map(ensureFeatureCollection(await readJson(outputPath)).features.filter((feature) => feature.geometry).map((feature) => [feature.properties.roadId, feature.geometry]));
  const lineLengthKm = (geometry) => roadLines(geometry).reduce((sum, line) => sum + line.slice(1).reduce((total, point, index) => total + distanceKm(line[index], point), 0), 0);
  const kept = [];
  const dropped = [];
  const shortened = [];
  for (const feature of roads.features) {
    const beforeKm = lineLengthKm(feature.geometry);
    const clipped = clippedById.get(feature.properties.roadId);
    const afterKm = clipped ? lineLengthKm(clipped) : 0;
    if (afterKm < 0.1) {
      dropped.push({ roadId: feature.properties.roadId, lengthKm: beforeKm });
      continue;
    }
    const removedKm = beforeKm - afterKm;
    const changes = [...feature.properties.provenance.changes];
    if (removedKm >= 0.05) {
      shortened.push({ roadId: feature.properties.roadId, removedKm });
      changes.push({ kind: "clip", detail: `Clipped to the drawn Roman world: ${rounded(removedKm, 1)} km on land beyond the empire or on islands no area holds left out (ADR-0037 rule 5).`, sources: ["awmc:roman-empire-ad-69-extent"] });
    }
    kept.push({
      ...feature,
      properties: { ...feature.properties, provenance: { ...feature.properties.provenance, changes } },
      geometry: { type: "MultiLineString", coordinates: roadLines(clipped).map((line) => line.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))])) }
    });
  }
  notes.push(`Roads: clipped to the drawn Roman world: ${shortened.length} shortened (${rounded(shortened.reduce((sum, row) => sum + row.removedKm, 0))} km left out), ${dropped.length} left out entirely${dropped.length > 0 ? ` (${dropped.map((row) => `${row.roadId}, ${rounded(row.lengthKm)} km`).join("; ")})` : ""}.`);
  return { roads: featureCollection(kept), shortened, dropped };
}

function summarizeRoads(selectedRoads, roadClip, excludedRoadIds) {
  const lengthKm = (geometry) => roadLines(geometry).reduce((sum, line) => sum + line.slice(1).reduce((total, point, index) => total + distanceKm(line[index], point), 0), 0);
  const kept = roadClip.roads.features;
  const known = kept.filter((feature) => feature.properties.known);
  const totals = {
    count: kept.length,
    km: kept.reduce((sum, feature) => sum + lengthKm(feature.geometry), 0),
    knownCount: known.length,
    selectedCount: selectedRoads.features.length,
    excludedRoadIds
  };
  totals.text = `${kept.length} AWMC major roads of the Roman period kept (${rounded(totals.km)} km); ${totals.knownCount} known, ${kept.length - totals.knownCount} conjectured. Minor roads are left out (ADR-0037's update of 2026-10-08). Left out as later than AD 100: ${excludedRoadIds.join(", ")}. Clipping shortened ${roadClip.shortened.length} and dropped ${roadClip.dropped.length}.`;
  return totals;
}

async function buildItaly(culturalRoot, ad69Raw, notes) {
  // Italy is the AD 69 faces that lie within AWMC's own outline of Roman Italy (Italy_shading), united
  // with that outline on land. Picking faces by a box once took in half of Sardinia and Corsica and the
  // Alpine provinces.
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

// Location records with `politicalAreaId` links, from this branch's data/locations.
async function loadLocationRecordsForPlaceCheck(notes) {
  const directory = path.join(repositoryRoot, "data", "locations");
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith(".json"));
  const records = await Promise.all(files.map((file) => readJson(path.join(directory, file))));
  const linked = records.filter((record) => record.politicalAreaId || (record.candidates ?? []).some((candidate) => candidate.politicalAreaId)).length;
  notes.push(`Place check uses the ${files.length} location records in data/locations, ${linked} of them linked to an area.`);
  return records;
}

// Sites the Fact-Checker's fixes name (docs/verification/M4-ancient-geometry.md): the Raetian towns inside
// AWMC's AD 69 extent that a dissolve bug had left out (G1), Carsium on the edge (G4) and Raphia's coast
// (G11); and the Research Lead's rulings on its RL items (docs/research/M4-timeline.md §2.25): Asia's
// islands (RL2) and Karaburun (RL5). Each must lie in its area.
const VERIFICATION_ANCHORS = [
  ["Turicum (Zürich)", [8.54, 47.37], "other-roman-lands"],
  ["Vitudurum (Winterthur)", [8.75, 47.51], "other-roman-lands"],
  ["Ad Fines (Pfyn)", [8.95, 47.6], "other-roman-lands"],
  ["Arbor Felix (Arbon)", [9.43, 47.52], "other-roman-lands"],
  ["Veldidena (Innsbruck)", [11.4, 47.25], "other-roman-lands"],
  ["the Raetian gap's centre", [9.38, 47.39], "other-roman-lands"],
  ["Carsium (Hârșova)", [27.95, 44.68], "other-roman-lands"],
  ["Lesbos", [26.3, 39.3], "asia"],
  ["Chios", [25.98, 38.4], "asia"],
  ["Samos", [26.8, 37.73], "asia"],
  ["Cos", [27.15, 36.83], "asia"],
  ["Rhodes", [28.0, 36.2], "asia"],
  ["Raphia, on the coast between Rhinocolura and Gaza", [34.25, 31.29], "judea-samaria-idumea"],
  ["Karaburun (the Acroceraunian promontory)", [19.39, 40.34], "achaia"]
];

// Explanations for place-check results that are not border-precision issues.
const PLACE_EXPLANATIONS = {
  pisidia: "Label point for the region. The research note keeps AWMC's whole AD 14 'Pamphylia' face with `pamphylia`, so southern Pisidia's hills are drawn there; the point is in that face, not in Galatia's.",
  "malta candidate 1": "The alternative identification of Melita, Mljet in the Adriatic, lies outside AWMC's AD 69 extent, which leaves out several Dalmatian islands, so no area holds it. The record links the place, not each candidate, to `sicily`.",
  nicopolis: "Coastal city on the Preveza isthmus: AWMC's coastline at the Ambracian Gulf leaves it in the sea (a boundary-precision issue, per the research note's Nicopolis ruling).",
  "sea-of-galilee": "Label point for the lake, 0.9 km east of the median line that divides the lake between Galilee and Philip's lands."
};

function placeExplanation(row) {
  const specific = PLACE_EXPLANATIONS[row.label] ?? PLACE_EXPLANATIONS[row.label.split(" candidate")[0]];
  if (specific) return specific;
  if (row.status === "near-border" && row.actualAreaIds.length === 0) return "Coastal site just beyond AWMC's coastline of its area.";
  return "";
}

async function writeReport({ collection, omitted, notes, validity, overlaps, compositionCoverage, coverage, oldSea, places, jordanSites, anchorChecks, empireEdge, outsideLandNote, roadSummary, roadClip, previewPaths, osmSummary, simplifyNote }) {
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
  const coverageTable = (coverageResult) => {
    lines.push("| Gap km² | Centre (lon, lat) | Explanation |", "|---:|---|---|");
    for (const row of coverageResult.rows) lines.push(`| ${rounded(row.areaKm2, 1)} | ${row.point.map((value) => value.toFixed(3)).join(", ")} | ${row.explanation ?? "**unexplained**"} |`);
  };
  lines.push("", "## Coverage", "", `Domain: AWMC's AD 69 land faces inside the AD 69 extent (Natural Earth land cut by AWMC's lines; the partition's frame lies outside the extent), plus Nabataea and Sinai outside it.`);
  lines.push("", "### Composition (before simplification)", "", `Gaps larger than ${COVERAGE_TOLERANCE_KM2} km²: ${compositionCoverage.rows.length}. Gaps of ${COVERAGE_TOLERANCE_KM2} km² or less: ${compositionCoverage.smallCount} (${rounded(compositionCoverage.smallKm2, 1)} km² in all).`, "");
  coverageTable(compositionCoverage);
  const sliverRows = coverage.rows.filter((row) => !row.britain);
  lines.push("", "### Written file (after simplification)", "", `Gaps larger than ${COVERAGE_TOLERANCE_KM2} km² other than Britain: ${sliverRows.length} (${rounded(sliverRows.reduce((sum, row) => sum + row.areaKm2, 0))} km² in all; largest ${sliverRows[0] ? `${rounded(sliverRows[0].areaKm2, 1)} km²` : "none"}). Gaps of ${COVERAGE_TOLERANCE_KM2} km² or less: ${coverage.smallCount} (${rounded(coverage.smallKm2, 1)} km² in all). Gaps that the composition does not have are slivers between a simplified outer edge (coast or frontier) and AWMC's land faces.`, "");
  coverageTable(coverage);
  const shares = oldSea.rows.map((row) => row.shoreShare * 100);
  lines.push("", "### Old sea left out (G10)", "", `Inside AWMC's AD 69 extent, ${oldSea.rows.length} piece(s) of today's land that no AWMC face covers (${rounded(oldSea.rows.reduce((sum, row) => sum + row.km2, 0))} km²) have AWMC's shoreline along ${rounded(Math.min(...shares))}–${rounded(Math.max(...shares))}% of their outline; the land to cover has at most ${rounded(oldSea.largestLandShare * 100)}%.   AWMC draws water there: gulfs that have silted up since antiquity, lagoons and estuaries. They are not land to cover, and an area that another step gave some of this land to leaves it out again, which its provenance records; before simplification, no area holds any of their centres. In the written file, simplification can cover the centre of a small piece where \`other-roman-lands\`' outline is simplified to ${OTHER_ROMAN_LANDS_SIMPLIFY_METRES / 1000} km, far from our places. Pieces larger than ${COVERAGE_TOLERANCE_KM2} km²:`, "");
    lines.push("| km² | Centre (lon, lat) | Outline on AWMC's shoreline | Area at the centre in the written file |", "|---:|---|---:|---|");
  for (const row of oldSea.rows.filter((entry) => entry.km2 > COVERAGE_TOLERANCE_KM2).sort((left, right) => right.km2 - left.km2)) {
    lines.push(`| ${rounded(row.km2, 1)} | ${row.point.map((value) => value.toFixed(3)).join(", ")} | ${rounded(row.shoreShare * 100)}% | ${row.areaIds.map((areaId) => `\`${areaId}\``).join(", ") || "none"} |`);
  }
  lines.push("", "Points that must stay in no area:", "");
  for (const check of oldSea.checks) lines.push(`- ${check.name} (${check.point.join(", ")}): ${check.areaIds.length === 0 ? "in no area" : `in ${check.areaIds.map((areaId) => `\`${areaId}\``).join(", ")}`}.`);
  lines.push("", "## Empire edge", "", `\`data/geo/ancient-empire-edge.geojson\`: ${empireEdge.pieceCount} piece(s), ${rounded(empireEdge.lengthKm)} km in all, where the union of the ${collection.features.length} areas meets Natural Earth land beyond the empire (land that runs on past the map's frame), less stretches within ${EDGE_COAST_TOLERANCE_KM} km of today's coastline. ${outsideLandNote}`);
  const longCoastStretches = empireEdge.coastStretches.filter((stretch) => stretch.lengthKm > 10);
  lines.push("", `Stretches of the edge within ${EDGE_COAST_TEST_KM} km of today's coast (G2's test: none longer than 10 km): ${empireEdge.coastStretches.length}; longest ${empireEdge.coastStretches[0] ? `${rounded(empireEdge.coastStretches[0].lengthKm, 1)} km from ${empireEdge.coastStretches[0].start.map((value) => value.toFixed(2)).join(", ")}` : "none"}; longer than 10 km: ${longCoastStretches.length === 0 ? "none" : longCoastStretches.map((stretch) => `${rounded(stretch.lengthKm, 1)} km from ${stretch.start.map((value) => value.toFixed(2)).join(", ")}`).join("; ")}.`);
  lines.push("", "## Roads", "", `\`data/geo/ancient-roads.geojson\`: ${roadSummary.text}`, "");
  lines.push("| Left out as later than AD 100 (AWMC OBJECTID) | Road | Evidence |", "|---|---|---|");
  for (const entry of EXCLUDED_POST_AD100_ROADS) lines.push(`| ${entry.objectId} | ${entry.road} | ${entry.evidence} |`);
  lines.push("", `Clipped at the drawn Roman world: ${roadClip.shortened.length} road(s) shortened by ${rounded(roadClip.shortened.reduce((sum, row) => sum + row.removedKm, 0))} km in all${roadClip.shortened.length > 0 ? ` (largest: ${[...roadClip.shortened].sort((left, right) => right.removedKm - left.removedKm).slice(0, 6).map((row) => `${row.roadId} ${rounded(row.removedKm)} km`).join(", ")})` : ""}; ${roadClip.dropped.length} left out entirely${roadClip.dropped.length > 0 ? ` (${roadClip.dropped.map((row) => `${row.roadId} ${rounded(row.lengthKm)} km`).join(", ")})` : ""}.`);
  lines.push("", "## Place check", "", "Each candidate site is tested against its record's `politicalAreaId` (or its own candidate-level link). Near the border means within 3 km.", "");
  const mismatches = places.filter((row) => row.status !== "inside");
  lines.push(`${places.length} checks; ${places.length - mismatches.length} inside; ${mismatches.filter((row) => row.status === "near-border").length} near the border; ${mismatches.filter((row) => row.status === "outside").length} further out; ${mismatches.filter((row) => row.status === "area-not-built").length} with no area.`, "");
  lines.push("| Place | Link | Expected area | Result | Distance km | Lies in | Note |", "|---|---|---|---|---:|---|---|");
  for (const row of mismatches) {
    lines.push(`| ${row.label} | ${row.linkLevel} | \`${row.areaId}\` | ${row.status} | ${row.distanceKm === null ? "" : rounded(row.distanceKm, 2)} | ${row.actualAreaIds.join(", ") || "no area"} | ${placeExplanation(row)} |`);
  }
  lines.push("", "## Jordan check: Bethany beyond the Jordan", "");
  for (const site of jordanSites) lines.push(`- ${site.name} (${site.point.join(", ")}): in ${site.areaIds.map((areaId) => `\`${areaId}\``).join(", ") || "no area"}; ${rounded(site.riverKm * 1000)} m from the OSM Jordan.`);
  lines.push("", "## Anchor checks", "");
  for (const check of anchorChecks) lines.push(`- ${check.name} (${check.point.join(", ")}): in ${check.areaIds.map((areaId) => `\`${areaId}\``).join(", ") || "no area"} (expected \`${check.expected}\`); ${rounded(check.borderKm, 1)} km from that area's edge.`);
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
  await fs.mkdir(previewDirectory, { recursive: true });
  for (const file of await fs.readdir(previewDirectory)) {
    if (file.endsWith(".png")) await fs.rm(path.join(previewDirectory, file), { force: true });
  }
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
  // AWMC's extents are several polygons, some of which overlap (the AD 69 extent over Raetia). A plain
  // `-dissolve` leaves land covered twice as a hole; `-clean -dissolve2` keeps it.
  const ad69Extent = (await extractShapefileFeature(path.join(culturalRoot, "political_shading", "roman_empire_ad_69_extent", "roman_empire_ad_69_extent.shp"), "ad69-extent.geojson", "-clean -dissolve2"))[0];
  const ad200Extent = (await extractShapefileFeature(path.join(culturalRoot, "political_shading", "roman_empire_ad_200_extent", "roman_empire_ad_200_extent.shp"), "ad200-extent.geojson", "-clean -dissolve2"))[0];
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
  const lakeTatta = await loadLakeTatta();
  const galatiaCappadociaLine = await drawGalatiaCappadociaLine(built, lakeTatta, notes);
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
  const maskParts = await explodeFeatures("land-mask", landMask);
  const patmosLand = maskParts.find((part) => pointInGeometry(POINTS.patmos, part.geometry) || distanceToGeometryKm(POINTS.patmos, part.geometry) < 2);
  if (patmosLand && geometryAreaKm2(patmosLand.geometry) < 100) {
    islandFaces.push(patmosLand);
    notes.push(`Asia: added Patmos from Natural Earth 10m land (${rounded(geometryAreaKm2(patmosLand.geometry), 1)} km²), per the Research Lead's ruling (the AD 69 partition drops land faces under 50 km²).`);
  } else {
    notes.push("Asia: no Natural Earth land polygon found for Patmos.");
  }
  await addDirect("asia", ad69Named, "Asia", "ad69", islandFaces, " Added the AD69 island faces of Lesbos, Chios, Samos, Cos and Rhodes, and Natural Earth land for Patmos. ISBE 'Asia': the province apparently included 'the islands of Lesbos, Samos, Patmos, Cos and others near the Asia Minor coast'; ISBE 'Rhodes': Rhodes was 'made a part of the Roman province of Asia (44 AD)'.", ["awmc:ad69-asia-island-faces"]);

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
  built.push(await finishArea("italy", italyPieces, `Union of ${italy.faces.length} AD69 land faces lying within AWMC Italy_shading (Roman Italy) and Italy_shading itself on Natural Earth 10m land, minus Dalmatia and Sicily.`, ["awmc:italy-shading", "awmc:roman-empire-ad-69-provinces"], notes, [{ kind: "clip", detail: `Italy_shading clipped to Natural Earth 10m land (commit ${NATURAL_EARTH_COMMIT}); it carries Italy's coast out to Natural Earth's where AWMC's faces stop short of it.`, sources: ["awmc:italy-shading"] }]));

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
    sources: ["bib:josephus-jewish-war", "bib:isbe-en-gannim", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678378", "pleiades:678326", "pleiades:697728"]
  };
  const yarmukChange = {
    kind: "osm-river-cut",
    detail: "Yarmuk (OSM main stream), the southern edge of Gaulanitis (ISBE, 'Golan; Gaulonitis').",
    sources: ["bib:isbe-golan", `osm:relation/${OSM_RIVERS.yarmuk.relationId}`, ...yarmukIds]
  };
  const herodUpstream = ["awmc:herod-record-12-land-clipped", `awmc:ad69-face-${judaeaFace.properties.faceId}`];
  const machaerusChange = {
    kind: "described-line",
    detail: `Perea ends at an east–west line ${MACHAERUS_CUT_MARGIN_KM} km south of Machaerus, which stays in Perea: Josephus (War 3.3.3) gives Perea's length as "from Machaerus to Pella". The land south of the line, Herod's outline and the AD 69 Judaea face's Dead Sea shore, is Moab's and goes to arabia. Approximate: a straight line through a named anchor.`,
    sources: ["bib:josephus-jewish-war"]
  };
  const judea = await finishArea("judea-samaria-idumea", herod.judea, "Herod record 12 with the AD 69 Judaea face, west of the Jordan and the Dead Sea median and south of the Galilee/Samaria line.", [...herodUpstream, ...jordanIds], notes, [riftChange, anchorChange]);
  assertInside(judea, { Jerusalem: HEROD_ANCHORS.jerusalem, "Qasr al-Yahud": HEROD_ANCHORS.qasrAlYahud }, "judea-samaria-idumea");
  const galileePerea = await finishArea("galilee-perea", [...herod.galilee, ...herod.perea], "Herod record 12 with the AD 69 Judaea face: Galilee (west of the Jordan, north of the Galilee/Samaria line) and Perea (east of the Jordan and the Dead Sea median, south of the Yarmuk and of Perea's northern line at Pella, north of Machaerus).", [...herodUpstream, ...jordanIds, ...yarmukIds], notes, [riftChange, anchorChange, yarmukChange, machaerusChange]);
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
  const ciliciaPedias = await finishArea("cilicia", [...lamusSplit.pedias, ...edgesEast], `AD69 face ${f0031.properties.faceId} clipped by AD200 Cilicia cells ${cilicia.cellIds.join(" + ")}; the part east of the Lamus (the plain).${CILICIA_RULE_3_NOTE}`, [...ciliciaUpstream, ...lamusIds], notes, [lamusChange, ciliciaEdgeChange]);
  assertInside(ciliciaPedias, { Tarsus: POINTS.tarsus, Anazarbus: POINTS.anazarbus, Soli: POINTS.soli }, "cilicia", notes);
  const ciliciaTracheia = await finishArea("cilicia-tracheia", [...lamusSplit.tracheia, ...edgesWest], `AD69 face ${f0031.properties.faceId} clipped by AD200 Cilicia cells ${cilicia.cellIds.join(" + ")}; the part west of the Lamus (the rough west).${CILICIA_RULE_3_NOTE}`, [...ciliciaUpstream, ...lamusIds], notes, [lamusChange, ciliciaEdgeChange]);
  const tracheiaAnchors = { "Seleucia on the Calycadnus": POINTS.seleuciaCalycadnus, Olba: POINTS.olba, Corycus: POINTS.corycus, Elaeussa: POINTS.elaeussa, Laranda: POINTS.laranda, Coracesium: POINTS.coracesium };
  assertInside(ciliciaTracheia, tracheiaAnchors, "cilicia-tracheia", notes);
  built.push(ciliciaPedias, ciliciaTracheia);

  const syria = await finishArea("syria", [...syriaMain, ...syriaKeeps, ...herod.gadara], `AD69 merged face ${f0031.properties.faceId} (Agrippa II kingdom / Cilicia / Emesa / Syria) minus Cilicia's whole, the Herodian base and Commagene, plus Gadara's land between the Yarmuk and Pella (Decapolis, held by Syria). Small units such as Abilene, Chalcis and Emesa stay inside Syria (ADR-0037 rule 4). Its edge with Cilicia is AWMC's AD 200 line (rule 3, an approximation).`, [`awmc:ad69-face-${f0031.properties.faceId}`, "awmc:herod-record-12-land-clipped", ...yarmukIds], notes, [yarmukChange, anchorChange]);
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
  // Raphia's coast (G11): the AD 69 coastal face between Rhinocolura and Gaza goes with Gaza's land to
  // Judea, not to Arabia, so it is left out of Arabia's sources and erased from them.
  const raphiaFace = sinaiAd69Faces.find((face) => pointInGeometry(POINTS.raphia, face.geometry));
  if (!raphiaFace) throw new Error("No AD 69 face east of Aegyptus holds Raphia");
  const arabiaPieces = await booleanOp("arabia", "erase", [...ad200Sources, ...sinaiAd69Faces.filter((face) => face !== raphiaFace)], [egyptArea, f0031, herodBase, raphiaFace]);
  const arabia = await finishArea("arabia", [...arabiaPieces, ...herod.pereaSouth], `AD200 cell ${petraCell.cellId} (Petra and Bostra) and, outside the AD 69 extent, AD200 cell ${sinaiCell.cellId} (Sinai), clipped to the AD 200 extent; plus the AD69 Sinai faces east of Aegyptus except the coastal face between Rhinocolura and Gaza, which is Judea's; minus Aegyptus, the AD69 Syria face and the Herodian base; plus the Herodian land south of Machaerus. Rule 3: AWMC's AD 200 lines and extent stand in for the Nabataean kingdom's edges, an approximation; they put Philadelphia and Gerasa, Decapolis cities that aren't drawn (ADR-0037 item 3), on Arabia's side. Its edge with Egypt is AWMC's AD 69 Aegyptus face.`, [`awmc:ad200-province-cell-${petraCell.cellId}`, `awmc:ad200-province-cell-${sinaiCell.cellId}`, "awmc:ad69-sinai-faces", "awmc:roman-empire-ad-200-extent", "awmc:herod-record-12-land-clipped"], notes, [machaerusChange]);
  assertInside(arabia, { Petra: POINTS.petra, Bostra: POINTS.bostra, "Mount Sinai": POINTS.stCatherine }, "arabia");
  built.push(arabia);
  const raphiaCoast = await booleanOp("raphia-coast", "erase", [raphiaFace], [egyptArea, f0031, herodBase]);
  const raphiaChange = { kind: "ruling", detail: `Adds the AD 69 coastal face between Rhinocolura and Gaza (${rounded(raphiaCoast.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0))} km², with Raphia), which AWMC's AD 69 extent holds as Roman. In this period the coast was not the Nabataeans': Josephus (Antiquities 17.11.4) has Augustus add Gaza to the province of Syria in 4 BC, and Strabo puts the seaboard from Orthosia to Pelusium in Phoenicia (16.2.21), follows it from Gaza past Raphia to Rhinocolura (16.2.31) and places Rhinocolura "in Phoenicia near Aegypt" (16.4.24). The face is drawn with Gaza's land, which lies in this area under rule 4 (a small unit's land stays with the area around it). The PO's decision G11, after the Fact-Checker's re-check of the Research Lead's RL3.`, sources: ["bib:josephus-antiquities", "bib:strabo-geography"] };
  const judeaIndex = built.findIndex((feature) => feature.properties.areaId === "judea-samaria-idumea");
  const judeaBefore = built[judeaIndex];
  built[judeaIndex] = await finishArea("judea-samaria-idumea", [judeaBefore, ...raphiaCoast], judeaBefore.properties.provenance.changes[0].detail, [...judeaBefore.properties.provenance.upstreamFeatureIds, `awmc:ad69-face-${raphiaFace.properties.faceId}`], notes, [...judeaBefore.properties.provenance.changes.slice(1), raphiaChange]);
  assertInside(built[judeaIndex], { Jerusalem: HEROD_ANCHORS.jerusalem, "Qasr al-Yahud": HEROD_ANCHORS.qasrAlYahud, Raphia: POINTS.raphia }, "judea-samaria-idumea");

  // Peninsulas that AWMC's extent cuts off at the neck join the area they are attached to.
  const landParts = await prepareRomanWorldLand();
  await attachCutOffPeninsulas(built, ad69Extent, landParts, notes);

  // Coverage is measured on AWMC's AD 69 land faces inside the extent (NE land, cut by AWMC's lines),
  // so slivers where AWMC's coastline and Natural Earth's disagree are not counted as gaps. Land inside
  // the extent that no face covers counts too where it lies inland: a river AWMC draws as water (the
  // Danube by Carsium) or a thin face the partition dropped (G4). Where AWMC's shoreline outlines such a
  // piece, AWMC draws water there, so it is not land to cover (G10).
  const ad69FacesInside = ad69Raw.features.filter((feature) => {
    const point = labelPoint(feature.geometry);
    return point && pointInGeometry(point, ad69Extent.geometry);
  });
  const awmcShore = segmentGridOfLines(ensureFeatureCollection(await readJson(path.join(partitionWorkDirectory, "ad69", "awmc-coastline.geojson"))).features.flatMap((feature) => roadLines(feature.geometry)));
  const extentWithoutFaces = await inlandExtentLandWithoutFaces(ad69Extent, ad69FacesInside, landParts, awmcShore);
  const inlandExtentGaps = extentWithoutFaces.land;
  const largestFirst = (pieces) => [...pieces].sort((left, right) => geometryAreaKm2(right.geometry) - geometryAreaKm2(left.geometry));
  const describePieces = (pieces) => largestFirst(pieces).slice(0, 3).map((piece) => `${rounded(geometryAreaKm2(piece.geometry))} km² at ${labelPoint(piece.geometry).map((value) => value.toFixed(2)).join(", ")}`).join("; ");
  const totalKm2 = (pieces) => pieces.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0);
  notes.push(`AD 69 extent: ${inlandExtentGaps.length} inland piece(s) of its land that no AWMC face covers (${rounded(totalKm2(inlandExtentGaps))} km²; the largest ${describePieces(inlandExtentGaps)}) count as land to cover.`);
  const oldSea = extentWithoutFaces.water.map((row) => row.piece);
  notes.push(`AD 69 extent: ${oldSea.length} inland piece(s) that AWMC's shoreline outlines as water (${rounded(totalKm2(oldSea))} km²; the largest ${describePieces(oldSea)}) are not land to cover (G10). Their outlines run ${rounded(Math.min(...extentWithoutFaces.water.map((row) => row.shoreShare)) * 100)}–${rounded(Math.max(...extentWithoutFaces.water.map((row) => row.shoreShare)) * 100)}% along the shoreline; the land pieces' at most ${rounded(extentWithoutFaces.largestLandShare * 100)}%.`);
  const nabataeaLand = await booleanOp("coverage-nabataea-land", "clip", [petraCell.feature, sinaiOutside[0], ...sinaiAd69Faces], landMask);
  const coverageDomain = [...ad69FacesInside, ...inlandExtentGaps, ...nabataeaLand];
  const explanations = OUTSIDE_LIST_PROBES.flatMap(([label, probes]) => probes.map((point) => ({ label, point })));
  await assignLeftoverLand(built, coverageDomain, explanations, notes);

  // The rest of the Roman world.
  const isBritain = await britainTest(landParts);
  built.push(await buildOtherRomanLands(built, ad69Raw, ad69Extent, landParts, isBritain, awmcShore, notes));
  await assignSourcedIslands(built, notes);
  await fillRomanWorldGaps(built, coverageDomain, isBritain, notes);
  await attachExtentSlivers(built, inlandExtentGaps, notes);
  await attachIslandRemainders(built, landParts, notes);
  await leaveOutOldSea(built, oldSea, notes);

  // Final file: fixed area order, topology-aware simplification (shared borders are simplified once, so
  // neighbours keep identical edges), coordinates rounded to OUTPUT_PRECISION, then the same clean-up
  // again (simplification and rounding can leave repeated vertices).
  const ordered = AREA_ORDER.filter((areaId) => built.some((feature) => feature.properties.areaId === areaId)).map((areaId) => built.find((feature) => feature.properties.areaId === areaId));
  for (const areaId of AREA_ORDER) if (!built.some((feature) => feature.properties.areaId === areaId)) omitted.push([areaId, "Not built; see composition notes."]);
  const records = await loadLocationRecordsForPlaceCheck(notes);
  const placePoints = records.flatMap((record) => (record.candidates ?? []).map((candidate) => candidate.coordinates).filter(Array.isArray));
  // Land beyond the empire joins the simplification as one more feature, so that the frontier is a
  // shared edge: it keeps the finer tolerance, and the area and the empire's edge stay identical there.
  const outsideBefore = await classifyOutsideLand("edge", ordered, landParts, oldSea);
  const simplifyInput = ordered.flatMap((feature) => {
    const { areaId } = feature.properties;
    if (areaId !== "other-roman-lands") {
      return [geometryFeature(feature.geometry, { ...feature.properties, side: "roman", simplifyMetres: FINE_SIMPLIFY_AREAS.includes(areaId) ? FINE_SIMPLIFY_METRES : COARSE_SIMPLIFY_METRES })];
    }
    const near = [];
    const far = [];
    for (const polygon of polygonsOf(feature.geometry)) {
      const part = { type: "Polygon", coordinates: polygon };
      const isNearIsland = geometryAreaKm2(part) < NEAR_ISLAND_MAX_KM2 && placePoints.some((point) => distanceToGeometryKm(point, part) <= NEAR_PLACES_KM);
      (isNearIsland ? near : far).push(polygon);
    }
    notes.push(`other-roman-lands: ${near.length} island(s) within ${NEAR_PLACES_KM} km of our places keep the ${COARSE_SIMPLIFY_METRES} m tolerance; its other ${far.length} part(s) use ${OTHER_ROMAN_LANDS_SIMPLIFY_METRES} m, except where they border land beyond the empire.`);
    return [
      ...(near.length > 0 ? [geometryFeature({ type: "MultiPolygon", coordinates: near }, { ...feature.properties, side: "roman", simplifyMetres: COARSE_SIMPLIFY_METRES })] : []),
      ...(far.length > 0 ? [geometryFeature({ type: "MultiPolygon", coordinates: far }, { ...feature.properties, side: "roman", simplifyMetres: OTHER_ROMAN_LANDS_SIMPLIFY_METRES })] : [])
    ];
  });
  simplifyInput.push(geometryFeature({ type: "MultiPolygon", coordinates: outsideBefore.beyond.flatMap((piece) => polygonsOf(piece.geometry)) }, { areaId: OUTSIDE_PSEUDO_AREA_ID, side: "outside", simplifyMetres: COARSE_SIMPLIFY_METRES }));
  notes.push(`Land outside every area: ${outsideBefore.beyond.length} piece(s) beyond the empire, ${outsideBefore.enclosed.length} enclosed by Roman land and the sea (${rounded(outsideBefore.enclosed.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0))} km², no edge), ${outsideBefore.islands.length} island(s) that no area touches.`);
  const rawOutputPath = path.join(workDirectory, "ancient-areas-raw.geojson");
  const simplifiedPath = path.join(workDirectory, "ancient-areas-simplified.geojson");
  await writeJson(rawOutputPath, featureCollection(simplifyInput));
  await removeIfExists(simplifiedPath);
  await mapshaper.runCommands(`-i ${quote(rawOutputPath)} -simplify dp variable interval="simplifyMetres" keep-shapes -o format=geojson precision=${OUTPUT_PRECISION} ${quote(simplifiedPath)}`);
  const simplified = await readJson(simplifiedPath);
  const finalFeatures = ordered.map((source) => {
    const { areaId } = source.properties;
    const parts = simplified.features.filter((feature) => feature.properties.areaId === areaId).flatMap((feature) => polygonsOf(feature.geometry));
    const { geometry } = cleanPolygonGeometry({ type: "MultiPolygon", coordinates: parts }, { minPartKm2: 0 });
    // The clean-up can move a vertex by a few metres (where parts or a ring touch); keep the written precision.
    const decimals = Math.round(-Math.log10(OUTPUT_PRECISION));
    const roundPositions = (value) => (typeof value[0] === "number" ? value.map((number) => Number(number.toFixed(decimals))) : value.map(roundPositions));
    const cleaned = geometryFeature({ ...geometry, coordinates: roundPositions(geometry.coordinates) }, source.properties);
    if (!booleanValid(cleaned)) throw new Error(`${areaId}: invalid after simplification`);
    return cleaned;
  });
  const collection = featureCollection(finalFeatures);
  // G10: the old sea that the Fact-Checker names must stay in no area.
  const areaIdsAt = (point) => collection.features.filter((feature) => pointInGeometry(point, feature.geometry)).map((feature) => feature.properties.areaId);
  const oldSeaChecks = OLD_SEA_POINTS.map(([name, point]) => ({ name, point, areaIds: areaIdsAt(point) }));
  const coveredOldSea = oldSeaChecks.filter((check) => check.areaIds.length > 0);
  if (coveredOldSea.length > 0) throw new Error(`Old sea inside an area (G10): ${coveredOldSea.map((check) => `${check.name} in ${check.areaIds.join(", ")}`).join("; ")}`);
  const oldSeaRows = extentWithoutFaces.water.map((row) => ({ km2: geometryAreaKm2(row.piece.geometry), point: labelPoint(row.piece.geometry), shoreShare: row.shoreShare })).map((row) => ({ ...row, areaIds: areaIdsAt(row.point) }));
  // The data validator also rejects rings that touch or cross themselves; fail here rather than in CI.
  const topologyErrors = [];
  validateGeometryTopology({ featureCollection: collection, file: "data/geo/ancient-areas.geojson", errors: topologyErrors });
  if (topologyErrors.length > 0) {
    throw new Error(`Validator topology check failed: ${topologyErrors.map((error) => `${collection.features[Number(/\[(\d+)\]/u.exec(error.path)?.[1])]?.properties.areaId ?? error.path}: ${error.message}`).join("; ")}`);
  }
  await fs.writeFile(outputAreasPath, `${JSON.stringify(collection)}\n`, "utf8");
  const empireEdge = await buildEmpireEdge(simplifiedPath, collection.features.length, landParts, notes);

  // Roads: AWMC's roads of the Roman period, picked (G5; ADR-0037's update of 2026-10-08, item 1) and
  // clipped to the drawn Roman world.
  const roadsSource = await readJson(path.join(buildWorkDirectory, "roads.geojson"));
  const { roads: selectedRoads, excludedRoadIds } = selectAncientRoads(roadsSource, { awmcCommit: AWMC_COMMIT, awmcRoadsPath: AWMC_ROADS_PATH });
  const outsideAfter = await classifyOutsideLand("roads", collection.features, landParts, oldSea);
  const roadClip = await clipRoadsToRomanWorld(selectedRoads, outsideAfter, notes);
  await fs.writeFile(outputRoadsPath, `${JSON.stringify(roadClip.roads)}\n`, "utf8");
  const roadSummary = summarizeRoads(selectedRoads, roadClip, excludedRoadIds);
  notes.push(`Roads: ${roadSummary.text}`);

  // Checks.
  const validity = validityRows(collection);
  const overlaps = await overlapRows(collection);
  const explainCoverage = (coverageResult, features, sliverPrefix = "") => {
    for (const row of coverageResult.rows) {
      row.britain = isBritain(row.geometry);
      if (row.britain) {
        row.explanation = "Great Britain and its islands: left out of `other-roman-lands` (ADR-0037; Rome conquered Britain from AD 43)";
        continue;
      }
      if (row.explanation) {
        row.explanation = `${row.explanation}: should be in \`other-roman-lands\``;
        continue;
      }
      const touchingAreas = sharedBoundaryShares(geometryFeature(row.geometry), features);
      const name = landName(row.geometry, touchingAreas.length > 0 ? "Land" : "Island");
      row.explanation = sliverPrefix + (touchingAreas.length > 0
        ? `${name} bordering ${touchingAreas.map((share) => `\`${share.candidate.properties.areaId}\` (${rounded(share.share * 100)}% of its edge)`).join(" and ")}`
        : `${name} that no area holds`);
    }
    return coverageResult;
  };
  // Composition coverage is measured before simplification: it shows whether any land was left without
  // an area. The written file is measured too; its extra gaps are slivers where simplification moved an
  // outer edge (coast or frontier) inside AWMC's land, and their widths are bounded by the tolerances.
  const compositionCoverage = explainCoverage(await coverageRows(coverageDomain, featureCollection(ordered), explanations, COVERAGE_TOLERANCE_KM2), ordered);
  const coverage = explainCoverage(await coverageRows(coverageDomain, collection, [], COVERAGE_TOLERANCE_KM2), collection.features, "Simplification sliver: ");
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
  const anchorChecks = [
    ["Machaerus (fortress)", HEROD_ANCHORS.machaerus, "galilee-perea"],
    ["Caesarea Mazaca", POINTS.caesareaMazaca, "cappadocia"],
    ["Cappadocia's label point", POINTS.cappadociaLabel, "cappadocia"],
    ...GALATIA_CAPPADOCIA_ANCHORS.cappadocia.map((anchor) => [anchor.name, anchor.point, "cappadocia"]),
    ...GALATIA_CAPPADOCIA_ANCHORS.galatia.map((anchor) => [anchor.name, anchor.point, "galatia"]),
    ["Lake Tatta's east shore", lakeTatta.eastShore, "galatia"],
    ...VERIFICATION_ANCHORS
  ].map(([name, point, expected]) => ({
    name,
    point,
    expected,
    areaIds: collection.features.filter((feature) => pointInGeometry(point, feature.geometry)).map((feature) => feature.properties.areaId),
    borderKm: distanceToGeometryKm(point, collection.features.find((feature) => feature.properties.areaId === expected).geometry)
  }));

  const anchorPoints = Object.entries(HEROD_ANCHORS).map(([name, coordinates]) => ({ name, coordinates }));
  const machaerusLine = [[35.3, herod.machaerusCutLatitude], [36.2, herod.machaerusCutLatitude]];
  const edgeLines = empireEdge.edge.features[0].geometry.coordinates.map((coordinates) => ({ coordinates, color: "#b00000", width: 2.6 }));
  // Roads as the visual spec draws them: from 1 px at zoom 5 to 2 px at zoom 9, conjectured roads dashed;
  // previews are drawn at twice the pixel density.
  const pixelRatio = 2;
  const zoomWidth = (bounds, zoom) => Math.round(((bounds[2] - bounds[0]) * 256 * 2 ** zoom * pixelRatio) / 360);
  const roadPreviewLines = (zoom) => roadClip.roads.features.flatMap((feature) => {
    const width = Math.min(2, 1 + (zoom - 5) * 0.25) * pixelRatio;
    return roadLines(feature.geometry).map((coordinates) => ({ coordinates, color: "#8D6E63", width, dash: feature.properties.known ? undefined : `${3 * pixelRatio},${2 * pixelRatio}` }));
  });
  const placesIn = (bounds) => records.flatMap((record) => (record.candidates ?? []).slice(0, 1).filter((candidate) => Array.isArray(candidate.coordinates) && !["region", "province", "empire", "natural-feature"].includes(record.type)).map((candidate) => ({ name: record.id, coordinates: candidate.coordinates })))
    .filter(({ coordinates: [lon, lat] }) => lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]);
  const westAsiaBounds = [26.0, 36.9, 30.4, 40.3];
  const roadsIn = (bounds) => roadClip.roads.features.filter((feature) => roadLines(feature.geometry).some((line) => line.some(([lon, lat]) => lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]))).length;
  const previewPaths = [
    await writePreviewPng(path.join(previewDirectory, "areas-whole-empire.png"), {
      title: `The Roman world, AD 69 extent: ${collection.features.length} areas; the empire's edge (red) runs only where Roman land meets land beyond the empire`,
      bounds: [-11, 21.5, 47, 56.5],
      areas: collection,
      lines: edgeLines,
      width: 2200
    }),
    await writePreviewPng(path.join(previewDirectory, "roads-west-asia-z8.png"), {
      title: `Western Asia Minor roads at zoom 8 (${pixelRatio}x): ${roadsIn(westAsiaBounds)} major roads; conjectured roads dashed`,
      bounds: westAsiaBounds,
      areas: collection,
      lines: roadPreviewLines(8),
      points: placesIn(westAsiaBounds),
      width: zoomWidth(westAsiaBounds, 8)
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-aegean.png"), {
      title: "The Aegean: provinces, peninsulas and the islands in other-roman-lands",
      bounds: [19.2, 34.6, 30.2, 41.6],
      areas: collection,
      lines: edgeLines,
      points: [{ name: "Patmos", coordinates: POINTS.patmos }, { name: "Mount Athos", coordinates: [24.33, 40.16] }, { name: "Cnidus", coordinates: [27.374, 36.686] }, { name: "Corinth", coordinates: [22.88, 37.91] }, { name: "Ephesus", coordinates: [27.34, 37.94] }]
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-levant-anchors.png"), {
      title: "Levant: Herodian cuts, Perea's end at Machaerus, Gadara, Syria and Arabia",
      bounds: [34.15, 30.85, 37.0, 33.55],
      areas: collection,
      lines: [
        { coordinates: herod.rift.coordinates, color: "#1a4fd6" },
        { coordinates: herod.yarmukLine, color: "#1a4fd6" },
        { coordinates: GALILEE_SAMARIA_LINE, color: "#a00", dash: "6,4" },
        { coordinates: PELLA_LINE, color: "#a00", dash: "6,4" },
        { coordinates: machaerusLine, color: "#a00", dash: "6,4" }
      ],
      points: [...anchorPoints, { name: "petra", coordinates: POINTS.petra }, { name: "bostra", coordinates: POINTS.bostra }, { name: "damascus", coordinates: POINTS.damascus }]
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-cappadocia.png"), {
      title: "Galatia and Cappadocia: the line between the Cappadocian anchors (Tyana, Garsaura) and the Galatian ones (dashed)",
      bounds: [31.5, 36.8, 38.0, 40.6],
      areas: collection,
      lines: galatiaCappadociaLine.map((coordinates) => ({ coordinates, color: "#a00", dash: "6,4" })),
      points: [...GALATIA_CAPPADOCIA_ANCHORS.cappadocia, ...GALATIA_CAPPADOCIA_ANCHORS.galatia].map((anchor) => ({ name: anchor.name, coordinates: anchor.point })).concat([{ name: "Caesarea Mazaca", coordinates: POINTS.caesareaMazaca }, { name: "cappadocia label", coordinates: POINTS.cappadociaLabel }, { name: "Ancyra", coordinates: [32.85, 39.93] }])
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-sinai-arabia.png"), {
      title: "Southern Levant, Sinai and Arabia; the coast from Gaza past Raphia to Rhinocolura is Judea's (G11)",
      bounds: [31.5, 27.4, 38.5, 34.0],
      areas: collection,
      lines: edgeLines,
      points: [{ name: "petra", coordinates: POINTS.petra }, { name: "bostra", coordinates: POINTS.bostra }, { name: "Mount Sinai", coordinates: POINTS.stCatherine }, { name: "Raphia", coordinates: POINTS.raphia }]
    }),
    await writePreviewPng(path.join(previewDirectory, "areas-silted-gulfs.png"), {
      title: "The Latmian Gulf and the bay by Ephesus: the old shores (blue) and land that was sea, in no area (G10)",
      bounds: [26.95, 37.35, 27.75, 38.15],
      areas: collection,
      lines: ensureFeatureCollection(await readJson(path.join(repositoryRoot, "data", "geo", "ancient-coastline.geojson"))).features.flatMap((feature) => roadLines(feature.geometry)).map((coordinates) => ({ coordinates, color: "#1a4fd6", width: 2 })),
      points: [...OLD_SEA_POINTS.filter(([, [lon]]) => lon > 26.95 && lon < 27.75).map(([name, coordinates]) => ({ name, coordinates })), { name: "Miletus", coordinates: [27.278, 37.531] }, { name: "Ephesus", coordinates: [27.341, 37.941] }, { name: "Priene", coordinates: [27.297, 37.659] }]
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
    `Read through Overpass (${OVERPASS_ENDPOINTS.join(", ")}; data as of ${[...new Set([jordan, yarmuk, lamus].map((river) => river.dataTimestamp).filter(Boolean))].join(", ") || "unknown"}) and cached in ${osmCacheDirectory}; © OpenStreetMap contributors, ODbL 1.0.`
  ];
  await writeReport({
    collection,
    omitted,
    notes,
    validity,
    overlaps,
    compositionCoverage,
    coverage,
    oldSea: { rows: oldSeaRows, largestLandShare: extentWithoutFaces.largestLandShare, checks: oldSeaChecks },
    places,
    jordanSites,
    anchorChecks,
    empireEdge,
    outsideLandNote: `Land outside every area before simplification: ${outsideBefore.beyond.length} piece(s) beyond the empire; ${outsideBefore.enclosed.length} enclosed by Roman land and the sea (${rounded(outsideBefore.enclosed.reduce((sum, piece) => sum + geometryAreaKm2(piece.geometry), 0))} km², drawn without an edge; the largest ${[...outsideBefore.enclosed].sort((left, right) => geometryAreaKm2(right.geometry) - geometryAreaKm2(left.geometry)).slice(0, 3).map((piece) => `${rounded(geometryAreaKm2(piece.geometry))} km² at ${labelPoint(piece.geometry).map((value) => value.toFixed(2)).join(", ")}`).join("; ")}); ${outsideBefore.islands.length} island(s) that no area touches.`,
    roadSummary,
    roadClip,
    previewPaths,
    osmSummary,
    simplifyNote: `Written after topology-aware Douglas–Peucker simplification (${FINE_SIMPLIFY_METRES} m for ${FINE_SIMPLIFY_AREAS.map((areaId) => `\`${areaId}\``).join(", ")}, whose borders follow the Jordan; ${OTHER_ROMAN_LANDS_SIMPLIFY_METRES} m for \`other-roman-lands\` except its islands within ${NEAR_PLACES_KM} km of our places and its frontier with land beyond the empire; ${COARSE_SIMPLIFY_METRES} m elsewhere; a shared edge takes the finer tolerance) with coordinates rounded to ${OUTPUT_PRECISION}°; areas are cleaned before and after.`
  });
  console.log(`Wrote ${outputAreasPath} (${collection.features.length} areas)`);
  console.log(`Wrote ${outputEmpireEdgePath} (${empireEdge.pieceCount} pieces, ${rounded(empireEdge.lengthKm)} km)`);
  console.log(`Wrote ${outputRoadsPath} (${roadClip.roads.features.length} major roads)`);
  console.log(`Wrote ${path.join(reportDirectory, "composition-report.md")}`);
  for (const previewPath of previewPaths) console.log(`Wrote ${previewPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
