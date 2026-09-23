import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateData } from "../scripts/lib/validator.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(testDirectory, "fixtures");
const casesDirectory = path.join(fixturesDirectory, "cases");
const webFixturePath = path.join(fixturesDirectory, "web", "engwebp-mini.vpl.txt");

async function runCase(caseName) {
  const caseDirectory = path.join(casesDirectory, caseName);
  return validateData({
    locationsDirectory: path.join(caseDirectory, "locations"),
    mediaDirectory: path.join(caseDirectory, "media"),
    webVplPath: webFixturePath
  });
}

function hasError(result, predicate) {
  return result.errors.some(predicate);
}

function hasWarning(result, predicate) {
  return result.warnings.some(predicate);
}

test("empty data directories pass validation", async () => {
  const result = await runCase("empty");
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
});

test("adapted brief section 4 fixture is valid", async () => {
  const result = await runCase("valid");
  assert.equal(result.errors.length, 0);
});

test("schema-invalid fixture fails", async () => {
  const result = await runCase("invalid-schema");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("bad-schema.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media schema-invalid fixture fails", async () => {
  const result = await runCase("invalid-media-schema");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("id must equal filename", async () => {
  const result = await runCase("invalid-id-filename");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("wrong-file.json") &&
        error.path === "$.id" &&
        error.message.includes("id must equal file name")
    )
  );
});

test("duplicate location ids fail", async () => {
  const result = await runCase("invalid-duplicate-id");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.id" && error.message.includes("Duplicate location id")
    )
  );
});

test("parentId must point to an existing location", async () => {
  const result = await runCase("invalid-parent-id");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("capernaum.json") &&
        error.path === "$.parentId" &&
        error.message.includes("does not match any location id")
    )
  );
});

test("media locationId must point to an existing location", async () => {
  const result = await runCase("invalid-media-location");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("capernaum.json") &&
        error.path === "$.locationId" &&
        error.message.includes("does not match any location id")
    )
  );
});

test("OSM-derived coordinate sources fail", async () => {
  const result = await runCase("invalid-osm-coordinate-source");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates[0].coordinateSource" &&
        error.message.includes("must not use OSM-derived IDs")
    )
  );
});

test("verified records require verifiedBy and lastReviewed", async () => {
  const result = await runCase("invalid-verified-metadata");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("capernaum.json") &&
        (error.path.endsWith(".verifiedBy") || error.path.endsWith(".lastReviewed"))
    )
  );
});

test("disputed candidates require at least two entries", async () => {
  const result = await runCase("invalid-disputed-candidates");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates" &&
        error.message.includes("At least two candidates are required")
    )
  );
});

test("coordinates must stay inside project bounds", async () => {
  const result = await runCase("invalid-bounds");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates[0].coordinates" &&
        error.message.includes("inside project bounds")
    )
  );
});

test("scripture text must exactly match WEB text", async () => {
  const result = await runCase("invalid-scripture-text");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.scripture[0].textWEB" &&
        error.message.includes("does not match the WEB engwebp source text")
    )
  );
});

test("warning is emitted when scripture text has no location name", async () => {
  const result = await runCase("warning-no-name");
  assert.equal(result.errors.length, 0);
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.path === "$.scripture[0].textWEB" &&
        warning.message.includes("contains none of this location's configured names")
    )
  );
});
