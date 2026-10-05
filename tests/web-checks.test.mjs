import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMedian,
  evaluateLighthouseGate,
  parseLighthouseTbtMode
} from "../scripts/lib/web-checks.mjs";

test("calculateMedian returns the middle value for odd-length lists", () => {
  assert.equal(calculateMedian([652.5, 509.5, 584]), 584);
});

test("evaluateLighthouseGate enforces TBT in enforce mode", () => {
  const gate = evaluateLighthouseGate({
    lcpValuesMs: [1_280, 1_140, 1_220],
    tbtValuesMs: [509.5, 584, 652.5],
    lcpThresholdMs: 2_500,
    tbtThresholdMs: 200,
    tbtMode: "enforce"
  });

  assert.equal(gate.lcpMedianMs, 1_220);
  assert.equal(gate.tbtMedianMs, 584);
  assert.equal(gate.lcpPassed, true);
  assert.equal(gate.tbtPassed, false);
  assert.equal(gate.tbtEnforced, true);
  assert.equal(gate.passed, false);
});

test("evaluateLighthouseGate reports TBT without gating in report mode", () => {
  const gate = evaluateLighthouseGate({
    lcpValuesMs: [1_280, 1_140, 1_220],
    tbtValuesMs: [509.5, 584, 652.5],
    lcpThresholdMs: 2_500,
    tbtThresholdMs: 200,
    tbtMode: parseLighthouseTbtMode(["--tbt-mode=report"], {})
  });

  assert.equal(gate.lcpMedianMs, 1_220);
  assert.equal(gate.tbtMedianMs, 584);
  assert.equal(gate.lcpPassed, true);
  assert.equal(gate.tbtPassed, false);
  assert.equal(gate.tbtEnforced, false);
  assert.equal(gate.passed, true);
});
