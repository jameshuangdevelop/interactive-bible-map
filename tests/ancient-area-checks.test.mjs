import test from "node:test";
import assert from "node:assert/strict";

import { acceptanceFailures, borderStretchesNear } from "../scripts/lib/ancient-area-checks.mjs";

// Results that pass every check; each test breaks one of them.
function passingResults() {
  return {
    builtAreaIds: ["judea", "arabia"],
    expectedAreaIds: ["judea", "arabia"],
    validity: [{ areaId: "judea", valid: true, duplicateVertices: 0 }, { areaId: "arabia", valid: true, duplicateVertices: 0 }],
    overlaps: [{ pair: "arabia + judea", areaKm2: 0.004 }],
    coverageGaps: [{ areaKm2: 79605.3, point: [-1.136, 52.13], explanation: "Great Britain" }],
    places: [
      { label: "jerusalem", areaId: "judea", status: "inside", distanceKm: 0 },
      { label: "joppa", areaId: "judea", status: "near-border", distanceKm: 0.68, explanation: "" },
      { label: "pisidia", areaId: "galatia", status: "outside", distanceKm: 60.55, explanation: "Label point for the region." }
    ],
    anchors: [{ name: "Petra", expected: "arabia", areaIds: ["arabia"] }],
    emptyPoints: [{ name: "the Latmian Gulf", areaIds: [] }],
    coastStretches: [{ start: [29.68, 45.28], lengthKm: 5.4 }],
    aidStretches: [{ areaId: "arabia", aid: "the aid", start: [35.886, 29.23], lengthKm: 4.1, closestKm: 0 }]
  };
}

test("acceptanceFailures passes results that meet every check", () => {
  assert.deepEqual(acceptanceFailures(passingResults()), []);
});

test("acceptanceFailures names each failed check", () => {
  const cases = [
    [(results) => results.builtAreaIds.pop(), /arabia was not built/],
    [(results) => { results.validity[0].valid = false; }, /judea is not a valid polygon/],
    [(results) => { results.validity[1].duplicateVertices = 2; }, /arabia repeats 2 vertices/],
    [(results) => results.overlaps.push({ pair: "arabia + egypt", areaKm2: 3.2 }), /arabia \+ egypt overlap by 3\.20 km²/],
    [(results) => results.coverageGaps.push({ areaKm2: 12, point: [10, 36], explanation: null }), /12\.0 km² at 10\.000, 36\.000 lies in no area/],
    [(results) => results.places.push({ label: "tarsus", areaId: "cilicia", status: "outside", distanceKm: 4.2, explanation: "" }), /tarsus is 4\.2 km outside `cilicia`/],
    [(results) => results.places.push({ label: "rome", areaId: "italy", status: "area-not-built", distanceKm: null, explanation: "" }), /rome is linked to an area that wasn't built/],
    [(results) => results.anchors.push({ name: "Raphia", expected: "judea", areaIds: ["arabia"] }), /Raphia lies in arabia, not judea/],
    [(results) => { results.emptyPoints[0].areaIds = ["asia"]; }, /the Latmian Gulf lies in asia/],
    [(results) => results.coastStretches.push({ start: [18.5, 30.4], lengthKm: 42 }), /runs 42\.0 km along today's coast/],
    [(results) => results.aidStretches.push({ areaId: "judea", aid: "the aid", start: [34.4, 30.8], lengthKm: 12, closestKm: 0.1 }), /judea's border runs 12\.0 km close to the aid from 34\.400, 30\.800/]
  ];
  for (const [breakIt, message] of cases) {
    const results = passingResults();
    breakIt(results);
    const failures = acceptanceFailures(results);
    assert.equal(failures.length, 1, `expected one failure for ${message}, got ${failures.join("; ")}`);
    assert.match(failures[0], message);
  }
});

function area(areaId, ring) {
  return { type: "Feature", properties: { areaId }, geometry: { type: "Polygon", coordinates: [ring] } };
}

// A north–south line along 35°E; 1 km is about 0.0104° of longitude at 30°N.
const AID = [[35, 30], [35, 30.5]];

test("borderStretchesNear measures a border that crosses a line as a short stretch", () => {
  const crossing = area("judea", [[34.9, 30.2], [35.1, 30.2], [35.1, 30.3], [34.9, 30.3], [34.9, 30.2]]);
  const stretches = borderStretchesNear([crossing], AID, 1);
  assert.equal(stretches.length, 2);
  for (const stretch of stretches) {
    assert.equal(stretch.areaId, "judea");
    assert.ok(Math.abs(stretch.lengthKm - 2) < 0.1, `a square crossing spends about 2 km within 1 km of the line, got ${stretch.lengthKm}`);
    assert.ok(stretch.closestKm < 0.05);
  }
});

test("borderStretchesNear measures a border that follows a line as one long stretch, across the ring's start", () => {
  // The western edge runs 0.48 km from the line for 0.3° of latitude (33 km); the ring starts on it.
  const following = area("arabia", [[35.005, 30.1], [35.2, 30.1], [35.2, 30.4], [35.005, 30.4], [35.005, 30.1]]);
  const stretches = borderStretchesNear([following], AID, 1);
  assert.equal(stretches.length, 1);
  assert.ok(stretches[0].lengthKm > 33.5 && stretches[0].lengthKm < 35, `got ${stretches[0].lengthKm}`);
  assert.ok(Math.abs(stretches[0].closestKm - 0.48) < 0.01);
});

test("borderStretchesNear finds nothing near a line that no border approaches", () => {
  const away = area("egypt", [[35.1, 30.1], [35.3, 30.1], [35.3, 30.3], [35.1, 30.3], [35.1, 30.1]]);
  assert.deepEqual(borderStretchesNear([away], AID, 1), []);
});
