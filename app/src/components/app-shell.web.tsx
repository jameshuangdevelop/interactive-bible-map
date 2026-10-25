import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent
} from "react";

import { SearchMenu } from "./search-menu";
import { SmallScreenSheetTopStrip } from "./small-screen-sheet-top-strip.web";
import { PlacePanel } from "../features/place-panel/place-panel.web";
import { formatSourceCitation } from "../features/place-panel/source-format";
import { sortPlacesByImportance } from "../features/map/place-importance";
import { computeTimelineSourcesPopoverMaxHeight } from "../features/map/overlay-layout";
import {
  resolveSheetReleaseVelocity,
  settleSmallScreenSheetPosition,
  sheetHeightForPosition,
  type SmallScreenSheetPosition
} from "./small-screen-sheet-settle";
import {
  applyRouteIdToSearch,
  applyRouteStageToSearch,
  applyViewTabToSearch,
  applyMapModeToSearch,
  applyTimelineYearToSearch,
  applySelectionToSearch,
  parseRouteIdFromSearch,
  parseRouteStageFromSearch,
  parseMapModeFromSearch,
  parseViewTabFromSearch,
  parseTimelineYearFromSearch,
  parseSelectionFromSearch
} from "../features/map/selection-url";
import type { AncientTimelinePayload } from "../features/map/ancient-layer.types";
import { formatTimelineValueText, formatTimelineYear, resolveStopForYear } from "../features/map/timeline";
import type {
  MapDisplayMode,
  PinLabelSource,
  PlaceDetailsPayload,
  PlaceIndexRecord,
  PlaceSelection,
  SelectionOrigin
} from "../features/map/types";
import {
  loadRoutesData,
  resolveRouteStop,
  routeLineFeatureByStage
} from "../features/routes/routes-data";
import type { LoadedRoutesData, RouteStopRecord, RouteStopResolved } from "../features/routes/types";
import type { RouteMapOverlayData } from "../features/routes/map-overlay";
import { buildMentionedPointFeatures } from "../features/routes/overlay-mentioned";
import { RoutesPanel } from "../features/routes/routes-panel.web";
import { tokens } from "../theme/tokens";

const PANEL_WIDTH = 408;
const SEARCH_TOP_OFFSET = tokens.spacing.md;
const SEARCH_HEIGHT = 48;
const PANEL_CONTENT_TOP_PADDING = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + tokens.spacing.md;
const MAP_PLACEHOLDER_COLOR = "#F1EEE4";
const SMALL_SCREEN_BREAKPOINT = 768;
const SMALL_SCREEN_SHEET_EDGE_GAP_PX = 16;
const SMALL_SCREEN_SHEET_HALF_RATIO = 0.47;
const SMALL_SCREEN_SHEET_MIN_COLLAPSED_HEIGHT_PX = 260;
const SMALL_SCREEN_SHEET_TAP_THRESHOLD_PX = 6;
const SMALL_SCREEN_SHEET_RELEASE_VELOCITY_MIN_SAMPLE_MS = 6;
const SMALL_SCREEN_SHEET_FLICK_VELOCITY_THRESHOLD_PX_PER_MS = 0.55;
const ROUTES_SIDE_BY_SIDE_MIN_WIDTH_PX = 1280;
const MAP_TOGGLE_TOP_OFFSET_PX = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + 8;
const VIEW_TABS_TOP_OFFSET_PX = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + 8;
const SEGMENTED_CONTROL_MIN_WIDTH_PX = 178;
const SEGMENTED_CONTROL_HEIGHT_PX = 40;
const MAP_TOP_CONTROL_CLEARANCE_PX = 16;
const SMALL_SCREEN_TOP_CONTROLS_SAFE_BOTTOM_PX =
  MAP_TOGGLE_TOP_OFFSET_PX + SEGMENTED_CONTROL_HEIGHT_PX + MAP_TOP_CONTROL_CLEARANCE_PX;
const SMALL_SCREEN_TIMELINE_SOURCES_ATTRIBUTION_RESERVED_HEIGHT_PX = 180;
const SMALL_SCREEN_COMPACT_ATTRIBUTION_EXPANDED_RESERVE_HEIGHT_PX = 180;
const TIMELINE_CARD_BOTTOM_OFFSET_PX = tokens.spacing.md;
const TIMELINE_SOURCES_POPOVER_MIN_HEIGHT_PX = 120;
const TIMELINE_SOURCES_VERTICAL_GAP_PX = 8;
const PIN_LABEL_SOURCE: PinLabelSource = "biblical";
const MAP_MODE_ORDER: readonly MapDisplayMode[] = ["ancient", "modern"];
const VIEW_TAB_ORDER = ["map", "routes"] as const;
const TIMELINE_DEFAULT_YEAR = 50;
const TIMELINE_TRACK_THICKNESS_PX = 2;
const TIMELINE_TRACK_THUMB_DIAMETER_PX = 20;
const TIMELINE_TRACK_THUMB_INSET_PX = TIMELINE_TRACK_THUMB_DIAMETER_PX / 2;
const TIMELINE_MAX_WIDTH_PX = 800;
const TIMELINE_MIN_STOP_SPACING_PX = 36;
const TIMELINE_NAV_BUTTON_WIDTH_PX = 44;
const TIMELINE_TRACK_AND_BUTTON_GAP_PX = 12;
const srOnlyStyle: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};
const LazyMapView = lazy(async () => {
  const module = await import("../features/map/map-view");
  return {
    default: module.MapView
  };
});

function normalizeSelection(
  selection: PlaceSelection | null,
  placesById: Map<string, PlaceIndexRecord>
): PlaceSelection | null {
  if (!selection) {
    return null;
  }

  const place = placesById.get(selection.placeId);
  if (!place) {
    return null;
  }

  if (
    selection.candidateIndex === null ||
    selection.candidateIndex < 0 ||
    selection.candidateIndex >= place.candidates.length
  ) {
    return { placeId: selection.placeId, candidateIndex: null };
  }

  return selection;
}

function writeSelectionToUrl(selection: PlaceSelection | null, mode: "replace" | "push" = "replace") {
  const nextSearch = applySelectionToSearch(window.location.search, selection);
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    if (mode === "push") {
      window.history.pushState({}, "", nextUrl);
      return;
    }
    window.history.replaceState({}, "", nextUrl);
  }
}

function writeViewTabToUrl(tab: "map" | "routes", mode: "replace" | "push" = "replace") {
  const nextSearch = applyViewTabToSearch(window.location.search, tab);
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    if (mode === "push") {
      window.history.pushState({}, "", nextUrl);
      return;
    }
    window.history.replaceState({}, "", nextUrl);
  }
}

function writeRouteSelectionToUrl(routeId: string | null, stage: number | null) {
  let nextSearch = applyRouteIdToSearch(window.location.search, routeId);
  nextSearch = applyRouteStageToSearch(nextSearch, stage);
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, "", nextUrl);
  }
}

async function fetchPlaces() {
  const response = await fetch("/generated/places.index.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Could not load places index (${response.status})`);
  }

  const payload = (await response.json()) as PlaceIndexRecord[];
  return sortPlacesByImportance(payload);
}

