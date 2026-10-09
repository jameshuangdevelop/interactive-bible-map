export type TimelineYear = number;

export interface GeometryBase {
  type: string;
  coordinates: unknown;
}

export interface FeatureCollection<Geometry extends GeometryBase, Properties> {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Properties;
    geometry: Geometry;
  }[];
}

export interface LineStringGeometry extends GeometryBase {
  type: "LineString";
  coordinates: number[][];
}

export interface MultiLineStringGeometry extends GeometryBase {
  type: "MultiLineString";
  coordinates: number[][][];
}

export interface PolygonGeometry extends GeometryBase {
  type: "Polygon";
  coordinates: number[][][];
}

export interface MultiPolygonGeometry extends GeometryBase {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export interface AncientStopRecord {
  id: string;
  year: TimelineYear;
  title: string;
  summary: string;
  scripture: string[];
  sources: string[];
}

export interface AncientEntityRecord {
  id: string;
  name: string;
  kind:
    | "roman-province"
    | "client-kingdom"
    | "client-tetrarchy"
    | "free-city-or-league"
    | "outside-empire"
    | "uncertain";
  romanSide: boolean;
  locationId: string | null;
}

export interface AncientTimelinePayload {
  version: number;
  range: {
    fromYear: TimelineYear;
    toYear: TimelineYear;
    defaultYear: TimelineYear;
  };
  defaultStopId: string | null;
  stops: AncientStopRecord[];
  bibliography: {
    id: string;
    type: "book" | "article" | "chapter" | "web" | "dataset";
    title: string;
    authors: string[];
    year: number;
    publisher?: string;
    journal?: string;
    containerTitle?: string;
    doi?: string;
    isbn?: string;
    url?: string;
    accessed?: string;
  }[];
  entities: AncientEntityRecord[];
}

export interface AncientAreaAssignment {
  areaId: string;
  holderId: string;
  holderKind: AncientEntityRecord["kind"];
  holderRomanSide: boolean;
  holderLocationId: string | null;
  ruler: string | null;
  heldFromYear: TimelineYear;
  heldToYear: TimelineYear;
  heldFromKnown: boolean;
  note: string | null;
  hasShape: boolean;
}

export interface AncientHolderBorderFeatureProperties {
  holderAId: string;
  holderAKind: AncientEntityRecord["kind"];
  holderARomanSide: boolean;
  holderBId: string;
  holderBKind: AncientEntityRecord["kind"];
  holderBRomanSide: boolean;
}

export interface AncientHolderLabelPoint {
  holderId: string;
  name: string;
  labelText: string;
  minZoom: number;
  kind: AncientEntityRecord["kind"];
  romanSide: boolean;
  locationId: string | null;
  labelPoint: [number, number];
}

export interface AncientStopPayload {
  stopId: string;
  year: TimelineYear;
  areas: AncientAreaAssignment[];
  holderBorders: FeatureCollection<
    MultiLineStringGeometry | LineStringGeometry,
    AncientHolderBorderFeatureProperties
  >;
  romanEmpireEdge: MultiLineStringGeometry | LineStringGeometry | null;
  holderLabels: AncientHolderLabelPoint[];
}

export interface AncientShapesPayload {
  areas: FeatureCollection<PolygonGeometry | MultiPolygonGeometry, { areaId: string }>;
  areasSimplifiedForZoom10: FeatureCollection<
    PolygonGeometry | MultiPolygonGeometry,
    { areaId: string }
  >;
}
