# M5-24 — Jesus' journeys in a few parts

| | |
|---|---|
| Agents | `research-lead` → `fact-checker` → `gis-engineer` (data) → `frontend-engineer` (the Routes tab); cross-vendor `pr-reviewer` |
| Branches | `data/m5-24-jesus-journey-parts` (research, check and data), then `feat/m5-24-jesus-journey-parts` (the Routes tab) |
| PR target | `main`, one PR per branch (ADR-0051) |
| Depends on | ADR-0038, ADR-0041 and ADR-0042 (routes), M5-03's research and verification, ADR-0051 |
| Credit target | ~4,000 (session guard: 8,000 per session; ADR-0025) |

## Goal
The human, 2026-10-22: "for Jesus's journeys, can we break it down into a few big chunks? Right now it looks way too busy and because some routes aren't known, they're not numbered which also makes it quite hard to see." They approved the card on 2026-10-23.

**Now:**
- The `jesus` route in `data/routes/routes.json` has 32 stages with `structure: "standalone-segments"`, in no single order.
- 12 stages have no line (`noLineReason`), because one of their places has a disputed site: Bethany beyond the Jordan, Cana, the country of the Gadarenes, Bethsaida or Emmaus. Those stages carry no number on the map.
- Paul's journeys are separate routes (`paul-1`, `paul-2`, `paul-3`, `paul-rome`) with `structure: "connected"`.

**After:**
- Jesus' journeys are split into a few parts, about 3 to 6, that follow the Gospels' own order. Each part is shown on its own, as Paul's journeys are.
- Every stage carries a number.
- The stages without a line are shown another way, such as a numbered place with a dashed hint or a "site disputed" mark. The PO shows the human the look before merging.

## Inputs (read only these)
- `data/routes/routes.json` (the `jesus` route), `data/routes/stops.json` and `data/geo/routes-lines.geojson`.
- `docs/research/M5-jesus-journeys.md` and `docs/verification/M5-jesus-journeys.md` (M5-03: which segments are well attested, and why).
- ADR-0038, ADR-0041 and ADR-0042 (`docs/DECISIONS.md`); `docs/LICENSES.md` (allowed sources).

## Scope
1. **Research (Research Lead), in `docs/research/M5-24-jesus-journey-parts.md`:**
   - Propose the parts, and put each of the 32 stages in exactly one part, in order within it.
   - Base the order on the Gospels' text (WEB) and on openly licensed harmonies of the Gospels, such as A. T. Robertson's *A Harmony of the Gospels* (1922) or Stevens and Burton's (1904), and on ISBE.
   - Where the Gospels' order is unclear, say so, follow a cited harmony, and give a confidence.
   - For the 12 stages without a line, give the facts the map needs: which place is disputed, and the candidate sites as the data already has them. The visual is decided later, with the human.
   - Propose the data shape: one route per part, like Paul's, or parts inside the `jesus` route. Weigh what the Routes tab and the validators need.
2. **Check (Fact-Checker):** verify every part, every stage's place in it and every order claim against the cited sources, and sign off in `docs/verification/M5-24-jesus-journey-parts.md`.
3. **Data (GIS Engineer, after the sign-off):**
   - Change `routes.json` (and the schema and validators if the shape changes) to the verified parts, with stage numbers.
   - Lines stay as they are: no new lines for disputed stages.
   - The data PR merges before the Routes tab work starts.
4. **The Routes tab (Frontend Engineer):**
   - Show the parts as separate journeys, each with numbered stages.
   - Show the stages without a line per the agreed look.
   - Add tests, poll map state, and get 0 flaky. Take headed screenshots for the human.

## Out of scope
- New journeys (BACKLOG: "Other journeys in Acts").
- Changing any disputed site's ruling or its candidates.
- New lines.

## Acceptance criteria
- [ ] The research and the verification are in, with sources; every one of the 32 stages is in exactly one part.
- [ ] The data validates (`npm test`, `build:data`) and the parts match the verified research.
- [ ] The Routes tab shows each part on its own, with every stage numbered. The stages without a line are shown as the human agreed.
- [ ] CI is green with 0 flaky. Screenshots are shown to the human before merging. The PR descriptions carry the budget rows and the status (ADR-0051).
