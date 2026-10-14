# Verification: M5-03, Jesus' well-attested journeys

**Fact-Checker** (Claude Opus 5.5, Copilot CLI) · 2026-10-13 · branch `data/m5-jesus-journeys`, checked at `9301733`

## Scope
I checked only M5-03's own changes (`git diff d736bff..9301733`). Paul's routes (M5-02) are verified separately.
- The research note `docs/research/M5-jesus-journeys.md`, with the PO's answers in its §9.
- The `jesus` route in `data/routes/routes.json`: 35 stand-alone segments, 12 with `noLineReason`.
- Three new stop entries in `data/routes/stops.json`: `ephraim`, `bethphage` and `country-of-the-gadarenes`.
- Five new entries in `data/bibliography.json`. The same diff also re-wraps the `authors` arrays of 27 M5-02 entries onto several lines. Parsing both versions shows no value changed.
- Eight entries in `ROUTE_STOP_LOCATION_DUPLICATE_ALLOWLIST` in `scripts/lib/validator.mjs`.
- Whether the PO's ADR-0038 update (`399378a`) is applied.

I read these rules first: ADR-0038 with its 2026-10-13 update, ADR-0017, ADR-0026, the brief §1.6 and §2, and `schema/README.md` → "Routes (M5)". I also read VISUAL_SPEC §2 "Routes tab": a stage without a line shows its `noLineReason` to readers.

## Summary
- **Passes:** 30 of the 35 segments, including 7 after the corrections in §11. Two stop entries, `ephraim` and `country-of-the-gadarenes`, are now `verified`. All five bibliography entries, all eight allow-list pairs, the licenses, and every one of the 106 passages pass (every `textWEB` matches the WEB exactly).
- **Item 3 decisions:** none of the 12 segments without a line gets one. No candidate site has the strongest support in its record or entry (§6). I rewrote all 12 reasons as plain, neutral text for readers.
- **Sent back to the Research Lead:** five segments (11, 12, 17, 24, 35), the unused `bethphage` stop entry (which stays `draft`), and the route's `toYear`. Details are in §12.
- **For the PO:** how "path not known" is encoded, and Bethphage's title under ADR-0026 (§13).

## 1. Sources opened, and their licenses
| Source | What I checked | License, read at the source |
|---|---|---|
| WEB, `data/reference/engwebp_vpl.txt` | All 106 passage texts, compared with my own parser rather than the project's, plus the context verses named below | Public domain (ADR-0013) |
| ISBE (1915): "Ephraim (2)", "Bethphage", "Gadara", "Gerasa; Gerasenes", "Chronology of the New Testament" | Every clause that cites them, and the bylines (Ewing ×3, Masterman, Armstrong; all match the bibliography) | Public domain (`docs/LICENSES.md`); short quotations allowed |
| Pleiades bulk CSV (`pleiades-places-latest.csv.gz`) | 687896, 726708218, 678142, 678158 | CC BY 3.0 |
| OpenBible.info `ancient.jsonl` (GitHub) | `bethphage`, `ephraim-2`, `gadara`, `gerasa`, `gergesa` | CC BY 4.0 |
| Wikidata `Special:EntityData` | Q931667, Q2193088, Q2469418, Q1490815, Q56072866, Q246590, Q2916177, Q1093166, Q36678 | CC0 |
| custodia.org, Bethphage sanctuary page | The sanctuary's location | **All rights reserved**, so cite-only. The data doesn't quote it. |
| Bible Gateway: NIV, ESV, NLT, KJV, NKJV, CSB at Matthew 21:1, Mark 11:1, Luke 19:29, Matthew 8:28, Mark 5:1, Luke 8:26 | Spellings and footnotes only; no verse text was copied | Cite-only (existing rows) |
| Catholic Encyclopedia (1910), "Chronology of the Life of Jesus Christ" (newadvent.org) | The range of dates, for my years check only; not cited in the data | Public domain (1910) |
| Wikipedia, "Chronology of Jesus" | A pointer only, never used as a source | — |

## 2. The rule, and how I applied it
ADR-0038 item 3 allows a segment whose ends are named by "the passage's context … without doubt". I counted an end as named when one of these holds:
- a cited verse names it;
- a cited verse refers back to it ("from there", "after this", "his own city") and the same Gospel names it just before, with no change of place in between.

