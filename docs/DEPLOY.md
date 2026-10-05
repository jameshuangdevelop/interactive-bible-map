# Deploying the Interactive Bible Map

The app deploys from `.github/workflows/app.yml` to Cloudflare Pages (`interactive-bible-map`).

## What runs in CI

- **Build job (all PRs and pushes to `main`)**: lint, type-check, tests, data validation, data build, web export, and Playwright export verification.
- **Preview deploy (PRs only)**:
  - downloads the exported `app/dist` artifact;
  - checks Cloudflare Pages free-plan limits (<= 20,000 files, <= 25 MiB per file);
  - creates the Pages project if missing (`interactive-bible-map`, production branch `main`);
  - deploys a preview with Wrangler;
  - updates one PR comment with the preview URL.
- **Preview verification (PRs with secrets available)**: smoke test, axe serious/critical gate, and Lighthouse desktop cold-cache gate (LCP <= 2.5 s, TBT <= 200 ms) against the preview URL.
- **Production deploy (pushes to `main`)**: same artifact + limits check, then deploys to the production branch in Pages.

Deploy jobs skip automatically when `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` is missing (for example, fork PRs).

## Required GitHub secrets

Set these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not store these values in source files, docs, or logs.

## Finding the preview URL

Each PR deploy updates a single bot comment marked with `<!-- ibm-preview-url -->`.  
Use that link for manual spot checks and any external review.

## Rollback

Use one of these paths:

1. **Cloudflare Pages dashboard**: open `interactive-bible-map` -> Deployments, then promote a known good production deployment.
2. **Git rollback**: revert the bad change on `main`; the production deploy job publishes the reverted build.

## If map tiles fail (ADR-0009 fallback)

The app automatically switches to the backup VersaTiles style when repeated main-tile failures happen, and shows:

`The main map service isn't responding. Showing the backup map.`

If this appears in production:

1. confirm the fallback message and backup attribution render;
2. check whether the main OpenFreeMap service outage is transient;
3. keep backup tiles enabled until the main service is stable again.

## Renewing the Cloudflare token

The current token expires around **2027-09-25**. Renew it before expiry with:

```powershell
.\scripts\setup-cloudflare-token.ps1
```

After renewal, update the GitHub repository secret `CLOUDFLARE_API_TOKEN`.
