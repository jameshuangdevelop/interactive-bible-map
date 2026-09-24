# Visual spec — MVP app (M3, low fidelity)

This spec describes how the MVP map app looks and behaves. It is low fidelity on purpose: it fixes layout, content order, interaction and accessibility, and leaves exact pixels to the build. The wireframes are in [wireframes/](wireframes/). The Frontend Engineer builds against this document (tasks M3-02 to M3-06), and the PO updates it when a decision changes.

**Model:** Google Maps on desktop: a full-screen map, a floating search box, and a place panel on the left. The tone is calm and scholarly: a muted basemap, so that the biblical places stand out.

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
- **Style:** based on OpenFreeMap **Positron**, a light grey and muted style, customized and **hosted by the app** as its own style file (OpenFreeMap requires hosting a customized style yourself):
  - English labels where the data has them;
  - points of interest removed;
  - **disputed boundary lines hidden** (the OpenMapTiles `boundary` layer, where `disputed = 1`; ADR-0009).
- **Fallback:** a second style (OpenFreeMap Bright) can be switched in by configuration, and the app switches to it automatically if tiles keep failing (ADR-0009).
- **Alternative (CP3a decision 1):** OpenFreeMap Liberty, which is more colourful and closer to Google Maps.

### Places on the map
| Record | Shown as | Colour |
|---|---|---|
| City, town, village | Round pin with a white 2 px outline; label beside it | Deep red `#C5221F` |
| Site within a city (for example the Temple Mount) | Round pin | Purple `#8430CE` |
| Natural feature (for example the Sea of Galilee) | Round pin | Green `#188038` |
| Region or island record (for example Galilee or Crete) | **No pin:** a clickable label in spaced capitals, `#5F6368` | — |

- **Selected place:** its pin grows by about 30% and gets a drop shadow; the other pins stay as they are.
- **Hover** (on desktop): a tooltip with the name and type.
- **Pins are real buttons**, so they can be reached by keyboard (see §7).

### Zoom tiers
The data's `zoomTier` decides when a place appears. The initial view shows the whole Mediterranean, from Rome to Damascus and down to the Nile delta.