Where another place comes in between, as with the mountain in segment 23, I required the verse that names the start to be cited. For each segment I also checked these points:
- the text shows that Jesus himself made the move;
- every Gospel that tells the same move is cited;
- no Gospel's account conflicts;
- `attestation.gospels` matches the books cited (it does for all 35);
- the `rule` text claims nothing the cited verses don't say (ADR-0017).

## 3. The segments
"Context" names the verse that names an end, where the cited verse refers back to it.

| Seg. | From → To | Gospels | Verdict | Reason |
|---|---|---|---|---|
| 01 | Nazareth → Bethany beyond the Jordan | Mt, Mk, Jn | Pass | ADR-0038 update item 4 applied exactly. Luke tells the baptism (3:21) but not a journey to it. |
| 02 | Bethany beyond the Jordan → Galilee | Mt, Mk, Lk | Pass after fix | The rule said all three name "a 40-day stay", but the cited Matthew 4:1, 4:11–12 and Luke 4:1, 4:14 don't mention forty days (Mark 1:13 does). Reworded. |
| 03 | Bethany beyond the Jordan → Cana | Jn | Pass after fix | John 2:1 puts only Jesus' mother at Cana. I added 2:2 and 2:11, which put Jesus there. |
| 04 | Cana → Capernaum | Jn | Pass | Context: 2:1–11 |
| 05 | Capernaum → Jerusalem | Jn | Pass | Context: 2:12 |
| 06 | Jerusalem → Judea | Jn | Pass | Context: 2:23 |
| 07 | Judea → Sychar (through Samaria) | Jn | Pass | |
| 08 | Sychar → Cana | Jn | Pass | Context: 4:5 and 4:40; 4:43 says "from there" |
| 09 | Nazareth → Capernaum | Mt, Lk | Pass | Both name both ends. The rule keeps the two accounts separate ("Luke separately narrates"). |
| 10 | Galilee → Jerusalem | Jn | Pass | Context: 4:43–54 |
| 11 | Jerusalem → the Sea of Galilee | Jn | **Needs change** | See §12, R1 |
| 12 | the Sea of Galilee → Capernaum | Jn | **Needs change** | See §12, R1 |
| 13 | Galilee → Jerusalem | Jn | Pass | 7:14 says "the temple"; 7:25 names Jerusalem |
| 14 | Capernaum → Nain | Lk | Pass | |
| 15 | Capernaum → the country of the Gadarenes | Mt, Mk, Lk | Pass | Context: Matthew 8:5 and 8:14, with no change of place before 8:18. Mark and Luke name no start. |
| 16 | the country of the Gadarenes → Capernaum | Mt, Mk, Lk | Pass | "His own city" is Capernaum by Matthew 4:13. Mark and Luke name no end, and nothing conflicts. |
| 17 | Galilee → Nazareth | Mt, Mk | **Needs change** | See §12, R2 |
| 18 | Galilee → Tyre (the borders of Tyre and Sidon) | Mt, Mk | Pass | Context: "from there" is the land of Gennesaret (Matthew 14:34; Mark 6:53), which `galilee` stands for. I removed an ADR reference from the rule. |
| 19 | Tyre → the Sea of Galilee (through Decapolis) | Mk → Mt, Mk | Pass after fix | Matthew 15:29 tells the same return ("from there … came near to the sea of Galilee") and wasn't cited. Added. |
| 20 | the Sea of Galilee → Magdala | Mt, Mk | Pass | Context: Matthew 15:29; Mark 7:31. The `magdala` record treats Dalmanutha as the same area. |
| 21 | Magdala → Bethsaida | Mk → Mt, Mk | Pass after fix | The rule relied on Matthew 16:5 without citing it. Matthew 16:4–5 tells the same crossing, so I added it. |
| 22 | Bethsaida → Caesarea Philippi | Mk, Mt | Pass | Context: Mark 8:22–26 |
| 23 | Caesarea Philippi → Capernaum | Mk, Mt | Pass after fix | Mark 9:30's "from there" is the place of the healing below an unnamed "high mountain" (Mark 9:2; Matthew 17:1). Traditions put that mountain at Tabor or Hermon (note §4). I cited the verses that name the start (Mark 8:27; Matthew 16:13) and the mountain, and the rule now says it takes no position on where the mountain was. |
| 24 | Galilee → Jericho | Mt, Mk, Lk | **Needs change** | See §12, R3 |
| 25 | Jericho → the Mount of Olives | Mt, Mk, Lk | Pass | `jericho` candidate 1 is the record's own "Gospel-era city". See §12, R5 for Bethphage. |
| 26 | the Mount of Olives → Jerusalem | all four | Pass after fix | "All four Gospels confirm arrival" overstates John: 12:12 says only that Jesus "was coming to Jerusalem". Reworded, and added Luke 19:37 ("the descent of the Mount of Olives"). |
| 27 | Jerusalem → Bethany beyond the Jordan | Jn | Pass | "Where John was baptizing at first" (10:40) means 1:28, not Aenon (3:23). |
| 28 | Bethany beyond the Jordan → Bethany | Jn | Pass | Context: 10:40–42. 11:18 names Bethany. |
| 29 | Bethany → Ephraim | Jn | Pass | Context: "from there" is Bethany (11:17–44). I removed "The card's own example" from the rule. |
| 30 | Ephraim → Bethany | Jn | Pass | Context: 11:54 |
| 31 | Jerusalem → Bethany (each night) | Mk, Mt | Pass | Minor note, §12 R6 |
| 32 | Jerusalem → Gethsemane | all four | Pass | Context: "the city" (Matthew 26:18; Mark 14:13; Luke 22:10) |
| 33 | Jerusalem → Emmaus | Lk | Pass after fix | ADR-0038 update item 5 applied. The rule said "this note counts …"; it now says, in readers' words, that Jesus joined the two on the road and went with them to Emmaus. I added Luke 24:33 for Jerusalem as the start. |
| 34 | Jerusalem → Bethany (the ascension) | Lk | Pass | Context: Luke 24:33 and 24:52. No Gospel conflicts. |
| 35 | Jerusalem → Galilee | Mt, Mk, Jn | **Needs change** | See §12, R4 |

