# M4-01 — Timeline and ancient layer: schema and build

| | |
|---|---|
| Agent | `gis-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m4-ancient-schema` (from `main` after the M4 kickoff) |
| Depends on | The M4 kickoff (ADR-0037) |
| Parallel with | M7-01, and M4-02's research. M4-02's data step, M4-03 and M4-05 start from this branch's commit. |
| Credit target | ~2,500 (session guard: 10,000; ADR-0025) |

## Goal
Define how the timeline, the political areas and their shapes are stored, checked and handed to the app. The Research Lead (M4-02), the shapes (M4-03) and the app (M4-05) then work in parallel against one model.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0037 (M4's model; read it first), ADR-0012 (ODbL for `data/geo/`, CC BY-SA 4.0 for the rest), ADR-0017, ADR-0018 (the regions of 1 Peter 1:1 as shapes), ADR-0026, ADR-0027
- `CHECKPOINTS.md` → CP2 → decision 5 (political history filled in consistently in M4)
- `docs/design/VISUAL_SPEC.md` §2 "Ancient layer" and "Timeline", §10, §11
- `schema/*.schema.json`, `schema/README.md`, `scripts/lib/validator.mjs` and its tests, `scripts/build-app-data.mjs` and the code it calls
- `docs/research/SOURCES.md` → AWMC Geodata; `docs/LICENSES.md` (the first table)
- `data/locations/*.json`: the area records and the existing `politicalHistory` entries
- This card

## What the model must hold
You design the format and document it. It must hold:
1. **Stops:** the years the timeline snaps to, each with a short English title, a one-paragraph summary, optional Bible passages (`scripture:` ids) and sources. The range is 4 BC to AD 100 for now, but nothing in the format may assume the first century (brief §1.3). A default year of AD 50 opens the stop in force that year (ADR-0037 item 2).
2. **Political entities:** whoever held an area: a Roman province, an allied ("client") kingdom or tetrarchy, a free city or league, or a state outside the empire, such as the Parthian Empire. Each has an id, an English name (ADR-0026), a kind, an optional link to a location record (for example `syria` or `arabia`), and sources.
3. **Areas, and who held them when:** an area is land that changed hands as a unit, for example Galilee, Perea, Trachonitis, Lycia or Commagene. Each area has periods: from year, to year, the entity that held it, the ruler where there was one, and sources. Within the map's focus, periods cover the whole range without gaps or overlaps. An area may be a location record (Galilee) or exist only in this data (Gaulanitis).
4. **Shapes:** each area's shape in `data/geo/` (ODbL 1.0), keyed by area id. Each feature records its provenance: the upstream dataset, its version and feature ids, and every change made to them, each with its source (ADR-0037 item 3). Roads (known or conjectured, Barrington period, upstream ids) and the ancient coastline, where it differs from today's, have files of their own. Keep CC BY-SA facts (who held what, when) out of the ODbL files.
5. **Places:** how places' `politicalHistory` relates to the areas, so that each fact is stored once and a check keeps places consistent (CP2 decision 5). Recommended: a place's history comes from the area that holds it; the record keeps only place-specific exceptions, such as a free city inside a province, or Tiberias, given to Agrippa II while the rest of Galilee stayed in the province; the build derives the rest and a check compares them. Existing entries must keep validating until M4-02 rewrites them. If you change their shape, do it mechanically, without changing any fact.
6. **Years:** integers, BC negative, no year 0. Say exactly whether `toYear` is the first year of the next period or the last year of this one, and how a period that crosses from 1 BC to AD 1 is counted. Use one rule everywhere. Today's entries use the year of the change as `toYear` (for example 4 BC to AD 6, then AD 6 to AD 41).

## Scope
1. The schemas for the timeline and the shapes, and any change to `location.schema.json` that item 5 needs.
2. **Validator errors,** each with a test: unknown ids (entities, areas, records, sources); periods outside the range, overlapping, or leaving gaps where cover is required; a stop in whose year nothing starts or ends (ADR-0037 item 1); a default year that no stop covers; a shape without an area; invalid geometry (open rings, coordinates outside `[lon, lat]` ranges, self-intersections); and, behind a switch that is off until M4-03 lands (like `REQUIRE_MODERN_COUNTRIES` was), an area in the focus without a shape.
3. **The build:** extend `npm run build:data` to write what the app needs into `app/public/generated/`: the stops and entities, and for each stop the areas with their holders, borders drawn once where two areas meet (dissolved by holder), and a label point inside each area that has no record. Simplify the shapes for zoom 10 and below, and round coordinates sensibly. Print the sizes. Everything the ancient layer loads must stay under about 300 KB compressed (spec §11). Use pinned, well-known libraries, and say which and why.
4. **A test fixture,** clearly fake and kept under `tests/`, never in `data/`: two stops, three areas, one road and one coastline piece. M4-05 builds against it before the real data exists.
5. **App types:** TypeScript types for the generated files in the app (types only, no UI).
6. **Docs:** a "Timeline and ancient layer" section in `schema/README.md` with a small example. Explain each GIS idea you use in one plain sentence with a learning link, for example GeoJSON polygons and rings, dissolving, simplification, and label points.

## Out of scope
Real stops, periods and shapes (M4-02 and M4-03), the app's map and UI (M4-04 and M4-05), and the modern basemap.

## Acceptance criteria
- [ ] The format holds items 1 to 6, documented in `schema/README.md` with an example.
- [ ] The validator reports each rule above, with tests, and today's data still validates.
- [ ] `npm run build:data` writes the app files from the fixture in tests, and prints their sizes.
- [ ] `npm run lint`, `typecheck`, `test:all`, `validate:data`, `build:data` and `export:web` pass.

## Finish
Follow the session protocol in your agent file. Commit: `feat(schema): timeline and ancient layer`. PR title: `feat(schema): timeline and ancient layer`.
