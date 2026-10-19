import assert from "node:assert/strict";
import test from "node:test";

import {
  auditLine,
  connectorChangeDetail,
  connectorsAndCrossings,
  countStaircases,
  measureLine,
  passPositions
} from "../scripts/lib/route-line-audit.mjs";
import { findPath, findSeaPath, planSeaPasses, polylineKm } from "../scripts/lib/route-line-paths.mjs";
import { REGION_BOUNDS, SEA_CLEARANCE } from "../scripts/lib/route-line-rules.mjs";
import { MODE } from "../scripts/lib/route-line-search.mjs";
import { createSurfaceModel, rhumbKm, SURFACE } from "../scripts/lib/route-line-surface.mjs";

const square = (minLon, minLat, maxLon, maxLat) => [[
  [minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]
]];
const collection = (...polygons) => ({
  type: "FeatureCollection",
  features: polygons.map((coordinates) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates } }))
});

// An island at 20–21° E, 35–36° N with a lake at 20.4–20.6° E, 35.4–35.6° N.
const model = createSurfaceModel({
  land: collection(square(20, 35, 21, 36)),
  lakes: collection(square(20.4, 35.4, 20.6, 35.6)),
  bounds: REGION_BOUNDS
});

test("points are classified as sea, land or lake", () => {
  assert.equal(model.classify([19.5, 35.5]), SURFACE.SEA);
  assert.equal(model.classify([20.2, 35.5]), SURFACE.LAND);
  assert.equal(model.classify([20.5, 35.5]), SURFACE.LAKE);
});

test("a line by sea measures exactly the land it crosses", () => {
  // Along the parallel 35.5° N, which is straight in Web Mercator: land from 20 to 20.4 and from 20.6 to 21.
  const measure = measureLine(model, MODE.SEA, [[19.5, 35.5], [21.5, 35.5]]);
  const { startConnectorKm, endConnectorKm, crossings } = connectorsAndCrossings(measure);
  assert.equal(startConnectorKm, 0);
  assert.equal(endConnectorKm, 0);
  assert.equal(crossings.length, 2);
  assert.ok(Math.abs(crossings[0].km - rhumbKm([20, 35.5], [20.4, 35.5])) < 1e-6);
  assert.ok(Math.abs(crossings[1].km - rhumbKm([20.6, 35.5], [21, 35.5])) < 1e-6);
  assert.ok(Math.abs(measure.lengthKm - rhumbKm([19.5, 35.5], [21.5, 35.5])) < 1e-6);
});

test("a line by land measures exactly the lake it crosses", () => {
  const { crossings } = connectorsAndCrossings(measureLine(model, MODE.LAND, [[20.1, 35.5], [20.9, 35.5]]));
  assert.equal(crossings.length, 1);
  assert.ok(Math.abs(crossings[0].km - rhumbKm([20.4, 35.5], [20.6, 35.5])) < 1e-6);
  assert.deepEqual([...crossings[0].surfaces], ["lake"]);
});

test("the land at a line's ends is a connector, not a crossing", () => {
  const { startConnectorKm, endConnectorKm, crossings } = connectorsAndCrossings(
    measureLine(model, MODE.SEA, [[20.98, 35.5], [21.5, 35.5], [21.5, 34.5], [20.5, 34.5], [20.5, 35.02]])
  );
  assert.ok(Math.abs(startConnectorKm - rhumbKm([20.98, 35.5], [21, 35.5])) < 1e-6);
  assert.ok(Math.abs(endConnectorKm - rhumbKm([20.5, 35], [20.5, 35.02])) < 1e-6);
  assert.equal(crossings.length, 0);
});

test("staircases are counted, smooth bends are not", () => {
  assert.equal(countStaircases([[19, 34], [19.5, 34], [19.5, 34.01], [19.51, 34.01], [19.51, 34.02], [20, 34.02]]).count > 0, true);
  assert.equal(countStaircases([[19, 34], [19.5, 34.1], [20, 34.3], [20.5, 34.6]]).count, 0);
});

test("a single step is accepted only as a turn round land", () => {
  const step = [[19, 34], [19.5, 34], [19.5, 34.01], [20, 34.01]];
  const blocked = countStaircases(step, null, () => true);
  assert.equal(blocked.count, 0);
  assert.deepEqual(blocked.accepted, [1]);
  assert.equal(countStaircases(step, null, () => false).count, 1);
  // Two steps in a row are a staircase even round land.
  const stairs = [[19, 34], [19.5, 34], [19.5, 34.01], [19.51, 34.01], [19.51, 34.02], [20, 34.02]];
  assert.equal(countStaircases(stairs, null, () => true).count > 0, true);
});

