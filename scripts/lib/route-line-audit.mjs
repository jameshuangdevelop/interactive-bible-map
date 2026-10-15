// The routes' lines audit (ADR-0038, update of 2026-10-14): one measurement, run by
// `npm run check:route-lines` and by `npm run validate:data`, with no line skipped.
//
// Every segment of every line is split exactly where it crosses a coast or a lake shore of Natural
// Earth 10 m land and 10 m lakes (pinned, full resolution), in Web Mercator, where the map draws it
// straight, and each piece is measured in km. A line by sea fails on any piece over land, and a line
// by land on any piece over the sea or a lake, except one connector of at most CONNECTOR_MAX_KM at
// each end, recorded in the line's provenance, where a stop lies on the shore or a little inland.

import {
  APPROACH_MAX_KM,
  CONNECTOR_MAX_KM,
  DETOUR_REASONS,
  END_TOLERANCE_M,
  ISLAND_VIAS,
  METHOD_KINDS,
  METHODS,
  SEA_DETOUR_MAX_RATIO,
  SIDE_PASSES,
  stageKey
} from "./route-line-rules.mjs";
import { findSeaPath, planSeaPasses, polylineKm, stopAwayFromWater } from "./route-line-paths.mjs";
import { forbiddenPieces, MODE } from "./route-line-search.mjs";
import {
  groundScaleAt,
  haversineKm,
  landRingContaining,
  fromMercator,
  mercatorSegmentKm,
  pointSegmentDistance,
  SURFACE_NAMES,
  toMercator
} from "./route-line-surface.mjs";

// Pieces of a whole line on and off the forbidden surface, merged across vertices.
export function measureLine(model, mode, coordinates) {
  const runs = [];
  let position = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const [ax, ay] = toMercator(coordinates[index - 1]);
    const [bx, by] = toMercator(coordinates[index]);
    for (const piece of forbiddenPieces(model, mode, ax, ay, bx, by)) {
      const at = [ax + (bx - ax) * piece.t0, ay + (by - ay) * piece.t0];
      const previous = runs[runs.length - 1];
      const to = [ax + (bx - ax) * piece.t1, ay + (by - ay) * piece.t1];
      if (previous && previous.forbidden === piece.forbidden) {
        previous.km += piece.km;
        previous.toKm = position + piece.km;
        previous.endMercator = to;
        if (piece.forbidden) previous.surfaces.add(SURFACE_NAMES[piece.surface]);
      } else {
        runs.push({
          forbidden: piece.forbidden,
          km: piece.km,
          fromKm: position,
          toKm: position + piece.km,
          surfaces: new Set(piece.forbidden ? [SURFACE_NAMES[piece.surface]] : []),
          startMercator: at,
          endMercator: to
        });
      }
      position += piece.km;
    }
  }
  return { runs, lengthKm: position };
}

export function connectorsAndCrossings(measure) {
  const { runs } = measure;
  const startConnectorKm = runs.length > 0 && runs[0].forbidden ? runs[0].km : 0;
  const endConnectorKm = runs.length > 1 && runs[runs.length - 1].forbidden ? runs[runs.length - 1].km : 0;
  const crossings = runs.filter(
    (run, index) => run.forbidden && !(index === 0 && startConnectorKm > 0) && !(index === runs.length - 1 && endConnectorKm > 0)
  );
  return { startConnectorKm, endConnectorKm, crossings };
}

// The part of a line from its start (or end) stop to the given coast point, `km` along it.
function approachCoordinates(coordinates, end, coastPoint, km) {
  const ordered = end === "start" ? coordinates : [...coordinates].reverse();
  const out = [ordered[0]];
  let position = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const [ax, ay] = toMercator(ordered[index - 1]);
    const [bx, by] = toMercator(ordered[index]);
    const segmentKm = mercatorSegmentKm(ax, ay, bx, by);
    if (position + segmentKm >= km - 1e-9) break;
    out.push(ordered[index]);
    position += segmentKm;
  }
  out.push(coastPoint);
  return end === "start" ? out : out.reverse();
}

