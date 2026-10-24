# M5-23 — Browser jobs in Playwright's container image

| | |
|---|---|
| Agent | `frontend-engineer`; cross-vendor `pr-reviewer` |
| Branch | `chore/m5-23-ci-playwright-container`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | ADR-0036 (lean CI), ADR-0045 (testing rules), ADR-0051 |
| Credit target | ~1,000 (session guard: 8,000; ADR-0025) |

## Goal
The human approved this card on 2026-10-23 (BACKLOG: "Cache Playwright's Chromium in CI"). On some runners the step "Install Playwright Chromium" takes 7–12 minutes, while each shard's tests take 0.5–2.0. Two of #91's runs had a shard cancelled at the old 12-minute limit after its tests had passed.

The time goes to `apt`, not to Chromium. In run 39951200313, shard 4, `--with-deps` fetched 25.9 MB of system packages "in 11min 15s (38.4 kB/s)", and then Chromium's own download took about 4 seconds. So caching `~/.cache/ms-playwright` would not help.

The fix is to run the jobs that use Chromium in Playwright's official container image, which already holds Chromium, its system packages and its fonts. Then no `apt` step runs.

## Inputs (read only these)
- `.github/workflows/app.yml`: the `browser` shards, and the job that runs the smoke test against the preview. Both run `npx playwright install --with-deps chromium`.
- `.github/workflows/full-suite.yml`.
- `package.json`: `@playwright/test` and `playwright`, both 1.63.0.
- `playwright.config.mjs`, `tests/browser/fixtures.mjs` and `docs/TESTING.md`.
- Playwright's docs on CI and Docker: https://playwright.dev/docs/ci and https://playwright.dev/docs/docker

## Scope
1. **Run those three jobs in `mcr.microsoft.com/playwright:v<version>-noble`,** pinned to the exact version in `package.json`.
   - Remove the `apt` install.
   - Keep Node 24 through `actions/setup-node`, as the other jobs use.
   - Follow Playwright's container advice (user, IPC and shared memory) for Chromium.
2. **A version check that fails fast:** a first step that compares the image's version with `package.json`'s `@playwright/test` and `playwright`, and fails with a clear message if they differ. Write in `docs/TESTING.md` that the image tag and the packages are bumped together.
3. **Everything else stays the same:** the shards, the basemap fixture's cache and fetch (`.cache/basemap-fixture`), the blob reports, `browser-report`, and the jobs' time limits.
4. **Fonts and rendering.** The container's fonts may differ from the runner's, so the full suite must still pass with 0 flaky, including the layout-sensitive tests: name overlaps, label sizes and panel layouts. If a test depends on a font that only the runner has, report it; don't loosen the test.

## Out of scope
- Changing tests, path filters, or caching npm.
- The app.

## Acceptance criteria
- [ ] Three CI runs on the PR, each with every browser shard green. Each shard's setup (pulling the container and preparing the job) takes under about 2 minutes, and no `apt` step runs.
- [ ] 0 flaky tests in all three runs.
- [ ] The total CI time before (#91's last run, 39951200313) and after is reported.
- [ ] The version check is shown to fail on a deliberate mismatch, on a throwaway commit or by running the check locally.
- [ ] `docs/TESTING.md` is updated. The PR description carries the budget row and the status (ADR-0051).
