# M5-17 — Failing fast, and fixing the flaky tests

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `chore/m5-17-fail-fast`, stacked on M5-15 (#80, `7d0ae8c`), beside M5-16 (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0045 (§3 failing fast, §4 flaky tests), M5-12 (the runner) |
| Credit target | ~2,000 (session guard: 3,000; ADR-0025) |

## Goal
When a test can't find a button, it should fail within seconds and name the button. Today it hangs until the 60 s test limit, and CI then retries it twice more. This card also fixes the two fragile spots that CI found this week, and makes flaky and slow tests visible on each run's page. The human asked for this: "Test time limit and failing fast should be a thing that's on your mind."

Evidence:
- **#79's run 39302620039.** A renamed handle (`button[aria-label$='place details panel']`) made `tap()` wait the full 60 s on each of 3 tries: 3 minutes for one stale name. `playwright.config.mjs` sets no `actionTimeout` or `navigationTimeout`, so actions, and waits without their own timeout, run until the test limit.
- **#79's run 39305827287.** `phone-sheet.spec.mjs:88` ("full sheet intentionally covers map, center, and attribution trigger") failed once, with "map-top-left should not expose map content at full", then passed on retry.
  - It probes `elementFromPoint` as soon as the handle reports `aria-expanded="true"`, while the sheet may still be sliding up.
  - Its siblings first poll for the sheet's top ≤ 8.
- **#80's delta review, nit.** `clickRouteStageCard` checks a point measured from the card's border box. `locator.click({ position })` measures from the padding box, so the checked point and the clicked point are 1 px apart.

## Inputs (read only these)
- `docs/TESTING.md` (read it first), and ADR-0045 in `docs/DECISIONS.md`
- `playwright.config.mjs`, and `tests/browser/` (the specs and `fixtures.mjs`)
- The helpers the specs import from `scripts/verify-web-export-playwright.mjs`, but only their waits and actions
- `.github/workflows/app.yml`: the `browser` and `browser-report` jobs
- [Playwright: timeouts](https://playwright.dev/docs/test-timeouts) and [`actionTimeout`](https://playwright.dev/docs/api/class-testoptions#test-options-action-timeout)
- This card

## Scope
1. **Time limits for actions and page loads.** In `playwright.config.mjs`, set `use.actionTimeout` (start at 15 s) and `use.navigationTimeout` (30 s).
   - `actionTimeout` works like `page.setDefaultTimeout()`. It also caps every `waitForFunction`, `waitForSelector`, `locator.waitFor`, `waitForEvent` and `waitForURL` that doesn't pass its own `timeout`.
   - Audit every such call that the tests reach, in `tests/browser/` and in the helpers they import. In the script, about 90 calls have no `timeout` on the same line.
   - Some waits legitimately take longer: the map's first load and idle, tiles, the ancient layers. Give each of those an explicit timeout, with a one-line reason.
   - Leave the actions (click, tap, hover, fill, press) on the default.
   - Check that contexts the helpers create with `browser.newContext()` get the same defaults. If they don't, apply them in `fixtures.mjs`.
   - **Prove it fails fast.** Temporarily point one locator at a missing name, and show that the test now fails in about 15 s per try with the locator in the message. Paste that output into the PR body, and don't commit the break.
2. **Fix the flaky full-sheet test** (`phone-sheet.spec.mjs:88`).
   - Before probing, wait until the sheet has settled at full: its top at the full position and unchanged across two animation frames, or its transition ended.
   - Keep the strict assertions.
   - Give the same settle wait to any sibling test that probes right after a snap.
3. **Fix the 1 px nit.** `clickRouteStageCard` checks exactly the point that Playwright will click: the padding-box origin, which is the border box plus `clientLeft` and `clientTop`, plus the same offset it passes to `click()`.
4. **Make flaky and slow tests visible.** In `.github/workflows/app.yml`, the `browser-report` job writes a short summary to the run's summary page (`$GITHUB_STEP_SUMMARY`):
   - every flaky or failed test: its title, file:line and the first line of its error;
   - the 10 slowest tests, which `docs/TESTING.md` §6 promises ("Each PR's CI run prints its slowest tests").
   
   Use `playwright merge-reports` with the JSON reporter and a small Node script, with no new dependency. The job must still pass when there is nothing to list.
5. **Docs.** In `docs/TESTING.md` §3, add the new limits, one line each.

## Out of scope
- New tests.
- Changing what any test asserts, except item 2's settle wait and item 3's click point.
- Retries, shards and `maxFailures`.
- App code.

## Acceptance criteria
- [ ] `actionTimeout` and `navigationTimeout` are set, and every longer wait passes its own timeout with a reason.
- [ ] The PR body shows the fail-fast proof from item 1.
- [ ] The full-sheet test passes 10 times in a row locally: `npx playwright test tests/browser/phone-sheet.spec.mjs -g "full sheet intentionally" --repeat-each=10 --workers=1`.
- [ ] The full suite passes in CI on the PR with 0 flaky, and the run's summary page shows the flaky and slowest tables.
- [ ] `npm run lint` and `typecheck` pass.

## Notes
- Run only the targeted tests locally, under the heavy lock (`lockf -k -t 7200 /tmp/ibm-heavy.lock …`). The full browser suite is CI's job (`docs/TESTING.md` §2).
- CI runs only on pull requests. The PO opens a draft PR for this branch (ADR-0046), so every push to it runs the full suite in about 10 minutes.

## Finish
Follow the session protocol in your agent file. PR title: `chore(tests): fail fast on stale locators, and fix the flaky tests`.
