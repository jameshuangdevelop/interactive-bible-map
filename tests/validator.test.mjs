import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseReference } from "../scripts/lib/books.mjs";
import { validateData } from "../scripts/lib/validator.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(testDirectory, "fixtures");
const casesDirectory = path.join(fixturesDirectory, "cases");
const webFixturePath = path.join(fixturesDirectory, "web", "engwebp-mini.vpl.txt");
const webFixtureMissingInteriorPath = path.join(
  fixturesDirectory,
  "web",
  "engwebp-missing-interior.vpl.txt"
);
const webSnapshotMetadataMismatchPath = path.join(
  fixturesDirectory,
  "web",
  "engwebp-mini.metadata.bad.json"
);
const bibliographyFixturePath = path.join(fixturesDirectory, "bibliography.json");

const locationSchemaPath = path.join(
  testDirectory,
  "..",
  "schema",
  "location.schema.json"
);
const sourceIdSchemaPath = path.join(
  testDirectory,
  "..",
  "schema",
  "source-id.schema.json"
);

const locationSchema = JSON.parse(fs.readFileSync(locationSchemaPath, "utf8"));
const sourceIdSchema = JSON.parse(fs.readFileSync(sourceIdSchemaPath, "utf8"));
const locationReferenceRegex = new RegExp(
  locationSchema.properties.scripture.items.properties.ref.pattern,
  "u"
);
const scriptureSourceRegex = new RegExp(
  sourceIdSchema.$defs.scriptureSourceId.pattern,
  "u"
);

async function runCase(caseName, options = {}) {
  const caseDirectory = path.join(casesDirectory, caseName);
  return validateData({
    locationsDirectory: path.join(caseDirectory, "locations"),
    mediaDirectory: path.join(caseDirectory, "media"),
    webVplPath: options.webVplPath ?? webFixturePath,
    bibliographyPath: bibliographyFixturePath,
    skipSnapshotChecksumCheck: true
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

test("media fixture accepts CC BY-SA 3.0 IGO", async () => {
  const result = await runCase("valid-media-igo-license");
  assert.equal(result.errors.length, 0);
});

test("media fixture rejects malformed IGO variant", async () => {
  const result = await runCase("invalid-media-igo-license");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media fixture accepts jurisdiction-ported CC BY-SA license", async () => {
  const result = await runCase("valid-media-port-by-sa-de");
  assert.equal(result.errors.length, 0);
});

test("media fixture accepts jurisdiction-ported CC BY license", async () => {
  const result = await runCase("valid-media-port-by-nl");
  assert.equal(result.errors.length, 0);
});

test("media fixture rejects malformed jurisdiction code", async () => {
  const result = await runCase("invalid-media-port-code");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media fixture rejects missing version in jurisdiction variant", async () => {
  const result = await runCase("invalid-media-port-no-version");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media fixture rejects port and IGO suffix combination", async () => {
  const result = await runCase("invalid-media-port-igo-combo");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media fixture rejects 4.0 jurisdiction-ported variant", async () => {
  const result = await runCase("invalid-media-port-v4");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("media fixture rejects non-3.0 IGO variant", async () => {
  const result = await runCase("invalid-media-igo-v2");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("scripture source accepts single verse reference", async () => {
  const result = await runCase("valid-scripture-source-single");
  assert.equal(result.errors.length, 0);
});

test("scripture source accepts verse range reference", async () => {
  const result = await runCase("valid-scripture-source-range");
  assert.equal(result.errors.length, 0);
});

test("scripture source accepts numbered-book reference", async () => {
  const result = await runCase("valid-scripture-source-numbered");
  assert.equal(result.errors.length, 0);
});

test("scripture source rejects unknown book names", async () => {
  const result = await runCase("invalid-scripture-source-unknown-book");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.summary.sources[1]" &&
        error.message.includes("non-canonical book")
    )
  );
});

test("scripture source rejects nonexistent verses", async () => {
  const result = await runCase("invalid-scripture-source-missing-verse");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.summary.sources[1]" &&
        error.message.includes("not found in WEB snapshot")
    )
  );
});

test("scripture source rejects a range with a missing interior verse", async () => {
  const result = await runCase("invalid-scripture-source-missing-interior-range", {
    webVplPath: webFixtureMissingInteriorPath
  });
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.summary.sources[1]" &&
        error.message.includes("not found in WEB snapshot")
    )
  );
});

test("coordinateSource cannot use scripture source IDs", async () => {
  const result = await runCase("invalid-scripture-coordinate-source");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates[0].coordinateSource" &&
        error.message.includes("must not use scripture:")
    )
  );
});

