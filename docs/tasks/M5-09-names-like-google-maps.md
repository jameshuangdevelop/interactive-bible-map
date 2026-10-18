# M5-09 — Names that work like Google Maps'

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-mc12-fixes`, stacked on M5-08 (`feat/m5-names-and-dots`; ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0044 items 1 to 6; M5-08 |
| Credit target | ~8,000 (session guard: 10,000; ADR-0025) |

## Goal
Make our names behave like Google Maps' (ADR-0044 items 1 to 6). That means no grouped names, clicks that keep the reader's zoom, a red pin on the selected place, names that turn blue on hover, and the arrow cursor. Every upright name must respond to hover and clicks on both tabs, all the time. That includes the Routes tab's bug from MC12, where the names of a selected stage's places couldn't be hovered or clicked.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0044 (read it first), ADR-0043, ADR-0042, ADR-0041 item 7, ADR-0035 item 4
- `docs/design/VISUAL_SPEC.md` §2 "Places on the map", "Zoom tiers", "Places with several candidate sites", "Modern map" and "Routes tab"; §7 and §11
- The app's map code (`app/src/features/map/`: `map-view.web.tsx`, `map-render-data.ts`, `major-name-groups.ts`, `selection-focus.ts`, `place-importance.ts` and the rest), `app/src/components/app-shell.web.tsx`, and their tests; `scripts/verify-web-export-playwright.mjs`, `scripts/bench-map.mjs`
- This card

## Scope
1. **No grouped names (item 1).**
   - Remove the major-name groups: the "+N" names, their layers, tooltips, keyboard entries and checks. Each major place becomes a single name.
   - Where names collide, the more important one wins, in ADR-0035's order (`importanceRank`, with the lower value winning). Keep the order of the name layers in `placementPriorityOrder`.
   - Keep any of `major-name-groups.ts` that's still used, and delete the rest.
2. **Clicks keep the zoom (item 2).**
   - A selection made on the map never changes the zoom. That covers a name, a candidate letter, a route's dot, and the keyboard list of visible places.
   - If the place's point would be off the screen or under a panel, the map pans at the reader's zoom; reuse `panSelectionIfOffScreen` and `isPointOffScreen`.
   - Search results and links (in the panels, and the URL when the page opens) keep each tab's current camera behaviour.
   - Pass the selection's origin with the selection; don't guess it from state.
3. **The pin (item 3).**
   - Add a MapLibre symbol layer whose image is added with `map.addImage` at the device's pixel ratio: a teardrop about 24 × 36 px, fill `#EA4335`, outline and centre dot `#B31412`, with its tip on the point (`icon-anchor: "bottom"`).
   - It shows for the selected place when the place is drawn as a single name: not for areas, and not for places with more than one candidate.
   - Set `icon-allow-overlap: true` and `icon-ignore-placement: false`, and place the layer before the other names, so that names avoid it.
   - The selected name sits to the pin's right, clear of its head, and always shows.
   - On the Routes tab, the pin sits over the route's dot, and the selected dot no longer grows or fills.
   - On the modern map, the pin shows without the name.
4. **Hover turns names blue (item 4).**
   - Hovering a name that can be clicked turns it `#1A73E8`; a water name turns `#174EA6`. That covers places, areas, and the ancient layer's labels that link to a record.
   - Use feature state, so nothing is laid out again and nothing flickers.
   - The colour resets when the pointer leaves the name, when a drag starts, and when the source updates. The tooltip stays.
5. **The arrow cursor (item 5).**
   - The map shows `cursor: default` at rest and while dragging, overriding MapLibre's `grab` and `grabbing`. Check its CSS selectors, `.maplibregl-canvas-container.maplibregl-interactive` and its `:active` state, in the version we ship.
   - `pointer` shows only over something that can be clicked: an upright name, a candidate letter, and on the Routes tab a route's dot or line.
6. **Every upright name works everywhere (item 6).**
   - Remove the route's own name layers: `ibm-routes-stop-labels`, `ibm-routes-via-labels` and `ibm-routes-mentioned-labels`, and their selected variants. Also remove the code that hides a route place's own name.
   - While a route is chosen, its places' own names (its stops, the places it passed and the places it names) show from any zoom with the route's priority. For example, add a render-data property used in the name layers' filters and sort keys, or a dedicated layer built from the same features. Either way, the layer must be in `interactiveLayerIds`, so that `toVisibleEntry` resolves it.
   - Only the lines and arrows of stages that aren't hovered or selected grey out. Names and dots keep full opacity.
   - Route dots get the pointer and a tooltip. Clicking a dot keeps today's behaviour: it opens the place and selects its stage. Clicking a name opens the place and leaves the stage as it is. Clicking a line selects its stage.
   - On the Routes tab, the keyboard list of visible places holds the route's stops in stage order, then the map's other visible places (spec §7).
7. **Tests (unit and Playwright),** replacing the group checks:
   - At zooms 3 to 11, no rendered name matches `/\+\d/`. Jerusalem shows at every zoom whenever it's on the screen and nothing is selected. No two names overlap; keep `verifyNoOverlappingNamesAcrossViews` and `verifyNameLayersDisallowOverlap`, updated for the new layers.
   - On the Map tab at zoom 6, clicking a name leaves the zoom unchanged (within 0.01), and leaves the centre unchanged when the place is clear of the panel. Clicking a name that would end up under the panel pans at the same zoom. A search result still moves the map to the place at its zoom.
   - The pin:
     - shows for Tarsus, at its point, with the name to its right;
     - doesn't show for Galatia (an area) or Cana (several candidates);
     - shows without the name on the modern map;
     - on the Routes tab, sits over the dot.
   - Hover: on hovering Tarsus, its name turns `#1A73E8` (read the feature state through the test hook) and the canvas cursor is `pointer`. Moving off restores the colour and sets `default`. During a drag, the computed cursor is neither `grab` nor `grabbing`.
   - The MC12 bug, on the Routes tab: choose Paul's voyage to Rome and select stage 4. Hover a place of stage 4 and a place of another stage: both show the pointer, both turn blue, and clicking each opens its place panel. Repeat with no stage selected. Names' opacity stays 1, while the other stages' lines are dimmed.
   - Tarsus's regression check (zoom 7 and 9), the 44 px touch hit area and axe stay. `bench:map`, with its 10,000 test points, stays under 50 ms per task (spec §11).
8. Remove the dead code: the grouping, the route's name layers, and `isDimmed` on names and dots. Update the unit tests. Don't touch the ancient layer's borders or the basemap styles (M5-10).

## Out of scope
Borders (M5-10 and M5-11), data, and which places are major.

## Acceptance criteria
- [ ] The map matches VISUAL_SPEC §2 on desktop and on a phone, on both maps and both tabs.
- [ ] The MC12 bug is gone. On the Routes tab, whether or not a stage is selected, every upright name of the route's places, in the stage or not, shows the pointer, turns blue on hover, and opens its place when clicked.
- [ ] Clicking a place on the map never changes the zoom. No "+N" names remain.
- [ ] `npm run lint`, `typecheck`, `test:all`, `export:web`, `verify:web:playwright` and `verify:web:axe` pass. The PO measures LCP and TBT, and runs `bench:map` headed.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): names that work like Google Maps'`.
