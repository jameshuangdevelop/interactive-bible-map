import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

import polylabel from "polylabel";
import { feature, mesh, neighbors } from "topojson-client";
import { topology } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";

// Full shapes keep 5 decimals (about 1 m), which the Jordan border near Bethany beyond the Jordan
// needs. The zoom-10 shapes, the per-stop border lines drawn from the same simplified topology and
// the static empire edge use 4 decimals (about 11 m), well below their simplification.
const SIMPLIFIED_COORDINATE_DECIMALS = 4;
const HOLDER_LABEL_MIN_ZOOM = 4;
const HOLDER_LABEL_MAX_ZOOM = 9;
const HOLDER_LABEL_FONT_SIZE_PX = 13;
const HOLDER_LABEL_LETTER_SPACING_EM = 0.18;
const HOLDER_LABEL_LINE_HEIGHT_PX = 12;
const HOLDER_LABEL_MAX_LINE_WIDTH_PX = 150;
const HOLDER_LABEL_EDGE_PADDING_PX = 0;
const HOLDER_LABEL_PIN_BUFFER_PX_AT_ZOOM8 = 36;
const HOLDER_LABEL_GRID_STEPS = 56;
const ROAD_JOIN_MIN_DISTANCE_KM = 0.2;
const ROAD_JOIN_MAX_DISTANCE_KM = 4;
const MAPLIBRE_GLYPH_METRICS_EM_SIZE = 24;
const HOLDER_LABEL_GLYPH_WIDTH_SAFETY_FACTOR = 1.05;
// Source: https://tiles.openfreemap.org/fonts/Noto%20Sans%20Bold/0-255.pbf
// Advances are at 24 px because MapLibre glyph metrics are emitted at that em size.
const MAPLIBRE_GLYPH_ADVANCES_AT_24PX = Object.freeze({
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
  " ": 6,
  "-": 7,
  "(": 8,
  ")": 8
});
const FALLBACK_GLYPH_ADVANCE_AT_24PX = 23;

function toMapById(records) {
  const map = new Map();
  for (const record of records ?? []) {
    if (typeof record?.id === "string") {
      map.set(record.id, record);
    }
  }
  return map;
}

function roundNumber(value, decimals = 5) {
  if (typeof value !== "number") {
    return value;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundCoordinates(value, decimals = 5) {
  if (Array.isArray(value)) {
    return value.map((entry) => roundCoordinates(entry, decimals));
  }
  if (typeof value === "number") {
    return roundNumber(value, decimals);
  }
  return value;
}

function roundGeometry(geometry, decimals = 5) {
  return {
    ...geometry,
    coordinates: roundCoordinates(geometry.coordinates, decimals)
  };
}

function perpendicularDistance(point, start, end) {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;
  const dx = ex - sx;
  const dy = ey - sy;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - sx, py - sy);
  }
  const t = ((px - sx) * dx + (py - sy) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const nx = sx + clampedT * dx;
  const ny = sy + clampedT * dy;
  return Math.hypot(px - nx, py - ny);
}

function simplifyLineString(coordinates, tolerance) {
  if (!Array.isArray(coordinates) || coordinates.length <= 2) {
    return coordinates;
  }

  const keepIndexes = new Set([0, coordinates.length - 1]);
  const stack = [[0, coordinates.length - 1]];

  while (stack.length > 0) {
    const [startIndex, endIndex] = stack.pop();
    const start = coordinates[startIndex];
    const end = coordinates[endIndex];
    let maxDistance = 0;
    let maxDistanceIndex = -1;

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const distance = perpendicularDistance(coordinates[index], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxDistanceIndex = index;
      }
    }

    if (maxDistanceIndex > -1 && maxDistance > tolerance) {
      keepIndexes.add(maxDistanceIndex);
      stack.push([startIndex, maxDistanceIndex], [maxDistanceIndex, endIndex]);
    }
  }

  return [...keepIndexes]
    .sort((left, right) => left - right)
    .map((index) => coordinates[index]);
}

function simplifyRoadGeometry(geometry, tolerance) {
  if (!geometry || typeof geometry !== "object") {
    return geometry;
  }
  if (geometry.type === "LineString") {
    return {
      ...geometry,
      coordinates: simplifyLineString(geometry.coordinates, tolerance)
    };
  }
  if (geometry.type === "MultiLineString") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((line) => simplifyLineString(line, tolerance))
    };
  }
  return geometry;
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

function localMetersByLongitude(longitude, latitude, referenceLatitude) {
  const latitudeRadians = toRadians(referenceLatitude);
  const x = longitude * 111320 * Math.cos(latitudeRadians);
  const y = latitude * 111320;
  return [x, y];
}

function nearestPointOnSegmentLngLat(point, segmentStart, segmentEnd) {
  const referenceLatitude = point[1];
  const [pointX, pointY] = localMetersByLongitude(point[0], point[1], referenceLatitude);
  const [startX, startY] = localMetersByLongitude(
    segmentStart[0],
    segmentStart[1],
    referenceLatitude
  );
  const [endX, endY] = localMetersByLongitude(segmentEnd[0], segmentEnd[1], referenceLatitude);
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (deltaX === 0 && deltaY === 0) {
    return {
      point: [segmentStart[0], segmentStart[1]],
      factor: 0
    };
  }

  const t = ((pointX - startX) * deltaX + (pointY - startY) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    point: [
      segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * clampedT,
      segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * clampedT
    ],
    factor: clampedT
  };
}

