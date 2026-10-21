# M7-03 — The phone panel: arrows on every photo, and a top you can drag

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `fix/m7-03-phone-panel`, stacked on M5-17 (#82, `9ee7915`), beside M5-16 (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0047 (the full-screen sheet) and its 2026-10-19 update, M7-02 (#79) |
| Credit target | ~1,500 (session guard: 3,000; ADR-0025) |

## Goal
The human play-tested #79 on an iPhone on 2026-10-19 and asked for two fixes:
> "for some cities like jerusalem and damascus, the images don't have a "right" button for some reason. Only the "left" button exists. For other cities like rome, the right button still exists."

> "Let's just make it such that drag and hold the entire top part of the panel can make it full screen (instead of just holding and dragging the little bar)"

### 1. The missing right arrow: a Safari bug, on `main` too
The PO reproduced it in Playwright's WebKit, Safari's engine, with the iPhone 13 profile (390 px wide), on https://pr-79.interactive-bible-map.pages.dev and on the live site:

| Place | Photo frame width | "Next image" button |
|---|---|---|
| Jerusalem | 480 px | x 461–505, off-screen |
| Damascus | 450 px | x 431–475, off-screen |
| Rome | 324 px | visible |

Chromium gives 324 px for all three, so CI never saw it.

The cause:
- The panel body is `display: grid` (`place-panel.web.tsx`, about line 1828) with no `gridTemplateColumns`. Its one implicit `auto` column grows to the widest item's min-content width.
- The "About" text of Jerusalem and Damascus has long runs of citation markers with no spaces: `heaven.[10][11]…[25]` (16 markers) and `basket.[11]…[25]`. Rome's longest run, `him."[7]…[17]`, still fits.
- Chromium may break a line between `]` and `[`, and WebKit doesn't. In Safari the run can't wrap, so the column grows to 450–480 px. Every section in it grows too, and `overflowX: hidden` clips the right side.
- So the bug is worse than the arrow: in Safari the right end of every line of panel text is cut off as well. In the PO's WebKit screenshot of Jerusalem, the caption jumps from "…in about AD 30" to "Mount of Olives…", and the words between are clipped.

### 2. Drag from the whole top of the sheet
ADR-0047 item 2 says "Dragging the top edge moves the sheet", from the human's "Hold and drag the top of the details bar". #79 made only the handle draggable, a 44 px button. ADR-0047's 2026-10-19 update makes the sheet's whole top strip the drag area.

## Inputs (read only these)
- ADR-0047 and its update in `docs/DECISIONS.md`, and `docs/TESTING.md`
- `app/src/features/place-panel/place-panel.web.tsx`: the grid (about line 1828), `WikimediaImage`, `carouselButtonStyle`, and the handle (about lines 1720–1800)
- `app/src/components/app-shell.web.tsx`: `beginSmallScreenSheetDrag`, `handleSmallScreenSheetContentPointerDown`, and the route sheets' handles (about lines 2580–2790)
- `tests/browser/phone-sheet.spec.mjs`, including M5-17's `waitForSheetSettledAtFull`
- This card

## Scope
1. **The panel never grows wider than the screen.**
   - Give the panel body's grid `gridTemplateColumns: "minmax(0, 1fr)"`, as `app-shell.web.tsx` already does for the timeline (about line 2418).
   - Check the other grid and flex containers on the same path for the same blow-out: the route stage's place panel, the route list and the desktop panel.
   - Let long runs wrap, so nothing is clipped: `overflowWrap: "anywhere"` on the panel's text, or wrap points between citation markers.
2. **The whole top strip drags the sheet.**
   - On every phone sheet (the place sheet, the route list and the route stage's place sheet), the strip from the sheet's top edge down to the start of its content, across the full width, starts a sheet drag, up or down, at half and at full. That strip is the row with the handle and the close button.
   - The close button still closes on a tap. The handle still toggles half and full on a tap and from the keyboard (ADR-0047 item 3).
   - A tap anywhere else on the strip does nothing; only a drag past the handle's existing threshold moves the sheet. This keeps #79's review fix: a tap at full doesn't shrink the sheet.
   - The content below the strip keeps #79's behaviour: it scrolls, and at full it closes the sheet by a pull down from the top of the content.
3. **Tests** (`docs/TESTING.md`: test what the reader sees and does):
   - **The arrows stay on screen.** On the phone profile, open Jerusalem. The photo frame's right edge is inside the panel, "Next image" is inside the viewport and is the element at its own centre (`elementFromPoint`), and no element of the panel body is wider than the body.
     - Chromium doesn't use WebKit's break rule, so make the test independent of it: before measuring, add an unbreakable 600 px token to the About text, so the old grid grows in Chromium too.
     - Show that it fails on `9ee7915`.
   - **The top strip drags.** With real touch or pointer moves, a drag that starts on the strip, away from the handle and the close button, moves the sheet from half to full and back down. A tap there leaves the sheet where it is. Show that the drag test fails on `9ee7915`.
4. **Check by hand in WebKit**, which is installed locally (`npx playwright install webkit`, run on 2026-10-19). On the iPhone 13 profile, Jerusalem, Damascus and Rome show both arrows on every photo, and no text is cut off. Put the screenshots in `/tmp/m7-03-shots/`.
5. **Docs.** VISUAL_SPEC §3's sheet paragraph says the whole top strip drags.

## Out of scope
- WebKit in CI. Add one line to `BACKLOG.md` instead: "a small `@webkit` phone smoke project, if Safari-only layout bugs recur".
- The image viewer, and captions and credits beyond the wrap fix.
- The sheet's positions, flick rules and animation.

## Acceptance criteria
- [ ] In WebKit on the iPhone 13 profile, Jerusalem and Damascus show both arrows on every photo, and no line of panel text is clipped.
- [ ] A drag anywhere on the top strip, except the close button, moves the place sheet and the route sheets; a tap on the strip doesn't.
- [ ] Both new tests fail on `9ee7915` and pass on the branch.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test:app` and `npm test` pass, and CI is green with 0 flaky.

## Notes
- Run only targeted tests locally, under the heavy lock (`lockf -k -t 7200 /tmp/ibm-heavy.lock …`). The full browser suite is CI's job (`docs/TESTING.md` §2).
- CI runs on the draft PR that the PO opened (ADR-0046).
- M5-17 (#82) is still in review. If its head moves, the PO rebases this branch.

## Finish
Follow the session protocol in your agent file. PR title: `fix(app): every photo keeps its arrows, and the sheet drags from its whole top`.
