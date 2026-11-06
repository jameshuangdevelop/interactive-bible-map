# M6-02 - Store the ancient layer's repeated parts once

| | |
|---|---|
| Agents, in order | `gis-engineer` (build) → `frontend-engineer` (loader); `pr-reviewer` (independent) |
| Branch | `feat/m6-02-ancient-stop-catalogue`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | #102 merged; ADR-0053 (the human approved the capacity plan on 2026-11-06) |
| Scheduling | The single open map-code PR (ADR-0051 item 4). Data PRs M6-04 and M6-05 run alongside it |
| Status | In progress |

## Goal
The ancient startup layer is 327,882 / 330,000 bytes gzip, leaving 2,118 bytes, so almost any change to the timeline, areas or labels would break the build. The 15 timeline stop files repeat the same areas, borders and labels: 420 area entries hold 72 unique ones, 594 border features 44 unique geometries, and 372 labels 45 unique ones. The PO's simulation on `6924180` stored each unique entry once and had the stops refer to it. The stop files fell from 142,785 to 18,603 bytes gzip, which would bring startup to about 203,700, and the round trip was identical. This card makes that change without changing any geometry, label or rule, so the map draws exactly as before.

## Design
- **Build** (`scripts/lib/ancient-app-data-builder.mjs`):
  - Write one startup file, `ancient.stop-catalogue.json`, holding the unique `areas` entries, `holderBorders` features and `holderLabels` entries.
  - Each `ancient.stop.<id>.json` keeps every other field unchanged and replaces those three arrays with ordered arrays of catalogue indices.
  - Order and content must round-trip exactly: reconstructing a stop from the catalogue gives an object deep-equal to today's stop.
  - If a later small field also repeats heavily (for example `holderUnions` or `romanSideUnion`), measure it and say so in the PR, but leave it out of scope unless it's trivial.
- **Caps:**
  - `ancient.stop-catalogue.json` counts toward the ancient startup sum, and the 330,000-byte cap stays as it is.
  - Add a cap on `places.index.json` of **30,000 bytes gzip** (today 7,161, about 59 bytes per place), so M6's growth shows in CI. It goes in `scripts/lib/app-data-builder.mjs` with a test like the other caps.
  - Change no other cap.
- **App:** wherever `app/src/features/map/map-view.web.tsx` fetches `ancient.stop.<id>.json` (around line 3342), fetch the catalogue once, cache it, and rebuild each stop's three arrays before the existing code uses the stop. Downstream map code receives the same in-memory shape as today. If the catalogue fails to load, follow the same error path as a failed stop fetch. Keep `cache: "no-store"` (the project-wide choice).
- **No geometry is simplified, moved or dropped.** No label point, border style or zoom changes.

## Scope by step
1. **gis-engineer:**
   - The builder change, the catalogue file and the index cap.
   - Small tests:
     - every built stop, reconstructed from the catalogue, is deep-equal to the stop the previous builder logic produces (compute the legacy shape in the test, or compare against a reconstruction of the pre-change output);
     - the catalogue is in the startup sum;
     - the index cap fails when exceeded.
   - `schema/README.md` or the builder's docs, wherever the generated files are listed.
   - Measure and report every ancient file's gzip size before and after.
   - Remove `BACKLOG.md`'s "Share border geometry across the ancient layer's stops" item, and update the M4-03 deferred finding about repeated per-area metadata.
2. **frontend-engineer:**
   - The loader change in `map-view.web.tsx` (and types in `ancient-layer.types.ts` if needed).
   - Small unit tests for the reconstruction helper if it lives in its own module (preferred: a small pure helper next to the map types).
   - Every existing `@timeline`, `@names`, `@modern` and `@routes` browser test passes unchanged.
3. **pr-reviewer:** an advisory review.

Don't edit `docs/PROGRESS.md` or `docs/BUDGET.md` (ADR-0051).

## Acceptance criteria
- [ ] The round-trip test passes for all 15 stops, and no geometry or label changed (identical objects).
- [ ] The ancient startup layer, including the catalogue, measures about 210,000 bytes gzip or less (target from the simulation: about 203,700). The PR gives the exact before/after per file. The cap stays 330,000.
- [ ] `places.index.json` has a 30,000-byte gzip cap with a test.
- [ ] The browser suite passes in CI with 0 flaky and 0 failed tests; `@timeline` is unchanged.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:app`, `npm run validate:data`, `npm run build:data`, `npm run test:generated`, `npm run export:web` and `npx playwright test --grep "@timeline|@names"` pass locally.
- [ ] The PR uses the template, explains "lossless deduplication" for the human with a link, and gives a budget row for each session.

## Stop conditions
- If the stops can't round-trip exactly, stop and report. Don't accept a near-match.
- If the map needs changes beyond loading and reconstructing the stops, stop and report.
- Session guard: 10,000 credits per session (ADR-0025).
