import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseNotesMarkdown,
  summarizeFixtureManifest
} from "../scripts/pack-basemap-fixture.mjs";

test("release-notes template uses corrected wording and key licence lines", () => {
  const manifest = {
    entries: [
      {
        url: "https://tiles.openfreemap.org/planet/20261018_080001_pt/9/299/197.pbf",
        status: 200
      },
      {
        url: "https://tiles.openfreemap.org/planet",
        status: 200
      },
      {
        url: "https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf",
        status: 200
      },
      {
        url: "https://tiles.openfreemap.org/sprites/ofm_f384/ofm.json",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/tiles/osm/9/299/197",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/0-255.pbf",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/assets/sprites/base.json",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/8192-8447.pbf",
        status: 404
      }
    ]
  };
  const summary = summarizeFixtureManifest(manifest);
  const markdown = buildReleaseNotesMarkdown({
    date: "2026-10-23",
    tag: "test-fixture-basemap-2026-10-23",
    archiveName: "basemap-fixture-2026-10-23.tar",
    sha256: "abc123",
    bytes: 12345,
    files: 99,
    planetVersion: "20261018_080001_pt",
    summary
  });

  assert.match(markdown, /SHA-256 `abc123`/u);
  assert.match(markdown, /OpenStreetMap data \(all vector tiles\)/u);
  assert.match(markdown, /OpenFreeMap files: nothing was fetched from OpenFreeMap's public tile service/u);
  assert.match(markdown, /Apart from that TileJSON, each response body is stored unmodified/u);
  assert.match(markdown, /From OpenFreeMap: 1 vector tile, the TileJSON, 1 glyph range, 1 sprite file\./u);
  assert.match(markdown, /From VersaTiles: 1 vector tile, 2 glyph ranges, 1 sprite file and 1 "not found" \(404\) reply\./u);

  assert.doesNotMatch(markdown, /assets\.openfreemap\.com/u);
  assert.doesNotMatch(markdown, /stored as received/u);
});
