// End-to-end check of the ancient layer's build: from an empty cache folder, `npm run build:ancient-geo`
// must download and check its pinned inputs, pass every acceptance check and reproduce the committed
// data/geo/ files byte for byte.
//
//   npm run check:ancient-geo
//
// It downloads about 120 MB and takes a few minutes, so it isn't part of `npm test`. Commit or stash any
// change to data/geo/ first: the check compares the rebuilt files with git's.
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";
import booleanValid from "@turf/boolean-valid";
import { distancePointToSegmentKm, distanceToGeometryKm, pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { buildRegionOutlinesData } from "./build-region-outlines.mjs";
import { ancientGeoCache, fetchPinnedInputs, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import { geometryAreaKm2, polygonsOf } from "./lib/geometry-cleanup.mjs";
import { regenerateGazaRhinocoluraFaceFromCache } from "./lib/gaza-rhinocolura-face.mjs";
import { bisectorLinesByLabel } from "./lib/local-equirect-voronoi.mjs";
import { GROUP_A_LABELS, GROUP_B_LABELS } from "./lib/m5-20-region-groups.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regionOutlinePath = path.join(repositoryRoot, "data", "geo", "region-outlines.geojson");
const anchorsPath = path.join(repositoryRoot, "data", "geo", "region-anchors.json");
const empireEdgePath = path.join(repositoryRoot, "data", "geo", "ancient-empire-edge.geojson");
const gazaFacePath = path.join(repositoryRoot, "data", "geo", "sources", "gaza-rhinocolura-face.geojson");
const locationsDirectory = path.join(repositoryRoot, "data", "locations");
const REQUIRED_REGION_IDS = Object.freeze([
  "samaria",
  "galilee",
  "judea",
  "pontus",
  "pisidia",
  "lycaonia",
  "mysia",
  "phrygia",
  "media",
  "mesopotamia",
  "crete",
  "libya",
  "chios",
  "cos",
  "malta",
  "rhodes",
  "samos"
]);
const SHARED_EDGE_PAIRS = Object.freeze([
  ["samaria", "judea"],
  ["pisidia", "lycaonia"],
  ["pisidia", "phrygia"],
  ["lycaonia", "phrygia"],
  ["mysia", "phrygia"]
]);
const ANCHOR_CHECKS = Object.freeze([
  { anchorId: "anouath-borkeos", name: "Anouath Borkeos", mode: "boundary", regions: ["samaria", "judea"] },
  { anchorId: "akrabatta", name: "Akrabatta", mode: "inside", regionId: "judea" },
  { anchorId: "sychem", name: "Sychem", mode: "inside", regionId: "samaria" },
  { anchorId: "ginaia", name: "Ginai(a)", mode: "inside", regionId: "galilee" },
  { anchorId: "scythopolis", name: "Scythopolis", mode: "inside", regionId: "galilee" },
  { anchorId: "amisus", name: "Amisus", mode: "inside", regionId: "pontus" },
  { anchorId: "themiscyra", name: "Themiscyra", mode: "inside", regionId: "pontus" },
  { anchorId: "nicomedia", name: "Nicomedia", mode: "outside", regionId: "pontus" },
  { anchorId: "claudiopolis-bithynia", name: "Claudiopolis", mode: "outside", regionId: "pontus" },
  { anchorId: "prusa", name: "Prusa", mode: "outside", regionId: "pontus" },
  { anchorId: "sinope-west-halys", name: "Sinope (west of Halys)", mode: "outside", regionId: "pontus" },
  { anchorId: "raphia", name: "Raphia", mode: "outside", regionId: "judea" },
  { anchorId: "rhinocolura", name: "Rhinocolura", mode: "outside", regionId: "judea" },
  { anchorId: "ptolemais", name: "Ptolemais outside Samaria", mode: "outside", regionId: "samaria" },
  { anchorId: "ptolemais", name: "Ptolemais outside Judea", mode: "outside", regionId: "judea" },
  { anchorId: "tyre", name: "Tyre outside Galilee", mode: "outside", regionId: "galilee" },
  { anchorId: "cauda", name: "Cauda", mode: "outside", regionId: "crete" },
  { anchorId: "mljet", name: "Mljet", mode: "outside", regionId: "malta" },

  { anchorId: "selge", name: "Selge", mode: "inside", regionId: "pisidia" },
  { anchorId: "sagalassus", name: "Sagalassus", mode: "inside", regionId: "pisidia" },
  { anchorId: "attalia", name: "Attalia", mode: "outside", regionId: "pisidia" },
  { anchorId: "isaura-vetus", name: "Isaura Vetus", mode: "outside", regionId: "pisidia" },

  { anchorId: "coropassus", name: "Coropassus", mode: "inside", regionId: "lycaonia" },
  { anchorId: "lystra-pleiades", name: "Lystra", mode: "inside", regionId: "lycaonia" },
  { anchorId: "garsaura", name: "Garsaura", mode: "outside", regionId: "lycaonia" },
  { anchorId: "iconium-phrygia", name: "Iconium", mode: "outside", regionId: "lycaonia" },
  { anchorId: "lake-tatta", name: "Lake Tatta", mode: "outside", regionId: "lycaonia" },

  { anchorId: "pergamum", name: "Pergamum", mode: "inside", regionId: "mysia" },
  { anchorId: "elaea", name: "Elaea", mode: "inside", regionId: "mysia" },
  { anchorId: "prusa", name: "Prusa", mode: "outside", regionId: "mysia" },
  { anchorId: "dorylaeum", name: "Dorylaeum", mode: "outside", regionId: "mysia" },

  { anchorId: "synnada", name: "Synnada", mode: "inside", regionId: "phrygia" },
  { anchorId: "iconium-phrygia", name: "Iconium in Phrygia", mode: "inside", regionId: "phrygia" },
  { anchorId: "lystra-pleiades", name: "Lystra outside Phrygia", mode: "outside", regionId: "phrygia" },
  { anchorId: "antioch-maeander", name: "Antioch on Maeander", mode: "outside", regionId: "phrygia" },

  { anchorId: "ecbatana", name: "Ecbatana", mode: "inside", regionId: "media" },
  { anchorId: "rhagae", name: "Rhagae", mode: "inside", regionId: "media" },
  { anchorId: "artaxata", name: "Artaxata", mode: "outside", regionId: "media" },
  { anchorId: "hecatompylos", name: "Hecatompylos", mode: "outside", regionId: "media" },

  { anchorId: "edessa", name: "Edessa", mode: "inside", regionId: "mesopotamia" },
  { anchorId: "nisibis", name: "Nisibis", mode: "inside", regionId: "mesopotamia" },
  { anchorId: "arsamosata", name: "Arsamosata", mode: "outside", regionId: "mesopotamia" },
  { anchorId: "babylon", name: "Babylon", mode: "outside", regionId: "mesopotamia" },
  { anchorId: "seleucia-tigris", name: "Seleucia on Tigris", mode: "outside", regionId: "mesopotamia" }
]);
const COAST_EXCEPTIONS = Object.freeze(new Set([
  "cauda",
  "sea-of-galilee",
  "cana:qana",
  "malta:mljet"
]));
const EPSILON = 1e-9;
const M520_MEDIA_GUARDS = Object.freeze({
  inside: [
    { name: "Mughan", point: [48.0, 39.5] },
    { name: "Parsabad", point: [47.92, 39.62] },
    { name: "Aslanduz", point: [47.42, 39.42] },
    { name: "Jolfa", point: [45.62, 38.93] }
  ],
  outside: [
    { name: "Hajigabul", point: [48.94, 40.04] },
    { name: "Nakhchivan", point: [45.41, 39.21] }
  ]
});
const M520_EXTRA_OUTSIDE_CHECKS = Object.freeze([
  { name: "Ctesiphon", point: [44.581331, 33.096501], regionId: "mesopotamia" },
  { name: "Arbela", point: [44.010508, 36.190276], regionId: "mesopotamia" },
  { name: "Mesopotamia record point", point: [43.5, 33.7], regionId: "mesopotamia", expected: "inside" },
  { name: "Lake Tatta", point: [33.75, 38.85], regionIds: ["lycaonia", "phrygia"] }
]);
const M520_FIXED_POINT_CHECKS = Object.freeze([
  { name: "Bithynion", point: [31.5858565, 40.7561925], regionId: "phrygia", expected: "outside" },
  { name: "Oenoanda", point: [29.55518, 36.81125], regionId: "pisidia", expected: "outside" },
  { name: "Araxa", point: [29.3837, 36.75132], regionId: "pisidia", expected: "outside" }
]);
const SIMPLIFY_INTERVAL_METRES = Object.freeze({
  samaria: 25,
  galilee: 25,
  judea: 25,
  pisidia: 150,
  lycaonia: 150,
  mysia: 100,
  phrygia: 150,
  media: 200,
  mesopotamia: 150,
  pontus: 600,
  crete: 600,
  libya: 600,
  chios: 600,
  cos: 600,
  malta: 600,
  rhodes: 600,
  samos: 600
});
const M519_REGION_IDS = new Set(["samaria", "judea", "galilee", "pontus"]);
const M519_KINDS = new Set(["m5-19-g11-line", "m5-19-pontus-halys", "m5-19-gaza-face"]);

function changedGeoFiles() {
  const trackedTargets = [
    "data/geo/ancient-areas.geojson",
    "data/geo/ancient-roads.geojson",
    "data/geo/ancient-coastline.geojson",
    "data/geo/ancient-empire-edge.geojson",
    "data/geo/region-outlines.geojson",
    "data/geo/region-anchors.json",
    "data/geo/sources/gaza-rhinocolura-face.geojson"
  ];
  const result = spawnSync("git", ["status", "--porcelain", "--", ...trackedTargets], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) throw new Error(`git status failed: ${result.stderr}`);
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function parseArguments(argv) {
  let seededError = null;
  let proofFOnFe27276 = false;
  let proofEgOn20320e9 = false;
  let proofM520On8a8f467 = false;
  let proofInjectedRiverSlice = false;
  let proofP4OnCb75908 = false;
  let proofLycaoniaDropInland = false;
  for (const argument of argv) {
    if (argument.startsWith("--seed-error=")) {
      seededError = argument.slice("--seed-error=".length).trim();
      continue;
    }
    if (argument === "--proof-f-on-fe27276") {
      proofFOnFe27276 = true;
      continue;
    }
    if (argument === "--proof-eg-on-20320e9") {
      proofEgOn20320e9 = true;
      continue;
    }
    if (argument === "--proof-m520-on-8a8f467") {
      proofM520On8a8f467 = true;
      continue;
    }
    if (argument === "--proof-injected-river-slice") {
      proofInjectedRiverSlice = true;
      continue;
    }
    if (argument === "--proof-p4-on-cb75908") {
      proofP4OnCb75908 = true;
      continue;
    }
    if (argument === "--proof-lycaonia-drop-inland") {
      proofLycaoniaDropInland = true;
      continue;
    }
    throw new Error(`Unknown argument '${argument}'.`);
  }
  if (seededError && !["b", "d", "e", "coast"].includes(seededError)) {
    throw new Error("--seed-error supports only b, d, e or coast.");
  }
  return { seededError, proofFOnFe27276, proofEgOn20320e9, proofM520On8a8f467, proofInjectedRiverSlice, proofP4OnCb75908, proofLycaoniaDropInland };
}

function ringsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon);
  return [];
}

function ringSegments(geometry) {
  const segments = [];
  for (const ring of ringsOf(geometry)) {
    for (let index = 1; index < ring.length; index += 1) {
      segments.push([ring[index - 1], ring[index]]);
    }
  }
  return segments;
}

function normalizedSegmentKey(start, end) {
  const a = `${start[0].toFixed(5)},${start[1].toFixed(5)}`;
  const b = `${end[0].toFixed(5)},${end[1].toFixed(5)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function vertexList(geometry) {
  const points = [];
  for (const ring of ringsOf(geometry)) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      points.push(ring[index]);
    }
  }
  return points;
}

function distanceToAnyGeometryKm(point, geometry) {
  if (!geometry) return Number.POSITIVE_INFINITY;
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    return distanceToGeometryKm(point, geometry);
  }
  if (geometry.type === "LineString") {
    let minimum = Number.POSITIVE_INFINITY;
    const line = geometry.coordinates ?? [];
    for (let index = 1; index < line.length; index += 1) {
      minimum = Math.min(minimum, distancePointToSegmentKm(point, line[index - 1], line[index]));
    }
    return minimum;
  }
  if (geometry.type === "MultiLineString") {
    return Math.min(...(geometry.coordinates ?? []).map((line) => distanceToAnyGeometryKm(point, { type: "LineString", coordinates: line })));
  }
  return Number.POSITIVE_INFINITY;
}

function geometryBbox(geometry) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  const scan = (position) => {
    minLon = Math.min(minLon, position[0]);
    minLat = Math.min(minLat, position[1]);
    maxLon = Math.max(maxLon, position[0]);
    maxLat = Math.max(maxLat, position[1]);
  };
  if (geometry?.type === "LineString") {
    for (const point of geometry.coordinates ?? []) scan(point);
  } else if (geometry?.type === "MultiLineString") {
    for (const line of geometry.coordinates ?? []) for (const point of line ?? []) scan(point);
  } else if (geometry?.type === "Polygon") {
    for (const ring of geometry.coordinates ?? []) for (const point of ring ?? []) scan(point);
  } else if (geometry?.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates ?? []) for (const ring of polygon ?? []) for (const point of ring ?? []) scan(point);
  }
  return [minLon, minLat, maxLon, maxLat];
}

function pointNearBbox(point, box, expandKm) {
  if (!box) return true;
  const latMargin = expandKm / 110.574;
  const lonMargin = expandKm / (111.32 * Math.cos((point[1] * Math.PI) / 180));
  return point[0] >= box[0] - lonMargin && point[0] <= box[2] + lonMargin && point[1] >= box[1] - latMargin && point[1] <= box[3] + latMargin;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function geometryFeature(geometry, properties = {}) {
  return { type: "Feature", properties, geometry };
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

async function clippedAreaKm2(subjectFeature, maskFeature, tag) {
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-check-clip-"));
  try {
    const subjectPath = path.join(workDirectory, `${tag}-subject.geojson`);
    const maskPath = path.join(workDirectory, `${tag}-mask.geojson`);
    const outputPath = path.join(workDirectory, `${tag}-out.geojson`);
    await writeJson(subjectPath, { type: "FeatureCollection", features: [geometryFeature(subjectFeature.geometry)] });
    await writeJson(maskPath, { type: "FeatureCollection", features: [geometryFeature(maskFeature.geometry)] });
    await mapshaper.runCommands(`-i ${subjectPath} name=subject -i ${maskPath} name=mask -target subject -clip mask -o format=geojson ${outputPath}`);
    const output = JSON.parse(await fs.readFile(outputPath, "utf8"));
    const clipped = geometriesAsFeatures(output);
    return clipped.reduce((sum, feature) => sum + geometryAreaKm2(feature.geometry), 0);
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

function segmentLengthKm(start, end) {
  const midLatRad = (((start[1] + end[1]) / 2) * Math.PI) / 180;
  const dx = (end[0] - start[0]) * 111.32 * Math.cos(midLatRad);
  const dy = (end[1] - start[1]) * 110.574;
  return Math.hypot(dx, dy);
}

function densifiedEdgeSamples(geometry, maxStepKm = 1) {
  const samples = [];
  for (const ring of ringsOf(geometry)) {
    for (let index = 1; index < ring.length; index += 1) {
      const start = ring[index - 1];
      const end = ring[index];
      const lengthKm = Math.max(segmentLengthKm(start, end), 1e-6);
      const steps = Math.max(1, Math.ceil(lengthKm / maxStepKm));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        samples.push([start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])]);
      }
    }
  }
  return samples;
}

function densifiedLineSamples(lineCoordinates, maxStepKm = 0.1) {
  const samples = [];
  const line = Array.isArray(lineCoordinates) ? lineCoordinates : [];
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1];
    const end = line[index];
    const lengthKm = Math.max(segmentLengthKm(start, end), 1e-6);
    const steps = Math.max(1, Math.ceil(lengthKm / maxStepKm));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      samples.push([start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])]);
    }
  }
  return samples;
}

function segmentsFromGeometry(geometry) {
  const segments = [];
  const pushLine = (line) => {
    for (let index = 1; index < line.length; index += 1) {
      segments.push([line[index - 1], line[index]]);
    }
  };
  if (!geometry) return segments;
  if (geometry.type === "LineString") {
    pushLine(geometry.coordinates ?? []);
    return segments;
  }
  if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates ?? []) pushLine(line ?? []);
    return segments;
  }
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    for (const [start, end] of ringSegments(geometry)) segments.push([start, end]);
  }
  return segments;
}

function combineBboxes(boxes) {
  if (boxes.length === 0) return null;
  return boxes.reduce(
    (acc, box) => [
      Math.min(acc[0], box[0]),
      Math.min(acc[1], box[1]),
      Math.max(acc[2], box[2]),
      Math.max(acc[3], box[3])
    ],
    [Infinity, Infinity, -Infinity, -Infinity]
  );
}

function buildSegmentGridIndex({ segmentEntries, sampleBounds, cellSizeDegrees = 0.05, expandDegrees = 0.01 }) {
  if (!sampleBounds) {
    return {
      bounds: null,
      cellSizeDegrees,
      getCandidates() {
        return [];
      }
    };
  }
  const index = new Map();
  const [minLon, minLat, maxLon, maxLat] = sampleBounds;
  const bounds = [minLon - 1, minLat - 1, maxLon + 1, maxLat + 1];
  const toCell = (lon, lat) => [Math.floor((lon - bounds[0]) / cellSizeDegrees), Math.floor((lat - bounds[1]) / cellSizeDegrees)];
  for (const entry of segmentEntries) {
    const segmentBox = geometryBbox({ type: "LineString", coordinates: [entry.start, entry.end] });
    if (!segmentBox) continue;
    const expanded = [
      segmentBox[0] - expandDegrees,
      segmentBox[1] - expandDegrees,
      segmentBox[2] + expandDegrees,
      segmentBox[3] + expandDegrees
    ];
    if (expanded[2] < bounds[0] || expanded[0] > bounds[2] || expanded[3] < bounds[1] || expanded[1] > bounds[3]) continue;
    const [x0, y0] = toCell(expanded[0], expanded[1]);
    const [x1, y1] = toCell(expanded[2], expanded[3]);
    for (let x = x0; x <= x1; x += 1) {
      for (let y = y0; y <= y1; y += 1) {
        const key = `${x},${y}`;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(entry);
      }
    }
  }
  return {
    bounds,
    cellSizeDegrees,
    getCandidates(point) {
      const [x, y] = toCell(point[0], point[1]);
      return index.get(`${x},${y}`) ?? [];
    }
  };
}

function nearestDistanceFromSegmentIndexKm(point, segmentIndex) {
  let nearest = Infinity;
  for (const segment of segmentIndex.getCandidates(point)) {
    nearest = Math.min(nearest, distancePointToSegmentKm(point, segment.start, segment.end));
  }
  return nearest;
}

function lineFeatureCoordinates(feature) {
  if (feature?.geometry?.type === "LineString") return [feature.geometry.coordinates ?? []];
  if (feature?.geometry?.type === "MultiLineString") return feature.geometry.coordinates ?? [];
  return [];
}

function riverCandidateLines(features, matchesName) {
  const lines = [];
  for (const feature of features ?? []) {
    const names = Object.values(feature.properties ?? {})
      .filter((value) => typeof value === "string")
      .map((value) => value.toLowerCase());
    if (!names.some((name) => matchesName(name))) continue;
    for (const coordinates of lineFeatureCoordinates(feature)) {
      if (coordinates.length >= 2) lines.push(coordinates);
    }
  }
  return lines;
}

function endpointDistanceSquared(lineA, lineB) {
  const endpointsA = [lineA[0], lineA.at(-1)];
  const endpointsB = [lineB[0], lineB.at(-1)];
  let best = Infinity;
  for (const a of endpointsA) {
    for (const b of endpointsB) {
      const d2 = (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
      if (d2 < best) best = d2;
    }
  }
  return best;
}

function nearestPointDistanceSquared(line, point) {
  let best = Infinity;
  for (const vertex of line) {
    const d2 = (vertex[0] - point[0]) ** 2 + (vertex[1] - point[1]) ** 2;
    if (d2 < best) best = d2;
  }
  return best;
}

function orientLineFromNearPoint(line, point) {
  const startDistance = (line[0][0] - point[0]) ** 2 + (line[0][1] - point[1]) ** 2;
  const endDistance = (line.at(-1)[0] - point[0]) ** 2 + (line.at(-1)[1] - point[1]) ** 2;
  return startDistance <= endDistance ? line : [...line].reverse();
}

function connectLines(lineA, lineB) {
  const endpointsA = [lineA[0], lineA.at(-1)];
  const endpointsB = [lineB[0], lineB.at(-1)];
  let best = null;
  for (const endpointA of endpointsA) {
    for (const endpointB of endpointsB) {
      const distance = (endpointA[0] - endpointB[0]) ** 2 + (endpointA[1] - endpointB[1]) ** 2;
      if (!best || distance < best.distance) best = { endpointA, endpointB, distance };
    }
  }
  const orientedA = best.endpointA === lineA.at(-1) ? lineA : [...lineA].reverse();
  const orientedB = best.endpointB === lineB[0] ? lineB : [...lineB].reverse();
  return [...orientedA, ...orientedB.slice(1)];
}

function stitchNamedRiverChain(features, pattern, anchorCoordinates) {
  const candidates = riverCandidateLines(features, (name) => pattern.test(name));
  if (candidates.length === 0) return null;
  const allLines = (features ?? [])
    .flatMap((feature) => lineFeatureCoordinates(feature))
    .filter((coordinates) => coordinates.length >= 2);
  const ordered = [...candidates].sort(
    (left, right) => nearestPointDistanceSquared(left, anchorCoordinates) - nearestPointDistanceSquared(right, anchorCoordinates)
  );
  const used = new Set();
  let chain = orientLineFromNearPoint(ordered[0], anchorCoordinates);
  used.add(ordered[0]);
  while (used.size < candidates.length) {
    const next = candidates
      .filter((candidate) => !used.has(candidate))
      .map((candidate) => ({ candidate, d2: endpointDistanceSquared(chain, candidate) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.2) break;
    chain = connectLines(chain, next.candidate);
    used.add(next.candidate);
  }
  const usedAny = new Set([...used]);
  while (usedAny.size < allLines.length) {
    const next = allLines
      .filter((candidate) => !usedAny.has(candidate))
      .map((candidate) => ({ candidate, d2: endpointDistanceSquared(chain, candidate) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.2) break;
    chain = connectLines(chain, next.candidate);
    usedAny.add(next.candidate);
  }
  return chain;
}

function stitchEmpireEdgeChain(geometries, anchorCoordinates) {
  const candidates = (geometries ?? []).flatMap((geometry) => {
    if (geometry?.type === "LineString") return [geometry.coordinates ?? []];
    if (geometry?.type === "MultiLineString") return geometry.coordinates ?? [];
    return [];
  }).filter((coordinates) => coordinates.length >= 2);
  if (candidates.length === 0) return null;
  const ordered = [...candidates].sort(
    (left, right) => nearestPointDistanceSquared(left, anchorCoordinates) - nearestPointDistanceSquared(right, anchorCoordinates)
  );
  const used = new Set();
  let chain = orientLineFromNearPoint(ordered[0], anchorCoordinates);
  used.add(ordered[0]);
  while (used.size < candidates.length) {
    const next = candidates
      .filter((candidate) => !used.has(candidate))
      .map((candidate) => ({ candidate, d2: endpointDistanceSquared(chain, candidate) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.2) break;
    chain = connectLines(chain, next.candidate);
    used.add(next.candidate);
  }
  return chain;
}

function regionToleranceKm(regionId) {
  return (SIMPLIFY_INTERVAL_METRES[regionId] ?? 600) / 1000 + 0.1;
}

function candidateExceptionKey(locationId, candidate) {
  const label = typeof candidate?.label === "string" ? candidate.label.toLowerCase() : "";
  if (locationId === "cana" && label.includes("qana")) return "cana:qana";
  if (locationId === "malta" && label.includes("mljet")) return "malta:mljet";
  return locationId;
}

function mutateGeometryVertices(geometry, mutator) {
  if (!geometry) return;
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates ?? []) {
      for (const position of ring ?? []) mutator(position);
    }
    return;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates ?? []) {
      for (const ring of polygon ?? []) {
        for (const position of ring ?? []) mutator(position);
      }
    }
  }
}

function partCount(geometry) {
  return polygonsOf(geometry).length;
}

function evaluateAreaSanity(featureById, sanity) {
  const failures = [];
  const expectedRanges = Object.freeze({
    pisidia: [2200, 32000],
    lycaonia: [7400, 43000],
    mysia: [16000, 57000],
    phrygia: [40000, 117000],
    media: [41600, 575000],
    mesopotamia: [100000, 180000]
  });
  const pontus = featureById.get("pontus");
  if (pontus && sanity?.pontusBaseAreaKm2 != null) {
    const pontusAreaKm2 = geometryAreaKm2(pontus.geometry);
    if (pontusAreaKm2 < sanity.pontusBaseAreaKm2 || pontusAreaKm2 > sanity.pontusBaseAreaKm2 + 6000) {
      failures.push(
        `(g) pontus area ${pontusAreaKm2.toFixed(1)} km² is outside [${sanity.pontusBaseAreaKm2.toFixed(1)}, ${(sanity.pontusBaseAreaKm2 + 6000).toFixed(1)}].`
      );
    }
  }

  const judea = featureById.get("judea");
  const samaria = featureById.get("samaria");
  if (judea && samaria && sanity?.judeaSamariaCombinedKm2 != null) {
    const combined = geometryAreaKm2(judea.geometry) + geometryAreaKm2(samaria.geometry);
    const ratio = combined / sanity.judeaSamariaCombinedKm2;
    if (Math.abs(ratio - 1) > 0.01) {
      failures.push(
        `(g) judea+samaria area ${combined.toFixed(1)} km² differs from source target ${sanity.judeaSamariaCombinedKm2.toFixed(1)} km² by ${((ratio - 1) * 100).toFixed(2)}%.`
      );
    }
  }

  for (const regionId of sanity?.nonIslandIds ?? []) {
    const feature = featureById.get(regionId);
    if (!feature) continue;
    const parts = partCount(feature.geometry);
    if (parts !== 1) {
      failures.push(`(g) ${regionId} has ${parts} parts (expected 1 for non-island outlines).`);
    }
  }

  for (const [regionId, [minKm2, maxKm2]] of Object.entries(expectedRanges)) {
    const feature = featureById.get(regionId);
    if (!feature) continue;
    const areaKm2 = geometryAreaKm2(feature.geometry);
    if (areaKm2 < minKm2 || areaKm2 > maxKm2) {
      failures.push(`(g) ${regionId} area ${areaKm2.toFixed(1)} km² is outside [${minKm2}, ${maxKm2}] km².`);
    }
  }
  return failures;
}

function applySeededError(featureById, seededError) {
  if (seededError === "b") {
    const samaria = featureById.get("samaria");
    if (!samaria) return;
    mutateGeometryVertices(samaria.geometry, (position) => {
      position[0] += 2;
    });
    return;
  }
  if (seededError === "d") {
    const judea = featureById.get("judea");
    if (!judea) return;
    mutateGeometryVertices(judea.geometry, (position) => {
      position[0] += 0.01;
    });
    return;
  }
  if (seededError === "coast") {
    const pisidia = featureById.get("pisidia");
    const polygon = pisidia?.geometry?.type === "Polygon"
      ? pisidia.geometry.coordinates
      : pisidia?.geometry?.type === "MultiPolygon"
        ? pisidia.geometry.coordinates?.[0]
        : null;
    const ring = polygon?.[0];
    if (!Array.isArray(ring) || ring.length < 4) return;
    const coastalVertex = [30.72, 36.84]; // Gulf of Antalya coast, seeded-failure probe only.
    ring[0] = coastalVertex;
    ring[ring.length - 1] = coastalVertex;
  }
}

function nearestGeometryDistanceKm(point, geometries) {
  let nearest = Number.POSITIVE_INFINITY;
  for (const geometry of geometries) {
    nearest = Math.min(nearest, distanceToAnyGeometryKm(point, geometry));
  }
  return nearest;
}

function nearestAnchor(point, anchorCoordinatesById) {
  let best = null;
  for (const [anchorId, coordinates] of anchorCoordinatesById.entries()) {
    const distanceKm = Math.hypot(point[0] - coordinates[0], point[1] - coordinates[1]) * 111.32;
    if (!best || distanceKm < best.distanceKm) best = { anchorId, coordinates, distanceKm };
  }
  return best;
}

function nearestPointOnSegmentForPoint(point, start, end) {
  const latRadians = (point[1] * Math.PI) / 180;
  const projectKm = ([lon, lat]) => [
    (lon - point[0]) * 111.32 * Math.cos(latRadians),
    (lat - point[1]) * 110.574
  ];
  const a = projectKm(start);
  const b = projectKm(end);
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = -a[0];
  const wy = -a[1];
  const denominator = vx * vx + vy * vy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / denominator));
  const nearest = [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])];
  return { point: nearest, distanceKm: Math.hypot(a[0] + t * vx, a[1] + t * vy) };
}

function nearestPointOnGeometryForPoint(point, geometry) {
  const segments = segmentsFromGeometry(geometry);
  let best = null;
  for (const [start, end] of segments) {
    const candidate = nearestPointOnSegmentForPoint(point, start, end);
    if (!best || candidate.distanceKm < best.distanceKm) best = candidate;
  }
  return best;
}

function distanceBetweenPointsKm(origin, other) {
  const latRadians = (origin[1] * Math.PI) / 180;
  const dx = (other[0] - origin[0]) * 111.32 * Math.cos(latRadians);
  const dy = (other[1] - origin[1]) * 110.574;
  return Math.hypot(dx, dy);
}

function validateAllowedInputKinds({
  allowedTagged,
  anchorCoordinatesById,
  naturalEarthRivers,
  naturalEarthLakes,
  naturalEarthLandGeometries,
  areaGeometries,
  empireEdgeGeometries
}) {
  const failures = [];
  const riverSliceGeometries = [];
  const sliceMaximums = [];
  const maxSliceDistanceKm = 0.1; // 100 m
  const allowedKinds = new Set([
    "area-edge",
    "ne-land",
    "ne-river-slice",
    "ne-lake-slice",
    "empire-edge-slice",
    "edge-river-connector",
    "anchor-segment",
    "anchor-river-connector",
    "m5-19-g11-line",
    "m5-19-pontus-halys",
    "m5-19-gaza-face"
  ]);
  const naturalEarthRiversIndex = buildSegmentGridIndex({
    segmentEntries: naturalEarthRivers.flatMap((geometry) =>
      segmentsFromGeometry(geometry).map(([start, end]) => ({ kind: "ne-river", start, end }))
    ),
    sampleBounds: combineBboxes(naturalEarthRivers.map((geometry) => geometryBbox(geometry)).filter(Boolean)),
    expandDegrees: maxSliceDistanceKm / 110.574
  });
  const naturalEarthLakesIndex = buildSegmentGridIndex({
    segmentEntries: naturalEarthLakes.flatMap((geometry) =>
      segmentsFromGeometry(geometry).map(([start, end]) => ({ kind: "ne-lake", start, end }))
    ),
    sampleBounds: combineBboxes(naturalEarthLakes.map((geometry) => geometryBbox(geometry)).filter(Boolean)),
    expandDegrees: maxSliceDistanceKm / 110.574
  });
  const empireEdgeIndex = buildSegmentGridIndex({
    segmentEntries: empireEdgeGeometries.flatMap((geometry) =>
      segmentsFromGeometry(geometry).map(([start, end]) => ({ kind: "empire-edge", start, end }))
    ),
    sampleBounds: combineBboxes(empireEdgeGeometries.map((geometry) => geometryBbox(geometry)).filter(Boolean)),
    expandDegrees: 0.001 / 110.574
  });
  for (const entry of allowedTagged) {
    if (!allowedKinds.has(entry.kind)) {
      failures.push(`(f) unsupported permitted-input kind '${entry.kind}'.`);
      continue;
    }
    if (entry.kind === "area-edge") {
      const match = areaGeometries.some((geometry) => JSON.stringify(geometry) === JSON.stringify(entry.geometry));
      if (!match) failures.push("(f) area-edge input is not identical to a geometry in ancient-areas.geojson.");
      continue;
    }
    if (entry.kind === "ne-land") {
      const match = naturalEarthLandGeometries.some((geometry) => JSON.stringify(geometry) === JSON.stringify(entry.geometry));
      if (!match) failures.push("(f) ne-land input is not identical to pinned Natural Earth land geometry.");
      continue;
    }
    if (entry.kind === "ne-river-slice" || entry.kind === "ne-lake-slice") {
      const coordinates = entry.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        failures.push(`(f) ${entry.kind} must be a LineString with at least 2 coordinates.`);
        continue;
      }
      const referenceIndex = entry.kind === "ne-river-slice" ? naturalEarthRiversIndex : naturalEarthLakesIndex;
      const samples = densifiedLineSamples(coordinates, 0.1);
      let localMaximumKm = 0;
      let worstSample = null;
      for (const sample of samples) {
        const nearestKm = nearestDistanceFromSegmentIndexKm(sample, referenceIndex);
        if (nearestKm < Infinity) {
          if (nearestKm > localMaximumKm) {
            localMaximumKm = nearestKm;
            worstSample = sample;
          }
        } else {
          localMaximumKm = Number.POSITIVE_INFINITY;
          worstSample = sample;
          break;
        }
      }
      sliceMaximums.push({
        kind: entry.kind,
        source: entry.source ?? "unspecified",
        maxDistanceKm: localMaximumKm,
        worstSample
      });
      if (!Number.isFinite(localMaximumKm) || localMaximumKm > maxSliceDistanceKm) {
        failures.push(
          `(f) ${entry.kind} sample ${JSON.stringify(worstSample)} is ${Number.isFinite(localMaximumKm) ? localMaximumKm.toFixed(4) : "∞"} km from pinned ${
            entry.kind === "ne-river-slice" ? "rivers" : "lakes"
          }.`
        );
        continue;
      }
      riverSliceGeometries.push(entry.geometry);
      continue;
    }
    if (entry.kind === "empire-edge-slice") {
      const coordinates = entry.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        failures.push("(f) empire-edge-slice must be a LineString with at least 2 coordinates.");
        continue;
      }
      const samples = densifiedLineSamples(coordinates, 0.1);
      for (const sample of samples) {
        const nearestKm = nearestDistanceFromSegmentIndexKm(sample, empireEdgeIndex);
        if (nearestKm > 0.001) {
          failures.push(`(f) empire-edge-slice sample ${JSON.stringify(sample)} is ${nearestKm.toFixed(4)} km from ancient-empire-edge.`);
          break;
        }
      }
      continue;
    }
    if (entry.kind === "edge-river-connector") {
      const coordinates = entry.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        failures.push("(f) edge-river-connector must contain exactly 2 coordinates.");
        continue;
      }
      const [start, end] = coordinates;
      const startToEmpireKm = nearestDistanceFromSegmentIndexKm(start, empireEdgeIndex);
      const endToEmpireKm = nearestDistanceFromSegmentIndexKm(end, empireEdgeIndex);
      const empireEnd = startToEmpireKm <= endToEmpireKm ? start : end;
      const riverEnd = empireEnd === start ? end : start;
      const empireDistanceKm = Math.min(startToEmpireKm, endToEmpireKm);
      if (empireDistanceKm > 0.001) {
        failures.push("(f) edge-river-connector has no endpoint within 1 m of an empire-edge slice.");
        continue;
      }
      const touchingRiver = riverSliceGeometries
        .map((geometry) => ({ geometry, distanceKm: nearestGeometryDistanceKm(riverEnd, [geometry]) }))
        .sort((left, right) => left.distanceKm - right.distanceKm)[0];
      if (!touchingRiver || touchingRiver.distanceKm > 0.001) {
        failures.push("(f) edge-river-connector river endpoint is not within 1 m of a validated river slice.");
        continue;
      }
      const connectorLengthKm = distanceBetweenPointsKm(empireEnd, riverEnd);
      const nearestOnRiver = nearestPointOnGeometryForPoint(empireEnd, touchingRiver.geometry);
      const trueDistanceKm = nearestOnRiver?.distanceKm ?? Number.POSITIVE_INFINITY;
      if (Math.abs(connectorLengthKm - trueDistanceKm) > 0.02) {
        failures.push(
          `(f) edge-river-connector length ${connectorLengthKm.toFixed(4)} km differs from true empire-edge→river distance ${trueDistanceKm.toFixed(4)} km by over 20 m.`
        );
      }
      continue;
    }
    if (entry.kind === "anchor-segment") {
      const coordinates = entry.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        failures.push("(f) anchor-segment must contain exactly 2 coordinates.");
        continue;
      }
      const [start, end] = coordinates;
      const nearestStart = nearestAnchor(start, anchorCoordinatesById);
      const nearestEnd = nearestAnchor(end, anchorCoordinatesById);
      if (!nearestStart || !nearestEnd || nearestStart.distanceKm > 0.001 || nearestEnd.distanceKm > 0.001) {
        failures.push("(f) anchor-segment endpoints are not within 1 m of manifest anchors.");
      }
      continue;
    }
    if (entry.kind === "anchor-river-connector") {
      const coordinates = entry.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        failures.push("(f) anchor-river-connector must contain exactly 2 coordinates.");
        continue;
      }
      const [start, end] = coordinates;
      const nearestStart = nearestAnchor(start, anchorCoordinatesById);
      const nearestEnd = nearestAnchor(end, anchorCoordinatesById);
      const anchorEnd = nearestStart?.distanceKm <= nearestEnd?.distanceKm ? nearestStart : nearestEnd;
      const riverEnd = anchorEnd === nearestStart ? end : start;
      if (!anchorEnd || anchorEnd.distanceKm > 0.001) {
        failures.push("(f) anchor-river-connector has no endpoint within 1 m of a manifest anchor.");
        continue;
      }
      const touchingRiver = riverSliceGeometries
        .map((geometry) => ({ geometry, distanceKm: nearestGeometryDistanceKm(riverEnd, [geometry]) }))
        .sort((left, right) => left.distanceKm - right.distanceKm)[0];
      if (!touchingRiver || touchingRiver.distanceKm > 0.001) {
        failures.push("(f) anchor-river-connector river endpoint is not within 1 m of a validated river slice.");
        continue;
      }
      const anchorPoint = anchorEnd.coordinates;
      const connectorLengthKm = distanceBetweenPointsKm(anchorPoint, riverEnd);
      const nearestOnRiver = nearestPointOnGeometryForPoint(anchorPoint, touchingRiver.geometry);
      const trueDistanceKm = nearestOnRiver?.distanceKm ?? Number.POSITIVE_INFINITY;
      if (Math.abs(connectorLengthKm - trueDistanceKm) > 0.001) {
        failures.push(
          `(f) anchor-river-connector length ${connectorLengthKm.toFixed(4)} km differs from true anchor→river distance ${trueDistanceKm.toFixed(4)} km by over 1 m.`
        );
      }
    }
  }
  return { failures, sliceMaximums };
}

function evaluateCheckE({ featureById, anchorCoordinatesById, seededError = null }) {
  const failures = [];
  const anchorChecks = ANCHOR_CHECKS.map((anchor) => {
    const coordinates = anchorCoordinatesById.get(anchor.anchorId);
    if (!coordinates) {
      failures.push(`(e) Missing anchor '${anchor.anchorId}' in data/geo/region-anchors.json.`);
    }
    return { ...anchor, coordinates };
  });
  if (seededError === "e") {
    const amisus = anchorChecks.find((anchor) => anchor.anchorId === "amisus");
    if (amisus) amisus.coordinates = [33, 39];
  }
  for (const anchor of anchorChecks) {
    if (!Array.isArray(anchor.coordinates) || anchor.coordinates.length < 2) continue;
    if (anchor.mode === "boundary") {
      const [leftId, rightId] = anchor.regions;
      const left = featureById.get(leftId);
      const right = featureById.get(rightId);
      if (!left || !right) continue;
      const leftDistance = distanceToGeometryKm(anchor.coordinates, left.geometry);
      const rightDistance = distanceToGeometryKm(anchor.coordinates, right.geometry);
      if (leftDistance > 0.15 || rightDistance > 0.15) {
        failures.push(`(e) ${anchor.name} expected on the ${leftId}/${rightId} boundary (distances ${leftDistance.toFixed(3)} km, ${rightDistance.toFixed(3)} km).`);
      }
      continue;
    }
    const feature = featureById.get(anchor.regionId);
    if (!feature) continue;
    const inside = pointInGeometry(anchor.coordinates, feature.geometry);
    const shouldBeInside = anchor.mode === "inside";
    if (inside !== shouldBeInside) {
      failures.push(`(e) ${anchor.name} expected ${shouldBeInside ? "inside" : "outside"} ${anchor.regionId}.`);
    }
  }

  const groupSeedChecks = [
    { groupName: "group-a", labels: GROUP_A_LABELS, regions: ["pisidia", "lycaonia", "mysia", "phrygia"] },
    { groupName: "group-b", labels: GROUP_B_LABELS, regions: ["media", "mesopotamia"] }
  ];
  for (const group of groupSeedChecks) {
    for (const [anchorId, label] of group.labels.entries()) {
      const coordinates = anchorCoordinatesById.get(anchorId);
      if (!Array.isArray(coordinates) || coordinates.length < 2) {
        failures.push(`(e) ${group.groupName}: missing seed '${anchorId}'.`);
        continue;
      }
      const insideRegions = group.regions.filter((regionId) => {
        const feature = featureById.get(regionId);
        return feature ? pointInGeometry(coordinates, feature.geometry) : false;
      });
      if (label === "outside") {
        if (insideRegions.length > 0) {
          failures.push(`(e) ${group.groupName}: outside seed '${anchorId}' falls inside ${insideRegions.join(", ")}.`);
        }
        continue;
      }
      if (!insideRegions.includes(label)) {
        failures.push(`(e) ${group.groupName}: seed '${anchorId}' labelled '${label}' is not inside ${label}.`);
      }
      const wrongRegions = insideRegions.filter((regionId) => regionId !== label);
      if (wrongRegions.length > 0) {
        failures.push(`(e) ${group.groupName}: seed '${anchorId}' labelled '${label}' also lies in ${wrongRegions.join(", ")}.`);
      }
    }
  }

  for (const check of M520_EXTRA_OUTSIDE_CHECKS) {
    if (Array.isArray(check.regionIds)) {
      for (const regionId of check.regionIds) {
        const feature = featureById.get(regionId);
        if (feature && pointInGeometry(check.point, feature.geometry)) {
          failures.push(`(e) ${check.name} expected outside ${regionId}.`);
        }
      }
      continue;
    }
    const feature = featureById.get(check.regionId);
    const inside = feature ? pointInGeometry(check.point, feature.geometry) : false;
    if (check.expected === "inside") {
      if (!inside) failures.push(`(e) ${check.name} expected inside ${check.regionId}.`);
    } else if (inside) {
      failures.push(`(e) ${check.name} expected outside ${check.regionId}.`);
    }
  }
  for (const check of M520_FIXED_POINT_CHECKS) {
    const feature = featureById.get(check.regionId);
    const inside = feature ? pointInGeometry(check.point, feature.geometry) : false;
    if (check.expected === "outside" && inside) {
      failures.push(`(e) ${check.name} expected outside ${check.regionId}.`);
    }
    if (check.expected === "inside" && !inside) {
      failures.push(`(e) ${check.name} expected inside ${check.regionId}.`);
    }
  }
  const pitaneCoordinates = anchorCoordinatesById.get("pitane");
  const mysia = featureById.get("mysia");
  if (pitaneCoordinates && mysia) {
    const pitaneInside = pointInGeometry(pitaneCoordinates, mysia.geometry);
    const pitaneDistanceKm = distanceToGeometryKm(pitaneCoordinates, mysia.geometry);
    if (!pitaneInside && pitaneDistanceKm > 1) {
      failures.push(`(e) Pitane must be inside Mysia or within 1 km (currently ${pitaneDistanceKm.toFixed(3)} km).`);
    }
  }
  const mediaFeature = featureById.get("media");
  if (mediaFeature) {
    for (const guard of M520_MEDIA_GUARDS.inside) {
      if (!pointInGeometry(guard.point, mediaFeature.geometry)) {
        failures.push(`(e) media guard '${guard.name}' expected inside media.`);
      }
    }
    for (const guard of M520_MEDIA_GUARDS.outside) {
      if (pointInGeometry(guard.point, mediaFeature.geometry)) {
        failures.push(`(e) media guard '${guard.name}' expected outside media.`);
      }
    }
  }

  return failures;
}

function evaluateCheckF({
  features,
  anchorsById,
  anchorCoordinatesById,
  allowedTagged,
  naturalEarthLandGeometries,
  naturalEarthRivers,
  naturalEarthLakes,
  areaGeometries,
  empireEdgeGeometries
}) {
  const started = Date.now();
  const failures = [];
  if (!Array.isArray(allowedTagged)) {
    failures.push("(f) build did not return tagged permitted inputs.");
    return { failures, elapsedMs: Date.now() - started, sliceMaximums: [] };
  }
  const kindValidation = validateAllowedInputKinds({
    allowedTagged,
    anchorCoordinatesById,
    naturalEarthRivers,
    naturalEarthLakes,
    naturalEarthLandGeometries,
    areaGeometries,
    empireEdgeGeometries
  });
  failures.push(...kindValidation.failures);
  const bisectors = [
    ...bisectorLinesByLabel({ anchorsById, labelsByAnchorId: GROUP_A_LABELS, marginDegrees: 6 }),
    ...bisectorLinesByLabel({ anchorsById, labelsByAnchorId: GROUP_B_LABELS, marginDegrees: 8 })
  ];
  const sampleBounds = combineBboxes(features.map((feature) => geometryBbox(feature.geometry)).filter(Boolean));
  const maxToleranceKm = Math.max(...Object.values(SIMPLIFY_INTERVAL_METRES).map((metres) => metres / 1000 + 0.1));
  const segmentEntries = [
    ...allowedTagged.flatMap((entry) =>
      segmentsFromGeometry(entry.geometry).map(([start, end]) => ({ kind: entry.kind, start, end }))
    ),
    ...bisectors.flatMap((geometry) =>
      segmentsFromGeometry(geometry).map(([start, end]) => ({ kind: "group-bisector", start, end }))
    )
  ];
  const segmentIndex = buildSegmentGridIndex({
    segmentEntries,
    sampleBounds,
    expandDegrees: maxToleranceKm / 110.574
  });
  for (const feature of features) {
    const toleranceKm = regionToleranceKm(feature.id);
    for (const vertex of densifiedEdgeSamples(feature.geometry, 1)) {
      let nearest = Infinity;
      for (const segment of segmentIndex.getCandidates(vertex)) {
        if (!M519_REGION_IDS.has(feature.id) && M519_KINDS.has(segment.kind)) continue;
        nearest = Math.min(nearest, distancePointToSegmentKm(vertex, segment.start, segment.end));
      }
      if (nearest > toleranceKm) {
        failures.push(`(f) ${feature.id} has sample ${JSON.stringify(vertex)} farther than permitted inputs (${nearest.toFixed(3)} km > ${toleranceKm.toFixed(3)} km).`);
        break;
      }
    }
  }
  return { failures, elapsedMs: Date.now() - started, sliceMaximums: kindValidation.sliceMaximums };
}

function measureCoastalContactKm(geometry, coastlineIndex, stepKm = 0.2, thresholdKm = 0.3) {
  let coastalKm = 0;
  let perimeterKm = 0;
  for (const ring of ringsOf(geometry)) {
    for (let index = 1; index < ring.length; index += 1) {
      const start = ring[index - 1];
      const end = ring[index];
      const lengthKm = Math.max(segmentLengthKm(start, end), 1e-6);
      const steps = Math.max(1, Math.ceil(lengthKm / stepKm));
      for (let step = 0; step < steps; step += 1) {
        const t0 = step / steps;
        const t1 = (step + 1) / steps;
        const p0 = [start[0] + t0 * (end[0] - start[0]), start[1] + t0 * (end[1] - start[1])];
        const p1 = [start[0] + t1 * (end[0] - start[0]), start[1] + t1 * (end[1] - start[1])];
        const midpoint = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        const pieceKm = segmentLengthKm(p0, p1);
        perimeterKm += pieceKm;
        const nearestKm = nearestDistanceFromSegmentIndexKm(midpoint, coastlineIndex);
        if (nearestKm <= thresholdKm) coastalKm += pieceKm;
      }
    }
  }
  return { coastalKm, perimeterKm };
}

function evaluateM520CoastalTouch({ featureById, naturalEarthLandGeometries }) {
  const failures = [];
  const regionOrder = ["pisidia", "lycaonia", "phrygia", "mesopotamia", "mysia", "media"];
  const coastAllowed = new Set(["mysia", "media"]);
  const coastSegments = naturalEarthLandGeometries.flatMap((geometry) =>
    ringSegments(geometry).map(([start, end]) => ({ kind: "ne-coast", start, end }))
  );
  const sampleBounds = combineBboxes(
    regionOrder
      .map((regionId) => featureById.get(regionId)?.geometry)
      .filter(Boolean)
      .map((geometry) => geometryBbox(geometry))
      .filter(Boolean)
  );
  const coastlineIndex = buildSegmentGridIndex({
    segmentEntries: coastSegments,
    sampleBounds,
    expandDegrees: 0.3 / 110.574
  });
  const figures = [];
  for (const regionId of regionOrder) {
    const feature = featureById.get(regionId);
    if (!feature) continue;
    const measured = measureCoastalContactKm(feature.geometry, coastlineIndex, 0.2, 0.3);
    figures.push({ regionId, ...measured });
    if (!coastAllowed.has(regionId) && measured.coastalKm > 0.05) {
      failures.push(
        `(g) ${regionId} touches coastline for ${measured.coastalKm.toFixed(1)} km (must be 0.0 km unless research marks a coastal edge).`
      );
    }
  }
  return { failures, figures };
}

async function evaluateMesopotamiaDrawnAreaAdjacency({ featureById, areaFeatures, empireEdgeGeometries, naturalEarthRiverFeatures, anchorCoordinatesById }) {
  const failures = [];
  const mesopotamia = featureById.get("mesopotamia");
  const drawnAreas = (areaFeatures ?? []).filter((feature) => feature?.geometry && feature?.properties?.areaId !== "mesopotamia");
  if (!mesopotamia || drawnAreas.length === 0) {
    return {
      failures: ["(g) missing mesopotamia or drawn area features for adjacency checks."],
      overlapKm2: null,
      maxGapKm: null,
      maxGapPoint: null,
      excludedNearHandoffSamples: 0
    };
  }

  let overlapKm2 = 0;
  for (const area of drawnAreas) {
    overlapKm2 += await clippedAreaKm2(
      mesopotamia,
      area,
      `mesopotamia-overlap-${String(area.properties?.areaId ?? "area").replace(/[^a-z0-9-]+/gi, "-")}`
    );
  }
  if (overlapKm2 >= 1) {
    failures.push(`(g) mesopotamia overlaps drawn areas by ${overlapKm2.toFixed(3)} km² (must be < 1 km²).`);
  }

  const lineStringsFromGeometry = (geometry) => {
    if (!geometry) return [];
    if (geometry.type === "LineString") return [geometry];
    if (geometry.type === "MultiLineString") return (geometry.coordinates ?? []).map((coordinates) => ({ type: "LineString", coordinates }));
    return [];
  };
  const empireSlices = (empireEdgeGeometries ?? []).flatMap((geometry) => lineStringsFromGeometry(geometry));
  if (empireSlices.length === 0) {
    failures.push("(g) mesopotamia has no empire-edge geometry for west-edge validation.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }

  const arsamosata = anchorCoordinatesById?.get("arsamosata");
  const euphratesChain = Array.isArray(arsamosata)
    ? stitchNamedRiverChain(naturalEarthRiverFeatures, /(euphrates|firat|alfurat)/iu, arsamosata)
    : null;
  const euphratesSlices = euphratesChain ? [{ type: "LineString", coordinates: euphratesChain }] : [];
  if (euphratesSlices.length === 0) {
    failures.push("(g) mesopotamia could not derive Euphrates geometry from pinned Natural Earth rivers.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }

  const drawnAreaGeometries = drawnAreas.map((feature) => feature.geometry);
  const sampleStepKm = 0.2;
  const boundaryToleranceKm = 0.01;
  const riverBandKm = 5;
  const handoffExclusionKm = 1;
  const mesopotamiaToleranceKm = regionToleranceKm("mesopotamia");

  const mesopotamiaBoundaryFrontierSamples = densifiedEdgeSamples(mesopotamia.geometry, sampleStepKm).filter((sample) =>
    nearestGeometryDistanceKm(sample, drawnAreaGeometries) <= boundaryToleranceKm &&
    nearestGeometryDistanceKm(sample, euphratesSlices) <= riverBandKm &&
    nearestGeometryDistanceKm(sample, empireSlices) <= 0.05
  );
  if (mesopotamiaBoundaryFrontierSamples.length === 0) {
    failures.push("(g) mesopotamia could not derive its north-west frontier corner from pinned inputs.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }
  const northWestPoint = [...mesopotamiaBoundaryFrontierSamples].sort((left, right) => {
    if (Math.abs(right[1] - left[1]) > 1e-9) return right[1] - left[1];
    return left[0] - right[0];
  })[0];

  const frontierSamples = empireSlices.flatMap((line) => densifiedLineSamples(line.coordinates ?? [], sampleStepKm))
    .filter((sample) =>
      nearestGeometryDistanceKm(sample, drawnAreaGeometries) <= boundaryToleranceKm &&
      nearestGeometryDistanceKm(sample, euphratesSlices) <= riverBandKm
    );
  if (frontierSamples.length === 0) {
    failures.push("(g) mesopotamia found no frontier samples on drawn boundaries near the Euphrates.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }

  const frontierLine = stitchEmpireEdgeChain(empireEdgeGeometries, northWestPoint);
  if (!frontierLine || frontierLine.length < 2) {
    failures.push("(g) mesopotamia could not derive the empire-edge frontier line for gap validation.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }

  const nearestFrontierVertexIndex = frontierLine
    .map((vertex, index) => ({ index, distanceKm: distanceBetweenPointsKm(vertex, northWestPoint) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0]?.index ?? 0;
  const forwardVertices = frontierLine.slice(nearestFrontierVertexIndex);
  const backwardVertices = frontierLine.slice(0, nearestFrontierVertexIndex + 1).reverse();
  const forwardMinLat = Math.min(...forwardVertices.map((point) => point[1]));
  const backwardMinLat = Math.min(...backwardVertices.map((point) => point[1]));
  const scorePath = (vertices) => vertices.reduce(
    (score, vertex) => (
      nearestGeometryDistanceKm(vertex, drawnAreaGeometries) <= boundaryToleranceKm &&
      nearestGeometryDistanceKm(vertex, euphratesSlices) <= riverBandKm
        ? score + 1
        : score
    ),
    0
  );
  const frontierPath = forwardMinLat < backwardMinLat
    ? forwardVertices
    : backwardMinLat < forwardMinLat
      ? backwardVertices
      : scorePath(forwardVertices) >= scorePath(backwardVertices)
        ? forwardVertices
        : backwardVertices;

  const riverDistancesByVertex = frontierPath.map((vertex) => nearestGeometryDistanceKm(vertex, euphratesSlices));
  let handoffVertexIndex = -1;
  for (let index = 0; index < frontierPath.length - 1; index += 1) {
    const currentOnFrontier = riverDistancesByVertex[index] <= riverBandKm &&
      nearestGeometryDistanceKm(frontierPath[index], drawnAreaGeometries) <= boundaryToleranceKm;
    if (currentOnFrontier && riverDistancesByVertex[index + 1] > riverBandKm) {
      handoffVertexIndex = index;
    }
  }
  if (handoffVertexIndex < 0) {
    failures.push("(g) mesopotamia could not derive the west-edge hand-off vertex from empire-edge/river distances.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples: 0 };
  }
  const handoffVertex = frontierPath[handoffVertexIndex];
  const frontierSegment = frontierPath.slice(0, handoffVertexIndex + 1);
  const measuredFrontierSamples = densifiedLineSamples(frontierSegment, sampleStepKm).filter((sample) =>
    nearestGeometryDistanceKm(sample, drawnAreaGeometries) <= boundaryToleranceKm &&
    nearestGeometryDistanceKm(sample, euphratesSlices) <= riverBandKm
  );
  // The hand-off connector intentionally leaves the shared frontier at a local hairpin; skip samples
  // within 1 km of the hand-off so this by-construction loop simplification does not register as a gap.
  const includedSamples = measuredFrontierSamples.filter((sample) => distanceBetweenPointsKm(sample, handoffVertex) > handoffExclusionKm);
  const excludedNearHandoffSamples = measuredFrontierSamples.length - includedSamples.length;
  if (includedSamples.length === 0) {
    failures.push("(g) mesopotamia west-edge gap check had no samples outside the hand-off exclusion zone.");
    return { failures, overlapKm2, maxGapKm: null, maxGapPoint: null, excludedNearHandoffSamples };
  }

  let maxGapKm = 0;
  let maxGapPoint = null;
  for (const sample of includedSamples) {
    const gapKm = distanceToGeometryKm(sample, mesopotamia.geometry);
    if (gapKm > maxGapKm) {
      maxGapKm = gapKm;
      maxGapPoint = sample;
    }
  }
  if (maxGapKm > mesopotamiaToleranceKm) {
    failures.push(
      `(g) mesopotamia max gap to drawn areas is ${maxGapKm.toFixed(3)} km at [${maxGapPoint[0].toFixed(5)},${maxGapPoint[1].toFixed(5)}] (must be <= ${mesopotamiaToleranceKm.toFixed(3)} km).`
    );
  }
  return { failures, overlapKm2, maxGapKm, maxGapPoint, excludedNearHandoffSamples };
}

async function runRegionOutlineChecks({ seededError, cacheRoot }) {
  const outlines = JSON.parse(await fs.readFile(regionOutlinePath, "utf8"));
  const anchors = JSON.parse(await fs.readFile(anchorsPath, "utf8"));
  const ancientAreas = JSON.parse(await fs.readFile(path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson"), "utf8"));
  const empireEdge = JSON.parse(await fs.readFile(empireEdgePath, "utf8"));
  const rebuilt = await buildRegionOutlinesData({ writeOutput: false });
  const pinnedInputFiles = await fetchPinnedInputs(ancientGeoCache(cacheRoot).inputs);
  const naturalEarthLand = await readJsonFile(pinnedInputFiles.naturalEarthLand);
  const naturalEarthRiversMain = await readJsonFile(pinnedInputFiles.naturalEarthRiversMain);
  const naturalEarthRiversEurope = await readJsonFile(pinnedInputFiles.naturalEarthRiversEurope);
  const naturalEarthLakes = await readJsonFile(pinnedInputFiles.naturalEarthLakes);
  const locationFiles = (await fs.readdir(locationsDirectory))
    .filter((name) => name.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right));
  const locations = await Promise.all(
    locationFiles.map(async (name) =>
      JSON.parse(await fs.readFile(path.join(locationsDirectory, name), "utf8"))
    )
  );
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const features = outlines.features ?? [];
  const featureById = new Map(features.map((feature) => [feature.id, feature]));
  const areaFeatures = ancientAreas.features ?? [];
  const areaById = new Map(areaFeatures.map((feature) => [feature?.properties?.areaId, feature]).filter(([id]) => typeof id === "string"));
  const anchorCoordinatesById = new Map(
    (anchors.anchors ?? [])
      .filter((anchor) => typeof anchor?.id === "string" && Array.isArray(anchor?.coordinates))
      .map((anchor) => [anchor.id, anchor.coordinates])
  );
  const anchorsById = new Map((anchors.anchors ?? []).map((anchor) => [anchor.id, anchor]));
  const failures = [];
  const rebuiltBytes = `${JSON.stringify(rebuilt.collection, null, 2)}\n`;
  const committedBytes = await fs.readFile(regionOutlinePath, "utf8");

  if (committedBytes !== rebuiltBytes) {
    failures.push("(a) data/geo/region-outlines.geojson is not reproducible from scripts/build-region-outlines.mjs.");
  }

  applySeededError(featureById, seededError);

  for (const regionId of REQUIRED_REGION_IDS) {
    if (!featureById.has(regionId)) {
      failures.push(`Missing outline feature '${regionId}'.`);
    }
  }

  for (const [regionId, feature] of featureById.entries()) {
    const confidence = feature?.properties?.confidence;
    if (!["high", "medium", "low"].includes(confidence)) {
      failures.push(`${regionId}: confidence must be high|medium|low.`);
    }
    const sources = feature?.properties?.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      failures.push(`${regionId}: missing properties.sources.`);
    }
    const geometryType = feature?.geometry?.type;
    if (geometryType !== "Polygon" && geometryType !== "MultiPolygon") {
      failures.push(`${regionId}: geometry must be Polygon or MultiPolygon.`);
      continue;
    }
    if (!booleanValid(feature)) {
      failures.push(`${regionId}: geometry is invalid.`);
    }
  }

  // (b) Region point inside.
  for (const regionId of REQUIRED_REGION_IDS) {
    const location = locationById.get(regionId);
    const feature = featureById.get(regionId);
    if (!location || !feature) continue;
    const regionPoint = location?.candidates?.[0]?.coordinates;
    if (!Array.isArray(regionPoint) || regionPoint.length < 2) continue;
    if (!pointInGeometry(regionPoint, feature.geometry)) {
      failures.push(`(b) ${regionId}: region point is outside its outline.`);
    }
  }

  // (c) Child places inside or within 1 km, with named exceptions.
  for (const regionId of REQUIRED_REGION_IDS) {
    const feature = featureById.get(regionId);
    if (!feature) continue;
    const children = locations.filter((location) => location.parentId === regionId);
    for (const child of children) {
      for (const candidate of child.candidates ?? []) {
        const key = candidateExceptionKey(child.id, candidate);
        if (COAST_EXCEPTIONS.has(key)) continue;
        const coordinates = candidate?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
        if (pointInGeometry(coordinates, feature.geometry)) continue;
        const distanceKm = distanceToGeometryKm(coordinates, feature.geometry);
        if (distanceKm > 1) {
          failures.push(
            `(c) ${child.id} (${regionId}) candidate '${candidate.label}' is ${distanceKm.toFixed(2)} km from the outline.`
          );
        }
      }
    }
  }

  // (d) Shared borders are built once.
  for (const [leftId, rightId] of SHARED_EDGE_PAIRS) {
    const left = featureById.get(leftId);
    const right = featureById.get(rightId);
    if (!left || !right) continue;
    const leftSegments = new Set(ringSegments(left.geometry).map(([start, end]) => normalizedSegmentKey(start, end)));
    const rightSegments = new Set(ringSegments(right.geometry).map(([start, end]) => normalizedSegmentKey(start, end)));
    const shared = [...leftSegments].filter((segment) => rightSegments.has(segment));
    if (shared.length === 0) failures.push(`(d) ${leftId}|${rightId} has no shared boundary segments.`);
  }

  // (e) and (f) shared checks.
  failures.push(...evaluateCheckE({ featureById, anchorCoordinatesById, seededError }));
  const checkFResult = evaluateCheckF({
    features,
    anchorsById,
    anchorCoordinatesById,
    allowedTagged: rebuilt.allowedInputGeometriesTagged,
    naturalEarthLandGeometries: (naturalEarthLand.features ?? []).map((feature) => feature.geometry),
    naturalEarthRivers: [
      ...(naturalEarthRiversMain.features ?? []).map((feature) => feature.geometry),
      ...(naturalEarthRiversEurope.features ?? []).map((feature) => feature.geometry)
    ],
    naturalEarthLakes: (naturalEarthLakes.features ?? []).map((feature) => feature.geometry),
    areaGeometries: (ancientAreas.features ?? []).map((feature) => feature.geometry),
    empireEdgeGeometries: (empireEdge.features ?? []).map((feature) => feature.geometry)
  });
  failures.push(...checkFResult.failures);
  for (const maximum of checkFResult.sliceMaximums) {
    console.log(
      `(f) ${maximum.kind} (${maximum.source}) max sample distance ${(maximum.maxDistanceKm * 1000).toFixed(1)} m`
    );
  }
  console.log(`(f) provenance step took ${Math.round(checkFResult.elapsedMs / 1000)} s.`);

  const coastalTouch = evaluateM520CoastalTouch({
    featureById,
    naturalEarthLandGeometries: (naturalEarthLand.features ?? []).map((feature) => feature.geometry)
  });
  for (const figure of coastalTouch.figures) {
    console.log(
      `(g) coast-touch ${figure.regionId}: ${figure.coastalKm.toFixed(1)} km of ${figure.perimeterKm.toFixed(1)} km perimeter within 0.3 km of NE coastline`
    );
  }
  failures.push(...coastalTouch.failures);

  const mesopotamiaAdjacency = await evaluateMesopotamiaDrawnAreaAdjacency({
    featureById,
    areaFeatures,
    empireEdgeGeometries: (empireEdge.features ?? []).map((feature) => feature.geometry),
    naturalEarthRiverFeatures: [
      ...(naturalEarthRiversMain.features ?? []),
      ...(naturalEarthRiversEurope.features ?? [])
    ],
    anchorCoordinatesById
  });
  if (mesopotamiaAdjacency.overlapKm2 != null && mesopotamiaAdjacency.maxGapKm != null) {
    const atText = mesopotamiaAdjacency.maxGapPoint
      ? `[${mesopotamiaAdjacency.maxGapPoint[0].toFixed(5)},${mesopotamiaAdjacency.maxGapPoint[1].toFixed(5)}]`
      : "unknown";
    console.log(
      `(g) mesopotamia drawn-area overlap ${mesopotamiaAdjacency.overlapKm2.toFixed(3)} km²; max gap to drawn areas ${mesopotamiaAdjacency.maxGapKm.toFixed(3)} km at ${atText}; excluded ${mesopotamiaAdjacency.excludedNearHandoffSamples} sample(s) within 1 km of hand-off`
    );
  }
  failures.push(...mesopotamiaAdjacency.failures);

  // (g) Area sanity and part sanity.
  failures.push(...evaluateAreaSanity(featureById, rebuilt.sanity));

  if (failures.length > 0) {
    throw new Error(`Region outline checks failed:\n- ${failures.join("\n- ")}`);
  }
  console.log("Region outline checks passed (a) through (g).");
  return {
    rebuilt,
    anchors,
    anchorCoordinatesById,
    anchorsById,
    naturalEarthLandGeometries: (naturalEarthLand.features ?? []).map((feature) => feature.geometry),
    naturalEarthRivers: [
      ...(naturalEarthRiversMain.features ?? []).map((feature) => feature.geometry),
      ...(naturalEarthRiversEurope.features ?? []).map((feature) => feature.geometry)
    ],
    naturalEarthRiverFeatures: [
      ...(naturalEarthRiversMain.features ?? []),
      ...(naturalEarthRiversEurope.features ?? [])
    ],
    naturalEarthLakes: (naturalEarthLakes.features ?? []).map((feature) => feature.geometry),
    areaGeometries: (ancientAreas.features ?? []).map((feature) => feature.geometry),
    areaFeatures: ancientAreas.features ?? [],
    empireEdgeGeometries: (empireEdge.features ?? []).map((feature) => feature.geometry),
    mesopotamiaAdjacency
  };
}

async function proofFOnFe27276() {
  const previous = spawnSync("git", ["show", "fe27276:data/geo/region-outlines.geojson"], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  if (previous.status !== 0) throw new Error(`git show failed: ${previous.stderr}`);
  const oldCollection = JSON.parse(previous.stdout);
  const oldSamaria = (oldCollection.features ?? []).find((feature) => feature.id === "samaria");
  if (!oldSamaria) throw new Error("fe27276 has no samaria feature.");
  const rebuilt = await buildRegionOutlinesData({ writeOutput: false });
  let maxDistanceKm = 0;
  for (const vertex of vertexList(oldSamaria.geometry)) {
    let nearest = Infinity;
    for (const geometry of rebuilt.allowedInputGeometries) {
      nearest = Math.min(nearest, distanceToAnyGeometryKm(vertex, geometry));
    }
    maxDistanceKm = Math.max(maxDistanceKm, nearest);
  }
  if (maxDistanceKm <= 0.1) throw new Error(`Expected fe27276 Samaria to fail (f), but max distance is ${maxDistanceKm.toFixed(3)} km.`);
  console.log(`Proof for (f): fe27276 samaria fails with max vertex distance ${maxDistanceKm.toFixed(3)} km (> 0.100 km).`);
}

async function proofEgOn20320e9() {
  const previous = spawnSync("git", ["show", "20320e9:data/geo/region-outlines.geojson"], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  if (previous.status !== 0) throw new Error(`git show failed: ${previous.stderr}`);
  const oldCollection = JSON.parse(previous.stdout);
  const oldById = new Map((oldCollection.features ?? []).map((feature) => [feature.id, feature]));
  const rebuilt = await buildRegionOutlinesData({ writeOutput: false });
  const failures = [];
  const anchors = JSON.parse(await fs.readFile(anchorsPath, "utf8"));
  const anchorCoordinatesById = new Map(
    (anchors.anchors ?? []).map((anchor) => [anchor.id, anchor.coordinates])
  );
  for (const anchor of ANCHOR_CHECKS) {
    if (anchor.mode !== "outside") continue;
    const coordinates = anchorCoordinatesById.get(anchor.anchorId);
    if (!Array.isArray(coordinates) || coordinates.length < 2) continue;
    const feature = oldById.get(anchor.regionId);
    if (feature && pointInGeometry(coordinates, feature.geometry)) {
      failures.push(`(e) ${anchor.name} is inside ${anchor.regionId} in 20320e9.`);
    }
  }
  failures.push(...evaluateAreaSanity(oldById, rebuilt.sanity));
  if (failures.length === 0) {
    throw new Error("Expected 20320e9 to fail new (e)/(g) checks, but it passed.");
  }
  console.log("Proof for new checks on 20320e9:");
  for (const failure of failures) console.log(`- ${failure}`);
}

async function proofM520On8a8f467({ context }) {
  const previous = spawnSync("git", ["show", "8a8f467:data/geo/region-outlines.geojson"], {
    cwd: repositoryRoot,
    encoding: "utf8"
  });
  if (previous.status !== 0) throw new Error(`git show failed: ${previous.stderr}`);
  const oldCollection = JSON.parse(previous.stdout);
  const oldById = new Map((oldCollection.features ?? []).map((feature) => [feature.id, feature]));
  const failures = [];
  failures.push(
    ...evaluateCheckE({
      featureById: oldById,
      anchorCoordinatesById: context.anchorCoordinatesById
    })
  );
  const checkFResult = evaluateCheckF({
    features: oldCollection.features ?? [],
    anchorsById: context.anchorsById,
    anchorCoordinatesById: context.anchorCoordinatesById,
    allowedTagged: context.rebuilt.allowedInputGeometriesTagged,
    naturalEarthLandGeometries: context.naturalEarthLandGeometries,
    naturalEarthRivers: context.naturalEarthRivers,
    naturalEarthLakes: context.naturalEarthLakes,
    areaGeometries: context.areaGeometries,
    empireEdgeGeometries: context.empireEdgeGeometries
  });
  failures.push(...checkFResult.failures);
  if (failures.length === 0) throw new Error("Expected 8a8f467 to fail strengthened M5-20 checks, but it passed.");
  console.log("Proof for strengthened M5-20 checks on 8a8f467:");
  for (const failure of failures) console.log(`- ${failure}`);
}

function firstLineVertex(geometries) {
  for (const geometry of geometries) {
    if (geometry?.type === "LineString" && (geometry.coordinates?.length ?? 0) > 0) return geometry.coordinates[0];
    if (geometry?.type === "MultiLineString") {
      for (const line of geometry.coordinates ?? []) {
        if ((line?.length ?? 0) > 0) return line[0];
      }
    }
  }
  return null;
}

async function proofInjectedRiverSlice({ context }) {
  const euphratesPoint = firstLineVertex(
    context.rebuilt.allowedInputGeometriesTagged
      .filter((entry) => entry.kind === "ne-river-slice" && entry.source === "euphrates")
      .map((entry) => entry.geometry)
  );
  const tigrisPoint = firstLineVertex(
    context.rebuilt.allowedInputGeometriesTagged
      .filter((entry) => entry.kind === "ne-river-slice" && entry.source === "tigris")
      .map((entry) => entry.geometry)
  );
  if (!euphratesPoint || !tigrisPoint) {
    throw new Error("Injected-river-slice proof could not find Euphrates/Tigris slice vertices.");
  }
  const injectedAllowed = [
    ...context.rebuilt.allowedInputGeometriesTagged,
    {
      kind: "ne-river-slice",
      source: "proof-injected-bridge",
      geometry: {
        type: "LineString",
        coordinates: [euphratesPoint, tigrisPoint]
      }
    }
  ];
  const result = evaluateCheckF({
    features: context.rebuilt.collection.features ?? [],
    anchorsById: context.anchorsById,
    anchorCoordinatesById: context.anchorCoordinatesById,
    allowedTagged: injectedAllowed,
    naturalEarthLandGeometries: context.naturalEarthLandGeometries,
    naturalEarthRivers: context.naturalEarthRivers,
    naturalEarthLakes: context.naturalEarthLakes,
    areaGeometries: context.areaGeometries,
    empireEdgeGeometries: context.empireEdgeGeometries
  });
  const rejection = result.failures.find(
    (failure) => failure.includes("(f) ne-river-slice sample") && failure.includes("pinned rivers")
  );
  if (!rejection) {
    throw new Error("Expected injected two-point river bridge to fail ne-river-slice validation, but it passed.");
  }
  console.log("Proof for injected ne-river-slice fault:");
  console.log(`- ${rejection}`);
}

async function proofP4OnCb75908({ context }) {
  const evaluateRevision = async (revision) => {
    const previous = spawnSync("git", ["show", `${revision}:data/geo/region-outlines.geojson`], {
      cwd: repositoryRoot,
      encoding: "utf8"
    });
    if (previous.status !== 0) throw new Error(`git show failed: ${previous.stderr}`);
    const oldCollection = JSON.parse(previous.stdout);
    const oldById = new Map((oldCollection.features ?? []).map((feature) => [feature.id, feature]));
    const failures = [];

    const lycaoniaLocation = JSON.parse(await fs.readFile(path.join(locationsDirectory, "lycaonia.json"), "utf8"));
    const lycaoniaPoint = lycaoniaLocation?.candidates?.[0]?.coordinates;
    const lycaoniaFeature = oldById.get("lycaonia");
    if (Array.isArray(lycaoniaPoint) && lycaoniaFeature && !pointInGeometry(lycaoniaPoint, lycaoniaFeature.geometry)) {
      failures.push("(b) lycaonia: region point is outside its outline.");
    }

    failures.push(
      ...evaluateCheckE({
        featureById: oldById,
        anchorCoordinatesById: context.anchorCoordinatesById
      })
    );
    const mesopotamiaAdjacency = await evaluateMesopotamiaDrawnAreaAdjacency({
      featureById: oldById,
      areaFeatures: context.areaFeatures,
      empireEdgeGeometries: context.empireEdgeGeometries,
      naturalEarthRiverFeatures: context.naturalEarthRiverFeatures,
      anchorCoordinatesById: context.anchorCoordinatesById
    });
    failures.push(...mesopotamiaAdjacency.failures);
    return failures;
  };

  const cbFailures = await evaluateRevision("cb75908");
  if (cbFailures.length === 0) {
    throw new Error("Expected cb75908 to fail P4 checks, but it passed.");
  }
  console.log("Proof for P4 checks on cb75908:");
  for (const failure of cbFailures) console.log(`- ${failure}`);

  const e2350efFailures = await evaluateRevision("e2350ef");
  if (!e2350efFailures.some((line) => line.includes("overlaps drawn areas"))) {
    throw new Error("Expected e2350ef to fail P4 overlap check, but it did not.");
  }
  console.log("Proof for P4 overlap check on e2350ef:");
  for (const failure of e2350efFailures.filter((line) => line.includes("overlaps drawn areas") || line.includes("max gap to drawn areas"))) {
    console.log(`- ${failure}`);
  }
}

async function proofLycaoniaDropInland() {
  try {
    await buildRegionOutlinesData({ writeOutput: false, seededError: "lycaonia-drop-inland" });
  } catch (error) {
    const message = String(error?.message ?? "");
    if (
      message.includes("lycaonia: dropped detached part") &&
      (message.includes("does not touch Natural Earth coastline within 0.3 km") || message.includes("overlaps or lies inside a drawn area"))
    ) {
      console.log("Proof for Lycaonia dropped-part rule:");
      console.log(`- ${message}`);
      return;
    }
    throw error;
  }
  throw new Error("Expected seeded Lycaonia inland dropped-part fault to throw, but it passed.");
}

async function verifyGazaFaceReproducibility(cacheRoot) {
  const committed = JSON.parse(await fs.readFile(gazaFacePath, "utf8"));
  const regenerated = await regenerateGazaRhinocoluraFaceFromCache(cacheRoot);
  const committedBytes = `${JSON.stringify(committed, null, 2)}\n`;
  const regeneratedBytes = `${JSON.stringify(regenerated, null, 2)}\n`;
  if (committedBytes !== regeneratedBytes) {
    throw new Error(
      "data/geo/sources/gaza-rhinocolura-face.geojson is not reproducible from the pinned AD 69 compose output."
    );
  }
}

async function main() {
  const {
    seededError,
    proofFOnFe27276: runProof,
    proofEgOn20320e9: runProofEg,
    proofM520On8a8f467: runProofM520,
    proofInjectedRiverSlice: runProofInjectedRiverSlice,
    proofP4OnCb75908: runProofP4OnCb75908,
    proofLycaoniaDropInland: runProofLycaoniaDropInland
  } = parseArguments(process.argv.slice(2));
  const before = changedGeoFiles();
  if (before.length > 0) throw new Error(`data/geo/ has uncommitted changes, so the rebuild can't be compared with it:\n${before.join("\n")}`);
  const cache = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-ancient-geo-check-"));
  const started = Date.now();
  try {
    const build = spawnSync(process.execPath, [path.join("scripts", "build-ancient-geo.mjs")], {
      cwd: repositoryRoot,
      env: { ...process.env, ANCIENT_GEO_CACHE: cache },
      stdio: "inherit"
    });
    if (build.status !== 0) throw new Error(`npm run build:ancient-geo failed (exit code ${build.status})`);
    const after = changedGeoFiles();
    if (after.length > 0) throw new Error(`The rebuild from an empty cache differs from the committed data/geo/:\n${after.join("\n")}`);
    await verifyGazaFaceReproducibility(cache);
    const context = await runRegionOutlineChecks({ seededError, cacheRoot: cache });
    if (runProof) {
      await proofFOnFe27276();
    }
    if (runProofEg) {
      await proofEgOn20320e9();
    }
    if (runProofM520) {
      await proofM520On8a8f467({ context });
    }
    if (runProofInjectedRiverSlice) {
      await proofInjectedRiverSlice({ context });
    }
    if (runProofP4OnCb75908) {
      await proofP4OnCb75908({ context });
    }
    if (runProofLycaoniaDropInland) {
      await proofLycaoniaDropInland();
    }
    console.log(`Reproduced data/geo/ byte for byte from an empty cache in ${Math.round((Date.now() - started) / 1000)} s.`);
  } finally {
    await fs.rm(cache, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
