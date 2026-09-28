# M3-05 — Search by place name

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-search` |
| Depends on | M3-03 (map and selection) |
| Parallel with | M3-04 (place panel) |
| Credit target | ~600 AI credits (session guard: 1,500) |

## Goal
Let users find any place by name, as `docs/design/VISUAL_SPEC.md` §4 describes. The search covers ancient, modern and alternate names only (brief §1.7).

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §4 and §7, and wireframe 04
- `places.index.json`, the output of the M3-02 data build
- The M3-02 and M3-03 code
- This card

## Scope
1. **What is searched:** each record's ancient, modern and alternate names, **plus its candidates' `label` values**, so that "Imwas" finds Emmaus.
2. **Matching:**
   - Match word starts and prefixes, ignoring case and diacritics (Unicode normalization, then stripping combining marks), so that "alasehir" finds Alaşehir.
   - Allow one typo in names of 5 letters or more.
   - Rank exact matches first, then prefix matches, then typo matches, with ties broken by name. Return up to 8 results.
   - If you use a library, justify it and keep it small; a hand-written matcher is fine at this size (about 60 places).
3. **Results:** each result shows the title name with the match in bold, and a second line with the modern name and type.
   - Disputed places (no modern name, after M3-08) read "Disputed · *n* proposed sites · *type*".
   - Records without a modern name show just the type.
   - A match found through an alternate name or a candidate label adds "also: *name*".
   - Same-named places are listed separately (for example, "Antioch" returns two places).
4. **Accessibility:** follow the ARIA 1.2 combobox pattern. ↓ and ↑ move, Enter opens, and Esc clears. Pressing "/" anywhere focuses the box. The list has accessible names, and the result count is announced.
5. **Behaviour:** opening a result selects the place through M3-03's selection, which zooms the map and updates the URL. The no-results state reads: "No places match '*query*'. Search covers place names only."
6. **Menu:** the ☰ button in the search box opens a drawer with About this map, Sources & credits, Report an issue, and View on GitHub.
   - **Sources & credits** shows the data license, the WEB notice word for word from `docs/LICENSES.md`, and the upstream sources from `ATTRIBUTION.md`.
   - The other entries are short static text or links.
7. **Tests:**
   - "Antioch" returns two places;
   - "alasehir" finds Philadelphia (Alaşehir);
   - "capernam" finds Capernaum;
   - "imwas" finds Emmaus, with the "also:" note;
   - "cor" ranks Corinth before other matches;
   - a verse query gives the no-results state;
   - the combobox works by keyboard.

## Out of scope
Search by verse or by person, which is out of scope for the whole project for now.

## Acceptance criteria
- [ ] Every name in the index can be found, and the tests listed above pass.
- [ ] The combobox passes an automated accessibility check (for example axe) with no serious issues.
- [ ] The Sources & credits drawer shows the WEB notice exactly as written in `docs/LICENSES.md`.
- [ ] CI passes. Committed as `feat(search): add place-name search and menu`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(search): place-name search and menu`.
