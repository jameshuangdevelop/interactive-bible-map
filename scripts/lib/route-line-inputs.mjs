// The pinned inputs of the routes' lines: Natural Earth 10 m land and 10 m lakes at commit
// NATURAL_EARTH_COMMIT, checked against their SHA-256s (the same pins as `npm run build:ancient-geo`).
import {
  ANCIENT_GEO_INPUTS,
  fetchPinnedInput
} from "./ancient-geo-inputs.mjs";

export const ROUTE_LINE_INPUTS = Object.freeze({
  naturalEarthLand: ANCIENT_GEO_INPUTS.naturalEarthLand,
  naturalEarthLakes: ANCIENT_GEO_INPUTS.naturalEarthLakes
});

export async function fetchPinnedRouteLineInputs(directory, options = {}) {
  const entries = await Promise.all(
    Object.entries(ROUTE_LINE_INPUTS).map(async ([key, input]) => [
      key,
      await fetchPinnedInput(input, directory, options)
    ])
  );
  const byKey = Object.fromEntries(entries);
  return {
    naturalEarthLand: byKey.naturalEarthLand,
    naturalEarthLakes: byKey.naturalEarthLakes
  };
}
