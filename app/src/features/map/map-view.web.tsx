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
  CLUSTER_MAX_ZOOM,
  ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION,
  ANCIENT_FALLBACK_BASEMAP_STYLE_URL,
  ANCIENT_MAIN_BASEMAP_ATTRIBUTION,
  ANCIENT_MAIN_BASEMAP_STYLE_URL,
  ANCIENT_AWMC_ATTRIBUTION,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_WORKER_URL,
  MODERN_FALLBACK_BASEMAP_ATTRIBUTION,
  MODERN_FALLBACK_BASEMAP_STYLE_URL,
  MODERN_MAIN_BASEMAP_ATTRIBUTION,
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
import { roundScaleDistanceMeters } from "./map-scale";
import {
  MAX_VISIBLE_PLACE_LIST_ENTRIES,
  buildPlaceRenderData,
  type PlaceRenderData
} from "./map-render-data";
import {
  CLUSTER_COLLISION_IMAGE_SIZE,
  PIN_COLLISION_IMAGE_SIZE,
  PIN_COLLISION_LAYOUT,
  QUESTION_BADGE_LAYOUT
} from "./map-layer-layouts";
import {
  resolveEffectiveMapVariantOptions,
  resolveMapRuntimeTuning
} from "./map-runtime-options";
import { planSelectionFocus } from "./selection-focus";
import {
  PRIMARY_VECTOR_SOURCE_ID,
  shouldCountTileErrorForFallback
} from "./tile-error-filter";
import {
  pickNearestCandidateWithPreferredRank,
  type ScreenPoint as HitScreenPoint
} from "./interactive-hit";
import { formatHolderYearRange } from "./holder-year-range";
import { ANCIENT_LAYER_STYLE } from "./ancient-layer-style";
import {
  filterAreaLabelsForAncientMap,
  linkedTimelineLocationIds
} from "./ancient-area-label-visibility";
import type { MapViewProps } from "./map-view.types";
import type {
  AncientEntityRecord,
  AncientShapesPayload,
  AncientStopPayload,
  FeatureCollection,
  LineStringGeometry,
  MultiLineStringGeometry
} from "./ancient-layer.types";
import type { Coordinates, MapDisplayMode, PlaceIndexRecord, PlaceSelection } from "./types";

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

const layerMajorClusterCircleId = "ibm-major-cluster-circle";
const layerMajorClusterLabelId = "ibm-major-cluster-label";
const layerMajorClusterLabelLeftId = "ibm-major-cluster-label-left";
const layerMajorPinShadowId = "ibm-major-pin-shadow";
const layerMajorPinId = "ibm-major-pin";
const layerMajorQuestionBadgeId = "ibm-major-question-badge";
const layerMajorClusterCollisionMaskId = "ibm-major-cluster-collision-mask";
const layerMajorPinCollisionMaskId = "ibm-major-pin-collision-mask";
const layerMajorPinLabelId = "ibm-pin-label";
const layerMajorPinLabelLeftId = "ibm-pin-label-left";
const layerMajorAreaLabelOverviewId = "ibm-major-area-label-overview";
const layerMajorAreaLabelId = "ibm-major-area-label";
const layerClusterCircleId = "ibm-cluster-circle";
const layerCityPinShadowId = "ibm-city-pin-shadow";
const layerCityPinId = "ibm-city-pin";
const layerSitePinShadowId = "ibm-site-pin-shadow";
const layerSitePinId = "ibm-site-pin";
const layerQuestionBadgeId = "ibm-question-badge";
const layerCandidatePinId = "ibm-candidate-pin";
const layerSitePinCollisionMaskId = "ibm-site-pin-collision-mask";
const layerCandidatePinCollisionMaskId = "ibm-candidate-pin-collision-mask";
const layerPinLabelId = "ibm-pin-label-standard";
const layerSelectedMajorPinLabelId = "ibm-selected-major-pin-label";
const layerSelectedPinLabelId = "ibm-selected-pin-label";
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
const layerAncientHolderLabelClickTargetId = "ibm-ancient-holder-label-click-target";

const questionBadgeImageId = "ibm-question-badge-image";
const uncertainHatchImageId = "ibm-ancient-uncertain-hatch-image";
const pinCollisionImageId = "ibm-pin-collision-image";
const clusterCollisionImageId = "ibm-cluster-collision-image";
const cityPinSymbolImageId = "ibm-city-pin-symbol-image";
const clusterSymbolImageId = "ibm-cluster-symbol-image";
const mapTestHookKey = "__ibmMapForTests";
const visibleEntryRefreshHookKey = "__ibmRefreshVisibleEntriesForTests";
const mainSourceLoadTimeoutMs = 8_000;
const gestureReleaseDelayMs = 1_000;
const mapLabelPaddingTop = 96;
const mapLabelPaddingEdge = 16;
const focusPaddingTop = 96;
const interactiveHitPaddingPx = 8;
const majorInteractionPreferencePx = 3;
const majorClusterMaxZoom = 5;
const majorClusterRadiusPx = 25.6;
const standardClusterRadiusPx = 52;
const standardMutedThresholdZoom = 6;
const standardPinBaseRadiusPx = 8;
const standardPinOverviewDefaultRadiusPx = 5.5;
const standardPinHighlightedRadiusPx = 9.5;
const standardPinSelectedRadiusPx = 10.5;
const standardClusterBaseRadiusPx = 14;
const standardClusterRadiusByPointCount = {
  default: 4,
  medium: 5,
  large: 6
} as const;
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
  layerMajorClusterCircleId,
  layerMajorClusterLabelId,
  layerMajorClusterLabelLeftId,
  layerClusterCircleId,
  layerMajorQuestionBadgeId,
  layerQuestionBadgeId,
  layerCandidatePinId,
  layerSitePinId,
  layerMajorPinId,
  layerCityPinId,
  layerMajorAreaLabelOverviewId,
  layerMajorAreaLabelId,
  layerAreaLabelOverviewId,
  layerAreaLabelId,
  layerSelectedAreaLabelId,
  layerAncientHolderLabelClickableId,
  layerAncientHolderLabelClickTargetId
] as const;

