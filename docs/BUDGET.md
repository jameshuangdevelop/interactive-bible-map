# Budget

**Monthly cap:** 1,000,000 GitHub Copilot AI credits across all Copilot agents (brief §2.8).

1 AI credit = US$0.01. Credits are charged per token (input, cached input, cache writes and output) at each model's rate. The pool resets at 00:00 UTC on the first day of each calendar month ([source](https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing), read 2026-09-22).

| Threshold | AI credits | What happens |
|---|---|---|
| Soft stop (80%) | 800,000 per month | The PO starts no new milestone. Work in progress may finish. |
| Hard stop (95%) | 950,000 per month | All agents stop at a clean handoff point and write the exact resume point in `docs/PROGRESS.md`. The PO prints a `gh issue create` command for a "Paused – budget" issue. |
| Session guard | 1,500 per session | The agent stops at a clean point and hands off. A session this large is about 3× the forecast and usually means a loop or an oversized task. |

## How to record usage
- Every PR appends one row to the current month's ledger below. The PR Reviewer does not commit, so it puts its row in the review comment and the PO copies it here at the next checkpoint.
- **AI credits**: if your tool shows the credits the session used (in Copilot CLI, run `/usage`), record that figure. Otherwise estimate it from the rates below, or scale the per-session forecast by how long the session ran, and prefix the estimate with `~`.
- **Tokens in / out** (rough estimates, used only to spot sessions that read too much): *in* is the context-window total at session end (VS Code: hover over the context indicator in the chat input; Copilot CLI: `/context`), and *out* is the generated text, about characters written ÷ 4.
- **Month total** is the previous row's total plus this row's credits. Parallel branches may start from the same previous total, so the PO recomputes it at each checkpoint and reconciles it with GitHub's billing usage report, which is authoritative (ADR-0005).
- For a new month, add a new `## Ledger — YYYY-MM` section.

> **Cost note.** Copilot code review picks a model it does not disclose, and it also uses GitHub Actions minutes, so its cost cannot be estimated in advance ([source](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing), read 2026-09-22). Use the `pr-reviewer` agent for routine reviews.

## Model rates
US$ per 1M tokens, from [Models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) (read 2026-09-22). Multiply dollars by 100 to get credits. OpenAI models in this table have no cache-write charge.

| Model | Used by (ADR-0003/0004) | Input | Cached input | Cache write | Output |
|---|---|---:|---:|---:|---:|
| Claude Opus 5.5 | project-owner | 4.00 | 0.20 | 5.00 | 20.00 |
| Claude Sonnet 5 | research-lead, fact-checker, pr-reviewer | 2.00 | 0.20 | 2.50 | 10.00 |
| GPT-5.3-Codex | gis-engineer, frontend-engineer | 1.75 | 0.175 | — | 14.00 |
| GPT-5.4 (≤ 272K context) | pr-reviewer on Claude-authored PRs | 2.50 | 0.25 | — | 15.00 |
| GPT-5 mini | media-curator | 0.25 | 0.025 | — | 2.00 |
| *Fallback:* Claude Opus 5 | project-owner | 5.00 | 0.50 | 6.25 | 25.00 |
| *Fallback:* Claude Sonnet 4.6 | Claude mid-tier roles | 3.00 | 0.30 | 3.75 | 15.00 |
| *Fallback:* GPT-5.5 (≤ 272K context) | gis-engineer, frontend-engineer | 5.00 | 0.50 | — | 30.00 |
| *Fallback:* Claude Haiku 4.5 | media-curator | 1.00 | 0.10 | 1.25 | 5.00 |

## Forecast (CP0 estimate)
**Method.** Each session is modeled as *model calls × average context*, billed as cached input, plus about 4k new input tokens and 1.5–2k output tokens per call. Then 50% is added for cache misses; for example, a pause longer than the cache lifetime makes the next call write the whole context again. These are planning estimates, and real usage could be half or double. The PO revises them at every checkpoint.

**Per session**

| Session type | Model | Assumed calls × avg context | AI credits |
|---|---|---|---:|
| PO planning or checkpoint | Claude Opus 5.5 | 50 × 80k | ~500 |
| Research Lead | Claude Sonnet 5 | 60 × 100k | ~400 |
| Fact-Checker | Claude Sonnet 5 | 50 × 100k | ~350 |
| GIS Engineer | GPT-5.3-Codex | 80 × 100k | ~550 |
| Frontend Engineer | GPT-5.3-Codex | 80 × 100k | ~550 |
| Media Curator | GPT-5 mini | 40 × 60k | ~35 |
| PR review | Claude Sonnet 5 or GPT-5.4 | 20 × 60k | ~130 |

