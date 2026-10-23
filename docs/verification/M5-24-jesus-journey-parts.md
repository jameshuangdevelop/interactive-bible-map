# M5-24 verification — Jesus' journeys in a few parts (phase 2)

- **Card:** `docs/tasks/M5-24-jesus-journey-parts.md`, phase 2 (the check) · **Branch:** `data/m5-24-jesus-journey-parts`, checked at `8b7c973`
- **Checked:** the Research Lead's note `docs/research/M5-24-jesus-journey-parts.md`, against the `jesus` route in `data/routes/routes.json`, the five disputed places' records in `data/locations/`, ADR-0038 (with its updates), ADR-0041, ADR-0042, M5-03's research and verification, and every source the note cites, opened at the source.
- **Verifier:** Fact-Checker (Claude, Copilot CLI) · **Date:** 2026-10-23 · This phase changes no data file, so no record's `status` changes.

**Result: the five parts, every stage's place in them and every confidence level stand, and both harmonies are public domain in the United States. The note needs 28 corrections before the data phase. Nothing blocks sign-off.** No stage's position is rejected. The main findings:
1. **The note never says what a stage's position is when the harmonies split it in time.** It lists segment-02 by its start ("the temptation is its earliest event") and segment-28 by its arrival. Stated as one rule (§4.1), the order holds: it matches Robertson everywhere, and Stevens and Burton everywhere except segment-22.
2. **Segment-28's evidence misreads Robertson.** His §126–127 are the departure from Jericho, not "the Synoptic arrival". The arrival at Bethphage is §128b, after John's arrival at Bethany (§128a). Stevens and Burton agree (§115–117, then §118, then §119).
3. **Stevens and Burton's reading of segment-22 is given only in part.** They put its departure before the Feast of Dedication (§86) but its arrival at Jericho after Ephraim (§115). So listed by arrival, the two harmonies agree on every step, segment-22 included.
4. **Thirteen clauses are contradicted by their sources** (§10), for example "this route's own `yearNote`" (the route has none), "since it has no travel", "all in Galilee", "quoted in the card" and "first edition 1904".
5. **Neutrality.** Part 3's summary joins John's route and the Synoptics' route into one itinerary, which M5-03 kept apart. §4.3 argues for one harmony. "Independently" takes a side on how the Gospels relate. "Israel/West Bank" isn't in the record.
6. **Facts for the human's choices (§9):**
   - Part 2 splits cleanly into two at both harmonies' own division, giving six parts.
   - Listing by arrival gives full agreement between the two harmonies.
   - Today, any placement by coordinates lands on candidate 0 of a disputed place.

| Area | Verdict | Corrections |
|---|---|---|
| Coverage: 32 stages, ends, passages | Pass | — |
| The parts: titles, summaries, ranges | Parts 1 and 5 pass; 2, 3 and 4 need change | 2–5 |
| Order claims (§4 and the 32 rows of §5) | 23 rows pass, 9 need change; no position rejected | 1, 6–17 |
| Confidence levels (26 high, 5 medium, 1 low) | Pass, once the listing rule is written down | 1 |
| Sources and the two bibliography entries | Content passes; descriptions and both entries need change | 5, 18–21 |
| Licensing | Pass | — |
| §7, the four-part alternative | Needs change | 22 |
| §8, the 12 stages without a line | 8.4 passes; 8.1–8.3, 8.5 and 8.6 need change | 23–27 |
| §9, the data shape | Its facts pass; §9.1 is incomplete | 28 |
| Use of M5-03's work | Pass | (3, 28) |

## 1. Sources opened, and their licenses
All read on 2026-10-23.

| Source | Where | What I checked | License, read at the source |
|---|---|---|---|
| WEB | `data/reference/engwebp_vpl.txt` | Every phrase the note quotes, plus John 3:24, 7:2, 12:21 and Acts 1:1, 1:3 | Public domain (ADR-0013) |
| A. T. Robertson, *A Harmony of the Gospels*, Project Gutenberg #36264 | <https://www.gutenberg.org/ebooks/36264>; <https://www.gutenberg.org/cache/epub/36264/pg36264.txt> | Title page; Chief Divisions; the Analytical Outline (§1–184); §34, §37 and §119–122 in full, with the note to §120; the note on Luke's travel narrative | Catalog page: "Public domain in the USA." Its notice reads "Copyright, 1922, by Harper & Brothers". |
| Robertson, the 1922 George H. Doran printing (Internet Archive) | <https://archive.org/details/harmonyofgospels00robeuoft> | Title page ("Copyright, 1922, by George H. Doran Company"). Against Gutenberg's text: the outline for §24–31, 33–34, 36–39, 44, 49–51, 55–56, 64–67, 77–82, 85–95, 112, 118–120, 122, 126–129 and 131, and the note to §120 | IA: NOT_IN_COPYRIGHT; published 1922 |
| Library of Congress record 22019929 | <https://www.loc.gov/item/22019929/> | — | **Unverified:** returns HTTP 403 to automated requests. The note doesn't rely on it. |
| W. A. Stevens and E. D. Burton, *A Harmony of the Gospels for Historical Study*, Princeton's copy | <https://archive.org/details/harmonyofgospels00stev>, its `_djvu.txt` and metadata | Copyright page, both prefaces, Principal Divisions, the Analytical Outline (§1–151), Appendix I on brackets | IA: NOT_IN_COPYRIGHT. Notices: 1904 (the authors) and 1932 (Margaret E. Burton). |
| Stevens and Burton, a 1904 Scribner printing (University of Michigan) | <https://archive.org/details/aga1254.0001.001.umich.edu> | Copyright page (1904 only); the third edition's preface; the outline for §18–37, 41, 44–46, 50–51, 58–60, 70–75 and 80–119 | Published 1904 |
| Stevens and Burton, first edition | <https://archive.org/details/harmonyofgospels00stevrich> (New York: International Committee of YMCAs, 1893); <https://archive.org/details/cu31924029339466> (Boston: Silver, Burdett, 1894) | Metadata only, for the edition dates | — |
| ISBE (1915), "Chronology of the New Testament" (Armstrong) | <https://www.internationalstandardbible.com/C/chronology-of-the-new-testament.html> | §I.2–I.7, and the quotation in §I.5 | Public domain (`docs/LICENSES.md`) |
| World History Encyclopedia, "Jesus Christ" (Denova, 2021) | <https://www.worldhistory.org/Jesus_Christ/> | What it says about the order of the ministry | CC BY-NC-SA; cite-only, as the existing row says |

