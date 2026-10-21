# ADR-0051 — Every PR merges on its own, in any order

- **Date:** 2026-10-21 · **Status:** Accepted · **By:** the human, after #87 merged and the other open PRs conflicted: "can we stop doing this thing where the merge orders aren't sequential? What're some of your ideas on fixing this?" The human then accepted the PO's ideas 1–3 ("those 3 ideas look good to me") and idea 4 ("perhaps one PR at a time as well"). This supersedes ADR-0039 and the stacking in ADR-0007's consequences, and amends ADR-0006.
- **Context:**
  - **Stacking:** ADR-0007 had the PO rebase parallel branches into one linear stack, because they all edited neighbouring rows in `docs/PROGRESS.md` and `docs/BUDGET.md`. ADR-0039 then made every PR in a stack target `main`. So PRs had to merge in a set order: on 2026-10-20 that was #87 → #84 → #86 and #83 → #85.
  - **Shared ledgers:** each merge still left every other open PR conflicting, because every PR appended to `docs/BUDGET.md` and edited `docs/PROGRESS.md`. After #87 merged, all four open PRs conflicted, and only in those two files. After #84 and #86 merged, #83 and #85 conflicted again.
  - **ADRs:** ADRs and their updates are appended near the end of one file, `docs/DECISIONS.md`, so two PRs adding ADRs collide.
- **Decision:**
  1. **No stacked PRs.** Every PR branches from `main`, and can be reviewed and merged on its own, in any order. When new work needs an unmerged PR, it waits for that PR to merge, or goes into that PR while it's still open.
  2. **PRs don't edit `docs/BUDGET.md` or `docs/PROGRESS.md`.**
     - Each PR's description carries its budget row (the template's Budget table) and its status.
     - Agents put questions in their final report to the PO instead of in `docs/PROGRESS.md`.
     - After each batch of merges, and at each checkpoint, the PO copies the rows and statuses into the two ledgers in one docs PR. That PR is the only kind that edits them.
  3. **One file per ADR from ADR-0051 on,** in `docs/decisions/NNNN-slug.md`. ADR-0001 to ADR-0050 stay in `docs/DECISIONS.md`. A dated update to a later ADR goes inside that ADR's own file.
  4. **At most one open PR at a time changes the map's code:** `app/src/features/map/` and the browser tests that drive it. Data, research and docs PRs can run alongside it.
- **Not adopted (the human's choice):** the repository setting "Require branches to be up to date before merging" (with "Require status checks to pass"). It would block a merge until the PR's branch holds the latest `main` and its CI has passed on that.
- **Consequences:**
  - Merge order doesn't matter, and a merge no longer makes other PRs conflict.
  - Work that needs an unmerged PR sometimes waits.
  - The PO opens a small ledger PR after each batch of merges.
  - The agent files, the PR template, `AGENT_TEAM_PROMPT.md`, `CHECKPOINTS.md` and the two ledgers' own instructions change to match, in the same PR as this ADR.
