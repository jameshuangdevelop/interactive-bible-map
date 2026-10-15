# M5 research note — Paul's four journeys

Research for card `docs/tasks/M5-02-paul-journeys.md`, phase 1. Written after reading ADR-0038 (the routes model), ADR-0017 (every clause stated by a source opened), ADR-0026 (English names) and ADR-0033 (introduce names). This note is the Research Lead's input to M5-01's data model; it does not depend on that model and adds no data files. Phase 2 (after the PO merges M5-01's schema) encodes this note as data.

## 1. How to read this note

- **Scope.** Only the four journeys Acts itself narrates as continuous travel: the three missionary journeys and the voyage to Rome. Other journeys Acts reports for Paul (to Damascus, the Jerusalem visits) are listed in §8 for the backlog, not recorded here.
- **Stages** (§3) follow Acts' own order and wording. Each stage names its `from`, `to`, passages, and whether the text says or clearly implies travel by land or by sea; where the text is silent on the mode, this note says so rather than guessing. Any place the text says the travelers passed, sailed by, or sighted on the way is listed with the stage, never promoted to a stop of its own unless the text also says they reached it.
- **Regions.** Where Acts names only a region between two towns (for example "the region of Phrygia and Galatia," Acts 16:6), the stage names the region and does not infer a town the text does not name (brief instruction; ADR-0038 item 1).
- **Stops** (§4) are every town, port or island Acts says the party reached, passed, or sailed by. A stop that already has a location record is cited by id, with no re-researched coordinate. A stop with no record gets a full entry here: English name, site with coordinates from at least two sources, confidence, today's name, and the passages that name it.
- **Names** follow ADR-0026: the title is the spelling most of the NIV, ESV, NLT, KJV, NKJV and CSB agree on, checked by comparing each version's own page at BibleGateway.com for the verse in question (spellings only, never verse text copied into this note or any record). Two places in this set turned up a version majority that differs from the WEB text the app quotes verbatim in `scripture[]`; both are flagged where they occur (§4, §7).
- **Years** (§5) report the range of scholarly views this note found, anchored to datable events, without resolving the disagreement (brief §2.6).
- **Access notes.** Pleiades' live site (`pleiades.stoa.org`) blocks automated page fetches with its "Anubis" anti-bot challenge, confirming `docs/research/SOURCES.md`'s known issue; this note instead used Pleiades' own sanctioned bulk CSV redistribution (`atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz`, the same CC BY 3.0 dataset, regenerated daily) to find each place's numeric id and representative point, matched by name and by distance to the other sources' coordinates. OpenBible.info's own site pages (`openbible.info/geo/places/<slug>`) returned 404 for direct guesses; this note instead used the project's already-evaluated alternative, OpenBible.info's own GitHub data repository (`openbibleinfo/Bible-Geocoding-Data`, `data/ancient.jsonl` and `data/modern.jsonl`), the same CC BY 4.0 dataset in its structured form. Britannica, one of the card's candidate references, returned HTTP 403 to every request in this session and could not be opened; no claim in this note relies on it. Wikidata was queried through its API (`wbsearchentities`, `Special:EntityData`, and `list=geosearch` for a handful of cases with no obvious search hit), rate-limited by the service during this session (HTTP 429), so queries were spaced out and retried.

## 2. The four routes: boundaries

| Route | Acts span | This note's choice |
|---|---|---|
| First journey | 13:1–14:28 | As the card suggests. The International Standard Bible Encyclopedia's (1915) own account gives the same span exactly: "The First Great Mission Campaign: Ac 13:1-52 and Ac 14:1-28" (`bib:isbe-paul-the-apostle-5`). No alternative boundary was found. |
| Second journey | 15:36–18:22 | As the card suggests, and again matching ISBE exactly: "The Second Mission Campaign: Ac 15:36 through Ac 18:22" (`bib:isbe-paul-the-apostle-5`). Acts 15:1–35 (the Jerusalem council itself) precedes it and is a separate round trip (§8). |
| Third journey | 18:23–21:17 | The card's suggestion, ending at the arrival in Jerusalem ("When we had come to Jerusalem, the brothers received us gladly," Acts 21:17). ISBE draws this boundary differently in its own section heading — "The Third Mission Campaign: Ac 18:23 through Ac 21:14" — ending three verses earlier, before the final approach and arrival are narrated (21:15–17: "we took up our baggage and went up to Jerusalem... the brothers received us gladly"). ISBE's very next section, however, states its own start as "Ac 21:17 through Ac 28:31" (`bib:isbe-paul-the-apostle-5`), leaving 21:15–16 assigned to neither heading — an apparent gap in ISBE's own section breaks rather than a considered alternative. This note follows the card and ends the third journey at the arrival (21:17), which is also where ISBE's next section picks up. |
| Voyage to Rome | 27:1–28:16 | As the card suggests, ending at the arrival in Rome ("When we entered into Rome...," Acts 28:16). Acts 27:1 does not itself name the port of departure; the preceding narrative places Paul in Roman custody at Caesarea (Acts 25:4, "Paul should be kept in custody at Caesarea"; 25:13–27; 26:32), so this note treats Caesarea as the journey's starting point on that basis, not as a guess. |

No source found a different starting or ending verse for the first or second journeys. Acts 11:27–30/12:25 and 15:1–4/15:30 (round trips to Jerusalem before the first and between the first and second journeys) and Acts 9 (to Damascus) are separate journeys, listed in §8, not alternative boundaries of these four.

## 3. Stages

Mode is `land`, `sea`, or `not stated` (the text gives no verb of travel and no other journey here implies one). A region named only as the path between two stops is given in the "Regions / passed" column, not as its own row. **Updated after the Fact-Checker's verification** (`docs/verification/M5-paul-journeys.md`): a place the text says the party reached is now its own row rather than folded into a longer stage's "Regions / passed" column (Derbe–Lystra–Iconium–Antioch on the first journey; Cenchreae on the second; Mitylene, Chios, Samos, Trogyllium, Cos and Rhodes on the third); Macedonia and Achaia are no longer stage endpoints on the third journey, only regions named on one "path not known" stage between Ephesus and Philippi; Cyprus and Lycaonia are no longer listed as regions on stages whose own stop already stands within them; and two stages this note had read as "land" ("went down to" Seleucia and to Attalia) are now "not stated," since the geographer Strabo describes a river-navigation alternative to the coast road in this period (16.2.7), so land is not clearly implied after all.

### 3.1 First journey (Acts 13:1–14:28)

| From | To | Passages | Mode | Regions / passed |
|---|---|---|---|---|
| Antioch (Syria) | Seleucia | 13:4 | not stated | "they went down to Seleucia" states no mode; a river-navigation alternative to a coast road existed in this period (the geographer Strabo, 16.2.7, `bib:strabo-geography`), so this note no longer assumes land |
| Seleucia | Salamis (Cyprus) | 13:4–5 | sea | "sailed to Cyprus" |
| Salamis | Paphos | 13:6 | land | "gone through the island" |
| Paphos | Perga (Pamphylia) | 13:13 | sea | John Mark leaves the party here and returns to Jerusalem — his own trip, not Paul's |
| Perga | Antioch (Pisidia) | 13:14 | land | |
| Antioch (Pisidia) | Iconium | 13:51 | land | |
| Iconium | Lystra | 14:6 | land | "the cities of Lycaonia, Lystra, Derbe, and the surrounding region" names the region the stop stands in, not a region between stops |
| Lystra | Derbe | 14:6, 14:20 | land | |
| Derbe | Lystra | 14:21 | land | return leg |
| Lystra | Iconium | 14:21 | land | |
| Iconium | Antioch (Pisidia) | 14:21 | land | "returned to Lystra, Iconium, and Antioch" names all three as places reached, each its own stage |
| Antioch (Pisidia) | Perga (Pamphylia) | 14:24–25 | land | "passed through Pisidia and came to Pamphylia" |
| Perga | Attalia | 14:25 | not stated | "they went down to Attalia" states no mode; the same Strabo passage applies (`bib:strabo-geography`) |
| Attalia | Antioch (Syria) | 14:26 | sea | the text says only "sailed to Antioch"; Seleucia, Antioch's port, is not named again here |

### 3.2 Second journey (Acts 15:36–18:22)

| From | To | Passages | Mode | Regions / passed |
|---|---|---|---|---|
| Antioch (Syria) | Derbe | 15:41, 16:1 | land | "He went through Syria and Cilicia, strengthening the assemblies" — regions only, no towns named |
| Derbe | Lystra | 16:1 | land | order reversed from the first journey's return leg |
| Lystra | Troas | 16:6–8 | land | "the region of Phrygia and Galatia," then "opposite Mysia"; "tried to go into Bithynia, but the Spirit didn't allow them" — Bithynia is named but never entered |
| Troas | Samothrace | 16:11 | sea | "made a straight course" |
| Samothrace | Neapolis | 16:11 | sea | |
| Neapolis | Philippi | 16:12 | land | |
| Philippi | Thessalonica | 17:1 | land | passed through Amphipolis and Apollonia without staying |
| Thessalonica | Berea | 17:10 | land | sent away "by night" |
| Berea | Athens | 17:14–15 | not stated | the text names no port and no ship; it says only that Paul was sent "to go as far as to the sea" and that his escorts "brought him as far as Athens" |
| Athens | Corinth | 18:1 | not stated | |
| Corinth | Cenchreae | 18:18 | land | Paul "shaved his head in Cenchreae," Corinth's eastern harbor on a different gulf a short distance away; no sea route connects the two directly |
| Cenchreae | Ephesus | 18:18–19 | sea | |
| Ephesus | Caesarea | 18:21–22 | sea | Caesarea is named at 18:22 ("when he had landed at Caesarea") |
| Caesarea | Antioch (Syria) | 18:22 | not stated | "went up and greeted the assembly, and went down to Antioch" — the text does not name where Paul "went up," so this is no stop; see note below |

**On Acts 18:22's unnamed stop.** Acts says only "he went up and greeted the assembly, and went down to Antioch," without naming a city. The International Standard Bible Encyclopedia reads this as "probably" Jerusalem, in its own hedged wording. This note follows that reading but does not record Jerusalem as a stop here, since the text itself never names it; the stage runs from Caesarea to Antioch directly.

### 3.3 Third journey (Acts 18:23–21:17)

| From | To | Passages | Mode | Regions / passed |
|---|---|---|---|---|
| Antioch (Syria) | Ephesus | 18:23, 19:1 | land | "the region of Galatia and Phrygia" — order reversed from 16:6's "Phrygia and Galatia"; "having passed through the upper country" |
| Ephesus | Philippi | 20:1–6 | not stated | names only regions between the stops: Macedonia (20:1), then Achaia, which Acts calls "Greece" (20:2, a three-month stay with no city named), then Macedonia again on the return (20:3); Philippi itself is named only implicitly, as the point the next, explicitly maritime, leg departs from (20:6) |
| Philippi | Troas | 20:6 | sea | "we sailed away from Philippi... and came to them at Troas in five days" |
| Troas | Assos | 20:13 | land | recorded as Paul's own leg: the companions "set sail for Assos" by ship, but Paul himself went "by land", rejoining the ship there |
| Assos | Mitylene | 20:14 | sea | |
| Mitylene | Samos | 20:15 | sea | passed "opposite Chios" |
| Samos | Trogyllium | 20:15 | sea | "stayed at Trogyllium" is present in the WEB text used here; several early manuscripts and some modern versions omit it (§7) |
| Trogyllium | Miletus | 20:15 | sea | |
| Miletus | Cos | 21:1 | sea | |
| Cos | Rhodes | 21:1 | sea | |
| Rhodes | Patara | 21:1 | sea | |
| Patara | Tyre (via Phoenicia) | 21:2–3 | sea | new ship "crossing over to Phoenicia"; Cyprus sighted "on the left hand", not landed |
| Tyre | Ptolemais | 21:7 | sea | "finished the voyage from Tyre" |
| Ptolemais | Caesarea | 21:8 | not stated | the text drops the sailing language used for the previous leg ("finished the voyage") and says only "departed and came to Caesarea"; this note does not assume either mode |
| Caesarea | Jerusalem | 21:15–17 | land | "took up our baggage and went up to Jerusalem" |

### 3.4 Voyage to Rome (Acts 27:1–28:16)

| From | To | Passages | Mode | Regions / passed |
|---|---|---|---|---|
| [Caesarea] | Sidon | 27:1, 27:3 | sea | departure port not named in the text itself; see §2 |
| Sidon | Myra (Lycia) | 27:4–5 | sea | sailed "under the lee of Cyprus" (sighted, not landed); "across the sea off Cilicia and Pamphylia"; changed ships at Myra (27:6) |
| Myra | Fair Havens, near Lasea (Crete) | 27:7–8 | sea | passed "opposite Cnidus"; sailed "under the lee of Crete, opposite Salmone" |
| Fair Havens | Malta | 27:9–26, 27:27–44, 28:1 | sea | one stage covers the whole storm narrative: the majority planned to winter at Phoenix but never arrived (§4.2, §6.4); driven by the storm wind Acts calls Euroclydon, past Crete and "under the lee of" Cauda; feared running aground on "the Syrtis sand bars" (not reached); driven for fourteen days across the sea Acts calls "Adria" (§6.4); the ship ran aground and broke apart, and all aboard reached land safely |
| Malta | Syracuse | 28:11–12 | sea | new ship, wintered at Malta |
| Syracuse | Rhegium | 28:13 | sea | "circled around" |
| Rhegium | Puteoli | 28:13–14 | sea | |
| Puteoli | Rome | 28:14–16 | land | met en route by believers from Rome at Forum of Appius and Three Taverns, both on the Appian Way (`bib:isbe-taverns-three`, `bib:isbe-appii-forum`) |

## 4. Stops

### 4.1 Stops with an existing record

| Record id | Name(s) in the text | Journey/passages |
|---|---|---|
| `antioch-syria` | Antioch (Syria) | 1st (13:1, 14:26), 2nd (15:40 start, 18:22 end), 3rd (18:23 start) |
| `cyprus` | Cyprus | 1st (13:4, sailed to — island reached, see note below); 3rd (21:3, sighted); voyage (27:4, sailed under the lee of) |
| `salamis-cyprus` | Salamis | 1st (13:5) |
| `paphos` | Paphos | 1st (13:6, 13:13) |
| `perga` | Perga | 1st (13:13–14, 14:25) |
| `pamphylia` | Pamphylia | 1st (13:13, 14:24); voyage (27:5, sea off) |
| `antioch-pisidia` | Antioch (Pisidia) | 1st (13:14, 14:21) |
| `pisidia` | Pisidia | 1st (14:24, region passed through) |
| `iconium` | Iconium | 1st (13:51, 14:21) |
| `lycaonia` | Lycaonia | 1st (14:6, region) |
| `lystra` | Lystra | 1st (14:6, 14:21); 2nd (16:1) |
| `derbe` | Derbe | 1st (14:6, 14:20–21); 2nd (16:1) |
| `syria` | Syria | 2nd (15:41, region) |
| `cilicia` | Cilicia | 2nd (15:41, region); voyage (27:5, sea off) |
| `galatia` | Galatia | 2nd (16:6, region); 3rd (18:23, region) |
| `phrygia` | Phrygia | 2nd (16:6, region); 3rd (18:23, region) |
| `mysia` | Mysia | 2nd (16:7–8, region) |
| `bithynia` | Bithynia | 2nd (16:7, considered and refused) |
| `troas` | Troas | 2nd (16:8, 16:11 start); 3rd (20:6, 20:13 start) |
| `neapolis-macedonia` | Neapolis | 2nd (16:11) |
| `philippi` | Philippi | 2nd (16:12, 17:1 start); 3rd (20:6, implied departure port) |
| `thessalonica` | Thessalonica | 2nd (17:1, 17:13) |
| `berea` | Berea (Beroea) | 2nd (17:10, 17:13) |
| `athens` | Athens | 2nd (17:15–16, 18:1 start) |
| `corinth` | Corinth | 2nd (18:1, 18:18); 3rd (20:2–3, as "Greece") |
| `cenchreae` | Cenchreae | 2nd (18:18) |
| `ephesus` | Ephesus | 2nd (18:19, 18:21); 3rd (18:24–19:1, 19:1–20:1) |
| `caesarea-maritima` | Caesarea | 2nd (18:22); 3rd (21:8, 21:16); voyage (implied start, §2) |
| `jerusalem` | [Jerusalem] | 2nd (18:22, unnamed — §3.2); 3rd (21:17, end) |
| `macedonia` | Macedonia | 3rd (20:1, 20:3, region) |
| `achaia` | Achaia ("Greece") | 3rd (20:2, region) |
| `tyre` | Tyre | 3rd (21:3–6) |
| `malta` | Malta | voyage (28:1–10) |
| `puteoli` | Puteoli | voyage (28:13–14) |
| `rome` | Rome | voyage (28:14, 28:16, end) |

**On Cyprus and Lycaonia in this table.** Acts 13:4 and 14:6 name these two regions in the text, so they appear above; after the Fact-Checker's verification, the stage data itself no longer stores either as a `namedRegions` entry where the stage's own stop (Salamis; Lystra) already stands within it, since the region is then implied rather than separately named between two other stops (ADR-0038 item 1; §3 preamble).

### 4.2 New stop entries

Each entry gives the proposed id and English name, the site with coordinates (`lon, lat`) and sources, a confidence, today's name, and the passages that name it. A "(passed)" mark on the passage means the stage structure in §3 keeps that place in a stage's own list of places passed rather than as a stage's own endpoint (still with its own stop entry here, per ADR-0038 item 2); every other entry below is the end of its own stage. Coordinates were cross-checked across Pleiades' bulk dataset, OpenBible.info's structured data, and Wikidata; all three agree within a few kilometers for every entry below. **Updated after the Fact-Checker's verification:** Apollonia's cited Wikidata item was the modern village, not the ancient town, and its "today" name now follows the ancient town's own item and Pleiades rather than the 1915 reading this note first gave; Trogyllium's "today" name now follows Pleiades directly rather than a secondhand copy of it; several "today" names that rested only on a nearest-feature search now instead cite each site's own Wikidata "located in" statement (Seleucia, Myra, Cnidus, the Forum of Appius); the stop titled "The Forum of Appius" in this note's first draft is "Forum of Appius" without "The," since none of the six compared versions prints "The" before "Forum"; and the "passed" marks themselves were re-checked stop by stop against the corrected stages, matching each place's own verb in the text (for example, Samothrace is "a straight course to," so it is reached, not passed, even though it is also only an overnight anchorage).

| Proposed id | English name | Site (lon, lat) | Confidence | Sources | Today | Passages |
|---|---|---|---|---|---|---|
| `seleucia` | Seleucia | 35.922, 36.124 | high | `pleiades:658483`, `openbible:seleucia`, `wikidata:Q1605894`, `bib:isbe-seleucia` | Hatay Province, Türkiye (Wikidata's own "located in" statement) | 13:4 |
| `attalia` | Attalia | 30.7036, 36.8813 | high | `pleiades:638778`, `openbible:attalia`, `wikidata:Q6487`, `bib:isbe-attalia` | Antalya, Türkiye | 14:25 |
| `samothrace` | Samothrace | 25.5833, 40.45 | high | `pleiades:501597`, `openbible:samothrace`, `wikidata:Q203175`, `bib:isbe-samothrace` | Samothraki, Greece | 16:11 |
| `amphipolis` | Amphipolis | 23.8472, 40.8202 | high | `pleiades:501347`, `openbible:amphipolis`, `wikidata:Q217414`, `bib:isbe-amphipolis` | Amphipolis, Greece (Wikidata places the site in today's municipality of the same name) | 17:1 (passed) |
| `apollonia-macedonia` | Apollonia | 23.4697, 40.6237 | high | `pleiades:491526`, `openbible:apollonia`, `wikidata:Q2751389`, `bib:isbe-apollonia` | Near Nea Apollonia, Greece (Pleiades, and the ancient town's own Wikidata item, Q2751389; ISBE's 1915 "the modern Pollina" is a different, older reading, kept as a secondary note) | 17:1 (passed) |
| `assos` | Assos | 26.3367, 39.4906 | high | `pleiades:550463`, `openbible:assos`, `wikidata:Q744631`, `bib:isbe-assos` | Behramkale, Türkiye (a Wikidata alias) | 20:13–14 |
| `mitylene` | Mitylene | 26.547, 39.1105 | high | `pleiades:550763`, `openbible:mitylene`, `wikidata:Q189059`, `bib:isbe-mitylene` | Mytilene, Greece | 20:14 |
| `chios` | Chios | 26.1375, 38.3725 | high | `pleiades:550496` (town) and `550497` (island), `openbible:chios`, `wikidata:Q160483`, `bib:isbe-chios` | Chios, Greece | 20:15 (passed) |
| `samos` | Samos | 26.8333, 37.75 | high | `pleiades:599926`, `openbible:samos`, `wikidata:Q156882`, `bib:isbe-samos` | Samos, Greece | 20:15 |
| `trogyllium` | Trogyllium | 27.0033, 37.6594 | high (site); disputed (textual presence, §6.3) | `pleiades:599991`, `openbible:trogyllium`, `wikidata:Q2937072`, `bib:isbe-trogyllium` | Dip Burun, Türkiye (Pleiades) | 20:15 |
| `cos` | Cos | 27.1103, 36.8153 | high | `pleiades:599581`, `openbible:cos`, `wikidata:Q187027`, `bib:isbe-cos` | Kos, Greece | 21:1 |
| `rhodes` | Rhodes | 28.2109, 36.4402 | high | `pleiades:590030`, `openbible:rhodes-1`, `wikidata:Q188731`, `bib:isbe-rhodes` | Rhodes, Greece | 21:1 |
| `patara` | Patara | 29.3142, 36.2603 | high | `pleiades:639042`, `openbible:patara`, `wikidata:Q233121`, `bib:isbe-patara`, `bib:isbe-lycia` | Gelemiş, Türkiye (ISBE: "Gelemish is the modern name of the ruin") | 21:1 |
| `myra` | Myra | 29.9853, 36.2592 | high | `pleiades:639005`, `openbible:myra`, `wikidata:Q652024`, `bib:isbe-myra`, `bib:isbe-lycia` | Demre, Türkiye (Wikidata's own "located in" statement) | 27:5 |
| `cnidus` | Cnidus | 27.375, 36.6858 | high | `pleiades:599575`, `openbible:cnidus`, `wikidata:Q690575`, `bib:isbe-cnidus` | Datça, Muğla Province, Türkiye (Wikidata's own "located in" statement) | 27:7 (passed) |
| `salmone` | Salmone | 26.3116, 35.316 | high | `pleiades:590037`, `openbible:salmone`, `wikidata:Q2937111`, `bib:isbe-phoenix` | Cape Sideros, Crete, Greece | 27:7 (passed) |
| `fair-havens` | Fair Havens | 24.8003, 34.9297 | high | `pleiades:589834`, `openbible:fair-havens`, `wikidata:Q11818846`, `bib:isbe-fair-havens`, `bib:isbe-phoenix` | Kaloi Limenes, Crete, Greece | 27:8 |
| `cauda` | Cauda | 24.0833, 34.8333 | high | `pleiades:589858`, `openbible:cauda`, `wikidata:Q213895`, `bib:isbe-phoenix` | Gavdos, Greece | 27:16 (passed) |
| `sidon` | Sidon | 35.3719, 33.561 | high | `pleiades:678393`, `openbible:sidon`, `wikidata:Q163490`, `bib:isbe-sidon` | Sidon, Lebanon | 27:3 |
| `syracuse` | Syracuse | 15.2931, 37.0639 | high | `pleiades:462503`, `openbible:syracuse`, `wikidata:Q13670`, `bib:isbe-syracuse` | Syracuse, Italy (Siracusa, per ISBE's own Italian form) | 28:12 |
| `rhegium` | Rhegium | 15.6441, 38.1088 | high | `pleiades:452416`, `openbible:rhegium`, `wikidata:Q8471`, `bib:isbe-rhegium` | Reggio Calabria, Italy | 28:13 |
| `three-taverns` | Three Taverns | 12.8739, 41.5619 | high | `pleiades:423106`, `openbible:three-taverns`, `wikidata:Q622536`, `bib:isbe-taverns-three` | None stated by any source opened | 28:15 (passed) |
| `forum-of-appius` | Forum of Appius | 12.9975, 41.4664 | high | `pleiades:422927`, `openbible:forum-of-appius`, `wikidata:Q3748871`, `bib:isbe-appii-forum`, and the six compared versions (§7) | In the comune of Latina, Italy (Wikidata's own "located in" statement) | 28:15 (passed) |
| `ptolemais` | Ptolemais | 35.0692, 32.9214 | high | `pleiades:678010`, `openbible:ptolemais`, `wikidata:Q126084`, `bib:isbe-ptolemais` | Acre, Israel | 21:7 |

**Researched but not recorded as stops: Phoenix and Lasea.** Per the PO's ruling (§9), neither is a stop: the storm kept Paul's ship from ever reaching Phoenix, the majority's intended winter harbor (27:12–15), and Lasea is named only as a landmark near Fair Havens (27:8). Both stay researched here for a possible future record.
- **Phoenix:** two candidates. Near modern Loutro — ISBE's own preferred identification, based on W. M. Calder's 1915 analysis following James Smith's 19th-century study: "the only safe harbor on the South coast of Crete in which a ship large enough... could moor is the harbor beside Loutro... All the ancient authorities agree in placing Phoenix in this neighborhood," though Calder notes a real difficulty — the harbor at Loutro faces east, not the "southwest and northwest" the Greek text describes, which Calder resolves by reading the phrase as nautical shorthand for the wind directions the harbor is sheltered *from* rather than the compass points it faces (`pleiades:589993`, `wikidata:Q1872352`, `bib:isbe-phoenix`). Near Finikas, on the bay west of the Loutro isthmus — the reading that takes "looking toward the southwest and northwest" at face value; ISBE records this as Bishop Wordsworth's proposal but judges the resulting roadstead "not a suitable place for wintering in" (`pleiades:589992`, `wikidata:Q21773510`, `bib:isbe-phoenix`).
- **Lasea:** ruins about 5 miles east of Fair Havens, examined in 1856 (ISBE). Coordinates 24.8111, 34.9406; `pleiades:589897`, `openbible:lasea`, `wikidata:Q6492763`, `bib:isbe-lasea`.

**Rhodes's "Lindos" clause, removed (Acts 21:1).** OpenBible.info's own identification page for Rhodes includes a comment that "one tradition has Paul arriving near Lindos instead of the city of Rhodes." Earlier drafts of this note and of the encoded data repeated that comment as the clause's only support. Per ADR-0017, a dataset's own comment supports identification and coordinates, not a standalone historical claim, and no bibliographic source this note opened states such a tradition: the International Standard Bible Encyclopedia's own "Rhodes" article says only that Rhodes is "mentioned in the New Testament only as a point where Paul touched on his voyage" (`bib:isbe-rhodes`), with no mention of Lindos; Smith's *Dictionary of Greek and Roman Geography*'s "Lindus" entry describes the ancient town's history with no mention of Paul or Acts (`bib:smith-dictionary-lindus`). The clause has accordingly been removed from the `paul-3` route's note and from the `rhodes` stop's `support` text, and is not restated here.

## 5. Years

No ancient source gives Paul's journeys an unambiguous year, and the scholarly schemes differ by several years at every point while keeping nearly the same shape and order. ISBE's 1915 survey compares ten such schemes (Turner, Bartlet, Harnack, McGiffert, Zahn, Ramsay, Lightfoot, Clemen, Findlay, Hoennicke), introduced with its own assessment: "There is not a single date in the life of Paul that is beyond dispute, though several are narrowed to a fine point, and the general course and relative proportion of events are clear enough" (`bib:isbe-paul-the-apostle-3`). Its table, reproduced here for the rows that survived this encyclopedia's own web conversion intact (its "visit(s) to Jerusalem" and "Jerusalem meeting" rows are corrupted by stray autolinking in the source HTML and are not used):

| Scholar | 1st journey | 2nd journey | 3rd journey | Arrest in Jerusalem | Arrival in Rome |
|---|---|---|---|---|---|
| Turner | 47 | 49 | 52 | 56 | 59 |
| Bartlet | 47 | 49 | 52 | 56 | 59 |
| Harnack | 45 | 46–47 | 50 | 53–54 | 56–57 |
| McGiffert | before 45 | 46 | 49 | 53 | 56 |
| Zahn | 50–51 | 52 | 54 | 58 | 61 |
| Ramsay | 46–48 | 50–53 | 53–57 | 57 | 60 |
| Lightfoot | 48 | 51 | 54 | 58 | 61 |
| Clemen | 46 | 49–52 | 53–59 | 59 | 62 |
| Findlay | 46 | 49 | 53 | 57 | 60 |
| Hoennicke | 49? | — | — | — | 60–62 |

ISBE's own narrative gives running dates for each journey, reached by working backward from the Gallio inscription (below): first journey "47 and 48 AD"; the Jerusalem conference "49 AD"; second journey "49-51 (or 52) AD"; its own section on Acts 18:23-21:14 (three verses short of where this note's third journey ends, 21:17 — see §2), "52 (or 53)-57 (or 58) AD"; and the period from the arrival in Jerusalem through the Roman imprisonment, which contains the voyage, "57-62 (or 63) AD" (`bib:isbe-paul-the-apostle-5`). Its synthesis reasons forward from a different anchor for the voyage specifically — the succession of the governor Festus — placing the sailing for Rome "in the late summer of 59 AD" and the arrival "in the early spring... of 60 AD" (`bib:isbe-paul-the-apostle-3`), consistent with the "Arrival in Rome" row above once the two- or three-year gap for Paul's Caesarean custody (Acts 24:27) is added back from the "Arrest in Jerusalem" row.

**The Gallio inscription (anchoring the second journey, Corinth).** Acts dates Paul's appearance before the Jewish accusers in Corinth to when "Gallio was proconsul of Achaia" (Acts 18:12), after Paul had, in ISBE's own word, "apparently" already been in the city eighteen months (Acts 18:11). A Greek inscription from the emperor Claudius to the people of Delphi, dated to about AD 52, names "Lucius Junius Gallio, my friend and proconsul of Achaea." C. D. Elledge, associate professor of religion at Gustavus Adolphus College, writing for the Society of Biblical Literature's Bible Odyssey project, calls the inscription's date "an important benchmark for the chronology of Paul's Corinthian mission" and reads it, together with Gallio's one-year proconsular term, as placing "Paul's activity at Corinth... from 50-51 C.E." (`bib:bibleodyssey-erastus-gallio-paul`). ISBE reaches the same inscription independently, through the German scholar Adolf Deissmann's analysis of its reference to Claudius's twenty-sixth acclamation as imperator, concluding Gallio took office "either... the summer of 51 or 52 AD," while cautioning that "we do not get a certain date as to the year" (`bib:isbe-paul-the-apostle-3`).

**A famine under Claudius (background to the first journey's start).** Before the first journey, Barnabas and Saul carried famine relief from Antioch to Jerusalem (Acts 11:27–30, 12:25 — left out of this note's four journeys, §8). ISBE's own account of Paul's life places that visit at "the end of 44 or beginning of 45," and its separate "Famine" article dates the famine itself, which "severely affected Palestine," to AD 45 (`bib:isbe-famine`; also `bib:josephus-antiquities`), without calling either date a fixed anchor for the journey that follows.

**Each route's year range, per ADR-0038 item 7.** Rather than each route's own narrow ISBE dates alone, `fromYear`–`toYear` covers the wider ten-scholar range the table above reports: first journey 44–51 (McGiffert's "before 45," read as 44, to Zahn's 50–51); second journey 46–53 (McGiffert to Ramsay); third journey 49–59 (McGiffert's start to Clemen's range, including the arrest in Jerusalem that follows it); voyage to Rome 55–62 (the year before McGiffert's earliest arrival, since the party wintered on Malta on the way, to Clemen's latest). Each route's `yearNote` gives ISBE's own narrower dates alongside this wider range.

## 6. Notes

### 6.1 First journey

- Pisidia and Pamphylia (14:24) and Lycaonia (14:6) are regions, not individual stops; their own records describe the province history that places Antioch (Pisidia), Iconium, Lystra and Derbe together under the Roman province of Galatia in Paul's time, not under the later "Lycia and Pamphylia" province formed in AD 74 — the existing `galatia.json` record already covers this neutrally and is not re-derived here.
- **Which congregations Paul's letter to the Galatians addresses.** His letter is written to "the assemblies of Galatia" (Galatians 1:2); which congregations he meant is a long-standing and unresolved debate. The "South Galatian" view holds he meant the congregations this journey reaches, in the province's southern cities (Antioch in Pisidia, Iconium, Lystra and Derbe); the "North Galatian" view holds he meant ethnically Galatian congregations further north, which this journey does not reach. The existing `galatia.json` record already presents both views neutrally, citing the same source (`bib:zondervan-who-were-galatians`) this route's own note now also gives both views from directly, as on the second and third journeys (§6.2, §6.3).

### 6.2 Second journey

- **"The region of Phrygia and Galatia" (16:6).** Whether this names one mixed area or two adjacent regions, and which congregations Paul's later letter to the Galatians addresses (the cities reached on the first journey, in the province's south, or an ethnically Celtic area further north), is a long-standing and unresolved debate. The existing `galatia.json` record already presents the "North Galatian" and "South Galatian" views neutrally, citing the same source (`bib:zondervan-who-were-galatians`) this route's own note now also gives both views from directly.
- **Acts 18:22's unnamed stop.** See §3.2's note: the International Standard Bible Encyclopedia reads this as "probably" Jerusalem, in its own hedged wording, but the text itself never names it, so it is not recorded as a stop.
- **Berea to Athens (17:14–15).** The text says the brothers sent Paul "to go as far as to the sea," then that his escorts "brought him as far as Athens," without ever naming a ship, a port, or a road. This note does not assume a sea crossing (a common inference, since Berea lies well inland and "to the sea" would otherwise be an odd detail to record) nor rule one out; the mode is recorded as "not stated" in §3.2.

### 6.3 Third journey

- **"The region of Galatia and Phrygia" (18:23)**, reversing 16:6's order ("Phrygia and Galatia"). This note does not read significance into the reversal beyond recording it; see the same `galatia.json` cross-reference as above, which this route's own note also repeats briefly.
- **"Stayed at Trogyllium" (20:15).** Several early manuscripts omit this clause; Westcott and Hort's critical edition treats it as a later addition. WEB, like the KJV and NKJV, includes it; several modern versions omit it from their main text and footnote it instead. See §7 for why this is a textual note rather than a naming decision like Cauda and Forum of Appius.
- **"Greece" for Achaia (20:2).** Acts uses "Greece" here where it elsewhere uses the province name "Achaia" (18:12, 18:27); the existing `achaia.json` record already documents this as the same region under two names. Acts 20:1–6 names only these regions (Macedonia, then Achaia, then Macedonia again), not a town, for this leg; per the Fact-Checker's correction, the data records this as one "path not known" stage naming the regions, not as stops in their own right (§3.3). The text does not name a city for the three-month stay in Achaia; the International Standard Bible Encyclopedia places a plot against Paul's life specifically in Corinth around this time, which this note takes as its basis for associating the stay with that city, rather than the wider claim that "many interpreters" do so.
- **A possible unrecorded visit.** Some readings of 2 Corinthians (for example 2 Corinthians 2:1, 12:14, 13:1's "third time") have been taken to imply a further, "painful" visit to Corinth that Acts does not narrate at all, between the second and third journeys. Since no passage in Acts itself describes such a visit, this note does not add it as a stage or stop; it is noted here only so the gap is not mistaken for an oversight.
- **Patara and the "and Myra" variant (21:1).** Some manuscripts add "and Myra" after Patara in this verse (noted in `bib:esv-2025-biblegateway`'s own footnote to its translation). WEB and the majority of the compared versions do not include it; this note follows WEB and does not add Myra as a third-journey stop.
- **Rhodes or Lindos (21:1).** See §4.2: a dataset comment about a Lindos landing tradition was removed from the route's note and the stop's `support` text, since no bibliographic source states it (§9 item 5).
- **Illyricum.** Paul's letter to the Romans states that his preaching reached "from Jerusalem, and around as far as to Illyricum" (Romans 15:19). Since Acts never narrates a visit there on any of these four journeys, and the existing `illyricum.json` record already covers the region on its own terms, this note does not add it as a stage or stop of the third journey, even though its Macedonian travels (20:1–3) place Paul in the neighboring province.

### 6.4 Voyage to Rome

- **Which island is Malta (28:1).** Already fully covered, with both the traditional (Malta) and minority (Mljet) identifications and their sources, by the existing `malta.json` record; this route's own note, per the Fact-Checker's correction, now also states both views directly rather than only deferring to that record, citing, among `malta.json`'s own sources, the Hill Museum & Manuscript Library's "Contesting Saint Paul's Shipwreck" for the minority Mljet view (`bib:hmml-contesting-shipwreck`).
- **Phoenix's orientation and identity (27:12).** See §4.2. The disagreement is over which of two nearby harbors the Greek phrase "looking southwest and northwest" describes, and whether that phrase means the compass points the harbor faces or the winds it is sheltered from.
- **Cauda or Clauda (27:16).** See §7 — a manuscript spelling difference with its own naming consequence under ADR-0026.
- **"Adria" (27:27).** Acts says the ship was "driven to and fro in the sea of Adria" for fourteen days. In first-century usage this name covered a much larger area than the modern Adriatic Sea: ISBE traces its gradual extension "so as to reach... later the Strait of Hydruntum... [and] even the waters between Crete and Malta," citing the Roman-era writers Orosius and Procopius for the widest sense, and notes that the Jewish historian Josephus describes his own shipwreck in "the middle of the Adria" on a voyage between Cyrene and Puteoli — the same waters this voyage crosses (`bib:isbe-adria`). No separate stop is recorded for this sea; it is a naming note only, cited only by this research note (not yet added to the route's own `sources`).
- **Syrtis (27:17).** The sailors feared running aground on these sandbars (off the coast of modern Libya) and took action to avoid them; the ship never reached or passed them, so this note does not record Syrtis as a stop (ADR-0038 item 1: stops are places reached, passed, or sailed by, not merely feared).
- **Forum of Appius and Three Taverns, in order (28:15).** ISBE places the Forum of Appius 43 Roman miles from Rome and Three Taverns 33 (`bib:isbe-appii-forum`, `bib:isbe-taverns-three`); Paul's party, approaching Rome from the south, would reach the farther station first, which matches the order Acts 28:15 itself names them in.
- **Forum of Appius (28:15).** See §7 — a translation-wording difference with its own naming consequence under ADR-0026. The Fact-Checker further corrected the title to "Forum of Appius," without "The," since none of the six compared versions prints a capitalized article before "Forum."

## 7. Two naming departures from the WEB text (ADR-0026)

The app quotes the WEB text verbatim in every `scripture[]` entry; a record's *title* instead follows whichever name most of the NIV, ESV, NLT, KJV, NKJV and CSB agree on (ADR-0026). Checking each of these two stops' versions individually (comparing spellings and wording only, never copying verse text into this note) found the WEB wording to be a minority reading in both cases:

1. **Acts 27:16.** WEB reads "a small island called Clauda." Of the six compared versions, four (NIV, ESV, NLT, CSB) read "Cauda" and two (KJV, NKJV) read "Clauda." "Cauda" is also the form reflected in the island's modern Greek name, Gavdos. ISBE's "Phoenix" article independently confirms this is a real manuscript split, not a translation choice: "called Cauda or Clauda (Kauda (Codex Sinaiticus corrected, and Codex Vaticanus, and the Old Latin) or Klauda (Codex Sinaiticus uncorrected, and Codex Alexandrinus...))" (`bib:isbe-phoenix`). This note proposes the title **Cauda**, with WEB's "Clauda" still shown verbatim wherever the passage itself is quoted.
2. **Acts 28:15.** WEB reads "The Market of Appius," the example the card itself names. Of the six compared versions, three (NIV, ESV, CSB) read "the Forum of Appius" (lowercase article), two (KJV, NKJV) read "Appii Forum," and one (NLT) reads only "the Forum" in its main text (footnoting the distance from Rome, not an alternate name). No version reads "Market." This note first proposed the title "The Forum of Appius"; the Fact-Checker corrected it to **Forum of Appius**, without "The," since the capitalized article belongs to WEB's own styling, not to the majority's wording, and the data's existing "Three Taverns" (not "The Three Taverns") already follows the same rule. WEB's own wording is kept verbatim wherever the passage itself is quoted.

**Trogyllium and the "and Myra" variant are different in kind** from these two: both are places present or absent across manuscripts and versions, not alternate spellings/wordings of the same place, so ADR-0026's spelling-majority rule does not apply to them the same way. They are recorded as textual notes (§3.3, §6.3) rather than naming decisions.

## 8. Left out (for the backlog)

These are journeys Acts reports for Paul outside the four above. Not recorded as data in this task.

- **Saul's journey to Damascus and back (Acts 9).** Jerusalem to Damascus (9:1–3, commissioned to arrest believers); within Damascus, escape over the wall by night (9:23–25); Damascus to Jerusalem (9:26, first visit after his conversion); Jerusalem to Caesarea to Tarsus (9:30). Galatians 1:17 (not Acts) adds a trip "into Arabia" and back to Damascus within this same period.
- **Barnabas brings Saul from Tarsus to Antioch (Acts 11:25–26).**
- **The famine-relief visit: Antioch to Jerusalem and back (Acts 11:27–30, 12:25).** Dated to about AD 45–46 (§5); immediately precedes the first journey.
- **The Jerusalem council trip: Antioch to Jerusalem, via Phoenicia and Samaria, and back (Acts 15:1–4, 15:30).** Immediately precedes the second journey; Acts 15:36 (the second journey's own start) follows directly after.

Peter's and other apostles' journeys (for example Joppa and Caesarea in Acts 9–10) are not Paul's and were never in scope for this card.

## 9. Open questions for the Fact-Checker

All seven were answered by the PO before phase 2 (the data) was encoded; each is recorded below with the answer and how phase 2 carried it out. The Fact-Checker still independently re-checks every one.

1. **Resolved (PO): keep Cauda and Forum of Appius.** Both title changes from the WEB wording stand, on ADR-0026's version-majority rule; the Fact-Checker re-checked the six-version comparison independently and dropped "The" from "Forum of Appius" (§7, §9 item 8).
2. **Resolved (PO): Acts 18:22 is not a stop.** The text does not name Jerusalem, so `data/routes/routes.json`'s `paul-2` route records that stage directly as Caesarea to Antioch (Syria), with `travelMode: "unknown"`; the route's own `note` says neutrally that Paul "went up and greeted the assembly," which the International Standard Bible Encyclopedia reads as "probably" Jerusalem, but the text itself does not name it.
3. **Resolved (PO): Phoenix and Lasea are not stops.** The storm kept the ship from ever reaching Phoenix (Acts 27:12–15), and Lasea is named only as a landmark near Fair Havens (27:8). Neither has a stop entry in `data/routes/stops.json`; both stay researched above (§4.2) for a possible future M6 location record. This makes the confidence-split question moot.
4. **Resolved (PO): Cnidus is recorded at the first-century (Tekir) site.** `stops.json`'s `cnidus` entry has one candidate, at Cape Krio/Tekir, with the Burgaz entry noted in the candidate's own `support` text rather than modeled as a second candidate.
5. **Resolved (PO): Rhodes/Lindos dropped to a note.** A route-stop candidate needs at least two sources (the schema enforces this; brief §2.1), and Lindos has only OpenBible.info's own authority. `stops.json`'s `rhodes` entry has one candidate (the city); Lindos was mentioned in that candidate's own `support` text, not as a second candidate — and was later removed entirely (§9 item 9).
6. **Resolved (PO): Trogyllium is a stop entry; "and Myra" is not.** WEB's Acts 20:15 includes "stayed at Trogyllium," so `stops.json` has a `trogyllium` entry, with its disputed manuscript status in the entry's own `support` text and in `paul-3`'s route `note`. WEB's Acts 21:1 does not add "and Myra," so no stop entry or stage reference was added for it there (Myra itself is still a stop on the voyage to Rome, Acts 27:5).
7. **Resolved (PO): a Wikidata item's own "located in" statement may serve as a sourced "today" name.** Re-checking both items directly (not by proximity search): Seleucia Pieria's own Wikidata item states it is located in Hatay Province, Türkiye (a direct `P131` claim, not a nearest-feature guess), and the Forum of Appius's own Wikidata item's description states it is "in Latina, Italy." Both stop entries' `todayName` now cite this directly stated administrative unit rather than the nearer but merely proximate village this note first proposed. The same direct-statement standard, re-applied to every other new stop while encoding the data, also sharpened two more: Myra's own Wikidata item states it is located in Demre (not found by proximity alone), and Cnidus's own item states it is located in Datça, Muğla Province (replacing this note's weaker "near Yazı Köy" reading from ISBE's "nearest village, 6 miles away"). Three Taverns keeps no `todayName`, since no source states one.
8. **Applied: the Fact-Checker's verification findings.** `docs/verification/M5-paul-journeys.md` (commit `e827807`) verified all 24 stop entries (with sourced corrections, folded into §4.2 above) and returned seven items on the stages: places the text says were reached, not merely passed, now each have their own stage (Mitylene, Samos, Trogyllium, Cos, Rhodes, Lystra, Iconium, Cenchreae — §3 preamble); Macedonia and Achaia are no longer stage endpoints, only regions named on one "path not known" stage (§3.3, §6.3); Cyprus and Lycaonia no longer appear as named regions on stages whose own endpoint already stands within them; the Seleucia and Attalia stages read "not stated" rather than "land" (above); each route's year range now covers the full ten-scholar spread rather than one narrow source (§5); and the notes on Acts 18:22, Phoenix/Lasea, Galatia and Malta/Mljet were reworded for sourcing, neutrality and ADR-0033 (§6). This note has been updated throughout to match; the Fact-Checker re-checks this round in turn.
9. **Applied: a cross-vendor review finding on Rhodes/Lindos.** After the Fact-Checker's round-2 re-check passed everything, a further review found that the Lindos clause (item 5 above) rested only on `openbible:rhodes-1`, a dataset id, which ADR-0017 allows for identification and coordinates but not as a factual clause's only support. No bibliographic source this note opened states a Lindos tradition (§4.2), so the clause has been removed from `paul-3`'s route `note`, the `rhodes` stop's `support` text, and this note's own §4.2 and §6.3, rather than re-sourced.

## 10. Sources

### New bibliography entries needed in phase 2 (`data/bibliography.json`)

All International Standard Bible Encyclopedia (1915) entries below were opened directly at their own page on `internationalstandardbible.com`; none needed the Wayback Machine fallback the project has used for the Jewish Encyclopedia's JavaScript-rendered pages.

- `bib:isbe-seleucia`, `bib:isbe-attalia`, `bib:isbe-samothrace`, `bib:isbe-amphipolis`, `bib:isbe-apollonia`, `bib:isbe-assos`, `bib:isbe-mitylene`, `bib:isbe-chios`, `bib:isbe-samos`, `bib:isbe-trogyllium`, `bib:isbe-cos`, `bib:isbe-patara`, `bib:isbe-myra`, `bib:isbe-lycia`, `bib:isbe-cnidus`, `bib:isbe-fair-havens`, `bib:isbe-lasea`, `bib:isbe-phoenix` (the article titled "Phoenix," which also covers Salmone and Cauda/Clauda in the same discussion — ISBE's own separate "Salmone" entry is a one-line cross-reference to this same article, and its "Phenice" entry a cross-reference to this one and to "Phoenicia"), `bib:isbe-sidon` (ISBE publishes two "Sidon" articles; this cites the second, the city, at `S/sidon-(2).html`), `bib:isbe-syracuse`, `bib:isbe-rhegium`, `bib:isbe-ptolemais`, `bib:isbe-taverns-three` (at `T/taverns-three.html`), `bib:isbe-adria`, `bib:isbe-famine`.
- `bib:isbe-paul-the-apostle-3` — "Paul, the Apostle, 3" (the chronology section), and `bib:isbe-paul-the-apostle-5` — "Paul, the Apostle, 5" (the narrative of the journeys and imprisonment), both at `internationalstandardbible.com/P/`. Note for whoever opens these pages again: the "1st/2nd visit(s) to Jerusalem" and "Meeting in Jerusalem" rows of the chronology table in part 3 are corrupted by what appears to be the site's own autolinking software misreading table years as Bible chapter:verse references (e.g., a cell that should read a plain year instead reads "38:1-28; 34:1-22-Jer 35:1-19"); this note used only the unaffected rows (§5).
- `bib:bibleodyssey-erastus-gallio-paul` — "Erastus, Gallio, and Paul," by C. D. Elledge (Gustavus Adolphus College), Bible Odyssey (Society of Biblical Literature), published 2017-07-27, opened directly at `bibleodyssey.org/articles/erastus-gallio-and-paul/`.
- `bib:smith-dictionary-lindus` — "Lindus," Smith's *Dictionary of Greek and Roman Geography* (1854), opened directly at its Perseus Digital Library page (§4.2, checked while confirming no bibliographic source supports a Lindos landing tradition for Acts 21:1, and found not to mention Paul or Acts at all).

Already-existing entries reused directly (no change needed): `bib:isbe-rhodes` (also checked directly for the Lindos clause, §4.2: its own "Rhodes" article names only the city as where Paul touched, with no mention of Lindos), `bib:isbe-appii-forum`, `bib:josephus-antiquities`, `bib:niv-2011-biblegateway`, `bib:esv-2025-biblegateway`, `bib:nlt-2015-biblegateway`, `bib:kjv-1987-biblegateway`, `bib:nkjv-1982-biblegateway`, `bib:csb-2017-biblegateway`. Also reused after the Fact-Checker's verification: `bib:strabo-geography`, in this note only (the Seleucia and Attalia travel modes, §3.1; the data records both as `unknown` and cites only the passages); and, in the routes' own `note`s, `bib:zondervan-who-were-galatians` (the Galatians debate, all three missionary journeys, §6.1–6.3, also cited by the existing `galatia.json` record), and `bib:hmml-contesting-shipwreck` (the Malta/Mljet debate, already cited by `malta.json`, §6.4).

### Dataset sources (no SOURCES.md changes proposed; their licenses and known issues are already documented there)

- **Pleiades** — bulk CSV dump (`pleiades-places-latest.csv.gz`), CC BY 3.0, accessed via its own sanctioned redistribution path after the live site's anti-bot challenge blocked direct page fetches (§1).
- **OpenBible.info** — `data/ancient.jsonl` and `data/modern.jsonl` from its GitHub data repository, CC BY 4.0, accessed after its site's own `/geo/places/<slug>` URLs returned 404 for direct guesses (§1).
- **Wikidata** — queried through its API (`wbsearchentities`, `Special:EntityData`, `list=geosearch`), CC0.

### WEB verses quoted or cited

Pulled from `data/reference/engwebp_vpl.txt`: Acts 9:1–30; 11:19–30; 12:25; 13:1–52; 14:1–28; 15:1–41; 16:1–40; 17:1–34; 18:1–28; 19:1–41; 20:1–38; 21:1–20; 25:1–27; 26:3,30–32; 27:1–44; 28:1–20; Galatians 1:17 (cited, not quoted, for background only); Romans 15:19 (cited); 2 Corinthians 11:32 (cited, background to Acts 9); 2 Corinthians 2:1, 12:14, 13:1 (cited, background to §6.3's note).

## 12. M5-06 addendum: route text and places named

Per card `docs/tasks/M5-06-route-text.md`, reading ADR-0041 and the 2026-10-14 update to ADR-0038.

**Route text.** Each of the four routes' `note` is replaced with `summary` (two or three sentences), `bibleText` (one paragraph, naming the chapters, not quoting WEB at length) and `notes[]` (every disclaimer the old `note` gave, plus a short line on the range of scholars' dates drawn from each route's existing `yearNote`). A few sentences in `bibleText` cite verses not already in any stage's own `scripture[]` (for example the stoning at Lystra, Acts 14:19; the Macedonian vision, Acts 16:9; Paul's appeal to Caesar, Acts 25:11); each such verse is added to the route's own `sources`, checked directly against `data/reference/engwebp_vpl.txt`. `note` no longer appears anywhere in `data/routes/routes.json`, and `REQUIRE_ROUTE_TEXT` is now `true` by default in `scripts/lib/validator.mjs`.

**Places added to `mentioned`.** Every addition is a place the cited passages name that the party did not reach, matching ADR-0038's own stop rule:
- `paul-2` stage-03 (Lystra–Troas): Bithynia (Acts 16:7), using the existing `bithynia` location record — no new stop entry needed.
- `paul-rome` stage-01 (Caesarea–Sidon): Adramyttium, the first ship's home port (Acts 27:2, added to the stage's own `scripture[]`, not quoted there before). New stop entry `adramyttium`: ISBE's own "Adramyttium" article (new `bib:isbe-adramyttium`) places it at the head of the Gulf of Adramyttium; Pleiades, Wikidata and OpenBible.info agree on the site at Ören, Balıkesir Province, Türkiye, within a few hundred meters of each other.
- `paul-rome` stage-02 (Sidon–Myra): Alexandria, the second ship's home port, first named at Acts 27:6 (added to the stage's own `scripture[]`). New stop entry `alexandria`, citing both this verse and 28:11; ISBE's own "Alexandria" article (new `bib:isbe-alexandria`) confirms Acts names "a ship of Alexandria" only at these two verses. Pleiades, Wikidata and OpenBible.info agree on the site (Alexandria, Egypt) within about 2 km, ordinary for a city this size.
- `paul-rome` stage-03 (Myra–Fair Havens): Lasea (Acts 27:8, already quoted in this stage). New stop entry `lasea`, reusing coordinates and sources `docs/research/M5-paul-journeys.md` §4.2 had already gathered but not yet encoded, cross-checked directly against ISBE's own "Lasea" article.
- `paul-rome` stage-04 (Fair Havens–Malta): Phoenix (Acts 27:12, already quoted) and Syrtis (Acts 27:17, already quoted). New stop entry `phoenix`, with both candidates this note's §4.2 already named (Loutro, Finikas), now given coordinates from Pleiades/Wikidata/OpenBible and confidences re-read directly from ISBE's own "Phoenix" article: `medium` for Loutro, which ISBE calls "seems certain" despite a directional wording difficulty it resolves, citing a Trajan-era inscription found there naming grain ships wintering there; `low` for Finikas, which ISBE judges "not a suitable place for wintering in." New stop entry `syrtis` (new `bib:isbe-syrtis`): OpenBible.info and Wikidata both resolve this to Syrtis Maior (the Gulf of Sidra), agreeing with Pleiades' own point for the same ancient name; ISBE's own article does not itself choose between Syrtis Maior and Minor.
- `paul-rome` stage-05 (Malta–Syracuse): Alexandria again (Acts 28:11, already quoted), reusing the same new stop entry.

**Left out, and why.**
- Acts 18:22's unnamed place Paul "went up" to (`paul-2`, already discussed in §3.2, §6.2, §9 item 2) stays a `notes[]` disclaimer only, not a `mentioned` entry: the text itself never names a place there, only ISBE's hedged "probably" Jerusalem reading, and `mentioned` is for places the passages name by a proper name, which this verse does not do.
- Place names that describe a traveling companion's own origin, not the party's route — Sopater "of Beroea," "the Thessalonians," Gaius "of Derbe" and Tychicus and Trophimus "of Asia" (Acts 20:4); Mnason "of Cyprus" (Acts 21:16) — are not added. Berea, Thessalonica, Derbe and Cyprus are already stops or `via` elsewhere on these same routes, and Asia is the province the route is already traveling within at that point (Acts 16:6's own "Asia" is likewise not added, for the same reason: the party is already heading toward, and later reaches, places within it).
- "Phoenicia," the region the ship at Patara was "crossing over to" (Acts 21:2), is not added: the stage already ends within it, at Tyre, so it is reached, not merely named.
- "The sea of Adria" (WEB's own wording for Acts 27:27: "the Adriatic Sea") is not added: unlike Phoenix and Syrtis, which the ship avoided, this is the sea the ship was already being driven within for two weeks, so it is not a place the party failed to reach.
- Rhodes' possible "Lindos" landing tradition stays removed (§4.2, §9 items 5 and 9); nothing in this task reopens it.
