import {
  resolveSheetReleaseVelocity,
  settleSmallScreenSheetPosition,
  sheetHeightForPosition,
  type SettleSmallScreenSheetPositionInput
} from "../src/components/small-screen-sheet-settle";

const HALF_HEIGHT = 400;
const FULL_HEIGHT = 828;

function settle(overrides: Partial<SettleSmallScreenSheetPositionInput> = {}) {
  return settleSmallScreenSheetPosition({
    canClose: true,
    currentHeightPx: HALF_HEIGHT,
    dragDeltaYPx: 0,
    movedPx: 32,
    startPosition: "half",
    tapThresholdPx: 6,
    velocityYPxPerMs: 0,
    flickVelocityThresholdPxPerMs: 0.55,
    halfHeightPx: HALF_HEIGHT,
    fullHeightPx: FULL_HEIGHT,
    ...overrides
  });
}

describe("small screen sheet settle logic", () => {
  test("picks the nearest position when release speed is not a flick", () => {
    expect(settle({ currentHeightPx: 60, velocityYPxPerMs: 0.2 })).toBe("closed");
    expect(settle({ currentHeightPx: HALF_HEIGHT + 8, velocityYPxPerMs: 0.1 })).toBe("half");
    expect(settle({ currentHeightPx: FULL_HEIGHT - 12, velocityYPxPerMs: -0.1 })).toBe("full");
  });

  test("flicking up advances one position", () => {
    expect(
      settle({
        startPosition: "half",
        currentHeightPx: HALF_HEIGHT + 10,
        dragDeltaYPx: -48,
        velocityYPxPerMs: -0.9
      })
    ).toBe("full");
  });

  test("flicking down from full settles to half", () => {
    expect(
      settle({
        startPosition: "full",
        currentHeightPx: FULL_HEIGHT - 20,
        dragDeltaYPx: 88,
        velocityYPxPerMs: 0.9
      })
    ).toBe("half");
  });

  test("flicking down from half closes the sheet", () => {
    expect(
      settle({
        startPosition: "half",
        currentHeightPx: HALF_HEIGHT - 8,
        dragDeltaYPx: 52,
        velocityYPxPerMs: 0.9
      })
    ).toBe("closed");
  });

  test("dragging down from half can close the sheet", () => {
    expect(
      settle({
        startPosition: "half",
        currentHeightPx: 42,
        dragDeltaYPx: 280,
        velocityYPxPerMs: 0.35
      })
    ).toBe("closed");
  });

  test("tap threshold toggles between half and full", () => {
    expect(settle({ startPosition: "half", movedPx: 4, velocityYPxPerMs: 0 })).toBe("full");
    expect(settle({ startPosition: "full", movedPx: 3, velocityYPxPerMs: 0 })).toBe("half");
  });

  test("when closing is disabled, settle never returns closed", () => {
    expect(
      settle({
        canClose: false,
        startPosition: "half",
        currentHeightPx: 40,
        dragDeltaYPx: 240
      })
    ).toBe("half");
  });

  test("height helper maps all positions", () => {
    expect(sheetHeightForPosition("closed", HALF_HEIGHT, FULL_HEIGHT)).toBe(0);
    expect(sheetHeightForPosition("half", HALF_HEIGHT, FULL_HEIGHT)).toBe(HALF_HEIGHT);
    expect(sheetHeightForPosition("full", HALF_HEIGHT, FULL_HEIGHT)).toBe(FULL_HEIGHT);
  });

  test("release velocity sample under floor keeps tracked velocity", () => {
    expect(
      resolveSheetReleaseVelocity({
        trackedVelocityYPxPerMs: -0.6,
        releaseVelocityYPxPerMs: 0.9,
        elapsedSinceLastMoveMs: 2,
        releaseVelocityMinSampleMs: 6
      })
    ).toBe(-0.6);
  });

  test("release velocity sample over floor can override tracked velocity", () => {
    expect(
      resolveSheetReleaseVelocity({
        trackedVelocityYPxPerMs: -0.4,
        releaseVelocityYPxPerMs: 0.8,
        elapsedSinceLastMoveMs: 8,
        releaseVelocityMinSampleMs: 6
      })
    ).toBe(0.8);
  });
});
