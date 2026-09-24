# M2-01 — Data schema, validation and CI

| | |
|---|---|
| Agent | `gis-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m2-schema-validation` |
| Depends on | M2-00 (CP1 approved) |
| Parallel with | none; M2-02 and M2-03 build on this schema |
| Credit target | ~600 AI credits (session guard: 1,500) |

## Goal
Turn the brief's starting data model into a validated schema, with scripts and CI that reject bad data before it merges, so the 40 core sites (M2-02, M2-03) can be written against it.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §2 and §4
- `docs/PROGRESS.md`
- `docs/DECISIONS.md`: ADR-0009 (GeoJSON overlays), ADR-0011 (static JSON, no backend), ADR-0012 (licenses), ADR-0013 (WEB edition `engwebp`), ADR-0014 (data-batch workflow)
- `docs/LICENSES.md`: the "One consistent OSM rule" and "Accepted image licenses"
- `docs/research/SOURCES.md`: the "Citation prefixes" section only
- This card

## Scope
1. **JSON Schemas** (draft 2020-12) in `schema/`, with a `description` on every field:
   - `location.schema.json` for `data/locations/<id>.json`, one location per file. Finalize the brief §4 model and keep its fields unless there is a reason to change one; if so, say why in the PR. Required decisions:
     - `id` is lowercase kebab-case and equals the file name.
     - `type` covers at least region, city, town or village, site within a city, and natural feature (lake, mountain). `zoomTier` is one of `mediterranean`, `region`, `city`, `site`.
     - `parentId` is optional; when present, it must name an existing location.
     - `candidates[]` has at least 1 entry. Each has `label`, `coordinates` as `[lon, lat]` in WGS 84 with range checks, `confidence` (`high`, `medium`, `low`, `disputed`), `support` (a neutral summary), and `sources[]` with at least 2 source IDs. It also records which single source the coordinate value was taken from, so the OSM rule in LICENSES.md can be checked.
     - `scripture[]` has `ref` in one normalized format (for example `Mark 1:21` or `Mark 1:21-22`), `book` from the 66-book Protestant canon, and `textWEB`.
     - `otConnections[]` has `ref` (an Old Testament book only) and a neutral `note`.
     - `politicalHistory[]` years are integers with BC negative and no year 0.
     - Every field that states facts (`summary`, `history[]`, `otConnections[]`, `politicalHistory[]`) carries source IDs.
     - `status` is `draft` or `verified`. `verifiedBy` and `lastReviewed` are required when it is `verified`.
   - `media.schema.json` for `data/media/<location-id>.json`: `locationId`, and `images[]` (1–3). Each image has `url` (https on `upload.wikimedia.org`), `author`, `license` (one of the accepted licenses in LICENSES.md), `licenseUrl`, `sourcePage` (a Commons `File:` page), `caption` and `aiGenerated` (must be `false` for now).
   - A list of allowed source-ID prefixes, each with a pattern (for example `pleiades:` followed by digits, or `wikidata:Q` followed by digits), taken from SOURCES.md.
2. **WEB text tooling.** Provide a script that fills `textWEB` from the `engwebp` edition for every `ref` in a location file, so scripture text is never typed by hand. Verse ranges join the verses in order. Choose between committing a snapshot of the text (it is public domain) and a pinned download with a checksum. Either way, tests must run offline using fixtures, CI must be reproducible, and the edition and source URL must be recorded with the date read.
3. **Validator** (`npm run validate:data`, on Node 24, with pinned dependencies and a lockfile). It must:
   - schema-validate every file in `data/locations/` and `data/media/`;
   - check that ids are unique and equal their file names;
   - check that `parentId` and media `locationId` point to existing locations;
   - reject coordinates taken from OSM-derived sources (the LICENSES.md rule);
   - reject `verified` records that lack `verifiedBy` or `lastReviewed`;
   - require at least 2 candidates when any candidate is `disputed`;
   - keep coordinates inside a project bounding box that covers the Mediterranean and Near East, including Egypt and Ethiopia;
   - fail when any `textWEB` differs from the WEB text for its `ref`;
   - warn when a verse's text contains none of the location's names.
   Errors name the file and the JSON path.
4. **Tests** (`npm test`, using `node:test`): valid and invalid fixtures, with at least one failing fixture for every rule above.
5. **CI:** `.github/workflows/data.yml` runs `npm ci`, `npm test` and `npm run validate:data` on every pull request and on pushes to `main`.
6. **`schema/README.md`:** the conventions in plain words, as the guide the Research Lead and Media Curator follow in M2-02 and M2-03. Cover coordinates and WGS 84, years, zoom tiers, what each confidence level means, the status workflow, source-ID prefixes, the OSM rule, and how to fill scripture text. Include one complete example record.
7. Add `.gitattributes` so JSON, Markdown and YAML files always use LF line endings.

## Out of scope
Real location data (M2-02, M2-03), `data/geo/` layers (M4), timeline and route schemas (M4, M5), and app code (M3).

## Expected outputs
`schema/*.schema.json`, `schema/README.md`, the scripts and fixtures (you choose their layout and say where they live in `schema/README.md`), `package.json` and its lockfile, `.github/workflows/data.yml`, `.gitattributes`, empty `data/locations/` and `data/media/` folders kept with `.gitkeep`, your row in `docs/PROGRESS.md`, and one row appended to `docs/BUDGET.md`.

## Acceptance criteria
- [ ] The brief §4 example, adapted to the final field names, passes as a fixture. Each invalid fixture fails with a message naming the file and field.
- [ ] Every validator rule in Scope item 3 has at least one failing test.
- [ ] The WEB text check runs offline in tests, and the CI setup is reproducible.
- [ ] On a clean checkout, `npm ci`, `npm test` and `npm run validate:data` all pass with empty data folders.
- [ ] The workflow runs on `pull_request` and on `push` to `main`.
- [ ] `schema/README.md` explains each GIS term in plain words, and the PR body's "Concepts for the human" covers JSON Schema, WGS 84 and `[lon, lat]`, each with a link.
- [ ] Committed as `feat(schema): add location and media schemas with validation CI`.

## Finish
Follow the session protocol in `.github/agents/gis-engineer.agent.md`. PR title: `feat(schema): location and media schemas with validation CI`.
