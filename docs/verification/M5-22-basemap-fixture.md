# M5-22 verification: licence and attribution of the recorded basemap fixture

**Verifier:** Fact-Checker (Claude, Copilot CLI) · **Date:** 2026-10-22 · **Branch:** none. This was a read-only check: no repository edits and no commits. When committed, this report can be saved as `docs/verification/M5-22-basemap-fixture.md`.

**Scope:** card `docs/tasks/M5-22-tests-without-network.md`, scope item 5 and the acceptance criterion "The Fact-Checker signs off the fixture's licence and attribution". The question: may the project store the basemap responses its Playwright tests load (about 386 OpenFreeMap URLs and 28 VersaTiles URLs, about 35 MB) in a public pre-release asset tagged `test-fixture-basemap-<date>`? If so, what notices must go with it, and does it stay out of the app?

**Method:** I read every term and licence at its source on 2026-10-22; the list is in §13. Where a claim is about the files themselves, I checked the files. These were the recording the engineer made today (`/tmp/m5-22-basemap-fixture/store-2026-10-22`, 412 entries when I read it, read-only) and the upstream repositories, matched by SHA-256. I read the engineer's uncommitted work in `.worktrees/m5-22` without changing it. I made one request to `tiles.openfreemap.org` myself: the TileJSON, which every map viewer loads. All other requests went to public pages, repositories and OpenFreeMap's public download buckets (HEAD requests only).

**Result: FAIL as planned, because of one blocker. Every other part passes once the notices in §10 ship with the archive.**
- **Blocker.** On 2026-10-14 OpenFreeMap updated its Terms of Service. They now forbid collecting data from the service "in automated ways, except for offline downloads" that an app lets its users make. A script that records responses from `tiles.openfreemap.org` and then publishes them is not that kind of download. It needs OpenFreeMap's written permission, or the OpenFreeMap files must come from OpenFreeMap's public downloads instead (§11).
- **No licence is missing, and no term forbids redistribution.** Every part may be republished, with notices.
- **Needs change.** As drafted, the archive holds only `manifest.json` and `responses/`, and the release notes are one line. The ODbL, CC BY 4.0, OFL, BSD and MIT notices must go inside the archive and into the release notes (§10).

| # | Item | Verdict | Why, in one line |
|---|---|---|---|
| 1 | OpenFreeMap terms: how the files are collected | **Fail (blocker)** | The ToS of 2026-10-14 forbids automated collection except in-app offline downloads (§1.1) |
| 2 | OpenFreeMap terms: republishing | Pass | No term forbids it, and the licences allow it with notices (§1.1) |
| 3 | VersaTiles terms | Pass | It has no terms page. Its docs allow caching and offer scripted downloads (§1.2) |
| 4 | OpenStreetMap data in the tiles (ODbL) | Needs change | The tiles are a Derivative Database extract. The ODbL notice and a link must go in the archive and the release notes, and the tiles stay ODbL (§2) |
| 5 | OpenMapTiles | Needs change | "© OpenMapTiles", linked, with CC BY 4.0 named (§3) |
| 6 | Noto Sans glyph PBFs (OFL) | Needs change | The OFL text and the copyright lines must be inside the archive. No Reserved Font Name applies (§4) |
| 7 | OpenFreeMap sprite `ofm_f384` | Needs change | Its MIT, BSD and CC BY notices must be inside the archive (§5) |
| 8 | VersaTiles sprite `base` | Pass, with a note | CC0 1.0. VersaTiles itself hasn't traced 18 of its icons, but publishes them as CC0 (§5) |
| 9 | Natural Earth II shaded relief | Pass | Public domain, and the tiles are PDDL 1.0. Credit is optional (§6) |
| 10 | VersaTiles tiles | Needs change | They contain ESA WorldCover 2021 land cover (CC BY 4.0), so ESA's credit and dataset citation must be added (§7) |
| 11 | Stays out of the app | Pass | `.cache/` is git-ignored and outside `app/` (§8) |
| 12 | Pack script and release notes as drafted | Needs change | No notices in the tar, and one-line notes (§10.5) |
| 13 | Draft "Test fixtures" entry in `ATTRIBUTION.md` (worktree) | Needs change | Wrong URL patterns, missing ESA and ODbL link, sprite licences marked "unconfirmed" (§10.5) |

"Fail" means publishing must not go ahead. "Needs change" means it can go ahead once the stated text is added.

**Sign-off:** not given yet. I will sign off on the final archive (its SHA-256) and its release notes once the blocker is cleared and the §10 text is in.

## 1. Do the services' terms allow this? (Q1)

### 1.1 OpenFreeMap: the collection step fails; republishing is fine
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| O1 | The Terms of Service, "Last Updated: October 14, 2026", say under "User Conduct": "You will not: … Collect data from the service in automated ways, except for offline downloads as described below". | **Fail** for the planned method | <https://openfreemap.org/tos/> |
| O2 | "Offline Downloads: Your app may let users download areas for offline use if each download is: at most 3,000 tiles or 50 MB; made with at most 4 parallel requests; sent with a unique User-Agent identifying your app. For anything larger, please contact us at info@openfreemap.org." The FAQ and the Quick Start say the same. | Finding | <https://openfreemap.org/tos/>; <https://openfreemap.org/> ("Can my app download areas for offline use?"); <https://openfreemap.org/quick_start/> ("Mobile Apps") |
| O3 | **The recorder doesn't fit that exception.** `scripts/record-basemap.mjs` runs the whole Playwright suite in record mode and saves every response. This is the developers' tooling, not the app letting its users download an area. Chromium loads tiles with more than 4 parallel requests. The User-Agent is Playwright's browser default, not one that names the app. And the exception covers offline use, not publishing the files. So the recording is "collect[ing] data from the service in automated ways". At 373 tiles and 34.6 MB it is small, but the rule has no size floor. | **Fail** | `scripts/record-basemap.mjs`, `tests/browser/network-guard.mjs` (worktree, read-only); O1, O2 |
| O4 | **The rule is new.** The previous ToS ("Last Updated: September 9, 2026", Wayback capture of 2026-09-16) said "Attempt to collect data from the service in automated ways without permission". `docs/LICENSES.md` L8 and `docs/verification/M3-basemap.md` row 3 still quote that wording. | Finding | <https://web.archive.org/web/20260916103721/https://openfreemap.org/tos/> |
| O5 | **No term forbids redistribution.** The ToS covers how the service is used. Its "Intellectual Property" clause ("Our content is owned or licensed by us and protected by law") adds no licence terms. The files' licences govern republishing, and they allow it: MIT (OpenFreeMap), ODbL (data), CC BY 4.0 (schema), OFL (glyphs) and the sprite's licences. ODbL §4.7(b) lets a host impose terms on its own service only if it also offers an unrestricted copy, and OpenFreeMap does (O6). | Pass | <https://openfreemap.org/> ("License"); <https://raw.githubusercontent.com/hyperknot/openfreemap/main/LICENSE.md>; ODbL §4.7 (<https://opendatacommons.org/licenses/odbl/1-0/>) |
| O6 | **OpenFreeMap offers bulk channels.** "We also provide weekly full planet downloads". The README says "You can download them in Btrfs, MBTiles and PMTiles formats" at `https://btrfs.openfreemap.com/areas/planet/{version}/tiles.btrfs (and .mbtiles, .pmtiles)`, and that the MBTiles are offered for use "with any other tool of your choice". There are two public buckets: `assets.openfreemap.com` ("fonts, sprites, styles, versions") and `btrfs.openfreemap.com` ("full planet runs"). HEAD checks: `areas/planet/20261018_080001_pt/tiles.pmtiles` (87,123,778,817 bytes, `accept-ranges: bytes`), `fonts/ofm.tar.gz`, `sprites/ofm_f384.tar.gz` and `natural_earth/ofm.tar.gz` all return 200. | Finding (Option A, §11) | <https://openfreemap.org/>; <https://github.com/hyperknot/openfreemap> ("Full planet downloads", "Public buckets"); <https://btrfs.openfreemap.com/files.txt>; <https://assets.openfreemap.com/files.txt> |
| O7 | Viewing is unlimited: "there are no limits on the number of map views or requests". The weekly live smoke in `full-suite.yml` only views the map, so it is fine. | Pass | <https://openfreemap.org/> |
| O8 | For context only (not binding here): OSMF's own vector tile policy also treats "creating a tile archive" as bulk downloading. | Context | <https://operations.osmfoundation.org/policies/vector/> ("Bulk Downloading") |

### 1.2 VersaTiles: pass
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| V1 | VersaTiles publishes no terms of service, usage policy or imprint. I found no such link on versatiles.org, tiles.versatiles.org or docs.versatiles.org, and a web search found none. | Finding | <https://versatiles.org/>; <https://docs.versatiles.org/> |
| V2 | The docs call `tiles.versatiles.org` "a demo server for VersaTiles. It is free and open to everyone, but it comes without any guarantees". Requests are "rate-limited per IP address", at a limit "far above what normal map use needs". The docs plan for caches: "If you build your own client or cache … tiles and all other files carry an `ETag`." Logs are used "to detect obvious misuse". Nothing forbids saving responses. | Pass | <https://docs.versatiles.org/guides/use_tiles_versatiles_org.html> |
| V3 | The download server offers whole tilesets, bounding-box extracts and "A URL list (`urllist_<tileset>.tsv`) per tileset for scripted downloads", and it states each tileset's licence. | Pass | <https://docs.versatiles.org/basics/tilesets.html>; <https://download.versatiles.org/> |

