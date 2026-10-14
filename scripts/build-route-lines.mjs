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
const ancientAreasPath = path.join(dataDirectory, "geo", "ancient-areas.geojson");

const SEA_EDGE_TYPES = new Set(["coastal", "overseas", "slowcoast", "slowover", "ferry"]);
const LAND_SNAP_MAX_KM = 35;
const SEA_NODE_SNAP_MAX_KM = 90;
const COASTAL_DISTANCE_KM = 5;
const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});
const SEA_ORBIS_MAX_DETOUR_RATIO = 1.25;
const SEA_DETOUR_EXCEPTIONS = new Map([
  [
    "paul-rome::stage-04",
    {
      detail:
        "Ignored ORBIS sea lanes for this stage: Acts 27:14–28:1 describes a storm-driven drift from off Crete past Cauda to Malta, not normal lane navigation.",
      sources: ["orbis:mn425tz9757", "naturalearth:1159152091"]
    }
  ]
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
      label: location?.names?.ancient?.[0] ?? stopRef.locationId,
      type: location?.type ?? "site",
      coordinate: candidate?.coordinates,
      sources: candidate?.sources ?? []
    };
  }
  const stop = routeStopsById.get(stopRef.stopId);
  const index = Number.isInteger(stopRef?.candidateIndex) ? stopRef.candidateIndex : 0;
  const candidate = stop?.candidates?.[index];
  return {
    id: `route-stop:${stopRef.stopId}:${index}`,
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

function shortestWaterSegment(start, end, context) {
  if (segmentLandRatio(start, end, context.landFeatures) < 0.5) {
    return [start, end];
  }
  const waypointFromTrial = (trial) => {
    if (!isOnLand(trial, context.landFeatures)) {
      return [round(trial[0], 6), round(trial[1], 6)];
    }
    return context.nearestCoast(trial).coordinate;
  };
  let best = null;
  const tryCandidate = (candidate) => {
    if (polylineCrossesLand(candidate, context.landFeatures)) {
      return;
    }
    const candidateLength = lineLengthKm(candidate);
    if (!best || candidateLength < best.lengthKm) {
      best = { coordinates: candidate, lengthKm: candidateLength };
    }
  };
  const minLon = Math.min(start[0], end[0]);
  const maxLon = Math.max(start[0], end[0]);
  const minLat = Math.min(start[1], end[1]);
  const maxLat = Math.max(start[1], end[1]);
  for (const delta of [0.2, 0.4, 0.6, 0.8, 1.2]) {
    const southLat = minLat - delta;
    const northLat = maxLat + delta;
    tryCandidate([start, waypointFromTrial([start[0], southLat]), waypointFromTrial([end[0], southLat]), end]);
    tryCandidate([start, waypointFromTrial([start[0], northLat]), waypointFromTrial([end[0], northLat]), end]);
    const westLon = minLon - delta;
    const eastLon = maxLon + delta;
    tryCandidate([start, waypointFromTrial([westLon, start[1]]), waypointFromTrial([westLon, end[1]]), end]);
    tryCandidate([start, waypointFromTrial([eastLon, start[1]]), waypointFromTrial([eastLon, end[1]]), end]);
  }
  if (best) {
    return best.coordinates;
  }
  const onLandSamples = segmentLandSamples(start, end, context.landFeatures);
  const center = onLandSamples[Math.floor(onLandSamples.length / 2)] ?? [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2
  ];
  const offsets = [2, 4, 6, 8, 10, 12];
  for (const magnitude of offsets) {
    for (const [offsetLon, offsetLat] of [
      [magnitude, 0],
      [-magnitude, 0],
      [0, magnitude],
      [0, -magnitude],
      [magnitude, magnitude],
      [magnitude, -magnitude],
      [-magnitude, magnitude],
      [-magnitude, -magnitude]
    ]) {
      const trial = [center[0] + offsetLon, center[1] + offsetLat];
      const waypoint = waypointFromTrial(trial);
      const candidate = [start, waypoint, end];
      tryCandidate(candidate);
    }
  }
  if (best) {
    return best.coordinates;
  }
  const span = Math.max(maxLon - minLon, maxLat - minLat);
  const margin = Math.max(1.2, Math.min(6, span * 0.6));
  const trialWaypoints = [
    [minLon - margin, minLat - margin],
    [minLon - margin, maxLat + margin],
    [maxLon + margin, minLat - margin],
    [maxLon + margin, maxLat + margin],
    [(minLon + maxLon) / 2, minLat - margin],
    [(minLon + maxLon) / 2, maxLat + margin],
    [minLon - margin, (minLat + maxLat) / 2],
    [maxLon + margin, (minLat + maxLat) / 2],
    ...[1, 2, 3].flatMap((delta) => [
      [start[0], start[1] - delta],
      [start[0], start[1] + delta],
      [start[0] - delta, start[1]],
      [start[0] + delta, start[1]],
      [end[0], end[1] - delta],
      [end[0], end[1] + delta],
      [end[0] - delta, end[1]],
      [end[0] + delta, end[1]]
    ])
  ].map(waypointFromTrial);
  const waypointKeys = new Set();
  const candidateWaypoints = [];
  for (const waypoint of trialWaypoints) {
    const key = coordinateKey(waypoint);
    if (!waypointKeys.has(key)) {
      waypointKeys.add(key);
      candidateWaypoints.push(waypoint);
    }
  }
  let bestMultiWaypoint = null;
  const tryMultiWaypointCandidate = (candidate) => {
    if (polylineCrossesLand(candidate, context.landFeatures)) {
      return;
    }
    const candidateLength = lineLengthKm(candidate);
    if (!bestMultiWaypoint || candidateLength < bestMultiWaypoint.lengthKm) {
      bestMultiWaypoint = { coordinates: candidate, lengthKm: candidateLength };
    }
  };
  for (const waypoint of candidateWaypoints) {
    tryMultiWaypointCandidate([start, waypoint, end]);
  }
  for (let left = 0; left < candidateWaypoints.length; left += 1) {
    for (let right = 0; right < candidateWaypoints.length; right += 1) {
      if (left === right) {
        continue;
      }
      tryMultiWaypointCandidate([start, candidateWaypoints[left], candidateWaypoints[right], end]);
    }
  }
  if (bestMultiWaypoint) {
    return bestMultiWaypoint.coordinates;
  }
  const latBase = Math.min(start[1], end[1]);
  for (const delta of [2, 3.5, 5]) {
    const southLat = latBase - delta;
    const northLat = Math.max(start[1], end[1]) + delta;
    for (const corridorLat of [southLat, northLat]) {
      const waypointOne = waypointFromTrial([start[0], corridorLat]);
      const waypointTwo = waypointFromTrial([end[0], corridorLat]);
      const candidate = [start, waypointOne, waypointTwo, end];
      if (!polylineCrossesLand(candidate, context.landFeatures)) {
        return candidate;
      }
    }
  }
  if (haversineKm(start, end) <= 1500) {
    const gridPath = shortestWaterGridPath(start, end, context.landFeatures);
    if (gridPath && gridPath.length >= 2) {
      const simplifiedGridPath = simplifySeaPolyline(gridPath, context.landFeatures);
      if (!polylineCrossesLand(simplifiedGridPath, context.landFeatures)) {
        return simplifiedGridPath;
      }
    }
  }
  const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const coastMidpoint = context.nearestCoast(midpoint).coordinate;
  return [start, coastMidpoint, end];
}

function isOnLand(coordinate, landFeatures) {
  return landFeatures.some((feature) => pointInGeometry(coordinate, feature.geometry));
}

function buildCoastSegments(coastlineData) {
  const segments = [];
  for (const feature of coastlineData.features ?? []) {
    for (const line of lineStringsFromGeometry(feature.geometry)) {
      for (let index = 1; index < line.length; index += 1) {
        segments.push([line[index - 1], line[index]]);
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

function segmentSamples(start, end) {
  const distanceKm = haversineKm(start, end);
  const sampleCount = Math.max(12, Math.min(720, Math.ceil(distanceKm / 12)));
  const samples = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    const t = index / sampleCount;
    samples.push([
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ]);
  }
  return samples;
}

function segmentCrossesLand(start, end, landFeatures) {
  return segmentSamples(start, end).some((sample) => isOnLand(sample, landFeatures));
}

function segmentLandSamples(start, end, landFeatures) {
  return segmentSamples(start, end).filter((sample) => isOnLand(sample, landFeatures));
}

function segmentLandRatio(start, end, landFeatures) {
  const samples = segmentSamples(start, end);
  if (samples.length === 0) {
    return 0;
  }
  const onLandCount = samples.filter((sample) => isOnLand(sample, landFeatures)).length;
  return onLandCount / samples.length;
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
    if (segmentLandRatio(coordinates[index - 1], coordinates[index], landFeatures) >= 0.5) {
      return true;
    }
  }
  return false;
}

function pointKeyFromGrid(point) {
  return `${round(point[0], 4).toFixed(4)},${round(point[1], 4).toFixed(4)}`;
}

function fastSegmentCrossesLand(start, end, landFeatures) {
  const samples = [0, 0.25, 0.5, 0.75, 1];
  for (const t of samples) {
    const sample = [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t
    ];
    if (isOnLand(sample, landFeatures)) {
      return true;
    }
  }
  return false;
}

function shortestWaterGridPath(start, end, landFeatures) {
  const minLon = Math.min(start[0], end[0]) - 2;
  const maxLon = Math.max(start[0], end[0]) + 2;
  const minLat = Math.min(start[1], end[1]) - 2;
  const maxLat = Math.max(start[1], end[1]) + 2;
  const span = Math.max(maxLon - minLon, maxLat - minLat);
  const step = Math.max(0.25, Math.min(0.6, span / 28));

  const nodes = new Map();
  const addNode = (point, force = false) => {
    const key = pointKeyFromGrid(point);
    if (nodes.has(key)) {
      return key;
    }
    const coordinate = [round(point[0], 6), round(point[1], 6)];
    if (!force && isOnLand(coordinate, landFeatures)) {
      return null;
    }
    nodes.set(key, coordinate);
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
    return null;
  }

  const adjacency = new Map();
  for (const key of nodes.keys()) {
    adjacency.set(key, []);
  }
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1]
  ];
  for (const [key, coordinate] of nodes) {
    const [lon, lat] = coordinate;
    for (const [dx, dy] of offsets) {
      const neighbor = [lon + dx * step, lat + dy * step];
      const neighborKey = pointKeyFromGrid(neighbor);
      const neighborCoordinate = nodes.get(neighborKey);
      if (!neighborCoordinate) {
        continue;
      }
      if (fastSegmentCrossesLand(coordinate, neighborCoordinate, landFeatures)) {
        continue;
      }
      adjacency.get(key).push({
        to: neighborKey,
        weight: haversineKm(coordinate, neighborCoordinate)
      });
    }
  }

  const distance = new Map([[startKey, 0]]);
  const previous = new Map();
  const queue = [{ key: startKey, f: haversineKm(start, end), g: 0 }];
  while (queue.length > 0) {
    queue.sort((left, right) => left.f - right.f);
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.key === endKey) {
      break;
    }
    for (const edge of adjacency.get(current.key) ?? []) {
      const candidate = current.g + edge.weight;
      const known = distance.get(edge.to);
      if (known == null || candidate < known) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, current.key);
        const heuristic = haversineKm(nodes.get(edge.to), nodes.get(endKey));
        queue.push({ key: edge.to, g: candidate, f: candidate + heuristic });
      }
    }
  }

  if (!distance.has(endKey)) {
    return null;
  }

  const coordinates = [nodes.get(endKey)];
  let current = endKey;
  while (current !== startKey) {
    const prev = previous.get(current);
    if (!prev) {
      return null;
    }
    coordinates.push(nodes.get(prev));
    current = prev;
  }
  coordinates.reverse();
  return coordinates;
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
  const from = stops.from.coordinate;
  const to = stops.to.coordinate;
  const fromNode = nearestRoadNode(from, roadGraph);
  const toNode = nearestRoadNode(to, roadGraph);

  if (!fromNode || !toNode) {
    return null;
  }

  const path = shortestPathInGraph(fromNode.key, toNode.key, roadGraph.adjacency);
  if (!path) {
    return null;
  }

  const nodeCoordinates = path.keys.map((key) => roadGraph.nodes.get(key));
  const coordinates = joinCoordinateChains([
    [from],
    nodeCoordinates,
    [to]
  ]);
  return {
    method: "awmc-road-network",
    coordinates,
    upstreamFeatureIds: Array.from(new Set(path.edgeIds.filter(Boolean).map((roadId) => `awmc:${roadId}`))),
    details: `Snapped both stage ends to AWMC roads within ${LAND_SNAP_MAX_KM} km and routed on the dated major-road graph.`,
    changeSources: ["awmc:roads-objectid-0"]
  };
}

