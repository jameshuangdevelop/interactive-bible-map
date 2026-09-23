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

## ADR-0007 — The PO can dispatch task cards as Copilot CLI subagents
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** PO, at the human's request ("continue driving the project"). This amends ADR-0002.
- **Context:** Under ADR-0002, the human pastes each card into a new VS Code chat. After CP0, the human asked the PO to drive the project from Copilot CLI, which can run subagents with a chosen model.
- **Decision:** When the human asks the PO to drive, the PO runs each task card as a Copilot CLI subagent. The subagent uses the model from ADR-0003 and follows the role's agent file. Parallel tasks each get their own git worktree under `.worktrees/`, excluded locally through `.git/info/exclude`, so their branches never collide. Subagents only commit. The PO then checks each result against its card, runs the PR Reviewer (following ADR-0004), and asks the human before every push, PR or PR comment. Checkpoint approvals and merges stay with the human. Pasting cards into VS Code chats (ADR-0002) remains a valid alternative.
- **Consequences:** Fewer manual handoffs, and still one task = one branch = one PR. Subagent sessions have no usage view of their own, so their credits are estimates. The PO reconciles them with GitHub's billing report at each checkpoint. Parallel branches all edit neighbouring rows in `docs/PROGRESS.md` and `docs/BUDGET.md`, so before pushing, the PO rebases the finished branches into one linear stack and resolves those rows locally. Each PR says which PR it is stacked on, and the human merges them in that order, so no merge conflicts reach GitHub.

## ADR-0008 — Map library: MapLibre
- **Date:** 2026-09-23 · **Status:** Proposed (CP1) · **By:** PO, from M1-02 ([STACK_OPTIONS.md](research/STACK_OPTIONS.md) §1)
- **Context:** The app is React Native Web from day one, and it needs a path to a native app later (brief §3). It must support vector tiles, GeoJSON overlays and clustering.
- **Decision:** Use MapLibre: `react-map-gl/maplibre` on web and `@maplibre/maplibre-react-native` for native later, behind one app-level map component with `.web` and `.native` implementations. The Frontend Engineer confirms this at the start of M3.
- **Consequences:** Open-source renderer (BSD-3 and MIT) with no vendor lock-in. There are two renderer bindings to maintain. The runner-up is Mapbox, which has commercial terms.

## ADR-0009 — Basemap and ancient mode
- **Date:** 2026-09-23 · **Status:** Proposed (CP1) · **By:** PO, from M1-02 §2
- **Context:** Modern mode needs mainstream borders with contested borders hidden when uncertain (brief §1.2). Ancient mode needs first-century provinces for each timeline year, plus roads and coastlines.
- **Decision:** For modern mode, use OpenFreeMap's public OpenMapTiles styles, hiding boundary features where `disputed=1`. It has no SLA, so launch (CP3b) requires tile-error monitoring and a fallback basemap style that can be switched by config, such as Protomaps PMTiles on Cloudflare R2. For ancient mode, draw project-owned GeoJSON overlays on a neutral base and switch them by timeline year. Move to our own PMTiles archive only if the overlay data becomes too large to load.
- **Consequences:** $0 at both traffic levels, with no account or API key. The OSM/OpenMapTiles attribution must be visible. Mapbox tiles in MapLibre were rejected on cost: about $650 a month at 50k visits.

## ADR-0010 — Hosting: Cloudflare Pages
- **Date:** 2026-09-23 · **Status:** Proposed (CP1) · **By:** PO, from M1-02 §3
- **Decision:** Host the static app and data on Cloudflare Pages. Deploy production and a preview for each PR from GitHub Actions with Wrangler.
- **Consequences:** Static requests are free and unlimited, and the Free plan allows 500 builds a month. The human creates the Cloudflare account and the deploy token in M3. A static build stays portable to other hosts. The runner-up is Vercel, which would cost $20 a month at moderate traffic.

## ADR-0011 — No backend for the MVP
- **Date:** 2026-09-23 · **Status:** Proposed (CP1) · **By:** PO, from M1-02 §4
- **Decision:** Ship static JSON and GeoJSON files, with client-side name search. Add Cloudflare Workers + D1 only if profiling or an editing workflow shows a need for it.
- **Consequences:** No server to run or secure. Search stays a client-side index over roughly 300 locations.

## ADR-0012 — Content licenses
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** Fact-Checker (M1-03; brief §2.4 gives this decision to the agents)
- **Decision:** Code is MIT. OSM- and AWMC-derived geometry in `data/geo/` is ODbL 1.0. All other `data/` and `content/` is CC BY-SA 4.0. WEB text stays public domain. Accepted image licenses are PD/CC0, CC BY and CC BY-SA, with each file's exact license recorded. The full rules are in [LICENSES.md](LICENSES.md).
- **Consequences:** Anyone reusing our data must share alike. Data PRs must record each field's source so that ODbL-derived values stay out of CC BY-SA records.

## ADR-0013 — WEB edition
- **Date:** 2026-09-23 · **Status:** Proposed (CP1) · **By:** PO, from M1-01 and M1-03
- **Context:** Only eBible.org's Protestant-canon packages fit the 66-book rule. `engwebp` (US spelling) and `engwebpb` (British spelling) are both public domain and both render God's name as "LORD".
- **Decision:** Use `engwebp`.
- **Consequences:** Spelling follows US conventions. Changing edition later means re-importing the scripture text only.
