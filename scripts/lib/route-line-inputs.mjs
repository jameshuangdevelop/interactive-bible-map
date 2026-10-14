import path from "node:path";

import {
  ANCIENT_GEO_INPUTS,
  fetchPinnedInput
} from "./ancient-geo-inputs.mjs";

const ORBIS_BASE_URL = "https://stacks.stanford.edu/file/druid:mn425tz9757";

const orbis = (file, sha256) => ({
  file,
  upstreamPath: `druid:mn425tz9757/${file}`,
  url: `${ORBIS_BASE_URL}/${file}`,
  sha256
});

export const ROUTE_LINE_INPUTS = Object.freeze({
  orbisNodes: orbis(
    "orbis_nodes_0514.csv",
    "4c331dff0780882ac66adde8cb531f051d1f5ae3cc8f1f3193b2006077ee8a19"
  ),
  orbisEdges: orbis(
    "orbis_edges_0514.csv",
    "9f50bff2c72995009427b8062a5180fc0060f5c889233bdeaf0c44077f15f0be"
  ),
  naturalEarthLand: ANCIENT_GEO_INPUTS.naturalEarthLand,
  naturalEarthCoastline: ANCIENT_GEO_INPUTS.naturalEarthCoastline
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
    orbisNodes: byKey.orbisNodes ?? path.join(directory, ROUTE_LINE_INPUTS.orbisNodes.file),
    orbisEdges: byKey.orbisEdges ?? path.join(directory, ROUTE_LINE_INPUTS.orbisEdges.file),
    naturalEarthLand:
      byKey.naturalEarthLand ??
      path.join(directory, ROUTE_LINE_INPUTS.naturalEarthLand.file),
    naturalEarthCoastline:
      byKey.naturalEarthCoastline ??
      path.join(directory, ROUTE_LINE_INPUTS.naturalEarthCoastline.file)
  };
}
