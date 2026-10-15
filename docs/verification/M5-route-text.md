# M5-06 verification: route text and the places the passages name

- **Card:** `docs/tasks/M5-06-route-text.md` (Fact-Checker section) · **Branch:** `data/m5-route-text`
- **Checked:** the GIS Engineer's schema (`9ba154f`) and the Research Lead's data (`57b61ff`), against ADR-0041, ADR-0038 and its two updates, ADR-0017, ADR-0026 and ADR-0033
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-14
- **Method:** every route's `summary`, `bibleText` and `notes` read clause by clause against its sources, opened on 2026-10-14: the WEB in `data/reference/engwebp_vpl.txt`; the International Standard Bible Encyclopedia (ISBE, 1915) at internationalstandardbible.com ("Paul, the Apostle" parts 3 and 5, "Chronology of the New Testament", "Phoenix", "Lasea", "Adramyttium", "Alexandria", "Syrtis", "Sidon (2)", "Gadara", "Gerasa; Gerasenes", "Bethphage", "Trogyllium", "Appii Forum", "Famine", "Taverns, Three"); Zondervan Academic's "Who Were the Galatians?"; World History Encyclopedia's "Jesus Christ"; Bible Gateway (NIV, ESV, NLT, KJV, NKJV, CSB; readings and spellings only, no verse text kept); Pleiades' bulk CSV (2026-10-13); OpenBible.info's `ancient.jsonl` and its Phoenix page; and Wikidata's API. Every stage passage was re-read from the WEB file to list the places it names (§4).

## 1. Results

| Item | Pass | Pass after my corrections | Needs the Research Lead | Question for the PO |
|---|---|---|---|---|
| Route text (5 routes) | — | 5 (C1–C14) | 2 (R2 in `paul-2`; R4 in all five) | Q2 |
| Disclaimers last, neutrality, names introduced | 3 | 2 (`jesus` summary, `alexandria`) | — | — |
| Places in `mentioned` (Bithynia, Adramyttium, Alexandria ×2, Lasea, Phoenix, Syrtis, Sidon ×2) | 9 | — | — | — |
| Places named but missing from `mentioned` | — | — | R1, R2, R3 | Q1 |
| Stop entries (5 new, Sidon changed) | 3 (`adramyttium`, `lasea`, `sidon`) | 3 (`phoenix`, `alexandria`, `syrtis`; C15–C17) | — | — |
| New sources and their licences (3 ISBE articles) | 3 | — | — | — |

All six stop entries are now `verified`. The route text passes after my corrections, except the two items that need new wording from the Research Lead (R2, R4).

## 2. Route text, clause by clause

Unchanged clauses carried over from the old `note` (verified in `docs/verification/M5-paul-journeys.md` and `M5-jesus-journeys.md`) were re-read against their sources and still hold. The routes' `yearNote` fields are unchanged. The modern glosses ("now central Türkiye", "Asia Minor", "the Aegean Sea", "now in Greece") are stated by the verified records and stop entries the stages link to (`galatia`: "Central Türkiye"; `troas`, `asia`: Asia Minor; `samothrace`: "the north Aegean Sea"; the Greek cities' records), so I accept them.

### `paul-1`: pass after C1–C3 and C14
- **Summary:** pass. ISBE "Paul, the Apostle" 5 calls Antioch in Pisidia, Iconium, Lystra and Derbe "the southern divisions of the Roman province of Galatia" and heads the section "The First Great Mission Campaign: Ac 13:1-52 and Ac 14:1-28"; Zondervan's article says "the cities Paul visited on his first missionary journey in Acts 13–14". "Mid-to-late AD 40s": eight of ISBE's ten scholars date the tour between 45 and 49 ("Paul, the Apostle" 3).
- **Bible text:** three fixes. Acts 13:1–3 has "the prophets and teachers" of the assembly fast and pray, not "the believers" (C1). Acts names a synagogue only at Pisidian Antioch (13:14) and Iconium (14:1); at Lystra and Derbe it says only that they preached (14:7, 14:21), so "the synagogues of … Lystra and Derbe" was wrong (C2). "To report what God had done" is Acts 14:27, which no stage or source cited (C3). The rest holds: the stoning (14:19), the return through the same cities (14:21–22).
- **Notes:** pass, and they keep every caveat of the old `note`. Added the path-not-known bullet (C14).

