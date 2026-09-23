# M1-02 — Stack and hosting options with pricing

| | |
|---|---|
| Agent | `gis-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `docs/m1-stack-options` |
| Depends on | CP0 approved |
| Parallel with | M1-01 (the only shared files are your rows in `docs/PROGRESS.md` and `docs/BUDGET.md`) |
| Credit target | ~550 AI credits (session guard: 1,500) |

## Goal
Give the human enough to pick the stack at CP1: at least two options for each decision, each with pros and cons, monthly cost, a free-tier option and a recommendation.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §3 (rows 4 and 5), §5 (M1) and §8
- `docs/PROGRESS.md`
- This card

## Decisions to cover (at least 2 options each)
1. **Map library** for React Native Web now and a native app (for example Expo) later. For each option, cover: web support, the native path, vector tiles, custom GeoJSON overlays (provinces, roads, routes), marker clustering, license, and how actively it is maintained. The Frontend Engineer confirms the pick at the start of M3.
2. **Basemap and tiles**: the modern basemap, plus how the ancient basemap would be made (hosted vector tiles, a self-hosted tile archive, raster tiles, or overlays on a neutral base). For each option, cover:
   - **Borders:** can it show the borders a mainstream basemap shows, and can contested borders be hidden (brief §1.2)?
   - Required attribution, whether an API key is needed, and usage limits.
   - Where an option depends on a source M1-01 is evaluating (for example AWMC tiles), say so and leave its license research to M1-01.
3. **Hosting** for a static web app with data files, including a preview deploy for each PR from GitHub Actions.
4. **Is a backend needed?** Compare static files only (with client-side search over JSON) against a small API or database, and recommend one with reasons. Expected data: about 300 locations, provinces for about 8 timeline years, roads and routes.

## Pricing
- Use two traffic levels: **hobby** is 1,000 visits a month and **moderate** is 50,000 visits a month. Estimate map and tile requests per visit and show the calculation.
- Give the monthly cost in US$ at each level, and a free-tier option in each category.
- Cite every price with its URL and the date read. Say what happens at the limit: a hard cap or extra charges.

## Also deliver
- `docs/research/LEARNING.md`: a short learning list for the human, with at most 15 links and one line each on why it is useful. Cover GIS basics (coordinates and `[lon, lat]`, projections and Web Mercator, vector vs raster tiles, GeoJSON), MapLibre and tiles, and React Native Web and Expo.
- Explain each GIS term in plain words the first time it appears.

## Out of scope
Installing or scaffolding the app, signing up for services, creating API keys, and the data schema (M2).

## Expected outputs
- `docs/research/STACK_OPTIONS.md`, in this order: summary and recommendations (under 200 words), a comparison table and notes for each decision, pricing tables, risks, a "Decisions for CP1" list with the recommended option for each, and draft ADR text for the PO.
- `docs/research/LEARNING.md`
- Your row in `docs/PROGRESS.md` updated, and a row appended to `docs/BUDGET.md`.

## Acceptance criteria
- [ ] At least 2 options for each of the 4 decisions, each with pros, cons and license.
- [ ] Every price cites a URL and the date read; the traffic assumptions are shown; there is a free-tier option in each category.
- [ ] A recommendation and a runner-up for each decision, and an explanation of the map library's path to native.
- [ ] Contested-border handling is covered for each basemap option.
- [ ] Attribution requirements are listed for each option.
- [ ] Nothing is guessed. Unknowns are marked "unknown".
- [ ] Committed as `docs(research): add M1 stack and hosting options`, with the push and PR commands printed but not run.

## Finish
Follow the session protocol in `.github/agents/gis-engineer.agent.md`. PR title: `docs(research): M1 stack and hosting options`.
