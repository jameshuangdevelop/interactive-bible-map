# M5-24 research note — Jesus' journeys in a few parts

Research for card `docs/tasks/M5-24-jesus-journey-parts.md`, phase 1. Written after reading the `jesus` route in `data/routes/routes.json`, `docs/research/M5-jesus-journeys.md` and `docs/verification/M5-jesus-journeys.md` (M5-03), ADR-0038 (with its three 2026-10-13/14 updates), ADR-0041 and ADR-0042 in `docs/DECISIONS.md`, and `docs/LICENSES.md`. It proposes how to split the existing 32 well-attested stages into a handful of parts, in what order to list each part's stages, and how the data and the Routes tab could show this. It does not change any data file, any disputed site's ruling, or the rule a stage must meet to appear at all (ADR-0038 item 3); M5-03's own research and verification stand.

## 1. How this note was built

The 32 stages already exist, fact-checked, in `data/routes/routes.json`. M5-03's own note explains that they are listed "in five broad periods every Gospel shares, and within each period by each segment's first passage... a way of listing them, not a claim about when each happened" (the route's own `notes[1]`), and its verification report confirms the periods are segments 1–10, 11–21, 22–28, 29–30 and 31–32 (`docs/verification/M5-jesus-journeys.md` §16, "S2, the order"). This note keeps those five periods as the starting point for "parts" (they already follow the Gospels' own broad order, and the Fact-Checker has already checked their membership), but goes further than M5-03 did: for each part, it proposes an actual order for its stages, not just a listing convention, because the card asks for "its order within the part" with "the evidence for that order" and a confidence. Where that meant deciding how two Gospels' separate accounts relate in time, a judgment call M5-03 deliberately avoided (its brief §1.6: no harmonized itinerary), this note makes the call openly, names the source for it, states a confidence, and gives the alternative where a second cited harmony disagrees.

Three kinds of evidence support an "order within part" claim here, in decreasing strength:
1. **The same Gospel's own continuous text** states or clearly implies the order (for example, "immediately," "again," "from there," or simply the next verse with no change of scene). Marked **high**.
2. **A cited harmony of the Gospels** places two stages from different Gospels in a given order, as part of fitting all four accounts into one reading. Marked **medium**, whether one or both cited harmonies agree, since the order still rests on a scholarly judgment call rather than a verse that states it.
3. **The cited harmonies themselves disagree** on where a stage belongs. Marked **low**; both placements are given.

No stage in this note's proposed order has a *textually certain* placement relative to a stage from a different Gospel; "high" confidence here always means same-Gospel continuity. Only one stage (segment-22, in Part 3) drew real disagreement between the two cited harmonies under an earlier reading of this note; §4.3 explains how the rule below resolves it.

**Where a stage sits.** A stage is listed where its arrival falls in the two cited harmonies: the event its own cited verses tell as reaching the stage's "to" place (for segment-02, Matthew 4:12's "he withdrew into Galilee," not the temptation that opens its own citations; for segment-28, John 12:1's arrival at Bethany, since no Gospel tells when Jesus left Ephraim, John 11:54). Each step between neighbouring rows that crosses from one Gospel's account to another's is marked once, on the row of the stage it places; the other rows of a run from the same Gospel stay high. Listed this way, the two cited harmonies agree on every step between Gospels, segment-22 included: Part 1 runs 01, 05, 06, 07, 08, 09, 02, 10, 04, 03; Part 2's order does not change; and Part 3 runs 25, 26, 27, 22, 28, 23, 24.

## 2. Proposed parts

Five parts, each shown on the Routes tab on its own, as Paul's four journeys already are. Every one of the 32 stages belongs to exactly one part; five parts is the default, and §7 gives a six-part alternative that splits Part 2.

| # | Title | One-sentence summary | Scripture range | Years | Stages |
|---|---|---|---|---|---|
| 1 | **The early ministry in Judea, Galilee and Samaria** | Jesus is baptized by John and tempted in the wilderness, gathers his first disciples, turns water into wine at Cana, and moves between Capernaum, Jerusalem, Judea, Samaria and Galilee before his Galilean ministry is fully under way. | Matthew 3:13–4:13; Mark 1:9-14; Luke 4:1-31; John 1:28–4:46 | AD 26–27 | 10 |
| 2 | **Galilee and the regions beyond it** | From a base at Capernaum, Jesus teaches and heals around the Sea of Galilee, crosses it to the country of the Gadarenes, travels to the borders of Tyre and Sidon, through the region of the Decapolis, and to Bethsaida and the villages of Caesarea Philippi, and twice goes up to Jerusalem for a feast. | Matthew 8:18–17:24; Mark 4:35–9:33; Luke 7:1–8:40; John 5:1–7:14 | AD 27–29 | 11 |
| 3 | **The final journey to Jerusalem** | In John, Jesus withdraws beyond the Jordan after the Feast of Dedication, returns to Bethany to raise Lazarus, withdraws to Ephraim and comes back to Bethany six days before the Passover; in Matthew and Mark, he leaves Galilee and goes up by way of Jericho, through which Luke also has him pass. All four Gospels then tell of his entry into Jerusalem. | Matthew 19:1–21:10; Mark 10:1–11:11; Luke 18:35–19:45; John 10:22–12:12 | AD 29–30 | 7 |
| 4 | **Jerusalem: the last week** | Jesus teaches daily in the temple at Jerusalem and goes out of the city each night (to Bethany, Matthew and Mark say; to the mountain called Olivet, Luke says), until the night of the Last Supper, when he goes out to Gethsemane to pray. | Matthew 21:17–26:36; Mark 11:11–14:32; Luke 21:37–22:39; John 18:1 | AD 29–33 | 2 |
| 5 | **After the resurrection** | The risen Jesus joins two disciples on the road to Emmaus, and later leads his disciples out to Bethany, where he blesses them and is carried up into heaven. | Luke 24:13-51 | AD 29–33 | 2 |

**Sources for the parts themselves** (that this broad order is uncontroversial): the existing route's own sources `bib:isbe-chronology-nt` and `bib:worldhistory-jesus-christ`, already in `routes.json`, which give the baptism, the ministry in Galilee and the last Passover in Jerusalem in that order; for which stages belong together, the main divisions of both cited harmonies (Robertson's Parts VI–XIV; Stevens and Burton's Parts II–IX), which differ from this note's parts at two points: both begin the Galilean ministry with the return to Galilee (Robertson §37; Stevens & Burton §34), so the last stages of Part 1 fall in that division, and both begin the last week with the arrival at Bethany (Robertson §128a) or the entry (Stevens & Burton §119); `docs/verification/M5-jesus-journeys.md` §16 ("S2, the order") for the already-checked five-way split; and, for the order claims this note adds within each part, A. T. Robertson's and Stevens and Burton's harmonies (§6). Every stage's own scripture and attestation sources are unchanged from `routes.json`.