// A line by sea from a stop 18 km inside the island (nearest coast: its west coast at 20° E).
const inlandStop = { key: "route-stop:inland", label: "Inland", coordinate: [20.2, 35.2], coordinateSource: "wikidata:Q1" };
const seaStop = { key: "route-stop:sea", label: "Sea", coordinate: [19.5, 35.2], coordinateSource: "wikidata:Q2" };
const seaStage = { id: "stage-01", travelMode: "sea", from: {}, to: {}, via: [] };
const seaFeature = (coordinates, changes) => ({
  type: "Feature",
  properties: { lineId: "test-stage-01", provenance: { changes: [{ kind: "shortest-over-water", detail: "Test.", sources: ["wikidata:Q1"] }, ...changes] } },
  geometry: { type: "LineString", coordinates }
});
const audit = (feature) =>
  auditLine(model, { routeId: "test", stage: seaStage, feature, stops: { from: inlandStop, to: seaStop, via: [] }, resolveStopKey: () => null, baseline: false });

test("a stop away from the water is reached by an approach over land to the coast nearest it", () => {
  const approachKm = rhumbKm([20.2, 35.2], [20, 35.2]);
  const recorded = [{ kind: "start-approach", detail: `Approach of ${connectorChangeDetail(approachKm)}.`, sources: ["wikidata:Q1"] }];
  const row = audit(seaFeature([[20.2, 35.2], [19.5, 35.2]], recorded));
  assert.deepEqual(row.failures, []);
  assert.ok(Math.abs(row.startApproachKm - approachKm) < 1e-6);
  assert.equal(row.startConnectorKm, 0);

  assert.equal(audit(seaFeature([[20.2, 35.2], [19.5, 35.2]], [])).failures.some((failure) => /start approach of .* is not recorded/u.test(failure)), true);
  // South to the coast at 35° N is longer than west to the nearest coast.
  const south = audit(seaFeature([[20.2, 35.2], [20.2, 34.9], [19.5, 35.2]], recorded));
  assert.equal(south.failures.some((failure) => /longer than the way to the coast nearest the stop/u.test(failure)), true);
});

test("the path by sea from a stop away from the water starts with the approach to the nearest coast", () => {
  const path = findSeaPath(model, { from: inlandStop.coordinate, to: [19.5, 35.9], penalty: SEA_CLEARANCE });
  assert.ok(Math.abs(path.startApproach.approachKm - rhumbKm([20.2, 35.2], [20, 35.2])) < 0.01);
  assert.equal(path.endApproach, null);
  const { startConnectorKm, crossings } = connectorsAndCrossings(measureLine(model, MODE.SEA, path.coordinates));
  assert.ok(Math.abs(startConnectorKm - path.startApproach.approachKm) < 0.01);
  assert.equal(crossings.length, 0);
});

test("a path over water goes round the island without touching it, and the same way every time", () => {
  const run = () => findPath(model, {
    mode: MODE.SEA,
    start: { coordinate: [19.6, 35.5], isStop: true },
    end: { coordinate: [21.4, 35.5], isStop: true },
    penalty: SEA_CLEARANCE
  });
  const first = run();
  const second = run();
  assert.deepEqual(first.coordinates, second.coordinates);
  const { crossings, startConnectorKm, endConnectorKm } = connectorsAndCrossings(measureLine(model, MODE.SEA, first.coordinates));
  assert.equal(crossings.length, 0);
  assert.equal(startConnectorKm + endConnectorKm, 0);
  // Round a corner of the island: longer than the straight line, but not by much.
  const straightKm = rhumbKm([19.6, 35.5], [21.4, 35.5]);
  const lengthKm = polylineKm(first.coordinates);
  assert.ok(lengthKm > straightKm && lengthKm < 1.6 * straightKm, `length ${lengthKm} km`);
  assert.equal(countStaircases(first.coordinates).count, 0);
});

test("a side pass makes the path cross the water on that side of the island", () => {
  const passes = planSeaPasses(model, {
    via: [{ key: "route-stop:island", coordinate: [20.5, 35.5] }],
    sidePasses: [{ at: "route-stop:island", island: "route-stop:island", islandCoordinate: [20.2, 35.5], side: "south", placement: "instead", gateKm: 60 }],
    islandVias: new Set(["route-stop:island"])
  });
  assert.equal(passes[0].kind, "gate");
  const path = findPath(model, {
    mode: MODE.SEA,
    start: { coordinate: [19.6, 35.9], isStop: true },
    end: { coordinate: [21.4, 35.9], isStop: true },
    passes,
    penalty: SEA_CLEARANCE
  });
  const [position] = passPositions(model, path.coordinates, passes);
  assert.equal(position.passed, true);
  assert.equal(connectorsAndCrossings(measureLine(model, MODE.SEA, path.coordinates)).crossings.length, 0);
  assert.ok(Math.min(...path.coordinates.map(([, lat]) => lat)) < 35, "the path passes south of the island");
});

test("a path over land goes round the lake", () => {
  const path = findPath(model, {
    mode: MODE.LAND,
    start: { coordinate: [20.3, 35.5], isStop: true },
    end: { coordinate: [20.7, 35.5], isStop: true },
    penalty: null,
    margins: [40]
  });
  assert.equal(connectorsAndCrossings(measureLine(model, MODE.LAND, path.coordinates)).crossings.length, 0);
  assert.ok(path.coordinates.length > 2);
});
