# M5-06 — Route text, and every place the passages name

| | |
|---|---|
| Agents, in order | `gis-engineer` (schema) → `research-lead` (text and places) → `fact-checker` (verification), each adding its own commits (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Sonnet 5 → Claude Opus 5.5 |
| Branch | `data/m5-route-text`, stacked on M5-04 (`data/m5-route-lines`) |
| PR target | `main` (ADR-0039) |
| Depends on | M5-04's data; the human's MC9 feedback (ADR-0041) |
| Parallel with | M5-05's third round, which reads the new fields when they exist |
| Credit target | ~1,500 schema, ~4,000 text and places, ~3,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Give each route a broad summary, what the Bible says, and notes that hold every disclaimer, in that order (ADR-0041 item 1), and record the places each stage's passages name that the travellers didn't reach, so the Routes tab can show them (ADR-0041 item 8).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0041 (read it first), ADR-0038 and both its updates, ADR-0017, ADR-0026, ADR-0033
- `docs/design/VISUAL_SPEC.md` §2 "Routes tab"
- `schema/README.md` → "Routes (M5)", `schema/routes.schema.json`, `schema/route-stops.schema.json`, `scripts/lib/validator.mjs` and its tests, `scripts/lib/routes-app-data-builder.mjs`
- `data/routes/routes.json`, `data/routes/stops.json`, `data/locations/*.json`, `data/bibliography.json`
- `docs/research/M5-paul-journeys.md` (§4.2 has the research on Phoenix and Lasea) and `docs/research/M5-jesus-journeys.md`
- The WEB text in `data/reference/engwebp_vpl.txt`
- This card

## Scope
### GIS Engineer: the schema
1. A route gets `summary` (a few sentences), `bibleText` (a short paragraph) and `notes` (an array of short strings). Each is required once the check `REQUIRE_ROUTE_TEXT` is on; it's off until the Research Lead's step, and when it's on the old `note` is no longer allowed.
2. A stage gets `mentioned`: stop references, like `via`, to the places its passages name that the travellers didn't reach. A mentioned stop must exist, can't also be one of the stage's ends or places passed, and is drawn with no line to it.
3. Validation and tests for each rule, `schema/README.md` updated, and the build passing the new fields to the app's Routes files within the 100,000-byte budget.
Commit: `feat(data): route text and places named`.

### Research Lead: the text and the places
1. For each of the five routes, write:
   - **`summary`:** two or three sentences on the journey as a whole, neutral and sourced;
   - **`bibleText`:** one short paragraph telling the journey as the text tells it, citing its main passages (`scripture:` sources). It doesn't quote the WEB at length; the stages carry the passages;
   - **`notes`:** bullet points holding every disclaimer: that the lines show the order of the stops and how they went, not the exact paths; where the text names only regions; debated dates; debated identifications, such as which Galatia, or Malta and Mljet; textual differences, such as Trogyllium; and anything else the old `note` said. The app lists the stages without a line from their `noLineReason`, so don't repeat those.

   Move every disclaimer out of the summary and the Bible text into the notes. Every clause is stated by a source you opened (ADR-0017), the text is neutral (brief §2.6), and people and writers are introduced (ADR-0033). Remove `note`, and turn on `REQUIRE_ROUTE_TEXT`.
2. For each stage, list in `mentioned` every place its passages name by a proper name that the travellers didn't reach or pass. For example: Phoenix (Acts 27:12) and Lasea (Acts 27:8); the home ports of the ships (Adramyttium, 27:2; Alexandria, 27:6 and 28:11); and Bithynia (16:7). Do the same for Jesus' segments, such as places named only as goals. Use a record where one exists; otherwise create a stop entry with its site from two sources (brief §2.1), with candidate sites where it's disputed. A place without a sourced point, such as a region with no record, is left out, and the research note says so.
3. Add a short section to each research note listing what you added.
Commit: `data(routes): route text and places named`.

### Fact-Checker
Check:
- every clause of the new text against its sources (ADR-0017), and that no disclaimer remains outside `notes`;
- every place in `mentioned` against the WEB text of its stage's passages, and that the travellers didn't reach it;
- each new stop entry's site against two sources, with its names under ADR-0026;
- the neutrality of the text.

Set passing entries to `verified`, and write `docs/verification/M5-route-text.md`. Commit: `docs(verification): verify the route text and places named`.

## Out of scope
The app (M5-05), the lines (M5-04), and full place records for the stop entries (an M6 batch).

## Acceptance criteria
- [ ] Each route has a summary, what the Bible says and notes, in that order, and no disclaimer appears outside the notes.
- [ ] Every place a stage's passages name is a stop, a place passed, or in `mentioned`, unless the research note explains why it isn't.
- [ ] `validate:data` passes with `REQUIRE_ROUTE_TEXT` on, and every new entry is verified.
- [ ] CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: route text and places named`.
