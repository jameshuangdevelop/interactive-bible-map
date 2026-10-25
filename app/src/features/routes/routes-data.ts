import type { Coordinates, PlaceIndexRecord } from "../map/types";
import type {
  HydratedRoute,
  LoadedRoutesData,
  RouteLineFeature,
  RouteLinesPayload,
  RouteStageRecord,
  RouteStopRecord,
  RouteStopResolved,
  RouteStopRef,
  RouteStopsPayload,
  RouteStagesPayload,
  RoutesIndexPayload
} from "./types";

function fixtureModeAllowed() {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function resolveRoutesPrefix(search: string) {
  if (!fixtureModeAllowed()) {
    return "routes";
  }

  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parameters.get("routesData")?.trim().toLowerCase() === "fixture"
    ? "routes.fixture"
    : "routes";
}

async function fetchJson<T>(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status})`);
  }
  return (await response.json()) as T;
}

function coerceRoutesIndex(payload: RoutesIndexPayload): RoutesIndexPayload {
  return {
    version: 1,
    routeCount: Array.isArray(payload.routes) ? payload.routes.length : 0,
    routes: Array.isArray(payload.routes) ? payload.routes : [],
    bibliography: Array.isArray(payload.bibliography) ? payload.bibliography : []
  };
}

function coerceStagesPayload(payload: RouteStagesPayload): RouteStagesPayload {
  return {
    version: 1,
    routes: Array.isArray(payload.routes) ? payload.routes : []
  };
}

function coerceStopsPayload(payload: RouteStopsPayload): RouteStopsPayload {
  return {
    version: 1,
    stops: Array.isArray(payload.stops) ? payload.stops : []
  };
}

function coerceLinesPayload(payload: RouteLinesPayload): RouteLinesPayload {
  return {
    type: "FeatureCollection",
    features: Array.isArray(payload.features) ? payload.features : []
  };
}

function hydrateRoutes(index: RoutesIndexPayload, stagesPayload: RouteStagesPayload): HydratedRoute[] {
  const stagesByRouteId = new Map(stagesPayload.routes.map((route) => [route.id, route.stages] as const));
  return index.routes.map((route) => ({
    route,
    stages: stagesByRouteId.get(route.id) ?? []
  }));
}

export async function loadRoutesData(search: string): Promise<LoadedRoutesData> {
  const prefix = resolveRoutesPrefix(search);
  const [indexPayload, stagesPayload, stopsPayload, linesPayload] =
    await Promise.all([
      fetchJson<RoutesIndexPayload>(`/generated/${prefix}.routes.json`),
      fetchJson<RouteStagesPayload>(`/generated/${prefix}.stages.json`),
      fetchJson<RouteStopsPayload>(`/generated/${prefix}.stops.json`),
      fetchJson<RouteLinesPayload>(`/generated/${prefix}.lines.geojson`)
    ]);

  const index = coerceRoutesIndex(indexPayload);
  const stages = coerceStagesPayload(stagesPayload);
  const stops = coerceStopsPayload(stopsPayload);
  const lines = coerceLinesPayload(linesPayload);
  return {
    index,
    stops,
    lines,
    routes: hydrateRoutes(index, stages),
    bibliographyById: new Map(index.bibliography.map((entry) => [entry.id, entry] as const))
  };
}

export function resolveRouteStop(
  reference: RouteStopRef,
  placesById: Map<string, PlaceIndexRecord>,
  stopsById: Map<string, RouteStopRecord>
): RouteStopResolved {
  if (reference.kind === "location" && reference.locationId) {
    const place = placesById.get(reference.locationId) ?? null;
    const coordinates =
      place && place.candidates.length > 0
        ? place.candidates[Math.max(0, Math.min(reference.candidateIndex ?? 0, place.candidates.length - 1))]
            .coordinates
        : null;
    return {
      id: reference.locationId,
      kind: "location",
      name: place?.names.ancient[0] ?? reference.locationId,
      coordinates,
      place,
      stop: null
    };
  }

  const stopId = reference.stopId ?? "";
  const stop = stopsById.get(stopId) ?? null;
  const coordinates =
    stop && stop.candidates.length > 0
      ? stop.candidates[Math.max(0, Math.min(reference.candidateIndex ?? 0, stop.candidates.length - 1))]
          .coordinates
      : null;
  return {
    id: stopId,
    kind: "route-stop",
    name: stop?.name ?? stopId,
    coordinates,
    place: null,
    stop
  };
}

export function routeLineFeatureByStage(
  lines: RouteLinesPayload,
  routeId: string,
  stageId: string,
  lineId: string | undefined
): RouteLineFeature | null {
  if (!lineId) {
    return null;
  }

  return (
    lines.features.find(
      (feature) =>
        feature.properties.routeId === routeId &&
        feature.properties.stageId === stageId &&
        feature.properties.lineId === lineId
    ) ?? null
  );
}

export function stageLabelNumber(routeStructure: "connected" | "standalone-segments", stageIndex: number) {
  return routeStructure === "standalone-segments" ? `Segment ${stageIndex + 1}` : `Stage ${stageIndex + 1}`;
}

function hasSeveralSites(resolved: RouteStopResolved) {
  const candidates = resolved.kind === "route-stop" ? resolved.stop?.candidates : resolved.place?.candidates;
  return (candidates?.length ?? 0) > 1;
}

// Where a stage without a line shows its number (ADR-0041's 2026-10-24 update): on the end whose site
// isn't disputed; with both ends disputed, or neither, on the destination. If that end has no
// coordinates, the other end's are used.
export function linelessStagePillCoordinate(
  stage: Pick<RouteStageRecord, "from" | "to">,
  placesById: Map<string, PlaceIndexRecord>,
  stopsById: Map<string, RouteStopRecord>
): Coordinates | null {
  const from = resolveRouteStop(stage.from, placesById, stopsById);
  const to = resolveRouteStop(stage.to, placesById, stopsById);
  const anchor = hasSeveralSites(to) && !hasSeveralSites(from) ? from : to;
  const other = anchor === to ? from : to;
  return anchor.coordinates ?? other.coordinates ?? null;
}

export function stageHasDisputedStop(stage: RouteStageRecord, stopsById: Map<string, RouteStopRecord>) {
  const end = stage.to;
  if (end.kind !== "route-stop" || !end.stopId) {
    return false;
  }

  const stop = stopsById.get(end.stopId);
  if (!stop) {
    return false;
  }

  return stop.candidates.some((candidate) => candidate.confidence === "disputed");
}
