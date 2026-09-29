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
  "landcover_wood",
  "landcover_grass",
  "landcover_ice",
  "landcover_wetland",
  "waterway_river",
  "waterway_other",
  "water",
  "landcover_sand"
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
