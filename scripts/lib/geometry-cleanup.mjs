// Pure helpers that tidy polygon geometry before it is written to data/geo/.
const EARTH_RADIUS_KM = 6371.0088;

export function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

// Spherical ring area (km²) using the same formula as the composition report.
export function ringAreaKm2(ring) {
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index].map((value) => (value * Math.PI) / 180);
    const [lon2, lat2] = ring[index + 1].map((value) => (value * Math.PI) / 180);
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

export function polygonAreaKm2([outer, ...holes]) {
  return Math.max(0, ringAreaKm2(outer) - holes.reduce((sum, hole) => sum + ringAreaKm2(hole), 0));
}

export function geometryAreaKm2(geometry) {
  return polygonsOf(geometry).reduce((sum, polygon) => sum + polygonAreaKm2(polygon), 0);
}

function samePosition(left, right) {
  return left[0] === right[0] && left[1] === right[1];
}

// Removes vertices that repeat the previous one and returns a closed ring.
export function removeConsecutiveDuplicateVertices(ring) {
  const cleaned = [];
  for (const position of ring) {
    if (cleaned.length === 0 || !samePosition(cleaned.at(-1), position)) cleaned.push([position[0], position[1]]);
  }
  if (cleaned.length > 1 && samePosition(cleaned[0], cleaned.at(-1))) cleaned.pop();
  if (cleaned.length > 0) cleaned.push([cleaned[0][0], cleaned[0][1]]);
  return cleaned;
}

function distinctPositionCount(ring) {
  return new Set(ring.map(([lon, lat]) => `${lon},${lat}`)).size;
}

export function countConsecutiveDuplicateVertices(geometry) {
  let count = 0;
  for (const polygon of polygonsOf(geometry)) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        if (samePosition(ring[index - 1], ring[index])) count += 1;
      }
    }
  }
  return count;
}

// Removes repeated vertices, drops rings with fewer than 3 distinct positions (fewer than 4 positions
// once closed), drops polygon parts smaller than `minPartKm2`, and returns a Polygon or MultiPolygon.
// Returns null when nothing is left. `dropped` reports what was removed, for the composition report.
export function cleanPolygonGeometry(geometry, { minPartKm2 = 0 } = {}) {
  const dropped = { degenerateRings: 0, smallParts: 0, smallPartsKm2: 0 };
  const polygons = [];
  for (const polygon of polygonsOf(geometry)) {
    const [outer, ...holes] = polygon.map(removeConsecutiveDuplicateVertices);
    if (!outer || distinctPositionCount(outer) < 3) {
      dropped.degenerateRings += 1;
      continue;
    }
    const keptHoles = holes.filter((hole) => {
      const keep = distinctPositionCount(hole) >= 3;
      if (!keep) dropped.degenerateRings += 1;
      return keep;
    });
    const cleanedPolygon = [outer, ...keptHoles];
    const partArea = polygonAreaKm2(cleanedPolygon);
    if (partArea < minPartKm2) {
      dropped.smallParts += 1;
      dropped.smallPartsKm2 += partArea;
      continue;
    }
    polygons.push(cleanedPolygon);
  }
  if (polygons.length === 0) return { geometry: null, dropped };
  return {
    geometry: polygons.length === 1 ? { type: "Polygon", coordinates: polygons[0] } : { type: "MultiPolygon", coordinates: polygons },
    dropped
  };
}

// Closes a polyline into a polygon ring by walking through `framePoints` from the line's last
// vertex back to its first. Used to turn a border line into "everything on one side of it".
export function polygonFromLineAndFrame(lineCoordinates, framePoints) {
  const ring = [...lineCoordinates, ...framePoints, lineCoordinates[0]].map(([lon, lat]) => [lon, lat]);
  return { type: "Polygon", coordinates: [removeConsecutiveDuplicateVertices(ring)] };
}
