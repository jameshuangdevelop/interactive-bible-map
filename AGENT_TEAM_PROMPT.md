# Interactive Bible Map — Multi-Agent Project Brief (GitHub Copilot)

Repository: https://github.com/jameshuangdevelop/interactive-bible-map (public, MIT, default branch `main`)
Display name: **Interactive Bible Map**
Human owner/approver: @jameshuangdevelop (professional software engineer, ~4 yrs; limited web/GIS experience — explain GIS concepts and link learning resources in PRs).

---

## 1. Product vision
A Google-Maps-style, 2D interactive web map of New Testament locations, with the most detail for the Gospels and Acts. It is for anyone doing Bible study, and it must be accurate enough for general-public historical use. Tone is **neutral and scholarly**. The canon is the **66-book Protestant canon**. Old Testament references appear only as "connections".

### Core features
1. **Map**: drag, zoom, and a zoom hierarchy: Mediterranean → Roman province/region → city → sites within a city (e.g. Temple Mount and Pool of Bethesda inside Jerusalem). Include Israel/Judea, and lightly include Egypt and Ethiopia (few details).
2. **Modern ↔ Ancient toggle**
   - Modern: modern place names/basemap. Use the borders a mainstream basemap (Google Maps style) shows. If that is uncertain, **do not draw borders for contested areas**.
   - Ancient: first-century names plus matching ancient features (Roman provinces, client kingdoms, major Roman roads, ancient coastlines where the data supports it).
