| Mode | Target | Scenario | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |
|---|---|---|---|---|---:|---:|---:|---:|---|
headless | Interactive Bible Map | 2s drag at overview | p50 33.2 ms · p95 50.0 ms · p99 66.6 ms · max 216.7 ms | count 20, max 214.0 ms | 0.0 | 11 | 345.1 KiB | 412.9 | 
headless | Interactive Bible Map | 2s drag near Galilee | p50 16.7 ms · p95 33.4 ms · p99 33.5 ms · max 266.6 ms | count 3, max 267.0 ms | 688.4 | 9 | 205.6 KiB | 415.9 | 
headless | Interactive Bible Map | wheel zoom 6 steps in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 50.1 ms · max 50.1 ms | count 0, max n/a ms | 0.0 | 0 | 0.0 KiB | 410.9 | 
headless | Interactive Bible Map | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 50.0 ms · max 50.0 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 412.0 | 
headless | Interactive Bible Map | fly-to after selecting a place | p50 16.7 ms · p95 50.0 ms · p99 83.4 ms · max 116.7 ms | count 6, max 93.0 ms | 1768.7 | 48 | 4174.2 KiB | 408.2 | 1 tile response(s) without content-length
headless | OpenFreeMap quick-start demo baseline | 2s drag at overview | p50 66.6 ms · p95 66.8 ms · p99 83.4 ms · max 116.6 ms | count 348, max 98.0 ms | 1947.0 | 19 | 4191.1 KiB | 82.3 | 
headless | OpenFreeMap quick-start demo baseline | 2s drag near Galilee | p50 66.6 ms · p95 66.8 ms · p99 83.4 ms · max 83.4 ms | count 321, max 85.0 ms | 0.0 | 0 | 0.0 KiB | 77.9 | 
headless | OpenFreeMap quick-start demo baseline | wheel zoom 6 steps in + 6 out | p50 50.0 ms · p95 66.7 ms · p99 66.7 ms · max 83.3 ms | count 30, max 67.0 ms | 0.0 | 9 | 962.6 KiB | 75.5 | 
headless | OpenFreeMap quick-start demo baseline | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 66.6 ms · p95 83.3 ms · p99 116.7 ms · max 133.3 ms | count 44, max 124.0 ms | 0.1 | 0 | 0.0 KiB | 79.3 | 
