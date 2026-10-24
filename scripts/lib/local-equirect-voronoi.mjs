import { Delaunay } from "d3-delaunay";

const EPSILON = 1e-9;

function meanLatitude(points) {
  return points.reduce((sum, point) => sum + point[1], 0) / points.length;
}

function bboxFromPoints(points, marginDegrees = 6) {
  const lons = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  return {
    minLon: Math.min(...lons) - marginDegrees,
    maxLon: Math.max(...lons) + marginDegrees,
    minLat: Math.min(...lats) - marginDegrees,
    maxLat: Math.max(...lats) + marginDegrees
  };
}

function project(point, phi0Radians) {
  return [point[0] * Math.cos(phi0Radians), point[1]];
}

function unproject(point, phi0Radians) {
  const cosPhi0 = Math.cos(phi0Radians);
  if (Math.abs(cosPhi0) < EPSILON) return [point[0], point[1]];
  return [point[0] / cosPhi0, point[1]];
}

function normalizeRing(ring) {
  if (!ring.length) return ring;
  const first = ring[0];
  const last = ring.at(-1);
  if (Math.abs(first[0] - last[0]) < EPSILON && Math.abs(first[1] - last[1]) < EPSILON) return ring;
  return [...ring, first];
}

export function buildGroupVoronoi({ anchorsById, labelsByAnchorId, marginDegrees = 6 }) {
  const labeled = [...labelsByAnchorId.entries()].map(([anchorId, label]) => ({
    anchorId,
    label,
    point: anchorsById.get(anchorId)?.coordinates
  }));
  const missing = labeled.filter((entry) => !entry.point).map((entry) => entry.anchorId);
  if (missing.length > 0) throw new Error(`Missing anchors for Voronoi group: ${missing.join(", ")}`);
  const points = labeled.map((entry) => entry.point);
  const phi0Radians = (meanLatitude(points) * Math.PI) / 180;
  const projected = points.map((point) => project(point, phi0Radians));
  const bboxLonLat = bboxFromPoints(points, marginDegrees);
  const lowerLeft = project([bboxLonLat.minLon, bboxLonLat.minLat], phi0Radians);
  const upperRight = project([bboxLonLat.maxLon, bboxLonLat.maxLat], phi0Radians);
  const delaunay = Delaunay.from(projected);
  const voronoi = delaunay.voronoi([lowerLeft[0], lowerLeft[1], upperRight[0], upperRight[1]]);
  const cellByAnchorId = new Map();
  for (let index = 0; index < labeled.length; index += 1) {
    const polygon = voronoi.cellPolygon(index);
    if (!polygon || polygon.length < 4) continue;
    const ring = normalizeRing(polygon.map((point) => unproject(point, phi0Radians)));
    cellByAnchorId.set(labeled[index].anchorId, { type: "Polygon", coordinates: [ring] });
  }
  return { cellByAnchorId, phi0Radians, bboxLonLat, labelsByAnchorId };
}

function clipInfiniteLineToBbox(pointOnLine, direction, bbox) {
  const [x0, y0] = pointOnLine;
  const [dx, dy] = direction;
  const candidates = [];
  const push = (t) => {
    const x = x0 + t * dx;
    const y = y0 + t * dy;
    if (x < bbox.minLon - EPSILON || x > bbox.maxLon + EPSILON) return;
    if (y < bbox.minLat - EPSILON || y > bbox.maxLat + EPSILON) return;
    candidates.push([x, y]);
  };
  if (Math.abs(dx) > EPSILON) {
    push((bbox.minLon - x0) / dx);
    push((bbox.maxLon - x0) / dx);
  }
  if (Math.abs(dy) > EPSILON) {
    push((bbox.minLat - y0) / dy);
    push((bbox.maxLat - y0) / dy);
  }
  const unique = [];
  for (const point of candidates) {
    if (!unique.some((other) => Math.abs(other[0] - point[0]) < 1e-6 && Math.abs(other[1] - point[1]) < 1e-6)) {
      unique.push(point);
    }
  }
  if (unique.length < 2) return null;
  return [unique[0], unique[1]];
}

export function bisectorLinesByLabel({ anchorsById, labelsByAnchorId, marginDegrees = 6 }) {
  const entries = [...labelsByAnchorId.entries()].map(([anchorId, label]) => ({ anchorId, label, point: anchorsById.get(anchorId)?.coordinates }));
  const missing = entries.filter((entry) => !entry.point).map((entry) => entry.anchorId);
  if (missing.length > 0) throw new Error(`Missing anchors for bisector build: ${missing.join(", ")}`);
  const points = entries.map((entry) => entry.point);
  const phi0Radians = (meanLatitude(points) * Math.PI) / 180;
  const bbox = bboxFromPoints(points, marginDegrees);
  const lines = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (entries[i].label === entries[j].label) continue;
      const a = project(entries[i].point, phi0Radians);
      const b = project(entries[j].point, phi0Radians);
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const direction = [-(b[1] - a[1]), b[0] - a[0]];
      const bboxProjected = {
        minLon: project([bbox.minLon, bbox.minLat], phi0Radians)[0],
        maxLon: project([bbox.maxLon, bbox.maxLat], phi0Radians)[0],
        minLat: bbox.minLat,
        maxLat: bbox.maxLat
      };
      const clipped = clipInfiniteLineToBbox(mid, direction, bboxProjected);
      if (!clipped) continue;
      lines.push({
        type: "LineString",
        coordinates: clipped.map((point) => unproject(point, phi0Radians))
      });
    }
  }
  return lines;
}