**Per milestone**

| Milestone | Sessions (reviews included) | AI credits |
|---|---|---:|
| M0 Setup & Plan | 1 PO | ~500 |
| M1 Research & Options | 1 Research, 1 GIS, 1 Fact-Checker, 1 PO, 3 reviews | ~2,200 |
| M2 Schema & Core Data | 2 GIS, 2 Research, 1 Media, 2 Fact-Checker, 1 PO, 7 reviews | ~4,000 |
| M3 MVP App | 2 PO (spec, CP3b), 5 Frontend, 6 reviews | ~4,500 |
| M4 Ancient Layer & Timeline | 1 Research, 2 GIS, 1 Fact-Checker, 2 Frontend, 1 PO, 6 reviews | ~4,200 |
| M5 Routes Tab | 1 Research, 1 Fact-Checker, 1 Frontend, 1 PO, 3 reviews | ~2,200 |
| M6 Expansion (~5 batches of ~50) | per batch: 1 Research, 1 Media, 1 Fact-Checker, 3 reviews; plus 3 PO | ~7,400 |
| M7 Mobile-web polish | 2 Frontend, 1 PO, 2 reviews | ~1,900 |
| **Total** | **~95 sessions** | **~27,000** (range ~15k–55k, about US$150–550) |

**What this means.** The whole project is forecast at under 3% of one month's cap, so budget does not set the pace; the time it takes to review each checkpoint does. The 80% and 95% stops stay in place as safety rails, and the session guard is the control that matters day to day. The brief's cost-efficiency rules (§2.8) still apply.

## Rollups
| Checkpoint | Month | Credits this milestone | Month total | % of cap |
|---|---|---:|---:|---:|
| CP0 | 2026-09 | ~500 | ~500 | ~0.05% |
| CP1 | 2026-09 | ~2,760 | ~3,260 | ~0.3% |

## Ledger — 2026-09
| Date | Agent | Model | Task | Tokens in / out (est.) | AI credits | Month total |
|---|---|---|---|---|---:|---:|
| 2026-09-22 | project-owner | Claude Opus 5.5 (Copilot CLI) | M0-01 setup & plan | ~130k / ~45k | ~500 | ~500 |
| 2026-09-23 | project-owner | Claude Opus 5.5 (Copilot CLI) | M1-00 kickoff and dispatch | ~110k / ~10k | ~150 | ~650 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M1-01 source inventory (incl. PR review follow-up) | ~220k / ~23k | ~825 | ~1,475 |
| 2026-09-23 | gis-engineer | GPT-5.3-Codex (Copilot CLI subagent) | M1-02 stack and hosting options | ~520k / ~44k | ~440 | ~1,915 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M1-03 license review (incl. PR review follow-up) | ~230k / ~27k | ~400 | ~2,315 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M1-00 | ~55k / ~3k | ~12 | ~2,327 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M1-01 | ~95k / ~7k | ~24 | ~2,351 |
| 2026-09-23 | pr-reviewer | Claude Sonnet 5 (Copilot CLI subagent) | Review M1-02 | ~260k / ~12k | ~95 | ~2,446 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M1-03 | ~180k / ~10k | ~90 | ~2,536 |
| 2026-09-23 | project-owner | Claude Opus 5.5 (Copilot CLI) | M1-04 orchestration, reviews and CP1 summary | ~200k / ~30k | ~650 | ~3,186 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M1-04 (CP1) | ~150k / ~8k | ~74 | ~3,260 |
| 2026-09-23 | project-owner | Claude Opus 5.5 (Copilot CLI) | M2-00 push M1, CP1 follow-up, M2 kickoff and cards | ~220k / ~20k | ~450 | ~3,710 |
| 2026-09-23 | gis-engineer | GPT-5.3-Codex (Copilot CLI subagent) | M2-01 schema, validation and CI | ~900k / ~90k | ~790 | ~4,500 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 batch 2 research (Phase A) | ~380k / ~50k | ~950 | ~5,450 |


| 2026-09-23 | media-curator | GPT-5 mini (Copilot CLI subagent) | M2-03 batch 2 media | ~40k / ~5k | ~53 | ~5,503 |
