import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { getPrimaryPlaceName } from "../features/map/place-visibility";
import { applySelectionToSearch, parseSelectionFromSearch } from "../features/map/selection-url";
import type { PlaceIndexRecord, PlaceSelection } from "../features/map/types";
import { tokens } from "../theme/tokens";

const SEARCH_DESKTOP_WIDTH = 400;
const PANEL_WIDTH = 408;
const SEARCH_TOP_OFFSET = tokens.spacing.md;
const SEARCH_HEIGHT = 48;
const PANEL_CONTENT_TOP_PADDING = SEARCH_TOP_OFFSET + SEARCH_HEIGHT + tokens.spacing.md;
const MAP_PLACEHOLDER_COLOR = "#F1EEE4";

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

function markerSelectorById(markerId: string) {
  const escaped = markerId.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"');
  return `button[data-marker-id="${escaped}"]`;
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastSelectionActivatorMarkerIdRef = useRef<string | null>(null);

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selectedPlace = selection ? placesById.get(selection.placeId) ?? null : null;

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
          lastSelectionActivatorMarkerIdRef.current = null;
          setStatusMessage("Place not found");
          writeSelectionToUrl(null);
        } else if (normalized) {
          lastSelectionActivatorMarkerIdRef.current = null;
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
        lastSelectionActivatorMarkerIdRef.current = null;
        setSelection(null);
        setStatusMessage(null);
        return;
      }

      if (!normalized) {
        lastSelectionActivatorMarkerIdRef.current = null;
        setSelection(null);
        setStatusMessage("Place not found");
        return;
      }

      lastSelectionActivatorMarkerIdRef.current = null;
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

    if (!restoreFocus) {
      return;
    }

    window.requestAnimationFrame(() => {
      const markerId = lastSelectionActivatorMarkerIdRef.current;
      if (markerId) {
        const markerButton = document.querySelector<HTMLButtonElement>(
          markerSelectorById(markerId)
        );
        if (markerButton) {
          markerButton.focus();
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

  const selectedCandidateLabel =
    selectedPlace &&
    selection?.candidateIndex !== null &&
    selection?.candidateIndex !== undefined &&
    selection.candidateIndex >= 0 &&
    selection.candidateIndex < selectedPlace.candidates.length
      ? selectedPlace.candidates[selection.candidateIndex].label
      : null;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: tokens.color.surface,
        fontFamily: tokens.typography.uiFont
      }}
    >
      <div
        style={{
          position: "absolute",
          top: `${SEARCH_TOP_OFFSET}px`,
          left: `${tokens.spacing.md}px`,
          width: `${SEARCH_DESKTOP_WIDTH}px`,
          height: `${SEARCH_HEIGHT}px`,
          borderRadius: "999px",
          border: `1px solid ${tokens.color.divider}`,
          backgroundColor: tokens.color.surface,
          display: "flex",
          alignItems: "center",
          gap: `${tokens.spacing.sm}px`,
          paddingInline: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
          boxShadow: "0 1px 2px rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)",
          zIndex: 30
        }}
      >
        <button
          aria-label="Open app menu"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "20px",
            border: `1px solid ${tokens.color.divider}`,
            backgroundColor: tokens.color.surface,
            color: tokens.color.textPrimary,
            cursor: "pointer"
          }}
          type="button"
        >
          ☰
        </button>
        <input
          aria-label="Search biblical places"
          placeholder="Search biblical places"
          readOnly
          ref={searchInputRef}
          style={{
            border: "none",
            flex: 1,
            color: tokens.color.textSecondary,
            backgroundColor: "transparent",
            fontFamily: tokens.typography.uiFont,
            fontSize: `${tokens.typography.bodySize}px`
          }}
        />
      </div>

      {loading ? (
        <MapLoadingPlaceholder />
      ) : (
        <Suspense fallback={<MapLoadingPlaceholder />}>
          <LazyMapView
            leftPanelWidth={selectedPlace ? PANEL_WIDTH : 0}
            onSelectPlace={(nextSelection) => {
              setStatusMessage(null);

              const activeElement = document.activeElement;
              lastSelectionActivatorMarkerIdRef.current =
                activeElement instanceof HTMLElement
                  ? activeElement.getAttribute("data-marker-id")
                  : null;

              setSelection(nextSelection);
            }}
            places={places}
            selection={selection}
          />
        </Suspense>
      )}

      {selectedPlace ? (
        <section
          aria-label="Place details"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${PANEL_WIDTH}px`,
            boxSizing: "border-box",
            backgroundColor: tokens.color.surface,
            borderRight: `1px solid ${tokens.color.divider}`,
            padding: `${PANEL_CONTENT_TOP_PADDING}px ${tokens.spacing.lg}px ${tokens.spacing.lg}px`,
            boxShadow: "0 1px 2px rgba(60,64,67,.2), 0 2px 6px rgba(60,64,67,.2)",
            zIndex: 20
          }}
        >
          <button
            aria-label="Close place panel"
            onClick={() => closePanel(false)}
            style={{
              position: "absolute",
              top: `${PANEL_CONTENT_TOP_PADDING}px`,
              right: `${tokens.spacing.md}px`,
              width: "32px",
              height: "32px",
              borderRadius: "16px",
              border: `1px solid ${tokens.color.divider}`,
              backgroundColor: tokens.color.surface,
              cursor: "pointer"
            }}
            type="button"
          >
            ×
          </button>
          <h1
            style={{
              margin: 0,
              paddingRight: "48px",
              color: tokens.color.textPrimary,
              fontSize: `${tokens.typography.titleSize}px`,
              lineHeight: `${tokens.typography.titleLineHeight}px`,
              fontWeight: 600
            }}
          >
            {getPrimaryPlaceName(selectedPlace)}
          </h1>
          <p
            style={{
              marginTop: `${tokens.spacing.md}px`,
              marginBottom: 0,
              color: tokens.color.textSecondary,
              fontSize: `${tokens.typography.bodySize}px`,
              lineHeight: `${tokens.typography.bodyLineHeight}px`
            }}
          >
            Place panel content is in progress (M3-04).
          </p>
          {selectedCandidateLabel ? (
            <p
              style={{
                marginTop: `${tokens.spacing.sm}px`,
                marginBottom: 0,
                color: tokens.color.textSecondary,
                fontSize: `${tokens.typography.bodySize}px`,
                lineHeight: `${tokens.typography.bodyLineHeight}px`
              }}
            >
              Candidate: {selectedCandidateLabel}
            </p>
          ) : null}
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
