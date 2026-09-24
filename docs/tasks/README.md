# Task cards

One card = one task = one branch = one PR. The PO writes the cards. A card names one agent, or an ordered chain of agents for a data batch (ADR-0014): each agent in the chain adds its own commit on the same branch, and the next agent starts from there.

**To run a card (human):** open a new Copilot Chat in VS Code in agent mode, pick the agent named on the card (its model is preselected from the agent file), and paste the whole card. For review, start `pr-reviewer` and give it the PR number.

## Index
| ID | Title | Agent | Branch | Status |
|---|---|---|---|---|
| M1-01 to M1-03 | M1 research and license review | — | — | Merged (#4–#6) |
| [M2-01](M2-01-schema-validation.md) | Data schema, validation and CI | gis-engineer | `feat/m2-schema-validation` | In progress |
| [M2-02](M2-02-core-sites-batch-1.md) | Core sites, batch 1 (20 sites + 2 regions) | research-lead → media-curator → fact-checker | `data/m2-batch-1` | Waits for M2-01 |
| [M2-03](M2-03-core-sites-batch-2.md) | Core sites, batch 2 (20 sites + 1 region) | research-lead → media-curator → fact-checker | `data/m2-batch-2` | Waits for M2-01 |
| [M2-05](M2-05-core-sites-batch-3.md) | Core sites, batch 3 (18 sites + 2 regions) | research-lead → media-curator → fact-checker | `data/m2-batch-3` | In progress |
| [M2-06](M2-06-image-ids.md) | Stable image IDs and lead images | gis-engineer → media-curator → fact-checker | `feat/m2-image-ids` | Verified |

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
