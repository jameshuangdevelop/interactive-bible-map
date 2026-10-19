# M5-11 verification — The ancient lands left undrawn (phase 2)

- **Card:** `docs/tasks/M5-11-ancient-lands.md` · **Branch:** `data/m5-ancient-lands` (head `e5e63cc` when I started)
- **Checked:** the Research Lead's note `docs/research/M5-ancient-lands.md` (`c7b706c`) and the PO's answers to its §6 (`e5e63cc`, `docs/PROGRESS.md` → "Open questions"), against ADR-0044 item 8, ADR-0037 (items 1–3, the border rules 1–5 with correction P1, the MC7 updates), ADR-0014, ADR-0017 and ADR-0026, and the committed `data/timeline.json`, `data/geo/ancient-areas.geojson` and `scripts/lib/ancient-partition.mjs`.
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-18 · **Phase:** 2 (ADR-0014). This phase changes no data files, so no record is set to `verified`. The PO's ruling 6 adds a phase 4, in which I check what the GIS Engineer draws.

**Result: verified, with fixes; one anchor rejected.** The rulings can be built from sources, but not exactly as the note describes:
- **Pontus.** Strabo's boundary can't run through Dasmenda. Both places the Barrington Atlas gives for Dasmenda lie inside Cappadocia proper. The line is buildable the way M4's Galatia–Cappadocia line was built: equidistant between places that Strabo puts on each side.
- **Mauretania.** The Mulucha line holds up, and AWMC's own AD 69 layer, which the build already reads, draws both of the provinces' borders. But Saldae and the Ampsaga are two different frontiers, about 90 km apart.

| Section | Verified | Fix needed | Rejected |
|---|---:|---:|---:|
| 1. Quotations and citations (27) | 22 | 5 | 0 |
| 2. Anchors and coordinates (9) | 3 | 5 | 1 |
| 3. Holders at each stop (8) | 6 | 2 | 0 |
| 4. Mauretania: dates and lines (9) | 7 | 2 | 0 |
| 5. Adjacency (5) | 4 | 1 | 0 |
| 6. Smith's "Melitene in Armenia Minor" (1) | 1 | 0 | 0 |
| 7. Pleiades IDs in `ancient-partition.mjs` (3) | 2 | 1 | 0 |
| 8. Undrawn lands, Chalcis, Sophene (3) | 1 | 2 | 0 |
| Licensing (10) | 10 | 0 | 0 |
| **Total (75)** | **56** | **18** | **1** |

"Fix needed" means a clause is wrong, unsourced or overstated, or an instruction needs changing, and the source gives the fix. "Rejected" means the sources contradict the claim, and no rewording can save it.

**The main findings:**
1. **Dasmenda can't anchor Strabo's line (rejected).** Strabo 12.2.10 starts the Pontus–Cappadocia boundary "at the western extremities of Chammanenê, where is situated Dasmenda". The Barrington Atlas has two entries for Dasmenda:
   - `pleiades:619147` lies 95 km south-west of Mazaca and 144 km from Barrington's own label for Chammanene (`pleiades:619137`).
   - `pleiades:628964` ("Dasmenda?") lies 197 km from that label.

   Strabo puts Mazaca "about eight hundred stadia" (about 150 km) south of Pontus (12.2.9). He also calls Chammanene and Laviansene Cappadocian (12.2.10). A line "parallel to the Taurus" through 619147 would put Mazaca and both prefectures in Pontus. 628964 lies nowhere near Chammanene's western end, and a line through it would put Laviansene in Pontus. Laviansene, which the note says is unpinned, is `pleiades:629025`. The line is therefore built from anchors on both sides (G1).
2. **The holders are right, and the area is never "unclear".** At every stop the area follows Polemon's kingdom, as ruling 1 says: a client kingdom from 36 BC to AD 64, then the province of Galatia. ISBE dates "Polemon and his house" to "36 BC to 63 AD", so the kingdom's own status is never in doubt. Two of the note's rows need rewording (§3).
3. **The east edge has a source.** Strabo 12.3.28 says "the Euphrates ... separates Acilisenê from Lesser Armenia". The empire's edge in AWMC's AD 69 extent follows the Karasu (the western Euphrates) along that stretch.
4. **The Mulucha line holds up, so there are two provinces (ruling 4).**
   - Smith's *Dictionary* states it: "In A.D. 42, Claudius divided the kingdom into two provinces, separated from each other by the river Mulucha."
   - Strabo (17.3.6), Pliny's coastal order and the Barrington Atlas Directory (`pleiades:289941`: "Moulouya valley") agree.
   - AWMC's AD 69 province line 610 follows the lower Moulouya to within 0.1–6.2 km.
   - AWMC's line 609 meets the coast 2.1 km from Pleiades' "Tucca?", the town Pliny puts on the Ampsaga. That makes it Caesariensis's border with Numidia.
5. **Mauretania before 42.** Under Juba, Strabo puts the frontier at Saldae (17.3.12), 92 km west of the Ampsaga. AWMC's AD 14 extent puts it 109 km farther west again. Drawing the kingdom with the provinces' outline would contradict Strabo. I recommend a strip between the two lines that shows as "unclear" until AD 42 (G1, Mauretania; item for the PO).
6. **The years 40–42 are unclear in the sources.** Ptolemy was killed in AD 40 (Dio 59.24.2–59.25.1). Dio says the war ended before Claudius's accession, while Pliny says Roman arms fought it under Claudius. The provinces came only after the campaigns of AD 42 (Dio 60.9.1–5). So the 41 stop shows Mauretania as unclear.
7. **Ten of the 19 Pleiades IDs in `ancient-partition.mjs` name other places, not two.** Two of the coordinates are also 30 km and 49 km off. They don't change the committed geometry, which uses only the coordinates, but phase 3 should fix them (G7).
8. **The note's adjacency finding holds.** Syria, Cappadocia and Commagene touch along 107 km (Commagene/Syria), 225 km (Commagene/Cappadocia) and 6 km (Cappadocia/Syria). An all-pairs re-run found 38 touching pairs and no new gap.

## Scope
- The note's claims that the PO's five rulings rely on: Pontus, Pontus Galaticus and Armenia Minor (ruling 1), Chalcis (ruling 3, a one-line opinion), Mauretania (ruling 4) and the popover's note (ruling 5).
- The Pleiades IDs in `scripts/lib/ancient-partition.mjs`.
- Not in scope:
  - Sophene (ruling 2, held), apart from one error noted in §8.
  - Osroene, the Bosporan kingdom, Abilene and Emesa, which stay undrawn and which I didn't re-open.
  - The AWMC regional label curves in the note's §7, which no ruling relies on.

## Method
1. **Texts, opened 2026-10-18:**
   - Strabo, *Geography* (Loeb, tr. Jones, on LacusCurtius): 11.14, 12.1, 12.2, 12.3, 12.5, 16.2 and 17.3, with the Loeb notes.
   - Cassius Dio 54, 59 and 60 (Loeb, tr. Cary, on LacusCurtius).
   - Tacitus, *Annals* 4.23–26 and 13.7 (Loeb, tr. Jackson, on LacusCurtius), with the Loeb notes.
   - Josephus, *Antiquities* 20 (Whiston, on CCEL).
   - Pliny, *Natural History* 5.1 (tr. Bostock and Riley, 1855, on Perseus), with the translators' notes.
   - ISBE "Pontus", "Galatia", "Armenia" and "Cappadocia".
   - World History Encyclopedia, "Vespasian".
   - Smith's *Dictionary of Greek and Roman Geography* (on Perseus): "Mauretania", "Mulucha", "Ampsaga", "Saldae", "Sophene", "Dasmenda" and "Armenia". Perseus returned 503 for "Laviansene", "Chamanene" and "Molochath".
2. **Gazetteers:**
   - Pleiades' places dump (`atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz`, downloaded 2026-10-18).
   - Pleiades' live JSON for 619147 and 289941, which answered without a challenge today.
   - Wikidata's SPARQL service: every item with a Pleiades ID (P1584) among my 43 anchors, with their P625 coordinates.
3. **Datasets:**
   - AWMC's `Cultural Shapefiles Apr 2024.zip` from the pinned commit `7ecf8bc`. Its SHA-256, `ae209bd5…a7681bc8`, matches `ancient-geo-inputs.mjs`. I read `roman_empire_ad_69_provinces` (its lines are identical to the AD 14 province file's), the AD 69 and AD 14 extents, and `ba_100_provinces`.
   - Natural Earth 10 m rivers from the pinned commit `ca96624`, used only to compare with the Halys, the Moulouya and the Euphrates.
4. **Scripts:**
   - Small Node scripts with `@turf/boolean-point-in-polygon`, `boolean-disjoint` and `bbox`, and one clipped `mapshaper -polygons` run over North Africa.
   - A nearest-anchor raster (0.02°) to try out the Pontus line.

   As the PO asked, I ran no build, browser or test suite.

## Licensing
**Pass.** Every source is compatible with the code licence (MIT), the data licence (CC BY-SA 4.0) and `data/geo/` (ODbL 1.0). This commit updates `docs/LICENSES.md` and `ATTRIBUTION.md`.

| # | Source | Read at the source, 2026-10-18 | Verdict |
|---|---|---|---|
| L1 | Strabo, Loeb tr. Jones, LacusCurtius | Each page: "The text is in the public domain" (vol. V 1928, books 11–12; vol. VII 1932, book 16; vol. VIII 1932, book 17). The index explains: earlier volumes lapsed, later ones "expired and were not renewed". | Verified: PD, quotable |
| L2 | Pliny, *Natural History*, tr. Bostock and Riley, Perseus `1999.02.0137` | Perseus credits "London. Taylor and Francis, Red Lion Court, Fleet Street. 1855." and states no licence. The 1855 text and notes were published before 1929, so they are public domain in the US. The Perseus item on the do-not-use list covers Perseus's own editions, not the public-domain works it hosts, as already ruled for Smith (1854). | Verified: PD, quotable (new; added to `LICENSES.md`) |
| L3 | Smith, *Dictionary of Greek and Roman Geography* (1854), Perseus | 1854 imprint; existing ruling | Verified: PD |
| L4 | Tacitus, *Annals*, Loeb tr. Jackson, LacusCurtius | *Annals* 4 and 13 pages: "Loeb Classical Library edition of Tacitus, 1937. The text is in the public domain." | Verified: PD (the 1937 volume noted in `LICENSES.md`) |
| L5 | Cassius Dio, Loeb tr. Cary, LacusCurtius | Books 54, 59 and 60: "The text is in the public domain." | Verified: PD |
| L6 | Josephus (Whiston, 1737, CCEL); ISBE (1915) | Existing ruling | Verified: PD |
| L7 | World History Encyclopedia | CC BY-NC-SA 4.0 (existing ruling) | Verified: cite-only, never quoted |
| L8 | Pleiades | CC BY 3.0 (existing ruling); the bulk dump and JSON give the same IDs | Verified |
| L9 | Wikidata | CC0 | Verified |
| L10 | AWMC Geodata | ODbL 1.0; the pinned zip's hash matches | Verified: no new upstream dataset |

