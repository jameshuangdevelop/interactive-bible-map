# M3-12 map benchmark (dragging + zooming)

All M3-12 benchmark artifacts were rerun after merging `data/m3-ancient-regions` (includes the false fallback-timeout fix from `ec046a0`).  
This rerun replaces earlier numbers that could accidentally include a fallback-style reload after ~10 s.

Environment notes for these runs:

- **Display ceiling:** ~32 Hz (headed runs quantize around ~31.3 ms/frame).
- **Window throttling rule:** headed runs call `page.bringToFront()` before each measured gesture; attempts with ~1 FPS throttle are discarded.
- **Renderer (all runs):** `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | WebKit WebGL | WebKit`.
- **Meaning:** this host is software-rendered (SwiftShader), so frame cost is CPU-bound here; a GPU-backed device should be faster.

Raw artifacts rerun:

- Baseline snapshots: `M3-12-map-benchmark.before.json`, `M3-12-map-benchmark.before-headed.json`
- Final snapshots: `M3-12-map-benchmark.after-headless.json`, `M3-12-map-benchmark.after-headed.json`
- Variant sweep: `M3-12-map-benchmark.variant-*.json`

## Main-style guard used in every app benchmark run

Each app scenario now records and enforces:

1. attribution contains **OpenFreeMap**,
2. fallback attribution/style needles are absent, and
3. **style-switch** `setStyle(...)` calls are zero.

Result: all rerun app scenarios passed this guard (`main attribution: yes`, `setStyle switches: 0`).

## Headed comparison (before vs after vs OpenFreeMap baseline)

| Scenario | Before (app, headed) | After (app, headed) | OpenFreeMap baseline (headed) |
|---|---:|---:|---:|
| Drag overview (2 s) | p50 31.3 ms / p95 62.5 ms; long tasks 12 (max 53 ms) | p50 31.3 ms / p95 62.5 ms; long tasks 9 (max 60 ms) | p50 62.5 ms / p95 93.7 ms; long tasks 325 (max 80 ms) |
| Drag Galilee (2 s) | p50 31.3 ms / p95 31.3 ms; long tasks 0 | p50 31.3 ms / p95 31.3 ms; long tasks 0 | p50 62.5 ms / p95 93.8 ms; long tasks 320 (max 84 ms) |
| Wheel zoom (6 in / 6 out) | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 62.5 ms / p95 93.7 ms; long tasks 42 (max 81 ms) |
| Trackpad-style pinch (Ctrl+wheel) | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 31.3 ms / p95 62.5 ms; long tasks 0 | p50 62.5 ms / p95 93.8 ms; long tasks 46 (max 78 ms) |
| Fly-to after selection | p50 31.3 ms / p95 62.6 ms; long tasks 8 (max 105 ms) | p50 31.3 ms / p95 31.3 ms; long tasks 1 (max 69 ms) | n/a |

Interpretation: on this software-rendered, 32 Hz remote desktop, dropped frames show as ~62.5 ms p95 steps. The stronger signal is long-task count and scenario consistency, not absolute p95 alone.

## Variant sweep (headed, software renderer)

| Variant | Drag overview p95 | Drag overview long tasks | Main-style guard |
|---|---:|---:|---|
| Default | 62.5 ms | 18 | pass |
| `?relief=0` | 31.3 ms | 0 | pass |
| `?landcover=0` | 62.5 ms | 19 | pass |
| `?fade=0` | 62.5 ms | 42 | pass |
| `?dpr=1` | 62.4 ms | 10 | pass |
| `?dpr=2` | 62.5 ms | 13 | pass |
| `?zoomrate=fast` | 62.5 ms | 73 | pass |
| `?lite=1` | 31.3 ms | 0 | pass |

## Recommendation for human feel-testing on this host

1. Start with current default (software-aware DPR cap behavior).
2. Compare `?relief=0` and `?lite=1` first (largest drag-overview gains in this rerun).
3. Use `?dpr=2` as a control when comparing DPR impact.
4. Re-test on a GPU-backed machine later; variant ranking can change with hardware acceleration.
