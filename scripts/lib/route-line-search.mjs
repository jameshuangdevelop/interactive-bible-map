// Path search for the routes' lines over the land and water of route-line-surface.mjs:
// a raster of cells, A* in 8 directions (with no corner cutting) through the places passed in order,
// and string-pulling with exact line-of-sight tests against the vector coast.

import { SURFACE, groundScaleAt, mercatorSegmentKm, traverseGridCells } from "./route-line-surface.mjs";

export const MODE = Object.freeze({ SEA: "sea", LAND: "land" });

// For a line by sea the forbidden surface is land (land less its lakes); for a line by land it is
// open water, the sea or a lake.
export function isForbidden(mode, surface) {
  return mode === MODE.SEA ? surface === SURFACE.LAND : surface !== SURFACE.LAND;
}

export function createRaster(model, box, cellM) {
  const minX = Math.max(model.box.minX, box.minX);
  const minY = Math.max(model.box.minY, box.minY);
  const maxX = Math.min(model.box.maxX, box.maxX);
  const maxY = Math.min(model.box.maxY, box.maxY);
  const cols = Math.ceil((maxX - minX) / cellM);
  const rows = Math.ceil((maxY - minY) / cellM);
  const count = cols * rows;
  const center = new Uint8Array(count);
  const shore = new Uint8Array(count);
  const { ex1, ey1, ex2, ey2, edgeIsLake } = model.edges;

  for (let row = 0; row < rows; row += 1) {
    const y = minY + (row + 0.5) * cellM;
    const band = model.bandArrays[Math.min(model.bandArrays.length - 1, Math.floor((y - model.box.minY) / model.bandM))];
    const landXs = [];
    const lakeXs = [];
    for (let index = 0; index < band.length; index += 1) {
      const edge = band[index];
      const y1 = ey1[edge];
      const y2 = ey2[edge];
      if ((y1 > y) !== (y2 > y)) {
        const xi = ex1[edge] + ((y - y1) * (ex2[edge] - ex1[edge])) / (y2 - y1);
        (edgeIsLake[edge] ? lakeXs : landXs).push(xi);
      }
    }
    landXs.sort((left, right) => left - right);
    lakeXs.sort((left, right) => left - right);
    let landBefore = 0;
    let lakeBefore = 0;
    for (let col = 0; col < cols; col += 1) {
      const x = minX + (col + 0.5) * cellM;
      while (landBefore < landXs.length && landXs[landBefore] <= x) landBefore += 1;
      while (lakeBefore < lakeXs.length && lakeXs[lakeBefore] <= x) lakeBefore += 1;
      const inLand = ((landXs.length - landBefore) & 1) === 1;
      const inLake = ((lakeXs.length - lakeBefore) & 1) === 1;
      center[row * cols + col] = inLake ? SURFACE.LAKE : inLand ? SURFACE.LAND : SURFACE.SEA;
    }
  }

  // Flag every cell that a coast or lake shore passes through, conservatively: each edge is cut into
  // pieces no longer than half a cell, and every cell that a piece's bounding box meets is flagged.
  const seen = new Uint8Array(model.edgeCount);
  const { grid } = model;
  const c0 = Math.max(0, Math.floor((minX - grid.minX) / grid.cellM));
  const c1 = Math.min(grid.cols - 1, Math.floor((maxX - grid.minX) / grid.cellM));
  const r0 = Math.max(0, Math.floor((minY - grid.minY) / grid.cellM));
  const r1 = Math.min(grid.rows - 1, Math.floor((maxY - grid.minY) / grid.cellM));
  const epsilon = 1e-6;
  for (let gridRow = r0; gridRow <= r1; gridRow += 1) {
    for (let gridCol = c0; gridCol <= c1; gridCol += 1) {
      const list = grid.lists.get(gridRow * grid.cols + gridCol);
      if (!list) continue;
      for (const edge of list) {
        if (seen[edge]) continue;
        seen[edge] = 1;
        const length = Math.hypot(ex2[edge] - ex1[edge], ey2[edge] - ey1[edge]);
        const pieces = Math.max(1, Math.ceil(length / (cellM / 2)));
        for (let piece = 0; piece < pieces; piece += 1) {
          const ta = piece / pieces;
          const tb = (piece + 1) / pieces;
          const ax = ex1[edge] + (ex2[edge] - ex1[edge]) * ta;
          const ay = ey1[edge] + (ey2[edge] - ey1[edge]) * ta;
          const bx = ex1[edge] + (ex2[edge] - ex1[edge]) * tb;
          const by = ey1[edge] + (ey2[edge] - ey1[edge]) * tb;
          const pc0 = Math.max(0, Math.floor((Math.min(ax, bx) - epsilon - minX) / cellM));
          const pc1 = Math.min(cols - 1, Math.floor((Math.max(ax, bx) + epsilon - minX) / cellM));
          const pr0 = Math.max(0, Math.floor((Math.min(ay, by) - epsilon - minY) / cellM));
          const pr1 = Math.min(rows - 1, Math.floor((Math.max(ay, by) + epsilon - minY) / cellM));
          for (let row = pr0; row <= pr1; row += 1) {
            for (let col = pc0; col <= pc1; col += 1) shore[row * cols + col] = 1;
          }
        }
      }
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    cellM,
    cols,
    rows,
    count,
    center,
    shore,
    cellOf(x, y) {
      const col = Math.floor((x - minX) / cellM);
      const row = Math.floor((y - minY) / cellM);
      if (col < 0 || row < 0 || col >= cols || row >= rows) return -1;
      return row * cols + col;
    },
    cellCenter(index) {
      const row = Math.floor(index / cols);
      const col = index - row * cols;
      return [minX + (col + 0.5) * cellM, minY + (row + 0.5) * cellM];
    }
  };
}

// Cells a path may use: entirely on the allowed surface, with no coast or shore inside them.
export function navigableMask(raster, mode) {
  const mask = new Uint8Array(raster.count);
  for (let index = 0; index < raster.count; index += 1) {
    if (raster.shore[index]) continue;
    const surface = raster.center[index];
    mask[index] = isForbidden(mode, surface) ? 0 : 1;
  }
  return mask;
}

function distanceTransform1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

// Ground metres from each navigable cell's centre to the nearest cell it may not use (an exact
// Euclidean distance transform, Felzenszwalb and Huttenlocher).
export function clearanceField(raster, mask) {
  const { cols, rows, cellM } = raster;
  const infinity = 2 * (cols * cols + rows * rows) + 1;
  const squared = new Float64Array(raster.count);
  const length = Math.max(cols, rows);
  const f = new Float64Array(length);
  const d = new Float64Array(length);
  const v = new Int32Array(length);
  const z = new Float64Array(length + 1);
  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) f[row] = mask[row * cols + col] ? infinity : 0;
    distanceTransform1d(f, rows, d, v, z);
    for (let row = 0; row < rows; row += 1) squared[row * cols + col] = d[row];
  }
  const clearance = new Float32Array(raster.count);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) f[col] = squared[row * cols + col];
    distanceTransform1d(f, cols, d, v, z);
    const scale = groundScaleAt(raster.minY + (row + 0.5) * cellM) * cellM;
    for (let col = 0; col < cols; col += 1) {
      clearance[row * cols + col] = Math.min(Math.sqrt(d[col]), Math.sqrt(infinity)) * scale;
    }
  }
  return clearance;
}

