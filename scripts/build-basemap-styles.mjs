import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const stylesOutputDirectory = path.join(repositoryRoot, "app", "public", "styles");
const sharedStylesOutputDirectory = path.join(stylesOutputDirectory, "shared");

const libertyStyleUrl = "https://tiles.openfreemap.org/styles/liberty";
const versaTilesColorfulStyleUrl =
  "https://tiles.versatiles.org/assets/styles/colorful/style.json";
const naturalEarthBoundaryLinesUrl =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_boundary_lines_land.geojson";
const naturalEarthBoundaryLinesSha256 = "2faac4f6b34386f3d21b6e018cf151f241f00e5c936d44dd17d7d9bfb147fa48";

const libertyAttribution =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const versaTilesAttribution =
  '<a href="https://versatiles.org" target="_blank">VersaTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="https://esa-worldcover.org/en/data-access" target="_blank">&copy; ESA WorldCover 2021</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>)';

const libertyName = "Interactive Bible Map physical basemap (modified from OpenFreeMap Liberty)";
const libertyMetadataLicense =
  "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: physical-map treatment only (relief shading, natural landcover, water, rivers and streams kept); all symbols, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom set to 14. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Full notices and disclaimers: LICENSE.txt in the same folder as this file.";

const versaTilesName =
  "Interactive Bible Map backup physical basemap (modified from VersaTiles Colorful)";
const versaTilesMetadataNotice =
  "Modified for outage-only fallback use by Interactive Bible Map. Changes: physical-map treatment only (natural landcover, water and waterways kept); all symbols, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom set to 14.";

const libertyLicensePartUrls = [
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/LICENSE.md",
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/styles/liberty/LICENSE.md",
  "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/styles/bright/LICENSE.md",
  "https://raw.githubusercontent.com/mapbox/mapbox-gl-styles/master/LICENSE.md"
];

const naturalEarthAttribution =
  '<a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>';

// The places where the modern styles draw no border line (ADR-0037, "borders on the modern map",
// item 6). docs/LICENSES.md and the "Sources & credits" text repeat this wording.
const modernNoBorderLineStatement =
  "Disputed borders are drawn as dashed lines, as Google Maps' default view draws them. A dashed line marks a border that is disputed; it is not a claim about where a border runs or who governs a place.";

const libertyModernName = "Interactive Bible Map modern basemap (modified from OpenFreeMap Liberty)";
const libertyModernMetadataLicense = `Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: modern-map treatment. Labels are in English only (the English name, or else the name in Latin script). Points of interest, airport labels, and state and province names are removed. To keep map dragging smooth, 3D buildings, road shields, one-way arrows, park outlines, and runway/taxiway layers are removed. Only country borders are drawn: from zoom 5 the tiles' own lines, and below zoom 5 Natural Earth's boundary lines, simplified. ${modernNoBorderLineStatement} Max zoom set to 14. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Country borders below zoom 5: Natural Earth (https://www.naturalearthdata.com/), public domain. Full notices and disclaimers: LICENSE.txt in the same folder as this file.`;

const versaTilesModernName =
  "Interactive Bible Map backup modern basemap (modified from VersaTiles Colorful)";
const versaTilesModernMetadataNotice = `Modified for outage-only fallback use by Interactive Bible Map. Changes: modern-map treatment. Labels are in English only. Points of interest, airport labels, and state and province names are removed. To keep map dragging smooth, 3D buildings, road shields, one-way arrows, park outlines, runway/taxiway layers, house numbers, and motorway exit/shield labels are removed. The tiles' boundary lines are removed, and the country borders at every zoom are Natural Earth's boundary lines (https://www.naturalearthdata.com/, public domain), simplified. ${modernNoBorderLineStatement} Max zoom set to 14.`;

const versaTilesNotice = `This file is part of Interactive Bible Map's outage-only fallback basemap.

Source style: VersaTiles Colorful
Source URL: ${versaTilesColorfulStyleUrl}
Source style license: CC0 1.0 (metadata.license in upstream style)
Fallback policy: use this style only when the primary OpenFreeMap Liberty basemap is unavailable.

Modifications in this copy:
- Physical-map treatment only: keep natural landcover, water and waterways
- Remove all symbols, roads, railways, aeroways, boundaries, landuse, parks and buildings
- Max zoom set to 14

Attribution string used in the vector source:
${versaTilesAttribution}
`;

const versaTilesModernNotice = `This file is part of Interactive Bible Map's outage-only fallback modern basemap.

Source style: VersaTiles Colorful
Source URL: ${versaTilesColorfulStyleUrl}
Source style license: CC0 1.0 (metadata.license in upstream style)
Fallback policy: use this style only when the primary OpenFreeMap Liberty modern basemap is unavailable.

Modifications in this copy:
- Modern-map treatment: labels in English only (name_en)
- Remove points of interest, airport labels, and state and province names
- Remove detail layers for smooth dragging: 3D buildings, road shields, one-way arrows, park outlines, runway/taxiway layers, house numbers, and motorway exit/shield labels
- Remove the tiles' boundary lines, including maritime boundaries
- Draw the country borders at every zoom from Natural Earth's boundary lines (public domain), simplified
- ${modernNoBorderLineStatement}
- Max zoom set to 14

Attribution string used in the vector source:
${versaTilesAttribution}

Attribution string used in the Natural Earth boundary source:
${naturalEarthAttribution}
`;

const libertySourceLandcoverLayerIds = new Set([
  "landcover_wood",
  "landcover_grass",
  "landcover_ice",
  "landcover_wetland",
  "landcover_sand"
]);
const libertyPhysicalLayerIds = new Set([
  "background",
  "natural_earth",
  "waterway_river",
  "waterway_other",
  "water",
  ...libertySourceLandcoverLayerIds
]);
const libertyAllowedLayerIds = new Set([
  "background",
  "natural_earth",
  "landcover",
  "waterway_river",
  "waterway_other",
  "water"
]);
const versaTilesAllowedLayerIds = new Set([
  "background",
  "slot-below-fills",
  "slot-below-streets",
  "water-ocean",
  "water-river",
  "water-canal",
  "water-stream",
  "water-ditch",
  "water-area",
  "water-area-river",
  "water-area-small",
  "land-rock",
  "land-forest",
  "land-grass",
  "land-vegetation",
  "land-sand",
  "land-wetland",
  "land-glacier"
]);

