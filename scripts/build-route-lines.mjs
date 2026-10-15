// Builds data/geo/routes-lines.geojson, one line per stage of the five routes (ADR-0038 item 5 and its
// update of 2026-10-14), and the stages' `lineId`s in data/routes/routes.json:
// - by sea: the shortest path over water through the places the text says the ship passed, in order,
//   on the side of an island the text gives (scripts/lib/route-line-rules.mjs);
// - by land: along AWMC's dated roads where one links the stops, otherwise a straight line, or the
//   shortest path over land where the straight line would cross the sea or a lake;
// - path not known: a straight line between the stops; stages with a `noLineReason` get no line.
// Every line is then audited (scripts/lib/route-line-audit.mjs) and previews are drawn in the cache.
//
//   npm run build:route-lines     (ROUTE_LINES_CACHE moves the cache; default: the system temp folder)

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AWMC_COMMIT, NATURAL_EARTH_COMMIT, ancientGeoCache, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import {
  connectorChangeDetail,
  connectorsAndCrossings,
  formatAuditTable,
  formatAuditTotals,
  measureLine,
  passPositions,
  sidePassesFor
} from "./lib/route-line-audit.mjs";
import { auditRouteLines, resolveStageStops, stopKeyResolver } from "./lib/route-line-audit-runner.mjs";
import { ROUTE_LINE_INPUTS, fetchPinnedRouteLineInputs } from "./lib/route-line-inputs.mjs";
import { findPath, findSeaPath, planSeaPasses, polylineKm, stopAwayFromWater, verifySegments } from "./lib/route-line-paths.mjs";
import { metresPerPixelAtZoom, writePreviewPng, zoomToFit } from "./lib/route-line-previews.mjs";
import {
  CONNECTOR_MAX_KM,
  DETOUR_REASONS,
  ISLAND_VIAS,
  LAND_CLEARANCE,
  METHODS,
  RASTER_CELL_M,
  REGION_BOUNDS,
  ROAD_SNAP_MAX_KM,
  SEA_CLEARANCE,
  stageKey
} from "./lib/route-line-rules.mjs";
import { MODE } from "./lib/route-line-search.mjs";
import { createSurfaceModel, haversineKm, toMercator } from "./lib/route-line-surface.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(repositoryRoot, "data");
const locationsDirectory = path.join(dataDirectory, "locations");
const routesPath = path.join(dataDirectory, "routes", "routes.json");
const routeStopsPath = path.join(dataDirectory, "routes", "stops.json");
const routeLinesPath = path.join(dataDirectory, "geo", "routes-lines.geojson");
const roadsPath = path.join(dataDirectory, "geo", "ancient-roads.geojson");

const NE = Object.freeze({ land: "naturalearth:ne-10m-land", lakes: "naturalearth:ne-10m-lakes" });
const NE_VERSION =
  `naturalearth-commit:${NATURAL_EARTH_COMMIT};` +
  `path:${ROUTE_LINE_INPUTS.naturalEarthLand.upstreamPath} (sha256:${ROUTE_LINE_INPUTS.naturalEarthLand.sha256});` +
  `path:${ROUTE_LINE_INPUTS.naturalEarthLakes.upstreamPath} (sha256:${ROUTE_LINE_INPUTS.naturalEarthLakes.sha256})`;
const STOPS_VERSION = "stop sites: data/routes/stops.json and data/locations/*.json, each candidate's coordinateSource";
const GRID_TEXT =
  `A* in 8 directions on a grid of ${RASTER_CELL_M} m Web Mercator cells (about 0.4 km) made from Natural Earth 10 m land and lakes, ` +
  "then string-pulled and relaxed toward straight lines: each straight piece is kept only if an exact test against the vector coast finds no crossing";

const unique = (values) => [...new Set(values.filter(Boolean))];
const km2 = (value) => value.toFixed(2);