function normalizeRoadLineStrings(geometry) {
  if (!geometry || typeof geometry !== "object") {
    return [];
  }
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.filter((line) => Array.isArray(line));
  }
  return [];
}

function endpointKey(point) {
  return `${roundNumber(point[0], 6)},${roundNumber(point[1], 6)}`;
}

function joinKey(pointA, pointB) {
  const a = endpointKey(pointA);
  const b = endpointKey(pointB);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildRoadJoinFeatures(roadFeatures) {
  const roadLines = [];
  for (let featureIndex = 0; featureIndex < roadFeatures.length; featureIndex += 1) {
    const lines = normalizeRoadLineStrings(roadFeatures[featureIndex]?.geometry);
    lines.forEach((line) => {
      if (Array.isArray(line) && line.length >= 2) {
        roadLines.push({ featureIndex, coordinates: line });
      }
    });
  }

  const joins = [];
  const seenFacingJoinKeys = new Set();
  let totalJoinLengthKm = 0;
  let maxJoinLengthKm = 0;
  const segments = roadLines.flatMap((lineEntry) => {
    const parts = [];
    for (let index = 0; index < lineEntry.coordinates.length - 1; index += 1) {
      parts.push({
        featureIndex: lineEntry.featureIndex,
        start: lineEntry.coordinates[index],
        end: lineEntry.coordinates[index + 1]
      });
    }
    return parts;
  });
  const roadVertices = roadLines.flatMap((lineEntry) =>
    lineEntry.coordinates.map((coordinate) => ({
      featureIndex: lineEntry.featureIndex,
      coordinate
    }))
  );
  const roadEndpoints = roadLines.flatMap((lineEntry) => [
    {
      featureIndex: lineEntry.featureIndex,
      coordinate: lineEntry.coordinates[0]
    },
    {
      featureIndex: lineEntry.featureIndex,
      coordinate: lineEntry.coordinates[lineEntry.coordinates.length - 1]
    }
  ]);
  const roadEndpointKeys = new Set(roadEndpoints.map((endpoint) => endpointKey(endpoint.coordinate)));

  for (const lineEntry of roadLines) {
    const endpoints = [lineEntry.coordinates[0], lineEntry.coordinates[lineEntry.coordinates.length - 1]];
    for (const endpoint of endpoints) {
      let nearestVertexRoad = null;
      for (const candidateVertex of roadVertices) {
        if (candidateVertex.featureIndex === lineEntry.featureIndex) {
          continue;
        }
        const distanceKm = haversineDistanceKm(endpoint, candidateVertex.coordinate);
        if (distanceKm <= ROAD_JOIN_MIN_DISTANCE_KM || distanceKm > ROAD_JOIN_MAX_DISTANCE_KM) {
          continue;
        }
        if (!nearestVertexRoad || distanceKm < nearestVertexRoad.distanceKm) {
          nearestVertexRoad = {
            featureIndex: candidateVertex.featureIndex,
            distanceKm
          };
        }
      }

      if (!nearestVertexRoad) {
        continue;
      }

      let bestMatch = null;
      for (const segment of segments) {
        if (segment.featureIndex !== nearestVertexRoad.featureIndex) {
          continue;
        }
        const nearest = nearestPointOnSegmentLngLat(endpoint, segment.start, segment.end);
        const distanceKm = haversineDistanceKm(endpoint, nearest.point);
        if (!bestMatch || distanceKm < bestMatch.distanceKm) {
          bestMatch = {
            nearestPoint: nearest.point,
            distanceKm
          };
        }
      }

      if (!bestMatch || bestMatch.distanceKm <= ROAD_JOIN_MIN_DISTANCE_KM || bestMatch.distanceKm > ROAD_JOIN_MAX_DISTANCE_KM) {
        continue;
      }

      const targetEndpointKey = endpointKey(bestMatch.nearestPoint);
      if (roadEndpointKeys.has(targetEndpointKey)) {
        const facingJoinKey = joinKey(endpoint, bestMatch.nearestPoint);
        if (seenFacingJoinKeys.has(facingJoinKey)) {
          continue;
        }
        seenFacingJoinKeys.add(facingJoinKey);
      }

      const sourceProperties = { ...(roadFeatures[lineEntry.featureIndex]?.properties ?? {}) };
      joins.push({
        type: "Feature",
        properties: sourceProperties,
        geometry: {
          type: "LineString",
          coordinates: [
            [endpoint[0], endpoint[1]],
            [bestMatch.nearestPoint[0], bestMatch.nearestPoint[1]]
          ]
        }
      });
      totalJoinLengthKm += bestMatch.distanceKm;
      maxJoinLengthKm = Math.max(maxJoinLengthKm, bestMatch.distanceKm);
    }
  }

  return {
    joinFeatures: joins,
    joinCount: joins.length,
    totalJoinLengthKm,
    maxJoinLengthKm
  };
}

function projectLngLatToPixels(longitude, latitude, zoom) {
  const worldSize = 512 * 2 ** zoom;
  const clampedLatitude = Math.max(-85.05112878, Math.min(85.05112878, latitude));
  const latitudeRadians = (clampedLatitude * Math.PI) / 180;
  const x = ((longitude + 180) / 360) * worldSize;
  const y =
    (0.5 -
      Math.log((1 + Math.sin(latitudeRadians)) / (1 - Math.sin(latitudeRadians))) /
        (4 * Math.PI)) *
    worldSize;
  return [x, y];
}

function projectPolygonToPixels(polygonCoordinates, zoom) {
  return polygonCoordinates.map((ring) =>
    ring.map(([longitude, latitude]) => projectLngLatToPixels(longitude, latitude, zoom))
  );
}

function pointDistance(pointA, pointB) {
  return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
}

function distanceToPolygonEdges(point, polygonCoordinates) {
  let minimumDistance = Number.POSITIVE_INFINITY;
  for (const ring of polygonCoordinates) {
    for (let index = 0; index < ring.length - 1; index += 1) {
      minimumDistance = Math.min(minimumDistance, perpendicularDistance(point, ring[index], ring[index + 1]));
    }
  }
  return minimumDistance;
}

function stripBracketedLabelSuffix(value) {
  return value.replace(/\s*\([^)]*\)/gu, "").replace(/\s+/gu, " ").trim();
}

