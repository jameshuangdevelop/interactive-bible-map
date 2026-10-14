# M5-04 verification: the routes' lines

Independent verification of the GIS Engineer's work on branch `data/m5-route-lines`, commits `7914de4` and `a83f987` on top of `data/m5-jesus-journeys`: the 71 lines in `data/geo/routes-lines.geojson` (51 for Paul's four routes, 20 for Jesus' segments), the `lineId`s added to `data/routes/routes.json`, `scripts/build-route-lines.mjs` with its pinned inputs (`scripts/lib/route-line-inputs.mjs`), `scripts/check-route-lines.mjs`, and the new route-line checks in `scripts/lib/validator.mjs`. I checked them against card `docs/tasks/M5-04-route-lines.md`, ADR-0038 (items 1, 4 and 5, and the update of 2026-10-13), ADR-0037 item 5, ADR-0012 and ADR-0017. Verified by the Fact-Checker (Claude Opus 5.5) on 2026-10-14.

**Result: needs GIS fixes.** The licences pass, and I added the attribution they need. The rules pass: every stage has a line or a stated reason, every "path not known" line is straight, every line ends at its stops' sites, and every road followed is one AWMC dates to the Roman period. But 20 of the 25 lines by sea cross land, most of them by many kilometres and at the zoom the route opens at: Ephesus → Caesarea runs 295 km over Caria and Lycia, two lines run about 90 km across Cyprus, Cenchreae → Ephesus crosses Attica and Andros, and the boat crossing of the Sea of Galilee is drawn as a 90 km loop to the Mediterranean coast. The provenance names features the lines don't use, and placeholder ids.

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