const labelSourceLayerIdsToExclude = new Set(["pois"]);
const libertyDisputedBoundaryLayerId = "boundary_disputed";
const libertySubNationalBoundaryLayerId = "boundary_3";
const versaTilesDisputedBoundaryLayerId = "boundary-country-disputed";
const libertyPoiLayerIdPattern = /^poi_/u;
const libertyModernDisputedBoundaryLayerId = "ibm-modern-boundary-disputed";
const modernNeutralBoundarySourceId = "ibm-modern-neutral-boundaries";
const libertyModernNeutralBoundarySolidLayerId = "ibm-modern-neutral-boundary-solid";
const libertyModernNeutralBoundaryDisputedLayerId = "ibm-modern-neutral-boundary-disputed";
const versaTilesModernNeutralBoundarySolidLayerId = "ibm-modern-neutral-boundary-fallback-solid";
const versaTilesModernNeutralBoundaryDisputedLayerId = "ibm-modern-neutral-boundary-fallback-disputed";
const modernNeutralBoundaryGeoJsonRelativeUrl = "/styles/shared/modern-neutral-boundaries.geojson";
const simplifiedBoundaryToleranceDegrees = 0.25;
const modernDisputedBorderDashArray = [4, 2];
const libertyContestedMaskRectangles = [];
const hiddenBoundaryAdm0Pairs = [];
const hiddenBoundaryNeIdsByPair = new Map();
const modernBoundaryRenderRules = [
  {
    id: "disputed-flag",
    render: "dashed",
    reason: "OpenMapTiles marks the line as disputed (`disputed = 1`).",
    expression: ["==", ["get", "disputed"], 1]
  },
  {
    id: "kosovo-serbia",
    render: "dashed",
    reason: "Google-style rendering: Kosovo–Serbia is dashed, even though nearby tiles mark it `disputed = 0`.",
    expression: [
      "any",
      ["all", ["==", ["get", "adm0_l"], "XKK"], ["==", ["get", "adm0_r"], "SRB"]],
      ["all", ["==", ["get", "adm0_l"], "SRB"], ["==", ["get", "adm0_r"], "XKK"]]
    ]
  },
  {
    id: "west-bank-and-gaza-lines",
    render: "dashed",
    reason:
      "Google-style rendering: the West Bank and Gaza lines are dashed; nearby tiles encode them as `adm0` features with one side missing and `disputed = 0`.",
    expression: [
      "any",
      [
        "all",
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
        ["==", ["coalesce", ["get", "maritime"], 0], 0],
        ["in", ["get", "adm0_l"], ["literal", ["ISR", "PSE"]]],
        ["!", ["has", "adm0_r"]]
      ],
      [
        "all",
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
        ["==", ["coalesce", ["get", "maritime"], 0], 0],
        ["in", ["get", "adm0_r"], ["literal", ["ISR", "PSE"]]],
        ["!", ["has", "adm0_l"]]
      ]
    ]
  },
  {
    id: "golan-claimed-by",
    render: "dashed",
    reason:
      "Google-style rendering: the Golan line is dashed; nearby tiles mark it with `disputed = 1` and `claimed_by` (`IL`/`SY`) but without `adm0_l`/`adm0_r`.",
    expression: ["in", ["get", "claimed_by"], ["literal", ["IL", "SY"]]]
  },
  {
    id: "cyprus-buffer-line",
    render: "dashed",
    reason:
      "Google-style rendering: Cyprus's internal divide is dashed; nearby tiles encode it as `admin_level = 3`, non-maritime, without `adm0_l`/`adm0_r`.",
    expression: [
      "all",
      ["==", ["coalesce", ["get", "admin_level"], 0], 3],
      ["==", ["coalesce", ["get", "maritime"], 0], 0],
      ["!", ["has", "adm0_l"]],
      ["!", ["has", "adm0_r"]]
    ]
  }
];
const naturalEarthBoundaryClassRules = [
  { featurecla: "International boundary (verify)", render: "solid" },
  { featurecla: "Disputed (please verify)", render: "dashed" },
  { featurecla: "Indefinite (please verify)", render: "dashed" },
  { featurecla: "Indeterminant frontier", render: "dashed" },
  { featurecla: "Line of control (please verify)", render: "dashed" }
];
const libertyModernPerformanceExcludedLayerIds = new Set([
  "building-3d",
  "park_outline",
  "aeroway_runway",
  "aeroway_taxiway",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us"
]);
const versaTilesModernPerformanceExcludedLayerIds = new Set([
  "label-address-housenumber",
  "marking-oneway",
  "marking-oneway-reverse",
  "label-motorway-exit",
  "label-motorway-shield"
]);

function modernEnglishLabelExpression(preferredFields) {
  const expression = ["coalesce"];
  for (const field of preferredFields) {
    expression.push(["get", field]);
  }
  return expression;
}

function tuneLibertyModernPerformance(style) {
  style.layers = style.layers.filter((layer) => !libertyModernPerformanceExcludedLayerIds.has(layer.id));
  for (const layer of style.layers) {
    if (layer.id === "highway-name-minor" || layer.id === "highway-name-path") {
      layer.minzoom = Math.max(12, layer.minzoom ?? 0);
      continue;
    }
    if (layer.id === "label_town") {
      layer.minzoom = Math.max(10, layer.minzoom ?? 0);
      continue;
    }
    if (layer.id === "label_village") {
      layer.minzoom = Math.max(10, layer.minzoom ?? 0);
      continue;
    }
    if (layer.id === "label_other") {
      layer.minzoom = Math.max(12, layer.minzoom ?? 0);
    }
  }
}

