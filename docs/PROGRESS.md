# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M3 – MVP App · **Status:** in progress (CP2 approved 2026-09-24, #14) · **Budget used this month:** see [BUDGET.md](BUDGET.md) (about 2.6% of the cap)

## Resume point
1. **PO:** write the low-fidelity visual spec and wireframes (M3-01) in `docs/design/`, together with the M3 build cards, on `docs/cp3a-visual-spec`. Then ask the human before pushing it as the CP3a checkpoint PR.
2. **After CP3a:** dispatch M3-02 (the app scaffold and CI) and M3-07 (basemap attribution) in parallel, then M3-03 (the map), then M3-04 (the details panel) and M3-05 (search) in parallel, then M3-06 (the preview deploy).
3. **Human, before CP3b:** set up Cloudflare Pages and add two repository secrets; the steps are in the CP3a summary.

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0–M1 | Setup, research, stack, licenses | — | — | Merged (CP0, CP1 approved) | #2–#7 |
| M2 | Schema and 57 verified core sites (M2-00 to M2-06) | — | — | Merged (CP2 approved) | #8–#14 |
| M3-00 | M3 kickoff: record CP2 | project-owner | `docs/m3-kickoff` | Done, PR pending | — |
| M3-01 | Low-fidelity visual spec and wireframes | project-owner | `docs/cp3a-visual-spec` | In progress | — |

## Open questions
- None open.

## Session log
| Date | Agent | Task | Result |
|---|---|---|---|
| 2026-09-22 | project-owner | M0-01 | Created M0 files and the M1 cards |
| 2026-09-23 | project-owner | M1 | Ran M1 as subagents, with reviews; CP1 approved (#3–#7) |
| 2026-09-23 | project-owner | M2-00 to M2-04 | Schema and batches 1–2; #8–#11 merged |
| 2026-09-24 | project-owner | M2-05, M2-06 | Batch 3 (Acts and the Epistles) and stable image IDs; CP2 approved (#12–#14) |
| 2026-09-24 | project-owner | M3-00 | Recorded CP2; started the M3 visual spec |
