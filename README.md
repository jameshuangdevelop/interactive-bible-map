# Interactive Bible Map

A Google-Maps-style interactive map of first-century New Testament locations, with the most detail for the Gospels and Acts. It is built for Bible study, written in a neutral and scholarly tone, and every fact is cited.

**Status:** the MVP is live at https://interactive-bible-map.pages.dev, with 89 verified places (CP3b approved). Now building the Modern↔Ancient toggle, the ancient borders and roads, and the first-century timeline (milestone M4).

## How this project is run
A team of GitHub Copilot custom agents ([.github/agents/](.github/agents/)) does the work, coordinated by a Project Owner agent. A human owner approves each checkpoint and merges every PR. The full brief is [AGENT_TEAM_PROMPT.md](AGENT_TEAM_PROMPT.md).

- Plan and checkpoints: [CHECKPOINTS.md](CHECKPOINTS.md)
- Current state and resume point: [docs/PROGRESS.md](docs/PROGRESS.md)
- Decisions: [docs/DECISIONS.md](docs/DECISIONS.md)
- Task cards: [docs/tasks/](docs/tasks/)
- Budget (AI credits): [docs/BUDGET.md](docs/BUDGET.md)
- Deferred ideas: [BACKLOG.md](BACKLOG.md)

## Licenses
Code is released under the MIT License ([LICENSE](LICENSE)). Data and content are released under CC BY-SA 4.0, and geometry derived from OpenStreetMap or AWMC in `data/geo/` under ODbL 1.0. The full rules and upstream attribution are in [docs/LICENSES.md](docs/LICENSES.md) and [ATTRIBUTION.md](ATTRIBUTION.md).

## Testing

- Run all browser tests: `npm run verify:web:playwright`
- Run one browser test file: `npx playwright test tests/browser/browser-checks.spec.mjs`
- Run by tag: `npx playwright test --grep @routes`
- Run one shard locally (to mimic CI): `npx playwright test --shard=1/6`
- Open the HTML report from the last run:
  1. `npx playwright show-report`
  2. or open `playwright-report/index.html` in a browser.
