# M4-03 — Ancient layer: area shapes, roads and coastline

| | |
|---|---|
| Agents, in order | `gis-engineer` (shapes, roads and coastline) → `fact-checker` (verification and licensing), each adding its own commits (ADR-0014) |
| Models | GPT-5.3-Codex → Claude Opus 5.5 |
| Branch | `data/m4-ancient-geometry`, from M4-01's schema commit. When M4-02's data is committed, the PO merges it in. |
| Depends on | M4-01. The list of areas comes from M4-02's research note; the PO passes it on. |
| Parallel with | M4-02 and M4-04 |
| Credit target | ~5,000 shapes, ~3,000 verification (session guard: 10,000 each; ADR-0025) |

## Goal
Draw the shape of each first-century area from open data, plus the major Roman roads and, where it differs from today's, the ancient coastline. The app can then show borders that change with the timeline.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0037 (items 3 and 5), ADR-0012, ADR-0018 (Pontus, Galatia, Cappadocia, Asia and Bithynia as shapes)
- `docs/LICENSES.md` (ODbL for `data/geo/`), `ATTRIBUTION.md`, `docs/research/SOURCES.md` (AWMC, DARE, Natural Earth)
- `schema/README.md` → "Timeline and ancient layer" (M4-01)
- M4-02's research note, `docs/research/M4-timeline.md` (the areas and their periods)
- `docs/design/VISUAL_SPEC.md` §2 "Ancient layer" and §11
- This card

## Open data to start from
Read by the PO on 2026-10-07; confirm each license at the source.
- **AWMC geodata** (<https://github.com/AWMC/geodata>, ODbL 1.0). Pin the commit you use.
  - `Cultural-Data/political_shading/`: Herod's kingdom (polygons); the empire's extent in 60 BC, AD 117 and AD 200; the provinces of AD 200 (boundary lines only); and the senatorial provinces.
  - `Cultural-Data/roads/roads.geojson` (5.3 MB): each segment has its Barrington Atlas map, a major or minor flag (`Major_or_M`), a known or conjectured flag (`Known_or_a`), and period codes (`timeperiod`; "R" is the Roman period, 30 BC – AD 300).
  - `Physical Data/shoreline/coastline.zip`: the ancient coastline.
- **Natural Earth** (public domain): rivers and today's coastline, where a border follows them.
- **Itiner-e** (de Soto, Pažout, Brughmans and others, *Scientific Data* 12, 1731, 2025; <https://doi.org/10.1038/s41597-025-06140-z>), a high-resolution dataset of Roman roads: evaluate it as a better road source than AWMC's, read its license at the source, and use it only if the Fact-Checker accepts it.

## Scope
### GIS Engineer
1. **Shapes:** one shape for each area in M4-02's list. Start with the provinces and the lands of Herod's kingdom, while the list is being finished.
   - Build them from AWMC's lines and polygons, closed against the coastline.
   - Where the first-century border differs from AWMC's (which shows AD 117 or AD 200), move it only along a cited description: an ancient author or a modern scholarly description, such as a river or a mountain range. Record each change and its source in the feature's provenance.
   - Where nothing supports a border between two areas, don't draw one: merge them, or flag it to the PO. Never invent a line.
   - Pontus, Galatia, Cappadocia, Asia and Bithynia must have shapes (ADR-0018).
2. **Roads:** AWMC's major roads of the Roman period within the map's focus. Leave out any road a source dates after AD 100, for example Trajan's Via Nova Traiana (AD 111–114). Keep AWMC's known or conjectured flag and its ids.
3. **Coastline:** compare AWMC's ancient coastline with today's near our places. Include only differences that show at zoom 10 or below and that the data supports, for example the silted gulfs at Ephesus and Miletus, as shapes of land that was then sea. If none qualify, say why and add a line to `BACKLOG.md`.
4. **Build:** run M4-01's build, report the sizes against the 300 KB budget, and simplify further if needed.
5. **Preview:** an image of the areas at three stops (for example 4 BC, AD 30 and AD 50) for the PR and the PO's mini checkpoint.
6. **Explain** each GIS idea you use, such as turning lines into polygons, dissolving, simplification and topology, in one plain sentence with a learning link, in the PR body.

Commit: `data(geo): first-century areas, roads and coastline`.

### Fact-Checker
1. **Licensing:** AWMC's ODbL terms (the attribution the map shows, the license notice, and access to the derived data, which the public repository gives), Natural Earth, and any other dataset used. Update `docs/LICENSES.md` and `ATTRIBUTION.md`, and set the exact attribution string the ancient map shows (spec §9).
2. **Geometry:** check each changed border segment against its cited source. Review the places that fall outside their assigned area at any stop (the check from M4-01 lists them): each must be a real exception or get fixed. Check that no road dated after AD 100 is left, and the coastline's sources.
3. Write `docs/verification/M4-ancient-geometry.md`. Run `validate:data`, `test` and `build:data`. Commit: `docs(verification): verify the ancient layer's shapes`.

## Out of scope
Who held each area (M4-02), the app (M4-04 and M4-05), and modern borders.

## Acceptance criteria
- [ ] Every area in M4-02's list has a shape with provenance, and every change to AWMC's lines cites a source.
- [ ] Roads and coastline as above, with upstream ids.
- [ ] Everything the ancient layer loads is under about 300 KB compressed.
- [ ] Every place lies in its assigned area at every stop, or is an explained exception.
- [ ] Licenses and attribution are recorded, the shape check from M4-01 is switched on, and CI passes.

## Finish
Each agent follows the session protocol in its agent file, and only the Fact-Checker's phase ends the task. PR title: `data: first-century borders, roads and coastline`.
