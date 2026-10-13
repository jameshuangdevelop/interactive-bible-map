// OpenStreetMap waterway helpers for the ancient-area cuts (rivers as described borders).
// OSM data is © OpenStreetMap contributors, ODbL 1.0 (compatible with data/geo/, ADR-0012).
//
// The build reads the river ways from the committed file data/geo/sources/osm-waterways.geojson, so it
// never depends on OpenStreetMap's live data. `npm run refresh:osm-waterways -- --date <ISO date>`
// rewrites that file from Overpass's attic data as of a given date; refreshing is a deliberate step.

// The rivers whose courses cut areas: their waterway relations, and ways the build leaves out.
export const OSM_RIVERS = Object.freeze({
  jordan: { relationId: 2246907, label: "Jordan", throughSeaOfGalileeWayId: 1421105372 },
  yarmuk: { relationId: 1355013, label: "Yarmuk" },
  lamus: { relationId: 15952690, label: "Lamus (Limonlu Çayı)" }
});
// The committed file the build reads the rivers from, relative to the repository root.
export const PINNED_WATERWAYS_PATH = "data/geo/sources/osm-waterways.geojson";
// Overpass's attic queries take a UTC timestamp in this form.
export const ATTIC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

// Read-only downloads go through Overpass, not the editing API, which the OSMF API Usage Policy reserves
// for editing. The mirrors are tried in order.
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];
const USER_AGENT = "interactive-bible-map-ancient-geo/1.0 (+https://github.com/jameshuangdevelop/interactive-bible-map)";
const EARTH_RADIUS_KM = 6371.0088;
// Chains with fewer vertices are stray pieces of a river's relation, such as culverts, not its course.
export const MIN_CHAIN_VERTICES = 10;

// A relation with its member ways and their nodes, with each element's version (`out meta`). With a
// `date`, Overpass answers from its attic data: the elements as they were at that moment.
export function overpassRelationQuery(relationId, { date = null } = {}) {
  return `[out:json][timeout:180]${date ? `[date:"${date}"]` : ""};relation(${relationId});(._;>;);out meta;`;
}

// Fetches a relation with all member ways and nodes from Overpass. The response has the same element
// format as the OSM API's "full" download. Busy mirrors answer 429, 500 or 504, so every mirror is
// tried, for up to `rounds` rounds `retryDelayMs` apart.
export async function fetchOsmRelationFull(relationId, { date = null, fetchImpl = fetch, endpoints = OVERPASS_ENDPOINTS, timeoutMs = 240000, rounds = 3, retryDelayMs = 30000 } = {}) {
  const failures = [];
  for (let round = 1; round <= rounds; round += 1) {
    if (round > 1) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    for (const endpoint of endpoints) {
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(overpassRelationQuery(relationId, { date }))}`,
          signal: AbortSignal.timeout(timeoutMs)
        });
        if (!response.ok) {
          failures.push(`${endpoint}: ${response.status} ${response.statusText}`);
          continue;
        }
        const data = await response.json();
        if (!(data?.elements ?? []).some((element) => element.type === "relation" && element.id === relationId)) {
          failures.push(`${endpoint}: the response holds no relation ${relationId}`);
          continue;
        }
        // A mirror whose database is older than the attic date answers with its older state.
        const base = data.osm3s?.timestamp_osm_base ?? null;
        if (date && !(Date.parse(base) >= Date.parse(date))) {
          failures.push(`${endpoint}: its data (as of ${base}) is older than ${date}`);
          continue;
        }
        return data;
      } catch (error) {
        failures.push(`${endpoint}: ${error.message}`);
      }
    }
  }
  throw new Error(`Overpass request for relation ${relationId} failed: ${failures.join("; ")}`);
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

// A river's course: its ways joined into chains, less stray pieces.
export function riverChains(ways) {
  return assembleWayChains(ways).filter((chain) => chain.coordinates.length >= MIN_CHAIN_VERTICES);
}

// The ways a river's course uses, in relation member order: its main-stream ways, less the ones the
// build leaves out (the Jordan's course through the Sea of Galilee) and stray pieces.
export function riverCourseWays(relationFull, riverKey) {
  const river = OSM_RIVERS[riverKey];
  const ways = relationMainStreamWays(relationFull, { excludeWayIds: river.throughSeaOfGalileeWayId ? [river.throughSeaOfGalileeWayId] : [] });
  const used = new Set(riverChains(ways).flatMap((chain) => chain.wayIds));
  return ways.filter((way) => used.has(way.id));
}

// The pinned file holds one LineString feature per way, with the way's id and version, the ids of its
// two end nodes (where ways join) and provenance. `asOf` is the Overpass attic date it was read at.
export function waterwayFeatures(riverKey, ways, { asOf }) {
  const river = OSM_RIVERS[riverKey];
  return ways.map((way) => ({
    type: "Feature",
    properties: {
      river: riverKey,
      relationId: river.relationId,
      wayId: way.id,
      version: way.version,
      endNodeIds: [way.nodeIds[0], way.nodeIds.at(-1)],
      provenance: {
        dataset: "OpenStreetMap",
        version: `overpass-attic:${asOf}; way ${way.id} v${way.version}`,
        upstreamFeatureIds: [`osm:way/${way.id}`, `osm:relation/${river.relationId}`],
        changes: [
          {
            kind: "overpass-attic-download",
            detail: `A main-stream way of the ${river.label}'s waterway relation, as OpenStreetMap held it at ${asOf}, read through Overpass. © OpenStreetMap contributors, ODbL 1.0.`,
            sources: [`osm:relation/${river.relationId}`]
          }
        ]
      }
    },
    geometry: { type: "LineString", coordinates: way.coordinates }
  }));
}

// One feature per line, so that a refresh reads as a diff of the ways that changed.
export function serializeWaterways({ asOf, features }) {
  return `{"type":"FeatureCollection","asOf":${JSON.stringify(asOf)},"features":[\n${features.map((feature) => JSON.stringify(feature)).join(",\n")}\n]}\n`;
}

// A river as the build uses it, from the pinned FeatureCollection: its ways in file order and the
// chains they join into.
export function pinnedRiver(collection, riverKey) {
  const river = OSM_RIVERS[riverKey];
  const ways = (collection.features ?? [])
    .filter((feature) => feature.properties?.river === riverKey)
    .map((feature) => ({ id: feature.properties.wayId, version: feature.properties.version, nodeIds: feature.properties.endNodeIds, coordinates: feature.geometry.coordinates }));
  if (ways.length === 0) throw new Error(`The pinned waterways hold no ways for the ${river.label}`);
  return { ...river, key: riverKey, ways, chains: riverChains(ways), asOf: collection.asOf ?? null };
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
