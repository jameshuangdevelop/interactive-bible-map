# M3-12 map benchmark (dragging + zooming)

This report is the post-merge rerun after merging `main` (`13d4bb1`, includes #21, #22, #23 and the false-fallback timeout fix).

## Environment and measurement notes

- **Host renderer:** `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | WebKit WebGL | WebKit`
- **Display path:** remote desktop at ~32 Hz (headed frame intervals quantize around ~31.3 ms and dropped frames appear as ~62.5+ ms)
- **Headed anti-throttle step:** `page.bringToFront()` before measured gestures
- **Main-style guard (every app scenario):**
  1. attribution contains `OpenFreeMap`,
  2. fallback attribution/style needles are absent,
  3. style-switch `setStyle(...)` calls are zero.
- **Guard result:** pass on all checks during the 3-run variant sweep (**120/120 scenario checks**).

## Committed benchmark artifacts

- Consolidated report: `docs/research/M3-12-map-benchmark.md`
- Compact machine-readable summary: `docs/research/M3-12-map-benchmark.final.json`

Per-variant and before/after raw run artifacts were used for measurement, then summarized here.

## Headed comparison (single rerun snapshot)

| Scenario | Before (app) | After (app) | OpenFreeMap baseline |
|---|---:|---:|---:|
| Drag overview (2 s) | p50 31.3 / p95 62.5 ms; long 27 (max 62 ms) | p50 31.3 / p95 62.6 ms; long 63 (max 78 ms) | p50 62.5 / p95 93.8 ms; long 319 (max 81 ms) |
| Drag Galilee (2 s) | p50 31.3 / p95 31.3 ms; long 0 | p50 31.2 / p95 31.3 ms; long 0 | p50 62.5 / p95 93.8 ms; long 320 (max 82 ms) |
| Wheel zoom (6 in / 6 out) | p50 31.3 / p95 62.5 ms; long 0 | p50 31.3 / p95 62.5 ms; long 0 | p50 62.5 / p95 93.7 ms; long 48 (max 78 ms) |
| Trackpad-style pinch (Ctrl+wheel) | p50 31.3 / p95 62.5 ms; long 0 | p50 31.3 / p95 62.5 ms; long 0 | p50 62.5 / p95 93.7 ms; long 46 (max 75 ms) |
| Fly-to after selection | p50 31.3 / p95 62.6 ms; long 8 (max 128 ms) | p50 31.3 / p95 62.6 ms; long 8 (max 124 ms) | n/a |

On this software-rendered remote host, run-to-run variance is high; for decisions, the 3-run variant medians/ranges are the stronger signal.

## Variant sweep (3 runs each, headed app)

Metric below is **drag overview (2 s)**.

| Variant | p95 median (range) | Long-task count median (range) | Main-style guard |
|---|---:|---:|---|
| Default | 50.0 ms (50.0–50.0) | 2 (0–2) | pass |
| `?relief=0` | 33.4 ms (33.4–33.4) | 0 (0–0) | pass |
| `?landcover=0` | 50.0 ms (50.0–50.0) | 2 (1–2) | pass |
| `?fade=0` | 50.0 ms (50.0–50.0) | 0 (0–1) | pass |
| `?dpr=1` | 46.8 ms (46.3–49.9) | 1 (0–4) | pass |
| `?dpr=2` | 47.6 ms (46.5–50.0) | 2 (0–3) | pass |
| `?zoomrate=fast` | 46.7 ms (46.0–48.5) | 1 (0–1) | pass |
| `?lite=1` | 38.9 ms (36.4–39.5) | 0 (0–0) | pass |

## Recommendation for human feel-testing on this host

1. **Try first:** `?relief=0` (best and most repeatable drag-overview improvement).
2. **Then compare:** `?lite=1` (second-best p95 with repeatable zero long tasks).
3. **DPR check:** compare `?dpr=1` vs `?dpr=2` directly (`dpr=1` had better long-task median/range here).
4. `?zoomrate=fast` is mainly interaction feel; use it after picking visual/perf toggles.
5. Re-test on a GPU-backed local machine; ranking can change materially with hardware acceleration.
