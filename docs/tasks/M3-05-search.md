# M3-05 — Search by place name

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-search` |
| Depends on | M3-03, M3-10 and M3-12, all merged |
| Parallel with | M3-04 (place panel) and M3-13 (data). M3-04 also edits the app shell; keep your changes to the shell small and well separated. |
| Credit target | ~1,500 AI credits (session guard: 10,000) |

## Goal
Let users find any place by the English name their Bible uses, as `docs/design/VISUAL_SPEC.md` §4 describes. The search covers English place names only (brief §1.7; ADR-0026).

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §4 and §7, and wireframe 04
- `places.index.json`, the output of the M3-02 data build
- The M3-02 and M3-03 code
- This card

## Scope
1. **What is searched:** each record's `names.ancient` and `names.alternate`, which hold the English spellings of the NIV, ESV, NLT, KJV, NKJV, CSB and WEB (M3-10). Not modern names, candidate labels or `names.otherLanguages` (which isn't in the index).
2. **Matching:**
   - Match word starts and prefixes, ignoring case and diacritics (Unicode normalization, then stripping combining marks).
   - Allow one typo in names of 5 letters or more.
   - Rank exact matches first, then prefix matches, then typo matches, with ties broken by name. Return up to 8 results.
   - If you use a library, justify it and keep it small; a hand-written matcher is fine at this size (about 60 places).
3. **Results:** each result shows the title name with the match in bold, and a second line with the modern name and type.
   - Disputed places (no modern name, after M3-08) read "Disputed · *n* proposed sites · *type*".
   - Records without a modern name show just the type.
   - A match found through a name other than the title adds "also: *name*", for example "Malta — also: Melita".
   - Same-named places are listed separately (for example, "Antioch" returns two places).
4. **Accessibility:** follow the ARIA 1.2 combobox pattern. ↓ and ↑ move, Enter opens, and Esc clears. When results are open, Esc closes them first; only the next Esc closes the panel (spec §7; the panel's Esc already exists from M3-03). Pressing "/" anywhere focuses the box. The list has accessible names, and the result count is announced. Typing must not re-render the map.
5. **Behaviour:** opening a result selects the place through M3-03's selection, which zooms the map and updates the URL. The no-results state reads: "No places match '*query*'. Search covers place names only."
6. **Menu:** the ☰ button in the search box opens a drawer with About this map, Sources & credits, Report an issue, and View on GitHub.
   - **Sources & credits** shows the data license, the WEB notice word for word from `docs/LICENSES.md`, the upstream sources from `ATTRIBUTION.md`, and the basemap credits: the "Sources & credits" text for the main basemap and the backup (VersaTiles), exactly as `docs/LICENSES.md` → "Basemap attribution strings" gives them (obligation L5). The six Bible versions used only for spellings are listed as cite-only.
   - The other entries are short static text or links.
7. **Tests:**
   - "Antioch" returns two places;
   - "melita" finds Malta, with the "also: Melita" note, and "beroea" finds Berea;
   - "capernam" finds Capernaum;
   - "al-quds", "imwas" and "alasehir" find nothing, since only English Bible names are searched;
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
