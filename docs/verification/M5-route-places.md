# M5-07 verification: every route place becomes a place

One section per batch (card `docs/tasks/M5-07-route-places.md`, Scope item 5).

## Batch A: the voyage to Rome (15 places)

- **Card:** `docs/tasks/M5-07-route-places.md` · **Branch:** `data/m5-route-places`
- **Checked:** the Research Lead's nine commits `81d9050`…`018d2ff` on top of `31781f0`: the 15 new records in `data/locations/` (Sidon, Myra, Cnidus, Salmone, Fair Havens, Lasea, Phoenix, Cauda, Syrtis, Syracuse, Rhegium, Forum of Appius, Three Taverns, Alexandria, Adramyttium); the routes switch (`data/routes/routes.json`, `data/routes/stops.json`, `scripts/lib/route-line-rules.mjs`, `tests/validator.test.mjs`); the regenerated OpenBible lookup; the new bibliography entry; and the research note `docs/research/M5-route-places.md` (Batch A). Against ADR-0042, ADR-0041 item 1, ADR-0038, ADR-0035, ADR-0033, ADR-0029, ADR-0028, ADR-0026, ADR-0017, the brief §1–§2, `schema/README.md` ("Modern names") and the verified records Tyre, Puteoli, Patmos, Malta, Derbe, Lystra, Miletus and Crete.
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-15
- **Method:**
  1. **Candidates:** a script compared every record's `candidates` with the verified stop entries in `git show 31781f0:data/routes/stops.json`. I re-measured each point against Pleiades' place JSON and each cited Wikidata item's coordinates (P625), read 2026-10-15.
  2. **Scripture:** a script compared all 29 `textWEB` strings with `data/reference/engwebp_vpl.txt`. I searched the whole WEB file for every name and spelling: Sidon/Zidon/Sidonian(s), Myra, Cnidus, Salmone, Fair Havens, Lasea, Phoenix/Phenice, Cauda/Clauda, Syrtis, Syracuse, Rhegium, Appius/Appii, Tavern(s), Alexandria/Alexandrian(s) and Adramyttium. I read each of Sidon's ten `otConnections` against its verses.
  3. **Sources, opened 2026-10-15:**
     - the International Standard Bible Encyclopedia (ISBE, 1915) at internationalstandardbible.com: "Sidon (2)", "Myra", "Lycia", "Cnidus", "Phoenix", "Fair Havens", "Lasea", "Salmone", "Cauda", "Clauda", "Syrtis", "Syracuse", "Rhegium", "Appii Forum", "Taverns, Three", "Alexandria", "Adramyttium", "Crete" and "Asia";
     - Smith's *Dictionary of Greek and Roman Geography* (1854) on Perseus: "Syrtis Major" (the new entry) and "Syrtica Regio";
     - Cassius Dio 60.17 (Loeb, LacusCurtius);
     - Pleiades' JSON for all 16 cited places;
     - Wikidata's API for the 14 cited items (labels, descriptions, P31, P131, P1376, P17, P625);
     - OpenBible.info's pages for the 15 slugs;
     - Bible Gateway's NIV, ESV, NLT, KJV, NKJV and CSB at Acts 27:2–17 and 28:15, for names only, with no verse text kept.
  4. **Routes:** a script converted every batch-A `route-stop` reference in the base `routes.json` and compared the result with the branch's file.
  5. **Commands:** with the official Node 24 build (v24.21.0): `validate:data`, `check:route-lines`, `npm test` and `build:data`.

### A1. Results

| Item | Pass | Needs the Research Lead | Question for the PO |
|---|---|---|---|
| Records (15) | 4: `salmone`, `fair-havens`, `phoenix`, `syracuse` | 11, with 31 fixes (F1–F31): 16 on content, 15 on citations or wording | Q1–Q3 |
| Candidates and coordinates (16 candidates) | 16, identical to the verified stop entries | — | — |
| WEB quotes (29) and New Testament completeness (15 places) | All | — | — |
| Sidon's `otConnections` (10) | 7 | 3 notes to reword (F7, F8) | Q1 |
| Names, type, zoom tier, prominence, parent, political area | All, with the PO's rulings | 3 modern or alternate names (F14, F23, F26) | Q2 |
| `politicalHistory` | 14, derived from the timeline and matching comparable places | 1 (`syrtis`, hand-written: F19) | — |
| New bibliography entry (`smith-dictionary-syrtis-major`) | Complete; the 1854 text is public domain; no licence change | It doesn't state what it's cited for (F18, F19) | — |
| Routes switch | Passes: 23 references, 15 entries, the `cauda` and `salmone` rule keys | — | — |
| Checks | All four pass | — | — |

"Content" means a clause that a cited source doesn't state, or that contradicts a source or the record's own data. "Citations or wording" means a clause whose source exists but isn't cited, or wording that slightly overstates it.

**No record is set to `verified` this round.** The PO asked me not to edit the records, and the fix round touches most of them; Myra's parent also changes. At the re-check I'll set every record that passes, including the four that pass now.

**The main findings:**
1. **Three statements contradict their own sources or data.**
   - Three Taverns has the two welcoming parties the wrong way round (F25).
   - Lasea's "about five miles east of Fair Havens" comes from the ISBE (1915). It contradicts the record's own point, 1.56 km from Fair Havens', and Pleiades and Wikidata, which put the two about 2 km apart (F15).
   - Alexandria's history credits the ISBE with a claim it doesn't make (F28).
2. **Syrtis's political text isn't stated by the source it cites.** The new Smith's *Dictionary* entry, "Syrtis Major", doesn't say it. Smith's own "Syrtica Regio" says the coast west of the gulf "formed a part of the Roman province of Africa", against the record's "rather than assign it to one province" (F18, F19).
3. **Sidon:**
   - The summary holds Old Testament material. The brief §1 says "Old Testament references appear only as 'connections'", and no other record's summary cites the Old Testament (F1).
   - Three ISBE paraphrases say more than the source, or something other than it (F4–F6).
   - One note misreads Isaiah 23 (F7).
4. **Myra:** the history says Lycia was administered with Pamphylia "by the time of Paul's voyage". Neither Cassius Dio nor the record's own `politicalHistory` says so; the latter calls AD 43–74 uncertain (F11).
5. **The rest** are citation gaps and small overstatements.

### A2. Per record

| Record | Result | Fixes |
|---|---|---|
| `sidon` | Needs change | F1–F8 |
| `myra` | Needs change | F9–F11; the PO's ruling moves its parent to a new `lycia` record (Q3) |
| `cnidus` | Needs change | F12–F14 |
| `salmone` | **Pass** | — |
| `fair-havens` | **Pass** | — (Q2 on its type) |
| `lasea` | Needs change | F15, F16 |
| `phoenix` | **Pass** | — (Q2 on its type) |
| `cauda` | Needs change (citations) | F17 |
| `syrtis` | Needs change | F18–F20 |
| `syracuse` | **Pass** | — |
| `rhegium` | Needs change (wording) | F21, F22 |
| `forum-of-appius` | Needs change (minor) | F23, F24 |
| `three-taverns` | Needs change | F25–F27 |
| `alexandria` | Needs change | F28, F29 |
| `adramyttium` | Needs change (minor) | F30, F31 |

**Why the four pass:**
- **`salmone`:** Pleiades 590037 says "Modern Cape Sideros at the extreme northeast tip of the island of Crete", and Acts 27:7 says the rest. A cape is a `natural-feature` at site tier (the card).
- **`fair-havens`:**
  - ISBE "Fair Havens": "about 5 miles East of Cape Matala" and "sheltered on the Southwest by two small islands".
  - The modern name: Wikidata Q11818846 ("Kaloi Limenes", a village and port), and ISBE "Phoenix" ("called Fair Havens by the modern Greek inhabitants").
  - The account follows Acts 27:7–12.
- **`phoenix`:**
  - Loutro, from ISBE "Phoenix": "All the ancient authorities agree in placing Phoenix in this neighborhood"; the Trajanic inscription shows "Egyptian corn ships were wont to lie up there for the winter"; the harbour "looks eastward".
  - Finikas, from the same article: "not a suitable place for wintering in".
  - Each site gets its case and its difficulty, and the record takes no side. It has no modern name, as a disputed place should.
- **`syracuse`:** ISBE "Syracuse" gives each clause:
  - the Corinthian colony of 734 BC, "confined to the islet Ortygia";
  - the Athenian siege of 414 BC, told by Thucydides;
  - Marcellus and the city's fall in 212;
  - "Henceforth Syracuse was the capital of the Roman province of Sicily";
  - Cicero's words.

  Acts 28:12 gives the three days.

### A3. Fixes for the Research Lead

Each fix gives the file and field, what's wrong, the source that shows it, and a suggested fix. Fixes marked **content** come first in priority.

#### `data/locations/sidon.json`
- **F1 (content), `summary`:** "Genesis names Sidon as Canaan's firstborn son, and Israel's early historical books call it 'great Sidon,' a leading city of the region."
  - This is Old Testament material in the summary. The brief §1 says "Old Testament references appear only as 'connections'", and no other record's summary cites the Old Testament.
  - Only the book of Joshua says "great Sidon" (11:8; 19:28), not "historical books".
  - Both facts are already in `otConnections` (Genesis 10:15-19, Joshua 11:8). Remove the sentence, and `scripture:Genesis 10:15` and `scripture:Joshua 11:8` from `summary.sources`.
- **F2 (content), `summary`:** "a little north of Tyre" is stated by none of the cited sources: Pleiades 678393 ("an ancient maritime city and Phoenician metropolis"), OpenBible.info, Wikidata Q163490, or ISBE "Sidon (2)". The two records' points are 35.9 km apart. Remove it, or cite a source that gives the position.
- **F3 (citations), `summary.sources`:**
  - "Withdrew into the region of Tyre and Sidon" is Matthew 15:21's wording, so cite it.
  - "A Gentile woman's daughter": cite `scripture:Mark 7:26` ("The woman was a Greek, a Syrophoenician by race"), as `tyre.json` does, or use ISBE's "Syro-phoenician woman".
  - "The centurion Julius" and "as a prisoner": cite `scripture:Acts 27:1` ("they delivered Paul and certain other prisoners to a centurion named Julius").
- **F4 (content), `history[0]`:**
  - "Sidon's wealth rested on Mediterranean trade" isn't in ISBE. ISBE says it "led all the Phoenician cities in its early development of maritime affairs" and "became early distinguished for its manufactures and the skill of its artisans".
  - "First produced at Sidon" overstates ISBE's "the famous purple dye which became known as Tyrian, but which was earlier produced at Sidon".
  - Reword both to ISBE.
- **F5 (content), `history[1]`:**
  - ISBE dates the revolt, not the burning: "In 351 BC, Sidon rebelled under Tabnit II (Tennes)", after which "Ochus, the Persian king, marched against him".
  - The sentence "besieged after a revolt by the Persian king Artaxerxes III (Ochus)" reads as if the king revolted.
  - "Artaxerxes III" is in no cited source.
  - "After Alexander the Great's conquests": ISBE says "after the death of Alexander".
  - "The Ptolemies" and "the Seleucids" need an introduction (ADR-0033), as in `libya.json` ("Ptolemy I, the first Ptolemaic king of Egypt").
- **F6 (content), `history[2]`:**
  - ISBE: "when Berytus was destroyed by an earthquake in 551, its great law school was removed to Sidon". Berytus's own law school moved. The record says Sidon's law school "took in students and teachers from Berytus", and no source says that.
  - "(modern Beirut)" has no cited source. Cite one, such as a Pleiades or Wikidata entry for Berytus, or drop the gloss.
- **F7 (content), `otConnections` Isaiah 23:2-4:**
  - The WEB tells "you inhabitants of the coast, you whom the merchants of Sidon that pass over the sea have replenished" to "be still" (23:2). It doesn't tell Sidon's merchants to be silent.
  - Within this range, only 23:4 addresses Sidon ("Be ashamed, Sidon"), so "twice addresses Sidon directly" is wrong. The second address, "virgin daughter of Sidon", is 23:12.
  - "At the loss of the city's maritime wealth" isn't what 23:4 says: "for the sea has spoken, the stronghold of the sea, saying, 'I have not travailed, nor given birth…'".
  - Reword to what the verses say, or widen the reference to cover 23:12.
- **F8 (wording), `otConnections`:**
  - **Genesis 10:15-19:** "south" and "the cities of the plain" aren't in the passage. WEB 10:19 reads "from Sidon—as you go toward Gerar—to Gaza—as you go toward Sodom, Gomorrah, Admah, and Zeboiim—to Lasha". Use the verse's names.
  - **1 Kings 16:31:** "A marriage the book treats as a turning point toward greater idolatry" goes beyond the verse. Use its own framing: "As if it had been a light thing for him to walk in the sins of Jeroboam …, he took as wife Jezebel …, and went and served Baal".

#### `data/locations/myra.json`
- **F9 (content), `summary`:** "Ships sailing between Egypt, Cyprus and the Aegean": ISBE "Myra" says "a prominent port for ships from Egypt and Cyprus". No cited source mentions the Aegean.
- **F10 (citations), `summary` and `history[1]`:**
  - "The home city of the bishop Nicholas" is stated by ISBE "Lycia" ("especially known as the home of Nicholas, who was its bishop"), not by the cited ISBE "Myra". "Myra" says only that he "is said to have been buried in a church on the road between Myra and Andraki". Add `bib:isbe-lycia` to both.
  - The Nicholas sentence appears in both the summary and `history[1]`; keep one.
  - "In the fifth century" (Theodosius II) isn't in ISBE; cite it or drop it.
  - "The other prisoners": cite `scripture:Acts 27:1`.
- **F11 (content), `history[0]`:**
  - "So that by the time of Paul's voyage Lycia's affairs were administered together with its neighboring province" isn't in the cited source. Cassius Dio 60.17.3, in Claudius's third consulship (AD 43), says only: "He reduced the Lycians to servitude because they had revolted and slain some Romans, and he incorporated them in the prefecture of Pamphylia."
  - The clause also contradicts the record's own `politicalHistory` note: AD 43–74 is "Status uncertain", since Suetonius has Vespasian make Lycia a province. ISBE "Lycia" says "In 53 AD … it became a Roman province, and in 74 AD it was united with Pamphylia".
  - "A free federation of cities under Roman protection" isn't in Dio; the timeline cites Strabo for the league.
  - Give Dio's report with its date, then the uncertainty last, with the same sources as the political history (ADR-0041 item 1, brief §2.6). Revisit this with the parent change to `lycia` (Q3).

#### `data/locations/cnidus.json`
- **F12 (content), `summary`:** "Though administratively part of Caria" is wrong. Caria was a region inside the province of Asia, not an administrative unit: ISBE "Asia" says the province included "the older countries of Mysia, Lydia, Caria". ISBE "Cnidus" says "Though Cnidus was in Caria, it held the rank of a free city". Say "in Caria".
- **F13 (content), `history`:**
  - `history[0]`: "Meaning it governed itself under its own laws rather than being directly administered by the province's governor" isn't in ISBE "Cnidus", which says only that it "held the rank of a free city". Cite a source for the meaning, or drop it. The Tarsus and Thessalonica records explain the status from their own ISBE articles.
  - `history[1]`: "One of his most celebrated works" isn't in ISBE, which says only "the statue of that goddess by Praxiteles".