function holderLabelDisplayText(holder, areaId) {
  const strippedName = stripBracketedLabelSuffix(holder.name);
  if (holder.id === "roman-empire" || areaId === "other-roman-lands") {
    return "OTHER ROMAN PROVINCES";
  }
  if (holder.id === "italy-direct") {
    return "ITALY";
  }

  if (holder.kind === "roman-province") {
    if (
      holder.locationId === "egypt" ||
      /^roman province of egypt$/iu.test(strippedName)
    ) {
      return "ROMAN EGYPT";
    }

    const provinceName = strippedName.replace(/^roman province of\s+/iu, "").trim();
    return `PROVINCE OF ${provinceName}`.toUpperCase();
  }

  return strippedName.toUpperCase();
}

function estimateHolderLabelLineWidthPx(textLine) {
  const characters = [...textLine];
  if (characters.length === 0) {
    return 0;
  }

  let width = 0;
  for (const character of characters) {
    const upperCharacter = character.toUpperCase();
    const advanceAt24Px =
      MAPLIBRE_GLYPH_ADVANCES_AT_24PX[upperCharacter] ?? FALLBACK_GLYPH_ADVANCE_AT_24PX;
    width +=
      (advanceAt24Px / MAPLIBRE_GLYPH_METRICS_EM_SIZE) *
      HOLDER_LABEL_FONT_SIZE_PX *
      HOLDER_LABEL_GLYPH_WIDTH_SAFETY_FACTOR;
  }
  width += Math.max(0, characters.length - 1) * HOLDER_LABEL_FONT_SIZE_PX * HOLDER_LABEL_LETTER_SPACING_EM;
  return width;
}

function wrapHolderLabelText(text) {
  const words = text.split(/\s+/u).filter((word) => word.length > 0);
  if (words.length === 0) {
    return { wrappedText: "", lineWidths: [0], lineCount: 1 };
  }

  const lines = [];
  let currentLine = words[0];
  for (let index = 1; index < words.length; index += 1) {
    const nextWord = words[index];
    const candidateLine = `${currentLine} ${nextWord}`;
    if (estimateHolderLabelLineWidthPx(candidateLine) <= HOLDER_LABEL_MAX_LINE_WIDTH_PX) {
      currentLine = candidateLine;
      continue;
    }
    lines.push(currentLine);
    currentLine = nextWord;
  }
  lines.push(currentLine);

  const lineWidths = lines.map((line) => estimateHolderLabelLineWidthPx(line));
  return {
    wrappedText: lines.join("\n"),
    lineWidths,
    lineCount: lines.length
  };
}

function holderLabelFitsInsidePolygonAtZoom({
  labelPoint,
  polygonCoordinates,
  lineWidths,
  lineCount,
  zoom
}) {
  const projectedPolygon = projectPolygonToPixels(polygonCoordinates, zoom);
  const projectedLabelPoint = projectLngLatToPixels(labelPoint[0], labelPoint[1], zoom);
  const halfWidth = Math.max(0, ...lineWidths) / 2 + HOLDER_LABEL_EDGE_PADDING_PX;
  const halfHeight = (lineCount * HOLDER_LABEL_LINE_HEIGHT_PX) / 2 + HOLDER_LABEL_EDGE_PADDING_PX;

  const samplePoints = [
    [projectedLabelPoint[0] - halfWidth, projectedLabelPoint[1] - halfHeight],
    [projectedLabelPoint[0] + halfWidth, projectedLabelPoint[1] - halfHeight],
    [projectedLabelPoint[0] + halfWidth, projectedLabelPoint[1] + halfHeight],
    [projectedLabelPoint[0] - halfWidth, projectedLabelPoint[1] + halfHeight],
    [projectedLabelPoint[0], projectedLabelPoint[1] - halfHeight],
    [projectedLabelPoint[0], projectedLabelPoint[1] + halfHeight],
    [projectedLabelPoint[0] - halfWidth, projectedLabelPoint[1]],
    [projectedLabelPoint[0] + halfWidth, projectedLabelPoint[1]],
    projectedLabelPoint
  ];

  return samplePoints.every((samplePoint) => pointInPolygon(samplePoint, projectedPolygon));
}

function calculateHolderLabelMinZoom({
  labelPoint,
  polygonCoordinates,
  lineWidths,
  lineCount
}) {
  for (let zoom = HOLDER_LABEL_MIN_ZOOM; zoom <= HOLDER_LABEL_MAX_ZOOM; zoom += 1) {
    if (
      holderLabelFitsInsidePolygonAtZoom({
        labelPoint,
        polygonCoordinates,
        lineWidths,
        lineCount,
        zoom
      })
    ) {
      return zoom;
    }
  }
  return HOLDER_LABEL_MAX_ZOOM + 1;
}

