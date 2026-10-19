# M5-13 — Fast data tests that check what ships

| | |
|---|---|
| Agent | `gis-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `chore/m5-13-fast-data-tests`, stacked on `docs/m5-testing-strategy` (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0045; `docs/TESTING.md` |
| Credit target | ~5,000 (session guard: 8,000; ADR-0025) |

## Goal
Cut `npm test` from 3–6 minutes in CI to under 30 seconds, without losing any check of the data's accuracy (ADR-0045 items 2 and 5). Real-data checks run against what ships, `build:data`'s output, instead of rebuilding the ancient layer inside unit tests. Two data facts that nothing protects today get rules of their own.

## Inputs (read only these)
- `docs/TESTING.md` (read it first) and `docs/DECISIONS.md` ADR-0045, ADR-0029 (the 31 major places) and ADR-0043 item 3 (water names)
- `tests/*.test.mjs`, especially `tests/build-app-data.test.mjs` and `tests/validator.test.mjs`
- `scripts/build-app-data.mjs`, `scripts/lib/*builder*.mjs`, `scripts/validate-data.mjs`, `scripts/lib/validator.mjs`, `package.json`
- The audit notes below
- This card

## Audit notes (from the PO's audit)
- **`tests/build-app-data.test.mjs`** builds the real ancient layer twice: 177–293 s in CI logs, about 95% of `npm test`.
  - One build comes from a test nested inside another test (about 90 s).
  - The other is `loadRealDataFixture()` (about 87 s).
  - `build:data` builds the same layer again in the same CI run.
- **Two tests are nested inside `pointInPolygon()`,** a helper, so they run as subtests in odd places.
- **`tests/validator.test.mjs`** takes about 30 s, 22.8 s of it in 36 route tests. Each rebuilds a whole-region surface model from tiny test geometry, 0.4–1.9 s each.
- **Low value:** `buildAncientAppData stress fixture stays under 300KB gzip` (7–11 s) is a synthetic margin test, and `build:data` enforces the real budget anyway. Delete it, or make it cheap.
- **Gaps:** no test pins the exact list of 31 major places (ADR-0029), and none checks that seas, lakes, rivers, gulfs and bays have `naturalFeatureKind: "water"`.

## Scope
1. **Check what ships.**
   - Move the real-data checks out of `tests/build-app-data.test.mjs` into `tests/generated/*.test.mjs`. They read `app/public/generated/` (`build:data`'s output) and fail clearly if it's missing.
   - Add `npm run test:generated`: `node --test "tests/generated/**/*.test.mjs"`.
   - `npm test` no longer runs them: exclude the folder.
   - **Keep every assertion;** the PR lists every moved test.
   - Delete the nested real-data build, and move the two tests out of `pointInPolygon()`.
2. **The validator's route tests:** build the surface model once per file, in a `before` hook or a memoised helper, instead of 36 times.
3. **Time limits and reports.**
   - `npm test` runs `node --test --test-timeout=30000`.
   - Print the 10 slowest tests at the end, e.g. with a small reporter in `tests/reporters/slowest.mjs`.
   - In `app/package.json`, set Jest's `testTimeout: 10000` and `slowTestThreshold: 2`. Remove `--runInBand` if the tests share no state; check by running them three times. Otherwise keep it, and say why.
4. **New data rules** (validator rules, so that `validate:data` and CI enforce them):
   - **Major places:** the places with `prominence: "major"` are exactly the 31 listed in ADR-0029. The list is a constant beside the rule, and changing it means changing the ADR too.
   - **Water names:** a natural feature whose English name contains Sea, Lake, River, Gulf, Bay, Strait or Sound must have `naturalFeatureKind: "water"`, unless it's on an explicit exceptions list, each exception with a reason.
   - Give each rule a test: a passing fixture and a failing one.
5. **Remove the low-value stress test,** or make it cheap; say which, and why it's safe.

## Out of scope
- The browser suite and the CI workflow files (M5-12). M5-12's build job runs `npm run --if-present test:generated` after `build:data`, so don't edit `.github/workflows/`.
- Jest tests' content (M5-14).

## Acceptance criteria
- [ ] `npm test` finishes in under 30 s locally (measure it three times, through the lock), and in CI on the PR.
- [ ] `npm run build:data && npm run test:generated` passes, and `test:generated` takes under 15 s.
- [ ] Every moved assertion is listed. None is deleted, except the stress test, if you delete it and say why.
- [ ] The two new validator rules pass on today's data and fail on their fixtures.
- [ ] `npm run lint`, `typecheck`, `test:all`, `validate:data` and `build:data` pass.

## Finish
Follow the session protocol in your agent file. PR title: `chore(tests): fast data tests that check what ships`.
