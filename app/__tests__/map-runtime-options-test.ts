import {
  parseMapVariantOptions,
  resolveEffectiveMapVariantOptions,
  resolveMapRuntimeTuning
} from "../src/features/map/map-runtime-options";

describe("map runtime URL variant options", () => {
  test("keeps defaults when no variant params are present", () => {
    expect(parseMapVariantOptions("?place=galilee")).toEqual({
      disableRelief: false,
      reliefExplicit: false,
      disableLandcover: false,
      disableFade: false,
      pixelRatioCap: 2,
      pixelRatioExplicit: false,
      zoomRatePreset: "default",
      lite: false
    });
  });

  test("parses individual variant overrides", () => {
    expect(parseMapVariantOptions("?relief=0&landcover=0&fade=0&dpr=1&zoomrate=fast")).toEqual({
      disableRelief: true,
      reliefExplicit: true,
      disableLandcover: true,
      disableFade: true,
      pixelRatioCap: 1,
      pixelRatioExplicit: true,
      zoomRatePreset: "fast",
      lite: false
    });
  });

  test("applies lite mode as a combined shortcut", () => {
    expect(parseMapVariantOptions("?lite=1")).toEqual({
      disableRelief: true,
      reliefExplicit: false,
      disableLandcover: true,
      disableFade: true,
      pixelRatioCap: 1,
      pixelRatioExplicit: true,
      zoomRatePreset: "fast",
      lite: true
    });
  });

  test("keeps lite mode defaults even when other params disagree", () => {
    expect(parseMapVariantOptions("?lite=1&relief=1&landcover=1&fade=1&zoomrate=slow&dpr=2")).toEqual({
      disableRelief: true,
      reliefExplicit: true,
      disableLandcover: true,
      disableFade: true,
      pixelRatioCap: 1,
      pixelRatioExplicit: true,
      zoomRatePreset: "fast",
      lite: true
    });
  });

  test("accepts dpr=2 as an explicit override", () => {
    expect(parseMapVariantOptions("?dpr=2")).toEqual({
      disableRelief: false,
      reliefExplicit: false,
      disableLandcover: false,
      disableFade: false,
      pixelRatioCap: 2,
      pixelRatioExplicit: true,
      zoomRatePreset: "default",
      lite: false
    });
  });

  test("accepts relief=1 as an explicit override", () => {
    expect(parseMapVariantOptions("?relief=1")).toEqual({
      disableRelief: false,
      reliefExplicit: true,
      disableLandcover: false,
      disableFade: false,
      pixelRatioCap: 2,
      pixelRatioExplicit: false,
      zoomRatePreset: "default",
      lite: false
    });
  });

  test.each([
    { label: "software + relief unset", search: "", software: true, expectedDisableRelief: true },
    { label: "software + relief=0", search: "?relief=0", software: true, expectedDisableRelief: true },
    { label: "software + relief=1", search: "?relief=1", software: true, expectedDisableRelief: false },
    { label: "software + lite=1", search: "?lite=1", software: true, expectedDisableRelief: true },
    { label: "gpu + relief unset", search: "", software: false, expectedDisableRelief: false },
    { label: "gpu + relief=0", search: "?relief=0", software: false, expectedDisableRelief: true },
    { label: "gpu + relief=1", search: "?relief=1", software: false, expectedDisableRelief: false },
    { label: "gpu + lite=1", search: "?lite=1", software: false, expectedDisableRelief: true }
  ])(
    "resolves effective relief defaults for $label",
    ({ search, software, expectedDisableRelief }) => {
      const effective = resolveEffectiveMapVariantOptions(parseMapVariantOptions(search), {
        isSoftwareRenderer: software
      });
      expect(effective.disableRelief).toBe(expectedDisableRelief);
    }
  );

  test("returns fast zoom rates when zoomrate=fast", () => {
    const tuning = resolveMapRuntimeTuning("?zoomrate=fast");
    expect(tuning.zoomRates.wheel).toBeCloseTo(1 / 320);
    expect(tuning.zoomRates.trackpad).toBeCloseTo(1 / 55);
    expect(tuning.zoomRates.pinch).toBeCloseTo(1.35);
  });
});
