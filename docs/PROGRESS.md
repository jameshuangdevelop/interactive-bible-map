# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M0 – Setup & Plan · **Status:** awaiting CP0 approval · **Budget used this month:** ~500 of 1,000,000 AI credits ([BUDGET.md](BUDGET.md))

## Resume point
1. **Human:** push `chore/m0-setup`, create the `checkpoint` label, and open the CP0 PR (commands were printed by the M0 session). Review [CHECKPOINTS.md → CP0](../CHECKPOINTS.md#cp0--setup--plan), then merge or comment "approved".
2. **After CP0:** start M1-01 and M1-02 in parallel. Open two new Copilot Chats in VS Code, choose `research-lead` and `gis-engineer`, and paste each card from `docs/tasks/`.
3. **When M1-01 is merged:** the PO writes the M1-03 card (Fact-Checker license review).

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0-01 | M0 setup & plan | project-owner | `chore/m0-setup` | Done, awaiting CP0 | — |
| M1-01 | Source inventory with licenses | research-lead | `docs/m1-source-inventory` | Card ready, waits for CP0 | — |
| M1-02 | Stack and hosting options with pricing | gis-engineer | `docs/m1-stack-options` | Card ready, waits for CP0 | — |
| M1-03 | License verification of the inventory | fact-checker | `docs/m1-license-review` | Planned, after M1-01 | — |
| M1-04 | CP1 summary and stack ADRs | project-owner | `docs/cp1-summary` | Planned, after M1-03 | — |

## Open questions
- For the human: see "Decisions needed" in [CHECKPOINTS.md → CP0](../CHECKPOINTS.md#cp0--setup--plan).

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1-01/M1-02 cards; committed on `chore/m0-setup` |
