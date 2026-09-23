# Licenses

License decisions for this project. Maintained by the Fact-Checker & Licensing agent. Every upstream source and its required attribution is listed in [ATTRIBUTION.md](../ATTRIBUTION.md). Decisions below were made in M1-03 (`docs/verification/M1.md`), independently re-verifying every source's license on its own site on 2026-09-23.

| Content | License | Status |
|---|---|---|
| Code | MIT ([LICENSE](../LICENSE)) | Decided |
| `data/geo/` (geometry extracted from AWMC and OpenStreetmap-derived sources: ancient roads/provinces/coastlines, and any modern boundary/geometry pulled directly from OSM) | **ODbL 1.0** — required because extracting this content into our own database makes it a "Derivative Database" under ODbL §4.4(b), which AWMC's and OSM's own ODbL terms require to stay ODbL (or a licensor-designated compatible license; none is designated, so plain ODbL 1.0 it is). | Decided |
| All other `data/` and `content/` (location records, scripture references, routes, timeline, narrative summaries, image metadata, image prompts) | **CC BY-SA 4.0** — the strictest license among the non-ODbL upstream sources we combine (DARE is CC BY-SA 3.0). CC BY-SA 3.0's own ShareAlike clause permits relicensing Adapted Material under "a later version of this License with the same License Elements" (confirmed in the CC BY-SA 3.0 legal code, §4(b)), so CC BY-SA 4.0 satisfies DARE. It is also a strict superset of the plainer CC BY 4.0/3.0 obligations from OpenBible.info, Pleiades, and the ORBIS dataset, and is compatible with folding in CC0 Wikidata content. | Decided |
| Bible text | World English Bible (WEB), Protestant-canon editions only (`engwebp`/`engwebpb`). Confirmed **public domain** on eBible.org's own pages; "World English Bible" is a **trademark** of eBible.org (not to be used to label a changed text). Public domain regardless of which JSON record the text sits inside — it is not covered by the project's CC BY-SA 4.0 data license. | Decided |
| Images | Hotlinked, never committed. Each image keeps its own upstream license (read per file from Wikimedia Commons). Accepted licenses listed below. | Decided |
| Map tiles (basemap) | Depends on the CP1 stack choice (`docs/research/STACK_OPTIONS.md`). All leading candidates (OpenFreeMap, self-hosted Protomaps PMTiles) trace back to OpenStreetMap data under ODbL 1.0, requiring an OSM attribution notice displayed via the map library's attribution control. Exact provider and wording finalized after CP1; see the placeholder row in `ATTRIBUTION.md`. | **Open (waits for CP1)** |

## Accepted image licenses
Per Media Curator brief rule #5 and Wikimedia Commons' own free-content policy (`commons.wikimedia.org/wiki/Commons:Licensing`, read 2026-09-23), the Media Curator may use:
- **Public domain** (PD-old, PD-US-gov, CC0, etc.)
- **CC BY** (any version)
- **CC BY-SA** (any version)

**Rejected:** any non-commercial-only license (CC BY-NC, CC BY-NC-SA, etc.), any No-Derivatives license (CC BY-ND, CC BY-NC-ND), fair use, "all rights reserved," or any grant that is not a clear, verifiable free license on the file's own Commons description page. This matches Commons' own upload policy, so any file actually hosted on Commons already meets this bar — the Media Curator's job is to read and record which of the two remaining bands (CC BY vs. CC BY-SA) applies per file, not to filter out non-free files (Commons does not host them).

**What the UI must show for share-alike (CC BY-SA) images:** for an unmodified, hotlinked image (no cropping/recoloring/compositing), CC BY-SA's Attribution condition (§3(a) of the CC BY-SA 4.0 legal code) applies, not the fuller ShareAlike condition (§3(b), which only triggers when we produce "Adapted Material"). The details panel must show, for every image: the creator's name, the exact license name (e.g. "CC BY-SA 4.0") linked to its legal text, an indication that the file is unmodified, and a link to the Commons source page. If any future feature crops, recolors, or otherwise adapts an image, that adaptation must additionally be offered under the same or a BY-SA-compatible license and carry its own ShareAlike notice — flagged here for the Frontend Engineer/Media Curator to revisit if that feature is ever built.

## WEB (Bible text) attribution wording
> Scripture quotations are from the **World English Bible (WEB)**, a public-domain translation of the Bible (66-book Protestant-canon edition, eBible.org). "World English Bible" is a trademark of eBible.org; this project is not produced, reviewed, or endorsed by eBible.org.

