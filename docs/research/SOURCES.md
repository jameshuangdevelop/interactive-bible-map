# Source inventory with licenses (M1-01)

## Summary

This inventory evaluates open datasets for biblical place identification, ancient
Roman-era geography, modern basemaps, the WEB Bible text, images, and citable
scholarly references, before any project data is written. All brief candidates
were reviewed, plus the WEB's own publisher. Licenses were read directly from
each source's own site. OpenBible.info and Pleiades are CC BY; DARE and
OpenStreetMap-derived AWMC data are share-alike (CC BY-SA 3.0 / ODbL 1.0);
ORBIS's dataset is CC BY 3.0 but its web app's own terms are unconfirmed;
Wikidata is CC0; Natural Earth is public domain; Wikimedia Commons needs a
per-file license read via its API. The WEB Bible (eBible.org) is public domain
though its name is trademarked; only its Protestant-canon-only editions
(`engwebp`/`engwebpb`) fit the brief's 66-book canon, and the choice between
them is left to the human at CP1. A ten-place spot-check across OpenBible.info,
Pleiades, DARE, and Wikidata found solid coverage of first-century cities,
including small Galilee villages once each source's own ancient-name form was
searched, and multiple recorded candidates for Bethsaida, Cana, and Emmaus,
consistent with their disputed status. Five licensing questions are raised for
the Fact-Checker, chiefly about share-alike propagation when combining sources
of different licenses into one dataset.

## Overview table

| Source | Supplies | License (own site, read 2026-09-23) | Attribution required | Share-alike / NC / ND | Stable ID prefix | Recommended use |
|---|---|---|---|---|---|---|
| OpenBible.info Bible Geocoding | Biblical place ID, candidate sites | CC BY 4.0 (site + GitHub repo) | Yes | None on core data; OSM-derived parts are ODbL (share-alike) | `openbible:` | Primary |
| Pleiades | Ancient place ID, coordinates | CC BY 3.0 | Yes | None | `pleiades:` | Primary (cross-check) |
| Digital Atlas of the Roman Empire (DARE) | Roman-era cities, coordinates | CC BY-SA 3.0 | Yes | Share-alike | `dare:` | Cross-check |
| ORBIS (Stanford) | Roman travel routes/times | Dataset: CC BY 3.0. Web app: unknown | Yes (dataset) | None found (dataset) | `orbis:` (tentative) | Cross-check, Routes tab only |
| AWMC Geodata | Roads, provinces, coastlines (ancient) | ODbL 1.0 | Yes | Share-alike | `awmc:` (tentative) | Primary for ancient layer (M4) |
| Wikidata | Cross-reference hub, QIDs | CC0 (statements); CC BY-SA 4.0 (prose) | No (CC0) | None (CC0) | `wikidata:` | Cross-check / ID crosswalk |
| Wikimedia Commons | Images | Varies per file (CC BY / CC BY-SA / PD only; no NC/fair-use) | Per file | Per file (many share-alike) | `commons:` | Primary for images |
| Natural Earth | Modern coastlines/borders | Public domain | No | None | `naturalearth:` (feature `ne_id`) | Primary for modern basemap (subject to M1-02) |
| OpenStreetMap-based data | Modern names/roads/borders | ODbL 1.0 (data); CC BY-SA 2.0 (docs) | Yes | Share-alike | `osm:` | Cross-check / basemap only |
| eBible.org (World English Bible) | Bible text | Public domain (name trademarked) | No (customary) | None | scripture ref (no ID needed) | Primary; Protestant-canon-only edition (`engwebp` or `engwebpb`), human picks at CP1 |
| Wikipedia | Background/cite-only | CC BY-SA 4.0 / GFDL | Yes | Share-alike | `wikipedia:` | Cite only, summarize in own words |
| Perseus Digital Library | Ancient primary texts, cite-only | Not fully verified (see below) | Unknown | Unknown | `perseus:` (CTS URN) | Cite only, license unverified |

