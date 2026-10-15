# M5-04 verification: the routes' lines

Independent verification of the GIS Engineer's work on branch `data/m5-route-lines`, commits `7914de4` and `a83f987` on top of `data/m5-jesus-journeys`: the 71 lines in `data/geo/routes-lines.geojson` (51 for Paul's four routes, 20 for Jesus' segments), the `lineId`s added to `data/routes/routes.json`, `scripts/build-route-lines.mjs` with its pinned inputs (`scripts/lib/route-line-inputs.mjs`), `scripts/check-route-lines.mjs`, and the new route-line checks in `scripts/lib/validator.mjs`. I checked them against card `docs/tasks/M5-04-route-lines.md`, ADR-0038 (items 1, 4 and 5, and the update of 2026-10-13), ADR-0037 item 5, ADR-0012 and ADR-0017. Verified by the Fact-Checker (Claude Opus 5.5) on 2026-10-14.

**Result: needs GIS fixes.** *Re-checked on `e00057e`: still needs GIS fixes (§10). Final check of `f2fe526` and `098d3c1`: all pass, with notes on what only the basemap shows (§11).* The licences pass, and I added the attribution they need. The rules pass: every stage has a line or a stated reason, every "path not known" line is straight, every line ends at its stops' sites, and every road followed is one AWMC dates to the Roman period. But 20 of the 25 lines by sea cross land, most of them by many kilometres and at the zoom the route opens at: Ephesus → Caesarea runs 295 km over Caria and Lycia, two lines run about 90 km across Cyprus, Cenchreae → Ephesus crosses Attica and Andros, and the boat crossing of the Sea of Galilee is drawn as a 90 km loop to the Mediterranean coast. The provenance names features the lines don't use, and placeholder ids.

