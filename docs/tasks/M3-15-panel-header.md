# M3-15 — A simpler panel header, with countries

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-panel-header`, started from M3-14's schema commit on `data/m3-modern-countries` |
| Depends on | CP3.5 approved, and M3-14's schema commit (the `names.modernCountries` field and its app type). Merge after M3-14. |
| Parallel with | M3-14's data and verification phases, and M3-16 |
| Credit target | ~2,500 (session guard: 10,000; ADR-0025) |

## Goal
Make the top of the place panel quicker to read, following the human's review on 2026-09-30:
- **ADR-0030:** remove the action bar, and put the confidence chip on the "Today" line, so it is clear what the confidence is about;
- **ADR-0028:** show the country, as in "Today: Selçuk, Türkiye".

## Inputs (read only these)
- `docs/DECISIONS.md`: ADR-0028 and ADR-0030
- `docs/design/VISUAL_SPEC.md` §3, §4, §8 and §10, and `docs/design/wireframes/02-place-panel.svg` and `03-disputed-place.svg`
- `app/src/features/place-panel/` and `app/src/features/search/`, with their tests and the Playwright checks in `scripts/verify-web-export-playwright.mjs`
- `schema/README.md` → "Modern names" (as updated by M3-14)
- This card

## Scope
1. **Remove the action bar** (Zoom to, Copy link, Sources) and its tests. These stay:
   - opening a place still frames all its candidate sites on the map;
   - the address bar still holds the place's link (`?place=…`);
   - the Sources list stays at the end of the panel.
2. **The "Today" line** shows the modern name, then the countries, then the location chip, all on one line (wrapping on narrow panels):
   - **One site:** "Today: Selçuk, Türkiye", then the "High confidence" chip (or the record's own confidence).
   - **Countries already in the name:** an area's phrase may name its countries ("Central Türkiye"). Add only the countries the phrase doesn't already contain, compared case-insensitively.
   - **No modern name but countries** (disputed places, and other places with several candidates that have no single name): "Today: Israel and the West Bank". For disputed places, the "Location disputed · 4 proposed sites" chip follows; for the others, the "*n* sites" note.
   - **Countries joined** as "A", "A and B", or "A, B and C".
   - **No countries** (Jerusalem and the places inside it, and empires): the modern name alone, then the chip. With neither a modern name nor countries, the chip sits alone where the line would be.
3. **Search results:** the second line shows the modern name with its countries, by the same rule, then the type. For example, "Selçuk, Türkiye · City". Disputed places keep "Disputed · *n* proposed sites · *type*".
4. **Docs:** update visual spec §3 (items 2, 3 and 5, and remove the "Coming after CP3.5" note), §4 (the results line), §8 (the modern-names rule as ADR-0028 states it) and §10 (no Copy link button). Redraw the panel headers of wireframes 02 and 03 to match.
5. **Tests:** unit tests for the composition rule (one country, two, three, a country already in the phrase, no modern name, no countries). Update the Playwright checks to cover:
   - Ephesus shows "Today: Selçuk, Türkiye" with its chip on the same line;
   - Emmaus shows its countries and the "Location disputed" chip;
   - Jerusalem shows no country;
   - no action bar is present;
   - searching "Ephesus" shows the country on the second line.
   Take screenshots of Ephesus, Emmaus and Jerusalem for the PR.

## Out of scope
The data itself (M3-14), the "About" text (M3-16), other panel sections, and the preview deploy (M3-06).

## Acceptance criteria
- [ ] No Zoom to, Copy link or Sources buttons remain, and nothing else in the panel depends on them.
- [ ] The chip sits on the "Today" line for every kind of place listed in scope item 2.
- [ ] Countries are never repeated, and records without countries show none.
- [ ] Search results show the country.
- [ ] The visual spec and wireframes 02 and 03 match the app.
- [ ] `lint`, `typecheck`, `test:all`, `export:web` and `verify:web:playwright` pass. The screenshots are in the PR.
- [ ] Committed as `feat(panel): show countries and move the location chip; remove the action bar`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `feat(panel): simpler header with countries`.
