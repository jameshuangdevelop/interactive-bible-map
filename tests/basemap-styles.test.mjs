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
