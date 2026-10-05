# M3-14 research note — Countries in modern names

Applies ADR-0028 (and its CP3.5 update, decision 1) and the rule in `docs/tasks/M3-14-modern-countries.md`
to all 89 `data/locations/*.json` records. Fills `names.modernCountries` on the 80 non-exempt records,
and an orienting `names.modern` phrase on the 24 area records (`type: "province"` or `"region"`) that
did not already have one; reviews the 5 that already did.

## Method

For every record, I read the record's own existing cited sources before adding anything. For records
whose identification already cites a `wikidata:` ID, I fetched that entity's JSON
(`https://www.wikidata.org/wiki/Special:EntityData/Q<id>.json`) and read its **P17 ("country")**
claims rather than relying on memory, in two batches covering the 99 distinct Wikidata IDs already
cited across the 89 records. Historical-only claims (Roman Empire, Byzantine Empire, Ottoman Empire,
Mandatory Palestine, and so on) were set aside in favor of claims naming a present-day state or
territory. Where a candidate's own cited entity carried no current-country claim, or where none of a
record's cited sources did, I looked up an additional, clearly-identifying Wikidata entity for that
specific modern country or territory (for example the country's own Wikidata item) and added it to
`summary.sources`, per the rule that a new source is only needed "if no existing source supports the
country." Two entities were found through Wikipedia's `pageprops` endpoint
(`wikibase_item`) when a direct Wikidata search did not surface them: Media (`wikidata:Q3853673`,
labelled "ancient region of north-western Iran") and modern Sicily (`wikidata:Q1460`, "island in the
Mediterranean, region of Italy", distinct from the cited Roman-province entity `wikidata:Q691321`,
which carries no modern-country claim).

For the five places under CP3.5 decision 1's named defaults (Bethlehem, Jericho, Bethany,
Sychar/Tell Balata, Qasr al-Yahud → "West Bank"; Banias/Caesarea Philippi and both Bethsaida
candidates → "Golan Heights"), the territory name follows the approved policy directly and does not
need a new dataset citation beating against it — several of these places' own cited Wikidata entities
in fact assert "Israel" (for example `wikidata:Q501773` and `wikidata:Q47466555` for Bethsaida's two
candidates), which the policy deliberately overrides, since, per ADR-0028, "the name describes where
the place is, not who should rule it."

Coordinates for every candidate were checked against the territory boundaries implied by ADR-0028
and CP3.5 decision 1 (the 1949 armistice line for the West Bank; the 1967 cease-fire line for the
Golan Heights) using each candidate's own already-cited `coordinateSource`.

## Allow-list additions

Two territory/country names were needed beyond the 17 already in `schema/location.schema.json`'s
`$defs.modernCountry`, added in this commit:

