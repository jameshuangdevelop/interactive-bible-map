# M5-02 — Paul's four journeys

| | |
|---|---|
| Agents, in order | `research-lead` (research note, then data) → `fact-checker` (verification), each adding its own commits (ADR-0014) |
| Models | Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m5-paul-journeys`, stacked on the M5 kickoff (ADR-0039). Before the data step, the PO merges M5-01's schema commit into it. |
| PR target | `main` (ADR-0039) |
| Depends on | The M5 kickoff for the research; M5-01's schema for the data step |
| Parallel with | M5-01, M5-03 and M5-05. M5-04 takes its stops from this task's research note. |
| Credit target | ~6,000 research and data, ~6,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Record Paul's three missionary journeys and his voyage to Rome from Acts, stage by stage, with every stop placed from sources, so that the Routes tab can show where he went and cite each step.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0038 (the routes; read it first), ADR-0017 (every clause stated by a source you opened; Wikipedia never alone), ADR-0026 (English names), ADR-0033 (introduce people and writers)
- `docs/research/SOURCES.md`, `data/bibliography.json`, and `data/locations/*.json` (which stops already have a record)
- The WEB text in `data/reference/engwebp_vpl.txt` (lines start with `ACT`)
- From the data step: `schema/README.md` → "Routes (M5)" (M5-01)
- This card

## Scope
### Research Lead, phase 1: the research note (starts now)
Write `docs/research/M5-paul-journeys.md`. The research doesn't depend on the data format.
1. **The four routes:** where each begins and ends in Acts, with sources. The usual division is Acts 13:1–14:28, 15:36–18:22, 18:23–21:17 and 27:1–28:16; say where scholars draw a boundary differently, and choose.
2. **Stages,** in Acts' order: from, to, the passages (verse ranges), and whether by land or by sea where the text says or clearly implies it (for example Acts 20:13, where Paul went by land to Assos while the others sailed). List any place passed or sailed by on the way, such as Chios (Acts 20:15) or Salmone and Clauda (Acts 27:7 and 27:16). Where the text names only regions between two stops (for example Acts 16:6–8), name the regions; don't add towns.
3. **Stops:** for each, the record it matches (by id), or a stop entry: the English name (ADR-0026; for example, WEB has "The Market of Appius" in Acts 28:15, so compare the spellings of the most popular English Bibles), the site with coordinates from at least two sources (for example Pleiades and OpenBible.info), a confidence, today's name, the passages that name it, and candidate sites with their support where the site is disputed (for example Lasea, near Fair Havens, Acts 27:8).
4. **Years:** each route's approximate years, from sources, with the range of scholarly views and what anchors them (for example the Gallio inscription at Delphi for Paul's stay in Corinth, Acts 18:12). Give each view; don't resolve the debates (brief §2.6).
5. **Notes:** a short, neutral note for each route, with the debated points it touches, for example which regions "Phrygia and Galatia" means (Acts 16:6, 18:23), or which island Acts 28:1 calls Malta, giving each view.
6. **Left out:** list the journeys in Acts outside these four (for example to Damascus, Acts 9, or the visits to Jerusalem in Acts 11:30 and 15:2) for the backlog. Don't record them.

**Sources:** the WEB text for what Acts says (a `scripture:` source supports only what the passage says); open reference works for sites and dates, such as the International Standard Bible Encyclopedia (1915), Smith's *Dictionary of Greek and Roman Geography* (1854), the Jewish Encyclopedia (1906), Livius.org and Britannica; and Pleiades, OpenBible.info or Wikidata for identifying sites.

Commit: `docs(research): Paul's four journeys`. Then reply to the PO with the list of stops and stages by sea (M5-04 starts its lines from it), and stop until the PO says the schema is merged.

### Research Lead, phase 2: the data (after the PO merges M5-01's schema)
Encode the note in M5-01's format: the four routes, their stages and the stop entries. Set new entries to `draft`. Run `npm run validate:data` and `npm test`. Commit: `data(routes): Paul's four journeys`.

### Fact-Checker
Open every source, and check each stage against the WEB text (stops, order, places passed, by land or by sea), each stop entry's site against at least two sources, the names (ADR-0026), the years and the neutrality of the notes (ADR-0017). Set passing entries to `verified`. Write `docs/verification/M5-paul-journeys.md`. Run `validate:data`, `test` and `test:app`. Commit: `docs(verification): verify Paul's four journeys`.

## Out of scope
The lines (M5-04), the app (M5-05), full place records for the stops (an M6 batch), and Paul's other journeys (backlog).

## Acceptance criteria
- [ ] The note covers the four routes, every stage, stop, place passed and region, the years and the debated points, each sourced.
- [ ] Every stop is a record or a stop entry whose site cites at least two sources.
- [ ] The data validates under M5-01's schema, and the Fact-Checker has verified every entry.
- [ ] CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: Paul's four journeys`.
