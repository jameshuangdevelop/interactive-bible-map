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
| M3-08 | Neutral modern names | gis-engineer → research-lead → fact-checker | `data/m3-modern-names` | Done, PR pending review | — |
| M3-10 | English-only names | gis-engineer → research-lead → fact-checker | `data/m3-english-names` | In progress (subagent) | — |

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
| 2026-09-28 | research-lead | M3-08 (data) | Normalized `names.modern` and candidate `label` fields on 48 of 63 records per the rule (country/political descriptor stripped; disputed records' `names.modern` deleted). For the five "other multi-candidate" records, applied "one neutral name must cover every candidate" literally: kept jericho ("Jericho" covers both mound periods); removed bethany-beyond-the-jordan, derbe, golgotha and malta (no single name covers every candidate — malta's "Mljet" candidate is a different island from "Malta", so despite Malta being the high-confidence identification, the modern name was removed for consistency with the other four). Regions: kept crete, galilee, patmos, sea-of-galilee; per PO guidance removed judea and samaria (politically loaded either way) and galatia (no neutral sourced modern geographic name, and "Turkey" is excluded). All 48 changed records set to `status: draft` (verifiedBy/lastReviewed removed, matching schema/README.md's draft workflow and the M2-03 precedent). `npm run validate:data` passes (100 warnings, all pre-existing categories; malta.json gained one new "name not in verse text" warning as an expected side effect of removing "Malta" from its configured names). `npm test`: 50/50 pass. A semantic diff against HEAD confirmed only `names.modern`, candidate `label`, `status`, `verifiedBy` and `lastReviewed` changed across the 48 files. Next: fact-checker verifies each name against sources and re-sets `verified`. |
| 2026-09-28 | fact-checker | M3-08 (verification) | Semantic diff against `7f01028` confirmed the same 48 files and only the expected paths changed. Checked every changed name and label against the record's own cited sources; found two of the "34 straightforward" values were actually accuracy fixes, not just formatting (colossae "Near Honaz", lystra "Near Hatunsaray" — the candidates' own support text already says "near," not identical with the town). Confirmed the bethany-beyond-the-jordan/derbe/golgotha removals (genuinely separate sites, no covering name) and the judea/samaria/galatia region removals (no neutral modern name available). **Overturned one finding: malta.** The task card's own rule text names "Malta" as the worked example for region/island records, malta is a `natural-feature`/`region`-type record (not a disputed-confidence one — its low-confidence alternative is Mljet, not a `disputed`-confidence candidate), and the validator's own test suite has a case titled "multi-candidate non-disputed record may keep names.modern." Restored `names.modern: "Malta"`; the alternate-name addition is now redundant but not a violation, and the scripture-warning count for malta is unchanged (3) either way. Kept nicopolis's flagged candidate label "(Epirus)" — not a country, already part of the record's own ancient name ("Nicopolis in Epirus"), and needed to disambiguate from `emmaus.json`'s "Emmaus Nicopolis" candidate. Full-corpus scan of all 63 records' names/labels found no other leftover violations. Re-set all 48 changed records (including the corrected malta) to `status: "verified"`, `verifiedBy: "fact-checker"`, `lastReviewed: "2026-09-28"`. `npm run validate:data`: 0 errors, 99 warnings (unchanged categories). `npm test`: 50/50 pass. Report: `docs/verification/M3-modern-names.md`. All 63 records are now `verified`. |
