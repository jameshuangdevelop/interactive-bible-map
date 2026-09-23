# M2-03 — Core sites, batch 2: Samaria, Acts and Pauline cities (20 sites + 1 region)

| | |
|---|---|
| Agents, in order | `research-lead` → `media-curator` → `fact-checker` (each adds its own commit; ADR-0014) |
| Models | Claude Sonnet 5 → GPT-5 mini → Claude Sonnet 5 (fallbacks as in ADR-0003) |
| Branch | `data/m2-batch-2` |
| Depends on | M2-01 (schema and validator). Nothing in batch 1. |
| Parallel with | M2-02 (batch 1) |
| Credit target | ~500 research, ~50 media, ~400 fact-check (session guard: 1,500 each) |

## Goal
Write, illustrate and verify the second 20 core sites, which are the places of Acts and the cities of Paul's churches, plus the `samaria` region record. Region records do not count toward the 40.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §2 and §4
- `docs/PROGRESS.md`
- `schema/README.md`, which holds the data conventions and is the main guide for every phase
- `docs/research/SOURCES.md` and `docs/LICENSES.md`
- `docs/tasks/M2-02-core-sites-batch-1.md`: its **Phase A, B and C rules** apply to this batch, **with the differences listed below**
- This card

## Locations
The ids are proposals; follow the schema's id rules. If a location cannot be sourced to the standard, stop and report it under "Open questions" in `docs/PROGRESS.md` rather than guess.

| Group | ids | Notes |
|---|---|---|
| Region (support record, not counted in the 40) | `samaria` | `zoomTier: region` |
| Samaria and the north | `sychar`, `caesarea-philippi` | `sychar` uses `parentId: samaria`. |
| Coast and Syria | `caesarea-maritima`, `joppa`, `damascus`, `antioch-syria`, `tarsus` | Keep `antioch-syria` separate from `antioch-pisidia`. |
| First journey | `paphos`, `antioch-pisidia`, `iconium`, `lystra`, `derbe` | |
| Macedonia and Achaia | `philippi`, `thessalonica`, `berea`, `athens`, `corinth` | |
| Asia and Italy | `ephesus`, `colossae`, `rome` | |

Roman provinces are not location records until M4. Until then, leave `parentId` empty for places outside Samaria; M4 fills it in.

## Differences from the M2-02 rules
- **Commit messages:** `data(locations): add M2 batch 2 drafts`, `data(media): add images for M2 batch 2` and `docs(verification): add M2 batch 2 report`.
- **Verification report:** `docs/verification/M2-batch-2.md`. Do not edit `M2-batch-1.md`.
- **Disputed-site check:** check `sychar` and `derbe` for competing identifications. Any site found to be disputed must list every serious candidate, with support and sources, in neutral wording.
- **AI-reconstruction prompts (optional):** at most 3 sites from this batch.
- **Acceptance criteria:** the same as M2-02, but applied to the 21 records above (20 sites and 1 region), using this batch's disputed sites and report path.

## Finish
Each agent follows the session protocol in its agent file, but only the Fact-Checker's phase ends the task. PR title: `data: M2 batch 2 — Samaria, Acts and Pauline cities (20 core sites)`.
