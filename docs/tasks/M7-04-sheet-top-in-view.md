# M7-04 — The sheet's top stays in view at full

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `fix/m7-04-sheet-top-in-view`, stacked on M7-03 (#83, `fd0ba7f`) (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0047 item 1 and its 2026-10-19 update, M7-03 |
| Credit target | ~800 (session guard: 2,000; ADR-0025) |

## Goal
ADR-0047 item 1: "At full, the sheet fills the screen … the handle and the close button stay visible." They don't once the reader scrolls. On the live site (since #79) and on #83, scrolling a full sheet's content scrolls its top off the screen. The PO measured this with Chromium on the iPhone 13 profile:

| Sheet | Scroll | Handle and close button |
|---|---|---|
| Place (Jerusalem), at full | 900 px | at y = −883, off-screen |
| Route list (`paul-1`), at full | 600 px | handle at y = −583, off-screen |

So a reader deep in Jerusalem's "About" text can't close or shrink the sheet without scrolling back to the top. With #83, the top strip that drags the sheet scrolls away too.

## Inputs (read only these)
- ADR-0047 and its update in `docs/DECISIONS.md`, and `docs/TESTING.md`
- `app/src/features/place-panel/place-panel.web.tsx`: the header with the handle, the close button and the drag strip
- `app/src/components/app-shell.web.tsx`: the place, route-list and route-stop sheet sections, which are the scroll containers, and their top strips
- `tests/browser/phone-sheet.spec.mjs`
- The PO's probes: `/tmp/m703-place-scroll-probe.mjs` and `/tmp/m703-route-strip-probe.mjs`
- This card

## Scope
1. **Pin the top.** On every phone sheet (place, route list, route stop), pin the top strip (the row with the handle, the close button and #83's drag strip) to the sheet's top while its content scrolls, for example with `position: sticky; top: 0` inside the scroll container.
   - Give the strip the sheet's background, so the content scrolls under it.
   - A hairline divider under it while content is scrolled under is optional.
   - Keep the pinned row's height as today: about 44 px plus its margin.
2. **The strip keeps M7-03's behaviour wherever it is.** A drag moves the sheet, a tap does nothing, the handle toggles (and works from the keyboard), and the close button closes.
3. **Unchanged:** the content's own pull-down at the top of the content (M7-02) and the content's scroll.
4. **Tests** (`docs/TESTING.md`: what the reader sees and does):
   - Place sheet at full: scroll the content by about 900 px with real input (wheel or touch). The handle and the close button are inside the viewport and are the elements at their own centres (`elementFromPoint`). A strip drag down from there moves the sheet to half; or, if cheaper, the close button closes it. Show it fails on M7-03's head, where the handle is at −883.
   - Route list: one equivalent assertion, if cheap.
5. **Check by hand in WebKit** (the iPhone 13 profile; `npx playwright install webkit` was run). Sticky positioning inside a scroll container has Safari quirks: an `overflow` on an ancestor between the sticky element and its scroller disables it. Put screenshots in `/tmp/m7-04-shots/`.

6. **Tidy up the strips, from #83's last review** (`.git/REVIEW-83.md`, "Follow-up (delta 19a1220..fd0ba7f)"). This card reworks the same code:
   - **One strip, three sheets.** Today the place strip (`place-panel.web.tsx`, `background: "transparent"`) and the route-list and route-stop strips (`app-shell.web.tsx`, a `data-sheet-drag-strip-container`, an explicit 44 px band and an `rgba(0,0,0,0.001)` layer) differ, and so do their routing checks: the place sheet uses `target.closest(…) || isSmallScreenSheetStripPointerDown(…)`, the route sheets the geometry check alone. Make them one shared piece with one routing rule. This also closes the `BACKLOG.md` line about merging the three strip blocks.
   - **The flick fallback.** Trust the release-time velocity only when the last move is at least about 6 ms old, so a short, noisy last sample can't flip a flick's direction.
   - **Coverage after a stage deep link.** #83's route-strip test dropped `&stage=` (the list auto-scrolls while the sheet settles). Restore a check that the strip drags right after `?tab=routes&route=paul-1&stage=6`, waiting for the sheet to settle.
   - **Nits:** rename the route-strip test (it drags only the route list), and make `waitForSheetSettledAtHalf` reuse the app's half-height formula instead of restating it (`app-shell.web.tsx`, about lines 67–68).

## Out of scope
- The sheet's positions, flicks and animation.
- The photo arrows (M7-03).
- Desktop panels.

## Acceptance criteria
- [ ] At full, after scrolling any distance, the handle and the close button of the place, route-list and route-stop sheets stay on screen and work, in Chromium and in WebKit.
- [ ] The new test fails on M7-03's head and passes here.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:app` and `npm test` pass, `--grep @phone` passes, and CI is green with 0 flaky.

## Notes
- Run only targeted tests locally, under the heavy lock (`lockf -k -t 7200 /tmp/ibm-heavy.lock …`). The full browser suite is CI's job.
- CI runs on the draft PR that the PO opens (ADR-0046).

## Finish
Follow the session protocol in your agent file. PR title: `fix(app): the sheet's handle and close button stay in view at full`.
