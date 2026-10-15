import {
  ANCIENT_GEO_INPUTS,
  fetchPinnedInput
} from "./ancient-geo-inputs.mjs";

export const ROUTE_LINE_INPUTS = Object.freeze({
  naturalEarthLand: ANCIENT_GEO_INPUTS.naturalEarthLand,
  naturalEarthCoastline: ANCIENT_GEO_INPUTS.naturalEarthCoastline,
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
    naturalEarthCoastline: byKey.naturalEarthCoastline,
    naturalEarthLakes: byKey.naturalEarthLakes
  };
}
