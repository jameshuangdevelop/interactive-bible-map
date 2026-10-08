# M4-03 verification — The ancient layer's shapes, roads and coastline

Independent verification of the GIS Engineer's work on branch `data/m4-ancient-geometry` (head `461f322` when I started): `data/geo/ancient-areas.geojson` (24 areas), `ancient-empire-edge.geojson`, `ancient-roads.geojson` and `ancient-coastline.geojson`, with their provenance and the scripts that build them. I checked them against card `docs/tasks/M4-03-ancient-geometry.md`, ADR-0017, ADR-0037 with all its updates (border rules 1–5, the correction on eastern Pontus, and "the rest of the Roman world, islands and the empire's edge"), the research note `docs/research/M4-timeline.md` §2.24–§2.25, `schema/README.md` ("Timeline and ancient layer"), the GIS composition report and the previews. Reviewed 2026-10-08. **Re-checked the same day after the fixes; see "Re-check" at the end.**

**Result: needs GIS fixes.** The licensing passes, with a corrected attribution string. Most borders follow their sources, and every cited anchor agrees with Pleiades and Wikidata. But the rest of the Roman world loses 10,974 km² of Raetia to a dissolve bug, seven roads date from after AD 100, and the empire's edge runs along a coast in two places.

| Item | Pass | Needs change | Fail |
|---|---|---|---|
| Licensing (AWMC, Natural Earth, OpenStreetMap, Itiner-e) | 4 | 0 | 0 |
| Attribution string | 0 | 1 (corrected in this commit) | 0 |
| Border segments (25) | 22 | 1 (Raphia's coast) | 2 (Galatia–Cappadocia; the outer edge in Raetia) |
| Anchors (10) | 10 | 0 | 0 |
| Place-check exceptions (4) | 2 real exceptions | 2 to fix (Galilee's label point, Nicopolis) | 0 |
| Islands and peninsulas | The Research Lead's islands, Asia's six, Malta, and seven peninsulas | 4 (three missed peninsulas; Karaburun undecided) | 0 |
| Roads (182) | 175 | 0 | 7 dated after AD 100 |
| Ancient coastline (2) | 2 | 1 small false difference | 0 |
| Provenance (24 areas, 3 layers) | 14 areas and the edge as written | 10 areas and the coastline (fixed in this commit); the roads' text (G5) | 0 |
| `other-roman-lands` and the empire's edge | — | 2 (the IJ, the lower Danube) | 3 (Raetia, the Syrtis coast, the Guadalquivir) |

"Fail" means a source contradicts the geometry, or a rule is broken in a way the map would show. "Needs change" means the geometry or its record is unsourced, imprecise or mislabelled.

**The main findings:**
1. **Raetia is missing from the Roman world.** AWMC's AD 69 extent is 110 polygons, and three of them overlap over northern Switzerland, Vorarlberg and Tyrol. The build merges them with mapshaper's `-dissolve`, which leaves land covered twice as a hole. So 10,974 km² of AWMC's own AD 69 extent is in no area: Turicum (Zürich), Vitudurum (Winterthur), Ad Fines (Pfyn), Arbor Felix (Arbon) and Veldidena (Innsbruck) all fall outside the Roman world, and the empire's edge runs round both sides of the gap. `-clean -dissolve2` keeps the land (tested). The composition report's coverage check missed it, because it uses the same dissolve. (G1)
2. **Seven roads date from after AD 100.** The filter left out roads only by the exact name "Via Nova Traiana". Four roads run north of the Danube into Dacia, which Rome conquered in 101–106. The others are Trajan's Via Traiana Nova in Etruria, the Tetrarchic Via Herculia, and the desert road to Gheriat el-Garbia, a fort built in 201. (G5)
3. **The empire's edge runs along coasts in two places.** It runs 1–5 km inland of the Gulf of Sirte's coast for 335 km, where a thin sliver of today's land outside AWMC's coastline counts as "land outside the empire". It also loops for 195 km round the marshes at the Guadalquivir's mouth, which AWMC's extent leaves out as water and which Roman land and the sea enclose. The Danube delta and the Dobruja coast are right: there the edge follows the Danube inland and meets the sea only in the delta. (G2, G3)
4. **The Galatia–Cappadocia line contradicts Strabo.** No AWMC province layer separates the two (I tested the AD 69, AD 200 and Barrington AD 100 lines). The line used is the AD 14 extent's edge, a rule-3 approximation. It puts Tyana 42 km, Garsaura (Archelais) 60 km and Nazianzos 44 km inside `galatia`, yet Strabo (12.1.4) counts Tyanitis and Garsauritis among Cappadocia's ten prefectures and puts the city of Tyana in Tyanitis (12.2.7). The local move near Nevşehir has no source: it only brings the `cappadocia` record's label point inside. (G6, RL4)
5. **Two place-check exceptions should be fixed, not explained.** Galilee's label point lies north of Baca, the village Josephus names as Galilee's border with the Tyrians, while the drawn border itself agrees with him. Nicopolis sits on the Preveza peninsula, which joins Epirus (`achaia`) at its neck but which the peninsula rule missed. The Pisidia label point and Malta's Mljet candidate are real exceptions. (RL1, G7)
6. **What passed:** the licences; the Herodian borders (the Jordan, the Yarmuk, the Galilee–Samaria and Pella lines, and Perea's end at Machaerus); the Lamus; Lycia–Pamphylia at Phaselis; the islands of the Research Lead's table and of ISBE's "Asia"; Britain left out; the eastern and African frontiers; the coastline's sources; and the size (301,164 bytes gzip after this commit, 294.1 KiB).

## Scope
- `data/geo/ancient-areas.geojson`: 24 areas, their geometry and their provenance.
- `data/geo/ancient-empire-edge.geojson`: one feature, 10 pieces, 11,182 km (the composition report's length).
- `data/geo/ancient-roads.geojson`: 182 roads. `data/geo/ancient-coastline.geojson`: the gulfs at Ephesus and Miletus.
- The scripts that build them: `scripts/build-ancient-geo.mjs`, `scripts/report-ancient-partition-prep.mjs`, `scripts/compose-ancient-areas-safe.mjs` and `scripts/lib/`.
- The place check's four exceptions, and the licences of every dataset the scripts read.
- Not in scope: who held each area (verified in M4-02, `docs/verification/M4-timeline.md`) and the app (M4-04, M4-05).

## Method
1. **Licences at the source** (all read 2026-10-08):
   - AWMC: the repository at commit `7ecf8bccea2efe1e1e9df2daf6001942de73fb87` (root listing, `LICENSE.txt`, `README.md`, `attribute_information.md`, `Physical Data/shoreline/README.md`). I downloaded `Cultural Shapefiles Apr 2024.zip` from that commit: its SHA-256 (`AE209BD5…7681BC8`) matches the copy the build used, and I read the shapefiles' own `.shp.xml` metadata.
   - Natural Earth's terms of use; OpenStreetMap's copyright page; the OSMF API Usage Policy.
   - ODbL 1.0 §4.3, §4.4 and §4.6, in AWMC's `LICENSE.txt`.
2. **Geometry by script**, reading the committed files with the repository's own helpers (`scripts/lib/ancient-area-checks.mjs`) and mapshaper 0.6.113:
   - point-in-area tests for more than 60 ancient sites;
   - which AWMC line layers a straight line between two sites crosses;
   - AWMC's raw AD 14, AD 69, AD 75, AD 117 and AD 200 extents at the Raetian sites;
   - the empire edge's distance from today's coastline, stretch by stretch;
   - the land of AWMC's AD 69 extent that no area holds;
   - each kept road's length outside every area.
3. **Zoomed previews** of my own (`%TEMP%\fc-m4-03\`): the Danube delta, the Gulf of Sirte, the Guadalquivir, Lake Constance and Raetia, the Rhine mouth, the Hauran, Nicopolis, and the coastline at Ephesus and Miletus.
4. **Sources opened** (2026-10-08):
   - Josephus, *War* 1 and 3 (Whiston, CCEL), *Antiquities* 14;
   - Strabo 12.1.4 and 12.2.7 (Loeb, LacusCurtius);
   - Cassius Dio 68 (Loeb, LacusCurtius);
   - ISBE "Asia" and "Rhodes";
   - Livius "Trajan" and "Gheriat el-Garbia";
   - Pleiades (JSON) for 19 places and roads, including the Via Herculia (469059303), the Via Nova Traiana (147882288) and Gheriat el-Garbia (344374);
   - W. V. Harris, "A milestone from the Via Traiana Nova near Orvieto", *ZPE* 85 (1991) 186–188 (PDF from the University of Cologne).
5. **Checks:** `npm run validate:data`, `npm test`, `npm run build:data` and `npm run test:app` (see "Checks").

## Licensing
**Pass.** Each licence is compatible with the code licence (MIT) and with `data/geo/` staying ODbL 1.0. The decisions and the exact string are in `docs/LICENSES.md` → "Ancient layer (M4-03)", and `ATTRIBUTION.md` is updated.

| Source | Finding at the source | Verdict |
|---|---|---|
| AWMC Geodata, pinned commit | `LICENSE.txt` is the ODbL 1.0 text, and GitHub reads it as `ODbL-1.0`. README: "The GeoJson files are offered under the ODC Open Database License". The zips are not a GitHub release but files in the same commit; the README calls them "archived copies of all AWMC geospatial data", and their `.shp.xml` metadata holds only template text, with no other licence. README: the data "uses AWMC modifications to OpenStreetMap". Shoreline README: "derived from VMAP0, and was modified by the AWMC". | Pass: ODbL 1.0 |
| OpenStreetMap ways | The Jordan (relation 2246907), the Yarmuk (1355013) and the Lamus (15952690): 46 ways, with ids and versions in each area's provenance and the composition report. ODbL 1.0. The copyright page: "Provide credit to OpenStreetMap by displaying our attribution notice" and "make clear that the data is available under the Open Database License", for which "you may link to this copyright page". | Pass: ODbL 1.0. See the correction below on how they were read. |
| Natural Earth | "All versions of Natural Earth raster + vector map data found on this website are in the public domain." "No permission is needed to use Natural Earth." Pinned at commit `ca96624a56bd078437bca8184e78163e5039ad19` of `nvkelso/natural-earth-vector`. | Pass: public domain |
| Itiner-e | No script, data file or provenance in this branch reads it. The PR body and the card mention it only as a candidate. | Not used; no decision needed |

**Correction:** the PO's brief says the river ways came "via Overpass". They came from the OSM editing API (`scripts/lib/osm-waterways.mjs`, `api.openstreetmap.org/api/0.6`). The OSMF API Usage Policy says that API "is provided in order to edit the map data, not for read-only purposes or projects". The licence is the same, but the next fetch must use Overpass or an extract (G8).

**The attribution string.** The M1-03 wording, "Contains information from AWMC Geodata (awmc.unc.edu), made available under the Open Database License (ODbL).", is close but not ODbL §4.3's example notice. §4.3 asks for "Contains information from DATABASE NAME, which is made available here under the Open Database License (ODbL)", where "DATABASE NAME should be replaced with the name of the Database and a hyperlink to the URI of the Database" and "Open Database License" links to the licence text. The ancient map's attribution control should show:

```html
Contains information from <a href="https://github.com/AWMC/geodata" target="_blank">AWMC Geodata</a>, which is made available here under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank">Open Database License (ODbL)</a>.
```

It reads: Contains information from AWMC Geodata, which is made available here under the Open Database License (ODbL).

**OpenStreetMap on the ancient map:** no separate credit is needed. The river ways, and the OSM-derived parts of AWMC's data, sit over our basemap, whose credit, "Data from OpenStreetMap" (or the fallback's "© OpenStreetMap contributors"), is in the same control and links to the copyright page. That meets both of OSM's requirements. If the ancient layer is ever shown without that credit, for example as a static image, "© OpenStreetMap contributors" must be added (LICENSES A2).

**ODbL §4.6 (access):** `data/geo/` and the scripts that build it are public in this repository, which offers the whole derived database. The generated `ancient.*` files are simplified copies under the same licence.

## Border segments

| # | Segment | How it is drawn | Verdict | Evidence |
|---|---|---|---|---|
| 1 | Galilee / Samaria | Straight lines from the sea through Mount Carmel, Ginea (Jenin) and Scythopolis to the Jordan (rule 2, approximate) | Pass | *War* 3.3.1 and 3.3.4; ISBE "En-gannim" (in M4-02). Anchors below. |
| 2 | Galilee / Tyre's land (Syria) | Herod's outline and AWMC's AD 69 Judaea face | Pass | *War* 3.3.1: "the breadth of the Upper Galilee, as far as the village Baca, which divides the land of the Tyrians from it". Baca (Peki'in) is 0.3 km inside the drawn Galilee, Gischala 5.1 km and Meroth 4.8 km inside, and Kedesh falls in `syria`. |
| 3 | The Jordan (OSM) | West of the rift: Judea, Samaria and Galilee; east: Perea and Philip's lands | Pass | *War* 3.3.3: Perea's "northern parts are bounded by Pella, as we have already said, as well as its Western with Jordan"; also 3.3.1 and 3.3.5. Qasr al-Yahud is 8 m west of the river, Al-Maghtas 124 m east. |
| 4 | Sea of Galilee median; connector north of the Jordan's source | Straight lines (approximate, labelled) | Pass | *War* 3.3.5: Philip's lands reach "to the lake of Tiberias" |
| 5 | Dead Sea median and the Arabah | Straight lines (approximate, labelled) | Pass | Labelled as an approximate repair across water; no source names a line here. |
| 6 | Philip's lands / Gadara's land (the Yarmuk, OSM) | Rule 2 | Pass | ISBE "Golan; Gaulonitis" (in M4-02). Hippos is in `philip-tetrarchy-lands`, Gadara in `syria` (Pleiades points). |
| 7 | Perea's north at Pella | Straight line Pella–Philadelphia (rule 2, approximate) | Pass | *War* 3.3.3; ISBE "Peraea" (in M4-02) |
| 8 | Perea's south end | East–west line 1 km south of Machaerus | Pass | *War* 3.3.3: "from Macherus to Pella"; Machaerus is 0.19 km from Pleiades 697700 |
| 9 | Cilicia Pedias / Tracheia (the Lamus, OSM Limonlu Çayı) | Rule 2; extensions inland and into the sea labelled approximate | Pass | Strabo 14.5.6: the Lamus "lies between Soli and Elaeussa". Elaeussa (Pleiades 648628) is in `cilicia-tracheia`; Soli (648781) lies 1.1 km off AWMC's coast on the plain's side. |
| 10 | Cilicia / Syria | AWMC's AD 200 line (rule 3) | Pass once labelled (fixed) | Issus lies 1.0 km on the Syrian side; the research note (§2.10) counts the plain to Issus, which is within the approximation. |
| 11 | Commagene / Syria | AWMC AD 69 face | Pass | Samosata is in `commagene` (1.03 km from Pleiades 658587) |
| 12 | Lycia / Pamphylia | AWMC AD 14 face | Pass | Strabo 14.4.1: after Phaselis comes Olbia, "the beginning of Pamphylia". Phaselis is in `lycia`, 0.3 km from the coast. |
| 13 | Pamphylia / Galatia (Pisidia) | AWMC AD 14 face | Pass | Rule-4 ruling in §2.25, disclosed in `pamphylia`'s note |
| 14 | Galatia / Cappadocia | AWMC AD 14 extent (rule 3) and an unsourced local move near Nevşehir | **Fail** | See finding 4 and G6 |
| 15 | Bithynia / Thrace | The Bosporus and the Hellespont | Pass | §2.25 |
| 16 | Bithynia / Cappadocia | AWMC AD 69 face along the Pontic coast | Pass | §2.25 and the P1 correction: Amisus is in `bithynia`; Amaseia, Comana and Trapezus are in `cappadocia` |
| 17–20 | Achaia / Macedonia, Macedonia / Thrace, Illyricum, Italy | AWMC AD 69 faces; AWMC `Italy_shading` | Pass | Nicopolis is separate: see "Place-check exceptions" |
| 21 | Egypt / Arabia (Sinai) | AWMC's AD 69 Aegyptus face; Sinai's interior from the AD 200 cell (rule 3) | Pass once labelled (fixed) | Confirms M4-02's R14: the line is AWMC's, and the Sinai assignment is a rule-3 approximation |
| 22 | Syria / Arabia | AWMC's AD 200 Arabia line and extent (rule 3) | Pass once labelled (fixed) | Philadelphia, Gerasa and Bostra all lie inside AWMC's AD 69 extent but fall in `arabia`. The Decapolis isn't drawn (ADR-0037 item 3), so this is disclosed in the provenance. |
| 23 | Raphia's coast | An AD 69 face of 1,814 km² between Rhinocolura and Gaza, given to `arabia` | **Needs change** | AWMC's AD 69 extent holds it as Roman, and no cited source makes it Nabataean. Josephus names Raphia only among the towns Gabinius rebuilt (*Antiquities* 14.5.3). (RL3) |
| 24 | Perea / Arabia | Herod's outline | Pass | AWMC record 12 |
| 25 | The rest of the Roman world's outer edge | AWMC AD 69 extent (rule 3) | **Fail** in Raetia; pass elsewhere | See "The empire's edge" |

## Anchors
Each anchor in the code agrees with Pleiades to within about 1 km, and M4-02 checked the Wikidata coordinates.

| Anchor | In the code | Pleiades | Distance |
|---|---|---|---|
| Ginea / Jenin | 35.30, 32.46 | 678163 "Ginai(a)/Gema" | 0.31 km |
| Scythopolis | 35.50, 32.50 | 678378 | 0.50 km |
| Pella | 35.62, 32.45 | 678326 | 0.48 km |
| Philadelphia | 35.93, 31.95 | 697728 | 0.70 km |
| Machaerus | 35.6233, 31.5658 | 697700 "Machairous" | 0.19 km |
| Caesarea Mazaca | 35.48, 38.72 | 629035 | 0.86 km |
| Phaselis | 30.55, 36.52 | 639051 | 0.43 km |
| Samosata | 38.52, 37.53 | 658587 | 1.03 km |
| Gadara | 35.6858, 32.6556 | 678142 | 0.80 km |
| Hippos | 35.65, 32.78 | 678185 | 0.93 km |

Mount Carmel has no Pleiades id in the note; Wikidata Q185318 matches within 0.42 km (M4-02).

## Place-check exceptions
| Place | Result | Verdict |
|---|---|---|
| `galilee` (label point 35.3, 33.0) | 3.38 km into `syria` | **Fix (RL1).** The point lies north of Baca, beyond the border with Tyre that Josephus describes, and the drawn border agrees with Josephus (segment 2). Moving the label point about 11 km south, to 35.30°E 32.90°N, puts it 4.2 km inside. |
| `pisidia` (label point 31.01, 37.47) | 60.6 km into `pamphylia` | **Real exception.** AWMC's AD 14 "Pamphylia" face includes southern Pisidia, and the Research Lead kept it whole under rule 4, with a note on `pamphylia`. The Research Lead may move the label point north into Galatia's part instead (optional). |
| `nicopolis` (20.736, 39.008) | In no area, 5.0 km from `achaia` | **Fix (G7).** Nicopolis is on 63 km² of land that AWMC's extent leaves out at the mouth of the Ambracian Gulf, joined to Epirus at its neck. ADR-0037: "A peninsula belongs to the area it's attached to." |
| `malta`, candidate 1 (Mljet, 17.535, 42.745) | In no area, 10.9 km from `illyricum` | **Real exception for now.** The record links the place, not each candidate, to `sicily`, following the main identification (Malta, which is in `sicily`). Mljet lies outside AWMC's AD 69 extent. If the Research Lead finds a source placing Melita in Illyricum, the island can join `illyricum` (ADR-0037 item 2) and the record can link each candidate separately (RL6). |

## Islands and peninsulas
**Pass, with fixes:**
- **Sourced islands (the Research Lead's table):** Euboea is in `achaia`, and Brattia and Curicta are in `illyricum` (Smith, as quoted in M4-02). Corcyra, Samothrace, Thasos and every "no statement found" island are in `other-roman-lands` (ADR-0037 item 2).
- **Asia's islands:** Patmos, Lesbos, Chios, Samos, Cos and Rhodes are in `asia`. ISBE "Asia" says the province included "apparently the islands of Lesbos, Samos, Patmos, Cos and others near the Asia Minor coast"; ISBE "Rhodes": "Later it was made a part of the Roman province of Asia (44 AD)". The provenance credited this to a "Research Lead ruling" that covers only Patmos; it now cites ISBE (fixed). The research note (§2.25) still calls Rhodes "not one of this map's 23 areas" (RL2).
- **Malta** is in `sicily` (§2.25).
- **Peninsulas joined:** Acte, Pallene, the Cnidian peninsula, western Cos, Pelješac, southern Magnesia and the Nile delta by Damietta: each is joined by land to one area only. Pass.
- **Peninsulas missed (G7):** the Preveza peninsula, with Nicopolis. Sinope (35.15, 42.02) is in no area either, and the Actium promontory looks the same.
- **Karaburun** (the Acroceraunian promontory) is joined to both `macedonia` and `achaia`, so the rule can't place it (RL5).

## Roads
**Fail: seven roads date from after AD 100.** The build kept 182 of AWMC's major roads with "R" among their Barrington periods, inside 10–40°E and 28–45°N, and left out only the five features named exactly "Via Nova Traiana". AWMC's attributes give period codes, not dates. So I checked every named road against sources, and every road that runs outside the drawn Roman world:

| roadId (AWMC OBJECTID) | Road | Evidence it is later than AD 100 |
|---|---|---|
| `awmc-road-1320-646` (1320) | Lederata to Tibiscum, north of the Danube (139 km, all outside the drawn Roman world) | In Dacia. Livius "Trajan": the Dacian war began in 101 and Dacia was conquered in 106. Dio 68.14.3: "In this way Dacia became subject to the Romans, and Trajan founded cities there." |
| `awmc-road-1363-803` (1363) | Oescus north to Napoca (430 km, 426 km outside) | As above |
| `awmc-road-1403-2563` (1403) | Tibiscum to Dierna (87 km, all outside) | As above |
| `awmc-road-1407-481` (1407) | Drobeta north towards Sarmizegetusa (167 km, all outside) | As above |
| `awmc-road-1203-87` (1203) | "Via Traiana Nova", Volsinii to the borders of Clusium | Harris, *ZPE* 85 (1991) 186–188, ties the Trajanic milestone CIL XI 8104 = ILS 9496 to this road, "an ambitious short-cut on the Via Cassia". The milestones' text, as transcribed in Italian Wikipedia's "Via Traiana Nova (Italia)", names Trajan "Dacic(us)", consul for the fifth time, with tribunician power XII. Livius "Trajan" dates those titles to 102 and 103, so the road is later than AD 100. |
| `awmc-road-2169-702` (2169) | "Via Herculia", Aequum Tuticum towards Venusia | Pleiades 469059303, summarizing Buck (1971): "a via publica at the time of Diocletian and Maximian Herculius", emperors of the late third century |
| `awmc-road-2698-1604` (2698) | Oea south to Gheriat el-Garbia (30.40°N 13.56°E); 93 km beyond the drawn Roman world | Livius "Gheriat el-Garbia" (cite-only): an inscription dates the fort, the road's end, to 201, under Septimius Severus. Pleiades 344374. |

**Kept, and fine:** the Via Minucia / Traiana (AWMC names it with the older Via Minucia), the Via Flavia in Istria, the Via Sebaste, the Via Egnatia, and the Republican roads round Rome. The frontier road from Tacapae to Lepcis (`awmc-road-2699-1086`) runs 57 km outside the drawn Roman world; clipping roads at the edge (G5) handles it.

**Flags:** each road keeps AWMC's `known` flag (solid or dashed) and its AWMC ids. Pass.

**Observation for the PO (not a failure):** AWMC flags no major road in Judea, Galilee, Syria south of Antioch, Arabia, Egypt, Cyprus, Crete or Achaia south of Epirus, so the map shows none there. Whether to add AWMC's minor roads near our places is a product decision (P2).

## Ancient coastline
**Pass, with one small false difference.**
- **Sources:** AWMC's `Physical Data/shoreline/shoreline.geojson`, "derived from VMAP0, and was modified by the AWMC", whose data AWMC derives from the Barrington Atlas (README), was compared with Natural Earth's 10 m coastline. Both are pinned.
- **The two shapes:** at Miletus the old coast runs past Priene and Myus to Heraclea under Latmus, the Latmian Gulf now silted. At Ephesus it shows the gulf inland of the modern coast. Both are real differences that show at zoom 10 or below.
- **The false difference:** a ring at about 26.93–27.00°E, 37.36–37.39°N, inside the Miletus box, is an island in AWMC's shoreline that Natural Earth 10 m lacks, not land that was then sea (G9).
- **Provenance:** a source id, `awmc:natural-earth-10m-coastline-comparison`, credited Natural Earth to AWMC. It is removed (Natural Earth stays in `dataset` and `version`), in the data and in `scripts/build-ancient-geo.mjs`.

## Provenance
Each area's provenance is its own, and most of it was honest. I fixed the wording of ten areas and of the coastline in this commit, in `data/geo/` and in the scripts that write it, so a rebuild keeps the fixes:
- **`asia`:** "per Research Lead ruling" replaced by ISBE "Asia" and "Rhodes", quoted (see "Islands").
- **`cappadocia` and `galatia`:** the local move cited Strabo 12.2.7, which is about Mazaca, 55 km away. It now says the AD 14 edge is a rule-3 approximation, that no source describes the move, and that Mazaca lies inside either way.
- **Rule-3 labels:** added to `arabia` (including that Philadelphia and Gerasa fall on its side), `cilicia`, `cilicia-tracheia` and `syria` (the AD 200 Cilicia–Syria line). `other-roman-lands` already had one.
- **Source ids:** `bib:isbe-golan` added where the Yarmuk is cited, and `bib:isbe-en-gannim` where Ginea is (both were named only in words).

**Still to change (GIS):**
- The roads' change text says "excluded post-AD-100 roads by cited name filter", but no source is cited. It should list what G5 leaves out, with sources.
- The three Herodian areas share two change objects that mention lines not every area touches (for example Perea's line in `judea-samaria-idumea`). This is minor and need not change.

## The empire's edge and `other-roman-lands`
Checked against ADR-0037's update "the rest of the Roman world, islands and the empire's edge":
- **`other-roman-lands`:** AWMC's AD 69 extent less the areas, with Britain and its islands left out (81,954 km²) and 71 km² of gaps filled. The method passes. Raetia is missing (G1).
- **Where the edge is right:**
  - the eastern frontier from the Black Sea to Arabia;
  - the Rhine and Danube, including the Agri Decumates outside the AD 69 extent;
  - the African desert edge;
  - the Rhine before AD 9, labelled as an approximation.
- **The Danube delta and the Dobruja coast:** pass. The edge follows the Danube 50–80 km inland of the Dobruja's coast and meets the sea only in the delta (its last stretch is 9.8 km from the coast). Along the Dobruja coast the area's border is the coastline, not the edge; the Greek coastal towns, such as Tomis, Histria and Callatis, sit on that coast, within about 1.3 km of the simplified line.
- **Fail: Raetia** (G1). The edge runs round both sides of a 10,974 km² gap through northern Switzerland, Vorarlberg and Tyrol, plus a closed loop at 9.12°E 47.47°N.
- **Fail: the Gulf of Sirte** (G2). Pieces 5–8 (335 km between 15.63°E and 20.06°E) run 1.2–4.8 km inland of today's coast. A 1,652 km² sliver of Natural Earth land between AWMC's coastline and Natural Earth's passes the 1,000 km² "outside land" test.
- **Fail: the Guadalquivir** (G3). Piece 9 (195 km) loops round 1,969 km² at the river's mouth that AWMC's extent leaves out as water. Roman land and the sea enclose it, so it isn't land outside the empire.
- **Needs change: the IJ** (G4). A 192 km² gap at 4.75°E 52.42°N, left when `other-roman-lands` was simplified, cuts off a piece of it, so the edge is drawn on both sides of the gap (a closed loop at 5.01°E 52.37°N).
- **Needs change: the lower Danube** (G4). A 512 km² piece of AWMC's AD 69 land at 27.89°E 44.84°N lies in no area, and the edge runs up to about 6 km east of AWMC's line, leaving the fort of Carsium outside.

## Size
Before my changes, `npm run build:data` wrote 300,480 bytes gzip for the ancient layer:
- shapes 127,322 bytes; roads 36,595; coastline 3,852; edge 3,162; timeline 5,424;
- the 15 stops, 124,125 bytes in all.

The build copies each area's provenance into `ancient.shapes.json`, so my longer provenance wording adds 705 bytes. After this commit the total is 301,164 bytes gzip (shapes 128,027, coastline 3,831): 294.1 KiB, or 301.2 kB in decimal units. That is under the card's "about 300 KB", but the G-items will change it (P1). Provenance is 57,558 of the payload's 400,532 characters, much of it repeated OpenStreetMap way ids.

## Fixes for the GIS Engineer
- **G1. Raetia.** At `scripts/compose-ancient-areas-safe.mjs` (the AD 69 and AD 200 extents, about line 1133), `scripts/report-ancient-partition-prep.mjs` (the extent lines, line 557) and `scripts/lib/ancient-area-checks.mjs` (the coverage domain, line 102), replace `-dissolve` with `-clean -dissolve2`. Then rebuild the partition, the areas and the edge.
  - Source: AWMC's own AD 69 extent (`roman_empire_ad_69_extent.shp` at the pinned commit). Its features with OBJECTID 7, 14 and 15 overlap there, and the raw polygons contain Turicum, Vitudurum, Ad Fines, Arbor Felix and Veldidena.
  - Acceptance: those five points are in `other-roman-lands`, and the coverage check reports no gap at 9.38°E 47.39°N.
- **G2. The Gulf of Sirte.** Don't count coastal slivers as land outside the empire. For example, keep only outside pieces with a point more than about 10 km from today's coast, or test their width.
  - Acceptance: no stretch of the edge longer than 10 km runs within 5 km of today's coast.
  - Source: ADR-0037's update, item 3: the edge is "where the Roman world's land meets land outside it".
- **G3. The Guadalquivir.** Don't draw the edge round outside pieces that Roman land and the sea enclose. The land stays unshaded. Same source as G2.
- **G4. The IJ and the lower Danube.** Build the edge before `other-roman-lands` is simplified, or fill simplification gaps that lie inside the extent, so the edge is never doubled and follows AWMC's line within the area tolerance. Check the IJ (4.75°E 52.42°N) and Carsium (28.0°E 44.5°N).
- **G5. Roads.** Leave out the seven roads in the "Roads" table, by AWMC OBJECTID, citing the sources there. Clip every road to the drawn Roman world, with a few kilometres' tolerance at coasts. Replace the name filter with that list, and rewrite the change text accordingly.
- **G6. Galatia–Cappadocia** (with RL4). Once the Research Lead confirms anchors, draw an anchor line like the Galilee–Samaria one:
  - Cappadocian side: Tyana (Pleiades 648801) and Garsaura (619164), after Strabo 12.1.4 and 12.2.7;
  - Galatian side: Lake Tatta (Strabo 12.5.4), Iconium, Lystra and Derbe.
  - Then drop the Nevşehir move, which no source supports. Until then the line is a labelled rule-3 approximation that Strabo contradicts.
- **G7. Missed peninsulas.** Join the Preveza peninsula (Nicopolis) to `achaia`, under ADR-0037's peninsula rule; Nicopolis then passes the place check. Check the Actium promontory and Sinope's peninsula, which look the same, and look for others cut off where AWMC's coastline and Natural Earth's differ.
- **G8. OpenStreetMap.** Read the river relations from Overpass or an extract, not the editing API (OSMF API Usage Policy). Keep the same way ids and versions, and update `schema/README.md`.
- **G9. Coastline.** Drop the ring at about 26.93–27.00°E, 37.36–37.39°N. It is an island Natural Earth lacks, not an ancient–modern difference.

After G1–G7 the size changes, so report it again (P1).

## Fixes for the Research Lead
- **RL1. Galilee's label point.** Move `galilee`'s point (35.3, 33.0) south of Baca (*War* 3.3.1), for example to about 35.30°E 32.90°N, which lies 4.2 km inside the drawn Galilee.
- **RL2. Islands in §2.25.** Add Lesbos, Chios, Samos, Cos and Rhodes to the Islands table, citing ISBE "Asia" and "Rhodes". Reconcile the sentence calling Rhodes "a free ally until Vespasian, not one of this map's 23 areas" with the map, which follows ISBE.
- **RL3. Raphia's coast.** Rule on the 1,814 km² AD 69 face between Rhinocolura and Gaza: `arabia`, `judea-samaria-idumea` or `egypt`, with a source. AWMC's AD 69 extent holds it as Roman.
- **RL4. Galatia–Cappadocia anchors.** Confirm the anchors for G6 and how Strabo's prefectures relate to the provinces of Galatia and Cappadocia in this period.
- **RL5. Karaburun.** Rule on which province held the Acroceraunian promontory.
- **RL6 (optional). Mljet.** If a source places the Illyrian Melita (Mljet) in Illyricum, add it to the Islands table and link `malta`'s two candidates separately.

## Items for the PO
- **P1. Size.** The ancient layer is 301,164 bytes gzip after this commit: 294.1 KiB, but 301.2 kB. Say which unit the budget uses before the G-items change the total. If room is needed, the build could leave provenance out of `ancient.shapes.json`; it stays in `data/geo/`, and the app doesn't show it yet.
- **P2. Roads near our places.** AWMC flags no major roads in the Holy Land, southern Syria, Egypt, Cyprus, Crete or southern Greece. Decide whether to include its minor roads there.
- **P3. The PR body** isn't updated: the branch isn't ready until G1–G7 are done and I re-check them.

## My small fixes in this commit
- `docs/LICENSES.md`: a new "Ancient layer (M4-03)" section (licences as read, obligations A1–A5, the exact string). The `data/geo/` row and the AWMC, OpenStreetMap and Natural Earth rows now describe the ancient layer.
- `ATTRIBUTION.md`: the AWMC row (use, the pinned commit and archives, the corrected notice), and the OpenStreetMap and Natural Earth rows' uses. No source was renamed, so the app's list of sources is unchanged.
- `app/src/features/search/sources-credits-content.ts`: the data-licence sentence no longer says "No OSM- or AWMC-derived geometry is included yet".
- `docs/design/VISUAL_SPEC.md` §9 now points to the exact string.
- Provenance wording in `data/geo/ancient-areas.geojson` and `ancient-coastline.geojson`, and the same strings in `scripts/compose-ancient-areas-safe.mjs` and `scripts/build-ancient-geo.mjs` (see "Provenance"). No geometry changed.

## Checks
Run on this branch after my changes:
- `npm run validate:data`: 0 errors, 203 warnings (unchanged).
- `npm test`: 216 of 216.
- `npm run build:data`: passes; the ancient layer is 301,164 bytes gzip.
- `npm run test:app`: 136 of 136.

## Re-check (2026-10-08)

**Scope.** Branch head `6606bf1`:
- the GIS Engineer's `bc49a37`, `52f44f4`, `e019f2b`, `e6b4a11` and `6606bf1`;
- the Research Lead's `9db4930`, merged as `a96131f`;
- the PO's ADR-0037 update of 2026-10-08 (`61a29a1`, revised in `2ed1a23`): the budget is 300,000 bytes gzip, the app's shapes and roads leave out provenance, and only AWMC's dated major roads are drawn.

**Result: two fixes left.** G1–G9 are fixed, and G6's new line agrees with Strabo. RL1, RL2 and RL5 pass, and RL4 passes apart from a citation. But RL3 fails against Josephus and Strabo, and the G4 fix shades the silted gulfs at Miletus and Ephesus as land (G10). The branch is not ready until G10, G11 and the Research Lead's RL7–RL8 are done.

### G1–G9
| Item | Status | Evidence |
|---|---|---|
| G1 Raetia | Fixed | Turicum (28 km inside), Vitudurum (25), Ad Fines (22), Arbor Felix (45) and Veldidena (51) lie in `other-roman-lands`, and so does the old gap's centre (55 km inside). The AD 69 extent now comes from `-clean -dissolve2`; the GIS's copy matches my test copy byte for byte. |
| G2 Gulf of Sirte | Fixed | No stretch of the edge runs along the Gulf of Sirte; the African edge follows the desert only. One stretch lies within 5 km of today's coast (5.4 km long, in the Danube delta, where the river meets the sea). My own scan finds the same, 29 km within 10 km of the coast at 4.7–8.1 km. |
| G3 Guadalquivir | Fixed | No edge round the marshes. The composition report lists 1,533 km² there among land that Roman land and the sea enclose, drawn without an edge. |
| G4 IJ, lower Danube, Hauran | Fixed | The edge is 8 open pieces, 9,945 km, with no closed loops. The IJ gap (4.75°E 52.42°N) is in `other-roman-lands`, 8.5 km inside; the Danube piece (27.89°E 44.84°N) 2.9 km inside; the Hauran strip in `syria`. **Correction to my first report:** its Carsium point (28.0°E 44.5°N) was about 20 km off. At Pleiades 216753 (27.95°E 44.68°N) the fort lies in `other-roman-lands`, 0.47 km inside the edge. |
| G5 Roads | Fixed | See "The roads and the size". |
| G6 Galatia–Cappadocia | Fixed | See below. |
| G7 Peninsulas | Fixed | Nicopolis is in `achaia` (1.1 km inside), and so is the Actium promontory; Sinope is in `bithynia` (0.1 km inside). |
| G8 OpenStreetMap | Fixed | `scripts/lib/osm-waterways.mjs` reads the river relations from three Overpass servers with `out meta`. The 46 way ids and versions are the same as before (composition report). |
| G9 Coastline | Fixed | The ring at 26.93–27.00°E 37.36–37.39°N is gone, as are the shores of Agathonisi and Farmakonisi; the gulfs at Ephesus and Miletus remain. |

### G6 with RL4: the Galatia–Cappadocia line
**Pass.** The line runs equidistant between Cappadocia's anchors and Galatia's (rule 2, labelled approximate). North of where it meets AWMC's AD 14 edge, that edge stays, labelled rule 3. The unsourced move near Nevşehir is gone.
- **Cappadocian side:** Tyana is 41.8 km inside `cappadocia`, Garsaura 18.8 km, Nazianzos 34.7, Mazaca 95.2 and the record's label point 43.3. Cybistra, not an anchor, also falls in `cappadocia` (3.8 km inside), as Strabo's eleventh prefecture "round Castabala and Cybistra" requires (12.1.4).
- **Galatian side:** Iconium is 58.2 km inside `galatia`, Lystra 31.9, Derbe 7.1 (both candidates), and Lake Tatta's centre 43.4.
- **The whole lake as Galatian:** right. Strabo 12.5.4: "After Galatia towards the south are situated Lake Tatta, which lies alongside Greater Cappadocia near Morimenê but is a part of Greater Phrygia, and the country continuous with this lake and extending as far as the Taurus, most of which was held by Amyntas." The lake is Phrygian, and Amyntas's lands became the province of Galatia, so its whole shore is Galatian and Cappadocia begins beyond it.
- **Provenance:** I added the Pleiades ids of Iconium (648647), Lystra (648699) and Derbe (648620) to the line's sources, from our own place records, which give the anchors' exact coordinates.
- **RL4's citation (RL7):** §2.24 row 9 cites 12.1.4 for Garsaura and quotes "the greater part of the rest of the country" and "Lycaonia and Morimene". Those words are from 12.2.10, which says where wild asses graze. Garsaura's place rests on 12.1.4 (Garsauritis among the ten prefectures) and 12.2.6: "Situated on the borders of Lycaonia is also a town called Garsauira."

### New: G10, the silted gulfs at Miletus and Ephesus
**Fail.** The G4 fix counts land of the AD 69 extent that no AWMC face covers as land to cover, wherever it doesn't touch today's coast. AWMC's faces stop at its ancient coastline, so that rule also takes in old sea that silting has turned into land. Two such pieces now join `asia` through the rule-4 pass:
- 142 km² at 27.32°E 37.54°N: the Latmian Gulf between Miletus, Myus and Heraclea under Latmus;
- 48 km² at 27.34°E 37.98°N: the old bay by Ephesus.

At `2e22c83`, 27.38°E 37.55°N, 27.47°E 37.50°N and 27.30°E 37.97°N were in no area; now they are in `asia`. Both pieces lie inside the old shores that the coastline layer draws, so the map would show the ancient coast running across land shaded as Asia. The card asks for "the silted gulfs at Ephesus and Miletus, as shapes of land that was then sea", and the PO's open question 6 considers joining only strips "that weren't sea".

**Fix (GIS):** leave out of the land to cover any piece that AWMC's shoreline marks as sea, at least inside the coastline layer's two gulfs. Acceptance: the three points above are in no area again, and the coastline layer is unchanged. The 29 km² now joined to `italy` at 12.24°E 44.60°N, by the lagoons of the Po, is the same kind of land and should follow the same rule.

### RL1–RL6
| Item | Status | Evidence |
|---|---|---|
| RL1 | Fixed | Galilee's label point is now 35.30°E 32.90°N, 4.2 km inside `galilee-perea`. |
| RL2 | Fixed | §2.25's Islands table has Lesbos, Samos and Cos (ISBE "Asia"), Chios (its "others near the Asia Minor coast") and Rhodes (ISBE "Rhodes", quoted exactly; new entry `bib:isbe-rhodes`). The Rhodes sentence now gives both views: ISBE's AD 44, and Suetonius (*Vespasian* 8.4). |
| RL3 | **Fail** | See below. |
| RL4 | Pass, citation to fix (RL7) | See above. |
| RL5 | Fixed | Smith's "Epeirus" (Perseus) has Epirus "extending from the Acroceraunian promontory and the boundaries of Illyria and Macedonia on the north to the Ambracian gulf on the south", as quoted. With Dio 53.12's "Greece with Epirus" (verified in M4-02), Karaburun is in `achaia` (1.5 km inside). The new entry `bib:smith-dictionary-epeirus` resolves. |
| RL6 | Unruled (optional) | Mljet stays an explained exception. |

### RL3: Raphia's coast
**Fail.** The ruling rests on one sentence in Livius "Nabataeans", a cite-only source: it lists Rhinocolura and Gaza among the kingdom's towns in the west. That sentence comes from an undated overview of the kingdom's reach after 63 BC. The same paragraph names Herod's kingdom as the Nabataeans' western neighbour, and calls their control of Damascus brief and of the Decapolis partial. For the first century AD, sources the project already cites say otherwise:
- Josephus, *Antiquities* 17.11.4 (4 BC): "as to Gaza, and Gadara, and Hippos, they were Grecian cities, which Caesar separated from his government, and added them to the province of Syria."
- Strabo 16.2.21: "the seaboard from Orthosia to Pelusium is called Phoenicia, which is a narrow country and lies flat along the sea, whereas the interior above Phoenicia, as far as the Arabians, between Gaza and Antilibanus, is called Judaea."
- Strabo 16.2.31 follows that seaboard from Gaza to Raphia and on to Rhinocolura, and 16.4.24 ends the Nabataeans' caravan road at "Rhinocolura, which is in Phoenicia near Aegypt".

In Strabo's day, then, the coast from Gaza to Rhinocolura was part of Phoenicia, in Syria, and the Nabataeans traded at Rhinocolura rather than holding it. Livius's list can't place that coast in their kingdom for AD 1–100. The same §2.25 paragraph still bases Sinai on the Livius sentence and on "Sinai (between the two)", which M4-02's check failed (R14) and which the data no longer uses: the timeline's `arabia` note rests on ISBE. Open question 19 and §9 repeat it.

**Mechanical fix:**
- **G11 (GIS):** move the AD 69 face between Rhinocolura and Gaza (1,814 km², label point 34.32°E 31.19°N) from `arabia` to `judea-samaria-idumea`, where the map already draws Gaza's land under rule 4 (a small unit's land stays with the area around it). AWMC's AD 69 extent holds the face as Roman, and Strabo's Phoenicia runs to Pelusium, so it belongs on the Roman side, not in the Nabataean kingdom. Sources: Josephus, *Antiquities* 17.11.4; Strabo 16.2.21, 16.2.31 and 16.4.24.
- **RL8 (Research Lead):** rewrite that §2.25 paragraph (Sinai on ISBE "Arabia" and a rule-3 line, as the `arabia` note already says; RL3 as above), open question 19 and the line in §9.
- **No change** to the edge with Egypt. AWMC's Aegyptus face takes in Rhinocolura (El-Arish, 1.7 km inside `egypt`), which Strabo puts "in Phoenicia near Aegypt"; at the border town itself, that is within the approximation.

### The roads and the size
- **Roads:** 175, all AWMC major roads with "R" among their Barrington periods (85 known, 90 conjectured), and no minor road.
  - None of the seven OBJECTIDs the first report dated after AD 100 is left.
  - The Via Nova Traiana, the Strata Diocletiana, the Via Hadriana and the Via Severiana have no period in AWMC, so the period rule leaves them out, as the provenance says.
  - 26 km of road lies more than 3 km outside the drawn areas, all of it along coasts or across lagoons. The report shortens five roads by 166 km where the Roman world ends.
  - I changed the provenance's "1203 (the Via Traiana Nova, Trajanic)" to "103 or later". Trajan reigned from 98; what dates the road after AD 100 is the milestones' fifth consulship, which Livius "Trajan" puts in 103.
- **Provenance in the app:** `ancient.shapes.json` and `ancient.roads.geojson` carry none (checked in the files); the coastline and edge files still do, which the ADR allows.
- **Size:** `npm run build:data` writes 288,497 bytes gzip for the 20 ancient files, within the 300,000 budget with 11,503 to spare:
  - shapes 120,201; roads 31,803; coastline 3,156; edge 4,429; timeline 5,424;
  - the 15 stops, 123,484.

  My provenance fixes don't change the app's files.

### The PR body
- **Accurate:** its counts match the composition report and my runs:
  - 24 valid areas;
  - the edge's 8 pieces and 9,945 km;
  - 175 roads (18,040 km, 85 known), with 5 shortened by 166 km;
  - 94 place checks: 86 inside, 6 near the border, 2 explained;
  - the size table, and the tests (221 of 221; 136 of 136).

  All 14 learning links open, including the four mapshaper anchors, and so does the stacking link I added.
- **GIS ideas:** the card's six (turning lines into shapes, dissolving, simplification, topology, buffering, clipping and erasing) each get one plain sentence and a link, and eight more ideas follow.
- **Fixed:**
  - It had no stacking note; it now says the PR is stacked on M4-02 (`data/m4-timeline`), so M4-02 merges first.
  - RL3's line, the sign-off and the open questions now point to this re-check.
  - It isn't marked ready.

### My small fixes in this commit
- `scripts/lib/ancient-roads.mjs` and `data/geo/ancient-roads.geojson`: road 1203's date is now "103 or later" (and the evidence wording).
- `scripts/compose-ancient-areas-safe.mjs` and `data/geo/ancient-areas.geojson`: Pleiades ids for Iconium, Lystra and Derbe in the Galatia–Cappadocia line's sources.
- The PR body (`.git/PR_BODY-M4-03.md`, not committed): the stacking note, RL3, the sign-off and the open questions.

### Checks
Run on this branch after my changes:
- `npm run validate:data`: 0 errors, 203 warnings (unchanged).
- `npm test`: 221 of 221.
- `npm run build:data`: passes; the ancient layer is 288,497 bytes gzip.
- `npm run test:app`: 136 of 136.

### Still open
- **GIS:** G10 (the silted gulfs), and G11 (Raphia's coast) once the Research Lead confirms RL8.
- **Research Lead:** RL7 (RL4's citation) and RL8 (RL3, the §2.25 Sinai paragraph, open question 19 and §9).
- **Then:** I re-check G10, G11, RL7 and RL8.

## Final re-check (2026-10-08)

**Scope.** Branch head `de82b19`:
- the GIS Engineer's `cc7b81c` (G10, G11) and `de82b19`;
- the Research Lead's `648676e` (RL7, RL8), merged as `b78f108`.

**Result: verified.** G10, G11, RL7 and RL8 pass. I reworded the new reader-facing notes on Gaza's coast myself (see below). The branch is ready.

| Item | Status | Evidence |
|---|---|---|
| G10 | Fixed | My four points (27.38°E 37.55°N, 27.47°E 37.50°N, 27.30°E 37.97°N and 12.24°E 44.60°N) lie in no area. In the Miletus and Ephesus boxes, today's land in no area is 294.0 km² and 108.8 km², the same as in the first round. `data/geo/ancient-coastline.geojson` and `ancient-roads.geojson` are unchanged since `8f7071c`. |
| The IJ | Acceptable | Inside the AD 69 extent, the strip is 195 km², and 40% of its outline runs along AWMC's ancient shoreline, which draws an estuary there. ADR-0037 makes the rest of the Roman world the extent "on land" and draws the edge only "where the Roman world's land meets land outside it". So the strip stays unshaded, and the edge stops at it and resumes beyond: 9 open pieces, no loop. The rule agrees with AWMC's data. |
| G11 | Fixed | The face is in `judea-samaria-idumea`: Raphia is 3.6 km inside, and the face's centre 16.4 km. Gaza is in the same area, and Rhinocolura in `egypt`. The provenance cites `bib:josephus-antiquities` (17.11.4) and `bib:strabo-geography` (16.2.21, 16.2.31, 16.4.24) with exact quotations, and `arabia`'s no longer claims the face. |
| RL7 | Fixed | §2.24 row 9 now cites 12.1.4 (Garsauritis among the ten prefectures) and 12.2.6, quoted exactly. |
| RL8 | Fixed | §2.25's paragraph rests on Josephus and Strabo, quoted correctly, and calls Livius's list an undated overview, without quoting the cite-only page. Open question 19 and §9 agree. I changed its "1,814 km²" to "1,570 km² as drawn", to match the data. |

**The reader-facing notes (ADR-0033).** The Research Lead added a sentence on Gaza's coast to five `judea-samaria-idumea` periods, and `fill:political-history` copies it into the political history of 18 places, Jerusalem's among them. As written, it needed changes:
- it said "the coastal strip north to Rhinocolura", but the strip runs south-west from Gaza;
- it used team terms ("rule 4", "see the -4-to-6 period's note", "drawn shape");
- the first note named Josephus without introducing him;
- it said the coast was "in the province of Syria throughout", including AD 41–44, but no cited source says so. Josephus gives Agrippa I "all that country over which Herod, who was his grandfather, had reigned, that is, Judea and Samaria" (*Antiquities* 19.5.1), and nothing after 4 BC places Gaza.

I rewrote the sentence as small fixes, as M4-02's verification did for other notes:
- **4 BC:** "The first-century Jewish historian Josephus adds that Augustus took Gaza, Gadara and Hippos from Archelaus's share and added them to the province of Syria. The map doesn't draw Gaza's land separately, so it shows Gaza, and the coast south-west of it as far as Egypt, with this area." This matches *Antiquities* 17.11.4: "which Caesar separated from his government, and added them to the province of Syria".
- **The four later periods:** "The map shows Gaza and the coast south-west of it, as far as Egypt, with this area, since it doesn't draw them separately."

The wording names no town that the period's sources don't support: "as far as Egypt" describes the map, where the strip ends at `egypt`. I then re-ran `npm run fill:political-history`, which updated the 18 places, and the derived-history check passes.

**Small fixes in this commit:** the notes above in `data/timeline.json` and the 18 place records, and the figure in the research note.

**The PR body:**
- It is accurate for this round: G10, the IJ, G11, the size table and the tests.
- I updated the size (289,312 bytes gzip) and RL8's line, ticked the sign-off and marked it ready.
- Its two new ideas, silting and period shorelines, have working links. AWMC's shoreline does carry a period code for each shore (A, H, HR, R and L near Miletus and Ephesus).

### Checks
- `npm run validate:data`: 0 errors, 203 warnings (unchanged), with the derived-history check.
- `npm test`: 223 of 223.
- `npm run build:data`: passes; the ancient layer is 289,312 bytes gzip of 300,000.
- `npm run test:app`: 136 of 136.