class StateHeap {
  constructor() {
    this.keys = new Float64Array(1024);
    this.values = new Int32Array(1024);
    this.size = 0;
  }

  less(left, right) {
    const a = this.keys[left];
    const b = this.keys[right];
    return a < b || (a === b && this.values[left] < this.values[right]);
  }

  swap(left, right) {
    const key = this.keys[left];
    this.keys[left] = this.keys[right];
    this.keys[right] = key;
    const value = this.values[left];
    this.values[left] = this.values[right];
    this.values[right] = value;
  }

  push(key, value) {
    if (this.size === this.keys.length) {
      const keys = new Float64Array(this.keys.length * 2);
      keys.set(this.keys);
      this.keys = keys;
      const values = new Int32Array(this.values.length * 2);
      values.set(this.values);
      this.values = values;
    }
    let index = this.size;
    this.size += 1;
    this.keys[index] = key;
    this.values[index] = value;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (!this.less(index, parent)) break;
      this.swap(index, parent);
      index = parent;
    }
  }

  topKey() {
    return this.keys[0];
  }

  pop() {
    const value = this.values[0];
    this.size -= 1;
    if (this.size > 0) {
      this.keys[0] = this.keys[this.size];
      this.values[0] = this.values[this.size];
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.size && this.less(left, smallest)) smallest = left;
        if (right < this.size && this.less(right, smallest)) smallest = right;
        if (smallest === index) break;
        this.swap(index, smallest);
        index = smallest;
      }
    }
    return value;
  }
}