## 1. Quotations and citations

| # | The note's claim | What the source says | Verdict |
|---|---|---|---|
| Q1 | Strabo 12.2.10, the Pontus–Cappadocia boundary | Word for word, including "Both Chammanenê and Laviansenê are prefectures in Cappadocia." | Verified |
| Q2 | Strabo 12.1.4, the ten prefectures | "Laviansenê, Sargarausenê, Saravenê, Chamanenê, and Morimenê as the remaining five" | Verified |
| Q3 | 12.3.37: Culupene and Camisene, "two Pontic districts under Queen Pythodoris", border Lesser Armenia and Laviansene | The border clause is right: "the latter two border on both Lesser Armenia and Laviansenê". But Strabo says the Roman prefects split them among the priests of Comana and Zela and Ateporix, and Ateporix's part "is subject to the Romans, being called a province". Only "the rest is held by Pythodoris and Dyteutus". | **Fix needed:** "held in Strabo's day by Pythodoris and Dyteutus, apart from a small part that had become a province" |
| Q4 | 12.3.29: Pythodoris "married Archelaüs and remained with him to the end" | As quoted; also "Lesser Armenia ... finally by Archelaüs" | Verified |
| Q5 | 12.3.9: the Halys bounds Paphlagonia | "On the east, then, the Paphlagonians are bounded by the Halys River" | Verified |
| Q6 | 12.3.1: Mithridates held "the sea-coast extending to Colchis and Lesser Armenia" | As quoted | Verified |
| Q7 | 12.2.1: Melitene "opposite to Sophenê"; Tomisa | As quoted | Verified |
| Q8 | 17.3.6: the Molochath bounds the Maurusians and the Masaesylians | As quoted | Verified |
| Q9 | 17.3.12: Salda, "a boundary between the territories subject to Juba and the Romans" | As quoted | Verified (its use: M7) |
| Q10 | 17.3.9: the Gaetulians in the interior | As quoted, in Strabo's section 9 | Verified |
| Q11 | 16.2.18 and 16.2.10: Chalcis "the acropolis, as it were, of the Massyas" | As quoted. 16.2.10 is about Ptolemy son of Mennaeus, before our window. | Verified |
| Q12 | Pliny 5.1: "the two Mauritanias ... divided into two provinces" | As quoted ("Caius Cæsar"; "[Caligula]" is the note's insertion) | Verified |
| Q13 | Pliny 5.1: Suetonius Paulinus "beyond Mount Atlas" | As quoted | Verified |
| Q14 | "The translator's own notes ... date Ptolemy's death to AD 40 ... and Paulinus's campaign to AD 42" | Note 47: Ptolemy was "summoned to Rome in the year A.D. 40 ... and shortly after put to death". Note 52 gives AD 42. But note 3 says Caligula "in the year 41 A.D. reduced the two Mauritanias". The dates are Bostock and Riley's, not Pliny's. | **Fix needed:** cite Dio 59.24.2–25.1 for AD 40; mention note 3's "41" or drop the translators' dates |
| Q15 | "Pliny confirms both rivers ... in a translator's footnote that quotes his description" | Notes 57 and 61 are the translators' own words; they don't quote Pliny. Pliny's text lists "Malvane, a navigable stream" in Tingitana and Siga in "the second Mauritania". He puts a "Mulucha" east of Portus Magnus, which note 78 equates with the Malva, and "Tucca ... upon the river Ampsaga" last in Caesariensis. | **Fix needed:** attribute the notes to the translators; cite Pliny's order and Tucca |
| Q16 | "I confirmed the AD 42 date and its source precisely: it is Pliny the Elder's own *Natural History*" | Pliny gives no year. AD 42 is Dio's: 60.9.1, "The next year [after 41] the same Moors again made war", then 60.9.5. Smith also gives "In A.D. 42". | **Fix needed:** cite Dio 60.9 and Smith |
| Q17 | Tacitus, *Annals* 13.7: Lesser Armenia to Aristobulus, Sophene to Sohaemus; the note on Sophene | As quoted; Loeb note 18: "A strip of territory along the south-western frontier of Armenia." | Verified |
| Q18 | Dio 54.9.2 (20 BC): Lesser Armenia to Archelaus | "These latter together with Lesser Armenia he granted to Archelaus" | Verified |
| Q19 | Dio 59.12.2 (AD 38) | "to Cotys Lesser Armenia ... and to Polemon, the son of Polemon, his ancestral domain" | Verified |
| Q20 | Dio 59.25 (AD 40), Ptolemy | 59.24.2 is Gaius's third consulship (AD 40); 59.25.1: "Gaius sent for Ptolemy ... put him to death". Dio's heading: "How the Mauretanian began to be governed by Romans." | Verified |
| Q21 | Josephus, *Antiquities* 20.8.4: Aristobulus | "in the first year of the reign of Nero ... Aristobulus, the son of Herod, king of Chalcis, was intrusted by Nero with the government of the Lesser Armenia" | Verified |
| Q22 | ISBE "Pontus" | "under Polemon and his house, 36 BC to 63 AD". Also: "Pontus proper extended from the Halys River on the West ... its interior boundaries meeting those of Galatia, Cappadocia and Armenia". | Verified |
| Q23 | ISBE "Galatia" | "Paphlagonia 6 BC, part of Pontus 2 BC (called Pontus Galaticus ...), and in 64 also Pontus Polemoniacus" | Verified |
| Q24 | World History Encyclopedia, "Vespasian" | Timeline: "72 CE Roman emperor Vespasian annexes the kingdoms of Commagene and Lesser Armenia." | Verified (cite-only) |
| Q25 | Smith "Sophene": "Melitene in Armenia Minor" | As quoted (see §6) | Verified |
| Q26 | Smith "Mauretania" (the note uses it as a cross-check only) | "In A.D. 42, Claudius divided the kingdom into two provinces, separated from each other by the river Mulucha"; "separated on the E. from Numidia, by the river Ampsaga"; Juba II from 25 BC. Its "in A.D. 41 he was put to death" contradicts Dio, whom Smith cites. | Verified, and promoted to a main citation (G5) |
| Q27 | Pontus Galaticus was "administered with Bithynia since Pompey, then transferred to Galatia in 2 BC, per ... ISBE 'Galatia'" | ISBE "Galatia" gives only "part of Pontus 2 BC". Strabo says those districts went to priests and a dynast (12.3.37) and that Amaseia "was also given to kings, though it is now a province" (12.3.39). | **Fix needed:** "held by local rulers and priests until it joined Galatia in 2 BC" |

## 2. Anchors and coordinates
Each figure is Pleiades' representative point. Distances are great-circle.

| # | Claim | Finding | Verdict |
|---|---|---|---|
| A1 | Dasmenda, `pleiades:619147` (34.726°E 38.103°N), "identified with high confidence ... the Barrington Atlas's own primary identification", as the line's western end (alternative: `628964`) | The point and the Barrington citation (63 F4) are right. Its locations are DARMC/TIB points for the Byzantine fort Dasmendron. Wikidata Q85755773 copies Pleiades, and Smith's "Dasmenda" gives only "a hill-fort in Cappadocia". So no second source confirms it. The point lies 95 km south-west of Mazaca and 144 km south-east of Barrington's label for Chammanene. `628964` ("Dasmenda?", 64 C3) is 147 km away and 197 km from that label. Strabo says the line starts at Chammanene's *western* end, that both end districts are Cappadocian (12.2.10), and that Mazaca lies about 800 stadia south of Pontus (12.2.9; Loeb note 17: "the country, not the sea"). Through 619147, a line "parallel to the Taurus" puts Mazaca and both prefectures in Pontus; 628964 is nowhere near Chammanene's western end, and a line through it puts Laviansene in Pontus. | **Rejected** as an anchor. Use the two-sided anchors in G1. |
| A2 | "Laviansene's own point is not independently pinned" | It is: `pleiades:629025` "Laouiansene" (BAtlas 64 D2), 37.240°E 39.360°N, a label point. Chammanene is `pleiades:619137` (BAtlas 63 D2), 34.058°E 39.284°N; Wikidata Q28456648 has no coordinates. | **Fix needed** |
| A3 | Sargarausene, `pleiades:629068` (36.621°E 38.688°N), "giving the line's general easterly bearing" | The point is right, but it lies 0.7° south of Laviansene, inside Cappadocia. It can't give the line's bearing; it is a Cappadocian-side anchor. | **Fix needed** (use) |
| A4 | The Halys, `pleiades:857148` | Identity confirmed: Wikidata Q257785 (Kızılırmak) carries P1584 857148. The existing `galatia`/`cappadocia` edge north of 40.3°N stays within 6.2 km of Natural Earth's Kızılırmak (median 1.8 km). | Verified |
| A5 | Saldae, `pleiades:305142` | 5.058°E 36.741°N; Wikidata Q1557873 is 1.2 km away | Verified |
| A6 | Iol Caesarea, `pleiades:295279`, "Mauretania Caesariensis's own capital, later Juba II's and Ptolemy's residence" | The point is right (Q1309531, 0.1 km), but the order is reversed: Iol was Juba's royal city first (Strabo 17.3.12; Pliny: "the residence of King Juba") and became a colony under Claudius. | **Fix needed** (wording) |
| A7 | Volubilis, `pleiades:275740`, "Mauretania Tingitana's inland capital" | The point is right (Q391215, 3.7 km). No source I opened calls it the capital; Pliny calls it "the town of Volubilis". | **Fix needed** (wording) |
| A8 | The Molochath, `pleiades:289941`, unlocated; "directory note ... the Moulouya valley" | Pleiades JSON: "The Barrington Atlas Directory notes: Moulouya valley" | Verified |
| A9 | Amaseia `857018`; Neocaesarea/Kabeira `857177` and Niksar (Q513980); the code's Neocaesarea point is "about 60 km" off | The IDs and points are right. Amaseia is confirmed by Q170532 (1.3 km) and Kabeira by Niksar (4.6 km). But the code's point `[36.558, 40.326]` is 48.8 km from 857177 and 44.9 km from Niksar, and 7.7 km from Comana Pontica (`857095`). | **Fix needed** (distance) |

## 3. Holders at each stop
These check the note's §4.1 table against the 15 stops, and the §2 table against `data/timeline.json`.

| # | The note's row | Finding | Verdict |
|---|---|---|---|
| H1 | −4: "Queen Pythodoris (regent, then ruling in her own right)" | Strabo 12.3.29: she "reigned along with him for a time, and then, when he died ..., she succeeded". "Regent" isn't in the source, and no source I opened dates Polemon I's death. | **Fix needed:** "Polemon I, then his widow Pythodoris (Strabo gives no year)" |
| H2 | 6–17: Pythodoris; Archelaus holds Lesser Armenia | Strabo 12.3.29; Dio 54.9.2; Archelaus died in AD 17 (Loeb note 81) | Verified |
| H3 | 17–38: "Pythodoris, then (her own son) Polemon II confirmed 38"; Lesser Armenia unclear | "Her own son" is what the cited sources say: Loeb note 79 to 12.3.29 names the son who assists his mother as "Polemon II", and Dio calls him "the son of Polemon". But Dio 59.12.2 says *granted*, not confirmed. Strabo, writing after AD 17, has her "living in widowhood now"; no source names the ruler from then until 38. | **Fix needed** (wording). The data should give "Polemon II" without the relationship. |
| H4 | 38–54: Polemon II; Cotys | Dio 59.12.2 | Verified |
| H5 | 54–63/64: Polemon II; Aristobulus | Josephus, *Antiquities* 20.8.4; Tacitus, *Annals* 13.7 | Verified |
| H6 | 63/64–72: Polemon's kingdom joins Galatia; Aristobulus until about 72 | ISBE "Pontus" (63) and "Galatia" (64); `pontus.json` already uses 64 | Verified |
| H7 | 72–100: part of Galatia; Lesser Armenia annexed, "administered with Cappadocia or Galatia — the sources do not say which" | World History Encyclopedia gives 72; no cited source names the province | Verified |
| H8 | §2: Syria, Cappadocia and Commagene's holders at each stop | Matches `timeline.json`; the sources were verified in M4-02 | Verified |

## 4. Mauretania: dates and lines

| # | Claim | Finding | Verdict |
|---|---|---|---|
| M1 | Ptolemy killed in about AD 40 | Dio 59.24.2–25.1 (AD 40). The Loeb note to Tacitus, *Annals* 4.23 says he "succeeded his father a year previously [AD 23], and reigned till 40 A.D." Smith's "A.D. 41" and Bostock and Riley's note 3 ("41") are wrong. | Verified |
| M2 | A revolt under the freedman Aedemon followed | Pliny 5.1: Roman arms fought in Mauretania "under the Emperor Claudius, when the freedman Ædemon took up arms to avenge the death of King Ptolemy". But Dio 60.8.6 says Claudius "had not yet come to the throne when the war was finished". | Verified; the sources disagree on the timing |
| M3 | Paulinus in AD 42, then two provinces | Dio 60.9.1–5: "The next year the same Moors again made war ... Suetonius Paulinus ... as far as Mount Atlas ... Claudius divided the subject Moors into two districts ... around Tingis and ... around Caesarea ... two knights as governors" | Verified (source per Q16) |
| M4 | Before 40, a client kingdom: Juba II, then Ptolemy | Smith: Juba from 25 BC. Strabo 17.3.7: "Juba died lately, but his son Ptolemy ... has succeeded". Tacitus, *Annals* 4.24 and 4.26 call Ptolemy king in AD 24. | Verified |
| M5 | The Mulucha/Molochath line between Tingitana and Caesariensis | It holds up. Smith ("Mauretania", "Mulucha") states it and identifies Mulucha, Molochath and Malva as one river. Strabo 17.3.6 agrees for Juba's day. Pliny's order puts Rusaddir and the Malvane in Tingitana and Siga in "the second Mauritania". Barrington: "Moulouya valley". AWMC's AD 69 province line 610 runs from the mouth (−2.39°E 35.09°N) up the lower Moulouya, within 0.1–6.2 km of Natural Earth's river, and leaves the AD 69 extent before its last vertex (−3.67°E 33.74°N). | Verified: two provinces (ruling 4) |
| M6 | Caesariensis's eastern edge: the Ampsaga | Pliny 5.1 lists Saldae, Igilgili and "Tucca, situate on the sea-shore and upon the river Ampsaga" last among its coastal towns. Smith "Ampsaga": "(in its lower course) the boundary between Mauretania and Numidia". AWMC's AD 69 line 609 starts on the coast at 6.081°E 36.874°N, 2.1 km from Pleiades 305126 "Tucca?". It passes 5 km west of Cirta (`pleiades:305064`), a Numidian city, and leaves the AD 69 extent between 34.49°N and 34.04°N. | Verified (from AD 42) |
| M7 | "a named town (Saldae) additionally marking the Africa-facing edge under Juba II" | These are two frontiers. Under Juba it was Saldae (Strabo 17.3.12; the Loeb editor of Tacitus, *Annals* 4.24 n. 5: Thubusuctu "near Saldae (Bougie) on the Mauretanian frontier"). From 42 it was the Ampsaga, 92 km east. AWMC's AD 14 extent ends the kingdom near Rusuccuru (3.9°E), 109 km west of Saldae. | **Fix needed** (see G1) |
| M8 | "AWMC may also help, pending confirmation" (the AD 200 GeoJSON) | Confirmed in the layer the build actually reads, the AD 69 province shapefile (lines 609, 610 and 611). The AD 200 file isn't an input of the partition. | **Fix needed** (resolved here) |
| M9 | The southern edge is the existing empire edge | AWMC's AD 69 extent; Strabo 17.3.9 (the Gaetulians in the interior) | Verified |

## 5. Adjacency
The human's example.

| # | Claim | Re-run on the committed shapes | Verdict |
|---|---|---|---|
| J1 | `commagene`/`cappadocia` touch | Not disjoint; 225 km shared | Verified |
| J2 | `commagene`/`syria` touch | Not disjoint; 107 km shared | Verified |
| J3 | `cappadocia`/`syria` touch | Not disjoint; 6 km shared | Verified |
| J4 | No new border that meets no neighbour | All pairs with bounding boxes within 0.05°: 38 touch and 20 are apart. The 20 are separated by sea or a third area, for example Bithynia/Thrace and Italy/Sicily. | Verified |
| J5 | The AD 14 face was "literally named by AWMC's own towns" | The name comes from the project's reference towns (`REFERENCE_TOWNS` in `ancient-partition.mjs`), not AWMC. The conclusion stands, since even the wrong coordinates (§7) fall in that face. | **Fix needed** (wording) |

So no border is missing at the Syria–Cappadocia–Commagene tripoint. What confused the reader was Cappadocia's shape and a "PONTUS" label floating over it, as the note says. Commagene's late borders are M5-10's job.

## 6. Smith's "Melitene in Armenia Minor"
**Verified; no effect on the line beyond keeping Melitene in Cappadocia.**
- Smith's "Sophene" says "separated by the Euphrates from Melitene in Armenia Minor".
- His cited passages (Strabo xi, pp. 521–527) don't say that. Strabo, our contemporary source, counts Melitene among Cappadocia's ten prefectures: it "lies between Cataonia and the Euphrates ... is a tenth portion of the country" (12.1.2), and it is "the only country in all Cappadocia" with olives (12.2.1).
- So for the first century, Melitene stays in `cappadocia`. In the G1 construction it is a Cappadocian anchor (`pleiades:629039`), and Melitene city (`pleiades:629040`) lands in `cappadocia`.
- Sophene's own line is held, so its west edge isn't drawn.

## 7. Pleiades IDs in `scripts/lib/ancient-partition.mjs`

| # | Claim | Finding (Pleiades dump, 2026-10-18) | Verdict |
|---|---|---|---|
| P1 | `857036` isn't Amaseia | It is "Arauraka" (283 km away); Amaseia is `857018` (1.6 km from the code's point) | Verified |
| P2 | `857229` isn't Neocaesarea | It is "Matuasco"; Neocaesarea is `857177` (see A9 for the coordinate) | Verified |
| P3 | The other reference towns are "correctly identified" | Eight more IDs are wrong: Salona `197470` ("Raparia"), Caesarea Mazaca `628879` (not in Pleiades), Patara `639053` ("Phoinike"), Samosata `658603` ("Srir"), Emesa `668263` (not in Pleiades), Nicopolis `857238` ("Morthoula", 339 km away), Artaxata `874318` ("Ammodios/Amouda") and Ctesiphon `893989` ("Dura"). Nicopolis's coordinate is also 30 km off. 9 of 19 are right. | **Fix needed** (G7) |

