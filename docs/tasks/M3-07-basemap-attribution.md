# M3-07 — Basemap attribution and style license

| | |
|---|---|
| Agent | `fact-checker` |
| Model | Claude Opus 5.5 (fallback Claude Sonnet 5; ADR-0021) |
| Branch | `docs/m3-basemap-attribution` |
| Depends on | CP3a approved |
| Parallel with | M3-02 (scaffold), M3-08 (modern names) |
| Credit target | ~300 AI credits |

## Goal
Replace the basemap placeholder rows in `ATTRIBUTION.md` and `docs/LICENSES.md`, which have waited on the stack choice since M1, with verified licenses and the exact attribution text the app must show.

## Inputs (read only these)
- `docs/DECISIONS.md` → ADR-0009 (OpenFreeMap Positron, customized and hosted by the app, with OpenFreeMap Bright as the fallback)
- `docs/LICENSES.md` and `ATTRIBUTION.md`
- `docs/design/VISUAL_SPEC.md` §9
- This card

## Scope
1. **Verify each license on the provider's own pages,** giving the URL and the date read, for:
   - the **tiles and data**: OpenFreeMap, and the OpenStreetMap data under ODbL;
   - the **schema**: OpenMapTiles;
   - the **styles**: Positron and Bright, which we will modify and host, so check what their license requires for a modified style (for example keeping a notice);
   - the **fonts and sprites** served by OpenFreeMap.
2. **Write the exact attribution string** for the map's attribution control, and the fuller credits text for the app's "Sources & credits" drawer.
3. **Update the files:** replace the placeholder "Map tiles / basemap provider" row in `ATTRIBUTION.md` and the "Open (waits for CP1)" row in `docs/LICENSES.md`. Record any obligation the Frontend Engineer must meet, such as a license notice inside the hosted style file.
4. **Answer one question:** does hiding disputed boundary features (`disputed = 1`) in our hosted style change any attribution or license obligation?

## Out of scope
App code. M3-03 uses the text you write.

## Acceptance criteria
- [ ] Every license claim cites the provider's own page with the date read.
- [ ] `ATTRIBUTION.md` and `docs/LICENSES.md` have no basemap placeholder left.
- [ ] Both strings (the map control and the credits drawer) are given exactly, ready to paste.
- [ ] Committed as `docs(licensing): record basemap attribution and style license`.

## Finish
Follow the session protocol in `.github/agents/fact-checker.agent.md`. PR title: `docs(licensing): basemap attribution and style license`.
