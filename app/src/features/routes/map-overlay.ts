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
  stageLabel: string;
  travelMode: "land" | "sea" | "unknown";
  isInSelectedRoute: true;
  isSelectedStage: boolean;
  isHighlightedStage: boolean;
  isDimmed: boolean;
}

export interface RouteMapPointFeatureProperties {
  id: string;
  routeId: string;
  stageId: string;
  stageIndex: number;
  kind: "stop" | "via" | "mentioned" | "stage-pill";
  stopKind: "location" | "route-stop";
  stopId: string;
  label: string;
  isInSelectedRoute: true;
  isSelectedStage: boolean;
  isHighlightedStage: boolean;
  isDimmed: boolean;
  isSelectedPlace: boolean;
  isRouteStart?: boolean;
  stagePillVariant?: "standard" | "lineless-floating";
  stagePillOffsetSlot?: number;
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
  routeFocusKey: string | null;
  selectedStageFocusKey: string | null;
  selectedStageCenter: Coordinates | null;
}
