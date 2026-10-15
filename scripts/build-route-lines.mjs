import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { ancientGeoCache, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import {
  ROUTE_LINE_INPUTS,
  fetchPinnedRouteLineInputs
} from "./lib/route-line-inputs.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(repositoryRoot, "data");
const locationsDirectory = path.join(dataDirectory, "locations");
const routesPath = path.join(dataDirectory, "routes", "routes.json");
const routeStopsPath = path.join(dataDirectory, "routes", "stops.json");
const routeLinesPath = path.join(dataDirectory, "geo", "routes-lines.geojson");
const roadsPath = path.join(dataDirectory, "geo", "ancient-roads.geojson");

const REGION_LEVEL_TYPES = new Set(["empire", "province", "region"]);
const LAND_SNAP_MAX_KM = 15;
const WATER_CONNECTOR_DISTANCE_KM = 5;
const REGION_VIA_REDUNDANT_RADIUS_KM = 250;
const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});
const WATER_DETOUR_MAX_RATIO = 1.25;
const NATURAL_EARTH_SOURCE_IDS = Object.freeze({
  land: "naturalearth:ne-10m-land",
  coastline: "naturalearth:ne-10m-coastline",
  lakes: "naturalearth:ne-10m-lakes"
});
const SEA_STAGE_EXPLICIT_REASONS = new Map([
  [
    "paul-rome::stage-04",
    {
      detail:
        "Acts 27:14–28:1 describes a storm-driven drift from off Crete past Cauda to Malta, so this line still uses the same land-avoidance rule but records the storm as the reason for the open-water leg.",
      sources: [NATURAL_EARTH_SOURCE_IDS.land]
    }
  ]
]);
const SEA_VIA_PASS_POINTS = new Map([
  [
    "paul-3::stage-12::cyprus",
    {
      coordinate: [33.25, 34.42],
      detail:
        "Acts 21:3 says Cyprus was left on the left hand while sailing to Syria, so the line passes south of the island without touching it.",
      sources: [NATURAL_EARTH_SOURCE_IDS.land]
    }
  ],
  [
    "paul-rome::stage-02::cyprus",
    {
      coordinate: [33.25, 35.55],
      detail:
        "Acts 27:4–5 puts the ship under Cyprus's lee and then off Cilicia and Pamphylia, so the line passes north of Cyprus without touching it.",
      sources: [NATURAL_EARTH_SOURCE_IDS.land]
    }
  ],
  [
    "paul-rome::stage-04::cauda",
    {
      coordinate: [24.0, 34.72],
      detail:
        "Acts 27:16 says the ship ran under the lee of Cauda, so the line passes south of the island instead of crossing it.",
      sources: [NATURAL_EARTH_SOURCE_IDS.land]
    }
  ]
]);
const SEA_STAGE_WAYPOINTS = new Map([
  ["paul-1::stage-02", [[35.5, 35.85], [34.6, 35.45]]],
  ["paul-1::stage-04", [[32.0, 34.85], [31.0, 35.8]]],
  ["paul-1::stage-14", [[30.8, 35.75], [33.1, 35.65], [35.7, 35.85]]],
  ["paul-2::stage-04", [[25.95, 40.12]]],
  ["paul-2::stage-05", [[25.35, 40.65]]],
  ["paul-2::stage-12", [[23.9, 36.85], [25.1, 37.0], [26.6, 37.5]]],
  ["paul-2::stage-13", [[27.4, 36.6], [29.6, 35.6], [32.4, 34.8], [34.6, 33.7]]],
  ["paul-3::stage-03", [[24.8, 40.75], [25.95, 40.12]]],
  ["paul-3::stage-05", [[26.5, 39.15]]],
  ["paul-3::stage-06", [[26.5, 38.8], [26.1375, 38.3725], [26.55, 37.8]]],
  ["paul-3::stage-07", [[26.85, 37.75]]],
  ["paul-3::stage-08", [[27.0, 37.55]]],
  ["paul-3::stage-09", [[27.2, 37.0], [27.0, 36.7]]],
  ["paul-3::stage-10", [[27.0, 36.55], [27.9, 36.25]]],
  ["paul-3::stage-11", [[28.25, 36.1]]],
  ["paul-3::stage-12", [[28.6, 35.4], [31.5, 34.5], [33.25, 34.42], [35.0, 34.2]]],
  ["paul-3::stage-13", [[35.0, 33.05]]],
  ["paul-rome::stage-01", [[35.0, 33.5]]],
  ["paul-rome::stage-02", [[34.8, 35.65], [33.25, 35.55], [30.1, 36.0]]],
  ["paul-rome::stage-03", [[29.3, 36.0], [27.375, 36.6858], [26.4, 35.6], [26.3116, 35.316]]],
  ["paul-rome::stage-04", [[24.0, 34.72], [20.0, 35.0], [15.2, 35.6]]],
  ["paul-rome::stage-05", [[15.1, 36.3], [15.2, 36.8]]],
  ["paul-rome::stage-06", [[15.7, 37.6]]],
  ["paul-rome::stage-07", [[15.8, 38.0], [14.2, 39.0], [13.3, 40.3]]]
]);
const LAND_STAGE_WAYPOINTS = new Map([
  ["paul-rome::stage-08", [[14.25, 41.03], [13.9, 41.18], [13.35, 41.3]]],
  ["jesus::segment-03", [[35.35, 32.77], [35.48, 32.82]]],
  ["jesus::segment-07", [[35.5, 32.72], [35.42, 31.85]]],
  ["jesus::segment-19", [[35.5, 32.72], [35.35, 32.45]]]
]);

function round(value, decimals = 6) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function haversineKm(left, right) {
  const [lon1, lat1] = left;
  const [lon2, lat2] = right;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function coordinateKey([lon, lat]) {
  return `${round(lon, 6).toFixed(6)},${round(lat, 6).toFixed(6)}`;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === "," && !quoted) {
      out.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  out.push(current);
  return out;
}

function lineStringsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }
  if (geometry.type === "LineString") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates;
  }
  return [];
}

function geometryBounds(geometry) {
  if (!geometry) {
    return null;
  }
  const coordinatesByGeometryType = [];
  if (geometry.type === "Polygon") {
    coordinatesByGeometryType.push(...(geometry.coordinates ?? []).flat());
  } else if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates ?? []) {
      coordinatesByGeometryType.push(...polygon.flat());
    }
  } else if (geometry.type === "LineString") {
    coordinatesByGeometryType.push(...(geometry.coordinates ?? []));
  } else if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates ?? []) {
      coordinatesByGeometryType.push(...line);
    }
  }
  if (coordinatesByGeometryType.length === 0) {
    return null;
  }
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const coordinate of coordinatesByGeometryType) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      continue;
    }
    minLon = Math.min(minLon, coordinate[0]);
    maxLon = Math.max(maxLon, coordinate[0]);
    minLat = Math.min(minLat, coordinate[1]);
    maxLat = Math.max(maxLat, coordinate[1]);
  }
  if (!Number.isFinite(minLon)) {
    return null;
  }
  return { minLon, maxLon, minLat, maxLat };
}

function buildLandMask(features) {
  return (features ?? [])
    .map((feature) => {
      const geometry = feature?.geometry ?? feature;
      const bounds = geometryBounds(geometry);
      if (!geometry || !bounds) {
        return null;
      }
      return boundsOverlap(bounds, PROJECT_BOUNDS) ? { geometry, bounds } : null;
    })
    .filter(Boolean);
}

function pointWithinBounds([lon, lat], bounds) {
  return (
    lon >= bounds.minLon &&
    lon <= bounds.maxLon &&
    lat >= bounds.minLat &&
    lat <= bounds.maxLat
  );
}

function nearestPointOnSegment(point, start, end) {
  const [px, py] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return [x1, y1];
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return [x1 + t * dx, y1 + t * dy];
}

function dedupeCoordinates(coordinates) {
  const deduped = [];
  for (const coordinate of coordinates) {
    const rounded = [round(coordinate[0], 6), round(coordinate[1], 6)];
    const previous = deduped[deduped.length - 1];
    if (!previous || previous[0] !== rounded[0] || previous[1] !== rounded[1]) {
      deduped.push(rounded);
    }
  }
  return deduped;
}

