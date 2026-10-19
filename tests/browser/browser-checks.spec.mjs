import fs from "node:fs/promises";
import path from "node:path";

import {
  buildFixtureGeneratedOutput,
  captureDeviceScaleCrop,
  captureFallbackSelectionScreenshot,
  captureGalileeCollisionBoxes,
  captureScenario,
  loadExpectedDrawerTextFromLicenses,
  temporaryPanelHeaderScreenshotPath,
  temporaryScreenshotPath,
  verifyAboutPlaceLinksOpenPlacesAndSupportBack,
  verifyAreaLabelsAvoidClustersOnOverview,
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
  verifyLabelsAvoidSearchBoxOnOverview,
  verifyMajorPlacesRemainCoveredAcrossZooms,
  verifyModernBoundaryRenderingByDispute,
  verifyModernMapToggle,
  verifyNameLayersDisallowOverlap,
  verifyNoOverlappingNamesAcrossViews,
  verifyNoTimelineUiOnDefaultBuild,
  verifyNormalLoadStaysOnMainBasemap,
  verifyOpeningCameraBaseline,
  verifyOverviewLabelReadabilityAcrossViewports,
  verifyPanelAccessibility,
  verifyPanelDoesNotMutateMapDom,
  verifyPanelSectionOrderAndPhotoCredits,
  verifyPhoneBasics,
  verifyPinLabelRegression,
  verifyPlaceDetailsFetchRaceRecovery,
  verifyPointerCursorAndNearPinClick,
  verifyImportantPlacesFirstOnOverview,
  verifyRoutesTabFixtureScenarios,
  verifyRoutesTabRealDataScenarios,
  verifyScaleBarUpdatesWithZoom,
  verifySearchMenuAndAccessibility,
  verifySelectedMajorNameAlwaysShows,
  verifyShowAllPassages,
  verifySimplePanelHeaderWithCountries,
  verifyTarsusNameShowsAndClicks,
  verifyTimelineTickLabelsDoNotOverlapAcrossLayouts,
  verifyTimelineUiWithDefaultData,
  verifyTimelineUiWithFixtureData,
  verifyTouchTapTargetOnNames
} from "../../scripts/verify-web-export-playwright.mjs";
import { expect, test } from "./fixtures.mjs";

const evidenceEnabled = process.env.EVIDENCE === "1";

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

  expect(tileRequestCount).toBeGreaterThan(0);
  expect(workerUrls.length).toBeGreaterThan(0);
  expect(workerRequestCount).toBeGreaterThan(0);
});

test.describe.serial("shared map page checks", () => {
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

test("normal loads stay on the main basemap in a 5s observation window", { tag: ["@modern", "@network"] }, async ({ browser, baseUrl }) => {
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/", { observeWindowMs: 5_000 });
  await verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, "/?map=modern", { observeWindowMs: 5_000 });
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

test("area labels avoid the search box on overview", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  test.fixme(true, "verifyLabelsAvoidSearchBoxOnOverview is unstable after M5-09 name-placement changes; rewritten in M5-14.");
  await verifyLabelsAvoidSearchBoxOnOverview(page, baseUrl);
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

test("timeline UI behaves with default generated timeline data (quarantined: tooltip target is flaky on software rendering)", { tag: ["@timeline", "@quarantine"] }, async ({ page, baseUrl }) => {
  const timelinePath = path.resolve(process.cwd(), "app/public/generated/ancient.timeline.json");
  const payload = JSON.parse(await fs.readFile(timelinePath, "utf8"));
  await verifyTimelineUiWithDefaultData(page, baseUrl, payload);
});

test("timeline UI hides itself when generated timeline is absent", { tag: ["@timeline"] }, async ({ page, baseUrl }) => {
  test.skip(await fs.access(path.resolve(process.cwd(), "app/public/generated/ancient.timeline.json")).then(() => true).catch(() => false), "Default timeline exists in this build.");
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
  const placesPath = path.resolve(process.cwd(), "app/public/generated/places.index.json");
  const basePlaces = JSON.parse(await fs.readFile(placesPath, "utf8"));
  await verifyAreaLabelsOverviewWithProvinceFixture(browser, baseUrl, basePlaces);
});

test("opening camera baseline remains smooth enough in software renderer", { tag: ["@perf"] }, async ({ browser, baseUrl }) => {
  await verifyOpeningCameraBaseline(browser, baseUrl);
});

test("overview cluster overlap check remains switched off after M5-09; M5-14 rewrites it", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  test.fixme(true, "verifyAreaLabelsAvoidClustersOnOverview depends on grouped major-name labels removed in M5-09; rewritten in M5-14.");
  await verifyAreaLabelsAvoidClustersOnOverview(page, baseUrl);
});

test("important places first overview check remains switched off after M5-09; M5-14 rewrites it", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  test.fixme(true, "verifyImportantPlacesFirstOnOverview depended on grouped-name fallback behavior removed in M5-09; rewritten in M5-14.");
  await verifyImportantPlacesFirstOnOverview(page, baseUrl);
});

test("major places coverage across zooms remains switched off after M5-09; M5-14 rewrites it", { tag: ["@names"] }, async ({ page, baseUrl }) => {
  test.fixme(true, "verifyMajorPlacesRemainCoveredAcrossZooms depended on grouped-name behavior removed in M5-09; rewritten in M5-14.");
  await verifyMajorPlacesRemainCoveredAcrossZooms(page, baseUrl);
});

test("overview label readability check remains switched off after M5-09; M5-14 rewrites it", { tag: ["@names"] }, async ({ browser, baseUrl }) => {
  test.fixme(true, "verifyOverviewLabelReadabilityAcrossViewports is unstable after M5-09 name-placement changes; rewritten in M5-14.");
  await verifyOverviewLabelReadabilityAcrossViewports(browser, baseUrl);
});

test("phone basics remain switched off after M5-09; M5-14 rewrites it", { tag: ["@phone"] }, async () => {
  test.fixme(true, "verifyPhoneBasics depends on grouped-name behavior removed in M5-09; rewritten in M5-14.");
  await verifyPhoneBasics();
});

test("routes fixture scenarios remain switched off after M5-09; M5-14 rewrites them", { tag: ["@routes"] }, async () => {
  test.fixme(true, "verifyRoutesTabFixtureScenarios is unstable after M5-09 feature-state hover updates; rewritten in M5-14.");
  await verifyRoutesTabFixtureScenarios();
});

test("routes real-data scenarios remain switched off after M5-09; M5-14 rewrites them", { tag: ["@routes"] }, async () => {
  test.fixme(true, "verifyRoutesTabRealDataScenarios route-owned label assertions were superseded in M5-09; rewritten in M5-14.");
  await verifyRoutesTabRealDataScenarios();
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
