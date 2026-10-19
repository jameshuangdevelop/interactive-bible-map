import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildAppData } from "../scripts/lib/app-data-builder.mjs";
import {
  __testOnly as ancientBuilderTestOnly,
  buildAncientAppData
} from "../scripts/lib/ancient-app-data-builder.mjs";
import { buildRoutesAppData } from "../scripts/lib/routes-app-data-builder.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..");
const fixturesDirectory = path.join(testDirectory, "fixtures");
const validCaseDirectory = path.join(fixturesDirectory, "cases", "valid");
const invalidCaseDirectory = path.join(fixturesDirectory, "cases", "invalid-missing-bib");
const bibliographyFixturePath = path.join(fixturesDirectory, "bibliography.json");
const webFixturePath = path.join(fixturesDirectory, "web", "engwebp-mini.vpl.txt");
const ancientFixtureDirectory = path.join(fixturesDirectory, "ancient");
const ancientTimelinePath = path.join(ancientFixtureDirectory, "timeline.json");
const ancientAreasPath = path.join(ancientFixtureDirectory, "geo", "ancient-areas.geojson");
const ancientRoadsPath = path.join(ancientFixtureDirectory, "geo", "ancient-roads.geojson");
const ancientCoastlinePath = path.join(
  ancientFixtureDirectory,
  "geo",
  "ancient-coastline.geojson"
);
const ancientEmpireEdgePath = path.join(
  ancientFixtureDirectory,
  "geo",
  "ancient-empire-edge.geojson"
);
const routesFixtureDirectory = path.join(fixturesDirectory, "routes");
const routesFixturePath = path.join(routesFixtureDirectory, "routes.json");
const routeStopsFixturePath = path.join(routesFixtureDirectory, "stops.json");
const routeLinesFixturePath = path.join(routesFixtureDirectory, "routes-lines.geojson");
// The route-line audit measures the fixture lines against fixture land and lakes.
const routeLineSurfaceFixtures = {
  routeLineLandPath: path.join(routesFixtureDirectory, "route-line-land.geojson"),
  routeLineLakesPath: path.join(routesFixtureDirectory, "route-line-lakes.geojson")
};
const repositoryImagePromptsDirectory = path.join(
  repositoryRoot,
  "content",
  "image-prompts"
);

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

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previousIndex];
    const intersects = (y1 > point[1]) !== (y2 > point[1]) &&
      point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!pointInRing(point, polygon[0])) {
    return false;
  }
  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(point, polygon[index])) {
      return false;
    }
  }
  return true;
}

test("holder-label projection uses MapLibre world size (512 tiles)", () => {
  const [x] = ancientBuilderTestOnly.projectLngLatToPixels(0, 0, 0);
  assert.equal(x, 256);
});

test("holder-label width estimate is at least real Noto Sans Bold advances", () => {
  const advanceAt24 = {
    A: 16,
    B: 16,
    C: 15,
    D: 17,
    E: 13,
    F: 13,
    G: 17,
    H: 18,
    I: 9,
    J: 7,
    K: 15,
    L: 13,
    M: 22,
    N: 19,
    O: 19,
    P: 15,
    Q: 19,
    R: 15,
    S: 13,
    T: 13,
    U: 18,
    V: 15,
    W: 23,
    X: 16,
    Y: 14,
    Z: 13,
    " ": 6
  };

  const realAdvanceWidth = (text) => {
    const characters = [...text];
    const glyphSum = characters.reduce((sum, character) => {
      const advance = advanceAt24[character] ?? advanceAt24[character.toUpperCase()] ?? 23;
      return sum + (advance * 13) / 24;
    }, 0);
    const letterSpacing = Math.max(0, characters.length - 1) * 13 * 0.18;
    return glyphSum + letterSpacing;
  };

  const tetrarchyEstimate = ancientBuilderTestOnly.estimateHolderLabelLineWidthPx("TETRARCHY OF");
  const romanProvinceEstimate = ancientBuilderTestOnly.estimateHolderLabelLineWidthPx("PROVINCE OF");

  assert.ok(tetrarchyEstimate >= realAdvanceWidth("TETRARCHY OF"));
  assert.ok(romanProvinceEstimate >= realAdvanceWidth("PROVINCE OF"));
});