function tuneVersaTilesModernPerformance(style) {
  style.layers = style.layers.filter((layer) => !versaTilesModernPerformanceExcludedLayerIds.has(layer.id));
  for (const layer of style.layers) {
    if (layer.id === "label-place-town") {
      layer.minzoom = Math.max(10, layer.minzoom ?? 0);
      continue;
    }
    if (layer.id === "label-place-village" || layer.id === "label-place-hamlet") {
      layer.minzoom = Math.max(10, layer.minzoom ?? 0);
      continue;
    }
    if (
      layer.id === "label-street-track" ||
      layer.id === "label-street-pedestrian" ||
      layer.id === "label-street-livingstreet" ||
      layer.id === "label-street-residential" ||
      layer.id === "label-street-unclassified"
    ) {
      layer.minzoom = Math.max(13, layer.minzoom ?? 0);
    }
  }
}

function replaceLabelFieldExpression(value, predicate, replacement) {
  if (Array.isArray(value)) {
    if (
      value.length === 2 &&
      value[0] === "get" &&
      typeof value[1] === "string" &&
      predicate(value[1])
    ) {
      return structuredClone(replacement);
    }

    return value.map((entry) => replaceLabelFieldExpression(entry, predicate, replacement));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    return Object.fromEntries(
      entries.map(([key, entry]) => [
        key,
        replaceLabelFieldExpression(entry, predicate, replacement)
      ])
    );
  }

  return value;
}

function expressionContainsGetField(expression, fieldNames) {
  if (!Array.isArray(expression)) {
    return false;
  }

  if (
    expression.length === 2 &&
    expression[0] === "get" &&
    typeof expression[1] === "string" &&
    fieldNames.has(expression[1])
  ) {
    return true;
  }

  return expression.some((entry) => expressionContainsGetField(entry, fieldNames));
}

function buildModernTileRenderCondition(targetRender) {
  const expressions = modernBoundaryRenderRules
    .filter((rule) => rule.render === targetRender)
    .map((rule) => rule.expression);
  if (expressions.length === 0) {
    return null;
  }
  return ["any", ...expressions];
}

function appendModernTileRenderFilter(existingFilter, targetRender) {
  const dashedCondition = buildModernTileRenderCondition("dashed");
  const hiddenCondition = buildModernTileRenderCondition("hidden");
  let renderCondition = null;

  if (targetRender === "dashed") {
    renderCondition = dashedCondition;
  } else if (targetRender === "solid") {
    const exclusions = [dashedCondition, hiddenCondition].filter((condition) => condition != null);
    renderCondition =
      exclusions.length === 0 ? null : ["all", ...exclusions.map((condition) => ["!", condition])];
  } else if (targetRender === "hidden") {
    renderCondition = hiddenCondition;
  }

  if (!existingFilter && !renderCondition) {
    return null;
  }
  if (!existingFilter) {
    return renderCondition;
  }
  if (!renderCondition) {
    return existingFilter;
  }
  return ["all", existingFilter, renderCondition];
}

function appendDisputedFilterExclusion(existingFilter) {
  const disputedFilter = ["!=", ["get", "disputed"], true];
  if (!existingFilter) {
    return disputedFilter;
  }

  return ["all", existingFilter, disputedFilter];
}

function appendContestedMaskExclusion(existingFilter) {
  const withinMasks = libertyContestedMaskRectangles.map((rectanglePolygon) => [
    "within",
    rectanglePolygon
  ]);
  const maskExclusion = ["!", ["any", ...withinMasks]];

  if (!existingFilter) {
    return maskExclusion;
  }

  return ["all", existingFilter, maskExclusion];
}

function appendAdm0PairExclusions(existingFilter, excludedPairs) {
  const pairExclusions = excludedPairs.map(([leftCode, rightCode]) => [
    "!",
    [
      "any",
      ["all", ["==", ["get", "adm0_l"], leftCode], ["==", ["get", "adm0_r"], rightCode]],
      ["all", ["==", ["get", "adm0_l"], rightCode], ["==", ["get", "adm0_r"], leftCode]]
    ]
  ]);

  if (!existingFilter) {
    return ["all", ...pairExclusions];
  }

  if (Array.isArray(existingFilter) && existingFilter[0] === "all") {
    return [...existingFilter, ...pairExclusions];
  }

  return ["all", existingFilter, ...pairExclusions];
}

function appendArmeniaAzerbaijanMissingSideCodeExclusion(existingFilter) {
  const missingSideCodeExclusion = [
    "!",
    [
      "any",
      [
        "all",
        ["!", ["has", "adm0_l"]],
        ["in", ["get", "adm0_r"], ["literal", ["ARM", "AZE"]]]
      ],
      [
        "all",
        ["!", ["has", "adm0_r"]],
        ["in", ["get", "adm0_l"], ["literal", ["ARM", "AZE"]]]
      ]
    ]
  ];

  if (!existingFilter) {
    return missingSideCodeExclusion;
  }

  if (Array.isArray(existingFilter) && existingFilter[0] === "all") {
    return [...existingFilter, missingSideCodeExclusion];
  }

  return ["all", existingFilter, missingSideCodeExclusion];
}

function canonicalPairCode(leftCode, rightCode) {
  return [leftCode, rightCode].sort().join("|");
}

function featureMatchesHiddenAdm0Pair(properties, hiddenPairs, inferredPairCodes = null) {
  const leftCode = properties?.ADM0_A3_L ?? properties?.adm0_a3_l ?? properties?.adm0_l;
  const rightCode = properties?.ADM0_A3_R ?? properties?.adm0_a3_r ?? properties?.adm0_r;
  const fallbackLeftCode = inferredPairCodes?.[0];
  const fallbackRightCode = inferredPairCodes?.[1];
  const normalizedLeftCode =
    typeof leftCode === "string" && leftCode.length === 3 ? leftCode : fallbackLeftCode;
  const normalizedRightCode =
    typeof rightCode === "string" && rightCode.length === 3 ? rightCode : fallbackRightCode;
  if (typeof normalizedLeftCode !== "string" || typeof normalizedRightCode !== "string") {
    return false;
  }
  return hiddenPairs.some(
    ([pairLeftCode, pairRightCode]) =>
      (normalizedLeftCode === pairLeftCode && normalizedRightCode === pairRightCode) ||
      (normalizedLeftCode === pairRightCode && normalizedRightCode === pairLeftCode)
  );
}

