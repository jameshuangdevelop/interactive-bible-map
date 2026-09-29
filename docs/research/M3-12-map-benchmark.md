# M3-12 map benchmark (dragging + zooming)

This benchmark was run on the remote desktop environment described in the task card:

- **Display ceiling:** ~32 Hz (headed runs naturally cluster around ~31.3 ms/frame).
- **Window throttling rule:** headed runs call `page.bringToFront()` before each gesture; covered-window (~1 FPS) attempts are discarded.
- **Renderer (all current runs):** `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | WebKit WebGL | WebKit`
- **Meaning:** this machine is software-rendered (SwiftShader), so tuning decisions below prioritize software rendering first.
- **GPU note:** a hardware-accelerated GPU device should be materially faster than this environment.

Raw artifacts:

- Baseline before tuning: `M3-12-map-benchmark.before.json`, `M3-12-map-benchmark.before-headed.json`
- Final after tuning: `M3-12-map-benchmark.after-headless.json`, `M3-12-map-benchmark.after-headed.json`
- Final variant sweep: `M3-12-map-benchmark.variant-*.json`

## Headed comparison (before vs after vs OpenFreeMap baseline)

| Scenario | Before (app, headed) | After (app, headed) | OpenFreeMap baseline (headed) |
|---|---:|---:|---:|
| Drag overview (2 s) | p50 33.4 ms / p95 59.1 ms; long tasks 29 (max 471 ms) | p50 31.3 ms / p95 31.3 ms; long tasks 0 | p50 62.5 ms / p95 93.8 ms; long tasks 323 |
| Drag Galilee (2 s) | p50 33.3 ms / p95 50.0 ms; long tasks 6 (max 187 ms) | p50 31.3 ms / p95 31.3 ms; long tasks 4 (max 265 ms) | p50 62.5 ms / p95 93.8 ms; long tasks 324 |
| Wheel zoom (6 in / 6 out) | p50 33.3 ms / p95 33.4 ms; long tasks 0 | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 62.5 ms / p95 62.6 ms; long tasks 49 |
| Trackpad-style pinch (Ctrl+wheel) | p50 33.3 ms / p95 33.4 ms; long tasks 0 | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 62.5 ms / p95 93.8 ms; long tasks 46 |
| Fly-to after selection | p50 16.7 ms / p95 33.4 ms; long tasks 1 (max 53 ms) | p50 31.2 ms / p95 31.3 ms; long tasks 1 (max 74 ms) | n/a (no place list in demo target) |

Interpretation: with a software renderer and 32 Hz stream ceiling, p95 can jump to ~62.5 ms when a frame is dropped, even after tuning. The stronger signal here is lower long-task counts in drag-heavy scenarios plus better consistency versus OpenFreeMap under the same renderer ceiling.

## SwiftShader-first default tuning

1. **Software renderer pixel ratio cap (default behavior):**  
   when software rendering is detected and no explicit DPR query is set, map pixel ratio is capped to 1 automatically.
   This is the largest practical default lever under SwiftShader (lower pixel count per frame).

2. **Style/frame-cost reductions:**  
   Liberty landcover merged to one class-match layer, moved to `minzoom: 5`; relief raster keeps `raster-fade-duration: 0`.

3. **Overlay/gesture work reductions:**  
   cluster bubbles simplified; cluster counts hidden below zoom 5; visible-entry refresh still deferred outside gesture hot-path.

4. **Tile/gesture tuning retained:**  
   preconnect links, cache knobs, short symbol fade, tuned wheel/trackpad/pinch rates, tuned drag inertia, and ~250 ms control zoom animation.

## Variant sweep (headed, software renderer)

| Variant | Drag overview p95 | Drag overview long tasks | SwiftShader takeaway |
|---|---:|---:|---|
| Default (software auto-DPR) | 31.4 ms | 7 | Baseline after software-aware default tuning |
| `?dpr=1` | 31.3 ms | 0 | Confirms low pixel ratio helps software rendering |
| `?dpr=2` | 62.5 ms | 1 | Forcing higher pixel ratio is measurably worse on this machine |
| `?relief=0` | 31.3 ms | 0 | Usually lowers drag cost by removing relief texture work |
| `?landcover=0` | 31.3 ms | 2 | Smaller gain than DPR/relief in this run |
| `?fade=0` | 31.4 ms | 4 | No clear win over short default fade |
| `?zoomrate=fast` | 31.3 ms | 0 | Mostly feel, not frame-cost |
| `?lite=1` | 31.3 ms | 1 | Mixed; can increase tile churn/idle on some runs |

## Lighthouse desktop (3 runs, median)

- Run scores (Perf / Accessibility / Best practices / SEO):
  - run 1: 91 / 95 / 96 / 82
  - run 2: 93 / 96 / 96 / 82
  - run 3: 93 / 96 / 96 / 82
- **Median:** Perf **93**, Accessibility **96**, Best practices **96**, SEO **82**
- Median LCP: **1.664 s**
- Median TBT: **0.5 ms**
- Median Speed Index: **1.331 s**

Note: on this Windows remote-desktop host, Lighthouse reports are written successfully but CLI exit can still fail at temp-folder cleanup with `EPERM`. Metrics above are from the generated JSON outputs before that cleanup failure.

## Recommendation for the human (software-rendered remote desktop)

1. Keep the new software-aware default (auto DPR cap to 1 under SwiftShader).
2. Compare by feel with `?relief=0` and `?dpr=1` (plus `?dpr=2` as a control).
3. Prefer the combo that feels best in Edge on this machine; on a GPU-backed local device, reevaluate because the ranking can change.
