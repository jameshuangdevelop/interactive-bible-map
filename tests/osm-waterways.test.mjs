import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  assembleWayChains,
  distanceKm,
  extendLineEnd,
  fetchOsmRelationFull,
  orientFrom,
  OVERPASS_ENDPOINTS,
  overpassRelationQuery,
  relationMainStreamWays
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

test("fetchOsmRelationFull asks Overpass for the relation and reuses the cached response", async () => {
  const cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "osm-cache-test-"));
  try {
    const requests = [];
    const fetchImpl = async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => relationFull };
    };
    const first = await fetchOsmRelationFull(9, cacheDirectory, { fetchImpl });
    const second = await fetchOsmRelationFull(9, cacheDirectory, { fetchImpl });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, OVERPASS_ENDPOINTS[0]);
    assert.equal(requests[0].options.method, "POST");
    assert.equal(decodeURIComponent(requests[0].options.body), `data=${overpassRelationQuery(9)}`);
    assert.match(overpassRelationQuery(9), /relation\(9\);\(\._;>;\);out meta;/);
    assert.deepEqual(second, first);
  } finally {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  }
});

test("fetchOsmRelationFull tries the next Overpass mirror when one fails", async () => {
  const cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "osm-cache-test-"));
  try {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(url);
      return urls.length === 1
        ? { ok: false, status: 504, statusText: "Gateway Timeout" }
        : { ok: true, json: async () => relationFull };
    };
    const data = await fetchOsmRelationFull(9, cacheDirectory, { fetchImpl, endpoints: ["https://a.example/api", "https://b.example/api"] });
    assert.deepEqual(urls, ["https://a.example/api", "https://b.example/api"]);
    assert.equal(data.elements.at(-1).id, 9);
  } finally {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  }
});

test("fetchOsmRelationFull reports a failed request", async () => {
  const cacheDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "osm-cache-test-"));
  try {
    const fetchImpl = async () => ({ ok: false, status: 504, statusText: "Gateway Timeout" });
    await assert.rejects(fetchOsmRelationFull(9, cacheDirectory, { fetchImpl, retryDelayMs: 0 }), /504 Gateway Timeout/);
    const wrongRelation = async () => ({ ok: true, json: async () => ({ elements: [{ type: "relation", id: 10, members: [] }] }) });
    await assert.rejects(fetchOsmRelationFull(9, cacheDirectory, { fetchImpl: wrongRelation, retryDelayMs: 0 }), /holds no relation 9/);
  } finally {
    await fs.rm(cacheDirectory, { recursive: true, force: true });
  }
});
