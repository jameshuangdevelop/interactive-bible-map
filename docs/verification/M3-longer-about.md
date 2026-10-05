# M3-16 verification — A longer "About" for the major places

## Summary

All 31 major places pass and are `verified` (`verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-05"`). No finding is left open. Each has 261–407 words of About in 3–5 paragraphs, and every paragraph has sources.

- **Half 1** (13 places, below): every place needed fixes. 14 bibliography entries were added.
- **Half 2** (18 places, at the end): every place needed fixes. 2 bibliography entries were added. The same section covers the human's new rule on introducing names (ADR-0033). That rule touched 9 half-1 places plus 2 more fixes found by the scan (Mount of Olives and Jericho).
- **Name-introduction sources** (second half-2 commit, PO ruling of 2026-10-05): every introduced person whose role no other cited source states now cites a biography page. That is 19 World History Encyclopedia pages and 1 Britannica page, cited in 27 places. One name with no such page (Metellus, at Crete) was trimmed.
- **Checks on the final data:** all 520 `scripture[]` entries in the 31 places match the WEB, and all 263 `scripture:` citations exist. Every quoted phrase matches the WEB or its cited source. All 638 `bib:` citations in the location data resolve. `npm run validate:data` reports 0 errors and 186 warnings, `npm test` passes 137/137 and `npm run test:app` passes 93/93.

## Half 1 — Jerusalem and the Gospels

Independent verification of the Research Lead's commit `556702a` ("data(locations): longer About for half 1 (Jerusalem and the Gospels)", on top of `cc1dd36`). Its PROGRESS row cites `3b0de26`; the real hash is `556702a`. Reviewed 2026-10-05. All 13 places pass after the fixes below and are `verified` again. No finding is left open.

### Scope

A node script compared the parsed JSON of every `data/locations/*.json` file at `cc1dd36` with the working copy, field by field.

- **The Research Lead's commit:** only the 13 half-1 records changed, and only in `summary`, `history`, `scripture` and `status`. Every `scripture[]` change was an addition (20 new entries; none removed or edited; existing order kept). `data/bibliography.json` gained 2 entries (`custodia-dominus-flevit`, `custodia-bethphage`), with no existing entry changed. The commit message says 4 new entries, but there were 2. Nothing else changed apart from `docs/BUDGET.md` and `docs/PROGRESS.md`.
- **`bethany` was left at `status: "verified"`** (with its old `lastReviewed`) instead of `draft`, although its text had changed. This had no effect on the outcome, since it has now been verified here.
- **After this review:** the same 13 records and fields, plus one change approved by the card's step 6: `bethany-beyond-the-jordan` `candidates[0].support` and `candidates[0].sources` (the Madaba Map clause, below). `temple-mount` gains two `scripture[]` entries (Acts 3:3, Acts 3:8). `data/bibliography.json` gains 12 more entries, all appended after `custodia-bethphage`, with no existing entry changed.

### Method

- **Shape:** a node word count of `summary.text` plus every `history[].text` gives the totals below, and paragraphs are counted the same way. The order was checked against the card: first century, then the Bible, then afterwards, then today.
- **Scripture:** all 313 `scripture[]` entries in the 13 records were compared with `data/reference/engwebp_vpl.txt`, with 0 mismatches. All 132 `scripture:` citations in the About text are in one-chapter format and exist in the WEB. A second script checked every quoted phrase against the WEB text of the paragraph's cited verses. The only phrases it did not find are quotations from non-scripture sources (Josephus, Custodia, Origen, Piccirillo, and Arabic or Latin names).
- **Sources:** I opened every source that the final text relies on for a new clause. These were Josephus (*Jewish War* 1–5, *Antiquities* 15, 18 and 20 on ccel.org), Origen's *Commentary on John* VI (New Advent), the Custodia sanctuary pages, the UNESCO pages for sites 148, 1433, 1446 and 1687 (via the Wayback Machine, since UNESCO returns 403), Livius ("Judaea"), the Wikidata entities (labels, descriptions and P625 coordinates), and the new web sources listed below. Distances were computed from record or Wikidata coordinates.
- **`bib:` resolution:** every `bib:` ID in all 89 location records resolves (95 IDs cited), and each of the 14 entries added in this half is cited.

### Results

