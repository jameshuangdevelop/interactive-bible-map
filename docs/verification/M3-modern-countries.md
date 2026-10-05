# M3-14 verification: Countries in modern names

This is an independent check of the Research Lead's commit `330e684` ("data(locations): add modern countries"). That commit sits on the GIS Engineer's schema commit `25b3b8d` and the PO's README commit `6ac2980`, and it applies ADR-0028 and CP3.5 decision 1 to all 89 `data/locations/*.json` records. Reviewed on 2026-10-05.

**Result:**
- 74 non-exempt records pass as written.
- 4 are fixed here: Salamis (PO ruling), and Achaia, Galatia and Sicily.
- 2 fail and stay `draft`: Arabia and Illyricum. They go back to the Research Lead.
- The 9 exempt records correctly have no countries.

So 87 of the 89 records are now `verified`.

## Scope

The rule is in `docs/tasks/M3-14-modern-countries.md`, ADR-0028 (with its CP3.5 update), CP3.5 decision 1, and `schema/README.md` → "Modern names". This report covers:
- `names.modernCountries` on the 80 non-exempt records;
- the orienting `names.modern` phrase on the 29 area records (24 new, 5 kept);
- the 19 `summary.sources` additions;
- the two allow-list additions ("Croatia", "Northern Cyprus");
- the exempt records (the 2 empires, `jerusalem`, and the 6 records whose parent chain includes `jerusalem`).

It does not cover the panel display (M3-15) or candidate labels.

## Method

**Semantic diff.** A node script parsed every record at `6ac2980` and in the working tree. It walked both field by field and listed every path that differed. It was run twice:

- **Before this check** (`6ac2980` → `330e684`):
  - 80 of 89 files changed. The 9 unchanged files are exactly the exempt records.
  - The only paths that changed were `names.modernCountries` (80), `names.modern` (24, all area records that had none before), `summary.sources` (19), `status`, `verifiedBy` and `lastReviewed` (80 each).
  - Every `summary.sources` change only appends entries, with no removals or reordering.
  - No existing `names.modern` value changed.
- **After this check** (`6ac2980` → this commit):
  - The same 80 files changed, with the same paths.
  - `status` and `verifiedBy` now differ only on `arabia` and `illyricum`, the two records left at `draft`. The other 78 are back at `verified` / `fact-checker`, so only `lastReviewed` moved.
  - Against `330e684`, the only other changes are the four fixes listed below.

**Sources fetched (2026-10-05):**
- **Wikidata** `Special:EntityData/<QID>.json` for all 116 QIDs now cited on the records: the 99 cited before this task and the 17 country or region items the Research Lead added. For each, I read the P17 claims with their ranks and end-time (P582) qualifiers, the English description, and P625. Historical claims with an end time (Roman Empire, Ottoman Empire, Mandatory Palestine and so on) were set aside.
- **Natural Earth 10m** "Admin 0 – Countries" and "Admin 0 – Breakaway, Disputed Areas" (public domain), from the `nvkelso/natural-earth-vector` GeoJSON. I ran a point-in-polygon test on all 100 candidate coordinates and measured each point's distance to the polygon edge. This gives every country an independent second source besides the record's own citation.
  - Natural Earth's disputed layer has separate polygons for the West Bank, the Golan Heights, East Jerusalem, N. Cyprus and the Latrun no-man's land.
  - At this scale, points within about 1 km of an edge, and coastal points that fall just offshore, are confirmed by the Wikidata claim or description rather than by Natural Earth alone.
- **Pleiades** JSON for `pleiades:874602` (Mesopotamia) and `pleiades:981531` (Macedonia).
- **The International Standard Bible Encyclopedia (ISBE)** "Illyricum", "Dalmatia" and "Macedonia" (`bib:isbe-illyricum`, `bib:isbe-dalmatia`, `bib:isbe-macedonia`).
- **Livius.org** "Macedonia (8)" (`bib:livius-macedonia`) and "Nabataeans" (`bib:livius-nabataeans`).
- **Each area record's own** `summary`, `history` and candidate `support` text, together with the countries of its child records.

## Every record

