# M3-23 — Important places first on the opening map

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-important-places-first`, started from the M3 stack's last branch (`data/m3-name-intros`) |
| Depends on | ADR-0035 |
| Parallel with | none (last in the M3 stack) |
| Credit target | ~3,000 AI credits (session guard: 10,000) |

## Goal
The human, at mini checkpoint MC3 (2026-10-06): "When the map first loads, the places that show up are 'Nicopolis', 'Troas', 'Perga' etc. Most Bible readers probably have never heard of these places before … What'd actually be really helpful is if we can find a good way to show the more important places (like the ones addressed to from Paul's letters) when the map first loads so that users can immediately get their answers on where everything is. Perhaps let's try to put as many important places in the smaller dots as we can and collapse the less important places into the bigger dots?"

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0024 (pins drawn by the map; smoothness), ADR-0029 (major places) and ADR-0035
- `docs/design/VISUAL_SPEC.md` §2 (map, zoom tiers and label priority) and §7 (accessibility), and `docs/design/wireframes/01-map-overview.svg`
- `app/src/features/map/`, its tests, and `scripts/verify-web-export-playwright.mjs` (the map checks and the smoothness benchmark)
- `scripts/lib/app-data-builder.mjs` and `tests/build-app-data.test.mjs`
- This card

## Scope
1. **Importance in the data build:**
   - Add `passageCount`, the number of the record's `scripture` entries, to each place in `places.index.json`, with a test. `prominence` is already there.
   - The app sorts places into the importance order: major first, then more passages first, then data order. Put this in one small pure function, with unit tests.
2. **Major places as their own dots (below zoom 7):**
   - Major places that are pins (cities, towns, villages, and sites and natural features at the `city` tier) are never folded into a count bubble with other places.
   - Where major places would overlap at the current zoom, they show as one pin labelled with the most important member and the number of the others, as in "Jerusalem +4".
     - Choose the grouping distance so that places separate as soon as their pins and labels can be read apart.
     - The PO measured these at zoom 4.7: about 6 px across the five places around Jerusalem, about 7 px for Galilee, and 3 px between Laodicea and Colossae.
   - Selecting a grouped pin opens the named place, and its framing (about zoom 11) shows the others. Pointing at it shows a tooltip listing all members.
   - Keyboard list name: "Jerusalem and 4 nearby places".
3. **Other places step back (below zoom 6):**
   - Places that aren't major are drawn as small, muted dots without labels, and nearby ones fold into muted count bubbles that read as secondary to major pins.
   - They keep their tooltips, pointer cursor, clicks and keyboard-list entries.
   - From zoom 6 they look and cluster as they do today. You may move this to zoom 5.5 or 6.5 if labels crowd; say so in the PR.
4. **Label priority**, across all pin and area layers:
   1. the selected place;
   2. major places in importance order, including the major areas Galatia and Crete;
   3. empires, provinces and regions;
   4. other places.

   A label further down the list never hides one higher up.
5. **Keep working:**
   - disputed "?" badges and candidate letters;
   - the selected and highlighted states, including M3-20's About-link highlight;
   - the hit area and pointer cursor (M3-19);
   - the fallback basemap;
   - the keyboard list's reading order and 200-entry cap.
6. **Tests:**
   - Unit tests for the importance order and the grouping.
   - Playwright checks at the default view (1440×900, panel closed):
     - every major pin place is either its own labelled pin or a member of a labelled group;
     - no label of a non-major place is shown;
     - the Jerusalem group is labelled "Jerusalem" with its count, and selecting it opens Jerusalem;
     - at zoom 6, labels of other places appear.
   - The ADR-0024 smoothness benchmark with 10,000 test points must still pass unchanged.
7. **Screenshots:** the default view at 1440×900 and 1024×768, before and after, into `%TEMP%\ibm-m3-23\`, plus a list of the labels visible at the default view in each.
8. **Docs:** visual spec §2 (the zoom tiers table, the label-priority line and hover), and wireframe 01 (the opening view).

## Out of scope
New places or data changes other than `passageCount`, mobile layout (M7), and the ancient layer (M4).

## Acceptance criteria
- [ ] At the default view, the labels shown are major places only, and every major pin place is reachable as its own pin or within a labelled group.
- [ ] Other places are visible but muted and unlabelled below the threshold zoom, and they keep tooltips, clicks and keyboard entries.
- [ ] The importance order follows ADR-0035, and both it and the grouping are unit-tested.
- [ ] `lint`, `typecheck`, `test:all`, `validate:data`, `build:data`, `export:web` and `verify:web:playwright` pass, including the unchanged smoothness benchmark.
- [ ] M3-06's smoke and axe scripts pass against a local server, and so does the Lighthouse script with both gates enforced (ADR-0034).

## Finish
Follow the session protocol in your agent file. PR title: `feat(map): important places first`.