test("buildAppData writes compact index fields and candidate fields", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      // This fixture predates the empire/province hierarchy (M3-11)
      // and names.modernCountries.
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    const indexPath = path.join(outputDirectory, "places.index.json");
    const indexData = JSON.parse(await fs.readFile(indexPath, "utf8"));

    assert.equal(indexData.length, 2);

    for (const place of indexData) {
      assert.deepEqual(
        Object.keys(place).sort(),
        [
          "candidates",
          "id",
          "names",
          "parentId",
          "passageCount",
          "prominence",
          "type",
          "zoomTier"
        ]
      );
      for (const candidate of place.candidates) {
        assert.deepEqual(Object.keys(candidate).sort(), [
          "confidence",
          "coordinates",
          "label"
        ]);
      }
    }

    const indexById = new Map(indexData.map((place) => [place.id, place]));
    assert.equal(indexById.get("capernaum")?.passageCount, 1);
    assert.equal(indexById.get("galilee")?.passageCount, 1);
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
      // This fixture predates the empire/province hierarchy (M3-11)
      // and names.modernCountries.
      requireEmpireRoot: false,
      requireModernCountries: false,
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
    assert.equal(capernaumPayload.media.images[0].width, 1600);
    assert.equal(capernaumPayload.media.images[0].height, 1200);
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

test("buildAppData with fixture directories is isolated from repository prompt briefs", async () => {
  const poisonFileName = `__tmp-validator-isolation-${Date.now()}-${process.pid}.md`;
  const poisonPromptPath = path.join(repositoryImagePromptsDirectory, poisonFileName);
  const promptDirectoryExistedBefore = await fs
    .stat(repositoryImagePromptsDirectory)
    .then(() => true)
    .catch((error) => {
      if (error?.code === "ENOENT") {
        return false;
      }
      throw error;
    });

  try {
    await fs.mkdir(repositoryImagePromptsDirectory, { recursive: true });
    await fs.writeFile(
      poisonPromptPath,
      "# Temporary isolation probe\n\n[bib:missing-isolation-check]\n",
      "utf8"
    );

    await withTempDirectory(async (outputDirectory) => {
      await buildAppData({
        locationsDirectory: path.join(validCaseDirectory, "locations"),
        mediaDirectory: path.join(validCaseDirectory, "media"),
        bibliographyPath: bibliographyFixturePath,
        webVplPath: webFixturePath,
        skipSnapshotChecksumCheck: true,
        // This fixture predates the empire/province hierarchy (M3-11)
        // and names.modernCountries.
        requireEmpireRoot: false,
        requireModernCountries: false,
        outputDirectory
      });

      const indexPath = path.join(outputDirectory, "places.index.json");
      const indexData = JSON.parse(await fs.readFile(indexPath, "utf8"));
      assert.equal(indexData.length, 2);
    });
  } finally {
    await fs.rm(poisonPromptPath, { force: true });
    if (!promptDirectoryExistedBefore) {
      await fs.rmdir(repositoryImagePromptsDirectory).catch((error) => {
        if (error?.code !== "ENOENT" && error?.code !== "ENOTEMPTY") {
          throw error;
        }
      });
    }
  }
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

test("buildAppData omits names.otherLanguages but keeps names.modernCountries in index and place payload outputs", async () => {
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
      modernCountries: ["Israel"],
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
      // This fixture predates the empire/province hierarchy (M3-11)
      // and names.modernCountries.
      requireEmpireRoot: false,
      requireModernCountries: false,
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
    assert.deepEqual(capernaumIndex.names.modernCountries, ["Israel"]);
    assert.equal(
      Object.hasOwn(capernaumPlacePayload.location.names, "otherLanguages"),
      false
    );
    assert.deepEqual(capernaumPlacePayload.location.names.modernCountries, ["Israel"]);
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
      // This fixture predates names.modernCountries.
      requireModernCountries: false,
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

test("buildAppData carries naturalFeatureKind into places.index", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const locationsDirectory = path.join(temporaryDirectory, "locations");
    const mediaDirectory = path.join(temporaryDirectory, "media");
    const outputDirectory = path.join(temporaryDirectory, "output");
    await fs.mkdir(locationsDirectory, { recursive: true });
    await fs.mkdir(mediaDirectory, { recursive: true });

    const capernaumRecord = JSON.parse(
      await fs.readFile(path.join(validCaseDirectory, "locations", "capernaum.json"), "utf8")
    );
    const galileeRecord = JSON.parse(
      await fs.readFile(path.join(validCaseDirectory, "locations", "galilee.json"), "utf8")
    );

    capernaumRecord.type = "natural-feature";
    capernaumRecord.naturalFeatureKind = "water";

    await fs.writeFile(
      path.join(locationsDirectory, "capernaum.json"),
      `${JSON.stringify(capernaumRecord, null, 2)}\n`,
      "utf8"
    );
    await fs.writeFile(
      path.join(locationsDirectory, "galilee.json"),
      `${JSON.stringify(galileeRecord, null, 2)}\n`,
      "utf8"
    );

    await buildAppData({
      locationsDirectory,
      mediaDirectory,
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    const indexData = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "places.index.json"), "utf8")
    );
    const capernaumIndex = indexData.find((record) => record.id === "capernaum");
    assert.equal(capernaumIndex?.type, "natural-feature");
    assert.equal(capernaumIndex?.naturalFeatureKind, "water");
  });
});

test("buildAppData writes ancient generated files with holder borders, empire edge, and holder labels", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      timelinePath: ancientTimelinePath,
      ancientAreasPath,
      ancientRoadsPath,
      ancientCoastlinePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    const timelinePayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.timeline.json"), "utf8")
    );
    assert.equal(timelinePayload.stops.length, 2);
    assert.equal(timelinePayload.defaultStopId, "ad44");
    assert.equal(Array.isArray(timelinePayload.bibliography), true);
    assert.equal(timelinePayload.bibliography.length, 1);
    assert.equal(timelinePayload.bibliography[0].id, "pleiades-place-resource");

    const stopPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.stop.4bc.json"), "utf8")
    );
    const galileeAt4bc = stopPayload.areas.find((area) => area.areaId === "galilee");
    assert.equal(galileeAt4bc?.heldFromYear, -4);
    assert.equal(galileeAt4bc?.heldToYear, 44);
    assert.equal(galileeAt4bc?.heldFromKnown, false);
    assert.ok(
      stopPayload.holderLabels.some((entry) => entry.holderId === "client-antipas"),
      "expected holder label for client-antipas"
    );
    const antipasLabel = stopPayload.holderLabels.find((entry) => entry.holderId === "client-antipas");
    assert.equal(typeof antipasLabel?.labelText, "string");
    assert.equal(typeof antipasLabel?.minZoom, "number");
    assert.equal(
      stopPayload.holderLabels.some((entry) => entry.holderId === "uncertain-roman-side"),
      false
    );
    assert.ok(
      stopPayload.holderBorders.features.some(
        (feature) =>
          (feature.properties.holderAAreaId === "galilee" &&
            feature.properties.holderBAreaId === "judaea-heartland") ||
          (feature.properties.holderAAreaId === "judaea-heartland" &&
            feature.properties.holderBAreaId === "galilee")
      ),
      "expected province/client border"
    );
    assert.equal(stopPayload.romanEmpireEdge.type, "MultiLineString");
    const ad44Payload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.stop.ad44.json"), "utf8")
    );
    const pereaAtAd44 = ad44Payload.areas.find((area) => area.areaId === "perea");
    assert.equal(
      pereaAtAd44?.note,
      "Status in the sources is unclear for this interval (fixture)."
    );
    assert.equal(pereaAtAd44?.heldFromYear, 44);
    assert.equal(pereaAtAd44?.heldToYear, 101);
    assert.equal(pereaAtAd44?.heldFromKnown, true);
    assert.equal(
      ad44Payload.holderBorders.features.some(
        (feature) =>
          (feature.properties.holderAAreaId === "galilee" &&
            feature.properties.holderBAreaId === "judaea-heartland") ||
          (feature.properties.holderAAreaId === "judaea-heartland" &&
            feature.properties.holderBAreaId === "galilee")
      ),
      false
    );

    const shapesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.shapes.json"), "utf8")
    );
    assert.equal(shapesPayload.areas.features.length, 4);
    assert.equal(shapesPayload.areasSimplifiedForZoom10.features.length, 4);
    // Provenance stays in data/geo/; the app's shapes carry only each area's id.
    for (const shapes of [shapesPayload.areas, shapesPayload.areasSimplifiedForZoom10]) {
      for (const shape of shapes.features) {
        assert.deepEqual(Object.keys(shape.properties), ["areaId"]);
      }
    }

    const outputFiles = await fs.readdir(outputDirectory);
    assert.ok(outputFiles.includes("ancient.roads.geojson"));
    // The app's roads keep the drawing flags but, like the shapes, leave the provenance in data/geo/.
    const roadsPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.roads.geojson"), "utf8")
    );
    assert.equal(roadsPayload.features.length, 1);
    assert.deepEqual(roadsPayload.features[0].properties, {
      roadId: "fixture-road-1",
      major: true,
      known: false,
      timeperiod: "R"
    });

    assert.ok(outputFiles.includes("ancient.coastline.geojson"));
    // No empire-edge source sits next to the valid case's data, so none is written.
    assert.equal(outputFiles.includes("ancient.empire-edge.geojson"), false);
  });
});

