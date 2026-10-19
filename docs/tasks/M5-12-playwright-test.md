# M5-12 — The browser suite on `@playwright/test`, in parallel shards, with time limits

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `chore/m5-12-playwright-test`, stacked on `docs/m5-testing-strategy` (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0045; `docs/TESTING.md` |
| Credit target | ~10,000 (session guard: 12,000; ADR-0025) |

## Goal
Make the browser suite fast and scalable (ADR-0045 items 2–4). Each of today's checks becomes a `@playwright/test` test, tagged by area. CI runs them as about 6 parallel shards from one shared export, with time limits and failing fast. A PR's whole CI should take under 10 minutes of wall time, against about 25 today.

## Inputs (read only these)
- `docs/TESTING.md` (read it first) and `docs/DECISIONS.md` ADR-0045 and ADR-0036
- `scripts/verify-web-export-playwright.mjs` (today's suite), `scripts/lib/web-checks.mjs`, `scripts/verify-web-smoke-playwright.mjs`, `scripts/verify-web-axe-playwright.mjs`
- `.github/workflows/app.yml`, `.github/workflows/full-suite.yml`, `package.json`, `app/package.json`
- `.github/agents/frontend-engineer.agent.md`, `.github/agents/gis-engineer.agent.md` and `.github/agents/project-owner.agent.md` (their session protocols run the full suite locally)
- The PO's audit notes for the browser checks, pasted below under "Audit notes"
- This card

## Scope
1. **Runner.**
   - Add `@playwright/test` at the same version as `playwright` (1.63.0).
   - Add `playwright.config.mjs`:
     - `testDir: "tests/browser"`, `fullyParallel: true`;
     - `timeout: 60_000` and `expect.timeout: 10_000`;
     - in CI: `globalTimeout` 15 minutes, `retries: 2`, `maxFailures: 5` and `workers: 2`; locally: 0, 0 and 1 worker;
     - reporter `[["blob"], ["github"], ["list"]]` in CI and `list` locally;
     - `trace: "on-first-retry"`.
   - Use the same Chromium launch arguments as today's script.
2. **Fixtures** (`tests/browser/fixtures.mjs`):
   - **A worker-scoped `server`** that serves `app/dist` with today's static server on port 0 and gives `baseUrl`. Fixture-data variants, such as the timeline and routes fixtures, get their own server fixtures.
   - **An automatic test-scoped fixture** that fails the test on page errors, worker errors, or a request for a missing file. These replace today's checks over the whole run. Keep the "tiles were requested" and "worker loaded" checks in one test of their own.
3. **Every check becomes a test.**
   - Export each check function from the old script, or move it to `tests/browser/lib/`.
   - Call each one from `test("…what it protects…", { tag: [...] }, …)` in spec files grouped by area, using the tags and shards in the audit notes.
   - The 8 checks that share one page and its state become one `test.describe.serial` block, unless giving each its own page is cheap.
   - **Keep every assertion**; this is a move, not a rewrite. The PR lists every check before and after, with the counts equal.
   - Then delete the old `run()` and point `npm run verify:web:playwright` at `playwright test`.
4. **Cut the waiting, keeping every assertion:**
   - In `waitForMapToSettle`, replace the fixed 2.5 s sleep with a wait for the map to be idle (`loaded() && !isMoving() && areTilesLoaded()`) plus two animation frames.
   - The four 30 s "normal load stays on the main basemap" waits become **one** test with a 5 s window. The logic is already unit-tested in Jest.
   - The 10 screenshot captures that assert nothing (audit B05–B11, B38, B55, B56) run only with `EVIDENCE=1`.
   - `verifyNoOverlappingNamesAcrossViews` checks about 12 representative views instead of 76. List them, and say why they cover the risky cases: the densest clusters, the route views, the phone, each zoom tier.
5. **Smoothness:**
   - tag the checks `@perf`;
   - in CI they run as functional checks, as now, without enforcing long tasks;
   - `npm run test:browser:gpu` runs them headed and enforced, on a desktop.
6. **CI** (`app.yml`).
   - Split today's `build` job:
     - `static` (lint and type-check), `unit` (`npm test`, `npm run test:app`) and `validate` (`validate:data`) run in parallel;
     - `build` needs all three, and runs `build:data`, then `npm run --if-present test:generated` (added by M5-13), then `export:web`, and uploads `web-export`.
   - Add `browser`:
     - `needs: build`, a matrix of `shardIndex` 1–6 with `shardTotal: 6`, `fail-fast: false`, `timeout-minutes: 12`;
     - it downloads `web-export`, installs Chromium (`npx playwright install --with-deps chromium`), runs `npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}`, and uploads `blob-report-${{ matrix.shardIndex }}`.
   - Add `browser-report`: `needs: browser`, `if: always()`; it merges the blob reports (`npx playwright merge-reports --reporter html,github`), uploads the HTML report, and fails if any shard failed.
   - Every job gets `timeout-minutes`.
   - Add workflow-level concurrency: `group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.sha }}`, `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`, so a push to `main` is never cancelled.
   - The deploy jobs keep their conditions. `deploy_preview` needs `build`, not `browser`, so the human's preview link comes early.
   - In `full-suite.yml`, remove the `pull_request` trigger that #67 added, since `app.yml` now runs the suite on PRs. Keep the weekly and on-demand runs, with every tag, including `@network` tests.
7. **Docs and protocols:**
   - `README.md`'s testing section: how to run one test, a tag, or a shard, and how to open the HTML report.
   - In the three agent files: replace "run `npm run verify:web:playwright` (the full suite) before committing" with "run the unit tests and the browser tests for the area you changed, e.g. `npx playwright test --grep @routes`. CI runs everything (ADR-0045)".
8. **Measure.**
   - Local before and after: one full run of the old script against one full run of `playwright test` with 2 workers.
   - CI: the PR's own run, with each shard's time and the merged report's slowest 10 tests.
   - Put these numbers in the PR body.

## Audit notes (from the PO's audit, `test-audit.md`)
- **Tags:** `@data`, `@names`, `@routes`, `@panel`, `@timeline`, `@modern`, `@phone`, `@a11y`, `@perf`, `@fallback`. Tag the live-VersaTiles fallback checks `@network`.
- **The biggest browser costs:**
  - the 2.5 s sleep, about 350 s;
  - B01–B04, about 139 s;
  - B46, the Routes tab with real data, about 118 s;
  - B27, about 103 s;
  - B41, the timeline with real data, about 90 s;
  - the fallback checks B51–B56, about 65 s;
  - the smoothness checks B58–B60, about 48 s.
- **Checks switched off by M5-09:** `verifyPhoneBasics`, the Routes tab's fixture scenarios and others. Keep them switched off here, as `test.fixme` with the reason. M5-14 rewrites them.

## Out of scope
- New tests (M5-14).
- The Node and Jest tests (M5-13).
- Recording the tile requests for replay (BACKLOG).

## Acceptance criteria
- [ ] Every check from the old script runs as a test, with its assertions unchanged. The PR lists them all.
- [ ] `npx playwright test --grep @names` runs only the name tests, locally.
- [ ] On the PR, the browser shards each finish in under 4 minutes, and the whole CI in under 12 minutes of wall time. The target is 10; give the measured numbers.
- [ ] Every CI job has `timeout-minutes`; a hung test fails within its limit; a shard stops after 5 failures.
- [ ] `npm run lint`, `typecheck`, `test:all` and `export:web` pass, and so does the full `playwright test` run, locally once and in CI.

## Finish
Follow the session protocol in your agent file. PR title: `chore(tests): run the browser suite on @playwright/test, in parallel shards`.
