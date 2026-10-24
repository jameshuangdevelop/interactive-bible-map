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
import booleanValid from "@turf/boolean-valid";
import { distancePointToSegmentKm, distanceToGeometryKm, pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { buildRegionOutlinesData } from "./build-region-outlines.mjs";
import { geometryAreaKm2, polygonsOf } from "./lib/geometry-cleanup.mjs";
import { regenerateGazaRhinocoluraFaceFromCache } from "./lib/gaza-rhinocolura-face.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regionOutlinePath = path.join(repositoryRoot, "data", "geo", "region-outlines.geojson");
const anchorsPath = path.join(repositoryRoot, "data", "geo", "region-anchors.json");
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
    throw new Error(`Unknown argument '${argument}'.`);
  }
  if (seededError && !["b", "d", "e"].includes(seededError)) {
    throw new Error("--seed-error supports only b, d or e.");
  }
  return { seededError, proofFOnFe27276, proofEgOn20320e9 };
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
}

async function runRegionOutlineChecks({ seededError }) {
  const outlines = JSON.parse(await fs.readFile(regionOutlinePath, "utf8"));
  const anchors = JSON.parse(await fs.readFile(anchorsPath, "utf8"));
  const rebuilt = await buildRegionOutlinesData({ writeOutput: false });
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
  const anchorCoordinatesById = new Map(
    (anchors.anchors ?? [])
      .filter((anchor) => typeof anchor?.id === "string" && Array.isArray(anchor?.coordinates))
      .map((anchor) => [anchor.id, anchor.coordinates])
  );
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
    if (regionId === "lycaonia") continue; // PO-4: label-point exception named in research.
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

  // (e) Anchors on stated sides.
  const anchorChecks = ANCHOR_CHECKS.map((anchor) => {
    const coordinates = anchorCoordinatesById.get(anchor.anchorId);
    if (!coordinates) {
      failures.push(`(e) Missing anchor '${anchor.anchorId}' in data/geo/region-anchors.json.`);
    }
    return { ...anchor, coordinates };
  });
  if (seededError === "e") {
    const amisus = anchorChecks.find((anchor) => anchor.anchorId === "amisus");
    if (amisus) {
      amisus.coordinates = [33, 39];
    }
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

  // (f) Every vertex is from an allowed input edge/line (within 100 m).
  const allowed = rebuilt.allowedInputGeometries;
  for (const feature of features) {
    for (const vertex of vertexList(feature.geometry)) {
      let nearest = Infinity;
      for (const geometry of allowed) {
        nearest = Math.min(nearest, distanceToAnyGeometryKm(vertex, geometry));
      }
      if (nearest > 0.1) {
        failures.push(`(f) ${feature.id} has vertex ${JSON.stringify(vertex)} farther than 100 m from permitted inputs (${nearest.toFixed(3)} km).`);
        break;
      }
    }
  }

  // (g) Area sanity and part sanity.
  failures.push(...evaluateAreaSanity(featureById, rebuilt.sanity));

  if (failures.length > 0) {
    throw new Error(`Region outline checks failed:\n- ${failures.join("\n- ")}`);
  }
  console.log("Region outline checks passed (a) through (g).");
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
  const { seededError, proofFOnFe27276: runProof, proofEgOn20320e9: runProofEg } = parseArguments(process.argv.slice(2));
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
    await runRegionOutlineChecks({ seededError });
    if (runProof) {
      await proofFOnFe27276();
    }
    if (runProofEg) {
      await proofEgOn20320e9();
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