These IDs reach only the composition report's text, not `data/geo/`: the faces are named by coordinates. Phase 3 relies on these towns, so the GIS Engineer fixes them (G7).

## 8. Lands still undrawn; Chalcis; Sophene

| # | Item | Finding | Verdict |
|---|---|---|---|
| U1 | Chalcis and the Massyas (ruling 3) | I agree that it waits. Strabo 16.2.18 places Chalcis in the Massyas as its citadel, and 16.2.10 gives the Massyas to the earlier Ptolemy son of Mennaeus. Neither states the first-century kingdom's border, and a plain's outline isn't one. | Verified |
| U2 | Sophene: "the Antitaurus on the south (toward Mesopotamia), and Mount Masius on the north" (held, so only flagged) | That's reversed. Strabo 11.14.2: "Mt. Masius is the mountain which lies above the Mygdonians of Mesopotamia on the south ... whereas Sophenê is situated in the northern parts, between Masius and Antitaurus." Smith says instead that the Antitaurus separates it from Mesopotamia, so the two sources disagree. For the backlog item. | **Fix needed** (backlog) |
| U3 | §3.2: "13 records" have no political area | 11 of the 122 have neither a place-level nor a candidate-level `politicalAreaId` | **Fix needed** (trivial) |

## The PO's rulings against the sources
The rulings as given (`docs/PROGRESS.md`, 2026-10-18), and what the sources say about each.

1. **"One combined area (option b)."** It covers Pontus Galaticus, Polemon's kingdom and Armenia Minor, bounded as the note's §4.1 proposes: "Strabo's line against Cappadocia, the Halys, the coast, and the empire's edge."
   - *Status:* "at each stop, the status its parts share. Where they differ, it follows Polemon's kingdom of Pontus ..., and the area's note names each part's holder."
   - *"Unclear":* "only for a stop where the sources leave that default part's own status unclear."
   - *Labels:* "the `pontus` record names the area. 'Armenia Minor' gets a grey italic label of its own if an attested point allows."

   **The sources support it, except its anchor.**
   - Strabo's own text contradicts running the line through the Barrington Atlas's Dasmenda (A1). It is built from anchors on both sides instead (G1), and its course is low-confidence.
   - The Halys, coast and east edges hold, and the Euphrates part of the east edge has a source (12.3.28).
   - No stop is unclear, and Armenia Minor has an attested point (G1).
