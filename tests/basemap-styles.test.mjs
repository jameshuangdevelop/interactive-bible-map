import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");

const libertyAttribution =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const versaTilesAttribution =
  '<a href="https://versatiles.org" target="_blank">VersaTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a> · <a href="https://esa-worldcover.org/en/data-access" target="_blank">&copy; ESA WorldCover 2021</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>)';

const libertyStylePath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "liberty",
  "style.json"
);
const versaTilesStylePath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "versatiles-colorful",
  "style.json"
);
const libertyModernStylePath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "liberty-modern",
  "style.json"
);
const versaTilesModernStylePath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "versatiles-colorful-modern",
  "style.json"
);
const sharedModernNeutralBoundaryGeoJsonPath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "shared",
  "modern-neutral-boundaries.geojson"
);
const sharedModernNeutralBoundaryMasksGeoJsonPath = path.join(
  repositoryRoot,
  "app",
  "public",
  "styles",
  "shared",
  "modern-neutral-boundary-masks.geojson"
);
const expectedHiddenBoundaryPairs = [
  "ARM|AZE",
  "CYP|XNC",
  "ESH|MAR",
  "GEO|RUS",
  "ISR|PSE",
  "SRB|XKK"
];
const expectedHiddenNeIdsForSharedPairs = new Map([
  ["ARM|AZE", new Set([1746705689, 1746705697])],
  ["GEO|RUS", new Set([1746705547])]
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

const versaTilesExpectedLandKindsByLayer = new Map([
  ["land-rock", ["bare_rock", "scree", "shingle"]],
  ["land-forest", ["forest"]],
  ["land-grass", ["grass", "grassland", "meadow", "wet_meadow"]],
  ["land-vegetation", ["heath", "scrub"]],
  ["land-sand", ["beach", "sand"]],
  ["land-wetland", ["bog", "marsh", "string_bog", "swamp"]]
]);
const removedSourceLayers = new Set([
  "aeroway",
  "aerialways",
  "boundary",
  "boundaries",
  "boundary_labels",
  "building",
  "buildings",
  "landuse",
  "park",
  "place",
  "place_labels",
  "streets",
  "street_labels",
  "street_labels_points",
  "street_polygons",
  "streets_polygons_labels",
  "transportation",
  "transportation_name"
]);

async function readStyle(stylePath) {
  return JSON.parse(await fs.readFile(stylePath, "utf8"));
}

function assertNoSymbolLayers(style, styleName) {
  assert.equal(
    style.layers.some((layer) => layer.type === "symbol"),
    false,
    `${styleName} must not include symbol layers`
  );
}

function assertNoBoundaryLayers(style, styleName) {
  const hasBoundaryLayer = style.layers.some((layer) => {
    const sourceLayer = layer["source-layer"];
    return (
      (typeof sourceLayer === "string" && sourceLayer.includes("boundar")) ||
      layer.id.includes("boundary")
    );
  });

  assert.equal(hasBoundaryLayer, false, `${styleName} must not include boundary layers`);
}

function assertInClassFilter(filter, expectedClasses, description) {
  assert.ok(Array.isArray(filter), `${description}: filter must be an array expression`);
  assert.equal(filter[0], "in", `${description}: filter must start with 'in'`);
  assert.deepEqual(filter[1], ["get", "class"], `${description}: filter must read class`);
  assert.ok(Array.isArray(filter[2]), `${description}: filter must use a literal class array`);
  assert.equal(filter[2][0], "literal", `${description}: filter must use literal class values`);
  assert.ok(Array.isArray(filter[2][1]), `${description}: literal class list must be an array`);
  assert.deepEqual(
    [...filter[2][1]].sort(),
    [...expectedClasses].sort(),
    `${description}: unexpected class values in filter`
  );
}

function classOpacityByName(matchExpression, description) {
  assert.ok(Array.isArray(matchExpression), `${description}: match expression must be an array`);
  assert.equal(matchExpression[0], "match", `${description}: expected 'match' expression`);
  assert.deepEqual(
    matchExpression[1],
    ["get", "class"],
    `${description}: match expression must read class`
  );

  const opacities = new Map();
  for (let index = 2; index < matchExpression.length - 1; index += 2) {
    opacities.set(matchExpression[index], matchExpression[index + 1]);
  }
  return opacities;
}

function assertLibertyMergedLandcover(style) {
  const layer = style.layers.find((candidate) => candidate.id === "landcover");
  assert.ok(layer, "Liberty style must include merged landcover layer");
  assert.equal(layer.type, "fill", "Liberty landcover must be a fill layer");
  assert.equal(layer.source, "openmaptiles", "Liberty landcover must use openmaptiles source");
  assert.equal(
    layer["source-layer"],
    "landcover",
    "Liberty landcover must use landcover source-layer"
  );
  assert.equal(
    layer.minzoom ?? 0,
    0,
    "Liberty merged landcover should keep wood, grass, ice and sand visible from zoom 0"
  );

  assertInClassFilter(
    layer.filter,
    ["wood", "grass", "ice", "wetland", "sand"],
    "Liberty merged landcover"
  );

  assert.deepEqual(
    layer.paint["fill-color"]?.slice(0, 2),
    ["match", ["get", "class"]],
    "Liberty merged landcover must map fill-color by class with a match expression"
  );
  assert.deepEqual(
    layer.paint["fill-opacity"]?.slice(0, 2),
    ["step", ["zoom"]],
    "Liberty merged landcover must gate wetland opacity by zoom"
  );

  const fillOpacity = layer.paint["fill-opacity"];
  assert.ok(Array.isArray(fillOpacity), "Liberty merged landcover fill-opacity must be an array");
  assert.equal(fillOpacity[3], 12, "Liberty wetland opacity gate should start at zoom 12");
  const lowZoomOpacityByClass = classOpacityByName(fillOpacity[2], "Liberty merged landcover low-zoom");
  const highZoomOpacityByClass = classOpacityByName(
    fillOpacity[4],
    "Liberty merged landcover high-zoom"
  );

  assert.equal(
    lowZoomOpacityByClass.get("wood"),
    0.4,
    "Liberty wood landcover should remain visible from zoom 0"
  );
  assert.equal(
    lowZoomOpacityByClass.get("grass"),
    0.3,
    "Liberty grass landcover should remain visible from zoom 0"
  );
  assert.equal(
    lowZoomOpacityByClass.get("ice"),
    0.8,
    "Liberty ice landcover should remain visible from zoom 0"
  );
  assert.equal(
    lowZoomOpacityByClass.get("sand"),
    1,
    "Liberty sand landcover should remain visible from zoom 0"
  );
  assert.equal(
    highZoomOpacityByClass.get("wood"),
    0.4,
    "Liberty wood landcover opacity should stay unchanged at zoom 12+"
  );
  assert.equal(
    highZoomOpacityByClass.get("grass"),
    0.3,
    "Liberty grass landcover opacity should stay unchanged at zoom 12+"
  );
  assert.equal(
    highZoomOpacityByClass.get("ice"),
    0.8,
    "Liberty ice landcover opacity should stay unchanged at zoom 12+"
  );
  assert.equal(
    highZoomOpacityByClass.get("sand"),
    1,
    "Liberty sand landcover opacity should stay unchanged at zoom 12+"
  );
  assert.deepEqual(
    lowZoomOpacityByClass.get("wetland"),
    0,
    "Liberty wetland landcover should stay hidden before zoom 12"
  );
  assert.deepEqual(
    highZoomOpacityByClass.get("wetland"),
    0.45,
    "Liberty wetland landcover should keep its original zoom 12 visibility"
  );
}

function assertLibertyRasterFadeDisabled(style) {
  const naturalEarthLayer = style.layers.find((layer) => layer.id === "natural_earth");
  assert.ok(naturalEarthLayer, "Liberty natural_earth layer must exist");
  assert.equal(
    naturalEarthLayer.paint?.["raster-fade-duration"],
    0,
    "Liberty natural_earth raster fade must be disabled"
  );
}

function assertLayerAllowList(style, styleName, allowedLayerIds) {
  const actualLayerIds = style.layers.map((layer) => layer.id);

  for (const layer of style.layers) {
    assert.equal(
      allowedLayerIds.has(layer.id),
      true,
      `${styleName} layer '${layer.id}' is not in the explicit allow-list`
    );
  }

  for (const allowedLayerId of allowedLayerIds) {
    assert.equal(
      actualLayerIds.includes(allowedLayerId),
      true,
      `${styleName} allow-listed layer '${allowedLayerId}' is missing from generated style`
    );
  }
}

function kindFilterValues(filter) {
  if (!Array.isArray(filter) || filter[0] !== "in") {
    return null;
  }

  const getter = filter[1];
  const literal = filter[2];
  if (
    !Array.isArray(getter) ||
    getter[0] !== "get" ||
    getter[1] !== "kind" ||
    !Array.isArray(literal) ||
    literal[0] !== "literal" ||
    !Array.isArray(literal[1])
  ) {
    return null;
  }

  return literal[1];
}

function assertVersaTilesLandFilters(style) {
  for (const [layerId, expectedKinds] of versaTilesExpectedLandKindsByLayer) {
    const layer = style.layers.find((candidate) => candidate.id === layerId);
    assert.ok(layer, `VersaTiles layer '${layerId}' must exist`);

    const kinds = kindFilterValues(layer.filter);
    assert.ok(kinds, `VersaTiles layer '${layerId}' must use a kind filter`);
    assert.deepEqual(
      [...kinds].sort(),
      [...expectedKinds].sort(),
      `VersaTiles layer '${layerId}' must keep only expected natural-land kinds`
    );
  }
}

function assertRemovedSourceLayers(style, styleName) {
  for (const layer of style.layers) {
    const sourceLayer = layer["source-layer"];
    if (!sourceLayer) {
      continue;
    }

    assert.equal(
      removedSourceLayers.has(sourceLayer),
      false,
      `${styleName} layer '${layer.id}' must not use removed source-layer '${sourceLayer}'`
    );
  }
}

function assertMaxZoom14(style, styleName) {
  assert.equal(style.maxzoom, 14, `${styleName} maxzoom must be 14`);
  for (const [sourceId, source] of Object.entries(style.sources)) {
    if (source.type !== "vector") {
      continue;
    }

    assert.equal(
      source.maxzoom,
      14,
      `${styleName} vector source '${sourceId}' must have maxzoom 14`
    );
  }
}

function assertLayerMissing(style, layerId, styleName) {
  assert.equal(
    style.layers.some((layer) => layer.id === layerId),
    false,
    `${styleName} must not include layer '${layerId}'`
  );
}

function assertNoLayerIdsMatching(style, pattern, styleName, description) {
  const matchingLayerIds = style.layers.filter((layer) => pattern.test(layer.id)).map((layer) => layer.id);
  assert.deepEqual(
    matchingLayerIds,
    [],
    `${styleName} must not include ${description}: ${matchingLayerIds.join(", ")}`
  );
}

function assertLibertyModernLabels(style) {
  const expected = [
    "case",
    ["==", ["get", "name:en"], "T"],
    ["get", "name:latin"],
    ["coalesce", ["get", "name:en"], ["get", "name:latin"]]
  ];
  const layers = style.layers.filter((layer) =>
    [
      "waterway_line_label",
      "water_name_point_label",
      "water_name_line_label",
      "highway-name-path",
      "highway-name-minor",
      "highway-name-major",
      "label_other",
      "label_village",
      "label_town",
      "label_city",
      "label_city_capital",
      "label_country_3",
      "label_country_2",
      "label_country_1"
    ].includes(layer.id)
  );
  assert.equal(layers.length > 0, true, "Liberty modern style must keep core label layers");
  for (const layer of layers) {
    assert.deepEqual(
      layer.layout?.["text-field"],
      expected,
      `Liberty modern layer '${layer.id}' must use English-only text field`
    );
  }
}

function assertNoStateOrProvincePlaceClassLayers(style, styleName) {
  for (const layer of style.layers) {
    if (layer.type !== "symbol") {
      continue;
    }
    const sourceLayer = layer["source-layer"];
    if (sourceLayer !== "place" && sourceLayer !== "place_labels") {
      continue;
    }
    const filterText = JSON.stringify(layer.filter ?? []);
    assert.equal(
      filterText.includes('"state"'),
      false,
      `${styleName} layer '${layer.id}' must not target place class/kind 'state'`
    );
    assert.equal(
      filterText.includes('"province"'),
      false,
      `${styleName} layer '${layer.id}' must not target place class/kind 'province'`
    );
  }
}

function assertVersaTilesModernNameFields(style) {
  const expected = ["coalesce", ["get", "name_en"]];
  const layers = style.layers.filter((layer) =>
    [
      "label-place-city",
      "label-place-town",
      "label-place-village",
      "label-boundary-country-large",
      "label-water-area-major",
      "label-water-river",
      "label-street-primary"
    ].includes(layer.id)
  );
  assert.equal(layers.length > 0, true, "VersaTiles modern style must keep label layers");
  for (const layer of layers) {
    assert.deepEqual(
      layer.layout?.["text-field"],
      expected,
      `VersaTiles modern layer '${layer.id}' must use English-only text field`
    );
  }
}

function listTextFieldGetFields(textField) {
  if (Array.isArray(textField)) {
    const fields = [];
    if (
      textField.length === 2 &&
      textField[0] === "get" &&
      typeof textField[1] === "string"
    ) {
      fields.push(textField[1]);
    }
    for (const entry of textField) {
      fields.push(...listTextFieldGetFields(entry));
    }
    return fields;
  }

  if (textField && typeof textField === "object") {
    return Object.values(textField).flatMap((entry) => listTextFieldGetFields(entry));
  }

  return [];
}

function listTextFieldStrings(textField) {
  if (typeof textField === "string") {
    return [textField];
  }

  if (Array.isArray(textField)) {
    return textField.flatMap((entry) => listTextFieldStrings(entry));
  }

  if (textField && typeof textField === "object") {
    return Object.values(textField).flatMap((entry) => listTextFieldStrings(entry));
  }

  return [];
}

function assertNoForbiddenModernNameFallbacks(style, styleName, allowedNameFields) {
  const forbiddenFields = new Set(["name", "name:nonlatin", "name_int", "name:local"]);
  for (const layer of style.layers) {
    if (layer.type !== "symbol" || !layer.layout || !("text-field" in layer.layout)) {
      continue;
    }

    const textField = layer.layout["text-field"];
    const getFields = listTextFieldGetFields(textField);
    const hasNameField = getFields.some((fieldName) => /^name(?::|_|$)/u.test(fieldName));
    if (!hasNameField) {
      continue;
    }

    for (const fieldName of getFields) {
      if (!/^name(?::|_|$)/u.test(fieldName)) {
        continue;
      }

      assert.equal(
        forbiddenFields.has(fieldName),
        false,
        `${styleName} layer '${layer.id}' text-field must not read forbidden field '${fieldName}'`
      );
      assert.equal(
        allowedNameFields.has(fieldName),
        true,
        `${styleName} layer '${layer.id}' text-field must not read '${fieldName}'`
      );
    }

    const textFieldStrings = listTextFieldStrings(textField);
    for (const value of textFieldStrings) {
      assert.equal(
        /\{name(?::|_|\})/u.test(value),
        false,
        `${styleName} layer '${layer.id}' text-field must not use token fallback '${value}'`
      );
    }
  }
}

function assertNoDisputedBoundaryFilters(style, styleName) {
  for (const layer of style.layers) {
    if (layer["source-layer"] !== "boundaries" && layer["source-layer"] !== "boundary_labels") {
      continue;
    }

    const filterText = JSON.stringify(layer.filter ?? []);
    assert.equal(
      filterText.includes("\"disputed\""),
      true,
      `${styleName} boundary layer '${layer.id}' must include a disputed filter guard`
    );
    assert.equal(
      filterText.includes('"==",["get","disputed"],true'),
      false,
      `${styleName} boundary layer '${layer.id}' must not include disputed=true branch`
    );
  }
}

function expressionContainsOperator(expression, operator) {
  if (!Array.isArray(expression)) {
    return false;
  }

  if (expression[0] === operator) {
    return true;
  }

  return expression.some((entry) => expressionContainsOperator(entry, operator));
}

function expressionContainsString(expression, target) {
  if (typeof expression === "string") {
    return expression === target;
  }
  if (!Array.isArray(expression)) {
    return false;
  }
  return expression.some((entry) => expressionContainsString(entry, target));
}

function canonicalPair(leftCode, rightCode) {
  return [leftCode, rightCode].sort().join("|");
}

function collectAdm0PairExclusionsFromFilter(filterExpression, pairs = []) {
  if (!Array.isArray(filterExpression)) {
    return pairs;
  }
  if (
    filterExpression.length === 2 &&
    filterExpression[0] === "!" &&
    Array.isArray(filterExpression[1]) &&
    filterExpression[1][0] === "any"
  ) {
    const [first, second] = filterExpression[1].slice(1);
    if (
      Array.isArray(first) &&
      first[0] === "all" &&
      Array.isArray(second) &&
      second[0] === "all"
    ) {
      const firstLeft = first?.[1]?.[2];
      const firstRight = first?.[2]?.[2];
      const secondLeft = second?.[1]?.[2];
      const secondRight = second?.[2]?.[2];
      if (
        typeof firstLeft === "string" &&
        typeof firstRight === "string" &&
        typeof secondLeft === "string" &&
        typeof secondRight === "string" &&
        firstLeft === secondRight &&
        firstRight === secondLeft
      ) {
        pairs.push(canonicalPair(firstLeft, firstRight));
      }
    }
  }
  for (const entry of filterExpression) {
    collectAdm0PairExclusionsFromFilter(entry, pairs);
  }
  return pairs;
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

function collectAdminLevelChecks(filter, levels = []) {
  if (!Array.isArray(filter)) {
    return levels;
  }

  if (
    filter.length >= 3 &&
    filter[0] === "==" &&
    Array.isArray(filter[1]) &&
    filter[1][0] === "get" &&
    filter[1][1] === "admin_level"
  ) {
    levels.push(filter[2]);
  }

  if (
    filter.length >= 3 &&
    filter[0] === "in" &&
    Array.isArray(filter[1]) &&
    filter[1][0] === "get" &&
    filter[1][1] === "admin_level" &&
    Array.isArray(filter[2]) &&
    filter[2][0] === "literal" &&
    Array.isArray(filter[2][1])
  ) {
    levels.push(...filter[2][1]);
  }

  for (const entry of filter) {
    collectAdminLevelChecks(entry, levels);
  }

  return levels;
}

function assertOnlyCountryBoundaryLayers(style, styleName) {
  for (const layer of style.layers) {
    if (
      layer["source-layer"] !== "boundary" &&
      layer["source-layer"] !== "boundaries" &&
      layer["source-layer"] !== "boundary_labels"
    ) {
      continue;
    }

    const adminLevels = collectAdminLevelChecks(layer.filter ?? []);
    if (adminLevels.length === 0) {
      continue;
    }

    for (const value of adminLevels) {
      assert.equal(
        value === 2 || value === "2",
        true,
        `${styleName} boundary layer '${layer.id}' must only target admin level 2, got '${value}'`
      );
    }
  }
}

test("Liberty hosted style is physical-only and keeps required attribution", async () => {
  const style = await readStyle(libertyStylePath);

  assert.equal(
    style.name,
    "Interactive Bible Map physical basemap (modified from OpenFreeMap Liberty)"
  );
  assert.equal(
    style.metadata["interactive-bible-map:license"],
    "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: physical-map treatment only (relief shading, natural landcover, water, rivers and streams kept); all symbols, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom set to 14. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Full notices and disclaimers: LICENSE.txt in the same folder as this file."
  );
  assert.equal(style.sources.openmaptiles.attribution, libertyAttribution);
  assertNoSymbolLayers(style, "Liberty");
  assertNoBoundaryLayers(style, "Liberty");
  assertLayerAllowList(style, "Liberty", libertyAllowedLayerIds);
  assertLibertyMergedLandcover(style);
  assertLibertyRasterFadeDisabled(style);
  assertRemovedSourceLayers(style, "Liberty");
  assertMaxZoom14(style, "Liberty");
});

test("VersaTiles fallback hosted style is physical-only and keeps required attribution", async () => {
  const style = await readStyle(versaTilesStylePath);

  const vectorSources = Object.values(style.sources).filter((source) => source.type === "vector");
  assert.equal(vectorSources.length > 0, true);
  for (const source of vectorSources) {
    assert.equal(source.attribution, versaTilesAttribution);
  }

  assert.equal(
    style.name,
    "Interactive Bible Map backup physical basemap (modified from VersaTiles Colorful)"
  );
  assert.equal(
    style.metadata["interactive-bible-map:notice"],
    "Modified for outage-only fallback use by Interactive Bible Map. Changes: physical-map treatment only (natural landcover, water and waterways kept); all symbols, roads, railways, aeroways, boundaries, landuse, parks and buildings removed; max zoom set to 14."
  );

  assertNoSymbolLayers(style, "VersaTiles");
  assertNoBoundaryLayers(style, "VersaTiles");
  assertLayerAllowList(style, "VersaTiles", versaTilesAllowedLayerIds);
  assertVersaTilesLandFilters(style);
  assertRemovedSourceLayers(style, "VersaTiles");
  assertMaxZoom14(style, "VersaTiles");
});

test("Liberty modern hosted style removes disputed boundary and POI/airport labels", async () => {
  const style = await readStyle(libertyModernStylePath);

  assert.equal(
    style.name,
    "Interactive Bible Map modern basemap (modified from OpenFreeMap Liberty)"
  );
  assert.equal(
    style.metadata["interactive-bible-map:license"],
    "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: modern-map treatment. Labels are in English only (the English name, or else the name in Latin script). Points of interest, airport labels, and state and province names are removed. Only country borders are drawn: from zoom 5 the tiles' own lines, and below zoom 5 Natural Earth's boundary lines, simplified. Lines the data marks as disputed are not drawn. No border line is drawn, at any zoom, around Israel, the West Bank, Gaza and the Golan Heights, around Kosovo or Western Sahara, along the whole border between Russia and Georgia, along the border between Armenia and Azerbaijan, or across Cyprus. Leaving these lines out keeps the map neutral; it is not a claim about where these borders run or who governs these places. Max zoom set to 14. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Country borders below zoom 5: Natural Earth (https://www.naturalearthdata.com/), public domain. Full notices and disclaimers: LICENSE.txt in the same folder as this file."
  );
  assert.equal(style.sources.openmaptiles.attribution, libertyAttribution);
  assertLayerMissing(style, "boundary_disputed", "Liberty modern");
  assertLayerMissing(style, "boundary_3", "Liberty modern");
  assertLayerMissing(style, "airport", "Liberty modern");
  assertLayerMissing(style, "label_state", "Liberty modern");
  assertNoLayerIdsMatching(style, /^poi_/u, "Liberty modern", "POI layers");
  assertLibertyModernLabels(style);
  assertOnlyCountryBoundaryLayers(style, "Liberty modern");
  const libertyBoundary2Layer = style.layers.find((layer) => layer.id === "boundary_2");
  assert.ok(libertyBoundary2Layer, "Liberty modern must keep boundary_2");
  assert.equal(libertyBoundary2Layer.minzoom, 5, "Liberty modern boundary_2 must start at zoom 5");
  assert.equal(
    expressionContainsOperator(libertyBoundary2Layer.filter ?? [], "within"),
    true,
    "Liberty modern boundary_2 filter must include a contested-area mask with within"
  );
  assert.equal(
    expressionContainsString(libertyBoundary2Layer.filter ?? [], "adm0_l"),
    true,
    "Liberty modern boundary_2 filter must include adm0_l checks"
  );
  assert.equal(
    expressionContainsString(libertyBoundary2Layer.filter ?? [], "adm0_r"),
    true,
    "Liberty modern boundary_2 filter must include adm0_r checks"
  );
  const neutralBoundaryLayer = style.layers.find(
    (layer) => layer.id === "ibm-modern-neutral-boundary"
  );
  assert.ok(neutralBoundaryLayer, "Liberty modern must include low-zoom Natural Earth boundary layer");
  assert.equal(
    neutralBoundaryLayer.source,
    "ibm-modern-neutral-boundaries",
    "Liberty modern low-zoom boundary layer must use shared Natural Earth source"
  );
  assert.equal(
    style.sources["ibm-modern-neutral-boundaries"]?.attribution,
    '<a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>',
    "Liberty modern shared Natural Earth source attribution must be compact"
  );
  assert.equal(
    neutralBoundaryLayer.maxzoom,
    5,
    "Liberty modern low-zoom boundary layer must end at zoom 5"
  );
  assertMaxZoom14(style, "Liberty modern");
});

test("VersaTiles modern hosted style removes disputed boundary and POI/airport labels", async () => {
  const style = await readStyle(versaTilesModernStylePath);

  assert.equal(
    style.name,
    "Interactive Bible Map backup modern basemap (modified from VersaTiles Colorful)"
  );
  assert.equal(
    style.metadata["interactive-bible-map:notice"],
    "Modified for outage-only fallback use by Interactive Bible Map. Changes: modern-map treatment. Labels are in English only. Points of interest, airport labels and state names are removed. The tiles' boundary lines are removed, and the country borders at every zoom are Natural Earth's boundary lines (https://www.naturalearthdata.com/, public domain), simplified. No border line is drawn, at any zoom, around Israel, the West Bank, Gaza and the Golan Heights, around Kosovo or Western Sahara, along the whole border between Russia and Georgia, along the border between Armenia and Azerbaijan, or across Cyprus. Leaving these lines out keeps the map neutral; it is not a claim about where these borders run or who governs these places. Max zoom set to 14."
  );
  assertLayerMissing(style, "boundary-country-disputed", "VersaTiles modern");
  assertLayerMissing(style, "boundary-state:outline", "VersaTiles modern");
  assertLayerMissing(style, "boundary-state", "VersaTiles modern");
  assertLayerMissing(style, "label-boundary-state", "VersaTiles modern");
  assertLayerMissing(style, "label-place-state", "VersaTiles modern");
  assertLayerMissing(style, "label-place-province", "VersaTiles modern");
  assertLayerMissing(style, "boundary-country:outline", "VersaTiles modern");
  assertLayerMissing(style, "boundary-country", "VersaTiles modern");
  assertLayerMissing(style, "boundary-country-maritime", "VersaTiles modern");
  assertNoLayerIdsMatching(style, /^poi-/u, "VersaTiles modern", "POI layers");
  assertLayerMissing(style, "symbol-transit-airfield", "VersaTiles modern");
  assertLayerMissing(style, "symbol-transit-airport", "VersaTiles modern");
  assertNoDisputedBoundaryFilters(style, "VersaTiles modern");
  assertVersaTilesModernNameFields(style);
  assertOnlyCountryBoundaryLayers(style, "VersaTiles modern");
  const neutralBoundaryLayer = style.layers.find(
    (layer) => layer.id === "ibm-modern-neutral-boundary"
  );
  assert.ok(neutralBoundaryLayer, "VersaTiles modern must include Natural Earth boundary layer");
  assert.equal(
    neutralBoundaryLayer.source,
    "ibm-modern-neutral-boundaries",
    "VersaTiles modern boundary layer must use shared Natural Earth source"
  );
  assert.equal(
    style.sources["ibm-modern-neutral-boundaries"]?.attribution,
    '<a href="https://www.naturalearthdata.com/" target="_blank">Natural Earth</a>',
    "VersaTiles modern shared Natural Earth source attribution must be compact"
  );
  assert.equal(
    neutralBoundaryLayer.maxzoom,
    undefined,
    "VersaTiles modern boundary layer must render at all zoom levels"
  );
  assertMaxZoom14(style, "VersaTiles modern");
});

test("Modern styles do not allow non-English or local-script name fallbacks in symbol text", async () => {
  const libertyStyle = await readStyle(libertyModernStylePath);
  const versaTilesStyle = await readStyle(versaTilesModernStylePath);

  assertNoForbiddenModernNameFallbacks(
    libertyStyle,
    "Liberty modern",
    new Set(["name:en", "name:latin"])
  );
  assertNoForbiddenModernNameFallbacks(
    versaTilesStyle,
    "VersaTiles modern",
    new Set(["name_en"])
  );
  assertNoStateOrProvincePlaceClassLayers(libertyStyle, "Liberty modern");
  assertNoStateOrProvincePlaceClassLayers(versaTilesStyle, "VersaTiles modern");
});

test("Modern shared Natural Earth boundaries keep mask areas line-free", async () => {
  const libertyStyle = await readStyle(libertyModernStylePath);
  const neutralBoundaryGeoJson = JSON.parse(
    await fs.readFile(sharedModernNeutralBoundaryGeoJsonPath, "utf8")
  );
  const neutralMaskGeoJson = JSON.parse(
    await fs.readFile(sharedModernNeutralBoundaryMasksGeoJsonPath, "utf8")
  );
  const maskPolygons = (neutralMaskGeoJson.features ?? []).map((feature) => feature.geometry?.coordinates);

  for (const feature of neutralBoundaryGeoJson.features ?? []) {
    if (feature?.geometry?.type !== "LineString") {
      continue;
    }
    for (const coordinate of feature.geometry.coordinates) {
      assert.equal(
        maskPolygons.some((polygonCoordinates) =>
          isPointStrictlyInsidePolygon(coordinate, polygonCoordinates)
        ),
        false,
        "Shared Natural Earth boundary vertices must not fall strictly inside any contested-area mask"
      );
    }
  }

  const libertyBoundary2Layer = libertyStyle.layers.find((layer) => layer.id === "boundary_2");
  assert.ok(libertyBoundary2Layer, "Liberty modern must include boundary_2");
  const hiddenPairsInTileFilter = new Set(
    collectAdm0PairExclusionsFromFilter(libertyBoundary2Layer.filter ?? [])
  );
  assert.deepEqual(
    [...hiddenPairsInTileFilter].sort(),
    [...expectedHiddenBoundaryPairs].sort(),
    "Liberty tile boundary filter must hide the exact shared contested adm0 pair list"
  );

  const hiddenPairsStillPresentInNe = new Set();
  for (const feature of neutralBoundaryGeoJson.features ?? []) {
    const leftCode = feature?.properties?.adm0_a3_l;
    const rightCode = feature?.properties?.adm0_a3_r;
    if (typeof leftCode !== "string" || typeof rightCode !== "string") {
      continue;
    }
    const pair = canonicalPair(leftCode, rightCode);
    if (expectedHiddenBoundaryPairs.includes(pair)) {
      hiddenPairsStillPresentInNe.add(pair);
    }
  }
  assert.deepEqual(
    [...hiddenPairsStillPresentInNe].sort(),
    [],
    "Natural Earth shared boundary output must not include any pair hidden in tile boundaries"
  );

  for (const [pair, hiddenIds] of expectedHiddenNeIdsForSharedPairs) {
    const remainingIds = new Set();
    for (const feature of neutralBoundaryGeoJson.features ?? []) {
      const neId = feature?.properties?.id;
      if (typeof neId === "number" && hiddenIds.has(neId)) {
        remainingIds.add(neId);
      }
    }
    assert.deepEqual(
      [...remainingIds].sort(),
      [],
      `Natural Earth shared boundary output must not include hidden ids for ${pair}`
    );
  }
});
