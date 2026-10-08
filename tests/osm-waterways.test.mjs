import test from "node:test";
import assert from "node:assert/strict";

import {
  assembleWayChains,
  distanceKm,
  extendLineEnd,
  fetchOsmRelationFull,
  MIN_CHAIN_VERTICES,
  orientFrom,
  OVERPASS_ENDPOINTS,
  overpassRelationQuery,
  pinnedRiver,
  relationMainStreamWays,
  riverChains,
  riverCourseWays,
  serializeWaterways,
  waterwayFeatures
} from "../scripts/lib/osm-waterways.mjs";

// A small relation in the Overpass (and OSM API "full") format: three main-stream ways (one drawn
// backwards), a tributary and a way that runs through a lake.
const relationFull = {
  elements: [
    { type: "node", id: 1, lon: 35.62, lat: 33.2 },
    { type: "node", id: 2, lon: 35.62, lat: 33.0 },
    { type: "node", id: 3, lon: 35.62, lat: 32.9 },
    { type: "node", id: 4, lon: 35.58, lat: 32.71 },
    { type: "node", id: 5, lon: 35.57, lat: 32.5 },
    { type: "node", id: 6, lon: 35.7, lat: 33.0 },
    { type: "way", id: 101, version: 3, nodes: [1, 2] },
    { type: "way", id: 102, version: 1, nodes: [3, 2] },
    { type: "way", id: 103, version: 7, nodes: [3, 4] },
    { type: "way", id: 104, version: 2, nodes: [4, 5] },
    { type: "way", id: 105, version: 1, nodes: [6, 2] },
    {
      type: "relation",
      id: 9,
      members: [
        { type: "way", ref: 101, role: "main_stream" },
        { type: "way", ref: 102, role: "main_stream" },
        { type: "way", ref: 103, role: "main_stream" },
        { type: "way", ref: 104, role: "main_stream" },
        { type: "way", ref: 105, role: "side_stream" }
      ]
    }
  ]
};

test("relationMainStreamWays returns main-stream ways with coordinates and can leave ways out", () => {
  const ways = relationMainStreamWays(relationFull, { excludeWayIds: [103] });
  assert.deepEqual(ways.map((way) => way.id), [101, 102, 104]);
  assert.deepEqual(ways[1].coordinates, [[35.62, 32.9], [35.62, 33.0]]);
  assert.equal(ways[0].version, 3);
});

test("assembleWayChains joins ways at shared nodes, reversing where needed", () => {
  const chains = assembleWayChains(relationMainStreamWays(relationFull));
  assert.equal(chains.length, 1);
  assert.deepEqual(chains[0].nodeIds, [1, 2, 3, 4, 5]);
  assert.deepEqual(chains[0].wayIds, [101, 102, 103, 104]);
});

test("assembleWayChains keeps separate chains when a way is left out", () => {
  const chains = assembleWayChains(relationMainStreamWays(relationFull, { excludeWayIds: [103] }));
  assert.equal(chains.length, 2);
  assert.deepEqual(chains.map((chain) => chain.wayIds.length).sort(), [1, 2]);
});

test("orientFrom starts the line at the end nearer the given point", () => {
  const line = [[35.57, 32.5], [35.62, 33.2]];
  assert.deepEqual(orientFrom(line, [35.65, 33.35])[0], [35.62, 33.2]);
  assert.deepEqual(orientFrom(line, [35.5, 32.4])[0], [35.57, 32.5]);
});

test("extendLineEnd extends a fixed length along the direction of the line's end", () => {
  const line = [[34.0, 36.6], [34.1, 36.6], [34.2, 36.6]];
  const { coordinates, added, lengthKm } = extendLineEnd(line, { atEnd: true, baseKm: 3, lengthKm: 5 });
  assert.equal(coordinates.length, 4);
  assert.equal(lengthKm, 5);
  assert.ok(Math.abs(distanceKm(line.at(-1), added) - 5) < 0.05);
  assert.ok(Math.abs(added[1] - 36.6) < 1e-9);
  assert.ok(added[0] > 34.2);
});

test("extendLineEnd can extend the start of a line until it passes a latitude", () => {
  const line = [[33.82, 36.98], [33.83, 36.95], [33.85, 36.9]];
  const { coordinates, added } = extendLineEnd(line, { atEnd: false, baseKm: 3, untilLatitude: 37.55 });
  assert.deepEqual(coordinates[0], added);
  assert.ok(Math.abs(added[1] - 37.55) < 1e-9);
  assert.ok(added[0] < 33.82);
});

test("extendLineEnd refuses to extend away from the requested latitude", () => {
  const line = [[33.85, 36.9], [33.83, 36.95], [33.82, 36.98]];
  assert.throws(() => extendLineEnd(line, { atEnd: false, baseKm: 3, untilLatitude: 37.55 }), /does not point towards latitude/);
});

test("fetchOsmRelationFull asks Overpass for the relation, at an attic date when given", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ ...relationFull, osm3s: { timestamp_osm_base: "2026-10-08T13:00:00Z" } }) };
  };
  const data = await fetchOsmRelationFull(9, { date: "2026-10-08T00:00:00Z", fetchImpl });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, OVERPASS_ENDPOINTS[0]);
  assert.equal(requests[0].options.method, "POST");
  assert.equal(decodeURIComponent(requests[0].options.body), `data=${overpassRelationQuery(9, { date: "2026-10-08T00:00:00Z" })}`);
  assert.match(overpassRelationQuery(9, { date: "2026-10-08T00:00:00Z" }), /\[date:"2026-10-08T00:00:00Z"\];relation\(9\);\(\._;>;\);out meta;/);
  assert.doesNotMatch(overpassRelationQuery(9), /date:/);
  assert.equal(data.elements.at(-1).id, 9);
});

