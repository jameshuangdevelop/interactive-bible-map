# M5-15 — Selecting a stage without long tasks

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `fix/m5-15-stage-select-long-tasks`, stacked on M5-11 (#77) (ADR-0039) |
| PR target | `main` (ADR-0039) |
| Depends on | ADR-0024 (smoothness), ADR-0044 item 6, ADR-0045 |
| Credit target | ~4,000 (session guard: 6,000; ADR-0025) |

## Goal
On a real GPU (an Apple M1, headed), the PO's first measurement with `/tmp/mc13-stage-probe.mjs` on 2026-10-19 reported one main-thread task of 50–85 ms in 18 of 20 stage selections on the Routes tab. The amendment below traces that figure to CPU contention. On the MC12 preview, which stops at M5-08, it was 1 of 40 actions (54 ms), and M5-05's review recorded 0 of 40. Hovers stay clean. Find the cause and remove it, so that selecting a stage has no task over 50 ms.

> **PO amendment (2026-10-19):** with clean headed A/B runs on an idle M1 (`/tmp/perf-ab.log`), all builds are 0 of 20 stage selects over 50 ms; the earlier 18-of-20 result came from CPU contention, not from the app. The regression is still real as wasted map work: before the fix, one select re-uploaded all 17 sources 2–3 times (34–51 `setData`, plus 78–117 `setLayoutProperty` calls); after the fix, only `ibm-route-lines` and `ibm-route-points` update (4–6 calls) with no layout calls.

## Inputs (read only these)
- `docs/DECISIONS.md` ADR-0024, ADR-0044 (item 6: route places' names show from any zoom with the route's priority) and ADR-0045; `docs/TESTING.md`
- `app/src/features/map/map-view.web.tsx`: the route layers, the stage selection and highlight effects, `placementPriorityOrder`, the name layers' filters and sort keys; `app/src/components/app-shell.web.tsx` (stage selection)
- The PO's probes: `/tmp/mc13-stage-probe.mjs` (headed, 40 actions; pass `--headless` only for debugging) and `/tmp/mc13-setdata-probe.mjs`, which found no `setData` calls on a select
- This card

## Scope
1. **Profile a stage select** on a real GPU, using Chrome's performance trace through Playwright's `tracing` or the CDP `Profiler`, headed, through the lock. Identify the long task. Suspects:
   - symbol placement after a layout property, filter or sort-key change on the name layers when the stage changes (placement runs on the main thread);
   - camera pans;
   - React re-renders of the route panel.
2. **Fix it** without changing what the reader sees. For example:
   - change only paint properties or feature state when the stage changes;
   - keep the route names' layout stable between stages;
   - debounce what can wait until the camera settles.
3. **A deterministic CI test** (untagged, headless) that selects stages on two routes and fails if a select triggers `setData`/`updateData` on any non-route source or any `setLayoutProperty` call.
4. **Report** the probe's before and after numbers (headed) in the PR.

## Out of scope
Any change to what's drawn or its priorities. Other performance work.

## Acceptance criteria
- [ ] The deterministic stage-select browser test passes in normal CI and fails if stage selection updates non-route sources or calls `setLayoutProperty`.
- [ ] The old behavior is proven locally by temporarily restoring the old route-priority derivation and showing the deterministic test fail.
- [ ] `npm run lint`, `typecheck` and `test:app` pass.

## Finish
Follow the session protocol in your agent file. PR title: `fix(map): select a stage without long tasks`.
