import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import polylabel from "polylabel";
import { polygonsOf, polygonAreaKm2 } from "../../scripts/lib/geometry-cleanup.mjs";

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

function isPolygonGeometry(geometry) {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function unionHoleSignatures(geometry) {
  if (!isPolygonGeometry(geometry)) {
    return [];
  }
  const signatures = [];
  for (const polygon of polygonsOf(geometry)) {
    for (const ring of polygon.slice(1)) {
      const areaKm2 = polygonAreaKm2([ring]);
      const labelPoint = polylabel([ring], 0.0005);
      signatures.push({
        areaKm2: Number(areaKm2.toFixed(3)),
        center: [Number(labelPoint[0].toFixed(3)), Number(labelPoint[1].toFixed(3))]
      });
    }
  }
  signatures.sort((left, right) => {
    if (right.areaKm2 !== left.areaKm2) {
      return right.areaKm2 - left.areaKm2;
    }
    if (left.center[0] !== right.center[0]) {
      return left.center[0] - right.center[0];
    }
    return left.center[1] - right.center[1];
  });
  return signatures;
}

function pointInRing(point, ring) {
  let inside = false;
  for (
    let index = 0, previousIndex = ring.length - 1;
    index < ring.length;
    previousIndex = index, index += 1
  ) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previousIndex];
    const intersects =
      (y1 > point[1]) !== (y2 > point[1]) &&
      point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, polygonCoordinates) {
  if (!pointInRing(point, polygonCoordinates[0])) {
    return false;
  }
  for (let index = 1; index < polygonCoordinates.length; index += 1) {
    if (pointInRing(point, polygonCoordinates[index])) {
      return false;
    }
  }
  return true;
}

function pointInRegionGeometry(point, geometry) {
  if (!isPolygonGeometry(geometry)) {
    return false;
  }
  return polygonsOf(geometry).some((polygonCoordinates) => pointInPolygon(point, polygonCoordinates));
}

function ringVertices(ring) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return [];
  }
  const [firstLon, firstLat] = ring[0];
  const [lastLon, lastLat] = ring[ring.length - 1] ?? [];
  const isClosed =
    Number.isFinite(firstLon) &&
    Number.isFinite(firstLat) &&
    Number.isFinite(lastLon) &&
    Number.isFinite(lastLat) &&
    firstLon === lastLon &&
    firstLat === lastLat;
  return isClosed ? ring.slice(0, -1) : ring;
}

function boundarySegmentsForGeometry(geometry) {
  if (!geometry) {
    return [];
  }
  const segments = [];
  const rings =
    geometry.type === "Polygon"
      ? geometry.coordinates
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates.flatMap((polygon) => polygon)
        : geometry.type === "LineString"
          ? [geometry.coordinates]
          : geometry.type === "MultiLineString"
            ? geometry.coordinates
            : [];
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 2) {
      continue;
    }
    for (let index = 0; index < ring.length - 1; index += 1) {
      const start = ring[index];
      const end = ring[index + 1];
      const minLon = Math.min(start[0], end[0]);
      const maxLon = Math.max(start[0], end[0]);
      const minLat = Math.min(start[1], end[1]);
      const maxLat = Math.max(start[1], end[1]);
      segments.push({ start, end, minLon, maxLon, minLat, maxLat });
    }
  }
  return segments;
}

function kmToLatitudeDegrees(km) {
  return km / 110.574;
}

function kmToLongitudeDegrees(km, latitude) {
  const denominator = 111.32 * Math.max(0.1, Math.cos(toRadians(latitude)));
  return km / denominator;
}

function maybeWithinThresholdBox(point, segment, thresholdKm) {
  const lonPad = kmToLongitudeDegrees(thresholdKm, point[1]);
  const latPad = kmToLatitudeDegrees(thresholdKm);
  return !(
    point[0] < segment.minLon - lonPad ||
    point[0] > segment.maxLon + lonPad ||
    point[1] < segment.minLat - latPad ||
    point[1] > segment.maxLat + latPad
  );
}

