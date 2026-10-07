# M4 research note — first-century political changes, 4 BC – AD 100

Research for card `docs/tasks/M4-02-timeline.md`, phase 1. This note is the Research Lead's input to M4-01's data model; it does not depend on that model and adds no data files. Phase 2 (after the PO merges M4-01's schema) encodes this note as data.

## 1. How to read this note

- **Years** are integers; BC years are negative; there is no year 0 (so 1 BC is `-1` and AD 1 is `1`). For a period, `toYear` is the year the change happened, matching the convention already used in `politicalHistory` (for example `-4` to `6`, then `6` to `41`).
- **Areas** (§2) are units that changed hands together, at the detail the sources support, and that the sources describe well enough to draw as land (ADR-0037 item 3). Some match an existing `data/locations/*.json` area record; some do not yet have one (noted in each heading, and listed again in §7). A unit without a drawable territory of its own — a free city, the cities of the Decapolis, or a town another ruler received without its surrounding land — is recorded as a holder of its place instead (§6), not as an area; §2.7 explains this for the Decapolis. Where this note is unsure an area's extent is well enough attested to draw on its own, it says so, so M4-03 can merge that area into a neighbour.
- **Entities** (§3) are the political bodies that held one or more areas (a kingdom, a tetrarchy, a province under a given status, and so on), so the areas' period tables can point to one short entity id instead of repeating a long description.
- **Stops** (§4) are the subset of period boundaries that change the map, under ADR-0037 item 1. A stop can be a border, a ruler or a status change (as the brief's four examples all are), or a change in the name the map shows for an area or entity; §5 lists every name change found, including the few that are stops.
- **Places** (§6) lists every current location record's area and whether it is consistent with this note or an explained exception.
- Sources already cited in the project's existing, Fact-Checker-verified records (mainly the M2 batch-1 places, which cite `bib:rainey-notley-sacred-bridge`, the Rainey & Notley atlas no one on the team could open — CP3b decision 2) are carried forward as the prior baseline where this note does not change them. Every **new** claim in this note cites a source opened for this task; see §9 for the list of newly opened or newly added sources. CP3b decision 2 applies here too: this note replaces `bib:rainey-notley-sacred-bridge` wherever it touches a period this note documents, and flags the rest for the next time that text is edited.
- **Josephus citations** use the book and chapter numbers of Whiston's translation as published at `ccel.org` (the edition opened for this note), each with a short description, because that edition does not print the Niese section numbers (e.g. "18.106") that secondary works often cite. Readers using a Niese-numbered edition should search by the quoted detail, not the chapter number alone.

## 2. Areas and their periods

### 2.1 Judea (district), the Province of Judea, Samaria and Idumea

These moved together for the whole period: one ethnarchy (4 BC), then one province (from AD 6), under the procurators again after AD 44. `judea` and `judea-province` already exist as separate records for the district and the province (CP3b, "The Judea model"); `samaria` exists; **Idumea has no record yet.**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -37 | -4 | Client kingdom | Herod the Great | `bib:rainey-notley-sacred-bridge` (existing) | |
| -4 | 6 | Ethnarchy of Judea, Samaria and Idumea | Herod Archelaus | `bib:josephus-antiquities` (17.8, Herod's will; 17.11.4, Augustus's division); `scripture:Matthew 2:22` | Augustus did not grant Archelaus the royal title his father's will asked for, only "ethnarch," with kingship promised later if he ruled well (`bib:josephus-antiquities` 17.11.4). |
| 6 | 41 | Roman province (prefects) | Augustus's and Tiberius's prefects, e.g. Pontius Pilate (`scripture:Luke 3:1`) | `bib:josephus-antiquities` (17.13.1–2, Archelaus banished; 18.1, Quirinius's census and Coponius); `bib:josephus-jewish-war` (2.7.3–2.8.1); `scripture:Luke 2:1-2` | The governors of 6–41 are called "prefect" on the Pilate inscription found at Caesarea in 1961; Josephus (Whiston's translation) calls them "procurator" throughout, the same word he uses after 44. This note uses "prefect" for 6–41 and "procurator" for 44 on, following the inscription, and flags the difference for the Fact-Checker. **Luke's census (Luke 2:1–2) is dated to this same Quirinius, but to the time of Herod's birth narrative, years before Herod's death in 4 BC; Josephus dates Quirinius's census to AD 6, after Herod's death.** This note does not resolve the question; see §4 (stop at 6) and the entity `quirinius`. |
| 41 | 44 | Client kingdom, reunified | Herod Agrippa I | `bib:josephus-antiquities` (19.5.1, Claudius adds Judea and Samaria "as due to his family"); `scripture:Acts 12:1,12:19-23` | |
| 44 | 70 | Roman province (procurators) | e.g. Antonius Felix, Porcius Festus (`scripture:Acts 23-26`) | `bib:josephus-antiquities` (19.9.2, Fadus sent "to be procurator of Judea, and of the entire kingdom"); `scripture:Acts 25:1,25:23` | |
| 70 | 100 | Roman province, now with a legion based at Jerusalem; no further border change found to AD 100 | Legates in place of procurators | `bib:josephus-jewish-war` (7, the war's end); general historical consensus | This is an administrative upgrade (a praetorian legate instead of a procurator), not a border or name change, so it is not treated as a stop (ADR-0037 item 1's example). The existing `judea-province.json` record's table currently ends its last entry at 70 ("procuratorial rule"); no source found for a further change before 100, so phase 2 should continue this row to 100 rather than leave a gap. |

**Idumea** (no record; `scripture:Mark 3:8` names it, WEB: "from Jerusalem, from Idumaea, beyond the Jordan..."): held exactly as Judea/Samaria above (part of Archelaus's ethnarchy, then the province) — `bib:josephus-antiquities` 17.11.4 ("Idumea, and Judea... paid tribute to Archelaus"). Aristobulus's earlier annexation of part of Idumea to the Hasmonean state (140 BC) is Old Testament-period background, not part of this window.

**Samaria:** same table as Judea above. Its current record's `politicalHistory` is empty; phase 2 should give it the same table.

### 2.2 Galilee and Perea

Moved together under Antipas, then Agrippa I, then the province — with one later exception (Nero's grant, §2.2 note and §6). `galilee` exists; **Perea has no record yet.**

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -37 | -4 | Client kingdom | Herod the Great | `bib:rainey-notley-sacred-bridge` (existing) | |
| -4 | 39 | Tetrarchy | Herod Antipas | `bib:josephus-antiquities` (17.8, the will; 17.11.4, "to him it was that Perea and Galilee paid their tribute"); `scripture:Luke 3:1,23:6-7` | Antipas is "Herod the tetrarch" in the Gospels; the Gospels never use "Antipas." |
| 39 | 44 | Client kingdom (added to Agrippa I's) | Herod Agrippa I | `bib:josephus-antiquities` (18.7.2, Caligula "took away from him his tetrarchy, and gave it... to Agrippa") | Antipas was banished after his wife Herodias pressed him to seek the royal title Caligula had just given her brother Agrippa I. Antiquities (18.7.2) places the banishment at Lugdunum (Lyon) in Gaul; the Jewish War (2.9, "he was punished for his ambition, by being banished into Spain") names Spain instead. Both are Josephus's own words; this note does not resolve the discrepancy. |
| 44 | 54 (or 61) | Roman province (procurators) | | `bib:josephus-antiquities` (19.9.2) | |
| 54 (or 61) | 100 | Mostly the province; **Tiberias and Tarichaeae (Galilee) and Julias-in-Perea with 14 villages** pass to Agrippa I's kingdom instead | Herod Agrippa II | `bib:josephus-antiquities` (20.8.4, "Caesar also bestowed on Agrippa a certain part of Galilee, Tiberias, and Tarichaeae... He gave him also Julias, a city of Perea, with fourteen villages"); on the year, `bib:jewish-encyclopedia-agrippa-ii` | Josephus dates this grant to "the first year of the reign of Nero" (AD 54). The Jewish Encyclopedia notes Agrippa II's coins carry two era-starting years, 53 and 61, and reads the second as this grant's real date, from numismatic evidence Josephus's narrative does not mention. This note presents both; see the stop at §4. No current place record is Tiberias, Tarichaeae, or the Perea Julias (not Bethsaida's Julias — see the entity `julias-perea`), so no place needs reassignment either way (§6). |

**Perea** (no record; e.g. `scripture:Matthew 19:1`, "the borders of Judea beyond the Jordan"; John 10:40): same table as Galilee, substituting "Julias in Perea with 14 villages" for "Tiberias and Tarichaeae" at the last row.

### 2.3 Gaulanitis, Batanea, Trachonitis and Auranitis (Philip's former tetrarchy)

These four districts, which the sources never clearly separate from one another by border, moved together for the whole period. **No area record yet covers them as a group**; `caesarea-philippi` and `bethsaida` (both existing place records) sit here. Proposed area id: `gaulanitis` (an anchor name only; M4-03 may prefer separate shapes per district if the geometry supports it).

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -20 | -4 | Added to Herod the Great's kingdom (the "House of Zenodorus") | Herod the Great | `bib:isbe-ituraea` (Augustus "bestowed on Herod, 20 BC") | |
| -4 | 34 | Tetrarchy | Herod Philip | `bib:josephus-antiquities` (17.8, "Gaulonitis, and Trachonitis, and Paneas" in Herod's will; 17.11.4, Augustus confirms "Batanea, and Trachonitis, as well as Auranitis... to Philip"; 18.4.6, Philip's death, "tetrarch of Trachonitis and Gaulanitis, and of the nation of the Bataneans... thirty-seven years") | **Josephus names the district components differently in each of these three passages** (adding or dropping Paneas/Auranitis each time); `scripture:Luke 3:1` adds a fourth name, "Ituraea," that Josephus never uses for Philip's realm. `bib:isbe-ituraea` discusses the overlap and concludes it is "not clear whether Luke intended to indicate two separate parts of the dominion of Philip, or used names which to some extent overlapped." This note does not resolve it. |
| 34 | 37 | Attached to the province of Syria (Philip died without an heir) | Governor of Syria | `bib:josephus-antiquities` (18.4.6); `bib:isbe-trachonitis` | |
| 37 | 44 | Client kingdom | Herod Agrippa I | `bib:josephus-antiquities` (18.6.10, Caligula "appointed him to be king of the tetrarchy of Philip") | |
| 44 | 53 | Roman province (procurators) | | `bib:josephus-antiquities` (19.9.2); `bib:isbe-trachonitis` ("administered by Roman officers" during Agrippa II's minority) | |
| 53 | ~92/93 or 100 | Client kingdom | Herod Agrippa II | `bib:josephus-antiquities` (20.7.1, "he bestowed upon Agrippa the tetrarchy of Philip and Batanea, and added thereto Trachonites, with Abila"); `bib:isbe-trachonitis` ("From 53 till 100 AD it was ruled by Agrippa II") | The existing `bethsaida.json` record's table ends this period at 70; no source found for a change in 70, and `bib:isbe-trachonitis` and `bib:jewish-encyclopedia-agrippa-ii` both describe Agrippa II's rule continuing after the war (he fought on the Roman side) to his death. Phase 2 should correct the end year here (see §4, stop at ~100, and §8). |
| ~92/93 or 100 | 106 | Added to the province of Syria | | `bib:isbe-abilene` ("his kingdom was incorporated in the province of Syria") | In 106 this area, with the Nabataean kingdom, became the new province of Arabia (`bib:isbe-trachonitis`; `bib:livius-nabataeans`) — after this note's AD 100 end point. |

### 2.4 Abilene

No current record (proposed id `abilene`). Its history runs with §2.3 from AD 37 on, but it has its own, separately-attested earlier history.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | -36/-35 | Part of the Iturean kingdom | Lysanias (I) | `bib:isbe-abilene`; `bib:isbe-ituraea` (Dio Cassius calls him "king of the Itureans") | This Lysanias was put to death by Mark Antony, c. 36/35 BC — before this note's window. |
| -35? | 37 | A separate tetrarchy, history obscure | "Lysanias the tetrarch" (`scripture:Luke 3:1`) | `bib:isbe-abilene` ("nothing further is known of the tetrarch Lysanias") | ISBE directly addresses the old objection that Luke 3:1's Lysanias must be the one killed in 36 BC: "the circumstances in which Abilene became [a] distinct tetrarchy are altogether obscure," implying a second, later ruler of the same name, attested by Josephus (`bib:josephus-antiquities` 19.5.1; 20.7.1) and a dedication inscription near Abila itself that ISBE describes. |
| 37 | 44 | Added to Agrippa I's kingdom | Herod Agrippa I | `bib:josephus-antiquities` (18.6.10, "the tetrarchy of Lysanias" given with Philip's); `bib:isbe-abilene` | Josephus's account of Claudius's settlement in 41 (`bib:josephus-antiquities` 19.5.1) also names "Abila of Lysanias" as something Claudius "bestowed... as out of his own territories" — unclear whether this records a fresh grant or a confirmation of Caligula's 37 grant. This note presents both. |
| 44 | 53 | Roman province (procurators) | | `bib:isbe-abilene` | |
| 53 | ~92/93 or 100 | Added to Agrippa II's kingdom | Herod Agrippa II | `bib:josephus-antiquities` (20.7.1, "Abila; which last had been the tetrarchy of Lysanias"); `bib:isbe-abilene` | |

### 2.5 Chalcis

No current record (proposed id `chalcis`); no map place sits here. Chalcis (in the Beqaa valley, capital of the old Iturean kingdom under Lysanias — `bib:isbe-ituraea`) became a small Herodian client kingdom distinct from Judea. **Doubt flag:** the sources this note opened describe Chalcis politically (who ruled it, and when) but not geographically — `bib:isbe-ituraea`'s "he ruled over the land from Damascus to the sea" describes the older, larger Iturean realm under the first Lysanias, not necessarily the smaller territory later kings of Chalcis held. If AWMC or another cited description does not give this smaller Chalcis its own boundary, M4-03 should merge it into a neighbouring area (Abilene or Syria are the most likely candidates) rather than guess at a shape.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| 41 | 48 | Client kingdom | Herod (of Chalcis), Agrippa I's brother | `bib:josephus-antiquities` (19.5.1, "begged for him of Claudius the kingdom of Chalcis"); `bib:jewish-encyclopedia-herod-ii` (gives his death as "48-49 C.E.") | |
| 48 | 50 | Unclear; no king named in the sources checked | | — | A gap this note could not source: Josephus does not say who, if anyone, held Chalcis between Herod's death and Agrippa II's appointment. Flagged for the Fact-Checker. |
| 50 | 53 | Client kingdom | Herod Agrippa II | `bib:jewish-encyclopedia-agrippa-ii` ("In the year 50... he had himself appointed... to the principality of Chalcis"); `bib:josephus-antiquities` (20.7.1, "he took from him Chalcis, when he had been governor thereof four years") | |
| 53 | 72+ | Client kingdom; holder after 53 unclear until 72 | By 72: Aristobulus (son of Herod of Chalcis) | `bib:josephus-jewish-war` (7.7.1, "Aristobulus, king of the country called Chalcidene," assists Rome against Commagene in AD 72) | Josephus does not say when Aristobulus became king of Chalcis, only that he held it by 72. The gap 53–72 is unsourced in what this note could open; flagged for the Fact-Checker. |

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
| -27 | 100 (no change found in this window) | Province kept by the emperor; governed from Antioch; administers the Cilician plain throughout; administered Philip's former tetrarchy 34–37 and 44–53 (§2.3) and briefly oversaw Commagene and "rough" Cilicia, AD 17–37 (§2.9) | Imperial legates | (existing); `bib:tacitus-annals` (2.42, naming Syria's and Judea's "burdens" in the same breath as Cappadocia's and Commagene's annexation) | |

**Coastal cities.** This note does not propose a single "coastal cities" area, because their status was not uniform:
- **Caesarea Maritima and Joppa** (both existing place records, parent `judea-province`): named among the cities "subject to" Archelaus's ethnarchy in 4 BC, alongside Jerusalem and Sebaste (`bib:josephus-antiquities` 17.11.4) — consistent with their current parent throughout.
- **Tyre** (existing place record, parent `syria`): a Phoenician city; Phoenicia was kept by the emperor together with Syria and Cilicia in 27 BC (existing `syria.json` history, Dio 53.12) — consistent with its current parent.
- **Gaza, Hippos and Gadara**: cut from Herod's kingdom in 4 BC and "added... to Syria" (`bib:josephus-antiquities` 17.11.4) — no place record yet for Gaza; Hippos and Gadara are also Decapolis cities (§2.7).
- **Ashkelon (Ascalon)**: Josephus notes Salome received "the royal palace of Ascalon" from Augustus, but the city itself is conventionally described as a free city outside Herodian rule throughout; this note could not open a source stating its status plainly and flags it for the Fact-Checker rather than asserting it.
- None of these is a current place record except Caesarea Maritima, Joppa and Tyre, all already correctly parented.

### 2.9 Commagene, and the "rough" (western) part of Cilicia

No current record for Commagene (proposed id `commagene`); the existing `cilicia` record already describes the plain/rough split and is extended here, not changed. **On drawing this:** Commagene's own, separately describable territory (centered on Samosata) is the proposed `commagene` area below; the "coastal part of... Cilicia" Antiochus IV also held (next table, rows 3–4) is not a separately drawable shape in any source this note opened, so it is better understood as the existing `cilicia` area (§2.10) having Commagene's king as its holder for that span, not as added Commagene territory. §2.10's table already carries it that way.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom (Commagene); a separate king also held at least part of "rough" Cilicia | Antiochus III (Commagene); Philopator (Cilicia) | `bib:tacitus-annals` (2.42, "the death of the two kings, Antiochus of Commagene and Philopator of Cilicia, disturbed the peace of their countries, where the majority of men desired a Roman governor, and the minority a monarch") | Tacitus does not say which side prevailed immediately; this note infers direct rule from Caligula's later "restoration" (next row), which implies the kingdom had lapsed. |
| 17 | 38 | Administered directly (probably attached to Syria) | Governor of Syria | `bib:tacitus-annals` (2.42); inference, flagged above | |
| 38 | 41 | Client kingdom restored; also given the coastal part of "rough" Cilicia | Antiochus IV | `bib:cassius-dio-roman-history` (59.8.2, Caligula "had given Antiochus, the son of Antiochus, the district of Commagene, which his father had held, and likewise the coast region of Cilicia") | |
| 41 | 72 | Client kingdom, continued (Josephus's wording of Claudius's 41 settlement is unclear whether this is a reduction or a restoration) | Antiochus IV | `bib:josephus-antiquities` (19.5.1, "he also took away from Antiochus that kingdom which he was possessed of, but gave him a certain part of Cilicia and Commagena") | |
| 72 | 100 (no change found in this window) | Annexed to the province of Syria | | `bib:josephus-jewish-war` (7.7.1–3, "in the fourth year of the reign of Vespasian," Caesennius Paetus, governor of Syria, deposes Antiochus IV on suspicion of conspiring with Parthia) | Cilicia (plain and rough together) was reunited as its own province the same year (existing `cilicia.json`, `bib:livius-cilicia`). |

### 2.10 Cilicia (the plain)

Matches the existing `cilicia` region record (parent `roman-empire`, not `syria`, by design — see its existing history text). No change proposed; this note only adds the primary-source confirmation.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -27 | 72 | The plain administered from Syria; the rough west under client kings (§2.9) | | (existing); `bib:cassius-dio-roman-history` (59.8.2) | |
| 72 | 100 (no change found) | Reunited as its own province | | (existing); `bib:livius-cilicia` | |

### 2.11 Cappadocia

Matches the existing `cappadocia` record (empty `politicalHistory`). This note adds the table.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 17 | Client kingdom | Archelaus | `bib:tacitus-annals` (2.42, "for fifty years King Archelaus had been in possession of Cappadocia"; Tiberius "lured Archelaus from Cappadocia," and "his kingdom was converted into a province") | |
| 17 | 100 (no change found) | Roman province | Quintus Veranius, first governor | (existing, citing `bib:isbe-cappadocia`); `bib:tacitus-annals` (2.42, the annexation) | |

### 2.12 Galatia, and the lands joined to it (Pisidia, Lycaonia, Pamphylia, Paphlagonia, parts of Pontus); Lycia

Matches the existing `galatia`, `pisidia`, `lycaonia`, `pamphylia` records (already have history text; `galatia` already has a two-row `politicalHistory`). This note adds the precise years for Paphlagonia and Pontus Galaticus, and treats Lycia separately since no current place sits there.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -25 | -6 | Roman province (Galatia, Pisidia, Lycaonia and Isauria only) | | (existing `galatia.json`) | |
| -6 | -2 | Paphlagonia added | | `bib:isbe-galatia` ("to it were added Paphlagonia 6 BC") | Both changes in this row and the next predate this note's 4 BC start by 2 years or fall just after it; neither moves a border near a current place, so neither is proposed as a stop (§4). |
| -2 | 74 | Part of Pontus ("Pontus Galaticus") added | | `bib:isbe-galatia` ("part of Pontus 2 BC") | |
| 74 | 137 | Most of Pisidia detached | | (existing `galatia.json`) | |

**Eastern Lycaonia** ("Lycaonia Antiochiana"): held by the king of Commagene (§2.9), not by Galatia, for at least part of this window. The existing `lycaonia.json` record gives 37–72; `bib:isbe-galatia` gives 41–72 for the same arrangement ("Part of Lycaonia was non-Roman and was governed by King Antiochus; from 41 to 72 AD Laranda belonged to this district"). This note presents both start years rather than resolving them; both plausibly track the Commagene dating uncertainty in §2.9.

**Pamphylia's province** at "about AD 50" is already presented as unresolved in the existing `pamphylia.json`/`perga.json` records (the Fact-Checker's M3-11 note calls the evidence "split"); this note does not revisit that finding.

**Lycia** (no record; no current place sits here): a free federation (the Lycian League) allied with Rome until Claudius made it a province in AD 43; later joined with Pamphylia under Vespasian. Already summarized with sources in the existing `pamphylia.json` note (citing `bib:cassius-dio-roman-history` 60.17.3–4 and `bib:livius-pamphylia`); this note does not re-derive it, and does not propose Lycia as a separate stop (§4) since it borders no current place.

### 2.13 Pontus (the eastern, Polemon kingdom) and Bithynia

Matches the existing `pontus` and `bithynia` records (both empty `politicalHistory`; `pontus.json`'s history text already describes the three-way division and Polemon's kingdom).

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| -74 | 100 (no change found) | Bithynia: Roman province throughout | | (existing `bithynia.json`, citing `bib:isbe-bithynia`) | |
| -36 | 64 | Eastern Pontus: client kingdom | Polemon I, then his descendants, ending with Polemon II | (existing `pontus.json`, citing `bib:isbe-pontus`); `bib:isbe-galatia` ("in 64 also Pontus Polemoniacus [added to Galatia]") | This note supplies the precise year (64) for Polemon II giving up the kingdom; the existing record only says "when Polemon gave it up." Not proposed as a stop (§4): it borders no current place. |
| 64 | 100 (no change found) | Added to the province of Galatia, as "Pontus Polemoniacus" | | `bib:isbe-galatia` | |

### 2.14 Thrace

No current record (proposed id `thrace`); no current place sits here, but the card's area list names it.

| From | To | Holder | Ruler | Sources | Notes |
|---|---|---|---|---|---|
| ? | 38 | Client kingdom | Rhoemetalces II ("the last native prince," installed by Caligula in 38) | `bib:smith-dictionary-thracia` | |
| 38 | 46 or 69–79 | Disputed — see note | | `bib:smith-dictionary-thracia` | Smith's Dictionary reports a genuine ancient disagreement: the Eusebian Chronicle dates Thrace's reduction to a province to AD 47, under Claudius, but Suetonius (`Vespasian` 8), Eutropius and Tacitus (`Histories` 1.11) date it to Vespasian's reign (69–79). The 19th-century editor suggests Rhoemetalces II may have died around 46/47, ending native rule in practice, while formal provincial status waited for Vespasian. This note presents both without resolving them, and does not propose Thrace as a stop (§4), both for this uncertainty and because it borders no current place. |
| by 79 | 100 (no change found) | Roman province | | `bib:smith-dictionary-thracia` | |

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
| Armenia (no record; proposed id `armenia`) | ? | 63 | Contested client kingdom; Roman and Parthian nominees alternate repeatedly | `bib:tacitus-annals` (books 2, 6, 11-15 cover individual reigns) | This note does not enumerate every brief claimant; see "left out" in §4. |
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
| 79 | 81 | Titus | general historical consensus | |
| 81 | 96 | Domitian | general historical consensus | |
| 96 | 98 | Nerva | general historical consensus | |
| 98 | 100 (continues past this note's end) | Trajan | general historical consensus | |

**The empire's outer edge, for context at each stop (not separate areas):**
- **Mauretania:** a client kingdom (Juba II, then Ptolemy) until Caligula had King Ptolemy put to death, c. AD 40 (`bib:cassius-dio-roman-history` 59.25, "Gaius sent for Ptolemy, the son of Juba, and... put him to death," followed by the editorial note "How the Mauretanian began to be governed by Romans"). Claudius organized it into two provinces after suppressing the revolt that followed. By AD 44 and after, the map's western edge should show two Roman provinces, not a client kingdom.
- **Britain:** outside the empire until Claudius's invasion, which Cassius Dio dates within his reign's early years (`bib:cassius-dio-roman-history` 60.19–21, Aulus Plautius's campaign and Claudius's own brief visit); conventionally dated AD 43. From the stop at 44 on, the map's far northwest edge should show a Roman province of growing extent (this note does not track its internal growth, which is outside the focus).

## 3. Entities

Deduplicated political bodies referenced in §2, for M4-01 to use as a lookup if its schema separates "who" from "where."

| id | English name | Kind | Rulers (years) | Passages | Sources | Matching location record |
|---|---|---|---|---|---|---|
| `herod-the-great` | Kingdom of Herod the Great | Client kingdom | Herod the Great (-37 to -4) | `scripture:Matthew 2:1,Luke 1:5` | `bib:josephus-antiquities` (17.8) | None (a ruler, not an area) |
| `archelaus-ethnarchy` | Ethnarchy of Herod Archelaus | Ethnarchy | Herod Archelaus (-4 to 6) | `scripture:Matthew 2:22` | `bib:josephus-antiquities` (17.11.4) | None |
| `antipas-tetrarchy` | Tetrarchy of Herod Antipas | Tetrarchy | Herod Antipas (-4 to 39) | `scripture:Luke 3:1,23:6-7,Mark 6:14-29` | `bib:josephus-antiquities` (17.8) | None |
| `philip-tetrarchy` | Tetrarchy of Herod Philip | Tetrarchy | Herod Philip (-4 to 34) | `scripture:Luke 3:1` | `bib:josephus-antiquities` (17.8, 18.4.6) | None |
| `lysanias-abilene` | Tetrarchy of Lysanias | Tetrarchy | "Lysanias the tetrarch" (? to 37) | `scripture:Luke 3:1` | `bib:isbe-abilene` | None |
| `judea-prefects` | Roman province of Judea (prefects) | Province | Prefects, e.g. Pontius Pilate (6 to 41) | `scripture:Luke 3:1` | `bib:josephus-antiquities` (18.1) | `judea-province` (for this period) |
| `agrippa-i-kingdom` | Kingdom of Herod Agrippa I | Client kingdom | Herod Agrippa I (37 to 44; Philip's tetrarchy and Abilene from 37, Galilee and Perea added 39, Judea and Samaria added 41) | `scripture:Acts 12:1-23` | `bib:josephus-antiquities` (18.6.10, 18.7.2, 19.5.1) | None |
| `herod-of-chalcis` | Kingdom of Herod (of Chalcis) | Client kingdom | Herod, brother of Agrippa I (41 to 48) | — | `bib:josephus-antiquities` (19.5.1); `bib:jewish-encyclopedia-herod-ii` | None |
| `judea-procurators` | Roman province of Judea (procurators) | Province | Procurators, e.g. Antonius Felix, Porcius Festus (44 to 100, continuing) | `scripture:Acts 23:24,25:1,25:23` | `bib:josephus-antiquities` (19.9.2) | `judea-province` (for this period) |
| `agrippa-ii-chalcis` | Agrippa II as king of Chalcis | Client kingdom | Herod Agrippa II (50 to 53) | — | `bib:josephus-antiquities` (20.7.1); `bib:jewish-encyclopedia-agrippa-ii` | None |
| `agrippa-ii-kingdom` | Kingdom of Herod Agrippa II | Client kingdom | Herod Agrippa II (53 to about 92/93 or 100; Galilee/Perea towns added 54 or 61) | `scripture:Acts 25:13,25:23,26:2,26:32` | `bib:josephus-antiquities` (20.7.1, 20.8.4); `bib:jewish-encyclopedia-agrippa-ii`; `bib:isbe-trachonitis` | None |
| `commagene-kingdom` | Kingdom of Commagene | Client kingdom | Antiochus III (to 17), direct rule (17-38), Antiochus IV (38-72) | — | `bib:tacitus-annals` (2.42); `bib:cassius-dio-roman-history` (59.8.2); `bib:josephus-antiquities` (19.5.1); `bib:josephus-jewish-war` (7.7) | None |
| `aristobulus-chalcis` | Aristobulus, king of Chalcis | Client kingdom | Aristobulus (by 72; start year not found) | — | `bib:josephus-jewish-war` (7.7.1) | None |
| `polemon-pontus` | Kingdom of Pontus (Polemon) | Client kingdom | Polemon I, then descendants ending with Polemon II (-36 to 64) | — | (existing `pontus.json`); `bib:isbe-galatia` | `pontus` |
| `thrace-kingdom` | Kingdom of Thrace | Client kingdom | Rhoemetalces II (to 38 or 46/47; dispute, see §2.14) | — | `bib:smith-dictionary-thracia` | None |
| `nabataean-kingdom` | Nabataean kingdom ("Arabia") | Client kingdom | Aretas IV (-9 to 40), Malichus II (40-71), Rabbel II (71-106) | `scripture:2 Corinthians 11:32,Galatians 1:17` | `bib:livius-nabataeans` | `arabia` |
| `quirinius` | Quirinius (Cyrenius), governor of Syria | Roman official | Quirinius (census in AD 6; governed Syria at an uncertain, possibly earlier, additional time — see §2.1) | `scripture:Luke 2:1-2` | `bib:josephus-antiquities` (18.1) | None |
| `julias-perea` | Julias (formerly Betharamphtha), Perea | Town, not an area | Renamed by Herod Antipas for the emperor's wife | — | `bib:isbe-peraea` | None (not Bethsaida's "Julias" in Gaulanitis — two different towns share the name) |

## 4. Stops

Thirteen stops. The brief's four (ADR-0037) are marked **(required)**.

| Year | Title | Summary | Sources |
|---|---|---|---|
| **-4 (required)** | Herod's kingdom is divided | Herod the Great dies. Augustus confirms his sons' claims but not as Herod willed them: Archelaus becomes ethnarch (not king) of Judea, Samaria and Idumea; Antipas becomes tetrarch of Galilee and Perea; Philip becomes tetrarch of Gaulanitis, Batanea, Trachonitis and Auranitis. Three Greek cities — Gaza, Gadara and Hippos — are cut away and added to the province of Syria. | `bib:josephus-antiquities` (17.8, 17.11.4); `scripture:Matthew 2:22` |
| **6 (required)** | Judea becomes a Roman province | Rome deposes Archelaus and turns his ethnarchy into a province under a prefect. Quirinius, governing Syria, conducts a census. Antipas's and Philip's territories are unaffected. | `bib:josephus-antiquities` (18.1); `scripture:Luke 2:1-2,3:1` |
| 17 | Cappadocia and Commagene come under direct Roman rule | King Archelaus of Cappadocia dies (or is deposed) after a 50-year reign, and his kingdom becomes a province. The same year, the kings of Commagene and of part of Cilicia also die, and Tacitus records that Rome and local opinion were divided over whether to install a new king or govern directly; this note follows the administration-by-Syria reading (§2.9). | `bib:tacitus-annals` (2.42) |
| 34 | Philip's tetrarchy is absorbed into Syria | Philip dies without an heir after 37 years. Rome does not appoint a successor tetrarch; his territory is attached to the province of Syria, though its own revenues stay earmarked for it. | `bib:josephus-antiquities` (18.4.6) |
| 37 | Caligula makes Agrippa I a king | The new emperor frees his friend Agrippa (Agrippa I, grandson of Herod the Great) from a Roman prison and makes him king over Philip's former tetrarchy and the neighboring tetrarchy of Abilene — the first time since Herod the Great that any of this land is ruled by a king rather than a tetrarch, prefect or governor. Separately, Caligula restores the kingdom of Commagene, with part of the Cilician coast, to Antiochus IV. | `bib:josephus-antiquities` (18.6.10); `bib:cassius-dio-roman-history` (59.8.2) |
| 39 | Antipas is banished; his tetrarchy joins Agrippa I's kingdom | Herodias presses her husband Antipas to seek the royal title Caligula gave her brother. Caligula instead banishes Antipas and gives Galilee and Perea to Agrippa I. | `bib:josephus-antiquities` (18.7.2) |
| **41 (required)** | Agrippa I's kingdom is made whole; new neighbors appear | The new emperor Claudius adds Judea and Samaria to Agrippa I's kingdom, restoring his grandfather Herod's full extent under one ruler for the only time in this period. At the same time Claudius makes Agrippa I's brother Herod king of the new client kingdom of Chalcis, and resolves Antiochus IV's position in Commagene and coastal Cilicia. | `bib:josephus-antiquities` (19.5.1); `scripture:Acts 12:1` |
| **44 (required)** | Agrippa I dies; direct Roman rule returns | Agrippa I dies at Caesarea (Acts 12 and Josephus both describe his sudden death). Rather than let his young son inherit, Claudius places the whole kingdom — Judea, Samaria, Galilee, Perea and Philip's former tetrarchy — under Roman procurators. | `bib:josephus-antiquities` (19.9.2); `scripture:Acts 12:20-23` |
| 53 | Agrippa II trades Chalcis for the northern tetrarchy | Claudius, in the twelfth year of his reign, takes Chalcis back from the younger Agrippa (Agrippa I's son, ruling Chalcis since 50) and gives him Philip's former tetrarchy and Abilene instead, with the title of king. | `bib:josephus-antiquities` (20.7.1) |
| 54 (some sources: 61) | Nero enlarges Agrippa II's kingdom in Galilee and Perea | Josephus dates this to Nero's first year: Agrippa II receives Tiberias and Tarichaeae in Galilee and Julias in Perea (with fourteen villages), while the rest of both regions stays under the Roman procurators. The Jewish Encyclopedia reads Agrippa II's own coinage as pointing to 61 for this specific grant instead. | `bib:josephus-antiquities` (20.8.4); `bib:jewish-encyclopedia-agrippa-ii` |
| **70 (required)** | Jerusalem falls | After four years of war, Titus's forces take Jerusalem and destroy the Second Temple, ending Jewish self-government in the province. Agrippa II, who had sided with Rome, keeps his own separate kingdom. | `bib:josephus-jewish-war` (7) |
| 72 | Commagene is annexed; Cilicia is reunited | Vespasian's governor of Syria accuses Antiochus IV of Commagene of plotting with Parthia and annexes his kingdom, including the Cilician coast he held. The same year, Cilicia (plain and rough together) becomes a single province again for the first time since Augustus. | `bib:josephus-jewish-war` (7.7); `bib:livius-cilicia` |
| 74 | Pamphylia leaves Galatia and is joined with Lycia | Vespasian detaches most of Pisidia from the province of Galatia and joins Pamphylia with the separately-administered region of Lycia to its south, forming one new province. Perga's own province changes name and neighbours, from "Galatia" to "Lycia and Pamphylia," even though Perga's own ground does not move. | (existing `galatia.json`, `pisidia.json`, `pamphylia.json`); `bib:cassius-dio-roman-history` (60.17.3–4, the Claudius-era background to the merger) |
| about 92/93 or 100 | Agrippa II dies; his kingdom joins Syria | The last Herodian ruler dies — older reference works, following the Byzantine scholar Photius's citation of a lost history, give AD 100 (a date those same works call disputed); this note could not open a source for the earlier date some modern historians propose and flags this for the Fact-Checker (§8). His kingdom (Gaulanitis, Batanea, Trachonitis, Auranitis and Abilene) is added to the province of Syria. | `bib:jewish-encyclopedia-agrippa-ii`; `bib:isbe-abilene` |

**Changes considered and left out, with reasons:**
- **Achaia's and Macedonia's Senate↔emperor transfers (AD 15, 44) and Nero's grant of freedom to Greece (67, reversed by Vespasian):** explicitly not stops under ADR-0037 item 1's own example (no border moves); kept in those areas' own history text only.
- **Paphlagonia and "Pontus Galaticus" added to Galatia (6 BC, 2 BC); "Pontus Polemoniacus" added (AD 64):** none borders a current place; kept in Galatia's and Pontus's own tables (§2.12, §2.13), and in §5's name-change list, only.
- **Lycia's own annexation as a province (AD 43):** borders no current place on its own, and Pamphylia's own province at this date is already unresolved in the existing records (§2.12); not added as a separate stop. The later 74 merger with Pamphylia is added above, because it does reach a current place (Perga) and gives the area a new name.
- **Thrace's reduction to a province (AD 38, then 46/47 or 69-79, disputed):** no current place is there, and the ancient sources disagree on the year by three decades (§2.14); not added as a stop, though it is one of the "empire's extent" items a reader might expect — flagged here rather than guessed at.
- **Herod of Chalcis's and Agrippa II's appointments to Chalcis (41, 50) and Agrippa II's exchange of it (53):** folded into the stops at 41 and 53 above rather than given their own entries, since Chalcis itself holds no current place and the 53 stop already covers Agrippa II's major territorial change that year.
- **Individual Armenian and Parthian kings:** far too numerous and, for Armenia, too often contested mid-reign to list; only the lasting 63 settlement is in Armenia's own table (§2.22), and it is not proposed as a stop because it changes no border our map would show (a client king remains a client king; only his patron's identity is confirmed).
- **Mauretania's and Britain's internal changes:** per the brief, tracked only as "what the far edge looks like" at each stop above, not as their own stops.

## 5. Names that changed

Under the new rule (brief §1.3; ADR-0037 item 1) that a name change can itself be a stop, this section lists every area, entity and town name this note found changing between 4 BC and AD 100.

### 5.1 Area and entity names

| Year | Change | Is it a stop? | Sources |
|---|---|---|---|
| 2 BC | "Pontus Galaticus" — the part of Pontus added to Galatia — comes into use for that part, distinct from the independent eastern kingdom | No: borders no current place (§4 exclusions) | `bib:isbe-galatia` |
| 64 | "Pontus Polemoniacus" comes into use for the formerly independent eastern kingdom, now a province, distinct from Pontus Galaticus and from Bithynia-administered western Pontus | No: borders no current place (§4 exclusions) | `bib:isbe-galatia` |
| 74 | "Lycia and Pamphylia" (or "Lycia et Pamphylia") becomes the name of the new joint province; Pamphylia stops being described as part of Galatia | **Yes — a stop at §4** | `bib:cassius-dio-roman-history` (60.17.3–4); existing `galatia.json`/`pisidia.json`/`pamphylia.json` |

No other area or entity in this note's scope is found changing its name in this window. (Judea's two senses, the district and the province, and Achaia's alternate name "Greece," are parallel names used throughout, not changes over time, and are already explained in §2.1 and §2.15 respectively.)

### 5.2 Renamed towns

These keep their Bible names on the map (ADR-0026); none is proposed as a stop, per the card's instruction. Listed for the human and for the Fact-Checker.

| Town (Bible / map name) | Renamed to | By whom, and when | Sources |
|---|---|---|---|
| Bethsaida | Julias | Philip raised the village to a city and renamed it, "the same name with Caesar's daughter," context-dated to shortly after the AD 6 census | `bib:josephus-antiquities` (18.2.1) |
| Betharamphtha (Perea) | Julias | Antipas rebuilt it and renamed it "from the name of the emperor's wife," same context, shortly after AD 6 | `bib:josephus-antiquities` (18.2.1) |
| Paneas | Caesarea (Philippi) | Philip rebuilt it and renamed it, same passage, shortly after AD 6 | `bib:josephus-antiquities` (18.2.1) |
| Caesarea Philippi | Neronias | Agrippa II renamed his capital "in order to flatter" the emperor Nero, after AD 54 | `bib:jewish-encyclopedia-agrippa-ii` (citing Antiquities 20.9.4) |

**Note on Julia/Julias.** Whiston's translation gives two different reasons for the same name in the same passage (Antiquities 18.2.1): Betharamphtha is renamed "from the name of the emperor's wife," but Bethsaida "the same name with Caesar's daughter." Both are usually read as honoring the same woman, Livia: Augustus's will "appointed as his chief heirs Tiberius... and Livia... these he also bade assume his name," so that she became Julia Augusta (`bib:suetonius-twelve-caesars`, *Augustus*, read for this update). This note does not resolve why Josephus's own (or Whiston's) wording differs between "wife" and "daughter" for the same woman. **Bethsaida's and the Perea Julias's names are identical but the towns are different** — see the entity `julias-perea` in §3 — a known source of confusion this note flags for anyone drawing or labeling either site.

## 6. Places

Every current place record's area, grouped (89 places; none needs reassignment — see notes).

| Area | Places (current parent) | Consistent? |
|---|---|---|
| `judea` | bethany, bethlehem, emmaus, jericho, jerusalem (+ jerusalem's own sub-sites: gethsemane, golgotha, mount-of-olives, pool-of-bethesda, pool-of-siloam, temple-mount) | Consistent — all sit in the district throughout 4 BC – AD 100 under whichever entity held Judea (§2.1). |
| `judea-province` | bethany-beyond-the-jordan, bethsaida, caesarea-maritima, caesarea-philippi, joppa, galilee, judea, samaria | Consistent for "about AD 50" (the project's snapshot date), which falls in the 44–53 window when the procurators governed Philip's former tetrarchy too (§2.3). From 53, bethsaida and caesarea-philippi fall under Agrippa II's kingdom instead (§2.3); this does not change their *parent area* (still the smallest area containing them), only that area's own holder at a later date, already captured in §2.3's table. |
| `galilee` | cana, capernaum, chorazin, magdala, nain, nazareth, sea-of-galilee | Consistent. `sea-of-galilee`'s parent is a deliberate, already-sourced exception (M3-11): the lake spans the Galilee/Gaulanitis boundary, and no smaller area contains all of it. |
| `samaria` | sychar | Consistent. |
| `syria` | antioch-syria, damascus, tarsus, tyre | Consistent (§2.8); tarsus is in the Cilician plain, administered from Syria throughout. `damascus` is also, by some ancient counts, a city of the Decapolis (§2.7) — a holder note on this place, not a different area; its ordinary parent stays `syria`. |
| `galatia` | antioch-pisidia, iconium, lycaonia (derbe, lystra), pamphylia (perga), pisidia | Consistent, including the already-sourced placement of Antioch and Iconium directly under Galatia rather than under Pisidia or Phrygia (existing records' own notes), and Perga under Pamphylia under Galatia despite the split evidence on Pamphylia's own status (§2.12). From 74, Pamphylia's (and so Perga's) province is "Lycia and Pamphylia," not Galatia (§4, §5.1) — a later data task should update this once M4-01's schema is in place. |
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

## 7. Records worth adding later (M6)

Areas this note researched that have no location record yet: **Idumea, Perea, the combined Gaulanitis/Batanea/Trachonitis/Auranitis area, Abilene, Chalcis, the Decapolis (and its individual cities), Lycia, Thrace, Commagene, Armenia**, and (for the coastal cities, §2.8) **Gaza and Ashkelon**. Phoenicia (Tyre's and Sidon's own region, distinct from the city of Tyre) is also still missing, per the existing backlog. This note does not add any of these as data; M4-03 takes its area list from §2 above for shapes, and a future M6 batch would add place/area records.

## 8. Open questions for the Fact-Checker

1. **Bethsaida's (and similarly Caesarea Philippi's and the Philip-tetrarchy area's) `politicalHistory` currently ends the Agrippa II period at AD 70.** This note's sources (`bib:isbe-trachonitis`, `bib:jewish-encyclopedia-agrippa-ii`) describe his rule continuing to his death (c. 92/93 or 100); the 70 cutoff appears to be a side effect of the war's end rather than a sourced change to this area. Recommend correcting in phase 2.
2. **Chalcis's holder, 48–50 and 53–72** (§2.5): this note could not find a named holder in the sources it opened. Recommend a further search, or carrying the gap forward as "unclear" if none is found.
3. **Agrippa II's death year:** this note can source "AD 100" (two older reference works, one of which calls it disputed) but not a specific source for the modern "92/93" alternative the task card itself names. Recommend the Fact-Checker search further, or the PO decide whether to keep both figures with the sourcing gap noted, or drop the earlier figure until sourced.
4. **Ashkelon's free-city status** (§2.8): asserted by general knowledge of the period, not by a source this note opened. Recommend sourcing before use, or omitting the claim.
5. **"Prefect" vs. "procurator" for AD 6–41** (§2.1): this note's primary source (Whiston's Josephus) uses "procurator" throughout, while the Pilate inscription supports "prefect" for this earlier period specifically. Recommend the Fact-Checker confirm the project's preferred wording with an additional source, since this affects entity names across many periods.
6. **The Luke 2:1–2 census and the Quirinius question** (§2.1): presented neutrally per the card's instruction; no resolution attempted.
7. **Philip's tetrarchy's exact district list, and "Iturea"** (§2.3): Josephus himself is inconsistent across three passages; presented neutrally.
8. **Perga's province from AD 74** (§5.1, §6): once phase 2 encodes the timeline, Perga's `politicalHistory` (and `pamphylia`'s and `pisidia`'s) should gain a row for "Lycia and Pamphylia" from 74, alongside the already-flagged, unresolved question of Pamphylia's status before that date.
9. **Chalcis's drawability** (§2.5): flagged so M4-03 can merge it into a neighbour if no source gives it its own boundary; this note did not find one.

## 9. Sources

### New bibliography entries (added to `data/bibliography.json`)
- `bib:isbe-decapolis`, `bib:isbe-ituraea`, `bib:isbe-peraea`, `bib:isbe-trachonitis`, `bib:isbe-abilene` — International Standard Bible Encyclopedia (1915), each opened at internationalstandardbible.com.
- `bib:jewish-encyclopedia-agrippa-ii` — "Agrippa II," Jewish Encyclopedia (1906), by M. Brann. The live site renders articles by JavaScript; this note opened the article's text through a 2005 Wayback Machine snapshot of the same page (URL in the bibliography entry) after the live page returned only its navigation shell.
- `bib:jewish-encyclopedia-herod-ii` — "Herod II." (Herod of Chalcis), Jewish Encyclopedia (1906), by Joseph Jacobs and Isaac Broydé. Opened directly at jewishencyclopedia.com.
- `bib:smith-dictionary-thracia` — "Thracia," *A Dictionary of Greek and Roman Geography* (William Smith, ed., 1854), opened at perseus.tufts.edu. No individual contributor's signature was found on this entry; cited to the general editor, as the project's existing Smith's-dictionary entry does for its own (differently authored) work.

### Primary texts opened for this note (existing bibliography entries, new chapters read)
- `bib:josephus-antiquities`, books 17–20 (Whiston's translation, ccel.org): Herod's death and will (17.8); Augustus's division of the kingdom (17.11.4); Quirinius's census and Coponius (18.1); the Pilate/Vitellius/Aretas narrative (18.4–18.5); Herod's and Philip's city-building, including the renamings in §5.2 (18.2.1); Philip's death (18.4.6); Caligula frees and crowns Agrippa I (18.6); Antipas banished (18.7); Claudius's accession and settlement (19.4–19.5); Herod of Chalcis mentioned (20.1); Agrippa II's exchange of Chalcis and Nero's grants (20.7–20.8).
- `bib:josephus-jewish-war`, books 2 and 7 (same translation): the division and AD 6 narrative (2.6–2.8); Antipas's banishment, with a different place of exile than Antiquities (2.9); Commagene's annexation under Vespasian (7.7).
- `bib:tacitus-annals`, book 2 (LacusCurtius, Loeb translation): Cappadocia's and Commagene's annexation, 2.42.
- `bib:cassius-dio-roman-history`, books 59–60 (LacusCurtius, Loeb translation): Caligula's grants to Agrippa I and Antiochus IV, 59.8; Mauretania, 59.25; Claudius's British campaign, 60.19–21.
- `bib:suetonius-twelve-caesars`, *Claudius* (LacusCurtius): the British triumph, checked for a Thrace reference (none found). *Augustus* (LacusCurtius, read for the PO's amendment): Augustus's will directing Livia to "assume his name" (§5.2's note on Julia/Julias).
- `bib:livius-nabataeans`: re-opened for this note's precise reign years.
- `bib:isbe-galatia`: re-opened for Paphlagonia, Pontus Galaticus and eastern Lycaonia's years.

### WEB verses quoted or cited
Pulled from `data/reference/engwebp_vpl.txt` (the project's own snapshot): Matthew 2:22; Mark 3:8; Luke 1:5; Luke 2:1–2; Luke 3:1; Luke 23:6–7; Acts 2:9; Acts 12:1,12:19–23; Acts 18:12; Acts 25:1,25:13,25:23; Acts 26:2,26:32; Galatians 1:17,1:21; 2 Corinthians 11:32; 1 Peter 1:1.

Run `npm run validate:data` after adding the bibliography entries above (done; see commit).
