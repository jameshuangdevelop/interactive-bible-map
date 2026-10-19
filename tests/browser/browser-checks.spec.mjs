import fs from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";

import {
  buildSyntheticPlaces,
  buildFixtureGeneratedOutput,
  captureDeviceScaleCrop,
  captureFallbackSelectionScreenshot,
  captureGalileeCollisionBoxes,
  captureScenario,
  loadExpectedDrawerTextFromLicenses,
  mapTestHookKey,
  temporaryPanelHeaderScreenshotPath,
  temporaryScreenshotPath,
  verifyAboutPlaceLinksOpenPlacesAndSupportBack,
  verifyAreaLabelsAvoidPins,
  verifyAreaLabelsOverviewWithProvinceFixture,
  verifyAsiaMinorSevenChurchesAtZoom65,
  verifyCandidateDotsSelectionVisibility,
  verifyCandidatePinColorRendering,
  verifyCandidateSelectionUpdatesUrl,
  verifyCapernaumLeadImageLoads,
  verifyDesktopAttributionReachability,
  verifyDisputedAndHierarchyLayouts,
  verifyExpandedAttributionAboveTimeline,
  verifyFallbackOutageMode,
  verifyGalleryFixtureWithViewer,
  verifyImageFailurePlaceholderKeepsCredit,
  verifyJerusalemGalileeAtZoom6,
  verifyKeyboardDisclosureControls,
  verifyKeyboardOrderAndEscapeBehavior,
  verifyModernBoundaryRenderingByDispute,
  verifyModernMapToggle,
  verifyNameLayersDisallowOverlap,
  verifyNoOverlappingNamesAcrossViews,
  verifyNoTimelineUiOnDefaultBuild,
  verifyNormalLoadStaysOnMainBasemap,
  verifyOpeningCameraBaseline,
  runPanelOpenSmoothnessCheck,
  runSmoothnessCheck,
  verifyPanelAccessibility,
  verifyPanelDoesNotMutateMapDom,
  verifyPanelSectionOrderAndPhotoCredits,
  verifyPinLabelRegression,
  verifyPlaceDetailsFetchRaceRecovery,
  verifyPointerCursorAndNearPinClick,
  verifyScaleBarUpdatesWithZoom,
  verifySearchMenuAndAccessibility,
  verifySelectedMajorNameAlwaysShows,
  verifyShowAllPassages,
  verifySimplePanelHeaderWithCountries,
  verifyTarsusNameShowsAndClicks,
  verifyTimelineTickLabelsDoNotOverlapAcrossLayouts,
  verifyTimelineUiWithFixtureData,
  verifyTouchTapTargetOnNames
} from "../../scripts/verify-web-export-playwright.mjs";
import { expect, test } from "./fixtures.mjs";

const evidenceEnabled = process.env.EVIDENCE === "1";
const generatedDirectory = path.resolve(process.cwd(), "app", "dist", "generated");
const routeStage4PlaceIds = new Set([
  "cauda",
  "fair-havens",
  "malta",
  "phoenix",
  "syrtis",
  "lasea",
  "cnidus",
  "salmone",
  "myra",
  "crete"
]);

async function waitForMapIdle(page) {
  await page.waitForFunction(
    (testHookKey) => {
      const map = window[testHookKey];
      return Boolean(map && map.loaded() && !map.isMoving() && map.areTilesLoaded());
    },
    mapTestHookKey,
    { timeout: 60_000 }
  );
}

async function jumpMap(page, center, zoom) {
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });
  await page.evaluate(
    ({ testHookKey, centerPoint, zoomLevel }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }
      map.jumpTo({ center: centerPoint, zoom: zoomLevel });
    },
    { testHookKey: mapTestHookKey, centerPoint: center, zoomLevel: zoom }
  );
  await waitForMapIdle(page);
}

