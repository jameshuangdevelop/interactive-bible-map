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
  pinLabelSource: PinLabelSource;
  onSelectPlace: (selection: PlaceSelection) => void;
}
