// Paths for the routes' lines: the shortest path over water through the places passed (lines by sea)
// and the shortest path over land (lines by land whose straight line would cross water), each found
// by A* on a raster of Natural Earth's land and lakes and string-pulled against the exact coast.

import {
  APPROACH_MAX_KM,
  CONNECTOR_MAX_KM,
  ISLAND_PASS_KM,
  POINT_PASS_KM,
  RASTER_CELL_M,
  WINDOW_MARGINS_KM
} from "./route-line-rules.mjs";
import {
  clearanceField,
  createRaster,
  forbiddenPieces,
  isForbidden,
  MODE,
  navigableMask,
  pullString,
  searchGrid,
  segmentShapeOk
} from "./route-line-search.mjs";
import {
  fromMercator,
  groundScaleAt,
  landRingContaining,
  mercatorSegmentKm,
  pointSegmentDistance,
  SURFACE,
  toMercator,
  traverseGridCells
} from "./route-line-surface.mjs";

export function roundCoordinate([lon, lat]) {
  return [Math.round(lon * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6];
}

export function polylineKm(coordinates) {
  let total = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const [ax, ay] = toMercator(coordinates[index - 1]);
    const [bx, by] = toMercator(coordinates[index]);
    total += mercatorSegmentKm(ax, ay, bx, by);
  }
  return total;
}

// The gate for a side pass: the open water on one side of an island along the meridian of its label
// point, from the island's coast out to gateKm or the next land. Returned in Web Mercator.
export function sideGate(model, islandCoordinate, side, gateKm) {
  const ring = landRingContaining(model, islandCoordinate);
  if (!ring) throw new Error(`No Natural Earth island contains ${JSON.stringify(islandCoordinate)}`);
  const [x0] = toMercator(islandCoordinate);
  const crossings = [];
  for (let index = 1; index < ring.xs.length; index += 1) {
    const xa = ring.xs[index - 1];
    const xb = ring.xs[index];
    if ((xa > x0) !== (xb > x0)) {
      const ya = ring.ys[index - 1];
      const yb = ring.ys[index];
      crossings.push(ya + ((x0 - xa) * (yb - ya)) / (xb - xa));
    }
  }
  if (crossings.length === 0) throw new Error("The island's meridian does not cross its coast");
  const direction = side === "north" ? 1 : side === "south" ? -1 : 0;
  if (direction === 0) throw new Error(`Unsupported side: ${side}`);
  const coastY = direction > 0 ? Math.max(...crossings) : Math.min(...crossings);
  const startY = coastY + direction * 10;
  const lengthM = (gateKm * 1000) / groundScaleAt(coastY);
  const endY = startY + direction * lengthM;
  const runs = model.segmentRuns(x0, startY, x0, endY);
  const first = runs[0];
  if (!first || first.surface === SURFACE.LAND) throw new Error("The side gate does not start on water");
  const gateEndY = startY + (endY - startY) * first.t1;
  return { ring, a: [x0, startY], b: [x0, gateEndY], side };
}

function islandDistanceField(raster, ring) {
  // Cells inside the island or touched by its coast, then the distance of every cell to them.
  const { cols, rows, cellM, minX, minY } = raster;
  const blocked = new Uint8Array(raster.count).fill(1);
  for (let row = 0; row < rows; row += 1) {
    const y = minY + (row + 0.5) * cellM;
    const xs = [];
    for (let index = 1; index < ring.xs.length; index += 1) {
      const ya = ring.ys[index - 1];
      const yb = ring.ys[index];
      if ((ya > y) !== (yb > y)) xs.push(ring.xs[index - 1] + ((y - ya) * (ring.xs[index] - ring.xs[index - 1])) / (yb - ya));
    }
    xs.sort((left, right) => left - right);
    for (let pair = 0; pair + 1 < xs.length; pair += 2) {
      const c0 = Math.max(0, Math.ceil((xs[pair] - minX) / cellM - 0.5));
      const c1 = Math.min(cols - 1, Math.floor((xs[pair + 1] - minX) / cellM - 0.5));
      for (let col = c0; col <= c1; col += 1) blocked[row * cols + col] = 0;
    }
  }
  for (let index = 1; index < ring.xs.length; index += 1) {
    traverseGridCells(raster, ring.xs[index - 1], ring.ys[index - 1], ring.xs[index], ring.ys[index], (col, row) => {
      blocked[row * cols + col] = 0;
    });
  }
  // clearanceField measures from cells marked 1 to the nearest cell marked 0.
  return clearanceField(raster, blocked);
}

