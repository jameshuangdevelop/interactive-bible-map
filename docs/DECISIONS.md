# Decisions (ADR log)

Lightweight architecture decision records, oldest first. Each ADR has a status: **Proposed** (waiting for the human at a checkpoint), **Accepted**, or **Superseded by ADR-xxxx**. To change a decision, add a new ADR; do not edit an accepted one.

---

## ADR-0001 — Keep decisions in this file
- **Date:** 2026-09-22 · **Status:** Accepted · **By:** PO
- **Context:** Agents work in short, separate sessions and need a shared record of what was decided and why that is cheap to read.
- **Decision:** One file with one short section per decision (context, decision, consequences). Superseding ADRs link back to the ones they replace.
- **Consequences:** Agents read only the ADRs their card names. History stays visible.

## ADR-0002 — Execution environment
- **Date:** 2026-09-22 · **Status:** Accepted · **By:** PO (from brief §8)
- **Context:** Copilot cloud agent is unavailable.
- **Decision:** Agents run as custom agents in VS Code Copilot Chat (agent mode), defined in `.github/agents/*.agent.md`. One session = one task = one branch. Agents commit locally and print the push and PR commands. The human pushes, opens PRs and merges. The M0 PO session ran in Copilot CLI on the same repository. The CLI can select the same agent files with `/agent <name>`, so either tool works.
- **Consequences:** No agent needs push rights. If the cloud agent is enabled later, the same agent files and task cards are used, and the switch is recorded in a new ADR.

## ADR-0003 — Model assignments
- **Date:** 2026-09-22 · **Status:** Accepted (the human confirms availability at CP0) · **By:** PO
- **Context:** Brief §3 names model tiers. The concrete models come from GitHub's [supported models list](https://docs.github.com/en/copilot/reference/ai-models/supported-models), read 2026-09-22.
- **Decision:** Each agent file sets a `model` list. VS Code uses the first model in the list that is available.

  | Agent | Brief tier | Model → fallback |
  |---|---|---|
  | project-owner | Claude, top tier | Claude Opus 5.5 → Claude Opus 5 |
  | research-lead | Claude, mid tier | Claude Sonnet 5 → Claude Sonnet 4.6 |
  | fact-checker | Claude, mid tier | Claude Sonnet 5 → Claude Sonnet 4.6 |
  | gis-engineer | OpenAI Codex / GPT | GPT-5.3-Codex → GPT-5.5 |
  | frontend-engineer | OpenAI Codex / GPT | GPT-5.3-Codex → GPT-5.5 |
  | media-curator | Cheapest capable | GPT-5 mini → Claude Haiku 4.5 |
  | pr-reviewer | Claude, mid tier, different vendor from the author | Claude Sonnet 5 → Claude Sonnet 4.6 (see ADR-0004) |

  GPT-5.3-Codex is OpenAI's code-focused model in Copilot, and GitHub names it the long-term-support model, so it is the least likely to be withdrawn during the project.
- **Consequences:** If a plan or policy blocks a model, VS Code falls back to the next one in the list. The PO records any lasting substitution here.

## ADR-0004 — Reviews use a different vendor from the PR author
- **Date:** 2026-09-22 · **Status:** Accepted · **By:** PO
- **Context:** The brief makes the PR Reviewer a different vendor from the code authors (GPT) so reviews catch different mistakes. Docs and data PRs are written by Claude agents.
- **Decision:** The reviewer defaults to Claude Sonnet 5, which fits PRs from the GIS Engineer, Frontend Engineer and Media Curator. For PRs from the PO, Research Lead or Fact-Checker, the human switches the model picker to GPT-5.4 after selecting `pr-reviewer`.
- **Consequences:** Every review is cross-vendor. Docs and data PRs need one manual model switch.

## ADR-0005 — Budget accounting in AI credits
- **Date:** 2026-09-22 · **Status:** Accepted · **By:** PO (budget unit set by the human)
- **Context:** The monthly budget is 1,000,000 GitHub Copilot AI credits (1 credit = US$0.01). Credits are charged per token (input, cached input, cache writes and output) at each model's rate ([models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing), read 2026-09-22). Agent mode resends the conversation on every model call, so most of a session's tokens are cheap cached input.
- **Decision:** Each PR's budget row records the AI credits its session used. Use the tool's own figure where it shows one (Copilot CLI: `/usage`); otherwise estimate from the rates in [BUDGET.md](BUDGET.md). Tokens in/out are recorded as rough estimates only. At each checkpoint the PO reconciles the month total with GitHub's billing usage report, which is authoritative. A session guard of 1,500 credits catches runaway sessions.
- **Consequences:** The forecast for the whole project (about 27k credits) is under 3% of one month's cap. Budget is therefore a safety rail, not a pacing constraint. The cost-efficiency rules in brief §2.8 still apply.

## ADR-0006 — Task IDs, cards and shared files
- **Date:** 2026-09-22 · **Status:** Accepted · **By:** PO
- **Decision:** A task ID is `M<milestone>-<nn>` (for example `M1-01`). Each card lives at `docs/tasks/<ID>-<slug>.md`. Branch prefixes follow brief §6. Parallel tasks edit only their own row in `docs/PROGRESS.md` and only append to `docs/BUDGET.md`, which keeps merge conflicts trivial. PR bodies and review text are written to `.git/PR_BODY.md` and `.git/REVIEW-<n>.md`, inside `.git/`, so they are never committed.
- **Consequences:** When two parallel PRs touch the same shared file, the second one to merge rebases and re-applies its one-row change.
