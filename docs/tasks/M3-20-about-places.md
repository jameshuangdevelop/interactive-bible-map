# M3-20 — Places in the About

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-about-places`, started from M3-19's branch |
| Depends on | ADR-0033 item 2, and M3-19 (it changes the same panel) |
| Parallel with | M3-16's second half, M3-21's licensing ruling and M3-22 |
| Credit target | ~2,500 AI credits (session guard: 10,000) |

## Goal
The human, at mini checkpoints MC1 and MC2 (2026-10-05): "if there're places in a city, lift them all the way up right below the 'About'. That way as people read through the About, they can reference the places in it. Also, if there're places in the About, it might be good to have a link such that people can more directly see where they are."

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0033
- `docs/design/VISUAL_SPEC.md` §3 (the panel's sections) and §7 (accessibility), and `docs/design/wireframes/02-place-panel.svg`
- `app/src/features/place-panel/` and `app/src/features/map/`, with their tests, and `scripts/verify-web-export-playwright.mjs`
- This card

## Scope
1. **Order:** "Places in *name*" comes directly below About, before "In the Bible".
2. **Links in the About text** (the summary and the history paragraphs):
   - Link the first mention of each other place on the map, matched on its English names (its display name, `names.ancient` and `names.alternate`) as whole words.
   - Try longer names first, so "Bethany beyond the Jordan" wins over "Bethany" and "Sea of Galilee" over "Galilee".
   - Skip the place itself, and skip a name that belongs to more than one place (such as "Antioch" or "Caesarea"), unless a longer, unique name matches.
   - Link only the first mention in the whole About, so the text doesn't fill with links.
3. **What a link does:**
   - Pointing at it, or focusing it with the keyboard, highlights that place's pin on the map, as pointing at an entry in "Places in *name*" does (add that highlight to the list too if it doesn't exist).
   - Selecting it opens that place, as selecting its pin does, and adds a browser history entry, so Back returns to the place the reader came from.
   - Links look like the panel's other text links, keep a visible focus ring, and need no extra label.
4. **Tests:**
   - Unit tests for the matcher: longer names first, whole words only, shared names skipped, the place itself skipped, first mention only.
   - Playwright checks:
     - Jerusalem's "Places in Jerusalem" follows About.
     - A place named in Jerusalem's About (such as the Temple Mount) is a link that opens it.
     - Back returns to Jerusalem.
5. **Docs:** visual spec §3 (the section order and the links), and wireframe 02 if it shows the order.

## Out of scope
Adding places to the map (the Kidron Valley isn't one yet; see `BACKLOG.md`), collapsing sections (M3-21), and data changes.

## Acceptance criteria
- [ ] "Places in *name*" sits directly below About.
- [ ] Each other place named in an About is linked once, with no false or ambiguous matches in the 31 major places' text, which the engineer lists in the PR body.
- [ ] Pointing at a link highlights its pin, selecting it opens the place, and Back returns.
- [ ] `lint`, `typecheck`, `test:all`, `export:web` and `verify:web:playwright` pass, and so do M3-06's smoke, axe and Lighthouse scripts against a local server.

## Finish
Follow the session protocol in your agent file. PR title: `feat(panel): places in the About`.
