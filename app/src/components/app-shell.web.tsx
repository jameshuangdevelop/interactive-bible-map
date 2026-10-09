import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";

import { SearchMenu } from "./search-menu";
import { PlacePanel } from "../features/place-panel/place-panel.web";
import { formatSourceCitation } from "../features/place-panel/source-format";
import { sortPlacesByImportance } from "../features/map/place-importance";
import { ANCIENT_LAYER_STYLE } from "../features/map/ancient-layer-style";
import {
  applyMapModeToSearch,
  applyTimelineYearToSearch,
  applySelectionToSearch,
  parseMapModeFromSearch,
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
  PlaceSelection
} from "../features/map/types";
import { tokens } from "../theme/tokens";

const PANEL_WIDTH = 408;
const SEARCH_TOP_OFFSET = tokens.spacing.md;
const SEARCH_HEIGHT = 48;
const PANEL_CONTENT_TOP_PADDING = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + tokens.spacing.md;
const MAP_PLACEHOLDER_COLOR = "#F1EEE4";
const SMALL_SCREEN_BREAKPOINT = 768;
const SMALL_SCREEN_SHEET_EDGE_GAP_PX = 16;
const SMALL_SCREEN_SHEET_TOP_CLEARANCE_PX = PANEL_CONTENT_TOP_PADDING + 56;
const SMALL_SCREEN_SHEET_COLLAPSED_RATIO = 0.53;
const SMALL_SCREEN_SHEET_MIN_COLLAPSED_HEIGHT_PX = 260;
const SMALL_SCREEN_SHEET_DRAG_TOGGLE_THRESHOLD_PX = 6;
const MAP_TOGGLE_TOP_OFFSET_PX = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + 8;
const PIN_LABEL_SOURCE: PinLabelSource = "biblical";
const MAP_MODE_ORDER: readonly MapDisplayMode[] = ["ancient", "modern"];
const TIMELINE_DEFAULT_YEAR = 50;
const TIMELINE_TRACK_THICKNESS_PX = 2;
const TIMELINE_TRACK_THUMB_DIAMETER_PX = 20;
const TIMELINE_TRACK_THUMB_INSET_PX = TIMELINE_TRACK_THUMB_DIAMETER_PX / 2;
const TIMELINE_MAX_WIDTH_PX = 800;
const TIMELINE_MIN_STOP_SPACING_PX = 36;
const TIMELINE_NAV_BUTTON_WIDTH_PX = 44;
const TIMELINE_TRACK_AND_BUTTON_GAP_PX = 12;

