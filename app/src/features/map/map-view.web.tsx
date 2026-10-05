import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMapClass,
  setWorkerUrl,
  type ErrorEvent,
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
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  FALLBACK_BASEMAP_ATTRIBUTION,
  FALLBACK_BASEMAP_STYLE_URL,
  MAP_WORKER_URL,
  MAIN_BASEMAP_ATTRIBUTION,
  MAX_MAP_ZOOM,
  MAIN_BASEMAP_STYLE_URL
} from "./constants";
import {
  BasemapFallbackController,
  MainSourceLoadTimeoutController,
  resolveInitialBasemapMode,
  type BasemapMode
} from "./basemap-fallback";
import { getScaleControlLeftOffset } from "./map-layout";
import {
  MAX_VISIBLE_PLACE_LIST_ENTRIES,
  buildPlaceRenderData,
  type PlaceRenderData
} from "./map-render-data";
import {
  AREA_LABEL_OFFSET_LAYOUT,
  CLUSTER_COLLISION_IMAGE_SIZE,
  CLUSTER_COUNT_LAYOUT,
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
  pickNearestCandidate,
  type ScreenPoint as HitScreenPoint
} from "./interactive-hit";
import type { MapViewProps } from "./map-view.types";
import type { Coordinates, PlaceIndexRecord, PlaceSelection } from "./types";

setWorkerUrl(MAP_WORKER_URL);
const configuredBasemapMode = resolveInitialBasemapMode(process.env.EXPO_PUBLIC_BASEMAP);

const sourceClusteredCityPinsId = "ibm-clustered-city-pins";
const sourceSitePinsId = "ibm-site-pins";
const sourceCandidatePinsId = "ibm-candidate-pins";
const sourceAreaLabelsId = "ibm-area-labels";
const sourceKeyboardFocusId = "ibm-keyboard-focus";

const layerClusterCircleId = "ibm-cluster-circle";
const layerClusterCountId = "ibm-cluster-count";
const layerCityPinShadowId = "ibm-city-pin-shadow";
const layerCityPinId = "ibm-city-pin";
const layerSitePinShadowId = "ibm-site-pin-shadow";
const layerSitePinId = "ibm-site-pin";
const layerQuestionBadgeId = "ibm-question-badge";
const layerCandidatePinId = "ibm-candidate-pin";
const layerClusterCollisionMaskId = "ibm-cluster-collision-mask";
const layerCityPinCollisionMaskId = "ibm-city-pin-collision-mask";
const layerSitePinCollisionMaskId = "ibm-site-pin-collision-mask";
const layerCandidatePinCollisionMaskId = "ibm-candidate-pin-collision-mask";
const layerPinLabelId = "ibm-pin-label";
const layerAreaLabelOverviewId = "ibm-area-label-overview";
const layerAreaLabelId = "ibm-area-label";
const layerKeyboardFocusId = "ibm-keyboard-focus";

const questionBadgeImageId = "ibm-question-badge-image";
const pinCollisionImageId = "ibm-pin-collision-image";
const clusterCollisionImageId = "ibm-cluster-collision-image";
const mapTestHookKey = "__ibmMapForTests";
const visibleEntryRefreshHookKey = "__ibmRefreshVisibleEntriesForTests";
const mainSourceLoadTimeoutMs = 8_000;
const gestureReleaseDelayMs = 1_000;
const mapLabelPaddingTop = 80;
const mapLabelPaddingEdge = 16;
const focusPaddingTop = 96;
const interactiveHitPaddingPx = 8;
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
  layerClusterCircleId,
  layerClusterCountId,
  layerQuestionBadgeId,
  layerCandidatePinId,
  layerSitePinId,
  layerCityPinId,
  layerAreaLabelOverviewId,
  layerAreaLabelId
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

