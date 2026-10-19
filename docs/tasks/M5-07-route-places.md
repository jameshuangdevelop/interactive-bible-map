# M5-07 — Every route place becomes a place

| | |
|---|---|
| Agents, in order | `research-lead` (records, and the routes' references) → `fact-checker` (verification), each adding its own commits (ADR-0014); `gis-engineer` only if the validator needs a change |
| Models | Claude Sonnet 5 → Claude Opus 5.5 (GPT-5.3-Codex for the validator) |
| Branch | `data/m5-route-places`, stacked on M5-05 (`feat/m5-routes-tab`) |
| PR target | `main` (ADR-0039) |
| Depends on | The verified stop entries (M5-02, M5-03, M5-06); the human's MC10 feedback (ADR-0042 item 4) |
| Parallel with | M5-05's sixth round, which opens the place panel for whatever kind of place a stop is |
| Credit target | Per batch: ~4,000 records, ~3,500 verification, ~1,000 fixes (session guard: 10,000 each; ADR-0025) |

## Goal
Give every place on a route the details our other places have (ADR-0042 item 4). Each of the 32 stop entries in `data/routes/stops.json` becomes a full place record in `data/locations/`, and the routes point to the new places instead of the stop entries. The places then open in the place panel on both tabs and show on the Map tab.

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0042 (read it first), ADR-0041 item 1 (disclaimers last), ADR-0038 and its updates, ADR-0017, ADR-0026, ADR-0033, ADR-0035
- `schema/location.schema.json`, `schema/README.md`, `scripts/lib/validator.mjs`
- `data/routes/stops.json` (the verified candidates, passages and sources to start from), `data/routes/routes.json`, `data/locations/*.json` (the house style; Derbe and Lystra are good models), `data/bibliography.json`, `data/timeline.json` and the ancient layer's holders (for `politicalHistory`)
- `docs/research/M5-paul-journeys.md`, `docs/research/M5-jesus-journeys.md`, `docs/verification/M5-paul-journeys.md`, `docs/verification/M5-jesus-journeys.md`, `docs/verification/M5-route-text.md`
- The WEB text in `data/reference/engwebp_vpl.txt`
- This card

## Scope
1. **Three batches,** each a full ADR-0014 pass (records → verification → fixes → re-check) before the next starts:
   - **A, the voyage to Rome (15):** Sidon, Myra, Cnidus, Salmone, Fair Havens, Lasea, Phoenix, Cauda, Syrtis, Syracuse, Rhegium, Forum of Appius, Three Taverns, Alexandria, Adramyttium.
   - **B, Paul's journeys (14):** Seleucia, Attalia, Samothrace, Amphipolis, Apollonia (Macedonia), Assos, Mitylene, Chios, Samos, Trogyllium, Cos, Rhodes, Patara, Ptolemais.
   - **C, Jesus' journeys (3):** the country of the Gadarenes, Bethphage, Ephraim.
2. **Each record** follows `schema/location.schema.json` and the house style of our places:
   - names as ADR-0026 sets them, with today's name and country;
   - `type` and `zoomTier`. Islands, capes and the Syrtis are `natural-feature`: small islands follow Patmos (city tier), large ones Malta (region tier), and capes are sites. `prominence` is "standard";
   - the stop entry's verified candidates, support text and sources. Keep each candidate's coordinates exactly, because the route lines end there; if one should move, tell the PO, and the GIS Engineer rebuilds the lines;
   - a summary in the style of ADR-0033, with every caveat after the main content (ADR-0041 item 1);
   - `history`;
   - every WEB passage that names the place, not only the route's;
   - `otConnections` where they exist;
   - `politicalHistory` over the timeline's years, matching the ancient layer's holders;
   - `parentId` and `politicalAreaId`.
3. **No duplicates:** a place already in `data/locations/` (by name or within 2 km) isn't created twice; the validator's duplicate check decides. Bethphage's allow-listed neighbours on the Mount of Olives (`ROUTE_STOP_LOCATION_DUPLICATE_ALLOWLIST` in `scripts/lib/validator.mjs`) carry over to the places' own check.
4. **The routes switch, in each batch:** every reference to a converted stop entry in `data/routes/routes.json` (from, to, via, mentioned) points to the new place, and the converted entries leave `data/routes/stops.json` in the same batch, since the validator flags a place that duplicates a stop entry. The stop entries' format stays for future entries. `npm run validate:data`, `npm run check:route-lines` and `npm run build:data` pass at the end of each batch.
5. **Verification:** `docs/verification/M5-route-places.md`, one section per batch.

## Out of scope
Images (the Media Curator, later), the app's code (M5-05 handles any kind of place), and changes to the route lines.

## Acceptance criteria
- [ ] All 32 places have verified records, and no stop entry is left in use.
- [ ] `npm run validate:data`, `npm test`, `npm run build:data` and `npm run check:route-lines` pass; the places index and the routes stay within their size budgets.
- [ ] The Fact-Checker signs off each batch in `docs/verification/M5-route-places.md`.
- [ ] `ATTRIBUTION.md` lists any new upstream source.

## Finish
Follow the session protocol in your agent file. PR title: `data(places): every route place becomes a place`.
