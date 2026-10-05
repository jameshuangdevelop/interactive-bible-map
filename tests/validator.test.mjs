import fs from "node:fs";
import os from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseReference } from "../scripts/lib/books.mjs";
import {
  validateData,
  REQUIRE_EMPIRE_ROOT,
  REQUIRE_MODERN_COUNTRIES
} from "../scripts/lib/validator.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(testDirectory, "fixtures");
const casesDirectory = path.join(fixturesDirectory, "cases");
const validCaseDirectory = path.join(casesDirectory, "valid");
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
  const { webVplPath = webFixturePath, ...validationOptions } = options;

  return validateData({
    locationsDirectory: path.join(caseDirectory, "locations"),
    mediaDirectory: path.join(caseDirectory, "media"),
    imagePromptsDirectory: path.join(caseDirectory, "content", "image-prompts"),
    aiMediaDirectory: path.join(caseDirectory, "media", "ai"),
    webVplPath,
    bibliographyPath: bibliographyFixturePath,
    skipSnapshotChecksumCheck: true,
    // These fixtures predate the empire/province hierarchy and were not
    // built with an empire-rooted parentId chain; default to the pre-M3-11
    // behavior here so unrelated tests are unaffected by REQUIRE_EMPIRE_ROOT
    // now defaulting to true. Tests that exercise the empire-root rule pass
    // requireEmpireRoot explicitly (see runWithTemporaryHierarchyCase below).
    requireEmpireRoot: false,
    ...validationOptions
  });
}

function toDraftRecord(record) {
  const draftRecord = { ...record, status: "draft" };
  delete draftRecord.verifiedBy;
  delete draftRecord.lastReviewed;
  return draftRecord;
}

async function runWithTemporaryCase(mutateLocations, options = {}) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ibm-validator-"));

  try {
    const locationsDirectory = path.join(temporaryDirectory, "locations");
    const mediaDirectory = path.join(temporaryDirectory, "media");
    fs.mkdirSync(locationsDirectory, { recursive: true });
    fs.mkdirSync(mediaDirectory, { recursive: true });

    const capernaumPath = path.join(validCaseDirectory, "locations", "capernaum.json");
    const galileePath = path.join(validCaseDirectory, "locations", "galilee.json");
    const capernaumData = JSON.parse(fs.readFileSync(capernaumPath, "utf8"));
    const galileeData = JSON.parse(fs.readFileSync(galileePath, "utf8"));

    if (typeof mutateLocations === "function") {
      mutateLocations({ capernaumData, galileeData });
    }

    fs.writeFileSync(
      path.join(locationsDirectory, "capernaum.json"),
      `${JSON.stringify(capernaumData, null, 2)}\n`
    );
    fs.writeFileSync(
      path.join(locationsDirectory, "galilee.json"),
      `${JSON.stringify(galileeData, null, 2)}\n`
    );

    const { webVplPath = webFixturePath, ...validationOptions } = options;
    return await validateData({
      locationsDirectory,
      mediaDirectory,
      imagePromptsDirectory: path.join(temporaryDirectory, "content", "image-prompts"),
      aiMediaDirectory: path.join(temporaryDirectory, "media", "ai"),
      webVplPath,
      bibliographyPath: bibliographyFixturePath,
      skipSnapshotChecksumCheck: true,
      // See the comment in runCase above: this fixture pair predates the
      // empire/province hierarchy and has no empire-rooted parentId chain.
      requireEmpireRoot: false,
      ...validationOptions
    });
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function runWithTemporaryHierarchyCase(mutateLocations, options = {}) {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ibm-validator-hierarchy-")
  );

  try {
    const locationsDirectory = path.join(temporaryDirectory, "locations");
    const mediaDirectory = path.join(temporaryDirectory, "media");
    fs.mkdirSync(locationsDirectory, { recursive: true });
    fs.mkdirSync(mediaDirectory, { recursive: true });

    const cityTemplate = JSON.parse(
      fs.readFileSync(path.join(validCaseDirectory, "locations", "capernaum.json"), "utf8")
    );
    const areaTemplate = JSON.parse(
      fs.readFileSync(path.join(validCaseDirectory, "locations", "galilee.json"), "utf8")
    );

    const cityData = toDraftRecord({
      ...cityTemplate,
      id: "athens",
      names: {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: []
      },
      type: "city",
      zoomTier: "city",
      parentId: "achaia"
    });
    const provinceData = toDraftRecord({
      ...areaTemplate,
      id: "achaia",
      names: {
        ancient: ["Achaia"],
        modern: "Achaia",
        alternate: []
      },
      type: "province",
      zoomTier: "region",
      parentId: "roman-empire"
    });
    const empireData = toDraftRecord({
      ...areaTemplate,
      id: "roman-empire",
      names: {
        ancient: ["Roman Empire"],
        modern: "Roman Empire",
        alternate: []
      },
      type: "empire",
      zoomTier: "region"
    });
    delete empireData.parentId;

    if (typeof mutateLocations === "function") {
      mutateLocations({ cityData, provinceData, empireData });
    }

    for (const locationData of [cityData, provinceData, empireData]) {
      fs.writeFileSync(
        path.join(locationsDirectory, `${locationData.id}.json`),
        `${JSON.stringify(locationData, null, 2)}\n`
      );
    }

    const { webVplPath = webFixturePath, ...validationOptions } = options;
    return await validateData({
      locationsDirectory,
      mediaDirectory,
      imagePromptsDirectory: path.join(temporaryDirectory, "content", "image-prompts"),
      aiMediaDirectory: path.join(temporaryDirectory, "media", "ai"),
      webVplPath,
      bibliographyPath: bibliographyFixturePath,
      skipSnapshotChecksumCheck: true,
      ...validationOptions
    });
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
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

test("media fixture accepts sequential image IDs", async () => {
  const result = await runCase("valid-media-image-ids");
  assert.equal(result.errors.length, 0);
});

test("media image IDs must start with locationId", async () => {
  const result = await runCase("invalid-media-image-id-prefix");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].id" &&
        error.message.includes("must start with 'capernaum-'")
    )
  );
});