## 4. What was left out (note §4)
Every reason holds against the WEB, with two exceptions.
- **Correct, as stated:** the childhood journeys (out of scope by the card); Luke's travel narrative; circuits with no named end (Mark 1:38–39; Luke 8:1; 13:22); the mountain of the Transfiguration; "a deserted place"; Mark 5:20 (the healed man's travels, not Jesus'); Chorazin, which is only named in a saying; and "the wilderness" and "the borders of Judea and beyond the Jordan" as stops.
- **The crossing after the feeding of the five thousand:** the reason ("neither names the departure point … 'a deserted place'") is applied unevenly. John's version of the same crossing is kept as segment 12, from the same unnamed shore. See R1.
- **Not considered:** Luke 4:14–16 (from Galilee, "He came to Nazareth") meets the rule but appears in no segment and no exclusion. The Research Lead should list it either way (R2).

## 5. The ADR-0038 update applied
| Item | Applied? | Finding |
|---|---|---|
| 1. Stops are places reached or passed | Partly | Bethphage, which Matthew 21:1 says they reached ("came to Bethsphage"), has a stop entry, but no segment uses it (R5). |
| 2. General places aren't stops | Yes | "The wilderness", "a deserted place" and "the mountain" are never ends. Segments 02 and 23 pass through them, and their rules say so. |
| 3. Region ends | Partly | Segment 18 names "the borders of Tyre and Sidon" and ends at `tyre`, the first city named. Segment 19 names Decapolis as passed, not as a stop. But only segment 35 is encoded as `travelMode: "unknown"`. The other region-end segments (02, 06, 07, 10, 13, 17, 18, 19, 24) are `land`. See §13, Q1. |
| 4. The baptism ends at Bethany beyond the Jordan | Yes | Segment 01 cites Matthew 3:13, Mark 1:9 and John 1:28–29. |
| 5. Emmaus counts, and the stage says Jesus joined them | Yes, after fix | Segment 33's rule now says it plainly. |
| 6. Five periods; the note says the order is a way of listing | Yes, after fix | The note said so, but it also cited "ADR-0038 item 6", said lines were "added in a later task", and pointed readers to a repository file. It now matches Paul's notes: reader-facing, starting "Lines show stage order …". |
| 7. Manuscript differences follow the WEB | Yes | Matthew 8:28 is quoted as "Gergesenes" and Mark 5:1 and Luke 8:26 as "Gadarenes", all from the WEB. Bethphage: §7. |

