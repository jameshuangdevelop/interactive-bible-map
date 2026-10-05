# M3-19 — Photo credits at the end of the panel, and a pointer over pins

| | |
|---|---|
| Agent(s) | `fact-checker` (licensing ruling) → `frontend-engineer`, each adding its own commit |
| Model | Claude Opus 5.5 for the Fact-Checker; GPT-5.3-Codex for the Frontend Engineer (fallback GPT-5.5) |
| Branch | `feat/m3-credits-and-pointer` |
| Depends on | ADR-0032. The Frontend Engineer starts from a merge of M3-15 and M3-06: this card changes the panel M3-15 rebuilt and the smoke test M3-06 added. |
| Parallel with | M3-14, M3-16 and M3-18 |
| Credit target | ~3,000 AI credits (session guard: 10,000) |

## Goal
The human's feedback at mini checkpoint MC0 (2026-10-05, ADR-0032):
- "Is it possible to cite the photo credit at the end instead? It's a little distracting."
- "Can you change the cursor to something like a pointer when hovered over any site? Currently it's a flat hand and it's not as easy to click especially in crowded places."

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0029 (item 7.6, the label on AI images) and ADR-0032
- `docs/LICENSES.md` ("What the UI must show for share-alike (CC BY-SA) images", and the AI images' credit line) and `ATTRIBUTION.md`
- `docs/design/VISUAL_SPEC.md` §2 (the map's pins and hover), §3 item 1 (images) and §9 (attribution and credits), and `docs/design/wireframes/02-place-panel.svg`
- `app/src/features/place-panel/` and `app/src/features/map/map-view.web.tsx`, with their tests; `scripts/verify-web-export-playwright.mjs` and `scripts/verify-web-smoke-playwright.mjs`
- This card

## Scope
1. **Fact-Checker: where credits may appear.**
   - Rule whether each image's credit may move from under the image to a numbered list at the end of the panel, for every license the images use: CC BY and CC BY-SA 2.0 to 4.0 (with their ports and IGO variants), public domain, and CC0 for our AI images. Quote each legal code's placement wording ("any reasonable manner", "where any other comparable authorship credit appears", and so on).
   - Say what, if anything, must stay next to the image (the "AI-generated reconstruction" label stays on the image, ADR-0029), and how each credit must be tied to its image (for example, numbers that match the gallery's "1 / 6").
   - Update `docs/LICENSES.md` to match. Also fix the known mismatch between the AI images' credit line in `docs/LICENSES.md` and the credit the app shows (visual spec §3): decide which wording is right, and make both agree. If the app must change, say exactly how, for the Frontend Engineer.
   - Commit: `docs(licenses): where photo credits may appear`.
2. **Frontend Engineer: credits and pins.**
   - **Credits:** under the panel's image, keep only the caption. The AI label stays on the image, and the large viewer keeps its credit line. Add a "Photo credits" section at the end of the panel, after Sources: one entry per image, numbered as in the gallery, with the same credit as now (creator, license linked to its legal text, source link, and "Based on" for AI images), plus anything the Fact-Checker's ruling requires. Add a small, quiet link from the image to its credit only if the ruling asks for one.
   - **Pins:** over any clickable pin, cluster, badge or candidate letter, the cursor becomes the pointing hand (CSS `pointer`). Elsewhere the map keeps its own open-hand and dragging cursors.
   - **Easier clicks:** on hover and click, look for features in a small box around the pointer (about 8 px each way), and pick the one nearest the pointer. The tooltip follows the same feature.
   - **Tests:** unit tests where practical. Playwright checks that the credits list has one numbered entry per image, that no credit sits under the panel's image, that the cursor over a pin is `pointer`, and that a click a few pixels off a pin still opens it. Update the M3-06 smoke test and the export check to read credits from the new list.
   - **Docs:** visual spec §2 (hover: the pointer cursor and the hit area), §3 item 1 and §9, and the photo area of wireframe 02.
   - Commit: `feat(panel): photo credits at the end; pointer over pins`.

## Out of scope
Other panel changes, the gallery's design, and larger touch targets for phones (M7).

## Expected outputs
The licensing ruling in `docs/LICENSES.md`; the panel, map and test changes; the updated spec and wireframe.

## Acceptance criteria
- [ ] The Fact-Checker's ruling is in `docs/LICENSES.md`, and the app follows it.
- [ ] No credit line sits under the panel's image. Every image has a numbered entry under "Photo credits", and the large viewer still shows the credit.
- [ ] The cursor is the pointing hand over every clickable map feature, and nowhere else on the map.
- [ ] A click within about 8 px of a pin opens it, and in a crowded area the nearest pin wins.
- [ ] `lint`, `typecheck`, `test:all`, `export:web` and `verify:web:playwright` pass, and so do M3-06's smoke, axe and Lighthouse scripts against a local server.

## Finish
Follow the session protocol in your agent file. PR title: `feat(panel): credits at the end, pointer over pins`.