function featureMatchesHiddenNeIdForPair(properties, hiddenPairs, hiddenNeIdsByPair) {
  const neId = properties?.NE_ID ?? properties?.ne_id;
  if (typeof neId !== "number") {
    return false;
  }
  for (const [leftCode, rightCode] of hiddenPairs) {
    const key = canonicalPairCode(leftCode, rightCode);
    const hiddenIds = hiddenNeIdsByPair.get(key);
    if (hiddenIds?.has(neId)) {
      return true;
    }
  }
  return false;
}

function normalizeDisputedAreaName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function asPolygonCoordinates(geometry) {
  if (geometry == null) {
    return [];
  }
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }
  return [];
}

function collectCountryPolygons(countryGeoJson, targetCountries) {
  const normalizedTargets = new Set(
    targetCountries.map((countryName) => normalizeDisputedAreaName(countryName))
  );
  const polygons = [];
  for (const feature of countryGeoJson.features ?? []) {
    if (feature?.geometry == null) {
      continue;
    }
    const name =
      feature.properties?.NAME_EN ??
      feature.properties?.NAME ??
      feature.properties?.ADMIN ??
      feature.properties?.name;
    if (!normalizedTargets.has(normalizeDisputedAreaName(name))) {
      continue;
    }
    polygons.push(...asPolygonCoordinates(feature.geometry));
  }
  return polygons;
}

function countryCodeFromProperties(properties) {
  const codeCandidates = [
    properties?.ADM0_A3,
    properties?.adm0_a3,
    properties?.ISO_A3,
    properties?.iso_a3
  ];
  for (const candidate of codeCandidates) {
    if (typeof candidate === "string" && candidate.length === 3) {
      return candidate;
    }
  }
  return null;
}

function buildCountryPolygonIndex(countryGeoJson) {
  const index = [];
  for (const feature of countryGeoJson.features ?? []) {
    if (!feature?.geometry || !feature?.properties) {
      continue;
    }
    const code = countryCodeFromProperties(feature.properties);
    if (code == null) {
      continue;
    }
    for (const polygonCoordinates of asPolygonCoordinates(feature.geometry)) {
      const outerRing = polygonCoordinates[0];
      if (!Array.isArray(outerRing) || outerRing.length < 4) {
        continue;
      }
      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;
      for (const [lng, lat] of outerRing) {
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      }
      index.push({
        code,
        bbox: [minLng, minLat, maxLng, maxLat],
        polygonCoordinates
      });
    }
  }
  return index;
}

function locateCountryCodeByPoint(point, countryPolygonIndex) {
  for (const entry of countryPolygonIndex) {
    const [minLng, minLat, maxLng, maxLat] = entry.bbox;
    if (point[0] < minLng || point[0] > maxLng || point[1] < minLat || point[1] > maxLat) {
      continue;
    }
    if (isPointStrictlyInsidePolygon(point, entry.polygonCoordinates)) {
      return entry.code;
    }
  }
  return null;
}

function inferBoundaryPairCodesFromGeometry(geometry, countryPolygonIndex) {
  const lines =
    geometry?.type === "LineString"
      ? [geometry.coordinates]
      : geometry?.type === "MultiLineString"
        ? geometry.coordinates
        : [];
  const offsetDegrees = 0.02;

  for (const lineCoordinates of lines) {
    if (!Array.isArray(lineCoordinates) || lineCoordinates.length < 2) {
      continue;
    }
    for (let index = 1; index < lineCoordinates.length; index += 1) {
      const [x1, y1] = lineCoordinates[index - 1];
      const [x2, y2] = lineCoordinates[index];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length === 0) {
        continue;
      }
      const midPoint = [(x1 + x2) / 2, (y1 + y2) / 2];
      const normal = [-dy / length, dx / length];
      const leftPoint = [
        midPoint[0] + normal[0] * offsetDegrees,
        midPoint[1] + normal[1] * offsetDegrees
      ];
      const rightPoint = [
        midPoint[0] - normal[0] * offsetDegrees,
        midPoint[1] - normal[1] * offsetDegrees
      ];
      const leftCode = locateCountryCodeByPoint(leftPoint, countryPolygonIndex);
      const rightCode = locateCountryCodeByPoint(rightPoint, countryPolygonIndex);
      if (leftCode == null || rightCode == null || leftCode === rightCode) {
        continue;
      }
      return [leftCode, rightCode];
    }
  }
  return null;
}

function collectDisputedAreaPolygons(disputedAreasGeoJson, targetAreaNames) {
  const normalizedTargets = new Set(
    targetAreaNames.map((areaName) => normalizeDisputedAreaName(areaName))
  );
  const polygons = [];
  for (const feature of disputedAreasGeoJson.features ?? []) {
    if (feature?.geometry == null) {
      continue;
    }
    const name =
      feature.properties?.NAME_EN ??
      feature.properties?.name_en ??
      feature.properties?.NAME ??
      feature.properties?.name ??
      feature.properties?.BRK_NAME ??
      feature.properties?.note_brk;
    if (!normalizedTargets.has(normalizeDisputedAreaName(name))) {
      continue;
    }
    polygons.push(...asPolygonCoordinates(feature.geometry));
  }
  return polygons;
}