export function connectorChangeDetail(km) {
  return `${km.toFixed(2)} km`;
}

function hasConnectorChange(provenance, kind, km) {
  return (provenance?.changes ?? []).some(
    (change) => change?.kind === kind && typeof change.detail === "string" && change.detail.includes(connectorChangeDetail(km))
  );
}

function segmentDistanceToRing(ax, ay, bx, by, ring) {
  let best = { distance: Infinity, t: 0 };
  for (let index = 1; index < ring.xs.length; index += 1) {
    const cx = ring.xs[index - 1];
    const cy = ring.ys[index - 1];
    const dx = ring.xs[index];
    const dy = ring.ys[index];
    const candidates = [
      { ...pointSegmentDistance(cx, cy, ax, ay, bx, by) },
      { ...pointSegmentDistance(dx, dy, ax, ay, bx, by) },
      { distance: pointSegmentDistance(ax, ay, cx, cy, dx, dy).distance, t: 0 },
      { distance: pointSegmentDistance(bx, by, cx, cy, dx, dy).distance, t: 1 }
    ];
    for (const candidate of candidates) {
      if (candidate.distance < best.distance) best = { distance: candidate.distance, t: candidate.t };
    }
  }
  return best;
}

function segmentIntersectionT(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax;
  const ry = by - ay;
  const sx = dx - cx;
  const sy = dy - cy;
  const denominator = rx * sy - ry * sx;
  if (denominator === 0) return null;
  const t = ((cx - ax) * sy - (cy - ay) * sx) / denominator;
  const u = ((cx - ax) * ry - (cy - ay) * rx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

// Where the line first passes each place: within its distance of a town or cape, of an island's
// coast, or across a side gate. Positions are km along the line.
export function passPositions(model, coordinates, passes) {
  const segments = [];
  let position = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const [ax, ay] = toMercator(coordinates[index - 1]);
    const [bx, by] = toMercator(coordinates[index]);
    const km = mercatorSegmentKm(ax, ay, bx, by);
    segments.push({ ax, ay, bx, by, fromKm: position, km });
    position += km;
  }
  return passes.map((pass) => {
    let nearestKm = Infinity;
    for (const segment of segments) {
      const { ax, ay, bx, by } = segment;
      if (pass.kind === "gate") {
        const t = segmentIntersectionT(ax, ay, bx, by, pass.gate.a[0], pass.gate.a[1], pass.gate.b[0], pass.gate.b[1]);
        if (t !== null) return { ...pass, passed: true, atKm: segment.fromKm + segment.km * t, distanceKm: 0 };
        continue;
      }
      let distanceM;
      let t;
      if (pass.kind === "point") {
        const [px, py] = toMercator(pass.coordinate);
        ({ distance: distanceM, t } = pointSegmentDistance(px, py, ax, ay, bx, by));
      } else {
        const ring = landRingContaining(model, pass.coordinate);
        ({ distance: distanceM, t } = segmentDistanceToRing(ax, ay, bx, by, ring));
      }
      const distanceKm = (distanceM * groundScaleAt(ay + (by - ay) * t)) / 1000;
      nearestKm = Math.min(nearestKm, distanceKm);
      if (distanceKm <= pass.radiusKm) {
        return { ...pass, passed: true, atKm: segment.fromKm + segment.km * t, distanceKm };
      }
    }
    return { ...pass, passed: false, atKm: null, distanceKm: nearestKm };
  });
}

// The nearest the line comes to a coast or lake shore (km, up to 4), sampled every 100 m, leaving out
// the stretch within `skipStartKm` and `skipEndKm` of the ends (where it reaches its stops). For information: the
// basemap draws OpenStreetMap's coast, which is more detailed than Natural Earth's.
export function nearestShoreKm(model, coordinates, skipStartKm, skipEndKm) {
  const { grid } = model;
  const { ex1, ey1, ex2, ey2 } = model.edges;
  const points = coordinates.map((coordinate) => toMercator(coordinate));
  const lengths = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const km = mercatorSegmentKm(...points[index - 1], ...points[index]);
    lengths.push(km);
    total += km;
  }
  let best = 4;
  let position = 0;
  for (let index = 1; index < points.length; index += 1) {
    const [ax, ay] = points[index - 1];
    const [bx, by] = points[index];
    const km = lengths[index - 1];
    const samples = Math.max(1, Math.ceil(km / 0.1));
    for (let sample = 0; sample <= samples; sample += 1) {
      const along = position + (km * sample) / samples;
      if (along < skipStartKm || along > total - skipEndKm) continue;
      const x = ax + ((bx - ax) * sample) / samples;
      const y = ay + ((by - ay) * sample) / samples;
      const col = Math.floor((x - grid.minX) / grid.cellM);
      const row = Math.floor((y - grid.minY) / grid.cellM);
      const scale = groundScaleAt(y) / 1000;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const list = grid.lists.get((row + dr) * grid.cols + (col + dc));
          if (!list) continue;
          for (const edge of list) {
            const distance = pointSegmentDistance(x, y, ex1[edge], ey1[edge], ex2[edge], ey2[edge]).distance * scale;
            if (distance < best) best = distance;
          }
        }
      }
    }
    position += km;
  }
  return best;
}

