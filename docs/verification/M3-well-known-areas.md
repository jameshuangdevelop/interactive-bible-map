# M3-13 verification — Well-known New Testament areas

Independent verification of the Research Lead's commit `21ef125` ("data(locations): add well-known New Testament areas") against the card (`docs/tasks/M3-13-well-known-areas.md`), ADR-0017, ADR-0026, ADR-0027 and ADR-0013, and the PO's ruling on parents that cross province lines (2026-09-30). The baseline is `1805178`. Reviewed 2026-09-30.

**Result:** all 89 records are `verified`. The Research Lead added 17 new records. All of them needed changes, and the first verification commit (`9a31087`) fixed 16 with sources I opened. **Elam failed** the card's condition for adding it (good information for about AD 50). The PO removed it in the follow-up commit; see "Follow-up: the PO's decisions". The most common problems were:

- quotations that were not the WEB, or ISBE's words attributed to Acts;
- clauses that no cited source states;
- two statements contradicted by the sources (Mysia joining Asia in 190 BC, and AD 50 falling inside a peace that ISBE says began under Nero);
- a Livius sentence quoted word for word, although Livius is cite-only.

Following the PO's ruling, four parents changed: Antioch in Pisidia and Iconium go back to Galatia, Tarsus goes back to Syria, and Troas goes back to Asia. Cilicia moves to the Roman Empire because it was split between Syria and a client king. One label point moved: Pisidia's, which was 15 km from Antioch's pin. The PO has decided the seven items raised for the PO and the human; the decisions are recorded under each item.

## Method

1. **Semantic diff.** A node script compared every location file at `1805178` with `21ef125` and with the working tree, field by field. It also checked whether history entries were appended or edited in place.
2. **Sources opened.** I read these sources for every clause:
   - **ISBE (1915):** the 17 new articles, plus "Asia", "Aretas" and "Egypt".
   - **Livius.org:** "Nabataeans", "Cilicia", "Pamphylia", "Parthia", "Mesopotamia", "Elam" and "Cappadocia".
   - **Loeb translations on LacusCurtius:**
     - Tacitus, *Annals* 2.42, 2.56, 2.59, 6.44, 12.14 and 12.55, and *Histories* 1.11;
     - Cassius Dio 51.17, 53.12, 59.8 and 60.8;
     - Suetonius, *Nero* 18;
     - Strabo 15.3 and 16.1.
   - **Josephus:** *Antiquities* 20 (Whiston, CCEL).
3. **Coordinates.** I fetched every cited Pleiades place (`reprPoint` and its locations, with their origin) and every cited Wikidata item (`P625`, `P36`, `P571`, `P576`, `P1584`). I followed each Wikidata `P1584` link to its Pleiades entry. Then I measured every label point against all 90 records' points.
4. **Quotations.** A script checked every quoted string in the new and edited records against the WEB snapshot (`data/reference/engwebp_vpl.txt`) and the fetched source texts.
5. **Spellings.** I fetched 11 verses from BibleGateway in all six versions and recorded the names only (read 2026-09-30).
6. **Checks.** I ran `npm run validate:data`, `npm test` and `npm run build:data` before and after my changes.

## Semantic diff

**The Research Lead's commit against `1805178`: one deviation.** Eight existing records changed:

- `parentId` on 7 records;
- `names.alternate` on judea;
- appended history notes on antioch-pisidia, iconium and judea;
- the status fields.

The commit body says the history changes were "appended notes only". In fact, **perga's and tarsus's existing, verified history notes were edited in place.** The first verification commit restores both to their verified text. Neither needed the edit: Perga is still in Galatia through Pamphylia, and Tarsus is back under Syria.

**Final state against `1805178`:**

| Record | Changes |
|---|---|
| derbe, lystra | `parentId` (galatia → lycaonia) |
| perga | `parentId` (galatia → pamphylia) |
| antioch-pisidia, iconium | one appended history note each; parent unchanged (galatia) |
| troas | one appended history note; parent unchanged (asia) |
| judea | `names.alternate` ("Judah", "Juda") and one appended history note |
| tarsus | parent and history unchanged |
| all of the above | `lastReviewed` 2026-09-30 |

Every record is `verified` by `fact-checker`. The new records are the 16 that remain after Elam's removal.

## Parents across province lines (the PO's ruling)