### 2.1 Years, with citations

Robertson's own "Chief Divisions of the Harmony" (pp. xi-xii) gives a "probably" year or range for each of his Parts; this note's years follow those, checked against the already-cited `bib:isbe-chronology-nt` (§I.7, "Summary of Dates": baptism AD 26, first Passover AD 27, death AD 30) and `bib:worldhistory-jesus-christ` (the ministry and death fall under Pontius Pilate, "26-36 CE," and "the common date for the death is between 30-33 CE"), per ADR-0038 item 7.

| Part | fromYear | toYear | Robertson's own words (Chief Divisions) | Check against ISBE/WHE |
|---|---|---|---|---|
| 1 | 26 | 27 | Part VI, "In all parts of Palestine. Probably A.D. 26 and 27" | Matches ISBE's baptism (26) and first Passover (27) exactly |
| 2 | 27 | 29 | Part VII, "Probably A.D. 27 to 29"; Part VIII, "Probably Passover in A.D. 29 to Tabernacles in A.D. 29" | Falls inside Pilate's term (26-36, WHE); ISBE gives no date between the first Passover and the death |
| 3 | 29 | 30 | Part IX, "Probably Tabernacles to Dedication in A.D. 29"; Part X, "Probably Dedication in A.D. 29 to Last Journey in A.D. 30" | Ends at ISBE's own death year (30) |
| 4 | 29 | 33 | Parts XI and XII, "A.D. 30 or 29" | Robertson's own "or 29" sets the floor; raised to WHE's upper bound (33) for the death, since ADR-0038 item 7 asks the range to cover the sources' dates, not stop at Robertson's own point estimate |
| 5 | 29 | 33 | Part XIV, "Forty days from Sunday of Passion Week, A.D. 30 or 29" | Same reasoning as Part 4; forty days (Acts 1:3) does not reach a new year either way |

§7 gives the years for the six-part alternative's split of Part 2; Parts 1, 3, 4 and 5 keep the years above under either grouping.

Parts 4 and 5 are much shorter than the others (two stages each, against seven to eleven). This note keeps them separate because each is a single, well-known, self-contained movement that most readers will recognize on its own (the last week in Jerusalem; the appearances after the resurrection), and because Paul's own shortest journey (the voyage to Rome) already has only eight stages, so a two-stage part is a difference of degree, not of kind. §7 gives the alternative.

## 3. Part titles and candidate sites

No part title or summary above names a disputed site's winning candidate or takes a side on a debated identification. Candidate sites for the five disputed places are listed as the data already has them in §8; this note proposes no change to any of them.

## 4. The proposed order within each part

This section explains the reasoning behind the harder calls. §5 gives the full table for all 32 stages, including the easier ones only briefly noted here.

### 4.1 Part 1 — the early ministry

Both cited harmonies agree on the same order for most of this part: baptism, temptation, John's early Judea/Galilee/Samaria material (Robertson §24-36; Stevens & Burton §19-34), and only then the Synoptic Gospels' own account of Jesus settling at Nazareth and Capernaum (Robertson §37-40; Stevens & Burton §34-37) — the traditional harmony's order (`docs/verification/M5-jesus-journeys.md` §15, S2). Listed by arrival (§1), this puts segment-02 (Bethany beyond the Jordan → Galilee) seventh, not second, since its own citations cover two different moments. Matthew 4:1 and 4:11, Mark 1:12-13 and Luke 4:1 are the temptation, which both harmonies place straight after the baptism (Robertson §25; Stevens & Burton §20) — this stage's departure, not its arrival. Its arrival, Matthew 4:12, Mark 1:14 and Luke 4:14 ("Now when Jesus heard that John was delivered up, he withdrew into Galilee" and its parallels), is placed by both harmonies much later: beside John's own "he left Judea and departed into Galilee" (John 4:3), after the Judean sections (Robertson §34; Stevens & Burton §31, where Matthew 4:12 and Mark 1:14 stand in half-brackets, the book's own sign that "a single sentence or paragraph covers two distinct events or historical occasions"), and again beside John's arrival in Galilee after Samaria (John 4:43-45; Robertson §37, after §36; Stevens & Burton §34). John's text is consistent with this: while Jesus was in Judea, "John was not yet thrown into prison" (John 3:24). This note lists segment-02 right after segment-09 (Judea → Sychar), whose own departure (John 4:3) both harmonies place at that same point (Robertson §34; Stevens & Burton §31); segment-09's own text then continues on to Sychar (Robertson §35; Stevens & Burton §32), which is why it is listed first.

### 4.2 Part 2 — Galilee and the regions beyond it

Most of this part's order is high confidence, because segment-19 and segments 11 through 18 follow the Synoptic Gospels' own order. In Luke, Nain (segment-19, 7:11) comes before the crossing to the Gadarenes (segment-11, 8:22), with no other stage between them. Mark's chapters 5 through 9 run from the Gadarenes' return (segment-12) through Tyre and Sidon (13), the Decapolis (14), Magdala (15), Bethsaida (16) and Caesarea Philippi (17) back to Capernaum (18). From segment-14 on, each stage's own wording picks up from the one before ("again," "immediately"); between segments 12 and 13, Mark tells other movements (6:1; 6:31-53) that are not stages, for the reasons in `docs/research/M5-jesus-journeys.md` §4. Matthew's text has the same order.