## 6. Item 3: segments without a line
ADR-0038 item 4 draws a line only where the record names the candidate with the strongest support and I agree. None qualifies:

| Stop | Segments | Decision and reason |
|---|---|---|
| `bethany-beyond-the-jordan` | 01, 02, 03, 27, 28 | **No line.** The candidates are rated `medium` and `low`, but the record's About says "This map shows two candidate sites, on opposite banks of the Jordan, and favors neither", and every earlier task kept both banks equally plausible (for example the M3.5 reconstruction prompt). The two sites are 357 m apart, so a line would lose almost nothing, but it would take a side between the two banks' traditions (brief §2.6). |
| `cana` | 03, 04, 08 | **No line.** Two candidates are `disputed`, and the record says "this map favors none of them". |
| `country-of-the-gadarenes` | 15, 16 | **No line.** Kursi and Gadara are both `disputed`, and the entry's sources diverge. ISBE places the event at the steep shore by Kurseh ("probably" Gerasa) and makes Gadara the city that held the land. OpenBible.info maps each Gospel's name to its own city: Gerasa (Mark 5:1, Luke 8:26) to Jerash, Gadara (Matthew 8:28) to Umm Qais, and Gergesa to Kursi. Kursi is the only site on the shore, but that alone isn't the strongest support. |
| `bethsaida` | 21, 22 | **No line.** Both candidates are `disputed`. The record says "the debate … remains unresolved among specialists". The sites are 2.1 km apart. |
| `emmaus` | 33 | **No line.** Two candidates are `disputed` and two `low`. |

The old reasons were written for the process. Examples: "neither has the Fact-Checker's agreement as the strongest yet", "it gets noLineReason unless the Fact-Checker finds …", "see the research note §6.3", "see segment-01". All 12 now give the reason in readers' words, for example "Bethany beyond the Jordan has two proposed sites, on opposite banks of the river, and this map favors neither, so no line is drawn."

## 7. The new stop entries
**`ephraim`: Pass after fix, now `verified`.**
- Site: Pleiades 687896 (Ephraim/Apheraima) is at the entry's point. Wikidata Q931667 and OpenBible.info's leading identification are 105 m away.
- The identification follows ISBE (Ewing): the town of John 11:54 "probably" corresponds to Eusebius's Ephrem and "probably" answers to et-Taiyebeh. OpenBible.info lists two other identifications (Ein Samia and Khirbet Marjame).
- Fixes: confidence `high` → `medium`; "probably" restored in the support; "Wikidata's … identification" corrected, because the Taybeh item gives the village's point but doesn't identify it with Ephraim.
- `todayName` "Taybeh, West Bank" follows Wikidata's "located in" chain: Ramallah and al-Bireh Governorate, then West Bank (Q36678). It also follows ADR-0028.

**`country-of-the-gadarenes`: Pass after fix, now `verified`.**
- Sites agree with a second source: Kursi (Pleiades 726708218 against Wikidata and OpenBible) 32 m; Gadara (Pleiades 678142 against Wikidata and OpenBible) 196 m; Gerasa (Pleiades 678158 against Wikidata) 413 m and 893 m (Wikidata gives two points), and against OpenBible 868 m, which fits a 1 km-wide ruin.
- The title follows ADR-0026's rule for manuscript differences. The WEB reads "Gadarenes" at Mark 5:1 and Luke 8:26, and 4 of 6 versions read it at Matthew 8:28. My own comparison matches the note's counts, and the NIV, ESV, NLT, CSB and NKJV all footnote the other readings. The descriptive title takes the WEB's phrase and keeps the other two readings in brackets.
- Fixes:
  - Kursi's support dropped ISBE's "probably" and claimed "a Byzantine-period monastery … has long marked it as the traditional site". No cited `bib:` source states that, and a dataset ID can't support a historical claim (ADR-0017), so I removed it.
  - "Independently" became "likewise": both ISBE articles are by the same author.
  - For balance, each candidate now gives OpenBible.info's identification (`openbible:gergesa`, `openbible:gadara`, `openbible:gerasa`). Before, Gerasa's support gave only ISBE's view against it.