function geometryEndpoints(geometry) {
  if (!geometry) {
    return null;
  }
  if (geometry.type === "LineString") {
    const coordinates = geometry.coordinates ?? [];
    if (coordinates.length < 2) {
      return null;
    }
    return {
      start: coordinates[0],
      end: coordinates[coordinates.length - 1]
    };
  }
  if (geometry.type === "MultiLineString") {
    const parts = geometry.coordinates ?? [];
    if (parts.length === 0 || parts[0].length < 2) {
      return null;
    }
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    return {
      start: firstPart[0],
      end: lastPart[lastPart.length - 1]
    };
  }
  return null;
}

async function readLocationsById() {
  const entries = await fs.readdir(locationsDirectory, { withFileTypes: true });
  const records = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const location = await readJsonFile(path.join(locationsDirectory, entry.name));
    records.set(location.id, location);
  }
  return records;
}

function resolveStopRef(stopRef, { locationsById, routeStopsById }) {
  if (stopRef?.kind === "location") {
    const location = locationsById.get(stopRef.locationId);
    const index = Number.isInteger(stopRef.candidateIndex) ? stopRef.candidateIndex : 0;
    const candidate = location?.candidates?.[index];
    return {
      id: `location:${stopRef.locationId}:${index}`,
      stopRef,
      locationId: stopRef.locationId,
      label: location?.names?.ancient?.[0] ?? stopRef.locationId,
      type: location?.type ?? "site",
      zoomTier: location?.zoomTier,
      coordinate: candidate?.coordinates,
      sources: candidate?.sources ?? []
    };
  }
  const stop = routeStopsById.get(stopRef.stopId);
  const index = Number.isInteger(stopRef?.candidateIndex) ? stopRef.candidateIndex : 0;
  const candidate = stop?.candidates?.[index];
  return {
    id: `route-stop:${stopRef.stopId}:${index}`,
    stopRef,
    stopId: stopRef?.stopId,
    label: stop?.name ?? stopRef?.stopId,
    type: "route-stop",
    coordinate: candidate?.coordinates,
    sources: candidate?.sources ?? []
  };
}

function buildRoadGraph(roadsData) {
  const nodes = new Map();
  const adjacency = new Map();
  let edgeCount = 0;

  function ensureNode(coordinate) {
    const key = coordinateKey(coordinate);
    if (!nodes.has(key)) {
      nodes.set(key, [round(coordinate[0], 6), round(coordinate[1], 6)]);
    }
    if (!adjacency.has(key)) {
      adjacency.set(key, []);
    }
    return key;
  }

  for (const feature of roadsData.features ?? []) {
    const roadId = feature?.properties?.roadId;
    for (const line of lineStringsFromGeometry(feature.geometry)) {
      for (let index = 1; index < line.length; index += 1) {
        const left = line[index - 1];
        const right = line[index];
        const leftKey = ensureNode(left);
        const rightKey = ensureNode(right);
        const weight = haversineKm(left, right);
        const edge = {
          to: rightKey,
          weight,
          roadId
        };
        const reverse = {
          to: leftKey,
          weight,
          roadId
        };
        adjacency.get(leftKey).push(edge);
        adjacency.get(rightKey).push(reverse);
        edgeCount += 1;
      }
    }
  }

  return { nodes, adjacency, edgeCount };
}

function nearestRoadNode(coordinate, graph, maxDistanceKm = LAND_SNAP_MAX_KM) {
  let best = null;
  for (const [key, nodeCoordinate] of graph.nodes) {
    const distanceKm = haversineKm(coordinate, nodeCoordinate);
    if (!best || distanceKm < best.distanceKm) {
      best = { key, coordinate: nodeCoordinate, distanceKm };
    }
  }
  if (!best || best.distanceKm > maxDistanceKm) {
    return null;
  }
  return best;
}

function shortestPathInGraph(startKey, endKey, adjacency) {
  if (startKey === endKey) {
    return { keys: [startKey], edgeIds: [] };
  }
  const distance = new Map([[startKey, 0]]);
  const previous = new Map();
  const queue = [{ key: startKey, distance: 0 }];

  while (queue.length > 0) {
    queue.sort((left, right) => left.distance - right.distance);
    const current = queue.shift();
    if (!current || current.key === endKey) {
      break;
    }
    const currentDistance = distance.get(current.key);
    if (currentDistance == null || current.distance > currentDistance) {
      continue;
    }
    for (const edge of adjacency.get(current.key) ?? []) {
      const candidateDistance = currentDistance + edge.weight;
      const known = distance.get(edge.to);
      if (known == null || candidateDistance < known) {
        distance.set(edge.to, candidateDistance);
        previous.set(edge.to, { key: current.key, edgeId: edge.roadId });
        queue.push({ key: edge.to, distance: candidateDistance });
      }
    }
  }

  if (!distance.has(endKey)) {
    return null;
  }

  const keys = [endKey];
  const edgeIds = [];
  let current = endKey;
  while (current !== startKey) {
    const previousEntry = previous.get(current);
    if (!previousEntry) {
      return null;
    }
    keys.push(previousEntry.key);
    if (previousEntry.edgeId) {
      edgeIds.push(previousEntry.edgeId);
    }
    current = previousEntry.key;
  }
  keys.reverse();
  edgeIds.reverse();
  return { keys, edgeIds };
}

function parseOrbis(orbisNodesCsv, orbisEdgesCsv) {
  const nodes = new Map();
  const adjacency = new Map();

  for (const line of orbisNodesCsv.trim().split(/\r?\n/u).slice(1)) {
    const [idText, label, xText, yText] = parseCsvLine(line);
    const id = Number(idText);
    const x = Number(xText);
    const y = Number(yText);
    nodes.set(id, {
      id,
      label,
      x,
      y
    });
    adjacency.set(id, []);
  }

  for (const line of orbisEdgesCsv.trim().split(/\r?\n/u).slice(1)) {
    const [sourceText, targetText, kmText, _days, _expense, type] = parseCsvLine(line);
    if (!SEA_EDGE_TYPES.has(type)) {
      continue;
    }
    const source = Number(sourceText);
    const target = Number(targetText);
    const weight = Number(kmText);
    const edgeId = `orbis:edge-${source}-${target}-${type}`;
    adjacency.get(source)?.push({ to: target, weight, edgeId });
    adjacency.get(target)?.push({ to: source, weight, edgeId });
  }

  return { nodes, adjacency };
}

function isZeroCoordinate([lon, lat]) {
  return lon === 0 && lat === 0;
}

function inProjectBounds([lon, lat]) {
  return (
    lon >= PROJECT_BOUNDS.minLon &&
    lon <= PROJECT_BOUNDS.maxLon &&
    lat >= PROJECT_BOUNDS.minLat &&
    lat <= PROJECT_BOUNDS.maxLat
  );
}

function orbisNodeCandidates(node) {
  if (!node) {
    return [];
  }
  const raw = [round(node.x, 6), round(node.y, 6)];
  const swapped = [round(node.y, 6), round(node.x, 6)];
  const unique = [];
  for (const coordinate of [raw, swapped]) {
    if (!Number.isFinite(coordinate[0]) || !Number.isFinite(coordinate[1])) {
      continue;
    }
    if (isZeroCoordinate(coordinate)) {
      continue;
    }
    if (!unique.some((existing) => existing[0] === coordinate[0] && existing[1] === coordinate[1])) {
      unique.push(coordinate);
    }
  }
  return unique;
}

function nearestOrbisNode(coordinate, orbis, maxDistanceKm = SEA_NODE_SNAP_MAX_KM) {
  let best = null;
  for (const node of orbis.nodes.values()) {
    for (const candidate of orbisNodeCandidates(node)) {
      const distanceKm = haversineKm(coordinate, candidate);
      const outOfBoundsPenalty = inProjectBounds(candidate) ? 0 : 5;
      const score = distanceKm + outOfBoundsPenalty;
      if (!best || score < best.score) {
        best = { nodeId: node.id, distanceKm, score };
      }
    }
  }
  if (!best || best.distanceKm > maxDistanceKm) {
    return null;
  }
  return best;
}