The two real judgment calls are where the two journeys up to Jerusalem (segments 20 and 21, both "Galilee → Jerusalem") fit into that chain, since John's text doesn't say where either falls among the Synoptic Gospels' events in Galilee. Both cited harmonies place segment-20 (John 5:1, an unnamed feast) early, right before the Sabbath disputes over the standing grain and the man with the withered hand, which this part's data does not include as stages (Robertson §49, grouped with §50-51; Stevens & Burton §44, grouped with §45-46). The International Standard Bible Encyclopedia's own discussion of the length of Jesus' ministry supports an early date for this feast on different grounds: if the feast was itself a Passover, "the subject of the controversy with the Jews in Jerusalem as well as the season of the year would harmonize with the Synoptic account of the Sabbath controversy in Galilee which probably followed this Passover" (`bib:isbe-chronology-nt`, §I.5). Which feast John 5:1 names is not settled (the article says so plainly: "the identification cannot be made with certainty"), but the order question is separate from that identification, and the two cited harmonies agree on it. Both harmonies also agree that segment-21 (the Feast of Booths, John 7:2; Stevens & Burton's chapter title is "An Autumn Visit to Jerusalem") comes last in this part, after the Caesarea Philippi journey: Robertson places the journey and the arrival (John 7:10, 7:14) in §95-96, after §88-90, and Stevens & Burton place John 7:1-52 in §82, after §80-81. Robertson places John 7:1, the context verse that names Galilee as the start, earlier, in §77, before the withdrawal to Tyre (§78).

### 4.3 Part 3 — the final journey

The Gospels give two different routes to Jerusalem for the last Passover, already noted as such in M5-03's own research (`docs/research/M5-jesus-journeys.md` §3.3's note and §8): the Synoptic Gospels have Jesus come up through Jericho (segments 22 and 23), while John has him withdraw beyond the Jordan after the Feast of Dedication, return to raise Lazarus, withdraw again to Ephraim, and come back to Bethany (segments 25 through 28). Both threads converge at segment-24, the triumphal entry, which all four Gospels tell and which does not conflict (already established in `routes.json`'s own attestation rule for that stage).

Where the two cited harmonies place the Synoptic thread's own departure (segment-22, Galilee → Jericho) differs sharply:
- **Robertson's harmony** reads Matthew 19:1/Mark 10:1 ("departed from Galilee ... into the borders of Judea beyond the Jordan") as a second, later entry into Perea, placed *after* the whole of John's withdrawal-Lazarus-Ephraim sequence (§111-112, 118-119) and a trip that briefly touches Galilee again (§120, built on Luke 17:11, which this project's own data does not cite for any stage). Robertson's note to §120 explains that it "has been reasonably supposed (Wieseler, Clark, and others)" that Jesus "went from that region [Ephraim] northward through Samaria into the southern or southeastern part of Galilee, so as to fall in with the pilgrims going from Galilee through Perea to Jerusalem." On this reading, segment-22 runs from §122 to Jericho at §126, well after segment-27, and segments 22 and 23 are parts of the journey whose end John tells as the arrival at Bethany (segment-28, §128a).
- **Stevens and Burton's harmony** instead reads Matthew 19:1/Mark 10:1, with Luke 9:51-62, as "the final departure from Galilee" (§86), which opens their Perean period, *before* the Feast of Dedication (§92) rather than after it. They place the arrival at Jericho (Matthew 20:29; Mark 10:46) at §115, after the withdrawal to Ephraim (§106), so on their arrangement segment-22 spans the whole of this part.
- Read on their own, Matthew's and Mark's texts have no travel between segment-18 (ending at Capernaum, Mark 9:33; Matthew 17:24) and segment-22 (Mark 10:1's "He arose from there"), only teaching (Mark 9:33-50; Matthew 18). Both harmonies put other material in that gap: Stevens and Burton the Feast of Tabernacles (§82-85, John 7:1-8:59); Robertson most of Luke 9:51-18:14 and John 7:2-11:54 (§93-121).

The two harmonies disagree, then, on where segment-22 *departs* from, relative to John's thread, but agree on where it *arrives*: Robertson's §126 (the arrival at Jericho) falls after his §111-112, 118-119 (segments 25-27); Stevens and Burton's §115 (the same arrival) falls after their §92, 105-106 (segments 25-27). Listed by arrival (§1), both harmonies therefore put segment-22 fourth, after segments 25, 26 and 27; under this note's rule it is no longer low confidence, but medium, like the other cross-Gospel placements in this part. Both harmonies' own words for its *departure* are kept in the table's evidence, for readers who want that reading (brief §2.6).

No Gospel says when Jesus left Ephraim, so segment-28 (Ephraim → Bethany, "six days before the Passover") is also listed by its arrival. Both harmonies place that arrival after the departure from Jericho (Robertson §126-127; Stevens & Burton §115-117) and before the arrival at Bethphage and the entry (Robertson §128b; Stevens & Burton §119), so segment-28 is listed fifth, before segment-23 (Jericho → Bethphage), which continues directly into segment-24, the entry. Within each thread the order is otherwise high confidence (same-Gospel continuity: John 10:40→11:1 for segments 25-26; John 11:54's own "departed... to Ephraim" for 26-27; "as they went out from Jericho" for 22-23).

### 4.4 Parts 4 and 5

High confidence throughout. Segment-29 (the nightly pattern of returning to Bethany) spans the whole week up to the Last Supper, which all four Gospels place before segment-30 (going out to Gethsemane). Segment-31 (the road to Emmaus) is told as happening "that very day" in Luke's own text, before segment-32 (the ascension at Bethany), which Luke narrates as his Gospel's last scene; Acts 1:3, by the same writer, says Jesus appeared to them "over a period of forty days," which Luke 24 alone does not state, but this does not disturb the two stages' narrated order.

## 5. The full table: all 32 stages

Grouped by the proposed part, in the proposed order within it. The stage id matches `data/routes/routes.json` exactly, so this table can be checked stage-by-stage against the data. "Scripture" abbreviates the references already in `routes.json`; it adds nothing new. Confidence is for the **order** shown, not for the stage's own attestation (already checked by M5-03/the Fact-Checker) or for any candidate site's confidence (§8 below covers those separately for the 12 stages without a line).

### Part 1 — The early ministry in Judea, Galilee and Samaria

| Order | Stage | From → To | Scripture | Evidence for this order | Confidence |
|---|---|---|---|---|---|
| 1 | segment-01 | Nazareth → Bethany beyond the Jordan | Matt 3:13; Mark 1:9; John 1:28-29 | Opens the adult ministry in every Gospel and in both cited harmonies (Robertson §24; Stevens & Burton §19). | high |
| 2 | segment-05 | Bethany beyond the Jordan → Cana | John 1:28,43; 2:1-2,11 | John's own continuous text: the Baptist's testimony and the first disciples (ch. 1) lead directly into the Cana wedding (ch. 2); both harmonies place this right after the temptation (Robertson §26-29; Stevens & Burton §21-25). | high |
| 3 | segment-06 | Cana → Capernaum | John 2:12 | Directly continues John's own text ("after this"). | high |
| 4 | segment-07 | Capernaum → Jerusalem | John 2:13 | Directly continues John's own text (the Passover "was at hand"). | high |
| 5 | segment-08 | Jerusalem → Judea | John 3:22 | Directly continues John's own text ("after these things"). | high |
| 6 | segment-09 | Judea → Sychar | John 4:3-5 | Directly continues John's own text ("he left Judea and departed into Galilee. He needed to pass through Samaria"). | high |
| 7 | segment-02 | Bethany beyond the Jordan → Galilee | Matt 4:1,11-12; Mark 1:12-14; Luke 4:1,14 | Its arrival ("withdrew into Galilee," Matthew 4:12; Mark 1:14; Luke 4:14) is placed by both harmonies beside John's own departure from Judea (John 4:1-3; Robertson §34; Stevens & Burton §31) — the same point as stage 6 above (segment-09) — and again beside John's arrival in Galilee after Samaria (John 4:43-45; Robertson §37; Stevens & Burton §34) — see §4.1. | medium |
| 8 | segment-10 | Sychar → Cana | John 4:43,45-46 | Directly continues John's own text ("after the two days"). | high |
| 9 | segment-04 | Galilee → Nazareth | Luke 4:14,16 | Both cited harmonies place John's arrival in Galilee and the healing at Cana (John 4:43-54; Robertson §36, §38; Stevens & Burton §34-35) before the visit to Nazareth (Luke 4:16; Robertson §39; Stevens & Burton §36). Stevens & Burton print Luke 4:14-15 with John 4:43-45 in §34; Robertson prints Luke 4:14 with John 4:1-4 in §34, and again, partly in brackets, in §37. | medium |
| 10 | segment-03 | Nazareth → Capernaum | Matt 4:13; Luke 4:16,28-31 | Directly continues Luke's own text (4:14-31 is one continuous passage); Matthew also tells the move from Nazareth to Capernaum (4:13). Both harmonies place it immediately after stage 9 (Robertson §39-40; Stevens & Burton §36-37). | high |

### Part 2 — Galilee and the regions beyond it

| Order | Stage | From → To | Scripture | Evidence for this order | Confidence |
|---|---|---|---|---|---|
| 1 | segment-20 | Galilee → Jerusalem | John 5:1 | Both cited harmonies place this unnamed feast early, just before the Sabbath disputes over the standing grain and the withered hand, which are not stages in this data (Robertson §49, before §50-51; Stevens & Burton §44, before §45-46). ISBE's own discussion of the ministry's length favors an early date on separate grounds (`bib:isbe-chronology-nt`, §I.5) — see §4.2. Which feast is named is not settled either way; `docs/research/M5-jesus-journeys.md` §8 also records a minority proposal that John 5 and 6 once stood in the reverse order, which neither cited harmony follows. | medium |
| 2 | segment-19 | Capernaum → Nain | Luke 7:1,11 | Directly continues Luke's own text ("soon afterwards"), and comes before the Gadarenes crossing in Luke's own chapter order (7:11 before 8:22). | high |
| 3 | segment-11 | Capernaum → country of the Gadarenes | Matt 8:18,28; Mark 4:35,5:1; Luke 8:22,26 | Continues Luke's own text (8:22, after the Nain and parable material of ch. 7-8); Matthew's and Mark's own chapters also keep this one continuous scene. | high |
| 4 | segment-12 | Country of the Gadarenes → Capernaum | Matt 9:1; Mark 5:21; Luke 8:40 | The return leg of the same episode, in all three Synoptics. | high |
| 5 | segment-13 | Galilee → Tyre | Matt 15:21; Mark 7:24 | Mark's own "from there" and Matthew's own text both continue from earlier material in the same Gospel (its movements, such as Mark 6:1 and 6:31-53, are not stages, for the reasons in `docs/research/M5-jesus-journeys.md` §4); both cited harmonies place this withdrawal after the Gadarenes material (Robertson §78; Stevens & Burton §70). | high |
| 6 | segment-14 | Tyre → Sea of Galilee | Matt 15:29; Mark 7:31 | Directly continues Mark's own text ("again he departed"). | high |
| 7 | segment-15 | Sea of Galilee → Magdala | Matt 15:39; Mark 8:10 | Directly continues Mark's own text ("immediately"). | high |
| 8 | segment-16 | Magdala → Bethsaida | Matt 16:4-5; Mark 8:13,22 | Directly continues Mark's own text ("again entering into the boat"). | high |
| 9 | segment-17 | Bethsaida → Caesarea Philippi | Mark 8:27; Matt 16:13 | Directly continues Mark's own text. | high |
| 10 | segment-18 | Caesarea Philippi → Capernaum | Mark 8:27,9:2,30,33; Matt 16:13,17:1,22,24 | Directly continues Mark's and Matthew's own text through the Transfiguration and the return to Galilee. | high |
| 11 | segment-21 | Galilee → Jerusalem | John 7:1,10,14 | Both cited harmonies place this visit to the Feast of Booths (John 7:2) after the Caesarea Philippi journey and the return to Capernaum: Robertson §95-96 (John 7:10, 7:14), after §88-90; Stevens & Burton §82 (John 7:1-52), after §80-81. Robertson places John 7:1, the context verse, earlier, in §77. | medium |

### Part 3 — The final journey to Jerusalem

| Order | Stage | From → To | Scripture | Evidence for this order | Confidence |
|---|---|---|---|---|---|
| 1 | segment-25 | Jerusalem → Bethany beyond the Jordan | John 10:22-23,40 | Directly continues John's own text (the withdrawal after the Feast of Dedication); Robertson opens his Later Perean Ministry with this withdrawal (§112, after the feast, §111); Stevens & Burton place it within §92, after their final departure from Galilee (§86), which is segment-22's start (see §4.3). | high |
| 2 | segment-26 | Bethany beyond the Jordan → Bethany | John 11:7,17-18 | Directly continues John's own text ("a certain man was sick," immediately after the withdrawal). | high |
| 3 | segment-27 | Bethany → Ephraim | John 11:54 | Directly continues John's own text, after the raising of Lazarus and the Sanhedrin's plot. | high |
| 4 | segment-22 | Galilee → Jericho | Matt 19:1,20:29; Mark 10:1,46 | Robertson (followed here) places it after segment-27 and a journey by way of Samaria and Galilee (§122-126, after §119-121). Stevens & Burton place its departure first (§86, "The final departure from Galilee," before the Feast of Dedication, §92) and its arrival at Jericho after the withdrawal to Ephraim (§115, after §106). Listed by arrival (§1), both harmonies put it here; see §4.3 for the departure disagreement and Stevens & Burton's own reading. | medium |
| 5 | segment-28 | Ephraim → Bethany | John 12:1 | Directly continues John's own text ("six days before the Passover"), after segment-27. No Gospel says when Jesus left Ephraim, so the stage is listed by its arrival (§1). Both harmonies put that arrival after the departure from Jericho (Robertson §126-127; Stevens & Burton §115-117) and before the arrival at Bethphage and the entry (Robertson §128b; Stevens & Burton §119). | medium |
| 6 | segment-23 | Jericho → Bethphage | Matt 20:29,21:1; Mark 10:46,11:1; Luke 18:35,19:1,28-29 | Directly continues the same Synoptic text as segment-22 ("as they went out from Jericho"), and continues directly into segment-24. | high |
| 7 | segment-24 | Bethphage → Jerusalem | Matt 21:10; Mark 11:11; Luke 19:37,41,45; John 12:1,12 | The triumphal entry: all four Gospels converge here, directly continuing from both segment-23 (the Synoptics' approach) and segment-28 (John's). | high |

### Part 4 — Jerusalem: the last week

| Order | Stage | From → To | Scripture | Evidence for this order | Confidence |
|---|---|---|---|---|---|
| 1 | segment-29 | Jerusalem → Bethany | Mark 11:11-12,15,19-20,27; Matt 21:17-18; Luke 21:37 | Directly continues from the triumphal entry (segment-24) in Mark's and Matthew's own text, and covers the nightly pattern of the rest of the week, before the Last Supper. | high |
| 2 | segment-30 | Jerusalem → Gethsemane | Matt 26:30,36; Mark 14:26,32; Luke 22:39; John 18:1 | All four Gospels place this directly after the Last Supper, the last event of segment-29's week. | high |

### Part 5 — After the resurrection

| Order | Stage | From → To | Scripture | Evidence for this order | Confidence |
|---|---|---|---|---|---|
| 1 | segment-31 | Jerusalem → Emmaus | Luke 24:13,15,28-29,33 | Luke's own text places this "that very day" (the day of the resurrection). | high |
| 2 | segment-32 | Jerusalem → Bethany | Luke 24:50-51 | Luke's own text narrates this after the Emmaus account and the appearance to the gathered disciples, as his Gospel's final scene. | high |

## 6. Sources

All sources below are openly licensed or public domain, and this note opened each one directly at the link given (not a secondary summary of it), on 2026-10-23 unless stated otherwise.

1. **The World English Bible (WEB).** The project's only Bible text (ADR-0013), public domain (`docs/LICENSES.md`, confirmed on eBible.org's own pages). The short phrases this note quotes are from the WEB (`data/reference/engwebp_vpl.txt`); all but John 3:24 and 11:1 come from the stages' own passages in `data/routes/routes.json`, which the Fact-Checker's verification report already confirmed matches the WEB exactly for all 101 passages in the route (`docs/verification/M5-jesus-journeys.md` §16: "all 101 passages match the WEB"). This note re-verifies none of them itself.

2. **A. T. Robertson, *A Harmony of the Gospels for Students of the Life of Christ, Based on the Broadus Harmony in the Revised Version*** (New York: George H. Doran Company, 1922; later printed by Harper & Brothers).
   - Opened at Project Gutenberg, eBook #36264: <https://www.gutenberg.org/ebooks/36264>; full plain text at <https://www.gutenberg.org/cache/epub/36264/pg36264.txt>. Gutenberg's text is of a Harper & Brothers printing ("Copyright, 1922, by Harper & Brothers"), and its catalog page states "Public domain in the USA." The Internet Archive's scan of the 1922 George H. Doran Company printing (<https://archive.org/details/harmonyofgospels00robeuoft>) has the same outline, section numbers and titles. It is also catalogued at the Library of Congress (<https://www.loc.gov/item/22019929/>), not opened.
   - Cited by section number ("Robertson §NN"), from its own "Chief Divisions of the Harmony" (starting p. xi) and "Analytical Outline of the Harmony" (starting p. xiii), and from its own four-Gospel "Table for Finding Any Passage in the Harmony" (starting p. xxxiii), which this note used to map every cited verse to its section number.
   - Sections used in this note: §24-40 (Part 1); §44, 49-51, 55-56, 64-69, 77-96 (Part 2); §111-128b, with the note to §120 (Part 3). Exact wording of the titles for the sections quoted or closely paraphrased above is in §4 and the tables in §5.

3. **William Arnold Stevens and Ernest De Witt Burton, *A Harmony of the Gospels for Historical Study: An Analytical Synopsis of the Four Gospels*** (third edition, revised; New York: Charles Scribner's Sons, 1904; first edition 1893–94).
   - Opened at the Internet Archive, item `harmonyofgospels00stev`: <https://archive.org/details/harmonyofgospels00stev>; full OCR text at <https://archive.org/download/harmonyofgospels00stev/harmonyofgospels00stev_djvu.txt>.
   - Checked against a 1904 Scribner printing scanned by the University of Michigan, item `aga1254.0001.001.umich.edu` (<https://archive.org/details/aga1254.0001.001.umich.edu>), which carries only the 1904 notice.
   - Cited by section number ("Stevens & Burton §NN"), from its own "Principal Divisions of the Harmony" (p. 1) and "Analytical Outline of the Four Gospels" (pp. 3-14).
   - Sections used: §18-37 and Appendix I on brackets (Part 1); §41, 44-51, 58-85 (Part 2); §86-119 (Part 3).
   - **Licensing.** The scan first opened (Princeton's copy) is a later printing of the third edition. It carries "Copyright, 1904, by Wm. Arnold Stevens and Ernest DeWitt Burton" and "Copyright, 1932, by Margaret E. Burton"; 1932 is the 28th year after 1904, when a 1904 copyright fell due for renewal. The University of Michigan's 1904 printing carries only the 1904 notice and has the same outline, section numbers and titles for every section this note cites; the third edition's preface says "The number and order of sections remain unchanged" from the first. The third edition was published in 1904, before 1929, so it is public domain in the United States, as `docs/LICENSES.md` rules for the ISBE (1915). Its Bible text is the Revised Version of 1881, which this project doesn't quote (ADR-0013).
   - **Proposed new bibliography entries** (for the GIS Engineer/Fact-Checker to add to `data/bibliography.json`; not added by this note):
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

4. **International Standard Bible Encyclopedia (1915), "Chronology of the New Testament,"** by W. P. Armstrong. Already an accepted, cited source in this project (`bib:isbe-chronology-nt`, already in `routes.json`'s own sources and `data/bibliography.json`), public domain (`docs/LICENSES.md`). Opened again for this note at <https://www.internationalstandardbible.com/C/chronology-of-the-new-testament.html>, specifically §I.5, "Length of Jesus' Ministry," for the point used in §4.2 above. No new bibliography entry is needed; this note only draws on a section of the article not previously quoted in the route's data.

5. **For the five disputed places' candidate sites (§8 below), this note's source is the project's own existing, already-verified location records** (`data/locations/bethany-beyond-the-jordan.json`, `cana.json`, `country-of-the-gadarenes.json`, `bethsaida.json`, `emmaus.json`; all `"status": "verified"`, `"verifiedBy": "fact-checker"`). This note restates what those records already give; it does not re-open or re-derive their own underlying sources (ISBE, Wikidata, Pleiades, OpenBible.info, UNESCO, and others already cited in each record), and proposes no change to any of them.

No other source was opened for this note. ISBE's other already-cited articles on these places (`bib:isbe-gadara`, `bib:isbe-gerasa`, `bib:isbe-bethphage`, `bib:isbe-ephraim`) are not re-opened here, for the same reason as point 5.

## 7. The number of parts: two groupings

The backlog's own example groups the material differently: "the early ministry in Judea and Samaria; Galilee; the journeys north and east of the lake; and the last journey to Jerusalem, with the appearances after the resurrection." This note's Part 2 divides cleanly by period but not by place. By place, the parts would not be contiguous: the crossing east to the Gadarenes (segments 11-12) falls between Nain (segment-19) and the withdrawals north (segments 13-18), and the two journeys up to Jerusalem (segments 20-21) fall at either end. By period, both cited harmonies begin a new main division between segment-12 and segment-13: Robertson's Part VIII, "The Special Training of the Twelve in Districts around Galilee" (§72-95, ending with John 7:10 at §95), and Stevens and Burton's Part VI, "From the Withdrawal into Northern Galilee until the Final Departure for Jerusalem" (§70-85). That split gives six parts in all: segments 20, 19, 11 and 12, then 13 to 18 and 21.

The choice between five parts and six is the PO's and the human's (§10); five stays the default.

### (a) Five parts (this note's default)

As in §2.

### (b) Six parts

Part 2 splits into two, at the same division both cited harmonies draw. Parts 1, 3, 4 and 5 are unchanged from §2 (including their years, §2.1).

| Order | Title | One-sentence summary | Scripture range | Years | Stages |
|---|---|---|---|---|---|
| 2a | **Galilee and the Sea of Galilee** | Jesus goes up to Jerusalem for an unnamed feast, then teaches and heals around Capernaum, Nain and the Sea of Galilee, including a crossing to the country of the Gadarenes and back. | Matthew 8:18–9:1; Mark 4:35–5:21; Luke 7:1–8:40; John 5:1 | AD 27–29 | 4 |
| 2b | **The regions beyond Galilee** | Jesus withdraws north and east beyond Galilee, to Tyre and Sidon, the Decapolis, Bethsaida and the villages of Caesarea Philippi, then returns to Capernaum and goes up to Jerusalem for the Feast of Booths. | Matthew 15:21–17:24; Mark 7:24–9:33; John 7:1-14 | AD 29 | 7 |

**Years, with citations.** Part 2a falls entirely within Robertson's Part VII, "Probably A.D. 27 to 29" (Chief Divisions); this note uses that Part's own bound, since Robertson gives no sharper year for an individual section. Part 2b falls within Robertson's Part VIII, "Probably Passover in A.D. 29 to Tabernacles in A.D. 29," and the very start of Part IX, likewise dated to AD 29 ("Probably Tabernacles to Dedication in A.D. 29"); both ends of Part 2b's own range, by Robertson's own words, are AD 29. Both check against `bib:worldhistory-jesus-christ`'s Pilate's term (AD 26-36) without issue.

Stage order within 2a (20, 19, 11, 12) and 2b (13, 14, 15, 16, 17, 18, 21) is unchanged from §5's Part 2 table; only the part boundary is new.

### A further alternative, not recommended

Merging this note's Parts 3, 4 and 5 ("the last journey to Jerusalem, with the appearances after the resurrection," the backlog's own phrase) would instead give **four** parts, keeping segments 22-32 together as one eleven-stage part. This note does not recommend it (§2's reasoning: the last week in Jerusalem and the appearances after the resurrection are each well-known enough on their own), and it is not one of the two groupings above; it is mentioned here only because the backlog's own wording suggests it.

## 8. The 12 stages without a line

Twelve of the 32 stages carry `noLineReason` instead of `lineId`, because one or both of their places has more than one proposed site and this project's data favors none of them (ADR-0038 item 4). Splitting the route into parts does not change this: the rule, the candidates, and which stages lack a line are all unchanged. This section gives, for each of the five disputed places, the candidate sites as `data/locations/` already has them (§6, point 5), and which stages are affected and why, regardless of which part they fall in. The visual treatment on the map is for the human to choose (the card's own instruction); §8.6 offers options.

### 8.1 Bethany beyond the Jordan — 5 stages (01, 02, 05, 25, 26)

Two candidate sites, on opposite banks of the Jordan River, neither favored:
- **Al-Maghtas / Wadi al-Kharrar** (east bank, Jordan), confidence `medium`. A UNESCO World Heritage Site since 2015, with excavated Roman- and Byzantine-period churches, hermit caves and baptismal structures.
- **Qasr al-Yahud** (on the river's west bank, in the West Bank), confidence `low`. A parallel pilgrimage site with two fifth-century Byzantine churches, less archaeologically investigated.

Regardless of which bank is meant, the Gospels' own order is unaffected: segment-01 (the baptism) opens Part 1; segment-02 (the temptation and, on its later wording, the return to Galilee) is listed seventh in Part 1 (§1, §4.1); segments 25-26 (the withdrawal after the Feast of Dedication, and the move on to raise Lazarus) open Part 3, in that order (§5).

### 8.2 Cana — 3 stages (05, 06, 10)

Three candidate villages, none favored: two in Galilee and one in southern Lebanon:
- **Khirbet Qana**, confidence `disputed`. An excavated Jewish village (Hellenistic through Roman periods) with caves later adapted for Christian pilgrimage; favored by many recent archaeologists.
- **Kafr Kanna**, confidence `disputed`. The traditional site shown to pilgrims and tourists since at least the medieval period; its own first-century archaeological evidence is thinner.
- **Qana** (southern Lebanon), confidence `low`. A minority tradition, mainly in Lebanese Christian communities.

Segment-05 (arriving at Cana for the wedding) and segment-06 (leaving for Capernaum) are stages 2 and 3 of Part 1; segment-10 (returning to Cana from Sychar) is stage 8 (§5).

### 8.3 The country of the Gadarenes (Gerasenes/Gergesenes) — 2 stages (11, 12)

Three candidate sites, reflecting a real difference between the ancient manuscripts over the region's name (not only a translation choice; see the route's own note): WEB reads "Gergesenes" at Matthew 8:28 and "Gadarenes" at Mark 5:1 and Luke 8:26.
- **Kursi (Gergesa)**, confidence `disputed`. The only one of the three directly on the lake shore.
- **Gadara** (modern Umm Qais), confidence `disputed`. A Decapolis city, about 6 miles southeast of the lake by the International Standard Bible Encyclopedia's estimate.
- **Gerasa** (modern Jerash), confidence `low`. The best-known ancient place with this name, but much further inland.

Segments 11 and 12 (the crossing there and back) are stages 3 and 4 of Part 2 (§5).

### 8.4 Bethsaida — 2 stages (16, 17)

Two excavated sites, 2.1 km apart, neither favored:
- **et-Tell**, confidence `disputed`.
- **el-Araj**, confidence `disputed`.

Segments 16 and 17 (arriving at Bethsaida, then going on to Caesarea Philippi) are stages 8 and 9 of Part 2 (§5).

### 8.5 Emmaus — 1 stage (31)

Four candidate sites. The record gives Emmaus Nicopolis as about 160 stadia (roughly 30 km) from Jerusalem, the reading of Codex Sinaiticus, and Qaloniya/Motza and El-Qubeibeh as about 60 stadia, the distance in most Greek manuscripts of Luke 24:13:
- **Emmaus Nicopolis (Imwas)**, confidence `disputed`.
- **Qaloniya / Motza**, confidence `disputed`.
- **El-Qubeibeh**, confidence `low`.
- **Abu Ghosh**, confidence `low`.

Segment-31 is stage 1 of Part 5 (§5).

### 8.6 Visual treatment: options for the PO and the human

The card leaves the look to be decided with the human; this note offers three options. A and B keep today's rule (no line is drawn, and every candidate stays listed). C draws a line, which the card rules out ("Lines stay as they are: no new lines for disputed stages") and ADR-0038 item 4 allows only to a candidate with the strongest support. Any option placed by coordinates needs care: the Routes tab places each stop at the candidate its stage names (`candidateIndex` in `resolveRouteStop`, `app/src/features/routes/routes-data.ts`), which is 0 for every disputed end, so a number at the stop (A), at the midpoint (B) or on a line (C) would sit at one candidate's point, such as Khirbet Qana for Cana or Emmaus Nicopolis for Emmaus.

| Option | Pros | Cons |
|---|---|---|
| **A. Number on the stop itself.** The stage's number appears as a small pill fixed to the destination stop's dot (reusing today's pill style, ADR-0041 item 4), instead of at a line's midpoint. | A numbered stage is visible at its stop even with no line. | Needs new placement logic (anchored to a point, not a line). With two disputed ends (for example segment-05, Bethany beyond the Jordan → Cana), it is not obvious which stop should carry the number. |
| **B. Floating number at the midpoint, no line drawn.** The number pill sits where a line's midpoint would be, computed from the two stops' coordinates, but no line is drawn under it; a visually distinct style (for example a dashed outline, or a lighter tint) marks it as a stage without a line because a site is disputed. | Keeps the same visual position readers already expect for a stage's number; clearly distinct from a drawn line. | A floating number with nothing connecting it may look like a rendering bug rather than a deliberate choice, unless the distinct style is very clear; needs a short legend or the panel's existing "Site disputed" tag to explain it. |
| **C. A short dashed line between the stops, numbered as usual.** One reading of the card's example ("a numbered place with a dashed hint"). | Matches readers' expectation that a number sits on a line; least new logic, closest to today's rendering for stages with a line. | **The human already rejected dashed/dotted lines at MC9** ("No dotted lines please. Just add disclaimers at the end"), which is why ADR-0041 item 3 draws every line solid and item 1 moved every caveat to the end. Using a dashed line here would need the human to revisit that decision specifically for this case (a line that shows no path exists, rather than an uncertain path), which is a different question from the one MC9 decided, but should be put to the human plainly rather than assumed. |

This note does not recommend one of the three; the card asks that the look be decided with the human, and the PO/Frontend Engineer are better placed to prototype and show it (as the card's own "Routes tab" scope item already plans).

## 9. Proposed data shape

**Recommendation: one route per part, like Paul's four.** The reasoning follows.

### 9.1 What changes either way

Regardless of which shape is chosen: the 32 stages' own content (`from`, `to`, `scripture`, `attestation`, `travelMode`, `lineId`/`noLineReason`, `sources`) does not change; only which "part" each belongs to and its order within that part are new. No line in `data/geo/routes-lines.geojson` is added, removed, or has its geometry changed; only the `routeId` property on its existing 20 features (one per stage with a line) would need to match whichever route id now holds that stage.

Three things do change. The route's `notes[1]` says the segments "are not joined into one itinerary; no single order of events across the four Gospels is claimed", which numbered parts in a harmony's order would contradict; each part's notes need to say that the order follows the two cited harmonies where the Gospels don't state it, and give the other harmony's placement where they differ (segment-22). ADR-0038 item 3 ("Segments aren't joined into an itinerary or put into one order across the Gospels") and item 6 of its 2026-10-13 update say the same, so the PO would amend them. And under Option 1, each new route needs its own `fromYear` and `toYear` (required by `schema/routes.schema.json`), from sources (§2.1, §7).

### 9.2 Option 1 — one route per part (recommended)

The `jesus` route becomes five (or six, §7) separate entries in `routes.json`'s `routes` array, each with its own `id`, `title`, `fromYear`/`toYear`, `summary`, `bibleText`, `notes` and `sources`, exactly like `paul-1` through `paul-rome` today. Each keeps `structure: "standalone-segments"` (unchanged: no single order is claimed across stages from different Gospels within a part either, only the order this note proposes, which the data could record via each stage's position in its new route's `stages` array, matching how `paul-1`'s stages are already a plain ordered array).

**Pros:**
- **No schema change.** `schema/routes.schema.json`'s `route` type already supports any number of `route` objects; nothing about today's schema assumes one route per person. The validator's one `structure`-specific rule (`scripts/lib/validator.mjs`, "standalone-segments routes require attestation for every stage") already holds for all 32 stages and needs no new logic.
- **Numbering is free.** Every stage's displayed number already comes from `stageLabelNumber(route.structure, stageIndex)` (`app/src/features/routes/routes-data.ts`), which is simply the stage's position in *that route's own* `stages` array. Splitting into five routes means each part's numbering restarts at 1 automatically, with no new code, exactly as `paul-2`'s first stage is already "Stage 1," not "Stage 15."
- **The existing route-switcher needs no new concept.** The "choose a route" list (`app/src/features/routes/routes-panel.web.tsx`) already renders a flat list of buttons, one per route, each showing its title, year range and stage count; it already works for any number of routes and does not group them by person. Five Jesus parts simply become five more buttons, next to Paul's four.
- **"Fit the map to it" works correctly out of the box** (ADR-0041 item 7): fitting a route to its own stages' stops already means fitting to only that part's places, not all 32, which is the actual goal (the human's complaint was that the map looks "way too busy").
- **Each part can carry its own year range**, which could be more precise than one `fromYear`–`toYear` spanning AD 26-33, if the Fact-Checker finds a source for narrower ranges per part (not attempted in this note).
- **Stage ids can stay unchanged** (`segment-01` through `segment-32`), simply distributed across the five new routes' `stages` arrays, keeping every cross-reference in this note, `docs/research/M5-jesus-journeys.md` and `docs/verification/M5-jesus-journeys.md` traceable without renumbering.

**Cons:**
- **Breaks the single `route=jesus` deep link.** `?tab=routes&route=jesus` (and `&stage=N` on it) would need new ids. Concretely, this project's own tests use it today: `tests/browser/browser-checks.spec.mjs` (three places, including a fixed list of all five routes' ids, titles and an expected stop label, and a `?route=jesus&stage=9` deep link) and `scripts/verify-web-export-playwright.mjs` (several hardcoded `route=jesus` URLs, a `"jesus fitted view"` screenshot, and a `hasCountryOfTheGadarenes` lookup keyed to the `"jesus"` route id). All of these are mechanical updates (new ids, same pattern, one row each), but they are real, counted changes for whichever agent does the data/test work next.
- **`routes-lines.geojson`'s 20 `"routeId": "jesus"` properties** need updating to whichever new route holds each stage (a mechanical, scripted change, not a redesign).
- **The route list grows from 5 entries to 9 or 10** (4 Paul's + 5 Jesus's, or 4 + 6 under §7's six-part grouping), all in one flat list with no visual grouping by person today. This may be worth a small follow-up (for example a "Paul's journeys" / "Jesus' journeys" heading above each person's group in the list), which this note flags as an open question (§10) rather than deciding.

### 9.3 Option 2 — parts inside one `jesus` route

The route stays one entry, but each stage gains a new field (for example `stage.partId`), and the route gains a new `parts` array (each with an `id`, `title`, `summary` and `scripture` range).

**Pros:**
- Keeps `?route=jesus` working as a single, stable top-level id.
- Keeps one `fromYear`/`toYear` for the whole ministry, if that is preferred to five narrower ranges.

**Cons:**
- **Needs a schema change** (`schema/routes.schema.json`): a new `part` definition and a new optional field on `stage`, plus new validator rules (every stage names a valid part; every declared part is used by at least one stage; part ids are unique within the route) that do not exist today and are not needed under Option 1.
- **Stage numbering would not reset per part for free.** Today's numbering is simply the stage's index in `route.stages`; keeping one flat 32-stage array but wanting "Segment 1" at the start of each part means computing a position *within the active part*, not within the route, which is new logic the existing `stageLabelNumber` helper does not do.
- **The deep-link contract would need a new dimension.** Today `?stage=N` is a single integer, matching a flat array index (and the existing tests assert exactly this, for example `expect(urlParams.stage).toBe(String(stageIndex))`); showing one part at a time would need either a new `&part=` parameter, or non-trivial stage identifiers (such as `"3-2"` for "part 3, stage 2"), either of which is a bigger change to the URL contract than Option 1's plain new route ids.
- **"Fit the map to it" would need new logic** to fit only the active part's stops rather than the whole route's 32, where Option 1 gets this correctly for free from the existing per-route fit behavior.
- **The route-switcher list would need a new, two-level UI** (routes, then parts within a route), a new concept not in any ADR today, where Option 1 reuses the existing flat list unchanged.

### 9.4 Recommendation

**Option 1, one route per part.** It needs no schema or validator change, reuses the Routes tab's existing route list, stage numbering, and "fit to route" behavior exactly as Paul's journeys already use them, and keeps the 32 stages' own ids stable for traceability. Its real costs — new route ids in place of `jesus`, and the mechanical updates that follow in two test files and one GeoJSON file — are small and already scoped precisely in §9.2. This also matches the card's own description of the goal: "Each part is shown on its own, as Paul's journeys are."

**Naming the new routes** is an open question (§10): either short numbered ids in Paul's own style (`jesus-1` … `jesus-5`), or descriptive ids (`jesus-early-ministry`, `jesus-galilee`, `jesus-final-journey`, `jesus-passion-week`, `jesus-resurrection`). Either fits the schema's existing id pattern; this note does not choose between them.

## 10. Open questions

1. **Five parts (§2) or six (§7)?** This note recommends five, keeping "the last week in Jerusalem" and "after the resurrection" separate from "the final journey"; the six-part grouping splits "Galilee and the regions beyond it" at the same point both cited harmonies draw a new main division. Either is defensible; the PO/human should decide.
2. **Part titles.** Are the titles proposed in §2 and in §7(b) clear and neutral enough, or should the PO propose different wording (for example naming the regions north and east of the lake more specifically)?
3. **Segment-22's placement — resolved this round.** The PO chose to list every stage by its arrival (§1); under that rule, both cited harmonies agree on segment-22's position (fourth in Part 3, medium confidence, no longer low). Stevens and Burton's own reading of its *departure*, which disagrees with Robertson's, is kept in §4.3 and in the table's evidence for readers who want it (brief §2.6).
4. **Data shape (§9).** Confirms Option 1 (one route per part)? If so, should the new route ids be numbered (`jesus-1`…) or descriptive (`jesus-early-ministry`…)?
5. **Visual treatment for the 12 lineless stages (§8.6).** The card asks that this be shown to the human before merging; this note offers three options without recommending one.
6. **The route list's length.** With five (or six) new Jesus routes alongside Paul's four, should the Routes tab group them by person (a small, separate follow-up), or is a longer flat list acceptable for now?
7. **New bibliography entries (§6).** This round corrects the publisher and link for each (Robertson: George H. Doran Company, 1922, via the Internet Archive scan; Stevens and Burton: the third edition, 1904, via the University of Michigan's scan of that printing). Please add both to `data/bibliography.json`, and to the public-domain rows of `docs/LICENSES.md` and `ATTRIBUTION.md`, in phase 3.
8. **Segment-02's two-moment nature (§4.1).** Out of scope for this card (it is not a disputed site, and the card does not ask to change any stage's own content), but flagged for a future card: the stage's own wording spans both the temptation (right after the baptism) and a later "withdrew into Galilee" moment that both cited harmonies place much later. A future revision could split it into two stages if that is ever judged worthwhile; this note does not propose it now.
