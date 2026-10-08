import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanPolygonGeometry,
  countConsecutiveDuplicateVertices,
  geometryAreaKm2,
  polygonFromLineAndFrame,
  removeConsecutiveDuplicateVertices,
  removeSpikes,
  separateTouchingParts
} from "../scripts/lib/geometry-cleanup.mjs";

const square = (lon, lat, size) => [
  [lon, lat],
  [lon + size, lat],
  [lon + size, lat + size],
  [lon, lat + size],
  [lon, lat]
];

test("removeConsecutiveDuplicateVertices drops repeats and keeps the ring closed", () => {
  const ring = [[35.94045, 36.88929], [35.94045, 36.88929], [35.95, 36.88929], [35.95, 36.9], [35.95, 36.9], [35.94045, 36.88929]];
  assert.deepEqual(removeConsecutiveDuplicateVertices(ring), [
    [35.94045, 36.88929],
    [35.95, 36.88929],
    [35.95, 36.9],
    [35.94045, 36.88929]
  ]);
});

test("countConsecutiveDuplicateVertices counts repeated positions in every ring", () => {
  const geometry = { type: "MultiPolygon", coordinates: [[[[0, 0], [0, 0], [1, 0], [1, 1], [0, 0]]], [[[2, 2], [3, 2], [3, 2], [3, 3], [2, 2]]]] };
  assert.equal(countConsecutiveDuplicateVertices(geometry), 2);
});

test("cleanPolygonGeometry removes degenerate rings and parts under the size limit", () => {
  const large = square(35, 33, 0.5);
  const sliver = [[35.9, 36.8], [35.9, 36.8], [35.91, 36.8], [35.9, 36.8]];
  const smallIsland = square(34, 34, 0.005);
  const { geometry, dropped } = cleanPolygonGeometry({ type: "MultiPolygon", coordinates: [[large], [sliver], [smallIsland]] }, { minPartKm2: 1 });
  assert.equal(geometry.type, "Polygon");
  assert.deepEqual(geometry.coordinates, [large]);
  assert.equal(dropped.degenerateRings, 1);
  assert.equal(dropped.smallParts, 1);
  assert.ok(dropped.smallPartsKm2 > 0 && dropped.smallPartsKm2 < 1);
});

test("cleanPolygonGeometry keeps holes that are real rings and drops collapsed ones", () => {
  const outer = square(10, 10, 1);
  const hole = square(10.2, 10.2, 0.2).reverse();
  const collapsedHole = [[10.7, 10.7], [10.7, 10.7], [10.7, 10.7], [10.7, 10.7]];
  const { geometry, dropped } = cleanPolygonGeometry({ type: "Polygon", coordinates: [outer, hole, collapsedHole] });
  assert.equal(geometry.coordinates.length, 2);
  assert.equal(dropped.degenerateRings, 1);
  assert.ok(geometryAreaKm2(geometry) < geometryAreaKm2({ type: "Polygon", coordinates: [outer] }));
});

test("cleanPolygonGeometry returns null when nothing is left", () => {
  const { geometry } = cleanPolygonGeometry({ type: "Polygon", coordinates: [square(0, 0, 0.001)] }, { minPartKm2: 1 });
  assert.equal(geometry, null);
});

test("separateTouchingParts moves a shared vertex into the later part", () => {
  const left = square(0, 0, 1);
  const right = [[1, 1], [2, 1], [2, 2], [1, 2], [1, 1]];
  const [first, second] = separateTouchingParts([[left], [right]]);
  assert.deepEqual(first, [left]);
  assert.notDeepEqual(second[0][0], [1, 1]);
  assert.deepEqual(second[0][0], second[0].at(-1));
  assert.ok(second[0][0][0] > 1 && second[0][0][1] > 1, "moved into the second square");
  assert.ok(Math.hypot(second[0][0][0] - 1, second[0][0][1] - 1) <= 0.00005 + 1e-12);
});

test("removeSpikes drops a vertex where the ring doubles back on itself", () => {
  // From (0, 1) the ring runs out to (0.6, -0.5) and back along the same line, 0.1 m off after rounding.
  const spiked = [[0, 0], [1, 0], [1, 1], [0, 1], [0.6, -0.5], [0.2, 0.5000009], [0, 0]];
  assert.deepEqual(removeSpikes(spiked), [[0, 0], [1, 0], [1, 1], [0, 1], [0.2, 0.5000009], [0, 0]]);
  assert.deepEqual(removeSpikes(square(0, 0, 1)), square(0, 0, 1));
  const { geometry } = cleanPolygonGeometry({ type: "Polygon", coordinates: [spiked] });
  assert.equal(geometry.coordinates[0].length, 6);
});

test("removeSpikes keeps narrow but real angles", () => {
  const narrow = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, -0.5], [0.4, 0.5], [0, 0]];
  assert.deepEqual(removeSpikes(narrow), narrow);
});

test("polygonFromLineAndFrame closes a border line into the polygon on one side of it", () => {
  const line = [[34.3, 37.6], [34.2, 37.0], [34.25, 36.5]];
  const polygon = polygonFromLineAndFrame(line, [[34.25, 35.6], [30.5, 35.6], [30.5, 38.3], [34.3, 38.3]]);
  assert.equal(polygon.type, "Polygon");
  const ring = polygon.coordinates[0];
  assert.deepEqual(ring[0], ring.at(-1));
  assert.deepEqual(ring.slice(0, 3), line);
  assert.equal(ring.length, line.length + 4 + 1);
});
