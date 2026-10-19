import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ancientAreas = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "data/geo/ancient-areas.geojson"), "utf8")
);

function ringFor(areaId) {
  const feature = ancientAreas.features.find((candidate) => candidate.properties?.areaId === areaId);
  assert.ok(feature, `Missing area ${areaId}`);
  assert.equal(feature.geometry.type, "Polygon", `${areaId} must be a Polygon`);
  return feature.geometry.coordinates[0];
}

function segmentKey(start, end) {
  const left = `${start[0]},${start[1]}`;
  const right = `${end[0]},${end[1]}`;
  return left < right ? `${left}|${right}` : `${right}|${left}`;
}

function sharedBoundaryPath(leftRing, rightRing) {
  const leftSegments = new Map();
  for (let index = 0; index < leftRing.length - 1; index += 1) {
    const start = leftRing[index];
    const end = leftRing[index + 1];
    leftSegments.set(segmentKey(start, end), { start, end });
  }
  const sharedSegments = [];
  for (let index = 0; index < rightRing.length - 1; index += 1) {
    const start = rightRing[index];
    const end = rightRing[index + 1];
    const shared = leftSegments.get(segmentKey(start, end));
    if (shared) {
      sharedSegments.push(shared);
    }
  }
  assert.ok(sharedSegments.length > 0, "Expected a shared boundary between Pontus and Cappadocia");

  const adjacency = new Map();
  for (const segment of sharedSegments) {
    const startKey = `${segment.start[0]},${segment.start[1]}`;
    const endKey = `${segment.end[0]},${segment.end[1]}`;
    if (!adjacency.has(startKey)) adjacency.set(startKey, []);
    if (!adjacency.has(endKey)) adjacency.set(endKey, []);
    adjacency.get(startKey).push(segment.end);
    adjacency.get(endKey).push(segment.start);
  }

  const endpointKeys = [...adjacency.entries()]
    .filter(([, neighbours]) => neighbours.length === 1)
    .map(([key]) => key);
  assert.equal(endpointKeys.length, 2, "Shared E1 path must have exactly two endpoints");

  const path = [endpointKeys[0].split(",").map(Number)];
  let previous = null;
  let current = endpointKeys[0];
  while (true) {
    const next = (adjacency.get(current) ?? [])
      .map((point) => `${point[0]},${point[1]}`)
      .find((key) => key !== previous);
    if (!next) {
      break;
    }
    path.push(next.split(",").map(Number));
    previous = current;
    current = next;
  }
  return path;
}

function latitudeAtLongitude(pathPoints, longitude) {
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    const [startLon, startLat] = pathPoints[index];
    const [endLon, endLat] = pathPoints[index + 1];
    const minLon = Math.min(startLon, endLon);
    const maxLon = Math.max(startLon, endLon);
    if (longitude < minLon || longitude > maxLon || startLon === endLon) {
      continue;
    }
    const ratio = (longitude - startLon) / (endLon - startLon);
    return startLat + ratio * (endLat - startLat);
  }
  return null;
}

function assertCoordinateClose(actual, expected, tolerance, label) {
  assert.ok(
    Math.abs(actual[0] - expected[0]) <= tolerance && Math.abs(actual[1] - expected[1]) <= tolerance,
    `${label} expected ${expected.join(", ")} got ${actual.join(", ")}`
  );
}

test("Pontus E1 border keeps the G8 endpoints and crossing latitudes", () => {
  const pathPoints = sharedBoundaryPath(ringFor("pontus"), ringFor("cappadocia"));
  if (pathPoints[0][0] > pathPoints[pathPoints.length - 1][0]) {
    pathPoints.reverse();
  }
  assert.equal(pathPoints.length, 10);

  // Fact-Checker G8 figures in docs/verification/M5-ancient-lands.md, item 1.
  assertCoordinateClose(pathPoints[0], [34.38884, 40.55575], 0.00001, "E1 west end");
  assertCoordinateClose(pathPoints[pathPoints.length - 1], [38.71302, 39.16729], 0.00001, "E1 east end");

  const expectedCrossings = new Map([
    [35, 40.189],
    [36, 39.463],
    [37, 39.666],
    [38, 39.469]
  ]);
  for (const [longitude, expectedLatitude] of expectedCrossings.entries()) {
    const latitude = latitudeAtLongitude(pathPoints, longitude);
    assert.notEqual(latitude, null, `Missing E1 crossing at ${longitude}°E`);
    assert.ok(
      Math.abs(latitude - expectedLatitude) <= 0.001,
      `At ${longitude}°E expected latitude ${expectedLatitude}, got ${latitude}`
    );
  }
});