2. **"Hold Sophene."** Skipped, apart from U2.
3. **"Chalcis waits."** Agreed (U1).
4. **"Mauretania: two provinces from AD 42 if the Mulucha line holds up ... before 42 it is one client kingdom, and the years 40–42 follow the sources."**
   - **The line holds (M5), so two provinces.**
   - Before 42, the kingdom can't have the provinces' outline without contradicting Strabo, because its frontier was at Saldae (M7). I recommend a strip shown as unclear until 42 (G1; item for the PO).
   - At the 41 stop the sources make the status unclear (M2, M3).
5. **"The note names only the lands still undrawn. It adds one sentence: Pontus, Pontus Galaticus and Armenia Minor share one area because no source draws the lines between them."**
   - True: no source draws them (Q3, §4.2 of the note).
   - I suggest "Polemon's kingdom of Pontus" for "Pontus", because the coast of western Pontus is drawn with Bithynia (G6).
6. **Phase 4 checks the drawn result.** Noted.

## For the GIS Engineer (phase 3)
Build exactly this. Anything not listed stays as it is. Coordinates are `[lon, lat]`; Pleiades points are representative points from the dump read on 2026-10-18.

### G1. Areas, edges and labels

#### New area `pontus`
- **Setup:** `locationId: "pontus"`, `focus: true`.
- **Shape:** today's `cappadocia` shape (AWMC AD 14 face f0046 and its additions), clipped to the Pontus side of the line in E1. Expect about 75,700 km². That is my 0.02° raster estimate; within ±5% is fine.

