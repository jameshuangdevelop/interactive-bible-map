export interface UpstreamSourceItem {
  name: string;
  url: string | null;
  note?: string;
}

export const ABOUT_THIS_MAP_TEXT =
  "Interactive Bible Map shows the places of the New Testament on a map of the ancient world, with their English Bible names, candidate sites where the location is uncertain, and the passages that mention them (World English Bible).";

export const DATA_LICENSE_TEXT =
  "Data license: all non-reference data and content are CC BY-SA 4.0. No OSM- or AWMC-derived geometry is included yet; when added in M4, that geometry will be ODbL 1.0.";

export const LICENSE_DETAILS_URL =
  "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/docs/LICENSES.md";

export const WEB_NOTICE_TEXT =
  'Scripture quotations are from the **World English Bible (WEB)**, a public-domain translation of the Bible (66-book Protestant-canon edition, eBible.org). "World English Bible" is a trademark of eBible.org; this project is not produced, reviewed, or endorsed by eBible.org.';

export const MAIN_BASEMAP_SOURCES_CREDITS_MARKDOWN = `**Basemap**

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- Vector tiles in the [OpenMapTiles](https://openmaptiles.org/) schema (© OpenMapTiles, design [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), served free by [OpenFreeMap](https://openfreemap.org).
- Map style: our modified copy of [OpenFreeMap Liberty](https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), rebuilt as an ancient-only physical map (relief shading, natural landcover, water, rivers and streams only; all labels, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom 14). Liberty is a fork of [OSM Liberty](https://github.com/maputnik/osm-liberty), which derives from [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style) by OpenMapTiles and from [Mapbox Open Styles](https://github.com/mapbox/mapbox-gl-styles) (© 2014 Mapbox). Style design: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Style code: BSD 3-Clause and MIT. License notices: [OpenFreeMap](https://github.com/hyperknot/openfreemap-styles/blob/main/LICENSE.md), [OSM Liberty](https://github.com/maputnik/osm-liberty/blob/gh-pages/LICENSE.md), [OSM Bright](https://github.com/openmaptiles/osm-bright-gl-style/blob/master/LICENSE.md), [Mapbox Open Styles](https://github.com/mapbox/mapbox-gl-styles/blob/master/LICENSE.md).
- Optional modern map mode uses [Natural Earth](https://www.naturalearthdata.com/) admin-0 boundary lines (public domain), with neutrality masks and shared country-pair exclusions so no border line is drawn in these areas: Israel, the West Bank, Gaza and the Golan Heights; Kosovo's borders; Western Sahara's borders; the whole Russia-Georgia border; the Armenia-Azerbaijan border; and the line across Cyprus.
- Relief shading from [Natural Earth](https://www.naturalearthdata.com/) (public domain). Labels in Noto Sans ([SIL Open Font License 1.1](https://openfontlicense.org/)). Icons from [Maki](https://github.com/mapbox/maki) (CC0 1.0).`;

export const FALLBACK_VERSATILES_SOURCES_CREDITS_MARKDOWN = `**Backup basemap** (shown only when the main map cannot load)

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
- Tiles served free by [VersaTiles](https://versatiles.org), in the [Shortbread](https://shortbread-tiles.org/) schema (CC0). Map style: our modified copy of VersaTiles Colorful ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)), rebuilt as an ancient-only physical map (natural landcover, water and waterways only; all labels, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom 14).
- Land cover: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Labels in Noto Sans ([SIL Open Font License 1.1](https://openfontlicense.org/)). Icons from VersaTiles ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)).`;

export const CITE_ONLY_BIBLE_VERSIONS = [
  "NIV (Biblica)",
  "ESV (Crossway)",
  "NLT (Tyndale House Foundation)",
  "KJV",
  "NKJV (Thomas Nelson)",
  "CSB (Holman Bible Publishers)"
] as const;

