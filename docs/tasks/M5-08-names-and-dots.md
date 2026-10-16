# M5-08 — Names instead of pins

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-names-and-dots`, stacked on M5-07 (`data/m5-route-places`; ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0043, the human's answers to ADR-0042 item 6; M5-05; M5-07's places |
| Credit target | ~8,000 (session guard: 10,000; ADR-0025) |

## Goal
Draw our places as their names instead of pins, styled by whether they can be clicked, and keep the modern map free of ancient places (ADR-0043).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0043 (read it first), ADR-0042, ADR-0035, ADR-0029 item 2 (the 31 major places), ADR-0024
- `docs/design/VISUAL_SPEC.md` §2 "Places on the map", "Zoom tiers", "Places with several candidate sites", "Ancient layer" (the area names), "Modern map" and "Routes tab"; §7 and §11
- The app's map code (`app/src/features/map/`: `map-view.web.tsx`, `map-render-data.ts` and the rest), `app/src/components/app-shell.web.tsx`, and their tests; `scripts/verify-web-export-playwright.mjs`, `scripts/bench-map.mjs`
- For the new field: `schema/location.schema.json`, `schema/README.md`, `scripts/lib/validator.mjs`, `scripts/lib/app-data-builder.mjs`
- This card

## Scope
1. **Data:** add `naturalFeatureKind` ("water" or "land", optional, only on `natural-feature` records, absent meaning land) to the schema, the validator and the places index the app reads. Set "water" on the Sea of Galilee, the Syrtis and Fair Havens, and on any other water feature you find; list them in the PR.
2. **No pins:** replace the place pin layers with name layers centred on each place's point, styled as the spec's table says. That covers major, other and site pins, pin shadows, the muted dots and count bubbles, the "?" badges, and the pin collision masks and images. Major places show at every zoom, grouped below zoom 7 as names such as "Jerusalem +4". Other places appear from zoom 6, and sites from 12. Names hide by priority when they collide.
3. **Clickability:** every name that opens something is upright and shows the pointer cursor. Names that don't, the ancient layer's names without a record and the "Roman shore" labels, are grey in Noto Sans Italic. Area names with a record are upright. Water is blue and land natural features green, both in Noto Sans Regular; towns and sites are dark Noto Sans Bold.
4. **The selected place:** its name in bold accent blue, 2 px larger, always shown.
5. **Candidate sites:** one name at the first-listed candidate, with no "?". Selecting the place shows today's lettered red candidate dots. Selecting another place or closing the panel hides them; dragging and zooming don't. Clicking a candidate opens the place with that candidate highlighted.
6. **The modern map:** no ancient places (no names, no dots, no candidates). Routes keep their lines and dots without names. The selected place has no marker; the camera centres on it.
7. **The Routes tab:** our places show as names under the route; places the route draws stay left out of the base data (M5-05). The route's dots and names don't change.
8. **Hover, keyboard and touch:** the tooltip and the keyboard list of visible places work as before. Clicks check the name's box plus about 8 px; on touch screens the hit area is at least 44 px tall.
9. **Tests (unit and Playwright):**
   - every place is drawn and can be clicked at every zoom its tier shows it, with Tarsus at zoom 7 and 9 as the old bug's regression check;
   - each kind's font, colour and slant;
   - clickable versus not: the cursor, and whether a click opens something;
   - candidates show on selection, hide on another selection or on closing, and stay on a drag;
   - the major places, grouped, show at zooms 3 to 6;
   - no place names on the modern map, and routes there without names;
   - axe stays clean;
   - `bench:map` with its 10,000 test points stays under 50 ms per task (spec §11).
10. Remove the dead code, and document the field in `schema/README.md`. The spec is already updated by the PO.

## Out of scope
Which places are major, the modern map's own labels, and images.

## Acceptance criteria
- [ ] The map matches VISUAL_SPEC §2 on desktop and on a phone, on both maps and both tabs.
- [ ] No place vanishes or stops being clickable at a zoom where its tier shows it; Tarsus shows and can be clicked at zoom 7 and 9.
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web`, `verify:web:playwright` and `verify:web:axe` pass; the PO measures LCP and TBT, and runs `bench:map` headed.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): names instead of pins`.