## 2. Coverage: pass
I parsed the note's §5 table with a script and compared every row with `routes.json`.
- **Ids.** There are 32 rows. Each id from `segment-01` to `segment-32` appears exactly once. The parts have 10, 11, 7, 2 and 2 stages.
- **Ends and passages.** Each row's ends match the stage's `from` and `to`, by the records' names. Each row's passages expand to exactly the stage's passages. The script misread "John 1:28,43; 2:1-2,11"; checked by hand, it matches.
- **Lines.** The 12 stages without a line are 01, 02, 05, 06, 10, 11, 12, 16, 17, 25, 26 and 31, as §8 says. The other 20 match the 20 features in `data/geo/routes-lines.geojson` whose `routeId` is `jesus`.

## 3. The parts
| Part | Title | Summary | Scripture range | Verdict |
|---|---|---|---|---|
| 1 | Fair | Fair and neutral; its order matches both harmonies | Matches the stages | Pass |
| 2 | Fair | "Withdraws north and east into the largely Gentile regions around Tyre, the Decapolis, Bethsaida and Caesarea Philippi" has three problems. No cited source says "largely Gentile". Robertson puts Bethsaida "in the tetrarchy of Herod Philip" (§81), and John 12:21 calls it "Bethsaida of Galilee". Tyre lies north-west of the lake (`tyre` record), and Robertson's route of §79 goes "south into Decapolis". | Matches | Needs change (2) |
| 3 | Fair; Stevens and Burton's period runs "until the Final Arrival at Jerusalem" | "Comes up through Jericho and Bethany" joins the Synoptics' route (Jericho) and John's route (Ephraim to Bethany) into one itinerary. M5-03 recorded the two routes "without proposing how they fit together" (research §8). The summary also leaves out the departure from Galilee, where stage 4 starts. | Matches | Needs change (3) |
| 4 | Fair | "Returning each evening to Bethany" leaves out Luke 21:37: "every night he would go out and spend the night on the mountain that is called Olivet". Segment-29's own rule gives both. | Matches | Needs change (4) |
| 5 | Fair | Matches Luke 24:13–15 and 24:50–51 | Matches | Pass |

The sources §2 gives for the parts: ISBE and WHE give the broad order (the baptism, the ministry in Galilee, the last Passover and the death in Jerusalem). Neither says "which stages belong together". The two harmonies' main divisions do say that (correction 5).

## 4. The order claims
"R" is Robertson and "S&B" is Stevens and Burton, both cited by section.

### 4.1 The rule for where a stage sits (the main finding)
Both harmonies put the start and the end of three stages far apart.
- **Segment-02 (Bethany beyond the Jordan → Galilee).**
  - Its start, the temptation, is R §25 and S&B §20.
  - Its end, the return to Galilee, is printed twice by each harmony: beside John 4:1–4 (R §34; S&B §31) and beside John 4:43–45 (R §36–37; S&B §34).
  - S&B §31 sets Matthew 4:12 and Mark 1:14 in half-brackets. That is their sign that "a single sentence or paragraph covers two distinct events or historical occasions" (Appendix I).
  - John 3:24 ("John was not yet thrown into prison") is consistent with this.
- **Segment-22 (Galilee → Jericho).** S&B put its departure at §86, before the Feast of Dedication (§92), and its arrival at Jericho at §115, after the withdrawal to Ephraim (§106). R puts the whole stage at §122–126.
- **Segment-28 (Ephraim → Bethany).** John gives only the arrival (12:1). R's note to §120 has Jesus go from Ephraim "northward through Samaria into the southern or southeastern part of Galilee, so as to fall in with the pilgrims going from Galilee through Perea to Jerusalem". So in R's arrangement, segments 22 and 23 are parts of the same journey.

The note lists segment-02 by its start but segment-28 by its arrival, and doesn't say why. Correction 1 writes the rule down as "by departure, or by arrival where a stage's verses don't tell the departure". Two stages fall under the second half: segment-28, and segment-04, whose Luke 4:14 names Galilee, where Jesus had returned, so the move itself is 4:16. Under that rule:
- the note's order holds;
- it matches R everywhere;
- it matches S&B everywhere except segment-22.

**Listed by arrival instead,** the two harmonies agree on every step between Gospels, segment-22 included:
- Part 1 would read 01, 05, 06, 07, 08, 09, 02, 10, 04, 03.
- Part 2 would stay the same.
- Part 3 would read 25, 26, 27, 22, 28, 23, 24.

Which rule to use is a choice for the PO and the human (§9).

### 4.2 Part 1
| # | Stage | The note's evidence | At the source | Verdict |
|---|---|---|---|---|
| 1 | 01 | R §24; S&B §19 | Matches: R §24 (Mark 1:9–11; Matt. 3:13–17) and S&B §19 | Pass |
| 2 | 02 | The temptation is R §25 and S&B §20 (both correct). The later wording sits "beside stage 9 below (Robertson §34; Stevens & Burton §31)". | R §34 and S&B §31 sit beside John 4:1–3, which is stage 7 (segment-09); the arrival is R §37 and S&B §34. §4.1 has three more errors. Matthew 4:11 is all temptation (R §25; S&B §20), so only 4:12 is the later moment. The quoted words aren't the WEB's: 4:12 reads "Now when Jesus heard that John was delivered up, he withdrew into Galilee." And R §34 and S&B §31 come *before* Samaria (R §35; S&B §32–33), not "only after the whole Judea/Samaria section". | Needs change (6, 10) |
| 3 | 05 | R §26–29; S&B §21–25 | Matches (John 1:19–2:11) | Pass |
| 4–8 | 06–10 | John's own text | The WEB phrases are exact. Segment-09's quotation is altered with "…" and "[and]" (nit b). | Pass |
| 9 | 04 | "Stevens & Burton's §34 cites both verses for one event; Robertson keeps them as adjacent sections, §36 then §37" | Correct, but R also prints Luke 4:14 in §34, with John 4:1–4, before Samaria. The step the order rests on is Cana before Nazareth: R §38 then §39, and S&B §35 then §36. | Needs change (11) |
| 10 | 03 | Luke 4:14–31 "is one scene"; "Matthew confirms the Nazareth-to-Capernaum move independently"; R §39–40; S&B §36–37 | The sections match (S&B §37 prints Matt. 4:13–16 and Luke 4:31a in half-brackets). Luke 4:14–31 is one passage, not one scene. "Independently" takes a side on how the Gospels relate, and Robertson's own preface says "Matthew and Luke made use of Mark". | Needs change (12) |

