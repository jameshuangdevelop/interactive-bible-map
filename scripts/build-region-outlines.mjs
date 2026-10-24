import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mapshaper from "mapshaper";
import booleanValid from "@turf/boolean-valid";
import { distancePointToSegmentKm, pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { ancientGeoCache, fetchPinnedInputs, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import { geometryAreaKm2, polygonsOf } from "./lib/geometry-cleanup.mjs";
import { buildGroupVoronoi } from "./lib/local-equirect-voronoi.mjs";
import { GROUP_A_LABELS, GROUP_B_LABELS } from "./lib/m5-20-region-groups.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const areasPath = path.join(repositoryRoot, "data", "geo", "ancient-areas.geojson");
const empireEdgePath = path.join(repositoryRoot, "data", "geo", "ancient-empire-edge.geojson");
const anchorsPath = path.join(repositoryRoot, "data", "geo", "region-anchors.json");
const gazaFacePath = path.join(repositoryRoot, "data", "geo", "sources", "gaza-rhinocolura-face.geojson");
const outputPath = path.join(repositoryRoot, "data", "geo", "region-outlines.geojson");

const OUTPUT_PRECISION = 0.00001;
const MIN_NON_ISLAND_PART_KM2 = 1;
const ISLAND_REGION_IDS = new Set(["crete", "chios", "cos", "malta", "rhodes", "samos"]);
const ALLOWED_DROPPED_ISLAND_PARTS = Object.freeze({
  pontus: [{ name: "pontus-lower-halys-coastal-islet", maxAreaKm2: 10 }]
});
const LYCAONIA_DROPPED_PARTS_MAX_TOTAL_KM2 = 40;
const LYCAONIA_DROPPED_PART_MAX_DRAWN_OVERLAP_KM2 = 0.5;
const VORONOI_EPSILON = 1e-9;

function featureCollection(features) {
  return { type: "FeatureCollection", features };
}

function geometryFeature(geometry, properties = {}, id = undefined) {
  return { type: "Feature", ...(id ? { id } : {}), properties, geometry };
}

function geometriesAsFeatures(document) {
  if (!document) return [];
  if (document.type === "FeatureCollection") return (document.features ?? []).filter((feature) => feature.geometry);
  if (document.type === "GeometryCollection") {
    return (document.geometries ?? []).filter(Boolean).map((geometry) => geometryFeature(geometry));
  }
  if (document.type === "Feature") return document.geometry ? [document] : [];
  if (document.type && document.coordinates) return [geometryFeature(document)];
  return [];
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

async function booleanOp({ workDirectory, tag, operation, subjectFeatures, maskFeatures }) {
  const subjectPath = path.join(workDirectory, `${tag}-${operation}-subject.geojson`);
  const maskPath = path.join(workDirectory, `${tag}-${operation}-mask.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-${operation}-output.geojson`);
  await writeJson(subjectPath, featureCollection(subjectFeatures.map((feature) => geometryFeature(feature.geometry))));
  await writeJson(maskPath, featureCollection(maskFeatures.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(
    `-i ${subjectPath} name=subject -i ${maskPath} name=mask -target subject -${operation} mask -o format=geojson ${outputPath}`
  );
  return geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
}

function totalAreaKm2(features) {
  return (features ?? []).reduce((sum, feature) => sum + geometryAreaKm2(feature.geometry), 0);
}

async function booleanOpStrict({
  workDirectory,
  tag,
  operation,
  subjectFeatures,
  maskFeatures,
  expectNonEmpty = true,
  expectAreaChangeKm2 = null
}) {
  const beforeAreaKm2 = totalAreaKm2(subjectFeatures);
  const result = await booleanOp({ workDirectory, tag, operation, subjectFeatures, maskFeatures });
  if (expectNonEmpty && result.length === 0) {
    throw new Error(`${tag}: ${operation} produced no geometry.`);
  }
  if (expectAreaChangeKm2 != null) {
    const afterAreaKm2 = totalAreaKm2(result);
    const deltaKm2 = Math.abs(beforeAreaKm2 - afterAreaKm2);
    if (deltaKm2 < expectAreaChangeKm2) {
      throw new Error(`${tag}: ${operation} changed area by only ${deltaKm2.toFixed(3)} km² (< ${expectAreaChangeKm2} km²).`);
    }
  }
  return result;
}

async function unionOne({ workDirectory, tag, features }) {
  if (!Array.isArray(features) || features.length === 0) {
    throw new Error(`Union ${tag} received no features.`);
  }
  const inputPath = path.join(workDirectory, `${tag}-union-in.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-union-out.geojson`);
  await writeJson(
    inputPath,
    featureCollection(features.map((feature) => geometryFeature(feature.geometry, { group: 1 })))
  );
  await mapshaper.runCommands(`-i ${inputPath} -dissolve2 group -o format=geojson ${outputPath}`);
  const featuresOut = geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
  if (featuresOut.length !== 1) throw new Error(`Union ${tag} produced ${featuresOut.length} features.`);
  return featuresOut[0];
}

async function explode({ workDirectory, tag, features }) {
  if (!Array.isArray(features) || features.length === 0) return [];
  const inputPath = path.join(workDirectory, `${tag}-explode-in.geojson`);
  const outputPath = path.join(workDirectory, `${tag}-explode-out.geojson`);
  await writeJson(inputPath, featureCollection(features.map((feature) => geometryFeature(feature.geometry))));
  await mapshaper.runCommands(`-i ${inputPath} -explode -o format=geojson ${outputPath}`);
  return geometriesAsFeatures(JSON.parse(await fs.readFile(outputPath, "utf8")));
}

function bbox(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return [minX, minY, maxX, maxY];
}

function areaById(collection, areaId) {
  const found = (collection.features ?? []).find((feature) => feature?.properties?.areaId === areaId);
  if (!found) throw new Error(`Missing area '${areaId}'.`);
  return found;
}

function polygonPart(collection, areaId, partIndex) {
  const area = areaById(collection, areaId);
  const { geometry } = area;
  if (geometry.type === "Polygon") {
    if (partIndex !== 0) throw new Error(`Area '${areaId}' has no part ${partIndex}.`);
    return { type: "Polygon", coordinates: geometry.coordinates };
  }
  if (geometry.type !== "MultiPolygon") throw new Error(`Area '${areaId}' has unsupported type '${geometry.type}'.`);
  if (partIndex < 0 || partIndex >= geometry.coordinates.length) throw new Error(`Area '${areaId}' has no part ${partIndex}.`);
  return { type: "Polygon", coordinates: geometry.coordinates[partIndex] };
}

function addFeature(features, { id, geometry, sources, confidence, note }) {
  features.push({
    type: "Feature",
    id,
    properties: { sources, confidence, note },
    geometry
  });
}

function mapAnchors(anchors) {
  return new Map((anchors.anchors ?? []).map((anchor) => [anchor.id, anchor]));
}

function anchorPoint(anchorsById, anchorId) {
  const anchor = anchorsById.get(anchorId);
  if (!anchor) throw new Error(`Missing anchor '${anchorId}'.`);
  return anchor.coordinates;
}

function nearestVertexIndex(line, point) {
  let bestIndex = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < line.length; index += 1) {
    const candidate = line[index];
    const distance = (candidate[0] - point[0]) ** 2 + (candidate[1] - point[1]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function lowerHalysFromTripoint(riverCoordinates, tripoint) {
  if (!Array.isArray(riverCoordinates) || riverCoordinates.length < 2) {
    throw new Error("Lower Halys build received an empty river line.");
  }
  const startIndex = nearestVertexIndex(riverCoordinates, tripoint);
  const toStart = riverCoordinates.slice(0, startIndex + 1).reverse();
  const toEnd = riverCoordinates.slice(startIndex);
  const mouthSide = toStart.at(-1)[1] > toEnd.at(-1)[1] ? toStart : toEnd;
  return [tripoint, ...mouthSide.slice(1)];
}

function meanLatitude(points) {
  if (!Array.isArray(points) || points.length === 0) return 0;
  return points.reduce((sum, point) => sum + point[1], 0) / points.length;
}

function bboxFromPoints(points, { marginLon = 5, marginLat = 5 } = {}) {
  const lons = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  return {
    minLon: Math.min(...lons) - marginLon,
    maxLon: Math.max(...lons) + marginLon,
    minLat: Math.min(...lats) - marginLat,
    maxLat: Math.max(...lats) + marginLat
  };
}

function toLocalPlane(point, phi0Radians) {
  return [point[0] * Math.cos(phi0Radians), point[1]];
}

function toLonLat(point, phi0Radians) {
  const cosPhi0 = Math.cos(phi0Radians);
  if (Math.abs(cosPhi0) < VORONOI_EPSILON) return [point[0], point[1]];
  return [point[0] / cosPhi0, point[1]];
}

function normalizeRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return ring ?? [];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) > VORONOI_EPSILON || Math.abs(first[1] - last[1]) > VORONOI_EPSILON) {
    return [...ring, first];
  }
  return ring;
}

// G0.1: equidistant lines are computed in a local equirectangular plane (x = lon*cos(phi0), y = lat).
function voronoiInsideCellFeatures({ insidePoints, outsidePoints, marginDegrees = 6 }) {
  if (!insidePoints.length || !outsidePoints.length) {
    throw new Error("Voronoi build needs at least one inside and one outside anchor.");
  }
  const allPoints = [...insidePoints, ...outsidePoints];
  const phi0Radians = (meanLatitude(allPoints) * Math.PI) / 180;
  const projected = allPoints.map((point) => toLocalPlane(point, phi0Radians));
  const bboxLonLat = bboxFromPoints(allPoints, { marginLon: marginDegrees, marginLat: marginDegrees });
  const lowerLeft = toLocalPlane([bboxLonLat.minLon, bboxLonLat.minLat], phi0Radians);
  const upperRight = toLocalPlane([bboxLonLat.maxLon, bboxLonLat.maxLat], phi0Radians);
  const delaunay = Delaunay.from(projected);
  const voronoi = delaunay.voronoi([lowerLeft[0], lowerLeft[1], upperRight[0], upperRight[1]]);
  const features = [];
  for (let index = 0; index < insidePoints.length; index += 1) {
    const polygon = voronoi.cellPolygon(index);
    if (!polygon || polygon.length < 4) continue;
    const ring = normalizeRing(polygon.map((point) => toLonLat(point, phi0Radians)));
    features.push(geometryFeature({ type: "Polygon", coordinates: [ring] }));
  }
  return features;
}

async function voronoiInsideMask({ workDirectory, tag, anchorsById, insideAnchorIds, outsideAnchorIds, marginDegrees = 6 }) {
  const insidePoints = insideAnchorIds.map((anchorId) => anchorPoint(anchorsById, anchorId));
  const outsidePoints = outsideAnchorIds.map((anchorId) => anchorPoint(anchorsById, anchorId));
  const cells = voronoiInsideCellFeatures({ insidePoints, outsidePoints, marginDegrees });
  if (cells.length === 0) throw new Error(`${tag}: Voronoi produced no inside cells.`);
  return unionOne({ workDirectory, tag: `${tag}-inside-mask`, features: cells });
}

function selectLandComponentByAnchor(landFeatures, anchorCoordinates) {
  const hit = landFeatures.find((feature) => pointInGeometry(anchorCoordinates, feature.geometry));
  if (!hit) throw new Error(`No Natural Earth land component contains anchor ${JSON.stringify(anchorCoordinates)}.`);
  return hit;
}

function bboxFeatureFromPoints(points, { marginLon = 3, marginLat = 3 } = {}) {
  const box = bboxFromPoints(points, { marginLon, marginLat });
  return geometryFeature({
    type: "Polygon",
    coordinates: [[
      [box.minLon, box.minLat],
      [box.maxLon, box.minLat],
      [box.maxLon, box.maxLat],
      [box.minLon, box.maxLat],
      [box.minLon, box.minLat]
    ]]
  });
}

function normalizedText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/gu, "");
}

function findKizilirmakFeature(...collections) {
  const features = collections.flatMap((collection) => collection?.features ?? []);
  const candidates = features.filter((feature) => /kiz.*rmak/u.test(normalizedText(feature?.properties?.name)));
  if (candidates.length === 0) throw new Error("Could not find Kızılırmak in pinned Natural Earth rivers inputs.");
  const scored = candidates.map((feature) => {
    const lines = feature.geometry?.type === "LineString" ? [feature.geometry.coordinates] : (feature.geometry?.coordinates ?? []);
    const allPoints = lines.flat();
    const minY = Math.min(...allPoints.map((point) => point[1]));
    const maxY = Math.max(...allPoints.map((point) => point[1]));
    return { feature, score: maxY - minY };
  });
  return scored.sort((left, right) => right.score - left.score)[0].feature;
}

function lineLengthSquared(line) {
  let total = 0;
  for (let index = 1; index < line.length; index += 1) {
    const dx = line[index][0] - line[index - 1][0];
    const dy = line[index][1] - line[index - 1][1];
    total += dx * dx + dy * dy;
  }
  return total;
}

function linesFromFeature(feature) {
  if (!feature?.geometry) return [];
  if (feature.geometry.type === "LineString") return [feature.geometry.coordinates];
  if (feature.geometry.type === "MultiLineString") return feature.geometry.coordinates;
  return [];
}

function linesFromCollection(collection) {
  return (collection.features ?? []).flatMap((feature) => linesFromFeature(feature));
}

function pointDistanceKm(a, b) {
  const midLatRad = (((a[1] + b[1]) / 2) * Math.PI) / 180;
  const dx = (b[0] - a[0]) * 111.32 * Math.cos(midLatRad);
  const dy = (b[1] - a[1]) * 110.574;
  return Math.hypot(dx, dy);
}

function findLakeFeatureByName(lakesCollection, matcher) {
  const feature = (lakesCollection.features ?? []).find((candidate) =>
    matcher.test(normalizedText(candidate?.properties?.name ?? candidate?.properties?.name_en))
  );
  if (!feature?.geometry) throw new Error("Could not find the named lake feature in Natural Earth lakes.");
  return feature;
}

function boundaryLinesFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.map((ring) => ring);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon);
  return [];
}