function windowBox(points, marginKm) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const margin = (marginKm * 1000) / groundScaleAt((minY + maxY) / 2);
  return { minX: minX - margin, minY: minY - margin, maxX: maxX + margin, maxY: maxY + margin };
}

// Cells a line may start from (or end at): navigable cells joined to the stop by a straight piece
// that keeps to the allowed surface, apart from a connector at the stop of at most `allowanceKm`.
function joinCells({ model, raster, mask, mode, point, atEnd, allowanceKm, reachKm }) {
  const [px, py] = point;
  const scale = groundScaleAt(py);
  const radius = (reachKm * 1000) / scale;
  const { cols, rows, cellM, minX, minY } = raster;
  const c0 = Math.max(0, Math.floor((px - radius - minX) / cellM));
  const c1 = Math.min(cols - 1, Math.floor((px + radius - minX) / cellM));
  const r0 = Math.max(0, Math.floor((py - radius - minY) / cellM));
  const r1 = Math.min(rows - 1, Math.floor((py + radius - minY) / cellM));
  const costs = new Map();
  const connectorKm = new Map();
  let radiusM = 0;
  for (let row = r0; row <= r1; row += 1) {
    for (let col = c0; col <= c1; col += 1) {
      const index = row * cols + col;
      if (!mask[index]) continue;
      const cx = minX + (col + 0.5) * cellM;
      const cy = minY + (row + 0.5) * cellM;
      const distance = Math.hypot(cx - px, cy - py);
      if (distance > radius) continue;
      const pieces = atEnd
        ? forbiddenPieces(model, mode, cx, cy, px, py)
        : forbiddenPieces(model, mode, px, py, cx, cy);
      let forbiddenKm = 0;
      let ok = true;
      pieces.forEach((piece, position) => {
        if (!piece.forbidden) return;
        const atStop = atEnd ? position === pieces.length - 1 : position === 0;
        if (!atStop) ok = false;
        forbiddenKm += piece.km;
      });
      if (!ok || forbiddenKm > allowanceKm) continue;
      const lengthKm = pieces.reduce((sum, piece) => sum + piece.km, 0);
      // Land (or water, by land) in a connector costs four times as much, so connectors stay short.
      costs.set(index, (lengthKm + 3 * forbiddenKm) * 1000);
      connectorKm.set(index, forbiddenKm);
      radiusM = Math.max(radiusM, distance);
    }
  }
  return { costs, connectorKm, radiusM };
}

// The cells a line can join a stop from, within the connector limit if the stop allows it. A stop
// further than the limit from the allowed surface is joined by its shortest connector (plus 2 km of
// choice); the audit then reports that connector as over the limit.
function stopJoin(context, point, atEnd, allowanceKm = CONNECTOR_MAX_KM) {
  const within = joinCells({ ...context, point, atEnd, allowanceKm, reachKm: allowanceKm + 3 });
  if (within.costs.size > 0 || allowanceKm < CONNECTOR_MAX_KM) return { ...within, overLimit: false };
  const wide = joinCells({ ...context, point, atEnd, allowanceKm: 60, reachKm: 63 });
  if (wide.costs.size === 0) return { ...wide, overLimit: true };
  const shortest = Math.min(...wide.connectorKm.values());
  // As near the stop as the shortest connector allows: at most 2 km more over the wrong surface,
  // and no more than 3 km beyond it.
  return { ...joinCells({ ...context, point, atEnd, allowanceKm: shortest + 2, reachKm: shortest + CONNECTOR_MAX_KM }), overLimit: true };
}

