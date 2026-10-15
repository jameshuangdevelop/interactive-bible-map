// Land and water for the routes' lines (ADR-0038, update of 2026-10-14), from Natural Earth 10 m land
// and 10 m lakes at full resolution, in Web Mercator (EPSG:3857). MapLibre draws every segment of a
// line straight in Web Mercator, so a segment that is straight here is the segment the map shows.
//
// - createSurfaceModel(): every ring of land and lakes that reaches the region, indexed for exact
//   segment tests (a grid of edges) and point-in-polygon tests (horizontal bands of edges).
// - segmentRuns(): splits one segment exactly where it crosses a coast or a lake shore, and says
//   which surface (sea, land or lake) each piece lies on.
// - createRaster(): a grid of cells for path search; each cell is land, sea or lake at its centre,
//   and flagged "shore" if any coast or lake shore passes through it.

export const WEB_MERCATOR_RADIUS_M = 6378137;
export const MEAN_EARTH_RADIUS_KM = 6371.0088;
export const GROUND_FACTOR = (MEAN_EARTH_RADIUS_KM * 1000) / WEB_MERCATOR_RADIUS_M;
export const SURFACE = Object.freeze({ SEA: 0, LAND: 1, LAKE: 2 });
export const SURFACE_NAMES = Object.freeze(["sea", "land", "lake"]);

const DEG = Math.PI / 180;

export function toMercator([lon, lat]) {
  return [
    WEB_MERCATOR_RADIUS_M * lon * DEG,
    WEB_MERCATOR_RADIUS_M * Math.log(Math.tan(Math.PI / 4 + (lat * DEG) / 2))
  ];
}

export function fromMercator([x, y]) {
  return [
    x / WEB_MERCATOR_RADIUS_M / DEG,
    (2 * Math.atan(Math.exp(y / WEB_MERCATOR_RADIUS_M)) - Math.PI / 2) / DEG
  ];
}

// Ground metres per Web Mercator metre at Mercator northing y (cos of the latitude, on the mean sphere).
export function groundScaleAt(y) {
  return GROUND_FACTOR / Math.cosh(y / WEB_MERCATOR_RADIUS_M);
}

// Length in km of the segment the map draws between two [lon, lat] points: a straight line in Web
// Mercator is a rhumb line, measured here exactly on the mean Earth sphere.
export function rhumbKm([lon1, lat1], [lon2, lat2]) {
  const p1 = lat1 * DEG;
  const p2 = lat2 * DEG;
  const dp = p2 - p1;
  const dl = (lon2 - lon1) * DEG;
  const dpsi = Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
  const q = Math.abs(dpsi) > 1e-12 ? dp / dpsi : Math.cos(p1);
  return Math.sqrt(dp * dp + q * q * dl * dl) * MEAN_EARTH_RADIUS_KM;
}

export function mercatorSegmentKm(ax, ay, bx, by) {
  return rhumbKm(fromMercator([ax, ay]), fromMercator([bx, by]));
}

export function haversineKm([lon1, lat1], [lon2, lat2]) {
  const dLat = (lat2 - lat1) * DEG;
  const dLon = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLon / 2) ** 2;
  return 2 * MEAN_EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function mercatorBox({ minLon, minLat, maxLon, maxLat }) {
  const [minX, minY] = toMercator([minLon, minLat]);
  const [maxX, maxY] = toMercator([maxLon, maxLat]);
  return { minX, minY, maxX, maxY };
}