The Source column names the cited source behind each country. "NE" means Natural Earth agrees. "CP3.5 d1" means the territory name comes from CP3.5 decision 1, which deliberately overrides a Wikidata P17 of "Israel".

| id | type | modernCountries | names.modern (areas) | Verdict | Source |
|---|---|---|---|---|---|
| achaia | province | Greece | Central and southern Greece | **Fixed** (phrase) | `wikidata:Q41`; label point in Greece (NE). The phrase follows the record's own summary, "the Peloponnese and central Greece". |
| antioch-pisidia | city | Türkiye | | Pass | `wikidata:Q579468`; NE |
| antioch-syria | city | Türkiye | | Pass | `wikidata:Q200441`; NE |
| arabia | province | Jordan | Southern Jordan | **Fail** | Contradicted by its own `bib:livius-nabataeans`; see "Failures" |
| asia | province | Türkiye, Greece | Western Türkiye | Pass | `wikidata:Q43`, `wikidata:Q41`; Greece through Patmos (record history) |
| athens | city | Greece | | Pass | `wikidata:Q1524`; NE |
| berea | city | Greece | | Pass | `wikidata:Q201722`; NE |
| bethany-beyond-the-jordan | site | Jordan, West Bank | | Pass | `wikidata:Q12193567` (Jordan); `wikidata:Q1574073` ("baptism site, West Bank"); NE: Jordan 0.2 km and West Bank 0.1 km inside, on opposite banks |
| bethany | village | West Bank | | Pass | `wikidata:Q7818622` (P17 West Bank); `wikidata:Q2181579` ("… of the West Bank"); NE |
| bethlehem | town | West Bank | | Pass | `wikidata:Q5776` ("city in the West Bank"); NE; CP3.5 d1 |
| bethsaida | village | Golan Heights | | Pass | CP3.5 d1. NE Golan Heights for both candidates: et-Tell 1.9 km and el-Araj 0.2 km inside. Wikidata P17 for both is Israel. |
| bithynia | province | Türkiye | Northwestern Türkiye | Pass | `wikidata:Q373189`; NE |
| caesarea-maritima | city | Israel | | Pass | `wikidata:Q319242`; NE |
| caesarea-philippi | city | Golan Heights | | Pass | CP3.5 d1; `wikidata:Q2484244` (P17 Israel and Syria); NE Golan Heights, 2.5 km inside |
| cana | village | Israel, Lebanon | | Pass | `wikidata:Q17199012` and `wikidata:Q2633158` (Israel); `wikidata:Q753812` (Lebanon); NE |
| capernaum | city | Israel | | Pass | `wikidata:Q59174`; NE |
| cappadocia | province | Türkiye | Central Türkiye | Pass | `wikidata:Q43`; NE |
| cenchreae | town | Greece | | Pass | `wikidata:Q111565756`; NE |
| chorazin | village | Israel | | Pass | `wikidata:Q2456076`; NE |
| cilicia | region | Türkiye | Southeastern Türkiye | Pass | `wikidata:Q43`; NE; the summary says "southeastern Asia Minor" |
| colossae | town | Türkiye | | Pass | `wikidata:Q1001370`; NE |
| corinth | city | Greece | | Pass | `wikidata:Q1363688`; NE |
| crete-cyrene | province | Greece, Libya | Crete and eastern Libya | Pass | `wikidata:Q41`, `wikidata:Q1016`; the child record `libya` cites `wikidata:Q165198` ("eastern coastal region of Libya") |
| crete | region | Greece | Crete | Pass | `wikidata:Q34374`; NE |
| cyprus | province | Cyprus | Cyprus | Pass | `wikidata:Q229`; NE |
| damascus | city | Syria | | Pass | `wikidata:Q3678596`; NE |
| derbe | town | Türkiye | | Pass | `wikidata:Q20717624`; both candidates in Türkiye (NE) |
| egypt | province | Egypt | Egypt | Pass | `wikidata:Q79`; NE |
| emmaus | village | Israel, West Bank | | Pass | `wikidata:Q759606` (Abu Ghosh, Israel); `wikidata:Q6041947` (El-Qubeibeh, Palestine; NE West Bank); see "PO rulings" |
| ephesus | city | Türkiye | | Pass | `wikidata:Q47611`; NE |
| galatia | province | Türkiye | Central Türkiye | **Fixed** (phrase) | `wikidata:Q26847` ("area in the highlands of central Asia Minor", P17 Turkey); NE |
| galilee | region | Israel | Galilee | Pass | `wikidata:Q83241`; NE |
| gethsemane | site | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| golgotha | site | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| hierapolis | city | Türkiye | | Pass | `wikidata:Q7428276`; NE |
| iconium | city | Türkiye | | Pass | `wikidata:Q79857`; NE |
| illyricum | province | Croatia | Coastal Croatia | **Fail** | Its own label point is in Bosnia and Herzegovina; see "Failures" |
| italy | province | Italy | Italy | Pass | `wikidata:Q38`; NE |
| jericho | city | West Bank | | Pass | `wikidata:Q2402267` ("archaeological site in the West Bank"); NE for both candidates; CP3.5 d1 |
| jerusalem | city | — (exempt) | | Pass (exempt) | ADR-0028 |
| joppa | city | Israel | | Pass | `wikidata:Q7083682`; NE |
| judea-province | province | Israel, West Bank, Jordan, Golan Heights | Israel, the West Bank, Jordan and the Golan Heights | Pass | `wikidata:Q801`, `Q36678`, `Q810`, `Q83210`; the child records' coordinates; see "Areas" |
| judea | region | West Bank, Israel | Hill country in the West Bank and Israel | Pass | `wikidata:Q36678`; `wikidata:Q104028` (Israel); label point in the West Bank (NE) |
| laodicea | city | Türkiye | | Pass | `wikidata:Q849709`; NE |
| libya | region | Libya | Eastern Libya | Pass | `wikidata:Q165198`; NE |
| lycaonia | region | Türkiye | South-central Türkiye | Pass | `wikidata:Q622598`; NE |
| lystra | town | Türkiye | | Pass | `wikidata:Q43`; `pleiades:648699` coordinate in Türkiye (NE, 117 km inside) |
| macedonia | province | Greece, North Macedonia, Albania | Parts of Greece, North Macedonia and Albania | Pass | `wikidata:Q41`, `Q221`, `Q222`; `bib:livius-macedonia`; `bib:isbe-macedonia`; see "Areas" |
| magdala | village | Israel | | Pass | `wikidata:Q4880851`; NE |
| malta | natural-feature | Malta, Croatia | | Pass | `wikidata:Q233` (Malta); `wikidata:Q211306` (Mljet, Croatia); NE |
| media | region | Iran | Northwestern Iran | Pass | `wikidata:Q3853673` ("ancient region of north-western Iran"); NE |
| mesopotamia | region | Iraq, Syria, Türkiye | Mostly Iraq, with parts of Syria and Türkiye | Pass | `wikidata:Q11767` (Iraq); `pleiades:874602`; see "Areas" |
| miletus | city | Türkiye | | Pass | `wikidata:Q169460`; NE |
| mount-of-olives | natural-feature | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| mysia | region | Türkiye | Northwestern Türkiye | Pass | `wikidata:Q622319` ("in the northwest of ancient Asia Minor"); NE |
| nain | village | Israel | | Pass | `wikidata:Q934904`; NE |
| nazareth | town | Israel | | Pass | `wikidata:Q430776`; NE |
| neapolis-macedonia | city | Greece | | Pass | `wikidata:Q187352`; NE nearest Greece, 1.0 km (point offshore at 10m) |
| nicopolis | city | Greece | | Pass | `wikidata:Q943637`; NE |
| pamphylia | region | Türkiye | Southern Türkiye | Pass | `wikidata:Q43`; `pleiades:639034` point in Türkiye (NE) |
| paphos | city | Cyprus | | Pass | `wikidata:Q22991943`; NE nearest Cyprus, 0.5 km (offshore at 10m) |
| parthian-empire | empire | — (exempt) | | Pass (exempt) | Empire |
| patmos | natural-feature | Greece | | Pass | `wikidata:Q190053`; NE |
| perga | city | Türkiye | | Pass | `wikidata:Q719815`; NE |
| pergamum | city | Türkiye | | Pass | `wikidata:Q18986`; NE |
| philadelphia-lydia | city | Türkiye | | Pass | `wikidata:Q138280`; NE |
| philippi | city | Greece | | Pass | `wikidata:Q379652`; NE |
| phrygia | region | Türkiye | West-central Türkiye | Pass | `wikidata:Q43`; `pleiades:609502` point in Türkiye (NE) |
| pisidia | region | Türkiye | Southwestern Türkiye | Pass | `wikidata:Q621805`; NE |
| pontus | region | Türkiye | Northeastern Türkiye | Pass | `wikidata:Q621672` ("eastern Black Sea Region of Turkey"); NE |
| pool-of-bethesda | site | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| pool-of-siloam | site | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| puteoli | city | Italy | | Pass | `wikidata:Q72425`; NE |
| roman-empire | empire | — (exempt) | | Pass (exempt) | Empire |
| rome | city | Italy | | Pass | `wikidata:Q220` (preferred P17 Italy); NE |
| salamis-cyprus | city | Cyprus | | **Fixed** (PO ruling) | `wikidata:Q767089` (P17 Cyprus, alongside Northern Cyprus); NE nearest N. Cyprus, 0.2 km |
| samaria | region | West Bank | Hill country in the northern West Bank | Pass | `wikidata:Q1294629` (P17 Palestine); NE West Bank, 17 km inside |
| sardis | city | Türkiye | | Pass | `wikidata:Q232615`; NE |
| sea-of-galilee | natural-feature | Israel | | Pass | `wikidata:Q126982` ("largest freshwater lake in Israel"); NE |
| sicily | province | Italy, Malta | Sicily | **Fixed** (+Malta) | `wikidata:Q1460` (Italy); `wikidata:Q233` (Malta), added; the summary says the province "also included the island of Malta" |
| smyrna | city | Türkiye | | Pass | `wikidata:Q1379299`; NE |
| sychar | village | West Bank | | Pass | `wikidata:Q7697383` ("… in the West Bank"); NE; CP3.5 d1 |
| syria | province | Syria, Lebanon, Türkiye | Syria, Lebanon and southeastern Türkiye | Pass | `wikidata:Q858`, `Q822`, `Q43`; label point at Antioch, in Türkiye (NE); see "Areas" |
| tarsus | city | Türkiye | | Pass | `wikidata:Q134287`; NE |
| temple-mount | site | — (exempt) | | Pass (exempt) | Parent chain includes `jerusalem` |
| thessalonica | city | Greece | | Pass | `wikidata:Q17151`; NE |
| thyatira | city | Türkiye | | Pass | `wikidata:Q1135603`; NE |
| troas | city | Türkiye | | Pass | `wikidata:Q1393407`; NE |
| tyre | city | Lebanon | | Pass | `wikidata:Q82070`; NE |

