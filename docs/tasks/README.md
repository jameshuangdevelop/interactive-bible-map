# Task cards

One card = one task = one branch = one PR. The PO writes the cards. A card names one agent, or an ordered chain of agents for a data batch (ADR-0014): each agent in the chain adds its own commit on the same branch, and the next agent starts from there.

**To run a card (human):** open a new Copilot Chat in VS Code in agent mode, pick the agent named on the card (its model is preselected from the agent file), and paste the whole card. For review, start `pr-reviewer` and give it the PR number.

## Index
| ID | Title | Agent | Branch | Status |
|---|---|---|---|---|
| M1-01 to M1-03 | M1 research and license review | — | — | Merged (#4–#6) |
| [M2-01](M2-01-schema-validation.md) | Data schema, validation and CI | gis-engineer | `feat/m2-schema-validation` | Merged (#9) |
| [M2-02](M2-02-core-sites-batch-1.md) | Core sites, batch 1 (20 sites + 2 regions) | research-lead → media-curator → fact-checker | `data/m2-batch-1` | Merged (#10) |
| [M2-03](M2-03-core-sites-batch-2.md) | Core sites, batch 2 (20 sites + 1 region) | research-lead → media-curator → fact-checker | `data/m2-batch-2` | Merged (#11) |
| [M2-05](M2-05-core-sites-batch-3.md) | Core sites, batch 3 (17 sites + 3 area records) | research-lead → media-curator → fact-checker | `data/m2-batch-3` | Merged (#13) |
| [M2-06](M2-06-image-ids.md) | Stable image IDs and lead images | gis-engineer → media-curator → fact-checker | `feat/m2-image-ids` | Merged (#12) |
| [M3-02](M3-02-app-scaffold.md) | App scaffold, data build and CI | frontend-engineer | `feat/m3-app-scaffold` | Waits for CP3a |
| [M3-03](M3-03-map-view.md) | Map view | frontend-engineer | `feat/m3-map` | Waits for M3-02 |
| [M3-04](M3-04-place-panel.md) | Place panel | frontend-engineer | `feat/m3-place-panel` | Waits for M3-03 |
| [M3-05](M3-05-search.md) | Search by place name, and the menu | frontend-engineer | `feat/m3-search` | Waits for M3-03 |
| [M3-06](M3-06-preview-deploy.md) | Preview deploy and CP3b readiness | frontend-engineer | `feat/m3-preview-deploy` | Waits for M3-04, M3-05 and the Cloudflare secrets |
| [M3-07](M3-07-basemap-attribution.md) | Basemap attribution and style license | fact-checker | `docs/m3-basemap-attribution` | Waits for CP3a |
| [M3-08](M3-08-modern-names.md) | Neutral modern names | gis-engineer → research-lead → fact-checker | `data/m3-modern-names` | Waits for CP3a |

## Template
```markdown
# <ID> — <title>

| | |
|---|---|
| Agent(s) | `<agent>`, or an ordered chain such as `research-lead` → `media-curator` → `fact-checker` |
| Model | <model> (fallback <model>) |
| Branch | `<prefix>/<slug>` |
| Depends on | <IDs or checkpoint> |
| Parallel with | <IDs or "none"> |
| Credit target | ~<n> AI credits (session guard: 1,500) |

## Goal
## Inputs (read only these)
## Scope
## Out of scope
## Expected outputs
## Acceptance criteria
## Finish
Follow the session protocol in your agent file. PR title: `<conventional title>`.
```
