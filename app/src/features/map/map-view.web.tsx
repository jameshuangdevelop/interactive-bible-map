import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMapClass,
  setWorkerUrl,
  type ErrorEvent,
  type ExpressionSpecification,
  type FilterSpecification,
  type GeoJSONSource,
  type LngLatLike,
  type Map as MapLibreMap,
  type MapGeoJSONFeature,
  type PointLike
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  ANCIENT_FALLBACK_BASEMAP_STYLE_URL,
  ANCIENT_MAIN_BASEMAP_STYLE_URL,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_WORKER_URL,
  MODERN_FALLBACK_BASEMAP_STYLE_URL,
  MODERN_MAIN_BASEMAP_STYLE_URL,
  MAX_MAP_ZOOM,
} from "./constants";
import {
  openingAreaBounds,
  openingAreaFitOptions,
  openingCameraMode,
  resolveMapFitPadding
} from "./map-camera";
import {
  BasemapFallbackController,
  MainSourceLoadTimeoutController,
  resolveInitialBasemapMode,
  type BasemapMode
} from "./basemap-fallback";
import { getScaleControlLeftOffset } from "./map-layout";
import {
  MAJOR_NAME_FONT_SIZE_PX,
  MAJOR_NAME_MAX_WIDTH_EM,
  MAJOR_SELECTED_NAME_FONT_SIZE_PX,
  MAJOR_SELECTED_NAME_RAISE_EM
} from "./major-name-groups";
import { roundScaleDistanceMeters } from "./map-scale";
import {
  MAX_VISIBLE_PLACE_LIST_ENTRIES,
  buildPlaceRenderData,
  routePriorityPlaceIdsKeyFromOverlay,
  type PlaceRenderData
} from "./map-render-data";
import {
  resolveEffectiveMapVariantOptions,
  resolveMapRuntimeTuning
} from "./map-runtime-options";
import { computeCompactAttributionBottomOffsetLimit } from "./overlay-layout";
import { planSelectionFocus } from "./selection-focus";
import {
  PRIMARY_VECTOR_SOURCE_ID,
  shouldCountTileErrorForFallback
} from "./tile-error-filter";
import { getAttributionMarkup } from "./attribution";
import {
  pickNearestCandidateWithPreferredRank,
  type ScreenPoint as HitScreenPoint
} from "./interactive-hit";
import { interactiveHitPaddingForEvent } from "./interactive-hit-padding";
import { isAreaLabelType } from "./place-visibility";
import { formatHolderYearRange } from "./holder-year-range";
import { ANCIENT_LAYER_STYLE } from "./ancient-layer-style";
import {
  filterAreaLabelsForAncientMap,
  linkedTimelineLocationIds
} from "./ancient-area-label-visibility";
import {
  buildSelectedRegionOutlineFeatureCollection,
  buildSelectedRegionVeilFeatureCollection,
  findSelectedRegionGeometry
} from "./selected-region-highlight";
import type { MapViewProps } from "./map-view.types";
import type {
  AncientHolderUnionsPayload,
  AncientEntityRecord,
  AncientShapesPayload,
  AncientStopPayload,
  FeatureCollection,
  LineStringGeometry,
  MultiLineStringGeometry
} from "./ancient-layer.types";
import type {
  Coordinates,
  MapDisplayMode,
  PlaceIndexRecord,
  PlaceSelection
} from "./types";

setWorkerUrl(MAP_WORKER_URL);
const configuredBasemapMode = resolveInitialBasemapMode(process.env.EXPO_PUBLIC_BASEMAP);

const sourceMajorCityPinsId = "ibm-major-city-pins";
const sourceClusteredCityPinsId = "ibm-clustered-city-pins";
const sourceSitePinsId = "ibm-site-pins";
const sourceCandidatePinsId = "ibm-candidate-pins";
const sourceAreaLabelsId = "ibm-area-labels";
const sourceKeyboardFocusId = "ibm-keyboard-focus";
const sourceAncientAreasId = "ibm-ancient-areas";
const sourceAncientBordersId = "ibm-ancient-borders";
const sourceAncientEmpireEdgeId = "ibm-ancient-empire-edge";
const sourceAncientRoadsId = "ibm-ancient-roads";
const sourceAncientCoastlineId = "ibm-ancient-coastline";
const sourceAncientHolderLabelsId = "ibm-ancient-holder-labels";
const sourceSelectedRegionVeilId = "ibm-selected-region-veil";
const sourceSelectedRegionOutlineId = "ibm-selected-region-outline";
const sourceRoutesLinesId = "ibm-route-lines";
const sourceRoutesPointsId = "ibm-route-points";
const sourceSelectedPlacePinId = "ibm-selected-place-pin";

const layerMajorPinId = "ibm-major-pin";
const layerMajorAreaLabelOverviewId = "ibm-major-area-label-overview";
const layerMajorAreaLabelId = "ibm-major-area-label";
const layerCityPinId = "ibm-city-pin";
const layerCityPinNoDotId = "ibm-city-pin-no-dot";
const layerSitePinId = "ibm-site-pin";
const layerSitePinNoDotId = "ibm-site-pin-no-dot";
const layerMajorPinNoDotId = "ibm-major-pin-no-dot";
const layerCandidatePinId = "ibm-candidate-pin";
const layerPinLabelId = "ibm-pin-label-standard";
const layerSelectedMajorPinLabelId = "ibm-selected-major-pin-label";
const layerSelectedSitePinLabelId = "ibm-selected-site-pin-label";
const layerSelectedPinLabelId = "ibm-selected-pin-label";
const layerSelectedPlacePinId = "ibm-selected-place-pin";
const layerRoutePriorityMajorPinId = "ibm-routes-major-pin";
const layerRoutePriorityCityPinId = "ibm-routes-city-pin";
const layerRoutePrioritySitePinId = "ibm-routes-site-pin";
const layerAreaLabelOverviewId = "ibm-area-label-overview";
const layerAreaLabelId = "ibm-area-label";
const layerSelectedAreaLabelId = "ibm-selected-area-label";
const layerKeyboardFocusId = "ibm-keyboard-focus";
const layerAncientAreaFillId = "ibm-ancient-area-fill";
const layerAncientUncertainFillId = "ibm-ancient-area-uncertain-fill";
const layerAncientBorderStateId = "ibm-ancient-border-state";
const layerAncientBorderDisputedId = "ibm-ancient-border-disputed";
const layerAncientEmpireEdgeId = "ibm-ancient-empire-edge";
const layerAncientRoadMajorCasingId = "ibm-ancient-road-major-casing";
const layerAncientRoadMajorKnownId = "ibm-ancient-road-major-known";
const layerAncientCoastlineId = "ibm-ancient-coastline";
const layerAncientCoastlineLabelId = "ibm-ancient-coastline-label";
const layerAncientHolderLabelId = "ibm-ancient-holder-label";
const layerAncientHolderLabelClickableId = "ibm-ancient-holder-label-clickable";
const layerAncientHolderLabelSelectedId = "ibm-ancient-holder-label-selected";
const layerAncientHolderLabelClickTargetId = "ibm-ancient-holder-label-click-target";
const layerSelectedRegionVeilId = "ibm-selected-region-veil";
const layerSelectedRegionOutlineId = "ibm-selected-region-outline";
const layerRoutesLinesBackgroundId = "ibm-routes-lines-background";
const layerRoutesLinesForegroundId = "ibm-routes-lines-foreground";
const layerRoutesLinesArrowsId = "ibm-routes-lines-arrows";
const layerRoutesLinesHighlightId = "ibm-routes-lines-highlight";
const layerRoutesStopsId = "ibm-routes-stops";
const layerRoutesStopsStartId = "ibm-routes-stops-start";
const layerRoutesViaId = "ibm-routes-via";
const layerRoutesMentionedId = "ibm-routes-mentioned";
const layerRoutesStagePillIconId = "ibm-routes-stage-pill-icon";
const layerRoutesStagePillLabelId = "ibm-routes-stage-pill-label";

const routeStagePillImageId = "ibm-route-stage-pill-image";
const routeDirectionArrowImageId = "ibm-route-direction-arrow-image";
const selectedPlacePinImageId = "ibm-selected-place-pin-icon";
const townDotMajorImageId = "ibm-town-dot-major";
const townDotStandardImageId = "ibm-town-dot-standard";
const mapTestHookKey = "__ibmMapForTests";
const visibleEntryRefreshHookKey = "__ibmRefreshVisibleEntriesForTests";
const mainSourceLoadTimeoutMs = 8_000;
const gestureReleaseDelayMs = 1_000;
const mapLabelPaddingTop = 96;
const mapLabelPaddingEdge = 16;
const focusPaddingTop = 96;
const interactiveHitPaddingPx = 8;
const majorInteractionPreferencePx = 3;
const mainStyleReliefLayerId = "natural_earth";
const mainStyleLandcoverLayerId = "landcover";
const fallbackStyleLandcoverLayerIds = [
  "land-rock",
  "land-forest",
  "land-grass",
  "land-vegetation",
  "land-sand",
  "land-wetland",
  "land-glacier"
] as const;
const softwareRendererPattern = /(swiftshader|software|llvmpipe|softpipe|mesa offscreen)/i;

const interactiveLayerIds = [
  layerMajorPinId,
  layerMajorPinNoDotId,
  layerRoutePriorityMajorPinId,
  layerRoutePriorityCityPinId,
  layerRoutePrioritySitePinId,
  layerCityPinId,
  layerCityPinNoDotId,
  layerSitePinId,
  layerSitePinNoDotId,
  layerCandidatePinId,
  layerSelectedMajorPinLabelId,
  layerSelectedSitePinLabelId,
  layerSelectedPinLabelId,
  layerPinLabelId,
  layerMajorAreaLabelOverviewId,
  layerMajorAreaLabelId,
  layerAreaLabelOverviewId,
  layerAreaLabelId,
  layerSelectedAreaLabelId,
  layerAncientHolderLabelClickableId,
  layerAncientHolderLabelSelectedId,
  layerAncientHolderLabelClickTargetId,
  layerRoutesStopsId,
  layerRoutesViaId,
  layerRoutesMentionedId,
  layerRoutesLinesHighlightId,
  layerRoutesLinesForegroundId
] as const;

const candidateVisibilityFilter = [
  "all",
  ["==", ["get", "isSelectedPlace"], true],
  ["<", ["zoom"], ["get", "maxZoom"]],
  [">=", ["zoom"], ["get", "minZoom"]]
];

const basePlaceLabelVisibilityFilter = [
  "all",
  ["<", ["zoom"], ["get", "maxZoom"]],
  [">=", ["zoom"], ["get", "minZoom"]]
];
const townPlaceTypeFilter = [
  "any",
  ["==", ["get", "placeType"], "city"],
  ["==", ["get", "placeType"], "town"],
  ["==", ["get", "placeType"], "village"]
];
const nonTownPlaceTypeFilter = [
  "all",
  ["!=", ["get", "placeType"], "city"],
  ["!=", ["get", "placeType"], "town"],
  ["!=", ["get", "placeType"], "village"]
];

