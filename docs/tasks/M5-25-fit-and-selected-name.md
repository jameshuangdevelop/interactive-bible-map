# M5-25 — Two map fixes: fits above the timeline card, and the selected region's name

| | |
|---|---|
| Agent | `frontend-engineer`; cross-vendor `pr-reviewer` |
| Branch | `fix/m5-25-fit-and-selected-name`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | ADR-0048 item 3, ADR-0050, ADR-0051 (one open PR changes the map's code) |
| Credit target | ~1,500 (session guard: 8,000; ADR-0025) |

## Goal
The PO found two bugs while checking M5-21 (#90). Both happen on the live site too. The human approved fixing them on 2026-10-23 (BACKLOG).

1. **Desktop camera fits ignore the timeline card.** `timelineBottomInsetForMap` in `app/src/components/app-shell.web.tsx` is 192 only on small screens with nothing selected, and 0 on desktop. So `fitBounds` and `focusSelection` can put the target behind the bottom timeline card.
   - Repro: desktop, 1440 × 900, `/?tab=map&place=malta&year=50`. Malta has two sites, Malta and Mljet; the camera frames both, and Malta, the likely site, lands behind the card.
   - With M5-21's veil, the visible map is then veiled while the outlined island is hidden.
2. **A selected region's blue name can be hidden.** ADR-0048 item 3 says a selected region shows its name in blue.
   - Repro: `/?tab=map&place=judea&year=50` and `/?tab=map&place=malta&year=50`. Both render no `ibm-selected-area-label` feature for the selected place.

## Inputs (read only these)
- `app/src/components/app-shell.web.tsx` (around `timelineBottomInsetForMap` and `timelineOverlayInsetForAttribution`).
- `app/src/features/map/map-camera.ts` (`resolveMapFitPadding`).
- `app/src/features/map/map-view.web.tsx`: `focusSelection`, `panSelectionIfOffScreen`, the routes' `fitBounds`, the selected area label layer, and `placementPriorityOrder`.
- ADR-0048 and ADR-0050 (`docs/DECISIONS.md`). Also `tests/browser/browser-checks.spec.mjs`'s existing camera and label tests.

## Scope
1. **Fits above the card.**
   - On desktop, count the timeline card's measured height in the bottom padding of every camera fit and focus while the card is visible. That covers place focus, candidate fits and the Routes tab's fits.
   - The phone layout stays as it is.
   - The "camera doesn't move" rules (ADR-0048 item 3) stay as they are.
2. **The selected name always places.**
   - Find out what hides it today: which layer it collides with, and why.
   - Fix it through placement priority only. The project's rule: every name layer keeps `text-allow-overlap` and `text-ignore-placement` false, and priority is set only by `placementPriorityOrder` (low to high) in `map-view.web.tsx`.
   - If a selected name still can't place in some view (its anchor off screen, for example), say so in the PR.
3. **Tests.** One browser test per fix. Each must fail before the fix and pass after. Poll map state with `expect.poll`, and check an absence only after a positive sign.

## Out of scope
- Phone layout changes.
- Moving labels' anchor points.
- Any change to which places have outlines.

## Acceptance criteria
- [ ] On desktop, Malta's deep link frames its sites above the timeline card, and the Routes tab's fits don't regress.
- [ ] The selected Judea (the region) and the selected Malta each show their blue name.
- [ ] `lint`, `typecheck`, `test:app`, `npm test` and `export:web` pass.
- [ ] The new tests pass with `--repeat-each=20 --retries=0`, then the `@names|@routes` group; CI shows 0 flaky.
- [ ] Headed before-and-after screenshots of both repros. The PR description carries the budget row and the status (ADR-0051).