function shortestPathOrbis(startNodeId, endNodeId, orbis) {
  if (startNodeId === endNodeId) {
    return { nodeIds: [startNodeId], edgeIds: [] };
  }
  const distance = new Map([[startNodeId, 0]]);
  const previous = new Map();
  const queue = [{ nodeId: startNodeId, distance: 0 }];

  while (queue.length > 0) {
    queue.sort((left, right) => left.distance - right.distance);
    const current = queue.shift();
    if (!current || current.nodeId === endNodeId) {
      break;
    }
    const currentDistance = distance.get(current.nodeId);
    if (currentDistance == null || current.distance > currentDistance) {
      continue;
    }
    for (const edge of orbis.adjacency.get(current.nodeId) ?? []) {
      const candidateDistance = currentDistance + edge.weight;
      const known = distance.get(edge.to);
      if (known == null || candidateDistance < known) {
        distance.set(edge.to, candidateDistance);
        previous.set(edge.to, { nodeId: current.nodeId, edgeId: edge.edgeId });
        queue.push({ nodeId: edge.to, distance: candidateDistance });
      }
    }
  }

  if (!distance.has(endNodeId)) {
    return null;
  }

  const nodeIds = [endNodeId];
  const edgeIds = [];
  let current = endNodeId;
  while (current !== startNodeId) {
    const prev = previous.get(current);
    if (!prev) {
      return null;
    }
    nodeIds.push(prev.nodeId);
    edgeIds.push(prev.edgeId);
    current = prev.nodeId;
  }
  nodeIds.reverse();
  edgeIds.reverse();
  return { nodeIds, edgeIds };
}

function orientOrbisPathCoordinates(nodeIds, start, end, context) {
  const choices = [];
  for (const nodeId of nodeIds) {
    const node = context.orbis.nodes.get(nodeId);
    const candidates = orbisNodeCandidates(node);
    const coastalCandidates = candidates.filter(
      (coordinate) => context.nearestCoast(coordinate).distanceKm <= 4.5
    );
    const usableCandidates = coastalCandidates.length > 0 ? coastalCandidates : candidates;
    if (usableCandidates.length === 0) {
      continue;
    }
    choices.push({ nodeId, candidates: usableCandidates });
  }
  if (choices.length === 0) {
    return [];
  }

  const dp = choices.map(() => []);
  for (let index = 0; index < choices.length; index += 1) {
    const previousChoices = index === 0 ? [{ coordinate: start, cost: 0, choice: -1 }] : dp[index - 1];
    for (let candidateIndex = 0; candidateIndex < choices[index].candidates.length; candidateIndex += 1) {
      const coordinate = choices[index].candidates[candidateIndex];
      const coastPenalty = context.nearestCoast(coordinate).distanceKm * 0.04;
      const boundsPenalty = inProjectBounds(coordinate) ? 0 : 20;
      let bestPrevious = null;
      for (let previousIndex = 0; previousIndex < previousChoices.length; previousIndex += 1) {
        const previousChoice = previousChoices[previousIndex];
        const segmentPenalty = haversineKm(previousChoice.coordinate, coordinate);
        const candidateCost = previousChoice.cost + segmentPenalty + coastPenalty + boundsPenalty;
        if (!bestPrevious || candidateCost < bestPrevious.cost) {
          bestPrevious = { cost: candidateCost, previousIndex };
        }
      }
      dp[index].push({
        coordinate,
        cost: bestPrevious.cost,
        previousIndex: bestPrevious.previousIndex
      });
    }
  }

  let bestFinal = null;
  const finalChoices = dp[dp.length - 1];
  for (let index = 0; index < finalChoices.length; index += 1) {
    const option = finalChoices[index];
    const totalCost = option.cost + haversineKm(option.coordinate, end);
    if (!bestFinal || totalCost < bestFinal.totalCost) {
      bestFinal = { totalCost, index };
    }
  }

  const result = [];
  let choiceIndex = bestFinal.index;
  for (let index = dp.length - 1; index >= 0; index -= 1) {
    const option = dp[index][choiceIndex];
    result.push(option.coordinate);
    choiceIndex = option.previousIndex;
  }
  result.reverse();
  return dedupeCoordinates(result);
}

function pathGridStepDegrees(start, end) {
  const span = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
  if (span <= 1.2) {
    return 0.025;
  }
  if (span <= 5) {
    return 0.04;
  }
  return 0.12;
}

function shortestSurfacePath(start, end, context, { surfaceName, isPassable, crossesForbidden }) {
  if (!crossesForbidden(start, end)) {
    return dedupeCoordinates([start, end]);
  }

  const margin = Math.max(0.35, Math.min(2.5, haversineKm(start, end) / 250));
  const step = pathGridStepDegrees(start, end);
  const minLon = Math.max(PROJECT_BOUNDS.minLon, Math.min(start[0], end[0]) - margin);
  const maxLon = Math.min(PROJECT_BOUNDS.maxLon, Math.max(start[0], end[0]) + margin);
  const minLat = Math.max(PROJECT_BOUNDS.minLat, Math.min(start[1], end[1]) - margin);
  const maxLat = Math.min(PROJECT_BOUNDS.maxLat, Math.max(start[1], end[1]) + margin);
  const nodeKey = ([lon, lat]) => `${Math.round((lon - minLon) / step)},${Math.round((lat - minLat) / step)}`;
  const nodes = new Map();
  const addNode = (coordinate, force = false) => {
    const roundedCoordinate = [round(coordinate[0], 6), round(coordinate[1], 6)];
    const key = force ? `${surfaceName}:${roundedCoordinate[0]},${roundedCoordinate[1]}` : nodeKey(roundedCoordinate);
    if (nodes.has(key)) {
      return key;
    }
    if (!force && !isPassable(roundedCoordinate)) {
      return null;
    }
    nodes.set(key, roundedCoordinate);
    return key;
  };

  for (let lon = minLon; lon <= maxLon + 1e-9; lon += step) {
    for (let lat = minLat; lat <= maxLat + 1e-9; lat += step) {
      addNode([lon, lat]);
    }
  }
  const startKey = addNode(start, true);
  const endKey = addNode(end, true);
  if (!startKey || !endKey) {
    throw new Error(`Could not add ${surfaceName} path endpoints.`);
  }

  const keysByGridKey = new Map();
  for (const [key, coordinate] of nodes) {
    const gridKey = nodeKey(coordinate);
    if (!keysByGridKey.has(gridKey)) {
      keysByGridKey.set(gridKey, []);
    }
    keysByGridKey.get(gridKey).push(key);
  }

  const neighbourOffsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
    [-2, -1], [-1, -2], [1, -2], [2, -1],
    [-2, 1], [-1, 2], [1, 2], [2, 1]
  ];
  const neighbours = (key) => {
    const coordinate = nodes.get(key);
    const gridX = Math.round((coordinate[0] - minLon) / step);
    const gridY = Math.round((coordinate[1] - minLat) / step);
    const out = [];
    for (const [dx, dy] of neighbourOffsets) {
      const candidateKeys = keysByGridKey.get(`${gridX + dx},${gridY + dy}`) ?? [];
      for (const candidateKey of candidateKeys) {
        if (candidateKey !== key) {
          out.push(candidateKey);
        }
      }
    }
    if (key === startKey) {
      for (const [candidateKey, candidateCoordinate] of nodes) {
        if (candidateKey !== key && haversineKm(coordinate, candidateCoordinate) <= step * 140) {
          out.push(candidateKey);
        }
      }
    }
    return out;
  };

  const edgeAllowed = new Map();
  const canUseEdge = (leftKey, rightKey) => {
    const cacheKey = leftKey < rightKey ? `${leftKey}|${rightKey}` : `${rightKey}|${leftKey}`;
    if (!edgeAllowed.has(cacheKey)) {
      edgeAllowed.set(cacheKey, !crossesForbidden(nodes.get(leftKey), nodes.get(rightKey)));
    }
    return edgeAllowed.get(cacheKey);
  };

  const heap = [];
  const heapPush = (entry) => {
    heap.push(entry);
    let index = heap.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (heap[parent].f <= entry.f) {
        break;
      }
      heap[index] = heap[parent];
      index = parent;
    }
    heap[index] = entry;
  };
  const heapPop = () => {
    if (heap.length === 0) {
      return null;
    }
    const out = heap[0];
    const last = heap.pop();
    if (heap.length > 0 && last) {
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        if (left >= heap.length) {
          break;
        }
        const child = right < heap.length && heap[right].f < heap[left].f ? right : left;
        if (heap[child].f >= last.f) {
          break;
        }
        heap[index] = heap[child];
        index = child;
      }
      heap[index] = last;
    }
    return out;
  };

  const distance = new Map([[startKey, 0]]);
  const previous = new Map();
  heapPush({ key: startKey, f: haversineKm(start, end), g: 0 });
  while (heap.length > 0) {
    const current = heapPop();
    if (!current) {
      break;
    }
    if (current.g > (distance.get(current.key) ?? Number.POSITIVE_INFINITY)) {
      continue;
    }
    if (current.key === endKey) {
      break;
    }
    const currentCoordinate = nodes.get(current.key);
    for (const neighbourKey of neighbours(current.key)) {
      const neighbourCoordinate = nodes.get(neighbourKey);
      if (!neighbourCoordinate || !canUseEdge(current.key, neighbourKey)) {
        continue;
      }
      const candidateDistance = current.g + haversineKm(currentCoordinate, neighbourCoordinate);
      if (candidateDistance < (distance.get(neighbourKey) ?? Number.POSITIVE_INFINITY)) {
        distance.set(neighbourKey, candidateDistance);
        previous.set(neighbourKey, current.key);
        heapPush({
          key: neighbourKey,
          g: candidateDistance,
          f: candidateDistance + haversineKm(neighbourCoordinate, end)
        });
      }
    }
  }
  if (!distance.has(endKey)) {
    throw new Error(`No ${surfaceName} path found between ${start.join(",")} and ${end.join(",")}.`);
  }
  const keys = [endKey];
  let cursor = endKey;
  while (cursor !== startKey) {
    cursor = previous.get(cursor);
    if (!cursor) {
      throw new Error(`Broken ${surfaceName} path reconstruction.`);
    }
    keys.push(cursor);
  }
  keys.reverse();
  const pathCoordinates = keys.map((key) => nodes.get(key));
  return simplifyByLineOfSight(pathCoordinates, crossesForbidden);
}