function interiorJoin(context, point) {
  // A point inside a line (a road vertex) must be joined without leaving the allowed surface.
  return { ...joinCells({ ...context, point, atEnd: false, allowanceKm: 0, reachKm: 3 }), overLimit: false };
}

function buildTarget(model, raster, mask, pass) {
  const scale = (point) => groundScaleAt(point[1]);
  if (pass.kind === "point") {
    const center = toMercator(pass.coordinate);
    const radiusM = (pass.radiusKm * 1000) / scale(center);
    const target = new Uint8Array(raster.count);
    for (let index = 0; index < raster.count; index += 1) {
      if (!mask[index]) continue;
      const [cx, cy] = raster.cellCenter(index);
      if (Math.hypot(cx - center[0], cy - center[1]) <= radiusM) target[index] = 1;
    }
    return { mask: target, center, radiusM };
  }
  if (pass.kind === "island") {
    const ring = landRingContaining(model, pass.coordinate);
    if (!ring) throw new Error(`No Natural Earth island contains ${pass.key}`);
    const distance = islandDistanceField(raster, ring);
    const target = new Uint8Array(raster.count);
    // A cell's distance is measured between cell centres, so keep a cell's margin from the limit.
    const limitM = pass.radiusKm * 1000 - raster.cellM;
    for (let index = 0; index < raster.count; index += 1) {
      if (mask[index] && distance[index] <= limitM) target[index] = 1;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let index = 0; index < ring.xs.length; index += 1) {
      minX = Math.min(minX, ring.xs[index]);
      maxX = Math.max(maxX, ring.xs[index]);
      minY = Math.min(minY, ring.ys[index]);
      maxY = Math.max(maxY, ring.ys[index]);
    }
    const center = [(minX + maxX) / 2, (minY + maxY) / 2];
    const radiusM = Math.hypot(maxX - minX, maxY - minY) / 2 + (pass.radiusKm * 1000) / scale(center);
    return { mask: target, center, radiusM };
  }
  if (pass.kind === "gate") {
    const target = new Uint8Array(raster.count);
    traverseGridCells(raster, pass.gate.a[0], pass.gate.a[1], pass.gate.b[0], pass.gate.b[1], (col, row) => {
      const index = row * raster.cols + col;
      if (mask[index]) target[index] = 1;
    });
    const center = [(pass.gate.a[0] + pass.gate.b[0]) / 2, (pass.gate.a[1] + pass.gate.b[1]) / 2];
    const radiusM = Math.hypot(pass.gate.b[0] - pass.gate.a[0], pass.gate.b[1] - pass.gate.a[1]) / 2 + raster.cellM;
    return { mask: target, center, radiusM };
  }
  throw new Error(`Unknown pass kind: ${pass.kind}`);
}

function passExtentPoints(model, pass) {
  if (pass.kind === "point") return [toMercator(pass.coordinate)];
  if (pass.kind === "gate") return [pass.gate.a, pass.gate.b];
  const ring = landRingContaining(model, pass.coordinate);
  const points = [];
  for (let index = 0; index < ring.xs.length; index += 1) points.push([ring.xs[index], ring.ys[index]]);
  return points;
}

// Range minimum over an array (a sparse table), for the corridor a shortcut replaces.
function rangeMinimum(values) {
  const levels = [Float64Array.from(values)];
  for (let width = 1; width * 2 <= values.length; width *= 2) {
    const previous = levels[levels.length - 1];
    const next = new Float64Array(values.length - width * 2 + 1);
    for (let index = 0; index < next.length; index += 1) next[index] = Math.min(previous[index], previous[index + width]);
    levels.push(next);
  }
  return (from, to) => {
    if (to < from) return Infinity;
    const level = Math.floor(Math.log2(to - from + 1));
    return Math.min(levels[level][from], levels[level][to - (1 << level) + 1]);
  };
}