### `paul-2`: pass after C4, C5 and C14; R2 open
- **Summary:** Timothy joined at Lystra (Acts 16:1–3; ISBE: "Here they pick up Timothy"), not at Antioch; the journey crossed all of Asia Minor to Troas, not only its south; and the `macedonia` record places that province in "parts of Greece, North Macedonia and Albania", so not all of it is "now Greece" (C4). "Late AD 40s or early AD 50s" fits ISBE's table (46 to 52 for the start). "From Asia into Europe": ISBE, "Paul is led out of Asia into Europe".
- **Bible text:** "He returned by sea … to Antioch" made the last leg a sea voyage, but stage 14 is `unknown`: Acts 18:22 has Paul land at Caesarea, go up and greet the assembly, and go down to Antioch (C5). Everything else is in Acts 15:36–18:22.
- **Notes:** pass, with every caveat of the old `note`; C14 added. The note on Acts 18:22 (now note 6) needs R2.

### `paul-3`: pass after C14
- **Summary:** pass. Three years at Ephesus (Acts 20:31; ISBE: 3 months and 2 years, 19:8–10); the elders at Miletus and Agabus' warning (ISBE: "warned in dramatic fashion by Agabus … not to go on to Jerusalem", "three premonitions"); "the AD 50s" fits ISBE's table (49 to 54 for the start).
- **Bible text:** pass (18:23; 19:8–10; 20:1–6, 13–17, 25, 38; 21:4, 11, 13).
- **Notes:** pass, with every caveat of the old `note` (Trogyllium: ISBE, "Several of the early manuscripts omit the words"); C14 added.

