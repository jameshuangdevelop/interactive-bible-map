# CP5 evidence

Everything here is pinned to `main` at **`1ebaa67`** (#98's merge, 2026-10-30), unless it says otherwise. The PO collected it on 2026-11-05 UTC (2026-11-04 local). This file records what was checked; it isn't a plan.

## 1. The route data at `1ebaa67`
These were counted by script from `data/routes/routes.json`, `data/geo/routes-lines.geojson`, `data/routes/stops.json` and `data/locations/`.

| Check | Result |
|---|---|
| Routes | 10: `paul-1` (14 stages), `paul-2` (14), `paul-3` (15), `paul-rome` (8), `jesus-1` (10), `jesus-2` (4), `jesus-3` (7), `jesus-4` (7), `jesus-5` (2), `jesus-6` (2) |
| Stages | 83 |
| Line features | 71, one for each of 71 stages |
| Stages without a line | 12, all Jesus': `jesus-1` segments 01, 02, 05, 06 and 10; `jesus-2` 11 and 12; `jesus-3` 16 and 17; `jesus-4` 25 and 26; `jesus-6` 31 |
| Stages with no `sources` | 0 |
| Stages with no `scripture` | 0 (181 references, none without `textWEB`) |
| Jesus' stages with no `attestation` (its `gospels` and `rule`) | 0 of 32 |
| Route stop entries without a place record | 0 |
| Location records | 122, all `verified` (89 at CP4) |
| Bibliography entries | 238 (185 at CP4) |

The data's sign-off is in `docs/verification/M5-24-jesus-journey-parts.md`:
- The research was signed off with corrections 1–28, and the re-check with R1–R5.
- Phase 3, the data, was signed off with D1–D6, applied verbatim in `aaf2e5e`. #95's delta review confirmed it.

## 2. CI and the live site
| Run | What | Commit | Result |
|---|---|---|---|
| [41134029891](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/41134029891) | #98's last PR run | `920ae01` (#98's head) | Every job passed: `static`, `unit`, `validate`, `build`, browser shards 1–6, `browser-report`, and the preview deploy and its checks |
| [41135111739](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/41135111739) | Push to `main` | `1ebaa67` | `static`, `unit`, `validate` and `build` passed, and the production deploy succeeded. The browser jobs run on PRs only, so they were skipped here |
| [41485773641](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/41485773641) | Weekly full browser suite, 2026-11-02 | `1ebaa67` | 125 passed, 3 skipped, in 6.5 min; then 3 smoke tests passed in 45.2 s |
| [41505344862](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/41505344862) | Weekly image-link check, 2026-11-02 | `1ebaa67` | Passed |
| https://interactive-bible-map.pages.dev | Production | — | HTTP 200 on 2026-11-05 UTC |

## 3. Test health (TESTING §6)
The source is #98's `browser-report/report.json` from run 41134029891 ([artifact](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/41134029891/artifacts/13015946512)). Its log says "No flaky or failed tests".

- **Totals:** 125 expected, 3 skipped, 0 unexpected, 0 flaky.
- **The 3 skips:**
  - 2 optional tests that only capture screenshots as evidence;
  - 1 fixture case for a missing timeline.

  None of them is a GPU or speed check.
- **The 10 slowest,** all under the 60 s limit for each browser test:

  | Test | Time |
  |---|---|
  | Drawing real routes | 48.705 s |
  | Normal basemap load | 40.287 s |
  | Smoothness with 10,000 places | 39.526 s |
  | Next seven | 26.668, 25.090, 25.085, 19.500, 19.377, 19.055 and 18.495 s |

- **Action:** none. No test passed its limit, and no test is flaky.

## 4. MC11: the desktop speed gate (done, with one caveat)
The Frontend Engineer ran these on 2026-11-05 UTC, on an Apple M1 desktop. They ran against the export of `main`'s CI run 41135111739 (`1ebaa67`), reused unchanged. Its artifact digest is `sha256:0dbd366084c3020d4be1acfe82fdc0628a4133d530e3f45c9cc6634ed3042913`.

These are fresh desktop runs. They are separate from CI's results in §2 and §3, which run in software and don't count as speed evidence (ADR-0034, ADR-0036).

| Check (command) | Renderer | Gate | Result |
|---|---|---|---|
| `npm run verify:web:lighthouse -- --report-path <output>`, median of 3, gates enforced | SwiftShader (software). The script runs headless with the GPU disabled, so this isn't a real-GPU measurement | LCP ≤ 2,500 ms, TBT ≤ 200 ms | **Pass:** LCP 1,871.96 ms, TBT 0 ms |
| `npm run bench:map -- --mode headed --json <output>` | ANGLE Metal Renderer: Apple M1 (hardware; `software: false`) | Reported | All 5 app scenarios had 0 long tasks. Their worst frame intervals were 17.8, 17.7, 17.7, 33.3 and 33.3 ms |
| `SMOOTHNESS_REQUIRE_GPU=1 npm run test:browser:gpu -- --reporter=list,json` | Headed Apple M1; renderer measured separately. The environment variable forces long-task enforcement, not renderer detection | Every test passes | **The first run had 1 failure:** the opening camera assertion failed. One rerun passed all 3 tests. See below |

**About the GPU result.** The existing `test:browser:gpu` script selects `@perf` tests in headed mode. The opening-camera failure stays an open caveat after MC11.
- **The first run** (`playwright-gpu-main-1ebaa67.json`): 0 passed, 1 unexpected and 2 skipped, because `maxFailures` is 1. The failure was the opening camera's position, not a long task. At 1440 × 900, the camera's reading when the check failed was zoom 6.213834215663411, centre [17.560404234315683, 34.63922002879825].
- **One rerun** (`playwright-gpu-main-1ebaa67-rerun.json`): 3 passed.
- **This desktop run isn't a clean one with 0 flaky tests.** It's a failure followed by a passing rerun. The evidence was reviewed, but no cause was established.
- **Human review:** check that the opening map stays still after it loads. No camera fix is claimed by this documentation PR.

**Evidence files:** these are kept outside the repository, in the PO session's `files/cp5-performance/` folder:
- `lighthouse-main-1ebaa67.json`
- `bench-map-headed-main-1ebaa67.json`
- `headed-renderer-main-1ebaa67.json`
- `playwright-gpu-main-1ebaa67.json` (the first run)
- `playwright-gpu-main-1ebaa67-rerun.json`

## 5. Mini checkpoints closed without a new play-test
- **MC10b:** closed by ADR-0043 (items 6 and 7) and ADR-0046. #69 and #70 merged on 2026-10-19, after MC12's play-test.
- **MC13:** closed when #75 and #76 merged on 2026-10-19. The notes on #75 became ADR-0048. P4 kept the PO's defaults (`docs/verification/M5-borders.md`, `5251b96`).

At the initial collection above, no human play-test had been recorded since #98 merged. The subsequent approvals and follow-up are recorded below.

## 6. Approved closeout and M6 handoff (2026-11-05)
- The human approved CP5 by merging #99 at 2026-11-05 07:18:25 UTC. The M5-26 interaction follow-up, including the later pointer/sea-framing/disputed-line feedback, was approved and merged as #100 at 22:10:01 UTC (`fde21d1`).
- #100's final [run 42116927874](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/42116927874) passed on `655ec2a`: static checks, unit tests, data validation, build, all six browser shards and `browser-report`, plus preview smoke/accessibility. The report records 139 passed, 3 documented skips, 0 flaky and 0 failed. All 12 disputed-stage rendering cases were executed, including actual rendered-line assertions.
- The merge's [main run 42119126869](https://github.com/jameshuangdevelop/interactive-bible-map/actions/runs/42119126869) passed and deployed `fde21d1` to production, which returned HTTP 200 on 2026-11-05. Main skips the PR browser shards; its implementation files match the tested PR head.
- The dataset remains 122 verified locations, 10 routes and 83 stages, with 71 canonical line features. The 12 disputed stages now have client-rendered illustrative connections with a visible uncertainty disclaimer (ADR-0052), rather than hidden lines. Candidate coordinates/indices, historical claims, scripture, attestation and sources were not changed; 17 display-policy strings were updated so their wording matches the UI.
- All current route stops are full place records: `data/routes/stops.json` has no entries and no stage references `kind: "route-stop"`. Do not repeat that completed M5 work in an M6 batch.
- The #100 build reports 347,091 bytes gzip across the ancient files; subtracting the 19,209-byte lazy region outlines yields 327,882 / 330,000 startup bytes, leaving 2,118 bytes. Routes is 26,305 / 100,000 bytes gzip. The startup exclusion is enforced in `scripts/lib/app-data-builder.mjs`.
- The original MC11 measurements in section 4 remain pinned to `1ebaa67`; they are not fresh real-GPU measurements of #100. The unexplained first camera assertion failure remains an accepted historical caveat, not erased by the later clean functional CI.
- The human has assigned another agent to lead M6. `docs/PROGRESS.md` gives the exact resume point: fresh `main`, authoritative November budget confirmation, the outstanding CP2 unmapped-candidate requirement and a measured capacity plan, then a deduplicated first-batch proposal. The outgoing PO has not started M6 records or task cards.