- The note's §6.3 misread ISBE: its "Gadara" article rejects the Textus Receptus reading "Gergesenes" (Matthew 8:28, the WEB's reading there), not "a fourth reading" at Mark 5:1 and Luke 8:26. The note now records the correction (§11).

**`bethphage`: site passes after fix, stays `draft`** (R5, Q2).
- Site:
  - Et-Tur: Wikidata Q2193088 against OpenBible's "Et Tur", 45 m.
  - Abu Dis: OpenBible against Wikidata Q246590, 0 m. I added Q246590 as the second cited source for that point.
  - Pleiades has no Bethphage.
- The support said ISBE judges "this site, on the summit". ISBE puts New Testament Bethphage most probably on the summit, where Kefr et-Tur stands, and puts the medieval Bethphage "between the summit and Bethany", the site "enclosed by the Roman Catholics". The entry's point is that Franciscan sanctuary, which Custodia places "on the eastern part of the Mount of Olives", 536 m from Wikidata's at-Tur village point. Reworded.
- `todayName` said "East Jerusalem". The item's own "located in" is Jerusalem (Q1218), and ADR-0028's rule for Jerusalem leaves its places with no other descriptor, so it now reads "Et-Tur (Kafr et-Tur), Jerusalem".
- Name: my comparison found all six versions reading "Bethphage" in the text, as the note says. But the NKJV footnotes "M Bethsphage" (the Majority Text) at all three verses, so the WEB's spelling is a manuscript reading. The note said there was no footnoted variant. See Q2.

## 8. Years and the note's neutrality
- **`fromYear` 26, `toYear` 30:** these match ISBE's own "Summary of Dates": baptism 779/26, death 783/30. The years are integers, there is no year 0, and the Routes tab's map stop for AD 26 is AD 17. ISBE also gives a start of AD 28–29, if Tiberius's 15th year is counted from Augustus's death, and an early tradition that dates the death to 29. Both fall inside 26–30, and the `yearNote` now gives them, in readers' words; it used to point to "this route's research note". The Catholic Encyclopedia (1910) also gives about 26 for the start and 29 for the death.
- **Needs change (R7):** both opened sources are more than a century old. ADR-0038 item 7 asks for a range that covers the scholars' dates. Wikipedia, as a pointer only, reports a general view of a crucifixion between AD 30 and 36, which would put the end beyond 30.
- **Neutrality:** the note, `yearNote` and rules take no side. One exception was segment 17's rule, which used Luke 4:16–24 to identify Matthew and Mark's "his own country" while the note's §8 says it's disputed whether that is the same visit (R2). Segment 23 now avoids placing the Transfiguration.

## 9. The allow-list
All eight pairs are needed: each record has a candidate within 2 km of a Bethphage candidate. Each pair is a genuinely distinct place, and Mark 11:1 and Luke 19:29 name Bethphage and Bethany side by side.

| Pair | Distance | Finding |
|---|---|---|
| bethany | 0.79 km (Abu Dis 1.39 km) | Distinct. The reason said "about 1 km"; corrected to 0.8. |
| gethsemane | 1.10 km | Distinct |
| golgotha | 1.99 km | Distinct. "Inside the Old City" is wrong for the Garden Tomb candidate, so it now reads "in Jerusalem". |
| jerusalem | 1.57 km | Distinct (ISBE: Bethphage was "near but outside Jerusalem") |
| mount-of-olives | 0.49 km | Distinct |
| pool-of-bethesda | 1.49 km | Distinct |
| pool-of-siloam | 1.67 km | Distinct. "Inside the Old City" was wrong: the record places it "at the southern end of Jerusalem's City of David". Corrected, as was the code comment. |
| temple-mount | 1.44 km | Distinct |

## 10. Licenses
- The five new `bib:` entries are ISBE articles. ISBE (1915) is public domain and already accepted.
- No new dataset is used.
- custodia.org had been cited since M3 but wasn't named in either file. It is now listed under the cite-only rows of `docs/LICENSES.md`, with its notice ("All rights reserved"), and of `ATTRIBUTION.md`.
- Livius.org isn't in the data.
- Every verse quoted is from the WEB.

