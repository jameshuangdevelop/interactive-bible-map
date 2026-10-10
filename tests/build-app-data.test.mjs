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
const repositoryLocationsDirectory = path.join(repositoryRoot, "data", "locations");
const repositoryTimelinePath = path.join(repositoryRoot, "data", "timeline.json");
const repositoryAncientAreasPath = path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson");
const repositoryAncientRoadsPath = path.join(repositoryRoot, "data", "geo", "ancient-roads.geojson");
const repositoryAncientCoastlinePath = path.join(
  repositoryRoot,
  "data",
  "geo",
  "ancient-coastline.geojson"
);
const repositoryAncientEmpireEdgePath = path.join(
  repositoryRoot,
  "data",
  "geo",
  "ancient-empire-edge.geojson"
);
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
  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(point, polygon[index])) {
      return false;
    }
  }
  return true;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(pointA, pointB) {
  const [lonA, latA] = pointA;
  const [lonB, latB] = pointB;
  const latitudeDelta = toRadians(latB - latA);
  const longitudeDelta = toRadians(lonB - lonA);
  const latitudeA = toRadians(latA);
  const latitudeB = toRadians(latB);
  const sinLatitude = Math.sin(latitudeDelta / 2);
  const sinLongitude = Math.sin(longitudeDelta / 2);
  const haversine =
    sinLatitude * sinLatitude +
    Math.cos(latitudeA) * Math.cos(latitudeB) * sinLongitude * sinLongitude;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
  return 6371.0088 * arc;
}

function distancePointToSegmentKm(point, segmentStart, segmentEnd) {
  const referenceLatitude = point[1];
  const metersPerDegree = 111320;
  const metersPerDegreeLon = metersPerDegree * Math.cos((referenceLatitude * Math.PI) / 180);
  const pointX = point[0] * metersPerDegreeLon;
  const pointY = point[1] * metersPerDegree;
  const startX = segmentStart[0] * metersPerDegreeLon;
  const startY = segmentStart[1] * metersPerDegree;
  const endX = segmentEnd[0] * metersPerDegreeLon;
  const endY = segmentEnd[1] * metersPerDegree;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (deltaX === 0 && deltaY === 0) {
    return haversineDistanceKm(point, segmentStart);
  }
  const t = ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
  const clampedT = Math.max(0, Math.min(1, t));
  const nearestPoint = [
    segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * clampedT,
    segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * clampedT
  ];
  return haversineDistanceKm(point, nearestPoint);
}

