# M4-05 — The ancient layer and the timeline in the app

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m4-timeline-ui`, from `feat/m4-modern-map` (M4-04) with M4-01 merged in by the PO |
| Depends on | M4-01 (the format and its test fixture) and M4-04 (the toggle). The real data comes from M4-02 and M4-03; the PO merges each in once it is verified. |
| Parallel with | The end of M4-02 and M4-03 |
| Credit target | ~4,500 (session guard: 10,000; ADR-0025) |

## Goal
Show the ancient world's borders, roads and coastline on the ancient map, with a timeline that snaps to the years they changed.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0037, ADR-0024 (smoothness), ADR-0035 (label priority)
- `docs/design/VISUAL_SPEC.md` §1, §2 "Ancient layer" and "Timeline", §5, §7 and §9 to §11
- `schema/README.md` → "Timeline and ancient layer", the generated files, and M4-01's test fixture
- The app's map and shell code, including M4-04's toggle
- This card

## Scope
1. **Ancient layer,** as spec §2 describes: area fills by kind, borders, area labels (those with a record open it; the others show a tooltip), roads and the ancient coastline. It loads after the map first renders, changes with the stop, and is hidden on the modern map. Area labels rank below the major places (ADR-0035).
2. **Province labels by year:** a province record's label is hidden in the years its area doesn't exist (spec §2). Region labels stay as they are.
3. **Timeline,** as spec §2 describes: the track with one tick per stop, the caption, the "Sources" popover with the summary, passages and sources, the "Earlier" and "Later" buttons, the keyboard slider, the URL (`year`, with BC negative; spec §10), the AD 50 opening stop, and its place on phones while the bottom sheet is open.
4. **Map key,** as spec §2 describes.
5. **States:** if the layer fails to load, the map stays usable and the timeline offers "Try again" (spec §5).
6. **Attribution:** the AWMC credit that M4-03's Fact-Checker sets, on the ancient map only.
7. **Tests:** unit tests for choosing the stop from a year, reading the URL (including BC years), and which labels show in which year; Playwright checks for the timeline by keyboard and pointer, the URL, the map key, and the layer hiding on the modern map; the accessibility check; `npm run bench:map` with the layer on (no main-thread task over 50 ms while dragging and zooming); and changing the stop within the same 50 ms budget.
8. **Real data:** build against the fixture first. Once the PO merges M4-02 and M4-03, check with the real data and fix what it shows, such as long names or crowded stops.

## Out of scope
A place line in the panel that follows the timeline (backlog), the Routes tab (M5), and changes to the data or its format (ask the PO).

## Acceptance criteria
- [ ] Each stop shows its areas, borders and labels, and the roads and coastline show, all as the spec describes.
- [ ] The timeline works by mouse, touch and keyboard, the URL keeps the stop, and the map opens at the stop in force in AD 50.
- [ ] Dragging and zooming stay smooth (ADR-0024), changing the stop stays within 50 ms, and LCP and TBT pass from a desktop (the PO measures them).
- [ ] The map key and the failure state work as the spec describes.
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web` and `verify:web:playwright` pass.

## Finish
Follow the session protocol in your agent file. PR title: `feat(map): ancient layer and timeline`.