// A* over the cells, through each target (a set of cells) in order. Sources and ends map a cell to
// the cost of joining it to the stop. Costs are ground metres, raised near the forbidden surface by
// `penalty` (up to `penalty.weight` times the step, within `penalty.clearanceM` of it).
export function searchGrid({ raster, mask, clearance, sources, ends, targets = [], penalty = null, endPoint }) {
  const { cols, rows, cellM, count } = raster;
  const layers = targets.length + 1;
  const g = new Float32Array(layers * count).fill(Infinity);
  const parent = new Int32Array(layers * count).fill(-1);
  const closed = new Uint8Array(layers * count);
  const heap = new StateHeap();
  const minScale = Math.min(groundScaleAt(raster.minY), groundScaleAt(raster.maxY));

  const centerOf = (index) => {
    const row = Math.floor(index / cols);
    return [(index - row * cols + 0.5) * cellM, (row + 0.5) * cellM];
  };
  const rel = ([x, y]) => [x - raster.minX, y - raster.minY];
  const targetPoints = targets.map((target) => rel(target.center));
  const endRel = rel(endPoint);
  // Lower bound from target k onwards: the gaps between successive targets and the end.
  const tail = new Float64Array(layers);
  tail[layers - 1] = 0;
  for (let layer = layers - 2; layer >= 0; layer -= 1) {
    const here = targetPoints[layer];
    const next = layer + 1 < targets.length ? targetPoints[layer + 1] : endRel;
    const nextRadius = layer + 1 < targets.length ? targets[layer + 1].radiusM : ends.radiusM;
    const gap = Math.max(0, Math.hypot(next[0] - here[0], next[1] - here[1]) - targets[layer].radiusM - nextRadius);
    tail[layer] = tail[layer + 1] + gap * minScale;
  }
  const heuristic = (index, layer) => {
    const [x, y] = centerOf(index);
    if (layer === layers - 1) {
      return Math.max(0, Math.hypot(endRel[0] - x, endRel[1] - y) - ends.radiusM) * minScale;
    }
    const point = targetPoints[layer];
    return Math.max(0, Math.hypot(point[0] - x, point[1] - y) - targets[layer].radiusM) * minScale + tail[layer];
  };
  const layerAfter = (index, layer) => {
    let next = layer;
    while (next < layers - 1 && targets[next].mask[index]) next += 1;
    return next;
  };

  for (const [index, cost] of [...sources.costs.entries()].sort((left, right) => left[0] - right[0])) {
    if (!mask[index]) continue;
    const layer = layerAfter(index, 0);
    const state = layer * count + index;
    if (cost < g[state]) {
      g[state] = cost;
      parent[state] = -1;
      heap.push(cost + heuristic(index, layer), state);
    }
  }

  let bestTotal = Infinity;
  let bestState = -1;
  const steps = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]
  ];
  let expanded = 0;
  while (heap.size > 0) {
    if (heap.topKey() >= bestTotal) break;
    const state = heap.pop();
    if (closed[state]) continue;
    closed[state] = 1;
    expanded += 1;
    const layer = Math.floor(state / count);
    const index = state - layer * count;
    const gHere = g[state];
    if (layer === layers - 1 && ends.costs.has(index)) {
      const total = gHere + ends.costs.get(index);
      if (total < bestTotal) {
        bestTotal = total;
        bestState = state;
      }
    }
    const row = Math.floor(index / cols);
    const col = index - row * cols;
    for (const [dx, dy, unit] of steps) {
      const nextCol = col + dx;
      const nextRow = row + dy;
      if (nextCol < 0 || nextRow < 0 || nextCol >= cols || nextRow >= rows) continue;
      const next = nextRow * cols + nextCol;
      if (!mask[next]) continue;
      if (dx !== 0 && dy !== 0 && (!mask[row * cols + nextCol] || !mask[nextRow * cols + col])) continue;
      const yMid = raster.minY + ((row + nextRow) / 2 + 0.5) * cellM;
      let step = unit * cellM * groundScaleAt(yMid);
      if (penalty) {
        const shortfall = Math.max(0, penalty.clearanceM - clearance[next]) / penalty.clearanceM;
        step *= 1 + penalty.weight * shortfall;
      }
      const nextLayer = layerAfter(next, layer);
      const nextState = nextLayer * count + next;
      const candidate = gHere + step;
      if (candidate < g[nextState] && !closed[nextState]) {
        g[nextState] = candidate;
        parent[nextState] = state;
        heap.push(candidate + heuristic(next, nextLayer), nextState);
      }
    }
  }
  if (bestState < 0) return null;

  const states = [];
  for (let state = bestState; state >= 0; state = parent[state]) states.push(state);
  states.reverse();
  const cells = [];
  const transitions = [];
  let previousLayer = 0;
  for (const state of states) {
    const layer = Math.floor(state / count);
    const index = state - layer * count;
    // The targets entered at this cell: layers previousLayer .. layer - 1.
    if (layer > previousLayer) transitions.push({ at: cells.length, targets: Array.from({ length: layer - previousLayer }, (_, k) => previousLayer + k) });
    previousLayer = layer;
    cells.push(index);
  }
  return { cells, transitions, cost: bestTotal, expanded };
}

