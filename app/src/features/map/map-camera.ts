import type { FitBoundsOptions, LngLatBoundsLike } from "maplibre-gl";

import {
  DEFAULT_MAP_ZOOM,
  DESKTOP_FIXED_OPENING_MIN_WIDTH,
  PHONE_OPENING_AREA_BOUNDS
} from "./constants";

const OPENING_AREA_SIDE_PADDING_PX = 16;
const OPENING_AREA_TOP_PADDING_PX = 96;
const OPENING_AREA_BOTTOM_PADDING_PX = 16;

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

export type OpeningCameraMode = "desktop-fixed" | "fit-bounds";

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

export function openingCameraMode(viewportWidth: number): OpeningCameraMode {
  return viewportWidth >= DESKTOP_FIXED_OPENING_MIN_WIDTH ? "desktop-fixed" : "fit-bounds";
}

export function openingAreaBounds(): LngLatBoundsLike {
  return PHONE_OPENING_AREA_BOUNDS as LngLatBoundsLike;
}

export function openingAreaFitOptions({
  insets,
  durationMs
}: {
  insets: CameraInsets;
  durationMs: number;
}): Pick<FitBoundsOptions, "padding" | "duration" | "maxZoom"> {
  return {
    padding: resolveMapFitPadding({
      leftInset: insets.left,
      bottomInset: insets.bottom,
      top: OPENING_AREA_TOP_PADDING_PX,
      side: OPENING_AREA_SIDE_PADDING_PX,
      bottom: OPENING_AREA_BOTTOM_PADDING_PX
    }),
    maxZoom: DEFAULT_MAP_ZOOM,
    duration: durationMs
  };
}