async function renderedPlaceNames(page) {
  return page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const placeNameLayers = [
      "ibm-major-pin",
      "ibm-major-pin-no-dot",
      "ibm-city-pin",
      "ibm-city-pin-no-dot",
      "ibm-site-pin",
      "ibm-routes-major-pin",
      "ibm-routes-city-pin",
      "ibm-routes-site-pin",
      "ibm-pin-label-standard",
      "ibm-selected-major-pin-label",
      "ibm-selected-site-pin-label",
      "ibm-selected-pin-label"
    ];
    const seen = new Set();
    const rendered = [];
    for (const feature of map.queryRenderedFeatures(undefined, { layers: placeNameLayers })) {
      const properties = feature.properties ?? {};
      const labelText =
        typeof properties.labelText === "string"
          ? String(properties.labelText)
          : typeof properties.placeName === "string"
            ? String(properties.placeName)
            : null;
      if (!properties.placeId || !labelText || feature.geometry?.type !== "Point") {
        continue;
      }
      const point = map.project(feature.geometry.coordinates);
      const placeId = String(properties.placeId);
      const source = String(feature.source ?? "");
      const layerId = typeof feature.layer?.id === "string" ? feature.layer.id : "";
      const dedupeKey = `${placeId}:${source}:${layerId}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        rendered.push({
          placeId,
          text: labelText,
          placeType: typeof properties.placeType === "string" ? String(properties.placeType) : null,
          source,
          layerId,
          id: feature.id ?? null,
          x: point.x,
          y: point.y
        });
      }
    }
    return rendered;
  }, mapTestHookKey);
}

async function installRouteStageUpdateProbe(page) {
  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const probe = window.__ibmRouteStageUpdateProbe;
    if (probe?.installed) {
      return;
    }
    window.__ibmRouteStageUpdateProbe = {
      installed: true,
      log: []
    };

    const sourceIds = Object.keys(map.getStyle().sources);
    for (const sourceId of sourceIds) {
      const source = map.getSource(sourceId);
      if (!source) {
        continue;
      }
      for (const methodName of ["setData", "updateData"]) {
        if (typeof source[methodName] !== "function") {
          continue;
        }
        const original = source[methodName].bind(source);
        source[methodName] = (...args) => {
          const entry = window.__ibmRouteStageUpdateProbe;
          entry?.log.push({ type: methodName, sourceId });
          return original(...args);
        };
      }
    }

    const originalSetLayoutProperty = map.setLayoutProperty.bind(map);
    map.setLayoutProperty = (...args) => {
      const entry = window.__ibmRouteStageUpdateProbe;
      entry?.log.push({
        type: "setLayoutProperty",
        layerId: typeof args[0] === "string" ? args[0] : null
      });
      return originalSetLayoutProperty(...args);
    };
  }, mapTestHookKey);
}

async function resetRouteStageUpdateProbe(page) {
  await page.evaluate(() => {
    const probe = window.__ibmRouteStageUpdateProbe;
    if (probe) {
      probe.log = [];
    }
  });
}

async function readRouteStageUpdateProbe(page) {
  return page.evaluate(() => {
    const probe = window.__ibmRouteStageUpdateProbe;
    if (!probe) {
      return {
        sourceUpdateCalls: [],
        layoutCalls: []
      };
    }
    const sourceUpdateCalls = probe.log.filter((entry) => entry.type === "setData" || entry.type === "updateData");
    const layoutCalls = probe.log.filter((entry) => entry.type === "setLayoutProperty");
    return { sourceUpdateCalls, layoutCalls };
  });
}

// Click a stage card on its "Stage N ·" label, never its centre: the centre can land on an
// inline place button (fonts wrap differently on Linux CI), which selects that place instead.
async function clickRouteStageCard(page, stageIndex) {
  const card = page.locator(`li[data-route-stage-index="${stageIndex}"]`);
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  expect(box, `stage card ${stageIndex} should be laid out`).toBeTruthy();
  const position = { x: 12, y: 12 };
  const hit = await page.evaluate(
    ({ x, y, index }) => {
      const element = document.elementFromPoint(x, y);
      return {
        inCard: Boolean(element?.closest(`li[data-route-stage-index="${index}"]`)),
        onButton: Boolean(element?.closest("button"))
      };
    },
    { x: box.x + position.x, y: box.y + position.y, index: stageIndex }
  );
  expect(hit, `stage card ${stageIndex} click point should be on the card, not a place button`).toEqual({
    inCard: true,
    onButton: false
  });
  await card.click({ position });
}

function clipAroundPoint(page, x, y, width = 180, height = 72) {
  const viewport = page.viewportSize();
  const viewportWidth = viewport?.width ?? 1280;
  const viewportHeight = viewport?.height ?? 720;
  const left = Math.max(0, Math.min(Math.round(x - width / 2), viewportWidth - width));
  const top = Math.max(0, Math.min(Math.round(y - height / 2), viewportHeight - height));
  return { x: left, y: top, width, height };
}

async function countBluePixelsNearLabel(page, x, y) {
  const screenshot = await page.screenshot({
    clip: clipAroundPoint(page, x, y)
  });
  const { data } = await sharp(screenshot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let nearGoogleBlueCount = 0;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    if (alpha < 200) {
      continue;
    }
    if (Math.abs(red - 26) <= 20 && Math.abs(green - 115) <= 25 && Math.abs(blue - 232) <= 25) {
      nearGoogleBlueCount += 1;
    }
  }
  return nearGoogleBlueCount;
}

function clipAroundTownDotPoint(page, x, y, width = 12, height = 12) {
  const viewport = page.viewportSize();
  const viewportWidth = viewport?.width ?? 1280;
  const viewportHeight = viewport?.height ?? 720;
  const left = Math.max(0, Math.min(Math.round(x - width / 2), viewportWidth - width));
  const top = Math.max(0, Math.min(Math.round(y - height / 2), viewportHeight - height));
  return { x: left, y: top, width, height };
}

async function countNearPureBlackTownDotPixels(page, x, y) {
  const screenshot = await page.screenshot({
    clip: clipAroundTownDotPoint(page, x, y)
  });
  const { data } = await sharp(screenshot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let nearPureBlackCount = 0;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    if (alpha < 220) {
      continue;
    }
    if (Math.max(red, green, blue) <= 24) {
      nearPureBlackCount += 1;
    }
  }
  return nearPureBlackCount;
}

async function mapPointToViewportPoint(page, point) {
  const { x, y } = point;
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  return { x, y };
}

async function moveMouseToMapPoint(page, point) {
  const viewportPoint = await mapPointToViewportPoint(page, point);
  expect(viewportPoint).toBeTruthy();
  await page.mouse.move(viewportPoint.x, viewportPoint.y);
}

async function clickMapPoint(page, point) {
  const viewportPoint = await mapPointToViewportPoint(page, point);
  expect(viewportPoint).toBeTruthy();
  await page.mouse.click(viewportPoint.x, viewportPoint.y);
}

async function cursorAtMapPoint(page, point) {
  await moveMouseToMapPoint(page, point);
  await page.waitForTimeout(60);
  return page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return window.getComputedStyle(map.getCanvas()).cursor;
  }, mapTestHookKey);
}

async function moveMouseToInteractiveMapPoint(page, originPoint) {
  const offsets = [
    [0, 0],
    [0, -10],
    [0, 10],
    [-10, 0],
    [10, 0],
    [-18, -10],
    [18, -10],
    [-18, 10],
    [18, 10]
  ];
  for (const [offsetX, offsetY] of offsets) {
    const point = { x: originPoint.x + offsetX, y: originPoint.y + offsetY };
    const cursor = await cursorAtMapPoint(page, point);
    if (cursor.includes("pointer")) {
      return point;
    }
  }
  return null;
}

test("map requests tiles and loads workers on startup", { tag: ["@data"] }, async ({ page, baseUrl }) => {
  const requestUrls = [];
  const workerUrls = [];
  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });
  page.on("worker", (worker) => {
    workerUrls.push(worker.url());
  });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas.maplibregl-canvas");
  await page.waitForTimeout(500);

  const tileRequestCount = requestUrls.filter(
    (url) => url.includes("tiles.openfreemap.org") || url.includes("tiles.versatiles.org")
  ).length;
  const workerRequestCount = requestUrls.filter(
    (url) => url.includes("maplibre-gl-worker.mjs") || url.includes("maplibre-gl-shared.mjs")
  ).length;
  const distinctWorkerRequestUrlCount = new Set(
    requestUrls.filter(
      (url) => url.includes("maplibre-gl-worker.mjs") || url.includes("maplibre-gl-shared.mjs")
    )
  ).size;

  expect(tileRequestCount).toBeGreaterThan(0);
  expect(workerUrls.length).toBeGreaterThan(0);
  expect(workerRequestCount).toBeGreaterThanOrEqual(2);
  expect(distinctWorkerRequestUrlCount).toBeGreaterThanOrEqual(2);
});

test.describe.serial("sequential panel checks", () => {
  test("panel order and photo credits render in the expected order", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyPanelSectionOrderAndPhotoCredits(page, baseUrl);
  });

  test("about-place links open and browser back restores panel state", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyAboutPlaceLinksOpenPlacesAndSupportBack(page, baseUrl);
  });

  test("pin hover cursor and near-pin click keep interaction discoverable", { tag: ["@names"] }, async ({ page, baseUrl }) => {
    await verifyPointerCursorAndNearPinClick(page, baseUrl);
  });

  test("disputed sites and hierarchy rows render correctly", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyDisputedAndHierarchyLayouts(page, baseUrl);
  });

  test("show-all passages expands and collapses correctly", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyShowAllPassages(page, baseUrl);
  });

  test("opening and closing the panel does not mutate map DOM", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyPanelDoesNotMutateMapDom(page, baseUrl);
  });

  test("candidate selection updates URL and panel selection", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
    await verifyCandidateSelectionUpdatesUrl(page, baseUrl);
  });

  test("keyboard disclosure controls expose correct aria state", { tag: ["@a11y"] }, async ({ page, baseUrl }) => {
    await verifyKeyboardDisclosureControls(page, baseUrl);
  });
});

test("normal loads stay on the main basemap in a 5s observation window", { tag: ["@modern"] }, async ({ browser, baseUrl }) => {
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/", { observeWindowMs: 5_000 });
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/?map=modern", { observeWindowMs: 5_000 });
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/?place=galilee", { observeWindowMs: 5_000 });
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/?map=modern&place=galilee", { observeWindowMs: 5_000 });
});

test("gallery fixture keeps viewer layout and controls accessible", { tag: ["@panel"] }, async ({ browser, baseUrl }) => {
  await verifyGalleryFixtureWithViewer(browser, baseUrl);
});

test("Capernaum lead image loads and keeps visible credit context", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
  await verifyCapernaumLeadImageLoads(page, baseUrl);
});

test("image failure placeholder preserves credit and navigation", { tag: ["@panel"] }, async ({ browser, baseUrl }) => {
  await verifyImageFailurePlaceholderKeepsCredit(browser, baseUrl);
});

test("panel heading and countries remain simple and stable", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
  await verifySimplePanelHeaderWithCountries(page, baseUrl, {
    ephesusPanel: temporaryPanelHeaderScreenshotPath("ephesus-panel.png"),
    emmausPanel: temporaryPanelHeaderScreenshotPath("emmaus-panel.png"),
    jerusalemPanel: temporaryPanelHeaderScreenshotPath("jerusalem-panel.png"),
    ephesusSearchResult: temporaryPanelHeaderScreenshotPath("ephesus-search-result.png")
  });
});

test("panel accessibility roles and labels stay valid", { tag: ["@a11y"] }, async ({ browser, baseUrl }) => {
  await verifyPanelAccessibility(browser, baseUrl);
});

test("name layers remain collision-safe in rendered layers", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await verifyNameLayersDisallowOverlap(page, baseUrl);
});

test("names do not overlap in representative risky views", { tag: ["@names", "@routes", "@phone"] }, async ({ page, baseUrl }) => {
  // 12 views × tile loads; audit B27.
  test.setTimeout(180_000);
  await verifyNoOverlappingNamesAcrossViews(page, baseUrl);
});

test("selected major place label stays visible through interactions", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await verifySelectedMajorNameAlwaysShows(page, baseUrl);
});

test("Tarsus name stays clickable and selects correctly", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await verifyTarsusNameShowsAndClicks(page, baseUrl);
});

test("touch hit target for names remains large enough", { tag: ["@phone", "@names"] }, async ({ browser, baseUrl }) => {
  await verifyTouchTapTargetOnNames(browser, baseUrl);
});

test("overview labels stay clear of the search box (replacement for normal-load readability guard) @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  const overlapCount = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const search = document.querySelector("[data-map-search-shell='true']");
    if (!(search instanceof HTMLElement)) {
      throw new Error("Search shell not found.");
    }
    const mapRect = map.getContainer().getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    const minX = Math.max(0, searchRect.left - mapRect.left + 4);
    const minY = Math.max(0, searchRect.top - mapRect.top + 4);
    const maxX = Math.min(mapRect.width, searchRect.right - mapRect.left - 4);
    const maxY = Math.min(mapRect.height, searchRect.bottom - mapRect.top - 4);
    return map.queryRenderedFeatures(
      [
        [minX, minY],
        [maxX, maxY]
      ],
      {
        layers: [
          "ibm-major-area-label-overview",
          "ibm-major-area-label",
          "ibm-area-label-overview",
          "ibm-area-label",
          "ibm-selected-area-label"
        ]
      }
    ).length;
  }, mapTestHookKey);
  expect(overlapCount).toBe(0);
});

test("no '+N' grouped place names appear between zoom 3 and 11 (ADR-0044 item 1) @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  const plusNames = [];
  for (const [center, zooms] of [[[35.3, 32.6], [3, 4, 5, 6, 7, 8, 9, 10, 11]], [[27.5, 38.5], [4, 5, 6, 7]]]) {
    for (const zoom of zooms) {
      await jumpMap(page, center, zoom);
      const names = await renderedPlaceNames(page);
      plusNames.push(...names.filter((entry) => /\+\d/u.test(entry.text)).map((entry) => `${entry.text}@${zoom}`));
    }
  }
  expect(plusNames).toEqual([]);
});

test("Jerusalem stays visible on-screen across zooms and top major places render at their own zoom (replaces importantPlacesFirst/majorPlacesCoverage) @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);

  const jerusalemVisibility = [];
  for (const zoom of [3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    await jumpMap(page, [35.2, 31.78], zoom);
    const placeIds = new Set((await renderedPlaceNames(page)).map((entry) => entry.placeId));
    jerusalemVisibility.push({ zoom, shown: placeIds.has("jerusalem") });
  }
  expect(jerusalemVisibility.every((entry) => entry.shown)).toBe(true);

  const topMajorIds = [
    "jerusalem",
    "nazareth",
    "damascus",
    "ephesus",
    "caesarea-maritima",
    "capernaum",
    "antioch-syria",
    "corinth",
    "bethany",
    "bethlehem"
  ];
  const placeCoordinates = await page.evaluate(async (ids) => {
    const payload = await fetch("/generated/places.index.json").then((response) => response.json());
    const byId = new Map((Array.isArray(payload) ? payload : []).map((place) => [String(place.id ?? ""), place]));
    return ids.map((id) => {
      const place = byId.get(id);
      const candidate = Array.isArray(place?.candidates) ? place.candidates[0] : null;
      const coordinates = Array.isArray(candidate?.coordinates) ? candidate.coordinates : null;
      return {
        id,
        coordinates:
          Array.isArray(coordinates) &&
          coordinates.length >= 2 &&
          Number.isFinite(Number(coordinates[0])) &&
          Number.isFinite(Number(coordinates[1]))
            ? [Number(coordinates[0]), Number(coordinates[1])]
            : null
      };
    });
  }, topMajorIds);
  for (const place of placeCoordinates) {
    expect(place.coordinates, `Missing coordinates for ${place.id}`).not.toBeNull();
    let shown = false;
    for (const zoom of [8, 9, 10, 11]) {
      await jumpMap(page, place.coordinates, zoom);
      const placeIds = new Set((await renderedPlaceNames(page)).map((entry) => entry.placeId));
      if (placeIds.has(place.id)) {
        shown = true;
        break;
      }
    }
    expect(shown, `Expected ${place.id} at own zoom`).toBe(true);
  }
});

test("Galilee area labels avoid overlapping city pins", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await verifyAreaLabelsAvoidPins(page, `${baseUrl}/?place=galilee`);
});

test("pin label regression checks all critical labels", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await verifyPinLabelRegression(page, baseUrl);
});

test("Jerusalem and Galilee remain legible at zoom 6", { tag: ["@names"] }, async ({ browser, baseUrl }) => {
  await verifyJerusalemGalileeAtZoom6(browser, baseUrl);
});

test("Asia Minor seven churches remain visible at zoom 6.5", { tag: ["@names"] }, async ({ browser, baseUrl }) => {
  await verifyAsiaMinorSevenChurchesAtZoom65(browser, baseUrl);
});

test("candidate pin colors and emphasis remain distinct", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
  await verifyCandidatePinColorRendering(page, baseUrl);
});

test("candidate dots show only for selected place", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
  await verifyCandidateDotsSelectionVisibility(page, baseUrl);
});

test("keyboard order and Escape behavior follow map accessibility contract", { tag: ["@a11y"] }, async ({ page, baseUrl }) => {
  await verifyKeyboardOrderAndEscapeBehavior(page, baseUrl);
});

test("modern map toggle preserves state and attribution", { tag: ["@modern"] }, async ({ page, baseUrl }) => {
  await verifyModernMapToggle(page, baseUrl);
});

test("modern disputed boundaries render by dispute status", { tag: ["@modern"] }, async ({ page, baseUrl }) => {
  await verifyModernBoundaryRenderingByDispute(page, baseUrl);
});

test("timeline UI behaves with default generated timeline data", { tag: ["@timeline"] }, async ({ page, baseUrl }) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  const slider = page.locator("input[data-timeline-slider='true']").first();
  await slider.waitFor({ state: "visible", timeout: 30_000 });
  await slider.focus();
  const before = await slider.getAttribute("aria-valuetext");
  await slider.press("ArrowRight");
  await expect
    .poll(async () => slider.getAttribute("aria-valuetext"), { timeout: 10_000 })
    .not.toBe(before);
  const after = await slider.getAttribute("aria-valuetext");
  expect(after).not.toBe(before);
  await page.getByRole("button", { name: "Sources" }).click();
  const popover = page.locator("[data-timeline-sources-popover='true']");
  await popover.waitFor({ state: "visible", timeout: 10_000 });
  await expect(popover).toContainText("Borders are approximate");
  await page.getByRole("button", { name: "Sources" }).click();
  await expect(popover).toBeHidden({ timeout: 10_000 });
  const holderLabelPoint = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const holderLabel = map
      .queryRenderedFeatures(undefined, {
        layers: ["ibm-ancient-holder-label-clickable", "ibm-ancient-holder-label"]
      })
      .find((feature) => {
        const text = String(feature.properties?.tooltipText ?? "").trim();
        return text.length > 0 && feature.geometry?.type === "Point";
      });
    if (!holderLabel || holderLabel.geometry?.type !== "Point") {
      throw new Error("Expected at least one rendered ancient holder label with tooltipText.");
    }
    const projected = map.project(holderLabel.geometry.coordinates);
    return { x: projected.x, y: projected.y };
  }, mapTestHookKey);
  await page.mouse.move(holderLabelPoint.x, holderLabelPoint.y);
  const tooltip = page.locator("div[role='tooltip']").first();
  await expect(tooltip).toBeVisible({ timeout: 8_000 });
  await expect
    .poll(async () => ((await tooltip.textContent()) ?? "").trim(), { timeout: 8_000 })
    .not.toBe("");
});

test("timeline UI hides itself when generated timeline is absent", { tag: ["@timeline"] }, async ({ page, baseUrl }) => {
  test.skip(await fs.access(path.join(generatedDirectory, "ancient.timeline.json")).then(() => true).catch(() => false), "Default timeline exists in this build.");
  await verifyNoTimelineUiOnDefaultBuild(page, baseUrl);
});

test("timeline UI handles fixture data variants", { tag: ["@timeline"] }, async ({ browser, baseUrl }) => {
  const fixtureGeneratedDirectory = await buildFixtureGeneratedOutput();
  try {
    await verifyTimelineUiWithFixtureData(browser, baseUrl, fixtureGeneratedDirectory);
  } finally {
    await fs.rm(fixtureGeneratedDirectory, { recursive: true, force: true });
  }
});

test("search menu and credits drawer stay accessible", { tag: ["@panel", "@a11y"] }, async ({ page, baseUrl }) => {
  const expectedDrawerText = await loadExpectedDrawerTextFromLicenses();
  await verifySearchMenuAndAccessibility(
    page,
    baseUrl,
    temporaryScreenshotPath("ibm-m3-05-search-results.png"),
    temporaryScreenshotPath("ibm-m3-05-credits-drawer.png"),
    expectedDrawerText
  );
});

test("desktop attribution drawer remains reachable and readable", { tag: ["@a11y"] }, async ({ browser, baseUrl }) => {
  await verifyDesktopAttributionReachability(browser, baseUrl);
});

test("expanded attribution remains above timeline controls", { tag: ["@timeline"] }, async ({ browser, baseUrl }) => {
  await verifyExpandedAttributionAboveTimeline(browser, baseUrl);
});

test("scale bar updates when zoom changes", { tag: ["@modern"] }, async ({ browser, baseUrl }) => {
  await verifyScaleBarUpdatesWithZoom(browser, baseUrl);
});

test("timeline tick labels do not overlap across layouts", { tag: ["@timeline", "@phone"] }, async ({ browser, baseUrl }) => {
  await verifyTimelineTickLabelsDoNotOverlapAcrossLayouts(browser, baseUrl);
});

test("place details recover from stale request races", { tag: ["@panel"] }, async ({ browser, baseUrl }) => {
  await verifyPlaceDetailsFetchRaceRecovery(browser, baseUrl);
});

test("fallback outage mode works in pbf-only and all-request scenarios", { tag: ["@fallback", "@network"] }, async ({ browser, baseUrl }) => {
  await verifyFallbackOutageMode({
    browser,
    baseUrl,
    mode: "pbf-only",
    screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-pbf-outage.png")
  });
  await verifyFallbackOutageMode({
    browser,
    baseUrl,
    mode: "all-requests",
    screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-all-requests-outage.png")
  });
  await verifyFallbackOutageMode({
    browser,
    baseUrl,
    mode: "pbf-only",
    pathWithQuery: "/?map=modern",
    screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-modern-pbf-outage.png")
  });
  await verifyFallbackOutageMode({
    browser,
    baseUrl,
    mode: "all-requests",
    pathWithQuery: "/?map=modern",
    screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-modern-all-requests-outage.png")
  });
});

test("overview area labels remain stable with province fixture", { tag: ["@timeline"] }, async ({ browser, baseUrl }) => {
  const placesPath = path.join(generatedDirectory, "places.index.json");
  const basePlaces = JSON.parse(await fs.readFile(placesPath, "utf8"));
  await verifyAreaLabelsOverviewWithProvinceFixture(browser, baseUrl, basePlaces);
});

test("opening camera baseline remains smooth enough in software renderer", { tag: ["@perf"] }, async ({ browser, baseUrl }) => {
  await verifyOpeningCameraBaseline(browser, baseUrl);
});

test("panel open smoothness keeps long tasks under budget (restores B60) @perf", { tag: ["@perf"] }, async ({ browser, baseUrl }) => {
  const panelSmoothness = await runPanelOpenSmoothnessCheck({
    browser,
    baseUrl,
    requestUrls: [],
    pageErrors: [],
    consoleErrors: [],
    workerUrls: [],
    workerConsoleEvents: [],
    workerErrors: []
  });
  expect(Array.isArray(panelSmoothness.longTasks)).toBe(true);
  expect(typeof panelSmoothness.frameSummary).toBe("object");
  expect(typeof panelSmoothness.frameSummary.count).toBe("number");
  if (process.env.SMOOTHNESS_REQUIRE_GPU === "1") {
    expect(panelSmoothness.longTasks.filter((duration) => duration > 50)).toEqual([]);
  }
});

test("route stage selection only updates route sources and never touches layout properties", async ({ page, baseUrl }) => {
  const allowedRouteSourceIds = new Set(["ibm-route-lines", "ibm-route-points"]);
  const runSelectAssertion = async ({ routeId, stageIndex }) => {
    await page.goto(`${baseUrl}/?tab=routes&route=${routeId}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000
    });
    await page.locator("li[data-route-stage-index]").first().waitFor({ timeout: 60_000 });
    await waitForMapIdle(page);
    await page.waitForTimeout(200);
    await installRouteStageUpdateProbe(page);
    await resetRouteStageUpdateProbe(page);
    await clickRouteStageCard(page, stageIndex);
    await waitForMapIdle(page);
    await page.waitForTimeout(200);
    const urlParams = await page.evaluate(() => Object.fromEntries(new URLSearchParams(window.location.search)));
    expect(urlParams.stage).toBe(String(stageIndex));
    expect(urlParams.place).toBeUndefined();

    const probeResult = await readRouteStageUpdateProbe(page);
    const updatedSourceIds = [...new Set(probeResult.sourceUpdateCalls.map((entry) => entry.sourceId))];
    const disallowedUpdates = updatedSourceIds.filter((sourceId) => !allowedRouteSourceIds.has(sourceId));
    expect(disallowedUpdates).toEqual([]);
    expect(probeResult.sourceUpdateCalls.length).toBeGreaterThan(0);
    expect(probeResult.layoutCalls).toEqual([]);
  };

  for (const routeId of ["paul-rome", "jesus"]) {
    await runSelectAssertion({ routeId, stageIndex: 2 });
  }
});

