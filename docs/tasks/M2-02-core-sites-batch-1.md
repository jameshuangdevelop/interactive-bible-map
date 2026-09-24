# M2-02 — Core sites, batch 1: Jerusalem, Judea and Galilee (20 sites + 2 regions)

| | |
|---|---|
| Agents, in order | `research-lead` → `media-curator` → `fact-checker` (each adds its own commit; ADR-0014) |
| Models | Claude Sonnet 5 → GPT-5 mini → Claude Sonnet 5 (fallbacks as in ADR-0003) |
| Branch | `data/m2-batch-1` |
| Depends on | M2-01 (schema and validator) |
| Parallel with | M2-03 (batch 2) |
| Credit target | ~500 research, ~50 media, ~400 fact-check (session guard: 1,500 each) |

## Goal
Write, illustrate and verify the first 20 of the 40 core MVP sites, plus the two region records they sit in, so that the M3 app has real, cited and verified data to show. Region records support the zoom hierarchy and do not count toward the 40.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §1, §2 and §4
- `docs/PROGRESS.md`
- `schema/README.md`, which holds the data conventions and is the main guide for every phase
- `docs/research/SOURCES.md` and `docs/LICENSES.md`
- This card

## Locations
The ids are proposals; follow the schema's id rules. If a location cannot be sourced to the standard below, stop and report it under "Open questions" in `docs/PROGRESS.md` rather than guess.

| Group | ids | Notes |
|---|---|---|
| Regions (support records, not counted in the 40) | `judea`, `galilee` | `zoomTier: region`; parents of the places below. `samaria` is in batch 2. |
| Jerusalem | `jerusalem`, `temple-mount`, `pool-of-bethesda`, `pool-of-siloam`, `mount-of-olives`, `gethsemane`, `golgotha` | The sub-sites use `parentId: jerusalem` and `zoomTier: site`. For `golgotha`, give every serious candidate site. |
| Judea and the Jordan | `bethlehem`, `bethany`, `jericho`, `emmaus`, `bethany-beyond-the-jordan` | For `emmaus` and `bethany-beyond-the-jordan` (John 1:28), give every serious candidate site. |
| Galilee | `nazareth`, `capernaum`, `bethsaida`, `cana`, `magdala`, `chorazin`, `nain`, `sea-of-galilee` | For `bethsaida` and `cana`, give every serious candidate site. |

## Phase A — Research Lead (commit: `data(locations): add M2 batch 1 drafts`)
- Write `data/locations/<id>.json` for each location with `status: "draft"`.
- **Coordinates:** take them from non-OSM sources (Pleiades, DARE or Wikidata), confirm each against at least 2 sources, and record which source the value came from. Follow the OSM rule in LICENSES.md.
- **Scripture:** include every New Testament mention. OpenBible.info's verse lists are a starting point; cite them and check them. Fill `textWEB` only with the M2-01 script, never by hand.
- **OT connections:** only where a New Testament passage or widely agreed scholarship makes the link. Keep each note neutral and cited.
- **Summary and history:** widely agreed facts only, neutral and cited, written in your own words.
- **Political history:** only first-century changes that affect this place, with years as integers and BC negative.
- **Disputed sites:** list each serious candidate with its support and sources, and do not pick one. Where church tradition and archaeology differ, describe both.
- Run `npm run validate:data` until it passes, and review every warning.

## Phase B — Media Curator (commit: `data(media): add images for M2 batch 1`)
- For each location, write `data/media/<id>.json` with 1–3 Wikimedia Commons images. Read each license on the file's own Commons page, and accept only the licenses LICENSES.md allows. Hotlink every image.
- Captions are neutral and factual. A region may use a public-domain or freely licensed map. If no suitable free image exists for a location, keep its location record and omit only its `data/media/<id>.json`. List every such location in the PR body. The Fact-Checker lists it in the verification report, and the human decides at CP2 whether to accept it or move it to `BACKLOG.md`.
- Optional: labeled AI-reconstruction prompts in `content/image-prompts/<id>.md` for at most 3 Jerusalem sites.
- Run `npm run validate:data` until it passes.

## Phase C — Fact-Checker (commit: `docs(verification): add M2 batch 1 report`)
- Verify every record and every image file, following your agent file. Write `docs/verification/M2-batch-1.md` with a verdict of pass, fail or needs-change for each item, giving the reason and source.
- Set `status: "verified"` only on records that pass. For each needs-change, state exactly what must change; the PO sends it back to the Research Lead or Media Curator, and you re-verify.
- Add any new upstream source to `ATTRIBUTION.md`.

## Acceptance criteria (for the whole branch)
- [ ] All 22 records (20 sites and 2 regions) exist and validate. Each is `verified`, or is listed in the verification report with a reason and has the human's OK to move to `BACKLOG.md`.
- [ ] Every disputed site (`golgotha`, `emmaus`, `bethany-beyond-the-jordan`, `bethsaida`, `cana`) lists every serious candidate, with support and sources, in neutral wording.
- [ ] Every coordinate has at least 2 sources, and none comes from an OSM-derived field.
- [ ] All `textWEB` matches the WEB, as checked by the validator.
- [ ] Every image license is on the accepted list and was confirmed on its Commons file page. Any location without images is listed in the PR body and the verification report.
- [ ] CI passes. Each phase updated its own `docs/PROGRESS.md` row and appended a `docs/BUDGET.md` row.

## Finish
Each agent follows the session protocol in its agent file, but only the Fact-Checker's phase ends the task. PR title: `data: M2 batch 1 — Jerusalem, Judea and Galilee (20 core sites)`.
