# Testing

Our tests protect two things: **the data is accurate**, and **readers can see and do what the spec promises**. Code coverage is not a goal. Every test must name the data fact or the user journey it protects. A test that only restates how the code works today (a "change detector") is deleted.

The suite must stay fast as the app grows:
- **Everything runs in parallel.**
- **Everything has a time limit.**
- **Cheap checks run first,** so a broken change fails in minutes, not after the whole run.

Decided in ADR-0045, from the human's request on 2026-10-18. The research and the audit behind it are summarised at the end.

## 1. Where a test belongs: sizes and time limits
Write each test at the lowest level that can catch the problem. A rule in the data validator beats a unit test, and a unit test beats a browser test.

| Size | What it may touch | Examples | Time limit | Runs |
|---|---|---|---|---|
| **Small** | Memory only: no network, no browser, no sleeps | Node tests in `tests/`, Jest tests in `app/__tests__/`, validator rules | 30 s per Node test, 10 s per Jest test; each whole suite should take under 30 s | Every PR, and locally on every change |
| **Medium** | Files on disk and localhost: the built data, the exported site served locally, a headless browser | `test:generated` (checks on the data that ships), the browser tests in `tests/browser/` | 60 s per browser test (up to 180 s for a few, each with a reason in the test); about 4 min per shard | Every PR, in parallel shards |
| **Large** | The real network or a real GPU | live basemap fallback against VersaTiles, Lighthouse, `bench:map`, the GPU smoothness gate | Per tool | Weekly on `main` and on demand; GPU checks on a desktop |

PR runs skip Large and quarantined tests (`@network`, `@gpu`, `@quarantine`); the weekly run includes them. Browser tests still load the real OpenFreeMap tiles until the tile requests are replayed from a recording (BACKLOG). Until then CI retries a failed test twice and reports it as flaky (§4).

## 2. What runs where

**On every PR, drafts included** (`.github/workflows/app.yml`):
1. **Fast gate,** in parallel: lint and type-check; unit tests (Node and Jest); `validate:data`. Target: under 3 minutes.
2. **Build,** only if the gate passes: `build:data`, `test:generated`, `export:web`. The export is uploaded once and reused by every later job. Target: under 4 minutes.
3. **Browser tests,** sharded: about 6 parallel jobs, each running its share of `tests/browser/`. Each shard stops after 5 failures. The shards' reports are merged into one HTML report. Target: under 4 minutes per shard.
4. **Preview:** the Cloudflare preview deploy, then smoke and accessibility checks against it.

The target for a PR's wall time is **under 10 minutes.** A newer push to the same PR cancels the older run.

**Weekly on `main`, and on demand:** everything above, plus the Large tests.

**On a desktop before a checkpoint (the PO):**
- Lighthouse: LCP and TBT, the median of 3 (ADR-0034);
- `npm run bench:map -- --mode headed`;
- the GPU smoothness gate (`@gpu`).

**Locally, while working:** the unit tests, plus the browser tests for the area you changed, e.g. `npx playwright test --grep @routes`. The full browser run is CI's job.

## 3. Failing fast and time limits
- Cheap checks gate expensive ones: no browser test starts while lint, the unit tests or the validator are red.
- Every test has a time limit: Node 30 s, Jest 10 s, browser 60 s by default.
- Every CI job has `timeout-minutes`. A hang fails the job; it never runs to GitHub's default of six hours.
- A browser shard stops after 5 failures. The shard matrix doesn't cancel sibling shards, so one run shows every failing area at once.
- Browser actions and waits without their own timeout fail fast at 15 s (`use.actionTimeout`).
- Browser navigations and page-load waits without their own timeout fail at 30 s (`use.navigationTimeout`).
- A visual-state test (hover colour, selected colour, highlight) must assert rendered output: pixels in a small clip around the target, or rendered features.
- A paint-expression string or a feature-state value alone is not enough: those can pass while nothing changes on screen. In #81 such a hover test passed while no name turned blue, because MapLibre had turned every string feature id into 0 (live since #75).
- No fixed sleeps longer than 0.5 s. Wait for a condition instead: the map's `idle`, a URL change, a visible element.

## 4. Flaky tests
- In CI a failed browser test is retried twice. A test that passes on a retry is reported as **flaky**, never silently green.
- A test that is flaky twice in a week is quarantined:
  - it's tagged `@quarantine`, which PR runs skip and the weekly run still includes;
  - it gets a `BACKLOG.md` entry with a one-week deadline.
  
  It is then fixed or deleted, never left skipped.
- **Delete, don't skip.** Before removing a test, name the faster test that protects the same fact or journey, or say why it no longer matters. Then delete it.

## 5. Adding a test
1. **Name what it protects.** For example, `test("clicking a name keeps the reader's zoom (ADR-0044 item 2)", …)`.
2. **Pick the lowest size that can catch the problem** (§1).
3. **Tag a browser test with its area:** `@data`, `@names`, `@routes`, `@panel`, `@timeline`, `@modern`, `@phone`, `@a11y` or `@perf`. Large tests also get `@network` or `@gpu`.
4. **Assert what the reader sees, through the map's own state:** `queryRenderedFeatures`, feature state, the URL, the DOM, rather than pixels. Screenshots are evidence for PRs, not tests.
5. **Stay within the time limit.** If a test needs more than 60 s, split it or say why in the test.

## 6. Keeping it fast as we grow
- Each PR's CI run prints its slowest tests.
- Each PR's `browser-report` job appends flaky/failed tests and the 10 slowest tests to the run summary page.
- When a shard passes 4 minutes, the shard count goes up.
- When a test passes its time limit, it's fixed, split or justified.
- The PO reviews flaky and slow tests at each checkpoint.

## 7. Background
- **The audit (2026-10-18)** covered 128 tests and checks: 55 of high value, 20 of low value.
  - One Node test file built the full ancient layer twice: about 95% of `npm test`'s 3–6 minutes.
  - The browser suite was one script running 60 checks in series, about 18 minutes in CI. A fixed 2.5 s sleep after every page load came to about 6 of those minutes.
- **The research** recommended:
  - `@playwright/test`'s workers, shards, retries, per-test timeouts and `maxFailures` [1–3];
  - GitHub Actions matrices, `timeout-minutes` and `concurrency` [4–6];
  - Google's test sizes [7];
  - avoiding change-detector tests [8];
  - mostly integration-level tests of what users do [9].

[1] https://playwright.dev/docs/test-sharding · [2] https://playwright.dev/docs/test-retries · [3] https://playwright.dev/docs/test-timeouts · [4] https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions#jobsjob_idtimeout-minutes · [5] https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs · [6] https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/running-variations-of-jobs-in-a-workflow · [7] https://testing.googleblog.com/2010/12/test-sizes.html · [8] https://testing.googleblog.com/2015/01/testing-on-toilet-change-detector-tests.html · [9] https://kentcdodds.com/blog/write-tests
