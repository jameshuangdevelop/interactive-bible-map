# ADR-0053 - Make room in the map's data before M6 grows it

- **Date:** 2026-11-06
- **Status:** Accepted
- **By:** the human, approving the M6 lead's capacity plan on 2026-11-06 ("both approved"). The PO proposed it in the M6 plan after the handoff (#101) asked for a measured plan, with no silent cap raises and no simplified sourced geometry.
- **Context** (measured with Node 24.21.0 on `main` at `6924180`; CI uses the same zlib):
  - **Ancient startup layer:** 327,882 / 330,000 bytes gzip, leaving 2,118.
    - Only the timeline, areas, roads, coastline, empire edge and the major places' pin coordinates feed this layer.
    - Ordinary place records don't: they go to `places.index.json` (7,166 bytes for 122 places, about 59 bytes each, uncapped) and lazy `places/<id>.json` files.
  - **Region outlines:** 19,209 / 25,000 bytes gzip (lazy), leaving 5,791. They hold 17 regions, each 255–5,062 bytes; the Holy Land's are 1.7–2.7 KB. Records for new regions such as the Decapolis or Idumea need sourced outlines (ADR-0050), so a handful would exceed the cap.
  - **Moving merged land to a lazy load:** the BACKLOG idea of loading `ancient.holder-unions.json` (13,682 bytes) together with the region outlines would make that load 32,891 bytes, over its cap.
  - **Repetition in the stop files:** the 15 timeline stop files repeat the same content. Their areas have 420 entries but 72 unique ones; their borders 594 features but 44 unique geometries; their labels 372 entries but 45 unique ones. The PO stored each unique entry once and had the stops refer to it. The stops fell from 142,785 to 18,603 bytes gzip, and the round trip was identical.
- **Decision:**
  1. **M6-02, lossless de-duplication:** the build writes one stop catalogue, `ancient.stop-catalogue.json`, and each stop lists indices into it. The app rebuilds each stop exactly as it is today.
     - No geometry, label or rule changes.
     - The 330,000-byte startup cap stays, and the catalogue counts toward it. Expected startup: about 203,700 bytes.
  2. **A cap on the place index:** `places.index.json` gets a cap of 30,000 bytes gzip, so expansion shows in CI. At about 59 bytes per place, 300 places are about 18 KB.
  3. **M6-03, after M6-02 merges:** one lazy outline file per region, fetched only when that region is selected, replaces the single 25,000-byte file. Each file gets an 8,000-byte cap; the largest today is Mesopotamia at 5,062. Batch 1B's region records wait for it.
  4. **Not done:** moving merged land to the lazy load, simplifying or trimming sourced geometry, and raising any cap.
  5. **Map-code order:** M6-02 and M6-03 change map code, so they run one at a time (ADR-0051 item 4). Data batches run alongside them.
- **Consequences:**
  - Startup regains about 124 KB of room, so later timeline, area and label work (for example the BACKLOG's per-year Roman frontier) no longer collides with the cap.
  - A region's outline costs one small request the first time that region is selected.
  - Point places never need capacity work. Region records wait for M6-03.
