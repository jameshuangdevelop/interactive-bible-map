# M6-04 verification: Holy Land places, batch 1A (21 records)

- **Card:** `docs/tasks/M6-04-holy-land-places.md` · **Branch:** `data/m6-04-holy-land-places`, checked at `79a598d` (diff against `ecdb824`: records `bd05371`, `15c046a`, `953bc9f`; images `79a598d`)
- **Checked:** the 21 new `data/locations/*.json` records and their 21 `data/media/*.json` files (37 images); the 22 new `bib:isbe-*` entries; the regenerated `openbible-ids` files; the new `"Gaza Strip"` value in `schema/location.schema.json`. Against ADR-0017, ADR-0026, ADR-0028, ADR-0033, ADR-0041 item 1, `schema/README.md` and `docs/LICENSES.md`.
- **Verifier:** fact-checker (Claude, Copilot CLI) · **Date:** 2026-11-06

**Re-check on 2026-11-06 (section 9), at `fbd1cd2`:**
- **Scope is now 20 records.** `sheep-gate` was removed (PO decision Q2).
- **5 records are signed off:** `azotus`, `lydda`, `antipatris`, `tiberias`, `jacobs-well`.
- **15 stay draft.** Each has one to five small remaining fixes (section 9.3).
- The PO accepted `"Gaza Strip"` (Q1) and the title "Aenon" (Q3).

**First-round result: no record passed. All 21 stayed `status: "draft"`.** 21 findings (F1–F21, one per record) and 4 cross-cutting notes (X1–X4).
- **Major (8 records):** a coordinate that isn't of the candidate (`sheep-gate`, `gennesaret`, `aenon`, `arimathea`); a coordinate with no second source (`wilderness-of-judea`); a misreported source on a theological point (`valley-of-hinnom`); a missing WEB passage and misquotations (`praetorium`); an uncited identification the card asked for (`antonia-fortress`).
- **Minor (13 records):** wording, missing citations or a WEB quotation that differs from the WEB.

No coordinate was guessed. Licensing passes (there are no new upstream sources). The `"Gaza Strip"` value passes, with a question for the PO (Q1). The commands pass.

## 1. Method and sources opened (all read 2026-11-06)

