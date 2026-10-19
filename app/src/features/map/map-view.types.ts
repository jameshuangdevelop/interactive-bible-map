import type { AncientTimelinePayload } from "./ancient-layer.types";
import type {
  MapDisplayMode,
  PinLabelSource,
  PlaceIndexRecord,
  PlaceSelection,
  SelectionOrigin
} from "./types";
import type { RouteMapOverlayData } from "../routes/map-overlay";

export interface MapViewProps {
  places: PlaceIndexRecord[];
  selection: PlaceSelection | null;
  highlightedPlaceId: string | null;
  leftPanelWidth: number;
  bottomPanelInset: number;
  timelineOverlayInset: number;
  isSmallScreen: boolean;
  mapMode: MapDisplayMode;
  selectedTimelineStopId: string | null;
  ancientTimeline: AncientTimelinePayload | null;
  ancientLayerRetryToken: number;
  routesOverlay: RouteMapOverlayData | null;
  routeKeyboardEntries: {
    id: string;
    label: string;
    coordinates: [number, number];
    routeId: string;
    stageId: string;
    stageIndex: number;
    stopKind: "location" | "route-stop";
    stopId: string;
  }[];
  selectedRouteStopFocusKey: string | null;
  selectedRouteStopCoordinates: [number, number] | null;
  selectionOrigin: SelectionOrigin;
  onSelectRouteMapEntry: (
    entry:
      | { kind: "line"; routeId: string; stageId: string; stageIndex: number; origin: "map-line" }
      | {
          kind: "stop";
          routeId: string;
          stageId: string;
          stageIndex: number;
          stopKind: "location" | "route-stop";
          stopId: string;
          origin: "map-dot" | "keyboard-visible-place";
        }
  ) => void;
  onAncientLayerLoadStateChange: (state: "idle" | "loading" | "ready" | "error") => void;
  pinLabelSource: PinLabelSource;
  onSelectPlace: (
    selection: PlaceSelection,
    origin: "map-name" | "map-candidate" | "keyboard-visible-place"
  ) => void;
}
