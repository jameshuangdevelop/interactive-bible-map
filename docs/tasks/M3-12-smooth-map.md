# M3-12 — Smoother dragging and zooming

| | |
|---|---|
| Agent | `frontend-engineer` |
| Model | GPT-5.3-Codex (fallback GPT-5.5) |
| Branch | `feat/m3-smooth-map`, stacked on `data/m3-ancient-regions` (M3-03, M3-10 and M3-11) |
| Depends on | M3-03, M3-10 and M3-11 (all ready, awaiting the human's push) |
| Parallel with | none: this comes first (the human, 2026-09-29) |
| Credit target | ~2,500 AI credits (session guard: 10,000; ADR-0025) |

## Goal
The human made the speed and feel of dragging and zooming the top priority before any other work: "zooming and dragging speed and usability should now be the number one thing we prioritize before we proceed". Make the map feel as smooth as possible, both over the human's remote desktop and on a normal local device.

## What the PO measured (2026-09-29)
- **The human's machine is a remote desktop session**, whose display adapter runs at **32 Hz**. In a visible Chromium window there, our map and OpenFreeMap's own demo both ran at about 31 ms per frame (32 frames per second) while dragging and zooming, with no main-thread task over 50 ms. So that ceiling comes from the connection, not our code. Over remote desktop, what still matters is how much each frame costs, how quickly tiles appear, how well the picture compresses (flat colours compress better than textures), and how the gestures feel.
- **Covered windows are throttled:** Chrome slows a covered headed window to one frame per second, which looks like one-second freezes. Benchmarks must keep the window in front (for example `page.bringToFront()` before each run) or run headless with GPU flags, and must say which.
- The page history API isn't called during gestures, and the existing smoothness gate passes with 10,000 test points.

## Scope
1. **A benchmark** (`npm run bench:map`; not part of CI), in the style of `scripts/verify-web-export-playwright.mjs`:
   - **Scenarios:** a 2 s drag at the overview and at `?place=galilee`; wheel zoom 6 steps in and 6 out; a trackpad-style pinch (ctrl + wheel); and the fly-to when a place is selected.
   - **Metrics:** frame-interval percentiles; long tasks; time from the end of a gesture to MapLibre's `idle` (all tiles loaded); the number and bytes of tile requests; and the time to first map paint.
   - **Runs:** headless, and headed with the window in front. Run the same drag and zoom on OpenFreeMap's demo page as a baseline.
   - **Output:** a Markdown table, saved to `docs/research/M3-12-map-benchmark.md` with the machine and mode.
2. **Variants the human can try** through URL parameters, left in the production build because they're harmless:
   - `?relief=0`: no relief shading;
   - `?landcover=0`: plain land and water;
   - `?fade=0`: no label or tile fade;
   - `?dpr=1`: pixel ratio capped at 1;
   - `?zoomrate=fast`: faster wheel and trackpad zoom;
   - `?lite=1`: all of these together.

   Document them in `app/README.md`. They let the human judge by feel over remote desktop, and later on a local device.
3. **Tune the defaults, measuring each change:**
   - **Tiles:**
     - a short symbol `fadeDuration`, and `raster-fade-duration: 0`;
     - tile-cache settings, so recently seen tiles return instantly when zooming back;
     - `prefetchZoomDelta` and `cancelPendingTileRequestsWhileZooming`;
     - `<link rel="preconnect">` to `tiles.openfreemap.org`, to cut the first tile's latency.
   - **Frame cost:**
     - cap `pixelRatio` at 2;
     - merge the physical style's landcover layers into as few layers as possible (one `match` on class);
     - check overdraw and the relief raster's cost;
     - confirm that nothing runs per frame during gestures: no React renders, `setData`, `setFeatureState` or DOM changes.
   - **Gesture feel:**
     - wheel and trackpad zoom rates that feel like Google Maps;
     - drag inertia (`dragPan` easing and deceleration);
     - about 250 ms for the zoom-button and double-click zoom animations;
     - keyboard pan and zoom steps.
   - **Compression:** where a default costs smoothness over remote desktop (for example the relief texture), measure it and say which default you recommend. The PO asks the human.
4. **Keep every existing check green:** the smoothness gate (10,000 points), both outage modes, labels, keyboard access and Lighthouse.

## Out of scope
The panel (M3-04), search (M3-05) and the deploy (M3-06). Don't change the data.

## Acceptance criteria
- [ ] `docs/research/M3-12-map-benchmark.md` gives before-and-after numbers for every scenario, and the OpenFreeMap baseline.
- [ ] Every default change is backed by a measurement, and none makes any metric worse without a stated reason.
- [ ] The URL variants work, and are documented.
- [ ] CI passes, and all existing checks stay green. Committed as `perf(map): make dragging and zooming smoother`.

## Finish
Follow the session protocol in `.github/agents/frontend-engineer.agent.md`. PR title: `perf(map): smoother dragging and zooming`.