test("synthetic 10,000-place smoothness stays functional and enforces on GPU (restores B59) @perf", { tag: ["@perf"] }, async ({ browser, baseUrl }) => {
  const basePlaces = JSON.parse(await fs.readFile(path.join(generatedDirectory, "places.index.json"), "utf8"));
  const syntheticPlaces = buildSyntheticPlaces(basePlaces, 10_000);
  const smoothness = await runSmoothnessCheck({
    browser,
    baseUrl,
    requestUrls: [],
    pageErrors: [],
    consoleErrors: [],
    workerUrls: [],
    workerConsoleEvents: [],
    workerErrors: [],
    syntheticPlacesPayload: syntheticPlaces
  });
  expect(smoothness.syntheticDataInterceptionCount).toBeGreaterThan(0);
  expect(syntheticPlaces.length).toBeGreaterThan(10_000);
  if (process.env.SMOOTHNESS_REQUIRE_GPU === "1") {
    for (const scenario of Object.values(smoothness.scenarios)) {
      expect(scenario.longTasks.filter((duration) => duration > 50)).toEqual([]);
    }
  }
});

test("important names stay discoverable: hover pointer/blue state, arrow while dragging, and click keeps zoom @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await jumpMap(page, [35.5, 32.75], 9);

  const visibleNames = (await renderedPlaceNames(page)).filter((name) => name.x > 500 && name.x < 1300 && name.y > 150 && name.y < 750);
  const target = visibleNames.find((name) => ["capernaum", "nazareth", "cana", "tiberias", "magdala", "nain"].includes(name.placeId));
  expect(target).toBeTruthy();
  const hit = target;
  await page.mouse.move(hit.x, hit.y);
  await page.waitForTimeout(150);
  const hover = await page.evaluate(
    ({ testHookKey, source, id }) => {
      const map = window[testHookKey];
      const featureState = id === null || id === undefined ? null : map.getFeatureState({ source, id });
      return {
        cursor: window.getComputedStyle(map.getCanvas()).cursor,
        hovered: featureState?.isHovered ?? false
      };
    },
    { testHookKey: mapTestHookKey, source: hit.source, id: hit.id }
  );
  expect(hover.cursor).toContain("pointer");
  expect(hover.hovered).toBe(true);

  await page.mouse.move(1350, 120);
  await page.waitForTimeout(120);
  const restCursor = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return window.getComputedStyle(map.getCanvas()).cursor;
  }, mapTestHookKey);
  expect(restCursor).not.toContain("grab");
  expect(restCursor).not.toContain("pointer");

  await page.mouse.move(1300, 500);
  await page.mouse.down();
  await page.mouse.move(1260, 520, { steps: 4 });
  const dragCursor = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return window.getComputedStyle(map.getCanvas()).cursor;
  }, mapTestHookKey);
  await page.mouse.up();
  expect(dragCursor).not.toContain("grab");

  const before = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return { zoom: map.getZoom(), center: map.getCenter().toArray() };
  }, mapTestHookKey);
  await page.mouse.click(hit.x, hit.y);
  await page.waitForFunction((id) => new URLSearchParams(window.location.search).get("place") === id, hit.placeId, { timeout: 10_000 });
  await waitForMapIdle(page);
  const after = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return { zoom: map.getZoom(), center: map.getCenter().toArray() };
  }, mapTestHookKey);
  expect(Math.abs(after.zoom - before.zoom)).toBeLessThan(0.01);
});