async function fetchPlaceDetails(placeId: string) {
  const response = await fetch(`/generated/places/${encodeURIComponent(placeId)}.json`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Could not load place details for '${placeId}' (${response.status})`);
  }

  return (await response.json()) as PlaceDetailsPayload;
}

async function fetchAncientTimeline() {
  const response = await fetch("/generated/ancient.timeline.json", {
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = new Error(`Could not load ancient timeline (${response.status})`) as Error & {
      status: number;
    };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as AncientTimelinePayload;
}

function visiblePlaceEntrySelectorById(entryId: string) {
  const escaped = entryId.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"');
  return `button[data-place-entry-id="${escaped}"]`;
}

function timelineStopTickLabel(stops: { year: number }[], index: number) {
  const stop = stops[index];
  if (stop.year < 0) {
    const isFirstBc = !stops.slice(0, index).some((item) => item.year < 0);
    return isFirstBc ? `${Math.abs(stop.year)} BC` : `${Math.abs(stop.year)}`;
  }

  const isFirstAd = !stops.slice(0, index).some((item) => item.year >= 0);
  return isFirstAd ? `AD ${stop.year}` : `${stop.year}`;
}

function timelineTickPosition(fraction: number) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const thumbInsetOffset = (1 - 2 * clamped) * TIMELINE_TRACK_THUMB_INSET_PX;
  return `calc(${clamped * 100}% + ${thumbInsetOffset}px)`;
}

function MapLoadingPlaceholder() {
  return (
    <div
      aria-label="Map"
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: MAP_PLACEHOLDER_COLOR,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.color.textSecondary,
        fontSize: tokens.typography.bodySize
      }}
    >
      Loading map…
    </div>
  );
}

export function RouteStopDetailsPanel({
  selectedRouteStop,
  bibliographyById,
  showBackToRoute,
  onBackToRoute,
  onClose
}: {
  selectedRouteStop: RouteStopRecord;
  bibliographyById: Map<string, LoadedRoutesData["index"]["bibliography"][number]>;
  showBackToRoute: boolean;
  onBackToRoute: () => void;
  onClose: () => void;
}) {
  return (
    <div data-route-stop-panel="true">
      {showBackToRoute ? (
        <button
          data-back-to-route="true"
          onClick={onBackToRoute}
          style={{ border: "none", background: "none", color: "#1A73E8", padding: 0, cursor: "pointer", marginBottom: `${tokens.spacing.sm}px` }}
          type="button"
        >
          ‹ Back to route
        </button>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: `${tokens.spacing.sm}px` }}>
        <h1
          style={{
            margin: 0,
            minWidth: 0,
            overflowWrap: "anywhere",
            fontSize: `${tokens.typography.titleSize}px`,
            lineHeight: `${tokens.typography.titleLineHeight}px`
          }}
        >
          {selectedRouteStop.name}
        </h1>
        <button
          aria-label="Close"
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            color: tokens.color.textSecondary,
            cursor: "pointer",
            fontSize: "20px",
            lineHeight: 1,
            padding: 0
          }}
          type="button"
        >
          ×
        </button>
      </div>
      {selectedRouteStop.todayName ? (
        <p style={{ margin: `${tokens.spacing.xs}px 0 0`, color: tokens.color.textSecondary }}>
          Today: {selectedRouteStop.todayName}
        </p>
      ) : null}
      {selectedRouteStop.candidates.length > 1 ? (
        <div style={{ marginTop: `${tokens.spacing.sm}px` }}>
          <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>Candidate sites</h2>
          <ul data-route-stop-candidates="true" style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
            {selectedRouteStop.candidates.map((candidate) => (
              <li key={`${selectedRouteStop.id}:${candidate.label}`}>
                <strong>{candidate.label}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {selectedRouteStop.scripture.length > 0 ? (
        <div style={{ marginTop: `${tokens.spacing.sm}px` }}>
          <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>In the Bible</h2>
          <ul style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
            {selectedRouteStop.scripture.map((entry) => (
              <li key={`${selectedRouteStop.id}:${entry.ref}`}>
                <strong>{entry.ref}</strong>
                <p style={{ margin: `${tokens.spacing.xs}px 0 0`, fontFamily: tokens.typography.scriptureFont }}>{entry.textWEB}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div style={{ marginTop: `${tokens.spacing.sm}px` }}>
        <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>
          Sources · {selectedRouteStop.sources.length}
        </h2>
        {selectedRouteStop.sources.length > 0 ? (
          <ol style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
            {selectedRouteStop.sources.map((sourceId, index) => {
              const source = formatSourceCitation(sourceId, bibliographyById);
              return (
                <li key={`${selectedRouteStop.id}:${sourceId}:${index}`}>
                  {source.url ? (
                    <a href={source.url} rel="noreferrer noopener" target="_blank">
                      {source.label}
                    </a>
                  ) : (
                    source.label
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p style={{ margin: `${tokens.spacing.xs}px 0 0`, color: tokens.color.textSecondary }}>
            No sources listed.
          </p>
        )}
      </div>
    </div>
  );
}

export function AppShell() {
  const [places, setPlaces] = useState<PlaceIndexRecord[]>([]);
  const [selection, setSelection] = useState<PlaceSelection | null>(null);
  const [selectionOrigin, setSelectionOrigin] = useState<SelectionOrigin>("url");
  const [viewTab, setViewTab] = useState<"map" | "routes">(() =>
    typeof window === "undefined" ? "map" : parseViewTabFromSearch(window.location.search)
  );
  const [mapMode, setMapMode] = useState<MapDisplayMode>(() =>
    typeof window === "undefined" ? "ancient" : parseMapModeFromSearch(window.location.search)
  );
  const [loading, setLoading] = useState(true);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < SMALL_SCREEN_BREAKPOINT : false
  );
  const [smallScreenSheetPosition, setSmallScreenSheetPosition] = useState<SmallScreenSheetPosition>("half");
  const [smallScreenSheetDragHeightPx, setSmallScreenSheetDragHeightPx] = useState<number | null>(
    null
  );
  const [viewportHeightPx, setViewportHeightPx] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  const [viewportWidthPx, setViewportWidthPx] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [routeListSheetHandleFocused, setRouteListSheetHandleFocused] = useState(false);
  const [routeStopSheetHandleFocused, setRouteStopSheetHandleFocused] = useState(false);
  const [placeDetailsById, setPlaceDetailsById] = useState<Record<string, PlaceDetailsPayload>>(
    {}
  );
  const [placeDetailsErrorsById, setPlaceDetailsErrorsById] = useState<Record<string, string>>(
    {}
  );
  const [ancientTimeline, setAncientTimeline] = useState<AncientTimelinePayload | null>(null);
  const [ancientTimelineLoadState, setAncientTimelineLoadState] = useState<
    "loading" | "ready" | "absent" | "error"
  >("loading");
  const [ancientLayerStatus, setAncientLayerStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [ancientTimelineRetryToken, setAncientTimelineRetryToken] = useState(0);
  const [ancientLayerRetryToken, setAncientLayerRetryToken] = useState(0);
  const [selectedTimelineStopId, setSelectedTimelineStopId] = useState<string | null>(null);
  const [timelineSourcesOpen, setTimelineSourcesOpen] = useState(false);
  const [timelineSourcesPopoverMaxHeightPx, setTimelineSourcesPopoverMaxHeightPx] = useState<
    number | null
  >(null);
  const [timelineOverlayInsetForAttribution, setTimelineOverlayInsetForAttribution] = useState(0);
  const [routesLoadState, setRoutesLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [routesData, setRoutesData] = useState<LoadedRoutesData | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeToRevealOnList, setRouteToRevealOnList] = useState<string | null>(null);
  const [highlightedStageIndex, setHighlightedStageIndex] = useState<number | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
  const [selectedRouteStopId, setSelectedRouteStopId] = useState<string | null>(null);
  const [routesReloadToken, setRoutesReloadToken] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const timelineCardRef = useRef<HTMLDivElement | null>(null);
  const timelineSourcesPopoverRef = useRef<HTMLDivElement | null>(null);
  const lastSelectionActivatorEntryIdRef = useRef<string | null>(null);
  const loadingPlaceDetailsIdsRef = useRef(new Set<string>());
  const placeDetailsRequestGenerationByIdRef = useRef(new Map<string, number>());
  const unmountedRef = useRef(false);
  const routesLoadStateRef = useRef(routesLoadState);
  const smallScreenSheetDragHeightPxRef = useRef(smallScreenSheetDragHeightPx);
  const smallScreenSheetDragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startHeightPx: number;
    startPosition: SmallScreenSheetPosition;
    canClose: boolean;
    requiresDownwardMotion: boolean;
    allowTapToggle: boolean;
    hasEngagedDrag: boolean;
    lastY: number;
    lastTimestampMs: number;
    velocityYPxPerMs: number;
    movedPx: number;
  } | null>(null);
  const suppressNextHandleClickRef = useRef(false);

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selectedPlace = selection ? placesById.get(selection.placeId) ?? null : null;
  const routeStopsById = useMemo(
    () => new Map((routesData?.stops.stops ?? []).map((stop) => [stop.id, stop] as const)),
    [routesData]
  );
  const routeBibliographyById = useMemo(() => routesData?.bibliographyById ?? new Map(), [routesData]);
  const hydratedRoutes = useMemo(() => routesData?.routes ?? [], [routesData]);
  const selectedRoute = useMemo(
    () => hydratedRoutes.find((entry) => entry.route.id === selectedRouteId) ?? null,
    [hydratedRoutes, selectedRouteId]
  );
  const selectedRouteTimelineStop = useMemo(() => {
    if (!selectedRoute || !ancientTimeline || ancientTimeline.stops.length === 0) {
      return null;
    }
    return resolveStopForYear(ancientTimeline.stops, selectedRoute.route.fromYear);
  }, [ancientTimeline, selectedRoute]);
  useEffect(() => {
    routesLoadStateRef.current = routesLoadState;
  }, [routesLoadState]);
  useEffect(() => {
    smallScreenSheetDragHeightPxRef.current = smallScreenSheetDragHeightPx;
  }, [smallScreenSheetDragHeightPx]);
  const selectedTimelineStop = useMemo(
    () =>
      ancientTimeline?.stops.find((stop) => stop.id === selectedTimelineStopId) ??
      null,
    [ancientTimeline, selectedTimelineStopId]
  );
  const sortedTimelineStops = useMemo(() => {
    if (!ancientTimeline) {
      return [];
    }

    return [...ancientTimeline.stops].sort((left, right) => left.year - right.year);
  }, [ancientTimeline]);
  const timelineBibliographyById = useMemo(
    () => new Map((ancientTimeline?.bibliography ?? []).map((entry) => [entry.id, entry] as const)),
    [ancientTimeline]
  );
  const hasAncientTimeline = sortedTimelineStops.length > 0;
  const selectedTimelineStopIndex = useMemo(() => {
    if (!selectedTimelineStop) {
      return -1;
    }

    return sortedTimelineStops.findIndex((stop) => stop.id === selectedTimelineStop.id);
  }, [selectedTimelineStop, sortedTimelineStops]);
  const smallScreenSheetMaxHeightPx = Math.max(0, viewportHeightPx);
  const smallScreenSheetCollapsedHeightPx = Math.min(
    smallScreenSheetMaxHeightPx,
    Math.max(
      SMALL_SCREEN_SHEET_MIN_COLLAPSED_HEIGHT_PX,
      Math.round(smallScreenSheetMaxHeightPx * SMALL_SCREEN_SHEET_HALF_RATIO)
    )
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const onResize = () => {
      setViewportHeightPx(window.innerHeight);
      setViewportWidthPx(window.innerWidth);
      const nextIsSmallScreen = window.innerWidth < SMALL_SCREEN_BREAKPOINT;
      setIsSmallScreen(nextIsSmallScreen);
      if (!nextIsSmallScreen) {
        setSmallScreenSheetDragHeightPx(null);
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    update();
    mediaQuery.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!isSmallScreen) {
      smallScreenSheetDragStateRef.current = null;
      return undefined;
    }

    const onPointerMove = (event: PointerEvent) => {
      const dragState = smallScreenSheetDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      if (dragState.requiresDownwardMotion) {
        if (event.clientY <= dragState.startY) {
          return;
        }
        dragState.requiresDownwardMotion = false;
        dragState.hasEngagedDrag = true;
      }

      const elapsedMs = Math.max(1, event.timeStamp - dragState.lastTimestampMs);
      const deltaY = event.clientY - dragState.lastY;
      dragState.velocityYPxPerMs = deltaY / elapsedMs;
      dragState.lastY = event.clientY;
      dragState.lastTimestampMs = event.timeStamp;
      const nextHeightPx = Math.min(
        smallScreenSheetMaxHeightPx,
        Math.max(
          dragState.canClose ? 0 : smallScreenSheetCollapsedHeightPx,
          dragState.startHeightPx + (dragState.startY - event.clientY)
        )
      );
      dragState.movedPx = Math.max(
        dragState.movedPx,
        Math.abs(event.clientY - dragState.startY)
      );
      setSmallScreenSheetDragHeightPx(nextHeightPx);
    };

    const onPointerUp = (event: PointerEvent) => {
      const dragState = smallScreenSheetDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      smallScreenSheetDragStateRef.current = null;
      const dragDeltaYPx = event.clientY - dragState.startY;
      const movedPx = Math.max(
        dragState.movedPx,
        Math.abs(dragDeltaYPx)
      );
      const elapsedSinceLastMs = Math.max(1, event.timeStamp - dragState.lastTimestampMs);
      const releaseVelocityYPxPerMs = (event.clientY - dragState.lastY) / elapsedSinceLastMs;
      const velocityYPxPerMs = resolveSheetReleaseVelocity({
        trackedVelocityYPxPerMs: dragState.velocityYPxPerMs,
        releaseVelocityYPxPerMs,
        elapsedSinceLastMoveMs: elapsedSinceLastMs,
        releaseVelocityMinSampleMs: SMALL_SCREEN_SHEET_RELEASE_VELOCITY_MIN_SAMPLE_MS
      });
      if (!dragState.allowTapToggle) {
        if (dragState.requiresDownwardMotion) {
          setSmallScreenSheetDragHeightPx(null);
          return;
        }
        if (!dragState.hasEngagedDrag || movedPx <= SMALL_SCREEN_SHEET_TAP_THRESHOLD_PX) {
          setSmallScreenSheetDragHeightPx(null);
          return;
        }
      }
      const finalHeightPx = Math.min(
        smallScreenSheetMaxHeightPx,
        Math.max(
          dragState.canClose ? 0 : smallScreenSheetCollapsedHeightPx,
          smallScreenSheetDragHeightPxRef.current ??
            (dragState.startHeightPx + (dragState.startY - event.clientY))
        )
      );
      const nextPosition = settleSmallScreenSheetPosition({
        canClose: dragState.canClose,
        currentHeightPx: finalHeightPx,
        dragDeltaYPx,
        movedPx,
        startPosition: dragState.startPosition,
        tapThresholdPx: SMALL_SCREEN_SHEET_TAP_THRESHOLD_PX,
        velocityYPxPerMs,
        flickVelocityThresholdPxPerMs: SMALL_SCREEN_SHEET_FLICK_VELOCITY_THRESHOLD_PX_PER_MS,
        halfHeightPx: smallScreenSheetCollapsedHeightPx,
        fullHeightPx: smallScreenSheetMaxHeightPx
      });
      if (nextPosition === "closed") {
        if (viewTab === "map" && selectedPlace) {
          setSelectionOrigin("url");
          setSelection(null);
          setSelectedRouteStopId(null);
          setHighlightedPlaceId(null);
          setSmallScreenSheetPosition("half");
        } else if (viewTab === "routes" && (selectedPlace || selectedRouteStopId)) {
          setSelectionOrigin("url");
          setSelection(null);
          setSelectedRouteStopId(null);
          setHighlightedPlaceId(null);
          setSmallScreenSheetPosition("half");
        } else {
          setSmallScreenSheetPosition("half");
        }
      } else {
        setSmallScreenSheetPosition(nextPosition);
      }
      setSmallScreenSheetDragHeightPx(null);
      suppressNextHandleClickRef.current = true;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [
    isSmallScreen,
    selectedPlace,
    selectedRouteStopId,
    smallScreenSheetCollapsedHeightPx,
    smallScreenSheetMaxHeightPx,
    viewTab
  ]);

  useEffect(() => {
    let cancelled = false;

    fetchPlaces()
      .then((loadedPlaces) => {
        if (cancelled) {
          return;
        }

        setPlaces(loadedPlaces);
        setLoading(false);

        const loadedPlacesById = new Map(
          loadedPlaces.map((place) => [place.id, place] as const)
        );
        const parsedSelection = parseSelectionFromSearch(window.location.search);
        const parsedMapMode = parseMapModeFromSearch(window.location.search);
        const parsedViewTab = parseViewTabFromSearch(window.location.search);
        const parsedRouteId = parseRouteIdFromSearch(window.location.search);
        const parsedStage = parseRouteStageFromSearch(window.location.search);
        if (parsedMapMode !== "ancient") {
          setTimelineSourcesOpen(false);
        }
        setMapMode(parsedMapMode);
        setViewTab(parsedViewTab);
        setSelectedRouteId(parsedRouteId);
        setRouteToRevealOnList(parsedRouteId);
        setSelectedStageIndex(parsedStage ? parsedStage - 1 : null);
        const normalized = normalizeSelection(parsedSelection, loadedPlacesById);

        if (parsedSelection && !normalized) {
          lastSelectionActivatorEntryIdRef.current = null;
          setHighlightedPlaceId(null);
          setStatusMessage("Place not found");
          writeSelectionToUrl(null);
        } else if (normalized) {
          lastSelectionActivatorEntryIdRef.current = null;
          setHighlightedPlaceId(null);
          setSelectionOrigin("url");
          setSelection(normalized);
        }

        setUrlStateReady(true);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Failed to load map places.";
        setErrorMessage(message);
        setLoading(false);
        setUrlStateReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (viewTab !== "routes" || routesLoadStateRef.current !== "idle") {
      return;
    }

    let cancelled = false;
    setRoutesLoadState("loading");
    void loadRoutesData(window.location.search)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setRoutesData(payload);
        setRoutesLoadState("ready");
      })
      .catch((error) => {
        console.error("Failed to load routes.", error);
        if (cancelled) {
          return;
        }
        setRoutesData(null);
        setRoutesLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [routesReloadToken, viewTab]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setAncientTimelineLoadState("loading");
      }
    });

    fetchAncientTimeline()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setAncientTimeline(payload);
        if (!payload || payload.stops.length === 0) {
          setAncientTimelineLoadState("absent");
          setSelectedTimelineStopId(null);
          return;
        }

        setAncientTimelineLoadState("ready");
        const requestedYear = parseTimelineYearFromSearch(window.location.search) ?? TIMELINE_DEFAULT_YEAR;
        const resolvedStop = resolveStopForYear(payload.stops, requestedYear);
        setSelectedTimelineStopId(resolvedStop?.id ?? payload.defaultStopId ?? payload.stops[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const status =
          error && typeof error === "object" && "status" in error && typeof error.status === "number"
            ? error.status
            : null;
        if (status === 404) {
          setAncientTimelineLoadState("absent");
          setAncientTimeline(null);
          setSelectedTimelineStopId(null);
          return;
        }

        console.error("Failed to load ancient timeline.", error);
        setAncientTimeline(null);
        setAncientTimelineLoadState("error");
        setSelectedTimelineStopId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [ancientTimelineRetryToken]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      return;
    }

    const placeId = selectedPlace.id;
    if (
      placeDetailsById[placeId] ||
      placeDetailsErrorsById[placeId] ||
      loadingPlaceDetailsIdsRef.current.has(placeId)
    ) {
      return;
    }

    const requestGeneration =
      (placeDetailsRequestGenerationByIdRef.current.get(placeId) ?? 0) + 1;
    placeDetailsRequestGenerationByIdRef.current.set(placeId, requestGeneration);
    loadingPlaceDetailsIdsRef.current.add(placeId);

    void fetchPlaceDetails(placeId)
      .then((payload) => {
        const latestGeneration = placeDetailsRequestGenerationByIdRef.current.get(placeId);
        if (unmountedRef.current || latestGeneration !== requestGeneration) {
          return;
        }

        setPlaceDetailsById((previous) => ({
          ...previous,
          [placeId]: payload
        }));
        setPlaceDetailsErrorsById((previous) => {
          const { [placeId]: _removed, ...rest } = previous;
          return rest;
        });
      })
      .catch((error: unknown) => {
        const latestGeneration = placeDetailsRequestGenerationByIdRef.current.get(placeId);
        if (unmountedRef.current || latestGeneration !== requestGeneration) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : `Failed to load details for '${selectedPlace.id}'.`;
        setPlaceDetailsErrorsById((previous) => ({
          ...previous,
          [placeId]: message
        }));
      })
      .finally(() => {
        const latestGeneration = placeDetailsRequestGenerationByIdRef.current.get(placeId);
        if (latestGeneration === requestGeneration) {
          loadingPlaceDetailsIdsRef.current.delete(placeId);
        }
      });
  }, [placeDetailsById, placeDetailsErrorsById, selectedPlace]);

  useEffect(() => {
    if (!urlStateReady) {
      return;
    }

    writeSelectionToUrl(selection);
  }, [selection, urlStateReady]);

  useEffect(() => {
    if (!urlStateReady) {
      return;
    }
    writeViewTabToUrl(viewTab);
  }, [urlStateReady, viewTab]);

  useEffect(() => {
    if (!urlStateReady || viewTab !== "routes") {
      return;
    }
    writeRouteSelectionToUrl(
      selectedRouteId,
      selectedStageIndex !== null ? selectedStageIndex + 1 : null
    );
  }, [selectedRouteId, selectedStageIndex, urlStateReady, viewTab]);

  useEffect(() => {
    if (!urlStateReady) {
      return;
    }

    const nextSearch = applyMapModeToSearch(window.location.search, mapMode);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [mapMode, urlStateReady]);

  useEffect(() => {
    if (!urlStateReady || !selectedTimelineStop) {
      return;
    }

    const nextSearch = applyTimelineYearToSearch(window.location.search, selectedTimelineStop.year);
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [selectedTimelineStop, urlStateReady]);

  useEffect(() => {
    if (loading || !urlStateReady) {
      return undefined;
    }

    const onPopState = () => {
      const parsedSelection = parseSelectionFromSearch(window.location.search);
      const parsedMapMode = parseMapModeFromSearch(window.location.search);
      const parsedYear = parseTimelineYearFromSearch(window.location.search);
      const parsedViewTab = parseViewTabFromSearch(window.location.search);
      const parsedRouteId = parseRouteIdFromSearch(window.location.search);
      const parsedStage = parseRouteStageFromSearch(window.location.search);
      const normalized = normalizeSelection(parsedSelection, placesById);
      if (parsedMapMode !== "ancient") {
        setTimelineSourcesOpen(false);
      }
      setMapMode(parsedMapMode);
      setViewTab(parsedViewTab);
      setSelectedRouteId(parsedRouteId);
      setRouteToRevealOnList(parsedRouteId);
      setSelectedStageIndex(parsedStage ? parsedStage - 1 : null);
      if (ancientTimeline) {
        const resolvedStop = resolveStopForYear(
          ancientTimeline.stops,
          parsedYear ?? TIMELINE_DEFAULT_YEAR
        );
        setSelectedTimelineStopId(
          resolvedStop?.id ??
            ancientTimeline.defaultStopId ??
            ancientTimeline.stops[0]?.id ??
            null
        );
      }

      if (!parsedSelection) {
        lastSelectionActivatorEntryIdRef.current = null;
        setHighlightedPlaceId(null);
        setSelectionOrigin("url");
        setSelection(null);
        setStatusMessage(null);
        return;
      }

      if (!normalized) {
        lastSelectionActivatorEntryIdRef.current = null;
        setHighlightedPlaceId(null);
        setSelectionOrigin("url");
        setSelection(null);
        setStatusMessage("Place not found");
        return;
      }

      lastSelectionActivatorEntryIdRef.current = null;
      setHighlightedPlaceId(null);
      setStatusMessage(null);
      setSelectionOrigin("url");
      setSelection(normalized);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [ancientTimeline, loading, placesById, urlStateReady]);

  const closePanel = useCallback((restoreFocus: boolean) => {
    setSelectionOrigin("url");
    setSelection(null);
    setSelectedRouteStopId(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetPosition("half");
    setSmallScreenSheetDragHeightPx(null);

    if (!restoreFocus) {
      return;
    }

    window.requestAnimationFrame(() => {
      const entryId = lastSelectionActivatorEntryIdRef.current;
      if (entryId) {
        const placeButton = document.querySelector<HTMLButtonElement>(
          visiblePlaceEntrySelectorById(entryId)
        );
        if (placeButton) {
          placeButton.focus();
          return;
        }
      }

      searchInputRef.current?.focus();
    });
  }, []);

  const beginSmallScreenSheetDrag = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      options: {
        canClose: boolean;
        requiresDownwardMotion: boolean;
        allowTapToggle: boolean;
      }
    ) => {
      if (!isSmallScreen) {
        return;
      }
      if (smallScreenSheetDragStateRef.current) {
        smallScreenSheetDragStateRef.current = null;
      }
      const sheetElement = event.currentTarget.closest(
        "section[aria-label='Place details'], section[aria-label='Route details']"
      );
      const renderedHeightPx =
        sheetElement instanceof HTMLElement
          ? sheetElement.getBoundingClientRect().height
          : Number.NaN;
      const currentHeightPx =
        smallScreenSheetDragHeightPx ??
        (Number.isFinite(renderedHeightPx) && renderedHeightPx > 0
          ? renderedHeightPx
          : null) ??
        sheetHeightForPosition(
          smallScreenSheetPosition,
          smallScreenSheetCollapsedHeightPx,
          smallScreenSheetMaxHeightPx
        );
      smallScreenSheetDragStateRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeightPx: currentHeightPx,
        startPosition: smallScreenSheetPosition,
        canClose: options.canClose,
        requiresDownwardMotion: options.requiresDownwardMotion,
        allowTapToggle: options.allowTapToggle,
        hasEngagedDrag: !options.requiresDownwardMotion,
        lastY: event.clientY,
        lastTimestampMs: event.timeStamp,
        velocityYPxPerMs: 0,
        movedPx: 0
      };
      suppressNextHandleClickRef.current = false;
      setSmallScreenSheetDragHeightPx(currentHeightPx);
    },
    [
      isSmallScreen,
      smallScreenSheetCollapsedHeightPx,
      smallScreenSheetDragHeightPx,
      smallScreenSheetMaxHeightPx,
      smallScreenSheetPosition
    ]
  );

  const handleSmallScreenSheetContentPointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      options: {
        canClose: boolean;
      }
    ) => {
      if (!isSmallScreen) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          "button, a, input, select, textarea, [role='button'], [role='link'], [contenteditable='true']"
        )
      ) {
        return;
      }

      const scrollContainer = event.currentTarget;
      if (scrollContainer.scrollTop > 0) {
        return;
      }

      beginSmallScreenSheetDrag(event, {
        canClose: options.canClose,
        requiresDownwardMotion: true,
        allowTapToggle: false
      });
    },
    [beginSmallScreenSheetDrag, isSmallScreen]
  );

  const handleSmallScreenSheetTopStripPointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      options: {
        canClose: boolean;
      }
    ) => {
      if (!isSmallScreen) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          "button, a, input, select, textarea, [role='button'], [role='link'], [contenteditable='true']"
        )
      ) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      beginSmallScreenSheetDrag(event, {
        canClose: options.canClose,
        requiresDownwardMotion: false,
        allowTapToggle: false
      });
    },
    [beginSmallScreenSheetDrag, isSmallScreen]
  );

  const isSmallScreenSheetStripPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>, stripId: "route-list" | "place" | "route-stop") => {
      if (!isSmallScreen) {
        return false;
      }
      const section = event.currentTarget;
      if (!(section instanceof HTMLElement)) {
        return false;
      }
      const strip = section.querySelector(`[data-sheet-drag-strip='${stripId}']`);
      const stripContainer = section.querySelector(
        `[data-sheet-drag-strip-container='${stripId}']`
      );
      const boundsSource =
        strip instanceof HTMLElement
          ? strip
          : stripContainer instanceof HTMLElement
            ? stripContainer
            : null;
      if (!boundsSource) {
        return false;
      }
      const bounds = boundsSource.getBoundingClientRect();
      return (
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom
      );
    },
    [isSmallScreen]
  );

  useEffect(() => {
    if (!selectedPlace && !selectedRouteStopId) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closePanel(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePanel, selectedPlace, selectedRouteStopId]);

  const handleSelectFromMap = useCallback(
    (
      nextSelection: PlaceSelection,
      origin: "map-name" | "map-candidate" | "keyboard-visible-place"
    ) => {
      setStatusMessage(null);
      setHighlightedPlaceId(null);
      setSelectedRouteStopId(null);
      setSmallScreenSheetPosition("half");
      setSmallScreenSheetDragHeightPx(null);

      const activeElement = document.activeElement;
      lastSelectionActivatorEntryIdRef.current =
        activeElement instanceof HTMLElement
          ? activeElement.getAttribute("data-place-entry-id")
          : null;

      setSelectionOrigin(origin);
      setSelection(nextSelection);
    },
    []
  );

  const handlePanelSelectPlace = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSelectedRouteStopId(null);
    setSmallScreenSheetPosition("half");
    setSmallScreenSheetDragHeightPx(null);
    setSelectionOrigin("panel");
    setSelection(nextSelection);
  }, []);

  const handlePanelSelectPlaceFromAbout = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSelectedRouteStopId(null);
    setSmallScreenSheetPosition("half");
    setSmallScreenSheetDragHeightPx(null);
    lastSelectionActivatorEntryIdRef.current = null;
    writeSelectionToUrl(nextSelection, "push");
    setSelectionOrigin("panel-link");
    setSelection(nextSelection);
  }, []);

  const handlePanelSelectCandidate = useCallback(
    (candidateIndex: number) => {
      if (!selection) {
        return;
      }

      setHighlightedPlaceId(null);
      setSelectionOrigin("panel");
      setSelection({
        placeId: selection.placeId,
        candidateIndex
      });
    },
    [selection]
  );

  const selectedPlaceDetails = selectedPlace ? placeDetailsById[selectedPlace.id] ?? null : null;
  const selectedPlaceLoading = selectedPlace
    ? !selectedPlaceDetails && !placeDetailsErrorsById[selectedPlace.id]
    : false;
  const selectedPlaceLoadError = selectedPlace ? placeDetailsErrorsById[selectedPlace.id] ?? null : null;

  const handleSearchSelection = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSelectedRouteStopId(null);
    if (viewTab !== "routes") {
      setViewTab("map");
    }
    setSmallScreenSheetPosition("half");
    setSmallScreenSheetDragHeightPx(null);
    lastSelectionActivatorEntryIdRef.current = null;
    setSelectionOrigin("search");
    setSelection(nextSelection);
  }, [viewTab]);
  const handlePanelHighlightPlace = useCallback(
    (placeId: string | null) => {
      if (!placeId || !placesById.has(placeId)) {
        setHighlightedPlaceId(null);
        return;
      }

      setHighlightedPlaceId(placeId);
    },
    [placesById]
  );
  const handleMapModeRadioKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }

      event.preventDefault();
      const currentIndex = MAP_MODE_ORDER.indexOf(mapMode);
      let nextMode: MapDisplayMode = mapMode;

      if (event.key === "Home") {
        nextMode = MAP_MODE_ORDER[0];
      } else if (event.key === "End") {
        nextMode = MAP_MODE_ORDER[MAP_MODE_ORDER.length - 1];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        const nextIndex = currentIndex <= 0 ? MAP_MODE_ORDER.length - 1 : currentIndex - 1;
        nextMode = MAP_MODE_ORDER[nextIndex];
      } else {
        const nextIndex = currentIndex >= MAP_MODE_ORDER.length - 1 ? 0 : currentIndex + 1;
        nextMode = MAP_MODE_ORDER[nextIndex];
      }

      if (nextMode !== "ancient") {
        setTimelineSourcesOpen(false);
      }
      setMapMode(nextMode);
      event.currentTarget
        .closest("[role='radiogroup']")
        ?.querySelector<HTMLButtonElement>(`button[role='radio'][data-map-mode='${nextMode}']`)
        ?.focus();
    },
    [mapMode]
  );
  const handleViewTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight" &&
        event.key !== "ArrowUp" &&
        event.key !== "ArrowDown" &&
        event.key !== "Home" &&
        event.key !== "End"
      ) {
        return;
      }

      event.preventDefault();
      const currentIndex = VIEW_TAB_ORDER.indexOf(viewTab);
      let nextTab: "map" | "routes" = viewTab;
      if (event.key === "Home") {
        nextTab = VIEW_TAB_ORDER[0];
      } else if (event.key === "End") {
        nextTab = VIEW_TAB_ORDER[VIEW_TAB_ORDER.length - 1];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        const nextIndex = currentIndex <= 0 ? VIEW_TAB_ORDER.length - 1 : currentIndex - 1;
        nextTab = VIEW_TAB_ORDER[nextIndex];
      } else {
        const nextIndex = currentIndex >= VIEW_TAB_ORDER.length - 1 ? 0 : currentIndex + 1;
        nextTab = VIEW_TAB_ORDER[nextIndex];
      }

      setViewTab(nextTab);
      event.currentTarget
        .closest("[role='tablist']")
        ?.querySelector<HTMLButtonElement>(`[data-view-tab='${nextTab}']`)
        ?.focus();
    },
    [viewTab]
  );

  useEffect(() => {
    if (!timelineSourcesOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setTimelineSourcesOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [timelineSourcesOpen]);

  const routeMapOverlay = useMemo<RouteMapOverlayData | null>(() => {
    if (viewTab !== "routes" || !routesData) {
      return null;
    }

    const selectedRouteEntry = selectedRoute;
    if (!selectedRouteEntry) {
      return {
        lines: {
          type: "FeatureCollection",
          features: []
        },
        points: {
          type: "FeatureCollection",
          features: []
        },
        bounds: null,
        routeFocusKey: null,
        selectedStageFocusKey: null,
        selectedStageCenter: null
      };
    }

    const highlightedStageId =
      highlightedStageIndex !== null && highlightedStageIndex >= 0
        ? selectedRouteEntry.stages[highlightedStageIndex]?.id ?? null
        : null;
    const selectedStageId =
      selectedStageIndex !== null && selectedStageIndex >= 0
        ? selectedRouteEntry.stages[selectedStageIndex]?.id ?? null
        : null;
    const emphasizedStageId = highlightedStageId ?? selectedStageId;
    const selectedRouteId = selectedRouteEntry.route.id;

    const midpointOfCoordinates = (coordinates: [number, number][]) => {
      if (coordinates.length === 0) {
        return null;
      }
      if (coordinates.length === 1) {
        return coordinates[0];
      }

      const lengths: number[] = [];
      let totalLength = 0;
      for (let index = 1; index < coordinates.length; index += 1) {
        const left = coordinates[index - 1];
        const right = coordinates[index];
        const dx = right[0] - left[0];
        const dy = right[1] - left[1];
        const segmentLength = Math.sqrt(dx ** 2 + dy ** 2);
        lengths.push(segmentLength);
        totalLength += segmentLength;
      }
      if (totalLength <= Number.EPSILON) {
        return coordinates[Math.floor(coordinates.length / 2)] ?? coordinates[0];
      }

      const target = totalLength / 2;
      let traversed = 0;
      for (let index = 1; index < coordinates.length; index += 1) {
        const segmentLength = lengths[index - 1] ?? 0;
        if (traversed + segmentLength >= target) {
          const ratio = segmentLength <= Number.EPSILON ? 0 : (target - traversed) / segmentLength;
          const left = coordinates[index - 1];
          const right = coordinates[index];
          return [
            left[0] + (right[0] - left[0]) * ratio,
            left[1] + (right[1] - left[1]) * ratio
          ] as [number, number];
        }
        traversed += segmentLength;
      }
      return coordinates[coordinates.length - 1] ?? null;
    };

    const midpointOfGeometry = (
      geometry:
        | { type: "LineString"; coordinates: number[][] }
        | { type: "MultiLineString"; coordinates: number[][][] }
    ) => {
      if (geometry.type === "LineString") {
        return midpointOfCoordinates(geometry.coordinates as [number, number][]);
      }
      const merged = geometry.coordinates.flat() as [number, number][];
      return midpointOfCoordinates(merged);
    };

    const routeStopHasMultipleCandidates = (resolved: RouteStopResolved) => {
      if (resolved.kind === "route-stop") {
        return (resolved.stop?.candidates.length ?? 0) > 1;
      }

      return (resolved.place?.candidates.length ?? 0) > 1;
    };

    const linelessPillCoordinate = (stage: (typeof selectedRouteEntry.stages)[number]) => {
      const from = resolveRouteStop(stage.from, placesById, routeStopsById);
      const to = resolveRouteStop(stage.to, placesById, routeStopsById);
      const fromDisputed = routeStopHasMultipleCandidates(from);
      const toDisputed = routeStopHasMultipleCandidates(to);
      const anchor =
        fromDisputed && !toDisputed
          ? to
          : !fromDisputed && toDisputed
            ? from
            : to;
      const fallback = anchor.id === from.id ? to : from;
      return (anchor.coordinates ?? fallback.coordinates ?? null) as [number, number] | null;
    };

    const lineFeatures: RouteMapOverlayData["lines"]["features"] = [];
    const lineFeatureByStageId = new Map<string, (typeof lineFeatures)[number]>();
    const selectedRoutePlaceId = selection?.placeId ?? null;
    let selectedStageCenter: [number, number] | null = null;
    for (const [index, stage] of selectedRouteEntry.stages.entries()) {
      const feature = routeLineFeatureByStage(routesData.lines, selectedRouteId, stage.id, stage.lineId);
      if (!feature) {
        continue;
      }

      const mappedFeature = {
        type: "Feature" as const,
        geometry:
          feature.geometry.type === "LineString"
            ? (feature.geometry as { type: "LineString"; coordinates: number[][] })
            : (feature.geometry as { type: "MultiLineString"; coordinates: number[][][] }),
        properties: {
          routeId: selectedRouteId,
          stageId: stage.id,
          stageIndex: index,
          stageLabel: `${index + 1}`,
          travelMode: stage.travelMode,
          isInSelectedRoute: true as const,
          isSelectedStage: selectedStageId === stage.id,
          isHighlightedStage: highlightedStageId === stage.id,
          isDimmed: Boolean(emphasizedStageId && emphasizedStageId !== stage.id)
        }
      };
      lineFeatures.push(mappedFeature);
      lineFeatureByStageId.set(stage.id, mappedFeature);
      if (selectedStageId === stage.id) {
        selectedStageCenter = midpointOfGeometry(mappedFeature.geometry);
      }
    }

    const pointFeatures: RouteMapOverlayData["points"]["features"] = [];
    if (selectedRouteEntry.route.structure === "connected") {
      const stopByKey = new Map<
        string,
        {
          resolved: RouteStopResolved;
          firstStageIndex: number;
          stageIds: string[];
          isRouteStart: boolean;
        }
      >();
      const ensureConnectedStop = (
        resolved: RouteStopResolved,
        stageIndex: number,
        stageId: string,
        isRouteStart: boolean
      ) => {
        if (!resolved.coordinates) {
          return;
        }
        const key = `${resolved.kind}:${resolved.id}`;
        const existing = stopByKey.get(key);
        if (existing) {
          if (existing.stageIds.includes(stageId) && (!isRouteStart || existing.isRouteStart)) {
            return;
          }
          stopByKey.set(key, {
            ...existing,
            stageIds: existing.stageIds.includes(stageId)
              ? existing.stageIds
              : [...existing.stageIds, stageId],
            isRouteStart: existing.isRouteStart || isRouteStart
          });
          return;
        }
        stopByKey.set(key, {
          resolved,
          firstStageIndex: stageIndex,
          stageIds: [stageId],
          isRouteStart
        });
      };
      const firstStage = selectedRouteEntry.stages[0];
      if (firstStage) {
        ensureConnectedStop(
          resolveRouteStop(firstStage.from, placesById, routeStopsById),
          0,
          firstStage.id,
          true
        );
      }
      for (const [index, stage] of selectedRouteEntry.stages.entries()) {
        ensureConnectedStop(resolveRouteStop(stage.to, placesById, routeStopsById), index, stage.id, false);
      }

      const connectedStops = [...stopByKey.values()].map((value, index) => {
        const isSelectedStage = selectedStageId ? value.stageIds.includes(selectedStageId) : false;
        const isHighlightedStage = highlightedStageId ? value.stageIds.includes(highlightedStageId) : false;
        const dimmed = Boolean(emphasizedStageId && !value.stageIds.includes(emphasizedStageId));
        return {
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: value.resolved.coordinates as [number, number] },
          properties: {
            id: `${selectedRouteId}:stop:${value.resolved.kind}:${value.resolved.id}:${index}`,
            routeId: selectedRouteId,
            stageId: value.stageIds[0] ?? "",
            stageIndex: value.firstStageIndex,
            kind: "stop" as const,
            stopKind: value.resolved.kind,
            stopId: value.resolved.id,
            label: value.resolved.name,
            isRouteStart: value.isRouteStart,
            isInSelectedRoute: true as const,
            isSelectedStage,
            isHighlightedStage,
            isDimmed: dimmed,
            isSelectedPlace:
              value.resolved.kind === "location" && value.resolved.id === selectedRoutePlaceId
          }
        };
      });

      const viaByKey = new Map<string, RouteMapOverlayData["points"]["features"][number]>();
      for (const [index, stage] of selectedRouteEntry.stages.entries()) {
        const stageSelected = selectedStageId === stage.id;
        const stageHighlighted = highlightedStageId === stage.id;
        const dimmed = Boolean(emphasizedStageId && emphasizedStageId !== stage.id);
        for (const viaRef of stage.via ?? []) {
          const via = resolveRouteStop(viaRef, placesById, routeStopsById);
          if (!via.coordinates) {
            continue;
          }
          const key = `${selectedRouteId}:${via.kind}:${via.id}`;
          if (viaByKey.has(key)) {
            continue;
          }
          viaByKey.set(key, {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: via.coordinates },
            properties: {
              id: `${selectedRouteId}:${stage.id}:via:${via.id}`,
              routeId: selectedRouteId,
              stageId: stage.id,
              stageIndex: index,
              kind: "via" as const,
              stopKind: via.kind,
              stopId: via.id,
              label: via.name,
              isInSelectedRoute: true as const,
              isSelectedStage: stageSelected,
              isHighlightedStage: stageHighlighted,
              isDimmed: dimmed,
              isSelectedPlace: via.kind === "location" && via.id === selectedRoutePlaceId
            }
          });
        }
      }
      pointFeatures.push(
        ...connectedStops,
        ...viaByKey.values(),
        ...buildMentionedPointFeatures({
          routeId: selectedRouteId,
          stages: selectedRouteEntry.stages,
          selectedStageId,
          highlightedStageId,
          emphasizedStageId,
          selectedPlaceId: selectedRoutePlaceId,
          placesById,
          routeStopsById
        })
      );
    } else {
      const stopsByKey = new Map<
        string,
        {
          resolved: RouteStopResolved;
          stageIds: string[];
          firstStageIndex: number;
          isRouteStart: boolean;
        }
      >();
      const addSegmentStop = (
        resolved: RouteStopResolved,
        stage: { id: string },
        stageIndex: number,
        isRouteStart: boolean
      ) => {
        if (!resolved.coordinates) {
          return;
        }
        const key = `${resolved.kind}:${resolved.id}`;
        const existing = stopsByKey.get(key);
        if (existing) {
          if (existing.stageIds.includes(stage.id) && (!isRouteStart || existing.isRouteStart)) {
            return;
          }
          stopsByKey.set(key, {
            ...existing,
            stageIds: existing.stageIds.includes(stage.id)
              ? existing.stageIds
              : [...existing.stageIds, stage.id],
            isRouteStart: existing.isRouteStart || isRouteStart
          });
          return;
        }
        stopsByKey.set(key, {
          resolved,
          stageIds: [stage.id],
          firstStageIndex: stageIndex,
          isRouteStart
        });
      };
      for (const [index, stage] of selectedRouteEntry.stages.entries()) {
        addSegmentStop(resolveRouteStop(stage.from, placesById, routeStopsById), stage, index, index === 0);
        addSegmentStop(resolveRouteStop(stage.to, placesById, routeStopsById), stage, index, false);
      }
      pointFeatures.push(
        ...[...stopsByKey.values()].map((value, index) => {
          const isSelectedStage = selectedStageId ? value.stageIds.includes(selectedStageId) : false;
          const isHighlightedStage = highlightedStageId ? value.stageIds.includes(highlightedStageId) : false;
          const dimmed = Boolean(emphasizedStageId && !value.stageIds.includes(emphasizedStageId));
          return {
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: value.resolved.coordinates as [number, number] },
            properties: {
              id: `${selectedRouteId}:stop:${value.resolved.kind}:${value.resolved.id}:${index}`,
              routeId: selectedRouteId,
              stageId: value.stageIds[0] ?? "",
              stageIndex: value.firstStageIndex,
              kind: "stop" as const,
              stopKind: value.resolved.kind,
              stopId: value.resolved.id,
              label: value.resolved.name,
              isRouteStart: value.isRouteStart,
              isInSelectedRoute: true as const,
              isSelectedStage,
              isHighlightedStage,
              isDimmed: dimmed,
              isSelectedPlace:
                value.resolved.kind === "location" && value.resolved.id === selectedRoutePlaceId
            }
          };
        })
      );
      for (const [index, stage] of selectedRouteEntry.stages.entries()) {
        const stageSelected = selectedStageId === stage.id;
        const stageHighlighted = highlightedStageId === stage.id;
        const dimmed = Boolean(emphasizedStageId && emphasizedStageId !== stage.id);
        for (const viaRef of stage.via ?? []) {
          const via = resolveRouteStop(viaRef, placesById, routeStopsById);
          if (!via.coordinates) {
            continue;
          }
          pointFeatures.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: via.coordinates },
            properties: {
              id: `${selectedRouteId}:${stage.id}:via:${via.id}`,
              routeId: selectedRouteId,
              stageId: stage.id,
              stageIndex: index,
              kind: "via",
              stopKind: via.kind,
              stopId: via.id,
              label: via.name,
              isInSelectedRoute: true,
              isSelectedStage: stageSelected,
              isHighlightedStage: stageHighlighted,
              isDimmed: dimmed,
              isSelectedPlace: via.kind === "location" && via.id === selectedRoutePlaceId
            }
          });
        }
      }
      pointFeatures.push(
        ...buildMentionedPointFeatures({
          routeId: selectedRouteId,
          stages: selectedRouteEntry.stages,
          selectedStageId,
          highlightedStageId,
          emphasizedStageId,
          selectedPlaceId: selectedRoutePlaceId,
          placesById,
          routeStopsById
        })
      );
    }

    const emphasizedStage = emphasizedStageId
      ? selectedRouteEntry.stages.find((stage) => stage.id === emphasizedStageId) ?? null
      : null;
    if (emphasizedStage) {
      const lineFeature = lineFeatureByStageId.get(emphasizedStage.id) ?? null;
      const stageIndex = selectedRouteEntry.stages.findIndex((candidate) => candidate.id === emphasizedStage.id);
      const pillCoordinate =
        lineFeature ? midpointOfGeometry(lineFeature.geometry) : linelessPillCoordinate(emphasizedStage);
      if (stageIndex >= 0 && pillCoordinate) {
        pointFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: pillCoordinate },
          properties: {
            id: `${selectedRouteId}:${emphasizedStage.id}:pill`,
            routeId: selectedRouteId,
            stageId: emphasizedStage.id,
            stageIndex,
            kind: "stage-pill",
            stopKind: "location",
            stopId: emphasizedStage.id,
            label: `${Math.max(1, stageIndex + 1)}`,
            isInSelectedRoute: true as const,
            isSelectedStage: selectedStageId === emphasizedStage.id,
            isHighlightedStage: highlightedStageId === emphasizedStage.id,
            isDimmed: false,
            isSelectedPlace: false
          }
        });

        if (selectedStageId === emphasizedStage.id) {
          selectedStageCenter = pillCoordinate;
        }
      }
    }

    let minLon = Number.POSITIVE_INFINITY;
    let minLat = Number.POSITIVE_INFINITY;
    let maxLon = Number.NEGATIVE_INFINITY;
    let maxLat = Number.NEGATIVE_INFINITY;
    const includeCoordinate = (coordinate: [number, number]) => {
      if (coordinate[0] < minLon) minLon = coordinate[0];
      if (coordinate[1] < minLat) minLat = coordinate[1];
      if (coordinate[0] > maxLon) maxLon = coordinate[0];
      if (coordinate[1] > maxLat) maxLat = coordinate[1];
    };
    for (const feature of pointFeatures) {
      if (feature.properties.kind === "stage-pill") {
        continue;
      }
      includeCoordinate(feature.geometry.coordinates as [number, number]);
    }
    if (minLon === Number.POSITIVE_INFINITY) {
      for (const feature of lineFeatures) {
        if (feature.geometry.type === "LineString") {
          for (const coordinate of feature.geometry.coordinates) {
            includeCoordinate(coordinate as [number, number]);
          }
          continue;
        }
        for (const segment of feature.geometry.coordinates) {
          for (const coordinate of segment) {
            includeCoordinate(coordinate as [number, number]);
          }
        }
      }
    }
    if (selectedStageCenter) {
      includeCoordinate(selectedStageCenter);
    }
    const bounds =
      minLon === Number.POSITIVE_INFINITY
        ? null
        : ([
            [minLon, minLat],
            [maxLon, maxLat]
          ] as [[number, number], [number, number]]);

    return {
      lines: {
        type: "FeatureCollection",
        features: lineFeatures
      },
      points: {
        type: "FeatureCollection",
        features: pointFeatures
      },
      bounds,
      routeFocusKey: bounds ? selectedRouteId : null,
      selectedStageFocusKey:
        selectedStageId && selectedStageCenter ? `${selectedRouteId}:${selectedStageId}` : null,
      selectedStageCenter
    };
  }, [
    highlightedStageIndex,
    placesById,
    routeStopsById,
    routesData,
    selection?.placeId,
    selectedRoute,
    selectedStageIndex,
    viewTab
  ]);

  const routeKeyboardEntries = useMemo(() => {
    if (viewTab !== "routes" || !selectedRoute) {
      return [];
    }
    const entries: {
      id: string;
      label: string;
      coordinates: [number, number];
      routeId: string;
      stageId: string;
      stageIndex: number;
      stopKind: "location" | "route-stop";
      stopId: string;
    }[] = [];
    const seenStops = new Set<string>();
    const pushStopEntry = (
      resolved: RouteStopResolved,
      stageId: string,
      stageIndex: number,
      role: "from" | "to"
    ) => {
      if (!resolved.coordinates) {
        return;
      }
      const key = `${resolved.kind}:${resolved.id}`;
      if (seenStops.has(key)) {
        return;
      }
      seenStops.add(key);
      entries.push({
        id: `route-stop:${selectedRoute.route.id}:${stageId}:${role}:${resolved.kind}:${resolved.id}:${stageIndex}`,
        label: `${resolved.name}, ${resolved.kind === "location" ? "place" : "route stop"}`,
        coordinates: resolved.coordinates,
        routeId: selectedRoute.route.id,
        stageId,
        stageIndex,
        stopKind: resolved.kind,
        stopId: resolved.id
      });
    };

    for (const [stageIndex, stage] of selectedRoute.stages.entries()) {
      pushStopEntry(resolveRouteStop(stage.from, placesById, routeStopsById), stage.id, stageIndex, "from");
      pushStopEntry(resolveRouteStop(stage.to, placesById, routeStopsById), stage.id, stageIndex, "to");
    }

    return entries;
  }, [placesById, routeStopsById, selectedRoute, viewTab]);
  const selectedRouteStop =
    selectedRouteStopId && routeStopsById.has(selectedRouteStopId)
      ? routeStopsById.get(selectedRouteStopId) ?? null
      : null;
  const selectedRouteStopCoordinates = selectedRouteStop?.candidates[0]?.coordinates ?? null;
  const selectedRouteStopFocusKey =
    selectedRouteStopId && selectedRouteStopCoordinates
      ? `${selectedRouteStopId}:${selectedRouteStopCoordinates[0]}:${selectedRouteStopCoordinates[1]}`
      : null;
  const routePlacePanelActive = viewTab === "routes" && Boolean(selectedPlace || selectedRouteStop);
  const showSideBySideRoutePlacePanels =
    routePlacePanelActive &&
    !isSmallScreen &&
    viewportWidthPx >= ROUTES_SIDE_BY_SIDE_MIN_WIDTH_PX;
  const panelWidthForMap = !isSmallScreen
    ? viewTab === "routes"
      ? showSideBySideRoutePlacePanels
        ? PANEL_WIDTH * 2
        : routePlacePanelActive || viewTab === "routes"
          ? PANEL_WIDTH
          : 0
      : selectedPlace
        ? PANEL_WIDTH
        : 0
    : 0;

  const settledPanelHeightPx = sheetHeightForPosition(
    smallScreenSheetPosition,
    smallScreenSheetCollapsedHeightPx,
    smallScreenSheetMaxHeightPx
  );
  const panelHeightPx =
    smallScreenSheetDragHeightPx ??
    settledPanelHeightPx;
  const smallScreenSheetIsFull =
    panelHeightPx >= Math.max(0, smallScreenSheetMaxHeightPx - 1);
  const panelBottomInsetForMap =
    ((selectedPlace || selectedRouteStop || viewTab === "routes") && isSmallScreen)
      ? smallScreenSheetPosition === "closed"
        ? 0
        : smallScreenSheetCollapsedHeightPx + SMALL_SCREEN_SHEET_EDGE_GAP_PX
      : 0;
  const timelineVisible =
    viewTab === "map" &&
    mapMode === "ancient" &&
    (hasAncientTimeline || ancientTimelineLoadState === "error");
  const retryAncientLayer = useCallback(() => {
    setTimelineSourcesOpen(false);
    if (ancientTimelineLoadState === "error") {
      setAncientTimelineRetryToken((value) => value + 1);
      return;
    }
    setAncientLayerRetryToken((value) => value + 1);
  }, [ancientTimelineLoadState]);
  const timelineBottomInsetForMap =
    timelineVisible && isSmallScreen && !selectedPlace && viewTab === "map" ? 192 : 0;
  useLayoutEffect(() => {
    if (!timelineVisible) {
      return undefined;
    }

    const updateTimelineOverlayInset = () => {
      const card = timelineCardRef.current;
      if (!card) {
        setTimelineOverlayInsetForAttribution(0);
        return;
      }

      const bounds = card.getBoundingClientRect();
      const nextInset = Math.max(0, Math.ceil(window.innerHeight - bounds.top + 8));
      setTimelineOverlayInsetForAttribution((currentInset) =>
        currentInset === nextInset ? currentInset : nextInset
      );
    };

    updateTimelineOverlayInset();
    window.addEventListener("resize", updateTimelineOverlayInset);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && timelineCardRef.current) {
      observer = new ResizeObserver(updateTimelineOverlayInset);
      observer.observe(timelineCardRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateTimelineOverlayInset);
      observer?.disconnect();
    };
  }, [timelineVisible]);
  useLayoutEffect(() => {
    if (!timelineVisible || !timelineSourcesOpen || !isSmallScreen) {
      return undefined;
    }

    const updateTimelineSourcesPopoverHeight = () => {
      const card = timelineCardRef.current;
      const popover = timelineSourcesPopoverRef.current;
      if (!card || !popover) {
        setTimelineSourcesPopoverMaxHeightPx(null);
        return;
      }

      const nextHeight = computeTimelineSourcesPopoverMaxHeight({
        viewportHeight: window.innerHeight,
        timelineCardHeight: card.getBoundingClientRect().height,
        sourcesPopoverHeight: popover.getBoundingClientRect().height,
        topControlsSafeBottomInset: SMALL_SCREEN_TOP_CONTROLS_SAFE_BOTTOM_PX,
        attributionReservedHeight:
          SMALL_SCREEN_TIMELINE_SOURCES_ATTRIBUTION_RESERVED_HEIGHT_PX,
        timelineCardBottomOffset: TIMELINE_CARD_BOTTOM_OFFSET_PX,
        minPopoverHeight: TIMELINE_SOURCES_POPOVER_MIN_HEIGHT_PX,
        verticalGap: TIMELINE_SOURCES_VERTICAL_GAP_PX
      });
      setTimelineSourcesPopoverMaxHeightPx((currentValue) =>
        currentValue === nextHeight ? currentValue : nextHeight
      );
    };

    updateTimelineSourcesPopoverHeight();
    window.addEventListener("resize", updateTimelineSourcesPopoverHeight);
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateTimelineSourcesPopoverHeight);
      if (timelineCardRef.current) {
        observer.observe(timelineCardRef.current);
      }
      if (timelineSourcesPopoverRef.current) {
        observer.observe(timelineSourcesPopoverRef.current);
      }
    }

    return () => {
      window.removeEventListener("resize", updateTimelineSourcesPopoverHeight);
      observer?.disconnect();
    };
  }, [isSmallScreen, timelineSourcesOpen, timelineVisible]);
  const effectiveTimelineOverlayInsetForAttribution = timelineVisible ? timelineOverlayInsetForAttribution : 0;
  const timelineWidthLimitPx = Math.max(
    280,
    isSmallScreen
      ? viewportWidthPx - 32
      : selectedPlace
        ? viewportWidthPx - PANEL_WIDTH - 32
        : viewportWidthPx - 32
  );
  const timelineWidthPx = Math.min(TIMELINE_MAX_WIDTH_PX, timelineWidthLimitPx);
  const timelineMapCenterLeft = selectedPlace && !isSmallScreen ? `calc(50% + ${PANEL_WIDTH / 2}px)` : "50%";
  const timelineHorizontalPaddingPx = tokens.spacing.md;
  const timelineTrackColumnWidthPx = Math.max(
    120,
    timelineWidthPx -
      timelineHorizontalPaddingPx * 2 -
      TIMELINE_NAV_BUTTON_WIDTH_PX * 2 -
      TIMELINE_TRACK_AND_BUTTON_GAP_PX * 2
  );
  const timelineStopSpacingPx =
    sortedTimelineStops.length > 1
      ? Math.max(0, timelineTrackColumnWidthPx - TIMELINE_TRACK_THUMB_INSET_PX * 2) /
        (sortedTimelineStops.length - 1)
      : Number.POSITIVE_INFINITY;
  const showOnlyEdgeTickLabels =
    sortedTimelineStops.length > 2 && timelineStopSpacingPx < TIMELINE_MIN_STOP_SPACING_PX;
  const hideMapModeToggleOnPhoneExpandedSheet =
    isSmallScreen &&
    viewTab === "map" &&
    smallScreenSheetIsFull &&
    Boolean(selectedPlace);
  const suspendMapSelectionRefocus =
    isSmallScreen && viewTab === "map" && smallScreenSheetPosition === "full";

  const setTimelineStopByIndex = useCallback(
    (index: number) => {
      if (sortedTimelineStops.length === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(sortedTimelineStops.length - 1, index));
      setSelectedTimelineStopId(sortedTimelineStops[clampedIndex].id);
    },
    [sortedTimelineStops]
  );

  const routePanelOpen = viewTab === "routes";
  const showRoutesPanel = routePanelOpen && (!routePlacePanelActive || showSideBySideRoutePlacePanels);
  const showRoutePlacePanel = routePanelOpen && routePlacePanelActive;
  const showRouteBackLink = showRoutePlacePanel && !showSideBySideRoutePlacePanels;
  const showMapTabPlacePanel = viewTab === "map" && Boolean(selectedPlace);
  const showDualRoutesPanelsOnDesktop = !isSmallScreen && showRoutesPanel && showRoutePlacePanel && showSideBySideRoutePlacePanels;
  const routePanelsRightEdgePx = showDualRoutesPanelsOnDesktop ? PANEL_WIDTH * 2 : PANEL_WIDTH;
  const centeredTabsLeftPx =
    routePanelsRightEdgePx + (viewportWidthPx - routePanelsRightEdgePx - SEGMENTED_CONTROL_MIN_WIDTH_PX) / 2;
  const mapToggleLeftPx =
    viewportWidthPx - tokens.spacing.md - SEGMENTED_CONTROL_MIN_WIDTH_PX;
  const centeredTabsWouldAvoidToggle =
    centeredTabsLeftPx + SEGMENTED_CONTROL_MIN_WIDTH_PX + MAP_TOP_CONTROL_CLEARANCE_PX <= mapToggleLeftPx;
  const tabsLeftWithDualPanelsPx = centeredTabsWouldAvoidToggle
    ? centeredTabsLeftPx
    : routePanelsRightEdgePx + tokens.spacing.md;
  const viewTabsDesktopLeft = showDualRoutesPanelsOnDesktop
    ? `${Math.round(tabsLeftWithDualPanelsPx)}px`
    : "50%";
  const viewTabsDesktopTransform = showDualRoutesPanelsOnDesktop ? "none" : "translateX(-50%)";
  const commonSmallScreenPanelStyle: CSSProperties = {
    position: "absolute",
    left: smallScreenSheetIsFull ? "0" : `${tokens.spacing.md}px`,
    right: smallScreenSheetIsFull ? "0" : `${tokens.spacing.md}px`,
    bottom: smallScreenSheetIsFull ? "0" : `${tokens.spacing.md}px`,
    height: `${Math.round(panelHeightPx)}px`,
    maxHeight: smallScreenSheetIsFull ? "100%" : "calc(100% - 16px)",
    boxSizing: "border-box" as const,
    backgroundColor: tokens.color.surface,
    border: `1px solid ${tokens.color.divider}`,
    borderRadius: smallScreenSheetIsFull ? "0" : "16px",
    padding: `${tokens.spacing.md}px`,
    boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
    overflowX: "hidden",
    overflowY: "auto",
    transition:
      prefersReducedMotion || smallScreenSheetDragHeightPx !== null
        ? "none"
        : "height 160ms ease-out",
    zIndex: smallScreenSheetIsFull ? 60 : 20
  };
  const routePanelStyle: CSSProperties | null = showRoutesPanel
    ? isSmallScreen
      ? commonSmallScreenPanelStyle
      : {
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${PANEL_WIDTH}px`,
          boxSizing: "border-box" as const,
          backgroundColor: tokens.color.surface,
          borderRight: `1px solid ${tokens.color.divider}`,
          padding: `${PANEL_CONTENT_TOP_PADDING}px ${tokens.spacing.lg}px ${tokens.spacing.lg}px`,
          boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
          overflowX: "hidden",
          overflowY: "auto",
          zIndex: 20
        }
    : null;
  const placePanelStyle: CSSProperties | null = showMapTabPlacePanel || showRoutePlacePanel
    ? isSmallScreen
      ? commonSmallScreenPanelStyle
      : {
          position: "absolute",
          top: 0,
          left: showRoutePlacePanel && showSideBySideRoutePlacePanels ? `${PANEL_WIDTH}px` : 0,
          bottom: 0,
          width: `${PANEL_WIDTH}px`,
          boxSizing: "border-box" as const,
          backgroundColor: tokens.color.surface,
          borderRight: showRoutePlacePanel && !showSideBySideRoutePlacePanels
            ? `1px solid ${tokens.color.divider}`
            : undefined,
          borderLeft: showRoutePlacePanel && showSideBySideRoutePlacePanels
            ? `1px solid ${tokens.color.divider}`
            : undefined,
          padding: `${PANEL_CONTENT_TOP_PADDING}px ${tokens.spacing.lg}px ${tokens.spacing.lg}px`,
          boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
          overflowX: "hidden",
          overflowY: "auto",
          zIndex: 21
        }
    : null;

  const handleSelectRoute = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    setRouteToRevealOnList(routeId);
    setSelectedStageIndex(null);
    setHighlightedStageIndex(null);
    setSelectedRouteStopId(null);
    setSelectionOrigin("url");
    setSelection(null);
    setStatusMessage(null);
  }, []);

  const handleSelectRouteMapEntry = useCallback(
    (
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
    ) => {
      setViewTab("routes");
      setSelectedRouteId(entry.routeId);
      setRouteToRevealOnList(entry.routeId);
      setSelectedStageIndex(entry.stageIndex);
      setSelectedRouteStopId(null);
      if (entry.kind === "stop") {
        if (entry.stopKind === "location") {
          setSelectionOrigin(entry.origin);
          setSelection({ placeId: entry.stopId, candidateIndex: null });
        } else {
          setSelectionOrigin("url");
          setSelectedRouteStopId(entry.stopId);
        }
      }
    },
    []
  );

  return (
    <div
      data-app-shell-root
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: tokens.color.surface,
        fontFamily: tokens.typography.uiFont
      }}
    >
      <SearchMenu
        inputRef={searchInputRef}
        onSelectPlace={handleSearchSelection}
        places={places}
      />

      <div
        aria-label="View"
        role="tablist"
        style={{
          position: "absolute",
          left: isSmallScreen ? `${tokens.spacing.md}px` : viewTabsDesktopLeft,
          transform: isSmallScreen ? "none" : viewTabsDesktopTransform,
          top: isSmallScreen ? `${VIEW_TABS_TOP_OFFSET_PX}px` : `${tokens.spacing.md}px`,
          display: "inline-flex",
          borderRadius: "999px",
          border: `1px solid ${tokens.color.divider}`,
          backgroundColor: tokens.color.surface,
          boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
          padding: "2px",
          zIndex: 46
        }}
      >
        {([
          ["map", "Map"],
          ["routes", "Routes"]
        ] as const).map(([value, label]) => {
          const selected = viewTab === value;
          return (
            <button
              aria-selected={selected}
              data-view-tab={value}
              key={value}
              onClick={() => setViewTab(value)}
              onKeyDown={handleViewTabKeyDown}
              role="tab"
              tabIndex={selected ? 0 : -1}
              style={{
                minWidth: "86px",
                height: "36px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: selected ? "#1A73E8" : "transparent",
                color: selected ? "#FFFFFF" : tokens.color.textPrimary,
                fontFamily: tokens.typography.uiFont,
                fontSize: `${tokens.typography.captionSize}px`,
                fontWeight: 600,
                cursor: "pointer"
              }}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      {!hideMapModeToggleOnPhoneExpandedSheet ? (
        <div
          aria-label="Map type"
          role="radiogroup"
          style={{
            position: "absolute",
            right: `${tokens.spacing.md}px`,
            top: isSmallScreen ? `${MAP_TOGGLE_TOP_OFFSET_PX}px` : `${tokens.spacing.md}px`,
            display: "inline-flex",
            borderRadius: "999px",
            border: `1px solid ${tokens.color.divider}`,
            backgroundColor: tokens.color.surface,
            boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
            padding: "2px",
            zIndex: 45
          }}
        >
          {([
            ["ancient", "Ancient"],
            ["modern", "Modern"]
          ] as const).map(([value, label]) => {
            const selected = mapMode === value;
            return (
              <button
                aria-checked={selected}
                data-map-mode={value}
                key={value}
                onClick={() => {
                  if (value !== "ancient") {
                    setTimelineSourcesOpen(false);
                  }
                  setMapMode(value);
                }}
                onKeyDown={handleMapModeRadioKeyDown}
                role="radio"
                tabIndex={selected ? 0 : -1}
                style={{
                  minWidth: "86px",
                  height: "36px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: selected ? "#1A73E8" : "transparent",
                  color: selected ? "#FFFFFF" : tokens.color.textPrimary,
                  fontFamily: tokens.typography.uiFont,
                  fontSize: `${tokens.typography.captionSize}px`,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <MapLoadingPlaceholder />
      ) : (
        <Suspense fallback={<MapLoadingPlaceholder />}>
          <LazyMapView
            ancientTimeline={ancientTimeline}
            ancientLayerRetryToken={ancientLayerRetryToken}
            bottomPanelInset={Math.max(panelBottomInsetForMap, timelineBottomInsetForMap)}
            highlightedPlaceId={highlightedPlaceId}
            isSmallScreen={isSmallScreen}
            leftPanelWidth={panelWidthForMap}
            mapMode={mapMode}
            onAncientLayerLoadStateChange={setAncientLayerStatus}
            onSelectRouteMapEntry={handleSelectRouteMapEntry}
            onSelectPlace={handleSelectFromMap}
            pinLabelSource={PIN_LABEL_SOURCE}
            places={places}
            routeKeyboardEntries={routeKeyboardEntries}
            selectedRouteStopCoordinates={selectedRouteStopCoordinates}
            selectedRouteStopFocusKey={selectedRouteStopFocusKey}
            routesOverlay={routeMapOverlay}
            suspendSelectionCameraUpdates={suspendMapSelectionRefocus}
            selectionOrigin={selectionOrigin}
            selectedTimelineStopId={
              viewTab === "routes" && selectedRouteTimelineStop
                ? selectedRouteTimelineStop.id
                : selectedTimelineStopId
            }
            selection={selection}
            compactAttributionExpandedReserveHeight={
              SMALL_SCREEN_COMPACT_ATTRIBUTION_EXPANDED_RESERVE_HEIGHT_PX
            }
            timelineOverlayInset={effectiveTimelineOverlayInsetForAttribution}
            topControlsSafeBottomInset={SMALL_SCREEN_TOP_CONTROLS_SAFE_BOTTOM_PX}
          />
        </Suspense>
      )}

      {timelineVisible ? (
        <div
          data-timeline-card="true"
          ref={timelineCardRef}
          style={{
            position: "absolute",
            left: timelineMapCenterLeft,
            bottom: isSmallScreen
              ? `${tokens.spacing.md}px`
              : `${Math.max(tokens.spacing.md, panelBottomInsetForMap + tokens.spacing.md)}px`,
            transform: "translateX(-50%)",
            width: `${Math.round(timelineWidthPx)}px`,
            maxWidth: `${Math.round(timelineWidthPx)}px`,
            borderRadius: "8px",
            border: `1px solid ${tokens.color.divider}`,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
            boxSizing: "border-box",
            padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
            zIndex: isSmallScreen ? 11 : 30
          }}
        >
          {ancientTimelineLoadState === "error" || ancientLayerStatus === "error" || !selectedTimelineStop ? (
            <div role="status" style={{ color: tokens.color.textPrimary, fontSize: `${tokens.typography.captionSize}px` }}>
              Ancient layer data failed to load.{" "}
              <button
                onClick={retryAncientLayer}
                style={{
                  border: "none",
                  background: "none",
                  color: "#1A73E8",
                  cursor: "pointer",
                  fontSize: `${tokens.typography.captionSize}px`,
                  padding: 0,
                  textDecoration: "underline"
                }}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  color: tokens.color.textPrimary,
                  fontSize: `${tokens.typography.captionSize}px`,
                  lineHeight: `${tokens.typography.captionLineHeight}px`
                }}
              >
                {formatTimelineYear(selectedTimelineStop.year)} · {selectedTimelineStop.title}{" "}
                <button
                  aria-expanded={timelineSourcesOpen}
                  onClick={() => setTimelineSourcesOpen((value) => !value)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#1A73E8",
                    cursor: "pointer",
                    fontSize: `${tokens.typography.captionSize}px`,
                    padding: 0
                  }}
                  type="button"
                >
                  Sources
                </button>
              </div>
              <div
                aria-live="polite"
                data-timeline-stop-live-region="true"
                style={srOnlyStyle}
              >
                {formatTimelineValueText(selectedTimelineStop)}
              </div>
              {timelineSourcesOpen ? (
                <div
                  aria-label="Timeline sources and notes"
                  data-timeline-sources-popover="true"
                  ref={timelineSourcesPopoverRef}
                  tabIndex={0}
                  style={{
                    marginTop: `${tokens.spacing.xs}px`,
                    padding: `${tokens.spacing.sm}px`,
                    borderRadius: "8px",
                    backgroundColor: tokens.color.subtleSurface,
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`,
                    maxHeight:
                      isSmallScreen && timelineSourcesPopoverMaxHeightPx
                        ? `${timelineSourcesPopoverMaxHeightPx}px`
                        : undefined,
                    overflowY: isSmallScreen ? "auto" : undefined,
                    overscrollBehavior: isSmallScreen ? "contain" : undefined
                  }}
                >
                  <p style={{ margin: 0 }}>{selectedTimelineStop.summary}</p>
                  {selectedTimelineStop.scripture.length > 0 ? (
                    <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
                      <strong>Passages:</strong>
                      <ul style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
                        {selectedTimelineStop.scripture.map((reference) => (
                          <li key={reference}>{reference.replace(/^scripture:/u, "")}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {selectedTimelineStop.sources.length > 0 ? (
                    <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
                      <strong>Sources:</strong>
                      <ul style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
                        {selectedTimelineStop.sources.map((sourceId) => {
                          const source = formatSourceCitation(sourceId, timelineBibliographyById);
                          return (
                            <li key={sourceId}>
                              {source.url ? (
                                <a
                                  href={source.url}
                                  rel="noopener noreferrer"
                                  style={{ color: "#1A73E8" }}
                                  target="_blank"
                                >
                                  {source.label}
                                </a>
                              ) : (
                                source.label
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                  <p style={{ margin: `${tokens.spacing.xs}px 0 0` }}>
                    Borders are approximate, and the routes of some roads are conjectured. Provinces far from the New Testament&apos;s places are shown together, and lands whose borders aren&apos;t known, such as Abilene, Chalcis or Emesa, aren&apos;t drawn. Polemon&apos;s kingdom of Pontus, Pontus Galaticus and Armenia Minor share one area because no source draws the lines between them.
                  </p>
                </div>
              ) : null}
              <div
                style={{
                  marginTop: `${tokens.spacing.sm}px`,
                  display: "grid",
                  gridTemplateColumns: `${TIMELINE_NAV_BUTTON_WIDTH_PX}px minmax(0, 1fr) ${TIMELINE_NAV_BUTTON_WIDTH_PX}px`,
                  gridTemplateRows: `${TIMELINE_TRACK_THUMB_DIAMETER_PX}px auto`,
                  alignItems: "center",
                  columnGap: `${tokens.spacing.sm}px`
                }}
              >
                <button
                  aria-label="Earlier change"
                  disabled={selectedTimelineStopIndex <= 0}
                  onClick={() => setTimelineStopByIndex(selectedTimelineStopIndex - 1)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "22px",
                    border: `1px solid ${tokens.color.divider}`,
                    backgroundColor: "#FFFFFF",
                    color: tokens.color.textPrimary,
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  ‹
                </button>
                <div style={{ minWidth: 0, gridColumn: 2, gridRow: 1 }}>
                  <div
                    style={{
                      position: "relative",
                      height: `${TIMELINE_TRACK_THUMB_DIAMETER_PX}px`
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: `${TIMELINE_TRACK_THUMB_INSET_PX}px`,
                        right: `${TIMELINE_TRACK_THUMB_INSET_PX}px`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: `${TIMELINE_TRACK_THICKNESS_PX}px`,
                        borderRadius: `${TIMELINE_TRACK_THICKNESS_PX / 2}px`,
                        backgroundColor: "#C9CDD1"
                      }}
                    />
                    <div
                      aria-hidden="true"
                      data-timeline-slider-thumb="true"
                      style={{
                        position: "absolute",
                        left: timelineTickPosition(
                          Math.max(0, selectedTimelineStopIndex) / Math.max(1, sortedTimelineStops.length - 1)
                        ),
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: `${TIMELINE_TRACK_THUMB_DIAMETER_PX}px`,
                        height: `${TIMELINE_TRACK_THUMB_DIAMETER_PX}px`,
                        borderRadius: "50%",
                        border: "2px solid #1A73E8",
                        backgroundColor: "#FFFFFF",
                        boxSizing: "border-box"
                      }}
                    />
                    <input
                      aria-label="Year"
                      aria-valuetext={formatTimelineValueText(selectedTimelineStop)}
                      className="ibm-timeline-slider-input"
                      data-timeline-slider="true"
                      max={Math.max(0, sortedTimelineStops.length - 1)}
                      min={0}
                      onChange={(event) => {
                        setTimelineStopByIndex(Number.parseInt(event.currentTarget.value, 10));
                      }}
                      step={1}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        margin: 0,
                        opacity: 0,
                        cursor: "pointer"
                      }}
                      type="range"
                      value={Math.max(0, selectedTimelineStopIndex)}
                    />
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    gridColumn: 2,
                    gridRow: 2,
                    position: "relative",
                    marginTop: `${tokens.spacing.xs}px`,
                    height: "40px"
                  }}
                >
                  {sortedTimelineStops.map((stop, stopIndex) => {
                    const denominator = Math.max(1, sortedTimelineStops.length - 1);
                    const fraction = denominator === 0 ? 0 : stopIndex / denominator;
                    const showTickLabel =
                      !showOnlyEdgeTickLabels ||
                      stopIndex === 0 ||
                      stopIndex === sortedTimelineStops.length - 1;
                    return (
                      <div
                        data-timeline-tick-stop-id={stop.id}
                        key={stop.id}
                        style={{
                          position: "absolute",
                          left: timelineTickPosition(fraction),
                          transform: "translateX(-50%)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          minWidth: "2px"
                        }}
                      >
                        <span
                          style={{
                            width: "1px",
                            height: "8px",
                            backgroundColor: "#5F6368"
                          }}
                        />
                        {showTickLabel ? (
                          <span
                            style={{
                              marginTop: "4px",
                              whiteSpace: "nowrap",
                              fontSize: `${tokens.typography.captionSize}px`,
                              color: tokens.color.textSecondary
                            }}
                          >
                            {timelineStopTickLabel(sortedTimelineStops, stopIndex)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <button
                  aria-label="Later change"
                  disabled={selectedTimelineStopIndex < 0 || selectedTimelineStopIndex >= sortedTimelineStops.length - 1}
                  onClick={() => setTimelineStopByIndex(selectedTimelineStopIndex + 1)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "22px",
                    border: `1px solid ${tokens.color.divider}`,
                    backgroundColor: "#FFFFFF",
                    color: tokens.color.textPrimary,
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  ›
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
      <div id="ibm-visible-places-portal-root" style={srOnlyStyle} />

      {routePanelStyle ? (
        <section
          aria-label="Route details"
          data-small-screen-half-height-px={isSmallScreen ? `${Math.round(smallScreenSheetCollapsedHeightPx)}` : undefined}
          onPointerDown={(event) => {
            if (isSmallScreenSheetStripPointerDown(event, "route-list")) {
              handleSmallScreenSheetTopStripPointerDown(event, { canClose: false });
              return;
            }
            handleSmallScreenSheetContentPointerDown(event, { canClose: false });
          }}
          style={routePanelStyle}
        >
          {isSmallScreen ? (
            <SmallScreenSheetTopStrip
              expanded={smallScreenSheetPosition === "full"}
              focused={routeListSheetHandleFocused}
              onHandleBlur={() => setRouteListSheetHandleFocused(false)}
              onHandleClick={() => {
                if (suppressNextHandleClickRef.current) {
                  suppressNextHandleClickRef.current = false;
                  return;
                }
                setSmallScreenSheetDragHeightPx(null);
                setSmallScreenSheetPosition((current) => (current === "full" ? "half" : "full"));
              }}
              onHandleFocus={() => setRouteListSheetHandleFocused(true)}
              onHandlePointerDown={(event) =>
                beginSmallScreenSheetDrag(event, {
                  canClose: false,
                  requiresDownwardMotion: false,
                  allowTapToggle: true
                })
              }
              stripId="route-list"
            />
          ) : null}
          <div data-routes-panel="true">
            <RoutesPanel
              hydratedRoutes={hydratedRoutes}
              onBackToAllRoutes={() => {
                setSelectedRouteId(null);
                setSelectedStageIndex(null);
                setHighlightedStageIndex(null);
                setSelectedRouteStopId(null);
                setSelectionOrigin("url");
                setSelection(null);
              }}
              onHighlightStage={setHighlightedStageIndex}
              onResolveStopSelection={(resolvedStop, stageIndex) => {
                setSmallScreenSheetPosition("half");
                setSmallScreenSheetDragHeightPx(null);
                setSelectedStageIndex(stageIndex);
                if (resolvedStop.kind === "location") {
                  setSelectedRouteStopId(null);
                  setSelectionOrigin("route-panel-stop");
                  setSelection({ placeId: resolvedStop.id, candidateIndex: null });
                } else {
                  setSelectionOrigin("url");
                  setSelection(null);
                  setSelectedRouteStopId(resolvedStop.id);
                }
              }}
              onRetryLoad={() => {
                setRoutesLoadState("idle");
                setRoutesReloadToken((value) => value + 1);
              }}
              onSelectRoute={handleSelectRoute}
              onSelectStage={(stageIndex) => {
                setSelectedRouteStopId(null);
                setSelectionOrigin("url");
                setSelection(null);
                setSelectedStageIndex(stageIndex);
              }}
              placesById={placesById}
              routeStopsById={routeStopsById}
              routesData={routesData}
              routesLoadState={routesLoadState}
              selectedRoute={selectedRoute}
              selectedRouteBorderYear={selectedRoute?.route.fromYear ?? null}
              selectedStageIndex={selectedStageIndex}
              routeToRevealOnList={selectedRouteId ?? routeToRevealOnList}
            />
          </div>
        </section>
      ) : null}
      {placePanelStyle && selectedPlace ? (
        <section
          aria-label="Place details"
          data-small-screen-half-height-px={isSmallScreen ? `${Math.round(smallScreenSheetCollapsedHeightPx)}` : undefined}
          data-route-place-panel={viewTab === "routes" ? "true" : "false"}
          onPointerDown={(event) => {
            if (isSmallScreenSheetStripPointerDown(event, "place")) {
              handleSmallScreenSheetTopStripPointerDown(event, { canClose: true });
              return;
            }
            handleSmallScreenSheetContentPointerDown(event, { canClose: true });
          }}
          style={placePanelStyle}
        >
          {showRouteBackLink ? (
            <button
              data-back-to-route="true"
              onClick={() => {
                setSelectionOrigin("url");
                setSelection(null);
                setSelectedRouteStopId(null);
                setHighlightedPlaceId(null);
                setSmallScreenSheetPosition("half");
                setSmallScreenSheetDragHeightPx(null);
              }}
              style={{ border: "none", background: "none", color: "#1A73E8", padding: 0, cursor: "pointer", marginBottom: `${tokens.spacing.sm}px` }}
              type="button"
            >
              ‹ Back to route
            </button>
          ) : null}
          <PlacePanel
            key={selectedPlace.id}
            isLoading={selectedPlaceLoading}
            isSmallScreen={isSmallScreen}
            isSmallScreenExpanded={smallScreenSheetPosition === "full"}
            loadErrorMessage={selectedPlaceLoadError}
            onClose={() => closePanel(false)}
            onHighlightPlace={handlePanelHighlightPlace}
            onSmallScreenHandlePointerDown={(event) => {
              beginSmallScreenSheetDrag(event, {
                canClose: true,
                requiresDownwardMotion: false,
                allowTapToggle: true
              });
            }}
            onSelectCandidate={handlePanelSelectCandidate}
            onSelectPlace={handlePanelSelectPlace}
            onSelectPlaceFromAbout={handlePanelSelectPlaceFromAbout}
            onToggleSmallScreenExpanded={() => {
              setSmallScreenSheetDragHeightPx(null);
              if (suppressNextHandleClickRef.current) {
                suppressNextHandleClickRef.current = false;
                return;
              }
              setSmallScreenSheetPosition((current) =>
                current === "full" ? "half" : "full"
              );
            }}
            placeDetails={selectedPlaceDetails}
            places={places}
            placesById={placesById}
            selectedPlace={selectedPlace}
            selection={selection ?? { placeId: selectedPlace.id, candidateIndex: null }}
          />
        </section>
      ) : null}
      {placePanelStyle && !selectedPlace && selectedRouteStop ? (
        <section
          aria-label="Place details"
          data-small-screen-half-height-px={isSmallScreen ? `${Math.round(smallScreenSheetCollapsedHeightPx)}` : undefined}
          data-route-place-panel="true"
          onPointerDown={(event) => {
            if (isSmallScreenSheetStripPointerDown(event, "route-stop")) {
              handleSmallScreenSheetTopStripPointerDown(event, { canClose: true });
              return;
            }
            handleSmallScreenSheetContentPointerDown(event, { canClose: true });
          }}
          style={placePanelStyle}
        >
          {isSmallScreen ? (
            <SmallScreenSheetTopStrip
              expanded={smallScreenSheetPosition === "full"}
              focused={routeStopSheetHandleFocused}
              onHandleBlur={() => setRouteStopSheetHandleFocused(false)}
              onHandleClick={() => {
                if (suppressNextHandleClickRef.current) {
                  suppressNextHandleClickRef.current = false;
                  return;
                }
                setSmallScreenSheetDragHeightPx(null);
                setSmallScreenSheetPosition((current) => (current === "full" ? "half" : "full"));
              }}
              onHandleFocus={() => setRouteStopSheetHandleFocused(true)}
              onHandlePointerDown={(event) =>
                beginSmallScreenSheetDrag(event, {
                  canClose: true,
                  requiresDownwardMotion: false,
                  allowTapToggle: true
                })
              }
              stripId="route-stop"
            />
          ) : null}
          <RouteStopDetailsPanel
            bibliographyById={routeBibliographyById}
            onBackToRoute={() => {
              setSelectedRouteStopId(null);
              setSmallScreenSheetPosition("half");
              setSmallScreenSheetDragHeightPx(null);
            }}
            onClose={() => {
              setSelectedRouteStopId(null);
              setSmallScreenSheetPosition("half");
              setSmallScreenSheetDragHeightPx(null);
            }}
            selectedRouteStop={selectedRouteStop}
            showBackToRoute={showRouteBackLink}
          />
        </section>
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          style={{
            position: "absolute",
            top: "72px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: tokens.color.surface,
            border: `1px solid ${tokens.color.divider}`,
            borderRadius: "8px",
            padding: "8px 12px",
            color: tokens.color.textPrimary,
            fontSize: `${tokens.typography.bodySize}px`,
            boxShadow: "0 1px 2px rgba(60,64,67,.3), 0 2px 6px rgba(60,64,67,.15)"
          }}
        >
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          style={{
            position: "absolute",
            left: "50%",
            top: "120px",
            transform: "translateX(-50%)",
            backgroundColor: "#FCE8E6",
            color: "#A50E0E",
            border: "1px solid #F6AEA9",
            borderRadius: "8px",
            padding: "8px 12px"
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
