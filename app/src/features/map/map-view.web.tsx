import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject
} from "react";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMapClass,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type ErrorEvent,
  type LngLatLike,
  type Map as MapLibreMap
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FALLBACK_BASEMAP_STYLE_URL,
  MAP_WORKER_URL,
  MAIN_BASEMAP_STYLE_URL,
  PIN_COLORS
} from "./constants";
import {
  BasemapFallbackController,
  resolveInitialBasemapMode,
  type BasemapMode
} from "./basemap-fallback";
import { clusterVisibleEntries, type RenderableMapEntry } from "./cluster-markers";
import {
  buildVisiblePlaceEntries,
  type VisiblePlaceEntry
} from "./place-visibility";
import { getScaleControlLeftOffset } from "./map-layout";
import {
  resolveVisibleInlineLabelIds,
  type LabelCollisionMarker
} from "./label-collision";
import { planSelectionFocus } from "./selection-focus";
import { shouldCountTileErrorForFallback } from "./tile-error-filter";
import { MapMarkerLayer, type ScreenMarker } from "./map-marker-layer.web";
import type { MapViewProps } from "./map-view.types";
import type { PlaceIndexRecord, PlaceSelection, PlaceType } from "./types";

setWorkerUrl(MAP_WORKER_URL);
const configuredBasemapMode = resolveInitialBasemapMode(process.env.EXPO_PUBLIC_BASEMAP);

function getStyleUrl(mode: BasemapMode) {
  if (mode === "fallback") {
    return FALLBACK_BASEMAP_STYLE_URL;
  }

  return MAIN_BASEMAP_STYLE_URL;
}

function mapEntryToSelection(entry: VisiblePlaceEntry): PlaceSelection {
  if (entry.kind === "candidate-pin") {
    return { placeId: entry.placeId, candidateIndex: entry.candidateIndex };
  }

  return { placeId: entry.placeId, candidateIndex: null };
}

function placeByIdMap(places: PlaceIndexRecord[]) {
  return new Map(places.map((place) => [place.id, place]));
}