- **"Croatia"** — for Illyricum (the Roman province's core, governed from Salona on the Dalmatian
  coast, per the record's own cited `bib:isbe-illyricum`) and for Malta's low-confidence Mljet
  candidate (`wikidata:Q211306`, P17 Croatia), which was already in the record's own sources before
  this task.
- **"Northern Cyprus"** — for Salamis (`salamis-cyprus`), see "Extending the territory-naming
  principle" below.

**Update (2026-10-05, rework after the Fact-Checker's report):** two more additions, for the two
records the Fact-Checker sent back (see "Arabia and Illyricum rework" below):

- **"Saudi Arabia"** — for Arabia (`arabia`): its own cited `bib:livius-nabataeans`, read directly at
  livius.org, places Hegra ("Mada'in Salih") "in the northwest of Saudi Arabia," within "the
  Nabataean frontiers."
- **"Bosnia and Herzegovina"** — for Illyricum (`illyricum`): its own label point
  (`wikidata:Q753824`'s coordinate) sits in central Bosnia and Herzegovina, not coastal Croatia (the
  Fact-Checker's finding, confirmed against Natural Earth); the record's own cited `bib:isbe-illyricum`
  separately places one of the province's two legions at Delminium, in the same area.

**PO ruling (2026-10-05):** Salamis uses "Cyprus", and "Northern Cyprus" is removed from the
allow-list; see "Extending the territory-naming principle" below.

## Full per-record table

`—` marks the 9 exempt records (the two empires, `jerusalem`, and the 6 records whose parent chain
includes `jerusalem`), which correctly carry no `names.modernCountries`.

| id | type | names.modern | modernCountries |
|---|---|---|---|
| achaia | province | Southern Greece | Greece |
| antioch-pisidia | city | Yalvaç | Türkiye |
| antioch-syria | city | Antakya | Türkiye |
| arabia | province | Jordan, with parts of Saudi Arabia and Syria | Jordan, Saudi Arabia, Syria |
| asia | province | Western Türkiye | Türkiye, Greece |
| athens | city | Athens | Greece |
| berea | city | Veria | Greece |
| bethany-beyond-the-jordan | site | — | Jordan, West Bank |
| bethany | village | Al-Eizariya | West Bank |
| bethlehem | town | Bethlehem | West Bank |
| bethsaida | village | — | Golan Heights |
| bithynia | province | Northwestern Türkiye | Türkiye |
| caesarea-maritima | city | Caesarea | Israel |
| caesarea-philippi | city | Banias | Golan Heights |
| cana | village | — | Israel, Lebanon |
| capernaum | city | Kfar Nahum / Tell Hum | Israel |
| cappadocia | province | Central Türkiye | Türkiye |
| cenchreae | town | Kechries | Greece |
| chorazin | village | Khirbet Karraza / Korazim | Israel |
| cilicia | region | Southeastern Türkiye | Türkiye |
| colossae | town | Near Honaz | Türkiye |
| corinth | city | Ancient Corinth | Greece |
| crete-cyrene | province | Crete and eastern Libya | Greece, Libya |
| crete | region | Crete | Greece |
| cyprus | province | Cyprus | Cyprus |
| damascus | city | Damascus | Syria |
| derbe | town | — | Türkiye |
| egypt | province | Egypt | Egypt |
| emmaus | village | — | Israel, West Bank |
| ephesus | city | Selçuk | Türkiye |
| galatia | province | North-central Türkiye | Türkiye |
| galilee | region | Galilee | Israel |
| gethsemane | site | Gethsemane | — (exempt) |
| golgotha | site | — | — (exempt) |
| hierapolis | city | Pamukkale | Türkiye |
| iconium | city | Konya | Türkiye |
| illyricum | province | Bosnia and Herzegovina, with the Croatian coast | Bosnia and Herzegovina, Croatia |
| italy | province | Italy | Italy |
| jericho | city | Jericho | West Bank |
| jerusalem | city | Jerusalem | — (exempt) |
| joppa | city | Jaffa | Israel |
| judea-province | province | Israel, the West Bank, Jordan and the Golan Heights | Israel, West Bank, Jordan, Golan Heights |
| judea | region | Hill country in the West Bank and Israel | West Bank, Israel |
| laodicea | city | Near Denizli | Türkiye |
| libya | region | Eastern Libya | Libya |
| lycaonia | region | South-central Türkiye | Türkiye |
| lystra | town | Near Hatunsaray | Türkiye |
| macedonia | province | Parts of Greece, North Macedonia and Albania | Greece, North Macedonia, Albania |
| magdala | village | Migdal | Israel |
| malta | natural-feature | Malta | Malta, Croatia |
| media | region | Northwestern Iran | Iran |
| mesopotamia | region | Mostly Iraq, with parts of Syria and Türkiye | Iraq, Syria, Türkiye |
| miletus | city | Near Balat | Türkiye |
| mount-of-olives | natural-feature | Mount of Olives | — (exempt) |
| mysia | region | Northwestern Türkiye | Türkiye |
| nain | village | Nein | Israel |
| nazareth | town | Nazareth | Israel |
| neapolis-macedonia | city | Kavala | Greece |
| nicopolis | city | Near Preveza | Greece |
| pamphylia | region | Southern Türkiye | Türkiye |
| paphos | city | Kato Paphos | Cyprus |
| parthian-empire | empire | — | — (exempt) |
| patmos | natural-feature | Patmos | Greece |
| perga | city | Near Antalya | Türkiye |
| pergamum | city | Bergama | Türkiye |
| philadelphia-lydia | city | Alaşehir | Türkiye |
| philippi | city | Filippoi | Greece |
| phrygia | region | West-central Türkiye | Türkiye |
| pisidia | region | Southwestern Türkiye | Türkiye |
| pontus | region | Northeastern Türkiye | Türkiye |
| pool-of-bethesda | site | Pool of Bethesda | — (exempt) |
| pool-of-siloam | site | Pool of Siloam | — (exempt) |
| puteoli | city | Pozzuoli | Italy |
| roman-empire | empire | — | — (exempt) |
| rome | city | Rome | Italy |
| salamis-cyprus | city | Near Famagusta | Cyprus (PO ruling; proposed: Northern Cyprus) |
| samaria | region | Hill country in the northern West Bank | West Bank |
| sardis | city | Sart | Türkiye |
| sea-of-galilee | natural-feature | Sea of Galilee / Lake Kinneret | Israel |
| sicily | province | Sicily | Italy |
| smyrna | city | İzmir | Türkiye |
| sychar | village | Tell Balata | West Bank |
| syria | province | Syria, Lebanon and southeastern Türkiye | Syria, Lebanon, Türkiye |
| tarsus | city | Tarsus | Türkiye |
| temple-mount | site | Temple Mount / Haram al-Sharif | — (exempt) |
| thessalonica | city | Thessaloniki | Greece |
| thyatira | city | Akhisar | Türkiye |
| troas | city | Near Ezine | Türkiye |
| tyre | city | Sour / Tyre | Lebanon |

After verification, the Fact-Checker changed Achaia's and Galatia's phrases and added Malta to Sicily,
and sent Arabia and Illyricum back for rework; see `docs/verification/M3-modern-countries.md`. The
rows above for `arabia` and `illyricum` already show the reworked values; see "Arabia and Illyricum
rework" below for the reasoning.

### Sources behind each country (where not obvious from the record's own candidate `coordinateSource`)

Most ordinary (non-area, non-disputed) records follow directly from the cited candidate's own
Wikidata P17 claim (for example `ephesus` → `wikidata:Q47611` → Türkiye; `tyre` → `wikidata:Q82070` →
Lebanon; `rome` → `wikidata:Q220` → Italy). New `summary.sources` additions beyond that pattern:

| id | new source(s) added | why |
|---|---|---|
| achaia, asia, crete-cyrene, macedonia | `wikidata:Q41` (Greece) | cited entities (`Q204772`, `Q210718`, `Q692775`, `Q207497`) carry only historical-empire P17 claims |
| arabia | `wikidata:Q810` (Jordan) | `wikidata:Q11029653` (Nabataean kingdom) carries no modern P17; Saudi Arabia and Syria need no new source, since the already-cited `bib:livius-nabataeans`, read directly, names Bosra and Damascus (Syria) and Hegra/Al-Ula (Saudi Arabia) as within the kingdom's frontiers |
| judea-province | `wikidata:Q810` (Jordan) | `wikidata:Q1003997` (Roman Judaea) carries no modern P17 |
| asia, cappadocia, cilicia, lystra, pamphylia, phrygia, syria | `wikidata:Q43` (Türkiye) | cited entities carry only historical-empire P17, or (lystra, pamphylia) cite no Wikidata ID at all |
| crete-cyrene | `wikidata:Q1016` (Libya) | as above |
| cyprus (province) | `wikidata:Q229` (Cyprus) | `wikidata:Q2967757` carries only historical P17 |
| egypt | `wikidata:Q79` (Egypt) | `wikidata:Q202311` carries only "Ancient Egypt" |
| illyricum | `wikidata:Q224` (Croatia), `wikidata:Q225` (Bosnia and Herzegovina, added in the 2026-10-05 rework) | `wikidata:Q753824` carries only historical P17; Croatia is grounded in the record's own cited Salona/"Dalmatian coast" text, Bosnia and Herzegovina in the record's own label point and `bib:isbe-illyricum`'s Delminium legion base |
| italy (province) | `wikidata:Q38` (Italy) | `wikidata:Q913582` ("Roman Italy") carries only historical P17 |
| judea-province | `wikidata:Q801` (Israel), `wikidata:Q36678` (West Bank), `wikidata:Q83210` (Golan Heights) | see "Areas spanning several countries" below |
| judea (region) | `wikidata:Q36678` (West Bank) | the cited `wikidata:Q104028` gives only Israel; the record's own candidate coordinate sits in the hill country south of Hebron, in the West Bank |
| macedonia | `wikidata:Q221` (North Macedonia), `wikidata:Q222` (Albania) | matches the task's own worked example for this record |
| media | `wikidata:Q3853673` | found via Wikipedia `pageprops`; described in its own Wikidata label/description as "ancient region of north-western Iran" |
| sicily (province) | `wikidata:Q1460` | the modern-island entity, distinct from the cited Roman-province entity |
| syria (province) | `wikidata:Q858` (Syria), `wikidata:Q822` (Lebanon) | see "Areas spanning several countries" below |

`mesopotamia`'s extra countries (Syria, Türkiye, alongside the P17-confirmed Iraq) needed no new
source: the record's own candidate `support` text, already citing `pleiades:874602`, states that
Pleiades describes the region as "covering most of modern Iraq and parts of Syria and Turkey."

## Special cases

### Disputed territory (CP3.5 decision 1)

Applied exactly as approved: **West Bank** for Bethlehem, Jericho, Bethany (Al-Eizariya), Sychar
(Tell Balata) and the Qasr al-Yahud candidate of Bethany beyond the Jordan; **Golan Heights** for
Banias (Caesarea Philippi) and both Bethsaida candidates (et-Tell and el-Araj). In every one of
these cases the place's own cited Wikidata entity in fact asserts "Israel" (or, for Bethlehem,
"State of Palestine" and historically "Jordan"); the project's approved territory name is used
instead, per ADR-0028's rule that the name describes location, not sovereignty.

### Extending the territory-naming principle: Northern Cyprus

Salamis (`salamis-cyprus`)'s single candidate sits near Famagusta, in the area administered since
1974 by the unrecognized "Turkish Republic of Northern Cyprus," not by the Republic of Cyprus. Its
own cited Wikidata entity (`wikidata:Q767089`) carries two current-rank P17 claims side by side,
"Northern Cyprus" and "Cyprus," reflecting the same kind of sovereignty dispute ADR-0028 already
addresses for the West Bank and Golan Heights. CP3.5 decision 1 did not name Cyprus among its
examples, but its stated principle ("the name most English news and reference works use... describes
where the place is, not who should rule it") applies the same way here: English sources describing
Salamis's ruins routinely place them in "Northern Cyprus." I added **"Northern Cyprus"** to the
schema allow-list and used it for this one record. **This is a new application of the policy beyond
CP3.5's named examples, not a case the human has separately confirmed — flagged for the PO below.**

**PO ruling (2026-10-05):** "Cyprus", not "Northern Cyprus". West Bank and Golan Heights are the
standard neutral names for territory whose sovereignty is disputed between states. For Cyprus, the
island's name is also the internationally recognized state's name, while "Northern Cyprus" chiefly
names an entity that only Türkiye recognizes, so using it would read as taking a side. `salamis-cyprus`
now lists "Cyprus" (supported by the same `wikidata:Q767089` P17 claims), and "Northern Cyprus" is
no longer on the allow-list. The human is asked to confirm at the next mini checkpoint.

### Multi-candidate places

- **Cana** (`cana`): Khirbet Qana and Kafr Kanna (both disputed confidence, both in Israel's Galilee,
  per `wikidata:Q17199012` and `wikidata:Q2633158`) plus Qana, Lebanon (low confidence,
  `wikidata:Q753812`). `modernCountries: ["Israel", "Lebanon"]`, matching the task's own worked
  example.
- **Malta** (`malta`): Malta (high confidence, `wikidata:Q233` → Malta) plus Mljet (low confidence,
  `wikidata:Q211306` → Croatia). `modernCountries: ["Malta", "Croatia"]`.
- **Bethany beyond the Jordan** (`bethany-beyond-the-jordan`): Al-Maghtas (medium confidence, east
  bank, Jordan) plus Qasr al-Yahud (low confidence, west bank, West Bank under the CP3.5 default).
  `modernCountries: ["Jordan", "West Bank"]`, matching the task's own worked example.
- **Emmaus** (`emmaus`): four candidates. Abu Ghosh (low confidence, `wikidata:Q759606` → Israel,
  unambiguous) and El-Qubeibeh (low confidence, `wikidata:Q6041947` → State of Palestine / West
  Bank, unambiguous) between them already cover both "Israel" and "West Bank." The other two
  candidates are each individually less clear-cut (see "Flagged for the PO"), but **neither changes
  the final two-country list**, so `modernCountries: ["Israel", "West Bank"]` is used without
  waiting on that question.

### Areas spanning several countries

- **Syria** (province): the record's own cited history explicitly states that "at AD 50 Tarsus and
  the Cilician plain were governed from Syria" (so a modern-Türkiye city, Tarsus, is this province's
  own child record), and Tyre (modern Lebanon) is likewise a child of this province in the dataset.
  `modernCountries: ["Syria", "Lebanon", "Türkiye"]`; phrase "Syria, Lebanon and southeastern
  Türkiye."
- **Asia** (province): the record's own history explicitly states "the province apparently included
  Patmos and other islands near its coast, which is why this project places Patmos in Asia" — a
  modern-Greece natural feature. `modernCountries: ["Türkiye", "Greece"]`; the orienting phrase stays
  "Western Türkiye" (Patmos is a minor, explicitly-flagged exception, not the bulk of the province).
- **Judea (the Roman province, `judea-province`)**: the record's own cited history states it governed,
  from AD 44, "Judea, Samaria, Galilee, Perea and the former tetrarchy of Philip." Mapped against this
  project's other records: Judea/Samaria/Galilee → Israel and the West Bank (see below); Perea →
  Jordan (east of the river); the former tetrarchy of Philip's core, Gaulanitis, → the Golan Heights.
  `modernCountries: ["Israel", "West Bank", "Jordan", "Golan Heights"]` (4 of the allowed 6).
  **Scope note:** the tetrarchy also included Trachonitis, Batanea and Iturea, whose modern mapping
  (mostly southern Syria) is not spelled out in this specific record's own cited text, so "Syria" was
  deliberately left out rather than inferred; a future task can add it if a source is found that ties
  those place-names to this record directly.
- **Mesopotamia** (region): per its own cited Pleiades description (see table above),
  `modernCountries: ["Iraq", "Syria", "Türkiye"]`.
- **Crete and Cyrene** (province, `crete-cyrene`): its own two child records are Crete (Greece) and
  Libya (the Cyrenaican district, in modern Libya). `modernCountries: ["Greece", "Libya"]`.
- **Macedonia** (province): matches the task's own worked example, `["Greece", "North Macedonia",
  "Albania"]`; the record's own four child cities (Berea, Philippi, Thessalonica, Neapolis) are all in
  modern Greece, but the Roman province's full historical extent, which this record represents, reached
  into both of the other two modern countries.

### Arabia and Illyricum rework (2026-10-05, after the Fact-Checker's report)

The Fact-Checker's `docs/verification/M3-modern-countries.md` found both of these records' original
countries too narrow, each contradicted by a source the record already cites. Both are reworked here;
the Fact-Checker re-verifies them next.

- **Arabia** (`arabia`): the original `["Jordan"]` / "Southern Jordan" matched only the label point
  (Petra). Reading `bib:livius-nabataeans` directly (not just the record's own paraphrase of it) shows
  the Nabataean kingdom's own stated frontiers reached well beyond Jordan: "In the north, it
  controlled Bosra in Syria, and even, though briefly, Damascus. To the south, Hegra (Mada'in Salih)
  was within the Nabataean frontiers, just like the nearby oasis of Al-Ula... in the east, the
  Nabataean king controlled several oases (Têma, Hayil, and Dawmat al-Jandal)" — Hegra, Al-Ula, Têma,
  Hayil and Dawmat al-Jandal are all in modern Saudi Arabia. `modernCountries` is now `["Jordan",
  "Saudi Arabia", "Syria"]` (Jordan first, since Livius itself calls the Nabataeans "an Arab nation in
  modern Jordan" and Petra, the kingdom's capital and this record's label point, is there); phrase
  "Jordan, with parts of Saudi Arabia and Syria." No new source was needed: `bib:livius-nabataeans` was
  already cited in `summary.sources` before this rework.
  - **Scope note:** the same Livius page also names two towns "in the west," Rhinocolura (modern
    Al-Arish, Egypt) and Gaza, and separately mentions Nabataean farming "in the Negev desert"
    (modern Israel). Unlike Bosra/Damascus and Hegra/Al-Ula, which Livius calls the kingdom's north
    and south *frontiers*, these are listed as outlying towns and agricultural activity on the
    kingdom's western edge, next to "the Jewish kingdom of Herod the Great and his sons" — the source
    describes a border zone, not territory the kingdom is said to hold outright. The International
    Standard Bible Encyclopedia's separate note that the New Testament's word "Arabia" can mean "the
    Syrian desert or the peninsula of Sinai" is about the word's range of senses elsewhere in the New
    Testament, not a claim about what this specific kingdom controlled. Egypt and Israel are left out
    of `modernCountries` on that basis, keeping the list to the three countries the source most
    clearly supports as the kingdom's own extent.
- **Illyricum** (`illyricum`): the original `["Croatia"]` / "Coastal Croatia" didn't match the record's
  own label point. The Fact-Checker found that `wikidata:Q753824`'s coordinate (17.3294 E, 43.8044 N)
  sits 36.6 km inside Bosnia and Herzegovina (Natural Earth), not Croatia. Reading `bib:isbe-illyricum`
  directly confirms the province was never just a coastal strip: it names the provincial capital,
  "Salonae (modern Spalato)" — Split, on the Croatian coast — but also says "two legions were
  stationed there, at Delminium and at Burnum," and Delminium is the Roman-era name for the area
  around modern Tomislavgrad, in Bosnia and Herzegovina, close to the record's own label point.
  `modernCountries` is now `["Bosnia and Herzegovina", "Croatia"]` (Bosnia and Herzegovina first,
  since that is where the record's own label point and one of its two legionary bases sit; Croatia
  second, for the provincial capital at Salona); phrase "Bosnia and Herzegovina, with the Croatian
  coast." New source: `wikidata:Q225` (Bosnia and Herzegovina), added to `summary.sources` alongside
  the already-cited `wikidata:Q224` (Croatia).
  - **Scope note:** the Fact-Checker also asked whether Montenegro, which the later, enlarged
    province of Dalmatia also reached, needs a place in the list. `bib:isbe-illyricum` describes the
    province's three judicial circuits by the towns at their head (Scardona, Salonae, Narona), none of
    which is in modern Montenegro, and names no place there directly; "Montenegro" is left off the
    list and off the allow-list for the same reason Egypt and Israel are left off Arabia's: nothing
    in the record's own cited sources names a location there.

### Area orienting phrases

The 24 area records that previously had no `names.modern` now carry a short geographic phrase (see
the table above for each one). Each phrase describes the modern geography the ancient area occupied,
using the project's own existing cited identification (for example Pleiades' and Wikidata's label
points) plus, where relevant, the extra countries discussed above; none repeats a political claim.
Judea and Samaria, which M3-08 had deliberately left without a modern name because every available
name "carries a political meaning," now get a purely geographic phrase ("Hill country in the West
Bank and Israel" / "Hill country in the northern West Bank") under CP3.5's newer, narrower rule that
areas must have an orienting `names.modern`, while still avoiding "Judea and Samaria" as a combined
political designation.

The 5 area records that already had a `names.modern` value (Crete, Cyprus, Galilee, Italy, Sicily)
were reviewed against the new rule and kept unchanged: each is already a plain, single-country,
non-political geographic name, which the rule explicitly allows in place of a longer phrase.

## Flagged for the PO

1. **Northern Cyprus** (see above): adding this territory name to the allow-list, and using it for
   Salamis, is a reasoned extension of ADR-0028's stated principle, but it is a case the human has not
   separately confirmed the way West Bank and Golan Heights were confirmed at CP3.5. Please confirm
   or override.
   **PO ruling (2026-10-05):** "Cyprus"; see the ruling under "Extending the territory-naming
   principle" above.
2. **Emmaus Nicopolis (Imwas)**, one of `emmaus`'s four candidates, sits in the former Latrun
   no-man's land (1949–1967), exactly the case the task names as an example of genuine unclear
   status. Its own cited Wikidata entity (`wikidata:Q847246`) currently carries three P17 claims:
   "Israel" (normal rank), "State of Palestine" (**deprecated** rank, with a qualifier explaining the
   deprecation), and the historical "Judaea" (normal rank, clearly meant as a historical-period
   marker rather than a current claim). Taken at face value, Wikidata's own preferred reading is
   "Israel," but the site's unusual post-1949 history (no-man's land, then absorbed into Israeli-
   administered Canada Park after 1967) is exactly the kind of case this task says not to decide
   silently. **I have not chosen a side for this candidate.** It does not matter for this record's
   final value: `emmaus`'s other two candidates, Abu Ghosh (Israel) and El-Qubeibeh (West Bank),
   already establish both entries in `modernCountries: ["Israel", "West Bank"]` regardless of which
   way Imwas falls.
   **PO ruling (2026-10-05):** resolved. The Fact-Checker confirmed that the list is the same
   whichever way Imwas falls (`docs/verification/M3-modern-countries.md`).
3. **Qaloniya/Motza**, a second `emmaus` candidate, has no current-country Wikidata claim at all
   (only "Mandatory Palestine", a pre-1948 historical entity, since the item describes a depopulated
   1948 village rather than today's adjacent Israeli locality). Its coordinates place it unambiguously
   within Israel, just west of Jerusalem, in an area that has never been part of the West Bank or any
   other disputed territory. This is a Wikidata data gap rather than a genuine dispute, and again does
   not affect `emmaus`'s final two-country list. Noted for the Fact-Checker's awareness, not flagged
   as unresolved.

No other case was left undecided.