## 11. Corrections I made (ADR-0014)
1. Segments 02, 03, 19, 21, 23, 26 and 33: added passages or fixed the rule, as in §3.
2. Segments 18 and 29: removed process references from the rule.
3. All 12 `noLineReason` texts, and the route's `note` and `yearNote` (§5, §6, §8).
4. `ephraim`: confidence, support and status.
5. `country-of-the-gadarenes`: support, sources and status.
6. `bethphage`: support, `todayName`, and a second source for Abu Dis.
7. Three allow-list reasons and the code comment.
8. `docs/LICENSES.md`, `ATTRIBUTION.md` and the app's matching credits list: added custodia.org.
9. The research note: a new §11 listing its factual corrections.

## 12. Sent back to the Research Lead
- **R1, segments 11 and 12 (the feeding and the crossing).** All four Gospels tell the journey to the feeding of the five thousand (Matthew 14:13; Mark 6:32; Luke 9:10), and Matthew 14:22–34 and Mark 6:45–53 tell the crossing after it.
  - Neither segment cites them. Item 3 says every Gospel that tells a move is cited.
  - Matthew and Mark land at Gennesaret, while John's boat, heading for Capernaum, reaches "the land where they were going" (John 6:17, 21). Decide whether that conflicts.
  - Treat "the other side of the sea" (John 6:1, 16) the same way as "a deserted place" in the note's §4. As things stand, one is a stop and the other isn't.
  - Segment 12 also needs John 6:19–21 to show Jesus in the boat.
  - Segment 11's start rests on John's abrupt move from chapter 5 to chapter 6 (note §8).
  - Keep, re-cite or drop the two segments.
- **R2, segment 17.** The start isn't named. Matthew 13:53's "from there" is the house by the sea (13:1, 36), and Mark 6:1's is Jairus's house (5:21, 38). Galilee isn't named in either chapter. The rule relies on uncited verses (Matthew 2:23, 4:13) and on Luke 4:16–24, whose identity with this visit the note calls disputed. Either cite the context that names both ends from the same Gospel, or leave the segment out. Also say whether Luke 4:14–16 (Galilee → Nazareth) is a segment.
- **R3, segment 24.** Luke 17:11 doesn't tell this route: it has Jesus going between Samaria and Galilee, not into the borders of Judea beyond the Jordan. Listing Luke among the segment's Gospels joins Luke's travel narrative to Matthew and Mark's route. Either cite Luke as telling only the arrival at Jericho (18:35; 19:1), with the rule describing its different route and saying whether that conflicts, or remove Luke.
- **R4, segment 35.** No Gospel narrates this as a journey:
  - The cited verses say that the eleven went into Galilee (Matthew 28:16), that a young man foretold it (Mark 16:7), and that Jesus appeared at the sea of Tiberias (John 21:1).
  - Matthew 28:7 and 28:10, the verses that say Jesus goes ahead into Galilee, aren't cited.
  - Luke 24:49 has the disciples told to stay in Jerusalem, which may be a conflict under item 3.
  - The rule's "part of the earliest-attested portion of its ending" has no source.
  - Decide whether this meets the rule; if it stays, cite 28:7 and 28:10 and source or remove the clause about the manuscripts.
- **R5, `bethphage` (stays `draft`).** No segment uses it. Either end segment 25 at it and start segment 26 there, as the note's §3.3 and the PO's answer 4 intend (Matthew 21:1: "came to Bethsphage"), or keep the Mount of Olives as the shared end and drop the entry and its eight allow-list entries.
- **R6, segment 31 (minor).** Luke 21:37 has Jesus spend each night "on the mountain that is called Olivet". Cite it, or say in the rule why not. The note's "Luke … do not narrate a daily … commute" leaves it out.
- **R7, the years.** Check a current reference work for the range of dates, especially the year of the death. If views reach past AD 30, widen `toYear` and give each view in `yearNote` (ADR-0038 item 7).

