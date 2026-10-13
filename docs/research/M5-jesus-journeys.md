# M5 research note — Jesus' well-attested journeys

Research for card `docs/tasks/M5-03-jesus-journeys.md`, phase 1. Written after reading ADR-0038 (the routes model, especially item 3), ADR-0017 (every clause stated by a source opened), ADR-0026 (English names) and ADR-0033 (introduce names). This note is the Research Lead's input to M5-01's data model; it does not depend on that model and adds no data files. Phase 2 (after the PO merges M5-01's schema) encodes this note as data.

## 1. How to read this note

- **Scope.** The four Gospels' own accounts of Jesus' adult ministry, from his baptism to the post-resurrection appearances. The journeys of his childhood with his family (Luke 2:4, 2:39, 2:41-51; Matthew 2:13-23) are out of scope for this card and listed in §4 for the backlog, as the card asks.
- **Segments** (§3) are grouped into five rough phases (early ministry; the Galilean ministry and journeys beyond Galilee; the final journey to Jerusalem; the Passion week in Jerusalem; after the resurrection) purely for readability. This grouping is not a claim about a single, harmonized chronology: §5 explains the order actually proposed for the data.
- **Stops** (§6) are every place a Gospel says Jesus reached or passed through on the way (ADR-0038 item 1; the card's override). A place named only as an unreached destination, or only as a landmark, is not a stop; §4 gives examples. A stop that already has a location record is cited by id, with no re-researched coordinate. A stop with no record gets a full entry: English name, site with coordinates from at least two sources, confidence, today's name, and the passages that name it.
- **Names** follow ADR-0026: the title is the spelling most of the NIV, ESV, NLT, KJV, NKJV and CSB agree on, checked at BibleGateway.com for the verse in question (spellings only, never verse text copied into this note or any record). The WEB text itself is quoted verbatim in `scripture[]`; one new departure from it is proposed (§6.2, Bethphage).
- **Access notes.** Pleiades' live site (`pleiades.stoa.org`) blocks automated fetches with an anti-bot challenge, as the card's tips warn; this note used Pleiades' own bulk CSV redistribution (`pleiades-places-latest.csv.gz`, CC BY 3.0) instead, to find each place's id and representative point. OpenBible.info's own `/geo/places/<slug>` pages return 404 for direct guesses; this note used its GitHub data repository (`data/ancient.jsonl` and `data/modern.jsonl`, CC BY 4.0) instead. Britannica returned HTTP 403 to every request and is not relied on. The International Standard Bible Encyclopedia (1915) opened reliably at `internationalstandardbible.com/<Letter>/<article>.html`. Wikidata's API (`wbsearchentities`, `Special:EntityData`) worked without issue this session. Custodia.org (the Franciscan Custody of the Holy Land, which keeps many of the traditional sanctuaries) and Livius.org both opened reliably; both are "all rights reserved" sites already used elsewhere in the project's bibliography as cite-only sources, so this note restates their facts in its own words and never quotes them.

## 2. The rule applied (ADR-0038 item 3)

> A segment is shown only if a Gospel says that Jesus went from one named place to another, or the passage's context names both ends without doubt, and no Gospel's account conflicts with it. Every Gospel that tells it is cited. Segments aren't joined into an itinerary or put into one order across the Gospels: each stands alone.

This note applies the rule as written, without proposing a change. Three recurring judgment calls came up in applying it, each resolved the same way throughout and flagged wherever it matters:

1. **"Context names both ends without doubt."** Several segments rely on the immediate narrative context naming the "from" rather than the verse of departure itself restating it (for example, Matthew 8:18's "depart to the other side" follows directly from 8:5's "when he came into Capernaum", with no scene change between them). This note treats that as meeting the rule, and says so plainly in each case, rather than silently.
2. **A generic place is not a named place.** "A deserted place", "the wilderness", "the mountain" and similar descriptions recur for different locations across the Gospels and are not proper names a source can give coordinates for. Where the rule's "to" is only such a description, this note does not create a stop for it, even when it keeps the overall segment (§4 explains each case).
3. **Textual variants versus translation choices.** A few places are spelled differently across manuscripts, not just across English versions (for example "Gadarenes"/"Gerasenes"/"Gergesenes", §6.3). ADR-0026 treats manuscript variants differently from spelling choices: the title follows the record's own identification and the WEB, not a version majority. This note flags each such case.

## 3. Candidate segments, checked against the rule

Every segment below met the rule in §2. §4 discusses every candidate this note considered and did not include, with the reason. The segments are grouped into five rough phases purely for readability (§5 explains why, and the order actually proposed).

### 3.1 Phase A — Baptism and the early Judea/Galilee/Samaria ministry

| From | To | Passages | Notes |
|---|---|---|---|
| Nazareth (Matthew: "Galilee") | The Jordan (river) | Matthew 3:13; Mark 1:9 | Mark names Nazareth; Matthew names only "Galilee". Neither names a specific site on the river (§6.2). |
| The Jordan | Galilee | Matthew 4:1,11-12; Mark 1:12-14; Luke 4:1,14 | All three name a 40-day stay "in the wilderness" between these two; "the wilderness" is not a stop (§2 item 2, §4). |
| Bethany beyond the Jordan | Cana of Galilee | John 1:28,43; 2:1 | 1:43 names only "Galilee"; 2:1 narrows this to the specific town. |
| Cana | Capernaum | John 2:12 | The card's own example. |
| Capernaum | Jerusalem (the Passover) | John 2:13 | |
| Jerusalem | The land of Judea | John 3:22 | A region outside the city, distinct from the city itself, which John 2-3's own setting (Jerusalem, at the Passover and Nicodemus's visit) already establishes before this verse moves to the surrounding countryside. |
| Judea | Sychar, through Samaria | John 4:3-5 | The card's own example. |
| Sychar | Cana of Galilee, through Galilee | John 4:43,45-46 | 4:46-54's healing of the official's son does not continue this segment: only the official and the message travel to Capernaum (4:49-51); Jesus himself stays at Cana (§4). |
| Nazareth | Capernaum | Matthew 4:13; Luke 4:16,28-31 | Independent of the Cana-Capernaum route just above: Matthew places this right after the temptation, and Luke's own Nazareth-rejection scene (4:16-30) is also early in its narrative. This note does not assert these describe the same occasion as each other or as the Cana route (§8). |

### 3.2 Phase B — The Galilean ministry and journeys beyond Galilee

| From | To | Passages | Notes |
|---|---|---|---|
| Galilee (Capernaum) | Jerusalem (a feast) | John 5:1 | The feast is unnamed. Textual authorities are divided over whether the earliest Greek text had a definite article before "feast" (`bib:isbe-chronology-nt`); this note does not depend on which feast it was. |
| Jerusalem | The other side of the Sea of Galilee | John 6:1 | John's own "after these things" ties this to the Jerusalem scene just before it; some scholars have read the Jerusalem-to-Galilee transition between chapters 5 and 6 as unusually abrupt and proposed that the chapters originally stood in a different order (§8). This note keeps the text's own chapter order. |
| The other side of the Sea of Galilee | Capernaum | John 6:16-17,22-25,59 | The crowd itself "came to Capernaum, seeking Jesus" (6:24), and 6:59 confirms the discourse that follows was taught "in Capernaum". |
| Galilee (Capernaum) | Jerusalem (the Feast of Booths, secretly) | John 7:1-14 | 7:14 confirms arrival: "Jesus went up into the temple". |
| Capernaum | Nain | Luke 7:1,11 | "Soon afterwards" ties 7:11 to the Capernaum scene just before it. |
| Capernaum (by context) | The country of the Gadarenes/Gerasenes/Gergesenes | Matthew 8:18,28; Mark 4:35-5:1; Luke 8:22,26 | Matthew's own chapter keeps one continuous scene from "when he came into Capernaum" (8:5) to "depart to the other side" (8:18), naming no change of place between them. Mark and Luke's immediate context names only "the other side"/"the other side of the lake", which does not conflict. See §6.3 for the disputed identity of this region. |
| The country of the Gadarenes/etc. | Capernaum (Matthew: "his own city") | Matthew 9:1; Mark 5:21; Luke 8:40 | Mark and Luke say only that Jesus "crossed back over"/"returned", without naming the town; this does not conflict with Matthew's "his own city", already established as Capernaum at 4:13. |
| Galilee (by context) | Nazareth ("his own country") | Matthew 13:54; Mark 6:1 | Neither Gospel names Nazareth in this verse, only "his own country"/"his own country[side]"; given Matthew 2:23 and 4:13 already establish Nazareth as that country in the same Gospel, and Luke 4:16,23-24 independently names Nazareth for a comparably-themed rejection scene ("no prophet is acceptable in his hometown"), this note treats the destination as Nazareth. The "from" is only "from there", referring back to the parables discourse (13:1, by the sea) without naming a town. Whether this is the same visit as Luke 4:16-30 or a second one is a question this note does not resolve (§8). |
| Galilee | The region of Tyre and Sidon | Matthew 15:21; Mark 7:24 | The text names a region bounded by two cities, not a single town (ADR-0038 item 1); see §6.2. |
| The region of Tyre and Sidon | The Sea of Galilee, through the region of Decapolis | Mark 7:31 | The card's own example. Decapolis is named as the region passed through, not a stop reached (ADR-0038 item 1); see §6.2. |
| The Sea of Galilee (by context) | Magdala (Matthew: "Magdala"; Mark: "Dalmanutha") | Matthew 15:39; Mark 8:10 | The existing `magdala` record already treats Magdala, Magadan and Dalmanutha as naming the same area; not re-derived here. |
| Magdala/Dalmanutha | Bethsaida | Mark 8:13,22 | Matthew's parallel (16:5) says only "the disciples came to the other side", naming no town; this does not conflict with Mark's naming of Bethsaida. |
| Bethsaida | Caesarea Philippi | Mark 8:27; Matthew 16:13 | Matthew names only the destination, not Bethsaida as the starting point; see previous row. |
| Caesarea Philippi | Capernaum, through Galilee | Mark 9:30,33; Matthew 17:22-24 | Both Gospels name Capernaum as the destination and Galilee as the region they were in on the way (Mark: "passed through Galilee", 9:30; Matthew: "staying in Galilee", 17:22). |

See §6.3 for the disputed site discussion ("the country of the Gadarenes/Gerasenes/Gergesenes") and §4 for candidates not included from this phase (for example, the mountain of the Transfiguration, and the healed man's own activity "in Decapolis", Mark 5:20).

### 3.3 Phase C — The final journey to Jerusalem

| From | To | Passages | Notes |
|---|---|---|---|
| Galilee | Jericho, through the region beyond the Jordan | Matthew 19:1,20:29; Mark 10:1,46 | Matthew and Mark both name Galilee as the "from" and name the intervening region ("the borders of Judea beyond the Jordan"/"the borders of Judea and beyond the Jordan") without naming a town in it; this note does not make that region its own stop (§4). Luke does not parallel "departed from Galilee" directly, but 17:11 separately notes Jesus "passing along the borders of Samaria and Galilee" on the way to Jerusalem, which does not conflict. |
| Jericho | Bethphage and Bethany, at the Mount of Olives | Matthew 20:29,21:1 (names only Bethphage); Mark 10:46,11:1; Luke 18:35,19:1,19:28-29 | Mark and Luke name both villages together; Matthew names only Bethphage at this point (it names Bethany separately the next day, 21:17). |
| Bethphage/Bethany, at the Mount of Olives | Jerusalem | Matthew 21:1-10; Mark 11:1-11; Luke 19:28-45; John 12:12-16 | The triumphal entry. John's own account of this day does not mention Bethphage or the Mount of Olives by name; it instead continues directly from Bethany (12:1), which does not conflict with the Synoptics' added detail. |
| Jerusalem (the Feast of Dedication) | Bethany beyond the Jordan | John 10:22-23,40 | "The place where John was baptizing at first" (10:40) refers back to "where John was baptizing" at 1:28, naming the same place as Phase A's first stop. |
| Bethany beyond the Jordan | Judea, then Bethany (near Jerusalem) | John 11:7,17-18 | John itself distinguishes this Bethany ("near Jerusalem, about fifteen stadia away", 11:18) from Bethany beyond the Jordan; the existing `bethany` and `bethany-beyond-the-jordan` records already keep them as two separate places. |
| Bethany (near Jerusalem) | Ephraim | John 11:54 | The card's own example. |
| Ephraim | Bethany (near Jerusalem) | John 12:1 | The card's own example (worded there as "John 11:54 (to Ephraim)"; this is the return leg). |

This phase's last four rows (John 10:40 through 12:1) describe a different route to Bethany than the Synoptics' Jericho-based approach in this phase's first three rows: John has Jesus coming from Ephraim, north of Jerusalem, rather than from Jericho and the Jordan valley to its east, and never mentions Jericho in this context. This note records each Gospel's own account without asserting how, or whether, the two fit into a single itinerary (brief §1.6).

### 3.4 Phase D — Jerusalem: the Passion week

| From | To | Passages | Notes |
|---|---|---|---|
| Jerusalem | Bethany (overnight, repeated through the week) | Mark 11:11-12,15,19-20,27; Matthew 21:17-18 | Mark narrates Jesus lodging at Bethany and returning to the temple each day; Matthew's "went out of the city to Bethany, and camped there... as he returned to the city" (21:17-18) matches. Luke and John do not narrate a daily Bethany commute during this week. |
| Jerusalem (the upper room) | The Mount of Olives/Gethsemane | Matthew 26:30,36; Mark 14:26,32; Luke 22:39; John 18:1 | All four name the Mount of Olives, and both Matthew ("a place called Gethsemane") and Mark ("a place which was named Gethsemane") separately name the specific spot there; John names only "the brook Kidron" and "a garden", which does not conflict. |

### 3.5 Phase E — After the resurrection

| From | To | Passages | Notes |
|---|---|---|---|
| (the road from Jerusalem, joined already in progress) | Emmaus | Luke 24:13-29 | The text frames this as the two disciples' own journey, already under way when "Jesus himself came near, and went with them" (24:15); it does not say Jesus departed from Jerusalem at the same time or place they did. Jesus does reach Emmaus with them (24:28-29), so this note counts his arrival there as attested, while flagging that the departure itself is the two disciples', not explicitly his (the card's own question). The existing `emmaus` record's four candidate sites are kept as they are (§6.1, §8). |
| Jerusalem | Bethany (the ascension) | Luke 24:50-51 | |
| Jerusalem | Galilee | Matthew 28:16; John 21:1 (as "the sea of Tiberias") | Mark 16:7, part of the earlier-attested 16:1-8 (§8), has a young man at the tomb predict this same return to Galilee. Luke does not narrate a Galilean appearance; its resurrection appearances are all set in or near Jerusalem. This note does not resolve how the Gospels' accounts of the appearances relate (§8). |

## 4. What was left out, and why

- **The journeys of Jesus' childhood with his family.** Out of scope for this card (the card's own instruction): Nazareth to Bethlehem for the census (Luke 2:4); Bethlehem/Jerusalem to Egypt and back to Nazareth (Matthew 2:13-23); the family's yearly trips to Jerusalem for the Passover (Luke 2:41), including the one where the twelve-year-old Jesus stayed behind (Luke 2:41-51). Listed here for the backlog, as the card asks.
- **Sequences only a harmony of the Gospels would give.** Where fitting two Gospels' accounts together into one sequence requires an assumption neither text states, this note keeps the accounts separate rather than joining them (brief §1.6). The clearest examples are the two different final approaches to Jerusalem (§3.3's note, Jericho versus Ephraim) and the two Nazareth-Capernaum/Nazareth-rejection accounts (§3.1, §3.2, §8); in both cases this note records what each Gospel says without proposing how, or whether, the two fit together.
- **Luke's "travel narrative" (9:51-19:27).** Luke 9:51 states a direction ("he intently set his face to go to Jerusalem") but the long middle section rarely names a specific place reached. The few places it does name are either regions passed through without a town named (17:11, "the borders of Samaria and Galilee") or villages the passage itself leaves unnamed (10:38, a "certain village" many readers identify with Bethany by comparing John 11-12, which Luke itself does not say). This note counts only the section's clearly named ends, already covered in Phase C (Jericho, Bethphage, Bethany, Jerusalem), as segments.
- **Circuits with no named destination.** Several passages describe Jesus traveling without naming where to: "Let's go elsewhere into the next towns" (Mark 1:38, continuing "he went into their synagogues throughout all Galilee", 1:39); "he went about through cities and villages" (Luke 8:1); "he went on his way through cities and villages... traveling on to Jerusalem" (Luke 13:22, part of the travel narrative just above). None names a specific "to".
- **The mountain of the Transfiguration.** Matthew 17:1 and Mark 9:2 both place this "six days" after their own Caesarea Philippi scene; Luke 9:28 places it "about eight days" after the same conversation (Peter's confession), without itself naming Caesarea Philippi. All three name only "a high mountain" (Matthew, Mark)/"the mountain" (Luke). Traditions and scholars differ over whether this was Mount Tabor or a slope of Mount Hermon, near Caesarea Philippi; since the text itself does not name the mountain, this note does not add it as a stop (the card's own rule: a place named only as a landmark is not a stop).
- **"A deserted place" and similar generic descriptions**, recurring for different locations (for example Mark 1:35, 6:31-32; Luke 4:42; Matthew 14:13), are not proper names and are not made into stops.
- **The crossing after the feeding of the five thousand (Matthew 14:13-34; Mark 6:31-53).** Both Gospels agree the party landed at Gennesaret (Matthew 14:34; Mark 6:53), but neither names the departure point: it is only "a deserted place" (Mark 6:31-32; Matthew 14:13). Mark's own account additionally has the boat first sent "to Bethsaida" (6:45), a destination superseded in the same account by the actual landing at Gennesaret; John's parallel (6:17) names Capernaum as the boat's destination instead. Luke's parallel (9:10-17) is the only Gospel that names the feeding's own location, "a city called Bethsaida", but Luke does not narrate this crossing at all. Combining Luke's place name with Matthew and Mark's narration of the crossing would need the two accounts joined, which this note does not do; since neither Matthew nor Mark names the "from" on its own, this note does not add a segment or a stop for this crossing (compare the separately-attested arrival at Bethsaida in Mark 8:22, kept in Phase B).
- **Mark 5:20, the healed man's own activity.** "He went his way, and began to proclaim in Decapolis how Jesus had done great things for him" describes the healed man's travels, not Jesus's own; Jesus leaves the region by boat in the same episode (5:18) without the text saying he toured Decapolis himself. Compare Mark 7:31, kept in Phase B, where Jesus himself is said to pass through the region.
- **Chorazin.** Named only in a denunciation alongside Bethsaida and Capernaum ("Woe to you, Chorazin! Woe to you, Bethsaida!", Matthew 11:21; Luke 10:13), which implies Jesus had done "mighty works" there at some point but does not narrate a journey to it.
- **"The wilderness" of the temptation, and "the borders of Judea and beyond the Jordan".** Both are named in segments this note keeps (Phase A's second row; Phase C's first row), but neither becomes its own stop: no source gives either a representative point as the Gospels name them (a generic "wilderness", and a border region rather than a single place), unlike Decapolis, which two independent sources do give a point for (§6.2).

## 5. Proposed order

This note proposes listing the segments in the order they already appear in §3: grouped into the five phases named there (early ministry; the Galilean ministry and journeys beyond Galilee; the final journey to Jerusalem; the Passion week; after the resurrection), and within each phase, ordered by each segment's first passage, in canonical book order (Matthew, Mark, Luke, John) and then by chapter and verse.

The five-phase grouping is as uncontroversial as any division of the ministry can be: every Gospel and virtually every scholarly account agrees the baptism precedes the Galilean ministry, which precedes a final journey to Jerusalem, which precedes the Passion week, which precedes the resurrection. Ordering strictly by first passage within each phase, rather than across all of them at once, avoids a stranger result that a single flat sort would give: John's early Judean and Samaritan ministry (chapters 1-4), which most readers place early in the ministry, would otherwise sort after the entire text of Matthew, Mark and Luke, since John is the last-listed Gospel. Both levels of this ordering are a neutral, mechanical convention for listing the segments, not a claim about the order in which the underlying events actually happened: this note's own discussion already shows the Gospels do not always narrate events in the same order as each other (for example, Luke's placement of the Nazareth-rejection scene, §3.1 and §3.2's notes, or the Mark 5/John 6 question, §8).

## 6. Stops

### 6.1 Stops with an existing record

| Record id | Name(s) in the text | Phase/passages |
|---|---|---|
| `nazareth` | Nazareth | A (Matthew 3:13 context; Matthew 4:13; Mark 1:9), B ("his own country", Matthew 13:54; Mark 6:1) |
| `galilee` | Galilee | A (Matthew 4:1-12; John 1:43, 4:3,45), B (Matthew 15:21; Mark 7:24, as "from"; Mark 9:30; Matthew 17:22, region passed through), C (Matthew 19:1, region passed through) |
| `judea` | Judea ("the land of Judea") | A (John 3:22, 4:3), C (John 11:7) |
| `samaria` | Samaria | A (John 4:4, region passed through) |
| `sychar` | Sychar | A (John 4:5) |
| `cana` | Cana of Galilee | A (John 1:43-2:1, 2:12, 4:46) |
| `capernaum` | Capernaum | A (John 2:12-13), B (John 6:17,24,59; Luke 7:1; Matthew 8:18/9:1; Mark 9:33), C (Matthew 19:1 context) |
| `jerusalem` | Jerusalem | A (John 2:13), B (John 5:1, 7:1-14), C (John 10:22-23,40; 12:12-16), D (both rows), E (Luke 24:50; Matthew 28:16 context) |
| `sea-of-galilee` | The Sea of Galilee | B (John 6:1; Mark 7:31) |
| `nain` | Nain | B (Luke 7:11) |
| `magdala` | Magdala/Magadan/Dalmanutha | B (Matthew 15:39; Mark 8:10) |
| `bethsaida` | Bethsaida | B (Mark 8:13,22,27) |
| `caesarea-philippi` | Caesarea Philippi | B (Mark 8:27; Matthew 16:13) |
| `tyre` | Tyre | B (Matthew 15:21; Mark 7:24, part of "Tyre and Sidon") |
| `jericho` | Jericho | C (Matthew 19:1/20:29; Mark 10:46) |
| `bethany-beyond-the-jordan` | Bethany beyond the Jordan | A (John 1:28,43), C (John 10:40) |
| `bethany` | Bethany (near Jerusalem) | C (John 11:1,17-18,54 context; 12:1), D (Mark 11:11-12 context; Matthew 21:17), E (Luke 24:50) |
| `mount-of-olives` | The Mount of Olives (Matthew/Mark: "Bethsphage and Bethany, at the Mount of Olives") | C (Matthew 21:1; Mark 11:1; Luke 19:29), D (Matthew 26:30; Mark 14:26; Luke 22:39) |
| `gethsemane` | Gethsemane | D (Matthew 26:36; Mark 14:32) |
| `emmaus` | Emmaus | E (Luke 24:13) |

### 6.2 New stop entries

Each entry gives the proposed id and English name, the site with coordinates (`lon, lat`) and sources, a confidence, today's name, and the passages that name it. Every coordinate below was checked directly against at least two independently-opened sources.

| Proposed id | English name | Site (lon, lat) | Confidence | Sources | Today | Passages |
|---|---|---|---|---|---|---|
| `the-jordan` | The Jordan (river) | 35.558333, 31.761389 | low | `openbible:jordan`, `wikidata:Q40059` | The Jordan River, on the border of Israel/the West Bank and Jordan | A (Matthew 3:13; Mark 1:9) |
| `sidon` | Sidon | 35.37279, 33.561947 | high | `pleiades:678393`, `wikidata:Q163490` | Sidon (Saida), Lebanon | B (Matthew 15:21; Mark 7:24, named with Tyre) |
| `decapolis` | Decapolis | 35.8, 32.716667 | medium | `wikidata:Q823244`, `openbible:decapolis`, `bib:isbe-decapolis` | Parts of modern Jordan, Israel and Syria | B (Mark 7:31) |
| `ephraim` | Ephraim | 35.299196, 31.954665 | high | `pleiades:687896`, `wikidata:Q931667`, `openbible:ephraim-2`, `bib:isbe-ephraim` | Taybeh, West Bank | C (John 11:54, 12:1) |
| `bethphage` | Bethphage | 35.250778, 31.777222 | medium | `wikidata:Q2193088`, `openbible:bethphage`, `bib:isbe-bethphage`, `bib:custodia-bethphage` | Et-Tur (Kafr et-Tur), on the Mount of Olives ridge, East Jerusalem | C (Matthew 20:29-21:1; Mark 10:46-11:1; Luke 18:35-19:29) |

**On "The Jordan".** Neither Matthew 3:13 nor Mark 1:9 names a specific site on the river; this note does not identify it with the Bethany-beyond-the-Jordan site named later in John 1:28, since no Gospel states that connection (the existing `bethany-beyond-the-jordan` record's own history already makes the same point about Matthew 3:13). The coordinate above is a dataset's generic representative point for the river as a whole (OpenBible.info's own point sources to the same Wikidata item, so this is one view, not two independent ones; this note's low confidence reflects that, not a dispute over a candidate site).

**On the proposed title "Bethphage".** WEB spells this "Bethsphage" at all three passages (Matthew 21:1; Mark 11:1; Luke 19:29); all six compared versions (NIV, ESV, NLT, KJV, NKJV, CSB) read "Bethphage" at Mark 11:1, with no footnoted manuscript variant at that word in any of them. This looks like a transliteration choice specific to WEB rather than a manuscript difference, so this note treats it under ADR-0026 as a spelling question and proposes the title **Bethphage**, with WEB's "Bethsphage" kept verbatim wherever a passage is quoted. Please confirm this reading before phase 2 (§9).

**Minor candidate: Abu Dis, for Bethphage.** The International Standard Bible Encyclopedia's own article judges the Et-Tur/Kefr et-Tur site above "much more probable than the suggestion that the modern Abu Dis is on the site of Bethphage", since Et-Tur "certainly occupies an ancient site and no other name is known" for it (`bib:isbe-bethphage`). OpenBible.info's own dataset separately scores Et-Tur far above Abu Dis for the same identification. This note records Abu Dis (`openbible:bethphage`, lon 35.265833, lat 31.7625) as a minor, lower-confidence candidate rather than an evenly disputed site.

### 6.3 Disputed site: the country of the Gadarenes/Gerasenes/Gergesenes

The three Synoptic Gospels name this region differently, and the difference is a manuscript question, not only a translation one. WEB reads "the country of the Gergesenes" at Matthew 8:28, and "the country of the Gadarenes" at Mark 5:1 and Luke 8:26. Checking the six compared versions at each verse found the same three-way split: at Matthew 8:28, four (NIV, ESV, NLT, CSB) read "Gadarenes" and two (KJV, NKJV) read "Gergesenes" (matching WEB); at Mark 5:1 and Luke 8:26, four (NIV, ESV, NLT, CSB) read "Gerasenes" and two (KJV, NKJV) read "Gadarenes" (matching WEB). The International Standard Bible Encyclopedia's "Gadara" article confirms this is a real difference between manuscripts, not a translator's choice, and separately rejects a fourth reading found in some late manuscripts ("of the Gergesenes" at Mark 5:1/Luke 8:26, which it calls a reading that "must be rejected", citing the Westcott-Hort critical edition) (`bib:isbe-gadara`). Since this is a manuscript question, ADR-0026 does not call for a version-majority title; this note proposes keeping a plain descriptive title rather than picking one of the three ancient names, and flags the choice for the Fact-Checker and PO (§9).

Three sites are proposed in the sources this note opened:

| Candidate | Site (lon, lat) | Confidence | Support | Sources |
|---|---|---|---|---|
| Kursi (Gergesa) | 35.650415, 32.825796 | medium-high | The only one of the three directly on the lake shore, where "the steep edges of the Bashan plateau drop close upon the brink of the lake", matching the text's "rushed down the steep bank into the sea" (Mark 5:13); a Byzantine-period monastery here has long marked it as the traditional site. The International Standard Bible Encyclopedia's "Gerasa" article identifies the ruins here, which it calls "Kurseh", as what "Gerasa" means in this specific Gospel context; its separate "Gadara" article independently describes Gadara's own territory as extending to "the lands of the subordinate town, Gerasa" in this same lake-adjacent area, distinguishing it there from the far larger, independent Decapolis city of the same name (`bib:isbe-gerasa`, `bib:isbe-gadara`). | `pleiades:726708218`, `wikidata:Q2469418`, `bib:isbe-gerasa` |
| Gadara | 35.677263, 32.65608 | medium | A real Decapolis city (modern Umm Qais), about 6 miles from the lake by the International Standard Bible Encyclopedia's own estimate; its ancient coins show a ship, which the article reads as proof its territory reached the lake, making "country of the Gadarenes" (Mark 5:1; Luke 8:26) a reasonable description even though the city itself is not on the shore (`bib:isbe-gadara`). | `pleiades:678142`, `wikidata:Q1490815`, `bib:isbe-gadara` |
| Gerasa (the Decapolis city, modern Jerash) | 35.891091, 32.280087 | low | The most famous ancient place with this name, but the International Standard Bible Encyclopedia's own "Gerasa" article identifies the Gospel story's "country of the Gerasenes" with the nearer Kursi site (above) instead, describing this famous city's own location and history (far inland, "about 19 miles from" the Jordan River by its own corrected estimate) as a separate matter without connecting it back to the Gospel story (`bib:isbe-gerasa`). | `pleiades:678158`, `wikidata:Q56072866`, `bib:isbe-gerasa` |

## 7. Years of Jesus' ministry

No ancient source gives a date for any of Jesus' journeys directly; what scholarship has produced instead is a reasoned chronology anchored to datable Roman and Jewish events the Gospels mention alongside the ministry. The International Standard Bible Encyclopedia's own detailed reconstruction, which works through the evidence point by point, gives:

| Event | Date (ISBE) |
|---|---|
| Birth of Jesus | 6 BC |
| Death of Herod the Great | 4 BC |
| Baptism of Jesus | AD 26 |
| First Passover of the ministry | AD 27 |
| Death of Jesus | AD 30 |

(`bib:isbe-chronology-nt`, its own "Summary of Dates")

This reasoning starts from Luke's statement that John the Baptist began preaching "in the fifteenth year of the reign of Tiberius Caesar" (Luke 3:1) and that Jesus "was about thirty years old" at his baptism soon after (Luke 3:23), reasoned together with the length of time the Jerusalem temple had already been under construction when Jesus' first Passover is mentioned ("forty-six years", John 2:20) (`bib:isbe-chronology-nt`). The death of Jesus is placed within Pontius Pilate's term as governor of Judea, which Rome-focused scholarship independently confirms: the historian Jona Lendering's own article on Pilate for Livius.org identifies him as Rome's prefect in Judea for the decade from AD 26 to AD 36 (`bib:livius-pontius-pilate`), consistent with ISBE's own dating of his term (`bib:isbe-chronology-nt`).

**How long the ministry lasted is a separate, debated question**, which this note does not resolve (brief §2.6). The Synoptic Gospels alone give no data to fix the interval between John's imprisonment and the final Passover, though details like standing grain at one point (Matthew 12:1 and parallels) and green grass at another (Matthew 14:15/Mark 6:39/Luke 9:12) suggest at least a year passed between them. John's Gospel is the source of the usual three-year figure, since it names three Passovers across the ministry (2:23; 6:4; 11:55) and, by ISBE's own reading, implies a fourth at an unnamed "feast" (5:1): "the Gospel of John mentions explicitly three Passovers... and probably implies a fourth... thus necessitating a ministry of at least two years and making probable a ministry of three years" (`bib:isbe-chronology-nt`). Whether the unnamed feast of John 5:1 was itself a Passover, or some other feast (the identification is not settled even within the early manuscripts, which disagree on whether the Greek text has a definite article there), is the crux of the two-year-versus-three-year question; ISBE's own discussion sets out both readings without fully resolving it either.

Under ADR-0038 item 7, the route's first year would be AD 26 (following ISBE's own dating of the baptism). Checking the existing timeline data, the stop already in force at that year is the AD 17 stop (Cappadocia becomes a Roman province); AD 26 falls after it and before the next stop, AD 34, so no new timeline stop is needed for this route's start.

## 8. Neutrality notes

This note tries to flag every point where the Gospels' own accounts differ, rather than smoothing over the difference, as each comes up; this section gathers the larger ones in one place.

- **Two different routes to Bethany for the last Passover (§3.3).** The Synoptic Gospels have Jesus approach Jerusalem through Jericho, coming up from the Jordan valley; John has him come from Ephraim, north of Jerusalem, and never mentions Jericho in this context. This note records both without proposing how they fit together.
- **One Nazareth-rejection scene, or two (§3.1, §3.2)?** Luke places a rejection at Nazareth ("no prophet is acceptable in his hometown") near the very start of the Galilean ministry, right after the temptation (4:16-30); Matthew and Mark both place a similarly-themed scene ("a prophet is not without honor, except in his own country") much later, after a long Galilean ministry already narrated (Matthew 13:54-58; Mark 6:1-6). Scholars are divided over whether these are one and the same visit, told at different points for each writer's own structural reasons, or two separate rejections at Nazareth. This note takes no side and lists each as its own segment, in each Gospel's own narrative position.
- **The transition from John 5 to John 6.** John 5 is set in Jerusalem; 6:1 opens "after these things" with Jesus already across the Sea of Galilee, with no travel narrated in between. Some scholars have found this transition unusually abrupt compared to John's other chapter breaks and have proposed that chapters 5 and 6 originally stood in the reverse order (putting the Galilean chapter 6 before the Jerusalem trip of chapter 5), which would remove the jump; this is a minority proposal about the chapters' original order, not a claim that any surviving manuscript has a different order. This note follows the chapters in their universal order and does not take a side.
- **Whether Jesus appeared to the disciples in Galilee after the resurrection.** Matthew (28:16-20) and John (21:1-23) both narrate such an appearance, and a young man at the tomb predicts one in Mark 16:7 (within the part of Mark's ending, 16:1-8, attested in the earliest manuscripts); Luke's resurrection narrative, by contrast, keeps every appearance in or near Jerusalem and does not narrate a Galilean one. This note records the Galilee appearance from the Gospels that narrate it and notes Luke's silence, without proposing a single sequence that fits every account.
- **Disputed sites already in the project's records are not re-litigated here.** Emmaus (four candidate sites), Bethsaida (two candidate sites), and Cana (three candidate sites) all keep the candidates their existing records already give (§6.1); this note's two new disputed entries (the Gadarenes/Gerasenes/Gergesenes region, §6.3; Bethphage's minor Abu Dis candidate, §6.2) follow the same even-handed approach.
- **Traditional sites kept by churches, versus archaeological proposals.** As elsewhere in the project, several of this note's stops are marked today by a church or shrine built over a site a long-standing Christian tradition names (for example Bethphage, Gethsemane, and the traditional Jordan baptism sites), while archaeological and historical-geography work sometimes proposes a different or more precise location nearby. Where this note found both a traditional and an archaeological view (Bethphage, §6.2), it gives each.

## 9. Open questions / proposed refinements for the PO

**No change to the rule itself is proposed.** Applying ADR-0038 item 3 as written needed three recurring judgment calls (§2), each resolved consistently and flagged in place; none of them seemed to call for a different rule, only for care in applying this one. The questions below are about this note's application of it, for the Fact-Checker to check and the PO/human to confirm, not about the rule.

1. **The walk to Emmaus, as the card asks (Luke 24:13).** This note counts Jesus' arrival at Emmaus as attested, since the text says he reached it (24:28-29), while flagging that the departure from the Jerusalem area is the two disciples' own, already under way before "Jesus himself came near" (24:15, §3.5). Please confirm this reading, and whether the segment's "from" should read "Jerusalem" plainly or keep this note's more hedged wording.
2. **Splitting "the region of Tyre and Sidon" into two stops.** This note cites the existing `tyre` record and proposes a new `sidon` stop, following the same pattern the Paul-journeys research note used for "the region of Phrygia and Galatia" (two existing records, cited together). Please confirm this is the right model for a text that names two places together as one region, rather than, for instance, a single combined "Tyre and Sidon" stop.
3. **The Gadarenes/Gerasenes/Gergesenes title (§6.3).** This note proposes a plain descriptive title rather than picking one of the three ancient spellings, since the difference is a manuscript question across all three Synoptic Gospels, not a single spelling ADR-0026 can resolve by version count. Please confirm this approach, or propose a title.
4. **Bethphage's proposed title change from WEB's "Bethsphage" (§6.2).** Based on a six-version comparison at BibleGateway.com finding no footnoted manuscript variant at that word. Please re-check this independently before phase 2 encodes the title.
5. **"The Jordan" as a low-confidence, imprecise stop (§6.2).** This note did not find a source naming a specific site for Jesus' own baptism, and treats the existing `bethany-beyond-the-jordan` record (sourced from John 1:28, a different verse) as a separate matter. Please confirm a generic river point at low confidence is an acceptable stop, or suggest a better-sourced alternative.
6. **Excluding "the wilderness" (the temptation) and "the borders of Judea and beyond the Jordan" as stops (§4).** Both are named in segments this note keeps, but neither got a stop entry, since no source gives either a specific point the way the Gospels name them. Please confirm this line is drawn in the right place, particularly next to Decapolis, which this note did keep as a stop on the strength of two sources giving it a representative point.
7. **The segment count.** This note is thorough rather than minimal: it includes several segments with a weaker "from" than a strict reading might want (for example, "his own country" for Nazareth at Matthew 13:54/Mark 6:1, and the context-based readings flagged throughout Phase B). The human sees the full list at MC9 (ADR-0038 item 3); if any of these feel like they stretch the rule too far, trimming them does not affect any other segment.

## 10. Sources

### New bibliography entries needed in phase 2 (`data/bibliography.json`)

All International Standard Bible Encyclopedia (1915) entries below were opened directly at their own page on `internationalstandardbible.com`.

- `bib:isbe-chronology-nt` — "Chronology of the New Testament", at `C/chronology-of-the-new-testament.html`. Note for whoever opens this page again: its own citation for "three Passovers" in the ministry-length discussion (§7) reads "(Mt 2:23; 6:4; 11:30)" in the site's web conversion, which cannot be right for a clause about the Gospel of John (Matthew has no chapter 11 verse 30 about a Passover, and no chapter 6 verse 4); this note's own prose uses the correct references (John 2:23; 6:4; 11:55) rather than reproducing the apparent encoding error, consistent with a similar issue the Paul-journeys research note found and flagged elsewhere on this same site.
- `bib:isbe-gadara` — "Gadara", at `G/gadara.html` (also covers "Gadarenes", a one-line cross-reference to this article, at `G/gadarenes.html`).
- `bib:isbe-gerasa` — "Gerasa; Gerasenes", at `G/gerasa-gerasenes.html`.
- `bib:isbe-ephraim` — ISBE publishes two "Ephraim" articles; this cites the second, at `E/ephraim-(2).html`, specifically its subsection (2), "The town near the wilderness to which Jesus retired after the raising of Lazarus".
- `bib:isbe-bethphage` — "Bethphage", at `B/bethphage.html`.
- `bib:livius-pontius-pilate` — "Pontius Pilate", by the historian Jona Lendering, Livius.org, opened at `livius.org/articles/person/pontius-pilate/`. Livius.org is a cite-only source under the project's existing rule (custom terms, not an open license); this note restates its facts and never quotes it.

Already-existing entries reused directly (no change needed): `bib:isbe-decapolis`, `bib:custodia-bethphage`, `bib:niv-2011-biblegateway`, `bib:esv-2025-biblegateway`, `bib:nlt-2015-biblegateway`, `bib:kjv-1987-biblegateway`, `bib:nkjv-1982-biblegateway`, `bib:csb-2017-biblegateway`.

**A note on Custodia.org.** This note opened `custodia.org/en/sanctuaries/bethphage` directly to confirm the Franciscan sanctuary's own location description (§6.2); the existing `bib:custodia-bethphage` entry already covers it. Custodia.org's own footer states "Copyright © Custody of the Holy Land - All rights reserved", the same all-rights-reserved status as other cite-only sources already in `docs/LICENSES.md`; this note did not find Custodia.org itself listed there yet, and flags the gap for the Fact-Checker rather than editing that file outside this card's scope.

### Dataset sources (no SOURCES.md changes proposed; their licenses and known issues are already documented there)

- **Pleiades** — bulk CSV dump (`pleiades-places-latest.csv.gz`), CC BY 3.0, accessed via its own sanctioned redistribution after the live site's anti-bot challenge blocked direct page fetches (§1): `pleiades:678142` (Gadara/Pompeia, the Decapolis city), `pleiades:678158` (Gerasa/Antiochia ad Chrysorhoam), `pleiades:678393` (Sidon), `pleiades:687896` (Ephraim/Apheraima), `pleiades:726708218` (Kursi paleochristian basilica).
- **OpenBible.info** — `data/ancient.jsonl` and `data/modern.jsonl` from its GitHub data repository, CC BY 4.0, accessed after its site's own `/geo/places/<slug>` URLs returned 404 for direct guesses (§1): `openbible:jordan`, `openbible:decapolis`, `openbible:ephraim-2`, `openbible:bethphage`.
- **Wikidata** — queried through its API (`wbsearchentities`, `Special:EntityData`), CC0: `wikidata:Q40059` (Jordan River), `wikidata:Q163490` (Sidon), `wikidata:Q823244` (Decapolis), `wikidata:Q931667` (Taybeh, i.e. Ephraim), `wikidata:Q2193088` (Bethphage), `wikidata:Q2469418` (Kursi), `wikidata:Q1490815` (Gadara), `wikidata:Q56072866` (Gerasa).

### WEB verses quoted or read

Pulled from `data/reference/engwebp_vpl.txt` by grep, Gospel by Gospel: Matthew 2:1-28:20 (infancy and ministry passages throughout, as cited in §3-§4); Mark 1:1-16:20; Luke 1:1-24:52; John 1:1-21:1, as cited throughout. Six-version spelling comparisons (NIV, ESV, NLT, KJV, NKJV, CSB) were read directly at BibleGateway.com for Matthew 8:28, Mark 5:1, Luke 8:26 (the Gadarenes/Gerasenes/Gergesenes question, §6.3) and Mark 11:1 (Bethphage, §6.2): spellings and wording only, never verse text copied into this note or any record.