function collectNeutralMaskPolygonCoordinates({
  countryGeoJson,
  disputedAreasGeoJson,
  regionDefinitions
}) {
  const polygonCoordinates = [];
  for (const definition of regionDefinitions) {
    const regionPolygons = [];
    if (Array.isArray(definition.countries) && definition.countries.length > 0) {
      regionPolygons.push(...collectCountryPolygons(countryGeoJson, definition.countries));
    }
    if (Array.isArray(definition.disputedAreas) && definition.disputedAreas.length > 0) {
      regionPolygons.push(
        ...collectDisputedAreaPolygons(disputedAreasGeoJson, definition.disputedAreas)
      );
    }
    if (regionPolygons.length === 0) {
      throw new Error(`Natural Earth mask region "${definition.id}" returned zero polygons.`);
    }
    polygonCoordinates.push(...regionPolygons);
  }
  return polygonCoordinates;
}

function createBufferedMaskPolygonCoordinates(polygonCoordinates, bufferDegrees) {
  const buffered = [];
  for (const coordinates of polygonCoordinates) {
    const outerRing = coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      continue;
    }
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of outerRing) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
    buffered.push([[
      [minLng - bufferDegrees, minLat - bufferDegrees],
      [maxLng + bufferDegrees, minLat - bufferDegrees],
      [maxLng + bufferDegrees, maxLat + bufferDegrees],
      [minLng - bufferDegrees, maxLat + bufferDegrees],
      [minLng - bufferDegrees, minLat - bufferDegrees]
    ]]);
  }
  return buffered;
}

function pointInRing(point, ring) {
  let intersects = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersectsHorizontal = yi > point[1] !== yj > point[1];
    if (!intersectsHorizontal) {
      continue;
    }
    const x = ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (point[0] < x) {
      intersects = !intersects;
    }
  }
  return intersects;
}

function isPointStrictlyInsidePolygon(point, polygonCoordinates) {
  const [outerRing, ...holes] = polygonCoordinates;
  if (!outerRing || !pointInRing(point, outerRing)) {
    return false;
  }
  for (const hole of holes) {
    if (pointInRing(point, hole)) {
      return false;
    }
  }
  return true;
}

function isPointStrictlyInsideAnyPolygon(point, maskPolygons) {
  return maskPolygons.some((polygon) => isPointStrictlyInsidePolygon(point, polygon));
}

function splitLineOutsideMasks(lineCoordinates, maskPolygons) {
  const segments = [];
  let currentSegment = [];
  for (const point of lineCoordinates) {
    if (isPointStrictlyInsideAnyPolygon(point, maskPolygons)) {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [];
      continue;
    }
    currentSegment.push(point);
  }
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }
  return segments;
}

function clipFeatureCollectionOutsideMasks(featureCollection, maskPolygons) {
  const clippedFeatures = [];
  for (const feature of featureCollection.features ?? []) {
    if (feature?.geometry == null) {
      continue;
    }
    if (feature.geometry.type === "LineString") {
      const segments = splitLineOutsideMasks(feature.geometry.coordinates, maskPolygons);
      for (const segment of segments) {
        clippedFeatures.push({
          type: "Feature",
          properties: feature.properties,
          geometry: {
            type: "LineString",
            coordinates: segment
          }
        });
      }
      continue;
    }
    if (feature.geometry.type === "MultiLineString") {
      for (const line of feature.geometry.coordinates) {
        const segments = splitLineOutsideMasks(line, maskPolygons);
        for (const segment of segments) {
          clippedFeatures.push({
            type: "Feature",
            properties: feature.properties,
            geometry: {
              type: "LineString",
              coordinates: segment
            }
          });
        }
      }
    }
  }

  return {
    type: "FeatureCollection",
    features: clippedFeatures
  };
}

function simplifyLineCoordinates(lineCoordinates, toleranceDegrees) {
  if (lineCoordinates.length <= 2) {
    return lineCoordinates;
  }
  const simplified = [lineCoordinates[0]];
  let last = lineCoordinates[0];
  for (let index = 1; index < lineCoordinates.length - 1; index += 1) {
    const current = lineCoordinates[index];
    const delta = Math.hypot(current[0] - last[0], current[1] - last[1]);
    if (delta >= toleranceDegrees) {
      simplified.push(current);
      last = current;
    }
  }
  simplified.push(lineCoordinates[lineCoordinates.length - 1]);
  return simplified.length > 1 ? simplified : lineCoordinates;
}

function simplifyFeature(feature, toleranceDegrees) {
  if (feature?.geometry?.type !== "LineString") {
    return feature;
  }
  const coordinates = simplifyLineCoordinates(feature.geometry.coordinates, toleranceDegrees).map(
    ([lng, lat]) => [Number(lng.toFixed(3)), Number(lat.toFixed(3))]
  );
  if (coordinates.length < 2) {
    return null;
  }
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates
    }
  };
}

function createNeutralBoundaryGeoJson(
  boundaryGeoJson,
  countryPolygonIndex,
  simplifyToleranceDegrees
) {
  const relevantFeatures = (boundaryGeoJson.features ?? []).filter(
    (feature) => {
      const featurecla =
        feature?.properties?.FEATURECLA ??
        feature?.properties?.featurecla ??
        "International boundary (verify)";
      const render = naturalEarthBoundaryClassRules.find(
        (rule) => rule.featurecla === featurecla
      )?.render;
      return render === "solid" || render === "dashed";
    }
  );

  const boundaryFeatureCollection = {
    type: "FeatureCollection",
    features: relevantFeatures.map((feature, index) => ({
      type: "Feature",
      properties: (() => {
        const inferredPairCodes = inferBoundaryPairCodesFromGeometry(
          feature.geometry,
          countryPolygonIndex
        );
        const leftCode =
          feature.properties?.ADM0_A3_L ??
          feature.properties?.adm0_a3_l ??
          feature.properties?.adm0_l ??
          inferredPairCodes?.[0];
        const rightCode =
          feature.properties?.ADM0_A3_R ??
          feature.properties?.adm0_a3_r ??
          feature.properties?.adm0_r ??
          inferredPairCodes?.[1];
        const featurecla =
          feature.properties?.FEATURECLA ??
          feature.properties?.featurecla ??
          "International boundary (verify)";
        const lineStyle =
          naturalEarthBoundaryClassRules.find((rule) => rule.featurecla === featurecla)?.render ??
          "solid";
        return {
          id: feature.properties?.NE_ID ?? feature.properties?.ne_id ?? `boundary-${index + 1}`,
          featurecla,
          lineStyle,
          adm0_a3_l: leftCode,
          adm0_a3_r: rightCode
        };
      })(),
      geometry: feature.geometry
    }))
  };

  const simplifiedFeatures = boundaryFeatureCollection.features
    .map((feature) => simplifyFeature(feature, simplifyToleranceDegrees))
    .filter((feature) => feature != null);

  return {
    type: "FeatureCollection",
    features: simplifiedFeatures
  };
}