// Lengths in km of the pieces of segment a→b on the forbidden surface, from the exact test.
export function forbiddenPieces(model, mode, ax, ay, bx, by) {
  const runs = model.segmentRuns(ax, ay, bx, by);
  return runs.map((run) => ({
    t0: run.t0,
    t1: run.t1,
    forbidden: isForbidden(mode, run.surface),
    surface: run.surface,
    km: mercatorSegmentKm(ax + (bx - ax) * run.t0, ay + (by - ay) * run.t0, ax + (bx - ax) * run.t1, ay + (by - ay) * run.t1)
  }));
}

// Whether a segment keeps to the allowed surface, apart from a forbidden piece at its start (when it
// leaves a stop) or at its end (when it reaches one), each at most the given km.
export function segmentShapeOk(model, mode, a, b, { startAllowanceKm = 0, endAllowanceKm = 0 } = {}) {
  const pieces = forbiddenPieces(model, mode, a[0], a[1], b[0], b[1]);
  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index];
    if (!piece.forbidden) continue;
    if (index === 0 && piece.km <= startAllowanceKm) continue;
    if (index === pieces.length - 1 && piece.km <= endAllowanceKm) continue;
    return false;
  }
  return true;
}

// String-pulling: from each anchor, the farthest later point in sight, keeping the fixed points.
export function pullString(count, fixed, lineOfSight, lookahead = 400) {
  const anchors = [...new Set([0, ...fixed, count - 1])].sort((left, right) => left - right);
  const kept = [0];
  for (let piece = 1; piece < anchors.length; piece += 1) {
    const end = anchors[piece];
    let index = anchors[piece - 1];
    while (index < end) {
      let best = index + 1;
      let misses = 0;
      for (let candidate = index + 2; candidate <= end; candidate += 1) {
        if (lineOfSight(index, candidate)) {
          best = candidate;
          misses = 0;
        } else {
          misses += 1;
          if (misses > lookahead) break;
        }
      }
      kept.push(best);
      index = best;
    }
  }
  // Second pass: drop any point whose neighbours see each other.
  const fixedSet = new Set(anchors);
  let changed = true;
  while (changed) {
    changed = false;
    for (let position = 1; position < kept.length - 1; position += 1) {
      if (fixedSet.has(kept[position])) continue;
      if (lineOfSight(kept[position - 1], kept[position + 1])) {
        kept.splice(position, 1);
        changed = true;
        position -= 1;
      }
    }
  }
  return kept;
}
