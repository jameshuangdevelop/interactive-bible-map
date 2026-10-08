// OpenStreetMap waterway helpers for the ancient-area cuts (rivers as described borders).
// OSM data is © OpenStreetMap contributors, ODbL 1.0 (compatible with data/geo/, ADR-0012).
import fs from "node:fs/promises";
import path from "node:path";

export const OSM_API_BASE_URL = "https://api.openstreetmap.org/api/0.6";
const USER_AGENT = "interactive-bible-map-ancient-geo/1.0 (+https://github.com/jameshuangdevelop/interactive-bible-map)";
const EARTH_RADIUS_KM = 6371.0088;

// Fetches a relation with all member ways and nodes from the OSM API and caches the raw response.
// The OSM API is used instead of Overpass because a relation download is a single, stable request.
export async function fetchOsmRelationFull(relationId, cacheDirectory, { fetchImpl = fetch } = {}) {
  const cachePath = path.join(cacheDirectory, `osm-relation-${relationId}-full.json`);
  try {
    return JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch {
    // Not cached yet; download below.
  }
  const response = await fetchImpl(`${OSM_API_BASE_URL}/relation/${relationId}/full.json`, {
    headers: { "user-agent": USER_AGENT }
  });
  if (!response.ok) {
    throw new Error(`OSM API request for relation ${relationId} failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  await fs.mkdir(cacheDirectory, { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify(data), "utf8");
  return data;
}

// Returns the relation's main-stream ways in member order as { id, version, nodeIds, coordinates }.
// Members without a role are used only when the relation tags no main_stream member at all.
export function relationMainStreamWays(relationFull, { excludeWayIds = [] } = {}) {
  const elements = relationFull?.elements ?? [];
  const relation = elements.find((element) => element.type === "relation");
  if (!relation) throw new Error("OSM response contains no relation");
  const nodeById = new Map(elements.filter((element) => element.type === "node").map((node) => [node.id, [node.lon, node.lat]]));
  const wayById = new Map(elements.filter((element) => element.type === "way").map((way) => [way.id, way]));
  const wayMembers = relation.members.filter((member) => member.type === "way");
  const hasMainStream = wayMembers.some((member) => member.role === "main_stream");
  const excluded = new Set(excludeWayIds);
  return wayMembers
    .filter((member) => (hasMainStream ? member.role === "main_stream" : member.role === ""))
    .filter((member) => !excluded.has(member.ref))
    .map((member) => {
      const way = wayById.get(member.ref);
      if (!way) throw new Error(`OSM relation ${relation.id} is missing way ${member.ref}`);
      return {
        id: way.id,
        version: way.version ?? null,
        nodeIds: way.nodes,
        coordinates: way.nodes.map((nodeId) => {
          const coordinate = nodeById.get(nodeId);
          if (!coordinate) throw new Error(`OSM way ${way.id} references missing node ${nodeId}`);
          return coordinate;
        })
      };
    });
}

// Joins ways that share an end node into chains, reversing ways where needed.
// Returns [{ wayIds, coordinates }], longest chain first.
export function assembleWayChains(ways) {
  const remaining = ways.map((way) => ({ ...way }));
  const chains = [];
  while (remaining.length > 0) {
    const first = remaining.shift();
    let nodeIds = [...first.nodeIds];
    let coordinates = [...first.coordinates];
    const wayIds = [first.id];
    let extended = true;
    while (extended) {
      extended = false;
      for (let index = 0; index < remaining.length; index += 1) {
        const way = remaining[index];
        const wayStart = way.nodeIds[0];
        const wayEnd = way.nodeIds.at(-1);
        const reversedNodes = [...way.nodeIds].reverse();
        const reversedCoordinates = [...way.coordinates].reverse();
        if (wayStart === nodeIds.at(-1)) {
          nodeIds = nodeIds.concat(way.nodeIds.slice(1));
          coordinates = coordinates.concat(way.coordinates.slice(1));
          wayIds.push(way.id);
        } else if (wayEnd === nodeIds.at(-1)) {
          nodeIds = nodeIds.concat(reversedNodes.slice(1));
          coordinates = coordinates.concat(reversedCoordinates.slice(1));
          wayIds.push(way.id);
        } else if (wayEnd === nodeIds[0]) {
          nodeIds = way.nodeIds.concat(nodeIds.slice(1));
          coordinates = way.coordinates.concat(coordinates.slice(1));
          wayIds.unshift(way.id);
        } else if (wayStart === nodeIds[0]) {
          nodeIds = reversedNodes.concat(nodeIds.slice(1));
          coordinates = reversedCoordinates.concat(coordinates.slice(1));
          wayIds.unshift(way.id);
        } else {
          continue;
        }
        remaining.splice(index, 1);
        extended = true;
        break;
      }
    }
    chains.push({ wayIds, nodeIds, coordinates });
  }
  return chains.sort((left, right) => right.coordinates.length - left.coordinates.length);
}

export function distanceKm([lon1, lat1], [lon2, lat2]) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

// Orients a polyline so that it starts at the end nearer to `point`.
export function orientFrom(coordinates, point) {
  return distanceKm(coordinates[0], point) <= distanceKm(coordinates.at(-1), point) ? [...coordinates] : [...coordinates].reverse();
}

// Unit direction (in local km east/north) pointing out of the line at its start or end,
// measured from the vertex about `baseKm` back along the line, so one wiggle does not set the direction.
export function outwardDirection(coordinates, atEnd, baseKm = 3) {
  const sequence = atEnd ? [...coordinates].reverse() : coordinates;
  const tip = sequence[0];
  let travelled = 0;
  let anchor = sequence[1];
  for (let index = 1; index < sequence.length; index += 1) {
    travelled += distanceKm(sequence[index - 1], sequence[index]);
    anchor = sequence[index];
    if (travelled >= baseKm) break;
  }
  const kmPerDegreeLon = 111.32 * Math.cos((tip[1] * Math.PI) / 180);
  const east = (tip[0] - anchor[0]) * kmPerDegreeLon;
  const north = (tip[1] - anchor[1]) * 110.574;
  const length = Math.hypot(east, north);
  if (length === 0) throw new Error("Cannot measure a direction on a zero-length line end");
  return { east: east / length, north: north / length, measuredOverKm: travelled };
}

// Moves `point` by `lengthKm` along a local east/north unit direction.
export function offsetPoint([lon, lat], { east, north }, lengthKm) {
  const kmPerDegreeLon = 111.32 * Math.cos((lat * Math.PI) / 180);
  return [lon + (east * lengthKm) / kmPerDegreeLon, lat + (north * lengthKm) / 110.574];
}

// Extends a polyline straight out of one end. Use either a fixed `lengthKm` or `untilLatitude`
// (the extension then stops on the first point at or beyond that latitude).
export function extendLineEnd(coordinates, { atEnd, baseKm = 3, lengthKm = null, untilLatitude = null }) {
  const direction = outwardDirection(coordinates, atEnd, baseKm);
  const tip = atEnd ? coordinates.at(-1) : coordinates[0];
  let length = lengthKm;
  if (length === null) {
    if (untilLatitude === null) throw new Error("extendLineEnd needs lengthKm or untilLatitude");
    if (Math.sign(direction.north) !== Math.sign(untilLatitude - tip[1]) || direction.north === 0) {
      throw new Error(`Line end at ${tip.join(",")} does not point towards latitude ${untilLatitude}`);
    }
    length = ((untilLatitude - tip[1]) * 110.574) / direction.north;
  }
  const added = offsetPoint(tip, direction, length);
  const extended = atEnd ? [...coordinates, added] : [added, ...coordinates];
  return { coordinates: extended, added, lengthKm: length, direction };
}
