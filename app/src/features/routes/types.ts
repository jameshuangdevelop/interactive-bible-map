import type { BibliographyEntry, Confidence, Coordinates, PlaceIndexRecord, ScriptureEntry, SourceId } from "../map/types";

export type RouteStructure = "connected" | "standalone-segments";
export type RouteTravelMode = "land" | "sea" | "unknown";

export interface RouteStopRef {
  kind: "location" | "route-stop";
  locationId?: string;
  stopId?: string;
  candidateIndex?: number;
}

export interface RouteNamedRegion {
  name: string;
  locationId?: string;
  sources: SourceId[];
}

export interface RouteAttestation {
  gospels: string[];
  rule: string;
  sources: SourceId[];
}

export interface RouteStageRecord {
  id: string;
  from: RouteStopRef;
  to: RouteStopRef;
  via?: RouteStopRef[];
  mentioned?: RouteStopRef[];
  scripture: ScriptureEntry[];
  travelMode: RouteTravelMode;
  namedRegions?: RouteNamedRegion[];
  attestation?: RouteAttestation;
  lineId?: string;
  noLineReason?: string;
  sources: SourceId[];
}

export interface RouteIndexEntry {
  id: string;
  title: string;
  fromYear: number;
  toYear: number;
  structure: RouteStructure;
  summary: string;
  bibleText: string;
  notes: string[];
  stageCount: number;
  sources: SourceId[];
}

export interface RoutesIndexPayload {
  version: 1;
  routeCount: number;
  routes: RouteIndexEntry[];
  bibliography: BibliographyEntry[];
}

export interface RouteStagesPayload {
  version: 1;
  routes: {
    id: string;
    stages: RouteStageRecord[];
  }[];
}

export interface RouteStopCandidate {
  label: string;
  coordinates: Coordinates;
  coordinateSource: SourceId;
  confidence: Confidence;
  support: string;
  sources: SourceId[];
}

export interface RouteStopRecord {
  id: string;
  name: string;
  todayName?: string;
  candidates: RouteStopCandidate[];
  scripture: ScriptureEntry[];
  sources: SourceId[];
  status: "draft" | "verified";
}

export interface RouteStopsPayload {
  version: 1;
  stops: RouteStopRecord[];
}

export interface RouteLineFeatureProperties {
  lineId: string;
  routeId: string;
  stageId: string;
}

export interface RouteLineFeature {
  type: "Feature";
  properties: RouteLineFeatureProperties;
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
}

export interface RouteLinesPayload {
  type: "FeatureCollection";
  features: RouteLineFeature[];
}

export interface HydratedRoute {
  route: RouteIndexEntry;
  stages: RouteStageRecord[];
}

export interface LoadedRoutesData {
  index: RoutesIndexPayload;
  stops: RouteStopsPayload;
  lines: RouteLinesPayload;
  routes: HydratedRoute[];
  bibliographyById: Map<string, BibliographyEntry>;
}

export interface RouteStopResolved {
  id: string;
  kind: "location" | "route-stop";
  name: string;
  coordinates: Coordinates | null;
  place: PlaceIndexRecord | null;
  stop: RouteStopRecord | null;
}
