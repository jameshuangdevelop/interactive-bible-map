# Progress

Shared memory for all agents. Every session reads this first and updates its own task row before committing.

**Current milestone:** M3 – MVP App · **Status:** building the MVP (CP3a approved 2026-09-28, #16) · **Budget used this month:** see [BUDGET.md](BUDGET.md) (about 2.6% of the cap)

## Resume point
1. **Running in parallel, as subagents (ADR-0007):** M3-02 (the app scaffold), M3-07 (basemap attribution) and M3-08 (modern names; GIS Engineer, then Research Lead, then Fact-Checker).
2. **Next:** M3-03 (the map) after M3-02, then M3-04 (the panel) and M3-05 (search) in parallel, then M3-06 (the preview deploy). Then the PO writes CP3b.
3. **Cloudflare secrets:** added on 2026-09-25 with `scripts/setup-cloudflare-token.ps1`. M3-06's first deploy confirms that they work, and the token expires on about 2027-09-25.

## Tasks
| ID | Task | Agent | Branch | Status | PR |
|---|---|---|---|---|---|
| M0–M1 | Setup, research, stack, licenses | — | — | Merged (CP0, CP1 approved) | #2–#7 |
| M2 | Schema and 57 verified core sites (M2-00 to M2-06) | — | — | Merged (CP2 approved) | #8–#14 |
| M3-00 | M3 kickoff: record CP2 | project-owner | `docs/m3-kickoff` | Merged | #15 |
| M3-01 | Low-fidelity visual spec and wireframes (CP3a) | project-owner | `docs/cp3a-visual-spec` | Merged (CP3a approved) | #16 |
| M3-09 | Record CP3a and start the build | project-owner | `docs/m3-build-kickoff` | Done, PR pending push | — |
| M3-02 | App scaffold, data build and CI | frontend-engineer | `feat/m3-app-scaffold` | Done, PR pending review | — |
| M3-03 | Map view | frontend-engineer | `feat/m3-map` | Card ready, waits for M3-02 | — |
| M3-04 | Place panel | frontend-engineer | `feat/m3-place-panel` | Card ready, waits for M3-03 | — |
| M3-05 | Search by place name, and the menu | frontend-engineer | `feat/m3-search` | Card ready, waits for M3-03 | — |
| M3-06 | Preview deploy and CP3b readiness | frontend-engineer | `feat/m3-preview-deploy` | Card ready, waits for M3-04 and M3-05 (secrets added) | — |
| M3-07 | Basemap attribution and style license | fact-checker | `docs/m3-basemap-attribution` | Done, PR pending review | — |
| M3-08 | Neutral modern names | gis-engineer → research-lead → fact-checker | `data/m3-modern-names` | In progress (subagent) | — |

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
| 2026-09-28 | project-owner | M3-09 | CP3a approved with Liberty (ADR-0022); dispatched M3-02, M3-07 and M3-08 |
