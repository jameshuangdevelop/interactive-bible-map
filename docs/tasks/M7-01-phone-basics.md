# M7-01 — Phone basics

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m7-phone-basics` (from `main` after the M4 kickoff) |
| Depends on | CP3b decision 1 (approved 2026-10-07, #50) |
| Parallel with | M4-01, M4-02 and M4-03 (the data lane). M4-04 starts from this branch. |
| Credit target | ~1,500 (session guard: 10,000; ADR-0025) |

## Goal
People now open the shared site on their phones. On a phone, the opening map shows only Greece, so Rome and Jerusalem are off screen. Make the opening map and the place panel work on a phone. Full responsive polish stays in M7.

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §1 (small screens, including the room M4 needs), §2 "Zoom tiers", §7 (touch targets, keyboard)
- `docs/DECISIONS.md`: ADR-0024 (smoothness), ADR-0035 (important places first), ADR-0036 (run the full suite locally)
- `app/src/components/app-shell.web.tsx`, `app/src/features/map/map-view.web.tsx`, `app/src/features/map/constants.ts`, and the Playwright scripts in `scripts/verify-web-*.mjs`
- This card

## Scope
1. **The opening view fits the screen.** Replace the fixed opening centre and zoom (`DEFAULT_MAP_CENTER`, `DEFAULT_MAP_ZOOM`) with the bounds of the opening area, from Rome to Damascus and down to the Nile delta, fitted to the map's size. Take the bounds from today's desktop view, so a 1440 × 900 window looks as it does now (within 0.1 zoom). On a phone the same area then shows at a lower zoom. "Reset view" uses the same fit. `?place=` links still frame their place.
2. **The bottom sheet** matches spec §1: it opens at about 40% of the height with the photo and the title showing; a tap or a drag on its handle opens it fully and back; the close button sits at the top right; the map above it can still be dragged; and a selected place is framed in the part of the map above the sheet. Fix whatever doesn't work.
3. **Search on a phone:** the box spans the width with 16 px margins, and the results list, the menu and "Sources & credits" fit the screen.
4. **Important places on a phone:** at the phone's lower opening zoom, the major places still show as labelled pins grouped where they overlap (ADR-0035), with no labels on top of each other.
5. **Touch targets** of at least 44 × 44 px for the sheet's handle and close button, reset view, the gallery buttons and the "Show all" controls.
6. **Leave room for M4:** the "Ancient | Modern" toggle will sit at the top right just below the search box, and the timeline across the bottom while no place is open (spec §1). Put nothing there.
7. **Tests:** unit tests for the fit; Playwright checks at 390 × 844 and 360 × 800 for the opening view, opening a place, the sheet's states and search; the existing desktop checks still pass.

## Out of scope
The toggle and the timeline (M4-04, M4-05), gestures and performance work beyond the above, and other M7 polish.

## Expected outputs
- The app changes and tests.
- Before-and-after screenshots at 390 × 844 in the PR (opening view, and a place open in the sheet).

## Acceptance criteria
- [ ] At 390 × 844 and at 360 × 800, the opening map shows Rome, Athens, Ephesus, Antioch, Damascus and Jerusalem. At 1440 × 900 the opening view matches today's within 0.1 zoom.
- [ ] The bottom sheet opens at about 40%, expands, collapses and closes by tap and by drag, and the selected place stays visible above it.
- [ ] Touch targets are at least 44 × 44 px, and the smoke and accessibility checks also pass at a phone size.
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web` and `verify:web:playwright` pass.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): phone basics`.
