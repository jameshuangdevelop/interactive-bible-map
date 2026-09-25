# M3-06 — Preview deploy and CP3b readiness

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-preview-deploy` |
| Depends on | M3-04 and M3-05 merged. The Cloudflare secrets were added on 2026-09-25 (see CHECKPOINTS.md → CP3a). |
| Parallel with | none |
| Credit target | ~600 AI credits (session guard: 1,500) |

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
2. **Smoke test on the deployed preview:** a scripted browser check, such as Playwright, run in CI against the preview URL. It checks that the map loads, that selecting Capernaum shows the panel with a credit line, that searching "Antioch" gives two results, and that opening `?place=emmaus` shows the disputed layout.
3. **Accessibility check:** run an automated check (for example axe) on the preview for the overview, an open place panel and the search box, and fix every serious or critical issue.
4. **Performance check:** run Lighthouse with the **desktop preset on a cold cache** against the preview (in CI, for example with Lighthouse CI), and assert the spec §11 gates: Largest Contentful Paint of 2.5 s or less and Total Blocking Time of 200 ms or less. Report the numbers in the PR.
5. **Docs:** add `docs/DEPLOY.md`, explaining how deploys work, where to find the preview URL, how to roll back, what to do if tiles fail (the ADR-0009 fallback), and how to renew the Cloudflare token with `scripts/setup-cloudflare-token.ps1`. The token expires on about 2027-09-25.

## Out of scope
New features, custom domains, and analytics.

## Acceptance criteria
- [ ] This PR's own preview deploys, and the URL is posted on the PR.
- [ ] The smoke test passes against that preview.
- [ ] Automated accessibility checks report no serious or critical issues.
- [ ] The Lighthouse desktop gates from spec §11 pass in CI, and the numbers are in the PR.
- [ ] No secret values appear in logs, code or docs.
- [ ] Committed as `feat(deploy): add Cloudflare Pages preview and production deploys`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(deploy): Cloudflare Pages previews and production`. After it merges, the PO writes the CP3b summary.
