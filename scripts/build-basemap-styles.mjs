import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const stylesOutputDirectory = path.join(repositoryRoot, "app", "public", "styles");

const libertyStyleUrl = "https://tiles.openfreemap.org/styles/liberty";
const versaTilesColorfulStyleUrl =
  "https://tiles.versatiles.org/assets/styles/colorful/style.json";

const libertyAttribution =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const versaTilesAttribution =
  '<a href="https://versatiles.org" target="_blank">VersaTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="https://esa-worldcover.org/en/data-access" target="_blank">&copy; ESA WorldCover 2021</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>)';

const libertyName = "Interactive Bible Map basemap (modified from OpenFreeMap Liberty)";
const libertyMetadataLicense =
  "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: English labels, points of interest removed, disputed boundary lines hidden. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Full notices and disclaimers: LICENSE.txt in the same folder as this file.";

const englishNameExpression = [
  "coalesce",
  ["get", "name:en"],
  ["get", "name:latin"],
  ["get", "name"]
];

const poiSourceLayers = new Set(["poi", "pois"]);
const disputedOneExclusion = ["!=", ["get", "disputed"], 1];
const disputedTrueExclusion = ["!=", ["get", "disputed"], true];
const claimedByExclusion = ["!", ["has", "claimed_by"]];

const libertyLicensePartUrls = [
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/LICENSE.md",
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/styles/liberty/LICENSE.md",
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/styles/bright/LICENSE.md",
  "https://raw.githubusercontent.com/mapbox/mapbox-gl-styles/master/LICENSE.md"
];

const versaTilesNotice = `This file is part of Interactive Bible Map's outage-only fallback basemap.

Source style: VersaTiles Colorful
Source URL: ${versaTilesColorfulStyleUrl}
Source style license: CC0 1.0 (metadata.license in upstream style)
Fallback policy: use this style only when the primary OpenFreeMap Liberty basemap is unavailable.

Modifications in this copy:
- English labels via coalesce(name:en, name:latin, name)
- Points of interest removed
- Disputed boundary lines hidden (removed boundary-country-disputed and the disputed branch of boundary-country:outline)

Attribution string used in the vector source:
${versaTilesAttribution}
`;

function isNameFieldName(value) {
  return (
    typeof value === "string" &&
    (value === "name" || value.startsWith("name:") || value.startsWith("name_"))
  );
}

function referencesNameField(value) {
  if (isNameFieldName(value)) {
    return true;
  }

  if (typeof value === "string") {
    return /\{name(?:[:_}]|$)/u.test(value);
  }

  if (!Array.isArray(value)) {
    return false;
  }

  if (
    value[0] === "get" &&
    value.length > 1 &&
    typeof value[1] === "string" &&
    isNameFieldName(value[1])
  ) {
    return true;
  }

  return value.some((item) => referencesNameField(item));
}

