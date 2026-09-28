import type { Coordinates, PlaceType } from "./types";

export const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";
export const MAIN_BASEMAP_STYLE_URL = "/styles/liberty/style.json";
export const FALLBACK_BASEMAP_STYLE_URL = "/styles/versatiles-colorful/style.json";

export const MAIN_BASEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export const FALLBACK_BASEMAP_ATTRIBUTION =
  '<a href="https://versatiles.org" target="_blank">VersaTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="https://esa-worldcover.org/en/data-access" target="_blank">&copy; ESA WorldCover 2021</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>)';

export const MAIN_BASEMAP_NAME =
  "Interactive Bible Map basemap (modified from OpenFreeMap Liberty)";

export const DEFAULT_MAP_CENTER: Coordinates = [22.5, 35];
export const DEFAULT_MAP_ZOOM = 4.7;

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
  region: "#5F6368"
};
