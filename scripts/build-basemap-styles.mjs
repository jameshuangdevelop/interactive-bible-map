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
const naturalEarthCountriesUrl =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson";
const naturalEarthDisputedAreasUrl =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_disputed_areas.geojson";
const naturalEarthBoundaryLinesSha256 = "2faac4f6b34386f3d21b6e018cf151f241f00e5c936d44dd17d7d9bfb147fa48";
const naturalEarthCountriesSha256 = "3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb";
const naturalEarthDisputedAreasSha256 =
  "9cafef8b7dfb6b164dc58f218f981f4ace9f716f6c03795d4c62d1ac9f3d50f5";

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

const libertyModernName = "Interactive Bible Map modern basemap (modified from OpenFreeMap Liberty)";
const libertyModernMetadataLicense =
  "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: modern-map treatment (English-only labels with name:en fallback to name:latin; points of interest and airport labels removed; Natural Earth low-zoom boundary source with geometry masks for contested areas; OpenMapTiles country boundaries only at z5+ with disputed filters, ISR/PSE side exclusions and a regional neutrality mask, without asserting sovereignty); max zoom set to 14. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0; Natural Earth boundary lines and masks: public domain. Full notices and disclaimers: LICENSE.txt in the same folder as this file.";

const versaTilesModernName =
  "Interactive Bible Map backup modern basemap (modified from VersaTiles Colorful)";
const versaTilesModernMetadataNotice =
  "Modified for outage-only fallback use by Interactive Bible Map. Changes: modern-map treatment (English-only labels from name_en only; points of interest and airport labels removed; tile boundary layers removed; Natural Earth boundary lines used at all zooms with geometry masks for contested areas, without asserting sovereignty); max zoom set to 14.";

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
- Modern-map treatment: use English-only labels from name_en only
- Remove points of interest and airport labels
- Remove tile boundary layers (including maritime)
- Use Natural Earth boundary lines (public domain) for country borders at all zooms
- Apply geometry masks in contested areas as a neutrality treatment (this is not a sovereignty claim)
- Max zoom set to 14

Attribution string used in the vector source:
${versaTilesAttribution}
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
const modernNeutralBoundarySourceId = "ibm-modern-neutral-boundaries";
const libertyModernNeutralBoundaryLayerId = "ibm-modern-neutral-boundary";
const versaTilesModernNeutralBoundaryLayerId = "ibm-modern-neutral-boundary";
const modernNeutralBoundaryGeoJsonRelativeUrl = "/styles/shared/modern-neutral-boundaries.geojson";
const simplifiedBoundaryToleranceDegrees = 0.25;
const lineClipBufferDegrees = 0.05;
const israelRegionMaskRectangle = {
  type: "Polygon",
  coordinates: [[
    [34.05, 29.35],
    [36.30, 29.35],
    [36.30, 33.65],
    [34.05, 33.65],
    [34.05, 29.35]
  ]]
};
const neutralMaskRegionDefinitions = [
  {
    id: "israel-palestine-golan",
    countries: ["Israel", "Palestine"],
    disputedAreas: ["Golan Heights"]
  },
  {
    id: "northern-cyprus",
    disputedAreas: ["Turkish Republic of Northern Cyprus", "United Nations Buffer Zone in Cyprus"]
  },
  { id: "crimea", disputedAreas: ["Crimean Peninsula"] },
  { id: "kosovo", disputedAreas: ["Kosovo"] },
  { id: "western-sahara", disputedAreas: ["Western Sahara"] },
  { id: "abkhazia", disputedAreas: ["Abkhazia"] },
  { id: "south-ossetia", disputedAreas: ["South Ossetia"] },
  { id: "transnistria", disputedAreas: ["Transnistria"] },
  { id: "nagorno-karabakh", disputedAreas: ["Nagorno-Karabakh"] }
];