test("buildAppData writes the static empire edge once when the layer is present", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const result = await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      timelinePath: ancientTimelinePath,
      ancientAreasPath,
      ancientRoadsPath,
      ancientCoastlinePath,
      ancientEmpireEdgePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    const edgeFiles = result.outputFiles.filter(
      (entry) => entry.file === "ancient.empire-edge.geojson"
    );
    assert.equal(edgeFiles.length, 1);
    assert.ok(edgeFiles[0].gzipBytes > 0);

    const edgePayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.empire-edge.geojson"), "utf8")
    );
    assert.equal(edgePayload.type, "FeatureCollection");
    assert.equal(edgePayload.features.length, 1);
    assert.equal(edgePayload.features[0].properties.edgeId, "fixture-empire-edge");
    assert.deepEqual(edgePayload.features[0].geometry.coordinates, [
      [3, 0],
      [3, 1]
    ]);

    // Stops keep their own per-year edge alongside the static file.
    const stopPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.stop.4bc.json"), "utf8")
    );
    assert.equal(stopPayload.romanEmpireEdge.type, "MultiLineString");
  });
});

test("buildAppData fails when the empire edge layer is invalid", async () => {
  await withTempDirectory(async (temporaryDirectory) => {
    const invalidEdgePath = path.join(temporaryDirectory, "ancient-empire-edge.geojson");
    const edgeData = JSON.parse(await fs.readFile(ancientEmpireEdgePath, "utf8"));
    delete edgeData.features[0].properties.edgeId;
    await fs.writeFile(invalidEdgePath, `${JSON.stringify(edgeData, null, 2)}\n`);

    await assert.rejects(
      buildAppData({
        locationsDirectory: path.join(validCaseDirectory, "locations"),
        mediaDirectory: path.join(validCaseDirectory, "media"),
        bibliographyPath: bibliographyFixturePath,
        timelinePath: ancientTimelinePath,
        ancientAreasPath,
        ancientRoadsPath,
        ancientCoastlinePath,
        ancientEmpireEdgePath: invalidEdgePath,
        webVplPath: webFixturePath,
        skipSnapshotChecksumCheck: true,
        requireEmpireRoot: false,
        requireModernCountries: false,
        outputDirectory: path.join(temporaryDirectory, "output")
      }),
      /Data validation failed/u
    );
  });
});