The rule: when a region crosses province lines, a city inside it keeps its province as parent, and a sourced history note names the region. A region may be a parent only if the sources place all of it in one province in about AD 50.

| Region | One province in about AD 50? | Evidence | Region's parent |
|---|---|---|---|
| Phrygia | **No:** split between Asia and Galatia | ISBE "Phrygia": "divided into two parts … Galatian Phrygia, and … Asian Phrygia" | roman-empire (unchanged) |
| Cilicia | **No:** split between Syria and a client king | Livius: "parts were given to vassal kings, and the remainder became an appendix to the province Syria". Dio 59.8.2: Caligula gave Antiochus "the coast region of Cilicia". Dio 60.8.1: Claudius restored Commagene to him. Tacitus, *Annals* 12.55 (AD 52): the Cietae's coast lay in Antiochus's kingdom. | **roman-empire** (was syria) |
| Pontus | **No:** divided three ways | ISBE "Pontus": Bithynia, Galatia and Polemon's kingdom | roman-empire (unchanged) |
| Lycaonia | **The Roman part, yes.** The whole region, no: the eastern part, including Laranda, was under Antiochus of Commagene from AD 37. | ISBE "Lycaonia": Acts' Lycaonia of "Lystra and Derbe and the surrounding district" is "only the western portion", "a 'region' … of the province Galatia". The record says it shows that Roman part. | galatia (unchanged) |
| Pisidia | **Yes** | ISBE "Pisidia": it passed to Galatia in 25 BC and stayed "part of the province Galatia till 74 AD" | galatia (unchanged) |
| Mysia | **Yes** | ISBE "Mysia": it "formed an important part of the Roman province of Asia". ISBE "Asia" lists Mysia among the province's lands (with only "a part of Phrygia"). | asia (unchanged) |
| Pamphylia | **Yes, in one province, though which one is disputed** | Perga's M3-11 note (Dio 60.17.3 against Tacitus, *Histories* 2.9, Livius and Pleiades). Livius: Octavian made it "part of Galatia". | galatia (unchanged) |

**Final parent of every record whose parent the Research Lead changed:**

| Record | Before (`1805178`) | Research Lead (`21ef125`) | Final | Basis |
|---|---|---|---|---|
| antioch-pisidia | galatia | phrygia | **galatia** | Phrygia crosses provinces. ISBE puts Antioch in "Galatian Phrygia". New note sourced to ISBE "Pisidia" and "Phrygia" and Acts 13:14. |
| iconium | galatia | phrygia | **galatia** | ISBE "Iconium": "one of the chief cities in the southern part of the Roman province Galatia", whichever of the Phrygia or Lycaonia views holds. The note keeps both views. |
| lystra | galatia | lycaonia | lycaonia | ISBE "Lycaonia" (Roman Lycaonia, a region of Galatia; Acts 14:6) |
| derbe | galatia | lycaonia | lycaonia | Same |
| perga | galatia | pamphylia | pamphylia | Pleiades 639034; Acts 13:13 "Perga in Pamphylia" |
| tarsus | syria | cilicia | **syria** | Cilicia crosses provinces. Tarsus's verified note already says it "lay in the plain of Cilicia" attached to Syria. |
| troas | asia | mysia | **asia** | ISBE "Mysia" names Troas among Mysia's cities but says Mysia included the Troad only "according to some authors". ISBE "Asia" lists Mysia and the Troad separately. Acts 16:8 has Paul "passing by Mysia" to reach Troas. New note sourced to all three. |

Unchanged cities in the new regions: Colossae, Laodicea and Hierapolis are in Asian Phrygia and stay under asia. Pergamum stays under asia; see item 3 below. Every chain ends at an empire; the validator confirms it.

## Verdicts: new records

Every record below was **needs-change** at `21ef125`. All except elam are a **pass** after the fixes in `9a31087`. Elam was removed in the follow-up commit.

