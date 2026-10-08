import test from "node:test";
import assert from "node:assert/strict";

import {
  EXCLUDED_POST_AD100_ROADS,
  MINOR_ROAD_NEAR_PLACE_KM,
  isRomanPeriod,
  roadNearPoints,
  selectAncientRoads
} from "../scripts/lib/ancient-roads.mjs";

const road = (objectId, { major, known = "1", timeperiod = "R", coordinates }) => ({
  type: "Feature",
  properties: { OBJECTID: objectId, Major_or_M: major ? "1" : "0", Known_or_a: known, timeperiod },
  geometry: { type: "MultiLineString", coordinates: [coordinates] }
});

const select = (features, placePoints = []) =>
  selectAncientRoads({ type: "FeatureCollection", features }, { placePoints, awmcCommit: "abc123", awmcRoadsPath: "Cultural-Data/roads/roads.geojson" });

test("isRomanPeriod reads Barrington period codes", () => {
  assert.equal(isRomanPeriod("R"), true);
  assert.equal(isRomanPeriod("HRL"), true);
  assert.equal(isRomanPeriod("RL?"), true);
  assert.equal(isRomanPeriod("L"), false);
  assert.equal(isRomanPeriod(null), false);
});

test("selectAncientRoads keeps major roads of the Roman period inside the map's extent", () => {
  const { roads } = select([
    road(10, { major: true, coordinates: [[20, 40], [21, 40]] }),
    road(11, { major: true, timeperiod: "L", coordinates: [[20, 40], [21, 40]] }),
    road(12, { major: true, coordinates: [[-5, 50], [-4, 50]] })
  ]);
  assert.deepEqual(roads.features.map((feature) => feature.properties.roadId), ["awmc-road-10-1"]);
  const [kept] = roads.features;
  assert.equal(kept.properties.major, true);
  assert.equal(kept.properties.known, true);
  assert.equal(kept.properties.timeperiod, "R");
  assert.deepEqual(kept.properties.provenance.upstreamFeatureIds, ["awmc:roads-objectid-10", "awmc:roads-feature-1"]);
  assert.deepEqual(kept.properties.provenance.changes.map((change) => change.kind), ["filter", "date-exclusions"]);
});

test("selectAncientRoads keeps minor roads only near one of our places", () => {
  const place = [27.34, 37.94];
  const { roads } = select([
    road(20, { major: false, known: "0", coordinates: [[27.3, 38.0], [27.5, 38.2]] }),
    road(21, { major: false, coordinates: [[30.0, 40.0], [30.5, 40.2]] })
  ], [place]);
  assert.deepEqual(roads.features.map((feature) => feature.properties.roadId), ["awmc-road-20-1"]);
  assert.equal(roads.features[0].properties.major, false);
  assert.equal(roads.features[0].properties.known, false);
  assert.match(roads.features[0].properties.provenance.changes[0].detail, new RegExp(`within ${MINOR_ROAD_NEAR_PLACE_KM} km`));
});

test("selectAncientRoads leaves out the roads dated after AD 100 and names them in each road's provenance", () => {
  const excludedIds = EXCLUDED_POST_AD100_ROADS.map((entry) => entry.objectId);
  const { roads, excludedRoadIds } = select([
    road(excludedIds[0], { major: true, coordinates: [[21, 44], [22, 44.5]] }),
    road(30, { major: true, coordinates: [[21, 42], [22, 42]] })
  ]);
  assert.deepEqual(excludedRoadIds, [`awmc-road-${excludedIds[0]}-1`]);
  assert.deepEqual(roads.features.map((feature) => feature.properties.roadId), ["awmc-road-30-2"]);
  const dateChange = roads.features[0].properties.provenance.changes.find((change) => change.kind === "date-exclusions");
  for (const objectId of excludedIds) assert.match(dateChange.detail, new RegExp(`\\b${objectId}\\b`));
  assert.ok(dateChange.sources.includes("bib:livius-trajan"));
  assert.ok(dateChange.sources.every((source) => /^(bib|pleiades):/.test(source)));
});

test("roadNearPoints measures the distance to each stretch of the road", () => {
  const geometry = { type: "LineString", coordinates: [[35.0, 32.0], [36.0, 32.0]] };
  assert.equal(roadNearPoints(geometry, [[35.5, 32.4]], 50), true);
  assert.equal(roadNearPoints(geometry, [[35.5, 32.6]], 50), false);
  assert.equal(roadNearPoints(geometry, [], 50), false);
});
