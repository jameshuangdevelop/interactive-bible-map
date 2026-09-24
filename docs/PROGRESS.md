# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M2 – Schema & Core Data · **Status:** awaiting CP2 approval · **Budget used this month:** see [BUDGET.md](BUDGET.md) (about 2.6% of the cap)

## Resume point
1. **Human:** approve pushing the 3 remaining M2 branches, then merge them in this order: `feat/m2-image-ids` → `data/m2-batch-3` → `docs/cp2-summary` (the CP2 checkpoint).
2. **CP2:** merging the CP2 PR accepts the six recommendations in [CHECKPOINTS.md → CP2](../CHECKPOINTS.md#cp2--schema--core-data). To choose differently, comment on the PR.
3. **After CP2:** the PO writes the M3 cards, starting with the low-fidelity visual spec (CP3a).

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0–M1 | Setup, research, stack, licenses | — | — | Merged (CP0, CP1 approved) | #2–#7 |
| M2-00 | M2 kickoff: record CP1, write M2 cards | project-owner | `docs/m2-kickoff` | Merged | #8 |
| M2-01 | Data schema, validation and CI | gis-engineer | `feat/m2-schema-validation` | Merged | #9 |
| M2-02 | Core sites, batch 1 (20 sites + 2 regions) | research-lead → media-curator → fact-checker | `data/m2-batch-1` | Merged | #10 |
| M2-03 | Core sites, batch 2 (20 sites + 1 region) | research-lead → media-curator → fact-checker | `data/m2-batch-2` | Merged | #11 |
| M2-06 | Stable image IDs and lead images | gis-engineer → media-curator → fact-checker | `feat/m2-image-ids` | Verified and reviewed; PR pending push | — |
| M2-05 | Core sites, batch 3 (17 sites + 3 area records) | research-lead → media-curator → fact-checker | `data/m2-batch-3` | Verified and reviewed; PR pending push | — |
| M2-04 | CP2 summary | project-owner | `docs/cp2-summary` | Done, awaiting CP2 | — |

## Open questions
- None open. The six CP2 decisions are listed in [CHECKPOINTS.md → CP2](../CHECKPOINTS.md#cp2--schema--core-data).

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1 cards |
| 2026-09-23 | project-owner | M1-00 to M1-04 | Ran M1 as subagents, with reviews; CP1 approved (#3–#7) |
| 2026-09-23 | project-owner | M2-00 to M2-04 | Ran the schema and batches 1–2 with 3–4 verification rounds each; #8–#11 merged |
| 2026-09-24 | project-owner | M2-05, M2-06 | At the human's request, added batch 3 (Acts and the Epistles) and stable image IDs; the batch 3 image pass was rejected and redone (ADR-0020); the Opus Fact-Checker signed off; wrote the updated CP2 summary |