| Source | How it was read | License (read at the source) |
|---|---|---|
| ISBE (1915): the 22 new articles plus "Decapolis", "Sheep Market", "Castle" | Each `internationalstandardbible.com` URL fetched and read in full; authors checked against the signatures | Public domain (pre-1929; `docs/LICENSES.md` "Public-domain texts" row, `ATTRIBUTION.md`) |
| Wikidata | `Special:EntityData/<Q>.json` for the 19 cited items, plus Q6669901, Q5977371, Q3320224, Q835203, Q739415, Q7183947, Q207540, Q3966846, Q1757438, Q2915281, Q7558533, Q4877716, Q47492; P625 values, qualifiers and references | CC0 |
| Pleiades | `places/<id>/json` for the 8 cited places, plus 678368, 687932, 687905, 49841553, 678155, 688014, 678147 (each location's provenance) | CC BY 3.0 |
| DARE | `imperium.ahlfeldt.se/api/geojson.php?id=<id>` for the 9 cited ids, plus 37139 | CC BY-SA 3.0 |
| OpenBible.info | The 8 cited GeoJSON files and pages; `ancient.jsonl` and `modern.jsonl` from the Bible-Geocoding-Data repository (identification scores and each modern point's `coordinates_source`) | CC BY 4.0 |
| Josephus (Whiston), CCEL | `war-2`, `war-3`, `war-5`, `ant-14`, `ant-15`, `ant-17` | Public domain |
| Piccirillo, "Ainon Sapsaphas and Bethabara" | The cited Wayback capture | Cite-only (existing entry) |
| WEB | `data/reference/engwebp_vpl.txt`; every `textWEB` compared through `getWebTextForReference`; every NT verse searched for each place's names | Public domain |
| Commons | `imageinfo` + `extmetadata` + `categories` API for all 37 files; wikitext for the Godot13 and Wellcome files | Per file (section 5) |
| OpenStreetMap (cross-check only, OSM rule) | Nominatim and Overpass for named features | ODbL; not used as a coordinate source |

`politicalHistory` was recomputed with `derivePoliticalHistoryFromTimeline` (the function `fill:political-history` uses). It matches the stored value exactly for the 18 records with `politicalAreaId`. `gaza` and `aenon` are manual; see F11 and F3. `zarephath` is derived from the `syria` area, not manual as `15c046a`'s message says. The data is right and only the commit message is wrong.

## 2. Per-record verdicts

| Record | Verdict | Coordinate check (distances computed great-circle) | Finding |
|---|---|---|---|
| kidron-valley | Fix required (minor) | Q860532 vs Q531729 380 m, along the valley; matches ISBE "between the eastern walls … and the Mount of Olives". Pass | F10 |
| akeldama | Fix required (minor) | Q886458 vs St. Onuphrius Monastery Q3320224 49 m. Pass. OpenBible's point is Q886458's own value (X1) | F9 |
| valley-of-hinnom | **Fix required (neutrality)** | Q558093 vs OSM "עמק הינום (גהנה)" valley 211 m; ISBE's Wadi er-Rababi description. Pass. OpenBible = Q558093 (X1) | F6 |
| antonia-fortress | **Fix required** | Q570515 vs Convent of the Sisters of Zion Q835203 93 m; Josephus *War* 5.5.8 puts it at the corner of the west and north cloisters. Pass | F8 |
| praetorium | **Fix required** | Herod's palace Q3661432 vs Tower of David Q1177765 25 m (record says 80 m) and OSM 26 m; Antonia as above. Pass. Sharing the Antonia point with `antonia-fortress` is consistent (same source, identical value) and the validator accepts it | F7 |
| sheep-gate | **Fix required (coordinate)** | Point = Lions' Gate (Q129278; OSM 2 m). No cited source puts the Sheep Gate there | F1 |
| gaza | Fix required (minor) | DARE 21672 vs DARMC (via Pleiades) 867 m, Pleiades representative point 2.05 km, Great Mosque Q739415 225 m. Pass | F11 |
| azotus | Fix required (minor) | DARE 21687 vs Pleiades 189 m, CIGS 306 m, Isdud Q7183947 209 m. Pass | F12 |
| lydda | Fix required (minor) | DARE 21685 vs Pleiades 819 m, DARMC 1.64 km. Pass at city tier | F13 |
| antipatris | Fix required (minor) | DARE 21684 vs Pleiades 54 m, CIGS 65 m, OSM Tel Afek 85 m. Pass | F14 |
| zarephath | Fix required (minor) | DARE 21572 vs Pleiades 139 m, DARMC 409 m. Pass | F15 |
| samaria-city | Fix required | Pleiades 678370 vs DARE 75 m, Q1757438 464 m. Pass | F16 |
| tiberias | Fix required (minor) | Pleiades = DARE's old location; DARE now 219 m; Wikidata 1.36 km and 1.66 km; Roman theatre Q3966846 1.58 km. Acceptable at city tier | F17 |
| arimathea | **Fix required (coordinates)** | Rantis: DARE 28373 (precision 2 km) is 1.41 km from the village (Q7293548) and 1.34 km from OSM. Beit Rima: Q4855730 is the merged municipality, 1.05 km from OSM's Beit Rima | F4 |
| jordan-river | Fix required (minor) | Q40059 P625 qualified "applies to part: river mouth" (Q1233637); Pleiades 687932's course ends 349 m away. Label point accepted | F18 |
| gennesaret | **Fix required (coordinate)** | Point = Kinneret archaeological site Q5533392, an Iron Age city, not the plain; 2.49 km from DARE/Pleiades' point for the same mound | F2 |
| plain-of-sharon | Fix required (minor) | Pleiades 465843763 = its "Geonames Location" = Wikidata's value (0 m; one source, X2). Lies within ISBE's plain (Nahr Rubin to Carmel, 8–12 miles broad). Accepted as a label point | F19 |
| wilderness-of-judea | **Fix required (sources)** | Q2046004 only (arc-minute precision); the cited ISBE article is a stub that describes no location | F5 |
| aenon | **Fix required (coordinates, neutrality)** | A: Q12058546 vs Pleiades 678368 Salem/Salumias 65 m. Pass as a sourced proxy (F3d). B: Salim village, 11.2 km from the proposal's own Aenon (Khirbet Einun); a more precise P625 exists 833 m away | F3 |
| jacobs-well | Fix required (minor) | Q1679519 vs OSM "بئر يعقوب / Bi'er Yacoub" (node 431966923) 5 m. Pass | F20 |
| mount-gerizim | Fix required (minor) | Q1288751 vs DARE 37139 156 m, Pleiades 678147 159 m, OSM peak 163 m. Pass. OpenBible = Q1288751 (X1) | F21 |

**What passes everywhere:**
- No swapped `[lon, lat]` values.
- Every source ID resolves.
- Every `textWEB` matches the WEB exactly.
- `parentId`, `type`, `zoomTier`, `naturalFeatureKind` and `prominence` are correct, and the six Jerusalem descendants correctly omit `modernCountries`.
- Every other `modernCountries` value matches the candidates' locations.
- Every `confidence` value fits its evidence.

**Scripture coverage:** each record has every NT WEB verse that names it, except `praetorium` (Matthew 27:27, F7a). The card's exclusions are respected: Tiberias (John 6:1; 21:1), Gennesaret (Luke 5:1) and Samaria (the region verses). `akeldama` also includes Matthew 27:9–10, which the card lists. That accounts for 3 of the 5 new "contains none of this location's names" warnings; the other two are `mount-gerizim`'s John 4:20–21 ("this mountain").

**Not drafted, and I agree:**
- **`solomons-porch`:** Wikidata Q7558533 has no P625. OpenBible a47c817 says only "in Jerusalem". Pleiades and DARE have nothing.
- **`beautiful-gate`:** Wikidata Q4877716 has no P625. OpenBible a5c37fd says only "in Jerusalem". No accepted coordinate exists for any candidate, the Nicanor Gate included.

## 3. Findings (owner: Research Lead unless marked MC = Media Curator)

Quotations are from the cited sources, read at the URLs in section 1.

### F1 `sheep-gate` (major)
- **a. The coordinate is a proxy no source supports.**
  - The point is the Ottoman Lions' Gate (Q129278: "one of seven open Gates in Jerusalem's Old City Walls").
  - ISBE "Sheep Gate" says only "probably near the northeast corner".
  - ISBE "Jerusalem" §18 says the gate "was at the eastern extremity of the north wall".
  - OpenBible aa3d425 says only "in Jerusalem"; its point is a generic Old City point taken from Wikipedia, 532 m away.
  - None of these places the Sheep Gate at the Lions' Gate.
  - **Required:** cite an accepted source that places the gate at or by the Lions' Gate and word the support to match it. If no such source exists, apply the card's stop rule and report the place to the PO. Don't keep the point on the project's own inference ("used here as the nearest confirmed point").
- **b. The label is wrong.** It says "northeast corner of the Old City", but the Lions' Gate is in the east wall, and no cited source says otherwise. Drop the phrase.
- **c. The history cites the wrong article.**
  - The "sheep market" clause comes from ISBE "Sheep Market" (<https://www.internationalstandardbible.com/S/sheep-market.html>): "(Joh 5:2, the Revised Version … 'sheep gate'): The Greek (he probatike) means simply something that pertains to sheep."
  - **Required:** add a `bib:isbe-sheep-market` entry, alphabetically. Say "the King James Version renders it 'sheep market'".
  - Delete "either way, the reference ties the phrase to the nearby Pool of Bethesda rather than giving fresh topographical detail of its own". No source says it.
- **d. Image (MC).** See F1 in section 5.

### F2 `gennesaret` (major)
- **a. The coordinate is of a different place.**
  - The point is Wikidata Q5533392, "Kinneret (archaeological site)", described as an "ancient city": the Iron Age city at Tel Kinrot, not the plain.
  - No cited source places the land of Gennesaret there.
  - Its value is 2.49 km west of DARE 33302's and Pleiades 678155's point for the same mound (Khirbet 'Ureime, "Gennesar", Barrington Atlas 69 C4). The record's "closely corresponding" doesn't describe that gap.
  - **Required:** use `wikidata:Q6669901` (בקעת גינוסר, "valley in Israel", P625 `[35.518333, 32.851667]`). That is the plain itself. It lies between el-Mejdel/Magdala (Q4880851, 2.98 km south) and Khirbat al-Minya (Q2915281, 2.21 km north-east), the two ends ISBE gives.
  - Keep `dare:33302` only as a source for the town of Gennesar, if it is still cited.
- **b. The plain's northern end is misreported.** The record says "from Tell Hum in the north". ISBE: "It curves round from el-Mejdel in the South, to `Ain et-Tineh, or Khan Minyeh, in the North".

### F3 `aenon` (major)
- **a. Candidate B maps Salim, not Aenon.**
  - In the Robinson/Conder proposal, Aenon is "'Ainun in Wady Far'ah". ISBE "Salim": "the position of Aenon, 6 miles distant, with a high ridge intervening".
  - OpenBible's point for that Aenon (Khirbet Einun, 9 sources) is 11.2 km from the record's Salim point. The support's "a nearby spring called Ainun" contradicts the source.
  - **Required:** map 'Ainun from an accepted source. If there is none (OpenBible's point is from GeoNames, which isn't on the accepted list), move this proposal to `unmappedCandidates` with its reason.
  - If Salim stays mapped for any reason, use Q20395636's precise P625 `[35.33034, 32.20962]`. The arc-minute value now used is 833 m away.
- **b. A candidate is excluded on the project's own reasoning.**
  - The Jordan-side Aenon is the Madaba map's Ainon/Sapsaphas. Wikidata Q5977371 describes it as "Aenon … mentioned in the Gospel of John (3:23)", at `[35.549444, 31.8375]`. OpenBible lists it with 7 sources (66), against 1 (17) for Salim.
  - The record excludes it because "this project treats the Madaba map's Jordan-side tradition as a separate question". That takes a side.
  - **Required:** list it neutrally as a candidate (or as an unmapped candidate) with its sources, or cite a source that says it isn't John 3:23's Aenon.
  - The quoted legend "Ainon, where now is Sapsaphas" isn't in the cited Piccirillo text. Piccirillo: "known as Sapsas or Sapsaphas …, as is written in the Madaba Map, which identifies it with Ainon". "Sixth-century" isn't stated by the cited sources either.
- **c. Candidate A's wording.**
  - "which it reads as matching Eusebius's description of a place of abundant water": ISBE says the springs "exactly suit the *position* indicated by Eusebius".
  - **Required:** add `pleiades:678368` (Salem/Salumias, 65 m from the point). State that ISBE places Salim at "Tell Ridhghah … Sheikh Selim", with the springs "Not far off, by the ruins of Umm el-`Amdan". On that basis the proxy at Salim/Tel Shalem is acceptable: the verse itself places Aenon by Salim, and the only point for Umm el-'Amdan is from DAAHL (rejected), 1.97 km away.
- **d. Candidate B's wording.** "nineteenth-century explorers" and "nearby" aren't in the source. ISBE's objection is that the site "is in the very heart of Samaria, and therefore impossible", together with the 6-mile distance and Shechem being "quite as near". "Keeping John the Baptist's activity and Jesus' own separate journey through Samaria as distinct episodes" isn't stated. Reword to ISBE's actual reasons.
- **e. The summary.**
  - "Briefly overlapped with Jesus' own ministry nearby": cite John 3:22 and drop "nearby".
  - "Most other English translations use 'Aenon'": cite the version entries used for spellings (ADR-0026), or drop.
  - "Fourth-century" for Eusebius: cite it or drop it.
- **f. The history.** John 3:25 WEB reads "with some Jews", not "a Jew". "He must decrease" is John 3:30, which needs to be cited.
- **g. Political history, candidate 0.** Add `bib:isbe-aenon` or `bib:isbe-salim` to the entry's sources, and say in the note that they place the district "in the lands of Scythopolis". The cited `bib:isbe-decapolis` doesn't place Aenon there.

### F4 `arimathea` (major)
- **a. The Rantis point isn't the village.**
  - DARE 28373's point has `precision: 2000` (Pleiades 688014's accuracy is 10 km). It lies 1.41 km from Rantis village (Q7293548, which is already cited) and 1.34 km from OSM's village node.
  - **Required:** make `wikidata:Q7293548` the `coordinateSource`, and keep `dare:28373` for the identification.
- **b. The Beit Rima point isn't the village.** Q4855730 is "West Bani Zeid", the municipality that merged Beit Rima and Deir Ghassana, and its point is 1.05 km from OSM's Beit Rima village. Say so in the support, or use a village point from an accepted source.
- **c. The candidates' supports.**
  - Rantis: "the prophet Samuel's birthplace, whose name Rantis is thought to preserve" and "in the hill country northwest of Jerusalem" aren't in DARE or OpenBible.
  - Beit Rima: "a short distance east" (8 km) isn't sourced. OpenBible's scores are Rantis 301, "another name for Ramathaim-zophim" 195, Beit Rima 77, so Beit Rima is the second *modern site*, not the second proposal. Reword.
- **d. The summary.**
  - "according to all four Gospels … buried it in his own new tomb": none of the four cited verses says this; "his own new tomb" is Matthew 27:60 only.
  - "Not consented" is Luke 23:51 only. "Council member" is Mark 15:43 and Luke 23:50, and Luke 23:50 needs to be cited.
- **e. The history is empty.** The card says to include `history`.
- **Note.** The alternate name "Ramathaim-Zophim" presents a disputed identification as a name of the place. Consider dropping it.

### F5 `wilderness-of-judea` (major)
- **a.** The summary's description of the region, "arid, rugged region east of Jerusalem's hill country, descending toward the Dead Sea", is sourced only to Matthew 3:1, which doesn't say it. Cite a source.
- **b.** ISBE "Judaea, Wilderness of" reads in full: "(Mt 3:1). … See JUDAEA." It corroborates nothing, so the support's "cross-reference … to this same region" overstates it, and the point has only one source. **Required:** add a second source that describes or locates the region.
- **c.** The history is empty (card).
- **d. Image (MC).** See section 5.

### F6 `valley-of-hinnom` (major: neutrality)
- **a. A source's theological position is misreported.**
  - History 1 says ISBE's "Gehenna" "takes no theological position … noting only that …". That is false.
  - Vos writes that the word "designates the place of eternal punishment of the wicked", and that this "is not to be explained on the principle that the New Testament speaks metaphorically …; it presupposes the resurrection".
  - **Required:** delete the entry (the summary already says neutrally that these passages use the word for final judgment), or attribute ISBE's view to ISBE without calling it neutral.
- **b. The support's wording.**
  - "OpenBible.info … independently records the same coordinate": OpenBible's point *is* Q558093's value (X1). Use the OSM valley (211 m) or ISBE's description as the corroboration instead.
  - "Among older writers": ISBE says "by different writers", including "several distinguished modern writers" for the Tyropoeon.
- **c. The summary.**
  - "A transliteration of the valley's Hebrew name": ISBE says "from the Aramaic form of the Hebrew ge-hinnom".
  - "valley of slaughter": the WEB reads "The valley of Slaughter".
  - "A practice King Josiah ended": 2 Kings 23:10 says he "defiled Topheth … that no man might make his son or his daughter to pass through the fire to Molech". Say that.
- **d.** History 2's burning of refuse comes from "Hinnom, Valley of" ("fires were here kept burning to consume the rubbish of the city"). Add `bib:isbe-hinnom-valley-of` to that entry.

### F7 `praetorium` (major)
- **a. A passage is missing.** Add Matthew 27:27 to `scripture[]`. WEB: "Then the governor's soldiers took Jesus into the Praetorium". The card asks for every NT WEB passage that names the place.
- **b. History 1 misquotes and misreports the WEB.**
  - Mark 15:16 WEB reads "within the court, which is the Praetorium", not "inside the court".
  - The purple robe and crown of thorns are in Mark 15:17, which needs to be cited.
  - "Matthew's parallel account … translated 'Governor's palace'" is false: the WEB says "the Praetorium".
- **c. The Herod's palace candidate's support.**
  - "Florus … later withdrawing to the Antonia only when his position there became untenable" misreports the source. ISBE quotes Josephus: Florus "would have compelled them to get as far as the citadel (Antonia); but his attempt failed".
  - "About 80 meters": Q3661432 and Q1177765 are 25 m apart.
- **d. The summary.**
  - "Both proposals have scholarly support, and neither pavement nor palace survives to settle the question archaeologically" has no source. ISBE itself describes an extant Roman pavement near the Ecce Homo arch. Drop the sentence, or source it.
  - "Named in Aramaic 'Gabbatha'": WEB John 19:13 says "in Hebrew". Give the Aramaic etymology as ISBE's ("probably").

### F8 `antonia-fortress` (major)
- **a. The summary.**
  - **The identification isn't cited.** The card asks for a citation for the identification of the WEB's "barracks" with the Antonia, and `bib:isbe-jerusalem-2` doesn't make it. `bib:isbe-praetorium` does link the two: "the Antonia and where was stationed a large garrison (compare Ac 21:32-35)".
  - "Translates a Greek word for a military camp" has no source.
  - "Built … at the Temple Mount's northwest corner" and "the work of king Herod": add `bib:josephus-jewish-war` (*War* 5.5.8: "situated at the corner of two cloisters … on the west, and … on the north").
  - "Named for his patron Mark Antony": *War* 1.21.1 says "in honor of Antony". "Patron" isn't stated.
  - The soldiers rushing down is Acts 21:31–32, and the stairs is Acts 21:40. Cite both.
- **b. The history misreports Josephus.** Whiston's text: "there always lay in this tower a Roman legion", which "went several ways among the cloisters, with their arms, on the Jewish festivals". The record's "a cohort … garrisoned there during festivals" misstates this. Drop "consistent with Acts' account" (editorial).
- **c. The support.**
  - "No part of the fortress survives above ground" has no source.
  - ISBE "Jerusalem, 2" doesn't locate the Antonia on the ground. Cite *War* 5.5.8 for the corner instead.
- **d. `names.modern`.** "Antonia Fortress (site)": "(site)" is an editorial note (schema, "Modern names"). Drop it.

### F9 `akeldama` (minor)
- **a. The summary.**
  - "the potter's field, to bury strangers in" isn't the WEB text. WEB Matthew 27:7: "bought the potter's field with them to bury strangers in".
  - "At least to the fourth century": ISBE says the tradition "appears to go back to the 4th century".
  - "Acts gives a different account of how Judas himself obtained a field and died there": Acts 1:18 doesn't say he died *there*. Neutral wording: "Acts says Judas obtained a field with the reward and describes his death".
- **b. The support.**
  - OpenBible doesn't corroborate the point, because its point is Q886458's own value (X1). Cite St. Onuphrius Monastery (Q3320224, 49 m) instead, if a second dataset is wanted.
  - "Still associated with the name today": the source is from 1915 (X3).
- **c. History 2.** "And the site is still visited today" has no source (X3).

### F10 `kidron-valley` (minor)
- **a.** History 2: "after the prophet Joel's vision" isn't in ISBE "Kidron", which only points to "JEHOSHAPHAT, VALLEY OF". Cite that article or Joel 3:2/3:12, or drop the clause.
- **b.** The Jeremiah 31:40 note quotes "holy to Yahweh", which is ISBE's ASV wording. The WEB reads "holy to the LORD". "Widely identified with the Kidron" isn't stated by any source; the verse itself names "the brook Kidron".
- **c.** The summary's "on the night of his arrest" isn't in John 18:1. Cite John 18:3 and 18:12, or drop it.
- **d.** Add the KJV's "Cedron" (John 18:1; ISBE: "the King James Version Cedron") to `names.alternate` (schema, "Names").

### F11 `gaza` (minor)
- **a.** "Tell Harube" is OpenBible's name (aa8edd2, "Tell Harube", very high). DARE, Pleiades and ISBE don't use it. Cite `openbible:gaza` (and regenerate the ID files), or drop the name.
- **b.** "Pleiades' … point … about 1 kilometer away": its representative point is 2.05 km away, and its DARMC location is 0.87 km away. Reword.
- **c.** "Describing the road there as 'desert'" takes a reading of the verse. WEB Acts 8:26: "… to the way that goes down from Jerusalem to Gaza. This is a desert." Quote it without deciding what "This" refers to.
- **d.** History 1 and political history 1 say "in 63 BC" and "the Roman governor of Syria". ISBE "Gaza" says neither ("Pompey restored the freedom of Gaza …, and Gabinius rebuilt it in 57 BC"). Cite a source for both, or drop them. Political history 1's "within Pompey's settlement of Syria" needs Josephus *Ant.* 14.4.4.
- **e.** History 3 says the community "grew despite persecution". ISBE: "the church founded there was struggling for existence. Many martyrs there testified".
- **f.** Political history 3's note "administered from Antioch" isn't in its cited source. Cite the timeline's Syria source, or drop it.
- **Otherwise the political history passes.** The -4 transfer to Syria matches the timeline's `herod-kingdom-divided` stop ("Gaza, Gadara and Hippos … added to the province of Syria"), *War* 2.6.3 ("he cut them off from the kingdom, and added them to Syria") and *Ant.* 15.7.3 (added to Herod's kingdom). The entries before -4 fall outside the timeline's range and are harmless.

### F12 `azotus` (minor)
- **a.** The support's sentence "Azotus Paralios … attested at this period as a distinct, smaller place" isn't stated by any cited source. Also, "about 250 meters" is 189 m.
- **b.** The summary's Ethiopian official and Gaza road are Acts 8:26–39: cite them. "North" and "Philip the evangelist" (Acts 21:8) need a citation, or drop them.
- **c.** The history: ISBE says "the Roman general Gabinius", not "governor". "Rather than to any of Herod's own sons" isn't stated; drop it.

### F13 `lydda` (minor)
- History 2's "Roman general" and "early in the First Jewish-Roman War" aren't in ISBE. Add `bib:josephus-jewish-war` (*War* 2.19.1), or drop them.
- The support's "independently … about 900 meters": Pleiades' representative point (819 m) averages in DARE's own location, and the independent DARMC point is 1.64 km away (X2). Reword.

### F14 `antipatris` (minor)
- The summary's assassination plot (Acts 23:12–21) and the horsemen continuing (Acts 23:32) need those verses cited.
- History: "built on the same strategic position where the main road crossed the river's source" isn't stated. Drop it.
- "Less than 50 meters" is 54 m.

### F15 `zarephath` (minor)
- The summary's synagogue at Nazareth (Luke 4:16) and the famine (Luke 4:25) need those verses cited.
- The 1 Kings 17:9 note says "during a famine", which neither the verse nor ISBE says.
- The Obadiah 1:20 note quotes "as far as Zarephath"; the WEB reads "even to Zarephath". "On Israel's northern horizon" isn't sourced.
- The support's "independently … almost exactly" overstates the match (X2): DARMC is 409 m away.
- **Image (MC).** See section 5.

### F16 `samaria-city` (minor)
- **a. The manuscript note isn't sourced.**
  - ISBE says only: "It is commonly thought that this city was the scene of Philip's preaching …, but the absence of the definite article in Ac 8:5 makes this doubtful."
  - The record's "the World English Bible and other translations differ over whether the Greek text names this as 'the city' or only 'a city'" isn't stated by any cited source, and the PO note allows the point only if a cited source states it.
  - **Required:** rewrite the sentence to ISBE's statement, and keep it last (ADR-0041 item 1).
- **b.** "With many believing and being baptized" is Acts 8:12. Cite it.
- **c. The history.**
  - "After a long decline": ISBE says John Hyrcanus "tried to destroy the city utterly", and then the city "was rebuilt by Pompey".
  - "The Syrian governor Gabinius": ISBE says only "Gabinius".
  - "Two of his own sons": ISBE says "his sons".
- **Image (MC).** See section 5.
- **Note for the PR reviewer.** `names.ancient[0]` is "Samaria", the same title as the `samaria` region. Run `@names`.

### F17 `tiberias` (minor)
- **a.** History 3 says the city "gave its name to the Jerusalem Talmud". That is false. ISBE: "Here also later was compiled the Jerusalem Talmud".
- **b.** The support says the sources are independent and "all closely matching". They aren't: Pleiades' only location is the "DARE Location", and Wikidata's two values are 1.36 and 1.66 km away. Reword. The point is acceptable at city tier.

### F18 `jordan-river` (minor)
- **a.** The summary's course of the river has no cited source. Cite Josephus *War* 3.10.7 or Wikidata Q40059.
- **b. History 1.**
  - "Twice": John relates the Baptist to the Jordan three times (1:28; 3:26; 10:40).
  - "The borders of Judea beyond the Jordan" is Matthew 19:1 only. Mark 10:1 reads "the borders of Judea and beyond the Jordan".
  - The John 10:40 quotation has a comma the WEB lacks.
- **c.** History 2's "this project follows that river stretch in treating the lake's western shore as part of Galilee …" describes our map, not Josephus. Rewrite it to what Josephus says, with the locus, or drop it.
- **d.** The 2 Kings 2:8 note: "before he is taken up" is 2:11 and Elisha's repetition is 2:14. Cite them, or trim the note.
- **e. The support.** "Since it lies closest to the stretch of the river the New Testament names" isn't sourced, and Matthew 4:15 and 4:25 refer to the Galilee side. Drop it.
  - **The label point itself passes:** a sourced river-mouth point, corroborated by Pleiades' river course. OpenBible repeats Wikidata (X1).

### F19 `plain-of-sharon` (minor)
- The Isaiah 35:2 note quotes "the excellency of Carmel and Sharon"; the WEB reads "the excellence of Carmel and Sharon".
- The support: Pleiades' point is a GeoNames point identical to Wikidata's value, so it is one source, not two (X2). Reword. ISBE's description corroborates the label point.
- The summary: "central Israel" needs `wikidata:Q218907` ("northern half of the coastal plain of Israel"). The healing is Acts 9:33–34 (cite).
- Add the KJV's "Saron" (Acts 9:35) to `names.alternate`.

### F20 `jacobs-well` (minor)
- The Genesis 33:18 note: the purchase is in 33:19. Use `Genesis 33:18-19`.
- History 2's "Today a Greek Orthodox church stands over the site" rests on a 1915 source, which says only that the Greek church bought the plot and built "a chapel … over the well" (X3). Find a current source, or put the sentence in the past tense and attribute it.
- The support's "with no serious rival site proposed": ISBE says "there is no good reason to doubt its truth". Reword.
- History 1's "for ordinary household use" isn't in ISBE.

### F21 `mount-gerizim` (minor)
- The support: OpenBible's point is Q1288751's own value (X1). Cite DARE 37139 or Pleiades 678147 (156–159 m) instead.
- The summary quotes "neither in this mountain, nor in Jerusalem"; the WEB has no comma. "True worshipers" is John 4:23 (cite it or rephrase).
- History 2: "who still worship separately today" and "continue to celebrate the Passover on the mountain each year" rest on a 1915 source (X3). "Hasmonean" isn't in ISBE.
- The Samaritans are described neutrally. **Pass** on that point.

### Cross-cutting notes
- **X1. OpenBible repeats Wikidata.** `modern.jsonl` shows that OpenBible's points for Akeldama, Hinnom Valley, Mount Gerizim, the Jordan, Kidron, Rantis, Tel Shalem, Lod, the Sharon Plain, Tiberias and Tell Harube are taken from Wikidata (`coordinates_source.type: "wikidata"`). They can't corroborate the same Wikidata item. I found an independent check for every mapped point (section 2).
- **X2. Pleiades often repeats DARE.** Pleiades' representative points often average in DARE's own location, so "independently" overstates the match. This is a wording fix only.
- **X3. Present-tense claims from 1915.** "Today" and "still" statements based on the 1915 ISBE need a current source, or past-tense attribution.
- **X4. Process note (PO, PR reviewer).** The 22 new `bib:` entries form one sorted block at the very start of `data/bibliography.json`, a file that wasn't sorted before (100 unsorted pairs). If M6-05 also inserts at the top, the two PRs may conflict there.

## 4. "Gaza Strip" (schema allow-list): pass, with a PO confirmation (Q1)

I judged it by the same standard as "West Bank" (ADR-0028; `docs/verification/M3-modern-countries.md`, CP3.5 decision 1).
- **The rule applies.** Gaza lies outside any one country's undisputed territory, and the rule is to use "the territory name most English news and reference works use … The name describes where the place is, not who should rule it."
- **It is the standard name.** Wikidata Q47492 describes Gaza City as a "modern city in Gaza Strip". `docs/DECISIONS.md` already names "the Gaza Strip" among the modern map's masked territories.
- **It is the parallel of "West Bank".** It doesn't choose between "Palestine", "Israel" or "Egypt".
- **It is used correctly.** It is used once, by `gaza`, whose only candidate is in Gaza City.
- **Neutral wording.** The record's text is strictly descriptive: "Gaza City", "the coastal route between Syria and Egypt". The image caption is too.
- **Why the PO must confirm.** M3 said Gaza "would also need a territory name that CP3.5 decision 1 doesn't cover, which is a question for the PO". The human approved "West Bank" and "Golan Heights" as named values, so the PO should confirm this extension (Q1).

## 5. Images (37)

All 37 files exist, match their `url`/`sourcePage` pair, and match their recorded width and height. Every `license` equals Commons' `LicenseShortName` exactly, including `CC BY 3.0 de`, and all are in the accepted bands. Subjects were confirmed through Commons categories and descriptions.

| Image | Subject (Commons category or description) | License | Author | Verdict |
|---|---|---|---|---|
| kidron-valley-01 | Wadi al-Nar; LOC Matson | Public domain | Matson Collection | Pass. Note: the Matson date is "between 1898 and 1946", so "early twentieth-century" is a guess; prefer "Matson Collection photograph" |
| kidron-valley-02 | Wadi al-Nar; Eastern Wall | CC BY-SA 4.0 | Databases | Pass. Note: the description adds "Photo taken by Daniel McFeeters"; optionally "Daniel McFeeters (Databases)" |
| akeldama-01 | Remote views of St. Onuphrius Monastery | Public domain | Bounty24 | Pass, but 600 px (F9-img) |
| akeldama-02 | Aceldama | CC BY-SA 2.0 | Seetheholyland.net (Joe Freeman) | Pass, but 800 px (F9-img) |
| valley-of-hinnom-01 | Valley of Hinnom | CC BY-SA 2.0 | Ian Scott | Pass |
| valley-of-hinnom-02 | Hinnom Valley (Wadi er-Rababi), 1970s | CC BY-SA 3.0 | ekstijn | Pass |
| antonia-fortress-01 | Antonia Fortress; Holyland Model | CC BY 3.0 | Ariely | **Fix (MC):** drop the caption's unsourced "No part of the fortress survives above ground today" |
| antonia-fortress-02 | Antonia Fortress; Umariya school, 1869 | Public domain | Unknown (Commons: "Unnkown") | Pass |
| praetorium-01 | Tower of David (aerial) | CC BY-SA 4.0 | אורי אלוני | Pass |
| praetorium-02 | Antonia Fortress model (same file as antonia-01) | CC BY 3.0 | Ariely | Pass |
| sheep-gate-01 | Lions Gate | CC BY-SA 4.0 | **Godot13 → "Andrew Shiva / Wikipedia"** | **Fix (MC):** the Commons credit line and `{{Attribution}}` require crediting Andrew Shiva (precedent: `joppa`, `temple-mount`, `mount-of-olives`). The caption's "near the northeast corner" goes, and the image's use depends on F1 |
| gaza-01 | Gaza City, 2007 | Public domain | OneArmedMan | Pass |
| gaza-02 | Gaza City; William Tipping | Public domain | William Tipping | Pass |
| azotus-01 | Tel Ashdod | CC BY 2.5 | סתיו קונשטיק | Pass |
| azotus-02 | Ashdod Marina | CC BY-SA 3.0 | Amos Meron | Pass |
| lydda-01 | Lod | CC BY-SA 3.0 | yfrimer | Pass |
| antipatris-01 | Aerial photographs of Tel Afek | CC BY-SA 3.0 | Dvirraz, Neukoln (retouch) | Pass |
| antipatris-02 | Aerial photographs of Tel Afek, 1925 | Public domain | Matson Collection | Pass |
| zarephath-01 | Sarepta, Libanon (Roberts/Haghe 1843) | CC BY 4.0 | Louis Haghe, after David Roberts | **Fix (MC):** the credit line is `{{Wellcome Images}}`, so add "; Wellcome Collection" (precedent: `pergamum`) |
| zarephath-02 | Sarepta, Libanon (*Picturesque Palestine*) | Public domain | New York Public Library | Pass |
| samaria-city-01 | Sebastia, Nablus | CC BY-SA 3.0 | Mujaddara | **Fix (MC):** the caption says the colonnaded street is Herod's, which only the 1915 ISBE claims. Use "The colonnaded street at Sebastia, site of ancient Samaria" |
| samaria-city-02 | Sebastia, Nablus | CC BY-SA 3.0 | Mujaddara | Pass |
| tiberias-01 | Tiberias | CC BY-SA 2.0 | israeltourism | Pass |
| tiberias-02 | Tiberias (south, 1970) | Public domain | משה מילנר | Pass |
| arimathea-01 | Rantis | CC BY-SA 4.0 | יעקב | Pass |
| jordan-river-01 | Jordan River; Bethabara | CC BY 3.0 de | High Contrast | Pass |
| jordan-river-02 | Jordan River; Bonfils | Public domain | Félix Bonfils | Pass |
| gennesaret-01 | Ginosar; Ghuwayr Abu Shusha | CC BY-SA 3.0 (dual with GFDL) | יעקב | Pass |
| plain-of-sharon-01 | Sharon | Public domain | חדוה שנדרוביץ | Pass |
| plain-of-sharon-02 | Sharon; Matson | Public domain | Matson Collection | Pass |
| wilderness-of-judea-01 | Judean Desert | CC BY-SA 4.0 | **Godot13 → "Andrew Shiva / Wikipedia"** | **Fix (MC):** same credit line as sheep-gate-01 |
| wilderness-of-judea-02 | Judean Desert; Matson | Public domain | Matson Collection | Pass |
| aenon-01 | Salim from Mount Ebal | CC BY-SA 4.0 | יעקב | Pass. Recheck after F3a: if candidate B moves to 'Ainun, Salim isn't the candidate any more |
| jacobs-well-01 | St. Photina Church (Nablus) | CC BY-SA 3.0 | Jeremiah K Garrett | Pass |
| jacobs-well-02 | Jacob's Well, Nablus; Matson | Public domain | Matson Collection | Pass |
| mount-gerizim-01 | Mount Gerizim | CC BY-SA 4.0 | יאיר דב | Pass |
| mount-gerizim-02 | Mount Gerizim; Temples of Jupiter (GPO 1967) | CC BY-SA 3.0 | David Eldan | Pass. Note: "built over the site of the Samaritan temple" is the Commons description's claim; consider "described as" |

**F9-img (MC): the two Akeldama images.** At 600 px and 800 px, they are acceptable only if nothing better exists, and better does exist. Category:Aceldama holds CC BY 4.0 files at 5,472 × 3,648 px (for example `File:Jerusalem-Hinnom-Kidron-Old-City-397.jpg`). Replace at least one, after confirming the subject.

Captions are otherwise neutral: Gaza and West Bank places are described without political wording, and church traditions are attributed. Every `kind` fits its image.

## 6. Licences

- **No new upstream source.** All 22 new `bib:` entries are ISBE (1915) chapters: public domain, and already covered by the "Public-domain texts" rows in `docs/LICENSES.md` and `ATTRIBUTION.md`.
- **No new dataset.** The records cite only Wikidata (CC0), Pleiades (CC BY 3.0), DARE (CC BY-SA 3.0) and OpenBible.info (CC BY 4.0), all already listed.
- **No OSM-derived or DAAHL-derived coordinate is used.**
- **No quotation from a cite-only source.** Piccirillo is paraphrased. Quotations from ISBE and Josephus (Whiston) are public domain.
- **Images:** all in the accepted bands, with the Wellcome and Andrew Shiva credit fixes above.
- Neither `docs/LICENSES.md` nor `ATTRIBUTION.md` needs an edit for this batch.

## 7. Commands (run on `79a598d`)

| Command | Result |
|---|---|
| `npm run validate:data` | **Pass**, 0 errors, 214 warnings. The 7 new warnings are explained: 5 "contains none of this location's names" (`akeldama` Matthew 27:9, 27:10 and Acts 1:19; `mount-gerizim` John 4:20–21), and 2 for `akeldama`'s images being under 1,200 px |
| `npm test` | **Pass**, 323/323 |
| `npm run build:data` | **Pass**; no tracked file changed |
| `npm run check:images` | **Pass**: "Checked 1370 Commons URLs (original + 330, 500, 960, 1280px), 274 Commons size records, and 31 AI files. All image checks passed." No 429 was reported. (My own Commons API reads hit 429 on 3 files; they were retried and read.) |

## 8. Questions for the PO

1. **Q1.** Confirm `"Gaza Strip"` as an extension of CP3.5 decision 1, or send it to the human.
2. **Q2.** `sheep-gate`: if the Research Lead finds no source placing the Sheep Gate at the Lions' Gate (F1a), the card's stop rule applies. Drop the record and report it, as with `solomons-porch` and `beautiful-gate`?
3. **Q3.** `aenon`: `names.ancient[0]` is "Enon near Salim", following the card. `schema/README.md` "Names" says the title should be the spelling most of NIV, ESV, NLT, KJV, NKJV and CSB agree on, which is "Aenon". Which wins?

## Sign-off

**First round: not signed off.** All 21 records stayed `status: "draft"`. I said I would re-check once the Research Lead (F1–F21) and the Media Curator (sheep-gate-01, wilderness-of-judea-01, zarephath-01, antonia-fortress-01, samaria-city-01 and the Akeldama images) had pushed their fixes. — fact-checker, 2026-11-06

## 9. Re-check (2026-11-06, at `fbd1cd2`; diff `22a70a9..fbd1cd2`)

### 9.1 What changed
- **Research Lead** (`6b611a3`, `9128b0b`):
  - Addressed F1–F21.
  - Removed `sheep-gate`.
  - Retitled `aenon` and rebuilt it with three proposals: two mapped candidates (Tel Shalem; Wadi al-Kharrar, the Madaba map's "Ainon") and one unmapped candidate ('Ainun/Khirbet Einun).
  - Removed `bib:isbe-jerusalem-2` and `bib:isbe-judaea-wilderness-of`, and added `bib:isbe-judah-territory-of`.
- **Media Curator** (`d8bd876`): credits, captions, and two new Akeldama photos.
- **PO** (`5804565`, `fbd1cd2`): removed `sheep-gate`'s media and the unused `bib:isbe-sheep-gate`.

I re-checked only what changed, against the same sources as round 1. New sources opened: ISBE "Judah, Territory of" (E. W. G. Masterman, 1915; public domain) and Josephus *War* 1.21.1 and 2.19.1 (Whiston). I also re-read Piccirillo and *War* 3.10.7, and read the two new Commons files (`imageinfo` and categories, plus a 500 px look at each).

**Scope: 20 records.** `sheep-gate` is gone, as are its record, media and `bib:` entry. No file references it any more: I searched `data/` and `app/src`.

### 9.2 Status of every round-1 finding

| Finding | Record | Result |
|---|---|---|
| F1 | sheep-gate | **Closed:** the record was removed (PO Q2). No accepted source places the gate, which is consistent with `solomons-porch` and `beautiful-gate` |
| F2 | gennesaret | a. **Pass:** now `wikidata:Q6669901` (Beqa'at Ginosar), the plain itself. b. **Pass.** **New, minor:** see 9.3 |
| F3 | aenon | a. **Pass:** 'Ainun is now an unmapped candidate with an accurate reason, and Salim is no longer mapped. b. **Pass in substance:** the Jordan-side Ainon is a mapped candidate (Q5977371, 85 m from the `bethany-beyond-the-jordan` Al-Maghtas point, as the support says), and its political history equals the `galilee-perea` derivation exactly. c. **Pass:** `pleiades:678368` added, Tell Ridhghah stated. d, e, g. **Pass.** f. **Pass.** Remaining items: 9.3 |
| F4 | arimathea | a. **Pass:** `coordinateSource` is now `wikidata:Q7293548`. b. **Pass:** the merged municipality is disclosed. c, d, e. Partly fixed: 9.3. "Ramathaim-Zophim" removed from the names (note followed) |
| F5 | wilderness-of-judea | a, b. **Pass:** ISBE "Judah, Territory of" says "a wide area of waterless and barren desert, the Wilderness of Judah (or Judea) known in English Versions of the Bible as JESHIMON", inside the Jordan, the Dead Sea and "a long line of semi-precipitous cliffs". The Wikidata label point lies within that area, so it has a qualitative second source, the same standard as `plain-of-sharon`. c. History added, but see 9.3. d. **Pass** |
| F6 | valley-of-hinnom | a. **Pass:** the misreported entry is gone. b. **Pass.** c. Partly fixed: 9.3. d. **Pass** |
| F7 | praetorium | a. **Pass:** Matthew 27:27 added; `textWEB` matches. b. **Pass.** c. Partly fixed: 9.3. d. **Pass** |
| F8 | antonia-fortress | b, c, d. **Pass.** *War* 5.5.8 and 1.21.1 are quoted correctly ("which he called Antonia, in honor of Antony"). a. Partly fixed: 9.3 |
| F9 | akeldama | a, b, c. **Pass:** quotations match the WEB and ISBE; the cross-check is now St. Onuphrius Q3320224, 49 m away. Images: 9.3 |
| F10 | kidron-valley | b, c, d. **Pass:** "holy to the LORD"; John 18:3 and 18:12 cited; "Cedron" added. a. Partly fixed: 9.3 |
| F11 | gaza | a, b, d, e, f. **Pass.** The political history's -63 entry is now supported by Josephus *Ant.* 14.4.4 ("All these Pompey left in a state of freedom, and joined them to the province of Syria"). c. Partly fixed: 9.3 |
| F12 | azotus | **Pass.** a: 190 m, and the Azotus Paralios sentence is gone. b: Acts 8:26, 8:27, 8:38 and 21:8 cited. c: "general", and the editorial clause is gone. I withdraw the "north" item: Caesarea is north of Azotus by the two records' own sourced coordinates, so it isn't a new factual claim |
| F13 | lydda | **Pass.** *War* 2.19.1 is paraphrased correctly ("empty of its men … the feast of tabernacles … destroy fifty … burnt the city"), and Pleiades' averaging is disclosed |
| F14 | antipatris | **Pass:** Acts 23:12 and 23:32 cited, the clause removed, and "about 54 meters" |
| F15 | zarephath | **Pass** except one source: 9.3 |
| F16 | samaria-city | a. **Pass:** the note now quotes ISBE exactly and comes last. b. **Pass.** c. **Pass**, but the rewrite adds "Hasmonean ruler": 9.3. Image caption: **Pass.** I added the missing full stop as a typo fix |
| F17 | tiberias | **Pass:** "the Jerusalem Talmud was later compiled there", and the distances are stated honestly |
| F18 | jordan-river | b, d, e. **Pass:** "three times", with John 3:26 added; the Mark 10:1 wording is fixed; the 2 Kings 2:8 note is fixed. a, c. Partly fixed: 9.3 |
| F19 | plain-of-sharon | **Pass:** "excellence"; "Saron" added; Wikidata and Acts 9:33–34 cited. New item: 9.3 |
| F20 | jacobs-well | **Pass:** Genesis 33:18-19; history set in 1915 and attributed; "no good reason to doubt" quoted |
| F21 | mount-gerizim | **Pass:** DARE and Pleiades at about 160 m; "Hasmonean" removed; the 1915 claims attributed. New item from the summary rewrite: 9.3 |
| Images | — | **Pass:** "Andrew Shiva / Wikipedia" (wilderness-of-judea-01); "Louis Haghe, after David Roberts; Wellcome Collection"; the two captions; the Akeldama files are 5,472 × 3,648 and 5,364 × 3,352, `CC BY 4.0`, Bukvoed, Category:Aceldama. One caption: 9.3 |

**Political history:** recomputed. The 18 derived records still equal `fill:political-history`'s output. `gaza` and `aenon` are manual and pass; `aenon`'s candidate 1 is the `galilee-perea` derivation exactly.

### 9.3 Remaining fixes (15 records stay draft)

The owner is the Research Lead unless marked MC.

| Record | Remaining fix |
|---|---|
| kidron-valley | History 2: "an association the International Standard Bible Encyclopedia connects to the prophet Joel's vision" comes from ISBE "Hinnom, Valley of" ("the 'Valley of Jehoshaphat' of Joe 3:2"), not "Kidron". Add `bib:isbe-hinnom-valley-of` to that entry |
| akeldama | **MC.** akeldama-01's caption "on the slope below Mount Zion" contradicts ISBE, which puts the site on the valley's *southern* slope, opposite Mount Zion. Commons says only "Hinnom Valley" and Category:Aceldama. Drop the phrase. The record itself passes |
| valley-of-hinnom | Summary: "a practice King Josiah ended". 2 Kings 23:10 states the purpose ("that no man might …"), not the result. Use "sought to end", or drop "ended" |
| antonia-fortress | Summary: ISBE doesn't "place the Praetorium" at the Antonia. It says the Praetorium "has been traditionally located" there, and then argues for Herod's palace. Reword to what it does say: the Antonia was "where was stationed a large garrison (compare Ac 21:32-35)" |
| praetorium | Herod's palace support: "trying, but failing, to compel the people". In ISBE's quotation, Florus "would have compelled *them*", meaning "such as were with him" (his own men), "to get as far as the citadel". Reword |
| gaza | Summary: "of which the text adds, 'This is a desert'" still ties "This" to the road (F11c). Change it to "and the text adds" |
| zarephath | The Obadiah 1:20 note's "naming it as a Phoenician town" has only the verse as its source, and the verse says "among the Canaanites". Restore `bib:isbe-zarephath` ("a Canaanite (probably meaning Phoenicia) town"), or say "Canaanite" |
| samaria-city | (1) **New, consistent with F12:** "Philip the evangelist" needs `scripture:Acts 21:8`, or drop "the evangelist". (2) History 1's "the Hasmonean ruler John Hyrcanus": ISBE says only "John Hyrcanus" (as in F21, where "Hasmonean" was removed). Cite a source, or drop "Hasmonean ruler" |
| arimathea | (1) "All four Gospels describe asking Pontius Pilate for the body": Matthew 27:58 and Luke 23:52 aren't cited. (2) "for fear of the Jewish leaders": WEB John 19:38 reads "for fear of the Jews". Quote the WEB. (3) "The prophet Samuel's (Old Testament) birthplace", in the Rantis support and in the history: 1 Samuel 1:1 says only that Elkanah was "of Ramathaim Zophim, of the hill country of Ephraim". Cite 1 Samuel 1:19–20 plus a source that equates Ramah with Ramathaim, or say "home of Samuel's father Elkanah". (4) Summary: "in the hill country northwest of Jerusalem" has no source. (5) Rantis support: Wikidata "corroborates the identification". It corroborates the *location* only (Q7293548 doesn't mention Arimathea) |
| jordan-river | (1) Summary: Wikidata Q40059 gives the source (Golan Heights; Sde Nehemia), the lake on the river (Sea of Galilee) and the mouth (Dead Sea). "From the mountains near Mount Hermon" and "down the Jordan Rift Valley" aren't stated. Cite *War* 3.10.7 ("Jordan's visible stream arises from this cavern [Panium]") or reword. "Preached" needs Luke 3:3. (2) History 2: *War* 3.10.7 says the Jordan "passes through the middle of the lake Gennesareth". "Dividing it into two parts" isn't stated (Josephus says it "divides the marshes and fens of the lake Semechonitis"). Drop it |
| gennesaret | Support: DARE and Pleiades' Gennesar is 1.74 km to the north-east of the new point, not "about 2.5 kilometers to the east". "On the plain's northern edge" isn't stated by DARE or Pleiades |
| plain-of-sharon | Summary: "described by Wikidata as …" names a database in the summary (ADR-0033). Keep the source in `sources` and drop the attribution from the text |
| wilderness-of-judea | History: ISBE calls the *hill country's* eastern slopes "preeminently a pastoral land", with flocks "invading in the spring even the desert itself". The record gives this to "the region" (the wilderness). Reword. "Older English Bible versions": ISBE says "English Versions of the Bible", so drop "older" |
| aenon | (1) **Licence:** the Wadi al-Kharrar support quotes Piccirillo (1999, a cite-only copyrighted work) word for word ("known as Sapsas or Sapsaphas ('the place of Willows') … which identifies it with Ainon"; and his translation "Sapsas near the Jordan"). That breaks the verbatim-quotation rule in `docs/LICENSES.md`. Paraphrase both. (2) "The sixth-century Madaba mosaic map": no cited source gives the century. (3) "with a higher aggregate score than the Nablus-area Salim proposal below": the proposal below is 'Ainun/Khirbet Einun, which OpenBible scores 96, above this candidate's 66; Salim alone scores 17. Reword. (4) Summary: "were also in Judea, baptizing nearby". John 3:22 puts Jesus in Judea; it doesn't put Aenon there or say "nearby". Drop "also" and "nearby". The summary's Madaba-map clause needs `bib:piccirillo-ainon-sapsaphas` in the summary's sources. (5) Unmapped 'Ainun: ISBE gives Salim as "6 miles distant, with a high ridge intervening", so drop "near" and "nearby" in the label and support. ISBE doesn't call 'Ainun "the spring". "Since" turns ISBE's two separate objections into one argument; use "and adds". (6) `modernCountries` `["West Bank", "Israel", "Jordan"]` puts first a territory that holds only the unmapped, low-confidence proposal. Put the mapped candidates' countries first (`["Israel", "Jordan", "West Bank"]`), or drop "West Bank" if the PO counts only mapped candidates |
| mount-gerizim | Summary: "'neither in this mountain nor in Jerusalem' will true worship of the Father be confined" glosses John 4:21. The WEB says "neither in this mountain nor in Jerusalem will you worship the Father", and "confined" adds an interpretation (card: no theological position). Quote 4:21 and 4:23 as written |

**Notes (non-blocking):**
- `arimathea`'s history names OpenBible.info in the text. ADR-0033's rule is for summaries, so this is a style note only.
- `praetorium` lists Matthew 27:27 after the John verses in `scripture[]`. The order isn't validated.

### 9.4 Commands (on `fbd1cd2`, before my sign-off edits)

| Command | Result |
|---|---|
| `npm run validate:data` | **Pass**, 0 errors, 212 warnings. The new records' warnings are the same 5 explained "contains none of this location's names" warnings; the two Akeldama width warnings are gone |
| `npm test` | **Pass**, 323/323 |
| `npm run build:data` | **Pass**; no tracked file changed |
| `npm run check:images` | **Pass**: "Checked 1365 Commons URLs (original + 330, 500, 960, 1280px), 273 Commons size records, and 31 AI files. All image checks passed." No 429 was reported |

After my sign-off edits I re-ran `validate:data` (pass, 212 warnings) and `npm test` (323/323).

### 9.5 Sign-off

**5 records are signed off.** I set `status: "verified"`, `verifiedBy: "fact-checker"` and `lastReviewed: "2026-11-06"` on:
- `azotus`
- `lydda`
- `antipatris`
- `tiberias`
- `jacobs-well`

**The other 15 stay `draft`** with the fixes in 9.3. Thirteen of them need about one sentence each. `arimathea`, `jordan-river` and `aenon` need a few clauses each, and `aenon`'s Piccirillo quotation is a licence item.

My only data edit apart from the status fields is the missing full stop in `samaria-city-01`'s caption (a typo). — fact-checker, 2026-11-06

## 10. Re-check 2 (2026-11-06, at `e4ca8a3`; diff `1934a7c..e4ca8a3`)

The Research Lead's `e4ca8a3` touched the 14 draft records' data and `akeldama-01`'s caption. I re-checked each changed clause against the same sources. One new source: Wikidata Q1346870 (Madaba Map, "6th-century mosaic map of Palestine", P571 = 600, century precision).

### 10.1 Results

| Record | 9.3 item | Result |
|---|---|---|
| kidron-valley | Joel source | **Pass:** `bib:isbe-hinnom-valley-of` added to history 2 |
| akeldama | MC caption | **Pass:** "on the slope below Mount Zion" removed |
| valley-of-hinnom | "ended" | **Pass:** "sought to end" |
| antonia-fortress | ISBE misattribution | **Pass:** it now quotes ISBE's "has been traditionally located … (compare Ac 21:32-35)" and adds that ISBE itself argues for Herod's palace |
| praetorium | Florus | **Pass:** "bringing his own men out of it and trying, but failing, to compel them" matches ISBE's quotation |
| gaza | "of which" | **Pass:** "and the text adds" |
| zarephath | Obadiah source | **Pass:** "among the Canaanites", with ISBE's "probably meaning Phoenicia" attributed and `bib:isbe-zarephath` restored |
| samaria-city | Acts 21:8; "Hasmonean" | **Pass:** both done |
| gennesaret | distance and edge | **Pass:** "about 1.7 kilometers to the north-east" (computed 1.74 km); "on the plain" |
| plain-of-sharon | ADR-0033 | **Pass:** the database name is out of the summary |
| wilderness-of-judea | pastoral attribution | **Pass:** "the hill country's eastern slopes … invade in the spring even the desert itself"; "English Versions of the Bible" |
| mount-gerizim | John 4:21 gloss | **Pass:** John 4:21 and 4:23 are quoted exactly from the WEB. Note: John 4:23 was also added to `scripture[]`, which gives the one new validator warning (213, up from 212). I accept it: 4:20–23 is one exchange about worship on "this mountain" |
| arimathea | 5 items | (1), (2), (4), (5) **Pass.** (3) is fixed in the history (1 Samuel 1:1 cited), but **still Fix required** in the Rantis candidate: its support now says Ramathaim-zophim was the "home of the Old Testament prophet Samuel's father Elkanah", and that candidate's `sources` (`wikidata:Q7293548`, `dare:28373`, `openbible:arimathea`) don't state it. **Required:** add `scripture:1 Samuel 1:1` to `candidates[0].sources` |
| jordan-river | course; "dividing" | (2) **Pass.** (1) The Josephus quotations are exact (*War* 3.10.7), and Luke 3:3 is cited. **Still Fix required:** the summary now names a database in the text ("a separate record, Wikidata's entry for the river, gives …"). That is the ADR-0033 issue just fixed in `plain-of-sharon`. **Required:** state the course plainly ("its source lies near the Golan Heights and Sde Nehemia, it flows through the Sea of Galilee, and it empties into the Dead Sea") and keep `wikidata:Q40059` in `summary.sources` |
| aenon | 6 items | (1) **Pass:** the Piccirillo sentences are paraphrased; the short gloss "the place of Willows" (the meaning of a place name) is a fact, not a quotation of his prose. (2) **Pass:** Q1346870 is cited. (3), (4), (6) **Pass.** (5) Partly fixed: "near"/"nearby" and "since" are fixed, but **still Fix required:** "the spring 'Ainun" (unmapped `support`) and "a spring called 'Ainun" (`summary`). ISBE says only "Aenon being `Ainun in Wady Far`ah", and OpenBible lists the site as the ruin Khirbet Einun. **Required:** drop "spring" in both places (for example "proposed 'Ainun in Wady Far'ah" and "a site called 'Ainun") |

**Political history:** unchanged for the 20 records, so it still passes.

### 10.2 Commands (on `e4ca8a3` plus my status edits)

| Command | Result |
|---|---|
| `npm run validate:data` | **Pass**, 0 errors, 213 warnings. The one new warning is `mount-gerizim` John 4:23 (explained above) |
| `npm test` | **Pass**, 323/323 |
| `npm run build:data` | **Pass**; no tracked file changed |

`check:images` was not re-run, because the only media change since its last pass is a caption.

### 10.3 Sign-off

**12 more records are signed off** (`status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-11-06"`):
- `kidron-valley`, `akeldama`, `valley-of-hinnom`
- `antonia-fortress`, `praetorium`, `gaza`
- `zarephath`, `samaria-city`, `gennesaret`
- `plain-of-sharon`, `wilderness-of-judea`, `mount-gerizim`

With the 5 from section 9, that makes **17 of 20 verified**.

**3 stay `draft`**, each with one small fix (Research Lead):
- **`arimathea`:** add `scripture:1 Samuel 1:1` to the Rantis candidate's sources.
- **`jordan-river`:** take the database's name out of the summary text.
- **`aenon`:** drop "spring" from 'Ainun in the unmapped support and the summary.

— fact-checker, 2026-11-06