| Place | Words | Paragraphs | Verdict | Fixes |
|---|---:|---:|---|---|
| jerusalem | 350 | 4 | Pass after fixes | Valleys, rulers and third wall re-sourced to Josephus and Livius. Scripture support added for the trial, resurrection, Temple, early church and arrest. "Gentile churches" changed to Macedonia and Achaia. Luke 21:20 reworded neutrally. Siloam claim sourced to BAS. Old City claim sourced to UNESCO. |
| temple-mount | 303 | 4 | Pass after fixes | Josephus timeline attributed correctly. "Early 60s AD" replaced with Josephus's "in the time of Albinus". 1.2 km corrected to 1.1 km. Antonia garrison sourced. "Teaching in its courts" cut. Acts 3 healing sourced (2 new entries). "Arrested" changed to "seized". "Well over a hundred" changed to "more than a hundred". Unsourced "sacrificial worship" clause cut. Dome and Western Wall claims sourced. |
| golgotha | 326 | 4 | Pass after fixes | Site-presupposing "outside the walls" clause cut. "Synoptics" changed to Mark and Luke. "Roman … overseeing" changed to Mark's wording. Garden Tomb's origin sourced to its own site. Wall-course debate added for balance. "Today" sourced to Custodia and the Garden Tomb. |
| gethsemane | 288 | 3 | Pass after fixes | Terracing speculation and "working rather than ornamental" cut. John 18 misreading fixed (John places no prayer in the garden). Russian Orthodox claim and "no boundary established" cut. Olive-tree study corrected (1092 is 11th century; researchers say it is not settled). |
| mount-of-olives | 369 | 4 | Pass after fixes | "Terraced", "no building stood" and "Temple directly below" cut. Burial and judgment claims sourced to Custodia. Colt, "Olivet Discourse" and "after his ascension" reworded to what the verses say. AD 70 legion added from Josephus. |
| bethlehem | 300 | 4 | Pass after fixes | "No grand buildings", "ridge among terraced hills" and "economy centers on pilgrimage" cut or replaced with UNESCO wording. Herodium sourced to Josephus. Shepherds' message and Mary sourced (Luke 2:5, 2:11). Distance made consistent with UNESCO (under 10 km). |
| nazareth | 319 | 4 | Pass after fixes | "Natural bowl", "few hundred people" and "no synagogue found" cut. Setting sourced to Custodia. "Dozens of times" corrected to "about twenty". Quote fixed to the WEB. "Walked away unharmed" (Luke 4:30, not cited) cut. "So small a place" cut. "Largely Arab" replaced with Custodia's "large city". |
| capernaum | 270 | 4 | Pass after fixes | "Roman tax office" changed to "a tax office" (Galilee was Antipas's). James and John as residents cut. "Healed … from a distance" changed to what the verses say. "Unbelief" cut. Basalt synagogue's disputed date stated. 1990 Memorial sourced. |
| sea-of-galilee | 258 | 4 | Pass after fixes | Galilee-border paragraph moved before the Bible paragraph (card order). Tiberias "southwest shore" and "largest town" cut. "Cool" replaced with Josephus's "pure". |
| cana | 269 | 4 | Pass after fixes | "Hill country of Lower Galilee" (presupposed two candidates) cut. "Many archaeologists favor" (tilt), "no wedding house" and Khirbet Qana details resting only on McCollough cut. Wrong geography ("Galilee, well north of" Qana) removed. Kafr Kanna sourced to Custodia. Distance corrected from "a few km" to about 9 km. Quote fixed to the WEB. |
| jericho | 271 | 4 | Pass after fixes | "Below sea level", "palm and citrus groves" and "same springs" replaced with UNESCO's 'Ain es-Sultan wording. Good Samaritan traveller corrected. Zacchaeus's tree (Luke 19:4, not cited) cut. "Joshua's victory" changed to Hebrews' wording. Hisham's Palace re-sourced to the PEF, with the mosaic claim cut. |
| bethany | 280 | 4 | Pass after fixes | "Road from Jericho" and "standard tomb form" cut. Rulers re-sourced to Josephus, with Judea via John 11:7. Matthew 26:6 added for "Mark and Matthew". "Ascension" changed to Luke 24:50's wording. 2.7 km corrected to 2.8 km. Tomb and stairway details aligned with Custodia. |
| bethany-beyond-the-jordan | 395 | 5 | Pass after fixes | "East of the river / Antipas's territory" rewritten neutrally. Josephus and Livius sources restored. "Including Jesus" moved to Matthew 3:13. "In this area" (Matthew names no place) fixed. Tamarisk "likeliest picture" cut. Qasr al-Yahud sourced to Custodia. Madaba Map placements added (both banks). Support clause fixed (see "Madaba Map"). |

### Findings and resolutions

Each finding below was fixed in this commit. The new text is in the records.

**jerusalem**
1. "built on a cluster of ridges divided by the Kidron, Tyropoeon and Hinnom valleys" was sourced only to Rainey and Notley (unopened). Josephus (*War* 5.4.1, 5.2.3) states two hills divided by a valley, with the Kidron to the east, so the clause now says that.
2. Rulers: Josephus (*War* 2.8.1, 2.11.6) and Livius state the succession: Archelaus, a Roman province, Agrippa I (41–44), then procurators, with the prefect/procurator distinction from Livius. `bib:livius-judaea` was added.
3. Third wall "still being completed for most of this period": Josephus says Agrippa I began it and stopped at the foundations, and that it was completed later. The clause was reworded to match.
4. The Bible paragraph claimed the trial, resurrection appearances, Temple teaching, the first church, Paul's repeated visits and his arrest, but cited only Matthew 21:1 and John 19:20 for the Gospel claims. I added Luke 23:7, Acts 1:4, Mark 11:11, Acts 6:7, 8:1, 9:26, 15:4 and 28:17, all of which are in the record or in the WEB. "Teaching" was changed to "at the Temple" (Mark 11:11).
5. "a collection … from Gentile churches": Romans 15:26 names Macedonia and Achaia, so the text now does too.
6. "an event the Gospels describe Jesus foretelling" linked Luke 21:20 to AD 70 as fulfilment, which is interpretive. It now reports only what Luke says. "*New* Jerusalem" now has the WEB's capital N.
7. "Old City still sits over much of this ancient city, within later walls" was sourced only to Wikidata. It now uses UNESCO site 148's wording (walled Old City and its monuments). "Pool of Siloam, uncovered just south of the Temple Mount": Reich and Shukron (*IEJ*) could not be opened, so the clause is now sourced to the Biblical Archaeology Society's article (2004 find, south of the Temple Mount at the southern end of the City of David). The new date and location match the verified `pool-of-siloam` record.

**temple-mount**
1. "the priests finished … the surrounding cloisters and courts in about eight years" misattributed the cloisters. *Antiquities* 15.11.5–6 says Herod built the cloisters and outer enclosures in 8 years, and the priests built the temple itself in 1 year 6 months.
2. "only finished in the early 60s AD": *Antiquities* 20.9 places the completion under the procurator Albinus but gives no year. The text now says "in the time of the governor Albinus". "Employing over eighteen thousand workers" over decades was reworded: Josephus says more than 18,000 were left without work when it was finished.
3. Six furlongs is about 1.1 km, not 1.2 km. "Roman garrison" and "northwest corner" are now sourced (*War* 5.5.8: west and north cloisters; "there always lay in this tower a Roman legion").
4. "teaching in its courts" had no supporting verse in the citations, so it was cut. "Peter and John healing a man at a gate called Beautiful" was supported only by Acts 3:2, so I added Acts 3:3 and 3:8 to `scripture[]` with WEB text. "Paul later arrested there" was changed to "seized" (Acts 21:27: "laid hands on him").
5. "well over a hundred times in the New Testament": the WEB has "temple" 114 times in the NT, so this became "more than a hundred". The superseded text's "across the Gospels and Acts" would have been wrong (89).
6. "ending the sacrificial worship it had hosted" was unsourced and cut. "Under Titus" is now sourced to Josephus.
7. "both built centuries after the Herodian Temple": only the Dome of the Rock's date (7th century) is sourced (UNESCO 148), so the Al-Aqsa date was dropped. "One of Judaism's holiest sites of prayer" (Wikidata description only) was softened to "a place of Jewish prayer" (Western Wall Heritage Foundation).

**golgotha**
1. "on ground that for most of this period lay outside Jerusalem's walls" presupposed the Holy Sepulchre's history for the place in general and was sourced only to Taylor. It was cut from the summary.
2. "the Synoptic Gospels record … a Roman centurion overseeing the execution, and two others condemned to death": only Mark and Luke were cited. Mark 15:39 says the centurion "stood by opposite him", and Luke says "criminals". The text now quotes them.
3. The Garden Tomb's "skull-shaped rock formation … a nineteenth-century observation, not an ancient description" was sourced to Taylor and Wikidata, neither of which says it. It is now sourced to the Garden Tomb's own page (mid-19th-century scholars and the escarpment).
4. For balance, the Holy Sepulchre paragraph now notes that the course of the wall in Jesus' time is still debated. The candidate's `support` already says so, and Taylor's extract shows it.
5. The "Today" paragraph was sourced only to Wikidata. It is now sourced to Custodia (Calvary and the Tomb in one church) and the Garden Tomb (owned and run since 1894 by a UK charity).

**gethsemane**
1. "the plot was likely terraced like its neighbors" is speculation that ISBE's "Agriculture" does not state, so it was cut. "a working olive grove rather than an ornamental garden" was reduced to "an olive grove" (Custodia).
2. "John … places the same night's prayer in 'a garden'": John 18:1 records no prayer. The text now says what John 18:1 and 18:3 report.
3. "two Christian traditions … including … a Russian Orthodox garden" and "no first-century boundary … archaeologically established" rested only on Murphy-O'Connor (unopened). Both were cut, and replaced with "several churches mark places" (Custodia).
4. The olive trees: "all began growing in the twelfth century" is wrong, since one date is 1092 (11th century). "share identical DNA, meaning today's trees descend from one parent planted long after the Gospel events rather than standing witnesses to them" overstates the study. The researchers said the results do not settle the question, because olive trees regrow from roots (ABC News/Reuters, 20 October 2012). Bernabei (ScienceDirect, 403) was replaced with that report.

**mount-of-olives**
1. "terraced slopes", "No temple, synagogue or other major building stood on the ridge" and "summit directly overlooking the Temple precinct" were unsourced and cut. The olive-tree origin of the name and the burial use are now sourced to Custodia.
2. "travelers coming up from Jericho", "fetch a colt", "the discourse later called the Olivet Discourse", "to Gethsemane, for his last prayer" and "after his ascension" each went beyond the cited verses. Each was reworded to the verses, and Mark 11:1 and Luke 19:37 were added.
3. "imagery later linked to … a final judgment" is now sourced to Custodia (Day of Judgment, resurrection of the righteous, burials). Absalom is sourced to Custodia, since 2 Samuel 15:30 does not name him.

**bethlehem**
1. "on a ridge among terraced hills", "no grand public buildings, just the houses of rural Judean villagers and shepherds" and "a visible reminder of Herodian building" rested on unopened books or were editorial. They were replaced with UNESCO's "fertile limestone hill country" and Josephus on Herodium (Herod's fortress and palace, his burial place; *War* 1.21.10, 1.33.9). Herodium is 5.4 km SE of Bethlehem (Wikidata coordinates).
2. "about 8 km": UNESCO gives 10 km and the coordinates give 8.5 km straight-line, so the text now says "less than 10 km".
3. "economy centers on Christian pilgrimage" was unsourced. It is now UNESCO's "pilgrim destination" for about 1,700 years. "among the oldest churches still in daily use" was upgraded to UNESCO's "oldest Christian church in daily use".
4. Shepherds "told of the birth" now cites Luke 2:11, and Mary's presence cites Luke 2:5.