// Staircases: a short segment (under 2 km) between two sharp turns (over 20°) in opposite directions,
// as a grid path leaves. A step on AWMC's road geometry, or where a computed piece joins it, is the
// source's own course and is not counted (`roadVertices`: "lon,lat" keys of every vertex of
// data/geo/ancient-roads.geojson). A single step is accepted as a turn round land, not counted, when
// `aroundLand(i, j)` says the straight line from the vertex before it to the vertex after it would
// cross land (water, for a line by land): the step is then the way round a cape or a spit. Two or
// more steps in a row are always counted.
export function countStaircases(coordinates, roadVertices = null, aroundLand = null) {
  const points = coordinates.map((coordinate) => toMercator(coordinate));
  const onRoad = (index) => roadVertices?.has(`${coordinates[index][0]},${coordinates[index][1]}`) ?? false;
  const turn = (a, b, c) => {
    const angle = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  };
  const steps = [];
  for (let index = 1; index + 2 < points.length; index += 1) {
    const first = turn(points[index - 1], points[index], points[index + 1]);
    const second = turn(points[index], points[index + 1], points[index + 2]);
    const middleKm = mercatorSegmentKm(...points[index], ...points[index + 1]);
    const sharp = (Math.PI / 180) * 20;
    if (onRoad(index) || onRoad(index + 1)) continue;
    if (middleKm < 2 && Math.abs(first) > sharp && Math.abs(second) > sharp && Math.sign(first) !== Math.sign(second)) {
      steps.push(index);
    }
  }
  let count = 0;
  const accepted = [];
  for (const index of steps) {
    const single = !steps.includes(index - 1) && !steps.includes(index + 1);
    if (single && aroundLand && aroundLand(index - 1, index + 2)) accepted.push(index);
    else count += 1;
  }
  return { count, accepted };
}

export function roadVertexKeys(roadsData) {
  const keys = new Set();
  for (const feature of roadsData?.features ?? []) {
    const lines = feature.geometry?.type === "MultiLineString" ? feature.geometry.coordinates : [feature.geometry?.coordinates ?? []];
    for (const line of lines) for (const [lon, lat] of line) keys.add(`${lon},${lat}`);
  }
  return keys;
}

export function sidePassesFor(key, resolveStopKey) {
  return (SIDE_PASSES.get(key) ?? []).map((rule) => ({ ...rule, islandCoordinate: resolveStopKey(rule.island) }));
}

