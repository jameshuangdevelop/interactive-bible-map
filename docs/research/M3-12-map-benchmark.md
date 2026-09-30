# M3-12 map benchmark (dragging + zooming)

Final rerun after review fixes (`dcf57e5` base), including:

- merged-landcover overview visibility restored,
- unmeasured cluster tuning reverted (radius/stroke/clusterRadius),
- software-renderer default now auto-disables relief (`?relief=1` forces old look back on).

## Environment and guardrails

- **WebGL renderer:** `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | WebKit WebGL | WebKit`
- **Renderer class:** software (`SwiftShader`), so this host is CPU-rendered (no GPU acceleration). A GPU-backed device should be materially faster.
- **Display path:** remote desktop at about 32 Hz.
- **Mode:** headed, with `page.bringToFront()` before measured gestures.
- **Main-style guard (all runs):** attribution includes `OpenFreeMap`, no fallback signals, and zero style-switch `setStyle(...)` calls.
- **Guard result:** pass (**45/45 scenario checks**) in this final rerun.

## Historical benchmark context (pre-follow-up comparison)

This card already captured before/after + OpenFreeMap baseline in the post-merge sweep; those numbers are retained here for context.

| Scenario | Before (app) | After (app) | OpenFreeMap baseline |
|---|---:|---:|---:|
| Drag overview (2 s) | p50 31.3 / p95 62.5 ms; long 27 (max 62 ms) | p50 31.3 / p95 62.6 ms; long 63 (max 78 ms) | p50 62.5 / p95 93.8 ms; long 319 (max 81 ms) |
| Drag Galilee (2 s) | p50 31.3 / p95 31.3 ms; long 0 | p50 31.2 / p95 31.3 ms; long 0 | p50 62.5 / p95 93.8 ms; long 320 (max 82 ms) |
| Wheel zoom (6 in / 6 out) | p50 31.3 / p95 62.5 ms; long 0 | p50 31.3 / p95 62.5 ms; long 0 | p50 62.5 / p95 93.7 ms; long 48 (max 78 ms) |
| Trackpad-style pinch (Ctrl+wheel) | p50 31.3 / p95 62.5 ms; long 0 | p50 31.3 / p95 62.5 ms; long 0 | p50 62.5 / p95 93.7 ms; long 46 (max 75 ms) |
| Fly-to after selection | p50 31.3 / p95 62.6 ms; long 8 (max 128 ms) | p50 31.3 / p95 62.6 ms; long 8 (max 124 ms) | n/a |

## Final rerun requested by PO (3 runs each, headed, drag overview)

Metric: **drag overview (2 s)**.

| Variant | p95 median (range) | Long-task count median (range) | Long-task max median (range) |
|---|---:|---:|---:|
| Default (software auto relief off) | 33.4 ms (33.4–33.4) | 0 (0–0) | 0 ms (0–0) |
| `?relief=1` (old look) | 33.4 ms (33.4–49.9) | 0 (0–0) | 0 ms (0–0) |
| `?lite=1` | 33.4 ms (33.4–33.4) | 0 (0–0) | 0 ms (0–0) |

## What this means on SwiftShader

- With software-renderer auto-relief-off enabled by default, **default** and **lite** are effectively identical on this drag metric.
- In this final rerun, forcing relief back on (`?relief=1`) did not increase median long-task counts, but it did show a worse p95 range (one 49.9 ms outlier).
- Combined with earlier sweeps, this keeps relief-off as the safer default on this SwiftShader host, while the PO still asks for human feel confirmation in Edge.

## Notes on `prefetchZoomDelta` and `cancelPendingTileRequestsWhileZooming`

- **`prefetchZoomDelta`:** not available in MapLibre GL JS 6.10 map options (`maplibre-gl.d.ts` has no `prefetchZoomDelta` field), so no production change was shipped for it.
- **`cancelPendingTileRequestsWhileZooming`:** tested during M3-12 tuning; enabling it did not produce a repeatable smoothness win on this software-rendered host and increased tile churn during fast zoom interactions, so the shipped default remains `false`.

## Committed benchmark artifacts

- `docs/research/M3-12-map-benchmark.md` (this report)
- `docs/research/M3-12-map-benchmark.final.json` (compact machine-readable summary of the final rerun)