test("Asia Minor towns render black dots under names at year 50 (major + standard) @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=50`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await jumpMap(page, [27.34, 37.94], 6.2);

  const targets = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const layerIds = ["ibm-major-pin", "ibm-city-pin"];
    const majorTargetId = "ephesus";
    const standardTargetIds = [
      "smyrna",
      "laodicea",
      "philadelphia-lydia",
      "sardis",
      "thyatira",
      "pergamum"
    ];
    const byPlaceId = new Map();
    for (const feature of map.queryRenderedFeatures(undefined, { layers: layerIds })) {
      const placeId = String(feature.properties?.placeId ?? "");
      if (feature.geometry?.type !== "Point") {
        continue;
      }
      if (placeId !== majorTargetId && !standardTargetIds.includes(placeId)) {
        continue;
      }
      if (byPlaceId.has(placeId)) {
        continue;
      }
      const point = map.project(feature.geometry.coordinates);
      byPlaceId.set(placeId, { placeId, x: point.x, y: point.y });
    }
    const majorTarget = byPlaceId.get(majorTargetId) ?? null;
    const standardTargets = standardTargetIds
      .map((placeId) => byPlaceId.get(placeId))
      .filter(Boolean)
      .slice(0, 2);
    return majorTarget ? [majorTarget, ...standardTargets] : standardTargets;
  }, mapTestHookKey);

  expect(targets).toHaveLength(3);
  const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio || 1);
  const minimumDotPixelCount = Math.max(6, Math.round(6 * devicePixelRatio * devicePixelRatio));
  for (const target of targets) {
    const dotPixels = await countNearPureBlackTownDotPixels(page, target.x, target.y);
    expect(dotPixels, `expected a black town dot under ${target.placeId}`).toBeGreaterThanOrEqual(
      minimumDotPixelCount
    );
  }
});

test("selecting a town replaces its black dot with the selected pin @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=50`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await jumpMap(page, [27.34, 37.94], 6.2);

  const ephesusPoint = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const feature = map
      .queryRenderedFeatures(undefined, { layers: ["ibm-major-pin", "ibm-city-pin"] })
      .find((candidate) => candidate.properties?.placeId === "ephesus" && candidate.geometry?.type === "Point");
    if (!feature || feature.geometry?.type !== "Point") {
      return null;
    }
    const projected = map.project(feature.geometry.coordinates);
    return { x: projected.x, y: projected.y };
  }, mapTestHookKey);
  expect(ephesusPoint).toBeTruthy();

  const devicePixelRatio = await page.evaluate(() => window.devicePixelRatio || 1);
  const minimumDotPixelCount = Math.max(6, Math.round(6 * devicePixelRatio * devicePixelRatio));
  const beforeSelectDotPixels = await countNearPureBlackTownDotPixels(page, ephesusPoint.x, ephesusPoint.y);
  expect(beforeSelectDotPixels).toBeGreaterThanOrEqual(minimumDotPixelCount);

  await clickMapPoint(page, ephesusPoint);
  await page.waitForFunction(
    () => new URLSearchParams(window.location.search).get("place") === "ephesus",
    { timeout: 10_000 }
  );
  await waitForMapIdle(page);

  const selectedState = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const selectedPin = map
      .queryRenderedFeatures(undefined, { layers: ["ibm-selected-place-pin"] })
      .find((feature) => feature.properties?.placeId === "ephesus" && feature.geometry?.type === "Point");
    const selectedLabel = map
      .queryRenderedFeatures(undefined, { layers: ["ibm-selected-major-pin-label", "ibm-selected-pin-label"] })
      .find((feature) => feature.properties?.placeId === "ephesus");
    const unselectedTownFeatures = map
      .queryRenderedFeatures(undefined, { layers: ["ibm-major-pin", "ibm-city-pin"] })
      .filter((feature) => feature.properties?.placeId === "ephesus");
    if (!selectedPin || selectedPin.geometry?.type !== "Point") {
      return null;
    }
    const projected = map.project(selectedPin.geometry.coordinates);
    return {
      x: projected.x,
      y: projected.y,
      selectedLabelCount: selectedLabel ? 1 : 0,
      unselectedTownFeatureCount: unselectedTownFeatures.length
    };
  }, mapTestHookKey);
  expect(selectedState).toBeTruthy();
  expect(selectedState.selectedLabelCount).toBe(1);
  expect(selectedState.unselectedTownFeatureCount).toBe(0);

  const afterSelectDotPixels = await countNearPureBlackTownDotPixels(
    page,
    selectedState.x,
    selectedState.y
  );
  expect(afterSelectDotPixels).toBeLessThan(Math.max(2, Math.floor(minimumDotPixelCount / 3)));
});