function selectHolderLabelPoint({
  polygonCoordinates,
  majorPinsInPiece,
  lineWidths,
  lineCount,
  fallbackPoint
}) {
  const bounds = polygonBoundingBox(polygonCoordinates);
  if (!bounds) {
    return {
      point: fallbackPoint,
      minZoom: calculateHolderLabelMinZoom({
        labelPoint: fallbackPoint,
        polygonCoordinates,
        lineWidths,
        lineCount
      })
    };
  }

  const projectedPolygon = projectPolygonToPixels(polygonCoordinates, 8);
  const projectedPins = (majorPinsInPiece ?? []).map((pin) => projectLngLatToPixels(pin[0], pin[1], 8));
  const candidates = [];

  const evaluateCandidate = (candidatePoint) => {
    if (!candidatePoint || !pointInPolygon(candidatePoint, polygonCoordinates)) {
      return;
    }

    const projectedCandidate = projectLngLatToPixels(candidatePoint[0], candidatePoint[1], 8);
    const edgeDistance = distanceToPolygonEdges(projectedCandidate, projectedPolygon);
    const pinDistance =
      projectedPins.length === 0
        ? Number.POSITIVE_INFINITY
        : projectedPins.reduce(
            (minimumDistance, projectedPin) =>
              Math.min(minimumDistance, pointDistance(projectedCandidate, projectedPin)),
            Number.POSITIVE_INFINITY
          );

    candidates.push({
      point: candidatePoint,
      minZoom: calculateHolderLabelMinZoom({
        labelPoint: candidatePoint,
        polygonCoordinates,
        lineWidths,
        lineCount
      }),
      pinDistance,
      edgeDistance
    });
  };

  evaluateCandidate(fallbackPoint);

  for (let stepY = 0; stepY < HOLDER_LABEL_GRID_STEPS; stepY += 1) {
    const latitude =
      bounds.minY + ((stepY + 0.5) / HOLDER_LABEL_GRID_STEPS) * (bounds.maxY - bounds.minY);
    for (let stepX = 0; stepX < HOLDER_LABEL_GRID_STEPS; stepX += 1) {
      const longitude =
        bounds.minX + ((stepX + 0.5) / HOLDER_LABEL_GRID_STEPS) * (bounds.maxX - bounds.minX);
      const candidatePoint = [longitude, latitude];
      evaluateCandidate(candidatePoint);
    }
  }

  if (candidates.length === 0) {
    return {
      point: fallbackPoint,
      minZoom: calculateHolderLabelMinZoom({
        labelPoint: fallbackPoint,
        polygonCoordinates,
        lineWidths,
        lineCount
      })
    };
  }

  const bestCandidate = candidates.sort((left, right) => {
    if (left.minZoom !== right.minZoom) {
      return left.minZoom - right.minZoom;
    }

    const leftBufferClear = left.pinDistance - HOLDER_LABEL_PIN_BUFFER_PX_AT_ZOOM8;
    const rightBufferClear = right.pinDistance - HOLDER_LABEL_PIN_BUFFER_PX_AT_ZOOM8;
    const leftClearsBuffer = leftBufferClear >= 0;
    const rightClearsBuffer = rightBufferClear >= 0;
    if (leftClearsBuffer !== rightClearsBuffer) {
      return leftClearsBuffer ? -1 : 1;
    }

    if (left.pinDistance !== right.pinDistance) {
      return right.pinDistance - left.pinDistance;
    }
    if (left.edgeDistance !== right.edgeDistance) {
      return right.edgeDistance - left.edgeDistance;
    }

    const leftScore = Math.min(left.edgeDistance, leftBufferClear);
    const rightScore = Math.min(right.edgeDistance, rightBufferClear);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    if (left.point[0] !== right.point[0]) {
      return left.point[0] - right.point[0];
    }
    return left.point[1] - right.point[1];
  })[0];

  return {
    point: bestCandidate.point,
    minZoom: bestCandidate.minZoom
  };
}

function polygonArea(linearRing) {
  if (!Array.isArray(linearRing) || linearRing.length < 4) {
    return 0;
  }

  let sum = 0;
  for (let index = 0; index < linearRing.length - 1; index += 1) {
    const [x1, y1] = linearRing[index];
    const [x2, y2] = linearRing[index + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum / 2);
}

function pointOnSegment(point, segmentStart, segmentEnd, epsilon = 1e-9) {
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const squaredLength = dx ** 2 + dy ** 2;
  if (squaredLength <= epsilon) {
    return Math.hypot(px - x1, py - y1) <= epsilon;
  }
  const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
  if (Math.abs(cross) > epsilon) {
    return false;
  }
  const dot = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1);
  if (dot < -epsilon) {
    return false;
  }
  return dot - squaredLength <= epsilon;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
    const current = ring[index];
    const previous = ring[previousIndex];
    if (!Array.isArray(current) || !Array.isArray(previous)) {
      continue;
    }

    if (pointOnSegment(point, current, previous)) {
      return true;
    }

    const intersects =
      (current[1] > point[1]) !== (previous[1] > point[1]) &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) /
          (previous[1] - current[1]) +
          current[0];
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) {
    return false;
  }
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

