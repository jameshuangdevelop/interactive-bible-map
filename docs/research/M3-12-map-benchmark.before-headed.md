| Mode | Target | Scenario | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |
|---|---|---|---|---|---:|---:|---:|---:|---|
headed | Interactive Bible Map | 2s drag at overview | p50 33.4 ms · p95 59.1 ms · p99 66.7 ms · max 466.6 ms | count 29, max 471.0 ms | 0.1 | 16 | 1307.8 KiB | 551.3 | 
headed | Interactive Bible Map | 2s drag near Galilee | p50 33.3 ms · p95 50.0 ms · p99 66.7 ms · max 183.4 ms | count 6, max 187.0 ms | 0.1 | 9 | 205.6 KiB | 416.3 | 
headed | Interactive Bible Map | wheel zoom 6 steps in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 33.4 ms · max 33.4 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 426.1 | 
headed | Interactive Bible Map | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 50.0 ms · max 50.0 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 434.4 | 
headed | Interactive Bible Map | fly-to after selecting a place | p50 16.7 ms · p95 33.4 ms · p99 34.9 ms · max 50.0 ms | count 1, max 53.0 ms | 0.0 | 20 | 1410.0 KiB | 422.1 | 1 tile response(s) without content-length
headed | OpenFreeMap quick-start demo baseline | 2s drag at overview | p50 66.6 ms · p95 83.3 ms · p99 99.9 ms · max 116.7 ms | count 334, max 100.0 ms | 0.0 | 18 | 3632.2 KiB | 86.7 | 
headed | OpenFreeMap quick-start demo baseline | 2s drag near Galilee | p50 66.6 ms · p95 66.8 ms · p99 83.4 ms · max 83.4 ms | count 323, max 80.0 ms | 0.0 | 0 | 0.0 KiB | 97.1 | 
headed | OpenFreeMap quick-start demo baseline | wheel zoom 6 steps in + 6 out | p50 66.6 ms · p95 66.8 ms · p99 66.8 ms · max 83.3 ms | count 53, max 73.0 ms | 0.1 | 0 | 0.0 KiB | 93.4 | 
headed | OpenFreeMap quick-start demo baseline | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 50.1 ms · p95 83.2 ms · p99 83.3 ms · max 83.4 ms | count 41, max 75.0 ms | 0.0 | 0 | 0.0 KiB | 83.9 | 