test("fetchOsmRelationFull tries the next Overpass mirror when one fails", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    return urls.length === 1
      ? { ok: false, status: 504, statusText: "Gateway Timeout" }
      : { ok: true, json: async () => relationFull };
  };
  const data = await fetchOsmRelationFull(9, { fetchImpl, endpoints: ["https://a.example/api", "https://b.example/api"] });
  assert.deepEqual(urls, ["https://a.example/api", "https://b.example/api"]);
  assert.equal(data.elements.at(-1).id, 9);
});

test("fetchOsmRelationFull skips a mirror whose data is older than the attic date", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(url);
    const base = urls.length === 1 ? "2026-07-28T02:16:18Z" : "2026-10-08T13:00:00Z";
    return { ok: true, json: async () => ({ ...relationFull, osm3s: { timestamp_osm_base: base } }) };
  };
  const data = await fetchOsmRelationFull(9, { date: "2026-10-08T00:00:00Z", fetchImpl, endpoints: ["https://stale.example/api", "https://fresh.example/api"] });
  assert.deepEqual(urls, ["https://stale.example/api", "https://fresh.example/api"]);
  assert.equal(data.osm3s.timestamp_osm_base, "2026-10-08T13:00:00Z");
});

test("fetchOsmRelationFull reports a failed request", async () => {
  const fetchImpl = async () => ({ ok: false, status: 504, statusText: "Gateway Timeout" });
  await assert.rejects(fetchOsmRelationFull(9, { fetchImpl, retryDelayMs: 0 }), /504 Gateway Timeout/);
  const wrongRelation = async () => ({ ok: true, json: async () => ({ elements: [{ type: "relation", id: 10, members: [] }] }) });
  await assert.rejects(fetchOsmRelationFull(9, { fetchImpl: wrongRelation, retryDelayMs: 0 }), /holds no relation 9/);
});

// A river long enough to keep: main-stream ways of 6, 7 and 4 nodes (the second drawn backwards), a
// stray two-node main-stream piece and a side stream.
function longRelation() {
  const nodes = [];
  for (let id = 1; id <= 15; id += 1) nodes.push({ type: "node", id, lon: 34 + id * 0.01, lat: 36.5 + id * 0.01 });
  nodes.push({ type: "node", id: 100, lon: 33, lat: 37 }, { type: "node", id: 101, lon: 33.01, lat: 37.01 });
  return {
    elements: [
      ...nodes,
      { type: "way", id: 201, version: 3, nodes: [1, 2, 3, 4, 5, 6] },
      { type: "way", id: 202, version: 1, nodes: [12, 11, 10, 9, 8, 7, 6] },
      { type: "way", id: 203, version: 5, nodes: [12, 13, 14, 15] },
      { type: "way", id: 204, version: 2, nodes: [100, 101] },
      { type: "way", id: 205, version: 1, nodes: [3, 100] },
      {
        type: "relation",
        id: 15952690,
        members: [
          { type: "way", ref: 201, role: "main_stream" },
          { type: "way", ref: 204, role: "main_stream" },
          { type: "way", ref: 202, role: "main_stream" },
          { type: "way", ref: 203, role: "main_stream" },
          { type: "way", ref: 205, role: "side_stream" }
        ]
      }
    ]
  };
}

test("riverCourseWays keeps the main-stream ways of the course in member order and drops stray pieces", () => {
  const ways = riverCourseWays(longRelation(), "lamus");
  assert.deepEqual(ways.map((way) => way.id), [201, 202, 203]);
  assert.ok(riverChains(ways)[0].coordinates.length >= MIN_CHAIN_VERTICES);
});

test("the pinned file gives back the same ways, versions and chains as the relation", () => {
  const relation = longRelation();
  const ways = riverCourseWays(relation, "lamus");
  const features = waterwayFeatures("lamus", ways, { asOf: "2026-10-08T00:00:00Z" });
  assert.deepEqual(features[1].properties.endNodeIds, [12, 6]);
  assert.deepEqual(features[0].properties.provenance.upstreamFeatureIds, ["osm:way/201", "osm:relation/15952690"]);
  const text = serializeWaterways({ asOf: "2026-10-08T00:00:00Z", features });
  assert.equal(text.split("\n").filter((line) => line.startsWith('{"type":"Feature"')).length, 3);
  const river = pinnedRiver(JSON.parse(text), "lamus");
  assert.equal(river.asOf, "2026-10-08T00:00:00Z");
  assert.deepEqual(river.ways.map((way) => [way.id, way.version]), [[201, 3], [202, 1], [203, 5]]);
  const fromRelation = riverChains(relationMainStreamWays(relation));
  assert.deepEqual(river.chains.map((chain) => [chain.wayIds, chain.coordinates]), fromRelation.map((chain) => [chain.wayIds, chain.coordinates]));
  assert.throws(() => pinnedRiver(JSON.parse(text), "jordan"), /no ways for the Jordan/);
});
