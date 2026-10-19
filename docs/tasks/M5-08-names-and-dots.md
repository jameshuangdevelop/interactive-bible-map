# M5-08 — Names that show what can be clicked

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m5-names-and-dots`, stacked on the last M5 branch (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | **The human's answers to ADR-0042 item 6**; M5-05's sixth round |
| Status | Waiting for the human |
| Credit target | ~4,000 (session guard: 10,000; ADR-0025) |

## Goal
Make every name on the map say whether it can be clicked, as the human asked at MC10 (ADR-0042 item 6). Names that can't be clicked are grey italic, like Mysia's and Phrygia's today. Natural features follow Google Maps' convention: green, and a little lighter.

## Waits for the human
1. **The red dots on the Map tab.** "Now that we have dots that signify the beginning and ending of a route, let's remove the red dots in maps mode" could mean:
   - places become clickable names without a dot, and only routes draw dots;
   - one dot per place, in the routes' style (a white dot with a blue ring);
   - only that a place's red dot isn't drawn under a route's own dot. ADR-0042 item 2 already does this.
2. **Water.** Seas, lakes and rivers either in green with the other natural features, or in blue italic as Google Maps draws them.
3. **Regions with details.** Crete's name opens its details today; Mysia's and Phrygia's don't. Either regions with details get the clickable style, or every region name is grey italic and can't be clicked.

## Scope, once answered
1. An inventory of every name the map draws: our places, the area labels, the ancient layer's labels, the coastline labels, the route's names, and the modern map's own labels. For each, whether it can be clicked.
2. One style per kind, as answered, in VISUAL_SPEC §2 "Places on the map" and "Zoom tiers"; the PO updates the spec first.
3. **The pins that vanish from zoom 6 (`BACKLOG.md`, the human's play-test).** The "other" pins' symbol layer (`ibm-city-pin`, `icon-allow-overlap: false`) loses the collision with its own label, which MapLibre places first, so from zoom 6 none is drawn and none can be clicked. Fix it whichever way item 1 goes, and add a test that every place is drawn and can be clicked at every zoom from its `minZoom`.
4. **Selected muted pins turning red (`BACKLOG.md`).** Settle this with item 1.
5. Tests: unit and Playwright checks for the styles, the clickability of each kind, and item 3. The axe check stays clean.

## Acceptance criteria
- [ ] Every name's style matches whether it can be clicked, on both maps.
- [ ] No place vanishes or stops being clickable at any zoom.
- [ ] `npm run lint`, `typecheck`, `test:all`, `export:web` and `verify:web:playwright` pass; the PO measures LCP and TBT from a desktop.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): names that show what can be clicked`.