function createNeutralBoundarySourceDefinition() {
  return {
    type: "geojson",
    data: modernNeutralBoundaryGeoJsonRelativeUrl,
    attribution: naturalEarthAttribution
  };
}

function createNeutralBoundaryLineLayer(layerId, lineStyle) {
  return {
    id: layerId,
    type: "line",
    source: modernNeutralBoundarySourceId,
    filter: ["==", ["get", "lineStyle"], lineStyle],
    layout: {},
    paint: {
      "line-color": lineStyle === "dashed" ? "hsl(248, 1%, 41%)" : "hsl(0, 0%, 50%)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 4, 1],
      ...(lineStyle === "dashed" ? { "line-dasharray": modernDisputedBorderDashArray } : {}),
      "line-opacity": 1
    }
  };
}

function applyNaturalEarthBoundaryLayerAtAllZooms({
  style,
  beforeLayerId,
  solidLayerId,
  dashedLayerId
}) {
  style.sources = style.sources ?? {};
  style.sources[modernNeutralBoundarySourceId] = createNeutralBoundarySourceDefinition();
  for (const layerId of [solidLayerId, dashedLayerId]) {
    const existingLayerIndex = style.layers.findIndex((layer) => layer.id === layerId);
    if (existingLayerIndex >= 0) {
      style.layers.splice(existingLayerIndex, 1);
    }
  }
  const targetIndex = style.layers.findIndex((layer) => layer.id === beforeLayerId);
  const solidLayer = createNeutralBoundaryLineLayer(solidLayerId, "solid");
  const dashedLayer = createNeutralBoundaryLineLayer(dashedLayerId, "dashed");
  if (targetIndex < 0) {
    style.layers.push(solidLayer, dashedLayer);
    return;
  }
  style.layers.splice(targetIndex, 0, solidLayer, dashedLayer);
}

function applyNaturalEarthBoundaryLayerForLowZoom({
  style,
  beforeLayerId,
  solidLayerId,
  dashedLayerId,
  maxzoom
}) {
  applyNaturalEarthBoundaryLayerAtAllZooms({ style, beforeLayerId, solidLayerId, dashedLayerId });
  for (const layerId of [solidLayerId, dashedLayerId]) {
    const neutralLayer = style.layers.find((layer) => layer.id === layerId);
    if (neutralLayer != null) {
      neutralLayer.maxzoom = maxzoom;
    }
  }
}

function removeLibertyModernExcludedLayers(style) {
  style.layers = style.layers.filter((layer) => {
    if (layer.id === libertyDisputedBoundaryLayerId) {
      return false;
    }

    if (layer.id === libertySubNationalBoundaryLayerId) {
      return false;
    }

    if (layer.id === "airport") {
      return false;
    }

    if (layer.id === "label_state") {
      return false;
    }

    if (libertyPoiLayerIdPattern.test(layer.id)) {
      return false;
    }

    return true;
  });
}

function appendClassExclusions(existingFilter, fieldName, disallowedValues) {
  const exclusions = disallowedValues.map((value) => ["!=", ["get", fieldName], value]);
  if (!existingFilter) {
    return ["all", ...exclusions];
  }

  if (Array.isArray(existingFilter) && existingFilter[0] === "all") {
    return [...existingFilter, ...exclusions];
  }

  return ["all", existingFilter, ...exclusions];
}

function updateLibertyModernLabelFields(style) {
  const englishOnlyExpression = modernEnglishLabelExpression(["name:en", "name:latin"]);
  const replaceFieldNames = new Set(["name", "name:en", "name:latin", "name:nonlatin", "name_en"]);

  for (const layer of style.layers) {
    if (layer.type !== "symbol" || labelSourceLayerIdsToExclude.has(layer["source-layer"])) {
      continue;
    }

    if (!layer.layout || !("text-field" in layer.layout)) {
      continue;
    }

    if (layer["source-layer"] === "place") {
      layer.filter = appendClassExclusions(layer.filter, "class", ["state", "province"]);
    }

    if (expressionContainsGetField(layer.layout["text-field"], replaceFieldNames)) {
      layer.layout["text-field"] = structuredClone(englishOnlyExpression);
    }
  }
}

function removeVersaTilesModernExcludedLayers(style) {
  style.layers = style.layers.filter((layer) => {
    if (
      layer.id === "boundary-country:outline" ||
      layer.id === "boundary-country" ||
      layer.id === "boundary-country-maritime"
    ) {
      return false;
    }

    if (layer.id === versaTilesDisputedBoundaryLayerId) {
      return false;
    }

    if (layer.id === "boundary-state:outline" || layer.id === "boundary-state") {
      return false;
    }

    if (layer.id === "label-boundary-state") {
      return false;
    }

    if (
      layer.id === "label-place-state" ||
      layer.id === "label-place-province" ||
      layer.id === "label-place-region"
    ) {
      return false;
    }

    if (layer.id.startsWith("poi-")) {
      return false;
    }

    if (layer.id === "symbol-transit-airfield" || layer.id === "symbol-transit-airport") {
      return false;
    }

    return true;
  });
}

