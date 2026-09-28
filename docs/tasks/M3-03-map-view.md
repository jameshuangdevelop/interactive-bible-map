# M3-03 — Map view

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-map` |
| Depends on | M3-02 (scaffold) and M3-07 (attribution), both merged. Use M3-07's exact strings and obligations in `docs/LICENSES.md` → "Basemap (M3-07)". |
| Parallel with | none |
| Credit target | ~900 AI credits for the first build; ~2,500 for the rework below (session guard: 10,000; ADR-0025) |

## Goal
Show every place on an interactive map, the way `docs/design/VISUAL_SPEC.md` §2 describes: the basemap, pins, region labels, zoom tiers, clustering, disputed candidates and the map controls.

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §2, §5, §7, §9, §10 and §11, and wireframes 01–03 in `docs/design/wireframes/`
- `docs/DECISIONS.md`: ADR-0008 (MapLibre) and ADR-0009 (the basemap, disputed borders and the fallback)
- `app/README.md` and the M3-02 code
- This card

## Scope
1. **MapLibre on the web** through `react-map-gl/maplibre`, with a `.native.tsx` stub, so a native build is not blocked later.
   - Use **MapLibre GL JS 6.9 or later**, so that Hebrew and Arabic labels render correctly without the right-to-left plugin ([v6.9.0 release notes](https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.9.0)). In the PO's previews, version 5 without the plugin drew Hebrew labels backwards.
   - MapLibre 6 ships **only as an ES module** (`dist/maplibre-gl.mjs`) and runs its tile work in a **web worker** (`dist/maplibre-gl-worker.mjs`). Browsers only load a worker from the page's own origin, so serve the worker file with the app's build and point MapLibre at it with `setWorkerUrl()`. Test that the map loads in the built web export, not only in development.
2. **Basemap style:**
   - Host a style file in the app, derived from OpenFreeMap **Liberty** (CP3a decision 1; ADR-0022), that:
     - uses English labels where available: replace each name-based `text-field` with `coalesce(name:en, name:latin, name)`;
     - removes points of interest (the `poi` source layer);
     - **hides boundary features with `disputed = 1`** (the OpenMapTiles `boundary` layer).
   - `docs/design/VISUAL_SPEC.md` → "Basemap options" shows the intended result.
   - Keep glyph, sprite and tile URLs pointing at OpenFreeMap.
   - Record the source style's license and where it came from in the PR.
3. **Fallback:** a basemap from a **different provider or host** than OpenFreeMap, chosen from the options whose licenses M3-07 verifies (for example a self-hosted Protomaps extract, or another provider that needs no API key). It must also hide disputed boundaries. Configuration can select it, and after repeated tile errors the app switches to it automatically and shows the message from spec §5. Record the choice and why in the PR. OpenFreeMap's Bright and Liberty styles are not fallbacks, because they use the same servers.
   - **PO decision (after M3-07):** use the **VersaTiles public server** with our own hosted copy of its Colorful style, following `docs/LICENSES.md` obligations F1, F2 and F6. Its terms allow it for outages only, which is exactly the fallback's role. A self-hosted Protomaps extract would need Cloudflare R2 storage, because Pages limits files to 25 MiB, and so a new token permission; it is in `BACKLOG.md`.
4. **Places:**
   - Pins are coloured by type (spec §2) and are **keyboard-focusable buttons** named like "Capernaum, city".
   - Region and island records appear as clickable labels.
   - Visibility follows the `zoomTier` rules, and nearby pins cluster below zoom 7.
   - Places with several candidates show one pin below zoom 8, with a **"?" badge only if the place is disputed** (at least one candidate with confidence `disputed`; see `schema/README.md`). From zoom 8, or when selected, they show lettered, dashed-outline candidate pins.
   - The selected place gets a larger pin.
5. **Selection:** clicking a pin, label or candidate selects it and zooms as spec §2 describes, jumping instead of flying when reduced motion is preferred. It updates `?place=` and `&candidate=` in the URL, and opening such a URL restores the selection. The panel content can remain a stub, since M3-04 builds it.
6. **Controls:** zoom in and out, reset view (the Mediterranean overview), compact attribution, and a metric scale bar.
7. **Tests:**
   - unit tests for the zoom-tier visibility rules, the "?" and lettered-candidate logic, and parsing and writing the URL;
   - a test that the hosted style hides disputed boundaries;
   - a component test that pins are reachable by keyboard.

## Rework after the human's first look (2026-09-28; ADR-0024)
The human reviewed the first build in a browser and asked for three changes. They replace the matching parts of the scope above.

8. **Ancient-only physical basemap.** Rebuild both hosted styles (Liberty, and the VersaTiles fallback) as physical maps: keep the background, relief shading, natural landcover (wood, grass, scrub, sand, rock, ice, wetland), water, and rivers and streams. Remove every symbol layer (all labels, road shields and points of interest), roads, railways, aeroways, bridges and tunnels, boundaries (all of them, not just disputed ones), landuse (towns, farmland, industry), parks and buildings. Keep glyphs and sprite pointing at the provider, since our own labels use the glyphs. Set the maximum zoom to 14. Update the modification wording in the style `metadata` (L2), `LICENSE.txt` and `NOTICE.txt`, and in `docs/LICENSES.md` and `ATTRIBUTION.md`, so that every "modified" notice describes the physical treatment. The attribution strings themselves don't change, since the data is the same.
9. **Pins drawn by the map, for smooth dragging and zooming.** Replace the HTML marker layer with MapLibre sources and layers:
   - clusters from a clustered GeoJSON source (below zoom 7), with count labels;
   - pins as circle layers coloured by type, with the selected pin larger and shadowed (feature state or a filtered layer);
   - candidate pins, the "?" badge and the dashed outline as images added with `map.addImage` (drawn once on a canvas);
   - labels and area labels (empire, province, region; spec §2) as symbol layers with MapLibre's own collision and a sort key for the priority order;
   - a hover tooltip from layer mouse events (one DOM element, hidden while dragging or zooming);
   - clicks through `queryRenderedFeatures`, with cluster clicks zooming to the expansion zoom.

   Keyboard and screen-reader access move to the **list of visible places** (spec §7). It updates on `moveend`/`idle` only, never during a gesture. Its focus ring is drawn by the map (feature state) and pans the map if the pin is under the panel. **React must not re-render during a drag or zoom.** Remove the HTML markers, the JS clustering and the JS label collision once they're unused.
10. **A smoothness test with 10,000 points** (spec §11). Extend the Playwright verification to serve a `places.index.json` with 10,000 synthetic places added (intercept the request; no test code in the app), then drag for 2 s and zoom in and out with the wheel. It fails if a long task over 50 ms is observed during the gestures (`PerformanceObserver` for `longtask`), or if the DOM changes during a gesture (`MutationObserver` on the app root). Run the same check with the real data. Report frame-time percentiles as information, since headless Chromium renders in software.
11. **Area labels for M3-11.** Support records with `type` `empire` and `province` (they arrive with M3-11's data) with the zoom ranges and sizes in spec §2, and test them with fixtures.

Keep everything that already works: the worker files, lazy loading, the fallback trigger, URL state, Esc, candidate centring, the tab order and the CI checks.
## Out of scope
The place panel content (M3-04), search (M3-05), the Ancient layer and timeline (M4), and routes (M5).

## Acceptance criteria
- [ ] Every record in `places.index.json` appears at the right zoom, with the colour and label spec §2 gives.
- [ ] Disputed boundaries are hidden, which the tests confirm.
- [ ] The fallback works: it is on a different provider or host, and a test shows that simulated tile errors switch to it and show the message.
- [ ] Pins, labels and controls can be reached and operated by keyboard, and have accessible names.
- [ ] The attribution is visible and uses M3-07's exact strings, switching to the VersaTiles strings while the fallback is showing.
- [ ] The basemap shows no modern label, road, border, town or building, in both the main and the fallback styles, which the tests confirm.
- [ ] The smoothness check passes with 10,000 test points and with the real data.
- [ ] CI passes. Committed as `feat(map): add map view with places, tiers and clustering`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(map): map view with places, zoom tiers and clustering`.