## Special cases

### West Bank and Golan Heights (CP3.5 decision 1)

Applied exactly as approved.

**West Bank:**
- Bethlehem, Jericho (both candidates), Bethany (Al-Eizariya), Sychar (Tell Balata), and the Qasr al-Yahud candidate of Bethany beyond the Jordan.
- Two other records also list "West Bank": Emmaus (through El-Qubeibeh) and the Judea and Samaria regions (their label points). None of these is a new territorial call: each rests on a candidate or label point that Natural Earth places inside its West Bank polygon.

**Golan Heights:** Banias (Caesarea Philippi) and both Bethsaida candidates.

**Nothing missed, nothing wrongly included:**
- Of the 90 candidate points on non-exempt records, the only ones inside Natural Earth's West Bank or Golan Heights polygons are those just listed, plus Emmaus Nicopolis (see below).
- Each record that lists either territory has at least one candidate or label point inside it.
- The Jerusalem records, all exempt, fall in Natural Earth's East Jerusalem polygon.
- No other non-exempt site lies east of the 1949 line.

**Sources:**
- The Wikidata entries for Bethsaida (`Q501773`, `Q47466555`), Banias (`Q2484244`) and Qasr al-Yahud (`Q1574073`) give "Israel" as P17. The approved territory name is used instead, as decision 1 intends: it "describes where the place is, not who should rule it".
- The West Bank sites' own Wikidata descriptions say "West Bank": `Q5776`, `Q2402267`, `Q2181579`, `Q7697383`, `Q1574073`, and `Q7818622`'s P17.

