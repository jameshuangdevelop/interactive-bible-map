import type { FitBoundsOptions, LngLatBoundsLike } from "maplibre-gl";

import { OPENING_AREA_BOUNDS } from "./constants";

const OPENING_AREA_PADDING_PX = 0;

export interface CameraInsets {
  left: number;
  bottom: number;
}

export interface FitPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function resolveMapFitPadding({
  leftInset,
  bottomInset,
  top,
  side,
  bottom
}: {
  leftInset: number;
  bottomInset: number;
  top: number;
  side: number;
  bottom: number;
}): FitPadding {
  return {
    top,
    right: side,
    bottom: bottomInset + bottom,
    left: leftInset + side
  };
}

export function openingAreaBounds(): LngLatBoundsLike {
  return OPENING_AREA_BOUNDS as LngLatBoundsLike;
}

export function openingAreaFitOptions({
  insets,
  durationMs
}: {
  insets: CameraInsets;
  durationMs: number;
}): Omit<FitBoundsOptions, "maxZoom"> {
  return {
    padding: resolveMapFitPadding({
      leftInset: insets.left,
      bottomInset: insets.bottom,
      top: OPENING_AREA_PADDING_PX,
      side: OPENING_AREA_PADDING_PX,
      bottom: OPENING_AREA_PADDING_PX
    }),
    duration: durationMs
  };
}