function riverCandidateLines(collection, matcher) {
  return (collection.features ?? [])
    .filter((feature) => matcher(normalizedText(feature?.properties?.name)))
    .flatMap((feature) => linesFromFeature(feature).map((line) => ({ line, feature })));
}

function nearestEndpointPair(lineA, lineB) {
  const endpointsA = [lineA[0], lineA.at(-1)];
  const endpointsB = [lineB[0], lineB.at(-1)];
  let best = null;
  for (const endpointA of endpointsA) {
    for (const endpointB of endpointsB) {
      const distance = (endpointA[0] - endpointB[0]) ** 2 + (endpointA[1] - endpointB[1]) ** 2;
      if (!best || distance < best.distance) best = { endpointA, endpointB, distance };
    }
  }
  return best;
}

function connectLines(lineA, lineB) {
  const pair = nearestEndpointPair(lineA, lineB);
  const orientedA = pair.endpointA === lineA.at(-1) ? lineA : [...lineA].reverse();
  const orientedB = pair.endpointB === lineB[0] ? lineB : [...lineB].reverse();
  return [...orientedA, ...orientedB.slice(1)];
}

function findArasKuraChain(riversMain) {
  const arasCandidates = riverCandidateLines(riversMain, (name) => /(aras|arax)/u.test(name));
  const kuraCandidates = riverCandidateLines(riversMain, (name) => /(kura|cyrus)/u.test(name));
  if (arasCandidates.length === 0) throw new Error("Could not find Aras/Araxes in Natural Earth rivers.");
  if (kuraCandidates.length === 0) throw new Error("Could not find Kura/Cyrus in Natural Earth rivers.");
  const aras = arasCandidates.sort((left, right) => lineLengthSquared(right.line) - lineLengthSquared(left.line))[0].line;
  const kuraLines = kuraCandidates
    .map((entry) => entry.line)
    // Keep the connected lower-Kura chain to the Caspian; short upper tributary fragments
    // (all points north of ~40.5°N in this Natural Earth build) are not part of that chain.
    .filter((line) => Math.min(...line.map((point) => point[1])) <= 40.5);
  const firstKura = [...kuraLines].sort(
    (left, right) => endpointDistanceSquared(aras, left) - endpointDistanceSquared(aras, right)
  )[0];
  const used = new Set([firstKura]);
  let kuraChain = [...firstKura];
  while (used.size < kuraLines.length) {
    const next = kuraLines
      .filter((line) => !used.has(line))
      .map((line) => ({ line, d2: endpointDistanceSquared(kuraChain, line) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.05) break;
    kuraChain = connectLines(kuraChain, next.line);
    used.add(next.line);
  }
  const seaPoint = kuraChain.reduce((best, point) => (point[0] > best[0] ? point : best), kuraChain[0]);
  const confluenceHit = polylineIntersections(aras, kuraChain)[0]?.point;
  const confluence = confluenceHit ?? aras.reduce((best, point) => {
    const nearest = nearestPointOnLine(kuraChain, point);
    if (!best || nearest.d2 < best.d2) return nearest;
    return best;
  }, null).point;
  const kuraToConfluence = sliceLineBetweenPoints(kuraChain, seaPoint, confluence);
  const arasWestEnd = aras.reduce((best, point) => (point[0] < best[0] ? point : best), aras[0]);
  const arasFromConfluence = sliceLineBetweenPoints(aras, confluence, arasWestEnd);
  const oriented = [...kuraToConfluence, ...arasFromConfluence.slice(1)];
  return {
    chain: oriented,
    arasLine: aras,
    kuraLine: kuraToConfluence
  };
}

function pointAtMaxLatitude(line) {
  return [...line].sort((left, right) => right[1] - left[1])[0];
}

function nearestLinePointIndex(line, point) {
  return nearestVertexIndex(line, point);
}

function sliceLineByIndices(line, startIndex, endIndex) {
  if (startIndex <= endIndex) return line.slice(startIndex, endIndex + 1);
  return [...line.slice(endIndex, startIndex + 1)].reverse();
}

function riverTrunkByName(riversMain, pattern) {
  const candidates = riverCandidateLines(riversMain, (name) => pattern.test(name));
  if (candidates.length === 0) throw new Error(`Could not find river trunk for pattern ${pattern}.`);
  return candidates.sort((left, right) => lineLengthSquared(right.line) - lineLengthSquared(left.line))[0].line;
}

function endpointDistanceSquared(lineA, lineB) {
  const a = [lineA[0], lineA.at(-1)];
  const b = [lineB[0], lineB.at(-1)];
  let best = Infinity;
  for (const pa of a) {
    for (const pb of b) {
      const d = (pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2;
      if (d < best) best = d;
    }
  }
  return best;
}

function nearestPointDistanceSquared(line, point) {
  let best = Infinity;
  for (const vertex of line) {
    const d = (vertex[0] - point[0]) ** 2 + (vertex[1] - point[1]) ** 2;
    if (d < best) best = d;
  }
  return best;
}

function orientLineFromNearPoint(line, point) {
  const startDistance = (line[0][0] - point[0]) ** 2 + (line[0][1] - point[1]) ** 2;
  const endDistance = (line.at(-1)[0] - point[0]) ** 2 + (line.at(-1)[1] - point[1]) ** 2;
  return startDistance <= endDistance ? line : [...line].reverse();
}

function stitchNamedRiverChain(riversMain, pattern, anchorCoordinates) {
  const candidates = riverCandidateLines(riversMain, (name) => pattern.test(name)).map((entry) => entry.line);
  if (candidates.length === 0) throw new Error(`Could not find named river segments for ${pattern}.`);
  const ordered = [...candidates].sort(
    (left, right) => nearestPointDistanceSquared(left, anchorCoordinates) - nearestPointDistanceSquared(right, anchorCoordinates)
  );
  const used = new Set();
  let chain = orientLineFromNearPoint(ordered[0], anchorCoordinates);
  used.add(ordered[0]);
  while (used.size < candidates.length) {
    const next = candidates
      .filter((candidate) => !used.has(candidate))
      .map((candidate) => ({ candidate, d2: endpointDistanceSquared(chain, candidate) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.2) break;
    const stitched = connectLines(chain, next.candidate);
    chain = stitched;
    used.add(next.candidate);
  }
  return chain;
}

function stitchEmpireEdgeChain(empireEdgeCollection, anchorCoordinates) {
  const lines = linesFromCollection(empireEdgeCollection);
  if (lines.length === 0) throw new Error("Ancient empire edge has no lines.");
  const ordered = [...lines].sort(
    (left, right) => nearestPointDistanceSquared(left, anchorCoordinates) - nearestPointDistanceSquared(right, anchorCoordinates)
  );
  const used = new Set();
  let chain = orientLineFromNearPoint(ordered[0], anchorCoordinates);
  used.add(ordered[0]);
  while (used.size < lines.length) {
    const next = lines
      .filter((candidate) => !used.has(candidate))
      .map((candidate) => ({ candidate, d2: endpointDistanceSquared(chain, candidate) }))
      .sort((left, right) => left.d2 - right.d2)[0];
    if (!next || next.d2 > 0.2) break;
    chain = connectLines(chain, next.candidate);
    used.add(next.candidate);
  }
  return chain;
}

function nearestPointOnSegment(point, start, end) {
  const latRadians = (point[1] * Math.PI) / 180;
  const projectKm = ([lon, lat]) => [
    (lon - point[0]) * 111.32 * Math.cos(latRadians),
    (lat - point[1]) * 110.574
  ];
  const a = projectKm(start);
  const b = projectKm(end);
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = -a[0];
  const wy = -a[1];
  const denominator = vx * vx + vy * vy;
  const t = denominator < VORONOI_EPSILON ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / denominator));
  return [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1]), t];
}

function nearestPointOnLine(line, point) {
  let best = null;
  for (let index = 1; index < line.length; index += 1) {
    const [lon, lat, t] = nearestPointOnSegment(point, line[index - 1], line[index]);
    const d2 = (lon - point[0]) ** 2 + (lat - point[1]) ** 2;
    if (!best || d2 < best.d2) {
      best = { point: [lon, lat], segmentIndex: index - 1, t, d2 };
    }
  }
  if (!best) return { point: line[0], segmentIndex: 0, t: 0, d2: 0 };
  return best;
}

function insertPointOnLine(line, insertion) {
  const out = [];
  for (let index = 0; index < line.length; index += 1) {
    out.push(line[index]);
    if (index === insertion.segmentIndex) {
      const last = out.at(-1);
      if (Math.abs(last[0] - insertion.point[0]) > VORONOI_EPSILON || Math.abs(last[1] - insertion.point[1]) > VORONOI_EPSILON) {
        out.push(insertion.point);
      }
    }
  }
  return out;
}

function sliceLineBetweenPoints(line, start, end) {
  const startNearest = nearestPointOnLine(line, start);
  const endNearest = nearestPointOnLine(line, end);
  const withStart = insertPointOnLine(line, startNearest);
  const startIndex = withStart.findIndex(
    (point) => Math.abs(point[0] - startNearest.point[0]) < VORONOI_EPSILON && Math.abs(point[1] - startNearest.point[1]) < VORONOI_EPSILON
  );
  const endNearestAdjusted = nearestPointOnLine(withStart, endNearest.point);
  const withBoth = insertPointOnLine(withStart, endNearestAdjusted);
  const startIndexFinal = withBoth.findIndex(
    (point) => Math.abs(point[0] - startNearest.point[0]) < VORONOI_EPSILON && Math.abs(point[1] - startNearest.point[1]) < VORONOI_EPSILON
  );
  const endIndexFinal = withBoth.findIndex(
    (point) => Math.abs(point[0] - endNearest.point[0]) < VORONOI_EPSILON && Math.abs(point[1] - endNearest.point[1]) < VORONOI_EPSILON
  );
  if (startIndexFinal <= endIndexFinal) return withBoth.slice(startIndexFinal, endIndexFinal + 1);
  return [...withBoth.slice(endIndexFinal, startIndexFinal + 1)].reverse();
}

function segmentIntersection(a1, a2, b1, b2) {
  const denominator = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0]);
  if (Math.abs(denominator) < VORONOI_EPSILON) return null;
  const numeratorA = a1[0] * a2[1] - a1[1] * a2[0];
  const numeratorB = b1[0] * b2[1] - b1[1] * b2[0];
  const x = (numeratorA * (b1[0] - b2[0]) - (a1[0] - a2[0]) * numeratorB) / denominator;
  const y = (numeratorA * (b1[1] - b2[1]) - (a1[1] - a2[1]) * numeratorB) / denominator;
  const within = (value, left, right) => value >= Math.min(left, right) - 1e-8 && value <= Math.max(left, right) + 1e-8;
  if (!within(x, a1[0], a2[0]) || !within(y, a1[1], a2[1])) return null;
  if (!within(x, b1[0], b2[0]) || !within(y, b1[1], b2[1])) return null;
  return [x, y];
}

