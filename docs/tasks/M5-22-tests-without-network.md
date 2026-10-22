# M5-22 — Browser tests without the network

| | |
|---|---|
| Agents | `frontend-engineer`; `fact-checker` for the fixture's licence; cross-vendor `pr-reviewer` |
| Branch | `chore/m5-22-tests-without-network`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | ADR-0045 (testing rules), ADR-0051 (it waits for M5-21: one PR at a time changes the map's code or the tests that drive it) |
| Credit target | ~2,500 (session guard: 8,000; ADR-0025) |

## Goal
The browser tests load the live basemap from OpenFreeMap, so a slow or failing response can make a test flaky. In CI run 39663644775 (#83), "normal loads stay on the main basemap in a 5s observation window" saw the app switch to the backup basemap, because the live tiles were slow. The project's rule is 0 flaky tests (ADR-0045). This card does the backlog's "Replay tile requests in browser tests": the tests replay recorded basemap requests, so they no longer depend on the network.

## Inputs (read only these)
- ADR-0045 and `docs/TESTING.md`.
- `BACKLOG.md`: "Replay tile requests in browser tests".
- `playwright.config.mjs`, `tests/browser/fixtures.mjs`, `tests/browser/*.spec.mjs` and `scripts/verify-web-export-playwright.mjs` (the fallback test is `verifyNormalLoadStaysOnMainBasemap`).
- The app's basemap and fallback logic (`app/src/features/map/`), read only.
- `ATTRIBUTION.md` and `docs/LICENSES.md` for OpenFreeMap, OpenMapTiles and OpenStreetMap.

## Scope
1. **Record once:** the requests the suite makes to OpenFreeMap (tiles, glyphs, sprites and any style resources), as a HAR file or a small extract. Keep it small and report its size; anything over about 15 MB needs a reason. Add a script that re-records it, and document how.
2. **Replay in every browser test,** through a fixture (for example `routeFromHAR` or route handlers). Any other outside request fails fast, so a new network dependency shows up at once.
3. **Fallback tests stay deterministic.** They simulate the main basemap failing with an aborted route or an error response, instead of waiting for the real service.
4. **Keep one live check:** the weekly `full-suite.yml` runs a short smoke against the real network, so upstream changes still get caught.
5. **Licence (fact-checker):** confirm that storing the extract as a test fixture is allowed and attributed (OpenMapTiles CC BY 4.0, OpenStreetMap ODbL), and that it never ships in the app.

## Out of scope
- Changing the app's fallback rules.
- Path filters for CI (BACKLOG).

## Acceptance criteria
- [ ] The browser suite passes with every outside request blocked, except the replayed ones.
- [ ] "Normal loads stay on the main basemap" passes 50 of 50 with `--repeat-each=50 --retries=0`, and the whole suite shows 0 flaky in CI.
- [ ] CI's browser time doesn't grow by more than about 10%, and the fixture's size is reported.
- [ ] The Fact-Checker signs off the fixture's licence and attribution.
- [ ] The PR description carries the budget row and the status (ADR-0051).
