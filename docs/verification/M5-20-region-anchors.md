# M5-20 verification — Anchors for the seven deferred regions (phase 2)

- **Card:** `docs/tasks/M5-20-region-anchors.md`, phase 2 · **Branch:** `data/m5-20-region-anchors` (head `a6e21c7` when I started)
- **Checked:** the Research Lead's note `docs/research/M5-20-region-anchors.md` (`a6e21c7`), against the card, ADR-0050 and its update, the PO's rulings in `docs/research/M5-19-region-outlines.md` §10, and `docs/verification/M5-19-region-outlines.md` (§4.4–4.7, §4.9–4.11, G0 and the G-checks). Also checked: `data/locations/`, `data/geo/ancient-areas.geojson` and `data/bibliography.json`.
- **Verifier:** fact-checker · **Date:** 2026-10-23 · **Phase:** 2 (ADR-0014). This phase changes no data file, so no record's `status` changes.

**Result: no region is ready for the GIS Engineer yet. All seven need changes, and the Parthian Empire's east edge needs a PO decision.** The IDs are right except Babylon's, and most quotations are verbatim. But every region has at least one edge with:
- no sourced anchor on one side; or
- an anchor on the wrong side; or
- a dispute the note doesn't state.

An equidistant build from the note's own anchors would repeat M5-19's failures:
- Media would run east through Hecatompylos to Merv.
- Atropatene's capital would fall outside Media.
- Mesopotamia would lose its own point.
- Mysia would lose the Caicus outlets.

Mesopotamia's area range is about twice the land Strabo describes, so a correct outline would fail the card's area check. Licensing passes.

| Section | Pass | Needs change | Fail |
|---|---:|---:|---:|
| 1. Quotations and citations (48) | 26 | 18 | 4 |
| 2. Anchors and IDs (27) | 10 | 13 | 4 |
| 3. Edges (33) | 10 | 16 | 7 |
| 4. Disputes (15, 5 of them named by the note) | 1 | 14 | 0 |
| 5. Area checks (8) | 4 | 4 | 0 |
| Licensing (10) | 10 | 0 | 0 |

"Needs change" means a clause is wrong, unsourced or overstated, or an anchor or instruction must change, and the source gives the fix. "Fail" means the sources contradict the claim, or an edge has no sourced anchor on one side and the note proposes none.

**The main findings:**
1. **Edges with nothing on one side.**
   - Media's east edge has no outside anchor ("no further anchor needed"), so Media's cell runs east without limit. Hecatompylos, Hyrcania and Merv all fall nearer Rhagae than any outside anchor.
   - Mesopotamia's north edge (the Taurus) and the Parthian north and east edges also lack an anchor on one side.
   - Phrygia's north-west row has no inside anchor.
2. **Anchors on the wrong side.**
   - Dorylaeum is listed inside Mysia, but Strabo puts it in Phrygia Epictetus (12.8.12), and the note's next row lists it outside.
   - Iconium is listed outside Phrygia, against the note's own §4 and the PO's ruling P5.
   - Lake Tatta is listed inside Lycaonia, but Strabo says it "is a part of Greater Phrygia" (12.5.4).
3. **Atropatene and the Caspian.**
   - **Atropatene's capital:** its summer palace, Gazaca (Strabo 11.13.3; ISBE's "Gazaea"), falls nearer Arbela than Ecbatana, so the note's anchors leave it outside Media.
   - **The coast:** the note's "no coast" reading contradicts ISBE ("Lay to the West and Southwest of the Caspian"), Strabo 11.13.2–3 and 11.13.6, `media.json`, and M5-19's G9.2.
4. **Mesopotamia's south and Babylon's ID.**
   - **South close:** Strabo puts Mesopotamia's narrowest part "in the neighbourhood of Seleuceia and Babylon" (16.1.21). The note's south-edge anchors are all near the Taurus, so the record's own point (43.5°E 33.7°N) and Seleucia fall nearer Ctesiphon, outside.
   - **Babylon's ID:** `pleiades:896947` isn't Babylon. Pleiades titles it "Untitled": an unnamed wall "around Babylon", in a 1° grid cell. Babylon is `pleiades:893951`.
5. **"Both kingdoms" in Pliny 6.29.** The note (like M5-19's G9.1) reads "both kingdoms into which it is divided" as Greater Media and Atropatene. Bostock and Riley's own note 9 glosses it as "The Upper and the Lower", Parthia's two groups of kingdoms. Atropatene still belongs in Media, on Strabo 11.13.1 and ISBE ("It included Atropatene").
6. **Disputes the note doesn't state.** Each needs both readings:
   - **Rhagae:** Strabo 11.9.1 counts the region "as far as the Caspian Gates and Rhagae and the Tapyri, which formerly belonged to Media" as Parthian in his day.
   - **Sinda:** grouped with "Greater Cibyra ... and Cabalis" in 13.4.15.
   - **Laranda:** Lycaonian, but outside this map's Lycaonia by its scope.
   - **Gordion:** one of "the ancient habitations of the Phrygians" (12.5.3).
   - **Elaea, Philadelphia and Massabatice.**
7. **The Parthian east edge has no sourced line, and the sources disagree.**
   - ISBE's "to ... the Oxus" would take in all of Bactria. Strabo ("a part of Bactriana", 11.9.2; the two satrapies of 11.11.2) and ISBE's own account of Mithridates I ("a part of Bactria") give the Parthians only part of it.
   - The note's outside anchor, Bactra, lies south of the Oxus, so it contradicts the Oxus edge. It is also in Pleiades (`961886`), against the note's "no Pleiades record found".
8. **Area checks (§10).** Mesopotamia between the pinned Natural Earth rivers, closed at Strabo's narrows, is about 122,000–124,000 km², not 200,000–310,000. Pisidia's "upper bound" isn't one: its hull is 14,018 km², not "about 12,000", and an equidistant build from the note's own anchors gives about 20,800 km². Mysia, Phrygia and the Parthian Empire have no numeric range, and Media, Pisidia and Lycaonia lack a floor or a ceiling, so the card's area check can't be written.

## Scope
- Every anchor, edge, dispute, area figure and source in the note, and its §13 questions.
- Not in scope: existing areas and borders. Where one conflicts with a source, M5-19's P9 already lists it.

## Method
1. **Texts, opened 2026-10-23** (URLs below):
   - Strabo 11.9, 11.11, 11.13, 12.4–12.8, 13.4, 14.3, 14.4, 15.3.1–2 and 16.1.
   - Pliny 5.24, 5.25, 5.32, 5.41, 6.29 and 6.30.
   - ISBE "Pisidia", "Lycaonia", "Mysia", "Phrygia", "Media" and "Parthians".
   - The WEB snapshot (`data/reference/engwebp_vpl.txt`) for Acts 14:6 and 16:7–8.
2. **IDs.**
   - One Wikidata query (property P1584; CC0) looked up 67 Pleiades IDs: the note's 48, plus the records' and M5-19's. It mapped 44 of the note's 48 to their items and coordinates, a second source for each.
   - I opened seven Pleiades records in their JSON: 896947, 59969, 619194, 550523, 638918, 638996 and 961886.
   - A second query looked up candidate replacement anchors.
   - Pleiades' HTML pages sit behind an anti-bot proof-of-work page, which I couldn't open; the JSON opened.
3. **Geometry** (scratch scripts in `/tmp`, not committed):
   - convex hulls and spherical areas;
   - nearest-anchor tests, which show where an equidistant (Voronoi) build would put a point;
   - a 0.02° grid estimate of the areas the note's Asia Minor anchors would give;
   - the land between the Euphrates and the Tigris, on the pinned Natural Earth 10 m rivers in the build cache (SHA-256 checked by `ancient-geo-inputs.mjs`);
   - point-in-polygon tests against `ancient-areas.geojson`.
4. **Not verified, because not opened:**
   - Strabo 11.7 and 11.14, and Pliny 5.23, 5.27, 5.28, 5.40 and 5.42. The note says it read them, but its tables quote nothing from them.
   - Isaura Nova (648651), Dorylaeum (609367), and the details of Garsaura's "OSM location of Aksaray" and Ecbatana's "CIGS location". These aren't in Wikidata's P1584 or weren't reopened; M5-19 verified 648651, 609367, 619164 and 903021 (its §3, A11–A13, and §4.4).

**Sources opened, 2026-10-23:**
- Strabo, LacusCurtius (tr. Jones), at `https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Strabo/` + `11I*.html`, `11K*.html`, `11M*.html`, `12D*.html`, `12E*.html`, `12F*.html`, `12G*.html`, `12H*.html`, `13D*.html`, `14C*.html`, `14D*.html`, `15C*.html`, `16A*.html`.
- Pliny, Perseus (tr. Bostock and Riley), at `https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.02.0137%3Abook%3D<b>%3Achapter%3D<c>`, for 5.24, 5.25, 5.32, 5.41, 6.29 and 6.30.
- ISBE, at `https://www.internationalstandardbible.com/` + `P/pisidia.html`, `L/lycaonia.html`, `M/mysia.html`, `P/phrygia.html`, `M/media.html`, `P/parthians.html`.
- Pleiades, at `https://pleiades.stoa.org/places/<id>/json`, for the seven IDs above.
- Wikidata Query Service, `https://query.wikidata.org/sparql` (P1584).

## Licensing
**Pass.** Every source is compatible with the code licence (MIT), the data licence (CC BY-SA 4.0) and `data/geo/` (ODbL 1.0). The note adds no `bib:` id and traces nothing from a map. `docs/LICENSES.md` and `ATTRIBUTION.md` need no change.

| # | Source | Read at the source, 2026-10-23 | Verdict |
|---|---|---|---|
| L1 | Strabo, Loeb tr. Jones, LacusCurtius | Every page I opened has a single-asterisk URL, which the site's footer says marks public-domain items ("A page or image on this site is in the public domain ONLY if its URL has a total of one *asterisk"); `14D*.html` also says "The text is in the public domain." | PD, quotable |
| L2 | Pliny, tr. Bostock and Riley (1855), Perseus | 1855 imprint on each page; existing ruling (public-domain row, M5-11) | PD, quotable |
| L3 | ISBE (1915) | Existing ruling | PD, quotable |
| L4 | Pleiades | The JSON's `rights` field in 896947, 619194, 550523 and 638918: "Sharing and remixing permitted under terms of the Creative Commons Attribution 3.0 License (cc-by)." | CC BY 3.0, already credited |
| L5 | Pleiades locations taken from OpenStreetMap: Bactra's only location ("OSM location of Baktra", way 151243951); Garsaura's point, per the note | ODbL, through OSM | Fine in `data/geo/`, as Sychem's point was in M5-19 (A2 credits OSM). Never in the CC BY-SA records. |
| L6 | Pleiades' Barrington label arcs for the Kibyratis and the Milyas (data source: AWMC's "Regional Name Linework") | AWMC is ODbL, republished in Pleiades under CC BY 3.0 | Compatible. I advise against them as anchors for reasons of evidence, not licence (§2, A6). |
| L7 | Wikidata (cross-check of IDs and points only) | Existing ruling | CC0 |
| L8 | Natural Earth 10 m rivers, pinned commit `ca96624` | Existing ruling; already in `ATTRIBUTION.md`'s Natural Earth row for M5-19 | PD |
| L9 | Livius (`bib:livius-mesopotamia`) | Existing ruling (M5-19 L8) | Cite-only; the note quotes nothing from it |
| L10 | WEB, Acts 14:6, 16:7, 16:8 | `engwebp` snapshot; the note's "the cities of Lycaonia" matches Acts 14:6 | PD |

## 1. Quotations and citations
Rows that need a change come first; the 26 that pass are listed after the table (Q23–Q48).

| # | The note's claim | What the source says | Verdict |
|---|---|---|---|
| Q1 | §3: one quotation joins "some, situated above Side and Aspendus ... occupy hilly places... Of these, some are entirely in the mountains ...", and calls the Pisidians "contiguous to" the Lycaonians | The first part is 12.7.1 (Loeb: "Sidê"). "Of these ..." is 12.7.2 and refers to Artemidorus's list of cities, which the ellipsis drops. 12.7.1 opens "Contiguous to these are the Pisidians", right after Strabo's account of Lycaonia, Isauricê and the Homonadeis. | Needs change (R2) |
| Q2 | 12.7.2: "on the borders of the Phrygians and Caria are situated Tabae and Sinda" puts Sinda "at Pisidia's own south-western corner" | The sentence goes on: "and also Amblada", which lies in eastern Pisidia. So it locates none of the three. Strabo also groups "Greater Cibyra and Sinda and Cabalis" (13.4.15). | Needs change (R3) |
| Q3 | 12.6.4 "lists Antioch and Lycaonia as what Amyntas held *together with* Pisidia" | Amyntas held "the Antiocheia near Pisidia", the country to "the Apollonias near Apameia Cibotus", "certain parts of the country alongside the mountain, and ... Lycaonia". He fought the Pisidians, "who from the Taurus were overrunning this country, which belonged to the Phrygians and the Cilicians" (the critical note reads "Lycaonians"). "Together with Pisidia" isn't in the text (cf. M5-19 Q11). | Needs change (R8) |
| Q4 | Pisidia's east row: Isauricê is "contiguous with Pisidia in the Amyntas narrative of 12.6.4" | 12.6.4 says nothing of contiguity; 12.7.1's "Contiguous to these are the Pisidians" does. | Needs change (R6) |
| Q5 | Lycaonia's south row cites 12.6.3 (Antipater "also possessed Laranda") for Laranda outside | The passage groups Laranda with Derbe under Antipater. Laranda is outside only by this map's scope: ISBE puts it in Lycaonia Antiochiana, which `lycaonia.json` leaves out (M5-19 G5.3). | Needs change (R12) |
| Q6 | Lycaonia's north row cites 12.5.2 for the "Orcaorci/Pitnissus district" inside | 12.5.2 gives the Galatian Tectosages "the parts near Greater Phrygia in the neighbourhood of Pessinus and Orcaorci". That places Orcaorci by the Galatians, not inside Lycaonia. | Needs change (R11) |
| Q7 | The Mysian coast row cites 12.8.8, "Troy is situated between Mt. Ida and the sea" | Verbatim, but it supports the Troad being separate (M5-19 Q16). Strabo puts Mysia's coast "between Bithynia and the outlet of the Aesepus River" and makes the Aesepus "the northerly and easterly limit of the Troad" (12.4.5–6). | Needs change (R15) |
| Q8 | 12.8.13 is "the same grouping, not a contradiction, see §9" | §9 is the Parthian Empire; nothing there discusses it. The point is M5-19's Q14. | Needs change (R11) |
| Q9 | Pliny 5.41, quoted as "on the south it joins Lycaonia, ..."; his compass points are "very likely Pliny's own error or a transmission slip" | Perseus prints "Lyeaonia", so the correction is silent (cf. M5-19 Q1). "Very likely ... error" is the note's own judgement; the project's rule is to give both readings. | Needs change (R19) |
| Q10 | Phrygia's north-west row cites 12.8.2 (Sipylus) for its edge with Mysia | 12.8.2 is about "the country round Mt. Sipylus" and "Magnesia, which lies at the foot of Sipylus": the Lydian side, not Mysia | Needs change (R25) |
| Q11 | 11.13.6: Greater Media "bounded on the east by [the Cossaei, Paraetaceni and related tribes]" | "Greater Media is bounded on the east by Parthia and the mountains of the Cossaei", and "also by the Paraetaceni, who border on the Persians". The brackets drop Parthia, the neighbour the note's east row is about. | Needs change (R28) |
| Q12 | ISBE Media: "On the North... bounded by the rivers Araxes and Cyrus" | "On the North in later times it was bounded by the rivers Araxes and Cyrus". The ellipsis drops a qualifier of date. | Needs change (R29) |
| Q13 | Pliny 6.29 "describes the 'Climax Megale' pass leading from Persis up 'to that of the Medi'" | "on the side on which it runs up to that of the Medi, there is a place known by the name of Climax Megale ... a narrow passage which leads to Persepolis" | Needs change (R33) |
| Q14 | Pliny 6.30's Oruros reflects "Pompey's own earlier, short-lived conquest" | Pliny: Oruros "under Pompeius Magnus formed the extreme limit of the Roman Empire". "Short-lived conquest" is the note's gloss. | Needs change (nit, R36) |
| Q15 | ISBE Parthians gives "the one firm figure for the eastern edge" | ISBE gives a phrase, "to the confines of India and the Oxus". It also says Mithridates I "added to his dominions a part of Bactria", as Strabo does (11.9.2). | Needs change (R46) |
| Q16 | Strabo 11.11.2 is cited for Bactra outside the empire | 11.11.2 names Bactra a city of the Bactrian Greeks, says "the satrapy Turiva and that of Aspionus were taken away from Eucratides by the Parthians", and makes the Oxus "the boundary between the Bactrians and the Sogdians". It doesn't put Bactra outside the empire in this period. | Needs change (R42) |
| Q17 | Mesopotamia's south row cites 16.1.1 and 16.1.16 | Neither gives a limit. 16.1.21 does: "the shortest distance between the two rivers is somewhere in the neighbourhood of Seleuceia and Babylon, slightly more than two hundred stadia". | Needs change (R37) |
| Q18 | 12.6.1 puts "Lake Tatta, Orcaorci and Pitnissus on the cold Lycaonian plateau" | 12.6.1 opens "Such, then, is Tatta", closing 12.5.4, which says Tatta "lies alongside Greater Cappadocia near Morimenê but is a part of Greater Phrygia". "The regions round Orcaorci and Pitnissus, as also the plateaus of the Lycaonians" are listed side by side. | **Fail** (R11) |
| Q19 | Pliny 6.29: Media is "both kingdoms into which it is divided", Greater Media and Atropatene | "Media lies crosswise to the west, and so presenting itself obliquely to Parthia, closes the entrance of both kingdoms into which it is divided." Bostock and Riley's note 9 on "both kingdoms" reads "The Upper and the Lower, as already mentioned": Parthia's. M5-19's G9.1 has the same reading; its conclusion stands on Strabo 11.13.1 and ISBE. | **Fail** (R27) |
| Q20 | Arbela is "in Aturia," per Strabo 16.1.3 | "Aturia borders on the region of Arbela, with the Lycus River lying between them. Now Arbela, which lies opposite to Babylonia, belongs to that country". The note's own Mesopotamia row reads it rightly. | **Fail** (R35) |
| Q21 | "both authors agree the land further south, around Babylon, shades into 'Babylonia'" | Pliny's Mesopotamia "contains ... Seleucia, Laodicea, Artemita"; he lists Hipparenum among "the following towns in Mesopotamia", and Orchenus "in the same district" (6.30). Only Strabo separates Babylonia (M5-19 G10.2). | **Fail** (R36) |
| Q22 | 16.1.19: "Adiabenê... is also a part of Babylonia... in some places it borders also on Armenia" | "though it too is a part of Babylonia, still it has a ruler of its own; and in some places it borders also on Armenia" | Needs change (R35) |