// Finds and smooths a path between two points for one mode. `start` and `end` are
// { coordinate, isStop }, `passes` the ordered places passed (by sea only).
export function findPath(model, { mode, start, end, passes = [], penalty = null, margins = WINDOW_MARGINS_KM }) {
  const startMerc = toMercator(start.coordinate);
  const endMerc = toMercator(end.coordinate);
  const extent = [startMerc, endMerc, ...passes.flatMap((pass) => passExtentPoints(model, pass))];
  let found = null;
  for (const marginKm of margins) {
    const raster = createRaster(model, windowBox(extent, marginKm), RASTER_CELL_M);
    const mask = navigableMask(raster, mode);
    const clearance = clearanceField(raster, mask);
    const context = { model, raster, mask, mode };
    const sources = start.isStop ? stopJoin(context, startMerc, false, start.allowanceKm) : interiorJoin(context, startMerc);
    const ends = end.isStop ? stopJoin(context, endMerc, true, end.allowanceKm) : interiorJoin(context, endMerc);
    if (sources.costs.size === 0 || ends.costs.size === 0) continue;
    const targets = passes.map((pass) => buildTarget(model, raster, mask, pass));
    const result = searchGrid({ raster, mask, clearance, sources, ends, targets, penalty, endPoint: endMerc });
    if (result) {
      found = { raster, mask, clearance, sources, ends, result };
      break;
    }
  }
  if (!found) return null;

  const { raster, clearance, sources, ends, result } = found;
  const points = [startMerc, ...result.cells.map((index) => raster.cellCenter(index)), endMerc];
  const last = points.length - 1;
  // The connector found may grow by up to 0.25 km as the path is smoothed, never past the limit
  // (unless the stop lies beyond it anyway).
  const slack = (km) => (km > 0 ? Math.min(Math.max(CONNECTOR_MAX_KM, km), km + 0.25) : 0);
  const startAllowance = slack(sources.connectorKm.get(result.cells[0]) ?? 0);
  const endAllowance = slack(ends.connectorKm.get(result.cells[result.cells.length - 1]) ?? 0);
  const keepM = penalty?.keepM ?? 0;
  // Exact clearance: ground metres from a point or a segment to Natural Earth's coast or lake shores.
  const clearanceAt = (point) => model.distanceToShore(point[0], point[1], keepM + 1000);
  const tail = (stopPoint, other, reachKm) => {
    // The part of a segment beyond the stop's zone (its connector and 0.5 km more), or null.
    const length = Math.hypot(other[0] - stopPoint[0], other[1] - stopPoint[1]) * groundScaleAt(stopPoint[1]);
    const reach = (reachKm + 0.5) * 1000;
    if (length <= reach) return null;
    const t = reach / length;
    return [stopPoint[0] + (other[0] - stopPoint[0]) * t, stopPoint[1] + (other[1] - stopPoint[1]) * t];
  };
  // A straight piece is kept only if the exact test finds no crossing (apart from the connectors at
  // the stops) and, away from the stops, it keeps at least min(keepM, the clearance at its two ends)
  // from the coast: the full distance in open water, less in a narrow passage or round a cape.
  const checker = {
    ok(a, b, aIsStart, bIsEnd, corridorM = Infinity) {
      const allowances = {
        startAllowanceKm: aIsStart ? startAllowance + 1e-9 : 0,
        endAllowanceKm: bIsEnd ? endAllowance + 1e-9 : 0
      };
      if (!segmentShapeOk(model, mode, a, b, allowances)) return false;
      if (keepM <= 0) return true;
      let from = a;
      let to = b;
      if (aIsStart) from = tail(a, b, startAllowance);
      if (bIsEnd && from) {
        const cut = tail(b, from, endAllowance);
        to = cut;
      }
      if (!from || !to) return true;
      const required = Math.min(keepM, corridorM, aIsStart ? Infinity : clearanceAt(a), bIsEnd ? Infinity : clearanceAt(b)) - 1;
      if (required <= 0) return true;
      return model.segmentDistanceToShore(from[0], from[1], to[0], to[1], required) >= required;
    },
    // The clearance of a segment as it stands (beyond the stops' zones), for the corridor rule.
    segmentClearance(a, b, aIsStart, bIsEnd) {
      let from = a;
      let to = b;
      if (aIsStart) from = tail(a, b, startAllowance);
      if (bIsEnd && from) to = tail(b, from, endAllowance);
      if (!from || !to) return Infinity;
      return model.segmentDistanceToShore(from[0], from[1], to[0], to[1], keepM + 1000);
    },
    // A vertex may move up to 250 m closer to the coast than the grid path put it, so a path can
    // straighten in a curving strait.
    floor(point) {
      return keepM <= 0 ? -Infinity : Math.min(keepM, clearanceAt(point)) - 250;
    },
    clearanceAt
  };
  // The raw grid path's clearance at each point, for the corridor a shortcut replaces.
  const rawClearance = points.map((point, index) => (index === 0 || index === last || keepM <= 0 ? Infinity : clearanceAt(point)));
  const corridorBetween = rangeMinimum(rawClearance);
  const lineOfSight = (from, to) => to - from <= 1 || checker.ok(points[from], points[to], from === 0, to === last, corridorBetween(from, to));
  const fixed = result.transitions.map((transition) => transition.at + 1);
  const kept = pullString(points.length, fixed, lineOfSight);
  const ownerOf = new Map(result.transitions.map((transition) => [transition.at + 1, transition.targets]));
  const vertices = kept.map((index) => ({ point: points[index], passes: ownerOf.get(index) ?? [] }));
  const relaxed = relaxPath({ model, raster, vertices, passes, checker });
  const coordinates = relaxed.map((vertex, index) =>
    index === 0 ? start.coordinate : index === relaxed.length - 1 ? end.coordinate : roundCoordinate(fromMercator(vertex.point))
  );
  return {
    coordinates,
    startConnectorKm: startAllowance,
    endConnectorKm: endAllowance,
    startOverLimit: sources.overLimit,
    endOverLimit: ends.overLimit,
    cellM: raster.cellM,
    expanded: result.expanded
  };
}

