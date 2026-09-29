| Mode | Target | Scenario | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |
|---|---|---|---|---|---:|---:|---:|---:|---|
headless | Interactive Bible Map | 2s drag at overview | p50 49.9 ms · p95 50.1 ms · p99 66.7 ms · max 466.6 ms | count 24, max 470.0 ms | 0.0 | 11 | 345.1 KiB | 434.1 | 
headless | Interactive Bible Map | 2s drag near Galilee | p50 33.3 ms · p95 50.1 ms · p99 66.7 ms · max 350.0 ms | count 35, max 347.0 ms | 0.0 | 9 | 205.6 KiB | 423.4 | 
headless | Interactive Bible Map | wheel zoom 6 steps in + 6 out | p50 33.3 ms · p95 50.0 ms · p99 50.1 ms · max 66.7 ms | count 2, max 68.0 ms | 0.0 | 0 | 0.0 KiB | 415.8 | 
headless | Interactive Bible Map | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 33.3 ms · p95 50.0 ms · p99 50.1 ms · max 50.1 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 422.9 | 
headless | Interactive Bible Map | fly-to after selecting a place | p50 16.7 ms · p95 50.1 ms · p99 100.0 ms · max 116.7 ms | count 9, max 116.0 ms | 2071.3 | 49 | 4531.4 KiB | 424.3 | 1 tile response(s) without content-length
headless | OpenFreeMap quick-start demo baseline | 2s drag at overview | p50 66.6 ms · p95 66.7 ms · p99 83.4 ms · max 283.4 ms | count 332, max 214.0 ms | 0.1 | 18 | 3632.2 KiB | 116.7 | 
headless | OpenFreeMap quick-start demo baseline | 2s drag near Galilee | p50 66.7 ms · p95 83.4 ms · p99 83.4 ms · max 83.4 ms | count 324, max 87.0 ms | 0.0 | 0 | 0.0 KiB | 83.7 | 
headless | OpenFreeMap quick-start demo baseline | wheel zoom 6 steps in + 6 out | p50 66.6 ms · p95 83.3 ms · p99 83.3 ms · max 83.4 ms | count 52, max 77.0 ms | 0.0 | 0 | 0.0 KiB | 75.0 | 
headless | OpenFreeMap quick-start demo baseline | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 66.7 ms · p95 66.7 ms · p99 83.3 ms · max 83.3 ms | count 46, max 76.0 ms | 0.0 | 0 | 0.0 KiB | 77.0 | 