function polygonBoundingBox(polygonCoordinates) {
  const outerRing = polygonCoordinates[0] ?? [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const position of outerRing) {
    if (!Array.isArray(position) || position.length < 2) {
      continue;
    }
    minX = Math.min(minX, position[0]);
    minY = Math.min(minY, position[1]);
    maxX = Math.max(maxX, position[0]);
    maxY = Math.max(maxY, position[1]);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function findGuaranteedInteriorPoint(polygonCoordinates) {
  const bounds = polygonBoundingBox(polygonCoordinates);
  if (!bounds) {
    return null;
  }

  const { minY, maxY } = bounds;
  const outerRing = polygonCoordinates[0] ?? [];
  const yRange = maxY - minY;
  if (yRange <= 0 || outerRing.length < 4) {
    return null;
  }

  for (let step = 0; step < 128; step += 1) {
    const y = minY + ((step + 0.5) / 128) * yRange;
    const intersections = [];
    for (let index = 0; index < outerRing.length - 1; index += 1) {
      const [x1, y1] = outerRing[index];
      const [x2, y2] = outerRing[index + 1];
      const intersects = (y1 > y) !== (y2 > y);
      if (!intersects) {
        continue;
      }
      const x = x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
      intersections.push(x);
    }

    intersections.sort((left, right) => left - right);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      const x1 = intersections[index];
      const x2 = intersections[index + 1];
      if (x2 <= x1) {
        continue;
      }
      const midpoint = [(x1 + x2) / 2, y];
      if (pointInPolygon(midpoint, polygonCoordinates)) {
        return midpoint;
      }
    }
  }

  return null;
}

function polygonsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }
  return [];
}

function holderSpanForYear(area, year) {
  if (!Array.isArray(area?.periods)) {
    return null;
  }

  const activeIndex = area.periods.findIndex(
    (period) => period.fromYear <= year && year < period.toYear
  );
  if (activeIndex < 0) {
    return null;
  }

  const active = area.periods[activeIndex];
  let heldFromYear = active.fromYear;
  let heldToYear = active.toYear;
  let runStartIndex = activeIndex;
  let runEndIndex = activeIndex;

  for (let index = activeIndex - 1; index >= 0; index -= 1) {
    const period = area.periods[index];
    if (period.holderId !== active.holderId || period.toYear !== heldFromYear) {
      break;
    }
    heldFromYear = period.fromYear;
    runStartIndex = index;
  }

  for (let index = activeIndex + 1; index < area.periods.length; index += 1) {
    const period = area.periods[index];
    if (period.holderId !== active.holderId || period.fromYear !== heldToYear) {
      break;
    }
    heldToYear = period.toYear;
    runEndIndex = index;
  }

  return {
    period: active,
    heldFromYear,
    heldToYear,
    runStartIndex,
    runEndIndex
  };
}

function normalizePair(left, right) {
  return left.id.localeCompare(right.id) <= 0
    ? { first: left, second: right }
    : { first: right, second: left };
}

function pairKey(leftId, rightId) {
  return leftId.localeCompare(rightId) <= 0 ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;
}

async function writeJsonWithSize(outputDirectory, relativePath, payload) {
  const destinationPath = path.join(outputDirectory, relativePath);
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  const text = JSON.stringify(payload);
  await fs.writeFile(destinationPath, text, "utf8");
  const bytes = Buffer.byteLength(text, "utf8");
  const gzipBytes = zlib.gzipSync(text, { level: zlib.constants.Z_BEST_COMPRESSION }).length;
  return { file: relativePath.replace(/\\/gu, "/"), bytes, gzipBytes };
}

function buildTopologyFeatureCollection(areaFeatureCollection, simplifyThreshold) {
  const baseTopology = topology({ areas: areaFeatureCollection });
  const simplifiedTopology = simplify(
    presimplify(JSON.parse(JSON.stringify(baseTopology))),
    simplifyThreshold
  );

  const fullFeatures = feature(baseTopology, baseTopology.objects.areas);
  const simplifiedFeatures = feature(simplifiedTopology, simplifiedTopology.objects.areas);
  // The app's copy of the shapes carries only each area's id: provenance stays in data/geo/ for the
  // sources list and the Fact-Checker (ADR-0037's update of 2026-10-08, item 2).
  const appProperties = (item) => ({ areaId: item.properties?.areaId });

  return {
    baseTopology,
    simplifiedTopology,
    fullFeatures: {
      ...fullFeatures,
      features: fullFeatures.features.map((item) => ({
        ...item,
        properties: appProperties(item),
        geometry: roundGeometry(item.geometry)
      }))
    },
    simplifiedFeatures: {
      ...simplifiedFeatures,
      features: simplifiedFeatures.features.map((item) => ({
        ...item,
        properties: appProperties(item),
        geometry: roundGeometry(item.geometry, SIMPLIFIED_COORDINATE_DECIMALS)
      }))
    }
  };
}