// A stop of a stage by sea that lies on land further than CONNECTOR_MAX_KM from the nearest coast or
// lake shore (ADR-0038, update of 2026-10-14, "stops away from the water"), or null.
export function stopAwayFromWater(model, coordinate) {
  const [x, y] = toMercator(coordinate);
  if (model.classifyMercator(x, y) !== SURFACE.LAND) return null;
  const shore = model.nearestShorePoint(x, y, (APPROACH_MAX_KM + 10) * 1000);
  if (shore && shore.distanceM <= CONNECTOR_MAX_KM * 1000) return null;
  return { distanceKm: shore ? shore.distanceM / 1000 : Infinity, shore };
}

// The approach to such a stop: straight over land from the stop to the nearest point of the coast,
// which crosses no water because no shore is nearer, and on 2 m into the water, where the path by sea
// begins. Null for any other stop.
export function seaApproach(model, coordinate) {
  const away = stopAwayFromWater(model, coordinate);
  if (!away) return null;
  if (!away.shore || away.distanceKm > APPROACH_MAX_KM) {
    throw new Error(`${JSON.stringify(coordinate)} lies ${away.distanceKm.toFixed(2)} km from the water, beyond the ${APPROACH_MAX_KM} km approach`);
  }
  const [x, y] = toMercator(coordinate);
  const dx = away.shore.x - x;
  const dy = away.shore.y - y;
  const length = Math.hypot(dx, dy);
  const offset = 2 / groundScaleAt(away.shore.y);
  const waterPoint = roundCoordinate(fromMercator([away.shore.x + (dx / length) * offset, away.shore.y + (dy / length) * offset]));
  const [wx, wy] = toMercator(waterPoint);
  const pieces = forbiddenPieces(model, MODE.LAND, x, y, wx, wy);
  if (pieces.length !== 2 || pieces[0].forbidden || !pieces[1].forbidden || pieces[1].km > 0.01) {
    throw new Error(`The approach from ${JSON.stringify(coordinate)} to the nearest coast is not a single stretch of land`);
  }
  return { waterPoint, approachKm: pieces[0].km, distanceKm: away.distanceKm, isLake: away.shore.isLake };
}