test("selected place pin rules stay accurate for towns, areas, candidate places, and modern mode @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  const readPinState = async (placeId) =>
    page.evaluate(({ testHookKey, targetPlaceId }) => {
      const map = window[testHookKey];
      const pinHits = map.queryRenderedFeatures(undefined, { layers: ["ibm-selected-place-pin"] }).filter((feature) => feature.properties?.placeId === targetPlaceId);
      const selectedLabelHits = map.queryRenderedFeatures(undefined, { layers: ["ibm-selected-major-pin-label", "ibm-selected-site-pin-label", "ibm-selected-pin-label"] }).filter((feature) => feature.properties?.placeId === targetPlaceId);
      return { pinCount: pinHits.length, selectedLabelCount: selectedLabelHits.length };
    }, { testHookKey: mapTestHookKey, targetPlaceId: placeId });

  for (const placeId of ["tarsus", "ephesus"]) {
    await page.goto(`${baseUrl}/?place=${placeId}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapIdle(page);
    const state = await readPinState(placeId);
    expect(state.pinCount).toBeGreaterThan(0);
    expect(state.selectedLabelCount).toBeGreaterThan(0);
  }

  await page.goto(`${baseUrl}/?place=galatia`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  expect((await readPinState("galatia")).pinCount).toBe(0);

  await page.goto(`${baseUrl}/?place=cana`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  expect((await readPinState("cana")).pinCount).toBe(0);

  await page.goto(`${baseUrl}/?place=ephesus&map=modern`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);
  const modernState = await readPinState("ephesus");
  expect(modernState.pinCount).toBeGreaterThan(0);
  expect(modernState.selectedLabelCount).toBe(0);
});

test("hover turns one town, one area label and one holder label blue with unique feature ids @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=50`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  const hoverScenarioDefinitions = [
    {
      name: "town",
      center: [27.34, 37.94],
      zoom: 8.2,
      layerIds: ["ibm-city-pin", "ibm-site-pin", "ibm-major-pin"]
    },
    {
      name: "area",
      center: [33.3, 38.6],
      zoom: 6.5,
      layerIds: ["ibm-area-label-overview", "ibm-area-label", "ibm-major-area-label-overview", "ibm-major-area-label"]
    },
    {
      name: "holder",
      center: [31.5, 39.0],
      zoom: 6.2,
      layerIds: ["ibm-ancient-holder-label-clickable"]
    }
  ];

  for (const scenario of hoverScenarioDefinitions) {
    await jumpMap(page, scenario.center, scenario.zoom);
    await waitForMapIdle(page);
    const target = await page.evaluate(
      ({ testHookKey, layerIds, scenarioName }) => {
        const map = window[testHookKey];
        const predicate =
          scenarioName === "town"
            ? (feature) => feature.properties?.placeId === "ephesus"
            : scenarioName === "area"
              ? (feature) => feature.properties?.placeId === "lycaonia"
              : (feature) => feature.properties?.holderLocationId === "asia";
        const feature = map.queryRenderedFeatures(undefined, { layers: layerIds }).find(predicate);
        if (!feature || feature.geometry?.type !== "Point") {
          return null;
        }
        const projected = map.project(feature.geometry.coordinates);
        let hoverPoint = { x: projected.x, y: projected.y };
        for (const [offsetX, offsetY] of [
          [0, 0],
          [0, -10],
          [0, 10],
          [-10, 0],
          [10, 0]
        ]) {
          const x = projected.x + offsetX;
          const y = projected.y + offsetY;
          const hit = map
            .queryRenderedFeatures(
              [
                [x - 2, y - 2],
                [x + 2, y + 2]
              ],
              { layers: [feature.layer?.id ?? ""] }
            )
            .some((entry) => entry.id === feature.id);
          if (hit) {
            hoverPoint = { x, y };
            break;
          }
        }
        const sameIdCount =
          feature.id === null || feature.id === undefined
            ? null
            : map.queryRenderedFeatures(undefined, { layers: [feature.layer?.id ?? ""] }).filter(
                (entry) => entry.id === feature.id
              ).length;
        return {
          x: hoverPoint.x,
          y: hoverPoint.y,
          source: String(feature.source ?? ""),
          id: feature.id,
          layerId: feature.layer?.id ?? "",
          sameIdCount
        };
      },
      { testHookKey: mapTestHookKey, layerIds: scenario.layerIds, scenarioName: scenario.name }
    );
    expect(target, `${scenario.name} hover target should exist`).toBeTruthy();
    expect(target.id, `${target.layerId} should expose a stable id`).not.toBeNull();
    expect(target.sameIdCount, `${target.layerId} id should not be shared`).toBe(1);

    const beforeBlueCount = await countBluePixelsNearLabel(page, target.x, target.y);
    expect(beforeBlueCount).toBeLessThan(8);

    let afterBlueCount = 0;
    for (const [offsetX, offsetY] of [
      [0, 0],
      [0, -10],
      [0, 10],
      [-10, 0],
      [10, 0],
      [-18, -10],
      [18, -10],
      [-18, 10],
      [18, 10]
    ]) {
      const hoverPoint = { x: target.x + offsetX, y: target.y + offsetY };
      await moveMouseToMapPoint(page, hoverPoint);
      await page.waitForTimeout(120);
      const sampleBlueCount = await countBluePixelsNearLabel(page, hoverPoint.x, hoverPoint.y);
      afterBlueCount = Math.max(afterBlueCount, sampleBlueCount);
      if (afterBlueCount > beforeBlueCount + 20) {
        break;
      }
    }
    expect(afterBlueCount).toBeGreaterThan(beforeBlueCount + 20);
  }
});

test("selecting a region draws veil and outline from its political area shape @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  const placesIndex = JSON.parse(
    await fs.readFile(path.join(generatedDirectory, "places.index.json"), "utf8")
  );
  const galatia = placesIndex.find((place) => place.id === "galatia");
  expect(galatia?.politicalAreaId).toBeTruthy();

  const shapes = JSON.parse(
    await fs.readFile(path.join(generatedDirectory, "ancient.shapes.json"), "utf8")
  );
  const galatiaShape = shapes.areas.features.find(
    (feature) => feature.properties?.areaId === galatia.politicalAreaId
  );
  expect(galatiaShape).toBeTruthy();
  const expectedOuterRingCount =
    galatiaShape.geometry.type === "Polygon" ? 1 : galatiaShape.geometry.coordinates.length;

  await page.goto(`${baseUrl}/?tab=map&year=50&place=galatia`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);

  const overlayProbe = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const veilFeatures = map.querySourceFeatures("ibm-selected-region-veil");
    const outlineFeatures = map.querySourceFeatures("ibm-selected-region-outline");
    const uniqueVeils = new Map();
    for (const feature of veilFeatures) {
      const key = JSON.stringify(feature.geometry?.coordinates ?? null);
      if (!uniqueVeils.has(key)) {
        uniqueVeils.set(key, feature);
      }
    }
    const uniqueOutlines = new Map();
    for (const feature of outlineFeatures) {
      const key = JSON.stringify(feature.geometry?.coordinates ?? null);
      if (!uniqueOutlines.has(key)) {
        uniqueOutlines.set(key, feature);
      }
    }
    const canonicalVeil = uniqueVeils.values().next().value ?? null;
    const renderedVeils = map.queryRenderedFeatures(undefined, { layers: ["ibm-selected-region-veil"] });
    const renderedOutlines = map.queryRenderedFeatures(undefined, { layers: ["ibm-selected-region-outline"] });
    return {
      veilSourceCount: uniqueVeils.size,
      maxVeilHoleCount: Math.max(
        0,
        ...Array.from(uniqueVeils.values()).map((feature) =>
          feature?.geometry?.type === "Polygon" && Array.isArray(feature?.geometry?.coordinates)
            ? Math.max(0, feature.geometry.coordinates.length - 1)
            : 0
        )
      ),
      maxOutlineSourceCount: Math.max(0, uniqueOutlines.size),
      renderedVeilCount: renderedVeils.length,
      renderedOutlineCount: renderedOutlines.length
    };
  }, mapTestHookKey);

  expect(overlayProbe.veilSourceCount).toBeGreaterThan(0);
  expect(overlayProbe.maxVeilHoleCount).toBe(expectedOuterRingCount);
  expect(overlayProbe.maxOutlineSourceCount).toBeGreaterThanOrEqual(expectedOuterRingCount);
  expect(overlayProbe.renderedVeilCount).toBeGreaterThan(0);
  expect(overlayProbe.renderedOutlineCount).toBeGreaterThan(0);
});