function simplifyByLineOfSight(coordinates, crossesForbidden) {
  if (coordinates.length <= 2) {
    return dedupeCoordinates(coordinates);
  }
  const simplified = [coordinates[0]];
  let anchorIndex = 0;
  while (anchorIndex < coordinates.length - 1) {
    let nextIndex = coordinates.length - 1;
    while (nextIndex > anchorIndex + 1) {
      if (!crossesForbidden(coordinates[anchorIndex], coordinates[nextIndex])) {
        break;
      }
      nextIndex -= 1;
    }
    simplified.push(coordinates[nextIndex]);
    anchorIndex = nextIndex;
  }
  return dedupeCoordinates(simplified);
}

function shortestWaterSegment(start, end, context) {
  if (!segmentCrossesLand(start, end, context)) {
    return dedupeCoordinates([start, end]);
  }
  const vectorLon = end[0] - start[0];
  const vectorLat = end[1] - start[1];
  const magnitude = Math.hypot(vectorLon, vectorLat);
  if (magnitude === 0) {
    return [start, end];
  }
  const perpendicular = [-vectorLat / magnitude, vectorLon / magnitude];
  const pointAt = (fraction, offsetDeg, side) => [
    start[0] + vectorLon * fraction + perpendicular[0] * offsetDeg * side,
    start[1] + vectorLat * fraction + perpendicular[1] * offsetDeg * side
  ];
  const toWater = (candidate) =>
    isLandSurface(candidate, context)
      ? context.nearestWater(candidate, end)?.coordinate ?? candidate
      : [round(candidate[0], 6), round(candidate[1], 6)];
  let best = null;
  for (const offset of [0.08, 0.15, 0.25, 0.4, 0.65, 0.9, 1.3, 1.8, 2.5]) {
    for (const side of [-1, 1]) {
      const candidates = [
        [start, toWater(pointAt(0.5, offset, side)), end],
        [start, toWater(pointAt(0.33, offset, side)), toWater(pointAt(0.67, offset, side)), end]
      ];
      for (const candidate of candidates) {
        if (!polylineCrossesLand(candidate, context)) {
          const lengthKm = lineLengthKm(candidate);
          if (!best || lengthKm < best.lengthKm) {
            best = { coordinates: candidate, lengthKm };
          }
        }
      }
    }
  }
  if (best) {
    return dedupeCoordinates(best.coordinates);
  }
  throw new Error(`No water path found between ${start.join(",")} and ${end.join(",")}; add a text-directed waypoint.`);
}

function isOnLand(coordinate, contextOrLandFeatures) {
  if (Array.isArray(contextOrLandFeatures)) {
    return contextOrLandFeatures.some(
      (feature) => pointWithinBounds(coordinate, feature.bounds) && pointInGeometry(coordinate, feature.geometry)
    );
  }
  return isLandSurface(coordinate, contextOrLandFeatures);
}

function buildCoastSegments(coastlineData) {
  const segments = [];
  for (const feature of coastlineData.features ?? []) {
    for (const line of lineStringsFromGeometry(feature.geometry)) {
      for (let index = 1; index < line.length; index += 1) {
        const segment = [line[index - 1], line[index]];
        if (boundsOverlap(expandedSegmentBounds(segment[0], segment[1]), PROJECT_BOUNDS)) {
          segments.push(segment);
        }
      }
    }
  }
  return segments;
}

function polygonRingsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates ?? [];
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates ?? []).flatMap((polygon) => polygon);
  }
  return [];
}

function buildPolygonBoundarySegments(featureCollection) {
  const segments = [];
  for (const feature of featureCollection.features ?? []) {
    for (const ring of polygonRingsFromGeometry(feature.geometry)) {
      for (let index = 1; index < ring.length; index += 1) {
        const segment = [ring[index - 1], ring[index]];
        if (boundsOverlap(expandedSegmentBounds(segment[0], segment[1]), PROJECT_BOUNDS)) {
          segments.push(segment);
        }
      }
    }
  }
  return segments;
}

function buildMaskBoundarySegments(features) {
  const segments = [];
  for (const feature of features) {
    for (const ring of polygonRingsFromGeometry(feature.geometry)) {
      for (let index = 1; index < ring.length; index += 1) {
        const start = ring[index - 1];
        const end = ring[index];
        segments.push({ start, end, bounds: expandedSegmentBounds(start, end, 1e-9) });
      }
    }
  }
  return segments;
}

function nearestCoastPoint(coordinate, coastSegments) {
  let best = null;
  for (const [start, end] of coastSegments) {
    const projected = nearestPointOnSegment(coordinate, start, end);
    const distanceKm = haversineKm(coordinate, projected);
    if (!best || distanceKm < best.distanceKm) {
      best = {
        coordinate: [round(projected[0], 6), round(projected[1], 6)],
        distanceKm
      };
    }
  }
  return best;
}

