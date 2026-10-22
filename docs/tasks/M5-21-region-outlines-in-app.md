# M5-21 — Selected regions show their own outline

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | Copilot cloud agent (the PO wrote and ran this card in one session) |
| Branch | `copilot/update-user-profile-page` (named by the cloud agent) |
| PR target | `main` (ADR-0051) |
| Depends on | ADR-0050 item 5 and its 2026-10-20 update; ADR-0048 and its update; M5-19 (#86, merged) |
| Parallel with | M5-20 (data only). No other map-code PR (ADR-0051 item 4) |
| Credit target | ~3,000 AI credits (session guard: 7,500; ADR-0025) |

## Goal
M5-19 (#86) drew sourced outlines for 11 clickable regions and builds them into `ancient.region-outlines.json`. The app never loads that file, so selecting Samaria still shows its name alone. This card makes the app use the outlines (ADR-0050 item 5). On the ancient map, a selected region shows the first of these that exists:
1. the land it holds that year (ADR-0048's update);
2. its own outline, from the outlines file;
3. its name alone.

An outline looks like any selected region (ADR-0048): a blue name, a thin red dotted outline, and a grey veil outside it. Everything stays clickable.

What changes for the reader:
- **Galilee, Samaria, Judea (the region), Crete and Libya:** their outline, every year.
- **Pontus:** the Kingdom of Pontus's land until AD 64, as now, then its outline once it holds no area.
- **Chios, Cos, Malta, Rhodes and Samos (islands shown as region names):** their outline. Malta's outline is the island of Malta, the high-confidence candidate; Mljet keeps its candidate dot.
- **Pisidia, Lycaonia, Mysia, Phrygia, Media, Mesopotamia and the Parthian Empire:** their name alone, until M5-20.
- **Syrtis:** its name alone. It is a sea, so ADR-0048 item 5 applies (M5-19's verification, item e).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0050 with its update, and ADR-0048 with its update
- `docs/TESTING.md`
- `docs/design/VISUAL_SPEC.md` §2, "Selected region or province"
- `app/src/features/map/`:
  - `selected-region-highlight.ts`
  - `map-view.web.tsx` (the selected-region memo and the ancient loaders)
  - `ancient-layer.types.ts`
  - `map-render-data.ts` (`isAreaLabelPlace`)
- `data/geo/region-outlines.geojson`, and `scripts/lib/ancient-app-data-builder.mjs` for the generated file's shape
- `app/__tests__/selected-region-highlight-test.ts`, and the selected-region tests in `tests/browser/browser-checks.spec.mjs`
- This card

## Scope
1. **Order of steps.** In `findSelectedRegionGeometry`, the outline is the last step before the name alone. It comes after the holder union, the held areas and the own-land fallback. While the year's stop is still loading, nothing is drawn, as now, so an outline never flashes before the land a region holds.
2. **Loading on first use (ADR-0050's update).**
   - The app fetches `/generated/ancient.region-outlines.json` the first time a selected area name holds no land on the ancient map, then keeps it for the session.
   - The file isn't part of the startup load, and its 25,000 B gzip cap stays separate from the ancient layer's 330,000 B.
   - If the fetch fails, the region shows its name alone and the console logs the error. The ancient layer doesn't go into its error state, and the next region selected tries again.
3. **Islands.** Chios, Cos, Malta, Rhodes and Samos are natural features drawn as region names (`zoomTier: "region"`). The highlight follows the same rule as the names: a place drawn as an area name can be highlighted.
4. **Tests.**
   - **Jest:**
     - the order of the steps;
     - an outline never replaces held land;
     - the parser for the outlines file.
   - **Browser (`@names`):**
     - Samaria, picked from search, and Judea (the region) at AD 30 are outlined;
     - the outlines file isn't requested until such a region is selected;
     - Pontus at AD 70 and Chios are outlined along their outlines in the file;
     - Pisidia still shows its name alone.
5. **VISUAL_SPEC.** The "Selected region or province" line covers the outline step.

## Out of scope
- The seven deferred regions (M5-20).
- The red pin on a selected island. Chios, Cos, Rhodes and Samos keep it, as now; whether an outlined island should drop it, as Crete does, is for the human's play-test.
- `docs/BUDGET.md` and `docs/PROGRESS.md`, which change only in the PO's ledger PR (ADR-0051).
- Any change to the outlines, the areas or the generated files.
- Outlines whose extent changes by year, through the optional `years` property. No outline uses it yet (ADR-0050 item 4), so the app ignores it.

## Expected outputs
- Changes to the code, tests and spec named above. No new dependency.

## Acceptance criteria
- [ ] On the ancient map, selecting any of these draws its outline, its veil and its blue name:
  - Samaria, Galilee, Judea (the region), Crete or Libya;
  - Pontus, from AD 64;
  - one of the five islands.
- [ ] Regions that hold land still show that land, and the seven deferred regions show their name alone.
- [ ] The outlines file loads only after such a selection, never at startup.
- [ ] Switching to Modern clears the highlight, as before.
- [ ] These pass, and CI is green:
  - `npm run lint`, `typecheck`, `test:app`, `npm test`, `build:data` and `export:web`;
  - the `@names` browser tests.

## Finish
PR title: `feat(map): selected regions show their own outline`. The PR description carries the budget row and the status (ADR-0051).