**nazareth**
1. "set in a natural bowl", "perhaps only a few hundred people" and "no public building or synagogue of its own" rested only on Dark (unopened) or nothing, so they were cut. Custodia supports a small agricultural village on the southern edge of the hills above the Jezreel Valley, and Sepphoris rebuilt by Antipas early in the 1st century. Sepphoris is 5.9 km NNW (coordinates).
2. "'Jesus of Nazareth' … dozens of times": the WEB has 22 uses of "of Nazareth" or "Nazarene" in the Gospels and Acts, so the text now says "about twenty". Mark 1:24 and Mark 16:6 were added for "the Nazarene".
3. The quote "to throw him off" was not in the WEB, which reads "that they might throw him off the cliff". "though he walked away unharmed" depends on Luke 4:30, which was not cited, so it was cut. "so small a place" was cut.
4. "draws millions of visitors" is now Custodia's "millions of … pilgrims". "Largely Arab city" (Wikidata description only) became "a large city" (Custodia).

**capernaum**
1. "a Roman tax office": Mark 2:14 says only "tax office", and Capernaum was in Antipas's territory. "Roman" was cut.
2. "hometown of … James and John" was not stated (Mark 1:29 says only "with James and John"), so it was cut. "Matthew (Levi)" became "Levi", as in Mark 2:14.
3. "healed a Roman centurion's servant and a royal official's son from a distance" was not in the cited verses. It now reads "both … asked him for help" (Matthew 8:5, John 4:46–47). "on Capernaum's unbelief" was cut.
4. "an earlier, more modest basalt structure that may be the synagogue of the Gospels' own time": Custodia says its date is disputed and that one excavator (Corbo) held it was 1st-century. The text now says so.

**sea-of-galilee**
1. Tiberias "on the southwest shore" and "remains its largest town" were unsourced and cut. Josephus says only "at the lake".
2. The Galilee-border paragraph (verified earlier, unchanged) was third, after the Bible paragraph. It was moved second, to follow the card's order. There is no "afterwards" paragraph. For a lake this is acceptable, and it is noted here.

**cana**
1. "cultivated hill country of Lower Galilee" presupposed the two Lower Galilee candidates over Qana, so it was cut. Galilee and Antipas are sourced to John 2:1, Luke 3:1 and Josephus.
2. "many recent archaeologists favor this site" favoured one candidate, rested only on the excavator's chapter (unopened), and is the language of the untouched candidate `support`. It was cut from the About text. "Hellenistic through Roman periods" and "inscriptions invoking Jesus" also rested only on McCollough and were cut. The verified clause on the Jewish village and pilgrim caves was kept.
3. "though John sets the episode within Galilee, well north of that village" was wrong: Qana (33.21° N) is north of Galilee. The text now says only that John calls the village "Cana of Galilee". "especially among Lebanese Christian communities" was unsourced in the About text and was cut. The identification is sourced to OpenBible, Wikidata and Pleiades.
4. "Neither candidate preserves a building identifiable as the Gospel's wedding house" was unsourced and cut. "A thriving Arab town … several churches" was replaced with Custodia's Franciscan church (1881) and Nathanael chapel (1885). "Overlooking the Beit Netofa valley a few kilometers to the northwest" was replaced with "about 9 km north-northwest" (coordinates: 9.2 km).
5. The quote "the beginning of his signs" did not match the WEB ("This beginning of his signs"), so it is now paraphrased.

**jericho**
1. "hot, low desert oasis more than 200 meters below sea level" was unsourced. It now reads "an oasis watered by the perennial spring of 'Ain es-Sultan" (UNESCO 1687).
2. "Luke's parable of the Good Samaritan traveling 'from Jerusalem to Jericho'": in Luke 10:30 it is the robbed man who travels, so this was corrected. "climbed a tree" (Luke 19:4, not cited) was cut. "crediting Joshua's victory there to faith": Hebrews 11:30 does not name Joshua, so this became "credits this to faith".
3. "the Umayyad dynasty built a lavish winter palace … one of the largest ancient mosaic floors ever found" rested on Murphy-O'Connor and Wikidata. It was rewritten from the PEF project page (Khirbat al-Mafjar north of Jericho, with baths, aqueducts, bridges and a mill of the Umayyad/early Islamic period). The mosaic claim was cut.
4. "market town known for its palm and citrus groves, watered by the same springs" was unsourced. It now uses UNESCO's wording ('Ain es-Sultan still a water source; the tell a national archaeological park NW of the modern town).