test("media image IDs must not skip numbers", async () => {
  const result = await runCase("invalid-media-image-id-gap");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[1].id" &&
        error.message.includes("must be 'capernaum-02'")
    )
  );
});

test("media image IDs must follow array order", async () => {
  const result = await runCase("invalid-media-image-id-order");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].id" &&
        error.message.includes("must be 'capernaum-01'")
    )
  );
});

test("duplicate image IDs across media files fail", async () => {
  const result = await runCase("invalid-media-image-id-duplicate");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.images[0].id" &&
        error.message.includes("Duplicate image id 'capernaum-01'")
    )
  );
});

test("Commons media URL fixture with valid hash folders passes", async () => {
  const result = await runCase("valid-media-commons-url");
  assert.equal(result.errors.length, 0);
});

test("historical Commons image kind passes validation", async () => {
  const result = await runCase("valid-media-historical");
  assert.equal(result.errors.length, 0);
});

test("Commons media URL fixture rejects wrong hash folders", async () => {
  const result = await runCase("invalid-media-commons-url-hash");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("hash folders must match md5")
    )
  );
});

test("Commons media URL fixture rejects malformed percent encoding in file names", async () => {
  const result = await runCase("invalid-media-commons-url-bad-escape");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("not validly percent-encoded")
    )
  );
});

test("Commons media URL fixture rejects URL/sourcePage filename mismatches", async () => {
  const result = await runCase("invalid-media-sourcepage-mismatch");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].sourcePage" &&
        error.message.includes("must match url file")
    )
  );
});

test("AI media fixture accepts valid hosted WebP file", async () => {
  const result = await runCase("valid-media-ai-image");
  assert.equal(result.errors.length, 0);
});

test("AI media fixture rejects over-width hosted WebP file", async () => {
  const result = await runCase("invalid-media-ai-image-too-wide");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("limit is 1600px")
    )
  );
});

test("AI media fixture rejects oversized hosted WebP file", async () => {
  // The fixture uses a minimal valid WebP header padded past 400 KB so this
  // branch can be tested without external image tooling.
  const result = await runCase("invalid-media-ai-image-too-large");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("limit is 409600 bytes")
    )
  );
});

