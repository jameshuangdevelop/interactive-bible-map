# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M1 – Research & Options · **Status:** in progress (CP0 approved 2026-09-23, #2) · **Budget used this month:** see [BUDGET.md](BUDGET.md)

## Resume point
1. **M1-01 and M1-02** are running in parallel as Copilot CLI subagents, dispatched by the PO (ADR-0007). Each works on its own branch in a local worktree under `.worktrees/`.
2. **When both are committed:** the PO checks them against their cards, runs `pr-reviewer` on each (ADR-0004), and asks the human before pushing and opening the PRs.
3. **When M1-01 is merged:** the PO writes the M1-03 card (Fact-Checker license review) and dispatches it.
4. **When M1-01 to M1-03 are merged:** the PO writes the CP1 summary (M1-04), and the human picks the stack.

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0-01 | M0 setup & plan | project-owner | `chore/m0-setup` | Merged (CP0 approved) | #2 |
| M1-00 | M1 kickoff: record CP0, dispatch process | project-owner | `docs/m1-kickoff` | Done, PR pending | — |
| M1-01 | Source inventory with licenses | research-lead | `docs/m1-source-inventory` | Card ready, waits for CP0 | — |
| M1-02 | Stack and hosting options with pricing | gis-engineer | `docs/m1-stack-options` | Card ready, waits for CP0 | — |
| M1-03 | License verification of the inventory | fact-checker | `docs/m1-license-review` | Planned, after M1-01 | — |
| M1-04 | CP1 summary and stack ADRs | project-owner | `docs/cp1-summary` | Planned, after M1-03 | — |

## Open questions
- None open. CP0 was approved by merge. The optional CP0 items (branch protection on `main`, a Fact-Checker model upgrade) stay as they are unless the human says otherwise; the Fact-Checker upgrade is revisited at CP2.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1-01/M1-02 cards; committed on `chore/m0-setup` |
| 2026-09-23 | project-owner | M1-00 | Recorded CP0 approval; dispatched M1-01 and M1-02 as subagents (ADR-0007) |