## Sources

### 1. Biblical place identification and coordinates

#### OpenBible.info Bible Geocoding
- **URL / maintainer:** <https://www.openbible.info/geo/>; a single volunteer maintainer whose "About" section describes relevant undergraduate coursework and personal travel to biblical sites, but no professional credentials in biblical geography, and gives no name.
- **Coverage:** Catalogs every identifiable place in the Protestant Bible (Old and New Testament), with modern candidate identifications and a confidence score drawn from more than seventy modern scholarly sources, per the project's own count in its GitHub README. All 10 spot-check places were found, several with multiple recorded candidates.
- **Format / API:** Static HTML atlas and per-place pages; structured bulk data as JSON Lines (`ancient.jsonl`, `modern.jsonl`, `geometry.jsonl`, `image.jsonl`, `source.jsonl`) in the GitHub repo `openbibleinfo/Bible-Geocoding-Data`; also KML/KMZ and a thumbnail-image archive.
- **License:** CC BY 4.0 for the core dataset, per the "Can I Use These Files?" section of <https://www.openbible.info/geo/> and the repo's own README at <https://github.com/openbibleinfo/Bible-Geocoding-Data> (both read 2026-09-23). Some location data comes from OpenStreetMap and stays under OSM's ODbL license. Image licenses vary per photo.
- **Attribution:** Credit OpenBible.info.
- **Share-alike / NC / ND:** None on the core CC BY 4.0 data; the OSM-derived portion is ODbL (share-alike).
- **Stable ID:** The record's `url_slug`, e.g. `openbible:capernaum`.
- **Known quality issues:** A single-maintainer synthesis of secondary sources — the site's own FAQ disclaims any special scholarly qualifications, describing the effort instead as a matter of time invested — not a peer-reviewed institutional gazetteer; useful precisely because it aggregates and scores many other sources' opinions.
- **Recommended use:** Primary source for biblical place identification and for enumerating candidate sites at disputed locations.

#### Pleiades
- **URL / maintainer:** <https://pleiades.stoa.org/>; Institute for the Study of the Ancient World (ISAW), New York University, with support from the Ancient World Mapping Center (AWMC) and the Stoa Consortium (per <https://github.com/isawnyu/pleiades.datasets>, read 2026-09-23).
- **Coverage:** 41,480 place resources (release 4.1, 28 May 2025) across the ancient Mediterranean and Near East, drawn largely from the Barrington Atlas plus community contributions. All 10 spot-check places were found (two records each for Bethsaida and Cana), though small Galilee villages carry only a single-sentence "Barrington Atlas Directory notes" description rather than a narrative one.
- **Format / API:** Per-place web pages (HTML, with a JSON view); quarterly CSV/JSON/KML bulk exports at <https://atlantides.org/downloads/pleiades/>.
- **License:** CC BY 3.0 (per the GitHub dataset release README, read 2026-09-23); content also carries the individual contributors' own copyrights.
- **Attribution:** Credit Pleiades and its contributors.
- **Share-alike / NC / ND:** None stated.
- **Stable ID:** The numeric ID in the place URL, e.g. `pleiades:678231` for Capernaum.
- **Known quality issues:** The live `pleiades.stoa.org` site enforces an anti-bot proof-of-work challenge ("Anubis") that blocked automated fetches of individual place pages during this research; the CSV/JSON bulk downloads at `atlantides.org` were not blocked and are the reliable access path for future automated work.
- **Recommended use:** Primary source for a stable, widely-cited ancient-place ID and coordinate cross-check.

### 2. Ancient features: provinces, roads, coastlines