async function readLocationsById() {
  const entries = await fs.readdir(locationsDirectory, { withFileTypes: true });
  const records = new Map();
  for (const entry of entries.filter((item) => item.isFile() && item.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name))) {
    const location = await readJsonFile(path.join(locationsDirectory, entry.name));
    records.set(location.id, location);
  }
  return records;
}

// ---- Roads (AWMC's dated major roads, from data/geo/ancient-roads.geojson) ----

function buildRoadGraph(roadsData) {
  const nodes = new Map();
  const adjacency = new Map();
  const roads = new Map();
  const keyOf = ([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`;
  const ensure = (coordinate) => {
    const key = keyOf(coordinate);
    if (!nodes.has(key)) {
      nodes.set(key, coordinate);
      adjacency.set(key, []);
    }
    return key;
  };
  for (const feature of roadsData.features ?? []) {
    const roadId = feature.properties?.roadId;
    roads.set(roadId, feature.properties);
    const lines = feature.geometry?.type === "MultiLineString" ? feature.geometry.coordinates : [feature.geometry?.coordinates ?? []];
    for (const line of lines) {
      for (let index = 1; index < line.length; index += 1) {
        const left = ensure(line[index - 1]);
        const right = ensure(line[index]);
        const weight = haversineKm(line[index - 1], line[index]);
        adjacency.get(left).push({ to: right, weight, roadId });
        adjacency.get(right).push({ to: left, weight, roadId });
      }
    }
  }
  return { nodes, adjacency, roads };
}

function nearestRoadNode(coordinate, graph) {
  let best = null;
  for (const [key, node] of graph.nodes) {
    const distanceKm = haversineKm(coordinate, node);
    if (!best || distanceKm < best.distanceKm || (distanceKm === best.distanceKm && key < best.key)) best = { key, node, distanceKm };
  }
  return best && best.distanceKm <= ROAD_SNAP_MAX_KM ? best : null;
}

function shortestRoadPath(startKey, endKey, graph) {
  const distance = new Map([[startKey, 0]]);
  const previous = new Map();
  const done = new Set();
  const queue = [[0, startKey]];
  while (queue.length > 0) {
    queue.sort((left, right) => left[0] - right[0] || left[1].localeCompare(right[1]));
    const [here, key] = queue.shift();
    if (done.has(key)) continue;
    done.add(key);
    if (key === endKey) break;
    for (const edge of graph.adjacency.get(key) ?? []) {
      const candidate = here + edge.weight;
      if (candidate < (distance.get(edge.to) ?? Infinity)) {
        distance.set(edge.to, candidate);
        previous.set(edge.to, { key, roadId: edge.roadId });
        queue.push([candidate, edge.to]);
      }
    }
  }
  if (!distance.has(endKey)) return null;
  const keys = [endKey];
  const roadIds = [];
  for (let key = endKey; key !== startKey; key = previous.get(key).key) {
    keys.push(previous.get(key).key);
    roadIds.push(previous.get(key).roadId);
  }
  return { keys: keys.reverse(), roadIds: unique(roadIds.reverse()) };
}

// Each leg between consecutive stops on dated roads, or null if a leg has no road within reach.
function legsByRoad(points, graph) {
  const legs = [];
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const fromNode = nearestRoadNode(from.coordinate, graph);
    const toNode = nearestRoadNode(to.coordinate, graph);
    if (!fromNode || !toNode) return null;
    const route = shortestRoadPath(fromNode.key, toNode.key, graph);
    if (!route) return null;
    legs.push({
      from,
      to,
      coordinates: [from.coordinate, ...route.keys.map((key) => graph.nodes.get(key)), to.coordinate],
      roadIds: route.roadIds,
      joins: [
        { label: from.label, km: fromNode.distanceKm },
        { label: to.label, km: toNode.distanceKm }
      ]
    });
  }
  return legs;
}

// ---- Lines by land ----

function dedupe(coordinates) {
  return coordinates.filter(
    (coordinate, index) => index === 0 || coordinate[0] !== coordinates[index - 1][0] || coordinate[1] !== coordinates[index - 1][1]
  );
}

// Water crossed by a polyline outside the connectors allowed at stops, as stretches of vertex indices.
function waterStretches(model, coordinates, { startIsStop, endIsStop }) {
  const last = coordinates.length - 1;
  const bad = [];
  for (let index = 1; index <= last; index += 1) {
    const piece = [coordinates[index - 1], coordinates[index]];
    const measure = measureLine(model, MODE.LAND, piece);
    const runs = measure.runs;
    const forbidden = runs.some((run, position) => {
      if (!run.forbidden) return false;
      if (index === 1 && startIsStop && position === 0 && run.km <= CONNECTOR_MAX_KM) return false;
      if (index === last && endIsStop && position === runs.length - 1 && run.km <= CONNECTOR_MAX_KM) return false;
      return true;
    });
    if (forbidden) bad.push(index);
  }
  const onLand = (index) => model.classify(coordinates[index]) === 1;
  const stretches = [];
  for (const segment of bad) {
    let from = segment - 1;
    let to = segment;
    while (from > 0 && !onLand(from)) from -= 1;
    while (to < last && !onLand(to)) to += 1;
    const previous = stretches[stretches.length - 1];
    if (previous && from <= previous.to) previous.to = Math.max(previous.to, to);
    else stretches.push({ from, to });
  }
  return stretches;
}

function landPath(model, start, end) {
  const result = findPath(model, {
    mode: MODE.LAND,
    start,
    end,
    penalty: LAND_CLEARANCE,
    margins: [40, 120, 400]
  });
  if (!result) throw new Error(`No path over land from ${JSON.stringify(start.coordinate)} to ${JSON.stringify(end.coordinate)}`);
  return result.coordinates;
}

function buildLandLine(model, graph, stops) {
  const points = [stops.from, ...stops.via, stops.to];
  const roadLegs = legsByRoad(points, graph);
  const legs = roadLegs ?? points.slice(1).map((to, index) => ({ from: points[index], to, coordinates: [points[index].coordinate, to.coordinate] }));
  const changes = [];
  let routedLegs = 0;
  const pieces = [];
  for (const leg of legs) {
    let coordinates = leg.coordinates;
    const stretches = waterStretches(model, coordinates, { startIsStop: true, endIsStop: true });
    for (const stretch of [...stretches].reverse()) {
      const startIsStop = stretch.from === 0;
      const endIsStop = stretch.to === coordinates.length - 1;
      const replaced = coordinates.slice(stretch.from, stretch.to + 1);
      const detour = landPath(
        model,
        { coordinate: coordinates[stretch.from], isStop: startIsStop },
        { coordinate: coordinates[stretch.to], isStop: endIsStop }
      );
      routedLegs += 1;
      const overWater = measureLine(model, MODE.LAND, replaced).runs.filter((run) => run.forbidden).reduce((sum, run) => sum + run.km, 0);
      changes.push({
        kind: roadLegs ? "road-over-water-replaced" : "shortest-over-land",
        detail: roadLegs
          ? `Between ${leg.from.label} and ${leg.to.label}, AWMC's road runs ${km2(overWater)} km over Natural Earth's water; that stretch (${km2(polylineKm(replaced))} km) follows the shortest path over land instead (${km2(polylineKm(detour))} km). ${GRID_TEXT}.`
          : `The straight line from ${leg.from.label} to ${leg.to.label} would cross ${km2(overWater)} km of open water, so this leg follows the shortest path over land (${km2(polylineKm(detour))} km against ${km2(polylineKm(replaced))} km straight; ADR-0038, update of 2026-10-14, item 2). ${GRID_TEXT}.`,
        sources: [NE.land, NE.lakes]
      });
      coordinates = [...coordinates.slice(0, stretch.from), ...detour, ...coordinates.slice(stretch.to + 1)];
    }
    pieces.push(...(pieces.length > 0 ? coordinates.slice(1) : coordinates));
    if (roadLegs) {
      for (const join of leg.joins) {
        if (join.km >= 0.05) {
          changes.push({
            kind: "road-join",
            detail: `${join.label}'s site is ${km2(join.km)} km from the nearest vertex of a dated road; the line joins them straight.`,
            sources: [NE.land]
          });
        }
      }
    }
  }
  const coordinates = dedupe(pieces);
  if (roadLegs) {
    const roadIds = unique(legs.flatMap((leg) => leg.roadIds));
    const awmcIds = unique(roadIds.flatMap((roadId) => graph.roads.get(roadId)?.provenance?.upstreamFeatureIds ?? []));
    return {
      method: METHODS.ROAD,
      coordinates,
      roadIds,
      awmcIds,
      roadVersion: graph.roads.get(roadIds[0])?.provenance?.version,
      changes: [
        {
          kind: METHODS.ROAD,
          detail: `Each leg between the stops follows the shortest path along AWMC's major roads of the Roman period that the ancient layer draws (data/geo/ancient-roads.geojson: ${roadIds.join(", ")}), joined to each stop within ${ROAD_SNAP_MAX_KM} km (ADR-0038 item 5).`,
          sources: awmcIds
        },
        ...changes
      ]
    };
  }
  const method = routedLegs > 0 ? METHODS.SHORTEST_LAND : METHODS.STRAIGHT_LAND;
  return {
    method,
    coordinates,
    changes: [
      {
        kind: method,
        detail: method === METHODS.STRAIGHT_LAND
          ? "No dated road links the stops, so each leg is a straight line between the stops' sites, which keeps to land: an exact test against Natural Earth 10 m land and lakes finds no water crossed (ADR-0038 item 5)."
          : "No dated road links the stops, and a straight line would cross open water, so the line follows land where it must (ADR-0038, update of 2026-10-14, item 2); legs that stay on land are straight.",
        sources: [NE.land, NE.lakes]
      },
      ...changes
    ]
  };
}

