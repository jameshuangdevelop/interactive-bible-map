# ADR-0052 - Selecting a route segment fits its vicinity

- **Date:** 2026-11-05 UTC (2026-11-04 local)
- **Status:** Accepted
- **By:** the human, reviewing CP5: "whenever users click on a segment, it should zoom to that vacinity."
- **Context:** The Routes tab previously kept the reader's zoom and only panned to an off-screen selected stage. A stage could remain hard to inspect even after it was selected. CP5 was approved by the human merging #99; this is a focused follow-up before M6, not a reason to reopen that checkpoint.
- **Decision:**
  1. Explicitly selecting a stage or segment fits its vicinity, adjusting both centre and zoom. This applies to the route list, keyboard activation, and selecting a stage's line or number on the map.
  2. A stage fits its displayed line's geometry, not the whole route or distant alternative candidate sites. That includes the illustrative connections in item 8. The connection uses the stop references and candidate indices already recorded for the stage; all alternative candidate records remain available in the place details.
  3. Activating the same stage again refocuses it after the reader pans or zooms away.
  4. Fits respect the visible map area on desktop and phone, including open panels, and use the existing padding and sensible zoom limits.
  5. Hovering still never moves the camera. Place-name and route-stop clicks, route selection and tab switching retain their existing behaviour. In particular, a route-stop click that also selects its stage remains a place interaction, not a segment-focus request. No route-travel animation is added.
  6. Opening a valid stage deep link, or using Back/Forward to change the selected route or stage, fits that stage once as well. History changes that only alter the place or other parameters must not turn into segment-focus requests.
  7. Hovering a segment row or an interactive stage line/number shows the pointer cursor, without moving the camera or showing a stage number as a place tooltip.
  8. Disputed stages without verified route geometry display an illustrative straight connection between their existing mapped stop references. A short, visible stage disclaimer says the site is disputed and the line is not a verified historical path. This is a display-only annotation: the canonical geometry and `noLineReason` records remain unchanged, and no coordinates, roads or historical itinerary are invented.
- **Supersedes:** the route-stage part of ADR-0041 item 7's keep-the-reader's-zoom and off-screen-only pan rule. The place rules in ADR-0042 item 3 and ADR-0044 item 2 stay unchanged.
- **Consequences:** M5-26 ships as its own PR from `main`, before M6 expansion. CP5 approval remains valid.

## Update - 2026-11-05
The human changed the disputed-segment display rule: "for disputed segments, let's just add the line and do a disclaimer. It's confusing to not have a line". Item 8 implements that request as an explicitly illustrative connection to the candidate already shown. It supersedes the earlier no-line display policy, not the research record's uncertainty.