function polylineIntersections(lineA, lineB) {
  const intersections = [];
  for (let i = 1; i < lineA.length; i += 1) {
    for (let j = 1; j < lineB.length; j += 1) {
      const hit = segmentIntersection(lineA[i - 1], lineA[i], lineB[j - 1], lineB[j]);
      if (!hit) continue;
      intersections.push({ point: hit, segmentA: i - 1, segmentB: j - 1 });
    }
  }
  return intersections;
}

function eastOfSegmentMask(start, end, extent = 30) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  const ux = dx / Math.max(length, VORONOI_EPSILON);
  const uy = dy / Math.max(length, VORONOI_EPSILON);
  const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const eastReference = [Math.max(start[0], end[0]) + 2, mid[1]];
  const normals = [
    [uy, -ux],
    [-uy, ux]
  ];
  const { candidateX: nx, candidateY: ny } = normals
    .map(([candidateX, candidateY]) => ({
      candidateX,
      candidateY,
      score: (eastReference[0] - mid[0]) * candidateX + (eastReference[1] - mid[1]) * candidateY
    }))
    .sort((left, right) => right.score - left.score)[0];
  const a = [start[0] - ux * extent, start[1] - uy * extent];
  const b = [end[0] + ux * extent, end[1] + uy * extent];
  const c = [b[0] + nx * extent, b[1] + ny * extent];
  const d = [a[0] + nx * extent, a[1] + ny * extent];
  return geometryFeature({ type: "Polygon", coordinates: [[a, b, c, d, a]] });
}

function southOfLineMask(line, margin = 6) {
  const ordered = line[0][0] <= line.at(-1)[0] ? line : [...line].reverse();
  const lons = ordered.map((point) => point[0]);
  const lats = ordered.map((point) => point[1]);
  const minLon = Math.min(...lons) - margin;
  const maxLon = Math.max(...lons) + margin;
  const minLat = Math.min(...lats) - margin;
  const ring = normalizeRing([
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, ordered.at(-1)[1]],
    ...[...ordered].reverse(),
    [minLon, ordered[0][1]]
  ]);
  return geometryFeature({ type: "Polygon", coordinates: [ring] });
}

function northOfLineMask(line, margin = 6) {
  const ordered = line[0][0] <= line.at(-1)[0] ? line : [...line].reverse();
  const lons = ordered.map((point) => point[0]);
  const lats = ordered.map((point) => point[1]);
  const minLon = Math.min(...lons) - margin;
  const maxLon = Math.max(...lons) + margin;
  const maxLat = Math.max(...lats) + margin;
  const ring = normalizeRing([
    [minLon, maxLat],
    [maxLon, maxLat],
    [maxLon, ordered.at(-1)[1]],
    ...[...ordered].reverse(),
    [minLon, ordered[0][1]]
  ]);
  return geometryFeature({ type: "Polygon", coordinates: [ring] });
}

function sideQuadsFromLine(line, { side = "right", extentDegrees = 8 } = {}) {
  const quads = [];
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1];
    const end = line[index];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    if (length < VORONOI_EPSILON) continue;
    const rightNormal = [dy / length, -dx / length];
    const normal = side === "right" ? rightNormal : [-rightNormal[0], -rightNormal[1]];
    const offsetStart = [start[0] + normal[0] * extentDegrees, start[1] + normal[1] * extentDegrees];
    const offsetEnd = [end[0] + normal[0] * extentDegrees, end[1] + normal[1] * extentDegrees];
    quads.push(
      geometryFeature({
        type: "Polygon",
        coordinates: [[start, end, offsetEnd, offsetStart, start]]
      })
    );
  }
  return quads;
}

function ringPathsBetweenPoints(ring, start, end) {
  const startNearest = nearestPointOnLine(ring, start);
  const withStart = insertPointOnLine(ring, startNearest);
  const endNearest = nearestPointOnLine(withStart, end);
  const withBoth = insertPointOnLine(withStart, endNearest);
  const openRing = withBoth.length > 1
    && Math.abs(withBoth[0][0] - withBoth.at(-1)[0]) < VORONOI_EPSILON
    && Math.abs(withBoth[0][1] - withBoth.at(-1)[1]) < VORONOI_EPSILON
    ? withBoth.slice(0, -1)
    : withBoth;
  const startIndex = openRing.findIndex(
    (point) => Math.abs(point[0] - startNearest.point[0]) < VORONOI_EPSILON && Math.abs(point[1] - startNearest.point[1]) < VORONOI_EPSILON
  );
  const endIndex = openRing.findIndex(
    (point) => Math.abs(point[0] - endNearest.point[0]) < VORONOI_EPSILON && Math.abs(point[1] - endNearest.point[1]) < VORONOI_EPSILON
  );
  const n = openRing.length;
  const nextIndex = (index) => (index + 1) % n;
  const prevIndex = (index) => (index - 1 + n) % n;
  const walk = (stepper) => {
    const out = [openRing[startIndex]];
    let cursor = startIndex;
    let safety = 0;
    while (cursor !== endIndex && safety <= n + 2) {
      cursor = stepper(cursor);
      out.push(openRing[cursor]);
      safety += 1;
    }
    return out;
  };
  const forward = walk(nextIndex);
  const reverse = walk(prevIndex);
  return { forward, reverse };
}

function meanLatitudeOfLine(line) {
  return line.reduce((sum, point) => sum + point[1], 0) / Math.max(line.length, 1);
}

function maxLatitudeOfLine(line) {
  return line.reduce((max, point) => Math.max(max, point[1]), -Infinity);
}

function squaredProjectedDistance(point, anchor, cosPhi) {
  const dx = (point[0] - anchor[0]) * cosPhi;
  const dy = point[1] - anchor[1];
  return dx * dx + dy * dy;
}

function equidistantDifference(point, { insideAnchors, outsideAnchor, cosPhi }) {
  const outside = squaredProjectedDistance(point, outsideAnchor, cosPhi);
  const inside = Math.min(...insideAnchors.map((anchor) => squaredProjectedDistance(point, anchor, cosPhi)));
  return outside - inside;
}

function solveEquidistantLatitudeAtLongitude(lon, options) {
  const { minLat = 36, maxLat = 40.5 } = options;
  let lower = minLat;
  let upper = maxLat;
  let fLower = equidistantDifference([lon, lower], options);
  let fUpper = equidistantDifference([lon, upper], options);
  if (fLower * fUpper > 0) {
    let found = false;
    const step = 0.05;
    for (let start = minLat; start < maxLat; start += step) {
      const end = Math.min(maxLat, start + step);
      const fStart = equidistantDifference([lon, start], options);
      const fEnd = equidistantDifference([lon, end], options);
      if (fStart === 0) return start;
      if (fStart * fEnd <= 0) {
        lower = start;
        upper = end;
        fLower = fStart;
        fUpper = fEnd;
        found = true;
        break;
      }
    }
    if (!found) return null;
  }
  for (let iteration = 0; iteration < 32; iteration += 1) {
    const mid = (lower + upper) / 2;
    const fMid = equidistantDifference([lon, mid], options);
    if (Math.abs(fMid) < 1e-12) return mid;
    if (fLower * fMid <= 0) {
      upper = mid;
      fUpper = fMid;
    } else {
      lower = mid;
      fLower = fMid;
    }
  }
  return (lower + upper) / 2;
}

function riverEquidistantCrossings(line, options) {
  const hits = [];
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1];
    const end = line[index];
    let fStart = equidistantDifference(start, options);
    let fEnd = equidistantDifference(end, options);
    if (fStart === 0) hits.push({ point: start, segmentIndex: index - 1, t: 0 });
    if (fStart * fEnd > 0) continue;
    let low = 0;
    let high = 1;
    for (let iteration = 0; iteration < 32; iteration += 1) {
      const mid = (low + high) / 2;
      const point = [start[0] + (end[0] - start[0]) * mid, start[1] + (end[1] - start[1]) * mid];
      const fMid = equidistantDifference(point, options);
      if (Math.abs(fMid) < 1e-12) {
        low = mid;
        high = mid;
        break;
      }
      if (fStart * fMid <= 0) {
        high = mid;
        fEnd = fMid;
      } else {
        low = mid;
        fStart = fMid;
      }
    }
    const t = (low + high) / 2;
    const hit = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
    hits.push({ point: hit, segmentIndex: index - 1, t });
  }
  return hits;
}