test("AI media fixture rejects non-WebP payloads even with .webp extension", async () => {
  const result = await runCase("invalid-media-ai-image-not-webp");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("must be a valid WebP file")
    )
  );
});

test("AI media fixture rejects missing hosted files", async () => {
  const result = await runCase("invalid-media-ai-image-missing-file");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].url" &&
        error.message.includes("was not found")
    )
  );
});

test("AI media fixture accepts VP8-hosted WebP file", async () => {
  const result = await runCase("valid-media-ai-image-vp8");
  assert.equal(result.errors.length, 0);
});

test("AI media fixture accepts VP8L-hosted WebP file", async () => {
  const result = await runCase("valid-media-ai-image-vp8l");
  assert.equal(result.errors.length, 0);
});

test("AI media fixture rejects recorded dimensions that do not match hosted WebP", async () => {
  const result = await runCase("invalid-media-ai-image-size-mismatch");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].width" &&
        error.message.includes("must match hosted file width")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images[0].height" &&
        error.message.includes("must match hosted file height")
    )
  );
});

test("lead panorama images emit a warning", async () => {
  const result = await runCase("warning-media-lead-panorama");
  assert.equal(result.errors.length, 0);
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("media/capernaum.json") &&
        warning.path === "$.images[0]" &&
        warning.message.includes("lead image is a panorama")
    )
  );
});

test("narrow Commons images emit a warning", async () => {
  const result = await runCase("warning-media-narrow-commons");
  assert.equal(result.errors.length, 0);
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("media/capernaum.json") &&
        warning.path === "$.images[0].width" &&
        warning.message.includes("prefer at least 1200px")
    )
  );
});

test("standard places cannot have more than three images", async () => {
  const result = await runCase("invalid-standard-too-many-images");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images" &&
        error.message.includes("at most 3 images")
    )
  );
});

test("major places with fewer than five images emit only a warning when REQUIRE_MAJOR_IMAGES is off", async () => {
  const result = await runCase("valid-major-few-images", { requireMajorImages: false });
  assert.equal(result.errors.length, 0);
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("media/capernaum.json") &&
        warning.path === "$.images" &&
        warning.message.includes("at least 5 images")
    )
  );
});

test("major places with fewer than five images fail by default", async () => {
  const defaultResult = await runCase("valid-major-few-images");
  assert.ok(
    hasError(
      defaultResult,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images" &&
        error.message.includes("at least 5 images")
    )
  );
});

test("major places with fewer than five images fail when REQUIRE_MAJOR_IMAGES is enabled", async () => {
  const result = await runCase("valid-major-few-images", { requireMajorImages: true });
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("media/capernaum.json") &&
        error.path === "$.images" &&
        error.message.includes("at least 5 images")
    )
  );
});

test("image prompt source IDs pass when they resolve", async () => {
  const result = await runCase("valid-image-prompts");
  assert.equal(result.errors.length, 0);
});

test("image prompt source IDs and file naming fail on unresolved references", async () => {
  const result = await runCase("invalid-image-prompts");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("does not match any existing location id")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("was not found in data/bibliography.json")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("bib:missing-grouped-source") &&
        !error.message.includes(";")
    ),
    "each id in a semicolon-separated citation is checked on its own"
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("pleiades:missing-format")
    ),
    "grouped citations still validate bad source-id formats"
  );
  assert.ok(
    !hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("Note: ask the Research Lead")
    ),
    "editorial bracket notes are ignored"
  );
  assert.ok(
    !hasError(
      result,
      (error) =>
        error.file.endsWith("content/image-prompts/unknown-place.md") &&
        error.message.includes("Wikipedia: Capernaum")
    ),
    "non-citation bracket text with uppercase labels is ignored"
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

test("parentId chains cannot contain cycles", async () => {
  const result = await runWithTemporaryCase(({ capernaumData, galileeData }) => {
    capernaumData.parentId = "galilee";
    galileeData.parentId = "capernaum";
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.parentId" &&
        error.message.includes("must not contain cycles")
    )
  );
});

test("self-referencing parentId is reported as a cycle", async () => {
  const result = await runWithTemporaryHierarchyCase(({ cityData }) => {
    cityData.parentId = cityData.id;
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("athens.json") &&
        error.path === "$.parentId" &&
        error.message.includes("must not contain cycles")
    )
  );
});

test("three-hop parentId cycle is reported and validation terminates", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData, empireData }) => {
      cityData.parentId = provinceData.id;

      provinceData.type = "city";
      provinceData.zoomTier = "city";
      provinceData.parentId = empireData.id;

      empireData.type = "city";
      empireData.zoomTier = "city";
      empireData.parentId = cityData.id;
    }
  );

  const cycleErrorCount = result.errors.filter(
    (error) =>
      error.path === "$.parentId" &&
      error.message.includes("must not contain cycles")
  ).length;
  assert.ok(cycleErrorCount >= 3);
});