// ---- Lines by sea ----

function buildSeaLine(model, key, stops, resolveStopKey) {
  const sidePasses = sidePassesFor(key, resolveStopKey);
  const passes = planSeaPasses(model, { via: stops.via, sidePasses, useSides: true, islandVias: ISLAND_VIAS });
  const result = findSeaPath(model, {
    from: stops.from.coordinate,
    to: stops.to.coordinate,
    passes,
    penalty: SEA_CLEARANCE
  });
  if (!result) throw new Error(`No path over water for ${key}`);
  const changes = [
    {
      kind: METHODS.SEA,
      detail:
        `The shortest path over water from ${stops.from.label} to ${stops.to.label}` +
        (stops.via.length > 0 ? `, passing ${stops.via.map((via) => via.label).join(", then ")} in order` : "") +
        ` (ADR-0038, update of 2026-10-14, item 1). ${GRID_TEXT}; the path keeps ${SEA_CLEARANCE.keepM / 1000} km off the coast where the water allows, less only in a narrower passage or near a stop.`,
      sources: [NE.land, NE.lakes]
    }
  ];
  const positions = passPositions(model, result.coordinates, passes);
  for (const pass of positions) {
    if (pass.kind === "gate") {
      changes.push({ kind: "side-of-island", detail: pass.rule.detail, sources: unique([...pass.rule.sources, NE.land]) });
      continue;
    }
    const via = stops.via.find((stop) => stop.key === pass.key);
    changes.push({
      kind: "place-passed",
      detail: `Passes ${via.label} ${pass.kind === "island" ? "(an island: within " + pass.radiusKm + " km of its coast)" : "(within " + pass.radiusKm + " km of its site)"}, ${pass.distanceKm.toFixed(1)} km away at the nearest.`,
      sources: unique([via.coordinateSource, NE.land])
    });
  }
  const reason = DETOUR_REASONS.get(key);
  if (reason) changes.push({ kind: "detour-reason", detail: reason.detail, sources: reason.sources });
  return { method: METHODS.SEA, coordinates: result.coordinates, changes };
}