- **F14 (wording), `names.modern`:**
  - "Knidos" isn't given as today's name by any cited source; it is Wikidata's label for the ancient city ("ancient city of Caria in modern-day Turkey").
  - The verified stop entry had "Datça, Muğla Province, Türkiye" (Wikidata P131: Datça). Pleiades 599575 says "located at Tekir on the western tip of the modern Datça peninsula". ISBE names the nearest village, "Yazi Keui".
  - House style: where a site has no settlement of its own, use "Near <town>" (`schema/README.md`), as for Miletus ("Near Balat") and Perga ("Near Antalya"), not the ancient name in its modern spelling.
  - Use a sourced modern name, such as "Near Datça", unless the PO prefers "Knidos" for usefulness (ADR-0028).

#### `data/locations/lasea.json`
- **F15 (content), `summary` and the candidate's `support`:** "About five miles east of Fair Havens" contradicts the record's own data:
  - the record's point is 1.56 km from Fair Havens' point;
  - Pleiades 589834, Kaloi Limenes, lies "2 km west of Lasaia", and Pleiades' Lasaia (589897) is 0.65 km from our point;
  - Wikidata Q6492763 is 2.2 km from Kaloi Limenes.

  The figure is the ISBE's, in "Lasea" ("5 miles East of Fair Havens") and "Phoenix" ("found 5 miles East from Fair Havens"). Give the datasets' distance (about 2 km, from Pleiades' description, cited). If ISBE's figure stays, put it last as a caveat. The support may change, as a justified improvement; the coordinates stay.
- **F16 (content), `summary`:** "the need to buy supplies from a small town like Lasea, rather than a larger city, helps explain why the ship's crew judged Fair Havens an unsatisfactory place".
  - ISBE "Lasea" says: "it would be necessary to purchase stores from Lasea; and this in addition to the inconvenience of the roadstead … would probably explain the captain's reluctance to winter there".
  - "A small town … rather than a larger city" isn't in the source, and the reluctance is the captain's, not the crew's.

#### `data/locations/cauda.json`
- **F17 (citations), `summary.sources`:**
  - The manuscript note ("reflects the 'Cauda' reading found in some ancient manuscripts rather than 'Clauda'") and "a violent northeasterly wind" are stated by ISBE "Phoenix", which only the candidate cites. Add `bib:isbe-phoenix`, and `scripture:Acts 27:14` for the storm.
  - Suggestion (ADR-0041 item 1): put the manuscript note after Acts' account.

#### `data/locations/syrtis.json`
- **F18 (content), `history[0]`:**
  - The cited Smith's "Syrtis Major" says only that the two gulfs lay "on the N. coast of Africa, and in the district called after them Regio Syrtica", the larger being "now the Gulf of Sidra". It doesn't mention Carthage, the province of Africa or Cyrenaica.
  - Smith's separate "Syrtica Regio" entry puts that district "between the Syrtis Major and Minor", west of the gulf, not "surrounding" it. It says the district "at first belonged to the Cyrenaeans, but was subsequently wrested from them and annexed to Carthage, and, when the whole kingdom of the latter was subjected to the Romans, formed a part of the Roman province of Africa".
  - Source each side from what the sources say. "Cyrenaica, joined with Crete as a single Roman province" is in ISBE "Crete".
  - The last sentence ("This project has no record for the Roman province of Africa, so the gulf is not assigned to either neighboring province on this map") is about our data, not history; remove it. The `politicalHistory` entity can say what the map shows, as Phrygia's does.
- **F19 (content), `politicalHistory[0].entity`:**
  - "Ancient sources describe the surrounding coast as a sparsely settled borderland rather than assign it to one province" is stated by neither cited source.
  - Smith's "Syrtica Regio" contradicts it: "The district was attributed by Ptolemy, Mela, and Pliny to Africa Propria … formed a part of the Roman province of Africa".
  - Re-source it, for example "Off the coasts of the Roman province of Africa (west) and of Crete and Cyrene (east)", citing sources that state each side. The PO's ruling (no `politicalAreaId`, region tier) stands.
- **F20 (wording), `summary`:**
  - "One of antiquity's most feared sailing hazards" overstates ISBE's "regarded as a source of danger to mariners".
  - "Wide, shallow": cite Smith, which the summary doesn't cite, or reword.

#### `data/locations/rhegium.json`
- **F21 (wording), `summary`:** "Acts records that Paul's ship … reached Rhegium by tacking against unfavorable winds and waited there one day for a south wind".
  - Acts 28:13 (WEB) says "we circled around and arrived at Rhegium. After one day, a south wind sprang up".
  - The tacking and the waiting are ISBE's reading ("reached Rhegium by means of tacking. It waited at Rhegium a day for a south wind"), so attribute them to ISBE.
  - "Before completing the crossing": Rhegium to Puteoli wasn't a crossing (ISBE: "about 180 miles distant"). Say "sailing on to Puteoli".
- **F22 (citations), `history[1]`:** "With the rest of Italy" and "(91-88 BC)" aren't in ISBE ("At the time of the Social War they were incorporated with the Roman state, Rhegium becoming a municipality"). Cite them or drop them.

#### `data/locations/forum-of-appius.json`
- **F23 (wording), `names.modern`:**
  - It is omitted, though the verified stop entry had "In the comune of Latina, Italy". Wikidata Q3748871 is an "archaeological site in Latina, Italy" (P131 Latina), and Pleiades 422927's Barrington Atlas note gives "Faiti".
  - The card asks for today's name. Use, for example, "Near Latina".
- **F24 (citations), `summary`:**
  - "Walked out to meet Paul": "walked" is in no source. Acts 28:15 has "came to meet us"; ISBE has "went out along the Appian Road".
  - "Under guard as a prisoner": cite `scripture:Acts 28:16` or 27:1.

#### `data/locations/three-taverns.json`
- **F25 (content), `summary`:** "one group of believers from the city met him as far as Three Taverns while another went only as far as Forum of Appius, a station further south".
  - This is the wrong way round. Forum of Appius, at the 43rd milestone, is farther from Rome than Three Taverns, at the 33rd. The group that reached it went farther, not "only" as far.
  - ISBE "Taverns, Three": "one group proceeding as far as Appii Forum, while another awaited his coming at Three Taverns".
  - Also, "a road from Antium and Norba" should be ISBE's "a road from Antium to Norba".
- **F26 (wording), `names.alternate`:** add "Three Inns", the NKJV's reading at Acts 28:15 (Bible Gateway, read 2026-10-15; also M5-02 §3), so NKJV readers find the place (ADR-0026).
- **F27 (wording), `history[0]`:**
  - "A few kilometers south": ISBE says "Tripontium, 6 miles down the Appian Road", about 10 km.
  - Suggestion: Pleiades 423106's Barrington note gives "near Cisterna", a sourced `names.modern` the stop entry didn't have.

#### `data/locations/alexandria.json`
- **F28 (content), `history[0]`:**
  - "The International Standard Bible Encyclopedia credits its library and university with helping to make the city, next to Rome, the greatest of the ancient world." ISBE makes no such claim.
  - Its only comparison with Rome is about the city's plan and beauty: "the most beautiful city of the ancient or modern world (with the single exception of Rome) arose with straight, parallel streets".
  - Say what ISBE says, or drop the clause.
- **F29 (citations), `summary`:**
  - "Who later worked alongside Paul" has no cited source; cite, for example, `scripture:1 Corinthians 3:6` ("I planted. Apollos watered").
  - "Teacher" is Acts 18:25 ("taught accurately the things concerning Jesus"), which isn't cited.
  - "The grain ship": cite ISBE "Myra" ("a grain ship from Alexandria") or Acts 27:38.

#### `data/locations/adramyttium.json`
- **F30 (citations), `summary`:**
  - "Acts records that when Paul and his fellow prisoners first set out from Caesarea": Acts 27 doesn't name Caesarea; the same wording was corrected in the route text (M5-06, C6). The port comes from ISBE ("while being taken a prisoner from Caesarea to Rome"). Word it so that "Acts records" covers only what Acts says.
  - Cite `scripture:Acts 27:1` (the prisoners) and 27:5–6 (the transfer at Myra).
- **F31 (wording), `history[0]`:**
  - "A village bearing a form of its name, Edremit, stands farther inland" puts ISBE's 1915 description in the present tense: "a village of about one thousand houses bearing the name Edremid". Edremit is now a town.
  - Put it in the past, for example "In the early twentieth century, the ISBE described…", or cite a current source.

### A4. What passes

**Candidates and coordinates.** All 16 candidates are identical to the verified stop entries: label, coordinates, `coordinateSource`, confidence, support and sources. So every route line still ends on its stop. No coordinates are swapped. Every point agrees with at least two independent sources:

| Record | Stored `[lon, lat]` | Pleiades | Cited Wikidata item |
|---|---|---|---|
| `sidon` | [35.371944, 33.560985] | 0.13 km (678393) | 0.36 km (Q163490) |
| `myra` | [29.985278, 36.259167] | 0.07 km (639005) | 0.00 km (Q652024) |
| `cnidus` | [27.375, 36.6858] | 0.33 km (599575) | 0.00 km (Q690575) |
| `salmone` | [26.3116, 35.316] | 0.02 km (590037) | 1.25 km (Q2937111) |
| `fair-havens` | [24.800306, 34.929694] | 1.12 km (589834) | 0.00 km (Q11818846) |
| `lasea` | [24.811111, 34.940556] | 0.65 km (589897) | 0.95 km (Q6492763) |
| `phoenix` (Loutro) | [24.07828, 35.19919] | 0.00 km (589993) | (M5-06: 0.1 km) |
| `phoenix` (Finikas) | [24.0668, 35.1991] | 0.00 km (589992) | (M5-06: 0.5 km) |
| `cauda` | [24.083333, 34.833333] | 1.11 km (589858) | 0.00 km (Q213895) |
| `syrtis` | [17.827475, 31.474808] | 0.00 km (344491) | 16.60 km (Q187274), close for a gulf |
| `syracuse` | [15.293056, 37.063889] | 1.10 km (462503) | 0.77 km (Q13670) |
| `rhegium` | [15.64412, 38.1088] | 0.06 km (452416) | 0.81 km (Q8471) |
| `forum-of-appius` | [12.9975, 41.46639] | 0.00 km (422927) | 0.00 km (Q3748871) |
| `three-taverns` | [12.873889, 41.561944] | 0.04 km (423106) | 0.00 km (Q622536) |
| `alexandria` | [29.8925, 31.1975] | 1.70 km (727070) | 0.00 km (Q87) |
| `adramyttium` | [26.936098, 39.49864] | 0.00 km (550403) | 0.04 km (Q3605584) |

No new record lies within 2 km of an existing one. Fair Havens and Lasea, 1.56 km apart, are two places that Acts 27:8 names separately. All 15 OpenBible.info slugs resolve to the right pages.

**Scripture.**
- All 29 `textWEB` strings match the WEB exactly.
- Every New Testament verse in the WEB that names each place is present:
  - Sidon: all 12 (Matthew 11:21, 22; 15:21; Mark 3:8; 7:24, 31; Luke 4:26; 6:17; 10:13, 14; Acts 12:20; 27:3);
  - Alexandria: all 4 (Acts 6:9 and 18:24 by their demonyms, as `crete.json` lists Acts 2:11; Acts 27:6; 28:11);
  - each of the other 13 places: its one verse.
- Only Sidon is named in the Old Testament: 37 verses, from Genesis to Zechariah, including Deuteronomy 3:9.
- Sidon's ten `otConnections` quote the WEB exactly. Seven read their passages correctly; F7 and F8 cover the other three.

**Names (ADR-0026).**
- Every title is the six versions' majority form: Cauda 4 of 6, Forum of Appius 3 of 6 (PO ruling), Three Taverns 5 of 6, Phoenix 5 of 6; the rest are spelled alike in all six.
- `alternate` holds the other readings: Zidon (KJV, Old Testament), Phenice (KJV), Clauda (KJV, NKJV, WEB), Appii Forum (KJV, NKJV), The Market of Appius and The Three Taverns (WEB). Missing: "Three Inns" (F26).
- `modernCountries` are right.
- Modern names come from the cited sources: Wikidata for Sidon, Myra, Fair Havens, Gavdos, Cape Sideros, the Gulf of Sidra, Syracuse, Reggio Calabria and Alexandria; Pleiades for Ören; Pleiades' description of Kaloi Limenes for "Near Kaloi Limenes". The exceptions are F14 and F23.
- Phoenix rightly has no modern name, as a disputed place.

**Type, zoom tier, prominence, parent and political area.** These follow the card, the house style and the PO's rulings:
- cities and towns at city tier;
- Salmone, a cape: `natural-feature` at site tier;
- Cauda, a small island like Patmos: city tier;
- Syrtis: region tier, parent `roman-empire`, no `politicalAreaId` (ruling);
- Forum of Appius a town and Three Taverns a site (ruling);
- every prominence "standard" (ruling);
- Cnidus under `asia`, as Miletus is;
- Adramyttium under `mysia`;
- the Cretan places under `crete`, in `crete-cyrene`;
- Syracuse under `sicily`, like Malta;
- the Italian places under `italy`, like Puteoli;
- Sidon under `syria`, like Tyre.

Myra's parent changes to the new `lycia` record (ruling; Q3). Fair Havens' and Phoenix's `site` type is a judgement call (Q2).

**`politicalHistory`.**
- The 14 records with a `politicalAreaId` match their timeline areas exactly (the validator derives and compares them). The same areas give the verified records the same entries:
  - `syria`: Tyre;
  - `asia`: Miletus;
  - `crete-cyrene`: Crete;
  - `sicily`: Malta;
  - `italy`: Puteoli;
  - `egypt`: the Egypt record.
- Myra is the first place in the `lycia` area.
- The years and holder ids come from `data/timeline.json`.
- Syrtis's hand-written entry is F19.

**Sources and licences.**
- Every source id resolves; the validator's strict bibliography check passes.
- Each candidate has at least two independent sources: Pleiades, Wikidata and OpenBible.info, plus the ISBE.
- The one new entry, `smith-dictionary-syrtis-major`, is complete and follows the existing Smith's *Geography* entries; its URL answers.
- Smith's *Geography* (1854) is public domain and already listed in `docs/LICENSES.md` and `ATTRIBUTION.md` (M4-02), so no licence or attribution change is needed. Its problem is what it's cited for (F18, F19).
- The Bible Gateway readings are cite-only comparisons, as in M5-02, and no verse text from those versions was stored.

**The routes switch.**
- Converting every batch-A `{"kind": "route-stop", "stopId": …}` in the base `routes.json` to `{"kind": "location", "locationId": …}`, keeping Phoenix's `candidateIndex: 0`, reproduces the branch's `routes.json` exactly.
  - The 23 references are 5 `from`, 5 `to`, 5 `via` and 8 `mentioned`: 21 on the voyage to Rome, and Sidon's 2 on Jesus' route (segments 13 and 14).
  - Nothing else in the routes changed.
- `stops.json` equals the base file minus the 15 entries; the other 17 are unchanged.
- No reference to a batch-A stop entry remains anywhere in `data/`, `scripts/`, `app/` or `tests/`.
- In `route-line-rules.mjs`, the four `cauda` and `salmone` key strings (`ISLAND_VIAS`, and `SIDE_PASSES` for stages 3 and 4) are plain renames, as is the one assertion in `tests/validator.test.mjs`. The route lines reproduce byte for byte.
- The regenerated OpenBible lookup adds the 15 slugs and drops 8 that no data cites. Its TypeScript copy matches it.

### A5. Questions for the PO

- **Q1. Sidon's ten `otConnections`.** The most any other record has is four (Damascus), and Tyre, Sidon's twin, has two. The research note says citing every occurrence "would be unlike every other record's practice", then chooses ten. Keep ten (after F7 and F8), or trim to about four, for example Genesis 10:15-19, Joshua 11:8, 1 Kings 17:9 (Zarephath, which Luke 4:26 recalls) and Ezekiel 28:21-22?
- **Q2. Fair Havens' and Phoenix's `type: "site"`.** The research note's reason, "harbors/roadsteads without their own ancient civic identity", fits Fair Havens. Pleiades calls Kaloi Limenes "an embayment", which suggests `natural-feature`, like the card's islands and capes. The reason doesn't fit Phoenix: Pleiades calls Phoinix, the Loutro candidate, "an ancient coastal city of western Crete that served as the port of inland Anopolis", which suggests `town`. Keeping both as `site` is defensible; the type sets their pin's colour. Not blocking.
- **Q3. The new `lycia` record (your ruling) is a 16th record for the re-check.** In the timeline, 17 of 24 areas have a `locationId`; the `lycia` area has none. Should the fix round link them?

**For the research note (docs only, no data effect):**
- the OpenBible regeneration dropped eight slugs, not six (also `philippi` and `thessalonica`); none is cited by any data;
- the books naming Sidon also include Deuteronomy (3:9);
- the Barrington Atlas notes in Pleiades give modern names for Forum of Appius ("Faiti") and Three Taverns ("near Cisterna").

### A6. Checks run (2026-10-15, Node 24.21.0, on `018d2ff`)
- `npm run validate:data`: passed, 0 errors, 203 warnings, none in the 15 records (all predate this branch).
- `npm run check:route-lines`: the lines reproduce byte for byte from an empty cache, and the audit passed (71 lines, 0 failing).
- `npm test`: 331 tests, all pass.
- `npm run build:data`: passed. The Routes files total 29,947 bytes gzip, within the 100,000-byte budget. The places index is 38,852 bytes (6,277 gzip). No tracked file changed.

### A7. Re-check of the fix round (`613bde6`, 2026-10-15)

I re-checked `git diff d80d2a8..613bde6` (`dcab26d`, `540451d`, `ca67551`, `2e623d9`, `613bde6`). The checks were:
- each of F1–F31 against the source it names;
- the new `lycia` record, Myra's new parent and the timeline link;
- the PO's three rulings: Q1, Sidon keeps at most five Old Testament connections, those its New Testament passages echo first; Q2, Fair Havens becomes `natural-feature` and Phoenix a `town`; Q3, the timeline's `lycia` area links to the new record;
- the new bibliography entry.

I re-read the sources where the text changed:
- the ISBE articles;
- Smith's "Syrtis Major", "Syrtica Regio" and "Cyrenaica";
- Cassius Dio 60.17, Suetonius *Vespasian* 8 and the Loeb notes to Tacitus *Histories* 2;
- Strabo 14.3, and Livius "Pamphylia";
- Pleiades 638965 (Lycia), 422927 and 423106;
- Wikidata Q18927 (Lycia) and Q829310 (Berytus);
- Bible Gateway at Acts 27:5, in six versions, for the name only.

**Result: 9 of the 15 records pass and are now `verified`:** `cnidus`, `salmone`, `fair-havens`, `phoenix`, `cauda`, `syracuse`, `rhegium`, `forum-of-appius` and `three-taverns`. Seven records still need changes: `sidon`, `myra`, `lasea`, `syrtis`, `alexandria`, `adramyttium` and the new `lycia`. They need 11 more fixes, F32–F42 below: six on content, five on citations or wording. Batch A isn't signed off yet. Each remaining fix is a sentence or a citation; no candidate, coordinate, type, tier, parent or route changes, except the `lycia` parent choice in F41.

#### F1–F31

| Fixes | Result |
|---|---|
| F1–F6 (`sidon`) | **Closed.**<ul><li>No Old Testament material is left in the summary.</li><li>"A little north of Tyre" is gone.</li><li>Matthew 15:21, Mark 7:26 and Acts 27:1 are cited.</li><li>The trade and dye sentence follows ISBE "Sidon (2)".</li><li>The 351 BC revolt and Ochus's march are in ISBE's order, with "after the death of Alexander", and the Ptolemies and Antiochus III are introduced.</li><li>Berytus's law school moves to Sidon, and Wikidata Q829310 ("Berytus: ancient city of Beirut, Lebanon") supports "(modern Beirut)".</li></ul> |
| F7, F8 (`sidon`, `otConnections`) | **Closed by the Q1 rewrite.** Isaiah 23 now names Sidon's merchants enriching the coast (23:2) and the two addresses to Sidon (23:4, 23:12). Genesis 10:19 now uses the verse's own places. 1 Kings 16:31 is gone. The new text raises F32 and F33. |
| F9, F10 (`myra`) | **Closed.** No more "Aegean". Nicholas appears once, cited to ISBE "Lycia". "In the fifth century" is dropped, and Acts 27:1 is cited. |
| F11 (`myra`) | **Follow-up F34.** Dio's AD 43 report now comes first and the uncertainty last, but the new clause misstates the other sources. |
| F12–F14 (`cnidus`) | **Closed.** "Though in Caria"; ISBE's own "held the rank of a free city"; "the statue of that goddess there by the sculptor Praxiteles"; modern name "Near Datça" (Wikidata P131 Datça; Pleiades: "the modern Datça peninsula"). |
| F15, F16 (`lasea`) | **Closed** in the summary and the candidate's support. "About 2 km east of Fair Havens" comes from Pleiades 589834's description ("2 km west of Lasaia"), and ISBE's five miles is now a closing caveat in the support. "The captain's reluctance" and ISBE's own reasoning are restored. The new caveat sentence in `history` raises F35. |
| F17 (`cauda`) | **Closed.** ISBE "Phoenix" and Acts 27:14 are cited, and the manuscript note now comes after Acts' account. |
| F18, F19 (`syrtis`) | **Follow-up F37.** The Syrtica Regio and Africa side now matches Smith word for word; the eastern side is still unsourced. |
| F20 (`syrtis`) | **Closed.** "A broad gulf"; Smith's "shallows and submerged rocks"; ISBE's "a source of danger". |
| F21, F22 (`rhegium`) | **Closed.** Acts' "circled around" and "after one day" are separated from ISBE's reading (tacking, waiting for the wind). The uncited dates and "with the rest of Italy" are gone. |
| F23, F24 (`forum-of-appius`) | **Closed.** Modern name "Near Latina" (Wikidata Q3748871: "archaeological site in Latina, Italy"). "Walked" is gone, and Acts 27:1 is cited. |
| F25–F27 (`three-taverns`) | **Closed.**<ul><li>The parties are the right way round, with ISBE's order: one went as far as the Forum of Appius, the other waited at Three Taverns.</li><li>"A road from Antium to Norba".</li><li>"Three Inns" (NKJV) is in `alternate`.</li><li>"About 10 km", ISBE's 6 miles.</li></ul> |
| F28 (`alexandria`) | **Closed.** ISBE's actual comparison: "the most beautiful city of the ancient or modern world (with the single exception of Rome)". |
| F29 (`alexandria`) | **Follow-up F38.** Acts 18:25 ("taught accurately") and 1 Corinthians 3:6 ("I planted. Apollos watered.") close the Apollos clause, but the new "grain ship" citation is wrong. |
| F30, F31 (`adramyttium`) | **Closed.** "From Caesarea" is now ISBE's, not Acts'. Acts 27:1, 27:5 and 27:6 are cited, and the 1915 village description is in the past. F39 is a gap in the same sentence that I missed in the first round. |

#### The new `lycia` record, Myra's parent, the timeline link
These pass:
- **Names (ADR-0026):** "Lycia" in all six versions at Acts 27:5, and in the WEB. `otherLanguages` "Lukia" comes from ISBE.
- **Modern name:** "Southwestern Türkiye", an area phrase like Pisidia's.
- **Type, tier, prominence:** `region` at region tier, `standard`, like Pamphylia and Mysia.
- **Scripture:** Acts 27:5 is the only verse in the WEB that names Lycia, and the quote is exact.
- **No `otConnections`:** the Old Testament doesn't name Lycia; 1 Maccabees 15:23, which ISBE cites, is outside the canon.
- **`politicalHistory`:** it matches the timeline's `lycia` area exactly (the validator derives it): the Lycian League to AD 43, "Status uncertain" from 43 to 74 with the timeline's note, then the province of Lycia and Pamphylia.
- **History:**
  - `history[0]` gives ISBE "Lycia" word for word: "Successively it was in the possession of the Persians, of Alexander the Great, of the Seleucid kings and of the Ptolemies. In 188 BC it fell into the hands of the Romans, who gave it to the island of Rhodes; 20 years later … it became free and independent".
  - `history[1]`: Patara for Phoenicia comes from ISBE "Lycia" and Acts 21:1; Myra "for some time … the capital of the Roman province" from ISBE.
- **The summary's sources:**
  - "a free league of cities": Strabo 14.3.3, "the Lycian League", "they remained ever free under the Romans";
  - Dio's AD 43 report: 60.17.3, in Claudius's third consulship;
  - "joined with Pamphylia as a single province under the emperor Vespasian": Livius, "the emperor Vespasian created a new province called Lycia and Pamphylia (after 70)".
- **Myra:** its `parentId` is now `lycia` (the PO's ruling).
- **The timeline:** its `lycia` area now has `locationId: "lycia"` (Q3). The validator resolves the link, and the ancient layer's other linked areas work the same way.

The three Lycia fixes are F40–F42.

#### Sidon's five connections, the two new types, the new bibliography entry
- **Sidon's five `otConnections`:** Genesis 10:15-19, 1 Kings 17:8-24, Isaiah 23:2-12, Ezekiel 28:20-23 and Joel 3:4-8. That meets Q1's limit of five, and the research note says you named these five. Their quotes match the WEB. Two notes claim more than the passages say (F32), and two paraphrases need small corrections (F33).
- **Fair Havens, `natural-feature`:** passes. Pleiades 589834 calls it "An embayment", now in the support. It stays at city tier, like Patmos and the Sea of Galilee.
- **Phoenix, `town`:** passes. The Loutro candidate's support now quotes Pleiades 589993 ("an ancient coastal city of western Crete that served as the port of inland Anopolis and also of later Aradena"). It stays at city tier, and both candidates stay `disputed`.
- **`smith-dictionary-syrtica-regio`:** passes. It is complete and in the same form as the other Smith's *Geography* entries; its URL answers; and the 1854 text is public domain, already in `docs/LICENSES.md` and `ATTRIBUTION.md`. Its quotes in `syrtis.json` match the entry: "at first belonged to the Cyrenaeans, but was subsequently wrested from them and annexed to Carthage, and … formed a part of the Roman province of Africa".

#### "Faiti" and "near Cisterna": where they come from
Both are in the places' Pleiades JSON, in the `details` field, which the Research Lead didn't search. It searched `names`, `locations[].references` and `connectsWith`.
- https://pleiades.stoa.org/places/422927/json has `"details": "<p>The Barrington Atlas Directory notes: Faiti</p>"`.
- https://pleiades.stoa.org/places/423106/json has `"details": "<p>The Barrington Atlas Directory notes: near Cisterna</p>"`.

Both were read on 2026-10-15; each record was last modified 2025-07-05. The HTML pages now open with a bot check, so the JSON is the reliable place to read them.
- **Forum of Appius:** "Near Latina" (Wikidata) is sourced and fine as it is.
- **Three Taverns:** it can now take "Near Cisterna", from the Barrington note, with `pleiades:423106` already cited. This is an improvement, not a fix: the record passes without it.

#### F32–F42: what's still needed
Fixes marked **content** come first in priority.

`data/locations/sidon.json`
- **F32 (content), `otConnections` Isaiah 23:2-12 and Ezekiel 28:20-23:**
  - "Jesus later draws on this same prophetic tradition …" and "this specific judgment on Sidon, together with Isaiah's oracle against Tyre, lies behind Jesus' sayings …" are claims of dependence that no cited source states.
  - Matthew 11:21-22 and Luke 10:13-14 don't mention Isaiah or Ezekiel, and a `scripture:` source supports only what its passage says (ADR-0017). ISBE "Sidon (2)" and "Tyre" don't make the link either.
  - The PO's ruling chose these passages; their notes can still say only what the passages say. For example: "Jesus also names Tyre and Sidon together, saying it will be 'more tolerable for Tyre and Sidon on the day of judgment' than for Chorazin and Bethsaida (Matthew 11:21-22; Luke 10:13-14)". Alternatively, cite a scholarly source for the link.
  - Also, in the Ezekiel note, "it would have been more tolerable" should be the WEB's "it will be more tolerable".
- **F33 (wording), `otConnections`:**
  - **Joel 3:4-8:**
    - The text has the LORD's own treasures, not Judah's: "you have taken my silver and my gold, and have carried my finest treasures into your temples" (3:5).
    - Judah, not the LORD, sells to Sheba: "I will sell your sons and your daughters into the hands of the children of Judah, and they will sell them to the men of Sheba" (3:8).
  - **1 Kings 17:8-24:** "During a famine" isn't in the cited range; the famine is Luke 4:25 ("a great famine came over all the land") and 1 Kings 18:2. Cite Luke 4:25 with 4:26, or say "During a drought" (17:14: "until the day that the LORD sends rain").

`data/locations/myra.json`
- **F34 (content), `history[0]`:** "other sources place it under its own governor again by the reign of the emperor Vespasian" misstates both sources it cites.
  - Suetonius, *Vespasian* 8.4: "He made provinces of Achaia, Lycia, Rhodes, Byzantium and Samos, taking away their freedom". So Lycia was free, not governed, before Vespasian.
  - Tacitus, *Histories* 2.9, translator's note: "Galatia, Pamphylia, and Lycia now formed one province" (AD 69). That puts it under the governor of Galatia and Pamphylia, not its own.
  - Say what each says, as the record's own `politicalHistory` note does.

`data/locations/lasea.json`
- **F35 (content), `history[0]`, last sentence:**
  - "Pleiades' and Wikidata's own coordinates put the two about 2 km apart" names databases in the About text, which ADR-0033 item 1 rules out; VISUAL_SPEC §3 item 6 defines the About as "the summary, then the history notes". It is the only About text in the dataset that does.
  - It is also imprecise: Pleiades' two points are 1.1 km apart; it is Pleiades' description that gives 2 km. Wikidata's points are 2.1–2.2 km apart.
  - Reword without naming databases, for example "…about five miles; modern gazetteers place the two about 2 km apart", and keep the sources.
- **F36 (citations), `summary.sources`:** "south of the city of Gortyna" is stated by ISBE "Phoenix" ("12 miles South of the important city of Gortyna"), which the summary doesn't cite. Add `bib:isbe-phoenix`. I missed this in the first round.

`data/locations/syrtis.json`
- **F37 (content), `history[0]` and `politicalHistory[0].entity`:**
  - "Cyrenaica … lay well to the east" and "(whose Cyrenaican district lay to the east)" aren't stated by any cited source. ISBE "Crete" says only "With Cyrene on the North coast of Africa, it was formed into a Roman province".
  - Smith's "Cyrenaica" (https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0064:entry=cyrenaica-geo) says: "On the W. the boundary was fixed, after long disputes, at the bottom of the Great Syrtis [Arae Philaenorum]". It also says the country's shore was washed "on the W. by the Greater Syrtis". So Cyrenaica reached the gulf itself, and "well to the east" is wrong.
  - Add that entry to the bibliography, cite it, and say the boundary between Africa and Cyrenaica lay at the bottom of the gulf.
  - Also give the entity's "A sailing hazard" a source again: `bib:isbe-syrtis` or `bib:smith-dictionary-syrtis-major`, which the fix round dropped from that entry.

`data/locations/alexandria.json`
- **F38 (citations), `summary`:** "a grain ship according to the International Standard Bible Encyclopedia".
  - The cited ISBE "Alexandria" doesn't say it. ISBE "Myra" ("a grain ship from Alexandria") and "Phoenix" ("The Alexandrian corn ship carrying Paul") do, for the Myra ship only, as does Acts 27:38 ("throwing out the wheat into the sea").
  - No source calls the second ship (Acts 28:11) a grain ship, but the sentence applies the phrase to both.
  - Attach "grain" to the Myra ship, and cite `bib:isbe-myra` or `scripture:Acts 27:38`.

`data/locations/adramyttium.json`
- **F39 (citations), `summary`:** "Acts records … an Alexandrian grain ship at Myra", but no cited source says "grain". Cite `scripture:Acts 27:38`, or ISBE "Myra". I missed this in the first round.

`data/locations/lycia.json`
- **F40 (content), `summary` and the candidate's `support`:**
  - "At the southwestern tip of Asia Minor" is stated by no cited source. Wikidata Q18927 says "geopolitical region in Anatolia". ISBE "Lycia" says "An ancient country forming the southeast portion of Asia Minor", an error in the source.
  - The southwest corner of Asia Minor is the Cnidus peninsula (ISBE "Cnidus": "At the Southwest corner of Asia Minor there projects … a long, narrow peninsula").
  - Pleiades 638965 says "Lycia was a region of southwestern Asia Minor". Cite it and say "in southwestern Asia Minor".
  - Citing it on the candidate also gives the label point the second source the house style uses for regions. Pleiades' label point is 31.0 km from Wikidata's, close for a region; Mysia's two points are 72 km apart.
- **F41 (content), `summary` or `history`:**
  - "Lycia had been a free league of cities before coming under direct Roman rule: … AD 43 …, and Lycia was later joined with Pamphylia as a single province under the emperor Vespasian" reads as unbroken Roman rule from AD 43. The record's own `politicalHistory` calls AD 43–74 uncertain, citing:
    - Suetonius: Vespasian made Lycia a province, "taking away their freedom";
    - the Tacitus note: one province with Galatia and Pamphylia by AD 69;
    - ISBE "Lycia", cited: a province "In 53 AD".
  - Add that uncertainty last (ADR-0041 item 1, brief §2.6), in the same terms as Myra's history after F34.
  - The record's `parentId` is `galatia` while its text puts Lycia in Pamphylia's prefecture, and neither the record nor the research note says why. Say why the map places Lycia in Galatia at about AD 50, as `pamphylia.json` does for Pamphylia ("this project treats Pamphylia as part of Galatia at about AD 50"). The other option is `parentId: "pamphylia"`, following Dio.
- **F42 (wording), `history[1]`:** "Lycia's cities of greatest interest to Bible students" overstates ISBE's "Patara, Myra and Phaselis are of interest to Bible students".

#### Status and checks
- **Status:** the nine passing records are `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-15"` (`5855588`). The other seven stay `draft` until F32–F42 are re-checked.
- **Checks** (Node 24.21.0, on `613bde6`):
  - `npm run validate:data`: passed, 203 warnings, none in these 16 records. It passed again after the status change.
  - `npm run check:route-lines`: byte for byte, 71 lines, 0 failing.
  - `npm test`: 331 tests, all pass.
  - All 30 `textWEB` strings match the WEB exactly.
  - Every candidate's coordinates are still the stop entries'. Only three support texts changed (Fair Havens, Lasea, Phoenix's Loutro), and one source was added (Lasea's `pleiades:589834`), each a justified improvement.

### A8. Second re-check (`1dbfa82`, 2026-10-15)

I re-checked `git diff 89f4c2a..1dbfa82` (`ae813a7`, `ab4eae8`, `c9265d4`, `4011011`, `1dbfa82`): fixes F32–F42 on the seven records, Three Taverns' new modern name, and the Research Lead's own change to Lycia's `parentId`. Where the text changed, I re-read:
- the WEB;
- Smith's "Cyrenaica" (the new entry `smith-dictionary-cyrenaica`);
- Suetonius, *Vespasian* 8, and the Loeb notes to Tacitus, *Histories* 2;
- ISBE "Lycia" and "Pisidia";
- Pleiades 638965 and 423106.

**Result: 5 more records pass and are now `verified`:** `sidon`, `myra`, `lasea`, `syrtis` and `adramyttium`. With the 9 verified in §A7, **14 of batch A's 15 places are verified.** Three Taverns' new modern name also passes; that record stays `verified`. Two records still need small fixes, so batch A isn't signed off yet:
- `alexandria`: one citation (F43);
- the new `lycia`: its parent (F44) and the order of one history entry (F45).

#### F32–F42

| Fix | Result |
|---|---|
| F32 (`sidon`) | **Closed.** The Isaiah 23 and Ezekiel 28 notes now say only what the passages say. Each ends: "Jesus also names Tyre and Sidon together, saying it will be 'more tolerable for Tyre and Sidon on the day of judgment' than for Chorazin and Bethsaida". The quote matches WEB Matthew 11:22, and the dependence claim is gone. |
| F33 (`sidon`) | **Closed.**<ul><li>Joel 3:4-8: "his silver, gold and finest treasures" (3:5); "your sons and your daughters into the hands of the children of Judah", who sell them "to the men of Sheba, to a faraway nation" (3:8), both exact.</li><li>1 Kings 17:8-24: "During a drought" (17:14, "until the day that the LORD sends rain").</li></ul> |
| F34 (`myra`) | **Closed.** The history now gives each source's own claim: Suetonius, that Vespasian made Lycia a province, "implying it had freedom again by his reign"; the Tacitus note, "Galatia, Pamphylia, and Lycia now formed one province" by AD 69. The record ends on that uncertainty. |
| F35, F36 (`lasea`) | **Closed.** "Modern gazetteers place the two about 2 km apart", with no database named. The summary now cites ISBE "Phoenix" for Gortyna. |
| F37 (`syrtis`) | **Closed.** Smith's "Cyrenaica" is cited: "On the W. the boundary was fixed, after long disputes, at the bottom of the Great Syrtis", with the shore washed "on the W. by the Greater Syrtis". The history and the political note now put the gulf at the boundary between Africa and Cyrenaica, and ISBE "Syrtis" again supports "a sailing hazard". The new entry is complete, its URL answers, and the 1854 text is public domain, already covered in `docs/LICENSES.md` and `ATTRIBUTION.md`. |
| F38 (`alexandria`) | **Follow-up F43.** "Grain" now describes only the Myra ship, and Acts 27:38 is cited. |
| F39 (`adramyttium`) | **Closed.** Acts 27:38 ("throwing out the wheat into the sea") is cited for the grain ship. |
| F40 (`lycia`) | **Closed.** Pleiades 638965's own words, "a region of southwestern Asia Minor", are cited in the summary and on the candidate. That gives the label point its second source: Pleiades' point is 31.0 km from Wikidata's. |
| F41 (`lycia`) | **Partly closed.** The AD 43–74 uncertainty is now stated, in the same terms as Myra's history. The parent and the order of the entry are F44 and F45. |
| F42 (`lycia`) | **Closed.** "Patara, Myra and Phaselis as being of interest to Bible students" (ISBE). |
| Three Taverns, `names.modern` | **Passes.** "Near Cisterna", from Pleiades 423106's `details` field ("The Barrington Atlas Directory notes: near Cisterna"); the record already cites `pleiades:423106`. |

#### Lycia's parent: `pamphylia` doesn't fit; `galatia` is right
The sources do support the history's sentence: Dio (60.17.3) does say the Lycians were incorporated "in the prefecture of Pamphylia". But `parentId` follows the house rule, and this choice breaks it:
- **The house rule.** `schema/README.md` ("Ancient area hierarchy") says: "a place points to the smallest containing area, that area points to its province, and the province points to the empire". The panel shows the chain as "`Type · Province · Empire`".
- **The house practice.** Every other region record points to a province (9: `crete`, `galilee`, `judea`, `libya`, `lycaonia`, `mysia`, `pamphylia`, `pisidia`, `samaria`) or to an empire (5). `lycia` → `pamphylia` is the dataset's only region-to-region link.
- **What the `pamphylia` record is.** It is the geographic region: "a narrow, fertile coastal plain in southern Asia Minor", with its own label point. It isn't the AD 43 administrative district that Dio says took in the Lycians.
- **The timeline.** It draws Lycia and Pamphylia as separate areas throughout. Pamphylia's area is "Status uncertain (Roman-side)" from 4 BC and Lycia's from AD 43, both until AD 74, when they become the joint province.
- **The panel.** With this parent, Lycia's header would read "Region · Pamphylia · Roman Empire", and Pamphylia's "Places in Pamphylia" would list Lycia beside Perga. Acts 27:5 itself sets the two apart: "the sea which is off Cilicia and Pamphylia … Myra, a city of Lycia".
- **The right parent is `galatia`, the province:**
  - `pamphylia.json` already applies the house convention to the same uncertainty: "this project treats Pamphylia as part of Galatia at about AD 50".
  - Dio puts the Lycians in Pamphylia's district in AD 43.
  - The Tacitus note has "Galatia, Pamphylia, and Lycia" as "one province" by AD 69.

  So Lycia sits in Galatia at about AD 50 by the same reasoning, as Pisidia and Lycaonia do. Myra stays under `lycia`, and Patara (batch B) will too.

#### Still needed
- **F43 (citations), `data/locations/alexandria.json`, `summary`:** "the grain ship, according to the International Standard Bible Encyclopedia, that Paul's centurion found at Myra". The only ISBE article the summary cites, "Alexandria", doesn't say it; ISBE "Myra" does ("Paul found a grain ship from Alexandria"). Add `bib:isbe-myra` to `summary.sources`, or drop "according to the International Standard Bible Encyclopedia", since Acts 27:38 now supports the grain.
- **F44 (content), `data/locations/lycia.json`, `parentId` and `history[2]`:**
  - Set `parentId` back to `galatia`, for the reasons above.
  - Replace "this map accordingly places Lycia under Pamphylia at about AD 50" with the map's actual placement and its reason. For example: "As for Pamphylia, this map places Lycia in the province of Galatia at about AD 50."
- **F45 (wording), `data/locations/lycia.json`, `history[2]`:** the entry ends with a content sentence ("Lycia was joined with Pamphylia as a single province by AD 74"), after the caveat. Give the AD 74 union with the main content (ISBE "Pisidia": "the new double province Lycia-Pamphylia" of 74 AD). Then end with the uncertainty and the map's placement (ADR-0041 item 1).

**For the research note (docs only):**
- the 1 Kings note says "famine" is in 17:1 and 17:7; it isn't, it's in 18:2 and Luke 4:25;
- "the waters of the greater Syrtis washed its shore" is in quotation marks but isn't Smith's wording ("on the W. by the Greater Syrtis");
- Lasea's summary never cited `bib:isbe-crete`.

#### Status and checks
- **Status:** `sidon`, `myra`, `lasea`, `syrtis` and `adramyttium` are now `verified`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-15"` (`2ff0a06`). `alexandria` and `lycia` stay `draft`.
- **Checks** (Node 24.21.0, on `1dbfa82`):
  - `npm run validate:data`: passed, 203 warnings, none in these records. It passed again after the status change.
  - `npm run check:route-lines`: byte for byte, 71 lines, 0 failing.
  - `npm test`: 331 tests, all pass.
  - All 30 `textWEB` strings match the WEB exactly.
  - No candidate's label, coordinates, source or confidence changed.

### A9. Final re-check (`a9ce68a`, 2026-10-15): batch A signed off

All three remaining fixes pass:
- **F43 (`alexandria`):** `bib:isbe-myra` is now among the summary's sources. It states the claim: "Here, according to Ac 27:6, Paul found a grain ship from Alexandria". "Grain" describes only the Myra ship, and Acts 27:38 is also cited.
- **F44 (`lycia`):** `parentId` is back to `galatia`, a region pointing to its province as the house rule requires. The panel will read "Region · Galatia · Roman Empire". The history now says "As for Pamphylia, this map places Lycia in the province of Galatia at about AD 50", which matches `pamphylia.json`.
- **F45 (`lycia`):** `history[2]` now gives the main content first: Dio's AD 43 report, then the AD 74 union. Its quote, "the new double province Lycia-Pamphylia", is ISBE "Pisidia"'s exact wording, and `bib:isbe-pisidia` is cited. The uncertainty comes next and the map's placement last (ADR-0041 item 1).

**Sign-off:** all 16 batch A records are `verified`, with `verifiedBy: "fact-checker"` and `lastReviewed: "2026-10-15"`: the 15 voyage-to-Rome places and the Lycia region. `alexandria` and `lycia` were set in this round.

Earlier sections already showed the rest of the batch passing:
- The 23 route references point to the new records, and the 15 stop entries are gone (§A4).
- The route lines reproduce byte for byte (§A7, §A8).
- No new upstream source needs a licence or attribution change. The three new Smith's *Geography* entries are public domain and already listed (§A7, §A8).

**Checks** (Node 24.21.0, on `a9ce68a`):
- `npm run validate:data`: passed, 203 warnings, none in these records. It passed again after the status change.
- `npm test`: 331 tests, all pass.

## Batch B: Paul's journeys (14 places)

- **Card:** `docs/tasks/M5-07-route-places.md` · **Branch:** `data/m5-route-places`
- **Checked (batches B and C):** the Research Lead's 13 commits `9496e99`…`51dbb4f` on top of `59201f4`:
  - the 17 new records in `data/locations/`;
  - the routes switch (`data/routes/routes.json`, `data/routes/stops.json`, `scripts/lib/route-line-rules.mjs`);
  - the regenerated OpenBible lookup and its TypeScript copy;
  - the new bibliography entry `isbe-ephron-2`;
  - the research note `docs/research/M5-route-places.md` (Batches B and C).

  I checked them against ADR-0042, ADR-0041 item 1, ADR-0035, ADR-0033, ADR-0029, ADR-0028, ADR-0027, ADR-0026, ADR-0017, `schema/README.md`, the verified timeline (`data/timeline.json`) and batch A's standard (§A1–§A9).
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-16
- **Method (both batches):**
  1. **Candidates:** a script compared every record's `candidates` with `git show 59201f4:data/routes/stops.json`. I measured each point against Pleiades' place JSON and each cited Wikidata item's P625. A second script tested every point against the ancient layer's areas (`data/geo/ancient-areas.geojson`).
  2. **Scripture:** the validator compares all 23 `textWEB` strings with `data/reference/engwebp_vpl.txt`. I searched the whole WEB for every name and spelling: Seleucia, Attalia, Samothrac-, Amphipolis, Apollonia, Assos/Assus, Mitylene/Mytilene/Lesbos, Chios/Kios, Samos, Trogyllium, Cos/Coos/Kos, Rhodes/Rhodian(s), Patara, Ptolemais/Acco/Akko/Accho, Gadar-/Geras-/Gerges-, Bethphage/Bethsphage, and Ephraim/Ephrem/Ophrah/Ephron. I read each `otConnections` note against its verses.
  3. **Sources, all opened 2026-10-16:**
     - the ISBE (1915) at internationalstandardbible.com: the 14 batch B place articles, plus "Asia", "Macedonia", "Acco", "Gadara", "Gerasa; Gerasenes", "Decapolis", "Bethphage", "Ephraim (2)" and "Ephron (2)";
     - on LacusCurtius: Cassius Dio 54.7–9 and 60.23–24, Tacitus *Annals* 12.58 and *Histories* 1.1 and 2.79, Suetonius *Vespasian* 6 and 8, and Strabo 16.2.4;
     - Josephus, *Antiquities* 16.2.2 (Whiston, CCEL);
     - Smith's *Geography* (1854), "Samothrace", on Perseus;
     - Livius, "Macedonia (8)";
     - the Custodia's "Bethphage" page, and the Louvre's catalogue entry for the Victory of Samothrace (Ma 2369);
     - Pleiades' JSON for all 19 cited places;
     - Wikidata's API for the 20 cited items (labels, descriptions, aliases, P17, P131, P625, and P2046 for the islands);
     - all 19 OpenBible.info pages.
  4. **Routes:** a script converted every `{"kind": "route-stop"}` reference in the base `routes.json` to `{"kind": "location"}` and compared the result with the branch's file.
  5. **Commands:** with the official Node 24 build (v24.21.0), `validate:data`, `check:route-lines`, `npm test` and `build:data` (§C5).

### B1. Results

| Item | Pass | Needs the Research Lead | Question for the PO |
|---|---|---|---|
| Records (14) | 3: `attalia`, `assos`, `cos` | 11, with 19 fixes (F46–F64): 9 on content, 10 on citations or wording | Q2, Q3 |
| Candidates and coordinates (14) | 14, identical to the verified stop entries; Rhodes's support gains one sourced ISBE sentence | — | — |
| WEB quotes (15) and New Testament completeness | All | — | — |
| `otConnections` | 13 records rightly have none; Ptolemais's Judges 1:31 is the right verse | Ptolemais's note (F63) | — |
| Names | All titles, alternates and countries | — | — |
| Type, tier, parent, political area | 13 | Samothrace's parent and area (F47) | Island tiers (Q2) |
| `politicalHistory` | 12 derived from the timeline (the validator compares them) | Samos and Rhodes, hand-written (F55, F56, F59–F61) | — |
| Sources and licences | Every id resolves; at least two independent sources per candidate; no new upstream source | — | — |

**The main findings:**
1. **Ruling 1 (Samos, Rhodes).** The fuller histories are kept, but four entries don't match their sources (§B4):
   - Samos's freedom dates from 20 BC in Dio, not 17 BC;
   - Rhodes's liberty was restored in AD 53 under Claudius, at the plea of Nero, who was not yet emperor;
   - "the start of his reign, AD 70" is wrong for both islands: Vespasian's reign began on 1 July 69;
   - no source names the province after Vespasian.
2. **Samothrace isn't in Macedonia by any source or by the map.** No cited source puts it there. Smith's *Geography* calls it "a free state" in Pliny's time, and the ancient layer draws the island in `other-roman-lands` (F47).
3. **Three statements are wrong or unsupported:**
   - the Victory of Samothrace's date, which the Louvre contradicts (F48);
   - Rhodes's "three oldest cities", which ISBE contradicts (F58);
   - Chios's wine, which no cited source mentions (F53).
4. **Three readings are credited to Acts that Acts doesn't state:**
   - Samothrace's night anchorage (F49) and Chios's anchorage (F54), both ISBE's;
   - the "third missionary journey" label for Rhodes and Patara, which no source they cite gives (F61, F62).
5. **The rest** are citation gaps and small overstatements.

### B2. Per record

| Record | Result | Fixes |
|---|---|---|
| `seleucia` | Needs change (citations) | F46 |
| `attalia` | **Pass** | — |
| `samothrace` | Needs change | F47–F49 (F47 with Q3) |
| `amphipolis` | Needs change (citation) | F50 |
| `apollonia-macedonia` | Needs change (wording) | F51 |
| `assos` | **Pass** | — (one suggestion) |
| `mitylene` | Needs change (citation) | F52 |
| `chios` | Needs change | F53, F54 |
| `samos` | Needs change | F55, F56 |
| `trogyllium` | Needs change (wording) | F57 |
| `cos` | **Pass** | — (Q2 on its tier; one suggestion) |
| `rhodes` | Needs change | F58–F61 |
| `patara` | Needs change (citation) | F62 |
| `ptolemais` | Needs change | F63, F64 |

**Why the three pass:**
- **`attalia`:** ISBE "Attalia" states each clause:
  - "founded by Attalus II Philadelphus (159-138 BC)";
  - "a flat terrace of limestone … near the point where the Catarrhactes River flowed into the sea";
  - "in 1084 when Perga declined, Attalia became a metropolis";
  - "the chief port for ships from Syria and Egypt, and the point of entry to the interior until modern times, when the harbor at Mersine was reopened";
  - the chained harbour, "the inscribed arched gateway of Hadrian and the aqueduct".

  Acts 14:25–26 give the visit, and ISBE has "Paul and Barnabas … on the way to Antioch". Its parent and political area are Pamphylia's, as Perga's are.
- **`assos`:** ISBE "Assos" states each clause:
  - "An ancient city of Mysia in the Roman province of Asia", on "a conical-shaped rock on the southern coast of the Troad";
  - founding "by the Aeolians"; its coinage "As early as the 5th century BC … until 235 AD";
  - Hermeas, "once a slave", and Aristotle "three years, from 348 to 345 BC";
  - the double wall; the harbour "filled up and … covered with gardens", framed as of 1915.

  Acts 20:13–14 give the visit, with ISBE's "from Troas to Mitylene". Suggestion: keep ISBE's hedge for the temple, "is said to have been erected about 470 BC".
- **`cos`:** ISBE "Cos" states each clause:
  - "An island off the coast of Caria"; "one of the six Dorian colonies";
  - "famous in antiquity for excellent wine"; "a famous hospital and medical school"; "the birthplace of Hippocrates (the father of medicine)";
  - "like Corinth, … one of the Jewish centers of the Aegean"; Herod the Great among its benefactors;
  - "mentioned in connection with Paul's third missionary journey in Ac 21:1".

  ISBE "Asia" names Cos among the province's islands. Suggestion: ISBE has it "mountainous in the southern half", not mountainous throughout.

### B3. Fixes for the Research Lead (F46–F64)

Fixes marked **content** come first in priority.

#### `data/locations/seleucia.json`
- **F46 (citations):**
  - `history[0]`: "one of four sister cities its founder built" isn't in the cited ISBE ("one of the Syrian Tetrapolis, the others being Apameia, Laodicea and Antioch"). It is in Strabo 16.2.4: "these cities, all founded by Seleucus Nicator, used to be called sisters". Add `bib:strabo-geography`.
  - `summary`: "sailed back to Antioch from Attalia". Only Acts 14:25 names Attalia; 14:26 says "From there". Add `scripture:Acts 14:25`.

#### `data/locations/samothrace.json`
- **F47 (content), `parentId`, `politicalAreaId` and `politicalHistory`:** all three are Macedonia's, and nothing supports that.
  - No cited source places Samothrace in the province of Macedonia:
    - ISBE "Samothrace": "An island in the Aegean Sea, South of Thrace opposite the mouth of the Hebrus River";
    - ISBE "Macedonia" and Livius "Macedonia (8)", the table's own sources, don't name the island;
    - Smith's *Geography* (1854), "Samothrace" (https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0064:entry=samothrace-geo): "In Pliny's time Samothrace was a free state".
  - The research note's reason, "the Roman province's own borders ran along this coast past the older ethnic-geographic boundary of Thrace", has no source. Neapolis isn't a precedent: its point lies just off Macedonia's coast, 1.4 km from the `macedonia` area, with no other area within 14 km.
  - The ancient layer draws the island in `other-roman-lands`, not `macedonia`, so the panel would contradict the map.
  - **Fix (your choice, Q3):**
    - (a) follow the sources and the map: `parentId: "roman-empire"`, like Phrygia, Pontus and the Syrtis. Then either use `politicalAreaId: "other-roman-lands"`, whose derived table shows the Roman Empire for 4 BC–AD 101, or, like Samos and Rhodes, use no area and a sourced entry such as "Free state under Roman rule", citing a new Smith's *Geography* entry. Smith's *Geography* is public domain and already in `docs/LICENSES.md` and `ATTRIBUTION.md`.
    - (b) keep Macedonia, but only with a source that states it, and a GIS change to the area.

    I recommend (a).
- **F48 (content), `history[0]`:**
  - "as the seat from which the god Poseidon watched the Trojan War": ISBE says only "mentioned in the Iliad (xiii.12) as the seat of Poseidon". Say that.
  - "set up on the island around 300 BC by the Macedonian ruler Demetrius Poliorcetes" states ISBE's 1915 attribution ("set up here by Demetrius Poliorcetes circa 300 BC") as fact. The Louvre, which holds the statue (Ma 2369, https://collections.louvre.fr/en/ark:/53355/cl010252531, read 2026-10-16), dates it "-200 / -175 (1e quart IIe s. av. J.-C.)", with "Place of creation : Rhodes (?)", found at Samothrace in 1863.
  - Drop the date and the dedicator, keeping "discovered there in 1863 and now in the Louvre". Or give the Louvre's dating with a new bibliography entry. If ISBE's view stays, attribute it to ISBE and put it last (ADR-0041 item 1).
- **F49 (wording), `summary`:**
  - "Acts records that … made a straight course to Samothrace, anchoring for the night at a town on the island's northern end": Acts 16:11 has only "made a straight course to Samothrace, and the day following to Neapolis". The anchorage is ISBE's: "At the northern end of Samothrace was a town where the ship could anchor for the night". Attribute it to ISBE, as Rhegium's "tacking" was attributed in batch A (F21).
  - "Philip of Macedon": introduce him, as `amphipolis.json` does ("the Macedonian kings Perdiccas and Philip") (ADR-0033).

#### `data/locations/amphipolis.json`
- **F50 (citations), `summary`:** "the great Roman road running from the Adriatic coast toward the Hellespont".
  - The cited ISBE "Amphipolis" has the road run "from Dyrrhachium on the Adriatic to the Hebrus (Maritza)".
  - "The Hellespont" is in ISBE "Macedonia" ("continued eastward to the Nestus and the Hellespont"), which the summary doesn't cite.
  - Add `bib:isbe-macedonia`, or say "to the river Hebrus".

#### `data/locations/apollonia-macedonia.json`
- **F51 (wording):**
  - `history[0]`: "dates Apollonia's founding to about 432 BC" drops ISBE's hedge: "The foundation of the town may perhaps be attributed to about 432 BC".
  - `summary`: "a day's journey between Amphipolis and Thessalonica". ISBE's day's journey is from Amphipolis: "a day's journey (Livy xlv.28) or about 30 Roman miles from the former and 38 from the latter". Say "a day's journey from Amphipolis".

#### `data/locations/mitylene.json`
- **F52 (citations), `summary`:** "before sailing on toward Chios and Samos". ISBE "Mitylene" names only Chios ("opposite the island of Chios (Ac 20:15)"), and only Acts 20:15 names Samos. Add `scripture:Acts 20:15`.

#### `data/locations/chios.json`
- **F53 (content), `summary`:** "known in antiquity for its wine". No cited source says so. ISBE "Chios" names its "beautiful blue marble", its "excellent potter's clay" and its people's "skill in telling stories". Drop "wine" or cite a source.
- **F54 (wording):**
  - `summary`: "Acts records that … came the following day opposite Chios, apparently anchoring overnight on the Asian coast". The anchorage is ISBE's conjecture, after Hastings: "more probably it simply means that, because of the dark moon, they lay at anchor for the night on the Asian coast opposite the island". Attribute it to ISBE.
  - `history[0]`: "had proved too costly for the city to restore on its own". Josephus (Whiston, *Antiquities* 16.2.2) says the portico "was very large and fine building, so was it not so easy to rebuild that as it was the rest". Use his terms.

#### `data/locations/samos.json` (ruling 1; see §B4)
- **F55 (content), `politicalHistory[0]` and `[1]`, `history[1]`:** the freedom of "17 BC".
  - The date is ISBE's ("in 17 BC it became a civitas libera … (Dio Cass. liv.9; Pliny, NH, v.37)"). The authority ISBE cites puts the grant three years earlier.
  - Cassius Dio 54.7.4 has Augustus winter on Samos, then move on "in the spring of the year when Marcus Apuleius and Publius Silius were consuls" (20 BC).
  - 54.9.3 records that year's grants ("To Herod he entrusted the tetrarchy of a certain Zenodorus", which the timeline dates to 20 BC). 54.9.7 continues: Augustus "returned to Samos and once more passed the winter there. In recognition of his stay he gave the islanders their freedom".
  - Date the change from −20, the year Dio narrates it under (the winter of 20/19 BC), and cite `bib:cassius-dio-roman-history`. Give ISBE's 17 BC last, in a note.
- **F56 (content), `politicalHistory[2]` (and Rhodes, F60):** "this map uses the start of his reign, AD 70".
  - **It is wrong.** Tacitus, *Histories* 2.79, in the year of Galba's second consulship (1.1, AD 69): Tiberius Alexander administered the oath "on the first of July. This day has been celebrated in later times as the first of Vespasian's reign". Suetonius, *Vespasian* 6.3, agrees: "the Kalends of July, the day which was afterwards celebrated as that of his accession".
  - **The record dates a change no source dates.** Suetonius (8.4) gives no year. The verified timeline reads the same sentence for Achaia as a span: "the status here is shown as unclear from Vespasian's first full year as emperor until his death in 79, when it is a province again". So use 70–79 `uncertain-roman-side`, with that wording, then 79–101 the province.
  - **"Roman province of Asia":** Suetonius says only that he "made provinces of … Samos, taking away their freedom". For Samos, add ISBE "Asia", which names "apparently the islands of Lesbos, Samos, Patmos, Cos" among the province's lands.
- **Suggestion (neutrality, brief §2.6):** "the Apocrypha's first book of Maccabees" uses one tradition's label; "the book of 1 Maccabees" doesn't.

#### `data/locations/trogyllium.json`
- **F57 (wording):**
  - `summary`: "Many manuscripts of Acts record that Paul's ship stayed at Trogyllium". No cited source says "many". ISBE "Trogyllium" says the King James Version has the words and "Several of the early manuscripts omit the words". For example: "Acts, in the text the WEB follows, records …; several early manuscripts omit this detail".
  - The candidate's `support` ends "; see the route's note". On the Map tab the place panel has no route note, and the record's summary now gives the caveat. Drop the pointer. It's a justified support change; the coordinates don't change.

#### `data/locations/rhodes.json` (ruling 1; see §B4)
- **F58 (content), `history[1]`:**
  - "the island's three oldest cities, Lindus, Ialysus and Camirus": ISBE says "The most ancient cities of Rhodes were Ialysus, Ochyroma, and Lindus". Lindus, Ialysus and Camirus are the three that joined the Hexapolis and, as "the three chief cities", founded the capital in 408 BC. Say "three chief cities".
  - "was rewarded with the Carian coast, though by 168 BC Rome had taken back most of that territory": ISBE says "she received Caria. In 168, however, only a small portion of this territory remained under Rhodian sway". It doesn't say the coast only, or that Rome took the land back.
- **F59 (content), `politicalHistory[2].entity`:** "Free city (liberty restored by the emperor Nero)". Tacitus, *Annals* 12.58, in the consulate of Decimus Junius and Quintus Haterius (AD 53): "Nero, at the age of sixteen, received in marriage the emperor's daughter Octavia … By his advocacy, again, … the Rhodians recovered their liberties". Nero wasn't emperor until AD 54; Claudius was. Say "liberty restored under the emperor Claudius, at the plea of the young Nero".
- **F60 (content), `history[2]` and `politicalHistory[3]`:** the same as F56. "The start of Vespasian's reign, AD 70" is wrong, so use the timeline's 70–79 uncertain span. Name the province only with a source. ISBE "Rhodes" dates Rhodes's first incorporation into Asia to 44 AD, and no cited source names its province after Vespasian.
- **F61 (citations and wording):**
  - `politicalHistory[0]` (4 BC–AD 44, "Free Greek state, allied with Rome") cites Suetonius, whose sentence concerns Vespasian's reign. The note's "still held their freedom before the emperor Vespasian's reign" doesn't speak to these years. The source that does is Dio 60.24.4, "The Rhodians were deprived of their liberty because they had impaled some Romans" (AD 44). Cite Dio with ISBE.
  - "impaled some Roman citizens" (`history[2]`) and "impaling Roman citizens" (`politicalHistory[1].note`): Dio has "some Romans".
  - `politicalHistory[1].note`: "the encyclopedia independently dates" isn't shown by any source; say "also dates".
  - `summary`: "on his return from his third missionary journey" isn't stated by any cited source. ISBE "Rhodes" has "on his voyage southward from the Hellespont to Caesarea". Cite a source that names the journey, such as `bib:isbe-cos` ("Paul's third missionary journey in Ac 21:1"), or use ISBE "Rhodes"'s wording.

#### `data/locations/patara.json`
- **F62 (citations), `summary`:** "on his return from his third missionary journey". The cited ISBE "Patara" doesn't say it ("from which, according to Ac 21:1, Paul took a ship for Phoenicia"). Fix as in F61.

#### `data/locations/ptolemais.json`
- **F63 (content), `otConnections[0].note`:** "the Canaanite town on this site that was later refounded under the Greek name Ptolemais".
  - Neither Judges 1:31 nor ISBE "Ptolemais" ("Same as 'Acco' in Jg 1:31") says this.
  - ISBE "Acco" (https://www.internationalstandardbible.com/A/acco.html) does: the Ptolemies "changed the name to PTOLEMAIS". Judges 1:32 has "the Asherites lived among the Canaanites".
  - Add an ISBE "Acco" entry (public domain, already covered) and `scripture:Judges 1:32`. Or say "the town the encyclopedia identifies with Ptolemais".
- **F64 (wording), `summary`:** "in the time of the Maccabees" names a group most readers don't know from the Protestant Bible. Introduce them, with a source (ADR-0033).

### B4. Ruling 1: Samos and Rhodes

I checked every entry against its source, as you asked: dates, status changes, and who granted or removed freedom.

| Entry | Source says | Result |
|---|---|---|
| Samos joined to Asia, 84 BC | ISBE "Samos": "In 84 BC, the island was joined to the province of Asia" | Pass |
| Samos free, granted by Augustus, from 17 BC | ISBE: 17 BC; its own authority, Dio 54.9.7: the winter of 20/19 BC, "he gave the islanders their freedom" | **F55** (the year) |
| Samos and Rhodes lose freedom under Vespasian | Suetonius, *Vespasian* 8.4: "He made provinces of Achaia, Lycia, Rhodes, Byzantium and Samos, taking away their freedom" | Pass for the act; **F56/F60** for "the start of his reign, AD 70" and the province |
| Rhodes free and allied, 4 BC–AD 44 | Dio 60.24.4 (AD 44) implies it; ISBE: "the faithful ally of Rome after … 189 BC" | Pass in substance; **F61** (cites Suetonius instead of Dio) |
| Rhodes's freedom removed under Claudius, AD 44; part of Asia | Dio 60.24.4, among Claudius's acts after his British triumph; ISBE: "made a part of the Roman province of Asia (44 AD)" | Pass ("Romans", not "Roman citizens": F61) |
| Rhodes's liberty restored, AD 53 | Tacitus, *Annals* 12.58 (AD 53), "by his [Nero's] advocacy"; the quotation matches the Loeb text exactly | Pass for the year and the quotation; **F59** ("the emperor Nero") |

With F55, F56 and F59–F61 made, both tables will match their sources.

### B5. What passes

**Candidates and coordinates.** All 14 batch B candidates are identical to the verified stop entries: label, coordinates, `coordinateSource`, confidence, support and sources. The one exception is Rhodes's support, which adds ISBE's "an island (and city)" and "at the northeastern extremity", both exact and a justified improvement. No coordinates are swapped. Every point agrees with two independent sources:

| Record | Stored `[lon, lat]` | Pleiades | Cited Wikidata item |
|---|---|---|---|
| `seleucia` | [35.922, 36.124] | 0.67 km (658483) | 0.00 km (Q1605894) |
| `attalia` | [30.703614, 36.881272] | 1.06 km (638778) | 3.07 km (Q6487, the modern city) |
| `samothrace` | [25.583333, 40.45] | 0.65 km (501597) | 0.35 km (Q203175) |
| `amphipolis` | [23.847209, 40.820159] | 0.79 km (501347) | 0.40 km (Q217414) |
| `apollonia-macedonia` | [23.469685, 40.623703] | 0.00 km (491526) | 0.24 km (Q2751389) |
| `assos` | [26.336667, 39.490556] | 0.05 km (550463) | 0.00 km (Q744631) |
| `mitylene` | [26.547048, 39.110475] | 0.00 km (550763) | 0.86 km (Q189059) |
| `chios` | [26.1375, 38.3725] | 0.40 km (550496, the town) | 10.97 km (Q160483, the island; the support says the point is the town) |
| `samos` | [26.8333, 37.75] | 2.02 km (599926) | 0.00 km (Q156882) |
| `trogyllium` | [27.003279, 37.659431] | 0.36 km (599991) | 0.00 km (Q2937072) |
| `cos` | [27.110278, 36.815278] | 2.56 km (599581) | 0.00 km (Q187027) |
| `rhodes` | [28.2109, 36.4402] | 1.53 km (590030) | 0.92 km (Q188731) |
| `patara` | [29.314167, 36.260278] | 0.17 km (639042) | 0.00 km (Q233121) |
| `ptolemais` | [35.0692, 32.9214] | 0.99 km (678010) | 1.47 km (Q126084) |

The distances in the text agree with the records' own points:
- Seleucia is 25.0 km from Antioch's point (ISBE's 16 miles);
- Apollonia is 38.6 km and 43.6 km in a straight line from Amphipolis and Thessalonica (ISBE's 30 and 38 Roman miles by road).

**Scripture.**
- All 15 `textWEB` strings match the WEB.
- Each place's New Testament verses are all present. Every name occurs once in the WEB New Testament except Assos (Acts 20:13, 14).
- Only Ptolemais is named in the Old Testament (Acco, Judges 1:31). That verse is its one connection, quoted exactly. No other batch B place occurs in the WEB Old Testament.

**Names (ADR-0026, ADR-0028).**
- **Titles:** they are the verified stop names, the six versions' majority forms (M5-02 §3).
- **`alternate`:** it holds the other versions' spellings: Samothracia (KJV), Kios (NLT), Kos (NIV) and Coos (KJV). It also holds "Seleucia Pieria", a historical name in Wikidata's aliases and Pleiades' names.
- **Modern names:** they are the stops', except Seleucia's "Near Kapısuyu", from Pleiades 658483's Barrington note ("Kapısuyu/Kaboussié"), which is more precise. Trogyllium's "Dip Burun" is Pleiades' own description ("The modern Dip Burun in Turkey").
- **Countries:** all are right.

**Type, tier, prominence, parent, political area.** These follow the card and the house chain:
- the cities are at city tier;
- Trogyllium, a cape, is `natural-feature` at site tier;
- the islands are `natural-feature`; Rhodes is at region tier, like Malta (Q2 on the others);
- every prominence is "standard";
- Seleucia and Ptolemais are under `syria`, like Tyre and Sidon;
- Attalia is under `pamphylia`, like Perga;
- Amphipolis and Apollonia are under `macedonia` (ISBE: "A town in Macedonia"; "a district in Macedonia");
- Assos is under `mysia` (ISBE: "An ancient city of Mysia in the Roman province of Asia");
- Mitylene, Chios, Samos, Trogyllium, Cos and Rhodes are under `asia` (ISBE "Asia");
- Patara is in `lycia` (card).

The exception is Samothrace (F47).

**`politicalHistory`.** The 12 records with a `politicalAreaId` reproduce their areas' tables exactly. The validator derives and compares them, and the holder ids are the timeline's. Samos's and Rhodes's hand-written tables use real holder ids and leave no gaps or overlaps. Their content is §B4.

**Sources.**
- Every source id resolves.
- Each candidate has at least two independent sources: Pleiades, Wikidata and OpenBible.info, plus the ISBE.
- Batch B adds no bibliography entry. Every source it uses is already listed in `docs/LICENSES.md` and `ATTRIBUTION.md`, and the ISBE (1915), Whiston, the Loeb texts and Smith's *Geography* are public domain.

## Batch C: Jesus' journeys (3 places)

Same method, sources and date as batch B.

### C1. Results

| Item | Pass | Needs the Research Lead | Question for the PO |
|---|---|---|---|
| Records (3) | — | 3, with 10 fixes (F65–F74): 6 on content, 4 on citations or wording | Q1 |
| Candidates and coordinates (6) | 6, identical to the verified stop entries | — | — |
| WEB quotes (8) and New Testament completeness | All, including Luke 8:37, which the stop entry lacked | — | — |
| `otConnections` | Bethphage's Zechariah 9:9, which Matthew 21:4–5 itself cites | Ephraim's three notes (F73) | — |
| Ruling 2 (the Gadarenes' parent) | `syria` is supported for every candidate area (§C2) | F65, F66 | — |
| New bibliography entry `isbe-ephron-2` | Complete, URL answers, Masterman's byline, public domain | What it's cited for (F73) | — |

**The main findings:**
- **Ruling 2:** a cited source supports Syria for each candidate area, so the parent becomes `syria` (F65). The same source puts Kursi under Gadara, so Kursi's Philip's-tetrarchy table must go (F66).
- **Bethphage:** the summary gives all three Gospels Matthew's donkey and colt (F70).
- **Ephraim:** its Old Testament notes misquote ISBE "Ephron (2)". They also conflict with ISBE "Ephraim (2)", the record's main source, which puts 2 Samuel 13:23's Ephraim elsewhere (F73).
- **The Gadarenes' history:** it misstates ISBE "Gadara" on the readings (F68).

### C2. Ruling 2: the country of the Gadarenes's parent is `syria`

You asked me to accept `syria` only if a cited source supports the attachment for each candidate area. It does, for all three:

| Candidate | What the cited sources state |
|---|---|
| Kursi | ISBE "Gadara" (cited on this candidate): "It maybe taken as certain that the jurisdiction of Gadara, as the chief city in these regions, extended over the country East of the Sea, including the lands of the subordinate town, GERASA". ISBE "Gerasa" (cited): "Gerasa itself is probably represented by the ruins of Kurseh". So the Kursi shore was Gadara's land, which "after Herod's death … was joined to the province of Syria, 4 BC" (ISBE "Gadara"). |
| Gadara | ISBE "Gadara": joined to Syria in 4 BC; "Gadara was a member of the DECAPOLIS". ISBE "Decapolis": "They were independent of the local tetrarchy, and answerable directly to the governor of Syria", and Pliny's list includes "Gadara (Umm Qeis)". |
| Gerasa (Jerash) | ISBE "Gerasa": "The great and splendid city in the Decapolis"; ISBE "Decapolis": "Gerasa (Jerash)" in the list, answerable to the governor of Syria; Pleiades 678158 (cited): "in 63 B.C. Pompeius Magnus made it part of the Decapolis". |

**Outcome: `parentId: "syria"` (F65).** The chain becomes site → province → empire, as Sidon's and Tyre's do. The Bethsaida precedent doesn't apply, because no cited source places any of these candidates in Philip's tetrarchy.

### C3. Fixes for the Research Lead (F65–F74)

#### `data/locations/country-of-the-gadarenes.json`
- **F65 (content), `parentId`:** set it to `syria` (§C2).
- **F66 (content), `politicalHistory`, candidate 0 (Kursi):** its seven entries copy the `philip-tetrarchy-lands` table.
  - No cited source places Kursi in Philip's tetrarchy. The entries' sources (ISBE "Ituraea": "The country of Zenodorus … including Paneas and Ulatha"; Josephus) describe Philip's lands, not this shore.
  - The record's own ISBE "Gadara" puts the shore under Gadara (§C2).
  - The map draws Kursi inside `philip-tetrarchy-lands` only as a drawing simplification. M4's research note (§2.24 #3b) keeps even Hippos there "under rule 4 (its own small territory is not independently drawable…)", and the timeline's 4 BC stop says "Gaza, Gadara and Hippos -- are cut away and added to the province of Syria".
  - Replace the table with what ISBE "Gadara" supports:
    - 30–4 BC `herod-the-great` ("given by Augustus to Herod the Great in 30 BC");
    - 4 BC–AD 101 `roman-province-syria` ("After Herod's death it was joined to the province of Syria, 4 BC"; ISBE "Decapolis");
    - optionally, Gadara's earlier free-city entry.

    Each note should say that ISBE puts this shore under Gadara's jurisdiction. The last note should say that the map draws the shore with Philip's former lands. If a source is found that puts Kursi in Gaulanitis, give both views instead (brief §2.6).
- **F67 (content), `politicalHistory`, candidate 2 (Gerasa):** its one entry starts at −65 with `roman-province-syria`.
  - That is before the province existed: the timeline's `syria` area starts at −64 (Livius, "Damascus").
  - Pleiades 678158, cited on this candidate, says "in 63 B.C. Pompeius Magnus made it part of the Decapolis".
  - Start at −63, as Gadara's free-city entry does, and keep ISBE "Decapolis"'s "about the time of Pompey's campaign in Syria, 65 BC" in the note.
- **F68 (content), `history[0]`:** "The International Standard Bible Encyclopedia treats this as a real difference between ancient manuscripts, not a translator's choice".
  - ISBE "Gadara" says something else. It reads "country of the Gadarenes" at Matthew 8:28 and "country of the Gerasenes" at Mark 5:1 and Luke 8:26, 37. It says "There is no good reason, however, to question the accuracy of the text in either case", because "The place might therefore be called with propriety, either 'land of the Gerasenes,' with reference to the local center, or 'land of the Gadarenes,' with reference to the superior city". Only the Textus Receptus reading "of the Gergesenes … must be rejected (Westcott-Hort …)".
  - Say what ISBE says.
  - Cite `scripture:Matthew 8:28`, `scripture:Mark 5:1` and `scripture:Luke 8:26` for the WEB's readings.
  - Introduce Westcott-Hort, for example as ISBE "Gerasa" does: "Westcott and Hort, The New Testament in Greek" (ADR-0033).
- **F69 (citations and wording), `summary` and `history[1]`:**
  - "on the eastern side of the Sea of Galilee", and the closing "disputed among three candidates, each named differently in the Gospels' own manuscripts": the cited passages don't say this. Luke 8:26 has "opposite Galilee", and Mark 5:1 "the other side of the sea". Add `bib:isbe-gerasa` ("It was on the eastern shore of the Sea of Galilee") and `bib:isbe-gadara`.
  - "Mark and Luke describe one" and "lived among the tombs": cite Mark 5:2–3 ("He lived in the tombs") and Luke 8:27 ("didn't live in a house, but in the tombs").
  - "Mark and Luke record that the demons, who called themselves 'Legion, for we are many'": these are Mark's words (5:9). Luke 8:30 has "'Legion,' for many demons had entered into him". Credit the phrase to Mark and cite Luke 8:30.
  - "a large herd of pigs feeding nearby": Mark 5:11 has "on the mountainside", Luke 8:32 "on the mountain", and Matthew 8:30 "far away from them". Say "on the hillside" and cite Mark 5:11 and Luke 8:32–33.
  - `history[1]`: introduce "Pompey" ("the Roman general Pompey") (ADR-0033).

#### `data/locations/bethphage.json`
- **F70 (content), `summary`:** "All three Synoptic Gospels record that … Jesus sent two disciples ahead to bring him a donkey and her colt".
  - Only Matthew 21:2 has both ("a donkey tied, and a colt with her").
  - Mark 11:2 has "a young donkey tied, on which no one has sat", and Luke 19:30 "a colt tied". Each has one animal.
  - Credit the two animals to Matthew, and cite `scripture:Mark 11:2` and `scripture:Luke 19:30`.
- **F71 (wording), `summary` and `history[0]`:**
  - "on the road from Jerusalem to Jericho": ISBE has "Near the Mount of Olives and to the road from Jerusalem to Jericho". Say "near the road".
  - "for the final time": the cited verses don't say it. Drop it or cite it.
  - "a prophecy that Jerusalem's king would come to her": Matthew 21:5 has "Tell the daughter of Zion, behold, your King comes to you". Use Matthew's words.
  - `history[0]`: introduce "the Talmud" (ADR-0033).
- **F72 (wording), `names.modern`:** "Et-Tur (Kafr et-Tur)" dropped the verified stop's ", Jerusalem" ("Et-Tur (Kafr et-Tur), Jerusalem").
  - The record carries no country because ADR-0028 exempts places inside Jerusalem, whose "modern name already says 'Jerusalem'".
  - Wikidata Q2193088's P131 is Jerusalem (Q1218).
  - Restore it.

#### `data/locations/ephraim.json`
- **F73 (content), `otConnections` (all three notes):** they misstate ISBE "Ephron (2)".
  - **What ISBE "Ephron (2)" says:** Ephron (2 Chronicles 13:19) "is thought by many to be identical with Ophrah (`ophrah, Jos 18:23) and perhaps with Ephraim (`ephrayim, 2Sa 13:23) which both have been localized at the lofty town of eT Taiyibeh".
    - It doesn't say that "many scholars think" Ophrah, or 2 Samuel's Ephraim, is identical "with this Ephraim", John's. It never mentions John 11:54.
    - For 2 Samuel 13:23 it says only "perhaps", not "many scholars think".
  - **The record's main source places 2 Samuel 13:23's Ephraim elsewhere.** ISBE "Ephraim (2)" makes it a separate place, entry (1): "It may be identical with the Ephraim of Eusebius, Onomasticon, 20 Roman miles North of Jerusalem, and therefore to be sought somewhere in the neighborhood of Sinjil and el-Lubban". John's town is entry (2), "probably" at et-Taiyibeh. The note hides that conflict.
  - **Joshua 18:23** lists Ophrah but doesn't name Benjamin; 18:21 does ("the cities of the tribe of the children of Benjamin").
  - **Fix:**
    - Give Joshua 18:23 and 2 Chronicles 13:19 in ISBE's own words: identified "by many" with each other and "localized" at et-Taiyibeh, where ISBE "Ephraim (2)" "probably" places John's town. Cite `bib:isbe-ephraim` too, and cite Joshua 18:21.
    - Drop 2 Samuel 13:23, or give both of ISBE's views of it.
- **F74 (wording), `summary` and `history[0]`:**
  - "Ephraim was a town … on a high hill overlooking the plains of Jericho and the Dead Sea": ISBE says this of et-Taiyibeh ("It stands on a high hill with a wide outlook including the plains of Jericho and the Dead Sea"), which Ephraim "probably answers to". Keep the hedge, for example "probably the village of et-Taiyibeh, which stands on a high hill …".
  - `history[0]`: introduce the Onomasticon, for example as Eusebius's list of biblical places (ADR-0033).

### C4. What passes

**Candidates.** All 6 candidates are identical to the verified stop entries. The four route references to the Gadarenes and Bethphage keep `candidateIndex: 0`.

| Record | Candidate | Pleiades | Cited Wikidata item |
|---|---|---|---|
| `country-of-the-gadarenes` | Kursi [35.650415, 32.825796] | 0.00 km (726708218) | 0.03 km (Q2469418) |
| | Gadara [35.677263, 32.65608] | 0.00 km (678142) | 0.20 km (Q1490815) |
| | Gerasa [35.891091, 32.280087] | 0.00 km (678158) | 0.89 km (Q56072866) |
| `bethphage` | Et-Tur [35.250778, 31.777222] | — | 0.00 km (Q2193088); OpenBible.info, ISBE, the Custodia |
| | Abu Dis [35.265833, 31.7625] | — | 0.00 km (Q246590); OpenBible.info |
| `ephraim` | Taybeh [35.299196, 31.954665] | 0.00 km (687896) | 0.10 km (Q931667) |

**Scripture.**
- **Quotes:** all 8 `textWEB` strings match the WEB.
- **The Gadarenes:** the WEB names the place at exactly Matthew 8:28, Mark 5:1, Luke 8:26 and 8:37, and all four are present. Luke 8:37 is a gain over the stop entry.
- **Bethphage:** it is named at exactly Matthew 21:1, Mark 11:1 and Luke 19:29.
- **Ephraim:** it is named in the New Testament only at John 11:54.
- **Bethphage's `otConnections`:** Zechariah 9:9 is the right connection. Matthew 21:4–5 makes it ("that it might be fulfilled which was spoken through the prophet"), and the note quotes Matthew 21:5 exactly.

**Names.**
- **Titles:** they are the verified stop names; "Bethsphage" (the WEB) is in `alternate`.
- **Countries:** the Gadarenes' "Golan Heights" and "Jordan" are right. Kursi is "an archaeological site on the Golan Heights" (Wikidata) and lies "in the Golan Heights" (Pleiades), and Umm Qais and Jerash are in Jordan. Ephraim's "West Bank" follows ADR-0028.
- **Modern name:** the disputed Gadarenes rightly has none.

**Type, tier and parent.**
- The Gadarenes is a `site` at city tier, like Bethany beyond the Jordan.
- Bethphage is a village at city tier (Q1 on its parent).
- Ephraim is a town under `judea`, in Jericho's political area. Its point lies inside `judea-samaria-idumea`, and its table is derived.

**The Gadarenes' other hand-written entries.** Gadara's free city from 63 BC, Herod's from 30 BC and Syria's from 4 BC match ISBE "Gadara" ("Pompey is said to have restored it, 63 BC … He gave it a free constitution"; "given by Augustus to Herod the Great in 30 BC"; "After Herod's death it was joined to the province of Syria, 4 BC").

**Bethphage's history.** The Custodia page says "The sanctuary of Bethphage is located on the eastern part of the Mount of Olives". It tells of the Crusader-painted stone found there in 1870, which matches ISBE's "medieval Bethphage … now enclosed by the Roman Catholics".

### C5. Both batches: the routes switch, the duplicate check, the warnings, the checks

**The routes switch.**
- **The conversion:** converting all 31 batch B and C `{"kind": "route-stop", "stopId": …}` references in the base `routes.json` to `{"kind": "location", "locationId": …}` reproduces the branch's file exactly. They are 14 `from`, 14 `to` and 3 `via`, with each `candidateIndex` kept, and nothing else in the routes changed.
- **`stops.json`:** it is `{"version": 1, "stops": []}`.
- **Leftovers:** no `route-stop` reference to these 17 ids remains in `data/`, `scripts/` or `tests/`.
- **`route-line-rules.mjs`:** the one key change, `route-stop:chios` → `location:chios` in `ISLAND_VIAS`, is a plain rename. The lines reproduce byte for byte.
- **The OpenBible lookup:** it gains 19 slugs (73 in all), its TypeScript copy matches, every cited slug is present and none is stale. All 19 pages answer with the right titles.

**Bethphage's neighbours and the duplicate check (card item 3).** The validator's view is that there is nothing to compare.
- Its only duplicate check by distance compares entries in `stops.json` with locations (`scripts/lib/validator.mjs`, around lines 3240–3330). With `stops.json` empty, nothing is compared.
- No check compares one location with another. Its name check (around lines 3947–3973) looks only inside one record.
- So `ROUTE_STOP_LOCATION_DUPLICATE_ALLOWLIST` no longer has any effect.

My own check of all 122 records found only Bethphage's eight allow-listed neighbours within 2 km (0.49–1.99 km) and no shared English names. So no record is a duplicate. If the card's rule should hold for future places, the GIS Engineer would need to add a check that compares locations with each other (note N3).

**The 4 new warnings are acceptable.** They fire because the Gadarenes' one configured name is the compound title, which no verse contains verbatim. Each verse does name the place ("the country of the Gadarenes", "the country of the Gergesenes"), and the scripture links are right. Search finds the place by each spelling, because `app/src/features/search/place-search.ts` matches any word start (`/[\p{L}\p{N}]+/gu`) in the title.

Optional: adding "Gadarenes", "Gergesenes" and "Gerasenes" to `names.alternate` would follow ADR-0026's "every version's spelling" literally, as Bethphage's "Bethsphage" does, and would clear the warnings.

**Checks** (Node 24.21.0, on `51dbb4f`; no tracked file changed):
- `npm run validate:data`: passed, 0 errors, 207 warnings. The 4 new warnings are the Gadarenes' (above); there are none in the other 16 records. It passed again after the status change.
- `npm run check:route-lines`: "Reproduced route lines byte-for-byte from an empty cache"; 71 lines audited, 0 failing.
- `npm test`: 331 tests, all pass.
- `npm run build:data`: passed. The places index is 45,445 bytes (7,138 gzip); the Routes files are 24,864 bytes gzip of the 100,000 budget.

**Status:** `attalia`, `assos` and `cos` are now `verified`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-16"`. The other 14 stay `draft` until F46–F74 are re-checked.

### C6. Questions for the PO

- **Q1. Bethphage's parent: `jerusalem`, as drafted, or `judea`? Not blocking.**
  - **For `jerusalem`:** Bethphage sits on the Mount of Olives, which is `jerusalem`'s child. Its modern site, Et-Tur, lies inside Jerusalem (Wikidata P131). ADR-0028's no-country rule follows the parent chain in the validator.
  - **For `judea`:** Bethany, 0.79 km away, is under `judea`. ISBE puts ancient Bethphage "near but outside Jerusalem". Every other child of `jerusalem` is a site-tier site, while Bethphage is a city-tier village. With `jerusalem`, "Places in Jerusalem" will list it.
  - I'd keep `jerusalem` and restore "Jerusalem" in its modern name (F72).
- **Q2. Island tiers. Not blocking.**
  - The card's rule is "small islands follow Patmos (city tier), large ones Malta (region tier)". Wikidata's areas (P2046):
    - Chios 842.5 km², Samos 476 km² and Cos 290.3 km²;
    - Malta 316 km² (Q233, Malta's own cited item);
    - Samothrace 178 km² and Patmos 34.14 km².
  - The draft puts only Rhodes at region tier. Its reason, that Acts names the island as where the ship called, doesn't separate Cos from Rhodes: Acts 21:1 names both alike ("to Cos, and the next day to Rhodes").
  - Should Chios and Samos, and perhaps Cos, be at region tier too? If so, they need a re-check. `cos` is verified as it stands.
- **Q3. Samothrace's political placement (F47).**
  - (a) Follow the sources and the map: no Macedonia; `parentId: "roman-empire"`; either `other-roman-lands`, or a sourced "free state" entry, as for Samos and Rhodes.
  - (b) Keep Macedonia with a source, plus a GIS change.

  I recommend (a). The Research Lead needs your choice before F47.

### C7. Notes for the PO, and for the research note

- **N1. The browser suite's real-data route-stop check will fail.** `scripts/verify-web-export-playwright.mjs` (the "Routes real-data check", around lines 12408–12512) looks for `route-stop` points on the `jesus` and `paul-rome` routes. If it finds none, it throws "could not find route-stop entries to verify details panel coverage". With `stops.json` empty, there are none. `npm test` doesn't run it, but `npm run verify:web:playwright` (ADR-0036) will fail there until the Frontend Engineer moves the check to the fixture stops or to `location` stops (M5-05's code). I didn't run the browser suite.
- **N2. The map's shading at two Gadarenes pins.** The ancient layer draws Kursi (and Hippos) inside `philip-tetrarchy-lands`, under M4's rule 4, and Jerash inside the Nabataean `arabia` area. After F66 and F67, the panel's Syria history will differ from the shading under those two pins. This isn't a record fix. It's a GIS question, if Decapolis land should one day be drawn with Syria.
- **N3. The duplicate rule** (card item 3) is no longer enforced by the validator (§C5).
- **For the research note (docs only):**
  - "Now all this has happened, that it might be fulfilled …" isn't the WEB's Matthew 21:4, which reads "All this was done that it might be fulfilled which was spoken through the prophet, saying,".
  - ISBE "Ephraim (2)" doesn't identify John's town "only with the three specific verses above". It puts 2 Samuel 13:23's Ephraim elsewhere (F73).
  - "Kursi … lies in Gaulanitis" has no source (F66).
  - Samothrace's border reasoning has no source (F47).
  - Josephus doesn't say the city "could not afford" the stoa (F54).
  - "AD 70, the start of his reign" is wrong (F56).

### C8. Re-check of the fix round (`0954a47`, 2026-10-16)

I re-checked `git diff 4d3cb2f..0954a47`: the Research Lead's commits `897d3fc`, `563e63e`, `42a4174`, `204f449`, `07ba672`, `50366d6` and `0954a47`. The checks were:
- F46–F74 on the 14 draft records;
- your rulings: Q1, Bethphage's parent is `judea`; Q2, islands larger than Malta take region tier, by a sourced area figure; Q3, Samothrace follows the sources and the map; ruling 2, the Gadarenes' parent is `syria`;
- the three items the Research Lead flagged;
- the five new bibliography entries.

I re-read the sources where the text changed:
- ISBE "Acco", "Maccabaeus; Maccabees", "Talmud", "Gadara", "Gerasa", "Ephron (2)" and "Ephraim (2)";
- Smith's *Geography*, "Samothrace";
- the Louvre's entry for the Victory (Ma 2369) and its Terms of Use;
- Wikidata's areas (P2046) for Chios, Samos, Kos, Samothrace and both Malta items (Q233, Q193896).

**Result: 9 more records pass and are now `verified`:** `samothrace`, `amphipolis`, `apollonia-macedonia`, `mitylene`, `trogyllium`, `rhodes`, `patara`, `ptolemais` and `ephraim`. With `attalia`, `assos` and `cos` (§B2), **12 of the 17 are verified.**

Five records still need changes: `seleucia`, `chios`, `samos`, `country-of-the-gadarenes` and `bethphage`. Cos also needs its tier changed. That's 8 fixes, F75–F82:
- F75 needs your ruling (Q4);
- F76–F81 are one-line wording fixes;
- F82 is a tier.

So batches B and C aren't signed off yet.

#### F46–F74

| Fix | Result |
|---|---|
| F46 (`seleucia`) | **Closed.** Strabo 16.2.4 is cited and quoted exactly ("used to be called sisters, because of their concord with one another"), and Acts 14:25 is cited. The new sentence calls Strabo "The Roman writer" (F80). |
| F47 (`samothrace`) | **Closed** under your Q3 ruling: `parentId: "roman-empire"`, no political area, and one entry, "Free state under Roman rule" (4 BC–AD 101). It cites Smith's "In Pliny's time Samothrace was a free state", with the dating caveat in its note. It agrees with the map's `other-roman-lands`. |
| F48 (`samothrace`) | **Closed.**<ul><li>"the seat of the god Poseidon" (ISBE).</li><li>The Louvre's dating comes first: "the early second century BC, possibly created at Rhodes", found at the Cabirion in 1863. The entry has "-200 / -175", "Rhodes (?)" and "1863 (Cabirion)".</li><li>ISBE's 300 BC view comes last, as "an older, since-revised view".</li></ul> |
| F49 (`samothrace`) | **Closed.** The anchorage is now ISBE's; "King Philip of Macedon". |
| F50 (`amphipolis`) | **Closed.** `bib:isbe-macedonia` is cited for "the Hellespont". |
| F51 (`apollonia-macedonia`) | **Closed.** "may perhaps be attributed to about 432 BC"; "a day's journey from Amphipolis". |
| F52 (`mitylene`) | **Closed.** Acts 20:15 is cited. |
| F53 (`chios`) | **Closed.** "its blue marble, its fine potter's clay and its skilled storytellers" (ISBE: "beautiful blue marble", "excellent potter's clay", "skill in telling stories"). |
| F54 (`chios`) | The anchorage is **closed**: it's now ISBE's reading, "because of the dark moon". The Josephus clause needs F79. |
| F55 (`samos`) | **Closed.**<ul><li>Dio's 20 BC, with "gave the islanders their freedom" (54.9.7), is cited.</li><li>ISBE's 17 BC is in the entry's note.</li><li>The table runs −84 to −20, then −20 to 70.</li></ul>The 17 BC aside in `history[1]` sits mid-entry (F81). |
| F56 (`samos`) | **Closed.** 70–79 is `uncertain-roman-side` with the timeline's Achaia note word for word. 79–101 is the province of Asia, citing ISBE "Asia" ("apparently"). |
| F57 (`trogyllium`) | **Closed.** "Acts, in the text the WEB follows, records …; the International Standard Bible Encyclopedia notes that several early manuscripts omit this detail". The support's pointer is gone; the coordinates are unchanged. |
| F58 (`rhodes`) | **Closed.** "three chief cities"; "received Caria; by 168 BC, however, only a small portion of this territory remained under Rhodian sway", matching ISBE. |
| F59 (`rhodes`) | **Closed.** "liberty restored under the emperor Claudius, at the plea of the young Nero". The history and the note follow *Annals* 12.58 (AD 53, Nero "at the age of sixteen"). |
| F60 (`rhodes`) | **Closed.** "Vespasian's first full year as emperor, AD 70", and one uncertain span to 101 (below). |
| F61 (`rhodes`) | **Closed.**<ul><li>Dio 60.24.4 is cited for 4 BC–AD 44.</li><li>"some Romans"; "also dates".</li><li>`bib:isbe-cos` is cited for the third journey.</li></ul> |
| F62 (`patara`) | **Closed.** `bib:isbe-cos` is cited. |
| F63 (`ptolemais`) | **Closed.**<ul><li>The note now reads "the town the encyclopedia identifies with Ptolemais" and cites Judges 1:32 ("the Asherites lived among the Canaanites").</li><li>`history[0]` gives the renaming from ISBE "Acco" ("changed the name to PTOLEMAIS").</li></ul> |
| F64 (`ptolemais`) | **Closed.** "the Maccabees, a Jewish family who defended Jewish rights and customs in the second century BC". ISBE "Maccabaeus; Maccabees" has "a celebrated family who defended Jewish rights and customs in the 2nd century BC". Samos gets the same introduction and now says "the book of 1 Maccabees" (my suggestion). |
| F65 (`country-of-the-gadarenes`) | **Closed.** `parentId: "syria"` (ruling 2). |
| F66 (`country-of-the-gadarenes`) | **Closed.**<ul><li>Kursi's table follows ISBE "Gadara": free city 63–30 BC, Herod 30–4 BC, Syria from 4 BC.</li><li>Each note says the attribution runs through Gadara's jurisdiction, "the country East of the Sea".</li><li>The last note says the map draws this shore with Philip's former lands as a simplification.</li></ul> |
| F67 (`country-of-the-gadarenes`) | The year is **closed** (−63). The note's reason misstates ISBE "Gadara" (F78). |
| F68 (`country-of-the-gadarenes`) | **Closed.**<ul><li>ISBE's readings: "country of the Gadarenes" at Matthew 8:28, "country of the Gerasenes" at Mark 5:1 and Luke 8:26, 37.</li><li>"no good reason to doubt the accuracy of either reading"; the two names explained.</li><li>Only the Textus Receptus "of the Gergesenes" is rejected.</li><li>The WEB verses are cited, and Westcott and Hort are introduced as ISBE "Gerasa" does.</li></ul> |
| F69 (`country-of-the-gadarenes`) | **Mostly closed.**<ul><li>ISBE "Gadara" and "Gerasa" are cited.</li><li>Mark 5:2–3 and 5:11, and Luke 8:27, 8:30 and 8:32–33 are cited.</li><li>"My name is Legion, for we are many" is Mark's, with Luke's "Legion".</li><li>Pompey is introduced.</li></ul>"Nearby" stays (F77). |
| F70 (`bethphage`) | **Closed.** Matthew's "a donkey tied, and a colt with her"; Mark and Luke "a single young animal" (11:2 "a young donkey"; 19:30 "a colt"). Both verses are cited. |
| F71 (`bethphage`) | **Closed.**<ul><li>"near the road"; "for the final time" is gone.</li><li>Matthew 21:5 is quoted exactly.</li><li>"the Talmud, the collected body of early rabbinic teaching on Jewish law". ISBE "Talmud" has "now it means the Mishna with the discussions thereupon" and "the source whence the Jewish Law is to be derived".</li></ul>The new "ahead into the village" needs F76. |
| F72 (`bethphage`) | Overtaken by your Q1 ruling; see item 1 below and F75. |
| F73 (`ephraim`) | **Closed.**<ul><li>2 Samuel 13:23 is dropped.</li><li>Both notes now give ISBE "Ephron (2)"'s identity of Ophrah and Ephron ("thought by many") and their placing at et-Taiyibeh, with ISBE "Ephraim (2)"'s "probably" for John's town.</li><li>Joshua 18:21 is cited.</li></ul> |
| F74 (`ephraim`) | **Closed.** "probably the village of et-Taiyibeh, which stands on a high hill …"; the Onomasticon is introduced as "a list of biblical place names". |

#### The three items the Research Lead flagged

1. **Bethphage's country doesn't fit ADR-0028.** With the parent now `judea`, the record says "Et-Tur (Kafr et-Tur)", with `modernCountries: ["West Bank"]`.
   - **Et-Tur lies inside Jerusalem.** Wikidata Q2193088, the leading candidate's `coordinateSource`, has P131 Jerusalem (Q1218). The Mount of Olives, 0.49 km away, and Gethsemane carry no country.
   - **ADR-0028's rule, approved by the human at CP3.5:** "Jerusalem and the places inside it … take no country: their modern name already says 'Jerusalem', which every reader can place, and its status is the most disputed of all."
   - **Bethany isn't a precedent here.** ADR-0028 names Al-Eizariya itself as a West Bank example, because it lies outside Jerusalem; Bethphage's leading candidate doesn't. "West Bank" for an East Jerusalem neighbourhood takes the position the rule avoids.
   - **The cause** is the validator: it exempts only "records whose parent chain includes jerusalem", so your Q1 ruling forces a country. Your choice, Q4 (F75).
2. **Rhodes from AD 70 to 101 fits the sources.**
   - Suetonius gives no year and names no province.
   - ISBE "Rhodes" places Rhodes in Asia only from AD 44, before the restoration of 53, and ISBE "Asia" doesn't name Rhodes.
   - Samos ends its uncertain span in 79 only because ISBE "Asia" names it. Rhodes has no such source, so one uncertain span is the honest reading. The text says so last.
3. **The Louvre entry fits, and is more open than custodia.org.**
   - **The text is openly licensed.** The Louvre's Terms of Use (https://collections.louvre.fr/en/page/cgu, article 4.1.2) put "the textual content of the entries" under the Etalab Open Licence, reusable "for commercial or other purposes". The Louvre calls that licence compatible with CC BY, so it is compatible with our CC BY-SA 4.0 data.
   - **Credit:** it's due to "the Musée du Louvre" with "the date of the most recent update" (this entry: "Last updated on 08.04.2026"). The terms say a hypertext link satisfies this, and the `bib:` entry gives the author and the link. The record uses the entry's facts in its own words.
   - **Photographs** are restricted (article 4.1.1), and none are used.
   - The Research Lead's "short quotation" reading is article 4.2, which covers screen captures of the site, not the entries.
   - I added rows to `docs/LICENSES.md` and `ATTRIBUTION.md`, and restored the entry's missing accents as typos ("Musée du Louvre", "Département des Antiquités grecques, étrusques et romaines").

#### Island tiers (Q2)

| Island | Area (Wikidata P2046) | Larger than Malta? | Tier | Result |
|---|---|---|---|---|
| Chios | 842.5 km² (Q160483) | Yes | region | **Pass** |
| Samos | 476 km² (Q156882) | Yes | region | **Pass** |
| Cos | 290.3 km² (Q187027) | Yes, than the island (246 km²); no, than the country (316 km²) | city | **F82** |
| Samothrace | 178 km² (Q203175; its 184 km² claim is deprecated) | No | city | **Pass** |

- **Which Malta figure:** the research note measures Malta by Q233, 316 km². My own Q2 gave the same figure, which was my error. Q233 is "country in Southern Europe situated on an archipelago": Malta with Gozo and Comino.
- **The record is the island.** `malta.json`'s candidate is "Malta (island)", and its summary says "the Mediterranean island south of Sicily".
- **The island's own figure:** Q193896, "island of Malta", gives 246 km² (P2046, with a reference).
- Compared island to island, Cos is larger, so it takes region tier like Chios and Samos.

#### New bibliography entries
All five are complete, in the house format, and their URLs answer:
- **`smith-dictionary-samothrace`:** like `smith-dictionary-cyrenaica`;
- **`isbe-acco`:** byline H. Porter;
- **`isbe-maccabees`:** "Maccabaeus; Maccabees", J. Hutchison;
- **`isbe-talmud`:** Hermann L. Strack;
- **`louvre-winged-victory`:** like `custodia-bethphage`.

The four 1854 and 1915 texts are public domain, already covered in `docs/LICENSES.md` and `ATTRIBUTION.md`. The Louvre is covered above.

#### F75–F82: what's still needed
`data/locations/bethphage.json`
- **F75 (content; needs your ruling, Q4), `names.modernCountries`:** "West Bank" conflicts with ADR-0028's Jerusalem rule (item 1 above).
  - **(a) Recommended:** the GIS Engineer lets a record omit `modernCountries` when its modern site is inside Jerusalem, whatever its ancient parent (for example, with a flag). The Research Lead then restores "Et-Tur (Kafr et-Tur), Jerusalem", the verified stop's form.
  - **(b)** Keep "West Bank" as an exception to a rule the human approved, which needs the human.
- **F76 (wording), `summary`:** "sent two disciples ahead into the village". The Gospels have "the village that is opposite you" (Matthew 21:2; Mark 11:2) and "the village on the other side" (Luke 19:30). Straight after "they came to Bethphage", "the village" reads as Bethphage itself, which none of the three says. Say "into the village opposite them".

`data/locations/country-of-the-gadarenes.json`
- **F77 (wording), `summary`:** "a great herd of pigs feeding on the hillside nearby". Matthew 8:30 has "far away from them", so "nearby" takes Mark's and Luke's side. Drop "nearby" (the open part of F69).
- **F78 (wording), `politicalHistory` (candidate 2), `note`:** "the year the encyclopedia's 'Gadara' article dates the Roman general Pompey's settlement of the free cities of this district". ISBE "Gadara" dates only Gadara's own restoration: "Pompey is said to have restored it, 63 BC … He gave it a free constitution". Say so, for example: "the year the encyclopedia's 'Gadara' article gives for Pompey's restoration of Gadara, so that the three candidates start together".

`data/locations/chios.json`
- **F79 (wording), `history[0]`:** "and, in his own words, 'was it not so easy to rebuild that as it was the rest.'"
  - The words are Whiston's 1737 translation, not Josephus's own.
  - Cut from "so was it not so easy to rebuild that as it was the rest", the clause reads as a question.
  - Paraphrase it, for example: "…destroyed in the Mithridatic War, which Josephus says was not as easy to rebuild as the rest".

`data/locations/seleucia.json`
- **F80 (wording), `history[0]`:** "The Roman writer Strabo". Strabo was Greek. Eleven other mentions in the dataset say "the Greek geographer Strabo", and none calls him Roman. Use that.

`data/locations/samos.json`
- **F81 (wording), `history[1]`:** "the encyclopedia separately dates this grant of free-city status (civitas libera) to 17 BC" comes before the Suetonius sentence. Move it to the end of the entry, as F45 did for Lycia (ADR-0041 item 1).

`data/locations/cos.json`
- **F82 (tier), `zoomTier`:** set it to `"region"`, by your Q2 rule and the island of Malta's 246 km² (Q193896). Also correct the research note's Malta figure.
  - `cos` stays `verified`: its content is unchanged and only its tier moves. I'll check the tier with F75–F81.
  - If you meant the country's 316 km², Cos keeps city tier and F82 is void.

#### Status and checks
- **Status:** the nine records above are `verified`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-10-16"`. `seleucia`, `chios`, `samos`, `country-of-the-gadarenes` and `bethphage` stay `draft`.
- **Checks** (Node 24.21.0, on `0954a47` and again after the status changes):
  - `npm run validate:data`: passed, 0 errors, 207 warnings. The Gadarenes' 4, accepted in §C5, are the only ones in these 17 records.
  - `npm run check:route-lines`: "Reproduced route lines byte-for-byte from an empty cache"; 71 lines, 0 failing.
  - `npm test`: 331 tests, all pass.
- **Unchanged:** no candidate's label, coordinates, source or confidence changed. Nothing in `data/routes/`, `scripts/`, `tests/` or `app/` changed in the fix round.

#### Question for the PO
- **Q4 (F75), Bethphage's country.**
  - (a) A validator exemption for modern sites inside Jerusalem, with "Et-Tur (Kafr et-Tur), Jerusalem" and no country, as ADR-0028 intends.
  - (b) "West Bank" as an exception, which needs the human.

  I recommend (a). It's the GIS Engineer's change, then the Research Lead's.