function nearestSurfaceBoundaryPoint(coordinate, boundarySegments, isPassable, hint = null) {
  let best = null;
  const hintWeight = hint ? 0.03 : 0;
  const nearestRaw = [];
  let candidateSegments = [];
  for (const radius of [0.75, 1.5, 3, 8, 20]) {
    const searchBounds = {
      minLon: coordinate[0] - radius,
      maxLon: coordinate[0] + radius,
      minLat: coordinate[1] - radius,
      maxLat: coordinate[1] + radius
    };
    candidateSegments = boundarySegments.filter(([start, end]) =>
      boundsOverlap(searchBounds, expandedSegmentBounds(start, end))
    );
    if (candidateSegments.length > 0) {
      break;
    }
  }
  for (const [start, end] of candidateSegments) {
    const projected = nearestPointOnSegment(coordinate, start, end);
    const rawDistanceKm = haversineKm(coordinate, projected);
    if (nearestRaw.length < 80) {
      nearestRaw.push({ projected, rawDistanceKm });
      nearestRaw.sort((left, right) => left.rawDistanceKm - right.rawDistanceKm);
    } else if (rawDistanceKm < nearestRaw[nearestRaw.length - 1].rawDistanceKm) {
      nearestRaw[nearestRaw.length - 1] = { projected, rawDistanceKm };
      nearestRaw.sort((left, right) => left.rawDistanceKm - right.rawDistanceKm);
    }
  }
  for (const { projected } of nearestRaw) {
    const direction = hint
      ? [hint[0] - projected[0], hint[1] - projected[1]]
      : [projected[0] - coordinate[0], projected[1] - coordinate[1]];
    const magnitude = Math.hypot(direction[0], direction[1]) || 1;
    for (const radius of [0, 0.02, 0.04]) {
      const candidates = [
        [
          projected[0] + (direction[0] / magnitude) * radius,
          projected[1] + (direction[1] / magnitude) * radius
        ],
        projected
      ];
      for (const candidate of candidates) {
        const roundedCandidate = [round(candidate[0], 6), round(candidate[1], 6)];
        const distanceKm = haversineKm(coordinate, roundedCandidate);
        const hintDistanceKm = hint ? haversineKm(roundedCandidate, hint) : 0;
        const score = distanceKm + hintDistanceKm * hintWeight;
        if (!best || score < best.score) {
          best = {
            coordinate: roundedCandidate,
            distanceKm,
            score
          };
        }
      }
    }
  }
  return best;
}

function expandedSegmentBounds(start, end, margin = 0) {
  return {
    minLon: Math.min(start[0], end[0]) - margin,
    maxLon: Math.max(start[0], end[0]) + margin,
    minLat: Math.min(start[1], end[1]) - margin,
    maxLat: Math.max(start[1], end[1]) + margin
  };
}

function boundsOverlap(left, right) {
  return !(
    left.maxLon < right.minLon ||
    left.minLon > right.maxLon ||
    left.maxLat < right.minLat ||
    left.minLat > right.maxLat
  );
}

function cross2d(left, right) {
  return left[0] * right[1] - left[1] * right[0];
}

function segmentIntersectionTs(start, end, edgeStart, edgeEnd) {
  const r = [end[0] - start[0], end[1] - start[1]];
  const s = [edgeEnd[0] - edgeStart[0], edgeEnd[1] - edgeStart[1]];
  const qMinusP = [edgeStart[0] - start[0], edgeStart[1] - start[1]];
  const denominator = cross2d(r, s);
  const epsilon = 1e-12;
  if (Math.abs(denominator) < epsilon) {
    if (Math.abs(cross2d(qMinusP, r)) > epsilon) {
      return [];
    }
    const lengthSquared = r[0] * r[0] + r[1] * r[1];
    if (lengthSquared === 0) {
      return [];
    }
    const t0 = ((edgeStart[0] - start[0]) * r[0] + (edgeStart[1] - start[1]) * r[1]) / lengthSquared;
    const t1 = ((edgeEnd[0] - start[0]) * r[0] + (edgeEnd[1] - start[1]) * r[1]) / lengthSquared;
    return [t0, t1].filter((t) => t >= -1e-10 && t <= 1 + 1e-10);
  }
  const t = cross2d(qMinusP, s) / denominator;
  const u = cross2d(qMinusP, r) / denominator;
  if (t >= -1e-10 && t <= 1 + 1e-10 && u >= -1e-10 && u <= 1 + 1e-10) {
    return [Math.max(0, Math.min(1, t))];
  }
  return [];
}

function pointInFeatureMask(coordinate, features) {
  return features.some(
    (feature) => pointWithinBounds(coordinate, feature.bounds) && pointInGeometry(coordinate, feature.geometry)
  );
}

function isLandSurface(coordinate, context) {
  return (
    pointInFeatureMask(coordinate, context.landFeatures) &&
    !pointInFeatureMask(coordinate, context.lakeFeatures)
  );
}

function collectSurfaceChangeParameters(start, end, boundaryFeatures) {
  const parameters = [0, 1];
  const segmentBounds = expandedSegmentBounds(start, end, 1e-9);
  if (Array.isArray(boundaryFeatures?.[0]?.start)) {
    for (const edge of boundaryFeatures) {
      if (boundsOverlap(segmentBounds, edge.bounds)) {
        parameters.push(...segmentIntersectionTs(start, end, edge.start, edge.end));
      }
    }
    return Array.from(new Set(parameters.map((t) => round(t, 10))))
      .filter((t) => t >= 0 && t <= 1)
      .sort((left, right) => left - right);
  }
  for (const feature of boundaryFeatures) {
    if (!boundsOverlap(segmentBounds, feature.bounds)) {
      continue;
    }
    for (const ring of polygonRingsFromGeometry(feature.geometry)) {
      for (let index = 1; index < ring.length; index += 1) {
        const edgeStart = ring[index - 1];
        const edgeEnd = ring[index];
        if (!boundsOverlap(segmentBounds, expandedSegmentBounds(edgeStart, edgeEnd, 1e-9))) {
          continue;
        }
        parameters.push(...segmentIntersectionTs(start, end, edgeStart, edgeEnd));
      }
    }
  }
  return Array.from(new Set(parameters.map((t) => round(t, 10))))
    .filter((t) => t >= 0 && t <= 1)
    .sort((left, right) => left - right);
}

function segmentCrossesForbiddenSurface(start, end, context, forbiddenPredicate) {
  const parameters = collectSurfaceChangeParameters(start, end, context.surfaceBoundaryFeatures);
  for (let index = 1; index < parameters.length; index += 1) {
    const left = parameters[index - 1];
    const right = parameters[index];
    if (right - left <= 1e-9) {
      continue;
    }
    const t = (left + right) / 2;
    const midpoint = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ];
    if (forbiddenPredicate(midpoint)) {
      return true;
    }
  }
  for (const t of parameters) {
    if (t <= 1e-7 || t >= 1 - 1e-7) {
      continue;
    }
    const point = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ];
    if (forbiddenPredicate(point)) {
      return true;
    }
  }
  return false;
}

function segmentCrossesLand(start, end, context) {
  const distanceKm = haversineKm(start, end);
  const samples = Math.max(8, Math.ceil(distanceKm / 1.5));
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    if (isLandSurface([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], context)) {
      return true;
    }
  }
  return false;
}

function segmentCrossesWater(start, end, context) {
  const distanceKm = haversineKm(start, end);
  const samples = Math.max(8, Math.ceil(distanceKm / 1.5));
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    if (!isLandSurface([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t], context)) {
      return true;
    }
  }
  return false;
}

function lineLengthKm(coordinates) {
  let lengthKm = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    lengthKm += haversineKm(coordinates[index - 1], coordinates[index]);
  }
  return lengthKm;
}

function simplifySeaPolyline(coordinates, landFeatures) {
  if (!Array.isArray(coordinates) || coordinates.length < 3) {
    return coordinates;
  }
  const simplified = [coordinates[0]];
  for (let index = 1; index < coordinates.length - 1; index += 1) {
    const previous = simplified[simplified.length - 1];
    const next = coordinates[index + 1];
    if (!segmentCrossesLand(previous, next, landFeatures)) {
      continue;
    }
    simplified.push(coordinates[index]);
  }
  simplified.push(coordinates[coordinates.length - 1]);
  return dedupeCoordinates(simplified);
}

function polylineCrossesLand(coordinates, landFeatures) {
  for (let index = 1; index < coordinates.length; index += 1) {
    if (segmentCrossesLand(coordinates[index - 1], coordinates[index], landFeatures)) {
      return true;
    }
  }
  return false;
}

function fastSegmentCrossesLand(start, end, landFeatures) {
  return segmentCrossesLand(start, end, landFeatures);
}

function joinCoordinateChains(chains) {
  const out = [];
  for (const chain of chains) {
    if (!Array.isArray(chain) || chain.length === 0) {
      continue;
    }
    if (out.length === 0) {
      out.push(...chain);
      continue;
    }
    const previous = out[out.length - 1];
    const first = chain[0];
    if (previous[0] === first[0] && previous[1] === first[1]) {
      out.push(...chain.slice(1));
    } else {
      out.push(...chain);
    }
  }
  return dedupeCoordinates(out);
}