function normalizeLabelText(value) {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

let realDataFixturePromise = null;

async function loadRealDataFixture() {
  if (realDataFixturePromise) {
    return realDataFixturePromise;
  }

  realDataFixturePromise = withTempDirectory(async (outputDirectory) => {
    const [timelineData, ancientAreasData, ancientRoadsData, ancientCoastlineData, ancientEmpireEdgeData] =
      await Promise.all([
        fs.readFile(repositoryTimelinePath, "utf8").then((content) => JSON.parse(content)),
        fs.readFile(repositoryAncientAreasPath, "utf8").then((content) => JSON.parse(content)),
        fs.readFile(repositoryAncientRoadsPath, "utf8").then((content) => JSON.parse(content)),
        fs.readFile(repositoryAncientCoastlinePath, "utf8").then((content) => JSON.parse(content)),
        fs.readFile(repositoryAncientEmpireEdgePath, "utf8").then((content) => JSON.parse(content))
      ]);

    const locationRecords = await Promise.all(
      (await fs.readdir(repositoryLocationsDirectory))
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) =>
          fs.readFile(path.join(repositoryLocationsDirectory, fileName), "utf8").then((content) => JSON.parse(content))
        )
    );
    const majorPlacePinCoordinates = locationRecords
      .filter((locationRecord) => locationRecord.prominence === "major" && locationRecord.zoomTier === "city")
      .flatMap((locationRecord) =>
        (locationRecord.candidates ?? [])
          .filter(
            (candidate) =>
              Array.isArray(candidate?.coordinates) &&
              candidate.coordinates.length >= 2 &&
              typeof candidate.coordinates[0] === "number" &&
              typeof candidate.coordinates[1] === "number"
          )
          .map((candidate) => ({
            placeId: locationRecord.id,
            coordinates: [candidate.coordinates[0], candidate.coordinates[1]]
          }))
      );

    const ancientBuildResult = await buildAncientAppData({
      timelineData,
      ancientAreasData,
      ancientRoadsData,
      ancientCoastlineData,
      ancientEmpireEdgeData,
      majorPlacePinCoordinates,
      outputDirectory
    });

    const timelinePayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.timeline.json"), "utf8")
    );
    const roadsPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.roads.geojson"), "utf8")
    );
    const shapesPayload = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "ancient.shapes.json"), "utf8")
    );
    const stopPayloadById = new Map(
      await Promise.all(
        timelinePayload.stops.map(async (stop) => [
          stop.id,
          JSON.parse(
            await fs.readFile(path.join(outputDirectory, `ancient.stop.${stop.id}.json`), "utf8")
          )
        ])
      )
    );

    const stopForYear = (year) =>
      [...timelinePayload.stops]
        .sort((left, right) => left.year - right.year)
        .filter((stop) => stop.year <= year)
        .at(-1);
    const stopPayloadForYear = (year) => {
      const stop = stopForYear(year);
      assert.ok(stop, `expected stop in force for year ${year}`);
      return stopPayloadById.get(stop.id);
    };

    return {
      timelineData,
      timelinePayload,
      roadsPayload,
      shapesPayload,
      stopPayloadById,
      stopPayloadForYear,
      ancientRoadFeatureCount: ancientRoadsData.features.length,
      ancientBuildResult
    };
  });

  return realDataFixturePromise;
}

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

    test("buildAncientAppData computes holder label fit/minZoom and known-start spans for real data", async () => {
      await withTempDirectory(async (outputDirectory) => {
        const [timelineData, ancientAreasData, ancientRoadsData, ancientCoastlineData, ancientEmpireEdgeData] =
          await Promise.all([
            fs.readFile(repositoryTimelinePath, "utf8").then((content) => JSON.parse(content)),
            fs.readFile(repositoryAncientAreasPath, "utf8").then((content) => JSON.parse(content)),
            fs.readFile(repositoryAncientRoadsPath, "utf8").then((content) => JSON.parse(content)),
            fs.readFile(repositoryAncientCoastlinePath, "utf8").then((content) => JSON.parse(content)),
            fs.readFile(repositoryAncientEmpireEdgePath, "utf8").then((content) => JSON.parse(content))
          ]);

        const locationRecords = await Promise.all(
          (await fs.readdir(repositoryLocationsDirectory))
            .filter((fileName) => fileName.endsWith(".json"))
            .map((fileName) =>
              fs.readFile(path.join(repositoryLocationsDirectory, fileName), "utf8").then((content) => JSON.parse(content))
            )
        );
        const majorPlacePinCoordinates = locationRecords
          .filter((locationRecord) => locationRecord.prominence === "major" && locationRecord.zoomTier === "city")
          .flatMap((locationRecord) =>
            (locationRecord.candidates ?? [])
              .filter(
                (candidate) =>
                  Array.isArray(candidate?.coordinates) &&
                  candidate.coordinates.length >= 2 &&
                  typeof candidate.coordinates[0] === "number" &&
                  typeof candidate.coordinates[1] === "number"
              )
              .map((candidate) => ({
                placeId: locationRecord.id,
                coordinates: [candidate.coordinates[0], candidate.coordinates[1]]
              }))
          );

        const ancientBuildResult = await buildAncientAppData({
          timelineData,
          ancientAreasData,
          ancientRoadsData,
          ancientCoastlineData,
          ancientEmpireEdgeData,
          majorPlacePinCoordinates,
          outputDirectory
        });

        const roadsPayload = await fs
          .readFile(path.join(outputDirectory, "ancient.roads.geojson"), "utf8")
          .then((content) => JSON.parse(content));
        const roadFeatures = roadsPayload.features ?? [];
        const joinFeatures = roadFeatures.slice(ancientRoadsData.features.length);
        assert.ok(joinFeatures.length > 0, "expected generated road joins in ancient.roads.geojson");
        const ephesusRoadBreakStart = [28.6193, 37.8916];
        const targetRoadIds = new Set(["awmc-road-614-2686", "awmc-road-642-2241"]);
        const targetRoadGeometries = roadFeatures
          .filter((feature) => targetRoadIds.has(feature?.properties?.roadId))
          .map((feature) => feature.geometry)
          .filter(Boolean);
        assert.ok(targetRoadGeometries.length > 0, "expected target roads for Ephesus–Laodicea join");
        const matchingJoin = joinFeatures.find((joinFeature) => {
          if (joinFeature?.geometry?.type !== "LineString" || !Array.isArray(joinFeature.geometry.coordinates)) {
            return false;
          }
          const [a, b] = joinFeature.geometry.coordinates;
          const startDistance = Math.min(
            haversineDistanceKm(a, ephesusRoadBreakStart),
            haversineDistanceKm(b, ephesusRoadBreakStart)
          );
          if (startDistance > 0.05) {
            return false;
          }
          const otherPoint =
            haversineDistanceKm(a, ephesusRoadBreakStart) <= haversineDistanceKm(b, ephesusRoadBreakStart)
              ? b
              : a;
          const minDistanceToTargetRoad = targetRoadGeometries.reduce((minimum, geometry) => {
            const lines =
              geometry.type === "LineString"
                ? [geometry.coordinates]
                : geometry.type === "MultiLineString"
                  ? geometry.coordinates
                  : [];
            for (const line of lines) {
              for (let index = 0; index < line.length - 1; index += 1) {
                minimum = Math.min(
                  minimum,
                  distancePointToSegmentKm(otherPoint, line[index], line[index + 1])
                );
              }
            }
            return minimum;
          }, Number.POSITIVE_INFINITY);
          return minDistanceToTargetRoad <= 0.02;
        });
        assert.ok(
          matchingJoin,
          "expected (28.6193,37.8916) to join the awmc-road-614-2686 / awmc-road-642-2241 road"
        );

        assert.ok(
          ancientBuildResult.roadJoinCount > 0,
          "expected generated road joins in ancient.roads.geojson"
        );
        assert.ok(
          ancientBuildResult.roadJoinMaxLengthKm <= 4.001,
          `expected no generated road join longer than 4 km, got ${ancientBuildResult.roadJoinMaxLengthKm.toFixed(3)} km`
        );

        const stopForYear = (year) =>
          [...timelineData.stops]
            .sort((left, right) => left.year - right.year)
            .filter((stop) => stop.year <= year)
            .at(-1);
        const readStopPayload = async (year) => {
          const stop = stopForYear(year);
          assert.ok(stop, `expected stop in force for year ${year}`);
          return fs
            .readFile(path.join(outputDirectory, `ancient.stop.${stop.id}.json`), "utf8")
            .then((content) => JSON.parse(content));
        };

        const stopAt30 = await readStopPayload(30);
        const philipAt30 = stopAt30.areas.find((area) => area.areaId === "philip-tetrarchy-lands");
        assert.equal(philipAt30?.heldFromYear, -4);
        assert.equal(philipAt30?.heldToYear, 34);
        assert.equal(philipAt30?.heldFromKnown, true);
        const antipasAt30 = stopAt30.areas.find((area) => area.areaId === "galilee-perea");
        assert.equal(antipasAt30?.heldFromYear, -4);
        assert.equal(antipasAt30?.heldToYear, 39);
        assert.equal(antipasAt30?.heldFromKnown, true);
        const italyLabelAt30 = stopAt30.holderLabels.find(
          (label) => label.holderId === "italy-direct"
        );
        assert.ok(italyLabelAt30, "expected Italy holder label at AD 30");
        assert.equal(italyLabelAt30.labelText, "ITALY");
        const commageneLabelAt30 = stopAt30.holderLabels.find(
          (label) =>
            label.holderId === stopAt30.areas.find((area) => area.areaId === "commagene")?.holderId
        );
        assert.ok(commageneLabelAt30);
        assert.ok(commageneLabelAt30.minZoom > 5, "Commagene label should be hidden at zoom 5.");
        const galileeTouchingBordersAt30 = stopAt30.holderBorders.features.filter(
          (feature) =>
            feature.properties.holderAAreaId === "galilee-perea" ||
            feature.properties.holderBAreaId === "galilee-perea"
        );
        assert.ok(galileeTouchingBordersAt30.length > 0, "expected borders touching galilee-perea at AD 30");
        const galileeMinZooms = [...new Set(galileeTouchingBordersAt30.map((feature) => feature.properties.minZoom))]
          .sort((left, right) => left - right);
        assert.deepEqual(galileeMinZooms, [8]);

        const asiaGalatiaBorderAt30 = stopAt30.holderBorders.features.find(
          (feature) =>
            (feature.properties.holderAAreaId === "asia" && feature.properties.holderBAreaId === "galatia") ||
            (feature.properties.holderAAreaId === "galatia" && feature.properties.holderBAreaId === "asia")
        );
        assert.ok(asiaGalatiaBorderAt30, "expected Asia-Galatia border at AD 30");
        assert.equal(asiaGalatiaBorderAt30.properties.minZoom, 6);

        const stopAt40 = await readStopPayload(40);
        const agrippaInPhilipLands = stopAt40.areas.find((area) => area.areaId === "philip-tetrarchy-lands");
        assert.equal(agrippaInPhilipLands?.heldFromYear, 37);
        assert.equal(agrippaInPhilipLands?.heldToYear, 44);
        assert.equal(agrippaInPhilipLands?.heldFromKnown, true);
        const formatAdRange = (assignment) => {
          assert.equal(assignment.heldFromKnown, true);
          return `AD ${assignment.heldFromYear} – ${assignment.heldToYear}`;
        };
        const agrippaLabelsAt40 = stopAt40.holderLabels.filter(
          (label) => label.holderId === "agrippa-i-kingdom"
        );
        assert.equal(agrippaLabelsAt40.length, 3);
        const agrippaPhilipLabel = agrippaLabelsAt40.find(
          (label) => label.areaId === "philip-tetrarchy-lands"
        );
        assert.ok(agrippaPhilipLabel);
        const agrippaGalileeLabels = agrippaLabelsAt40.filter(
          (label) => label.areaId === "galilee-perea"
        );
        assert.equal(agrippaGalileeLabels.length, 2);
        const agrippaPhilipAssignment = stopAt40.areas.find(
          (area) => area.areaId === agrippaPhilipLabel.areaId
        );
        assert.ok(agrippaPhilipAssignment);
        assert.equal(formatAdRange(agrippaPhilipAssignment), "AD 37 – 44");
        for (const galileeLabel of agrippaGalileeLabels) {
          const galileeAssignment = stopAt40.areas.find(
            (area) => area.areaId === galileeLabel.areaId
          );
          assert.ok(galileeAssignment);
          assert.equal(
            formatAdRange(galileeAssignment),
            "AD 39 – 44"
          );
        }

        const stopAt1 = await readStopPayload(1);
        const archelausAt1 = stopAt1.areas.find((area) => area.areaId === "judea-samaria-idumea");
        assert.equal(archelausAt1?.heldFromYear, -4);
        assert.equal(archelausAt1?.heldToYear, 6);
        assert.equal(archelausAt1?.heldFromKnown, true);
        const commageneAt10 = (await readStopPayload(10)).areas.find((area) => area.areaId === "commagene");
        assert.equal(commageneAt10?.heldFromYear, -20);
        assert.equal(commageneAt10?.heldToYear, 17);
        assert.equal(commageneAt10?.heldFromKnown, true);

        const lyciaAt30 = stopAt30.areas.find((area) => area.areaId === "lycia");
        assert.equal(lyciaAt30?.heldFromYear, -4);
        assert.equal(lyciaAt30?.heldToYear, 43);
        assert.equal(lyciaAt30?.heldFromKnown, false);
        const thraceAt30 = stopAt30.areas.find((area) => area.areaId === "thrace");
        assert.equal(thraceAt30?.heldFromYear, -4);
        assert.equal(thraceAt30?.heldToYear, 46);
        assert.equal(thraceAt30?.heldFromKnown, false);
        const lyciaPamphyliaAt80 = (await readStopPayload(80)).areas.find((area) => area.areaId === "lycia");
        assert.equal(lyciaPamphyliaAt80?.heldFromYear, 74);
        assert.equal(lyciaPamphyliaAt80?.heldToYear, 101);
        assert.equal(lyciaPamphyliaAt80?.heldFromKnown, true);
      });
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

test("buildAncientAppData real-data road joins include one Ephesus-Laodicea connector", async () => {
  const fixture = await loadRealDataFixture();
  const joinFeatures = fixture.roadsPayload.features.slice(fixture.ancientRoadFeatureCount);
  const ephesusRoadBreakStart = [28.6193, 37.8916];
  const expectedOtherEnd = [28.5817, 37.8752];

  const touchingBreak = joinFeatures.filter((feature) => {
    if (feature?.geometry?.type !== "LineString" || !Array.isArray(feature.geometry.coordinates)) {
      return false;
    }
    const [start, end] = feature.geometry.coordinates;
    return (
      haversineDistanceKm(start, ephesusRoadBreakStart) <= 0.02 ||
      haversineDistanceKm(end, ephesusRoadBreakStart) <= 0.02
    );
  });
  assert.equal(touchingBreak.length, 1, "expected exactly one generated line touching (28.6193, 37.8916)");

  const [start, end] = touchingBreak[0].geometry.coordinates;
  const otherEnd =
    haversineDistanceKm(start, ephesusRoadBreakStart) <= haversineDistanceKm(end, ephesusRoadBreakStart)
      ? end
      : start;
  assert.ok(
    haversineDistanceKm(otherEnd, expectedOtherEnd) <= 0.03,
    "expected Ephesus join to end at (28.5817, 37.8752)"
  );
});

test("buildAncientAppData real-data road joins do not share endpoints within 0.2 km", async () => {
  const fixture = await loadRealDataFixture();
  const joinFeatures = fixture.roadsPayload.features.slice(fixture.ancientRoadFeatureCount);
  const endpoints = joinFeatures.flatMap((feature) => {
    if (feature?.geometry?.type !== "LineString" || !Array.isArray(feature.geometry.coordinates)) {
      return [];
    }
    const [start, end] = feature.geometry.coordinates;
    return [start, end];
  });

  for (let index = 0; index < endpoints.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < endpoints.length; compareIndex += 1) {
      const distanceKm = haversineDistanceKm(endpoints[index], endpoints[compareIndex]);
      assert.ok(
        distanceKm > 0.2,
        `generated road join endpoints share a point within 0.2 km (${distanceKm.toFixed(3)} km)`
      );
    }
  }
});

test("buildAncientAppData real-data road joins close all remaining 0.2-4 km endpoint gaps", async () => {
  const fixture = await loadRealDataFixture();
  const originalRoadFeatures = fixture.roadsPayload.features.slice(0, fixture.ancientRoadFeatureCount);
  const joinFeatures = fixture.roadsPayload.features.slice(fixture.ancientRoadFeatureCount);
  const linePieces = [];
  for (const feature of originalRoadFeatures) {
    const geometry = feature?.geometry;
    if (geometry?.type === "LineString") {
      linePieces.push(geometry.coordinates);
      continue;
    }
    if (geometry?.type === "MultiLineString") {
      linePieces.push(...geometry.coordinates);
    }
  }

  const segmentsByPiece = linePieces.map((piece, pieceIndex) => ({
    pieceIndex,
    segments: piece.slice(1).map((_, index) => [piece[index], piece[index + 1]])
  }));
  const endpointsByPiece = linePieces.flatMap((piece, pieceIndex) => [
    { pieceIndex, point: piece[0] },
    { pieceIndex, point: piece[piece.length - 1] }
  ]);
  const joinEndpointTouchesRoadEnd = (roadEndPoint) =>
    joinFeatures.some((joinFeature) => {
      const [start, end] = joinFeature.geometry.coordinates;
      return (
        haversineDistanceKm(start, roadEndPoint) <= 0.05 ||
        haversineDistanceKm(end, roadEndPoint) <= 0.05
      );
    });

  for (const endpoint of endpointsByPiece) {
    let nearestOtherDistanceKm = Number.POSITIVE_INFINITY;
    for (const segmentGroup of segmentsByPiece) {
      if (segmentGroup.pieceIndex === endpoint.pieceIndex) {
        continue;
      }
      for (const [segmentStart, segmentEnd] of segmentGroup.segments) {
        nearestOtherDistanceKm = Math.min(
          nearestOtherDistanceKm,
          distancePointToSegmentKm(endpoint.point, segmentStart, segmentEnd)
        );
      }
    }

    assert.equal(Number.isFinite(nearestOtherDistanceKm), true);
    if (nearestOtherDistanceKm > 0.2 && nearestOtherDistanceKm <= 4) {
      assert.equal(
        joinEndpointTouchesRoadEnd(endpoint.point),
        true,
        `road end ${JSON.stringify(endpoint.point)} remains ${nearestOtherDistanceKm.toFixed(3)} km from nearest source-road piece`
      );
    }
  }
});

test("buildAncientAppData real-data road joins are all longer than 0.2 km and at most 4 km", async () => {
  const fixture = await loadRealDataFixture();
  const joinFeatures = fixture.roadsPayload.features.slice(fixture.ancientRoadFeatureCount);

  for (const joinFeature of joinFeatures) {
    assert.equal(joinFeature.geometry?.type, "LineString");
    assert.equal(joinFeature.geometry.coordinates.length, 2);
    const [start, end] = joinFeature.geometry.coordinates;
    const distanceKm = haversineDistanceKm(start, end);
    assert.ok(distanceKm > 0.2, `expected join > 0.2 km, got ${distanceKm.toFixed(3)} km`);
    assert.ok(distanceKm <= 4, `expected join <= 4 km, got ${distanceKm.toFixed(3)} km`);
  }
});

test("buildAncientAppData real-data hide-rule linked set includes province records and excludes Galilee", async () => {
  const fixture = await loadRealDataFixture();
  const hiddenLocationIds = new Set(
    (fixture.timelineData.entities ?? [])
      .map((entity) => entity.locationId)
      .filter((locationId) => typeof locationId === "string" && locationId.length > 0)
  );
  assert.equal(hiddenLocationIds.has("judea-province"), true);
  assert.equal(hiddenLocationIds.has("cappadocia"), true);
  assert.equal(hiddenLocationIds.has("galatia"), true);
  assert.equal(hiddenLocationIds.has("galilee"), false);
});

test("buildAncientAppData real-data holder labels follow MC7 text rules", async () => {
  const fixture = await loadRealDataFixture();
  const stopAt30 = fixture.stopPayloadForYear(30);
  const labelTexts = stopAt30.holderLabels.map((label) => normalizeLabelText(label.labelText));
  assert.ok(labelTexts.includes("ITALY"));
  assert.ok(labelTexts.includes("OTHER ROMAN PROVINCES"));
  assert.ok(labelTexts.some((text) => text.startsWith("PROVINCE OF ")));
  assert.equal(labelTexts.some((text) => text.startsWith("ROMAN PROVINCE OF ")), false);
});

test("buildAncientAppData real-data border minZoom gates for Galilee and Asia-Galatia", async () => {
  const fixture = await loadRealDataFixture();
  const stopAt30 = fixture.stopPayloadForYear(30);

  const galileeTouchingBordersAt30 = stopAt30.holderBorders.features.filter(
    (feature) =>
      feature.properties.holderAAreaId === "galilee-perea" ||
      feature.properties.holderBAreaId === "galilee-perea"
  );
  assert.ok(galileeTouchingBordersAt30.length > 0, "expected borders touching galilee-perea at AD 30");
  const galileeMinZooms = [...new Set(galileeTouchingBordersAt30.map((feature) => feature.properties.minZoom))]
    .sort((left, right) => left - right);
  assert.deepEqual(galileeMinZooms, [8]);

  const asiaGalatiaBorderAt30 = stopAt30.holderBorders.features.find(
    (feature) =>
      (feature.properties.holderAAreaId === "asia" && feature.properties.holderBAreaId === "galatia") ||
      (feature.properties.holderAAreaId === "galatia" && feature.properties.holderBAreaId === "asia")
  );
  assert.ok(asiaGalatiaBorderAt30, "expected Asia-Galatia border at AD 30");
  assert.equal(asiaGalatiaBorderAt30.properties.minZoom, 6);
});

test("buildAncientAppData real-data gives every non-uncertain holder at least one label per stop", async () => {
  const fixture = await loadRealDataFixture();
  for (const stop of fixture.timelinePayload.stops) {
    const stopPayload = fixture.stopPayloadById.get(stop.id);
    const expectedHolderIds = new Set(
      stopPayload.areas
        .filter((area) => area.holderKind !== "uncertain")
        .map((area) => area.holderId)
    );
    const labelledHolderIds = new Set(stopPayload.holderLabels.map((label) => label.holderId));
    for (const holderId of expectedHolderIds) {
      assert.equal(
        labelledHolderIds.has(holderId),
        true,
        `expected holder '${holderId}' in stop '${stop.id}' to have a label`
      );
    }
  }
});

test("buildAncientAppData real-data province labels appear and disappear by year", async () => {
  const fixture = await loadRealDataFixture();
  const hasLabel = (stopPayload, expectedText) =>
    stopPayload.holderLabels.some((label) => normalizeLabelText(label.labelText) === expectedText);

  const stopAt6 = fixture.stopPayloadForYear(6);
  const stopAt17 = fixture.stopPayloadForYear(17);
  const stopAt41 = fixture.stopPayloadForYear(41);
  const stopAt44 = fixture.stopPayloadForYear(44);
  const stopAt53 = fixture.stopPayloadForYear(53);
  const stopAt67 = fixture.stopPayloadForYear(67);
  const stopAt79 = fixture.stopPayloadForYear(79);

  assert.equal(hasLabel(stopAt41, "PROVINCE OF JUDEA"), false);
  assert.equal(hasLabel(stopAt44, "PROVINCE OF JUDEA"), true);
  assert.equal(hasLabel(stopAt6, "PROVINCE OF CAPPADOCIA"), false);
  assert.equal(hasLabel(stopAt17, "PROVINCE OF CAPPADOCIA"), true);
  assert.equal(hasLabel(stopAt67, "PROVINCE OF ACHAIA"), false);
  assert.equal(hasLabel(stopAt53, "PROVINCE OF ACHAIA"), true);
  assert.equal(hasLabel(stopAt79, "PROVINCE OF ACHAIA"), true);
});

test("buildAncientAppData stress fixture stays under 300KB gzip", async () => {
  await withTempDirectory(async (outputDirectory) => {
    const entities = [
      {
        id: "roman-holder",
        name: "Roman holder",
        kind: "roman-province",
        romanSide: true,
        sources: ["bib:pleiades-place-resource"]
      },
      {
        id: "outside-holder",
        name: "Outside holder",
        kind: "outside-empire",
        romanSide: false,
        sources: ["bib:pleiades-place-resource"]
      }
    ];

    const stops = Array.from({ length: 15 }, (_, index) => ({
      id: `stop-${index + 1}`,
      year: -4 + index * 7,
      title: `Stop ${index + 1}`,
      summary: "Synthetic stop",
      sources: ["bib:pleiades-place-resource"]
    }));

    const areas = [];
    const features = [];
    let areaCounter = 0;
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        areaCounter += 1;
        const areaId = `synthetic-area-${areaCounter}`;
        const periods = [];
        for (let stopIndex = 0; stopIndex < stops.length - 1; stopIndex += 1) {
          periods.push({
            fromYear: stops[stopIndex].year,
            toYear: stops[stopIndex + 1].year,
            holderId: (stopIndex + row + column) % 2 === 0 ? "roman-holder" : "outside-holder",
            sources: ["bib:pleiades-place-resource"]
          });
        }
        periods.push({
          fromYear: stops[stops.length - 1].year,
          toYear: 101,
          holderId: (row + column) % 2 === 0 ? "outside-holder" : "roman-holder",
          sources: ["bib:pleiades-place-resource"]
        });

        areas.push({ id: areaId, periods });

        const minX = column * 1.1;
        const minY = row * 1.1;
        features.push({
          type: "Feature",
          properties: {
            areaId,
            provenance: {
              dataset: "fixture",
              version: "fixture-1",
              upstreamFeatureIds: [`awmc:${areaId}`],
              changes: [{ kind: "none", detail: "fixture", sources: ["bib:pleiades-place-resource"] }]
            }
          },
          geometry: {
            type: "Polygon",
            coordinates: [[[minX, minY], [minX + 1, minY], [minX + 1, minY + 1], [minX, minY + 1], [minX, minY]]]
          }
        });
      }
    }

    const buildResult = await buildAncientAppData({
      timelineData: {
        version: 1,
        range: { fromYear: -4, toYear: 101, defaultYear: 44 },
        stops,
        entities,
        areas
      },
      ancientAreasData: { type: "FeatureCollection", features },
      ancientRoadsData: { type: "FeatureCollection", features: [] },
      ancientCoastlineData: { type: "FeatureCollection", features: [] },
      outputDirectory
    });

    assert.ok(buildResult.totalGzipBytes <= 300 * 1024);
  });
});
