# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M3 – MVP App · **Status:** awaiting CP3a approval (the visual spec) · **Budget used this month:** see [BUDGET.md](BUDGET.md) (about 2.6% of the cap)

## Resume point
1. **Human:** approve pushing `docs/m3-kickoff` → `docs/cp3a-visual-spec` and merge them in that order. Merging the CP3a PR approves the spec and the five recommendations.
2. **After CP3a:** the PO dispatches M3-02, M3-07 and M3-08 in parallel. Then M3-03, then M3-04 and M3-05 in parallel, then M3-06. The plan is in [CHECKPOINTS.md → CP3a](../CHECKPOINTS.md#cp3a--visual-spec).
3. **Human, before M3-06:** add the two Cloudflare secrets (steps in CP3a).

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0–M1 | Setup, research, stack, licenses | — | — | Merged (CP0, CP1 approved) | #2–#7 |
| M2 | Schema and 57 verified core sites (M2-00 to M2-06) | — | — | Merged (CP2 approved) | #8–#14 |
| M3-00 | M3 kickoff: record CP2 | project-owner | `docs/m3-kickoff` | Done, PR pending push | — |
| M3-01 | Low-fidelity visual spec and wireframes (CP3a) | project-owner | `docs/cp3a-visual-spec` | Done, awaiting CP3a | — |
| M3-02 | App scaffold, data build and CI | frontend-engineer | `feat/m3-app-scaffold` | Card ready, waits for CP3a | — |
| M3-03 | Map view | frontend-engineer | `feat/m3-map` | Card ready, waits for M3-02 | — |
| M3-04 | Place panel | frontend-engineer | `feat/m3-place-panel` | Card ready, waits for M3-03 | — |
| M3-05 | Search by place name, and the menu | frontend-engineer | `feat/m3-search` | Card ready, waits for M3-03 | — |
| M3-06 | Preview deploy and CP3b readiness | frontend-engineer | `feat/m3-preview-deploy` | Card ready, waits for M3-04, M3-05 and the Cloudflare secrets | — |
| M3-07 | Basemap attribution and style license | fact-checker | `docs/m3-basemap-attribution` | Card ready, waits for CP3a | — |
| M3-08 | Neutral modern names | gis-engineer → research-lead → fact-checker | `data/m3-modern-names` | Card ready, waits for CP3a | — |

## Open questions
- None open.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1 cards |
| 2026-09-23 | project-owner | M1 | Ran M1 as subagents, with reviews; CP1 approved (#3–#7) |
| 2026-09-23 | project-owner | M2-00 to M2-04 | Schema and batches 1–2; #8–#11 merged |
| 2026-09-24 | project-owner | M2-05, M2-06 | Batch 3 (Acts and the Epistles) and stable image IDs; CP2 approved (#12–#14) |
| 2026-09-24 | project-owner | M3-00, M3-01 | Recorded CP2; wrote the visual spec, five wireframes and the M3 cards |