function featureFromLine(line, properties = {}) {
  return geometryFeature({ type: "LineString", coordinates: line }, properties);
}

function partCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") return 1;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.length;
  return 0;
}

function coastlineLinesFromLandFeatures(landFeatures) {
  const lines = [];
  for (const feature of landFeatures ?? []) {
    for (const polygon of polygonsOf(feature.geometry)) {
      const outer = polygon?.[0];
      if (Array.isArray(outer) && outer.length >= 2) lines.push(outer);
    }
  }
  return lines;
}

function polygonCentroidApprox(polygon) {
  const ring = polygon?.[0] ?? [];
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let sumLon = 0;
  let sumLat = 0;
  let count = 0;
  for (const point of ring) {
    sumLon += point[0];
    sumLat += point[1];
    count += 1;
  }
  return count > 0 ? [sumLon / count, sumLat / count] : null;
}

function minimumDistanceToLinesKm(point, lines) {
  let minimum = Infinity;
  for (const line of lines) {
    for (let index = 1; index < line.length; index += 1) {
      minimum = Math.min(minimum, distancePointToSegmentKm(point, line[index - 1], line[index]));
    }
  }
  return minimum;
}

function polygonTouchesCoastlineWithinKm(polygon, coastlineLines, limitKm) {
  const ring = polygon?.[0] ?? [];
  if (!Array.isArray(ring) || ring.length < 2) return false;
  for (let index = 1; index < ring.length; index += 1) {
    const start = ring[index - 1];
    const end = ring[index];
    const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    if (minimumDistanceToLinesKm(start, coastlineLines) <= limitKm) return true;
    if (minimumDistanceToLinesKm(midpoint, coastlineLines) <= limitKm) return true;
  }
  return false;
}

function translatePolygon(polygon, deltaLon, deltaLat) {
  return (polygon ?? []).map((ring) => (ring ?? []).map(([lon, lat]) => [lon + deltaLon, lat + deltaLat]));
}

function seededInlandDropEntry(referenceEntry) {
  return {
    ...referenceEntry,
    polygon: translatePolygon(referenceEntry.polygon, 2, 0),
    areaKm2: referenceEntry.areaKm2
  };
}

async function overlapAreaKm2ForPolygon({ polygon, drawnAreaFeatures, workDirectory, tag }) {
  const overlaps = await booleanOp({
    workDirectory,
    tag,
    operation: "clip",
    subjectFeatures: [geometryFeature({ type: "Polygon", coordinates: polygon })],
    maskFeatures: drawnAreaFeatures
  });
  return totalAreaKm2(overlaps);
}

async function validateLycaoniaDroppedParts({ featureId, dropped, coastlineLines, drawnAreaFeatures, seededError = null, workDirectory }) {
  if (featureId !== "lycaonia" || dropped.length === 0) return;
  const candidates = seededError === "lycaonia-drop-inland"
    ? dropped.map((entry, index) => (index === 0 ? seededInlandDropEntry(entry) : entry))
    : dropped;
  const totalAreaKm2 = candidates.reduce((sum, entry) => sum + entry.areaKm2, 0);
  if (totalAreaKm2 > LYCAONIA_DROPPED_PARTS_MAX_TOTAL_KM2) {
    throw new Error(
      `lycaonia: dropped detached parts total ${totalAreaKm2.toFixed(3)} km² (> ${LYCAONIA_DROPPED_PARTS_MAX_TOTAL_KM2.toFixed(3)} km² ceiling).`
    );
  }
  for (let index = 0; index < candidates.length; index += 1) {
    const entry = candidates[index];
    const centroid = polygonCentroidApprox(entry.polygon);
    const coastTouch = polygonTouchesCoastlineWithinKm(entry.polygon, coastlineLines, 0.3);
    const overlapKm2 = await overlapAreaKm2ForPolygon({
      polygon: entry.polygon,
      drawnAreaFeatures,
      workDirectory,
      tag: `lycaonia-dropped-overlap-${index}`
    });
    const outsideDrawnAreas = overlapKm2 <= LYCAONIA_DROPPED_PART_MAX_DRAWN_OVERLAP_KM2;
    const centroidText = centroid ? `${centroid[0].toFixed(5)}, ${centroid[1].toFixed(5)}` : "unknown";
    console.warn(
      `lycaonia: dropped part ${entry.areaKm2.toFixed(3)} km² at centroid (${centroidText}); coastal-touch=${coastTouch}; overlap-with-drawn-areas=${overlapKm2.toFixed(3)} km².`
    );
    if (!coastTouch) {
      throw new Error(`lycaonia: dropped detached part ${entry.areaKm2.toFixed(3)} km² does not touch Natural Earth coastline within 0.3 km.`);
    }
    if (!outsideDrawnAreas) {
      throw new Error(
        `lycaonia: dropped detached part ${entry.areaKm2.toFixed(3)} km² overlaps drawn areas by ${overlapKm2.toFixed(3)} km² (> ${LYCAONIA_DROPPED_PART_MAX_DRAWN_OVERLAP_KM2.toFixed(3)} km²).`
      );
    }
  }
}

async function pruneSmallParts(feature, { coastlineLines, drawnAreaFeatures, seededError = null, workDirectory } = {}) {
  if (ISLAND_REGION_IDS.has(feature.id)) return feature;
  const polygons = polygonsOf(feature.geometry);
  if (polygons.length <= 1) return feature;
  const measured = polygons.map((polygon) => ({
    polygon,
    areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon })
  }));
  const kept = measured
    .filter((entry) => entry.areaKm2 >= MIN_NON_ISLAND_PART_KM2)
    .map((entry) => entry.polygon);
  if (kept.length === 0) {
    throw new Error(`${feature.id}: removing parts under ${MIN_NON_ISLAND_PART_KM2} km² removed the entire geometry.`);
  }
  const dominant = kept
    .map((polygon) => ({ polygon, areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon }) }))
    .sort((left, right) => right.areaKm2 - left.areaKm2);
  const dropped = dominant.slice(1);
  if (dropped.length > 0) {
    const droppedSummary = dropped.map((entry) => entry.areaKm2.toFixed(3)).join(", ");
    console.warn(`${feature.id}: dropping ${dropped.length} detached part(s) after simplification (${droppedSummary} km²).`);
    if (feature.id === "lycaonia") {
      await validateLycaoniaDroppedParts({
        featureId: feature.id,
        dropped,
        coastlineLines: coastlineLines ?? [],
        drawnAreaFeatures: drawnAreaFeatures ?? [],
        seededError,
        workDirectory
      });
    }
    const allowed = ALLOWED_DROPPED_ISLAND_PARTS[feature.id] ?? [];
    if (allowed.length > 0) {
      console.warn(
        `${feature.id}: allowed dropped island exceptions: ${allowed
          .map((island) => `${island.name} <= ${island.maxAreaKm2} km²`)
          .join("; ")}.`
      );
    }
    const largeDrop = feature.id === "lycaonia"
      ? null
      : dropped.find((entry) => {
        if (entry.areaKm2 < MIN_NON_ISLAND_PART_KM2) return false;
        return !allowed.some((island) => entry.areaKm2 <= island.maxAreaKm2);
      });
    if (largeDrop) {
      throw new Error(`${feature.id}: dropped detached part ${largeDrop.areaKm2.toFixed(3)} km² (>= ${MIN_NON_ISLAND_PART_KM2} km²); refusing silent geometry loss.`);
    }
  }
  const selected = dominant.length > 1 ? [dominant[0].polygon] : kept;
  const geometry = selected.length === 1
    ? { type: "Polygon", coordinates: selected[0] }
    : { type: "MultiPolygon", coordinates: selected };
  return { ...feature, geometry };
}

function largestPolygonOnly(feature) {
  const polygons = polygonsOf(feature.geometry);
  if (polygons.length <= 1) return feature;
  const largest = polygons
    .map((polygon) => ({ polygon, areaKm2: geometryAreaKm2({ type: "Polygon", coordinates: polygon }) }))
    .sort((left, right) => right.areaKm2 - left.areaKm2)[0];
  return { ...feature, geometry: { type: "Polygon", coordinates: largest.polygon } };
}

function simplifyMetresByRegion(regionId) {
  // 25 m for Levant neighbours that share one synthetic split line; this keeps that seam
  // visually stable while preserving precise coastline/river turns near each anchor.
  if (regionId === "galilee") return 25;
  if (regionId === "samaria") return 25;
  if (regionId === "judea") return 25;
  if (regionId === "pisidia") return 150;
  if (regionId === "lycaonia") return 150;
  if (regionId === "mysia") return 100;
  if (regionId === "phrygia") return 150;
  if (regionId === "media") return 200;
  if (regionId === "mesopotamia") return 150;
  // 600 m for the rest: island extracts are already coarse from area parts, and Pontus follows
  // long coast/river stretches where this tolerance keeps gzip size within the lazy-load cap.
  if (regionId === "pontus") return 600;
  return 600;
}

async function simplifyCollection({ workDirectory, collection }) {
  const inputPath = path.join(workDirectory, "region-outlines-raw.geojson");
  const outputPath = path.join(workDirectory, "region-outlines-simplified.geojson");
  const withTolerance = featureCollection(
    (collection.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        simplifyMetres: simplifyMetresByRegion(feature.id)
      }
    }))
  );
  await writeJson(inputPath, withTolerance);
  await mapshaper.runCommands(
    `-i ${inputPath} -simplify dp variable interval="simplifyMetres" keep-shapes -o format=geojson precision=${OUTPUT_PRECISION} ${outputPath}`
  );
  const simplified = JSON.parse(await fs.readFile(outputPath, "utf8"));
  for (const feature of simplified.features ?? []) {
    if (feature?.properties) delete feature.properties.simplifyMetres;
  }
  return simplified;
}