function buildHolderLabelPoints({ assignments, areaFeatureById, entitiesById, majorPlacePinCoordinates }) {
  const holderPieces = new Map();

  for (const assignment of assignments) {
    const areaFeature = areaFeatureById.get(assignment.areaId);
    if (!areaFeature) {
      continue;
    }

    for (const polygon of polygonsFromGeometry(areaFeature.geometry)) {
      const area = polygonArea(polygon[0]);
      const bounds = polygonBoundingBox(polygon);
      const pieces = holderPieces.get(assignment.holderId) ?? [];
      pieces.push({
        areaId: assignment.areaId,
        polygon,
        area,
        majorPins: (majorPlacePinCoordinates ?? [])
          .filter((majorPin) => {
            if (!bounds) {
              return false;
            }
            const [longitude, latitude] = majorPin.coordinates;
            return (
              longitude >= bounds.minX - 1.2 &&
              longitude <= bounds.maxX + 1.2 &&
              latitude >= bounds.minY - 1.2 &&
              latitude <= bounds.maxY + 1.2
            );
          })
          .map((majorPin) => majorPin.coordinates)
      });
      holderPieces.set(assignment.holderId, pieces);
    }
  }

  const labels = [];
  for (const [holderId, pieces] of holderPieces.entries()) {
    const holder = entitiesById.get(holderId);
    if (!holder || !Array.isArray(pieces) || pieces.length === 0) {
      continue;
    }
    if (holder.kind === "uncertain") {
      continue;
    }

    const largestPieceArea = pieces.reduce(
      (maxArea, piece) => Math.max(maxArea, piece.area),
      0
    );
    const minimumPieceArea = largestPieceArea / 3;

    for (const piece of pieces) {
      if (!piece?.polygon || piece.area < minimumPieceArea) {
        continue;
      }

      const bounds = polygonBoundingBox(piece.polygon);
      const smallerSide = bounds
        ? Math.max(1e-6, Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY))
        : 1;
      const precision = Math.max(1e-6, smallerSide / 100);
      let labelPoint = polylabel(piece.polygon, precision);
      if (!pointInPolygon(labelPoint, piece.polygon)) {
        labelPoint = findGuaranteedInteriorPoint(piece.polygon) ?? labelPoint;
      }
      const labelName = holderLabelDisplayText(holder, piece.areaId);
      const wrappedLabel = wrapHolderLabelText(labelName);
      const selectedLabel = selectHolderLabelPoint({
        polygonCoordinates: piece.polygon,
        majorPinsInPiece: piece.majorPins,
        lineWidths: wrappedLabel.lineWidths,
        lineCount: wrappedLabel.lineCount,
        fallbackPoint: labelPoint
      });
      labelPoint = selectedLabel.point;
      const minZoom = selectedLabel.minZoom;
      if (minZoom > HOLDER_LABEL_MAX_ZOOM) {
        continue;
      }

      labels.push({
        holderId,
        areaId: piece.areaId,
        name: holder.name,
        labelText: wrappedLabel.wrappedText,
        minZoom,
        kind: holder.kind,
        ...(typeof holder.locationId === "string" && holder.locationId.length > 0
          ? { locationId: holder.locationId }
          : {}),
        labelPoint: [roundNumber(labelPoint[0]), roundNumber(labelPoint[1])]
      });
    }
  }

  return labels.sort((left, right) => {
    if (left.holderId !== right.holderId) {
      return left.holderId.localeCompare(right.holderId);
    }
    if (left.labelPoint[0] !== right.labelPoint[0]) {
      return left.labelPoint[0] - right.labelPoint[0];
    }
    return left.labelPoint[1] - right.labelPoint[1];
  });
}

function buildAreaLabelMinZoomByAreaId(assignments, holderLabels) {
  const minZoomByHolderId = new Map();
  const minZoomByHolderAndArea = new Map();

  for (const label of holderLabels) {
    const holderMinZoom = minZoomByHolderId.get(label.holderId);
    minZoomByHolderId.set(
      label.holderId,
      holderMinZoom === undefined ? label.minZoom : Math.min(holderMinZoom, label.minZoom)
    );

    const key = `${label.holderId}|${label.areaId}`;
    const areaMinZoom = minZoomByHolderAndArea.get(key);
    minZoomByHolderAndArea.set(key, areaMinZoom === undefined ? label.minZoom : Math.min(areaMinZoom, label.minZoom));
  }

  const minZoomByAreaId = new Map();
  for (const assignment of assignments) {
    if (assignment.holderKind === "uncertain") {
      minZoomByAreaId.set(assignment.areaId, 0);
      continue;
    }

    const areaKey = `${assignment.holderId}|${assignment.areaId}`;
    const areaLabelMinZoom = minZoomByHolderAndArea.get(areaKey);
    if (areaLabelMinZoom !== undefined) {
      minZoomByAreaId.set(assignment.areaId, areaLabelMinZoom);
      continue;
    }

    const holderLabelMinZoom = minZoomByHolderId.get(assignment.holderId);
    minZoomByAreaId.set(assignment.areaId, holderLabelMinZoom ?? 0);
  }

  return minZoomByAreaId;
}

