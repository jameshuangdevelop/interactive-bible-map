import type { BasemapMode } from "./basemap-fallback";

export const PRIMARY_VECTOR_SOURCE_ID = "openmaptiles";
const PRIMARY_TILE_HOST = "tiles.openfreemap.org";

export interface TileErrorLike {
  sourceId?: string | null;
  tile?: unknown;
  error?: { message?: string } | null;
}

export function shouldCountTileErrorForFallback(
  error: TileErrorLike,
  basemapMode: BasemapMode
) {
  if (basemapMode !== "main") {
    return false;
  }

  if (error.sourceId === PRIMARY_VECTOR_SOURCE_ID) {
    return true;
  }

  const message = error.error?.message?.toLowerCase() ?? "";
  return message.includes(PRIMARY_VECTOR_SOURCE_ID) || message.includes(PRIMARY_TILE_HOST);
}
