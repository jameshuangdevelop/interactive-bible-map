import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

import polylabel from "polylabel";
import { feature, mesh, neighbors } from "topojson-client";
import { topology } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";

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
  const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
  if (Math.abs(cross) > epsilon) {
    return false;
  }
  const dot = (px - x1) * (x2 - x1) + (py - y1) * (y2 - y1);
  if (dot < -epsilon) {
    return false;
  }
  const squaredLength = (x2 - x1) ** 2 + (y2 - y1) ** 2;
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

function holderForYear(area, year) {
  if (!Array.isArray(area?.periods)) {
    return null;
  }
  for (const period of area.periods) {
    if (period.fromYear <= year && year < period.toYear) {
      return period;
    }
  }
  return null;
}

function normalizePair(left, right) {
  return left.id.localeCompare(right.id) <= 0
    ? { first: left, second: right }
    : { first: right, second: left };
}

function pairKey(leftId, rightId) {
  return leftId.localeCompare(rightId) <= 0 ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;
}

function parsePairKey(value) {
  const [leftId, rightId] = value.split("|");
  return { leftId, rightId };
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

  return {
    baseTopology,
    simplifiedTopology,
    fullFeatures: {
      ...fullFeatures,
      features: fullFeatures.features.map((item) => ({
        ...item,
        geometry: roundGeometry(item.geometry)
      }))
    },
    simplifiedFeatures: {
      ...simplifiedFeatures,
      features: simplifiedFeatures.features.map((item) => ({
        ...item,
        geometry: roundGeometry(item.geometry)
      }))
    }
  };
}

function buildHolderLabelPoints({ assignments, areaFeatureById, entitiesById }) {
  const holderPieces = new Map();

  for (const assignment of assignments) {
    const areaFeature = areaFeatureById.get(assignment.areaId);
    if (!areaFeature) {
      continue;
    }

    for (const polygon of polygonsFromGeometry(areaFeature.geometry)) {
      const area = polygonArea(polygon[0]);
      const existing = holderPieces.get(assignment.holderId);
      if (!existing || area > existing.area) {
        holderPieces.set(assignment.holderId, {
          polygon,
          area
        });
      }
    }
  }

  const labels = [];
  for (const [holderId, piece] of holderPieces.entries()) {
    const holder = entitiesById.get(holderId);
    if (!holder || !piece?.polygon) {
      continue;
    }
    if (holder.kind === "uncertain") {
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
    labels.push({
      holderId,
      name: holder.name,
      kind: holder.kind,
      romanSide: holder.romanSide,
      locationId: holder.locationId ?? null,
      labelPoint: [roundNumber(labelPoint[0]), roundNumber(labelPoint[1])]
    });
  }

  return labels.sort((left, right) => left.holderId.localeCompare(right.holderId));
}

function buildStopBorderCollections({
  stopTopology,
  assignmentsByAreaId,
  entitiesById
}) {
  const areaObject = stopTopology.objects.areas;
  const geometries = areaObject.geometries ?? [];
  const adjacentIndexes = neighbors(geometries);
  const borderPairs = new Set();

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
      borderPairs.add(pairKey(leftHolder.holderId, rightHolder.holderId));
    }
  });

  const holderBorders = [];

  for (const borderPair of borderPairs) {
    const { leftId, rightId } = parsePairKey(borderPair);
    const geometry = mesh(stopTopology, areaObject, (leftArea, rightArea) => {
      if (!leftArea || !rightArea) {
        return false;
      }

      const leftAssignment = assignmentsByAreaId.get(leftArea.properties?.areaId);
      const rightAssignment = assignmentsByAreaId.get(rightArea.properties?.areaId);
      if (!leftAssignment || !rightAssignment) {
        return false;
      }

      return pairKey(leftAssignment.holderId, rightAssignment.holderId) === borderPair;
    });

    if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
      continue;
    }

    const leftHolder = entitiesById.get(leftId);
    const rightHolder = entitiesById.get(rightId);
    if (!leftHolder || !rightHolder) {
      continue;
    }

    const normalizedPair = normalizePair(leftHolder, rightHolder);
    holderBorders.push({
      type: "Feature",
      properties: {
        holderAId: normalizedPair.first.id,
        holderAKind: normalizedPair.first.kind,
        holderARomanSide: normalizedPair.first.romanSide,
        holderBId: normalizedPair.second.id,
        holderBKind: normalizedPair.second.kind,
        holderBRomanSide: normalizedPair.second.romanSide
      },
      geometry: roundGeometry(geometry)
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
        const leftKey = `${left.properties.holderAId}|${left.properties.holderBId}`;
        const rightKey = `${right.properties.holderAId}|${right.properties.holderBId}`;
        return leftKey.localeCompare(rightKey);
      })
    },
    romanEmpireEdge:
      romanEmpireEdge &&
      Array.isArray(romanEmpireEdge.coordinates) &&
      romanEmpireEdge.coordinates.length > 0
        ? roundGeometry(romanEmpireEdge)
        : null
  };
}

export async function buildAncientAppData({
  timelineData,
  ancientAreasData,
  ancientRoadsData,
  ancientCoastlineData,
  outputDirectory,
  simplifyThreshold = 0.00002
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

  writtenFiles.push(
    await writeJsonWithSize(
      outputDirectory,
      "ancient.roads.geojson",
      {
        ...ancientRoadsData,
        features: (ancientRoadsData.features ?? []).map((feature) => ({
          ...feature,
          geometry: roundGeometry(feature.geometry)
        }))
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

  for (const stop of stops) {
    const assignments = [];
    const assignmentsByAreaId = new Map();
    for (const area of areasById.values()) {
      const period = holderForYear(area, stop.year);
      if (!period) {
        continue;
      }
      const holder = entitiesById.get(period.holderId);
      if (!holder) {
        continue;
      }

      const assignment = {
        areaId: area.id,
        holderId: period.holderId,
        holderKind: holder.kind,
        holderRomanSide: holder.romanSide,
        holderLocationId: holder.locationId ?? null,
        ruler: period.ruler ?? null,
        note: period.note ?? null,
        hasShape: areaFeatureById.has(area.id)
      };
      assignments.push(assignment);
      assignmentsByAreaId.set(area.id, assignment);
    }

    const borderCollections = buildStopBorderCollections({
      stopTopology: topologyData.simplifiedTopology,
      assignmentsByAreaId,
      entitiesById
    });
    const holderLabels = buildHolderLabelPoints({
      assignments,
      areaFeatureById,
      entitiesById
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

  return { writtenFiles, totalBytes, totalGzipBytes };
}
