import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseNotesMarkdown,
  summarizeFixtureManifest
} from "../scripts/pack-basemap-fixture.mjs";

test("release-notes template matches sign-off §14.3 text (minus NOTICE errata sentence)", () => {
  const manifest = {
    entries: [
      ...Array.from({ length: 1015 }, (_, index) => ({
        url: `https://tiles.openfreemap.org/planet/20261018_080001_pt/9/299/${index}.pbf`,
        status: 200
      })),
      {
        url: "https://tiles.openfreemap.org/planet",
        status: 200
      },
      ...Array.from({ length: 8 }, (_, index) => ({
        url: `https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/${index * 256}-${index * 256 + 255}.pbf`,
        status: 200
      })),
      { url: "https://tiles.openfreemap.org/sprites/ofm_f384/ofm.json", status: 200 },
      { url: "https://tiles.openfreemap.org/sprites/ofm_f384/ofm.png", status: 200 },
      ...Array.from({ length: 174 }, (_, index) => ({
        url: `https://tiles.versatiles.org/tiles/osm/9/299/${index}`,
        status: 200
      })),
      {
        url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/0-255.pbf",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/256-511.pbf",
        status: 200
      },
      {
        url: "https://tiles.versatiles.org/assets/glyphs/noto_sans_regular/512-767.pbf",
        status: 200
      },
      { url: "https://tiles.versatiles.org/assets/sprites/base.json", status: 200 },
      { url: "https://tiles.versatiles.org/assets/sprites/base.png", status: 200 },
      { url: "https://tiles.versatiles.org/assets/missing/font-8192-8447.pbf", status: 404 },
      { url: "https://tiles.versatiles.org/assets/missing/font-7680-7935.pbf", status: 404 },
      { url: "https://tiles.versatiles.org/assets/missing/sprite.png", status: 404 }
    ]
  };

  const summary = summarizeFixtureManifest(manifest);
  const markdown = buildReleaseNotesMarkdown({
    date: "2026-10-23",
    archiveName: "basemap-fixture-2026-10-23.tar",
    sha256: "08fb2d6b6d61b9afd3d66010d05872bb50d62f5f608cbe490a5afa450df0ef40",
    bytes: 79912960,
    files: 1213,
    planetVersion: "20261018_080001_pt",
    summary
  });

  const expected = `**Test fixture, not an app release.** This archive holds the basemap responses that the browser tests of Interactive Bible Map replay, so the tests don't depend on the network. It is not part of the app and is never deployed with it.

- File: \`basemap-fixture-2026-10-23.tar\` · SHA-256 \`08fb2d6b6d61b9afd3d66010d05872bb50d62f5f608cbe490a5afa450df0ef40\` · 79,912,960 bytes · 1,213 files
- Recorded: 2026-10-23. OpenFreeMap planet build: \`20261018_080001_pt\`.
- Contents: 1,208 responses. From OpenFreeMap: 1,015 vector tiles, the TileJSON, 8 glyph ranges and 2 sprite files. From VersaTiles: 174 vector tiles, 3 glyph ranges, 2 sprite files and 3 "not found" (404) replies.
- OpenFreeMap files: nothing was fetched from OpenFreeMap's public tile service (tiles.openfreemap.org). The vector tiles were read from OpenFreeMap's public planet download for that build (https://btrfs.openfreemap.com/areas/planet/20261018_080001_pt/tiles.pmtiles). This project's recorder built the TileJSON from the same file's metadata, with its attribution and layer list unchanged. The label glyphs come from maplibre/demotiles (https://github.com/maplibre/demotiles) and the \`ofm_f384\` sprite from hyperknot/openfreemap-styles (https://github.com/hyperknot/openfreemap-styles). They are the same files OpenFreeMap serves. This archive holds no relief tiles.
- VersaTiles files: recorded from https://tiles.versatiles.org.
- Apart from that TileJSON, each response body is stored unmodified, as received from the sources above, and compressed with gzip. \`manifest.json\` maps each URL to its file. \`NOTICE.md\` and the \`LICENSES/\` folder inside the archive give the full notices.

**Licences.** This archive is not covered by the repository's MIT licence or by the project's CC BY-SA 4.0 data licence. Each part keeps its own licence:

- **OpenStreetMap data (all vector tiles):** Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). The tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish, and this archive holds the whole extract. The full tilesets: [OpenFreeMap planet downloads](https://btrfs.openfreemap.com/files.txt) and [VersaTiles downloads](https://download.versatiles.org/).
- **OpenFreeMap tiles and TileJSON:** [OpenFreeMap](https://openfreemap.org) [© OpenMapTiles](https://www.openmaptiles.org/) Data from [OpenStreetMap](https://www.openstreetmap.org/copyright). OpenMapTiles schema © MapTiler.com & OpenMapTiles contributors: design [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), code [BSD 3-Clause](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). Low-zoom data from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- **VersaTiles tiles:** [VersaTiles](https://versatiles.org) © OpenStreetMap contributors (ODbL 1.0), in the [Shortbread](https://shortbread-tiles.org/) schema (CC0 1.0). Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), through VersaTiles' [Landcover Vectors](https://github.com/versatiles-org/landcover-vectors) (CC BY 4.0). Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221
- **Label glyphs:** Noto Sans, under the [SIL Open Font License 1.1](https://openfontlicense.org/). The copyright notices and the licence text are in \`LICENSES/OFL-1.1-Noto-Sans.txt\`.
- **Icons:** OpenFreeMap's \`ofm_f384\` sprite ([openfreemap-styles](https://github.com/hyperknot/openfreemap-styles), MIT; icons from the Liberty and OSM Bright styles, BSD 3-Clause and CC BY 3.0/4.0; [Maki](https://github.com/mapbox/maki), CC0 1.0). Full notices are in \`LICENSES/OpenFreeMap-sprite.txt\`. VersaTiles' \`base\` sprite ([versatiles-style](https://github.com/versatiles-org/versatiles-style)), CC0 1.0.

The licensors provide this material as is, without warranty. See each licence.
`;

  assert.equal(markdown, expected);
  assert.doesNotMatch(markdown, /assets\.openfreemap\.com/u);
  assert.doesNotMatch(markdown, /stored as received/u);
});