function expressionEquals(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function ensureAllFilterClauses(filter, clauses) {
  if (!Array.isArray(filter) || filter.length === 0) {
    return ["all", ...clauses];
  }

  if (filter[0] !== "all") {
    return ["all", filter, ...clauses];
  }

  const nextFilter = [...filter];
  for (const clause of clauses) {
    if (!nextFilter.some((part) => expressionEquals(part, clause))) {
      nextFilter.push(clause);
    }
  }

  return nextFilter;
}

function applyEnglishLabels(style) {
  for (const layer of style.layers) {
    if (layer.type !== "symbol" || !layer.layout || !("text-field" in layer.layout)) {
      continue;
    }

    const textField = layer.layout["text-field"];
    if (!referencesNameField(textField)) {
      continue;
    }

    layer.layout = { ...layer.layout, "text-field": englishNameExpression };
  }
}

function removePoiLayers(style) {
  style.layers = style.layers.filter((layer) => !poiSourceLayers.has(layer["source-layer"]));
}

function buildLibertyStyle(upstreamStyle) {
  const style = structuredClone(upstreamStyle);
  style.name = libertyName;
  style.metadata = {
    ...(style.metadata ?? {}),
    "interactive-bible-map:license": libertyMetadataLicense
  };

  if (style.sources.openmaptiles) {
    style.sources.openmaptiles = {
      ...style.sources.openmaptiles,
      attribution: libertyAttribution
    };
  }

  if (style.sources.ne2_shaded && "attribution" in style.sources.ne2_shaded) {
    const source = { ...style.sources.ne2_shaded };
    delete source.attribution;
    style.sources.ne2_shaded = source;
  }

  removePoiLayers(style);
  style.layers = style.layers.filter((layer) => layer.id !== "boundary_disputed");

  style.layers = style.layers.map((layer) => {
    if (layer["source-layer"] !== "boundary") {
      return layer;
    }

    const nextLayer = { ...layer };
    const requiredClauses = [disputedOneExclusion];

    if (layer.id === "boundary_2" || layer.id === "boundary_3") {
      requiredClauses.push(claimedByExclusion);
    }

    nextLayer.filter = ensureAllFilterClauses(nextLayer.filter, requiredClauses);
    return nextLayer;
  });

  applyEnglishLabels(style);
  return style;
}

function buildVersaTilesStyle(upstreamStyle) {
  const style = structuredClone(upstreamStyle);
  style.name = "Interactive Bible Map backup basemap (modified from VersaTiles Colorful)";

  style.metadata = {
    ...(style.metadata ?? {}),
    "interactive-bible-map:notice":
      "Modified for outage-only fallback use by Interactive Bible Map. Changes: English labels, no points of interest, disputed boundaries hidden."
  };

  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (source.type !== "vector") {
      continue;
    }

    style.sources[sourceId] = { ...source, attribution: versaTilesAttribution };
  }

  removePoiLayers(style);
  style.layers = style.layers.filter((layer) => layer.id !== "boundary-country-disputed");

  style.layers = style.layers.map((layer) => {
    if (layer.id === "boundary-country:outline") {
      return {
        ...layer,
        filter: [
          "all",
          ["==", ["get", "admin_level"], 2],
          disputedTrueExclusion,
          ["!=", ["get", "maritime"], true]
        ]
      };
    }

    if (layer["source-layer"] !== "boundaries" || layer.type !== "line") {
      return layer;
    }

    return {
      ...layer,
      filter: ensureAllFilterClauses(layer.filter, [disputedTrueExclusion])
    };
  });

  applyEnglishLabels(style);
  return style;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }

  return response.text();
}

async function writeStyleDirectory(outputDirectory, styleJson, noticeFileName, noticeContent) {
  await fs.mkdir(outputDirectory, { recursive: true });

  await fs.writeFile(
    path.join(outputDirectory, "style.json"),
    `${JSON.stringify(styleJson, null, 2)}\n`,
    "utf8"
  );

  await fs.writeFile(path.join(outputDirectory, noticeFileName), noticeContent, "utf8");
}

async function buildStyles() {
  const [libertyUpstream, versaTilesUpstream] = await Promise.all([
    fetchJson(libertyStyleUrl),
    fetchJson(versaTilesColorfulStyleUrl)
  ]);

  const libertyStyle = buildLibertyStyle(libertyUpstream);
  const versaTilesStyle = buildVersaTilesStyle(versaTilesUpstream);

  const licenseParts = await Promise.all(libertyLicensePartUrls.map((url) => fetchText(url)));
  const libertyLicenseNotice = [
    libertyMetadataLicense,
    ...licenseParts.map((part) => part.trimEnd())
  ].join("\n\n-----\n\n");

  await writeStyleDirectory(
    path.join(stylesOutputDirectory, "liberty"),
    libertyStyle,
    "LICENSE.txt",
    `${libertyLicenseNotice}\n`
  );

  await writeStyleDirectory(
    path.join(stylesOutputDirectory, "versatiles-colorful"),
    versaTilesStyle,
    "NOTICE.txt",
    versaTilesNotice
  );

  console.log("Wrote hosted basemap styles:");
  console.log(" - app/public/styles/liberty/style.json");
  console.log(" - app/public/styles/liberty/LICENSE.txt");
  console.log(" - app/public/styles/versatiles-colorful/style.json");
  console.log(" - app/public/styles/versatiles-colorful/NOTICE.txt");
}

buildStyles().catch((error) => {
  console.error("Failed to build basemap styles:", error.message);
  process.exitCode = 1;
});