export const UPSTREAM_SOURCES: UpstreamSourceItem[] = [
  {
    name: "OpenBible.info Bible Geocoding",
    url: "https://www.openbible.info/geo/"
  },
  {
    name: "Pleiades",
    url: "https://pleiades.stoa.org/"
  },
  {
    name: "Digital Atlas of the Roman Empire (DARE)",
    url: "http://imperium.ahlfeldt.se/"
  },
  {
    name: "ORBIS (Stanford) — node/edge dataset",
    url: "https://purl.stanford.edu/mn425tz9757"
  },
  {
    name: "AWMC Geodata",
    url: "https://github.com/AWMC/geodata"
  },
  {
    name: "Wikidata",
    url: "https://www.wikidata.org/"
  },
  {
    name: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/"
  },
  {
    name: "Natural Earth",
    url: "https://www.naturalearthdata.com/"
  },
  {
    name: "OpenStreetMap and its contributors",
    url: "https://www.openstreetmap.org/copyright"
  },
  {
    name: "eBible.org — World English Bible (`engwebp`/`engwebpb`)",
    url: "https://ebible.org/web/"
  },
  {
    name: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Wikipedia:Copyrights"
  },
  {
    name: "Digital Archaeological Atlas of the Holy Land (DAAHL)",
    url: "https://daahl.ucsd.edu/"
  },
  {
    name: "OpenFreeMap",
    url: "https://openfreemap.org/"
  },
  {
    name: "OpenMapTiles",
    url: "https://openmaptiles.org/"
  },
  {
    name: "OpenStreetMap and its contributors (basemap data)",
    url: "https://www.openstreetmap.org/copyright"
  },
  {
    name: "Liberty map style (OpenFreeMap Liberty ← OSM Liberty ← OSM Bright ← Mapbox Open Styles)",
    url: "https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty"
  },
  {
    name: "Noto Sans (label glyphs in Liberty and both fallbacks)",
    url: "https://github.com/notofonts/latin-greek-cyrillic"
  },
  {
    name: "Maki icons, and a public-domain arrow (Liberty's sprite)",
    url: "https://github.com/mapbox/maki"
  },
  {
    name: "Natural Earth II shaded relief tiles",
    url: "https://www.naturalearthdata.com/"
  },
  {
    name: "Natural Earth admin-0 boundary lines and contested-area polygons",
    url: "https://www.naturalearthdata.com/"
  },
  {
    name: "Protomaps Basemaps (**fallback A**, self-hosted PMTiles extract; acceptable and recommended)",
    url: "https://github.com/protomaps/basemaps"
  },
  {
    name: "ESA WorldCover 2020, via the Daylight landcover (in fallback A)",
    url: "https://esa-worldcover.org/en/data-access"
  },
  {
    name: "VersaTiles public tile server (**fallback B**; acceptable for outages only)",
    url: "https://versatiles.org/"
  },
  {
    name: "ESA WorldCover 2021 (in fallback B's hosted tiles)",
    url: "https://esa-worldcover.org/en/data-access"
  },
  {
    name: "Cite-only references in `data/bibliography.json` (e.g. UNESCO World Heritage Centre listings, World History Encyclopedia, Livius.org, Zondervan Academic, BiblePlaces.com, HMML, the Hellenic Ministry of Culture and Sports' Odysseus portal, the Austrian Academy of Sciences, the Biblical Archaeology Society)",
    url: null,
    note: "See each entry's `url` in `data/bibliography.json`."
  },
  {
    name: "Public-domain texts cited in `data/bibliography.json`: Loeb translations of Cassius Dio, Suetonius, Tacitus and Strabo (hosted on LacusCurtius), Josephus in Whiston's translation (hosted by CCEL), the *International Standard Bible Encyclopedia* (1915), and Smith's *Dictionary of Greek and Roman Antiquities* (1875, hosted on LacusCurtius)",
    url: null,
    note: "See each entry's `url` in `data/bibliography.json`."
  },
  {
    name: "English Bible versions compared for place-name spellings: NIV (Biblica), ESV (Crossway), NLT (Tyndale House Foundation), KJV, NKJV (Thomas Nelson) and CSB (Holman Bible Publishers), read on Bible Gateway",
    url: null,
    note: "See each entry's `url` in `data/bibliography.json`."
  },
  {
    name: "Google Gemini API image generation (Nano Banana Pro, `gemini-3-pro-image`)",
    url: "https://ai.google.dev/gemini-api/terms"
  }
];
