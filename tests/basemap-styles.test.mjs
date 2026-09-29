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

const libertyAllowedSourceLayers = new Set(["landcover", "water", "waterway"]);
const versaTilesAllowedSourceLayers = new Set(["land", "ocean", "water_lines", "water_polygons"]);
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

function assertSourceLayerAllowList(style, styleName, allowedSourceLayers) {
  for (const layer of style.layers) {
    const sourceLayer = layer["source-layer"];
    if (!sourceLayer) {
      continue;
    }

    assert.equal(
      allowedSourceLayers.has(sourceLayer),
      true,
      `${styleName} layer '${layer.id}' uses disallowed source-layer '${sourceLayer}'`
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
  assertSourceLayerAllowList(style, "Liberty", libertyAllowedSourceLayers);
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
  assertSourceLayerAllowList(style, "VersaTiles", versaTilesAllowedSourceLayers);
  assertRemovedSourceLayers(style, "VersaTiles");
  assertMaxZoom14(style, "VersaTiles");
});

