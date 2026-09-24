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
| M2-02 | Core sites, batch 1 (22) | research-lead → media-curator → fact-checker | `data/m2-batch-1` | Verified | — |
| M2-03 | Core sites, batch 2 (20) | research-lead → media-curator → fact-checker | `data/m2-batch-2` | Verified | — |
| M2-05 | Core sites, batch 3 (18 sites + 2 regions) | research-lead → media-curator → fact-checker | `data/m2-batch-3` | Fact-check: 30 needs-change | — |
| M2-06 | Stable image IDs and lead images | gis-engineer → media-curator → fact-checker | `feat/m2-image-ids` | Verified | — |
| M2-04 | CP2 summary | project-owner | `docs/cp2-summary` | Planned | — |

## Open questions
- None open. The Fact-Checker model upgrade (a CP0 option) is revisited at CP2.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1 cards |
| 2026-09-23 | project-owner | M1-00 to M1-04 | Ran M1 as subagents, with reviews; CP1 approved (#3–#7) |
| 2026-09-23 | project-owner | M2-00 | Recorded CP1; wrote the M2-01 to M2-03 cards; added ADR-0014 and ADR-0015 |
| 2026-09-24 | media-curator | M2-05 (redo) | Redid Phase B media for all 20 batch 3 locations after PO rejected the first pass (wrong-place and irrelevant images). Re-sourced every location from Wikidata P18/P373 and Commons category browsing; added images for tyre, salamis-cyprus, cenchreae and perga (previously missing); kept images only after independently re-verifying subject and license. `npm run validate:data` passes with 0 errors. |