// Audits one line. `stage` gives the mode and stops; `stops` = { from, to, via } resolved stops with
// `coordinate` and `key`; `resolveStopKey` turns a stop key into its coordinate (for side gates).
export function auditLine(model, { routeId, stage, feature, stops, resolveStopKey, roadVertices = null, baseline = true }) {
  const key = stageKey(routeId, stage.id);
  const coordinates = feature.geometry?.type === "LineString" ? feature.geometry.coordinates : null;
  const provenance = feature.properties?.provenance;
  const row = {
    lineId: feature.properties?.lineId,
    key,
    mode: stage.travelMode,
    method: METHOD_KINDS.has(provenance?.changes?.[0]?.kind) ? provenance.changes[0].kind : "unstated",
    vertices: coordinates?.length ?? 0,
    lengthKm: 0,
    startConnectorKm: 0,
    endConnectorKm: 0,
    crossingKm: 0,
    crossings: [],
    ratio: null,
    staircases: 0,
    passes: [],
    failures: []
  };
  const fail = (message) => row.failures.push(message);
  if (!coordinates || coordinates.length < 2) {
    fail("geometry must be a LineString with at least two vertices");
    return row;
  }

  const startM = haversineKm(coordinates[0], stops.from.coordinate) * 1000;
  const endM = haversineKm(coordinates[coordinates.length - 1], stops.to.coordinate) * 1000;
  row.endsM = Math.max(startM, endM);
  if (startM > END_TOLERANCE_M) fail(`starts ${startM.toFixed(2)} m from its stop`);
  if (endM > END_TOLERANCE_M) fail(`ends ${endM.toFixed(2)} m from its stop`);
  row.lengthKm = polylineKm(coordinates);

  const expectedMethods = stage.travelMode === "unknown"
    ? [METHODS.UNKNOWN]
    : stage.travelMode === "sea"
      ? [METHODS.SEA]
      : [METHODS.ROAD, METHODS.STRAIGHT_LAND, METHODS.SHORTEST_LAND];
  if (!expectedMethods.includes(row.method)) {
    fail(`its provenance's first change must give its method (${expectedMethods.join(" or ")}), not '${row.method}'`);
  }
  if (row.method === METHODS.STRAIGHT_LAND && coordinates.length !== 2 + stops.via.length) {
    fail("is recorded as straight but has vertices other than its stops");
  }

  if (stage.travelMode === "unknown") {
    if (coordinates.length !== 2) fail(`a "path not known" line must be straight, with 2 vertices, not ${coordinates.length}`);
    return row;
  }

  const mode = stage.travelMode === "sea" ? MODE.SEA : MODE.LAND;
  const measure = measureLine(model, mode, coordinates);
  const { startConnectorKm, endConnectorKm, crossings } = connectorsAndCrossings(measure);
  row.startConnectorKm = startConnectorKm;
  row.endConnectorKm = endConnectorKm;
  row.crossings = crossings.map((run) => ({
    km: run.km,
    atKm: run.fromKm,
    surfaces: [...run.surfaces]
  }));
  row.crossingKm = crossings.reduce((sum, run) => sum + run.km, 0);
  const wrong = mode === MODE.SEA ? "land" : "water";
  for (const crossing of row.crossings) {
    fail(`${crossing.km.toFixed(2)} km over ${wrong} (${crossing.surfaces.join(", ")}) at ${crossing.atKm.toFixed(1)} km along the line`);
  }
  const runs = measure.runs;
  for (const [end, km, stop] of [
    ["start", startConnectorKm, stops.from],
    ["end", endConnectorKm, stops.to]
  ]) {
    // A stop of a stage by sea further than CONNECTOR_MAX_KM from the water is reached by an approach
    // over land from the coast nearest it (ADR-0038, update of 2026-10-14, "stops away from the water").
    const away = mode === MODE.SEA ? stopAwayFromWater(model, stop.coordinate) : null;
    if (away) {
      row[`${end}ApproachKm`] = km;
      row[`${end}ConnectorKm`] = 0;
      const kind = `${end}-approach`;
      if (km > APPROACH_MAX_KM) fail(`${end} approach is ${km.toFixed(2)} km over land, more than ${APPROACH_MAX_KM} km`);
      if (km > away.distanceKm + 0.05) {
        fail(`${end} approach of ${km.toFixed(2)} km is longer than the way to the coast nearest the stop (${away.distanceKm.toFixed(2)} km)`);
      }
      // The approach, checked as a line by land: no water crossed.
      const run = end === "start" ? runs[0] : runs[runs.length - 1];
      const coastPoint = end === "start" ? run.endMercator : run.startMercator;
      const approachLine = approachCoordinates(coordinates, end, fromMercator(coastPoint), km);
      const asLand = connectorsAndCrossings(measureLine(model, MODE.LAND, approachLine));
      const waterKm = asLand.startConnectorKm + asLand.endConnectorKm + asLand.crossings.reduce((sum, crossing) => sum + crossing.km, 0);
      if (waterKm > 0.001) fail(`${end} approach crosses ${waterKm.toFixed(2)} km of water`);
      if (!hasConnectorChange(provenance, kind, km)) fail(`${end} approach of ${km.toFixed(2)} km is not recorded in a '${kind}' change`);
      continue;
    }
    if (km <= 0) continue;
    const kind = `${end}-connector`;
    if (km > CONNECTOR_MAX_KM) fail(`${end} connector is ${km.toFixed(2)} km over ${wrong}, more than ${CONNECTOR_MAX_KM} km`);
    if (!hasConnectorChange(provenance, kind, km)) fail(`${end} connector of ${km.toFixed(2)} km is not recorded in a '${kind}' change`);
  }
  // A single step is a turn round land if the straight line skipping it would cross the forbidden
  // surface beyond the line's own connector or approach at a stop.
  const last = coordinates.length - 1;
  const aroundLand = (from, to) => {
    const pieces = forbiddenPieces(model, mode, ...toMercator(coordinates[from]), ...toMercator(coordinates[to]));
    return pieces.some((piece, position) => {
      if (!piece.forbidden) return false;
      if (from === 0 && position === 0 && piece.km <= startConnectorKm + 0.01) return false;
      if (to === last && position === pieces.length - 1 && piece.km <= endConnectorKm + 0.01) return false;
      return true;
    });
  };
  const steps = countStaircases(coordinates, row.method === METHODS.ROAD ? roadVertices : null, aroundLand);
  row.staircases = steps.count;
  row.jogsRoundLand = steps.accepted.length;
  // Leave out each connector or approach and the 3 km of water or land after it, where a line nears its stop.
  row.nearestShoreKm = nearestShoreKm(model, coordinates, startConnectorKm + CONNECTOR_MAX_KM, endConnectorKm + CONNECTOR_MAX_KM);
  if (row.staircases > 0) fail(`${row.staircases} staircase step(s)`);

  if (mode === MODE.LAND) {
    // A line by land reaches each place passed: a vertex at its site, in order.
    let previousIndex = 0;
    for (const via of stops.via) {
      const index = coordinates.findIndex(
        (coordinate, position) => position >= previousIndex && haversineKm(coordinate, via.coordinate) * 1000 <= END_TOLERANCE_M
      );
      row.passes.push({ key: via.key, passed: index >= 0 });
      if (index < 0) fail(`does not pass through ${via.key} in order`);
      else previousIndex = index;
    }
    return row;
  }

  const sidePasses = sidePassesFor(key, resolveStopKey);
  const passes = planSeaPasses(model, { via: stops.via, sidePasses, useSides: true, islandVias: ISLAND_VIAS });
  const positions = passPositions(model, coordinates, passes);
  let previousKm = -1;
  for (const pass of positions) {
    const label = pass.kind === "gate" ? `${pass.rule.side} of ${pass.rule.island}` : pass.key;
    row.passes.push({ key: label, kind: pass.kind, passed: pass.passed, atKm: pass.atKm, distanceKm: pass.distanceKm });
    if (!pass.passed) {
      fail(pass.kind === "gate" ? `does not pass ${label}` : `does not pass within ${pass.radiusKm} km of ${pass.key} (nearest ${pass.distanceKm.toFixed(1)} km)`);
      continue;
    }
    if (pass.atKm < previousKm) fail(`passes ${label} out of order`);
    previousKm = pass.atKm;
  }

  if (baseline) {
    const baselinePasses = planSeaPasses(model, { via: stops.via, sidePasses, useSides: false, islandVias: ISLAND_VIAS });
    const shortest = findSeaPath(model, {
      from: stops.from.coordinate,
      to: stops.to.coordinate,
      passes: baselinePasses,
      penalty: null
    });
    if (!shortest) {
      fail("no path over water found for the detour baseline");
    } else {
      row.baselineKm = polylineKm(shortest.coordinates);
      row.ratio = row.lengthKm / row.baselineKm;
      const reasoned = (provenance?.changes ?? []).some((change) => change?.kind === "detour-reason");
      row.detourReason = reasoned;
      if (row.ratio > SEA_DETOUR_MAX_RATIO && !reasoned) {
        fail(`is ${row.ratio.toFixed(3)} times its shortest path over water (${row.baselineKm.toFixed(1)} km), more than ${SEA_DETOUR_MAX_RATIO}, with no 'detour-reason' change`);
      }
    }
  }
  if (DETOUR_REASONS.has(key) && !(provenance?.changes ?? []).some((change) => change?.kind === "detour-reason")) {
    fail("its text-given reason is not recorded in a 'detour-reason' change");
  }
  return row;
}