test("records of type empire must not define parentId", async () => {
  const result = await runWithTemporaryHierarchyCase(({ empireData }) => {
    empireData.parentId = "achaia";
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("roman-empire.json") &&
        error.path === "$.parentId" &&
        error.message.includes("must not define parentId")
    )
  );
});

test("records of type province must define parentId", async () => {
  const result = await runWithTemporaryHierarchyCase(({ provinceData }) => {
    delete provinceData.parentId;
  });

  const provinceParentErrors = result.errors.filter(
    (error) => error.file.endsWith("achaia.json") && error.path === "$.parentId"
  );

  assert.equal(provinceParentErrors.length, 1);
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.parentId" &&
        error.message.includes("must define parentId")
    )
  );
});

test("province parent must be an empire record", async () => {
  const result = await runWithTemporaryHierarchyCase(({ provinceData }) => {
    provinceData.parentId = "athens";
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.parentId" &&
        error.message.includes("must reference a record of type 'empire'")
    )
  );
});

test("region, province, and empire records must use zoomTier region", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData, empireData }) => {
      cityData.type = "region";
      cityData.zoomTier = "city";
      provinceData.zoomTier = "city";
      empireData.zoomTier = "city";
    }
  );

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("athens.json") &&
        error.path === "$.zoomTier" &&
        error.message.includes("type 'region'")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.zoomTier" &&
        error.message.includes("type 'province'")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("roman-empire.json") &&
        error.path === "$.zoomTier" &&
        error.message.includes("type 'empire'")
    )
  );
});

test("empire-root chain rule is enabled by default", async () => {
  assert.equal(REQUIRE_EMPIRE_ROOT, true);

  // Bypass runCase's fixture-compatibility default (which pins
  // requireEmpireRoot to false for fixtures that predate the empire/province
  // hierarchy) so this test exercises the real module default with no
  // requireEmpireRoot option supplied at all, the same way npm run
  // validate:data calls validateData in production.
  const result = await validateData({
    locationsDirectory: path.join(validCaseDirectory, "locations"),
    mediaDirectory: path.join(validCaseDirectory, "media"),
    webVplPath: webFixturePath,
    bibliographyPath: bibliographyFixturePath,
    skipSnapshotChecksumCheck: true
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.parentId" &&
        error.message.includes("REQUIRE_EMPIRE_ROOT")
    )
  );
});

test("empire-root chain rule can be enabled", async () => {
  const result = await runCase("valid", { requireEmpireRoot: true });
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.parentId" &&
        error.message.includes("REQUIRE_EMPIRE_ROOT")
    )
  );
});

test("empire-root chain rule passes when chains end at an empire", async () => {
  const result = await runWithTemporaryHierarchyCase(undefined, {
    requireEmpireRoot: true
  });
  assert.equal(result.errors.length, 0);
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

test("names.modern cannot contain the word disputed", async () => {
  const result = await runCase("invalid-modern-name-disputed");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names.modern" &&
        error.message.includes("must not contain the word 'disputed'")
    )
  );
});