### 4.3 Part 2
| # | Stage | The note's evidence | At the source | Verdict |
|---|---|---|---|---|
| 1 | 20 | R §49 before §50–51; S&B §44 before §45–46; ISBE §I.5 | All three match, and the ISBE quotation is exact. But the route has no `yearNote`, and its note on years (`notes[2]`) doesn't mention John 5:1. ISBE itself says "the identification cannot be made with certainty". | Needs change (8) |
| 2 | 19 | Luke's own text ("soon afterwards") | Matches 7:11; R §55–56; S&B §50–51 | Pass |
| 3 | 11 | Luke's text; Matthew and Mark "independently" | Matches R §65–66 and S&B §58–59; only "independently" needs to go | Needs change (12) |
| 4 | 12 | The return leg in all three | Matches R §67 and S&B §60. R prints Matthew 9:1 with the paralytic (§46), while S&B mark §60 as its place with half-brackets. This doesn't affect the order. | Pass |
| 5 | 13 | "Not kept as a stage here, since it has no travel"; R §78; S&B §70 | The sections match. But Mark 6:1 and 6:31–53 are travel, which M5-03 left out for other reasons (research §4: no named start, general places, accounts that differ). The same goes for two claims in §4.2. "Each stage's own wording picking up directly from the one before" fails between 12 and 13. "With nothing between them" (Luke 7–8) is wrong: 7:18–8:21 lies between, including a circuit at 8:1. | Needs change (7, 13) |
| 6–10 | 14–18 | Mark's own text | The WEB phrases are exact; R §79–90; S&B §71–81 | Pass |
| 11 | 21 | R §94–96; S&B §82; "tied in the text to the autumn Feast of Booths" | The journey (John 7:10) and the arrival (7:14) are R §95–96 and fall within S&B §82 (John 7:1–52). But R puts John 7:1 at §77, before the withdrawal to Tyre (§78). The WEB names the Feast of Booths (7:2) but no season; "autumn" comes from S&B's chapter title, "An Autumn Visit to Jerusalem". | Needs change (8, 14) |

### 4.4 Part 3
| # | Stage | The note's evidence | At the source | Verdict |
|---|---|---|---|---|
| 1 | 25 | "Both cited harmonies open this part with, or very near, this withdrawal" | R opens Part X with it (§112). S&B open their Perean period with §86, the departure from Galilee that starts segment-22, six sections before §92. | Needs change (15) |
| 2 | 26 | John's own text | Matches R §118 and S&B §105 | Pass |
| 3 | 27 | John's own text | Matches R §119 and S&B §106 | Pass |
| 4 | 22 | R §122 after §119; S&B §86 before §92; low | Correct as far as it goes. R §120 is "In Samaria or Galilee", not "further Perean teaching". Two facts are missing: S&B put the arrival at Jericho at §115, after §106, and their §86 includes Luke 9:51–62. "Low" is right under the note's rule. The third bullet of §4.3 argues for S&B, but both harmonies put other material in that gap: S&B §82–85, R §93–121. | Needs change (9, 16) |
| 5 | 23 | Same Gospels as segment-22 ("as they went out from Jericho") | Matches Matthew 20:29 and Mark 10:46 | Pass |
| 6 | 28 | "Robertson's own section order (§126–127 before §128a) places the Synoptic arrival first" | **Rejected as stated.** §126–127 are Bartimaeus and Zacchaeus at Jericho, the departure. The Synoptic arrival at Bethphage (Matt. 21:1; Mark 11:1; Luke 19:29) is §128b, after §128a. S&B agree (§115–117, then §118, then §119). The position stands at medium under the rule in correction 1. | Needs change (9, 17) |
| 7 | 24 | Both threads end here | Matches R §128b and S&B §119 | Pass |

### 4.5 Parts 4 and 5: pass
- **Segments 29 and 30.** R §128b–132 and §152; S&B §119–123, §131 (for Luke 21:37) and §136. All four Gospels place Gethsemane after the supper.
- **Segments 31 and 32.** "That very day" (Luke 24:13) is exact. R §176–177 and §184; S&B §145 and §150.
- **§4.4.** Its "in fact separated" is a nit (a).

### 4.6 The confidence levels: pass
- **The counts match the table:** 26 high, 5 medium, 1 low.
- **The table follows one convention, which the note doesn't state.** Each step between neighbouring rows that crosses from one Gospel to another is marked once, on the row of the stage it places: rows 02, 04, 20, 21, 22 and 28. The other rows of a run from one Gospel stay high. Correction 1 writes this down.
- **Medium.** Both harmonies agree on the step for each of 02, 04, 20, 21 and 28, as the tables above show.
- **Low.** For segment-22 the harmonies disagree about its departure.
- **Segment-22's treatment** is right under the note's rule. But it leaves out S&B's arrival after Ephraim, and it leans to one side (correction 9).

## 5. Sources, the bibliography and licensing
- **Robertson.**
  - The note read Gutenberg's text, which comes from a Harper & Brothers printing whose notice reads "Copyright, 1922, by Harper & Brothers".
  - The 1922 first printing is George H. Doran Company's ("Copyright, 1922, by George H. Doran Company"; IA scan). Its outline, and the note to §120, match Gutenberg's for every section I compared.
  - It was published in 1922, before 1929, so it is public domain in the United States under the rule `docs/LICENSES.md` applies to the ISBE. That makes it compatible with the MIT code license and the CC BY-SA 4.0 data license.
  - Its Bible text is the Revised Version, which the project doesn't quote (ADR-0013).
  - **The entry needs change:** it pairs Harper & Brothers with 1922 (correction 21).