function updateVersaTilesModernBoundaryFilters(style) {
  for (const layer of style.layers) {
    if (layer["source-layer"] !== "boundary_labels") {
      continue;
    }

    layer.filter = appendModernTileRenderFilter(layer.filter, "solid");
  }
}

function updateVersaTilesModernLabelFields(style) {
  const englishOnlyExpression = modernEnglishLabelExpression(["name_en"]);
  for (const layer of style.layers) {
    if (!layer.layout || !("text-field" in layer.layout)) {
      continue;
    }

    if (layer["source-layer"] === "place_labels") {
      layer.filter = appendClassExclusions(layer.filter, "kind", ["state", "province"]);
    }

    layer.layout["text-field"] = replaceLabelFieldExpression(
      layer.layout["text-field"],
      (fieldName) => fieldName === "name",
      englishOnlyExpression
    );
  }
}

function removeDisallowedLayerTypes(style) {
  style.layers = style.layers.filter((layer) => layer.type !== "symbol");
}

function clampVectorSourceMaxZoomTo14(style) {
  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (source.type !== "vector") {
      continue;
    }

    style.sources[sourceId] = {
      ...source,
      maxzoom: 14
    };
  }
}

function normalizeMaxZoom(style) {
  style.zoom = Math.min(14, typeof style.zoom === "number" ? style.zoom : 14);
  style.maxzoom = 14;
}

function createMergedLibertyLandcoverLayer() {
  const classes = ["wood", "grass", "ice", "wetland", "sand"];
  const wetlandMinZoom = 12;
  return {
    id: "landcover",
    type: "fill",
    source: "openmaptiles",
    "source-layer": "landcover",
    minzoom: 0,
    filter: ["in", ["get", "class"], ["literal", classes]],
    paint: {
      "fill-antialias": false,
      "fill-color": [
        "match",
        ["get", "class"],
        "wood",
        "hsla(98,61%,72%,0.7)",
        "grass",
        "rgba(176, 213, 154, 1)",
        "ice",
        "rgba(224, 236, 236, 1)",
        "wetland",
        "rgba(173, 205, 176, 1)",
        "sand",
        "rgba(247, 239, 195, 1)",
        "rgba(0, 0, 0, 0)"
      ],
      "fill-opacity": [
        "step",
        ["zoom"],
        [
          "match",
          ["get", "class"],
          "wood",
          0.4,
          "grass",
          0.3,
          "ice",
          0.8,
          "wetland",
          0,
          "sand",
          1,
          0
        ],
        wetlandMinZoom,
        [
          "match",
          ["get", "class"],
          "wood",
          0.4,
          "grass",
          0.3,
          "ice",
          0.8,
          "wetland",
          0.45,
          "sand",
          1,
          0
        ]
      ]
    }
  };
}

function setLibertyRasterFadeDuration(style) {
  const naturalEarthLayer = style.layers.find((layer) => layer.id === "natural_earth");
  if (!naturalEarthLayer || naturalEarthLayer.type !== "raster") {
    return;
  }

  naturalEarthLayer.paint = {
    ...(naturalEarthLayer.paint ?? {}),
    "raster-fade-duration": 0
  };
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

  removeDisallowedLayerTypes(style);
  style.layers = style.layers.filter((layer) => libertyPhysicalLayerIds.has(layer.id));

  const firstLandcoverLayerIndex = style.layers.findIndex((layer) =>
    libertySourceLandcoverLayerIds.has(layer.id)
  );
  if (firstLandcoverLayerIndex >= 0) {
    style.layers = style.layers.filter((layer) => !libertySourceLandcoverLayerIds.has(layer.id));
    style.layers.splice(firstLandcoverLayerIndex, 0, createMergedLibertyLandcoverLayer());
  }

  setLibertyRasterFadeDuration(style);
  style.layers = style.layers.filter((layer) => libertyAllowedLayerIds.has(layer.id));

  clampVectorSourceMaxZoomTo14(style);
  normalizeMaxZoom(style);
  return style;
}

function buildVersaTilesStyle(upstreamStyle) {
  const style = structuredClone(upstreamStyle);
  style.name = versaTilesName;
  style.metadata = {
    ...(style.metadata ?? {}),
    "interactive-bible-map:notice": versaTilesMetadataNotice
  };

  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (source.type !== "vector") {
      continue;
    }

    style.sources[sourceId] = { ...source, attribution: versaTilesAttribution };
  }

  removeDisallowedLayerTypes(style);
  style.layers = style.layers.filter((layer) => versaTilesAllowedLayerIds.has(layer.id));

  clampVectorSourceMaxZoomTo14(style);
  normalizeMaxZoom(style);
  return style;
}

function buildModernLibertyStyle(upstreamStyle) {
  const style = structuredClone(upstreamStyle);
  style.name = libertyModernName;
  style.metadata = {
    ...(style.metadata ?? {}),
    "interactive-bible-map:license": libertyModernMetadataLicense
  };

  if (style.sources.openmaptiles) {
    style.sources.openmaptiles = {
      ...style.sources.openmaptiles,
      attribution: libertyAttribution
    };
  }

  removeLibertyModernExcludedLayers(style);
  const countryBoundaryLayer = style.layers.find((layer) => layer.id === "boundary_2");
  if (countryBoundaryLayer) {
    const baseSolidBoundaryFilter = [
      "all",
      ["==", ["get", "admin_level"], 2],
      ["!=", ["get", "maritime"], 1]
    ];
    const baseDisputedBoundaryFilter = [
      "all",
      ["in", ["get", "admin_level"], ["literal", [2, 3]]],
      ["!=", ["get", "maritime"], 1]
    ];
    countryBoundaryLayer.minzoom = 5;
    countryBoundaryLayer.filter = appendModernTileRenderFilter(baseSolidBoundaryFilter, "solid");
    const disputedBoundaryLayer = structuredClone(countryBoundaryLayer);
    disputedBoundaryLayer.id = libertyModernDisputedBoundaryLayerId;
    disputedBoundaryLayer.filter = appendModernTileRenderFilter(baseDisputedBoundaryFilter, "dashed");
    disputedBoundaryLayer.paint = {
      ...(disputedBoundaryLayer.paint ?? {}),
      "line-color": "hsl(248, 1%, 41%)",
      "line-dasharray": modernDisputedBorderDashArray
    };
    const countryBoundaryLayerIndex = style.layers.findIndex((layer) => layer.id === "boundary_2");
    if (countryBoundaryLayerIndex >= 0) {
      style.layers.splice(countryBoundaryLayerIndex + 1, 0, disputedBoundaryLayer);
    } else {
      style.layers.push(disputedBoundaryLayer);
    }
  }
  applyNaturalEarthBoundaryLayerForLowZoom({
    style,
    beforeLayerId: "boundary_2",
    solidLayerId: libertyModernNeutralBoundarySolidLayerId,
    dashedLayerId: libertyModernNeutralBoundaryDisputedLayerId,
    maxzoom: 5
  });
  updateLibertyModernLabelFields(style);
  tuneLibertyModernPerformance(style);
  clampVectorSourceMaxZoomTo14(style);
  normalizeMaxZoom(style);
  return style;
}

