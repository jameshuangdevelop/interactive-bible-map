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

function writeSelectionToUrl(selection: PlaceSelection | null) {
  const nextSearch = applySelectionToSearch(window.location.search, selection);
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
  return payload;
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
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth < SMALL_SCREEN_BREAKPOINT : false
  );
  const [isSmallScreenPanelExpanded, setIsSmallScreenPanelExpanded] = useState(false);
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

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selectedPlace = selection ? placesById.get(selection.placeId) ?? null : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const onResize = () => {
      setIsSmallScreen(window.innerWidth < SMALL_SCREEN_BREAKPOINT);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
          setStatusMessage("Place not found");
          writeSelectionToUrl(null);
        } else if (normalized) {
          lastSelectionActivatorEntryIdRef.current = null;
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
        setSelection(null);
        setStatusMessage(null);
        return;
      }

      if (!normalized) {
        lastSelectionActivatorEntryIdRef.current = null;
        setSelection(null);
        setStatusMessage("Place not found");
        return;
      }

      lastSelectionActivatorEntryIdRef.current = null;
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
    setIsSmallScreenPanelExpanded(false);

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
    setIsSmallScreenPanelExpanded(false);

    const activeElement = document.activeElement;
    lastSelectionActivatorEntryIdRef.current =
      activeElement instanceof HTMLElement
        ? activeElement.getAttribute("data-place-entry-id")
        : null;

    setSelection(nextSelection);
  }, []);

  const handlePanelSelectPlace = useCallback((nextSelection: PlaceSelection) => {
    setStatusMessage(null);
    setIsSmallScreenPanelExpanded(false);
    setSelection(nextSelection);
  }, []);

  const handlePanelSelectCandidate = useCallback(
    (candidateIndex: number) => {
      if (!selection) {
        return;
      }

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
    setIsSmallScreenPanelExpanded(false);
    lastSelectionActivatorEntryIdRef.current = null;
    setSelection(nextSelection);
  }, []);

  const panelStyle: CSSProperties | null = selectedPlace
    ? isSmallScreen
      ? {
          position: "absolute",
          left: `${tokens.spacing.md}px`,
          right: `${tokens.spacing.md}px`,
          bottom: `${tokens.spacing.md}px`,
          height: isSmallScreenPanelExpanded ? "calc(100% - 32px)" : "40%",
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
            isSmallScreenExpanded={isSmallScreenPanelExpanded}
            loadErrorMessage={selectedPlaceLoadError}
            onClose={() => closePanel(false)}
            onSelectCandidate={handlePanelSelectCandidate}
            onSelectPlace={handlePanelSelectPlace}
            onToggleSmallScreenExpanded={() =>
              setIsSmallScreenPanelExpanded((current) => !current)
            }
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
