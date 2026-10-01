import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAppData } from "../scripts/lib/app-data-builder.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectory = path.join(testDirectory, "fixtures");
const validCaseDirectory = path.join(fixturesDirectory, "cases", "valid");
const invalidCaseDirectory = path.join(fixturesDirectory, "cases", "invalid-missing-bib");
const bibliographyFixturePath = path.join(fixturesDirectory, "bibliography.json");
const webFixturePath = path.join(fixturesDirectory, "web", "engwebp-mini.vpl.txt");

async function withTempDirectory(run) {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-build-data-"));
  try {
    return await run(tempDirectory);
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

function toDraftRecord(record) {
  const draftRecord = { ...record, status: "draft" };
  delete draftRecord.verifiedBy;
  delete draftRecord.lastReviewed;
  return draftRecord;
}

test("buildAppData writes compact index fields and candidate fields", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      // This fixture predates the empire/province hierarchy (M3-11).
      requireEmpireRoot: false,
      outputDirectory
    });

    const indexPath = path.join(outputDirectory, "places.index.json");
    const indexData = JSON.parse(await fs.readFile(indexPath, "utf8"));

    assert.equal(indexData.length, 2);

    for (const place of indexData) {
      assert.deepEqual(
        Object.keys(place).sort(),
        ["candidates", "id", "names", "parentId", "prominence", "type", "zoomTier"]
      );
      for (const candidate of place.candidates) {
        assert.deepEqual(Object.keys(candidate).sort(), [
          "confidence",
          "coordinates",
          "label"
        ]);
      }
    }
  });
});

test("buildAppData writes one place file per location and resolves bibliography", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      // This fixture predates the empire/province hierarchy (M3-11).
      requireEmpireRoot: false,
      outputDirectory
    });

    const placesDirectory = path.join(outputDirectory, "places");
    const placeFiles = (await fs.readdir(placesDirectory)).filter((name) =>
      name.endsWith(".json")
    );

    assert.deepEqual(placeFiles.sort(), ["capernaum.json", "galilee.json"]);

    const capernaumPayload = JSON.parse(
      await fs.readFile(path.join(placesDirectory, "capernaum.json"), "utf8")
    );
    assert.equal(capernaumPayload.location.id, "capernaum");
    assert.equal(capernaumPayload.media.locationId, "capernaum");
    assert.deepEqual(
      capernaumPayload.bibliography.map((entry) => entry.id),
      ["existing-bib-source"]
    );

    const galileePayload = JSON.parse(
      await fs.readFile(path.join(placesDirectory, "galilee.json"), "utf8")
    );
    assert.equal(galileePayload.location.id, "galilee");
    assert.equal(galileePayload.media, null);
    assert.deepEqual(galileePayload.bibliography, []);
  });
});

test("buildAppData fails when validation fails", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await assert.rejects(
      () =>
        buildAppData({
          locationsDirectory: path.join(invalidCaseDirectory, "locations"),
          mediaDirectory: path.join(invalidCaseDirectory, "media"),
          bibliographyPath: bibliographyFixturePath,
          webVplPath: webFixturePath,
          skipSnapshotChecksumCheck: true,
          outputDirectory
        }),
      (error) => {
        assert.match(error.message, /Data validation failed/u);
        assert.ok(error.validationResult);
        return true;
      }
    );
  });
});

test("buildAppData omits names.otherLanguages from index and place payload outputs", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const locationsDirectory = path.join(temporaryDirectory, "locations");
    const mediaDirectory = path.join(temporaryDirectory, "media");
    const outputDirectory = path.join(temporaryDirectory, "output");
    await fs.mkdir(locationsDirectory, { recursive: true });
    await fs.mkdir(mediaDirectory, { recursive: true });

    const capernaum = JSON.parse(
      await fs.readFile(
        path.join(validCaseDirectory, "locations", "capernaum.json"),
        "utf8"
      )
    );
    capernaum.names = {
      ancient: ["Capernaum"],
      modern: "Tell Hum",
      alternate: [],
      otherLanguages: ["Kfar Nahum"]
    };

    const galilee = JSON.parse(
      await fs.readFile(path.join(validCaseDirectory, "locations", "galilee.json"), "utf8")
    );

    await fs.writeFile(
      path.join(locationsDirectory, "capernaum.json"),
      `${JSON.stringify(capernaum, null, 2)}\n`,
      "utf8"
    );
    await fs.writeFile(
      path.join(locationsDirectory, "galilee.json"),
      `${JSON.stringify(galilee, null, 2)}\n`,
      "utf8"
    );

    await buildAppData({
      locationsDirectory,
      mediaDirectory,
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      // This fixture predates the empire/province hierarchy (M3-11).
      requireEmpireRoot: false,
      outputDirectory
    });

    const indexPath = path.join(outputDirectory, "places.index.json");
    const indexData = JSON.parse(await fs.readFile(indexPath, "utf8"));
    const capernaumIndex = indexData.find((record) => record.id === "capernaum");
    const galileeIndex = indexData.find((record) => record.id === "galilee");
    const capernaumPlacePath = path.join(outputDirectory, "places", "capernaum.json");
    const capernaumPlacePayload = JSON.parse(
      await fs.readFile(capernaumPlacePath, "utf8")
    );

    assert.equal(Object.hasOwn(capernaumIndex.names, "otherLanguages"), false);
    assert.equal(Object.hasOwn(galileeIndex.names, "otherLanguages"), false);
    assert.equal(
      Object.hasOwn(capernaumPlacePayload.location.names, "otherLanguages"),
      false
    );
  });
});

test("buildAppData keeps empire/province types and parent chain in places.index", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const locationsDirectory = path.join(temporaryDirectory, "locations");
    const mediaDirectory = path.join(temporaryDirectory, "media");
    const outputDirectory = path.join(temporaryDirectory, "output");
    await fs.mkdir(locationsDirectory, { recursive: true });
    await fs.mkdir(mediaDirectory, { recursive: true });

    const cityTemplate = JSON.parse(
      await fs.readFile(
        path.join(validCaseDirectory, "locations", "capernaum.json"),
        "utf8"
      )
    );
    const areaTemplate = JSON.parse(
      await fs.readFile(path.join(validCaseDirectory, "locations", "galilee.json"), "utf8")
    );

    const city = toDraftRecord({
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
    const province = toDraftRecord({
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
    const empire = toDraftRecord({
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
    delete empire.parentId;

    for (const locationRecord of [city, province, empire]) {
      await fs.writeFile(
        path.join(locationsDirectory, `${locationRecord.id}.json`),
        `${JSON.stringify(locationRecord, null, 2)}\n`,
        "utf8"
      );
    }

    await buildAppData({
      locationsDirectory,
      mediaDirectory,
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      outputDirectory
    });

    const indexData = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "places.index.json"), "utf8")
    );
    const indexById = new Map(indexData.map((record) => [record.id, record]));

    assert.equal(indexById.get("athens").type, "city");
    assert.equal(indexById.get("athens").parentId, "achaia");
    assert.equal(indexById.get("achaia").type, "province");
    assert.equal(indexById.get("achaia").parentId, "roman-empire");
    assert.equal(indexById.get("roman-empire").type, "empire");
    assert.equal(indexById.get("roman-empire").parentId, null);
  });
});
