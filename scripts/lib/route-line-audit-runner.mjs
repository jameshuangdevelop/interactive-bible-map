// Runs the routes' lines audit (route-line-audit.mjs) over whole files. `npm run build:route-lines`,
// `npm run check:route-lines` and `npm run validate:data` all call auditRouteLines(), so there is one
// measurement, with no line skipped.

import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

import { ancientGeoCache } from "./ancient-geo-inputs.mjs";
import { auditLine, auditTotals, roadVertexKeys } from "./route-line-audit.mjs";
import { fetchPinnedRouteLineInputs } from "./route-line-inputs.mjs";
import { REGION_BOUNDS, stageKey, stopKey } from "./route-line-rules.mjs";
import { createSurfaceModel } from "./route-line-surface.mjs";

// A stop's site: `getLocation(id)` returns a location record, `getStop(id)` a stop entry.
export function resolveStop(stopRef, { getLocation, getStop }) {
  const index = Number.isInteger(stopRef?.candidateIndex) ? stopRef.candidateIndex : 0;
  const isLocation = stopRef?.kind === "location";
  const record = isLocation ? getLocation(stopRef.locationId) : getStop(stopRef?.stopId);
  const candidate = record?.candidates?.[index];
  if (!Array.isArray(candidate?.coordinates)) return null;
  return {
    key: stopKey(stopRef),
    label: isLocation ? record.names?.ancient?.[0] ?? record.id : record.name ?? record.id,
    coordinate: candidate.coordinates,
    coordinateSource: candidate.coordinateSource
  };
}

export function resolveStageStops(stage, lookup) {
  const from = resolveStop(stage.from, lookup);
  const to = resolveStop(stage.to, lookup);
  const via = (stage.via ?? []).map((stopRef) => resolveStop(stopRef, lookup));
  if (!from || !to || via.some((stop) => !stop)) return null;
  return { from, to, via };
}

export function stopKeyResolver(lookup) {
  return (key) => {
    const [kind, id] = key.split(":");
    const stop = resolveStop(kind === "location" ? { kind, locationId: id } : { kind, stopId: id }, lookup);
    if (!stop) throw new Error(`No site for ${key}`);
    return stop.coordinate;
  };
}

// The pinned Natural Earth land and lakes as a surface model (downloaded once into the cache).
export async function loadPinnedSurfaceModel(cacheRoot = process.env.ROUTE_LINES_CACHE || path.join(os.tmpdir(), "ibm-route-lines")) {
  const cache = ancientGeoCache(cacheRoot);
  await fs.mkdir(cache.inputs, { recursive: true });
  const inputs = await fetchPinnedRouteLineInputs(cache.inputs);
  const [land, lakes] = await Promise.all([
    fs.readFile(inputs.naturalEarthLand, "utf8").then(JSON.parse),
    fs.readFile(inputs.naturalEarthLakes, "utf8").then(JSON.parse)
  ]);
  return createSurfaceModel({ land, lakes, bounds: REGION_BOUNDS });
}

// Audits every line in `linesData` against its stage in `routesData`.
export function auditRouteLines({ model, routesData, linesData, lookup, roadsData = null, baseline = true }) {
  const stages = new Map();
  for (const route of routesData?.routes ?? []) {
    for (const stage of route.stages ?? []) stages.set(stageKey(route.id, stage.id), stage);
  }
  const roadVertices = roadVertexKeys(roadsData);
  const resolveStopKey = stopKeyResolver(lookup);
  const rows = (linesData?.features ?? []).map((feature, featureIndex) => {
    const routeId = feature?.properties?.routeId;
    const stage = stages.get(stageKey(routeId, feature?.properties?.stageId));
    const stops = stage ? resolveStageStops(stage, lookup) : null;
    if (!stage || !stops) {
      return {
        featureIndex,
        lineId: feature?.properties?.lineId,
        mode: stage?.travelMode ?? "unknown",
        method: "unstated",
        vertices: 0,
        lengthKm: 0,
        startConnectorKm: 0,
        endConnectorKm: 0,
        crossingKm: 0,
        ratio: null,
        staircases: 0,
        passes: [],
        failures: [stage ? "a stop of its stage has no site" : "matches no stage"]
      };
    }
    return { featureIndex, ...auditLine(model, { routeId, stage, feature, stops, resolveStopKey, roadVertices, baseline }) };
  });
  return { rows, totals: auditTotals(rows) };
}