// A path by sea between two stops: from each stop away from the water, its approach, and between,
// the shortest path over water through the places passed.
export function findSeaPath(model, { from, to, passes = [], penalty = null, margins = WINDOW_MARGINS_KM }) {
  const startApproach = seaApproach(model, from);
  const endApproach = seaApproach(model, to);
  const result = findPath(model, {
    mode: MODE.SEA,
    start: startApproach ? { coordinate: startApproach.waterPoint, isStop: true, allowanceKm: 0 } : { coordinate: from, isStop: true },
    end: endApproach ? { coordinate: endApproach.waterPoint, isStop: true, allowanceKm: 0 } : { coordinate: to, isStop: true },
    passes,
    penalty,
    margins
  });
  if (!result) return null;
  return {
    ...result,
    coordinates: [...(startApproach ? [from] : []), ...result.coordinates, ...(endApproach ? [to] : [])],
    startApproach,
    endApproach
  };
}

// The places passed by sea as search targets, in order, with the text's side passes.
export function planSeaPasses(model, { via, sidePasses = [], useSides = true, islandVias, pointPassKm = POINT_PASS_KM, islandPassKm = ISLAND_PASS_KM }) {
  const passes = [];
  for (const stop of via) {
    const rules = useSides ? sidePasses.filter((rule) => rule.at === stop.key) : [];
    const instead = rules.find((rule) => rule.placement === "instead");
    if (instead) {
      passes.push({ kind: "gate", key: stop.key, rule: instead, gate: sideGate(model, instead.islandCoordinate, instead.side, instead.gateKm) });
    } else if (islandVias.has(stop.key)) {
      passes.push({ kind: "island", key: stop.key, coordinate: stop.coordinate, radiusKm: islandPassKm });
    } else {
      passes.push({ kind: "point", key: stop.key, coordinate: stop.coordinate, radiusKm: pointPassKm });
    }
    for (const rule of rules.filter((candidate) => candidate.placement === "after")) {
      passes.push({ kind: "gate", key: rule.island, rule, gate: sideGate(model, rule.islandCoordinate, rule.side, rule.gateKm) });
    }
  }
  return passes;
}

