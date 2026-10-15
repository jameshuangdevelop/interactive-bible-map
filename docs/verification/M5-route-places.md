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
| Records (15) | 4: `salmone`, `fair-havens`, `phoenix`, `syracuse` | 11, with 31 fixes (F1–F31): 16 on content, 15 on citations or wording | Q1, Q2 |
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
