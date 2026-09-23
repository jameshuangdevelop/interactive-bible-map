# Attribution

Every upstream source, dataset and image collection the project uses, with its license and the attribution it requires. Maintained by the Fact-Checker & Licensing agent. Individual images carry their own author, license and source in `data/media/`, and the app shows them. License decisions and compatibility reasoning are in [docs/LICENSES.md](docs/LICENSES.md); verification evidence is in [docs/verification/M1.md](docs/verification/M1.md).

## Code
Interactive Bible Map code is released under the MIT License. See [LICENSE](LICENSE).

## Upstream sources
| Source | Used for | License | Required attribution | Link | Added in |
|---|---|---|---|---|---|
| OpenBible.info Bible Geocoding | Biblical place identification, candidate sites, and non-OSM coordinate sources only (OSM-tagged `coordinates_source`/`secondary_sources`/`precise_geometry_id` fields are not used — see `docs/LICENSES.md`) | CC BY 4.0 | "Place data from OpenBible.info Bible Geocoding, CC BY 4.0." | <https://www.openbible.info/geo/> | M1-03 |
| Pleiades | Ancient place IDs and coordinates | CC BY 3.0 | "Ancient place data from Pleiades (pleiades.stoa.org), CC BY 3.0." | <https://pleiades.stoa.org/> | M1-03 |
| Digital Atlas of the Roman Empire (DARE) | Roman-era city cross-check (M2), ancient-layer context (M4) | CC BY-SA 3.0 | "Cross-checked against the Digital Atlas of the Roman Empire (imperium.ahlfeldt.se), CC BY-SA 3.0." | <http://imperium.ahlfeldt.se/> | M1-03 |
| ORBIS (Stanford) — node/edge dataset | Travel-time/route plausibility, Routes tab (M5) only | CC BY 3.0 | "Route data derived from ORBIS (Meeks, Scheidel, Weiland & Arcenas, 2014), CC BY 3.0." | <https://purl.stanford.edu/mn425tz9757> | M1-03 |
| AWMC Geodata | Ancient roads, provinces, coastlines (M4) | ODbL 1.0 | "Contains information from AWMC Geodata (awmc.unc.edu), made available under the Open Database License (ODbL)." | <https://github.com/AWMC/geodata> | M1-03 |
| Wikidata | Cross-reference / ID crosswalk | CC0 1.0 | None required; credited as a courtesy: "Cross-referenced via Wikidata." | <https://www.wikidata.org/> | M1-03 |
| Wikimedia Commons | Location images (1–3 per location, hotlinked) | Varies per file — project accepts only public domain, CC BY, or CC BY-SA (see `docs/LICENSES.md`) | Per file: author, exact license (linked), and a link to the Commons file page, shown in the details panel. | <https://commons.wikimedia.org/> | M1-03 |
| Natural Earth | Modern basemap coastlines/borders (subject to M1-02) | Public domain | None required; credited as a courtesy: "Made with Natural Earth." | <https://www.naturalearthdata.com/> | M1-03 |
| OpenStreetMap and its contributors | Modern names/roads cross-check; any modern boundary/geometry extracted into `data/geo/` | ODbL 1.0 (data); CC BY-SA 2.0 (docs) | "© OpenStreetMap contributors, available under the Open Database License (ODbL)." | <https://www.openstreetmap.org/copyright> | M1-03 |
| eBible.org — World English Bible (`engwebp`/`engwebpb`) | Bible text (scripture quotations) | Public domain ("World English Bible" is a trademark of eBible.org) | "Scripture quotations are from the World English Bible (WEB), a public-domain translation of the Bible (66-book Protestant-canon edition, eBible.org). 'World English Bible' is a trademark of eBible.org; this project is not produced, reviewed, or endorsed by eBible.org." | <https://ebible.org/web/> | M1-03 |
| Wikipedia | Background/cite-only pointer (never copied) | CC BY-SA / GFDL | Not reused verbatim, so no display attribution is required; cited only as a source pointer in `sources[]`. | <https://en.wikipedia.org/wiki/Wikipedia:Copyrights> | M1-03 |
| Map tiles / basemap provider | Modern basemap rendering | **Open — waits for the CP1 stack choice** (leading candidates: OpenFreeMap, self-hosted Protomaps PMTiles; both trace to OpenStreetMap ODbL data) | Placeholder: an OSM ODbL attribution line ("© OpenStreetMap contributors"), shown via the map library's built-in attribution control, plus any provider-specific credit (e.g. OpenMapTiles) required by the chosen option. Finalize after CP1. | See `docs/research/STACK_OPTIONS.md` | M1-03 (placeholder) |
