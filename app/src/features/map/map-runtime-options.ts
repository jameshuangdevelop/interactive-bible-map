export interface MapVariantOptions {
  disableRelief: boolean;
  disableLandcover: boolean;
  disableFade: boolean;
  pixelRatioCap: 1 | 2;
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
  disableLandcover: false,
  disableFade: false,
  pixelRatioCap: 2,
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
  const reliefParameter = parameters.get("relief");
  const landcoverParameter = parameters.get("landcover");
  const fadeParameter = parameters.get("fade");

  const disableRelief =
    lite || (reliefParameter === null ? defaultVariantOptions.disableRelief : isDisabledZero(reliefParameter));
  const disableLandcover =
    lite ||
    (landcoverParameter === null
      ? defaultVariantOptions.disableLandcover
      : isDisabledZero(landcoverParameter));
  const disableFade =
    lite || (fadeParameter === null ? defaultVariantOptions.disableFade : isDisabledZero(fadeParameter));
  const pixelRatioCap: 1 | 2 = lite || isEnabledOne(parameters.get("dpr")) ? 1 : 2;
  const zoomRatePreset: "default" | "fast" =
    lite || parameters.get("zoomrate")?.trim().toLowerCase() === "fast" ? "fast" : "default";

  return {
    ...defaultVariantOptions,
    disableRelief,
    disableLandcover,
    disableFade,
    pixelRatioCap,
    zoomRatePreset,
    lite
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