test("buildAppData skips ancient generated files when timeline is absent", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const result = await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    assert.equal(result.ancientBuild.generated, false);
    assert.match(
      result.ancientBuild.skippedReason,
      /Skipped ancient generated files/u
    );

    const outputFiles = await fs.readdir(outputDirectory);
    assert.equal(
      outputFiles.some((fileName) => fileName.startsWith("ancient.")),
      false
    );
  });
});

test("buildAppData supports ancient-source fixture directory", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const result = await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      ancientSourceDirectory: ancientFixtureDirectory,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    assert.equal(result.ancientBuild.generated, true);

    const stopPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.stop.4bc.json"), "utf8")
    );
    assert.ok(Array.isArray(stopPayload.holderLabels));

    const outputFiles = await fs.readdir(outputDirectory);
    assert.ok(outputFiles.includes("ancient.empire-edge.geojson"));
  });
});

test("buildAppData writes routes generated files and fixture files", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const result = await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      routesPath: routesFixturePath,
      routeStopsPath: routeStopsFixturePath,
      routeLinesPath: routeLinesFixturePath,
      ...routeLineSurfaceFixtures,
      routesFixtureDirectory,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    assert.equal(result.routesBuild.generated, true);
    assert.ok(result.routesBuild.gzipBytes > 0);
    assert.equal(result.routesBuild.fixtureGenerated, true);

    const requiredFiles = [
      "routes.routes.json",
      "routes.stages.json",
      "routes.stops.json",
      "routes.lines.geojson",
      "routes.fixture.routes.json",
      "routes.fixture.stages.json",
      "routes.fixture.stops.json",
      "routes.fixture.lines.geojson"
    ];
    for (const fileName of requiredFiles) {
      await fs.access(path.join(outputDirectory, fileName));
    }

    const stagesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "routes.stages.json"), "utf8")
    );
    const routesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "routes.routes.json"), "utf8")
    );
    const fixtureRoutesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "routes.fixture.routes.json"), "utf8")
    );
    assert.equal(stagesPayload.routes.length, 2);
    assert.match(stagesPayload.routes[0].stages[0].scripture[0].textWEB, /Pentecost/u);
    assert.equal(routesPayload.routes[0].summary, "Fixture summary for route-level text validation.");
    assert.equal(
      routesPayload.routes[0].bibleText,
      "Fixture bibleText paragraph for route-level text validation."
    );
    assert.deepEqual(routesPayload.routes[0].notes, [
      "Fixture disclaimer one.",
      "Fixture disclaimer two."
    ]);
    assert.equal("note" in routesPayload.routes[0], false);
    assert.equal("yearNote" in routesPayload.routes[0], false);
    assert.deepEqual(stagesPayload.routes[0].stages[1].mentioned, [
      {
        kind: "route-stop",
        stopId: "disputed-stop-fixture",
        candidateIndex: 1
      }
    ]);
    assert.deepEqual(
      routesPayload.bibliography.map((entry) => entry.id),
      ["existing-bib-source"]
    );
    assert.deepEqual(
      fixtureRoutesPayload.bibliography.map((entry) => entry.id),
      ["existing-bib-source"]
    );
  });
});