| Edge | Neighbour | Rule | Data | Confidence | Provenance label |
|---|---|---|---|---|---|
| E1 | `cappadocia` (and, at its west end, the land around Tavium, which stays in `cappadocia`; see "Items for the PO") | Rule 2, approximate. Strabo 12.2.10 gives only the end districts, so the line runs equidistant between the nearest anchors of the two sides, built as `drawGalatiaCappadociaLine` builds its line. Make Voronoi cells of the Pontus anchors against the other side's anchors, in a projection scaled by cos 39.5°, then clip. | **Pontus side:** Amaseia `pleiades:857018` `[35.8279, 40.6668]` (Strabo 12.3.39); Babanomon `pleiades:857053` `[35.2967, 40.6311]` (12.3.39); Zela `pleiades:857382` `[35.8902, 40.3039]` (12.3.37); Comana Pontica `pleiades:857095` `[36.6387, 40.3576]` (12.3.32–36); Cabeira (Sebaste) `pleiades:857177` `[37.0201, 40.5892]` (12.3.30–31); Camisa `pleiades:628997` `[37.4012, 39.8458]` (12.3.37); Nicopolis `pleiades:857248` `[38.1435, 40.1486]` (12.3.28). **Other side:** Mazaca `pleiades:629035` `[35.4744, 38.7264]` (12.2.7–9); Venasa (Ouenasa) `pleiades:619230` `[34.766, 38.7231]` (12.2.6, Morimene); Chammanene `pleiades:619137` `[34.0576, 39.2844]` and Laviansene `pleiades:629025` `[37.2405, 39.3602]` (12.1.4, 12.2.10); Sargarausene `pleiades:629068` `[36.621, 38.6875]` (12.1.4); Melitene `pleiades:629039` `[37.6847, 38.4417]` (12.1.2); Tavium `pleiades:619267` `[34.5183, 39.8583]` (12.5.2, Galatian Trocmi; Strabo 12.3.39 runs Amaseia's land south "as far as the Trocmi"). | **Low** for the course; medium for which side each anchor lies on. Wikidata confirms the towns within 0.1–4.6 km: Q170532, Q127431718, Q2140586, Q513980, Q619704, Q10439273, Q1413514. The district points are Barrington labels. | `described-line`: "Pontus–Cappadocia (rule 2; Strabo 12.2.10): Strabo puts the boundary on a mountain tract parallel to the Taurus from the western end of Chammanene to the eastern end of Laviansene, both Cappadocian prefectures, and names no point on it that can be located; the Barrington Atlas's two places for Dasmenda lie inside Cappadocia. The line runs equidistant between the nearest anchors of the two sides: [Pontus names] (Strabo 12.3.28–39) and [other names] (Strabo 12.1.2–4, 12.2.6–10; Tavium, a Galatian town, 12.5.2). Approximate." Sources: `bib:strabo-geography` and the 14 `pleiades:` ids. |
| E2 | `galatia` (Paphlagonia) | Unchanged: AWMC's AD 14 face edge (rule 3), which is the Halys (rule 2) at this scale | From E1's west end, near 34.35°E 40.55°N, north to the tripoint with `bithynia` at 35.621°E 41.287°N. It stays within 6.2 km of Natural Earth's Kızılırmak. Sources: Strabo 12.3.9, 12.3.38–39; ISBE "Pontus" ("from the Halys River on the West"). | Medium | Keep the inherited `mapshaper-compose` change and add to it: "follows the Halys, Paphlagonia's eastern boundary (Strabo 12.3.9)". |
| E3 | `bithynia` | Unchanged: AWMC's AD 69 face edge | From 35.621°E 41.287°N to the coast at 37.479°E 41.059°N. Themiscyra (`pleiades:857350`) is in Amisus's land (Strabo 12.3.9) and stays in `bithynia`. | Medium | Inherited (M4 segment 16) |
| E4 | The Black Sea | Unchanged coast | Natural Earth land | High | Inherited |
| E5 | Land beyond the empire (east) | Unchanged: AWMC's AD 69 extent | From E1's east end on the Euphrates, near 38.71°E 39.17°N, it follows the Karasu (western Euphrates) to about 40.2°E 39.6°N. Strabo 12.3.28: "the Euphrates, which separates Acilisenê from Lesser Armenia". From there it runs north to the coast at 40.65°E 40.96°N, where no source gives the line (Strabo 12.3.29 has Pythodoris's realm reach "as far as Colchis", beyond this edge). | Medium on the Karasu; low north of it | Inherited; the area's provenance notes the Euphrates source and that Pythodoris's realm ran on toward Colchis. |

**Labels:**
- **The area's own label** comes from its holder.
  - −4 to 53: "KINGDOM OF PONTUS". The holder entity `pontus-kingdom` has `locationId: "pontus"`, so the label opens the `pontus` record and that record's own label is hidden while the kingdom holds the area.
  - From 67: the province of Galatia, which this area joins with no border.
- **"Armenia Minor"** is a grey italic label that can't be clicked. It isn't a place record (new records are out of scope). Put it at `pleiades:628936` "Armenia Minor" (Barrington 64 G2), `[38.3301, 39.5639]`, which is inside `pontus`, about 21 km from E1. Wikidata Q1148125's point `[39.63, 40.69]` is 167 km away, also inside `pontus`; Nicopolis, which Strabo 12.3.28 puts in Lesser Armenia, is the fallback. Show it at all stops.

#### `cappadocia` (changed)
Its shape is today's less `pontus`, and its other edges don't change. Its provenance gains E1's change, and its first change's detail adds: "less the land north of Strabo's Pontus–Cappadocia line (see `pontus`)".

#### New Mauretania areas
All three: `focus: true`.

| Area | Shape |
|---|---|
| `mauretania-tingitana` | The AD 69 land faces west of AWMC AD 69 province line 610, inside the AD 69 extent |
| `mauretania-caesariensis` | The AD 69 land faces between lines 610 and 609, outside AWMC's AD 14 extent |
| `mauretania-caesariensis-east` | The same faces inside the AD 14 extent: a wedge from about 3.9°E on the coast to 6.08°E, ending inland near 35°N |

These lines are in `political_shading/roman_empire_ad_69_provinces` in `Cultural Shapefiles Apr 2024.zip`. Its OBJECTIDs (609, 610) differ from the build's `_ibmLineId` (the feature index), so pick the faces by test points (G8).

| Edge | Between | Rule and data | Confidence | Provenance label |
|---|---|---|---|---|
| M-a | Tingitana / Caesariensis | Rule 3, matching rule 2: AWMC AD 69 line 610, the lower Moulouya (M5). Shows from 42 only, since both areas have one holder before. | Medium | `mapshaper-compose`: "AWMC AD 69 province line between Tingitana and Caesariensis, along the lower Moulouya: the Mulucha (Smith, 'Mauretania', 'Mulucha'), Strabo's Molochath (17.3.6)". Sources: `awmc:roman-empire-ad-69-provinces`, `bib:smith-dictionary-mauretania`, `bib:smith-dictionary-mulucha`, `bib:strabo-geography`, `pleiades:289941`. |
| M-b | Caesariensis / Caesariensis-east | Rule 3: AWMC's AD 14 extent edge. Shows before 42 only, dashed. | Low | `mapshaper-compose`: "AWMC's AD 14 edge, where it ends the kingdom; Strabo names Saldae, about 110 km farther east, as the frontier under Juba (17.3.12), and no source gives its course inland." Sources: `awmc:roman-empire-ad-14-extent`, `bib:strabo-geography`. |
| M-c | Caesariensis and Caesariensis-east / `other-roman-lands` (Numidia) | Rule 3, matching rule 2 at the mouth: AWMC AD 69 line 609, the Ampsaga (M6) | Medium on the coast; low inland | `mapshaper-compose`: "the Ampsaga's mouth (Pliny 5.1, Tucca; Smith, 'Ampsaga'); inland, AWMC's line". Sources: `awmc:roman-empire-ad-69-provinces`, `bib:pliny-natural-history`, `bib:smith-dictionary-ampsaga`, `pleiades:305126`. |
| M-d | Outer edges | Unchanged: AWMC's AD 69 extent (including line 611 near Sala) and the coasts | As now | Inherited |

**If the PO prefers only two areas,** drop `mauretania-caesariensis-east` and give its land to `mauretania-caesariensis`. Then the −25→40 note must add: "Strabo names Saldae, about 90 km west of this area's eastern edge, as the frontier between Juba's land and Rome's; the map draws the kingdom with the later provinces' outline, so its eastern edge before AD 40 is approximate."

**Labels** come from the holders: "KINGDOM OF MAURETANIA" before 40; "PROVINCE OF MAURETANIA TINGITANA" and "PROVINCE OF MAURETANIA CAESARIENSIS" from 42; no label while unclear.

### G2. Holders and status at each stop

| Stop | `pontus` | `cappadocia` (unchanged) | `mauretania-tingitana` | `mauretania-caesariensis` | `mauretania-caesariensis-east` |
|---|---|---|---|---|---|
| −4 | Kingdom of Pontus (Polemon I, then Pythodoris) | Kingdom (Archelaus) | Kingdom of Mauretania (Juba II) | Kingdom (Juba II) | Unclear |
| 6 | Kingdom of Pontus (Pythodoris) | Kingdom (Archelaus) | Kingdom (Juba II) | Kingdom (Juba II) | Unclear |
| 17 | Kingdom of Pontus (Pythodoris) | Province | Kingdom (Juba II) | Kingdom (Juba II) | Unclear |
| 34, 37 | Kingdom of Pontus (Pythodoris; no ruler named after Strabo) | Province | Kingdom (Ptolemy) | Kingdom (Ptolemy) | Unclear |
| 39 | Kingdom of Pontus (Polemon II) | Province | Kingdom (Ptolemy) | Kingdom (Ptolemy) | Unclear |
| 41 | Kingdom of Pontus (Polemon II) | Province | **Unclear** | **Unclear** | Unclear |
| 44, 53 | Kingdom of Pontus (Polemon II) | Province | Province of Mauretania Tingitana | Province of Mauretania Caesariensis | Province of Mauretania Caesariensis |
| 67–100 | Province of Galatia | Province | Province | Province | Province |

The sources are in each period's `sources` in G3. Galatia, Bithynia, Syria and Commagene don't change.

### G3. Timeline entries (JSON)
**Entities** (add):
```json
{ "id": "pontus-kingdom", "name": "Kingdom of Pontus", "kind": "client-kingdom", "romanSide": true, "locationId": "pontus", "sources": ["bib:isbe-pontus", "bib:strabo-geography", "bib:cassius-dio-roman-history"] },
{ "id": "mauretania-kingdom", "name": "Kingdom of Mauretania", "kind": "client-kingdom", "romanSide": true, "sources": ["bib:smith-dictionary-mauretania", "bib:strabo-geography", "bib:tacitus-annals"] },
{ "id": "mauretania-tingitana-province", "name": "Roman province of Mauretania Tingitana", "kind": "roman-province", "romanSide": true, "sources": ["bib:cassius-dio-roman-history", "bib:smith-dictionary-mauretania"] },
{ "id": "mauretania-caesariensis-province", "name": "Roman province of Mauretania Caesariensis", "kind": "roman-province", "romanSide": true, "sources": ["bib:cassius-dio-roman-history", "bib:smith-dictionary-mauretania"] }
```

**Areas** (add before `other-roman-lands`):

`pontus` periods:

| fromYear → toYear | holderId | ruler | note | sources |
|---|---|---|---|---|
| −36 → 17 | `pontus-kingdom` | "Polemon I, then his widow, Queen Pythodoris" | "This area joins three lands whose borders with each other no source describes: the kingdom of Pontus, which it shows; Pontus Galaticus to the south-west; and Lesser Armenia to the east. The geographer Strabo says that Pythodoris reigned with her husband Polemon I and succeeded him when he died; he gives no year. The emperor Augustus granted Lesser Armenia to King Archelaus of Cappadocia in 20 BC (the Roman historian Cassius Dio), and Strabo adds that Pythodoris married Archelaus and 'remained with him to the end.' The districts later called Pontus Galaticus were held by local rulers and priests until 2 BC, when they joined the Roman province of Galatia." | `bib:strabo-geography`, `bib:cassius-dio-roman-history`, `bib:isbe-galatia`, `bib:isbe-pontus` |
| 17 → 38 | `pontus-kingdom` | "Queen Pythodoris; no source names a ruler from Strabo's account, written after AD 17, until AD 38" | "Archelaus died in AD 17, and Strabo describes Pythodoris as then ruling as a widow. No source names who held Lesser Armenia from his death until AD 38. Pontus Galaticus belongs to the province of Galatia." | `bib:strabo-geography`, `bib:tacitus-annals`, `bib:isbe-galatia` |
| 38 → 64 | `pontus-kingdom` | "Polemon II" | "In AD 38 the emperor Caligula granted 'to Cotys Lesser Armenia' and 'to Polemon, the son of Polemon, his ancestral domain' (Cassius Dio). In AD 54 the emperor Nero gave Lesser Armenia to Aristobulus, son of Herod of Chalcis (the Jewish historian Josephus; the Roman historian Tacitus). Pontus Galaticus belongs to the province of Galatia." | `bib:cassius-dio-roman-history`, `bib:josephus-antiquities`, `bib:tacitus-annals`, `bib:isbe-galatia` |
| 64 → 101 | `galatia-province` | — | "Polemon II gave up his kingdom, which joined the province of Galatia as 'Pontus Polemoniacus'; the International Standard Bible Encyclopedia gives AD 63 in its 'Pontus' article and AD 64 in its 'Galatia' article, and this map uses 64. Aristobulus had held Lesser Armenia since AD 54; the emperor Vespasian annexed it in AD 72, and no cited source says which province then governed it." | `bib:isbe-galatia`, `bib:isbe-pontus`, `bib:josephus-antiquities`, `bib:worldhistory-vespasian` |

`mauretania-tingitana` and `mauretania-caesariensis` periods:

| fromYear → toYear | holderId | ruler | note | sources |
|---|---|---|---|---|
| −25 → 40 | `mauretania-kingdom` | "Juba II, then from about AD 23 his son Ptolemy" | "The emperor Augustus gave Juba II the kingdom in 25 BC (Smith's Dictionary of Greek and Roman Geography). The geographer Strabo records that Juba 'died lately' and that his son Ptolemy succeeded him; the Roman historian Tacitus calls Ptolemy king in AD 24." Caesariensis adds: "Strabo names the harbour of Saldae, east of this area, as 'a boundary between the territories subject to Juba and the Romans.'" | `bib:smith-dictionary-mauretania`, `bib:strabo-geography`, `bib:tacitus-annals` |
| 40 → 42 | `uncertain-roman-side` | — | "The emperor Caligula had King Ptolemy put to death in AD 40, and the Roman historian Cassius Dio dates the start of Roman rule over the Mauretanias to then. Pliny the Elder writes that the freedman Aedemon took up arms to avenge him and that Roman armies first fought in Mauretania under the emperor Claudius; Dio says the war was over before Claudius came to the throne in AD 41 and that the Moors rose again in AD 42. The land became two provinces only after the campaigns of AD 42, so its status from AD 40 to 42 is unclear." | `bib:cassius-dio-roman-history`, `bib:pliny-natural-history` |
| 42 → 101 | `mauretania-tingitana-province` / `mauretania-caesariensis-province` | "Equestrian governors" | "After the campaigns of AD 42 the emperor Claudius divided the Moors into two districts, named after Tingis and Caesarea, each under a governor of equestrian rank (Cassius Dio). Smith's Dictionary of Greek and Roman Geography puts the line between them at the river Mulucha, the geographer Strabo's Molochath, today's Moulouya." Caesariensis adds: "Its border with Numidia was the river Ampsaga, on whose bank Pliny the Elder places Tucca, the last town he names in this province." | Tingitana: `bib:cassius-dio-roman-history`, `bib:smith-dictionary-mauretania`, `bib:smith-dictionary-mulucha`, `bib:strabo-geography`, `pleiades:289941` (for "today's Moulouya"). Caesariensis: those, plus `bib:pliny-natural-history` and `bib:smith-dictionary-ampsaga`. |

`mauretania-caesariensis-east` periods:

| fromYear → toYear | holderId | note | sources |
|---|---|---|---|
| −25 → 42 | `uncertain-roman-side` | "The geographer Strabo names the harbour of Saldae, in this area, as 'a boundary between the territories subject to Juba and the Romans,' and the Loeb editor of Tacitus places the Mauretanian frontier of AD 24 near Saldae; no source gives the frontier's course inland, so who held each part of this land is unclear until AD 42." | `bib:strabo-geography`, `bib:tacitus-annals` |
| 42 → 101 | `mauretania-caesariensis-province` | "Pliny the Elder lists Saldae, Igilgili and Tucca, on the river Ampsaga, among the towns of Mauretania Caesariensis." | `bib:pliny-natural-history` |

### G4. Text that must change with the shapes
ADR-0037 item 1 says the map never changes without saying so, and several existing texts say these lands are drawn with Cappadocia.

| Where | Change |
|---|---|
| `cappadocia`, period 17→69, `note` | Delete from "This area's drawn land also covers three lands ..." to the end. Keep the Veranius sentences, and keep `sources` as `bib:tacitus-annals`, `bib:isbe-cappadocia`, `bib:livius-cappadocia`. |
| `galatia`, `note` | Append: "Pontus Galaticus, part of this province from 2 BC, and Polemon's former kingdom, part of it from AD 64, are drawn in the area of Pontus (see its note)." |
| Stop 6, `summary` | Replace the last sentence with: "Also from this stop: in 2 BC, the district called "Pontus Galaticus" had already joined the province of Galatia; this map draws it in one area with Polemon's kingdom of Pontus and Lesser Armenia, and that area still shows the kingdom." |
| Stop 39 | Replace "-- two more changes in small lands that this map draws as part of Cappadocia." with "-- from this stop the kingdom of Pontus shows Polemon II as its king, and its note names Cotys for Lesser Armenia, which this map draws in the same area." |
| Stop 41 | Append: "In Mauretania, the emperor Caligula had put King Ptolemy to death in AD 40; the freedman Aedemon took up arms to avenge him, and the land's status is unclear until it became two provinces in AD 42." Add `bib:pliny-natural-history` to `sources`. |
| Stop 44 | Append: "After the campaigns of AD 42, Claudius had divided Mauretania into two provinces, named after Tingis and Caesarea." Add `bib:smith-dictionary-mauretania` to `sources` (Dio is already there). |
| Stop 67 | Replace "; neither of these lands is its own area on this map (see the Cappadocia area's own note)." with "; from this stop the area of Pontus shows the province of Galatia, and its note names Aristobulus as the holder of Lesser Armenia." |
| Stop 72 | Replace "Lesser Armenia, a small kingdom whose land this map draws together with Cappadocia, is also annexed about this year." with "Lesser Armenia, which this map draws in the area of Pontus, is also annexed about this year." |
| `data/locations/pontus.json` | No change. Don't give it a `politicalAreaId`: the record covers the coast of western Pontus too, which is drawn in `bithynia`, and its verified history says so. |

### G5. Bibliography entries to add
Add these to `data/bibliography.json`. Don't add the note's `smith-dictionary-sophene` and `smith-dictionary-emesa`, which phase 3 doesn't use.
```json
{ "id": "pliny-natural-history", "type": "book", "title": "The Natural History (translation by John Bostock and H. T. Riley, hosted on the Perseus Digital Library)", "authors": ["Pliny the Elder"], "year": 1855, "publisher": "Taylor and Francis", "url": "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0137", "accessed": "2026-10-18" },
{ "id": "smith-dictionary-mauretania", "type": "chapter", "title": "Mauretania", "authors": ["William Smith"], "year": 1854, "publisher": "Walton and Maberly", "containerTitle": "Dictionary of Greek and Roman Geography (William Smith, ed.), hosted on Perseus Digital Library", "url": "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0064:entry=mauretania-geo", "accessed": "2026-10-18" },
{ "id": "smith-dictionary-mulucha", "type": "chapter", "title": "Mulucha", "authors": ["William Smith"], "year": 1854, "publisher": "Walton and Maberly", "containerTitle": "Dictionary of Greek and Roman Geography (William Smith, ed.), hosted on Perseus Digital Library", "url": "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0064:entry=mulucha-geo", "accessed": "2026-10-18" },
{ "id": "smith-dictionary-ampsaga", "type": "chapter", "title": "Ampsaga", "authors": ["William Smith"], "year": 1854, "publisher": "Walton and Maberly", "containerTitle": "Dictionary of Greek and Roman Geography (William Smith, ed.), hosted on Perseus Digital Library", "url": "https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.04.0064:entry=ampsaga-geo", "accessed": "2026-10-18" }
```
The publisher is the one Perseus states. The note's "Henry G. Bohn" isn't on the page.

### G6. The Sources popover's note
Use this exact wording:

> Borders are approximate, and the routes of some roads are conjectured. Provinces far from the New Testament's places are shown together, and lands whose borders aren't known, such as Abilene, Chalcis or Emesa, aren't drawn. Polemon's kingdom of Pontus, Pontus Galaticus and Armenia Minor share one area because no source draws the lines between them.

Change it in all three places:
- `app/src/components/app-shell.web.tsx` (line 2191, with `&apos;`);
- `scripts/verify-web-export-playwright.mjs` (line 53);
- `docs/design/VISUAL_SPEC.md` §2 "Notes on the borders" (the PO's file; ask the PO, or change it in the same PR).

The PO's sentence said "Pontus". I use "Polemon's kingdom of Pontus" because the coast of western Pontus is drawn in `bithynia`.

### G7. Code fixes and build notes
1. **`scripts/lib/ancient-partition.mjs`, `PLEIADES_REFERENCE_POINTS`.** Fix the IDs, and for Neocaesarea and Nicopolis the points:

   | Town | Wrong ID | Correct ID | Point |
   |---|---|---|---|
   | Salona | `197470` | `197488` | — |
   | Caesarea Mazaca | `628879` | `629035` | — |
   | Patara | `639053` | `639042` | — |
   | Samosata | `658603` | `658587` | Optional: `[38.5304, 37.5258]`; the code's is 9.0 km off |
   | Emesa | `668263` | `668261` | — |
   | Amaseia | `857036` | `857018` | — |
   | Neocaesarea | `857229` | `857177` | `[37.0201, 40.5892]` |
   | Nicopolis (Armenia Minor) | `857238` | `857248` | `[38.1435, 40.1486]` |
   | Artaxata | `874318` | `874361` | Optional: `[44.5752, 39.8819]`; the code's is 8.7 km off |
   | Ctesiphon | `893989` | `893976` | — |

   The faces should come out the same; confirm that the AD 14 and AD 69 face names and areas don't change.
2. **`scripts/lib/ancient-compose.mjs`:**
   - Add the four area ids to `AREA_ORDER`, and their sources to `SOURCE_BY_AREA`.
   - Add a `PONTUS_CAPPADOCIA_ANCHORS` constant with E1's lists, and a step after `drawGalatiaCappadociaLine` that moves the Pontus side of `cappadocia` into `pontus`.
   - Change `OUTSIDE_LIST_PROBES`' "Mauretania and Numidia" to "Numidia", `[[6.6, 36.37]]` (Cirta). The other four points will lie in listed areas.
   - Optional: add `REFERENCE_TOWNS` for the report.
3. **Size.** `build:data` must stay within 300,000 bytes gzip. If it doesn't, give the three Mauretania areas `OTHER_ROMAN_LANDS_SIMPLIFY_METRES`, since no place of ours lies within 150 km of them.
4. **Provenance and `docs/research/SOURCES.md`.** No new upstream dataset; record that the AD 69 province lines 609 and 610 and the AD 14 extent now bound named areas.

### G8. Checks and assertions
Assert each point inside its area, as `assertInside` does:

| Area | Points |
|---|---|
| `pontus` | E1's seven Pontus anchors; Sebasteia `[37.0166, 39.749]`; Polemonion `[37.5002, 41.0309]`; Pharnakeia `[38.3979, 40.9191]`; Trapezus `[39.7233, 41.0043]`; Satala `[39.5979, 40.0279]`; `pontus.json`'s label point `[37.83, 40.68]`; the Armenia Minor label point |
| `cappadocia` | E1's seven other anchors, including Tavium; Melitene city `[38.3612, 38.3822]`; Tyana; Garsaura; `cappadocia.json`'s label point `[34.8392, 38.6706]` |
| `mauretania-tingitana` | Tingi `[-5.8102, 35.7875]`, Volubilis `[-5.5549, 34.0729]`, Rusaddir `[-2.9388, 35.2922]` |
| `mauretania-caesariensis` | Siga `[-1.4517, 35.2529]`, Cartenna `[1.311, 36.51]` |
| `mauretania-caesariensis-east` | Saldae `[5.058, 36.7409]`, Igilgili `[5.7662, 36.8213]`, Sitifis `[5.4042, 36.1921]` |
| `other-roman-lands` | Cirta `[6.6133, 36.3681]` |

- **E1's ends:** it meets the outline twice, near 34.35°E 40.55°N (the Halys) and 38.71°E 39.17°N (the Euphrates).
- **E1's course:** at 35.0°E, 36.0°E, 37.0°E and 38.0°E it lies near 40.2°N, 39.5°N, 39.7°N and 39.5°N. Small differences are fine.
- **Commands:** run the card's checks, `validate:data`, `check:ancient-geo`, `test`, `build:data`, `test:app`, `export:web` and `verify:web:playwright`, and take screenshots at zooms 5–7 around Syria, Cappadocia, Commagene, Galatia and Pontus, and of Mauretania at the −4, 41 and 44 stops.

## Fixes for the Research Lead (the note)
The note isn't data, and G1–G8 already apply these fixes. Correcting the note in the same PR is optional and up to the PO.

| # | Note section | Fix | Source rows |
|---|---|---|---|
| F1 | §4.1 | Drop the Dasmenda anchor | A1 |
| F2 | §4.1 | Laviansene is pinned | A2 |
| F3 | §4.1 | Sargarausene is a Cappadocian-side anchor, not a bearing | A3 |
| F4 | §4.1 | Wording about Culupene and Camisene | Q3 |
| F5 | §4.1 table | The −4 and 17–38 rows | H1, H3 |
| F6 | §4.1 | Pontus Galaticus before 2 BC | Q27 |
| F7 | §4.1, §4.2 | The east edge has a source: Strabo 12.3.28 | Finding 3 |
| F8 | §4.10 | The translators' dates and words | Q14, Q15 |
| F9 | §4.10 | AD 42's source | Q16 |
| F10 | §4.10 | Saldae and the Ampsaga are two frontiers | M7 |
| F11 | §4.10 | AWMC confirmed | M8 |
| F12 | §4.10 | Wording on Iol and Volubilis | A6, A7 |
| F13 | §7 | The side finding: 10 of 19 IDs are wrong; 45–49 km | P3, A9 |
| F14 | §2 | Reference towns, not "AWMC's own towns" | J5 |
| F15 | §3.2 | 11, not 13 | U3 |
| F16 | §4.7 | Masius and Antitaurus are swapped (backlog) | U2 |
| F17 | §7 | Pliny's publisher | G5 |

## Items for the PO
1. **The Pontus line's anchors.** The line is equidistant between places Strabo assigns, and its course is low-confidence. This is the method you accepted for Galatia–Cappadocia (M4, RL4). Confirm, or keep both lands with Cappadocia as now.
2. **Mauretania before AD 42.** I recommend the "unclear" strip (`mauretania-caesariensis-east`): it contradicts no source, and it follows ADR-0037 rule 4. The alternative is two areas only, simpler but contradicted by Strabo for six stops (G1).
3. **Not in this card's rulings: Tavium.** The Galatian Trocmi's town (Strabo 12.5.2; ISBE "Galatia": "Tavia") lies in `cappadocia`, about 70 km east of the Halys, because AWMC's AD 14 line follows the river. E1 keeps it out of `pontus`, but it belongs to Galatia. The same anchor method could move the Trocmi land to `galatia` in a later card.
4. **The popover sentence:** "Polemon's kingdom of Pontus" in place of "Pontus" (G6).
5. **A small bibliography point.** `bib:tacitus-annals` gives 1931. LacusCurtius marks *Annals* 4 and 13 as the 1937 volume, also public domain. It is noted in `LICENSES.md`, with no data change.

## My changes in this commit
- `docs/verification/M5-ancient-lands.md` (this report).
- `docs/LICENSES.md` and `ATTRIBUTION.md`: Pliny's *Natural History* in Bostock and Riley's translation (1855, Perseus) is public domain and may be quoted. The public-domain row also notes the 1937 *Annals* volume.
- `docs/PROGRESS.md`: the M5-11 row. `docs/BUDGET.md`: one row.
- No data, schema or code changes.

## Checks run
- **Scripts:** the read-only Node and Python scripts above, on 2026-10-18 with Node 24.21.0 and the root `node_modules`, plus mapshaper 0.6 on the pinned AWMC zip.
- **Not run:** `validate:data`, `test`, the builds and the browser suites. This commit changes no data or code, and the PO asked for no builds on this machine.

## Phase 4: the drawn result
- **Checked:** the GIS Engineer's `1627d49` and `4a11804`, and the PO's `552dcfb`, on the rebased branch (head `552dcfb`, draft PR #77). I compared them with the phase-2 base `2f2dc98`, against G1–G8 above (ruling 6).
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-19.
- **Method:**
  - Node scripts over the committed `data/geo/ancient-areas.geojson`, `ancient-empire-edge.geojson` and `data/timeline.json`.
  - Strict point-in-polygon tests with no tolerance.
  - Vertex and edge matching between neighbouring areas, and raster sampling at 0.002–0.02° for gaps and overlaps.
  - AWMC's pinned shapefiles (SHA-256 `ae209bd5…` again) for lines 609 and 610 and the AD 14 extent.
  - Read-only `gh` for CI on #77.
  - No build, browser or test run.

**Result: fixes needed (4 of 14 items).** The drawn borders, holders, texts, bibliography, popover and IDs match G1–G8. Four things need fixing:
- seven slivers of `other-roman-lands` left on Mauretania's coast;
- the "Armenia Minor" label's hover text, which shows the ruler and years of whoever holds the `pontus` area;
- the full browser suite, which fails on #77 although it passed on its base;
- three provenance clauses.

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | `pontus` and `cappadocia` (G1 E1–E5) | Verified | Areas, edges and gaps in detail below |
| 2 | G8 `assertInside` points | Verified | All 34, plus the Armenia Minor label point and 5 more (Amisus, Themiscyra, Sinope, Ancyra, Gangra), lie strictly in the right area |
| 3 | `galatia`, not meant to change | Verified, with a note | +10 km² near E1's west end, details below |
| 4 | The Mauretania areas | **Fix needed** | M-a, M-b and M-c follow their lines, but seven slivers of `other-roman-lands` sit on the coast (P4-F1) |
| 5 | The empire's edge | Verified | Same line: no vertex of the new edge lies more than 50 m off the old one, and it is 9,928 km either way. It is now 12 pieces, not 9, and its text says "28 areas" |
| 6 | Provenance labels and sources | **Fix needed** | Three clauses are missing or on the wrong area (P4-F4); the rest match G1 |
| 7 | Holders and status at each stop (G2) | Verified | 15 stops × 5 areas: 0 mismatches. Every area's periods run unbroken from −4 to 101, and every holder is a known entity. |
| 8 | Timeline entries (G3) | Verified | The 4 entities and the 4 areas' 12 periods (holder, ruler, note, sources) are character for character the same as G3, including "the freedman Aedemon" and `pleiades:289941`. `pontus` has `locationId: "pontus"`, and every new area has `focus: true`. |
| 9 | Text that changed with the shapes (G4) | Verified | `cappadocia` 17→69 note and sources; `galatia` note; stops 6, 39, 41, 44, 67 and 72, word for word, with `bib:pliny-natural-history` added to 41 and `bib:smith-dictionary-mauretania` to 44. The 8 records tied to `galatia` and `cappadocia` changed only `politicalHistory`, which mirrors the new notes. `pontus.json` is unchanged, and no text still says these lands are drawn with Cappadocia. |
| 10 | Bibliography (G5) | Verified | The net diff is 51 additions and 0 deletions; the 4 entries are identical to G5; 236 entries, no duplicates, and the file ends as before |
| 11 | The popover's note (G6) | Verified | Exact wording, with "Polemon's kingdom of Pontus", in `app-shell.web.tsx`, the Playwright string and VISUAL_SPEC §2. "Sources & credits" now names Pliny (1855), matching `ATTRIBUTION.md`. |
| 12 | The Pleiades IDs and code items (G7) | Verified | Notes below |
| 13 | The "Armenia Minor" label | **Fix needed** | The point and style are right, but its hover text borrows the `pontus` area's ruler and years (P4-F2) |
| 14 | CI on #77 | **Fix needed** | The "build" job passes. The full browser suite fails (P4-F3). |

**10 verified, 4 fixes needed, 0 rejected.**

**Item 1, `pontus` and `cappadocia`:**
- `pontus` is 76,006 km², 0.4% above my estimate; `cappadocia` is 109,964 km².
- E1's ends are 34.38884°E 40.55575°N and 38.71302°E 39.16729°N. At 35°, 36°, 37° and 38°E it lies at 40.189°, 39.463°, 39.666° and 39.469°N, as G8 expects.
- Along all 455 km of E1, the nearest anchors of the two sides are equally far within 0.78 km.
- Apart from E1, every `pontus` vertex was a vertex of the old `cappadocia`, and no old vertex is lost. So the Halys edge (E2, 183 km), the Bithynia edge (E3, 181 km, unchanged), the coast and the Euphrates (E5) are AWMC's lines as before.
- At 0.01° sampling, no land of the old `cappadocia` or `galatia` falls in no area, and nothing overlaps.

**Item 3, `galatia`:** it gains a 10 km² sliver between 34.15°E and 34.54°E. Splitting the shared arc at E1's end let simplification keep one new vertex, 34.34429°E 40.53954°N, about 550 m off the old chord and within the 600 m tolerance. The edge is still AWMC's.

**Item 12, the IDs and code:**
- All ten IDs are corrected, and so are the points for Neocaesarea `[37.0201, 40.5892]` and Nicopolis `[38.1435, 40.1486]`.
- `OUTSIDE_LIST_PROBES` now reads "Numidia" `[[6.6, 36.37]]`.
- `AREA_ORDER` and `SOURCE_BY_AREA` are done. The Mauretania areas use 3,500 m simplification, and `docs/research/SOURCES.md` has its note.
- The anchor lists match G1. The one difference: Mazaca uses the existing `POINTS.caesareaMazaca` `[35.48, 38.72]`, 0.86 km from `pleiades:629035`, which is negligible.
- Suggestion: the `pontus` assertion now allows 5 km and says an anchor "lies ... beyond the coastline". Since every point passes strictly, use the default 2 km, or no tolerance for inland anchors.

**Item 4, Mauretania:**
- Committed sizes: Tingitana 53,263 km², Caesariensis 150,036 km², the strip 24,517 km². The reported 53,664, 149,805 and 24,230 predate `4a11804`'s simplification.
- M-a's vertices lie on line 610, and the simplified edge stays within 2.7 km of it. Only its last link to today's coast, at the Moulouya's mouth, runs 5 km past the line's start.
- M-b lies exactly on the AD 14 outline, from 3.904°E 36.913°N on the coast to 5.386°E 35.071°N on line 609.
- M-c stays within 3.2 km of line 609, inside the 3.5 km simplification.
- Land outside AWMC's AD 69 extent reaches at most 2.3 km beyond it; the old `other-roman-lands` reached 3.2 km. A 0.02° sampling of North Africa and of Anatolia finds no overlaps.

### Fixes for the GIS Engineer (phase 4)
- **P4-F1. The coastal slivers in Mauretania.**
  - `carveMauretaniaAreas` clips `other-roman-lands` with AWMC's raw AD 69 faces, which end at AWMC's coastline. The thin coastal land between that coastline and Natural Earth's therefore stays in `other-roman-lands`, as seven new detached parts (66 → 73):

    | Part | Area | Where | Borders |
    |---|---|---|---|
    | 44 | 71 km² | Rif coast, −4.84°E 35.31°N | Tingitana, 39 km |
    | 45 | 18 km² | −3.29°E 35.24°N | Tingitana, 32 km |
    | 46 | 10 km² | −2.83°E 35.16°N | Tingitana, 20 km |
    | 47 | 9 km² | Moulouya's mouth | Tingitana 5 km and Caesariensis 17 km |
    | 48 | 29 km² | Oran, −0.65°E 35.74°N | Caesariensis, 16 km |
    | 49 | 61 km² | 4.70°E 36.88°N | The strip, 33 km |
    | 50 | 35 km² | Gulf of Béjaïa | The strip, 38 km |

  - Every one has a different holder from its neighbour at every stop, so the map would draw about 200 km of borders along this coast, dashed wherever the Mauretanian side is unclear.
  - **Fix:** give each part that borders only Mauretania areas to the one it shares most border with, as `rule-4-leftover` does. Part 47 goes to `mauretania-caesariensis`, or is split on line 610's line.
  - **Check:** afterwards no `other-roman-lands` part touches only Mauretania areas, and it again has 66 parts.
- **P4-F2. The "Armenia Minor" label's hover text.**
  - What is right: the point `[38.3301, 39.5639]` (`pleiades:628936`) is inside `pontus` and 21 km from E1. It is drawn in the grey italic layer for labels that can't be clicked, from zoom 5, at every stop.
  - What is wrong: it sits in `holderLabels`, so `buildAncientHolderLabelFeatures` gives it the `pontus` area's ruler and years. In the payloads built from `552dcfb`, hovering it shows "Armenia Minor · Allied kingdom · Polemon II · 36 BC – AD 64" at AD 39–53, and "Armenia Minor · Allied kingdom · from AD 64" from AD 67. Both are false: Lesser Armenia was held by Cotys and then Aristobulus, and it was annexed in 72. Before AD 39 it names Polemon I and Pythodoris, but Archelaus held Lesser Armenia until AD 17, and no source names its holder from then until 38 (H2, H3).
  - **Fix:** give static labels a hover text of just "Armenia Minor", or none, with no kind, ruler or years.
- **P4-F3. The full browser suite.**
  - Run 39236208206 on `552dcfb` fails at `verify-web-export-playwright.mjs:5250`: "Expected holder tooltip with years, got ''." The same suite passed on the base `d287cd0` (run 39234804359), so M5-11 caused it.
  - The check opens AD 44 at the default desktop view (zoom 4.7, centred on 22.5°E 35°N). It takes the first label MapLibre reports in `ibm-ancient-holder-label`, the layer for labels that can't be clicked, and moves the mouse to that label's point.
  - In the AD 44 payload built in this worktree from `552dcfb` (`app/public/generated/ancient.stop.agrippa-i-dies.json`), only one such label is drawn below zoom 5: the new "PROVINCE OF MAURETANIA CAESARIENSIS", from zoom 4, because its holder has no place record. Its point, 1.79°E 35.08°N, lies about 46 px left of a 1,440-px window with no panel open, or under the panel if one is open.
  - Part of its text is on screen, so MapLibre reports it, but the mouse can't reach its point, so the tooltip stays empty. Before this PR no such label was drawn at that view, so the check found none and skipped the hover. "Armenia Minor" starts at zoom 5, so P4-F2 isn't the cause. I worked this out from the payload and the code, without a browser.
  - **Fix:** make the check pick a label whose point is on screen and outside the panels, or hover a named label at a set view. Then get the suite green.
- **P4-F4. Provenance wording.**
  - (a) E1's `described-line` detail on `pontus` and `cappadocia` lacks G1's clause "the Barrington Atlas's two places for Dasmenda lie inside Cappadocia". Without it, "names no point on it that can be located" overlooks Dasmenda, which Strabo does name.
  - (b) `pontus`'s first change lacks E2's clause: its west edge follows the Halys, Paphlagonia's eastern boundary (Strabo 12.3.9; ISBE "Pontus").
  - (c) The Ampsaga label ("The Ampsaga's mouth (Pliny 5.1, Tucca; Smith, 'Ampsaga'); inland, AWMC's line") sits only on `mauretania-caesariensis`, whose nearest vertex to the river's mouth is 172 km away. Add it to `mauretania-caesariensis-east`, which holds the mouth, 0.76 km away.

### Items for the PO
1. **The research note.** Your answers say F1–F17 were applied to it in this PR, but `docs/research/M5-ancient-lands.md` is unchanged since `aba7023`. It still says, for example, that Dasmenda is "identified with high confidence".
2. **`BACKLOG.md`.** It has neither Sophene (ruling 2) nor Tavium and the Trocmi's land (your answer 3).
3. **Screenshots, after P4-F1 and P4-F2:**
   - zooms 5–7 around Pontus: check that "ARMENIA MINOR" and "KINGDOM OF PONTUS" don't hide each other, and that the `pontus` record's own label is hidden while the kingdom holds the area;
   - Mauretania's coast at −4, 41 and 44.
4. **Size.** CI's "build" job (lint, type-check, tests, `validate:data`, `build:data`, export) passes, and the layer totals 318,111 bytes gzip of the new 330,000: 125,448 for the shapes and 145,017 for the 15 stops.
5. **`docs/BUDGET.md`.** The rebase dropped this branch's three ledger rows: the Research Lead's phase 1 (`c7b706c`, about 8,400 credits), my phase 2 (`5683700`, about 1,900) and the GIS Engineer's phase 3 (`bc631f0`, about 1,100). Their rebased commits `aba7023`, `aa8035f` and `1627d49` no longer touch the file. `git show <old SHA> -- docs/BUDGET.md` still has each row. I added this phase's row after the last one and left the restoring to you. The month total also skips about 7,200: M5-10's row added its credits to 282,303, not to the 289,503 above it.

### Checks (phase 4)
- **Run:** read-only Node scripts on 2026-10-19 with Node 24.21.0 and the root `node_modules`, plus mapshaper on the pinned AWMC zip.
- **Read:** CI results through `gh`, and the stop payloads already built in this worktree after `552dcfb` (`app/public/generated/`, not committed; I didn't build them). They match the committed areas: 28 areas, with 73 parts of `other-roman-lands`.
- **Not run:** no build, browser or test suite, as the PO asked. Nothing in data or code changed in this commit.

## Phase 4 re-check and sign-off
- **Date:** 2026-10-19 · **Verifier:** fact-checker (Claude Opus 5.5).
- **Checked:** the GIS Engineer's `ee44057` (P4-F1 to P4-F4) and the Research Lead's `6e56ccc` (the note's F1–F17), on head `ee44057` (draft PR #77). I compared the areas with `552dcfb`'s.
- **Method:**
  - Node and Python scripts over the committed data: a part-by-part diff of every area and its provenance, and strict point-in-polygon tests.
  - Distances to AWMC's lines 609 and 610 and its AD 14 outline, from the build's cached inputs. A 0.005° raster against Natural Earth's 10m land along the Mauretanian coast.
  - The stop payloads built in this worktree from `ee44057`'s tree (`app/public/generated/`, 05:59–06:00). Their part and vertex counts match the committed areas. I didn't build them.
  - CI on #77 through `gh`, read-only. No build, browser or test run.

**Result: the four fixes are verified, and I sign off on the data.** The full browser suite still fails, now at a later check (R1). The note has two leftover sentences to fix (R2, R3).

| Item | Verdict | Evidence |
|---|---|---|
| P4-F1, the coastal slivers | Verified | `other-roman-lands` has 66 parts again, each byte-identical to one it had before; only the seven slivers are gone. Parts 44–46 went to Tingitana, 47 and 48 to Caesariensis, and 49 and 50 to the strip. The three areas are still single polygons, and nothing overlaps. In the built stops the only Mauretania borders are M-a, M-b and M-c, as in G1, and `mauretania-tingitana` borders `other-roman-lands` nowhere. A guard now fails the build if a coastal part under 50 km² comes back. See N1 and N2. |
| P4-F2, the "Armenia Minor" tooltip | Verified | The static label carries `tooltipText: "Armenia Minor"`, and the map uses it in place of a kind, ruler and years. All 15 built stops have it, from zoom 5. |
| P4-F3, the hover check | Verified | `mauretania-caesariensis`'s label now starts at zoom 5, for the kingdom before 40 and the province from 42. In the built stops no label that can't be clicked starts below zoom 5, so at the opening zoom (4.7) the check finds none and skips, as on the base. Every border at every stop still starts at zoom 5. CI's run on `ee44057` got past line 5250 but failed later (R1). |
| P4-F4, provenance | Verified, with a note | (a) E1's detail on `pontus` and `cappadocia` has the Dasmenda clause (see N3). (b) `pontus`'s first change has the Halys clause, with `bib:strabo-geography` and `bib:isbe-pontus`, which resolves. (c) The Ampsaga clause is on `mauretania-caesariensis-east`. `mauretania-caesariensis` keeps line 609 and its sources in its first change. Nothing else in the provenance changed, apart from `other-roman-lands` counting the 114 coastal pieces it gave up. |
| G8's points | Verified | Tingi, Volubilis, Rusaddir, Siga, Cartenna, Saldae, Igilgili, Sitifis and Cirta lie strictly in their areas. `pontus` and `cappadocia` didn't change shape. |
| The layer's size | Verified | 313,550 bytes gzip (Node, level 9) across the 20 built `ancient.*` files: 123,682 for the shapes and 142,222 for the 15 stops. The budget is 330,000. |
| The note against F1–F17 | Verified, with 2 fixes | F1–F9, F11, F12 and F14–F17 are applied. F10 and F13 each leave one sentence (R2, R3). |

**Sign-off.** I sign off on M5-11's data and text, which pass G1–G8 (ruling 6). This covers the areas and edges, the provenance, the holders at every stop, the timeline entries, the stop summaries and place notes, the bibliography, the popover's note, the Pleiades IDs and the "Armenia Minor" label.
- Not covered: the full browser suite (R1), which must pass before merging, and the note's two sentences (R2, R3), which change no data.
- The eight records whose `politicalHistory` changed (phase 4, item 9) are already `status: "verified"`. Their `lastReviewed` still reads 2026-10-08, since this commit changes docs only, as asked.

### To fix
- **R1. The full browser suite (front end; blocks merging, not the data).**
  - Run 39257308450 on `ee44057` fails in `verifyExpandedAttributionAboveTimeline` (line 11707). A tap on the attribution button times out because the "Modern" button of the "Map type" switch intercepts it. This check never ran on `552dcfb`, whose run stopped at line 5250, and it passed on the base `d287cd0`.
  - It is a phone tap. Of the check's phone scenarios, only "phone-sources-open-390x844" shows text this PR changed: AD 44 with the Sources popover open.
  - The popover sits inside the timeline card with no height limit, and the attribution button sits 8 px above the card. This PR lengthens AD 44's summary (566 → 681 characters) and adds a sentence to the note. So the card most likely now reaches the switch at the top right. I inferred this from the code and the texts, without a browser.
  - **Fix:** cap the popover's height on small screens and let it scroll, or keep the attribution button below the switch. The verified texts don't need shortening.
- **R2. The note, §4.10's confidence sentence (Research Lead).**
  - It says Saldae "sits about 90 km east of where AWMC's own pre-42 extent ends the kingdom". That distance is about 105 km: 104.5 km from the AD 14 edge's coastal end (3.904°E 36.913°N) to Saldae (`pleiades:305142`). M7 and the drawn provenance say about 110. 90 km is Saldae's distance from the Ampsaga.
  - The same sentence rates the river edges "medium-high". G1 rates M-a medium, and M-c medium on the coast and low inland; the data follows G1.
- **R3. The note, the "Pleiades" item under its sources (Research Lead).** It still calls the reference towns for this face (Amaseia, Neocaesarea, Nicopolis, Caesarea Mazaca) "correctly identified" Pleiades places "aside from the two id/coordinate mismatches below". The corrected list that follows shows all four IDs were wrong (`857036`, `857229`, `857238`, `628879`); this PR fixed them (G7).

### Notes, no fix required
- **N1. Where M-a meets the coast.**
  - Part 47 went wholly to Caesariensis, as my P4-F1 allowed. So M-a now reaches the coast at Cap de l'Eau (2.4166°W 35.1491°N), 7.5 km west of Natural Earth's mouth of the Moulouya (2.3406°W 35.1231°N). Before, it stopped 2.9 km from the mouth, with the sliver beyond it.
  - That is more than the 3.5 km simplification, on a medium-confidence edge drawn from zoom 5.
  - If wanted later: split part 47 at the river, for example by extending line 610 from its start (2.3933°W 35.0885°N) to that mouth, so the land west of the river goes to Tingitana.
- **N2. The coast.**
  - The three areas now follow Natural Earth's coast simplified at 3,500 m, instead of AWMC's coast plus the slivers. Within 6.7 km of the coast, land in no area grows by about 80 km², and sea inside the areas by about 300 km².
  - The composition report explains these as simplification slivers: 13 over 5 km² along these areas, 277 km² in all. It already accepts that kind across the layer (233 slivers, 3,744 km²).
- **N3. E1's wording (optional).** The new detail drops "names no point on it that can be located", but doesn't say that Strabo puts Dasmenda at the line's western end, so a reader can't tell why Dasmenda comes up.
  - Suggested: "…to the eastern end of Laviansene, with the stronghold of Dasmenda at its western end; the Barrington Atlas's two places for Dasmenda lie inside Cappadocia, so they cannot anchor that line."
  - My G1 also left the two Dasmenda IDs out of the sources. Adding `pleiades:619147` and `pleiades:628964` would give that clause a cited source.
- **N4. The hover check now tests nothing.** At the opening view it finds no label that can't be clicked at any stop, as on the base, so it passes without hovering. A later card could hover a named label at a set zoom.

### Checks (re-check)
- **Run:** read-only Node and Python scripts on 2026-10-19 with Node 24.21.0, plus mapshaper to clip Natural Earth's 10m land. The inputs are the build's cached copies, and Natural Earth's rivers came from its pinned commit `ca96624`.
- **Read:** CI on #77 through `gh` (run 39257308450 failed and 39257308475 passed), and the built payloads in `app/public/generated/`.
- **Not run:** no build, browser or test suite, as the PO asked. This commit changes docs only.