| Record | What was wrong | Fix and sources |
|---|---|---|
| egypt | The Acts 2:9–10 quotation added an "and" that is not in the WEB, and cited only Acts 2:10. "Peter's Pentecost list of hearers": in Acts 2:9–11 the list is the crowd's own words. The candidate's cross-check, `pleiades:727070`, is **Alexandria**, not the province. The support text said the point is "in the Nile valley", but it lies in the desert east of the Nile. "This special … status was still in force" at AD 50 had no source. The OT note said Matthew "explicitly links" Hosea; Matthew 2:15 names only "the prophet". | Quotation corrected; Acts 2:9 added. Cross-check changed to `pleiades:766` ("Aegyptus (Roman imperial province)"; its point is Alexandria, 414 km away). Support text describes the point correctly. The AD 50 clause now rests on Tacitus, *Histories* 1.11: Egypt "has been managed from the time of the deified Augustus by Roman knights". Dio 51.17.1 and Tacitus, *Annals* 2.59 checked word for word. Alexandria as capital: Wikidata `P36`. OT note limited to what the two verses say. |
| arabia | The support text and summary said reference works identify Galatians 1:17's Arabia with the Nabataean kingdom, citing ISBE. **ISBE says the opposite:** the NT uses "Arabia" for "the Syrian desert or the peninsula of Sinai". The summary called it an "Arab client kingdom", while the history, from ISBE, called the Nabataeans "not generally counted among the Arabian tribes". Livius calls them Arabs, and neither claim is needed. The Galatians 4:25 note inferred that Sinai lay "well to the south of Nabataea's core around Petra and Damascus". Damascus was held only briefly, per Livius, and Sinai's location is itself disputed. "Commentators differ" had no source. | Rewritten. The record shows the Nabataean kingdom ("Arabia Nabataea", Livius). From Livius: its capital was Petra; it stayed an independent ally of Rome from 63 BC until Trajan annexed it in AD 106; its kings included Aretas IV (9 BC – AD 40) and Malichus II (AD 40 – 70/71). The uncertain case now gives ISBE's view of NT usage, ISBE "Aretas" (the Aretas of 2 Corinthians 11:32 was an Arabian king), and Galatians 4:25, without taking a side. The ethnic claim is removed. `pleiades:697725` (Petra, 6 km) added as the cross-check. |
| cappadocia | "Formerly an independent client kingdom" cited no `bib:` source. "As a client king": Tacitus says only that Archelaus held the kingdom for fifty years. "Peter addresses his first letter" takes a position on authorship. | ISBE "Cappadocia" and Tacitus, *Annals* 2.42 added to the summary. Tacitus 2.42 and 2.56 checked word for word; ISBE gives AD 17. Wording now follows 1 Peter 1:1 ("living as foreigners in the Dispersion in …"), here and on pontus and bithynia. |
| pontus | "Defeated … under Pompey in 66 BC": ISBE says Pompey was *appointed* in 66 BC. "That did not happen until Nero's reign, after 63 AD" had no source. The support text cross-checked against `pleiades:981546`, whose point is a Barrington grid point in the Black Sea. | Wording fixed. Suetonius, *Nero* 18: Nero added "the realm of Pontus" to the provinces "when it was given up by Polemon". Cross-check changed to `pleiades:857287` ("Pontus", Barrington map label, 52 km away). |
| bithynia | "Nicomedes IV": ISBE numbers the last king Nicomedes III, so the name is dropped. The candidate label was the Latin "Bithynia et Pontus" (ADR-0026). "Luke records" takes a position on authorship. | Label is now "Bithynia and Pontus". "Acts records". 74 BC supported by ISBE and `pleiades:981512` (added to the summary). |
| cilicia | The summary said "Barnabas and Silas both travel through 'the regions of Syria and Cilicia' in Acts and Galatians". Barnabas is in neither passage, and that phrase is only in Galatians 1:21. The quotation "a Jew from Tarsus in Cilicia" did not cite Acts 21:39. "Governed from Syria" was said of all of Cilicia. The parent is wrong under the PO's ruling. The label said "Roman province". | Parent is now roman-empire. Summary and history rewritten, with the split sourced to Livius, Dio 59.8.2 and 60.8.1, and Tacitus, *Annals* 12.55. ISBE's Tracheia and plain distinction added. Acts 21:39 cited. The label is now "Cilicia (label point)". |
| pamphylia | The support text applied ISBE's "scarcely more than 20 miles long" to the whole region; ISBE says it only of "the earliest time". "Landing at Perga" is not in Acts 13:13. Its AD 70 date for Pisidia's transfer clashes with ISBE "Pisidia" (AD 74). | Support text and summary rewritten. Both ISBE dates are now given. |
| phrygia | "Paul 'traversed the country'" is ISBE's wording, presented as a quotation from Acts. | WEB quotations from Acts 16:6 and 18:23. One sentence added to the history on how cities in Phrygia get their parent. |
| lycaonia | "'the speech of Lycaonia'" is ISBE's and the ASV's wording; the WEB has "the language of Lycaonia". The cross-check was `pleiades:982262`, "Lycaonia (province)", which is the Republican province and has no coordinates. | Quotation corrected. Cross-check is now `pleiades:1001911` ("Lykaonia", Barrington map 102), the entry Wikidata's `P1584` points to. |
| pisidia | The label point (Wikidata) was 15 km from Antioch's pin, at Antioch's latitude, where ISBE puts Pisidia's northern border. "Antioch in Pisidia" is not the WEB ("Antioch of Pisidia"). The note placed Antioch and Iconium under Phrygia. | Label moved to `pleiades:639060` (Pisidia, Barrington map label, 31.014588, 37.470801), in the Pisidian highlands and 58 km from the nearest pin. Quotation and parent sentence corrected. |
| mysia | "Since the Romans first organized Asia as a province in 190 BC": ISBE "Mysia" does give 190 BC, but ISBE "Asia" (and M3-11's asia record) date the province to 129 BC. "Lay entirely within the province … including the city of Troas" is not stated. | History rests on ISBE "Mysia" and "Asia" (formed 129 BC) without the 190 BC date. The summary gives ISBE's caveats: the boundaries were "always vague", and the Troad was included only "according to some authors". |
| illyricum | Romans 15:19 was misquoted ("all the way around to Illyricum"). ISBE was misquoted twice ("later came to be known as Dalmatia" for "later it came to be known"; "most probably" for "most probable"). "He later reports sending Titus": 2 Timothy 4:10 says only that Titus went, and "he" takes a position on authorship. | Quotations corrected. The history now gives ISBE "Dalmatia"'s three senses of the name (the tribe's land, the southern part of the province, the whole province) and its "most probable" reading, so the uncertainty shows. AD 10 from ISBE. |
| libya | "Named individually in Acts, including Simon of Cyrene": Simon is in the Gospels, not Acts. "Numerous enough to have their own synagogue" overstates Acts 6:9 and ISBE ("have their name associated with a synagogue"). "The early Ptolemies": ISBE says Ptolemy I. The summary attributed "here it names specifically the fertile district around … Cyrene" to ISBE "Libya", which doesn't say it. | History rewritten with Matthew 27:32, Acts 6:9 and Acts 13:1 cited. Summary sourced to ISBE "Cyrene" (the last Ptolemy willed it to Rome) and Dio 53.12 ("Crete and the Cyrenaic portion of Libya"). |
| mesopotamia | A Livius sentence was quoted word for word; Livius is cite-only (LICENSES.md). "First applied by … Arrian" follows Livius but is contradicted by Strabo (16.1) and by Acts 2:9 and 7:2, which use the word before Arrian wrote, so "first" is dropped. "Trajan … first invaded Parthia": ISBE doesn't say "first", and Crassus invaded in 53 BC. "Associated local kingdoms" had no source. The OT note said Haran lay in "the same broad region Stephen later calls Mesopotamia", which Acts 7:2 doesn't say, and "Ur of the Chaldeans" is not the WEB. | Paraphrased. ISBE "Parthians" now also supports Parthian rule in the first century (Jewish settlements in Mesopotamia; a massacre under Artabanus III, AD 16–42). OT note quotes Genesis 11:31 and Acts 7:2 exactly. `pleiades:874602` (Mesopotamia, Barrington map label, 514 km away) added as the cross-check. |
| parthian-empire | "This project's about AD 50 date falls within that decades-long peace, a few years before Nero's reign" contradicts itself: ISBE says the Armenian contest was settled *under Nero* (AD 54 onward). "Fought repeatedly over Armenia, from Crassus's defeat … onward" misreads ISBE, which describes Crassus's war as an invasion of Parthia and says that after Augustus "peace was not seriously disturbed … until the reign of Trajan". The history credited Tiridates with founding the Arsacid dynasty, but ISBE credits Arsaces I, and Livius says neither. "This project takes" [Parthians] "to mean Jews or proselytes": that is ISBE's inference. | Rewritten from ISBE and Livius. The date differences between the two (Mithridates I, 165–132 against 174–137 BC; the end in AD 224 against 226) are now stated. |
| media | "It remained part of the Parthian Empire through the first century AD" had no source. "Its chief city at Ecbatana": ISBE lists three chief cities. | Now sourced to Strabo 16.1.19 ("the Parthians rule over the Medes and the Babylonians") and Tacitus, *Annals* 12.14, AD 49 ("Vonones, then viceroy of Media, was called to the throne"). That meets the card's condition for about AD 50. |
| **elam** | **Fails the card's condition.** "It remained under Parthian rule through the first century AD" has no source: Livius "Elam" covers only "the Hellenistic age". The one first-century source I found points the other way. Strabo 16.1.18 says the Elymaean king "refuses to be subject to the king of the Parthians like the other tribes". Strabo treats Susians and Elymaeans as separate peoples, and Tacitus, *Annals* 6.44 (AD 36), counts the Elymaeans among nations that could be raised in a Parthian succession war. So the parent, `parthian-empire`, and the summary's "had long been part of the Parthian Empire" are unsupported for about AD 50. The label point (Susa, `pleiades:912936`) and the names are fine. | **Removed** in the follow-up commit, on the PO's decision (item 1). |