test("buildAppData fails when routes generated files exceed the gzip budget", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await assert.rejects(
      () =>
        buildAppData({
          locationsDirectory: path.join(validCaseDirectory, "locations"),
          mediaDirectory: path.join(validCaseDirectory, "media"),
          bibliographyPath: bibliographyFixturePath,
          routesPath: routesFixturePath,
          routeStopsPath: routeStopsFixturePath,
          routeLinesPath: routeLinesFixturePath,
          ...routeLineSurfaceFixtures,
          routesFixtureDirectory,
          webVplPath: webFixturePath,
          skipSnapshotChecksumCheck: true,
          requireEmpireRoot: false,
          requireModernCountries: false,
          outputDirectory,
          maxRoutesLayerGzipBytes: 1
        }),
      /Routes generated files exceed/u
    );
  });
});

test("buildRoutesAppData embeds cited bibliography entries sorted by id", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildRoutesAppData({
      routesData: {
        version: 1,
        routes: [
          {
            id: "fixture-route",
            title: "Fixture route",
            fromYear: 46,
            toYear: 47,
            structure: "connected",
            summary: "Summary",
            bibleText: "Bible text",
            notes: ["Note"],
            sources: ["bib:z-source"],
            stages: [
              {
                id: "fixture-stage-1",
                from: { kind: "location", locationId: "antioch-syria" },
                to: { kind: "location", locationId: "cyprus" },
                scripture: [],
                travelMode: "land",
                sources: ["bib:a-source"]
              }
            ]
          }
        ]
      },
      routeStopsData: { version: 1, stops: [] },
      routeLinesData: { type: "FeatureCollection", features: [] },
      webVerseIndex: new Map(),
      bibliographyById: new Map([
        [
          "a-source",
          {
            id: "a-source",
            type: "book",
            title: "A source",
            authors: ["A. Writer"],
            year: 2026
          }
        ],
        [
          "z-source",
          {
            id: "z-source",
            type: "book",
            title: "Z source",
            authors: ["Z. Writer"],
            year: 2026
          }
        ]
      ]),
      outputDirectory,
      outputPrefix: "routes"
    });

    const routesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "routes.routes.json"), "utf8")
    );
    assert.deepEqual(
      routesPayload.bibliography.map((entry) => entry.id),
      ["a-source", "z-source"]
    );
  });
});

