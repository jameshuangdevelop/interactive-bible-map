# M4-04 — The modern map and the "Ancient | Modern" toggle

| | |
|---|---|
| Agents, in order | `frontend-engineer` (styles, toggle and tests) → `fact-checker` (the modern style's notices), each adding its own commits |
| Models | GPT-5.3-Codex → Claude Opus 5.5 |
| Branch | `feat/m4-modern-map`, from `feat/m7-phone-basics` (M7-01), since both change the app shell |
| Depends on | M7-01 |
| Parallel with | M4-01, M4-02 and M4-03 (the data lane) |
| Credit target | ~3,000 app, ~800 notices (session guard: 10,000 each; ADR-0025) |

## Goal
Let readers switch between the ancient map and today's map, to see where the places of the Bible are in today's world.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0037 item 4 (what the modern map shows), ADR-0009 (hide disputed borders), ADR-0022, ADR-0024 (smoothness; pins drawn by the map), ADR-0026 (English only)
- `docs/design/VISUAL_SPEC.md` §1, §2 "Modern map", §7, §9, §10 and §11
- `docs/LICENSES.md` → "Basemap (M3-07)", including the ruling on hiding disputed boundaries
- `scripts/build-basemap-styles.mjs` and its tests, and the app's map code (`app/src/features/map/`)
- This card

## Scope
### Frontend Engineer
1. **Modern styles:** extend `scripts/build-basemap-styles.mjs` to build a modern Liberty: today's towns, roads, railways and country borders, labelled in English (`name:en`, falling back to the name in Latin script, never in another script), with every boundary where `disputed=1` hidden, no points of interest, and the same zoom range as the ancient map. Build the VersaTiles fallback the same way. Leave the physical styles as they are.
2. **The toggle:** "Ancient | Modern" as spec §2 "Modern map" describes, at the top right (on phones just below the search box), as a keyboard radio group. The URL keeps the choice (`map=modern`; spec §10).
   - Switching keeps the camera, the selected place and the pins.
   - The pins keep their Bible names on both maps, which is the PO's default until the human decides at MC6 (ADR-0037 item 4). Make the pins' label source one setting, so that modern names (where a record has one) could replace them without reworking the feature.
   - The modern map hides the area labels (empires, provinces and regions).
   - The switch to the fallback after tile errors works on both maps, and the attribution follows the map shown.
3. **Room for M4-05:** the ancient layer and the timeline will appear on the ancient map only. Structure the code so they can plug in, without building them.
4. **Tests:** unit tests for the style changes (no points of interest, the disputed-boundary filter, English-only label expressions), and Playwright checks for the toggle (keyboard, URL, keeping the selected place, hidden area labels, attribution), plus the smoke and accessibility checks on both maps.
5. **Screenshots** of both maps, at the opening view and at Jerusalem, for the PR and the PO's mini checkpoint.

### Fact-Checker
Update the basemap strings in `docs/LICENSES.md` for the modern style: the "modified" notice, the style's license metadata, and the attribution shown on each map. Check them in the built styles and in the app. Commit: `docs(licenses): notices for the modern basemap`.

## Out of scope
The ancient layer and the timeline (M4-05), and any change to the ancient map itself.

## Acceptance criteria
- [ ] The toggle works by mouse, touch and keyboard, the URL keeps the choice, and switching keeps the camera and the selected place.
- [ ] The modern map has English labels only, today's borders with disputed borders hidden, and no points of interest. The pins keep their Bible names (provisional until MC6, through one setting), and the area labels are hidden.
- [ ] The fallback switch still works on both maps.
- [ ] The notices and attribution are right (Fact-Checker).
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web` and `verify:web:playwright` pass.

## Finish
Each agent follows the session protocol in its agent file. PR title: `feat(map): modern map and toggle`.
