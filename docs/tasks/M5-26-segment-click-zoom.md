# M5-26 - Fit the map to a selected route segment

| | |
|---|---|
| Agent | `frontend-engineer`; PO review |
| Branch | `feat/m5-26-segment-zoom`, from `main` (ADR-0051) |
| PR target | `main` |
| Depends on | #99 merged; ADR-0052 |
| Scheduling | Focused Routes follow-up before M6; CP5 is already approved |

## Goal
The human wants a segment click to zoom to that segment's vicinity, instead of only highlighting it or panning at the current zoom.

## Scope
- Reuse the existing map fit/padding helpers and route selection path.
- Fit each displayed stage line's geometry. For a disputed stage without verified geometry, draw an explicitly illustrative straight connection between its existing mapped stop references, with a concise disputed-site/not-verified-path disclaimer.
- Support explicit list/keyboard activation and map stage selection, including refocusing the same stage after a manual pan.
- Respect desktop panels and the phone sheet, with sensible zoom limits for short or point-like stages.
- Keep hovering camera-free. Preserve place clicks (including route-stop dots that also select a stage), route-level fitting, tab changes, disputed-site handling, and reduced-motion behaviour. A segment-focus request comes from a list/keyboard activation or a stage line/number, not merely from a stage id changing.
- Opening a stage deep link and Back/Forward that changes the route/stage fit the selected stage once. History changes only to place/other parameters do not refocus the segment; cover these directly dependent navigation cases.
- Do not edit the shared progress or budget ledgers; give the PO the status and usage in the PR description (ADR-0051).

## Acceptance criteria
- [ ] Clicking a visible stage zooms to its own vicinity, even when it was already on screen.
- [ ] Verified and illustrative stage lines fit the usable map area on desktop and phone.
- [ ] Activating the same stage again refocuses it; hovering another stage never moves the camera.
- [ ] Focused regression tests fail before the change and pass after it; existing route interactions remain intact.
- [ ] Relevant unit/browser checks, lint, type-check and export pass; the PR's full CI supplies the broader suite.
- [ ] The PR explains that this is a pre-M6 follow-up, links ADR-0052, and supplies its preview, status and honest budget row.

## Review feedback (2026-11-05)
- Segment rows and interactive stage lines/numbers use the pointer cursor on hover; camera-free hover and accurate place tooltips stay intact.
- The two Gadarenes sea crossings frame their recorded stop references rather than the full set of widely separated alternative city sites. Candidate indices and historical records are unchanged.
- **Updated by the human at 13:21 local:** show a line and a disclaimer for disputed segments. Jerusalem to Emmaus and the other disputed stages therefore get illustrative straight connections to their existing displayed candidates, not claimed historical paths.
- Keep the canonical verified route data unchanged. Do not invent a coordinate, road or historical itinerary; the display-only connection must be visibly qualified and all alternative candidate records remain available.
