# M5-21 — The region outlines in the app

| | |
|---|---|
| Agent | `frontend-engineer`; cross-vendor `pr-reviewer` |
| Branch | `feat/m5-21-region-outlines-in-app`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | ADR-0050 and its 2026-10-20 update, ADR-0048 and its updates, ADR-0051 |
| Credit target | ~2,000 (session guard: 8,000; ADR-0025) |

## Goal
The human asked for the red dotted highlight "for all types of regions" (ADR-0050). #86 built outlines for 11 regions that hold no land, but the app doesn't use them yet. With this card, selecting one of them shows the light grey veil outside it and the red dotted line around it, as held land already does. The 11 regions are Galilee, Samaria, Judea (the region), Pontus once it holds no land (from AD 64), Crete, Libya, Chios, Cos, Malta, Rhodes and Samos.

## Inputs (read only these)
- ADR-0050 (`docs/DECISIONS.md`), especially item 5's order: a place's held land first, then the region's own outline, then the name alone. Also its 2026-10-20 update: the outlines load on first use, under their own 25,000 B gzip cap.
- ADR-0048 and its updates (the veil, the blue name, one blue name only), and ADR-0051.
- `app/src/features/map/map-view.web.tsx` and `selected-region-highlight.ts` (how #87 draws held land from `ancient.holder-unions.json`).
- The generated `ancient.region-outlines.json`, written by `scripts/lib/ancient-app-data-builder.mjs` from `data/geo/region-outlines.geojson`.
- `tests/browser/browser-checks.spec.mjs`: the existing veil and outline tests.

## Scope
1. **Order (ADR-0050 item 5):** when a selected region holds no land that year and has an outline, draw the veil and the dotted line from its outline. Pontus in AD 50 still shows the kingdom's land; in AD 70 it shows its outline. A region with neither, such as Pisidia, keeps its blue name only.
2. **Load on first use:**
   - fetch `ancient.region-outlines.json` the first time such a region is selected, never at startup, and keep it for the session;
   - until it arrives, show the blue name only, then the outline, with no jump of the camera or the labels;
   - if the fetch fails, keep the name-only state, with no error shown and no retry loop.
3. **Tests**, each failing without the change, with real selection (deep link or click):
   - Samaria at year 50: veil outside, none inside, outline drawn;
   - Pontus at year 70 (its outline) against year 50 (the kingdom);
   - Crete (an island);
   - Pisidia (name only);
   - the file isn't requested at startup, and is requested once on the first selection;
   - an aborted fetch leaves the name-only state.

   Run them with `--repeat-each=20 --retries=0`, then the `@names|@routes` group. 0 flaky.
4. **Speed:** no new long tasks on selection. The PO checks this headed, on a real GPU.

## Out of scope
- M5-20's seven regions.
- Loading `ancient.holder-unions.json` lazily too (BACKLOG).
- Any change to the outlines' data.

## Acceptance criteria
- [ ] The 11 regions show the veil and the dotted line by ADR-0050's order.
- [ ] The outlines load only on first use, and a failed load degrades to the name alone.
- [ ] `lint`, `typecheck`, `test:app`, `npm test`, `build:data` (both caps) and `export:web` pass, and CI is green with 0 flaky tests.
- [ ] The PR description carries the budget row and the status (ADR-0051), with headed screenshots of Samaria, Pontus at years 50 and 70, and Crete.