**Conclusion (Q1):** VersaTiles allows it. OpenFreeMap allows republishing, but the planned way of getting its files breaks its current ToS. The recording made today from `tiles.openfreemap.org` should not be published unless OpenFreeMap permits it.

## 2. OpenStreetMap data and the ODbL (Q2)

### 2.1 What the republished tiles are
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| D1 | **Not a Produced Work.** ODbL: a Produced Work is "a work (such as an image, audiovisual material, text, or sounds) resulting from using … the Contents". OSMF: "If the published result of your project is intended for the extraction of the original data, then it is a database and not a Produced Work", and "Database dumps are usually not Produced Works". Vector tiles hold each feature's geometry and tags in machine-readable form, and the archive exists to hand that data to a renderer. The OSMF FAQ calls a tile *service* "likely" a Produced Work. OSMF's 2020 Produced Work licence covers its own "standard style" raster tiles. Neither covers publishing the tile files themselves. | Finding | ODbL §1 (<https://opendatacommons.org/licenses/odbl/1-0/>); <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline> (endorsed 2014-06-06); <https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ> §1.6–1.7; <https://osmfoundation.org/wiki/OSMF_updates/2020-08/Licensing_Working_Group_Overview> |
| D2 | **A Derivative Database.** OpenFreeMap's and VersaTiles' tilesets are themselves Derivative Databases of OSM: the OSM data is selected, generalised and re-encoded. The archive copies part of them unmodified. That part is Substantial: 373 OpenFreeMap tiles with 148,873 features and 21 VersaTiles tiles with 8,611 features, from zoom 3 to 12, taken systematically. OSMF counts fewer than 100 features, or about one village, as insubstantial ("village map OK, town map not OK"). ODbL §4.4(b): "Extraction or Re-utilisation of the whole or a Substantial part of the Contents into a new database is a Derivative Database". The duties are the same whether this is seen as a new Derivative Database or as passing on OpenFreeMap's and VersaTiles' own. | Finding | ODbL §1, §4.4(b); <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline> (endorsed 2014-06-06); feature counts from the recorded tiles |
| D3 | **Not a Collective Database in the licence's strict sense.** That term means "this Database in unmodified form", that is, OSM itself. But the archive is a collection: the ODbL tiles sit beside independent parts (fonts, sprites, relief images and the project's own `manifest.json`). ODbL §4.5(a): "You are not required to license Collective Databases under this License if You incorporate this Database or a Derivative Database in the collection, but this License still applies to this Database or a Derivative Database as a part of the Collective Database". OSMF: share-alike "will **not** apply to any other data forming part of a Collective Database". So the ODbL applies to the vector tiles only. | Finding | ODbL §1, §4.5(a); OSMF Legal FAQ §1.7.1; <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline> (endorsed 2016-06-17) |
| D4 | **It is public use.** A release asset in a public repository lets anyone "make or receive copies" (ODbL "Convey"), and those people are not under the project's control ("Publicly"). Keeping it out of the app doesn't change this. | Finding | ODbL §1 |

### 2.2 What must go with the archive
| # | Obligation | Source | How the archive meets it (§10) |
|---|---|---|---|
| R1 | Convey it "only under the terms of this License". | ODbL §4.2(a) | Say the OSM data is under ODbL 1.0, and don't put it under MIT or CC BY-SA. |
| R2 | "Include a copy of this License … or its Uniform Resource Identifier (URI) … both in the Database or Derivative Database and in any relevant documentation." | ODbL §4.2(b) | Put the ODbL link in `NOTICE.md` and in the release notes, plus `LICENSES/ODbL-1.0.txt` (the link alone is the legal minimum). |
| R3 | "Keep intact any copyright or Database Right notices and notices that refer to this License." | ODbL §4.2(c) | Keep the recorded TileJSON's `attribution` unmodified (it is). Repeat VersaTiles' credit in `NOTICE.md`, because no VersaTiles TileJSON is recorded. |
| R4 | If a file can't hold the notices, "include the notices in a location (such as a relevant directory) where users would be likely to look for it". OSMF: "such as a readme file, or within the data or metadata". | ODbL §4.2(d); OSMF Attribution Guidelines, "Databases" | Put `NOTICE.md` at the archive root, beside `manifest.json`. |
| R5 | **Share-alike:** the derivative stays ODbL 1.0, with nothing incompatible added. | ODbL §4.4(a), (d) | The tiles are unmodified. Nothing is added to them. |
| R6 | **No extra restrictions:** "You may not impose any further restrictions on the exercise of the rights granted". | ODbL §4.7(a), §4.8 | Describe the archive as a test fixture, but don't write "for tests only" as a condition. |
| R7 | **Access:** "offer … a copy in a machine readable form of … The entire Derivative Database", "free of charge if distributed over the internet". | ODbL §4.6 | The archive *is* the whole extract, free on GitHub. As good practice, point to the full upstream tilesets too. |
| R8 | **Attribution wording:** "Attribution must be to 'OpenStreetMap'" and must "make it clear that the data is available under the Open Database License". "The historical forms of attribution '© OpenStreetMap contributors' or '© OpenStreetMap' are acceptable." For data: "If you are distributing OSM in data form, please name and link directly to the license(s)." | OSMF Attribution Guidelines (adopted 2021-06-25), "Attribution text" and "Databases"; <https://www.openstreetmap.org/copyright> | Use: "Map data © OpenStreetMap contributors (https://www.openstreetmap.org/copyright), available under the Open Database License 1.0 (ODbL): https://opendatacommons.org/licenses/odbl/1-0/". |

ODbL §4.3, the Produced Work notice, does not apply to the archive itself. The app's map already carries it.

## 3. OpenMapTiles (Q3): needs change
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| T1 | OpenFreeMap's map schema is "unmodified OpenMapTiles". Its TileJSON reports `"version": "3.16.0"` and lists the OpenMapTiles layers. | Finding | <https://openfreemap.org/> ("What is the tech stack?"); <https://tiles.openfreemap.org/planet> |
| T2 | OpenMapTiles' licence ("Copyright (c) 2024, MapTiler.com & OpenMapTiles contributors"): code BSD 3-Clause. The schema's "cartography and visual design features … are licensed under the Creative Commons Attribution 4.0 license". "Products or services using maps derived from OpenMapTiles schema need to visibly credit 'OpenMapTiles.org' or reference 'OpenMapTiles' with a link to http://openmaptiles.org/". Exceptions only "in a written form granted by MapTiler". | Finding | <https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md> |
| T3 | Planetiler, which builds OpenFreeMap's tiles: "Any map generated with the profile based on OpenMapTiles or a derivative must visibly credit OpenMapTiles". | Finding | <https://github.com/onthegomap/planetiler> ("License and Attribution"); <https://github.com/openmaptiles/planetiler-openmaptiles> ("License") |
| T4 | **What OpenFreeMap asks for:** "Attribution is required. … you must add the following attribution: OpenFreeMap © OpenMapTiles Data from OpenStreetMap", and "You do not need to display the OpenFreeMap part, but it is nice if you do." The recorded TileJSON carries the same string as HTML. | Finding | <https://openfreemap.org/> ("Attribution"); <https://github.com/hyperknot/openfreemap> ("Attribution") |
| T5 | **Answer:** yes, include "© OpenMapTiles", linked to openmaptiles.org, and name CC BY 4.0 with its link. It is unclear how much schema "design" raw tile data carries. But OpenFreeMap requires the credit, the TileJSON in the archive holds the schema's layer definitions, and CC BY 4.0 §3(a)(1) asks that the creator credit, copyright notice, licence notice and a link be kept when the material is shared. It costs nothing. | Needs change | CC BY 4.0 §3(a) (<https://creativecommons.org/licenses/by/4.0/legalcode.en>) |