const areaLabelVisibilityFilter = [
  "all",
  [">=", ["zoom"], ["get", "minZoom"]],
  ["<", ["zoom"], ["get", "maxZoom"]]
];
const areaLabelVariableAnchorMinZoom = 6;
const areaLabelMajorFilter = ["==", ["get", "prominence"], "major"];
const areaLabelNonMajorFilter = ["!=", ["get", "prominence"], "major"];
const areaLabelOverviewFilter = [
  "all",
  areaLabelNonMajorFilter,
  areaLabelVisibilityFilter,
  ["!=", ["get", "isSelectedPlace"], true],
  ["<", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelVariableAnchorFilter = [
  "all",
  areaLabelNonMajorFilter,
  areaLabelVisibilityFilter,
  ["!=", ["get", "isSelectedPlace"], true],
  [">=", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelMajorOverviewFilter = [
  "all",
  areaLabelMajorFilter,
  areaLabelVisibilityFilter,
  ["!=", ["get", "isSelectedPlace"], true],
  ["<", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelMajorVariableAnchorFilter = [
  "all",
  areaLabelMajorFilter,
  areaLabelVisibilityFilter,
  ["!=", ["get", "isSelectedPlace"], true],
  [">=", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const selectedAreaLabelFilter = ["all", areaLabelVisibilityFilter, ["==", ["get", "isSelectedPlace"], true]];
const holderLabelBaseFilter = [
  "all",
  ["==", ["get", "clickable"], true],
  [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 4]]
];
const politicalUnitAreaTypes = new Set(["province", "kingdom", "tetrarchy"]);
const areaLabelTextFontExpression = toExpression([
  "literal",
  ["Noto Sans Bold"]
]);
const areaLabelPointLayout = {
  "text-anchor": "center" as const,
  "text-justify": "center" as const,
  "text-offset": [0, 0] as [number, number]
};
const areaLabelColorExpression = toExpression([
  "case",
  ["==", ["feature-state", "isHovered"], true],
  "#1A73E8",
  "#3C4043"
]);
const placeNameColorExpression = toExpression([
  "case",
  ["==", ["get", "isSelectedPlace"], true],
  "#1A73E8",
  ["==", ["feature-state", "isHovered"], true],
  [
    "case",
    ["==", ["get", "naturalFeatureKind"], "water"],
    "#174EA6",
    "#1A73E8"
  ],
  ["==", ["get", "placeType"], "natural-feature"],
  [
    "case",
    ["==", ["get", "naturalFeatureKind"], "water"],
    "#1967D2",
    "#0B6B2E"
  ],
  "#202124"
]);
const placeNameFontExpression = toExpression([
  "case",
  ["==", ["get", "isSelectedPlace"], true],
  ["literal", ["Noto Sans Bold"]],
  ["==", ["get", "placeType"], "natural-feature"],
  ["literal", ["Noto Sans Regular"]],
  ["literal", ["Noto Sans Bold"]]
]);
const placeNameHaloWidthExpression = toExpression([
  "case",
  ["==", ["get", "isSelectedPlace"], true],
  1.5,
  1.3
]);

type RuntimeTuning = ReturnType<typeof resolveMapRuntimeTuning>;
interface WebGlRendererInfo {
  vendor: string | null;
  renderer: string | null;
  unmaskedVendor: string | null;
  unmaskedRenderer: string | null;
  isSoftwareRenderer: boolean;
}

function applyMapModeOverlayVisibility(
  map: MapLibreMap,
  mapMode: MapDisplayMode,
  ancientLayerEnabled: boolean,
  routesModeEnabled: boolean
) {
  const showAncientLayer = mapMode === "ancient" && ancientLayerEnabled;
  for (const layerId of [
    layerAncientAreaFillId,
    layerAncientUncertainFillId,
    layerAncientBorderStateId,
    layerAncientBorderDisputedId,
    layerAncientEmpireEdgeId,
    layerAncientRoadMajorCasingId,
    layerAncientRoadMajorKnownId,
    layerAncientCoastlineId,
    layerAncientCoastlineLabelId,
    layerAncientHolderLabelId,
    layerAncientHolderLabelClickableId,
    layerAncientHolderLabelSelectedId,
    layerAncientHolderLabelClickTargetId,
    layerSelectedRegionVeilId,
    layerSelectedRegionOutlineId
  ]) {
    setLayerVisibility(map, layerId, showAncientLayer);
  }

  const showRouteLayers = routesModeEnabled;
  for (const layerId of [
    layerRoutesLinesBackgroundId,
    layerRoutesLinesForegroundId,
    layerRoutesLinesArrowsId,
    layerRoutesLinesHighlightId,
    layerRoutesStopsId,
    layerRoutesStopsStartId,
    layerRoutesViaId,
    layerRoutesMentionedId,
    layerRoutesStagePillIconId,
    layerRoutesStagePillLabelId
  ]) {
    setLayerVisibility(map, layerId, showRouteLayers);
  }

  const showPlaceLayers = mapMode === "ancient";
  for (const layerId of [
    layerMajorPinId,
    layerMajorPinNoDotId,
    layerRoutePriorityMajorPinId,
    layerRoutePriorityCityPinId,
    layerRoutePrioritySitePinId,
    layerMajorAreaLabelOverviewId,
    layerMajorAreaLabelId,
    layerCityPinId,
    layerCityPinNoDotId,
    layerSitePinId,
    layerSitePinNoDotId,
    layerCandidatePinId,
    layerPinLabelId,
    layerSelectedMajorPinLabelId,
    layerSelectedSitePinLabelId,
    layerSelectedPinLabelId,
    layerAreaLabelOverviewId,
    layerAreaLabelId,
    layerSelectedAreaLabelId
  ]) {
    setLayerVisibility(map, layerId, showPlaceLayers);
  }
  setLayerVisibility(map, layerSelectedPlacePinId, true);
}

type GeoJsonSourceData = Parameters<GeoJSONSource["setData"]>[0];
type LayerFilter = FilterSpecification;

function isFeatureCollectionData(
  value: GeoJsonSourceData
): value is Exclude<GeoJsonSourceData, string> & { features: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "features" in value &&
    Array.isArray((value as { features: unknown }).features)
  );
}

function toLayerFilter(filter: unknown): LayerFilter {
  return filter as LayerFilter;
}

function toExpression(expression: unknown): ExpressionSpecification {
  return expression as ExpressionSpecification;
}

interface VisibleClusterEntry {
  id: string;
  kind: "cluster";
  sourceId: typeof sourceClusteredCityPinsId;
  coordinates: Coordinates;
  accessibleName: string;
  tooltipText: string;
  clusterId: number;
  pointCount: number;
  interactionRank: number;
}

interface VisiblePlaceEntry {
  id: string;
  kind: "place";
  coordinates: Coordinates;
  accessibleName: string;
  tooltipText: string;
  selection: PlaceSelection;
  interactionRank: number;
  featureSource: string | null;
  featureId: string | number | null;
}

type VisibleListEntry = VisibleClusterEntry | VisiblePlaceEntry;

function isStandardClusterLayerId(layerId: string) {
  return false;
}

function getStyleUrl(mode: BasemapMode, mapMode: MapDisplayMode) {
  if (mapMode === "modern") {
    return mode === "fallback" ? MODERN_FALLBACK_BASEMAP_STYLE_URL : MODERN_MAIN_BASEMAP_STYLE_URL;
  }

  if (mode === "fallback") {
    return ANCIENT_FALLBACK_BASEMAP_STYLE_URL;
  }

  return ANCIENT_MAIN_BASEMAP_STYLE_URL;
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
  durationMs: number,
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
    duration: durationMs
  });
}

function fitBoundsForPlace(
  map: MapLibreMap,
  coordinates: Coordinates[],
  maxZoom: number,
  leftInset: number,
  bottomInset: number,
  durationMs: number,
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
    padding: resolveMapFitPadding({
      leftInset,
      bottomInset,
      top: focusPaddingTop,
      side: 64,
      bottom: 64
    }),
    maxZoom,
    duration: reducedMotion ? 0 : durationMs
  });
}

function focusSelection(
  map: MapLibreMap,
  place: PlaceIndexRecord,
  selection: PlaceSelection,
  leftInset: number,
  bottomInset: number,
  durationMs: number
) {
  const focusPlan = planSelectionFocus(place, selection);
  if (!focusPlan) {
    return;
  }

  if (focusPlan.kind === "fit-bounds") {
    fitBoundsForPlace(map, focusPlan.coordinates, focusPlan.zoom, leftInset, bottomInset, durationMs);
    return;
  }

  flyOrJump(
    map,
    {
      center: focusPlan.coordinates,
      zoom: focusPlan.zoom,
      padding: resolveMapFitPadding({
        leftInset,
        bottomInset,
        top: focusPaddingTop,
        side: 64,
        bottom: 64
      })
    },
    durationMs,
    prefersReducedMotion()
  );
}

function panSelectionIfOffScreen(
  map: MapLibreMap,
  place: PlaceIndexRecord,
  selection: PlaceSelection,
  leftInset: number,
  bottomInset: number,
  durationMs: number
) {
  const focusPlan = planSelectionFocus(place, selection);
  if (!focusPlan) {
    return;
  }

  const targetCoordinates =
    focusPlan.kind === "center"
      ? focusPlan.coordinates
      : (() => {
          const [first, ...rest] = focusPlan.coordinates;
          if (!first) {
            return null;
          }
          const bounds = new LngLatBounds(first, first);
          for (const coordinate of rest) {
            bounds.extend(coordinate);
          }
          const center = bounds.getCenter();
          return [center.lng, center.lat] as Coordinates;
        })();
  if (!targetCoordinates) {
    return;
  }

  if (
    !isPointOffScreen(map, targetCoordinates, {
      leftInset,
      bottomInset
    })
  ) {
    return;
  }

  map.easeTo({
    center: targetCoordinates,
    zoom: map.getZoom(),
    duration: prefersReducedMotion() ? 0 : durationMs
  });
}

function isPointOffScreen(
  map: MapLibreMap,
  coordinates: Coordinates,
  insets: { leftInset: number; bottomInset: number }
) {
  const projected = map.project(coordinates as LngLatLike);
  const minX = insets.leftInset + 40;
  const maxX = (typeof window === "undefined" ? 1440 : window.innerWidth) - 40;
  const minY = 56;
  const maxY = (typeof window === "undefined" ? 900 : window.innerHeight) - insets.bottomInset - 40;
  return projected.x < minX || projected.x > maxX || projected.y < minY || projected.y > maxY;
}

function getMapLabelPadding(leftInset: number, bottomInset: number) {
  return {
    top: mapLabelPaddingTop,
    right: mapLabelPaddingEdge,
    bottom: bottomInset + mapLabelPaddingEdge,
    left: leftInset + mapLabelPaddingEdge
  };
}

function openOverviewForCurrentViewport(
  map: MapLibreMap,
  insets: { left: number; bottom: number },
  durationMs: number
) {
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const mode = openingCameraMode(viewportWidth);
  if (mode === "desktop-fixed") {
    flyOrJump(
      map,
      {
        center: DEFAULT_MAP_CENTER,
        zoom: DEFAULT_MAP_ZOOM
      },
      durationMs
    );
    return;
  }

  map.fitBounds(
    openingAreaBounds(),
    openingAreaFitOptions({
      insets,
      durationMs: prefersReducedMotion() ? 0 : durationMs
    })
  );
}

function collapseCompactAttribution(container: HTMLElement | null) {
  if (!container) {
    return;
  }

  container.classList.remove("maplibregl-compact-show");
}

function expandCompactAttributionOnFirstPaint(map: MapLibreMap, mapContainer: HTMLElement | null) {
  const attributionElement =
    mapContainer?.querySelector<HTMLDivElement>(".maplibregl-ctrl-attrib.maplibregl-compact") ??
    null;
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

function ensurePreconnectLink(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[rel="preconnect"][href="${href}"]`
  );
  if (existing) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = href;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

function ensureBasemapPreconnectLinks() {
  ensurePreconnectLink("https://tiles.openfreemap.org");
  ensurePreconnectLink("https://tiles.versatiles.org");
}

function resolveMapPixelRatio(cap: number) {
  if (typeof window === "undefined") {
    return cap;
  }

  const devicePixelRatio = Number.isFinite(window.devicePixelRatio)
    ? Math.max(1, window.devicePixelRatio)
    : 1;
  return Math.min(cap, devicePixelRatio);
}

function detectWebGlRendererInfo(): WebGlRendererInfo {
  if (typeof document === "undefined") {
    return {
      vendor: null,
      renderer: null,
      unmaskedVendor: null,
      unmaskedRenderer: null,
      isSoftwareRenderer: false
    };
  }

  const canvas = document.createElement("canvas");
  const webglContext =
    canvas.getContext("webgl2", { antialias: false, alpha: false }) ??
    canvas.getContext("webgl", { antialias: false, alpha: false });

  if (!webglContext) {
    return {
      vendor: null,
      renderer: null,
      unmaskedVendor: null,
      unmaskedRenderer: null,
      isSoftwareRenderer: false
    };
  }

  try {
    const vendor = webglContext.getParameter(webglContext.VENDOR);
    const renderer = webglContext.getParameter(webglContext.RENDERER);
    const debugExtension = webglContext.getExtension("WEBGL_debug_renderer_info");
    const unmaskedVendor = debugExtension
      ? webglContext.getParameter(debugExtension.UNMASKED_VENDOR_WEBGL)
      : null;
    const unmaskedRenderer = debugExtension
      ? webglContext.getParameter(debugExtension.UNMASKED_RENDERER_WEBGL)
      : null;
    const combinedRendererLabel = [vendor, renderer, unmaskedVendor, unmaskedRenderer]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" | ");

    return {
      vendor: typeof vendor === "string" ? vendor : null,
      renderer: typeof renderer === "string" ? renderer : null,
      unmaskedVendor: typeof unmaskedVendor === "string" ? unmaskedVendor : null,
      unmaskedRenderer: typeof unmaskedRenderer === "string" ? unmaskedRenderer : null,
      isSoftwareRenderer: softwareRendererPattern.test(combinedRendererLabel)
    };
  } finally {
    const loseContext = webglContext.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
  }
}

function resolveEffectivePixelRatioCap(
  tuning: RuntimeTuning,
  rendererInfo: WebGlRendererInfo
) {
  if (rendererInfo.isSoftwareRenderer && !tuning.variants.pixelRatioExplicit) {
    return 1;
  }

  return tuning.variants.pixelRatioCap;
}

function setLayerVisibility(map: MapLibreMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) {
    return;
  }

  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function applyBasemapLayerVariants(map: MapLibreMap, mode: BasemapMode, tuning: RuntimeTuning) {
  if (mode === "main") {
    setLayerVisibility(map, mainStyleReliefLayerId, !tuning.variants.disableRelief);
    setLayerVisibility(map, mainStyleLandcoverLayerId, !tuning.variants.disableLandcover);
  } else {
    for (const layerId of fallbackStyleLandcoverLayerIds) {
      setLayerVisibility(map, layerId, !tuning.variants.disableLandcover);
    }
  }

  const rasterFadeDuration = tuning.rasterFadeDurationMs;
  if (map.getLayer(mainStyleReliefLayerId)) {
    map.setPaintProperty(mainStyleReliefLayerId, "raster-fade-duration", rasterFadeDuration);
  }
}

function configureZoomGestures(map: MapLibreMap, tuning: RuntimeTuning) {
  map.scrollZoom.setWheelZoomRate(tuning.zoomRates.wheel);
  map.scrollZoom.setZoomRate(tuning.zoomRates.trackpad);
  map.touchZoomRotate.setZoomRate(tuning.zoomRates.pinch);
}

function shouldHandleMapKeyboardEvent(event: KeyboardEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return true;
  }

  if (
    target.closest("input, textarea, select, [contenteditable='true']") ||
    target.matches("button")
  ) {
    return false;
  }

  return true;
}

function createEmptyFeatureCollection() {
  return {
    type: "FeatureCollection" as const,
    features: []
  };
}

const emptyRoutePriorityPlaceIds = new Set<string>();

function ensureGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJsonSourceData,
  options: Partial<{
    cluster: boolean;
    clusterMaxZoom: number;
    clusterRadius: number;
    clusterProperties: Record<string, unknown>;
    lineMetrics: boolean;
    attribution: string;
    promoteId: string;
  }> = {}
) {
  const existingSource = map.getSource(sourceId);
  if (isGeoJsonSource(existingSource)) {
    existingSource.setData(data);
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data,
    ...options
  });
}

function isGeoJsonSource(source: unknown): source is GeoJSONSource {
  return (
    typeof source === "object" &&
    source !== null &&
    "setData" in source &&
    typeof source.setData === "function"
  );
}

function createCanvasImage(
  widthPx: number,
  heightPx: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void
) {
  const pixelRatio =
    typeof window === "undefined"
      ? 1
      : Number.isFinite(window.devicePixelRatio)
        ? Math.max(1, window.devicePixelRatio)
        : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(widthPx * pixelRatio);
  canvas.height = Math.round(heightPx * pixelRatio);
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.scale(pixelRatio, pixelRatio);
  draw(context, widthPx, heightPx);

  return {
    image: context.getImageData(0, 0, canvas.width, canvas.height),
    pixelRatio
  };
}

function createCandidateIconImage({
  pinColor,
  candidateLetter,
  selected
}: {
  pinColor: string;
  candidateLetter: string;
  selected: boolean;
}) {
  const diameter = selected ? 21 : 16;
  const canvasSize = selected ? 32 : 28;
  const center = canvasSize / 2;
  const radius = diameter / 2;

  return createCanvasImage(canvasSize, canvasSize, (context) => {
    if (selected) {
      context.fillStyle = "rgba(60,64,67,0.42)";
      context.beginPath();
      context.arc(center, center + 2, radius + 1.5, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = pinColor;
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 2;
    context.setLineDash([2, 2]);
    context.beginPath();
    context.arc(center, center, radius - 1, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = "#FFFFFF";
    context.font = `700 ${selected ? 12 : 11}px "Noto Sans Bold", "Noto Sans Regular", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(candidateLetter, center, center + 0.5);
  });
}

function createRouteStagePillImage() {
  return createCanvasImage(30, 30, (context, canvasWidth, canvasHeight) => {
    const canvasSize = Math.min(canvasWidth, canvasHeight);
    const width = canvasSize - 2;
    const height = 18;
    const x = 1;
    const y = (canvasSize - height) / 2;
    const radius = height / 2;

    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#1A73E8";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
    context.fill();
    context.stroke();
  });
}

function createRouteDirectionArrowImage() {
  return createCanvasImage(16, 16, (context, canvasWidth, canvasHeight) => {
    const canvasSize = Math.min(canvasWidth, canvasHeight);
    const center = canvasSize / 2;
    const halfHeight = 2.5;
    const tail = 4.5;
    const tip = canvasSize - 2;

    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.moveTo(tail, center - halfHeight);
    context.lineTo(tip, center);
    context.lineTo(tail, center + halfHeight);
    context.closePath();
    context.fill();
  });
}

function createSelectedPlacePinImage() {
  return createCanvasImage(19, 27, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    // The "place" icon from Google Material Icons (Apache License 2.0); see ATTRIBUTION.md.
    const pinPath = new Path2D(
      "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
    );
    const sourceBounds = { minX: 5, minY: 2, width: 14, height: 20 };
    const targetHeight = 25.8;
    const scale = targetHeight / sourceBounds.height;
    const scaledWidth = sourceBounds.width * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = height - sourceBounds.height * scale - 0.5;
    const strokeWidth = 1;

    context.save();
    context.translate(offsetX - sourceBounds.minX * scale, offsetY - sourceBounds.minY * scale);
    context.scale(scale, scale);
    context.fillStyle = "#EA4335";
    context.fill(pinPath);

    context.lineJoin = "miter";
    context.lineCap = "butt";
    context.lineWidth = strokeWidth / scale;
    context.strokeStyle = "#C5221F";
    context.stroke(pinPath);

    context.fillStyle = "#B31412";
    context.beginPath();
    context.arc(12, 9, 2.5, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
}

function createTownDotImage(diameter: number) {
  const canvasSize = diameter + 2;
  return createCanvasImage(canvasSize, canvasSize, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#000000";
    context.beginPath();
    context.arc(width / 2, height / 2, diameter / 2, 0, Math.PI * 2);
    context.fill();
  });
}

function ensureTownDotImages(map: MapLibreMap) {
  if (!map.hasImage(townDotMajorImageId)) {
    const majorDot = createTownDotImage(5.5);
    if (majorDot) {
      map.addImage(townDotMajorImageId, majorDot.image, { pixelRatio: majorDot.pixelRatio });
    }
  }
  if (!map.hasImage(townDotStandardImageId)) {
    const standardDot = createTownDotImage(4);
    if (standardDot) {
      map.addImage(townDotStandardImageId, standardDot.image, { pixelRatio: standardDot.pixelRatio });
    }
  }

  return {
    majorIconImageId: townDotMajorImageId,
    cityIconImageId: townDotStandardImageId,
    majorIconSize: 1,
    cityIconSize: 1
  };
}

function ensureRouteStagePillImage(map: MapLibreMap) {
  if (map.hasImage(routeStagePillImageId)) {
    return;
  }

  const image = createRouteStagePillImage();
  if (!image) {
    return;
  }

  map.addImage(routeStagePillImageId, image.image, { pixelRatio: image.pixelRatio });
}

function ensureRouteDirectionArrowImage(map: MapLibreMap) {
  if (map.hasImage(routeDirectionArrowImageId)) {
    return;
  }

  const image = createRouteDirectionArrowImage();
  if (!image) {
    return;
  }

  map.addImage(routeDirectionArrowImageId, image.image, { pixelRatio: image.pixelRatio });
}

function ensureSelectedPlacePinImage(map: MapLibreMap) {
  if (map.hasImage(selectedPlacePinImageId)) {
    return;
  }
  const image = createSelectedPlacePinImage();
  if (!image) {
    return;
  }
  map.addImage(selectedPlacePinImageId, image.image, { pixelRatio: image.pixelRatio });
}

function ensureCandidateImages(map: MapLibreMap, renderData: PlaceRenderData) {
  for (const feature of renderData.candidatePins.features) {
    const iconId = feature.properties.iconId;
    if (map.hasImage(iconId)) {
      continue;
    }

    const image = createCandidateIconImage({
      pinColor: feature.properties.pinColor,
      candidateLetter: feature.properties.candidateLetter,
      selected: feature.properties.isSelectedCandidate || feature.properties.isHighlightedPlace
    });

    if (!image) {
      continue;
    }

    map.addImage(iconId, image.image, { pixelRatio: image.pixelRatio });
  }
}

type AncientLineGeometry = LineStringGeometry | MultiLineStringGeometry;
type AncientLineFeatureCollection = FeatureCollection<AncientLineGeometry, Record<string, unknown>>;

function emptyAncientLineFeatureCollection(): AncientLineFeatureCollection {
  return {
    type: "FeatureCollection",
    features: []
  };
}

function asLineFeatureCollection(
  value: AncientLineGeometry | null | undefined
): AncientLineFeatureCollection {
  if (!value) {
    return emptyAncientLineFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: value
      }
    ]
  };
}

function holderKindLabel(kind: AncientEntityRecord["kind"], holderId?: string) {
  if (holderId === "italy-direct") {
    return "Ruled from Rome, not a province";
  }
  if (holderId === "archelaus-ethnarchy") {
    return "Ethnarchy under Rome";
  }
  if (holderId === "roman-empire") {
    return "Roman provinces shown together";
  }

  if (kind === "roman-province") {
    return "Roman province";
  }
  if (kind === "client-kingdom") {
    return "Allied kingdom";
  }
  if (kind === "client-tetrarchy") {
    return "Tetrarchy under Rome";
  }
  if (kind === "free-city-or-league") {
    return "Free city or league";
  }
  if (kind === "outside-empire") {
    return "Outside the empire";
  }

  return "Status unclear in the sources";
}

function buildAncientAreaFeatures(
  shapes: AncientShapesPayload | null,
  stopPayload: AncientStopPayload | null,
  entitiesById: Map<string, AncientEntityRecord>
) {
  const empty = createEmptyFeatureCollection();
  if (!shapes || !stopPayload) {
    return empty;
  }

  const shapeByAreaId = new Map(
    shapes.areas.features.map((feature) => [feature.properties.areaId, feature.geometry] as const)
  );

  return {
    type: "FeatureCollection" as const,
    features: stopPayload.areas
      .map((area) => {
        const geometry = shapeByAreaId.get(area.areaId);
        if (!geometry) {
          return null;
        }

        const holder = entitiesById.get(area.holderId);
        const tooltipText =
          area.holderKind === "uncertain"
            ? area.note
              ? `Status unclear in the sources: ${area.note}`
              : "Status unclear in the sources"
            : `${holder?.name ?? area.holderId} (${holderKindLabel(area.holderKind, area.holderId)})`;

        return {
          type: "Feature" as const,
          properties: {
            areaId: area.areaId,
            holderId: area.holderId,
            holderKind: area.holderKind,
            tooltipText
          },
          geometry
        };
      })
      .filter((feature): feature is NonNullable<typeof feature> => feature !== null)
  };
}

function buildAncientBorderFeatures(stopPayload: AncientStopPayload | null): AncientLineFeatureCollection {
  if (!stopPayload) {
    return emptyAncientLineFeatureCollection();
  }

  return {
    type: "FeatureCollection",
    features: stopPayload.holderBorders.features.map((feature) => ({
      type: "Feature",
      properties: { ...feature.properties },
      geometry: feature.geometry
    }))
  };
}

