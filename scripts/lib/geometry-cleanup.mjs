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

// Removes zero-width spikes: a vertex where the ring turns back along the line it came in on
// (within `toleranceDegrees`, about 1 m by default). Boolean operations leave these where a cut line
// ends inside an area; they enclose no area but make a ring cross itself after rounding.
export function removeSpikes(ring, toleranceDegrees = 0.00001) {
  let open = removeConsecutiveDuplicateVertices(ring).slice(0, -1);
  let changed = true;
  while (changed && open.length > 3) {
    changed = false;
    for (let index = 0; index < open.length && open.length > 3; index += 1) {
      const previous = open[(index - 1 + open.length) % open.length];
      const vertex = open[index];
      const next = open[(index + 1) % open.length];
      const inX = vertex[0] - previous[0];
      const inY = vertex[1] - previous[1];
      const outX = next[0] - vertex[0];
      const outY = next[1] - vertex[1];
      if (inX * outX + inY * outY >= 0) continue;
      const cross = Math.abs(inX * outY - inY * outX);
      const longest = Math.max(Math.hypot(inX, inY), Math.hypot(outX, outY));
      if (cross / longest > toleranceDegrees) continue;
      open.splice(index, 1);
      open = removeConsecutiveDuplicateVertices([...open, open[0]]).slice(0, -1);
      changed = true;
      index -= 1;
    }
  }
  if (open.length === 0) return [];
  return [...open.map(([lon, lat]) => [lon, lat]), [open[0][0], open[0][1]]];
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

// Parts of a MultiPolygon must not touch each other, even at a single point. Where a later part repeats a
// vertex of an earlier one, that vertex is moved `nudgeDegrees` (about 5 m by default) towards the
// midpoint of its two neighbours, which for the usual convex tip moves it into its own part.
export function separateTouchingParts(polygons, nudgeDegrees = 0.00005) {
  const owner = new Map();
  return polygons.map((polygon, partIndex) =>
    polygon.map((ring) => {
      const open = ring.slice(0, -1);
      const moved = open.map((vertex, index) => {
        const key = `${vertex[0]},${vertex[1]}`;
        const first = owner.get(key);
        if (first === undefined) {
          owner.set(key, partIndex);
          return vertex;
        }
        if (first === partIndex) return vertex;
        const previous = open[(index - 1 + open.length) % open.length];
        const next = open[(index + 1) % open.length];
        const dx = (previous[0] + next[0]) / 2 - vertex[0];
        const dy = (previous[1] + next[1]) / 2 - vertex[1];
        const length = Math.hypot(dx, dy);
        if (length === 0) return vertex;
        const step = Math.min(nudgeDegrees, length / 2);
        return [vertex[0] + (dx / length) * step, vertex[1] + (dy / length) * step];
      });
      return [...moved, [moved[0][0], moved[0][1]]];
    })
  );
}

// A ring must not touch itself either. Simplification can pinch a narrow inlet shut, so that the ring
// passes through the same vertex twice. Each later visit to a vertex is moved `nudgeDegrees` (about 5 m by
// default, and never more than half of either of its edges) along the bisector of its own two edges, on
// the side away from the earlier visit's edges, which opens the pinch without crossing them.
export function separateSelfTouchingRing(ring, nudgeDegrees = 0.00005) {
  const open = ring.slice(0, -1);
  if (open.length < 4) return ring;
  const at = (index) => open[(index + open.length) % open.length];
  const cross = (left, right) => left[0] * right[1] - left[1] * right[0];
  const firstVisit = new Map();
  const moved = open.map((vertex, index) => {
    const key = `${vertex[0]},${vertex[1]}`;
    if (!firstVisit.has(key)) {
      firstVisit.set(key, index);
      return [vertex[0], vertex[1]];
    }
    const earlier = firstVisit.get(key);
    const towards = (target) => {
      const dx = target[0] - vertex[0];
      const dy = target[1] - vertex[1];
      const length = Math.hypot(dx, dy);
      return { unit: length === 0 ? [0, 0] : [dx / length, dy / length], length };
    };
    const [previous, next] = [towards(at(index - 1)), towards(at(index + 1))];
    let bisector = [previous.unit[0] + next.unit[0], previous.unit[1] + next.unit[1]];
    if (Math.hypot(bisector[0], bisector[1]) < 1e-12) bisector = [-previous.unit[1], previous.unit[0]];
    // The bisector points into the smaller angle between this visit's edges; if an edge of the earlier
    // visit lies in that angle, the opening is on the other side.
    const turn = cross(previous.unit, next.unit);
    const inSmallerAngle = (direction) => (turn >= 0 ? cross(previous.unit, direction) > 0 && cross(direction, next.unit) > 0 : cross(previous.unit, direction) < 0 && cross(direction, next.unit) < 0);
    if ([at(earlier - 1), at(earlier + 1)].some((neighbour) => inSmallerAngle(towards(neighbour).unit))) bisector = [-bisector[0], -bisector[1]];
    const length = Math.hypot(bisector[0], bisector[1]);
    const step = Math.min(nudgeDegrees, previous.length / 2, next.length / 2);
    return [vertex[0] + (bisector[0] / length) * step, vertex[1] + (bisector[1] / length) * step];
  });
  return [...moved, [moved[0][0], moved[0][1]]];
}

// Removes repeated vertices and zero-width spikes, opens rings that touch themselves, drops rings with
// fewer than 3 distinct positions (fewer than 4 positions once closed), drops polygon parts smaller than
// `minPartKm2`, separates parts that touch at a point, and returns a Polygon or MultiPolygon. Returns null
// when nothing is left. `dropped` reports what was removed, for the composition report.
export function cleanPolygonGeometry(geometry, { minPartKm2 = 0 } = {}) {
  const dropped = { degenerateRings: 0, smallParts: 0, smallPartsKm2: 0 };
  const polygons = [];
  for (const polygon of polygonsOf(geometry)) {
    const [outer, ...holes] = polygon.map((ring) => separateSelfTouchingRing(removeSpikes(ring)));
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
  if (polygons.length === 1) return { geometry: { type: "Polygon", coordinates: polygons[0] }, dropped };
  return { geometry: { type: "MultiPolygon", coordinates: separateTouchingParts(polygons) }, dropped };
}

// Closes a polyline into a polygon ring by walking through `framePoints` from the line's last
// vertex back to its first. Used to turn a border line into "everything on one side of it".
export function polygonFromLineAndFrame(lineCoordinates, framePoints) {
  const ring = [...lineCoordinates, ...framePoints, lineCoordinates[0]].map(([lon, lat]) => [lon, lat]);
  return { type: "Polygon", coordinates: [removeConsecutiveDuplicateVertices(ring)] };
}
