# M5-05 — The Routes tab

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-routes-tab`, stacked on M5-01 (ADR-0039). Before finishing, the PO merges the verified data (M5-02, M5-03) and the lines (M5-04) into it. |
| Depends on | M5-01's format and test data; real data from M5-02, M5-03 and M5-04 to finish |
| Parallel with | M5-02, M5-03 and M5-04 |
| Credit target | ~4,000 (session guard: 10,000; ADR-0025) |

## Goal
Build the Routes tab that VISUAL_SPEC §2 "Routes tab" describes: the five routes, each drawn on the map and listed stage by stage with its passages and sources, on a tab of its own so the main map stays uncluttered (brief §1.6).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0038 (the routes; read it first), ADR-0024 (pins and lines drawn by the map, smoothness), ADR-0036 (what runs locally before a commit)
- `docs/design/VISUAL_SPEC.md` §1 (the tabs' place, desktop and small screens), §2 "Routes tab", "Ancient layer", "Timeline" and "Modern map", §5, §7, §10 and §11
- `schema/README.md` → "Routes (M5)" (M5-01) and the generated Routes files it describes
- The app's map, panel, toggle, timeline and URL code under `app/`, and their tests
- This card

## Scope
1. **Tabs:** "Map | Routes" at the top centre on desktop, and below the search box on small screens, as a tab list. Switching keeps the camera and the map (ancient or modern).
2. **Route panel:** the list of five routes with their years and number of stages, each route's line shown thin and grey on the map, with hover and focus highlighting. Choosing a route fits the map to it and shows the header ("‹ All routes", title, years, "Borders as in AD …"), the note, the stages and the sources, as the spec describes. On small screens the panel is the bottom sheet (M7-01).
3. **Stages:** number, "From → To" with stop links, how it went ("By land", "By sea", "Path not known" with the regions), passages that open their WEB text in place, and "Sources". Stages without a line say why and list the candidate sites (ADR-0038 item 4). Hovering or focusing a stage highlights its line; selecting a line highlights and scrolls to its stage. Jesus' segments are numbered as segments, name the Gospels that tell them, and highlight one at a time (ADR-0038 item 3).
4. **The map:** lines in the accent blue with a white edge, dashed by sea, dotted where the path isn't known, with arrowheads; numbered stops, and small dots for places passed; our other pins hidden; drawn by MapLibre so they move with every drag and zoom (ADR-0024). Selecting a stop opens its place panel with a "‹ Back to" link to the route, or a stop entry's short card.
5. **The map underneath:** the ancient map at the stop in force in the route's first year, without the timeline; the toggle stays, and the lines and stops draw on the modern map too.
6. **Links:** `?tab=routes`, `&route=`, `&stage=`, with `&map=modern` and `&place=` (VISUAL_SPEC §10).
7. **Loading:** the Routes data loads when the tab first opens, with the loading and failure states of the spec; the first load of the app doesn't change.
8. **Accessibility** as the spec describes: the tab list, the ordered stage list as the text version of the lines, line styles named in words, keyboard focus, and 44 × 44 px touch targets. The axe check stays clean.
9. **Tests:** unit tests for the panel and URL state, and Playwright checks for each case on M5-01's test data and then on the real data: a stage by land, by sea with a place passed, "path not known", a stop entry, a disputed stop, a stage without a line, the tabs by keyboard, the links, and the phone layout.

## Out of scope
New data or lines (M5-02 to M5-04), the place panel's content, and changes to the Map tab beyond the tabs themselves.

## Acceptance criteria
- [ ] The tab looks and behaves as VISUAL_SPEC §2 "Routes tab" describes, on desktop and on a phone, with no map key.
- [ ] Every case in item 9 is tested, on the test data and the real data.
- [ ] The links reopen the same view, and the app's first load is unchanged.
- [ ] Dragging and zooming stay smooth (ADR-0024), choosing a route causes no main-thread task over 50 ms (`npm run bench:map`), and LCP and TBT pass from a desktop (the PO measures them).
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web` and `verify:web:playwright` pass.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): the Routes tab`.