function buildAncientHolderLabelFeatures(
  stopPayload: AncientStopPayload | null,
  timelineRangeEndYear: number
) {
  if (!stopPayload) {
    return createEmptyFeatureCollection();
  }

  return {
    type: "FeatureCollection" as const,
    features: stopPayload.holderLabels
      .map((label, labelIndex) => {
        const holderAssignment = stopPayload.areas.find((area) => area.areaId === label.areaId);
        const labelText = label.labelText;
        const entryId = `holder-label:${label.holderId}:${label.areaId}:${label.labelText}:${labelIndex}`;
        const yearRangeText = holderAssignment
          ? formatHolderYearRange({
              heldFromYear: holderAssignment.heldFromYear,
              heldToYear: holderAssignment.heldToYear,
              heldFromKnown: holderAssignment.heldFromKnown,
              timelineRangeEndYear
            })
          : "";
        const rulerText = holderAssignment?.ruler ? ` · ${holderAssignment.ruler}` : "";
        const yearRangePart = yearRangeText.length > 0 ? ` · ${yearRangeText}` : "";
        return {
          type: "Feature" as const,
          id: entryId,
          properties: {
            entryId,
            holderId: label.holderId,
            holderLocationId: label.locationId,
            labelText,
            minZoom: label.minZoom,
            clickable: typeof label.locationId === "string" && label.locationId.length > 0,
            tooltipText:
              typeof label.tooltipText === "string" && label.tooltipText.length > 0
                ? label.tooltipText
                : `${label.name} · ${holderKindLabel(label.kind, label.holderId)}${rulerText}${yearRangePart}`
          },
          geometry: {
            type: "Point" as const,
            coordinates: label.labelPoint
          }
        };
      })
  };
}

function selectedHolderLabelEntryIdForPlace(
  stopPayload: AncientStopPayload | null,
  selectedPlaceId: string | null | undefined,
  allowRomanHolderLabelSelection: boolean
) {
  if (!stopPayload || !selectedPlaceId) {
    return null;
  }
  if (selectedPlaceId === "roman-empire" && !allowRomanHolderLabelSelection) {
    return null;
  }

  const selectedLabelIndex = stopPayload.holderLabels.findIndex(
    (label) => label.locationId === selectedPlaceId
  );
  if (selectedLabelIndex < 0) {
    return null;
  }
  const selectedLabel = stopPayload.holderLabels[selectedLabelIndex];

  return `holder-label:${selectedLabel.holderId}:${selectedLabel.areaId}:${selectedLabel.labelText}:${selectedLabelIndex}`;
}