function routeOverSea(stage, stops, context) {
  const changes = [];
  const upstreamFeatureIds = new Set();
  const from = stops.from.coordinate;
  const to = stops.to.coordinate;
  const stageKey = `${context.routeId}::${stage.id}`;
  const detourException = SEA_DETOUR_EXCEPTIONS.get(stageKey) ?? null;
  const waterFrom = context.nearestCoast(from);
  const waterTo = context.nearestCoast(to);
  const waterStart =
    waterFrom.distanceKm > COASTAL_DISTANCE_KM || isOnLand(from, context.landFeatures)
      ? waterFrom.coordinate
      : from;
  const waterEnd =
    waterTo.distanceKm > COASTAL_DISTANCE_KM || isOnLand(to, context.landFeatures)
      ? waterTo.coordinate
      : to;

  if (waterFrom.distanceKm > COASTAL_DISTANCE_KM) {
    changes.push({
      kind: "coastal-connector",
      detail: `${stops.from.label} is ${waterFrom.distanceKm.toFixed(1)} km inland; added straight connector from nearest coast point.`,
      sources: [...stops.from.sources.slice(0, 2), "naturalearth:1159152091"]
    });
  }
  if (waterTo.distanceKm > COASTAL_DISTANCE_KM) {
    changes.push({
      kind: "coastal-connector",
      detail: `${stops.to.label} is ${waterTo.distanceKm.toFixed(1)} km inland; added straight connector to stage end.`,
      sources: [...stops.to.sources.slice(0, 2), "naturalearth:1159152091"]
    });
  }

  const viaStops = stops.via.map((viaStop) => {
    const nearest = context.nearestCoast(viaStop.coordinate);
    if (isOnLand(viaStop.coordinate, context.landFeatures)) {
      changes.push({
        kind: "via-coast-pass",
        detail: `Sea stage passes ${viaStop.label} by nearest coastline point (${nearest.distanceKm.toFixed(1)} km from recorded site).`,
        sources: [...viaStop.sources.slice(0, 2), "naturalearth:1159152091"]
      });
      return { ...viaStop, coordinate: nearest.coordinate };
    }
    return viaStop;
  });

  const waterPoints = [waterStart, ...viaStops.map((stop) => stop.coordinate), waterEnd];
  const chains = [[from, waterStart]];
  let usedOrbis = 0;
  let usedWaterFallback = 0;
  let usedOrbisByRatioRule = 0;
  let usedFallbackByRatioRule = 0;
  let usedFallbackNoOrbis = 0;
  let usedFallbackOrbisCrossesLand = 0;
  let usedFallbackByException = 0;
  const orbisLegRatios = [];

  for (let index = 1; index < waterPoints.length; index += 1) {
    const start = waterPoints[index - 1];
    const end = waterPoints[index];
    const fallbackSegment = detourException ? [start, end] : shortestWaterSegment(start, end, context);
    const fallbackLengthKm = lineLengthKm(fallbackSegment);
    const startNode = nearestOrbisNode(start, context.orbis);
    const endNode = nearestOrbisNode(end, context.orbis);

    let orbisSegment = null;
    let orbisLengthKm = Number.POSITIVE_INFINITY;
    if (startNode && endNode) {
      const path = shortestPathOrbis(startNode.nodeId, endNode.nodeId, context.orbis);
      if (path) {
        const orientedPath = orientOrbisPathCoordinates(path.nodeIds, start, end, context);
        orbisSegment = joinCoordinateChains([
          [start],
          orientedPath,
          [end]
        ]);
        orbisLengthKm = lineLengthKm(orbisSegment);
        for (const edgeId of path.edgeIds) {
          upstreamFeatureIds.add(edgeId);
        }
        for (const nodeId of path.nodeIds) {
          upstreamFeatureIds.add(`orbis:node-${nodeId}`);
        }
      }
    }

    let segmentCoordinates = fallbackSegment;
    const orbisCrossesLand = orbisSegment
      ? polylineCrossesLand(orbisSegment, context.landFeatures)
      : false;
    const orbisToFallbackRatio =
      orbisSegment && Number.isFinite(orbisLengthKm) && fallbackLengthKm > 0
        ? orbisLengthKm / fallbackLengthKm
        : null;
    if (
      !detourException &&
      orbisSegment &&
      !orbisCrossesLand &&
      orbisToFallbackRatio != null &&
      orbisToFallbackRatio <= SEA_ORBIS_MAX_DETOUR_RATIO
    ) {
      segmentCoordinates = orbisSegment;
      usedOrbis += 1;
      usedOrbisByRatioRule += 1;
      orbisLegRatios.push({
        legIndex: index,
        ratio: orbisToFallbackRatio,
        orbisLengthKm,
        shortestWaterLengthKm: fallbackLengthKm
      });
    } else {
      usedWaterFallback += 1;
      if (detourException && orbisSegment) {
        usedFallbackByException += 1;
      } else if (!orbisSegment) {
        usedFallbackNoOrbis += 1;
      } else if (orbisCrossesLand) {
        usedFallbackOrbisCrossesLand += 1;
      } else {
        usedFallbackByRatioRule += 1;
      }
      upstreamFeatureIds.add("naturalearth:1159152091");
    }

    chains.push(segmentCoordinates);
  }
  chains.push([waterEnd, to]);

  if (usedOrbis > 0) {
    changes.push({
      kind: "orbis-sea-lanes",
      detail: `Used ORBIS sea lanes for ${usedOrbis} leg(s) of this stage.`,
      sources: ["orbis:mn425tz9757", "orbis:orbis_nodes_0514", "orbis:orbis_edges_0514"]
    });
  }
  if (usedWaterFallback > 0) {
    changes.push({
      kind: "shortest-water-fallback",
      detail: `Used shortest-over-water fallback for ${usedWaterFallback} leg(s), constrained to avoid land.`,
      sources: ["naturalearth:1159152091"]
    });
  }
  if (detourException) {
    changes.push({
      kind: "explicit-sea-detour-reason",
      detail: detourException.detail,
      sources: detourException.sources
    });
  }
  changes.push({
    kind: "sea-lane-length-rule",
    detail:
      `Applied ADR-0038 sea-lane rule: use ORBIS only when the lane stays over water and is ≤ ${(SEA_ORBIS_MAX_DETOUR_RATIO * 100 - 100).toFixed(0)}% longer than shortest over-water fallback ` +
      `(legs using ORBIS: ${usedOrbisByRatioRule}; legs using fallback because ORBIS exceeded the length limit: ${usedFallbackByRatioRule}; legs using fallback because no ORBIS path was available: ${usedFallbackNoOrbis}; ` +
      `legs using fallback because ORBIS crossed land: ${usedFallbackOrbisCrossesLand}; legs using fallback because an explicit exception applied: ${usedFallbackByException}).`,
    sources: ["orbis:mn425tz9757", "naturalearth:1159152091"]
  });

  return {
    method: usedOrbis > 0 && usedWaterFallback === 0 ? "orbis-sea-lanes" : "mixed-sea",
    coordinates: joinCoordinateChains(chains),
    upstreamFeatureIds: Array.from(upstreamFeatureIds),
    changes,
    orbisLegRatios
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

  const [locationsById, routesData, routeStopsData, roadsData, ancientAreasData] = await Promise.all([
    readLocationsById(),
    readJsonFile(routesPath),
    readJsonFile(routeStopsPath),
    readJsonFile(roadsPath),
    readJsonFile(ancientAreasPath)
  ]);
  const routeStopsById = new Map((routeStopsData.stops ?? []).map((stop) => [stop.id, stop]));
  const inputPaths = await fetchPinnedRouteLineInputs(cache.inputs);
  const [orbisNodesCsv, orbisEdgesCsv, naturalEarthLand, naturalEarthCoastline] = await Promise.all([
    fs.readFile(inputPaths.orbisNodes, "utf8"),
    fs.readFile(inputPaths.orbisEdges, "utf8"),
    readJsonFile(inputPaths.naturalEarthLand),
    readJsonFile(inputPaths.naturalEarthCoastline)
  ]);

  const landFeatures = (ancientAreasData.features ?? []).filter((feature) => feature?.geometry);
  const coastSegments = buildCoastSegments(naturalEarthCoastline);
  const coastlineLines = (naturalEarthCoastline.features ?? [])
    .flatMap((feature) => lineStringsFromGeometry(feature.geometry));

  const roadGraph = buildRoadGraph(roadsData);
  const orbis = parseOrbis(orbisNodesCsv, orbisEdgesCsv);
  const nearestCoast = (coordinate) => nearestCoastPoint(coordinate, coastSegments);

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

      let line;
      if (stage.travelMode === "land") {
        line = routeByLandRoad(stage, stops, roadGraph) ?? {
          method: "straight-land-fallback",
          coordinates: dedupeCoordinates([from.coordinate, ...via.map((stop) => stop.coordinate), to.coordinate]),
          upstreamFeatureIds: [...new Set([...from.sources.slice(0, 2), ...to.sources.slice(0, 2)])],
          details: "No linked first-century road path found from the pinned road graph; drew a straight line between the stops.",
          changeSources: [...new Set([...from.sources.slice(0, 1), ...to.sources.slice(0, 1)])]
        };
      } else if (stage.travelMode === "sea") {
        line = routeOverSea(stage, stops, {
          routeId: route.id,
          orbis,
          landFeatures,
          nearestCoast
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
              "AWMC geodata dated major roads (land), ORBIS v2 node/edge tables (sea lanes), Natural Earth 10m land/coastline (water fallback/coastal connectors)",
            version: [
              roadsData.features?.[0]?.properties?.provenance?.version ?? "AWMC roads: committed data/geo/ancient-roads.geojson",
              `ORBIS:${ROUTE_LINE_INPUTS.orbisNodes.upstreamPath},${ROUTE_LINE_INPUTS.orbisEdges.upstreamPath}`,
              `NaturalEarth:${ROUTE_LINE_INPUTS.naturalEarthLand.upstreamPath},${ROUTE_LINE_INPUTS.naturalEarthCoastline.upstreamPath}`
            ].join(" | "),
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
      const orbisRatioSuffix =
        Array.isArray(line.orbisLegRatios) && line.orbisLegRatios.length > 0
          ? ` (ORBIS leg ratios: ${line.orbisLegRatios
              .map((ratio) => `${ratio.ratio.toFixed(2)}x`)
              .join(", ")})`
          : "";
      reportRows.push(`- ${stageName(route.id, stage.id)}: ${line.method}${orbisRatioSuffix}`);
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
