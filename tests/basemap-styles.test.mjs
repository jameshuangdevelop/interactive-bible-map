import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");

const englishCoalesce = ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];

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
const upstreamWarningLayerFilters = {
  "highway-shield-non-us": [
    "all",
    ["<=", ["get", "ref_length"], 6],
    ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
    ["match", ["get", "network"], ["us-highway", "us-interstate", "us-state"], false, true]
  ],
  "highway-shield-us-interstate": [
    "all",
    ["<=", ["get", "ref_length"], 6],
    ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
    ["match", ["get", "network"], ["us-interstate"], true, false]
  ],
  road_shield_us: [
    "all",
    ["<=", ["get", "ref_length"], 6],
    ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
    ["match", ["get", "network"], ["us-highway", "us-state"], true, false]
  ]
};

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

  if (value[0] === "get" && value.length > 1 && isNameFieldName(value[1])) {
    return true;
  }

  return value.some((item) => referencesNameField(item));
}

function includesClause(filter, clause) {
  if (!Array.isArray(filter) || filter.length === 0) {
    return false;
  }

  if (JSON.stringify(filter) === JSON.stringify(clause)) {
    return true;
  }

  return filter.some((item) => includesClause(item, clause));
}

async function readStyle(stylePath) {
  return JSON.parse(await fs.readFile(stylePath, "utf8"));
}

test("Liberty hosted style keeps required attribution and transform rules", async () => {
  const style = await readStyle(libertyStylePath);

  assert.equal(
    style.name,
    "Interactive Bible Map basemap (modified from OpenFreeMap Liberty)"
  );
  assert.equal(
    style.metadata["interactive-bible-map:license"],
    "Modified by Interactive Bible Map from OpenFreeMap Liberty (https://github.com/hyperknot/openfreemap-styles/tree/main/styles/liberty), a fork of OSM Liberty (https://github.com/maputnik/osm-liberty), derived from OSM Bright (OpenMapTiles) and Mapbox Open Styles. Changes: English labels, points of interest removed, disputed boundary lines hidden. Style code: BSD 3-Clause (Copyright (c) 2014, Mapbox) and MIT (Copyright (c) 2023 Zsolt Ero). Style design: CC BY 3.0 (Mapbox Open Styles) and CC BY 4.0 (OpenMapTiles). Map data: OpenStreetMap contributors, ODbL 1.0. Full notices and disclaimers: LICENSE.txt in the same folder as this file."
  );
  assert.equal(style.sources.openmaptiles.attribution, libertyAttribution);

  assert.equal(style.layers.some((layer) => layer.id === "boundary_disputed"), false);
  assert.equal(style.layers.some((layer) => layer["source-layer"] === "poi"), false);

  const disputedExclusionClause = ["!=", ["get", "disputed"], 1];
  for (const layer of style.layers.filter((layer) => layer["source-layer"] === "boundary")) {
    assert.equal(
      includesClause(layer.filter, disputedExclusionClause),
      true,
      `Layer ${layer.id} must exclude disputed=1 features`
    );
  }

  for (const layer of style.layers) {
    const textField = layer.layout?.["text-field"];
    if (!referencesNameField(textField)) {
      continue;
    }

    assert.deepEqual(
      textField,
      englishCoalesce,
      `Layer ${layer.id} must use coalesce(name:en, name:latin, name)`
    );
  }
});

test("VersaTiles fallback hosted style keeps required attribution and transform rules", async () => {
  const style = await readStyle(versaTilesStylePath);

  const vectorSources = Object.values(style.sources).filter((source) => source.type === "vector");
  assert.equal(vectorSources.length > 0, true);
  for (const source of vectorSources) {
    assert.equal(source.attribution, versaTilesAttribution);
  }

  assert.equal(style.layers.some((layer) => layer.id === "boundary-country-disputed"), false);
  assert.equal(style.layers.some((layer) => layer["source-layer"] === "pois"), false);

  const boundaryOutline = style.layers.find((layer) => layer.id === "boundary-country:outline");
  assert.ok(boundaryOutline);
  assert.equal(
    includesClause(boundaryOutline.filter, ["==", ["get", "disputed"], true]),
    false,
    "boundary-country:outline must not contain a disputed=true branch"
  );

  const disputedExclusionClause = ["!=", ["get", "disputed"], true];
  for (const layer of style.layers.filter(
    (layer) => layer["source-layer"] === "boundaries" && layer.type === "line"
  )) {
    assert.equal(
      includesClause(layer.filter, disputedExclusionClause),
      true,
      `Layer ${layer.id} must exclude disputed=true features`
    );
  }

  for (const layer of style.layers) {
    const textField = layer.layout?.["text-field"];
    if (!referencesNameField(textField)) {
      continue;
    }

    assert.deepEqual(
      textField,
      englishCoalesce,
      `Layer ${layer.id} must use coalesce(name:en, name:latin, name)`
    );
  }
});

test("Liberty transform preserves upstream shield filters that currently log style warnings", async () => {
  const style = await readStyle(libertyStylePath);

  for (const [layerId, expectedFilter] of Object.entries(upstreamWarningLayerFilters)) {
    const layer = style.layers.find((item) => item.id === layerId);
    assert.ok(layer, `Expected ${layerId} layer to exist in hosted Liberty style`);
    assert.deepEqual(
      layer.filter,
      expectedFilter,
      `${layerId} filter should match upstream Liberty to avoid transform regressions`
    );
  }
});
