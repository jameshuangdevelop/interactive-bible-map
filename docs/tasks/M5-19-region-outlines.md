# M5-19 — An outline for every region

| | |
|---|---|
| Agents | `research-lead`, then `fact-checker`, then `gis-engineer` (ADR-0014) |
| Models | Claude Sonnet 5; Claude Opus 5.5; GPT-5.3-Codex |
| Branch | `data/m5-19-region-outlines`, stacked on M5-18 (#84, `73c67f9`) (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0050 (this card's decision), ADR-0048 and its 2026-10-20 update, ADR-0037 items 1–3, ADR-0014 |
| Credit target | ~4,000 for the research, ~2,500 for the check and ~3,000 for the geometry (session guard: 8,000; ADR-0025) |

## Goal
The human, play-testing #81: "the red dotted highlight looks great, I like it a lot. Can we do it for all regions like Samaria, Kingdom of Pontus (just examples, but can we do them for all types of regions)". #81's round 4 outlines every place that holds land that year (ADR-0048's update). This card draws an outline for each clickable region that holds none (ADR-0050):
- **Regions inside provinces:** Samaria, Galilee, Judea (the region), Pisidia, Lycaonia, Mysia, Phrygia, and Pontus in the years it holds no area (from AD 64).
- **Beyond Rome's edge:** Media, Mesopotamia and the Parthian Empire.
- **Islands and separate parts:** Crete and Libya (the island and the African part of the area `crete-cyrene`), and Chios, Cos, Malta, Rhodes and Samos (islands shown as region names).

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0050 (read it first), ADR-0048 and its update, ADR-0037 items 1–3, ADR-0014
- `docs/design/VISUAL_SPEC.md` §2, "Ancient layer", including "Notes on the borders"
- `docs/research/M5-ancient-lands.md` and `docs/verification/M5-ancient-lands.md`: M5-11, the precedent, and its sources
- `data/locations/` (the regions above), `data/geo/` (areas and coastline), `SOURCES.md`, `docs/LICENSES.md` and `ATTRIBUTION.md`
- `scripts/build-ancient-geo.mjs`, `scripts/check-ancient-geo.mjs` and `scripts/lib/ancient-app-data-builder.mjs`
- This card

## Scope
1. **Phase 1: research (research-lead).** No data changes.
   - For each region, its extent in the first century AD:
     - ancient descriptions first: Josephus, *Jewish War* 3.3.1–5, for the edges of Galilee, Samaria, Judea and Perea; Strabo, *Geography* books 12–16; Pliny, *Natural History* books 5–6;
     - checked against modern open scholarship: Pleiades (CC BY), DARE, AWMC under its licence, and Wikipedia for orientation only;
     - the features that bound it: coasts, rivers, ridges, towns and province borders;
     - its sources, with links and licences, and its confidence;
     - whether its extent changed between 4 BC and AD 100.
   - **Islands and parts:** say where each island's land is already drawn (as a part of an area, or in the coastline), or which open dataset gives its coast (Natural Earth, public domain).
   - Write `docs/research/M5-19-region-outlines.md`. List any region that can't be outlined from a source, and why.
2. **Phase 2: check (fact-checker).** Verify the sources, the licences, each boundary description and its confidence. Write `docs/verification/M5-19-region-outlines.md`.
3. **Phase 3: geometry (gis-engineer).**
   - `data/geo/region-outlines.geojson`:
     - one feature per region, with `id` set to its location id;
     - properties: source ids, confidence, a note, and years if the extent changed;
     - following existing coastlines and area borders where the sources say so;
     - simplified to the ancient layer's level.
   - Build it into a new generated file in `app/dist/generated/` (for example `ancient.region-outlines.json`), within the ancient layer's size budget (ADR-0037), or raise the budget with a reason.
   - Checks in `scripts/check-ancient-geo.mjs`: each feature is a valid Polygon or MultiPolygon, contains its region's point, and has sources and a confidence.
   - Screenshots in the PR: each outline drawn over the ancient map (a debug render is fine).

## Out of scope
- Using the outlines in the app: the PO's next card, after #81 merges.
- New place records, and the grey italic names without a record.
- Any change to an existing area or border.

## Acceptance criteria
- [ ] Every region above has an outline drawn from verified sources, or is listed as not outlinable, with the reason.
- [ ] The Fact-Checker's sign-off covers every outline and every licence.
- [ ] `npm run validate:data`, `check:ancient-geo`, `test`, `build:data` (within budget) and `test:app` pass, and CI is green.

## Finish
Follow the session protocol in your agent file. PR title: `data(ancient): an outline for every region`.