**Names (ADR-0026).** All 66 cells of the spelling table match BibleGateway:

- Matthew 2:6: Judah ×5, and "Juda" in the KJV.
- Acts 14:6: "Lycaonian" in the NIV and CSB, "Lycaonia" in the other four.
- Acts 2:9–10, Galatians 1:17, Acts 16:7, Romans 15:19, 2 Timothy 4:10, Acts 14:24, Acts 15:41 and Acts 20:2: unanimous.

"Parthian Empire" and "Media" are standard reference names for areas the verse names only through a people ("Parthians", "Medes"). Each demonym is kept as an alternate name, which is correct. No new record has `names.modern`. That is right, because "Egypt" and "Libya" are now country names with political meaning.

**Confidence.** Every candidate is `high`. That fits: each area's identity is undisputed, and the point only positions a label.

## Names: "Judah" and "Greece"

- **judea: pass.** "Judah" and "Juda" are on `names.alternate`, and the validator reads them: Luke 1:39's warning is gone. The Research Lead's note had two problems. It said Matthew 2:6 quotes "Micah's prophecy", but Matthew names only "the prophet". It also called Luke 1:39's city "traditionally located in the Judean hill country", although the verse itself says "into the hill country". The note now quotes both verses exactly.
- **achaia: pass, unchanged.** "Greece" has been an alternate name since M3-11, sourced to ISBE: "In Ac 20:2 'Greece' means Achaia".