### Cyprus

Salamis now reads "Cyprus" (PO ruling 1, below). Natural Earth puts the site at the edge of its N. Cyprus polygon. Its cited `wikidata:Q767089` carries both "Northern Cyprus" and "Cyprus" as P17, so the existing citation supports "Cyprus" and no new source is needed. "Northern Cyprus" has been removed from `$defs.modernCountry`. No test, README or validator text used it. The research note now has "PO ruling" lines; its per-record table shows "Cyprus", and the Research Lead's reasoning is kept as written.

### Croatia

"Croatia" is a correct addition to the allow-list:
- **Malta's** low-confidence Mljet candidate: `wikidata:Q211306`, "island of Croatia", and Natural Earth agrees.
- **Illyricum** needs Croatia too, but not Croatia alone (see "Failures").

`malta`'s order (Malta first) follows the confidence of its candidates.

### Multi-candidate places

| Record | Candidates → countries | Order |
|---|---|---|
| cana | Khirbet Qana and Kafr Kanna in Israel; Qana in Lebanon | Israel holds 2 of 3, and both of its candidates are the `disputed`-level ones |
| bethany-beyond-the-jordan | Al-Maghtas (east bank) in Jordan; Qasr al-Yahud (west bank) in the West Bank | Jordan first: its candidate is `medium`, the West Bank one `low` |
| bethsaida | et-Tell and el-Araj, both in the Golan Heights | Single value |
| emmaus | Abu Ghosh and Qaloniya/Motza in Israel; El-Qubeibeh in the West Bank; Emmaus Nicopolis unclear | Israel holds at least 2 of 4 |
| malta | Malta in Malta; Mljet in Croatia | Malta first (`high` against `low`) |
| derbe, jericho | Both candidates in one country or territory | Single value |
| golgotha | Exempt | — |

