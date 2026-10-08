import type { AncientTimelinePayload } from "./ancient-layer.types";
import type { MapDisplayMode, PinLabelSource, PlaceIndexRecord, PlaceSelection } from "./types";

export interface MapViewProps {
  places: PlaceIndexRecord[];
  selection: PlaceSelection | null;
  highlightedPlaceId: string | null;
  leftPanelWidth: number;
  bottomPanelInset: number;
  isSmallScreen: boolean;
  mapMode: MapDisplayMode;
  selectedTimelineStopId: string | null;
  ancientTimeline: AncientTimelinePayload | null;
  ancientLayerRetryToken: number;
  onAncientLayerLoadStateChange: (state: "idle" | "loading" | "ready" | "error") => void;
  pinLabelSource: PinLabelSource;
  onSelectPlace: (selection: PlaceSelection) => void;
}