function modernEnglishLabelExpression(preferredFields) {
  const expression = ["coalesce"];
  for (const field of preferredFields) {
    expression.push(["get", field]);
  }
  return expression;
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

function appendDisputedFilterExclusion(existingFilter) {
  const disputedFilter = ["!=", ["get", "disputed"], true];
  if (!existingFilter) {
    return disputedFilter;
  }

  return ["all", existingFilter, disputedFilter];
}

function appendContestedMaskExclusion(existingFilter) {
  const maskExclusion = ["!", ["within", israelRegionMaskRectangle]];

  if (!existingFilter) {
    return maskExclusion;
  }

  return ["all", existingFilter, maskExclusion];
}

function appendLibertyIsraPalExclusion(existingFilter) {
  const exclusions = [
    ["!=", ["get", "adm0_l"], "ISR"],
    ["!=", ["get", "adm0_l"], "PSE"],
    ["!=", ["get", "adm0_r"], "ISR"],
    ["!=", ["get", "adm0_r"], "PSE"]
  ];

  if (!existingFilter) {
    return ["all", ...exclusions];
  }

  if (Array.isArray(existingFilter) && existingFilter[0] === "all") {
    return [...existingFilter, ...exclusions];
  }

  return ["all", existingFilter, ...exclusions];
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

function createNeutralBoundaryGeoJson(boundaryGeoJson, maskPolygons, simplifyToleranceDegrees) {
  const relevantFeatures = (boundaryGeoJson.features ?? []).filter(
    (feature) =>
      (feature?.properties?.FEATURECLA ?? feature?.properties?.featurecla) ===
      "International boundary (verify)"
  );

  const boundaryFeatureCollection = {
    type: "FeatureCollection",
    features: relevantFeatures.map((feature, index) => ({
      type: "Feature",
      properties: {
        id: feature.properties?.NE_ID ?? feature.properties?.ne_id ?? `boundary-${index + 1}`,
        featurecla:
          feature.properties?.FEATURECLA ??
          feature.properties?.featurecla ??
          "International boundary (verify)"
      },
      geometry: feature.geometry
    }))
  };

  const clippedFeatures = clipFeatureCollectionOutsideMasks(boundaryFeatureCollection, maskPolygons)
    .features
    .map((feature) => simplifyFeature(feature, simplifyToleranceDegrees))
    .filter((feature) => feature != null);

  return {
    type: "FeatureCollection",
    features: clippedFeatures
  };
}

function ensureNoNeutralBoundaryVerticesInsideMasks(neutralBoundaryGeoJson, maskPolygons) {
  for (const feature of neutralBoundaryGeoJson.features ?? []) {
    if (feature?.geometry?.type !== "LineString") {
      continue;
    }
    for (const point of feature.geometry.coordinates) {
      if (isPointStrictlyInsideAnyPolygon(point, maskPolygons)) {
        return false;
      }
    }
  }
  return true;
}

function createMaskFeatureCollection(maskPolygons) {
  return {
    type: "FeatureCollection",
    features: maskPolygons.map((coordinates, index) => ({
      type: "Feature",
      properties: { id: `neutral-mask-${index + 1}` },
      geometry: { type: "Polygon", coordinates }
    }))
  };
}

function createNeutralBoundarySourceDefinition() {
  return {
    type: "geojson",
    data: modernNeutralBoundaryGeoJsonRelativeUrl,
    attribution:
      "Boundary lines: Natural Earth (public domain); filtered and masked by Interactive Bible Map as a neutrality treatment"
  };
}

function createNeutralBoundaryLineLayer(layerId) {
  return {
    id: layerId,
    type: "line",
    source: modernNeutralBoundarySourceId,
    layout: {},
    paint: {
      "line-color": "hsl(0, 0%, 50%)",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 4, 1],
      "line-opacity": 1
    }
  };
}

function applyNaturalEarthBoundaryLayerAtAllZooms({
  style,
  beforeLayerId,
  layerId
}) {
  style.sources = style.sources ?? {};
  style.sources[modernNeutralBoundarySourceId] = createNeutralBoundarySourceDefinition();
  const existingLayerIndex = style.layers.findIndex((layer) => layer.id === layerId);
  if (existingLayerIndex >= 0) {
    style.layers.splice(existingLayerIndex, 1);
  }
  const targetIndex = style.layers.findIndex((layer) => layer.id === beforeLayerId);
  const neutralLayer = createNeutralBoundaryLineLayer(layerId);
  if (targetIndex < 0) {
    style.layers.push(neutralLayer);
    return;
  }
  style.layers.splice(targetIndex, 0, neutralLayer);
}

function applyNaturalEarthBoundaryLayerForLowZoom({
  style,
  beforeLayerId,
  layerId,
  maxzoom
}) {
  applyNaturalEarthBoundaryLayerAtAllZooms({ style, beforeLayerId, layerId });
  const neutralLayer = style.layers.find((layer) => layer.id === layerId);
  if (neutralLayer != null) {
    neutralLayer.maxzoom = maxzoom;
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

    if (libertyPoiLayerIdPattern.test(layer.id)) {
      return false;
    }

    return true;
  });
}

