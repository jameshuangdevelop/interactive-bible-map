# M2-03 — Core sites, batch 2: Samaria, Acts and Pauline cities (20 locations)

| | |
|---|---|
| Agents, in order | `research-lead` → `media-curator` → `fact-checker` (each adds its own commit; ADR-0014) |
| Models | Claude Sonnet 5 → GPT-5 mini → Claude Sonnet 5 (fallbacks as in ADR-0003) |
| Branch | `data/m2-batch-2` |
| Depends on | M2-01 (schema and validator). It uses `samaria` from M2-02 as a parent. |
| Parallel with | M2-02 (batch 1) |
| Credit target | ~500 research, ~50 media, ~400 fact-check (session guard: 1,500 each) |

## Goal
Write, illustrate and verify the second 20 core sites: the places of Acts and the cities of Paul's churches.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §2 and §4
- `docs/PROGRESS.md`
- `schema/README.md`, which holds the data conventions and is the main guide for every phase
- `docs/research/SOURCES.md` and `docs/LICENSES.md`
- `docs/tasks/M2-02-core-sites-batch-1.md`: **the Phase A–C rules and acceptance criteria apply unchanged**, using this card's location list, branch and commit messages ("batch 2")
- This card

## Locations
The ids are proposals; follow the schema's id rules. If a location cannot be sourced to the standard, stop and report it under "Open questions" in `docs/PROGRESS.md` rather than guess.

| Group | ids | Notes |
|---|---|---|
| Samaria and the north | `sychar`, `caesarea-philippi` | `sychar` uses `parentId: samaria`. |
| Coast and Syria | `caesarea-maritima`, `joppa`, `damascus`, `antioch-syria`, `tarsus` | Keep `antioch-syria` separate from `antioch-pisidia`. |
| First journey | `paphos`, `antioch-pisidia`, `iconium`, `lystra`, `derbe` | For `derbe`, check whether the site is disputed. |
| Macedonia and Achaia | `philippi`, `thessalonica`, `berea`, `athens`, `corinth` | |
| Asia and Italy | `ephesus`, `colossae`, `rome` | |

Roman provinces are not location records until M4. Until then, leave `parentId` empty for places outside Judea, Galilee and Samaria; M4 fills it in.

## Finish
Each agent follows the session protocol in its agent file, but only the Fact-Checker's phase ends the task. PR title: `data: M2 batch 2 — Samaria, Acts and Pauline cities (20 core sites)`.
