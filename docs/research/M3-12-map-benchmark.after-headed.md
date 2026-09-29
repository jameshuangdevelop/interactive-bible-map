| Mode | Target | Scenario | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |
|---|---|---|---|---|---:|---:|---:|---:|---|
headed | Interactive Bible Map | 2s drag at overview | p50 31.3 ms · p95 31.3 ms · p99 31.4 ms · max 62.5 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 456.3 | 
headed | Interactive Bible Map | 2s drag near Galilee | p50 31.2 ms · p95 31.3 ms · p99 31.4 ms · max 375.0 ms | count 3, max 362.0 ms | 0.1 | 9 | 205.6 KiB | 429.0 | 
headed | Interactive Bible Map | wheel zoom 6 steps in + 6 out | p50 31.3 ms · p95 62.5 ms · p99 62.6 ms · max 62.6 ms | count 0, max n/a ms | 0.1 | 8 | 849.7 KiB | 428.8 | 
headed | Interactive Bible Map | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 31.3 ms · p95 62.5 ms · p99 62.6 ms · max 62.6 ms | count 0, max n/a ms | 0.1 | 0 | 0.0 KiB | 424.7 | 
headed | Interactive Bible Map | fly-to after selecting a place | p50 31.3 ms · p95 62.5 ms · p99 93.8 ms · max 125.0 ms | count 6, max 136.0 ms | 2122.9 | 56 | 5408.0 KiB | 413.1 | 1 tile response(s) without content-length
headed | OpenFreeMap quick-start demo baseline | 2s drag at overview | p50 62.5 ms · p95 62.6 ms · p99 93.8 ms · max 125.0 ms | count 256, max 70.0 ms | 0.0 | 7 | 1679.7 KiB | 88.4 | 
headed | OpenFreeMap quick-start demo baseline | 2s drag near Galilee | p50 62.5 ms · p95 93.8 ms · p99 93.8 ms · max 93.9 ms | count 319, max 81.0 ms | 0.1 | 0 | 0.0 KiB | 88.0 | 
headed | OpenFreeMap quick-start demo baseline | wheel zoom 6 steps in + 6 out | p50 62.5 ms · p95 93.7 ms · p99 93.8 ms · max 93.8 ms | count 46, max 77.0 ms | 0.2 | 9 | 962.6 KiB | 91.3 | 
headed | OpenFreeMap quick-start demo baseline | trackpad-style pinch (Ctrl+wheel) 6 in + 6 out | p50 62.5 ms · p95 62.6 ms · p99 93.8 ms · max 93.8 ms | count 46, max 73.0 ms | 0.0 | 0 | 0.0 KiB | 91.6 | 
