import test from "node:test";
import assert from "node:assert/strict";
import { decideReplayRequestPolicy } from "./browser/network-policy.mjs";

test("missing vector tiles return empty 204 policy", () => {
  const openFreeMapDecision = decideReplayRequestPolicy({
    url: "https://tiles.openfreemap.org/planet/20261018_080001_pt/9/299/197.pbf",
    hasFixtureEntry: false
  });
  assert.equal(openFreeMapDecision.type, "missing-vector-tile");
  assert.equal(openFreeMapDecision.status, 204);

  const versaTilesDecision = decideReplayRequestPolicy({
    url: "https://tiles.versatiles.org/tiles/osm/9/299/197",
    hasFixtureEntry: false
  });
  assert.equal(versaTilesDecision.type, "missing-vector-tile");
  assert.equal(versaTilesDecision.status, 204);
});

test("missing raster relief tiles return transparent PNG policy", () => {
  const decision = decideReplayRequestPolicy({
    url: "https://tiles.openfreemap.org/natural_earth/ne2sr/4/5/7.png",
    hasFixtureEntry: false
  });
  assert.equal(decision.type, "missing-raster-relief-tile");
  assert.equal(decision.status, 200);
});

test("missing glyph ranges are lenient", () => {
  const openFreeMapGlyphDecision = decideReplayRequestPolicy({
    url: "https://tiles.openfreemap.org/fonts/Noto%20Sans%20Italic/8192-8447.pbf",
    hasFixtureEntry: false
  });
  assert.equal(openFreeMapGlyphDecision.type, "missing-glyph");
  assert.equal(openFreeMapGlyphDecision.status, 200);

  const versaTilesGlyphDecision = decideReplayRequestPolicy({
    url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/8192-8447.pbf",
    hasFixtureEntry: false
  });
  assert.equal(versaTilesGlyphDecision.type, "missing-glyph");
  assert.equal(versaTilesGlyphDecision.status, 200);
});

test("missing deterministic non-tile basemap assets stay strict failures", () => {
  for (const url of [
    "https://tiles.openfreemap.org/planet",
    "https://tiles.openfreemap.org/sprites/ofm_f384/ofm.json"
  ]) {
    const decision = decideReplayRequestPolicy({
      url,
      hasFixtureEntry: false
    });
    assert.equal(decision.type, "missing-strict-basemap");
  }
});

test("non-basemap hosts are blocked and Wikimedia is placeholder", () => {
  const blocked = decideReplayRequestPolicy({
    url: "https://example.com/anything",
    hasFixtureEntry: false
  });
  assert.equal(blocked.type, "blocked-external");

  const wikimedia = decideReplayRequestPolicy({
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/example.jpg",
    hasFixtureEntry: false
  });
  assert.equal(wikimedia.type, "wikimedia-placeholder");
});