// ---- Provenance ----

function connectorChanges(model, mode, coordinates, stops) {
  if (mode === "unknown") return [];
  const { startConnectorKm, endConnectorKm } = connectorsAndCrossings(measureLine(model, mode, coordinates));
  const wrong = mode === MODE.SEA ? "land" : "water";
  const right = mode === MODE.SEA ? "the water" : "land";
  const changes = [];
  for (const [end, km, stop] of [
    ["start", startConnectorKm, stops.from],
    ["end", endConnectorKm, stops.to]
  ]) {
    if (km <= 0) continue;
    const away = mode === MODE.SEA ? stopAwayFromWater(model, stop.coordinate) : null;
    if (away) {
      changes.push({
        kind: `${end}-approach`,
        detail: `${stop.label}'s site (${stop.coordinateSource}) lies ${away.distanceKm.toFixed(2)} km from Natural Earth's nearest ${away.shore.isLake ? "lake shore" : "coast"}, ${away.shore.isLake ? "inland" : "inland or inside an island"}, so the line goes by sea to the coast nearest the site and ${end === "start" ? "leaves it" : "reaches it"} by a straight approach of ${connectorChangeDetail(km)} over land, which crosses no water (ADR-0038, update of 2026-10-14, "stops away from the water").`,
        sources: unique([stop.coordinateSource, NE.land, NE.lakes])
      });
      continue;
    }
    const kind = `${end}-connector`;
    changes.push({
      kind,
      detail: `${stop.label}'s site (${stop.coordinateSource}) lies ${mode === MODE.SEA ? "inland of" : "in the water by"} Natural Earth's ${mode === MODE.SEA ? "coast" : "shore"}: the line ${end === "start" ? "leaves it" : "reaches it"} by a straight connector of ${connectorChangeDetail(km)} over ${wrong} between the site and ${right}.`,
      sources: unique([stop.coordinateSource, NE.land, NE.lakes])
    });
  }
  return changes;
}

