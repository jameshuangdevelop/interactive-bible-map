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

**Superseded by the data where they differ (2026-10-08):** the Fact-Checker's re-verification (`docs/verification/M4-timeline.md`, R30–R33) corrected Thrace's, Commagene's and Cilicia Tracheia's start years and rulers, and Cappadocia's ruler labels, after this section was written. `data/timeline.json` is canonical for all of these; see §2.9, §2.10, §2.11 and §2.14 below, which this update left as first drafted, and the Entities table (§3) and new "Islands"/"rest of the Roman world" material (end of §2.25), which are current.

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
| 54 (or 61) | 100 | Mostly the province; **Tiberias and Tarichaeae (Galilee) and Julias-in-Perea with 14 villages** pass to Agrippa I's kingdom instead | Herod Agrippa II | `bib:josephus-antiquities` (20.8.4, "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichae... He gave him also Julias, a city of Perea, with fourteen villages"); on the year, `bib:jewish-encyclopedia-agrippa-ii` | Josephus dates this grant to "the first year of the reign of Nero" (AD 54). The Jewish Encyclopedia notes Agrippa II's coins carry two era-starting years, 53 and 61, and reads the second as this grant's real date, from numismatic evidence Josephus's narrative does not mention. This note presents both; see the stop at §4 (folded into the AD 53 stop, since these towns are not drawable land of their own, ADR-0037 item 3). No current place record is Tiberias, Tarichaeae, or the Perea Julias (not Bethsaida's Julias — see §5.2), so no place needs reassignment either way (§6). |

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
| ? | 17 | Client kingdom | Antiochus III | `bib:tacitus-annals` (2.42) | |
| 17 | 38 | Roman province of Commagene, its own praetorian governor | Quintus Servaeus, first governor | `bib:tacitus-annals` (2.56, "Quintus Servaeus was appointed to Commagene, now for the first time transferred to praetorian jurisdiction"); `bib:strabo-geography` (16.2.3, calls it a province by his own day) | Not administered by Syria's own governor: this is a separate, if small, praetorian province. |
| 38 | 39 | Client kingdom restored | Antiochus IV | `bib:cassius-dio-roman-history` (59.8.2, Caligula "had given Antiochus, the son of Antiochus, the district of Commagene, which his father had held," and "likewise the coast region of Cilicia") | |
| 39 | 41 | **Uncertain** (kind: `uncertain`) | | `bib:cassius-dio-roman-history` (60.8.1, Claudius "restored Commagene to Antiochus, since Gaius... had taken it away again") | Dio records the taking-away only in passing, with no year; this span is modeled as unclear rather than guessing at a year. |
| 41 | 72 | Client kingdom, restored again | Antiochus IV | `bib:cassius-dio-roman-history` (60.8.1) | Also held the coastal part of Cilicia Tracheia throughout, carried in that area's own table (§2.10), not part of Commagene's own territory. |
| 72 | 100 (no change found in this window) | Annexed to the province of Syria | | `bib:josephus-jewish-war` (7.7.1–3, "in the fourth year of the reign of Vespasian," Caesennius Paetus, governor of Syria, deposes Antiochus IV on suspicion of conspiring with Parthia) | |

### 2.10 Cilicia: the plain (Pedias) and the rough west (Tracheia)

**Split per the PO's review:** these are two separate areas. The existing `cilicia` record (parent `roman-empire`, not `syria`, by design) is narrowed to mean the plain only (Cilicia Pedias, where Tarsus sits); the rough west (Cilicia Tracheia) is a new, separate proposed area, `cilicia-tracheia`. The two shared one Roman province both before 27 BC and again from 72; between those dates they had different holders, so a single area would have put Tarsus under Commagene's king, which the sources do not support.

**The dividing line (for M4-03 to draw):** Strabo gives a specific boundary: "the boundary of [Cilicia Tracheia], the river Lamus and the village of the same name, lies between Soli and Elaeussa" (`bib:strabo-geography`, 14.5.6). Everything from the Lamus west to Pamphylia is Tracheia; everything from Soli (just east of the Lamus) to Issus, "for the most part... plains and fertile land," is Pedias (14.5.1, 14.5.6).

**Cilicia Pedias (the plain; existing id `cilicia`):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -27 | 72 | Administered from Syria throughout | | (existing `cilicia.json`); `bib:cassius-dio-roman-history` (59.8.2); `bib:strabo-geography` (14.5.1, 14.5.6); `bib:livius-cilicia` ("the remainder became an appendix to the province Syria") | |
| 72 | 100 (no change found) | Reunited with Cilicia Tracheia as one province | | (existing); `bib:livius-cilicia` | From 72 both pieces share one holder, "the Roman province of Cilicia," without becoming one area: each keeps its own already-described shape. |

**Cilicia Tracheia (the rough west; new proposed area `cilicia-tracheia`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom | Archelaus of Cappadocia | `bib:strabo-geography` (14.5.6, "Archelaüs received, in addition to Cappadocia, Cilicia Tracheia... except Seleuceia") | Tacitus separately names "Philopator of Cilicia" as dying in AD 17, the same year as Antiochus of Commagene (`bib:tacitus-annals`, 2.42); but the Loeb edition's own note to that passage places Philopator's principality in the east of Cilicia, not Tracheia, so he is not treated as a possible ruler of this area. |
| 17 | 38 | **Uncertain** (kind: `uncertain`) | | `bib:tacitus-annals` (6.41, the Cietae, "a tribe subject to Archelaus of Cappadocia," still fighting "the forces of the king" in AD 36) | Cappadocia itself had already become a province in 17 (§2.11); Tacitus's AD 36 passage shows a king's forces still active among the Cietae of the Taurus nearly twenty years later, which this note cannot reconcile into a single clear holder for Cilicia Tracheia specifically. |
| 38 | 72 | Client kingdom: given to Commagene's king | Antiochus IV (of Commagene) | `bib:cassius-dio-roman-history` (59.8.2, "the coast region of Cilicia"; 60.8.2, Polemon separately given "some land in Cilicia" in 41) | Held by Commagene's king, but not part of Commagene's own territory (§2.9) — a different area under the same ruler. Dio does not say how Polemon's grant related to Antiochus's own holding here. |
| 72 | 100 (no change found) | Reunited with Cilicia Pedias as one province | | `bib:josephus-jewish-war` (7.7.1–3); `bib:livius-cilicia` | |

### 2.11 Cappadocia

Matches the existing `cappadocia` record (empty `politicalHistory`). This note adds the table.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom | Archelaus | `bib:tacitus-annals` (2.42, "for fifty years King Archelaus had been in possession of Cappadocia"; Tiberius "lured Archelaus from Cappadocia," and "his kingdom was converted into a province") | |
| 17 | 69 | Roman province, equestrian governors | Quintus Veranius, first governor | (existing, citing `bib:isbe-cappadocia`); `bib:tacitus-annals` (2.42, the annexation) | The Loeb note to 2.56 calls Veranius's appointment "only a temporary expedient," but no later equestrian governor's name was found before 69. This area's drawn extent also covers Pontus Galaticus (part of Galatia from 2 BC), Polemon's kingdom of Pontus (a client kingdom until 63 or 64), and Lesser Armenia (ruled by client kings from 38 to 72); AWMC draws no line between any of these and Cappadocia proper, so under ADR-0037 rule 4 they are small units, not an area of their own, and Cappadocia's own holder does not change on their account. |
| 69 | 100 (no change found) | Roman province, consular governors | Gnaeus Pompeius Collega, first consular governor (AD 69) | `bib:suetonius-twelve-caesars` (*Vespasian* 8.4, "gave it a consular governor in place of a Roman knight"); `bib:livius-cappadocia` | Cappadocia and Galatia may have shared one governor from about this time, which Livius calls likely, but no ancient source states a merger outright, so they stay two areas with their own holders. |

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

**Pontus Galaticus (not its own drawn area; folded into `cappadocia`'s extent — see §2.13):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -2 | Part of the independent Pontic kingdom (§2.13) | | `bib:isbe-galatia` ("part of Pontus 2 BC") | |
| -2 | 100 (no change found) | Roman province of Galatia | | `bib:isbe-galatia` | Folded into the AD 6 stop (§4). AWMC draws no line between this district and Cappadocia proper, so it is not its own area on the map (ADR-0037 rule 4); its administrative holder (Galatia) is still as given here. |

**Lycia (new proposed area `lycia`; no current place sits here):**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 43 | Free federation (the Lycian League), allied with Rome | | `bib:cassius-dio-roman-history` (60.17.3–4); `bib:strabo-geography` (14.3.2–3, names the League) | |
| 43 | 74 | **Uncertain** (kind: `uncertain`) | | `bib:cassius-dio-roman-history` (60.17.3, Claudius "incorporated them in the prefecture of Pamphylia"); `bib:suetonius-twelve-caesars` (*Vespasian* 8.4, implying Lycia had freedom again by his reign); `bib:tacitus-histories` (2.9, Loeb note: "Galatia, Pamphylia, and Lycia now formed one province" by AD 69) | Dio does not call Lycia its own province; Suetonius and the Loeb note to Tacitus disagree with each other on the details. This note does not resolve Lycia's status across this span, so it is modeled as unclear rather than as "Roman province of Lycia." |
| 74 | 100 (no change found) | Roman province of Lycia and Pamphylia | | `bib:isbe-pisidia`; `bib:livius-pamphylia` | Folded into the AD 74 stop (§4), alongside Pamphylia's own change the same year. |

### 2.13 Pontus (the eastern, Polemon kingdom) and Bithynia

**Note added at §2.25:** eastern Pontus is not drawn as its own area after all; the PO's reading of AWMC's AD 200 line places it inside Cappadocia's extent, with coastal, western Pontus inside Bithynia's. The chronology and sources below still stand; they are now carried in `cappadocia`'s and `bithynia`'s own area notes and the `pontus` region record's hand-written history, not a `pontus` area.

Bithynia (existing id `bithynia`) is not one of the Galatia-administered pieces above; it was always its own, separately stable province. Pontus (existing id `pontus`) is the independent eastern kingdom, which becomes one of the Galatia-administered pieces once Polemon gives it up.

| Area | From | To | Holder | Sources | Notes |
|---|---|---|---|---|---|
| Bithynia | -74 | 100 (no change found) | Roman province | (existing `bithynia.json`, citing `bib:isbe-bithynia`) | |
| Pontus | -66 | 64 | Client kingdom | (existing `pontus.json`, citing `bib:isbe-pontus`, Pompey "appointed in 66 BC"); `bib:isbe-galatia` ("in 64 also Pontus Polemoniacus [added to Galatia]") | Ruler: Polemon I, then his descendants, ending with Polemon II. ISBE's "Pontus" entry dates Polemon's kingdom becoming a province to 63; ISBE's "Galatia" entry gives 64 for the same event. Neither is Suetonius, who gives no year. |
| Pontus | 64 | 100 (no change found) | Roman province of Galatia, as "Pontus Polemoniacus" | `bib:isbe-galatia` | Folded into the AD 70 stop (§4). |

### 2.14 Thrace

No current record (proposed id `thrace`); no current place sits here, but the card's area list names it.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 38 | **Uncertain** (kind: `uncertain`) | | `bib:smith-dictionary-thracia` (calls Rhoemetalces II "the last native prince," implying one or more earlier rulers) | No source found names the ruler(s) in this span. |
| 38 | 47 | Client kingdom | Rhoemetalces II | `bib:smith-dictionary-thracia` ("made by Caligula ruler over the whole country" in AD 38) | |
| 47 | 69 | **Uncertain** (kind: `uncertain`) | | `bib:smith-dictionary-thracia`; `bib:tacitus-histories` (1.11, lists Thrace among the districts "in charge of imperial agents" already in January AD 69) | Smith's Dictionary (1854) reports a genuine ancient disagreement: the Eusebian Chronicle dates Thrace's reduction to a province to AD 47, under Claudius, but Suetonius and Eutropius date it to Vespasian's reign. This note could not confirm Smith's attribution to Suetonius: the passage in `bib:suetonius-twelve-caesars` (*Vespasian* 8.4) that most resembles it actually names "Trachian Cilicia," not Thrace. Smith's own editor favors the later date but allows that Rhoemetalces II may have died around 47, with formal provincial status only delayed. Tacitus's own *Histories* independently shows Thrace already under direct imperial government by January 69, before Vespasian's reign began, which is why this span is modeled as unclear only until 69, not 79. |
| 69 | 100 (no change found) | Roman province | | `bib:smith-dictionary-thracia`; `bib:tacitus-histories` (1.11) | |

**Stops:** this area's changes are folded into the AD 39, AD 53 and AD 70 stops (§4), the nearest ones at or after 38, 47 and 69 respectively.

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

**Note added at §2.25 (ADR-0037 rule 5):** neither is drawn as a timeline area after all — AWMC gives no sourced extent for land outside the empire, so Rome's own edge shows where its world ended, without a Parthian or Armenian shape beyond it. The chronology and sources below still stand, now carried in `parthian-empire.json`'s, `media.json`'s and `mesopotamia.json`'s own hand-written histories rather than a `parthian-empire` or `armenia` area.

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
| 1 | `galilee-perea` (Galilee) / `judea-samaria-idumea` (Samaria) | West end: Mount Carmel (`wikidata:Q185318`, 35.0233, 32.6725) and Ptolemais's own territory (Ptolemais/Acre, `wikidata:Q126084`, 35.0839, 32.9261). East end: Scythopolis (`pleiades:678378`) and the Jordan River (`pleiades:687932`). Middle: the village Ginea, "in the great plain" (the Jezreel Valley), probably identified with modern Jenin (`wikidata:Q374748`, 35.3, 32.4611; `pleiades:678163`). West end of Samaria's own line: "the Acrabbene toparchy" — not further identified. | `bib:josephus-jewish-war` (3.3.1, Galilee "bounded toward the sun-setting, with the borders of the territory belonging to Ptolemais, and by Carmel... bounded on the south with Samaria and Scythopolis, as far as the river Jordan"; 3.3.4, Samaria "begins at a village... called Ginea, and ends at the Acrabbene toparchy"); `bib:isbe-en-gannim` ("it probably corresponds to the Ginnea of Josephus ..., and may certainly be identified with the modern Jenin") | **Yes, partial:** the two end-points (Carmel/Ptolemais in the west, Scythopolis/Jordan in the east) are now anchored with coordinates; the line between them, through Ginea/Jenin, is a named point, not a drawn path, and "the Acrabbene toparchy" (Samaria's own southwestern end) is still not identified. |
| 2a | `galilee-perea` (Perea) / Decapolis (Pella, held by Syria, §2.7) | Pella (`pleiades:678326`, `wikidata:Q167993`, 35.6167, 32.45), on Perea's north and on the Jordan side; from there the line runs east toward Philadelphia's own territory (`pleiades:697728`, `wikidata:Q3805` for modern Amman, 35.9333, 31.95), since Josephus gives Perea's breadth as "from Philadelphia to Jordan." No source names a midpoint between the two. | `bib:josephus-jewish-war` (3.3.3, "the length of Perea is from Macherus to Pella... its breadth from Philadelphia to Jordan; its northern parts are bounded by Pella") | **Yes, partial:** Pella and Philadelphia anchor the line's two ends; no landmark is named between them. |
| 2b | `galilee-perea` (Perea) / `arabia` (Nabataea) | South: "the land of Moab" (a region, not a point). East: Nabataea ("Arabia"), "Silbonitis" (not identified), and the Decapolis cities Philadelphia (`pleiades:697728`) and Gerasa (not checked for an id in this note). The Dead Sea's own shore south of Machaerus (`pleiades:697700`, on the east shore) belongs with `arabia`, since Josephus gives Perea's own length as ending at Machaerus, not reaching the sea's southern end. | `bib:josephus-jewish-war` (3.3.3, "the land of Moab is its southern border, and its eastern limits reach to Arabia, and Silbonitis, and besides to Philadelphene and Gerasa"; "the length of Perea is from Macherus to Pella") | **Yes:** "the land of Moab" names a people's historical territory, not a line; Silbonitis is otherwise unknown to this note. Likely close to Herod's kingdom's own eastern/southern outline already in AWMC, but this note cannot confirm they are identical. The Machaerus anchor for the Dead Sea's shore is firmer. |
| 2c | `galilee-perea` (Perea) / `philip-tetrarchy-lands` | West: the Jordan River (`pleiades:687932`), shared with border 3 below | `bib:josephus-jewish-war` (3.3.3, Perea's "Western [border, bounded] with Jordan") | No: a river, already in AWMC's hydrology. |
| 3a | `philip-tetrarchy-lands` / `galilee-perea` (Galilee) | The Jordan River (`pleiades:687932`) and the Sea of Galilee ("the lake of Tiberias," `pleiades:678430`) | `bib:josephus-jewish-war` (3.3.1, Galilee bounded east by "Gaulonitis"; 3.3.5, Philip's lands "reaches breadthways to the lake of Tiberias") | No: a river and a lake, already in AWMC's hydrology and coastline. |
| 3b | `philip-tetrarchy-lands` / Gadara (Decapolis, held by Syria, §2.7) | **Resolved as rule 2, a described line:** ISBE's "Golan; Gaulonitis" entry gives the Golan/Gaulanitis district's own boundaries as "Mt. Hermon on the North, Jordan and the Sea of Galilee on the West, Wady Yarmuk on the South, and Nahr `Allan on the East" — the Yarmuk (Hieromax, `pleiades:678183`) is Gaulanitis's southern edge. Gadara, south of the Yarmuk, is Decapolis land held by Syria for this note's whole window, so its own small, undrawable territory falls within `syria`, not `philip-tetrarchy-lands` or `galilee-perea`. Hippos, north of the Yarmuk, stays with `philip-tetrarchy-lands` under rule 4 (its own small territory is not independently drawable, but now sits on the correct side of a sourced line). | `bib:isbe-golan` ("The boundaries of the province today are... Wady Yarmuk on the South"), read together with Josephus's general statement that Galilee (and so Gaulanitis) bordered "Hippeae and Gadaris" (`bib:josephus-jewish-war` 3.3.1) | **Partial:** ISBE describes the district's boundary "today" (1915), not explicitly in the first century, though the same entry treats ancient Gaulanitis and the modern district as the same land ("corresponded roughly with the modern Jaulan"); a river is also a stable landmark across centuries. Recommend the GIS Engineer treat this as reasonably confident, not certain. |
| 3c | `philip-tetrarchy-lands` / `abilene`, and / Damascus (`syria`) | Mount Lebanon ("Mount Libanus") and "the fountains of Jordan" (near Caesarea Philippi/Panias, an existing place record) mark Philip's lands' own northern start | `bib:josephus-jewish-war` (3.3.5, "This country begins at Mount Libanus, and the fountains of Jordan... in length is extended from a village called Arpha, as far as Julias" — Julias being Bethsaida, an existing place record) | **Yes:** no source this note opened draws a specific line between Philip's lands and Abilene or Damascus beyond this shared starting landmark; "Arpha" is not further identified. Recommend further search, or merging across this edge if none is found. |
| 4 | `abilene` (extent) | Abila itself, "18 Roman miles from Damascus on the way to Heliopolis [Baalbek]" | `bib:isbe-abilene` | **Resolved as rule 4, not a boundary:** this gives Abila's own location, not a boundary; no source this note opened describes Abilene's edges, and Abilene lies outside AWMC's Herod's-kingdom outline (it was never part of Herod's own realm). Its land falls within `syria`, the same neighbour Chalcis's land falls within (§2.5, §2.25), since Abila sits on the Damascus road, in Syria's own geographic sphere. |
| 5 | `cilicia` (Pedias) / `cilicia-tracheia` | The river Lamus, between Soli and Elaeussa | `bib:strabo-geography` (14.5.6) | No — already described fully in §2.10. |
| 6 | `lycia` / `pamphylia` | Phaselis (`pleiades:639051`, the last Lycian city) and Olbia, "the beginning of Pamphylia" (not further identified) | `bib:strabo-geography` (14.4.1, "After Phaselis one comes to Olbia, the beginning of Pamphylia") | **Yes, partial:** Phaselis anchors the Lycian side; Olbia, the Pamphylian side, has no confirmed id in this note. |
| 7 | `commagene` / `syria` | The Euphrates (east, shared with Mesopotamia) and Mt. Amanus (Syria's own northern edge, towards Cilicia); Samosata (`pleiades:658587`) is Commagene's own centre | `bib:strabo-geography` (16.2.1, "Syria is bounded on the north by Cilicia and Mt. Amanus... bounded on the east by the Euphrates"; 16.2.3, Commagene and Samosata) | **Yes:** Strabo counts Commagene as one of the "parts of Syria" in this passage and gives no specific line between Commagene and the rest of Syria to its south; only its general position (immediately south of Cilicia/Mt. Amanus, on the Euphrates) is described. Recommend further search, or an approximate line around Samosata's own territory. |
| 8a | `paphlagonia` / `pontus` (and, by the same line, toward `pontus-galaticus`) | The Halys River (`pleiades:857148`) | `bib:strabo-geography` (12.3.9, "On the east, then, the Paphlagonians are bounded by the Halys River") | No: a river, already in AWMC's hydrology. Also confirms Paphlagonia's last king by name: Deiotarus Philadelphus (same passage) — corrects this note's earlier §2.12 flag, which could not name him. |
| 8b | `paphlagonia` / `galatia` | "The Galatians... are to the south of the Paphlagonians"; no river or town is named for this specific line | `bib:strabo-geography` (12.3.9, south: "Phrygians and the Galatians who settled among them"; 12.5.1, "The Galatians, then, are to the south of the Paphlagonians") | **Yes:** a compass direction, not a landmark. |
| 8c | `paphlagonia` / `bithynia` | "The Bithynians and the Mariandyni," no river or town named | `bib:strabo-geography` (12.3.9); `bib:isbe-bithynia` | **Yes:** a compass direction, not a landmark. |
| 8d | `pontus-galaticus` / `pontus-polemoniacus` (the internal line within the old Pontic kingdom) | None found | — | **Yes, fully:** this note found no source distinguishing exactly where Rome's earlier (2 BC) and later (AD 64) additions to Galatia met inside the former kingdom of Pontus. Recommend M4-03 treat them as one combined shape if no line is found, or flag the whole area `uncertain` for this internal edge only. |
| 9 | `galatia` / `cappadocia` | **RL4, confirmed with coordinates.** Cappadocian side: Tyana (`pleiades:648801`, 34.5722°E 37.8232°N) and Garsaura (`pleiades:619164`, 34.0269°E 38.3705°N). Galatian side: Lake Tatta (`pleiades:619268`, 33.3333°E 38.8333°N, via Wikidata Q211823) and the Lycaonian cities Iconium (32.4923°E 37.8725°N), Lystra (32.3445°E 37.5883°N) and Derbe (33.3615°E 37.3486°N, this project's own place records). The line runs between these two groups, from near Lake Tatta and Iconium in the west to Tyana and Garsaura in the east. Mazaca (later Caesarea, `pleiades:629035`, 35.48°E 38.72°N, per the M4-03 Fact-Checker's own check) stays on Cappadocia's side too (below). | `bib:strabo-geography` (12.1.4, Garsaura "round" which "the greater part of the rest of the country" lies, next to "Lycaonia and Morimene"; 12.2.7, Tyana and Mazaca, see below; 12.5.4, Lake Tatta) | **Mostly resolved:** Strabo gives the district, not a precise line; the anchors fix the two sides, but the exact line between them is still approximate. |
| 9n | **Strabo's prefectures and the Roman provinces (for RL4's second question).** Strabo describes the former kingdom of Cappadocia, under its last king Archelaus (to AD 17), as divided into ten internal districts he calls "prefectures" (*strategiai*): Tyana is the city of one, "Tyanitis"; Mazaca, "the metropolis of the tribe," is in another, which Strabo calls "the Cilician prefecture" — an internal Cappadocian district named for its direction (toward Cilicia), not the Roman province of Cilicia itself, which lay beyond the Taurus. When Rome annexed Cappadocia as one province in AD 17, all ten prefectures, Tyanitis and the "Cilician prefecture" alike, became internal parts of that single province; none crossed into a different Roman province. Lycaonia, by contrast, was never one of Cappadocia's ten prefectures: Strabo lists it as a neighboring district, and this note's own §2.12 already establishes that Iconium, Lystra and Derbe joined the province of Galatia in 25 BC, on the death of King Amyntas. Tyana and Garsaura, both within Cappadocia's own prefectures, and Iconium, Lystra and Derbe, within Galatia's Lycaonian territory, therefore anchor opposite sides of the provincial line with confidence, even though Strabo never states the line itself. | `bib:strabo-geography` (12.1.4; 12.2.7, "in the prefecture Tyanitis... is Tyana"; "Mazaca... is in the Cilician prefecture, as it is called") | No drawing action; background for G6. |

### 2.25 Area composition (for M4-03)

**Revised to AD 69/AD 14 terms, replacing the AD 200-only draft above.** The GIS Engineer (on a clean AD 69 and AD 14 partition) built a first draft of all 25 areas (now 23, after the rule-5 removal below) from this section's AD 200 draft and §2.24's border descriptions, translated to the closer AD 69/AD 14 faces where those separate things, with rule-3 fallbacks (the AD 200 line between Cilicia and Syria; the AD 200 Arabia line for the Nabataean kingdom; the AD 117 extent for Armenia, now moot — see below) and rule-2 cuts (the Bosporus and Hellespont; the river Lamus, §2.24 #5; the Jordan, §2.24 #2c/#3a) where a described line exists. The composition report and two preview images (`composition-report.md`, `areas-ad50-italy-to-mesopotamia.png`, `areas-ad50-levant.png`, forwarded by the PO) are this section's primary source for what AWMC's own faces are actually named and sized; this note's own sources back each ruling below.

**Rule 5 (ADR-0037 update): land outside the empire, without a sourced extent, is not drawn.** AWMC gives no extent for the Parthian Empire or Armenia. Both areas are removed from `data/timeline.json` (25 → 23 areas); their only holder-entities used nowhere else are removed too (`parthian-empire-entity`, `armenia-contested`, `armenia-client-kingdom`). `parthian-empire.json`, `media.json` and `mesopotamia.json` keep hand-written `politicalHistory`, like `phrygia`; there is no `armenia.json` record to change (§7, still a future addition). The empire's own edge still shows where Rome's world ended; Parthia and Armenia keep their map labels off the ancient layer, per ADR-0037's own wording.

**16 areas built from real AD 69/AD 14 faces, confirmed:**

| Area | AWMC face | Status |
|---|---|---|
| `commagene` | AD 69 face f0030 (Commagene) | Matches this note's own sourcing (§2.9) directly; no change needed. |
| `cappadocia` | AD 14 face f0029 ("Armenia Minor / Cappadocia / Pontus Galaticus / Pontus Polemoniacus") | **Confirms this note's Pontus correction independently**: AWMC's own face already groups these four together, matching the rule-4 ruling above. |
| `galatia` | AD 14 face f0028 (Galatia) | See the Pisidia/Pamphylia ruling below; the face itself is right, but Pisidia's own label point falls outside it. |
| `pamphylia` | AD 14 face f0035 (Pamphylia), 23,465 km² | See the Pisidia/Pamphylia ruling below: this face is far larger than Pamphylia's coastal plain and almost certainly includes southern Pisidia, with no finer AWMC line available. |
| `lycia` | AD 14 face f0036 (Lycia) | No change needed. |
| `bithynia` | AD 14 face f0027 ("Bithynia et Pontus / Thracia") | This one face covers Bithynia and Thrace alike (consistent with `thrace` needing "a straits cut from the Bithynia/Thrace merged face" to separate out, below); the Bosporus and Hellespont (already a rule-2 cut per the PO) are the natural, uncontroversial line, already in AWMC's own coastline/hydrology, not a new citation this note needed to add. |
| `achaia` | AD 69 face f0042 (Achaia) | **Nicopolis/Epirus, resolved:** yes, Epirus (where Nicopolis sits) was part of Achaia in this period. Cassius Dio lists "Greece with Epirus" as one of the provinces assigned to the Senate in 27 BC, and Tacitus calls Nicopolis "an Achaian town" in his account of AD 18 (`bib:cassius-dio-roman-history`; `bib:tacitus-annals`; both already cited on the existing `nicopolis.json` record). Nicopolis's 5 km gap is a boundary-precision issue, not a category error. |
| `macedonia` | AD 69 face f0041 (Macedonia) | Neapolis's 0.7 km gap is a boundary-tolerance issue, not substantive. |
| `asia` | AD 69 face f0024 (Asia) | **Islands:** Patmos (59.4 km outside) belongs to Asia — this project's own existing `asia.json` text already states "the province apparently included Patmos and other islands near its coast" (`bib:isbe-asia`). Miletus's and Troas's near-border gaps are tolerance issues. |
| `cyprus` | AD 69 face f0101 (Cyprus) | Paphos's and Salamis's near-border gaps are tolerance issues (both are coastal cities on Cyprus itself). |
| `crete-cyrene` | Union of AD 69 faces f0100 (Creta) and f0038 (Cyrenaica) | **Resolves this note's earlier open flag:** the two were still one administrative unit at AD 69, which is what this window needs; whether they later split by AD 200 no longer matters for this area. |
| `egypt` | AD 69 face f0002 (Aegyptus) | See the Sinai ruling below: Egypt's own eastern/Sinai edge should not extend across the peninsula. |
| `italy` | Union of 19 AD 69 Italian regional faces, selected by centroid | A cleaner build than this note's earlier suggestion (the empire's own extent outline); no change needed. |
| `sicily` | AD 69 face f0085 (Sicilia) | **Islands:** Malta (97 km outside) belongs to Sicily — Rome's annexation from Carthage in 218 BC, already cited on the existing `sicily.json` record. |
| `illyricum` | AD 69 face f0010 (Dalmatia) | **Resolved:** Dalmatia only, not Pannonia, matching this note's own existing text — ISBE's Illyricum entry already states Paul uses the name "in its narrower sense: a single Roman province... which later came to be called Dalmatia" (`bib:isbe-illyricum`). Already built correctly. |

**Pisidia and Pamphylia, inside one oversized AD 14 face:** before AD 74 the two areas' holders differ (`pamphylia` `uncertain`, `galatia`'s Pisidia piece a confirmed Roman province), and AWMC gives no finer line within its one "Pamphylia" face to separate actual coastal Pamphylia from southern Pisidia's hill country. Under rule 4, this note recommends the whole face stay with `pamphylia` (the name AWMC itself gives it), with a note on `pamphylia`'s own pre-74 period recording that the drawn land likely also includes part of Galatia's Pisidia; this avoids inventing a line neither this note nor the GIS Engineer's data can source. `galatia`'s own face (f0028) is otherwise correct.

**Egypt and the Nabataean kingdom, including Sinai and Raphia's coast, resolved:** Livius's own account of the Nabataean kingdom's extent names Rhinocolura (Al-Arish) and Gaza among its towns in the west — Rhinocolura is the conventional edge of Egypt proper, so a source naming it as a Nabataean town places Nabataean reach west to Egypt's own frontier, supporting Sinai (between the two) as Nabataean rather than Egyptian territory. Paul's own "Mount Sinai... in Arabia" (`scripture:Galatians 4:25`) is consistent with this, though it alone does not settle a political border. `arabia`'s rebuild (the AD 200 extent minus the AD 69 outside-extent near Petra) should extend to include Sinai; `egypt`'s own AD 69 face should not. **RL3 (M4-03's re-verification):** the same source rules the AD 69 face between Rhinocolura and Gaza (1,814 km²): since Livius names both towns as Nabataean, this coastal strip belongs with `arabia`, not `judea-samaria-idumea` or `egypt`. Josephus separately records that the Roman governor Gabinius rebuilt Raphia, within this strip, alongside Gaza and other towns (*Antiquities* 14.5.3), but as one of many cities he rebuilt across a wide area under his own governorship of Syria; this does not settle Raphia's later administrative side, so this note relies on the Nabataean-towns statement instead.

**Abilene, resolved:** Abilene lies outside AWMC's Herod's-kingdom outline (it was never part of Herod's own realm, unlike Philip's tetrarchy), and no source this note opened describes its own edges (§2.4, §2.24 #4). Its land falls within `syria`, the same neighbour Chalcis's and Emesa's land falls within, since Abila sits on the Damascus road, in Syria's own geographic sphere (§2.25's rule-4 list, above).

**Herod's lands (`judea-samaria-idumea`, `galilee-perea`, `philip-tetrarchy-lands`), not yet built:** AWMC's AD 14 and AD 69 "Judaea" face is one coarse polygon covering Galilee, Samaria and Judea alike, so these three areas must come from Herod's own detailed kingdom outline, cut by the lines below (§2.24 now carries each with coordinates):

| Cut | Anchors (name, coordinates, source) |
|---|---|
| Galilee / Samaria (§2.24 #1) | West: Mount Carmel (`wikidata:Q185318`, 35.0233°E 32.6725°N) and Ptolemais/Acre (`wikidata:Q126084`, 35.0839°E 32.9261°N). Middle: Ginea, probably identified with modern Jenin (`wikidata:Q374748`, 35.3°E 32.4611°N; `pleiades:678163`) — `bib:isbe-en-gannim` ("it probably corresponds to the Ginnea of Josephus ..., and may certainly be identified with the modern Jenin") (`bib:josephus-jewish-war` 3.3.1, 3.3.4, names "Ginea" without itself identifying it with any modern place). East: Scythopolis (`pleiades:678378`) and the Jordan (`pleiades:687932`). |
| Perea's northern edge at Pella (§2.24 #2a) | Pella (`pleiades:678326`, `wikidata:Q167993`, 35.6167°E 32.45°N), on the Jordan; the line runs east from there toward Philadelphia's own territory (`pleiades:697728`, modern Amman, `wikidata:Q3805`, 35.9333°E 31.95°N), per Josephus's "breadth from Philadelphia to Jordan" (`bib:josephus-jewish-war` 3.3.3). No midpoint is named. |
| Philip's lands' southern edge (§2.24 #3b) | **Resolved as rule 2:** the Yarmuk (`pleiades:678183`) is Gaulanitis's own southern boundary, per ISBE's "Golan; Gaulonitis" entry (`bib:isbe-golan`). Gadara, south of the Yarmuk, is Decapolis land held by Syria throughout this window, so its own small territory falls within `syria`; Hippos, north of the Yarmuk, stays within `philip-tetrarchy-lands` under rule 4. |

**The rest of the Roman world (ADR-0037, "the rest of the Roman world, islands and the empire's edge"):** M4-03's shapes otherwise leave Africa, Sardinia, Moesia, Pannonia, Gaul and Spain blank, which would wrongly show them as outside Rome's rule. Added a new area, `other-roman-lands` (one period, 4 BC–AD 100, no internal borders), held by a new entity `roman-empire` (kind `roman-province`, `locationId: "roman-empire"`, so its map label comes from the Roman Empire record). Its shape is AWMC's AD 69 extent less the other 23 areas, leaving out Britain (conquered from AD 43). The Roman historian Cassius Dio lists Africa, Sardinia, "the Dalmatian and Macedonian districts," Spain and "all the Gauls" among the provinces of Augustus's 27 BC settlement (`bib:cassius-dio-roman-history`, 53.12), confirming these lands were Roman from the start of this note's own window. No current place record lies in this land, so no `politicalAreaId` needed updating.

**Islands (ADR-0037 item 2): an island joins an area only where a cited source places it there; otherwise it is part of `other-roman-lands`.** M4-03 found 21 unassigned islands inside AWMC's extent. Checked against Smith's *Dictionary of Greek and Roman Geography* (Perseus), time-boxed:

| Island | Area | Citation |
|---|---|---|
| Euboea | `achaia` | Smith: "Under the Romans, Euboea was included in the province of Achaia." |
| Brattia (Brač) | `illyricum` | Smith: "an island off the Dalmatian coast of Illyricum." |
| Curicta (Krk) | `illyricum` | Smith (citing Pliny, *NH* 3.21): "an island off the coast of Illyricum." |
| Lesbos, Samos, Cos | `asia` | ISBE "Asia": the province included "apparently the islands of Lesbos, Samos, Patmos, Cos and others near the Asia Minor coast" (Patmos is already in `asia`, following the existing record). |
| Chios | `asia` | Covered by ISBE "Asia"'s "and others near the Asia Minor coast" (above); Chios sits just off the coast near Erythrae, among the islands ISBE's list does not name individually. |
| Rhodes | `asia` | ISBE "Rhodes": "Later it was made a part of the Roman province of Asia (44 AD)." |

**Researched, but correctly left unassigned — explicitly free, not part of a province, in the first century:**
- **Corcyra:** Smith, citing Pliny (*NH* 4.12): "The Romans made the capital a free state."
- **Samothrace:** Smith, citing Pliny: "In Pliny's time Samothrace was a free state." (A later Byzantine source groups it with Thasos in "the province of Illyricum," but that is a 6th-century reorganization, not this note's period.)
- **Thasos:** Smith: it "received its freedom from the Romans after the battle of Cynoscephalae, B.C. 197... and continued to be a free (*libera*) town in the time of Pliny."

**Checked, no first-century provincial statement found within the time available — left unassigned:** Cephallenia, Zacynthus, Leucas (all near Euboea and Corcyra, but Smith's own entries for them describe only earlier, Hellenistic-period history); Cythera (Augustus gave it as private property to Eurycles, a Spartan client dynast — a personal grant, not a provincial placement, per Strabo 8.363 as quoted by Smith); Lemnos, Imbros, Scyros (Athenian possessions under Roman oversight, per Smith, not stated to be inside a province); Naxos, Paros, Ceos, Icaria (no Roman-period administrative statement found in Smith); Andros (transferred to the Attalid kings in 200 BC per Smith, with no later, first-century restatement found); Tenos and Carpathos (both given by Mark Antony to Rhodes in the first century BC, per Smith; Rhodes's own later, first-century-AD status is itself unsettled — ISBE "Rhodes" dates its absorption into the province of Asia to AD 44, while Suetonius, *Vespasian* 8.4, lists Rhodes among the places that lost their freedom only under Vespasian, decades later — and no source found says whether Tenos and Carpathos followed Rhodes's own provincial status or kept a separate one); Crexa (Cres) (Smith's entry could not be retrieved; the source's server returned repeated errors).

**RL6 (Mljet/Illyrian Melita), left unruled:** Smith's Dictionary mentions "the Melita on the E. coast of the Adriatic (now Meleda [Mljet])" only to argue against it as the site of Paul's shipwreck, favoring Sicilian Malta instead; it gives no statement of the Illyrian Melita's own province. No source placing it in Illyricum was found within the time available, so it is not added to the table, and `malta`'s candidates are not split.

**Karaburun, the Acroceraunian promontory (RL5), ruled `achaia`:** Smith's Dictionary defines Epirus itself as "the country... extending from the Acroceraunian promontory and the boundaries of Illyria and Macedonia on the north to the Ambracian gulf on the south" — the promontory is Epirus's own northern tip, not Illyria's or Macedonia's. Cassius Dio lists "Greece with Epirus" as one province in Augustus's 27 BC settlement (already this note's source for Nicopolis, also in Epirus, joining `achaia`); on the same basis, Karaburun belongs with `achaia`. (Smith separately notes that "in the time of Ptolemy," Epirus was its own province, divided from Achaia by the river Achelous in the south — a later, 2nd-century arrangement, after this note's own AD 100 window, and in any case about Epirus's southern edge, not the Acroceraunian promontory in the north.)

**Empire's edge:** one line where `other-roman-lands`' own shape meets land outside the empire, from AWMC's AD 69 extent and today's coastline; it does not change across the stops, since every area is on Rome's side throughout this window (ADR-0037).

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
| `commagene-kingdom` | Kingdom of Commagene | Client kingdom | Mithridates (from 20 BC), then Antiochus (to 17); Antiochus IV (38-39, 41-72; also holds Cilicia Tracheia's coastal part, §2.10, over the same span) | — | `bib:cassius-dio-roman-history` (54.9.3, 59.8.2); `bib:tacitus-annals` (2.42); `bib:josephus-jewish-war` (7.7) | None |
| `aristobulus-chalcis` | Aristobulus, king of Chalcis | Client kingdom | Aristobulus (by 72; start year not found) | — | `bib:josephus-jewish-war` (7.7.1) | None |
| `polemon-pontus` | Kingdom of Pontus (Polemon) | Client kingdom | Polemon I, then descendants ending with Polemon II (-36 to 64) | — | (existing `pontus.json`); `bib:isbe-galatia` | `pontus` — **removed from `data/timeline.json`'s entities at §2.25's correction; `pontus` keeps a hand-written history instead (not an area's holder)** |
| `galatia-province` | Roman province of Galatia | Province | Roman governors (-25 to 100, continuing); holds `galatia` from -25, `pisidia` and `lycaonia` (west) from -25, `paphlagonia` from -6, `pontus-galaticus` from -2, `pontus` from 64 | — | `bib:isbe-galatia`; existing `galatia.json` | `galatia` (for the core area only; also the holder of several other areas, §2.12) |
| `lycia-province` | Roman province of Lycia | Province | Roman governors (43 to 74) | — | (existing `pamphylia.json` note); `bib:cassius-dio-roman-history` (60.17.3–4) | None |
| `lycia-pamphylia-province` | Roman province of Lycia and Pamphylia | Province | Roman governors (74 to 100, continuing); holds `lycia` and `pamphylia` | — | (existing `galatia.json`/`pisidia.json`/`pamphylia.json`) | None |
| `thrace-kingdom` | Kingdom of Thrace | Client kingdom | Rhoemetalces, then Rhescuporis and Cotys, then (from AD 19) Rhoemetalces II and the sons of Cotys, then (from 38) Rhoemetalces II alone (to 46, when Thrace becomes a province, §2.14) | — | `bib:tacitus-annals` (2.64, 2.67); `bib:smith-dictionary-thracia` | None |
| `nabataean-kingdom` | Nabataean kingdom ("Arabia") | Client kingdom | Aretas IV (-9 to 40), Malichus II (40-71), Rabbel II (71-106) | `scripture:2 Corinthians 11:32,Galatians 1:17` | `bib:livius-nabataeans` | `arabia` |
| `roman-empire` | Roman Empire | Province | Holds `other-roman-lands` throughout (4 BC-AD 100) | — | `bib:cassius-dio-roman-history` (53.12) | `roman-empire` |

## 4. Stops

**Superseded by the data (2026-10-08):** `data/timeline.json` now has 15 stops (AD 67 and AD 79 were added under the PO's decision P3, ADR-0037), and their titles and summaries were rewritten after the Fact-Checker's review (`docs/verification/M4-timeline.md`). The data is canonical; the table below is the phase-1 proposal, kept for the record.

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
| 53 | Agrippa II trades Chalcis for the northern tetrarchy | Claudius, in the twelfth year of his reign, takes Chalcis back from the younger Agrippa (Agrippa I's son, ruling Chalcis since 50) and gives him Philip's former tetrarchy and Abilene instead, with the title of king. Within the next few years, Nero enlarges this grant with parts of Galilee (Tiberias and Tarichaeae) and Perea (Julias and fourteen villages), while the rest of both regions stays under the Roman procurators; Josephus dates this to Nero's first year (54), but the Jewish Encyclopedia reads Agrippa II's own coinage as pointing to 61 for this specific addition instead. Neither of these towns is drawable land of its own (ADR-0037 item 3), so this does not move the map's borders; it is recorded on the towns themselves, not as its own stop. | `bib:josephus-antiquities` (20.7.1, the Chalcis exchange; 20.8.4, "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichae... Julias, a city of Perea, with fourteen villages"); `bib:jewish-encyclopedia-agrippa-ii` (the 61 reading) |
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
| Iconium | Claudiconium | The emperor Claudius "conferred on it the title Claudiconium, which appears on coins of the city and on inscriptions"; ISBE notes this was formerly, but wrongly, taken as proof of colonial rank, which Hadrian granted later | `bib:isbe-iconium` |
| Derbe | Claudio-Derbe | One of the Lycaonian cities "honored with the title 'Claudian' by the emperor Claudius; its coins bear the legend 'Claudio-Derbe'" | `bib:isbe-derbe` |
| Philadelphia (Lydia) | Neo-kaisaria, then Flavia | ISBE: "a third name which it bore during the 1st century AD was Neo-kaisaria; it appears upon the coins struck during that period. During the reign of Vespasian, it was called Flavia." | `bib:isbe-philadelphia-lydia` |

**Note on Julia/Julias.** Whiston's translation gives two different reasons for the same name in the same passage (Antiquities 18.2.1): Betharamphtha is renamed "from the name of the emperor's wife," but Bethsaida "the same name with Caesar's daughter." Both are usually read as honoring the same woman, Livia: Augustus's will "appointed as his chief heirs Tiberius... and Livia... these he also bade assume his name," so that she became Julia Augusta (`bib:suetonius-twelve-caesars`, *Augustus*, read for this update). This note does not resolve why Josephus's own (or Whiston's) wording differs between "wife" and "daughter" for the same woman. **Bethsaida's and the Perea Julias's names are identical but the towns are different** — a known source of confusion this note flags for anyone drawing or labeling either site; both are described in this table, not as entities in §3, since a renamed town is not a holder.

## 6. Places

Every current place record's area, grouped (89 places; none needs reassignment — see notes).

| Area | Places (current parent) | Consistent? |
|---|---|---|
| `judea` | bethany, bethlehem, emmaus, jericho, jerusalem (+ jerusalem's own sub-sites: gethsemane, golgotha, mount-of-olives, pool-of-bethesda, pool-of-siloam, temple-mount) | Consistent — all sit within the merged area `judea-samaria-idumea` (§2.1) throughout 4 BC – AD 100, under whichever entity held it. |
| `judea-province` | bethany-beyond-the-jordan, bethsaida, caesarea-maritima, caesarea-philippi, joppa, galilee, judea, samaria | Consistent for "about AD 50" (the project's snapshot date), which falls in the 44–53 window when the procurators (the entity `roman-province-judea`, §3) governed Philip's former tetrarchy too (§2.3) alongside `judea-samaria-idumea` and `galilee-perea`. From 53, bethsaida and caesarea-philippi fall under Agrippa II's kingdom instead (§2.3); this does not change their *parent area* (still the smallest area containing them), only that area's own holder at a later date, already captured in §2.3's table. |
| `galilee` | cana, capernaum, chorazin, magdala, nain, nazareth, sea-of-galilee | Consistent — all sit within the merged area `galilee-perea` (§2.2). `sea-of-galilee`'s parent is a deliberate, already-sourced exception (M3-11): the lake spans the Galilee/Gaulanitis boundary, and no smaller area contains all of it. `magdala`'s own record identifies it with Taricheae (also given in its `otherLanguages`); Nero gave Taricheae, with Tiberias, to Agrippa II (`bib:josephus-antiquities`, 20.8.4, "a certain part of Galilee, Tiberias, and Tarichae"), dated to AD 54 by Josephus or AD 61 by the Jewish Encyclopedia's reading of Agrippa II's coinage (`bib:jewish-encyclopedia-agrippa-ii`); this needs a place-level override from that year, since the rest of Galilee stayed under the procurators. |
| `samaria` | sychar | Consistent — sits within the merged area `judea-samaria-idumea` (§2.1). |
| `syria` | antioch-syria, damascus, tarsus, tyre | Consistent (§2.8); tarsus is in the Cilician plain, administered from Syria throughout, though ISBE records it as a free city (*civitas libera et immunis*) from Antony's grant, confirmed by Augustus in 31 BC (`bib:isbe-tarsus`) — a place-level override, not a different area. `damascus` is also, by some ancient counts, a city of the Decapolis (§2.7) — a holder note on this place, not a different area; its ordinary parent stays `syria`. Its own political history also needs a place-level note for the debated Aretas years (2 Corinthians 11:32; §2.6), shown as `uncertain` for about 37–40 rather than choosing. |
| `galatia` | antioch-pisidia, iconium, lycaonia (derbe, lystra), pamphylia (perga), pisidia | Consistent, including the already-sourced placement of Antioch and Iconium directly under Galatia rather than under Pisidia or Phrygia (existing records' own notes), and Perga under Pamphylia despite Pamphylia's own status being modeled as `uncertain` before 74 (§2.12). From 74, Pamphylia's (and so Perga's) holder is "Lycia and Pamphylia," not Galatia (§4, §5.1) — a later data task should update this once M4-01's schema is in place. |
| `asia` | colossae, ephesus, hierapolis, laodicea, miletus, mysia, patmos, pergamum, philadelphia-lydia, sardis, smyrna, thyatira, troas | Consistent (§2.16). |
| `achaia` | athens, corinth (cenchreae), nicopolis | Consistent; cenchreae's parent is the city of Corinth (it is Corinth's port), not Achaia directly — a city-level nesting, not an area exception. |
| `macedonia` | berea, neapolis-macedonia, philippi, thessalonica | Consistent (§2.15). `thessalonica` was itself a free city from 42 BC, after backing Antony and Octavian at Philippi (`bib:isbe-thessalonica`, citing Pliny, *Natural History* 4.36) — a place-level override, not a different area. |
| `cyprus` | paphos, salamis-cyprus | Consistent (§2.17). |
| `crete-cyrene` | crete, libya | Consistent (§2.18). |
| `italy` | puteoli, rome | Consistent. |
| `sicily` | malta | Consistent (existing record's own sourced note). |
| `parthian-empire` | media, mesopotamia | Consistent (§2.22). |
| `roman-empire` (direct) | achaia, arabia, asia, bithynia, cappadocia, cilicia, crete-cyrene, cyprus, egypt, galatia, illyricum, italy, judea-province, macedonia, phrygia, pontus, sicily, syria | Consistent — every province/region sits directly under the empire, per ADR-0027. |

Of the towns Nero gave Agrippa II (Tiberias, Taricheae, the Perea Julias), only Taricheae is a current place record, as `magdala` (see the Galilee row above and its place-level override); no Decapolis city besides Damascus is a place record (§2.2, §2.7).

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
14. **Resolved and moot: Syria's AD 200 Coele/Phoenice split is no longer used.** M4-03 switched to AD 69/AD 14 faces (§2.25), which predate that later Severan-era split; Syria's own build now uses a rule-3 AD 200 Cilicia/Syria line only for the Cilicia edge specifically, not a Coele/Phoenice division.
15. **Resolved: Crete and Cyrenaica were still one administrative unit at AD 69** (§2.25), which is what this note's own window needs; Illyricum's AD 69 face is Dalmatia only, matching this note's own existing text (`bib:isbe-illyricum`). Both confirmed by the GIS Engineer's actual AWMC faces.
16. **Resolved and moot: Lycaonia/Isauria joining Cilicia's administration is a post-AD-100, pre-Diocletian development** (§2.25), after M4-03 switched away from the AD 200 line that had raised this question; at AD 69/AD 14, Lycaonia (part of Galatia throughout this note's window) is not yet part of Cilicia, so no cut is needed here.
17. **Pisidia/Pamphylia, inside one AD 14 face (§2.25):** a judgment call, not a sourced line — this note recommends the whole face stay with `pamphylia`, flagged accordingly.
18. **Resolved: the Yarmuk is Gaulanitis's sourced southern boundary** (`bib:isbe-golan`, §2.24 #3b, §2.25), so Gadara's land falls within `syria` and Hippos's within `philip-tetrarchy-lands` under rule 4 — not the earlier, unsourced "both within `galilee-perea`" judgment call. ISBE describes the boundary "today" rather than explicitly in the first century, so treat this as reasonably confident, not certain.
19. **Resolved: Sinai belongs with Arabia, not Egypt** (§2.25), on Livius's statement that the Nabataean kingdom's own towns reached Rhinocolura and Gaza, Egypt's conventional edge (`bib:livius-nabataeans`), with Paul's "Mount Sinai... in Arabia" (Galatians 4:25) as consistent, corroborating support.

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
- `bib:isbe-en-gannim` — "En-gannim," International Standard Bible Encyclopedia (1915), by W. Ewing, opened directly at internationalstandardbible.com, confirming Josephus's "Ginnea" (§2.24 #1) "may certainly be identified with the modern Jenin."
- `bib:isbe-golan` — "Golan; Gaulonitis," International Standard Bible Encyclopedia (1915), by W. Ewing, opened directly at internationalstandardbible.com, giving the Yarmuk as Gaulanitis's southern boundary (§2.24 #3b).

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
- `bib:cassius-dio-roman-history`, `bib:tacitus-annals`: re-opened to confirm the existing `nicopolis.json` citations for Nicopolis/Epirus inside Achaia (§2.25), rather than asserting it freshly.
- `bib:isbe-illyricum`, `bib:isbe-asia`: re-opened to confirm the existing "narrower sense... Dalmatia" and "Patmos and other islands" statements already cited on `illyricum.json` and `asia.json` (§2.25).
- `bib:livius-nabataeans`: re-opened again, this time for its statement that the Nabataean kingdom's own towns reached "Rhinocolura (Al-Arish) and Gaza" in the west (§2.25's Sinai ruling), not just its reign years (used earlier, §2.6).
- **Wikidata**, queried directly through its API (not Pleiades' own site, which blocks automated page fetches — `docs/research/SOURCES.md`'s known issue) for the Pleiades ids given in §2.24's border table, each cross-checked against the place named in the primary source, including five new coordinate points for §2.25's anchors: Mount Carmel, Ptolemais/Acre, Jenin (Ginea/En-gannim), Pella and Philadelphia/Amman.

### WEB verses quoted or cited
Pulled from `data/reference/engwebp_vpl.txt` (the project's own snapshot): Matthew 2:22; Mark 3:8; Luke 1:5; Luke 2:1–2; Luke 3:1; Luke 23:6–7; Acts 2:9; Acts 12:1,12:19–23; Acts 18:12; Acts 25:1,25:13,25:23; Acts 26:2,26:32; Galatians 1:17,1:21; Galatians 4:25 (read for §2.25's Sinai ruling); 2 Corinthians 11:32; 1 Peter 1:1.

Run `npm run validate:data` after adding the bibliography entries above (done; see commit).
