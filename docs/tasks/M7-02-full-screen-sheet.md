# M7-02 — The phone sheet opens to the full screen

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m7-02-full-screen-sheet`, on M5-12 (`chore/m5-12-playwright-test`) with the phone-title fix (#68) merged in (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0047; M5-12 (the test runner); #68 |
| Credit target | ~5,000 (session guard: 8,000; ADR-0025) |

## Goal
The human's play-test with friends (2026-10-13, ADR-0047): on phones, the details sheet should drag up to fill the whole screen, so that long text is easy to read, and drag down to disappear.

## Inputs (read only these)
- `docs/DECISIONS.md` ADR-0047 (read it first), plus ADR-0045 for the tests, and `docs/TESTING.md`
- `docs/design/VISUAL_SPEC.md` §3 (the panel on small screens), §2 ("Tabs and the route panel" on phones) and §7 (accessibility)
- `app/src/components/app-shell.web.tsx`: the small-screen sheet, `SmallScreenSheetMode`, the drag state and the height constants (~lines 59–63 and 370–570); `app/src/features/place-panel/place-panel.web.tsx` (the phone header, from #68); `tests/browser/` (M5-12's runner and fixtures)
- This card

## Scope
1. **Three heights.** The sheet has three positions: **closed**, **half** (today's collapsed height, about 40–53% of the screen) and **full**.
   - At **full**, the sheet's top meets the screen's top (below the safe-area inset). It covers the search box, the tabs and the toggle; the drag handle and the close button stay visible, and the content scrolls inside the sheet.
   - Opening a place shows **half**, as today.
2. **Dragging the top edge** (the handle and the header strip, at least 44 px tall):
   - Upward from half, it moves to full.
   - Downward from full, it moves to half; downward from half, it **closes**. Closing is the same as the close button: the place is deselected, and the URL drops `?place=`.
   - The sheet follows the finger. On release, it settles at the nearest position, and a quick flick goes one position in its direction. Small movements (under about 6 px) count as taps.
   - **Scrolling vs. dragging:** while the content is scrolled down, dragging inside it scrolls; only from the top of the content, or on the handle, does a downward drag move the sheet.
3. **Tapping the handle** toggles between half and full. The handle is a button named "Expand details" or "Collapse details", with `aria-expanded`; Enter and Space work, and the focus stays visible. With reduced motion, the sheet jumps instead of animating.
4. **The route panel's sheet** on the Routes tab behaves the same way: half, full, and dragging down to close goes back to the route list.
5. **Spec:** update VISUAL_SPEC §3 (and the phone line in §2) to describe the three positions, the drags, the handle and the reduced-motion rule.
6. **Tests** (`@phone`), in a new `tests/browser/phone-sheet.spec.mjs`, each within 60 s, on a phone viewport with touch:
   - drag the handle up from half to full (the sheet's top within 8 px of the screen's top), then down to half, then down to closed (no `?place=` left);
   - a tap on the handle toggles half and full;
   - at full, the content scrolls, and a downward drag inside scrolled content scrolls it rather than moving the sheet;
   - the route panel does the same;
   - an axe scan of the full sheet;
   - Jest tests for the settle logic (nearest position, flick, tap threshold), if it's extracted as a pure function. Extract it.

## Out of scope
The desktop panel. New content. M5-14's tests: don't edit its files, and keep your tests in your new spec file.

## Acceptance criteria
- [ ] Dragging and tapping move the sheet between closed, half and full as described, on the Map tab and the Routes tab.
- [ ] At full, the sheet fills the screen below the safe-area inset, and its content scrolls.
- [ ] The new tests pass 3 times in a row locally, and in CI on the PR. `npm run lint`, `typecheck` and `test:app` pass.
- [ ] VISUAL_SPEC §3 and §2 are updated.

## Finish
Follow the session protocol in your agent file. PR title: `feat(app): a place panel that opens to the full screen on phones`.
