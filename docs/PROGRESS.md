# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M1 – Research & Options · **Status:** awaiting CP1 approval · **Budget used this month:** ~3,300 of 1,000,000 AI credits ([BUDGET.md](BUDGET.md))

## Resume point
1. **Human:** approve pushing the 5 stacked M1 branches. The PO then pushes them, opens the PRs and posts the review comments. Merge them in this order: `docs/m1-kickoff` → `docs/m1-source-inventory` → `docs/m1-stack-options` → `docs/m1-license-review` → `docs/cp1-summary` (the CP1 checkpoint).
2. **CP1:** merging the CP1 PR accepts the recommended stack and WEB edition. To choose differently, comment on the PR. See [CHECKPOINTS.md → CP1](../CHECKPOINTS.md#cp1--research--options).
3. **After CP1:** the PO marks ADR-0008 to ADR-0011 and ADR-0013 Accepted, and writes the M2 cards, starting with the schema and validation CI (GIS Engineer).

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0-01 | M0 setup & plan | project-owner | `chore/m0-setup` | Merged (CP0 approved) | #2 |
| M1-00 | M1 kickoff: record CP0, dispatch process | project-owner | `docs/m1-kickoff` | Done, reviewed; PR pending push | — |
| M1-01 | Source inventory with licenses | research-lead | `docs/m1-source-inventory` | Done, reviewed; PR pending push | — |
| M1-02 | Stack and hosting options with pricing | gis-engineer | `docs/m1-stack-options` | Done, reviewed; PR pending push | — |
| M1-03 | License verification of the inventory | fact-checker | `docs/m1-license-review` | Done, reviewed; PR pending push | — |
| M1-04 | CP1 summary and stack ADRs | project-owner | `docs/cp1-summary` | Done, reviewed; awaiting CP1 | — |

## Open questions
- None open. CP0 was approved by merge. The optional CP0 items (branch protection on `main`, a Fact-Checker model upgrade) stay as they are unless the human says otherwise; the Fact-Checker upgrade is revisited at CP2.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1-01/M1-02 cards; committed on `chore/m0-setup` |
| 2026-09-23 | project-owner | M1-00 | Recorded CP0 approval; dispatched M1-01 and M1-02 as subagents (ADR-0007) |
| 2026-09-23 | project-owner | M1-01 to M1-04 | Dispatched and reviewed M1-01 to M1-03 (every must-consider fixed), stacked the branches, and wrote the CP1 summary |