function toRgba(hexColor: string, opacity: number) {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  if (![red, green, blue].every(Number.isFinite)) {
    return hexColor;
  }

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
type SmallScreenSheetMode = "collapsed" | "expanded";

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

export function AppShell() {
  const [places, setPlaces] = useState<PlaceIndexRecord[]>([]);
  const [selection, setSelection] = useState<PlaceSelection | null>(null);
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
  const [smallScreenSheetMode, setSmallScreenSheetMode] = useState<SmallScreenSheetMode>("collapsed");
  const [smallScreenSheetDragHeightPx, setSmallScreenSheetDragHeightPx] = useState<number | null>(
    null
  );
  const [viewportHeightPx, setViewportHeightPx] = useState(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  const [viewportWidthPx, setViewportWidthPx] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
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
  const [mapKeyOpen, setMapKeyOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastSelectionActivatorEntryIdRef = useRef<string | null>(null);
  const loadingPlaceDetailsIdsRef = useRef(new Set<string>());
  const placeDetailsRequestGenerationByIdRef = useRef(new Map<string, number>());
  const unmountedRef = useRef(false);
  const smallScreenSheetDragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startHeightPx: number;
    movedPx: number;
  } | null>(null);
  const suppressNextHandleClickRef = useRef(false);

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selectedPlace = selection ? placesById.get(selection.placeId) ?? null : null;
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
  const smallScreenSheetMaxHeightPx = Math.max(
    0,
    viewportHeightPx - SMALL_SCREEN_SHEET_EDGE_GAP_PX - SMALL_SCREEN_SHEET_TOP_CLEARANCE_PX
  );
  const smallScreenSheetCollapsedHeightPx = Math.min(
    smallScreenSheetMaxHeightPx,
    Math.max(
      SMALL_SCREEN_SHEET_MIN_COLLAPSED_HEIGHT_PX,
      Math.round(smallScreenSheetMaxHeightPx * SMALL_SCREEN_SHEET_COLLAPSED_RATIO)
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
    if (!isSmallScreen) {
      smallScreenSheetDragStateRef.current = null;
      return undefined;
    }

    const onPointerMove = (event: PointerEvent) => {
      const dragState = smallScreenSheetDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      const nextHeightPx = Math.min(
        smallScreenSheetMaxHeightPx,
        Math.max(
          smallScreenSheetCollapsedHeightPx,
          dragState.startHeightPx + (dragState.startY - event.clientY)
        )
      );
      dragState.movedPx = Math.max(dragState.movedPx, Math.abs(event.clientY - dragState.startY));
      setSmallScreenSheetDragHeightPx(nextHeightPx);
    };

    const onPointerUp = (event: PointerEvent) => {
      const dragState = smallScreenSheetDragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      smallScreenSheetDragStateRef.current = null;
      const movedLessThanTapThreshold =
        dragState.movedPx <= SMALL_SCREEN_SHEET_DRAG_TOGGLE_THRESHOLD_PX;
      const startedExpanded =
        dragState.startHeightPx >=
        (smallScreenSheetCollapsedHeightPx +
          (smallScreenSheetMaxHeightPx - smallScreenSheetCollapsedHeightPx) / 2);
      if (movedLessThanTapThreshold) {
        setSmallScreenSheetMode(startedExpanded ? "collapsed" : "expanded");
        setSmallScreenSheetDragHeightPx(null);
        suppressNextHandleClickRef.current = true;
        return;
      }

      const finalHeightPx = Math.min(
        smallScreenSheetMaxHeightPx,
        Math.max(smallScreenSheetCollapsedHeightPx, smallScreenSheetDragHeightPx ?? dragState.startHeightPx)
      );
      const dragRangePx = smallScreenSheetMaxHeightPx - smallScreenSheetCollapsedHeightPx;
      const dragThresholdPx = Math.min(120, Math.max(48, dragRangePx * 0.33));
      const nextMode = startedExpanded
        ? finalHeightPx <= smallScreenSheetMaxHeightPx - dragThresholdPx
          ? "collapsed"
          : "expanded"
        : finalHeightPx >= smallScreenSheetCollapsedHeightPx + dragThresholdPx
          ? "expanded"
          : "collapsed";
      setSmallScreenSheetMode(nextMode);
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
    smallScreenSheetCollapsedHeightPx,
    smallScreenSheetDragHeightPx,
    smallScreenSheetMaxHeightPx
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
        if (parsedMapMode !== "ancient") {
          setTimelineSourcesOpen(false);
          setMapKeyOpen(false);
        }
        setMapMode(parsedMapMode);
        const normalized = normalizeSelection(parsedSelection, loadedPlacesById);

        if (parsedSelection && !normalized) {
          lastSelectionActivatorEntryIdRef.current = null;
          setHighlightedPlaceId(null);
          setStatusMessage("Place not found");
          writeSelectionToUrl(null);
        } else if (normalized) {
          lastSelectionActivatorEntryIdRef.current = null;
          setHighlightedPlaceId(null);
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
      const normalized = normalizeSelection(parsedSelection, placesById);
      if (parsedMapMode !== "ancient") {
        setTimelineSourcesOpen(false);
        setMapKeyOpen(false);
      }
      setMapMode(parsedMapMode);
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
        setSelection(null);
        setStatusMessage(null);
        return;
      }

      if (!normalized) {
        lastSelectionActivatorEntryIdRef.current = null;
        setHighlightedPlaceId(null);
        setSelection(null);
        setStatusMessage("Place not found");
        return;
      }

      lastSelectionActivatorEntryIdRef.current = null;
      setHighlightedPlaceId(null);
      setStatusMessage(null);
      setSelection(normalized);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [ancientTimeline, loading, placesById, urlStateReady]);

  const closePanel = useCallback((restoreFocus: boolean) => {
    setSelection(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetMode("collapsed");
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

  useEffect(() => {
    if (!selectedPlace) {
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
  }, [closePanel, selectedPlace]);

  const handleSelectFromMap = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetMode("collapsed");
    setSmallScreenSheetDragHeightPx(null);

    const activeElement = document.activeElement;
    lastSelectionActivatorEntryIdRef.current =
      activeElement instanceof HTMLElement
        ? activeElement.getAttribute("data-place-entry-id")
        : null;

    setSelection(nextSelection);
  }, []);

  const handlePanelSelectPlace = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetMode("collapsed");
    setSmallScreenSheetDragHeightPx(null);
    setSelection(nextSelection);
  }, []);

  const handlePanelSelectPlaceFromAbout = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetMode("collapsed");
    setSmallScreenSheetDragHeightPx(null);
    lastSelectionActivatorEntryIdRef.current = null;
    writeSelectionToUrl(nextSelection, "push");
    setSelection(nextSelection);
  }, []);

  const handlePanelSelectCandidate = useCallback(
    (candidateIndex: number) => {
      if (!selection) {
        return;
      }

      setHighlightedPlaceId(null);
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
  const panelWidthForMap = selectedPlace && !isSmallScreen ? PANEL_WIDTH : 0;

  const handleSearchSelection = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setHighlightedPlaceId(null);
    setSmallScreenSheetMode("collapsed");
    setSmallScreenSheetDragHeightPx(null);
    lastSelectionActivatorEntryIdRef.current = null;
    setSelection(nextSelection);
  }, []);
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
        setMapKeyOpen(false);
      }
      setMapMode(nextMode);
      event.currentTarget
        .closest("[role='radiogroup']")
        ?.querySelector<HTMLButtonElement>(`button[role='radio'][data-map-mode='${nextMode}']`)
        ?.focus();
    },
    [mapMode]
  );

  useEffect(() => {
    if (!mapKeyOpen && !timelineSourcesOpen) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setMapKeyOpen(false);
      setTimelineSourcesOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mapKeyOpen, timelineSourcesOpen]);

  const panelHeightPx =
    smallScreenSheetDragHeightPx ??
    (smallScreenSheetMode === "expanded"
      ? smallScreenSheetMaxHeightPx
      : smallScreenSheetCollapsedHeightPx);
  const panelBottomInsetForMap = selectedPlace && isSmallScreen ? panelHeightPx + SMALL_SCREEN_SHEET_EDGE_GAP_PX : 0;
  const timelineVisible =
    mapMode === "ancient" && (hasAncientTimeline || ancientTimelineLoadState === "error");
  const retryAncientLayer = useCallback(() => {
    setTimelineSourcesOpen(false);
    if (ancientTimelineLoadState === "error") {
      setAncientTimelineRetryToken((value) => value + 1);
      return;
    }
    setAncientLayerRetryToken((value) => value + 1);
  }, [ancientTimelineLoadState]);
  const timelineBottomInsetForMap = timelineVisible && isSmallScreen && !selectedPlace ? 192 : 0;
  const timelineOverlayInsetForAttribution = timelineVisible
    ? isSmallScreen
      ? 208
      : 176
    : 0;
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
    isSmallScreen && Boolean(selectedPlace) && smallScreenSheetMode === "expanded";
  const hideMapKeyOnPhoneExpandedSheet = hideMapModeToggleOnPhoneExpandedSheet;

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

  const panelStyle: CSSProperties | null = selectedPlace
    ? isSmallScreen
      ? {
          position: "absolute",
          left: `${tokens.spacing.md}px`,
          right: `${tokens.spacing.md}px`,
          bottom: `${tokens.spacing.md}px`,
          height: `${Math.round(panelHeightPx)}px`,
          maxHeight: "calc(100% - 32px)",
          boxSizing: "border-box" as const,
          backgroundColor: tokens.color.surface,
          border: `1px solid ${tokens.color.divider}`,
          borderRadius: "16px",
          padding: `${tokens.spacing.md}px`,
          boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
          overflowX: "hidden",
          overflowY: "auto",
          zIndex: 20
        }
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
                    setMapKeyOpen(false);
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

      {mapMode === "ancient" && hasAncientTimeline && !hideMapKeyOnPhoneExpandedSheet ? (
        <div
          style={{
            position: "absolute",
            right: `${tokens.spacing.md}px`,
            top: isSmallScreen ? `${MAP_TOGGLE_TOP_OFFSET_PX + 48}px` : `${tokens.spacing.md + 48}px`,
            width: "220px",
            zIndex: 44
          }}
        >
          <button
            aria-expanded={mapKeyOpen}
            aria-haspopup="dialog"
            onClick={() => setMapKeyOpen((value) => !value)}
            style={{
              width: "100%",
              height: "36px",
              borderRadius: "18px",
              border: `1px solid ${tokens.color.divider}`,
              backgroundColor: "#FFFFFF",
              color: tokens.color.textPrimary,
              fontFamily: tokens.typography.uiFont,
              fontSize: `${tokens.typography.captionSize}px`,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)"
            }}
            type="button"
          >
            Map key
          </button>
          {mapKeyOpen ? (
            <div
              aria-label="Map key"
              role="dialog"
              style={{
                marginTop: `${tokens.spacing.sm}px`,
                borderRadius: "8px",
                border: `1px solid ${tokens.color.divider}`,
                backgroundColor: "#FFFFFF",
                color: tokens.color.textSecondary,
                fontSize: `${tokens.typography.captionSize}px`,
                lineHeight: `${tokens.typography.captionLineHeight}px`,
                padding: `${tokens.spacing.sm}px`,
                boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  rowGap: `${tokens.spacing.xs}px`,
                  columnGap: `${tokens.spacing.sm}px`,
                  alignItems: "center"
                }}
              >
                <span
                  style={{
                    height: "14px",
                    border: `1px solid ${ANCIENT_LAYER_STYLE.border.romanSideColor}`,
                    backgroundColor: toRgba(
                      ANCIENT_LAYER_STYLE.areaFill.romanProvince.color,
                      ANCIENT_LAYER_STYLE.areaFill.romanProvince.opacity
                    )
                  }}
                />
                <span>Roman province</span>
                <span
                  style={{
                    height: "14px",
                    border: `1px dashed ${ANCIENT_LAYER_STYLE.border.romanSideColor}`,
                    backgroundColor: toRgba(
                      ANCIENT_LAYER_STYLE.areaFill.client.color,
                      ANCIENT_LAYER_STYLE.areaFill.client.opacity
                    )
                  }}
                />
                <span>Allied kingdom, tetrarchy, or free city or league</span>
                <span
                  style={{
                    height: "14px",
                    border: `1px solid ${ANCIENT_LAYER_STYLE.border.outsideColor}`,
                    backgroundColor: toRgba(
                      ANCIENT_LAYER_STYLE.areaFill.outsideEmpire.color,
                      ANCIENT_LAYER_STYLE.areaFill.outsideEmpire.opacity
                    )
                  }}
                />
                <span>Outside the empire</span>
                <span
                  style={{
                    height: "14px",
                    border: `1px dotted ${ANCIENT_LAYER_STYLE.border.outsideColor}`,
                    background:
                      `repeating-linear-gradient(135deg, transparent 0, transparent 5px, ${ANCIENT_LAYER_STYLE.uncertain.hatchColor} 5px, ${ANCIENT_LAYER_STYLE.uncertain.hatchColor} 6px)`
                  }}
                />
                <span>Status unclear in the sources</span>
                <span style={{ height: "0", borderTop: `2px solid ${ANCIENT_LAYER_STYLE.border.romanSideColor}` }} />
                <span>Roman Empire edge</span>
                <span style={{ height: "0", borderTop: `1px solid ${ANCIENT_LAYER_STYLE.roads.color}` }} />
                <span>Known roads</span>
                <span style={{ height: "0", borderTop: `1px dashed ${ANCIENT_LAYER_STYLE.roads.color}` }} />
                <span>Conjectured roads</span>
                <span style={{ height: "0", borderTop: `2px dotted ${ANCIENT_LAYER_STYLE.coastline.color}` }} />
                <span>Ancient coastline</span>
              </div>
              <p style={{ margin: `${tokens.spacing.xs}px 0 0` }}>
                Borders are approximate. Provinces far from the New Testament&apos;s places are shown together, and lands whose borders aren&apos;t known, such as Abilene or Polemon&apos;s kingdom of Pontus, aren&apos;t drawn. Sources are under Sources &amp; credits.
              </p>
            </div>
          ) : null}
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
            onSelectPlace={handleSelectFromMap}
            pinLabelSource={PIN_LABEL_SOURCE}
            places={places}
            selectedTimelineStopId={selectedTimelineStopId}
            selection={selection}
            timelineOverlayInset={timelineOverlayInsetForAttribution}
          />
        </Suspense>
      )}

      {timelineVisible ? (
        <div
          data-timeline-card="true"
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
              <div aria-live="polite" style={{ color: tokens.color.textPrimary, fontSize: `${tokens.typography.captionSize}px`, lineHeight: `${tokens.typography.captionLineHeight}px` }}>
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
              {timelineSourcesOpen ? (
                <div
                  data-timeline-sources-popover="true"
                  style={{
                    marginTop: `${tokens.spacing.xs}px`,
                    padding: `${tokens.spacing.sm}px`,
                    borderRadius: "8px",
                    backgroundColor: tokens.color.subtleSurface,
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  <p style={{ margin: 0 }}>{selectedTimelineStop.summary}</p>
                  {selectedTimelineStop.scripture.length > 0 ? (
                    <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
                      <strong>Passages:</strong>
                      <ul style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
                        {selectedTimelineStop.scripture.map((reference) => (
                          <li key={reference}>{reference}</li>
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

      {selectedPlace && panelStyle ? (
        <section aria-label="Place details" style={panelStyle}>
          <PlacePanel
            key={selectedPlace.id}
            isLoading={selectedPlaceLoading}
            isSmallScreen={isSmallScreen}
            isSmallScreenExpanded={smallScreenSheetMode === "expanded"}
            loadErrorMessage={selectedPlaceLoadError}
            onClose={() => closePanel(false)}
            onHighlightPlace={handlePanelHighlightPlace}
            onSmallScreenHandlePointerDown={(event) => {
              if (!isSmallScreen) {
                return;
              }

              const currentHeightPx =
                smallScreenSheetDragHeightPx ??
                (smallScreenSheetMode === "expanded"
                  ? smallScreenSheetMaxHeightPx
                  : smallScreenSheetCollapsedHeightPx);

              smallScreenSheetDragStateRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startHeightPx: currentHeightPx,
                movedPx: 0
              };
              suppressNextHandleClickRef.current = false;
              setSmallScreenSheetDragHeightPx(currentHeightPx);
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
              setSmallScreenSheetMode((current) =>
                current === "expanded" ? "collapsed" : "expanded"
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