#### Digital Atlas of the Roman Empire (DARE)
- **URL / maintainer:** <http://imperium.ahlfeldt.se/> (also documented elsewhere as `dare.ht.lu.se`, which did not resolve — DNS lookup failed — during this research); Johan Åhlfeldt, Lund University.
- **Coverage:** Roman-era administrative and urban settlements empire-wide. The spot-check found all 10 places, including Jerusalem, Nazareth, Antioch (Syria), Ephesus, Corinth, Philippi, Capernaum (`dare:33337`), plus two disputed-site pairs (Bethsaida ×2; Cana ×2, with Kafr Kanna marked uncertain "Kana?" and Qana, Lebanon marked "certain"). Capernaum initially appeared absent because the ancient- and modern-name search fields use DARE's own toponyms — "Kefar Nahum/Kapharnaoum" (ancient) and "Tell Hum" (modern) — rather than the English name "Capernaum," which only appears in a linked Wikipedia tag; searching by the site's Latin/Greek or local name (or cross-referencing its linked Pleiades ID, 678231) finds it.
- **Format / API:** Interactive map plus a live GeoJSON API (`imperium.ahlfeldt.se/api/geojson.php`, parameters `bbox`/`point`/`id`/`ass` [ancient name]/`mss` [modern name]/`pleiades`), confirmed working during this research. Because `ass`/`mss` do plain substring matching against DARE's own toponym fields, a place should be looked up by its ancient/modern DARE name (or by a linked Pleiades/Wikidata ID) rather than by its common English name alone.
- **License:** CC BY-SA 3.0, per <https://imperium.ahlfeldt.se/print.php?doc=info_api> (read 2026-09-23) — share-alike: DARE's own terms require that any work built on its data be shared under the same or a comparably open license.
- **Attribution:** Link to `imperium.ahlfeldt.se` or the relevant DARE page.
- **Stable ID:** The numeric `id` property returned by the API, e.g. `dare:21094` for Antioch.
- **Known quality issues:** Some near-duplicate records exist for the same disputed site at different precisions (e.g. two Bethsaida records); the ancient/modern name fields store DARE's own toponyms, so English-name substring searches can produce false negatives (see Capernaum above).
- **Recommended use:** Cross-check for Roman-era city coordinates and as scholarly-source context for the ancient layer (M4). Its CC BY-SA share-alike term needs Fact-Checker sign-off before combining with CC BY sources in one dataset.

#### ORBIS (Stanford)
- **URL / maintainer:** <https://orbis.stanford.edu/> (interactive travel-time model); underlying dataset at the Stanford Digital Repository, <https://purl.stanford.edu/mn425tz9757>; Walter Scheidel, Elijah Meeks, Jonathan Weiland, and Scott Arcenas, Stanford University.
- **Coverage:** Models travel time and cost between Roman-era sites over roads, rivers, and sea lanes, with seasonal variation. It is not a general place gazetteer; its value here is reconstructing plausible travel times/routes for Paul's journeys (Routes tab, M5).
- **Format / API:** The live site is a JavaScript single-page app; this research's fetch tool could not render its content meaningfully (it returned an empty results shell rather than a rendered page). The underlying "ORBIS (v2) Network Edge and Node Tables" dataset is downloadable as flat tables from the Stanford Digital Repository.
- **License:** The downloadable dataset is CC BY 3.0, per the Digital Repository's own object metadata (`https://purl.stanford.edu/mn425tz9757.json`, read 2026-09-23: `"license":"https://creativecommons.org/licenses/by/3.0/legalcode"`). The interactive web app's own terms could not be confirmed on the pages this research could load; treat any figures read directly from the web app (rather than the CC BY 3.0 dataset) as **unknown license** until confirmed.
- **Attribution:** Cite as Meeks, Scheidel, Weiland & Arcenas (2014), per the dataset's own preferred-citation metadata.
- **Stable ID:** A numeric site `id` exists in the node table; the exact column name should be confirmed by the GIS Engineer when the table is opened for schema design.
- **Known quality issues:** Web app terms unverified (see above); recommend relying on the CC BY 3.0 flat-file dataset rather than reading figures off the interactive tool.
- **Recommended use:** Cross-check for travel-route plausibility and timing on the Routes tab (M5); not used for place coordinates or identification.

