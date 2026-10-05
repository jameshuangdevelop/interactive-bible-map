# Visual spec — MVP app (M3, low fidelity)

This spec describes how the MVP map app looks and behaves. It is low fidelity on purpose: it fixes layout, content order, interaction and accessibility, and leaves exact pixels to the build. The wireframes are in [wireframes/](wireframes/). The Frontend Engineer builds against this document (tasks M3-02 to M3-06), and the PO updates it when a decision changes.

**Model:** Google Maps on desktop: a full-screen map, a floating search box, and a place panel on the left. The basemap is colourful and familiar, like Google Maps (OpenFreeMap Liberty, chosen at CP3a; ADR-0022). The biblical places stay clearly visible on it, and the tone of the text stays calm and scholarly.

## 1. Layout

### Desktop (width 1024 px and up)
| Area | Contents | Built in |
|---|---|---|
| Whole screen | The map | M3 |
| Top left, floating | Search box (about 400 × 48 px, pill-shaped) with a menu button on its left | M3 |
| Left side, full height | Place panel (about 408 px wide). It opens when a place is selected, and the search box floats on top of it. | M3 |
| Bottom right | Zoom in, zoom out and reset view, then the map attribution (compact "ⓘ") | M3 |
| Bottom left | Scale bar (metric) | M3 |
| Top centre | "Map" and "Routes" tabs | Reserved for M5 |
| Top right | "Modern" and "Ancient" toggle | Reserved for M4 |
| Bottom centre | Timeline slider (4 BC – AD 100, snapping to change years) | Reserved for M4 |

The reserved areas are **not built in M3**. The wireframes show them with dashed outlines so that M3 leaves room for them.

### Small screens (under 768 px) — basic only in M3
- The search box spans the width at the top, with 16 px margins.
- The place panel becomes a **bottom sheet**: it opens at about 40% height (photo and title), and is dragged or tapped to open fully. A close button sits at the top right.
- The zoom buttons are hidden, since pinch zoom replaces them; reset view stays.
- Full responsive polish is M7.

## 2. The map

### Basemap
- **Style (ADR-0024): an ancient, physical map.** For now the app shows the ancient world only, in English. The basemap is derived from OpenFreeMap **Liberty** (ADR-0022) and **hosted by the app** (OpenFreeMap requires hosting a customized style yourself). It keeps only:
  - the background, the relief shading (`ne2_shaded`), natural landcover (wood, grass, scrub, sand, rock, ice, wetland), water, and rivers and streams.

  It has **no text labels, roads, railways, borders, towns, farmland, parks, buildings or points of interest**, so no modern name or border appears. The only labels on the map are our own records, in English: places, regions, provinces and empires (§2 "Places on the map"). A modern layer with today's names comes with the Modern/Ancient toggle (M4).
- **Zoom:** from 3 (the whole Mediterranean) to **14** (neighbourhood level), where Jerusalem's sites are still clearly apart and a physical map has nothing more to show.
- **Fallback:** a basemap from a **different provider or host**, so that it still works if OpenFreeMap itself is down (ADR-0009). M3-03 uses the VersaTiles public server with our own copy of its Colorful style, given the same physical treatment. The app switches to it automatically after repeated tile errors, and configuration can also switch it. OpenFreeMap's Bright and Liberty styles use the same servers, so they are theme alternatives, not fallbacks.
- **Considered at CP3a:** OpenFreeMap Positron, a muted grey style, was the PO's recommendation. The human chose Liberty after comparing the renders below, then asked for an ancient-only map after the first build (ADR-0024).


### Basemap options: what Positron and Liberty look like (CP3a decision 1)
**Decided:** Liberty, on 2026-09-28 (ADR-0022). The comparison is kept as the record of the choice. **Since then,** the app draws a physical version of Liberty, without labels, roads, borders or towns (ADR-0024), so the finished map looks plainer than these renders.

These are real renders, not wireframes. They are what the app's map will look like, drawn with MapLibre 6.10 from OpenFreeMap tiles, with all 63 of our places in the pin colours from this spec.
- **Customizations the app will make:** English labels where the map data has them, no points of interest, clustering below zoom 7, a "?" badge on disputed places (for example Emmaus) when zoomed out, and lettered candidates for any place with several candidates when zoomed in.
- **Borders:** hidden in these previews, so that no contested line is shown here. The app hides only disputed boundaries.
- **Attribution:** each image carries the OpenFreeMap, OpenMapTiles and OpenStreetMap attribution in its corner.