- **Stevens and Burton.**
  - **"First edition 1904" is wrong.** The preface to the first edition is dated "Christmas, Anno Domini 1893". IA holds first-edition copies from 1893 (New York: International Committee of YMCAs) and 1894 (Boston: Silver, Burdett). The 1904 book is the third edition, "a thorough revision … printed from new plates".
  - **The Princeton scan the note opened is a later printing of that third edition.** It carries "Copyright, 1904, by Wm. Arnold Stevens and Ernest DeWitt Burton" and "Copyright, 1932, by Margaret E. Burton". 1932 is the 28th year after 1904, when a 1904 copyright fell due for renewal, and Burton died in 1925, so the notice is consistent with a renewal. I didn't search the renewal records.
  - **The question is settled anyway.** The University of Michigan's 1904 printing carries only the 1904 notice. Its preface says "The number and order of sections remain unchanged", and its outline matches the Princeton scan's for every section the note cites.
  - **Licensing:** public domain in the United States (published 1904), under the same rule as the ISBE. Short quotations are allowed under the verbatim-quotation rule, except its Bible text (the Revised Version of 1881).
  - **One gap:** the note's list of revised sections leaves out 27, 36 and 62, which carry comparison passages in brackets.
  - **The entry needs change:** the edition and the URL (correction 21).
- **ISBE §I.5.** Pass. The quotation is exact.
- **WHE.** Pass as an existing route source. It supports the broad order only.
- **WEB.** Needs change. Matthew 4:12 is misquoted, and §6 says the note "quotes no new WEB text", but it quotes John 11:1, which no stage cites (correction 18).
- **The entries' format.** Both corrected entries use only fields that `schema/bibliography.schema.json` and existing entries use. Their ids match the id pattern, and no entry uses them yet.

## 6. The 12 stages without a line (note §8)
| § | The note's claim | The record | Verdict |
|---|---|---|---|
| 8.1 | Al-Maghtas (`medium`): UNESCO since 2015; Roman and Byzantine churches, hermit caves, baptismal structures | `history[2]`: "Roman and Byzantine churches and chapels … UNESCO listed it as a World Heritage Site in 2015" | Pass |
| 8.1 | Qasr al-Yahud (`low`), "(west bank, Israel/West Bank)" | "On the west bank"; `modernCountries`: Jordan, West Bank. No source here says "Israel". | Needs change (23) |
| 8.2 | "Three candidate villages, all in Galilee" | "A third, minority identification places Cana at Qana in southern Lebanon; John calls the village 'Cana of Galilee.'" | Needs change (24) |
| 8.2 | The three candidates, their confidences, and "first-century archaeological evidence is thinner" for Kafr Kanna | Matches the supports and `history[1]` | Pass |
| 8.3 | "See the route's own note, quoted in the card" | The card doesn't quote it; the note is the route's `notes[4]` | Needs change (25) |
| 8.3 | Gadara: "A real Decapolis city about 6 miles from the lake" | "About 6 miles southeast of the lake by the International Standard Bible Encyclopedia's estimate" | Needs change (25) |
| 8.3 | Kursi, Gerasa, confidences, the WEB's readings | Matches; the WEB reads "Gergesenes" at Matt. 8:28 and "Gadarenes" at Mark 5:1 and Luke 8:26 | Pass |
| 8.4 | et-Tell and el-Araj, both `disputed`, 2.1 km apart | Matches: 2.12 km between the records' points | Pass |
| 8.5 | "At very different distances from Jerusalem" | Nicopolis is about 160 stadia away. Qaloniya/Motza and El-Qubeibeh are both about 60. Abu Ghosh's record gives no distance. | Needs change (26) |
| 8.5 | The four candidates and their confidences | Matches | Pass |
| 8.6 | "The card asks for two or three options"; "All three keep today's rule unchanged (no line is drawn …)"; option C is "the card's own example"; option B is marked "no known path" | The card asks for no options. Option C draws a line, which the card rules out ("no new lines for disputed stages") and ADR-0038 item 4 allows only to a candidate with the strongest support. The card's example can also be read as option A plus a hint. These stages lack a line because a site is disputed (ADR-0041 item 1's "Site disputed" tag), not because no path is known. The MC9 quotation and ADR-0041 items 1, 3 and 4 are right. | Needs change (27) |

Apart from these fixes, §8 is neutral. Its reasons follow M5-03 §6, and it favors no candidate.

## 7. The data shape (note §9)
I checked these facts, and all are right:
- **Numbering.** `stageLabelNumber(routeStructure, stageIndex)` in `app/src/features/routes/routes-data.ts` returns "Segment N" for `standalone-segments` and "Stage N" for `connected` routes. The note's "Stage 1" example is from Paul's routes.
- **Validator.** The rule at `scripts/lib/validator.mjs:3777` exists. Lines are matched by `${routeId}::${stageId}` (line 3835), so changing `routeId` is mechanical.
- **Line and stage counts.** The lines file has 20 features for `jesus` and 14, 14, 15 and 8 for Paul's routes. `paul-1` has 14 stages and `paul-rome` has 8.
- **Tests.**
  - `tests/browser/browser-checks.spec.mjs` has the deep-link assertion at line 965 and refers to `jesus` at lines 976, 1146 and 3062–3069.
  - `scripts/verify-web-export-playwright.mjs` has "jesus fitted view" and `route=jesus` (lines 11401–11402 and 12099), `hasCountryOfTheGadarenes` (line 11585) and `loadRouteStopTargets("jesus", …)` (line 11590).
- **Schema.** A route requires `id`, `title`, `fromYear`, `toYear`, `structure`, `sources` and `stages`, and its id pattern allows both naming styles.
- **One more update to list:** `schema/README.md` line 225 uses `"id": "jesus"` in its example.

**§9.1 leaves out three changes** (correction 28): `notes[1]`, ADR-0038, and each new route's years.