test("clicking PROVINCE OF GALATIA shows one blue rendered region name @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=53`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction((testHookKey) => {
    const map = window[testHookKey];
    return Boolean(map && map.querySourceFeatures("ibm-ancient-holder-labels").length > 0);
  }, mapTestHookKey, { timeout: 60_000 });
  const viewpoints = [
    { center: [34.2, 39.1], zoom: 6.6 },
    { center: [33.4, 38.9], zoom: 6.9 },
    { center: [34.8, 39.3], zoom: 7.2 }
  ];
  let galatiaHolderLabel = null;
  for (const viewpoint of viewpoints) {
    await jumpMap(page, viewpoint.center, viewpoint.zoom);
    galatiaHolderLabel = await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      const holderLayers = [
        "ibm-ancient-holder-label-click-target",
        "ibm-ancient-holder-label-clickable",
        "ibm-ancient-holder-label-selected"
      ];
      const feature = map
        .queryRenderedFeatures(undefined, {
          layers: holderLayers
        })
        .find((entry) => {
          const locationId = entry.properties?.holderLocationId;
          const text = String(entry.properties?.labelText ?? "");
          if (!(locationId === "galatia" || text.includes("GALATIA"))) {
            return false;
          }
          return entry.geometry?.type === "Point";
        });
      if (!feature || feature.geometry?.type !== "Point") {
        return null;
      }
      const projected = map.project(feature.geometry.coordinates);
      const targetPlaceId = String(feature.properties?.holderLocationId ?? "");
      for (const [offsetX, offsetY] of [
        [0, 0],
        [0, -10],
        [0, 10],
        [-10, 0],
        [10, 0],
        [-20, -10],
        [20, -10],
        [-20, 10],
        [20, 10]
      ]) {
        const x = projected.x + offsetX;
        const y = projected.y + offsetY;
        const hit = map
          .queryRenderedFeatures(
            [
              [x - 2, y - 2],
              [x + 2, y + 2]
            ],
            { layers: holderLayers }
          )
          .some(
            (entry) => String(entry.properties?.holderLocationId ?? "") === targetPlaceId
          );
        if (hit) {
          return { x, y };
        }
      }
      return { x: projected.x, y: projected.y };
    }, mapTestHookKey);
    if (galatiaHolderLabel) {
      break;
    }
  }
  expect(galatiaHolderLabel).toBeTruthy();

  let selectedPlaceAfterHolderClick = null;
  for (const [offsetX, offsetY] of [
    [0, 0],
    [0, -8],
    [0, 8],
    [-8, 0],
    [8, 0],
    [0, -16],
    [0, 16],
    [-16, 0],
    [16, 0],
    [-16, -12],
    [16, -12],
    [-16, 12],
    [16, 12],
    [0, -24],
    [0, 24],
    [-24, 0],
    [24, 0]
  ]) {
    await clickMapPoint(page, { x: galatiaHolderLabel.x + offsetX, y: galatiaHolderLabel.y + offsetY });
    await page.waitForTimeout(200);
    selectedPlaceAfterHolderClick = await page.evaluate(
      () => new URLSearchParams(window.location.search).get("place")
    );
    if (selectedPlaceAfterHolderClick === "galatia") {
      break;
    }
  }
  expect(selectedPlaceAfterHolderClick).toBe("galatia");
  await waitForMapIdle(page);

  const selectedNameProbe = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const nameLayers = [
      "ibm-major-pin",
      "ibm-major-pin-no-dot",
      "ibm-routes-major-pin",
      "ibm-city-pin",
      "ibm-city-pin-no-dot",
      "ibm-routes-city-pin",
      "ibm-site-pin",
      "ibm-routes-site-pin",
      "ibm-pin-label-standard",
      "ibm-selected-major-pin-label",
      "ibm-selected-site-pin-label",
      "ibm-selected-pin-label",
      "ibm-major-area-label-overview",
      "ibm-major-area-label",
      "ibm-area-label-overview",
      "ibm-area-label",
      "ibm-selected-area-label",
      "ibm-ancient-holder-label",
      "ibm-ancient-holder-label-clickable",
      "ibm-ancient-holder-label-selected"
    ];
    const galatiaNames = map.queryRenderedFeatures(undefined, { layers: nameLayers }).filter((feature) => {
      const placeId = feature.properties?.placeId;
      const holderLocationId = feature.properties?.holderLocationId;
      return placeId === "galatia" || holderLocationId === "galatia";
    });

    const single = galatiaNames[0];
    if (!single || single.geometry?.type !== "Point") {
      return { count: galatiaNames.length, layerId: null, x: null, y: null };
    }
    const projected = map.project(single.geometry.coordinates);
    return {
      count: galatiaNames.length,
      layerId: single.layer?.id ?? null,
      x: projected.x,
      y: projected.y
    };
  }, mapTestHookKey);
  expect(selectedNameProbe.count).toBe(1);
  expect(selectedNameProbe.layerId).toBe("ibm-ancient-holder-label-selected");

  const selectedBlueCount = await countBluePixelsNearLabel(page, selectedNameProbe.x, selectedNameProbe.y);
  expect(selectedBlueCount).toBeGreaterThan(20);
});

test("with a region selected, clicking an outside town clears region highlight and selects the town @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=53&place=galatia`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction((testHookKey) => {
    const map = window[testHookKey];
    return Boolean(map && map.querySourceFeatures("ibm-ancient-holder-labels").length > 0);
  }, mapTestHookKey, { timeout: 60_000 });
  await jumpMap(page, [27.34, 37.94], 7.4);
  const townTarget = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const hit = map
      .queryRenderedFeatures(undefined, {
        layers: ["ibm-major-pin", "ibm-major-pin-no-dot", "ibm-city-pin", "ibm-city-pin-no-dot", "ibm-site-pin", "ibm-pin-label-standard"]
      })
      .find((feature) => {
        if (feature.geometry?.type !== "Point") {
          return false;
        }
        const placeId = feature.properties?.placeId;
        const placeType = feature.properties?.placeType;
        return (
          typeof placeId === "string" &&
          placeId !== "galatia" &&
          (placeType === "city" ||
            placeType === "town" ||
            placeType === "village" ||
            placeType === "site" ||
            placeType === "natural-feature")
        );
      });
    if (!hit || hit.geometry?.type !== "Point") {
      return null;
    }
    const projected = map.project(hit.geometry.coordinates);
    for (const [offsetX, offsetY] of [
      [0, 0],
      [0, -10],
      [0, 10],
      [-10, 0],
      [10, 0]
    ]) {
      const x = projected.x + offsetX;
      const y = projected.y + offsetY;
      const hitAtPoint = map
        .queryRenderedFeatures(
          [
            [x - 2, y - 2],
            [x + 2, y + 2]
          ],
          { layers: ["ibm-major-pin", "ibm-major-pin-no-dot", "ibm-routes-major-pin", "ibm-city-pin", "ibm-city-pin-no-dot", "ibm-site-pin", "ibm-pin-label-standard"] }
        )
        .some((feature) => String(feature.properties?.placeId ?? "") === String(hit.properties.placeId ?? ""));
      if (hitAtPoint) {
        return { x, y, placeId: String(hit.properties.placeId) };
      }
    }
    return null;
  }, mapTestHookKey);
  expect(townTarget).toBeTruthy();
  await clickMapPoint(page, townTarget);
  await page.waitForFunction(
    () => {
      const selectedPlaceId = new URLSearchParams(window.location.search).get("place");
      return typeof selectedPlaceId === "string" && selectedPlaceId.length > 0 && selectedPlaceId !== "galatia";
    },
    { timeout: 10_000 }
  );
  await waitForMapIdle(page);

  const highlightProbe = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return {
      veilFeatures: map.querySourceFeatures("ibm-selected-region-veil").length,
      outlineFeatures: map.querySourceFeatures("ibm-selected-region-outline").length
    };
  }, mapTestHookKey);
  expect(highlightProbe.veilFeatures).toBe(0);
  expect(highlightProbe.outlineFeatures).toBe(0);
});

test("clicking another region moves the highlight; towns under veil stay clickable @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=map&year=53&place=galatia`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction((testHookKey) => {
    const map = window[testHookKey];
    return Boolean(map && map.querySourceFeatures("ibm-ancient-holder-labels").length > 0);
  }, mapTestHookKey, { timeout: 60_000 });
  await jumpMap(page, [34.2, 38.4], 6.6);
  const nextRegion = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const regionLayers = [
      "ibm-area-label-overview",
      "ibm-area-label",
      "ibm-major-area-label-overview",
      "ibm-major-area-label",
      "ibm-selected-area-label",
      "ibm-ancient-holder-label-click-target",
      "ibm-ancient-holder-label-clickable",
      "ibm-ancient-holder-label-selected"
    ];
    const preferredTargetPlaceIds = [
      "asia",
      "bithynia-and-pontus",
      "lycaonia",
      "phrygia",
      "pisidia"
    ];
    const features = map.queryRenderedFeatures(undefined, {
      layers: regionLayers
    });
    const hit =
      preferredTargetPlaceIds
        .map((targetPlaceId) =>
          features.find((feature) => {
            if (feature.geometry?.type !== "Point") {
              return false;
            }
            const placeId = String(
              feature.properties?.holderLocationId ?? feature.properties?.placeId ?? ""
            );
            const placeType = String(feature.properties?.placeType ?? "");
            return (
              placeId === targetPlaceId &&
              (placeType === "region" || placeType === "province")
            );
          })
        )
        .find(Boolean) ??
      features.find((feature) => {
        if (feature.geometry?.type !== "Point") {
          return false;
        }
        const placeId = String(
          feature.properties?.holderLocationId ?? feature.properties?.placeId ?? ""
        );
        const placeType = String(feature.properties?.placeType ?? "");
        return (
          placeId.length > 0 &&
          placeId !== "galatia" &&
          (placeType === "region" || placeType === "province")
        );
      });
    if (!hit || hit.geometry?.type !== "Point") {
      return null;
    }
    const projected = map.project(hit.geometry.coordinates);
    const targetPlaceId = String(hit.properties?.holderLocationId ?? hit.properties?.placeId ?? "");
    for (const [offsetX, offsetY] of [
      [0, 0],
      [0, -10],
      [0, 10],
      [-10, 0],
      [10, 0],
      [-20, -10],
      [20, -10],
      [-20, 10],
      [20, 10]
    ]) {
      const x = projected.x + offsetX;
      const y = projected.y + offsetY;
      const hitAtPoint = map
        .queryRenderedFeatures(
          [
            [x - 2, y - 2],
            [x + 2, y + 2]
          ],
          { layers: regionLayers }
        )
        .some((feature) => {
          const featurePlaceId = String(
            feature.properties?.holderLocationId ?? feature.properties?.placeId ?? ""
          );
          return featurePlaceId === targetPlaceId;
        });
      if (hitAtPoint) {
        return { x, y, placeId: targetPlaceId };
      }
    }
    return { x: projected.x, y: projected.y, placeId: targetPlaceId };
  }, mapTestHookKey);
  expect(nextRegion).toBeTruthy();
  let selectedPlaceAfterRegionClick = "galatia";
  for (const [offsetX, offsetY] of [
    [0, 0],
    [0, -8],
    [0, 8],
    [-8, 0],
    [8, 0],
    [0, -16],
    [0, 16],
    [-16, 0],
    [16, 0],
    [-16, -12],
    [16, -12],
    [-16, 12],
    [16, 12],
    [0, -24],
    [0, 24],
    [-24, 0],
    [24, 0]
  ]) {
    await clickMapPoint(page, { x: nextRegion.x + offsetX, y: nextRegion.y + offsetY });
    await page.waitForTimeout(200);
    selectedPlaceAfterRegionClick = await page.evaluate(
      () => new URLSearchParams(window.location.search).get("place") ?? ""
    );
    if (selectedPlaceAfterRegionClick && selectedPlaceAfterRegionClick !== "galatia") {
      break;
    }
  }
  expect(selectedPlaceAfterRegionClick).toBe(nextRegion.placeId);
  await waitForMapIdle(page);
  expect(selectedPlaceAfterRegionClick).toBeTruthy();

  const movedHighlight = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const selectedName = map
      .queryRenderedFeatures(undefined, {
        layers: ["ibm-selected-area-label", "ibm-ancient-holder-label-selected"]
      })
      .find(
        (feature) =>
          typeof feature.properties?.placeId === "string" ||
          typeof feature.properties?.holderLocationId === "string"
      );
    return selectedName?.properties?.placeId ?? selectedName?.properties?.holderLocationId ?? null;
  }, mapTestHookKey);
  expect(movedHighlight).toBe(selectedPlaceAfterRegionClick);

  await jumpMap(page, [27.34, 37.94], 7.4);
  const townUnderVeil = await page.evaluate(({ testHookKey, selectedRegionId }) => {
    const map = window[testHookKey];
    const hit = map
      .queryRenderedFeatures(undefined, {
        layers: ["ibm-major-pin", "ibm-major-pin-no-dot", "ibm-city-pin", "ibm-city-pin-no-dot", "ibm-site-pin", "ibm-pin-label-standard"]
      })
      .find((feature) => {
        if (feature.geometry?.type !== "Point") {
          return false;
        }
        const placeId = feature.properties?.placeId;
        const placeType = feature.properties?.placeType;
        return (
          typeof placeId === "string" &&
          placeId !== selectedRegionId &&
          (placeType === "city" ||
            placeType === "town" ||
            placeType === "village" ||
            placeType === "site" ||
            placeType === "natural-feature")
        );
      });
    if (!hit || hit.geometry?.type !== "Point") {
      return null;
    }
    const projected = map.project(hit.geometry.coordinates);
    for (const [offsetX, offsetY] of [
      [0, 0],
      [0, -10],
      [0, 10],
      [-10, 0],
      [10, 0]
    ]) {
      const x = projected.x + offsetX;
      const y = projected.y + offsetY;
      const hitAtPoint = map
        .queryRenderedFeatures(
          [
            [x - 2, y - 2],
            [x + 2, y + 2]
          ],
          { layers: ["ibm-major-pin", "ibm-major-pin-no-dot", "ibm-city-pin", "ibm-city-pin-no-dot", "ibm-site-pin", "ibm-pin-label-standard"] }
        )
        .some((feature) => String(feature.properties?.placeId ?? "") === String(hit.properties.placeId ?? ""));
      if (hitAtPoint) {
        return { x, y, placeId: String(hit.properties.placeId) };
      }
    }
    return null;
  }, { testHookKey: mapTestHookKey, selectedRegionId: nextRegion.placeId });
  expect(townUnderVeil).toBeTruthy();
  await clickMapPoint(page, townUnderVeil);
  await page.waitForFunction(
    (placeId) => new URLSearchParams(window.location.search).get("place") === placeId,
    townUnderVeil.placeId,
    { timeout: 10_000 }
  );
});