function provenanceFor(line, stops, mode) {
  const ends = [stops.from, ...stops.via, stops.to];
  const endSources = unique(ends.map((stop) => stop.coordinateSource));
  const sitesChange = {
    kind: "stop-sites",
    detail: `Ends at the sites of ${stops.from.label} (${stops.from.coordinateSource}) and ${stops.to.label} (${stops.to.coordinateSource})` +
      (mode === MODE.LAND && stops.via.length > 0 ? `, through ${stops.via.map((via) => `${via.label} (${via.coordinateSource})`).join(" and ")}` : "") +
      (mode === MODE.SEA && stops.via.length > 0 ? `; places passed: ${stops.via.map((via) => `${via.label} (${via.coordinateSource})`).join(", ")}` : "") +
      ": each stage's chosen candidate (ADR-0038 item 4).",
    sources: endSources
  };
  const changes = [...line.changes, sitesChange, ...connectorChanges(line.model, mode, line.coordinates, stops)];
  if (line.method === METHODS.UNKNOWN) {
    return { dataset: "The stops' sites only (path not known)", version: STOPS_VERSION, upstreamFeatureIds: endSources, changes };
  }
  if (line.method === METHODS.ROAD) {
    return {
      dataset: "AWMC Geodata's dated major roads (data/geo/ancient-roads.geojson), Natural Earth 10 m land and 10 m lakes, and the stops' sites",
      version: `awmc-${line.roadVersion ?? `commit:${AWMC_COMMIT}`}; ${NE_VERSION}; ${STOPS_VERSION}`,
      upstreamFeatureIds: unique([...line.awmcIds, NE.land, NE.lakes, ...endSources]),
      changes
    };
  }
  return {
    dataset: line.method === METHODS.STRAIGHT_LAND
      ? "The stops' sites, tested against Natural Earth 10 m land and 10 m lakes"
      : "Natural Earth 10 m land and 10 m lakes, and the stops' sites",
    version: `${NE_VERSION}; ${STOPS_VERSION}`,
    upstreamFeatureIds: unique([NE.land, NE.lakes, ...endSources]),
    changes
  };
}