**bethany**
1. "on the road from Jericho" was unsourced and cut. "Turning toward the drier wilderness" is now sourced to Custodia. The rulers are now sourced to Josephus, with Bethany in Judea via John 11:7. Fifteen stadia is about 2.8 km, not 2.7 km.
2. "the standard rock-cut family tomb form of the period" was unsourced and cut. "Mark and Matthew record a banquet" cited only Mark, so Matthew 26:6 was added and "banquet" became "meal". "Luke recording his ascension from near there": Luke 24:50 records only the blessing at Bethany, so the text now says that.

**bethany-beyond-the-jordan**
1. "lay in the Jordan Valley east of the river, in territory ruled by Herod Antipas" favoured the east-bank candidate, since the record has a west-bank candidate. The text now says the river divided Perea (Antipas, then Agrippa I) from Judea, and that procurators governed both from AD 44. The Josephus (*War* 2.6.3, 2.9.6) and Livius sources that the superseded paragraph had are restored.
2. "where John the Baptist was baptizing, including Jesus": John 1:28 does not mention Jesus. The baptism of Jesus now cites Matthew 3:13. "Matthew describes John the Baptist in this area": Matthew names no place, so the text now says so explicitly, and Matthew 3:6 was added.
3. "No fixed settlement is attested … tamarisk, willow and reed beds" was unsourced speculation and was cut.
4. "This record's two candidate sites … favor neither" made the sites the subject of "favor", so the grammar was fixed. Al-Maghtas's remains and their 4th–15th-century dating are now in UNESCO's wording. "Qasr al-Yahud … less archaeological excavation" was unsourced and cut. Qasr al-Yahud is now sourced to Custodia (Franciscan pilgrimage since at least 1641; land owned by eight churches; reopened to pilgrims in 2011).

### Sources that could not be opened, and what was done

| Source | Tried | Outcome |
|---|---|---|
| `taylor-golgotha-reconsideration` | doi.org → Cambridge Core | **Partly opened:** the extract and reference notes are public. They state the disused quarry west of the first-century city, separate crucifixion and burial sites, and the Garden Tomb dated to the Iron Age (note 1, citing Barkay). These support the clauses that cite it. |
| `hutton-bethany-beyond-jordan` | No open copy found | Cited only for clauses verified in earlier, untouched text (Bethabara variant, manuscripts, Batanea). No new clause rests on it. |
| `mccollough-khirbet-qana` | No open copy found | Every new clause that rested only on it was cut. The earlier verified clause on Khirbet Qana's village and caves keeps it. |
| `murphy-oconnor-holy-land-guide` | archive.org (lending copy; search-inside 403), Google Books API (quota 0) | New clauses were re-sourced (Custodia, UNESCO, PEF) or cut. Earlier verified clauses keep it (Constantine at Bethlehem, Jericho's shift south, Peter's house, Lazarium). |
| `rainey-notley-sacred-bridge` | Google Books API (quota 0) | New clauses were re-sourced to Josephus, Livius, UNESCO and Custodia, or cut. It is kept only for Jerusalem's earlier verified clauses. |
| `ritmeyer-temple-mount-quest` | No open copy (archive.org has other Ritmeyer books only) | New Temple clauses now rest on Josephus, UNESCO and the WEB. It is kept for the earlier verified clauses (20–19 BC start; Western Wall as remains). |
| `bdag-greek-lexicon` | No open copy | The etymology was verified earlier. "Oil press" is also stated by the ABC/Reuters report, now cited beside it. |
| `bernabei-gethsemane-olive-trees` | ScienceDirect (403), OpenAlex and Semantic Scholar (no abstract) | Removed from Gethsemane and replaced by the ABC/Reuters report. The entry stays in the bibliography. |
| `reich-shukron-siloam-pool` | *IEJ*, not open | The new Jerusalem clause is now also sourced to the Biblical Archaeology Society's article. |

New bibliography entries (all opened 2026-10-05): `custodia-holy-sepulchre`, `custodia-cana`, `custodia-jericho`, `custodia-jordan-baptism-site`, `garden-tomb-about`, `abc-gethsemane-olive-trees-2012`, `piccirillo-ainon-sapsaphas`, `unesco-old-city-jerusalem`, `unesco-ancient-jericho`, `western-wall-heritage-foundation`, `bas-siloam-pool` and `pef-khirbat-al-mafjar`. The Research Lead's `custodia-dominus-flevit` and `custodia-bethphage` were opened and confirmed.

### Madaba Map decision

The `bethany-beyond-the-jordan` `candidates[0].support` (Al-Maghtas) said the excavated remains "match the site's depiction on the sixth-century Madaba mosaic map". Two openable sources show the map's baptism label is on the other bank:

- Michele Piccirillo, "Ainon Sapsaphas and Bethabara" (*The Madaba Map Centenary*, 1999; Studium Biblicum Franciscanum web edition) says the map writes "Bethabara", with a church, on the **west** bank. It says the east-bank site at Wadi al-Kharrar is shown as "Ainon, where now is Sapsaphas".
- Custodia's "River Jordan – Site of the Baptism of Jesus" says the baptism has been remembered at the west-bank site (Qasr al-Yahud) since the sixth century, "judging from the map of Madaba".

So the east-bank site does appear on the map, but under the Ainon/Sapsaphas label, not the baptism label. The Research Lead's flag is right that the clause misleads. The fix is clear-cut and sourced: the clause now says the remains "lie at Wadi al-Kharrar, which the sixth-century Madaba mosaic map labels 'Ainon, where now is Sapsaphas' (the map's 'Bethabara', the sanctuary of the baptism, is on the west bank)". `bib:piccirillo-ainon-sapsaphas` was added to that candidate's `sources`. The About text gives both labels, one per bank.

### For the PO

1. **Untouched candidate text, outside this card:** the half-1 About text no longer relies on the following claims, but the candidate `support` fields still do. Each rests only on unopened sources or none, so I recommend a follow-up.
   - `bethany-beyond-the-jordan` Qasr al-Yahud: "two fifth-century Byzantine churches" and "less archaeological investigation".
   - `bethany-beyond-the-jordan` Al-Maghtas: "the most archaeologically supported candidate" and "Jordanian east bank". ADR-0028 allows countries in modern names, not in support text.
   - `cana` Khirbet Qana: "many recent archaeologists favor this site".
   - `cana` Qana: "especially in Lebanese Christian communities".