### Order of countries

Every record's first value is the country holding the record's label point, or most of its candidates. Areas follow the main extent given by their own text: Syria first for the province of Syria, Iraq first for Mesopotamia, and the West Bank first for the Judea region.

## Areas (29)

**Phrases.** All 29 are short, geographic and neutral, apart from the three fixed and the two failed below.
- Judea and Samaria use "Hill country in …" with the approved territory name. They avoid "Judea and Samaria" as a combined political name, the reason M3-08 left them blank.
- `judea-province` is long, but it is a plain list of the four places the province covered.
- Two pairs share a phrase, both accurate: "Central Türkiye" (Cappadocia and, after the fix, Galatia) and "Northwestern Türkiye" (Bithynia and Mysia).

**At most 6 countries.** The longest list is `judea-province`, with 4.

**The 5 that already had names** (Crete, Cyprus, Galilee, Italy, Sicily) keep them. Each is a plain geographic name. Sicily keeps "Sicily" now that it also lists Malta, just as Asia keeps "Western Türkiye" while listing Greece for Patmos.

**Countries the Research Lead derived from child records**, checked against each record's own cited text:
- **Syria → Türkiye:** passes. The history says "at AD 50 Tarsus and the Cilician plain were governed from Syria". The province's own label point, at Antioch its capital, is in Türkiye. Lebanon comes from the child record Tyre, and Syria (the country) from Damascus.
- **Asia → Greece:** passes. The history says "the province apparently included Patmos and other islands near its coast".
- **Judea (province) → Jordan and Golan Heights:** passes.
  - The summary says Claudius placed Agrippa I's kingdom, "including Galilee and the lands east of the Jordan", under the province, and the history lists "Perea and the former tetrarchy of Philip".
  - The modern places come from the child records' cited coordinates: Bethany beyond the Jordan's Al-Maghtas (Jordan), and Bethsaida and Caesarea Philippi (Golan Heights).
  - Syria is left out because the text names Batanea and Trachonitis only for AD 53. Leaving it out is conservative, not wrong (see "For the PO").
