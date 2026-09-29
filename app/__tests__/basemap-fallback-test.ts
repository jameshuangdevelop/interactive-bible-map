import {
  BasemapFallbackController,
  MainSourceLoadTimeoutController,
  resolveInitialBasemapMode
} from "../src/features/map/basemap-fallback";
import { FALLBACK_MESSAGE } from "../src/features/map/constants";
import { shouldCountTileErrorForFallback } from "../src/features/map/tile-error-filter";

describe("basemap fallback controller", () => {
  test("starts on fallback when EXPO_PUBLIC_BASEMAP=fallback", () => {
    expect(resolveInitialBasemapMode("fallback")).toBe("fallback");
    expect(resolveInitialBasemapMode("main")).toBe("main");
    expect(resolveInitialBasemapMode(undefined)).toBe("main");
  });

  test("switches to fallback after repeated tile errors and sets the user message", () => {
    const controller = new BasemapFallbackController({
      threshold: 3,
      windowMs: 30_000,
      initialMode: "main"
    });

    expect(controller.getState()).toEqual({
      mode: "main",
      message: null
    });

    controller.registerTileError(0);
    controller.registerTileError(8_000);
    const switchedState = controller.registerTileError(12_000);

    expect(switchedState).toEqual({
      mode: "fallback",
      message: FALLBACK_MESSAGE
    });
  });

  test("does not switch when errors do not meet threshold within the window", () => {
    const controller = new BasemapFallbackController({
      threshold: 3,
      windowMs: 10_000,
      initialMode: "main"
    });

    controller.registerTileError(0);
    controller.registerTileError(12_000);
    const state = controller.registerTileError(24_000);

    expect(state).toEqual({
      mode: "main",
      message: null
    });
  });

  test("can switch directly to fallback for source-load failure and sets the message", () => {
    const controller = new BasemapFallbackController({
      initialMode: "main"
    });

    expect(controller.switchToFallback()).toEqual({
      mode: "fallback",
      message: FALLBACK_MESSAGE
    });
  });

  test("counts only openmaptiles source errors while main basemap is active", () => {
    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: "openmaptiles"
        },
        "main"
      )
    ).toBe(true);

    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: "ne2_shaded"
        },
        "main"
      )
    ).toBe(false);

    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: "other-source"
        },
        "main"
      )
    ).toBe(false);

    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: "openmaptiles"
        },
        "fallback"
      )
    ).toBe(false);
  });

  test("counts source errors without a tile when the error message references the main source host", () => {
    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: null,
          tile: null,
          error: {
            message:
              "Failed to load source openmaptiles from https://tiles.openfreemap.org/data/v3.json"
          }
        },
        "main"
      )
    ).toBe(true);

    expect(
      shouldCountTileErrorForFallback(
        {
          sourceId: null,
          tile: null,
          error: {
            message: "Failed to load sprite from another host"
          }
        },
        "main"
      )
    ).toBe(false);
  });

  test("does not trigger timeout fallback when tiles were already loaded before arming", () => {
    const controller = new MainSourceLoadTimeoutController();
    controller.arm({ alreadyLoaded: true });

    expect(controller.shouldSwitchToFallback({ currentlyLoaded: false })).toBe(false);
  });

  test("does not trigger timeout fallback when tiles load after arming", () => {
    const controller = new MainSourceLoadTimeoutController();
    controller.arm({ alreadyLoaded: false });
    controller.markLoaded();

    expect(controller.shouldSwitchToFallback({ currentlyLoaded: false })).toBe(false);
  });
});