// ---- Main ----

async function writePreviews(model, routesData, features, modeByKey, previewsDirectory) {
  const previews = [];
  const lineOf = (feature) => ({ coordinates: feature.geometry.coordinates, mode: modeByKey.get(stageKey(feature.properties.routeId, feature.properties.stageId)) });
  const stopsOf = (list) => list.flatMap((feature) => [feature.geometry.coordinates[0], feature.geometry.coordinates.at(-1)]);
  for (const route of routesData.routes ?? []) {
    const routeFeatures = features.filter((feature) => feature.properties.routeId === route.id);
    if (routeFeatures.length === 0) continue;
    const all = routeFeatures.flatMap((feature) => feature.geometry.coordinates);
    const lons = all.map((coordinate) => coordinate[0]);
    const lats = all.map((coordinate) => coordinate[1]);
    const padLon = Math.max(0.3, (Math.max(...lons) - Math.min(...lons)) * 0.08);
    const padLat = Math.max(0.3, (Math.max(...lats) - Math.min(...lats)) * 0.08);
    const extent = { minLon: Math.min(...lons) - padLon, maxLon: Math.max(...lons) + padLon, minLat: Math.min(...lats) - padLat, maxLat: Math.max(...lats) + padLat };
    const zoom = zoomToFit(extent, 1600);
    previews.push(await writePreviewPng({
      filePath: path.join(previewsDirectory, `${route.id}.png`),
      model, extent, zoom, pixelRatio: 1,
      lines: routeFeatures.map(lineOf), stops: stopsOf(routeFeatures),
      title: `${route.id}: Web Mercator, zoom ${zoom.toFixed(1)}`
    }));
  }
  const windows = [
    ["aegean-z7", { minLon: 22.0, maxLon: 29.6, minLat: 35.0, maxLat: 41.3 }],
    ["holy-land-z7", { minLon: 34.2, maxLon: 36.6, minLat: 31.0, maxLat: 33.8 }],
    ["crete-z7", { minLon: 23.2, maxLon: 26.9, minLat: 34.3, maxLat: 35.9 }],
    ["cyprus-z7", { minLon: 31.8, maxLon: 36.4, minLat: 33.0, maxLat: 36.6 }]
  ];
  for (const [id, extent] of windows) {
    previews.push(await writePreviewPng({
      filePath: path.join(previewsDirectory, `${id}.png`),
      model, extent, zoom: 7, pixelRatio: 2,
      lines: features.map(lineOf), stops: stopsOf(features),
      title: `${id}: Web Mercator, zoom 7 at 2x (${(metresPerPixelAtZoom(7) / 1000).toFixed(2)} km per zoom-7 pixel at the equator)`
    }));
  }
  return previews;
}

