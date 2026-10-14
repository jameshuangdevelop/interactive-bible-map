# M5-02 verification — Paul's four journeys

Independent verification of the Research Lead's work on branch `data/m5-paul-journeys` (head `d736bff` when I started): the research note `docs/research/M5-paul-journeys.md` (with the PO's answers in its §9), `data/routes/routes.json` (4 routes, 45 stages), `data/routes/stops.json` (24 stop entries) and the new entries in `data/bibliography.json`. I checked them against card `docs/tasks/M5-02-paul-journeys.md`, ADR-0038 (the routes model), ADR-0017, ADR-0026, ADR-0033, the brief §2, `schema/README.md` → "Routes (M5)" and `schema/routes.schema.json`. Reviewed 2026-10-13.

**Result: the 24 stop entries pass after my corrections and are set to `verified`. The routes need Research Lead changes before they pass:** the stage structure (places the text says they reached are recorded as places passed, and two provinces are used as stops), two travel modes, the route years (ADR-0038 item 7), and the notes' sourcing and debated points.

**Round 2 (2026-10-13), after the Research Lead's fixes in `369cc43`: all pass**, with a few small corrections of mine to wording and citations. See §11.

| Item | Pass | Pass after my corrections | Needs change (Research Lead) | Fail |
|---|---|---|---|---|
| Stages (45) | 33 | 1 (`paul-2` stage-12) | 11 | 0 |
| Stop entries (24; all 24 set to `verified`) | 9 | 15 | 0 | 0 |
| Routes: years and `yearNote` (4) | 0 | 0 | 4 (R5) | 0 |
| Routes: `note` (4) | 0 | 0 | 4 (R6, R7) | 0 |
| The PO's rulings in §9 (7) | 5 | 2 (rulings 4 and 7) | 0 (ruling 2's note wording is under the notes) | 0 |
| New bibliography entries (27) | 27 | 0 | 0 | 0 |
| Licenses of new sources (1 new: Bible Odyssey) | 1 (cite-only; recorded) | | | |

"Needs change" means the data contradicts the text, an ADR or the schema, or a clause has no source; none of it is wrong in a way that misplaces a site. "Fail" would mean a cited source contradicts a site or a claim.

**The main findings:**
1. **Places the text says they reached are recorded as places passed (`via`).** The schema defines `via` as "Stops passed or sailed by", and the Routes tab draws those as unnumbered dots "the text says they only passed or sailed by" (visual spec, "Routes tab"). But Acts says they "came to Mitylene", "touched at Samos and stayed at Trogyllium" (20:14–15), "came … to Cos, and the next day to Rhodes" (21:1), "returned to Lystra, Iconium, and Antioch" (14:21), and that Paul "shaved his head in Cenchreae" (18:18). The data also treats "touched at Sidon" (27:3) as a stop but "touched at Samos" as a place passed. These 8 places need their own stages (R1).
2. **Two provinces are used as stops.** `paul-3` runs Ephesus → Macedonia → Achaia → Philippi, with Macedonia also in `via`. ADR-0038 item 1 says stops are towns or ports, and that where the text names only regions between two stops, "the stage names the regions, and its line is drawn as 'path not known'". Acts 20:1–6 names no town between Ephesus and Philippi, so this is one stage with `namedRegions`. As encoded, the lines would end at the provinces' label points, one of them 38 km west of Corinth (R2).
3. **Route years don't cover the scholars' range.** ADR-0038 item 7: "Where scholars' dates differ, the route gives a range that covers them." Every route uses the International Standard Bible Encyclopedia's own narrow dates (for example 47–48), while the ten-scholar table the same work reports, which each `yearNote` cites, runs from before 45 to 51 for the first journey (R5).
4. **Notes.** Unsourced or overstated clauses ("very likely Jerusalem, on Luke's standard idiom", "the firmest anchor in the whole chronology", "commonly dated about AD 45–46", "many interpreters"), team wording ("the card's choice", a `docs/` path, `bib:` ids), a database named in the text (ADR-0033), and the debated points the card names (which "Galatia" Acts 16:6 and 18:23 mean; Malta or Mljet) are touched without giving each view, or not at all (R6, R7).
5. **Coordinates:** all 24 sites agree with Pleiades (0.0–2.6 km) and with DARE (0.0–6.2 km, 23 of 24; Fair Havens has no DARE record but a GeoNames-derived Pleiades point 1.1 km away). Every stored value is OpenBible.info's point, which OpenBible took from Wikidata (or, for Mitylene and Apollonia, from Pleiades, and for Sidon from the excavation's website), never from OpenStreetMap. But 10 `coordinateSource` values named a dataset whose value differs (the M2 rule R1: it must name the dataset the value came from). I corrected them.
6. **Corrections I made** (ADR-0014): 10 `coordinateSource` ids, one wrong Wikidata item (Apollonia's cited item was the modern village of Nea Apollonia), two `todayName` values (Apollonia, Trogyllium), the stop name "The Forum of Appius" → "Forum of Appius" (the majority's form; the PO may revert, see §3), support wording in 12 entries, Acts 18:22 on `paul-2` stage-12, and missing citations on all four routes. Details in §7.
7. **Licensing:** the only new source with a license question is Bible Odyssey (Society of Biblical Literature). Its Terms of Use put its articles under CC BY-NC-ND 3.0, so it is cite-only, like World History Encyclopedia. No data field quotes it. I added it to `docs/LICENSES.md` and `ATTRIBUTION.md`.

