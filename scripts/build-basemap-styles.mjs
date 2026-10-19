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
const naturalEarthDisputedAreas10mUrl =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_boundary_lines_disputed_areas.geojson";
const naturalEarthDisputedAreas10mSha256 =
  "69f19da764e6982b43aebae4b1a356ffe74c33f2a3cdb462637c0ba8e969c30b";

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

const modernNoBorderLineStatement =
  "Disputed borders, and cease-fire and armistice lines, are drawn as dashed lines, following the convention of Google Maps' international view. A dashed line marks a line whose status is disputed; it is not a claim about where a border runs or who governs a place.";

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
const modernDisputedLineColor = "hsl(248, 1%, 41%)";
const nonMaritimeBoundaryCondition = ["==", ["coalesce", ["get", "maritime"], 0], 0];
const modernBoundaryRenderRules = [
  {
    id: "disputed-flag",
    render: "dashed",
    reason:
      "OpenMapTiles marks the land line as disputed (`disputed = 1`), and Google-style rendering keeps that land line dashed.",
    expression: [
      "all",
      nonMaritimeBoundaryCondition,
      ["==", ["coalesce", ["get", "disputed"], 0], 1]
    ]
  },
  {
    id: "kosovo-serbia",
    render: "dashed",
    reason: "Google-style rendering: Kosovo–Serbia is dashed, even though nearby tiles mark it `disputed = 0`.",
    expression: [
      "any",
      [
        "all",
        nonMaritimeBoundaryCondition,
        ["==", ["get", "adm0_l"], "XKK"],
        ["==", ["get", "adm0_r"], "SRB"]
      ],
      [
        "all",
        nonMaritimeBoundaryCondition,
        ["==", ["get", "adm0_l"], "SRB"],
        ["==", ["get", "adm0_r"], "XKK"]
      ]
    ]
  },
  {
    id: "kosovo-serbia-missing-side-code",
    render: "dashed",
    reason:
      "Google-style rendering: short Kosovo–Serbia disputed pockets near Pančić's Peak are dashed where one side's code is missing.",
    expression: [
      "any",
      [
        "all",
        nonMaritimeBoundaryCondition,
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
        ["in", ["get", "adm0_l"], ["literal", ["XKK", "SRB"]]],
        ["!", ["has", "adm0_r"]]
      ],
      [
        "all",
        nonMaritimeBoundaryCondition,
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
        ["in", ["get", "adm0_r"], ["literal", ["XKK", "SRB"]]],
        ["!", ["has", "adm0_l"]]
      ]
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
        nonMaritimeBoundaryCondition,
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
        ["in", ["get", "adm0_l"], ["literal", ["ISR", "PSE"]]],
        ["!", ["has", "adm0_r"]]
      ],
      [
        "all",
        nonMaritimeBoundaryCondition,
        ["==", ["coalesce", ["get", "admin_level"], 0], 2],
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
    expression: [
      "all",
      nonMaritimeBoundaryCondition,
      ["in", ["get", "claimed_by"], ["literal", ["IL", "SY"]]]
    ]
  }
];
const modernNaturalEarthSupplementalDisputedRules = [
  {
    id: "cyprus-buffer-line",
    render: "dashed",
    source: "shared-existing",
    sourceFeatureIds: [1746708491],
    minzoom: 5,
    reason: "Cyprus's Green Line is dashed at every zoom by Natural Earth's line-of-control geometry."
  },
  {
    id: "crimea-isthmus-natural-earth-overlay",
    render: "dashed",
    source: "shared-existing",
    sourceFeatureIds: [1746708787],
    minzoom: 5,
    reason:
      "Keeps a visible dashed Crimea isthmus line at zooms 5–14, matching Google-style modern-border behavior when tile boundaries fragment."
  },
  {
    id: "western-sahara-claim-line",
    render: "dashed",
    source: "ne-10m-disputed-areas",
    sourceFeatureIds: [1746705527],
    minzoom: 5,
    reason:
      "The Western Sahara disputed border at 27°40′N is dashed at every zoom using Natural Earth's 1:10m disputed-areas line."
  },
  {
    id: "golan-west-line",
    render: "dashed",
    source: "ne-10m-disputed-areas",
    sourceFeatureIds: [1746705443],
    minzoom: 5,
    reason:
      "The west Golan claim line is dashed at every zoom using Natural Earth's 1:10m Syrian-claim feature."
  },
  {
    id: "abkhazia-breakaway-line",
    render: "dashed",
    source: "ne-10m-disputed-areas",
    sourceFeatureIds: [1746705383],
    minzoom: 5,
    reason:
      "Abkhazia is dashed at every zoom using Natural Earth's 1:10m Georgian-claim breakaway line."
  }
];
const naturalEarthBoundaryClassRules = [
  { featurecla: "International boundary (verify)", render: "solid" },
  { featurecla: "Disputed (please verify)", render: "dashed" },
  { featurecla: "Indefinite (please verify)", render: "dashed" },
  { featurecla: "Indeterminate frontier", render: "dashed" },
  { featurecla: "Indeterminant frontier", render: "dashed" },
  { featurecla: "Line of control (please verify)", render: "dashed" }
];
const naturalEarthBoundaryIdOverrides = new Map([
  [1746705327, { render: "solid", reason: "Israel–Lebanon is solid under current Google-style policy." }],
  [1746706755, { render: "dashed", reason: "Kosovo–Serbia is dashed below zoom 5 and on backup maps." }],
  [1746707901, { render: "dashed", reason: "Golan–Jordan is dashed to match the modern disputed-line policy." }],
  [1746708045, { render: "solid", reason: "Algeria–Morocco stays solid at both zoom ranges." }],
  [1746708837, { render: "hidden", reason: "Kerch Strait sea line is hidden because modern borders draw no maritime lines." }],
  [1746709045, { render: "dashed", reason: "Halaib and Bir Tawil disputed segments are dashed at both zoom ranges." }],
  [1746705351, { render: "hidden", reason: "Moroccan berm is hidden: it is a military wall, not a border line." }],
  [1746705379, { render: "hidden", reason: "Transnistria is hidden by policy pending human check." }]
]);
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

function createNeutralBoundaryGeoJson(boundaryGeoJson, simplifyToleranceDegrees) {
  const unsimplifiedBoundaryFeatureIds = new Set([1746708491, 1746708787]);
  const relevantFeatures = (boundaryGeoJson.features ?? []).filter(
    (feature) => {
      const maritimeValue =
        feature?.properties?.MARITIME ??
        feature?.properties?.maritime ??
        feature?.properties?.Maritime ??
        0;
      if (Number(maritimeValue) === 1) {
        return false;
      }
      const featurecla =
        feature?.properties?.FEATURECLA ??
        feature?.properties?.featurecla ??
        "International boundary (verify)";
      const featureId = Number(feature?.properties?.NE_ID ?? feature?.properties?.ne_id);
      const override = Number.isFinite(featureId)
        ? naturalEarthBoundaryIdOverrides.get(featureId)
        : null;
      const render = override?.render ??
        naturalEarthBoundaryClassRules.find((rule) => rule.featurecla === featurecla)?.render;
      return render === "solid" || render === "dashed";
    }
  );

  const boundaryFeatureCollection = {
    type: "FeatureCollection",
    features: relevantFeatures.map((feature, index) => ({
      type: "Feature",
      properties: (() => {
        const leftCode =
          feature.properties?.ADM0_A3_L ??
          feature.properties?.adm0_a3_l ??
          feature.properties?.adm0_l;
        const rightCode =
          feature.properties?.ADM0_A3_R ??
          feature.properties?.adm0_a3_r ??
          feature.properties?.adm0_r;
        const featurecla =
          feature.properties?.FEATURECLA ??
          feature.properties?.featurecla ??
          "International boundary (verify)";
        const featureId = Number(
          feature.properties?.NE_ID ?? feature.properties?.ne_id ?? `boundary-${index + 1}`
        );
        const override = Number.isFinite(featureId)
          ? naturalEarthBoundaryIdOverrides.get(featureId)
          : null;
        const lineStyle = override?.render ??
          naturalEarthBoundaryClassRules.find((rule) => rule.featurecla === featurecla)?.render ??
          "solid";
        return {
          id: Number.isFinite(featureId) ? featureId : `boundary-${index + 1}`,
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
    .map((feature) => {
      const featureId = Number(feature?.properties?.id);
      if (Number.isFinite(featureId) && unsimplifiedBoundaryFeatureIds.has(featureId)) {
        return feature;
      }
      return simplifyFeature(feature, simplifyToleranceDegrees);
    })
    .filter((feature) => feature != null);

  return {
    type: "FeatureCollection",
    features: simplifiedFeatures
  };
}

function createSupplementalDisputedBoundaryFeatures(disputedAreas10mGeoJson) {
  const disputedAreasRules = modernNaturalEarthSupplementalDisputedRules.filter(
    (rule) => rule.source === "ne-10m-disputed-areas"
  );
  if (disputedAreasRules.length === 0) {
    return [];
  }
  const featuresById = new Map(
    (disputedAreas10mGeoJson.features ?? []).map((feature) => [
      Number(feature?.properties?.ne_id),
      feature
    ])
  );
  const supplementalFeatures = [];
  for (const rule of disputedAreasRules) {
    for (const sourceFeatureId of rule.sourceFeatureIds) {
      const sourceFeature = featuresById.get(sourceFeatureId);
      if (!sourceFeature?.geometry) {
        throw new Error(
          `Missing Natural Earth 1:10m disputed feature ${sourceFeatureId} for rule '${rule.id}'.`
        );
      }
      const baseProperties = sourceFeature.properties ?? {};
      const featurecla =
        baseProperties.FEATURECLA ?? baseProperties.featurecla ?? "Disputed (please verify)";
      const leftCode = baseProperties.ADM0_A3_L ?? baseProperties.adm0_a3_l ?? baseProperties.adm0_l;
      const rightCode = baseProperties.ADM0_A3_R ?? baseProperties.adm0_a3_r ?? baseProperties.adm0_r;
      supplementalFeatures.push({
        type: "Feature",
        properties: {
          id: sourceFeatureId,
          featurecla,
          lineStyle: "dashed",
          adm0_a3_l: leftCode,
          adm0_a3_r: rightCode
        },
        geometry: sourceFeature.geometry
      });
    }
  }
  return supplementalFeatures;
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
      "line-color": modernDisputedLineColor,
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 4, 1],
      ...(lineStyle === "dashed" ? { "line-dasharray": modernDisputedBorderDashArray } : {}),
      "line-opacity": 1
    }
  };
}

function createNeutralBoundarySupplementalDisputedLayer({ layerId, sourceFeatureIds, minzoom }) {
  return {
    id: layerId,
    type: "line",
    source: modernNeutralBoundarySourceId,
    minzoom,
    filter: [
      "all",
      ["==", ["get", "lineStyle"], "dashed"],
      ["in", ["to-string", ["get", "id"]], ["literal", sourceFeatureIds.map((value) => String(value))]]
    ],
    layout: {},
    paint: {
      "line-color": modernDisputedLineColor,
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 5, 1.2, 12, 3],
      "line-dasharray": modernDisputedBorderDashArray,
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
      layer.id === "boundary-country-disputed:outline" ||
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
      "line-color": modernDisputedLineColor,
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
  const supplementalDisputedRules = modernNaturalEarthSupplementalDisputedRules.filter(
    (rule) => rule.render === "dashed"
  );
  const boundaryDisputedLayerIndex = style.layers.findIndex(
    (layer) => layer.id === libertyModernDisputedBoundaryLayerId
  );
  let insertionIndex =
    boundaryDisputedLayerIndex >= 0 ? boundaryDisputedLayerIndex + 1 : style.layers.length;
  for (const rule of supplementalDisputedRules) {
    const layerId = `ibm-modern-boundary-disputed-${rule.id}`;
    const supplementalLayer = createNeutralBoundarySupplementalDisputedLayer({
      layerId,
      sourceFeatureIds: rule.sourceFeatureIds,
      minzoom: rule.minzoom
    });
    style.layers.splice(insertionIndex, 0, supplementalLayer);
    insertionIndex += 1;
  }
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
  const [
    libertyUpstream,
    versaTilesUpstream,
    naturalEarthBoundaryLinesText,
    naturalEarthDisputedAreas10mText
  ] = await Promise.all([
    fetchJson(libertyStyleUrl),
    fetchJson(versaTilesColorfulStyleUrl),
    fetchText(naturalEarthBoundaryLinesUrl),
    fetchText(naturalEarthDisputedAreas10mUrl)
  ]);

  const naturalEarthBoundaryLinesHash = createHash("sha256")
    .update(naturalEarthBoundaryLinesText, "utf8")
    .digest("hex");
  if (naturalEarthBoundaryLinesHash !== naturalEarthBoundaryLinesSha256) {
    throw new Error(
      `Natural Earth boundary SHA mismatch: expected ${naturalEarthBoundaryLinesSha256}, got ${naturalEarthBoundaryLinesHash}`
    );
  }
  const naturalEarthDisputedAreas10mHash = createHash("sha256")
    .update(naturalEarthDisputedAreas10mText, "utf8")
    .digest("hex");
  if (naturalEarthDisputedAreas10mHash !== naturalEarthDisputedAreas10mSha256) {
    throw new Error(
      `Natural Earth 10m disputed-areas SHA mismatch: expected ${naturalEarthDisputedAreas10mSha256}, got ${naturalEarthDisputedAreas10mHash}`
    );
  }

  const naturalEarthBoundaryGeoJson = JSON.parse(naturalEarthBoundaryLinesText);
  const naturalEarthDisputedAreas10mGeoJson = JSON.parse(naturalEarthDisputedAreas10mText);
  const neutralBoundaryGeoJson = createNeutralBoundaryGeoJson(
    naturalEarthBoundaryGeoJson,
    simplifiedBoundaryToleranceDegrees
  );
  const supplementalDisputedBoundaryFeatures = createSupplementalDisputedBoundaryFeatures(
    naturalEarthDisputedAreas10mGeoJson
  );
  if (supplementalDisputedBoundaryFeatures.length > 0) {
    neutralBoundaryGeoJson.features.push(...supplementalDisputedBoundaryFeatures);
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