## Label points

Every point is on land and inside its area as the sources describe it. None comes from OSM or cites Wikipedia. The Barrington polygons in Pleiades are 5° grid squares, so I judged "inside the area" from the sources' descriptions of the boundaries, not from the polygons.

| Record | Point (lon, lat) | Source | Cross-check | Nearest record | Result |
|---|---|---|---|---|---|
| egypt | 32.1, 28.0 | `wikidata:Q202311` | `pleiades:766` has no location; its point is Alexandria (414 km) | arabia label 415 km | **Pass.** In the desert east of the Nile. A point in the Nile valley would read better (item 5). |
| arabia | 35.441944, 30.328611 | `wikidata:Q11029653` (at Petra, `P36`) | `pleiades:697725` Petra, **6 km** | judea label 153 km | Pass |
| cappadocia | 34.839167, 38.670556 | `wikidata:Q33490` | `pleiades:628949`, 88 km | galatia label 174 km | Pass |
| pontus | 37.83, 40.68 | `wikidata:Q621672` | **Changed** to `pleiades:857287` (map label), 52 km | cappadocia 340 km | Pass |
| bithynia | 32.164919, 40.812102 | `pleiades:981512` (the province) | `wikidata:Q373189`, 104 km | galatia 185 km | Pass |
| cilicia | 34.18127, 37.038152 | `pleiades:981514` (computed; no location of its own) | Wikidata has no coordinate | Tarsus pin 65 km | Pass |
| pamphylia | 30.94796, 36.921938 | `pleiades:639034` | none | **Perga pin 9 km** | Pass. The region is small; M3-11's label-offset decision applies (item 5). |
| phrygia | 30.473011, 38.78304 | `pleiades:609502` | Wikidata has no coordinate | Antioch pin 82 km | Pass |
| lycaonia | 33.0, 38.0 | `wikidata:Q622598` (a round value) | `pleiades:1001911`, grid-level point, 71 km | Iconium pin 47 km | Pass. In the Lycaonian plain north of Lystra and Derbe, the Roman part per ISBE, away from Laranda in the non-Roman east. |
| pisidia | **31.014588, 37.470801** | **Changed** to `pleiades:639060` (map label) | `wikidata:Q621805`, 92 km | Perga pin 58 km | Wikidata's point was 15 km from Antioch's pin, at Pisidia's northern border. |
| mysia | 27.834001, 39.599688 | `pleiades:550759` | `wikidata:Q622319`, 72 km | Thyatira pin 75 km | Pass |
| illyricum | 17.329379, 43.804412 | `wikidata:Q753824` | `pleiades:981522` (Dalmatia, at Salona), 74 km | Malta's low-confidence Mljet candidate 119 km | Pass |
| libya | 20.871743, 32.499653 | `pleiades:373777` (computed) | `wikidata:Q165198`, 75 km | crete-cyrene label 472 km | Pass. About 19 km inland from the coast between Tocra and Ptolemais. |
| mesopotamia | 43.5, 33.7 | `wikidata:Q11767` | `pleiades:874602` (map label), 514 km, in the far north of the region | parthian-empire label 121 km | Pass. The region is broad; Pleiades describes it as covering most of Iraq, which includes the point. |
| parthian-empire | 44.580833, 33.093611 | `wikidata:Q1986139` (Ctesiphon) | `pleiades:893976` Ctesiphon, 0.13 km | mesopotamia 121 km | Pass. Strabo 16.1.16: the Parthian kings wintered at Ctesiphon. |
| media | 48.919331, 35.048241 | `pleiades:903080` | none | parthian-empire label 455 km | Pass |

