import type { AncientTimelinePayload } from "./ancient-layer.types";
import type { MapDisplayMode, PinLabelSource, PlaceIndexRecord, PlaceSelection } from "./types";
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
  routeKeyboardPlaceIds: string[];
  routeOverlayHiddenPlaceIds: string[];
  routeOverlayHiddenPlaceIdsKey: string;
  onSelectRouteMapEntry: (
    entry:
      | { kind: "line"; routeId: string; stageId: string; stageIndex: number }
      | {
          kind: "stop";
          routeId: string;
          stageId: string;
          stageIndex: number;
          stopKind: "location" | "route-stop";
          stopId: string;
        }
  ) => void;
  onAncientLayerLoadStateChange: (state: "idle" | "loading" | "ready" | "error") => void;
  pinLabelSource: PinLabelSource;
  onSelectPlace: (selection: PlaceSelection) => void;
}