| View | Positron: muted greys | **Liberty (chosen):** colourful, closer to Google Maps |
|---|---|---|
| Mediterranean overview (zoom 4.7) | ![Positron overview](basemap-options/positron-overview.jpg) | ![Liberty overview](basemap-options/liberty-overview.jpg) |
| Galilee (zoom 10.4) | ![Positron Galilee](basemap-options/positron-galilee.jpg) | ![Liberty Galilee](basemap-options/liberty-galilee.jpg) |
| Jerusalem, sites within the city (zoom 14.6) | ![Positron Jerusalem](basemap-options/positron-jerusalem.jpg) | ![Liberty Jerusalem](basemap-options/liberty-jerusalem.jpg) |

- **Positron** draws land in light grey and water in grey-blue, with thin white roads and small grey labels. The red, purple and green pins are the strongest colours on the screen, even in dense Jerusalem.
- **Liberty** draws land in beige and water in blue, with yellow and orange roads, green parks and building outlines. It looks more like Google Maps and gives more modern context, but it competes with the pins, especially at city zoom.

### Places on the map
| Record | Shown as | Colour |
|---|---|---|
| City, town, village | Round pin with a white 2 px outline; label beside it | Deep red `#C5221F` |
| Site within a city (for example the Temple Mount) | Round pin | Purple `#8430CE` |
| Natural feature (for example the Sea of Galilee) | Round pin | Dark green `#0B6B2E` |
| Empire (`type: "empire"`, from M3-11; for example the Roman Empire) | **No pin:** a clickable label in spaced capitals, 15 px, `#5F6368` | — |
| Province (`type: "province"`, from M3-11; for example Achaia or Macedonia) | **No pin:** a clickable label in spaced capitals, 13 px, `#5F6368` | — |
| Region or island record (for example Galilee or Crete) | **No pin:** a clickable label in spaced capitals, 12 px, `#5F6368` | — |

- **Drawn by the map (ADR-0024):** pins, labels, clusters, badges and candidate letters are MapLibre layers, drawn on the graphics card in the same frame as the map, so they never lag behind a drag or zoom. Labels that would overlap are hidden automatically; a hidden label still appears in the hover tooltip. The label priority is the selected place, then empires, provinces, regions, cities, towns, villages, sites and natural features, then the data's order. Map labels use the basemap's Noto Sans font.
- **Contrast on Liberty:** every pin colour has at least 3:1 contrast against every Liberty background, park, wood, grass, building and water colour; the lowest is red on water, at 3.1:1. The natural-feature green was darkened from `#188038` because that colour reached only 2.7:1 on water, where pins such as the Sea of Galilee sit. The white outline separates each pin from the map.
- **Selected place:** its pin grows by about 30% and gets a drop shadow; the other pins stay as they are.
- **Hover** (on desktop): a tooltip with the name and type, and a pointer cursor over any clickable pin, cluster, disputed "?" badge, candidate letter or area label. Elsewhere, MapLibre keeps its own grab/grabbing cursors.
- **Hit area:** hover and click check a small box around the pointer (about 8 px each way) and choose the nearest feature in that box, so crowded pins are easier to hit.
- **Keyboard:** every place on the map can be reached by keyboard through the list of visible places (see §7).

### Zoom tiers
The data's `zoomTier` decides when a place appears. The initial view shows the whole Mediterranean, from Rome to Damascus and down to the Nile delta.