function placeOrderMap(places: PlaceIndexRecord[]) {
  return new Map(places.map((place, index) => [place.id, index]));
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function flyOrJump(
  map: MapLibreMap,
  cameraOptions: Parameters<MapLibreMap["easeTo"]>[0],
  reducedMotion = prefersReducedMotion()
) {
  if (reducedMotion) {
    map.jumpTo({
      center: cameraOptions.center,
      zoom: cameraOptions.zoom
    });
    return;
  }

  map.easeTo({
    ...cameraOptions,
    duration: 900
  });
}

function fitBoundsForPlace(
  map: MapLibreMap,
  coordinates: [number, number][],
  maxZoom: number,
  leftInset: number,
  reducedMotion = prefersReducedMotion()
) {
  const [first, ...rest] = coordinates;
  if (!first) {
    return;
  }

  const bounds = new LngLatBounds(first, first);
  for (const coordinate of rest) {
    bounds.extend(coordinate);
  }

  map.fitBounds(bounds, {
    padding: {
      top: 64,
      right: 64,
      bottom: 64,
      left: leftInset + 64
    },
    maxZoom,
    duration: reducedMotion ? 0 : 900
  });
}

function focusSelection(
  map: MapLibreMap,
  place: PlaceIndexRecord,
  selection: PlaceSelection,
  leftInset: number
) {
  const focusPlan = planSelectionFocus(place, selection);
  if (!focusPlan) {
    return;
  }

  if (focusPlan.kind === "fit-bounds") {
    fitBoundsForPlace(map, focusPlan.coordinates, focusPlan.zoom, leftInset);
    return;
  }

  flyOrJump(
    map,
    {
      center: focusPlan.coordinates,
      zoom: focusPlan.zoom,
      padding: {
        top: 64,
        right: 64,
        bottom: 64,
        left: leftInset + 64
      }
    },
    prefersReducedMotion()
  );
}

function collapseCompactAttribution(container: HTMLElement | null) {
  if (!container) {
    return;
  }

  container.classList.remove("maplibregl-compact-show");
}

function expandCompactAttributionOnFirstPaint(
  map: MapLibreMap,
  mapContainerRef: MutableRefObject<HTMLDivElement | null>
) {
  const attributionElement = mapContainerRef.current?.querySelector<HTMLDivElement>(
    ".maplibregl-ctrl-attrib.maplibregl-compact"
  );

  if (!attributionElement) {
    return () => undefined;
  }

  attributionElement.classList.add("maplibregl-compact-show");

  const collapse = () => collapseCompactAttribution(attributionElement);
  const timeout = window.setTimeout(collapse, 5_000);

  const collapseOnInteraction = () => {
    collapse();
    map.off("mousedown", collapseOnInteraction);
    map.off("touchstart", collapseOnInteraction);
    map.off("wheel", collapseOnInteraction);
    map.off("zoomstart", collapseOnInteraction);
    map.off("dragstart", collapseOnInteraction);
  };

  map.on("mousedown", collapseOnInteraction);
  map.on("touchstart", collapseOnInteraction);
  map.on("wheel", collapseOnInteraction);
  map.on("zoomstart", collapseOnInteraction);
  map.on("dragstart", collapseOnInteraction);

  return () => {
    window.clearTimeout(timeout);
    map.off("mousedown", collapseOnInteraction);
    map.off("touchstart", collapseOnInteraction);
    map.off("wheel", collapseOnInteraction);
    map.off("zoomstart", collapseOnInteraction);
    map.off("dragstart", collapseOnInteraction);
  };
}

function getEntryTitle(entry: RenderableMapEntry) {
  if (entry.kind === "cluster") {
    return `${entry.count} places`;
  }

  return entry.placeName;
}

function entryColor(entry: RenderableMapEntry, placeById: Map<string, PlaceIndexRecord>) {
  if (entry.kind === "cluster") {
    return "#C5221F";
  }

  if (entry.kind === "region-label") {
    return "#5F6368";
  }

  const place = placeById.get(entry.placeId);
  if (!place) {
    return "#C5221F";
  }

  return PIN_COLORS[place.type];
}

function placeTypeLabel(placeType: PlaceType) {
  return placeType.replace("-", " ");
}

function shouldShowInlinePinLabel(placeType: PlaceType) {
  return placeType === "city" || placeType === "town" || placeType === "village";
}

interface ScreenMarkerRecord {
  entry: RenderableMapEntry;
  marker: ScreenMarker;
}

function screenMarkerData(
  entries: RenderableMapEntry[],
  map: MapLibreMap | null,
  placeById: Map<string, PlaceIndexRecord>
): ScreenMarkerRecord[] {
  if (!map) {
    return [];
  }

  return entries.map((entry) => {
    const projected = map.project(entry.coordinates as LngLatLike);
    const place = entry.kind === "cluster" ? null : placeById.get(entry.placeId) ?? null;
    const typeLabel = place ? placeTypeLabel(place.type) : "place";

    let markerTitle = getEntryTitle(entry);
    if (entry.kind !== "cluster") {
      markerTitle = `${entry.placeName}, ${typeLabel}`;
    }

    if (entry.kind === "candidate-pin") {
      markerTitle = `${entry.placeName}, ${typeLabel}, candidate ${entry.candidateLetter}: ${entry.candidateLabel}`;
    }

    const marker: ScreenMarker = {
      id: entry.id,
      kind: entry.kind,
      x: projected.x,
      y: projected.y,
      selected: entry.kind === "cluster" ? false : entry.selected,
      accessibleName:
        entry.kind === "cluster" ? `Cluster of ${entry.count} places` : entry.accessibleName,
      title: markerTitle,
      color: entryColor(entry, placeById),
      inlineLabel:
        entry.kind === "region-label"
          ? entry.placeName
          : place && entry.kind === "pin" && shouldShowInlinePinLabel(place.type)
            ? entry.placeName
            : undefined,
      showQuestionBadge: entry.kind === "pin" ? entry.showQuestionBadge : false,
      candidateLetter: entry.kind === "candidate-pin" ? entry.candidateLetter : undefined,
      clusterCount: entry.kind === "cluster" ? entry.count : undefined
    };

    return { entry, marker };
  });
}

export function MapView({
  places,
  selection,
  leftPanelWidth,
  onSelectPlace
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const requestFrameRef = useRef<number | null>(null);
  const labelLayoutFrameRef = useRef<number | null>(null);
  const expandedAttributionCleanupRef = useRef<(() => void) | null>(null);
  const previousSelectionRef = useRef<string>("");
  const screenMarkerRecordsRef = useRef<ScreenMarkerRecord[]>([]);

  const [basemapController] = useState(
    () =>
      new BasemapFallbackController({
      initialMode: configuredBasemapMode
      })
  );
  const [basemapState, setBasemapState] = useState<{
    mode: BasemapMode;
    message: string | null;
  }>({
    mode: configuredBasemapMode,
    message: null
  });
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_MAP_ZOOM);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const [visibleInlineLabelIds, setVisibleInlineLabelIds] = useState<Set<string>>(
    () => new Set<string>()
  );

  const placeById = useMemo(() => placeByIdMap(places), [places]);
  const placeOrderById = useMemo(() => placeOrderMap(places), [places]);
  const panelInset = Math.max(0, leftPanelWidth);

  const recalculateInlineLabelVisibility = useCallback(() => {
    const labelCollisionMarkers: LabelCollisionMarker[] = screenMarkerRecordsRef.current.map(
      (markerRecord) => {
        const place =
          markerRecord.entry.kind === "cluster"
            ? null
            : placeById.get(markerRecord.entry.placeId) ?? null;
        const dataOrder =
          markerRecord.entry.kind === "cluster"
            ? Number.MAX_SAFE_INTEGER
            : placeOrderById.get(markerRecord.entry.placeId) ?? Number.MAX_SAFE_INTEGER;

        return {
          id: markerRecord.marker.id,
          kind: markerRecord.marker.kind,
          x: markerRecord.marker.x,
          y: markerRecord.marker.y,
          selected: markerRecord.marker.selected,
          inlineLabel: markerRecord.marker.inlineLabel,
          placeType: place?.type,
          dataOrder
        };
      }
    );

    setVisibleInlineLabelIds(resolveVisibleInlineLabelIds(labelCollisionMarkers));
  }, [placeById, placeOrderById]);

  const scheduleInlineLabelLayout = useCallback(() => {
    if (labelLayoutFrameRef.current !== null) {
      return;
    }

    labelLayoutFrameRef.current = window.requestAnimationFrame(() => {
      labelLayoutFrameRef.current = null;
      recalculateInlineLabelVisibility();
    });
  }, [recalculateInlineLabelVisibility]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return undefined;
    }

    const map = new MapLibreMapClass({
      container: mapContainerRef.current,
      style: getStyleUrl(configuredBasemapMode),
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      attributionControl: false
    });
    mapRef.current = map;
    setMapInstance(map);

    map.addControl(
      new NavigationControl({
        showCompass: false
      }),
      "bottom-right"
    );
    map.addControl(new ScaleControl({ unit: "metric", maxWidth: 140 }), "bottom-left");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");

    const scheduleRender = () => {
      if (requestFrameRef.current !== null) {
        return;
      }

      requestFrameRef.current = window.requestAnimationFrame(() => {
        requestFrameRef.current = null;
        if (!mapRef.current) {
          return;
        }

        setZoom(mapRef.current.getZoom());
        setRenderTick((current) => current + 1);
      });
    };

    const handleLoad = () => {
      map.getCanvas().tabIndex = -1;
      setMapLoaded(true);
      scheduleRender();
      scheduleInlineLabelLayout();
      expandedAttributionCleanupRef.current = expandCompactAttributionOnFirstPaint(
        map,
        mapContainerRef
      );
    };

    const handleError = (event: ErrorEvent) => {
      if (
        !shouldCountTileErrorForFallback(
          event as ErrorEvent & { sourceId?: string | null },
          basemapController.getState().mode
        )
      ) {
        return;
      }

      const nextState = basemapController.registerTileError(Date.now());
      setBasemapState(nextState);

      if (nextState.mode === "fallback") {
        map.setStyle(getStyleUrl(nextState.mode));
      }
    };

    map.on("load", handleLoad);
    map.on("move", scheduleRender);
    map.on("zoom", scheduleRender);
    map.on("resize", scheduleRender);
    map.on("moveend", scheduleInlineLabelLayout);
    map.on("zoomend", scheduleInlineLabelLayout);
    map.on("resize", scheduleInlineLabelLayout);
    map.on("error", handleError);

    return () => {
      if (requestFrameRef.current !== null) {
        window.cancelAnimationFrame(requestFrameRef.current);
      }
      if (labelLayoutFrameRef.current !== null) {
        window.cancelAnimationFrame(labelLayoutFrameRef.current);
      }

      expandedAttributionCleanupRef.current?.();
      map.off("moveend", scheduleInlineLabelLayout);
      map.off("zoomend", scheduleInlineLabelLayout);
      map.off("resize", scheduleInlineLabelLayout);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setMapLoaded(false);
    };
  }, [basemapController, scheduleInlineLabelLayout]);

  useEffect(() => {
    const map = mapRef.current;
    if (!selection) {
      previousSelectionRef.current = "";
      return;
    }

    if (!mapLoaded || !map) {
      return;
    }

    const selectionKey = `${selection.placeId}:${selection.candidateIndex ?? ""}`;
    if (selectionKey === previousSelectionRef.current) {
      return;
    }

    previousSelectionRef.current = selectionKey;
    const place = placeById.get(selection.placeId);
    if (!place) {
      return;
    }

    focusSelection(map, place, selection, panelInset);
  }, [mapLoaded, panelInset, placeById, selection]);

  const visibleEntries = useMemo(
    () => buildVisiblePlaceEntries(places, zoom, selection),
    [places, selection, zoom]
  );
  const clusteredEntries = useMemo(
    () => clusterVisibleEntries(visibleEntries, zoom),
    [visibleEntries, zoom]
  );

  const resolvedScreenMarkers = useMemo(() => {
    void renderTick;
    return screenMarkerData(clusteredEntries, mapInstance, placeById);
  }, [clusteredEntries, mapInstance, placeById, renderTick]);

  useEffect(() => {
    screenMarkerRecordsRef.current = resolvedScreenMarkers;
  }, [resolvedScreenMarkers]);

  const markerIdentityKey = useMemo(
    () =>
      resolvedScreenMarkers
        .map((markerRecord) => {
          const marker = markerRecord.marker;
          return `${marker.id}:${marker.kind}:${marker.selected ? "1" : "0"}:${marker.inlineLabel ?? ""}`;
        })
        .join("|"),
    [resolvedScreenMarkers]
  );

  useEffect(() => {
    if (!mapLoaded) {
      return;
    }

    scheduleInlineLabelLayout();
  }, [mapLoaded, markerIdentityKey, scheduleInlineLabelLayout]);

  const entryByMarkerId = useMemo(
    () =>
      new Map(resolvedScreenMarkers.map((markerRecord) => [markerRecord.marker.id, markerRecord.entry])),
    [resolvedScreenMarkers]
  );

  const onMarkerActivate = useCallback(
    (marker: ScreenMarker) => {
      const map = mapRef.current;
      const entry = entryByMarkerId.get(marker.id);
      if (!map || !entry) {
        return;
      }

      if (entry.kind === "cluster") {
        flyOrJump(map, {
          center: entry.coordinates,
          zoom: Math.max(7, entry.expansionZoom),
          padding: {
            top: 64,
            right: 64,
            bottom: 64,
            left: panelInset + 64
          }
        });
        return;
      }

      onSelectPlace(mapEntryToSelection(entry));
    },
    [entryByMarkerId, onSelectPlace, panelInset]
  );

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    flyOrJump(map, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      padding: {
        top: 64,
        right: 64,
        bottom: 64,
        left: panelInset + 64
      }
    });
  }, [panelInset]);

  return (
    <div
      aria-label="Map"
      className="ibm-map-root"
      style={{
        position: "absolute",
        inset: 0
      }}
    >
      <style>{`
        .ibm-map-root .maplibregl-ctrl-bottom-left {
          left: ${getScaleControlLeftOffset(panelInset)}px;
          bottom: 16px;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0
        }}
      />
      <button
        aria-label="Reset view"
        data-map-control="reset-view"
        onClick={resetView}
        style={{
          position: "absolute",
          right: "16px",
          bottom: "150px",
          width: "44px",
          height: "44px",
          borderRadius: "999px",
          border: "1px solid #DADCE0",
          backgroundColor: "#FFFFFF",
          color: "#202124",
          fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: "22px",
          lineHeight: 1,
          boxShadow: "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px rgba(60,64,67,0.2)",
          cursor: "pointer"
        }}
        title="Reset view"
        type="button"
      >
        ⟳
      </button>
      <MapMarkerLayer
        markers={resolvedScreenMarkers.map((markerRecord) => ({
          ...markerRecord.marker,
          showInlineLabel: markerRecord.marker.inlineLabel
            ? visibleInlineLabelIds.has(markerRecord.marker.id)
            : false
        }))}
        onMarkerActivate={onMarkerActivate}
      />
      {basemapState.message ? (
        <div
          role="status"
          style={{
            position: "absolute",
            top: "72px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#FFFFFF",
            border: "1px solid #DADCE0",
            borderRadius: "8px",
            padding: "8px 12px",
            fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: "13px",
            color: "#202124",
            boxShadow: "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px rgba(60,64,67,0.15)"
          }}
        >
          {basemapState.message}
        </div>
      ) : null}
    </div>
  );
}