| Item | Pass | Needs change | Fail |
|---|---|---|---|
| Licences (AWMC, ORBIS, Natural Earth, the stops' coordinates; Itiner-e not used) | 4 | 0 | 0 |
| Attribution (`ATTRIBUTION.md`, `docs/LICENSES.md`, the app's credits) | — | 3 (made in this commit) | 0 |
| Every stage has a line or a reason (83 stages) | 83 | 0 | 0 |
| "Path not known" lines are straight (19) | 19 | 0 | 0 |
| Stages with `noLineReason` have no line (12) | 12 | 0 | 0 |
| Ends at the stops' sites (71 lines) | 71 | 0 | 0 |
| Lines by land (27): 24 straight, 3 on AWMC roads | 26 | 1 (Thessalonica → Berea, G6) | 0 |
| Lines by sea (25) | 5 | 0 | 20 cross land (G1–G4) |
| Places passed (`via`) on sea lines (7 in 5 stages) | 4 | 1 (Cauda, crossed rather than passed) | 2 (Cyprus, crossed in both stages) |
| Detours (25 sea lines) | 24 | 0 | 1 (the Sea of Galilee, 13× the crossing) |
| Provenance (71 lines) | — | 71 (P1–P8) | 0 |
| Pinned inputs, rebuilt byte for byte from an empty cache | 1 | 0 | 0 |
| Routes payload within 100,000 bytes gzip | 1 (26,718 bytes) | 0 | 0 |
| Pipeline and checks | — | G1–G10 | — |

"Fail" means a line breaks a rule in a way the map shows. "Needs change" means a line, its record or the pipeline is wrong or incomplete in a way the map doesn't show.

## 1. Method
- **Scripts of my own**, outside the repository, that read the committed files and the pinned inputs, and share no code with the builder or the validator. The inputs in the build's cache match the pinned SHA-256s: ORBIS `orbis_nodes_0514.csv` (`4c331dff…`) and `orbis_edges_0514.csv` (`9f50bff2…`), Natural Earth 10 m land (`1ac90796…`) and coastline (`6f75ae0e…`), and Natural Earth 10 m lakes (`2d036f53…`, pinned by `build:ancient-geo`), which I downloaded from commit `ca96624` to treat the Sea of Galilee as water.
- **Land test.** MapLibre draws each segment of a line straight in Web Mercator, so I tested segments in Web Mercator against two coastlines. (1) Natural Earth 10 m land less its lakes, the builder's own pinned input: exact segment–polygon intersection, measuring each stretch over land in kilometres. (2) What the map shows: from zoom 6 the basemap draws OpenStreetMap's water, so I sampled every segment every 100 m against the `water` layer of OpenFreeMap's tiles at zoom 10 (planet build `20261011_080001_pt`, 261 tiles). The two agree on every large crossing. Where they differ, the table in §5.1 gives the basemap's figure: Natural Earth's coast is generalised, so it misses Punta Campanella and overstates the Didyma shore, for example. The builder and the validator sample points every 8–10 km against `ancient-areas.geojson` instead.
- **Zoom.** At zoom *z*, a pixel covers about 156,543 × cos(latitude) / 2*ᶻ* metres: about 1.0 km at zoom 7 and 0.25 km at zoom 9 around 37° N. A crossing of 2 km or more shows at zoom 7, the zoom of the build's previews, and anything over about 0.5 km shows once a reader zooms in on a stop.
- **Previews.** I looked at the build's seven previews and rendered eleven of my own in Web Mercator at zooms 7 to 9.5, with land filled. The build's previews are equirectangular plots of coastlines without land fill: "zoom-aegean-z7" is about zoom 7.3 across but squashed about 1.7× from top to bottom, and "zoom-holy-land-z7" about zoom 8.5 across and squashed about 3×. Even so, they show Ephesus → Caesarea over Caria (`paul-2.png`), Cenchreae → Ephesus over Attica, and the Galilee loop.
- **Roads, ORBIS and ends.** I matched every vertex of the road lines to `data/geo/ancient-roads.geojson`, re-ran ORBIS's sea network myself, and compared each line's first and last vertex with its stops' chosen candidates.

## 2. Licences
| Source | Licence, read at the source | Compatible? | How it enters the lines |
|---|---|---|---|
| AWMC Geodata's roads, through `data/geo/ancient-roads.geojson` (commit `7ecf8bc`) | ODbL 1.0 (read for M4-03 at the same commit) | Yes | Three lines by land follow its roads (§4), so `routes-lines.geojson` is a Derivative Database under ODbL §4.4 and stays ODbL 1.0, as `data/geo/` is under ADR-0012. |
| ORBIS (v2) Network Edge and Node Tables, `orbis_nodes_0514.csv` and `orbis_edges_0514.csv`, <https://purl.stanford.edu/mn425tz9757> | CC BY 3.0 Unported. The repository page (read 2026-10-14) says "This work is licensed under a Creative Commons Attribution 3.0 Unported license (CC BY)" and gives the preferred citation "Meeks, Scheidel, Weiland and Arcenas. (2014). ORBIS (v2) Network Edge and Node Tables. Stanford Digital Repository. Available at: http://purl.stanford.edu/mn425tz9757". It also says that edges have "source and target (but no geometry)". | Yes | CC BY 3.0 lets an Adaptation carry other terms: §4(a) limits how the Work itself is passed on, and §4(b) asks for the author, the title, the URI and "a credit identifying the use of the Work in the Adaptation" (legal code read 2026-10-14). So ORBIS-derived vertices may sit in an ODbL file with that credit. Today none do: no line uses an ORBIS lane, and no vertex inside a line is an ORBIS node (§5.3). The credit is still given, because the build reads ORBIS and the lines will need it once a lane is drawn. |
| Natural Earth 10 m land and coastline (commit `ca96624`) | Public domain. Terms of use re-read 2026-10-14: "All versions of Natural Earth raster + vector map data found on this website are in the public domain", and "No permission is needed to use Natural Earth. Crediting the authors is unnecessary." | Yes | The points where lines meet the coast. No condition. |
| The stops' coordinates, the first and last vertex of every line | Facts copied from the project's own records and stop entries. Their `coordinateSource`s are Wikidata (CC0), Pleiades (CC BY 3.0), OpenBible.info (CC BY 4.0) and, for Troas and Tyre, DARE (CC BY-SA 3.0). | Yes | A coordinate pair is a fact, and these ends are an insubstantial part of each upstream database; the choice of stops is the project's own, which it may license under ODbL. Nothing flows the other way: `routes.json` and `stops.json` stay CC BY-SA 4.0 and name lines only by `lineId`. The upstream credits are already in `ATTRIBUTION.md`. |
| Itiner-e | Not used: no script reads it, so no licence decision is needed. `docs/research/SOURCES.md` reports CC BY 4.0 from Zenodo's metadata; I couldn't confirm it (Zenodo's API refused the request, 403). | — | None |

**What I changed (ADR-0014 allows the Fact-Checker to fix licensing text and attribution):**
- `docs/LICENSES.md`: a new section, "Routes' lines (M5-04)", with each part's licence, the reasoning above, and obligations R1–R4; the `data/geo/` row, the ORBIS row of "Source compatibility", and the Itiner-e row now cover M5-04.
- `ATTRIBUTION.md`: the ORBIS row now gives its title, authors, year, licence version and use, with the credit for the adaptation; the AWMC and Natural Earth rows name the routes' lines; the introduction links this report.
- `app/src/features/search/sources-credits-content.ts`: the data-licence sentence names the routes' lines among the ODbL geometry, and the ORBIS entry gives its citation and licence (R2).

**For the Frontend Engineer (M5-05), not this branch:** R1. The Routes tab's line source must carry the ancient layer's ODbL notice (`docs/LICENSES.md`, A1) as its `attribution`. On the ancient map MapLibre shows it once; over the modern map it is the only place the notice appears.

## 3. The rules
- **Every stage has a line or a stated reason.** All 83 stages have exactly one of `lineId` and `noLineReason`, and each `lineId` matches one feature by route and stage. No feature is left over. `REQUIRE_ROUTE_LINES` is on. Pass.
- **"Path not known" stages (19) are straight:** each line is exactly [from, to], and none of these stages has a `via`. Jesus' segments that start or end at a region (`galilee`, `judea`) are drawn to its record's point, as the update of 2026-10-13 item 3 says. Pass.
- **Stages with `noLineReason` (12) have no line.** Pass.
- **Ends (71 lines).** Every line's first and last vertex lies within 0.05 m of its stops' chosen candidates. The four stops with more than one candidate use the ones verified earlier: `derbe` 0 and `malta` 0 (M5-02's verification), `jericho` 1, the record's "Gospel-era city", and `bethphage` 0, Et-Tur (M5-03's). Pass.

## 4. Lines by land (27)
**Roads.** Three lines follow AWMC roads: Neapolis → Philippi, Philippi → Amphipolis → Apollonia → Thessalonica, and Thessalonica → Berea. Every vertex between their ends lies on the roads their provenance lists in `ancient-roads.geojson`: `awmc-road-679-14`, `-1257-583`, `-1258-584`, `-1259-585` and `-1265-589`. AWMC dates all of them to the Roman period (`R`, or `RL` for `1259-585`) and marks them major, and none is among the seven roads that M4-03's verification found dated after AD 100. Pass.
- **Needs change (G6): Thessalonica → Berea.** No dated road reaches Berea: the nearest road vertex is 28.0 km away. The builder snaps a stop to any road within 35 km, so the line follows the road west for 68 km and then runs 28.0 km straight to Berea, 97.7 km against 64.6 km for the straight line. Under ADR-0038 item 5, a road is followed only "where one links the two stops", so this should be a straight line, or the PO should set a snapping distance. The 28 km is not recorded.
- The builder routes a road line from its first stop to its last and ignores `via`; it passes Amphipolis at 0.5 km and Apollonia at 3.9 km only because the road does. Routing leg by leg would guarantee it (G6).

**Straight lines (24).** For each, no dated road links the two stops: in the Holy Land, Cyprus and southern Greece AWMC dates none (ADR-0037, update of 2026-10-08), and in Asia Minor, the Troad and Italy the dated roads either pass far from the stops or don't connect them, even across gaps of up to 4 km (I joined every road end to any road within 4 km and searched again). Pass.
- **For the PO (Q2):** straight lines by land cross water. Puteoli → Forum of Appius runs 78 km of its 118 km over the sea, across the Gulf of Gaeta, and three of Jesus' segments cross the Sea of Galilee as solid "By land" lines: Nazareth → Capernaum for 6.2 km, Capernaum → Jerusalem for 11.5 km and Capernaum → Nain for 8.7 km. ADR-0038 item 5 allows straight lines, but readers may take them for crossings.

## 5. Lines by sea (25)
### 5.1 Land crossed
"Connector" is the straight piece from a stop's site to the coast that the builder adds when the site is inland; the validator allows it. Distances are over land as the basemap draws it (OpenStreetMap water, zoom 10), with Natural Earth's figure in brackets where it differs by more than 2 km. **Fail** means 2 km or more over land outside the connectors, which shows at zoom 7–9; shorter stretches where a line leaves or reaches a stop's site are noted.

| Stage | Line | Verdict | Over land, outside the connectors | Notes |
|---|---|---|---|---|
| `paul-1` 02 | Seleucia → Salamis | Pass | none | 0.3 km leaving Seleucia's site and 0.5 km reaching Salamis's |
| `paul-1` 04 | Paphos → Perga | Pass | none | 0.5 km leaving Paphos's site; 12.0 km connector to Perga, recorded |
| `paul-1` 14 | Attalia → Antioch | **Fail** | 6.7 km along Antalya's waterfront, leaving Attalia | Shows from about zoom 9. 24.2 km connector to Antioch, recorded. |
| `paul-2` 04 | Troas → Samothrace | **Fail** | 8.7 km across Tenedos; 1.4 km over the tips of Imbros and Samothrace | 1.3 km from Troas's site, unrecorded; 5.6 km connector to Samothrace's point, recorded |
| `paul-2` 05 | Samothrace → Neapolis | **Fail** | 2.8 km across Samothrace's western end | It leaves from the south coast, facing away from Neapolis. |
| `paul-2` 12 | Cenchreae → Ephesus | **Fail** | 4.2 km across Salamis, 27.0 km across Attica, 15.3 km across Andros | One straight segment at about 37.9° N; 5.9 km connector to Ephesus, recorded |
| `paul-2` 13 | Ephesus → Caesarea | **Fail** | 295 km across Caria and Lycia | One straight segment from the coast near Ephesus to Caesarea |
| `paul-3` 03 | Philippi → Troas | **Fail** | 17.6 km across Thasos, 8.3 km across Tenedos | 12.4 km connector from Philippi, recorded |
| `paul-3` 05 | Assos → Mitylene | **Fail** | 5.3 km over Lesbos's east coast | |
| `paul-3` 06 | Mitylene → Chios → Samos | **Fail** | 14.7 km across Lesbos south of Mitylene; 8.3 km over Chios's east coast | Passes Chios at 0.7 km; 5.8 km connector to Samos's point, recorded |
| `paul-3` 07 | Samos → Trogyllium | **Fail** | 11.4 km across the east of Samos | It leaves from Samos's north coast. |
| `paul-3` 08 | Trogyllium → Miletus | Pass | none | 1.4 km leaving Trogyllium's cape. Miletus was a port in the first century and lies inland today; the way in is the recorded 7.1 km connector plus 2.4 km of today's Maeander delta before it. |
| `paul-3` 09 | Miletus → Cos | Pass | none (Natural Earth: 8.0 km over the Didyma shore) | 2.9 km of the Maeander delta after the recorded 7.1 km connector from Miletus; 4.7 km connector to Cos's point, unrecorded |
| `paul-3` 10 | Cos → Rhodes | **Fail** | 10.0 km along Cos; 24.9 km across the Cnidian (Reşadiye) peninsula | 4.7 km connector from Cos's point, unrecorded |
| `paul-3` 11 | Rhodes → Patara | **Fail** | 2.5 km across the northern tip of Rhodes | |
| `paul-3` 12 | Patara → Cyprus → Tyre | **Fail** | 89.1 km across western Cyprus and 2.6 km on its south coast; 6.5 km on the Lycian coast by Patara | |
| `paul-3` 13 | Tyre → Ptolemais | **Fail** | 26.1 km inland, along the coast between them | |
| `paul-rome` 01 | Caesarea → Sidon | Pass | none | 0.2 km and 0.6 km at the two sites |
| `paul-rome` 02 | Sidon → Cyprus → Myra | **Fail** | 89.0 km across Cyprus, 2.6 km on its south coast | 4.2 km connector to Myra, unrecorded |
| `paul-rome` 03 | Myra → Cnidus → Crete → Salmone → Fair Havens | **Fail** | 77.5 km across Lycia west of Myra; 22.0 km across the Carian peninsulas before Cnidus; 3.0 km across Crete's eastern tip below Salmone | Passes Cnidus at 0.5 km and Salmone at 0 km |
| `paul-rome` 04 | Fair Havens → Cauda → Malta (the storm) | **Fail** | 5.2 km across Cauda, through the island's point; 19.0 km across Malta from east to west; 2.6 km along the shore leaving Fair Havens | Its exception skips land avoidance as well as ORBIS (G4). 4.9 km connector to Malta's point, unrecorded. |
| `paul-rome` 05 | Malta → Syracuse | **Fail** | 10.9 km back across Malta; 26.4 km across south-eastern Sicily | |
| `paul-rome` 06 | Syracuse → Rhegium | **Fail** | 3.4 km along the shore south of Rhegium | 1.1 km leaving Syracuse's site. The smallest failure; shows from about zoom 9. |
| `paul-rome` 07 | Rhegium → Puteoli | **Fail** | 3.4 km over Calabria in the Strait of Messina; 1.1 km across Punta Campanella | Natural Earth misses Punta Campanella. |
| `jesus` 15 | the Sea of Galilee → Magdala | **Fail** | about 83 km over Galilee | Both ends are joined to one point on the Mediterranean coast near Acre, 49 km from the lake's point and 42 km from Magdala, because the builder's "nearest coast" knows only the sea (G2). |

**Why the builder doesn't see it (G1, G8).** `shortestWaterSegment` tries a local grid search (skipped for legs over 400 km or 1,200 grid points), then a few perpendicular detours, then a detour through the coast at the midpoint, and if all of these cross land it returns the straight segment anyway. The change it records still says "constrained to avoid land". Its land test samples about every 8 km against `ancient-areas.geojson`, a coarser mask than Natural Earth's land, and the validator flags a segment only if it is longer than 120 km and at least half of its sample points are on land. Ephesus → Caesarea, about 295 km over land in a 917 km segment, passes that test.

### 5.2 Places passed, and the storm
- **In order:** every `via` is passed in order: Chios, Cnidus, Salmone, Cauda, and Crete's south coast from Salmone to Fair Havens. Pass, with two exceptions.
- **Fail: Cyprus, in both stages.** The builder replaces the island record's point with the nearest coast point, on the south coast near Amathus, and crosses the island from there. For `paul-3` 12, Acts 21:3 has the ship pass Cyprus "leaving it on the left hand" while sailing to Syria, which puts the island to the north of the line; the line should pass south of it without touching it. For `paul-rome` 02, the stage's own passage has the ship sail "across the sea which is off Cilicia and Pamphylia" (Acts 27:5), between Cyprus and Asia Minor, so the line should pass north of the island, not along its south coast (G3).
- **Needs change: Cauda.** The line runs through the island's point, so it crosses Cauda. Acts 27:16 has the ship run "under the lee of a small island called Clauda", past it (G3).
- **The storm stage (`paul-rome` 04) records why it ignores ORBIS**, in an `explicit-sea-detour-reason` change: "Acts 27:14–28:1 describes a storm-driven drift from off Crete past Cauda to Malta, not normal lane navigation." The reason is right, and Acts 27:15 supports it ("we gave way to it and were driven along"), but it cites `orbis:mn425tz9757` and the placeholder Natural Earth id rather than the passage (P8). The exception also turns off land avoidance (G4).

### 5.3 ORBIS
No line uses an ORBIS lane. Of the 31 legs in the 25 stages, 23 left ORBIS because its lane crossed land, 6 because no ORBIS path was found, and 2 by the storm's exception; none because of length. Re-running ORBIS's network myself:
- **The node table gives latitude in `x` and longitude in `y`** ("Roma", 41.892, 12.486). The builder tries both orders for every node and keeps whichever is cheaper, so a swapped node can win: `paul-rome` 01's provenance lists Cape Akamas and Lapethos, in Cyprus, for its line from Caesarea to Sidon, because read the wrong way round their coordinates fall near Caesarea and Sidon. In all, 14 lines list ORBIS nodes more than 150 km from the line they describe.
- **49 nodes are at (0, 0)**, among them seven of our ports: Paphos, Salamis, Seleukeia Pieria, Perge, Patara, Myra and Syracusae.
- **The edges have no geometry**, as the dataset says, so a lane drawn straight from node to node often crosses land: Tyrus → Ake-Ptolemais by 27.7 km, Kos → Rhodos by 24.0 km, Mytilene → Chios by 24.4 km.

Whether ORBIS should shape the lines is a question for the PO (Q1). Either way, the reader must use `[y, x]` and skip (0, 0) nodes, and provenance must list only what a line uses (G5, P3).

### 5.4 Detours
Because most lines cut across land, they are shorter than a real path over water, not longer. The one line far beyond its shortest water path is `jesus` 15: 90.4 km for a crossing of about 7 km, with no reason recorded beyond the two connectors. **Fail.** The detour check must be run again once the lines stay off land.

## 6. Provenance (needs change for all 71 lines)
Each line records a dataset, a version, upstream feature ids and changes, and every source id passes the schema, but:
- **P1.** `naturalearth:1159152091`, cited on every line by sea, is the example id from `schema/source-id.schema.json`. Natural Earth's 10 m land and coastline files have no `ne_id` field, so it names no feature.
- **P2.** Every road line cites `awmc:roads-objectid-0` for its change. AWMC's OBJECTID 0 is none of the roads used (OBJECTIDs 679, 1257, 1258, 1259 and 1265). Upstream ids give our own `roadId`s, not AWMC's `awmc:roads-objectid-…` and `awmc:roads-feature-…` ids, which `ancient-roads.geojson` records for each road.
- **P3.** 21 lines list ORBIS edges and nodes in `upstreamFeatureIds`, though none uses ORBIS (§5.3).
- **P4.** All 71 lines carry the same `dataset` and `version`, naming AWMC, ORBIS and Natural Earth, even the 43 straight lines that use none of them. The version gives Natural Earth's file paths without the pinned commit `ca96624`, and ORBIS's file names without their SHA-256.
- **P5.** Not every change is recorded: road connectors (28.0 km to Berea), coast connectors under 5 km (Malta 4.9 km, Cos 4.7 km, Myra 4.3 km, Troas 1.7 km, Mitylene 1.0 km and others), and the storm's straight legs.
- **P6.** "Used shortest-over-water fallback … constrained to avoid land" is recorded on lines that cross land (§5.1).
- **P7.** Straight lines cite the first two `sources` of each stop's candidate rather than its `coordinateSource`. The coordinate source of 55 line ends is cited nowhere in their line's provenance, for example `dare:21154` for Troas.
- **P8.** The storm's reason cites ORBIS and the placeholder id rather than the passages it rests on (`scripture:Acts 27:15`, `27:16`, `28:1`).

## 7. Back to the GIS Engineer
- **G1. Keep lines by sea off land.** Never fall back to a straight segment that crosses land. Find the path over water with a search that works at any length, for example a visibility graph or a fine grid on Natural Earth 10 m land less its lakes, and simplify it without letting it touch land. Keep it about 1 km off Natural Earth's coast outside the connectors, because the basemap draws OpenStreetMap's more detailed coast (Antalya's waterfront, Punta Campanella). Start and end each path at the coast facing the next stop, not the coast nearest to the stop's point (Samothrace, Samos, Cos, Rhodes, Malta).
- **G2. Lakes.** Lines on the Sea of Galilee must use its shore, from Natural Earth's lakes, not the sea's coast (`jesus` 15).
- **G3. Islands passed.** Pass Cyprus to its south in `paul-3` 12 (Acts 21:3) and to its north in `paul-rome` 02 (Acts 27:4–5), without crossing it, and pass Cauda rather than cross it (Acts 27:16).
- **G4. The storm stage.** Let the exception skip ORBIS only, not land avoidance, so the line passes Cauda and reaches Malta without crossing it.
- **G5. ORBIS.** Read nodes as `[y, x]`, skip nodes at (0, 0), and list in provenance only the edges and nodes a line draws.
- **G6. Roads.** Route each leg between consecutive stops, through `via`. Follow a road only where it links the stops, which the 35 km snap doesn't ensure (Thessalonica → Berea), and record every connector with its length.
- **G7. Provenance:** P1–P8.
- **G8. The checks.** Test segments exactly against Natural Earth 10 m land less its lakes, with the same clearance, not against the builder's own mask, and fail any stretch over land except a recorded connector, with no 120 km or 50% allowance. Compare the detour against a path from the same exact test.
- **G9. Previews.** Draw them in Web Mercator at the zoom they name, with land filled, so a crossing is visible.
- **G10. Itiner-e.** The card asked whether Itiner-e dates roads to the first century in the Holy Land, Cyprus, Crete and southern Greece. `docs/research/SOURCES.md` says it wasn't used, but not what was found.

When these are fixed, I'll re-check every line by sea, the provenance, and the licence of any new input.

## 8. Questions for the PO
- **Q1. ORBIS's role.** ADR-0038 item 5 says lines by sea follow ORBIS's lanes where they link the ports. No line does: ORBIS's edges have no geometry, seven of our ports have no coordinates in it, and drawn straight its lanes often cross land. Should the lines pass ORBIS's nodes in order, with paths over water between them, or should the ADR say that they follow the shortest path over water? If ORBIS stays unused, its credit can stay as the build's input.
- **Q2. Straight lines by land over water** (§4): keep them, or bend them along the shore?
- **Q3. R1** for M5-05: the Routes tab's line source needs the ODbL notice on both maps.

## 9. Checks run
- `npm run validate:data`: passed, 0 errors and 203 warnings, the same as after M5-03. Its route-line checks pass because they are too loose (§5.1, G8).
- `npm test`: 306 of 306 pass. `npm run test:app`: 22 suites, 159 tests pass. `npm run lint` and `npm run typecheck` pass with the credits change.
- `npm run check:route-lines`: "Reproduced route lines byte-for-byte from an empty cache." It downloaded ORBIS from the Stanford Digital Repository and Natural Earth from GitHub afresh, so the pinned SHA-256s still match the files at their URLs.
- `npm run build:data`: the four Routes files are 124,501 bytes, 26,718 bytes gzip (the lines 2,505), within ADR-0038's 100,000. Lines that go round land will need more vertices; there is room.

## 10. Re-check of `e00057e` (2026-10-14)
The PO answered Q1–Q3 with an update to ADR-0038 ("how the lines are drawn"): ORBIS is a cross-check only, lines by sea follow the shortest path over water through the places passed, no line crosses open water by land or land by sea, and Jesus' segments 10, 18 and 26 are "path not known". The GIS Engineer reworked the lines in `e00057e`, reporting 71 lines, none crossing land. I re-ran every check above on `e00057e` with the same scripts, against Natural Earth 10 m land less its lakes and against OpenStreetMap water from OpenFreeMap's tiles at zoom 10, and re-rendered the previews in Web Mercator.

**Result: still needs GIS fixes.** The Sea of Galilee, the pass south of Cyprus, Cauda, Berea, ORBIS and three of the provenance items pass. But 17 of the 25 lines by sea still cross land by 2 km or more, four lines by land cross water, and the validator's land check is switched off for 24 of the 25 lines by sea.

| Sent back | Result |
|---|---|
| G1. Lines by sea off land | **Fail, 17 of 25.** Over land outside the connectors, by the basemap's coast (Natural Earth's figure in brackets where it differs by more than 2 km): `paul-2` 04, 22.1 km across Imbros and Samothrace; 05, 11.6 km across Samothrace; 12, 117.6 km across the Argolid peninsula and Hydra, Sifnos, Antiparos, Paros, Naxos and Samos; 13, 136.1 km south from Ephesus across Mycale, the Maeander plain and the Bodrum peninsula, then across Rhodes and Cyprus at Paphos. `paul-3` 03, 15.3 km across Imbros; 05, 17.0 km across Lesbos; 06, 39.3 km across Lesbos, Chios and Samos; 07, 15.8 km across Samos; 09, 24.6 km over the Didyma shore and across Kos; 10, 56.0 km across Kos, Tilos and Rhodes; 11, 8.8 km across Rhodes's northern tip. `paul-rome` 02, 14.7 km across the Karpas peninsula of Cyprus; 03, 130.1 km across Lycia by Myra, Rhodes's north-east coast and Crete, from Salmone straight across to the south coast (85.5 km); 04, 17.0 km across Malta; 05, 12.6 km across Malta and the shore by Syracuse (16.4 km); 06, 7.6 km along the shore south of Rhegium (10.4 km); 07, 59.7 km across Calabria, through a waypoint inland at 15.8° E 38.0° N in Aspromonte, then Ischia and Procida. **Pass:** `paul-1` 02, 04 and 14, `paul-3` 08, 12 and 13, `paul-rome` 01 and `jesus` 15. |
| ADR-0038 update, item 2: lines by land off water | **Fail, 4.** Nazareth → Capernaum still crosses 6.1 km of the Sea of Galilee, Capernaum → Jerusalem 10.1 km and Capernaum → Nain 10.1 km; Capernaum → Nain also runs 20 km south past Nain and back (72.8 km against 34.7). Puteoli → Rome still crosses 18.1 km of the Gulf of Gaeta, and its waypoints replace its places passed: the line now misses the Forum of Appius by 6.2 km and Three Taverns by 5.3 km (Acts 28:15). Thessalonica → Berea goes round the gulf: pass. The Via Egnatia line runs 3.5 km over the sea by Natural Earth's coast at Asprovalta, within the accuracy of AWMC's road and Natural Earth's coast: noted, not failed. |
| G2. The Sea of Galilee | **Pass.** `jesus` 15 crosses the lake in 7.0 km, with a recorded 0.2 km connector to Magdala. |
| G3. Islands passed | **Pass:** `paul-3` 12 passes south of Cyprus without touching it (Acts 21:3), and the storm line passes Cauda 9.7 km to the south (Acts 27:16). **Fail:** `paul-rome` 02 passes north of Cyprus (Acts 27:4–5) but crosses the Karpas peninsula for 14.7 km. |
| G4. The storm stage | **Fail.** Its legs, like every waypoint leg, are drawn straight with no land test, and it crosses Malta for 17.0 km from the east. Its reason now says the line "still uses the same land-avoidance rule". |
| G5. ORBIS | **Pass.** Removed from the pinned inputs and from every line's provenance, as ADR-0038's update says. The builder still holds ORBIS's reader functions, unused, one of them with an undefined constant: cleanup only. |
| G6. Roads | **Pass.** Thessalonica → Berea no longer snaps to a road 28 km away (the limit is now 15 km), road lines are routed leg by leg through their places passed, and every connector is recorded with its length. |
| G7. Provenance | **P1, P2, P3 pass:** Natural Earth is cited by file (`naturalearth:ne-10m-land`, `-coastline`, `-lakes`, added to the schema), roads by the ids of the roads used, and no ORBIS ids remain. **P4 partly:** `dataset` now names what each line uses, but `version` still gives Natural Earth's paths without the pinned commit `ca96624`. **P5 partly:** connectors are recorded, but the waypoints are hand-placed, and the provenance neither lists them nor says so: it calls them "reproducible open-water waypoints" and, on land, "reproducible Natural Earth land waypoints"; Puteoli → Rome's dropped places passed aren't recorded. **P6 fail:** 17 lines record "so each leg can avoid intervening coasts and islands" and "follow the shortest path over water" while crossing land. **P7 fail:** the coordinate source of 45 line ends is still cited nowhere in their line's provenance. **P8 fail:** the storm's reason cites `naturalearth:ne-10m-land` rather than the passages (`scripture:Acts 27:15`, `27:16`, `28:1`). |
| G8. The land check's strength | **Fail.** The validator now tests segments exactly against Natural Earth 10 m land less its lakes, but skips every segment of a line whose provenance has a `water-waypoints` change: 24 of the 25 lines by sea. It also counts that change as a reason for any detour, and its detour baseline is now 1.1 × the straight distance rather than a path over water. With the skip removed (I renamed the change in a scratch copy, ran `validate:data`, and restored the file), the validator itself reports 23 of those 24 lines crossing land. The builder draws waypoint legs straight without testing them, and six of its sea waypoints lie on land: 15.8° E 38.0° N in Calabria, 27.9° E 36.25° N on Rhodes, one inside Samos, one on Lesbos, and the stop points of Chios and Cnidus. The unit test "sea route lines reject any segment that crosses land" now passes on any error at all. Both checks interpolate in longitude and latitude, while the map draws segments straight in Web Mercator. |
| G9. Previews | Not changed: still equirectangular, with coastlines only. |
| G10. Itiner-e | Not changed. `docs/research/SOURCES.md`'s M5-04 table also still lists ORBIS as a pinned input of the lines, and not Natural Earth's lakes. |

**Back to the GIS Engineer:**
1. Compute the paths over water instead of placing waypoints by hand, keeping only the passes the text directs (Cyprus's two sides, Cauda, Crete's lee), and route every leg, waypoint legs included, with the land test. Keep the places passed on lines by land.
2. Test every segment of every line, sea or land, in Web Mercator or densified, against Natural Earth 10 m land less its lakes. Allow only recorded connectors, and a small stated tolerance where a path starts on the coast at a connector, which is what makes the exact test flag lines such as `paul-1` 02 today. Remove the `water-waypoints` skip, restore a real detour baseline, and make the unit test expect the land-crossing error.
3. Fix P4–P8 and the previews, and bring `docs/research/SOURCES.md`'s M5-04 table in line with ADR-0038's update.

**Licences after ADR-0038's update.** No line uses ORBIS and the build no longer reads it, so CC BY 3.0 places no condition on the lines. `docs/LICENSES.md` ("Routes' lines (M5-04)", the `data/geo/` row and "Source compatibility"), `ATTRIBUTION.md` and the app's credits now describe ORBIS as a cross-check for travel times only, credited as a source the project consulted, and list Natural Earth's lakes among the lines' inputs. The lines stay ODbL 1.0, because the road lines follow AWMC's roads, and R1, the ODbL notice wherever the lines are shown, stands for M5-05.

**Checks on `e00057e`:** `npm run check:route-lines` reproduces the lines byte for byte from an empty cache. `npm run validate:data` passes, because of the skip above. With my changes: `npm run test:app`, `npm run lint` and `npm run typecheck` pass.

## 11. Final check of `f2fe526` (2026-10-14)
The GIS Engineer rebuilt every line in `f2fe526`: A* on a 500 m Web Mercator grid of Natural Earth 10 m land and lakes, then straightened with exact line-of-sight tests against the vector coast, keeping 1.3 km off it where the water allows. Islands are passed through gates computed on the side the text gives, and the line audit runs, with no line skipped, in `check:route-lines` and `validate:data`. The PO's ADR-0038 update "stops away from the water" (`098d3c1`) lets a line by sea reach a stop that lies inland or inside an island by an approach over land of up to 30 km, which crosses no water and is recorded. I re-measured everything with my own scripts: exact intersection in Web Mercator against Natural Earth 10 m land less its lakes, and OpenStreetMap water from OpenFreeMap's tiles at zooms 10 and 12, which is what the basemap draws.

**Result: all pass.** Measured against Natural Earth, which ADR-0038 and the audit use as the coast, no line by sea crosses land and no line by land crosses water outside its recorded connectors and approaches. The notes below are what the basemap's more detailed coast and lakes show at zoom 9 and closer. None of them is an error against the pinned data.

| Item | Result |
|---|---|
| Lines by sea (25) | **Pass.** 0.00 km over land outside 28 connectors of at most 2.31 km and 17 approaches of at most 24.65 km (Antioch), each recorded with its length. Every vertex between them lies in the water. |
| Approaches (17) | **Pass.** Each is the line's first or last segment, matches its recorded length to 0.01 km, crosses 0.00 km of water, and runs to the coast nearest its stop. |
| Lines by land (26) | **Pass.** 0.00 km over the sea or a lake outside recorded connectors of at most 1.28 km at stops that Natural Earth's shore puts in the water (Salamis, Paphos, Neapolis, Capernaum). The Sea of Galilee is no longer crossed: Nazareth → Capernaum, Capernaum → Jerusalem and Capernaum → Nain go round it at 33.9, 131.0 and 36.5 km. Where AWMC's road runs over Natural Earth's sea (1.99 km by Neapolis, 3.58 km at Asprovalta), the line goes over land instead, and says so. |
| Islands' sides | **Pass.** At Cyprus's meridian, Patara → Tyre is at 34.26° N, south of the island (Acts 21:3), and Sidon → Myra at 35.99° N, north of it (Acts 27:4–5). After Salmone, Myra → Fair Havens runs 1–6 km off Crete's south coast (Acts 27:7–8). The storm line passes Cauda to the south, 1.7 km off Natural Earth's coast (Acts 27:16). Chios is passed 3.9 km off its coast, Cnidus at 5.0 km and Salmone at 2.5 km, in order. |
| The storm stage | **Pass.** It crosses no land by Natural Earth, from Fair Havens past Cauda and straight on to Malta's approach (4.94 km). Its `side-of-island` and `detour-reason` changes cite Acts 27:14, 27:15, 27:16 and 28:1, and each quotation matches the WEB. |
| Puteoli → Rome | **Pass.** It passes through the Forum of Appius and Three Taverns (0.000 km) and crosses no water by Natural Earth; the Gulf of Gaeta is gone. |
| Hand-placed waypoints | **Pass.** There are none: `scripts/lib/route-line-rules.mjs` holds only rules (distances, clearances, the four sides the text gives, each with its passage), and every vertex inside a line by sea lies in Natural Earth's water and every vertex inside a line by land on its land. |
| Detours | **Pass.** `jesus` 15 now crosses the lake in 7.0 km. Every other line by sea is at most 1.16 × the straight line from stop to stop, except Samos → Trogyllium (2.35×), which goes by sea round Samos's eastern cape from the coast nearest the island's label point, and Cos → Rhodes (1.30×), which goes round the Cnidian peninsula; in both the straight line crosses land, and the way taken is the only short way round. The audit's ratio to the shortest path over water is at most 1.162 for every line. |
| Provenance | **Pass, P1–P8.** `version` gives Natural Earth's commit `ca96624`, paths and SHA-256s (P4). Every change is recorded: method, connectors and approaches with their lengths, road joins, the road stretches replaced, places passed and sides of islands (P5). Each claim matches the geometry (P6). Every line cites the `coordinateSource` of each stop it joins or passes (P7). The storm cites its passages (P8). Road lines cite AWMC's own ids (`awmc:roads-objectid-679`, `awmc:roads-feature-14`, …). |
| Checks and previews | **Pass.** The audit runs on every line, with no exemptions, in `check:route-lines` and `validate:data`. The previews are Web Mercator, with land and lakes filled. |
| `docs/research/SOURCES.md` | **Pass.** The M5-04 table lists exactly what the build reads: Natural Earth 10 m land and lakes with commit and SHA-256, AWMC's roads, the stops' sites; ORBIS, Natural Earth's coastline and Itiner-e are marked as not inputs. |
| Licences and credits | **Pass.** The build reads only Natural Earth 10 m land and lakes (public domain), AWMC's roads (ODbL 1.0) and the stops' sites; no script reads ORBIS or Natural Earth's coastline. `docs/LICENSES.md` and `ATTRIBUTION.md`, which the GIS Engineer edited to drop the coastline, say exactly that; the app's credits need no change. The lines stay ODbL 1.0 for their AWMC roads, and R1, the ODbL notice wherever the lines are shown, stands for M5-05. |

**Notes for the PO: what only the basemap shows.** Natural Earth's coast and lakes are generalised, so at zoom 9 and closer the basemap shows a few short stretches it can't see. None is an error against the pinned data, and the routes' notes already say the lines show the order and the kind of travel, not the exact path.
- The storm line crosses 1.8 km of Gavdos's south-east corner. Natural Earth draws the island 1.7 km or more smaller there.
- Puteoli → Rome crosses Lake Albano for 2.5 km and Lake Nemi for 1.2 km, both between Three Taverns and Rome, and coastal lakes by Lago Patria and the Volturno's mouth for 3.4 km. Lakes Albano and Nemi and Lago Patria are in neither Natural Earth's 10 m lakes nor its European lakes.
- The Via Egnatia line runs along the south shores of Lakes Volvi and Koroneia, at times inside OpenStreetMap's outline (about 15 km in all), as the ancient layer's road does. Natural Earth's European lakes, a pinned public-domain file, includes both lakes and would let the build send those stretches over land, as it already does at Asprovalta.
- Up to 2.9 km more over land where lines leave or reach a stop or round a cape: beyond Malta's 4.94 km approach (2.85 km), leaving Fair Havens (2.6 km), into Trogyllium (2.2 km), over today's Maeander delta by Miletus (1.7–1.8 km), across Cape Sideros by Salmone (1.15 km).
- Itiner-e: `SOURCES.md` still doesn't say whether it dates roads to the first century (G10). No line uses it.

**Checks on `098d3c1`:** `npm run check:route-lines` rebuilds the lines byte for byte from an empty cache, and its audit passes all 71 (worst ratio to the shortest path over water 1.162; 17 approaches, longest 24.65 km). `npm run validate:data` passes (203 warnings, unchanged), `npm test` passes 322 of 322, and `npm run test:app` 159 of 159.