const areaLabelVisibilityFilter = [
  "all",
  [">=", ["zoom"], ["get", "minZoom"]],
  ["<", ["zoom"], ["get", "maxZoom"]]
];
const areaLabelVariableAnchorMinZoom = 6;
const areaLabelOverviewFilter = [
  "all",
  areaLabelVisibilityFilter,
  ["<", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelVariableAnchorFilter = [
  "all",
  areaLabelVisibilityFilter,
  [">=", ["zoom"], areaLabelVariableAnchorMinZoom]
];
const areaLabelOverviewOffsetLayout = {
  "text-variable-anchor": ["top", "bottom", "left", "right"] as [
    "top",
    "bottom",
    "left",
    "right"
  ],
  "text-radial-offset": 3.5,
  "text-justify": "auto" as const
};

type RuntimeTuning = ReturnType<typeof resolveMapRuntimeTuning>;
interface WebGlRendererInfo {
  vendor: string | null;
  renderer: string | null;
  unmaskedVendor: string | null;
  unmaskedRenderer: string | null;
  isSoftwareRenderer: boolean;
}

type GeoJsonSourceData = Parameters<GeoJSONSource["setData"]>[0];
type LayerFilter = FilterSpecification;

function toLayerFilter(filter: unknown): LayerFilter {
  return filter as LayerFilter;
}

interface VisibleClusterEntry {
  id: string;
  kind: "cluster";
  coordinates: Coordinates;
  accessibleName: string;
  tooltipText: string;
  clusterId: number;
  pointCount: number;
}

interface VisiblePlaceEntry {
  id: string;
  kind: "place";
  coordinates: Coordinates;
  accessibleName: string;
  tooltipText: string;
  selection: PlaceSelection;
}

type VisibleListEntry = VisibleClusterEntry | VisiblePlaceEntry;

function getStyleUrl(mode: BasemapMode) {
  if (mode === "fallback") {
    return FALLBACK_BASEMAP_STYLE_URL;
  }

  return MAIN_BASEMAP_STYLE_URL;
}

function getAttributionMarkup(mode: BasemapMode) {
  return mode === "fallback" ? FALLBACK_BASEMAP_ATTRIBUTION : MAIN_BASEMAP_ATTRIBUTION;
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
    padding: {
      top: focusPaddingTop,
      right: 64,
      bottom: 64,
      left: leftInset + 64
    },
    maxZoom,
    duration: reducedMotion ? 0 : durationMs
  });
}

function focusSelection(
  map: MapLibreMap,
  place: PlaceIndexRecord,
  selection: PlaceSelection,
  leftInset: number,
  durationMs: number
) {
  const focusPlan = planSelectionFocus(place, selection);
  if (!focusPlan) {
    return;
  }

  if (focusPlan.kind === "fit-bounds") {
    fitBoundsForPlace(map, focusPlan.coordinates, focusPlan.zoom, leftInset, durationMs);
    return;
  }

  flyOrJump(
    map,
    {
      center: focusPlan.coordinates,
      zoom: focusPlan.zoom,
      padding: {
        top: focusPaddingTop,
        right: 64,
        bottom: 64,
        left: leftInset + 64
      }
    },
    durationMs,
    prefersReducedMotion()
  );
}