export async function buildRegionOutlinesData({ writeOutput = false, seededError = null } = {}) {
  const workDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-region-outlines-"));
  try {
    const areas = JSON.parse(await fs.readFile(areasPath, "utf8"));
    const anchors = JSON.parse(await fs.readFile(anchorsPath, "utf8"));
    const anchorsById = mapAnchors(anchors);

    const cache = ancientGeoCache();
    const inputFiles = await fetchPinnedInputs(cache.inputs);
    const naturalEarthLand = await readJsonFile(inputFiles.naturalEarthLand);
    const naturalEarthRiversMain = await readJsonFile(inputFiles.naturalEarthRiversMain);
    const naturalEarthRiversEurope = await readJsonFile(inputFiles.naturalEarthRiversEurope);
    const naturalEarthLakes = await readJsonFile(inputFiles.naturalEarthLakes);
    const empireEdge = await readJsonFile(empireEdgePath);
    const gazaFaceSource = await readJsonFile(gazaFacePath);
    const landMask = (naturalEarthLand.features ?? []).filter((feature) => feature.geometry);
    const coastlineLines = coastlineLinesFromLandFeatures(landMask);

    const features = [];
    const m520Diagnostics = {};
    const allowedInputGeometries = [];
    const allowInput = (kind, geometry, meta = {}) => {
      if (!geometry) return;
      allowedInputGeometries.push({ kind, geometry, ...meta });
    };
    for (const feature of areas.features ?? []) allowInput("area-edge", feature.geometry);
    for (const feature of landMask) allowInput("ne-land", feature.geometry);

    // Unchanged region/part extractions.
    addFeature(features, {
      id: "galilee",
      geometry: polygonPart(areas, "galilee-perea", 0),
      sources: ["bib:josephus-jewish-war", "wikidata:Q185318", "wikidata:Q374748", "pleiades:678163", "pleiades:678378", "bib:isbe-en-gannim", "osm:relation/2246907"],
      confidence: "medium",
      note: "Galilee as Josephus bounds it (Jewish War 3.3.1): Ptolemais's territory and Mount Carmel to the west, Samaria and Scythopolis to the south, the Jordan and the lake to the east, and Tyre's country to the north. Josephus says Carmel 'had formerly belonged to the Galileans, but now belonged to the Tyrians'. The edges are approximate. The line runs through the eastern end of Carmel, through Ginea and Scythopolis, and includes the north-east Jordan strip from this project's Herodian-area build where Josephus gives no exact line. It takes the western half of the Sea of Galilee."
    });
    addFeature(features, {
      id: "crete",
      geometry: polygonPart(areas, "crete-cyrene", 0),
      sources: ["bib:strabo-geography", "bib:isbe-crete", "pleiades:589748"],
      confidence: "high",
      note: "Extracted whole from crete-cyrene part 0; Cauda is excluded."
    });
    addFeature(features, {
      id: "libya",
      geometry: polygonPart(areas, "crete-cyrene", 1),
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-libya", "bib:isbe-cyrene", "pleiades:373777", "pleiades:363959", "pleiades:363924", "scripture:Acts 2:10"],
      confidence: "medium",
      note: "Cyrenaica, 'the parts of Libya around Cyrene' (Acts 2:10), as this project's AD 69 area draws it. Its west edge meets the coast of the Great Syrtis 158 km east of the Euphrantas Tower (Euphranta, modern Sirte), which Strabo gives as the boundary 'as it was under Ptolemy' (17.3.20), and 79 km west of the Altars of the Philaeni, which Strabo and Pliny (5.4) name at the head of the gulf. No source this project cites gives the first-century line, so the west, desert and east edges are approximate."
    });
    addFeature(features, { id: "chios", geometry: polygonPart(areas, "asia", 2), sources: ["bib:strabo-geography", "bib:isbe-chios"], confidence: "high", note: "Extracted whole from asia part 2." });
    addFeature(features, { id: "cos", geometry: polygonPart(areas, "asia", 4), sources: ["bib:strabo-geography", "bib:isbe-cos"], confidence: "high", note: "Extracted whole from asia part 4." });
    addFeature(features, { id: "malta", geometry: polygonPart(areas, "sicily", 1), sources: ["bib:pliny-natural-history", "bib:hmml-contesting-shipwreck", "pleiades:462311"], confidence: "high", note: "Extracted whole from sicily part 1 (Malta only; Mljet remains the low-confidence candidate)." });
    addFeature(features, { id: "rhodes", geometry: polygonPart(areas, "asia", 5), sources: ["bib:strabo-geography", "bib:isbe-rhodes"], confidence: "high", note: "Extracted whole from asia part 5." });
    addFeature(features, { id: "samos", geometry: polygonPart(areas, "asia", 1), sources: ["bib:strabo-geography", "bib:isbe-samos"], confidence: "high", note: "Extracted whole from asia part 1." });

    // Samaria + Judea from existing area edges + G1.1 line + Gaza-Rhinocolura exclusion.
    const judeaSamariaIdumea = areaById(areas, "judea-samaria-idumea");
    const gazaFaceFeatures = geometriesAsFeatures(gazaFaceSource);
    if (gazaFaceFeatures.length === 0) throw new Error("Missing gaza-rhinocolura-face source geometry.");
    for (const feature of gazaFaceFeatures) allowInput("m5-19-gaza-face", feature.geometry);
    const [minX, , maxX, maxY] = bbox(judeaSamariaIdumea.geometry);
    const g11Line = [
      [minX - 1, 32.0954],
      anchorPoint(anchorsById, "anouath-borkeos"),
      [35.3125, 32.1704],
      [maxX + 1, 32.1704]
    ];
    allowInput("m5-19-g11-line", { type: "LineString", coordinates: g11Line });
    const g11NorthMask = geometryFeature({
      type: "Polygon",
      coordinates: [[
        ...g11Line,
        [maxX + 2, maxY + 2],
        [minX - 2, maxY + 2],
        g11Line[0]
      ]]
    });
    const westClip = await booleanOpStrict({
      workDirectory,
      tag: "samaria-judea-west",
      operation: "clip",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: [g11NorthMask],
      expectAreaChangeKm2: 1
    });
    const westErase = await booleanOpStrict({
      workDirectory,
      tag: "samaria-judea-east",
      operation: "erase",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: [g11NorthMask],
      expectAreaChangeKm2: 1
    });
    const samariaPieces = westClip.some((feature) => pointInGeometry(anchorPoint(anchorsById, "samaria-point"), feature.geometry)) ? westClip : westErase;
    const judeaPiecesRaw = samariaPieces === westClip ? westErase : westClip;
    if (!samariaPieces.some((feature) => pointInGeometry(anchorPoint(anchorsById, "samaria-point"), feature.geometry))) {
      throw new Error("Samaria/Judea split failed: the Samaria anchor is not inside the Samaria side.");
    }
    if (!judeaPiecesRaw.some((feature) => pointInGeometry(anchorPoint(anchorsById, "akrabatta"), feature.geometry))) {
      throw new Error("Samaria/Judea split failed: Akrabatta is not inside the Judea side.");
    }
    const gazaFaceInArea = await booleanOpStrict({
      workDirectory,
      tag: "gaza-rhinocolura-face-from-ad69",
      operation: "clip",
      subjectFeatures: [judeaSamariaIdumea],
      maskFeatures: gazaFaceFeatures,
      expectAreaChangeKm2: 1
    });
    const judeaPieces = await booleanOpStrict({
      workDirectory,
      tag: "judea-minus-gaza-face",
      operation: "erase",
      subjectFeatures: judeaPiecesRaw,
      maskFeatures: gazaFaceInArea,
      expectAreaChangeKm2: 1
    });
    const samaria = await unionOne({ workDirectory, tag: "samaria-union", features: samariaPieces });
    const judea = await unionOne({ workDirectory, tag: "judea-union", features: judeaPieces });
    addFeature(features, {
      id: "samaria",
      geometry: samaria.geometry,
      sources: ["bib:josephus-jewish-war", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403", "pleiades:678163", "pleiades:678378", "wikidata:Q374748", "wikidata:Q185318", "bib:isbe-en-gannim", "osm:relation/2246907"],
      confidence: "medium",
      note: "Samaria, which Josephus says 'begins at a village...called Ginea, and ends at the Acrabbene toparchy' (Jewish War 3.3.4). Its south edge runs through Anouath Borkeos, 'the northern boundary of Judea' (3.3.5), and north of Akraba (Acrabatta), a toparchy that both Josephus and Pliny count in Judea; between those places the line is approximate. The coast is split with Judea on that line as a convention: Josephus gives Judea's breadth from the Jordan to Joppa and says its maritime places reach Ptolemais, while Pliny calls the coast from Ascalon to Caesarea 'the region of Samaria' but lists Joppa among Judea's toparchies (Natural History 5.14-15)."
    });
    addFeature(features, {
      id: "judea",
      geometry: judea.geometry,
      sources: ["bib:josephus-jewish-war", "bib:josephus-antiquities", "bib:pliny-natural-history", "pleiades:687825", "pleiades:687820", "pleiades:678403", "awmc:ad69-face-raw-0001", "osm:relation/2246907"],
      confidence: "medium",
      note: "Judea as Josephus describes it (Jewish War 3.3.5), with Idumea, which he counts among Judea's portions; Pliny counts Idumea separately (Natural History 5.14–15). Its north edge, shared with Samaria, runs through Anouath Borkeos and north of Akraba (Acrabatta), and is approximate. The coast is split with Samaria along that line, a convention neither author states: Josephus gives Judea's breadth from the Jordan to Joppa and says its maritime places reach Ptolemais, while Pliny calls the coast from Ascalon to Caesarea 'the region of Samaria' but lists Joppa among Judea's toparchies (5.14–15). The coast from Raphia to Rhinocolura is left out: Pliny places those towns and Gaza in Idumaea and Palaestina, and Josephus says Augustus added Gaza to Syria (Antiquities 17.11.4). The districts of Gaza and of Ascalon, which Pliny calls a free town, aren't drawn separately and lie inside this outline."
    });

    // Pontus option A: pontus union bithynia east of lower Halys (Kızılırmak) downstream to mouth.
    const pontusArea = areaById(areas, "pontus");
    const bithyniaArea = areaById(areas, "bithynia");
    const kizilirmak = findKizilirmakFeature(naturalEarthRiversMain);
    const riverCoordinates = kizilirmak.geometry?.type === "LineString"
      ? kizilirmak.geometry.coordinates
      : (kizilirmak.geometry?.coordinates?.[0] ?? []);
    const halysLine = lowerHalysFromTripoint(riverCoordinates, [35.621, 41.287]);
    allowInput("m5-19-pontus-halys", { type: "LineString", coordinates: halysLine });
    const halysMouth = pointAtMaxLatitude(halysLine);
    const eastMask = geometryFeature({
      type: "Polygon",
      coordinates: [[
        [35.621, 41.287],
        ...halysLine.slice(1),
        [halysMouth[0], 43.5],
        [42.5, 43.5],
        [42.5, 40.5],
        [35.621, 40.5],
        [35.621, 41.287]
      ]]
    });
    const eastPiece = await booleanOpStrict({
      workDirectory,
      tag: "pontus-bithynia-halys-east",
      operation: "clip",
      subjectFeatures: [bithyniaArea],
      maskFeatures: [eastMask],
      expectAreaChangeKm2: 1
    });
    const pontusUnion = await unionOne({
      workDirectory,
      tag: "pontus-option-a",
      features: [pontusArea, ...eastPiece]
    });
    addFeature(features, {
      id: "pontus",
      geometry: pontusUnion.geometry,
      sources: ["bib:strabo-geography", "bib:isbe-pontus", "bib:isbe-galatia", "pleiades:857024", "pleiades:857350", "naturalearth:ne-10m-rivers-lake-centerlines"],
      confidence: "medium",
      note: "The kingdom of Pontus, including Pontus Galaticus and Lesser Armenia as this project's Pontus area draws them, since no source draws a line between these lands, plus the coast east of the lower Halys with Amisus and Themiscyra (Strabo 12.3.9; ISBE, 'Pontus'). The west cut follows Natural Earth's Kızılırmak line from the 35.621°E, 41.287°N tripoint downstream; one short straight segment ties the tripoint to the first river vertex, and a second runs north to the sea where the river line ends."
    });

    const asiaMainland = selectLandComponentByAnchor(landMask, anchorPoint(anchorsById, "pergamum"));
    const mesopotamiaLand = selectLandComponentByAnchor(landMask, anchorPoint(anchorsById, "edessa"));
    const mediaLand = selectLandComponentByAnchor(landMask, anchorPoint(anchorsById, "ecbatana"));
    const lakeTuz = findLakeFeatureByName(naturalEarthLakes, /^(lake)?tuz$/u);
    for (const ring of boundaryLinesFromGeometry(lakeTuz.geometry)) {
      allowInput("ne-lake-slice", { type: "LineString", coordinates: ring }, { source: "lake-tuz" });
    }

    async function unionLabelCells({ groupVoronoi, label, tag }) {
      const featuresForLabel = [...groupVoronoi.labelsByAnchorId.entries()]
        .filter(([, candidateLabel]) => candidateLabel === label)
        .map(([anchorId]) => groupVoronoi.cellByAnchorId.get(anchorId))
        .filter(Boolean)
        .map((geometry) => geometryFeature(geometry));
      if (featuresForLabel.length === 0) throw new Error(`${tag}: no Voronoi cells for label '${label}'.`);
      return unionOne({ workDirectory, tag, features: featuresForLabel });
    }

    async function keepComponentWithAnchor({ feature, anchorId, tag }) {
      const parts = await explode({ workDirectory, tag: `${tag}-explode`, features: [feature] });
      const anchor = anchorPoint(anchorsById, anchorId);
      const hit = parts.find((part) => pointInGeometry(anchor, part.geometry));
      if (!hit) throw new Error(`${tag}: no component contains anchor '${anchorId}'.`);
      return unionOne({ workDirectory, tag: `${tag}-union`, features: [hit] });
    }

    async function keepComponentsWithAnchors({ feature, anchorIds, tag }) {
      const parts = await explode({ workDirectory, tag: `${tag}-explode`, features: [feature] });
      const selected = parts.filter((part) =>
        anchorIds.some((anchorId) => pointInGeometry(anchorPoint(anchorsById, anchorId), part.geometry))
      );
      if (selected.length === 0) throw new Error(`${tag}: no components contain anchors ${anchorIds.join(", ")}.`);
      return unionOne({ workDirectory, tag: `${tag}-union`, features: selected });
    }

    const groupA = buildGroupVoronoi({ anchorsById, labelsByAnchorId: GROUP_A_LABELS, marginDegrees: 6 });

    let pisidia = await unionLabelCells({ groupVoronoi: groupA, label: "pisidia", tag: "group-a-pisidia" });
    pisidia = await unionOne({
      workDirectory,
      tag: "group-a-pisidia-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-a-pisidia-land",
        operation: "clip",
        subjectFeatures: [pisidia],
        maskFeatures: [asiaMainland],
        expectNonEmpty: true
      })
    });
    pisidia = await keepComponentWithAnchor({ feature: pisidia, anchorId: "selge", tag: "group-a-pisidia-main" });
    addFeature(features, {
      id: "pisidia",
      geometry: pisidia.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-pisidia", "bib:isbe-phrygia", "pleiades:638789", "pleiades:639111", "pleiades:639139", "pleiades:639100", "pleiades:638741", "pleiades:638804"],
      confidence: "low",
      note: "Pisidia, the mountain country above the Pamphylian plain. Strabo says most Pisidians 'occupy the summits of the Taurus, but some, situated above Sidê and Aspendus, Pamphylian cities, occupy hilly places' (Geography 12.7.1). The International Standard Bible Encyclopedia (ISBE) says Pisidia 'was bounded by Lycia on the West, by the Phrygian country on the North, and by Isauria on the East', and that toward Isauria 'the frontier was never strictly drawn' ('Pisidia'). No source this project cites gives a line, so each edge is drawn halfway between towns the sources place on either side, and is approximate. Sinda, in the south-west, is inside: Artemidorus counts it among 'the cities of the Pisidians' (Strabo 12.7.2), but Strabo also groups 'Greater Cibyra and Sinda and Cabalis' (13.4.15). Cibyra is outside, and so is Balbura, which, Strabo says, Murena 'included ... within the territory of the Lycians' (13.4.17). Antioch and Apollonia, to the north, are drawn in Phrygia: ISBE places Antioch 'in Galatian Phrygia, near the northern border of Pisidia' ('Pisidia') and names Antioch, Iconium and Apollonia among Galatian Phrygia's important cities ('Phrygia'). Pliny instead puts 'the colony of Cæsarea, also called Antiochia' in the Pisidians' country (Natural History 5.24)."
    });

    let lycaonia = await unionLabelCells({ groupVoronoi: groupA, label: "lycaonia", tag: "group-a-lycaonia" });
    lycaonia = await unionOne({
      workDirectory,
      tag: "group-a-lycaonia-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-a-lycaonia-land",
        operation: "clip",
        subjectFeatures: [lycaonia],
        maskFeatures: [asiaMainland],
        expectNonEmpty: true
      })
    });
    lycaonia = await keepComponentWithAnchor({ feature: lycaonia, anchorId: "lystra-pleiades", tag: "group-a-lycaonia-main" });
    const ciliciaTracheia = areaById(areas, "cilicia-tracheia");
    const cilicia = areaById(areas, "cilicia");
    lycaonia = await unionOne({
      workDirectory,
      tag: "lycaonia-minus-cilicia-union",
      features: await booleanOpStrict({
        workDirectory,
        tag: "lycaonia-minus-cilicia",
        operation: "erase",
        subjectFeatures: [lycaonia],
        maskFeatures: [ciliciaTracheia, cilicia],
        expectNonEmpty: true
      })
    });
    lycaonia = await unionOne({
      workDirectory,
      tag: "lycaonia-minus-lake-tuz-union",
      features: await booleanOpStrict({
        workDirectory,
        tag: "lycaonia-minus-lake-tuz",
        operation: "erase",
        subjectFeatures: [lycaonia],
        maskFeatures: [lakeTuz],
        expectNonEmpty: true
      })
    });
    addFeature(features, {
      id: "lycaonia",
      geometry: lycaonia.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-lycaonia", "scripture:Acts 14:6", "naturalearth:ne-10m-lakes", "pleiades:619194", "pleiades:619164", "pleiades:619268", "pleiades:648652"],
      confidence: "low",
      note: "Lycaonia, the plain of south-central Asia Minor, drawn as its western, Roman part, where Lystra and Derbe lay (Acts 14:6). Strabo describes 'the plateaus of the Lycaonians' as 'cold, bare of trees, and grazed by wild asses' (Geography 12.6.1). He puts the boundary with Cappadocia 'between Coropassus, a village of the Lycaonians, and Garsaüra, a town of the Cappadocians' (12.6.1). The International Standard Bible Encyclopedia (ISBE) bounds Lycaonia 'on the South by Cilicia Tracheia', so the outline stops at this map's Cilicia and does not reach the sea. ISBE also says 'The boundary of Phrygia and Lycaonia passed between Iconium and Lystra' ('Lycaonia'), and this map follows it, drawing Iconium in Phrygia. But Strabo names Iconium with the Lycaonian plateau ('In this neighbourhood is also Iconium', 12.6.1), and Pliny places 'the famous city of Iconium' in 'a Tetrarchy of Lycaonia' (Natural History 5.25). Laranda is outside, with the eastern part of Lycaonia, which ISBE says 'included the important city of Laranda'. Lake Tatta is in neither this outline nor Phrygia's: Strabo calls it 'a part of Greater Phrygia' (12.5.4), but also says Greater Phrygia 'leaves on the left Pessinus and the region of Orcaorci and Lycaonia' (12.8.13). The other edges are drawn halfway between towns the sources place on either side, and are approximate."
    });

    let mysia = await unionLabelCells({ groupVoronoi: groupA, label: "mysia", tag: "group-a-mysia" });
    mysia = await unionOne({
      workDirectory,
      tag: "group-a-mysia-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-a-mysia-land",
        operation: "clip",
        subjectFeatures: [mysia],
        maskFeatures: [asiaMainland],
        expectNonEmpty: true
      })
    });
    mysia = await keepComponentWithAnchor({ feature: mysia, anchorId: "pergamum", tag: "group-a-mysia-main" });
    addFeature(features, {
      id: "mysia",
      geometry: mysia.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-mysia", "scripture:Acts 16:7", "scripture:Acts 16:8", "pleiades:550523", "pleiades:609420", "pleiades:609427"],
      confidence: "low",
      note: "Mysia, in north-western Asia Minor. The International Standard Bible Encyclopedia (ISBE) says 'its boundaries were always vague', but that it reached 'on the North to the Sea of Marmora on the East to Bithynia and Phrygia, on the South to Lydia, and on the West to Hellespont', and that 'According to some authors it included the Troad' ('Mysia'). This outline includes the Troad, which is disputed: Strabo says 'Mysia and Olympus come after the Troad' (Geography 12.4.6). The coast is the Asian mainland's; the islands are left out. In the south, Strabo's Mysia takes in 'the country in the neighbourhood of the Caïcus River and Pergamenê, extending as far as Teuthrania and the outlets of the river' (12.8.1), so Elaea, at the river's mouth, is inside. Pliny instead lists 'the town of Elæa, the river Caïcus, which flows from Mysia, the town of Pitane' in 'Æolis ..., formerly known as Mysia' (Natural History 5.32). Cadi is drawn in Phrygia: Strabo lists it among the cities of Phrygia Epictetus, 'and also Cadi, which, according to some writers, belongs to Mysia' (12.8.12). Strabo says Mysia 'lies between Mt. Ida and Catacecaumenê', which is 'by some called Mysian and by others Maeonian' (12.8.12); the Catacecaumenê is outside this outline. The inland edges are drawn halfway between towns the sources place on either side, and are approximate. Thyatira, which 'by some is called the farthermost city of the Mysians' (Strabo 13.4.4), is outside."
    });

    let phrygia = await unionLabelCells({ groupVoronoi: groupA, label: "phrygia", tag: "group-a-phrygia" });
    phrygia = await unionOne({
      workDirectory,
      tag: "group-a-phrygia-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-a-phrygia-land",
        operation: "clip",
        subjectFeatures: [phrygia],
        maskFeatures: [asiaMainland],
        expectNonEmpty: true
      })
    });
    phrygia = await keepComponentWithAnchor({ feature: phrygia, anchorId: "synnada", tag: "group-a-phrygia-main" });
    phrygia = await unionOne({
      workDirectory,
      tag: "phrygia-minus-lake-tuz-union",
      features: await booleanOpStrict({
        workDirectory,
        tag: "phrygia-minus-lake-tuz",
        operation: "erase",
        subjectFeatures: [phrygia],
        maskFeatures: [lakeTuz],
        expectNonEmpty: true
      })
    });
    addFeature(features, {
      id: "phrygia",
      geometry: phrygia.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-phrygia", "bib:isbe-lycaonia", "naturalearth:ne-10m-lakes", "wikidata:Q65088749", "pleiades:609393", "pleiades:609420", "pleiades:638901", "pleiades:619268", "pleiades:845022"],
      confidence: "low",
      note: "Phrygia, the uplands of west-central Asia Minor. Under Rome it was split between the provinces of Asia and Galatia, 'but the line between them was never sharply drawn', and its boundaries 'were always vague' (International Standard Bible Encyclopedia, ISBE, 'Phrygia'). Strabo says Greater Phrygia 'leaves on the left Pessinus and the region of Orcaorci and Lycaonia, and on the right the Maeonians and Lydians and Carians' (Geography 12.8.13). No source this project cites gives a line, so each edge is drawn halfway between towns the sources place on either side, and is approximate. Antioch, Iconium and Apollonia are inside: ISBE names them as Galatian Phrygia's 'important cities'. But Pliny puts Antioch in Pisidia (Natural History 5.24) and Iconium in 'a Tetrarchy of Lycaonia' (5.25), and Strabo names Iconium with the Lycaonian plateau (12.6.1). Cadi is inside: Strabo lists it among the cities of Phrygia Epictetus, 'and also Cadi, which, according to some writers, belongs to Mysia' (12.8.12). Carura is just outside: Strabo says it 'forms a boundary between Phrygia and Caria' (12.8.17), and also puts it 'in the neighbouring country' to Laodiceia (12.8.16). In the north, Bithynium, which Strabo places 'In the interior of Bithynia' (12.4.7), is outside. So is Modra, though Strabo puts it 'in Phrygia on the Hellespont' (12.3.7). Lake Tatta is in neither this outline nor Lycaonia's: Strabo calls it 'a part of Greater Phrygia' (12.5.4), but, as above, Greater Phrygia leaves Pessinus and Orcaorci on its left (12.8.13). Gordium, among 'the ancient habitations of the Phrygians' on the Sangarius, is outside, in the Galatians' land where Strabo describes it (12.5.3)."
    });

    const groupB = buildGroupVoronoi({ anchorsById, labelsByAnchorId: GROUP_B_LABELS, marginDegrees: 8 });

    const arasKura = findArasKuraChain(naturalEarthRiversMain);
    const arasKuraFeature = featureFromLine(arasKura.chain);
    allowInput("ne-river-slice", arasKuraFeature.geometry, { source: "aras-kura-chain" });

    let media = await unionLabelCells({ groupVoronoi: groupB, label: "media", tag: "group-b-media" });
    media = await unionOne({
      workDirectory,
      tag: "group-b-media-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-b-media-land",
        operation: "clip",
        subjectFeatures: [media],
        maskFeatures: [mediaLand],
        expectNonEmpty: true
      })
    });
    const artaxataCellGeometry = groupB.cellByAnchorId.get("artaxata");
    if (!artaxataCellGeometry) throw new Error("Group B Voronoi has no cell for Artaxata.");
    const artaxataCell = geometryFeature(artaxataCellGeometry);
    const artaxataLandPieces = await booleanOpStrict({
      workDirectory,
      tag: "group-b-artaxata-land",
      operation: "clip",
      subjectFeatures: [artaxataCell],
      maskFeatures: [mediaLand],
      expectNonEmpty: true
    });
    const artaxataLand = await unionOne({ workDirectory, tag: "group-b-artaxata-land-union", features: artaxataLandPieces });
    const artaxataPoint = anchorPoint(anchorsById, "artaxata");
    const gazacaPoint = anchorPoint(anchorsById, "gazaca");
    const artaxataGazacaSegment = [artaxataPoint, gazacaPoint];
    allowInput("anchor-segment", { type: "LineString", coordinates: artaxataGazacaSegment }, { anchors: ["artaxata", "gazaca"] });
    const artaxataEastMask = eastOfSegmentMask(artaxataPoint, gazacaPoint);
    const artaxataEastPieces = await booleanOpStrict({
      workDirectory,
      tag: "group-b-artaxata-east",
      operation: "clip",
      subjectFeatures: [artaxataLand],
      maskFeatures: [artaxataEastMask],
      expectNonEmpty: true
    });
    const artaxataEast = await unionOne({ workDirectory, tag: "group-b-artaxata-east-union", features: artaxataEastPieces });
    const segmentAndRiverHits = polylineIntersections(artaxataGazacaSegment, arasKura.chain)
      .sort((left, right) => left.segmentB - right.segmentB);
    const artaxataGazacaMidpoint = [(artaxataPoint[0] + gazacaPoint[0]) / 2, (artaxataPoint[1] + gazacaPoint[1]) / 2];
    const meetingPoint = segmentAndRiverHits[0]?.point ?? nearestPointOnLine(arasKura.chain, artaxataGazacaMidpoint).point;
    const seaEnd = arasKura.chain[0][0] >= arasKura.chain.at(-1)[0] ? arasKura.chain[0] : arasKura.chain.at(-1);
    const arasToMeeting = sliceLineBetweenPoints(arasKura.chain, seaEnd, meetingPoint);
    allowInput("ne-river-slice", { type: "LineString", coordinates: arasToMeeting }, { source: "aras-kura-sea-to-artaxata-gazaca" });
    const southOfAraxesMask = southOfLineMask(arasToMeeting, 8);
    const northOfAraxesMask = northOfLineMask(arasToMeeting, 8);
    const rightBankMask = await unionOne({
      workDirectory,
      tag: "group-b-media-araxes-right-bank",
      features: sideQuadsFromLine(arasToMeeting, { side: "right", extentDegrees: 8 })
    });
    const leftBankMask = await unionOne({
      workDirectory,
      tag: "group-b-media-araxes-left-bank",
      features: sideQuadsFromLine(arasToMeeting, { side: "left", extentDegrees: 8 })
    });
    const mediaKeepGuard = gazacaPoint;
    const mediaDropGuard = artaxataPoint;
    const namedAraxesMasks = [
      { name: "right-bank-mask", feature: rightBankMask },
      { name: "left-bank-mask", feature: leftBankMask },
      { name: "south-of-line-mask", feature: southOfAraxesMask },
      { name: "north-of-line-mask", feature: northOfAraxesMask }
    ];
    const selectedAraxesMask = namedAraxesMasks.find(
      (candidate) => pointInGeometry(mediaKeepGuard, candidate.feature.geometry) && !pointInGeometry(mediaDropGuard, candidate.feature.geometry)
    );
    if (!selectedAraxesMask) {
      throw new Error("Could not resolve the Media Aras/Kura side mask from guard points.");
    }
    m520Diagnostics.media = {
      artaxataGazacaCrossings: segmentAndRiverHits.length,
      crossingRule: "first-upstream-from-sea",
      usedCrossingSegmentB: segmentAndRiverHits[0]?.segmentB ?? null,
      selectedMask: selectedAraxesMask.name
    };
    media = await unionOne({
      workDirectory,
      tag: "group-b-media-with-artaxata-east",
      features: [media, artaxataEast]
    });
    media = await unionOne({
      workDirectory,
      tag: "group-b-media-south-of-araxes",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-b-media-south-of-araxes",
        operation: "clip",
        subjectFeatures: [media],
        maskFeatures: [selectedAraxesMask.feature],
        expectNonEmpty: true
      })
    });
    media = await keepComponentsWithAnchors({ feature: media, anchorIds: ["ecbatana", "gazaca", "rhagae"], tag: "group-b-media-main" });
    addFeature(features, {
      id: "media",
      geometry: media.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:isbe-media", "naturalearth:ne-10m-rivers-lake-centerlines", "pleiades:874361", "pleiades:884148", "pleiades:903104"],
      confidence: "medium",
      note: "Media, with Atropatene, west and south-west of the Caspian. Strabo says Media 'is divided into two parts', Greater Media, with its metropolis at Ecbatana, and 'Atropatian Media' (Geography 11.13.1). The International Standard Bible Encyclopedia (ISBE) says Media 'Lay to the West and Southwest of the Caspian' and 'included Atropatene', and adds that 'Lake Spauta is now known as Urmi' ('Media'). The north-west edge is the Araxes, 'which forms the boundary between Armenia and Atropatenê' (11.13.3), and the lower Cyrus to the sea. ISBE: 'On the North in later times it was bounded by the rivers Araxes and Cyrus, which separated it from Armenia'. Near Artaxata, a town of Greater Armenia (Pliny, Natural History 6.10), the edge leaves the river along the straight line from Artaxata to Gazaca for about 170 km. Rhagae is inside, as one of ISBE's 'chief cities of ancient Media', 'Ecbatana, Gazaea, and Ragae'. But Strabo counts 'the whole region that extends as far as the Caspian Gates and Rhagae and the Tapyri, which formerly belonged to Media' as Parthian in his day (11.9.1), so Rhagae and the east end of the coast are disputed. Gazaca, where the kings of Atropatene had their 'royal summer palace' (11.13.3), is inside, but its site is uncertain (Pleiades). The other edges are drawn halfway between towns the sources place on either side: Artaxata in Armenia, Arbela to the west, Susa, Persepolis and Pasargadae to the south, and Hecatompylos, 'the royal seat of the Parthians' (11.9.1), to the east. They are approximate."
    });

    let mesopotamia = await unionLabelCells({ groupVoronoi: groupB, label: "mesopotamia", tag: "group-b-mesopotamia" });
    mesopotamia = await unionOne({
      workDirectory,
      tag: "group-b-mesopotamia-land",
      features: await booleanOpStrict({
        workDirectory,
        tag: "group-b-mesopotamia-land",
        operation: "clip",
        subjectFeatures: [mesopotamia],
        maskFeatures: [mesopotamiaLand],
        expectNonEmpty: true
      })
    });
    const euphrates = stitchNamedRiverChain(
      naturalEarthRiversMain,
      /(euphrates|firat|alfurat)/u,
      anchorPoint(anchorsById, "arsamosata")
    );
    const tigris = stitchNamedRiverChain(
      naturalEarthRiversMain,
      /(tigris|dicle)/u,
      anchorPoint(anchorsById, "nisibis")
    );
    const insideAnchors = ["edessa", "carrhae", "nisibis"].map((anchorId) => anchorPoint(anchorsById, anchorId));
    const outsideAnchor = anchorPoint(anchorsById, "arsamosata");
    const insideLatitudes = insideAnchors.map((point) => point[1]);
    const equidistantMinLat = Math.min(...insideLatitudes, outsideAnchor[1]) - 0.5;
    const equidistantMaxLat = Math.max(...insideLatitudes, outsideAnchor[1]) + 0.5;
    const groupBLatitudes = [...GROUP_B_LABELS.keys()].map((anchorId) => anchorPoint(anchorsById, anchorId)[1]);
    const cosPhi = Math.cos((groupBLatitudes.reduce((sum, latitude) => sum + latitude, 0) / groupBLatitudes.length) * Math.PI / 180);
    const equidistantOptions = { insideAnchors, outsideAnchor, cosPhi };
    const euphratesCrossings = riverEquidistantCrossings(euphrates, equidistantOptions)
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const tigrisCrossings = riverEquidistantCrossings(tigris, equidistantOptions)
      .sort((left, right) => left.segmentIndex - right.segmentIndex);
    const euphratesCrossing = euphratesCrossings[0]?.point;
    const tigrisCrossing = tigrisCrossings[0]?.point;
    if (!euphratesCrossing || !tigrisCrossing) throw new Error("Could not derive Mesopotamia north crossings from equidistant anchors.");
    const lonStart = Math.min(euphratesCrossing[0], tigrisCrossing[0]);
    const lonEnd = Math.max(euphratesCrossing[0], tigrisCrossing[0]);
    const northEdge = [];
    for (let lon = lonStart; lon <= lonEnd + 1e-9; lon += 0.01) {
      const solvedLat = solveEquidistantLatitudeAtLongitude(lon, {
        ...equidistantOptions,
        minLat: equidistantMinLat,
        maxLat: equidistantMaxLat
      });
      if (!Number.isFinite(solvedLat)) continue;
      northEdge.push([lon, solvedLat]);
    }
    if (northEdge.length < 2) {
      throw new Error("Could not solve Mesopotamia north equidistant line between Euphrates and Tigris.");
    }
    const empireEdgeChain = stitchEmpireEdgeChain(empireEdge, anchorPoint(anchorsById, "arsamosata"));
    const northEmpireHits = polylineIntersections(northEdge, empireEdgeChain).sort((left, right) => left.segmentA - right.segmentA);
    const northWestPoint = northEmpireHits[0]?.point ?? nearestPointOnLine(empireEdgeChain, euphratesCrossing).point;
    northEdge[0] = northWestPoint;
    northEdge[northEdge.length - 1] = tigrisCrossing;
    m520Diagnostics.mesopotamia = {
      euphratesCrossing,
      tigrisCrossing,
      northEdgeMaxLat: maxLatitudeOfLine(northEdge),
      northEdgeMinLat: northEdge.reduce((min, point) => Math.min(min, point[1]), Infinity)
    };
    const babylonAnchor = anchorPoint(anchorsById, "babylon");
    const seleuciaAnchor = anchorPoint(anchorsById, "seleucia-tigris");
    const euphratesNearBabylon = nearestPointOnLine(euphrates, babylonAnchor).point;
    const tigrisNearSeleucia = nearestPointOnLine(tigris, seleuciaAnchor).point;
    const empireFromNorthToSouth = sliceLineBetweenPoints(empireEdgeChain, northWestPoint, babylonAnchor);
    const empireNearRiverThresholdKm = 5;
    const empireSouthCandidates = empireFromNorthToSouth.map((vertex) => {
      const nearest = nearestPointOnLine(euphrates, vertex);
      const distanceKm = pointDistanceKm(vertex, nearest.point);
      return { vertex, nearest, distanceKm };
    });
    const nearIndices = empireSouthCandidates
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.distanceKm <= empireNearRiverThresholdKm)
      .map(({ index }) => index);
    if (nearIndices.length === 0) {
      throw new Error("Could not derive Mesopotamia empire-edge handoff from the Euphrates.");
    }
    let southJoinIndex = nearIndices.at(-1);
    for (let index = 1; index < empireSouthCandidates.length; index += 1) {
      if (
        empireSouthCandidates[index - 1].distanceKm <= empireNearRiverThresholdKm &&
        empireSouthCandidates[index].distanceKm > empireNearRiverThresholdKm
      ) {
        southJoinIndex = index - 1;
      }
    }
    const empireSouthJoin = empireSouthCandidates[southJoinIndex].vertex;
    const empireSouthJoinOnEuphrates = empireSouthCandidates[southJoinIndex].nearest.point;
    const empireWestEdge = sliceLineBetweenPoints(empireEdgeChain, northWestPoint, empireSouthJoin);
    let lowerEuphratesEdge = sliceLineBetweenPoints(euphrates, empireSouthJoinOnEuphrates, euphratesNearBabylon);
    let tigrisEdge = sliceLineBetweenPoints(tigris, tigrisCrossing, tigrisNearSeleucia);
    const empireSouthJoinOnLowerEuphrates = nearestPointOnLine(lowerEuphratesEdge, empireSouthJoin).point;
    const babylonOnEuphrates = nearestPointOnLine(lowerEuphratesEdge, babylonAnchor);
    const seleuciaOnTigris = nearestPointOnLine(tigrisEdge, seleuciaAnchor);
    lowerEuphratesEdge = insertPointOnLine(lowerEuphratesEdge, nearestPointOnLine(lowerEuphratesEdge, empireSouthJoinOnLowerEuphrates));
    lowerEuphratesEdge = insertPointOnLine(lowerEuphratesEdge, babylonOnEuphrates);
    tigrisEdge = insertPointOnLine(tigrisEdge, seleuciaOnTigris);
    const babylonRiverPoint = babylonOnEuphrates.point;
    const seleuciaRiverPoint = seleuciaOnTigris.point;
    const southBridge = [babylonAnchor, seleuciaAnchor];
    const babylonConnector = [babylonAnchor, babylonRiverPoint];
    const seleuciaConnector = [seleuciaAnchor, seleuciaRiverPoint];
    const empireRiverConnector = [empireSouthJoinOnLowerEuphrates, empireSouthJoin];
    allowInput("ne-river-slice", featureFromLine(lowerEuphratesEdge).geometry, { source: "euphrates" });
    allowInput("ne-river-slice", featureFromLine(tigrisEdge).geometry, { source: "tigris" });
    allowInput("empire-edge-slice", featureFromLine(empireWestEdge).geometry, { source: "ancient-empire-edge" });
    allowInput("edge-river-connector", featureFromLine(empireRiverConnector).geometry, { source: "mesopotamia-west-edge-handoff" });
    allowInput("anchor-segment", featureFromLine(southBridge).geometry, { anchors: ["babylon", "seleucia-tigris"] });
    allowInput("anchor-river-connector", featureFromLine(babylonConnector).geometry, { anchor: "babylon" });
    allowInput("anchor-river-connector", featureFromLine(seleuciaConnector).geometry, { anchor: "seleucia-tigris" });
    const westEdgeFromBabylonToNorth = [
      ...lowerEuphratesEdge.slice().reverse(),
      ...empireRiverConnector.slice(1),
      ...empireWestEdge.slice().reverse().slice(1)
    ];
    const mesopotamiaRing = normalizeRing([
      ...northEdge,
      ...tigrisEdge.slice(1),
      ...seleuciaConnector.slice().reverse().slice(1),
      ...southBridge.slice().reverse().slice(1),
      ...babylonConnector,
      ...westEdgeFromBabylonToNorth.slice(1)
    ]);
    const mesopotamiaRivers = geometryFeature({ type: "Polygon", coordinates: [mesopotamiaRing] });
    const mesopotamiaPieces = await booleanOpStrict({
      workDirectory,
      tag: "mesopotamia-river-clip-land",
      operation: "clip",
      subjectFeatures: [mesopotamiaRivers],
      maskFeatures: [mesopotamiaLand],
      expectNonEmpty: true
    });
    mesopotamia = await unionOne({ workDirectory, tag: "mesopotamia-union", features: mesopotamiaPieces });
    mesopotamia = await keepComponentWithAnchor({ feature: mesopotamia, anchorId: "edessa", tag: "group-b-mesopotamia-main" });
    addFeature(features, {
      id: "mesopotamia",
      geometry: mesopotamia.geometry,
      sources: ["bib:strabo-geography", "bib:pliny-natural-history", "bib:livius-mesopotamia", "awmc:roman-empire-ad-69-extent", "naturalearth:ne-10m-rivers-lake-centerlines", "pleiades:658636", "pleiades:874354", "pleiades:893951", "pleiades:894084"],
      confidence: "medium",
      note: "Mesopotamia, which Strabo says 'lies between the Euphrates and the Tigris', with 'the Taurus, which separates Armenia from Mesopotamia' to the north (Geography 16.1.21). Its east edge is the Tigris. Its west edge is the Euphrates, the frontier with Rome: 'The Euphrates and the land beyond it constitute the boundary of the Parthian empire' (16.1.28). In the south it closes between Babylon and Seleucia, where Strabo puts 'the shortest distance between the two rivers' (16.1.21), with short straight links from each city to its river. The north edge is approximate. It is drawn halfway between Edessa, Carrhae and Nisibis and Arsamosata, which Pliny lists among the towns of Greater Armenia (Natural History 6.10). It meets the Euphrates about 140 km above the Zeugma, while Strabo measures Mesopotamia from 'the Zeugma at Commagenê, where Mesopotamia begins' (16.1.22). The name's reach varied: the historian Arrian used it only for the northern part, today's Jezira, while Pliny's Mesopotamia also takes in Babylonia, with 'Seleucia, Laodicea, Artemita' (6.30)."
    });

    // Clip every region to land.
    const clipped = [];
    for (const feature of features) {
      const pieces = await booleanOpStrict({
        workDirectory,
        tag: `clip-land-${feature.id}`,
        operation: "clip",
        subjectFeatures: [feature],
        maskFeatures: landMask,
        expectNonEmpty: true
      });
      const merged = await unionOne({ workDirectory, tag: `clip-land-${feature.id}-union`, features: pieces });
      clipped.push({ ...feature, geometry: merged.geometry });
    }

    const simplified = await simplifyCollection({
      workDirectory,
      collection: featureCollection(clipped)
    });
    const cleanedFeatures = [];
    for (const feature of simplified.features ?? []) {
      const cleaned = await pruneSmallParts(feature, {
        coastlineLines,
        drawnAreaFeatures: areas.features ?? [],
        seededError,
        workDirectory
      });
      if (!booleanValid(cleaned)) throw new Error(`${cleaned.id} is invalid after simplification.`);
      cleanedFeatures.push(cleaned);
    }
    const cleanedCollection = featureCollection(cleanedFeatures);

    if (writeOutput) {
      await fs.writeFile(outputPath, `${JSON.stringify(cleanedCollection, null, 2)}\n`, "utf8");
    }

    return {
      collection: cleanedCollection,
      allowedInputGeometries: allowedInputGeometries.map((entry) => entry.geometry),
      allowedInputGeometriesTagged: allowedInputGeometries,
      sanity: {
        pontusBaseAreaKm2: geometryAreaKm2(pontusArea.geometry),
        judeaSamariaCombinedKm2: geometryAreaKm2(samaria.geometry) + geometryAreaKm2(judea.geometry),
        partCounts: Object.fromEntries(cleanedFeatures.map((feature) => [feature.id, partCount(feature.geometry)])),
        nonIslandIds: cleanedFeatures.map((feature) => feature.id).filter((id) => !ISLAND_REGION_IDS.has(id)),
        m520Diagnostics
      }
    };
  } finally {
    await fs.rm(workDirectory, { recursive: true, force: true });
  }
}

async function main() {
  const result = await buildRegionOutlinesData({ writeOutput: true });
  console.log(`Wrote ${result.collection.features.length} region outlines to data/geo/region-outlines.geojson.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