**Q23–Q48, verified verbatim** (Loeb or Bostock–Riley wording; any differences are only in diacritics):
- **Pisidia:** Artemidorus's list (12.7.2); 14.3.9 on Termessus and the pass "over the mountain to Milyas"; ISBE Pisidia's extent sentence and its account of Antioch's epithet; Pliny 5.24; 12.8.14.
- **Lycaonia:** 12.6.1 (the lakes, Iconium, the Taurus "which separates Cappadocia and Lycaonia from Cilicia Tracheia", Coropassus and Garsaura, 120 stadia); 12.6.2; 12.6.3's words; ISBE Lycaonia (the circuit, "between Iconium and Lystra", Laranda); Pliny 5.25; 12.8.13.
- **Mysia:** 12.8.1; 12.8.12; ISBE Mysia; 12.4.1; 12.4.3; Pliny 5.32; Pleiades' description of Elaea ("Elaea was an ancient place in Aeolis. Strabo mentions its status as a port of Pergamon.").
- **Phrygia:** ISBE Phrygia; 12.8.15; 12.8.17.
- **Media:** Pliny 6.29 (Media's four neighbours); 11.13.2–3; 15.3.1; 11.13.8.
- **Mesopotamia:** 16.1.21–22; 16.1.28; Pliny 6.30 (Seleucia, Apamea on the Zeugma, Oruros).
- **Parthian Empire:** 11.9.2; Pliny 6.29 (the eighteen kingdoms and the Euphrates); ISBE Parthians.
- **Scripture:** Acts 14:6 (WEB).

## 2. Anchors and IDs
Wikidata's Pleiades ID (P1584) gives a second source for 44 of the note's 48 Pleiades IDs. The other four are 648651, 638918, 609367 and 896947: I opened 638918 and 896947 in Pleiades, and M5-19 verified the other two. Distances are great-circle.

| # | The note's claim | Finding | Verdict |
|---|---|---|---|
| A1 | `pleiades:896947` is Babylon, "a rough Barrington Atlas grid cell" | Pleiades: title "Untitled", "BAtlas 91 F5 unnamed wall (around Babylon)", type city-wall, a 1° box (44–45°E, 32–33°N), `reprPoint` [44.5, 32.5]. Its connection "Babylon" points to `pleiades:893951`, which Wikidata's Babylon (Q5684) also cites, at 44.4211°E 32.5425°N, 8.8 km away. | **Fail**: use `893951` (R38) |
| A2 | Dorylaeum (`609367`) inside Mysia, on its east edge | Strabo: "To Phrygia Epictetus belong the cities ... Dorylaeum" (12.8.12). The note's next row lists it outside Mysia. | **Fail** (R14) |
| A3 | Iconium outside Phrygia, on its south-east edge | Against the note's §4, ISBE Phrygia and Lycaonia, `phrygia.json` and the PO's ruling P5 | **Fail** (R22) |
| A4 | Lake Tatta (`619268`) and "the Orcaorci/Pitnissus district" inside Lycaonia | Tatta "is a part of Greater Phrygia" (12.5.4). The district has no ID, and Strabo lists it beside the Lycaonian plateaus, not in them (Q18, Q6). | **Fail** (R11) |
| A5 | Koropassos's two locations are "6.5 km apart"; its `reprPoint` is 33.792°E 38.308°N | The `reprPoint` is right (the midpoint of the "TIB" and "500K" locations). They are 6.7 km apart. | Needs change (nit, R10) |
| A6 | The Kibyratis (`638918`) and the Milyas (`638996`) as outside anchors | Both are Barrington map-label arcs ("Centerline/arc of label location"), not places. The Kibyratis's `reprPoint` [29.560, 37.003] is 13.6 km from Sinda. Kibyra itself (`pleiades:638804`, 29.489°E 37.160°N; Wikidata Q1643467) is 11.1 km from Sinda, so the listed anchors would put it inside Pisidia, against 13.4.17. | Needs change (R7) |
| A7 | The Araxes (`884118`) as an outside anchor | It is a river. Wikidata's two points for it lie about 610 km apart (41.33°E and 48.45°E), so it can't serve as a point; it serves as a line (Natural Earth's Aras). | Needs change (R31) |
| A8 | The Oxus (`59969`) as an inside anchor, "crossing roughly 60°E 42°N, in the Amu Darya's own middle course" | Pleiades maps a MultiLineString from about 60.2°E 42.2°N (the lower course, in Khwarezm) upstream past 65°E 38°N. It is a line, not an anchor. | Needs change (R42) |
| A9 | Bactra/Zariaspa: "no Pleiades record found for it in this session" | `pleiades:961886` "Baktra", whose only location is "OSM location of Baktra" at Balkh (66.90°E 36.77°N), created 2026-02-09; Wikidata Q127429707 cites it | Needs change (R42) |
| A10 | Rhagae (`903104`) inside Media | Strabo 11.13.6 and ISBE put it in Media, but Strabo 11.9.1 counts "the whole region that extends as far as the Caspian Gates and Rhagae and the Tapyri, which formerly belonged to Media" as Parthian. Disputed. | Needs change (R32) |
| A11 | Sinda (`639111`) inside Pisidia | Pisidian in Artemidorus's list (12.7.2); grouped with Cibyra and Cabalis in 13.4.15. Disputed. | Needs change (R7) |
| A12 | Carura (`638901`) outside Phrygia | 12.8.16 puts it "in the neighbouring country", but 12.8.17 says it "forms a boundary between Phrygia and Caria", and M5-19's G7.4 put the edge through it | Needs change (R23) |
| A13 | Elaea (`550523`) outside Mysia, alone | With Teuthrania 10.4 km to its north, the line runs about 5 km south of Teuthrania and leaves the Caicus mouth (and Pitane, `550833`) outside, against 12.8.1, "as far as Teuthrania and the outlets of the river". Elaea's own side is the Pergamene dispute. | Needs change (R16) |
| A14 | Philadelphia (`philadelphia-lydia.json`) outside Phrygia | No passage cited. Strabo 13.4.10: "After the Lydians come the Mysians; and the city Philadelphia". | Needs change (R24) |
| A15 | Ancyra (`619103`), Gordion (`609393`) outside Phrygia, citing 12.8.13 and Pliny 5.41 | Neither passage names them (M5-19 Q21). 12.5.2 does: "To the Tectosages belonged the fortress Ancyra". 12.5.3 places Gordium on the Sangarius among "the ancient habitations of the Phrygians". Pliny 5.41's own "Ancyra" is the Phrygian one "toward Lydia" (12.5.2). | Needs change (R21) |
| A16 | "I cross-checked 18 of this note's anchors" | §12 lists 21 | Needs change (nit, R1) |
| A17 | Records used as anchors: `attalia`, `perga`, `antioch-pisidia`, `iconium`, `lystra`, `derbe`, `pergamum`, `laodicea`, `colossae`, `philadelphia-lydia` | All exist, with their points as the note assumes | Pass |
| A18 | 44 Pleiades IDs | Each names the place the note says it does: Termessus, Selge, Side, Aspendus, Sagalassus, Cremna, Apamea, Philomelium, Amblada, Isaura Vetus, Sinda, the Milyas, Koropassos, Garsaura, Tyana, Laranda, Lake Tatta (Tuz), Ancyra, Pessinus, Prusa, Kadoi, Cotiaeum, Midaeum, Nacolea, Aizanoi, Teuthrania, Elaea, Synnada, Amorium, Gordion, Carura, Ecbatana, the Aras, Artaxata, Ray (Rhagae), Persepolis, Pasargadae, Susa, Arbela, Edessa (Şanlıurfa), Harran (Carrhae), Nisibis, Ctesiphon, the Amu Darya | Pass |
| A19 | The 15 coordinates the note states | They agree with Wikidata's points for the same IDs to within 3.3 km (Kadoi and Rhagae 3.3 km; the rest 1.1 km or less) | Pass |
| A20 | Coropassus–Garsaura matches "about one hundred and twenty stadia" | 21.7 km on the note's points (M5-19: 21.6 km), so 0.18 km per stadium | Pass |
| A21 | Sides: Isaura Vetus and Nova (12.6.2), Amblada (12.7.2), Coropassus in and Garsaura and Tyana out (12.6.1) | As the sources say | Pass |
| A22 | Sides: Pergamon and Teuthrania in Mysia (12.8.1); Synnada and Amorium in Phrygia and Pessinus out (12.8.13) | As the sources say | Pass |
| A23 | Sides: Ecbatana in Media; Susa, Persepolis, Pasargadae (Pliny 6.29, "held by the Magi" in Persis) and Artaxata out | As the sources say | Pass |
| A24 | Sides: Edessa, Carrhae and Nisibis in Mesopotamia (16.1.21's definition; Nisibis and Carrhae "at the foot of Mt. Masius", 16.1.23) | As the sources say | Pass |
| A25 | Laranda (`648693`) outside, as Cilicia Tracheia | Outside by scope, not as Cilician (Q5) | Needs change (R12) |
| A26 | Ctesiphon (`893976`) outside Mesopotamia | Across the Tigris from Seleucia (Pliny 6.30; Strabo 16.1.16) | Pass |
| A27 | Isaura Nova (`648651`), Dorylaeum (`609367`) | Not in Wikidata's P1584 and not reopened. M5-19 verified both (§4.4, A11). | Pass (on M5-19's check) |

## 3. Region by region
Each edge is judged on the card's rule: sourced anchors on both sides, or a coast, river or range that a permitted dataset draws (M5-19's G0). "R" items are the corrections in §8.

### 3.1 Pisidia: needs change
| Edge | Verdict | Why |
|---|---|---|
| South (Pamphylia) | Needs change | The anchors are right, but Attalia and Perge have no passage; Strabo 14.4.1–2 supplies one. Restore M5-19's G4.1 anchors: Pednelissus in ("Above Aspendus lies Petnelissus", 14.4.2) and Sillyon out (R4). |
| North (Phrygia Paroreia) | Pass | Sagalassus and Cremna in, against Apamea, Antioch and Philomelium (12.8.14; ISBE). G4.1 also listed Adada and Anabura (in), and Apollonia and Iconium (out); restore them (R5). |
| East (Isauria) | Needs change | The anchors are right; the contiguity is 12.7.1, not 12.6.4 (Q4, R6). ISBE: "the frontier was never strictly drawn". |
| West (Lycia, the Milyas, the Kibyratis) | Needs change | The outside anchors are Barrington label arcs, and Kibyra falls inside. Sinda is disputed (A6, A11, R7). |

- **Confidence:** low, as the evidence allows.
- **Crossing provinces:** the outline crosses `galatia`, `pamphylia` and `lycia` (Sinda and Kibyra are in `lycia`). M5-19's G4.1 already ruled this, and the PO accepted it (§10), so §13 question 1 is settled for Pisidia.
- **Antioch:** the note keeps the existing convention and names Pliny 5.24 as the other reading. That's neutral, but the account of 12.6.4 must change (Q3, R8).

### 3.2 Lycaonia: needs change
| Edge | Verdict | Why |
|---|---|---|
| East (Cappadocia) | Pass | Coropassus in; Garsaura and Tyana out (12.6.1). Medium for this edge, as the note says. |
| West (Phrygia, Pisidia) | Needs change | Lystra in; Iconium and Amblada out (ISBE; P5). But nothing Lycaonian lies near `lycaonia.json`'s own point (33°E 38°N): it is 46.9 km from Iconium and 73 km from Lystra, so an equidistant build gives it to Phrygia, against G5.2 and check (b) (R13). |
| South (Cilicia Tracheia, Isauria) | Needs change | The Isauras and Derbe are in, and Laranda is out, but by scope, not as Cilician (Q5, R12) |
| North (Galatia proper) | **Fail** | No sourced inside anchor. Lake Tatta is "a part of Greater Phrygia" (12.5.4), and the Orcaorci district has no ID and isn't in Lycaonia (Q6, Q18). Fix: Coropassus in; Lake Tatta, Ancyra and Pessinus out (R11). |

- **Confidence:** low, with the east edge medium. That fits the evidence.
- **Crossing provinces:** Lycaonia's own anchors lie in three provinces: `galatia` (Lystra, Derbe), `pamphylia` (Isaura Vetus) and `cappadocia` (Koropassos), not "inside `galatia`" (R49). M5-19's §4.5 already drew it that way, so §13 question 1 is settled here too.
- **Scope:** the "western, Roman part" follows Acts 14:6 and ISBE. Before AD 37, Lycaonia Antiochiana wasn't yet separate, so the scope is a convention for the whole window. The outline's note should say so in one clause (R12).

### 3.3 Mysia: needs change
| Edge | Verdict | Why |
|---|---|---|
| Coast (Propontis, Hellespont, the Troad, the Aegean) | Needs change | The coast's extent is unstated. It runs from the Myrleians' country (12.8.10) to the Caicus outlets (12.8.1), and the outline needs both ends for the card's coast check. The cited 12.8.8 supports the Troad's exclusion (Q7, R15). |
| East (Bithynia) | **Fail** | The only inside anchor, Dorylaeum, is Phrygian (A2). Use Cyzicus, Miletopolis and Apollonia ad Rhyndacum (G6.1), against Prusa, Apamea Myrlea and Nicomedia (R14). |
| South-east (Phrygia Epictetus) | Needs change | Cadi's default side runs against Strabo's own list (R18) |
| South (Aeolis, Lydia) | Needs change | Elaea alone leaves the Caicus outlets outside (A13). Use Cyme and Magnesia ad Sipylum out, with Elaea disputed (R16). |

- **Confidence:** low, as the note says.
- **Dispute 1:** the records follow ISBE, not Strabo, and Pliny's Aeolis includes Adramyttium and Assos (R17).
- **§11:** the Caicus isn't an edge, since G6.3 puts the Caicus plain inside (R45).

### 3.4 Phrygia: needs change
| Edge | Verdict | Why |
|---|---|---|
| North-east (Phrygia Epictetus; Bithynia, Mysia) | Pass | Five Phrygia Epictetus cities in (12.8.12), Prusa out (12.4.3). Cadi goes on the line (R20). |
| East (Galatia) | Needs change | Ancyra and Gordion need passages. Gordion was an "ancient habitation of the Phrygians" (12.5.3), and the note must say so (A15, R21). |
| South-east (Lycaonia) | **Fail** | Iconium is on the wrong side (A3). Iconium in; Lystra out (R22). |
| South (Pisidia) | Pass | Antioch and Philomelium in; Sagalassus and Cremna out. It is shared with Pisidia's north edge. |
| South-west (Caria) | Needs change | Carura belongs on the line (G7.4, 12.8.17). Use Antioch on the Maeander outside, "where one finds himself already in Caria" (13.4.15) (A12, R23). |
| West (Lydia) | Needs change | Philadelphia needs its passage (13.4.10). The Catacecaumene beside it is "Phrygia" in 12.8.18 but "Mysia or Meïonia" in 13.4.11 (A14, R24). |
| North-west (Mysia) | **Fail** | No inside anchor. Pergamon and Teuthrania lie in Mysia's Caicus country, and 12.8.2 is about Sipylus, in Lydia (Q10). Delete the row: the Mysia line is the north-east row's (R25). |

- **Confidence:** low. ISBE: "To define the boundaries of Phrygia would be exceedingly difficult ... they were always vague"; Strabo: the Phrygian, Carian, Lydian and Mysian parts "merge into one another" (13.4.12).
- **Lake Tatta:** Strabo makes it "a part of Greater Phrygia" (12.5.4), while 12.8.13 has Greater Phrygia leave Pessinus, Orcaorci and Lycaonia "on the left". I recommend that Tatta lie in neither outline, with both notes giving both passages (PO-3).
- **For the GIS Engineer:** Wikidata's item for `pleiades:619103` (Ancyra) also carries the Phrygian Ancyra's point (28.86°E 39.16°N). Read Pleiades' `reprPoint`.

### 3.5 Media: needs change
| Edge | Verdict | Why |
|---|---|---|
| North-west (Armenia) | Needs change | The Araxes is the line: Natural Earth's Aras, then the lower Kura to the sea (ISBE, "the rivers Araxes and Cyrus"; Strabo 11.13.3). It isn't a point anchor (A7). The inside anchors must cover Atropatene: Gazaca (Ganzak, `pleiades:884148`, per Wikidata Q2607082) falls outside on the listed anchors: it lies nearer Arbela (215 km) than Ecbatana (322 km) (R31). |
| North and north-east (the Caspian) | Needs change | The note has no such edge. The sources put Media, with Atropatene, on the Caspian's south-west shore (§7, question 7; R26, R30). |
| East (Parthia proper, Hyrcania) | **Fail** | No outside anchor. On the listed anchors, Hecatompylos (244 km from Rhagae), Hyrcania (355 km) and Merv (987 km) all fall inside Media. Add Hecatompylos (`pleiades:942276`) and Hyrcania (`pleiades:942333`), and treat Rhagae as disputed (A10, R32). |
| South-east (Persis) | Pass | Ecbatana and Rhagae in; Persepolis and Pasargadae out (15.3.1; Pliny 6.29). Fix the paraphrase (Q13). |
| South (Susiana, Sittacene, the Zagros) | Pass | Ecbatana in, Susa out (Pliny 6.29; 11.13.6). The note should name Massabatice, which "belongs to Media, though some say that it belongs to Elymaea" (11.13.6) (R34). |
| West (Adiabene; Armenia and Matiane) | Needs change | Arbela is out, but not "in Aturia" (Q20). Atropatene's west, where it "lies east of Armenia and Matianê" (11.13.2), has no outside anchor (R35). |

- **Confidence:** medium holds once the changes are made, with the east edge low because of Rhagae.
- **Atropatene:** included, on Strabo 11.13.1 and ISBE ("It included Atropatene ... to the North"), not on Pliny's "both kingdoms" (Q19).

### 3.6 Mesopotamia: needs change
| Edge | Verdict | Why |
|---|---|---|
| West and south-west (the Euphrates) | Pass | Strabo 16.1.21–22 and 16.1.28. Use the empire's edge where it follows the river, then Natural Earth's river. Natural Earth splits it into three features: "Firat", "Al Furat" (with a lake centreline through Lake Assad) and "Euphrates" (R40). |
| North (the Taurus, Armenia) | **Fail** | No outside anchor, and a range isn't a line under G0. The nearest outside anchor in any of the note's tables is Artaxata, 429 km from Nisibis. Add sourced Armenian anchors beyond the Taurus (R39). |
| East (the Tigris) | Pass | The Tigris is the line (16.1.21); Arbela is a check point outside |
| South (Babylonia) | Needs change | The inside anchors all lie near the Taurus. The record's point (43.5°E 33.7°N) and Seleucia fall nearer Ctesiphon, 120.9 km and 7.7 km away. Babylon's ID is wrong (A1). Close at Strabo's narrows, and name Pliny's and Arrian's readings (R36–R38). |

- **Confidence:** medium, as the note says; the south edge is low.

### 3.7 The Parthian Empire: needs change, and the east edge needs a PO decision
| Edge | Verdict | Why |
|---|---|---|
| West (the Euphrates) | Pass | Strabo 16.1.28 ("The Euphrates and the land beyond it constitute the boundary of the Parthian empire"); 11.9.2. The Romans and Arab chieftains hold "the parts this side the river ... as far as Babylonia" (R44). |
| North (Armenia, the Caspian) | Needs change | There is no inside anchor on the land frontier, and the stretch east of the Tigris through Gordyene is unaddressed. Strabo says the Gordyaeans' Pinaca "was held in subjection by the king of the Armenians" (16.1.24). Of the Mesopotamians "who live alongside the mountains", he says "at last they are subject for the most part to the Armenians or else to the Parthians" (16.1.26) (R43). |
| South (the Persian Gulf) | Pass | Pliny 6.29 ("along the Red Sea to the south"; "The Persæ have always inhabited the shores of the Red Sea, for which reason it has received the name of the Persian Gulf") |
| East and north-east | **Fail** (as the note itself says) | No line in any cited source, and the sources disagree on Bactria (§5) |

- **Confidence:** low, as the note says.
- **Hyrcania,** which the card names, is unused. Strabo sources it as inside the empire: the Parthian kings spend the summer "at Ecbatana and in Hyrcania" (16.1.16).

## 4. The disputes
| # | Dispute | Both readings, sourced? | Consistent with the records and M5-19? | Verdict |
|---|---|---|---|---|
| D1 | Iconium: Lycaonia or Phrygia | Yes in §4: Strabo 12.6.1 and Pliny 5.25, against ISBE and Acts 14:6 | §4 follows P5, but §6 lists Iconium outside Phrygia | Needs change (R22) |
| D2 | Antioch: inside Pisidia or not | Yes: Pliny 5.24, against Strabo and ISBE | Follows `pisidia.json` and `antioch-pisidia.json` | Pass (12.6.4's wording: R8) |
| D3 | Cadi: Mysia or Phrygia Epictetus | Yes (12.8.12) | The default goes against Strabo's own list and M5-19's G6.4 ("lies on the edge") | Needs change (R18, R20) |
| D4 | The Pergamene coast, and Elaea: Mysia or Aeolis | Partly | The records follow ISBE, not Strabo. Elaea, the disputed place, is used as a clean outside anchor. | Needs change (R16, R17) |
| D5 | The Troad in Mysia | The source cell cites a passage for the other side | Follows P6 | Needs change (R15) |
| D6 | Rhagae: Media or Parthia proper | Not stated (11.13.6 and ISBE, against 11.9.1) | M5-19 §4.9 had it inside | Needs change (R32, PO-2) |
| D7 | Lake Tatta: Greater Phrygia, Lycaonia or neither | Not stated (12.5.4, against 12.8.13) | The drawn area puts it in `galatia` | Needs change (R11, PO-3) |
| D8 | Sinda: Pisidia or the Cibyratis | Not stated (12.7.2, against 13.4.15) | M5-19's G4.1 had it inside | Needs change (R7) |
| D9 | Laranda: Lycaonian, but outside by scope | Not stated (12.6.3; ISBE) | Follows `lycaonia.json` and G5.3 | Needs change (R12) |
| D10 | Gordion: Phrygian of old, Galatian now | Not stated (12.5.3) | Follows G7.2 | Needs change (R21) |
| D11 | Philadelphia and the Catacecaumene: Lydian, Mysian or Phrygian | Not stated (13.4.10–11; 12.8.18) | Follows G7.5 | Needs change (R24) |
| D12 | Massabatice: Media or Elymaea | Not stated (11.13.6) | — | Needs change (R34) |
| D13 | Bactria: wholly or partly Parthian | Not stated (ISBE's "to ... the Oxus", against Strabo 11.9.2, 11.11.2 and ISBE's own "a part of Bactria") | — | Needs change (R46) |
| D14 | Gordyene and the Mesopotamians "who live alongside the mountains": Armenian or Parthian | Not stated (16.1.24, 16.1.26) | — | Needs change (R43) |
| D15 | Media and the Caspian | The note reads "no coast" against ISBE and Strabo | Against `media.json` and G9.2 | Needs change (R26, R30) |

## 5. The Parthian east edge: advice for the PO
**Is there really no sourced line? Yes, within the project's sources.**
- Strabo gives the empire's growth: "lords of the whole country inside the Euphrates", and "a part of Bactriana" (11.9.2).
- Pliny gives directions: the Higher kingdoms "extend to the Scythians", and of Parthia proper, "On the east it is bounded by the Arii" (6.29).
- ISBE gives a phrase: "to the confines of India and the Oxus".

None names a line or a pair of places on one. They also disagree:
- ISBE's "the Oxus" would take in all of Bactria, which lies south of the Oxus (Strabo 11.11.1–2: the Oxus "forms the boundary between the Bactrians and the Sogdians").
- Strabo ("a part of Bactriana", 11.9.2; the satrapies "Turiva and that of Aspionus", 11.11.2) and ISBE's own account of Mithridates I ("a part of Bactria") give the Parthians only part of Bactria.
- The note's two east anchors contradict each other: Bactra lies south of the Oxus, so it can't be outside an edge drawn along it.

I didn't search beyond the bibliography; Pliny 6.16–25 (the eastern satrapies) is unread.

**The options:**
- **A. Not outlinable on its east (recommended).** The card allows it ("or is listed as not outlinable, with the reason"). The empire keeps its name only (ADR-0050 item 5), and Media and Mesopotamia still get outlines. Nothing on the map is invented.
- **B. Stop at the last sourced anchors.** The easternmost places the sources put inside the empire are Hecatompylos, "the royal seat of the Parthians" (Strabo 11.9.1), and Hyrcania (16.1.16); beyond them they name only peoples (the Arii, the Scythians). The shape would end the empire in north-eastern Iran, which ISBE and Strabo 11.9.2 say is wrong. **Not recommended:** a confident red line in the wrong place misleads more than no line. If chosen, the note must say that the outline shows only the part the sources bound.
- **C. A stated approximate limit.** Draw the Oxus where ISBE's phrase applies (Natural Earth's Amu Darya), plus a deliberately coarse closing line toward India (M5-19's G11.1). No vertex of the closing line has a source, so this needs an explicit PO waiver of the card's both-sides rule and of G0 for that edge, recorded in `docs/DECISIONS.md`. The note must also say that the sources disagree on Bactria. **Acceptable only with that waiver.**

## 6. The area checks (§10)
**Sanity, in brief:** the neighbours' areas are right, and the Media ceiling is sound. The Mesopotamia range is about twice the land Strabo describes, and Pisidia's "upper bound" isn't one. Three regions have no numeric range, and three lack a floor or a ceiling, so the card's area check can't be written yet.

| # | The note's figure | Finding | Verdict |
|---|---|---|---|
| S1 | Media at most about 575,000 km², from 4,100 stadia and "length and breadth ... approximately equal" (11.13.8) | The arithmetic holds, at 0.185 km per stadium. It is a ceiling only; the note gives no floor. | Pass (add a floor) |
| S2 | Mesopotamia 200,000–310,000 km² | Measured between the pinned Natural Earth rivers (the Euphrates from the Zeugma; the Tigris from 42.377°E 37.063°N), closed in the north through Nisibis and Edessa, the land is about 122,000–124,000 km². It is closed in the south across Strabo's narrows (the narrowest gap south of 34°N is 33.4 km; Strabo says "slightly more than two hundred stadia", about 37 km) or at Babylon–Seleucia. Thapsacus–Babylon is a distance along the river, not a straight length. A correct outline would fail this range. | Needs change: about 100,000–150,000 km² |
| S3 | Pisidia's four towns: about 2,200 km² | 2,199 km². A floor. | Pass |
| S4 | Pisidia widened: about 12,000 km², an "upper bound" | The hull of the stated set is 14,018 km², and no subset I tried gives 12,000. It isn't a ceiling: adding Sinda, an inside anchor, gives 18,253 km². An equidistant build (0.02° grid) from the note's own Asia Minor anchors gives about 20,800 km², or 18,900 km² with Kibyra outside. | Needs change |
| S5 | Lycaonia: about 6,800 km², "from its own town anchors" | 6,762 km², but the hull includes Iconium, which the note puts outside. It is a floor at best. The note's anchors would give at least 42,500 km² (the grid stops at 35°E and 40.3°N), or about 30,200 km² without Lake Tatta, because the north edge's outside anchors (Ancyra, Pessinus) lie far off. | Needs change |
| S6 | Mysia and Phrygia: "tens of thousands of km²"; the Parthian Empire: "continental" | Not numbers, so the GIS check can't use them | Needs change |
| S7 | The neighbours: `pamphylia` 23,500, `lycia` 15,100, `galatia` 77,000, `cappadocia` 110,000, `bithynia` 66,000, `asia` 134,000 km² | 23,479; 15,061; 77,144; 109,964; 65,939; 133,031 km² | Pass |
| S8 | The figures stay out of every shipped note (§13 question 8) | Agreed. They are checks, not facts about the land. | Pass |

## 7. Advice on the note's §13 open questions
1. **Pisidia and Lycaonia crossing provinces.** Yes, and the PO has already ruled. M5-19's G4.1 has Pisidia's outline cross `galatia`, `pamphylia` and `lycia` "as Phrygia's crosses provinces (answer 5)", and §4.5 draws Lycaonia across `galatia`, `pamphylia` and `cappadocia`; the PO accepted both (§10). Correct the facts: Lycaonia doesn't "sit inside `galatia`" (R49).
2. **Antioch.** Keep the convention and name Pliny 5.24. It is neutral and matches `pisidia.json`. Fix the account of 12.6.4 and add ISBE's "lay in Galatian Phrygia, near the northern border of Pisidia" (R8).
3. **Iconium.** P5 governs both outlines. §6's table must put Iconium inside Phrygia, against Lystra (R22). Both notes name Strabo 12.6.1 and Pliny 5.25.
4. **Aeolis.** Keep Mysia's coast as the records have it, but the records follow ISBE, not Strabo. Name Pliny's Aeolis, which also takes in Adramyttium and Assos (5.32). Elaea is the disputed place, not a clean outside anchor (R16, R17).
5. **Cadi.** Not on Mysia's side by default. Strabo lists it with Phrygia Epictetus and gives Mysia as "some writers'" view. Put the shared line through it (M5-19's G6.4); if the build can't, put it on Phrygia's side. Both notes give both readings (R18, R20).
6. **The Parthian east edge.** See §5: A (not outlinable on its east) is recommended, and C is acceptable only with a recorded waiver.
7. **Media's Caspian edge.** Media reaches the Caspian; treat its north and north-east as a coast. ISBE: Media "Lay to the West and Southwest of the Caspian", and "Near the Caspian the country is low, damp and unhealthy". Strabo: Atropatene "lies adjacent to the region round the recess of the Hyrcanian Sea" (11.13.2), its north is "the abode of the mountaineers called Cadusii, Amardi, Tapyri, Cyrtii" (11.13.3), and the Cadusii "live above the Hyrcanian Sea" (11.13.6). `media.json` says "beside the Caspian Sea, on its western and southwestern sides", and M5-19's G9.2 says "North and north-east: the Caspian". The coast's east end is disputed, like Rhagae: the Tapyri "formerly belonged to Media" (11.9.1) (R26, R30).
8. **Rough areas.** Agreed: they are checks, kept out of every shipped note. But each region needs a numeric range with its basis, and Mesopotamia's must change (§6, R47).

## 8. Corrections for the Research Lead
Each item gives the text to find in `docs/research/M5-20-region-anchors.md` and its replacement. **(B)** marks the items that change an anchor, an edge or a range; they block the GIS phase. The rest fix wording or citations.

Ten new IDs below rest on Wikidata's P1584 alone:
- Ganzak `884148`
- Antioch on the Maeander `638748`
- Kibyra `638804`
- Hecatompylos `942276`
- Hyrcania `942333`
- Apamea Myrlea `511194`
- Cyme `550506`
- Magnesia ad Sipylum `550706`
- Pitane `550833`
- Seleucia on the Tigris `894084`

The Research Lead confirms each in Pleiades' JSON before the GIS phase. Every other new ID is confirmed by Pleiades' JSON (Bactra, the Kibyratis, the Milyas), by M5-19's verification (Pednelissus, Sillyon, Adada, Anabura, Apollonia), or by a Pleiades connection (Babylon, `893951`).

Table rows are shown with escaped pipes (`\|`) so they don't render as tables here; paste them with plain `|`.

### §2 Method
- **R1.** Find "I cross-checked 18 of this note's anchors against Pleiades directly". Replace with "I cross-checked 21 of this note's anchors against Pleiades directly".

### §3 Pisidia
- **R2.** Find:
  > places the Pisidians "contiguous to" the Lycaonians, occupying the Taurus summits and the foothills on both flanks: "some, situated above Side and Aspendus, Pamphylian cities, occupy hilly places... Of these, some are entirely in the mountains, while others extend even as far as the foot-hills on either side, to both Pamphylia and Milyas, and border on the Phrygians and the Lydians and the Carians."

  Replace with:
  > opens his chapter on them "Contiguous to these are the Pisidians" (12.7.1), after his account of Lycaonia, Isauricê and the Homonadeis: "the greater part of them occupy the summits of the Taurus, but some, situated above Sidê and Aspendus, Pamphylian cities, occupy hilly places" (12.7.1). Of the Pisidian cities Artemidorus lists, "some are entirely in the mountains, while others extend even as far as the foot-hills on either side, to both Pamphylia and Milyas, and border on the Phrygians and the Lydians and the Carians" (12.7.2).
- **R3.** Find:
  > and separately notes that "on the borders of the Phrygians and Caria are situated Tabae and Sinda" (12.7.2) — Sinda sits at Pisidia's own south-western corner, toward Caria.

  Replace with:
  > and separately notes that "on the borders of the Phrygians and Caria are situated Tabae and Sinda, and also Amblada" (12.7.2). Since the sentence also names Amblada, in eastern Pisidia, it locates none of the three precisely. Sinda's point (`pleiades:639111`) lies in the south-west, 11 km from Kibyra, and Strabo elsewhere groups "Greater Cibyra and Sinda and Cabalis" (13.4.15).
- **R4.** Replace the table's South row with:
  > \| South (the Taurus front above Pamphylia) \| Termessus (`pleiades:639139`), Pednelissus (`pleiades:639046`), Selge (`pleiades:639100`, spot-checked directly, 31.128°E 37.228°N) \| Attalia (`attalia.json`), Perge (`perga.json`), Sillyon (`pleiades:639109`), Aspendus (`pleiades:638776`), Side (`pleiades:639105`) \| Strabo 12.7.1 ("some, situated above Sidê and Aspendus, Pamphylian cities, occupy hilly places"); 12.7.2 (Petnelissus among Artemidorus's Pisidian cities); 14.4.1–2 (Attaleia, Pergê, Syllium, Aspendus and Sidê along the Pamphylian coast; "Above Aspendus lies Petnelissus"); ISBE Pisidia ("the Taurus range where the latter overlooked the Pamphylian coast land") \|
- **R5.** Replace the North row with:
  > \| North (Phrygia Paroreia, the Apamea–Antioch–Iconium valleys) \| Sagalassus (`pleiades:639087`), Cremna (`pleiades:638814`), Adada (`pleiades:638733`), Anabura (`pleiades:638742`) \| Apamea Cibotus (`pleiades:638751`), Apollonia (`pleiades:638758`), Antioch-near-Pisidia (`antioch-pisidia.json`), Philomelium (`pleiades:609501`), Iconium (`iconium.json`) \| Strabo 12.7.2 (Adada and Anabura among Artemidorus's Pisidian cities); 12.8.13 ("Apollonias" among the Phrygian towns); 12.8.14 (Philomelium and "the Antiocheia near Pisidia" by Phrygia Paroreia); ISBE Pisidia ("the valleys which connected Apamea with Antioch, and Antioch with Iconium"); ISBE Phrygia (Galatian Phrygia's "important cities were Antioch, Iconium and Apollonia") \|
- **R6.** In the East row, find:
  > Strabo 12.6.2 (Isauricê "near the Taurus itself," belonging to Lycaonia, contiguous with Pisidia in the Amyntas narrative of 12.6.4)

  Replace with:
  > Strabo 12.6.2 (Isauricê, "near the Taurus itself", belongs to Lycaonia); 12.7.1 ("Contiguous to these are the Pisidians", after the account of Lycaonia and Isauricê); 12.7.2 (Amblada among Artemidorus's Pisidian cities)
- **R7 (B).** Replace the West row with:
  > \| West (Lycia, the Milyas and the Kibyratis) \| Termessus; Sinda (`pleiades:639111`) — **disputed**: Pisidian in Artemidorus's list (12.7.2), but grouped with "Greater Cibyra ... and Cabalis" in 13.4.15 \| Kibyra (`pleiades:638804`), the Milyas (`pleiades:638996`) \| Strabo 12.7.1 (the Sagalasseis "occupy the region this side the Taurus that faces Milyas"); 12.7.2 ("to both Pamphylia and Milyas"); 13.4.17 (the Cibyratae's villages "extended alongside it from Pisidia and the neighbouring Milyas as far as Lycia"); 14.3.9 (Termessus, "a Pisidian city situated near the defiles, through which there is a pass over the mountain to Milyas"); ISBE Pisidia ("bounded by Lycia on the West") \|

  After the table, add:
  > The Kibyratis (`pleiades:638918`) and the Milyas (`pleiades:638996`) are Barrington Atlas map-label arcs, not places. The Kibyratis's `reprPoint` lies 13.6 km from Sinda, and with it as the only outside anchor, Kibyra itself would fall inside Pisidia, so this note uses Kibyra instead. The Milyas label stays only because no named Milyadic town is cited; it is the weakest anchor on this edge.
- **R8.** Find:
  > Strabo and ISBE disagree: Strabo's own Amyntas narrative (12.6.4) lists Antioch and Lycaonia as what Amyntas held *together with* Pisidia, not as part of it, and ISBE Pisidia explains that "Antioch" took its epithet "the Pisidian" from its closeness to Pisidia and its role as the base that pacified it, not from lying inside it

  Replace with:
  > Strabo and ISBE disagree. In Strabo's Amyntas narrative (12.6.4), the Cilicians and Pisidians "who from the Taurus were overrunning this country, which belonged to the Phrygians and the Cilicians" (the Loeb critical note reads "Lycaonians") threatened Amyntas's lands round "the Antiocheia near Pisidia", and 12.8.14 sets Antioch by Phrygia Paroreia. ISBE Pisidia says Antioch "lay in Galatian Phrygia, near the northern border of Pisidia", and that it took its epithet "the Pisidian" from its proximity to Pisidia and from the military system based on it, not from lying inside it

### §4 Lycaonia
- **R9.** Find "and gives an exact boundary with Cappadocia:". Replace with "and names the two places the boundary with Cappadocia lies between:".
- **R10.** In §4 and §12, find "6.5 km apart". Replace with "6.7 km apart".
- **R11 (B).** Replace the North row with:
  > \| North (Galatia proper, and Greater Phrygia round Lake Tatta) \| Coropassus (`pleiades:619194`), "a village of the Lycaonians" (12.6.1) \| Lake Tatta (`pleiades:619268`), Ancyra (`pleiades:619103`), Pessinus (`pleiades:609500`, spot-checked directly, 31.584°E 39.334°N) \| Strabo 12.5.4 (Lake Tatta "lies alongside Greater Cappadocia near Morimenê but is a part of Greater Phrygia"); 12.5.2 ("To the Tectosages belonged the fortress Ancyra"); 12.8.13 (Greater Phrygia "leaves on the left Pessinus and the region of Orcaorci and Lycaonia"; see M5-19's verification, Q14); ISBE Lycaonia ("bounded on the North by Galatia proper") \|

  After the table, add:
  > The Orcaorci/Pitnissus district is not an inside anchor. It has no Pleiades or Wikidata id; Strabo lists "the regions round Orcaorci and Pitnissus, as also the plateaus of the Lycaonians" side by side (12.6.1); and he gives the Galatian Tectosages "the parts near Greater Phrygia in the neighbourhood of Pessinus and Orcaorci" (12.5.2). Lake Tatta's own side is disputed. Strabo counts it in Greater Phrygia (12.5.4), while 12.8.13 has Greater Phrygia leave Pessinus, Orcaorci and Lycaonia "on the left". It is outside Lycaonia on either reading.

  In the confidence paragraph, find "The north edge is the weakest: no source gives more than a plateau district on one side and the Galatian capital and emporium on the other, well short of a line." Replace with "The north edge is the weakest: Coropassus is the only Lycaonian anchor near it, and no source gives a line."
- **R12 (B).** Replace the South row with:
  > \| South (Cilicia Tracheia, by way of Isauria; Lycaonia Antiochiana) \| Isaura Vetus (`pleiades:648652`), Isaura Nova (`pleiades:648651`), Derbe (`derbe.json`) \| Laranda (`pleiades:648693`) \| Strabo 12.6.1 (the Taurus "separates Cappadocia and Lycaonia from Cilicia Tracheia"); 12.6.2 (Isauricê belongs to Lycaonia); ISBE Lycaonia (Cilicia Tracheia to the south). Laranda is Lycaonian: Antipater of Derbe "also possessed Laranda" (12.6.3), and Lycaonia Antiochiana "included the important city of Laranda" (ISBE). It is outside only because this map's Lycaonia is the western, Roman part (`lycaonia.json`, Acts 14:6). That is a convention, since the eastern part became separate only in AD 37. \|
- **R13 (B).** After the paragraph "Iconium: a three-way disagreement", add:
  > **The record's point.** `lycaonia.json`'s point (33°E 38°N) lies 46.9 km from Iconium, but 73 km from Lystra and 77 km from Coropassus, the nearest Lycaonian anchors, so an equidistant build gives it to Phrygia. M5-19's G5.2 requires it inside. Either a sourced Lycaonian anchor nearer to it than Iconium is added (none of the passages read here gives one), or the PO names the point as an exception to check (b).

### §5 Mysia
- **R14 (B).** Replace the East row with:
  > \| East (Bithynia) \| Cyzicus (`pleiades:511218`), Miletopolis (`pleiades:511318`), Apollonia ad Rhyndacum (`pleiades:511151`) \| Prusa (`pleiades:511384`), Apamea Myrlea (`pleiades:511194`), Nicomedia (`wikidata:Q209349`) \| Strabo 12.4.5 (Mysia "situated between Bithynia and the outlet of the Aesepus River, as touching upon the sea, and as extending as far as Olympus"); 12.8.10–11 (Miletopolis and "Apollonia on Rhyndacus" by their lakes; the Mygdonians reach "as far as the country of the Myrleians"); 12.4.1 (Bithynia is bounded "towards the south by Mysia and by Phrygia 'Epictetus'"); 12.4.3 (Prusa "is situated on the Mysian Olympus ... borders on the Phrygians and the Mysians"; Myrleia, "near Prusa", refounded by Prusias as Apameia) \|

  Dorylaeum stays in the south-east row, outside Mysia: "To Phrygia Epictetus belong the cities ... Dorylaeum" (12.8.12).
- **R15 (B).** Find:
  > **One edge is a coast.** The Propontis, Hellespont and (with the Troad included) the north Aegean coast bound Mysia on the north and north-west; no anchor pair is needed there, only the coastline itself (already in `data/geo/ancient-coastline.geojson` and Natural Earth's land polygon). This is the one coastal edge among the seven regions in this card.

  Replace with:
  > **One edge is a coast.** The Propontis, the Hellespont and (with the Troad included) the Aegean as far south as the outlets of the Caicus bound Mysia on the north and west. Its east end is the Myrleians' country, which is Bithynian (12.8.10, 12.4.3); its south end is the Caicus outlets (12.8.1). No anchor pair is needed between them, only the coastline (`data/geo/ancient-coastline.geojson` and Natural Earth's land). Media and the Parthian Empire also have coastal edges (§7, §9).

  Replace the coast row with:
  > \| North and west (the Propontis, the Hellespont, the Troad and the Aegean to the Caicus outlets) \| — (coast) \| — \| ISBE Mysia ("on the North to the Sea of Marmora ... and on the West to Hellespont. According to some authors it included the Troad"); M5-19 ruling P6 (the Troad included, at low confidence). Against the Troad: Strabo 12.4.5–6 (Mysia's coast runs "between Bithynia and the outlet of the Aesepus River", and the Aesepus is "the northerly and easterly limit of the Troad") and 12.8.12 (Mysia "lies between Mt. Ida and Catacecaumenê") — **not high confidence: the Troad's inclusion is itself the dispute** \|
- **R16 (B).** Replace the South row with:
  > \| South (Aeolis and Lydia, beyond the Caicus country) \| Pergamon (`pergamum.json`), Teuthrania (`pleiades:550916`); Elaea (`pleiades:550523`) — **disputed**, inside by default \| Cyme (`pleiades:550506`), Magnesia ad Sipylum (`pleiades:550706`) \| Strabo 12.8.1 (Mysia reaches "the country in the neighbourhood of the Caïcus River and Pergamenê, extending as far as Teuthrania and the outlets of the river"); 12.8.2 ("Pergamenê and Elaïtis, where the Caïcus empties into the sea, and Teuthrania, situated between these two countries ... lie between the Hellespont on the one side and the country round Sipylus and Magnesia ... on the other"); Pliny 5.32 (Elaea and Cyme in "Æolis ..., formerly known as Mysia"); ISBE Mysia ("on the South to Lydia") \|

  After the table, add:
  > With Elaea as the only outside anchor, the line would run about 5 km south of Teuthrania and leave the Caicus mouth, and Pitane (`pleiades:550833`), outside Mysia, against 12.8.1.
- **R17.** Find:
  > The project's own existing records already side with Strabo here (`adramyttium.json` and `assos.json` are both parented to `mysia`, not `asia`); this note recommends keeping that, with the outline's note naming Pliny's rival term.

  Replace with:
  > The project's existing records follow ISBE, not Strabo: `adramyttium.json` and `assos.json` call their cities Mysian, citing `bib:isbe-adramyttium` and `bib:isbe-assos`, and are parented to `mysia`. Pliny's Aeolis reaches north to Cape Lectum and takes in Adramyttium and Assos too (5.32). Strabo's Mysia "lies between Mt. Ida and Catacecaumenê" (12.8.12), but includes Pergamenê and the Caicus country "as far as Teuthrania and the outlets of the river" (12.8.1). This note recommends ISBE's reading for the coast and Strabo's for the Caicus country. Elaea, Pergamon's port at the Caicus mouth, is listed as disputed, and the outline's note names Pliny's Aeolis.
- **R18 (B).** Find:
  > Strabo's own text states the uncertainty directly ("according to some writers, belongs to Mysia"); no source resolves it, so this note lists Cadi on the Mysian side of its own disputed edge, flagged as such for the GIS Engineer and the reader.

  Replace with:
  > Strabo lists Cadi among the cities of Phrygia Epictetus, then gives the other view: "and also Cadi, which, according to some writers, belongs to Mysia" (12.8.12). Following M5-19's G6.4 ("Kadoi lies on the edge"), the shared Mysia–Phrygia line passes through Cadi, so it is a vertex of that line rather than an anchor of either side. If the build can't pass the line through a point, Cadi goes on Phrygia's side, the side of Strabo's own list. Both outlines' notes give both readings.

  In the South-east row, replace the Mysian-side cell with:
  > — (Cadi, `pleiades:609420`, spot-checked directly, 29.412°E 39.043°N, is a vertex of this line, or on Phrygia's side if the build can't pass a line through it — **disputed, see below**; Catacecaumenê, `pleiades:609427`, at the corner, per M5-19's G6.4)

### §6 Phrygia
- **R19.** Find:
  > his compass points do not all match Strabo's or a modern map (Galatia and Cappadocia, in particular, lie east and north-east of Phrygia on any reading, and "Mygdonia" elsewhere in both authors sits near Cyzicus, not on Phrygia's southern side, so this is very likely Pliny's own error or a transmission slip), but the four *named* neighbours agree with Strabo's.

  Replace with:
  > his compass points do not all match Strabo's (Galatia and Cappadocia lie east and north-east of Phrygia, and Strabo's Mygdonians live by Cyzicus, 12.8.10), so this note uses Pliny's named neighbours, not his compass points. (Perseus prints "Lyeaonia"; the quotation above corrects it.)
- **R20 (B).** In the North-east row, find "Cadi (`pleiades:609420`) disputed with Mysia". Replace with "Cadi (`pleiades:609420`): a vertex of the Mysia line (M5-19's G6.4), or here on Phrygia's side if the build can't pass a line through it — disputed with Mysia (§5)".
- **R21.** In the East row, find:
  > Strabo 12.8.13 ("leaves on the left Pessinus and the region of Orcaorci and Lycaonia"); Pliny 5.41 ("borders upon Galatia")

  Replace with:
  > Strabo 12.8.13 ("leaves on the left Pessinus and the region of Orcaorci and Lycaonia"); 12.5.2 ("To the Tectosages belonged the fortress Ancyra"); 12.5.3 (Pessinus, and Gordium on the Sangarius, in Strabo's account of Galatia); Pliny 5.41 ("borders upon Galatia"; his own "Ancyra" among Phrygia's towns is the Phrygian one "situated toward Lydia" of 12.5.2, not `pleiades:619103`)

  After the table, add:
  > Gordion is one of "the ancient habitations of the Phrygians, of Midas, and of Gordius" (12.5.3), but it lay in the Galatians' country in this period. It is outside this outline for that reason, and the outline's note says so.
- **R22 (B).** Replace the South-east row with:
  > \| South-east (Lycaonia) \| Philomelium (`pleiades:609501`), Iconium (`iconium.json`) — **disputed, see Lycaonia §4** \| Lystra (`lystra.json`) \| ISBE Lycaonia ("The boundary of Phrygia and Lycaonia passed between Iconium and Lystra"); ISBE Phrygia (Galatian Phrygia's "important cities were Antioch, Iconium and Apollonia"); M5-19 ruling P5. The other reading: Strabo 12.6.1 ("In this neighbourhood is also Iconium") and Pliny 5.25 ("a Tetrarchy of Lycaonia ... with the famous city of Iconium") \|
- **R23 (B).** Replace the South-west row with:
  > \| South-west (Caria) \| Laodicea (`laodicea.json`), Colossae (`colossae.json`), Apamea Cibotus (`pleiades:638751`, spot-checked directly, 30.174°E 38.073°N); the line passes through Carura (`pleiades:638901`) \| Antioch on the Maeander (`pleiades:638748`) \| Strabo 12.8.17 ("Carura forms a boundary between Phrygia and Caria"); 12.8.13 (Laodiceia and Colossae among the Phrygian cities); 13.4.15 ("the city of the Antiocheians on the Maeander, where one finds himself already in Caria"); M5-19's G7.4 \|

  If the build can't pass the line through Carura, list Carura outside, citing 12.8.16 ("Carura in the neighbouring country").
- **R24.** In the West row, find:
  > Strabo 12.8.15 (the Maeander "flows for a time through Phrygia and then forms the boundary between Caria and Lydia" further downstream — a Phrygian river, not Phrygia's own edge; see Carura, above, for where the line itself runs)

  Replace with:
  > Strabo 13.4.10 ("After the Lydians come the Mysians; and the city Philadelphia"). Philadelphia lies beside the Catacecaumene, which Strabo calls "Phrygia 'Catacecaumenê,' which is occupied by Lydians and Mysians" (12.8.18), and also a country "whether it should be called Mysia or Meïonia" (13.4.11). The Maeander "flows for a time through Phrygia and then forms the boundary between Caria and Lydia" (12.8.15): a Phrygian river, not Phrygia's own edge.
- **R25 (B).** Delete the North-west row (the one beginning "\| North-west (Mysia) \| — \| Pergamon"). After the table, add:
  > Phrygia's edge with Mysia is the north-east row's line through Cadi, shared with §5. Pergamon and Teuthrania lie in Mysia's Caicus country, and 12.8.2's "country round Mt. Sipylus" is the Lydian side, by Magnesia.

### §7 Media
- **R26 (B).** Find:
  > **No coast reaches Media's own outline; Media's own north side faces the Caspian/"Hyrcanian" Sea, but through Atropatene and the Cadusii's own coastal strip, not through Media's outline touching the water directly on every source's reading.** The Araxes (north-west) and the Zagros (south, south-east) are the two named ranges/rivers; every other edge is anchor pairs.

  Replace with:
  > **One edge is a coast.** Media, with Atropatene, reaches the south-west shore of the Caspian. ISBE says Media "Lay to the West and Southwest of the Caspian", and "Near the Caspian the country is low, damp and unhealthy". In Strabo, Atropatene "lies adjacent to the region round the recess of the Hyrcanian Sea" (11.13.2); its northern part is "the abode of the mountaineers called Cadusii, Amardi, Tapyri, Cyrtii" (11.13.3); and the Cadusii "live above the Hyrcanian Sea" (11.13.6). `media.json` already says "beside the Caspian Sea, on its western and southwestern sides". The coast runs from the mouth of the Araxes and the Cyrus to Media's eastern end. That end is disputed, like Rhagae: the Tapyri "formerly belonged to Media" (11.9.1). The Araxes (north-west) is a river edge and the Zagros (south) a range; every other edge is anchor pairs.
- **R27.** In §7's first paragraph, find:
  > — and explains that this covers "both kingdoms into which it is divided," Greater Media and Atropatene.

  Replace with:
  > . His preceding words, that Media "closes the entrance of both kingdoms into which it is divided", refer to Parthia's Upper and Lower kingdoms (Bostock and Riley's note 9: "The Upper and the Lower, as already mentioned"), not to Media's two parts. Those parts are Strabo's (11.13.1) and ISBE's (Media "included Atropatene ... to the North, and Media Magna to the South").
- **R28.** Find:
  > Greater Media is "bounded on the east by [the Cossaei, Paraetaceni and related tribes]... on the north by the Cadusii who live above the Hyrcanian Sea... on the south by Apolloniatis... and by the mountain Zagrus... and on the west by the Atropatii and certain of the Armenians,"

  Replace with:
  > Greater Media "is bounded on the east by Parthia and the mountains of the Cossaei", and "also by the Paraetaceni, who border on the Persians"; "on the north by the Cadusii who live above the Hyrcanian Sea"; "on the south by Apolloniatis, which the ancients called Sitacenê, and by the mountain Zagrus, at the place where Massabaticê is situated, which belongs to Media, though some say that it belongs to Elymaea"; "and on the west by the Atropatii and certain of the Armenians",
- **R29.** Find "On the North... bounded by the rivers Araxes and Cyrus, which separated it from Armenia[;]". Replace with "On the North in later times it was bounded by the rivers Araxes and Cyrus, which separated it from Armenia[;]". After "bounded on the South by Susiana."", add:
  > ISBE adds that "The chief cities of ancient Media were Ecbatana, Gazaea, and Ragae."
- **R30 (B).** Add this row after the North-west row:
  > \| North and north-east (the Caspian) \| — (coast, from the mouth of the Araxes and the Cyrus east to the line with Hyrcania) \| — \| ISBE Media ("Lay to the West and Southwest of the Caspian"; "Near the Caspian the country is low, damp and unhealthy"); Strabo 11.13.2 (Atropatene "lies adjacent to the region round the recess of the Hyrcanian Sea"), 11.13.3 (its north is "the abode of the mountaineers called Cadusii, Amardi, Tapyri, Cyrtii"), 11.13.6 (the Cadusii "live above the Hyrcanian Sea"). The coast's east end is disputed (11.9.1: "the Tapyri, which formerly belonged to Media"). \|
- **R31 (B).** Replace the North-west row with:
  > \| North-west (the Araxes, with Armenia) \| Gazaca (`pleiades:884148`, Ganzak), Ecbatana (`pleiades:903021`) \| — (the Araxes is the line: Natural Earth's Aras, then the lower Kura to the sea; `pleiades:884118` names the river and isn't a point anchor); Artaxata (`pleiades:874361`, in Armenia) is a check point \| Strabo 11.13.3 ("Their royal summer palace is situated in a plain at Gazaca"; "the Araxes, which forms the boundary between Armenia and Atropatenê"); ISBE Media ("bounded by the rivers Araxes and Cyrus, which separated it from Armenia"; "The chief cities of ancient Media were Ecbatana, Gazaea, and Ragae") \|
- **R32 (B).** Replace the East row with:
  > \| East (Parthia proper, the Caspii and Hyrcania) \| Ecbatana; Rhagae (`pleiades:903104`, spot-checked directly, 51.468°E 35.585°N) — **disputed** \| Hecatompylos (`pleiades:942276`), Hyrcania (`pleiades:942333`) \| Pliny 6.29 ("on the east, the Caspii and the Parthi"; Hecatompylos lies "in the middle" of Parthia); Strabo 11.13.6 ("Greater Media is bounded on the east by Parthia and the mountains of the Cossaei"); 11.9.1 ("Hecatompylus, the royal seat of the Parthians"); ISBE Media ("Its eastern boundaries were formed by Hyrcania and the Great Salt Desert"). Rhagae is Media's in Strabo 11.13.6 ("Rhaga itself", among Media's Greek cities) and ISBE ("The chief cities of ancient Media were Ecbatana, Gazaea, and Ragae"); but Strabo 11.9.1 counts "the whole region that extends as far as the Caspian Gates and Rhagae and the Tapyri, which formerly belonged to Media" as part of the Parthian country in his day. \|
- **R33.** In the South-east row, find:
  > Pliny 6.29 (describes the "Climax Megale" pass leading from Persis up "to that of the Medi")

  Replace with:
  > Pliny 6.29 (where Persis "runs up to that of the Medi", the "Climax Megale" gives "a narrow passage which leads to Persepolis")
- **R34.** In the South row, find:
  > Strabo 11.13.6 ("bounded... on the south by Apolloniatis... and by the mountain Zagrus")

  Replace with:
  > Strabo 11.13.6 ("on the south by Apolloniatis, which the ancients called Sitacenê, and by the mountain Zagrus, at the place where Massabaticê is situated, which belongs to Media, though some say that it belongs to Elymaea")
- **R35 (B).** Replace the West row with:
  > \| West (Adiabene; Armenia and Matiane, west of Atropatene) \| Ecbatana, Gazaca \| Arbela (`pleiades:874341`, spot-checked directly, 44.011°E 36.190°N); an anchor in Armenia or Matiane west of Lake Urmia, with its passage (to be added) \| Pliny 6.29 ("on the west, Adsiabene"); Strabo 11.13.2 (Atropatene "lies east of Armenia and Matianê"); 16.1.3 ("Aturia borders on the region of Arbela, with the Lycus River lying between them. Now Arbela, which lies opposite to Babylonia, belongs to that country"); 16.1.19 (Adiabenê, "though it too is a part of Babylonia, still it has a ruler of its own; and in some places it borders also on Armenia") \|

### §8 Mesopotamia
- **R36.** Find:
  > both authors agree the land further south, around Babylon, shades into "Babylonia," a related but separate name.

  Replace with:
  > Strabo calls the country round Babylon and Seleuceia "Babylonia" (16.1.16), and puts Mesopotamia's narrowest part "somewhere in the neighbourhood of Seleuceia and Babylon" (16.1.21). Pliny's Mesopotamia is broader. It "contains ... Seleucia, Laodicea, Artemita", and he lists Hipparenum among "the following towns in Mesopotamia" and Orchenus "in the same district" (6.30), so it takes in Babylonia (M5-19 G10.2).

  Also find "a statement about Pompey's own earlier, short-lived conquest east of the river," and replace with "a statement about Rome's limit under Pompey,".
- **R37 (B).** Replace the South row with:
  > \| South (Babylonia, beyond Strabo's narrows) \| — (a straight segment between the rivers; `mesopotamia.json`'s point, 43.5°E 33.7°N, lies north of it) \| Babylon (`pleiades:893951`) and Seleucia on the Tigris (`pleiades:894084`) are the segment's ends; Ctesiphon (`pleiades:893976`, spot-checked directly, 44.582°E 33.097°N) is a check point \| Strabo 16.1.21 ("the shortest distance between the two rivers is somewhere in the neighbourhood of Seleuceia and Babylon, slightly more than two hundred stadia"); 16.1.22 (Thapsacus to Babylon as Mesopotamia's length). The edge runs from Babylon to Seleucia, joined to Natural Earth's rivers by the shortest connectors. Pliny's broader reading takes in Babylonia (6.30), and Arrian's narrower one is the Jezira (`mesopotamia.json`); the outline's note names both. \|
- **R38 (B).** In §12, find:
  > One ID (`pleiades:896947`, Babylon) is a rough Barrington Atlas grid cell, not a precise point; flagged in §8 for the Fact-Checker.

  Replace with:
  > Babylon is `pleiades:893951`. `pleiades:896947`, cited in an earlier draft, is an untitled wall "around Babylon", placed in a 1° grid cell; its connection "Babylon" and Wikidata's Q5684 both point to 893951.
- **R39 (B).** Replace the North row with:
  > \| North (the Taurus, with Armenia) \| Nisibis (`pleiades:874623`, spot-checked directly, 41.215°E 37.067°N), Edessa, Carrhae \| Sourced anchors in Armenia beyond the Taurus, each with its passage (to be added) \| Strabo 16.1.21 ("on the north is the Taurus, which separates Armenia from Mesopotamia"); 16.1.23 (Nisibis "lies at the foot of Mt. Masius, and so do ... the regions of Carrhae and Nicephorium") \|
- **R40.** In the West row, find:
  > — (reuse the existing `data/geo/ancient-empire-edge.geojson` line where it follows the Euphrates fronting Syria and Commagene, per the M5-19 Fact-Checker's own recommendation for this same stretch)

  Replace with:
  > — (reuse `data/geo/ancient-empire-edge.geojson` where it follows the Euphrates fronting Syria and Commagene, M5-19's G10.1; below that, Natural Earth's river, which it splits into "Firat", "Al Furat" (with a lake centreline through Lake Assad) and "Euphrates")
- **R41.** Find:
  > the Roman emperor Trajan's conquest (already noted in `mesopotamia.json`'s own history) is AD 114 and later, outside this window.

  Replace with:
  > the Roman emperor Trajan's conquest (which `mesopotamia.json`'s history places "decades later") falls after AD 100, outside this window.

### §9 The Parthian Empire
- **R42 (B).** Replace the "East, north-east" row with:
  > \| East, north-east (toward Bactria and the Scythians) \| — (no anchor. The easternmost places the cited sources put inside the empire are Hecatompylos, `pleiades:942276`, "the royal seat of the Parthians" (Strabo 11.9.1), and Hyrcania, `pleiades:942333`, where the Parthian kings spend the summer (16.1.16).) \| — \| ISBE Parthians ("to the confines of India and the Oxus"; Mithridates I "added to his dominions a part of Bactria"); Pliny 6.29 ("extend to the Scythians"); Strabo 11.9.2 ("a part of Bactriana"); 11.11.2 ("the satrapy Turiva and that of Aspionus were taken away from Eucratides by the Parthians"; the Oxus "forms the boundary between the Bactrians and the Sogdians") — **no source gives a line; the PO decides (§13 question 6)** \|

  After the table, add:
  > The Oxus (`pleiades:59969`, the Amu Darya) is a river line, not an anchor: Pleiades maps it from about 60.2°E 42.2°N, in its lower course, upstream past 65°E 38°N. Bactra is `pleiades:961886` ("Baktra"); its only location is an OpenStreetMap outline at Balkh, 66.90°E 36.77°N. It lies south of the Oxus, so it can't be outside an edge drawn along the Oxus, and no cited source puts it outside the empire in this period.
- **R43 (B).** Replace the North row with:
  > \| North (Armenia's frontier, then the Caspian) \| Nisibis, Arbela, Gazaca (§7, §8); Hyrcania (`pleiades:942333`) on the south-east shore \| Artaxata (`pleiades:874361`, in Armenia) \| Pliny 6.29 (the Higher kingdoms "begin at the frontiers of Armenia and the shores of the Caspian"); Strabo 16.1.19 ("Now the Parthians rule over the Medes and the Babylonians, but they have never once ruled over the Armenians"); 16.1.16 (the Parthian kings spend the summer "at Ecbatana and in Hyrcania"). Along this frontier, Strabo says the Gordyaeans' fortress Pinaca "was held in subjection by the king of the Armenians" (16.1.24). Of the Mesopotamians "who live alongside the mountains", he says that "at last they are subject for the most part to the Armenians or else to the Parthians" (16.1.26). The outline's note names both. \|
- **R44.** In the West row, find:
  > — (reuse the existing `data/geo/ancient-empire-edge.geojson` line, as Mesopotamia's own west edge does, §8)

  Replace with:
  > — (reuse `data/geo/ancient-empire-edge.geojson` where it follows the Euphrates, then Natural Earth's river, as Mesopotamia's west edge does, §8; on this side of the river, the Romans and Arab chieftains hold "the parts this side the river ... as far as Babylonia", 16.1.28)
- **R45 (B).** Replace the §11 table with:
  > \| Region \| Status \| Confidence \| Coast? \| River/range edges \|
  > \|---\|---\|---\|---\|---\|
  > \| Pisidia \| Ready once R4–R7 are made \| low \| No \| None (all anchor-pair lines) \|
  > \| Lycaonia \| Ready once R11–R13 are made; the record's point needs an anchor or an exception \| low (the east edge alone is medium) \| No \| The Taurus (range, south), drawn by anchor pairs \|
  > \| Mysia \| Ready once R14–R18 are made \| low \| Yes: the Propontis, the Hellespont and the Aegean to the Caicus outlets \| None (the Caicus plain is inside, M5-19's G6.3) \|
  > \| Phrygia \| Ready once R20–R25 are made \| low \| No \| None (the Maeander is internal; the line passes through Carura) \|
  > \| Media \| Ready once R26–R35 are made and Rhagae's side is ruled \| medium (the east edge low) \| Yes: the Caspian, from the mouth of the Araxes and the Cyrus to the line with Hyrcania \| The Araxes (river, north-west); the Zagros (range, south), drawn by anchor pairs \|
  > \| Mesopotamia \| Ready once R37–R40 are made \| medium (the south edge low) \| No \| The Euphrates (river, west and south-west); the Tigris (river, east); the Taurus (range, north), drawn by anchor pairs \|
  > \| Parthian Empire \| Not outlinable on its east from the cited sources; the PO decides (§13 question 6) \| low \| Yes: the Caspian (north) and the Persian Gulf (south) \| The Euphrates (river, west); the Oxus only under option C \|

  Find "No region in this card's seven is "not possible": every one has named anchors on both sides of every edge the ancient sources describe at all." Replace with "Six regions can be outlined from sources once the corrections are made. The Parthian Empire's east edge can't: no cited source gives it as more than a direction, and they disagree on Bactria."
- **R46.** Find:
  > The International Standard Bible Encyclopedia (`bib:isbe-parthians`) gives the one firm figure for the eastern edge that this research found in any source: "This empire stretched from the Euphrates to the confines of India and the Oxus."

  Replace with:
  > The International Standard Bible Encyclopedia (`bib:isbe-parthians`) gives a phrase, not a line, for the eastern edge: "This empire stretched from the Euphrates to the confines of India and the Oxus." Its "Oxus" would take in all of Bactria, which lies south of that river (Strabo 11.11.2), while Strabo (11.9.2, 11.11.2) and ISBE itself (Mithridates I "added to his dominions a part of Bactria") give the Parthians only part of it.

### §10–§13
- **R47 (B).** In §10, make four changes.
  1. Find the sentence beginning "For Mesopotamia, Strabo gives the Thapsacus-to-Babylon distance" and ending "not a sliver." Replace it with:
     > For Mesopotamia, Strabo's figures can't be multiplied: Thapsacus to Babylon, "four thousand eight hundred stadia" (16.1.22), is a distance along the river, and "two thousand four hundred stadia" (16.1.21) is the widest separation, "towards the mountains". Measured instead between the pinned Natural Earth rivers, the land is about 122,000–124,000 km². That runs from the Zeugma on the Euphrates and from 42.377°E 37.063°N on the Tigris, closed in the north through Nisibis and Edessa and in the south from Babylon to Seleucia. **Range for the check: 100,000–150,000 km².**
  2. Replace the paragraph "**Pisidia and Lycaonia, both ways.** ..." with:
     > **Pisidia and Lycaonia.** The hull of four Pisidian towns (Selge, Sagalassus, Termessus, Cremna) is 2,199 km², a floor. The hull of Lycaonia's own inside anchors is 7,375 km², also a floor (Lystra, Derbe, Coropassus and Isaura Vetus; not Iconium, which is outside). The sources give neither region a ceiling. A hull widened to the outside anchors isn't one either, because an equidistant cell reaches beyond its anchors. Before the GIS phase, give each a ceiling with its basis: for example, a grid estimate of the equidistant build from the corrected anchors, times 1.5. (From this note's uncorrected anchors, Pisidia comes to about 20,800 km², and Lycaonia to at least 42,500 km², or about 30,200 km² without Lake Tatta.)
  3. Find "should both come out well inside that same range — tens of thousands of km², not hundreds of thousands, and certainly not millions." Replace with "should come out at tens of thousands of km². Give each a numeric floor and ceiling with its basis, as for Pisidia and Lycaonia, so that the GIS check can test them." After "nowhere near 3.6 million km²." add "Give Media a floor with its basis as well; the ceiling stands."
  4. Find "This note does not give the empire a numeric check beyond noting that its scale should be continental, not regional." Replace with "Under option A (§13 question 6) the empire gets no outline and needs no range; under option C, give a numeric range with its basis."
- **R48.** In §12's list of spot-checked anchors, find "the Oxus (59969)". Replace with "the Oxus (59969, a river line, not an anchor)", and add "Bactra (961886, "Baktra", an OpenStreetMap location at Balkh)".
- **R49.** In §13 question 1, find "and Lycaonia's (§4) sits inside `galatia` but anchors partly on the already-drawn `cappadocia` line." Replace with "and Lycaonia's (§4) crosses `galatia` (Lystra, Derbe), `pamphylia` (Isaura Vetus) and `cappadocia` (Koropassos, 4.2 km inside it, P9(b))."

## 9. Items for the PO
- **PO-1. The Parthian east edge** (§5). **A** is recommended: not outlinable on its east, name only. **B** (stop at the last sourced anchors) isn't recommended. **C** (the Oxus plus a coarse closing line) is acceptable only with a waiver recorded in `docs/DECISIONS.md`.
- **PO-2. Rhagae.** I recommend inside Media, following ISBE, Strabo 11.13.6–8 ("Rhaga itself"; Media's breadth runs "to the Caspian Gates") and M5-19 §4.9. Both notes name Strabo 11.9.1, and Media's east edge is low. The alternative is Parthia proper, following 11.9.1.
- **PO-3. Lake Tatta.** I recommend that it lie in neither outline: outside Lycaonia (12.5.4), and outside Phrygia, which by 12.8.13 lies west of Pessinus and Orcaorci; the drawn area keeps it in `galatia`. Both notes give both passages. The alternative is Phrygia, following 12.5.4, which would carry Phrygia round Galatian Pessinus to the lake.
- **PO-4. Lycaonia's point** (33°E 38°N). If no sourced anchor lies nearer to it than Iconium, name it as an exception to check (b), as M5-19 did with Cauda and the others in check (c).
- **PO-5. Cadi.** On the shared line (G6.4), or on Phrygia's side; not Mysia's.
- **PO-6. Elaea.** I recommend inside Mysia by default, following Strabo's Caicus reading, which the note follows, and naming it as disputed. The alternative is outside, following Pliny 5.32 and Pleiades' "Aeolis".
- **PO-7. Media's Caspian coast** (§13 question 7): please confirm.
- **PO-8. Mesopotamia's south.** I recommend Strabo's close from Babylon to Seleucia, with the note naming Pliny's broader Mesopotamia and the record's narrower one (Arrian).
- **PO-9. For the record.** M5-19's G9.1 read Pliny's "both kingdoms" the same way (Q19). Its conclusion stands on Strabo 11.13.1 and ISBE, so nothing shipped changes.

## Checks run
- No build, test or browser suite: this is a docs-only phase. The scratch scripts in `/tmp/m520` are not committed.
- **Hulls:** Pisidia 2,199 and 14,018 km² (18,253 km² with Sinda); Lycaonia 6,762 km² (7,375 km² without Iconium).
- **Nearest-anchor tests:** `mesopotamia.json`'s point and Seleucia fall OUT; Ganzak falls OUT of Media while Hecatompylos, Hyrcania and Merv fall IN; Pitane falls OUT of Mysia; Kibyra falls IN to Pisidia.
- **Grid estimate (0.02°):** Pisidia about 20,800 km² (18,900 km² with Kibyra outside); Lycaonia at least 42,500 km² (about 30,200 km² without Lake Tatta).
- **Mesopotamia between the Natural Earth rivers:** 123,773 km², closed Babylon–Seleucia; 121,991 km² at the narrowest gap (33.4 km).
- **Point in polygon** against `ancient-areas.geojson`: Lystra, Derbe, Lake Tatta and Iconium in `galatia`; Isaura Vetus in `pamphylia`; Koropassos in `cappadocia`; Laranda in `cilicia-tracheia`; Sinda and Kibyra in `lycia`; Pergamon, Teuthrania and Elaea in `asia`.
- **Areas of the drawn neighbours:** `asia` 133,031 km², `cappadocia` 109,964, `galatia` 77,144, `bithynia` 65,939, `pamphylia` 23,479, `lycia` 15,061.
- **Distances:** Coropassus–Garsaura 21.7 km; Koropassos's two locations 6.7 km apart; Sinda to the Kibyratis `reprPoint` 13.6 km; Sinda–Kibyra 11.1 km; Teuthrania–Elaea 10.4 km; 893951–896947 8.8 km.

## Sign-off
**Not signed off.** The blockers are the (B) corrections and the PO's decisions PO-1 to PO-8. Licensing is signed off.

| Region | Verdict | Blocking items |
|---|---|---|
| Pisidia | Needs change | R7; R4–R6 recommended |
| Lycaonia | Needs change | R11, R12, R13; PO-3, PO-4 |
| Mysia | Needs change | R14, R15, R16, R18; PO-5, PO-6 |
| Phrygia | Needs change | R20, R22, R23, R25; PO-3, PO-5 |
| Media | Needs change | R26, R30, R31, R32, R35; PO-2, PO-7 |
| Mesopotamia | Needs change | R37, R38, R39; PO-8 |
| Parthian Empire | Needs change; the east edge fails | R42, R43; PO-1 |
| Area ranges (§10) | Needs change | R47 |
| Licensing | Signed off | — |

When the note is revised, I'll re-check the changed rows and passages and the ten IDs that rest on Wikidata alone. The rest of this report stands.

## PO rulings (2026-10-24)
The PO rules on §9's items as the Fact-Checker advises. The human was away, and every ruling can be reversed later.
- **PO-1. The Parthian Empire: option A.** The empire is not outlinable on its east, so it keeps its name only (ADR-0050 item 5; the card allows "not outlinable, with the reason"). M5-20 therefore draws six outlines. The note keeps its sourced west, north and south edges as research, with the reason the empire isn't drawn.
- **PO-2. Rhagae:** inside Media, following ISBE, Strabo 11.13.6–8 and M5-19 §4.9. Both notes name Strabo 11.9.1, and Media's east edge is low confidence.
- **PO-3. Lake Tatta:** in neither outline. It is outside Lycaonia (Strabo 12.5.4) and outside Phrygia (12.8.13), and stays in the drawn `galatia`. Both notes give both passages.
- **PO-4. Lycaonia's point** (33°E 38°N): if no sourced anchor lies nearer to it than Iconium, it is named as an exception to check (b), as M5-19 did with Cauda.
- **PO-5. Cadi:** on the shared line (M5-19's G6.4) if the build allows it; otherwise on Phrygia's side, not Mysia's. Both notes give both readings.
- **PO-6. Elaea:** inside Mysia by default, following Strabo's Caicus reading, and named as disputed (Pliny 5.32; Pleiades' "Aeolis").
- **PO-7. Media's Caspian coast:** confirmed. Media reaches the Caspian, and its north and north-east are a coast. The coast's east end is disputed (the Tapyri, Strabo 11.9.1).
- **PO-8. Mesopotamia's south:** Strabo's close from Babylon to Seleucia. The note names Pliny's broader Mesopotamia and the record's narrower one (Arrian).
- **PO-9.** Noted. M5-19's conclusion stands on Strabo 11.13.1 and ISBE, so nothing shipped changes.

## Re-check (2026-10-24)
- **Checked:** the Research Lead's correction round, `c9dc5db` (diff `9e5846a..c9dc5db`; only `docs/research/M5-20-region-anchors.md` changed). I checked it against R1–R49 above and the PO's rulings PO-1 to PO-9. This is a focused check: only what changed, plus whether the six outlines have anchors on both sides of every edge. The rest of this report stands.
- **Verifier:** fact-checker · **Date:** 2026-10-24 (UTC) · No data file changes, so no record's `status` changes.

**Result: not yet signed off for the geometry phase. Ten blocking fixes remain (R50–R59), each with exact text below.**
- R1–R49 and PO-1 to PO-9 are applied. A few slips remain: two places cite PO-2 for Iconium, and one restores the "short-lived" gloss that R36 removed.
- All the IDs I re-checked are right, including Babylon's corrected `893951`. Bactra stands.
- **(a) Arsamosata passes, and it is better sourced than the note says:** Pliny 6.10 names it among the towns of Greater Armenia. The build should use its representative point, and the north edge's confidence is low. The note must also say where the north line meets the Euphrates: about 140 km above the Zeugma, so the Zeugma is no longer the corner.
- **(b) Matiane fails as an anchor.** Its point is the centre of a 1° grid cell, 63 km from Gazaca. Used as a seed, it would cut Media's own Zagros interior out of Media.
- **Building the corrected anchors exposes three more gaps:**
  - Media's north-west doesn't close. My R31 was wrong to make Artaxata only a check point.
  - Lycaonia reaches the Cilician coast.
  - Mysia crosses into Thrace and takes in Lesbos.
- **Two area ranges would fail a correct build:** Pisidia's ceiling and Mesopotamia's.
- **Licensing passes.**

| Region | Verdict | Blocking |
|---|---|---|
| Pisidia | Needs change (area range only) | R59 |
| Lycaonia | Needs change | R52 |
| Mysia | Needs change | R53 |
| Phrygia | Pass (R60 recommended) | — |
| Media | Needs change | R50, R51 |
| Mesopotamia | Needs change | R54–R58 |
| Parthian Empire | Pass: not outlined (PO-1) | — |
| Licensing | Pass | — |

**Sources opened, 2026-10-23 to 2026-10-24 (UTC):**
- **Pleiades** JSON and KML (the KML gives the representative point), at `https://pleiades.stoa.org/places/<id>/json` and `/kml`. IDs: 884148, 638748, 638804, 942276, 942333, 511194, 550506, 550706, 550833, 894084, 893951, 884179, 874354, 874361, 658636, 884109, 609367, 648651 and 638996.
- **Pliny**, Perseus (tr. Bostock and Riley), 6.9 and 6.10: `https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0137:book=6:chapter=10` (and `chapter=9`).
- **Strabo**, LacusCurtius (tr. Jones), 11.14 (`https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Strabo/11N*.html`) and 16.1.21–23 (`…/16A*.html`).
- **Wikidata Query Service** (P1584), for Carcathiocerta and Tigranocerta.
- **Geometry inputs**, as in Method 3 above: the pinned Natural Earth rivers, `data/geo/ancient-areas.geojson` and `data/locations/`. The scratch scripts in `/tmp/m520` aren't committed.

### RC1. Corrections R1–R49 and rulings PO-1 to PO-9
| Item | Verdict | Finding |
|---|---|---|
| R1–R30, R32–R34, R36–R44, R46, R48, R49 | Pass | Applied as written. The RL added some text around them, and that text has slips in six places (R64–R69). |
| R31 | Applied as written, but my correction was wrong | It made Artaxata only a check point. Without Artaxata as an outside anchor, Media's north-west doesn't close (RC4). Fixed by R50. |
| R35 | Needs change | The RL supplied Matiane, but it fails as an anchor (RC3b). Fixed by R51. |
| R39 | Pass, with fixes | Arsamosata (RC3a). Fixed by R54–R57. |
| R45 | Pass | §11's Parthian row gives the decided state, "**Not outlined, per PO-1**", instead of my "the PO decides". That is correct now that PO-1 has been ruled. |
| R47 | Needs change | Parts 3 and 4 are applied. Part 2 leaves the Pisidia and Lycaonia ceilings "pending that grid estimate". Part 1's text, pasted verbatim, no longer fits the new Arsamosata north line. Fixed by R58 and R59. |
| PO-1 to PO-9 | Pass | Each ruling is reflected. Two passages about Iconium cite PO-2 (which is about Rhagae) where M5-19's P5 is meant (R64, R65). |
| Gordion | Pass | It is no longer one of the East row's outside anchors. Pessinus, 50 km away, still keeps it outside, and the paragraph R21 asked for is there. |

### RC2. The IDs
All of these are confirmed in Pleiades. Each "Representative point" is the KML's "Calculated Representative Point (Centroid)", given as lon, lat.

| Place | ID | Pleiades title | Representative point | Verdict |
|---|---|---|---|---|
| Gazaca | 884148 | "Ganzak?/Gazaca?/Gazae?" | 46.202, 37.012 | Pass. The "?" marks an uncertain identification, which the note doesn't mention (R50, R61). |
| Antioch on the Maeander | 638748 | "Antiochia ad Maeandrum" | 28.548, 37.873 | Pass |
| Kibyra | 638804 | "Cibyra" | 29.492, 37.159 | Pass |
| Hecatompylos | 942276 | "Hecatompylos?/Komish/[(Shahr-i) Qumis]" | 54.038, 35.961 | Pass. The identification is uncertain (R62). |
| Hyrcania | 942333 | "Varkana/Hyrcania/Gurgan" | 56.3, 37.1 | Pass. The centroid includes a 1° Barrington cell, so the point is rough. It does no harm: its cell never borders Rhagae's (0 grid points), and Hecatompylos governs the east edge and the coast's east end, at about 52.5°E. |
| Apamea Myrlea | 511194 | "Brylleion/Myrleia/Apamea/Col. Iulia Concordia" | 28.883, 40.376 | Pass |
| Cyme | 550506 | "Cyme" | 26.938, 38.760 | Pass |
| Magnesia ad Sipylum | 550706 | "Magnesia ad Sipylum" | 27.433, 38.613 | Pass |
| Pitane | 550833 | "Pitane" | 26.938, 38.928 | Pass |
| Seleucia on the Tigris | 894084 | "Seleucia/Sliq Kharawta" | 44.524, 33.098 | Pass |
| Babylon | 893951 | "Babylon" | 44.425, 32.537 | Pass. §8 calls 896947 "the record's own id", but no record uses it (R67). |
| Bactra | 961886 | as in §2 | — | Pass (phase 2). Research only, per PO-1. |
| Matiane | 884179 | "Matiane" | 46.5, 36.5 | Right record, but its only location is the grid cell "BAtlas 90 B4", so the point is the cell's centre. Fails as an anchor (RC3b). |
| Arsamosata | 874354 | "Arsamosata" | 39.511, 38.661 | Pass. Its two DARMC locations (39.754, 38.618 and 39.268, 38.704) are 43.3 km apart, so the build should use the representative point (R54). |
| Artaxata | 874361 | "Artaxata" | 44.575, 39.882 | Pass. Reopened for R50. The point lies about 1 km from Natural Earth's Aras, on its north side. |
| Zeugma | 658636 | "Zeugma" | 37.870, 37.058 | Pass. Reopened for R55. |
| Adur Gushnasp/[Shiz] | 884109 | "Adur Gushnasp/[Shiz]" | 47.235, 36.604 | A test point only (RC3b). |
| Dorylaeum | 609367 | — | 30.517, 39.775 | Pass: the point is at Eskişehir. This closes a phase-2 "not verified" item. |
| Isaura Nova | 648651 | "Isaura (Nova)/Leontopolis" | 32.354, 37.190 | Pass. This closes a phase-2 "not verified" item. |
| Milyas | 638996 | — | 29.988, 36.765 | Pass (reprPoint) |

### RC3. The two gaps the Research Lead closed
**(a) Arsamosata, Mesopotamia's north outside anchor: pass, with fixes (R54–R57).**
- **The right place and ID.** `pleiades:874354` is "Arsamosata", with its representative point at 39.511°E 38.661°N. It has two DARMC locations, 43.3 km apart. The note's distances, 184 km to Edessa and 215 km to Nisibis, come from the first of them. From the representative point they are 178.6 km and 231.6 km.
- **Better sourced than the note says.** The note says "No passage read in this research names Arsamosata itself as Armenian". Pliny does: "The more famous towns in Lesser Armenia are Cæsarea, Aza, and Nicopolis; in the Greater Arsamosata, which lies near the Euphrates, Carcathiocerta upon the Tigris, Tigranocerta which stands on an elevated site, and, on a plain adjoining the river Araxes, Artaxata" (6.10). Pleiades' "part of Armenia Maior" connection (30 BC – AD 300) cites this same passage, as NH 6.26 in Mayhoff's numbering. Its "part of Sophene" connection is dated 330–30 BC.
- **Strabo's side holds.** In 11.14.2, Masius "lies above the Mygdonians of Mesopotamia on the south, in whose country is Nisibis, whereas Sophenê is situated in the northern parts, between Masius and Antitaurus". In 16.1.23, Nisibis "lies at the foot of Mt. Masius".
- **Acceptable under the card and M5-19's rules.** Arsamosata is a named place with an ID and a passage, on the stated side. It is not "a weaker kind of evidence" (§13). The line itself, though, is an equidistant construction that no author states, so the north edge's confidence is low, like the Asia Minor lines.
- **Where the line falls.** It meets the Euphrates at about 39.04°E 37.93°N. That is 141 km in a straight line from the Zeugma (`pleiades:658636`, 37.870°E 37.058°N). It meets the Tigris (Natural Earth's "Dicle") at about 40.34°E 37.83°N, and between the two rivers it runs at about 37.8°N.
- **The note disagrees with that line.** Its West row runs the Euphrates edge "from the Zeugma", and its confidence paragraph says "the Zeugma anchors the south-western corner precisely". The Zeugma is at the north-west, and with this line it isn't a corner at all. Strabo measures the river from "the Zeugma at Commagenê, where Mesopotamia begins" (16.1.22). The build needs one rule:
  - R55–R57 let the line govern, and the outline's note gives Strabo's phrase as the other reading.
  - The alternative, a sourced outside anchor on the east bank above the Zeugma, needs new research. It isn't required.
- **Not recommended as anchors:**
  - Tigranocerta: Strabo 16.1.23 puts it "at the foot of Mt. Masius" with Nisibis, while Pliny 6.10 lists it in Greater Armenia.
  - Carcathiocerta: it has no Pleiades ID in Wikidata.

**(b) Matiane, Media's west outside anchor: fails as an anchor (R51).**
- **The right record, but the wrong kind of point.** `pleiades:884179` has one location, the Barrington grid cell "BAtlas 90 B4". Its point (46.5°E 36.5°N) is the centre of that 1° cell, so it is known only to within about ±50 km. It lies 62.8 km from Gazaca, and south-east of Lake Urmia, not west of it as R35 asked.
- **As a seed, it decides Media's shape.** Its cell covers about 58,500 km² of the box 44–49°E, 34–39°N. It takes Adur Gushnasp/[Shiz] (`pleiades:884109`, 47.235°E 36.604°N) and the Sanandaj plateau (47.0°E 35.31°N) out of Media. That contradicts two sources:
  - ISBE: Media "extended thence to the Zagrus Mountains on the West".
  - Strabo 11.13.6: Greater Media is bounded "on the west by the Atropatii and certain of the Armenians", not by Matiane.
- **The rule I apply.** A rough point can be a seed only when its uncertainty is small against its distance to the nearest anchor on the other side.
  - Matiane: about ±50 km against 63 km. It fails, and its result contradicts the sources.
  - Hyrcania: 467 km from Rhagae. It passes, and it never borders Rhagae's cell.
  - The Milyas, which R7 kept: a Barrington label arc, so its point is a digitized position, and its cell puts no anchor on the wrong side.
- **Keep Matiane named, unlocated.** Strabo 11.13.2 ("lies east of Armenia and Matianê") stays as the source for Atropatene's western neighbours. Arbela closes the west edge, and Artaxata the north-west (R50).

### RC4. Anchors on both sides of every edge (item 5)
| Region | Finding | Verdict |
|---|---|---|
| Pisidia | Sourced anchors on both sides of every edge. The cell doesn't touch the sea. | Pass |
| Lycaonia | Every anchor-pair edge has both sides. But the south edge doesn't close: past Laranda, the cell reaches the Cilician coast (G-b). | Needs change (R52) |
| Mysia | Both sides on the east, south-east and south. The coast row gives no clip, so the cell crosses into Europe and takes in Lesbos (G-c). | Needs change (R53) |
| Phrygia | Sourced anchors on both sides of every edge. The cell doesn't touch the sea. | Pass |
| Media | The east, south-east, south and coast edges close. The north-west has no outside seed, and Matiane, as a seed, cuts Media's interior (G-a, RC3b). | Needs change (R50, R51) |
| Mesopotamia | Both sides on the north (Arsamosata) and the south (PO-8), and the two rivers. The north line's corner on the Euphrates isn't stated (RC3a). | Needs change (R54–R57) |

**G-a. Media's north-west doesn't close (B, R50).** My R31 made Artaxata only a check point. That was wrong:
- **With the note's seeds** (Matiane in, Artaxata only a check point), no outside anchor bounds Media between the upper Araxes and Arbela. Its cell runs west to the land east of Lake Van and to the Maku and Khoy plains, although Strabo puts Armenia and Matianê west of Atropatene (11.13.2).
- **With Artaxata as a seed and nothing else,** the equidistant line runs south of the Araxes all the way to the lower Kura. At 46°E it is at 38.66°N, against the river's 38.90°N; at 48°E, 39.32°N against 39.80°N. The line meets Natural Earth's river only on the Kura, at about 49.0°E 39.6°N. So Media would never reach the Araxes, against Strabo 11.13.3 ("the Araxes, which forms the boundary between Armenia and Atropatenê") and ISBE.
- **R50's rule** stays within M5-19's G0. It uses only the river, a straight segment between two anchors (Artaxata and Gazaca) and an equidistant line:
  1. The river, from the sea upstream to where it first meets the straight segment from Artaxata to Gazaca (44.60°E 39.83°N, 5.9 km from Artaxata).
  2. That segment, to the line equidistant from Artaxata and Gazaca (45.39°E 38.45°N; Artaxata–Gazaca is 349 km).
  3. That line, to the line with Arbela (about 44.25°E 38.04°N).

  East of the segment, Media reaches the river.

| Test point (lon, lat) | The note as written | Artaxata a seed, equidistant only | R50 |
|---|---|---|---|
| East of Lake Van (44.30, 38.60) | in | out | out |
| Khoy plain (44.97, 38.55) | in | out | out |
| Maku (44.51, 39.29) | in | out | out |
| South bank at Poldasht (45.07, 39.35) | in | out | in |
| South bank at Julfa (45.60, 38.93) | in | out | in |
| Mughan plain (47.90, 39.40) | in | out | in |
| Urmia, Tabriz, Ardabil | in | in | in |
| Adur Gushnasp/[Shiz] (47.235, 36.604) | out | in | in |
| Sanandaj plateau (47.00, 35.31) | out | in | in |
| Hakkari (43.74, 37.57); Nakhchivan, north bank (45.41, 39.21) | out | out | out |

No source I read places the Khoy plain on either side. Under R50 it falls on Armenia's side, west of the segment.

**G-b. Lycaonia reaches the sea (B, R52).** Check (e) says no outline touches the sea unless the research lists a coast, and §11 lists none for Lycaonia.
- **The leak.** From the corrected anchors, Lycaonia's equidistant cell reaches the Cilician coast between about 32.45°E and 34.69°E (141 sea cells at 0.02°).
- **An extra anchor isn't enough.** With an outside anchor at Coracesium alone (Strabo 14.4.2, "the beginning of Cilicia Tracheia"; I used a test point only), 86 sea cells would remain.
- **The fix.** Excluding the drawn `cilicia-tracheia` and `cilicia` areas leaves no coastal cell, and Lycaonia stays one piece, of about 17,200 km² (down from 26,400).
- **Why this fix fits the rules.**
  - It is sourced: ISBE Lycaonia ("on the South by Cilicia Tracheia") and Strabo 12.6.1.
  - It is G0-compliant, since it uses an existing area's edge.
  - No inside anchor lies in drawn Cilicia: Lystra, Derbe and Isaura Nova are in `galatia`, Isaura Vetus in `pamphylia` and Coropassus in `cappadocia`. Laranda, an outside anchor, is in `cilicia-tracheia`.

**G-c. Mysia crosses into Europe and takes in Lesbos (B, R53).**
- **The leak.** Mysia's cell takes about 12,900 km² of the drawn `thrace`, across the Hellespont and the Propontis. It also takes about 1,600 km² of `asia`'s islands, Lesbos among them: `mitylene.json`'s point (26.547°E 39.110°N) is nearest to Teuthrania (44.6 km).
- **The source.** ISBE bounds Mysia by "the Sea of Marmora" on the north and the "Hellespont" on the west, so the outline stops at the Asian shore. On the mainland it covers about 29,500 km².
- **Cyzicus.** Its point lies 0.09 km off the drawn coast, within the 1 km that M5-19's check (c) allows.

### RC5. The area ranges (item 4)
| Region | Grid estimate (0.02°, corrected anchors, land) | The note's range | Verdict |
|---|---:|---|---|
| Pisidia | 21,574 km² | 2,200–21,000 km² | **Fail:** a correct build would exceed the ceiling. Use 2,200–32,000 km², 1.5 times the estimate, the method of R47 part 2 (R59). |
| Lycaonia | 17,218 km² with R52 (26,447 km² without) | 7,400–43,000 km² | Pass |
| Mysia | 29,481 km² (mainland, R53) | 16,000–57,000 km² | Pass |
| Phrygia | 78,235 km² | 40,000–90,000 km² | Pass, with a 15% margin. But the ceiling is a hull, and §10 itself says a hull is no ceiling ("A hull widened to the outside anchors isn't one either"). R60 (40,000–117,000 km²) is recommended. |
| Media | about 369,000 km² (0.05°, with R50; a rough, hand-placed Caspian shore used only for this check) | 41,600–575,000 km² | Pass |
| Mesopotamia | 149,329 km² (the Arsamosata line, closed Babylon–Seleucia; 148,914 km² from the first DARMC location) | 100,000–150,000 km² | **Fail:** within 0.5% of the ceiling, and the paragraph still describes the Nisibis–Edessa close (about 123,000 km²). Use 100,000–180,000 km² (R58). Both long edges are pinned rivers and the south close is fixed, so 1.2 times the estimate is enough. |

The note's own figures, checked:
- Media's triangle: 41,476 km² (the note says about 41,600).
- Mysia's hulls: 16,102 and 58,766 km² (the note says about 16,000 and 56,700).
- Phrygia's hulls: 39,963 and 92,962 km² (the note says about 40,000 and 89,600).

The differences don't matter once R59 and R60 put the ceilings on the grid estimates.

**Kept out of shipped notes: pass.** "km²" appears only in §10, and §10 says the figures "must stay out of every shipped outline's own note". R53 adds no figure to any row.

### RC6. Corrections for the Research Lead (R50–R70)
(B) marks a fix that blocks the geometry phase. The section numbers are the note's.

**§7 Media**
- **R50 (B).** Replace the whole line that begins "| North-west (the Araxes, with Armenia) |" with:
  > \| North-west (the Araxes, with Armenia) \| Gazaca (`pleiades:884148`, confirmed this round, 46.202°E 37.012°N; Pleiades titles it "Ganzak?/Gazaca?/Gazae?", so its site is uncertain), Ecbatana (`pleiades:903021`, spot-checked directly — Pleiades' own alternate location, "CIGS location of Hamadān," confirms it) \| Artaxata (`pleiades:874361`, in Armenia; representative point 44.575°E 39.882°N, just north of Natural Earth's Aras), an outside anchor. The edge is the Araxes (Natural Earth's Aras, then the lower Kura to the sea; `pleiades:884118` names the river and isn't a point anchor), from the sea upstream to where it first meets the straight segment from Artaxata to Gazaca (about 44.60°E 39.83°N); then that segment, to the line equidistant from Artaxata and Gazaca (about 45.39°E 38.45°N); then that line, to where it meets the west edge's line with Arbela (about 44.25°E 38.04°N). East of the segment, the land between the equidistant line and the river is Media's, because the river is the boundary there \| Strabo 11.13.3 ("Their royal summer palace is situated in a plain at Gazaca"; "the Araxes, which forms the boundary between Armenia and Atropatenê"); ISBE Media ("bounded by the rivers Araxes and Cyrus, which separated it from Armenia"; "The chief cities of ancient Media were Ecbatana, Gazaea, and Ragae"); Pliny 6.10 (among the towns of Greater Armenia, "on a plain adjoining the river Araxes, Artaxata") \|
- **R51 (B).** In the West row, find:
  > Arbela (`pleiades:874341`, spot-checked directly, 44.011°E 36.190°N); Matiane (`pleiades:884179`, confirmed this round, Barrington Atlas grid cell "BAtlas 90 B4 Matiane", reprPoint about 46.5°E 36.5°N — a rough anchor, flagged as such)

  Replace with:
  > Arbela (`pleiades:874341`, spot-checked directly, 44.011°E 36.190°N); Artaxata (north-west row) closes the edge's north end. Matiane is named but not used as an anchor: Pleiades' only record under that name (`pleiades:884179`) is a 1°×1° Barrington grid cell, "BAtlas 90 B4 Matiane", whose centre (46.5°E 36.5°N) lies south-east of Lake Urmia, 63 km from Gazaca
- **R61.** Find "**Confidence:** medium, with the east edge low because of Rhagae." Replace with:
  > **Confidence:** medium, with the east and west edges low: the east because of Rhagae, the west because Gazaca's site is uncertain (Pleiades titles it "Ganzak?/Gazaca?/Gazae?") and Matiane is unlocated.

  In the same paragraph, find "`bib:pliny-natural-history` (6.29), `bib:isbe-media`". Replace with "`bib:pliny-natural-history` (6.10, 6.29), `bib:isbe-media`".
- **R62.** In the East row, make two changes:
  - Find "Hecatompylos (`pleiades:942276`, confirmed this round, 54.04°E 35.96°N)". Replace with:
    > Hecatompylos (`pleiades:942276`, confirmed this round, 54.04°E 35.96°N; Pleiades titles it "Hecatompylos?/Komish/[(Shahr-i) Qumis]", so the identification is uncertain)
  - Find "Hyrcania (`pleiades:942333`, confirmed this round)". Replace with:
    > Hyrcania (`pleiades:942333`, confirmed this round; a rough point, since its centroid includes a 1° Barrington cell, but its cell never borders Rhagae's, so Hecatompylos governs this edge)

**§4 Lycaonia**
- **R52 (B).** In the South row, find "| Laranda (`pleiades:648693`) |". Replace with:
  > \| Laranda (`pleiades:648693`); and the drawn `cilicia-tracheia` and `cilicia` areas (`data/geo/ancient-areas.geojson`), which the outline excludes. Without them, the equidistant build reaches the sea between about 32.4°E and 34.7°E \|
- **R64.** Find:
  > **Per PO-2 (which extends the M5-19 ruling P5 to this card), Iconium stays outside Lycaonia, on Phrygia's side**

  Replace with:
  > **Per the M5-19 ruling P5, Iconium stays outside Lycaonia, on Phrygia's side**

  PO-2 is about Rhagae.

**§5 Mysia**
- **R53 (B).** In the North-and-west row, find "| — (coast) | — | ISBE Mysia". Replace with:
  > \| — (coast) \| — (the outline is clipped to the Asian mainland: no island and no land in Europe. Without the clip, the equidistant build crosses the Hellespont and the Propontis into the drawn `thrace`, and takes in `asia`'s islands, Lesbos and `mitylene.json`'s point among them. Cyzicus's point lies 0.09 km off the drawn coast, within the 1 km that M5-19's check (c) allows) \| ISBE Mysia
- **R69.** Find "The coastal edge is the one natural feature among the seven regions' edges,". Replace with "The coastal edge is Mysia's one natural feature,". The old wording is wrong: Media's coast and the Euphrates, Tigris and Araxes are natural features too.

**§6 Phrygia**
- **R65.** In the South-east row, find "M5-19 ruling P5, extended by PO-2." Replace with "M5-19 ruling P5." This is R22 as written.
- **R68.** In the Extent paragraph, find "gives four neighbours:". Replace with "gives five neighbours:". The quotation names Galatia, Lycaonia, Pisidia, Mygdonia and Cappadocia.

**§8 Mesopotamia**
- **R54 (B).** Replace the whole line that begins "| North (the Taurus, with Armenia) |" with:
  > \| North (the Taurus, with Armenia) \| Nisibis (`pleiades:874623`, spot-checked directly, 41.215°E 37.067°N), Edessa, Carrhae \| Arsamosata (`pleiades:874354`, confirmed this round; its representative point, 39.511°E 38.661°N, since its two DARMC locations lie 43 km apart; 179 km from Edessa, 232 km from Nisibis). The line equidistant from the inside anchors and Arsamosata meets the Euphrates at about 39.0°E 37.9°N and the Tigris (Natural Earth's "Dicle") at about 40.3°E 37.8°N; beyond those points the rivers are the edge \| Strabo 16.1.21 ("on the north is the Taurus, which separates Armenia from Mesopotamia"); 16.1.23 (Nisibis "lies at the foot of Mt. Masius, and so do ... the regions of Carrhae and Nicephorium"); 11.14.2 ("Sophenê is situated in the northern parts, between Masius and Antitaurus," with "the royal city of Sophenê," Carcathiocerta, which this research could not find in Pleiades); Pliny 6.10 ("The more famous towns in Lesser Armenia are Cæsarea, Aza, and Nicopolis; in the Greater Arsamosata, which lies near the Euphrates"); Pleiades places Arsamosata in Armenia Maior (30 BC – AD 300) and, earlier, in Sophene (330–30 BC) \|
- **R55 (B).** Find "| West, south-west (the Euphrates, from the Zeugma) |". Replace with:
  > \| West, south-west (the Euphrates, from where the north edge's line meets it, at about 39.0°E 37.9°N, down past the Zeugma) \|
- **R56 (B).** Replace the paragraph that begins "**The north edge's outside anchor.**" with:
  > **The north edge's outside anchor.** Strabo's own Armenia chapter (11.14.2) places Sophenê, an Armenian district, "in the northern parts, between Masius and Antitaurus" — directly north of the Mesopotamian towns at the foot of Mt. Masius (16.1.23). Its own "royal city," Carcathiocerta, has no Pleiades record this research could find. Arsamosata (`pleiades:874354`) has one, and Pliny names it among the towns of Greater Armenia: "The more famous towns in Lesser Armenia are Cæsarea, Aza, and Nicopolis; in the Greater Arsamosata, which lies near the Euphrates" (6.10). Pleiades places it in Armenia Maior (30 BC – AD 300, citing Pliny) and, earlier, in Sophene (330–30 BC). Its two DARMC locations lie 43 km apart, so the build uses its representative point (39.511°E 38.661°N), 179 km from Edessa and 232 km from Nisibis. The line equidistant from Edessa, Carrhae and Nisibis inside and Arsamosata outside meets the Euphrates at about 39.0°E 37.9°N, some 140 km in a straight line above the Zeugma (`pleiades:658636`, 37.870°E 37.058°N), and the Tigris (Natural Earth's "Dicle") at about 40.3°E 37.8°N; beyond those points the rivers are the edge. Strabo measures Mesopotamia along the river from "the Zeugma at Commagenê, where Mesopotamia begins" (16.1.22); the outline's note gives that as the other reading of the north-west corner.
- **R57 (B).** Replace the paragraph that begins "**Confidence:** medium; the south edge is low." with:
  > **Confidence:** medium; the north and south edges are low. Both rivers are real, drawable features, and the Zeugma, where Strabo says Mesopotamia "begins" (16.1.22), lies on the west edge. The north edge has a sourced anchor on each side, Arsamosata outside (Pliny 6.10), but no source states the line, which is an equidistant construction; and the south edge is a straight close at Strabo's own narrows, not a named line. **Sources:** `bib:strabo-geography` (11.14.2, 16.1.3, 16, 21–23, 28), `bib:pliny-natural-history` (6.10, 6.30), `bib:livius-mesopotamia` (cite-only, already ruled; quote nothing from it), plus the Pleiades IDs above.
- **R66.** In the Extent paragraph, find:
  > — describing a short-lived high-water mark east of the river, while Strabo gives the boundary of his own day plainly elsewhere:

  Replace with "; Strabo gives the boundary of his own day plainly elsewhere:". The gloss is unsourced; R36 removed it once.
- **R67.** In the South row, find:
  > confirmed this round — the record's own id, "Untitled... around Babylon," `pleiades:896947`, is a wrong, 1°-grid-cell connection; Babylon itself is 893951, 44.424°E 32.540°N)

  Replace with:
  > confirmed this round, 44.425°E 32.537°N; `pleiades:896947`, cited in this note's first draft, is an untitled wall "around Babylon" in a 1° grid cell, not Babylon)

  No record in `data/` uses either ID.

**§10 Rough areas**
- **R58 (B).** Find:
  > Measured instead between the pinned Natural Earth rivers, the land is about 122,000–124,000 km². That runs from the Zeugma on the Euphrates and from 42.377°E 37.063°N on the Tigris, closed in the north through Nisibis and Edessa and in the south from Babylon to Seleucia. **Range for the check: 100,000–150,000 km².**

  Replace with:
  > Measured instead between the pinned Natural Earth rivers, closed in the south from Babylon to Seleucia (PO-8) and in the north by the line equidistant from Edessa, Carrhae and Nisibis inside and Arsamosata outside (§8), the land is about 149,000 km² (the Fact-Checker's 0.02° grid). Closed in the north through Nisibis and Edessa instead, it is about 122,000–124,000 km². **Range for the check: 100,000–180,000 km²**; the ceiling is about 1.2 times the estimate, because both long edges are pinned rivers and the south close is fixed.
- **R59 (B).** Find:
  > Before the GIS phase, give each a ceiling with its basis: for example, a grid estimate of the equidistant build from the corrected anchors, times 1.5. (From this note's uncorrected anchors, Pisidia comes to about 20,800 km², and Lycaonia to at least 42,500 km², or about 30,200 km² without Lake Tatta.) **Range for the check, pending that grid estimate: Pisidia about 2,200–21,000 km²; Lycaonia about 7,400–43,000 km².**

  Replace with:
  > Each ceiling therefore comes from the Fact-Checker's grid estimate (0.02°) of the equidistant build from the corrected anchors: Pisidia about 21,600 km²; Lycaonia about 17,200 km² with the drawn Cilicia areas excluded (§4), or 26,400 km² without them. **Range for the check: Pisidia about 2,200–32,000 km²** (1.5 times the estimate); **Lycaonia about 7,400–43,000 km²** (kept; about 1.6 times the unclipped estimate).
- **R60.** Find:
  > the combined inside-and-outside hull is about 89,600 km², a rough ceiling. **Range for the check: about 40,000–90,000 km².**

  Replace with:
  > the combined inside-and-outside hull is about 89,600 km², but that is not a true ceiling, since an equidistant cell reaches beyond its anchors. The Fact-Checker's grid estimate (0.02°) of the equidistant build is about 78,200 km². **Range for the check: about 40,000–117,000 km²** (1.5 times the estimate).

  After "**Range for the check: about 16,000–57,000 km².**", add " The Fact-Checker's grid estimate, on the Asian mainland, is about 29,500 km²."

**§11 Ready, partial, or not possible**
- **R63.** Make five replacements:
  - Find "| The Taurus (range, south), drawn by anchor pairs |". Replace with "| The Taurus (range, south), drawn by anchor pairs and the drawn Cilicia areas' edge (§4) |".
  - Find "| Yes: the Propontis, the Hellespont and the Aegean to the Caicus outlets |". Replace with "| Yes: the Propontis, the Hellespont and the Aegean to the Caicus outlets (the Asian mainland only) |".
  - Find "| medium (the east edge low) |". Replace with "| medium (the east and west edges low) |".
  - Find "The Araxes (river, north-west)". Replace with "The Araxes (river, north-west, from Artaxata down)".
  - Find "| medium (the south edge low) |". Replace with "| medium (the north and south edges low) |".

**§12–§14**
- **R70.** Make five changes:
  1. In §12, find "; [6.29, the Parthian Empire and Media](". Replace with:
     > ; [6.10, Armenia](https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.02.0137%3Abook%3D6%3Achapter%3D10); [6.29, the Parthian Empire and Media](
  2. In §13, replace the item that begins "- **Mesopotamia's north outside anchor** (§8, correction R39):" with:
     > - **Mesopotamia's north outside anchor** (§8, correction R39): Arsamosata (`pleiades:874354`). Pliny names it among the towns of Greater Armenia (6.10), and Pleiades places it in Armenia Maior (30 BC – AD 300) and, earlier, in Sophene, which Strabo puts "between Masius and Antitaurus" (11.14.2). The anchor meets the card's rule; the line itself is an equidistant construction no source states, so the north edge is low. Strabo's "royal city" of Sophene, Carcathiocerta, has no Pleiades record this research could find.
  3. In §13, replace the item that begins "- **Media's west edge's "Matiane" anchor** (§7, correction R35):" with:
     > - **Media's west: Matiane is named, not used as an anchor** (§7, correction R35). Pleiades' only record under that name (`884179`) is a 1°×1° Barrington grid cell whose centre lies south-east of Lake Urmia, 63 km from Gazaca; as an anchor it would cut Media's own Zagros interior out of the outline. Arbela closes Media's west, and Artaxata its north-west (§7).
  4. In §13, replace the item that begins "- **Mysia's and Phrygia's area ceilings** (§10):" with:
     > - **Mysia's and Phrygia's area ceilings** (§10): replaced by the Fact-Checker's grid estimates of the equidistant build.
  5. In §14, replace items 2, 3 and 4 with:
     > 2. **Mesopotamia's north edge, Arsamosata** (§8): answered by the Fact-Checker's re-check. Pliny 6.10 names it as Armenian, so the anchor stands; the north edge is low.
     > 3. **Media's "Matiane" anchor** (§7, §13): answered by the Fact-Checker's re-check. The grid cell isn't used as an anchor; Artaxata closes the north-west.
     > 4. **Mysia's and Phrygia's area ceilings** (§10, §13): answered by the Fact-Checker's re-check, with grid estimates (§10).

### RC7. Advice on the note's §14 open questions
1. **Pisidia and Lycaonia crossing provinces.** Agreed: settled by M5-19.
2. **Arsamosata.** Acceptable, and better than the note says: Pliny 6.10 names it among the towns of Greater Armenia, so it meets the card's anchor rule outright. Use its representative point, mark the north edge low, and state where the line meets the rivers (R54–R57). Don't leave the edge as the unanchored Taurus.
3. **Matiane.** Not acceptable as a seed (RC3b). Name it as an unlocated neighbour; Artaxata closes the north-west instead (R50, R51).
4. **Mysia's and Phrygia's ceilings.** Re-checked with grid estimates. Mysia's range stands. Phrygia's ceiling should be 117,000 km² (R60).
5. **Cadi.** Agreed (PO-5). The GIS check should accept Cadi on the line only if the build makes it a vertex; otherwise Cadi goes on Phrygia's side.
6. **The Parthian Empire.** Agreed: settled by PO-1.

### Checks run (re-check)
- **Grid estimates (0.02°, corrected anchors, land mask from the drawn mainland areas):**
  - Pisidia 21,574 km².
  - Lycaonia 26,447 km²; 17,218 km² with drawn Cilicia excluded, in one piece, with 0 coastal cells (26 before).
  - Mysia 29,481 km² on land; 61,955 km² including the sea, `asia`'s islands (1,556 km²) and `thrace` (12,883 km²).
  - Phrygia 78,235 km².
- **Lycaonia's leak:** 141 sea cells, between 32.45°E and 34.69°E; 86 with a Coracesium test point (31.99°E 36.54°N).
- **Mesopotamia:**
  - Between the Natural Earth rivers, with the Arsamosata line and the Babylon–Seleucia close: 149,329 km² (148,914 km² from the first DARMC location).
  - The line crosses the Euphrates ("Firat") at 39.04°E 37.93°N, 141 km from the Zeugma, and the Tigris ("Dicle") at 40.34°E 37.83°N.
  - It runs at 37.99°N at 38.9°E, 37.81°N at 39.5°E and 37.76°N at 40.2°E.
  - Arsamosata's representative point is 178.6 km from Edessa and 231.6 km from Nisibis. From its first location: 182.9 and 214.6 km. Its two locations are 43.3 km apart.
- **Media:**
  - Nearest-anchor tests for the three variants in RC4, using Natural Earth's Aras and Kura.
  - Matiane's cell: 58,481 km² in 44–49°E, 34–39°N. Gazaca–Matiane: 62.8 km. Rhagae–Hyrcania: 467 km. Hyrcania is never the neighbour of Rhagae's cell.
  - Area under R50: about 369,000 km², on a 0.05° grid, with the Caspian shore placed roughly by hand for this check only.
  - The Artaxata–Gazaca segment meets the Aras three times within 6 km of Artaxata. The first crossing upstream from the Kura is the one at 5.9 km.
- **Point in polygon:** Lystra, Derbe and Isaura Nova in `galatia`; Isaura Vetus in `pamphylia`; Coropassus in `cappadocia`; Laranda in `cilicia-tracheia`; `mitylene.json` on an `asia` island; Cyzicus 0.09 km outside `asia`'s coast.
- **Text checks:**
  - Grepped for each R1–R49 replacement and each PO ruling.
  - Grepped `data/` for 896947 and 893951 (no hits).
  - "km²" appears only in §10.
  - Each find string in R50–R70 occurs exactly once in `c9dc5db`.

### Licensing (re-check)
**Pass.** The new citations come from sources already ruled on:
- Pliny 6.10 is the public-domain Bostock and Riley translation (L2).
- Strabo is LacusCurtius, public domain (L1).
- Pleiades is CC BY 3.0 (L4).
- R52 uses the project's own drawn areas.

Several locations are OpenStreetMap-derived and so ODbL: Artaxata's ("OSM Location: Khor Virap"), Babylon's (an OSM location), and the points of Kibyra ("osm-location-of-kibyra") and Cyme ("osm-location-of-cyme"). As with L5, they are fine in `data/geo/` and must never be copied into the CC BY-SA records. `docs/LICENSES.md` and `ATTRIBUTION.md` need no change.

### Sign-off (re-check)
**Not signed off for the geometry phase yet. The blockers are R50–R59:**
- Media's north-west and west (R50, R51).
- Lycaonia's Cilicia exclusion (R52).
- Mysia's mainland clip (R53).
- Mesopotamia's north edge and corner (R54–R57).
- The Mesopotamia and Pisidia ranges (R58, R59).

Each is exact text. If the Research Lead applies R50–R59 verbatim, the geometry phase is signed off without another fact-check round. The GIS check (e) and the area ranges then test the build. R60–R70 should go in the same pass, but they don't block the build. Licensing is signed off.

## Phase 4: the drawn outlines
- **Checked:** branch `data/m5-20-region-anchors` at `cb75908` (local branch `fc/m5-20-phase4`, the same commit):
  - the six M5-20 features of `data/geo/region-outlines.geojson`, built by `scripts/build-region-outlines.mjs` with the seed groups in `scripts/lib/m5-20-region-groups.mjs`;
  - `data/geo/region-anchors.json`;
  - the outline checks in `scripts/check-ancient-geo.mjs`;
  - the six screenshots in `/tmp/m5-20-shots-r3/`.

  I checked them against the research note (§3–§8, §10, §11), PO-1 to PO-10, the PO's seed and geometry rulings (G0, G0.1) and M5-19's G-rules.
- **Verifier:** fact-checker · **Date:** 2026-10-24 (UTC).

**Result: conditional. The outlines can't ship yet.** Media, Mysia and Lycaonia are built as the research and the rulings say, apart from two extra seeds in Mysia that move no Mysian line (P4-F4). The build reproduces byte for byte, every Inside and Outside anchor of §3–§8 is on its stated side, and every anchor matches its Pleiades or Wikidata record exactly. But three edges contradict their sources or the research's stated construction, and every note must be rewritten:
1. **Phrygia runs into Bithynia**, the failure the card names. Its tip reaches 41.07°N, 30 km from the Black Sea, and it holds Bithynium, which Strabo puts "In the interior of Bithynia" (12.4.7).
2. **Pisidia runs into Lycia.** Its south-western tail reaches 36.56°N and holds Balbura, which Murena "included ... within the territory of the Lycians" (Strabo 13.4.17).
3. **Mesopotamia's west edge** doesn't share the empire's edge where that edge follows the Euphrates (§8; M5-19's G10.1). It overlaps the drawn `commagene` and `syria` by about 1,000 km².
4. **All six notes** describe the build ("PO-3/R52", "equidistant construction", "outside anchor fallback"), cite the wrong rulings and leave out most of the disputes the research requires. Phrygia's says Pliny disagrees about Cadi; he doesn't mention it.

Items 1 and 2 need one sourced outside anchor each. I've checked both (P4-F1, P4-F2). With them, no anchor changes side and both areas stay in range. Licensing passes.

My re-check (RC4) passed Pisidia and Phrygia because every edge had anchors on both sides. It didn't test where the cells ended. On these two edges that was wrong.

### What I checked

| # | Check | Finding | Verdict |
|---|---|---|---|
| P4-1 | The seeds (ruling: exactly the anchors in the tables' Inside and Outside columns) | Group A has 58 seeds and group B 16. Every §3–§8 table anchor is a seed with its stated label: Apollonia is Phrygian (PO-10); Carura, Babylon and Seleucia are outside; Arbela is a seed (Media's West row). Ctesiphon, Pitane, the Zeugma, Matiane and the Catacecaumenê aren't seeds.<br>• **Two extra seeds:** `adramyttium-anchor` and `assos-anchor` (Mysia) are in no column.<br>• Without them no cell of Mysia's mainland changes. Other lines move by at most one 0.02° grid cell, because the group's mean latitude goes from 38.353° to 38.312°. | **Fix needed** (P4-F4) |
| P4-2 | G0.1, re-derived independently | My own nearest-seed labelling on a 0.02° grid of Natural Earth land, in each group's local plane (φ0 38.3530° for A, 35.2652° for B):<br>• Pisidia (21,551 km²) and Phrygia (77,578 km²) equal the outlines, with 0 mismatched cells.<br>• Lycaonia differs only by the drawn `cilicia-tracheia` (5,920 km²) and `cilicia` (2,810 km²), and 28 km² of shore near Anamur (P4-10).<br>• Mysia differs only by `thrace` (31,233 km²), `asia`'s islands (1,537 km²) and 1,013 km² of other islands and European shore.<br>• Media adds Artaxata's cell east of the Artaxata→Gazaca segment (11,274 km²; every cell is nearest Artaxata and east of the segment). It loses the Media cells north of the lower Kura (1,705 km², 48.95–50.61°E).<br>Shared edges are built once (Mysia–Phrygia 4 shared vertices, Pisidia–Phrygia 11, Pisidia–Lycaonia 3, Lycaonia–Phrygia 5). The six overlap neither one another nor the eleven M5-19 outlines. | Verified |
| P4-3 | Every §3–§8 anchor and check point on its stated side | Inside and outside respectively: Pisidia 9 and 14; Lycaonia 5 and 8; Mysia 6 and 10; Phrygia 15 and 9; Media 3 and 7; Mesopotamia 3 and 1 (Arsamosata).<br>• Ctesiphon is out, 2.1 km from the edge. Arbela is out, 62.9 km. `mesopotamia.json`'s point is in, 28.4 km. Babylon and Seleucia are the south line's end vertices (PO-8).<br>• Cadi is in Phrygia (PO-5), 73 km from the Mysia line. Carura is out, 13.8 km from Phrygia (the 12.8.16 fallback).<br>• Pitane is out, 0.33 km off Natural Earth's coast, in Elaea's cell (Q2).<br>• The Catacecaumenê is 72.5 km from the Mysia–Phrygia corner, not "at the corner" (PO-B). | Verified (PO-B) |
| P4-4 | Phrygia's north edge (Phrygia Epictetus with Bithynia) | **No outside anchor lies near it.** North of Dorylaeum and Midaeum the nearest are Prusa, Nicomedia and Ancyra, so Midaeum's cell runs to 31.713°E 41.071°N, 30 km from the Black Sea. Inside it, by Pleiades' points:<br>• Bithynion/Claudiopolis (`844879`, "An ancient settlement in Bithynia"), 13.7 km from the edge. Strabo: "In the interior of Bithynia are, not only Bithynium, ... but also Nicaea, the metropolis of Bithynia" (12.4.7).<br>• Gordioukome/Iuliopolis (`844935`) and Modra (`845022`).<br>Phrygia holds 9,355 km² of the drawn `bithynia`. The card names "Phrygia ran into Bithynia" as the M5-19 failure to avoid. | **Fail** (P4-F2) |
| P4-5 | Pisidia's south-west edge (Lycia, the Milyas, the Kibyratis) | **No outside anchor lies south-west of Sinda.** Sinda's cell, between Kibyra and the Milyas, runs to 29.223°E 36.563°N, 8 km from Pinara in the Xanthos valley. Inside it:<br>• Balboura (`638789`), 11.3 km from the edge. Strabo: "Murena overthrew it and included Balbura and Bubon within the territory of the Lycians" (13.4.17).<br>• Oenoanda (`639013`, "located in Lycia"), 2.4 km; and Araxa (`638760`), 4.4 km.<br>This contradicts ISBE ("bounded by Lycia on the West") and 13.4.17. M5-19's G4.1 accepted Sinda and Kibyra lying in the drawn `lycia`, not the land beyond them. | **Fail** (P4-F1) |
| P4-6 | The coasts | **Mysia:** the Asian mainland only. It holds 0 km² of `thrace` and no island. Cyzicus is inside, 0.02 km from the edge.<br>**Media** (PO-7): the Caspian, from the Kura's mouth (49.367°E 39.351°N) to 52.546°E 36.703°N, where Rhagae and Hecatompylos are equidistant (157.9 and 157.1 km).<br>No other outline touches the sea. The nearest vertices are 9.7 km (Pisidia), 19.3 km (Lycaonia) and 29.9 km (Phrygia) from Natural Earth's coast. | Verified |
| P4-7 | Media's north-west (R50) | Natural Earth's Kura runs from the sea to the confluence, then the Aras upstream. The Aras ends 67.7 m from the Kura by my measure; the build's connector, 58 m, is far inside its 200 m simplification.<br>• The Artaxata→Gazaca segment crosses the Aras three times: 2.70, 3.83 and 5.86 km from Artaxata. The build uses the 5.86 km crossing (44.6026°E 39.8336°N), the first met going upstream from the sea, as §7 says.<br>• The edge then runs along the segment to its midpoint (45.3885°E 38.4471°N) and along the equidistant line to the Artaxata/Gazaca/Arbela vertex (44.3002°E 38.0358°N). §7's "about 44.25°E" was computed in another plane.<br>• The R50 test points fall as stated. Maku, the Khoy plain, east of Lake Van, Nakhchivan, Hakkari and Hajigabul are out. Poldasht, Julfa, the Mughan plain, Urmia, Tabriz, Ardabil, Adur Gushnasp and the Sanandaj plateau are in. | Verified |
| P4-8 | Mesopotamia: the rivers, the north line and the south close | **Rivers:** 656 vertices lie on Natural Earth's Euphrates and 368 on its Tigris, each within 1 m. Densified, the edges stay within 148 m of the lines, the 150 m simplification.<br>**North line:** its 4 inner vertices are equidistant, to within 1 m, from Arsamosata and the nearest of Edessa, Carrhae and Nisibis (group-B plane). It crosses each river once: the Euphrates at 39.048°E 37.937°N, 142.7 km from the Zeugma, and the Tigris at 40.342°E 37.830°N.<br>**South:** Babylon and Seleucia are vertices. Each connector is the true shortest: Babylon to the Euphrates 14.468 km, exactly the built vertex; Seleucia to the Tigris 4.023 km, built within 14 m of it. | Verified |
| P4-9 | Mesopotamia's west edge and the empire's edge (§8, West row; G10.1: "share the line of the empire's edge where it follows the river") | **Not shared.** The build uses Natural Earth's Euphrates throughout. From 35.85°N to 37.93°N the outline overlaps the drawn `commagene` (583 km², up to 7.7 km deep) and `syria` (423 km², up to 5.9 km), and it leaves 364 km² between their edge and its own. | **Fix needed** (P4-F3) |
| P4-10 | Lycaonia: the Cilicia exclusion (R52) and the two dropped parts | Lycaonia overlaps `cilicia` and `cilicia-tracheia` by 0 km². The build drops two detached parts, of 34.804 and 1.092 km². My grid puts them on the shore at 32.51–32.73°E 36.05–36.11°N, on land the drawn Cilicia areas' coast leaves out. Kept, they would give Lycaonia a coast. §11 gives it none, and §4 bounds it by Cilicia Tracheia, so dropping them matches the research. | Verified |
| P4-11 | Lake Tatta (PO-3) | The lake's point (`619268`, read from its KML) and the check's point lie in neither outline. The southern tip of Natural Earth's "Lake Tuz", 10.4 km² of its 1,564 km², lies inside Lycaonia. | Verified (P4-S1, optional) |
| P4-12 | The areas (§10) | My spherical areas equal the PO's: Pisidia 21,554.8, Lycaonia 16,934.5, Mysia 30,073.4, Phrygia 77,588.2, Media 359,943.2 and Mesopotamia 149,346.4 km². All are within §10's ranges. After P4-F1 and P4-F2, my grid gives Pisidia about 20,500 and Phrygia about 72,300 km², still within. | Verified |
| P4-13 | `region-anchors.json` | **Tolerance:** 0.01 km from the cited record.<br>• All 74 Pleiades anchors that M5-20 uses equal Pleiades' representative point (0.000 km), and each title names the place. Lake Tatta's point comes from its KML, because its JSON returned 502.<br>• The 4 Wikidata anchors (Q849709, Q18986, Q719815, Q209349) equal their first P625 exactly.<br>• **Second source:** Wikidata has a P625 for 70 of the 74 (through P1584), median 0.25 km. Over 2 km: Hyrcania 115 km (a region); Lystra 14.4 km (Wikidata's point; Pleiades and `lystra.json` agree); Lake Tatta 10.9 km (a lake); Hecatompylos 5.95 km (identification uncertain); Tyana 4.4 km.<br>• The records the research names agree with their anchors to within 1.06 km: Attalia, Perga, Lystra, Derbe, Iconium, Antioch, Laodicea, Colossae, Pergamum, Philadelphia, Adramyttium and Assos. | Verified |
| P4-14 | The notes | They don't meet the rule for shipped copy:<br>• **Process codes:** "PO-3/R52", "PO-6/R53", "PO-5", "R23/A12", "PO-7/R50", "R54–R57", "M5-19 ruling P5".<br>• **Build words:** "clipped", "equidistant construction", "outside anchor fallback", "single-point shared boundary", "through-point shared line".<br>• **Wrong codes:** Lycaonia's Cilicia cut is R52, not PO-3; Mysia's clip is R53, not PO-6; Media's north-west is R50, not PO-7.<br>• **A false clause:** Phrygia's "Strabo and Pliny disagree ... on Cadi's side". Pliny says nothing about Cadi; Strabo gives both readings (12.8.12).<br>• **Missing:** the Troad; Cadi with 12.8.12; Iconium in Phrygia's note; both Lake Tatta passages; Rhagae's 11.9.1; Carura's 12.8.17; Apollonia; Gordium; Pliny's and Arrian's Mesopotamia; the Zeugma's 16.1.22.<br>No note gives an area. | **Fix needed** (P4-F5) |
| P4-15 | `sources` and `confidence` | Every `bib:` id is in `data/bibliography.json`. Every `pleiades:` and `wikidata:` id names its place (P4-13). `naturalearth:ne-10m-rivers-lake-centerlines` matches `schema/source-id.schema.json`. The file passes its schema (Ajv), and `validate:data` passes. `confidence` is `low` for Pisidia, Lycaonia, Mysia and Phrygia and `medium` for Media and Mesopotamia, as in §11. | Verified (P4-F6) |
| P4-16 | Reproducible | `check:ancient-geo`, run under the lock: it checked the 15 pinned inputs and rebuilt `data/geo/` byte for byte from an empty cache, in 121 s. "Region outline checks passed (a) through (g)"; step (f) took 54 s. | Verified |
| P4-17 | The record points (check b) | The record points of `pisidia`, `mysia`, `phrygia`, `media` and `mesopotamia` lie inside their outlines. `lycaonia.json`'s point lies in Phrygia, 15.4 km from Lycaonia (PO-4; Q1). The PO's points are inside: Derbe (both candidates) and Lystra; Adramyttium, Assos, Pergamum and Troas; Antioch, Colossae, Hierapolis, Iconium and Laodicea. | Verified |

### Changes required before shipping (GIS Engineer)
P4-F1 and P4-F2 each add one outside anchor, and I have checked both. The Research Lead adds one row to the note for each, and the GIS Engineer rebuilds. If the rows go in as written, the sources need no further check.
- **P4-F1. Pisidia's south-west: Balbura outside.**
  - **Research note §3, West row.** In the Outside column, after "the Milyas (`pleiades:638996`)", add "; Balbura (`pleiades:638789`, "Balboura", 29.582°E 36.953°N)". In the Source column, after the 14.3.9 entry, add "; 13.4.17 ("Murena overthrew it and included Balbura and Bubon within the territory of the Lycians")".
  - **Anchors.** Add `{ "id": "balbura", "sourceId": "pleiades:638789", "coordinates": [29.58230975, 36.95264135] }` to `region-anchors.json`, and add `"balbura"` to `outside` in `GROUP_A_LABELS`.
  - **Expected:** Pisidia's corners become 29.4946°E 37.0446°N (Sinda, Kibyra, Balbura) and 29.9004°E 37.0116°N (Sinda, Balbura, the Milyas). Balboura, Boubon, Oenoanda and Araxa fall outside, and Sinda stays in.
- **P4-F2. Phrygia's north: Bithynium outside.**
  - **Research note §6, North-east row.** In the Outside column, after "Prusa (`pleiades:511384`)", add "; Bithynium (`wikidata:Q65088749`, the existing anchor `claudiopolis-bithynia`, 31.612°E 40.739°N; Pleiades `844879`, "Bithynion/Claudiopolis/Hadriana")". In the Source column, add "; 12.4.7 ("In the interior of Bithynia are, not only Bithynium, ... but also Nicaea, the metropolis of Bithynia")".
  - **Anchors.** Add `"claudiopolis-bithynia"` to `outside` in `GROUP_A_LABELS`. Its point is already in `region-anchors.json` (Wikidata's P625, verified in M5-19).
  - **Expected:** Phrygia's north ends at 30.7591°E 40.5054°N (Midaeum, Bithynium, Nicomedia) and 31.6961°E 40.0350°N (Midaeum, Bithynium, Pessinus). Bithynion, Gordioukome/Iuliopolis and Modra fall outside. Modra is a trade-off (PO-A).
- **P4-F3. Mesopotamia's west edge.** Where `data/geo/ancient-empire-edge.geojson` follows the Euphrates, from about 35.85°N to the north line, make it Mesopotamia's west edge in place of Natural Earth's river (§8, West row; G10.1). Keep the river elsewhere, and keep the north edge on the Arsamosata line. Accept when:
  - Mesopotamia overlaps no drawn area (under 1 km²);
  - no strip wider than the simplification lies between it and `syria` or `commagene`.
- **P4-F4. The seeds.** Remove `adramyttium-anchor` and `assos-anchor` from `GROUP_A_LABELS`, per the seed ruling. Both stay in check (c) as `mysia`'s children, and my test keeps both inside.
- **P4-F5. The notes.** Replace the six notes with these, verbatim or with the same facts and quotations. Pisidia's assumes P4-F1, Phrygia's P4-F2 and Mesopotamia's P4-F3.
  - **Pisidia:** "Pisidia, the mountain country above the Pamphylian plain. Strabo says most Pisidians 'occupy the summits of the Taurus, but some, situated above Sidê and Aspendus, Pamphylian cities, occupy hilly places' (Geography 12.7.1). The International Standard Bible Encyclopedia (ISBE) says Pisidia 'was bounded by Lycia on the West, by the Phrygian country on the North, and by Isauria on the East', and that toward Isauria 'the frontier was never strictly drawn' ('Pisidia'). No source this project cites gives a line, so each edge is drawn halfway between towns the sources place on either side, and is approximate. Sinda, in the south-west, is inside: Artemidorus counts it among 'the cities of the Pisidians' (Strabo 12.7.2), but Strabo also groups 'Greater Cibyra and Sinda and Cabalis' (13.4.15). Cibyra is outside, and so is Balbura, which, Strabo says, Murena 'included ... within the territory of the Lycians' (13.4.17). Antioch and Apollonia, to the north, are drawn in Phrygia: ISBE places Antioch 'in Galatian Phrygia, near the northern border of Pisidia' ('Pisidia') and names Antioch, Iconium and Apollonia among Galatian Phrygia's important cities ('Phrygia'). Pliny instead puts 'the colony of Cæsarea, also called Antiochia' in the Pisidians' country (Natural History 5.24)."
  - **Lycaonia:** "Lycaonia, the plain of south-central Asia Minor, drawn as its western, Roman part, where Lystra and Derbe lay (Acts 14:6). Strabo describes 'the plateaus of the Lycaonians' as 'cold, bare of trees, and grazed by wild asses' (Geography 12.6.1). He puts the boundary with Cappadocia 'between Coropassus, a village of the Lycaonians, and Garsaüra, a town of the Cappadocians' (12.6.1). The International Standard Bible Encyclopedia (ISBE) bounds Lycaonia 'on the South by Cilicia Tracheia', so the outline stops at this map's Cilicia and does not reach the sea. ISBE also says 'The boundary of Phrygia and Lycaonia passed between Iconium and Lystra' ('Lycaonia'), and this map follows it, drawing Iconium in Phrygia. But Strabo names Iconium with the Lycaonian plateau ('In this neighbourhood is also Iconium', 12.6.1), and Pliny places 'the famous city of Iconium' in 'a Tetrarchy of Lycaonia' (Natural History 5.25). Laranda is outside, with the eastern part of Lycaonia, which ISBE says 'included the important city of Laranda'. Lake Tatta is in neither this outline nor Phrygia's: Strabo calls it 'a part of Greater Phrygia' (12.5.4), but also says Greater Phrygia 'leaves on the left Pessinus and the region of Orcaorci and Lycaonia' (12.8.13). The other edges are drawn halfway between towns the sources place on either side, and are approximate."
  - **Mysia:** "Mysia, in north-western Asia Minor. The International Standard Bible Encyclopedia (ISBE) says 'its boundaries were always vague', but that it reached 'on the North to the Sea of Marmora on the East to Bithynia and Phrygia, on the South to Lydia, and on the West to Hellespont', and that 'According to some authors it included the Troad' ('Mysia'). This outline includes the Troad, which is disputed: Strabo says 'Mysia and Olympus come after the Troad' (Geography 12.4.6). The coast is the Asian mainland's; the islands are left out. In the south, Strabo's Mysia takes in 'the country in the neighbourhood of the Caïcus River and Pergamenê, extending as far as Teuthrania and the outlets of the river' (12.8.1), so Elaea, at the river's mouth, is inside. Pliny instead lists 'the town of Elæa, the river Caïcus, which flows from Mysia, the town of Pitane' in 'Æolis ..., formerly known as Mysia' (Natural History 5.32). Cadi is drawn in Phrygia: Strabo lists it among the cities of Phrygia Epictetus, 'and also Cadi, which, according to some writers, belongs to Mysia' (12.8.12). Strabo says Mysia 'lies between Mt. Ida and Catacecaumenê', which is 'by some called Mysian and by others Maeonian' (12.8.12); the Catacecaumenê is outside this outline. The inland edges are drawn halfway between towns the sources place on either side, and are approximate."
  - **Phrygia:** "Phrygia, the uplands of west-central Asia Minor. Under Rome it was split between the provinces of Asia and Galatia, 'but the line between them was never sharply drawn', and its boundaries 'were always vague' (International Standard Bible Encyclopedia, ISBE, 'Phrygia'). Strabo says Greater Phrygia 'leaves on the left Pessinus and the region of Orcaorci and Lycaonia, and on the right the Maeonians and Lydians and Carians' (Geography 12.8.13). No source this project cites gives a line, so each edge is drawn halfway between towns the sources place on either side, and is approximate. Antioch, Iconium and Apollonia are inside: ISBE names them as Galatian Phrygia's 'important cities'. But Pliny puts Antioch in Pisidia (Natural History 5.24) and Iconium in 'a Tetrarchy of Lycaonia' (5.25), and Strabo names Iconium with the Lycaonian plateau (12.6.1). Cadi is inside: Strabo lists it among the cities of Phrygia Epictetus, 'and also Cadi, which, according to some writers, belongs to Mysia' (12.8.12). Carura is just outside: Strabo says it 'forms a boundary between Phrygia and Caria' (12.8.17), and also puts it 'in the neighbouring country' to Laodiceia (12.8.16). In the north, Bithynium, which Strabo places 'In the interior of Bithynia' (12.4.7), is outside. So is Modra, though Strabo puts it 'in Phrygia on the Hellespont' (12.3.7). Lake Tatta is in neither this outline nor Lycaonia's: Strabo calls it 'a part of Greater Phrygia' (12.5.4), but, as above, Greater Phrygia leaves Pessinus and Orcaorci on its left (12.8.13). Gordium, among 'the ancient habitations of the Phrygians' on the Sangarius, is outside, in the Galatians' land where Strabo describes it (12.5.3)."
  - **Media:** "Media, with Atropatene, west and south-west of the Caspian. Strabo says Media 'is divided into two parts', Greater Media, with its metropolis at Ecbatana, and 'Atropatian Media' (Geography 11.13.1). The International Standard Bible Encyclopedia (ISBE) says Media 'Lay to the West and Southwest of the Caspian' and 'included Atropatene', and adds that 'Lake Spauta is now known as Urmi' ('Media'). The north-west edge is the Araxes, 'which forms the boundary between Armenia and Atropatenê' (11.13.3), and the lower Cyrus to the sea. ISBE: 'On the North in later times it was bounded by the rivers Araxes and Cyrus, which separated it from Armenia'. Near Artaxata, a town of Greater Armenia (Pliny, Natural History 6.10), the edge leaves the river along the straight line from Artaxata to Gazaca for about 170 km. Rhagae is inside, as one of ISBE's 'chief cities of ancient Media', 'Ecbatana, Gazaea, and Ragae'. But Strabo counts 'the whole region that extends as far as the Caspian Gates and Rhagae and the Tapyri, which formerly belonged to Media' as Parthian in his day (11.9.1), so Rhagae and the east end of the coast are disputed. Gazaca, where the kings of Atropatene had their 'royal summer palace' (11.13.3), is inside, but its site is uncertain (Pleiades). The other edges are drawn halfway between towns the sources place on either side: Artaxata in Armenia, Arbela to the west, Susa, Persepolis and Pasargadae to the south, and Hecatompylos, 'the royal seat of the Parthians' (11.9.1), to the east. They are approximate."
  - **Mesopotamia:** "Mesopotamia, which Strabo says 'lies between the Euphrates and the Tigris', with 'the Taurus, which separates Armenia from Mesopotamia' to the north (Geography 16.1.21). Its east edge is the Tigris. Its west edge is the Euphrates, the frontier with Rome: 'The Euphrates and the land beyond it constitute the boundary of the Parthian empire' (16.1.28). In the south it closes between Babylon and Seleucia, where Strabo puts 'the shortest distance between the two rivers' (16.1.21), with short straight links from each city to its river. The north edge is approximate. It is drawn halfway between Edessa, Carrhae and Nisibis and Arsamosata, which Pliny lists among the towns of Greater Armenia (Natural History 6.10). It meets the Euphrates about 140 km above the Zeugma, while Strabo measures Mesopotamia from 'the Zeugma at Commagenê, where Mesopotamia begins' (16.1.22). The name's reach varied: the historian Arrian used it only for the northern part, today's Jezira, while Pliny's Mesopotamia also takes in Babylonia, with 'Seleucia, Laodicea, Artemita' (6.30)."
- **P4-F6. The sources.**
  - **Required:** add `pleiades:638789` to Pisidia and `wikidata:Q65088749` to Phrygia.
  - **Recommended:** add `pleiades:639111` (Sinda) to Pisidia; `pleiades:619268` (Lake Tatta) to Lycaonia and Phrygia; `pleiades:609427` (the Catacecaumenê) to Mysia; `pleiades:845022` (Modra) and `pleiades:609393` (Gordion) to Phrygia; and `pleiades:658636` (the Zeugma) to Mesopotamia.
  - Every other clause of the new notes rests on sources each outline already cites. Arrian's sense rests on `bib:livius-mesopotamia`, which is cite-only, so the note paraphrases it and quotes nothing from it.
- **P4-F7. The checks.**
  - **Required:** a check that Mesopotamia overlaps no drawn area (P4-F3).
  - **Recommended** fixed points in (e): Bithynion (`[31.5858565, 40.7561925]`) outside Phrygia; Oenoanda (`[29.55518, 36.81125]`) and Araxa (`[29.3837, 36.75132]`) outside Pisidia; Pitane inside Mysia or within 1 km of it.
- **P4-F8.** Rebuild, then run `check:ancient-geo`, `validate:data` and `build:data`.

**Optional:**
- **P4-S1.** Erase Natural Earth's "Lake Tuz" (`ne-10m-lakes`) from Lycaonia, so all of Lake Tatta lies outside (PO-3). Today 10.4 km² of it lies inside.
- **P4-S2.** Move Lycaonia's label point (Q1).

### Licensing (phase 4)
**Signed off.** The changes above add no new source.
- **Natural Earth:** "All versions of Natural Earth raster + vector map data found on this website are in the public domain", and "No permission is needed to use Natural Earth. Crediting the authors is unnecessary." I re-read the terms of use on 2026-10-24. The files are pinned at `ca96624`, and their SHA-256s match.
- **Pleiades:** each record's `rights` field reads "Sharing and remixing permitted under terms of the Creative Commons Attribution 3.0 License (cc-by)". The attribution is in all three places:
  - `ATTRIBUTION.md`: "Ancient place data from Pleiades (pleiades.stoa.org), CC BY 3.0.";
  - `docs/LICENSES.md`: the M5-19 section and the compatibility table;
  - the app's "Sources & credits" (`sources-credits-content.ts`), which also lists Wikidata and Natural Earth.

  Each anchor is a single fact.
- **Wikidata:** CC0, under the existing ruling.
- **OpenStreetMap, through Pleiades:** for 32 anchors, at least one Pleiades location is an "OSM location", and for 12 it is the only one. Examples are Artaxata's "OSM Location: Khor Virap" and Garsaura's "OSM location of Aksaray". Balboura's point is partly one too. These are fine in `data/geo/` (ODbL), and A2 credits OSM. They must stay out of the CC BY-SA records.
- **ODbL:** Lycaonia's cut along the drawn Cilicia areas, and P4-F3's use of the empire's edge, reuse the ancient layer's own geometry. ODbL 1.0 already covers both.
- **A wording update for `docs/LICENSES.md`.** It is not in this commit, because the PO asked for this file only:
  - In row 9, change "the region outlines from M5-19" to "the region outlines from M5-19 and M5-20".
  - Rename the section "Region outlines (M5-19)" to "Region outlines (M5-19, M5-20)".
  - Replace "One Pleiades point, Sychem's "OSM location of Tell Balata", comes from OpenStreetMap, which A2 already credits." with "Some Pleiades points are themselves OpenStreetMap locations: Sychem's "OSM location of Tell Balata" (M5-19) and 32 of M5-20's anchors, for example Artaxata's "OSM Location: Khor Virap". A2 already credits OSM, and these points stay in `data/geo/`."

  `ATTRIBUTION.md` needs no change.

### Sign-off by region (phase 4)

| Region | Verdict | Must change |
|---|---|---|
| Pisidia | Needs change | P4-F1 (Balbura); the note (P4-F5); the sources (P4-F6) |
| Lycaonia | Approved with changes | The note (P4-F5). Geometry verified. |
| Mysia | Approved with changes | The note (P4-F5); the seeds (P4-F4). Geometry verified. |
| Phrygia | Needs change | P4-F2 (Bithynium); the note (P4-F5); the sources (P4-F6) |
| Media | Approved with changes | The note (P4-F5). Geometry verified. |
| Mesopotamia | Needs change | P4-F3 (the west edge); the note (P4-F5); the check (P4-F7) |
| `region-anchors.json` | Verified | P4-F1's new row |
| Licensing | Signed off | The `LICENSES.md` wording, in a later commit |

P4-F1, P4-F2 and P4-F4 change group A's mean latitude, so all four Asia Minor outlines will move slightly. On the rebuild I'll re-run my re-derivation, the side tests and the areas. If the two research rows and the six notes go in as written, nothing else needs a source check.

### Items for the PO (phase 4)
- **Q1. Lycaonia's label point.**
  - **Its source:** Wikidata's P625 for Lycaonia, 33°E 38°N (`wikidata:Q622598`, normal rank), named as `coordinateSource` in `lycaonia.json`.
  - **The problem:** the point lies in Iconium's cell, 15.4 km inside Phrygia.
  - **The answer:** moving it is acceptable if the new point is sourced. The record already cites Pleiades' "Lykaonia" (`pleiades:1001911`). Its representative point, 32.5°E 37.5°N, is the centre of a rough Barrington box (30–35°E, 35–40°N). It lies inside Lycaonia, 21.1 km from the edge and 16.9 km from Lystra.
  - **The change (Research Lead):** in `lycaonia.json`, set `coordinates` to `[32.5, 37.5]` and `coordinateSource` to `pleiades:1001911`, and say in `support` that the point is approximate. Then check (b) no longer needs the PO-4 exception.
  - **The alternative:** a label placed inside the outline by the frontend for display only. It needs no source, but must not become the record's point.
- **Q2. Pitane: acceptable.**
  - Its point is 0.33 km off Natural Earth's coastline by my measure (the PO's figure is 0.40 km). It lies in Elaea's cell: Elaea is 10.4 km away, Teuthrania 15.7 km and Cyme 18.7 km. So it is on Mysia's side of every line, and only the 1:10m coast leaves it out.
  - That is within the 1 km that check (c) allows, the rule the research applied to Cyzicus (0.09 km off the coast then, inside now).
  - Pliny lists it with Elaea (5.32), so Mysia's note covers it with Elaea's dispute. P4-F7 adds a test.
- **Q3. Lycaonia's pinch: consistent with the anchors and the rulings, but no source describes it.**
  - **The neck** is 9.6 km wide, where Lystra's and Derbe's cells share one edge (32.863°E 37.495°N to 32.895°E 37.578°N). Iconium's cell presses on it from the north (Phrygia, by P5). Laranda's presses from the south (outside, by the western-Lycaonia convention; ISBE: the eastern part "included the important city of Laranda").
  - **The north-east lobe** is Coropassus's cell, between Garsaura (Strabo 12.6.1's boundary pair) and Lake Tatta (PO-3).
  - **The sources:** Strabo describes "the plateaus of the Lycaonians" (12.6.1), and ISBE gives only "between Iconium and Lystra". No sourced Lycaonian town lies at the neck. Strabo's Soatra is only "a village-city near Garsaüra" (12.6.1), and Pliny's Hyde (5.25) is already inside.
  - **Verdict:** acceptable at low confidence, since the note calls the edges approximate.
- **Q4. Pisidia's tail: not consistent (P4-5).** Out to Sinda and Kibyra it follows the research. Beyond them it takes in Balbura, Oenoanda and Araxa, which are Lycian (Strabo 13.4.17; Pleiades). P4-F1 ends it at about 37.0°N.
- **Q5. Media's west: consistent.** The vertex is at 44.3002°E 38.0358°N.
  - Strabo puts a salt "harbour, Capauta" in Atropatene (11.13.2), and the Loeb editor's note reads "Now Lake Urmi". ISBE's article on Media says "Lake Spauta is now known as Urmi".
  - Atropatene "lies east of Armenia and Matianê" (11.13.2), but Matiane is unlocated. So the land west of the lake is approximate, and the west edge is low (§7). Hakkari is outside.
- **Q6. Thyatira: acceptable either way.**
  - Its point (`pleiades:550924`) is 11.2 km outside Mysia, nearer Magnesia ad Sipylum (48.9 km) than Pergamum (61.0 km).
  - Strabo gives the Mysian reading as a minority one: "a settlement of the Macedonians, which by some is called the farthermost city of the Mysians" (13.4.4).
  - `thyatira.json` is parented to `asia`, so check (c) doesn't apply.
  - Optionally, add to Mysia's note: "Thyatira, which 'by some is called the farthermost city of the Mysians' (Strabo 13.4.4), is outside."
- **PO-A. Modra, with P4-F2.** Strabo puts Modra, where the Gallus rises, "in Phrygia on the Hellespont. This is the same country as Phrygia Epictetus, and it was formerly occupied by the Bithynians" (12.3.7). P4-F2 leaves it outside, 48 km from Bithynium, and the note says so.
  - Keeping Modra inside would need Modra as a Phrygian anchor and also a sourced Bithynian anchor on the Black Sea coast. With Modra alone, Phrygia reaches the sea (41.11°N in my test).
  - That is new research, so I recommend P4-F2 as written.
- **PO-B. Cadi and the Catacecaumenê.** M5-19's G6.4 puts Cadi "on the edge" and the Catacecaumenê "at the corner". In the build:
  - Cadi is on Phrygia's side, as PO-5 allows, but 73 km from the Mysia line.
  - The Catacecaumenê is 72.5 km from the corner, and in no outline.

  An equidistant build can't put a line through a point, and no Mysian anchor lies within 140 km of Cadi. Strabo leaves both open: Cadi "according to some writers, belongs to Mysia", and the Catacecaumenê is "by some called Mysian and by others Maeonian" (12.8.12). I advise accepting both at low confidence, with both notes naming them (P4-F5). Bringing the line to Cadi would need a sourced Mysian anchor east of Pergamum, which is new research.
- **PO-C. Outside this card.** Some location records take their `coordinateSource` from a Pleiades point that is itself an OSM location: `colossae.json` ("OSM location of Colossae") and `adramyttium.json` ("OSM location of Adramytteion"). `LICENSES.md`'s "one OSM rule" names only OpenBible.info's OSM fields, while phase 2's L5 keeps such points out of the CC BY-SA records. I suggest a separate card to sweep the records.

### Checks run (phase 4)
- **`lockf -k -t 7200 /tmp/ibm-heavy.lock npm run check:ancient-geo`:** passed in 121 s (wall clock), and `git status` was clean afterwards.
- **`npm run validate:data`** (under the lock): "Validation passed with 207 warning(s)", none for the outlines, in 8 s. Ajv compiles `schema/region-outlines.schema.json` and accepts the file.
- **Scratch scripts in `/tmp/m520p4`** (not committed):
  - every M5-20 anchor and test place read from Pleiades (JSON, or KML for Lake Tatta and Lykaonia), and from Wikidata (`wbgetentities`; SPARQL on P1584 and P625);
  - an independent nearest-seed grid for both groups;
  - point-in-polygon tests, distances and spherical areas;
  - overlaps with `ancient-areas.geojson`, and with Natural Earth's coast, lakes and rivers (SHA-256 checked);
  - what-ifs for P4-F1, P4-F2 and P4-F4.
- **Sources opened on 2026-10-24:**
  - Strabo at LacusCurtius: `11I`, `11M`, `12C`–`12H`, `13D` and `16A`;
  - Pliny at Perseus: 5.24, 5.25, 5.32, 5.41, 6.10, 6.29 and 6.30;
  - ISBE: "Pisidia", "Lycaonia", "Mysia", "Phrygia", "Media" and "Apollonia";
  - Livius, "Mesopotamia" (cite-only);
  - Natural Earth's terms of use;
  - the WEB snapshot for Acts 14:6 and 16:7–8.

### The PO's decisions (phase 4)
- **P4-F1 to P4-F8:** accepted as written. The PO has added the two research rows (§3 West, Balbura; §6 North-east, Bithynium) and the `docs/LICENSES.md` wording, verbatim.
- **P4-S1:** accepted. Lake Tatta's whole lake, Natural Earth's "Lake Tuz", is erased from Lycaonia and from Phrygia, so it lies in neither outline (PO-3).
- **Q1 / P4-S2:** accepted. `lycaonia.json`'s label point is now Pleiades' "Lykaonia" (`pleiades:1001911`, 32.5°E 37.5°N), and its `support` says the point is approximate. Check (b) no longer needs the PO-4 exception. The PO will check in the browser that the name doesn't hide Lystra's. If it does, the change is reverted, and a display-only label point goes to the backlog.
- **Q2:** accepted. The P4-F7 test is added: Pitane inside Mysia, or within 1 km of it.
- **Q3 and Q5:** accepted.
- **Q4:** fixed by P4-F1.
- **Q6:** accepted. Mysia's note adds the optional sentence: "Thyatira, which 'by some is called the farthermost city of the Mysians' (Strabo 13.4.4), is outside."
- **PO-A:** P4-F2 as written. Modra is outside, and Phrygia's note says so.
- **PO-B:** accepted. Cadi is on Phrygia's side and the Catacecaumenê is in neither outline; both notes name them.
- **PO-C:** to the backlog, as a separate card that sweeps the records whose `coordinateSource` is a Pleiades OSM location.
- **P4-F6 and P4-F7, recommended items:** accepted. All the recommended sources and test points are added.

### Phase 4 re-check
- **Checked:** `cb75908..23f017b` on `data/m5-20-region-anchors`:
  - 7f0bb82 (the check hardening and the coastal-touch guard);
  - 979d309 (PO: the research rows, the `LICENSES.md` wording, `lycaonia.json`);
  - e2350ef (GIS: P4-F1 to P4-F8 and P4-S1);
  - 23f017b (PO: the app's copy and the name-only browser test);
  - the r4 screenshots in `/tmp/m5-20-shots-r4/`.
- **Verifier:** fact-checker · **Date:** 2026-10-24 (UTC).

**Result: Pisidia, Lycaonia, Mysia, Phrygia and Media are signed off. Mesopotamia needs one more change, and the data-licence sentence needs one.**
- **Done and correct:** P4-F1, P4-F2, P4-F4 to P4-F6 and P4-F8; the fixed points and Pitane from P4-F7; P4-S1 and P4-S2. My re-derivation matches the rebuild.
- **P4-F3 is half done.** The west edge follows the empire's edge from the north line only to about 37.01°N, where that edge first touches the river. South of there it is Natural Earth's Euphrates again. Mesopotamia still overlaps the drawn `syria` by 383.9 km² (35.85–37.01°N, up to 6.3 km deep), and leaves gaps of up to 4.4 km.
- **The new overlap check can't see this.** mapshaper writes a `GeometryCollection` here, and the check's `geometriesAsFeatures` handles only a `FeatureCollection`, a `Feature` or a bare geometry. Run on this build, the check's own function counts 0.000 km² where the overlap is 383.9 km². Its gap figure measures the empire-edge slice against Mesopotamia itself, so it is 0 by construction. The PO's "0.000 km² and 0.000 km" came from this check.
- **Licensing O1 holds only in part.** The outlines are drawn only on the ancient map, whose attribution control always shows A1, the AWMC/ODbL string. But O1 also requires the data-licence sentence to name the outlines, and it doesn't. `main` has the same sentence, so this was never met; 23f017b doesn't change it.

| Item | Finding | Verdict |
|---|---|---|
| The re-derivation (G0.1) | Group A has 58 seeds: Adramyttium and Assos are out, Balbura and Bithynium in; φ0 38.3307°.<br>• Pisidia (20,534 km²) and Phrygia (72,341 km²) equal the outlines, with 0 mismatched cells.<br>• Lycaonia differs only by the drawn `cilicia-tracheia` (5,920 km²) and `cilicia` (2,802 km²), the Anamur shore (28 km²) and Lake Tuz's tip (12 km², erased).<br>• Mysia differs only by Thrace and the islands.<br>• Group B and Media are unchanged. | Verified |
| P4-F1, Pisidia | The south-west corners are 29.495°E 37.045°N and 29.900°E 37.012°N, as predicted. Balbura (9.4 km), Boubon, Oenoanda, Araxa and Kibyra are out; Sinda is in. Pisidia's share of the drawn `lycia` falls from 3,653 to 2,648 km², the land round Sinda and Kibyra. | Verified |
| P4-F2, Phrygia | The northern tip is 30.759°E 40.505°N, as predicted. The anchor `claudiopolis-bithynia` (61.4 km away), Pleiades' Bithynion, Gordioukome/Iuliopolis and Modra are out. Phrygia's share of the drawn `bithynia` falls from 9,355 to 4,159 km², Phrygia Epictetus north of Dorylaeum, which Strabo says "was formerly occupied by the Bithynians" (12.3.7). | Verified |
| P4-F3, Mesopotamia | From the north line to 37.01°N the edge is the empire's edge, with no overlap or gap. Further south it is Natural Earth's river: 383.9 km² of `syria` lies inside Mesopotamia (an exact mapshaper clip), and gaps reach 4.4 km. The drawn `syria` boundary and the empire edge coincide from 35.79°N to 37.20°N (0.000 km, densified). The empire edge leaves the river after its vertex 39.2682°E 35.7982°N; the next vertex is 37.5 km away. The new north-west corner, 39.113°E 37.916°N, is on that edge, 145 km from the Zeugma. | **Fix needed** (RC-F1, RC-F2) |
| P4-F4, the seeds | Both seeds are gone from the groups and from `region-anchors.json`. The child records stay inside Mysia: Adramyttium 0.43 km from the edge, Assos 0.80 km. | Verified |
| P4-F5, the notes | All six are identical to my texts. Mysia's adds the Thyatira sentence, whose quotation (13.4.4) I checked; Thyatira is 11.2 km outside. None has a build word or an area, and confidence is unchanged. | Verified |
| P4-F6, the sources | Pisidia adds `pleiades:638789` and `639111`. Lycaonia adds `naturalearth:ne-10m-lakes` and `pleiades:619268`. Mysia adds `pleiades:609427`. Phrygia adds `naturalearth:ne-10m-lakes`, `wikidata:Q65088749` and `pleiades:609393`, `619268` and `845022`. Mesopotamia adds `pleiades:658636`. Each resolves to the right place, and the ids pass the schema. | Verified (RC-S1) |
| P4-F7, the checks | The fixed points are correct: Bithynion is outside Phrygia, and Oenoanda and Araxa are outside Pisidia. Pitane is 0.33 km from Mysia, within 1 km. The overlap and gap checks are defective (above). The coastal-touch guard (7f0bb82) is sound: only Mysia (642.7 km of shore) and Media (653.6 km) touch the sea. | Partly (RC-F2) |
| P4-S1, Lake Tatta | Lake Tuz is erased from Lycaonia. 1 of 6,491 lake grid points (0.005°) remains inside it, within the 150 m simplification, and none lies inside Phrygia. The lake's point and the check's point are outside both. | Verified |
| P4-S2, `lycaonia.json` | `pleiades:1001911` is titled "Lykaonia". Its only location, a "Barrington Atlas location" of rough precision, is the box 30–35°E, 35–40°N, and its representative point is [32.5, 37.5]. Each clause of the new `support` holds: it is "the centre of a rough area after the Barrington Atlas"; "about 17 km from Lystra's pin" (16.9 km); "inside this map's outline of Lycaonia" (21.1 km from the edge); Wikidata's 33°E 38°N is "about 70 km to the northeast" (70.9 km, bearing 38°); and it "falls on Phrygia's side" (inside Phrygia, nearer Iconium than Lystra). Check (b) passes without the PO-4 exception. | Verified |
| The labels | At zoom 6 the LYCAONIA label hides Lystra's name. At zoom 7 Iconium, Lystra and Derbe all show. With Phrygia selected, the label sits outside Phrygia. The PO's recorded rule was to revert if the label hides Lystra's name, and at zoom 6 it does; that choice is the PO's, since the point is sourced and correct either way. | Noted |
| The areas | Pisidia 20,547.0; Lycaonia 16,924.3; Mysia 30,073.0; Phrygia 72,401.0; Media 359,943.2; Mesopotamia 148,741.1 km². They equal the PO's figures, and all are within §10's ranges. | Verified |
| 979d309, the text | The two research rows and the `LICENSES.md` wording are verbatim. | Verified |
| 23f017b and licensing | The app's copy now holds only each region's `id` and geometry; the provenance stays in `data/geo/region-outlines.geojson`, which is ODbL and public with its build, as for the areas. That is fine under ODbL §4.4 and §4.6. But `DATA_LICENSE_TEXT` names "the ancient layer's borders, roads and coastline" and "the routes' lines", not the outlines, so that half of O1 fails. | Fix needed (RC-F3) |

#### Changes required (phase 4 re-check)
- **RC-F1 (GIS). Finish P4-F3.** Keep the empire's edge as Mesopotamia's west edge south of 37.01°N, down to its last vertex beside the river, 39.2682°E 35.7982°N; the next vertex is 37.5 km from the river. Then join Natural Earth's Euphrates by the shortest connector, about 3.7 km. The drawn `syria` boundary coincides with that edge from 35.79°N to 37.20°N, so the overlap and the gaps both go to zero. The notes need no change.
- **RC-F2 (GIS). Fix the checks.**
  - Count `GeometryCollection` output in `clippedAreaKm2`; the build's own `geometriesAsFeatures` already handles it.
  - Test the overlap against every drawn area, not only `syria` and `commagene`.
  - Measure the gap from Mesopotamia's own boundary, between 35.8°N and 38.2°N, to the drawn areas, instead of from the slice.
  - Make `--proof-p4-on-cb75908` fail on the overlap itself; at `cb75908` it is about 1,006 km².
- **RC-F3 (Frontend Engineer). Licensing O1.** Set `DATA_LICENSE_TEXT` to: "Data license: all non-reference data and content are CC BY-SA 4.0, except two sets of map geometry, which are ODbL 1.0: the ancient layer's borders, region outlines, roads and coastline, derived from AWMC Geodata and OpenStreetMap, and the routes' lines, derived from AWMC Geodata's roads." Update any test that pins the old wording.

**Recommended:**
- **RC-S1.** Add `awmc:roman-empire-ad-69-extent`, the empire edge's own upstream id, to Mesopotamia's `sources`. M5-19 did the same when Judea cited `awmc:ad69-face-raw-0001`.
- **RC-S2.** In `docs/LICENSES.md`, after "Decided on 2026-10-20. The evidence is in [`docs/verification/M5-19-region-outlines.md`](verification/M5-19-region-outlines.md), "Phase 4"", add: " and, for M5-20, in [`docs/verification/M5-20-region-anchors.md`](verification/M5-20-region-anchors.md), "Phase 4" and "Phase 4 re-check"".

#### Sign-off by region (phase 4 re-check)

| Region | Verdict | Still required |
|---|---|---|
| Pisidia | Signed off | — |
| Lycaonia | Signed off | — |
| Mysia | Signed off | — |
| Phrygia | Signed off | — |
| Media | Signed off | — |
| Mesopotamia | Not yet | RC-F1, RC-F2 |
| `region-anchors.json` | Signed off | — |
| `lycaonia.json` | Signed off | — |
| Licensing | Signed off for the data | RC-F3 (the app's data-licence sentence) |

RC-F1 touches only Mesopotamia's build, so the other five outlines don't move. If, after RC-F1 and RC-F2, the corrected check reports under 1 km² of overlap and a gap within Mesopotamia's tolerance, Mesopotamia is signed off without another full round; I'll confirm those two figures from the check's log. RC-F3 is a one-sentence app change and can go in its own PR.

#### Checks run (phase 4 re-check)
- `lockf -k -t 7200 /tmp/ibm-heavy.lock npm run check:ancient-geo`: passed in 82 s (wall clock). It rebuilt `data/geo/` byte for byte from an empty cache, and checks (a)–(g) passed. Its overlap figure is wrong (RC-F2).
- `npm run validate:data` (under the lock): "Validation passed with 207 warning(s)", none for these files, in 8 s.
- Scratch scripts in `/tmp/m520p4` (not committed):
  - the nearest-seed grid for both groups;
  - side tests, areas and overlaps with every drawn area;
  - an exact mapshaper clip of Mesopotamia against each area, and the same clip run through the check's own function;
  - the gap along the west edge by latitude band, and the empire edge against Natural Earth's river and `syria`'s boundary;
  - Lake Tuz's grid;
  - Pleiades `1001911` (JSON) and Wikidata `Q622598`.