| `zoomTier` | Visible from zoom | Notes |
|---|---|---|
| `region` | 6 to 9 | Labels only; they fade out as you zoom in. Within this tier, empire labels show from zoom 3 to 5, and province labels from 4 to 8. |
| `city` | 4 | Nearby pins **cluster** into a count bubble below zoom 7. Clicking a bubble zooms in. |
| `site` | 12 | Sites inside a city (Jerusalem's Temple Mount, pools and so on) appear only when zoomed in. |

**Selecting a place zooms the map to it:** a city to about zoom 11, a site to zoom 14 (the closest zoom), a region or province to about zoom 7, and an empire to about zoom 4. A place with several candidates zooms to fit all of them. If the user prefers reduced motion, the map jumps instead of flying.

### Places with several candidate sites
A place is **disputed** when at least one of its candidates has confidence `disputed` (see `schema/README.md`), for example Emmaus, Bethsaida and Cana. Other places also have several candidates without being disputed: Jericho's Old Testament tell and Herodian city, or Malta with a low-confidence minority proposal.
- **Below zoom 8:** one pin, placed at the first-listed candidate. **Disputed places add a "?" badge.**
- **From zoom 8, or when the place is selected:** one pin per candidate, lettered **A, B, C …** in the data's order, with a **dashed** white outline. Every candidate pin looks the same except for its letter; the map never marks one candidate as "the" site.
- Clicking any candidate opens the place, with that candidate highlighted in the panel.

## 3. Place panel
The section order follows brief §1.4. Sections without data are left out.

1. **Images** (ADR-0029, built in M3.5-06). Major places have 4–7 images, counting the AI reconstruction, and standard places 1–3, about 408 × 240 px in the panel.
   - With several images, there are arrows and a "1 / 7" counter, plus a row of small thumbnails under the image when there are more than 3.
   - **A label on each image for its kind:** "Today", "Excavated site", "Reconstruction", "Historical view", or **"AI-generated reconstruction"**, which is always visible.
   - **Directly under each panel image:** the caption and a small, visible **Credit** link to that image's entry in **Photo credits** (at the end of the panel). The link is keyboard-reachable, named like "Credit for image *n*", and moves focus to the matching entry.
   - The alt text is the caption, and the caption appears in small type.
   - Selecting the image opens a large viewer (a dialog) with the same arrows, label, credit and caption. ← and → move between images, and Esc closes it.
2. **Names:**
   - the title is the first ancient name, the spelling most popular English Bibles agree on, for example **Capernaum** (CP3a decision 2; ADR-0026);
   - under it, one **"Today"** line: **"Today: *modern name*, *country/countries*"** when both exist; the modern name alone when no country is shown; or the countries alone when there is no single modern name. "West Bank" and "Golan Heights" omit "the" when they directly follow the modern name (for example "Bethlehem, West Bank"), but keep it in stand-alone or "and" positions;
   - then "Also known as …" with the other ancient and alternate names, which are English only. Names in `names.otherLanguages` are never shown;
   - then a line with the type, the region and the empire as of about AD 50 (ADR-0027), for example "City · Achaia · Roman Empire" or "Village · Galilee · Roman Empire". The region is the place's parent, and the empire is the end of its parent chain; each links to its own record. An empire record shows only its type.
3. **Location confidence:** the confidence chip (or note) sits on the same "Today" line, never by colour alone. Single-candidate places show "High/Medium/Low confidence". Disputed places show **"Location disputed · *n* proposed sites"** on that line. Other places with several candidates show **"*n* sites"** on that line. If both the modern name and countries are absent, the chip or note sits alone where the "Today" line would be.
4. **Candidates** (places with several candidates): a list A, B, C … Each entry has its label, a confidence chip and its support text (two lines, expandable), plus its sources. Selecting an entry centres the map on it.
5. **Actions:** there is **no action bar**. Opening a place still frames all its candidate sites on the map, the URL still carries `?place=...` (and `&candidate=...` when relevant), and the Sources section stays in the panel.
6. **About:** the summary, then the history notes. Each factual statement ends with source markers such as [1] [2] that link to the Sources section.
7. **In the Bible · *n* passages:** grouped by book in canonical order.
   - Each entry shows its reference in bold (for example "Matthew 4:13") and the WEB verse text in a **serif** typeface, so scripture reads distinctly.
   - The first 5 are shown, then **"Show all *n* passages"** (CP3a decision 4). Jerusalem has 174.
8. **Old Testament connections · *n*:** the reference and a short note, with source markers.
9. **Places in *name*:** chips for child records (for example Jerusalem → Temple Mount, Pool of Bethesda …; Galilee → Capernaum …).
10. **Sources:** a numbered list, where each entry is a readable citation with a link:
    - "Pleiades place 678231" links to Pleiades;
    - `bib:` entries show as author, title and year;
    - `scripture:` entries show as the passage.
11. **Photo credits:** a numbered list in gallery order, directly after Sources and before the footer, with the same heading style and entry typography as Sources. It starts with the note: "Photos are unmodified, except that the panel crops them to fit. Open a photo to see it whole." Each entry has the same full credit line the viewer shows.
12. **Footer:** "Checked by the project's Fact-Checker · last reviewed 24 Sep 2026", and **Report an issue**, which opens a GitHub issue with the place id filled in.

The panel closes with its × button or with Esc. While the panel is open, the map keeps its position.

## 4. Search
- **Placeholder:** "Search biblical places". The box searches **English place names only** (brief §1.7; ADR-0026): each record's `ancient` and `alternate` names, which include the spellings of the NIV, ESV, NLT, KJV, NKJV, CSB and WEB. So a reader can look up any place by the name their Bible uses; for example "Melita" (KJV) finds Malta. Modern names, candidate labels and names in other languages are not searched.
- **Matching:** prefix and word-start matches, ignoring case and diacritics, so "capernaum" finds Capernaum. It tolerates one typo in names of 5 letters or more.
- **Results:** up to 8 appear as the user types. Each shows the title name with the match in bold, and a second line with the modern name and type.
  - For non-disputed places, the second line follows the same rule as the panel's "Today" line: modern name, then countries (without repeating countries already in the name), then the type. Example: "Selçuk, Türkiye · City".
  - Disputed places keep "Disputed · *n* proposed sites · *type*".
  - Records without a modern name or countries show just the type.
  - A match found through a name other than the title adds "also: *name*", for example "Malta — also: Melita". Searching "Antioch" lists **Antioch on the Orontes** (Antakya) and **Antioch in Pisidia** (Yalvaç) as separate places.
- **Keyboard:** ↓ and ↑ move through the results, Enter opens one, and Esc clears the box. Pressing "/" anywhere focuses the search.
- **No results:** "No places match *'xyz'*. Search covers place names only."
- **Menu** (☰ in the search box) opens a drawer with About this map, Sources & credits, Report an issue, and View on GitHub.

## 5. States
| State | Behaviour |
|---|---|
| Loading a place | Grey skeleton blocks in the panel. The map is usable at once, because the map and search data (about 18 KB) load with the app. |
| Basemap tiles failing | After repeated tile errors, switch to the fallback style and show a message: "The main map service isn't responding. Showing the backup map." |
| An image fails to load | A grey placeholder with an icon; that image's entry in **Photo credits** stays. |
| A link to an unknown place | The default view, with the message "Place not found". |

## 6. Visual tokens
| Token | Value |
|---|---|
| Text, primary / secondary | `#202124` / `#5F6368` |
| Surface / subtle surface / divider | `#FFFFFF` / `#F1F3F4` / `#DADCE0` |
| Accent (links, primary buttons, focus ring) | `#1A73E8` |
| Confidence: high | text `#137333` on `#E6F4EA` |
| Confidence: medium | text `#9A5200` on `#FEF7E0` (5.5:1) |
| Confidence: low | text `#5F6368` on `#F1F3F4` |
| Confidence: disputed | text `#A50E0E` on `#FCE8E6` |
| UI font | `system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |
| Scripture font | `Georgia, "Noto Serif", "Times New Roman", serif` |
| Type sizes (size / line height) | Title 22/28 semibold · section heading 16/24 medium · body 14/20 · scripture 15/24 · caption 12/16 |
| Spacing | 4 px grid; panel padding 24 px; 16 px between sections, with a divider line |
| Corners | Search box: pill · panels and cards: 8 px · chips: 16 px · action buttons: 40 px circles |
| Shadow (search box, panel) | `0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)` |

## 7. Accessibility (WCAG 2.2 AA)
- **Contrast:** text at least 4.5:1; pins, outlines and controls at least 3:1 against the basemap.
- **Keyboard:**
  - Everything is reachable, in this order: search, map controls, the places on the map, then the panel.
  - The map draws its pins itself (ADR-0024), so keyboard and screen-reader users get a **list of the places currently on the map**, kept in step with it after each pan or zoom ends. Each entry is a button named like "Capernaum, city", or "Cluster of 7 places". Tab moves through the list in reading order (top to bottom, then left to right). A focus ring is drawn around the focused pin on the map, the map pans if the pin is hidden under the panel, and Enter selects the place or zooms into the cluster. The list is capped at 200 entries, with "Zoom in or search to reach more places" after them.
  - The focus ring is 2 px `#1A73E8` with a 2 px offset.
  - Esc closes search results and the panel.
