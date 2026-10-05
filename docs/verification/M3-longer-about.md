# M3-16 verification — A longer "About" for the major places

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
