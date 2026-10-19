# M5-10 — Borders drawn the way Google Maps draws them

| | |
|---|---|
| Agents | `gis-engineer`, then `fact-checker` |
| Models | GPT-5.3-Codex (fallback GPT-5.5); Fact-Checker: Claude Opus 5.5 |
| Branch | `feat/m5-borders`. It starts from M5-09's planning commit, and the PO rebases it onto M5-09's tip before its PR (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0044 items 7 and 8 |
| Credit target | ~6,000 for the engineer and ~3,000 for the check (session guard: 10,000; ADR-0025) |

## Goal
Draw every modern country border the way Google Maps' default (international) view does: solid, or dashed where disputed, with no masks. Make the ancient layer's borders consistent too: every border from zoom 5, unclear ones dashed, and no hatching (ADR-0044 items 7 and 8).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0044 (read it first), ADR-0009, ADR-0022, ADR-0037 items 3 and 4
- `docs/tasks/M4-04-modern-map.md`, and M4-04's rows in `docs/PROGRESS.md` (why the masks exist)
- `docs/design/VISUAL_SPEC.md` §2 "Modern map" and "Ancient layer"; §8
- `scripts/build-basemap-styles.mjs`, `tests/basemap-styles.test.mjs`, `app/public/styles/**` (including `shared/modern-neutral-boundaries.geojson` and `shared/modern-neutral-boundary-masks.geojson`)
- `scripts/lib/ancient-app-data-builder.mjs` (the borders' `minZoom`), and the ancient layer's layers in `app/src/features/map/map-view.web.tsx`: `ibm-ancient-border-state`, `ibm-ancient-border-disputed`, `ibm-ancient-area-uncertain-fill` and the hatch image. Change only these in that file; M5-09 is changing the rest of it.
- `ATTRIBUTION.md`, `docs/LICENSES.md`, and the app's credits constants, which carry the modern map's notice
- This card

## Scope
1. **Modern, from zoom 5 (OpenMapTiles tiles):**
   - Remove the `within` masks.
   - Draw undisputed country borders solid, and disputed ones dashed.
   - First inspect how the tiles mark each dispute in the map's reach. Look at `disputed`, `claimed_by`, `adm0_l` and `adm0_r` on real features, for example through `querySourceFeatures` in the browser.
   - Write explicit, documented rules for each case, such as the lines between `ISR` and `PSE`, the Golan Heights, Kosovo, Cyprus and Western Sahara. Rules decide the drawing; nothing hides a line.
2. **Modern, below zoom 5 and in the fallback (Natural Earth):**
   - Draw "International boundary (verify)" solid.
   - Draw "Disputed (please verify)", "Indefinite (please verify)", "Indeterminant frontier" and "Line of control (please verify)" dashed. Decide any other class with the Fact-Checker.
   - Use no masks.
   - Regenerate the shared GeoJSON from the pinned Natural Earth URLs and SHA-256 hashes, with a property for the line's style. Delete the masks file if nothing else uses it.
3. **One dashed style** for disputed modern borders and unclear ancient ones: `hsl(248, 1%, 41%)`, the country border's width, `line-dasharray: [4, 2]`. Solid lines keep Liberty's style. The VersaTiles fallback does the same.
4. **The notice:**
   - Replace `modernNoBorderLineStatement` and every copy of it (the styles' metadata, `LICENSE.txt`, `ATTRIBUTION.md`, `docs/LICENSES.md` and the app's credits) with: "Disputed borders are drawn as dashed lines, as Google Maps' default view draws them. A dashed line marks a border that is disputed; it is not a claim about where a border runs or who governs a place."
   - That wording is the PO's; the Fact-Checker may tighten it.
5. **Ancient borders:**
   - Every border between two areas shows from zoom 5.
   - Unclear borders (`borderStyle: "disputed"`) get the dashed style, with the empire edge's colour and width.
   - Remove the hatch layer and its image.
   - Hovering land whose status is unclear must still show "Status unclear in the sources" and its reason. If that hover depended on the hatch layer, keep an invisible fill for it.
6. **Tests:**
   - Replace the mask tests with tests of the style filters: solid lines are undisputed, dashed lines are disputed, and nothing uses `within`.
   - Add a Playwright check on the real tiles. In the Balkans at zoom 6, Kosovo–Albania, Kosovo–North Macedonia, Kosovo–Montenegro, Albania–North Macedonia and Albania–Montenegro render solid, and Kosovo–Serbia renders dashed. In the Levant at zooms 6 to 8, Israel's borders with Egypt, Jordan and Lebanon are solid, and the lines of the West Bank, Gaza and the Golan Heights are dashed.
   - Ancient: every border feature shows from zoom 5 or lower; there's no hatch layer; unclear borders are on the dashed layer.
   - Put before-and-after screenshots in the PR: Balkans and Levant on the modern map; Greece, Anatolia (Syria, Cappadocia and Commagene) and Judea on the ancient map, at zooms 5, 6 and 7.
7. **The Fact-Checker, after the engineer,** writes `docs/verification/M5-borders.md`:
   - for every disputed or contested border in the map's reach (at least ADR-0044 item 7's list and M4-04's), how Google Maps' international view draws it (from Google's own documentation or reliable reports), how the UN's maps draw it, and how our map now draws it;
   - whether the notice is neutral (spec §8) and the licences are right: Natural Earth is public domain, OpenMapTiles' style is CC BY 4.0, and the OpenStreetMap data is ODbL.

## Out of scope
- New ancient lands (M5-11).
- State or province lines on the modern map.
- Any other names or labels.

## Acceptance criteria
- [ ] **Balkans at zoom 6:** every border is drawn; Kosovo–Serbia is dashed and the rest are solid.
- [ ] **Levant at zooms 6 to 8:** Israel's borders with Egypt, Jordan and Lebanon are solid; the lines of the West Bank, Gaza and the Golan Heights are dashed.
- [ ] **Ancient, zooms 5 to 7:** every border between two drawn areas shows in Greece, Anatolia, Syria and Judea; unclear borders are dashed, and nothing is hatched.
- [ ] **The Fact-Checker's table** agrees with the map, and every copy of the notice reads as item 4 says.
- [ ] **Checks:** `npm run lint`, `typecheck`, `test:all`, `build:basemap-styles` (no diff when run again), `build:data`, `export:web`, `verify:web:playwright` and `verify:web:axe` pass.

## Finish
Follow the session protocol in your agent file. PR title: `feat(map): borders drawn the way Google Maps draws them`.
