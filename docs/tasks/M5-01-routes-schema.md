# M5-01 — Routes: schema and build

| | |
|---|---|
| Agent | `gis-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-routes-schema`, stacked on the M5 kickoff (`docs/m5-kickoff`) until it merges (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | The M5 kickoff (ADR-0038) |
| Parallel with | M5-02's and M5-03's research. Their data steps, M5-04 and M5-05 start from this branch's commit. |
| Credit target | ~2,500 (session guard: 10,000; ADR-0025) |

## Goal
Define how the routes are stored, checked and handed to the app, so that the research (M5-02, M5-03), the lines (M5-04) and the Routes tab (M5-05) work in parallel against one model.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0038 (M5's model; read it first), ADR-0037 item 3 (how the ancient layer keeps facts and geometry apart), ADR-0012 (ODbL for `data/geo/`, CC BY-SA 4.0 for the rest), ADR-0017, ADR-0026
- `docs/design/VISUAL_SPEC.md` §2 "Routes tab", §10, §11
- `schema/README.md` (the conventions and "Timeline and ancient layer (M4)"), `schema/*.schema.json`, `scripts/lib/validator.mjs` and its tests, `scripts/build-app-data.mjs` and the code it calls, `scripts/fill-scripture-text.mjs`
- `data/locations/*.json` (ids and candidates) and `data/timeline.json` (the stops, for a route's year)
- This card

## What the model must hold
You design the format and document it. It must hold:
1. **Routes:** an id (for example `paul-1`, `paul-2`, `paul-3`, `paul-rome` and `jesus`), an English title, approximate years (from and to, BC negative, with a note where scholars differ; ADR-0038 item 7), a short note, and sources. Whether the route's stages form one connected sequence (Paul's journeys) or stand alone (Jesus' segments, ADR-0038 item 3).
2. **Stages,** in order: from and to, any places passed or sailed by on the way, in order, the passages (`scripture[]` entries with `ref` and `textWEB`, filled by the build from the WEB text, as for places), how it went (`land`, `sea`, or not known), the regions the text names when it names no town (ADR-0038 item 1), an attestation for Jesus' segments (the Gospels that tell it and the rule it meets), and sources.
3. **Stops:** a stage's ends and passed places refer either to a location record (by id, and a candidate where the record has several) or to a stop entry (ADR-0038 item 2). A stop entry has an id, an English name (ADR-0026), a "today" name where the sources give one, candidates in the place model's form (coordinates `[lon, lat]`, confidence and sources, so disputed stops work as places do), the passages that name it, sources, and a status (`draft` or `verified`). Each stop is stored once and shared by every route.
4. **Lines:** each stage's line in `data/geo/`, keyed by route and stage, with each feature's provenance (dataset, version, feature ids and every change made to them), as for the ancient layer. Or no line, with the reason (ADR-0038 items 1 and 4). Keep the CC BY-SA facts out of the geometry files.

## Checks (`npm run validate:data`)
- Every file validates against its schema.
- Every stop a stage names exists, as a record or a stop entry, and a stop entry doesn't repeat a location record.
- Every passage is a valid reference in the one-chapter format (`schema/README.md`), and its WEB text matches the source text.
- A stop entry's site cites at least two sources (brief §2.1).
- Every stage of Jesus' journeys has an attestation.
- Every stage has a line or a stated reason for having none; this check can be switched off until M5-04 lands, as `REQUIRE_ANCIENT_SHAPES` was in M4.
- Each failure has a test.

## Build (`npm run build:data`)
- Writes the files the Routes tab loads when it opens: the routes, their stages with WEB text, the stops with coordinates, and the lines. They are separate from the map's data, so the load-speed gates don't move.
- Reports their size compressed with gzip and fails above 100,000 bytes (ADR-0038 item 5).
- **Test data:** a fixture route with a stage by land, a stage by sea with a place sailed by, a "path not known" stage, a stop entry, a disputed stop, and a stage without a line, so that M5-05 can build before the verified data lands. Fixtures never ship in the web export.

## Out of scope
The research (M5-02, M5-03), drawing real lines (M5-04) and the app (M5-05). No new sources, so `ATTRIBUTION.md` and `docs/LICENSES.md` don't change.

## Acceptance criteria
- [ ] The format holds everything above and is documented in a "Routes (M5)" section of `schema/README.md`, with a complete example.
- [ ] `validate:data` enforces the checks above, each with a test.
- [ ] `build:data` writes the Routes files and reports their gzip size against the budget.
- [ ] The fixtures cover every case and never ship.
- [ ] `npm run lint`, `typecheck`, `test:all`, `validate:data`, `build:data` and `export:web` pass.

## Finish
Follow the session protocol in your agent file. PR title: `feat(data): routes schema and build`.