## The uncertain cases

- **Pontus's three-way split.** Sourced and neutral after the fixes. ISBE gives the split: most of Pontus was joined to Bithynia, the southwest to Galatia, and the east was Polemon's kingdom until AD 63. Suetonius (*Nero* 18) records that Nero added it to the provinces. Pleiades 981545 adds that Pontus Galaticus was one of the subdivisions after Nero's reorganization. **Pass.**
- **Pamphylia.** The M3-11 Perga note, which the PO accepted, is carried over unchanged in substance. The region is under galatia. Perga's own verified note is restored word for word. **Pass.**
- **Arabia's extent (Galatians 4:25).** Now set out without taking a side: ISBE's view of NT usage, the extent of the Nabataean kingdom (Livius), and the Aretas link (ISBE, Livius). The record does not say where Paul went. **Pass.**
- **Illyricum and Dalmatia as one record.** Supported. ISBE "Illyricum" says the province "later … came to be known as Dalmatia", and ISBE "Dalmatia" judges that sense "most probable" in 2 Timothy 4:10. Pleiades agrees: its "Illyricum" (481865) ends in AD 10, and its "Dalmatia" (981522) is the province under Trajan. Dio 53.12 lists "the Dalmatian … districts" among the Senate's provinces in 27 BC. **Pass.**
- **Media: included.** Strabo 16.1.19 and Tacitus, *Annals* 12.14 (AD 49) give the information for about AD 50 that the card requires. Josephus, *Antiquities* 20.74 (Vologeses gave Media to Pacorus) agrees but is not needed. **Pass.**
- **Elam: removed.** See the verdict above and item 1. **Fail; the PO removed the record.**

## Results