function updateLibertyModernLabelFields(style) {
  const englishOnlyExpression = [
    "case",
    ["==", ["get", "name:en"], "T"],
    ["get", "name:latin"],
    modernEnglishLabelExpression(["name:en", "name:latin"])
  ];
  const replaceFieldNames = new Set(["name", "name:en", "name:latin", "name:nonlatin", "name_en"]);

  for (const layer of style.layers) {
    if (layer.type !== "symbol" || labelSourceLayerIdsToExclude.has(layer["source-layer"])) {
      continue;
    }

    if (!layer.layout || !("text-field" in layer.layout)) {
      continue;
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

    layer.filter = appendDisputedFilterExclusion(layer.filter);
  }
}

function updateVersaTilesModernLabelFields(style) {
  const englishOnlyExpression = modernEnglishLabelExpression(["name_en"]);
  for (const layer of style.layers) {
    if (!layer.layout || !("text-field" in layer.layout)) {
      continue;
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
    countryBoundaryLayer.minzoom = 5;
    countryBoundaryLayer.filter = appendLibertyIsraPalExclusion(
      appendContestedMaskExclusion(countryBoundaryLayer.filter)
    );
  }
  applyNaturalEarthBoundaryLayerForLowZoom({
    style,
    beforeLayerId: "boundary_2",
    layerId: libertyModernNeutralBoundaryLayerId,
    maxzoom: 5
  });
  updateLibertyModernLabelFields(style);
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
    layerId: versaTilesModernNeutralBoundaryLayerId
  });
  updateVersaTilesModernLabelFields(style);
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
  const [
    libertyUpstream,
    versaTilesUpstream,
    naturalEarthBoundaryLinesText,
    naturalEarthCountriesText,
    naturalEarthDisputedAreasText
  ] = await Promise.all([
    fetchJson(libertyStyleUrl),
    fetchJson(versaTilesColorfulStyleUrl),
    fetchText(naturalEarthBoundaryLinesUrl),
    fetchText(naturalEarthCountriesUrl),
    fetchText(naturalEarthDisputedAreasUrl)
  ]);

  const naturalEarthBoundaryLinesHash = createHash("sha256")
    .update(naturalEarthBoundaryLinesText, "utf8")
    .digest("hex");
  if (naturalEarthBoundaryLinesHash !== naturalEarthBoundaryLinesSha256) {
    throw new Error(
      `Natural Earth boundary SHA mismatch: expected ${naturalEarthBoundaryLinesSha256}, got ${naturalEarthBoundaryLinesHash}`
    );
  }

  const naturalEarthCountriesHash = createHash("sha256")
    .update(naturalEarthCountriesText, "utf8")
    .digest("hex");
  if (naturalEarthCountriesHash !== naturalEarthCountriesSha256) {
    throw new Error(
      `Natural Earth countries SHA mismatch: expected ${naturalEarthCountriesSha256}, got ${naturalEarthCountriesHash}`
    );
  }

  const naturalEarthDisputedAreasHash = createHash("sha256")
    .update(naturalEarthDisputedAreasText, "utf8")
    .digest("hex");
  if (naturalEarthDisputedAreasHash !== naturalEarthDisputedAreasSha256) {
    throw new Error(
      `Natural Earth disputed SHA mismatch: expected ${naturalEarthDisputedAreasSha256}, got ${naturalEarthDisputedAreasHash}`
    );
  }

  const naturalEarthBoundaryGeoJson = JSON.parse(naturalEarthBoundaryLinesText);
  const naturalEarthCountriesGeoJson = JSON.parse(naturalEarthCountriesText);
  const naturalEarthDisputedGeoJson = JSON.parse(naturalEarthDisputedAreasText);

  const neutralMaskPolygonCoordinates = collectNeutralMaskPolygonCoordinates({
    countryGeoJson: naturalEarthCountriesGeoJson,
    disputedAreasGeoJson: naturalEarthDisputedGeoJson,
    regionDefinitions: neutralMaskRegionDefinitions
  });
  const bufferedMaskPolygonCoordinates = createBufferedMaskPolygonCoordinates(
    neutralMaskPolygonCoordinates,
    lineClipBufferDegrees
  );
  const neutralBoundaryGeoJson = createNeutralBoundaryGeoJson(
    naturalEarthBoundaryGeoJson,
    bufferedMaskPolygonCoordinates,
    simplifiedBoundaryToleranceDegrees
  );
  if (!ensureNoNeutralBoundaryVerticesInsideMasks(neutralBoundaryGeoJson, bufferedMaskPolygonCoordinates)) {
    throw new Error("Neutral boundary output still contains vertices inside a contested-area mask.");
  }

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
  const neutralMaskGeoJson = createMaskFeatureCollection(bufferedMaskPolygonCoordinates);
  await fs.writeFile(
    path.join(sharedStylesOutputDirectory, "modern-neutral-boundary-masks.geojson"),
    `${JSON.stringify(neutralMaskGeoJson)}\n`,
    "utf8"
  );
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
  console.log(" - app/public/styles/shared/modern-neutral-boundary-masks.geojson");
  console.log(" - app/public/styles/shared/modern-neutral-boundaries.geojson");
}

buildStyles().catch((error) => {
  console.error("Failed to build basemap styles:", error.message);
  process.exitCode = 1;
});
