# M3-06 — Preview deploy and CP3b readiness

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-preview-deploy` |
| Depends on | CP3.5 approved (M3-04 and M3-05 are merged). The Cloudflare secrets were added on 2026-09-25 (see CHECKPOINTS.md → CP3a); this task's first preview deploy confirms that they work. |
| Parallel with | M3-14, M3-15 and M3-16 (CP3.5 decision 2). Once this merges, their PRs get preview links too. |
| Credit target | ~3,000 AI credits (session guard: 10,000; ADR-0025) |

## Goal
Deploy the MVP to Cloudflare Pages: a preview for every pull request and production from `main` (ADR-0010). Then confirm that the deployed app meets the spec's accessibility and performance targets, so the PO can write the CP3b summary.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0009 (the basemap fallback) and ADR-0010 (hosting)
- `docs/design/VISUAL_SPEC.md` §5, §7 and §11
- `.github/workflows/app.yml` from M3-02
- Cloudflare's guide to [Direct Upload with continuous integration](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- This card

## Scope
1. **Deploy jobs:** add them to `app.yml`, using `cloudflare/wrangler-action` at its current major version (confirm it on the action's release page).
   - The Pages project is `interactive-bible-map`. If it does not exist yet, create it with `wrangler pages project create`, with `main` as the production branch.
   - **Pull requests:** deploy the web export as a preview, and post the preview URL as a PR comment.
   - **Push to `main`:** deploy to production.
   - Deploy jobs **skip, and do not fail**, when the secrets are missing (for example on a fork).
   - Use only `secrets.CLOUDFLARE_API_TOKEN` and `secrets.CLOUDFLARE_ACCOUNT_ID`. Never print them.
2. **Smoke test on the deployed preview:** a scripted browser check, such as Playwright, run in CI against the preview URL. It checks that:
   - the map loads;
   - selecting Capernaum shows the panel, and both its lead AI image (served from the deploy's `media/ai/`) and a Wikimedia Commons photo load, each with its credit line;
   - searching "Antioch" gives two results;
   - opening `?place=emmaus` shows the disputed layout.
3. **Accessibility check:** run an automated check (for example axe) on the preview for the overview, an open place panel and the search box, and fix every serious or critical issue.
4. **Performance check:** run Lighthouse with the **desktop preset on a cold cache** against the preview (in CI, for example with Lighthouse CI), and assert the spec §11 gates: Largest Contentful Paint of 2.5 s or less and Total Blocking Time of 200 ms or less. Report the numbers in the PR.
5. **Docs:** add `docs/DEPLOY.md`, explaining how deploys work, where to find the preview URL, how to roll back, what to do if tiles fail (the ADR-0009 fallback), and how to renew the Cloudflare token with `scripts/setup-cloudflare-token.ps1`. The token expires on about 2027-09-25.

## Notes for the run
- **The secrets exist only on GitHub.** Neither the agent nor the local machine has the Cloudflare token, so the deploy jobs run for the first time when the PO pushes the branch, with the human's approval. Before that, check everything else locally:
  - run the smoke, accessibility and Lighthouse scripts against a local static server of `app/dist` (they take the base URL as an argument);
  - lint the workflow with `actionlint` if it is available.
  
  The PO checks the first real deploy after the push, and sends any fixes back.
- **CI runners have no GPU,** so WebGL runs in software (SwiftShader), as on the human's remote desktop (ADR-0024 update, M3-12). If a Lighthouse gate fails only because of this:
  - report the CI and local numbers side by side, and ask the PO;
  - never loosen a gate on your own.
- **Free-plan limits:** a Pages site may hold at most 20,000 files, and no file may exceed 25 MiB ([Pages limits](https://developers.cloudflare.com/pages/platform/limits/), read 2026-10-02). The deploy job checks that the export stays within both.

## Out of scope
New features, custom domains, and analytics.

## Acceptance criteria
- [ ] Before the push: the smoke, accessibility and Lighthouse scripts pass against a local server of the export. After the push (PO): this PR's own preview deploys, and the URL is posted on the PR.
- [ ] The smoke test passes against that preview.
- [ ] Automated accessibility checks report no serious or critical issues.
- [ ] The Lighthouse desktop gates from spec §11 pass in CI, and the numbers are in the PR.
- [ ] No secret values appear in logs, code or docs.
- [ ] Committed as `feat(deploy): add Cloudflare Pages preview and production deploys`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(deploy): Cloudflare Pages previews and production`. The PO writes the CP3b summary once this task, M3-14, M3-15 and M3-16 have merged.
