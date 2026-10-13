# M5-04 — The routes' lines

| | |
|---|---|
| Agents, in order | `gis-engineer` (sources, then lines) → `fact-checker` (verification), each adding its own commits (ADR-0014) |
| Models | GPT-5.3-Codex (fallback GPT-5.5) → Claude Opus 5.5 |
| Branch | `data/m5-route-lines`, stacked on M5-01 (ADR-0039). Before the final build, the PO merges M5-02's and M5-03's verified data into it. |
| Depends on | M5-01's schema; the stops and stages by sea from M5-02's and M5-03's research notes (the notes are enough to start; the verified data is needed to finish) |
| Parallel with | M5-02's and M5-03's data steps, and M5-05 |
| Credit target | ~5,000 sources and lines, ~4,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Draw a line for each stage of the five routes under ADR-0038 item 5: one that shows the order of the stops and whether a stage went by land or by sea, built reproducibly from pinned sources, without claiming the exact path.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0038 (read it first, especially items 1, 4 and 5), ADR-0037 (items 3 and 5, and the update of 2026-10-08 on roads near our places), ADR-0012
- `docs/design/VISUAL_SPEC.md` §2 "Routes tab", §11
- `schema/README.md` → "Routes (M5)" (M5-01) and "Timeline and ancient layer (M4)", which describes how `npm run build:ancient-geo` pins its inputs and rebuilds `data/geo/` byte for byte
- `scripts/build-ancient-geo.mjs` and `scripts/lib/ancient-geo-inputs.mjs`, `data/geo/ancient-roads.geojson`
- `docs/research/SOURCES.md` (AWMC and ORBIS), `docs/LICENSES.md`, `ATTRIBUTION.md`
- `docs/research/M5-paul-journeys.md` and `docs/research/M5-jesus-journeys.md` (the stops, places passed and stages by sea)
- This card

## Scope
### GIS Engineer
1. **Sources.** Evaluate, and add to `docs/research/SOURCES.md`, each source you use, with its license, version and what it covers near our stops:
   - AWMC's roads dated to the Roman period, already in `data/geo/ancient-roads.geojson`.
   - Itiner-e (itiner-e.org), a 2025 dataset of the Roman Empire's roads with a paper in *Scientific Data*. It reports a CC BY 4.0 license and a certainty for each road; check whether it dates roads to the first century, especially in the Holy Land, Cyprus, Crete and southern Greece, where AWMC dates none.
   - ORBIS's sea lanes (CC BY 3.0 dataset): which lanes link the ports on our routes.
   - A coastline for the shortest path over water, such as Natural Earth's (public domain), which `build:ancient-geo` already pins.
2. **Lines by land:** follow a road in use in the first century where one links the two stops, from AWMC's dated roads or a road from another source that the Fact-Checker accepts as in use by then; otherwise a straight line between the stops. Never draw a road that a source dates after AD 100.
3. **Lines by sea:** from port to port without crossing land at any zoom where the route shows, along ORBIS's sea lanes where they link the ports, otherwise along the shortest path over water, passing each place the text says the ship sailed by, in order.
4. **"Path not known" stages and stages without a line** follow ADR-0038 items 1 and 4: a straight line between the named stops for the first, no line for the second.
5. **Ends:** every line ends at its stops' sites: the record's chosen candidate (ADR-0038 item 4) or the stop entry's site.
6. **Reproducible:** pin each new input by URL and SHA-256, as `build:ancient-geo` does; write each line's provenance (dataset, version, feature ids and every change); and keep the rebuild byte for byte, with a check like `check:ancient-geo`.
7. **Size:** `npm run build:data` reports the Routes files within 100,000 bytes gzip (ADR-0038 item 5); simplify the lines for the app if needed, keeping them off land.
8. Turn on the check that every stage has a line or a stated reason (M5-01). Run `lint`, `typecheck`, `test:all`, `validate:data`, `build:data` and `export:web`, and add PNG previews of each route to the build report. Commit: `data(geo): the routes' lines`.

### Fact-Checker
Check every new source's license against `docs/LICENSES.md` and add its attribution to `ATTRIBUTION.md`. Check each line's provenance, that roads used were in use by the first century, that no line by sea crosses land at the zooms shown, and that every line ends at its stops; use the previews. Write `docs/verification/M5-route-lines.md`. Run `validate:data`, `test` and `test:app`. Commit: `docs(verification): verify the routes' lines`.

## Out of scope
New stops or stages (M5-02, M5-03), the app (M5-05), and the backlog's undated Roman road links on the ancient layer.

## Acceptance criteria
- [ ] Every stage has a line or a stated reason, under ADR-0038 items 1, 4 and 5.
- [ ] Every input is pinned, every line has its provenance, and the rebuild matches byte for byte.
- [ ] No line by sea crosses land at the zooms shown, and the Routes files are within budget.
- [ ] The Fact-Checker has verified the lines and every license, and `ATTRIBUTION.md` lists each new source.
- [ ] CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data(geo): the routes' lines`.