async function main() {
  const cache = ancientGeoCache(process.env.ROUTE_LINES_CACHE || path.join(os.tmpdir(), "ibm-route-lines"));
  await fs.mkdir(cache.inputs, { recursive: true });
  await fs.rm(cache.report, { recursive: true, force: true });
  await fs.mkdir(cache.previews, { recursive: true });

  const [locationsById, routesData, routeStopsData, roadsData] = await Promise.all([
    readLocationsById(),
    readJsonFile(routesPath),
    readJsonFile(routeStopsPath),
    readJsonFile(roadsPath)
  ]);
  const routeStopsById = new Map((routeStopsData.stops ?? []).map((stop) => [stop.id, stop]));
  const inputs = await fetchPinnedRouteLineInputs(cache.inputs);
  const [land, lakes] = await Promise.all([readJsonFile(inputs.naturalEarthLand), readJsonFile(inputs.naturalEarthLakes)]);
  const model = createSurfaceModel({ land, lakes, bounds: REGION_BOUNDS });
  const graph = buildRoadGraph(roadsData);
  const lookup = { getLocation: (id) => locationsById.get(id), getStop: (id) => routeStopsById.get(id) };
  const resolveStopKey = stopKeyResolver(lookup);

  const features = [];
  const modeByKey = new Map();
  for (const route of routesData.routes ?? []) {
    for (const stage of route.stages ?? []) {
      const key = stageKey(route.id, stage.id);
      modeByKey.set(key, stage.travelMode);
      if (typeof stage.noLineReason === "string") {
        delete stage.lineId;
        continue;
      }
      const stops = resolveStageStops(stage, lookup);
      if (!stops) throw new Error(`${key}: a stop has no site`);
      const started = Date.now();
      let line;
      if (stage.travelMode === "sea") line = buildSeaLine(model, key, stops, resolveStopKey);
      else if (stage.travelMode === "land") line = buildLandLine(model, graph, stops);
      else {
        line = {
          method: METHODS.UNKNOWN,
          coordinates: [stops.from.coordinate, stops.to.coordinate],
          changes: [{
            kind: METHODS.UNKNOWN,
            detail: "The text gives no path for this stage, so the line is straight between the stops' sites and claims no path (ADR-0038 item 1; update of 2026-10-14, item 2).",
            sources: unique([stops.from.coordinateSource, stops.to.coordinateSource])
          }]
        };
      }
      if (stage.travelMode !== "unknown") {
        const mode = stage.travelMode === "sea" ? MODE.SEA : MODE.LAND;
        const { startConnectorKm, endConnectorKm } = connectorsAndCrossings(measureLine(model, mode, line.coordinates));
        const bad = verifySegments(model, mode, line.coordinates, { startAllowanceKm: startConnectorKm, endAllowanceKm: endConnectorKm });
        if (bad) throw new Error(`${key}: segment ${bad} crosses the wrong surface away from the connectors (a builder bug)`);
      }
      line.model = model;
      const lineId = `${route.id}-${stage.id}`;
      stage.lineId = lineId;
      features.push({
        type: "Feature",
        properties: { lineId, routeId: route.id, stageId: stage.id, provenance: provenanceFor(line, stops, stage.travelMode === "sea" ? MODE.SEA : stage.travelMode === "land" ? MODE.LAND : "unknown") },
        geometry: { type: "LineString", coordinates: line.coordinates }
      });
      if (process.env.ROUTE_LINES_DEBUG === "1") console.error(`${key}: ${line.method}, ${line.coordinates.length} vertices, ${Date.now() - started} ms`);
    }
  }
  features.sort((left, right) => `${left.properties.routeId}::${left.properties.stageId}`.localeCompare(`${right.properties.routeId}::${right.properties.stageId}`));

  await fs.writeFile(routesPath, `${JSON.stringify(routesData, null, 2)}\n`, "utf8");
  await fs.writeFile(routeLinesPath, `${JSON.stringify({ type: "FeatureCollection", features }, null, 2)}\n`, "utf8");

  const { rows, totals } = auditRouteLines({ model, routesData, linesData: { features }, lookup, roadsData });
  const previews = await writePreviews(model, routesData, features, modeByKey, cache.previews);
  const report = [
    "# Route-line build report",
    "",
    "## Audit",
    "",
    formatAuditTotals(totals),
    "",
    formatAuditTable(rows),
    "",
    "## Previews (Web Mercator, equal scaling, land and lakes filled)",
    ...previews.map((preview) => `- ${preview.filePath} (${preview.width}×${preview.height}, zoom ${preview.zoom.toFixed(1)}, ${preview.pixelRatio}x)`)
  ].join("\n");
  const reportPath = path.join(cache.report, "route-lines-report.md");
  await fs.writeFile(reportPath, `${report}\n`, "utf8");

  console.log(`Wrote ${features.length} route lines to ${path.relative(repositoryRoot, routeLinesPath)}`);
  console.log(formatAuditTotals(totals));
  console.log(`Report and previews: ${reportPath}`);
  if (totals.failing > 0) {
    console.error(`Route-line audit: ${totals.failing} of ${totals.lines} lines fail (see the report; npm run check:route-lines prints the table).`);
    process.exitCode = 3;
  }
}

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