function polygonsOf(geometry) {
  if (geometry?.type === "Polygon") return [geometry.coordinates];
  if (geometry?.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

// Visits the cells of a uniform grid that a segment passes through (Amanatides and Woo).
export function traverseGridCells(grid, ax, ay, bx, by, visit) {
  const { minX, minY, cellM, cols, rows } = grid;
  let cx = Math.floor((ax - minX) / cellM);
  let cy = Math.floor((ay - minY) / cellM);
  const dx = bx - ax;
  const dy = by - ay;
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const tDeltaX = stepX !== 0 ? cellM / Math.abs(dx) : Infinity;
  const tDeltaY = stepY !== 0 ? cellM / Math.abs(dy) : Infinity;
  let tMaxX = stepX > 0 ? (minX + (cx + 1) * cellM - ax) / dx : stepX < 0 ? (minX + cx * cellM - ax) / dx : Infinity;
  let tMaxY = stepY > 0 ? (minY + (cy + 1) * cellM - ay) / dy : stepY < 0 ? (minY + cy * cellM - ay) / dy : Infinity;
  const inGrid = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;
  if (inGrid(cx, cy)) visit(cx, cy);
  let guard = 0;
  while (Math.min(tMaxX, tMaxY) <= 1) {
    if (tMaxX < tMaxY) {
      cx += stepX;
      tMaxX += tDeltaX;
    } else {
      cy += stepY;
      tMaxY += tDeltaY;
    }
    if (inGrid(cx, cy)) visit(cx, cy);
    guard += 1;
    if (guard > 10_000_000) throw new Error("Grid traversal did not finish");
  }
}

// Intersection parameter t along a→b with the edge c→d, or null. Touching counts as crossing; the
// pieces between crossings are classified by their midpoints, so a touch only splits a piece.
function segmentEdgeT(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return null;
  const qx = cx - ax;
  const qy = cy - ay;
  const t = (qx * sy - qy * sx) / denominator;
  const u = (qx * ry - qy * rx) / denominator;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return t;
}

export function createSurfaceModel({ land, lakes, bounds, indexCellM = 4000, bandM = 2000 }) {
  const box = mercatorBox(bounds);
  const rings = [];
  const addRings = (featureCollection, surfaceKind) => {
    (featureCollection?.features ?? []).forEach((feature, featureIndex) => {
      for (const polygon of polygonsOf(feature?.geometry)) {
        polygon.forEach((ring, ringIndex) => {
          let minLon = Infinity;
          let minLat = Infinity;
          let maxLon = -Infinity;
          let maxLat = -Infinity;
          for (const [lon, lat] of ring) {
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
          if (maxLon < bounds.minLon || minLon > bounds.maxLon || maxLat < bounds.minLat || minLat > bounds.maxLat) {
            return;
          }
          const xs = new Float64Array(ring.length);
          const ys = new Float64Array(ring.length);
          ring.forEach((coordinate, index) => {
            const [x, y] = toMercator(coordinate);
            xs[index] = x;
            ys[index] = y;
          });
          rings.push({
            id: rings.length,
            surfaceKind,
            featureIndex,
            ringIndex,
            name: feature?.properties?.name ?? null,
            xs,
            ys,
            lonLatBounds: { minLon, minLat, maxLon, maxLat }
          });
        });
      }
    });
  };
  addRings(land, "land");
  addRings(lakes, "lake");

  let edgeCount = 0;
  for (const ring of rings) edgeCount += Math.max(0, ring.xs.length - 1);
  const ex1 = new Float64Array(edgeCount);
  const ey1 = new Float64Array(edgeCount);
  const ex2 = new Float64Array(edgeCount);
  const ey2 = new Float64Array(edgeCount);
  const edgeIsLake = new Uint8Array(edgeCount);
  const edgeRing = new Int32Array(edgeCount);
  let edgeIndex = 0;
  for (const ring of rings) {
    for (let index = 1; index < ring.xs.length; index += 1) {
      ex1[edgeIndex] = ring.xs[index - 1];
      ey1[edgeIndex] = ring.ys[index - 1];
      ex2[edgeIndex] = ring.xs[index];
      ey2[edgeIndex] = ring.ys[index];
      edgeIsLake[edgeIndex] = ring.surfaceKind === "lake" ? 1 : 0;
      edgeRing[edgeIndex] = ring.id;
      edgeIndex += 1;
    }
  }

  // Grid of edges over the region, for segment tests.
  const grid = {
    minX: box.minX,
    minY: box.minY,
    cellM: indexCellM,
    cols: Math.ceil((box.maxX - box.minX) / indexCellM),
    rows: Math.ceil((box.maxY - box.minY) / indexCellM)
  };
  const gridLists = new Map();
  const margin = 1;
  for (let edge = 0; edge < edgeCount; edge += 1) {
    const minX = Math.min(ex1[edge], ex2[edge]) - margin;
    const maxX = Math.max(ex1[edge], ex2[edge]) + margin;
    const minY = Math.min(ey1[edge], ey2[edge]) - margin;
    const maxY = Math.max(ey1[edge], ey2[edge]) + margin;
    if (maxX < box.minX || minX > box.maxX || maxY < box.minY || minY > box.maxY) continue;
    const c0 = Math.max(0, Math.floor((minX - grid.minX) / indexCellM));
    const c1 = Math.min(grid.cols - 1, Math.floor((maxX - grid.minX) / indexCellM));
    const r0 = Math.max(0, Math.floor((minY - grid.minY) / indexCellM));
    const r1 = Math.min(grid.rows - 1, Math.floor((maxY - grid.minY) / indexCellM));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const key = r * grid.cols + c;
        let list = gridLists.get(key);
        if (!list) {
          list = [];
          gridLists.set(key, list);
        }
        list.push(edge);
      }
    }
  }
  grid.lists = gridLists;

  // Horizontal bands of every edge (wherever it lies) for point-in-polygon ray casting.
  const bandCount = Math.ceil((box.maxY - box.minY) / bandM);
  const bands = Array.from({ length: bandCount }, () => []);
  for (let edge = 0; edge < edgeCount; edge += 1) {
    const minY = Math.min(ey1[edge], ey2[edge]);
    const maxY = Math.max(ey1[edge], ey2[edge]);
    if (maxY < box.minY || minY > box.maxY) continue;
    const b0 = Math.max(0, Math.floor((minY - box.minY) / bandM));
    const b1 = Math.min(bandCount - 1, Math.floor((maxY - box.minY) / bandM));
    for (let band = b0; band <= b1; band += 1) bands[band].push(edge);
  }
  const bandArrays = bands.map((list) => Int32Array.from(list));

  const stamp = new Uint32Array(edgeCount);
  let stampValue = 0;

  const model = {
    bounds,
    box,
    rings,
    edgeCount,
    edges: { ex1, ey1, ex2, ey2, edgeIsLake, edgeRing },
    grid,
    bandM,
    bandArrays,

    insideBox(x, y) {
      return x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
    },

    // Crossing parities of a horizontal ray from (x, y) to the east.
    classifyMercator(x, y) {
      if (!model.insideBox(x, y)) throw new Error(`Point outside the route-line region: ${fromMercator([x, y])}`);
      const band = bandArrays[Math.min(bandCount - 1, Math.floor((y - box.minY) / bandM))];
      let land = false;
      let lake = false;
      for (let index = 0; index < band.length; index += 1) {
        const edge = band[index];
        const y1 = ey1[edge];
        const y2 = ey2[edge];
        if ((y1 > y) !== (y2 > y)) {
          const xi = ex1[edge] + ((y - y1) * (ex2[edge] - ex1[edge])) / (y2 - y1);
          if (xi > x) {
            if (edgeIsLake[edge]) lake = !lake;
            else land = !land;
          }
        }
      }
      if (lake) return SURFACE.LAKE;
      return land ? SURFACE.LAND : SURFACE.SEA;
    },

    classify(coordinate) {
      const [x, y] = toMercator(coordinate);
      return model.classifyMercator(x, y);
    },

    // Sorted crossing parameters of the segment with any coast or lake shore.
    segmentCrossings(ax, ay, bx, by) {
      stampValue += 1;
      if (stampValue === 0xffffffff) {
        stamp.fill(0);
        stampValue = 1;
      }
      const ts = [];
      traverseGridCells(grid, ax, ay, bx, by, (c, r) => {
        const list = gridLists.get(r * grid.cols + c);
        if (!list) return;
        for (const edge of list) {
          if (stamp[edge] === stampValue) continue;
          stamp[edge] = stampValue;
          const t = segmentEdgeT(ax, ay, bx, by, ex1[edge], ey1[edge], ex2[edge], ey2[edge]);
          if (t !== null) ts.push(t);
        }
      });
      ts.sort((left, right) => left - right);
      return ts;
    },

    // The nearest point of any coast or lake shore to (x, y) within maxM ground metres, or null:
    // { x, y, distanceM, isLake }.
    nearestShorePoint(x, y, maxM) {
      const scale = groundScaleAt(y);
      const reachCells = Math.max(1, Math.ceil(maxM / scale / grid.cellM));
      const col = Math.floor((x - grid.minX) / grid.cellM);
      const row = Math.floor((y - grid.minY) / grid.cellM);
      let best = null;
      for (let dr = -reachCells; dr <= reachCells; dr += 1) {
        for (let dc = -reachCells; dc <= reachCells; dc += 1) {
          const cc = col + dc;
          const rr = row + dr;
          if (cc < 0 || rr < 0 || cc >= grid.cols || rr >= grid.rows) continue;
          for (const edge of gridLists.get(rr * grid.cols + cc) ?? []) {
            const hit = pointSegmentDistance(x, y, ex1[edge], ey1[edge], ex2[edge], ey2[edge]);
            if (!best || hit.distance < best.distance || (hit.distance === best.distance && edge < best.edge)) {
              best = { distance: hit.distance, x: hit.x, y: hit.y, edge };
            }
          }
        }
      }
      if (!best || best.distance * scale > maxM) return null;
      return { x: best.x, y: best.y, distanceM: best.distance * scale, isLake: edgeIsLake[best.edge] === 1 };
    },

    // Ground metres from a point to the nearest coast or lake shore, up to maxM.
    distanceToShore(x, y, maxM) {
      return model.segmentDistanceToShore(x, y, x, y, maxM);
    },

    // Ground metres from a segment to the nearest coast or lake shore (0 if it crosses one), up to
    // maxM, from the exact edges: every grid cell within maxM of the segment is searched.
    segmentDistanceToShore(ax, ay, bx, by, maxM) {
      stampValue += 1;
      if (stampValue === 0xffffffff) {
        stamp.fill(0);
        stampValue = 1;
      }
      const scale = Math.min(groundScaleAt(ay), groundScaleAt(by));
      const reachCells = Math.max(1, Math.ceil(maxM / scale / grid.cellM));
      let best = maxM / scale;
      const visit = (c, r) => {
        const list = gridLists.get(r * grid.cols + c);
        if (!list) return;
        for (const edge of list) {
          if (stamp[edge] === stampValue) continue;
          stamp[edge] = stampValue;
          const d = segmentSegmentDistance(ax, ay, bx, by, ex1[edge], ey1[edge], ex2[edge], ey2[edge]);
          if (d < best) best = d;
        }
      };
      traverseGridCells(grid, ax, ay, bx, by, (c, r) => {
        for (let dr = -reachCells; dr <= reachCells; dr += 1) {
          for (let dc = -reachCells; dc <= reachCells; dc += 1) {
            const cc = c + dc;
            const rr = r + dr;
            if (cc >= 0 && rr >= 0 && cc < grid.cols && rr < grid.rows) visit(cc, rr);
          }
        }
      });
      return best * scale;
    },

    // The pieces of a segment between crossings, each with the surface at its midpoint; neighbours
    // on the same surface are merged. t0 and t1 are fractions of the segment.
    segmentRuns(ax, ay, bx, by) {
      const ts = model.segmentCrossings(ax, ay, bx, by);
      const cuts = [0];
      for (const t of ts) {
        if (t - cuts[cuts.length - 1] > 1e-12 && t < 1 - 1e-12) cuts.push(t);
      }
      cuts.push(1);
      const runs = [];
      for (let index = 1; index < cuts.length; index += 1) {
        const t0 = cuts[index - 1];
        const t1 = cuts[index];
        const tm = (t0 + t1) / 2;
        const surface = model.classifyMercator(ax + (bx - ax) * tm, ay + (by - ay) * tm);
        const previous = runs[runs.length - 1];
        if (previous && previous.surface === surface) previous.t1 = t1;
        else runs.push({ t0, t1, surface });
      }
      return runs;
    }
  };
  return model;
}

// The ring of land (an island) that contains a point, with its edges in Web Mercator.
export function landRingContaining(model, coordinate) {
  const [x, y] = toMercator(coordinate);
  const containing = [];
  for (const ring of model.rings) {
    if (ring.surfaceKind !== "land" || ring.ringIndex !== 0) continue;
    const { lonLatBounds: b } = ring;
    if (coordinate[0] < b.minLon || coordinate[0] > b.maxLon || coordinate[1] < b.minLat || coordinate[1] > b.maxLat) {
      continue;
    }
    let inside = false;
    for (let index = 1; index < ring.xs.length; index += 1) {
      const y1 = ring.ys[index - 1];
      const y2 = ring.ys[index];
      if ((y1 > y) !== (y2 > y)) {
        const xi = ring.xs[index - 1] + ((y - y1) * (ring.xs[index] - ring.xs[index - 1])) / (y2 - y1);
        if (xi > x) inside = !inside;
      }
    }
    if (inside) containing.push(ring);
  }
  // The smallest ring that contains the point is the island itself.
  containing.sort((left, right) => left.xs.length - right.xs.length);
  return containing[0] ?? null;
}

export function segmentSegmentDistance(ax, ay, bx, by, cx, cy, dx, dy) {
  if (segmentEdgeT(ax, ay, bx, by, cx, cy, dx, dy) !== null) return 0;
  return Math.min(
    pointSegmentDistance(ax, ay, cx, cy, dx, dy).distance,
    pointSegmentDistance(bx, by, cx, cy, dx, dy).distance,
    pointSegmentDistance(cx, cy, ax, ay, bx, by).distance,
    pointSegmentDistance(dx, dy, ax, ay, bx, by).distance
  );
}

export function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  let t = lengthSquared > 0 ? ((px - ax) * dx + (py - ay) * dy) / lengthSquared : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t;
  const qy = ay + dy * t;
  return { distance: Math.hypot(px - qx, py - qy), t, x: qx, y: qy };
}
