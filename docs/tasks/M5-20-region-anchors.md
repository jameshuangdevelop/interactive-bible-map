# M5-20 — Outlines for the seven regions M5-19 deferred

| | |
|---|---|
| Agents | `research-lead`, then `fact-checker`, then `gis-engineer` (ADR-0014) |
| Branch | `data/m5-20-region-anchors` |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0050 and its 2026-10-20 update; M5-19's research note and verification report |
| Credit target | ~1,500 for the research, ~1,500 for the check and ~2,000 for the geometry (session guard: 8,000; ADR-0025) |

## Goal
Outlines for the seven regions that M5-19 deferred: Pisidia, Lycaonia, Mysia, Phrygia, Media, Mesopotamia and the Parthian Empire. Until then they show their name only (ADR-0050 item 5).

M5-19 built them from too few anchors. Most anchors lay inside the regions and almost none outside, so the equidistant lines had nothing to stop them. Pisidia reached the Lycian coast and took in Laodicea and Colossae, Lycaonia reached the Mediterranean, Mysia took in the Ionian coast, and Phrygia ran into Bithynia. In the East, the river masks produced a Media of 3.6 million km² and a thin strip for Mesopotamia.

## Inputs (read only these)
- `docs/research/M5-19-region-outlines.md` (§10 governs), and `docs/verification/M5-19-region-outlines.md` §4.4–4.7 and §4.9–4.11
- `data/geo/region-anchors.json` and `scripts/build-region-outlines.mjs`, as M5-19 left them
- `data/geo/ancient-areas.geojson`, Natural Earth at the pinned commit `ca96624`
- This card

## Scope
1. **Research (research-lead).** For every edge of each region, list:
   - anchors **on both sides**: Pleiades or Wikidata ids, each with the passage that puts it on its side;
   - enough anchors to close the region on every side. For Asia Minor that means Lydia, Ionia, Caria, Lycia, the Milyas and the Kibyratis, Pamphylia, Isauria, Cilicia, Cappadocia, Galatia and Bithynia. For the East it means Armenia, Adiabene, Babylonia, Persis, Hyrcania and Bactria, as the sources name them;
   - which edges are coasts, and which follow a named river or range;
   - each region's rough area, from the sources or modern scholarship, as a check.

   Write a §11 in the M5-19 note, or a new note.
2. **Check (fact-checker).** Verify every anchor's side and every edge's source.
3. **Geometry (gis-engineer).** Build each region with a labelled-anchor Voronoi (equidistant lines), the named rivers and the coasts, clipped to land. Every vertex has a source (M5-19's G0 and check (f)). Add three checks:
   - (e) tests **every** listed anchor on its stated side;
   - no outline touches the sea unless the research lists that edge as a coast;
   - each area lies within the research's range.

## Out of scope
- Changing existing areas or borders.
- Using the outlines in the app (that's M5-19's frontend card).

## Acceptance criteria
- [ ] Each of the seven regions has an outline built only from sources, or is listed as not outlinable, with the reason.
- [ ] The Fact-Checker signs off every anchor, every edge and every licence.
- [ ] `npm run validate:data`, `check:ancient-geo`, `test` and `build:data` pass (with the region outlines' own cap), and CI is green with 0 flaky tests.