## 8. Use of M5-03's work: pass
- **Quotations and citations.** The periods (01–10, 11–21, 22–28, 29–30, 31–32; verification §16, "S2, the order") are right. So is "all 101 passages match the WEB" (§16), the quotation from `notes[1]`, and the citation of research §3.3 and §8 for the two routes.
- **What M5-03 checked.** It checked a way of listing ("not a claim about the order of events", ADR-0038's 2026-10-13 update, item 6), not an order. The note says so in §1.
- **Two places go against M5-03.** Part 3's summary undoes M5-03 §8's neutrality (correction 3). And `notes[1]` would no longer be true (correction 28).

## 9. Facts that bear on the human's choices
I don't decide any of these.
1. **The listing rule** (§4.1): by departure, as the note does, or by arrival. By arrival, no stage is "low", and segments 02, 23 and 28 move.
2. **Segment-22 (the note's open question 3).** After corrections, both placements are correctly sourced, so this is a choice, not a finding. Whichever the PO and the human pick, the part's notes must give the other (brief §2.6).
3. **The number of parts.**
   - Part 2 splits cleanly between segment-12 and segment-13, where both harmonies begin a new main division: R's Part VIII, §72–95, and S&B's Part VI, §70–85.
   - That split gives six parts: segments 20, 19, 11 and 12, then 13–18 and 21. The note's §7 says such a split isn't clean.
   - The four-part merge (segments 22–32, eleven stages) is as the note describes.
4. **Boundaries.**
   - Both harmonies begin the Galilean ministry with the return to Galilee (R §37; S&B §34), which falls before the last stages of Part 1.
   - Both begin the last week in Jerusalem either with the arrival at Bethany (R §128a, where segment-28 ends) or with the entry (S&B §119, segment-24).
5. **The look.**
   - The Routes tab places every stop at the candidate its stage names (`resolveRouteStop`, `candidateIndex ?? 0`), and every disputed end names candidate 0. So a number at the stop, at the midpoint or on a line sits at one candidate's point, for example Khirbet Qana for Cana or Emmaus Nicopolis for Emmaus.
   - Option C also needs the card's "no new lines" rule and ADR-0041 item 3 revisited.
6. **Years.**
   - Under Option 1, each new route needs its own `fromYear` and `toYear`.
   - R's Chief Divisions give "probably" years for each division (A.D. 26–27, 27–29, 29, 29–30, and "30 or 29"). Any narrower range has to cover the ISBE's and WHE's dates (ADR-0038 item 7).

## 10. Required corrections to the note
Apply as written. Where a quotation below runs to an ellipsis, replace the whole sentence it starts. Thirteen clauses that their sources contradict are fixed in: 6 (two), 7, 8 (two), 9d with 17, 10, 13, 20, 22, 24, 25 and 27.

1. **§1, the rule for where a stage sits.** After item 3 of the numbered list (the one ending "both placements are given."), add:
   > **Where a stage sits.** A stage is listed by its departure: the first event its own cited verses tell as part of the movement (for segment-02, the temptation: Matthew 4:1, Mark 1:12 and Luke 4:1; for segment-21, John 7:10, not the context verse 7:1). Where a stage's verses don't tell its departure, it is listed by its arrival: segment-04 by Luke 4:16 (4:14 names Galilee, where Jesus had returned), and segment-28 by John 12:1, since no Gospel tells when Jesus left Ephraim (John 11:54). Each step between neighbouring rows that crosses from one Gospel's account to another's is marked once, on the row of the stage it places; the other rows of a run from the same Gospel stay high. Listed by arrival instead, Part 1 would read 01, 05, 06, 07, 08, 09, 02, 10, 04, 03 and Part 3 would read 25, 26, 27, 22, 28, 23, 24, and the two cited harmonies would agree on every step between Gospels, segment-22 included.
2. **§2, Part 2's summary.** Replace "withdraws north and east into the largely Gentile regions around Tyre, the Decapolis, Bethsaida and Caesarea Philippi," with "travels to the borders of Tyre and Sidon, through the region of the Decapolis, and to Bethsaida and the villages of Caesarea Philippi,".
3. **§2, Part 3's summary.** Replace the whole summary with:
   > In John, Jesus withdraws beyond the Jordan after the Feast of Dedication, returns to Bethany to raise Lazarus, withdraws to Ephraim and comes back to Bethany six days before the Passover; in Matthew and Mark, he leaves Galilee and goes up by way of Jericho, through which Luke also has him pass. All four Gospels then tell of his entry into Jerusalem.
4. **§2, Part 4's summary.** Replace ", returning each evening to Bethany," with " and goes out of the city each night (to Bethany, Matthew and Mark say; to the mountain called Olivet, Luke says)".
5. **§2, "Sources for the parts themselves".** Replace "(which stages belong together, and that this broad order is uncontroversial): the existing route's own sources `bib:isbe-chronology-nt` and `bib:worldhistory-jesus-christ`, already in `routes.json`;" with:
   > (that this broad order is uncontroversial): the existing route's own sources `bib:isbe-chronology-nt` and `bib:worldhistory-jesus-christ`, already in `routes.json`, which give the baptism, the ministry in Galilee and the last Passover in Jerusalem in that order; for which stages belong together, the main divisions of both cited harmonies (Robertson's Parts VI–XIV; Stevens and Burton's Parts II–IX), which differ from this note's parts at two points: both begin the Galilean ministry with the return to Galilee (Robertson §37; Stevens & Burton §34), so the last stages of Part 1 fall in that division, and both begin the last week with the arrival at Bethany (Robertson §128a) or the entry (Stevens & Burton §119);
6. **§4.1.**
   - Replace "Matthew 4:1 and 4:11a," with "Matthew 4:1 and 4:11,".
   - Replace the sentence "But Matthew 4:11b-12, Mark 1:14 and Luke 4:14 (…) … (Robertson §34; Stevens & Burton §31)." with:
   > But Matthew 4:12, Mark 1:14 and Luke 4:14 ("Now when Jesus heard that John was delivered up, he withdrew into Galilee" and its parallels) are placed by both harmonies much later: beside John's own "he left Judea and departed into Galilee" (John 4:3), after the Judean sections (Robertson §34; Stevens & Burton §31, where Matthew 4:12 and Mark 1:14 stand in half-brackets, the book's sign that "a single sentence or paragraph covers two distinct events or historical occasions"), and again beside John's arrival in Galilee after Samaria (John 4:43-45; Robertson §37, after §36; Stevens & Burton §34). John's text is consistent with this: while Jesus was in Judea, "John was not yet thrown into prison" (3:24).
7. **§4.2, first paragraph.** Replace the whole paragraph with:
   > Most of this part's order is high confidence, because segment-19 and segments 11 through 18 follow the Synoptic Gospels' own order. In Luke, Nain (segment-19, 7:11) comes before the crossing to the Gadarenes (segment-11, 8:22), with no other stage between them. Mark's chapters 5 through 9 run from the Gadarenes' return (segment-12) through Tyre and Sidon (13), the Decapolis (14), Magdala (15), Bethsaida (16) and Caesarea Philippi (17) back to Capernaum (18). From segment-14 on, each stage's own wording picks up from the one before ("again," "immediately"); between segments 12 and 13, Mark tells other movements (6:1; 6:31-53) that are not stages, for the reasons in `docs/research/M5-jesus-journeys.md` §4. Matthew's text has the same order.
8. **§4.2, second paragraph.** Make three replacements.
   - Replace "the two round trips to Jerusalem (segments 20 and 21, both "Galilee → Jerusalem") fit into that chain, since John never says where Jesus was in Galilee just before either trip." with "the two journeys up to Jerusalem (segments 20 and 21, both "Galilee → Jerusalem") fit into that chain, since John's text doesn't say where either falls among the Synoptic Gospels' events in Galilee."
   - Replace "(the article says so plainly, and so does this route's own `yearNote`)" with "(the article says so plainly: "the identification cannot be made with certainty")".
   - Replace the last sentence ("Both harmonies also agree that segment-21 … Stevens & Burton §82).") with:
   > Both harmonies also agree that segment-21 (the Feast of Booths, John 7:2; Stevens & Burton's chapter title is "An Autumn Visit to Jerusalem") comes last in this part, after the Caesarea Philippi journey: Robertson places the journey and the arrival (John 7:10, 7:14) in §95-96, after §88-90, and Stevens & Burton place John 7:1-52 in §82, after §80-81. Robertson places John 7:1, the context verse that names Galilee as the start, earlier, in §77, before the withdrawal to Tyre (§78).
9. **§4.3.** Make four replacements.
   - **(a)** In the first bullet, replace "(§120-121, built on Luke 17:11, which this project's own data does not cite for any stage). On this reading, segment-22 is §122, well after segment-27." with:
   > (§120, built on Luke 17:11, which this project's own data does not cite for any stage). Robertson's note to §120 explains that it "has been reasonably supposed (Wieseler, Clark, and others)" that Jesus "went from that region [Ephraim] northward through Samaria into the southern or southeastern part of Galilee, so as to fall in with the pilgrims going from Galilee through Perea to Jerusalem." On this reading, segment-22 runs from §122 to Jericho at §126, well after segment-27, and segments 22 and 23 are parts of the journey whose end John tells as the arrival at Bethany (segment-28, §128a).
   - **(b)** Replace the second bullet with:
   > **Stevens and Burton's harmony** instead reads Matthew 19:1/Mark 10:1, with Luke 9:51-62, as "the final departure from Galilee" (§86), which opens their Perean period, *before* the Feast of Dedication (§92) rather than after it. They place the arrival at Jericho (Matthew 20:29; Mark 10:46) at §115, after the withdrawal to Ephraim (§106), so on their arrangement segment-22 spans the whole of this part.
   - **(c)** Replace the third bullet with:
   > Read on their own, Matthew's and Mark's texts have no travel between segment-18 (ending at Capernaum, Mark 9:33; Matthew 17:24) and segment-22 (Mark 10:1's "He arose from there"), only teaching (Mark 9:33-50; Matthew 18). Both harmonies put other material in that gap: Stevens and Burton the Feast of Tabernacles (§82-85, John 7:1-8:59); Robertson most of Luke 9:51-18:14 and John 7:2-11:54 (§93-121).
   - **(d)** Replace the last sentence of the section ("Segment-28 (Ephraim → Bethany, … at medium confidence.") with:
   > No Gospel says when Jesus left Ephraim, so segment-28 (Ephraim → Bethany, "six days before the Passover") is listed by its arrival (§1). Both harmonies place that arrival after the departure from Jericho (Robertson §126-127; Stevens & Burton §115-117) and before the arrival at Bethphage and the entry (Robertson §128b; Stevens & Burton §119), so it falls within segment-23 (Jericho → Bethphage). This note lists segment-23 first, by its departure, and marks segment-28 medium; listed by arrival, segment-28 would come first.
10. **§5, Part 1, row 2 (segment-02).** Replace "beside stage 9 below (Robertson §34; Stevens & Burton §31) — see §4.1." with "beside stage 7 below, with John 4:1-3 (Robertson §34; Stevens & Burton §31), and again with John 4:43-45 (Robertson §37; Stevens & Burton §34) — see §4.1."
11. **§5, Part 1, row 9 (segment-04).** Replace the evidence with "Both cited harmonies place John's arrival in Galilee and the healing at Cana (John 4:43-54; Robertson §36, §38; Stevens & Burton §34-35) before the visit to Nazareth (Luke 4:16; Robertson §39; Stevens & Burton §36). Stevens & Burton print Luke 4:14-15 with John 4:43-45 in §34; Robertson prints Luke 4:14 with John 4:1-4 in §34, and again, partly in brackets, in §37."
12. **§5, Part 1 row 10 and Part 2 row 3.**
   - In Part 1 row 10, replace "(4:14-31 is one scene); Matthew confirms the Nazareth-to-Capernaum move independently." with "(4:14-31 is one continuous passage); Matthew also tells the move from Nazareth to Capernaum (4:13)."
   - In Part 2 row 3, replace "Matthew's and Mark's own chapters independently keep this one continuous scene." with "Matthew's and Mark's own chapters also keep this one continuous scene."
13. **§5, Part 2, row 5 (segment-13).** Replace "(not kept as a stage here, since it has no travel)" with "(its movements, such as Mark 6:1 and 6:31-53, are not stages, for the reasons in `docs/research/M5-jesus-journeys.md` §4)".
14. **§5, Part 2, row 11 (segment-21).** Replace the evidence with "Both cited harmonies place this visit to the Feast of Booths (John 7:2) after the Caesarea Philippi journey and the return to Capernaum: Robertson §95-96 (John 7:10, 7:14), after §88-90; Stevens & Burton §82 (John 7:1-52), after §80-81. Robertson places John 7:1, the context verse, earlier, in §77."
15. **§5, Part 3, row 1 (segment-25).** Replace "both cited harmonies open this part with, or very near, this withdrawal (Robertson §111-112; within Stevens & Burton §92)." with "Robertson opens his Later Perean Ministry with this withdrawal (§112, after the feast, §111); Stevens & Burton place it within §92, after their final departure from Galilee (§86), which is segment-22's start (see §4.3)."
16. **§5, Part 3, row 4 (segment-22).** Replace the three sentences after "see §4.3." with "Robertson (followed here) places it after segment-27 and a journey by way of Samaria and Galilee (§122-126, after §119-121). Stevens & Burton place its departure first (§86, "The final departure from Galilee", before the Feast of Dedication, §92) and its arrival at Jericho after the withdrawal to Ephraim (§115, after §106). Listed by arrival, both harmonies put it here."
17. **§5, Part 3, row 6 (segment-28).** Replace "Converges with segment-23's Synoptic thread at Bethany, just before the entry; Robertson's own section order (§126-127 before §128a) places the Synoptic arrival first, which this note follows." with "No Gospel says when Jesus left Ephraim, so the stage is listed by its arrival (§1). Both harmonies put that arrival after the departure from Jericho (Robertson §126-127; Stevens & Burton §115-117) and before the arrival at Bethphage and the entry (Robertson §128b; Stevens & Burton §119)."
18. **§6, point 1.** Replace "This note quotes no new WEB text: every `textWEB` string it discusses is copied, unchanged, from the stage records already in `data/routes/routes.json`, which" with "The short phrases this note quotes are from the WEB (`data/reference/engwebp_vpl.txt`); all but John 3:24 and 11:1 come from the stages' own passages in `data/routes/routes.json`, which".
19. **§6, point 2 (Robertson).** Make three replacements.
   - Replace "(New York: Harper & Brothers, 1922)" with "(New York: George H. Doran Company, 1922; later printed by Harper & Brothers)".
   - Replace the two sentences from "Gutenberg's own catalog page" to "not separately opened for this note." with "Gutenberg's text is of a Harper & Brothers printing ("Copyright, 1922, by Harper & Brothers"), and its catalog page states "Public domain in the USA." The Internet Archive's scan of the 1922 George H. Doran Company printing (<https://archive.org/details/harmonyofgospels00robeuoft>) has the same outline, section numbers and titles. It is also catalogued at the Library of Congress (<https://www.loc.gov/item/22019929/>), not opened."
   - Replace "§44, 49-51, 55-56, 64-69, 78-96 (Part 2); §111-127 (Part 3)" with "§44, 49-51, 55-56, 64-69, 77-96 (Part 2); §111-128b, with the note to §120 (Part 3)".
20. **§6, point 3 (Stevens and Burton).** Make four changes.
   - Replace "(New York: Charles Scribner's Sons; first edition 1904)" with "(third edition, revised; New York: Charles Scribner's Sons, 1904; first edition 1893–94)".
   - After the bullet that gives the OCR link, add the bullet "Checked against a 1904 Scribner printing scanned by the University of Michigan, item `aga1254.0001.001.umich.edu` (<https://archive.org/details/aga1254.0001.001.umich.edu>), which carries only the 1904 notice."
   - Replace "§18-37 (Part 1); §41, 44-51, 58-85 (Part 2); §86-118 (Part 3)." with "§18-37 and Appendix I on brackets (Part 1); §41, 44-51, 58-85 (Part 2); §86-119 (Part 3)."
   - Replace the whole "**Licensing flag for the Fact-Checker.**" bullet with:
   > **Licensing.** The scan first opened (Princeton's copy) is a later printing of the third edition. It carries "Copyright, 1904, by Wm. Arnold Stevens and Ernest DeWitt Burton" and "Copyright, 1932, by Margaret E. Burton"; 1932 is the 28th year after 1904, when a 1904 copyright fell due for renewal. The University of Michigan's 1904 printing carries only the 1904 notice and has the same outline, section numbers and titles for every section this note cites; the third edition's preface says "The number and order of sections remain unchanged" from the first. The third edition was published in 1904, before 1929, so it is public domain in the United States, as `docs/LICENSES.md` rules for the ISBE (1915). Its Bible text is the Revised Version of 1881, which this project doesn't quote (ADR-0013).
21. **§6, the proposed bibliography entries.** Replace both JSON blocks with:
   ```json
   {
     "id": "robertson-harmony-of-the-gospels",
     "type": "book",
     "title": "A Harmony of the Gospels for Students of the Life of Christ, Based on the Broadus Harmony in the Revised Version",
     "authors": ["A. T. Robertson"],
     "year": 1922,
     "publisher": "George H. Doran Company",
     "url": "https://archive.org/details/harmonyofgospels00robeuoft",
     "accessed": "2026-10-23"
   }
   ```
   ```json
   {
     "id": "stevens-burton-harmony-of-the-gospels",
     "type": "book",
     "title": "A Harmony of the Gospels for Historical Study: An Analytical Synopsis of the Four Gospels (third edition, revised)",
     "authors": ["William Arnold Stevens", "Ernest De Witt Burton"],
     "year": 1904,
     "publisher": "Charles Scribner's Sons",
     "url": "https://archive.org/details/aga1254.0001.001.umich.edu",
     "accessed": "2026-10-23"
   }
   ```
22. **§7, first bullet.** Replace everything after "(keeping this note's Part 2 as two parts)" with:
   > divides cleanly by period but not by place. By place, the parts would not be contiguous: the crossing east to the Gadarenes (segments 11-12) falls between Nain (segment-19) and the withdrawals north (segments 13-18), and the two journeys up to Jerusalem (segments 20-21) fall at either end. By period, both cited harmonies begin a new main division between segment-12 and segment-13: Robertson's Part VIII, "The Special Training of the Twelve in Districts around Galilee" (§72-95, ending with John 7:10 at §95), and Stevens and Burton's Part VI, "From the Withdrawal into Northern Galilee until the Final Departure for Jerusalem" (§70-85). That split gives six parts in all: segments 20, 19, 11 and 12, then 13 to 18 and 21. This note keeps Part 2 whole (§2); the choice is the PO's and the human's.
23. **§8.1.** Replace "(west bank, Israel/West Bank)" with "(on the river's west bank, in the West Bank)".
24. **§8.2.** Replace "Three candidate villages, all in Galilee, none favored:" with "Three candidate villages, none favored: two in Galilee and one in southern Lebanon:".
25. **§8.3.**
   - Replace "(not only a translation choice; see the route's own note, quoted in the card)" with "(not only a translation choice; see the route's own note)".
   - Replace "A real Decapolis city about 6 miles from the lake." with "A Decapolis city, about 6 miles southeast of the lake by the International Standard Bible Encyclopedia's estimate."
26. **§8.5.** Replace "Four candidate sites, at very different distances from Jerusalem:" with "Four candidate sites. The record gives Emmaus Nicopolis as about 160 stadia (roughly 30 km) from Jerusalem, the reading of Codex Sinaiticus, and Qaloniya/Motza and El-Qubeibeh as about 60 stadia, the distance in most Greek manuscripts of Luke 24:13:".
27. **§8.6.** Make three replacements.
   - Replace the paragraph "The card asks for two or three options … without implying a path." with:
   > The card leaves the look to be decided with the human; this note offers three options. A and B keep today's rule (no line is drawn, and every candidate stays listed). C draws a line, which the card rules out ("Lines stay as they are: no new lines for disputed stages") and ADR-0038 item 4 allows only to a candidate with the strongest support. Any option placed by coordinates needs care: the Routes tab places each stop at the candidate its stage names (`candidateIndex` in `resolveRouteStop`, `app/src/features/routes/routes-data.ts`), which is 0 for every disputed end, so a number at the stop (A), at the midpoint (B) or on a line (C) would sit at one candidate's point, such as Khirbet Qana for Cana or Emmaus Nicopolis for Emmaus.
   - In row B, replace 'marks it as "no known path."' with "marks it as a stage without a line because a site is disputed."
   - In row C, replace 'This is the card's own example ("a numbered place with a dashed hint").' with 'One reading of the card's example ("a numbered place with a dashed hint").'
28. **§9.1.** At the end of the paragraph, add:
   > Three things do change. The route's `notes[1]` says the segments "are not joined into one itinerary; no single order of events across the four Gospels is claimed", which numbered parts in a harmony's order would contradict; each part's notes need to say that the order follows the two cited harmonies where the Gospels don't state it, and give the other harmony's placement where they differ (segment-22). ADR-0038 item 3 ("Segments aren't joined into an itinerary or put into one order across the Gospels") and item 6 of its 2026-10-13 update say the same, so the PO would amend them. And under Option 1, each new route needs its own `fromYear` and `toYear` (required by `schema/routes.schema.json`), from sources.

## 11. Optional nits
- **a.** §4.4: replace "clarifies that about forty days in fact separated the resurrection from the ascension" with "says Jesus appeared to them "over a period of forty days"".
- **b.** Part 1 row 7: quote the WEB exactly: "he left Judea and departed into Galilee. He needed to pass through Samaria".
- **c.** §4.1: replace "the order most readers would recognize from a traditional reading of the Gospels" with "the traditional harmony's order (`docs/verification/M5-jesus-journeys.md` §15, S2)".
- **d.** Segment-20's row could add M5-03 research §8's minority proposal that John 5 and 6 once stood in the reverse order. Neither cited harmony follows it.
- **e.** §10: question 7 is answered by §5 of this report. Question 3 is a choice, not a finding (§9, item 2).

## 12. For the PO, before phase 3
- **P1. Amend ADR-0038.** Item 3 says segments aren't "put into one order across the Gospels", and its 2026-10-13 update item 6 says the listing is "not a claim about the order of events". Record that the human's approval of the card on 2026-10-23 changes this for numbered parts. Brief §1.6 ("no full harmonized itinerary") still holds, since no stage or line is added, but the order now follows two harmonies.
- **P2. Decide**, with the human:
  - the listing rule (§4.1);
  - segment-22's placement;
  - five, four or six parts, and the boundaries (§9);
  - the route ids;
  - the look (§9, item 5).
  If you choose listing by arrival, the rows that move need a short re-check.
- **P3. Phase 3.** The GIS Engineer:
  - rewrites `notes[1]` and splits the other notes across the parts;
  - gives each new route sourced years;
  - cites the two new `bib:` entries in the new routes' `sources`;
  - adds both harmonies to the public-domain rows of `docs/LICENSES.md` (line 334) and `ATTRIBUTION.md` (line 52), and to the matching line of `app/src/features/search/sources-credits-content.ts` (line 155), which `npm run test:app` checks against `ATTRIBUTION.md`.

  Suggested names for those three places: "A. T. Robertson's *A Harmony of the Gospels* (1922, transcribed by Project Gutenberg) and Stevens and Burton's *A Harmony of the Gospels for Historical Study* (1904, hosted on the Internet Archive)". Suggested status sentence for `docs/LICENSES.md`: "published before 1929, so they are public domain in the United States; neither book's Bible text (the Revised Version) is quoted."
- **P4. Outside this card.** `resolveRouteStop` puts every disputed stop at candidate 0 (§9, item 5). Please check whether the Routes tab's dots for Bethany beyond the Jordan, Cana, the country of the Gadarenes, Bethsaida and Emmaus already favor that candidate, given that ADR-0042 item 2 hides a place's own pins where the route draws a dot. I didn't check what the tab draws today.

## 13. Checks run
- **Coverage.** A Node script compared the note's §5 table with `routes.json` (ids, ends and passages) and with the 20 line features.
- **WEB.** I compared every phrase the note quotes with `data/reference/engwebp_vpl.txt`.
- **Robertson.**
  - In Gutenberg's text: the front matter, the full outline, the bodies of §34, §37 and §119–122 with the note to §120, and the note on Luke's travel narrative.
  - In the 1922 Doran scan: the title page, the copyright page, the outline and the note to §120.
- **Stevens and Burton.**
  - In the Princeton scan: the front matter, both prefaces, the outline and Appendix I.
  - In the 1904 Michigan scan: the copyright page, the preface and the outline.
  - IA metadata for the first-edition copies.
- **ISBE and WHE.** I read both pages.
- **Repository facts.** The records in `data/locations/`, ADR-0038 and ADR-0041, `BACKLOG.md` (its example matches the note's quotation), the schemas, the validator, the app's `routes-data.ts` and the two test files named in §7.
- **No npm checks.** This branch changes no data, schema or code, so I didn't run them.

**Sign-off.** M5-24's research is signed off once corrections 1–28 are applied as written, or with the same facts. If they're pasted verbatim and nothing else changes, no re-check is needed. No blockers. The choices in §9 stay with the PO and the human.