function buildStopBorderCollections({
  stopTopology,
  assignmentsByAreaId,
  entitiesById,
  areaLabelMinZoomByAreaId
}) {
  const areaObject = stopTopology.objects.areas;
  const geometries = areaObject.geometries ?? [];
  const adjacentIndexes = neighbors(geometries);
  const borderAreaPairs = new Map();

  const holderForGeometry = (geometry) => {
    const areaId = geometry?.properties?.areaId;
    if (typeof areaId !== "string") {
      return null;
    }
    return assignmentsByAreaId.get(areaId) ?? null;
  };

  geometries.forEach((geometry, leftIndex) => {
    for (const rightIndex of adjacentIndexes[leftIndex] ?? []) {
      if (rightIndex <= leftIndex) {
        continue;
      }

      const leftHolder = holderForGeometry(geometry);
      const rightHolder = holderForGeometry(geometries[rightIndex]);
      if (!leftHolder || !rightHolder) {
        continue;
      }
      if (leftHolder.holderId === rightHolder.holderId) {
        continue;
      }

      const leftAreaId = geometry?.properties?.areaId;
      const rightAreaId = geometries[rightIndex]?.properties?.areaId;
      if (typeof leftAreaId !== "string" || typeof rightAreaId !== "string") {
        continue;
      }

      const areaPairKey = pairKey(leftAreaId, rightAreaId);
      borderAreaPairs.set(areaPairKey, { leftAreaId, rightAreaId });
    }
  });

  const holderBorders = [];

  for (const [areaPairKey, areaPair] of borderAreaPairs.entries()) {
    const { leftAreaId, rightAreaId } = areaPair;
    const leftAssignment = assignmentsByAreaId.get(leftAreaId);
    const rightAssignment = assignmentsByAreaId.get(rightAreaId);
    if (!leftAssignment || !rightAssignment) {
      continue;
    }

    const leftHolder = entitiesById.get(leftAssignment.holderId);
    const rightHolder = entitiesById.get(rightAssignment.holderId);
    if (!leftHolder || !rightHolder) {
      continue;
    }

    const normalizedPair = normalizePair(leftHolder, rightHolder);
    const normalizedAreaAId =
      normalizedPair.first.id === leftAssignment.holderId ? leftAreaId : rightAreaId;
    const normalizedAreaBId =
      normalizedPair.second.id === rightAssignment.holderId ? rightAreaId : leftAreaId;
    const areaAMinZoom = areaLabelMinZoomByAreaId.get(normalizedAreaAId) ?? 0;
    const areaBMinZoom = areaLabelMinZoomByAreaId.get(normalizedAreaBId) ?? 0;

    const geometry = mesh(stopTopology, areaObject, (leftArea, rightArea) => {
      if (!leftArea || !rightArea) {
        return false;
      }

      const candidateLeftAreaId = leftArea.properties?.areaId;
      const candidateRightAreaId = rightArea.properties?.areaId;
      if (typeof candidateLeftAreaId !== "string" || typeof candidateRightAreaId !== "string") {
        return false;
      }

      return pairKey(candidateLeftAreaId, candidateRightAreaId) === areaPairKey;
    });

    if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      continue;
    }
    holderBorders.push({
      type: "Feature",
      properties: {
        holderAAreaId: normalizedAreaAId,
        holderBAreaId: normalizedAreaBId,
        borderStyle:
          normalizedPair.first.kind === "uncertain" || normalizedPair.second.kind === "uncertain"
            ? "disputed"
            : "state",
        minZoom: Math.max(areaAMinZoom, areaBMinZoom)
      },
      geometry: roundGeometry(geometry, SIMPLIFIED_COORDINATE_DECIMALS)
    });
  }

  const romanEmpireEdge = mesh(stopTopology, areaObject, (leftArea, rightArea) => {
    if (!leftArea || !rightArea) {
      return false;
    }

    const leftAssignment = assignmentsByAreaId.get(leftArea.properties?.areaId);
    const rightAssignment = assignmentsByAreaId.get(rightArea.properties?.areaId);
    if (!leftAssignment || !rightAssignment) {
      return false;
    }

    const leftHolder = entitiesById.get(leftAssignment.holderId);
    const rightHolder = entitiesById.get(rightAssignment.holderId);
    if (!leftHolder || !rightHolder) {
      return false;
    }

    return leftHolder.romanSide !== rightHolder.romanSide;
  });

  return {
    holderBorders: {
      type: "FeatureCollection",
      features: holderBorders.sort((left, right) => {
        const leftKey = `${left.properties.holderAAreaId}|${left.properties.holderBAreaId}`;
        const rightKey = `${right.properties.holderAAreaId}|${right.properties.holderBAreaId}`;
        return leftKey.localeCompare(rightKey);
      })
    },
    romanEmpireEdge:
      romanEmpireEdge &&
      Array.isArray(romanEmpireEdge.coordinates) &&
      romanEmpireEdge.coordinates.length > 0
        ? roundGeometry(romanEmpireEdge, SIMPLIFIED_COORDINATE_DECIMALS)
        : null
  };
}