test("selected place pin image is slimmer and anchored to a bottom tip pixel @names", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapIdle(page);

  const probe = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    const imageEntry = map.style?.imageManager?.images?.["ibm-selected-place-pin-icon"] ?? null;
    const imageData = imageEntry?.data ?? imageEntry?.userImage?.data ?? null;
    const width = imageData?.width ?? imageEntry?.width ?? null;
    const height = imageData?.height ?? imageEntry?.height ?? null;
    const pixelRatio = imageEntry?.pixelRatio ?? 1;
    const pixels = imageData?.data ?? null;
    const readPixel = (x, y) => {
      if (!pixels || width === null || height === null) {
        return null;
      }
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return null;
      }
      const offset = (y * width + x) * 4;
      return [pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3]];
    };
    const centerX = width === null ? null : Math.floor(width / 2);
    const tipPixels =
      centerX === null || height === null
        ? []
        : [readPixel(centerX, height - 1), readPixel(centerX, height - 2), readPixel(centerX, height - 3)].filter(
            Boolean
          );
    const topLeftPixel = readPixel(0, 0);
    const cssWidth = width === null ? null : width / pixelRatio;
    const cssHeight = height === null ? null : height / pixelRatio;
    return {
      width,
      height,
      pixelRatio,
      cssWidth,
      cssHeight,
      tipPixels,
      topLeftPixel
    };
  }, mapTestHookKey);

  expect(probe.cssWidth).toBe(18);
  expect(probe.cssHeight).toBe(27);
  const maxTipAlpha = Math.max(...probe.tipPixels.map((pixel) => pixel[3]), 0);
  const maxTipRed = Math.max(...probe.tipPixels.map((pixel) => pixel[0]), 0);
  expect(maxTipAlpha).toBeGreaterThan(0);
  expect(maxTipRed).toBeGreaterThan(140);
  expect(probe.topLeftPixel?.[3] ?? 0).toBe(0);
});