### `paul-rome`: pass after C6 and C7
- **Summary:** pass. The appeal (Acts 25:10–12, 21), "around AD 60" (ISBE's own date, and six of its ten scholars between 59 and 61), the two years in Rome (28:30–31). It states Caesarea as the start, and note 2 gives the caveat, as ADR-0041 asks.
- **Bible text:** "Acts 27:1–28:16 tells how Paul … set sail from Caesarea", but Acts 27 never names Caesarea, as note 2 itself says; it now reads "set sail for Italy" (27:1) (C6). "Every passenger" became "everyone on board" (27:37, 44) (C6). "Northeasterly": ISBE "Phoenix", "a violent Northeast wind … called Euraquilo". "By road": ISBE "Appii Forum", "the Appian Road".
- **Notes:** the date bullet said 56–62 for the voyage, but the route is 55–62 because the voyage began the year before each arrival (C7). The rest keeps every caveat of the old `note`; notes 4 and 5 (the places named, the ships' home ports) hold (ISBE "Adramyttium": "a ship belonging to Adramyttium").

### `jesus`: pass after C8–C13
- **Summary:** "Scholars commonly place his public ministry from about AD 26" took ISBE's 1915 date as a consensus, while ISBE itself gives AD 28–29 by another count of Tiberius's fifteenth year. World History Encyclopedia states only that "all the gospel writers place the ministry and death of Jesus during the reign of … Pontius Pilate", who "reigned from 26-36 CE", and that "the common date for the death of Jesus falls between 30-33 CE"; the sentence now says that (C8). The third sentence ("Rather than one combined itinerary … each drawn only where …") is a disclaimer, and "drawn" was wrong for the 12 segments without a line; it moved into note 2 as "shown only where a Gospel names both ends" (C8).
- **Bible text:** Matthew 4:1, Mark 1:12 and Luke 4:1 have Jesus led or driven by the Spirit into the wilderness, not "withdrawing" (C9). "Traveled repeatedly between Galilee, Jerusalem, Samaria and the regions around Tyre, Sidon and Caesarea Philippi" overstated the segments: several journeys between Galilee and Jerusalem (John 2:13; 5:1; 7:10), one through Samaria (John 4:4), one each into the regions of Tyre and Sidon and of Caesarea Philippi (C9). "Rose from the dead and appeared to his disciples" now cites Luke 24:34 (C9). The arrest and death: World History Encyclopedia ("he was arrested"; "crucified during the reign of Pontius Pilate"). The ascension: Luke 24:50–51.
- **Notes:** the date bullet repeated the summary's AD 26 claim, and "the exact length of the ministry is debated" goes beyond ISBE, which finds "no data by which the interval … can be fixed with certainty", and gives at least two years and probably three (C10). Note 5 quoted the stop's title as "the country of the Gadarenes" and called it a choice of none, but the stop's title gives all three names (C11). Note 6 still said lines are "marked as a path not known" and covered only stages that end at a region; under ADR-0041 item 3 and the 2026-10-14 update to ADR-0038 (item 3: Sychar → Cana, Caesarea Philippi → Capernaum and Bethany beyond the Jordan → Bethany), a region between two towns makes the path unknown too (C12). Mark 7:31 is a textual difference that touches a place on the map and had no note (C13; §4).

## 3. Disclaimers last, neutrality and names

- **Disclaimers last (ADR-0041 item 1):** the Paul summaries and Bible texts hold content only. Their date sentences give the commonly held dates, and the ranges and caveats are in the notes. In `jesus`, the summary's method sentence was a disclaimer and moved to the notes (C8). No caveat remains outside `notes`.
- **The year note.** Every route's date bullet ends "see the year note above for the comparison", but VISUAL_SPEC §2 lists no year note in the route panel, and the Routes tab on `feat/m5-routes-tab` has `yearNote` in its types but never shows it. As things stand the pointer leads nowhere, and the scholars' views (ADR-0038 item 7: "its notes give each view") reach no reader (R4, Q2).
- **Neutrality (brief §2.6):** pass. The resurrection is reported as what "the Gospels report"; Galatia, Malta/Mljet, Trogyllium and the Gadarenes give each view. The `alexandria` entry's "Luke's narrative in Acts" took the traditional authorship as fact and named Luke without introduction (ADR-0033); it now reads "Acts names" (C16).
- **Names introduced (ADR-0033):** pass. Virgil is "the Roman poet Virgil", Pontius Pilate "the Roman governor of Judea", and the encyclopedias are named in full.

## 4. Places named on each stage (`mentioned`)

I re-read the WEB text of all 83 stages' passages and listed every proper place name.

**The nine `mentioned` entries pass.** Each is named in its stage's passages, and the text doesn't say the travellers reached or passed it: Bithynia (Acts 16:7, "the Spirit didn't allow them"); Adramyttium (27:2); Alexandria (27:6; 28:11); Lasea (27:8); Phoenix (27:12, never reached, 27:13–15); the Syrtis (27:17, feared); Sidon on Jesus' segments 13 and 14 (Matthew 15:21; Mark 7:24, 31; "the region"/"borders of Tyre and Sidon", never the city). The validator confirms that none is also an end or a place passed.

**Mark 7:31 (C13).** The WEB, KJV and NKJV read "departed from the borders of Tyre and Sidon"; the NIV, ESV, NLT and CSB have Jesus go through, or by way of, Sidon (Bible Gateway, read 2026-10-14). The stops follow the WEB (ADR-0038 update of 2026-10-13, item 7), so Sidon stays `mentioned`, and the new note says so.

**The reasons §12 gives for leaving places out:** Bethany and the Mount of Olives (segment 23), Capernaum (John 4:46), the Decapolis, "the wilderness", Phoenicia (Acts 21:2), "the Adriatic Sea" (27:27: the WEB's wording, which §12 calls "the sea of Adria"), Acts 18:22's unnamed place and Lindos are good reasons. The Paul note's reason for the companions' home towns is not: see R1.

**Missing, back to the Research Lead:**
- **R1. Places named for other people.** The WEB names these on the stages below, and the travellers don't reach them on that route: Jerusalem, where John Mark goes back (Acts 13:13, `paul-1` stage 4); Corinth, where Apollos was (19:1, `paul-3` stage 1); Beroea, Thessalonica ("of the Thessalonians") and Derbe, the companions' home towns (20:4, `paul-3` stage 2); and Thessalonica and Macedonia, Aristarchus' home (27:2, `paul-rome` stage 1). §12 leaves out 20:4's places because they "are already stops or `via` elsewhere on these same routes", but only the chosen route is drawn (ADR-0041 item 2), and none of the three is a stop on `paul-3`. 13:13, 19:1 and 27:2 aren't discussed. The card's rule ("every place its passages name by a proper name that the travellers didn't reach") and its own example of the ships' home ports, which uses the same "of X" form as "Sopater of Beroea", point to adding them all, unless the PO rules otherwise (Q1). Each has a verified record, so no new entries are needed.
- **R2. Jerusalem at Acts 18:21 (`paul-2` stage 13).** In the WEB, Paul leaves Ephesus saying "I must by all means keep this coming feast in Jerusalem"; the text doesn't say he got there (18:22). That makes Jerusalem a place this stage names as a goal, like Phoenix, and the note on Acts 18:22 ("without naming a city") needs rewording. It is also a textual difference: the KJV and NKJV have the clause, while the NIV, ESV, NLT and CSB don't, and the CSB's footnote points to other manuscripts. Needs `mentioned` and a reworded note with the difference.
- **R3. The brook Kidron (John 18:1, segment 30).** Jesus and the disciples cross it, and it has no record or stop entry. Under the card's acceptance criterion, §12 of the Jesus note should say it is left out for want of a sourced point.

Not missing: Dalmanutha (Mark 8:10) is one of the `magdala` record's names; Zebulun and Naphtali (Matthew 4:13), Lycia (27:5), Asia (16:6; 20:4; 27:2), Syria (18:18; 20:3; 21:3), Italy (27:1, 6), Solomon's porch (John 10:23) and Cyprus (21:16) are reached or passed on the same route.

## 5. Stop entries

Distances are from the entry's point. Names follow ADR-0026: I checked the six versions at Acts 27:2, 6, 8, 12 and 17.

| Entry | Site (≥2 sources) | Name, `todayName` | Text | Result |
|---|---|---|---|---|
| `adramyttium` | Pleiades 550403, the source (0 km; "located on the modern Karataş peninsula at Ören in Turkey's Balıkesir province"); Wikidata Q3605584 0.04 km; OpenBible.info "Oren" 0.37 km | "Adramyttium" in all six versions. "Ören, Balıkesir Province, Türkiye": Pleiades' description and Wikidata's P131 | ISBE: "An ancient city of Mysia in the Roman Province of Asia"; "a good harbor … at the head of the Gulf of Adramyttium facing the island of Lesbos"; "When Pergamus became the capital of Asia, Adramyttium grew to be … the metropolis of the Northwest part of the province. There the assizes were held"; "with its harbor has entirely disappeared"; the village farther inland, "Edremid" | **Pass** |
| `alexandria` | Wikidata Q87, the source (0 km); Pleiades 727070 1.7 km; OpenBible.info 1.7 km, close for a city this size | "Alexandria" in all six. "Alexandria, Egypt" | ISBE: founded "In 331 BC" by Alexander "at the isle of Pharos"; shipbuilding "the greatest industry", its supremacy "maintained during the Roman domination"; "Luke twice speaks of himself and Paul sailing in 'a ship of Alexandria' (Ac 27:6; 28:11)". Fixed the authorship wording (C16) | **Pass after C16** |
| `lasea` | OpenBible.info, the source (0 km); Pleiades 589897 0.65 km; Wikidata Q6492763 0.95 km | "Lasea" in all six. "Faistos Municipality, Crete, Greece": Wikidata P131 and P17 | ISBE "Lasea": "5 miles East of Fair Havens", ruins "examined in 1856", the stores and "the captain's reluctance to winter there"; ISBE "Phoenix": "12 miles South of … Gortyna", "many Jews in Gortyna" | **Pass** |
| `phoenix` | Loutro: Pleiades 589993, the source (0 km); OpenBible.info and Wikidata Q1872352 0.1 km. Finikas: Pleiades 589992, the source (0 km); OpenBible.info and Wikidata Q21773510 0.5 km. The two sites are 1.0 km apart | "Phoenix" in five versions, "Phenice" in the KJV. No `todayName`, though both villages' Wikidata items are in Sfakia Municipality; I added it (C15) | Corrected three things (C15). The quotes gave ISBE's rendering as Acts 27:12's words; the WEB reads "looking southwest and northwest". ISBE's way out of the difficulty was misstated: it reads the phrase as "looking down" those winds, toward the northeast and southeast, or supposes the writer "made a mistake" about a place he never saw. The confidences followed ISBE alone, while OpenBible.info, cited on both, gives the opposite order: "Finikas (modern): 55% confidence", "Loutro (modern): 35% confidence". Both are now `disputed`, as for Bethsaida, and each support gives both sources' views | **Pass after C15** |
| `syrtis` | Pleiades 344491 "Syrtis Maior", the source (0 km; "The Gulf of Sidra"); Wikidata Q187274 and OpenBible.info 16.6 km, close for a gulf | "Syrtis" in five versions; the KJV has "quicksands", not a name. "Gulf of Sidra, Libya": Wikidata label and P17 | ISBE: "sandbanks, off the northern coast of Africa … a source of danger to mariners. Virgil refers to them". "Ancient Libya's coast" wasn't in a source, and Wikidata doesn't identify Acts' Syrtis: only OpenBible.info does ("Sidra"), while Wikidata and Pleiades equate the gulf with Syrtis Maior. Reworded (C17) | **Pass after C17** |
| `sidon` (changed) | Unchanged (verified 2026-10-13): Pleiades 0.13 km, Wikidata 0.36 km | "Sidon" | The new clause, "named in the Gospels alongside Tyre as well as in Acts": ISBE "Sidon (2)", "first when Christ passed into the borders of Tyre and Sidon … (Mr 7:24-30) … Paul … at Sidon (Ac 27:3)". The three new passages match the WEB | **Pass** |

Every stop's `scripture` text matches the WEB file exactly, and so do all 181 stage passages; I checked them by script.

## 6. Sources and licences

- **New sources pass:** `isbe-adramyttium` (E. J. Banks), `isbe-alexandria` (Camden M. Cobern) and `isbe-syrtis` (unsigned, so "James Orr", the general editor, as for "Lasea" and "Fair Havens"). Each URL answers HTTP 200 and each byline matches. The ISBE (1915) is public domain and already in `docs/LICENSES.md` and `ATTRIBUTION.md` (M3-11), so no licence change is needed.
- **Already listed:** OpenBible.info's confidence percentages come from the CC BY 4.0 dataset already cited as `openbible:phoenix`. The Bible Gateway readings are cite-only comparisons, as in M5-02 and M5-03, and no verse text from those versions was stored. Pleiades is CC BY 3.0 and Wikidata CC0, both listed.
- **Every source ID resolves:** the validator checks this; the 4 scripture sources I added (Acts 14:27, 16:3, 27:44; Luke 24:34) exist in the WEB.

## 7. Corrections I made (ADR-0014)

Each is sourced in §2 or §5.

| # | Where | Change |
|---|---|---|
| C1 | `paul-1` Bible text | "the believers at Antioch" → "the prophets and teachers of the assembly at Antioch" (Acts 13:1–3) |
| C2 | `paul-1` Bible text | "preached in the synagogues of Pisidian Antioch, Iconium, Lystra and Derbe" → "preached in Pisidian Antioch, Iconium, Lystra and Derbe" (13:14; 14:1, 7, 21) |
| C3 | `paul-1` sources | added `scripture:Acts 14:27` |
| C4 | `paul-2` summary | Timothy joins in Asia Minor (Lystra); "through Asia Minor"; "where the cities he visited are now in Greece"; added `scripture:Acts 16:3` |
| C5 | `paul-2` Bible text | "He returned by sea, through Ephesus and Caesarea, to Antioch" → "He sailed back by way of Ephesus to Caesarea, and went on from there to Antioch" (18:21–22) |
| C6 | `paul-rome` Bible text | "set sail from Caesarea" → "set sail for Italy" (27:1); "every passenger" → "everyone on board" (27:37, 44); added `scripture:Acts 27:44` |
| C7 | `paul-rome` notes | voyage AD 55–62, arrival AD 56–62 (ISBE's table; 28:11) |
| C8 | `jesus` summary | the dates as World History Encyclopedia gives them; the method sentence (a disclaimer) moved to note 2, with "shown" for "drawn" |
| C9 | `jesus` Bible text | "being led by the Spirit into the wilderness"; the travels as the segments give them; added `scripture:Luke 24:34` |
| C10 | `jesus` notes | the start of the ministry from about AD 26 to AD 28–29 (ISBE), and its length "can't be fixed with certainty" |
| C11 | `jesus` notes | the Gadarenes stop's actual title |
| C12 | `jesus` notes | path not known also where a stage passes through a region between two towns; no "marked" lines (ADR-0041 item 3) |
| C13 | `jesus` notes | new bullet: Mark 7:31 in the WEB, KJV and NKJV vs. the NIV, ESV, NLT and CSB |
| C14 | `paul-1`, `paul-2`, `paul-3` notes | new second bullet: where Acts names only regions or doesn't say how the party traveled, the path isn't known and the line runs straight (ADR-0041 item 3; ADR-0038 update of 2026-10-14, item 2). The old notes covered only some of these stages, for example not `paul-2` stage 1 (Syria and Cilicia) or `paul-3` stage 1 (Galatia and Phrygia) |
| C15 | `phoenix` | WEB wording in the quotes; ISBE's two readings; OpenBible.info's percentages; both candidates `disputed`; `todayName` "Sfakia Municipality, Crete, Greece" |
| C16 | `alexandria` | "Luke's narrative in Acts names" → "Acts names" |
| C17 | `syrtis` | "on the northern coast of Africa, off today's Libya"; only OpenBible.info identifies Acts' Syrtis; the 17 km distance |

## 8. Back to the Research Lead, and questions for the PO

- **R1** (§4): add Jerusalem to `paul-1` stage 4; Corinth to `paul-3` stage 1; Beroea, Thessalonica and Derbe to `paul-3` stage 2; and Thessalonica and Macedonia to `paul-rome` stage 1. Or, if the PO rules that places named only as someone's home or whereabouts don't count (Q1), give that reason in §12 of the Paul note instead of the one there now.
- **R2** (§4): Acts 18:21. Add Jerusalem to `paul-2` stage 13's `mentioned`, and reword the note on Acts 18:22 with the textual difference.
- **R3** (§4): §12 of the Jesus note should list the brook Kidron (John 18:1) as left out for want of a sourced point.
- **R4** (§3): the five date bullets point to a year note the reader can't see. Once the PO answers Q2, either fold each `yearNote`'s views into its date bullet or keep the pointer.
- **Q1 (PO):** do places named only as someone's home town or whereabouts (Acts 13:13; 19:1; 20:4; 27:2) count as "places the passages name" (ADR-0041 item 8)? The card's wording and its example of the ships' home ports suggest they do.
- **Q2 (PO):** where does the route panel show `yearNote`? ADR-0041 item 1 puts debated dates in the notes, so one option is for the Routes tab to show it as the last note.
- **For M5-05:** Phoenix now has two `disputed` candidates, so the "Also named" dot needs the app's rule for disputed sites.

## 9. Checks

Run after my corrections, with the official Node 24 build:
- `npm run validate:data`: passed, 203 warnings, none on routes or stops (all predate this branch).
- `npm test`: 313 tests, all pass.
- `npm run test:app`: 22 suites, 159 tests, all pass.
- `npm run build:data`: the Routes files come to 31,851 bytes gzip (routes 6,445, stages 14,195, stops 8,706, lines 2,505), well within the 100,000-byte budget, and no tracked file changed.