- **Crete and Cyrene → Libya:** passes. The summary says "Cyrene and its territory on the North African coast", and the history quotes "the Cyrenaic portion of Libya". The child record `libya` cites `wikidata:Q165198`, "eastern coastal region of Libya", which also supports "eastern Libya" in the phrase.

**Other multi-country areas:**
- **Mesopotamia:** passes. Pleiades `874602` says "roughly corresponding to most of modern Iraq and Kuwait, eastern Syria, and Southeastern Turkey". The record's support text leaves out Kuwait, which is a minor share, so the "main ones" rule allows it.
- **Macedonia:** passes. Livius says the region lies in "the Former Yugoslav Republic of Macedonia and northern Greece", and that Rome "added southern Illyria (capital: Apollonia)". ISBE describes the province "enlarged by the addition of parts of Illyria" and the Via Egnatia "from Dyrrhachium". Apollonia and Dyrrhachium are in modern Albania.

## Fixes made

All four are within the card's scope: `names.modernCountries`, `names.modern` on an area record, and a `summary.sources` addition. Each is sourced by text the record already cites.

1. **`salamis-cyprus`:** "Northern Cyprus" → "Cyprus", and "Northern Cyprus" removed from the schema allow-list (PO ruling 1).
2. **`galatia`:** "North-central Türkiye" → "Central Türkiye".
   - The old phrase describes only the northern, Celtic-settled area. That is the "North Galatian" reading, and the record says it "takes neither side" on it.
   - The record covers the province, which "reached south to cities such as Antioch in Pisidia, Iconium, Lystra, and Derbe". The project's own hierarchy also places Lycaonia ("South-central Türkiye"), Pisidia and Pamphylia under Galatia.
   - Source: the cited `wikidata:Q26847` describes Galatia as an "area in the highlands of central Asia Minor", and the summary uses the same words.
3. **`achaia`:** "Southern Greece" → "Central and southern Greece". The record's summary and support both say the province covered "the Peloponnese and central Greece". Its history quotes Strabo on Achaia reaching Thessaly, Aetolia, Acarnania and some Epirote peoples, and its child record Nicopolis lies in Epirus, in northwestern Greece.
4. **`sicily`:** `["Italy"]` → `["Italy", "Malta"]`, with `wikidata:Q233` (Malta) added to `summary.sources`.
   - The summary says "The province also included the island of Malta to the south", and the history explains that this is why `malta`'s parent is Sicily.
   - This is the Research Lead's own child-record method, as used for Patmos in Asia and Tarsus in Syria. Malta was already on the allow-list.
   - Italy comes first, since Sicily is by far the larger part.

## Failures (left at `draft`, back to the Research Lead)

Both need a new allow-list value. Under `schema/README.md`, the Research Lead adds allow-list values and the Fact-Checker reviews them, so I haven't added them myself. Both also need a decision on order that the cited sources don't settle.

1. **`arabia`:** "Southern Jordan" with `["Jordan"]` is contradicted by the record's own source.
   - **What the source says.** `bib:livius-nabataeans`, cited in the summary, says the Nabataeans were "an Arab nation in modern Jordan". It says the kingdom "controlled Bosra in Syria, and even, though briefly, Damascus", and that "Hegra (Mada'in Salih) was within the Nabataean frontiers". It places Hegra "in the northwest of Saudi Arabia". The record's own history repeats that the kingdom "reached Bosra in the north and Hegra in the south".
   - **Suggested fix.**
     - Add "Saudi Arabia" to the allow-list.
     - Set `modernCountries` to `["Jordan", "Saudi Arabia", "Syria"]`, or another order the Research Lead can source. Jordan comes first, per Livius.
     - Use a phrase such as "Jordan, with parts of Saudi Arabia and Syria".
     - Decide whether the Negev (Israel) and Sinai (Egypt) are among the main parts. Livius mentions Nabataean farming in the Negev, and ISBE says the New Testament's "Arabia" may mean the Sinai.
     - No new source is needed: Livius is already in `summary.sources`.