## Scope
- The research note, especially §2–§7 and §9 (the PO's seven answers).
- `data/routes/routes.json`: routes `paul-1`, `paul-2`, `paul-3`, `paul-rome`, with 12, 13, 12 and 8 stages.
- `data/routes/stops.json`: 24 stop entries. Phoenix and Lasea have none (PO ruling 3).
- 27 new entries in `data/bibliography.json` (this session's brief says 26; the branch adds 26 ISBE articles and one Bible Odyssey article). `isbe-adria` and `isbe-famine` are cited only by the research note.
- Records used as stops are already verified; I checked only how the routes use them (candidate indexes, regions).

## Method
1. **Text.** I read every stage's passages in `data/reference/engwebp_vpl.txt` (WEB, `engwebp`) and compared the stops, their order, the places passed, the regions and the travel mode with what the verses say. A script compared all 95 `textWEB` strings (stages and stops) with the WEB file: all match exactly.
2. **Sites.** Pleiades' bulk places and locations dumps (`atlantides.org`, downloaded 2026-10-13), OpenBible.info's `ancient.jsonl` and `modern.jsonl` (GitHub `openbibleinfo/Bible-Geocoding-Data`), each cited Wikidata item (`Special:EntityData`, plus the items behind OpenBible's points), and DARE's API looked up by Pleiades id. I computed great-circle distances and traced where each stored value came from, including each Pleiades location's provenance (OpenStreetMap or not).
3. **Sources.** I opened all 32 ISBE pages involved (the 26 new ones, the reused "Rhodes" and "Appii Forum", and "Lasea", "Salmone", "Cauda" and "Clauda"), plus "Paul, the Apostle, 6", whose end carries the article's byline (A. T. Robertson); the Bible Odyssey article and its Terms of Use; Strabo 14.4 and 16.2 on LacusCurtius (for R4); and Bible Gateway's NIV, ESV, NLT, KJV, NKJV and CSB pages for every verse that names a stop, recording names only, never verse text.
4. **Neutrality and wording.** Brief §2.6 and ADR-0033 for every `note`, `yearNote` and candidate `support`.

## 1. Stages against the WEB text
"Pass" means the stops, their order, the places passed, the regions and the mode all follow the verses. R1–R4 are explained after the tables and listed in §8.

### `paul-1` (Acts 13:1–14:28)
| # | Stage | Passages | Mode | Result |
|---|---|---|---|---|
| 01 | Antioch (Syria) → Seleucia | 13:4 | land | **Needs change (R4).** "They went down to Seleucia. From there they sailed to Cyprus" gives no mode for the first leg. The cited ISBE "Seleucia" says only that it is "the seaport of Antioch from which it is 16 miles distant"; it mentions no road. |
| 02 | Seleucia → Salamis | 13:4–5 | sea | **Needs change (R3).** Sea is right ("sailed to Cyprus"). Cyprus in `namedRegions` is the island the stop stands on, not a region between stops. |
| 03 | Salamis → Paphos | 13:6 | land | Pass ("gone through the island to Paphos"). |
| 04 | Paphos → Perga | 13:13 | sea | Pass ("set sail from Paphos and came to Perga"). |
| 05 | Perga → Antioch (Pisidia) | 13:14 | land | Pass (inland). |
| 06 | Antioch (Pisidia) → Iconium | 13:51 | land | Pass. |
| 07 | Iconium → Lystra | 14:6 | land | **Needs change (R3).** Lycaonia is the region of the towns the verse names ("the cities of Lycaonia, Lystra, Derbe"), not a region between stops. The stops and mode pass. |
| 08 | Lystra → Derbe | 14:6, 14:20 | land | Pass ("went out with Barnabas to Derbe"). Derbe's record rates Kerti Höyük high and Devri Şehri low, so `candidateIndex: 0` meets ADR-0038 item 4, and I agree. |
| 09 | Derbe → Antioch (Pisidia), via Lystra, Iconium | 14:21 | land | **Needs change (R1).** "They returned to Lystra, Iconium, and Antioch, strengthening the souls of the disciples … When they had appointed elders for them in every assembly" (14:21–23): reached, not passed. |
| 10 | Antioch (Pisidia) → Perga | 14:24–25 | land | Pass. "They passed through Pisidia and came to Pamphylia" names only regions between the stops, so `namedRegions` is right here. |
| 11 | Perga → Attalia | 14:25 | land | **Needs change (R4).** "They went down to Attalia" gives no mode. |
| 12 | Attalia → Antioch (Syria) | 14:26 | sea | Pass ("From there they sailed to Antioch"). Seleucia isn't named again, and the data rightly doesn't add it. |

### `paul-2` (Acts 15:36–18:22)
| # | Stage | Passages | Mode | Result |
|---|---|---|---|---|
| 01 | Antioch (Syria) → Derbe | 15:41, 16:1 | land | Pass. "He went through Syria and Cilicia": regions only, then "He came to Derbe and Lystra". |
| 02 | Derbe → Lystra | 16:1 | land | Pass (the verse's order). |
| 03 | Lystra → Troas | 16:6–8 | land | Pass. Phrygia, Galatia and Mysia are the regions between; Bithynia ("the Spirit didn't allow them") and Asia (where they were "forbidden … to speak") are rightly left out. This is ADR-0038 item 1's own example. |
| 04 | Troas → Samothrace | 16:11 | sea | Pass. |
| 05 | Samothrace → Neapolis | 16:11 | sea | Pass. |
| 06 | Neapolis → Philippi | 16:12 | land | Pass (inland). |
| 07 | Philippi → Thessalonica, via Amphipolis, Apollonia | 17:1 | land | Pass ("passed through Amphipolis and Apollonia"). |
| 08 | Thessalonica → Berea | 17:10 | land | Pass. |
| 09 | Berea → Athens | 17:14–15 | unknown | Pass: no port or ship is named. |
| 10 | Athens → Corinth | 18:1 | unknown | Pass. |
| 11 | Corinth → Ephesus, via Cenchreae | 18:18–19 | sea | **Needs change (R1).** "He shaved his head in Cenchreae": Paul was there. |
| 12 | Ephesus → Caesarea | 18:21 | sea | **Pass after my correction.** Caesarea is named only in 18:22 ("When he had landed at Caesarea"), so I added Acts 18:22 to the stage's passages and sources. |
| 13 | Caesarea → Antioch (Syria) | 18:22 | unknown | Pass. This follows PO ruling 2: the verse doesn't name where Paul "went up", so there is no stop, and the mode is unknown. The note's wording is under R6. |

### `paul-3` (Acts 18:23–21:17)
| # | Stage | Passages | Mode | Result |
|---|---|---|---|---|
| 01 | Antioch (Syria) → Ephesus | 18:23, 19:1 | land | Pass ("the region of Galatia and Phrygia … having passed through the upper country"). |
| 02 | Ephesus → Macedonia | 20:1 | unknown | **Needs change (R2).** |
| 03 | Macedonia → Achaia | 20:2 | land | **Needs change (R2).** The verse also gives no mode for entering Greece. |
| 04 | Achaia → Philippi, via Macedonia | 20:3–6 | land | **Needs change (R2).** Land fits 20:3 ("as he was about to set sail for Syria, he determined to return through Macedonia"; ISBE: "to go by land via Macedonia"), but Macedonia is a province, not a place passed. |
| 05 | Philippi → Troas | 20:6 | sea | Pass. |
| 06 | Troas → Assos | 20:13 | land | Pass: Paul went "by land" while the others sailed, the card's own example. |
| 07 | Assos → Miletus, via Mitylene, Chios, Samos, Trogyllium | 20:14–15 | sea | **Needs change (R1).** Only Chios is passed ("opposite Chios"). The cited sources agree: ISBE's "Mitylene" says Paul "spent the night" there, and its "Samos" says "Paul touched here". |
| 08 | Miletus → Patara, via Cos, Rhodes | 21:1 | sea | **Needs change (R1).** "We came with a straight course to Cos, and the next day to Rhodes, and from there to Patara." |
| 09 | Patara → Tyre, via Cyprus | 21:2–3 | sea | Pass ("in sight of Cyprus, leaving it on the left hand"). |
| 10 | Tyre → Ptolemais | 21:7 | sea | Pass. |
| 11 | Ptolemais → Caesarea | 21:8 | unknown | Pass. |
| 12 | Caesarea → Jerusalem | 21:15–17 | land | Pass (inland). |

### `paul-rome` (Acts 27:1–28:16)
| # | Stage | Passages | Mode | Result |
|---|---|---|---|---|
| 01 | Caesarea → Sidon | 27:1, 27:3 | sea | Pass. Acts 27 doesn't name the port; the stage cites Acts 25:4 ("Paul should be kept in custody at Caesarea"), and the hearing before Agrippa at Caesarea (25:13–26:32) follows. |
| 02 | Sidon → Myra, via Cyprus | 27:4–5 | sea | Pass. Cilicia and Pamphylia ("the sea which is off Cilicia and Pamphylia") are the only other names between Cyprus and Myra. |
| 03 | Myra → Fair Havens, via Cnidus, Crete, Salmone | 27:7–8 | sea | Pass, in the text's order, as the schema asks. In sailing order the ship rounded Salmone before running along Crete (ISBE "Phoenix"), which M5-04 should keep in mind when drawing. |
| 04 | Fair Havens → Malta, via Cauda | 27:9–28:1 | sea | Pass. Malta's record rates Malta high and Mljet low, so `candidateIndex: 0` meets ADR-0038 item 4, and I agree. Phoenix (never reached, 27:12–15) and Syrtis (feared, 27:17) are rightly not stops. |
| 05 | Malta → Syracuse | 28:11–12 | sea | Pass. |
| 06 | Syracuse → Rhegium | 28:13 | sea | Pass. |
| 07 | Rhegium → Puteoli | 28:13–14 | sea | Pass. |
| 08 | Puteoli → Rome, via Forum of Appius, Three Taverns | 28:14–16 | land | Pass. Both are stations on the Appian Way, at the 43rd and 33rd milestones (ISBE "Appii Forum", "Taverns, Three"), so the order is right for a party coming from the south, and the road implies travel by land. |

### What R1–R4 are
- **R1, places reached recorded as passed.** The schema defines `via` as "Stops passed or sailed by in the text's order", and the visual spec draws them as unnumbered dots for places "the text says they only passed or sailed by", while "a stop reached more than once shows each number". Mitylene ("came to"), Samos ("touched at"), Trogyllium ("stayed at"), Cos and Rhodes ("came … to"), Lystra and Iconium ("returned to", then appointing elders) and Cenchreae (Paul "shaved his head" there) were reached. The data is also inconsistent: Sidon, where the ship likewise "touched" (27:3), is a stage end. The research note's own §3.3 table gives Mitylene, Samos, Cos and Rhodes rows of their own; the data merged them.
- **R2, provinces used as stops.** ADR-0038 item 1 defines stops as towns or ports and says that where the text names only regions between two stops "the stage names the regions, and its line is drawn as 'path not known' …, never through towns the text doesn't name." Acts 20:1–6 names no town between Ephesus and Philippi. As encoded, the lines would end at the `macedonia` record's label point (inland, 29 km from Berea) and the `achaia` record's (38 km west of Corinth), and the stop list would number them as places.
- **R3, regions that hold the stage's own stop.** `namedRegions` is "Regions named by the text where no town is named" (schema) and marks a stage whose path isn't known (ADR-0038 item 1; M5-01's fixture pairs it with `travelMode: "unknown"`). Cyprus (13:4) and Lycaonia (14:6) contain the stops the same verses name, so these two stages would be listed and drawn as "path not known". The passages still name the regions.
- **R4, a mode the text doesn't state.** The card allows a mode "only where the text says or clearly implies it", and the Research Lead applied that to "departed and came to" (Athens → Corinth, Ptolemais → Caesarea). "Went down to" doesn't state a mode either. Both inland cities had a river route to the sea: Strabo says "Inland voyages from the sea to Antiocheia are made on the same day one starts" (16.2.7) and that "sailing sixty stadia up this river [the Cestrus], one comes to Pergê" (14.4.2; Loeb translation on LacusCurtius, public domain, already `bib:strabo-geography`). So land isn't clearly implied. Use `unknown`, or cite a source that says they went by road.

## 2. Stop entries
### Sites
Every stored value is OpenBible.info's point for the place. The third column shows where OpenBible took it from (its `modern.jsonl` `coordinates_source`); none is OpenStreetMap-typed, and OpenBible's OSM-derived geometry is not used, as `docs/LICENSES.md` requires. Distances are great-circle distances from the stored value, after my corrections. "OSM-derived point" marks a Pleiades place whose only location comes from OpenStreetMap; for those five the cross-check is DARE.

| Stop | Stored `[lon, lat]` and `coordinateSource` | Where OpenBible's value comes from | Pleiades | DARE | Cited Wikidata item's own point |
|---|---|---|---|---|---|
| `seleucia` | [35.922, 36.124], `wikidata:Q1605894` | Wikidata Q1605894 | 0.67 km (658483) | 1.64 km (`dare:21501`) | 0.00 km (Q1605894) |
| `attalia` | [30.703614, 36.881272], `openbible:attalia` | Wikidata Q218118 (Hıdırlık Tower) | 1.06 km (638778) | 0.33 km (`dare:21502`) | 3.07 km (Q6487) |
| `samothrace` | [25.583333, 40.45], `openbible:samothrace` | Wikidata Q203175 (an earlier value) | 0.65 km (501597, OSM-derived point) | 0.35 km (`dare:41113`) | 0.35 km (Q203175) |
| `amphipolis` | [23.847209, 40.820159], `openbible:amphipolis` | Wikidata Q38281027 (archaeological site) | 0.79 km (501347) | 0.59 km (`dare:21889`) | 0.40 km (Q217414) |
| `apollonia-macedonia` | [23.469685, 40.623703], `openbible:apollonia` | Pleiades 491526 | 0.00 km (491526) | 0.00 km (`dare:21883`) | 0.24 km (Q2751389) |
| `assos` | [26.336667, 39.490556], `wikidata:Q744631` | Wikidata Q744631 | 0.05 km (550463) | 0.03 km (`dare:21199`) | 0.00 km (Q744631) |
| `mitylene` | [26.547048, 39.110475], `openbible:mitylene` | Pleiades 550763 | 0.00 km (550763) | 0.00 km (`dare:17075`) | 0.86 km (Q189059) |
| `chios` | [26.1375, 38.3725], `openbible:chios` | Wikidata Q748832 (Chios town) | 0.40 km (550496, OSM-derived point) | 0.52 km (`dare:22860`) | 10.97 km (Q160483, the island's center) |
| `samos` | [26.8333, 37.75], `wikidata:Q156882` | Wikidata Q156882 | 2.02 km (599926) | 2.30 km (`dare:41142`) | 0.00 km (Q156882) |
| `trogyllium` | [27.003279, 37.659431], `openbible:trogyllium` | Wikidata Q2937072 | 0.36 km (599991) | 0.36 km (`dare:41141`) | 0.00 km (Q2937072) |
| `cos` | [27.110278, 36.815278], `wikidata:Q187027` | Wikidata Q187027 | 2.56 km (599581) | 6.20 km (`dare:41156`, island label) | 0.00 km (Q187027) |
| `rhodes` | [28.2109, 36.4402], `openbible:rhodes-1` | Wikidata Q3557443 (Acropolis of Rhodes) | 1.53 km (590030) | 1.53 km (`dare:22218`) | 0.92 km (Q188731) |
| `patara` | [29.314167, 36.260278], `wikidata:Q233121` | Wikidata Q233121 | 0.17 km (639042) | 0.01 km (`dare:21460`) | 0.00 km (Q233121) |
| `myra` | [29.985278, 36.259167], `wikidata:Q652024` | Wikidata Q652024 | 0.07 km (639005) | 0.09 km (`dare:21455`) | 0.00 km (Q652024) |
| `cnidus` | [27.375, 36.6858], `wikidata:Q690575` | Wikidata Q690575 | 0.33 km (599575) | 0.10 km (`dare:21190`) | 0.00 km (Q690575) |
| `salmone` | [26.3116, 35.316], `openbible:salmone` | Wikidata Q2937111 | 0.02 km (590037, OSM-derived point) | 0.12 km (`dare:41465`) | 1.25 km (Q2937111's first value) |
| `fair-havens` | [24.800306, 34.929694], `wikidata:Q11818846` | Wikidata Q11818846 | 1.12 km (589834, from GeoNames) | none | 0.00 km (Q11818846) |
| `cauda` | [24.083333, 34.833333], `openbible:cauda` | Wikidata Q213895 | 1.11 km (589858, OSM-derived point) | 0.98 km (`dare:41496`) | 0.00 km (Q213895) |
| `sidon` | [35.371944, 33.560985], `openbible:sidon` | sidonexcavation.com (the Sandikli excavation site) | 0.13 km (678393) | 0.11 km (`dare:21115`) | 0.36 km (Q163490) |
| `syracuse` | [15.293056, 37.063889], `openbible:syracuse` | Wikidata Q619477 (Temple of Apollo, Ortygia) | 1.10 km (462503) | 0.48 km (`dare:16570`) | 0.77 km (Q13670) |
| `rhegium` | [15.64412, 38.1088], `openbible:rhegium` | Wikidata Q3902240 (Piazza Italia) | 0.06 km (452416) | 0.42 km (`dare:16556`) | 0.81 km (Q8471) |
| `three-taverns` | [12.873889, 41.561944], `wikidata:Q622536` | Wikidata Q622536 | 0.04 km (423106, OSM-derived point) | 0.39 km (`dare:22181`) | 0.00 km (Q622536) |
| `forum-of-appius` | [12.9975, 41.46639], `wikidata:Q3748871` | Wikidata Q3748871 | 0.00 km (422927) | 0.36 km (`dare:22182`) | 0.00 km (Q3748871) |
| `ptolemais` | [35.0692, 32.9214], `openbible:ptolemais` | Wikidata Q11836530 (in Old Acre) | 0.99 km (678010) | 0.09 km (`dare:21662`) | 1.47 km (Q126084) |

No coordinate is swapped, and every site agrees with at least two independent non-OSM sources within 2.6 km (6.2 km for the island of Cos against DARE's island label). Every entry is `high`; none of these sites is disputed in the sources I opened, and Cnidus follows PO ruling 4 (§4).

**`coordinateSource` (M2 rule R1: it must name the dataset the value came from).** Ten entries named a dataset whose value differs from the stored one: `seleucia` and `cnidus` named Pleiades, but the values are their cited Wikidata items' own; `attalia`, `samothrace`, `chios`, `rhodes`, `sidon`, `syracuse`, `rhegium` and `ptolemais` named a Wikidata item 0.35–11 km away, but the values are OpenBible's, which it took from other items (third column). I corrected all ten; the values are unchanged.

### Names, identification, today's names and wording
| Stop | Result |
|---|---|
| `seleucia` | **Pass after corrections.** `coordinateSource` (above). ISBE says "16 miles", not "16 Roman miles", and puts Seleucia "5 miles North of the mouth of the Orontes"; the support now says so. Today: Wikidata's own "located in" is Hatay Province (PO ruling 7). |
| `attalia` | **Pass after correction** (`coordinateSource`). ISBE: founded by Attalus II Philadelphus, "its modern name is Adalia", and the port "continued … until modern times". |
| `samothrace` | **Pass after corrections.** `coordinateSource`. "Where ancient sources record a town at its northern end" isn't what the source says: ISBE itself says "At the northern end of Samothrace was a town where the ship could anchor for the night", so the support now says that. Today: Samothraki (Wikidata's alias, OpenBible's modern name). |
| `amphipolis` | **Pass after correction.** "Near the modern village of Amphipolis" was stated by no cited source (ISBE names the village of Neochori); the support now says Wikidata places the site in today's municipality of Amphipolis, which is also what `todayName` rests on. |
| `apollonia-macedonia` | **Pass after corrections.** The cited Wikidata item Q1611799 is "Nea Apollonia, village in Thessaloniki", the modern village, with no Pleiades link. The ancient town is Q2751389 ("town of Mygdonia in Macedon, south of Lake Bolbe", Pleiades 491526), whose own "located in" is Nea Apollonia, and Pleiades says "Located near the modern municipality of Nea Apollonia". So I replaced the item and set today's name to "Near Nea Apollonia, Greece"; it was "Near Pollina", from ISBE (1915), which says only that "the name seems to have survived in the modern Pollina" (kept in the support, with ISBE's "seems"). "About a day's journey from each" is now ISBE's "about 30 Roman miles from" Amphipolis "and 38 from" Thessalonica. |
| `assos` | **Pass.** ISBE: "An ancient city of Mysia in the Roman province of Asia … on the southern coast of the Troad", and "at present the town … is called Bekhram". Today: Behramkale, an alias on the Wikidata item. |
| `mitylene` | **Pass.** ISBE: "the most important city … of the island of Lesbos. It had 2 harbors." Today: Mytilene (Wikidata). |
| `chios` | **Pass after corrections.** `coordinateSource`. The entry is the island ("opposite Chios"), but it cited only Pleiades' Chios town (550496); I added the island, 550497, and a sentence saying the point is the island's principal town. 5 of 6 versions spell it Chios (NLT "Kios"). |
| `samos` | **Pass.** ISBE: between Ephesus and Miletus, joined to the province of Asia in 84 BC. |
| `trogyllium` | **Pass after corrections.** Today's name was "Cape Mycale", which is Wikidata's label for an "ancient cape of Turkey" (OpenBible copies it); Pleiades says "The modern Dip Burun in Turkey: a coastal promontory opposite the Aegean island of Samos extending from the Mykale mountains". Now "Dip Burun, Türkiye". "Where ships could anchor for the night" is now "with an anchorage" (ISBE: "the place of anchorage is called Saint Paul's port"). The textual note matches ISBE ("Several of the early manuscripts omit the words … (Westcott and Hort omit as 'Western' interpolation)"). |
| `cos` | **Pass.** ISBE: "An island off the coast of Caria", "one of the six Dorian colonies". Cos is the plurality spelling: ESV, NLT, NKJV and CSB (NIV "Kos", KJV "Coos"). |
| `rhodes` | **Pass after corrections.** `coordinateSource`. OpenBible's Lindos mention is a comment on the entry ("one tradition has Paul arriving near Lindos instead of the city of Rhodes"); its two scored identifications are the island and the Acropolis of Rhodes, so "a minor, lower-scored reading" was wrong. The support now gives the comment. |
| `patara` | **Pass.** ISBE: the oracle of Apollo, "port of entry to the towns of the interior", and "Gelemish is the modern name of the ruin". |
| `myra` | **Pass.** ISBE: Lycian, "a prominent port for ships from Egypt and Cyprus", Paul's Alexandrian grain ship (Acts 27:6), and "Dembre is the modern name of the ruins". Wikidata's "located in" is Demre. |
| `cnidus` | **Pass after corrections.** `coordinateSource`. The support cited Strabo "quoted in Smith's 1854 Dictionary", but the entry cites no Smith article, and I didn't take it on trust; it called Burgaz "inland", which no source says; and "read here as an earlier phase" was the Research Lead's own reading. Pleiades itself says that "In the later fourth century BCE, [Tekir] … succeed[ed] the site at Burgaz as the political center of the peninsula", so the support now states that from Pleiades. |
| `salmone` | **Pass.** ISBE "Phoenix": "Salmone, now called Cape Sidero, was the promontory which forms the Northeast corner of the island"; Pleiades: "Modern Cape Sideros at the extreme northeast tip of the island of Crete". |
| `fair-havens` | **Pass.** ISBE "Fair Havens": a roadstead "about 5 miles East of Cape Matala", sheltered "from North and Northwest winds", "not commodious to winter in". |
| `cauda` | **Pass.** ISBE "Phoenix": "The modern name of the island shows that Cauda … and not Clauda is the true ancient form." Name: §3. |
| `sidon` | **Pass after correction** (`coordinateSource`). See note S1 below on its passages. |
| `syracuse` | **Pass after corrections.** `coordinateSource`; "continuously inhabited" isn't stated by ISBE, which gives the history only to 212 BC, so the support now says "known today as Syracuse (Siracusa)" (ISBE: "Ital. Siracusa"). |
| `rhegium` | **Pass after correction** (`coordinateSource`). ISBE: "the modern Reggio di Calabria". |
| `three-taverns` | **Pass after correction.** I removed "no source opened for this note names a modern town there", which is team wording. ISBE: "a station on the Appian Road at the 33rd milestone". No `todayName`: Wikidata gives no "located in". |
| `forum-of-appius` | **Pass after corrections.** Name: §3. "At the edge of the Pontine Marshes" isn't in ISBE, which says the canal "ran by the side of the road from there to within a short distance of Tarracina", through the marshes; the support now says that. Its sentence about six English versions now cites them. Today: Wikidata's "located in" is Latina (PO ruling 7). |
| `ptolemais` | **Pass after corrections.** `coordinateSource`; "continuously inhabited" isn't in ISBE's "Ptolemais", which says only "Same as 'Acco'"; now "known today as Acre (Akko)" (Wikidata). |

Each entry's `scripture` lists the verse that names it in these journeys, and all match the WEB.

- **S1 (for the PO, not blocking).** ADR-0038 item 2 asks for "the passages that name it". Sidon is the only new stop the New Testament also names elsewhere (for example Matthew 15:21, Mark 7:31, Luke 6:17 and Acts 12:20); the entry lists only Acts 27:3. ADR-0038's context names Sidon as a Gospel place too, so if M5-03 uses this shared entry, it should list the Gospel passages.
- **S2 (backlog).** The stop schema describes `name` as being for "display and search in the Routes tab", but an entry has only one name, so the WEB's "Clauda" and "The Market of Appius" won't be found by search until M6 makes these places with alternate names (ADR-0026: "the other reading stays searchable").

## 3. Names (ADR-0026): Cauda and the Forum of Appius
I re-read the six versions on Bible Gateway myself, separating each verse's text from its footnotes and recording names only.

| Verse | NIV | ESV | NLT | KJV | NKJV | CSB | WEB | Majority |
|---|---|---|---|---|---|---|---|---|
| Acts 27:16 | Cauda | Cauda (note: Clauda) | Cauda (note: Clauda) | Clauda | Clauda (note: Cauda) | Cauda (note: Clauda) | Clauda | **Cauda**, 4 of 6 |
| Acts 28:15 | the Forum of Appius | the Forum of Appius | the Forum | Appii forum | Appii Forum | the Forum of Appius | The Market of Appius | **Forum of Appius**, 3 of 6; none reads "Market" |
| Acts 28:15 | Three Taverns | Three Taverns | Three Taverns | three taverns | Three Inns | Three Taverns | The Three Taverns | **Three Taverns**, 5 of 6 |

The Research Lead's counts are right, and so is PO ruling 1. Two points:
1. **"The Forum of Appius" → "Forum of Appius" (corrected).** NIV, ESV and CSB all print a lowercase article ("the Forum of Appius"), so the majority's name has no "The". The capital "The" comes from the WEB's styling ("The Market of Appius", "The Three Taverns"), and the data already drops it for "Three Taverns". Wikidata's alias is also "Forum of Appius". I changed the stop's `name` and `label`. The ruling's basis, the version majority, gives this form; if the PO meant "The" deliberately, revert those two strings.
2. **Cauda is also a manuscript variant.** ISBE "Phoenix" gives Kauda in "Codex Sinaiticus (corrected) and Codex Vaticanus and the Old Latin", and Klauda in "Codex Sinaiticus and Codex Alexandrinus, etc." ADR-0026 says that for a manuscript variant "the title follows the record's identification and the WEB", which here point different ways: the identification (Gavdos; ISBE: "the modern Greek name Gaudho supports the form Cauda") gives Cauda, the WEB gives Clauda. The majority rule and the identification agree on Cauda, so I agree with the ruling. ADR-0026 says "So far only Magdala is affected", and the human confirmed that case; the PO may want to record Cauda as the second.

I also read the other 22 names in all six versions (Acts 13:4, 14:25, 16:11, 17:1, 20:13–15, 21:1, 21:7, 27:3–8 and 28:12–13). Each title is the majority form: Samothrace 5 of 6 (KJV "Samothracia"), Chios 5 (NLT "Kios"), Cos 4 (NIV "Kos", KJV "Coos"), Fair Havens 5 (KJV "The fair havens"), and Trogyllium, printed only by the KJV and NKJV, has no other spelling. The other 16 are spelled alike in all six.

## 4. The PO's rulings (research note §9)
| # | Ruling | Result |
|---|---|---|
| 1 | Keep Cauda and the Forum of Appius | **Pass**, re-checked independently (§3); I dropped the "The". |
| 2 | Acts 18:22 is not a stop | **Pass.** `paul-2` stage-13 runs Caesarea → Antioch with `travelMode: "unknown"`, and no stop is added. I added 18:22 to stage-12, where Caesarea is named. The note's wording on this verse is under R6. |
| 3 | Phoenix and Lasea are not stops | **Pass.** Neither has a stop entry; `paul-rome`'s note explains both from the text (27:8, 27:12–15). Its pointer to `docs/research/` is under R6. |
| 4 | Cnidus at the first-century Tekir site, with Burgaz noted in the support | **Pass after my correction** of the support (§2). Pleiades confirms Tekir as the city from the late fourth century BC. (Wikidata's Knidos item, whose point is at Tekir, links Pleiades 599576, the Burgaz site; this doesn't affect the entry.) |
| 5 | Rhodes/Lindos as a note only | **Pass.** Lindos has only OpenBible's comment, so a candidate couldn't meet the two-source rule, and the ruling is right. I corrected how the stop's support describes it; the route note's wording is under R6. |
| 6 | Trogyllium is a stop entry with its textual note; "and Myra" is not added | **Pass.** WEB Acts 20:15 includes "stayed at Trogyllium"; KJV and NKJV print it and ESV, NLT and CSB footnote it; ISBE "Trogyllium" and "Samos" describe the omission in early manuscripts. WEB 21:1 has no Myra, and of the six only the ESV mentions "and Myra", in a footnote. How Trogyllium sits in its stage is under R1. |
| 7 | A Wikidata item's own "located in" may give today's name | **Pass after my corrections.** Seleucia (Hatay Province), the Forum of Appius (Latina: a P131 statement, not only the item's description), Myra (Demre) and Cnidus (Datça) are each the item's own P131. I changed Apollonia (now from Q2751389's P131 and Pleiades) and Trogyllium (from Pleiades). Three Taverns rightly has none. |

## 5. Years and notes
### Years (R5)
ADR-0038 item 7: "Where scholars' dates differ, the route gives a range that covers them, and its notes give each view." Each route's `fromYear`–`toYear` is the International Standard Bible Encyclopedia's own dating (A. T. Robertson's article). The ten-scholar table in the same article ("Paul, the Apostle, 3"), which each `yearNote` reports, is wider. The rows below match the research note's §5 table, which I checked cell by cell.

| Route | Data | ISBE's own dates | The ten scholars in ISBE's table | Range that covers them |
|---|---|---|---|---|
| `paul-1` | 47–48 | "47 and 48 AD" | from "before 45" (McGiffert) and 45 (Harnack) to 50–51 (Zahn) | about 44 or 45 to 51 |
| `paul-2` | 49–52 | "49-51 (or 52) AD" | from 46 (McGiffert) to 50–53 (Ramsay) | 46–53 |
| `paul-3` | 52–58 | "52 (or 53)-57 (or 58) AD", for its section "Ac 18:23 through Ac 21:14" | from 49 (McGiffert) to 53–59 (Clemen), with the arrest in Jerusalem 53 to 59 | 49–59 |
| `paul-rome` | 59–60 | sails "in the late summer of 59 AD", arrives "in the early spring … of 60 AD" | arrival in Rome from 56 (McGiffert) to 62 (Clemen); the voyage began the autumn before (Acts 27:9, 28:11) | about 55–62 |

The `fromYear` also picks the timeline stop the Routes tab shows (ADR-0038 item 7), so the Research Lead should say which stop each new first year selects. Other `yearNote` problems:
- **`paul-1`:** the low end is McGiffert's "before 45", not 45. "Commonly dated about AD 45-46" is stated by no cited source: ISBE "Paul, the Apostle, 3" puts the famine visit (Acts 11:29–30) at "the end of 44 or beginning of 45", and ISBE "Famine" (`bib:isbe-famine`, not cited by the route) dates the famine that "severely affected Palestine" to 45. ISBE counts back to that visit; it doesn't call it an anchor.
- **`paul-2`:** "usually dated to about AD 52": Bible Odyssey says only "Dating circa 52 C.E." "When Paul had already spent eighteen months in Corinth": ISBE says "apparently", and Bible Odyssey puts it as a condition ("If Paul's original mission lasted 'a year and a six months' … then"). "This is the firmest anchor in the whole chronology": neither source says so; Bible Odyssey calls it "an important benchmark", and ISBE says "Once more we do not get a certain date as to the year". The `bib:` ids written into the text belong in `sources`, and Bible Odyssey needs introducing (ADR-0033), for example "the Society of Biblical Literature's Bible Odyssey". The note could give both sources' results: Paul in Corinth 50–51 (Bible Odyssey) and Gallio's arrival "either … the summer of 51 or 52" (ISBE).
- **`paul-3`:** ISBE's "52 (or 53)-57 (or 58)" belongs to its section on Acts 18:23–21:14, not to "Acts 18:23-21:17". "See the note on this route's final stage": stages have no notes.
- **`paul-rome`:** the facts are right; only the range (above).

### Notes (R6, R7)
All four notes start with the sentence ADR-0038 item 5 requires ("Lines show stage order and land or sea mode, not exact traveled paths"). None takes a side on a debate. But:

**R6, sourcing and wording:**
- **`paul-1`:** "(see the galatia record)" uses the record's id; readers see a place called Galatia.
- **`paul-2`:** Acts 18:22 is "very likely Jerusalem, on Luke's standard idiom for travel to and from that city elsewhere in Acts". No cited source states the idiom, and ISBE says "probably" ("If he went to Jerusalem, it was probably incidental"). Use ISBE's "probably", and drop the idiom or cite a source for it.
- **`paul-3`:** "each already a location record in this project" and "the card's choice" are team wording, and the first goes with R2. "Many interpreters associate it with Corinth": the cited ISBE says Paul faced "a plot on his life in Corinth"; say that ISBE places it there, or cite more. "OpenBible.info also records a minor, lower-confidence reading": OpenBible's comment is "one tradition has Paul arriving near Lindos instead of the city of Rhodes", with no rating, and the text shouldn't name a database (ADR-0033); for example, "One tradition has Paul landing near Lindos instead of the city". "ISBE" isn't introduced in this field. After R1, "Troas to Miletus includes Trogyllium" changes.
- **`paul-rome`:** "both are researched in docs/research/M5-paul-journeys.md section 4.2 for a possible future record" is team wording. "Even though Acts 28:15 names the Three Taverns party second": the verse names the Market of Appius first, the same order as the travel, so "even though" is wrong. "The Forum of Appius" is now "Forum of Appius" (§3).

**R7, the debated points the card names, with each view** (card scope item 5; brief §2.6):
- **"The region of Phrygia and Galatia" (16:6) and "of Galatia and Phrygia" (18:23):** `paul-1` touches the question of which Galatians Paul's letter addresses but gives no view; `paul-2` and `paul-3` don't mention it. Give the "North Galatian" and "South Galatian" views as the `galatia` record does (`bib:zondervan-who-were-galatians`), and, if it is kept, the research note's point about one district or two, which needs a source.
- **Which island Acts 28:1 calls Malta:** `paul-rome` doesn't mention it. Give the traditional identification with Malta and the minority view for Mljet, as the `malta` record does (`bib:hmml-contesting-shipwreck`), and say the line goes to Malta, the candidate with the stronger support.

## 6. Sources and licenses
**The 27 new bibliography entries pass.** Every URL opens (HTTP 200, 2026-10-13). Each ISBE entry's author matches the article's byline: W. M. Christie (Seleucia); E. J. Banks (Attalia, Assos, Trogyllium, Patara, Myra, Cnidus, Lycia); Arthur J. Kinsella (Samothrace, Samos); Marcus N. Tod (Amphipolis, Apollonia); J. E. Harry (Mitylene, Chios, Cos); W. M. Calder (Phoenix); H. Porter ("Sidon (2)"); George H. Allen (Syracuse, Rhegium, "Taverns, Three", Adria); W. L. Walker (Famine); and A. T. Robertson for "Paul, the Apostle", whose byline is at the end of part 6. "Fair Havens" and "Ptolemais" are unsigned, so they use the project's existing convention, "James Orr", the general editor. Bible Odyssey's article is by C. D. Elledge, published 2017-07-27. Two entries, `isbe-adria` and `isbe-famine`, are cited only by the research note; R5 may use the second.

| Source | License, read at the source on 2026-10-13 | Decision |
|---|---|---|
| ISBE (1915), 26 new articles | Public domain (published before 1929); already in `docs/LICENSES.md` | Yes. Quotation allowed. |
| Bible Odyssey (Society of Biblical Literature), new | The Terms of Use say "Most of the content on this site … is licensed under the Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Unported License", listing "All of the articles"; reuse must be "personal, educational, or noncommercial", unaltered, and credited. The article page shows "©2026 Society of Biblical Literature". | **Cite-only**: NonCommercial and NoDerivatives are incompatible with CC BY-SA 4.0. No data field quotes it (checked). Added to `docs/LICENSES.md` and `ATTRIBUTION.md`. The research note quotes three short passages of it; the verbatim rule covers `data/`, so this isn't required, but the Research Lead may paraphrase them when updating the note. |
| NIV, ESV, NLT, KJV, NKJV, CSB on Bible Gateway | Already recorded (M3-10) | Spellings only. The research note and data record names, never verse text. |
| Pleiades (CC BY 3.0), OpenBible.info (CC BY 4.0), Wikidata (CC0) | Already recorded | Yes. Every stored value traces to a non-OSM OpenBible field (§2). |
| DARE (CC BY-SA 3.0) | Already recorded | I used it only to cross-check; nothing from it enters the data. |
| Strabo (Loeb, LacusCurtius) | Public domain ("The text is in the public domain" on each page); already `bib:strabo-geography` | I used it for R4; not cited in the data. |

Nothing in the branch uses a Bible translation other than the WEB for quoted text, an image, or a non-free source in the data.

## 7. Corrections I made (ADR-0014)
Each is sourced in §2–§4 and leaves the site, the stage order and the stops unchanged.

| File | Entry | Change |
|---|---|---|
| `data/routes/stops.json` | `seleucia`, `cnidus` | `coordinateSource` → `wikidata:Q1605894`, `wikidata:Q690575` (the values are those items' own). |
| | `attalia`, `samothrace`, `chios`, `rhodes`, `sidon`, `syracuse`, `rhegium`, `ptolemais` | `coordinateSource` → `openbible:<slug>` (the values are OpenBible's; §2). |
| | `apollonia-macedonia` | `wikidata:Q1611799` (the modern village) → `wikidata:Q2751389` (the ancient town); `todayName` "Near Pollina, Greece" → "Near Nea Apollonia, Greece"; distances as ISBE gives them; ISBE's "seems". |
| | `trogyllium` | `todayName` "Cape Mycale, Türkiye" → "Dip Burun, Türkiye" (Pleiades); "anchor for the night" → "an anchorage" (ISBE). |
| | `chios` | Added `pleiades:550497` (the island); a sentence saying the point is its principal town. |
| | `forum-of-appius` | `name` and `label`: "The Forum of Appius" → "Forum of Appius" (§3); the Pontine Marshes clause follows ISBE; the six versions cited for the support's naming sentence. |
| | `seleucia`, `samothrace`, `amphipolis`, `rhodes`, `cnidus`, `syracuse`, `ptolemais`, `three-taverns` | Support wording that no cited source states, or team wording, replaced with what the cited sources say (§2). |
| | all 24 | `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-13"`. |
| `data/routes/routes.json` | `paul-2` stage-12 | Added Acts 18:22 (where Caesarea is named) to `scripture` (WEB text from the reference file) and `sources`. |
| | `paul-1`, `paul-2` | Added `bib:isbe-paul-the-apostle-3`, the source of the ten-scholar table their `yearNote` reports. |
| | `paul-3` | Added `bib:isbe-paul-the-apostle-3`, `bib:isbe-trogyllium` and the ESV, NLT and CSB entries (the Trogyllium sentence), and `openbible:rhodes-1` (the Lindos sentence). |
| | `paul-rome` | Added `scripture:Acts 25:4` (the start at Caesarea), `bib:isbe-phoenix` (Gavdos and "Cauda"), `bib:isbe-appii-forum` and `bib:isbe-taverns-three` (the milestones), and the six versions (the two naming sentences). |
| `docs/LICENSES.md`, `ATTRIBUTION.md` | Bible Odyssey | Recorded as cite-only (§6). |
| `app/src/features/search/sources-credits-content.ts` | "Sources & credits" | The app's list mirrors `ATTRIBUTION.md`'s source names, and `test:app` checks that they match, so I added Bible Odyssey to the same string. |

## 8. Sent back to the Research Lead
The stop entries are verified. These items concern `data/routes/routes.json` and the research note, and I'll re-check them when they're done.

- **R1 (4 stages).** Give each place the text says they reached its own stage, and keep `via` for places passed or sailed by:
  - `paul-1` stage-09 → Derbe → Lystra → Iconium → Antioch (Pisidia), by land, each citing 14:21 (and 14:22–23 if wanted).
  - `paul-2` stage-11 → Corinth → Cenchreae (Corinth lies inland, so by land, or `unknown`) and Cenchreae → Ephesus by sea (18:18–19).
  - `paul-3` stage-07 → Assos → Mitylene (20:14); Mitylene → Samos via Chios; Samos → Trogyllium; Trogyllium → Miletus (all 20:15, by sea).
  - `paul-3` stage-08 → Miletus → Cos → Rhodes → Patara (21:1, by sea).
- **R2.** Replace `paul-3` stages 02–04 with one stage, Ephesus → Philippi (20:1–6), `travelMode: "unknown"`, with `namedRegions` Macedonia (20:1), Greece (`achaia`, 20:2) and Macedonia (20:3). The text, the regions and the order stay visible in the stage list; the line becomes "path not known".
- **R3.** Remove `namedRegions` from `paul-1` stage-02 (Cyprus) and stage-07 (Lycaonia).
- **R4.** `paul-1` stage-01 and stage-11: `travelMode: "unknown"`, unless a source states the road; and remove `bib:isbe-seleucia` from stage-01's sources if it then supports nothing.
- **R5.** Set each route's `fromYear`–`toYear` to a range that covers the scholars' dates (§5 suggests 44 or 45–51, 46–53, 49–59 and 55–62 from ISBE's table; more recent sources may be added), and rewrite each `yearNote` to give the views and fix the clauses listed in §5.
- **R6.** The note wording and sourcing listed in §5.
- **R7.** The two debated points, with each view and sources, in the notes listed in §5.
- **The research note.** Bring §3, §4.2, §5, §6 and §9 into line with the data and the corrections above: Apollonia's Wikidata item and today's name, Trogyllium's today's name, OpenBible's Lindos comment, "16 miles", the Gallio and 18:22 wording, and the years.

## 9. For the PO
1. **"Forum of Appius" (§3).** I applied the majority's form without "The". Revert the two strings if ruling 1 meant "The".
2. **Cauda in ADR-0026 (§3).** It is a manuscript variant where the identification and the WEB disagree; the ruling (Cauda) agrees with the majority and the identification. Consider recording it beside Magdala.
3. **Sidon's passages (S1)** if M5-03 shares the entry, and **search for the WEB's "Clauda" and "Market of Appius" (S2)** for the backlog.
4. **For M5-04:** Salmone comes before the run along Crete in sailing order, though `via` follows the text's order (`paul-rome` stage-03). And R1 and R2 change which stages M5-04 draws.

## 10. Checks run (2026-10-13, Node 24.21.0)
- `npm run validate:data`: passes, with the same 203 warnings as before this session (none about routes or stops).
- `npm test`: 297 of 297 pass.
- `npm run test:app`: 159 of 159 pass. The first run failed one test because `ATTRIBUTION.md`'s cite-only row had changed and the app's mirrored list hadn't; fixed as in §7.
- My own script: all 95 `textWEB` strings in the routes and stops match `data/reference/engwebp_vpl.txt` exactly.

## 11. Round 2: re-check after the Research Lead's fixes (`369cc43`)
I re-checked everything in `git diff e827807..369cc43`: `data/routes/routes.json` (45 → 51 stages, the years, `yearNote`s, notes and sources), the research note, and one new bibliography entry. `data/routes/stops.json` didn't change, so its 24 entries stay `verified`. Routes and stages have no status field in the schema, so their result is recorded here. The PO kept "Forum of Appius" without "The".

| Item | Result |
|---|---|
| R1, places reached | **Pass.** `paul-1` stages 09–11 run Derbe → Lystra → Iconium → Antioch (Pisidia) by land (14:21). `paul-2` stages 11–12 run Corinth → Cenchreae by land (Corinth lies inland; the sailing starts from the port) and Cenchreae → Ephesus by sea (18:18–19). `paul-3` stages 05–11 run Assos → Mitylene → Samos (via Chios) → Trogyllium → Miletus → Cos → Rhodes → Patara, all by sea (20:14–15, 21:1). `via` now holds only places passed or sailed by: Amphipolis and Apollonia, Chios, Cyprus (twice), Cnidus, Crete, Salmone, Cauda, and the Forum of Appius and Three Taverns. |
| R2, provinces | **Pass.** `paul-3` stage-02 is Ephesus → Philippi (20:1–6), `unknown`, naming Macedonia (20:1), Greece (`achaia`, 20:2) and Macedonia (20:3). |
| R3, regions | **Pass.** Cyprus and Lycaonia are gone from `paul-1` stages 02 and 07. |
| R4, modes | **Pass.** `paul-1` stage-01 (Antioch → Seleucia) and stage-13 (Perga → Attalia) are `unknown`, and stage-01 no longer cites ISBE "Seleucia". |
| R5, years | **Pass after my corrections.** The ranges 44–51, 46–53, 49–59 and 55–62 cover ISBE's ten-scholar table, and the quotations match ISBE and Bible Odyssey. I corrected four things. `paul-1` opened with "About AD 47-48", ISBE's dates, although its span is 44–51. `paul-2` attributed 46–53 to ISBE's "stated span of '49-51 (or 52)'", and said "Acts 18:11 says Paul had by then spent eighteen months", but the verse has no "by then" (ISBE's word is "apparently"). `paul-3` pointed readers to "the research note". `paul-rome` said the voyage began "the autumn before" each arrival, citing 27:9, but ISBE says "late summer" and 27:9 names "the Fast", not a season; it now says the year before each arrival, "since the party wintered on Malta on the way (Acts 28:11)" (ISBE: arrives "in the early spring ('had wintered,' Ac 28:11)"). I also removed an "instead": Bible Odyssey's 50–51 is Paul's stay and ISBE's 51 or 52 is Gallio's arrival, so they don't conflict. |
| R6, wording and sourcing | **Pass after my correction.** Acts 18:22 now rests on ISBE's "probably", with no idiom claim; the team wording and the `docs/` pointer are gone; Corinth is attributed to ISBE; the Lindos tradition is given without naming a database; ISBE is introduced; and the Forum of Appius sentence now says the order matches Acts 28:15. I replaced `paul-3`'s closing "where Acts' own narrative turns to Paul's arrest" (the arrest is Acts 21:27–36) with "where the encyclopedia's next section, 'Five Years a Prisoner,' begins", ISBE's own heading for Acts 21:17–28:31. |
| R7, debated points | **Pass after my correction.** All three missionary journeys give both Galatia views, paraphrasing Thomas Schreiner's Zondervan article (`bib:zondervan-who-were-galatians`, opened): the north view sends the letter to "ethnic Galatians located in the northern part of the Galatian province", the south view to "the cities Paul visited on his first missionary journey in Acts 13–14". Schreiner favors the south; the notes take no side. `paul-rome` gives Malta and Mljet, as HMML's story says (`bib:hmml-contesting-shipwreck`, opened: Ignjat Đurđević's "Melite Illyrica (modern Mljet, in the Adriatic off the coast of Croatia)"). But it said "Acts 28:1 does not say which island 'Melita' is", while the WEB's 28:1 reads "the island was called Malta"; it now says "The island Acts 28:1 names (the WEB's 'Malta', the KJV's 'Melita') is traditionally identified with Malta". |
| Citations | I added `scripture:Galatians 1:2` to `paul-1` (its note quotes "the assemblies of Galatia", which matches the WEB) and `scripture:Acts 24:27`, `28:1` and `28:11` to `paul-rome` (its texts cite them). |
| Unchanged stages | **Pass.** Every stage starts where the one before it ends, the ids run without gaps, and all 103 `textWEB` strings (79 in stages, 24 in stops) match the WEB. |
| Research note | **Pass after my corrections.** Its §3 tables match the 51 stages row for row. §9 item 2 said the route note cites "many interpreters", which it doesn't; §10 said the routes cite Strabo, which only the note does; and §5 repeated "autumn". I corrected all three. |
| `isbe-lasea` (new) | **Pass after correction.** The URL opens; the article is unsigned, so "James Orr" follows the convention. It is cited only by the research note. Its `accessed` date was 2026-10-14, a day ahead; I set it to 2026-10-13, when I opened it. |

For the PO: the Research Lead's `docs/BUDGET.md` row is also dated 2026-10-14. I didn't edit another agent's row.

Checks after round 2 (Node 24.21.0): `validate:data` passes with the same 203 warnings; `npm test`: 297 of 297 pass; `npm run test:app`: 159 of 159 pass.