test("buildRoutesAppData throws when a cited bibliography entry is missing", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await assert.rejects(
      () =>
        buildRoutesAppData({
          routesData: {
            version: 1,
            routes: [
              {
                id: "fixture-route",
                title: "Fixture route",
                fromYear: 46,
                toYear: 47,
                structure: "connected",
                summary: "Summary",
                bibleText: "Bible text",
                notes: ["Note"],
                sources: ["bib:missing-source"],
                stages: []
              }
            ]
          },
          routeStopsData: { version: 1, stops: [] },
          routeLinesData: { type: "FeatureCollection", features: [] },
          webVerseIndex: new Map(),
          bibliographyById: new Map(),
          outputDirectory,
          outputPrefix: "routes"
        }),
      /Missing bibliography entry 'missing-source' while building routes payload for 'routes'\./u
    );
  });
});

test("buildAppData fails when ancient generated files exceed the gzip budget", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await assert.rejects(
      () =>
        buildAppData({
          locationsDirectory: path.join(validCaseDirectory, "locations"),
          mediaDirectory: path.join(validCaseDirectory, "media"),
          bibliographyPath: bibliographyFixturePath,
          ancientSourceDirectory: ancientFixtureDirectory,
          webVplPath: webFixturePath,
          skipSnapshotChecksumCheck: true,
          requireEmpireRoot: false,
          requireModernCountries: false,
          outputDirectory,
          maxAncientLayerGzipBytes: 1
        }),
      /Ancient layer generated files exceed/u
    );
  });
});