const candidateVisibilityFilter = [
  "all",
  ["<", ["zoom"], ["get", "maxZoom"]],
  ["any", [">=", ["zoom"], ["get", "minZoom"]], ["==", ["get", "isSelectedPlace"], true]]
];

const basePinVisibilityFilter = [
  "all",
  ["<", ["zoom"], ["get", "maxZoom"]],
  [">=", ["zoom"], ["get", "minZoom"]],
  [
    "any",
    ["==", ["get", "hasMultipleCandidates"], false],
    ["all", ["==", ["get", "hasMultipleCandidates"], true], ["<", ["zoom"], 8]]
  ]
];

const standardPinUnmutedZoomFilter: ExpressionSpecification = [
  ">=",
  ["zoom"],
  standardMutedThresholdZoom
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
  ["<", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelVariableAnchorFilter = [
  "all",
  areaLabelNonMajorFilter,
  areaLabelVisibilityFilter,
  [">=", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelMajorOverviewFilter = [
  "all",
  areaLabelMajorFilter,
  areaLabelVisibilityFilter,
  ["<", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelMajorVariableAnchorFilter = [
  "all",
  areaLabelMajorFilter,
  areaLabelVisibilityFilter,
  [">=", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const selectedAreaLabelFilter = ["all", areaLabelVisibilityFilter, ["==", ["get", "isSelectedPlace"], true]];
const areaLabelTextFontExpression = toExpression([
  "case",
  ["==", ["get", "areaKind"], "region"],
  ["literal", ["Noto Sans Italic"]],
  ["literal", ["Noto Sans Bold"]]
]);
const areaLabelPointLayout = {
  "text-anchor": "center" as const,
  "text-justify": "center" as const,
  "text-offset": [0, 0] as [number, number]
};
const majorPinLabelLayout = {
  "text-offset": [1.2, 0] as [number, number],
  "text-anchor": "left" as const,
  "text-justify": "left" as const
};
const majorPinLabelLeftLayout = {
  "text-offset": [-1.2, 0] as [number, number],
  "text-anchor": "right" as const,
  "text-justify": "right" as const
};

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
  ancientLayerEnabled: boolean
) {
  const showAreaLabels = mapMode === "ancient";
  for (const layerId of [
    layerAreaLabelOverviewId,
    layerAreaLabelId,
    layerMajorAreaLabelOverviewId,
    layerMajorAreaLabelId,
    layerSelectedAreaLabelId
  ]) {
    setLayerVisibility(map, layerId, showAreaLabels);
  }

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
    layerAncientHolderLabelClickTargetId
  ]) {
    setLayerVisibility(map, layerId, showAncientLayer);
  }
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

interface VisibleMajorClusterEntry {
  id: string;
  kind: "major-cluster";
  sourceId: typeof sourceMajorCityPinsId;
  coordinates: Coordinates;
  accessibleName: string;
  tooltipText: string;
  clusterId: number;
  pointCount: number;
  topPlaceName: string;
  selection: PlaceSelection;
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
}

type VisibleListEntry = VisibleClusterEntry | VisibleMajorClusterEntry | VisiblePlaceEntry;

interface MajorPlaceReference {
  placeId: string;
  placeName: string;
  pinColor: string;
  majorLabelSide: "left" | "right";
}

function isMajorClusterLayerId(layerId: string) {
  return (
    layerId === layerMajorClusterCircleId ||
    layerId === layerMajorClusterLabelId ||
    layerId === layerMajorClusterLabelLeftId
  );
}

function isStandardClusterLayerId(layerId: string) {
  return layerId === layerClusterCircleId;
}

function buildMajorPlaceReferenceByRank(renderData: PlaceRenderData) {
  const byRank = new Map<number, MajorPlaceReference>();
  for (const feature of renderData.majorCityPins.features) {
    const rank = Number(feature.properties.importanceRank);
    if (!Number.isFinite(rank) || byRank.has(rank)) {
      continue;
    }

    byRank.set(rank, {
      placeId: feature.properties.placeId,
      placeName: feature.properties.placeName,
      pinColor: feature.properties.pinColor,
      majorLabelSide: feature.properties.majorLabelSide
    });
  }

  return byRank;
}

function createMajorClusterTopNameMatchExpression(majorPlaceByRank: Map<number, MajorPlaceReference>) {
  const expression: unknown[] = ["match", ["to-string", ["get", "minImportanceRank"]]];

  const sortedEntries = Array.from(majorPlaceByRank.entries()).sort((left, right) => left[0] - right[0]);
  for (const [rank, place] of sortedEntries) {
    expression.push(String(rank), place.placeName);
  }

  expression.push("Place");
  return expression;
}

function createMajorClusterTopColorMatchExpression(majorPlaceByRank: Map<number, MajorPlaceReference>) {
  const expression: unknown[] = ["match", ["to-string", ["get", "minImportanceRank"]]];

  const sortedEntries = Array.from(majorPlaceByRank.entries()).sort((left, right) => left[0] - right[0]);
  for (const [rank, place] of sortedEntries) {
    expression.push(String(rank), place.pinColor);
  }

  expression.push("#C5221F");
  return expression;
}

function createMajorClusterLabelExpression(majorPlaceByRank: Map<number, MajorPlaceReference>) {
  const topNameExpression = createMajorClusterTopNameMatchExpression(majorPlaceByRank);
  return [
    "concat",
    topNameExpression,
    " +",
    ["to-string", ["max", 0, ["-", ["get", "point_count"], 1]]]
  ];
}

function createMajorClusterTopSideFilter(
  majorPlaceByRank: Map<number, MajorPlaceReference>,
  side: "left" | "right"
) {
  const ranks = Array.from(majorPlaceByRank.entries())
    .filter(([, place]) => place.majorLabelSide === side)
    .map(([rank]) => rank)
    .sort((left, right) => left - right);

  if (ranks.length === 0) {
    return ["==", 1, 0];
  }

  const expression: unknown[] = ["any"];
  for (const rank of ranks) {
    expression.push(["==", ["get", "minImportanceRank"], rank]);
  }

  return expression;
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

function getAttributionMarkup(mode: BasemapMode, mapMode: MapDisplayMode) {
  if (mapMode === "modern") {
    return mode === "fallback" ? MODERN_FALLBACK_BASEMAP_ATTRIBUTION : MODERN_MAIN_BASEMAP_ATTRIBUTION;
  }

  const basemapAttribution =
    mode === "fallback" ? ANCIENT_FALLBACK_BASEMAP_ATTRIBUTION : ANCIENT_MAIN_BASEMAP_ATTRIBUTION;
  return `${basemapAttribution} · ${ANCIENT_AWMC_ATTRIBUTION}`;
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

function moveLayerBefore(map: MapLibreMap, layerId: string, beforeId: string) {
  if (!map.getLayer(layerId) || !map.getLayer(beforeId)) {
    return;
  }

  map.moveLayer(layerId, beforeId);
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

function ensureGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJsonSourceData,
  options: Partial<{
    cluster: boolean;
    clusterMaxZoom: number;
    clusterRadius: number;
    clusterProperties: Record<string, unknown>;
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
  sizePx: number,
  draw: (context: CanvasRenderingContext2D, canvasSize: number) => void
) {
  const pixelRatio = 2;
  const canvas = document.createElement("canvas");
  canvas.width = sizePx * pixelRatio;
  canvas.height = sizePx * pixelRatio;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.scale(pixelRatio, pixelRatio);
  draw(context, sizePx);

  return {
    image: context.getImageData(0, 0, canvas.width, canvas.height),
    pixelRatio
  };
}

function createQuestionBadgeImage() {
  return createCanvasImage(14, (context, size) => {
    const center = size / 2;
    context.fillStyle = "#FFFFFF";
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(center, center, 5.6, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#5F6368";
    context.font = '700 8.5px system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("?", center, center + 0.5);
  });
}

function createTransparentCollisionImage(sizePx: number) {
  return createCanvasImage(sizePx, (context, size) => {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, size, size);
  });
}

function createUncertainHatchImage() {
  return createCanvasImage(8, (context, size) => {
    context.clearRect(0, 0, size, size);
    context.strokeStyle = ANCIENT_LAYER_STYLE.uncertain.hatchColor;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, size);
    context.lineTo(size, 0);
    context.stroke();
    context.beginPath();
    context.moveTo(-2, size);
    context.lineTo(2, size - 4);
    context.stroke();
    context.beginPath();
    context.moveTo(size - 2, 2);
    context.lineTo(size + 2, -2);
    context.stroke();
  });
}

function createCircularSdfImage({
  canvasSizePx,
  radiusPx
}: {
  canvasSizePx: number;
  radiusPx: number;
}) {
  return createCanvasImage(canvasSizePx, (context, size) => {
    const center = size / 2;
    context.clearRect(0, 0, size, size);
    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.arc(center, center, radiusPx, 0, Math.PI * 2);
    context.fill();
  });
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

  return createCanvasImage(canvasSize, (context) => {
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

function ensureQuestionBadgeImage(map: MapLibreMap) {
  if (map.hasImage(questionBadgeImageId)) {
    return;
  }

  const image = createQuestionBadgeImage();
  if (!image) {
    return;
  }

  map.addImage(questionBadgeImageId, image.image, { pixelRatio: image.pixelRatio });
}

function ensureCollisionImages(map: MapLibreMap) {
  if (!map.hasImage(pinCollisionImageId)) {
    const image = createTransparentCollisionImage(PIN_COLLISION_IMAGE_SIZE);
    if (image) {
      map.addImage(pinCollisionImageId, image.image, { pixelRatio: image.pixelRatio });
    }
  }

  if (!map.hasImage(clusterCollisionImageId)) {
    const image = createTransparentCollisionImage(CLUSTER_COLLISION_IMAGE_SIZE);
    if (image) {
      map.addImage(clusterCollisionImageId, image.image, { pixelRatio: image.pixelRatio });
    }
  }

  if (!map.hasImage(cityPinSymbolImageId)) {
    const image = createCircularSdfImage({
      canvasSizePx: 24,
      radiusPx: standardPinBaseRadiusPx
    });
    if (image) {
      map.addImage(cityPinSymbolImageId, image.image, { pixelRatio: image.pixelRatio, sdf: true });
    }
  }

  if (!map.hasImage(clusterSymbolImageId)) {
    const image = createCircularSdfImage({
      canvasSizePx: 40,
      radiusPx: standardClusterBaseRadiusPx
    });
    if (image) {
      map.addImage(clusterSymbolImageId, image.image, { pixelRatio: image.pixelRatio, sdf: true });
    }
  }
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

function ensureUncertainHatchImage(map: MapLibreMap) {
  if (map.hasImage(uncertainHatchImageId)) {
    return;
  }

  const image = createUncertainHatchImage();
  if (image) {
    map.addImage(uncertainHatchImageId, image.image, { pixelRatio: image.pixelRatio });
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
      .map((label) => {
        const holderAssignment = stopPayload.areas.find((area) => area.areaId === label.areaId);
        const labelText = label.labelText;
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
          properties: {
            holderId: label.holderId,
            holderLocationId: label.locationId,
            labelText,
            minZoom: label.minZoom,
            clickable: typeof label.locationId === "string" && label.locationId.length > 0,
            tooltipText: `${label.name} · ${holderKindLabel(label.kind, label.holderId)}${rulerText}${yearRangePart}`
          },
          geometry: {
            type: "Point" as const,
            coordinates: label.labelPoint
          }
        };
      })
  };
}

function ensureMapLayers(
  map: MapLibreMap,
  majorPlaceByRank: Map<number, MajorPlaceReference>
) {
  ensureCollisionImages(map);
  ensureUncertainHatchImage(map);

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
        "fill-pattern": uncertainHatchImageId,
        "fill-opacity": 0.55
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
        [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 0]]
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
        [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 0]]
      ]),
      paint: {
        "line-color": ANCIENT_LAYER_STYLE.border.disputedColor,
        "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1, 5, 1.2, 12, 3],
        "line-dasharray": [1, 2]
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
        "text-color": ANCIENT_LAYER_STYLE.coastline.labelColor,
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
        "text-font": ["Noto Sans Bold"],
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
      filter: toLayerFilter([
        "all",
        ["==", ["get", "clickable"], true],
        [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 4]]
      ]),
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
      filter: toLayerFilter([
        "all",
        ["==", ["get", "clickable"], true],
        [">=", ["zoom"], ["coalesce", ["get", "minZoom"], 4]]
      ]),
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
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerClusterCircleId)) {
    map.addLayer({
      id: layerClusterCircleId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: CLUSTER_MAX_ZOOM + 1,
      layout: {
        "icon-image": clusterSymbolImageId,
        "icon-size": [
          "step",
          ["get", "point_count"],
          standardClusterRadiusByPointCount.default / standardClusterBaseRadiusPx,
          8,
          standardClusterRadiusByPointCount.medium / standardClusterBaseRadiusPx,
          20,
          standardClusterRadiusByPointCount.large / standardClusterBaseRadiusPx
        ],
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        "text-optional": false
      },
      paint: {
        "icon-color": ["step", ["zoom"], "#9AA0A6", standardMutedThresholdZoom, "#C5221F"],
        "icon-halo-color": "#FFFFFF",
        "icon-halo-width": 3,
        "text-color": "#FFFFFF"
      }
    });
  }

  if (!map.getLayer(layerCityPinShadowId)) {
    map.addLayer({
      id: layerCityPinShadowId,
      source: sourceClusteredCityPinsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        [
          "any",
          ["==", ["get", "isSelectedPlace"], true],
          ["==", ["get", "isHighlightedPlace"], true]
        ]
      ]),
      paint: {
        "circle-radius": 12,
        "circle-color": "rgba(60,64,67,0.42)",
        "circle-translate": [0, 2],
        "circle-translate-anchor": "viewport",
        "circle-blur": 0.2
      }
    });
  }

  if (!map.getLayer(layerCityPinId)) {
    map.addLayer({
      id: layerCityPinId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["all", ["!", ["has", "point_count"]], basePinVisibilityFilter]),
      layout: {
        "icon-image": cityPinSymbolImageId,
        "icon-size": [
          "step",
          ["zoom"],
          [
            "case",
            ["==", ["get", "isSelectedPlace"], true],
            standardPinSelectedRadiusPx / standardPinBaseRadiusPx,
            ["==", ["get", "isHighlightedPlace"], true],
            standardPinHighlightedRadiusPx / standardPinBaseRadiusPx,
            standardPinOverviewDefaultRadiusPx / standardPinBaseRadiusPx
          ],
          standardMutedThresholdZoom,
          [
            "case",
            ["==", ["get", "isSelectedPlace"], true],
            standardPinSelectedRadiusPx / standardPinBaseRadiusPx,
            ["==", ["get", "isHighlightedPlace"], true],
            standardPinHighlightedRadiusPx / standardPinBaseRadiusPx,
            1
          ]
        ],
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "symbol-sort-key": ["get", "labelPriority"]
      },
      paint: {
        "icon-color": [
          "step",
          ["zoom"],
          "#9AA0A6",
          standardMutedThresholdZoom,
          ["get", "pinColor"]
        ],
        "icon-halo-color": "#FFFFFF",
        "icon-halo-width": ["step", ["zoom"], 1.5, standardMutedThresholdZoom, 2]
      }
    });
  }

  if (!map.getLayer(layerMajorClusterCircleId)) {
    map.addLayer({
      id: layerMajorClusterCircleId,
      source: sourceMajorCityPinsId,
      type: "circle",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: majorClusterMaxZoom + 1,
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 9, 8, 10, 20, 11],
        "circle-color": toExpression(createMajorClusterTopColorMatchExpression(majorPlaceByRank)),
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 2
      }
    });
  }

  if (!map.getLayer(layerMajorPinShadowId)) {
    map.addLayer({
      id: layerMajorPinShadowId,
      source: sourceMajorCityPinsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        [
          "any",
          ["==", ["get", "isSelectedPlace"], true],
          ["==", ["get", "isHighlightedPlace"], true]
        ]
      ]),
      paint: {
        "circle-radius": 12,
        "circle-color": "rgba(60,64,67,0.42)",
        "circle-translate": [0, 2],
        "circle-translate-anchor": "viewport",
        "circle-blur": 0.2
      }
    });
  }

  if (!map.getLayer(layerMajorPinId)) {
    map.addLayer({
      id: layerMajorPinId,
      source: sourceMajorCityPinsId,
      type: "circle",
      filter: toLayerFilter(["all", ["!", ["has", "point_count"]], basePinVisibilityFilter]),
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "isSelectedPlace"], true],
          10.5,
          ["==", ["get", "isHighlightedPlace"], true],
          9.5,
          8
        ],
        "circle-color": ["get", "pinColor"],
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 2
      }
    });
  }

  if (!map.getLayer(layerSitePinShadowId)) {
    map.addLayer({
      id: layerSitePinShadowId,
      source: sourceSitePinsId,
      type: "circle",
      filter: toLayerFilter([
        "all",
        basePinVisibilityFilter,
        [
          "any",
          ["==", ["get", "isSelectedPlace"], true],
          ["==", ["get", "isHighlightedPlace"], true]
        ]
      ]),
      paint: {
        "circle-radius": 12,
        "circle-color": "rgba(60,64,67,0.42)",
        "circle-translate": [0, 2],
        "circle-translate-anchor": "viewport",
        "circle-blur": 0.2
      }
    });
  }

  if (!map.getLayer(layerSitePinId)) {
    map.addLayer({
      id: layerSitePinId,
      source: sourceSitePinsId,
      type: "circle",
      filter: toLayerFilter(basePinVisibilityFilter),
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "isSelectedPlace"], true],
          10.5,
          ["==", ["get", "isHighlightedPlace"], true],
          9.5,
          8
        ],
        "circle-color": ["get", "pinColor"],
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 2
      }
    });
  }

  if (!map.getLayer(layerQuestionBadgeId)) {
    map.addLayer({
      id: layerQuestionBadgeId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        ["==", ["get", "hasMultipleCandidates"], true],
        ["==", ["get", "isDisputed"], true]
      ]),
      layout: {
        ...QUESTION_BADGE_LAYOUT,
        "icon-image": questionBadgeImageId
      }
    });
  }

  if (!map.getLayer(layerMajorQuestionBadgeId)) {
    map.addLayer({
      id: layerMajorQuestionBadgeId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        ["==", ["get", "hasMultipleCandidates"], true],
        ["==", ["get", "isDisputed"], true]
      ]),
      layout: {
        ...QUESTION_BADGE_LAYOUT,
        "icon-image": questionBadgeImageId
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
        "icon-ignore-placement": true
      }
    });
  }

  if (!map.getLayer(layerMajorClusterCollisionMaskId)) {
    map.addLayer({
      id: layerMajorClusterCollisionMaskId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: majorClusterMaxZoom + 1,
      layout: {
        "icon-size": [
          "step",
          ["get", "point_count"],
          0.32,
          8,
          0.34,
          20,
          0.36
        ],
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": false,
        "icon-image": clusterCollisionImageId
      },
      paint: {
        "icon-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerMajorPinCollisionMaskId)) {
    map.addLayer({
      id: layerMajorPinCollisionMaskId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["all", ["!", ["has", "point_count"]], basePinVisibilityFilter]),
      layout: {
        ...PIN_COLLISION_LAYOUT,
        "icon-image": pinCollisionImageId
      },
      paint: {
        "icon-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerSitePinCollisionMaskId)) {
    map.addLayer({
      id: layerSitePinCollisionMaskId,
      source: sourceSitePinsId,
      type: "symbol",
      filter: toLayerFilter(basePinVisibilityFilter),
      layout: {
        ...PIN_COLLISION_LAYOUT,
        "icon-image": pinCollisionImageId
      },
      paint: {
        "icon-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerCandidatePinCollisionMaskId)) {
    map.addLayer({
      id: layerCandidatePinCollisionMaskId,
      source: sourceCandidatePinsId,
      type: "symbol",
      filter: toLayerFilter(candidateVisibilityFilter),
      layout: {
        ...PIN_COLLISION_LAYOUT,
        "icon-image": pinCollisionImageId
      },
      paint: {
        "icon-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerPinLabelId)) {
    map.addLayer({
      id: layerPinLabelId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        standardPinUnmutedZoomFilter,
        ["!=", ["get", "labelText"], null],
        ["!=", ["get", "isSelectedPlace"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-offset": [1.2, 0],
        "text-anchor": "left",
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3
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
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#5F6368",
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
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#5F6368",
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
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#5F6368",
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
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#5F6368",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
      }
    });
  }

  if (!map.getLayer(layerMajorClusterLabelId)) {
    map.addLayer({
      id: layerMajorClusterLabelId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["has", "point_count"],
        createMajorClusterTopSideFilter(majorPlaceByRank, "right")
      ]),
      maxzoom: majorClusterMaxZoom + 1,
      layout: {
        "text-field": toExpression(createMajorClusterLabelExpression(majorPlaceByRank)),
        "text-font": ["Noto Sans Bold"],
        "text-size": 11,
        "text-variable-anchor": ["left", "top", "right"] as [
          "left",
          "top",
          "right"
        ],
        "text-radial-offset": 0.6,
        "text-justify": "auto" as const,
        "symbol-sort-key": ["get", "minImportanceRank"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3
      }
    });
  }

  if (!map.getLayer(layerMajorClusterLabelLeftId)) {
    map.addLayer({
      id: layerMajorClusterLabelLeftId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["has", "point_count"],
        createMajorClusterTopSideFilter(majorPlaceByRank, "left")
      ]),
      maxzoom: majorClusterMaxZoom + 1,
      layout: {
        "text-field": toExpression(createMajorClusterLabelExpression(majorPlaceByRank)),
        "text-font": ["Noto Sans Bold"],
        "text-size": 11,
        "text-variable-anchor": ["top"] as ["top"],
        "text-radial-offset": 0.8,
        "text-justify": "auto" as const,
        "symbol-sort-key": ["get", "minImportanceRank"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3
      }
    });
  }

  if (!map.getLayer(layerMajorPinLabelId)) {
    map.addLayer({
      id: layerMajorPinLabelId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["!=", ["get", "isSelectedPlace"], true],
        ["!=", ["get", "majorLabelSide"], "left"]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        ...majorPinLabelLayout,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3
      }
    });
  }

  if (!map.getLayer(layerMajorPinLabelLeftId)) {
    map.addLayer({
      id: layerMajorPinLabelLeftId,
      source: sourceMajorCityPinsId,
      type: "symbol",
      filter: toLayerFilter([
        "all",
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["!=", ["get", "isSelectedPlace"], true],
        ["==", ["get", "majorLabelSide"], "left"]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        ...majorPinLabelLeftLayout,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "text-optional": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.3
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
        "text-font": areaLabelTextFontExpression,
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        ...areaLabelPointLayout
      },
      paint: {
        "text-color": "#202124",
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
        ["!", ["has", "point_count"]],
        basePinVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["==", ["get", "isSelectedPlace"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-offset": [1.2, 0],
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "#202124",
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
        basePinVisibilityFilter,
        ["!=", ["get", "labelText"], null],
        ["==", ["get", "isSelectedPlace"], true]
      ]),
      layout: {
        "text-field": ["get", "labelText"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-offset": [1.2, 0],
        "text-anchor": "left",
        "text-allow-overlap": true,
        "text-ignore-placement": true
      },
      paint: {
        "text-color": "#202124",
        "text-halo-color": "rgba(255,255,255,0.95)",
        "text-halo-width": 1.4
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

  const areaLayersNeedingStandardClusterClearance = [
    layerAncientHolderLabelId,
    layerAncientHolderLabelClickableId,
    layerAncientHolderLabelClickTargetId,
    layerAreaLabelOverviewId,
    layerAreaLabelId,
    layerMajorAreaLabelOverviewId,
    layerMajorAreaLabelId
  ] as const;

  for (const areaLayerId of areaLayersNeedingStandardClusterClearance) {
    moveLayerBefore(map, areaLayerId, layerMajorClusterCollisionMaskId);
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

function toVisibleEntry(
  feature: MapGeoJSONFeature,
  majorPlaceByRank: Map<number, MajorPlaceReference>
): VisibleListEntry | null {
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
        interactionRank: 1
      };
    }
    return null;
  }

  if (clusterId !== null && pointCount !== null) {
    if (isMajorClusterLayerId(layerId)) {
      const minImportanceRank = asNumber(properties.minImportanceRank);
      if (minImportanceRank === null) {
        return null;
      }

      const topPlace = majorPlaceByRank.get(minImportanceRank);
      if (!topPlace) {
        return null;
      }

      const nearbyCount = Math.max(0, pointCount - 1);
      const nearbyWord = nearbyCount === 1 ? "place" : "places";
      return {
        id: `major-cluster:${clusterId}`,
        kind: "major-cluster",
        sourceId: sourceMajorCityPinsId,
        coordinates,
        accessibleName: `${topPlace.placeName} and ${nearbyCount} nearby ${nearbyWord}`,
        tooltipText: `${topPlace.placeName} +${nearbyCount}`,
        clusterId,
        pointCount,
        topPlaceName: topPlace.placeName,
        selection: {
          placeId: topPlace.placeId,
          candidateIndex: null
        },
        interactionRank: 0
      };
    }

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
    interactionRank
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
  timelineOverlayInset,
  isSmallScreen,
  mapMode,
  selectedTimelineStopId,
  ancientTimeline,
  ancientLayerRetryToken,
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
  const openingOverviewAppliedRef = useRef(false);
  const panelInsetRef = useRef(0);
  const bottomInsetRef = useRef(0);
  const selectionRef = useRef<PlaceSelection | null>(null);
  const mapModeRef = useRef<MapDisplayMode>(mapMode);
  const mapModeEffectInitializedRef = useRef(false);
  const majorPlaceByRankRef = useRef<Map<number, MajorPlaceReference>>(new Map());
  const majorClusterTooltipByEntryIdRef = useRef(new Map<string, string>());
  const activateVisibleEntryRef = useRef<(entry: VisibleListEntry) => void>(() => undefined);
  const handleTooltipAtPointRef = useRef<(point: PointLike) => void>(() => undefined);
  const refreshVisibleEntryStateRef = useRef<() => void>(() => undefined);
  const scheduleVisibleEntryRefreshRef = useRef<() => void>(() => undefined);
  const syncSourcesAndLayersRef = useRef<() => void>(() => undefined);
  const updateScaleBarRef = useRef<() => void>(() => undefined);
  const stopPayloadRequestIdsRef = useRef(new Set<string>());
  const stopPrefetchScheduledRef = useRef(false);
  const failedStopIdsRef = useRef(new Set<string>());
  const selectedTimelineStopIdRef = useRef<string | null>(selectedTimelineStopId);

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
  const placeById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const renderData = useMemo(() => {
    return buildPlaceRenderData(places, selection, highlightedPlaceId, {
      includeAreaLabels: mapMode === "ancient",
      pinLabelSource
    });
  }, [highlightedPlaceId, mapMode, pinLabelSource, places, selection]);
  const [ancientShapes, setAncientShapes] = useState<AncientShapesPayload | null>(null);
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
  const effectiveRenderData = useMemo(() => {
    if (mapMode !== "ancient" || !hasAncientTimeline) {
      return renderData;
    }

    const linkedLocationIds = linkedTimelineLocationIds(ancientTimeline?.entities);

    return {
      ...renderData,
      areaLabels: filterAreaLabelsForAncientMap({
        areaLabels: renderData.areaLabels,
        linkedLocationIds
      })
    };
  }, [ancientTimeline?.entities, hasAncientTimeline, mapMode, renderData]);
  const majorPlaceByRank = useMemo(
    () => buildMajorPlaceReferenceByRank(effectiveRenderData),
    [effectiveRenderData]
  );
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
    return buildAncientHolderLabelFeatures(
      selectedAncientStopPayload,
      timelineRangeEndYear
    );
  }, [ancientTimeline, selectedAncientStopPayload]);

  const [basemapState, setBasemapState] = useState(() => basemapController.getState());
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [visibleEntries, setVisibleEntries] = useState<VisibleListEntry[]>([]);
  const [visibleEntryOverflow, setVisibleEntryOverflow] = useState(false);
  const [ancientLayerLoadState, setAncientLayerLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const ancientLayerLoadStateRef = useRef<"idle" | "loading" | "ready" | "error">("idle");
  const previousAncientLayerRetryTokenRef = useRef(ancientLayerRetryToken);
  const resetAncientLayerData = useCallback((nextState: "idle" | "loading") => {
    setAncientShapes(null);
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
    majorPlaceByRankRef.current = majorPlaceByRank;
  }, [majorPlaceByRank]);

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
      .then(([shapesPayload, roadsPayload, coastlinePayload, empireEdgePayload]) => {
        if (cancelled) {
          return;
        }

        setAncientShapes(shapesPayload);
        setAncientRoads(roadsPayload);
        setAncientCoastline(coastlinePayload);
        setAncientEmpireEdge(empireEdgePayload);
      })
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

  useEffect(() => {
    majorClusterTooltipByEntryIdRef.current.clear();
  }, [renderData]);

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

    map.getCanvas().style.cursor = isInteractiveTarget ? "pointer" : "";
    mapCanvasHasPointerCursorRef.current = isInteractiveTarget;
  }, []);

  const resolveInteractiveEntryAtPoint = useCallback((point: PointLike) => {
    const map = mapRef.current;
    if (!map) {
      return null;
    }

    const majorPlaceByRankForView = majorPlaceByRankRef.current;

    const pointer = asScreenPoint(point);
    if (!pointer) {
      return null;
    }

    const features = map.queryRenderedFeatures(queryBoxAroundPoint(pointer, interactiveHitPaddingPx), {
      layers: [...interactiveLayerIds]
    });
    const entries = deduplicateVisibleEntries(
      features
        .map((feature) => toVisibleEntry(feature, majorPlaceByRankForView))
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
  }, []);

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
        .map((feature) => toVisibleEntry(feature, majorPlaceByRankRef.current))
        .filter((entry): entry is VisibleListEntry => entry !== null)
    );
    deduplicated.sort((left, right) => compareByReadingOrder(map, left, right));

    const overflow = deduplicated.length > MAX_VISIBLE_PLACE_LIST_ENTRIES;
    setVisibleEntryOverflow(overflow);
    setVisibleEntries(deduplicated.slice(0, MAX_VISIBLE_PLACE_LIST_ENTRIES));
  }, []);

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

  const syncSourcesAndLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    ensureGeoJsonSource(map, sourceMajorCityPinsId, effectiveRenderData.majorCityPins, {
      cluster: true,
      clusterMaxZoom: majorClusterMaxZoom,
      clusterRadius: majorClusterRadiusPx,
      clusterProperties: {
        minImportanceRank: ["min", ["get", "importanceRank"]]
      }
    });
    ensureGeoJsonSource(map, sourceClusteredCityPinsId, effectiveRenderData.clusteredCityPins, {
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: standardClusterRadiusPx
    });
    ensureGeoJsonSource(map, sourceSitePinsId, effectiveRenderData.sitePins);
    ensureGeoJsonSource(map, sourceCandidatePinsId, effectiveRenderData.candidatePins);
    ensureGeoJsonSource(map, sourceAreaLabelsId, effectiveRenderData.areaLabels);
    ensureGeoJsonSource(map, sourceKeyboardFocusId, createEmptyFeatureCollection());
    ensureGeoJsonSource(map, sourceAncientAreasId, ancientAreaFeatures);
    ensureGeoJsonSource(map, sourceAncientBordersId, ancientBorderFeatures);
    ensureGeoJsonSource(map, sourceAncientEmpireEdgeId, ancientEmpireEdgeFeatures);
    ensureGeoJsonSource(map, sourceAncientRoadsId, ancientRoads);
    ensureGeoJsonSource(map, sourceAncientCoastlineId, ancientCoastline);
    ensureGeoJsonSource(map, sourceAncientHolderLabelsId, ancientHolderLabelFeatures);

    ensureQuestionBadgeImage(map);
    ensureCandidateImages(map, effectiveRenderData);
    ensureMapLayers(map, majorPlaceByRank);
  }, [
    ancientAreaFeatures,
    ancientBorderFeatures,
    ancientCoastline,
    ancientEmpireEdgeFeatures,
    ancientHolderLabelFeatures,
    ancientRoads,
    majorPlaceByRank,
    effectiveRenderData
  ]);

  const resolveMajorClusterTooltipText = useCallback(
    async (entry: VisibleMajorClusterEntry) => {
      const cached = majorClusterTooltipByEntryIdRef.current.get(entry.id);
      if (cached) {
        return cached;
      }

      const map = mapRef.current;
      if (!map) {
        return entry.tooltipText;
      }

      const source = map.getSource(entry.sourceId);
      if (!isGeoJsonSource(source)) {
        return entry.tooltipText;
      }

      try {
        const leaves = await source.getClusterLeaves(entry.clusterId, entry.pointCount, 0);
        const names = leaves
          .map((feature) => {
            const properties = asObject(feature.properties);
            if (!properties) {
              return null;
            }

            const placeName = asString(properties.placeName);
            const importanceRank = asNumber(properties.importanceRank);
            if (!placeName || importanceRank === null) {
              return null;
            }

            return {
              placeName,
              importanceRank
            };
          })
          .filter(
            (value): value is { placeName: string; importanceRank: number } => value !== null
          )
          .sort((left, right) => left.importanceRank - right.importanceRank)
          .map((value) => value.placeName);

        const tooltipText = names.length > 0 ? names.join(", ") : entry.tooltipText;
        majorClusterTooltipByEntryIdRef.current.set(entry.id, tooltipText);
        return tooltipText;
      } catch (error) {
        console.error(
          `Failed to resolve members for major cluster ${entry.clusterId}:`,
          error
        );
        return entry.tooltipText;
      }
    },
    []
  );

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
        if (!pointer || mapModeRef.current !== "ancient") {
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }

        const infoFeature = map
          .queryRenderedFeatures(queryBoxAroundPoint(pointer, interactiveHitPaddingPx), {
            layers: [
              layerAncientHolderLabelClickableId,
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
          setInteractiveCursor(false);
          hideTooltip();
          return;
        }

        const fallbackLngLat = map.unproject([pointer.x, pointer.y]);
        const infoCoordinates =
          asCoordinates(infoFeature) ??
          ([fallbackLngLat.lng, fallbackLngLat.lat] as Coordinates);
        if (!infoCoordinates) {
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
        return;
      }

      setInteractiveCursor(true);
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

      if (entry.kind === "major-cluster") {
        void resolveMajorClusterTooltipText(entry).then((tooltipText) => {
          if (activeTooltipEntryIdRef.current !== entry.id || !tooltipRef.current) {
            return;
          }

          tooltipRef.current.textContent = tooltipText;
        });
      }
    },
    [hideTooltip, resolveInteractiveEntryAtPoint, resolveMajorClusterTooltipText, setInteractiveCursor]
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
    (entry: VisibleListEntry) => {
      if (entry.kind === "major-cluster") {
        onSelectPlace(entry.selection);
        return;
      }

      if (entry.kind === "cluster") {
        void zoomToCluster(entry);
        return;
      }

      onSelectPlace(entry.selection);
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

      const focusRadius = entry.kind === "cluster" || entry.kind === "major-cluster" ? 16 : 13;
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
    syncSourcesAndLayersRef.current = syncSourcesAndLayers;
  }, [syncSourcesAndLayers]);

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

  const syncAttributionControl = useCallback((map: MapLibreMap, mode: BasemapMode, nextMapMode: MapDisplayMode) => {
    const attributionKey = `${mode}:${nextMapMode}`;
    if (attributionModeRef.current === attributionKey && attributionControlRef.current) {
      return;
    }

    if (attributionControlRef.current) {
      map.removeControl(attributionControlRef.current);
      attributionControlRef.current = null;
    }

    const control = new AttributionControl({
      compact: true,
      customAttribution: getAttributionMarkup(mode, nextMapMode)
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
      syncAttributionControl(map, "fallback", nextMapMode);
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
    const map = new MapLibreMapClass({
      container: mapContainerRef.current,
      style: getStyleUrl(initialMode, mapModeRef.current),
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
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
    syncAttributionControl(map, initialMode, mapModeRef.current);

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
      const nextMapMode = mapModeRef.current;
      syncAttributionControl(map, currentMode, nextMapMode);
      configureZoomGestures(map, effectiveRuntimeTuning);
      applyBasemapLayerVariants(map, currentMode, effectiveRuntimeTuning);
      if (currentMode === "main") {
        scheduleMainSourceLoadTimeout(map);
      } else {
        clearMainSourceLoadTimeout();
      }
      map.getCanvas().tabIndex = -1;
      syncSourcesAndLayersRef.current();
      applyMapModeOverlayVisibility(map, nextMapMode, hasAncientTimeline);
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

    const handleMapClick = (event: { point: PointLike }) => {
      const entry = resolveInteractiveEntryAtPoint(event.point);
      if (!entry) {
        return;
      }

      activateVisibleEntryRef.current(entry);
    };
    const handleMouseMove = (event: { point: PointLike }) => {
      scheduleTooltipUpdate(event.point);
    };
    const handleMouseOut = () => {
      cancelScheduledTooltipUpdate();
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
      setInteractiveCursor(false);
      if (attributionControlRef.current) {
        map.removeControl(attributionControlRef.current);
        attributionControlRef.current = null;
      }
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
    clearMainSourceLoadTimeout,
    hasAncientTimeline,
    hideTooltip,
    resolveInteractiveEntryAtPoint,
    scheduleScaleBarUpdate,
    scheduleMainSourceLoadTimeout,
    setInteractiveCursor,
    switchToFallback,
    syncAttributionControl,
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
    syncAttributionControl(map, basemapMode, mapMode);
    map.setStyle(getStyleUrl(basemapMode, mapMode));
  }, [basemapController, mapMode, syncAttributionControl]);

  useEffect(() => {
    if (!styleReadyRef.current) {
      return;
    }

    syncSourcesAndLayers();
    const map = mapRef.current;
    if (map) {
      applyMapModeOverlayVisibility(map, mapModeRef.current, hasAncientTimeline);
    }
    refreshVisibleEntryState();
  }, [hasAncientTimeline, refreshVisibleEntryState, syncSourcesAndLayers]);

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

    const selectionKey = `${selection.placeId}:${selection.candidateIndex ?? ""}:${panelInset}:${bottomInset}`;
    if (selectionKey === previousFocusRequestRef.current) {
      return;
    }

    const place = placeById.get(selection.placeId);
    if (!place) {
      return;
    }

    previousFocusRequestRef.current = selectionKey;
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
    runtimeTuning.flyToDurationMs,
    selection
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
  const compactAttributionBottomWithTimelineOffset = Math.max(
    compactAttributionBottomOffset,
    Math.max(0, timelineOverlayInset)
  );
  const compactAttributionRightOffset = 72;
  const visiblePlacesList = (
    <div
      aria-label="Visible places on map"
      className="ibm-hidden-visible-places"
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
      {visibleEntries.map((entry) => (
        <button
          key={entry.id}
          aria-label={entry.accessibleName}
          data-place-entry-id={entry.id}
          onClick={() => activateVisibleEntry(entry)}
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
