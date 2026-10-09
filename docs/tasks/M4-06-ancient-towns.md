# M4-06 — Towns on the Roman roads

| | |
|---|---|
| Agent | `gis-engineer` → `research-lead` (names) → `fact-checker`; then `frontend-engineer` draws the layer |
| Model | Claude Opus 5.5 (the GIS Engineer that built M4-03's roads); GPT-5.3-Codex for the drawing |
| Branch | `data/m4-ancient-towns`, from `feat/m4-timeline-ui` (M4-05) |
| Depends on | M4-03's roads (`data/geo/ancient-roads.geojson`) and the visual spec's §2 "Towns on the roads" |
| Parallel with | M4-05's last round of label and border changes |
| Credit target | ~8,000 for the data (session guard: 10,000; ADR-0025), ~1,500 for the drawing |

## Goal
Name the towns where the Roman roads begin, end and meet, so that a road on the ancient map is read as a road between places (the human at MC7, 2026-10-09: "It'd be much easier to understand if we label beginning and ending towns/cities anywhere there're roads").

## Inputs (read only these)
- `docs/design/VISUAL_SPEC.md` §2 "Ancient layer", especially "Roads" and "Towns on the roads"
- `docs/DECISIONS.md`: ADR-0037 and its updates, ADR-0012 (data licences)
- `data/geo/ancient-roads.geojson`, `scripts/build-ancient-geo.mjs` (how inputs are pinned and checked) and `schema/README.md` → "Timeline and ancient layer"
- The Pleiades gazetteer's data download (licence: CC BY 3.0), pinned by date and SHA-256 like the other inputs. If only a "latest" download exists, vendor the subset this task uses, the way M4-03 vendored its OpenStreetMap ways, with a refresh command.
- `data/locations/*.json`, so that our own places aren't drawn twice
- This card

## Scope
1. **Nodes:** find every road end and every junction (roads meeting within about 1 km) in the 175 roads.
2. **Towns:** match each node to the nearest Pleiades place that is a settlement and is attested in the Roman period, within 5 km. Record its Pleiades id, its name and its representative point. Take the first form of a name with alternatives (for example "Tralleis" from "Tralleis/Caesarea"), and list for the Research Lead any name that looks odd or that differs from the form English readers know.
3. **Our places:** a node within 3 km of one of our places is that place, and gets no town of its own.
4. **Trimming:** a road end with no town, no junction and none of our places is trimmed back to the last of them, unless it ends within 2 km of the empire's edge or the coast. Trim only in the app's copy of the roads; `data/geo/ancient-roads.geojson` stays as M4-03 verified it. Report every trimmed end and the length removed.
5. **Output:** `data/geo/ancient-towns.geojson` with provenance, a build that reproduces it from the pinned inputs, a schema entry, tests, and an app file from `npm run build:data` (`ancient.towns.geojson`, without provenance) within the ancient layer's 300,000-byte gzip budget.
6. **Names (Research Lead):** review the listed names; keep Pleiades's form unless a standard English form differs, and cite it.
7. **Verification (Fact-Checker):** the Pleiades licence and the exact credit line for the map and `ATTRIBUTION.md`; 20 random towns' names and positions against Pleiades; every trimmed end; and that no town is drawn where a source says it didn't yet exist in the first century.
8. **Drawing (Frontend Engineer, after the data is verified):** the layer as the spec describes, hidden on the modern map, with Playwright checks that towns render at road ends and that our places outrank them.

## Out of scope
Road names, towns away from the roads, minor roads, and any change to `data/geo/ancient-roads.geojson`.

## Acceptance criteria
- [ ] Every road end on the map is a named town, a junction, one of our places, the empire's edge or the coast.
- [ ] The towns' file is reproducible from pinned inputs, and the ancient layer stays within 300,000 bytes gzip.
- [ ] The Fact-Checker signs off the licence, the credit and the sampled towns.
- [ ] `npm run lint`, `typecheck`, `test:all`, `build:data`, `export:web` and `verify:web:playwright` pass.

## Finish
Follow the session protocol in your agent file. PR title: `data(geo): towns on the Roman roads`.