export async function buildAncientAppData({
  timelineData,
  ancientAreasData,
  ancientRoadsData,
  ancientCoastlineData,
  bibliographyById = new Map(),
  ancientEmpireEdgeData = null,
  majorPlacePinCoordinates = [],
  outputDirectory,
  simplifyThreshold = 0.00002,
  roadSimplifyTolerance = 0.0015
}) {
  const entitiesById = toMapById(timelineData.entities ?? []);
  const areasById = toMapById(timelineData.areas ?? []);
  const stops = [...(timelineData.stops ?? [])].sort((left, right) => left.year - right.year);
  const defaultStop = stops
    .filter((stop) => stop.year <= timelineData.range.defaultYear)
    .slice(-1)[0] ?? null;

  const baseAreas = {
    type: "FeatureCollection",
    features: Array.isArray(ancientAreasData?.features) ? ancientAreasData.features : []
  };
  const areaFeatureById = new Map(
    baseAreas.features
      .filter((feature) => typeof feature?.properties?.areaId === "string")
      .map((feature) => [feature.properties.areaId, feature])
  );

  const topologyData = buildTopologyFeatureCollection(baseAreas, simplifyThreshold);
  const writtenFiles = [];

  const bibliographyEntryIds = new Set();
  for (const stop of stops) {
    for (const sourceId of stop.sources ?? []) {
      if (typeof sourceId !== "string" || !sourceId.startsWith("bib:")) {
        continue;
      }
      bibliographyEntryIds.add(sourceId.slice("bib:".length));
    }
  }
  const timelineBibliography = [...bibliographyEntryIds]
    .map((id) => bibliographyById.get(id))
    .filter((entry) => entry !== undefined);

  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, "ancient.timeline.json", {
      version: timelineData.version,
      range: timelineData.range,
      defaultStopId: defaultStop?.id ?? null,
      stops: stops.map((stop) => ({
        id: stop.id,
        year: stop.year,
        title: stop.title,
        summary: stop.summary,
        scripture: stop.scripture ?? [],
        sources: stop.sources ?? []
      })),
      bibliography: timelineBibliography,
      entities: (timelineData.entities ?? []).map((entity) => ({
        id: entity.id,
        name: entity.name,
        kind: entity.kind,
        romanSide: entity.romanSide,
        locationId: entity.locationId ?? null
      }))
    })
  );

  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, "ancient.shapes.json", {
      areas: topologyData.fullFeatures,
      areasSimplifiedForZoom10: topologyData.simplifiedFeatures
    })
  );

  // Like the shapes, the app's roads leave out each road's provenance, which stays in data/geo/
  // (ADR-0037's update of 2026-10-08, item 2).
  const simplifiedRoadFeatures = (ancientRoadsData.features ?? []).map((feature) => {
    const { provenance: _provenance, ...properties } = feature.properties ?? {};
    return {
      ...feature,
      properties,
      geometry: roundGeometry(
        simplifyRoadGeometry(feature.geometry, roadSimplifyTolerance),
        4
      )
    };
  });
  const roadJoinResult = buildRoadJoinFeatures(simplifiedRoadFeatures);
  const roadsWithJoins = [...simplifiedRoadFeatures, ...roadJoinResult.joinFeatures];

  writtenFiles.push(
    await writeJsonWithSize(
      outputDirectory,
      "ancient.roads.geojson",
      {
        ...ancientRoadsData,
        features: roadsWithJoins
      }
    )
  );

  writtenFiles.push(
    await writeJsonWithSize(
      outputDirectory,
      "ancient.coastline.geojson",
      {
        ...ancientCoastlineData,
        features: (ancientCoastlineData.features ?? []).map((feature) => ({
          ...feature,
          geometry: roundGeometry(feature.geometry)
        }))
      }
    )
  );

  // The empire edge does not change between stops, so it is written once rather
  // than per stop. Per-stop `romanEmpireEdge` lines still cover drawn non-Roman areas.
  if (Array.isArray(ancientEmpireEdgeData?.features)) {
    writtenFiles.push(
      await writeJsonWithSize(
        outputDirectory,
        "ancient.empire-edge.geojson",
        {
          ...ancientEmpireEdgeData,
          features: ancientEmpireEdgeData.features.map((feature) => ({
            ...feature,
            geometry: roundGeometry(feature.geometry, SIMPLIFIED_COORDINATE_DECIMALS)
          }))
        }
      )
    );
  }

  for (const stop of stops) {
    const assignments = [];
    const assignmentsByAreaId = new Map();
    for (const area of areasById.values()) {
      const holderSpan = holderSpanForYear(area, stop.year);
      if (!holderSpan) {
        continue;
      }
      const { period, heldFromYear, heldToYear, runStartIndex } = holderSpan;
      const holder = entitiesById.get(period.holderId);
      if (!holder) {
        continue;
      }
      const runStartsAtTimelineStart = heldFromYear === timelineData.range.fromYear;
      const noEarlierPeriodInData =
        runStartIndex === 0 &&
        area.periods[0]?.fromYear === timelineData.range.fromYear;
      const heldFromKnown = !(runStartsAtTimelineStart && noEarlierPeriodInData);

      const assignment = {
        areaId: area.id,
        holderId: period.holderId,
        holderKind: holder.kind,
        holderRomanSide: holder.romanSide,
        holderLocationId: holder.locationId ?? null,
        ruler: period.ruler ?? null,
        heldFromYear,
        heldToYear,
        heldFromKnown,
        note: period.note ?? null,
        hasShape: areaFeatureById.has(area.id)
      };
      assignments.push(assignment);
      assignmentsByAreaId.set(area.id, assignment);
    }

    const holderLabels = buildHolderLabelPoints({
      assignments,
      areaFeatureById,
      entitiesById,
      majorPlacePinCoordinates
    });
    const areaLabelMinZoomByAreaId = buildAreaLabelMinZoomByAreaId(assignments, holderLabels);
    const borderCollections = buildStopBorderCollections({
      stopTopology: topologyData.simplifiedTopology,
      assignmentsByAreaId,
      entitiesById,
      areaLabelMinZoomByAreaId
    });

    writtenFiles.push(
      await writeJsonWithSize(outputDirectory, `ancient.stop.${stop.id}.json`, {
        stopId: stop.id,
        year: stop.year,
        areas: assignments.sort((left, right) => left.areaId.localeCompare(right.areaId)),
        holderBorders: borderCollections.holderBorders,
        romanEmpireEdge: borderCollections.romanEmpireEdge,
        holderLabels
      })
    );
  }

  const totalBytes = writtenFiles.reduce((sum, item) => sum + item.bytes, 0);
  const totalGzipBytes = writtenFiles.reduce((sum, item) => sum + item.gzipBytes, 0);

  return {
    writtenFiles,
    totalBytes,
    totalGzipBytes,
    roadJoinCount: roadJoinResult.joinCount,
    roadJoinTotalLengthKm: roadJoinResult.totalJoinLengthKm,
    roadJoinMaxLengthKm: roadJoinResult.maxJoinLengthKm
  };
}

export const __testOnly = {
  projectLngLatToPixels,
  estimateHolderLabelLineWidthPx
};