function distanceToBoundaryAtMostKm(point, segments, thresholdKm) {
  for (const segment of segments) {
    if (!maybeWithinThresholdBox(point, segment, thresholdKm)) {
      continue;
    }
    if (distancePointToSegmentKm(point, segment.start, segment.end) <= thresholdKm) {
      return true;
    }
  }
  return false;
}

function areaGeometryOuterRings(geometry) {
  if (!isPolygonGeometry(geometry)) {
    return [];
  }
  return polygonsOf(geometry).map((polygonCoordinates) => ringVertices(polygonCoordinates[0]));
}

function collectInnerSharedBorderProbePoints({
  memberAreaIds,
  areaGeometryById,
  coastlineBoundarySegments,
  nonMemberBoundarySegmentsByAreaId
}) {
  const probes = [];
  const seen = new Set();
  for (let leftIndex = 0; leftIndex < memberAreaIds.length; leftIndex += 1) {
    const areaAId = memberAreaIds[leftIndex];
    const areaAGeometry = areaGeometryById.get(areaAId);
    if (!isPolygonGeometry(areaAGeometry)) {
      continue;
    }
    const areaARings = areaGeometryOuterRings(areaAGeometry);
    for (let rightIndex = leftIndex + 1; rightIndex < memberAreaIds.length; rightIndex += 1) {
      const areaBId = memberAreaIds[rightIndex];
      const areaBGeometry = areaGeometryById.get(areaBId);
      if (!isPolygonGeometry(areaBGeometry)) {
        continue;
      }
      const areaBBoundary = boundarySegmentsForGeometry(areaBGeometry);
      const nonMemberBoundarySegments = [...nonMemberBoundarySegmentsByAreaId.values()].flat();
      for (const ring of areaARings) {
        const ringLength = ring.length;
        if (ringLength < 3) {
          continue;
        }
        for (let vertexIndex = 0; vertexIndex < ringLength; vertexIndex += 1) {
          const point = ring[vertexIndex];
          const previousPoint = ring[(vertexIndex - 1 + ringLength) % ringLength];
          const previousPoint2 = ring[(vertexIndex - 2 + ringLength) % ringLength];
          const nextPoint = ring[(vertexIndex + 1) % ringLength];
          const nextPoint2 = ring[(vertexIndex + 2) % ringLength];
          if (!distanceToBoundaryAtMostKm(point, areaBBoundary, 2)) {
            continue;
          }
          if (
            !distanceToBoundaryAtMostKm(previousPoint, areaBBoundary, 2) ||
            !distanceToBoundaryAtMostKm(nextPoint, areaBBoundary, 2) ||
            !distanceToBoundaryAtMostKm(previousPoint2, areaBBoundary, 2) ||
            !distanceToBoundaryAtMostKm(nextPoint2, areaBBoundary, 2)
          ) {
            continue;
          }
          if (distanceToBoundaryAtMostKm(point, coastlineBoundarySegments, 5)) {
            continue;
          }
          if (distanceToBoundaryAtMostKm(point, nonMemberBoundarySegments, 5)) {
            continue;
          }
          const key = `${point[0].toFixed(6)}:${point[1].toFixed(6)}:${areaAId}:${areaBId}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          probes.push({ point, areaAId, areaBId });
        }
      }
    }
  }
  return probes;
}

function collectUnionProbeViolations({
  unionGeometry,
  probePoints
}) {
  const violations = [];
  const unionBoundary = boundarySegmentsForGeometry(unionGeometry);
  for (const probe of probePoints) {
    if (!pointInRegionGeometry(probe.point, unionGeometry)) {
      violations.push({ ...probe, reason: "outside-union" });
      continue;
    }
    if (distanceToBoundaryAtMostKm(probe.point, unionBoundary, 0.1)) {
      violations.push({ ...probe, reason: "near-union-outline" });
    }
  }
  return violations;
}

function withSeededNotch(geometry, targetPoint) {
  const clone = JSON.parse(JSON.stringify(geometry));
  if (
    (clone.type !== "Polygon" && clone.type !== "MultiPolygon") ||
    !Array.isArray(clone.coordinates) ||
    clone.coordinates.length === 0
  ) {
    return clone;
  }

  const polygonCoordinates =
    clone.type === "Polygon"
      ? [clone.coordinates]
      : clone.coordinates;
  let bestPolygonIndex = -1;
  let bestSegmentIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let polygonIndex = 0; polygonIndex < polygonCoordinates.length; polygonIndex += 1) {
    const outerRing = polygonCoordinates[polygonIndex]?.[0];
    if (!Array.isArray(outerRing) || outerRing.length < 4) {
      continue;
    }
    for (let segmentIndex = 0; segmentIndex < outerRing.length - 1; segmentIndex += 1) {
      const distanceKm = distancePointToSegmentKm(targetPoint, outerRing[segmentIndex], outerRing[segmentIndex + 1]);
      if (distanceKm < bestDistance) {
        bestDistance = distanceKm;
        bestPolygonIndex = polygonIndex;
        bestSegmentIndex = segmentIndex;
      }
    }
  }

  if (bestPolygonIndex < 0 || bestSegmentIndex < 0) {
    return clone;
  }

  const outerRing = polygonCoordinates[bestPolygonIndex][0];
  outerRing.splice(bestSegmentIndex + 1, 0, targetPoint);
  if (
    outerRing.length > 0 &&
    (outerRing[0][0] !== outerRing[outerRing.length - 1][0] ||
      outerRing[0][1] !== outerRing[outerRing.length - 1][1])
  ) {
    outerRing.push([...outerRing[0]]);
  }
  return clone;
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

    const [timelinePayload, roadsPayload, timelineData, sourceRoads, holderUnionsPayload, shapesPayload, coastlinePayload] = await Promise.all([
      fs.readFile(path.join(generatedDirectory, "ancient.timeline.json"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(path.join(generatedDirectory, "ancient.roads.geojson"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(repositoryTimelinePath, "utf8").then((content) => JSON.parse(content)),
      fs.readFile(repositoryAncientRoadsPath, "utf8").then((content) => JSON.parse(content)),
      fs.readFile(path.join(generatedDirectory, "ancient.holder-unions.json"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(path.join(generatedDirectory, "ancient.shapes.json"), "utf8").then((content) => JSON.parse(content)),
      fs.readFile(path.join(generatedDirectory, "ancient.coastline.geojson"), "utf8").then((content) => JSON.parse(content))
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
      holderUnionsPayload,
      shapesPayload,
      coastlinePayload,
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

test("generated holder unions keep only expected real holes and judea-province has one hole-free piece", async () => {
  const fixture = await loadGeneratedAncientData();

  for (const stop of fixture.timelinePayload.stops) {
    const stopPayload = fixture.stopPayloadById.get(stop.id);
    assert.ok(stopPayload, `expected payload for stop '${stop.id}'`);

    for (const [holderId, unionId] of Object.entries(stopPayload.holderUnions ?? {})) {
      const geometry = fixture.holderUnionsPayload.geometries?.[unionId];
      assert.ok(geometry, `missing union geometry '${unionId}' for holder '${holderId}' at '${stop.id}'`);
      const holes = unionHoleSignatures(geometry);
      assert.deepEqual(
        holes,
        [],
        `expected holder union '${holderId}' in '${stop.id}' to have no holes`
      );
    }

    const romanSideUnionGeometry = stopPayload.romanSideUnion
      ? fixture.holderUnionsPayload.geometries?.[stopPayload.romanSideUnion]
      : null;
    assert.ok(romanSideUnionGeometry, `missing roman-side union geometry at stop '${stop.id}'`);
    const romanSideHoles = unionHoleSignatures(romanSideUnionGeometry);
    assert.deepEqual(
      romanSideHoles,
      [],
      `unexpected roman-side union holes at stop '${stop.id}'`
    );
  }

  const judeaAt70 = fixture.stopPayloadForYear(70);
  const judeaProvinceUnionId = judeaAt70.holderUnions?.["judea-province"];
  const judeaProvinceUnion = judeaProvinceUnionId
    ? fixture.holderUnionsPayload.geometries?.[judeaProvinceUnionId]
    : null;
  assert.ok(judeaProvinceUnion, "expected precomputed judea-province union at year 70");
  assert.equal(polygonsOf(judeaProvinceUnion).length, 1, "expected judea-province union to be one piece");
  assert.deepEqual(
    unionHoleSignatures(judeaProvinceUnion),
    [],
    "expected judea-province union to have no holes"
  );
});

test("merged holder unions stay clear of the inner shared-border probe zone (notch guard)", async () => {
  const fixture = await loadGeneratedAncientData();
  const areaGeometryById = new Map(
    (fixture.shapesPayload?.areas?.features ?? [])
      .filter((feature) => typeof feature?.properties?.areaId === "string" && isPolygonGeometry(feature.geometry))
      .map((feature) => [feature.properties.areaId, feature.geometry])
  );
  const coastlineBoundarySegments = (fixture.coastlinePayload?.features ?? []).flatMap((feature) =>
    boundarySegmentsForGeometry(feature?.geometry)
  );
  let probeCount = 0;

  for (const stop of fixture.timelinePayload.stops) {
    const stopPayload = fixture.stopPayloadById.get(stop.id);
    assert.ok(stopPayload, `expected payload for stop '${stop.id}'`);
    const mergedTargets = [];
    for (const [holderId, unionId] of Object.entries(stopPayload.holderUnions ?? {})) {
      const memberAreaIds = stopPayload.areas
        .filter((area) => area.hasShape && area.holderLocationId === holderId)
        .map((area) => area.areaId);
      if (memberAreaIds.length < 2) {
        continue;
      }
      mergedTargets.push({ targetId: holderId, unionId, memberAreaIds });
    }
    const romanMemberAreaIds = stopPayload.areas
      .filter((area) => area.hasShape && area.holderRomanSide === true)
      .map((area) => area.areaId);
    if (romanMemberAreaIds.length >= 2 && typeof stopPayload.romanSideUnion === "string") {
      mergedTargets.push({
        targetId: "roman-side",
        unionId: stopPayload.romanSideUnion,
        memberAreaIds: romanMemberAreaIds
      });
    }
    for (const target of mergedTargets) {
      const unionGeometry = fixture.holderUnionsPayload.geometries?.[target.unionId];
      assert.ok(unionGeometry, `missing union geometry '${target.unionId}' in stop '${stop.id}'`);
      const memberAreaIdSet = new Set(target.memberAreaIds);
      const nonMemberBoundarySegmentsByAreaId = new Map(
        stopPayload.areas
          .filter((area) => area.hasShape && !memberAreaIdSet.has(area.areaId))
          .map((area) => [area.areaId, boundarySegmentsForGeometry(areaGeometryById.get(area.areaId))])
      );
      const probePoints = collectInnerSharedBorderProbePoints({
        memberAreaIds: target.memberAreaIds,
        areaGeometryById,
        coastlineBoundarySegments,
        nonMemberBoundarySegmentsByAreaId
      });
      probeCount += probePoints.length;
      const violations = collectUnionProbeViolations({
        unionGeometry,
        probePoints
      });
      assert.deepEqual(
        violations,
        [],
        `expected merged union '${target.targetId}' in '${stop.id}' to avoid inner shared-border notches`
      );

    }
  }
  assert.ok(probeCount > 0, "expected at least one inner shared-border probe point");
  const judeaAt70 = fixture.stopPayloadForYear(70);
  const judeaProvinceUnionId = judeaAt70.holderUnions?.["judea-province"];
  const judeaProvinceUnion = judeaProvinceUnionId
    ? fixture.holderUnionsPayload.geometries?.[judeaProvinceUnionId]
    : null;
  assert.ok(judeaProvinceUnion && judeaProvinceUnion.type === "Polygon", "expected polygon judea-province union");
  const judeaMemberAreaIds = judeaAt70.areas
    .filter((area) => area.hasShape && area.holderLocationId === "judea-province")
    .map((area) => area.areaId);
  assert.deepEqual(
    new Set(judeaMemberAreaIds),
    new Set(["galilee-perea", "judea-samaria-idumea"])
  );
  const galileeGeometry = areaGeometryById.get("galilee-perea");
  const samariaGeometry = areaGeometryById.get("judea-samaria-idumea");
  assert.ok(isPolygonGeometry(galileeGeometry), "expected galilee-perea geometry");
  assert.ok(isPolygonGeometry(samariaGeometry), "expected judea-samaria-idumea geometry");
  const samariaBoundary = boundarySegmentsForGeometry(samariaGeometry);
  const judeaNonMemberBoundaries = judeaAt70.areas
    .filter((area) => area.hasShape && !new Set(judeaMemberAreaIds).has(area.areaId))
    .flatMap((area) => boundarySegmentsForGeometry(areaGeometryById.get(area.areaId)));
  const judeaProbePoint = areaGeometryOuterRings(galileeGeometry).flatMap((ring) => {
    const ringLength = ring.length;
    const points = [];
    for (let index = 0; index < ringLength; index += 1) {
      const point = ring[index];
      const previousPoint = ring[(index - 1 + ringLength) % ringLength];
      const nextPoint = ring[(index + 1) % ringLength];
      if (
        !distanceToBoundaryAtMostKm(point, samariaBoundary, 2) ||
        !distanceToBoundaryAtMostKm(previousPoint, samariaBoundary, 2) ||
        !distanceToBoundaryAtMostKm(nextPoint, samariaBoundary, 2)
      ) {
        continue;
      }
      if (distanceToBoundaryAtMostKm(point, coastlineBoundarySegments, 5)) {
        continue;
      }
      if (distanceToBoundaryAtMostKm(point, judeaNonMemberBoundaries, 5)) {
        continue;
      }
      points.push(point);
    }
    return points;
  })[0];
  assert.ok(judeaProbePoint, "expected judea-province probe point for seeded-notch regression");

  const seededNotchUnion = withSeededNotch(judeaProvinceUnion, judeaProbePoint);
  const seededNotchViolations = collectUnionProbeViolations({
    unionGeometry: seededNotchUnion,
    probePoints: [{ point: judeaProbePoint, areaAId: "galilee-perea", areaBId: "judea-samaria-idumea" }]
  });
  assert.ok(
    seededNotchViolations.some((violation) => violation.reason === "near-union-outline"),
    "expected seeded judea-province notch to violate the 0.1 km inner-border clearance guard"
  );

  const romanAt50 = fixture.stopPayloadForYear(50);
  const romanSideUnionId = romanAt50.romanSideUnion;
  const romanSideUnion = romanSideUnionId
    ? fixture.holderUnionsPayload.geometries?.[romanSideUnionId]
    : null;
  assert.ok(romanSideUnion, "expected roman-side union at year 50");
  const romanMemberAreaIds = romanAt50.areas
    .filter((area) => area.hasShape && area.holderRomanSide === true)
    .map((area) => area.areaId);
  const romanMemberAreaIdSet = new Set(romanMemberAreaIds);
  const romanNonMemberBoundarySegmentsByAreaId = new Map(
    romanAt50.areas
      .filter((area) => area.hasShape && !romanMemberAreaIdSet.has(area.areaId))
      .map((area) => [area.areaId, boundarySegmentsForGeometry(areaGeometryById.get(area.areaId))])
  );
  const romanProbePoints = collectInnerSharedBorderProbePoints({
    memberAreaIds: romanMemberAreaIds,
    areaGeometryById,
    coastlineBoundarySegments,
    nonMemberBoundarySegmentsByAreaId: romanNonMemberBoundarySegmentsByAreaId
  });
  assert.ok(romanProbePoints.length > 0, "expected roman-side probe point for seeded-notch regression");
  const seededRomanNotchUnion = withSeededNotch(romanSideUnion, romanProbePoints[0].point);
  const seededRomanNotchViolations = collectUnionProbeViolations({
    unionGeometry: seededRomanNotchUnion,
    probePoints: [romanProbePoints[0]]
  });
  assert.ok(
    seededRomanNotchViolations.some((violation) => violation.reason === "near-union-outline"),
    "expected seeded roman-side notch to violate the 0.1 km inner-border clearance guard"
  );
});
