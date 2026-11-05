# M6-01 - Candidate sites without a coordinate (CP2 decision 3)

| | |
|---|---|
| Agents | `gis-engineer` (schema, validator, build) → `research-lead` (Sychar's data) → `frontend-engineer` (panel) → `fact-checker` (sign-off); `pr-reviewer` (independent) |
| Branch | `feat/m6-01-unmapped-candidates`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | #101 merged; CP2 decision 3 (approved with #14, 2026-09-24) |
| Scheduling | Pre-expansion prerequisite: no M6 batch record is written before this merges. Not map code: nothing in `app/src/features/map/` changes |
| Status | In progress |

## Goal
CP2 accepted a text-only mention for a candidate site that has no usable, licensable coordinate, and an explicit "unmapped candidate" field in the schema before M6. Today `candidates[]` requires coordinates, so Sychar's second proposal, Askar, exists only in prose. M6 batches will meet more such proposals, which must be recorded without guessing a coordinate or silently dropping them.

## Design (PO decision, within CP2's approval)
- **A new optional top-level array, `unmappedCandidates`,** on location records. `candidates[]` stays as it is: at least one entry, each with coordinates. So every `candidateIndex` in `data/routes/`, the URL and the panel's candidate letters keeps its meaning, and the map code doesn't change.
- **Each entry** has `label`, `confidence` (the same enum), `support` (neutral text), `reason` (why no coordinate is given, stated neutrally) and `sources` (at least 2 source IDs, the same floor and resolution rules as mapped candidates). `additionalProperties: false`, so an entry can't carry `coordinates`, `coordinateSource`, `politicalAreaId` or overrides.
- **Validator:** labels are unique across a record's `candidates` and `unmappedCandidates`; every source resolves; the array, if present, isn't empty.
- **Build:** entries travel only in the place's lazy payload (`places/<id>.json`). They never reach map render data, the ancient layer or the routes. `places.index.json` gets at most a count, and only if the panel's header needs it before the payload loads.
- **Panel:** after the mapped candidates, list each unmapped proposal without a letter. Each is clearly marked as not on the map (for example "Not on the map: no verified coordinate"), with its confidence, expandable support, reason and sources, formatted like the mapped candidates'. When a record has unmapped proposals, the header's count includes them and says how many are on the map (for example "2 proposed sites · 1 on the map"). Nothing is drawn or clickable on the map for them, and search is unchanged. Works in the phone sheet and with a screen reader.
- **Sychar:** Askar becomes an `unmappedCandidates` entry, with at least 2 accepted sources that state the proposal. The prose that now explains Askar's absence ("see history for why Askar is not") is adjusted so the record doesn't say the same thing twice. Askar gets no coordinate. The Tell Balata candidate's coordinate, confidence and sources stay unchanged unless the Fact-Checker requires a change.

## Scope by step
1. **gis-engineer:** `schema/location.schema.json`, `scripts/lib/validator.mjs`, `scripts/lib/app-data-builder.mjs` (place payload only), small tests in `tests/`, and a new "Unmapped candidates" section in `schema/README.md`. Include one test fixture with an unmapped entry. Don't edit `data/locations/`.
2. **research-lead:** `data/locations/sychar.json` only, plus any new `bib:` entries in `data/bibliography.json` and `ATTRIBUTION.md` if a new upstream source is added. Every clause is stated by a cited source (ADR-0017), the wording is neutral, and the Bible text is WEB only.
3. **frontend-engineer:** `app/src/features/place-panel/` (and its types), one `@panel` browser test in `tests/browser/browser-checks.spec.mjs` or a new spec file, and unit tests where the panel model gains logic. No changes in `app/src/features/map/`.
4. **fact-checker:** `docs/verification/M6-01-unmapped-candidates.md`: Sychar's new entry against its sources, the neutrality of the panel's wording, and that no coordinate was invented.
5. **pr-reviewer:** an advisory review of the whole PR.

Remove the "Unmapped candidates before M6" item from `BACKLOG.md` in this PR. Don't edit `docs/PROGRESS.md` or `docs/BUDGET.md` (ADR-0051).

## Acceptance criteria
- [ ] Validator tests reject: coordinates in an unmapped entry; fewer than 2 sources; an unknown source ID; a label duplicated across `candidates` and `unmappedCandidates`; an empty array.
- [ ] A build test shows that unmapped entries reach the place payload and no map, ancient or route output.
- [ ] Measured: the ancient startup layer stays at 327,882 bytes gzip. The PR reports the `places.index.json` and Sychar payload deltas.
- [ ] A `@panel` browser test: Sychar's panel lists Askar as not on the map, with its sources, and no map feature or candidate letter exists for it. It fails before the change.
- [ ] Sychar's record validates, and the Fact-Checker signs it off.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:app`, `npm run validate:data`, `npm run build:data`, `npm run test:generated` and `npm run export:web` pass locally, plus `npx playwright test --grep @panel`; the PR's CI passes every required check.
- [ ] The PR uses the template and gives its status and a budget row for each session; no shared ledger edits.

## Stop conditions
- If no 2 accepted sources state Askar's proposal, stop and report to the PO. CP2's fallback keeps the text-only mention; don't use a weaker source to reach 2.
- If a change in `app/src/features/map/` seems necessary, stop and report: another PR may own the map code (ADR-0051 item 4).
- Session guard: 10,000 credits per session (ADR-0025).
