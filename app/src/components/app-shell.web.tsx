import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";

import { SearchMenu } from "./search-menu";
import { PlacePanel } from "../features/place-panel/place-panel.web";
import { sortPlacesByImportance } from "../features/map/place-importance";
import { applySelectionToSearch, parseSelectionFromSearch } from "../features/map/selection-url";
import type {
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

function visiblePlaceEntrySelectorById(entryId: string) {
  const escaped = entryId.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"');
  return `button[data-place-entry-id="${escaped}"]`;
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
  const [loading, setLoading] = useState(true);
  const [urlStateReady, setUrlStateReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < SMALL_SCREEN_BREAKPOINT : false
  );
  const [smallScreenSheetMode, setSmallScreenSheetMode] = useState<"collapsed" | "expanded">(
    "collapsed"
  );
  const [smallScreenSheetDragHeightPx, setSmallScreenSheetDragHeightPx] = useState<number | null>(
    null
  );
  const [placeDetailsById, setPlaceDetailsById] = useState<Record<string, PlaceDetailsPayload>>(
    {}
  );
  const [placeDetailsErrorsById, setPlaceDetailsErrorsById] = useState<Record<string, string>>(
    {}
  );
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

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selectedPlace = selection ? placesById.get(selection.placeId) ?? null : null;
  const smallScreenSheetMaxHeightPx = Math.max(
    0,
    (typeof window !== "undefined" ? window.innerHeight : 0) -
      SMALL_SCREEN_SHEET_EDGE_GAP_PX -
      SMALL_SCREEN_SHEET_TOP_CLEARANCE_PX
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
      if (movedLessThanTapThreshold) {
        setSmallScreenSheetDragHeightPx(null);
        return;
      }

      const midPointPx =
        smallScreenSheetCollapsedHeightPx +
        (smallScreenSheetMaxHeightPx - smallScreenSheetCollapsedHeightPx) / 2;
      const finalHeightPx = Math.min(
        smallScreenSheetMaxHeightPx,
        Math.max(smallScreenSheetCollapsedHeightPx, smallScreenSheetDragHeightPx ?? dragState.startHeightPx)
      );
      const dragRangePx = smallScreenSheetMaxHeightPx - smallScreenSheetCollapsedHeightPx;
      const dragThresholdPx = Math.min(120, Math.max(48, dragRangePx * 0.33));
      const startedExpanded = dragState.startHeightPx >= midPointPx;
      const nextMode = startedExpanded
        ? finalHeightPx <= smallScreenSheetMaxHeightPx - dragThresholdPx
          ? "collapsed"
          : "expanded"
        : finalHeightPx >= smallScreenSheetCollapsedHeightPx + dragThresholdPx
          ? "expanded"
          : "collapsed";
      setSmallScreenSheetMode(nextMode);
      setSmallScreenSheetDragHeightPx(null);
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
    if (loading || !urlStateReady) {
      return undefined;
    }

    const onPopState = () => {
      const parsedSelection = parseSelectionFromSearch(window.location.search);
      const normalized = normalizeSelection(parsedSelection, placesById);

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
  }, [loading, placesById, urlStateReady]);

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

  const panelHeightPx =
    smallScreenSheetDragHeightPx ??
    (smallScreenSheetMode === "expanded"
      ? smallScreenSheetMaxHeightPx
      : smallScreenSheetCollapsedHeightPx);
  const panelBottomInsetForMap = selectedPlace && isSmallScreen ? panelHeightPx + SMALL_SCREEN_SHEET_EDGE_GAP_PX : 0;

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

      {loading ? (
        <MapLoadingPlaceholder />
      ) : (
        <Suspense fallback={<MapLoadingPlaceholder />}>
          <LazyMapView
            bottomPanelInset={panelBottomInsetForMap}
            highlightedPlaceId={highlightedPlaceId}
            isSmallScreen={isSmallScreen}
            leftPanelWidth={panelWidthForMap}
            onSelectPlace={handleSelectFromMap}
            places={places}
            selection={selection}
          />
        </Suspense>
      )}

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
              setSmallScreenSheetDragHeightPx(currentHeightPx);
            }}
            onSelectCandidate={handlePanelSelectCandidate}
            onSelectPlace={handlePanelSelectPlace}
            onSelectPlaceFromAbout={handlePanelSelectPlaceFromAbout}
            onToggleSmallScreenExpanded={() => {
              setSmallScreenSheetDragHeightPx(null);
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