- **Screen readers:**
  - The panel is a labelled region, with the place name as its level-1 heading.
  - Search follows the ARIA combobox pattern.
  - The carousel buttons are labelled "Previous image" and "Next image", and the viewer is a labelled dialog.
- **Meaning is never carried by colour alone:** type and confidence always appear as text too.
- **Touch targets** are at least 44 × 44 px. **Reduced motion** replaces every animation with a jump.

## 8. Neutrality in the interface
- **Modern names include countries (ADR-0028):** the app shows "Today: *name*, *country/countries*" when a modern name exists, or countries only when there is no single modern name. Countries already present in the modern name are not repeated (for example "Central Türkiye" does not add "Türkiye" again). Jerusalem and records inside Jerusalem, and empire records, show no countries. "West Bank" and "Golan Heights" omit "the" when they directly follow the modern name, but use it in stand-alone and "and" list positions ("Israel and the West Bank", "the Golan Heights"). Disputed places omit `names.modern`; their "Today" line shows countries only (for example "Israel and the West Bank"), with the disputed chip beside it.
- **Candidate order:** candidates keep the data's order, and no candidate is styled as the answer. Where church tradition and archaeology differ, both appear as candidates, with their support text.
- **Wording:** plain and descriptive, with no devotional or polemical framing, in keeping with the data (brief §2.6). Introduce every person, writer or work the first time the text names them, unless the Bible makes them familiar ("the first-century Jewish historian Josephus"). Don't name databases such as Pleiades or Wikidata in the text; the Sources list names them (ADR-0033).

