# M4-02 — The timeline: who held each area, and when

| | |
|---|---|
| Agents, in order | `research-lead` (research note, then data) → `fact-checker` (verification), each adding its own commits (ADR-0014) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m4-timeline` (from `main` after the M4 kickoff). Before the data step, the PO merges M4-01's schema commit into it. |
| Depends on | The M4 kickoff for the research; M4-01's schema for the data step |
| Parallel with | M4-01, M4-03, M7-01 and M4-04. M4-03 takes its list of areas from this task's research note. |
| Credit target | ~6,000 research and data, ~6,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Find, from sources, every change in who ruled the lands of the New Testament between 4 BC and AD 100, choose the years the timeline stops at, and record them as data. The map can then show Herod's kingdom divided among his sons, Judea under Roman governors, Agrippa I's kingdom, the Jewish revolt, and so on.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0037 (stops, the default year, the data model), ADR-0017 (every clause stated by a source you opened; Wikipedia never alone), ADR-0026 (English names), ADR-0027 (the "about AD 50" convention), ADR-0033 (introduce people and writers)
- `CHECKPOINTS.md` → CP2 decision 5 (political history consistent) and CP3b decision 2 (re-source older text when you edit it)
- `docs/verification/M3-ancient-regions.md`: what M3-11's Fact-Checker removed, and why
- `docs/research/SOURCES.md`, `data/bibliography.json`, and `data/locations/*.json` (the area records, and the places' `politicalHistory`)
- From the data step: `schema/README.md` → "Timeline and ancient layer" (M4-01)
- This card

## Scope
### Research Lead, phase 1: the research note (starts now)
Write `docs/research/M4-timeline.md`. The research doesn't depend on the data format.
1. **Areas:** every area that changed hands as a unit between 4 BC and AD 100 within the map's focus (Italy to Mesopotamia, and the Black Sea to Egypt), at the detail the sources support. For example: Judea, Samaria and Idumea; Galilee and Perea; Gaulanitis, Batanea, Trachonitis, Auranitis and Iturea; Abilene; the Nabataean kingdom; Chalcis; Commagene; the plain and the rough west of Cilicia; Cappadocia; Galatia and the lands joined to it (Pisidia, Lycaonia, Pamphylia, Paphlagonia and parts of Pontus); Lycia; Thrace; Achaia; Macedonia; Asia; Bithynia and Pontus; Cyprus; Crete and Cyrene; Egypt; Syria; and Armenia and the Parthian Empire at the edge. Outside the focus, list only the changes to the empire's extent, such as Mauretania and Britain, so its edge is right at each stop.
   - **Only land the sources describe well enough to draw is an area** (ADR-0037 item 3); M4-03 draws each one from AWMC data and cited descriptions. A unit without a drawable territory, such as a free city, the cities of the Decapolis, or a town given to another ruler, is a holder of places (item 5), not an area. Mark any area whose extent you doubt, so that M4-03 can merge it into a neighbour.
2. **Periods:** for each area, from year, to year, who held it, the ruler, and sources. Where sources differ, give each view and the choice made, for example the year of Agrippa II's death (about 92/93 or about 100) and the year Nero gave him parts of Galilee and Perea (54 or 61).
3. **Entities:** the English name (ADR-0026: where the Bible names an area, the spelling most popular English Bibles agree on, as with Luke 3:1's Iturea, Trachonitis and Abilene; otherwise the standard English name in the sources), the kind, the rulers, the years, and the passages that name the area or its ruler (for example Matthew 2:22; Luke 2:1–2, 3:1 and 23:6–7; Acts 12; Acts 25–26; 2 Corinthians 11:32).
4. **Stops** under ADR-0037 item 1: the year, a short plain title, a one-paragraph summary of what changed and where, and sources. The brief's four are always stops: 4 BC, AD 6, AD 41 and AD 44 (Agrippa I), and AD 70. Aim for a list a reader can follow, about 10 to 15 stops, and say which changes you left out and why.
5. **Places:** for each place record, the area that holds it, and the places that differ from their area, with sources. For example: free cities; the towns of Galilee and Perea that Nero gave to Agrippa II while the rest stayed in the province (check which of our places, if any, were among them); and the Decapolis cities.
6. **Neutral handling of debated dates.** For example, the census under Quirinius (Luke 2:1–2) and its relation to Herod's death are debated; describe the positions and don't resolve them (brief §2.6).
7. **Names that changed** in the period (brief §1.3): the names of areas and entities, for example when Lycia was joined with Pamphylia, and towns that were renamed, for example Bethsaida as Julias, with sources. A change in an area's or entity's name can be a stop. Renamed towns keep their Bible names on the map (ADR-0037 item 1), so list them for the human instead.
8. **Records worth adding later:** list the areas the New Testament names that have no record yet (for example the Decapolis, Idumea, Iturea, Trachonitis, Abilene, Phoenicia and Lycia) for an M6 batch. Don't add records in this task.

**Sources:** ancient authors in public-domain translations on sites you can open (for example Josephus, Tacitus, Suetonius, Cassius Dio, Strabo and Pliny the Elder); open reference works (for example Livius.org, Britannica, the Jewish Encyclopedia of 1906, the International Standard Bible Encyclopedia of 1915, and Smith's *Dictionary of Greek and Roman Geography* of 1854); and Pleiades or Wikidata for identification only. Where an entry you rewrite cites Rainey and Notley's atlas, which no one on the team could open, replace it with an openable source (CP3b decision 2).

Commit: `docs(research): first-century political changes`. Then reply to the PO with the list of areas (M4-03 starts its shapes from it) and stop until the PO says the schema is merged.

### Research Lead, phase 2: the data (after the PO merges M4-01's schema)
Encode the note in M4-01's format: the stops, the entities, each area's periods, and the area records' `politicalHistory`. This closes two backlog items: rebuild the province histories that M3-11's Fact-Checker removed, from sources other than Wikipedia; and model the client kingdoms with their dates of alliance and annexation (the Nabataean kingdom, Polemon's Pontus, and Commagene with the rough west of Cilicia). Make the places' political history consistent with their areas under M4-01's rule. Set changed records to `draft`. Run `npm run validate:data` and `npm test`. Commit: `data(timeline): first-century stops and political areas`.

### Fact-Checker
Open every source, and check every stop, entity, period and place assignment against it (ADR-0017). Check the year convention, the names (ADR-0026), neutrality, that the brief's four stops are present, and that both backlog items are closed. Use a semantic diff to check that records changed only in political history and its sources. Set passing records back to `verified`. Write `docs/verification/M4-timeline.md`. Run `validate:data`, `test` and `test:app`. Commit: `docs(verification): verify the first-century timeline`.

## Out of scope
Shapes, roads and coastlines (M4-03), the app (M4-04 and M4-05), new location records, and changes to any field other than political history and the sources it needs.

## Acceptance criteria
- [ ] The research note covers areas, periods, entities, stops, place exceptions and renamings, each sourced, with uncertainties explained.
- [ ] The data validates under M4-01's schema, and every area in the focus is covered from 4 BC to AD 100 without gaps or overlaps.
- [ ] The brief's four stops are present, and each stop changes something on the map.
- [ ] Every place's political history agrees with its area, or is an explained exception.
- [ ] The two backlog items are closed.
- [ ] All changed records are `verified` again, and CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: first-century timeline`.