2. **`illyricum`:** "Coastal Croatia" with `["Croatia"]` doesn't match the record's own coordinates.
   - **What the record and its sources show.** The label point (`wikidata:Q753824`'s coordinate, 17.3294 E 43.8044 N) lies in central Bosnia and Herzegovina, 36.6 km inside (Natural Earth). Pleiades' point for the same province (`pleiades:981522`) is at Salona, in Croatia. The cited ISBE article describes an inland province, not a coast: two legions "at Delminium and at Burnum", and three judicial circuits covering Liburnia and Dalmatia.
   - **Suggested fix.**
     - Add "Bosnia and Herzegovina" to the allow-list.
     - Decide whether Montenegro, which the later province of Dalmatia also covered, needs a source and a place in the list.
     - Set `modernCountries` to `["Croatia", "Bosnia and Herzegovina"]`, in whatever order a source supports for "most of the place".
     - Use a phrase such as "Croatia and Bosnia and Herzegovina", and cite `wikidata:Q225`.

## PO rulings applied

1. **Salamis is "Cyprus", not "Northern Cyprus"** (the PO, 2026-10-05).
   - **The reasoning.** West Bank and Golan Heights are used because sovereignty there is disputed between states, and those names are the standard neutral names for the territory. For Cyprus, the island's name is also the name of the internationally recognized state. "Northern Cyprus" chiefly names an entity that only Türkiye recognizes, so using it would read as taking a side.
   - **Applied.** Applied to `salamis-cyprus`, the only record that used it. The value is removed from `$defs.modernCountry`, and "PO ruling" lines are added to the research note. The human will be asked to confirm this at the next mini checkpoint.
2. **Emmaus Nicopolis is resolved.** I confirmed that `emmaus`'s list, `["Israel", "West Bank"]`, is the same whichever way Imwas falls:
   - Abu Ghosh is in Israel (`wikidata:Q759606`, and NE 1.9 km inside), and Qaloniya/Motza is too (NE 1.7 km inside; Wikidata `Q2898847` has only "Mandatory Palestine").
   - El-Qubeibeh is in the West Bank (`wikidata:Q6041947`, P17 Palestine; NE 2.2 km inside).

   The Imwas sources themselves disagree:
   - Wikidata `Q847246` gives "Israel" (normal rank) and "Palestine" (deprecated).
   - Natural Earth places the point just inside its West Bank polygon, 0.5 km from the edge it shares with the "No Man's Land (Fort Latrun)" polygon.

   Whether Imwas is counted as Israel, West Bank or no-man's land, the list doesn't change.

## Validation

- `npm run validate:data`: **0 errors, 107 warnings**, the same count as the Research Lead's run. 106 are the existing scripture-linkage warnings (a verse that doesn't contain the place's name) and 1 is the existing 800 px image on `philadelphia-lydia`. None concerns modern names, countries or areas.
- `npm test`: **145/145** pass.
- `npm run test:app`: **93/93** pass (14 suites).
- `npm run build:data`: built 89 places.

## For the PO

1. **The Cyprus ruling**, for the human to confirm at the next mini checkpoint.
2. **Arabia and Illyricum** need a short Research Lead round, with a Fact-Checker check after it. Until then, the card's last acceptance criterion ("All 89 records are `verified` again") is not met, and CI still passes because `draft` is allowed. Both need new allow-list values ("Saudi Arabia", "Bosnia and Herzegovina", and possibly "Montenegro").
3. **CP3.5's description** of Emmaus Nicopolis as "in the former Latrun no-man's land" is slightly off. Natural Earth puts Imwas just inside the 1949 West Bank line, on the no-man's land's edge. Either way, no data change follows.
4. **Optional:**
   - `judea-province` could add "Syria" for Batanea and Trachonitis, if a source ties them to the province at AD 50.
   - `galilee` lists only Israel. Wikidata says "mainly located in northern Israel", and the record's own text says northern Israel.
   - Neither is a failure.
5. **Weak but acceptable sourcing.** Several records cite the country's own Wikidata item (`wikidata:Q43` for Türkiye on `lystra`, `pamphylia`, `cilicia`, `cappadocia`, `phrygia`). That item states nothing about the place itself, so the country rests on the record's coordinates. Natural Earth confirms every one, with each point well inside Türkiye. A later clean-up could cite each place's own Wikidata item where one exists.