## 13. For the PO
- **Q1, how "path not known" is encoded.** M5-01's fixture marks a "path not known" stage with `travelMode: "unknown"` and `namedRegions`. M5-02 encodes ADR-0038's own example, Lystra → Troas through Phrygia and Galatia, as `land` with `namedRegions`. This route has ten segments with a region at one end (02, 06, 07, 10, 13, 17, 18, 19, 24, 35), and three more that name regions passed (08, 23, 28). Only segment 35 is `unknown`; the rest are `land`. M5-04 needs one rule: either `travelMode: "unknown"`, or a line style derived from region ends and `namedRegions`. I haven't changed `travelMode`.
- **Q2, Bethphage's title.** ADR-0026 gives the version majority ("Bethphage", 6 of 6) unless versions differ "because of a manuscript variant", in which case the title follows the WEB. Here the six agree, and only the WEB differs, by following the Majority Text. My reading is that the exception, written for Magdala where the six split 4 to 2, doesn't apply, so "Bethphage" stands. Your answer 4 rested on the note's statement that there was no variant, so please confirm.

## 14. Checks
- `npm run validate:data`: passes with 203 warnings, the same as before this branch.
- `npm test`: 297 of 297 pass.
- `npm run test:app`: 159 of 159 pass, after one fix. The app's "Sources & credits" list must match `ATTRIBUTION.md`'s source names exactly, so I added custodia.org there too (`app/src/features/search/sources-credits-content.ts`, as in M4-04).
- `npm run typecheck` and `npm run lint` are clean.

## 15. Re-check of `a649411` and `49b11d9` (2026-10-13)
I checked `git diff bacbc11..HEAD`: the Research Lead's R1–R7 fixes, the PO's answers to Q1 and Q2, and the merged cite-only lists. The route now has 33 segments, 12 without a line. All 117 passages match the WEB.

**Result:** 32 of 33 segments pass, 3 after the small fixes below. `Bethsphage` is now `verified`. Two items stay open:
- **S1:** the merged segment 12, back to the Research Lead.
- **S2:** the listing order, for the PO.

| Item | Result |
|---|---|
| R1, the feeding and the crossing | **Still open, S1** (below) |
| R2, "his own country" | Pass. Dropped, and the §4 reason states the unnamed start accurately. The new segment 09 (Galilee → Nazareth; Luke 4:14, 4:16) meets the rule, and no Gospel conflicts with it. |
| R3, Luke 17:11 | Pass. Removed; segment 23 is Matthew and Mark only. |
| R4, the post-resurrection Galilee segment | Pass. Dropped, and the §4 reason matches the WEB (Matthew 28:16; Mark 16:7; John 21:1; Luke 24:49). |
| R5, Bethsphage | Pass after fix. Segments 24 and 25 now end and start there. Segment 24's `via` (Bethany, then the Mount of Olives, before Bethsphage) isn't in the text: Mark 11:1 and Luke 19:29 name "Bethsphage and Bethany", Bethsphage first, and Matthew 21:1 has "came to Bethsphage, to the Mount of Olives". Since Et-Tur lies east of the Mount of Olives point, it also made the line double back, so I removed it. Segment 25's `via` (Luke 19:37, "the descent of the Mount of Olives") stands. |
| R6, Luke 21:37 | Pass after fix. It's cited, but Luke wasn't in segment 30's Gospels, while segments 20 and 25 list Gospels that tell only part of a move. Added Luke. |
| R7, `toYear` 33 | Pass after fix. World History Encyclopedia (Denova, 2021; CC BY-NC-SA, so cite-only, as the existing row says) states that the Gospels place the ministry and death under Pilate, "26-36 CE", and that the common date for the death is "between 30-33 CE". The `yearNote` restates this without quoting. I changed "this route's toYear widens" to readers' words, and the bibliography URL to the page's own citation URL (`/Jesus_Christ/`; the old one redirects with a 301). |
| Q1, "path not known" | Pass after fix. Region-end segments are `unknown`, but the new segment 09 (from Galilee) was `land`. Fixed, so all nine are `unknown`: 02, 06, 07, 09, 11, 13, 17, 18 and 23. `namedRegions` names regions passed, or a region named by its cities. A region that is itself the end isn't repeated there, as in M5-02. |
| Q2, the title "Bethsphage" | Pass, following your ruling under ADR-0026's rule for manuscript differences. With no field for other names, "Bethphage" now appears in the support text, sourced to the six versions. ADR-0026 still says "So far only Magdala is affected", which is now out of date. |
| Item 3, Bethsphage's line | Segment 24 runs to candidate 0, Et-Tur. The entry names it as the strongest (`medium` against `low`; ISBE "much more probable"; OpenBible.info 336 against 40), and I agree. |
| `ATTRIBUTION.md` and the app's credits (`49b11d9`) | Pass: both name Bible Odyssey and custodia.org, and `test:app` checks that they match. |