export function formatAuditTable(rows) {
  const header = "| Line | Mode | Method | Vertices | Length km | Start connector (or approach) km | End connector (or approach) km | Wrong surface km (outside connectors) | Closest pass to the coast km (beyond the connectors or approaches and 3 km) | Places passed | Ratio | Result |";
  const lines = [header, "|---|---|---|---:|---:|---:|---:|---:|---:|---|---:|---|"];
  for (const row of rows) {
    const passes = row.passes.length === 0
      ? "—"
      : row.passes.map((pass) => `${pass.key}${pass.passed ? (pass.distanceKm !== undefined ? ` ${pass.distanceKm.toFixed(1)}` : "") : " MISSED"}`).join("; ");
    lines.push(
      `| ${row.lineId} | ${row.mode} | ${row.method} | ${row.vertices} | ${row.lengthKm.toFixed(1)} | ${row.startApproachKm !== undefined ? `${row.startApproachKm.toFixed(2)} approach` : row.startConnectorKm.toFixed(2)} | ${row.endApproachKm !== undefined ? `${row.endApproachKm.toFixed(2)} approach` : row.endConnectorKm.toFixed(2)} | ${row.mode === "unknown" ? "n/a" : row.crossingKm.toFixed(2)} | ${row.nearestShoreKm === undefined ? "n/a" : row.nearestShoreKm >= 4 ? "≥ 4" : row.nearestShoreKm.toFixed(2)} | ${passes} | ${row.ratio === null ? "—" : row.ratio.toFixed(3)} | ${row.failures.length === 0 ? "pass" : `FAIL: ${row.failures.join("; ")}`} |`
    );
  }
  return lines.join("\n");
}

