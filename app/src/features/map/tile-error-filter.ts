import type { BasemapMode } from "./basemap-fallback";

export const PRIMARY_VECTOR_SOURCE_ID = "openmaptiles";

export interface TileErrorLike {
  sourceId?: string | null;
}

export function shouldCountTileErrorForFallback(
  error: TileErrorLike,
  basemapMode: BasemapMode
) {
  return basemapMode === "main" && error.sourceId === PRIMARY_VECTOR_SOURCE_ID;
}