test("names.modern word check respects word boundaries", async () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "ibm-modern-name-boundary-")
  );

  try {
    const caseDirectory = path.join(
      temporaryDirectory,
      "valid-modern-name-boundary"
    );
    const locationsDirectory = path.join(caseDirectory, "locations");
    const mediaDirectory = path.join(caseDirectory, "media");
    fs.mkdirSync(locationsDirectory, { recursive: true });
    fs.mkdirSync(mediaDirectory, { recursive: true });
    fs.writeFileSync(path.join(mediaDirectory, ".gitkeep"), "");

    const sourceLocationPath = path.join(
      casesDirectory,
      "valid-modern-name-multiple-candidates",
      "locations",
      "capernaum.json"
    );
    const locationData = JSON.parse(fs.readFileSync(sourceLocationPath, "utf8"));
    locationData.names.modern = "Undisputed Hill";

    fs.writeFileSync(
      path.join(locationsDirectory, "capernaum.json"),
      `${JSON.stringify(locationData, null, 2)}\n`
    );

    const result = await validateData({
      locationsDirectory,
      mediaDirectory,
      webVplPath: webFixturePath,
      bibliographyPath: bibliographyFixturePath,
      skipSnapshotChecksumCheck: true,
      // This ad hoc fixture predates the empire/province hierarchy (M3-11).
      requireEmpireRoot: false
    });

    assert.equal(result.errors.length, 0);
    assert.equal(
      hasError(
        result,
        (error) =>
          error.path === "$.names.modern" &&
          error.message.includes("must not contain the word 'disputed'")
      ),
      false
    );
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("names.modern must be omitted when a disputed-confidence candidate exists", async () => {
  const result = await runCase("invalid-modern-name-multiple-candidates");
  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names.modern" &&
        error.message.includes(
          "must be omitted when any candidate confidence is 'disputed'"
        )
    )
  );
});

test("disputed multi-candidate record may omit names.modern", async () => {
  const result = await runCase("valid-disputed-no-modern");
  assert.equal(result.errors.length, 0);
});

test("multi-candidate non-disputed record may keep names.modern", async () => {
  const result = await runCase("valid-modern-name-multiple-candidates");
  assert.equal(result.errors.length, 0);
});

test("modern-countries requirement is warning-only by default", async () => {
  assert.equal(REQUIRE_MODERN_COUNTRIES, false);

  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: []
      };
      provinceData.names = {
        ancient: ["Achaia"],
        modern: "Achaia",
        alternate: [],
        modernCountries: ["Greece"]
      };
    },
    { requireModernCountries: false }
  );

  assert.equal(
    hasError(
      result,
      (error) =>
        error.file.endsWith("athens.json") &&
        error.path === "$.names.modernCountries" &&
        error.message.includes("required for all non-exempt records")
    ),
    false
  );
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("athens.json") &&
        warning.path === "$.names.modernCountries" &&
        warning.message.includes("required for all non-exempt records")
    )
  );
});

test("modern-countries requirement can be enabled as an error", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: []
      };
      provinceData.names = {
        ancient: ["Achaia"],
        modern: "Achaia",
        alternate: [],
        modernCountries: ["Greece"]
      };
    },
    { requireModernCountries: true }
  );

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("athens.json") &&
        error.path === "$.names.modernCountries" &&
        error.message.includes("required for all non-exempt records")
    )
  );
});

test("non-exempt records with empty names.modernCountries still fail the policy check", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: [],
        modernCountries: []
      };
      provinceData.names = {
        ancient: ["Achaia"],
        modern: "Achaia",
        alternate: [],
        modernCountries: ["Greece"]
      };
    },
    { requireModernCountries: true }
  );

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("athens.json") &&
        error.path === "$.names.modernCountries" &&
        error.message.includes("required for all non-exempt records")
    )
  );
});

test("exempt records must omit names.modernCountries (jerusalem and descendants)", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.id = "temple-mount";
      cityData.names = {
        ancient: ["Temple Mount"],
        modern: "Temple Mount",
        alternate: [],
        modernCountries: ["Israel"]
      };
      cityData.parentId = "jerusalem";

      provinceData.id = "jerusalem";
      provinceData.type = "city";
      provinceData.zoomTier = "city";
      provinceData.names = {
        ancient: ["Jerusalem"],
        modern: "Jerusalem",
        alternate: [],
        modernCountries: ["Israel"]
      };
      provinceData.parentId = "roman-empire";
    },
    { requireModernCountries: true }
  );

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("jerusalem.json") &&
        error.path === "$.names.modernCountries" &&
        error.message.includes("must be omitted for exempt records")
    )
  );
  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("temple-mount.json") &&
        error.path === "$.names.modernCountries" &&
        error.message.includes("must be omitted for exempt records")
    )
  );
});

