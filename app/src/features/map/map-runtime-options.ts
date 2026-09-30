export interface MapVariantOptions {
  disableRelief: boolean;
  reliefExplicit: boolean;
  disableLandcover: boolean;
  disableFade: boolean;
  pixelRatioCap: 1 | 2;
  pixelRatioExplicit: boolean;
  zoomRatePreset: "default" | "fast";
  lite: boolean;
}

export interface MapRuntimeTuning {
  variants: MapVariantOptions;
  symbolFadeDurationMs: number;
  rasterFadeDurationMs: number;
  maxTileCacheSize: number;
  maxTileCacheZoomLevels: number;
  cancelPendingTileRequestsWhileZooming: boolean;
  dragPan: {
    linearity: number;
    maxSpeed: number;
    deceleration: number;
  };
  zoomRates: {
    wheel: number;
    trackpad: number;
    pinch: number;
  };
  flyToDurationMs: number;
  controlZoomDurationMs: number;
  doubleClickZoomStep: number;
  keyboardPanStepPx: number;
  keyboardZoomStep: number;
}

const defaultVariantOptions: MapVariantOptions = {
  disableRelief: false,
  reliefExplicit: false,
  disableLandcover: false,
  disableFade: false,
  pixelRatioCap: 2,
  pixelRatioExplicit: false,
  zoomRatePreset: "default",
  lite: false
};

function parseSearchParameters(search: string) {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

function isEnabledOne(value: string | null) {
  return value?.trim() === "1";
}

function isDisabledZero(value: string | null) {
  return value?.trim() === "0";
}

export function parseMapVariantOptions(search: string): MapVariantOptions {
  const parameters = parseSearchParameters(search);
  const lite = isEnabledOne(parameters.get("lite"));
  const reliefParameter = parameters.get("relief")?.trim() ?? null;
  const landcoverParameter = parameters.get("landcover");
  const fadeParameter = parameters.get("fade");
  const dprParameter = parameters.get("dpr")?.trim() ?? null;
  const reliefExplicit = isEnabledOne(reliefParameter) || isDisabledZero(reliefParameter);

  const disableRelief =
    lite
      ? true
      : reliefExplicit
        ? isDisabledZero(reliefParameter)
        : defaultVariantOptions.disableRelief;
  const disableLandcover =
    lite ||
    (landcoverParameter === null
      ? defaultVariantOptions.disableLandcover
      : isDisabledZero(landcoverParameter));
  const disableFade =
    lite || (fadeParameter === null ? defaultVariantOptions.disableFade : isDisabledZero(fadeParameter));
  let pixelRatioCap: 1 | 2 = defaultVariantOptions.pixelRatioCap;
  let pixelRatioExplicit = false;
  if (dprParameter === "1") {
    pixelRatioCap = 1;
    pixelRatioExplicit = true;
  } else if (dprParameter === "2") {
    pixelRatioCap = 2;
    pixelRatioExplicit = true;
  }
  if (lite) {
    pixelRatioCap = 1;
    pixelRatioExplicit = true;
  }
  const zoomRatePreset: "default" | "fast" =
    lite || parameters.get("zoomrate")?.trim().toLowerCase() === "fast" ? "fast" : "default";

  return {
    ...defaultVariantOptions,
    disableRelief,
    reliefExplicit,
    disableLandcover,
    disableFade,
    pixelRatioCap,
    pixelRatioExplicit,
    zoomRatePreset,
    lite
  };
}

export function resolveEffectiveMapVariantOptions(
  variants: MapVariantOptions,
  options: { isSoftwareRenderer: boolean }
): MapVariantOptions {
  return {
    ...variants,
    disableRelief: variants.disableRelief || (options.isSoftwareRenderer && !variants.reliefExplicit)
  };
}

export function resolveMapRuntimeTuning(search: string): MapRuntimeTuning {
  const variants = parseMapVariantOptions(search);
  const disableFade = variants.disableFade;

  return {
    variants,
    symbolFadeDurationMs: disableFade ? 0 : 80,
    rasterFadeDurationMs: disableFade ? 0 : 0,
    maxTileCacheSize: 512,
    maxTileCacheZoomLevels: 8,
    cancelPendingTileRequestsWhileZooming: false,
    dragPan: {
      linearity: 0.3,
      maxSpeed: 1_400,
      deceleration: 2_500
    },
    zoomRates:
      variants.zoomRatePreset === "fast"
        ? {
            wheel: 1 / 320,
            trackpad: 1 / 55,
            pinch: 1.35
          }
        : {
            wheel: 1 / 420,
            trackpad: 1 / 85,
            pinch: 1
          },
    flyToDurationMs: 650,
    controlZoomDurationMs: 250,
    doubleClickZoomStep: 1,
    keyboardPanStepPx: 120,
    keyboardZoomStep: 0.75
  };
}
