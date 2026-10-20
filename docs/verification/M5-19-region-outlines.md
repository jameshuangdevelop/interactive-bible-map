# M5-19 verification — An outline for every region (phase 2)

- **Card:** `docs/tasks/M5-19-region-outlines.md`, phase 2 · **Branch:** `data/m5-19-region-outlines` (head `dcf41a2` when I started)
- **Checked:** the Research Lead's note `docs/research/M5-19-region-outlines.md` (`0ff1c13`) and the PO's answers in its §9 (`dcf41a2`), against ADR-0050, ADR-0048, ADR-0037 (items 1–3, border rules 1–5), ADR-0017 and ADR-0014, and the committed `data/geo/ancient-areas.geojson` (last changed in `7437ad0`), `data/geo/ancient-coastline.geojson`, `data/timeline.json` and `data/locations/`.
- **Verifier:** fact-checker (Claude Opus 5.5) · **Date:** 2026-10-20 · **Phase:** 2 (ADR-0014). This phase changes no data file, so no record's `status` changes. I check the GIS Engineer's outlines when phase 3 is done.

**Result: every region can be outlined, but 12 of the 18 need changes before the GIS Engineer draws them.** Six islands pass as the note describes them. No region is rejected outright; one proposed edge (Pisidia's south edge) and three claims are rejected, and the sources give the replacement in each case. Licensing passes.

ADR-0050 names **18** regions, not 20: 8 inside provinces, 3 beyond Rome's edge and 7 islands and parts. The note's "20 regions" (§1, §7) and "eight islands" (§2.2) are miscounts; its own tables list 18 and 7.

| Section | Verified | Fix needed | Rejected |
|---|---:|---:|---:|
| 1. Quotations and citations (43) | 20 | 21 | 2 |
| 2. "Already drawn" claims (11) | 9 | 1 | 1 |
| 3. Anchors and IDs (14) | 8 | 4 | 2 |
| 4. Regions (18) | 6 approved | 12 approved with changes | 0 |
| 5. The PO's answers (7) | 2 | 4 | 1 (premise) |
| Licensing (10) | 10 | 0 | 0 |

"Fix needed" means a clause is wrong, unsourced or overstated, or an instruction must change, and the source gives the fix. "Rejected" means the sources contradict the claim.

**The main findings:**
1. **Pisidia's south edge can't be the `galatia`/`pamphylia` border (rejected).** The drawn `pamphylia` area holds Pisidia's own point (60.7 km inside it) and Selge, Sagalassus, Cremna, Adada, Pednelissus, Amblada and Anabura; Termessus and Sinda lie in `lycia`. That border runs 29 km south of Antioch, north of every Pisidian city. The note's outline would hold none of them and not its own point. ISBE "Pisidia" gives the extent instead (§4.4).
2. **Anuath Borceos is located, and Acrabatta belongs to Judea.** Pleiades 687825 "Anouath Borkeos" (Barrington 70 G1; DARE 28321, Khirbet Berqit) lies at 35.2655°E 32.0954°N. Josephus (3.3.5) and Pliny (5.15) both count the Acrabatta toparchy in Judea, so the Samaria–Judea line must pass through Anuath and north of Aqraba, not along Aqraba's latitude. The PO's answer 3 rests on the opposite premise.
3. **Josephus gives Judea the coast "as far as Ptolemais"** (3.3.5, the sentence after the one the note quotes), while Pliny (5.14) calls the coast from Ascalon to Caesarea "the region of Samaria". Splitting the coast (answer 1) is a compromise that neither author states, so the notes must give both. The Judea polygon also holds the coast from Gaza to Rhinocolura, which Augustus gave to Syria (Josephus, *Antiquities* 17.11.4).
4. **Libya's west edge (answer 7) matches neither of Strabo's landmarks.** It meets the coast at 18.167°E 30.765°N. That is 158 km south-east of the Euphrantas Tower (Euphranta/Macomades, modern Sirte), the boundary "as it was under Ptolemy" (17.3.20), and 79 km north-west of the Altars of the Philaeni. The note's "the same western edge, in general terms" is wrong.
5. **The Pontus shape leaves out western Pontus.** The `bithynia` area holds "the AD69 face f0042's Pontic coast ... (5,091 km²)", with Amisus and Themiscyra, by an earlier ruling that coastal, western Pontus lies in Bithynia. `pontus.json` and ISBE count that land as Pontus. The note mentions only that the shape adds Armenia Minor.
6. **Iconium belongs to Phrygia in the sources the project follows.** ISBE "Phrygia" lists Iconium among Galatian Phrygia's cities, and ISBE "Lycaonia" says "The boundary of Phrygia and Lycaonia passed between Iconium and Lystra"; `phrygia.json` follows them. The note draws Phrygia "west of Iconium", following Strabo 12.6.1, without saying the sources disagree.
7. **Coropassus lies on the wrong side of the drawn line.** Strabo puts the Lycaonian–Cappadocian boundary between Coropassus (Lycaonian) and Garsaura (Cappadocian). Pleiades puts them 21.6 km apart, which matches Strabo's "about one hundred and twenty stadia", but the drawn `galatia`/`cappadocia` line leaves Koropassos 4.2 km inside Cappadocia. The note says the pair "is consistent with, and sharpens" that line (rejected).
8. **Mysia: three of its edges need changes.**
   - The Troad's inclusion is disputed, so that edge isn't "high confidence".
   - Prusa, a Bithynian city "on the Mysian Olympus" (Strabo 12.4.3), lies inside the `asia` area, so the `asia`/`bithynia` border can't be Mysia's edge.
   - The Caicus plain lies inside Mysia, so the river can't be its southern limit (12.8.1, 12.8.12).
9. **Mesopotamia and Parthia need other sources for their edges.**
   - Strabo 16.1.21 gives all four of Mesopotamia's edges, and the note doesn't cite it. Pliny's Oruros sentence (6.30) says the reverse of what the note reads into it.
   - Parthia's east edge "to the edge of the map's own frame" is undefined, because the app sets no frame. ISBE "Parthians" gives "to the confines of India and the Oxus".
10. **Two IDs are mislabelled.** `pleiades:678378` is Scythopolis, not Ginea, and `678326` is Pella, not Scythopolis; Ginea is `678163`. `pleiades:903080` is Media's label point, not Ecbatana, which is `903021`.
11. **The extractions hold.** Each region's own point lies in the part the note names. Galilee's part is Galilee alone (Perea is the other part). Cos's part is the island of Kos alone, with its western Kefalos end; the Cnidian peninsula is in the mainland part.

## Scope
- The note's claims about the 18 regions of ADR-0050, and the PO's seven answers in its §9.
- Not in scope: changes to existing areas and borders (the card's "Out of scope"). Where an existing area conflicts with a source, I list it for the PO (P9) and don't ask for a change.

## Method
1. **Texts, opened 2026-10-20:**
   - Josephus, *Jewish War* 3.3 and *Antiquities* 17.11.4 (Whiston, CCEL).
   - Strabo, *Geography* 10.4, 11.9, 11.13, 12.2, 12.3, 12.4, 12.6, 12.7, 12.8, 14.1, 14.2, 16.1 and 17.3 (Loeb, tr. Jones, LacusCurtius).
   - Pliny, *Natural History* 3.14, 5.4, 5.5, 5.14, 5.15, 6.29 and 6.30 (tr. Bostock and Riley, Perseus).
   - ISBE "Lycaonia", "Mysia", "Parthians", "Phrygia" and "Pisidia".
   - The WEB snapshot in `data/reference/engwebp_vpl.txt` for Acts 2:10, 14:6 and 16:7–8.
2. **Gazetteers:**
   - Pleiades' places dump (`pleiades-places-latest.csv.gz`, downloaded 2026-10-20), for every Pleiades ID the note cites and about 60 anchors.
   - Pleiades JSON for 687825, 687820 and 678163, and DARE's page and GeoJSON for 28321.
   - Wikidata's API for Q185318, Q374748, Q2918318, Q83241, Q1294629 and Q104028.
3. **Geometry:**
   - Small Node scripts with `@turf/boolean-point-in-polygon`, `nearest-point-on-line`, `distance` and `boolean-valid`, run against the committed `ancient-areas.geojson`.
   - For every part of `galilee-perea`, `asia`, `crete-cyrene`, `sicily`, `pontus` and `judea-samaria-idumea`: the bounding box, ring count, vertices and spherical area.
   - Every region's point, every child place's point and about 80 anchors, tested against every part, with distances to the edges.
   - A 0.02° grid over `bithynia` east of the lower Halys.

   I ran no build, test or browser suite (a docs-only phase). The scripts were scratch files outside the repository.

## Licensing
**Pass.** Every source is compatible with the code licence (MIT), the data licence (CC BY-SA 4.0) and `data/geo/` (ODbL 1.0). Nothing in the note is traced from a map.

| # | Source | Read at the source, 2026-10-20 | Verdict |
|---|---|---|---|
| L1 | Strabo, Loeb tr. Jones, LacusCurtius | Each of the 12 pages I opened says "The text is in the public domain" (Vol. V, 1928; Vol. VII, 1932, book 16; Vol. VIII, 1932, book 17) | PD, quotable |
| L2 | Pliny, tr. Bostock and Riley (1855), Perseus | 1855 imprint; existing ruling (M5-11) | PD, quotable |
| L3 | Josephus, Whiston (1737), CCEL | PD by date (existing ruling). The note says CCEL "states on its own site that it carries no copyright". I found no such statement on the pages I opened (`war-3.htm`, `JOSEPHUS.HTM`, the work page). That doesn't affect the ruling. | PD, quotable |
| L4 | ISBE (1915) | Existing ruling | PD |
| L5 | Pleiades | The JSON's `rights` field: "Sharing and remixing permitted under terms of the Creative Commons Attribution 3.0 License (cc-by)." | CC BY 3.0, already credited |
| L6 | Wikidata | Existing ruling | CC0 |
| L7 | DARE | Page for 28321: "license CC BY-SA 3.0" | Cross-check only (existing ruling). Pleiades 687825 has the same point, so cite Pleiades as the coordinate's source. Copy no DARE value into `data/geo/` (CC BY-SA 3.0 isn't a share-alike target of ODbL). |
| L8 | Livius (`bib:livius-mesopotamia`), HMML (`bib:hmml-contesting-shipwreck`) | Existing rulings | Cite-only. The note cites them without quoting, and the outlines' notes must not quote them either. |
| L9 | AWMC (through `ancient-areas.geojson`), Natural Earth (pinned commit `ca96624`), OpenStreetMap ways already in the areas | Existing rulings | ODbL 1.0; PD; ODbL 1.0 |
| L10 | The Barrington Atlas (used only through Pleiades' CC BY data), *The Sacred Bridge* (all rights reserved), Wikipedia maps | Not used for any line | The GIS Engineer must not trace them either (G0) |

**Output licence and attribution.**
- `data/geo/region-outlines.geojson` derives from `ancient-areas.geojson`, so it stays ODbL 1.0 (§4.4), and so does the generated app copy (LICENSES A3). The ancient layer's attribution string covers both (A1).
- No new `ATTRIBUTION.md` line is needed if phase 3 uses only these sources.
- If phase 3 uses Natural Earth's 10 m rivers or lakes (the Euphrates, the Tigris, the Aras, the Amu Darya, the Kızılırmak or the Caspian), widen the "use" column of the existing Natural Earth row. The licence and credit stay the same.

## 1. Quotations and citations

| # | The note's claim | What the source says | Verdict |
|---|---|---|---|
| Q1 | *War* 3.3.1, Galilee's neighbours, "quoted ... from the CCEL text" | Matches, with two silent corrections of CCEL's typos ("Ganlonitis", "hounded"). The ellipsis also drops "which mountain had formerly belonged to the Galileans, but now belonged to the Tyrians; to which mountain adjoins Gaba", which bears on Galilee's west edge (§4.2). | **Fix needed:** mark the corrections; restore the clause |
| Q2 | 3.3.4: Samaria "begins at a village ... called Ginea, and ends at the Acrabbene toparchy" | Verbatim | Verified |
| Q3 | 3.3.5: Anuath Borceos; Judea's "breadth is extended from the river Jordan to Joppa" | Verbatim. But the note stops before the next sentence: "Nor indeed is Judea destitute of such delights as come from the sea, since its maritime places extend as far as Ptolemais", which bears directly on its §8 question 1. | **Fix needed:** add it |
| Q4 | 3.3.5: the eleven portions, Idumea among them | Verified: Jerusalem, Gophna, Acrabatta, Thamna, Lydda, Emmaus, Pella, Idumea, Engaddi, Herodium, Jericho; "after them came Jamnia and Joppa". Acrabatta is a Judean toparchy (§4.1). | Verified |
| Q5 | Pliny 5.14: the coast passes through "the region of Samaria", Joppa and Caesarea | Verified: "Proceeding along the coast we come to the region of Samaria; Ascalo, a free town, Azotus, the two Jamniæ ... and Joppe ... Next to this place comes Apollonia, and then the Tower of Strato, otherwise Cæsarea ... the frontier town of Palæstina" | Verified |
| Q6 | "his next chapter (5.15) separately names 'Neapolis... Sebaste... and... Gamala'" | They are in 5.14: "In the interior of Samaria are the towns of Neapolis ..., Sebaste ..., and ... Gamala" | **Fix needed** (5.14) |
| Q7 | Pliny 5.15: Galilee, Perea, ten toparchies including Joppe and Acrabatena | Verbatim | Verified |
| Q8 | Pliny counts Idumea apart from Samaria and Judea | "Idumæa and Palæstina begin" (5.14); "Beyond Idumæa and Samaria, Judæa extends far and wide" (5.15) | Verified |
| Q9 | "Strabo names the Pisidian cities directly (12.7.2)" | "Artemidorus says that the cities of the Pisidians are ..." | **Fix needed:** Strabo, citing Artemidorus |
| Q10 | 12.7.3: "a shifting patchwork of independent, tyrant-ruled tribes" | "divided into separate tribes governed by tyrants"; "shifting" is the note's own word | **Fix needed** (nit) |
| Q11 | 12.6.4 places Antioch and "the Apollonias near Apameia Cibotus" "as the *northern* limit of the same district Amyntas once ruled together with Pisidia" | Amyntas held Antioch, "the country as far as the Apollonias near Apameia Cibotus" and Lycaonia. The Pisidians overran "this country, which belonged to the Phrygians and the Cilicians" (the Loeb critical note reads "Lycaonians"). That puts Antioch outside Pisidia, but Strabo doesn't call it a "northern limit". | **Fix needed** (wording) |
| Q12 | 12.6.1: the Lycaonian plateau, the two lakes, Iconium, the Taurus, Coropassus and Garsaura 120 stadia apart | Verbatim | Verified |
| Q13 | 12.6.2–3: Isauricê belongs to Lycaonia; Derbe "closer to Cappadocia than to any other country" | Verbatim | Verified |
| Q14 | "even Strabo's own two passages do not agree on which side of a line Orcaorci falls" (12.6.1 against 12.8.13) | 12.8.13: Greater Phrygia "leaves on the left Pessinus and the region of Orcaorci and Lycaonia". In §3.7 the note reads this same clause as putting Pessinus outside Phrygia. Read the same way, it puts Orcaorci outside too, beside Lycaonia, which agrees with 12.6.1. | **Rejected** |
| Q15 | 12.8.1, 12.8.2 and 12.8.12 on Mysia | Verbatim | Verified |
| Q16 | 12.8.8, "Troy is situated between Mt. Ida and the sea", making Ida the inland anchor of a "high-confidence" north-west edge that includes the Troad | Verbatim. But 12.8.12 says Mysia "lies between Mt. Ida and Catacecaumenê", so for Strabo the Troad lies outside Mysia. | **Fix needed** (§4.6) |
| Q17 | ISBE says Mysia's boundaries "were never clearly fixed" | ISBE: "Though its boundaries were always vague". "Never clearly fixed" is `mysia.json`'s paraphrase. ISBE adds: "on the North to the Sea of Marmora on the East to Bithynia and Phrygia, on the South to Lydia, and on the West to Hellespont. According to some authors it included the Troad." | **Fix needed** (quote ISBE) |
| Q18 | 12.8.12: Phrygia Epictetus's cities, "and also Cadi, which, according to some writers, belongs to Mysia" | Verbatim | Verified |
| Q19 | 12.8.13: Amorium, Synnada, Apameia, Laodiceia, Colossae and the others | Verbatim | Verified |
| Q20 | 12.8.14: Philomelium and "the Antiocheia near Pisidia" border Phrygia Paroreia | Verbatim | Verified |
| Q21 | Strabo places Pessinus and Ancyra outside Phrygia "(12.8.13)" | 12.8.13 names Pessinus only | **Fix needed:** cite a passage that names Ancyra, or drop it |
| Q22 | Phrygia's west edge is "the Maeander river itself" (12.8.15) | Strabo: the Maeander "flows for a time through Phrygia and then forms the boundary between Caria and Lydia". That makes it a Phrygian river, not Phrygia's edge. The note misses 12.8.17: "Carura forms a boundary between Phrygia and Caria." | **Fix needed** |
| Q23 | "the disputed Mt Sipylus/Catacecaumene zone ... (12.8.2)" | 12.8.2 is about Sipylus. Catacecaumenê, "by some called Mysian and by others Maeonian", is 12.8.12. | **Fix needed** (citation) |
| Q24 | 12.2.10, quoted as "from the western extremities of Chammanene... to the eastern extremities" | Strabo: "which has its beginning at the western extremities of Chammanenê ... and extends to the eastern extremities of Laviansenê" (verified word for word in M5-11 Q1) | **Fix needed** (nit: the quotation marks hold words Strabo doesn't use) |
| Q25 | 11.13.2, 11.13.3 and 11.13.6, with Strabo's list "with the west and north sides swapped" against Pliny's | The quotations are verbatim. The difference isn't loose compass sense. 11.13.6 bounds Greater Media, which Strabo (11.13.1) calls one of Media's two parts, the other being Atropatene. Pliny's list (6.29) covers Media as a whole, "both kingdoms into which it is divided". | **Fix needed** (§4.9) |
| Q26 | Pliny 6.29: "on the west, Adiabene" | Bostock and Riley print "Adsiabene" | **Fix needed** (nit) |
| Q27 | Pliny 6.29: the eighteen kingdoms, the Higher and Lower provinces, "bounded" by the Euphrates | Verbatim ("By these nations and the river Euphrates are the Lower kingdoms of Parthia bounded") | Verified |
| Q28 | Strabo 11.9.2: "lords of the whole country inside the Euphrates"; "a part of Bactriana" | Verbatim | Verified |
| Q29 | Pliny 6.30's Oruros is "a direct statement that the Euphrates, at Zeugma, was the recognised edge between Roman and non-Roman territory" | Pliny reaches Oruros "going eastward" from Apamea on the Zeugma, and puts it "distant from Zeugma two hundred and fifty miles". So under Pompey, Rome's limit lay well east of the Euphrates. The Euphrates edge has its own source: Strabo 16.1.28, "The Euphrates and the land beyond it constitute the boundary of the Parthian empire". | **Rejected** (cite 16.1.28 and 11.9.2) |
| Q30 | Mesopotamia's east edge is "the Tigris and its tributaries, named by Pliny as the Zerbis/Lycus" (6.30) | Pliny names the rivers of peoples beyond the Gordyaei: "the river Zerbis, which falls into the Tigris" and "the river Lycus on its passage from Armenia". They aren't edges of Mesopotamia. Strabo 16.1.21 gives the edges outright: "it lies between the Euphrates and the Tigris; and the Tigris washes its eastern side only, whereas the Euphrates washes its western and southern sides; and on the north is the Taurus, which separates Armenia from Mesopotamia." | **Fix needed:** cite 16.1.21 |
| Q31 | 16.1.1 adds "the Gordyaean mountains ... as the northern limit" | 16.1.1 lists the peoples that the name "Assyria" covers ("the tribes of Mesopotamia in the neighbourhood of the Gordyaeans ... as far as the Zeugma of the Euphrates"). It gives no limit. | **Fix needed:** use 16.1.21 |
| Q32 | 17.3.20: the Euphrantas Tower is "the same western edge, in general terms" as the drawn one | The quotation is verbatim. The same sentence goes on to Charax, "the Altars of the Philaeni" and Automala. For the edge claim, see §2 (C10). | **Fix needed** |
| Q33 | 10.4.2–4: Crete's two ends, its length and its mountains | Verbatim | Verified |
| Q34 | 14.1.3: Chios and Samos among the Ionian foundations | Verbatim | Verified |
| Q35 | 12.8.6: "Rhodes and Cos were already inhabited by Greeks before the Trojan War" | Verbatim | Verified |
| Q36 | Pliny 3.14: "Towards Africa, its islands are Gaulos, Melita, 87 miles from Camerina ..." | Verbatim | Verified |
| Q37 | 14.2.5, the city of Rhodes | Verbatim | Verified |
| Q38 | `bib:isbe-parthians` is cited, but the note says no source gives the east edge | ISBE: "This empire stretched from the Euphrates to the confines of India and the Oxus" | **Fix needed:** use it (§4.11) |
| Q39 | `bib:isbe-pisidia` is cited for Antioch only | ISBE: Pisidia is "the huge block of mountain country stretching northward from the Taurus range where the latter overlooked the Pamphylian coast land, to the valleys which connected Apamea with Antioch, and Antioch with Iconium. It was bounded by Lycia on the West, by the Phrygian country on the North, and by Isauria on the East; but ... the frontier was never strictly drawn." | **Fix needed:** use it (§4.4) |
| Q40 | `bib:isbe-lycaonia` is cited, but its boundaries aren't used | ISBE: "bounded on the North by Galatia proper ..., on the East by Cappadocia, on the South by Cilicia Tracheia, and on the West by Pisidia and Phrygia. The boundary of Phrygia and Lycaonia passed between Iconium and Lystra". Lycaonia Antiochiana "included the important city of Laranda". | **Fix needed:** use it (§4.5) |
| Q41 | Phrygia's edge runs "west of Iconium", "since Strabo counts Iconium among Lycaonia's own towns" | Strabo 12.6.1 does mention Iconium in his Lycaonia chapter. But ISBE "Phrygia" says Galatian Phrygia's "important cities were Antioch, Iconium and Apollonia", ISBE "Lycaonia" agrees (Q40), and `phrygia.json` follows ISBE. The note picks one side without saying the sources differ. | **Fix needed** (§4.7) |
| Q42 | Acts 2:10, "the parts of Libya around Cyrene"; Acts 14:6 | Both match the WEB snapshot exactly | Verified |
| Q43 | (Used by this report) Josephus, *Antiquities* 17.11.4, which the `judea-samaria-idumea` provenance cites | "as to Gaza, and Gadara, and Hippos, they were Grecian cities, which Caesar separated from his government, and added them to the province of Syria" | Verified |

## 2. The "already drawn" claims
Point in polygon against every part of every area. "Area" is the part's spherical area. Every part named below has one ring and passes `@turf/boolean-valid`.

| # | Claim | Finding | Verdict |
|---|---|---|---|
| C1 | Galilee is `galilee-perea` part 0, and that part is Galilee, not Perea | `galilee.json`'s point [35.3, 32.9] lies in part 0 (lon 34.956–35.650, lat 32.460–33.374; 2,779 km²). Perea is part 1 (lat 31.557–32.473; 2,209 km²), which holds the first candidate of Bethany beyond the Jordan. Part 0 holds Nazareth, Capernaum, Chorazin, Magdala, Nain and Cana's first two candidates. Ptolemais, Tyre and Kadasa (Kedesh, `pleiades:678215`) lie in `syria`. Caveats in §4.2. | Verified |
| C2 | Chios is `asia` part 2 | Lon 25.833–26.164, lat 38.159–38.604; 861 km²; one island | Verified |
| C3 | Cos is `asia` part 4, and the Cnidian peninsula must not be swept in | Part 4: lon 26.923–27.356, lat 36.679–36.908; 292.5 km²; holds Kos town and Kefalos, Kos's western end. Knidos (`cnidus.json`, 27.375°E) and the Datça peninsula lie in part 0. Taking part 4 whole gives the island alone. The provenance's "Adds western Cos, the Cnidian peninsula (Datça)" names two pieces, western Kos (now in part 4) and the peninsula (now in part 0). The note's "Cos's western neighbour, the Cnidian peninsula" misreads this: the peninsula lies east of Kos. | Verified (note's wording: fix) |
| C4 | Rhodes is `asia` part 5 | Lon 27.684–28.240, lat 35.890–36.456; 1,428.6 km² | Verified |
| C5 | Samos is `asia` part 1 | Lon 26.580–27.065, lat 37.645–37.815; 469.6 km² | Verified |
| C6 | Malta is `sicily` part 1 | Lon 14.323–14.563, lat 35.801–35.993; 258 km²: the island of Malta alone. Gozo (Pliny's Gaulos) and Comino are drawn in no area. The Mljet candidate [17.535, 42.745] lies in no area. | Verified |
| C7 | Crete is `crete-cyrene` part 0 | Lon 23.518–26.321, lat 34.932–35.687; 8,262 km². Lasea and both Phoenix candidates lie inside. Fair Havens (0.42 km) and Cape Salmone (0.08 km) fall just outside the simplified coast. Cauda (`cauda.json`, `parentId: crete`) lies 39.9 km south and in no area. | Verified |
| C8 | Libya is `crete-cyrene` part 1 | Lon 18.167–22.847, lat 29.632–32.938; 77,309 km². Darnis (`pleiades:373780`) lies inside. | Verified |
| C9 | Pontus can reuse the `pontus` area, a single Polygon at lon 34.39–40.65 and lat 39.17–41.34 | Verified, with 76,006 km². The area holds `pontus.json`'s point and Pleiades' Pontus label point (857287). `data/timeline.json` has `pontus-kingdom` (`locationId: pontus`) from -36 to 64 and `galatia-province` from 64 to 101; the first stop after 64 is 67; `pontus.json` has no `politicalAreaId`. | Verified |
| C10 | Libya's drawn west edge matches Strabo's Euphrantas Tower "in general terms" (answer 7) | The face's west edge meets the coast at 18.167°E 30.765°N, then runs inland to 18.272°E 29.946°N. That is 158.3 km from Euphranta/Macomades (`pleiades:363959`, 16.588°E 31.205°N, modern Sirte), Strabo's boundary "as it was under Ptolemy". It is also 79.2 km north-west of the Altars of the Philaeni (`pleiades:363924`, 18.788°E 30.294°N), which the drawn Cyrenaica includes. Charax (`pleiades:363951`), between the two in Strabo's order, lies 109 km outside. The edge is AWMC's AD 69 face (rule 3), and no source in the bibliography puts the first-century line there. | **Rejected** (§4.13) |
| C11 | The reused Pontus shape shows "a little more land than 'Pontus' in the narrowest sense — Armenia Minor's own share too" | That is true, but the shape also shows less. `bithynia`'s provenance adds "the AD69 face f0042's Pontic coast east of it (5,091 km²), per the research note's ruling that coastal, western Pontus lies in Bithynia". Amisus (`pleiades:857024`) and Themiscyra (`857350`) lie there, outside the reused shape. | **Fix needed** (§4.8) |

## 3. Anchors and IDs
Pleiades representative points; distances are great-circle.

| # | Claim | Finding | Verdict |
|---|---|---|---|
| A1 | `pleiades:678378` is Ginea (Jenin) | Pleiades: "Scythopolis/Nysa", 35.5031°E 32.5037°N. The area's provenance cites it correctly, for Scythopolis. | **Fix needed** |
| A2 | `pleiades:678326` is Scythopolis | Pleiades: "Pella/Berenice/Philippeia", 35.6149°E 32.4495°N, the anchor of Perea's northern line | **Fix needed** |
| A3 | Ginea is `wikidata:Q374748` | Q374748 is Jenin (35.3°E 32.4611°N, P1584 = 678163). `pleiades:678163` "Ginai(a)/Gema" (Barrington 69 B5; it cites Q374748) is 0.25 km from it. | Verified; add `pleiades:678163` |
| A4 | `pleiades:697728` is Philadelphia | "Amman/Philadelpheia" | Verified |
| A5 | `wikidata:Q185318` is Mount Carmel | Two P625 points (35.0233, 32.6725 and 35.0315, 32.7206); P1584 678084 | Verified |
| A6 | `wikidata:Q2918318` is Aqraba, with the alias "Akrabatta (name in antiquity)" | The alias and the point (35.3436°E 32.1264°N) are confirmed. `pleiades:687820` "Akraba" (Barrington 70 G1; *TIR Iudaea* 56–57) is 0.11 km away, so two sources agree. | Verified; add `pleiades:687820` |
| A7 | "'Anuath Borceos' itself has no confident modern identification that this research found" | `pleiades:687825` "Anouath Borkeos" (Barrington 70 G1; *TIR Iudaea* 63–64), association "certain", at 35.2655°E 32.0954°N (Pleiades gives 10 km accuracy). DARE 28321, "Anouath Borkeos, Khirbet Berqit", has the same point, precision 2 km; DARE takes it from the same tradition, so it isn't fully independent. It lies 8.1 km west-south-west of Akraba. | **Rejected** |
| A8 | Selge 639100, Sagalassus 639087, Termessus 639139, Cremna 638814 | All four are right | Verified |
| A9 | Koropassos 619194; Strabo's pair "is consistent with, and sharpens, this same stretch of the already-drawn line" | The ID and point are right. Koropassos lies **4.16 km inside `cappadocia`**, and Garsaura (619164) 18.9 km inside it. The two are 21.6 km apart, which matches Strabo's "about one hundred and twenty stadia". The drawn line puts Strabo's Lycaonian village in Cappadocia. | **Rejected** (the consistency claim) |
| A10 | Cyzicus 511218 and Zeleia 511461 lie "on the Propontis shore" | The IDs are right, but Zeleia lies inland | **Fix needed** (nit) |
| A11 | Dorylaeum 609367, the Caicus 550491, Ancyra 619103, Synnada 609538 | All right; the Caicus's point is the river's representative point | Verified |
| A12 | "Ecbatana (`pleiades:903080`, already the region's own coordinate in `media.json`)" | 903080 is "Media/Mad(aya) (region)", a label point, as `media.json` says. Ecbatana is `pleiades:903021`, at 48.5164°E 34.8056°N, 46 km away. | **Fix needed** |
| A13 | Tyana 648801, Garsaura 619164, Lake Tatta 619268 (the existing line's anchors) | All right | Verified |
| A14 | The records' own IDs: 857287 Pontus, 589748 Creta, 373777 Cyrenaica, 462311 Melita, 197376 Melite (Mljet), 44836840 Samaria | All right; `media.json`'s, `crete.json`'s and `libya.json`'s points equal Pleiades' | Verified |

## 4. Region by region
Each outline's `confidence` must be one of the schema's values (`high`, `medium`, `low`), not the note's "medium-high" or "low-medium". The per-edge detail goes into its note. "G" items are instructions for the GIS Engineer.

### 4.1 Samaria: approved with changes
- **Holds:** the north edge (the Galilee/Samaria line through Carmel, Ginea and Scythopolis), the east edge (the Jordan) and the coast are already drawn as edges of `judea-samaria-idumea`. Josephus says Samaria "begins at" Ginea; the drawn line passes through Ginea's anchor, and Pleiades' point lies 0.15 km on Galilee's side. At this scale that doesn't matter.
- **G1.1 The Samaria–Judea line (replaces the note's line along about 32.13°N).** Josephus counts Acrabatta among Judea's toparchies (3.3.5), and so does Pliny ("Acrabatena", 5.15). Josephus names Anuath Borceos as Judea's northern boundary, and Pleiades locates it (A7). Build straight segments:
  1. Start at the coast at 32.0954°N.
  2. Go due east to Anouath Borkeos (`pleiades:687825`, 35.2655°E 32.0954°N).
  3. Go to 35.3125°E 32.1704°N, midway between Akraba (`pleiades:687820`, Judea) and Sychem (`pleiades:678403`, Samaria).
  4. Go due east to the area's Jordan edge.

  This puts Akraba 4.8 km on Judea's side, Sychar and Sychem about 10 km on Samaria's side, and Joppa in Judea, as Josephus and Pliny 5.15 have it. Judea's outline uses the same line.
- **G1.2 The note** gives the coast as both authors describe it. Josephus gives Judea's breadth "from the river Jordan to Joppa" and says that "its maritime places extend as far as Ptolemais". Pliny calls the coast from Ascalon to Caesarea "the region of Samaria" (5.14) but lists Joppa among Judea's toparchies (5.15). The map splits the coast along the Samaria–Judea line as a convention (answer 1). The note also names Anuath Borceos (Khirbet Berqit, located by Pleiades and DARE) and says the line between the named places is approximate.
- **Confidence:** medium (the south edge is low). **Sources:** `bib:josephus-jewish-war`, `bib:pliny-natural-history`, `pleiades:687825`, `pleiades:687820`, `wikidata:Q2918318`, `pleiades:678403`, `pleiades:678163`, `wikidata:Q374748`, `pleiades:678378`, `wikidata:Q185318`, `bib:isbe-en-gannim`, plus the Jordan's OSM relation as in the area.

### 4.2 Galilee: approved with changes (note and confidence only)
- **Holds:** take `galilee-perea` part 0 whole (C1). Its north-west edge agrees with Josephus: Baka (Baca, `pleiades:678046`) lies 0.5 km inside, and Kadasa 2.3 km outside (M4-03 verified this).
- **G2.1 Confidence medium, not high.** Josephus names neighbours, not a line, and the shape is approximate in three places:
  - **West:** the edge runs through Mount Carmel's eastern end and Gaba (Wikidata's Carmel point lies 0.42 km inside). Josephus says Carmel "had formerly belonged to the Galileans, but now belonged to the Tyrians".
  - **South:** the edge runs through Scythopolis, which Josephus names as Galilee's neighbour; its point lies 0.41 km inside.
  - **North-east:** a tongue reaches 33.374°N (Iyyon, `pleiades:678209`, lies 1.5 km inside). It follows AWMC's outline of Herod's kingdom and a straight connector to the Jordan's source, and no Josephus line supports it.

  The note says so. It also says the outline holds the lake's western half only, since the area splits the lake along a median.
- **G2.2** Cite the IDs with their right names (A1–A3).
- **Child places:** the Sea of Galilee's label point lies 0.92 km beyond the median, in Philip's land. Cana's third candidate (Qana) lies 18.8 km outside, in `syria`; `cana.json` already rates it low and notes that John sets Cana in Galilee. Neither needs a change.
- **Confidence:** medium. **Sources:** `bib:josephus-jewish-war`, `bib:isbe-en-gannim`, `wikidata:Q185318`, `wikidata:Q374748`, `pleiades:678163`, `pleiades:678378`, plus the area's OSM river sources.

### 4.3 Judea: approved with changes
- **Holds:** south of G1.1 to the polygon's southern tip, with Idumea, which Josephus counts among Judea's eleven portions (answer 2).
- **G3.1 Leave out the AD 69 coastal face between Rhinocolura and Gaza** (1,570 km², with Raphia; the `ruling` entry in the area's provenance). Augustus added Gaza to the province of Syria (Josephus, *Antiquities* 17.11.4), and Pliny puts Rhinocolura, Raphia and Gaza in "Idumæa and Palæstina" (5.14). Neither author counts them in Judea, and the face is already a known piece, so no line has to be invented. If Gaza's own site (`pleiades:687902`) still lies inside after the cut, the note says that Gaza's district isn't drawn separately.
- **G3.2 The note** says:
  - Josephus counts Idumea in Judea; Pliny counts it apart (5.14–15).
  - The coast follows G1.2.
  - Ascalon, "a free town" (Pliny 5.14), isn't drawn separately.
- **Confidence:** medium. **Sources:** `bib:josephus-jewish-war`, `bib:josephus-antiquities`, `bib:pliny-natural-history`, `pleiades:687825`, `pleiades:687820`, `pleiades:678403`.

### 4.4 Pisidia: approved with changes (the note's south edge is rejected)
- **The problem (§2, finding 1):**
  - Pisidia's own point lies 60.7 km inside `pamphylia`. So do Sagalassus (37.0 km), Selge (40.7 km), Cremna (53.3 km) and Adada (53.0 km), with Pednelissus, Amblada and Anabura.
  - Termessus and Sinda lie in `lycia`.
  - The `galatia`/`pamphylia` border passes 29.2 km south of Antioch.
  - `data/timeline.json` already says the `pamphylia` shape "likely also covers southern Pisidia".
- **G4.1 Edges.** They come from ISBE "Pisidia" (Q39) and Strabo 12.7.1–2 and 12.8.13–14. Each runs equidistant between the anchors on its two sides.

  | Edge | Inside Pisidia | Outside |
  |---|---|---|
  | South: the Taurus front above the Pamphylian plain | Termessos 639139, Pednelissos 639046, Selge 639100 | Attalia (`attalia.json`), Perge 639048, Sillyon 639109, Aspendos 638776, Side 639105 |
  | North: ISBE's valleys from Apamea to Antioch and Antioch to Iconium | Sagalassos 639087, Kremna 638814, Adada 638733, Anaboura 638742, Amblada 638741 | Apamea 638751, Apollonia/Sozopolis 638758, Antioch (`antioch-pisidia.json`), Philomelion 609501, Iconium 648647 |
  | East: Isauria | Amblada | Isaura Vetus 648652, Isaura Nova 648651 (Lycaonian: Strabo 12.6.2); ISBE says the frontier "was never strictly drawn" |
  | West: Lycia and Milyas | Termessos, Sinda 639111 | The Kibyratis (638918) and Milyas (638996) label points |

  The outline crosses `galatia`, `pamphylia` and `lycia`, as Phrygia's crosses provinces (answer 5). It doesn't change with Vespasian's AD 74 reassignment, which moved no edge of the region.
- **Confidence:** low. **Sources:** `bib:strabo-geography`, `bib:isbe-pisidia`, `bib:isbe-phrygia`, and the Pleiades IDs above.

### 4.5 Lycaonia: approved with changes
- **G5.1 East:** where Strabo's boundary lies east of the drawn `galatia`/`cappadocia` line, run the edge equidistant between Koropassos (in) and Garsaura (out) (Strabo 12.6.1; A9). Elsewhere use the drawn line, which keeps Tyana and Garsaura out.
- **G5.2 West:** the edge passes between Iconium (out, Phrygian) and Lystra (in), as ISBE "Lycaonia" says. It then turns north on Iconium's east side, so that Iconium stays out and the record's point (33°E 38°N, about 47 km east-north-east of Iconium) stays in. Amblada stays out (Pisidian). The note's "Iconium in the east" is wrong: Iconium lies at Lycaonia's western edge.
- **G5.3 South:** the Taurus and Cilicia Tracheia (Strabo 12.6.1; ISBE). The Isauras and Derbe are in (Strabo 12.6.2–3); Isaura Vetus lies in the drawn `pamphylia` area. Laranda (`pleiades:648693`, in `cilicia-tracheia`) is out, because ISBE puts it in Lycaonia Antiochiana, which `lycaonia.json` excludes.
- **G5.4 North:** Galatia proper (ISBE); no source draws a line.
- **Confidence:** low. **Sources:** `bib:strabo-geography`, `bib:isbe-lycaonia`, `scripture:Acts 14:6`, `pleiades:619194`, `pleiades:619164`, `pleiades:648699`, `pleiades:648647`, `pleiades:648651`, `pleiades:648652`, `pleiades:648620`, `pleiades:648693`.

### 4.6 Mysia: approved with changes
- **G6.1 North and west:**
  - Follow the Propontis and Hellespont coasts, with the Troad included. ISBE says "According to some authors it included the Troad", and `assos.json` and `adramyttium.json` are parented to `mysia`.
  - This edge is not "high": the note says Strabo's Mysia "lies between Mt. Ida and Catacecaumenê" (12.8.12) with Troy "between Mt. Ida and the sea" (12.8.8), and that `troas.json` is parented to `asia`.
  - Cyzicus, Miletopolis (511318) and Apollonia ad Rhyndacum (511151) are in. Strabo 12.8.11 gives the Cyzicenes "a considerable territory extending as far as Lake Miletopolitis and Lake Apolloniatis itself".
- **G6.2 East:** Prusa (`pleiades:511384`) is out. Strabo 12.4.3 says "Prusa is situated on the Mysian Olympus; ... borders on the Phrygians and the Mysians", and in 12.4.10 the Mysians round Olympus lie "to the south of the Bithynians". Don't use the `asia`/`bithynia` border, which runs north of Prusa and Mt Olympus.
- **G6.3 South:** the Caicus plain is in, with Pergamon (`pergamum.json`) and Teuthrania (`pleiades:550916`). Strabo's Mysia reaches "the country in the neighbourhood of the Caïcus River and Pergamenê, extending as far as Teuthrania and the outlets of the river" (12.8.1).
- **G6.4 South-east:** Kadoi (`pleiades:609420`) lies on the edge (Strabo 12.8.12: "according to some writers, belongs to Mysia"), and Catacecaumenê (`pleiades:609427`) at the corner.
- **Confidence:** low. **Sources:** `bib:strabo-geography`, `bib:isbe-mysia`, `scripture:Acts 16:7`, `scripture:Acts 16:8`, and the Pleiades IDs above.

### 4.7 Phrygia: approved with changes
- **G7.1 South-east:** Iconium is in (Q41), and the edge with Lycaonia is G5.2's. The note says that Strabo describes Iconium in his chapter on Lycaonia (12.6.1).
- **G7.2 East:** west of Pessinus (`pleiades:609500`) and Gordion (`609393`), which are Galatian. Amorion (`609302`) and Philomelion are in (12.8.13–14).
- **G7.3 South:** the same edge as Pisidia's north edge (G4.1); Antioch, Apollonia and Apamea are in.
- **G7.4 South-west:** the edge passes through Karoura (`pleiades:638901`), since "Carura forms a boundary between Phrygia and Caria" (12.8.17). Laodicea and Colossae are in (12.8.13).
- **G7.5 West and north-west:** Philadelphia (`philadelphia-lydia.json`) is out. Don't use the Maeander as the edge (Q22). The edge with Mysia is shared with G6.4. Sipylus is out, since even Strabo couldn't place it (12.8.2).
- **G7.6 North-east:** Phrygia Epictetus is in: Dorylaion 609367, Kotiaeion 609444, Midaion 609473, Nakoleia 609484 and Aizanoi 609292 (12.8.12). Bithynia is out (12.4.1).
- **Confidence:** low. **Sources:** `bib:strabo-geography`, `bib:isbe-phrygia`, `bib:isbe-lycaonia`, and the Pleiades IDs above.

### 4.8 Pontus: approved with changes (the PO chooses the option)
- **Holds:** the mechanism and the shape (C9). The shape includes Armenia Minor (answer 4).
- **G8.1 The western coast (C11).** The reused shape leaves out the 5,091 km² of coastal western Pontus that `bithynia` holds, with Amisus and Themiscyra.
  - `pontus.json`'s history, citing ISBE, counts it as Pontus ("Most of it was joined to the province of Bithynia").
  - ISBE "Pontus" has "Pontus proper" extend "from the Halys River on the West" (verified in M5-11, Q22).
  - Strabo places Themiscyra "in the territory of the Amiseni" in "the country next after the Halys River" (12.3.9).

  There are two options:
  - **Option A (recommended):** the outline is `pontus` plus the part of `bithynia` east of the lower Halys, cut along Natural Earth's Kızılırmak from the `galatia`/`bithynia`/`pontus` tripoint at 35.621°E 41.287°N to the sea.
  - **Option B:** reuse the shape as ruled, and the note says that it leaves out Amisus's coast.
- **G8.2** No `years` property: the extent doesn't change (ADR-0050 item 4), and the precedence rule (item 5) shows the kingdom's land up to AD 64.
- **Confidence:** medium. **Sources:** `bib:strabo-geography`, `bib:isbe-pontus`, `bib:isbe-galatia`, plus `pleiades:857024` and `pleiades:857350` for option A.

### 4.9 Media: approved with changes
- **G9.1 Include Atropatene.** Strabo says Media is divided into Greater Media and Atropatian Media (11.13.1), and Pliny calls Media "both kingdoms into which it is divided" (6.29). The note says the outline includes Atropatene, a separate kingdom in Strabo's day (11.13.1), and that 11.13.6 bounds Greater Media only.
- **G9.2 Edges:**
  - North-west: the Araxes (`pleiades:884118`), "the boundary between Armenia and Atropatenê" (11.13.3).
  - North and north-east: the Caspian. Atropatene lies "adjacent to the region round the recess of the Hyrcanian Sea" (11.13.2), and the Cadusii live "above the Hyrcanian Sea" (11.13.6).
  - East: Parthia and the Caspii (Pliny), and the Cossaei and Paraetaceni (Strabo).
  - South: Sittacene (Apolloniatis), Susiana, Persis and the Zagros (both authors).
  - West: Adiabene (Pliny), and Armenia and Matiane (11.13.2).
- **Checks:**
  - Inside: Ecbatana (`pleiades:903021`) and Rhaga(i) (`903104`).
  - Outside: Susa (`912936`), Ctesiphon (`893976`), Arbela (`874341`) and Artaxata (`874361`, in Armenia).
- **Confidence:** medium. **Sources:** `bib:strabo-geography`, `bib:pliny-natural-history`, `bib:isbe-media`, `pleiades:903080`, `pleiades:903021`, `pleiades:884118`.

### 4.10 Mesopotamia: approved with changes
- **G10.1 Edges from Strabo 16.1.21 (Q30):**
  - East: the Tigris.
  - West and south: the Euphrates. Along the west, share the line of the empire's edge where it follows the river.
  - North: the Taurus foothills, beyond which lies Armenia.
  - The southern close, where the Euphrates "washes its ... southern side" toward the Tigris, is approximate. Babylonia lies beyond it (Strabo 16.1.1; Pliny 6.30).
- **Checks:** Edessa (`pleiades:658457`), Nisibis (`874623`) and the record's point lie inside.
- **G10.2 The note** gives Arrian's narrower sense (the Jezira, in `mesopotamia.json`) and Pliny's broader one, which takes in Babylonia (6.30). It drops the Oruros reading (Q29) and the Zerbis and Lycus (Q30).
- **Confidence:** medium. **Sources:** `bib:strabo-geography`, `bib:pliny-natural-history`, `bib:livius-mesopotamia` (cite-only), and Natural Earth's rivers (PD).

### 4.11 The Parthian Empire: approved with changes
- **Holds:** the west edge is the Euphrates (Strabo 11.9.2 and 16.1.28), reusing the empire's edge where it follows the river. The south edge is the Persian Gulf coast, Pliny's "Red Sea" (6.29). Armenia is out (Pliny 6.29: the provinces "begin at the frontiers of Armenia and the shores of the Caspian").
- **G11.1 East and north-east:** use ISBE's "to the confines of India and the Oxus" (Q38): the Oxus (`pleiades:59969`) in the north-east, and a deliberately coarse closing line toward India. Strabo adds "a part of Bactriana" (11.9.2). Don't use "the edge of the map's own frame": nothing in `app/` sets a frame (there is no `maxBounds`), so that line would be invented.
- **G11.2** The outline holds Media's and Mesopotamia's outlines, since `media.json` and `mesopotamia.json` are its child places.
- **Confidence:** low. **Sources:** `bib:pliny-natural-history`, `bib:strabo-geography`, `bib:isbe-parthians`, `pleiades:59969`.

### 4.12 Crete: approved
Take `crete-cyrene` part 0 (C7). **Confidence:** high. **Sources:** `bib:strabo-geography` (10.4.2–4), `bib:isbe-crete`, `pleiades:589748`. Cauda isn't in it (P8).

### 4.13 Libya: approved with changes (note and confidence)
- **Holds:** take `crete-cyrene` part 1 (C8).
- **G13.1 The note** says the west edge is AWMC's AD 69 line (C10). It reaches the coast 158 km east of the Euphrantas Tower, the boundary "as it was under Ptolemy" (Strabo 17.3.20), and 79 km west of the Altars of the Philaeni, which Strabo (17.3.20) and Pliny (5.4) name at the bottom of the Great Syrtis. The southern and eastern edges are AWMC's too.
- **Confidence:** medium, not high: one of its land edges is sourced, and none follows a cited line. **Sources:** `bib:strabo-geography`, `bib:pliny-natural-history`, `bib:isbe-libya`, `bib:isbe-cyrene`, `pleiades:373777`, `pleiades:363959`, `pleiades:363924`, `scripture:Acts 2:10`.

### 4.14 Chios: approved
Take `asia` part 2 (C2). High. **Sources:** `bib:strabo-geography` (14.1.3), `bib:isbe-chios`.

### 4.15 Cos: approved
Take `asia` part 4 whole (C3); it already excludes the Cnidian peninsula. High. **Sources:** `bib:strabo-geography` (12.8.6), `bib:isbe-cos`. The note's description of the peninsula (C3) needs fixing.

### 4.16 Malta: approved
Take `sicily` part 1 (C6), the island Pliny calls Melita (3.14). High. The note says that the outline shows the record's first candidate, Malta (rated high). The minority candidate, Mljet (rated low), keeps its dot but gets no outline (P7). **Sources:** `bib:pliny-natural-history`, `bib:hmml-contesting-shipwreck` (cite-only), `pleiades:462311`.

### 4.17 Rhodes: approved
Take `asia` part 5 (C4). High. **Sources:** `bib:strabo-geography` (14.2.5), `bib:isbe-rhodes`.

### 4.18 Samos: approved
Take `asia` part 1 (C5). High. **Sources:** `bib:strabo-geography` (14.1.3), `bib:isbe-samos`.

## 5. The PO's answers (§9) against the sources

| # | Answer | What the sources say | Verdict |
|---|---|---|---|
| 1 | Samaria and Judea reach the coast, split along the Samaria–Judea line; the notes give Pliny's two readings (Joppa, Caesarea) | Josephus gives Judea the breadth "from the river Jordan to Joppa" and "maritime places [that] extend as far as Ptolemais" (3.3.5). Pliny 5.14 gives the coast from Ascalon to Caesarea to "the region of Samaria", while 5.15 lists Joppa among Judea's toparchies. The split agrees with Josephus and Pliny 5.15 on Joppa, and with Pliny 5.14 on Caesarea. It disagrees with Josephus on Caesarea and with Pliny 5.14 on Ascalon, Azotus, Jamnia and Joppa. | Supported as a labelled convention, **with a change:** each note gives both authors (G1.2), not Pliny's readings alone |
| 2 | Judea reaches the polygon's southern tip, with Idumea (Josephus) | Josephus counts Idumea among Judea's eleven portions (3.3.5), and Pliny counts it apart (5.14–15). But the polygon also holds the Gaza–Rhinocolura coast, which went to Syria (*Antiquities* 17.11.4). | Supported, **with a change:** G3.1 |
| 3 | Anchor the line on Aqraba, with a note naming "the unidentified village" | The premise is wrong. Pleiades and DARE locate Anouath Borkeos (A7), and both authors put Acrabatta in Judea (Q4, Q7). A line along Aqraba's latitude would cut through that toparchy's own town. | **Premise rejected:** re-rule as G1.1 (P2) |
| 4 | Reuse `pontus`; the note names Armenia Minor; confidence medium | True as far as it goes, but the shape also leaves out 5,091 km² of coastal western Pontus (C11) | Supported, **with a change:** G8.1 option A or B (P3) |
| 5 | Phrygia crosses the Asia–Galatia line | ISBE "Phrygia" describes Galatian and Asian Phrygia, "the line between them ... never sharply drawn". The outline must also take in Iconium (G7.1). | Supported |
| 6 | Cos: the island alone, without the Cnidian peninsula | Part 4 is Kos alone, with its western Kefalos end; the peninsula is in part 0 (C3) | Supported |
| 7 | Spot-check Libya's west edge against the Euphrantas Tower | Done: the edge lies 158 km from the Tower and 79 km from the Altars of the Philaeni, so it matches neither (C10) | Done, **with a change:** G13.1 |

## For the GIS Engineer: rules for every outline
- **G0. Draw nothing new by hand.** Every edge comes from one of:
  - an existing area's edge or coastline;
  - Natural Earth's PD land, lakes or rivers (pinned commit `ca96624`);
  - straight segments between, or equidistant from, the Pleiades or Wikidata anchors named above.

  Trace nothing from a map (the Barrington Atlas, *The Sacred Bridge* or Wikipedia), and copy no DARE value into `data/geo/` (L7).
- **G-checks** (in `scripts/check-ancient-geo.mjs`, beside the card's own checks):
  - (a) `confidence` is one of `high`, `medium` or `low`.
  - (b) Each outline holds its region's point.
  - (c) Each place whose `parentId` is the region lies inside the outline, or within 1 km of its coast. The exceptions, each named in the check: Cauda (C7); the Sea of Galilee's label point (§4.2); Cana's Qana candidate (§4.2); Malta's Mljet candidate.
  - (d) Neighbouring outlines share their common edges, built once: Samaria and Judea; Pisidia with Phrygia and with Lycaonia; Lycaonia and Phrygia; Mysia and Phrygia.
  - (e) The anchors in §4 lie on the stated sides, for example Akraba in Judea, Koropassos in Lycaonia, Iconium in Phrygia, Prusa outside Mysia and Selge in Pisidia.
- **Notes** are in the project's own words. They may quote the public-domain texts briefly (L1–L4), but never Livius or HMML.

## Fixes for the Research Lead (the note)
The outlines can be built from this report. The note should still be corrected so that it doesn't mislead later cards:
- **R1.** Counts: 18 regions and 7 islands and parts (§1, §2.2, §7).
- **R2.** IDs: A1, A2 and A12; add 678163, 687820 and 687825.
- **R3.** Josephus and the coast: Q1 and Q3; Anouath Borkeos (A7); the Acrabatta toparchy (§3.1, §8 questions 1 and 3).
- **R4.** Pliny: the interior towns are in 5.14 (Q6), and Oruros is misread (Q29).
- **R5.** Pisidia: §4.4, with Q9–Q11 and Q39.
- **R6.** Lycaonia: Coropassus (A9), Orcaorci (Q14), Iconium (G5.2) and ISBE (Q40).
- **R7.** Mysia: Q16, Q17, A10 and G6.2–G6.3.
- **R8.** Phrygia: Q21–Q23 and Q41.
- **R9.** Pontus: C11.
- **R10.** Media: Q25, Q26 and A12.
- **R11.** Mesopotamia: Q30 and Q31.
- **R12.** Parthia: Q38 and G11.1.
- **R13.** Libya: C10.
- **R14.** Cos: C3.
- **R15.** Confidence: one schema value per region (§4).
- **R16.** The CCEL statement (L3).
- **R17.** Nits: Q10, Q24, and "exactly" in §2.1 (the provenance says "approximate").

## Items for the PO
- **P1. The coast (answer 1).** The sources disagree (§5). I recommend keeping the split, with both authors in the notes (G1.2). Giving the whole coast to Judea, as far as Ptolemais (Josephus), would leave Samaria inland.
- **P2. Answer 3 needs re-ruling.** Anchor the line on Anouath Borkeos, with Akraba on Judea's side (G1.1). The edge stays low.
- **P3. Pontus.** Option A adds western Pontus (recommended). Option B keeps the shape, and the note names the omission (G8.1).
- **P4. Judea without the Gaza–Rhinocolura face** (G3.1): please confirm. The other choice is to keep it and say so in the note.
- **P5. Iconium in Phrygia, not Lycaonia** (G5.2, G7.1). This follows ISBE and the existing records, and the notes mention Strabo; please confirm. The neutral alternative is to put Iconium inside both outlines.
- **P6. Mysia with the Troad** (G6.1): please confirm.
- **P7. Malta:** outline Malta only (recommended), with Mljet named in the note. The alternative is to outline both candidates' islands, using Natural Earth's land for Mljet.
- **P8. Cauda (Gavdos)**, which is parented to Crete, isn't drawn in any area. I recommend leaving it out of Crete's outline; it has its own name.
- **P9. Existing data that conflicts with the sources**, out of scope here and for later cards:
  - (a) `pisidia.json` is parented to `galatia`, but its point lies in `pamphylia`.
  - (b) The `galatia`/`cappadocia` line leaves Strabo's Lycaonian Coropassus in Cappadocia.
  - (c) The `asia` area holds Prusa (Bithynian) and Pessinus (Galatian).
  - (d) In the `asia` provenance, "western Cos" can be misread.
  - (e) `syrtis` is the one region-level record with neither land nor an outline. It is a sea feature, so ADR-0048 item 5 (name only) applies.
  - (f) The coastline is simplified enough that Joppa's point lies 0.68 km offshore and Attalia's sits on the coastline. An outline check needs the 1 km coastal tolerance in G-checks (c).

## Checks run
- I ran no build, test or browser suite (a docs-only phase). The results come from the scratch scripts described in "Method", run against the committed files at `dcf41a2`.
- All 14 parts of `galilee-perea`, `asia`, `crete-cyrene`, `sicily` and `pontus` pass `@turf/boolean-valid`.

## Sign-off

| Region | Verdict | Key changes (§4) |
|---|---|---|
| Samaria | Approved with changes | G1.1: a new Samaria–Judea line through Anouath Borkeos, north of Akraba; G1.2: both authors in the note; medium |
| Galilee | Approved with changes | Take part 0 as is; medium, not high; the note covers Carmel, Scythopolis and the north-east tongue; correct IDs |
| Judea | Approved with changes | South of G1.1; leave out the Gaza–Rhinocolura face (G3.1); the note covers Idumea, the coast and Ascalon; medium |
| Pisidia | Approved with changes (the proposed south edge is rejected) | All four edges from ISBE and Strabo between named anchors, crossing `galatia`, `pamphylia` and `lycia`; low |
| Lycaonia | Approved with changes | East edge between Coropassus and Garsaura; Iconium out and Lystra in; the Isauras in, Laranda out; low |
| Mysia | Approved with changes | The Troad in, but not high; Prusa out; the Caicus plain in; low |
| Phrygia | Approved with changes | Iconium in; Carura on the line; not along the Maeander; shared edges; low |
| Pontus | Approved with changes | Option A (add western Pontus) or B (note the omission); medium |
| Media | Approved with changes | Atropatene included and named; edges from Strabo 11.13 and Pliny 6.29; Ecbatana's ID; medium |
| Mesopotamia | Approved with changes | Edges from Strabo 16.1.21; drop the Oruros and Zerbis readings; medium |
| Parthian Empire | Approved with changes | East edge from ISBE (the Oxus, the confines of India), not "the frame"; low |
| Crete | Approved | Part 0; high |
| Libya | Approved with changes | Part 1; the note on the west edge (158 km from the Euphrantas Tower, 79 km from the Altars); medium |
| Chios | Approved | `asia` part 2; high |
| Cos | Approved | `asia` part 4 whole; high |
| Malta | Approved | `sicily` part 1; high; the note names Mljet |
| Rhodes | Approved | `asia` part 5; high |
| Samos | Approved | `asia` part 1; high |

**Licensing: signed off.** Every source used is public domain (Josephus, Strabo, Pliny, ISBE, Natural Earth), CC BY 3.0 (Pleiades), CC0 (Wikidata), ODbL 1.0 (AWMC and OSM, through the existing areas), or cite-only and unquoted (Livius, HMML). DARE is used as a cross-check only. Nothing is traced from a copyrighted map. `ATTRIBUTION.md` needs no new line; widen the Natural Earth row's use if phase 3 draws on its rivers or lakes.