- `npm run validate:data`: **0 errors, 106 warnings**, the same as at `1805178` and `21ef125`. The Research Lead's net-zero explanation is correct: libya's Matthew 27:32 adds a warning and judea's Luke 1:39 loses one. My changes add and remove no warnings.
- `npm test`: **75/75 pass.**
- `npm run build:data`: **90 places** (89 after Elam's removal; see the follow-up).

## Licensing

- **ISBE (1915):** public domain; M3-11's LICENSES and ATTRIBUTION rows already cover it.
- **Loeb translations on LacusCurtius:** public domain; each page says so, and M3-11's rows cover them. This includes Suetonius's *Nero*, now cited for Pontus.
- **Livius.org:** cite-only, so it is paraphrased and never quoted. Mesopotamia quoted a Livius sentence word for word; it is now paraphrased. Arabia's and the Parthian Empire's wording followed Livius closely and is now reworded.
- **Bibliography:** no new source families, so LICENSES.md and ATTRIBUTION.md need no new rows. `livius-cappadocia` is removed because no record cites it.
- **Cross-checks newly cited:** `pleiades:766`, `pleiades:697725`, `pleiades:857287`, `pleiades:1001911`, `pleiades:639060` and `pleiades:874602`. Removed where they supported nothing: `pleiades:727070` (Alexandria) from egypt, `pleiades:981546` from pontus, and `pleiades:982262` from lycaonia.

## Items for the PO and the human

1. **Elam.** No cited source gives Elam's status in about AD 50, and Strabo 16.1.18 says the Elymaean king refused to be subject to the Parthian king. Either remove `elam` (Acts 2:9's "Elamites" would then find no record), or send it back to the Research Lead. The Research Lead would need a first-century source for Susiana or Elymais, for example a scholarly reference on Elymais. It would also need to decide whether Elam's parent can be the Parthian Empire, or whether Elam is a semi-independent kingdom that fits no empire chain. *Decided: remove the record (follow-up commit).*
2. **Troas.** It stays under asia, because the Troad was counted as part of Mysia only by "some authors" (ISBE). If the PO reads ISBE's listing of Troas among Mysia's cities as enough, the parent can be `mysia`. *Decided: Troas stays under Asia.*
3. **Pergamum** was not reparented by the Research Lead. ISBE "Asia" calls Pergamum "the old capital of Mysia", but ISBE "Mysia" does not list it among Mysia's cities. It stays under asia, so the PO's rule of keeping the province when region membership is uncertain covers it. *Decided: Pergamum stays under Asia.*
4. **Arabia (and Polemon's Pontus) under the Roman Empire.** Livius calls the Nabataeans an "independent ally". The chain "Arabia · Roman Empire" follows the card and the schema, which let `province` hold client kingdoms, but it can suggest more Roman control than there was. The record's text says the kingdom was not annexed until AD 106. Should the panel word client kingdoms differently? *Decided: arabia stays `type: "province"` under the Roman Empire, as ADR-0027 allows. The panel (M3-04) will describe it as "Client kingdom allied with Rome", as it does for Italy. The summary now says plainly, with sources, that the kingdom was allied with Rome but not a province in about AD 50. A BACKLOG item covers modeling client kingdoms with M4's timeline.*
5. **Label positions.** Pamphylia's label is 9 km from Perga's pin; M3-11's label-offset decision applies. Egypt's label is in the desert east of the Nile. If the PO wants it in the Nile valley, that needs a hand-placed, sourced point. *Decided: Egypt's label point stays.*
6. **Research Lead process.** Three recurring slips are worth adding to the Research Lead's instructions:
   - ISBE's own wording presented as a quotation from Acts (Phrygia, Lycaonia);
   - verified history notes edited in place although the commit body said "appended only" (Perga, Tarsus);
   - Livius quoted word for word.
7. **Egypt's type.** Tacitus calls Egypt "the province", so `province` stands. Jackson's Loeb note to *Annals* 2.59 says it was "never a province in the true sense … but a private imperial domain". The summary's "unusual arrangement" covers this; no change is proposed.

## Follow-up: the PO's decisions

The PO decided the items above on 2026-09-30. The follow-up commit makes these changes:

- **Elam is removed.** `data/locations/elam.json` is deleted, along with `bib:livius-elam`, which only that record cited. The Elamites row is also removed from `docs/research/M3-13-bible-spellings.md`, which now notes the removal. The card allowed Elam only if the sources gave good information for about AD 50, and they don't (see the verdict above). The mentions of Elam that stay are historical: the Media and Parthian Empire notes list Elam among Mithradates I's conquests, and Acts 2:9's WEB text names "Elamites". As a result, searching for "Elamites" finds no record until a first-century source is found. `BACKLOG.md` has an item for this.
- **Arabia's summary** now says plainly that in Paul's time the Nabataean kingdom "was allied with Rome but was not a Roman province: it became one only when Trajan annexed it in AD 106." Sources: Livius "Nabataeans" (an independent ally from 63 BC; made a province by Trajan in AD 106), ISBE "Arabia" (first in alliance with the Romans, later subject to them), and Wikidata `Q11029653` (dissolved in 106). `BACKLOG.md` has an item for modeling client-kingdom status with M4's timeline.
- **Troas, Pergamum and Egypt's label point** are unchanged.

**Checks after the follow-up:** `npm run validate:data` gives 0 errors and 106 warnings (unchanged). Acts 2:9 names "Elamites", so Elam never had a warning. `npm test` passes 75/75. `npm run build:data` builds 89 places. All 89 records are `verified`.

## Follow-up: PR review

The GPT-5.4 review (2026-09-30) raised one must-consider finding, one suggestion and one nit. The review commit fixes the first two. The PO has put the nit, Egypt's label point, on the backlog.

**Dead Tacitus links (must fix).** `bib:tacitus-annals` and `bib:tacitus-histories` pointed to `Tacitus/Annals/home.html` and `Tacitus/Histories/home.html` on LacusCurtius. Both now return 404. LacusCurtius keeps the contents of both works on one page, `https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Tacitus/home.html`. That page loads, is marked public domain, and links to every book page the records cite: *Annals* 2B, 2C, 12A and 12B, and *Histories* 1A, each of which returns 200. Both entries now use that URL, with `accessed` set to 2026-09-30, and the `bib:` IDs are unchanged. No other file used the old URLs.

**Other links.** I fetched every URL in `data/bibliography.json` (65 with a URL):

- Every URL this branch added or cites returns 200, except the two Tacitus URLs fixed above.
- `rainey-notley-sacred-bridge` is a printed book and has no URL.
- Seven older URLs return 403: five UNESCO pages, parks.org.il (Korazim), and BiblePlaces (Puteoli). A retry with browser headers got bot-challenge pages, so the sites are up but block scripts. No record on this branch cites them, so they are left as they are.

**Long quotations (suggestion).** I paraphrased every source quotation of more than five words in the new records and in the appended notes on Iconium, Antioch in Pisidia, Troas and Judea. The records now use the project's own words, and every clause keeps its source.

- **ISBE.** The longest were Phrygia's two-part division (40 words), Lycaonia's two parts (41) and Pontus's three-way split (46). The others were on Bithynia, Cilicia, Pisidia, Mysia, Illyricum, Libya and Iconium.
- **Loeb translations.** Tacitus on Egypt (*Histories* 1.11) and on Cappadocia (*Annals* 2.56), and Strabo on Media.

Only short terms where the wording itself matters stay in quotation marks:

- 'Asian Phrygia' and 'Galatian Phrygia';
- 'regions', ISBE's term for the divisions of Galatia;
- 'most probable', ISBE's own hedge on Dalmatia;
- 'viceroy of Media', Tacitus's title for Vonones;
- 'took Upper Mesopotamia', which is ISBE;
- 'the last city of Phrygia', Xenophon's claim as ISBE reports it.

WEB quotations are unchanged. Phrygia's note now also cites ISBE "Lycaonia", which calls Phrygia "another region of Galatia", for the clause that Galatian Phrygia was a region of that province.

To catch close paraphrase as well as quotation, I compared every text field in these records with the cited ISBE, Livius and Loeb pages, looking for runs of six or more words they share outside WEB quotations. I then reworded all the longer shared runs:

- Lycaonia (12 words), Iconium (11), Pisidia (10), Mysia (9), Media (9), Arabia and Pontus (8);
- Egypt's close rendering of Dio 51.17;
- Pisidia's, Media's and Libya's opening descriptions;
- Livius's "conquered Media, Babylonia and Elam" in Media and the Parthian Empire.

Only one run of seven or more words is left: Iconium's WEB quotation of Acts 14:6, "the cities of Lycaonia", together with the words around it.

**Re-verification.** I checked each rewritten clause against its source again:

- The meaning is unchanged, except in three places where a sharper paraphrase came out more accurate:
  - Pontus now mentions its inland valleys and plains, as ISBE does, so the inland label point fits;
  - Pisidia now reaches north *from* the Taurus range;
  - Media now covers both the western and southwestern sides of the Caspian.
- The 16 changed records are re-set to `verified`: arabia, bithynia, cappadocia, cilicia, egypt, iconium, illyricum, libya, lycaonia, media, mysia, pamphylia, parthian-empire, phrygia, pisidia and pontus.

**Checks after the review fixes:** `npm run validate:data` gives 0 errors and 106 warnings (unchanged). `npm test` passes 75/75. `npm run build:data` builds 89 places. All 89 records are `verified`.
