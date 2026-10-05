# M3-21 — Collapsible panel sections

| | |
|---|---|
| Agent(s) | `fact-checker` (licensing ruling) → `frontend-engineer`, each adding its own commit |
| Model | Claude Opus 5.5 for the Fact-Checker; GPT-5.3-Codex for the Frontend Engineer (fallback GPT-5.5) |
| Branch | `feat/m3-collapsible-sections`. The Frontend Engineer starts from a merge of M3-20, which changes the same panel. |
| Depends on | ADR-0033 item 3; M3-20 for the Frontend Engineer |
| Parallel with | M3-16's second half and M3-22 |
| Credit target | ~3,000 AI credits (session guard: 10,000) |

## Goal
The human, at mini checkpoint MC2 (2026-10-05): "sections should be collapsable as well. Perhaps we can have 'Sources' and 'Photo credits' collapsed by default? The Bible section's 'Show all ... passages' should also allow for collapsing that back to previews."

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0032 and ADR-0033
- `docs/LICENSES.md` ("Image credits", M3-19's ruling)
- `docs/design/VISUAL_SPEC.md` §3, §7 and §9, and `docs/design/wireframes/02-place-panel.svg`
- `app/src/features/place-panel/`, with its tests, `scripts/verify-web-export-playwright.mjs` and `scripts/verify-web-smoke-playwright.mjs`
- This card

## Scope
1. **Fact-Checker: may the credits start collapsed?**
   - M3-19's ruling says "Photo credits" must never be collapsed, because the CC 2.0–3.0 licenses ask for credit "at least as prominent" as comparable authorship credits.
   - Rule whether Photo credits may start collapsed when Sources, the comparable credit, starts collapsed in exactly the same way, for each license band in use. Say what the collapsed heading must show, and what the "Credit" link under each image must do.
   - If they may not start collapsed, say what the nearest allowed design is.
   - Update `docs/LICENSES.md`. Commit: `docs(licenses): collapsed credits`.
2. **Frontend Engineer: collapsible sections.**
   - Each section below the panel's header (About, Places in *name*, In the Bible, Old Testament connections, Sources, Photo credits) can collapse. Its heading has a button with `aria-expanded`, and the heading stays a heading.
   - Collapsed headings show their count where they have one ("Sources · 13").
   - Sources and Photo credits start collapsed, as far as the ruling allows; the others start open.
   - A section the reader opens or closes stays that way for the next place in the same visit.
   - "Show all *n* passages" becomes a toggle: "Show fewer" goes back to the preview and keeps the reader's place on the page.
   - The "Credit" link under an image opens Photo credits and moves focus to its entry.
   - **Tests:** Playwright checks that Sources and Photo credits start collapsed, the toggles work with the keyboard, the "Credit" link opens the list at the right entry, and "Show fewer" works. Update the M3-06 smoke test and the export check, which read the credits list.
   - **Docs:** visual spec §3 and §9, and wireframe 02.
   - Commit: `feat(panel): collapsible sections`.

## Out of scope
Other panel changes, and the order of the sections (M3-20).

## Acceptance criteria
- [ ] The ruling is in `docs/LICENSES.md`, and the app follows it.
- [ ] Every section below the header collapses and expands, by mouse and by keyboard.
- [ ] Sources and Photo credits start as the ruling allows; "Show fewer" returns to the preview.
- [ ] `lint`, `typecheck`, `test:all`, `export:web` and `verify:web:playwright` pass, and so do M3-06's smoke, axe and Lighthouse scripts against a local server.

## Finish
Follow the session protocol in your agent file. PR title: `feat(panel): collapsible sections`.