## 9. Attribution and credits
- **Map:** a compact attribution control. The exact text for OpenFreeMap, OpenMapTiles and OpenStreetMap is set by the Fact-Checker in `ATTRIBUTION.md` (task M3-07).
- **Photos:** every image's full credit is in a numbered "Photo credits" list at the end of the place panel, after Sources, numbered as in the gallery's counter and styled like the Sources list. Under the panel's image there is only the caption and a small "Credit" link to the image's entry; the AI label stays on the image, and the large viewer shows the full credit (§3; `docs/LICENSES.md`, "Image credits").
- **Menu → Sources & credits:**
  - the data licence (CC BY-SA 4.0; OSM- and AWMC-derived geometry under ODbL 1.0 from M4);
  - the WEB notice, word for word from `docs/LICENSES.md`;
  - the upstream sources from `ATTRIBUTION.md`.

## 10. Links
- A selected place is kept in the URL, as `?place=capernaum`, plus `&candidate=b` for a candidate, so any view can be shared.
- Opening that URL selects the same place (and candidate, when present).

## 11. Performance targets
- **Load speed:** measured with Lighthouse's **desktop preset on a cold cache** against the preview deploy, the Largest Contentful Paint must be **2.5 s or less**, and the Total Blocking Time **200 ms or less**. These are Lighthouse's "good" thresholds.
- **Smooth dragging and zooming (ADR-0024):** pins, labels and clusters move with the map in the same frame, never behind it. With **10,000 test points** loaded, no main-thread task may exceed 50 ms while dragging or zooming, and the page's DOM may not change during the gesture.
- **Data loading:** the map and search data (about 18 KB minified) load with the app. Each place's details load when it is opened; the largest, Jerusalem, is about 36 KB minified.
- **Images:** load lazily: only the image shown and the next one. They use Commons thumbnail URLs at Commons' standard widths (330, 500, 960 and 1,280 px), never full-resolution files: the panel uses the width nearest its size, the thumbnail row 330 px, and the viewer 1,280 px only when it opens. AI images are WebP files of at most 1,600 px and 400 KB, served by the site.

## 12. Not in M3
The Ancient layer's borders and timeline (M4), the Modern/Ancient toggle and modern labels (M4), the Routes tab (M5), responsive polish (M7), a native app build, offline use, other languages, and search by verse or person.

## Wireframes
| File | Shows |
|---|---|
| [01-map-overview.svg](wireframes/01-map-overview.svg) | Opening view: the Mediterranean overview, search, pins, a cluster, region labels, a sample disputed "?" pin, controls and the reserved areas |
| [02-place-panel.svg](wireframes/02-place-panel.svg) | Capernaum selected: photos with caption + Credit link (full credits at panel end), names with a single "Today" line and chip, About, In the Bible, OT connections |
| [03-disputed-place.svg](wireframes/03-disputed-place.svg) | Emmaus selected: countries + disputed chip on one "Today" line, and four lettered candidates on the panel and the map |
| [04-search.svg](wireframes/04-search.svg) | Search results for "Antioch" |
| [05-small-screen.svg](wireframes/05-small-screen.svg) | Small screen: search and the bottom sheet |
