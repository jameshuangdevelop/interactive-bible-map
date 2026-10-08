import test from "node:test";
import assert from "node:assert/strict";

import { acceptanceFailures } from "../scripts/lib/ancient-area-checks.mjs";

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
    coastStretches: [{ start: [29.68, 45.28], lengthKm: 5.4 }]
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
    [(results) => results.coastStretches.push({ start: [18.5, 30.4], lengthKm: 42 }), /runs 42\.0 km along today's coast/]
  ];
  for (const [breakIt, message] of cases) {
    const results = passingResults();
    breakIt(results);
    const failures = acceptanceFailures(results);
    assert.equal(failures.length, 1, `expected one failure for ${message}, got ${failures.join("; ")}`);
    assert.match(failures[0], message);
  }
});