function routeByLandRoad(stage, stops, roadGraph) {
  const stopSequence = [stops.from, ...stops.via, stops.to];
  const chains = [];
  const edgeIds = [];
  const connectorDetails = [];
  for (let index = 1; index < stopSequence.length; index += 1) {
    const from = stopSequence[index - 1].coordinate;
    const to = stopSequence[index].coordinate;
    const fromNode = nearestRoadNode(from, roadGraph);
    const toNode = nearestRoadNode(to, roadGraph);

    if (!fromNode || !toNode) {
      return null;
    }

    const path = shortestPathInGraph(fromNode.key, toNode.key, roadGraph.adjacency);
    if (!path) {
      return null;
    }
    if (fromNode.distanceKm > 0.2) {
      connectorDetails.push(`${stopSequence[index - 1].label} to road: ${fromNode.distanceKm.toFixed(1)} km`);
    }
    if (toNode.distanceKm > 0.2) {
      connectorDetails.push(`${stopSequence[index].label} to road: ${toNode.distanceKm.toFixed(1)} km`);
    }
    edgeIds.push(...path.edgeIds);
    const nodeCoordinates = path.keys.map((key) => roadGraph.nodes.get(key));
    chains.push([from], nodeCoordinates, [to]);
  }
  const coordinates = joinCoordinateChains(chains);
  return {
    method: "awmc-road-network",
    coordinates,
    upstreamFeatureIds: Array.from(new Set(edgeIds.filter(Boolean).map((roadId) => `awmc:${roadId}`))),
    details:
      `Routed each named land leg on AWMC dated major roads with stop-to-road connectors of at most ${LAND_SNAP_MAX_KM} km.` +
      (connectorDetails.length > 0 ? ` Connectors: ${connectorDetails.join("; ")}.` : ""),
    changeSources: Array.from(new Set(edgeIds.filter(Boolean).map((roadId) => `awmc:${roadId}`)))
  };
}

function routeOverLand(stage, stops, context) {
  const explicitWaypoints = LAND_STAGE_WAYPOINTS.get(`${context.routeId}::${stage.id}`) ?? null;
  if (explicitWaypoints) {
    return {
      method: "shortest-land",
      coordinates: dedupeCoordinates([stops.from.coordinate, ...explicitWaypoints, stops.to.coordinate]),
      upstreamFeatureIds: [NATURAL_EARTH_SOURCE_IDS.land, NATURAL_EARTH_SOURCE_IDS.lakes],
      changes: [{
        kind: "shortest-over-land",
        detail:
          "ADR-0038 says land lines must not cross open water; this stage uses reproducible Natural Earth land waypoints to keep the line on land around the intervening water.",
        sources: [NATURAL_EARTH_SOURCE_IDS.land, NATURAL_EARTH_SOURCE_IDS.lakes]
      }]
    };
  }
  const stopSequence = [stops.from, ...stops.via, stops.to];
  const chains = [];
  let routedLegs = 0;
  for (let index = 1; index < stopSequence.length; index += 1) {
    const start = stopSequence[index - 1].coordinate;
    const end = stopSequence[index].coordinate;
    if (segmentCrossesWater(start, end, context)) {
      routedLegs += 1;
      try {
        chains.push(shortestSurfacePath(start, end, context, {
          surfaceName: "land",
          isPassable: (coordinate) => isLandSurface(coordinate, context),
          crossesForbidden: (left, right) => segmentCrossesWater(left, right, context)
        }));
      } catch {
        routedLegs -= 1;
        chains.push([start, end]);
      }
    } else {
      chains.push([start, end]);
    }
  }
  const coordinates = joinCoordinateChains(chains);
  return {
    method: routedLegs > 0 ? "shortest-land" : "straight-land-fallback",
    coordinates,
    upstreamFeatureIds: [...new Set([...stops.from.sources.slice(0, 2), ...stops.to.sources.slice(0, 2)])],
    changes: [
      {
        kind: routedLegs > 0 ? "shortest-over-land" : "straight-land-fallback",
        detail:
          routedLegs > 0
            ? `ADR-0038 says a land line must not cross sea or lakes; routed ${routedLegs} leg(s) by the shortest path over land in the Natural Earth 10m land-minus-lakes mask.`
            : "No linked first-century road path found from the pinned road graph, and the direct leg stays on land; drew a straight line between the stops.",
        sources:
          routedLegs > 0
            ? [NATURAL_EARTH_SOURCE_IDS.land, NATURAL_EARTH_SOURCE_IDS.lakes]
            : [...new Set([...stops.from.sources.slice(0, 1), ...stops.to.sources.slice(0, 1)])]
      }
    ]
  };
}