// Path relaxation after string-pulling: each vertex slides toward the straight line between its
// neighbours (and is dropped once they see each other) as far as the exact line-of-sight test and the
// clearance allow, so the path pulls taut round the coast instead of keeping the grid's corners. A
// vertex where the path passes a place stays inside that place's target: on the side gate, within the
// distance of a town or cape, or within the distance of an island's coast.
function relaxPath({ model, raster, vertices, passes, checker }) {
  // Every point is tested as it will be written: rounded to 6 decimals of a degree.
  const snap = (point) => toMercator(roundCoordinate(fromMercator(point)));
  const path = vertices.map((vertex, index) => {
    const isStop = index === 0 || index === vertices.length - 1;
    const point = isStop ? [...vertex.point] : snap(vertex.point);
    return { point, passes: vertex.passes, floor: isStop ? -Infinity : checker.floor(point) };
  });
  const passGeometry = passes.map((pass) => {
    if (pass.kind === "gate") return { kind: "gate", a: pass.gate.a, b: pass.gate.b };
    const center = toMercator(pass.coordinate);
    const radius = (pass.radiusKm * 1000) / groundScaleAt(center[1]) - raster.cellM * 0.01;
    if (pass.kind === "point") return { kind: "point", center, radius };
    return { kind: "island", ring: landRingContaining(model, pass.coordinate), radius };
  });
  const ringDistance = (ring, [x, y]) => {
    let best = Infinity;
    for (let index = 1; index < ring.xs.length; index += 1) {
      const dx = ring.xs[index] - ring.xs[index - 1];
      const dy = ring.ys[index] - ring.ys[index - 1];
      const lengthSquared = dx * dx + dy * dy;
      let t = lengthSquared > 0 ? ((x - ring.xs[index - 1]) * dx + (y - ring.ys[index - 1]) * dy) / lengthSquared : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(x - ring.xs[index - 1] - dx * t, y - ring.ys[index - 1] - dy * t));
    }
    return best;
  };
  const satisfies = (vertex, point) =>
    vertex.passes.every((passIndex) => {
      const geometry = passGeometry[passIndex];
      if (geometry.kind === "gate") return true;
      if (geometry.kind === "point") return Math.hypot(point[0] - geometry.center[0], point[1] - geometry.center[1]) <= geometry.radius;
      return ringDistance(geometry.ring, point) <= geometry.radius;
    });
  const lengthOf = (a, b, c) => Math.hypot(b[0] - a[0], b[1] - a[1]) + Math.hypot(c[0] - b[0], c[1] - b[1]);
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // Where the straight segment a→b passes a place: its crossing of a gate, its nearest point to a
  // town or cape within the distance, or its first point within the distance of an island.
  const passPoint = (passIndex, a, b) => {
    const geometry = passGeometry[passIndex];
    if (geometry.kind === "gate") {
      const t = crossingT(a, b, geometry.a, geometry.b);
      return t === null ? null : t;
    }
    if (geometry.kind === "point") {
      const { distance, t } = pointSegmentDistance(geometry.center[0], geometry.center[1], a[0], a[1], b[0], b[1]);
      return distance <= geometry.radius ? t : null;
    }
    const samples = 400;
    for (let sample = 0; sample <= samples; sample += 1) {
      if (ringDistance(geometry.ring, lerp(a, b, sample / samples)) <= geometry.radius) return sample / samples;
    }
    return null;
  };

  // Global shortcuts: join a vertex straight to a later one when that segment passes every check and
  // still passes, in order, every place the vertices between were passing.
  const shortcut = () => {
    let changed = false;
    for (let from = 0; from < path.length - 2; from += 1) {
      for (let to = path.length - 1; to > from + 1; to -= 1) {
        const a = path[from].point;
        const b = path[to].point;
        let corridor = Infinity;
        for (let index = from + 1; index <= to; index += 1) {
          corridor = Math.min(corridor, checker.segmentClearance(path[index - 1].point, path[index].point, index - 1 === 0, index === path.length - 1));
        }
        if (!checker.ok(a, b, from === 0, to === path.length - 1, corridor)) continue;
        const owned = path.slice(from + 1, to).flatMap((vertex) => vertex.passes);
        const placed = [];
        let ok = true;
        for (const passIndex of owned) {
          const t = passPoint(passIndex, a, b);
          if (t === null || (placed.length > 0 && t < placed[placed.length - 1].t)) {
            ok = false;
            break;
          }
          placed.push({ t, passIndex });
        }
        if (!ok) continue;
        const inserted = placed.map(({ t, passIndex }) => {
          const point = snap(lerp(a, b, t));
          return { point, passes: [passIndex], floor: checker.floor(point) };
        });
        const chain = [path[from], ...inserted, path[to]];
        const valid = chain.every((vertex, index) =>
          index === 0 || checker.ok(chain[index - 1].point, vertex.point, from === 0 && index === 1, to === path.length - 1 && index === chain.length - 1, corridor)
        ) && inserted.every((vertex) => satisfies(vertex, vertex.point));
        if (!valid || to - from - 1 <= inserted.length) continue;
        path.splice(from + 1, to - from - 1, ...inserted);
        changed = true;
        break;
      }
    }
    return changed;
  };

  for (let round = 0; round < 4; round += 1) {
    relax();
    if (!shortcut()) break;
  }
  return path;

  function relax() {
  for (let iteration = 0; iteration < 80; iteration += 1) {
    let moved = 0;
    for (let index = 1; index < path.length - 1; index += 1) {
      const last = path.length - 1;
      const previous = path[index - 1].point;
      const next = path[index + 1].point;
      const vertex = path[index];
      const here = vertex.point;
      // The new segments must keep what the old two kept, or the full distance (the corridor rule).
      const corridor = Math.min(
        checker.segmentClearance(previous, here, index - 1 === 0, false),
        checker.segmentClearance(here, next, false, index + 1 === last)
      );
      const segmentOk = (a, b, aIndex, bIndex) => checker.ok(a, b, aIndex === 0, bIndex === last, corridor);
      if (vertex.passes.length === 0 && segmentOk(previous, next, index - 1, index + 1)) {
        // The neighbours see each other: the vertex is not needed.
        path.splice(index, 1);
        index -= 1;
        moved += 1;
        continue;
      }
      const feasible = (point) =>
        checker.clearanceAt(point) >= vertex.floor &&
        satisfies(vertex, point) &&
        segmentOk(previous, point, index - 1, index) &&
        segmentOk(point, next, index, index + 1);
      const gateIndex = vertex.passes.find((passIndex) => passGeometry[passIndex].kind === "gate");
      let target;
      if (gateIndex !== undefined) {
        // Slide along the gate to where the path through it is shortest (a convex function).
        const { a, b } = passGeometry[gateIndex];
        const at = (s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
        let low = 0;
        let high = 1;
        for (let step = 0; step < 80; step += 1) {
          const m1 = low + (high - low) / 3;
          const m2 = high - (high - low) / 3;
          if (lengthOf(previous, at(m1), next) <= lengthOf(previous, at(m2), next)) high = m2;
          else low = m1;
        }
        target = at((low + high) / 2);
      } else {
        // The closest point to the vertex on the straight line between its neighbours.
        const dx = next[0] - previous[0];
        const dy = next[1] - previous[1];
        const lengthSquared = dx * dx + dy * dy;
        const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((here[0] - previous[0]) * dx + (here[1] - previous[1]) * dy) / lengthSquared)) : 0;
        target = [previous[0] + dx * t, previous[1] + dy * t];
      }
      if (Math.hypot(target[0] - here[0], target[1] - here[1]) < 1) continue;
      const toward = (s) => snap([here[0] + (target[0] - here[0]) * s, here[1] + (target[1] - here[1]) * s]);
      let low = 0;
      let high = 1;
      if (feasible(toward(1))) low = 1;
      else {
        for (let step = 0; step < 16; step += 1) {
          const middle = (low + high) / 2;
          if (feasible(toward(middle))) low = middle;
          else high = middle;
        }
      }
      const candidate = toward(low);
      if (low > 0 && Math.hypot(candidate[0] - here[0], candidate[1] - here[1]) >= 1 && lengthOf(previous, candidate, next) < lengthOf(previous, here, next)) {
        vertex.point = candidate;
        moved += 1;
      }
    }
    if (moved === 0) break;
  }
  }
}

function crossingT(a, b, c, d) {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / denominator;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

export function verifySegments(model, mode, coordinates, { startAllowanceKm, endAllowanceKm }) {
  const last = coordinates.length - 1;
  for (let index = 1; index <= last; index += 1) {
    const a = toMercator(coordinates[index - 1]);
    const b = toMercator(coordinates[index]);
    const ok = segmentShapeOk(model, mode, a, b, {
      startAllowanceKm: index === 1 ? startAllowanceKm + 1e-6 : 0,
      endAllowanceKm: index === last ? endAllowanceKm + 1e-6 : 0
    });
    if (!ok) return index;
  }
  return 0;
}

export { isForbidden, MODE };