function buildModernVersaTilesStyle(upstreamStyle) {
  const style = structuredClone(upstreamStyle);
  style.name = versaTilesModernName;
  style.metadata = {
    ...(style.metadata ?? {}),
    "interactive-bible-map:notice": versaTilesModernMetadataNotice
  };

  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (source.type !== "vector") {
      continue;
    }

    style.sources[sourceId] = { ...source, attribution: versaTilesAttribution };
  }

  removeVersaTilesModernExcludedLayers(style);
  updateVersaTilesModernBoundaryFilters(style);
  applyNaturalEarthBoundaryLayerAtAllZooms({
    style,
    beforeLayerId: "label-country-4",
    solidLayerId: versaTilesModernNeutralBoundarySolidLayerId,
    dashedLayerId: versaTilesModernNeutralBoundaryDisputedLayerId
  });
  updateVersaTilesModernLabelFields(style);
  tuneVersaTilesModernPerformance(style);
  clampVectorSourceMaxZoomTo14(style);
  normalizeMaxZoom(style);
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
  const [libertyUpstream, versaTilesUpstream, naturalEarthBoundaryLinesText] = await Promise.all([
    fetchJson(libertyStyleUrl),
    fetchJson(versaTilesColorfulStyleUrl),
    fetchText(naturalEarthBoundaryLinesUrl)
  ]);

  const naturalEarthBoundaryLinesHash = createHash("sha256")
    .update(naturalEarthBoundaryLinesText, "utf8")
    .digest("hex");
  if (naturalEarthBoundaryLinesHash !== naturalEarthBoundaryLinesSha256) {
    throw new Error(
      `Natural Earth boundary SHA mismatch: expected ${naturalEarthBoundaryLinesSha256}, got ${naturalEarthBoundaryLinesHash}`
    );
  }

  const naturalEarthBoundaryGeoJson = JSON.parse(naturalEarthBoundaryLinesText);
  const countryPolygonIndex = [];
  const neutralBoundaryGeoJson = createNeutralBoundaryGeoJson(
    naturalEarthBoundaryGeoJson,
    countryPolygonIndex,
    simplifiedBoundaryToleranceDegrees
  );

  const libertyStyle = buildLibertyStyle(libertyUpstream);
  const versaTilesStyle = buildVersaTilesStyle(versaTilesUpstream);
  const libertyModernStyle = buildModernLibertyStyle(libertyUpstream);
  const versaTilesModernStyle = buildModernVersaTilesStyle(versaTilesUpstream);

  const licenseParts = await Promise.all(libertyLicensePartUrls.map((url) => fetchText(url)));
  const libertyLicenseNotice = [
    libertyMetadataLicense,
    ...licenseParts.map((part) => part.trimEnd())
  ].join("\n\n-----\n\n");
  const libertyModernLicenseNotice = [
    libertyModernMetadataLicense,
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

  await writeStyleDirectory(
    path.join(stylesOutputDirectory, "liberty-modern"),
    libertyModernStyle,
    "LICENSE.txt",
    `${libertyModernLicenseNotice}\n`
  );

  await writeStyleDirectory(
    path.join(stylesOutputDirectory, "versatiles-colorful-modern"),
    versaTilesModernStyle,
    "NOTICE.txt",
    versaTilesModernNotice
  );

  await fs.mkdir(sharedStylesOutputDirectory, { recursive: true });
  const neutralBoundaryGeoJsonSerialized = `${JSON.stringify(neutralBoundaryGeoJson)}\n`;
  await fs.writeFile(
    path.join(sharedStylesOutputDirectory, "modern-neutral-boundaries.geojson"),
    neutralBoundaryGeoJsonSerialized,
    "utf8"
  );
  const neutralBoundaryGzipSize = gzipSync(Buffer.from(neutralBoundaryGeoJsonSerialized, "utf8")).length;
  console.log(
    ` - app/public/styles/shared/modern-neutral-boundaries.geojson (gzip ${neutralBoundaryGzipSize} bytes)`
  );

  console.log("Wrote hosted basemap styles:");
  console.log(" - app/public/styles/liberty/style.json");
  console.log(" - app/public/styles/liberty/LICENSE.txt");
  console.log(" - app/public/styles/versatiles-colorful/style.json");
  console.log(" - app/public/styles/versatiles-colorful/NOTICE.txt");
  console.log(" - app/public/styles/liberty-modern/style.json");
  console.log(" - app/public/styles/liberty-modern/LICENSE.txt");
  console.log(" - app/public/styles/versatiles-colorful-modern/style.json");
  console.log(" - app/public/styles/versatiles-colorful-modern/NOTICE.txt");
  console.log(" - app/public/styles/shared/modern-neutral-boundaries.geojson");
}

buildStyles().catch((error) => {
  console.error("Failed to build basemap styles:", error.message);
  process.exitCode = 1;
});