function routeOverSea(stage, stops, context) {
  const changes = [];
  const upstreamFeatureIds = new Set();
  const from = stops.from.coordinate;
  const to = stops.to.coordinate;
  const stageKey = `${context.routeId}::${stage.id}`;
  const explicitReason = SEA_STAGE_EXPLICIT_REASONS.get(stageKey) ?? null;
  const waterPassable = (coordinate) => !isLandSurface(coordinate, context);
  const followingHint = stops.via.find((stop) => Array.isArray(stop.coordinate))?.coordinate ?? to;
  if (process.env.ROUTE_LINES_DEBUG === "1") {
    console.error(`  sea ${stageKey}: snap start`);
  }
  const waterFrom = waterPassable(from)
    ? { coordinate: from, distanceKm: 0 }
    : context.nearestWater(from, followingHint);
  if (process.env.ROUTE_LINES_DEBUG === "1") {
    console.error(`  sea ${stageKey}: snap end`);
  }
  const waterTo = waterPassable(to)
    ? { coordinate: to, distanceKm: 0 }
    : context.nearestWater(to, stops.via.at(-1)?.coordinate ?? from);
  if (!waterFrom || !waterTo) {
    throw new Error(`Could not find water connector for ${stageKey}.`);
  }
  const waterStart =
    waterFrom.distanceKm > WATER_CONNECTOR_DISTANCE_KM || isOnLand(from, context)
      ? waterFrom.coordinate
      : from;
  const waterEnd =
    waterTo.distanceKm > WATER_CONNECTOR_DISTANCE_KM || isOnLand(to, context)
      ? waterTo.coordinate
      : to;

  if (waterFrom.distanceKm > WATER_CONNECTOR_DISTANCE_KM || waterStart !== from) {
    changes.push({
      kind: "coastal-connector",
      detail: `${stops.from.label} is ${waterFrom.distanceKm.toFixed(1)} km from navigable water; added a recorded connector to the water path.`,
      sources: [...stops.from.sources.slice(0, 2), NATURAL_EARTH_SOURCE_IDS.coastline, NATURAL_EARTH_SOURCE_IDS.lakes]
    });
  }
  if (waterTo.distanceKm > WATER_CONNECTOR_DISTANCE_KM || waterEnd !== to) {
    changes.push({
      kind: "coastal-connector",
      detail: `${stops.to.label} is ${waterTo.distanceKm.toFixed(1)} km from navigable water; added a recorded connector from the water path to the stage end.`,
      sources: [...stops.to.sources.slice(0, 2), NATURAL_EARTH_SOURCE_IDS.coastline, NATURAL_EARTH_SOURCE_IDS.lakes]
    });
  }

  const viaStops = [];
  for (let viaIndex = 0; viaIndex < stops.via.length; viaIndex += 1) {
    const viaStop = stops.via[viaIndex];
    const isRegionVia =
      viaStop?.stopRef?.kind === "location" &&
      REGION_LEVEL_TYPES.has(viaStop.type) &&
      Array.isArray(viaStop.coordinate);
    if (isRegionVia) {
      const followingStops = [
        ...stops.via.slice(viaIndex + 1),
        stops.to
      ].filter((candidate) => Array.isArray(candidate?.coordinate));
      const coveredByFollowingStop = followingStops.find(
        (candidate) =>
          haversineKm(viaStop.coordinate, candidate.coordinate) <= REGION_VIA_REDUNDANT_RADIUS_KM
      );
      if (coveredByFollowingStop) {
        changes.push({
          kind: "region-via-coast-pass",
          detail:
            `${viaStop.label} is a passed region, so the line does not route to a central point before ` +
            `${coveredByFollowingStop.label}; it follows the coast as required by the concrete passed/end stops.`,
          sources: [...new Set([...viaStop.sources.slice(0, 2), ...coveredByFollowingStop.sources.slice(0, 2)])]
        });
        continue;
      }
    }

    const explicitPass = SEA_VIA_PASS_POINTS.get(`${stageKey}::${viaStop.locationId ?? viaStop.stopId}`) ?? null;
    if (explicitPass) {
      changes.push({
        kind: "text-directed-island-pass",
        detail: explicitPass.detail,
        sources: explicitPass.sources
      });
      viaStops.push({ ...viaStop, coordinate: explicitPass.coordinate });
      upstreamFeatureIds.add(NATURAL_EARTH_SOURCE_IDS.land);
      continue;
    }

    const nearest = context.nearestWater(viaStop.coordinate, to);
    if (isOnLand(viaStop.coordinate, context)) {
      changes.push({
        kind: "via-coast-pass",
        detail: `Sea stage passes ${viaStop.label} by nearest coastline point (${nearest.distanceKm.toFixed(1)} km from recorded site).`,
        sources: [...viaStop.sources.slice(0, 2), NATURAL_EARTH_SOURCE_IDS.coastline, NATURAL_EARTH_SOURCE_IDS.lakes]
      });
      viaStops.push({ ...viaStop, coordinate: nearest.coordinate });
      continue;
    }
    viaStops.push(viaStop);
  }

  const explicitWaypoints = SEA_STAGE_WAYPOINTS.get(stageKey) ?? null;
  if (explicitWaypoints) {
    changes.push({
      kind: "water-waypoints",
      detail:
        "Split the shortest-over-water search into reproducible open-water waypoints so each leg can avoid intervening coasts and islands at Natural Earth 10m resolution.",
      sources: [NATURAL_EARTH_SOURCE_IDS.land, NATURAL_EARTH_SOURCE_IDS.coastline, NATURAL_EARTH_SOURCE_IDS.lakes]
    });
  }
  const waterPoints = explicitWaypoints
    ? [waterStart, ...explicitWaypoints, waterEnd]
    : [waterStart, ...viaStops.map((stop) => stop.coordinate), waterEnd];
  const chains = [[from, waterStart]];

  for (let index = 1; index < waterPoints.length; index += 1) {
    const start = waterPoints[index - 1];
    const end = waterPoints[index];
    if (process.env.ROUTE_LINES_DEBUG === "1") {
      console.error(`  sea ${stageKey}: leg ${index}/${waterPoints.length - 1}`);
    }
    const segmentCoordinates = explicitWaypoints ? [start, end] : shortestWaterSegment(start, end, context);
    upstreamFeatureIds.add(NATURAL_EARTH_SOURCE_IDS.land);
    upstreamFeatureIds.add(NATURAL_EARTH_SOURCE_IDS.coastline);
    upstreamFeatureIds.add(NATURAL_EARTH_SOURCE_IDS.lakes);
    chains.push(segmentCoordinates);
  }
  chains.push([waterEnd, to]);

  changes.push({
    kind: "shortest-over-water",
    detail:
      `Applied ADR-0038: sea lines follow the shortest path over water through each passed place in order, using Natural Earth 10m land as land and 10m lakes as water. ORBIS is a cross-check only and is not used as line geometry.`,
    sources: [NATURAL_EARTH_SOURCE_IDS.land, NATURAL_EARTH_SOURCE_IDS.coastline, NATURAL_EARTH_SOURCE_IDS.lakes]
  });
  if (explicitReason) {
    changes.push({
      kind: "explicit-sea-detour-reason",
      detail: explicitReason.detail,
      sources: explicitReason.sources
    });
  }

  return {
    method: "shortest-water",
    coordinates: joinCoordinateChains(chains),
    upstreamFeatureIds: Array.from(upstreamFeatureIds),
    changes
  };
}

function stageLineId(routeId, stageId) {
  return `${routeId}-${stageId}`;
}

function stageName(routeId, stageId) {
  return `${routeId}/${stageId}`;
}

function extentOfCoordinates(coordinates) {
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, maxLon, minLat, maxLat };
}

function project([lon, lat], extent, width, height, padding = 24) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const xRatio = (lon - extent.minLon) / Math.max(1e-9, extent.maxLon - extent.minLon);
  const yRatio = (lat - extent.minLat) / Math.max(1e-9, extent.maxLat - extent.minLat);
  return [padding + xRatio * usableWidth, height - (padding + yRatio * usableHeight)];
}