function getMapLabelPadding(leftInset: number) {
  return {
    top: mapLabelPaddingTop,
    right: mapLabelPaddingEdge,
    bottom: mapLabelPaddingEdge,
    left: leftInset + mapLabelPaddingEdge
  };
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

function ensureGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJsonSourceData,
  options: Partial<{
    cluster: boolean;
    clusterMaxZoom: number;
    clusterRadius: number;
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

function ensureMapLayers(map: MapLibreMap) {
  ensureCollisionImages(map);

  if (!map.getLayer(layerClusterCircleId)) {
    map.addLayer({
      id: layerClusterCircleId,
      source: sourceClusteredCityPinsId,
      type: "circle",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: CLUSTER_MAX_ZOOM + 1,
      paint: {
        "circle-radius": ["step", ["get", "point_count"], 14, 8, 16, 20, 18],
        "circle-color": "#C5221F",
        "circle-stroke-color": "#FFFFFF",
        "circle-stroke-width": 3
      }
    });
  }

  if (!map.getLayer(layerClusterCountId)) {
    map.addLayer({
      id: layerClusterCountId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: CLUSTER_MAX_ZOOM + 1,
      layout: CLUSTER_COUNT_LAYOUT,
      paint: {
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

  if (!map.getLayer(layerClusterCollisionMaskId)) {
    map.addLayer({
      id: layerClusterCollisionMaskId,
      source: sourceClusteredCityPinsId,
      type: "symbol",
      filter: toLayerFilter(["has", "point_count"]),
      maxzoom: CLUSTER_MAX_ZOOM + 1,
      layout: {
        "icon-size": 1,
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-image": clusterCollisionImageId
      },
      paint: {
        "icon-opacity": 0
      }
    });
  }

  if (!map.getLayer(layerCityPinCollisionMaskId)) {
    map.addLayer({
      id: layerCityPinCollisionMaskId,
      source: sourceClusteredCityPinsId,
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
        ["!=", ["get", "labelText"], null]
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
        "text-font": ["Noto Sans Bold"],
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        ...areaLabelOverviewOffsetLayout
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
        "text-font": ["Noto Sans Bold"],
        "text-size": ["get", "areaFontSize"],
        "text-letter-spacing": 0.18,
        "symbol-sort-key": ["get", "labelPriority"],
        "text-optional": true,
        ...AREA_LABEL_OFFSET_LAYOUT
      },
      paint: {
        "text-color": "#5F6368",
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

  const properties = asObject(feature.properties);
  if (!properties) {
    return null;
  }

  const clusterId = asNumber(properties.cluster_id);
  const pointCount = asNumber(properties.point_count);
  if (clusterId !== null && pointCount !== null) {
    return {
      id: `cluster:${clusterId}`,
      kind: "cluster",
      coordinates,
      accessibleName: `Cluster of ${pointCount} places`,
      tooltipText: `${pointCount} places`,
      clusterId,
      pointCount
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
    }
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

function roundedDistanceMeters(value: number) {
  const leading = [1, 2, 3, 5, 10];
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / power;
  const candidate = leading.find((entry) => entry >= normalized) ?? 10;
  return candidate * power;
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
  focusRequestToken,
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
  const activeTooltipEntryIdRef = useRef<string | null>(null);
  const mapCanvasHasPointerCursorRef = useRef(false);
  const attributionControlRef = useRef<AttributionControl | null>(null);
  const attributionModeRef = useRef<BasemapMode | null>(null);
  const mainSourceLoadTimeoutRef = useRef<number | null>(null);
  const mainSourceLoadControllerRef = useRef(new MainSourceLoadTimeoutController());
  const mapKeyboardActiveRef = useRef(false);
  const tooltipTrackingEnabledRef = useRef(false);
  const activateVisibleEntryRef = useRef<(entry: VisibleListEntry) => void>(() => undefined);
  const handleTooltipAtPointRef = useRef<(point: PointLike) => void>(() => undefined);
  const refreshVisibleEntryStateRef = useRef<() => void>(() => undefined);
  const scheduleVisibleEntryRefreshRef = useRef<() => void>(() => undefined);
  const syncSourcesAndLayersRef = useRef<() => void>(() => undefined);
  const updateScaleBarRef = useRef<() => void>(() => undefined);

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
  const placeById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const renderData = useMemo(
    () => buildPlaceRenderData(places, selection, highlightedPlaceId),
    [highlightedPlaceId, places, selection]
  );

  const [basemapState, setBasemapState] = useState(() => basemapController.getState());
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [visibleEntries, setVisibleEntries] = useState<VisibleListEntry[]>([]);
  const [visibleEntryOverflow, setVisibleEntryOverflow] = useState(false);

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

    const pointer = asScreenPoint(point);
    if (!pointer) {
      return null;
    }

    const features = map.queryRenderedFeatures(queryBoxAroundPoint(pointer, interactiveHitPaddingPx), {
      layers: [...interactiveLayerIds]
    });
    const entries = deduplicateVisibleEntries(
      features.map(toVisibleEntry).filter((entry): entry is VisibleListEntry => entry !== null)
    );

    return pickNearestCandidate(
      pointer,
      entries.map((entry) => {
        const projected = map.project(entry.coordinates as LngLatLike);
        return {
          value: entry,
          point: {
            x: projected.x,
            y: projected.y
          }
        };
      }),
      (left, right) => left.id.localeCompare(right.id)
    );
  }, []);

  const updateScaleBar = useCallback(() => {
    const map = mapRef.current;
    const scaleBar = scaleBarRef.current;
    const scaleFill = scaleBarFillRef.current;
    const scaleLabel = scaleBarLabelRef.current;
    if (!map || !scaleBar || !scaleFill || !scaleLabel) {
      return;
    }

    const mapHeight = map.getContainer().clientHeight;
    const maxWidth = 110;
    const y = Math.max(32, mapHeight - 48);
    const left = map.unproject([0, y] as PointLike);
    const right = map.unproject([maxWidth, y] as PointLike);
    const measuredMeters = distanceMeters([left.lng, left.lat], [right.lng, right.lat]);
    const roundedMeters = roundedDistanceMeters(measuredMeters);
    const width = Math.max(24, Math.min(maxWidth, Math.round((roundedMeters / measuredMeters) * maxWidth)));

    scaleFill.style.width = `${width}px`;
    scaleLabel.textContent = formatScaleDistance(roundedMeters);
  }, []);

  const refreshVisibleEntryState = useCallback(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    const rendered = map.queryRenderedFeatures({
      layers: [...interactiveLayerIds]
    });
    const deduplicated = deduplicateVisibleEntries(
      rendered.map(toVisibleEntry).filter((entry): entry is VisibleListEntry => entry !== null)
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

    ensureGeoJsonSource(map, sourceClusteredCityPinsId, renderData.clusteredCityPins, {
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: 52
    });
    ensureGeoJsonSource(map, sourceSitePinsId, renderData.sitePins);
    ensureGeoJsonSource(map, sourceCandidatePinsId, renderData.candidatePins);
    ensureGeoJsonSource(map, sourceAreaLabelsId, renderData.areaLabels);
    ensureGeoJsonSource(map, sourceKeyboardFocusId, createEmptyFeatureCollection());

    ensureQuestionBadgeImage(map);
    ensureCandidateImages(map, renderData);
    ensureMapLayers(map);
  }, [renderData]);

  const handleTooltipAtPoint = useCallback(
    (point: PointLike) => {
      const map = mapRef.current;
      const tooltip = tooltipRef.current;
      if (!map || !tooltip || gestureInProgressRef.current) {
        return;
      }

      const entry = resolveInteractiveEntryAtPoint(point);
      if (!entry) {
        setInteractiveCursor(false);
        hideTooltip();
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
    },
    [hideTooltip, resolveInteractiveEntryAtPoint, setInteractiveCursor]
  );

  const zoomToCluster = useCallback(
    async (entry: VisibleClusterEntry) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const source = map.getSource(sourceClusteredCityPinsId);
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
      if (entry.kind === "cluster") {
        void zoomToCluster(entry);
        return;
      }

      onSelectPlace(entry.selection);
    },
    [onSelectPlace, zoomToCluster]
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
    },
    [panelInset, runtimeTuning.controlZoomDurationMs]
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

  const syncAttributionControl = useCallback((map: MapLibreMap, mode: BasemapMode) => {
    if (attributionModeRef.current === mode && attributionControlRef.current) {
      return;
    }

    if (attributionControlRef.current) {
      map.removeControl(attributionControlRef.current);
      attributionControlRef.current = null;
    }

    const control = new AttributionControl({
      compact: true,
      customAttribution: getAttributionMarkup(mode)
    });
    map.addControl(control, "bottom-right");
    attributionControlRef.current = control;
    attributionModeRef.current = mode;
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
      syncAttributionControl(map, "fallback");
      map.setStyle(getStyleUrl("fallback"));
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
      style: getStyleUrl(initialMode),
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
    syncAttributionControl(map, initialMode);

    const markGestureStarted = () => {
      if (gestureReleaseTimeoutRef.current !== null) {
        window.clearTimeout(gestureReleaseTimeoutRef.current);
        gestureReleaseTimeoutRef.current = null;
      }
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
      syncAttributionControl(map, currentMode);
      configureZoomGestures(map, effectiveRuntimeTuning);
      applyBasemapLayerVariants(map, currentMode, effectiveRuntimeTuning);
      if (currentMode === "main") {
        scheduleMainSourceLoadTimeout(map);
      } else {
        clearMainSourceLoadTimeout();
      }
      map.getCanvas().tabIndex = -1;
      syncSourcesAndLayersRef.current();
      refreshVisibleEntryStateRef.current();
      updateScaleBarRef.current();
      setMapReadyVersion((value) => value + 1);

      if (!cleanupAttributionRef.current) {
        cleanupAttributionRef.current = expandCompactAttributionOnFirstPaint(
          map,
          mapContainerRef.current
        );
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
      handleTooltipAtPointRef.current(event.point);
    };
    const handleMouseOut = () => {
      setInteractiveCursor(false);
      hideTooltip();
    };
    const handleMoveEnd = () => {
      scheduleVisibleEntryRefreshRef.current();
    };
    const handleResize = () => {
      scheduleVisibleEntryRefreshRef.current();
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);
    document.addEventListener("keydown", handleMapKeyboardShortcuts, true);
    map.on("load", handleStyleReady);
    map.on("style.load", handleStyleReady);
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
      if (gestureReleaseTimeoutRef.current !== null) {
        window.clearTimeout(gestureReleaseTimeoutRef.current);
      }

      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      document.removeEventListener("keydown", handleMapKeyboardShortcuts, true);
      map.off("load", handleStyleReady);
      map.off("style.load", handleStyleReady);
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
    hideTooltip,
    resolveInteractiveEntryAtPoint,
    scheduleMainSourceLoadTimeout,
    setInteractiveCursor,
    switchToFallback,
    syncAttributionControl,
    runtimeTuning
  ]);

  useEffect(() => {
    if (!styleReadyRef.current) {
      return;
    }

    syncSourcesAndLayers();
    refreshVisibleEntryState();
  }, [refreshVisibleEntryState, syncSourcesAndLayers]);

  useEffect(() => {
    updateScaleBar();
  }, [mapReadyVersion, panelInset, updateScaleBar]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) {
      return;
    }

    map.setPadding(getMapLabelPadding(panelInset));
    refreshVisibleEntryState();
  }, [panelInset, refreshVisibleEntryState]);

  useEffect(() => {
    const map = mapRef.current;
    if (!selection || !map || !styleReadyRef.current) {
      previousFocusRequestRef.current = selection ? previousFocusRequestRef.current : "";
      return;
    }

    const selectionKey = `${selection.placeId}:${selection.candidateIndex ?? ""}:${focusRequestToken}`;
    if (selectionKey === previousFocusRequestRef.current) {
      return;
    }

    const place = placeById.get(selection.placeId);
    if (!place) {
      return;
    }

    previousFocusRequestRef.current = selectionKey;
    focusSelection(map, place, selection, panelInset, runtimeTuning.flyToDurationMs);
  }, [
    focusRequestToken,
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

    flyOrJump(map, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      padding: {
        top: focusPaddingTop,
        right: 64,
        bottom: 64,
        left: panelInset + 64
      }
    }, runtimeTuning.flyToDurationMs);
  }, [panelInset, runtimeTuning.flyToDurationMs]);

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
          bottom: "16px",
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
          cursor: "pointer",
          zIndex: 12
        }}
        title="Reset view"
        type="button"
      >
        ⟳
      </button>
      <div aria-label="Visible places on map" className="ibm-hidden-visible-places">
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
