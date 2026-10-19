import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const generatedDirectory = path.join(repositoryRoot, "app", "public", "generated");
const repositoryTimelinePath = path.join(repositoryRoot, "data", "timeline.json");
const repositoryAncientRoadsPath = path.join(repositoryRoot, "data", "geo", "ancient-roads.geojson");

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

let generatedDataPromise = null;

async function assertGeneratedOutputAvailable() {
  try {
    await fs.access(generatedDirectory);
  } catch {
    assert.fail(
      "Missing app/public/generated. Run `npm run build:data` before `npm run test:generated`."
    );
  }
}

async function loadGeneratedAncientData() {
  if (generatedDataPromise) {
    return generatedDataPromise;
  }

  generatedDataPromise = (async () => {
    await assertGeneratedOutputAvailable();

    const [timelinePayload, roadsPayload, timelineData, sourceRoads] = await Promise.all([
      fs.readFile(path.join(generatedDirectory, "ancient.timeline.json"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(path.join(generatedDirectory, "ancient.roads.geojson"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(repositoryTimelinePath, "utf8").then((content) => JSON.parse(content)),
      fs.readFile(repositoryAncientRoadsPath, "utf8").then((content) => JSON.parse(content))
    ]);

    const stopPayloadById = new Map(
      await Promise.all(
        timelinePayload.stops.map(async (stop) => [
          stop.id,
          JSON.parse(
            await fs.readFile(path.join(generatedDirectory, `ancient.stop.${stop.id}.json`), "utf8")
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
      const payload = stopPayloadById.get(stop.id);
      assert.ok(payload, `expected ancient.stop.${stop.id}.json`);
      return payload;
    };

    return {
      timelineData,
      timelinePayload,
      roadsPayload,
      stopPayloadById,
      stopPayloadForYear,
      ancientRoadFeatureCount: sourceRoads.features.length
    };
  })();

  return generatedDataPromise;
}

test("generated ancient roads include the Ephesus-Laodicea join and keep join lengths within 0.2-4 km", async () => {
  const fixture = await loadGeneratedAncientData();
  const roadFeatures = fixture.roadsPayload.features ?? [];
  const joinFeatures = roadFeatures.slice(fixture.ancientRoadFeatureCount);
  assert.ok(joinFeatures.length > 0, "expected generated road joins in ancient.roads.geojson");

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

  for (const joinFeature of joinFeatures) {
    assert.equal(joinFeature.geometry?.type, "LineString");
    assert.equal(joinFeature.geometry.coordinates.length, 2);
    const [joinStart, joinEnd] = joinFeature.geometry.coordinates;
    const distanceKm = haversineDistanceKm(joinStart, joinEnd);
    assert.ok(distanceKm > 0.2, `expected join > 0.2 km, got ${distanceKm.toFixed(3)} km`);
    assert.ok(distanceKm <= 4, `expected join <= 4 km, got ${distanceKm.toFixed(3)} km`);
  }
});

test("generated ancient road joins do not share endpoints within 0.2 km", async () => {
  const fixture = await loadGeneratedAncientData();
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

test("generated ancient road joins close all remaining 0.2-4 km endpoint gaps", async () => {
  const fixture = await loadGeneratedAncientData();
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

test("generated ancient timeline and labels preserve MC7 rules and year transitions", async () => {
  const fixture = await loadGeneratedAncientData();
  const hiddenLocationIds = new Set(
    (fixture.timelineData.entities ?? [])
      .map((entity) => entity.locationId)
      .filter((locationId) => typeof locationId === "string" && locationId.length > 0)
  );
  assert.equal(hiddenLocationIds.has("judea-province"), true);
  assert.equal(hiddenLocationIds.has("cappadocia"), true);
  assert.equal(hiddenLocationIds.has("galatia"), true);
  assert.equal(hiddenLocationIds.has("galilee"), false);

  const stopAt30 = fixture.stopPayloadForYear(30);
  const labelTexts = stopAt30.holderLabels.map((label) => normalizeLabelText(label.labelText));
  assert.ok(labelTexts.includes("ITALY"));
  assert.ok(labelTexts.includes("OTHER ROMAN PROVINCES"));
  assert.ok(labelTexts.some((text) => text.startsWith("PROVINCE OF ")));
  assert.equal(labelTexts.some((text) => text.startsWith("ROMAN PROVINCE OF ")), false);

  const commageneHolderIdAt30 = stopAt30.areas.find((area) => area.areaId === "commagene")?.holderId;
  const commageneLabelAt30 = stopAt30.holderLabels.find(
    (label) => label.holderId === commageneHolderIdAt30 && label.areaId === "commagene"
  );
  assert.ok(
    commageneLabelAt30,
    "Expected Commagene holder label to be kept on the Commagene namesake area."
  );
  assert.ok(commageneLabelAt30.minZoom > 5, "Commagene label should be hidden at zoom 5.");

  const galileeTouchingBordersAt30 = stopAt30.holderBorders.features.filter(
    (feature) =>
      feature.properties.holderAAreaId === "galilee-perea" ||
      feature.properties.holderBAreaId === "galilee-perea"
  );
  assert.ok(galileeTouchingBordersAt30.length > 0, "expected borders touching galilee-perea at AD 30");
  const galileeMinZooms = [...new Set(galileeTouchingBordersAt30.map((feature) => feature.properties.minZoom))]
    .sort((left, right) => left - right);
  assert.deepEqual(galileeMinZooms, [5]);

  const asiaGalatiaBorderAt30 = stopAt30.holderBorders.features.find(
    (feature) =>
      (feature.properties.holderAAreaId === "asia" && feature.properties.holderBAreaId === "galatia") ||
      (feature.properties.holderAAreaId === "galatia" && feature.properties.holderBAreaId === "asia")
  );
  assert.ok(asiaGalatiaBorderAt30, "expected Asia-Galatia border at AD 30");
  assert.equal(asiaGalatiaBorderAt30.properties.minZoom, 5);

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

test("generated ancient stops keep holder spans and label coverage", async () => {
  const fixture = await loadGeneratedAncientData();
  const stopAt30 = fixture.stopPayloadForYear(30);

  const philipAt30 = stopAt30.areas.find((area) => area.areaId === "philip-tetrarchy-lands");
  assert.equal(philipAt30?.heldFromYear, -4);
  assert.equal(philipAt30?.heldToYear, 34);
  assert.equal(philipAt30?.heldFromKnown, true);
  const antipasAt30 = stopAt30.areas.find((area) => area.areaId === "galilee-perea");
  assert.equal(antipasAt30?.heldFromYear, -4);
  assert.equal(antipasAt30?.heldToYear, 39);
  assert.equal(antipasAt30?.heldFromKnown, true);
  const italyLabelAt30 = stopAt30.holderLabels.find((label) => label.holderId === "italy-direct");
  assert.ok(italyLabelAt30, "expected Italy holder label at AD 30");
  assert.equal(italyLabelAt30.labelText, "ITALY");

  const stopAt40 = fixture.stopPayloadForYear(40);
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
  const agrippaPhilipLabel = agrippaLabelsAt40.find((label) => label.areaId === "philip-tetrarchy-lands");
  assert.ok(agrippaPhilipLabel);
  const agrippaGalileeLabels = agrippaLabelsAt40.filter((label) => label.areaId === "galilee-perea");
  assert.equal(agrippaGalileeLabels.length, 2);
  const agrippaPhilipAssignment = stopAt40.areas.find((area) => area.areaId === agrippaPhilipLabel.areaId);
  assert.ok(agrippaPhilipAssignment);
  assert.equal(formatAdRange(agrippaPhilipAssignment), "AD 37 – 44");
  for (const galileeLabel of agrippaGalileeLabels) {
    const galileeAssignment = stopAt40.areas.find((area) => area.areaId === galileeLabel.areaId);
    assert.ok(galileeAssignment);
    assert.equal(formatAdRange(galileeAssignment), "AD 39 – 44");
  }

  const stopAt1 = fixture.stopPayloadForYear(1);
  const archelausAt1 = stopAt1.areas.find((area) => area.areaId === "judea-samaria-idumea");
  assert.equal(archelausAt1?.heldFromYear, -4);
  assert.equal(archelausAt1?.heldToYear, 6);
  assert.equal(archelausAt1?.heldFromKnown, true);
  const commageneAt10 = fixture.stopPayloadForYear(10).areas.find((area) => area.areaId === "commagene");
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
  const lyciaPamphyliaAt80 = fixture.stopPayloadForYear(80).areas.find((area) => area.areaId === "lycia");
  assert.equal(lyciaPamphyliaAt80?.heldFromYear, 74);
  assert.equal(lyciaPamphyliaAt80?.heldToYear, 101);
  assert.equal(lyciaPamphyliaAt80?.heldFromKnown, true);

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