This wording is edition-agnostic and works for either `engwebp` (US spelling, "LORD"/"GOD") or `engwebpb` (British/international spelling, "LORD"/"GOD") — both are public domain with identical trademark status, confirmed on their own eBible.org pages (read 2026-09-23). The edition itself (US vs. British spelling) is the human's choice at CP1; see `docs/verification/M1.md` §2 Q4. The Classic editions (`eng-web`/`eng-webbe`, which use "Yahweh" and include the Apocrypha) remain out of scope per the brief's 66-book canon rule.

## Source compatibility
| Source | License (verified 2026-09-23) | Compatible with project? | Use |
|---|---|---|---|
| OpenBible.info Bible Geocoding | CC BY 4.0 (core); ODbL 1.0 (OSM-derived parts) | Yes | Primary place ID/candidates |
| Pleiades | CC BY 3.0 | Yes | Primary ancient ID/coordinate cross-check |
| Digital Atlas of the Roman Empire (DARE) | CC BY-SA 3.0 | Yes — drives the CC BY-SA 4.0 data-license choice above | Cross-check only |
| ORBIS (Stanford) — dataset | CC BY 3.0 | Yes | Routes tab (M5) travel-time/route cross-check |
| ORBIS (Stanford) — live web app | Unconfirmed; own tiles are CC BY-NC 3.0 (non-commercial) | **No** | Do not use; see do-not-use list |
| AWMC Geodata | ODbL 1.0 | Yes, kept in `data/geo/` | Primary ancient roads/provinces/coastlines (M4) |
| Wikidata | CC0 (statements); CC BY-SA 4.0 (prose, not used) | Yes | Cross-check / ID crosswalk |
| Wikimedia Commons | Varies per file (CC BY / CC BY-SA / PD only) | Yes, per accepted-license list above | Primary image source |
| Natural Earth | Public domain | Yes | Modern basemap coastlines/borders (subject to M1-02) |
| OpenStreetMap-based data | ODbL 1.0 (data); CC BY-SA 2.0 (docs) | Yes, kept in `data/geo/` or field-tagged | Modern basemap / cross-check only |
| eBible.org WEB (`engwebp`/`engwebpb`) | Public domain (name trademarked) | Yes | Primary and only Bible text |
| Wikipedia | CC BY-SA (unversioned) / GFDL | Cite-only; never copied per brief rule #6 | Background pointer only |
| Perseus Digital Library | **Unverified** — no reusable-content license found | **Not yet** | Do not quote; cite-only if ever confirmed |

## Do-not-use / not-yet list
- **ORBIS interactive web app** (`orbis.stanford.edu`) — figures, screenshots, or tiles read directly from the live app. Its own footer credits its background tiles to AWMC under **CC BY-NC 3.0** (non-commercial), and no other terms page could be found. Use only the CC BY 3.0 flat-file node/edge dataset.
- **Perseus Digital Library** texts — no content license was found on the pages checked (`/hopper/copyright` is 404; `/hopper/opensource` covers only the Hopper software, not the texts). Cite-only if ever independently confirmed; do not quote.
- **Wikipedia text** — cite as a pointer to primary/secondary sources only; never copy or closely paraphrase, per brief rule #6, even though CC BY-SA would technically permit reuse with attribution.
- **eBible.org Classic editions** (`eng-web`, `eng-webbe`) — include the Apocrypha/Deuterocanon and use "Yahweh"; excluded by the brief's 66-book Protestant canon rule. Only `engwebp`/`engwebpb` are in scope.
- **Any Wikimedia Commons file without a clear free-license tag** — Commons' own policy already excludes NC/fair-use/ND uploads, but the Media Curator must still read and record the specific license per file rather than assume one.
- **Copyrighted academic works** (journal articles, the Anchor Bible Dictionary, the print Barrington Atlas, etc.) — cite only, per brief rule #4/§2.6; never copied or paraphrased closely enough to be a derivative reproduction.

## CP1 decisions needing the human
1. **WEB edition:** `engwebp` (US spelling) vs. `engwebpb` (British/international spelling). Licensing is identical for both (public domain, same trademark status, both 66-book Protestant canon, both render God's name as "LORD"/"GOD"). Purely an editorial choice. **Recommendation:** `engwebp`, as the more common default for a US-hosted, English-first audience — but either is fully compliant.
2. **Basemap/tile provider** (M1-02's stack recommendation: OpenFreeMap, runner-up self-hosted Protomaps PMTiles). Both trace back to OpenStreetMap ODbL data and require the same OSM attribution notice; the exact wording and any additional provider-specific credit (e.g. "OpenMapTiles") depends on which is chosen. See the placeholder row in `ATTRIBUTION.md`.
