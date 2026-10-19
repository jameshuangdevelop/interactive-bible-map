import {
  ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION,
  ANCIENT_MAIN_BASEMAP_ATTRIBUTION,
  ANCIENT_AWMC_ATTRIBUTION,
  MODERN_FALLBACK_BASEMAP_ATTRIBUTION,
  MODERN_MAIN_BASEMAP_ATTRIBUTION
} from "./constants";
import type { BasemapMode } from "./basemap-fallback";
import type { MapDisplayMode } from "./types";

export function getAttributionMarkup(
  mode: BasemapMode,
  mapMode: MapDisplayMode,
  routesModeEnabled: boolean
) {
  if (mapMode === "modern") {
    const modernBasemapAttribution =
      mode === "fallback" ? MODERN_FALLBACK_BASEMAP_ATTRIBUTION : MODERN_MAIN_BASEMAP_ATTRIBUTION;
    const routeLineNotice = routesModeEnabled ? ` · ${ANCIENT_AWMC_ATTRIBUTION}` : "";
    return `${modernBasemapAttribution}${routeLineNotice}`;
  }

  const basemapAttribution =
    mode === "fallback" ? ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION : ANCIENT_MAIN_BASEMAP_ATTRIBUTION;
  return `${basemapAttribution} · ${ANCIENT_AWMC_ATTRIBUTION}`;
}
