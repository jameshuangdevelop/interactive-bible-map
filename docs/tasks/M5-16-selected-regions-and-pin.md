# M5-16 — Selected regions and the pin, like Google Maps

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-16-selected-regions`, stacked on M5-15 (#80) (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0044, ADR-0048, ADR-0045 |
| Credit target | ~5,000 (session guard: 7,500; ADR-0025) |

## Goal
The human tested #75 and found two problems (ADR-0048): the pin looks big and bulky, and a clicked region doesn't look selected. This card makes three changes:
- The pin becomes Google Maps' slim red pin.
- Every clickable name turns blue on hover.
- A selected region looks the way it does in Google Maps: a blue name, a thin red dotted line around it, and the rest of the map lightly greyed but still clickable.

## Inputs (read only these)
- `docs/DECISIONS.md` ADR-0044, ADR-0045 and ADR-0048; `docs/TESTING.md`; `docs/VISUAL_SPEC.md` (the sections on names and the pin)
- `app/src/features/map/map-view.web.tsx`:
  - `createSelectedPlacePinImage` (about line 973);
  - the name layers' paint and hover feature state;
  - how a click or hover is resolved to an entry (about lines 3290–3345);
  - the selection effects.
- `app/src/features/map/map-render-data.ts` (area labels)
- `data/locations/*.json`: the `politicalAreaId` field, and the ancient areas source for each timeline stop
- **The reference:** the Google Maps icon in the human's link, https://in.pinterest.com/pin/27162403989999814/

## Scope
1. **The pin.** Redraw `createSelectedPlacePinImage` in Google's proportions:
   - a round head that tapers to a sharp tip along straight or slightly concave sides, never bulging wider than the head;
   - fill `#EA4335`, a 1 px darker outline (`#B31412`), and a dark centre dot (`#B31412`);
   - crisp at device pixel ratios 2 and 3;
   - about 30% smaller than today, roughly 18 × 27 CSS px. Tune it by eye against the reference.

   The tip stays on the place, and the pin's position by the name doesn't change.
2. **Hover is blue for every clickable name:** towns (already), regions and provinces (the area labels), and any other clickable name (water, land features, holder labels). Grey italic names that can't be clicked never turn blue and never show the pointer.
3. **A selected region:**
   1. its name is blue while it's selected, as a selected town's is, and it's always shown;
   2. a thin red dotted line (about 1.5 px, `#EA4335`) runs around the region's land for the timeline's current year, taken from its `politicalAreaId`'s ancient area;
   3. a light grey veil covers everything outside the region, names included: about 15% `#5F6368`, tuned by eye. The region itself stays clear;
   4. everything stays clickable and hoverable under the veil: towns, other regions, routes and candidate sites;
   5. the outline and the veil go away when anything else is selected, inside or outside the region, when the selection is cleared, or when the map switches to Modern. Changing the timeline's year redraws them for that year;
   6. the camera doesn't move (ADR-0044: a click keeps the zoom);
   7. a region with no land that year shows only its blue name. List these regions in the PR. Four regions have no `politicalAreaId` today: Media, Mesopotamia, Phrygia and Pontus.
4. **Phones:** everything works the same on touch. The veil doesn't cover the sheet, and it works with M7-02's sheet positions.
5. **Tests** (ADR-0045: each must fail without the change):
   - **Jest:** the veil's geometry builder (a world ring with the region's holes, MultiPolygons, and missing geometry).
   - **Browser, in CI:**
     - hovering a region's name turns it blue and shows the pointer;
     - selecting a region draws the outline and the veil from that region's shape;
     - with a region selected, clicking a town outside it selects the town and removes the highlight;
     - clicking another region moves the highlight;
     - a town under the veil can be clicked.
   - **The pin:** a pixel test of the pin image, checking its size and that the tip is at the anchor. Not a screenshot diff.
6. **`docs/VISUAL_SPEC.md`:** update the pin and the selected-state rules.

## Out of scope
- Regions on the modern map.
- Outlines on hover; they appear only on select.
- New data.

## Acceptance criteria
- [ ] The PR has desktop and phone screenshots of:
  - the old and new pins side by side, at zoom 6 and zoom 10;
  - a selected region (for example, Galatia in AD 50) with its outline and veil;
  - the hover state.
- [ ] The browser tests above pass in CI, and each one fails without the change. Say how you checked.
- [ ] `npm run lint`, `typecheck`, `test:app` and `npm test` pass, and CI is green.
- [ ] Selecting a region adds no long task. The PO measures this on a real GPU.

## Finish
Follow the session protocol in your agent file. PR title: `feat(map): selected regions and the pin, like Google Maps`.
