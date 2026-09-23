# M1-03 — License verification and content-license decisions

| | |
|---|---|
| Agent | `fact-checker` |
| Model | Claude Sonnet 5 (fallback Claude Sonnet 4.6) |
| Branch | `docs/m1-license-review` |
| Depends on | M1-01 (`docs/research/SOURCES.md`); this branch is stacked on `docs/m1-stack-options` (ADR-0007) |
| Parallel with | none (M1-02 is independent) |
| Credit target | ~350 AI credits (session guard: 1,500) |

## Goal
Independently verify the licenses recorded in the M1-01 source inventory, and decide the project's content licenses, so that M2 can start writing data.

## Inputs (read only these)
- `AGENT_TEAM_PROMPT.md` §2 (rules 1–6)
- `docs/PROGRESS.md`
- `docs/research/SOURCES.md` (the whole file; its "Open questions for the Fact-Checker" section is your main brief)
- `docs/LICENSES.md` and `ATTRIBUTION.md`
- This card

## Scope
1. **Verify every license** in the SOURCES.md overview table on the source's own site, independently of M1-01. For each: pass, fail or needs-change, with the page URL and the date read.
2. **Answer the 5 open questions** in SOURCES.md, with reasons and sources.
3. **Decide the content licenses** and record them in `docs/LICENSES.md`:
   - The license for `data/` and `content/`, given the mix of CC0 (Wikidata), CC BY (OpenBible.info, Pleiades, ORBIS dataset) and share-alike (DARE CC BY-SA 3.0, AWMC and OSM ODbL). Say whether share-alike data must be kept in separate files or layers (for example ODbL-derived geometry in `data/geo/`) and under which license each part is released. Check version compatibility on the license texts themselves (for example whether CC BY-SA 3.0 material may be released under 4.0).
   - The **accepted image licenses** for the Media Curator, and what the UI must show for share-alike images.
   - The **WEB attribution wording** that respects the "World English Bible" trademark. Also record the license status of each WEB edition on eBible.org (for example Classic with "Yahweh" vs editions with "LORD"). The choice of edition is the human's decision at CP1; only document the licensing.
   - **Do-not-use or not-yet list**: sources or uses that are incompatible or unverified (for example ORBIS web-app figures, and Perseus texts until verified).
4. **Update `ATTRIBUTION.md`** with one row per source we plan to use: what it is used for, its license, and the exact attribution text the app will show. Map-tile attribution waits for the CP1 stack choice; add a placeholder row for it.
5. **Write `docs/verification/M1.md`**: per-source results, the answers to the open questions, and any blockers for M2.

## Out of scope
Data records, the map, tile and hosting choice (M1-02), image search, and editing `docs/research/SOURCES.md`. If SOURCES.md is wrong, report it in `docs/verification/M1.md` and do not fix it yourself.

## Expected outputs
- `docs/verification/M1.md` (new), `docs/LICENSES.md` and `ATTRIBUTION.md` (updated)
- Your row in `docs/PROGRESS.md` updated, and a row appended to `docs/BUDGET.md`

## Acceptance criteria
- [ ] Every overview-table license is re-verified from its own page, with the URL and date read.
- [ ] All 5 open questions are answered, with reasons.
- [ ] `docs/LICENSES.md` states the data/content license, the accepted image licenses and the compatibility of each source, with no "Open" rows left except map tiles (which wait for CP1).
- [ ] `ATTRIBUTION.md` has ready-to-display attribution text for every source we plan to use.
- [ ] Blockers for M2 are listed, or "none" is stated.
- [ ] Committed as `docs(licensing): add M1 license review`, with the push and PR commands printed but not run.

## Finish
Follow the session protocol in `.github/agents/fact-checker.agent.md`. PR title: `docs(licensing): M1 license review`.