| `zoomTier` | Visible from zoom | Notes |
|---|---|---|
| `region` | 4 to 9 | Labels only; they fade out as you zoom in. |
| `city` | 4 | Nearby pins **cluster** into a count bubble below zoom 7. Clicking a bubble zooms in. |
| `site` | 12 | Sites inside a city (Jerusalem's Temple Mount, pools and so on) appear only when zoomed in. |

**Selecting a place zooms the map to it:** a city to about zoom 11, a site to about zoom 15, and a region to about zoom 7. A disputed place zooms to fit all its candidates. If the user prefers reduced motion, the map jumps instead of flying.

### Disputed places (several candidate sites)
- **Below zoom 8:** one pin, placed at the first-listed candidate, with a **"?" badge**.
- **From zoom 8, or when the place is selected:** one pin per candidate, lettered **A, B, C …** in the data's order, with a **dashed** white outline. Every candidate pin looks the same except for its letter; the map never marks one candidate as "the" site.
- Clicking any candidate opens the place, with that candidate highlighted in the panel.

## 3. Place panel
The section order follows brief §1.4. Sections without data are left out.

1. **Photos** (1–3, about 408 × 240 px). With 2–3 photos, there are arrows and a "1 / 3" counter. **Directly under each photo, always visible:** "Photo: *author* · *license* · Wikimedia Commons". The license links to its legal text, and "Wikimedia Commons" links to the file page. The alt text is the caption, and the caption appears in small type below the credit. AI reconstructions (later) carry a visible **"AI-generated reconstruction"** badge on the image itself.
2. **Names:**
   - the title is the first ancient name, for example **Capernaum** (CP3a decision 2);
   - under it, the modern name (see §8 for the neutrality rule);
   - then "Also known as …" with the other ancient and alternate names;
   - then a line with the type and parent, for example "City · Galilee", which links to the parent.
3. **Location confidence:** a chip in words, never colour alone. "High confidence" appears for single-candidate places. Disputed places get a banner instead: **"Location disputed · 4 proposed sites"**.
4. **Candidates** (disputed places only): a list A, B, C … Each entry has its label, a confidence chip and its support text (two lines, expandable), plus its sources. Selecting an entry centres the map on it.
5. **Actions:** round buttons with labels: **Zoom to**, **Copy link** and **Sources**, which scrolls to the sources.
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
11. **Footer:** "Checked by the project's Fact-Checker · last reviewed 24 Sep 2026", and **Report an issue**, which opens a GitHub issue with the place id filled in.

The panel closes with its × button or with Esc. While the panel is open, the map keeps its position.

## 4. Search
- **Placeholder:** "Search biblical places". The box searches **place names only**: ancient, modern and alternate names (brief §1.7).
- **Matching:** prefix and word-start matches, ignoring case and diacritics, so "alasehir" finds Alaşehir. It tolerates one typo in names of 5 letters or more.
- **Results:** up to 8 appear as the user types. Each shows the title name with the match in bold, and a second line with the modern name and type. A match found through an alternate name adds "also: *name*". Searching "Antioch" lists **Antioch on the Orontes** (Antakya) and **Antioch in Pisidia** (Yalvaç) as separate places.
- **Keyboard:** ↓ and ↑ move through the results, Enter opens one, and Esc clears the box. Pressing "/" anywhere focuses the search.
- **No results:** "No places match *'xyz'*. Search covers place names only."
- **Menu** (☰ in the search box) opens a drawer with About this map, Sources & credits, Report an issue, and View on GitHub.

## 5. States
| State | Behaviour |
|---|---|
| Loading a place | Grey skeleton blocks in the panel. The map is usable at once, because the map and search data (about 17 KB) load with the app. |
| Basemap tiles failing | After repeated tile errors, switch to the fallback style and show a message: "The main map service isn't responding. Showing the backup map." |
| An image fails to load | A grey placeholder with an icon; the credit line stays. |
| A link to an unknown place | The default view, with the message "Place not found". |

## 6. Visual tokens
| Token | Value |
|---|---|
| Text, primary / secondary | `#202124` / `#5F6368` |
| Surface / subtle surface / divider | `#FFFFFF` / `#F1F3F4` / `#DADCE0` |
| Accent (links, primary buttons, focus ring) | `#1A73E8` |
| Confidence: high | text `#137333` on `#E6F4EA` |
| Confidence: medium | text `#B06000` on `#FEF7E0` |
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
  - Everything is reachable, in this order: search, map controls, pins, then the panel.
  - Pins are buttons named like "Capernaum, city".
  - The focus ring is 2 px `#1A73E8` with a 2 px offset.
  - Esc closes search results and the panel.
- **Screen readers:**
  - The panel is a labelled region, with the place name as its level-1 heading.
  - Search follows the ARIA combobox pattern.
  - The carousel buttons are labelled "Previous photo" and "Next photo".
- **Meaning is never carried by colour alone:** type and confidence always appear as text too.
- **Touch targets** are at least 44 × 44 px. **Reduced motion** replaces every animation with a jump.

## 8. Neutrality in the interface
- **Modern names** show the place name only: **no country, state or political descriptor** (for example "Yalvaç", "Tell Balata", "Antakya"). The map itself gives the location, and the basemap hides disputed borders (CP3a decision 3). Disputed places show no modern name line; their candidates carry their own labels.
- **Candidate order:** candidates keep the data's order, and no candidate is styled as the answer. Where church tradition and archaeology differ, both appear as candidates, with their support text.
- **Wording:** plain and descriptive, with no devotional or polemical framing, in keeping with the data (brief §2.6).

## 9. Attribution and credits
- **Map:** a compact attribution control. The exact text for OpenFreeMap, OpenMapTiles and OpenStreetMap is set by the Fact-Checker in `ATTRIBUTION.md` (task M3-07).
- **Photos:** a credit under every photo (§3).
- **Menu → Sources & credits:**
  - the data licence (CC BY-SA 4.0; OSM- and AWMC-derived geometry under ODbL 1.0 from M4);
  - the WEB notice, word for word from `docs/LICENSES.md`;
  - the upstream sources from `ATTRIBUTION.md`.

## 10. Links
- A selected place is kept in the URL, as `?place=capernaum`, plus `&candidate=b` for a candidate, so any view can be shared.
- Copy link copies that URL. Opening it selects the place.

## 11. Performance targets
- **First interaction:** the map is usable within 3 seconds on a mid-range laptop with ordinary broadband.
- **Data loading:** the map and search data (about 17 KB) load with the app. Each place's details load when it is opened; the largest, Jerusalem, is about 34 KB.
- **Images:** load lazily, using Commons thumbnail URLs at panel size rather than full-resolution files.

## 12. Not in M3
The Ancient layer and timeline (M4), the Routes tab (M5), responsive polish (M7), a native app build, offline use, other languages, and search by verse or person.

## Wireframes
| File | Shows |
|---|---|
| [01-map-overview.svg](wireframes/01-map-overview.svg) | Opening view: the Mediterranean overview, search, pins, a cluster, region labels, a disputed "?" pin, controls and the reserved areas |
| [02-place-panel.svg](wireframes/02-place-panel.svg) | Capernaum selected: photos with credits, names, actions, About, In the Bible, OT connections |
| [03-disputed-place.svg](wireframes/03-disputed-place.svg) | Emmaus selected: the disputed banner and four lettered candidates on the panel and the map |
| [04-search.svg](wireframes/04-search.svg) | Search results for "Antioch" |
| [05-small-screen.svg](wireframes/05-small-screen.svg) | Small screen: search and the bottom sheet |