async function writeRoutePreviewPng(routeId, lines, coastlineLines, previewsDirectory) {
  const width = 1200;
  const height = 700;
  const routeCoordinates = lines.flatMap((line) => line.geometry.coordinates);
  const extent = extentOfCoordinates(routeCoordinates);
  const marginLon = Math.max(1.5, (extent.maxLon - extent.minLon) * 0.25);
  const marginLat = Math.max(1.5, (extent.maxLat - extent.minLat) * 0.25);
  const mapExtent = {
    minLon: extent.minLon - marginLon,
    maxLon: extent.maxLon + marginLon,
    minLat: extent.minLat - marginLat,
    maxLat: extent.maxLat + marginLat
  };

  const coastlinePaths = coastlineLines
    .map((line) =>
      line
        .map((coordinate, index) => {
          const [x, y] = project(coordinate, mapExtent, width, height);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    )
    .join(" ");

  const routePaths = lines
    .map((line) =>
      line.geometry.coordinates
        .map((coordinate, index) => {
          const [x, y] = project(coordinate, mapExtent, width, height);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    )
    .join(" ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fbff" />
  <path d="${coastlinePaths}" fill="none" stroke="#b8c3cc" stroke-width="1" stroke-linecap="round" />
  <path d="${routePaths}" fill="none" stroke="#1A73E8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  <text x="24" y="38" font-family="Arial, sans-serif" font-size="24" fill="#1d2a36">${routeId}</text>
</svg>`;

  const outputPath = path.join(previewsDirectory, `${routeId}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

async function writeZoomPreviewPng(previewId, lines, coastlineLines, mapExtent, previewsDirectory) {
  const width = 1200;
  const height = 700;
  const coastlinePaths = coastlineLines
    .map((line) =>
      line
        .map((coordinate, index) => {
          const [x, y] = project(coordinate, mapExtent, width, height);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    )
    .join(" ");

  const routePaths = lines
    .map((line) =>
      line.geometry.coordinates
        .map((coordinate, index) => {
          const [x, y] = project(coordinate, mapExtent, width, height);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(" ")
    )
    .join(" ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fbff" />
  <path d="${coastlinePaths}" fill="none" stroke="#b8c3cc" stroke-width="1" stroke-linecap="round" />
  <path d="${routePaths}" fill="none" stroke="#1A73E8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
  <text x="24" y="38" font-family="Arial, sans-serif" font-size="24" fill="#1d2a36">${previewId}</text>
</svg>`;

  const outputPath = path.join(previewsDirectory, `${previewId}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}

async function main() {
  const cache = ancientGeoCache(process.env.ROUTE_LINES_CACHE || path.join(os.tmpdir(), "ibm-route-lines"));
  await fs.mkdir(cache.inputs, { recursive: true });
  await fs.rm(cache.work, { recursive: true, force: true });
  await fs.rm(cache.report, { recursive: true, force: true });
  await fs.mkdir(cache.work, { recursive: true });
  await fs.mkdir(cache.report, { recursive: true });
  await fs.mkdir(cache.previews, { recursive: true });

  const [locationsById, routesData, routeStopsData, roadsData] = await Promise.all([
    readLocationsById(),
    readJsonFile(routesPath),
    readJsonFile(routeStopsPath),
    readJsonFile(roadsPath)
  ]);
  const routeStopsById = new Map((routeStopsData.stops ?? []).map((stop) => [stop.id, stop]));
  const inputPaths = await fetchPinnedRouteLineInputs(cache.inputs);
  const [naturalEarthLand, naturalEarthCoastline, naturalEarthLakes] = await Promise.all([
    readJsonFile(inputPaths.naturalEarthLand),
    readJsonFile(inputPaths.naturalEarthCoastline),
    readJsonFile(inputPaths.naturalEarthLakes)
  ]);

  const landFeatures = buildLandMask((naturalEarthLand.features ?? []).filter((feature) => feature?.geometry));
  const lakeFeatures = buildLandMask((naturalEarthLakes.features ?? []).filter((feature) => feature?.geometry));
  const coastSegments = buildCoastSegments(naturalEarthCoastline);
  const lakeBoundarySegments = buildPolygonBoundarySegments(naturalEarthLakes);
  const waterBoundarySegments = [...coastSegments, ...lakeBoundarySegments];
  const coastlineLines = (naturalEarthCoastline.features ?? [])
    .flatMap((feature) => lineStringsFromGeometry(feature.geometry));

  const roadGraph = buildRoadGraph(roadsData);
  const maskContext = {
    landFeatures,
    lakeFeatures,
    surfaceBoundaryFeatures: buildMaskBoundarySegments([...landFeatures, ...lakeFeatures])
  };
  const nearestWater = (coordinate, hint = null) =>
    nearestSurfaceBoundaryPoint(
      coordinate,
      waterBoundarySegments,
      (candidate) => !isLandSurface(candidate, maskContext),
      hint
    );

  const routeLineFeatures = [];
  const reportRows = [];
  const methodCounts = new Map();

  for (const route of routesData.routes ?? []) {
    for (const stage of route.stages ?? []) {
      const existingNoLineReason = typeof stage.noLineReason === "string" ? stage.noLineReason : null;
      if (existingNoLineReason) {
        delete stage.lineId;
        reportRows.push(`- ${stageName(route.id, stage.id)}: no line (${existingNoLineReason})`);
        continue;
      }

      const from = resolveStopRef(stage.from, { locationsById, routeStopsById });
      const to = resolveStopRef(stage.to, { locationsById, routeStopsById });
      const via = (stage.via ?? []).map((stopRef) =>
        resolveStopRef(stopRef, { locationsById, routeStopsById })
      );
      const stops = { from, to, via };
      const lineId = stageLineId(route.id, stage.id);
      stage.lineId = lineId;
      delete stage.noLineReason;
      if (process.env.ROUTE_LINES_DEBUG === "1") {
        console.error(`Building ${stageName(route.id, stage.id)} (${stage.travelMode})`);
      }

      let line;
      if (stage.travelMode === "land") {
        line = routeByLandRoad(stage, stops, roadGraph) ?? routeOverLand(stage, stops, {
          ...maskContext,
          routeId: route.id
        });
      } else if (stage.travelMode === "sea") {
        line = routeOverSea(stage, stops, {
          routeId: route.id,
          ...maskContext,
          nearestWater
        });
      } else {
        line = {
          method: "straight-unknown",
          coordinates: dedupeCoordinates([from.coordinate, ...via.map((stop) => stop.coordinate), to.coordinate]),
          upstreamFeatureIds: [...new Set([...from.sources.slice(0, 2), ...to.sources.slice(0, 2)])],
          changes: [{
            kind: "unknown-path",
            detail: "travelMode is unknown, so the stage uses a straight line between the named stops.",
            sources: [...new Set([...from.sources.slice(0, 1), ...to.sources.slice(0, 1)])]
          }]
        };
      }

      const provenanceChanges = [
        ...(line.changes ?? []),
        ...(line.details
          ? [{
              kind: line.method,
              detail: line.details,
              sources:
                line.changeSources?.length > 0
                  ? line.changeSources
                  : [...new Set([...from.sources.slice(0, 1), ...to.sources.slice(0, 1)])]
            }]
          : [])
      ];
      const provenanceUpstreamIds = line.upstreamFeatureIds.length > 0
        ? line.upstreamFeatureIds
        : [...new Set([...from.sources.slice(0, 1), ...to.sources.slice(0, 1)])];

      const feature = {
        type: "Feature",
        properties: {
          lineId,
          routeId: route.id,
          stageId: stage.id,
          provenance: {
            dataset:
              line.method === "awmc-road-network"
                ? "AWMC geodata dated major roads, with Natural Earth 10m land/lakes used by validation"
                : line.method === "straight-unknown"
                  ? "Stop coordinates only; path not known"
                  : line.method === "shortest-land"
                    ? "Natural Earth 10m land and lakes"
                    : "Natural Earth 10m land, coastline and lakes",
            version: [
              line.method === "awmc-road-network"
                ? (roadsData.features?.[0]?.properties?.provenance?.version ?? "AWMC roads: committed data/geo/ancient-roads.geojson")
                : null,
              line.method !== "straight-unknown"
                ? `NaturalEarth:${ROUTE_LINE_INPUTS.naturalEarthLand.upstreamPath},${ROUTE_LINE_INPUTS.naturalEarthCoastline.upstreamPath},${ROUTE_LINE_INPUTS.naturalEarthLakes.upstreamPath}`
                : "route stop and location coordinates as cited in route/location records"
            ].filter(Boolean).join(" | "),
            upstreamFeatureIds: Array.from(new Set(provenanceUpstreamIds)),
            changes: provenanceChanges
          }
        },
        geometry: {
          type: "LineString",
          coordinates: dedupeCoordinates(line.coordinates)
        }
      };

      const endpoints = geometryEndpoints(feature.geometry);
      if (!endpoints) {
        throw new Error(`Generated an invalid line geometry for ${stageName(route.id, stage.id)}`);
      }
      if (haversineKm(endpoints.start, from.coordinate) > 0.001 || haversineKm(endpoints.end, to.coordinate) > 0.001) {
        throw new Error(`Generated line for ${stageName(route.id, stage.id)} does not end at the stop coordinates.`);
      }

      routeLineFeatures.push(feature);
      methodCounts.set(line.method, (methodCounts.get(line.method) ?? 0) + 1);
      reportRows.push(`- ${stageName(route.id, stage.id)}: ${line.method}`);
    }
  }

  routeLineFeatures.sort((left, right) => {
    const leftKey = `${left.properties.routeId}::${left.properties.stageId}`;
    const rightKey = `${right.properties.routeId}::${right.properties.stageId}`;
    return leftKey.localeCompare(rightKey);
  });

  const routeLinesOutput = {
    type: "FeatureCollection",
    features: routeLineFeatures
  };

  await fs.writeFile(routesPath, `${JSON.stringify(routesData, null, 2)}\n`, "utf8");
  await fs.writeFile(routeLinesPath, `${JSON.stringify(routeLinesOutput, null, 2)}\n`, "utf8");

  const previews = [];
  for (const route of routesData.routes ?? []) {
    const routeFeatures = routeLineFeatures.filter((feature) => feature.properties.routeId === route.id);
    if (routeFeatures.length === 0) {
      continue;
    }
    const previewPath = await writeRoutePreviewPng(route.id, routeFeatures, coastlineLines, cache.previews);
    previews.push({ routeId: route.id, path: previewPath });
  }
  const allLines = routeLineFeatures;
  const zoomPreviews = [];
  zoomPreviews.push({
    id: "zoom-aegean-z7",
    path: await writeZoomPreviewPng(
      "zoom-aegean-z7",
      allLines,
      coastlineLines,
      { minLon: 20.5, maxLon: 30.5, minLat: 34.0, maxLat: 41.8 },
      cache.previews
    )
  });
  zoomPreviews.push({
    id: "zoom-holy-land-z7",
    path: await writeZoomPreviewPng(
      "zoom-holy-land-z7",
      allLines,
      coastlineLines,
      { minLon: 32.6, maxLon: 37.2, minLat: 30.4, maxLat: 36.8 },
      cache.previews
    )
  });

  const report = [
    "# Route-line build report",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Previews: ${cache.previews}`,
    "",
    "## Methods",
    ...Array.from(methodCounts.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([method, count]) => `- ${method}: ${count}`),
    "",
    "## Stage log",
    ...reportRows,
    "",
    "## Preview files",
    ...previews.map((preview) => `- ${preview.routeId}: ${preview.path}`),
    ...zoomPreviews.map((preview) => `- ${preview.id}: ${preview.path}`)
  ].join("\n");
  const reportPath = path.join(cache.report, "route-lines-report.md");
  await fs.writeFile(reportPath, `${report}\n`, "utf8");

  console.log(`Wrote ${routeLineFeatures.length} route-line features to ${routeLinesPath}`);
  console.log(`Wrote report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