test("reference grammar stays aligned across parser and schemas", () => {
  const validReferences = [
    "Mark 1:21",
    "Mark 1:21-22",
    "1 Corinthians 1:2",
    "Song of Solomon 1:1"
  ];
  const invalidReferences = [
    "Mark1:21",
    "Mark 0:1",
    "Mark 1:0",
    "1Corinthians 1:2",
    "Mark 1:21-"
  ];

  for (const reference of validReferences) {
    assert.equal(locationReferenceRegex.test(reference), true, reference);
    assert.equal(scriptureSourceRegex.test(`scripture:${reference}`), true, reference);
    assert.doesNotThrow(() => parseReference(reference), reference);
  }

  for (const reference of invalidReferences) {
    assert.equal(locationReferenceRegex.test(reference), false, reference);
    assert.equal(scriptureSourceRegex.test(`scripture:${reference}`), false, reference);
    assert.throws(() => parseReference(reference), undefined, reference);
  }
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

test("media locationId must equal file name", async () => {
  const result = await runCase("invalid-media-filename");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.locationId" &&
        error.message.includes("must equal file name")
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

test("wikipedia cannot be used as coordinateSource", async () => {
  const result = await runCase("invalid-wikipedia-coordinate-source");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates[0].coordinateSource" &&
        error.message.includes("must not use wikipedia:")
    )
  );
});

test("coordinateSource must appear in candidates[].sources", async () => {
  const result = await runCase("invalid-coordinate-source-not-in-sources");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.candidates[0].coordinateSource" &&
        error.message.includes("must also appear in candidates[].sources")
    )
  );
});

test("sources cannot be wikipedia-only", async () => {
  const result = await runCase("invalid-wikipedia-only-sources");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.summary.sources" &&
        error.message.includes("at least one non-wikipedia")
    )
  );
});

test("bib sources must exist in bibliography registry", async () => {
  const result = await runCase("invalid-missing-bib");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path.includes("$.summary.sources") &&
        error.message.includes("was not found in data/bibliography.json")
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

test("otConnections must use Old Testament books", async () => {
  const result = await runCase("invalid-ot-connection-book");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.otConnections[0].ref" &&
        error.message.includes("must use an Old Testament book")
    )
  );
});

test("politicalHistory fromYear cannot be greater than toYear", async () => {
  const result = await runCase("invalid-political-history-order");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.politicalHistory[0]" &&
        error.message.includes("must be less than or equal")
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

test("scripture.book must match scripture.ref", async () => {
  const result = await runCase("invalid-scripture-book-mismatch");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.scripture[0].book" &&
        error.message.includes("must match scripture.ref")
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

test("WEB snapshot checksum mismatch fails validation", async () => {
  const result = await validateData({
    locationsDirectory: path.join(casesDirectory, "empty", "locations"),
    mediaDirectory: path.join(casesDirectory, "empty", "media"),
    webVplPath: webFixturePath,
    bibliographyPath: bibliographyFixturePath,
    webSnapshotMetadataPath: webSnapshotMetadataMismatchPath
  });
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.sha256" &&
        error.message.includes("WEB snapshot checksum mismatch")
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