#### AWMC Geodata
- **URL / maintainer:** <https://github.com/AWMC/geodata> (data repo); <https://awmc.unc.edu/> (project site); Ancient World Mapping Center, UNC Chapel Hill (Ryan Horne and Gabe Moss, primary contributors, per the repo README).
- **Coverage:** Cultural layers (roads, aqueducts, regional names) and physical layers (coastlines, rivers) for the Greek and Roman world, derived from the Barrington Atlas and AWMC's own modifications to OpenStreetMap. This is line/polygon feature data, not a searchable named-place gazetteer, so it was not spot-checked per named place.
- **Format / API:** GeoJSON and ESRI Shapefile downloads on GitHub.
- **License:** ODbL 1.0, per the repo README (read 2026-09-23) — share-alike: derivative databases must stay under ODbL or a compatible license; attribution required.
- **Stable ID:** AWMC's own feature identifiers appear in the GeoJSON properties; the exact field name was not confirmed in this research and should be checked by the GIS Engineer during schema design.
- **Known quality issues:** Like DARE, ultimately traces back to the (copyrighted, print-only) Barrington Atlas as its scholarly source. The Atlas itself must never be consulted or copied directly — only through these open re-derivations.
- **Recommended use:** Primary source for the ancient-provinces/roads/coastlines layer (M4); not used for place identification or citation IDs.

### 3. Modern geography: names, coastlines, borders

#### Natural Earth
- **URL / maintainer:** <https://www.naturalearthdata.com/>; Tom Patterson and Nathaniel Vaughn Kelso, with contributors.
- **Coverage:** Modern-world basemap vector/raster data at three scales (1:10m, 1:50m, 1:110m): coastlines, countries, populated places, physical features. Not first-century-specific; it would supply the "Modern" toggle's coastline/border layer. Choice of exact scale/layer is the GIS Engineer's call (M1-02).
- **License:** Public domain, per <https://www.naturalearthdata.com/about/terms-of-use/> (read 2026-09-23) — the authors state that no permission or attribution is needed to use the data, though citing "Made with Natural Earth" is invited.
- **Stable ID:** Recent releases carry a feature-level `ne_id`; no biblical-place-specific IDs.
- **Known quality issues:** None found for licensing. Some upstream contributors (The Washington Post, EC JRC IES, XNR Productions) granted Natural Earth a non-exclusive license limited to building Natural Earth's own world base map — this does not restrict our reuse of the resulting public-domain product, but the Fact-Checker should be aware of it.
- **Recommended use:** Primary candidate for the modern basemap's coastlines/borders, subject to M1-02's tile/hosting decision; no share-alike concerns.

