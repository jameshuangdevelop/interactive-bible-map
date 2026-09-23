# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M2 – Schema & Core Data · **Status:** in progress (CP1 approved 2026-09-23) · **Budget used this month:** ~3,700 of 1,000,000 AI credits ([BUDGET.md](BUDGET.md))

## Resume point
1. **M2-01** (schema, validation, CI) runs first as a subagent (ADR-0007). M2-02 and M2-03 need its schema.
2. **M2-02 and M2-03** (20 locations each) then run in parallel. Each batch is one branch: Research Lead, then Media Curator, then Fact-Checker (ADR-0014).
3. **After review:** the PO stacks the M2 branches, asks the human before pushing, and writes the CP2 summary (M2-04).

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0–M1 | Setup, research, stack, licenses | — | — | Merged (CP0, CP1 approved) | #2–#7 |
| M2-00 | M2 kickoff: record CP1, write M2 cards | project-owner | `docs/m2-kickoff` | Done, PR pending | — |
| M2-01 | Data schema, validation and CI | gis-engineer | `feat/m2-schema-validation` | Done, PR pending review | — |
| M2-02 | Core sites, batch 1 (20) | research-lead → media-curator → fact-checker | `data/m2-batch-1` | Research done; media next | — |
| M2-03 | Core sites, batch 2 (20) | research-lead → media-curator → fact-checker | `data/m2-batch-2` | Waits for M2-01 | — |
| M2-04 | CP2 summary | project-owner | `docs/cp2-summary` | Planned | — |

## Open questions
- None open. The Fact-Checker model upgrade (a CP0 option) is revisited at CP2.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1 cards |
| 2026-09-23 | project-owner | M1-00 to M1-04 | Ran M1 as subagents, with reviews; CP1 approved (#3–#7) |
| 2026-09-23 | project-owner | M2-00 | Recorded CP1; wrote the M2-01 to M2-03 cards; added ADR-0014 and ADR-0015 |
