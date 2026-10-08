# M4-04 verification: notices for the modern basemap

**Verifier:** fact-checker (Claude Opus 5.5, Copilot CLI subagent) · **Date:** 2026-10-08 · **Branch:** `feat/m4-modern-map`, from `d7927ec`

**Scope:** the licenses behind the modern map (card M4-04, Fact-Checker phase), the "modified" notices in both modern styles, the attribution shown on each map, the "Sources & credits" text, and the neutrality wording, checked against ADR-0037 ("borders on the modern map", items 1–6; item 6 is `edf826f` on `docs/m4-kickoff`, not yet merged into this branch), ADR-0009, ADR-0022 and ADR-0033. The resulting strings are in [`docs/LICENSES.md` → Basemap](../LICENSES.md#basemap-m3-07) and [`ATTRIBUTION.md`](../../ATTRIBUTION.md).

**Method:** every license was read at its source on 2026-10-08 (UTC). To check what the build draws, I matched each segment of the three pinned Natural Earth files, and of the built `modern-neutral-boundaries.geojson`, to the countries on either side, and ran OpenFreeMap tiles (build `20261004_113936_pt`) through the modern style's own `boundary_2` and `label_other` filters with `@maplibre/maplibre-gl-style-spec`. I then ran the exported app (`npm run export:web`, Chromium through Playwright) and read the attribution control and `queryRenderedFeatures` on both modern maps.

## 1. Licenses, read at the source

| Source | What it says | Result |
|---|---|---|
| openfreemap-styles [`LICENSE.md`](https://github.com/hyperknot/openfreemap-styles/blob/main/LICENSE.md) | MIT, Copyright (c) 2023 Zsolt Ero. Liberty is a fork of OSM Liberty, a fork of OSM Bright, derived from Mapbox Open Styles. "Natural Earth map data is in the public domain." | Pass; as recorded in M3-07 |
| Liberty [`styles/liberty/LICENSE.md`](https://github.com/hyperknot/openfreemap-styles/blob/main/styles/liberty/LICENSE.md) | Code keeps Mapbox's BSD license. Design derived from OSM Bright (CC BY 3.0) and displays OpenMapTiles (CC BY 4.0). A browsable map must credit "© OpenMapTiles" with a link, in the corner of the map. | Pass |
| OSM Bright [`styles/bright/LICENSE.md`](https://github.com/hyperknot/openfreemap-styles/blob/main/styles/bright/LICENSE.md) | BSD 3-Clause, Copyright (c) 2016 KlokanTech.com & OpenMapTiles contributors and (c) 2014 Mapbox. Design CC BY 4.0; the design credit "should be reasonably accessible from maps based on this style". | Pass |
| Mapbox Open Styles [`LICENSE.md`](https://github.com/mapbox/mapbox-gl-styles/blob/master/LICENSE.md) | BSD, copyright (c) 2014 Mapbox. Design CC BY 3.0, attribution "reasonably accessable" from the map. | Pass |
| OpenMapTiles [`LICENSE.md`](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md) | BSD 3-Clause, Copyright (c) 2024 MapTiler.com & OpenMapTiles contributors. Design CC BY 4.0. Visible "OpenMapTiles" credit with a link, in the map's corner. | Pass |
| OpenFreeMap [TileJSON](https://tiles.openfreemap.org/planet) and [Terms of Service](https://openfreemap.org/tos/) | The TileJSON `attribution` is exactly our control string (`docs/LICENSES.md`, main string 1). The ToS ("Last Updated: September 9, 2026") is unchanged from M3-07. | Pass |
| [OpenStreetMap copyright](https://www.openstreetmap.org/copyright) | Credit OpenStreetMap and make clear the data is under the ODbL; linking to this page does the second. | Pass |
| VersaTiles Colorful ([style](https://tiles.versatiles.org/assets/styles/colorful/style.json), [`versatiles-style`](https://github.com/versatiles-org/versatiles-style)) | The published style's `metadata.license` is CC0 1.0. The repository that generates it says "Source Code: MIT" (Copyright (c) 2023-2026 yetzt, Michael Kreil) and "Iconsets and Rendered Spritemaps: CC0 1.0". We copy only the published style. | Pass. M3-07 recorded CC0 only; `ATTRIBUTION.md` now notes the MIT generator code. |
| Natural Earth [terms of use](https://www.naturalearthdata.com/about/terms-of-use/) and [`LICENSE.md`](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/LICENSE.md) at v5.1.2 | "All versions of Natural Earth raster + vector map data … are in the public domain." "No permission is needed to use Natural Earth. Crediting the authors is unnecessary." The Washington Post and JRC grants on the same page bind Natural Earth only, not its users. | Pass |
| The three Natural Earth files the build pins | `ne_50m_admin_0_boundary_lines_land` `2faac4f6…fa48`, `ne_50m_admin_0_countries` `3e458fc0…fdeb`, `ne_10m_admin_0_disputed_areas` `9cafef8b…50f5`: SHA-256 of today's download equals each pin. | Pass |

All of these are compatible with the project: the code stays MIT, the basemaps are display layers, and the Natural Earth lines are public domain.

## 2. The notices against those licenses

| Check | Result |
|---|---|
| "Modified" notice (CC BY 4.0 §3(a)(1)(B), CC BY 3.0 §4(b)): each modern copy says it is modified and lists the changes, in its `metadata`, in `LICENSE.txt` part (a) (Liberty) or `NOTICE.txt` (VersaTiles), and in "Sources & credits". | Pass after this change. The drawer described only the ancient copy, and the FE's draft notices used team terms. |
| Copyright notices, conditions and disclaimers kept (BSD 3-Clause, MIT): `liberty-modern/LICENSE.txt` parts (b)–(e) are byte-identical to the four upstream files read today, and part (a) equals the style's `metadata`. The same holds for `liberty/LICENSE.txt`. | Pass |
| Attribution on the map: OpenMapTiles and OpenStreetMap credits visible in the corner, linked; Natural Earth credited as a courtesy while its lines are drawn. | Pass (§3) |
| No implied endorsement (BSD clause 3, CC BY 3.0 §4(b)): the names say "modified from". | Pass |
| ODbL: the masks and country-pair exclusions are style filters, and no tile data is changed. `app/public/styles/shared/` holds only Natural Earth geometry, with no OpenStreetMap data. | Pass; ruling added to `docs/LICENSES.md` |

## 3. Strings in the built styles and the running app

`npm run build:basemap-styles` changed only the four notice lines (both modern `style.json` files, `liberty-modern/LICENSE.txt` part (a) and `versatiles-colorful-modern/NOTICE.txt`); every layer and the shared GeoJSON stayed byte-identical. In the exported app:

| Map | Attribution control text | Result |
|---|---|---|
| Ancient, main | OpenFreeMap © OpenMapTiles Data from OpenStreetMap | Pass |
| Modern, main, zoom 4.5 and 4.7 | Natural Earth \| OpenFreeMap © OpenMapTiles Data from OpenStreetMap | Pass |
| Modern, main, zoom 6 | OpenFreeMap © OpenMapTiles Data from OpenStreetMap | Pass (no Natural Earth line is drawn there) |
| Ancient, backup | VersaTiles © OpenStreetMap contributors · © ESA WorldCover 2021 (CC BY 4.0) | Pass |
| Modern, backup, zoom 4.5 and 4.7 | Natural Earth \| VersaTiles © OpenStreetMap contributors · © ESA WorldCover 2021 (CC BY 4.0) | Pass |
| Modern, backup, zoom 8 | VersaTiles © OpenStreetMap contributors · © ESA WorldCover 2021 (CC BY 4.0) | Pass for the credit, which follows what is drawn; see N4 for the missing borders |

The "Sources & credits" Markdown equals the LICENSES.md drawer blocks, and the "Upstream sources" list equals `ATTRIBUTION.md`'s table (`app/__tests__/sources-credits-content-test.ts`). `verify:web:playwright` also compares the rendered drawer with LICENSES.md (§6).

## 4. Neutrality wording (ADR-0033, ADR-0037)
- The FE's draft used team terms ("admin-0", "neutrality masks", "shared adm0 pair exclusions", "z5+", "name:latin", "sovereignty claim"), named the Natural Earth row "admin-0 boundary lines and contested-area polygons", and said "Kosovo's borders" and "Western Sahara's borders" where ADR-0037 says "around". All are replaced with plain words.
- Every notice now lists ADR-0037 item 6's places in its order and words: around Israel, the West Bank, Gaza and the Golan Heights, around Kosovo or Western Sahara, along the whole border between Russia and Georgia, along the border between Armenia and Azerbaijan, and across Cyprus. One constant in `scripts/build-basemap-styles.mjs` holds the sentence for both styles.
- Each says: "Leaving these lines out keeps the map neutral; it is not a claim about where these borders run or who governs these places." It takes no side and names no one's claim. **Pass.**

## 5. Does the build match the notices?

| ADR-0037 item 6 place | Below zoom 5 and backup (Natural Earth; no segment of these pairs is left in the built GeoJSON) | Main, zoom 5 and up (tiles) | Result |
|---|---|---|---|
| Israel, the West Bank, Gaza and the Golan Heights | No line | No line: every feature with Israel, Jordan–West Bank or Egypt–Gaza inside the box is filtered out (tiles 5/19/12 and 5/19/13; app at zoom 6) | Pass |
| Kosovo | No line | No line (`XKK` features filtered, tile 5/17/11) | Pass |
| Western Sahara | No line | No line (tile 5/14/13) | Pass |
| Russia and Georgia | No line (NE id 1746705547) | No line (`RUS`/`GEO` pair) | Pass |
| Armenia and Azerbaijan | No line (NE ids 1746705689, 1746705697) | **Three exclave outlines drawn** (N2) | **Fail** |
| Across Cyprus | No line | No line across the island; the British bases' outline is drawn (low 2) | Pass |

**Needs change (Frontend Engineer), before the notices can be called right:**
- **N1 (high): state and province names are shown from zoom 8.** The upstream `label_other` filter is a `match` that hides the classes it lists (`state` among them). The build removed `state` from that list, which makes the layer show states, and `province` was never in it. In the app at zoom 8.5 it renders "Republic of Crimea", one side's name for Crimea and the case ADR-0037 item 5 gives, plus "Hatay", and "Latakia", "Idlib" and "Hama Governorate". The fix is to add `province` to the list and keep `state` in it. The test `assertNoStateOrProvincePlaceClassLayers` passes because it only checks that the filter text doesn't contain those words.
- **N2 (medium): three Azerbaijani exclaves inside Armenia keep their outlines on the main modern map,** near 45.01°E 41.07°N and 44.95°E 39.79°N from zoom 5, and near 45.20°E 41.00°N at higher zooms (tiles 5/19/11, 5/19/12 and 9/320/191; rendered at zoom 10 in the app). The tiles give the Azerbaijani side no code (`adm0_l` is empty), so the `ARM`/`AZE` pair rule misses them.
- **N3 (medium; PO decision): the Transnistria box removes about 309 km of the Moldova–Ukraine border below zoom 5 and on the backup, while the main map draws it from zoom 5.** It isn't in item 6, it changes with zoom, and with no line there Transnistria looks joined to Ukraine. Item 3 calls for a mask only where the data draws an unflagged line, and none of the data used draws one around Transnistria. Either the FE removes this box (and the Crimea, Abkhazia, South Ossetia and Nagorno-Karabakh boxes, which in the data I checked remove nothing that the pair rules and disputed flags don't already hide), or the PO adds the place to item 6 and the notices.
- **N4 (medium): the modern backup reached by the outage switch draws no country borders from zoom 5.** Both modern styles use the layer id `ibm-modern-neutral-boundary`; when `setStyle` diffs the main style into the backup, MapLibre keeps the main layer's `maxzoom: 5`, because the backup's layer has no `maxzoom` to set. The app showed `maxzoom: 5` on the backup's layer at zoom 8. The notices and spec §2 say the backup's borders come from Natural Earth at every zoom. A distinct layer id, or an explicit `maxzoom` on the backup's layer, would fix it.

**Low, for the reviewer:**
1. The Natural Earth half of the country-pair rule never matches, because the 1:50m lines carry no `ADM0_A3_L`/`ADM0_A3_R` fields. Only the three NE ids and the boxes do that work, and the parity test on side codes passes without testing anything. Likewise the tiles carry no `PSE`, `ESH` or `XNC` codes, so the `ISR`/`PSE`, `MAR`/`ESH` and `CYP`/`XNC` pair rules never match; the boxes cover those places.
2. The outline of the British bases on Cyprus is drawn at zoom 5, where Dhekelia is merged with Akrotiri outside the box. From zoom 8 the part east of 33.75°E is hidden.
3. Below zoom 5 only, the bounding boxes also cut short stretches of other borders near the listed places, in kilometres: Montenegro–Serbia 46, North Macedonia–Serbia 26, Albania–North Macedonia 19 and Albania–Montenegro 11 near Kosovo; Algeria–Mauritania 22 near Western Sahara; Jordan–Syria 18 and Lebanon–Syria 13 at the Golan. From zoom 5 the main map draws them in full. They fall within "around" the listed places.
4. Not investigated: in both evidence screenshots, taken after a programmatic `jumpTo` to zoom 8.5 and 10, the scale bar still read "500 km", its value at the opening zoom.

## 6. Commands
`npm run lint`, `npm run typecheck`, `npm test` (176 passed), `npm run test:app` (18 suites, 142 tests passed), `npm run build:data`, `npm run build:basemap-styles` and `npm run export:web` all pass. `npm run verify:web:playwright` passes: the rendered "Sources & credits" text equals the LICENSES.md blocks, and its own attribution scenarios match §3 ("Natural Earth | OpenFreeMap …" at `/?map=modern`, without Natural Earth at `/?map=modern&place=galilee`). Evidence screenshots: `%TEMP%\ibm-fc-m4-04\modern-z8.5-crimea.png` (N1) and `modern-z10-armenia-exclave.png` (N2).

## 7. Verdict
- **Licensing:** pass. Every license is confirmed at its source and compatible.
- **Strings:** updated and pass: `docs/LICENSES.md` (Basemap section), `ATTRIBUTION.md`, the modern styles' notices and the app's credits.
- **Neutrality wording:** pass.
- **Build against the notices:** needs change (N1–N4). The notices describe ADR-0037's design and become accurate once N1, N2 and N4 are fixed and the PO rules on N3. The PR shouldn't merge before then.
