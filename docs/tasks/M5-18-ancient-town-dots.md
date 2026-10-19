# M5-18 — Towns on the ancient map get a dot

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-18-ancient-town-dots`, stacked on M5-16 (#81, `79564c6`) (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0049 (this card's decision), ADR-0043, ADR-0044, ADR-0048 (the pin), M5-16 |
| Credit target | ~2,000 (session guard: 3,000; ADR-0025) |

## Goal
The human, on 2026-10-19: "also I think the one solid black dot underneath the city names actually help a lot (like in the modern map). Let's do that for the ancient map as well".

On the modern map, the basemap draws a town as a small solid black dot with its name just above it. On the ancient map, since ADR-0043, a town is only its name, centred on its point. ADR-0049 gives the ancient map's towns the same dot. Read ADR-0049 first; it's the spec.

How the modern map does it, in `app/public/styles/liberty-modern/style.json`:
- `label_town` and `label_village`: `icon-image` `circle_11_black` at `icon-size` 0.2, `text-anchor: bottom`.
- `label_city`: the same icon at 0.4, `text-offset` [0, -0.1]. `label_city_capital`: 0.5, `text-offset` [0, -0.2], Noto Sans Bold.
- The basemap hides its dots from zoom 9 or 10. ADR-0049 item 7 keeps ours at every zoom.

## Inputs (read only these)
- ADR-0049, ADR-0043, ADR-0044 and ADR-0048 in `docs/DECISIONS.md`; `docs/TESTING.md`; VISUAL_SPEC §2
- `app/src/features/map/map-view.web.tsx`: the town name layers (`ibm-city-pin`, `ibm-major-pin` and the route-priority copies), the selected-place pin (`ensureSelectedPlacePinImage` and its layer), the candidate dots, `placementPriorityOrder`, hover and click
- `app/src/features/map/map-render-data.ts` and `app/src/features/map/major-name-groups.ts`, if a name's anchor feeds any placement maths
- `scripts/verify-web-export-playwright.mjs`: `verifyNameLayersDisallowOverlap`
- `tests/browser/browser-checks.spec.mjs`: the `@names` tests
- This card

## Scope
1. **The dot.** Each ancient-map town (the major places, cities, towns and villages: ADR-0049 item 1) draws a solid black dot at its point, with its name just above it.
   - About 6 px across for the major places and 4 px for the others (item 2). Use the basemap's `circle_11_black` sprite if the ancient map's style has it; otherwise draw the dot at runtime with `map.addImage`, as the pin is drawn.
   - Draw the dot and its name as one symbol (`icon-image` plus `text-field` in the same layer), with `text-optional` and `icon-optional` false, so they show and hide together (item 3). Name layers keep `text-allow-overlap` and `text-ignore-placement` false (the repository rule; `verifyNameLayersDisallowOverlap` enforces it), and no dot may draw over another name.
   - The dot is part of the name's click and hover target. Hover turns the name blue, and the dot stays black.
   - Sites, regions, provinces, water and natural features don't change.
2. **The selected town** shows its pin instead of its dot, and its blue name doesn't overlap the pin (item 4).
3. **Disputed places:** the dot sits at the first-listed candidate. While the place is selected, the lettered candidate dots replace it (item 5).
4. **Routes mode:** where a route draws its own dot for a place (stop, place passed, place named), don't also draw the black dot (item 6).
5. **The modern map** doesn't change (item 8). Its existing tests must still pass.
6. **Tests** (`docs/TESTING.md`: assert what renders):
   - At `?year=50`, desktop, centred on Asia Minor at zoom 6.2: for three rendered towns, one of them a major place, a small clip just below each name contains a dark dot. Count near-black pixels; the before count is about 0. Show that the test fails on M5-16's head.
   - Selecting a town shows the pin and no dot at its point.
   - The existing `@names` collision tests pass unchanged.
7. **Docs.** VISUAL_SPEC §2 describes the dot.
8. **Screenshots**, headed, in `/tmp/m5-18-shots/`: Asia Minor at zoom 5, 6.2 and 8; Judea at zoom 8; a selected town; Routes mode on Paul's second journey; and a phone view.

## Out of scope
- Dots on the modern map, or any change to the basemap styles.
- New icons for sites, mountains or water.
- Changing which names show at which zoom, beyond what the dot's space forces.

## Acceptance criteria
- [ ] Every rendered ancient-map town has its dot, and no dot draws without its name.
- [ ] No name overlaps another name or a dot; `verifyNameLayersDisallowOverlap` passes with no new exemption.
- [ ] Hover still turns the name blue, and a click on the dot selects the town.
- [ ] The selected town shows its pin, not its dot.
- [ ] The new test fails on M5-16's head and passes here. `npm run lint`, `npm run typecheck`, `npm run test:app` and `npm test` pass, and CI is green with 0 flaky.

## Notes
- Run only targeted tests locally, under the heavy lock (`lockf -k -t 7200 /tmp/ibm-heavy.lock …`). The full browser suite is CI's job.
- Headless Playwright renders WebGL with SwiftShader; take the screenshots and judge the look headed.
- CI runs on the draft PR that the PO opens (ADR-0046).

## Finish
Follow the session protocol in your agent file. PR title: `feat(map): towns on the ancient map get a dot, as on the modern map`.