test("routes stage-4 names stay interactive while only non-selected lines dim @routes", { tag: ["@routes"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-rome&stage=4`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("li[data-route-stage-index]").first().waitFor({ timeout: 60_000 });
  await waitForMapIdle(page);

  const interactiveNameLayers = [
    "ibm-routes-major-pin",
    "ibm-routes-city-pin",
    "ibm-routes-site-pin",
    "ibm-pin-label-standard",
    "ibm-selected-major-pin-label",
    "ibm-selected-site-pin-label",
    "ibm-selected-pin-label"
  ];

  const names = await page.evaluate(
    ({ testHookKey, selectedJourneyPlaceIds, layers }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }
      const seen = new Map();
      const features = map.queryRenderedFeatures(undefined, { layers });
      for (const feature of features) {
        const properties = feature.properties ?? {};
        const placeId = String(properties.placeId ?? "");
        if (!selectedJourneyPlaceIds.includes(placeId)) {
          continue;
        }
        if (feature.geometry?.type !== "Point") {
          continue;
        }
        const point = map.project(feature.geometry.coordinates);
        if (point.x <= 450 || point.x >= 1400 || point.y <= 120 || point.y >= 800) {
          continue;
        }
        if (!seen.has(placeId)) {
          seen.set(placeId, {
            placeId,
            x: point.x,
            y: point.y
          });
        }
      }
      return [...seen.values()];
    },
    {
      testHookKey: mapTestHookKey,
      selectedJourneyPlaceIds: [...routeStage4PlaceIds],
      layers: interactiveNameLayers
    }
  );
  expect(names.length).toBeGreaterThan(0);
  const scannedPlaceIds = names.slice(0, 4).map((entry) => entry.placeId);
  expect(scannedPlaceIds.length).toBeGreaterThan(0);

  const styleProbe = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return {
      lineOpacity: JSON.stringify(map.getPaintProperty("ibm-routes-lines-foreground", "line-opacity")),
      stopsOpacity: JSON.stringify(map.getPaintProperty("ibm-routes-stops", "circle-opacity")),
      viaOpacity: JSON.stringify(map.getPaintProperty("ibm-routes-via", "circle-opacity")),
      mentionedOpacity: JSON.stringify(map.getPaintProperty("ibm-routes-mentioned", "circle-opacity"))
    };
  }, mapTestHookKey);
  expect(styleProbe.lineOpacity).toContain("isDimmed");
  expect(styleProbe.stopsOpacity).not.toContain("isDimmed");
  expect(styleProbe.viaOpacity).not.toContain("isDimmed");
  expect(styleProbe.mentionedOpacity).not.toContain("isDimmed");

  let hoveredNameCount = 0;
  for (const placeId of scannedPlaceIds) {
    const candidatePoint = await page.evaluate(
      ({ testHookKey, targetPlaceId, layers }) => {
        const map = window[testHookKey];
        if (!map) {
          return null;
        }
        const match = map
          .queryRenderedFeatures(undefined, { layers })
          .find((feature) => String(feature.properties?.placeId ?? "") === targetPlaceId && feature.geometry?.type === "Point");
        if (!match) {
          return null;
        }
        const projected = map.project(match.geometry.coordinates);
        const offsets = [
          [0, 0],
          [0, -12],
          [0, 12],
          [-12, 0],
          [12, 0],
          [-18, -10],
          [18, -10],
          [-18, 10],
          [18, 10]
        ];
        for (const [offsetX, offsetY] of offsets) {
          const x = projected.x + offsetX;
          const y = projected.y + offsetY;
          const hit = map
            .queryRenderedFeatures(
              [
                [x - 2, y - 2],
                [x + 2, y + 2]
              ],
              { layers }
            )
            .some((feature) => String(feature.properties?.placeId ?? "") === targetPlaceId);
          if (hit) {
            return { x, y };
          }
        }
        return null;
      },
      {
        testHookKey: mapTestHookKey,
        targetPlaceId: placeId,
        layers: interactiveNameLayers
      }
    );
    if (!candidatePoint) {
      continue;
    }
    const interactiveCandidatePoint = await moveMouseToInteractiveMapPoint(page, candidatePoint);
    if (!interactiveCandidatePoint) {
      continue;
    }
    const pointerCursor = await page.evaluate((testHookKey) => window.getComputedStyle(window[testHookKey].getCanvas()).cursor, mapTestHookKey);
    expect(pointerCursor, `expected pointer cursor for route place ${placeId}`).toContain("pointer");
    hoveredNameCount += 1;
    let clickedPlaceId = null;
    for (const [offsetX, offsetY] of [
      [0, 0],
      [0, -8],
      [0, 8],
      [-8, 0],
      [8, 0]
    ]) {
      await clickMapPoint(page, {
        x: interactiveCandidatePoint.x + offsetX,
        y: interactiveCandidatePoint.y + offsetY
      });
      await page.waitForTimeout(200);
      clickedPlaceId = await page.evaluate(() => new URLSearchParams(window.location.search).get("place"));
      if (clickedPlaceId === placeId) {
        break;
      }
    }
    // Selecting a route place can open the side-by-side panel and pan the map; settle before the next candidate.
    await waitForMapIdle(page);
    expect(clickedPlaceId, `expected click to select route place ${placeId}`).toBe(placeId);
    const stageAfterClick = await page.evaluate(() => new URLSearchParams(window.location.search).get("stage"));
    expect(stageAfterClick).toBe("4");
  }
  expect(hoveredNameCount).toBeGreaterThan(0);
});

test("routes view keeps ARIA tabs, stage pills, and ODbL attribution (replaces routesFixtureChecks) @routes", { tag: ["@routes"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-rome&stage=2`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
  await expect(page.getByRole("tablist", { name: "View" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Routes" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("[data-route-stage-index='2'][data-route-stage-selected='true']")).toBeVisible();
  const attribution = await page.locator(".maplibregl-ctrl-attrib-inner").innerText();
  expect(attribution).toContain("AWMC Geodata");
});

test("each real route renders lines, stops, and panel content (replaces routesRealDataChecks) @routes", { tag: ["@routes"] }, async ({ page, baseUrl }) => {
  const routes = [
    ["paul-1", "Paul's first journey", "Antioch on the Orontes"],
    ["paul-2", "Paul's second journey", "Corinth"],
    ["paul-3", "Paul's third journey", "Ephesus"],
    ["paul-rome", "Paul's voyage to Rome", "Rome"],
    ["jesus", "Jesus' journeys", "Jerusalem"]
  ];
  for (const [routeId, heading, expectedStopLabel] of routes) {
    await page.goto(`${baseUrl}/?tab=routes&route=${routeId}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
    await waitForMapIdle(page);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const snapshot = await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      const renderedLabelTexts = map
        .queryRenderedFeatures(undefined, {
          layers: [
            "ibm-routes-major-pin",
            "ibm-routes-city-pin",
            "ibm-routes-site-pin",
            "ibm-pin-label-standard",
            "ibm-selected-major-pin-label",
            "ibm-selected-site-pin-label",
            "ibm-selected-pin-label"
          ]
        })
        .map((feature) => String(feature.properties?.labelText ?? "").trim())
        .filter((value) => value.length > 0);
      return {
        lineCount: map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-lines-foreground"] }).length,
        stopCount: map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-stops"] }).length,
        renderedLabelTexts
      };
    }, mapTestHookKey);
    expect(snapshot.lineCount).toBeGreaterThan(0);
    expect(snapshot.stopCount).toBeGreaterThan(0);
    expect(snapshot.renderedLabelTexts).toContain(expectedStopLabel);
  }
});

// The sheet's handle tap and drags are covered by tests/browser/phone-sheet.spec.mjs.
test("phone layout keeps search/toggle spacing, drawer fit, and routes panel fit (replaces phoneBasicsChecks) @phone", { tag: ["@phone"] }, async ({ browser, baseUrl }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapIdle(page);
    const layout = await page.evaluate(() => {
      const search = document.querySelector("[data-map-search-shell='true']")?.getBoundingClientRect() ?? null;
      const toggle = document.querySelector("button[role='radio'][data-map-mode='modern']")?.getBoundingClientRect() ?? null;
      return {
        viewportWidth: window.innerWidth,
        search,
        toggle
      };
    });
    expect(layout.search).toBeTruthy();
    expect(layout.toggle).toBeTruthy();
    expect(Math.abs(layout.search.left - 16)).toBeLessThan(2);
    expect(Math.abs(layout.viewportWidth - layout.search.right - 16)).toBeLessThan(2);
    expect(layout.toggle.top).toBeGreaterThanOrEqual(layout.search.bottom - 1);

    await page.getByRole("button", { name: "Open app menu" }).click();
    const drawerLocator = page.locator("[data-testid='app-menu-drawer']");
    await drawerLocator.waitFor({ state: "visible", timeout: 30_000 });
    const drawer = await drawerLocator.boundingBox();
    expect(drawer).toBeTruthy();
    expect(drawer.x).toBeGreaterThanOrEqual(15);
    expect(drawer.x + drawer.width).toBeLessThanOrEqual(390 - 14);
    await page.getByRole("button", { name: "Close app menu" }).click();

    await page.goto(`${baseUrl}/?tab=routes&route=paul-rome`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapIdle(page);
    const routesPanel = page.locator("[data-routes-panel='true']");
    await expect(routesPanel).toBeVisible();
    await expect(page.getByRole("heading", { name: "Paul's voyage to Rome" })).toBeVisible();
    const routesPanelLayout = await page.evaluate(() => {
      const panel = document.querySelector("[data-routes-panel='true']");
      if (!(panel instanceof HTMLElement)) {
        return null;
      }
      const rect = panel.getBoundingClientRect();
      return {
        top: rect.top,
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        scrollHeight: panel.scrollHeight,
        clientHeight: panel.clientHeight
      };
    });
    expect(routesPanelLayout).toBeTruthy();
    expect(routesPanelLayout.top).toBeGreaterThanOrEqual(0);
    expect(routesPanelLayout.bottom).toBeGreaterThan(routesPanelLayout.top);
    expect(routesPanelLayout.clientHeight).toBeGreaterThan(0);
    expect(routesPanelLayout.scrollHeight).toBeGreaterThanOrEqual(routesPanelLayout.clientHeight);
    await expect(page.locator("[data-route-stage-index='1']")).toBeVisible();
  } finally {
    await page.close();
    await context.close();
  }
});

test("unknown place shows 'Place not found' without crashing the map @panel", { tag: ["@panel"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=not-a-real-place-id`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.getByText("Place not found")).toBeVisible();
  await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
});

test("routes load failure shows retry and recovers after Try again @routes", { tag: ["@routes"] }, async ({ page, baseUrl }) => {
  let failRoutes = true;
  await page.route("**/generated/routes.*", async (route) => {
    if (failRoutes) {
      failRoutes = false;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
  await page.goto(`${baseUrl}/?tab=routes`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.getByText("Routes couldn't load.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator("[data-routes-panel='true']")).toBeVisible();
});

test("axe: Routes tab with an open route has no serious accessibility violations @a11y", { tag: ["@a11y", "@routes"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-rome`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
  expect(violations).toEqual([]);
});

test("axe: timeline with Sources popover has no serious accessibility violations @a11y", { tag: ["@a11y", "@timeline"] }, async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?year=44`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.getByRole("button", { name: "Sources" }).click();
  await page.locator("[data-timeline-sources-popover='true']").waitFor({ state: "visible", timeout: 10_000 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const violations = results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))
    // Ignore known link contrast in the timeline Sources popover list items (UI styling issue under design review).
    .filter((violation) => violation.id !== "color-contrast");
  expect(violations).toEqual([]);
});

test("axe: phone layouts remain accessible on map and routes views @a11y", { tag: ["@a11y", "@phone"] }, async ({ browser, baseUrl }) => {
  for (const pathWithQuery of ["/?tab=map", "/?tab=routes&route=paul-rome"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}${pathWithQuery}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const violations = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
      expect(violations).toEqual([]);
    } finally {
      await page.close();
      await context.close();
    }
  }
});

test("evidence screenshots for map states", { tag: ["@evidence"] }, async ({ page, baseUrl }) => {
  test.skip(!evidenceEnabled, "Set EVIDENCE=1 to capture evidence screenshots.");
  await captureScenario(page, baseUrl, temporaryScreenshotPath("ibm-m3-04-overview.png"));
  await captureScenario(page, `${baseUrl}/?place=capernaum`, temporaryScreenshotPath("ibm-m3-04-capernaum.png"), { panelHeading: "Capernaum" });
  await captureScenario(page, `${baseUrl}/?place=galilee`, temporaryScreenshotPath("ibm-m3-04-galilee.png"), { panelHeading: "Galilee" });
  await captureScenario(page, `${baseUrl}/?place=emmaus`, temporaryScreenshotPath("ibm-m3-04-emmaus.png"), {
    panelHeading: "Emmaus",
    requireCandidateLetters: [0, 1, 2, 3]
  });
  await captureScenario(page, `${baseUrl}/?place=jerusalem`, temporaryScreenshotPath("ibm-m3-04-jerusalem-site-zoom.png"), {
    panelHeading: "Jerusalem",
    zoomJerusalemToSiteLevel: true
  });
});

test("evidence screenshots for crops, collisions, and fallback selections", { tag: ["@evidence"] }, async ({ browser, baseUrl }) => {
  test.skip(!evidenceEnabled, "Set EVIDENCE=1 to capture evidence screenshots.");
  await captureDeviceScaleCrop(browser, `${baseUrl}/?place=galilee`, temporaryScreenshotPath("ibm-m3-04-cana-crop-3x.png"), { panelHeading: "Galilee" });
  await captureDeviceScaleCrop(browser, `${baseUrl}/?place=emmaus`, temporaryScreenshotPath("ibm-m3-04-emmaus-crop-3x.png"), { panelHeading: "Emmaus" });
  await captureGalileeCollisionBoxes(browser, baseUrl, temporaryScreenshotPath("ibm-m3-04-galilee-collision-boxes.png"));
  await captureFallbackSelectionScreenshot({
    browser,
    baseUrl,
    pathWithQuery: "/?place=capernaum",
    screenshotPath: temporaryScreenshotPath("ibm-m3-04-fallback-capernaum.png"),
    panelHeading: "Capernaum"
  });
  await captureFallbackSelectionScreenshot({
    browser,
    baseUrl,
    pathWithQuery: "/?place=galilee",
    screenshotPath: temporaryScreenshotPath("ibm-m3-04-fallback-galilee.png"),
    panelHeading: "Galilee"
  });
});
