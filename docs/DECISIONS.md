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
- **Date:** 2026-09-23 · **Status:** Accepted (CP1, 2026-09-23, #7) · **By:** PO, from M1-02 ([STACK_OPTIONS.md](research/STACK_OPTIONS.md) §1)
- **Context:** The app is React Native Web from day one, and it needs a path to a native app later (brief §3). It must support vector tiles, GeoJSON overlays and clustering.
- **Decision:** Use MapLibre: `react-map-gl/maplibre` on web and `@maplibre/maplibre-react-native` for native later, behind one app-level map component with `.web` and `.native` implementations. The Frontend Engineer confirms this at the start of M3.
- **Consequences:** Open-source renderer (BSD-3 and MIT) with no vendor lock-in. There are two renderer bindings to maintain. The runner-up is Mapbox, which has commercial terms.

## ADR-0009 — Basemap and ancient mode
- **Date:** 2026-09-23 · **Status:** Accepted (CP1, 2026-09-23, #7) · **By:** PO, from M1-02 §2
- **Context:** Modern mode needs mainstream borders with contested borders hidden when uncertain (brief §1.2). Ancient mode needs first-century provinces for each timeline year, plus roads and coastlines.
- **Decision:** For modern mode, use OpenFreeMap's public OpenMapTiles styles, hiding boundary features where `disputed=1`. It has no SLA, so launch (CP3b) requires tile-error monitoring and a fallback basemap style that can be switched by config, such as Protomaps PMTiles on Cloudflare R2. For ancient mode, draw project-owned GeoJSON overlays on a neutral base and switch them by timeline year. Move to our own PMTiles archive only if the overlay data becomes too large to load.
- **Consequences:** $0 at both traffic levels, with no account or API key. The OSM/OpenMapTiles attribution must be visible. Mapbox tiles in MapLibre were rejected on cost: about $650 a month at 50k visits.

## ADR-0010 — Hosting: Cloudflare Pages
- **Date:** 2026-09-23 · **Status:** Accepted (CP1, 2026-09-23, #7) · **By:** PO, from M1-02 §3
- **Decision:** Host the static app and data on Cloudflare Pages. Deploy production and a preview for each PR from GitHub Actions with Wrangler.
- **Consequences:** Static requests are free and unlimited, and the Free plan allows 500 builds a month. The human creates the Cloudflare account and the deploy token in M3. A static build stays portable to other hosts. The runner-up is Vercel, which would cost $20 a month at moderate traffic.

## ADR-0011 — No backend for the MVP
- **Date:** 2026-09-23 · **Status:** Accepted (CP1, 2026-09-23, #7) · **By:** PO, from M1-02 §4
- **Decision:** Ship static JSON and GeoJSON files, with client-side name search. Add Cloudflare Workers + D1 only if profiling or an editing workflow shows a need for it.
- **Consequences:** No server to run or secure. Search stays a client-side index over roughly 300 locations.

## ADR-0012 — Content licenses
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** Fact-Checker (M1-03; brief §2.4 gives this decision to the agents)
- **Decision:** Code is MIT. OSM- and AWMC-derived geometry in `data/geo/` is ODbL 1.0. All other `data/` and `content/` is CC BY-SA 4.0. WEB text stays public domain. Accepted image licenses are PD/CC0, CC BY and CC BY-SA, with each file's exact license recorded. The full rules are in [LICENSES.md](LICENSES.md).
- **Consequences:** Anyone reusing our data must share alike. Data PRs must record each field's source so that ODbL-derived values stay out of CC BY-SA records.

## ADR-0013 — WEB edition
- **Date:** 2026-09-23 · **Status:** Accepted (CP1, 2026-09-23, #7) · **By:** PO, from M1-01 and M1-03
- **Context:** Only eBible.org's Protestant-canon packages fit the 66-book rule. `engwebp` (US spelling) and `engwebpb` (British spelling) are both public domain and both render God's name as "LORD".
- **Decision:** Use `engwebp`.
- **Consequences:** Spelling follows US conventions. Changing edition later means re-importing the scripture text only.

## ADR-0014 — A data batch is one branch and one PR
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** PO
- **Context:** Brief §6 requires Fact-Checker sign-off on every data PR. If research, images and verification were separate PRs, each data PR would merge before it was verified.
- **Decision:** Each data batch has one card, one branch and one PR. The Research Lead, the Media Curator and the Fact-Checker each add their own commit or commits, in that order. Items that need changes go back to their author on the same branch until the Fact-Checker passes them. The PR Reviewer then reviews the whole branch.
- **Consequences:** Every data PR arrives already verified. A batch takes longer to finish, but the human reviews one PR per batch instead of three.

## ADR-0015 — Review comments open with a reviewer and status header
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** PO, at the human's request
- **Context:** Review comments are posted under the human's GitHub login, and the reviewer's original findings read as open issues even after they are fixed.
- **Decision:** Every posted review comment starts with two lines: `**PR Reviewer (advisory) · <model>**`, then either `**Status: ✅ all findings addressed in <commit>.**` or `**Status: ⚠️ open: <list>**`. The PO fills in the status line before posting, and adds a follow-up note at the end that lists the fixes.
- **Consequences:** The human can see at a glance who reviewed a PR and whether anything still needs attention.

## ADR-0016 — The Media Curator runs on Claude Haiku 4.5
- **Date:** 2026-09-23 · **Status:** Superseded by ADR-0020 · **By:** PO. This supersedes ADR-0003's media-curator row.
- **Context:** On GPT-5 mini (ADR-0003's first choice), the Media Curator found images for only 4 of 21 locations in batch 2 and 13 of 22 in batch 1, mostly one image each. Some showed the wrong place (Berea, Ohio; Na'in, Iran).
- **Decision:** The Media Curator uses Claude Haiku 4.5, which was the fallback. The agent file lists `['Claude Haiku 4.5', 'GPT-5 mini']`.
- **Consequences:** About 100 extra credits per batch. Haiku reached every location with 1–3 images, although the Fact-Checker still caught two wrong-place images, which is why ADR-0017 requires checking a file's categories.

## ADR-0017 — Every factual clause is stated by a cited source
- **Date:** 2026-09-23 · **Status:** Accepted · **By:** PO, from the M2 reviews
- **Context:** Records cited dataset entries (Pleiades, Wikidata, OpenBible) for historical claims that those entries do not state. The Fact-Checker passed some of them; the PR Reviewers caught them.
- **Decision:** Each factual clause in `summary`, `history`, `support` and `otConnections` must be stated by at least one cited source that the author has opened.
  - Dataset IDs support identification and coordinates.
  - `bib:` entries (scholarly works, authority pages) support historical claims.
  - `scripture:<ref>` supports only what that passage says.
  - Wikipedia is never the only source.
  - Media must show the place, confirmed through the file's Commons categories, and must record the exact Commons license name, including IGO and port codes.
- **Consequences:** Data takes longer to write but is safer for public use. The Research Lead, Fact-Checker and Media Curator agent files state these rules.

## ADR-0018 — Rebalance the core set toward Acts and the Epistles
- **Date:** 2026-09-24 · **Status:** Accepted (CP2, 2026-09-24, #14) · **By:** PO, at the human's request ("more Acts and Epistles focused … at least have all the Paul's letters")
- **Context:** Brief §1 gives the Gospels and Acts the most detail, and §5 schedules the Epistles and Revelation places for M6. After reviewing the 40 core sites, the human asked for more Acts and Epistles coverage.
- **Decision:** Keep the 40 verified sites and add batch 3 (M2-05): every destination of Paul's letters, the other places the letters name, Revelation's seven churches and Patmos, and key stops in Acts. It adds 17 sites plus the Galatia, Crete and Malta area records. The regions of 1 Peter 1:1 arrive as province polygons in M4.
- **Consequences:** The core is 57 sites and 6 area records: 22 Gospel sites and 35 Acts and Epistles sites. The M6 batches shrink by about 20 places.

## ADR-0019 — The PO may reply to GitHub comments directly
- **Date:** 2026-09-24 · **Status:** Accepted · **By:** the human ("in the future you can just directly reply to github comments (only for this repo)")
- **Decision:** In this repository, the PO may reply to PR and issue comments without asking first. Each reply opens with `**Project Owner (agent) · <model>**`. Pushing, opening, merging or closing PRs, labels and every other remote change still need the human's approval each time, except deleting merged branches (ADR-0023).
- **Consequences:** Questions on PRs get answered where they were asked, without a round trip through chat.

## ADR-0020 — The Media Curator runs on Claude Sonnet 5 and starts from Wikidata's main image
- **Date:** 2026-09-24 · **Status:** Accepted · **By:** PO. This supersedes ADR-0016.
- **Context:** On Claude Haiku 4.5, batch 3's first image pass took the first files each Commons category listed: a museum in Romania for Galatia, postage stamps for Smyrna, a banana plant for Crete. It left four places empty. The M2-06 review also found 10 poor lead images from the earlier light-model passes.
- **Decision:** The Media Curator uses Claude Sonnet 5, with Claude Haiku 4.5 as the fallback. For each place, it starts from the Wikidata item's main image (P18) and Commons category (P373), then judges every file by its Commons categories and description.
- **Consequences:** About 500 credits per 20-place batch instead of about 80, still under 0.1% of a month. In batch 3's redo, 40 of 55 images passed on the first check, and the rest were fixed in one round.

## ADR-0021 — The Fact-Checker runs on Claude Opus 5.5
- **Date:** 2026-09-24 · **Status:** Accepted (CP2, 2026-09-24, #14) · **By:** PO
- **Context:** In batches 1–2, the PR Reviewers caught unsupported claims and wrong images that the Fact-Checker (Claude Sonnet 5) had passed. Batch 3's Fact-Checker ran on Claude Opus 5.5. It found 30 issues in its first round, then 5, then 1, and the reviewer then found no data problems.
- **Decision:** The Fact-Checker uses Claude Opus 5.5, with Claude Sonnet 5 as the fallback.
- **Consequences:** About 1.7× the cost per session, offset by fewer fix rounds: batch 3 cost about 3,500 credits, against about 5,100 and 6,700 for batches 1 and 2 (agent and review sessions, not the PO's coordination).

## ADR-0022 — Basemap style: OpenFreeMap Liberty
- **Date:** 2026-09-28 · **Status:** Accepted · **By:** the human, at CP3a ("let's go with Liberty")
- **Context:** ADR-0009 chose OpenFreeMap basemaps. The PO recommended the muted Positron style so that the pins would stand out. After comparing real renders of Positron and Liberty at three zoom levels ([VISUAL_SPEC.md → Basemap options](design/VISUAL_SPEC.md#basemap-options-what-positron-and-liberty-look-like-cp3a-decision-1)), the human chose Liberty.
- **Decision:** The app hosts a customized copy of OpenFreeMap **Liberty**, with English labels, no points of interest, and disputed boundaries hidden. The fallback remains a different provider or host (ADR-0009).
- **Consequences:** The map looks more like Google Maps and gives more modern context. To keep every pin at 3:1 contrast or better against Liberty's colours (spec §2), the natural-feature pin changes from `#188038` to `#0B6B2E`; the old colour reached only 2.7:1 on water.

## ADR-0023 — The PO deletes merged remote branches
- **Date:** 2026-09-28 · **Status:** Accepted · **By:** the human ("you can delete the remote branches as soon as they're merged")
- **Decision:** In this repository, once a PR is merged, the PO deletes its remote branch without asking first, after checking that the branch's tip is in `main`. Branches that aren't fully merged stay until the human decides.
- **Consequences:** The remote keeps only `main` and open work. Old branches from M0 to M3 were cleaned up the same day. `copilot/setup-and-plan-milestone-m0` stays, because it isn't merged.

## ADR-0024 — An ancient-only physical basemap, with pins drawn by the map
- **Date:** 2026-09-28 · **Status:** Accepted for the rendering change; the basemap details are Proposed, pending the human's confirmation · **By:** the human ("it's very confusing to have ancient and modern names in the same map ... For now, let's only display the ancient map"; "Zoom and drag both need to be very smooth"; the rendering plan: "sounds good") and the PO
- **Context:** The first build of M3-03 showed Liberty's modern labels (countries, modern cities, Hebrew and Arabic street names) beside our ancient place names. Its pins were HTML elements repositioned by React on every frame, so they lagged a second behind every drag.
- **Decision:** Until the Modern/Ancient toggle arrives (M4), the basemap is a physical version of Liberty: land, water, rivers, landcover and relief, with no labels, roads, borders, towns or buildings, and zoom stops at 14. Ancient empire, province and region names come from our own records (M3-11). Pins, labels and clusters are MapLibre layers drawn on the graphics card; keyboard and screen-reader users reach them through a list of the visible places. With 10,000 test points, dragging and zooming must cause no main-thread task over 50 ms and no DOM change.
- **Consequences:** The map no longer depends on the basemap's labels, so English-only is automatic there. Map labels use the basemap's Noto Sans font instead of the UI font. M3-03 is reworked, and the "modified" notices in `docs/LICENSES.md` describe the physical treatment.
- **Update (M3-12, confirmed by the human on 2026-09-30):** where WebGL runs without a GPU (software renderers such as SwiftShader), the app turns hill shading off and draws at pixel ratio 1, for smoother dragging and zooming. Devices with a GPU keep both; `?relief=1` forces shading on.

## ADR-0025 — The session guard is 10,000 AI credits
- **Date:** 2026-09-28 · **Status:** Accepted · **By:** the human ("you can have 10,000 AI credits per session")
- **Context:** ADR-0005 set a 1,500-credit guard per session. M3-03's first build needed about 1,600, including three rounds of fixes, and a real browser check that caught a broken build.
- **Decision:** The guard is 10,000 AI credits per agent session, for the PO and every specialist. It replaces the 1,500 figure in ADR-0005 and in the task cards. Credit targets on cards stay as forecasts.
- **Consequences:** Agents can finish thorough rework in one session instead of handing off. The month cap (1,000,000) and the 80% and 95% stops don't change.

## ADR-0026 — English only: names follow the most popular English Bibles
- **Date:** 2026-09-28 · **Status:** Accepted · **By:** the human ("for now, let's just make this map for english speakers only"; "Search doesn't need to support other languages either. We just need to make sure that as readers go through the Bible, they can look up the english names of the places"; "let's use the spelling that most popular versions agree on") and the PO
- **Context:** The data mixed English Bible names with Hebrew, Greek, Latin, Arabic and Turkish forms, and the panel and search would have used them all. Malta's title was the KJV's "Melita".
- **Decision:**
  - The title is the spelling most of the NIV, ESV, NLT, KJV, NKJV and CSB agree on. An even split falls back to the WEB, which is the text the app quotes. Where versions differ because of a manuscript variant rather than a spelling, the title follows the record's identification and the WEB, and the other reading stays searchable. So far only Magdala ("Magadan" in 4 of 6 versions at Matthew 15:39) is affected; the human confirmed this exception on 2026-09-29 ("keep").
  - `names.ancient` and `names.alternate` hold English names only, including every version's spelling and the WEB's, and search covers exactly these.
  - Other-language names move to `names.otherLanguages`, which the app never shows or searches; they stay only so the research isn't lost (the PO's default, pending the human's confirmation).
  - Modern names and candidate labels are still shown in the panel but are not searched. The human confirmed on 2026-09-29: search covers "only english Bible names and historical names", meaning the English names in `ancient` and `alternate`.
  - The spelling comparison records spellings only, never verse text from copyrighted versions.
- **Consequences:** M3-10 applies the rule to all 63 records, and M3-11's new records follow it. M3-04 shows the modern name as "Today: *name*". M3-05 searches English names only, so "Al-Quds", "Imwas" and "Alaşehir" no longer find anything. Other languages remain in the backlog.

## ADR-0027 — Ancient country and region names, as of about AD 50
- **Date:** 2026-09-28 · **Status:** Accepted · **By:** the human ("I'd still want the country and the region. For example, for athens, would the country be the Roman Empire and the region be Greece?"; confirming the plan: "That's exactly what I want")
- **Context:** The physical basemap (ADR-0024) no longer shows modern countries, and readers still need to know where a place was. In the first century, Athens was in the Roman Empire, in the province of Achaia, which the Bible also calls "Greece" once (Acts 20:2).
- **Decision:** New record types `empire` and `province` hold the Roman Empire and its provinces, as they stood in about AD 50, the time of Paul's journeys, with names under ADR-0026. Every place's parent chain ends at the Roman Empire. The map shows them as labels, and the place panel shows a line such as "City · Achaia · Roman Empire". Borders, and changes over 4 BC – AD 100, come with M4's ancient layer and timeline.
- **Consequences:** M3-11 adds about a dozen researched records and sets every place's parent. Judea's two meanings (the district and the Roman province) need a clear, sourced model.
- **Confirmed by the human (2026-09-29):** the two Judea records ("That's fine"), and related verses for well-known areas the NT doesn't name directly, such as the Roman Empire ("for places that people generally know and can provide good information, we should have them").

## ADR-0028 — Modern names show the country
- **Date:** 2026-09-30 · **Status:** Accepted · **By:** the human ("For the modern names, let's add a country after all. Overall, let's prioritize 'usefulness for Bible readers' over 'let's avoid controversy'. For instance, when you click on Ephesus and it says 'Today: Selcuk,' I bet 95% of the people will have no idea that it's in Turkiye") and the PO (the format and the rules for special cases)
- **Context:** CP3a decision 3 and M3-08 kept modern names free of any country, so that the panel would never take a side on a disputed border. The result is that "Today: Selçuk" tells most readers nothing. The physical basemap (ADR-0024) shows no countries either.
- **Decision:** This replaces CP3a decision 3, M3-08's no-country rule and the old §8 of the visual spec.
  - Every record gets `names.modernCountries`: the present-day country or countries the place or area lies in, as English short names from one allow-list in the schema (for example "Türkiye", "Greece", "Italy", "Israel", "Syria").
  - Places outside any one country's undisputed territory use the territory name most English news and reference works use: **"West Bank"** (for example Bethlehem, Jericho and Al-Eizariya) and **"Golan Heights"** (for example Banias). This describes where the place is, not who should rule it.
  - **Jerusalem and the places inside it** (the Temple Mount, Golgotha, Gethsemane and so on) take no country: their modern name already says "Jerusalem", which every reader can place, and its status is the most disputed of all. Empires take no country either.
  - **The panel shows** "Today: Selçuk, Türkiye", or "Today: Near Denizli, Türkiye". Areas get a short orienting phrase as their modern name, such as "Central Türkiye" or "Parts of Greece, North Macedonia and Albania", and the country isn't repeated when the phrase already names it. Places with disputed locations show where the proposed sites are, for example "Today: proposed sites in Israel and the West Bank".
  - Search still covers English Bible and historical names only (ADR-0026). Search results show the modern name with its country as their second line.
  - Candidate labels keep M3-08's form for now.
- **Consequences:** After CP3.5 (ADR-0029), a data task adds the field to all records (GIS Engineer, then Research Lead, then Fact-Checker), and a panel task shows it. The "West Bank", "Golan Heights" and Jerusalem rules are the PO's defaults until the human confirms them.
- **Update (CP3.5, the PO):**
  - **Display:** disputed places show only their countries, as in "Today: Israel and the West Bank". The "Location disputed · *n* proposed sites" chip follows on the same line (ADR-0030), so "proposed sites" isn't said twice.
  - **Defaults:** they also cover Sychar (Tell Balata) and Qasr al-Yahud ("West Bank"), and both Bethsaida sites ("Golan Heights"). The human approved them as CP3.5 decision 1 on 2026-10-02 (#37), so they are no longer provisional.
  - Cards M3-14 (data) and M3-15 (panel) carry the decision out.
- **Update (2026-10-05, the human at mini checkpoint MC1: "that's ok"):** Salamis reads "Cyprus", not "Northern Cyprus". For Cyprus, the island's name is also the name of the internationally recognized state, while "Northern Cyprus" is mainly the name of an entity only Türkiye recognizes. So the West Bank and Golan Heights rule doesn't extend to it.

## ADR-0029 — Images first: milestone M3.5
- **Date:** 2026-09-30 · **Status:** Accepted · **By:** the human ("the images need to be a much bigger focus because that's how most Bible readers get their very first impressions on a lot of cities. This can be its own milestone and should be done before adding more cities"; "Assassin's creed level image is what I'm looking for"; "just start working on the images. ... let's not add anything else before we resolve the images milestone") and the PO (the milestone's shape and the major-place list)
- **Context:** Places have 1–3 photos, and some show little more than stones (Laodicea). Five image links are broken, Rome's among them. AI reconstructions existed only as an idea: agents may write prompts, and the human generates images later (brief §2.5).
- **Decision:**
  1. **A new milestone, M3.5 "Images",** starts now, and nothing else is added until it ends at checkpoint **CP3.5**. M3's remaining work (the preview deploy, M3-06, and CP3b) and the changes from ADR-0028, ADR-0030 and the longer "About" follow after it. Later milestones keep their numbers.
  2. **Major places** get the full treatment; every other place is standard. Records carry `prominence: "major"` or `"standard"`. The human's three groups, plus the seven churches of Revelation (the PO's addition, since each is addressed by name in Revelation 2–3), give 31 major places:
     - **Jerusalem and the Gospels (13):** Jerusalem, the Temple Mount, Golgotha, Gethsemane, the Mount of Olives, Bethlehem, Nazareth, Capernaum, the Sea of Galilee, Cana, Jericho, Bethany, and Bethany beyond the Jordan.
     - **Paul's letters and the capitals (12):** Rome, Corinth, Galatia, Ephesus, Philippi, Colossae, Thessalonica, Crete (Titus), Athens, Antioch on the Orontes, Caesarea Maritima and Damascus.
     - **Revelation's churches (6, with Ephesus above):** Smyrna, Pergamum, Thyatira, Sardis, Philadelphia and Laodicea.
  3. **How many images:** major places get **5 to 10**, standard places **1 to 3** (1–2 is enough, and a good third image stays).
     - **Update (2026-10-05, the human: "for the more important places, we should have 4-7 images (including the AI generated ones)"):** major places now get **4 to 7**, counting the AI reconstruction. Standard places stay at 1 to 3. Of the 31 major places, 24 already had 6 or 7 images. The other 7 (Corinth, Damascus, Galatia, Laodicea, Pergamum, Philippi and Rome) had 8, and each drops the image that adds least (M3-18).
  4. **A mix of kinds**, each image tagged with its `kind`: `modern` (the place today), `site` (the excavated remains), `reconstruction` (a freely licensed model, drawing or painting of the ancient place), `historical` (an old photograph, engraving or painting that shows the place as it looked when it was made; added after batch C's verification on 2026-10-01, so that dated views aren't labelled "Today") and `ai-reconstruction`. A major place should have at least one of each of the first two, plus a reconstruction where possible.
  5. **The overall feel of a place, not fragments:** wide views of the city in its landscape, a whole theatre, street or harbour, the modern skyline. Close-ups of single stones, inscriptions or fragments are dropped unless that object is what the place is famous for. Every current image that fails this rule is replaced.
  6. **Every image must load:** the validator checks each Commons address offline, and a link check loads every image at the sizes the app uses, on media changes and weekly.
  7. **AI reconstructions, made the way historical games make theirs:** studios such as Ubisoft work from historians' advice, excavation plans, ancient descriptions, coins and frescoes, and fill the gaps with informed guesses. Here:
     1. the Research Lead writes a **cited research brief** for each major place, covering its layout, the buildings that stood in about AD 30–60, materials and colours, landscape and plants, people and dress, and a list of what is unknown;
     2. the Media Curator turns it into 1–3 prompts: an overview of the city and its key sites;
     3. the Fact-Checker checks the brief and prompts for anachronisms;
     4. **the human generates the images** with a tool whose terms allow us to publish them for anyone to reuse, since the project's content license (CC BY-SA 4.0) allows reuse, including commercial;
     5. the Fact-Checker checks each image against its brief and rejects any that contradict it;
     6. the project hosts the accepted images itself, as compressed WebP files of up to 1,600 px. On the image they carry the label **"AI-generated reconstruction"**, with a "Based on" note linking to the brief's sources.

     There are no more than 3 AI images per place, and they never replace a real photo of what survives.
     - **Update (2026-10-01, the human: "Historical details is the most important thing"):** agents generate the images through an image API, using keys the human stores as user environment variables (never in the repository). Each image goes through a check loop: generate, the Fact-Checker views it against its brief and lists every error, the prompt is revised, and the image is regenerated, for up to 3 rounds. The human approves the final set before it is published. A free test on Cloudflare Workers AI (FLUX.2 klein 4B, Leonardo Lucid Origin) produced attractive images that lost historical details (glazed windows, pitched roofs, chimneys). The human's rule: first improve the prompts on the free model over a few rounds; switch to a paid top-tier model only if the prompts are judged good but the model still doesn't follow them.
     - **Prompt test (2026-10-01):** three rounds for Capernaum on FLUX.2 klein, and three for Jerusalem on both free models (the curator's prompt and two rewrites). Prompts that describe only what is in the picture worked far better than "keep out" lists, and the curator's prompt rules now say so. For Capernaum, a village, the third round was close to the brief: basalt walls, flat mud roofs, shared walls, boats and nets. Jerusalem, with complex buildings, failed in every round. Both models ignored stated sizes, shrinking the sanctuary to a small box, and added a modern city, domes and medieval battlements. The free tier also allows only about 15–20 images a day (10,000 "neurons"), too few for the check loop. Both points go to the human for the paid-model decision.
     - **Paid model, one image per place (2026-10-01):** the human chose Google's Gemini API (Nano Banana Pro) and asked to be "extremely conservative with the number of images", with "1 AI image per important city at this point". So each of the 31 major places gets one AI image, from its single best view. Each prompt is rewritten under the curator's rules and checked against its brief by the Fact-Checker before anything is generated. Each prompt is then generated once. A place is regenerated only when the Fact-Checker finds a real error and the prompt has been revised and rechecked, at most twice; if it still fails, the PO reports it to the human. Jerusalem goes first as the test of the model. The other prompts stay in the briefs for later.
     - **Result (2026-10-01):** on Gemini's Flex tier (half the standard price, about US$0.07 an image), all 31 prompts gave a usable image on the first try, and no prompt needed revising. The Fact-Checker accepted 15 and found real errors in 16: later buildings, modern objects such as radio masts and painted boats, and famous buildings drawn as today's ruins. Rather than regenerating, each of the 16 was fixed with one edit of the same image, which keeps the composition and costs the same as a new image. Thessalonica was mirrored for free, so that the gulf sits on the correct side. The PO's check of the edits found three more errors, each fixed with one more edit: a dome the edit added to Jerusalem, radio masts left on a hill near Athens, and rope ladders (ratlines, a late-medieval feature) on the ships at Crete. In all, 50 paid images cost about US$3.49 of the US$20 the human set aside. The AI image comes first in each place's gallery, so that a reader's first impression is the place as it looked in Bible times (PO ruling). The images are committed only on the local branch; nothing is pushed until the human approves the set.
  8. **The panel's gallery** grows to fit: a larger viewer, labels for each kind of image, and photos that load only when needed, so the map stays smooth.
- **Consequences:** Cards M3.5-01 to M3.5-07 cover the schema and link fixes, three research-and-image batches, a pass over standard places, the panel's gallery, and the AI images. The human's open choice is which image generator to use; the Fact-Checker reviews its terms and the license we release the images under. Brief §2.5 and §5 are updated to match.
- **Next, after CP3.5 (the human, 2026-09-30):** a longer "About" for major places: 250–450 words in 3–5 short paragraphs, each factual clause cited (ADR-0017). The research briefs written for M3.5 feed it.

## ADR-0030 — A simpler panel header
- **Date:** 2026-09-30 · **Status:** Accepted · **By:** the human ("The 'zoom to,' 'copy link', 'sources' bar isn't really that helpful and it doesn't look very good. Remove them altogether"; "move the 'High confidence' or 'disputed' to right by 'Today:...' so that it's easier to see what the 'high confidence' is about")
- **Decision:** The panel has no action bar. Opening a place still frames all its candidate sites on the map, the address bar still holds the place's link, and the Sources list stays at the end of the panel. The location-confidence chip, or the "Location disputed" or "*n* sites" note, sits on the "Today: …" line, right after the modern name.
- **Consequences:** After CP3.5 (ADR-0029), a panel task removes the bar and its tests, moves the chip, and updates visual spec §3 and §10 and wireframe 02.

## ADR-0031 — Mini checkpoints with a local preview
- **Date:** 2026-10-05 · **Status:** Accepted · **By:** the human ("designate mini checkpoints amongst these todos and open up a test website such that I can visually see and give feedbacks")
- **Context:** Checkpoints come at the end of a milestone, so the human saw the app mostly through screenshots in PRs. Feedback that came late (ADR-0030, for example) meant another round of work.
- **Decision:** Between checkpoints, the PO marks mini checkpoints in its task list: after each task, or half of a task, that changes what the human sees, and always one before asking for a push. At each one, the PO builds the app with the work so far, serves it on localhost, opens it in the human's browser, and lists what to try. A mini checkpoint has no PR and needs no approval. Only the next step the feedback could change waits for it; other work continues. The PO keeps the steps in `.github/agents/project-owner.agent.md` and lists the mini checkpoints in `CHECKPOINTS.md`.
- **Consequences:** The human tries each visible change in a real browser before reviews and the push. Once M3-06 is live, a Cloudflare preview link can stand in for the local server.

## ADR-0032 — Photo credits at the end of the panel, and a pointer over pins
- **Date:** 2026-10-05 · **Status:** Accepted · **By:** the human, at mini checkpoint MC0 ("Is it possible to cite the photo credit at the end instead? It's a little distracting"; "Can you change the cursor to something like a pointer when hovered over any site? Currently it's a flat hand and it's not as easy to click especially in crowded places")
- **Decision:**
  1. Under the panel's image, only the caption remains. The "AI-generated reconstruction" label stays on the image (ADR-0029), and the large viewer keeps its credit line. Each image's credit moves to a numbered "Photo credits" list at the end of the panel, numbered as in the gallery. The Fact-Checker first rules on what the licenses require of this placement.
  2. Over any clickable map feature, the cursor becomes the pointing hand; elsewhere the map keeps its open-hand drag cursor. Clicks and hovers find the nearest pin within a few pixels, so crowded pins are easier to hit.
- **Consequences:** Card M3-19, after M3-15 and M3-06, since it changes the panel M3-15 rebuilt and the smoke test M3-06 added. The Fact-Checker updates `docs/LICENSES.md`, and the visual spec §2, §3 and §9 change to match.

## ADR-0033 — Introduce names; places in the About; collapsible sections
- **Date:** 2026-10-05 · **Status:** Accepted · **By:** the human, at mini checkpoints MC1 and MC2 ("in general, please don't name drop without introduction unless it's pretty obvious in the Bible. For example, most people don't know who 'Josephus' or 'Herodotus' are"; "if there're places in a city, lift them all the way up right below the 'About' ... if there're places in the About, it might be good to have a link such that people can more directly see where they are"; "sections should be collapsable as well. Perhaps we can have 'Sources' and 'Photo credits' collapsed by default? The Bible section's 'Show all ... passages' should also allow for collapsing that back to previews")
- **Decision:**
  1. **Names in the text.** The About text introduces every person, writer or work the first time it names them, unless the Bible makes them familiar: "the first-century Jewish historian Josephus", not "Josephus". The text doesn't name databases such as Pleiades, Wikidata or Livius, since the Sources list already names them.
  2. **Places in the About.** "Places in *name*" moves directly below About. In the About text, the first mention of another place on the map becomes a link: pointing at it highlights that place's pin, and selecting it opens the place.
  3. **Collapsible sections.** Each panel section below the header can collapse. Sources and Photo credits start collapsed, and "Show all *n* passages" can go back to the preview. The Fact-Checker rules first on whether credits may start collapsed (M3-19's ruling said they must not).
- **Consequences:** The rule in item 1 goes into visual spec §8, the Research Lead's instructions and card M3-16. M3-16's second half follows it and fixes the 8 places of the first half that need it, and card M3-22 fixes the other 30 places. Card M3-20 covers item 2, and card M3-21 covers item 3 (the human: "this can be its own task").

## ADR-0034 — CI reports the speed gate's Total Blocking Time; the PO enforces it from a desktop
- **Date:** 2026-10-05 · **Status:** Accepted · **By:** the human ("ok in that case proceed with your in progress change please"), on the PO's recommendation
- **Context:** Visual spec §11 sets two Lighthouse gates for the desktop preset with a cold cache: Largest Contentful Paint (LCP) of 2.5 s or less and Total Blocking Time (TBT) of 200 ms or less. M3-06 runs them in CI against each PR's preview.
  - GitHub's free Linux runners have no graphics card, so the map is drawn in software on shared CPU cores.
  - Against #39's preview, CI measured TBT of 331 ms in one run. After WebGL was moved into Chrome's GPU process, it measured a median of 584 ms over three runs.
  - From a Windows desktop against the same preview, the median over three runs was 9 ms (0–15 ms), with LCP about 0.4 s. That desktop has no graphics card either.
  - All the long tasks are the map's own drawing.
  - LCP passes in CI, at about 1.2 s.
- **Decision:**
  1. In CI, the preview check enforces LCP, using the median of three runs, and only reports TBT, with the reason in the log (`--tbt-mode=report`). The smoke and accessibility checks stay blocking.
  2. `scripts/verify-web-lighthouse.mjs` enforces both gates by default. Before asking the human to merge a PR that changes the app, the PO runs it against that PR's preview from a desktop and puts the numbers in the PR.
  3. Revisit this if GitHub's free runners gain graphics cards, or if TBT in CI rises well above the levels above.
- **Consequences:** M3-06's acceptance criterion now reads "LCP passes in CI and TBT is reported there; both gates pass from a desktop against the preview". The PO's agent file includes the desktop check.
- **Update (2026-10-07, ADR-0036):** CI no longer runs Lighthouse on PRs. Both gates are enforced only from a desktop, against each PR's preview, before a merge.

## ADR-0035 — Important places first on the opening map
- **Date:** 2026-10-06 · **Status:** Accepted · **By:** the human, at mini checkpoint MC3 ("When the map first loads, the places that show up are 'Nicopolis', 'Troas', 'Perga' etc. Most Bible readers probably have never heard of these places before ... What'd actually be really helpful is if we can find a good way to show the more important places (like the ones addressed to from Paul's letters) when the map first loads ... Perhaps let's try to put as many important places in the smaller dots as we can and collapse the less important places into the bigger dots?"), and the PO (the importance order and how close places group)
- **Context:**
  - The map opens at zoom 4.7 and clusters every city, town and village by distance alone.
  - Isolated places, often little-known ones such as Nicopolis, Troas and Perga, stay as labelled pins.
  - The areas where most major places lie are folded into count bubbles. These are Judea, Galilee, and the churches of Asia.
  - Labels are ranked by place type and then by the data's order, not by importance.
  - At the opening zoom, Jerusalem, Bethlehem, Bethany, Jericho and Bethany beyond the Jordan lie within about 6 pixels of each other, so they can't all be drawn as separate dots.
- **Decision:**
  1. **Importance order:** the 31 major places (ADR-0029) come first. Within major places, and within other places, the place with more Bible passages comes first (its `scripture` entries; Jerusalem has 174, Nazareth 37, Damascus and Ephesus 26). Ties follow the data's order. The order comes from the data, takes no side, and still works as M6 adds places.
  2. **Major places get their own dots:** below zoom 7, each major place is a labelled pin of its own and is never folded into a count bubble with other places. Major places too close to draw apart at the current zoom show as one pin. Its label names the most important member and adds the number of the others, as in "Jerusalem +4". Selecting that pin opens the named place, and its framing then shows the others.
  3. **Other places step back:** below zoom 6, places that aren't major are drawn as small, muted dots without labels, and nearby ones fold into muted count bubbles. They keep their tooltips, stay clickable, and stay in the keyboard list. From zoom 6, they look as they do now.
  4. **Label priority:** first the selected place, then major places in importance order (including the major areas Galatia and Crete), then empires, provinces and regions, then other places.
- **Consequences:** Card M3-23 builds this (Frontend Engineer). Visual spec §2 and wireframe 01 change to match. The smoothness rules of ADR-0024 still apply.

## ADR-0036 — Lean CI: fast checks and deploys in CI, the full browser suite run locally
- **Date:** 2026-10-07 · **Status:** Accepted · **By:** the human ("let's reexamine what we actually need for CI if local tests are consistently passing"; on the PO's recommendation: "that sounds good to me")
- **Context:**
  - A PR's CI took about 17 minutes:
    - the full Playwright suite (`verify:web:playwright`) took 10¼ minutes;
    - everything else in the build took about 1½ minutes;
    - deploying and checking the preview took about 4 minutes.
  - The same suite runs locally before every push: each engineer runs it, and the PO runs it on the assembled stack.
  - Of 24 app-workflow runs, 9 failed. Most failures came from outside our code: GitHub outages, the public VersaTiles server, Wikimedia rate limits (HTTP 429) and slow-runner timing. CI did find real problems too: an expired Cloudflare token, a missing permission, and a "Show fewer" jump that only appears on slow machines.
  - `data.yml` repeated the app workflow's tests and validation.
  - The image link check loaded all 275 images on every PR that touched media, which took about 35 minutes and ran into Wikimedia's rate limits when several PRs ran at once.
- **Decision:**
  1. **Every PR runs:** lint, type-check, unit tests, data validation, the data build and the web export; the preview deploy with its link comment; and the smoke and accessibility checks against the live preview. Pushes to `main` deploy production.
  2. **Run locally, not in CI on every PR:** the full Playwright suite and Lighthouse. Engineers run them before every commit that changes the app. The PO runs them on the assembled stack, and runs the speed gate against each preview from a desktop (ADR-0034), before asking for a merge.
  3. **Weekly on `main`** (and on demand): the full Playwright suite, so slow-machine timing bugs and outside changes still surface. GitHub emails the owner when a scheduled run fails.
  4. **`data.yml` is removed**, since the app workflow covers it.
  5. **Image links:** on a PR, only the images the PR adds or changes are checked; the full check stays weekly.
- **Consequences:** Card M3-24 makes the change. ADR-0034's CI part (LCP enforced, TBT reported) is replaced by item 2. A PR's CI should take about 5 minutes.