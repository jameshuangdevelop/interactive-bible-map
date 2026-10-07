# Deploying the Interactive Bible Map

The app deploys from `.github/workflows/app.yml` to Cloudflare Pages (`interactive-bible-map`).

## Site URLs

- **Production:** `https://interactive-bible-map.pages.dev`
- **PR preview branch alias:** `https://pr-<number>.interactive-bible-map.pages.dev`
- **PR comment:** each preview deploy also updates one bot comment (`<!-- ibm-preview-url -->`) with the resolved preview URL.

## What runs in CI (ADR-0036)

- **App workflow (`.github/workflows/app.yml`)**
  - **Build job (all PRs and pushes to `main`)**: lint, type-check, tests, data validation, data build, and web export.
  - **Preview deploy (PRs only)**:
    - downloads the exported `app/dist` artifact;
    - checks Cloudflare Pages free-plan limits (<= 20,000 files, <= 25 MiB per file);
    - creates the Pages project if missing (`interactive-bible-map`, production branch `main`);
    - deploys a preview with Wrangler;
    - updates one PR comment with the preview URL.
  - **Preview verification (PRs with secrets available)**: smoke test and axe serious/critical gate against the preview URL.
  - **Production deploy (pushes to `main`)**: same artifact + limits check, then deploys to the production branch in Pages.
- **Image link workflow (`.github/workflows/image-links.yml`)**
  - **PRs touching `data/media/**` or `media/**`**: runs `npm run check:images -- --changed-since <PR base SHA>`, so only this PR's changed images are checked.
  - **Weekly schedule + `workflow_dispatch`**: runs the full image-link check.
- **Full browser workflow (`.github/workflows/full-suite.yml`)**
  - Runs weekly on Monday (`07:00` UTC) and on demand (`workflow_dispatch`), on `main` only.
  - Runs `npm ci`, `build:data`, `export:web`, Playwright Chromium install, and `verify:web:playwright`.

## What runs locally before a push (ADR-0036)

For app changes, run the fast checks plus the full browser/speed checks locally before pushing:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:app`
- `npm run validate:data`
- `npm run build:data`
- `npm run export:web`
- `npm run verify:web:playwright`
- `npm run verify:web:lighthouse -- --base-url <preview-or-local-url>`

ADR-0036 moved the full Playwright suite and Lighthouse off per-PR CI to keep PR workflows fast and reduce failures caused by shared runners and external services, while still keeping deploy, smoke, and accessibility coverage in CI.

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

This script creates a new Pages-scoped Cloudflare token and stores both
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in this repository's GitHub
Actions secrets (without printing token values).
