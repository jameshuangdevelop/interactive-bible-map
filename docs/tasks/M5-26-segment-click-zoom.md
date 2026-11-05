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
- Fit a lined stage's geometry. For a line-less stage, use its existing mapped endpoints/candidates without inventing a line.
- Support explicit list/keyboard activation and map stage selection, including refocusing the same stage after a manual pan.
- Respect desktop panels and the phone sheet, with sensible zoom limits for short or point-like stages.
- Keep hovering camera-free. Preserve place clicks (including route-stop dots that also select a stage), route-level fitting, tab changes, disputed-site handling, and reduced-motion behaviour. A segment-focus request comes from a list/keyboard activation or a stage line/number, not merely from a stage id changing.
- Keep directly dependent stage deep-link behaviour and existing tests consistent.
- Do not edit the shared progress or budget ledgers; give the PO the status and usage in the PR description (ADR-0051).

## Acceptance criteria
- [ ] Clicking a visible stage zooms to its own vicinity, even when it was already on screen.
- [ ] Lined and line-less stages fit the usable map area on desktop and phone.
- [ ] Activating the same stage again refocuses it; hovering another stage never moves the camera.
- [ ] Focused regression tests fail before the change and pass after it; existing route interactions remain intact.
- [ ] Relevant unit/browser checks, lint, type-check and export pass; the PR's full CI supplies the broader suite.
- [ ] The PR explains that this is a pre-M6 follow-up, links ADR-0052, and supplies its preview, status and honest budget row.