**`gennesaret`: passes on its content after fix, but stays `draft`,** because S1 sends back the only segment that uses it.
- Title: all six versions and the WEB read "Gennesaret" at Matthew 14:34 and Mark 6:53.
- Site: OpenBible.info's "El Ghuweir" (500/1000) is the entry's point. Wikidata's kibbutz Ginosar is 2.05 km away. Both lie on the plain that ISBE describes as running "from el-Mejdel in the South, to … Khan Minyeh, in the North", over 3 miles long and about a mile wide. Confidence `high` fits.
- Fixes:
  - The label said "between Magdala and Capernaum"; ISBE says Khan Minyeh, and our `capernaum` record is 6.7 km from the point.
  - The support said "about 1.4 km" and that the kibbutz "takes its name from Gennesaret"; Wikidata states no such thing.
  - `todayName` was "El Ghuweir, …". That is ISBE's 1915 name ("now known as el-Ghuweir"), and OpenBible's point is 0.81 km from the former village of Ghuwayr Abu Shusha (Mandatory Palestine). It is now "Near Ginosar, Israel", from Wikidata Q1525069 (country: Israel), in ADR-0028's "Near <town>" form.

**S1, segment 12 (Jerusalem → Gennesaret): needs change, back to the Research Lead.**
- No single Gospel names both ends. John gives Jerusalem (by the context of 5:1) and Matthew and Mark give Gennesaret. Item 3 asks that "a Gospel says that Jesus went from one named place to another".
- The rule says John's arrival at "the land where they were going" (6:21), on a boat bound for Capernaum (6:17), is one that "this note treats as the same arrival rather than a conflict". That is the harmonizing judgment the brief (§1.6) rules out, written in process words.
- `travelMode: "sea"` can't start at Jerusalem. OpenBible's Gennesaret point is also about 2 km from the shore, so a line by sea can't reach it either.
- The rule cites John 5:1 and Luke 9:10 without listing them.
- What it needs: the note now treats "the other side of the sea" and "a deserted place" as general places (§4). On that reading, John's half ends at a general place and Matthew and Mark's crossing starts at one, so neither half meets item 3 and the episode would be left out. If instead the Sea of Galilee counts as the named place, it becomes two segments: John's Jerusalem → the Sea of Galilee (`unknown`), and Matthew and Mark's crossing to Gennesaret (`sea`), with John's Capernaum-bound crossing (6:16–21) judged as a conflict or not, in neutral words. If the segment is dropped, `gennesaret` goes too.

**S2, the order: for the PO.** I missed this in round 1. The route note (and ADR-0038 update item 6) lists segments "within each period by each segment's first passage", and the note's §5 says that means canonical book order, then chapter and verse. The data doesn't follow that:
- Phase A runs Matthew 3:13, Matthew 4:1, John 1:28 … John 4:43, Luke 4:14, Matthew 4:13. That puts John 1–4 between the temptation and the start of the Galilean ministry, which is the traditional harmony's order.
- Phase B puts John 5:1, 6:1 and 7:1 and Luke 7:1 before Matthew 8:18.
- Either re-sort, which renumbers the segment ids that M5-04 keys its lines to, or describe the order the list actually follows.

**My round-2 corrections:**
- Data: segment 09's `travelMode`; segment 30's Gospels; segment 24's `via`; the `yearNote` wording; the WHE URL.
- Stop entries: `gennesaret`'s label, support and `todayName`; `bethphage`'s support and its six version sources.
- The research note: its §9 line on `via`, and two re-check points in §11.

**Checks (round 2):**
- `npm run validate:data`: passes with 203 warnings, the same as before.
- `npm test`: 297 of 297 pass.
- `npm run test:app`: 159 of 159 pass.
