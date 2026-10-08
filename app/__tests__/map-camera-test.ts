import {
  DEFAULT_MAP_ZOOM,
  DESKTOP_FIXED_OPENING_MIN_WIDTH,
  PHONE_OPENING_AREA_BOUNDS
} from "../src/features/map/constants";
import {
  openingAreaFitOptions,
  openingCameraMode,
  resolveMapFitPadding
} from "../src/features/map/map-camera";

describe("map camera helpers", () => {
  test("uses stable phone opening bounds centered on the baseline overview", () => {
    expect(PHONE_OPENING_AREA_BOUNDS).toEqual([
      [8.708, 27.106441978611198],
      [36.292, 42.2]
    ]);
  });

  test("keeps the legacy fixed opening camera on desktop widths", () => {
    expect(openingCameraMode(DESKTOP_FIXED_OPENING_MIN_WIDTH)).toBe("desktop-fixed");
    expect(openingCameraMode(1440)).toBe("desktop-fixed");
    expect(openingCameraMode(1023)).toBe("fit-bounds");
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
        top: 96,
        right: 16,
        bottom: 80,
        left: 48
      },
      maxZoom: DEFAULT_MAP_ZOOM,
      duration: 250
    });
  });
});