2. **Card wording:** the card says "Open every source you cite". Several earlier verified clauses still cite books no one on the team has opened (Rainey and Notley, Murphy-O'Connor, Ritmeyer, Hutton, McCollough, BDAG). The PO may want a rule for these, for example re-sourcing them in a later data pass.
3. **PROGRESS row hash:** a commit cannot contain its own hash. The M3-16 row therefore cites the Research Lead's commit (`556702a`), which this commit verifies. The session log names this commit by its title.

## Half 2 — Paul's letters, the capitals and Revelation's churches

This is an independent check of the Research Lead's commit `154871f` ("data(locations): longer About for half 2 …"), which sits on top of the half-1 verification `01b6b9f`. It was reviewed on 2026-10-05. All 18 places pass after the fixes below. So do the 9 half-1 places that the commit changed to introduce names. All 27 are `verified` again, and no finding is left open.

### Scope

A node script compared the parsed JSON of every `data/locations/*.json` file at `01b6b9f` with the working copy, field by field.

- **The Research Lead's commit:** it changed only the 27 expected records: the 18 half-2 places plus `jerusalem`, `temple-mount`, `golgotha`, `mount-of-olives`, `bethlehem`, `nazareth`, `capernaum`, `sea-of-galilee` and `jericho`. Within them it changed only `summary`, `history`, `scripture` and `status`. It also changed one sentence in `golgotha` `candidates[0].support` ("under Constantine" became "under the Roman emperor Constantine"). Every `scripture[]` change was an addition (45 entries), and none was removed or reordered. The commit changed nothing in `data/bibliography.json`, and nothing else apart from `docs/BUDGET.md` and `docs/PROGRESS.md`. `verifiedBy` and `lastReviewed` were left at their old values while `status` was `draft`, which the schema allows.
- **After this review:** the same 27 records and fields are changed, plus `status`, `verifiedBy` and `lastReviewed`. `scripture[]` gains 13 more entries (below), all with WEB text and all appended. `data/bibliography.json` gains 2 entries, `unesco-historic-centre-rome` and `odysseus-philippi-history`. They are appended, and no existing entry changed. No candidate, name, coordinate or image field was touched.

### Method

- **Shape:** a node script added up the words of `summary.text` and every `history[].text`, and counted the paragraphs. I checked the order against the card: the first century, then the Bible, then afterwards, then today.
- **Sources:** I opened every source the 18 texts cite and checked each clause against it. These were the 14 ISBE articles; Josephus (*Jewish War* 1 and its preface, *Antiquities* 15–16, on ccel.org); Strabo 12.8, 13.4 and 14.1, Tacitus (*Annals* 2.47, 4.55–56, 14.27, 15.38–44), Cassius Dio 69 and Platner & Ashby (Forum, Circus Maximus, Via Appia), all on LacusCurtius; and Ramsay's *Letters to the Seven Churches* (the archive.org text). I also opened the UNESCO pages for sites 20, 91, 1018 and 1457 and the Greek Ministry of Culture's Philippi (Description and History) and Thessaloniki Agora pages, all through the Wayback Machine. The other sources were the ÖAW Celsus Library news item (Wayback), World History Encyclopedia (Corinth, Pergamon, Sardis), the Sardis Expedition's three essays, Pamukkale University's Laodikeia page (in Turkish; I translated what the text relies on), Livius (Damascus, Nabataeans), Zondervan's "Who Were the Galatians?", the July 2026 Biblical Archaeology Society interview with Barış Yener, and the Wikidata entities for the claims they are cited for.
- **Scripture:** I compared every `scripture[]` entry in the 31 places with `data/reference/engwebp_vpl.txt` (520 entries, 0 mismatches). All 263 `scripture:` citations exist in the WEB. A script checked every double-quoted phrase against the WEB text of the paragraph's cited verses. I traced each phrase it didn't find to its cited non-scripture source (Josephus, Tacitus, Strabo, Ramsay, ISBE, Pamukkale, or names and labels).
- **Neutrality and names:** I read every paragraph against spec §8, the card's neutrality rules, the three PO rulings and ADR-0033. A script also listed every capitalized name in all 31 About texts with the words before its first use.

### Results

| Place | Words | Paragraphs | Verdict | Fixes |
|---|---:|---:|---|---|
| rome | 391 | 4 | Pass after fixes | "A few years after Paul's custody ended" (no source dates the custody) cut. "Today" rewritten: the standing senate house is not "of Paul's day", and "outline" and "remain paved" weren't sourced. It now uses UNESCO site 91 (new entry) and Platner & Ashby. |
| corinth | 310 | 4 | Pass after fixes | ISBE name-drop removed (ADR-0033). The "second missionary journey" label (not in a cited source) cut. Acts 18:16 added for "driven from his court". "To address the young church's troubles" changed to "to the church there". "A few years after Paul left" (about 15) changed to "Some years after". "Along the same route" cut. |
| galatia | 271 | 4 | Pass after fixes | "Without a clear scholarly consensus" (not in Zondervan) changed to "has been debated intensely". "He and Barnabas" (not in the cited verses) changed to Zondervan's "visited on his first missionary journey". 1 Peter's unsourced "late first century" date and the "sign of how far the church had spread" comment cut. The four regions are now named from 1 Peter 1:1. |
| ephesus | 320 | 4 | Pass after fixes | "Channel across the plain" changed to UNESCO's "sea channel", with UNESCO added for the Seven Wonders. "Three years" now cites Acts 20:31 (added) and is attributed to Acts. "Third missionary journey" cut. "1 and 2 Timothy … address Ephesus directly" changed to "mention Ephesus". The pilgrimage sentence follows UNESCO (the Artemis pilgrimage was eclipsed by Christian pilgrimage). "Best-preserved" (not in a source) cut. |
| philippi | 407 | 4 | Pass after fixes | Philip II "refounded" the city, not "founded" it. "Caesar's heirs" changed to Octavian (introduced as the later emperor Augustus) and Mark Antony. "Reinforced with veteran soldiers" changed to settlers from Italy (ISBE: Antony's dispossessed partisans). "Linking the empire's eastern provinces", "fertile", "Finding no synagogue" and "on the site of earlier Roman buildings" cut. "First place Paul preached in Europe" moved out of the Acts attribution and sourced to the Ministry's History page (new entry). "Largely abandoned" changed to "the lower city was gradually abandoned". |
| colossae | 299 | 4 | Pass after fixes | Strabo groups Colossae near Laodicea and Apameia, not Hierapolis. Colossians 4:16 says "the letter from Laodicea", not a letter Paul "had sent there". "Not established" (no source) cut. "Continued to decline" replaced with the interview's own view that civic life continued well into the imperial centuries, before the move to Chonai. ISBE added for "never visited". The "today" paragraph matches the interview. |
| thessalonica | 298 | 4 | Pass after fixes | The free-city reward was for backing the winners in the war decided at Philippi, not "the civil war that followed" it. "Let it keep" changed to "gave it". The inscription's names are "borne by three of Paul's Macedonian converts" (ISBE), not his "travelling companions". |
| crete | 319 | 4 | Pass after fixes | "In the Roman period" (not in ISBE) cut. "Farther west" (not in Acts 27:12) cut. Acts 27:15 added for "driven". "Today" rewritten: Gortyna's "Roman-period remains", the Titus–Gortyna link, "Minoan" and "early twentieth century" weren't stated. Titus now follows ISBE: tradition made him first bishop and patron saint. |
| athens | 285 | 4 | Pass after fixes | ISBE credits Phidias with a bronze statue, not the gold-and-ivory Athena, so Phidias was cut. "Foundations laid centuries earlier" (not in Dio) cut. "Placed his own statue" changed to "whose own statue stood inside it" (Dio). The Agora excavation (not in ISBE) was replaced by ISBE's Agora just north of the Acropolis, with Acts 17:17 cited. |
| antioch-syria | 304 | 4 | Pass after fixes | "Around 300 BC" corrected to 301 BC. "A successor of Alexander the Great", "a mountain rising behind it" and "near the river's mouth" (not in ISBE) cut. *Antiquities* added for the colonnades on both sides. "To investigate" cut, and Acts 11:25 added for Tarsus. The Holy Spirit's setting apart is now attributed to Acts. John Chrysostom (ISBE calls him the church's most distinguished "son", not a leader) cut. |
| caesarea-maritima | 273 | 4 | Pass after fixes | ISBE added for the Augustus naming, the governor's residence and the final voyage. "Among the first Gentile believers" replaced with Acts 10:45 and 10:48, and Acts 24:27 added for the two years (all three new entries). "In AD 66" (not in a cited source) cut. "Thousands" corrected to ISBE's 2,500. The "today" harbour, fortress and walls claims weren't sourced, so the paragraph now names only ISBE's cathedral and aqueduct ruins. |
| damascus | 364 | 4 | Pass after fixes | "Oldest continuously inhabited … in the world" changed to UNESCO's "one of the oldest cities in the Middle East". Acts 9:5, 9:9, 9:17, 9:18, 9:20 and 9:23 added (scripture entries) and Acts 13:9 cited, for the voice, the three days' blindness, the restored sight, the synagogues and the plot. The mosque "on the site of that temple" is now left to UNESCO's wording in the paragraph before. |
| smyrna | 286 | 4 | Pass after fixes | Ruling 1 applied (below). "About three centuries old" was wrong (c. 290 BC to the 90s AD) and is cut. Polycarp is now "the Christian leader" (Ramsay), without the unsourced "bishop" and "second century". "Later Christian writers linked …" and "repeatedly … each time rebuilt" (not in Ramsay) are replaced with Ramsay's one restoration after a disastrous earthquake. |
| pergamum | 327 | 4 | Pass after fixes | "Steep, cone-shaped" and "fertile" changed to Ramsay's "huge, rocky hill" and "broad plain". The Byzantine "middle-sized town" claim (in no source) cut. The Red Basilica and Trajan temple follow World History Encyclopedia and Ramsay, and the Asclepieion follows UNESCO. "Unusually well-preserved" (not in UNESCO) cut. The prose now uses the title spelling, "Pergamum", throughout (it had mixed "Pergamon" and "Pergamum"). |
| thyatira | 270 | 4 | Pass after fixes | "Around 300 BC" and "colony of Macedonian soldiers … to guard" changed to Ramsay's account (Seleucus I made it a city and a garrison to hold the road). "Costlier" cut. The coinage dates corrected to the late second and third centuries, and Ramsay's coin type of the hero Tyrimnos added (keeping the text above 250 words). "So little … has been excavated" (not in a source) cut. "Pergamon" changed to "Pergamum". |
| sardis | 341 | 4 | Pass after fixes | The Polybius quote was cut: World History Encyclopedia says the line "is actually ironic in context". "Still recovering" by Paul's day (unsourced) cut. The dangling modifier fixed. The synagogue was a later conversion of a bath hall (Sardis Expedition), not built in the late second or third century; the "largest known" claim is now sourced to "About Sardis". |
| philadelphia-lydia | 315 | 4 | Pass after fixes | "One of the two main roads west into Phrygia" changed to Ramsay's "gateway to the plateau". "Extinct volcanoes" (Strabo describes ash and black hills only) cut. The St. John's church piers (in no cited source) cut. |
| laodicea | 376 | 4 | Pass after fixes | "Within sight of Hierapolis's white mineral cliffs" and "up the valley" cut, keeping Ramsay's distances. Strabo treats the underground Lycus as a sign of earthquakes, not their cause. "Unlike its neighboring cities" was wrongly attributed to Tacitus; it now follows Pamukkale University's page. Colossians 4:16 fixed as at Colossae. "20,000 to 25,000" stadium seats (not on the cited page) and "plain" façades cut. |

### The 9 half-1 introductions

The commit changed only these words in the half-1 records, and no sources. Each new description is stated by a source that the paragraph cites:

| Place | Change | Source that states it |
|---|---|---|
| jerusalem, temple-mount, mount-of-olives, nazareth, capernaum, sea-of-galilee, jericho | "the Jewish historian Josephus" | `bib:josephus-jewish-war`, cited in each paragraph. The preface says the author is "Joseph, the son of Matthias, by birth a Hebrew, a priest also", writing this history. |
| jerusalem, temple-mount | "the general Titus" | `bib:josephus-jewish-war`. The preface describes Titus marching on Judea with his forces, and "Titus Caesar, who destroyed it". |
| golgotha (history) | "the Roman emperor Constantine" | `bib:custodia-holy-sepulchre`: "at the request of Emperor Constantine" |
| golgotha (`candidates[0].support`) | "the Roman emperor Constantine" | `wikidata:Q187702` (cited): founded by Q8413, Constantine the Great, "Roman emperor from 306 to 337" |
| bethlehem | "the Roman emperor Constantine", "the Byzantine emperor Justinian" | **Fixed.** The paragraph cited only UNESCO site 1433, which gives "(Justinian)" and no emperors, and Murphy-O'Connor, which is unopened. I added `wikidata:Q8413` (Constantine, "Roman emperor") and `wikidata:Q41866` (Justinian I, "Eastern Roman Emperor") to its sources. Custodia's Nativity page says "the Byzantine emperor Justinian", but I didn't cite it because it dates the first church to 333, against UNESCO's 339 in the text. |

### Findings and resolutions

Each finding below is fixed in this commit, and the new text is in the records. The table above lists every fix. These are the findings that needed a judgement:

1. **Ruling 1 (Smyrna and Thyatira).** The Research Lead's Smyrna text stopped Revelation 2:9 at "they are not". The text now reads: "and the text describes local opponents in harsh terms, as 'those who say they are Jews, and they are not, but are a synagogue of Satan.'" That is the WEB's wording, attributed to the text, with no commentary. Thyatira already reports Revelation 2:20 accurately ("a woman the text calls 'Jezebel,' who called herself a prophetess and taught believers to commit sexual immorality and eat food sacrificed to idols"), so it was left unchanged. Both now follow the same rule: what the passage says, attributed to the passage, and nothing more.
2. **Galatia's North and South Galatian views.** The text describes both views in parallel, at the same length, and states "This record favors neither view." I removed "without a clear scholarly consensus", because Zondervan says only that the question "has been debated intensely". I also changed the South view's description to Zondervan's wording.
3. **Colossae's "today" paragraph.** Every claim is stated in the July 2026 interview: Colossae is "one of the most under-excavated major sites in the New Testament world", and earlier work was "short, targeted inspections". The interview also covers the 2021 survey, the 2025 first season led by Barış Yener of Pamukkale University, the northern necropolis as a Roman-period cemetery with rock-cut tombs, and "still in its very early stages". The same interview contradicted the history paragraph's "continued to decline", so that clause now gives the interview's view.
4. **Clauses attributed to the wrong source:** Laodicea's "unlike its neighboring cities" (Pamukkale's page, not Tacitus), Athens' Phidias (ISBE ties him to a different statue), and Sardis' Polybius quote (ironic in context, according to World History Encyclopedia).
5. **Pergamum's spelling.** Both "Pergamum" and "Pergamon" are in `names.ancient`, but the record's own text mixed them. The prose now uses the title, "Pergamum", in `pergamum` and `thyatira`. UNESCO's site name is not in the prose.
6. **Own words for non-open sources** (`docs/LICENSES.md`, the verbatim-quotation ruling). Several clauses followed all-rights-reserved or custom-terms pages almost word for word, so they were reworded with their facts unchanged. Colossae's "one of the most under-excavated major sites of the New Testament world" and its later-history sentence followed the Biblical Archaeology Society interview. Philippi's abandonment sentence followed the Greek Ministry of Culture page. Sardis' synagogue clause followed the Sardis Expedition. Ephesus' pilgrimage sentence followed UNESCO's statement. Damascus' "one of the oldest cities in the Middle East" also followed UNESCO, and Galatia's "debated intensely" and "visited on his first missionary journey" followed Zondervan. Every remaining quotation in the 18 texts is from the WEB or from a public-domain text: Josephus (Whiston), Tacitus, Strabo, the ISBE and Ramsay.

