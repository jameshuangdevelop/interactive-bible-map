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
- **AI credits**: if your tool shows the credits the session used (in Copilot CLI, run `/usage`), record that figure. Otherwise estimate it from the rates below, add 50% for cache writes and cache misses (the same allowance the forecast uses), and prefix the estimate with `~`.
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

> **Forecast revision (CP2):** M2 cost about 22,666 credits against a forecast of about 4,000, because batches 1–2 needed 3–4 verification rounds each. With the Media Curator on Claude Sonnet 5 and the Fact-Checker on Claude Opus 5.5 (ADR-0020, ADR-0021), batch 3 cost about 3,500 against 5,100 and 6,700 for batches 1–2 (agent and review rows only, not the PO's coordination). Plan on about 3,500–5,000 credits per 20-place batch. That puts M6 (about 240 more places, 12 batches) at about 45,000–60,000 credits, under 6% of one month's cap.

## Rollups
| Checkpoint | Month | Credits this milestone | Month total | % of cap |
|---|---|---:|---:|---:|
| CP0 | 2026-09 | ~500 | ~500 | ~0.05% |
| CP1 | 2026-09 | ~2,760 | ~3,260 | ~0.3% |
| CP2 | 2026-09 | ~22,666 | ~25,926 | ~2.6% |

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
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 batch 1 research (Phase A) | ~300k / ~45k | ~1,050 | ~5,550 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-02 batch 1 media (completion) | ~150k / ~30k | ~100 | ~5,650 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 batch 1 fact-check (Phase C: 47 independent coordinate re-fetches, 32 image license/content re-checks, full scripture/political-history audit) | ~450k / ~55k | ~1,150 | ~6,800 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 fixes (galilee politicalHistory, jerusalem scripture, gethsemane confidence, jericho candidate, temple-mount disclosure, bethlehem/bethany-beyond-the-jordan politicalHistory) | ~90k / ~12k | ~350 | ~7,150 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-02 media fixes (capernaum IGO license string, nain image replacement) | ~40k / ~6k | ~55 | ~7,205 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 re-verification (7 fixed records + capernaum/nain media re-checked against original evidence; found nain's replacement images still not fully resolved) | ~120k / ~20k | ~300 | ~7,505 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 claims audit (source-checked all 22 records' text claims against sources; 13 records changed, 7 new bib: entries added) | ~250k / ~40k | ~700 | ~8,205 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-02 nain and license strings (replaced nain images, re-checked all 34 license strings against LicenseShortName, fixed bethany's CC0 string) | ~50k / ~8k | ~20 | ~8,225 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 re-verification 2 (claim-by-claim audit of 13 records, opened 2 new web sources directly, verified 7 new bib: entries, re-checked nain's 3 new images, spot-checked 8 other image licenses) | ~150k / ~25k | ~350 | ~8,575 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 scripture citations (added scripture: source IDs to summary/history/support clauses across 20 records) | ~200k / ~30k | ~550 | ~9,125 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-02 re-verification 3 (pulled all ~40 cited scripture: references directly from the WEB snapshot and checked each against its specific clause; verified bib:rainey-notley-sacred-bridge and the softened Qasr al-Yahud wording) | ~100k / ~18k | ~250 | ~9,375 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 batch 2 research (Phase A) | ~380k / ~50k | ~950 | ~10,325 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-03 batch 2 media (Phase B) | ~150k / ~8k | ~80 | ~10,405 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 batch 2 fact-check (Phase C) | ~520k / ~45k | ~950 | ~11,355 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 sychar fix | ~60k / ~5k | ~120 | ~11,475 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-03 media fixes | ~40k / ~3k | ~25 | ~11,500 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 re-verification | ~190k / ~18k | ~350 | ~11,850 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 claims audit | ~650k / ~70k | ~1,350 | ~13,200 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-03 license strings | ~50k / ~4k | ~40 | ~13,240 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 re-verification 2 | ~350k / ~35k | ~650 | ~13,890 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-03 corinth image | ~25k / ~2k | ~30 | ~13,920 |
| 2026-09-23 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 scripture citations | ~700k / ~75k | ~1,450 | ~15,370 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 re-verification 3 | ~200k / ~20k | ~400 | ~15,770 |
| 2026-09-23 | media-curator | GPT-5 mini (Copilot CLI subagent) | M2-02 and M2-03 first media passes (replaced by ADR-0016) | ~400k / ~70k | ~75 | ~15,845 |
| 2026-09-23 | gis-engineer | GPT-5.3-Codex (Copilot CLI subagent) | M2-01 follow-ups: IGO, ported licenses, scripture IDs, tightening | ~600k / ~40k | ~470 | ~16,315 |
| 2026-09-23 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-03 URL cleanup | ~40k / ~1k | ~10 | ~16,325 |
| 2026-09-23 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-03 ported-license ruling | ~60k / ~2k | ~90 | ~16,415 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M2-00 | ~170k / ~6k | ~80 | ~16,495 |
| 2026-09-23 | pr-reviewer | Claude Sonnet 5 (Copilot CLI subagent) | Review M2-01 and follow-ups | ~450k / ~15k | ~170 | ~16,665 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M2-03 | ~340k / ~15k | ~160 | ~16,825 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M2-02 | ~300k / ~12k | ~140 | ~16,965 |
| 2026-09-23 | project-owner | Claude Opus 5.5 (Copilot CLI) | M2 orchestration, stacking and CP2 summary | ~250k / ~40k | ~2,200 | ~19,165 |
| 2026-09-23 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M2-04 (CP2) | ~360k / ~12k | ~180 | ~19,345 |
| 2026-09-24 | gis-engineer | GPT-5.3-Codex (Copilot CLI subagent) | M2-06 image IDs | ~360k / ~25k | ~147 | ~19,492 |
| 2026-09-24 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 batch 3 research (Phase A: 20 records, extensive external source fetching for ADR-0017 compliance) | ~420k / ~55k | ~1,150 | ~20,642 |
| 2026-09-24 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-05 batch 3 media (Phase B: 20 locations, Wikimedia Commons search and retrieval, 51 images across 16 locations, license verification, JSON generation and schema validation) | ~150k / ~15k | ~80 | ~20,722 |
| 2026-09-24 | media-curator | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 batch 3 media (redo: PO rejected first pass for wrong-place/irrelevant images; re-sourced all 20 locations from Wikidata P18/P373 plus Commons category browsing, independently re-verified every candidate's license and subject, added tyre/salamis-cyprus/cenchreae/perga which had no images, kept 6 already-plausible locations after re-check) | ~430k / ~22k | ~160 | ~20,882 |
| 2026-09-24 | fact-checker | Claude Opus 5.5 (Copilot CLI subagent) | M2-05 batch 3 fact-check | ~200k / ~55k | ~750 | ~21,632 |
| 2026-09-24 | media-curator | Claude Haiku 4.5 (Copilot CLI subagent) | M2-06 lead-image review (43 locations, fetched Commons metadata, analyzed 3 removals, renumbered IDs) | ~200k / ~15k | ~80 | ~21,712 |
| 2026-09-24 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-06 check (semantic media-migration diff across 43 files, Commons API + visual re-check of the 3 removals and all 40 other leads, `npm test` + `npm run validate:data`; Sonnet 5 rates +50%) | ~380k / ~35k | ~525 | ~22,237 |
| 2026-09-24 | media-curator | Claude Sonnet 5 (Copilot CLI subagent) | M2-06 lead-image fixes (Wikidata P18/P373 lookups and Commons license/visual checks for 7 flagged files: thessalonica, berea, corinth, colossae, lystra, gethsemane, cana; Sonnet 5 rates +50%) | ~400k / ~25k | ~160 | ~22,397 |
| 2026-09-24 | fact-checker | Claude Sonnet 5 (Copilot CLI subagent) | M2-06 re-check (Commons API + thumbnail re-verification of 6 fixed leads, Wikidata P18/P373/coordinate lookup for lystra incl. a distance correction, removed `data/media/lystra.json`, `npm test` + `npm run validate:data`; Sonnet 5 rates +50%) | ~210k / ~20k | ~300 | ~22,697 |
| 2026-09-24 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 fixes | — | ~450 | ~23,147 |
| 2026-09-24 | media-curator | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 media fixes | — | ~60 | ~23,207 |
| 2026-09-24 | fact-checker | Claude Opus 5.5 (Copilot CLI subagent) | M2-05 batch 3 re-verification (Opus 5.5 rates +50%) | ~245k / ~20k | ~420 | ~23,627 |
| 2026-09-24 | research-lead | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 final fixes | — | ~60 | ~23,687 |
| 2026-09-24 | media-curator | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 malta image | — | ~25 | ~23,712 |
| 2026-09-24 | fact-checker | Claude Opus 5.5 (Copilot CLI subagent) | M2-05 batch 3 re-verification 2 (Opus 5.5 rates +50%) | ~265k / ~8k | ~180 | ~23,892 |
| 2026-09-24 | media-curator | Claude Sonnet 5 (Copilot CLI subagent) | M2-05 malta author | — | ~10 | ~23,902 |
| 2026-09-24 | fact-checker | Claude Opus 5.5 (Copilot CLI subagent) | M2-05 batch 3 sign-off (Opus 5.5 rates +50%) | ~275k / ~3k | ~90 | ~23,992 |
| 2026-09-24 | pr-reviewer | Claude Sonnet 5 (Copilot CLI subagent) | Review M2-06 | ~700k / ~15k | ~330 | ~24,322 |
| 2026-09-24 | pr-reviewer | GPT-5.4 (Copilot CLI subagent) | Review M2-05 | ~260k / ~10k | ~104 | ~24,426 |
| 2026-09-24 | project-owner | Claude Opus 5.5 (Copilot CLI) | M2-05 and M2-06 orchestration, stacking and CP2 update | ~300k / ~45k | ~1,500 | ~25,926 |
