# M3-03 — Map view

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-map` |
| Depends on | M3-02 (scaffold). It uses the attribution text from M3-07 if that has merged; otherwise it uses a placeholder, marked `TODO(M3-07)`. |
| Parallel with | none |
| Credit target | ~900 AI credits (session guard: 1,500) |

## Goal
Show every place on an interactive map, the way `docs/design/VISUAL_SPEC.md` §2 describes: the basemap, pins, region labels, zoom tiers, clustering, disputed candidates and the map controls.

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §2, §5, §7, §9, §10 and §11, and wireframes 01–03 in `docs/design/wireframes/`
- `docs/DECISIONS.md`: ADR-0008 (MapLibre) and ADR-0009 (the basemap, disputed borders and the fallback)
- `app/README.md` and the M3-02 code
- This card

## Scope
1. **MapLibre on the web** through `react-map-gl/maplibre`, with a `.native.tsx` stub, so a native build is not blocked later.
2. **Basemap style:**
   - Host a style file in the app, derived from OpenFreeMap **Positron**, that uses English labels where available, removes points of interest, and **hides boundary features with `disputed = 1`** (the OpenMapTiles `boundary` layer).
   - Keep glyph, sprite and tile URLs pointing at OpenFreeMap.
   - Record the source style's license and where it came from in the PR.
3. **Fallback:** a second style (OpenFreeMap Bright), set by configuration. After repeated tile errors, switch to it automatically and show the message from spec §5.
4. **Places:**
   - Pins are coloured by type (spec §2) and are **keyboard-focusable buttons** named like "Capernaum, city".
   - Region and island records appear as clickable labels.
   - Visibility follows the `zoomTier` rules, and nearby pins cluster below zoom 7.
   - Disputed places show a "?" pin below zoom 8, and lettered, dashed-outline candidate pins from zoom 8 or when selected.
   - The selected place gets a larger pin.
5. **Selection:** clicking a pin, label or candidate selects it and zooms as spec §2 describes, jumping instead of flying when reduced motion is preferred. It updates `?place=` and `&candidate=` in the URL, and opening such a URL restores the selection. The panel content can remain a stub, since M3-04 builds it.
6. **Controls:** zoom in and out, reset view (the Mediterranean overview), compact attribution, and a metric scale bar.
7. **Tests:**
   - unit tests for the zoom-tier visibility rules, the "?" and lettered-candidate logic, and parsing and writing the URL;
   - a test that the hosted style hides disputed boundaries;
   - a component test that pins are reachable by keyboard.

## Out of scope
The place panel content (M3-04), search (M3-05), the Ancient layer and timeline (M4), and routes (M5).

## Acceptance criteria
- [ ] Every record in `places.index.json` appears at the right zoom, with the colour and label spec §2 gives.
- [ ] Disputed boundaries are hidden, which the tests confirm.
- [ ] The fallback works: a test shows that simulated tile errors switch the style and show the message.
- [ ] Pins, labels and controls can be reached and operated by keyboard, and have accessible names.
- [ ] The attribution is visible, and uses M3-07's exact text if it has merged, or a marked placeholder if not.
- [ ] CI passes. Committed as `feat(map): add map view with places, tiers and clustering`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(map): map view with places, zoom tiers and clustering`.
