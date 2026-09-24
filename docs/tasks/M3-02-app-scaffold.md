# M3-02 — App scaffold, data build and CI

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-app-scaffold` |
| Depends on | CP3a approved |
| Parallel with | M3-07 (basemap attribution), M3-08 (modern names) |
| Credit target | ~800 AI credits (session guard: 1,500) |

## Goal
Deliver a working, empty app skeleton that the later M3 tasks build on: Expo with React Native Web and TypeScript, a data build step that turns `data/` into app-ready JSON, and CI that lints, type-checks, tests and builds on every PR.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §2, §3 (row 5), §6 and §8
- `docs/PROGRESS.md`
- `docs/DECISIONS.md`: ADR-0008 (MapLibre), ADR-0010 (Cloudflare Pages), ADR-0011 (no backend) and ADR-0013 (WEB edition)
- `docs/design/VISUAL_SPEC.md` §1 (layout), §6 (tokens), §7 (accessibility) and §11 (performance)
- `schema/README.md`, which describes the data you will read
- This card

## Scope
1. **App:** create the app in `app/` with Expo, on the latest stable SDK. Confirm the version on Expo's own site and record it in `app/README.md`. Use TypeScript in strict mode, with React Native Web as the target. Native builds are not required yet, but keep the code ready for them: where a later task needs a web-only library, it will add a `.native.tsx` stub.
2. **Repository layout:** the root `package.json` already holds the data tools (`npm test` and `npm run validate:data`). Choose a layout for both (npm workspaces are the likely fit), justify it in the PR, and keep every existing root command working unchanged.
3. **Data build** (`npm run build:data`):
   - It runs the data validator first, and **fails if validation fails**.
   - It writes `places.index.json` for the map and search: for each record, the `id`, `names`, `type`, `zoomTier`, `parentId`, and each candidate's `label`, `coordinates` and `confidence`. The target size is about 17 KB.
   - It writes one `places/<id>.json` per record: the full record, its media, and the bibliography entries its `bib:` sources refer to.
   - Output goes to the app's static folder and is **generated, not committed** (add it to `.gitignore`).
4. **App shell** (spec §1): a full-screen area for the map, a floating search-box placeholder and a panel placeholder. The design tokens (spec §6) live in one theme module. No map library yet; that is M3-03.
5. **Quality tools:** lint (ESLint with the Expo config), type-check (`tsc --noEmit`) and tests (the setup Expo recommends, such as Jest with React Native Testing Library). Add at least a smoke test of the shell and unit tests for the data build: the index fields, one file per record, resolved `bib:` entries, and a failure on invalid data.
6. **CI:** `.github/workflows/app.yml`, running on `pull_request` and on `push` to `main`:
   - it runs install, lint, type-check, test, the data build and the web export (`expo export --platform web`), and uploads the export as a build artifact;
   - it pins actions to their current major versions (confirm them on each action's release page, as M2 did);
   - it keeps `data.yml` unchanged.
   The preview deploy job is **not** part of this task (M3-06).
7. **Docs:** add `app/README.md`, explaining how to run the app locally, test it, build it, and where the generated data comes from.

## Out of scope
The map (M3-03), the place panel (M3-04), search (M3-05), and deploying (M3-06).

## Acceptance criteria
- [ ] On a clean checkout, these commands pass: install, lint, type-check, test, the data build and the web export. The existing `npm test` and `npm run validate:data` still pass.
- [ ] The data build rejects invalid data, and the generated files are ignored by git.
- [ ] CI runs on pull requests and on pushes to `main`, and passes.
- [ ] The PR body gives the gzipped size of the web export's JavaScript, and explains every dependency added.
- [ ] No secrets or API keys are in the repository.
- [ ] Committed as `feat(app): add Expo app scaffold, data build and CI`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(app): Expo app scaffold, data build and CI`.
