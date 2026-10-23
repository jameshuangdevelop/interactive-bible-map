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