test("area records without names.modern emit a warning when modern-countries requirement is off", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: [],
        modernCountries: ["Greece"]
      };
      provinceData.names = {
        ancient: ["Achaia"],
        alternate: [],
        modernCountries: ["Greece"]
      };
    },
    { requireModernCountries: false }
  );

  assert.equal(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.names.modern" &&
        error.message.includes("must define names.modern")
    ),
    false
  );
  assert.ok(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("achaia.json") &&
        warning.path === "$.names.modern" &&
        warning.message.includes("must define names.modern")
    )
  );
});

test("area records without names.modern fail when modern-countries requirement is enabled", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: [],
        modernCountries: ["Greece"]
      };
      provinceData.names = {
        ancient: ["Achaia"],
        alternate: [],
        modernCountries: ["Greece"]
      };
    },
    { requireModernCountries: true }
  );

  assert.ok(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.names.modern" &&
        error.message.includes("must define names.modern")
    )
  );
});

test("disputed area records may omit names.modern without triggering area-name requirement", async () => {
  const result = await runWithTemporaryHierarchyCase(
    ({ cityData, provinceData }) => {
      cityData.names = {
        ancient: ["Athens"],
        modern: "Athens",
        alternate: [],
        modernCountries: ["Greece"]
      };

      provinceData.names = {
        ancient: ["Achaia"],
        alternate: [],
        modernCountries: ["Greece"]
      };
      provinceData.candidates = [
        {
          ...provinceData.candidates[0],
          confidence: "disputed"
        },
        {
          ...provinceData.candidates[0],
          label: "Achaia alternate area (illustrative)",
          confidence: "medium",
          coordinates: [35.45, 32.9]
        }
      ];
    },
    { requireModernCountries: true }
  );

  assert.equal(
    hasError(
      result,
      (error) =>
        error.file.endsWith("achaia.json") &&
        error.path === "$.names.modern" &&
        error.message.includes("must define names.modern")
    ),
    false
  );
  assert.equal(
    hasWarning(
      result,
      (warning) =>
        warning.file.endsWith("achaia.json") &&
        warning.path === "$.names.modern" &&
        warning.message.includes("must define names.modern")
    ),
    false
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

test("names.otherLanguages accepts unique trimmed names", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: [],
      otherLanguages: ["Kfar Nahum", "Kefar Nahum"]
    };
  });

  assert.equal(result.errors.length, 0);
});

test("names.otherLanguages rejects untrimmed values", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: [],
      otherLanguages: [" Kfar Nahum"]
    };
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names.otherLanguages[0]" &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("names.otherLanguages rejects exact duplicate entries", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: [],
      otherLanguages: ["Kfar Nahum", "Kfar Nahum"]
    };
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names.otherLanguages" &&
        error.message.includes("Schema validation failed")
    )
  );
});

test("duplicate names across name fields fail after case-insensitive Unicode normalization", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: ["B\u00e9roea"],
      otherLanguages: ["B\u0045\u0301ROEA"]
    };
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names" &&
        error.message.includes("Duplicate location name")
    )
  );
});

test("duplicate names in ancient/alternate fail even when names.otherLanguages is absent", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: ["capernaum"]
    };
  });

  assert.ok(
    hasError(
      result,
      (error) =>
        error.path === "$.names" &&
        error.message.includes("Duplicate location name")
    )
  );
});

test("names.modern matching an ancient name is not a duplicate error (Rome case)", async () => {
  const result = await runWithTemporaryCase(({ capernaumData }) => {
    capernaumData.names = {
      ancient: ["Rome"],
      modern: "Rome",
      alternate: []
    };
  });

  assert.equal(
    hasError(
      result,
      (error) =>
        error.path === "$.names" &&
        error.message.includes("Duplicate location name")
    ),
    false
  );
});