### ADR-0033 scan (all 31 places)

The scan applies rulings 2 and 3. Names a general reader knows need no introduction, such as Julius Caesar, Alexander the Great and Mark Antony. Biblical figures need none either, and neither do Herod Agrippa I and Archelaus, who appear as rulers with their role given. Candidate notes that name datasets are out of scope. Findings and fixes:

- **Half 2:** I removed the "International Standard Bible Encyclopedia" name-drop (Corinth), Phidias (Athens), Polybius (Sardis) and John Chrysostom (Antioch). John Chrysostom's introduction, "fourth-century preacher", wasn't in ISBE. Octavian is now introduced as the later emperor Augustus. All other people, writers and works are introduced: Strabo, Tacitus, Josephus, Herodotus, Xenophon, Homer, Pompey, Mummius, Cassander, Seleucus I, Antiochus II and III, Attalus II, Alyattes, Croesus, Cyrus, Polycarp, Tyrimnos, Celsus Polemaeanus, the emperors, Nicephorus Phokas and Barış Yener.
- **Half 1:** the scan found two more terms that a general reader wouldn't know. "All three Synoptic Gospels" (Mount of Olives) became "Matthew, Mark and Luke", the three cited Gospels. "The Hasmonean and Herodian dynasties" (Jericho) became "the Hasmoneans, a line of Jewish kings, and later the family of Herod the Great". That wording is from `wikidata:Q2460244` ("Hasmonean royal winter palaces") and *Jewish War* 1, both cited. The scan found no other unintroduced name.
- **Databases and websites:** none is named in any About text. I read "a UNESCO World Heritage Site" as a designation, not as naming a source ("per UNESCO"). It appears in 8 places (Rome, Ephesus, Philippi, Pergamum, Jerusalem, Bethlehem, Jericho and Bethany beyond the Jordan); see "For the PO".