function ensureMapLayers(map: MapLibreMap) {
  const townDotImages = ensureTownDotImages(map);

  if (!map.getLayer(layerAncientAreaFillId)) {
    map.addLayer({
      id: layerAncientAreaFillId,
      source: sourceAncientAreasId,
      type: "fill",
      filter: toLayerFilter(["!=", ["get", "holderKind"], "uncertain"]),
      paint: {
        "fill-color": [
          "match",
          ["get", "holderKind"],
          "roman-province",
          ANCIENT_LAYER_STYLE.areaFill.romanProvince.color,
          "client-kingdom",
          ANCIENT_LAYER_STYLE.areaFill.client.color,
          "client-tetrarchy",
          ANCIENT_LAYER_STYLE.areaFill.client.color,
          "free-city-or-league",
          ANCIENT_LAYER_STYLE.areaFill.client.color,
          "outside-empire",
          ANCIENT_LAYER_STYLE.areaFill.outsideEmpire.color,
          ANCIENT_LAYER_STYLE.areaFill.outsideEmpire.color
        ],
        "fill-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3,
          [
            "match",
            ["get", "holderKind"],
            "roman-province",
            ANCIENT_LAYER_STYLE.areaFill.romanProvince.opacity,
            "client-kingdom",
            ANCIENT_LAYER_STYLE.areaFill.client.opacity,
            "client-tetrarchy",
            ANCIENT_LAYER_STYLE.areaFill.client.opacity,
            "free-city-or-league",
            ANCIENT_LAYER_STYLE.areaFill.client.opacity,
            "outside-empire",
            ANCIENT_LAYER_STYLE.areaFill.outsideEmpire.opacity,
            0
          ],
          10,
          0
        ]
      }
    });
  }

  if (!map.getLayer(layerAncientUncertainFillId)) {
    map.addLayer({
      id: layerAncientUncertainFillId,
      source: sourceAncientAreasId,
      type: "fill",
      filter: toLayerFilter(["==", ["get", "holderKind"], "uncertain"]),
      paint: {
        "fill-color": "rgba(0, 0, 0, 0)",
        "fill-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerAncientBorderStateId)) {
    map.addLayer({
      id: layerAncientBorderStateId,
      source: sourceAncientBordersId,
      type: "line",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "borderStyle"], "state"],
        [">=", ["zoom"], 5]
      ]),
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.border.stateColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 7, 1, 11, 2],
        "line-dasharray": [1, 1]
      }
    });
  }

  if (!map.getLayer(layerAncientBorderDisputedId)) {
    map.addLayer({
      id: layerAncientBorderDisputedId,
      source: sourceAncientBordersId,
      type: "line",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "borderStyle"], "disputed"],
        [">=", ["zoom"], 5]
      ]),
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.border.disputedColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 5, 1.2, 12, 3],
        "line-dasharray": [4, 2]
      }
    });
  }

  if (!map.getLayer(layerAncientEmpireEdgeId)) {
    map.addLayer({
      id: layerAncientEmpireEdgeId,
      source: sourceAncientEmpireEdgeId,
      type: "line",
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.border.disputedColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 5, 1.2, 12, 3],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.4, 4, 1]
      }
    });
  }

  if (!map.getLayer(layerAncientRoadMajorCasingId)) {
    map.addLayer({
      id: layerAncientRoadMajorCasingId,
      source: sourceAncientRoadsId,
      type: "line",
      minzoom: 5,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.roads.casingColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2.6, 7, 3.6, 9, 5.5, 12, 9]
      }
    });
  }

  if (!map.getLayer(layerAncientRoadMajorKnownId)) {
    map.addLayer({
      id: layerAncientRoadMajorKnownId,
      source: sourceAncientRoadsId,
      type: "line",
      minzoom: 5,
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.roads.knownColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 5, 1.2, 7, 2, 9, 3.5, 12, 6.5]
      }
    });
  }

  if (!map.getLayer(layerAncientCoastlineId)) {
    map.addLayer({
      id: layerAncientCoastlineId,
      source: sourceAncientCoastlineId,
      type: "line",
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.coastline.lineColor,
        "line-width": 1.5
      }
    });
  }

  if (!map.getLayer(layerAncientCoastlineLabelId)) {
    map.addLayer({
      id: layerAncientCoastlineLabelId,
      source: sourceAncientCoastlineId,
      type: "symbol",
      minzoom: 9,
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 250,
        "text-field": "Roman shore",
        "text-font": ["Noto Sans Italic"],
        "text-size": 12,
        "text-letter-spacing": 0.1,
        "text-max-angle": 60
      },
      paint: {
        "text-color": "#5F6368",
        "text-halo-color": ANCIENT_LAYER_STYLE.coastline.labelHaloColor,
        "text-halo-width": 1.5
      }
    });
  }

  if (!map.getLayer(layerAncientHolderLabelId)) {
    map.addLayer({
      id: layerAncientHolderLabelId,
      source: sourceAncientHolderLabelsId,
      type: "symbol",
      minzoom: 4,
      maxzoom: 10,
      filter: toLayerFilter([
        "all",
        ["==", ["get", "clickable"], false],
        [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 4]]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-transform": "uppercase",
        "text-font": ["Noto Sans Italic"],
        "text-size": 13,
        "text-letter-spacing": 0.18,
        "text-max-width": 30,
        "text-anchor": "center",
        "text-offset": [0, 0],
        "symbol-sort-key": 0
      },
      paint: {
        "text-color": "#5F6368",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerAncientHolderLabelClickableId)) {
    map.addLayer({
      id: layerAncientHolderLabelClickTargetId,
      source: sourceAncientHolderLabelsId,
      type: "circle",
      minzoom: 4,
      maxzoom: 10,
      filter: toLayerFilter(holderLabelBaseFilter),
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 12, 7, 14, 10, 18],
        "circle-color": "rgba(0,0,0,0)",
        "circle-opacity": 0.001
      }
    });

    map.addLayer({
      id: layerAncientHolderLabelClickableId,
      source: sourceAncientHolderLabelsId,
      type: "symbol",
      minzoom: 4,
      maxzoom: 10,
      filter: toLayerFilter(holderLabelBaseFilter),
      layout: {
        "text-field": ["get", "labelText"],
        "text-transform": "uppercase",
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
        "text-letter-spacing": 0.18,
        "text-max-width": 30,
        "text-anchor": "center",
        "text-offset": [0, 0],
        "symbol-sort-key": 0
      },
      paint: {
        "text-color": toExpression([
          "case",
          ["==", ["feature-state", "isHovered"], true],
          "#1A73E8",
          "#202124"
        ]),
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerAncientHolderLabelSelectedId)) {
    map.addLayer({
      id: layerAncientHolderLabelSelectedId,
      source: sourceAncientHolderLabelsId,
      type: "symbol",
      minzoom: 4,
      maxzoom: 10,
      filter: toLayerFilter(["==", ["get", "entryId"], "__none__"]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-transform": "uppercase",
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
        "text-letter-spacing": 0.18,
        "text-max-width": 30,
        "text-anchor": "center",
        "text-offset": [0, 0],
        "symbol-sort-key": 0,
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedRegionVeilId)) {
    map.addLayer({
      id: layerSelectedRegionVeilId,
      source: sourceSelectedRegionVeilId,
      type: "fill",
      paint: {
        "fill-color": "#5F6368",
        "fill-opacity": 0.15
      }
    });
  }

  if (!map.getLayer(layerSelectedRegionOutlineId)) {
    map.addLayer({
      id: layerSelectedRegionOutlineId,
      source: sourceSelectedRegionOutlineId,
      type: "line",
      paint: {
        "line-color": "#EA4335",
        "line-width": 1.5,
        "line-dasharray": [2, 2]
      }
    });
  }

  if (!map.getLayer(layerRoutesLinesBackgroundId)) {
    map.addLayer({
      id: layerRoutesLinesBackgroundId,
      source: sourceRoutesLinesId,
      type: "line",
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#FFFFFF",
        "line-width": 7,
        "line-opacity": ["case", ["==", ["get", "isDimmed"], true], 0.28, 1]
      }
    });
  }

  if (!map.getLayer(layerRoutesLinesForegroundId)) {
    map.addLayer({
      id: layerRoutesLinesForegroundId,
      source: sourceRoutesLinesId,
      type: "line",
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#1A73E8",
        "line-width": 5,
        "line-opacity": ["case", ["==", ["get", "isDimmed"], true], 0.26, 1]
      }
    });
  }

  if (!map.getLayer(layerRoutesLinesArrowsId)) {
    map.addLayer({
      id: layerRoutesLinesArrowsId,
      source: sourceRoutesLinesId,
      type: "symbol",
      filter: toLayerFilter(["==", ["get", "isInSelectedRoute"], true]),
      layout: {
        "symbol-placement": "line",
        "symbol-spacing": 200,
        "icon-image": routeDirectionArrowImageId,
        "icon-size": 1,
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": ["case", ["==", ["get", "isDimmed"], true], 0.24, 1]
      }
    });
  }

  if (!map.getLayer(layerRoutesLinesHighlightId)) {
    map.addLayer({
      id: layerRoutesLinesHighlightId,
      source: sourceRoutesLinesId,
      type: "line",
      filter: toLayerFilter([
        "any",
        ["==", ["get", "isSelectedStage"], true],
        ["==", ["get", "isHighlightedStage"], true]
      ]),
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": "#1A73E8",
        "line-width": 6
      }
    });
  }

  if (!map.getLayer(layerRoutesStopsId)) {
    map.addLayer({
      id: layerRoutesStopsId,
      source: sourceRoutesPointsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "kind"], "stop"],
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      paint: {
        "circle-radius": [
          "case",
          ["any", ["==", ["get", "isSelectedStage"], true], ["==", ["get", "isHighlightedStage"], true]],
          11,
          10
        ],
        "circle-color": "#FFFFFF",
        "circle-stroke-color": "#1A73E8",
        "circle-stroke-width": 2,
        "circle-opacity": 1
      }
    });
  }

  if (!map.getLayer(layerRoutesStopsStartId)) {
    map.addLayer({
      id: layerRoutesStopsStartId,
      source: sourceRoutesPointsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "kind"], "stop"],
        ["==", ["get", "isRouteStart"], true],
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      paint: {
        "circle-radius": [
          "case",
          ["any", ["==", ["get", "isSelectedStage"], true], ["==", ["get", "isHighlightedStage"], true]],
          7,
          6
        ],
        "circle-color": "#1A73E8",
        "circle-opacity": 1
      }
    });
  }

  if (!map.getLayer(layerRoutesViaId)) {
    map.addLayer({
      id: layerRoutesViaId,
      source: sourceRoutesPointsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "kind"], "via"],
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      paint: {
        "circle-radius": 4,
        "circle-color": "#1A73E8",
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1.2,
        "circle-opacity": 1
      }
    });
  }

  if (!map.getLayer(layerRoutesMentionedId)) {
    map.addLayer({
      id: layerRoutesMentionedId,
      source: sourceRoutesPointsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["==", ["get", "kind"], "mentioned"],
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      paint: {
        "circle-radius": 4,
        "circle-color": "#1A73E8",
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 1.2,
        "circle-opacity": 1
      }
    });
  }

  if (!map.getLayer(layerRoutesStagePillIconId)) {
    map.addLayer({
      id: layerRoutesStagePillIconId,
      source: sourceRoutesPointsId,
      type: "symbol",
      filter: toLayerFilter(["==", ["get", "kind"], "stage-pill"]),
      layout: {
        "icon-image": routeStagePillImageId,
        "icon-anchor": "center",
        "icon-size": 1,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true
      },
      paint: {
        "icon-opacity": ["case", ["==", ["get", "isDimmed"], true], 0.5, 1]
      }
    });
  }

  if (!map.getLayer(layerRoutesStagePillLabelId)) {
    map.addLayer({
      id: layerRoutesStagePillLabelId,
      source: sourceRoutesPointsId,
      type: "symbol",
      filter: toLayerFilter(["==", ["get", "kind"], "stage-pill"]),
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 10,
        "text-anchor": "center",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "#1A73E8",
        "text-opacity": ["case", ["==", ["get", "isDimmed"], true], 0.6, 1]
      }
    });
  }

  if (!map.getLayer(layerMajorPinId)) {
    map.addLayer({
      id: layerMajorPinId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        townPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "icon-image": townDotImages.majorIconImageId,
        "icon-size": townDotImages.majorIconSize,
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-padding": 0,
        "icon-optional": false,
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": MAJOR_NAME_FONT_SIZE_PX,
        "text-max-width": MAJOR_NAME_MAX_WIDTH_EM,
        "text-anchor": "bottom",
        "text-justify": "center",
        // Keeps the 6 px dot clear under major names while preserving low-zoom major visibility.
        "text-offset": [0, -0.1],
        "text-padding": 0,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerMajorPinNoDotId)) {
    map.addLayer({
      id: layerMajorPinNoDotId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        nonTownPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": MAJOR_NAME_FONT_SIZE_PX,
        "text-max-width": MAJOR_NAME_MAX_WIDTH_EM,
        "text-anchor": "center",
        "text-justify": "center",
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerCityPinId)) {
    map.addLayer({
      id: layerCityPinId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        townPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "icon-image": townDotImages.cityIconImageId,
        "icon-size": townDotImages.cityIconSize,
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-padding": 0,
        "icon-optional": false,
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-anchor": "bottom",
        "text-offset": [0, -0.1],
        "text-padding": 0,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerCityPinNoDotId)) {
    map.addLayer({
      id: layerCityPinNoDotId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        nonTownPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-variable-anchor": ["top", "bottom", "left", "right"],
        "text-radial-offset": 0.75,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerSitePinId)) {
    map.addLayer({
      id: layerSitePinId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        townPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "icon-image": townDotImages.cityIconImageId,
        "icon-size": townDotImages.cityIconSize,
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-padding": 0,
        "icon-optional": false,
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-anchor": "bottom",
        "text-offset": [0, -0.1],
        "text-padding": 0,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerSitePinNoDotId)) {
    map.addLayer({
      id: layerSitePinNoDotId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        nonTownPlaceTypeFilter,
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-variable-anchor": ["top", "bottom", "left", "right"],
        "text-radial-offset": 0.75,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerRoutePriorityMajorPinId)) {
    map.addLayer({
      id: layerRoutePriorityMajorPinId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": MAJOR_NAME_FONT_SIZE_PX,
        "text-max-width": MAJOR_NAME_MAX_WIDTH_EM,
        "text-anchor": "bottom",
        "text-justify": "center",
        // Route markers already draw the point dot; this extra offset keeps the route-priority
        // major label clear above the larger route stop circle.
        "text-offset": [0, -0.2],
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerRoutePriorityCityPinId)) {
    map.addLayer({
      id: layerRoutePriorityCityPinId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-anchor": "bottom",
        "text-offset": [0, -0.1],
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": false
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerRoutePrioritySitePinId)) {
    map.addLayer({
      id: layerRoutePrioritySitePinId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["==", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": placeNameFontExpression,
        "text-size": 13,
        "text-variable-anchor": ["top", "bottom", "left", "right"],
        "text-radial-offset": 0.75,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": placeNameColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": placeNameHaloWidthExpression
      }
    });
  }

  if (!map.getLayer(layerCandidatePinId)) {
    map.addLayer({
      id: layerCandidatePinId,
      source: sourceCandidatePinsId,
      type: "symbol",
      filter: toLayerFilter(candidateVisibilityFilter),
      layout: {
        "icon-image": ["get", "iconId"],
        "icon-size": 1,
        "icon-allow-overlap": true,
        "icon-ignore-placement": false
      }
    });
  }

  if (!map.getLayer(layerPinLabelId)) {
    map.addLayer({
      id: layerPinLabelId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["==", ["get", "isSelectedPlace"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 15,
        "text-anchor": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          "left",
          ["==", ["get", "hasMultipleCandidates"], true],
          "bottom",
          "center"
        ]),
        "text-offset": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          ["literal", [1.05, 0]],
          ["==", ["get", "hasMultipleCandidates"], true],
          ["literal", [0, -0.45]],
          ["literal", [0, 0]]
        ]),
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.5
      }
    });
  }

  if (!map.getLayer(layerAreaLabelOverviewId)) {
    map.addLayer({
      id: layerAreaLabelOverviewId,
      source: sourceAreaLabelsId,
      type: "symbol",
      filter: toLayerFilter(areaLabelOverviewFilter),
      layout: {
        "text-field": ["get", "placeName"],
        "text-transform": "uppercase",
        "text-font": areaLabelTextFontExpression,
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": areaLabelColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerAreaLabelId)) {
    map.addLayer({
      id: layerAreaLabelId,
      source: sourceAreaLabelsId,
      type: "symbol",
      filter: toLayerFilter(areaLabelVariableAnchorFilter),
      layout: {
        "text-field": ["get", "placeName"],
        "text-transform": "uppercase",
        "text-font": areaLabelTextFontExpression,
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": areaLabelColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerMajorAreaLabelOverviewId)) {
    map.addLayer({
      id: layerMajorAreaLabelOverviewId,
      source: sourceAreaLabelsId,
      type: "symbol",
      filter: toLayerFilter(areaLabelMajorOverviewFilter),
      layout: {
        "text-field": ["get", "placeName"],
        "text-transform": "uppercase",
        "text-font": areaLabelTextFontExpression,
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": areaLabelColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerMajorAreaLabelId)) {
    map.addLayer({
      id: layerMajorAreaLabelId,
      source: sourceAreaLabelsId,
      type: "symbol",
      filter: toLayerFilter(areaLabelMajorVariableAnchorFilter),
      layout: {
        "text-field": ["get", "placeName"],
        "text-transform": "uppercase",
        "text-font": areaLabelTextFontExpression,
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": areaLabelColorExpression,
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedAreaLabelId)) {
    map.addLayer({
      id: layerSelectedAreaLabelId,
      source: sourceAreaLabelsId,
      type: "symbol",
      filter: toLayerFilter(selectedAreaLabelFilter),
      layout: {
        "text-field": ["get", "placeName"],
        "text-transform": "uppercase",
        "text-font": ["Noto Sans Bold"],
        "text-size": ["+", ["get", "areaFontSize"], 2],
        "text-letter-spacing": 0.18,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedMajorPinLabelId)) {
    map.addLayer({
      id: layerSelectedMajorPinLabelId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["==", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": MAJOR_SELECTED_NAME_FONT_SIZE_PX,
        "text-max-width": MAJOR_NAME_MAX_WIDTH_EM,
        "text-offset": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          ["literal", [1.05, 0]],
          ["==", ["get", "hasMultipleCandidates"], true],
          ["literal", [0, -MAJOR_SELECTED_NAME_RAISE_EM]],
          ["literal", [0, 0]]
        ]),
        "text-anchor": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          "left",
          ["==", ["get", "hasMultipleCandidates"], true],
          "bottom",
          "center"
        ]),
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedPinLabelId)) {
    map.addLayer({
      id: layerSelectedPinLabelId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePlaceLabelVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["==", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 15,
        "text-anchor": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          "left",
          ["==", ["get", "hasMultipleCandidates"], true],
          "bottom",
          "center"
        ]),
        "text-offset": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          ["literal", [1.05, 0]],
          ["==", ["get", "hasMultipleCandidates"], true],
          ["literal", [0, -0.45]],
          ["literal", [0, 0]]
        ]),
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedSitePinLabelId)) {
    map.addLayer({
      id: layerSelectedSitePinLabelId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        basePlaceLabelVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["==", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "isInSelectedRoute"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 15,
        "text-anchor": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          "left",
          "center"
        ]),
        "text-offset": toExpression([
          "case",
          ["==", ["get", "showSelectionPin"], true],
          ["literal", [1.05, 0]],
          ["literal", [0, 0]]
        ]),
        "text-allow-overlap": false,
        "text-ignore-placement": false
      },
      paint: {
        "text-color": "#1A73E8",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerSelectedPlacePinId)) {
    map.addLayer({
      id: layerSelectedPlacePinId,
      source: sourceSelectedPlacePinId,
      type: "symbol",
      layout: {
        "icon-image": selectedPlacePinImageId,
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": false
      }
    });
  }

  if (!map.getLayer(layerKeyboardFocusId)) {
    map.addLayer({
      id: layerKeyboardFocusId,
      source: sourceKeyboardFocusId,
      type: "circle",
      paint: {
        "circle-radius": ["coalesce", ["get", "radius"], 12],
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-stroke-color": "#1A73E8",
        "circle-stroke-width": 2
      }
    });
  }

  // MapLibre places symbols from the top layer down, and a placed name hides any later name it would
  // overlap. Each move puts a layer on top, so this list runs from the lowest priority to the highest
  // (ADR-0035 item 4): other places; then empires, provinces and regions, our records above the
  // ancient layer's own names; then majors; then chosen-route places; then the selected place.
  const placementPriorityOrder = [
    layerCityPinNoDotId,
    layerCityPinId,
    layerSitePinNoDotId,
    layerSitePinId,
    layerAncientHolderLabelId,
    layerAncientHolderLabelClickableId,
    layerAreaLabelOverviewId,
    layerAreaLabelId,
    layerMajorAreaLabelOverviewId,
    layerMajorAreaLabelId,
    layerMajorPinNoDotId,
    layerMajorPinId,
    layerRoutePriorityCityPinId,
    layerRoutePrioritySitePinId,
    layerRoutePriorityMajorPinId,
    layerCandidatePinId,
    layerSelectedPlacePinId,
    layerPinLabelId,
    layerSelectedAreaLabelId,
    layerAncientHolderLabelSelectedId,
    layerSelectedMajorPinLabelId,
    layerSelectedSitePinLabelId,
    layerSelectedPinLabelId,
    layerRoutesStagePillIconId,
    layerRoutesStagePillLabelId,
    layerKeyboardFocusId
  ] as const;
  for (const layerId of placementPriorityOrder) {
    if (!map.getLayer(layerId)) {
      continue;
    }
    map.moveLayer(layerId);
  }
}

function tooltipTextFromPlaceProperties(properties: {
  placeName: string;
  typeLabel: string;
}) {
  return `${properties.placeName}, ${properties.typeLabel}`;
}

function asCoordinates(feature: MapGeoJSONFeature): Coordinates | null {
  if (!feature.geometry || feature.geometry.type !== "Point") {
    return null;
  }

  const coordinates = feature.geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;
  if (typeof longitude !== "number" || typeof latitude !== "number") {
    return null;
  }

  return [longitude, latitude];
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function propertyIsTrue(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

function asScreenPoint(point: PointLike): HitScreenPoint | null {
  if (Array.isArray(point)) {
    const [x, y] = point;
    if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) {
      return { x, y };
    }
    return null;
  }

  if (!point || typeof point !== "object") {
    return null;
  }

  if (!("x" in point) || !("y" in point)) {
    return null;
  }

  const x = point.x;
  const y = point.y;
  if (typeof x !== "number" || !Number.isFinite(x) || typeof y !== "number" || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

function queryBoxAroundPoint(point: HitScreenPoint, paddingPx: number): [PointLike, PointLike] {
  return [
    [point.x - paddingPx, point.y - paddingPx],
    [point.x + paddingPx, point.y + paddingPx]
  ];
}

function toVisibleEntry(feature: MapGeoJSONFeature): VisibleListEntry | null {
  const coordinates = asCoordinates(feature);
  if (!coordinates) {
    return null;
  }

  const layerId = typeof feature.layer?.id === "string" ? feature.layer.id : "";
  const properties = asObject(feature.properties);
  if (!properties) {
    return null;
  }

  const clusterId = asNumber(properties.cluster_id);
  const pointCount = asNumber(properties.point_count);
  if (
    layerId === layerAncientHolderLabelClickableId ||
    layerId === layerAncientHolderLabelSelectedId ||
    layerId === layerAncientHolderLabelClickTargetId
  ) {
    const holderLocationId = asString(properties.holderLocationId);
    const holderLabelText = asString(properties.labelText);
    const holderTooltipText = asString(properties.tooltipText);
    const clickable = propertyIsTrue(properties.clickable);
    if (clickable && holderLocationId && holderLabelText && holderTooltipText) {
      return {
        id: `holder:${String(properties.holderId ?? holderLocationId)}:${holderLabelText}`,
        kind: "place",
        coordinates,
        accessibleName: `${holderLabelText}, area`,
        tooltipText: holderTooltipText,
        selection: {
          placeId: holderLocationId,
          candidateIndex: null
        },
        interactionRank: 1,
        featureSource: feature.source ?? null,
        featureId: feature.id ?? null
      };
    }
    return null;
  }

  if (clusterId !== null && pointCount !== null) {
    if (!isStandardClusterLayerId(layerId)) {
      return null;
    }

    return {
      id: `cluster:${clusterId}`,
      kind: "cluster",
      sourceId: sourceClusteredCityPinsId,
      coordinates,
      accessibleName: `Cluster of ${pointCount} places`,
      tooltipText: `${pointCount} places`,
      clusterId,
      pointCount,
      interactionRank: 1
    };
  }

  const entryId = asString(properties.entryId);
  const placeId = asString(properties.placeId);
  const placeName = asString(properties.placeName);
  const typeLabel = asString(properties.typeLabel);
  const accessibleName = asString(properties.accessibleName);

  if (!entryId || !placeId || !placeName || !typeLabel || !accessibleName) {
    return null;
  }

  const candidateIndex = asNumber(properties.candidateIndex);
  const candidateLetter = asString(properties.candidateLetter);
  const interactionRank = asNumber(properties.interactionRank) ?? 1;

  return {
    id: entryId,
    kind: "place",
    coordinates,
    accessibleName,
    tooltipText:
      candidateIndex !== null && candidateLetter
        ? `${tooltipTextFromPlaceProperties({ placeName, typeLabel })}, candidate ${candidateLetter}`
        : tooltipTextFromPlaceProperties({ placeName, typeLabel }),
    selection: {
      placeId,
      candidateIndex
    },
    interactionRank,
    featureSource: feature.source ?? null,
    featureId: feature.id ?? null
  };
}

function deduplicateVisibleEntries(entries: VisibleListEntry[]) {
  const byId = new Map<string, VisibleListEntry>();
  entries.forEach((entry) => {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  });
  return Array.from(byId.values());
}

function compareByReadingOrder(map: MapLibreMap, left: VisibleListEntry, right: VisibleListEntry) {
  const leftPoint = map.project(left.coordinates as LngLatLike);
  const rightPoint = map.project(right.coordinates as LngLatLike);

  if (leftPoint.y !== rightPoint.y) {
    return leftPoint.y - rightPoint.y;
  }

  if (leftPoint.x !== rightPoint.x) {
    return leftPoint.x - rightPoint.x;
  }

  return left.id.localeCompare(right.id);
}

function updateKeyboardFocusRing(
  map: MapLibreMap,
  coordinates: Coordinates | null,
  radius = 12
) {
  const source = map.getSource(sourceKeyboardFocusId);
  if (!isGeoJsonSource(source)) {
    return;
  }

  if (!coordinates) {
    source.setData(createEmptyFeatureCollection());
    return;
  }

  source.setData({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates
        },
        properties: {
          radius
        }
      }
    ]
  });
}

function panPointOutFromPanel(
  map: MapLibreMap,
  coordinates: Coordinates,
  leftInset: number,
  durationMs: number
) {
  if (leftInset <= 0) {
    return;
  }

  const projected = map.project(coordinates as LngLatLike);
  const minimumVisibleX = leftInset + 32;
  if (projected.x >= minimumVisibleX) {
    return;
  }

  const targetCenter = map.unproject([minimumVisibleX, projected.y] as PointLike);
  flyOrJump(map, {
    center: [targetCenter.lng, targetCenter.lat]
  }, durationMs);
}

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(left: Coordinates, right: Coordinates) {
  const earthRadiusMeters = 6_371_008.8;
  const deltaLatitude = radians(right[1] - left[1]);
  const deltaLongitude = radians(right[0] - left[0]);
  const latitudeA = radians(left[1]);
  const latitudeB = radians(right[1]);

  const chord =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  const arc = 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
  return earthRadiusMeters * arc;
}

function formatScaleDistance(valueMeters: number) {
  if (valueMeters >= 1000) {
    const kilometers = valueMeters / 1000;
    const rounded = Number.isInteger(kilometers) ? kilometers.toString() : kilometers.toFixed(1);
    return `${rounded} km`;
  }

  return `${Math.round(valueMeters)} m`;
}

function isMainSourceLoaded(map: MapLibreMap) {
  return map.isSourceLoaded(PRIMARY_VECTOR_SOURCE_ID);
}

export function MapView({
  places,
  selection,
  highlightedPlaceId,
  leftPanelWidth,
  bottomPanelInset,
  suspendSelectionCameraUpdates,
  timelineOverlayInset,
  topControlsSafeBottomInset,
  compactAttributionExpandedReserveHeight,
  isSmallScreen,
  mapMode,
  selectedTimelineStopId,
  ancientTimeline,
  ancientLayerRetryToken,
  routesOverlay,
  routeKeyboardEntries,
  selectedRouteStopFocusKey,
  selectedRouteStopCoordinates,
  selectionOrigin,
  onSelectRouteMapEntry,
  onAncientLayerLoadStateChange,
  pinLabelSource,
  onSelectPlace
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const scaleBarRef = useRef<HTMLDivElement | null>(null);
  const scaleBarFillRef = useRef<HTMLDivElement | null>(null);
  const scaleBarLabelRef = useRef<HTMLSpanElement | null>(null);
  const previousFocusRequestRef = useRef<string>("");
  const cleanupAttributionRef = useRef<(() => void) | null>(null);
  const styleReadyRef = useRef(false);
  const gestureInProgressRef = useRef(false);
  const gestureReleaseTimeoutRef = useRef<number | null>(null);
  const visibleListRefreshFrameRef = useRef<number | null>(null);
  const scaleBarRefreshFrameRef = useRef<number | null>(null);
  const activeTooltipEntryIdRef = useRef<string | null>(null);
  const mapCanvasHasPointerCursorRef = useRef(false);
  const attributionControlRef = useRef<AttributionControl | null>(null);
  const attributionModeRef = useRef<string | null>(null);
  const mainSourceLoadTimeoutRef = useRef<number | null>(null);
  const mainSourceLoadControllerRef = useRef(new MainSourceLoadTimeoutController());
  const mapKeyboardActiveRef = useRef(false);
  const tooltipTrackingEnabledRef = useRef(false);
  const tooltipMouseMoveFrameRef = useRef<number | null>(null);
  const pendingTooltipPointRef = useRef<PointLike | null>(null);
  const hoveredFeatureRef = useRef<{ source: string; id: string | number } | null>(null);
  const openingOverviewAppliedRef = useRef(false);
  const panelInsetRef = useRef(0);
  const bottomInsetRef = useRef(0);
  const selectionRef = useRef<PlaceSelection | null>(null);
  const selectionOriginRef = useRef<MapViewProps["selectionOrigin"]>(selectionOrigin);
  const mapModeRef = useRef<MapDisplayMode>(mapMode);
  const mapModeEffectInitializedRef = useRef(false);
  const activateVisibleEntryRef = useRef<
    (
      entry: VisibleListEntry,
      origin: "map-name" | "map-candidate" | "keyboard-visible-place"
    ) => void
  >(() => undefined);
  const handleTooltipAtPointRef = useRef<(point: PointLike) => void>(() => undefined);
  const refreshVisibleEntryStateRef = useRef<() => void>(() => undefined);
  const scheduleVisibleEntryRefreshRef = useRef<() => void>(() => undefined);
  const syncRouteSourcesRef = useRef<() => void>(() => undefined);
  const syncBaseSourcesAndLayersRef = useRef<() => void>(() => undefined);
  const updateScaleBarRef = useRef<() => void>(() => undefined);
  const stopPayloadRequestIdsRef = useRef(new Set<string>());
  const stopPrefetchScheduledRef = useRef(false);
  const failedStopIdsRef = useRef(new Set<string>());
  const selectedTimelineStopIdRef = useRef<string | null>(selectedTimelineStopId);
  const routesModeEnabledRef = useRef(false);
  const previousRouteFocusKeyRef = useRef<string | null>(null);
  const previousSelectedStageFocusKeyRef = useRef<string | null>(null);
  const previousSelectedRouteStopFocusKeyRef = useRef<string | null>(null);
  const selectedRegionSourceSyncKeyRef = useRef<string | null>(null);
  const selectedHolderLabelFilterSyncKeyRef = useRef<string | null>(null);
  const latestRoutesOverlayRef = useRef<MapViewProps["routesOverlay"]>(routesOverlay);
  const preservedCameraRef = useRef<{
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  } | null>(null);
  useEffect(() => {
    latestRoutesOverlayRef.current = routesOverlay;
  }, [routesOverlay]);
  useEffect(() => {
    selectedTimelineStopIdRef.current = selectedTimelineStopId;
  }, [selectedTimelineStopId]);

  const runtimeTuning = useMemo(
    () =>
      resolveMapRuntimeTuning(
        typeof window === "undefined" ? "" : window.location.search
      ),
    []
  );

  const basemapController = useMemo(
    () =>
      new BasemapFallbackController({
        initialMode: configuredBasemapMode
      }),
    []
  );
  const panelInset = Math.max(0, leftPanelWidth);
  const bottomInset = Math.max(0, bottomPanelInset);
  const hasAncientTimeline = (ancientTimeline?.stops?.length ?? 0) > 0;
  const routesModeEnabled = Boolean(routesOverlay);
  useEffect(() => {
    routesModeEnabledRef.current = routesModeEnabled;
  }, [routesModeEnabled]);
  const placeById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const routePriorityPlaceIdsKey = useMemo(() => {
    return routePriorityPlaceIdsKeyFromOverlay(routesOverlay);
  }, [routesOverlay]);

  const routePriorityPlaceIds = useMemo(() => {
    if (!routePriorityPlaceIdsKey) {
      return emptyRoutePriorityPlaceIds;
    }
    return new Set(routePriorityPlaceIdsKey.split("\u0001"));
  }, [routePriorityPlaceIdsKey]);
  const renderData = useMemo(() => {
    return buildPlaceRenderData(places, selection, highlightedPlaceId, {
      includeAreaLabels: mapMode === "ancient",
      pinLabelSource,
      routePriorityPlaceIds
    });
  }, [highlightedPlaceId, mapMode, pinLabelSource, places, routePriorityPlaceIds, selection]);
  const [ancientShapes, setAncientShapes] = useState<AncientShapesPayload | null>(null);
  const [selectionToken, setSelectionToken] = useState(0);
  const selectionTokenRef = useRef(0);
  const pendingRomanHolderLabelSelectionTokenRef = useRef<number | null>(null);
  const lastRomanHolderLabelClickPointRef = useRef<HitScreenPoint | null>(null);
  const previousRomanHolderSelectionKeyRef = useRef<string | null>(null);
  const [romanHolderLabelSelectionToken, setRomanHolderLabelSelectionToken] = useState<number | null>(null);
  const [ancientHolderUnions, setAncientHolderUnions] = useState<AncientHolderUnionsPayload>({
    geometries: {}
  });
  const [ancientRoads, setAncientRoads] = useState<GeoJsonSourceData>(createEmptyFeatureCollection());
  const [ancientCoastline, setAncientCoastline] = useState<GeoJsonSourceData>(createEmptyFeatureCollection());
  const [ancientEmpireEdge, setAncientEmpireEdge] = useState<GeoJsonSourceData>(createEmptyFeatureCollection());
  const [ancientStopsById, setAncientStopsById] = useState<Record<string, AncientStopPayload>>({});
  const ancientEntitiesById = useMemo(
    () => new Map((ancientTimeline?.entities ?? []).map((entity) => [entity.id, entity] as const)),
    [ancientTimeline]
  );
  const selectedAncientStopPayload = useMemo(
    () =>
      selectedTimelineStopId && ancientStopsById[selectedTimelineStopId]
        ? ancientStopsById[selectedTimelineStopId]
        : null,
    [ancientStopsById, selectedTimelineStopId]
  );
  const selectedPlaceId = selection?.placeId ?? null;
  const selectedCandidateIndex =
    typeof selection?.candidateIndex === "number" ? selection.candidateIndex : null;
  const selectedPlaceSelectionKey =
    selectedPlaceId === null
      ? `__none__:${selectionOrigin}`
      : `${selectedPlaceId}:${selectedCandidateIndex ?? -1}:${selectionOrigin}`;
  useEffect(() => {
    if (previousRomanHolderSelectionKeyRef.current === selectedPlaceSelectionKey) {
      return;
    }
    previousRomanHolderSelectionKeyRef.current = selectedPlaceSelectionKey;
    const nextSelectionToken = selectionTokenRef.current + 1;
    selectionTokenRef.current = nextSelectionToken;
    setSelectionToken(nextSelectionToken);
    if (
      pendingRomanHolderLabelSelectionTokenRef.current === nextSelectionToken &&
      selectedPlaceId === "roman-empire"
    ) {
      setRomanHolderLabelSelectionToken(nextSelectionToken);
    } else {
      setRomanHolderLabelSelectionToken(null);
    }
    pendingRomanHolderLabelSelectionTokenRef.current = null;
    if (selectedPlaceId !== "roman-empire") {
      lastRomanHolderLabelClickPointRef.current = null;
    }
  }, [selectedPlaceId, selectedPlaceSelectionKey]);
  const allowRomanHolderLabelSelection =
    selectedPlaceId === "roman-empire" &&
    romanHolderLabelSelectionToken !== null &&
    romanHolderLabelSelectionToken === selectionToken;
  const selectedHolderLabelEntryId = useMemo(
    () =>
      selectedHolderLabelEntryIdForPlace(
        selectedAncientStopPayload,
        selectedPlaceId,
        allowRomanHolderLabelSelection
      ),
    [allowRomanHolderLabelSelection, selectedAncientStopPayload, selectedPlaceId]
  );
  const selectedHolderLabelPlaceId = selectedHolderLabelEntryId ? selectedPlaceId : null;
  const effectiveRenderData = useMemo(() => {
    if (mapMode !== "ancient" || !hasAncientTimeline) {
      return renderData;
    }

    const linkedLocationIds = linkedTimelineLocationIds(ancientTimeline?.entities);
    const visibleLinkedLocationIds =
      selectedPlaceId && !selectedHolderLabelEntryId ? new Set([selectedPlaceId]) : undefined;

    return {
      ...renderData,
      areaLabels: filterAreaLabelsForAncientMap({
        areaLabels: renderData.areaLabels,
        linkedLocationIds,
        visibleLinkedLocationIds
      })
    };
  }, [ancientTimeline?.entities, hasAncientTimeline, mapMode, renderData, selectedHolderLabelEntryId, selectedPlaceId]);
  const selectedPlacePinFeatures = useMemo(() => {
    if (!selection) {
      return createEmptyFeatureCollection();
    }
    const place = placeById.get(selection.placeId);
    if (!place || isAreaLabelType(place.type) || place.candidates.length !== 1) {
      return createEmptyFeatureCollection();
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: `selected-pin:${place.id}`,
          geometry: {
            type: "Point",
            coordinates: place.candidates[0].coordinates
          },
          properties: {
            placeId: place.id
          }
        }
      ]
    } satisfies GeoJsonSourceData;
  }, [placeById, selection]);
  const ancientAreaFeatures = useMemo(
    () => buildAncientAreaFeatures(ancientShapes, selectedAncientStopPayload, ancientEntitiesById),
    [ancientEntitiesById, ancientShapes, selectedAncientStopPayload]
  );
  const ancientBorderFeatures = useMemo(
    () => buildAncientBorderFeatures(selectedAncientStopPayload),
    [selectedAncientStopPayload]
  );
  const ancientEmpireEdgeFeatures = useMemo(() => {
    if (isFeatureCollectionData(ancientEmpireEdge) && ancientEmpireEdge.features.length > 0) {
      return ancientEmpireEdge;
    }

    return asLineFeatureCollection(selectedAncientStopPayload?.romanEmpireEdge);
  }, [ancientEmpireEdge, selectedAncientStopPayload]);
  const ancientHolderLabelFeatures = useMemo(() => {
    const timelineRangeEndYear = ancientTimeline?.range.toYear ?? 101;
    return buildAncientHolderLabelFeatures(selectedAncientStopPayload, timelineRangeEndYear);
  }, [ancientTimeline, selectedAncientStopPayload]);
  const selectedRegionGeometry = useMemo(() => {
    if (!selection || mapMode !== "ancient") {
      return null;
    }
    const selectedPlace = placeById.get(selection.placeId);
    if (!selectedPlace || !isAreaLabelType(selectedPlace.type)) {
      return null;
    }
    return findSelectedRegionGeometry({
      shapes: ancientShapes,
      holderUnionGeometries: ancientHolderUnions.geometries,
      stopPayload: selectedAncientStopPayload,
      placeId: selectedPlace.id,
      placeType: selectedPlace.type,
      politicalAreaId: selectedPlace.politicalAreaId,
      politicalUnitAreaTypes
    });
  }, [ancientHolderUnions, ancientShapes, mapMode, placeById, selectedAncientStopPayload, selection]);
  const selectedRegionSourceSyncKey = useMemo(() => {
    if (!selectedRegionGeometry) {
      return "none";
    }
    return JSON.stringify(selectedRegionGeometry);
  }, [selectedRegionGeometry]);
  const selectedRegionVeilFeatures = useMemo(
    () => buildSelectedRegionVeilFeatureCollection(selectedRegionGeometry),
    [selectedRegionGeometry]
  );
  const selectedRegionOutlineFeatures = useMemo(
    () => buildSelectedRegionOutlineFeatureCollection(selectedRegionGeometry),
    [selectedRegionGeometry]
  );

  const [basemapState, setBasemapState] = useState(() => basemapController.getState());
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [styleReadyVersion, setStyleReadyVersion] = useState(0);
  const [visibleEntries, setVisibleEntries] = useState<VisibleListEntry[]>([]);
  const [visibleEntryOverflow, setVisibleEntryOverflow] = useState(false);
  const [ancientLayerLoadState, setAncientLayerLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const ancientLayerLoadStateRef = useRef<"idle" | "loading" | "ready" | "error">("idle");
  const previousAncientLayerRetryTokenRef = useRef(ancientLayerRetryToken);
  const resetAncientLayerData = useCallback((nextState: "idle" | "loading") => {
    setAncientShapes(null);
    setAncientHolderUnions({ geometries: {} });
    setAncientRoads(createEmptyFeatureCollection());
    setAncientCoastline(createEmptyFeatureCollection());
    setAncientEmpireEdge(createEmptyFeatureCollection());
    setAncientStopsById({});
    stopPrefetchScheduledRef.current = false;
    stopPayloadRequestIdsRef.current.clear();
    failedStopIdsRef.current.clear();
    setAncientLayerLoadState(nextState);
  }, []);

  useEffect(() => {
    onAncientLayerLoadStateChange(ancientLayerLoadState);
    ancientLayerLoadStateRef.current = ancientLayerLoadState;
  }, [ancientLayerLoadState, onAncientLayerLoadStateChange]);

  useEffect(() => {
    panelInsetRef.current = panelInset;
  }, [panelInset]);

  useEffect(() => {
    bottomInsetRef.current = bottomInset;
  }, [bottomInset]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    selectionOriginRef.current = selectionOrigin;
  }, [selectionOrigin]);

  useEffect(() => {
    mapModeRef.current = mapMode;
  }, [mapMode]);

  useEffect(() => {
    if (!hasAncientTimeline) {
      queueMicrotask(() => {
        resetAncientLayerData("idle");
      });
      return;
    }

    queueMicrotask(() => {
      resetAncientLayerData("loading");
    });
  }, [hasAncientTimeline, resetAncientLayerData]);

  const loadStopPayload = useCallback(async (stopId: string, options?: { prefetch?: boolean; forceRetry?: boolean }) => {
    const prefetch = options?.prefetch ?? false;
    const forceRetry = options?.forceRetry ?? false;
    const selectedStopId = selectedTimelineStopIdRef.current;
    const isSelectedStop = selectedStopId === stopId;
    if (
      !hasAncientTimeline ||
      !stopId ||
      (ancientLayerLoadStateRef.current === "error" && !forceRetry) ||
      (failedStopIdsRef.current.has(stopId) && !forceRetry && !isSelectedStop) ||
      stopPayloadRequestIdsRef.current.has(stopId)
    ) {
      return;
    }

    if (forceRetry) {
      failedStopIdsRef.current.delete(stopId);
    }

    stopPayloadRequestIdsRef.current.add(stopId);
    try {
      const response = await fetch(`/generated/ancient.stop.${encodeURIComponent(stopId)}.json`, {
        cache: "no-store"
      });
      if (!response.ok) {
        if (response.status === 404) {
          failedStopIdsRef.current.add(stopId);
          if (selectedTimelineStopIdRef.current === stopId) {
            setAncientLayerLoadState("ready");
          }
          return;
        }
        throw new Error(`Could not load ancient stop payload '${stopId}' (${response.status})`);
      }

      const payload = (await response.json()) as AncientStopPayload;
      setAncientStopsById((previous) => {
        if (previous[payload.stopId]) {
          return previous;
        }

        return {
          ...previous,
          [payload.stopId]: payload
        };
      });
      failedStopIdsRef.current.delete(payload.stopId);
      if (selectedTimelineStopIdRef.current === payload.stopId) {
        setAncientLayerLoadState("ready");
      }
    } catch (error) {
      console.error("Failed to load ancient stop payload.", error);
      failedStopIdsRef.current.add(stopId);
      if (!prefetch || selectedTimelineStopIdRef.current === stopId) {
        setAncientLayerLoadState("error");
      }
    } finally {
      stopPayloadRequestIdsRef.current.delete(stopId);
    }
  }, [hasAncientTimeline]);

  useEffect(() => {
    if (ancientLayerRetryToken === previousAncientLayerRetryTokenRef.current) {
      return;
    }
    previousAncientLayerRetryTokenRef.current = ancientLayerRetryToken;

    if (!hasAncientTimeline) {
      return;
    }

    queueMicrotask(() => {
      setAncientLayerLoadState("loading");
    });

    if (selectedTimelineStopIdRef.current && failedStopIdsRef.current.has(selectedTimelineStopIdRef.current)) {
      queueMicrotask(() => {
        const stopId = selectedTimelineStopIdRef.current;
        if (!stopId) {
          return;
        }
        void loadStopPayload(stopId, { forceRetry: true });
      });
    }
  }, [ancientLayerRetryToken, hasAncientTimeline, loadStopPayload]);

  useEffect(() => {
    if (mapReadyVersion === 0 || ancientShapes || !hasAncientTimeline || ancientLayerLoadState === "error") {
      return;
    }

    let cancelled = false;
    void Promise.all([
      fetch("/generated/ancient.shapes.json", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ancient shapes (${response.status})`);
        }

        return (await response.json()) as AncientShapesPayload;
      }),
      fetch("/generated/ancient.roads.geojson", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ancient roads (${response.status})`);
        }

        return (await response.json()) as GeoJsonSourceData;
      }),
      fetch("/generated/ancient.coastline.geojson", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ancient coastline (${response.status})`);
        }

        return (await response.json()) as GeoJsonSourceData;
      }),
      fetch("/generated/ancient.holder-unions.json", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ancient holder unions (${response.status})`);
        }

        return (await response.json()) as AncientHolderUnionsPayload;
      }),
      fetch("/generated/ancient.empire-edge.geojson", { cache: "no-store" }).then(async (response) => {
        if (response.status === 404) {
          return createEmptyFeatureCollection() as GeoJsonSourceData;
        }

        if (!response.ok) {
          throw new Error(`Could not load ancient empire edge (${response.status})`);
        }

        return (await response.json()) as GeoJsonSourceData;
      })
    ])
      .then(
        ([
          shapesPayload,
          roadsPayload,
          coastlinePayload,
          holderUnionsPayload,
          empireEdgePayload
        ]) => {
        if (cancelled) {
          return;
        }

        setAncientShapes(shapesPayload);
        setAncientRoads(roadsPayload);
        setAncientCoastline(coastlinePayload);
        setAncientHolderUnions(holderUnionsPayload);
        setAncientEmpireEdge(empireEdgePayload);
        }
      )
      .catch((error) => {
        console.error("Failed to load ancient map layer data.", error);
        setAncientLayerLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [ancientLayerLoadState, ancientShapes, hasAncientTimeline, mapReadyVersion]);

  useEffect(() => {
    if (
      !hasAncientTimeline ||
      ancientLayerLoadState === "error" ||
      !selectedTimelineStopId ||
      ancientStopsById[selectedTimelineStopId]
    ) {
      return;
    }

    queueMicrotask(() => {
      void loadStopPayload(selectedTimelineStopId);
    });
  }, [ancientLayerLoadState, ancientStopsById, hasAncientTimeline, loadStopPayload, selectedTimelineStopId]);

  useEffect(() => {
    if (
      stopPrefetchScheduledRef.current ||
      !hasAncientTimeline ||
      ancientLayerLoadState === "error" ||
      !ancientTimeline ||
      !ancientShapes ||
      !selectedAncientStopPayload ||
      mapReadyVersion === 0
    ) {
      return;
    }

    stopPrefetchScheduledRef.current = true;
    const pendingStopIds = ancientTimeline.stops
      .map((stop) => stop.id)
      .filter((stopId) => stopId !== selectedAncientStopPayload.stopId);
    if (pendingStopIds.length === 0) {
      return;
    }

    const scheduleIdle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : (callback: () => void) => window.setTimeout(callback, 50);

    scheduleIdle(() => {
      for (const stopId of pendingStopIds) {
        if (!ancientStopsById[stopId]) {
          void loadStopPayload(stopId, { prefetch: true });
        }
      }
    });
  }, [
    ancientShapes,
    ancientLayerLoadState,
    ancientStopsById,
    hasAncientTimeline,
    ancientTimeline,
    loadStopPayload,
    mapReadyVersion,
    selectedAncientStopPayload
  ]);

  const hideTooltip = useCallback(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip || tooltip.style.display === "none") {
      return;
    }

    tooltip.style.display = "none";
    activeTooltipEntryIdRef.current = null;
  }, []);

  const setInteractiveCursor = useCallback((isInteractiveTarget: boolean) => {
    const map = mapRef.current;
    if (!map || mapCanvasHasPointerCursorRef.current === isInteractiveTarget) {
      return;
    }

    map.getCanvas().style.cursor = isInteractiveTarget ? "pointer" : "default";
    mapCanvasHasPointerCursorRef.current = isInteractiveTarget;
  }, []);

  const clearHoveredFeatureState = useCallback(() => {
    const map = mapRef.current;
    const hovered = hoveredFeatureRef.current;
    if (!map || !hovered) {
      return;
    }
    map.setFeatureState({ source: hovered.source, id: hovered.id }, { isHovered: false });
    hoveredFeatureRef.current = null;
  }, []);

  const setHoveredFeatureState = useCallback((entry: VisibleListEntry | null) => {
    if (!entry || entry.kind !== "place" || !entry.featureSource || entry.featureId === null) {
      clearHoveredFeatureState();
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    const next = {
      source: entry.featureSource,
      id: entry.featureId
    };
    const current = hoveredFeatureRef.current;
    if (current && current.source === next.source && current.id === next.id) {
      return;
    }

    if (current) {
      map.setFeatureState({ source: current.source, id: current.id }, { isHovered: false });
    }
    map.setFeatureState({ source: next.source, id: next.id }, { isHovered: true });
    hoveredFeatureRef.current = next;
  }, [clearHoveredFeatureState]);

  const resolveInteractiveEntryAtPoint = useCallback(
    (point: PointLike, hitPaddingPx: number = interactiveHitPaddingPx) => {
      const map = mapRef.current;
      if (!map) {
        return null;
      }

      const pointer = asScreenPoint(point);
      if (!pointer) {
        return null;
      }

      const features = map.queryRenderedFeatures(queryBoxAroundPoint(pointer, hitPaddingPx), {
        layers: [...interactiveLayerIds]
      });
      const entries = deduplicateVisibleEntries(
        features
          .map((feature) => toVisibleEntry(feature))
          .filter((entry): entry is VisibleListEntry => entry !== null)
      );

      const candidates = entries.map((entry) => {
        const projected = map.project(entry.coordinates as LngLatLike);
        return {
          value: entry,
          point: {
            x: projected.x,
            y: projected.y
          },
          interactionRank: entry.interactionRank
        };
      });

      return pickNearestCandidateWithPreferredRank(
        pointer,
        candidates,
        {
          preferredRank: 0,
          competingRank: 1,
          maxPreferredDistanceDeltaPx: majorInteractionPreferencePx,
          tieBreaker: (left, right) => left.id.localeCompare(right.id)
        }
      );
    },
    []
  );

  const resolveSelectedRomanHolderEntryAtPoint = useCallback(
    (point: PointLike, hitPaddingPx: number = interactiveHitPaddingPx) => {
      const map = mapRef.current;
      if (!map) {
        return null;
      }

      const pointer = asScreenPoint(point);
      if (!pointer) {
        return null;
      }

      const features = map.queryRenderedFeatures(undefined, {
        layers: [layerAncientHolderLabelSelectedId]
      });
      const entries = deduplicateVisibleEntries(features.flatMap((feature) => {
        const properties = asObject(feature.properties);
        const holderLocationId = properties ? asString(properties.holderLocationId) : null;
        if (holderLocationId !== "roman-empire") {
          return [];
        }
        const coordinates = asCoordinates(feature);
        if (!coordinates) {
          return [];
        }
        const labelText = properties ? asString(properties.labelText) : null;
        const tooltipText = properties ? asString(properties.tooltipText) : null;
        const holderId = properties ? asString(properties.holderId) : null;
        return [{
          id: `holder:${holderId ?? holderLocationId}:${labelText ?? holderLocationId}`,
          kind: "place",
          coordinates,
          accessibleName: `${labelText ?? "OTHER ROMAN PROVINCES"}, area`,
          tooltipText: tooltipText ?? "Other Roman provinces, area",
          selection: {
            placeId: holderLocationId,
            candidateIndex: null
          },
          interactionRank: 1,
          featureSource: feature.source ?? null,
          featureId: feature.id ?? null
        } satisfies VisibleListEntry];
      }));
      if (entries.length === 0) {
        return null;
      }

      const candidates = entries.map((entry) => {
        const projected = map.project(entry.coordinates as LngLatLike);
        return {
          value: entry,
          point: {
            x: projected.x,
            y: projected.y
          },
          interactionRank: entry.interactionRank
        };
      });

      const nearestSelectedRomanEntry = pickNearestCandidateWithPreferredRank(
        pointer,
        candidates,
        {
          preferredRank: 1,
          competingRank: 0,
          maxPreferredDistanceDeltaPx: majorInteractionPreferencePx,
          tieBreaker: (left, right) => left.id.localeCompare(right.id)
        }
      );
      if (!nearestSelectedRomanEntry) {
        return null;
      }
      const projected = map.project(nearestSelectedRomanEntry.coordinates as LngLatLike);
      const distancePx = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
      return distancePx <= Math.max(hitPaddingPx, 120) ? nearestSelectedRomanEntry : null;
    },
    []
  );

  const updateScaleBar = useCallback(() => {
    const map = mapRef.current;
    const mapContainer = mapContainerRef.current;
    const scaleBar = scaleBarRef.current;
    const scaleFill = scaleBarFillRef.current;
    const scaleLabel = scaleBarLabelRef.current;
    if (!map || !mapContainer || !scaleBar || !scaleFill || !scaleLabel) {
      return;
    }

    const maxWidth = 110;
    const mapBounds = mapContainer.getBoundingClientRect();
    const scaleBounds = scaleBar.getBoundingClientRect();
    const y = Math.max(
      0,
      Math.min(mapBounds.height, scaleBounds.top + scaleBounds.height / 2 - mapBounds.top)
    );
    const left = map.unproject([0, y] as PointLike);
    const right = map.unproject([maxWidth, y] as PointLike);
    const measuredMeters = distanceMeters([left.lng, left.lat], [right.lng, right.lat]);
    const roundedMeters = roundScaleDistanceMeters(measuredMeters);
    const width = Math.max(24, Math.min(maxWidth, Math.round((roundedMeters / measuredMeters) * maxWidth)));

    scaleFill.style.width = `${width}px`;
    scaleLabel.textContent = formatScaleDistance(roundedMeters);
  }, []);

  const scheduleScaleBarUpdate = useCallback(() => {
    if (scaleBarRefreshFrameRef.current !== null) {
      return;
    }

    scaleBarRefreshFrameRef.current = window.requestAnimationFrame(() => {
      scaleBarRefreshFrameRef.current = null;
      updateScaleBar();
    });
  }, [updateScaleBar]);

  const refreshVisibleEntryState = useCallback(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    const rendered = map.queryRenderedFeatures({
      layers: [...interactiveLayerIds]
    });
    const deduplicated = deduplicateVisibleEntries(
      rendered
        .map((feature) => toVisibleEntry(feature))
        .filter((entry): entry is VisibleListEntry => entry !== null)
    );
    if (deduplicated.length === 0 && places.length > 0) {
      const fallbackEntries: VisibleListEntry[] = places
        .filter((place) => place.candidates.length > 0)
        .slice(0, MAX_VISIBLE_PLACE_LIST_ENTRIES)
        .map((place, index) => ({
          id: `fallback:${place.id}:${index}`,
          kind: "place",
          coordinates: place.candidates[0].coordinates,
          accessibleName: `${place.names.ancient[0] ?? place.id}, ${place.type}`,
          tooltipText: `${place.names.ancient[0] ?? place.id}, ${place.type}`,
          selection: {
            placeId: place.id,
            candidateIndex: null
          },
          interactionRank: 1,
          featureSource: null,
          featureId: null
        }));
      setVisibleEntryOverflow(places.length > MAX_VISIBLE_PLACE_LIST_ENTRIES);
      setVisibleEntries(fallbackEntries);
      return;
    }
    deduplicated.sort((left, right) => compareByReadingOrder(map, left, right));

    const overflow = deduplicated.length > MAX_VISIBLE_PLACE_LIST_ENTRIES;
    setVisibleEntryOverflow(overflow);
    setVisibleEntries(deduplicated.slice(0, MAX_VISIBLE_PLACE_LIST_ENTRIES));
  }, [places]);

  const scheduleVisibleEntryRefresh = useCallback(() => {
    if (gestureInProgressRef.current) {
      return;
    }

    if (visibleListRefreshFrameRef.current !== null) {
      return;
    }

    visibleListRefreshFrameRef.current = window.requestAnimationFrame(() => {
      visibleListRefreshFrameRef.current = null;
      if (gestureInProgressRef.current) {
        return;
      }

      refreshVisibleEntryState();
    });
  }, [refreshVisibleEntryState]);

  const syncRouteSources = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const overlay = latestRoutesOverlayRef.current;
    ensureGeoJsonSource(
      map,
      sourceRoutesLinesId,
      overlay?.lines ?? createEmptyFeatureCollection(),
      {
        lineMetrics: true
      }
    );
    ensureGeoJsonSource(
      map,
      sourceRoutesPointsId,
      overlay?.points ?? createEmptyFeatureCollection()
    );
  }, []);

  const applySelectedHolderLabelFilters = useCallback(
    (map: MapLibreMap) => {
      const holderFilterSyncKey = `${selectedHolderLabelEntryId ?? "__none__"}:${selectedHolderLabelPlaceId ?? "__none__"}:${styleReadyVersion}`;
      if (selectedHolderLabelFilterSyncKeyRef.current === holderFilterSyncKey) {
        return;
      }

      const clickableFilter: FilterSpecification = selectedHolderLabelEntryId
        ? toLayerFilter([
            "all",
            holderLabelBaseFilter,
            ["!=", ["get", "holderLocationId"], selectedHolderLabelPlaceId]
          ])
        : toLayerFilter(holderLabelBaseFilter);
      const clickTargetFilter: FilterSpecification = toLayerFilter(holderLabelBaseFilter);
      const selectedFilter: FilterSpecification = selectedHolderLabelEntryId
        ? toLayerFilter([
            "all",
            holderLabelBaseFilter,
            ["==", ["get", "entryId"], selectedHolderLabelEntryId]
          ])
        : toLayerFilter(["==", ["get", "entryId"], "__none__"]);

      map.setFilter(layerAncientHolderLabelClickableId, clickableFilter);
      map.setFilter(layerAncientHolderLabelClickTargetId, clickTargetFilter);
      map.setFilter(layerAncientHolderLabelSelectedId, selectedFilter);
      selectedHolderLabelFilterSyncKeyRef.current = holderFilterSyncKey;
    },
    [selectedHolderLabelEntryId, selectedHolderLabelPlaceId, styleReadyVersion]
  );

  const syncBaseSourcesAndLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    clearHoveredFeatureState();

    ensureGeoJsonSource(map, sourceMajorCityPinsId, effectiveRenderData.majorCityPins, {
      promoteId: "entryId"
    });
    ensureGeoJsonSource(map, sourceClusteredCityPinsId, effectiveRenderData.clusteredCityPins, {
      promoteId: "entryId"
    });
    ensureGeoJsonSource(map, sourceSitePinsId, effectiveRenderData.sitePins, {
      promoteId: "entryId"
    });
    ensureGeoJsonSource(map, sourceCandidatePinsId, effectiveRenderData.candidatePins, {
      promoteId: "entryId"
    });
    ensureGeoJsonSource(map, sourceAreaLabelsId, effectiveRenderData.areaLabels, {
      promoteId: "entryId"
    });
    ensureGeoJsonSource(map, sourceSelectedPlacePinId, selectedPlacePinFeatures);
    ensureGeoJsonSource(map, sourceKeyboardFocusId, createEmptyFeatureCollection());
    ensureGeoJsonSource(map, sourceAncientAreasId, ancientAreaFeatures);
    ensureGeoJsonSource(map, sourceAncientBordersId, ancientBorderFeatures);
    ensureGeoJsonSource(map, sourceAncientEmpireEdgeId, ancientEmpireEdgeFeatures);
    ensureGeoJsonSource(map, sourceAncientRoadsId, ancientRoads);
    ensureGeoJsonSource(map, sourceAncientCoastlineId, ancientCoastline);
    ensureGeoJsonSource(map, sourceAncientHolderLabelsId, ancientHolderLabelFeatures, {
      promoteId: "entryId"
    });
    const shouldSyncSelectedRegionSources =
      selectedRegionSourceSyncKeyRef.current !== selectedRegionSourceSyncKey ||
      !map.getSource(sourceSelectedRegionVeilId) ||
      !map.getSource(sourceSelectedRegionOutlineId);
    if (shouldSyncSelectedRegionSources) {
      ensureGeoJsonSource(map, sourceSelectedRegionVeilId, selectedRegionVeilFeatures);
      ensureGeoJsonSource(map, sourceSelectedRegionOutlineId, selectedRegionOutlineFeatures);
      selectedRegionSourceSyncKeyRef.current = selectedRegionSourceSyncKey;
    }
    syncRouteSources();

    ensureRouteStagePillImage(map);
    ensureRouteDirectionArrowImage(map);
    ensureSelectedPlacePinImage(map);
    ensureCandidateImages(map, effectiveRenderData);
    ensureMapLayers(map);
    applySelectedHolderLabelFilters(map);
  }, [
    applySelectedHolderLabelFilters,
    clearHoveredFeatureState,
    ancientAreaFeatures,
    ancientBorderFeatures,
    ancientCoastline,
    ancientEmpireEdgeFeatures,
    ancientHolderLabelFeatures,
    ancientRoads,
    effectiveRenderData,
    selectedRegionSourceSyncKey,
    selectedRegionOutlineFeatures,
    selectedRegionVeilFeatures,
    selectedPlacePinFeatures,
    syncRouteSources
  ]);

  const handleTooltipAtPoint = useCallback(
    (point: PointLike) => {
      const map = mapRef.current;
      const tooltip = tooltipRef.current;
      if (!map || !tooltip || gestureInProgressRef.current) {
        return;
      }

      const entry = resolveInteractiveEntryAtPoint(point);
      if (!entry) {
        const pointer = asScreenPoint(point);
        if (!pointer) {
          clearHoveredFeatureState();
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }
        const rawInteractiveFeatures = map.queryRenderedFeatures(
          queryBoxAroundPoint(pointer, interactiveHitPaddingPx),
          {
            layers: [...interactiveLayerIds]
          }
        );
        const fallbackFeature = rawInteractiveFeatures.find((feature) => {
          const properties = asObject(feature.properties);
          if (!properties) {
            return false;
          }
          return (
            typeof asString(properties.entryId) === "string" ||
            typeof asString(properties.placeId) === "string" ||
            typeof asString(properties.areaId) === "string" ||
            propertyIsTrue(properties.clickable)
          );
        });
        if (fallbackFeature) {
          const properties = asObject(fallbackFeature.properties);
          const placeName = properties ? asString(properties.placeName) : null;
          const typeLabel = properties ? asString(properties.typeLabel) : null;
          const tooltipText =
            placeName && typeLabel ? tooltipTextFromPlaceProperties({ placeName, typeLabel }) : null;
          const fallbackLngLat = map.unproject([pointer.x, pointer.y]);
          const coordinates =
            asCoordinates(fallbackFeature) ??
            ([fallbackLngLat.lng, fallbackLngLat.lat] as Coordinates);
          const projected = map.project(coordinates as LngLatLike);
          if (tooltipText) {
            tooltip.textContent = tooltipText;
            tooltip.style.display = "block";
            tooltip.style.left = `${projected.x}px`;
            tooltip.style.top = `${projected.y - 22}px`;
            activeTooltipEntryIdRef.current = `fallback:${tooltipText}`;
          } else {
            hideTooltip();
          }
          clearHoveredFeatureState();
          setInteractiveCursor(true);
          return;
        }

        if (routesModeEnabledRef.current) {
          const routeFeatures = map
            .queryRenderedFeatures(queryBoxAroundPoint(pointer, interactiveHitPaddingPx), {
              layers: [layerRoutesStopsId, layerRoutesViaId, layerRoutesMentionedId, layerRoutesLinesForegroundId]
            });
          const routeFeature = routeFeatures.find(
            (feature) => feature.layer?.id !== layerRoutesLinesForegroundId
          );
          const routeProperties = routeFeature ? asObject(routeFeature.properties) : null;
          const routeLabel = routeProperties ? asString(routeProperties.label) : null;
          const routeStopKind = routeProperties ? asString(routeProperties.stopKind) : null;
          if (routeFeature && routeLabel) {
            const fallbackPoint = map.unproject([pointer.x, pointer.y]);
            const routeCoordinates =
              asCoordinates(routeFeature) ?? ([fallbackPoint.lng, fallbackPoint.lat] as Coordinates);
            const projected = map.project(routeCoordinates as LngLatLike);
            tooltip.textContent =
              routeStopKind === "route-stop" ? `${routeLabel}, route stop` : `${routeLabel}, place`;
            tooltip.style.display = "block";
            tooltip.style.left = `${projected.x}px`;
            tooltip.style.top = `${projected.y - 22}px`;
            activeTooltipEntryIdRef.current = `route:${routeLabel}`;
            clearHoveredFeatureState();
            setInteractiveCursor(true);
            return;
          }
          const routeLine = routeFeatures.find(
            (feature) => feature.layer?.id === layerRoutesLinesForegroundId
          );
          if (routeLine) {
            clearHoveredFeatureState();
            hideTooltip();
            setInteractiveCursor(true);
            return;
          }
        }

        if (mapModeRef.current !== "ancient") {
          clearHoveredFeatureState();
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }

        const infoFeature = map
          .queryRenderedFeatures(queryBoxAroundPoint(pointer, interactiveHitPaddingPx), {
            layers: [
              layerAncientHolderLabelClickableId,
              layerAncientHolderLabelSelectedId,
              layerAncientHolderLabelId,
              layerAncientUncertainFillId
            ]
          })
          .find((feature) => {
            const properties = asObject(feature.properties);
            const tooltipText = properties ? asString(properties.tooltipText) : null;
            return Boolean(tooltipText);
          });
        const infoProperties = infoFeature ? asObject(infoFeature.properties) : null;
        const infoText = infoProperties ? asString(infoProperties.tooltipText) : null;
        const infoClickable =
          infoProperties !== null &&
          propertyIsTrue(infoProperties.clickable) &&
          typeof asString(infoProperties.holderLocationId) === "string";

        if (!infoFeature || !infoText) {
          clearHoveredFeatureState();
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }

        const fallbackLngLat = map.unproject([pointer.x, pointer.y]);
        const infoCoordinates =
          asCoordinates(infoFeature) ??
          ([fallbackLngLat.lng, fallbackLngLat.lat] as Coordinates);
        if (!infoCoordinates) {
          clearHoveredFeatureState();
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }

        const projectedInfo = map.project(infoCoordinates as LngLatLike);
        tooltip.textContent = infoText;
        tooltip.style.display = "block";
        tooltip.style.left = `${projectedInfo.x}px`;
        tooltip.style.top = `${projectedInfo.y - 22}px`;
        activeTooltipEntryIdRef.current = `info:${infoText}`;
        setInteractiveCursor(infoClickable);
        clearHoveredFeatureState();
        return;
      }

      setInteractiveCursor(true);
      setHoveredFeatureState(entry);
      const projected = map.project(entry.coordinates as LngLatLike);
      if (activeTooltipEntryIdRef.current === entry.id) {
        tooltip.style.left = `${projected.x}px`;
        tooltip.style.top = `${projected.y - 22}px`;
        return;
      }

      tooltip.textContent = entry.tooltipText;
      tooltip.style.display = "block";
      tooltip.style.left = `${projected.x}px`;
      tooltip.style.top = `${projected.y - 22}px`;
      activeTooltipEntryIdRef.current = entry.id;

    },
    [clearHoveredFeatureState, hideTooltip, resolveInteractiveEntryAtPoint, setHoveredFeatureState, setInteractiveCursor]
  );

  const zoomToCluster = useCallback(
    async (entry: VisibleClusterEntry) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const source = map.getSource(entry.sourceId);
      if (!isGeoJsonSource(source)) {
        return;
      }

      const expansionZoom = await source.getClusterExpansionZoom(entry.clusterId);

      flyOrJump(map, {
        center: entry.coordinates,
        zoom: Math.max(7, expansionZoom),
        padding: {
          top: focusPaddingTop,
          right: 64,
          bottom: 64,
          left: panelInset + 64
        }
      }, runtimeTuning.controlZoomDurationMs);
    },
    [panelInset, runtimeTuning.controlZoomDurationMs]
  );

  const activateVisibleEntry = useCallback(
    (
      entry: VisibleListEntry,
      origin: "map-name" | "map-candidate" | "keyboard-visible-place"
    ) => {
      if (origin === "keyboard-visible-place") {
        const keyboardActivatedRomanHolder =
          entry.kind === "place" && entry.selection.placeId === "roman-empire";
        if (keyboardActivatedRomanHolder) {
          const alreadySelectedRoman =
            selectionRef.current?.placeId === "roman-empire" &&
            (selectionRef.current?.candidateIndex ?? null) === (entry.selection.candidateIndex ?? null);
          if (alreadySelectedRoman) {
            pendingRomanHolderLabelSelectionTokenRef.current = null;
            setRomanHolderLabelSelectionToken(selectionTokenRef.current);
          } else {
            pendingRomanHolderLabelSelectionTokenRef.current = selectionTokenRef.current + 1;
            setRomanHolderLabelSelectionToken(null);
          }
        } else {
          pendingRomanHolderLabelSelectionTokenRef.current = null;
          setRomanHolderLabelSelectionToken(null);
        }
      }

      if (entry.kind === "cluster") {
        void zoomToCluster(entry);
        return;
      }

      if (entry.selection.candidateIndex !== null && origin !== "keyboard-visible-place") {
        onSelectPlace(entry.selection, "map-candidate");
        return;
      }
      onSelectPlace(entry.selection, origin);
    },
    [onSelectPlace, zoomToCluster]
  );

  const showTooltipForVisibleEntry = useCallback(
    (entry: VisibleListEntry) => {
      const map = mapRef.current;
      const tooltip = tooltipRef.current;
      if (!map || !tooltip) {
        return;
      }

      const projected = map.project(entry.coordinates as LngLatLike);
      tooltip.textContent = entry.tooltipText;
      tooltip.style.display = "block";
      tooltip.style.left = `${projected.x}px`;
      tooltip.style.top = `${projected.y - 22}px`;
      activeTooltipEntryIdRef.current = entry.id;
    },
    []
  );

  const setVisibleEntryFocus = useCallback(
    (entry: VisibleListEntry) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const focusRadius = entry.kind === "cluster" ? 16 : 13;
      updateKeyboardFocusRing(map, entry.coordinates, focusRadius);
      panPointOutFromPanel(
        map,
        entry.coordinates,
        panelInset,
        runtimeTuning.controlZoomDurationMs
      );
      showTooltipForVisibleEntry(entry);
    },
    [panelInset, runtimeTuning.controlZoomDurationMs, showTooltipForVisibleEntry]
  );

  useEffect(() => {
    activateVisibleEntryRef.current = activateVisibleEntry;
  }, [activateVisibleEntry]);

  useEffect(() => {
    handleTooltipAtPointRef.current = handleTooltipAtPoint;
  }, [handleTooltipAtPoint]);

  useEffect(() => {
    refreshVisibleEntryStateRef.current = refreshVisibleEntryState;
  }, [refreshVisibleEntryState]);

  useEffect(() => {
    scheduleVisibleEntryRefreshRef.current = scheduleVisibleEntryRefresh;
  }, [scheduleVisibleEntryRefresh]);

  useEffect(() => {
    syncRouteSourcesRef.current = syncRouteSources;
  }, [syncRouteSources]);

  useEffect(() => {
    syncBaseSourcesAndLayersRef.current = syncBaseSourcesAndLayers;
  }, [syncBaseSourcesAndLayers]);

  useEffect(() => {
    updateScaleBarRef.current = updateScaleBar;
  }, [updateScaleBar]);

  const clearMainSourceLoadTimeout = useCallback(() => {
    if (mainSourceLoadTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(mainSourceLoadTimeoutRef.current);
    mainSourceLoadTimeoutRef.current = null;
  }, []);

  const syncAttributionControl = useCallback((
    map: MapLibreMap,
    mode: BasemapMode,
    nextMapMode: MapDisplayMode,
    nextRoutesModeEnabled: boolean
  ) => {
    const attributionKey = `${mode}:${nextMapMode}:${nextRoutesModeEnabled ? "routes" : "map"}`;
    if (attributionModeRef.current === attributionKey && attributionControlRef.current) {
      return;
    }

    if (attributionControlRef.current) {
      map.removeControl(attributionControlRef.current);
      attributionControlRef.current = null;
    }

    const control = new AttributionControl({
      compact: true,
      customAttribution: getAttributionMarkup(mode, nextMapMode, nextRoutesModeEnabled)
    });
    map.addControl(control, "bottom-right");
    attributionControlRef.current = control;
    attributionModeRef.current = attributionKey;
  }, []);

  const switchToFallback = useCallback(
    (map: MapLibreMap) => {
      const nextState = basemapController.switchToFallback();
      setBasemapState(nextState);
      if (nextState.mode !== "fallback") {
        return nextState;
      }

      clearMainSourceLoadTimeout();
      mainSourceLoadControllerRef.current.markLoaded();
      styleReadyRef.current = false;
      const nextMapMode = mapModeRef.current;
      syncAttributionControl(map, "fallback", nextMapMode, routesModeEnabledRef.current);
      map.setStyle(getStyleUrl("fallback", nextMapMode));
      return nextState;
    },
    [basemapController, clearMainSourceLoadTimeout, syncAttributionControl]
  );

  const scheduleMainSourceLoadTimeout = useCallback(
    (map: MapLibreMap) => {
      clearMainSourceLoadTimeout();
      if (basemapController.getState().mode !== "main") {
        return;
      }

      const alreadyLoaded = isMainSourceLoaded(map);
      mainSourceLoadControllerRef.current.arm({ alreadyLoaded });
      if (alreadyLoaded) {
        return;
      }

      mainSourceLoadTimeoutRef.current = window.setTimeout(() => {
        if (basemapController.getState().mode !== "main") {
          return;
        }

        const currentlyLoaded = isMainSourceLoaded(map);
        if (!mainSourceLoadControllerRef.current.shouldSwitchToFallback({ currentlyLoaded })) {
          clearMainSourceLoadTimeout();
          return;
        }

        switchToFallback(map);
      }, mainSourceLoadTimeoutMs);
    },
    [basemapController, clearMainSourceLoadTimeout, switchToFallback]
  );

  useEffect(() => {
    ensureBasemapPreconnectLinks();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return undefined;
    }

    const initialMode = basemapController.getState().mode;
    const rendererInfo = detectWebGlRendererInfo();
    const effectiveRuntimeTuning: RuntimeTuning = {
      ...runtimeTuning,
      variants: resolveEffectiveMapVariantOptions(runtimeTuning.variants, {
        isSoftwareRenderer: rendererInfo.isSoftwareRenderer
      })
    };
    const effectivePixelRatioCap = resolveEffectivePixelRatioCap(effectiveRuntimeTuning, rendererInfo);
    const preservedCamera = preservedCameraRef.current;
    const map = new MapLibreMapClass({
      container: mapContainerRef.current,
      style: getStyleUrl(initialMode, mapModeRef.current),
      center: preservedCamera?.center ?? DEFAULT_MAP_CENTER,
      zoom: preservedCamera?.zoom ?? DEFAULT_MAP_ZOOM,
      bearing: preservedCamera?.bearing ?? 0,
      pitch: preservedCamera?.pitch ?? 0,
      minZoom: 3,
      maxZoom: MAX_MAP_ZOOM,
      attributionControl: false,
      fadeDuration: effectiveRuntimeTuning.symbolFadeDurationMs,
      pixelRatio: resolveMapPixelRatio(effectivePixelRatioCap),
      maxTileCacheSize: effectiveRuntimeTuning.maxTileCacheSize,
      maxTileCacheZoomLevels: effectiveRuntimeTuning.maxTileCacheZoomLevels,
      cancelPendingTileRequestsWhileZooming:
        effectiveRuntimeTuning.cancelPendingTileRequestsWhileZooming,
      dragPan: effectiveRuntimeTuning.dragPan,
      keyboard: false,
      doubleClickZoom: false,
      crossSourceCollisions: true
    });
    configureZoomGestures(map, effectiveRuntimeTuning);

    mapRef.current = map;
    (
      window as Window & {
        [mapTestHookKey]?: MapLibreMap;
        [visibleEntryRefreshHookKey]?: () => void;
      }
    )[mapTestHookKey] = map;
    (
      window as Window & {
        [mapTestHookKey]?: MapLibreMap;
        [visibleEntryRefreshHookKey]?: () => void;
      }
    )[visibleEntryRefreshHookKey] = () => {
      refreshVisibleEntryStateRef.current();
    };
    syncAttributionControl(map, initialMode, mapModeRef.current, routesModeEnabledRef.current);

    const cancelScheduledTooltipUpdate = () => {
      pendingTooltipPointRef.current = null;
      if (tooltipMouseMoveFrameRef.current !== null) {
        window.cancelAnimationFrame(tooltipMouseMoveFrameRef.current);
        tooltipMouseMoveFrameRef.current = null;
      }
    };

    const scheduleTooltipUpdate = (point: PointLike) => {
      const pointer = asScreenPoint(point);
      if (!pointer) {
        return;
      }

      pendingTooltipPointRef.current = [pointer.x, pointer.y];
      if (tooltipMouseMoveFrameRef.current !== null) {
        return;
      }

      tooltipMouseMoveFrameRef.current = window.requestAnimationFrame(() => {
        tooltipMouseMoveFrameRef.current = null;
        const pendingPoint = pendingTooltipPointRef.current;
        pendingTooltipPointRef.current = null;
        if (!pendingPoint || gestureInProgressRef.current || !tooltipTrackingEnabledRef.current) {
          return;
        }

        handleTooltipAtPointRef.current(pendingPoint);
      });
    };

    const markGestureStarted = () => {
      if (gestureReleaseTimeoutRef.current !== null) {
        window.clearTimeout(gestureReleaseTimeoutRef.current);
        gestureReleaseTimeoutRef.current = null;
      }
      cancelScheduledTooltipUpdate();
      if (tooltipTrackingEnabledRef.current) {
        map.off("mousemove", handleMouseMove);
        tooltipTrackingEnabledRef.current = false;
      }
      gestureInProgressRef.current = true;
      clearHoveredFeatureState();
      setInteractiveCursor(false);
      hideTooltip();
    };

    const markGestureFinished = () => {
      if (gestureReleaseTimeoutRef.current !== null) {
        window.clearTimeout(gestureReleaseTimeoutRef.current);
      }

      gestureReleaseTimeoutRef.current = window.setTimeout(() => {
        gestureInProgressRef.current = false;
        gestureReleaseTimeoutRef.current = null;
        if (!tooltipTrackingEnabledRef.current) {
          map.on("mousemove", handleMouseMove);
          tooltipTrackingEnabledRef.current = true;
        }
        scheduleVisibleEntryRefreshRef.current();
      }, gestureReleaseDelayMs);
    };

    const markMapKeyboardActive = () => {
      mapKeyboardActiveRef.current = true;
    };

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        mapKeyboardActiveRef.current = false;
        return;
      }

      mapKeyboardActiveRef.current = Boolean(mapContainerRef.current?.contains(target));
    };

    const handleMapKeyboardShortcuts = (event: KeyboardEvent) => {
      if (!mapKeyboardActiveRef.current || !shouldHandleMapKeyboardEvent(event)) {
        return;
      }

      const reducedMotion = prefersReducedMotion();
      const durationMs = reducedMotion ? 0 : runtimeTuning.controlZoomDurationMs;
      const panStep = event.shiftKey
        ? Math.round(runtimeTuning.keyboardPanStepPx * 1.5)
        : runtimeTuning.keyboardPanStepPx;
      const zoomStep = event.shiftKey
        ? runtimeTuning.keyboardZoomStep * 2
        : runtimeTuning.keyboardZoomStep;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          map.panBy([panStep, 0], { duration: durationMs });
          break;
        case "ArrowRight":
          event.preventDefault();
          map.panBy([-panStep, 0], { duration: durationMs });
          break;
        case "ArrowUp":
          event.preventDefault();
          map.panBy([0, panStep], { duration: durationMs });
          break;
        case "ArrowDown":
          event.preventDefault();
          map.panBy([0, -panStep], { duration: durationMs });
          break;
        case "+":
        case "=":
          event.preventDefault();
          map.easeTo({
            zoom: Math.min(map.getMaxZoom(), map.getZoom() + zoomStep),
            duration: durationMs
          });
          break;
        case "-":
        case "_":
          event.preventDefault();
          map.easeTo({
            zoom: Math.max(map.getMinZoom(), map.getZoom() - zoomStep),
            duration: durationMs
          });
          break;
        default:
          break;
      }
    };

    const handleDoubleClickZoom = (event: {
      lngLat: { lng: number; lat: number };
      originalEvent?: MouseEvent;
      preventDefault?: () => void;
    }) => {
      event.preventDefault?.();
      const zoomStep = event.originalEvent?.shiftKey
        ? -runtimeTuning.doubleClickZoomStep
        : runtimeTuning.doubleClickZoomStep;
      const nextZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), map.getZoom() + zoomStep));
      const around = [event.lngLat.lng, event.lngLat.lat] as LngLatLike;

      if (prefersReducedMotion()) {
        map.jumpTo({
          center: around,
          zoom: nextZoom
        });
        return;
      }

      map.easeTo({
        around,
        zoom: nextZoom,
        duration: runtimeTuning.controlZoomDurationMs
      });
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
        switchToFallback(map);
      }
    };

    const handleSourceData = (event: {
      sourceId?: string;
      sourceDataType?: string;
      tile?: unknown;
      isSourceLoaded?: boolean;
    }) => {
      if (basemapController.getState().mode !== "main") {
        return;
      }

      if (event.sourceId !== PRIMARY_VECTOR_SOURCE_ID) {
        return;
      }

      if (event.isSourceLoaded === true || map.isSourceLoaded(PRIMARY_VECTOR_SOURCE_ID)) {
        mainSourceLoadControllerRef.current.markLoaded();
        clearMainSourceLoadTimeout();
      }
    };

    const handleStyleReady = () => {
      const currentMode = basemapController.getState().mode;
      styleReadyRef.current = true;
      setStyleReadyVersion((value) => value + 1);
      const nextMapMode = mapModeRef.current;
      syncAttributionControl(map, currentMode, nextMapMode, routesModeEnabledRef.current);
      configureZoomGestures(map, effectiveRuntimeTuning);
      applyBasemapLayerVariants(map, currentMode, effectiveRuntimeTuning);
      if (currentMode === "main") {
        scheduleMainSourceLoadTimeout(map);
      } else {
        clearMainSourceLoadTimeout();
      }
      map.getCanvas().tabIndex = -1;
      syncRouteSourcesRef.current();
      syncBaseSourcesAndLayersRef.current();
      applyMapModeOverlayVisibility(
        map,
        nextMapMode,
        hasAncientTimeline,
        routesModeEnabledRef.current
      );
      refreshVisibleEntryStateRef.current();
      updateScaleBarRef.current();
      setMapReadyVersion((value) => value + 1);

      if (!openingOverviewAppliedRef.current && !selectionRef.current) {
        openOverviewForCurrentViewport(
          map,
          { left: panelInsetRef.current, bottom: bottomInsetRef.current },
          0
        );
        openingOverviewAppliedRef.current = true;
      }

      const shouldExpandAttribution =
        typeof window !== "undefined" ? openingCameraMode(window.innerWidth) === "desktop-fixed" : true;
      if (!cleanupAttributionRef.current && shouldExpandAttribution) {
        cleanupAttributionRef.current = expandCompactAttributionOnFirstPaint(
          map,
          mapContainerRef.current
        );
      } else if (!shouldExpandAttribution) {
        const compactAttribution =
          mapContainerRef.current?.querySelector<HTMLDivElement>(
            ".maplibregl-ctrl-attrib.maplibregl-compact"
          ) ?? null;
        collapseCompactAttribution(compactAttribution);
      }
    };

    const handleMapClick = (event: { point: PointLike; originalEvent?: unknown }) => {
      const hitPaddingPx = interactiveHitPaddingForEvent(event.originalEvent);
      const placeEntry = resolveInteractiveEntryAtPoint(event.point, hitPaddingPx);
      if (placeEntry) {
        const clickedRomanHolderLabel =
          placeEntry.kind === "place" && placeEntry.selection.placeId === "roman-empire";
        if (clickedRomanHolderLabel) {
          lastRomanHolderLabelClickPointRef.current = asScreenPoint(event.point);
          const alreadySelectedRoman =
            selectionRef.current?.placeId === "roman-empire" &&
            (selectionRef.current?.candidateIndex ?? null) === (placeEntry.selection.candidateIndex ?? null);
          if (alreadySelectedRoman) {
            pendingRomanHolderLabelSelectionTokenRef.current = null;
            setRomanHolderLabelSelectionToken(selectionTokenRef.current);
          } else {
            pendingRomanHolderLabelSelectionTokenRef.current = selectionTokenRef.current + 1;
            setRomanHolderLabelSelectionToken(null);
          }
        } else {
          lastRomanHolderLabelClickPointRef.current = null;
          pendingRomanHolderLabelSelectionTokenRef.current = null;
          setRomanHolderLabelSelectionToken(null);
        }
        activateVisibleEntryRef.current(placeEntry, "map-name");
        return;
      }
      const selectedRomanHolderEntry = resolveSelectedRomanHolderEntryAtPoint(event.point, hitPaddingPx);
      if (selectedRomanHolderEntry) {
        pendingRomanHolderLabelSelectionTokenRef.current = null;
        setRomanHolderLabelSelectionToken(selectionTokenRef.current);
        activateVisibleEntryRef.current(selectedRomanHolderEntry, "map-name");
        return;
      }
      const pointer = asScreenPoint(event.point);
      const lastRomanHolderLabelClickPoint = lastRomanHolderLabelClickPointRef.current;
      if (
        pointer &&
        lastRomanHolderLabelClickPoint &&
        selectionRef.current?.placeId === "roman-empire" &&
        Math.hypot(
          pointer.x - lastRomanHolderLabelClickPoint.x,
          pointer.y - lastRomanHolderLabelClickPoint.y
        ) <= Math.max(4, hitPaddingPx / 2)
      ) {
        pendingRomanHolderLabelSelectionTokenRef.current = null;
        setRomanHolderLabelSelectionToken(selectionTokenRef.current);
        return;
      }
      // A click on empty map leaves the selection as it is, so the blue name stays. The
      // selection-change effect above resets the token whenever the selection does change.

      if (routesModeEnabledRef.current) {
        const pointer = asScreenPoint(event.point);
        const queryTarget = pointer
          ? queryBoxAroundPoint(pointer, hitPaddingPx)
          : event.point;
        const routeFeatures = map.queryRenderedFeatures(queryTarget, {
          layers: [
            layerRoutesStopsId,
            layerRoutesViaId,
            layerRoutesMentionedId,
            layerRoutesLinesHighlightId,
            layerRoutesLinesForegroundId
          ]
        });
        const routeMatch = routeFeatures.find((feature) =>
          feature.layer?.id === layerRoutesStopsId ||
          feature.layer?.id === layerRoutesViaId ||
          feature.layer?.id === layerRoutesMentionedId
        );
        if (routeMatch) {
          const properties = asObject(routeMatch.properties);
          const routeId = asString(properties?.routeId);
          const stageId = asString(properties?.stageId);
          const stageIndex = asNumber(properties?.stageIndex);
          const stopId = asString(properties?.stopId);
          const stopKind = asString(properties?.stopKind);
          if (
            routeId &&
            stageId &&
            stageIndex !== null &&
            stopId &&
            (stopKind === "location" || stopKind === "route-stop")
          ) {
            onSelectRouteMapEntry({
              kind: "stop",
              routeId,
              stageId,
              stageIndex,
              stopKind,
              stopId,
              origin: "map-dot"
            });
            return;
          }
        }

        const lineMatch = routeFeatures.find((feature) =>
          feature.layer?.id === layerRoutesLinesHighlightId ||
          feature.layer?.id === layerRoutesLinesForegroundId
        );
        if (lineMatch) {
          const properties = asObject(lineMatch.properties);
          const routeId = asString(properties?.routeId);
          const stageId = asString(properties?.stageId);
          const stageIndex = asNumber(properties?.stageIndex);
          if (routeId && stageId && stageIndex !== null) {
            onSelectRouteMapEntry({
              kind: "line",
              routeId,
              stageId,
              stageIndex,
              origin: "map-line"
            });
            return;
          }
        }
      }
    };
    const handleMouseMove = (event: { point: PointLike }) => {
      scheduleTooltipUpdate(event.point);
    };
    const handleMouseOut = () => {
      cancelScheduledTooltipUpdate();
      clearHoveredFeatureState();
      setInteractiveCursor(false);
      hideTooltip();
    };
    const handleMoveEnd = () => {
      scheduleVisibleEntryRefreshRef.current();
    };
    const handleMove = () => {
      scheduleScaleBarUpdate();
    };
    const handleResize = () => {
      scheduleVisibleEntryRefreshRef.current();
      scheduleScaleBarUpdate();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("keydown", handleMapKeyboardShortcuts, true);
    map.on("load", handleStyleReady);
    map.on("style.load", handleStyleReady);
    map.on("move", handleMove);
    map.on("moveend", handleMoveEnd);
    map.on("resize", handleResize);
    map.on("dragstart", markGestureStarted);
    map.on("dragend", markGestureFinished);
    map.on("zoomstart", markGestureStarted);
    map.on("zoomend", markGestureFinished);
    map.on("mousedown", markMapKeyboardActive);
    map.on("touchstart", markMapKeyboardActive);
    map.on("wheel", markMapKeyboardActive);
    map.on("dblclick", handleDoubleClickZoom);
    map.on("mousemove", handleMouseMove);
    tooltipTrackingEnabledRef.current = true;
    map.on("mouseout", handleMouseOut);
    map.on("click", handleMapClick);
    map.on("sourcedata", handleSourceData);
    map.on("error", handleError);
    scheduleMainSourceLoadTimeout(map);

    return () => {
      cleanupAttributionRef.current?.();
      cleanupAttributionRef.current = null;

      if (visibleListRefreshFrameRef.current !== null) {
        window.cancelAnimationFrame(visibleListRefreshFrameRef.current);
      }
      if (scaleBarRefreshFrameRef.current !== null) {
        window.cancelAnimationFrame(scaleBarRefreshFrameRef.current);
      }
      if (gestureReleaseTimeoutRef.current !== null) {
        window.clearTimeout(gestureReleaseTimeoutRef.current);
      }
      cancelScheduledTooltipUpdate();

      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("keydown", handleMapKeyboardShortcuts, true);
      map.off("load", handleStyleReady);
      map.off("style.load", handleStyleReady);
      map.off("move", handleMove);
      map.off("moveend", handleMoveEnd);
      map.off("resize", handleResize);
      map.off("dragstart", markGestureStarted);
      map.off("dragend", markGestureFinished);
      map.off("zoomstart", markGestureStarted);
      map.off("zoomend", markGestureFinished);
      map.off("mousedown", markMapKeyboardActive);
      map.off("touchstart", markMapKeyboardActive);
      map.off("wheel", markMapKeyboardActive);
      map.off("dblclick", handleDoubleClickZoom);
      if (tooltipTrackingEnabledRef.current) {
        map.off("mousemove", handleMouseMove);
        tooltipTrackingEnabledRef.current = false;
      }
      map.off("mouseout", handleMouseOut);
      map.off("click", handleMapClick);
      map.off("sourcedata", handleSourceData);
      map.off("error", handleError);

      clearMainSourceLoadTimeout();
      clearHoveredFeatureState();
      setInteractiveCursor(false);
      if (attributionControlRef.current) {
        map.removeControl(attributionControlRef.current);
        attributionControlRef.current = null;
      }
      const center = map.getCenter();
      preservedCameraRef.current = {
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
      };
      attributionModeRef.current = null;
      map.remove();
      mapRef.current = null;
      delete (
        window as Window & {
          [mapTestHookKey]?: MapLibreMap;
          [visibleEntryRefreshHookKey]?: () => void;
        }
      )[mapTestHookKey];
      delete (
        window as Window & {
          [mapTestHookKey]?: MapLibreMap;
          [visibleEntryRefreshHookKey]?: () => void;
        }
      )[visibleEntryRefreshHookKey];
      styleReadyRef.current = false;
      mapKeyboardActiveRef.current = false;
      tooltipTrackingEnabledRef.current = false;
    };
  }, [
    basemapController,
    clearHoveredFeatureState,
    clearMainSourceLoadTimeout,
    hasAncientTimeline,
    hideTooltip,
    resolveInteractiveEntryAtPoint,
    resolveSelectedRomanHolderEntryAtPoint,
    scheduleScaleBarUpdate,
    scheduleMainSourceLoadTimeout,
    setInteractiveCursor,
    switchToFallback,
    syncAttributionControl,
    onSelectRouteMapEntry,
    isSmallScreen,
    runtimeTuning
  ]);

  useEffect(() => {
    if (!mapModeEffectInitializedRef.current) {
      mapModeEffectInitializedRef.current = true;
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    const basemapMode = basemapController.getState().mode;
    styleReadyRef.current = false;
    syncAttributionControl(map, basemapMode, mapMode, routesModeEnabledRef.current);
    map.setStyle(getStyleUrl(basemapMode, mapMode));
  }, [basemapController, mapMode, syncAttributionControl]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const basemapMode = basemapController.getState().mode;
    syncAttributionControl(map, basemapMode, mapModeRef.current, routesModeEnabled);
  }, [basemapController, routesModeEnabled, syncAttributionControl]);

  useEffect(() => {
    if (!styleReadyRef.current) {
      return;
    }

    syncBaseSourcesAndLayers();
    const map = mapRef.current;
    if (map) {
      applyMapModeOverlayVisibility(map, mapModeRef.current, hasAncientTimeline, routesModeEnabled);
    }
    refreshVisibleEntryState();
  }, [
    hasAncientTimeline,
    refreshVisibleEntryState,
    routesModeEnabled,
    syncBaseSourcesAndLayers
  ]);

  useEffect(() => {
    if (!styleReadyRef.current) {
      return;
    }

    syncRouteSources();
  }, [syncRouteSources, routesOverlay]);

  useEffect(() => {
    updateScaleBar();
  }, [mapReadyVersion, panelInset, updateScaleBar]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    map.setPadding(getMapLabelPadding(panelInset, bottomInset));
    scheduleVisibleEntryRefresh();
    scheduleScaleBarUpdate();
  }, [bottomInset, panelInset, scheduleScaleBarUpdate, scheduleVisibleEntryRefresh]);

  useEffect(() => {
    const map = mapRef.current;
    if (!selection || !map || !styleReadyRef.current) {
      previousFocusRequestRef.current = selection ? previousFocusRequestRef.current : "";
      return;
    }
    if (suspendSelectionCameraUpdates) {
      return;
    }

    const selectionKey = `${selection.placeId}:${selection.candidateIndex ?? ""}:${panelInset}:${bottomInset}`;
    if (selectionKey === previousFocusRequestRef.current) {
      return;
    }

    const place = placeById.get(selection.placeId);
    if (!place) {
      return;
    }

    previousFocusRequestRef.current = selectionKey;
    const origin = selectionOriginRef.current;
    const isMapInitiatedSelection =
      origin === "map-name" ||
      origin === "map-candidate" ||
      origin === "map-dot" ||
      origin === "keyboard-visible-place";
    const isAreaSelection = isAreaLabelType(place.type);
    if (isMapInitiatedSelection && isAreaSelection) {
      return;
    }
    if (routesModeEnabled || isMapInitiatedSelection) {
      panSelectionIfOffScreen(
        map,
        place,
        selection,
        panelInset,
        bottomInset,
        runtimeTuning.controlZoomDurationMs
      );
      return;
    }

    focusSelection(
      map,
      place,
      selection,
      panelInset,
      bottomInset,
      runtimeTuning.flyToDurationMs
    );
  }, [
    bottomInset,
    mapReadyVersion,
    panelInset,
    placeById,
    routesModeEnabled,
    runtimeTuning.controlZoomDurationMs,
    runtimeTuning.flyToDurationMs,
    selectionOrigin,
    suspendSelectionCameraUpdates,
    selection
  ]);

  useEffect(() => {
    if (!routesOverlay) {
      return;
    }
    if (!routesOverlay.routeFocusKey || !routesOverlay.bounds) {
      previousRouteFocusKeyRef.current = null;
      return;
    }

    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }
    if (previousRouteFocusKeyRef.current === routesOverlay.routeFocusKey) {
      return;
    }
    const [southWest, northEast] = routesOverlay.bounds;
    const bounds = new LngLatBounds(southWest, northEast);
    map.fitBounds(bounds, {
      padding: resolveMapFitPadding({
        leftInset: panelInset,
        bottomInset,
        top: focusPaddingTop,
        side: 64,
        bottom: 64
      }),
      maxZoom: 8.5,
      duration: prefersReducedMotion() ? 0 : runtimeTuning.flyToDurationMs
    });
    previousRouteFocusKeyRef.current = routesOverlay.routeFocusKey;
  }, [bottomInset, panelInset, routesOverlay, runtimeTuning.flyToDurationMs, styleReadyVersion]);

  useEffect(() => {
    if (!routesOverlay) {
      return;
    }
    if (!routesOverlay.selectedStageFocusKey || !routesOverlay.selectedStageCenter) {
      previousSelectedStageFocusKeyRef.current = null;
      return;
    }
    if (previousSelectedStageFocusKeyRef.current === routesOverlay.selectedStageFocusKey) {
      return;
    }

    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    if (
      !isPointOffScreen(map, routesOverlay.selectedStageCenter, {
        leftInset: panelInset,
        bottomInset
      })
    ) {
      previousSelectedStageFocusKeyRef.current = routesOverlay.selectedStageFocusKey;
      return;
    }

    map.easeTo({
      center: routesOverlay.selectedStageCenter,
      zoom: map.getZoom(),
      duration: prefersReducedMotion() ? 0 : runtimeTuning.controlZoomDurationMs
    });
    previousSelectedStageFocusKeyRef.current = routesOverlay.selectedStageFocusKey;
  }, [bottomInset, panelInset, routesOverlay, runtimeTuning.controlZoomDurationMs, styleReadyVersion]);

  useEffect(() => {
    if (!routesModeEnabled || !selectedRouteStopFocusKey || !selectedRouteStopCoordinates) {
      previousSelectedRouteStopFocusKeyRef.current = null;
      return;
    }

    if (previousSelectedRouteStopFocusKeyRef.current === selectedRouteStopFocusKey) {
      return;
    }

    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    previousSelectedRouteStopFocusKeyRef.current = selectedRouteStopFocusKey;
    if (
      !isPointOffScreen(map, selectedRouteStopCoordinates, {
        leftInset: panelInset,
        bottomInset
      })
    ) {
      return;
    }

    map.easeTo({
      center: selectedRouteStopCoordinates,
      zoom: map.getZoom(),
      duration: prefersReducedMotion() ? 0 : runtimeTuning.controlZoomDurationMs
    });
  }, [
    bottomInset,
    panelInset,
    routesModeEnabled,
    runtimeTuning.controlZoomDurationMs,
    selectedRouteStopCoordinates,
    selectedRouteStopFocusKey,
    styleReadyVersion
  ]);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    openOverviewForCurrentViewport(
      map,
      { left: panelInset, bottom: bottomInset },
      runtimeTuning.flyToDurationMs
    );
  }, [bottomInset, panelInset, runtimeTuning.flyToDurationMs]);

  const zoomIn = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.zoomIn({
      duration: prefersReducedMotion() ? 0 : runtimeTuning.controlZoomDurationMs
    });
  }, [runtimeTuning.controlZoomDurationMs]);

  const zoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.zoomOut({
      duration: prefersReducedMotion() ? 0 : runtimeTuning.controlZoomDurationMs
    });
  }, [runtimeTuning.controlZoomDurationMs]);
  const timelineOverlayBottomInset =
    isSmallScreen && mapMode === "ancient" && hasAncientTimeline ? 192 : 0;
  const maxReachableControlInset =
    isSmallScreen && typeof window !== "undefined"
      ? Math.max(0, window.innerHeight - 124)
      : Number.POSITIVE_INFINITY;
  const controlBottomInset = Math.min(
    Math.max(bottomInset, timelineOverlayBottomInset),
    maxReachableControlInset
  );
  const resetButtonBottomOffset = isSmallScreen
    ? Math.max(controlBottomInset + 16, 88)
    : bottomInset + 16;
  const scaleBarBottomOffset = isSmallScreen
    ? Math.max(controlBottomInset + 176, 320)
    : controlBottomInset + 16;
  const compactAttributionBottomOffset = isSmallScreen ? controlBottomInset : 0;
  const routeAttributionOverlayInset = routesModeEnabled ? scaleBarBottomOffset + 56 : 0;
  const maxCompactAttributionBottomOffset =
    isSmallScreen && typeof window !== "undefined"
      ? computeCompactAttributionBottomOffsetLimit({
          viewportHeight: window.innerHeight,
          topControlsSafeBottomInset,
          expandedControlReserveHeight: compactAttributionExpandedReserveHeight
        })
      : Number.POSITIVE_INFINITY;
  const compactAttributionBottomWithTimelineOffset = Math.min(
    Math.max(compactAttributionBottomOffset, Math.max(0, timelineOverlayInset), routeAttributionOverlayInset),
    maxCompactAttributionBottomOffset
  );
  const compactAttributionRightOffset = 72;
  const filteredVisibleEntries = visibleEntries;
  const routeListedPlaceIds = new Set(
    routeKeyboardEntries
      .filter((entry) => entry.stopKind === "location")
      .map((entry) => entry.stopId)
  );
  const routeFilteredVisibleEntries = routesModeEnabled
    ? filteredVisibleEntries.filter(
        (entry) => entry.kind !== "place" || !routeListedPlaceIds.has(entry.selection.placeId)
      )
    : filteredVisibleEntries;
  const visiblePlacesList = (
    <div
      aria-label="Visible places on map"
      className="ibm-hidden-visible-places"
      role="group"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      }}
    >
        {routesModeEnabled
          ? routeKeyboardEntries.map((entry) => (
              <button
                key={entry.id}
                aria-label={entry.label}
                data-place-entry-id={entry.id}
                onClick={() => {
                  onSelectRouteMapEntry({
                    kind: "stop",
                    routeId: entry.routeId,
                    stageId: entry.stageId,
                    stageIndex: entry.stageIndex,
                    stopKind: entry.stopKind,
                    stopId: entry.stopId,
                    origin: "keyboard-visible-place"
                  });
                }}
                onFocus={() => {
                  const map = mapRef.current;
                  if (!map) {
                    return;
                  }
                  updateKeyboardFocusRing(map, entry.coordinates, 13);
                  panPointOutFromPanel(
                    map,
                    entry.coordinates,
                    panelInset,
                    runtimeTuning.controlZoomDurationMs
                  );
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))
          : null}
        {routeFilteredVisibleEntries.map((entry) => (
          <button
            key={entry.id}
          aria-label={entry.accessibleName}
          data-place-entry-id={entry.id}
          onClick={() => activateVisibleEntry(entry, "keyboard-visible-place")}
          onFocus={() => setVisibleEntryFocus(entry)}
          type="button"
        >
          {entry.accessibleName}
        </button>
      ))}
      {visibleEntryOverflow ? (
        <p role="note">Zoom in or search to reach more places</p>
      ) : null}
    </div>
  );
  const visiblePlacesPortalHost =
    typeof document !== "undefined" ? document.getElementById("ibm-visible-places-portal-root") : null;

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
        .ibm-map-root .ibm-hidden-visible-places {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .ibm-map-root .maplibregl-ctrl-attrib a {
          color: #1a73e8;
          text-decoration: underline;
        }

        .ibm-map-root .maplibregl-ctrl-attrib.maplibregl-compact {
          max-height: ${isSmallScreen ? `calc(100dvh - ${topControlsSafeBottomInset}px)` : "none"};
          overflow-y: auto;
        }

        .ibm-map-root .maplibregl-canvas-container.maplibregl-interactive,
        .ibm-map-root .maplibregl-canvas-container.maplibregl-interactive:active {
          cursor: default !important;
        }

        .ibm-map-root .maplibregl-ctrl-bottom-right,
        .ibm-map-root .maplibregl-ctrl-top-right {
          right: ${compactAttributionRightOffset}px;
          top: auto;
          bottom: ${compactAttributionBottomWithTimelineOffset}px;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0
        }}
      />
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{
          display: "none",
          position: "absolute",
          transform: "translate(-50%, -100%)",
          pointerEvents: "none",
          backgroundColor: "rgba(32,33,36,0.96)",
          color: "#FFFFFF",
          borderRadius: "4px",
          padding: "4px 8px",
          fontFamily: '"Noto Sans Regular", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: "12px",
          lineHeight: 1.3,
          zIndex: 20
        }}
      />
      <div
        ref={scaleBarRef}
        data-map-scale="metric"
        style={{
          position: "absolute",
          left: `${getScaleControlLeftOffset(panelInset)}px`,
          bottom: `${scaleBarBottomOffset}px`,
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(95,99,104,0.35)",
          borderRadius: "4px",
          padding: "4px 6px",
          boxShadow: "0 1px 2px rgba(60,64,67,0.25)"
        }}
      >
        <div
          ref={scaleBarFillRef}
          style={{
            width: "40px",
            height: "4px",
            borderTop: "2px solid #5F6368"
          }}
        />
        <span
          ref={scaleBarLabelRef}
          style={{
            display: "block",
            marginTop: "2px",
            color: "#202124",
            fontFamily:
              '"Noto Sans Regular", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: "11px"
          }}
        >
          0 m
        </span>
      </div>
      {!isSmallScreen ? (
        <>
          <button
            aria-label="Zoom in"
            data-map-control="zoom-in"
            onClick={zoomIn}
            style={{
              position: "absolute",
              right: "16px",
              bottom: "248px",
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
              cursor: "pointer",
              zIndex: 12
            }}
            title="Zoom in"
            type="button"
          >
            +
          </button>
          <button
            aria-label="Zoom out"
            data-map-control="zoom-out"
            onClick={zoomOut}
            style={{
              position: "absolute",
              right: "16px",
              bottom: "200px",
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
              cursor: "pointer",
              zIndex: 12
            }}
            title="Zoom out"
            type="button"
          >
            −
          </button>
        </>
      ) : null}
      <button
        aria-label="Reset view"
        data-map-control="reset-view"
        onClick={resetView}
        style={{
          position: "absolute",
          right: "16px",
          bottom: `${resetButtonBottomOffset}px`,
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
          cursor: "pointer",
          zIndex: 12
        }}
        title="Reset view"
        type="button"
      >
        ⟳
      </button>
      {visiblePlacesPortalHost ? createPortal(visiblePlacesList, visiblePlacesPortalHost) : visiblePlacesList}
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
            boxShadow: "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px rgba(60,64,67,0.15)",
            zIndex: 22
          }}
        >
          {basemapState.message}
        </div>
      ) : null}
    </div>
  );
}
