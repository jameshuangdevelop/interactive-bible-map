| Mode | Target | Scenario | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |
|---|---|---|---|---|---:|---:|---:|---:|---|
headed | Interactive Bible Map | 2s drag at overview | p50 16.8 ms · p95 33.4 ms · p99 50.0 ms · max 183.3 ms | count 5, max 179.0 ms | 0.0 | 16 | 1307.8 KiB | 574.6 | 
headed | Interactive Bible Map | 2s drag near Galilee | p50 33.2 ms · p95 33.4 ms · p99 79.2 ms · max 183.3 ms | count 5, max 179.0 ms | 0.1 | 9 | 205.6 KiB | 426.5 | 
headed | Interactive Bible Map | wheel zoom 6 steps in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 49.9 ms · max 50.0 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 416.0 | 
headed | Interactive Bible Map | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 33.3 ms · p95 33.4 ms · p99 50.0 ms · max 50.0 ms | count 0, max n/a ms | 0.0 | 0 | 0.0 KiB | 424.0 | 
headed | Interactive Bible Map | fly-to after selecting a place | p50 16.7 ms · p95 33.2 ms · p99 47.2 ms · max 50.0 ms | count 1, max 65.0 ms | 0.0 | 13 | 712.2 KiB | 420.0 | 1 tile response(s) without content-length
