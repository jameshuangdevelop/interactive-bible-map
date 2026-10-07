import { OPENING_AREA_BOUNDS } from "../src/features/map/constants";
import { openingAreaFitOptions, resolveMapFitPadding } from "../src/features/map/map-camera";

describe("map camera helpers", () => {
  test("uses stable opening bounds from the prior desktop overview", () => {
    expect(OPENING_AREA_BOUNDS).toEqual([
      [3.0229106482542534, 24.45351319358689],
      [41.97708935174575, 44.345035689593246]
    ]);
  });

  test("combines UI insets into fit padding", () => {
    expect(
      resolveMapFitPadding({
        leftInset: 408,
        bottomInset: 120,
        top: 16,
        side: 16,
        bottom: 16
      })
    ).toEqual({
      top: 16,
      right: 16,
      bottom: 136,
      left: 424
    });
  });

  test("builds opening-area fit options with inset-aware padding", () => {
    expect(
      openingAreaFitOptions({
        insets: { left: 32, bottom: 64 },
        durationMs: 250
      })
    ).toEqual({
      padding: {
        top: 0,
        right: 0,
        bottom: 64,
        left: 32
      },
      duration: 250
    });
  });
});
