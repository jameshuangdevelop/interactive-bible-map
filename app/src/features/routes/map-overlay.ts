import type { Coordinates } from "../map/types";
import type {
  FeatureCollection,
  LineStringGeometry,
  MultiLineStringGeometry
} from "../map/ancient-layer.types";

export interface RouteMapLineFeatureProperties {
  routeId: string;
  stageId: string;
  stageIndex: number;
  travelMode: "land" | "sea" | "unknown";
  isPathUnknown: boolean;
  isInSelectedRoute: boolean;
  isSelectedStage: boolean;
  isHighlightedStage: boolean;
}

export interface RouteMapPointFeatureProperties {
  id: string;
  routeId: string;
  stageId: string;
  stageIndex: number;
  kind: "stop" | "via";
  stopKind: "location" | "route-stop";
  stopId: string;
  label: string;
  isInSelectedRoute: boolean;
  isSelectedStage: boolean;
  isHighlightedStage: boolean;
  orderLabel?: string;
}

export interface RouteMapOverlayData {
  lines: FeatureCollection<LineStringGeometry | MultiLineStringGeometry, RouteMapLineFeatureProperties>;
  points: {
    type: "FeatureCollection";
    features: {
      type: "Feature";
      properties: RouteMapPointFeatureProperties;
      geometry: {
        type: "Point";
        coordinates: Coordinates;
      };
    }[];
  };
  bounds: [Coordinates, Coordinates] | null;
  focusKey: string | null;
  hideBasePlaces: boolean;
}