### Sources that could not be opened, and what was done

| Source | Tried | Outcome |
|---|---|---|
| UNESCO site pages (direct) | whc.unesco.org (bot challenge) | **Opened through the Wayback Machine** (2025–2026 snapshots). Site 1433's 2026 snapshot returned 403, so I used its 2025-12 snapshot. |
| `oeaw-celsus-library` | oeaw.ac.at (403) | **Opened through the Wayback Machine.** It states the 2nd-century date, the senator Tiberius Iulius Celsus Polemaeanus and the building over his burial chamber. |
| `odysseus-philippi`, `odysseus-thessaloniki-forum` | odysseus.culture.gr | **Opened through the Wayback Machine.** Philippi's History tab, which the text relies on, is now its own entry, `odysseus-philippi-history`. |
| `pau-laodikeia-kazisi` | laodikeia.pau.edu.tr | **Opened; Turkish.** In translation, the page says the city was founded by "Seleucid king Antiochus II Theos in the name of his wife queen Laodike, in the mid-3rd century BC (261–253 BC)". It says Laodicea "rebuilt itself" after the AD 60 earthquake, while Hierapolis and other cities were rebuilt with the Roman Empire's help. It dates the stadium "by its inscription to AD 79", dedicated to Titus. It says the gates and main streets were built "with Doric façades" under Domitian, AD 84–85. Hadrian visited in AD 135 and "supported building activities". The South Bath was dedicated to Hadrian and Sabina. The excavation areas include a bouleuterion, the North and West theatres, agoras, temples and nymphaea. |
| Ramsay, *Letters to the Seven Churches* | archive.org OCR text | **Opened.** I checked each claim by searching the OCR text. "Bishop" and a date for Polycarp are not in it, so those words were cut. |

### For the PO