export function auditTotals(rows) {
  const sea = rows.filter((row) => row.mode === "sea");
  const land = rows.filter((row) => row.mode === "land");
  const connectors = rows.flatMap((row) => [
    { lineId: row.lineId, end: "start", km: row.startConnectorKm },
    { lineId: row.lineId, end: "end", km: row.endConnectorKm }
  ]);
  const largest = connectors.reduce((best, entry) => (entry.km > best.km ? entry : best), { km: 0 });
  const withinLimit = connectors.filter((entry) => entry.km <= CONNECTOR_MAX_KM);
  const largestWithin = withinLimit.reduce((best, entry) => (entry.km > best.km ? entry : best), { km: 0 });
  const ratios = sea.filter((row) => row.ratio !== null);
  const worst = ratios.reduce((best, row) => (row.ratio > best.ratio ? row : best), { ratio: 0 });
  const methods = new Map();
  for (const row of rows) methods.set(row.method, (methods.get(row.method) ?? 0) + 1);
  return {
    lines: rows.length,
    failing: rows.filter((row) => row.failures.length > 0).length,
    seaLines: sea.length,
    landLines: land.length,
    unknownLines: rows.length - sea.length - land.length,
    seaOverLandKm: sea.reduce((sum, row) => sum + row.crossingKm, 0),
    landOverWaterKm: land.reduce((sum, row) => sum + row.crossingKm, 0),
    connectorsOverLimit: connectors.filter((entry) => entry.km > CONNECTOR_MAX_KM),
    largestConnector: largest,
    largestConnectorWithinLimit: largestWithin,
    worstRatio: worst,
    staircases: rows.reduce((sum, row) => sum + row.staircases, 0),
    jogsRoundLand: rows.filter((row) => row.jogsRoundLand > 0).map((row) => row.lineId),
    approaches: rows.flatMap((row) => [
      ...(row.startApproachKm !== undefined ? [{ lineId: row.lineId, end: "start", km: row.startApproachKm }] : []),
      ...(row.endApproachKm !== undefined ? [{ lineId: row.lineId, end: "end", km: row.endApproachKm }] : [])
    ]),
    nearestShoreSeaKm: Math.min(4, ...sea.map((row) => row.nearestShoreKm ?? 4)),
    nearestShoreLandKm: Math.min(4, ...land.map((row) => row.nearestShoreKm ?? 4)),
    methods: [...methods.entries()].sort((left, right) => left[0].localeCompare(right[0]))
  };
}

