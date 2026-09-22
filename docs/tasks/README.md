# Task cards

One card = one task = one branch = one PR. The PO writes the cards.

**To run a card (human):** open a new Copilot Chat in VS Code in agent mode, pick the agent named on the card (its model is preselected from the agent file), and paste the whole card. For review, start `pr-reviewer` and give it the PR number.

## Index
| ID | Title | Agent | Branch | Status |
|---|---|---|---|---|
| [M1-01](M1-01-source-inventory.md) | Source inventory with licenses | research-lead | `docs/m1-source-inventory` | Ready after CP0 |
| [M1-02](M1-02-stack-options.md) | Stack and hosting options with pricing | gis-engineer | `docs/m1-stack-options` | Ready after CP0 |

## Template
```markdown
# <ID> — <title>

| | |
|---|---|
| Agent | `<agent>` |
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
