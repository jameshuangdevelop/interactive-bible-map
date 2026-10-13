import type { Coordinates, PlaceType } from "./types";

export const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";
export const ANCIENT_MAIN_BASEMAP_STYLE_URL = "/styles/liberty/style.json";
export const ANCIENT_FALLBACK_BASEMAP_STYLE_URL = "/styles/versatiles-colorful/style.json";
export const MODERN_MAIN_BASEMAP_STYLE_URL = "/styles/liberty-modern/style.json";
export const MODERN_FALLBACK_BASEMAP_STYLE_URL = "/styles/versatiles-colorful-modern/style.json";

export const ANCIENT_MAIN_BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export const ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION =
  '<a href="https://versatiles.org" target="_blank">VersaTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="https://esa-worldcover.org/en/data-access" target="_blank">&copy; ESA WorldCover 2021</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>)';
export const MODERN_MAIN_BASEMAP_ATTRIBUTION = ANCIENT_MAIN_BASEMAP_ATTRIBUTION;
export const MODERN_FALLBACK_BASEMAP_ATTRIBUTION = ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION;
export const ANCIENT_AWMC_ATTRIBUTION =
  'Contains information from <a href="https://github.com/AWMC/geodata" target="_blank">AWMC Geodata</a>, which is made available here under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank">Open Database License (ODbL)</a>.';

export const DEFAULT_MAP_CENTER: Coordinates = [22.5, 35];
export const DEFAULT_MAP_ZOOM = 4.7;
export const DESKTOP_FIXED_OPENING_MIN_WIDTH = 1024;
export const PHONE_OPENING_AREA_BOUNDS: readonly [Coordinates, Coordinates] = [
  [8.708, 27.106441978611198],
  [36.292, 42.2]
];
export const MAX_MAP_ZOOM = 14;

export const CLUSTER_MAX_ZOOM = 6;
export const CANDIDATE_PINS_MIN_ZOOM = 8;

export const TILE_ERROR_THRESHOLD = 3;
export const TILE_ERROR_WINDOW_MS = 30_000;
export const FALLBACK_MESSAGE =
  "The main map service isn't responding. Showing the backup map.";

export const PIN_COLORS: Record<PlaceType, string> = {
  city: "#C5221F",
  town: "#C5221F",
  village: "#C5221F",
  site: "#8430CE",
  "natural-feature": "#0B6B2E",
  region: "#5F6368",
  province: "#5F6368",
  empire: "#5F6368"
};