#### OpenStreetMap-based data
- **URL / maintainer:** <https://www.openstreetmap.org/>; OpenStreetMap Foundation (OSMF) and its contributor community.
- **Coverage:** Comprehensive modern place names, roads, buildings, and points of interest worldwide, including modern names for all ten spot-check cities. Its role here is basemap/modern-name support, per the brief, not primary biblical-place identification, so it was not independently re-verified per place in this task.
- **License:** ODbL 1.0 for the map data; CC BY-SA 2.0 for OSMF's own documentation, per <https://www.openstreetmap.org/copyright> (read 2026-09-23). Share-alike: derived databases must be distributed under ODbL or a compatible license; attribution to "OpenStreetMap and its contributors" is required, with different display rules depending on whether the data is shown as a browsable map, a static image, or in print.
- **Stable ID:** OSM element type + numeric ID, e.g. `osm:way/123456789`.
- **Known quality issues:** OSM IDs can be reassigned or deleted when features are edited or merged by the community, making them weaker long-term citation anchors than Pleiades or Wikidata IDs.
- **Recommended use:** Primary candidate for the modern-name/basemap layer (tile choice is M1-02's call); cross-check only for modern place names, not a primary biblical-identification or citation source.

### 4. WEB Bible text

#### eBible.org — World English Bible (WEB) editions
- **URL / maintainer:** <https://ebible.org/> ; eBible.org / Michael Paul Johnson.
- **Coverage:** eBible.org publishes several WEB editions that differ in how the Old Testament renders God's name, in US vs. British/international spelling, and in whether the Deuterocanon/Apocrypha is included. The brief fixes the canon to the 66-book Protestant Bible, so only Protestant-canon-only editions are in scope. The "Classic" edition (`eng-web`) and its British counterpart (`eng-webbe`) both include the Apocrypha/Deuterocanon per their own pages, so neither is used here.
- **Protestant-canon-only editions found (each verified on its own page, read 2026-09-23):**

  | eBible ID | Name | Divine name (OT) | Spelling | Canon | Machine-readable formats |
  |---|---|---|---|---|---|
  | `engwebp` | World English Bible Protestant Edition | "LORD"/"GOD" | US | 66 books only | HTML zip (`engwebp_html.zip`) and USFM zip (`engwebp_usfm.zip`), both confirmed downloadable at `ebible.org/Scriptures/` |
  | `engwebpb` | World English Bible British Edition (Protestant) | "LORD"/"GOD" | British/international | 66 books only | HTML and USFM zip (`engwebpb_usfm.zip`), confirmed downloadable at `ebible.org/Scriptures/` |

- **License:** Both editions are public domain, carrying no copyright, per their own pages (<https://ebible.org/find/details.php?id=engwebp> and `.../engwebpb`, both read 2026-09-23). "World English Bible" remains a trademark of eBible.org for both: a modified text may not be labeled with that name.
- **Attribution:** Not legally required (public domain), but because of the trademark, our app should not label any edited or excerpted text as "the World English Bible" if it diverges from the source text.
- **Stable ID:** Not needed — cite scripture directly by standard book:chapter:verse reference, which is already the project's citation convention.
- **Known quality issues:** None found.
- **Recommended use:** Primary and only Bible-text source, per brief §2.3 and hard rule #3. This inventory does not choose between `engwebp` and `engwebpb` — the US-vs-British spelling choice is the human's decision at CP1. The one firm recommendation is that whichever edition is chosen must be a Protestant-canon-only package (`engwebp` or `engwebpb`), not `eng-web`/`eng-webbe`, since the latter two include the Apocrypha/Deuterocanon and would break the brief's 66-book canon rule.

### 5. Images

#### Wikimedia Commons
- **URL / maintainer:** <https://commons.wikimedia.org/>; Wikimedia Foundation and its volunteer community.
- **Coverage:** Millions of freely licensed images, including many tagged to biblical/archaeological sites (OpenBible.info itself sources roughly 1,000 of its photos from Commons, per its own `/geo/` page).
- **Format / API:** The MediaWiki API endpoint `action=query&prop=imageinfo&iiprop=extmetadata` returns structured `License`, `LicenseShortName`, `Artist`, and `Credit` fields per file. Confirmed working during this research against a live Commons file (read 2026-09-23).
- **License:** No single site-wide license — Commons only accepts free licenses (public domain, CC BY, CC BY-SA, etc.) and explicitly rejects non-commercial-only and fair-use uploads, per <https://commons.wikimedia.org/wiki/Commons:Licensing> (read 2026-09-23). Each file's own license must be read individually via the API.
- **Attribution / share-alike / ND:** Varies per file — many files are CC BY-SA (share-alike) or CC BY (attribution only); the Media Curator must read and store each file's actual license rather than assume one.
- **Stable ID:** The Commons file title, e.g. `commons:File:Jerusalem-2013(2)-Aerial-Temple_Mount-(south_exposure).jpg`.
- **Known quality issues:** License metadata is reliable but must be fetched per file — there is no bulk "safe list." Share-alike files require the derived use (not just a caption credit) to carry the same license notice, which the Media Curator and Frontend Engineer need to handle in the details-panel UI.
- **Recommended use:** Primary image source, per hard rule #5 (hotlinked, 1–3 images per location, license and author stored in data and shown in the UI).

### 6. Historical and scholarly references

- **Wikidata** — <https://www.wikidata.org/>; Wikimedia Foundation and volunteer community. Coverage: a cross-reference hub whose items carry external-ID properties linking to Pleiades and other gazetteers; the spot-check found a QID for all 10 places (one candidate each for disputed sites; not exhaustively searched for every possible candidate). License: CC0 for all structured statement data, CC BY-SA 4.0 for prose in other namespaces, per <https://www.wikidata.org/wiki/Wikidata:Licensing> (read 2026-09-23). Stable ID: `wikidata:Q<number>`. Known quality issue: statements are crowd-sourced and can lack a citation on the individual claim, so this is a cross-check/crosswalk source, not a primary source of fact. Recommended use: cross-check and ID crosswalk.
- **Wikipedia** — CC BY-SA 4.0 / GFDL, per <https://en.wikipedia.org/wiki/Wikipedia:Copyrights> (read 2026-09-23). Open access; useful as a pointer to primary/secondary sources. Per the brief's hard rule, we summarize in our own words and cite — we do not copy Wikipedia's text verbatim, even though its license would permit reuse with attribution.
- **Perseus Digital Library** (Tufts University), <https://www.perseus.tufts.edu/>: open-access hosting of ancient Greek/Latin texts (e.g. Josephus, Strabo) and older public-domain translations, useful for citing primary ancient sources by their canonical citation (e.g. `perseus:` + a CTS URN such as `urn:cts:greekLit:tlg0526`). A page-specific reusable-content license statement was **not found** on the pages read during this research (the plausible URL `perseus.tufts.edu/hopper/copyright` returned 404); mark as **unknown, not fully verified** and confirm per-text with the Fact-Checker before quoting even short passages.
- **Copyrighted academic works** (journal articles, print commentaries, encyclopedias such as the Anchor Bible Dictionary): cited only, per hard rule #4 and brief §2.6 — never copied or paraphrased closely enough to constitute a derivative reproduction.

## Spot-check: coverage of 10 places

IDs only; no coordinates recorded (coordinates come in M2). "Candidates" counts the modern-site identifications a source records for that place, which is how each source expresses a disputed location.

| Place | OpenBible.info | Pleiades | DARE | Wikidata | Candidates found |
|---|---|---|---|---|---|
| Jerusalem | `openbible:jerusalem` | `pleiades:687928` | `dare:15896` | `wikidata:Q1218` | 1 (undisputed) |
| Capernaum | `openbible:capernaum` | `pleiades:678231` | `dare:33337` (found by searching DARE's own ancient toponym "Kapharnaoum"/modern "Tell Hum"; the English name "Capernaum" alone returns no result) | `wikidata:Q59174` | 2 in OpenBible.info (Tell Hum; Khirbet Minyeh) — Tell Hum is the near-consensus site |
| Bethsaida | `openbible:bethsaida-1` + `openbible:bethsaida-2` | `pleiades:678065` | `dare:21665` + `dare:33272` | `wikidata:Q501773` | 4 in OpenBible.info (et-Tell, el-'Araj, el-Mes'adiye, Tabgha); DARE and Pleiades each record et-Tell/el-'Araj as one candidate. Genuinely disputed. |
| Cana | `openbible:cana` | `pleiades:678220` (Kafr Kanna, ISR, marked "less-certain") + `pleiades:678219` (Qana, Lebanon, marked "certain") | `dare:43765` (Kafr Kanna, marked uncertain "Kana?") + `dare:43764` (Qana, Lebanon) | `wikidata:Q2633158` (Kafr Kanna candidate) | 3 in OpenBible.info (Horbat Qana, Kefr Kenna, Ain Qana); sources disagree on which site is "certain." Genuinely disputed. |
| Emmaus | `openbible:emmaus` | `pleiades:687891` (Emmaus/Nicopolis = Imwas only) | `dare:21656` (Emmaus/Nicopolis = Imwas only) | `wikidata:Q165887` | 6 in OpenBible.info (Qalunya, Emmaus Nicopolis, El Qubeibeh, Artas, Khirbet Khamasa, Abu Ghosh); Pleiades and DARE model only the Nicopolis/Imwas candidate as a record. Genuinely disputed. |
| Nazareth | `openbible:nazareth` | `pleiades:678299` | `dare:22899` | `wikidata:Q430776` | 1 (undisputed) |
| Antioch (Syria) | `openbible:antioch-1` (OpenBible.info also has a separate `antioch-2` for Antioch in Pisidia — a different biblical place, Acts 13:14) | `pleiades:658381` | `dare:21094` | `wikidata:Q200441` | 1 (undisputed as a location; note the two distinct biblical Antiochs) |
| Ephesus | `openbible:ephesus` | `pleiades:599612` | `dare:21155` | `wikidata:Q47611` | 1 (undisputed) |
| Corinth | `openbible:corinth` | `pleiades:570182` | `dare:17070` | `wikidata:Q1363688` | 1 (undisputed) |
| Philippi | `openbible:philippi` | `pleiades:501564` | `dare:21892` | `wikidata:Q379652` | 1 (undisputed) |

## Citation prefixes

| Prefix | Refers to | Example |
|---|---|---|
| `openbible:` | OpenBible.info Bible Geocoding `url_slug` | `openbible:capernaum` |
| `pleiades:` | Pleiades numeric place ID | `pleiades:678231` |
| `dare:` | DARE (Digital Atlas of the Roman Empire) numeric ID | `dare:21094` |
| `wikidata:` | Wikidata QID | `wikidata:Q1218` |
| `osm:` | OpenStreetMap element type + ID | `osm:way/123456789` |
| `naturalearth:` | Natural Earth feature `ne_id` | `naturalearth:1159152091` |
| `commons:` | Wikimedia Commons file title | `commons:File:Example.jpg` |
| `orbis:` | ORBIS (v2) node/edge table site ID (tentative — exact field TBD) | `orbis:<id>` |
| `awmc:` | AWMC GeoJSON feature ID (tentative — exact field TBD) | `awmc:<id>` |
| `wikipedia:` | Wikipedia article title, cite-only | `wikipedia:Capernaum` |
| `perseus:` | Perseus Digital Library CTS URN, cite-only, license unverified | `perseus:urn:cts:greekLit:tlg0526` |

## Open questions for the Fact-Checker (M1-03)

1. Our candidate sources mix CC BY (OpenBible.info, Pleiades, ORBIS dataset), CC BY-SA/ODbL share-alike (DARE, AWMC, OpenStreetMap), and CC0 (Wikidata) content. Does combining them into our own `data/*.json` require the whole data release to carry a share-alike license (e.g. CC BY-SA 4.0), and should that be recorded as the project's data license in `docs/LICENSES.md`?
2. ORBIS's downloadable node/edge dataset is CC BY 3.0, but this research could not confirm the interactive `orbis.stanford.edu` web app's own terms (the page did not render outside its JavaScript app). If we ever cite a travel-time figure read directly from the web app rather than the flat-file dataset, what license applies?
3. OpenStreetMap's ODbL is share-alike for derived databases but not for simply displaying tiles with attribution. If we extract specific modern facts (e.g., a modern place name or boundary) from OSM into our own `data/*.json` records, does that trigger share-alike on those records, and if so, how should that be scoped/labeled?
4. "World English Bible" is a trademark of eBible.org. What attribution wording should the app show so we quote WEB text without implying eBible.org endorses our project?
5. Pleiades' live site currently blocks automated page fetches with an anti-bot challenge ("Anubis"), while its quarterly CSV/JSON bulk downloads at `atlantides.org` are unaffected. Is relying on the periodic bulk downloads (rather than the live site) an acceptable long-term citation-verification method for later milestones?
