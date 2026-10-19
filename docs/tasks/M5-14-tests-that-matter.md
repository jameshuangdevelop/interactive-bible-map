# M5-14 — Tests for what readers see and do

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `chore/m5-14-tests-that-matter`, stacked on M5-12 (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | M5-12 (the new runner); ADR-0044; ADR-0045 |
| Credit target | ~8,000 (session guard: 10,000; ADR-0025) |

## Goal
Protect the human's newest requests and the journeys the audit found unguarded (ADR-0045 item 1). Each new test names what it protects, carries a tag, and stays within 60 s.

## Inputs (read only these)
- `docs/TESTING.md` (read it first); `docs/DECISIONS.md` ADR-0044 (MC12), ADR-0042 and ADR-0041; `docs/design/VISUAL_SPEC.md` §2, §3, §5 and §7
- `tests/browser/` and its fixtures (M5-12)
- M5-09's PR body (`.git/PR_BODY_M5-09.md`, the checks it switched off)
- The PO's probes, which passed against M5-09's build and can be ported: `/tmp/mc13-m509-probe.mjs` and `/tmp/mc13-pin-probe.mjs`
- This card

## Scope
1. **MC12 (ADR-0044 items 1–6), tagged `@names` or `@routes`:**
   - no "+N" names at zooms 3–11;
   - clicking a name on the Map tab keeps the zoom (within 0.01), and pans only if the place would sit under the panel;
   - the red pin shows for a town (Tarsus, Ephesus) and not for an area (Galatia) or a place with candidates (Cana); on the modern map it shows without the name;
   - hovering a name sets its hover state and shows the pointer; away from names, and while dragging, the cursor is the arrow;
   - on the Routes tab with Paul's voyage to Rome and stage 4 selected: the route's place names show the pointer, open their places when clicked, and keep the stage; their names and dots aren't dimmed, while the other stages' lines are.
2. **Bring back every check M5-09 switched off** (#75's body), rewritten for names without groups, with a passing test for each. List each check and its replacement in the PR, and delete the `test.fixme`s.
   - `normalLoadMainBasemapChecks`: one short check that a normal load stays on the main basemap (M5-12 merges the four).
   - `overviewClusterOverlap`, `importantPlacesFirstCheck` and `overviewLabelReadabilityCheck`: on the opening map, the most important places' names show and stay readable, and no two names overlap.
   - `majorPlacesCoverageAcrossZoomsCheck`: becomes "Jerusalem shows at every zoom whenever it's on screen and nothing is selected", plus "the top 10 major places by importance show at their own zoom". ADR-0044 item 1 no longer forces every major to show.
   - `phoneBasicsChecks`: the bottom sheet's tap and drag, the controls hidden while it's open, the search box's margins and results, the toggle under the search box, and the drawer fitting the screen.
   - `routesFixtureChecks`: the ARIA tabs, stage hover greying the other lines without moving the camera, the number pill, the ODbL notice, and the phone sheet.
   - `routesRealDataChecks`: each real route's lines, stops and panel, with names that the route's places keep.
   - The smoothness checks (`smoothnessReal`, `smoothnessSynthetic`, `panelOpenSmoothness`): functional in CI (`@perf`), and enforced with `npm run test:browser:gpu`, with the synthetic 10,000 points drawn as names.
   - The cursor and touch sub-checks that became skippable: make their probes deterministic (pick targets from rendered features), so they never skip.
3. **Accessibility:** axe scans of the Routes tab with a route open, of the timeline with its Sources popover, and of the phone layouts (`@a11y`).
4. **Error states:** "Place not found" for an unknown `?place=`, and "Routes couldn't load." with "Try again" (`@panel` and `@routes`).
5. **Dead Jest tests:** delete `map-layer-layouts-test.ts`, whose module the app no longer uses, and the grouping tests in `major-name-groups-test.ts` (ADR-0044 item 1). Keep tests of anything still imported.
6. **If M5-10 is below this branch:** browser tests for its borders, unless M5-10 already added them:
   - dashed Kosovo–Serbia, West Bank and Green Line, with solid Albania–Kosovo and Israel–Egypt, read from the rendered features' layers;
   - every ancient border shown from zoom 5;
   - lands whose status is unclear dashed and not hatched (`@modern` and `@data`).

## Out of scope
The runner, the CI and the data tests (M5-12 and M5-13). New features.

## Acceptance criteria
- [ ] Each item above has a test whose title names what it protects, with a tag and a time limit of 60 s or less.
- [ ] No `test.fixme` or skipped test is left from M5-09.
- [ ] The new tests pass three times in a row locally (`--repeat-each=3 --grep "<new titles>"`) and in CI on the PR.
- [ ] `npm run lint`, `typecheck`, `test:all` and `export:web` pass, and `playwright test` passes in CI.

## Finish
Follow the session protocol in your agent file. PR title: `test(app): tests for what readers see and do`.