## 4. Glyph PBFs and the SIL OFL 1.1 (Q4): needs change
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| G1 | **OpenFreeMap's glyphs** are "the processed Noto Sans font from the maplibre/demotiles repo" (its `fonts/collect.sh` copies `maplibre/font/Noto*`). The recorded `0-255.pbf` files for Regular, Bold and Italic match demotiles' files byte for byte (SHA-256 `ef1f38a3…`, `f60ce4cb…`, `ae9c8894…`). Each demotiles Noto folder carries a `LICENSE.md` with the OFL 1.1 text but no copyright line. That file matches `noto-sans/LICENSE` in openmaptiles/fonts word for word, so openmaptiles/fonts is very likely the source. The `NotoSans-Regular.ttf` there (Version 1.06) reads "Copyright 2012 Google Inc. All Rights Reserved.", "Noto is a trademark of Google Inc.", and OFL 1.1. | Finding | <https://github.com/hyperknot/openfreemap-styles/blob/main/fonts/README.md>; <https://github.com/maplibre/demotiles/tree/gh-pages/font>; <https://github.com/openmaptiles/fonts/tree/master/noto-sans> (TTF `name` table) |
| G2 | **VersaTiles' glyphs** come from versatiles-fonts (code MIT; "Noto Sans by Google - OFL"). Its `fonts/Noto Sans/LICENSE` is the OFL 1.1 text. Its `Noto Sans - Regular.ttf` (Version 2.013) reads "Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)" and "Noto is a trademark of Google LLC." | Finding | <https://github.com/versatiles-org/versatiles-fonts> (README; `fonts/Noto Sans/`) |
| G3 | **Every stored glyph comes from Noto Sans itself.** The recorded ranges are 0–255, 256–511 and 512–767 (U+0000–U+02FF). Every glyph in them is in the matching Noto Sans character map, except some control characters (U+0001–U+001F): 30 in each OpenFreeMap 0–255 file and 1 in VersaTiles'. Every control-character entry (32 per OpenFreeMap 0–255 file, 3 in VersaTiles') is empty: no bitmap, zero width and height. So no glyph outline comes from a fallback font. Two VersaTiles requests (`Noto Sans Bold`, `Noto Sans Regular`) returned 404 with no body. | Finding | Parsed from the recorded PBFs |
| G4 | **They are the Font Software in a converted form.** OFL: "'Modified Version' refers to any derivative made by adding to, deleting, or substituting … any of the components of the Original Version, by changing formats". OFL FAQ 2.2: "A change in font format normally is considered modification". SDF glyph PBFs are a change of format, so the OFL covers them. They are not "document[s] created using the Font Software", which would be free of the OFL. | Finding | OFL 1.1 (the `LICENSE` files above; <https://openfontlicense.org/>); <https://openfontlicense.org/ofl-faq/> |
| G5 | **They may be redistributed.** OFL condition 1: not "sold by itself" (the archive is free). Condition 2: copies "may be bundled, redistributed … provided that each copy contains the above copyright notice and this license", either "as stand-alone text files" or in metadata. FAQ 1.10: the OFL text may be left out only "when a font is embedded in a document or bundled within a program". Glyph PBFs have no field for it, so the OFL text and the copyright lines must go in a separate file in the archive. | Needs change | OFL 1.1 conditions 1–2; OFL FAQ 1.7, 1.10 |
| G6 | **They stay under the OFL only.** Condition 5: "must be distributed entirely under this license, and must not be distributed under any other license". So the release must not present them as MIT or CC0. | Needs change | OFL 1.1 condition 5 |
| G7 | **No Reserved Font Name applies.** Neither Noto Sans build declares one (no "with Reserved Font Name" in either `LICENSE` file or in either font's licence field). "Noto" is a Google trademark (name ID 7). That is not an OFL Reserved Font Name, and nothing is renamed. Both fontstacks also contain CJK fallback fonts, which do carry one (Noto Sans JP: "Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'"). No CJK glyph is stored (G3), and no fontstack name uses "Source". | Pass | G1, G2; <https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt> |

## 5. The sprites (Q5)
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| S1 | **OpenFreeMap `ofm_f384`:** the source is hyperknot/openfreemap-styles, `sprites/sprites/ofm_f384/` (commit `6e53612`). The recorded `ofm.json` (27,737 bytes, `73e75e58…`) and `ofm.png` (49,454 bytes, `8996a519…`) match it byte for byte. `create_sprites.sh` builds the sheet from `styles/liberty/svgs/svgs_iconset` (the OSM Liberty iconset, built on Maki), `styles/liberty/svgs/svgs_not_in_iconset` (arrow, dots, patterns) and `styles/bright/icons_unique` (road shields, one-way arrow, airport). spritezero is only the build tool (ISC). | Finding | <https://github.com/hyperknot/openfreemap-styles/tree/main/sprites> |
| S2 | Its licences: the repository is MIT ("Copyright (c) 2023 Zsolt Ero"). Liberty's licence covers code (BSD, "derived from OSM Bright from Mapbox Open Styles") and design (CC BY 3.0), and says "OSM Liberty is using the Maki POI icon set … CC0 1.0 Universal" and "The right arrow … is in the public domain". OSM Bright: "Copyright (c) 2016, KlokanTech.com & OpenMapTiles contributors. Copyright (c) 2014, Mapbox.", BSD 3-Clause, design CC BY 4.0. Maki's `LICENSE.txt` is CC0 1.0. On Commons, `File:Arrowright.svg` has `LicenseShortName` "Public domain". | **Needs change:** ship the notices | `LICENSE.md`, `styles/liberty/LICENSE.md` and `styles/bright/LICENSE.md` in openfreemap-styles; <https://github.com/mapbox/maki/blob/main/LICENSE.txt>; Commons API |
| S3 | **Why notices are needed:** the BSD licence says "Redistributions in binary form must reproduce the above copyright notice … in the documentation and/or other materials provided with the distribution". MIT says the notice "shall be included in all copies or substantial portions". CC BY asks for credit and the licence. The app already ships exactly these upstream notices as parts (b)–(e) of `app/public/styles/liberty/LICENSE.txt` (obligation L3). | Needs change | As S2 |
| S4 | **VersaTiles `base`:** the source is versatiles-org/versatiles-style. The recorded `base.json` (19,561 bytes, `a3a2c956…`) and `base.png` (92,077 bytes, `ab9d9f91…`) match `sprites.tar.gz` in release v7.0.1 (2026-10-15) byte for byte. Licence: "Iconsets and Rendered Spritemaps: CC0 1.0 Universal". The generator code is MIT, but the sheet itself is CC0. | Pass | <https://github.com/versatiles-org/versatiles-style> (README "Licenses"; `icons/LICENSE.md`); release v7.0.1 |
| S5 | **Note:** VersaTiles' own provenance file, `icons/unknown/source.json`, says "Provenance not established" for 20 icons, and lists them as `"license": "CC0-1.0"`. 18 of them are in the recorded `base.json` (for example `icon-fuel_pump`, `icon-restrooms`, `icon-star_of_david`). VersaTiles ruled out copies of Maki and Temaki (both CC0) and of the Noun Project. Its "best remaining explanation is that these were drawn for VersaTiles in Temaki's style". M3-07 already accepted this sheet as CC0 for the app. I accept it on the same basis. No action. | Pass, with a note | <https://github.com/versatiles-org/versatiles-style/blob/main/icons/unknown/source.json>; `SPRITES.md`; Temaki `LICENSE.md` (CC0) |

## 6. Natural Earth II shaded relief (Q6): pass
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| N1 | OpenFreeMap's `ne2sr` tiles are copied from `lukasmartinelli/naturalearthtiles` (gh-pages, `tiles/natural_earth_2_shaded_relief.raster`). That project says "The produced vector and raster tiles are made available under the Public Domain Dedication and License v1.0". | Pass | `natural_earth/collect.sh` in openfreemap-styles; <https://github.com/lukasmartinelli/naturalearthtiles> ("License") |
| N2 | Natural Earth: "All versions of Natural Earth raster + vector map data found on this website are in the public domain", "No permission is needed to use Natural Earth. Crediting the authors is unnecessary." Optional citation: "Made with Natural Earth." | Pass | <https://www.naturalearthdata.com/about/terms-of-use/> |
| N3 | Attribution is not required. Credit it as a courtesy, as the app does. Today's recording has no `ne2sr` tiles, but the notice covers them if a later one does. OpenFreeMap's vector tiles also use Natural Earth at low zoom, which is public domain. | Pass | Recorded manifest; planetiler-openmaptiles `OpenMapTilesMain.java` |

## 7. VersaTiles tiles (Q7): needs change (ESA WorldCover)
| # | Claim | Verdict | Evidence (read 2026-10-22) |
|---|---|---|---|
| W1 | OpenStreetMap data, ODbL 1.0, "requires attribution to OpenStreetMap contributors". | Finding | <https://docs.versatiles.org/basics/tilesets.html> ("Licence & Attribution") |
| W2 | Shortbread schema: "We take the position that this schema is not creative enough to be a copyrightable work. For the sake of clarity, however, we are releasing it under the CC-0 license … using this schema to create your vector tiles will not add any attribution requirements". | Pass | <https://shortbread-tiles.org/copyright/> |
| W3 | **Something more:** "The hosted tileset at `https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}` is the **merged** variant: it contains OpenStreetMap **and** landcover data. If you use it, you must also attribute ESA WorldCover". The land cover "writes into Shortbread's existing `land` and `water_polygons` layers … only below the zoom level where OSM introduces each kind". VersaTiles Landcover Vectors are "derived from ESA WorldCover and therefore also licensed CC BY 4.0". Its attribution: "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium". The live TileJSON is named "Versatiles Landcover" and carries the same credit. The recorded tiles are at zoom 4, 7 and 8, where this land cover sits: 6,048 of their 8,611 features are in `land`. | **Needs change** | <https://docs.versatiles.org/basics/tilesets.html> ("Landcover"); <https://tiles.versatiles.org/tiles/osm/tiles.json> |
| W4 | ESA: "The ESA WorldCover product is provided free of charge, without restriction of use" under CC BY 4.0. "Publications, models and data products that make use of these datasets must include proper acknowledgement, including citing the datasets". The 2021 citation: "Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221". The archive is such a data product, so it carries both the credit line and the citation. | Needs change | <https://esa-worldcover.org/en/data-access> ("License", "Citation") |
| W5 | Nothing else: the `osm` tileset has no hillshade, bathymetry or satellite data, and its TileJSON names only Shortbread and ESA. The VersaTiles credit itself is a courtesy. It names the licensor of the land cover vectors and the source, so include it. | Pass | <https://tiles.versatiles.org/tiles/osm/tiles.json> |

## 8. Does it stay out of the app? (card scope 5): pass
- The fixture unpacks into `.cache/basemap-fixture/<sha256>/` at the repository root. `.gitignore` line 91 is `.cache/` (`git check-ignore` confirms), and the folder is outside `app/`, so the web export can't copy it into `app/dist`.
- The committed lock file, `tests/fixtures/basemap-fixture.lock.json`, holds only `repo`, `tag`, `asset`, `sha256`, `bytes`, `files` and `recordedAt` (`scripts/lib/basemap-fixture.mjs`), so there is no basemap data in git.
- Suggested check, for the PR reviewer or CI after the export: `find app/dist -name '*.bin.gz' -o -name 'manifest.json'` returns nothing.

## 9. Is anything a fail? (Q8)
- **Yes, one thing: OpenFreeMap's Terms of Service (2026-10-14) forbid the way the OpenFreeMap files are to be collected.** A scripted recording from `tiles.openfreemap.org` is automated collection, and it is not an in-app offline download. This blocks publishing until it is cleared (§11).
- **No term forbids redistribution.** OpenFreeMap's ToS doesn't address it, and VersaTiles has no terms.
- **No licence is missing.** Every part has a licence that allows redistribution: ODbL 1.0, CC BY 4.0, OFL 1.1, BSD 3-Clause, MIT, CC0 1.0, PDDL 1.0 and public domain. All are compatible with publishing them, unmodified, beside MIT code. None of them becomes MIT, and the project's licences don't change.
- **It would also be a fail to publish the archive as drafted,** without the notices (ODbL §4.2, OFL condition 2, CC BY 4.0 §3(a), BSD clause 2, MIT). That is fixed by §10.

## 10. Text to use

### 10.1 `ATTRIBUTION.md`: "Test fixtures" entry (replaces the draft in the worktree)
```markdown
## Test fixtures
The browser tests replay recorded basemap responses instead of loading the live basemap (M5-22). The recording is a pre-release asset of this repository, tagged `test-fixture-basemap-<date>`. CI and developers download it, check its SHA-256 and unpack it into the git-ignored `.cache/basemap-fixture/`. It is not part of the app (`app/dist`) and is not committed to git. It is not covered by this project's MIT or CC BY-SA 4.0 licences: each file keeps its upstream licence. The archive carries `NOTICE.md` and a `LICENSES/` folder with the notices below. Decisions: `docs/LICENSES.md`, "Test fixtures (M5-22)". Evidence: `docs/verification/M5-22-basemap-fixture.md`.

| Source | Used for | License | Required attribution | Link | Added in |
|---|---|---|---|---|---|
| OpenStreetMap and its contributors (the data in the fixture's vector tiles) | The OpenFreeMap and VersaTiles vector tiles the tests load, copied unmodified (an extract of their tilesets: a Derivative Database, ODbL §4.4(b)) | ODbL 1.0 | "Map data © OpenStreetMap contributors", linked to <https://www.openstreetmap.org/copyright>, with the ODbL named and linked (<https://opendatacommons.org/licenses/odbl/1-0/>), in the archive's `NOTICE.md` and in the release notes (ODbL §4.2; OSMF Attribution Guidelines, "Databases"). The tiles stay under the ODbL only. | <https://www.openstreetmap.org/copyright> | M5-22 |
| OpenMapTiles (schema of the OpenFreeMap tiles and TileJSON) | Same tiles | CC BY 4.0 (design), BSD 3-Clause (code) | "© OpenMapTiles", linked to <https://openmaptiles.org/>, with CC BY 4.0 linked, in `NOTICE.md` and the release notes. | <https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md> | M5-22 |
| OpenFreeMap (vector tiles, TileJSON, glyphs, sprite and relief tiles; the planet build is named in the release notes) | The main basemap's responses | MIT (project); [Terms of Service](https://openfreemap.org/tos/) | OpenFreeMap's own string, verbatim: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" (the OpenFreeMap part is optional). The files come from OpenFreeMap's public downloads, or from its public instance only with its written permission: since 2026-10-14 its ToS forbids collecting data from the service in automated ways, except for in-app offline downloads. | <https://openfreemap.org/> | M5-22 |
| VersaTiles (vector tiles, glyphs and sprite) | The backup basemap's responses | Data: ODbL 1.0 (OpenStreetMap). Shortbread schema: CC0 1.0. Sprite: CC0 1.0. | "VersaTiles © OpenStreetMap contributors" (the VersaTiles credit is a courtesy). | <https://versatiles.org/> | M5-22 |
| ESA WorldCover 2021, via VersaTiles' Landcover Vectors (inside the VersaTiles tiles) | Low-zoom land cover in the backup basemap's tiles | CC BY 4.0 | "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium", with CC BY 4.0 linked, and ESA's dataset citation (ESA WorldCover 10 m 2021 v200, <https://doi.org/10.5281/zenodo.7254221>), in `NOTICE.md` and the release notes. | <https://esa-worldcover.org/en/data-access> | M5-22 |
| Noto Sans (the label glyph PBFs from both services) | Map label glyphs | SIL Open Font License 1.1 ("Copyright 2012 Google Inc. All Rights Reserved."; "Copyright 2022 The Noto Project Authors"). No Reserved Font Name. | `LICENSES/OFL-1.1-Noto-Sans.txt` in the archive, with both copyright lines and the full OFL text (OFL condition 2). The glyphs stay under the OFL only. | <https://github.com/notofonts/latin-greek-cyrillic> | M5-22 |
| OpenFreeMap sprite `ofm_f384` (Liberty and OSM Bright icons, Maki, a public-domain arrow) | Icons of the main basemap | MIT (© 2023 Zsolt Ero); BSD 3-Clause (© 2014 Mapbox; © 2016 KlokanTech.com & OpenMapTiles contributors) and CC BY 3.0 / CC BY 4.0 (design); Maki CC0 1.0; arrow public domain | `LICENSES/OpenFreeMap-sprite.txt` in the archive: the upstream notices, the same as parts (b)–(e) of `app/public/styles/liberty/LICENSE.txt`. | <https://github.com/hyperknot/openfreemap-styles/tree/main/sprites> | M5-22 |
| Natural Earth (low-zoom data in the OpenFreeMap tiles; the Natural Earth II shaded relief tiles) | Relief and low-zoom features | Public domain; the relief tiles are PDDL 1.0 (`lukasmartinelli/naturalearthtiles`) | None required; credited as a courtesy: "Made with Natural Earth." | <https://www.naturalearthdata.com/> | M5-22 |
```

### 10.2 The GitHub pre-release
- **Tag:** `test-fixture-basemap-<YYYY-MM-DD>`, published as a pre-release.
- **Title:** `Test fixture: recorded basemap responses, <YYYY-MM-DD> (not an app release)`
- **Notes** (pass them with `--notes-file`):

```markdown
**Test fixture, not an app release.** This archive holds the basemap responses that the browser tests of Interactive Bible Map replay, so the tests don't depend on the network. It is not part of the app and is never deployed with it.

- File: `basemap-fixture-<YYYY-MM-DD>.tar` · SHA-256 `<sha256>` · <bytes> bytes · <n> files
- Recorded: <YYYY-MM-DD>. OpenFreeMap planet build: `<version>`.
- OpenFreeMap files: <EITHER "taken from OpenFreeMap's public downloads: the planet build's `tiles.pmtiles` (https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles), and fonts, sprite and relief tiles from https://assets.openfreemap.com/ or their upstream repositories" OR "recorded from https://tiles.openfreemap.org with OpenFreeMap's written permission of <date>">.
- VersaTiles files: recorded from https://tiles.versatiles.org.
- Each response body is stored as received, unmodified, and compressed with gzip. `manifest.json` maps each URL to its file. `NOTICE.md` and the `LICENSES/` folder inside the archive give the full notices.

**Licences.** This archive is not covered by the repository's MIT licence or by the project's CC BY-SA 4.0 data licence. Each part keeps its own licence:

- **OpenStreetMap data (all vector tiles):** Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). The tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish, and this archive holds the whole extract. The full tilesets: [OpenFreeMap planet downloads](https://btrfs.openfreemap.com/files.txt) and [VersaTiles downloads](https://download.versatiles.org/).
- **OpenFreeMap tiles and TileJSON:** [OpenFreeMap](https://openfreemap.org) [© OpenMapTiles](https://www.openmaptiles.org/) Data from [OpenStreetMap](https://www.openstreetmap.org/copyright). OpenMapTiles schema © MapTiler.com & OpenMapTiles contributors: design [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), code [BSD 3-Clause](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). Low-zoom data from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- **VersaTiles tiles:** [VersaTiles](https://versatiles.org) © OpenStreetMap contributors (ODbL 1.0), in the [Shortbread](https://shortbread-tiles.org/) schema (CC0 1.0). Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), through VersaTiles' [Landcover Vectors](https://github.com/versatiles-org/landcover-vectors) (CC BY 4.0). Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221
- **Label glyphs:** Noto Sans, under the [SIL Open Font License 1.1](https://openfontlicense.org/). The copyright notices and the licence text are in `LICENSES/OFL-1.1-Noto-Sans.txt`.
- **Icons:** OpenFreeMap's `ofm_f384` sprite ([openfreemap-styles](https://github.com/hyperknot/openfreemap-styles), MIT; icons from the Liberty and OSM Bright styles, BSD 3-Clause and CC BY 3.0/4.0; [Maki](https://github.com/mapbox/maki), CC0 1.0). Full notices are in `LICENSES/OpenFreeMap-sprite.txt`. VersaTiles' `base` sprite ([versatiles-style](https://github.com/versatiles-org/versatiles-style)), CC0 1.0.
- **Relief tiles:** Natural Earth II shaded relief ([Natural Earth](https://www.naturalearthdata.com/), public domain; the tiles are PDDL 1.0). Made with Natural Earth.

The licensors provide this material as is, without warranty. See each licence.
```

### 10.3 Files that must ship inside the archive
Put these at the archive root, beside `manifest.json` and `responses/`:

| File | Required? | Why |
|---|---|---|
| `NOTICE.md` | **Required** | ODbL §4.2(b)–(d); OSMF "Databases"; CC BY 4.0 §3(a) for OpenMapTiles and ESA; ESA's citation request |
| `LICENSES/OFL-1.1-Noto-Sans.txt` | **Required** | OFL condition 2 and FAQ 1.10 |
| `LICENSES/OpenFreeMap-sprite.txt` | **Required** | BSD clause 2, the MIT notice, and CC BY credit for the `ofm_f384` sprite |
| `LICENSES/ODbL-1.0.txt` | Recommended | The link in `NOTICE.md` is the legal minimum (§4.2(b)). A copy keeps the archive complete on its own. |

Not needed: the CC BY 4.0, CC0 or PDDL texts, because a link is enough (CC BY 4.0 §3(a)(1)(C)).

**`NOTICE.md`** (fill in the angle brackets):
```markdown
# Notice: recorded basemap responses (test fixture)

This archive is a test fixture of Interactive Bible Map (https://github.com/jameshuangdevelop/interactive-bible-map). It holds the basemap responses that the project's browser tests replay, so the tests don't need the network. It is not part of the app.

Recorded: <YYYY-MM-DD>. OpenFreeMap planet build: <version>.
OpenFreeMap files: <taken from OpenFreeMap's public downloads (https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles and https://assets.openfreemap.com/) | recorded from https://tiles.openfreemap.org with OpenFreeMap's written permission of <date>>.
VersaTiles files: recorded from https://tiles.versatiles.org.

`manifest.json` lists each URL and the file in `responses/` that holds its body. Each body is stored as received, unmodified, and compressed with gzip. This project wrote `manifest.json`; it holds only URLs, HTTP headers and file names.

This archive is not covered by the project's MIT licence or its CC BY-SA 4.0 data licence. Each part keeps its own licence, listed below by URL. Nothing here adds any condition to those licences.

## Vector tiles: OpenStreetMap data
URLs starting with https://tiles.openfreemap.org/planet/ or https://tiles.versatiles.org/tiles/osm/

Map data © OpenStreetMap contributors (https://www.openstreetmap.org/copyright).
It is available under the Open Database License 1.0 (ODbL): https://opendatacommons.org/licenses/odbl/1-0/ (a copy is in LICENSES/ODbL-1.0.txt).
These tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish. This archive holds the whole extract. The full tilesets: https://btrfs.openfreemap.com/files.txt (OpenFreeMap planet downloads) and https://download.versatiles.org/ (VersaTiles).

## OpenFreeMap tiles and TileJSON
URLs starting with https://tiles.openfreemap.org/planet

OpenFreeMap (https://openfreemap.org) © OpenMapTiles (https://www.openmaptiles.org/) Data from OpenStreetMap (https://www.openstreetmap.org/copyright)

The tiles use the OpenMapTiles schema, © MapTiler.com & OpenMapTiles contributors (https://openmaptiles.org/). Schema design: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Schema code: BSD 3-Clause (https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). The low zoom levels also hold Natural Earth data (public domain). OpenFreeMap is MIT-licensed.

## VersaTiles tiles
URLs starting with https://tiles.versatiles.org/tiles/osm/

VersaTiles (https://versatiles.org) © OpenStreetMap contributors. Schema: Shortbread (https://shortbread-tiles.org/), CC0 1.0.

Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). It reaches these tiles through VersaTiles' Landcover Vectors (https://github.com/versatiles-org/landcover-vectors), which are derived from ESA WorldCover and also licensed CC BY 4.0. This project has not modified them.
Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221

## Label glyphs: Noto Sans
URLs starting with https://tiles.openfreemap.org/fonts/ or https://tiles.versatiles.org/assets/glyphs/

Glyphs converted from the Noto Sans fonts: OpenFreeMap's by maplibre/demotiles (https://github.com/maplibre/demotiles), and VersaTiles' by VersaTiles Fonts (https://github.com/versatiles-org/versatiles-fonts). Licence: SIL Open Font License 1.1. The copyright notices and the full licence are in LICENSES/OFL-1.1-Noto-Sans.txt.

## Icon sprites
URLs starting with https://tiles.openfreemap.org/sprites/ofm_f384/: OpenFreeMap's sprite (https://github.com/hyperknot/openfreemap-styles), MIT, © 2023 Zsolt Ero. It is built from icons of the Liberty and OSM Bright styles (code BSD 3-Clause, © 2014 Mapbox and © 2016 KlokanTech.com & OpenMapTiles contributors; design CC BY 3.0 and CC BY 4.0), from Maki icons (CC0 1.0) and from a public-domain arrow (https://commons.wikimedia.org/wiki/File:Arrowright.svg). The full notices are in LICENSES/OpenFreeMap-sprite.txt.

URLs starting with https://tiles.versatiles.org/assets/sprites/: VersaTiles' sprite (https://github.com/versatiles-org/versatiles-style), CC0 1.0.

## Relief tiles
URLs starting with https://tiles.openfreemap.org/natural_earth/ne2sr/: Natural Earth II shaded relief (https://www.naturalearthdata.com/), public domain. The tiles come from https://github.com/lukasmartinelli/naturalearthtiles, released under the PDDL 1.0. Made with Natural Earth.

## No warranty
The licensors provide all of this as is, without warranty. See the disclaimers in each licence.
```

**`LICENSES/OFL-1.1-Noto-Sans.txt`**: these lines, then the OFL 1.1 text copied unchanged from the upstream licence file. The files are <https://github.com/versatiles-org/versatiles-fonts/blob/main/fonts/Noto%20Sans/LICENSE> and maplibre/demotiles' `font/Noto Sans Regular/LICENSE.md`; both hold the same OFL 1.1 text.
```text
Noto Sans glyphs in this archive (converted to map glyphs by maplibre/demotiles for OpenFreeMap, and by VersaTiles Fonts for VersaTiles):
Copyright 2012 Google Inc. All Rights Reserved.
Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)
Noto is a trademark of Google LLC.

This Font Software is licensed under the SIL Open Font License, Version 1.1.
```
Both copyright lines are listed because the two services' glyphs come from different Noto Sans releases (G1, G2). If a later recording stores glyph ranges above U+02FF, the Fact-Checker re-checks this file. Those ranges could come from the fallback fonts: for example, CJK ranges would add Adobe's copyright line and its Reserved Font Name "Source".

**`LICENSES/OpenFreeMap-sprite.txt`**: start with "Notices for the OpenFreeMap sprite ofm_f384 (https://github.com/hyperknot/openfreemap-styles/tree/main/sprites/sprites/ofm_f384), copied unchanged from the upstream licence files." Then add everything after the first `-----` line of `app/public/styles/liberty/LICENSE.txt`. Those are parts (b)–(e): openfreemap-styles `LICENSE.md`, `styles/liberty/LICENSE.md`, `styles/bright/LICENSE.md` and the Mapbox Open Styles `LICENSE.md`. Part (a) describes the app's modified style, which is not in the archive.

**`LICENSES/ODbL-1.0.txt`**: copied unchanged from <https://opendatacommons.org/licenses/odbl/odbl-10.txt>.

Optional: add `"notice": "NOTICE.md"` to `manifest.json`'s `metadata`. OSMF also accepts notices "within the data or metadata".

### 10.4 `docs/LICENSES.md` (suggested; the Fact-Checker's file, for whoever commits the card's docs)
```markdown
## Test fixtures (M5-22)
Decided on 2026-10-22. Evidence: `docs/verification/M5-22-basemap-fixture.md`.

The browser tests replay recorded basemap responses from a public pre-release asset (`test-fixture-basemap-<date>`). Publishing it passes on OpenStreetMap data, so the ODbL applies to its vector tiles. The archive is a collection: each part keeps its upstream licence (ODbL §4.5(a)), and none of it is under the project's MIT or CC BY-SA 4.0 licences.

- **T1. How the OpenFreeMap files are obtained.** Not by scripted recording from `tiles.openfreemap.org`. OpenFreeMap's Terms of Service (updated 2026-10-14) forbid collecting data from the service in automated ways, except for in-app offline downloads. Take the files from OpenFreeMap's public downloads (the planet build's `tiles.pmtiles`, and `assets.openfreemap.com` or the upstream repositories for glyphs, sprite and relief tiles). Or record them only with OpenFreeMap's written permission, quoted here with its date.
- **T2. Notices inside the archive:** `NOTICE.md`, `LICENSES/OFL-1.1-Noto-Sans.txt`, `LICENSES/OpenFreeMap-sprite.txt` and `LICENSES/ODbL-1.0.txt` (ODbL §4.2(b)–(d); OFL condition 2; BSD clause 2; CC BY 4.0 §3(a)).
- **T3. Notices in the release notes:** the same credits and links (ODbL §4.2(b), "any relevant documentation").
- **T4. Licences stay as they are.** The OpenStreetMap-derived tiles stay ODbL 1.0, and the glyphs stay OFL 1.1. Describe the archive as a test fixture, but add no term that limits its use (ODbL §4.7(a), §4.8; CC BY 4.0 §2(a)(5)(B); OFL condition 5).
- **T5. Never in the app.** The fixture lives in the git-ignored `.cache/basemap-fixture/`, outside `app/`. `tests/fixtures/basemap-fixture.lock.json` holds only its tag, file name, size and SHA-256.
- **T6. New content, new check.** If a re-recording adds a host, a kind of file, or glyph ranges above U+02FF, the Fact-Checker re-checks the notices before it is published.
```
Also refresh **L8** with the new wording: "Do not collect data from the public instance in automated ways. Its ToS (updated 2026-10-14) forbids this ('Collect data from the service in automated ways, except for offline downloads as described below'). The only exception is in-app offline downloads of at most 3,000 tiles or 50 MB, with at most 4 parallel requests and a unique User-Agent."

### 10.5 What has to change in the engineer's branch
1. **OpenFreeMap source (blocker):** don't publish `store-2026-10-22` unless OpenFreeMap's permission covers it. The worktree's `tests/fixtures/basemap-fixture.lock.json` already points at tag `test-fixture-basemap-2026-10-22`, asset `basemap-fixture-2026-10-22.tar`: SHA-256 `0348a4d6…`, 36,815,872 bytes, 413 files, no notice files. That archive must not be published as it is. On 2026-10-22, `gh release list` showed no releases, so nothing has been published yet. Change `scripts/record-basemap.mjs` and `docs/TESTING.md` §8 ("Re-record flow") to Option A or Option B (§11).
2. **`scripts/pack-basemap-fixture.mjs`:** add `NOTICE.md` and `LICENSES/` (§10.3) to the tar, with the placeholders filled in. Print `--notes-file <file>` with the §10.2 notes and title instead of `--notes "Basemap replay fixture for browser tests. Not an app release."`.
3. **`scripts/lib/basemap-fixture.mjs`:** `verifyFixtureDirectory()` checks `entries.length !== lock.files - 1`, which fails once the notice files are added. Count the files in `responses/` instead, or store the number of entries in the lock.
4. **`ATTRIBUTION.md`:** replace the draft "Test fixtures (M5-22 browser replay)" section with §10.1. The draft has several errors:
   - It lists files the archive doesn't hold: the style JSONs, and `/planet/<version>/tiles.json`.
   - It gives a wrong relief URL: `tiles/raster/<z>/<x>/<y>.webp`, where the real one is `natural_earth/ne2sr/{z}/{x}/{y}.png`.
   - It marks the sprite licences "unconfirmed"; they are now confirmed (§5).
   - It leaves out ESA WorldCover and the ODbL link.
   - It names the asset but not the tag.

## 11. Blocker and how to clear it
**Blocker:** OpenFreeMap ToS, "User Conduct", 2026-10-14: "You will not: … Collect data from the service in automated ways, except for offline downloads as described below." Either option clears it. The PO chooses.

- **Option A: take the OpenFreeMap files from OpenFreeMap's public downloads (no permission needed).** OpenFreeMap offers these files for download (O6), so downloading them is their offered use.
  - **Vector tiles:** read the needed tiles by byte range from `https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles`, using the build the TileJSON names. For example, use the `pmtiles` library's `getZxy`, or `pmtiles extract` with a bounding box and maximum zoom. In record mode, the network guard could answer OpenFreeMap tile requests from that file instead of the network. Builds are kept for about 4 weeks (plus the first run of each of the last 6 months), so record soon after picking a build.
  - **TileJSON:** build it from the PMTiles metadata (`vector_layers`, `attribution`), with `tiles` pointing at `/planet/<version>/{z}/{x}/{y}.pbf`.
  - **Glyphs, sprite and relief tiles:** take them from `https://assets.openfreemap.com/` (`fonts/ofm.tar.gz`, `sprites/ofm_f384.tar.gz`, `natural_earth/ofm.tar.gz`), or from upstream. The glyphs (maplibre/demotiles) and the sprite (openfreemap-styles) on GitHub match byte for byte. The relief tiles come from lukasmartinelli/naturalearthtiles.
  - The engineer should check that a sample of PMTiles tiles decodes to the same bytes as the recorded ones.
- **Option B: ask OpenFreeMap for written permission (simplest technically).** The ToS invites contact at info@openfreemap.org. Quote the reply, with its date, in `docs/LICENSES.md` (T1) and in the release notes. Draft for the human or PO to send (I can't send it):
  > Hello. Interactive Bible Map (https://interactive-bible-map.pages.dev, source https://github.com/jameshuangdevelop/interactive-bible-map) uses OpenFreeMap as its basemap. To stop our browser tests loading your tiles on every CI run, we'd like to record, once, the responses our test suite loads. That's about 390 files and 35 MB: the planet TileJSON, vector tiles from zoom 3 to 12, three Noto Sans glyph stacks and the ofm_f384 sprite. We'd use at most 4 parallel requests and a User-Agent that names the project, and re-record a few times a year. We'd publish the recording as a pre-release asset in our public GitHub repository so CI can download it, with the OpenStreetMap (ODbL), OpenMapTiles (CC BY 4.0) and font (OFL) notices. Is this OK under your Terms of Service? Thank you.

Under either option, the §10 notices are still needed.

## 12. Side findings (not blocking)
- `docs/LICENSES.md` L8 and `docs/verification/M3-basemap.md` row 3 quote OpenFreeMap's old ToS (O4). Refresh them as in §10.4.
- `ATTRIBUTION.md` (VersaTiles row) and `docs/LICENSES.md` F6 quote VersaTiles' hosted tiles as "for prototyping and small projects". Today's docs call `tiles.versatiles.org` "a demo server … free and open to everyone, but it comes without any guarantees" (V2). The outage-only rule still fits, but refresh the quote at the next licence update.
- **Not a licence issue, for the Frontend Engineer:** on the backup map, the app's own labels ask VersaTiles for the fontstacks `Noto Sans Bold` and `Noto Sans Regular` (`app/src/features/map/map-view.web.tsx`, for example `placeNameFontExpression`). They returned 404 in today's recording (G3), because VersaTiles names its fonts `noto_sans_regular` and so on. The app's place names may not draw on the backup map.
- `osmdata.openstreetmap.de`, which supplies the OSM water polygons that OpenMapTiles uses, did not respond on 2026-10-22, so I couldn't read its licence page. planetiler-openmaptiles calls it the "OSM water polygons source". It is OpenStreetMap data, so the ODbL notice covers it. The lake centrelines in the same tiles (`acalcutt/osm-lakelines`, code MIT) are also built from OSM data.

## 13. Sources (all read 2026-10-22)
- OpenFreeMap: <https://openfreemap.org/tos/> (Last Updated October 14, 2026); <https://web.archive.org/web/20260916103721/https://openfreemap.org/tos/> (September 9, 2026 version); <https://openfreemap.org/>; <https://openfreemap.org/quick_start/>; <https://github.com/hyperknot/openfreemap> (README); <https://github.com/hyperknot/openfreemap/blob/main/LICENSE.md>; <https://tiles.openfreemap.org/planet>; <https://btrfs.openfreemap.com/files.txt>; <https://assets.openfreemap.com/files.txt>.
- openfreemap-styles (commit `6e53612`): `LICENSE.md`, `styles/liberty/LICENSE.md`, `styles/bright/LICENSE.md`, `fonts/README.md`, `fonts/collect.sh`, `sprites/create_sprites.sh`, `sprites/sprites/ofm_f384/`, `natural_earth/collect.sh` — <https://github.com/hyperknot/openfreemap-styles>.
- VersaTiles: <https://versatiles.org/>; <https://docs.versatiles.org/guides/use_tiles_versatiles_org.html>; <https://docs.versatiles.org/basics/tilesets.html>; <https://download.versatiles.org/>; <https://tiles.versatiles.org/tiles/osm/tiles.json>; <https://github.com/versatiles-org/versatiles-style> (README, `SPRITES.md`, `LICENSE.md`, `icons/LICENSE.md`, `icons/unknown/source.json`, release v7.0.1); <https://github.com/versatiles-org/versatiles-fonts> (README, `fonts/Noto Sans/`).
- Shortbread: <https://shortbread-tiles.org/copyright/>.
- ODbL 1.0: <https://opendatacommons.org/licenses/odbl/1-0/>; plain text <https://opendatacommons.org/licenses/odbl/odbl-10.txt>.
- OSMF: <https://www.openstreetmap.org/copyright>; <https://osmfoundation.org/wiki/Licence/Attribution_Guidelines>; <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline>; <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Collective_Database_Guideline_Guideline>; <https://osmfoundation.org/wiki/Licence/Community_Guidelines/Substantial_-_Guideline>; <https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ>; <https://osmfoundation.org/wiki/OSMF_updates/2020-08/Licensing_Working_Group_Overview>; <https://operations.osmfoundation.org/policies/vector/>.
- OpenMapTiles and Planetiler: <https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md>; <https://github.com/openmaptiles/planetiler-openmaptiles> (README, `OpenMapTilesMain.java`); <https://github.com/onthegomap/planetiler> (README); <https://github.com/acalcutt/osm-lakelines>.
- Fonts: <https://github.com/maplibre/demotiles> (`LICENSE`, `font/Noto Sans */LICENSE.md`, PR #12); <https://github.com/openmaptiles/fonts> (README, `noto-sans/LICENSE`, `noto-sans/NotoSans-Regular.ttf`); <https://github.com/notofonts/latin-greek-cyrillic/blob/main/OFL.txt>; <https://github.com/google/fonts/blob/main/ofl/notosansjp/OFL.txt>; <https://openfontlicense.org/ofl-faq/>.
- Icons: <https://github.com/mapbox/maki/blob/main/LICENSE.txt>; <https://github.com/rapideditor/temaki/blob/main/LICENSE.md>; Commons API for `File:Arrowright.svg`.
- Natural Earth: <https://www.naturalearthdata.com/about/terms-of-use/>; <https://github.com/lukasmartinelli/naturalearthtiles>.
- ESA WorldCover: <https://esa-worldcover.org/en/data-access>.
- Creative Commons: <https://creativecommons.org/licenses/by/4.0/legalcode.en>.
- Project files (origin/main `d1c94e2`): `docs/tasks/M5-22-tests-without-network.md`, `ATTRIBUTION.md`, `docs/LICENSES.md`, `docs/verification/M3-basemap.md`, `app/src/features/search/sources-credits-content.ts`, `app/public/styles/*/style.json`, `app/public/styles/liberty/LICENSE.txt`. Worktree `.worktrees/m5-22` (uncommitted, read-only): `scripts/record-basemap.mjs`, `scripts/pack-basemap-fixture.mjs`, `scripts/lib/basemap-fixture.mjs`, the `ATTRIBUTION.md` and `docs/TESTING.md` diffs. Recording: `/tmp/m5-22-basemap-fixture/store-2026-10-22/manifest.json` (generated 2026-10-23T06:50:20Z).

**Budget row (for the PO; rough estimate):** | 2026-10-22 | fact-checker | Claude (Copilot CLI) | M5-22 fixture licence check (read-only) | ≈6M in (mostly cached) / ≈45k out | ≈1,500 |

## 14. Sign-off (2026-10-23)

**Verifier:** Fact-Checker (Claude, Copilot CLI) · **Date:** 2026-10-23 · **What I checked:**
- the archive `/tmp/m5-22-basemap-fixture/basemap-fixture-2026-10-23.tar`;
- commit `163c7e8` on `chore/m5-22-tests-without-network`;
- the release-notes draft `.git/M5-22-release-notes.md`.

This was a focused check: no licence was re-researched. It replaces the line "Sign-off: not given yet" at the top of this report.

**Result: signed off.** The archive is SHA-256 `08fb2d6b6d61b9afd3d66010d05872bb50d62f5f608cbe490a5afa450df0ef40` (79,912,960 bytes, 1,213 files). Publish it with the release notes in §14.3, not the draft. The blocker in §11 is cleared: no OpenFreeMap file came from `tiles.openfreemap.org`. Before the PR merges, make the two docs-only fixes in §14.2; they don't change the archive.

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 1 | The archive's SHA-256 | **Pass** | `shasum -a 256` gives `08fb2d6b…ef40`. Size: 79,912,960 bytes. The 1,213 files are `manifest.json`, `NOTICE.md`, 3 files in `LICENSES/` and 1,208 responses. The lock file at `163c7e8` names the same tag (`test-fixture-basemap-2026-10-23`), asset, SHA-256, size and file count. |
| 2 | `NOTICE.md` and `LICENSES/` match §10 | **Pass, with 2 errata** | `NOTICE.md` is §10.3's text with the blanks filled in. `LICENSES/OFL-1.1-Noto-Sans.txt` has §10.3's header lines, and its OFL 1.1 text is identical to versatiles-fonts' `LICENSE`. `LICENSES/OpenFreeMap-sprite.txt` is the intro line plus parts (b)–(e) of `app/public/styles/liberty/LICENSE.txt`, identical line for line. `LICENSES/ODbL-1.0.txt` is byte-identical to <https://opendatacommons.org/licenses/odbl/odbl-10.txt> (SHA-256 `60768071…`). **Errata.** These come from my own §10.3 template; they describe the sources, not the licences. (a) `NOTICE.md` names <https://assets.openfreemap.com/> as a source, but nothing was fetched from it. (b) It says every body is "stored as received", but the TileJSON was built by the recorder from the planet PMTiles' metadata (its attribution and `vector_layers` copied unchanged). Every required notice is present and correct, so the archive can be published as it is. The release notes give the exact account (§14.3), and `NOTICE.md` gets corrected at the next re-record (§14.2, fix 4). |
| 3a | Release-notes draft | **Needs change: publish §14.3 instead** | Its licence section is §10.2 word for word: the ESA credit and citation, "not covered by the repository's MIT licence", and no use restriction. But its source lines repeat errata (a) and (b). They also say the fonts, the sprite "and relief tiles" came "from https://assets.openfreemap.com/ or their upstream repositories". The archive holds no relief tiles, and nothing came from that bucket. |
| 3b | `ATTRIBUTION.md` "Test fixtures" entry | **Pass on content; 2 docs fixes before merge** | It is §10.1 word for word, including ESA, the not-MIT statement and no use restriction. (i) It points to `docs/LICENSES.md`, "Test fixtures (M5-22)", but `163c7e8` doesn't add that section. (ii) The OpenFreeMap row says the files come from OpenFreeMap's public downloads or with its permission, yet the glyphs and sprite came from their upstream repositories. Text for both is in §14.2. |
| 4 | The record path takes OpenFreeMap files per Option A | **Pass** | See §14.1. |
| 5 | Old ToS quotes updated | **Pass** | `docs/LICENSES.md` L8 and `docs/verification/M3-basemap.md` row 3 now quote the ToS of 2026-10-14 ("Collect data from the service in automated ways, except for offline downloads"). Optional nit: L8 closes its quote after "offline downloads.", but the ToS continues "as described below". |

### 14.1 Evidence for check 4 (the record path)
- **Code at `163c7e8`.** In record mode, `context.route("**/*")` in `tests/browser/network-guard.mjs` answers every request to `tiles.openfreemap.org` with `loadOpenFreeMapPublicResponse()`:
  - **Vector tiles:** read by byte range from `https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles`.
  - **TileJSON:** built from that same file's metadata.
  - **`ofm_f384` sprite:** from `raw.githubusercontent.com/hyperknot/openfreemap-styles`.
  - **Glyphs:** from `demotiles.maplibre.org`.
  - **Relief tiles:** from `raw.githubusercontent.com/lukasmartinelli/naturalearthtiles` (none were recorded).
  - **Any other OpenFreeMap URL** throws "No public-source mapping configured", and errors are rethrown rather than passed to the network. No path sends a request to `tiles.openfreemap.org`.
- **Every context is guarded.** The automatic `runtimeGuards` fixture (`tests/browser/fixtures.mjs`, `auto: true`) wraps `browser.newContext`, which `browser.newPage` also goes through. Both spec files import `test` from `./fixtures.mjs`. The guard bypasses only local hosts, and the app registers no service worker that could get round it.
- **Upstream fetches** run at most 4 at a time, with the User-Agent `interactive-bible-map-test-fixture (+https://github.com/jameshuangdevelop/interactive-bible-map)`.
- **Data in the archive:**
  - None of the 1,026 OpenFreeMap entries carries the live server's headers (the `W/"386d3570-…"` ETags, the 1999 `Last-Modified` and `max-age=604800` that the direct recording of 2026-10-22 showed).
  - 1,016 entries (1,015 tiles and the TileJSON) carry the recorder's PMTiles headers. 8 carry GitHub Pages headers (the glyphs) and 2 carry raw.githubusercontent.com headers (the sprite).
  - All 8 glyph files and both sprite files match, byte for byte, the files OpenFreeMap served on 2026-10-22. VersaTiles' `base` sprite still matches versatiles-style v7.0.1.
  - Sample tiles decode as valid vector tiles (OpenMapTiles layers; Shortbread with land cover).
  - The 2026-10-22 recording from the public instance is no longer in `/tmp/m5-22-basemap-fixture/`.
- **Note:** `recordModeUpstreamFetchCounts` in `manifest.json` is not a full count. The manifest writer merges the entries of every worker process that writes the manifest, but keeps only the last process's counts. For example, VersaTiles shows 174 fetches against 182 VersaTiles entries. The counts support the finding; the proof is the code and the headers.
- This pass covers the record path at `163c7e8`. The uncommitted changes now in the worktree (how a missing tile is answered in replay) don't touch it. If the record path changes, re-check it before the next re-record (§10.4, T6).

### 14.2 Fixes before merge (docs only; the archive doesn't change)
1. **`docs/LICENSES.md`:** add the section that `ATTRIBUTION.md` points to. Use §10.4's text, with T1 replaced by:
   > **T1. How the OpenFreeMap files are obtained.** Never by recording from `tiles.openfreemap.org`. OpenFreeMap's Terms of Service (updated 2026-10-14) forbid collecting data from the service in automated ways, except for in-app offline downloads. In record mode, the recorder (`tests/browser/network-guard.mjs`) works like this:
   > - It reads vector tiles from OpenFreeMap's public planet download (`https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles`), and builds the TileJSON from that file's metadata.
   > - It takes the glyphs from maplibre/demotiles and the `ofm_f384` sprite from hyperknot/openfreemap-styles. These are the same files OpenFreeMap serves.
   > - It fails on any other OpenFreeMap URL.
   > Record from the public instance only with OpenFreeMap's written permission, quoted here with its date.
2. **`ATTRIBUTION.md`**, the OpenFreeMap row of "Test fixtures":
   - Replace: "The files come from OpenFreeMap's public downloads, or from its public instance only with its written permission: since 2026-10-14 its ToS forbids collecting data from the service in automated ways, except for in-app offline downloads."
   - With: "The files come from OpenFreeMap's public planet download (the vector tiles, and the TileJSON built from its metadata) and from the files' upstream repositories (glyphs: maplibre/demotiles; sprite: hyperknot/openfreemap-styles). None come from its public instance: since 2026-10-14 its ToS forbids collecting data from the service in automated ways, except for in-app offline downloads."
3. *(Optional)* `docs/LICENSES.md` L8: make the quote exact: "…except for offline downloads as described below".
4. **At the next re-record** (the `NOTICE.md` template in `scripts/pack-basemap-fixture.mjs`):
   - Replace the "OpenFreeMap files:" line with: "OpenFreeMap files: nothing was fetched from https://tiles.openfreemap.org. Vector tiles: read from OpenFreeMap's public planet download (https://btrfs.openfreemap.com/areas/planet/<version>/tiles.pmtiles). TileJSON: built by this project's recorder from that file's metadata, with its attribution and layer list unchanged. Glyphs: from maplibre/demotiles (https://demotiles.maplibre.org/font/). Sprite: from hyperknot/openfreemap-styles (https://github.com/hyperknot/openfreemap-styles/tree/main/sprites/sprites/ofm_f384). Relief tiles, if any: from https://github.com/lukasmartinelli/naturalearthtiles."
   - Replace "Each body is stored as received, unmodified, and compressed with gzip." with "Apart from the TileJSON, each body is stored unmodified, as received from the sources above, and compressed with gzip."
5. *(Optional, code)* Make `recordModeUpstreamFetchCounts` add up across worker processes, so the counts in the manifest are complete.

### 14.3 The release to publish
- **Tag:** `test-fixture-basemap-2026-10-23`. Mark it as a pre-release (`--prerelease`).
- **Asset:** `basemap-fixture-2026-10-23.tar`. After uploading, check that the downloaded asset's SHA-256 is `08fb2d6b6d61b9afd3d66010d05872bb50d62f5f608cbe490a5afa450df0ef40`.
- **Title:** `Test fixture: recorded basemap responses, 2026-10-23 (not an app release)`
- **Notes** (exact text; pass it with `--notes-file`):

```markdown
**Test fixture, not an app release.** This archive holds the basemap responses that the browser tests of Interactive Bible Map replay, so the tests don't depend on the network. It is not part of the app and is never deployed with it.

- File: `basemap-fixture-2026-10-23.tar` · SHA-256 `08fb2d6b6d61b9afd3d66010d05872bb50d62f5f608cbe490a5afa450df0ef40` · 79,912,960 bytes · 1,213 files
- Recorded: 2026-10-23. OpenFreeMap planet build: `20261018_080001_pt`.
- Contents: 1,208 responses. From OpenFreeMap: 1,015 vector tiles, the TileJSON, 8 glyph ranges and 2 sprite files. From VersaTiles: 174 vector tiles, 3 glyph ranges, 2 sprite files and 3 "not found" (404) replies.
- OpenFreeMap files: nothing was fetched from OpenFreeMap's public tile service (tiles.openfreemap.org). The vector tiles were read from OpenFreeMap's public planet download for that build (https://btrfs.openfreemap.com/areas/planet/20261018_080001_pt/tiles.pmtiles). This project's recorder built the TileJSON from the same file's metadata, with its attribution and layer list unchanged. The label glyphs come from maplibre/demotiles (https://github.com/maplibre/demotiles) and the `ofm_f384` sprite from hyperknot/openfreemap-styles (https://github.com/hyperknot/openfreemap-styles). They are the same files OpenFreeMap serves. This archive holds no relief tiles.
- VersaTiles files: recorded from https://tiles.versatiles.org.
- Apart from that TileJSON, each response body is stored unmodified, as received from the sources above, and compressed with gzip. `manifest.json` maps each URL to its file. `NOTICE.md` and the `LICENSES/` folder inside the archive give the full notices. Two lines of `NOTICE.md` describe the sources less exactly: they name https://assets.openfreemap.com/, from which nothing was taken, and they say every body is stored as received. The list above is the exact account.

**Licences.** This archive is not covered by the repository's MIT licence or by the project's CC BY-SA 4.0 data licence. Each part keeps its own licence:

- **OpenStreetMap data (all vector tiles):** Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License 1.0 (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). The tiles are an unmodified extract of the tilesets that OpenFreeMap and VersaTiles publish, and this archive holds the whole extract. The full tilesets: [OpenFreeMap planet downloads](https://btrfs.openfreemap.com/files.txt) and [VersaTiles downloads](https://download.versatiles.org/).
- **OpenFreeMap tiles and TileJSON:** [OpenFreeMap](https://openfreemap.org) [© OpenMapTiles](https://www.openmaptiles.org/) Data from [OpenStreetMap](https://www.openstreetmap.org/copyright). OpenMapTiles schema © MapTiler.com & OpenMapTiles contributors: design [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), code [BSD 3-Clause](https://github.com/openmaptiles/openmaptiles/blob/master/LICENSE.md). Low-zoom data from [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- **VersaTiles tiles:** [VersaTiles](https://versatiles.org) © OpenStreetMap contributors (ODbL 1.0), in the [Shortbread](https://shortbread-tiles.org/) schema (CC0 1.0). Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), through VersaTiles' [Landcover Vectors](https://github.com/versatiles-org/landcover-vectors) (CC BY 4.0). Dataset: Zanaga, D., Van De Kerchove, R., Daems, D., De Keersmaecker, W., Brockmann, C., Kirches, G., Wevers, J., Cartus, O., Santoro, M., Fritz, S., Lesiv, M., Herold, M., Tsendbazar, N.E., Xu, P., Ramoino, F., Arino, O., 2022. ESA WorldCover 10 m 2021 v200. https://doi.org/10.5281/zenodo.7254221
- **Label glyphs:** Noto Sans, under the [SIL Open Font License 1.1](https://openfontlicense.org/). The copyright notices and the licence text are in `LICENSES/OFL-1.1-Noto-Sans.txt`.
- **Icons:** OpenFreeMap's `ofm_f384` sprite ([openfreemap-styles](https://github.com/hyperknot/openfreemap-styles), MIT; icons from the Liberty and OSM Bright styles, BSD 3-Clause and CC BY 3.0/4.0; [Maki](https://github.com/mapbox/maki), CC0 1.0). Full notices are in `LICENSES/OpenFreeMap-sprite.txt`. VersaTiles' `base` sprite ([versatiles-style](https://github.com/versatiles-org/versatiles-style)), CC0 1.0.

The licensors provide this material as is, without warranty. See each licence.
```

**Budget row (for the PO; rough estimate):** | 2026-10-23 | fact-checker | Claude (Copilot CLI) | M5-22 fixture sign-off (focused, read-only) | ≈2M in (mostly cached) / ≈15k out | ≈400 |