3. **Timeline slider (first century only, ~4 BC–AD 100)**. It changes the map only at years when **political geography or names changed** (e.g. 4 BC division of Herod's kingdom, AD 6 Judea becomes a Roman province, AD 41–44 Agrippa I, AD 70 fall of Jerusalem). It snaps to those years only. Designed to extend beyond the first century later.
4. **Location click → details panel** in Google Maps style: 1–3 photos at the top → ancient/modern names → general, widely agreed historical description → Biblical context (every scripture mention, WEB text) → OT connections.
5. **Disputed sites**: show **several candidate sites**, each with its scholarly support and sources (e.g. Emmaus, Bethsaida, Cana).
6. **Routes tab** (separate from the main map so it stays uncluttered): Paul's journeys (3 missionary journeys + voyage to Rome), and Jesus' movements **limited to well-attested, generally agreed segments**. No full harmonized itinerary. Every segment cites its passages.
7. **Search**: by location name only (ancient + modern + alternate names). English only.

### Out of scope (for now)
3D terrain, offline, other languages, quizzes, audio, search by verse or person, anything outside the first century.

---

## 2. Hard rules for all agents
1. **Research before generating.** Always look for existing open datasets and sources first. **Never guess coordinates or facts.** Candidate sources to evaluate (check licenses): OpenBible.info Bible Geocoding, Pleiades, Digital Atlas of the Roman Empire (DARE), ORBIS (Stanford), AWMC (Ancient World Mapping Center) geodata, Wikidata, Wikimedia Commons, Natural Earth, OpenStreetMap-based basemaps.
2. **Every fact has a source.** Every location record stores source citations and a `confidence` field (`high` / `medium` / `low` / `disputed`).
3. **Bible text = World English Bible (WEB) only** (public domain). No ESV/NIV/etc.
4. **Licensing:** code is MIT. The agents must decide on and document content licenses, e.g. a separate data license (CC BY-SA 4.0 if required by upstream sources such as Pleiades/OSM/Wikimedia). They keep `docs/LICENSES.md` and `ATTRIBUTION.md` listing every upstream source, its license and required attribution. Do not use any source whose license is incompatible.
5. **Images:** only freely licensed images (Wikimedia Commons, public domain art), **hotlinked**, 1–3 per location, with author/license/source stored in data and shown in the UI. AI reconstructions: agents **write labeled prompts only** (in `content/image-prompts/`). The human generates them later, and they must be shown with an "AI-generated reconstruction" label.
6. **Neutrality:** present scholarly consensus. Where traditions differ (e.g. Catholic/Orthodox pilgrimage sites vs. archaeological proposals), describe each side neutrally and do not take one.
7. **Workflow:** feature branches → PRs → the human merges. **Never push to `main`.** One focused PR per task. Conventional commit messages.
8. **Cost efficiency (budget: 1,000,000 GitHub Copilot AI credits/month across all Copilot agents; 1 credit = US$0.01, charged per token at each model's rate):**
   - Keep output short: diffs over full rewrites; no repeating context; summaries under 200 words unless asked.
   - Read only the files you need. Use `docs/` as shared memory instead of re-researching.
   - Use the cheapest model that can do the task well (see §3).
   - Every PR appends a row to `docs/BUDGET.md` (date, agent, model, task, estimated tokens in/out, AI credits used, running monthly total in AI credits).
   - At **80%** of the monthly budget the PO stops starting new milestones. At **95%**, all agents stop at a clean handoff point, update `docs/PROGRESS.md` with the exact resume point, and open or refresh a "Paused – budget" PR/issue.

---

## 3. Org structure (strict hierarchy; agents may work in parallel)

```
Human Owner (@jameshuangdevelop) — approves checkpoints, merges PRs
└── 1. Project Owner (PO)
    ├── 2. Research Lead ──────► 3. Fact-Checker & Licensing (independent verifier)
    ├── 4. GIS/Data Engineer
    ├── 5. Frontend Engineer
    ├── 6. Media Curator
    └── 7. PR Reviewer (advisory; reviews every PR)
```

Only the PO assigns work and talks to the human about scope. Specialists report to the PO. The Fact-Checker and PR Reviewer are independent: they cannot be overruled on *findings*, only on *priority*.

| # | Agent | Recommended model | Responsibilities | Primary outputs |
|---|---|---|---|---|
| 1 | **Project Owner** | Claude (top tier) | Break down milestones, assign tasks, run tasks in parallel, keep checkpoints, keep scope, watch budget, write the checkpoint PR summaries for the human. Also owns art direction (Google-Maps-like visual spec). | `CHECKPOINTS.md`, `BACKLOG.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md` (ADR log), `docs/BUDGET.md` rollups, `docs/tasks/*.md` |
| 2 | **Research Lead** | Claude (mid tier) | Inventory and evaluate all available datasets/sources. Compile location records, political-change events for the timeline, and route segments. Identify candidate sites for disputed locations. | `docs/research/SOURCES.md`, `data/locations/*.json`, `data/timeline.json`, `data/routes/*.json` (drafts) |
| 3 | **Fact-Checker & Licensing** | Claude (mid tier) | Independently verify every record: coordinates vs. ≥2 sources, scripture refs vs. WEB, dates, neutrality. Verify license compatibility of every source and image. | `docs/verification/<milestone>.md`, `docs/LICENSES.md`, `ATTRIBUTION.md` |
| 4 | **GIS/Data Engineer** | OpenAI Codex / GPT | Data schema + JSON Schema validation. Convert sources to GeoJSON. Ancient layers (provinces per timeline year, roads, coastlines). Zoom-level tiers. Data build scripts. Evaluate basemap/tile options. | `schema/*.schema.json`, `data/geo/*.geojson`, `scripts/`, data validation in CI |
| 5 | **Frontend Engineer** | OpenAI Codex / GPT | **React Native Web from day one** (e.g. Expo + RN Web; the agent picks and justifies the map library for web now and native later). Map, toggle, timeline, details panel, routes tab, search. Responsive design comes after the MVP. Tests. | `app/`, component tests, GitHub Actions (lint/test/build/preview) |
| 6 | **Media Curator** | Cheapest capable (e.g. GPT mini / Claude Haiku-class) | Find 1–3 freely licensed Wikimedia images per location with full attribution metadata. Write labeled AI reconstruction prompts. | `data/media/*.json`, `content/image-prompts/*.md` |
| 7 | **PR Reviewer** | Claude (mid tier) — deliberately a different vendor than the code authors | Review every PR: correctness, security, performance, accessibility basics, data/schema compliance, licensing/attribution present, budget row present. **Advisory only.** Leaves review comments and a summary with `must-consider` / `suggestion` / `nit` labels. Explains GIS concepts for the human where relevant. | PR review comments |

If a model named here is not available in the Copilot surface being used (or is blocked by Enterprise policy), the PO picks the closest allowed equivalent and records the substitution in `docs/DECISIONS.md`.

---

## 4. Data model (starting point — the GIS Engineer finalizes it and the Fact-Checker reviews it)

```json
{
  "id": "capernaum",
  "names": {
    "ancient": ["Capernaum", "Kfar Nahum"],
    "modern": "Kfar Nahum / Tell Hum",
    "alternate": []
  },
  "type": "city",
  "zoomTier": "city",
  "parentId": "galilee",
  "candidates": [
    {
      "label": "Tell Hum",
      "coordinates": [35.575, 32.880],
      "confidence": "high",
      "support": "Short neutral summary of scholarly support",
      "sources": ["pleiades:678180", "openbible:capernaum"]
    }
  ],
  "summary": "Widely agreed historical description (neutral).",
  "history": [{ "text": "…", "sources": ["…"] }],
  "scripture": [{ "ref": "Mark 1:21", "textWEB": "…", "book": "Mark" }],
  "otConnections": [{ "ref": "Isaiah 9:1", "note": "…" }],
  "politicalHistory": [{ "fromYear": -4, "toYear": 39, "entity": "Tetrarchy of Herod Antipas" }],
  "media": [{
    "url": "https://upload.wikimedia.org/…",
    "author": "…",
    "license": "CC BY-SA 4.0",
    "sourcePage": "https://commons.wikimedia.org/…",
    "aiGenerated": false
  }],
  "status": "verified",
  "verifiedBy": "fact-checker",
  "lastReviewed": "YYYY-MM-DD"
}
```

- Coordinates are GeoJSON order `[lon, lat]`. Years are integers, with BC as negative numbers (no year 0; document the convention).
- Disputed locations: several `candidates`, each with its own confidence and sources.
- Routes: a list of segments. Each segment has `from`, `to`, `passages[]`, `attestation` (only well-attested segments for Jesus), `journey` (e.g. `paul-1`), and `sources`.

---

## 5. Milestones and human checkpoints
Each checkpoint = a PR labeled `checkpoint`, with a summary, decisions needed, and budget used. **All agents pause at a checkpoint until the human approves (merges or comments "approved").**

| Milestone | Scope | Checkpoint deliverable |
|---|---|---|
| **M0 – Setup & Plan** | Repo scaffolding, `CHECKPOINTS.md`, `BACKLOG.md`, `docs/` structure (incl. `docs/tasks/`), `.github/agents/` custom agent definitions for the 7 roles, PR template (with budget + attribution checklist), `docs/BUDGET.md`. | **CP0:** plan, org chart, budget forecast |
| **M1 – Research & Options** | Source inventory with licenses. **Tech stack options** (≥2 each for map library, basemap/tiles, hosting, and whether a backend is needed), each with pros/cons, **monthly pricing** at hobby and moderate traffic, a free-tier option, and a recommendation. Suggested learning resources for the human (GIS basics, MapLibre/tiles, RN Web). | **CP1:** human picks the stack; ADRs recorded |
| **M2 – Schema & Core Data** | Final schema + validation CI. **40 core MVP sites** with real, verified data (Jerusalem + sub-sites, Galilee cities, Bethlehem, Nazareth, key Acts cities, Pauline church cities). Fact-check report. | **CP2:** review 40-site dataset + verification report |
| **M3 – MVP App** | RN Web app: pan/zoom, zoom hierarchy, clickable pins, Google-Maps-style details panel (photos → names → description → scripture/OT), multiple candidate sites, search by name, GitHub Actions (lint/test/build/preview deploy). Low-fidelity visual spec first. | **CP3a:** visual spec/mockup · **CP3b:** working MVP deployed to preview |
| **M4 – Ancient Layer & Timeline** | Modern↔Ancient toggle, ancient provinces/roads, timeline snapping to political-change years (first century). | **CP4** |
| **M5 – Routes Tab** | Paul's journeys + well-attested Jesus segments, with citations. | **CP5** |
| **M6 – Expansion** | Grow to ~300 locations in verified batches (≈50 per PR), plus Epistles/Revelation places, and lighter coverage of Egypt and Ethiopia. | **CP6+:** one checkpoint per batch |
| **M7 – Mobile-web polish** | Responsive layout, touch gestures, performance. | **CP7** |

`BACKLOG.md` holds all deferred ideas (3D terrain, native app build, more centuries, languages, verse/person search).

---

## 6. Definition of done (every PR)
- [ ] Focused on a single task; branch `feat/…`, `data/…`, `docs/…`, `chore/…`, or `fix/…`
- [ ] CI green (lint, type-check, tests, data schema validation)
- [ ] Data changes: sources cited, Fact-Checker sign-off, `ATTRIBUTION.md` updated
- [ ] Images: license + author + source stored and shown; AI images labeled
- [ ] Row appended to `docs/BUDGET.md`; `docs/PROGRESS.md` updated
- [ ] PR Reviewer comments addressed or explicitly deferred to `BACKLOG.md`
- [ ] GIS/new concepts briefly explained with a learning link for the human

---

## 7. First actions (PO)
1. On branch `chore/m0-setup`, create the M0 files listed in §5, including `docs/tasks/`.
2. Write the task cards for the two parallel M1 tasks (Research Lead: source inventory; GIS Engineer: stack and hosting options with pricing). Do not run them.
3. Commit, print the `git push` and `gh pr create` commands for the human, then stop at CP0.

---

## 8. Execution environment (Copilot agent mode in VS Code; cloud agent unavailable)
- Agents run as **custom agents in VS Code Copilot Chat (agent mode)**, defined in `.github/agents/*.agent.md`. The human picks the agent and the model for each session, following §3.
- **One session = one task = one branch.** At the start, the agent creates or switches to the branch named in its task. At the end, it commits with a conventional message and prints the exact `git push` and `gh pr create` commands for the human to run.
- **Handoffs:** the PO does not start other agents itself. For each task it writes a ready-to-paste task card to `docs/tasks/<id>.md` with: agent, model, branch, inputs, expected outputs and acceptance criteria. The human opens a new chat with that agent and pastes the card. Parallel work = several task cards on separate branches.
- **PR review:** the human starts the `pr-reviewer` agent on the PR branch (or uses Copilot code review on github.com if enabled). The reviewer writes its findings as a PR comment the human can paste, or as a `gh pr review` command.
- **Keeping context small:** every session starts by reading only `AGENT_TEAM_PROMPT.md`, `docs/PROGRESS.md` and its task card. It ends by updating `docs/PROGRESS.md` and `docs/BUDGET.md`. AI credits are taken from the tool's usage view where it shows them (otherwise estimated from tokens and the model's rate, see `docs/BUDGET.md`); tokens are estimates.
- If the cloud agent is enabled later, the same agent files and task cards are used unchanged. Record the switch in `docs/DECISIONS.md`.