test("buildAncientAppData keeps label points inside concave polygons", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const timelineData = {
      version: 1,
      range: { fromYear: -4, toYear: 101, defaultYear: 44 },
      stops: [
        {
          id: "ad44",
          year: 44,
          title: "Fixture stop",
          summary: "Fixture stop summary",
          sources: ["bib:pleiades-place-resource"]
        }
      ],
      entities: [
        {
          id: "holder-concave",
          name: "Concave holder",
          kind: "roman-province",
          romanSide: true,
          sources: ["bib:pleiades-place-resource"]
        }
      ],
      areas: [
        {
          id: "concave-area",
          periods: [
            {
              fromYear: -4,
              toYear: 101,
              holderId: "holder-concave",
              sources: ["bib:pleiades-place-resource"]
            }
          ]
        }
      ]
    };

    const concavePolygon = [
      [0, 0],
      [0.6, 0],
      [0.6, 0.2],
      [0.2, 0.2],
      [0.2, 0.4],
      [0.6, 0.4],
      [0.6, 0.6],
      [0, 0.6],
      [0, 0]
    ];

    const ancientAreasData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            areaId: "concave-area",
            provenance: {
              dataset: "fixture",
              version: "fixture-1",
              upstreamFeatureIds: ["awmc:fixture-concave"],
              changes: [
                {
                  kind: "none",
                  detail: "fixture",
                  sources: ["bib:pleiades-place-resource"]
                }
              ]
            }
          },
          geometry: {
            type: "Polygon",
            coordinates: [concavePolygon]
          }
        }
      ]
    };

    await buildAncientAppData({
      timelineData,
      ancientAreasData,
      ancientRoadsData: { type: "FeatureCollection", features: [] },
      ancientCoastlineData: { type: "FeatureCollection", features: [] },
      outputDirectory
    });

    const stopPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.stop.ad44.json"), "utf8")
    );
    const label = stopPayload.holderLabels.find((entry) => entry.holderId === "holder-concave");
    assert.ok(label, "expected concave holder label");
    assert.equal(pointInPolygon(label.labelPoint, [concavePolygon]), true);
  });
});

test("buildAppData keeps every holder label point inside at least one held area", async () => {
  await withTempDirectory(async (outputDirectory) => {
    await buildAppData({
      locationsDirectory: path.join(validCaseDirectory, "locations"),
      mediaDirectory: path.join(validCaseDirectory, "media"),
      bibliographyPath: bibliographyFixturePath,
      timelinePath: ancientTimelinePath,
      ancientAreasPath,
      ancientRoadsPath,
      ancientCoastlinePath,
      webVplPath: webFixturePath,
      skipSnapshotChecksumCheck: true,
      requireEmpireRoot: false,
      requireModernCountries: false,
      outputDirectory
    });

    const shapesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.shapes.json"), "utf8")
    );
    const geometryByAreaId = new Map(
      shapesPayload.areas.features.map((feature) => [feature.properties.areaId, feature.geometry])
    );
    const timelinePayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.timeline.json"), "utf8")
    );

    for (const stop of timelinePayload.stops) {
      const stopPayload = JSON.parse(
        await fs.readFile(path.join(outputDirectory, `ancient.stop.${stop.id}.json`), "utf8")
      );
      const holderPolygonsById = new Map();
      for (const assignment of stopPayload.areas) {
        const geometry = geometryByAreaId.get(assignment.areaId);
        if (!geometry) {
          continue;
        }

        const polygons =
          geometry.type === "Polygon"
            ? [geometry.coordinates]
            : geometry.type === "MultiPolygon"
              ? geometry.coordinates
              : [];

        const existing = holderPolygonsById.get(assignment.holderId) ?? [];
        for (const polygon of polygons) {
          existing.push(polygon);
        }
        holderPolygonsById.set(assignment.holderId, existing);
      }

      for (const label of stopPayload.holderLabels) {
        const holderPolygons = holderPolygonsById.get(label.holderId) ?? [];
        assert.equal(
          holderPolygons.some((polygon) => pointInPolygon(label.labelPoint, polygon)),
          true,
          `holder label '${label.holderId}' in stop '${stop.id}' must lie inside one of its areas`
        );
      }
    }
  });
});