export function formatAuditTotals(totals) {
  const connectorText = (entry) => (entry.lineId ? `${entry.km.toFixed(2)} km (${entry.lineId}, ${entry.end})` : "none");
  return [
    `Lines audited: ${totals.lines} (${totals.seaLines} by sea, ${totals.landLines} by land, ${totals.unknownLines} path not known); failing: ${totals.failing}`,
    `Over land in lines by sea, outside the connectors and approaches: ${totals.seaOverLandKm.toFixed(2)} km`,
    `Over water in lines by land, outside the connectors: ${totals.landOverWaterKm.toFixed(2)} km`,
    `Largest connector within ${CONNECTOR_MAX_KM} km: ${connectorText(totals.largestConnectorWithinLimit)}`,
    `Connectors over ${CONNECTOR_MAX_KM} km: ${totals.connectorsOverLimit.length}${totals.connectorsOverLimit.length > 0 ? ` (largest ${connectorText(totals.largestConnector)})` : ""}`,
    `Worst ratio to the shortest path over water: ${totals.worstRatio.lineId ? `${totals.worstRatio.ratio.toFixed(3)} (${totals.worstRatio.lineId})` : "—"}`,
    `Closest pass to Natural Earth's coast or a lake shore, beyond the connectors or approaches and ${CONNECTOR_MAX_KM} km after them: ${totals.nearestShoreSeaKm.toFixed(2)} km in lines by sea, ${totals.nearestShoreLandKm.toFixed(2)} km in lines by land`,
    `Approaches over land to stops away from the water (up to ${APPROACH_MAX_KM} km, checked as lines by land): ${totals.approaches.length}${totals.approaches.length > 0 ? `, longest ${connectorText(totals.approaches.reduce((best, entry) => (entry.km > best.km ? entry : best)))}` : ""}`,
    `Staircase steps: ${totals.staircases}; single turns round land accepted: ${totals.jogsRoundLand.length}${totals.jogsRoundLand.length > 0 ? ` (${totals.jogsRoundLand.join(", ")})` : ""}`,
    `Methods: ${totals.methods.map(([method, count]) => `${method} ${count}`).join(", ")}`
  ].join("\n");
}
