# M3-24 — Lean CI

| | |
|---|---|
| Agent | `frontend-engineer` (owns CI, brief §3) |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `chore/m3-lean-ci`, started from the M3 stack's last branch (`feat/m3-important-places-first`) |
| Depends on | ADR-0036 |
| Parallel with | none |
| Credit target | ~1,500 AI credits (session guard: 10,000) |

## Goal
The human asked: "let's reexamine what we actually need for CI if local tests are consistently passing" (2026-10-07). ADR-0036 keeps fast checks and deploys in CI, runs the full browser suite locally and weekly, removes the duplicate data workflow, and checks only a PR's own images.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0034 and ADR-0036
- `.github/workflows/app.yml`, `.github/workflows/data.yml` and `.github/workflows/image-links.yml`
- `scripts/check-images.mjs` and its tests, and `docs/DEPLOY.md`
- This card

## Scope
1. **`app.yml`:**
   - Remove the "Install Playwright Chromium" and "Verify exported web app" steps from the build job.
   - Remove the Lighthouse step and the report upload from the preview checks.
   - Everything else stays: the build steps, the artifact, the preview and production deploys, the link comment, and the smoke and accessibility checks.
   - Don't change permissions, concurrency or the secret handling.
2. **New `full-suite.yml`:**
   - Runs on a weekly schedule (Monday, before the image check) and on `workflow_dispatch`, against `main`.
   - Steps: `npm ci`, `build:data`, `export:web`, install Playwright Chromium, `verify:web:playwright`.
   - Minimal permissions and a `timeout-minutes`.
3. **Remove `data.yml`.**
4. **Image links on PRs:**
   - Add a `--changed-since <git ref>` option to `scripts/check-images.mjs`. It checks only the images that are new or changed since that ref, comparing each `data/media/*.json` image entry (id, url, size fields), plus any changed AI files under `media/ai/`.
   - Without the option, the full check runs as today.
   - In `image-links.yml`, PRs pass the PR's base commit (check out with enough history, e.g. `fetch-depth: 0`). The weekly schedule and `workflow_dispatch` run the full check.
   - Add tests for the change detection: added, changed, unchanged and removed images, and AI files.
5. **Docs:** `docs/DEPLOY.md` says what CI runs on a PR, what runs weekly, what runs locally before a push, and why (ADR-0036).

## Out of scope
The checks themselves (no assertion or threshold changes), and the agent files and PO docs (the PO updates those).

## Acceptance criteria
- [ ] `actionlint` passes for all workflows.
- [ ] A PR's workflows no longer run the full Playwright suite or Lighthouse, and the build job's other steps are unchanged.
- [ ] `full-suite.yml` runs the full suite weekly and on demand.
- [ ] `check:images -- --changed-since <ref>` checks only new or changed images and is unit-tested; the full check still works without it.
- [ ] `npm run lint`, `npm test` and `npm run test:app` pass, and `npm run verify:web:playwright` passes locally once.
- [ ] `docs/DEPLOY.md` matches.

## Finish
Follow the session protocol in your agent file. PR title: `chore(ci): lean CI`.
