# M4 research note — first-century political changes, 4 BC – AD 100

Research for card `docs/tasks/M4-02-timeline.md`, phase 1. This note is the Research Lead's input to M4-01's data model; it does not depend on that model and adds no data files. Phase 2 (after the PO merges M4-01's schema) encodes this note as data.

## 1. How to read this note

- **Years** are integers; BC years are negative; there is no year 0 (so 1 BC is `-1` and AD 1 is `1`). For a period, `toYear` is the year the change happened, matching the convention already used in `politicalHistory` (for example `-4` to `6`, then `6` to `41`).
- **Areas** (§2) are units that changed hands together, at the detail the sources support, and that the sources describe well enough to draw as land (ADR-0037 item 3). Some match an existing `data/locations/*.json` area record; some do not yet have one (noted in each heading, and listed again in §7). A unit without a drawable territory of its own — a free city, the cities of the Decapolis, or a town another ruler received without its surrounding land — is recorded as a holder of its place instead (§6), not as an area; §2.7 explains this for the Decapolis. Where this note is unsure an area's extent is well enough attested to draw on its own, it says so, so M4-03 can merge that area into a neighbour. Judea, Samaria and Idumea never differ in holder, so they are one area; so are Galilee and Perea (in two pieces) — §2.1, §2.2. §2.24 gives cited border descriptions, with landmarks, for the borders AWMC lacks.
- **Entities** (§3) are the political bodies that held one or more areas (a kingdom, a tetrarchy, a province under a given status, and so on), so the areas' period tables can point to one short entity id instead of repeating a long description.
- **Stops** (§4) are the subset of period boundaries that change the map, under ADR-0037 item 1. A stop can be a border, a ruler or a status change (as the brief's four examples all are), or a change in the name the map shows for an area or entity; §5 lists every name change found, including the few that are stops.
- **Places** (§6) lists every current location record's area and whether it is consistent with this note or an explained exception.
- Sources already cited in the project's existing, Fact-Checker-verified records (mainly the M2 batch-1 places, which cite `bib:rainey-notley-sacred-bridge`, the Rainey & Notley atlas no one on the team could open — CP3b decision 2) are carried forward as the prior baseline where this note does not change them. Every **new** claim in this note cites a source opened for this task; see §9 for the list of newly opened or newly added sources. CP3b decision 2 applies here too: this note replaces `bib:rainey-notley-sacred-bridge` wherever it touches a period this note documents, and flags the rest for the next time that text is edited.
- **Josephus citations** use the book and chapter numbers of Whiston's translation as published at `ccel.org` (the edition opened for this note), each with a short description, because that edition does not print the Niese section numbers (e.g. "18.106") that secondary works often cite. Readers using a Niese-numbered edition should search by the quoted detail, not the chapter number alone.

## 2. Areas and their periods

### 2.1 Judea, Samaria and Idumea (one area: `judea-samaria-idumea`)

**Merged per the PO's review:** Judea, Samaria and Idumea never differ in holder, so this note treats them as one drawable area, `judea-samaria-idumea`, needing no internal border. The existing region records `judea` and `samaria` (and a future `idumea` record) keep their own map labels and placement within it (per the existing "about AD 50" parenting), but share this one political history. The existing `judea-province` record is better understood as the **entity** "Roman province of Judea" (§3, id `roman-province-judea`): it holds exactly this area from AD 6, and also `galilee-perea` and `philip-tetrarchy-lands` once those join it (from AD 44) — so its own true extent changes over time, which is a property of the holder, not of this fixed area. These moved together for the whole period: one ethnarchy (4 BC), then one province (from AD 6), under the procurators again after AD 44.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -37 | -4 | Client kingdom | Herod the Great | `bib:rainey-notley-sacred-bridge` (existing) | |
| -4 | 6 | Ethnarchy of Judea, Samaria and Idumea | Herod Archelaus | `bib:josephus-antiquities` (17.8, Herod's will; 17.11.4, Augustus's division); `scripture:Matthew 2:22` | Augustus did not grant Archelaus the royal title his father's will asked for, only "ethnarch," with kingship promised later if he ruled well (`bib:josephus-antiquities` 17.11.4). |
| 6 | 41 | Roman province (prefects) | Augustus's and Tiberius's prefects, e.g. Pontius Pilate (`scripture:Luke 3:1`) | `bib:josephus-antiquities` (17.13.1–2, Archelaus banished; 18.1, Quirinius's census and Coponius); `bib:josephus-jewish-war` (2.7.3–2.8.1); `scripture:Luke 2:1-2` | The governors of 6–41 are called "prefect" on the Pilate inscription found at Caesarea in 1961; Josephus (Whiston's translation) calls them "procurator" throughout, the same word he uses after 44. This note uses "prefect" for 6–41 and "procurator" for 44 on, following the inscription, and flags the difference for the Fact-Checker. **Luke's census (Luke 2:1–2) is dated to this same Quirinius, but to the time of Herod's birth narrative, years before Herod's death in 4 BC; Josephus dates Quirinius's census to AD 6, after Herod's death.** This note does not resolve the question; see §4 (stop at 6). Quirinius himself is not modeled as a holder (§3): he governed Syria and conducted a census, but did not hold Judea as its ruler. |
| 41 | 44 | Client kingdom, reunified | Herod Agrippa I | `bib:josephus-antiquities` (19.5.1, Claudius adds Judea and Samaria "as due to his family"); `scripture:Acts 12:1,12:19-23` | |
| 44 | 70 | Roman province (procurators) | e.g. Antonius Felix, Porcius Festus (`scripture:Acts 23-26`) | `bib:josephus-antiquities` (19.9.2, Fadus sent "to be procurator of Judea, and of the entire kingdom"); `scripture:Acts 25:1,25:23` | |
| 70 | 100 | Roman province, now with a legion based at Jerusalem; no further border change found to AD 100 | Legates in place of procurators | `bib:josephus-jewish-war` (7, the war's end); `bib:livius-titus`, `bib:livius-domitian`, `bib:livius-nerva`, `bib:livius-trajan` (the emperors of this span; see §2.23) | This is an administrative upgrade (a praetorian legate instead of a procurator), not a border or name change, so it is not treated as a stop (ADR-0037 item 1's example). The existing `judea-province.json` record's table currently ends its last entry at 70 ("procuratorial rule"); no source found for a further change before 100, so phase 2 should continue this row to 100 rather than leave a gap. |

**Idumea** (no record; `scripture:Mark 3:8` names it, WEB: "from Jerusalem, from Idumaea, beyond the Jordan..."): held exactly as Judea/Samaria above (part of Archelaus's ethnarchy, then the province) — `bib:josephus-antiquities` 17.11.4 ("Idumea, and Judea... paid tribute to Archelaus"). Aristobulus's earlier annexation of part of Idumea to the Hasmonean state (140 BC) is Old Testament-period background, not part of this window.

**Samaria:** same table as Judea above. Its current record's `politicalHistory` is empty; phase 2 should give it the same table.

### 2.2 Galilee and Perea (one area, two pieces: `galilee-perea`)

**Merged per the PO's review:** Galilee and Perea never differ in holder either, so this note treats them as one area, `galilee-perea` — in two separate pieces, since the Jordan and the Sea of Galilee lie between them, not land. Nero's grant of towns (next table, last row) is of towns, not land, so it does not split this area either (ADR-0037 item 3). `galilee` exists as a region record and keeps its own label; **Perea has no record yet.** Moved together under Antipas, then Agrippa I, then the province.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -37 | -4 | Client kingdom | Herod the Great | `bib:rainey-notley-sacred-bridge` (existing) | |
| -4 | 39 | Tetrarchy | Herod Antipas | `bib:josephus-antiquities` (17.8, the will; 17.11.4, "to him it was that Perea and Galilee paid their tribute"); `scripture:Luke 3:1,23:6-7` | Antipas is "Herod the tetrarch" in the Gospels; the Gospels never use "Antipas." |
| 39 | 44 | Client kingdom (added to Agrippa I's) | Herod Agrippa I | `bib:josephus-antiquities` (18.7.2, Caligula "took away from him his tetrarchy, and gave it... to Agrippa") | Antipas was banished after his wife Herodias pressed him to seek the royal title Caligula had just given her brother Agrippa I. Antiquities (18.7.2) places the banishment at Lugdunum (Lyon) in Gaul; the Jewish War (2.9, "he was punished for his ambition, by being banished into Spain") names Spain instead. Both are Josephus's own words; this note does not resolve the discrepancy. |
| 44 | 54 (or 61) | Roman province (procurators) | | `bib:josephus-antiquities` (19.9.2) | |
| 54 (or 61) | 100 | Mostly the province; **Tiberias and Tarichaeae (Galilee) and Julias-in-Perea with 14 villages** pass to Agrippa I's kingdom instead | Herod Agrippa II | `bib:josephus-antiquities` (20.8.4, "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichaeae... He gave him also Julias, a city of Perea, with fourteen villages"); on the year, `bib:jewish-encyclopedia-agrippa-ii` | Josephus dates this grant to "the first year of the reign of Nero" (AD 54). The Jewish Encyclopedia notes Agrippa II's coins carry two era-starting years, 53 and 61, and reads the second as this grant's real date, from numismatic evidence Josephus's narrative does not mention. This note presents both; see the stop at §4 (folded into the AD 53 stop, since these towns are not drawable land of their own, ADR-0037 item 3). No current place record is Tiberias, Tarichaeae, or the Perea Julias (not Bethsaida's Julias — see §5.2), so no place needs reassignment either way (§6). |

**Perea** (no record; e.g. `scripture:Matthew 19:1`, "the borders of Judea beyond the Jordan"; John 10:40): same table as Galilee, substituting "Julias in Perea with 14 villages" for "Tiberias and Tarichaeae" at the last row.

### 2.3 Gaulanitis, Batanea, Trachonitis and Auranitis (Philip's former tetrarchy)

These four districts, which the sources never clearly separate from one another by border, moved together for the whole period. **No area record yet covers them as a group**; `caesarea-philippi` and `bethsaida` (both existing place records) sit here. Proposed area id: **`philip-tetrarchy-lands`** (confirmed by the PO; not `gaulanitis`, since a later record named "Gaulanitis" on its own would mean the Golan alone, one of the four districts here, not all of them). Map labels come from the holder in force each year, not from this area id (ADR-0037, visual spec update).

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -20 | -4 | Added to Herod the Great's kingdom (the "House of Zenodorus") | Herod the Great | `bib:isbe-ituraea` (Augustus "bestowed on Herod, 20 BC") | |
| -4 | 34 | Tetrarchy | Herod Philip | `bib:josephus-antiquities` (17.8, "Gaulonitis, and Trachonitis, and Paneas" in Herod's will; 17.11.4, Augustus confirms "Batanea, and Trachonitis, as well as Auranitis... to Philip"; 18.4.6, Philip's death, "tetrarch of Trachonitis and Gaulanitis, and of the nation of the Bataneans... thirty-seven years") | **Josephus names the district components differently in each of these three passages** (adding or dropping Paneas/Auranitis each time); `scripture:Luke 3:1` adds a fourth name, "Ituraea," that Josephus never uses for Philip's realm. `bib:isbe-ituraea` discusses the overlap and concludes it is "not clear whether Luke intended to indicate two separate parts of the dominion of Philip, or used names which to some extent overlapped." This note does not resolve it. |
| 34 | 37 | Attached to the province of Syria (Philip died without an heir) | Governor of Syria | `bib:josephus-antiquities` (18.4.6); `bib:isbe-trachonitis` | |
| 37 | 44 | Client kingdom | Herod Agrippa I | `bib:josephus-antiquities` (18.6.10, Caligula "appointed him to be king of the tetrarchy of Philip") | |
| 44 | 53 | Roman province (procurators) | | `bib:josephus-antiquities` (19.9.2); `bib:isbe-trachonitis` ("administered by Roman officers" during Agrippa II's minority) | |
| 53 | 100 | Client kingdom | Herod Agrippa II | `bib:josephus-antiquities` (20.7.1, "he bestowed upon Agrippa the tetrarchy of Philip and Batanea, and added thereto Trachonites, with Abila"); `bib:isbe-trachonitis` ("From 53 till 100 AD it was ruled by Agrippa II") | The existing `bethsaida.json` record's table ends this period at 70; no source found for a change in 70, and `bib:isbe-trachonitis`, `bib:jewish-encyclopedia-agrippa-ii` and `bib:livius-herod-agrippa-ii` all describe Agrippa II's rule continuing after the war (he fought on the Roman side) to his death in 100 (see §4). Phase 2 should correct the end year here. |
| 100 | 106 | Added to the province of Syria | | `bib:isbe-abilene` ("his kingdom was incorporated in the province of Syria") | In 106 this area, with the Nabataean kingdom, became the new province of Arabia (`bib:isbe-trachonitis`; `bib:livius-nabataeans`) — after this note's AD 100 end point. |

### 2.4 Abilene

No current record (proposed id `abilene`). Its history runs with §2.3 from AD 37 on, but it has its own, separately-attested earlier history.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -36/-35 | Part of the Iturean kingdom | Lysanias (I) | `bib:isbe-abilene`; `bib:isbe-ituraea` (Dio Cassius calls him "king of the Itureans") | This Lysanias was put to death by Mark Antony, c. 36/35 BC — before this note's window. |
| -35? | 37 | A separate tetrarchy, history obscure | "Lysanias the tetrarch" (`scripture:Luke 3:1`) | `bib:isbe-abilene` ("nothing further is known of the tetrarch Lysanias") | ISBE directly addresses the old objection that Luke 3:1's Lysanias must be the one killed in 36 BC: "the circumstances in which Abilene became [a] distinct tetrarchy are altogether obscure," implying a second, later ruler of the same name, attested by Josephus (`bib:josephus-antiquities` 19.5.1; 20.7.1) and a dedication inscription near Abila itself that ISBE describes. |
| 37 | 44 | Added to Agrippa I's kingdom | Herod Agrippa I | `bib:josephus-antiquities` (18.6.10, "the tetrarchy of Lysanias" given with Philip's); `bib:isbe-abilene` | Josephus's account of Claudius's settlement in 41 (`bib:josephus-antiquities` 19.5.1) also names "Abila of Lysanias" as something Claudius "bestowed... as out of his own territories" — unclear whether this records a fresh grant or a confirmation of Caligula's 37 grant. This note presents both. |
| 44 | 53 | Roman province (procurators) | | `bib:isbe-abilene` | |
| 53 | 100 | Added to Agrippa II's kingdom | Herod Agrippa II | `bib:josephus-antiquities` (20.7.1, "Abila; which last had been the tetrarchy of Lysanias"); `bib:isbe-abilene` | |

### 2.5 Chalcis

No current record (proposed id `chalcis`); no map place sits here. Chalcis (in the Beqaa valley, capital of the old Iturean kingdom under Lysanias — `bib:isbe-ituraea`) became a small Herodian client kingdom distinct from Judea. **Doubt flag:** the sources this note opened describe Chalcis politically (who ruled it, and when) but not geographically — `bib:isbe-ituraea`'s "he ruled over the land from Damascus to the sea" describes the older, larger Iturean realm under the first Lysanias, not necessarily the smaller territory later kings of Chalcis held. If AWMC or another cited description does not give this smaller Chalcis its own boundary, M4-03 should merge it into a neighbouring area (Abilene or Syria are the most likely candidates) rather than guess at a shape.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| 41 | 48 | Client kingdom | Herod (of Chalcis), Agrippa I's brother | `bib:josephus-antiquities` (19.5.1, "begged for him of Claudius the kingdom of Chalcis"); `bib:jewish-encyclopedia-herod-ii` (gives his death as "48-49 C.E.") | |
| 48 | 50 | **Uncertain** (kind: `uncertain`) | None named | — | No source this note opened names a holder for this span: Josephus does not say who, if anyone, ruled Chalcis between Herod's death and Agrippa II's appointment. Per the PO's instruction, this is modeled as an unclear status, not a guess or a silent gap. |
| 50 | 53 | Client kingdom | Herod Agrippa II | `bib:jewish-encyclopedia-agrippa-ii` ("In the year 50... he had himself appointed... to the principality of Chalcis"); `bib:josephus-antiquities` (20.7.1, "he took from him Chalcis, when he had been governor thereof four years") | |
| 53 | 72 | **Uncertain** (kind: `uncertain`) | Not named until 72: Aristobulus (son of Herod of Chalcis), by then "king of the country called Chalcidene" | `bib:josephus-jewish-war` (7.7.1, Aristobulus assists Rome against Commagene in AD 72) | Josephus does not say when Aristobulus became king, only that he held it by 72; this note does not assume he held it for the whole span back to 53. Modeled as unclear for 53–72, with Aristobulus's name attached only from the year he is first attested. |

### 2.6 The Nabataean kingdom ("Arabia")

Matches the existing `arabia` record, which already carries this history in its `history` text but an empty `politicalHistory`. Not annexed within this note's window (annexation is AD 106).

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -9 | 40 | Client kingdom, allied with Rome | Aretas IV | `bib:livius-nabataeans` (table of reigns: "Aretas IV... 9 BCE – 40 CE"); `scripture:2 Corinthians 11:32,Galatians 1:17` | |
| 40 | 71 | Client kingdom | Malichus II | `bib:livius-nabataeans` ("Malichus II, 40-70/71") | |
| 71 | 106 | Client kingdom (continues past this note's AD 100 end point) | Rabbel II | `bib:livius-nabataeans` ("Rabbel II the Savior, 71-106") | Annexed as the Roman province of Arabia in 106 — after this note's window. |

### 2.7 The Decapolis — not an area

The Decapolis is a league of cities, not a block of land one border could enclose: `bib:isbe-decapolis` describes each member as "independent of the local tetrarchy, and answerable directly to the governor of Syria," scattered from Scythopolis (the only one west of the Jordan) to Damascus. Under the new rule that an area must be land the sources describe well enough to draw (§1), this note does not propose a "Decapolis" area. Instead, each Decapolis city is a holder recorded on its own place record (§6): currently only `damascus` (sometimes counted among the ten) is a place record, and its Places-table row there notes its Decapolis membership alongside its ordinary parent, Syria. `bib:isbe-decapolis` gives Pliny's list of ten: Scythopolis, Hippos, Gadara, Pella, Philadelphia, Gerasa, Dion, Canatha, Damascus and Raphana (unidentified) — see also the Syria table's note (§2.8) on Gaza, Gadara and Hippos being cut from Archelaus's and Philip's territory in 4 BC and added to Syria (`bib:josephus-antiquities` 17.11.4), the same administrative pattern. The league itself needed no stop: `bib:isbe-decapolis` and this note's other sources find no change to its arrangement before AD 100.

### 2.8 Syria (and the coastal cities)

Matches the existing `syria` record (already has a two-row `politicalHistory`, `-64` to `-27` and `-27` to `72`). This note extends it and adds the coastal-city notes the card asks for.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -64 | -27 | Roman province | | (existing) | |
| -27 | 100 (no change found in this window) | Province kept by the emperor; governed from Antioch; administers the Cilician plain throughout; administered Philip's former tetrarchy 34–37 and 44–53 (§2.3) and briefly oversaw Commagene and Cilicia Tracheia, AD 17–38 (§2.9, §2.10) | Imperial legates | (existing); `bib:tacitus-annals` (2.42, naming Syria's and Judea's "burdens" in the same breath as Cappadocia's and Commagene's annexation) | |

**Coastal cities.** This note does not propose a single "coastal cities" area, because their status was not uniform:
- **Caesarea Maritima and Joppa** (both existing place records, parent `judea-province`): named among the cities "subject to" Archelaus's ethnarchy in 4 BC, alongside Jerusalem and Sebaste (`bib:josephus-antiquities` 17.11.4) — consistent with their current parent throughout.
- **Tyre** (existing place record, parent `syria`): a Phoenician city; Phoenicia was kept by the emperor together with Syria and Cilicia in 27 BC (existing `syria.json` history, Dio 53.12) — consistent with its current parent.
- **Gaza, Hippos and Gadara**: cut from Herod's kingdom in 4 BC and "added... to Syria" (`bib:josephus-antiquities` 17.11.4) — no place record yet for Gaza; Hippos and Gadara are also Decapolis cities (§2.7).
- **Ashkelon (Ascalon)**: Josephus notes Salome received "the royal palace of Ascalon" from Augustus, but the city itself is conventionally described as a free city outside Herodian rule throughout; this note could not open a source stating its status plainly and flags it for the Fact-Checker rather than asserting it.
- None of these is a current place record except Caesarea Maritima, Joppa and Tyre, all already correctly parented.

### 2.9 Commagene

No current record (proposed id `commagene`): its own territory, centered on Samosata on the Euphrates.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom | Antiochus III | `bib:tacitus-annals` (2.42, "the death of the two kings, Antiochus of Commagene and Philopator of Cilicia, disturbed the peace of their countries, where the majority of men desired a Roman governor, and the minority a monarch") | Tacitus does not say which side prevailed immediately; this note infers direct rule from Caligula's later "restoration" (next row), which implies the kingdom had lapsed. |
| 17 | 38 | Administered directly (probably attached to Syria) | Governor of Syria | `bib:tacitus-annals` (2.42); inference, flagged above | |
| 38 | 41 | Client kingdom restored | Antiochus IV | `bib:cassius-dio-roman-history` (59.8.2, Caligula "had given Antiochus, the son of Antiochus, the district of Commagene, which his father had held") | |
| 41 | 72 | Client kingdom, continued (Josephus's wording of Claudius's 41 settlement is unclear whether this is a reduction or a restoration) | Antiochus IV | `bib:josephus-antiquities` (19.5.1, "he also took away from Antiochus that kingdom which he was possessed of, but gave him a certain part of Cilicia and Commagena") | The "part of Cilicia" in the same clause is not Commagene's own territory; it is the coastal part of Cilicia Tracheia, carried in that area's own table (§2.10) with Antiochus IV as its holder for the same span. |
| 72 | 100 (no change found in this window) | Annexed to the province of Syria | | `bib:josephus-jewish-war` (7.7.1–3, "in the fourth year of the reign of Vespasian," Caesennius Paetus, governor of Syria, deposes Antiochus IV on suspicion of conspiring with Parthia) | |

### 2.10 Cilicia: the plain (Pedias) and the rough west (Tracheia)

**Split per the PO's review:** these are two separate areas. The existing `cilicia` record (parent `roman-empire`, not `syria`, by design) is narrowed to mean the plain only (Cilicia Pedias, where Tarsus sits); the rough west (Cilicia Tracheia) is a new, separate proposed area, `cilicia-tracheia`. The two shared one Roman province both before 27 BC and again from 72; between those dates they had different holders, so a single area would have put Tarsus under Commagene's king, which the sources do not support.

**The dividing line (for M4-03 to draw):** Strabo gives a specific boundary: "the boundary of [Cilicia Tracheia], the river Lamus and the village of the same name, lies between Soli and Elaeussa" (`bib:strabo-geography`, 14.5.6). Everything from the Lamus west to Pamphylia is Tracheia; everything from Soli (just east of the Lamus) to Issus, "for the most part... plains and fertile land," is Pedias (14.5.1, 14.5.6).

**Cilicia Pedias (the plain; existing id `cilicia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -27 | 72 | Administered from Syria throughout | | (existing `cilicia.json`); `bib:cassius-dio-roman-history` (59.8.2); `bib:strabo-geography` (14.5.1, 14.5.6) | |
| 72 | 100 (no change found) | Reunited with Cilicia Tracheia as one province | | (existing); `bib:livius-cilicia` | From 72 both pieces share one holder, "the Roman province of Cilicia," without becoming one area: each keeps its own already-described shape. |

**Cilicia Tracheia (the rough west; new proposed area `cilicia-tracheia`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client king(s); Strabo and Tacitus name different rulers | Archelaus of Cappadocia (Strabo); Philopator (Tacitus) | `bib:strabo-geography` (14.5.6, "Archelaüs received, in addition to Cappadocia, Cilicia Tracheia... except Seleuceia"); `bib:tacitus-annals` (2.42, "Philopator of Cilicia" dies in AD 17) | Strabo (writing earlier, under Augustus) names Archelaus of Cappadocia as holding Tracheia; Tacitus separately names "Philopator of Cilicia" as dying in AD 17, the same year as Antiochus of Commagene. This note could not find a source resolving whether Philopator succeeded Archelaus here, held a sub-grant of it, or is another name for the same person, and does not guess; both names are given. |
| 17 | 38 | Administered directly (probably attached to Syria, with Commagene — §2.9) | Governor of Syria | `bib:tacitus-annals` (2.42); inference | |
| 38 | 72 | Client kingdom: given to Commagene's king | Antiochus IV (of Commagene) | `bib:cassius-dio-roman-history` (59.8.2, "the coast region of Cilicia"); `bib:josephus-antiquities` (19.5.1) | Held by Commagene's king, but not part of Commagene's own territory (§2.9) — a different area under the same ruler. |
| 72 | 100 (no change found) | Reunited with Cilicia Pedias as one province | | `bib:josephus-jewish-war` (7.7.1–3); `bib:livius-cilicia` | |

### 2.11 Cappadocia

Matches the existing `cappadocia` record (empty `politicalHistory`). This note adds the table.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom | Archelaus | `bib:tacitus-annals` (2.42, "for fifty years King Archelaus had been in possession of Cappadocia"; Tiberius "lured Archelaus from Cappadocia," and "his kingdom was converted into a province") | |
| 17 | 100 (no change found) | Roman province | Quintus Veranius, first governor | (existing, citing `bib:isbe-cappadocia`); `bib:tacitus-annals` (2.42, the annexation) | |

### 2.12 Galatia, and the lands joined to it (each its own area)

**Per the PO's review, each piece below is its own area**, since each changed holder on its own. Most are already existing records (`galatia`, `pisidia`, `lycaonia`, `pamphylia`); **Paphlagonia** and **Pontus Galaticus** are new proposed areas (`paphlagonia`, `pontus-galaticus`), and **Lycia** is a new proposed area (`lycia`; no current place sits there). A single entity, **"Roman province of Galatia"** (proposed entity id `galatia-province`), holds several of these at once from various dates; a second, **"Roman province of Lycia and Pamphylia"** (`lycia-pamphylia-province`), holds the pieces that left Galatia in 74. Map labels follow the holder, not the area (ADR-0037, visual spec update), so one province can label several areas on the map in the same year.

**Galatia (the core; existing id `galatia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -25 | Client kingdom | Amyntas (last king; d. 25 BC) | (existing `galatia.json`) | |
| -25 | 100 (no change found) | Roman province of Galatia | | (existing) | |

**Pisidia (existing id `pisidia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -25 | Client kingdom (held by Galatia's king) | Amyntas | (existing `pisidia.json`, citing `bib:isbe-pisidia`) | |
| -25 | 74 | Roman province of Galatia | | (existing) | |
| 74 | 100 (no change found) | Roman province of Galatia (north); Roman province of Lycia and Pamphylia (south, per the existing record) | | (existing) | **Doubt flag:** the existing record says only that Pisidia's "southern part" transferred to the new province of Lycia and Pamphylia in 74, implying the north stayed with Galatia; this note could not find a source describing exactly where that internal line ran. M4-03 should either find a cited line or treat Pisidia as one area with an `uncertain` holder from 74, rather than guess at a split. |

**Lycaonia (the Roman, western part; existing id `lycaonia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -25 | Client kingdom (held by Galatia's king) | Amyntas | (existing `lycaonia.json`) | |
| -25 | 100 (no change found) | Roman province of Galatia | | (existing) | |

*Eastern Lycaonia ("Lycaonia Antiochiana") is not its own area*: no source this note opened describes its extent, only that it was "non-Roman" and that the town of Laranda belonged to it. It is a note on Lycaonia's own record, not a second area. Held by the king of Commagene (§2.9) 37 or 41–72; the existing `lycaonia.json` gives 37, `bib:isbe-galatia` gives 41, and this note does not resolve the difference (both plausibly track the Commagene dating uncertainty at §2.9).

**Pamphylia (existing id `pamphylia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 74 | **Uncertain** (kind: `uncertain`) | | (existing `pamphylia.json`/`perga.json`, already calling the evidence "split" — see the M3-11 Fact-Check's note on Dio 60.17.3–4 read against Tacitus *Histories* 2.9, `bib:livius-pamphylia` and `pleiades:981530`) | The existing records already hold this open rather than choosing; this note carries that forward as the `uncertain` kind for the whole span, rather than defaulting to "Galatia" as this note's first draft did. |
| 74 | 100 (no change found) | Roman province of Lycia and Pamphylia | | (existing); `bib:cassius-dio-roman-history` (60.17.3–4, the Claudius-era background) | |

**Paphlagonia (new proposed area `paphlagonia`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -6 | Client kingdom | Deiotarus Philadelphus (last king) | `bib:isbe-galatia` ("to it were added Paphlagonia 6 BC"); `bib:strabo-geography` (12.3.41, "The last to reign over Paphlagonia was Deïotarus, the son of Castor, surnamed Philadelphus") | -6 is before this note's 4 BC start, so it is background only, not a stop. |
| -6 | 100 (no change found) | Roman province of Galatia | | `bib:isbe-galatia` | |

**Pontus Galaticus (new proposed area `pontus-galaticus`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -2 | Part of the independent Pontic kingdom (§2.13) | | `bib:isbe-galatia` ("part of Pontus 2 BC") | |
| -2 | 100 (no change found) | Roman province of Galatia | | `bib:isbe-galatia` | Folded into the AD 6 stop (§4), the nearest one after -2, per the PO's instruction. |

**Lycia (new proposed area `lycia`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 43 | Free federation (the Lycian League), allied with Rome | | (existing `pamphylia.json` note, citing `bib:cassius-dio-roman-history` 60.17.3–4 and `bib:livius-pamphylia`) | |
| 43 | 74 | Roman province of Lycia | | (existing) | |
| 74 | 100 (no change found) | Roman province of Lycia and Pamphylia | | (existing) | Folded into the AD 74 stop (§4), alongside Pamphylia's own change the same year. |

### 2.13 Pontus (the eastern, Polemon kingdom) and Bithynia

**Note added at §2.25:** eastern Pontus is not drawn as its own area after all; the PO's reading of AWMC's AD 200 line places it inside Cappadocia's extent, with coastal, western Pontus inside Bithynia's. The chronology and sources below still stand; they are now carried in `cappadocia`'s and `bithynia`'s own area notes and the `pontus` region record's hand-written history, not a `pontus` area.

Bithynia (existing id `bithynia`) is not one of the Galatia-administered pieces above; it was always its own, separately stable province. Pontus (existing id `pontus`) is the independent eastern kingdom, which becomes one of the Galatia-administered pieces once Polemon gives it up.

| Area | From | To | Holder | Sources | Notes |
|---|---|---|---|---|---|
| Bithynia | -74 | 100 (no change found) | Roman province | (existing `bithynia.json`, citing `bib:isbe-bithynia`) | |
| Pontus | -36 | 64 | Client kingdom | (existing `pontus.json`, citing `bib:isbe-pontus`); `bib:isbe-galatia` ("in 64 also Pontus Polemoniacus [added to Galatia]") | Ruler: Polemon I, then his descendants, ending with Polemon II. This note supplies the precise year (64) for Polemon II giving up the kingdom; the existing record only says "when Polemon gave it up." |
| Pontus | 64 | 100 (no change found) | Roman province of Galatia, as "Pontus Polemoniacus" | `bib:isbe-galatia` | Folded into the AD 70 stop (§4), the nearest one after 64. |

### 2.14 Thrace

No current record (proposed id `thrace`); no current place sits here, but the card's area list names it.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 38 | Client kingdom | Rhoemetalces II ("the last native prince," installed by Caligula in 38) | `bib:smith-dictionary-thracia` | |
| 38 | 46 | Client kingdom, continued | Rhoemetalces II | `bib:smith-dictionary-thracia` | |
| 46 | 79 | **Uncertain** (kind: `uncertain`) | | `bib:smith-dictionary-thracia` | No openable modern source found settling this, so per the PO's instruction this span is modeled as unclear rather than choosing. Smith's Dictionary (1854) reports a genuine ancient disagreement: the Eusebian Chronicle dates Thrace's reduction to a province to AD 47, under Claudius, but Suetonius (`Vespasian` 8), Eutropius and Tacitus (`Histories` 1.11) date it to Vespasian's reign (69–79). Its 19th-century editor suggests Rhoemetalces II may have died around 46/47, ending native rule in practice, while formal provincial status waited for Vespasian; this note presents both readings without choosing. Not proposed as a stop (§4): it borders no current place, and the year itself is too uncertain to attach to one. |
| 79 | 100 (no change found) | Roman province | | `bib:smith-dictionary-thracia` | |

### 2.15 Achaia and Macedonia

Both match existing records; `achaia.json` already has a full three-row `politicalHistory`. `macedonia.json`'s table was removed by the M3-11 Fact-Check (end year rested on Wikipedia alone); this note supplies a sourced replacement, mirroring Achaia's.

| Area | From | To | Holder | Sources | Notes |
|---|---|---|---|---|---|
| Macedonia | -148 | -27 | Roman province (governed with Achaia) | `bib:isbe-macedonia`; `bib:livius-macedonia` | ISBE and Livius date the province from 148 BC (after Andriscus's revolt); some reference works use 146 BC (existing note, already flagged). |
| Macedonia | -27 | 15 | Senatorial province, proconsul | (existing text; same sources as Achaia's row 1) | |
| Macedonia | 15 | 44 | Imperial, governed with Achaia by the legate of Moesia | `bib:tacitus-annals` (1.76, 1.80) | |
| Macedonia | 44 | 100 (no change found) | Senatorial province again (restored by Claudius) | `bib:cassius-dio-roman-history` | Achaia's own table (existing) shows Nero freeing Greece in 67 and this lapsing again under Vespasian; no source found stating Macedonia shared Nero's grant of freedom (Suetonius's and Pausanias's accounts name only Achaia/Greece), so this note does not extend that change to Macedonia. Neither the 15/44 Senate↔emperor switch nor Nero's 67 grant is proposed as a stop (ADR-0037 item 1's own example: a province passing from the Senate to the emperor is not a stop). |
| Achaia | (existing table, unchanged) | | | | |

### 2.16 Asia

Matches the existing `asia` record; its `politicalHistory` was removed by the M3-11 Fact-Check (end year rested on Wikipedia alone). This note could not find a sourced change to Asia's status before AD 100 (it remained a senatorial province throughout, per the existing history text and `bib:isbe-asia`), so phase 2 should add a single open row rather than inventing an end year.

| From | To | Holder | Sources | Notes |
|---|---|---|---|---|
| -129 | 100 (no change found) | Roman province (senatorial, proconsul) | (existing text, citing `bib:isbe-asia`) | `scripture:Acts 19:38` ("there are proconsuls") confirms the status in Paul's time. |

### 2.17 Cyprus

Matches the existing `cyprus` record; its table was also removed by the M3-11 Fact-Check for the same reason. No sourced change found before AD 100.

| From | To | Holder | Sources | Notes |
|---|---|---|---|---|
| -58 | -27 | Roman province, attached to Cilicia | (existing text) | |
| -27 | -22 | Kept by the emperor | (existing text) | |
| -22 | 100 (no change found) | Senatorial province, proconsul | (existing text); `scripture:Acts 13:7` | |

### 2.18 Crete and Cyrene

Matches the existing `crete-cyrene` record (and its `crete`, `libya` sub-regions); table also removed by the M3-11 Fact-Check. No sourced change found before AD 100.

| From | To | Holder | Sources | Notes |
|---|---|---|---|---|
| -67 | 100 (no change found) | Roman province (senatorial), Crete joined with Cyrenaica | (existing text, citing `bib:isbe-crete`) | |

### 2.19 Egypt

Matches the existing `egypt` record (empty `politicalHistory`; history text already describes the special status). No change proposed.

| From | To | Holder | Sources | Notes |
|---|---|---|---|---|
| -30 | 100 (no change found) | Special imperial province, governed by an equestrian prefect; senators barred without the emperor's leave | (existing text); `bib:tacitus-annals` (2, on Germanicus's visit) | |

### 2.20 Italy and Sicily

Both match existing records (stable, not formally a province in Italy's case; Sicily a settled senatorial province). No change proposed; no sourced change found before AD 100.

### 2.21 Illyricum

Matches the existing record (stable; organized AD 10). No change proposed.

### 2.22 Armenia and the Parthian Empire (at the map's edge)

`parthian-empire`, `media` and `mesopotamia` already exist (empty `politicalHistory`; history text already covers the broad picture). **Armenia has no record.** Both are treated lightly, per the card's instruction that areas outside the focus need only enough detail to keep the empire's edge right at each stop.

| Area | From | To | Holder | Sources | Notes |
|---|---|---|---|---|---|
| Armenia (no record; proposed id `armenia`) | ? | 63 | **Uncertain** (kind: `uncertain`) | `bib:tacitus-annals` (books 2, 6, 11-15 cover individual reigns) | Roman and Parthian nominees alternate repeatedly and contestedly through this span; this note does not enumerate every brief claimant and models it as unclear rather than naming one ruler per stretch. See "left out" in §4. |
| Armenia | 63 | 100 (no change found) | Client kingdom under a Parthian prince, crowned by and nominally subject to Rome (the Peace of Rhandeia) | (existing `parthian-empire.json` history text) | |
| Parthian Empire | — | — | No internal Parthian succession tracked in this note | (existing text) | Out of scope in the same way as other areas outside the focus; its kings are not a "stop" unless they touch Rome's or Armenia's border. |

### 2.23 The Roman Empire itself, and its outer edge

Matches the existing `roman-empire` record, whose `politicalHistory` already lists reigns through Claudius (41–54). This note extends it to AD 100, and adds the "empire's extent" notes the card asks for at each stop.

| From | To | Holder | Sources | Notes |
|---|---|---|---|---|
| -27 | 14 | Augustus | (existing) | |
| 14 | 37 | Tiberius | (existing) | |
| 37 | 41 | Gaius (Caligula) | (existing) | |
| 41 | 54 | Claudius | (existing) | |
| 54 | 68 | Nero | `bib:suetonius-twelve-caesars` | |
| 68 | 69 | Galba, Otho, Vitellius (the "Year of the Four Emperors") | `bib:cassius-dio-roman-history`; `bib:tacitus-histories` | No border change in our focus area is attributed to this instability; not proposed as a stop by itself. |
| 69 | 79 | Vespasian | `bib:josephus-jewish-war` (7) | |
| 79 | 81 | Titus | `bib:livius-titus` ("r. 79-81") | |
| 81 | 96 | Domitian | `bib:livius-domitian` ("r.81-96") | |
| 96 | 98 | Nerva | `bib:livius-nerva` ("96-98") | |
| 98 | 100 (continues past this note's end) | Trajan | `bib:livius-trajan` ("r. 98-117") | |

**The empire's outer edge, for context at each stop (not separate areas):**
- **Mauretania:** a client kingdom (Juba II, then Ptolemy) until Caligula had King Ptolemy put to death, c. AD 40 (`bib:cassius-dio-roman-history` 59.25, "Gaius sent for Ptolemy, the son of Juba, and... put him to death," followed by the editorial note "How the Mauretanian began to be governed by Romans"). Claudius organized it into two provinces after suppressing the revolt that followed. By AD 44 and after, the map's western edge should show two Roman provinces, not a client kingdom.
- **Britain:** outside the empire until Claudius's invasion, which Cassius Dio dates within his reign's early years (`bib:cassius-dio-roman-history` 60.19–21, Aulus Plautius's campaign and Claudius's own brief visit); conventionally dated AD 43. From the stop at 44 on, the map's far northwest edge should show a Roman province of growing extent (this note does not track its internal growth, which is outside the focus).

### 2.24 Border descriptions (for M4-03)

AWMC has the provincial borders of AD 200 as lines, Herod's kingdom as one outline, and the ancient coastline, but no first-century districts. This section gives a cited description, with landmarks M4-03 can place, for each border the map needs that AWMC lacks. Pleiades ids are given where this note found a confident match; where it did not, the landmark is named without one, and the Fact-Checker or M4-03 should search further rather than guess a point.

| # | Areas separated | Landmarks (Pleiades id where found) | Source | Doubt flag |
|---|---|---|---|---|
| 1 | `galilee-perea` (Galilee) / `judea-samaria-idumea` (Samaria) | East end: Scythopolis (`pleiades:678378`) and the Jordan River (`pleiades:687932`). Middle: the village Ginea, "in the great plain" (the Jezreel Valley) — probably modern Jenin, but this note found no confirmed stable id. West end: "the Acrabbene toparchy" — not further identified. | `bib:josephus-jewish-war` (3.3.1, Galilee "bounded on the south with Samaria and Scythopolis, as far as the river Jordan"; 3.3.4, Samaria "begins at a village... called Ginea, and ends at the Acrabbene toparchy") | **Yes, partial:** the two end-points (Scythopolis/Jordan) are solid; the line between them, through Ginea, is only a named village in a named valley, not a drawn path. |
| 2a | `galilee-perea` (Perea) / Decapolis (Pella, held by Syria, §2.7) | Pella (`pleiades:678326`), on Perea's north | `bib:josephus-jewish-war` (3.3.3, "the length of Perea is from Macherus to Pella... its northern parts are bounded by Pella") | No: Pella itself is the named landmark. |
| 2b | `galilee-perea` (Perea) / `arabia` (Nabataea) | South: "the land of Moab" (a region, not a point). East: Nabataea ("Arabia"), "Silbonitis" (not identified), and the Decapolis cities Philadelphia (`pleiades:697728`) and Gerasa (not checked for an id in this note) | `bib:josephus-jewish-war` (3.3.3, "the land of Moab is its southern border, and its eastern limits reach to Arabia, and Silbonitis, and besides to Philadelphene and Gerasa") | **Yes:** "the land of Moab" names a people's historical territory, not a line; Silbonitis is otherwise unknown to this note. Likely close to Herod's kingdom's own eastern/southern outline already in AWMC, but this note cannot confirm they are identical. |
| 2c | `galilee-perea` (Perea) / `philip-tetrarchy-lands` | West: the Jordan River (`pleiades:687932`), shared with border 3 below | `bib:josephus-jewish-war` (3.3.3, Perea's "Western [border, bounded] with Jordan") | No: a river, already in AWMC's hydrology. |
| 3a | `philip-tetrarchy-lands` / `galilee-perea` (Galilee) | The Jordan River (`pleiades:687932`) and the Sea of Galilee ("the lake of Tiberias," `pleiades:678430`) | `bib:josephus-jewish-war` (3.3.1, Galilee bounded east by "Gaulonitis"; 3.3.5, Philip's lands "reaches breadthways to the lake of Tiberias") | No: a river and a lake, already in AWMC's hydrology and coastline. |
| 3b | `philip-tetrarchy-lands` / Decapolis (Hippos, Gadara — held by Syria, §2.7) | The Yarmuk River (`pleiades:678183`) | Not named by Josephus for this exact segment; this is the conventional geographic line between Gaulanitis and Hippos/Gadara, suggested by the PO. | **Yes:** this note found no ancient text naming the Yarmuk for this border specifically, only the general statement that Galilee (and so, by the same logic, Gaulanitis) bordered "Hippeae and Gadaris" (`bib:josephus-jewish-war` 3.3.1). Recommend confirming with a further source before drawing it as certain. |
| 3c | `philip-tetrarchy-lands` / `abilene`, and / Damascus (`syria`) | Mount Lebanon ("Mount Libanus") and "the fountains of Jordan" (near Caesarea Philippi/Panias, an existing place record) mark Philip's lands' own northern start | `bib:josephus-jewish-war` (3.3.5, "This country begins at Mount Libanus, and the fountains of Jordan... in length is extended from a village called Arpha, as far as Julias" — Julias being Bethsaida, an existing place record) | **Yes:** no source this note opened draws a specific line between Philip's lands and Abilene or Damascus beyond this shared starting landmark; "Arpha" is not further identified. Recommend further search, or merging across this edge if none is found. |
| 4 | `abilene` (extent) | Abila itself, "18 Roman miles from Damascus on the way to Heliopolis [Baalbek]" | `bib:isbe-abilene` | **Yes:** this gives Abila's own location, not a boundary; no source this note opened describes Abilene's edges. Recommend M4-03 merge it into a neighbour (as already flagged in §2.4), consistent with Chalcis's doubt flag. |
| 5 | `cilicia` (Pedias) / `cilicia-tracheia` | The river Lamus, between Soli and Elaeussa | `bib:strabo-geography` (14.5.6) | No — already described fully in §2.10. |
| 6 | `lycia` / `pamphylia` | Phaselis (`pleiades:639051`, the last Lycian city) and Olbia, "the beginning of Pamphylia" (not further identified) | `bib:strabo-geography` (14.4.1, "After Phaselis one comes to Olbia, the beginning of Pamphylia") | **Yes, partial:** Phaselis anchors the Lycian side; Olbia, the Pamphylian side, has no confirmed id in this note. |
| 7 | `commagene` / `syria` | The Euphrates (east, shared with Mesopotamia) and Mt. Amanus (Syria's own northern edge, towards Cilicia); Samosata (`pleiades:658587`) is Commagene's own centre | `bib:strabo-geography` (16.2.1, "Syria is bounded on the north by Cilicia and Mt. Amanus... bounded on the east by the Euphrates"; 16.2.3, Commagene and Samosata) | **Yes:** Strabo counts Commagene as one of the "parts of Syria" in this passage and gives no specific line between Commagene and the rest of Syria to its south; only its general position (immediately south of Cilicia/Mt. Amanus, on the Euphrates) is described. Recommend further search, or an approximate line around Samosata's own territory. |
| 8a | `paphlagonia` / `pontus` (and, by the same line, toward `pontus-galaticus`) | The Halys River (`pleiades:857148`) | `bib:strabo-geography` (12.3.9, "On the east, then, the Paphlagonians are bounded by the Halys River") | No: a river, already in AWMC's hydrology. Also confirms Paphlagonia's last king by name: Deiotarus Philadelphus (same passage) — corrects this note's earlier §2.12 flag, which could not name him. |
| 8b | `paphlagonia` / `galatia` | "The Galatians... are to the south of the Paphlagonians"; no river or town is named for this specific line | `bib:strabo-geography` (12.3.9, south: "Phrygians and the Galatians who settled among them"; 12.5.1, "The Galatians, then, are to the south of the Paphlagonians") | **Yes:** a compass direction, not a landmark. |
| 8c | `paphlagonia` / `bithynia` | "The Bithynians and the Mariandyni," no river or town named | `bib:strabo-geography` (12.3.9); `bib:isbe-bithynia` | **Yes:** a compass direction, not a landmark. |
| 8d | `pontus-galaticus` / `pontus-polemoniacus` (the internal line within the old Pontic kingdom) | None found | — | **Yes, fully:** this note found no source distinguishing exactly where Rome's earlier (2 BC) and later (AD 64) additions to Galatia met inside the former kingdom of Pontus. Recommend M4-03 treat them as one combined shape if no line is found, or flag the whole area `uncertain` for this internal edge only. |
| 9 | `galatia` / `cappadocia` | Lake Tatta (`pleiades:619268`), "alongside Greater Cappadocia near Morimene," though Strabo counts the lake itself as Phrygian/Galatian | `bib:strabo-geography` (12.5.4) | **Yes:** Strabo describes the general region (writing before Cappadocia was even a province), not a precise line, and this note cannot confirm whether it differs from AWMC's AD 200 Galatia/Cappadocia line without seeing that line directly. Recommend M4-03 compare this landmark against the AD 200 line itself and flag `uncertain` if they do not clearly agree. |

### 2.25 Area composition (for M4-03)

M4-03 builds shapes by cutting AWMC's layers — the AD 200 provincial lines, the empire's extent at 60 BC/AD 117/AD 200, Herod's kingdom outline, the coastline, and the landmarks in §2.24 — into cells, one per area in `data/timeline.json`. This section gives, for each area, the AD 200 province(s) whose land it draws from, any other AWMC layer that restricts it, which ADR-0037 rule justifies the choice, and the source. The GIS Engineer's own reading of which AD 200 provinces AWMC's data distinguishes is the authority on names and lines actually present in that dataset; this section proposes the match and flags doubts, but does not see that dataset directly.

**Provisional, pending revision:** after this section was written, the PO found that AWMC's archive also has provincial lines for AD 14, AD 69 and AD 100, and extents for AD 14 and AD 69 — much closer to this note's own 4 BC–AD 100 window than AD 200. M4-03 is building its named partitions from the AD 69 and AD 14 lines instead. The table below still gives each area's AD 200 match only, since it was written before this was known; it should be revised to AD 69/AD 14 terms (AD 200 only where nothing better exists) once the PO forwards the GIS Engineer's list of AD 69/AD 14 faces. Until then, treat every row below as a fallback, not a final answer.

**Areas matching one AD 200 province directly (rule 1 or 2; no further restriction needed):**

| Area | AD 200 province (reference town) | Rule | Source |
|---|---|---|---|
| `galatia` | Galatia (Ancyra) | 1 (Galatia, Pisidia, Lycaonia-west and Paphlagonia already share this holder for the whole window, §2.12) | `bib:isbe-galatia` |
| `pamphylia` | Lycia et Pamphylia (Perga) | 2 (its own area since 74; `uncertain` before) | `bib:livius-pamphylia` ("the emperor Vespasian created a new province called Lycia and Pamphylia (after 70)... In 314 or 325, this double province was divided" — so one joint province still covers AD 200) |
| `lycia` | Lycia et Pamphylia (Perga) | 2 | `bib:livius-pamphylia`; the Phaselis/Olbia line (§2.24 #6) separates it from `pamphylia` inside this one AD 200 province |
| `cilicia` | Cilicia (Tarsus) | 2 | `bib:livius-cilicia` ("The emperor Vespasian reunited Cilicia in 72. More than two centuries later, it was divided into two parts by Diocletian" — so one province still covers AD 200); the river Lamus (§2.24 #5) separates it from `cilicia-tracheia` inside this one province |
| `cilicia-tracheia` | Cilicia (Tarsus) | 2 | Same source; same internal line |
| `bithynia` | Bithynia et Pontus (Nicomedia) | 2 | `bib:isbe-pontus` ("Most of Pontus was for administrative purposes united by the Romans with the province of Bithynia"); `bib:isbe-bithynia` ("Under Rome the Black Sea littoral as far as Amisus was more or less closely joined with Bithynia in administration") |
| `cappadocia` | Cappadocia (Caesarea Mazaca) | 2, enlarged — see the Pontus correction below | `bib:livius-cappadocia` (the AD 70 "merging of Cappadocia with Galatia," legions at Satala on the Pontic/Lesser-Armenia frontier under Cappadocia's governor) |
| `judea-samaria-idumea`, `galilee-perea` | Syria Palaestina (Jerusalem) | 1 (merged already, §2.1–§2.2) | Renamed from Judea after the AD 135 revolt — after this note's window, so background only; no source newly opened for the rename itself |
| `philip-tetrarchy-lands`, `arabia` | Arabia (Bostra) | 2 | This note's own §2.3 (the tetrarchy joins Syria in 100, "with the Nabataean kingdom, became the new province of Arabia" in 106) |
| `syria` | Syria Coele (Antioch) and Syria Phoenice (Tyre) — **two AD 200 provinces, split from one Syria**; this note could not open a source dated to the split itself | 2/3 | Inference from the well-attested later Severan reorganization; recommend the GIS Engineer confirm both names and the line (likely near the Eleutherus river) directly from AWMC rather than this note's unconfirmed inference |
| `commagene` | Syria Coele (Antioch) | 3 (60 BC extent, approximated near Samosata) | See the correction below |
| `achaia` | Achaia (Corinth) | 1 | (existing) |
| `macedonia` | Macedonia (Thessalonica) | 1 | (existing) |
| `asia` | Asia (Ephesus) | 1 | (existing) |
| `cyprus` | Cyprus (Salamis or Paphos) | 1 | (existing) |
| `crete-cyrene` | Creta et Cyrenaica (Gortyn), **if AD 200 still shows them joined; this note found no source confirming they were not already split by then** | 1 or 3 | Flagged, not newly sourced |
| `egypt` | Aegyptus (Alexandria) | 1 | (existing) |
| `sicily` | Sicilia (Syracuse) | 1 | (existing) |
| `illyricum` | Dalmatia and Pannonia (Salona and Carnuntum, or similar) — **"Illyricum" itself had split into these by AD 200**; this note's existing text already keeps this area light-touch, outside the focus | 1, with the same caveat | Existing text only; not newly sourced |
| `italy` | **No AD 200 province line expected** — Italy was never formally a province (§2.20) | 1 | (existing); recommend M4-03 use the empire's own extent outline here instead of a provincial line |
| `thrace` | Thracia (Perinthus, the usual provincial capital) | 2/3, `uncertain` 46–79 (§2.14) | `bib:smith-dictionary-thracia`; this note did not newly confirm the reference town |
| `parthian-empire` | **Not a Roman province at all** — outside the empire's extent (AD 117/AD 200), not inside AWMC's provincial lines | 1 (merged with Media, Mesopotamia) | (existing) |
| `armenia` | **Outside the empire's extent too**, except briefly under Trajan (114–117, after this note's window); a client kingdom, not a province, even where crowned by Rome (§2.22) | — | (existing) |

**Small units not drawn (rule 4), and the area each falls within:**

| Unit | Falls within | Source |
|---|---|---|
| Abilene | `philip-tetrarchy-lands` | §2.4 (already flagged undrawable) |
| Chalcis | `syria` (its Beqaa-valley territory sits within Syria's own later extent, nearer Damascus than Philip's lands; revises this note's earlier, undecided flag at §2.5) | §2.5; `bib:isbe-ituraea` |
| Emesa (a client kingdom under its own kings throughout this window, continuing into Nero's reign and still reigning when Titus's "forces" from Emesa joined the siege of Jerusalem) | `syria` | `bib:josephus-antiquities` (20.8.4, Azizus and then Soemus, kings of Emesa); `bib:josephus-jewish-war` (7, Emesa's forces at the siege) — both newly read for this section; no current place or location record is Emesa, so it needs no area of its own |

**Correction to this note's earlier Pontus treatment (§2.13), from the PO's reading of AWMC's AD 200 line — applied in `data/timeline.json`:** `bib:livius-cappadocia` describes Cappadocia's governor from AD 70 on commanding a frontier that reached Satala, in the Pontic/Lesser-Armenia border country, and this note's own border table (§2.24 #8d) already found no source distinguishing Pontus Galaticus from Pontus Polemoniacus internally. AD 200's Cappadocia encloses both, with no AWMC line against Cappadocia proper either, so the eastern-Pontus area is **rule 4, not drawn**, its land falling within `cappadocia` (with Armenia Minor, not currently tracked as its own place or area, alongside it); coastal, western Pontus falls within `bithynia` instead. The `pontus` area has been removed from `data/timeline.json`, its changes folded into the AD 6 and AD 70 stops' summaries (already worded that way since phase 2), `cappadocia`'s and `bithynia`'s own periods each carry a note on the land they now also cover, and the `pontus` region record keeps a hand-written `politicalHistory`, like `phrygia`, since no single area represents a region historically split three ways.

**Pisidia and Lycaonia, inside AD 200's Lycia et Pamphylia and Cilicia respectively:** this note's existing records already place Pisidia's southern part in the new Lycia-Pamphylia province from 74 (§2.12), but this note could not find a precise internal line, so `galatia`'s own area is kept whole (§2.12, §4's AD 74 stop). For Lycaonia and Isauria specifically (Derbe, Lystra's district), `bib:isbe-galatia` already distinguishes a western, Galatian-administered Lycaonia from an eastern "Antiochiana" district; `bib:livius-cilicia` confirms Cilicia stayed one province from 72 until Diocletian split it centuries later, so an AD 200 "Cilicia" province already existed whole by our period's end, and `bib:strabo-geography` (14.5.6, read for §2.10) already describes the Taurus as running "in the region of Isaura and of the Homonadeis as far as Pisidia" — the same Taurus range already used for Cilicia's own split (§2.24 #5) plausibly continues to separate Lycaonia/Isauria (north of it, under Galatia in our window) from Cilicia proper (south of it). This note recommends M4-03 test the Taurus crest against AD 200's actual Cilicia/Galatia line before relying on it, since no source opened for this note dates exactly when Lycaonia/Isauria joined Cilicia's administration (sometime after our AD 100 end point and before Diocletian).

**Pamphylia and Pisidia, inside the same AD 200 province:** `bib:livius-pamphylia` dates Pamphylia's own Roman administration to "first part of a province called Cilicia" and then Asia (43 BC), well before Pisidia (held by client king Amyntas until 25 BC, §2.12). This supports the PO's suggestion: the 60 BC extent should already include Pamphylia's coastal plain but not yet Pisidia's highlands, giving M4-03 a usable, if approximate, line between them inside the one AD 200 province.

**Coastal Paphlagonia and western Pontus:** `bib:isbe-bithynia`'s statement that the Black Sea coast "as far as Amisus" was administered with Bithynia, read together with `bib:isbe-pontus`'s "most of Pontus was... united... with... Bithynia, though the eastern part subsisted as a separate kingdom under Polemon... and the southwestern portion was incorporated with... Galatia," supports the PO's reading that Paphlagonia's own coastal cities (Amastris, Sinope) sat within Bithynia's sphere while its inland part joined Galatia in 6 BC (§2.12). This note found no source drawing a precise inland/coastal line within Paphlagonia itself, only these two general statements; since Paphlagonia is not its own area (it is folded into `galatia`'s single period, §2.12), this affects only where M4-03 draws `galatia`'s edge against `bithynia`, not any area's holder.

**Egypt and the Nabataean kingdom:** this note's existing source (`bib:livius-nabataeans`) already states Nabataea "reached... Hegra in the south," in the northern Hejaz, on the Arabian side of the Gulf of Aqaba; Egypt's own territory stays on the African/Sinai side. The coastline AWMC already carries, through the Gulf of Aqaba, is this boundary; no new land line is needed.

## 3. Entities

Deduplicated political bodies referenced in §2, for M4-01 to use as a lookup if its schema separates "who" from "where." **Entities are holders only** (per the PO's review): Quirinius and the Perea Julias are removed below, since neither held an area as its ruler (the census is in the AD 6 stop, §4; Julias is in §5). Judea's two Roman-governor entities are merged into one, since a change of title alone is not a map change. Ethnarchies and tetrarchies share one kind, `client-tetrarchy`, with the English name kept distinct.

| id | English name | Kind | Rulers (years) | Passages | Sources | Matching location record |
|---|---|---|---|---|---|---|
| `herod-the-great` | Kingdom of Herod the Great | Client kingdom | Herod the Great (-37 to -4) | `scripture:Matthew 2:1,Luke 1:5` | `bib:josephus-antiquities` (17.8) | None (a ruler, not an area) |
| `archelaus-ethnarchy` | Ethnarchy of Herod Archelaus | Client tetrarchy | Herod Archelaus (-4 to 6) | `scripture:Matthew 2:22` | `bib:josephus-antiquities` (17.11.4) | None |
| `antipas-tetrarchy` | Tetrarchy of Herod Antipas | Client tetrarchy | Herod Antipas (-4 to 39) | `scripture:Luke 3:1,23:6-7,Mark 6:14-29` | `bib:josephus-antiquities` (17.8) | None |
| `philip-tetrarchy` | Tetrarchy of Herod Philip | Client tetrarchy | Herod Philip (-4 to 34) | `scripture:Luke 3:1` | `bib:josephus-antiquities` (17.8, 18.4.6) | None |
| `lysanias-abilene` | Tetrarchy of Lysanias | Client tetrarchy | "Lysanias the tetrarch" (? to 37) | `scripture:Luke 3:1` | `bib:isbe-abilene` | None |
| `roman-province-judea` | Roman province of Judea | Province | Prefects 6–41 (e.g. Pontius Pilate), procurators 44–100 (e.g. Antonius Felix, Porcius Festus) — the title changes in 44, but this is one entity, since a title change alone is not a map change. Holds `judea-samaria-idumea` throughout (6–41, 44–100); also holds `galilee-perea` and `philip-tetrarchy-lands` from 44 | `scripture:Luke 3:1,Acts 23:24,25:1,25:23` | `bib:josephus-antiquities` (18.1, prefects; 19.9.2, procurators) | `judea-province` |
| `agrippa-i-kingdom` | Kingdom of Herod Agrippa I | Client kingdom | Herod Agrippa I (37 to 44; Philip's tetrarchy and Abilene from 37, Galilee and Perea added 39, Judea and Samaria added 41) | `scripture:Acts 12:1-23` | `bib:josephus-antiquities` (18.6.10, 18.7.2, 19.5.1) | None |
| `herod-of-chalcis` | Kingdom of Herod (of Chalcis) | Client kingdom | Herod, brother of Agrippa I (41 to 48) | — | `bib:josephus-antiquities` (19.5.1); `bib:jewish-encyclopedia-herod-ii` | None |
| `agrippa-ii-chalcis` | Agrippa II as king of Chalcis | Client kingdom | Herod Agrippa II (50 to 53) | — | `bib:josephus-antiquities` (20.7.1); `bib:jewish-encyclopedia-agrippa-ii` | None |
| `agrippa-ii-kingdom` | Kingdom of Herod Agrippa II | Client kingdom | Herod Agrippa II (53 to 100; Galilee/Perea towns added 54 or 61) | `scripture:Acts 25:13,25:23,26:2,26:32` | `bib:josephus-antiquities` (20.7.1, 20.8.4); `bib:jewish-encyclopedia-agrippa-ii`; `bib:isbe-trachonitis`; `bib:livius-herod-agrippa-ii` | None |
| `commagene-kingdom` | Kingdom of Commagene | Client kingdom | Antiochus III (to 17), direct rule (17-38), Antiochus IV (38-72; also holds Cilicia Tracheia's coastal part, §2.10, over the same span) | — | `bib:tacitus-annals` (2.42); `bib:cassius-dio-roman-history` (59.8.2); `bib:josephus-antiquities` (19.5.1); `bib:josephus-jewish-war` (7.7) | None |
| `aristobulus-chalcis` | Aristobulus, king of Chalcis | Client kingdom | Aristobulus (by 72; start year not found) | — | `bib:josephus-jewish-war` (7.7.1) | None |
| `polemon-pontus` | Kingdom of Pontus (Polemon) | Client kingdom | Polemon I, then descendants ending with Polemon II (-36 to 64) | — | (existing `pontus.json`); `bib:isbe-galatia` | `pontus` — **removed from `data/timeline.json`'s entities at §2.25's correction; `pontus` keeps a hand-written history instead (not an area's holder)** |
| `galatia-province` | Roman province of Galatia | Province | Roman governors (-25 to 100, continuing); holds `galatia` from -25, `pisidia` and `lycaonia` (west) from -25, `paphlagonia` from -6, `pontus-galaticus` from -2, `pontus` from 64 | — | `bib:isbe-galatia`; existing `galatia.json` | `galatia` (for the core area only; also the holder of several other areas, §2.12) |
| `lycia-province` | Roman province of Lycia | Province | Roman governors (43 to 74) | — | (existing `pamphylia.json` note); `bib:cassius-dio-roman-history` (60.17.3–4) | None |
| `lycia-pamphylia-province` | Roman province of Lycia and Pamphylia | Province | Roman governors (74 to 100, continuing); holds `lycia` and `pamphylia` | — | (existing `galatia.json`/`pisidia.json`/`pamphylia.json`) | None |
| `thrace-kingdom` | Kingdom of Thrace | Client kingdom | Rhoemetalces II (to 46; status uncertain 46–79, §2.14) | — | `bib:smith-dictionary-thracia` | None |
| `nabataean-kingdom` | Nabataean kingdom ("Arabia") | Client kingdom | Aretas IV (-9 to 40), Malichus II (40-71), Rabbel II (71-106) | `scripture:2 Corinthians 11:32,Galatians 1:17` | `bib:livius-nabataeans` | `arabia` |

## 4. Stops

Thirteen stops. The brief's four (ADR-0037) are marked **(required)**.

| Year | Title | Summary | Sources |
|---|---|---|---|
| **-4 (required)** | Herod's kingdom is divided | Herod the Great dies. Augustus confirms his sons' claims but not as Herod willed them: Archelaus becomes ethnarch (not king) of Judea, Samaria and Idumea; Antipas becomes tetrarch of Galilee and Perea; Philip becomes tetrarch of Gaulanitis, Batanea, Trachonitis and Auranitis. Three Greek cities — Gaza, Gadara and Hippos — are cut away and added to the province of Syria. | `bib:josephus-antiquities` (17.8, 17.11.4); `scripture:Matthew 2:22` |
| **6 (required)** | Judea becomes a Roman province | Rome deposes Archelaus and turns his ethnarchy into a province under a prefect. Quirinius, governing Syria, conducts a census. Antipas's and Philip's territories are unaffected. Folded here: in 2 BC, the part of Pontus called "Pontus Galaticus" had already been added to the province of Galatia, the nearest stop to that change. | `bib:josephus-antiquities` (18.1); `scripture:Luke 2:1-2,3:1`; `bib:isbe-galatia` |
| 17 | Cappadocia comes under direct Roman rule; Cilicia Tracheia's king also dies | King Archelaus of Cappadocia dies (or is deposed) after a 50-year reign, and his kingdom becomes a province. Strabo says Archelaus also held Cilicia Tracheia; Tacitus separately records that "Philopator of Cilicia" died the same year as Antiochus of Commagene, and that Rome and local opinion were divided over whether to install a new king there or govern directly. This note follows the administration-by-Syria reading for both Commagene and Cilicia Tracheia (§2.9, §2.10). | `bib:tacitus-annals` (2.42); `bib:strabo-geography` (14.5.6) |
| 34 | Philip's tetrarchy is absorbed into Syria | Philip dies without an heir after 37 years. Rome does not appoint a successor tetrarch; his territory is attached to the province of Syria, though its own revenues stay earmarked for it. | `bib:josephus-antiquities` (18.4.6) |
| 37 | Caligula makes Agrippa I a king | The new emperor frees his friend Agrippa (Agrippa I, grandson of Herod the Great) from a Roman prison and makes him king over Philip's former tetrarchy and the neighboring tetrarchy of Abilene — the first time since Herod the Great that any of this land is ruled by a king rather than a tetrarch, prefect or governor. | `bib:josephus-antiquities` (18.6.10) |
| 39 | Antipas is banished; his tetrarchy joins Agrippa I's kingdom | Herodias presses her husband Antipas to seek the royal title Caligula gave her brother. Caligula instead banishes Antipas and gives Galilee and Perea to Agrippa I. Folded here: the previous year, Caligula had restored the kingdom of Commagene, with the coastal part of Cilicia Tracheia, to Antiochus IV — a different area, placed at this later stop because it could not show on the AD 37 map above. | `bib:josephus-antiquities` (18.7.2); `bib:cassius-dio-roman-history` (59.8.2, Commagene's restoration, AD 38) |
| **41 (required)** | Agrippa I's kingdom is made whole; new neighbors appear | The new emperor Claudius adds Judea and Samaria to Agrippa I's kingdom, restoring his grandfather Herod's full extent under one ruler for the only time in this period. At the same time Claudius makes Agrippa I's brother Herod king of the new client kingdom of Chalcis, and resolves Antiochus IV's position in Commagene and Cilicia Tracheia's coastal part. | `bib:josephus-antiquities` (19.5.1); `scripture:Acts 12:1` |
| **44 (required)** | Agrippa I dies; direct Roman rule returns | Agrippa I dies at Caesarea (Acts 12 and Josephus both describe his sudden death). Rather than let his young son inherit, Claudius places the whole kingdom — Judea, Samaria, Galilee, Perea and Philip's former tetrarchy — under Roman procurators. Folded here: the previous year, Claudius had made Lycia, until then a free federation allied with Rome, a Roman province in its own right — a different area, placed at this stop as the nearest one after AD 43. | `bib:josephus-antiquities` (19.9.2); `scripture:Acts 12:20-23`; `bib:cassius-dio-roman-history` (60.17.3–4, Lycia, AD 43) |
| 53 | Agrippa II trades Chalcis for the northern tetrarchy | Claudius, in the twelfth year of his reign, takes Chalcis back from the younger Agrippa (Agrippa I's son, ruling Chalcis since 50) and gives him Philip's former tetrarchy and Abilene instead, with the title of king. Within the next few years, Nero enlarges this grant with parts of Galilee (Tiberias and Tarichaeae) and Perea (Julias and fourteen villages), while the rest of both regions stays under the Roman procurators; Josephus dates this to Nero's first year (54), but the Jewish Encyclopedia reads Agrippa II's own coinage as pointing to 61 for this specific addition instead. Neither of these towns is drawable land of its own (ADR-0037 item 3), so this does not move the map's borders; it is recorded on the towns themselves, not as its own stop. | `bib:josephus-antiquities` (20.7.1, the Chalcis exchange; 20.8.4, "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichaeae... Julias, a city of Perea, with fourteen villages"); `bib:jewish-encyclopedia-agrippa-ii` (the 61 reading) |
| **70 (required)** | Jerusalem falls | After four years of war, Titus's forces take Jerusalem and destroy the Second Temple, ending Jewish self-government in the province. Agrippa II, who had sided with Rome, keeps his own separate kingdom. Folded here: six years earlier, Polemon II had given up the independent kingdom of eastern Pontus, which the province of Galatia then absorbed as "Pontus Polemoniacus" — a different area, placed at this later stop as the nearest one after AD 64. | `bib:josephus-jewish-war` (7); `bib:isbe-galatia` (Pontus Polemoniacus, AD 64) |
| 72 | Commagene is annexed; Cilicia is reunited | Vespasian's governor of Syria accuses Antiochus IV of Commagene of plotting with Parthia and annexes his kingdom, including the coastal part of Cilicia Tracheia he held. The same year, Cilicia Pedias and Cilicia Tracheia share one province again for the first time since Augustus. | `bib:josephus-jewish-war` (7.7); `bib:livius-cilicia` |
| 74 | Pamphylia leaves Galatia and is joined with Lycia | Vespasian joins Pamphylia with Lycia to its south, forming one new province, and most of Pisidia leaves Galatia for it too. Perga's own province changes name and neighbours, from "Galatia" to "Lycia and Pamphylia," even though Perga's own ground does not move. | (existing `galatia.json`, `pisidia.json`, `pamphylia.json`); `bib:cassius-dio-roman-history` (60.17.3–4, the Claudius-era background to the merger) |
| 100 | Agrippa II dies; his kingdom joins Syria | The last Herodian ruler dies. Justus of Tiberias, Agrippa II's own secretary, gave this year, read from the lost works of Justus by the ninth-century Byzantine scholar Photius; a lead weight found near Tiberias, dated to Agrippa II's own 43rd regnal year (AD 97/98), shows him still reigning shortly before. The historian Nikos Kokkinos defends this date with this and other documentary evidence. Kokkinos's own article records that other historians have instead read Josephus's wording in the *Antiquities* to place Agrippa II's death earlier, "pre-CE 93" — the view of, among others, the standard reference work *The History of the Jewish People in the Age of Jesus Christ* as revised by Vermes and Millar (1973) — a view Kokkinos's article argues against. This note follows the brief's instruction to describe both and choose neither on its own authority; the PO has set the stop at AD 100. His kingdom (Gaulanitis, Batanea, Trachonitis, Auranitis and Abilene) is added to the province of Syria; Livius.org notes signs that he had already lost some territory after 93. | `bib:livius-herod-agrippa-ii`; `bib:kokkinos-justus-josephus-agrippa-coins`; `bib:jewish-encyclopedia-agrippa-ii`; `bib:isbe-abilene` |

**Changes considered and left out, with reasons:**
- **Achaia's and Macedonia's Senate↔emperor transfers (AD 15, 44) and Nero's grant of freedom to Greece (67, reversed by Vespasian):** explicitly not stops under ADR-0037 item 1's own example (no border moves); kept in those areas' own history text only.
- **Paphlagonia added to Galatia (6 BC):** this predates the window (4 BC on) by two years, so it is background in Galatia's own table (§2.12) only, not folded into a stop.
- **Thrace's reduction to a province (disputed between AD 46 and 79):** no current place is there, and the ancient sources disagree on the year by three decades (§2.14); modeled as `uncertain` rather than folded into one stop, since folding would wrongly imply a single known year.
- **Herod of Chalcis's and Agrippa II's appointments to Chalcis (41, 50) and Agrippa II's exchange of it (53):** folded into the stops at 41 and 53 above rather than given their own entries, since Chalcis itself holds no current place and the 53 stop already covers Agrippa II's major territorial change that year.
- **Individual Armenian and Parthian kings:** far too numerous and, for Armenia, too often contested mid-reign to list; modeled as `uncertain` for that whole span (§2.22) rather than folded into a stop, and only the lasting 63 settlement is named, since it changes no border our map would show (a client king remains a client king; only his patron's identity is confirmed).
- **Mauretania's and Britain's internal changes:** per the brief, tracked only as "what the far edge looks like" at each stop above, not as their own stops.

## 5. Names that changed

Under the new rule (brief §1.3; ADR-0037 item 1) that a name change can itself be a stop, this section lists every area, entity and town name this note found changing between 4 BC and AD 100.

### 5.1 Area and entity names

| Year | Change | Is it a stop? | Sources |
|---|---|---|---|
| 2 BC | "Pontus Galaticus" — the part of Pontus added to Galatia — comes into use for that part, distinct from the independent eastern kingdom | Folded into the AD 6 stop (§4); borders no current place on its own | `bib:isbe-galatia` |
| 64 | "Pontus Polemoniacus" comes into use for the formerly independent eastern kingdom, now a province, distinct from Pontus Galaticus and from Bithynia-administered western Pontus | Folded into the AD 70 stop (§4); borders no current place on its own | `bib:isbe-galatia` |
| 74 | "Lycia and Pamphylia" (or "Lycia et Pamphylia") becomes the name of the new joint province; Pamphylia stops being described as part of Galatia | **Yes — its own stop at §4** | `bib:cassius-dio-roman-history` (60.17.3–4); existing `galatia.json`/`pisidia.json`/`pamphylia.json` |

No other area or entity in this note's scope is found changing its name in this window. (Judea's two senses, the district and the province, and Achaia's alternate name "Greece," are parallel names used throughout, not changes over time, and are already explained in §2.1 and §2.15 respectively.)

### 5.2 Renamed towns

These keep their Bible names on the map (ADR-0026); none is proposed as a stop, per the card's instruction. Listed for the human and for the Fact-Checker.

| Town (Bible / map name) | Renamed to | By whom, and when | Sources |
|---|---|---|---|
| Bethsaida | Julias | Philip raised the village to a city and renamed it, "the same name with Caesar's daughter," context-dated to shortly after the AD 6 census | `bib:josephus-antiquities` (18.2.1) |
| Betharamphtha (Perea) | Julias | Antipas rebuilt it and renamed it "from the name of the emperor's wife," same context, shortly after AD 6 | `bib:josephus-antiquities` (18.2.1) |
| Paneas | Caesarea (Philippi) | Philip rebuilt it and renamed it, same passage, shortly after AD 6 | `bib:josephus-antiquities` (18.2.1) |
| Caesarea Philippi | Neronias | Agrippa II renamed his capital "in order to flatter" the emperor Nero, after AD 54 | `bib:jewish-encyclopedia-agrippa-ii` (citing Antiquities 20.9.4) |

**Note on Julia/Julias.** Whiston's translation gives two different reasons for the same name in the same passage (Antiquities 18.2.1): Betharamphtha is renamed "from the name of the emperor's wife," but Bethsaida "the same name with Caesar's daughter." Both are usually read as honoring the same woman, Livia: Augustus's will "appointed as his chief heirs Tiberius... and Livia... these he also bade assume his name," so that she became Julia Augusta (`bib:suetonius-twelve-caesars`, *Augustus*, read for this update). This note does not resolve why Josephus's own (or Whiston's) wording differs between "wife" and "daughter" for the same woman. **Bethsaida's and the Perea Julias's names are identical but the towns are different** — a known source of confusion this note flags for anyone drawing or labeling either site; both are described in this table, not as entities in §3, since a renamed town is not a holder.

## 6. Places

Every current place record's area, grouped (89 places; none needs reassignment — see notes).

| Area | Places (current parent) | Consistent? |
|---|---|---|
| `judea` | bethany, bethlehem, emmaus, jericho, jerusalem (+ jerusalem's own sub-sites: gethsemane, golgotha, mount-of-olives, pool-of-bethesda, pool-of-siloam, temple-mount) | Consistent — all sit within the merged area `judea-samaria-idumea` (§2.1) throughout 4 BC – AD 100, under whichever entity held it. |
| `judea-province` | bethany-beyond-the-jordan, bethsaida, caesarea-maritima, caesarea-philippi, joppa, galilee, judea, samaria | Consistent for "about AD 50" (the project's snapshot date), which falls in the 44–53 window when the procurators (the entity `roman-province-judea`, §3) governed Philip's former tetrarchy too (§2.3) alongside `judea-samaria-idumea` and `galilee-perea`. From 53, bethsaida and caesarea-philippi fall under Agrippa II's kingdom instead (§2.3); this does not change their *parent area* (still the smallest area containing them), only that area's own holder at a later date, already captured in §2.3's table. |
| `galilee` | cana, capernaum, chorazin, magdala, nain, nazareth, sea-of-galilee | Consistent — all sit within the merged area `galilee-perea` (§2.2). `sea-of-galilee`'s parent is a deliberate, already-sourced exception (M3-11): the lake spans the Galilee/Gaulanitis boundary, and no smaller area contains all of it. |
| `samaria` | sychar | Consistent — sits within the merged area `judea-samaria-idumea` (§2.1). |
| `syria` | antioch-syria, damascus, tarsus, tyre | Consistent (§2.8); tarsus is in the Cilician plain, administered from Syria throughout. `damascus` is also, by some ancient counts, a city of the Decapolis (§2.7) — a holder note on this place, not a different area; its ordinary parent stays `syria`. |
| `galatia` | antioch-pisidia, iconium, lycaonia (derbe, lystra), pamphylia (perga), pisidia | Consistent, including the already-sourced placement of Antioch and Iconium directly under Galatia rather than under Pisidia or Phrygia (existing records' own notes), and Perga under Pamphylia despite Pamphylia's own status being modeled as `uncertain` before 74 (§2.12). From 74, Pamphylia's (and so Perga's) holder is "Lycia and Pamphylia," not Galatia (§4, §5.1) — a later data task should update this once M4-01's schema is in place. |
| `asia` | colossae, ephesus, hierapolis, laodicea, miletus, mysia, patmos, pergamum, philadelphia-lydia, sardis, smyrna, thyatira, troas | Consistent (§2.16). |
| `achaia` | athens, corinth (cenchreae), nicopolis | Consistent; cenchreae's parent is the city of Corinth (it is Corinth's port), not Achaia directly — a city-level nesting, not an area exception. |
| `macedonia` | berea, neapolis-macedonia, philippi, thessalonica | Consistent (§2.15). |
| `cyprus` | paphos, salamis-cyprus | Consistent (§2.17). |
| `crete-cyrene` | crete, libya | Consistent (§2.18). |
| `italy` | puteoli, rome | Consistent. |
| `sicily` | malta | Consistent (existing record's own sourced note). |
| `parthian-empire` | media, mesopotamia | Consistent (§2.22). |
| `roman-empire` (direct) | achaia, arabia, asia, bithynia, cappadocia, cilicia, crete-cyrene, cyprus, egypt, galatia, illyricum, italy, judea-province, macedonia, phrygia, pontus, sicily, syria | Consistent — every province/region sits directly under the empire, per ADR-0027. |

No current place record is one of the towns Nero gave Agrippa II (Tiberias, Tarichaeae, the Perea Julias) or a Decapolis city besides Damascus (§2.2, §2.7), so none needs reassignment on that account.

**Two disputed places have candidates in different areas, which today's single-area `politicalHistory` cannot show without favoring one:**
- **`bethany-beyond-the-jordan`** (parent `judea-province`): its Al-Maghtas candidate is on the east bank, in Perea (§2.2); its Qasr al-Yahud candidate is on the west bank, in Judea (§2.1). The two have different early histories — Perea was Antipas's tetrarchy from 4 BC, while the Judea side was Archelaus's ethnarchy, then the province, until 41 — which the record's current single table (following the Perea side) does not show for the Judea candidate.
- **`cana`** (parent `galilee`): its Khirbet Qana and Kafr Kanna candidates are in Galilee; its minority candidate, Qana in today's Lebanon, is in Syria (Phoenicia, which has no area record yet — §7), under a wholly different history than Galilee's.

Both should move to per-candidate political history once M4-01 adds candidate-level links, rather than the single area this note found already in place. No other current place record has candidates in different areas.

## 7. Records worth adding later (M6)

Areas this note researched that have no location record yet: **the combined Philip-tetrarchy area (`philip-tetrarchy-lands`), Abilene, Chalcis, Commagene, Cilicia Tracheia, Paphlagonia, Pontus Galaticus, Lycia, Thrace, Armenia**, and (for the coastal cities, §2.8) **Gaza and Ashkelon**; the Decapolis's individual cities besides Damascus (§2.7, not an area of its own) are also missing. **Idumea and Perea** are region/label records worth adding too, though neither needs its own political history or border once added: both sit inside a merged area (`judea-samaria-idumea`, `galilee-perea` — §2.1, §2.2) that already has one. Phoenicia (Tyre's and Sidon's own region, distinct from the city of Tyre) is also still missing, per the existing backlog. This note does not add any of these as data; M4-03 takes its area list from §2 above for shapes, and a future M6 batch would add place/area records.

## 8. Open questions for the Fact-Checker

1. **Bethsaida's (and similarly Caesarea Philippi's and the Philip-tetrarchy area's) `politicalHistory` currently ends the Agrippa II period at AD 70.** This note's sources (`bib:isbe-trachonitis`, `bib:jewish-encyclopedia-agrippa-ii`, `bib:livius-herod-agrippa-ii`) describe his rule continuing to his death in 100; the 70 cutoff appears to be a side effect of the war's end rather than a sourced change to this area. Recommend correcting in phase 2.
2. **Chalcis's holder, 48–50 and 53–72** (§2.5): modeled as `uncertain`, since this note could not find a named holder in the sources it opened. Recommend a further search in phase 2 before accepting the gap as permanent.
3. **Resolved: Agrippa II's death year is AD 100** (PO's decision), per `bib:livius-herod-agrippa-ii` (the lead weight and Photius) and `bib:kokkinos-justus-josephus-agrippa-coins` (Kokkinos's defense of the same date with further documentary evidence). That same article identifies "pre-CE 93" as "the conventional date," held by, among others, the Vermes & Millar revision of Schürer's standard reference work, and argued from Josephus's own wording rather than from Justus, Photius or the documentary evidence — this note's source for the card's "92/93" alternative, now cited in the AD 100 stop's summary (§4) per the PO's instruction.
4. **Ashkelon's free-city status** (§2.8): asserted by general knowledge of the period, not by a source this note opened. Recommend sourcing before use, or omitting the claim.
5. **"Prefect" vs. "procurator" for AD 6–41** (§2.1): this note's primary source (Whiston's Josephus) uses "procurator" throughout, while the Pilate inscription supports "prefect" for this earlier period specifically. Recommend the Fact-Checker confirm the project's preferred wording with an additional source, since this affects entity names across many periods.
6. **The Luke 2:1–2 census and the Quirinius question** (§2.1): presented neutrally per the card's instruction; no resolution attempted.
7. **Philip's tetrarchy's exact district list, and "Iturea"** (§2.3): Josephus himself is inconsistent across three passages; presented neutrally.
8. **Perga's province from AD 74** (§5.1, §6): once phase 2 encodes the timeline, Perga's `politicalHistory` (and `pamphylia`'s and `pisidia`'s) should gain a row for "Lycia and Pamphylia" from 74, alongside the already-flagged, unresolved (`uncertain`-kind) status of Pamphylia before that date.
9. **Chalcis's drawability** (§2.5): flagged so M4-03 can merge it into a neighbour if no source gives it its own boundary; this note did not find one.
10. **Cilicia Tracheia's pre-17 ruler** (§2.10): Strabo names Archelaus of Cappadocia; Tacitus separately names "Philopator of Cilicia" dying in AD 17. This note presents both without resolving whether Philopator succeeded Archelaus, held a sub-grant, or is another name for the same person; recommend a further search in phase 2.
11. **Pisidia's internal 74 split** (§2.12): the existing record says only "its southern part" transferred to Lycia and Pamphylia; this note found no source describing where that line ran. Recommend finding one, or treating Pisidia as a single area with an `uncertain` holder from 74.
12. **Two candidate-area mismatches** (`bethany-beyond-the-jordan`, `cana` — §6): both need per-candidate political history once M4-01 supports it, rather than today's single area.
13. **Resolved: the `pontus` area has been removed from `data/timeline.json`** (the fix the PO confirmed). Eastern Pontus's land now falls within `cappadocia`, coastal western Pontus within `bithynia`, both noted on those areas' own periods; the `pontus` region record keeps a hand-written `politicalHistory`, like `phrygia`.
14. **Syria's AD 200 split into Syria Coele and Syria Phoenice** (§2.25): asserted from general knowledge of the later Severan reorganization, not from a source this note opened specifically for that event. Recommend the GIS Engineer confirm both the names and the dividing line directly against AWMC's own AD 200 data before M4-03 relies on this note's inference.
15. **Crete/Cyrenaica's and Illyricum's AD 200 provincial names** (§2.25): this note did not find a source confirming whether Crete and Cyrenaica were still one province, or Illyricum still one name, by AD 200, rather than already split (as both regions are well attested to have split at some point). Flagged for the GIS Engineer's own reading of AWMC's layer.
16. **Exactly when Lycaonia/Isauria joined Cilicia's administration** (§2.25): after this note's AD 100 end point and before Diocletian's later Cilicia/Isauria split, per `bib:livius-cilicia`; no source opened for this note narrows the date further, so the Taurus-crest line is offered only as a plausible, not confirmed, dividing line for M4-03 to test against AWMC's own AD 200 line.

## 9. Sources

### New bibliography entries (added to `data/bibliography.json`)
- `bib:isbe-decapolis`, `bib:isbe-ituraea`, `bib:isbe-peraea`, `bib:isbe-trachonitis`, `bib:isbe-abilene` — International Standard Bible Encyclopedia (1915), each opened at internationalstandardbible.com.
- `bib:jewish-encyclopedia-agrippa-ii` — "Agrippa II," Jewish Encyclopedia (1906), by M. Brann. The live site renders articles by JavaScript; this note opened the article's text through a 2005 Wayback Machine snapshot of the same page (URL in the bibliography entry) after the live page returned only its navigation shell.
- `bib:jewish-encyclopedia-herod-ii` — "Herod II." (Herod of Chalcis), Jewish Encyclopedia (1906), by Joseph Jacobs and Isaac Broydé. Opened directly at jewishencyclopedia.com.
- `bib:smith-dictionary-thracia` — "Thracia," *A Dictionary of Greek and Roman Geography* (William Smith, ed., 1854), opened at perseus.tufts.edu. No individual contributor's signature was found on this entry; cited to the general editor, as the project's existing Smith's-dictionary entry does for its own (differently authored) work.
- `bib:livius-herod-agrippa-ii` — "Herod Agrippa II," Livius.org, by Jona Lendering. Opened directly; the PO's own suggested source. States his reign 48–100, the lead weight (his 43rd regnal year, 97/98), Photius's report of his death in Trajan's third year (100), and "indications that he lost some territories after 93."
- `bib:kokkinos-justus-josephus-agrippa-coins` — Nikos Kokkinos, "Justus, Josephus, Agrippa II and his Coins," *Scripta Classica Israelica* 22 (2003), open access at scriptaclassica.org (PDF downloaded and its text extracted for this note, since the article view page alone does not render the text). Kokkinos defends Justus's/Photius's AD 100 date with the lead weight, an inscription and coin evidence, against two critics; the same article calls "pre-CE 93" "the conventional date," based on "an interpretation of Josephus" and held by, among others, the Vermes & Millar revision of Schürer — this note's source for the card's "92/93" alternative.
- `bib:livius-titus`, `bib:livius-domitian`, `bib:livius-nerva`, `bib:livius-trajan` — Livius.org person pages, by Jona Lendering, each opened directly for its stated reign years (§2.23).
- `bib:livius-cappadocia`, `bib:livius-lycia` — Livius.org place pages, by Jona Lendering, opened directly for §2.25 (Cappadocia's AD 70 merger with Galatia and its Satala frontier; Lycia's general geography).

### Primary texts opened for this note (existing bibliography entries, new chapters read)
- `bib:josephus-antiquities`, books 17–20 (Whiston's translation, ccel.org): Herod's death and will (17.8); Augustus's division of the kingdom (17.11.4); Quirinius's census and Coponius (18.1); the Pilate/Vitellius/Aretas narrative (18.4–18.5); Herod's and Philip's city-building, including the renamings in §5.2 (18.2.1); Philip's death (18.4.6); Caligula frees and crowns Agrippa I (18.6); Antipas banished (18.7); Claudius's accession and settlement (19.4–19.5); Herod of Chalcis mentioned (20.1); Agrippa II's exchange of Chalcis and Nero's grants (20.7–20.8); **Emesa's kings Azizus and Soemus, read for §2.25 (20.8.4).**
- `bib:josephus-jewish-war`, books 2, 3 and 7 (same translation): the division and AD 6 narrative (2.6–2.8); Antipas's banishment, with a different place of exile than Antiquities (2.9); **the borders of Galilee, Samaria, Judea and Perea, and Philip's former tetrarchy (3.3.1–3.3.5), read for the PO's border-descriptions request (§2.24)**; Commagene's annexation under Vespasian (7.7); **Emesa's forces at the siege of Jerusalem, read for §2.25 (book 7).**
- `bib:tacitus-annals`, book 2 (LacusCurtius, Loeb translation): Cappadocia's and Commagene's annexation, 2.42.
- `bib:cassius-dio-roman-history`, books 59–60 (LacusCurtius, Loeb translation): Caligula's grants to Agrippa I and Antiochus IV, 59.8; Mauretania, 59.25; Claudius's British campaign, 60.19–21.
- `bib:suetonius-twelve-caesars`, *Claudius* (LacusCurtius): the British triumph, checked for a Thrace reference (none found). *Augustus* (LacusCurtius, read for the PO's amendment): Augustus's will directing Livia to "assume his name" (§5.2's note on Julia/Julias).
- `bib:strabo-geography`, books 12, 14 and 16 (LacusCurtius, Loeb translation): book 14, read for the PO's area-and-names amendment: the Cilicia Tracheia/Pedias division and its boundary at the river Lamus, Archelaus of Cappadocia's hold on Tracheia (14.5.1, 14.5.6), and the Lycia/Pamphylia border at Phaselis and Olbia (14.4.1), read for §2.24. **Books 12 and 16, read for the PO's border-descriptions request (§2.24):** Paphlagonia's full boundary and its last king, Deiotarus Philadelphus (12.3.9, 12.3.41); the Galatians' position south of Paphlagonia and Lake Tatta near Cappadocia (12.5.1, 12.5.4); Syria's, Commagene's and Samosata's borders (16.2.1, 16.2.3).
- `bib:livius-nabataeans`: re-opened for this note's precise reign years.
- `bib:isbe-galatia`: re-opened for Paphlagonia, Pontus Galaticus and eastern Lycaonia's years.
- `bib:isbe-cappadocia`, `bib:isbe-cilicia`, `bib:isbe-bithynia`, `bib:isbe-pontus`, `bib:isbe-arabia`: opened directly for the first time for §2.25 (each already an existing bibliography entry, cited before this note only through other records' pre-existing text).
- `bib:livius-cilicia`, `bib:livius-pamphylia`: re-opened for §2.25's AD 200-era content (Cilicia's reunification and later Diocletianic split; Pamphylia's successive provinces).
- **Wikidata**, queried directly through its API (not Pleiades' own site, which blocks automated page fetches — `docs/research/SOURCES.md`'s known issue) for the Pleiades ids given in §2.24's border table, each cross-checked against the place named in the primary source.

### WEB verses quoted or cited
Pulled from `data/reference/engwebp_vpl.txt` (the project's own snapshot): Matthew 2:22; Mark 3:8; Luke 1:5; Luke 2:1–2; Luke 3:1; Luke 23:6–7; Acts 2:9; Acts 12:1,12:19–23; Acts 18:12; Acts 25:1,25:13,25:23; Acts 26:2,26:32; Galatians 1:17,1:21; 2 Corinthians 11:32; 1 Peter 1:1.

Run `npm run validate:data` after adding the bibliography entries above (done; see commit).