1. **Philadelphia and Revelation 3:9.** The letter to Philadelphia also uses "synagogue of Satan" (3:9). The About quotes 3:8 and 3:12 and does not mention 3:9. Nothing is cut short in mid-quote, so ruling 1 as written doesn't require a change. The PO may still want the two letters treated alike.
2. **"Turkey" in the prose.** Nine About texts say "Turkey" or "Turkish", while ADR-0028's country field and the panel will say "Türkiye". The two should probably match. Changing the prose is a wording decision for the PO or the human.
3. **"A UNESCO World Heritage Site"** appears in 8 About texts as a designation. Please confirm that ADR-0033's "per UNESCO" example targets naming a source, not this status.
4. **"This record" in reader-facing text.** Galatia ("This record favors neither view"), Pergamum ("This record takes no side"), Damascus ("this record places Damascus …"), Cana and Bethany beyond the Jordan speak about "this record". The wording is neutral, but readers of the panel may not know what "record" means. "This map" might read better.
5. **Thin or dated "today" paragraphs.** Antioch, Galatia, Philadelphia and Thyatira have one-sentence "today" paragraphs. Caesarea's and Crete's rest on ISBE (1915) and Wikidata, because no modern authority page is in the bibliography. A later data pass could add one (for example, the Israel Nature and Parks Authority for Caesarea's harbour, which I cut as unsourced).
6. **Corinth's refoundation:** ISBE says 46 BC and World History Encyclopedia says 44 BC. The text keeps 44 BC and cites World History Encyclopedia.
7. **Supporting citations outside `scripture[]`:** Galatia cites Acts 13:14 and 14:6 and Damascus cites Acts 13:9 as supporting context, without listing them in the place's "In the Bible" passages, as half 1 did for its context verses. The 13 verses added in this review are in `scripture[]`, which accounts for the validator's 13 new warnings (173 to 186). Like the earlier ones, they are "WEB verse text contains none of this location's configured names".

### Second commit: sources for the name introductions

A cross-vendor review of M3-22 found that introductions such as "the Roman historian Tacitus" were cited only to the author's own work, which does not state the author's role. ADR-0017 needs a source that does. The PO ruled on 2026-10-05, for M3-16 too: keep the introductions and source them. This second commit ("data(locations): cite sources for the name introductions") applies the ruling to all 31 major places. It covers the 9 half-1 introductions, including Golgotha's `candidates[0].support`, and the half-2 text. It changes only `sources` (and one trimmed name, below) and `data/bibliography.json`. It replaces the "Source that states it" column in the table of the 9 half-1 introductions above for Josephus, Titus, Constantine and Justinian.

I opened each page and confirmed that it states the role used in the text. Each entry below shows the page's own words:

| `bib:` ID | Role stated on the page | Cited in |
|---|---|---|
| `worldhistory-josephus` | "a 1st-century CE Jewish historian" | jerusalem, temple-mount, mount-of-olives, nazareth, capernaum, sea-of-galilee, jericho, antioch-syria, caesarea-maritima (P1) |
| `worldhistory-strabo` | author of the *Geography*, of "aristocratic Greek heritage" | colossae, thessalonica, smyrna, thyatira, philadelphia-lydia, laodicea (P1) |
| `worldhistory-tacitus` | "a Roman historian" | rome P3, colossae P3, pergamum P1, sardis P1, philadelphia-lydia P3, laodicea P1 |
| `worldhistory-herodotus`, `worldhistory-xenophon` | "a Greek historian"; Xenophon of Athens, author of the *Anabasis* | colossae P1 |
| `britannica-origen` | "the most important theologian and biblical scholar of the early Greek church", c. 185–254 (Britannica blocks scripts, so it was opened through the Wayback Machine) | bethany-beyond-the-jordan P3 |
| `worldhistory-augustus` | "the first … Roman emperor" | caesarea-maritima P1, pergamum P1 |
| `worldhistory-tiberius` | "the second Roman emperor" | sea-of-galilee P1, smyrna P1, sardis P1, philadelphia-lydia P3 |
| `worldhistory-claudius`, `worldhistory-nero` | "the fourth Roman emperor"; "the fifth Roman emperor" | rome P2; rome P3, corinth P3 |
| `worldhistory-vespasian` | Roman emperor and military commander sent to the Judean revolt, succeeded by his sons Titus and Domitian | galatia P3, caesarea-maritima P3 |
| `worldhistory-titus` | the "Roman commander" in the war in Judea, later emperor | jerusalem P3, temple-mount P3 |
| `worldhistory-hadrian` | "emperor of Rome" | athens P3 |
| `worldhistory-constantine` | "Roman emperor from 306 to 337" | golgotha P3 and `candidates[0]`, bethlehem P3, crete P3 |
| `worldhistory-justinian` | "emperor of the Byzantine Empire" | bethlehem P3 (replaces the Wikidata person IDs added in the first commit) |
| `worldhistory-pompey` | "a military leader" of the late Roman Republic | rome P1, damascus P1 |
| `worldhistory-julius-caesar` | led his legions in the conquest of Gaul; dictator | corinth P1, philippi P1 |
| `worldhistory-antigonus`, `worldhistory-lysimachus` | "one of the successor kings to Alexander the Great"; "assumed the title of king" | smyrna P1 |
| `worldhistory-nikephoros-phokas` | a "commander who conquered Crete", later Byzantine emperor | crete P3 |

The existing `worldhistory-sardis` was also cited in Sardis P2. It states that the Persian king Cyrus took Sardis in 547/546 BC and that Antiochus III besieged it. Several roles were already stated by a source cited in the same paragraph, so they needed nothing new:

- Mummius, Cassander, Caligula, Alyattes, Seleucus I, Antiochus II, Attalus II and Eumenes, Albinus, Polycarp, Tyrimnos and Celsus Polemaeanus.
- Octavian and Augustus at Philippi.
- Trajan and Hadrian at Pergamum, and the emperors at Laodicea.
- Homer, whom Strabo calls "the poet".
- Biblical figures.

**Trimmed:** Crete's "the Roman general Metellus". World History Encyclopedia has no page for him, Livius timed out, and Britannica's page could not be opened. The clause now reads "Rome annexed the island in 67 BC", which ISBE states.

**Shared with M3-22:** six of these IDs are copied exactly from the entries the M3-22 branch adds (title, authors, year, URL and access date), so the two bibliographies are identical when they merge: `worldhistory-josephus`, `worldhistory-strabo`, `worldhistory-tacitus`, `worldhistory-nero`, `worldhistory-pompey` and `worldhistory-xenophon`. The other 14 are new to this branch.

After this commit, `npm run validate:data` still reports 0 errors and 186 warnings, `npm test` passes 137/137 and `npm run test:app` passes 93/93. Every `bib:` ID resolves, and all 31 places are still 261–407 words.
