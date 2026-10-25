import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { buildAncientAppData } from "./lib/ancient-app-data-builder.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const distDirectory = path.join(repositoryRoot, "app", "dist");
const generatedPlacesPath = path.join(
  repositoryRoot,
  "app",
  "dist",
  "generated",
  "places.index.json"
);
const generatedTimelinePath = path.join(
  repositoryRoot,
  "app",
  "dist",
  "generated",
  "ancient.timeline.json"
);
const fixtureAncientSourceDirectory = path.join(repositoryRoot, "tests", "fixtures", "ancient");
const bibliographyPath = path.join(repositoryRoot, "data", "bibliography.json");
const licensesDocumentPath = path.join(repositoryRoot, "docs", "LICENSES.md");

const smoothnessLongTaskLimitMs = 50;
const syntheticPlaceIdPrefix = "synthetic-city-";
const galleryScreenshotDirectoryName = "ibm-m35-gallery";
const panelHeaderScreenshotDirectoryName = "ibm-m3-15";
const fallbackStatusMessage = "The main map service isn't responding. Showing the backup map.";
const fallbackAttributionNeedles = ["VersaTiles", "ESA WorldCover 2021"];
const mainAttributionNeedle = "OpenFreeMap";
const fallbackStylePathNeedle = "versatiles-colorful/style.json";
const modernFallbackStylePathNeedle = "versatiles-colorful-modern/style.json";
const mapTestHookKey = "__ibmMapForTests";
const visibleEntryRefreshHookKey = "__ibmRefreshVisibleEntriesForTests";
const requiredCapernaumPinLabels = ["Capernaum", "Chorazin", "Magdala"];
const minimumGalileePinLabels = 8;
const searchNoResultsSuffix = "Search covers place names only.";
const expectedAntiochSelections = new Set(["antioch-pisidia", "antioch-syria"]);
const fullLicenseDetailsUrl =
  "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/docs/LICENSES.md";
const drawerFocusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const minimumControlHitAreaPx = 44;
// Same value as ACTION_TIMEOUT_MS in playwright.config.mjs; change both together.
const UI_STATE_TIMEOUT_MS = 15_000;
const timelineBorderNote =
  "Borders are approximate, and the routes of some roads are conjectured. Provinces far from the New Testament's places are shown together, and lands whose borders aren't known, such as Abilene, Chalcis or Emesa, aren't drawn. Polemon's kingdom of Pontus, Pontus Galaticus and Armenia Minor share one area because no source draws the lines between them.";
const smoothnessLayerIds = {
  clusters: "ibm-cluster-circle",
  cityPins: "ibm-city-pin",
  pinLabels: "ibm-city-pin",
  clusterSource: "ibm-major-city-pins"
};
const mapLayerIds = {
  areaLabels: [
    "ibm-major-area-label-overview",
    "ibm-major-area-label",
    "ibm-area-label-overview",
    "ibm-area-label",
    "ibm-selected-area-label"
  ],
  majorClusterPins: "ibm-major-pin",
  majorClusterLabelLayers: [],
  clusterPins: "ibm-cluster-circle",
  majorPins: "ibm-major-pin",
  majorPinsNoDot: "ibm-major-pin-no-dot",
  majorPinLabels: ["ibm-major-pin", "ibm-major-pin-no-dot"],
  cityPins: "ibm-city-pin",
  cityPinsNoDot: "ibm-city-pin-no-dot",
  sitePins: "ibm-site-pin",
  sitePinsNoDot: "ibm-site-pin-no-dot",
  candidatePins: "ibm-candidate-pin",
  pinLabels: [
    "ibm-major-pin",
    "ibm-major-pin-no-dot",
    "ibm-routes-major-pin",
    "ibm-city-pin",
    "ibm-city-pin-no-dot",
    "ibm-routes-city-pin",
    "ibm-site-pin",
    "ibm-site-pin-no-dot",
    "ibm-routes-site-pin",
    "ibm-pin-label-standard",
    "ibm-selected-major-pin-label",
    "ibm-selected-site-pin-label",
    "ibm-selected-pin-label"
  ],
  ancientHolderLabels: [
    "ibm-ancient-holder-label",
    "ibm-ancient-holder-label-clickable",
    "ibm-ancient-holder-label-selected"
  ],
  ancientAreaFill: "ibm-ancient-area-fill",
  ancientUncertainFill: "ibm-ancient-area-uncertain-fill",
  ancientBorderState: "ibm-ancient-border-state",
  ancientBorderDisputed: "ibm-ancient-border-disputed",
  modernBorderSolid: "boundary_2",
  modernBorderDisputed: "ibm-modern-boundary-disputed",
  ancientEmpireEdge: "ibm-ancient-empire-edge",
  ancientRoadMajorCasing: "ibm-ancient-road-major-casing",
  ancientRoadMajorKnown: "ibm-ancient-road-major-known",
  ancientCoastline: "ibm-ancient-coastline",
  ancientCoastlineLabel: "ibm-ancient-coastline-label"
};
const allMajorClusterPinLayerIds = mapLayerIds.majorClusterPins ? [mapLayerIds.majorClusterPins] : [];
const allMajorClusterLabelLayerIds = [...mapLayerIds.majorClusterLabelLayers];
const allClusterPinLayerIds = [...allMajorClusterPinLayerIds, mapLayerIds.clusterPins];
const allClusterLabelLayerIds = [...allMajorClusterLabelLayerIds, mapLayerIds.clusterPins];
const allMajorPinLayerIds = [mapLayerIds.majorPins, mapLayerIds.majorPinsNoDot];
const allCityPinLayerIds = [...allMajorPinLayerIds, mapLayerIds.cityPins, mapLayerIds.cityPinsNoDot];
const selectedPlaceLabelLayerIds = ["ibm-selected-major-pin-label", "ibm-selected-pin-label"];
const expectedMajorPinPlaceIds = [
  "jerusalem",
  "nazareth",
  "damascus",
  "ephesus",
  "caesarea-maritima",
  "capernaum",
  "antioch-syria",
  "corinth",
  "bethany",
  "bethlehem",
  "rome",
  "thessalonica",
  "athens",
  "philippi",
  "sea-of-galilee",
  "jericho",
  "laodicea",
  "cana",
  "thyatira",
  "bethany-beyond-the-jordan",
  "colossae",
  "philadelphia-lydia",
  "sardis",
  "smyrna",
  "pergamum"
];
const asiaMinorSevenChurchPlaceIds = [
  "ephesus",
  "smyrna",
  "pergamum",
  "thyatira",
  "sardis",
  "philadelphia-lydia",
  "laodicea"
];
const fixtureImageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="45%" stop-color="#b8c5d4"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#g)"/>
  <rect x="28" y="28" width="216" height="128" fill="#f9fafb"/>
  <rect x="396" y="36" width="216" height="128" fill="#0f172a"/>
  <rect x="52" y="232" width="248" height="132" fill="#1f2937"/>
  <rect x="332" y="232" width="248" height="132" fill="#f3f4f6"/>
  <path d="M0 346 L640 232" stroke="#0b0f1a" stroke-width="20" stroke-opacity="0.5"/>
  <path d="M-24 196 L664 328" stroke="#ffffff" stroke-width="14" stroke-opacity="0.45"/>
</svg>`;
const fixtureImageBuffer = Buffer.from(fixtureImageSvg, "utf8");

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
    case ".mjs":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".ico":
      return "image/x-icon";
    case ".webp":
      return "image/webp";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

async function startStaticServer(rootDirectory) {
  const notFoundPaths = [];

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") {
        pathname = "/index.html";
      }

      const normalizedPath = path.normalize(pathname).replace(/^([\\/])+/, "");
      const candidatePath = path.resolve(path.join(rootDirectory, normalizedPath));

      if (!candidatePath.startsWith(path.resolve(rootDirectory))) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      const fileData = await fs.readFile(candidatePath);
      response.writeHead(200, {
        "Content-Type": contentTypeFor(candidatePath),
        "Cache-Control": "no-cache"
      });
      response.end(fileData);
    } catch {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      if (requestUrl.pathname !== "/generated/ancient.timeline.json") {
        notFoundPaths.push(requestUrl.pathname);
      }
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Could not start local static server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
    notFoundPaths
  };
}

function temporaryScreenshotPath(fileName) {
  return path.join(process.env.TEMP ?? os.tmpdir(), fileName);
}

function temporaryGalleryScreenshotPath(fileName) {
  return path.join(process.env.TEMP ?? os.tmpdir(), galleryScreenshotDirectoryName, fileName);
}

async function readJsonIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function temporaryPanelHeaderScreenshotPath(fileName) {
  return path.join(
    process.env.TEMP ?? os.tmpdir(),
    panelHeaderScreenshotDirectoryName,
    fileName
  );
}

function parseCommonsThumbnailRequest(requestUrl) {
  try {
    const { pathname } = new URL(requestUrl);
    const match = pathname.match(/\/(?<width>330|500|960|1280)px-(?<fileName>[^/]+)$/u);
    if (!match?.groups?.width || !match.groups.fileName) {
      return null;
    }

    return {
      width: Number.parseInt(match.groups.width, 10),
      fileName: match.groups.fileName
    };
  } catch {
    return null;
  }
}

async function readGeneratedPlacePayload(placeId) {
  const candidatePaths = [
    path.join(distDirectory, "generated", "places", `${placeId}.json`),
    path.join(repositoryRoot, "app", "public", "generated", "places", `${placeId}.json`)
  ];

  for (const payloadPath of candidatePaths) {
    try {
      const content = await fs.readFile(payloadPath, "utf8");
      return JSON.parse(content);
    } catch {
      continue;
    }
  }

  throw new Error(`Could not load generated payload for place '${placeId}'.`);
}

function isAiPayloadImage(image) {
  return image?.kind === "ai-reconstruction" || image?.aiGenerated === true;
}

const placePanelSelector = "section[aria-label='Place details']";
const photoCreditsEntriesSelector = `${placePanelSelector} [data-panel-section='photo-credits'] [data-photo-credits-entry='true']`;

function expectedCreditMarkers(image) {
  return isAiPayloadImage(image)
    ? ["AI-generated reconstruction", "Based on: research brief"]
    : ["Photo:", "Wikimedia Commons"];
}

function creditMatchesImage(creditText, image) {
  return expectedCreditMarkers(image).every((marker) => creditText.includes(marker));
}

function photoCreditEntrySelectorForImage(imageIndexOneBased) {
  return `${photoCreditsEntriesSelector}[data-photo-credit-entry-index='${imageIndexOneBased}']`;
}

function panelSectionSelector(sectionId) {
  return `${placePanelSelector} [data-panel-section='${sectionId}']`;
}

function panelSectionToggleSelector(sectionId) {
  return `${panelSectionSelector(sectionId)} [data-panel-section-toggle='${sectionId}']`;
}

function panelSectionContentSelector(sectionId) {
  return `${panelSectionSelector(sectionId)} [data-panel-section-content='${sectionId}']`;
}

function panelSectionChevronSelector(sectionId) {
  return `${panelSectionToggleSelector(sectionId)} [data-panel-section-chevron='${sectionId}']`;
}

async function waitForPanelSectionToggle(page, sectionId) {
  const toggle = page.locator(panelSectionToggleSelector(sectionId)).first();
  await toggle.waitFor({ state: "visible", timeout: 30_000 });
  return toggle;
}

async function readPanelSectionChevronState(page, sectionId) {
  const chevron = page.locator(panelSectionChevronSelector(sectionId)).first();
  await chevron.waitFor({ state: "visible", timeout: 30_000 });
  const ariaHidden = await chevron.getAttribute("aria-hidden");
  if (ariaHidden !== "true") {
    throw new Error(`${sectionId} chevron should be decorative with aria-hidden='true'.`);
  }

  const state = await chevron.getAttribute("data-panel-section-chevron-state");
  if (state !== "expanded" && state !== "collapsed") {
    throw new Error(
      `${sectionId} chevron should expose expanded/collapsed state, got '${state ?? "null"}'.`
    );
  }
  return state;
}

async function readPanelSectionChevronVisualStyle(page, sectionId) {
  const chevron = page.locator(panelSectionChevronSelector(sectionId)).first();
  await chevron.waitFor({ state: "visible", timeout: 30_000 });
  return chevron.evaluate((element) => {
    const chevronStyle = window.getComputedStyle(element);
    const icon = element.querySelector("svg");
    const iconStyle = icon instanceof SVGElement ? window.getComputedStyle(icon) : null;
    return {
      color: chevronStyle.color,
      backgroundColor: chevronStyle.backgroundColor,
      transition: iconStyle?.transition ?? null,
      transitionProperty: iconStyle?.transitionProperty ?? null
    };
  });
}

async function getPanelSectionExpanded(page, sectionId) {
  const toggle = await waitForPanelSectionToggle(page, sectionId);
  return (await toggle.getAttribute("aria-expanded")) === "true";
}

async function setPanelSectionExpanded(page, sectionId, expanded) {
  const toggle = await waitForPanelSectionToggle(page, sectionId);
  const currentExpanded = (await toggle.getAttribute("aria-expanded")) === "true";
  if (currentExpanded === expanded) {
    return;
  }

  await toggle.click();
  await page.waitForFunction(
    ({ selector, expectedExpanded }) => {
      const element = document.querySelector(selector);
      if (!(element instanceof HTMLButtonElement)) {
        return false;
      }
      return element.getAttribute("aria-expanded") === (expectedExpanded ? "true" : "false");
    },
    { selector: panelSectionToggleSelector(sectionId), expectedExpanded: expanded },
    { timeout: 30_000, polling: 100 }
  );
}

async function assertPanelSectionStartsCollapsedWithCount(page, sectionId, label) {
  const toggle = await waitForPanelSectionToggle(page, sectionId);
  const expanded = await toggle.getAttribute("aria-expanded");
  if (expanded !== "false") {
    throw new Error(`${label} should start collapsed, got aria-expanded='${expanded}'.`);
  }

  const labelText = normalizeTextContent((await toggle.textContent()) ?? "");
  const pattern = new RegExp(`^${label} · [0-9]+$`, "u");
  if (!pattern.test(labelText)) {
    throw new Error(`${label} heading must include '· N', got '${labelText}'.`);
  }
}

async function readPhotoCreditEntryForImage(page, imageIndexOneBased) {
  const selector = photoCreditEntrySelectorForImage(imageIndexOneBased);
  await page.waitForSelector(selector, { timeout: 30_000 });
  const text = await page.$eval(
    selector,
    (element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim()
  );
  return text;
}

async function readCurrentGalleryImageNumber(page) {
  const counterLocator = page.locator(
    `${placePanelSelector} [data-panel-section='photos'] [data-photo-counter='true']`
  );
  if ((await counterLocator.count()) === 0) {
    return 1;
  }

  const counterText = ((await counterLocator.first().textContent()) ?? "").trim();
  const [leading] = counterText.split("/");
  const parsed = Number.parseInt(leading?.trim() ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

async function jumpToCurrentImageCredit(page) {
  const currentImageNumber = await readCurrentGalleryImageNumber(page);
  await page
    .locator(`${placePanelSelector} [data-panel-section='photos'] [data-photo-credit-link='true']`)
    .first()
    .click();
  await page.waitForFunction(
    (selector) => {
      const element = document.querySelector(selector);
      return (
        element instanceof HTMLButtonElement && element.getAttribute("aria-expanded") === "true"
      );
    },
    panelSectionToggleSelector("photo-credits"),
    { timeout: 30_000, polling: 100 }
  );
  await page.waitForFunction(() => {
    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLElement &&
      activeElement.getAttribute("data-photo-credits-entry") === "true"
    );
  }, { timeout: UI_STATE_TIMEOUT_MS });

  const focusedEntry = await page.evaluate(() => {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return null;
    }

    const indexText = activeElement.getAttribute("data-photo-credit-entry-index");
    const parsedIndex = Number.parseInt(indexText ?? "", 10);
    return {
      imageIndex: Number.isFinite(parsedIndex) ? parsedIndex : null,
      text: (activeElement.textContent ?? "").replace(/\s+/gu, " ").trim()
    };
  });

  return {
    currentImageNumber,
    focusedEntry,
    photoCreditsExpanded: await getPanelSectionExpanded(page, "photo-credits")
  };
}

async function readCapernaumImages() {
  const payload = await readGeneratedPlacePayload("capernaum");
  const images = payload?.media?.images;
  if (!Array.isArray(images) || images.length < 2) {
    throw new Error("Capernaum's generated payload should have at least two images.");
  }
  return images;
}

function buildGalleryFixturePayload(basePayload) {
  const fixtureImages = [
    {
      id: "capernaum-01",
      kind: "modern",
      url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/M3_5_Fixture_Capernaum_Modern_01.jpg",
      width: 13068,
      height: 2516,
      author: "Fixture Photographer 1",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Modern_01.jpg",
      caption: "Modern Capernaum shoreline",
      aiGenerated: false
    },
    {
      id: "capernaum-02",
      kind: "modern",
      url: "https://upload.wikimedia.org/wikipedia/commons/1/1a/M3_5_Fixture_Capernaum_Modern_02.jpg",
      width: 4032,
      height: 3024,
      author: "Fixture Photographer 2",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Modern_02.jpg",
      caption: "Modern town and lake",
      aiGenerated: false
    },
    {
      id: "capernaum-03",
      kind: "site",
      url: "https://upload.wikimedia.org/wikipedia/commons/2/2a/M3_5_Fixture_Capernaum_Site_01.jpg",
      width: 3600,
      height: 2400,
      author: "Fixture Photographer 3",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Site_01.jpg",
      caption: "Synagogue excavation area",
      aiGenerated: false
    },
    {
      id: "capernaum-04",
      kind: "reconstruction",
      url: "https://upload.wikimedia.org/wikipedia/commons/3/3a/M3_5_Fixture_Capernaum_Reconstruction_01.jpg",
      width: 3200,
      height: 1800,
      author: "Fixture Artist 1",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Reconstruction_01.jpg",
      caption: "Illustrated harbour reconstruction",
      aiGenerated: false
    },
    {
      id: "capernaum-ai-01",
      kind: "ai-reconstruction",
      url: "media/ai/capernaum-ai-01.webp",
      author: "Interactive Bible Map",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage:
        "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts/capernaum.md",
      caption: "AI overview reconstruction of first-century Capernaum",
      aiGenerated: true,
      generator: {
        tool: "DALL·E",
        model: "gpt-image-1",
        date: "2026-09-30"
      },
      promptRef: "Prompt 2: Synagogue and harbour",
      basedOn: ["wikidata:Q59174", "bib:murphy-oconnor-holy-land-guide"]
    },
    {
      id: "capernaum-06",
      kind: "historical",
      url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/M3_5_Fixture_Capernaum_Site_02.jpg",
      width: 3600,
      height: 2400,
      author: "Fixture Photographer 4",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Site_02.jpg",
      caption: "Historical photograph of lakeshore ruins",
      aiGenerated: false
    },
    {
      id: "capernaum-07",
      kind: "reconstruction",
      url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/M3_5_Fixture_Capernaum_Reconstruction_02.jpg",
      width: 3200,
      height: 2000,
      author: "Fixture Artist 2",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Reconstruction_02.jpg",
      caption: "Streetscape reconstruction",
      aiGenerated: false
    },
    {
      id: "capernaum-08",
      kind: "modern",
      url: "https://upload.wikimedia.org/wikipedia/commons/6/6a/M3_5_Fixture_Capernaum_Modern_03.jpg",
      width: 3840,
      height: 2160,
      author: "Fixture Photographer 5",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Modern_03.jpg",
      caption: "Modern lakeside panorama",
      aiGenerated: false
    },
    {
      id: "capernaum-09",
      kind: "site",
      url: "https://upload.wikimedia.org/wikipedia/commons/7/7a/M3_5_Fixture_Capernaum_Site_03.jpg",
      width: 3072,
      height: 2048,
      author: "Fixture Photographer 6",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Site_03.jpg",
      caption: "Excavated structure cluster",
      aiGenerated: false
    },
    {
      id: "capernaum-10",
      kind: "reconstruction",
      url: "https://upload.wikimedia.org/wikipedia/commons/8/8a/M3_5_Fixture_Capernaum_Reconstruction_03.jpg",
      width: 3600,
      height: 2400,
      author: "Fixture Artist 3",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourcePage:
        "https://commons.wikimedia.org/wiki/File:M3_5_Fixture_Capernaum_Reconstruction_03.jpg",
      caption: "Market-quarter reconstruction",
      aiGenerated: false
    }
  ];

  return {
    ...basePayload,
    media: {
      locationId: "capernaum",
      images: fixtureImages
    }
  };
}

async function routeGalleryFixtureRequests(page, galleryFixturePayload, imageRequests = null) {
  await page.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.endsWith("/generated/places/capernaum.json")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(galleryFixturePayload)
      });
      return;
    }

    if (
      requestUrl.includes("upload.wikimedia.org/wikipedia/commons") ||
      requestUrl.includes("/media/ai/")
    ) {
      imageRequests?.push(requestUrl);
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "no-cache"
        },
        body: fixtureImageBuffer
      });
      return;
    }

    await route.fallback();
  });
}

function parseCssRgbColor(colorValue) {
  const match = colorValue
    .replace(/\s+/gu, "")
    .match(/^rgba?\((?<r>\d+),(?<g>\d+),(?<b>\d+)(?:,(?<a>\d*\.?\d+))?\)$/u);
  if (!match?.groups) {
    return null;
  }

  const alpha = match.groups.a ? Number.parseFloat(match.groups.a) : 1;
  return {
    r: Number.parseInt(match.groups.r, 10),
    g: Number.parseInt(match.groups.g, 10),
    b: Number.parseInt(match.groups.b, 10),
    a: Number.isFinite(alpha) ? alpha : 1
  };
}

function blendOverBackground(foreground, background) {
  const alpha = Math.min(1, Math.max(0, foreground.a));
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha)
  };
}

function srgbChannelToLinear(channelValue) {
  const normalized = channelValue / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  return (
    0.2126 * srgbChannelToLinear(color.r) +
    0.7152 * srgbChannelToLinear(color.g) +
    0.0722 * srgbChannelToLinear(color.b)
  );
}

function contrastRatio(left, right) {
  const leftLuminance = relativeLuminance(left);
  const rightLuminance = relativeLuminance(right);
  const lighter = Math.max(leftLuminance, rightLuminance);
  const darker = Math.min(leftLuminance, rightLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function assertBoundsWithinPanel(panelBounds, elementBounds, elementLabel, scenarioLabel) {
  if (!elementBounds) {
    throw new Error(`${scenarioLabel}: missing bounds for ${elementLabel}.`);
  }

  const tolerance = 0.5;
  if (
    elementBounds.left < panelBounds.left - tolerance ||
    elementBounds.right > panelBounds.right + tolerance ||
    elementBounds.top < panelBounds.top - tolerance ||
    elementBounds.bottom > panelBounds.bottom + tolerance
  ) {
    throw new Error(
      `${scenarioLabel}: ${elementLabel} is outside panel bounds. panel=${JSON.stringify(panelBounds)} element=${JSON.stringify(elementBounds)}`
    );
  }
}

function assertMinimumHitArea(elementBounds, elementLabel, scenarioLabel) {
  if (!elementBounds) {
    throw new Error(`${scenarioLabel}: missing bounds for ${elementLabel}.`);
  }

  if (
    elementBounds.width < minimumControlHitAreaPx - 0.5 ||
    elementBounds.height < minimumControlHitAreaPx - 0.5
  ) {
    throw new Error(
      `${scenarioLabel}: ${elementLabel} hit area is below ${minimumControlHitAreaPx}px (${elementBounds.width.toFixed(2)}x${elementBounds.height.toFixed(2)}).`
    );
  }
}

function boundsIntersect(left, right) {
  if (!left || !right) {
    return false;
  }

  return !(
    left.right <= right.left ||
    left.left >= right.right ||
    left.bottom <= right.top ||
    left.top >= right.bottom
  );
}

function parseScaleLabelMeters(labelText) {
  const trimmed = String(labelText ?? "").trim();
  const match = /^([0-9]+(?:\.[0-9]+)?)\s*(m|km)$/i.exec(trimmed);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return match[2].toLowerCase() === "km" ? value * 1000 : value;
}

function assertGalleryLabelContrast(labelStyle, scenarioLabel) {
  if (!labelStyle) {
    throw new Error(`${scenarioLabel}: missing gallery label style.`);
  }

  const textColor = parseCssRgbColor(labelStyle.color);
  const labelBackground = parseCssRgbColor(labelStyle.backgroundColor);
  if (!textColor || !labelBackground) {
    throw new Error(`${scenarioLabel}: could not parse gallery label colors.`);
  }

  const compositeOnWhite = blendOverBackground(labelBackground, { r: 255, g: 255, b: 255 });
  const compositeOnBlack = blendOverBackground(labelBackground, { r: 0, g: 0, b: 0 });
  const contrastOnWhite = contrastRatio(textColor, compositeOnWhite);
  const contrastOnBlack = contrastRatio(textColor, compositeOnBlack);
  const minimumContrast = Math.min(contrastOnWhite, contrastOnBlack);

  if (minimumContrast < 3) {
    throw new Error(
      `${scenarioLabel}: gallery label contrast is below 3:1 (white=${contrastOnWhite.toFixed(2)}, black=${contrastOnBlack.toFixed(2)}).`
    );
  }

  return {
    contrastOnWhite,
    contrastOnBlack,
    minimumContrast
  };
}

async function captureGalleryPanelLayoutSnapshot(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("section[aria-label='Place details']");
    const photosSection = panel?.querySelector("[data-panel-section='photos']");
    const mainImage = photosSection?.querySelector("[data-panel-photo-image='true']");
    const previousButton = photosSection?.querySelector("button[aria-label='Previous image']");
    const nextButton = photosSection?.querySelector("button[aria-label='Next image']");
    const counter = photosSection?.querySelector("[data-photo-counter='true']");
    const kindLabel = photosSection?.querySelector("[data-photo-kind-label='true']");
    const caption = photosSection?.querySelector("[data-photo-caption='true']");
    const creditLink = photosSection?.querySelector("[data-photo-credit-link='true']");
    const inlineCreditCount = photosSection
      ? photosSection.querySelectorAll("[data-photo-credit='true']").length
      : 0;
    const thumbnailRow = photosSection?.querySelector("[data-thumbnail-row='true']");
    const selectedThumbnail = photosSection?.querySelector(
      "[data-thumbnail-row='true'] button[data-gallery-thumbnail='selected']"
    );

    const toBounds = (element) => {
      if (!(element instanceof HTMLElement)) {
        return null;
      }

      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return {
        left,
        right,
        top,
        bottom,
        width,
        height
      };
    };

    const labelStyle =
      kindLabel instanceof HTMLElement
        ? {
            color: window.getComputedStyle(kindLabel).color,
            backgroundColor: window.getComputedStyle(kindLabel).backgroundColor
          }
        : null;

    const horizontalOverflow =
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;

    const rowScrollLeft = thumbnailRow instanceof HTMLElement ? thumbnailRow.scrollLeft : null;
    const rowScrollableWidth =
      thumbnailRow instanceof HTMLElement ? thumbnailRow.scrollWidth - thumbnailRow.clientWidth : null;

    return {
      panelBounds: toBounds(panel),
      photosSectionBounds: toBounds(photosSection),
      mainImageBounds: toBounds(mainImage),
      previousButtonBounds: toBounds(previousButton),
      nextButtonBounds: toBounds(nextButton),
      counterBounds: toBounds(counter),
      kindLabelBounds: toBounds(kindLabel),
      captionBounds: toBounds(caption),
      creditLinkBounds: toBounds(creditLink),
      inlineCreditCount,
      thumbnailRowBounds: toBounds(thumbnailRow),
      selectedThumbnailBounds: toBounds(selectedThumbnail),
      rowScrollLeft,
      rowScrollableWidth,
      horizontalOverflow,
      labelStyle
    };
  });
}

function assertGalleryPanelBoundsAndOverflow(snapshot, scenarioLabel) {
  if (!snapshot.panelBounds) {
    throw new Error(`${scenarioLabel}: missing panel bounds.`);
  }

  assertBoundsWithinPanel(
    snapshot.panelBounds,
    snapshot.photosSectionBounds,
    "photos section",
    scenarioLabel
  );
  assertBoundsWithinPanel(snapshot.panelBounds, snapshot.mainImageBounds, "main image", scenarioLabel);
  assertBoundsWithinPanel(
    snapshot.panelBounds,
    snapshot.previousButtonBounds,
    "previous image button",
    scenarioLabel
  );
  assertMinimumHitArea(snapshot.previousButtonBounds, "previous image button", scenarioLabel);
  assertBoundsWithinPanel(
    snapshot.panelBounds,
    snapshot.nextButtonBounds,
    "next image button",
    scenarioLabel
  );
  assertMinimumHitArea(snapshot.nextButtonBounds, "next image button", scenarioLabel);
  assertBoundsWithinPanel(snapshot.panelBounds, snapshot.counterBounds, "counter", scenarioLabel);
  assertBoundsWithinPanel(snapshot.panelBounds, snapshot.kindLabelBounds, "kind label", scenarioLabel);
  assertBoundsWithinPanel(snapshot.panelBounds, snapshot.captionBounds, "caption line", scenarioLabel);
  assertBoundsWithinPanel(snapshot.panelBounds, snapshot.creditLinkBounds, "credit link", scenarioLabel);
  if (snapshot.inlineCreditCount !== 0) {
    throw new Error(
      `${scenarioLabel}: inline photo-credit lines should be removed, found ${snapshot.inlineCreditCount}.`
    );
  }
  assertBoundsWithinPanel(
    snapshot.panelBounds,
    snapshot.thumbnailRowBounds,
    "thumbnail row container",
    scenarioLabel
  );

  if (snapshot.horizontalOverflow > 0.5) {
    throw new Error(
      `${scenarioLabel}: page has horizontal overflow (${snapshot.horizontalOverflow.toFixed(2)} px).`
    );
  }
}

function assertSelectedThumbnailInView(snapshot, scenarioLabel) {
  if (!snapshot.thumbnailRowBounds || !snapshot.selectedThumbnailBounds) {
    throw new Error(`${scenarioLabel}: missing thumbnail-row bounds.`);
  }

  const tolerance = 0.5;
  const selectedInsideRow =
    snapshot.selectedThumbnailBounds.left >= snapshot.thumbnailRowBounds.left - tolerance &&
    snapshot.selectedThumbnailBounds.right <= snapshot.thumbnailRowBounds.right + tolerance &&
    snapshot.selectedThumbnailBounds.top >= snapshot.thumbnailRowBounds.top - tolerance &&
    snapshot.selectedThumbnailBounds.bottom <= snapshot.thumbnailRowBounds.bottom + tolerance;

  if (!selectedInsideRow) {
    throw new Error(
      `${scenarioLabel}: selected thumbnail is not fully visible in the row viewport. row=${JSON.stringify(snapshot.thumbnailRowBounds)} selected=${JSON.stringify(snapshot.selectedThumbnailBounds)}`
    );
  }

  if (
    typeof snapshot.rowScrollableWidth === "number" &&
    snapshot.rowScrollableWidth > 0 &&
    typeof snapshot.rowScrollLeft === "number" &&
    snapshot.rowScrollLeft <= 0.5
  ) {
    throw new Error(
      `${scenarioLabel}: thumbnail row did not scroll for a later selected image (scrollLeft=${snapshot.rowScrollLeft.toFixed(2)}).`
    );
  }
}

async function captureViewerControlLayoutSnapshot(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector("[data-image-viewer-dialog='true']");
    const closeButton = dialog?.querySelector("button[aria-label='Close image viewer']");
    const previousButton = dialog?.querySelector("button[aria-label='Previous image']");
    const nextButton = dialog?.querySelector("button[aria-label='Next image']");

    const toBounds = (element) => {
      if (!(element instanceof HTMLElement)) {
        return null;
      }

      const { left, right, top, bottom, width, height } = element.getBoundingClientRect();
      return {
        left,
        right,
        top,
        bottom,
        width,
        height
      };
    };

    return {
      dialogBounds: toBounds(dialog),
      closeButtonBounds: toBounds(closeButton),
      previousButtonBounds: toBounds(previousButton),
      nextButtonBounds: toBounds(nextButton)
    };
  });
}

function assertViewerControlLayout(snapshot, scenarioLabel) {
  if (!snapshot.dialogBounds) {
    throw new Error(`${scenarioLabel}: missing image viewer dialog bounds.`);
  }

  assertBoundsWithinPanel(
    snapshot.dialogBounds,
    snapshot.closeButtonBounds,
    "viewer close button",
    scenarioLabel
  );
  assertBoundsWithinPanel(
    snapshot.dialogBounds,
    snapshot.previousButtonBounds,
    "viewer previous image button",
    scenarioLabel
  );
  assertBoundsWithinPanel(
    snapshot.dialogBounds,
    snapshot.nextButtonBounds,
    "viewer next image button",
    scenarioLabel
  );
  assertMinimumHitArea(snapshot.closeButtonBounds, "viewer close button", scenarioLabel);
  assertMinimumHitArea(snapshot.previousButtonBounds, "viewer previous image button", scenarioLabel);
  assertMinimumHitArea(snapshot.nextButtonBounds, "viewer next image button", scenarioLabel);
}

async function verifyGalleryFixtureBoundsAtViewport(
  browser,
  baseUrl,
  galleryFixturePayload,
  viewport
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await routeGalleryFixtureRequests(page, galleryFixturePayload);

  try {
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
      timeout: 30_000
    });

    await page.getByRole("button", { name: "Show image 5 of 10" }).click({ force: true });
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
      .getByText("AI-generated reconstruction", { exact: true })
      .waitFor({ timeout: 30_000 });

    const aiLayoutSnapshot = await captureGalleryPanelLayoutSnapshot(page);
    const viewportLabel = `${viewport.width}x${viewport.height}`;
    assertGalleryPanelBoundsAndOverflow(aiLayoutSnapshot, `Gallery bounds ${viewportLabel}`);
    const labelContrast = assertGalleryLabelContrast(
      aiLayoutSnapshot.labelStyle,
      `Gallery label contrast ${viewportLabel}`
    );

    for (let index = 0; index < 5; index += 1) {
      await page.getByRole("button", { name: "Next image" }).click();
    }
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos']")
      .getByText("10 / 10", { exact: true })
      .waitFor({ timeout: 30_000 });

    const endOfRowSnapshot = await captureGalleryPanelLayoutSnapshot(page);
    assertSelectedThumbnailInView(endOfRowSnapshot, `Gallery selected thumbnail ${viewportLabel}`);

    return {
      viewport,
      labelContrast,
      rowScrollLeft: endOfRowSnapshot.rowScrollLeft,
      rowScrollableWidth: endOfRowSnapshot.rowScrollableWidth
    };
  } finally {
    await page.unroute("**/*");
    await page.close();
    await context.close();
  }
}

async function waitForMapToSettle(page) {
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 45_000,
    polling: 250
  });
  try {
    await page.waitForFunction(
      (testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          return true;
        }

        return map.loaded() && !map.isMoving() && map.areTilesLoaded();
      },
      mapTestHookKey,
      { timeout: 45_000, polling: 250 }
    );
  } catch {
    await page.waitForFunction(
      (testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          return true;
        }
        return map.loaded() && !map.isMoving();
      },
      mapTestHookKey,
      { timeout: 10_000, polling: 250 }
    );
  }
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  });
}

function searchContainsSelection(search) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parameters.has("place") || parameters.has("candidate");
}

async function getActiveElementSnapshot(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    if (!element) {
      return {
        category: "none",
        descriptor: "none"
      };
    }

    if (
      element.matches("button[aria-label='Open app menu']") ||
      element.matches("input[aria-label='Search biblical places']")
    ) {
      return {
        category: "search",
        descriptor: element.getAttribute("aria-label") ?? element.tagName.toLowerCase()
      };
    }

    if (element.matches("canvas.maplibregl-canvas")) {
      return {
        category: "canvas",
        descriptor: "map canvas"
      };
    }

    if (element.matches("[role='radio'][data-map-mode]")) {
      return {
        category: "toggle",
        descriptor: element.textContent?.trim() ?? "map mode toggle"
      };
    }

    if (element.matches("button[data-map-control]") || element.closest(".maplibregl-ctrl")) {
      return {
        category: "map-control",
        descriptor:
          element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "map control"
      };
    }

    if (element.closest("[data-timeline-card='true']")) {
      return {
        category: "timeline",
        descriptor: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName.toLowerCase()
      };
    }

    if (element.matches("button[data-place-entry-id]")) {
      return {
        category: "place-list",
        descriptor:
          element.getAttribute("data-place-entry-id") ??
          element.getAttribute("aria-label") ??
          "place list entry"
      };
    }

    if (element.closest("section[aria-label='Place details']")) {
      return {
        category: "panel",
        descriptor: element.getAttribute("aria-label") ?? element.tagName.toLowerCase()
      };
    }

    return {
      category: "other",
      descriptor: element.tagName.toLowerCase()
    };
  });
}

async function collectTabSequence(page, tabCount, stopAtCategory = null) {
  const sequence = [];

  for (let index = 0; index < tabCount; index += 1) {
    await page.keyboard.press("Tab");
    const snapshot = await getActiveElementSnapshot(page);
    sequence.push(snapshot);
    if (stopAtCategory && snapshot.category === stopAtCategory) {
      break;
    }
  }

  return sequence;
}

function assertTabOrder(sequence) {
  const firstSearchIndex = sequence.findIndex((item) => item.category === "search");
  const firstToggleIndex = sequence.findIndex((item) => item.category === "toggle");
  const firstMapControlIndex = sequence.findIndex((item) => item.category === "map-control");
  const firstTimelineIndex = sequence.findIndex((item) => item.category === "timeline");
  const firstPlaceIndex = sequence.findIndex((item) => item.category === "place-list");
  const firstPanelIndex = sequence.findIndex((item) => item.category === "panel");
  const hasCanvasStop = sequence.some((item) => item.category === "canvas");

  if (firstSearchIndex !== 0) {
    throw new Error(
      `Expected search to be first tab stop, got '${sequence[0]?.category ?? "none"}'.`
    );
  }

  if (hasCanvasStop) {
    throw new Error("Map canvas appeared in tab order.");
  }

  if (
    firstToggleIndex < 0 ||
    firstMapControlIndex < 0 ||
    firstTimelineIndex < 0 ||
    firstPlaceIndex < 0 ||
    firstPanelIndex < 0 ||
    firstToggleIndex <= firstSearchIndex ||
    firstMapControlIndex <= firstToggleIndex ||
    firstTimelineIndex <= firstMapControlIndex ||
    firstPlaceIndex <= firstTimelineIndex ||
    firstPanelIndex <= firstPlaceIndex
  ) {
    throw new Error(
      `Unexpected tab-group order. Sequence: ${sequence.map((item) => item.category).join(" -> ")}`
    );
  }
}

async function verifyKeyboardOrderAndEscapeBehavior(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  const tabSequence = await collectTabSequence(page, 120, "panel");
  assertTabOrder(tabSequence);

  await page.keyboard.press("Escape");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "detached",
    timeout: 30_000
  });

  const escapedUrlSelectionSearch = await page.evaluate(() => window.location.search);
  if (searchContainsSelection(escapedUrlSelectionSearch)) {
    throw new Error(`Escape did not clear ?place= or &candidate=: ${escapedUrlSelectionSearch}`);
  }

  await page.waitForFunction(() => {
    const element = document.activeElement;
    return (
      !!element &&
      (element.matches("button[aria-label='Open app menu']") ||
        element.matches("input[aria-label='Search biblical places']"))
    );
  }, { timeout: UI_STATE_TIMEOUT_MS });

  const postEscapeFocus = await getActiveElementSnapshot(page);
  if (postEscapeFocus.category !== "search") {
    throw new Error(
      `Escape from URL selection should focus search, got '${postEscapeFocus.category}'.`
    );
  }

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await setMapView(page, { center: [35.2, 32.8], zoom: 8 });
  await page.evaluate((refreshHookKey) => {
    const refreshVisibleEntries = window[refreshHookKey];
    if (typeof refreshVisibleEntries === "function") {
      refreshVisibleEntries();
    }
  }, visibleEntryRefreshHookKey);
  await page.waitForFunction(
    () =>
      document.querySelectorAll(
        "button[data-place-entry-id^='place:'], button[data-place-entry-id^='candidate:'], button[data-place-entry-id^='area:']"
      ).length > 0,
    { timeout: 30_000 }
  );

  const openerEntry = page.locator(
    "button[data-place-entry-id^='place:'], button[data-place-entry-id^='candidate:'], button[data-place-entry-id^='area:']"
  );
  await openerEntry.first().focus();
  const openerEntryId = await openerEntry.first().getAttribute("data-place-entry-id");
  if (!openerEntryId) {
    throw new Error("Could not find place-entry id for Escape focus restore check.");
  }

  await page.keyboard.press("Enter");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "visible",
    timeout: 30_000
  });

  await page.keyboard.press("Escape");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "detached",
    timeout: 30_000
  });

  await page.waitForFunction((expectedEntryId) => {
    const active = document.activeElement;
    if (!active) {
      return false;
    }

    if (active.getAttribute("data-place-entry-id") === expectedEntryId) {
      return true;
    }

    return (
      active.matches("button[aria-label='Open app menu']") ||
      active.matches("input[aria-label='Search biblical places']")
    );
  }, openerEntryId, { timeout: UI_STATE_TIMEOUT_MS });

  const postEscapeSnapshot = await getActiveElementSnapshot(page);
  if (
    postEscapeSnapshot.category !== "search" &&
    postEscapeSnapshot.descriptor !== openerEntryId
  ) {
    throw new Error(
      `Escape should restore focus to '${openerEntryId}' or search, got '${postEscapeSnapshot.category}:${postEscapeSnapshot.descriptor}'.`
    );
  }

  const escapedSelectionSearch = await page.evaluate(() => window.location.search);
  if (searchContainsSelection(escapedSelectionSearch)) {
    throw new Error(`Escape from place-list selection did not clear URL: ${escapedSelectionSearch}`);
  }

  return {
    tabSequence,
    postEscapeFocus
  };
}

function normalizeTextContent(value) {
  return value.replace(/\s+/gu, " ").trim();
}

function removeLeadingMarkdownHeadingLine(markdown) {
  const lines = markdown.replace(/\r\n/gu, "\n").trim().split("\n");
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmptyIndex >= 0) {
    const firstLine = lines[firstNonEmptyIndex].trim();
    if (/^\*\*[^*]+\*\*(?:\s+\(.*\))?$/u.test(firstLine)) {
      lines.splice(firstNonEmptyIndex, 1);
    }
  }

  return lines.join("\n").trim();
}

function stripInlineMarkdownSyntax(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gu, "$1")
    .replace(/\*\*([^*]+)\*\*/gu, "$1")
    .replace(/`([^`]+)`/gu, "$1");
}

function stripMarkdownForTextComparison(markdown, options = {}) {
  const body = options.stripLeadingHeadingLine
    ? removeLeadingMarkdownHeadingLine(markdown)
    : markdown.replace(/\r\n/gu, "\n").trim();

  const lines = body.split("\n");
  const content = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^- /u, ""))
    .map((line) => stripInlineMarkdownSyntax(line));

  return normalizeTextContent(content.join(" "));
}

function extractMarkdownCodeBlock(source, sectionHeading) {
  const sectionStart = source.indexOf(sectionHeading);
  if (sectionStart < 0) {
    throw new Error(`Could not extract markdown block for section '${sectionHeading}'.`);
  }

  const drawerHeading = '**2. "Sources & credits" drawer:**';
  const drawerStart = source.indexOf(drawerHeading, sectionStart);
  if (drawerStart < 0) {
    throw new Error(`Could not find drawer heading for section '${sectionHeading}'.`);
  }

  const fenceStart = source.indexOf("```markdown", drawerStart);
  if (fenceStart < 0) {
    throw new Error(`Could not find markdown fence for section '${sectionHeading}'.`);
  }

  const blockStart = source.indexOf("\n", fenceStart);
  if (blockStart < 0) {
    throw new Error(`Could not find markdown content start for section '${sectionHeading}'.`);
  }

  const fenceEnd = source.indexOf("```", blockStart + 1);
  if (fenceEnd < 0) {
    throw new Error(`Could not find markdown content end for section '${sectionHeading}'.`);
  }

  return source.slice(blockStart + 1, fenceEnd).trimEnd();
}

async function loadExpectedDrawerTextFromLicenses() {
  const licensesDocument = await fs.readFile(licensesDocumentPath, "utf8");
  const webNoticeMatch = licensesDocument.match(
    /## WEB \(Bible text\) attribution wording\s*> ([^\n]+)/u
  );
  if (!webNoticeMatch) {
    throw new Error("Could not find WEB notice in docs/LICENSES.md.");
  }

  const mainMapMarkdown = extractMarkdownCodeBlock(
    licensesDocument,
    "#### Main basemap: Liberty on OpenFreeMap"
  );
  const backupMapMarkdown = extractMarkdownCodeBlock(
    licensesDocument,
    "#### Fallback B: VersaTiles public tile server (acceptable for outages only)"
  );

  return {
    webNoticeText: stripMarkdownForTextComparison(webNoticeMatch[1]),
    mainMapText: stripMarkdownForTextComparison(mainMapMarkdown, {
      stripLeadingHeadingLine: true
    }),
    backupMapText: stripMarkdownForTextComparison(backupMapMarkdown, {
      stripLeadingHeadingLine: true
    })
  };
}

function toSeriousOrCriticalViolations(violations) {
  return violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  );
}

async function runA11yCheck(page, selector, scenarioLabel, options = {}) {
  const axeResult = await new AxeBuilder({ page }).include(selector).analyze();
  const requireZeroViolations = options.requireZeroViolations === true;
  if (requireZeroViolations && axeResult.violations.length > 0) {
    const summary = axeResult.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length
    }));
    throw new Error(
      `${scenarioLabel}: found accessibility violations in '${selector}': ${JSON.stringify(summary)}`
    );
  }

  const blockingViolations = toSeriousOrCriticalViolations(axeResult.violations);

  if (blockingViolations.length > 0) {
    const summary = blockingViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length
    }));
    throw new Error(
      `${scenarioLabel}: found serious/critical accessibility violations in '${selector}': ${JSON.stringify(summary)}`
    );
  }

  return {
    selector,
    totalViolations: axeResult.violations.length,
    seriousOrCriticalViolations: 0
  };
}

async function getDrawerFocusState(page) {
  return page.evaluate((focusableSelector) => {
    const drawer = document.querySelector("[data-testid='app-menu-drawer']");
    if (!(drawer instanceof HTMLElement)) {
      return {
        missingDrawer: true
      };
    }

    const getDescriptor = (element) =>
      element.getAttribute("aria-label") ??
      element.textContent?.replace(/\s+/gu, " ").trim() ??
      element.tagName.toLowerCase();

    const focusables = Array.from(drawer.querySelectorAll(focusableSelector)).filter(
      (element) => element instanceof HTMLElement && !element.closest("[inert]")
    );
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const activeIndex = activeElement ? focusables.indexOf(activeElement) : -1;

    return {
      missingDrawer: false,
      focusableCount: focusables.length,
      activeIndex,
      activeInsideDrawer: Boolean(activeElement && drawer.contains(activeElement)),
      activeDescriptor: activeElement ? getDescriptor(activeElement) : "none",
      firstDescriptor: focusables.length > 0 ? getDescriptor(focusables[0]) : "none",
      lastDescriptor:
        focusables.length > 0 ? getDescriptor(focusables[focusables.length - 1]) : "none"
    };
  }, drawerFocusableSelector);
}

async function verifySearchMenuAndAccessibility(
  page,
  baseUrl,
  screenshotPath,
  drawerScreenshotPath,
  expectedDrawerText
) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable for search verification.");
    }

    window.__ibmMapIdentityForSearchTest = map;
  }, mapTestHookKey);

  await page.keyboard.press("/");
  await page.waitForFunction(() => {
    const active = document.activeElement;
    return Boolean(active && active.matches("input[aria-label='Search biblical places']"));
  }, { timeout: UI_STATE_TIMEOUT_MS });

  await page.keyboard.type("Antioch");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelectorAll("[data-testid='search-results-list'] [role='option']").length >= 2,
    { timeout: 30_000 }
  );

  const antiochResults = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );

  if (!antiochResults.some((entry) => entry.includes("Antioch on the Orontes"))) {
    throw new Error(
      `Search list for Antioch is missing Antioch on the Orontes: ${JSON.stringify(antiochResults)}`
    );
  }
  if (!antiochResults.some((entry) => entry.includes("Antioch in Pisidia"))) {
    throw new Error(
      `Search list for Antioch is missing Antioch in Pisidia: ${JSON.stringify(antiochResults)}`
    );
  }

  await page.locator("[data-testid='search-results-list']").screenshot({
    path: screenshotPath
  });

  const mapStableWhileTyping = await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    return Boolean(map && window.__ibmMapIdentityForSearchTest === map);
  }, mapTestHookKey);
  if (!mapStableWhileTyping) {
    throw new Error("Map instance changed while typing in search.");
  }

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "visible",
    timeout: 30_000
  });

  const selectionAfterEnter = await page.evaluate(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("place");
  });
  if (!selectionAfterEnter || !expectedAntiochSelections.has(selectionAfterEnter)) {
    throw new Error(
      `Search keyboard Enter did not select an Antioch result. place='${selectionAfterEnter ?? "null"}'.`
    );
  }

  const searchInput = page.locator("input[aria-label='Search biblical places']");
  await searchInput.focus();
  await searchInput.fill("John 3:16");
  await page.waitForSelector("[data-testid='search-no-results']", { timeout: 30_000 });
  const noResultsText = await page.$eval(
    "[data-testid='search-no-results']",
    (element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim()
  );
  if (!noResultsText.includes("No places match 'John 3:16'.")) {
    throw new Error(`No-results state is missing the query line: '${noResultsText}'.`);
  }
  if (!noResultsText.includes(searchNoResultsSuffix)) {
    throw new Error(`No-results state is missing the suffix '${searchNoResultsSuffix}'.`);
  }

  await page.keyboard.press("Escape");
  const panelStillOpen = await page.locator("section[aria-label='Place details']").isVisible();
  if (!panelStillOpen) {
    throw new Error(
      "First Escape from open search results closed the panel; it should clear search first."
    );
  }

  const queryAfterFirstEscape = await searchInput.inputValue();
  if (queryAfterFirstEscape.length !== 0) {
    throw new Error(`First Escape should clear the search query, found '${queryAfterFirstEscape}'.`);
  }

  const visibleSearchPanelsAfterFirstEscape = await page.locator(
    "[data-testid='search-results-list'], [data-testid='search-no-results']"
  ).count();
  if (visibleSearchPanelsAfterFirstEscape > 0) {
    throw new Error("Search result panel remained open after first Escape.");
  }

  await page.keyboard.press("Escape");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "detached",
    timeout: 30_000
  });

  await searchInput.focus();
  await searchInput.fill("Judah");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  const judahResults = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  if (!judahResults.some((entry) => entry.includes("Judea"))) {
    throw new Error(`'Judah' search should include Judea, got ${JSON.stringify(judahResults)}.`);
  }

  await searchInput.fill("Greece");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  const greeceResults = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  if (!greeceResults.some((entry) => entry.includes("Achaia"))) {
    throw new Error(`'Greece' search should include Achaia, got ${JSON.stringify(greeceResults)}.`);
  }

  await searchInput.fill("Egypt");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  const egyptResults = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  if (!egyptResults.some((entry) => entry.includes("Egypt"))) {
    throw new Error(`'Egypt' search should include Egypt, got ${JSON.stringify(egyptResults)}.`);
  }

  await searchInput.fill("Parthian");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  const parthianResults = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  if (!parthianResults.some((entry) => entry.includes("Parthian Empire"))) {
    throw new Error(
      `'Parthian' search should include Parthian Empire, got ${JSON.stringify(parthianResults)}.`
    );
  }

  await searchInput.fill("Antioch");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });

  const comboboxA11y = await runA11yCheck(
    page,
    "[data-testid='search-shell']",
    "Search combobox accessibility"
  );

  await page.click("button[aria-label='Open app menu']");
  await page.waitForSelector("[data-testid='app-menu-drawer']", { timeout: 30_000 });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Close app menu",
    undefined,
    { timeout: 30_000 }
  );
  await page.getByRole("button", { name: "About this map" }).waitFor({ timeout: 30_000 });
  await page.getByRole("button", { name: "Sources & credits" }).waitFor({ timeout: 30_000 });
  const reportIssueLink = page.getByRole("link", { name: "Report an issue" });
  const viewOnGitHubLink = page.getByRole("link", { name: "View on GitHub" });
  await reportIssueLink.waitFor({ timeout: 30_000 });
  await viewOnGitHubLink.waitFor({ timeout: 30_000 });

  const inertBackgroundState = await page.evaluate(() => {
    const root = document.querySelector("[data-app-shell-root]");
    const drawer = document.querySelector("[data-testid='app-menu-drawer']");
    if (!(root instanceof HTMLElement) || !(drawer instanceof HTMLElement)) {
      return {
        hasRoot: root instanceof HTMLElement,
        hasDrawer: drawer instanceof HTMLElement,
        backgroundCount: 0,
        inertCount: 0,
        ariaHiddenCount: 0
      };
    }

    const backgroundElements = Array.from(root.children).filter(
      (child) => child instanceof HTMLElement && !child.contains(drawer)
    );
    const inertCount = backgroundElements.filter((element) => element.hasAttribute("inert")).length;
    const ariaHiddenCount = backgroundElements.filter(
      (element) => element.getAttribute("aria-hidden") === "true"
    ).length;

    return {
      hasRoot: true,
      hasDrawer: true,
      backgroundCount: backgroundElements.length,
      inertCount,
      ariaHiddenCount
    };
  });

  if (!inertBackgroundState.hasRoot || !inertBackgroundState.hasDrawer) {
    throw new Error("Menu drawer test could not locate app-shell root and/or drawer.");
  }
  if (inertBackgroundState.backgroundCount === 0) {
    throw new Error("Menu drawer inert test found no background elements.");
  }
  if (inertBackgroundState.inertCount !== inertBackgroundState.backgroundCount) {
    throw new Error(
      `Expected all background elements to be inert. state=${JSON.stringify(inertBackgroundState)}`
    );
  }
  if (inertBackgroundState.ariaHiddenCount !== inertBackgroundState.backgroundCount) {
    throw new Error(
      `Expected all background elements to be aria-hidden while drawer is open. state=${JSON.stringify(inertBackgroundState)}`
    );
  }

  await page.keyboard.press("Shift+Tab");
  const shiftedFocusState = await getDrawerFocusState(page);
  if (shiftedFocusState.missingDrawer) {
    throw new Error("Menu drawer focus trap test could not locate drawer.");
  }
  if (!shiftedFocusState.activeInsideDrawer) {
    throw new Error("Shift+Tab moved focus outside the drawer.");
  }
  if (shiftedFocusState.activeIndex !== shiftedFocusState.focusableCount - 1) {
    throw new Error(
      `Shift+Tab did not wrap to the last focusable drawer element. state=${JSON.stringify(shiftedFocusState)}`
    );
  }

  await page.keyboard.press("Tab");
  const wrappedFocusState = await getDrawerFocusState(page);
  if (wrappedFocusState.missingDrawer) {
    throw new Error("Menu drawer focus trap test could not locate drawer after Tab.");
  }
  if (!wrappedFocusState.activeInsideDrawer) {
    throw new Error("Tab moved focus outside the drawer.");
  }
  if (wrappedFocusState.activeIndex !== 0) {
    throw new Error(
      `Tab did not wrap back to the first focusable drawer element. state=${JSON.stringify(wrappedFocusState)}`
    );
  }

  await page.getByRole("heading", { name: "Map", exact: true }).waitFor({ timeout: 30_000 });
  await page
    .getByRole("heading", {
      name: "Backup map (shown only when the main map can't load)",
      exact: true
    })
    .waitFor({ timeout: 30_000 });
  await page
    .getByRole("heading", {
      name: "Data sources",
      exact: true
    })
    .waitFor({ timeout: 30_000 });

  const drawerText = normalizeTextContent(
    await page.$eval("[data-testid='app-menu-drawer']", (element) => element.textContent ?? "")
  );
  if (drawerText.includes("**Basemap**") || drawerText.includes("[OpenStreetMap](")) {
    throw new Error("Sources drawer still shows raw Markdown syntax.");
  }

  const dataLicenseHref = await page
    .getByRole("link", { name: "full license details" })
    .getAttribute("href");
  if (dataLicenseHref !== fullLicenseDetailsUrl) {
    throw new Error(
      `Data-license details link mismatch: expected '${fullLicenseDetailsUrl}', got '${dataLicenseHref ?? "null"}'.`
    );
  }

  const navEntryTexts = await page.$$eval(
    "nav[aria-label='Menu entries'] button, nav[aria-label='Menu entries'] a",
    (elements) => elements.map((element) => (element.textContent ?? "").trim())
  );
  if (navEntryTexts.some((text) => text.includes("[") || text.includes("**"))) {
    throw new Error(`Menu entries contain raw Markdown: ${JSON.stringify(navEntryTexts)}`);
  }

  const mapMarkdownRenderedText = normalizeTextContent(
    await page.$eval("[data-testid='credits-map-markdown']", (element) => {
      const blockTexts = Array.from(element.querySelectorAll("p, li")).map(
        (block) => block.textContent ?? ""
      );
      return blockTexts.join(" ");
    })
  );
  const backupMapMarkdownRenderedText = normalizeTextContent(
    await page.$eval("[data-testid='credits-backup-map-markdown']", (element) => {
      const blockTexts = Array.from(element.querySelectorAll("p, li")).map(
        (block) => block.textContent ?? ""
      );
      return blockTexts.join(" ");
    })
  );
  const webNoticeRenderedText = normalizeTextContent(
    await page.$eval("[data-testid='credits-web-notice']", (element) => element.textContent ?? "")
  );

  if (mapMarkdownRenderedText !== expectedDrawerText.mainMapText) {
    throw new Error(
      `Map credits text mismatch.\nExpected: ${expectedDrawerText.mainMapText}\nReceived: ${mapMarkdownRenderedText}`
    );
  }
  if (backupMapMarkdownRenderedText !== expectedDrawerText.backupMapText) {
    throw new Error(
      `Backup map credits text mismatch.\nExpected: ${expectedDrawerText.backupMapText}\nReceived: ${backupMapMarkdownRenderedText}`
    );
  }
  if (webNoticeRenderedText !== expectedDrawerText.webNoticeText) {
    throw new Error(
      `WEB notice text mismatch.\nExpected: ${expectedDrawerText.webNoticeText}\nReceived: ${webNoticeRenderedText}`
    );
  }

  await page.locator("[data-testid='app-menu-drawer']").screenshot({
    path: drawerScreenshotPath
  });

  const reportIssueRel = await reportIssueLink.getAttribute("rel");
  const viewOnGitHubRel = await viewOnGitHubLink.getAttribute("rel");
  if (reportIssueRel !== "noopener noreferrer" || viewOnGitHubRel !== "noopener noreferrer") {
    throw new Error(
      `External links in menu entries must use rel='noopener noreferrer'. Report='${reportIssueRel}', View='${viewOnGitHubRel}'.`
    );
  }

  const drawerA11y = await runA11yCheck(
    page,
    "[data-testid='app-menu-drawer']",
    "Menu drawer accessibility",
    {
      requireZeroViolations: true
    }
  );

  await page.keyboard.press("Escape");
  await page.waitForSelector("[data-testid='app-menu-drawer']", {
    state: "detached",
    timeout: 30_000
  });
  await page.waitForFunction(
    () => document.activeElement?.matches("button[aria-label='Open app menu']"),
    undefined,
    { timeout: 30_000 }
  );
  const inertAfterClose = await page
    .locator("[data-testid='search-shell']")
    .getAttribute("inert");
  if (inertAfterClose !== null) {
    throw new Error("Search shell remained inert after the menu drawer closed.");
  }

  return {
    antiochResults,
    judahResults,
    greeceResults,
    egyptResults,
    parthianResults,
    selectedAntiochPlaceId: selectionAfterEnter,
    noResultsText,
    mapStableWhileTyping,
    drawerScreenshotPath,
    renderedDrawerText: {
      webNotice: webNoticeRenderedText,
      map: mapMarkdownRenderedText,
      backupMap: backupMapMarkdownRenderedText
    },
    accessibility: {
      comboboxOpen: comboboxA11y,
      menuDrawerOpen: drawerA11y
    }
  };
}

async function verifyKeyboardDisclosureControls(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  const sectionToggleIds = await page.$$eval(
    `${placePanelSelector} [data-panel-section-toggle]`,
    (elements) =>
      elements
        .map((element) => element.getAttribute("data-panel-section-toggle"))
        .filter((value) => typeof value === "string")
  );
  if (sectionToggleIds.length === 0) {
    throw new Error("No collapsible section toggles were rendered in the place panel.");
  }

  const chevronContrastBySection = {};
  for (const sectionId of sectionToggleIds) {
    const chevronVisualStyle = await readPanelSectionChevronVisualStyle(page, sectionId);
    chevronContrastBySection[sectionId] = assertGalleryLabelContrast(
      {
        color: chevronVisualStyle.color,
        backgroundColor: chevronVisualStyle.backgroundColor
      },
      `Section chevron contrast (${sectionId})`
    );
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionSectionId = sectionToggleIds[0];
  const reducedMotionChevronSelector = `${panelSectionChevronSelector(reducedMotionSectionId)} svg`;
  await page.waitForFunction(
    (selector) => {
      const icon = document.querySelector(selector);
      return (
        icon instanceof SVGElement &&
        window.getComputedStyle(icon).transitionProperty === "none"
      );
    },
    reducedMotionChevronSelector,
    { timeout: 30_000, polling: 100 }
  );
  const reducedMotionChevronTransition = await page.$eval(
    reducedMotionChevronSelector,
    (icon) => {
      const style = window.getComputedStyle(icon);
      return {
        transition: style.transition,
        transitionProperty: style.transitionProperty
      };
    }
  );
  if (reducedMotionChevronTransition.transitionProperty !== "none") {
    throw new Error(
      `Reduced-motion chevron transition should be none, got '${reducedMotionChevronTransition.transitionProperty}'.`
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const sectionKeyboardToggleStates = {};
  for (const sectionId of sectionToggleIds) {
    const toggle = await waitForPanelSectionToggle(page, sectionId);
    const initialExpanded = await toggle.getAttribute("aria-expanded");
    const initialChevronState = await readPanelSectionChevronState(page, sectionId);
    const expectedInitialChevronState = initialExpanded === "true" ? "expanded" : "collapsed";
    if (initialChevronState !== expectedInitialChevronState) {
      throw new Error(
        `${sectionId} chevron state mismatch before toggle: aria-expanded='${initialExpanded}', chevron='${initialChevronState}'.`
      );
    }

    await toggle.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      ({ selector, previousState }) => {
        const element = document.querySelector(selector);
        return (
          element instanceof HTMLButtonElement &&
          element.getAttribute("aria-expanded") !== previousState
        );
      },
      {
        selector: panelSectionToggleSelector(sectionId),
        previousState: initialExpanded
      },
      { timeout: 30_000, polling: 100 }
    );
    const expandedAfterEnter = await toggle.getAttribute("aria-expanded");
    const chevronAfterEnter = await readPanelSectionChevronState(page, sectionId);
    const expectedChevronAfterEnter = expandedAfterEnter === "true" ? "expanded" : "collapsed";
    if (chevronAfterEnter !== expectedChevronAfterEnter) {
      throw new Error(
        `${sectionId} chevron mismatch after Enter: aria-expanded='${expandedAfterEnter}', chevron='${chevronAfterEnter}'.`
      );
    }
    if (chevronAfterEnter === initialChevronState) {
      throw new Error(`${sectionId} chevron did not change after keyboard toggle.`);
    }

    await page.keyboard.press("Space");
    await page.waitForFunction(
      ({ selector, expectedState }) => {
        const element = document.querySelector(selector);
        return (
          element instanceof HTMLButtonElement &&
          element.getAttribute("aria-expanded") === expectedState
        );
      },
      {
        selector: panelSectionToggleSelector(sectionId),
        expectedState: initialExpanded
      },
      { timeout: 30_000, polling: 100 }
    );
    const expandedAfterSpace = await toggle.getAttribute("aria-expanded");
    const chevronAfterSpace = await readPanelSectionChevronState(page, sectionId);
    const expectedChevronAfterSpace = expandedAfterSpace === "true" ? "expanded" : "collapsed";
    if (chevronAfterSpace !== expectedChevronAfterSpace) {
      throw new Error(
        `${sectionId} chevron mismatch after Space: aria-expanded='${expandedAfterSpace}', chevron='${chevronAfterSpace}'.`
      );
    }
    if (chevronAfterSpace !== initialChevronState) {
      throw new Error(
        `${sectionId} chevron should return to initial state after Enter+Space toggles, got '${chevronAfterSpace}' (initial '${initialChevronState}').`
      );
    }
    sectionKeyboardToggleStates[sectionId] = {
      initialExpanded,
      expandedAfterEnter,
      expandedAfterSpace,
      initialChevronState,
      chevronAfterEnter,
      chevronAfterSpace
    };
  }

  const aboutToggle = await waitForPanelSectionToggle(page, "about");
  if ((await aboutToggle.getAttribute("aria-expanded")) !== "false") {
    await aboutToggle.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return (
          element instanceof HTMLButtonElement && element.getAttribute("aria-expanded") === "false"
        );
      },
      panelSectionToggleSelector("about"),
      { timeout: 30_000, polling: 100 }
    );
  }

  const sourcesToggle = await waitForPanelSectionToggle(page, "sources");
  if ((await sourcesToggle.getAttribute("aria-expanded")) !== "true") {
    await sourcesToggle.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return (
          element instanceof HTMLButtonElement && element.getAttribute("aria-expanded") === "true"
        );
      },
      panelSectionToggleSelector("sources"),
      { timeout: 30_000, polling: 100 }
    );
  }

  const searchInput = page.locator("input[aria-label='Search biblical places']");
  await searchInput.fill("Emmaus");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
  await page
    .locator("[data-testid='search-results-list'] [role='option']")
    .filter({ hasText: "Emmaus" })
    .first()
    .click();
  await page.waitForFunction(() => {
    const parameters = new URLSearchParams(window.location.search.slice(1));
    return parameters.get("place") === "emmaus";
  }, undefined, { timeout: 30_000, polling: 100 });
  await page.getByRole("heading", { level: 1, name: "Emmaus" }).waitFor({ timeout: 30_000 });

  const persistedStates = {
    aboutExpandedOnEmmaus: await getPanelSectionExpanded(page, "about"),
    sourcesExpandedOnEmmaus: await getPanelSectionExpanded(page, "sources")
  };
  if (persistedStates.aboutExpandedOnEmmaus !== false) {
    throw new Error("About section collapse state did not persist to the next place.");
  }
  if (persistedStates.sourcesExpandedOnEmmaus !== true) {
    throw new Error("Sources section expansion state did not persist to the next place.");
  }

  const candidateToggle = page
    .locator("section[aria-label='Place details'] button[data-candidate-support-toggle='true']")
    .first();
  await candidateToggle.waitFor({ state: "visible", timeout: 30_000 });
  await candidateToggle.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const button = document.querySelector(
      "section[aria-label='Place details'] button[data-candidate-support-toggle='true']"
    );
    return button instanceof HTMLButtonElement && button.getAttribute("aria-expanded") === "true";
  }, { timeout: UI_STATE_TIMEOUT_MS });
  const emmausExpanded = await candidateToggle.getAttribute("aria-expanded");
  const candidateSupportControlId = await candidateToggle.getAttribute("aria-controls");

  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const button = document.querySelector(
      "section[aria-label='Place details'] button[data-candidate-support-toggle='true']"
    );
    return button instanceof HTMLButtonElement && button.getAttribute("aria-expanded") === "false";
  }, { timeout: UI_STATE_TIMEOUT_MS });
  const emmausCollapsed = await candidateToggle.getAttribute("aria-expanded");

  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await setPanelSectionExpanded(page, "in-bible", true);

  const showAllButton = page.locator(
    "section[aria-label='Place details'] [data-show-all-passages='true']"
  );
  await showAllButton.first().waitFor({ state: "visible", timeout: 30_000 });
  await showAllButton.first().focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => {
    const button = document.querySelector(
      "section[aria-label='Place details'] [data-show-all-passages='true']"
    );
    if (!(button instanceof HTMLButtonElement)) {
      return false;
    }
    if (button.getAttribute("aria-expanded") !== "true") {
      return false;
    }
    const section = document.querySelector(
      "section[aria-label='Place details'] [data-panel-section='in-bible']"
    );
    return Boolean(section && section.querySelectorAll("article").length > 5);
  }, undefined, { timeout: 120_000, polling: 250 });
  const jerusalemExpanded = await showAllButton.first().getAttribute("aria-expanded");
  const jerusalemControlId = await showAllButton.first().getAttribute("aria-controls");
  const expandedButtonText = normalizeTextContent((await showAllButton.first().textContent()) ?? "");
  if (expandedButtonText !== "Show fewer") {
    throw new Error(`Expanded scripture toggle should read 'Show fewer', got '${expandedButtonText}'.`);
  }

  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const button = document.querySelector(
      "section[aria-label='Place details'] [data-show-all-passages='true']"
    );
    if (!(button instanceof HTMLButtonElement)) {
      return false;
    }
    if (button.getAttribute("aria-expanded") !== "false") {
      return false;
    }
    const section = document.querySelector(
      "section[aria-label='Place details'] [data-panel-section='in-bible']"
    );
    return Boolean(section && section.querySelectorAll("article").length === 5);
  }, undefined, { timeout: 120_000, polling: 250 });
  const jerusalemCollapsed = await showAllButton.first().getAttribute("aria-expanded");
  const collapsedButtonText = normalizeTextContent((await showAllButton.first().textContent()) ?? "");
  if (!/^Show all [0-9]+ passages$/u.test(collapsedButtonText)) {
    throw new Error(
      `Collapsed scripture toggle should read 'Show all n passages', got '${collapsedButtonText}'.`
    );
  }
  const focusedAfterCollapse = normalizeTextContent(
    await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement instanceof HTMLElement ? activeElement.textContent ?? "" : "";
    })
  );
  if (!/^Show all [0-9]+ passages$/u.test(focusedAfterCollapse)) {
    throw new Error(
      `Focus should remain on the scripture toggle after collapsing, got '${focusedAfterCollapse}'.`
    );
  }

  return {
    chevronContrastBySection,
    reducedMotionChevronTransition,
    sectionKeyboardToggleStates,
    persistedStates,
    emmaus: {
      controlId: candidateSupportControlId,
      expandedAfterEnter: emmausExpanded,
      collapsedAfterSpace: emmausCollapsed
    },
    jerusalem: {
      controlId: jerusalemControlId,
      expandedAfterEnter: jerusalemExpanded,
      collapsedAfterSpace: jerusalemCollapsed,
      expandedButtonText,
      collapsedButtonText
    }
  };
}

async function verifyCandidateSelectionUpdatesUrl(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  const candidateButtons = page.locator(
    "section[aria-label='Place details'] button[aria-label^='Candidate ']"
  );
  const candidateButtonCount = await candidateButtons.count();
  if (candidateButtonCount < 2) {
    throw new Error(
      `Candidate-selection URL check expected at least 2 candidate buttons, got ${candidateButtonCount}.`
    );
  }

  await candidateButtons.nth(1).click();
  await page.waitForFunction(() => {
    const parameters = new URLSearchParams(window.location.search.slice(1));
    return parameters.get("place") === "emmaus" && parameters.get("candidate") === "b";
  }, undefined, { timeout: 30_000, polling: 100 });

  return {
    search: await page.evaluate(() => window.location.search)
  };
}

async function verifyPlaceDetailsFetchRaceRecovery(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  let capernaumRequestCount = 0;
  let emmausRequestCount = 0;

  await page.route("**/generated/places/*.json", async (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.endsWith("/generated/places/capernaum.json")) {
      capernaumRequestCount += 1;
      if (capernaumRequestCount === 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
    } else if (requestUrl.endsWith("/generated/places/emmaus.json")) {
      emmausRequestCount += 1;
    }
    await route.fallback();
  });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);

    await page.evaluate(() => {
      const applySearch = (search) => {
        window.history.pushState({}, "", `${window.location.pathname}${search}${window.location.hash}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      };

      applySearch("?place=capernaum");
      window.setTimeout(() => applySearch("?place=emmaus"), 40);
      window.setTimeout(() => applySearch("?place=capernaum"), 80);
    });

    await page.waitForSelector("section[aria-label='Place details']", {
      state: "visible",
      timeout: 30_000
    });
    await page.waitForFunction(() => {
      const heading = document.querySelector("section[aria-label='Place details'] h1");
      return heading?.textContent?.trim() === "Capernaum";
    }, undefined, { timeout: 30_000, polling: 100 });
    await page.waitForSelector(
      "section[aria-label='Place details'] [data-panel-section='about']",
      { timeout: 30_000 }
    );

    const stillLoading = await page
      .locator("section[aria-label='Place details'] [data-place-panel-skeleton='true']")
      .count();
    if (stillLoading > 0) {
      throw new Error("Place-details race recovery failed: panel is still stuck on loading skeleton.");
    }

    return {
      capernaumRequestCount,
      emmausRequestCount
    };
  } finally {
    await page.unroute("**/generated/places/*.json");
    await page.close();
    await context.close();
  }
}

async function verifyPanelSectionOrderAndPhotoCredits(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='about']", {
    timeout: 30_000
  });

  const sectionIds = await page.$$eval(
    "section[aria-label='Place details'] [data-panel-section]",
    (elements) => elements.map((element) => element.getAttribute("data-panel-section") ?? "")
  );
  const canonicalOrder = [
    "photos",
    "names",
    "candidates",
    "about",
    "places-in",
    "in-bible",
    "ot-connections",
    "sources",
    "photo-credits",
    "footer"
  ];
  const canonicalIndex = new Map(canonicalOrder.map((entry, index) => [entry, index]));
  let last = -1;
  for (const sectionId of sectionIds) {
    const currentIndex = canonicalIndex.get(sectionId);
    if (typeof currentIndex !== "number") {
      throw new Error(`Unknown panel section '${sectionId}' in rendered panel order.`);
    }
    if (currentIndex < last) {
      throw new Error(`Panel sections are out of order: ${sectionIds.join(" -> ")}`);
    }
    last = currentIndex;
  }

  const inlinePhotoCreditCount = await page
    .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-credit='true']")
    .count();
  if (inlinePhotoCreditCount !== 0) {
    throw new Error(
      `Inline panel photo-credit lines should be removed, found ${inlinePhotoCreditCount}.`
    );
  }

  await assertPanelSectionStartsCollapsedWithCount(page, "sources", "Sources");
  await assertPanelSectionStartsCollapsedWithCount(page, "photo-credits", "Photo credits");

  const capernaumImages = await readCapernaumImages();
  const hiddenSectionSnapshot = await page.evaluate(
    ({ sourcesContentSelector, photoCreditsContentSelector, photoEntrySelector }) => {
      const sourcesContent = document.querySelector(sourcesContentSelector);
      const photoCreditsContent = document.querySelector(photoCreditsContentSelector);
      const photoEntries = document.querySelectorAll(photoEntrySelector);
      return {
        sourcesHidden:
          sourcesContent instanceof HTMLElement &&
          sourcesContent.hidden &&
          getComputedStyle(sourcesContent).display === "none",
        photoCreditsHidden:
          photoCreditsContent instanceof HTMLElement &&
          photoCreditsContent.hidden &&
          getComputedStyle(photoCreditsContent).display === "none",
        photoCreditsAttachedCount: photoEntries.length
      };
    },
    {
      sourcesContentSelector: panelSectionContentSelector("sources"),
      photoCreditsContentSelector: panelSectionContentSelector("photo-credits"),
      photoEntrySelector: photoCreditsEntriesSelector
    }
  );
  if (!hiddenSectionSnapshot.sourcesHidden) {
    throw new Error("Sources content should stay in the DOM but be hidden when collapsed.");
  }
  if (!hiddenSectionSnapshot.photoCreditsHidden) {
    throw new Error("Photo credits content should stay in the DOM but be hidden when collapsed.");
  }
  if (hiddenSectionSnapshot.photoCreditsAttachedCount !== capernaumImages.length) {
    throw new Error(
      `Collapsed photo credits should stay attached in the DOM. expected=${capernaumImages.length}, got=${hiddenSectionSnapshot.photoCreditsAttachedCount}.`
    );
  }

  const sourceMarkerTarget = await page.evaluate(() => {
    const marker = document.querySelector(
      "section[aria-label='Place details'] [data-panel-section='about'] a[href^='#source-']"
    );
    if (!(marker instanceof HTMLAnchorElement)) {
      return null;
    }
    const href = marker.getAttribute("href");
    if (!href || !/^#source-[0-9]+$/u.test(href)) {
      return null;
    }
    return {
      href,
      targetId: href.slice(1)
    };
  });
  if (!sourceMarkerTarget) {
    throw new Error("Could not find an inline [n] source marker link in About.");
  }

  await page
    .locator(
      `section[aria-label='Place details'] [data-panel-section='about'] a[href='${sourceMarkerTarget.href}']`
    )
    .first()
    .click();

  await page.waitForFunction(
    ({ sourceToggleSelector, targetId, panelSelector }) => {
      const toggle = document.querySelector(sourceToggleSelector);
      const target = document.getElementById(targetId);
      const panel = document.querySelector(panelSelector);
      if (
        !(toggle instanceof HTMLButtonElement) ||
        !(target instanceof HTMLElement) ||
        !(panel instanceof HTMLElement)
      ) {
        return false;
      }

      if (toggle.getAttribute("aria-expanded") !== "true") {
        return false;
      }
      if (document.activeElement !== target) {
        return false;
      }

      const panelBounds = panel.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const visibleTop = Math.max(panelBounds.top, targetBounds.top);
      const visibleBottom = Math.min(panelBounds.bottom, targetBounds.bottom);
      return visibleBottom - visibleTop > 0;
    },
    {
      sourceToggleSelector: panelSectionToggleSelector("sources"),
      targetId: sourceMarkerTarget.targetId,
      panelSelector: placePanelSelector
    },
    { timeout: 30_000, polling: 100 }
  );

  const sourceMarkerJump = await page.evaluate(
    ({ sourceToggleSelector, targetId, panelSelector }) => {
      const toggle = document.querySelector(sourceToggleSelector);
      const target = document.getElementById(targetId);
      const panel = document.querySelector(panelSelector);
      if (
        !(toggle instanceof HTMLButtonElement) ||
        !(target instanceof HTMLElement) ||
        !(panel instanceof HTMLElement)
      ) {
        return null;
      }

      const panelBounds = panel.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const visibleTop = Math.max(panelBounds.top, targetBounds.top);
      const visibleBottom = Math.min(panelBounds.bottom, targetBounds.bottom);
      const style = window.getComputedStyle(target);
      const activeElement = document.activeElement;

      return {
        targetId,
        expanded: toggle.getAttribute("aria-expanded"),
        focusedId: activeElement instanceof HTMLElement ? activeElement.id : null,
        visibleInPanel: visibleBottom - visibleTop > 0,
        outline: style.outline,
        backgroundColor: style.backgroundColor
      };
    },
    {
      sourceToggleSelector: panelSectionToggleSelector("sources"),
      targetId: sourceMarkerTarget.targetId,
      panelSelector: placePanelSelector
    }
  );
  if (!sourceMarkerJump) {
    throw new Error("Could not read source-marker jump details after clicking [n].");
  }
  if (sourceMarkerJump.expanded !== "true") {
    throw new Error(
      `Clicking an inline [n] marker should open Sources, got aria-expanded='${sourceMarkerJump.expanded}'.`
    );
  }
  if (sourceMarkerJump.focusedId !== sourceMarkerTarget.targetId) {
    throw new Error(
      `Inline [n] marker should focus ${sourceMarkerTarget.targetId}, got '${sourceMarkerJump.focusedId ?? "null"}'.`
    );
  }
  if (!sourceMarkerJump.visibleInPanel) {
    throw new Error(`Inline [n] marker jump target '${sourceMarkerTarget.targetId}' is not visible.`);
  }
  const sourceEntryHighlightColor = parseCssRgbColor(sourceMarkerJump.backgroundColor);
  if (!sourceMarkerJump.outline || sourceMarkerJump.outline === "none") {
    throw new Error("Inline [n] marker jump target should show a visible focus ring.");
  }
  if (sourceEntryHighlightColor && sourceEntryHighlightColor.a > 0) {
    // Background flash is preferred, but focus ring is the required fallback emphasis.
  }

  await setPanelSectionExpanded(page, "photo-credits", true);

  const photoCreditsNoteText = (
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photo-credits'] [data-photo-credits-note='true']")
      .textContent()
  )
    ?.replace(/\s+/gu, " ")
    .trim();
  const expectedPhotoCreditsNote =
    "Photos are unmodified, except that the panel crops them to fit. Open a photo to see it whole.";
  if (photoCreditsNoteText !== expectedPhotoCreditsNote) {
    throw new Error(
      `Photo-credits note mismatch. expected='${expectedPhotoCreditsNote}', got='${photoCreditsNoteText ?? ""}'.`
    );
  }

  const photoCreditEntries = await page.$$eval(photoCreditsEntriesSelector, (elements) =>
    elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  if (photoCreditEntries.length !== capernaumImages.length) {
    throw new Error(
      `Photo-credits entry count mismatch for Capernaum: expected ${capernaumImages.length}, got ${photoCreditEntries.length}.`
    );
  }
  for (const [index, image] of capernaumImages.entries()) {
    const entryText = photoCreditEntries[index] ?? "";
    if (!creditMatchesImage(entryText, image)) {
      throw new Error(
        `Photo-credit entry ${index + 1} does not match image '${image.id}': '${entryText}'.`
      );
    }
  }

  const creditLinkAriaLabel = await page
    .locator(`${placePanelSelector} [data-panel-section='photos'] [data-photo-credit-link='true']`)
    .first()
    .getAttribute("aria-label");
  if (creditLinkAriaLabel !== "Credit for image 1") {
    throw new Error(
      `Panel credit link accessible name mismatch. expected='Credit for image 1', got='${creditLinkAriaLabel ?? "null"}'.`
    );
  }

  await setPanelSectionExpanded(page, "photo-credits", false);
  const firstCreditFocus = await jumpToCurrentImageCredit(page);
  if (firstCreditFocus.focusedEntry?.imageIndex !== 1) {
    throw new Error(
      `Lead image credit link focused wrong entry: ${JSON.stringify(firstCreditFocus.focusedEntry)}.`
    );
  }
  if (!firstCreditFocus.photoCreditsExpanded) {
    throw new Error("Credit link should open photo credits when they are collapsed.");
  }
  if (!creditMatchesImage(firstCreditFocus.focusedEntry?.text ?? "", capernaumImages[0])) {
    throw new Error(
      `Lead image credit link focused wrong text: '${firstCreditFocus.focusedEntry?.text ?? ""}'.`
    );
  }

  const nextImage = page.locator("button[aria-label='Next image']");
  const hasCarousel = (await nextImage.count()) > 0;
  let secondCreditFocus = null;
  if (hasCarousel) {
    await nextImage.first().click();
    await page.waitForTimeout(200);
    await setPanelSectionExpanded(page, "photo-credits", false);
    secondCreditFocus = await jumpToCurrentImageCredit(page);
    if (secondCreditFocus.focusedEntry?.imageIndex !== 2) {
      throw new Error(
        `Second image credit link focused wrong entry: ${JSON.stringify(secondCreditFocus.focusedEntry)}.`
      );
    }
    if (!creditMatchesImage(secondCreditFocus.focusedEntry?.text ?? "", capernaumImages[1])) {
      throw new Error(
        `Second image credit link focused wrong text: '${secondCreditFocus.focusedEntry?.text ?? ""}'.`
      );
    }
  }

  return {
    sectionIds,
    hasCarousel,
    collapsedDefaults: {
      sources: true,
      photoCredits: true
    },
    hiddenSectionSnapshot,
    sourceMarkerJump,
    photoCreditEntryCount: photoCreditEntries.length,
    firstCreditFocus,
    secondCreditFocus,
    creditLinkAriaLabel
  };
}

async function verifyAboutPlaceLinksOpenPlacesAndSupportBack(page, baseUrl) {
  const panelSelector = "section[aria-label='Place details']";
  const sectionSelector = `${panelSelector} [data-panel-section]`;

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector(`${panelSelector} [data-panel-section='about']`, { timeout: 30_000 });

  const jerusalemSectionIds = await page.$$eval(sectionSelector, (elements) =>
    elements.map((element) => element.getAttribute("data-panel-section") ?? "")
  );
  const aboutIndex = jerusalemSectionIds.indexOf("about");
  const placesInIndex = jerusalemSectionIds.indexOf("places-in");
  if (aboutIndex < 0 || placesInIndex < 0) {
    throw new Error(
      `Jerusalem panel must include About and Places in sections, got order: ${jerusalemSectionIds.join(" -> ")}`
    );
  }
  if (placesInIndex !== aboutIndex + 1) {
    throw new Error(
      `Jerusalem panel should place 'Places in' directly after About, got: ${jerusalemSectionIds.join(" -> ")}`
    );
  }

  const places = JSON.parse(await fs.readFile(generatedPlacesPath, "utf8"));
  const placeById = new Map(places.map((place) => [place.id, place]));
  const majorPlaceIds = places
    .filter((place) => place.prominence === "major")
    .map((place) => place.id);
  const placeSearchOrder = ["jerusalem", ...majorPlaceIds.filter((placeId) => placeId !== "jerusalem")];

  let sourcePlaceId = null;
  let sourcePlaceName = null;
  let linkedPlaceId = null;
  let linkedText = null;

  for (const placeId of placeSearchOrder) {
    if (placeId !== "jerusalem") {
      await page.goto(`${baseUrl}/?place=${encodeURIComponent(placeId)}`, {
        waitUntil: "domcontentloaded",
        timeout: 120_000
      });
      await waitForMapToSettle(page);
      await page.waitForSelector(`${panelSelector} [data-panel-section='about']`, { timeout: 30_000 });
    }

    const links = page.locator(
      `${panelSelector} [data-panel-section='about'] [data-about-place-link='true']`
    );
    const linkCount = await links.count();
    if (linkCount === 0) {
      continue;
    }

    const firstLink = links.first();
    const candidateLinkedPlaceId = await firstLink.getAttribute("data-about-place-id");
    if (!candidateLinkedPlaceId || !placeById.has(candidateLinkedPlaceId)) {
      continue;
    }

    const headingText = normalizeTextContent(
      (await page.locator(`${panelSelector} h1`).textContent()) ?? ""
    );
    if (!headingText) {
      continue;
    }

    sourcePlaceId = placeId;
    sourcePlaceName = headingText;
    linkedPlaceId = candidateLinkedPlaceId;
    linkedText = normalizeTextContent((await firstLink.textContent()) ?? "");
    break;
  }

  if (!sourcePlaceId || !sourcePlaceName || !linkedPlaceId) {
    throw new Error(
      "No About-place links were found on Jerusalem or any major place, so link navigation could not be verified."
    );
  }

  const activeAboutLink = page
    .locator(`${panelSelector} [data-panel-section='about'] [data-about-place-link='true']`)
    .first();
  await activeAboutLink.click();

  await page.waitForFunction(
    (expectedPlaceId) => {
      const parameters = new URLSearchParams(window.location.search.slice(1));
      return parameters.get("place") === expectedPlaceId;
    },
    linkedPlaceId,
    { timeout: 30_000, polling: 100 }
  );

  const linkedPlace = placeById.get(linkedPlaceId);
  const expectedLinkedPlaceName =
    linkedPlace?.names?.ancient?.[0] ?? linkedPlace?.names?.modern ?? linkedPlaceId;
  await page.waitForFunction(
    (expectedName) => {
      const heading = document.querySelector("section[aria-label='Place details'] h1");
      return (heading?.textContent ?? "").trim() === expectedName;
    },
    expectedLinkedPlaceName,
    { timeout: 30_000, polling: 100 }
  );

  await page.goBack({ waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  await page.waitForFunction(
    (expectedPlaceId) => {
      const parameters = new URLSearchParams(window.location.search.slice(1));
      return parameters.get("place") === expectedPlaceId;
    },
    sourcePlaceId,
    { timeout: 30_000, polling: 100 }
  );
  await page.waitForFunction(
    (expectedName) => {
      const heading = document.querySelector("section[aria-label='Place details'] h1");
      return (heading?.textContent ?? "").trim() === expectedName;
    },
    sourcePlaceName,
    { timeout: 30_000, polling: 100 }
  );

  return {
    jerusalemSectionIds,
    sourcePlaceId,
    sourcePlaceName,
    linkedPlaceId,
    linkedPlaceName: expectedLinkedPlaceName,
    linkedText,
    usedJerusalemAsLinkSource: sourcePlaceId === "jerusalem"
  };
}

async function verifyPointerCursorAndNearPinClick(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }

    map.jumpTo({
      center: [35.23, 31.78],
      zoom: 11
    });
  }, mapTestHookKey);
  await waitForMapToSettle(page);

  const probe = await page.evaluate(
    ({
      testHookKey,
      interactiveLayers
    }) => {
      const map = window[testHookKey];
      if (!map) {
        return null;
      }

      const canvas = map.getCanvas();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const margin = 16;
      const clampPoint = (point) => ({
        x: Math.min(width - margin, Math.max(margin, point.x)),
        y: Math.min(height - margin, Math.max(margin, point.y))
      });

      const resolveJerusalemPoint = () => {
        const knownJerusalemPoint = clampPoint(map.project([35.23, 31.78]));
        const jerusalemFromAnyLayer = map
          .queryRenderedFeatures(undefined)
          .find((feature) => feature.properties?.placeId === "jerusalem" && feature.geometry?.type === "Point");
        if (
          jerusalemFromAnyLayer?.geometry?.type === "Point" &&
          Array.isArray(jerusalemFromAnyLayer.geometry.coordinates)
        ) {
          return clampPoint(map.project(jerusalemFromAnyLayer.geometry.coordinates));
        }

        const jerusalemFeature = map
          .queryRenderedFeatures(undefined, { layers: interactiveLayers })
          .find((feature) => feature.properties?.placeId === "jerusalem" && feature.geometry?.type === "Point");
        if (jerusalemFeature?.geometry?.type === "Point" && Array.isArray(jerusalemFeature.geometry.coordinates)) {
          return clampPoint(map.project(jerusalemFeature.geometry.coordinates));
        }

        for (let radius = 2; radius <= 72; radius += 8) {
          for (let x = knownJerusalemPoint.x - radius; x <= knownJerusalemPoint.x + radius; x += 4) {
            for (let y = knownJerusalemPoint.y - radius; y <= knownJerusalemPoint.y + radius; y += 4) {
              const point = clampPoint({ x, y });
              const hits = map.queryRenderedFeatures(
                [
                  [point.x - 3, point.y - 3],
                  [point.x + 3, point.y + 3]
                ],
                { layers: interactiveLayers }
              );
              if (hits.some((hit) => hit.properties?.placeId === "jerusalem")) {
                return point;
              }
            }
          }
        }

        const step = 6;
        for (let y = margin; y <= height - margin; y += step) {
          for (let x = margin; x <= width - margin; x += step) {
            const hits = map.queryRenderedFeatures(
              [
                [x - 3, y - 3],
                [x + 3, y + 3]
              ],
              { layers: interactiveLayers }
            );
            if (hits.some((hit) => hit.properties?.placeId === "jerusalem")) {
              return { x, y };
            }
          }
        }

        return knownJerusalemPoint;
      };

      const jerusalemPoint = resolveJerusalemPoint();
      if (!jerusalemPoint) {
        return null;
      }

      const findEmptyPoint = () => {
        const step = 24;
        for (let y = margin; y <= height - margin; y += step) {
          for (let x = margin; x <= width - margin; x += step) {
            const hitCount = map.queryRenderedFeatures(
              [
                [x - 2, y - 2],
                [x + 2, y + 2]
              ],
              {
                layers: interactiveLayers
              }
            ).length;
            if (hitCount === 0) {
              return { x, y };
            }
          }
        }

        return null;
      };

      return {
        jerusalemPoint,
        emptyPoint: findEmptyPoint()
      };
    },
    {
      testHookKey: mapTestHookKey,
      interactiveLayers: [
        ...allClusterPinLayerIds,
        ...allClusterLabelLayerIds,
        mapLayerIds.candidatePins,
        mapLayerIds.sitePins,
        mapLayerIds.sitePinsNoDot,
        "ibm-routes-site-pin",
        ...allCityPinLayerIds,
        "ibm-routes-major-pin",
        "ibm-routes-city-pin",
        "ibm-selected-major-pin-label",
        "ibm-selected-site-pin-label",
        "ibm-selected-pin-label",
        ...mapLayerIds.areaLabels
      ]
    }
  );
  if (!probe?.jerusalemPoint || !probe.emptyPoint) {
    throw new Error(
      `Could not resolve map probe points for cursor/click checks: ${JSON.stringify(probe)}`
    );
  }

  const pointerOffsets = [
    [0, 0],
    [6, 0],
    [-6, 0],
    [0, 6],
    [0, -6],
    [10, 10],
    [-10, 10],
    [10, -10],
    [-10, -10]
  ];
  let cursorOverPin = null;
  let pointerPoint = null;
  for (const [offsetX, offsetY] of pointerOffsets) {
    const candidatePoint = {
      x: probe.jerusalemPoint.x + offsetX,
      y: probe.jerusalemPoint.y + offsetY
    };
    await page.mouse.move(candidatePoint.x, candidatePoint.y);
    await page.waitForTimeout(150);
    const cursor = await page.$eval("canvas.maplibregl-canvas", (element) =>
      window.getComputedStyle(element).cursor
    );
    if (cursor.includes("pointer")) {
      cursorOverPin = cursor;
      pointerPoint = candidatePoint;
      break;
    }
  }
  if (!pointerPoint || !cursorOverPin) {
    throw new Error(`Cursor over clickable place should be pointer near Jerusalem, got '${cursorOverPin}'.`);
  }

  await page.mouse.move(probe.emptyPoint.x, probe.emptyPoint.y);
  const cursorOverEmptyMap = await page.$eval("canvas.maplibregl-canvas", (element) =>
    window.getComputedStyle(element).cursor
  );
  if (cursorOverEmptyMap.includes("pointer")) {
    throw new Error(`Cursor over empty map should not be pointer, got '${cursorOverEmptyMap}'.`);
  }

  // A click near the name, within its box plus the hit padding, selects it.
  await page.mouse.click(pointerPoint.x + 6, pointerPoint.y + 6);
  await page.waitForFunction(() => {
    const parameters = new URLSearchParams(window.location.search.slice(1));
    return parameters.get("place") === "jerusalem";
  }, undefined, { timeout: 30_000, polling: 100 });
  await page.getByRole("heading", { level: 1, name: "Jerusalem" }).waitFor({ timeout: 30_000 });

  return {
    jerusalemPoint: probe.jerusalemPoint,
    pointerPoint,
    emptyPoint: probe.emptyPoint,
    cursorOverPin,
    cursorOverEmptyMap
  };
}

async function verifyGalleryFixtureWithViewer(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const screenshotPaths = {
    panel: temporaryGalleryScreenshotPath("gallery-10-image-place.png"),
    thumbnails: temporaryGalleryScreenshotPath("gallery-thumbnail-row.png"),
    viewer: temporaryGalleryScreenshotPath("gallery-viewer-open.png"),
    aiLabel: temporaryGalleryScreenshotPath("gallery-ai-label.png")
  };
  const imageRequests = [];

  await fs.mkdir(path.dirname(screenshotPaths.panel), { recursive: true });

  const capernaumPayload = await readGeneratedPlacePayload("capernaum");
  const galleryFixturePayload = buildGalleryFixturePayload(capernaumPayload);
  await routeGalleryFixtureRequests(page, galleryFixturePayload, imageRequests);

  try {
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
      timeout: 30_000
    });

    const photosSection = page.locator(
      "section[aria-label='Place details'] [data-panel-section='photos']"
    );
    await photosSection.getByRole("button", { name: "Previous image" }).waitFor({ timeout: 30_000 });
    await photosSection.getByRole("button", { name: "Next image" }).waitFor({ timeout: 30_000 });
    await photosSection.getByText("1 / 10", { exact: true }).waitFor({ timeout: 30_000 });
    await photosSection.screenshot({ path: screenshotPaths.panel });

    const thumbnails = page.locator("[data-thumbnail-row='true'] button[data-gallery-thumbnail]");
    const thumbnailCount = await thumbnails.count();
    if (thumbnailCount !== 10) {
      throw new Error(`Fixture gallery should render 10 thumbnails, got ${thumbnailCount}.`);
    }
    await page.locator("[data-thumbnail-row='true']").screenshot({
      path: screenshotPaths.thumbnails
    });

    const initialKindLabel = normalizeTextContent(
      (await page
        .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
        .textContent()) ?? ""
    );
    if (initialKindLabel !== "Today") {
      throw new Error(`Expected first fixture image kind label to be 'Today', got '${initialKindLabel}'.`);
    }

    await page.waitForTimeout(600);
    const commonsRequestsBeforeViewer = imageRequests
      .map((requestUrl) => parseCommonsThumbnailRequest(requestUrl))
      .filter((entry) => entry !== null);
    const aboveThumbnailFilesBeforeViewer = new Set(
      commonsRequestsBeforeViewer
        .filter((entry) => entry.width > 330)
        .map((entry) => entry.fileName)
    );
    if (aboveThumbnailFilesBeforeViewer.size > 2) {
      throw new Error(
        `Expected at most two above-thumbnail Commons requests before opening viewer, got ${JSON.stringify(Array.from(aboveThumbnailFilesBeforeViewer))}.`
      );
    }
    const panoramaFileName = "M3_5_Fixture_Capernaum_Modern_01.jpg";
    const panoramaPanelRequestWidths = commonsRequestsBeforeViewer
      .filter((entry) => entry.fileName === panoramaFileName && entry.width > 330)
      .map((entry) => entry.width);
    if (panoramaPanelRequestWidths.length === 0) {
      throw new Error("Expected a panel Commons thumbnail request above 330px for the panorama fixture.");
    }
    const panoramaPanelRequestWidth = Math.max(...panoramaPanelRequestWidths);
    if (panoramaPanelRequestWidth < 1280) {
      throw new Error(
        `Expected panorama panel request width >= 1280, got ${panoramaPanelRequestWidth}.`
      );
    }
    const fourByThreeFileName = "M3_5_Fixture_Capernaum_Modern_02.jpg";
    const fourByThreePanelRequestWidths = commonsRequestsBeforeViewer
      .filter((entry) => entry.fileName === fourByThreeFileName && entry.width > 330)
      .map((entry) => entry.width);
    if (fourByThreePanelRequestWidths.length === 0) {
      throw new Error("Expected a panel Commons thumbnail request above 330px for the 4:3 fixture image.");
    }
    const fourByThreePanelRequestWidth = Math.max(...fourByThreePanelRequestWidths);
    if (fourByThreePanelRequestWidth < 500) {
      throw new Error(
        `Expected 4:3 panel request width >= 500, got ${fourByThreePanelRequestWidth}.`
      );
    }
    const panelRenderState = await page.evaluate(() => {
      const image = document.querySelector(
        "section[aria-label='Place details'] [data-panel-section='photos'] [data-panel-photo-image='true']"
      );
      if (!(image instanceof HTMLElement)) {
        return null;
      }
      const rect = image.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        devicePixelRatio: window.devicePixelRatio || 1
      };
    });
    if (!panelRenderState) {
      throw new Error("Could not read panel image render bounds for panorama quality checks.");
    }
    const panoramaRequestHeight = (panoramaPanelRequestWidth * 2516) / 13068;
    const renderedDeviceWidth = panelRenderState.width * panelRenderState.devicePixelRatio;
    const renderedDeviceHeight = panelRenderState.height * panelRenderState.devicePixelRatio;
    const fourByThreeRequiredCoverWidth = Math.max(
      renderedDeviceWidth,
      renderedDeviceHeight * (4032 / 3024)
    );
    if (fourByThreePanelRequestWidth + 1 < fourByThreeRequiredCoverWidth) {
      throw new Error(
        `4:3 panel image request is too small for cover-fit rendering (request=${fourByThreePanelRequestWidth}, required=${fourByThreeRequiredCoverWidth.toFixed(2)}).`
      );
    }
    if (renderedDeviceWidth > panoramaPanelRequestWidth + 1) {
      throw new Error(
        `Panorama panel image is upscaled horizontally (rendered=${renderedDeviceWidth.toFixed(2)} request=${panoramaPanelRequestWidth}).`
      );
    }
    if (renderedDeviceHeight > panoramaRequestHeight + 1) {
      throw new Error(
        `Panorama panel image is upscaled vertically (rendered=${renderedDeviceHeight.toFixed(2)} request=${panoramaRequestHeight.toFixed(2)}).`
      );
    }

    const thumbnailCommonsBeforeViewer = new Set(
      commonsRequestsBeforeViewer
        .filter((entry) => entry.width === 330)
        .map((entry) => entry.fileName)
    );
    if (thumbnailCommonsBeforeViewer.size < 9) {
      throw new Error(
        `Expected 330px thumbnail requests for the 9 Commons fixture images, got ${thumbnailCommonsBeforeViewer.size}.`
      );
    }
    const width1280BeforeViewer = commonsRequestsBeforeViewer.filter(
      (entry) => entry.width === 1280
    ).length;

    await page.getByRole("button", { name: "Show image 5 of 10" }).click();
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
      .getByText("AI-generated reconstruction", { exact: true })
      .waitFor({ timeout: 30_000 });
    await setPanelSectionExpanded(page, "photo-credits", true);
    const aiCreditText = await readPhotoCreditEntryForImage(page, 5);
    if (
      !aiCreditText.includes("AI-generated reconstruction") ||
      !aiCreditText.includes("DALL·E") ||
      !aiCreditText.includes("CC BY-SA 4.0") ||
      !aiCreditText.includes("Based on: research brief")
    ) {
      throw new Error(`AI credit line mismatch: '${aiCreditText}'.`);
    }
    const aiBriefHref = await page
      .locator(
        `${photoCreditEntrySelectorForImage(5)} a`
      )
      .last()
      .getAttribute("href");
    const expectedAiBriefHref =
      "https://github.com/jameshuangdevelop/interactive-bible-map/blob/main/content/image-prompts/capernaum.md#prompt-2-synagogue-and-harbour";
    if (aiBriefHref !== expectedAiBriefHref) {
      throw new Error(
        `AI source link mismatch. expected='${expectedAiBriefHref}', got='${aiBriefHref ?? "null"}'.`
      );
    }
    await page.getByRole("button", { name: "Show image 6 of 10" }).click();
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
      .getByText("Historical view", { exact: true })
      .waitFor({ timeout: 30_000 });
    const historicalPanelKindLabel = normalizeTextContent(
      (await page
        .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
        .textContent()) ?? ""
    );
    if (historicalPanelKindLabel !== "Historical view") {
      throw new Error(
        `Expected historical fixture label in panel, got '${historicalPanelKindLabel}'.`
      );
    }
    await page.getByRole("button", { name: "Show image 5 of 10" }).click();
    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-kind-label='true']")
      .getByText("AI-generated reconstruction", { exact: true })
      .waitFor({ timeout: 30_000 });
    await photosSection.screenshot({ path: screenshotPaths.aiLabel });
    const layoutDesktopSnapshot = await captureGalleryPanelLayoutSnapshot(page);
    assertGalleryPanelBoundsAndOverflow(layoutDesktopSnapshot, "Gallery bounds 1440x960");
    const labelContrastDesktop = assertGalleryLabelContrast(
      layoutDesktopSnapshot.labelStyle,
      "Gallery label contrast 1440x960"
    );

    for (let index = 0; index < 5; index += 1) {
      await page.getByRole("button", { name: "Next image" }).click();
    }
    await photosSection.getByText("10 / 10", { exact: true }).waitFor({ timeout: 30_000 });
    const selectedThumbnailDesktopSnapshot = await captureGalleryPanelLayoutSnapshot(page);
    assertSelectedThumbnailInView(
      selectedThumbnailDesktopSnapshot,
      "Gallery selected thumbnail 1440x960"
    );

    for (let index = 0; index < 5; index += 1) {
      await page.getByRole("button", { name: "Previous image" }).click();
    }
    await photosSection.getByText("5 / 10", { exact: true }).waitFor({ timeout: 30_000 });

    const opener = page.locator("[data-image-viewer-open='true']");
    await opener.focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector("[data-image-viewer-dialog='true']", {
      state: "visible",
      timeout: 30_000
    });
    const viewerBackgroundInertCheck = await page.evaluate(() => {
      const appShellRoot = document.querySelector("[data-app-shell-root]");
      const overlay = document.querySelector("[data-image-viewer-overlay='true']");
      if (!(appShellRoot instanceof HTMLElement) || !(overlay instanceof HTMLElement)) {
        return null;
      }

      const backgroundChildren = Array.from(appShellRoot.children).filter(
        (child) => child instanceof HTMLElement && !child.contains(overlay)
      );
      return {
        backgroundChildCount: backgroundChildren.length,
        nonInertChildCount: backgroundChildren.filter((child) => !child.hasAttribute("inert"))
          .length
      };
    });
    if (
      !viewerBackgroundInertCheck ||
      viewerBackgroundInertCheck.backgroundChildCount === 0 ||
      viewerBackgroundInertCheck.nonInertChildCount !== 0
    ) {
      throw new Error(
        `Image viewer should set inert on the app-shell background, got ${JSON.stringify(viewerBackgroundInertCheck)}.`
      );
    }
    await page.locator("[data-image-viewer-dialog='true']").screenshot({
      path: screenshotPaths.viewer
    });

    const viewerKindLabel = normalizeTextContent(
      (await page
        .locator("[data-image-viewer-dialog='true'] [data-photo-kind-label='true']")
        .textContent()) ?? ""
    );
    if (viewerKindLabel !== "AI-generated reconstruction") {
      throw new Error(
        `Viewer should show AI kind label, got '${viewerKindLabel}'.`
      );
    }
    const viewerControlSnapshot = await captureViewerControlLayoutSnapshot(page);
    assertViewerControlLayout(viewerControlSnapshot, "Viewer controls 1440x960");

    await page.waitForTimeout(600);
    const width1280AfterViewerOpen = imageRequests
      .map((requestUrl) => parseCommonsThumbnailRequest(requestUrl))
      .filter((entry) => entry !== null && entry.width === 1280).length;
    if (width1280AfterViewerOpen <= width1280BeforeViewer) {
      throw new Error(
        `Viewer should request 1280px images only when opened (before=${width1280BeforeViewer}, after=${width1280AfterViewerOpen}).`
      );
    }

    await page.keyboard.press("ArrowRight");
    await page
      .locator("[data-image-viewer-dialog='true']")
      .getByText("6 / 10", { exact: true })
      .waitFor({ timeout: 30_000 });
    const viewerHistoricalKindLabel = normalizeTextContent(
      (await page
        .locator("[data-image-viewer-dialog='true'] [data-photo-kind-label='true']")
        .textContent()) ?? ""
    );
    if (viewerHistoricalKindLabel !== "Historical view") {
      throw new Error(`Viewer should show historical kind label, got '${viewerHistoricalKindLabel}'.`);
    }
    await page.keyboard.press("ArrowLeft");
    await page
      .locator("[data-image-viewer-dialog='true']")
      .getByText("5 / 10", { exact: true })
      .waitFor({ timeout: 30_000 });

    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("Tab");
      const focusInsideDialog = await page.evaluate(() => {
        const dialog = document.querySelector("[data-image-viewer-dialog='true']");
        return !!dialog && dialog.contains(document.activeElement);
      });
      if (!focusInsideDialog) {
        throw new Error("Tab moved focus outside the image viewer dialog.");
      }
    }
    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press("Shift+Tab");
      const focusInsideDialog = await page.evaluate(() => {
        const dialog = document.querySelector("[data-image-viewer-dialog='true']");
        return !!dialog && dialog.contains(document.activeElement);
      });
      if (!focusInsideDialog) {
        throw new Error("Shift+Tab moved focus outside the image viewer dialog.");
      }
    }

    await page.keyboard.press("/");
    const slashShortcutCheck = await page.evaluate(() => {
      const dialog = document.querySelector("[data-image-viewer-dialog='true']");
      const searchInput = document.querySelector("input[aria-label='Search biblical places']");
      const activeElement = document.activeElement;

      return {
        dialogOpen: Boolean(dialog),
        focusInsideDialog:
          dialog instanceof HTMLElement &&
          activeElement instanceof HTMLElement &&
          dialog.contains(activeElement),
        searchFocused:
          searchInput instanceof HTMLElement &&
          activeElement instanceof HTMLElement &&
          activeElement === searchInput
      };
    });
    if (!slashShortcutCheck.dialogOpen) {
      throw new Error("Pressing '/' unexpectedly closed the image viewer dialog.");
    }
    if (!slashShortcutCheck.focusInsideDialog) {
      throw new Error("Pressing '/' moved focus outside the image viewer dialog.");
    }
    if (slashShortcutCheck.searchFocused) {
      throw new Error("Pressing '/' while the image viewer is open focused the search input.");
    }

    const fixturePanelA11y = await runA11yCheck(
      page,
      "section[aria-label='Place details']",
      "Fixture gallery panel accessibility",
      {
        requireZeroViolations: true
      }
    );
    const fixtureViewerA11y = await runA11yCheck(
      page,
      "[data-image-viewer-dialog='true']",
      "Fixture gallery viewer accessibility",
      {
        requireZeroViolations: true
      }
    );

    await page.keyboard.press("Escape");
    await page.waitForSelector("[data-image-viewer-dialog='true']", {
      state: "detached",
      timeout: 30_000
    });
    await page.waitForFunction(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement && active.getAttribute("data-image-viewer-open") === "true";
    }, { timeout: UI_STATE_TIMEOUT_MS });
    const focusRestored = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement && active.getAttribute("data-image-viewer-open") === "true";
    });
    if (!focusRestored) {
      throw new Error("Esc should close the image viewer and restore focus to the opener.");
    }
    const lingeringInertBackground = await page.evaluate(() => {
      const appShellRoot = document.querySelector("[data-app-shell-root]");
      if (!(appShellRoot instanceof HTMLElement)) {
        return null;
      }

      return Array.from(appShellRoot.children).filter(
        (child) => child instanceof HTMLElement && child.hasAttribute("inert")
      ).length;
    });
    if (typeof lingeringInertBackground === "number" && lingeringInertBackground > 0) {
      throw new Error(
        `Image viewer left background elements inert after close (${lingeringInertBackground}).`
      );
    }

    const layoutNarrowViewportCheck = await verifyGalleryFixtureBoundsAtViewport(
      browser,
      baseUrl,
      galleryFixturePayload,
      { width: 1024, height: 768 }
    );

    return {
      screenshotPaths,
      thumbnailCount,
      fullSizeBeforeViewer: Array.from(aboveThumbnailFilesBeforeViewer).sort((a, b) =>
        a.localeCompare(b)
      ),
      panoramaPanelRequestWidth,
      fourByThreePanelRequestWidth,
      panoramaUpscaleCheck: {
        requestWidth: panoramaPanelRequestWidth,
        requestHeight: panoramaRequestHeight,
        renderedDeviceWidth,
        renderedDeviceHeight
      },
      width1280BeforeViewer,
      width1280AfterViewerOpen,
      aiCreditText,
      aiBriefHref,
      modalChecks: {
        viewerBackgroundInert: viewerBackgroundInertCheck,
        slashShortcut: slashShortcutCheck,
        lingeringInertBackground
      },
      layoutChecks: {
        desktop1440: {
          labelContrast: labelContrastDesktop,
          rowScrollLeft: selectedThumbnailDesktopSnapshot.rowScrollLeft,
          rowScrollableWidth: selectedThumbnailDesktopSnapshot.rowScrollableWidth
        },
        desktop1024: layoutNarrowViewportCheck
      },
      accessibility: {
        fixturePanel: fixturePanelA11y,
        fixtureViewer: fixtureViewerA11y
      }
    };
  } finally {
    await page.unroute("**/*");
    await page.close();
    await context.close();
  }
}

async function readLoadedPanelImageState(page, previousSrc = null) {
  await page.waitForFunction(
    (priorSrc) => {
      const image = document.querySelector("[data-panel-photo-image='true']");
      return (
        image instanceof HTMLImageElement &&
        image.complete &&
        image.naturalWidth > 0 &&
        image.naturalHeight > 0 &&
        image.currentSrc !== priorSrc
      );
    },
    previousSrc,
    { timeout: 30_000 }
  );

  return page.$eval("[data-panel-photo-image='true']", (element) => {
    if (!(element instanceof HTMLImageElement)) {
      throw new Error("Panel photo element is not an image.");
    }

    return {
      src: element.getAttribute("src") ?? "",
      currentSrc: element.currentSrc,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight
    };
  });
}

// Loads Capernaum's images in gallery order up to its first Commons photo. A self-hosted
// AI image must load from the exported media/ai/ folder; a Commons photo must use an
// allow-listed thumbnail width.
async function verifyCapernaumLeadImageLoads(page, baseUrl) {
  const capernaumImages = await readCapernaumImages();
  const firstCommonsIndex = capernaumImages.findIndex((image) => !isAiPayloadImage(image));
  if (firstCommonsIndex < 0) {
    throw new Error("Capernaum should have at least one Commons photo.");
  }

  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
    timeout: 30_000
  });

  const loadedImages = [];
  let previousSrc = null;
  for (let index = 0; index <= firstCommonsIndex; index += 1) {
    if (index > 0) {
      await page.locator("button[aria-label='Next image']").first().click();
    }

    const imageState = await readLoadedPanelImageState(page, previousSrc);
    const image = capernaumImages[index];
    const pathname = new URL(imageState.currentSrc).pathname;
    if (isAiPayloadImage(image)) {
      if (!pathname.endsWith(`/${image.url}`)) {
        throw new Error(
          `AI image '${image.id}' did not load from '${image.url}': '${imageState.currentSrc}'.`
        );
      }
    } else if (!/(?:^|\/)(?:330|500|960|1280)px-[^/]+$/u.test(pathname)) {
      throw new Error(
        `Photo '${image.id}' did not use an allow-listed Commons thumbnail width: '${imageState.currentSrc}'.`
      );
    }

    loadedImages.push({ id: image.id, kind: image.kind, ...imageState });
    previousSrc = imageState.currentSrc;
  }

  return loadedImages;
}

async function verifyImageFailurePlaceholderKeepsCredit(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const capernaumImages = await readCapernaumImages();
  let blockedImageCount = 0;

  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    const isCommonsImage =
      requestUrl.includes("upload.wikimedia.org/wikipedia/commons") &&
      /\.(?:jpg|jpeg|png|webp)(?:\?|$)/iu.test(requestUrl);
    const isHostedAiImage = /\/media\/ai\/[^/?#]+\.webp(?:\?|$)/iu.test(requestUrl);
    if (isCommonsImage || isHostedAiImage) {
      blockedImageCount += 1;
      route.abort("failed");
      return;
    }

    route.fallback();
  });

  try {
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForSelector("section[aria-label='Place details']", {
      state: "visible",
      timeout: 30_000
    });
    await setPanelSectionExpanded(page, "photo-credits", true);
    await page.waitForSelector(photoCreditsEntriesSelector, {
      timeout: 30_000
    });
    await page.waitForSelector("section[aria-label='Place details'] >> text=Image unavailable", {
      timeout: 30_000
    });

    const creditText = await readPhotoCreditEntryForImage(page, 1);
    if (!creditMatchesImage(creditText, capernaumImages[0])) {
      throw new Error(
        `Photo credit must remain visible when images fail to load, got '${creditText.trim()}'.`
      );
    }
    if (blockedImageCount === 0) {
      throw new Error("Image-failure placeholder check was vacuous: no images were blocked.");
    }

    return {
      blockedImageCount,
      creditText: creditText.trim()
    };
  } finally {
    await page.unroute("**/*");
    await page.close();
    await context.close();
  }
}

async function verifyDisputedAndHierarchyLayouts(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-modern-name-line='true']", {
    timeout: 30_000
  });

  const emmausTodayLine =
    (await page
      .locator("section[aria-label='Place details'] [data-modern-name-line='true']")
      .textContent()) ?? "";
  const emmausTodayLineNormalized = emmausTodayLine.replace(/\s+/gu, " ").trim();
  if (!emmausTodayLine.includes("Today: Israel and the West Bank")) {
    throw new Error(`Emmaus today line is missing countries: '${emmausTodayLine.trim()}'.`);
  }
  if (
    !emmausTodayLineNormalized.includes("Location disputed") ||
    !emmausTodayLineNormalized.includes("4 proposed sites")
  ) {
    throw new Error(`Emmaus today line is missing disputed-chip text: '${emmausTodayLineNormalized}'.`);
  }

  const emmausDisputedChipCount = await page
    .locator(
      "section[aria-label='Place details'] [data-modern-name-line='true'] [data-location-chip='disputed']"
    )
    .count();
  if (emmausDisputedChipCount !== 1) {
    throw new Error(`Expected one disputed chip on Emmaus today line, got ${emmausDisputedChipCount}.`);
  }

  const candidateCount = await page
    .locator("section[aria-label='Place details'] button[aria-label^='Candidate ']")
    .count();
  if (candidateCount !== 4) {
    throw new Error(`Expected 4 Emmaus candidate entries, got ${candidateCount}.`);
  }

  await page.goto(`${baseUrl}/?place=jericho`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  const jerichoNamesText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='names']")
      .textContent()) ?? "";
  if (!jerichoNamesText.includes("2 sites")) {
    throw new Error(`Jericho should render the neutral multi-site line, got '${jerichoNamesText.trim()}'.`);
  }
  const jerichoDisputedChipCount = await page
    .locator("section[aria-label='Place details'] [data-location-chip='disputed']")
    .count();
  if (jerichoDisputedChipCount > 0) {
    throw new Error("Jericho should not render a disputed-location chip.");
  }

  await page.goto(`${baseUrl}/?place=italy`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  const italyNamesText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='names']")
      .textContent()) ?? "";
  if (!italyNamesText.includes("Governed directly from Rome · Roman Empire")) {
    throw new Error(
      `Italy hierarchy line must use the Rome-governance exception, got '${italyNamesText.trim()}'.`
    );
  }

  await page.goto(`${baseUrl}/?place=roman-empire`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  const empireNamesText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='names']")
      .textContent()) ?? "";
  if (!empireNamesText.includes("Empire")) {
    throw new Error(`Empire record must render the 'Empire' hierarchy line, got '${empireNamesText.trim()}'.`);
  }

  await page.goto(`${baseUrl}/?place=achaia`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  const achaiaNamesText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='names']")
      .textContent()) ?? "";
  if (!achaiaNamesText.includes("Province · Roman Empire")) {
    throw new Error(`Achaia hierarchy line mismatch: '${achaiaNamesText.trim()}'.`);
  }

  return {
    emmausTodayLine: emmausTodayLine.trim(),
    candidateCount,
    jerichoNamesText: jerichoNamesText.trim(),
    italyNamesText: italyNamesText.trim(),
    empireNamesText: empireNamesText.trim(),
    achaiaNamesText: achaiaNamesText.trim()
  };
}

async function verifySimplePanelHeaderWithCountries(page, baseUrl, screenshotPaths) {
  await fs.mkdir(path.dirname(screenshotPaths.ephesusPanel), { recursive: true });
  const desktopViewportSize = page.viewportSize() ?? { width: 1440, height: 960 };
  const narrowViewportSize = { width: 360, height: desktopViewportSize.height };

  const panelSelector = "section[aria-label='Place details']";
  const panelLocator = page.locator(panelSelector);
  const todayLineSelector = `${panelSelector} [data-modern-name-line='true']`;

  const readTodayLine = async () =>
    normalizeTextContent((await page.locator(todayLineSelector).textContent()) ?? "");

  await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector(todayLineSelector, { timeout: 30_000 });

  const ephesusTodayLine = await readTodayLine();
  if (!ephesusTodayLine.includes("Today: Selçuk, Türkiye")) {
    throw new Error(`Ephesus today line mismatch: '${ephesusTodayLine}'.`);
  }
  const ephesusConfidenceChipCount = await page
    .locator(`${todayLineSelector} [data-location-chip='confidence']`)
    .count();
  if (ephesusConfidenceChipCount !== 1) {
    throw new Error(
      `Expected one confidence chip on Ephesus today line, got ${ephesusConfidenceChipCount}.`
    );
  }

  const actionSectionCount = await page
    .locator(`${panelSelector} [data-panel-section='actions']`)
    .count();
  if (actionSectionCount !== 0) {
    throw new Error(`Action bar section should be removed, found ${actionSectionCount}.`);
  }

  const removedActionButtons = {
    zoomTo: await page.getByRole("button", { name: "Zoom to", exact: true }).count(),
    fitAllSites: await page.getByRole("button", { name: "Fit all sites", exact: true }).count(),
    copyLink: await page.getByRole("button", { name: "Copy link", exact: true }).count()
  };
  if (
    removedActionButtons.zoomTo > 0 ||
    removedActionButtons.fitAllSites > 0 ||
    removedActionButtons.copyLink > 0
  ) {
    throw new Error(`Action bar buttons should be absent: ${JSON.stringify(removedActionButtons)}.`);
  }

  await panelLocator.screenshot({ path: screenshotPaths.ephesusPanel });

  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector(todayLineSelector, { timeout: 30_000 });

  const emmausTodayLine = await readTodayLine();
  if (!emmausTodayLine.includes("Today: Israel and the West Bank")) {
    throw new Error(`Emmaus today line mismatch: '${emmausTodayLine}'.`);
  }
  if (
    !emmausTodayLine.includes("Location disputed") ||
    !emmausTodayLine.includes("4 proposed sites")
  ) {
    throw new Error(`Emmaus disputed chip mismatch: '${emmausTodayLine}'.`);
  }

  await panelLocator.screenshot({ path: screenshotPaths.emmausPanel });

  await page.setViewportSize(narrowViewportSize);
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector(todayLineSelector, { timeout: 30_000 });

  const emmausNarrowWrapLayout = await page.evaluate((todayLineSelectorParam) => {
    const todayLine = document.querySelector(todayLineSelectorParam);
    if (!(todayLine instanceof HTMLElement)) {
      throw new Error(`Could not find today line '${todayLineSelectorParam}' at narrow width.`);
    }

    const todayText = Array.from(todayLine.children).find(
      (child) => child instanceof HTMLElement && !child.hasAttribute("data-location-chip")
    );
    if (!(todayText instanceof HTMLElement)) {
      throw new Error("Could not find today-line text element at narrow width.");
    }

    const disputedChip = todayLine.querySelector("[data-location-chip='disputed']");
    if (!(disputedChip instanceof HTMLElement)) {
      throw new Error("Could not find disputed chip element at narrow width.");
    }

    const todayTextBounds = todayText.getBoundingClientRect();
    const disputedChipBounds = disputedChip.getBoundingClientRect();
    return {
      textTop: todayTextBounds.top,
      textBottom: todayTextBounds.bottom,
      chipTop: disputedChipBounds.top,
      chipBottom: disputedChipBounds.bottom
    };
  }, todayLineSelector);

  if (emmausNarrowWrapLayout.chipTop <= emmausNarrowWrapLayout.textBottom + 1) {
    throw new Error(
      `Emmaus today-line chip did not wrap below the text on narrow width: ${JSON.stringify(emmausNarrowWrapLayout)}.`
    );
  }

  await page.setViewportSize(desktopViewportSize);

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector(todayLineSelector, { timeout: 30_000 });

  const jerusalemTodayLine = await readTodayLine();
  if (!jerusalemTodayLine.includes("Today: Jerusalem")) {
    throw new Error(`Jerusalem today line mismatch: '${jerusalemTodayLine}'.`);
  }
  if (/Today:\s*Jerusalem,/u.test(jerusalemTodayLine)) {
    throw new Error(`Jerusalem should not render countries: '${jerusalemTodayLine}'.`);
  }

  await panelLocator.screenshot({ path: screenshotPaths.jerusalemPanel });

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.keyboard.press("/");
  await page.waitForFunction(() => {
    const active = document.activeElement;
    return Boolean(active && active.matches("input[aria-label='Search biblical places']"));
  }, { timeout: UI_STATE_TIMEOUT_MS });
  await page.keyboard.type("Ephesus");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });

  const ephesusSearchEntries = await page.$$eval(
    "[data-testid='search-results-list'] [role='option']",
    (elements) =>
      elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  const ephesusResultText =
    ephesusSearchEntries.find((entry) => entry.includes("Ephesus")) ?? null;
  if (!ephesusResultText) {
    throw new Error(
      `Search results for Ephesus are missing the Ephesus entry: ${JSON.stringify(ephesusSearchEntries)}.`
    );
  }
  if (!ephesusResultText.includes("Selçuk, Türkiye · City")) {
    throw new Error(
      `Ephesus search result is missing modern country text: '${ephesusResultText}'.`
    );
  }

  await page
    .locator("[data-testid='search-results-list'] [role='option']")
    .filter({ hasText: "Ephesus" })
    .first()
    .screenshot({ path: screenshotPaths.ephesusSearchResult });

  return {
    ephesusTodayLine,
    emmausTodayLine,
    emmausNarrowWrapLayout,
    jerusalemTodayLine,
    ephesusResultText,
    removedActionButtons
  };
}

async function verifyShowAllPassages(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='in-bible']", {
    timeout: 30_000
  });
  await setPanelSectionExpanded(page, "in-bible", true);
  await setPanelSectionExpanded(page, "sources", false);
  await setPanelSectionExpanded(page, "photo-credits", false);

  const headingText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='in-bible'] h2")
      .textContent()) ?? "";
  const match = /In the Bible · (?<count>[0-9]+) passages/u.exec(headingText);
  const totalPassages = match?.groups?.count ? Number.parseInt(match.groups.count, 10) : 0;
  if (!Number.isFinite(totalPassages) || totalPassages < 5) {
    throw new Error(`Could not parse Jerusalem passage count from heading: '${headingText.trim()}'.`);
  }

  const scriptureArticleLocator = page.locator(
    "section[aria-label='Place details'] [data-panel-section='in-bible'] article"
  );
  const initialCount = await scriptureArticleLocator.count();
  if (initialCount !== 5) {
    throw new Error(`Expected 5 passages before expansion, got ${initialCount}.`);
  }

  const showAllButton = page.locator(
    "section[aria-label='Place details'] [data-show-all-passages='true']"
  );
  await showAllButton.first().click();

  await page.waitForFunction(
    ({ expectedCount }) => {
      const section = document.querySelector(
        "section[aria-label='Place details'] [data-panel-section='in-bible']"
      );
      if (!section) {
        return false;
      }
      const renderedCount = section.querySelectorAll("article").length;
      const showAllButton = section.querySelector("[data-show-all-passages='true']");
      return (
        renderedCount >= expectedCount &&
        showAllButton instanceof HTMLButtonElement &&
        showAllButton.getAttribute("aria-expanded") === "true"
      );
    },
    { expectedCount: totalPassages },
    { timeout: 120_000, polling: 250 }
  );

  const finalCount = await scriptureArticleLocator.count();
  if (finalCount < totalPassages) {
    throw new Error(
      `Expected all passages after expansion (${totalPassages}), got ${finalCount}.`
    );
  }
  const expandedButtonText = normalizeTextContent((await showAllButton.first().textContent()) ?? "");
  if (expandedButtonText !== "Show fewer") {
    throw new Error(`Expanded scripture toggle should read 'Show fewer', got '${expandedButtonText}'.`);
  }

  await page.evaluate(() => {
    const panel = document.querySelector("section[aria-label='Place details']");
    const toggle = document.querySelector(
      "section[aria-label='Place details'] [data-show-all-passages='true']"
    );
    if (!(panel instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement)) {
      return;
    }

    const midpoint = window.innerHeight / 2;
    const toggleTop = toggle.getBoundingClientRect().top;
    panel.scrollTop += toggleTop - midpoint;
  });
  await page.waitForTimeout(100);
  const topBeforeCollapse = await page.$eval(
    "section[aria-label='Place details'] [data-show-all-passages='true']",
    (element) => {
      if (!(element instanceof HTMLButtonElement)) {
        throw new Error("Show-fewer toggle was not found before collapse.");
      }
      return element.getBoundingClientRect().top;
    }
  );

  await showAllButton.first().click();
  await page.waitForFunction(
    () => {
      const section = document.querySelector(
        "section[aria-label='Place details'] [data-panel-section='in-bible']"
      );
      const showAllToggle = section?.querySelector("[data-show-all-passages='true']");
      if (!(showAllToggle instanceof HTMLButtonElement)) {
        return false;
      }

      return (
        showAllToggle.getAttribute("aria-expanded") === "false" &&
        section.querySelectorAll("article").length === 5 &&
        document.activeElement === showAllToggle
      );
    },
    undefined,
    { timeout: 30_000, polling: 100 }
  );
  const collapsedCount = await scriptureArticleLocator.count();
  if (collapsedCount !== 5) {
    throw new Error(`Expected 5 passages after collapsing, got ${collapsedCount}.`);
  }
  const collapsedButtonText = normalizeTextContent((await showAllButton.first().textContent()) ?? "");
  if (!/^Show all [0-9]+ passages$/u.test(collapsedButtonText)) {
    throw new Error(
      `Collapsed scripture toggle should read 'Show all n passages', got '${collapsedButtonText}'.`
    );
  }
  const topAfterCollapse = await page.$eval(
    "section[aria-label='Place details'] [data-show-all-passages='true']",
    (element) => {
      if (!(element instanceof HTMLButtonElement)) {
        throw new Error("Show-all toggle was not found after collapse.");
      }
      return element.getBoundingClientRect().top;
    }
  );
  const collapseTogglePositionDelta = Math.abs(topAfterCollapse - topBeforeCollapse);
  if (collapseTogglePositionDelta > 1.1) {
    throw new Error(
      `Collapsing to 'Show all' should keep the toggle in place; expected <=1.1 px movement, got ${collapseTogglePositionDelta.toFixed(2)} px.`
    );
  }

  return {
    totalPassages,
    initialCount,
    finalCount,
    collapsedCount,
    expandedButtonText,
    collapsedButtonText,
    topBeforeCollapse,
    topAfterCollapse,
    collapseTogglePositionDelta
  };
}

async function verifyPanelAccessibility(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  try {
    const runScenarioAnalysis = async ({
      name,
      pathWithQuery,
      beforeAnalyze
    }) => {
      await page.goto(`${baseUrl}${pathWithQuery}`, {
        waitUntil: "domcontentloaded",
        timeout: 120_000
      });
      await waitForMapToSettle(page);
      await page.waitForSelector(
        "section[aria-label='Place details'] [data-panel-section='about']",
        {
          timeout: 30_000
        }
      );

      if (beforeAnalyze) {
        await beforeAnalyze();
      }

      const analysis = await new AxeBuilder({ page })
        .include("section[aria-label='Place details']")
        .analyze();
      const seriousOrCritical = analysis.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical"
      );

      return {
        name,
        violationCount: analysis.violations.length,
        seriousOrCriticalCount: seriousOrCritical.length,
        seriousOrCriticalSummary: seriousOrCritical.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length
        }))
      };
    };

    const scenarios = [];
    scenarios.push(
      await runScenarioAnalysis({
        name: "capernaum-default",
        pathWithQuery: "/?place=capernaum"
      })
    );
    scenarios.push(
      await runScenarioAnalysis({
        name: "emmaus-disputed-candidates-expanded",
        pathWithQuery: "/?place=emmaus",
        beforeAnalyze: async () => {
          const supportToggle = page
            .locator("section[aria-label='Place details'] button[data-candidate-support-toggle='true']")
            .first();
          await supportToggle.waitFor({ state: "visible", timeout: 30_000 });
          await supportToggle.focus();
          await page.keyboard.press("Enter");
          await page.waitForFunction(() => {
            const button = document.querySelector(
              "section[aria-label='Place details'] button[data-candidate-support-toggle='true']"
            );
            return (
              button instanceof HTMLButtonElement &&
              button.getAttribute("aria-expanded") === "true"
            );
          }, { timeout: UI_STATE_TIMEOUT_MS });
        }
      })
    );
    scenarios.push(
      await runScenarioAnalysis({
        name: "jerusalem-show-all-expanded",
        pathWithQuery: "/?place=jerusalem",
        beforeAnalyze: async () => {
          const showAllButton = page.locator(
            "section[aria-label='Place details'] [data-show-all-passages='true']"
          );
          await showAllButton.first().waitFor({ state: "visible", timeout: 30_000 });
          await showAllButton.first().focus();
          await page.keyboard.press("Enter");
          await page.waitForFunction(() => {
            const button = document.querySelector(
              "section[aria-label='Place details'] [data-show-all-passages='true']"
            );
            if (!(button instanceof HTMLButtonElement)) {
              return false;
            }
            if (button.getAttribute("aria-expanded") !== "true") {
              return false;
            }

            const section = document.querySelector(
              "section[aria-label='Place details'] [data-panel-section='in-bible']"
            );
            return Boolean(section && section.querySelectorAll("article").length > 5);
          }, undefined, { timeout: 120_000, polling: 250 });
        }
      })
    );

    const seriousOrCriticalScenarios = scenarios.filter(
      (scenario) => scenario.seriousOrCriticalCount > 0
    );
    if (seriousOrCriticalScenarios.length > 0) {
      throw new Error(
        `Panel accessibility scan reported serious/critical issues: ${JSON.stringify(seriousOrCriticalScenarios)}`
      );
    }

    return {
      scenarios,
      violationCount: scenarios.reduce((sum, scenario) => sum + scenario.violationCount, 0),
      seriousOrCriticalCount: scenarios.reduce(
        (sum, scenario) => sum + scenario.seriousOrCriticalCount,
        0
      )
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyPanelDoesNotMutateMapDom(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.evaluate((refreshHookKey) => {
    const refreshVisibleEntries = window[refreshHookKey];
    if (typeof refreshVisibleEntries === "function") {
      refreshVisibleEntries();
    }
  }, visibleEntryRefreshHookKey);

  await page.waitForFunction(
    () =>
      document.querySelectorAll("button[data-place-entry-id^='place:'], button[data-place-entry-id^='candidate:']")
        .length > 0,
    { timeout: 30_000 }
  );

  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }

    const container = map.getContainer();
    const canvas = container.querySelector("canvas.maplibregl-canvas");
    window.__ibmPanelDomStabilityBaseline = {
      map,
      canvas
    };
  }, mapTestHookKey);

  const opener = page.locator(
    "button[data-place-entry-id^='place:'], button[data-place-entry-id^='candidate:']"
  );
  await opener.first().focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "visible",
    timeout: 30_000
  });
  await waitForMapToSettle(page);

  const openStability = await page.evaluate((testHookKey) => {
    const baseline = window.__ibmPanelDomStabilityBaseline;
    const map = window[testHookKey];
    if (!baseline || !map) {
      throw new Error("Panel-open stability baseline is unavailable.");
    }

    const currentCanvas = map.getContainer().querySelector("canvas.maplibregl-canvas");
    return {
      sameMap: map === baseline.map,
      sameCanvas: currentCanvas === baseline.canvas
    };
  }, mapTestHookKey);
  if (!openStability.sameMap || !openStability.sameCanvas) {
    throw new Error(
      `Map was remounted while opening the panel (sameMap=${openStability.sameMap}, sameCanvas=${openStability.sameCanvas}).`
    );
  }

  await page.evaluate((testHookKey) => {
    const baseline = window.__ibmPanelDomStabilityBaseline;
    const map = window[testHookKey];
    if (!baseline || !map) {
      throw new Error("Panel-scroll stability baseline is unavailable.");
    }

    const container = map.getContainer();
    const state = {
      mutationCount: 0,
      firstMutationSample: null
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        state.mutationCount += 1;
        if (!state.firstMutationSample) {
          const target = mutation.target;
          const targetName = target instanceof Element ? target.tagName.toLowerCase() : "node";
          state.firstMutationSample = `${mutation.type}:${targetName}:${mutation.attributeName ?? ""}`;
        }
      }
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });

    window.__ibmPanelDomStability = {
      stop() {
        observer.disconnect();
        const currentMap = window[testHookKey];
        const currentCanvas = currentMap
          ? currentMap.getContainer().querySelector("canvas.maplibregl-canvas")
          : null;
        return {
          mutationCount: state.mutationCount,
          firstMutationSample: state.firstMutationSample,
          sameMap: currentMap === baseline.map,
          sameCanvas: currentCanvas === baseline.canvas
        };
      }
    };
  }, mapTestHookKey);

  await page.evaluate(() => {
    const panel = document.querySelector("section[aria-label='Place details']");
    if (!panel) {
      throw new Error("Place panel is not visible.");
    }
    panel.scrollTop = panel.scrollHeight;
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const panel = document.querySelector("section[aria-label='Place details']");
    if (!panel) {
      throw new Error("Place panel is not visible.");
    }
    panel.scrollTop = 0;
  });
  await page.waitForTimeout(200);

  const result = await page.evaluate(() => {
    const monitor = window.__ibmPanelDomStability;
    if (!monitor || typeof monitor.stop !== "function") {
      throw new Error("Panel DOM stability monitor is unavailable.");
    }
    const report = monitor.stop();
    delete window.__ibmPanelDomStability;
    delete window.__ibmPanelDomStabilityBaseline;
    return report;
  });

  if (result.mutationCount > 0) {
    throw new Error(
      `Map DOM changed while opening/scrolling the panel: ${result.mutationCount} mutation(s), first='${result.firstMutationSample ?? "unknown"}'.`
    );
  }
  if (!result.sameMap || !result.sameCanvas) {
    throw new Error(
      `Map was remounted while opening/scrolling the panel (sameMap=${result.sameMap}, sameCanvas=${result.sameCanvas}).`
    );
  }

  return result;
}

async function captureScenario(page, url, screenshotPath, options = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  if (options.panelHeading) {
    await page.waitForSelector("section[aria-label='Place details'] h1", { timeout: 30_000 });
    const heading = await page.$eval(
      "section[aria-label='Place details'] h1",
      (element) => element.textContent?.trim() ?? ""
    );
    if (heading !== options.panelHeading) {
      throw new Error(`Expected panel heading '${options.panelHeading}', got '${heading}'.`);
    }
  }

  if (options.requireCandidateLetters?.length) {
    for (const candidateIndex of options.requireCandidateLetters) {
      await page.waitForSelector(`button[data-place-entry-id='candidate:emmaus:${candidateIndex}']`, {
        timeout: 30_000
      });
    }
  }

  if (options.zoomJerusalemToSiteLevel) {
    for (let index = 0; index < 4; index += 1) {
      await page.click("button[data-map-control='zoom-in']");
    }
    await waitForMapToSettle(page);
  }

  await page.screenshot({ fullPage: true, path: screenshotPath });
}

async function captureDeviceScaleCrop(browser, url, screenshotPath, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 3
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);

    if (options.panelHeading) {
      await page.waitForSelector("section[aria-label='Place details'] h1", { timeout: 30_000 });
      const heading = await page.$eval(
        "section[aria-label='Place details'] h1",
        (element) => element.textContent?.trim() ?? ""
      );
      if (heading !== options.panelHeading) {
        throw new Error(`Expected panel heading '${options.panelHeading}', got '${heading}'.`);
      }
    }

    const mapCanvas = page.locator("canvas.maplibregl-canvas");
    const mapBounds = await mapCanvas.boundingBox();
    if (!mapBounds) {
      throw new Error("Could not capture crop: map canvas is not visible.");
    }

    const panelBounds = await page.locator("section[aria-label='Place details']").boundingBox();
    const mapAreaLeft = panelBounds ? panelBounds.x + panelBounds.width : mapBounds.x;
    const mapAreaWidth = mapBounds.width - (panelBounds?.width ?? 0);
    const cropSize = 420;
    const centerX = mapAreaLeft + mapAreaWidth / 2;
    const centerY = mapBounds.y + mapBounds.height / 2;

    const clipX = Math.min(
      mapBounds.x + mapBounds.width - cropSize,
      Math.max(mapBounds.x, centerX - cropSize / 2)
    );
    const clipY = Math.min(
      mapBounds.y + mapBounds.height - cropSize,
      Math.max(mapBounds.y, centerY - cropSize / 2)
    );

    await page.screenshot({
      path: screenshotPath,
      clip: {
        x: clipX,
        y: clipY,
        width: cropSize,
        height: cropSize
      }
    });
  } finally {
    await page.close();
    await context.close();
  }
}

async function readAttributionText(page) {
  const attribution = page.locator(".maplibregl-ctrl-attrib");
  await attribution.first().waitFor({ state: "visible", timeout: 30_000 });
  const text = (await attribution.first().textContent()) ?? "";
  return text.replace(/\s+/g, " ").trim();
}

function assertFallbackAttributionText(text, scenarioLabel) {
  for (const needle of fallbackAttributionNeedles) {
    if (!text.includes(needle)) {
      throw new Error(
        `${scenarioLabel}: expected attribution to include '${needle}', got '${text.trim()}'`
      );
    }
  }
}

function assertMainAttributionText(text, scenarioLabel) {
  if (!text.includes(mainAttributionNeedle)) {
    throw new Error(
      `${scenarioLabel}: expected attribution to include '${mainAttributionNeedle}', got '${text.trim()}'`
    );
  }

  if (text.includes("VersaTiles")) {
    throw new Error(
      `${scenarioLabel}: expected attribution to stay on main style, got fallback attribution '${text.trim()}'`
    );
  }
}

async function verifyNormalLoadStaysOnMainBasemap(
  browser,
  baseUrl,
  pathWithQuery,
  options = {}
) {
  const observeWindowMs = options.observeWindowMs ?? 5_000;
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const requestUrls = [];
  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 120_000
    });
    await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      window.__ibmSetStyleCalls = [];
      const originalSetStyle = map.setStyle.bind(map);
      map.setStyle = (...args) => {
        const [style] = args;
        window.__ibmSetStyleCalls.push(String(style ?? ""));
        return originalSetStyle(...args);
      };
    }, mapTestHookKey);

    await waitForMapToSettle(page);
    await page.waitForTimeout(observeWindowMs);

    const setStyleCalls = await page.evaluate(() => window.__ibmSetStyleCalls ?? []);
    if (
      setStyleCalls.some(
        (value) =>
          value.includes(fallbackStylePathNeedle) || value.includes(modernFallbackStylePathNeedle)
      )
    ) {
      throw new Error(
        `Normal load at '${pathWithQuery || "/"}' called setStyle with fallback style: ${JSON.stringify(setStyleCalls)}`
      );
    }

    const fallbackNoticeCount = await page.getByText(fallbackStatusMessage, { exact: true }).count();
    if (fallbackNoticeCount > 0) {
      throw new Error(`Normal load at '${pathWithQuery || "/"}' showed fallback notice.`);
    }

    const attributionText = await readAttributionText(page);
    assertMainAttributionText(attributionText, `Normal load ${pathWithQuery || "/"}`);

    const versaTilesRequestCount = requestUrls.filter((url) =>
      url.includes("tiles.versatiles.org")
    ).length;
    if (versaTilesRequestCount > 0) {
      throw new Error(
        `Normal load at '${pathWithQuery || "/"}' unexpectedly requested VersaTiles tiles (${versaTilesRequestCount}).`
      );
    }

    return {
      pathWithQuery,
      observeWindowMs,
      setStyleCallCount: setStyleCalls.length,
      versaTilesRequestCount,
      attributionText
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyModernBoundaryRenderingByDispute(page, baseUrl) {
  await page.goto(`${baseUrl}/?map=modern`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);

  const inspectViewport = async (center, zoom) => {
    await page.evaluate(
      ({ testHookKey, jumpCenter, jumpZoom }) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }
        map.jumpTo({ center: jumpCenter, zoom: jumpZoom });
      },
      { testHookKey: mapTestHookKey, jumpCenter: center, jumpZoom: zoom }
    );
    await waitForMapToSettle(page);

    return page.evaluate(({ testHookKey, layerIds }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }
      const canvas = map.getCanvas();
      const queryBox = [
        [0, 0],
        [canvas.width, canvas.height]
      ];
      const solidFeatures = map.queryRenderedFeatures(queryBox, { layers: [layerIds.solid] });
      const dashedFeatures = map.queryRenderedFeatures(queryBox, { layers: [layerIds.dashed] });

      const toPair = (properties) => {
        const left = properties?.adm0_l;
        const right = properties?.adm0_r;
        const pair = [left, right].filter((value) => typeof value === "string");
        return pair.length === 0 ? null : pair.sort().join("|");
      };

      return {
        solidProperties: solidFeatures.map((feature) => feature.properties ?? {}),
        dashedProperties: dashedFeatures.map((feature) => feature.properties ?? {}),
        solidPairs: solidFeatures.map((feature) => toPair(feature.properties)),
        dashedPairs: dashedFeatures.map((feature) => toPair(feature.properties)),
        dashedLineSummaries: dashedFeatures.map((feature) => {
          const properties = feature.properties ?? {};
          const coordinates = feature.geometry?.coordinates;
          const line =
            feature.geometry?.type === "LineString"
              ? coordinates
              : feature.geometry?.type === "MultiLineString" && Array.isArray(coordinates) && coordinates.length > 0
                ? coordinates[0]
                : null;
          const midpoint =
            Array.isArray(line) && line.length > 0
              ? line[Math.floor(line.length / 2)]
              : null;
          const left = String(properties.adm0_l ?? "");
          const right = String(properties.adm0_r ?? "");
          const adminLevel = Number(properties.admin_level ?? 0);
          const isIsrPseMissingSideBranch =
            adminLevel === 2 &&
            ((left === "ISR" && !right) ||
              (right === "ISR" && !left) ||
              (left === "PSE" && !right) ||
              (right === "PSE" && !left));
          return {
            midpoint,
            claimedBy: String(properties.claimed_by ?? ""),
            isIsrPseMissingSideBranch
          };
        })
      };
    }, {
      testHookKey: mapTestHookKey,
      layerIds: {
        solid: mapLayerIds.modernBorderSolid,
        dashed: mapLayerIds.modernBorderDisputed
      }
    });
  };

  const balkans = await inspectViewport([20.9, 42.2], 6.5);
  if (!balkans.dashedPairs.includes("SRB|XKK")) {
    throw new Error("Expected dashed Kosovo–Serbia border in Balkans viewport.");
  }
  for (const requiredSolidPair of ["ALB|MKD", "ALB|MNE", "ALB|XKK", "MKD|XKK", "MNE|XKK"]) {
    if (!balkans.solidPairs.includes(requiredSolidPair)) {
      throw new Error(`Expected solid border pair '${requiredSolidPair}' in Balkans viewport.`);
    }
  }

  const levantZoom65 = await inspectViewport([35.5, 32.5], 6.5);
  for (const requiredSolidPair of ["EGY|ISR", "ISR|JOR", "ISR|LBN"]) {
    if (!levantZoom65.solidPairs.includes(requiredSolidPair)) {
      throw new Error(`Expected solid border pair '${requiredSolidPair}' at Levant zoom 6.5.`);
    }
  }
  const hasLevantDashedZoom65 = levantZoom65.dashedProperties.some((properties) => {
    const claimedBy = properties.claimed_by;
    const adminLevel = Number(properties.admin_level ?? 0);
    const left = properties.adm0_l;
    const right = properties.adm0_r;
    return (
      claimedBy === "IL" ||
      claimedBy === "SY" ||
      (adminLevel === 2 &&
        ((left === "ISR" && !right) || (right === "ISR" && !left) || (left === "PSE" && !right) || (right === "PSE" && !left)))
    );
  });
  if (!hasLevantDashedZoom65) {
    throw new Error("Expected at least one dashed Levant disputed line at zoom 6.5.");
  }

  const levantZoom8 = await inspectViewport([35.5, 32.5], 8);
  const hasLevantDashedZoom8 = levantZoom8.dashedProperties.some((properties) => {
    const claimedBy = properties.claimed_by;
    const adminLevel = Number(properties.admin_level ?? 0);
    const left = properties.adm0_l;
    const right = properties.adm0_r;
    return (
      claimedBy === "IL" ||
      claimedBy === "SY" ||
      (adminLevel === 2 &&
        ((left === "ISR" && !right) || (right === "ISR" && !left) || (left === "PSE" && !right) || (right === "PSE" && !left)))
    );
  });
  if (!hasLevantDashedZoom8) {
    throw new Error("Expected at least one dashed Levant disputed line at zoom 8.");
  }
  const isPointInRange = (point, [minLongitude, minLatitude, maxLongitude, maxLatitude]) =>
    Array.isArray(point) &&
    point.length >= 2 &&
    Number(point[0]) >= minLongitude &&
    Number(point[0]) <= maxLongitude &&
    Number(point[1]) >= minLatitude &&
    Number(point[1]) <= maxLatitude;
  const levantIsrPseMissingSideSegments = levantZoom8.dashedLineSummaries.filter(
    (summary) => summary.isIsrPseMissingSideBranch
  );
  const contestedLineAssertions = [
    {
      contestedLineName: "West Bank",
      matches: levantIsrPseMissingSideSegments.some((segment) =>
        isPointInRange(segment.midpoint, [35.24, 31.95, 35.58, 32.55])
      )
    },
    {
      contestedLineName: "Gaza",
      matches: levantIsrPseMissingSideSegments.some((segment) =>
        isPointInRange(segment.midpoint, [34.22, 31.2, 34.62, 31.62])
      )
    },
    {
      contestedLineName: "Green Line",
      matches: levantIsrPseMissingSideSegments.some((segment) =>
        isPointInRange(segment.midpoint, [34.8, 31.3, 35.18, 31.92])
      )
    },
    {
      contestedLineName: "Golan Heights west line",
      matches: levantZoom8.dashedLineSummaries.some((segment) => segment.claimedBy === "IL")
    },
    {
      contestedLineName: "Golan Heights claim line",
      matches: levantZoom8.dashedLineSummaries.some((segment) => segment.claimedBy === "SY")
    }
  ];
  for (const assertion of contestedLineAssertions) {
    if (!assertion.matches) {
      throw new Error(`Expected dashed contested line '${assertion.contestedLineName}' at Levant zoom 8.`);
    }
  }

  const anatoliaZoom6 = await inspectViewport([35.0, 39.0], 6);
  const hasAdminLevel3FromTiles = [...anatoliaZoom6.dashedProperties, ...anatoliaZoom6.solidProperties].some(
    (properties) => Number(properties.admin_level ?? 0) === 3
  );
  if (hasAdminLevel3FromTiles) {
    throw new Error("Unexpected admin-level-3 tile boundary rendered in central Anatolia at zoom 6.");
  }

  return {
    checkedViewports: 4,
    balkansDashedFeatureCount: balkans.dashedProperties.length,
    levantDashedFeatureCountZoom65: levantZoom65.dashedProperties.length,
    levantDashedFeatureCountZoom8: levantZoom8.dashedProperties.length,
    levantIsrPseMissingSideSegmentCount: levantIsrPseMissingSideSegments.length
  };
}

async function verifyModernMapToggle(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await page.waitForSelector("section[aria-label='Place details']", {
    state: "visible",
    timeout: 30_000
  });

  const beforeToggle = await page.evaluate(
    ({ testHookKey }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const center = map.getCenter();
      const zoom = map.getZoom();

      return {
        center: [center.lng, center.lat],
        zoom
      };
    },
    {
      testHookKey: mapTestHookKey
    }
  );

  const ancientRadio = page.locator("button[role='radio'][data-map-mode='ancient']");
  const modernRadio = page.locator("button[role='radio'][data-map-mode='modern']");
  const mapModeRadios = page.locator("button[role='radio'][data-map-mode]");
  await ancientRadio.waitFor({ state: "visible", timeout: 30_000 });
  await modernRadio.waitFor({ state: "visible", timeout: 30_000 });
  if ((await ancientRadio.getAttribute("aria-checked")) !== "true") {
    throw new Error("Ancient map should start selected at /?place=galilee.");
  }
  const initialTabIndices = await mapModeRadios.evaluateAll((elements) =>
    elements.map((element) => ({
      mode: element.getAttribute("data-map-mode"),
      tabIndex: element.tabIndex,
      checked: element.getAttribute("aria-checked")
    }))
  );
  const initialFocusableCount = initialTabIndices.filter((entry) => entry.tabIndex === 0).length;
  if (initialFocusableCount !== 1) {
    throw new Error(
      `Map mode radios must have exactly one tab stop, got ${JSON.stringify(initialTabIndices)}`
    );
  }
  const initialActiveMode = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-map-mode")
  );
  if (initialActiveMode !== null) {
    await ancientRadio.focus();
  }

  await ancientRadio.focus();
  await ancientRadio.press("ArrowRight");
  await waitForMapStyleLoaded(page);
  await waitForMapToSettle(page);

  const modernUrl = page.url();
  if (!modernUrl.includes("map=modern")) {
    throw new Error(`Modern toggle should persist URL with map=modern, got '${modernUrl}'.`);
  }
  if (!modernUrl.includes("place=galilee")) {
    throw new Error(`Modern toggle should keep selected place, got '${modernUrl}'.`);
  }
  if ((await modernRadio.getAttribute("aria-checked")) !== "true") {
    throw new Error("Modern radio should be selected after keyboard toggle.");
  }
  const focusedModeAfterArrowRight = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-map-mode")
  );
  if (focusedModeAfterArrowRight !== "modern") {
    throw new Error(
      `ArrowRight should move focus to modern radio, got '${focusedModeAfterArrowRight ?? "none"}'.`
    );
  }
  const tabIndicesAfterArrowRight = await mapModeRadios.evaluateAll((elements) =>
    elements.map((element) => ({
      mode: element.getAttribute("data-map-mode"),
      tabIndex: element.tabIndex,
      checked: element.getAttribute("aria-checked")
    }))
  );
  if (
    tabIndicesAfterArrowRight.filter((entry) => entry.tabIndex === 0).length !== 1 ||
    !tabIndicesAfterArrowRight.some(
      (entry) => entry.mode === "modern" && entry.tabIndex === 0 && entry.checked === "true"
    )
  ) {
    throw new Error(
      `Roving tabindex should follow modern selection, got ${JSON.stringify(tabIndicesAfterArrowRight)}`
    );
  }

  const heading = await page
    .locator("section[aria-label='Place details'] h1")
    .first()
    .textContent();
  if ((heading ?? "").trim() !== "Galilee") {
    throw new Error(`Selected place should remain Galilee after toggle, got '${heading ?? ""}'.`);
  }

  const afterToggle = await page.evaluate(
    ({ testHookKey, areaLayerIds }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const center = map.getCenter();
      const zoom = map.getZoom();
      const renderedAreaLabelCount = map.queryRenderedFeatures(undefined, {
        layers: areaLayerIds
      }).length;

      return {
        center: [center.lng, center.lat],
        zoom,
        renderedAreaLabelCount
      };
    },
    {
      testHookKey: mapTestHookKey,
      areaLayerIds: mapLayerIds.areaLabels
    }
  );

  const centerDelta =
    Math.abs(beforeToggle.center[0] - afterToggle.center[0]) +
    Math.abs(beforeToggle.center[1] - afterToggle.center[1]);
  const zoomDelta = Math.abs(beforeToggle.zoom - afterToggle.zoom);
  if (centerDelta > 0.0001 || zoomDelta > 0.0001) {
    throw new Error(
      `Map toggle should preserve camera. centerDelta=${centerDelta}, zoomDelta=${zoomDelta}`
    );
  }
  if (afterToggle.renderedAreaLabelCount !== 0) {
    throw new Error(
      `Modern map should hide area labels, got ${afterToggle.renderedAreaLabelCount} rendered labels.`
    );
  }

  const modernAttribution = await readAttributionText(page);
  assertMainAttributionText(modernAttribution, "Modern toggle");

  await modernRadio.focus();
  await modernRadio.press("Home");
  await waitForMapStyleLoaded(page);
  await waitForMapToSettle(page);
  if ((await ancientRadio.getAttribute("aria-checked")) !== "true") {
    throw new Error("Home should move map mode selection to ancient.");
  }
  const focusedModeAfterHome = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-map-mode")
  );
  if (focusedModeAfterHome !== "ancient") {
    throw new Error(`Home should move focus to ancient, got '${focusedModeAfterHome ?? "none"}'.`);
  }

  await ancientRadio.press("End");
  await waitForMapStyleLoaded(page);
  await waitForMapToSettle(page);
  if ((await modernRadio.getAttribute("aria-checked")) !== "true") {
    throw new Error("End should move map mode selection to modern.");
  }
  const focusedModeAfterEnd = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-map-mode")
  );
  if (focusedModeAfterEnd !== "modern") {
    throw new Error(`End should move focus to modern, got '${focusedModeAfterEnd ?? "none"}'.`);
  }

  await modernRadio.press("ArrowLeft");
  await waitForMapStyleLoaded(page);
  await waitForMapToSettle(page);
  if ((await ancientRadio.getAttribute("aria-checked")) !== "true") {
    throw new Error("Ancient radio should be selected after toggling back.");
  }
  const focusedModeAfterArrowLeft = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-map-mode")
  );
  if (focusedModeAfterArrowLeft !== "ancient") {
    throw new Error(
      `ArrowLeft should move focus to ancient radio, got '${focusedModeAfterArrowLeft ?? "none"}'.`
    );
  }
  if (page.url().includes("map=modern")) {
    throw new Error(`Switching back to ancient should clear map=modern, got '${page.url()}'.`);
  }

  return {
    modernRenderedAreaLabelCount: afterToggle.renderedAreaLabelCount,
    modernAttribution,
    cameraDelta: {
      centerDelta,
      zoomDelta
    }
  };
}

async function verifyNoTimelineUiOnDefaultBuild(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);

  const timelineSliderCount = await page.locator("input[data-timeline-slider='true']").count();
  const sourcesButtonCount = await page.getByRole("button", { name: "Sources" }).count();

  if (timelineSliderCount !== 0 || sourcesButtonCount !== 0) {
    throw new Error(
      `Default build should hide timeline/layer UI when ancient data is absent. slider=${timelineSliderCount}, sources=${sourcesButtonCount}`
    );
  }

  return {
    timelineSliderCount,
    sourcesButtonCount
  };
}

async function buildFixtureGeneratedOutput() {
  const outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-m4-05-fixture-generated-"));
  const [timelineData, ancientAreasData, ancientRoadsData, ancientCoastlineData, regionOutlinesData, ancientEmpireEdgeData, bibliography] =
    await Promise.all([
      fs
        .readFile(path.join(fixtureAncientSourceDirectory, "timeline.json"), "utf8")
        .then((content) => JSON.parse(content)),
      fs
        .readFile(path.join(fixtureAncientSourceDirectory, "geo", "ancient-areas.geojson"), "utf8")
        .then((content) => JSON.parse(content)),
      fs
        .readFile(path.join(fixtureAncientSourceDirectory, "geo", "ancient-roads.geojson"), "utf8")
        .then((content) => JSON.parse(content)),
      fs
        .readFile(path.join(fixtureAncientSourceDirectory, "geo", "ancient-coastline.geojson"), "utf8")
        .then((content) => JSON.parse(content)),
      fs
        .readFile(path.join(fixtureAncientSourceDirectory, "geo", "region-outlines.geojson"), "utf8")
        .then((content) => JSON.parse(content)),
      readJsonIfExists(path.join(fixtureAncientSourceDirectory, "geo", "ancient-empire-edge.geojson")),
      fs.readFile(bibliographyPath, "utf8").then((content) => JSON.parse(content))
    ]);

  const bibliographyById = new Map(
    (bibliography?.entries ?? [])
      .filter((entry) => typeof entry?.id === "string")
      .map((entry) => [entry.id, entry])
  );

  await buildAncientAppData({
    timelineData,
    ancientAreasData,
    ancientRoadsData,
    ancientCoastlineData,
    regionOutlinesData,
    ancientEmpireEdgeData,
    bibliographyById,
    outputDirectory
  });
  return outputDirectory;
}

async function verifyTimelineUiWithFixtureData(browser, baseUrl, fixtureGeneratedDirectory) {
  const timelinePayload = JSON.parse(
    await fs.readFile(path.join(fixtureGeneratedDirectory, "ancient.timeline.json"), "utf8")
  );
  const sortedStops = [...timelinePayload.stops].sort((left, right) => left.year - right.year);
  const stopIds = sortedStops.map((stop) => stop.id);
  const expectedDefaultStopId =
    timelinePayload.defaultStopId ??
    sortedStops.find((stop) => stop.year <= timelinePayload.range.defaultYear)?.id ??
    sortedStops[0]?.id ??
    null;
  if (!expectedDefaultStopId) {
    throw new Error("Fixture timeline payload did not contain any stops.");
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  const failureScreenshotPath = temporaryScreenshotPath("ibm-m4-05-stepb-failure-state.png");
  const popoverScreenshotPath = temporaryScreenshotPath("ibm-m4-05-stepb-sources-popover.png");

  const missingFixtureFiles = new Set();
  await page.route("**/generated/ancient.*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const fileName = path.basename(requestUrl.pathname);
    const fixturePath = path.join(fixtureGeneratedDirectory, fileName);
    try {
      const content = await fs.readFile(fixturePath);
      const contentType = contentTypeFor(fixturePath);
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "no-store"
        },
        body: content
      });
    } catch {
      missingFixtureFiles.add(fileName);
      await route.fallback();
    }
  });

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.locator("input[data-timeline-slider='true']").waitFor({ state: "visible", timeout: 30_000 });
    const timelineSlider = page.locator("input[data-timeline-slider='true']").first();
    await waitForMapToSettle(page);
    await page.evaluate(() => {
      window.__ibmTimelineLongTasks = [];
      if (
        typeof PerformanceObserver === "undefined" ||
        !Array.isArray(PerformanceObserver.supportedEntryTypes) ||
        !PerformanceObserver.supportedEntryTypes.includes("longtask")
      ) {
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const bucket = window.__ibmTimelineLongTasks ?? [];
        for (const entry of list.getEntries()) {
          bucket.push(entry.duration);
        }
        window.__ibmTimelineLongTasks = bucket;
      });
      observer.observe({ entryTypes: ["longtask"] });
      window.__ibmTimelineLongTaskObserver = observer;
    });

    const tickIds = await page
      .locator("[data-timeline-tick-stop-id]")
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute("data-timeline-tick-stop-id"))
          .filter((id) => typeof id === "string" && id.length > 0)
      );
    if (tickIds.length !== stopIds.length) {
      throw new Error(`Expected ${stopIds.length} timeline ticks, got ${tickIds.length}.`);
    }

    const selectedStopId = await timelineSlider.evaluate(
      (slider, stopIds) => {
        const currentIndex = Number.parseInt(slider.value, 10);
        return stopIds[currentIndex] ?? null;
      },
      stopIds
    );

    if (selectedStopId !== expectedDefaultStopId) {
      throw new Error(
        `Timeline default stop mismatch. expected='${expectedDefaultStopId}' actual='${selectedStopId}'.`
      );
    }

    const alignmentChecks = [];
    const earlierButton = page.getByRole("button", { name: "Earlier change" });
    const laterButton = page.getByRole("button", { name: "Later change" });
    for (let index = 0; index < sortedStops.length; index += 1) {
      const stop = sortedStops[index];
      const currentIndex = Number.parseInt(await timelineSlider.inputValue(), 10);
      if (Number.isNaN(currentIndex)) {
        throw new Error("Timeline slider value was not a number.");
      }
      if (currentIndex < index) {
        for (let nextIndex = currentIndex; nextIndex < index; nextIndex += 1) {
          await laterButton.click();
        }
      } else if (currentIndex > index) {
        for (let nextIndex = currentIndex; nextIndex > index; nextIndex -= 1) {
          await earlierButton.click();
        }
      }
      await page.waitForTimeout(150);
      const tickLocator = page.locator(`[data-timeline-tick-stop-id="${stop.id}"]`).first();
      await tickLocator.waitFor({ state: "visible", timeout: 30_000 });
      const thumbLocator = page.locator("[data-timeline-slider-thumb='true']").first();
      await thumbLocator.waitFor({ state: "visible", timeout: 30_000 });
      const sliderBox = await timelineSlider.boundingBox();
      const tickBox = await tickLocator.boundingBox();
      const thumbBox = await thumbLocator.boundingBox();
      if (!sliderBox || !tickBox || !thumbBox) {
        throw new Error(
          `Missing geometry for timeline alignment at stop '${stop.id}'. Missing fixture files: ${Array.from(missingFixtureFiles).join(", ")}. Console errors: ${consoleErrors.join(" | ")}`
        );
      }
      const thumbCenterX = thumbBox.x + thumbBox.width / 2;
      const tickCenterX = tickBox.x + tickBox.width / 2;
      const alignment = {
        stopId: stop.id,
        deltaPx: Math.abs(thumbCenterX - tickCenterX)
      };

      if (alignment.deltaPx > 2) {
        throw new Error(
          `Timeline tick misaligned for stop '${stop.id}': ${alignment.deltaPx.toFixed(2)}px from thumb center.`
        );
      }

      const currentUrl = new URL(page.url());
      const expectedYear = String(stop.year);
      if (currentUrl.searchParams.get("year") !== expectedYear) {
        throw new Error(
          `Timeline URL year mismatch at stop '${stop.id}'. expected='${expectedYear}' actual='${currentUrl.searchParams.get("year")}'.`
        );
      }

      alignmentChecks.push(alignment);
    }

    const stopChangeLongTasks = await page.evaluate(() => {
      const durations = Array.isArray(window.__ibmTimelineLongTasks)
        ? [...window.__ibmTimelineLongTasks]
        : [];
      if (window.__ibmTimelineLongTaskObserver) {
        window.__ibmTimelineLongTaskObserver.disconnect();
      }
      delete window.__ibmTimelineLongTaskObserver;
      delete window.__ibmTimelineLongTasks;
      return durations;
    });
    const longTasksOverBudget = stopChangeLongTasks.filter((duration) => duration > 50);
    const fixtureRenderer = await detectWebGlRenderer(page);
    const fixtureSoftwareRenderer = softwareRendererPattern.test(fixtureRenderer ?? "");
    if (
      longTasksOverBudget.length > 0 &&
      fixtureSoftwareRenderer &&
      process.env.SMOOTHNESS_REQUIRE_GPU !== "1"
    ) {
      console.warn(
        `fixture timeline stop changes: ${longTasksOverBudget.length} long task(s) over 50 ms not enforced on software renderer (${fixtureRenderer}).`
      );
    } else if (longTasksOverBudget.length > 0) {
      throw new Error(
        `Timeline stop changes exceeded 50ms budget: ${longTasksOverBudget.map((value) => value.toFixed(2)).join(", ")}`
      );
    }

    await page.getByRole("button", { name: "Sources" }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: popoverScreenshotPath, fullPage: true });

    const sourceTexts = await page.locator("div[style] li").allInnerTexts();
    if (sourceTexts.some((text) => text.includes("Bibliography "))) {
      throw new Error(`Timeline sources showed bibliography fallback text: ${JSON.stringify(sourceTexts)}`);
    }

    const holderEntry = page.locator("button[data-place-entry-id^='ancient-holder:']").first();
    if ((await holderEntry.count()) > 0) {
      await holderEntry.focus();
      await page.waitForFunction(() => {
        const tooltip = document.querySelector("div[role='tooltip']");
        return Boolean(tooltip && tooltip.textContent && tooltip.textContent.trim().length > 0);
      }, undefined, { timeout: 8_000 });
      const tooltipText = await page.locator("div[role='tooltip']").first().textContent();
      if (!tooltipText || tooltipText.trim().length === 0) {
        throw new Error("Expected holder-label keyboard focus to show tooltip text.");
      }
    }

    const failureContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const failurePage = await failureContext.newPage();
    let failInitialShapesRequest = true;
    await failurePage.route("**/generated/ancient.*", async (route) => {
      const requestUrl = new URL(route.request().url());
      const fileName = path.basename(requestUrl.pathname);
      const fixturePath = path.join(fixtureGeneratedDirectory, fileName);
      try {
        if (fileName === "ancient.shapes.json" && failInitialShapesRequest) {
          failInitialShapesRequest = false;
          await route.abort("failed");
          return;
        }

        const content = await fs.readFile(fixturePath);
        const contentType = contentTypeFor(fixturePath);
        await route.fulfill({
          status: 200,
          headers: {
            "content-type": contentType,
            "cache-control": "no-store"
          },
          body: content
        });
      } catch {
        await route.fallback();
      }
    });
    try {
      await failurePage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitForMapToSettle(failurePage);
      await failurePage.getByRole("button", { name: "Try again" }).waitFor({ timeout: 30_000 });
      await failurePage.screenshot({ path: failureScreenshotPath, fullPage: true });
      await failurePage.getByRole("button", { name: "Try again" }).click();
      await failurePage.locator("input[data-timeline-slider='true']").waitFor({ state: "visible", timeout: 30_000 });
    } finally {
      await failurePage.close();
      await failureContext.close();
    }

    return {
      stopCount: sortedStops.length,
      stopIds,
      expectedDefaultStopId,
      alignmentChecks,
      stopChangeLongTasks,
      sourceTexts,
      screenshotPaths: {
        failureState: failureScreenshotPath,
        sourcesPopover: popoverScreenshotPath
      }
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyAreaLabelsAvoidPins(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });
  await page.evaluate((refreshHookKey) => {
    const refreshVisibleEntries = window[refreshHookKey];
    if (typeof refreshVisibleEntries === "function") {
      refreshVisibleEntries();
    }
  }, visibleEntryRefreshHookKey);
  await page.waitForFunction(
    ({ testHookKey, areaLayerIds, pinLabelLayerIds }) => {
      const map = window[testHookKey];
      if (!map) {
        return false;
      }
      const labels = map.queryRenderedFeatures(undefined, {
        layers: [...areaLayerIds, ...pinLabelLayerIds]
      });
      return labels.length > 0;
    },
    {
      testHookKey: mapTestHookKey,
      areaLayerIds: mapLayerIds.areaLabels,
      pinLabelLayerIds: mapLayerIds.pinLabels
    },
    { timeout: 30_000, polling: 250 }
  );

  const overlap = await page.evaluate(
    ({ testHookKey, areaLayerIds, pinLayerIds }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const pinFeatures = map.queryRenderedFeatures(undefined, {
        layers: pinLayerIds
      });
      const collisions = [];

      for (const pinFeature of pinFeatures) {
        if (pinFeature.geometry?.type !== "Point") {
          continue;
        }

        const [longitude, latitude] = pinFeature.geometry.coordinates;
        const point = map.project([longitude, latitude]);
        const labelsAtPin = map.queryRenderedFeatures(point, {
          layers: areaLayerIds
        });

        if (labelsAtPin.length > 0) {
          collisions.push({
            pinLayer: pinFeature.layer.id,
            pinEntryId: pinFeature.properties?.entryId ?? null,
            labelIds: labelsAtPin.map((label) => label.properties?.entryId ?? label.id ?? "label")
          });
        }
      }

      return {
        pinCount: pinFeatures.length,
        collisionCount: collisions.length,
        collisionSamples: collisions.slice(0, 8)
      };
    },
    {
      testHookKey: mapTestHookKey,
      areaLayerIds: mapLayerIds.areaLabels,
      pinLayerIds: [
        ...allClusterPinLayerIds,
        ...allCityPinLayerIds,
        mapLayerIds.sitePins,
        mapLayerIds.sitePinsNoDot,
        mapLayerIds.candidatePins
      ]
    }
  );

  if (overlap.collisionCount > 0) {
    throw new Error(
      `Found area-label/pin overlaps at ?place=galilee: ${JSON.stringify(overlap.collisionSamples)}`
    );
  }

  return overlap;
}

async function verifyAreaLabelsAvoidClustersOnOverview(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });

  const overlap = await page.evaluate(
    ({ testHookKey, areaLayerIds, clusterLayerIds, clusterTextLayerIds, majorClusterLayerId }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const clusters = map.queryRenderedFeatures(undefined, { layers: clusterLayerIds });
      const clusterIdsWithLabels = new Set(
        map
          .queryRenderedFeatures(undefined, { layers: clusterTextLayerIds })
          .map((feature) => feature.properties?.cluster_id)
      );
      const clustersWithoutLabels = clusters.filter(
        (feature) => !clusterIdsWithLabels.has(feature.properties?.cluster_id)
      );
      const collisions = [];

      for (const clusterFeature of clusters) {
        if (clusterFeature.geometry?.type !== "Point") {
          continue;
        }

        const [longitude, latitude] = clusterFeature.geometry.coordinates;
        const point = map.project([longitude, latitude]);
        const pointCount = Number(clusterFeature.properties?.point_count ?? 0);
        const circleRadius =
          clusterFeature.layer.id === majorClusterLayerId
            ? pointCount >= 20
              ? 11
              : pointCount >= 8
                ? 10
                : 9
            : pointCount >= 20
              ? 6
              : pointCount >= 8
                ? 5
                : 4;
        // The rendered bubble includes a 3px white stroke; probe just outside that edge.
        const probeRadius = circleRadius + 4;
        const diagonal = Math.round(probeRadius * 0.72);
        const probeOffsets = [
          [0, 0],
          [probeRadius, 0],
          [-probeRadius, 0],
          [0, probeRadius],
          [0, -probeRadius],
          [diagonal, diagonal],
          [diagonal, -diagonal],
          [-diagonal, diagonal],
          [-diagonal, -diagonal]
        ];

        for (const [offsetX, offsetY] of probeOffsets) {
          const labelsAtProbe = map.queryRenderedFeatures([point.x + offsetX, point.y + offsetY], {
            layers: areaLayerIds
          });
          if (labelsAtProbe.length === 0) {
            continue;
          }

          collisions.push({
            clusterId: clusterFeature.properties?.cluster_id ?? null,
            pointCount: clusterFeature.properties?.point_count ?? null,
            sampleOffsetPx: [offsetX, offsetY],
            labelIds: labelsAtProbe.map(
              (label) => label.properties?.entryId ?? label.id ?? "label"
            )
          });
          break;
        }
      }

      return {
        clusterCount: clusters.length,
        clustersWithoutLabelCount: clustersWithoutLabels.length,
        collisionCount: collisions.length,
        collisionSamples: collisions.slice(0, 8)
      };
    },
    {
      testHookKey: mapTestHookKey,
      areaLayerIds: mapLayerIds.areaLabels,
      clusterLayerIds: allClusterPinLayerIds,
      clusterTextLayerIds: allClusterLabelLayerIds,
      majorClusterLayerId: mapLayerIds.majorClusterPins
    }
  );

  if (overlap.clusterCount === 0) {
    return {
      ...overlap,
      skipped: true,
      reason: "No clusters were rendered on overview."
    };
  }

  if (overlap.clustersWithoutLabelCount > 0) {
    throw new Error(
      `${overlap.clustersWithoutLabelCount} of ${overlap.clusterCount} clusters on the overview are missing text labels.`
    );
  }

  if (overlap.collisionCount > 0) {
    throw new Error(
      `Found area-label/cluster overlaps on overview: ${JSON.stringify(overlap.collisionSamples)}`
    );
  }

  return overlap;
}

async function verifyLabelsAvoidSearchBoxOnOverview(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });

  const overlap = await page.evaluate(({ testHookKey, areaLayerIds, pinLabelLayerIds }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }

    const searchBox = document.querySelector("[data-map-search-shell='true']");
    if (!(searchBox instanceof HTMLElement)) {
      throw new Error("Search box element was not found.");
    }

    const mapRect = map.getContainer().getBoundingClientRect();
    const searchRect = searchBox.getBoundingClientRect();
    const paddingPx = 4;
    const minX = Math.max(0, searchRect.left - mapRect.left + paddingPx);
    const minY = Math.max(0, searchRect.top - mapRect.top + paddingPx);
    const maxX = Math.min(mapRect.width, searchRect.right - mapRect.left - paddingPx);
    const maxY = Math.min(mapRect.height, searchRect.bottom - mapRect.top - paddingPx);
    if (maxX <= minX || maxY <= minY) {
      throw new Error("Search box rect is outside the map viewport.");
    }

    const labelLayerIds = [...areaLayerIds, ...pinLabelLayerIds];
    const labelsInsideSearchBox = map.queryRenderedFeatures(
      [
        [minX, minY],
        [maxX, maxY]
      ],
      {
        layers: labelLayerIds
      }
    );

    const allLabels = map.queryRenderedFeatures(undefined, {
      layers: labelLayerIds
    });

    const distinctLabelsInsideSearchBox = Array.from(
      new Set(
        labelsInsideSearchBox
          .map((feature) =>
            String(feature.properties?.placeName ?? feature.properties?.labelText ?? "").trim()
          )
          .filter((value) => value.length > 0)
      )
    );
    const distinctLabelsOverall = Array.from(
      new Set(
        allLabels
          .map((feature) =>
            String(feature.properties?.placeName ?? feature.properties?.labelText ?? "").trim()
          )
          .filter((value) => value.length > 0)
      )
    );

    return {
      labelCount: labelsInsideSearchBox.length,
      labels: distinctLabelsInsideSearchBox,
      overallLabelCount: allLabels.length,
      overallLabels: distinctLabelsOverall.slice(0, 24),
      searchRect: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }, {
    testHookKey: mapTestHookKey,
    areaLayerIds: mapLayerIds.areaLabels,
    pinLabelLayerIds: mapLayerIds.pinLabels
  });

  if (overlap.labelCount > 0) {
    throw new Error(
      `Found map labels under the search box on overview: ${JSON.stringify(overlap)}`
    );
  }

  if (overlap.overallLabelCount === 0) {
    throw new Error(
      "Search-box overlap check was vacuous: no labels were rendered outside the search-box query."
    );
  }

  return overlap;
}

async function collectMajorLabelAttachmentDiagnostics(
  page,
  {
    majorPinLayerIds,
    majorClusterLayerIds,
    majorPinLabelLayerIds,
    majorClusterLabelLayerIds
  }
) {
  return page.evaluate(
    ({
      testHookKey,
      majorPinLayerIds,
      majorClusterLayerIds,
      majorPinLabelLayerIds,
      majorClusterLabelLayerIds
    }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const symbolLayerIds = [...majorPinLayerIds, ...majorClusterLayerIds];
      const majorLabelLayerIds = [...majorPinLabelLayerIds, ...majorClusterLabelLayerIds];
      const majorClusterLabelLayerIdSet = new Set(majorClusterLabelLayerIds);
      const majorClusterLayerIdSet = new Set(majorClusterLayerIds);

      const featureLabelText = (feature) =>
        String(
          feature.properties?.clusterLabelText ??
            feature.properties?.labelText ??
            feature.properties?.placeName ??
            ""
        ).trim();

      const featureSymbolKey = (feature) => {
        const properties = feature.properties ?? {};

        const entryId =
          typeof properties.entryId === "string" ? properties.entryId.trim() : "";
        if (entryId.length > 0) {
          return `entry:${entryId}`;
        }

        const clusterId = Number(properties.cluster_id);
        if (Number.isFinite(clusterId)) {
          return `cluster:${clusterId}`;
        }

        const placeId =
          typeof properties.placeId === "string" ? properties.placeId.trim() : "";
        if (placeId.length > 0) {
          return `place:${placeId}`;
        }

        return null;
      };

      const projectPointFeature = (feature) => {
        if (feature.geometry?.type !== "Point") {
          return null;
        }

        const [longitude, latitude] = feature.geometry.coordinates;
        if (typeof longitude !== "number" || typeof latitude !== "number") {
          return null;
        }

        return map.project([longitude, latitude]);
      };

      const majorSymbolsByKey = new Map();
      const majorSymbolFeatures = map.queryRenderedFeatures(undefined, { layers: symbolLayerIds });
      for (const feature of majorSymbolFeatures) {
        const key = featureSymbolKey(feature);
        if (!key || majorSymbolsByKey.has(key)) {
          continue;
        }

        const projected = projectPointFeature(feature);
        if (!projected) {
          continue;
        }

        const pointCount = Number(feature.properties?.point_count ?? 0);
        const isMajorCluster = majorClusterLayerIdSet.has(String(feature.layer?.id ?? ""));
        const isSelectedPlace =
          feature.properties?.isSelectedPlace === true ||
          feature.properties?.isSelectedPlace === "true";
        const isHighlightedPlace =
          feature.properties?.isHighlightedPlace === true ||
          feature.properties?.isHighlightedPlace === "true";
        const fillRadius = isMajorCluster
          ? pointCount >= 20
            ? 11
            : pointCount >= 8
              ? 10
              : 9
          : isSelectedPlace
            ? 10.5
            : isHighlightedPlace
              ? 9.5
              : 8;
        const effectiveRadius = fillRadius + 1;
        const placeId =
          typeof feature.properties?.placeId === "string"
            ? feature.properties.placeId.trim()
            : null;

        majorSymbolsByKey.set(key, {
          key,
          layerId: String(feature.layer?.id ?? ""),
          isCluster: isMajorCluster,
          placeId,
          label: featureLabelText(feature),
          pointPx: { x: projected.x, y: projected.y },
          effectiveRadius
        });
      }

      const majorLabelsByKey = new Map();
      const majorLabelFeatures = map.queryRenderedFeatures(undefined, { layers: majorLabelLayerIds });
      for (const feature of majorLabelFeatures) {
        const key = featureSymbolKey(feature);
        if (!key || majorLabelsByKey.has(key)) {
          continue;
        }

        const projected = projectPointFeature(feature);
        if (!projected) {
          continue;
        }

        const placeId =
          typeof feature.properties?.placeId === "string"
            ? feature.properties.placeId.trim()
            : null;
        const isMajorCluster = majorClusterLabelLayerIdSet.has(String(feature.layer?.id ?? ""));

        majorLabelsByKey.set(key, {
          key,
          layerId: String(feature.layer?.id ?? ""),
          isCluster: isMajorCluster,
          placeId,
          label: featureLabelText(feature),
          projected: { x: projected.x, y: projected.y }
        });
      }

      const scanSeeds = [
        ...Array.from(majorLabelsByKey.values()).map((entry) => entry.projected),
        ...Array.from(majorSymbolsByKey.values()).map((entry) => entry.pointPx)
      ];
      const mapRect = map.getContainer().getBoundingClientRect();
      const scanStepPx = 2;
      const scanOffsets = [
        [0, 0],
        [1, 1]
      ];
      const regionPaddingPx = 120;

      if (scanSeeds.length === 0) {
        return {
          viewport: {
            width: Math.round(mapRect.width),
            height: Math.round(mapRect.height)
          },
          scanRegionPx: {
            minX: 0,
            maxX: Math.round(mapRect.width),
            minY: 0,
            maxY: Math.round(mapRect.height),
            step: scanStepPx,
            offsets: scanOffsets
          },
          majorSymbolCount: 0,
          majorLabelCount: 0,
          majorSymbols: [],
          majorLabels: [],
          symbolsMissingLabel: [],
          labelsMissingCoverage: [],
          orphanLabels: [],
          nearestPinMismatchCount: 0,
          nearestPinMismatches: [],
          labelCoveringOtherPinCount: 0,
          labelCoveringOtherPins: []
        };
      }

      const minSeedX = Math.min(...scanSeeds.map((point) => point.x));
      const maxSeedX = Math.max(...scanSeeds.map((point) => point.x));
      const minSeedY = Math.min(...scanSeeds.map((point) => point.y));
      const maxSeedY = Math.max(...scanSeeds.map((point) => point.y));
      const regionMinX = Math.max(0, Math.floor(minSeedX - regionPaddingPx));
      const regionMaxX = Math.min(Math.floor(mapRect.width), Math.ceil(maxSeedX + regionPaddingPx));
      const regionMinY = Math.max(0, Math.floor(minSeedY - regionPaddingPx));
      const regionMaxY = Math.min(Math.floor(mapRect.height), Math.ceil(maxSeedY + regionPaddingPx));

      const labelCoverageByKey = new Map();
      for (const [offsetX, offsetY] of scanOffsets) {
        for (let y = regionMinY + offsetY; y <= regionMaxY; y += scanStepPx) {
          for (let x = regionMinX + offsetX; x <= regionMaxX; x += scanStepPx) {
            const featuresAtPoint = map.queryRenderedFeatures([x, y], { layers: majorLabelLayerIds });
            if (featuresAtPoint.length === 0) {
              continue;
            }

            const seenAtPoint = new Set();
            for (const feature of featuresAtPoint) {
              const key = featureSymbolKey(feature);
              if (!key || !majorLabelsByKey.has(key) || seenAtPoint.has(key)) {
                continue;
              }
              seenAtPoint.add(key);

              const current = labelCoverageByKey.get(key) ?? {
                sampleCount: 0,
                minX: Number.POSITIVE_INFINITY,
                maxX: Number.NEGATIVE_INFINITY,
                minY: Number.POSITIVE_INFINITY,
                maxY: Number.NEGATIVE_INFINITY
              };
              current.sampleCount += 1;
              current.minX = Math.min(current.minX, x);
              current.maxX = Math.max(current.maxX, x);
              current.minY = Math.min(current.minY, y);
              current.maxY = Math.max(current.maxY, y);
              labelCoverageByKey.set(key, current);
            }
          }
        }
      }

      const labelsMissingCoverage = [];
      const labelBoxesByKey = new Map();
      const halfStepPadding = Math.max(1, scanStepPx / 2);
      for (const majorLabel of majorLabelsByKey.values()) {
        const coverage = labelCoverageByKey.get(majorLabel.key);
        if (!coverage || coverage.sampleCount === 0) {
          labelsMissingCoverage.push({
            key: majorLabel.key,
            placeId: majorLabel.placeId,
            label: majorLabel.label,
            projectedPointPx: [majorLabel.projected.x, majorLabel.projected.y]
          });
          continue;
        }

        labelBoxesByKey.set(majorLabel.key, {
          minX: coverage.minX - halfStepPadding,
          maxX: coverage.maxX + halfStepPadding,
          minY: coverage.minY - halfStepPadding,
          maxY: coverage.maxY + halfStepPadding,
          sampleCount: coverage.sampleCount
        });
      }

      const pointToBoxDistance = (point, box) => {
        const dx =
          point.x < box.minX ? box.minX - point.x : point.x > box.maxX ? point.x - box.maxX : 0;
        const dy =
          point.y < box.minY ? box.minY - point.y : point.y > box.maxY ? point.y - box.maxY : 0;
        return Math.hypot(dx, dy);
      };

      const circleIntersectsBox = (point, radius, box) => {
        const dx =
          point.x < box.minX ? box.minX - point.x : point.x > box.maxX ? point.x - box.maxX : 0;
        const dy =
          point.y < box.minY ? box.minY - point.y : point.y > box.maxY ? point.y - box.maxY : 0;
        return Math.hypot(dx, dy) + 0.25 < radius;
      };

      const majorSymbols = Array.from(majorSymbolsByKey.values());
      const symbolsMissingLabel = majorSymbols
        .filter((symbol) => !majorLabelsByKey.has(symbol.key))
        .map((symbol) => ({
          key: symbol.key,
          placeId: symbol.placeId,
          isCluster: symbol.isCluster,
          layerId: symbol.layerId,
          pointPx: [symbol.pointPx.x, symbol.pointPx.y]
        }));

      const orphanLabels = [];
      const nearestPinMismatches = [];
      const labelCoveringOtherPins = [];
      for (const [key, box] of labelBoxesByKey.entries()) {
        const labelEntry = majorLabelsByKey.get(key);
        if (!labelEntry) {
          continue;
        }

        const ownSymbol = majorSymbolsByKey.get(key);
        if (!ownSymbol) {
          orphanLabels.push({
            key,
            placeId: labelEntry.placeId,
            label: labelEntry.label
          });
          continue;
        }

        const distances = majorSymbols
          .map((symbol) => ({
            key: symbol.key,
            placeId: symbol.placeId,
            layerId: symbol.layerId,
            distancePx: pointToBoxDistance(symbol.pointPx, box)
          }))
          .sort((left, right) => left.distancePx - right.distancePx);
        const nearest = distances[0] ?? null;
        const ownDistancePx = pointToBoxDistance(ownSymbol.pointPx, box);
        const secondNearest = distances.length > 1 ? distances[1] : null;
        const secondNearestDeltaPx =
          secondNearest === null ? Number.POSITIVE_INFINITY : secondNearest.distancePx - ownDistancePx;

        if (!nearest || nearest.key !== key || secondNearestDeltaPx < 1) {
          nearestPinMismatches.push({
            key,
            placeId: labelEntry.placeId,
            label: labelEntry.label,
            ownDistancePx,
            nearest,
            secondNearest,
            secondNearestDeltaPx,
            labelBoxPx: [box.minX, box.minY, box.maxX, box.maxY]
          });
        }

        const covering = [];
        for (const symbol of majorSymbols) {
          if (symbol.key === key) {
            continue;
          }

          if (!circleIntersectsBox(symbol.pointPx, symbol.effectiveRadius, box)) {
            continue;
          }

          covering.push({
            key: symbol.key,
            placeId: symbol.placeId,
            layerId: symbol.layerId,
            effectiveRadius: symbol.effectiveRadius,
            pointPx: [symbol.pointPx.x, symbol.pointPx.y]
          });
        }

        if (covering.length > 0) {
          labelCoveringOtherPins.push({
            key,
            placeId: labelEntry.placeId,
            label: labelEntry.label,
            labelBoxPx: [box.minX, box.minY, box.maxX, box.maxY],
            overlaps: covering
          });
        }
      }

      return {
        viewport: {
          width: Math.round(mapRect.width),
          height: Math.round(mapRect.height)
        },
        scanRegionPx: {
          minX: regionMinX,
          maxX: regionMaxX,
          minY: regionMinY,
          maxY: regionMaxY,
          step: scanStepPx,
          offsets: scanOffsets
        },
        majorSymbolCount: majorSymbols.length,
        majorLabelCount: majorLabelsByKey.size,
        majorSymbols: majorSymbols.map((symbol) => ({
          key: symbol.key,
          placeId: symbol.placeId,
          isCluster: symbol.isCluster,
          layerId: symbol.layerId,
          label: symbol.label,
          pointPx: [symbol.pointPx.x, symbol.pointPx.y],
          effectiveRadius: symbol.effectiveRadius
        })),
        majorLabels: Array.from(majorLabelsByKey.values()).map((label) => ({
          key: label.key,
          placeId: label.placeId,
          isCluster: label.isCluster,
          layerId: label.layerId,
          label: label.label,
          projectedPointPx: [label.projected.x, label.projected.y]
        })),
        symbolsMissingLabel,
        labelsMissingCoverage,
        orphanLabels,
        nearestPinMismatchCount: nearestPinMismatches.length,
        nearestPinMismatches: nearestPinMismatches.slice(0, 10),
        labelCoveringOtherPinCount: labelCoveringOtherPins.length,
        labelCoveringOtherPins: labelCoveringOtherPins.slice(0, 10)
      };
    },
    {
      testHookKey: mapTestHookKey,
      majorPinLayerIds,
      majorClusterLayerIds,
      majorPinLabelLayerIds,
      majorClusterLabelLayerIds
    }
  );
}

async function verifyOverviewLabelReadabilityAcrossViewports(browser, baseUrl) {
  const overviewViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 }
  ];
  const areaLabelDriftTolerancePx = 12;
  const results = [];

  for (const viewport of overviewViewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitForMapToSettle(page);
      await waitForMapStyleLoaded(page);
      await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
        timeout: 30_000
      });

      const readability = await page.evaluate(
        ({
          testHookKey,
          areaLayerIds,
          pinLabelLayerIds,
          majorPinLayerId,
          majorClusterLayerId,
          standardPinLayerId,
          standardClusterLayerId,
          areaLabelDriftTolerancePx
        }) => {
          const map = window[testHookKey];
          if (!map) {
            throw new Error("Map test hook is unavailable.");
          }

          const areaLayerIdSet = new Set(areaLayerIds);
          const labelLayerIds = Array.from(new Set([...pinLabelLayerIds, ...areaLayerIds]));

          const featureKey = (feature) => {
            const properties = feature.properties ?? {};
            const layerId = String(feature.layer?.id ?? "layer");
            const entryId = typeof properties.entryId === "string" ? properties.entryId.trim() : "";
            if (entryId.length > 0) {
              return `${layerId}:${entryId}`;
            }

            const clusterId = Number(properties.cluster_id);
            if (Number.isFinite(clusterId)) {
              return `${layerId}:cluster:${clusterId}`;
            }

            const placeId = typeof properties.placeId === "string" ? properties.placeId.trim() : "";
            if (placeId.length > 0) {
              return `${layerId}:place:${placeId}`;
            }

            return `${layerId}:${String(feature.id ?? "feature")}:${feature.geometry?.type ?? "geom"}`;
          };

          const featureLabelText = (feature) =>
            String(
              feature.properties?.clusterLabelText ??
                feature.properties?.labelText ??
                feature.properties?.placeName ??
                ""
            ).trim();

          const projectPointFeature = (feature) => {
            if (feature.geometry?.type !== "Point") {
              return null;
            }

            const [longitude, latitude] = feature.geometry.coordinates;
            if (typeof longitude !== "number" || typeof latitude !== "number") {
              return null;
            }

            return map.project([longitude, latitude]);
          };

          const visibleLabelsByKey = new Map();
          const visibleLabelFeatures = map.queryRenderedFeatures(undefined, { layers: labelLayerIds });
          for (const feature of visibleLabelFeatures) {
            const key = featureKey(feature);
            if (visibleLabelsByKey.has(key)) {
              continue;
            }

            const projected = projectPointFeature(feature);
            if (!projected) {
              continue;
            }

            visibleLabelsByKey.set(key, {
              key,
              layerId: String(feature.layer?.id ?? ""),
              label: featureLabelText(feature),
              projected: { x: projected.x, y: projected.y }
            });
          }

          if (visibleLabelsByKey.size === 0) {
            throw new Error("Overview readability check was vacuous: no labels were rendered.");
          }

          const visibleAreaByKey = new Map();
          const visibleAreaFeatures = map.queryRenderedFeatures(undefined, { layers: areaLayerIds });
          for (const feature of visibleAreaFeatures) {
            const key = featureKey(feature);
            if (visibleAreaByKey.has(key)) {
              continue;
            }

            const projected = projectPointFeature(feature);
            if (!projected) {
              continue;
            }

            visibleAreaByKey.set(key, {
              key,
              layerId: String(feature.layer?.id ?? ""),
              label: featureLabelText(feature),
              projected: { x: projected.x, y: projected.y }
            });
          }

          const projectedPoints = Array.from(visibleLabelsByKey.values()).map((label) => label.projected);
          const mapRect = map.getContainer().getBoundingClientRect();
          const regionPaddingPx = 240;
          const minProjectedX = Math.min(...projectedPoints.map((point) => point.x));
          const maxProjectedX = Math.max(...projectedPoints.map((point) => point.x));
          const minProjectedY = Math.min(...projectedPoints.map((point) => point.y));
          const maxProjectedY = Math.max(...projectedPoints.map((point) => point.y));
          const regionMinX = Math.max(0, Math.floor(minProjectedX - regionPaddingPx));
          const regionMaxX = Math.min(
            Math.floor(mapRect.width),
            Math.ceil(maxProjectedX + regionPaddingPx)
          );
          const regionMinY = Math.max(0, Math.floor(minProjectedY - regionPaddingPx));
          const regionMaxY = Math.min(
            Math.floor(mapRect.height),
            Math.ceil(maxProjectedY + regionPaddingPx)
          );

          const scanStepPx = 4;
          const scanOffsets = [
            [0, 0],
            [2, 2]
          ];
          let overlapCollisionCount = 0;
          const overlapCollisionSamples = [];
          const areaLabelCoverage = new Map();

          for (const [offsetX, offsetY] of scanOffsets) {
            for (let y = regionMinY + offsetY; y <= regionMaxY; y += scanStepPx) {
              for (let x = regionMinX + offsetX; x <= regionMaxX; x += scanStepPx) {
                const featuresAtPoint = map.queryRenderedFeatures([x, y], { layers: labelLayerIds });
                if (featuresAtPoint.length === 0) {
                  continue;
                }

                const labelsAtPoint = new Map();
                for (const feature of featuresAtPoint) {
                  const key = featureKey(feature);
                  if (!visibleLabelsByKey.has(key)) {
                    continue;
                  }

                  labelsAtPoint.set(key, featureLabelText(feature));
                  if (areaLayerIdSet.has(String(feature.layer?.id ?? ""))) {
                    const currentCoverage = areaLabelCoverage.get(key) ?? {
                      sampleCount: 0,
                      sumX: 0,
                      sumY: 0
                    };
                    currentCoverage.sampleCount += 1;
                    currentCoverage.sumX += x;
                    currentCoverage.sumY += y;
                    areaLabelCoverage.set(key, currentCoverage);
                  }
                }

                if (labelsAtPoint.size > 1) {
                  overlapCollisionCount += 1;
                  if (overlapCollisionSamples.length < 8) {
                    overlapCollisionSamples.push({
                      samplePointPx: [x, y],
                      labels: Array.from(labelsAtPoint.entries())
                        .map(([key, label]) => ({
                          key,
                          label
                        }))
                        .sort((left, right) => left.key.localeCompare(right.key))
                    });
                  }
                }
              }
            }
          }

          const areaLabelProjectionSamples = [];
          const areaLabelsMissingCoverage = [];
          let maxAreaLabelDistancePx = 0;

          for (const areaLabel of visibleAreaByKey.values()) {
            const coverage = areaLabelCoverage.get(areaLabel.key);
            if (!coverage || coverage.sampleCount === 0) {
              areaLabelsMissingCoverage.push({
                key: areaLabel.key,
                label: areaLabel.label,
                projectedPointPx: [areaLabel.projected.x, areaLabel.projected.y]
              });
              continue;
            }

            const centroidX = coverage.sumX / coverage.sampleCount;
            const centroidY = coverage.sumY / coverage.sampleCount;
            const distancePx = Math.hypot(
              centroidX - areaLabel.projected.x,
              centroidY - areaLabel.projected.y
            );
            maxAreaLabelDistancePx = Math.max(maxAreaLabelDistancePx, distancePx);
            areaLabelProjectionSamples.push({
              key: areaLabel.key,
              label: areaLabel.label,
              distancePx,
              projectedPointPx: [areaLabel.projected.x, areaLabel.projected.y],
              centroidPx: [centroidX, centroidY],
              sampleCount: coverage.sampleCount
            });
          }

          const areaLabelsTooFar = areaLabelProjectionSamples
            .filter((sample) => sample.distancePx > areaLabelDriftTolerancePx)
            .sort((left, right) => right.distancePx - left.distancePx)
            .slice(0, 8);

          const majorSymbolFeatures = map.queryRenderedFeatures(undefined, {
            layers: [majorPinLayerId, majorClusterLayerId]
          });
          const majorSymbolsByKey = new Map();
          for (const feature of majorSymbolFeatures) {
            const key = featureKey(feature);
            if (majorSymbolsByKey.has(key)) {
              continue;
            }

            const projected = projectPointFeature(feature);
            if (!projected) {
              continue;
            }

            const pointCount = Number(feature.properties?.point_count ?? 0);
            const isMajorCluster = String(feature.layer?.id ?? "") === majorClusterLayerId;
            const isSelectedPlace =
              feature.properties?.isSelectedPlace === true ||
              feature.properties?.isSelectedPlace === "true";
            const isHighlightedPlace =
              feature.properties?.isHighlightedPlace === true ||
              feature.properties?.isHighlightedPlace === "true";
            const fillRadius = isMajorCluster
              ? pointCount >= 20
                ? 11
                : pointCount >= 8
                  ? 10
                  : 9
              : isSelectedPlace
                ? 10.5
                : isHighlightedPlace
                  ? 9.5
                  : 8;
            const effectiveRadius = fillRadius + 1;

            majorSymbolsByKey.set(key, {
              key,
              layerId: String(feature.layer?.id ?? ""),
              label: featureLabelText(feature),
              projected: { x: projected.x, y: projected.y },
              effectiveRadius
            });
          }

          const majorSymbols = Array.from(majorSymbolsByKey.values());
          const majorPinOverlapSamples = [];
          let majorPinOverlapCount = 0;
          for (let index = 0; index < majorSymbols.length; index += 1) {
            const left = majorSymbols[index];
            for (let otherIndex = index + 1; otherIndex < majorSymbols.length; otherIndex += 1) {
              const right = majorSymbols[otherIndex];
              const distance = Math.hypot(
                left.projected.x - right.projected.x,
                left.projected.y - right.projected.y
              );
              const minimumSeparation = left.effectiveRadius + right.effectiveRadius;
              if (distance + 0.25 >= minimumSeparation) {
                continue;
              }

              majorPinOverlapCount += 1;
              if (majorPinOverlapSamples.length < 8) {
                majorPinOverlapSamples.push({
                  left: {
                    key: left.key,
                    layerId: left.layerId,
                    pointPx: [left.projected.x, left.projected.y],
                    effectiveRadius: left.effectiveRadius
                  },
                  right: {
                    key: right.key,
                    layerId: right.layerId,
                    pointPx: [right.projected.x, right.projected.y],
                    effectiveRadius: right.effectiveRadius
                  },
                  distancePx: distance,
                  requiredPx: minimumSeparation
                });
              }
            }
          }

          const standardSymbolFeatures = map.queryRenderedFeatures(undefined, {
            layers: [standardPinLayerId, standardClusterLayerId]
          });
          const standardSymbolsByKey = new Map();
          for (const feature of standardSymbolFeatures) {
            const key = featureKey(feature);
            if (standardSymbolsByKey.has(key)) {
              continue;
            }

            const projected = projectPointFeature(feature);
            if (!projected) {
              continue;
            }

            const pointCount = Number(feature.properties?.point_count ?? 0);
            const isStandardCluster = String(feature.layer?.id ?? "") === standardClusterLayerId;
            const isSelectedPlace =
              feature.properties?.isSelectedPlace === true ||
              feature.properties?.isSelectedPlace === "true";
            const isHighlightedPlace =
              feature.properties?.isHighlightedPlace === true ||
              feature.properties?.isHighlightedPlace === "true";
            const fillRadius = isStandardCluster
              ? pointCount >= 20
                ? 6
                : pointCount >= 8
                  ? 5
                  : 4
              : isSelectedPlace
                ? 10.5
                : isHighlightedPlace
                  ? 9.5
                  : map.getZoom() >= 6
                    ? 8
                    : 5.5;
            const effectiveRadius = isStandardCluster ? fillRadius + 1.5 : fillRadius + 1;

            standardSymbolsByKey.set(key, {
              key,
              layerId: String(feature.layer?.id ?? ""),
              label: featureLabelText(feature),
              projected: { x: projected.x, y: projected.y },
              effectiveRadius
            });
          }

          const standardSymbols = Array.from(standardSymbolsByKey.values());
          const majorStandardOverlapSamples = [];
          let majorStandardOverlapCount = 0;
          let majorStandardNonClusterOverlapCount = 0;
          const majorStandardNonClusterOverlapSamples = [];
          for (const majorSymbol of majorSymbols) {
            for (const standardSymbol of standardSymbols) {
              const distance = Math.hypot(
                majorSymbol.projected.x - standardSymbol.projected.x,
                majorSymbol.projected.y - standardSymbol.projected.y
              );
              const minimumSeparation = majorSymbol.effectiveRadius + standardSymbol.effectiveRadius;
              if (distance + 0.25 >= minimumSeparation) {
                continue;
              }

              majorStandardOverlapCount += 1;
              if (majorStandardOverlapSamples.length < 8) {
                majorStandardOverlapSamples.push({
                  major: {
                    key: majorSymbol.key,
                    layerId: majorSymbol.layerId,
                    pointPx: [majorSymbol.projected.x, majorSymbol.projected.y],
                    effectiveRadius: majorSymbol.effectiveRadius
                  },
                  standard: {
                    key: standardSymbol.key,
                    layerId: standardSymbol.layerId,
                    pointPx: [standardSymbol.projected.x, standardSymbol.projected.y],
                    effectiveRadius: standardSymbol.effectiveRadius
                  },
                  distancePx: distance,
                  requiredPx: minimumSeparation
                });
              }
            }
          }

          return {
            viewport: {
              width: Math.round(mapRect.width),
              height: Math.round(mapRect.height)
            },
            scanRegionPx: {
              minX: regionMinX,
              maxX: regionMaxX,
              minY: regionMinY,
              maxY: regionMaxY,
              step: scanStepPx,
              offsets: scanOffsets
            },
            visibleLabelCount: visibleLabelsByKey.size,
            visibleAreaLabelCount: visibleAreaByKey.size,
            overlapCollisionCount,
            overlapCollisionSamples,
            areaLabelsMissingCoverage,
            maxAreaLabelDistancePx,
            areaLabelsTooFar,
            majorSymbolCount: majorSymbols.length,
            standardSymbolCount: standardSymbols.length,
            majorPinOverlapCount,
            majorPinOverlapSamples,
            majorStandardOverlapCount,
            majorStandardOverlapSamples
          };
        },
        {
          testHookKey: mapTestHookKey,
          areaLayerIds: mapLayerIds.areaLabels,
          pinLabelLayerIds: mapLayerIds.pinLabels,
          majorPinLayerId: mapLayerIds.majorPins,
          majorClusterLayerId: mapLayerIds.majorClusterPins,
          standardPinLayerId: mapLayerIds.cityPins,
          standardClusterLayerId: mapLayerIds.clusterPins,
          areaLabelDriftTolerancePx
        }
      );
      const majorLabelAttachment = await collectMajorLabelAttachmentDiagnostics(page, {
        majorPinLayerIds: allMajorPinLayerIds,
        majorClusterLayerIds: allMajorClusterPinLayerIds,
        majorPinLabelLayerIds: mapLayerIds.majorPinLabels,
        majorClusterLabelLayerIds: mapLayerIds.majorClusterLabelLayers
      });

      if (readability.overlapCollisionCount > 0) {
        throw new Error(
          `Overview label overlap check failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            readability.overlapCollisionSamples
          )}`
        );
      }

      if (readability.areaLabelsMissingCoverage.length > 0) {
        throw new Error(
          `Overview area labels were visible but had no sampled coverage at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            readability.areaLabelsMissingCoverage
          )}`
        );
      }

      if (readability.areaLabelsTooFar.length > 0) {
        throw new Error(
          `Overview area labels drifted from projected points at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            readability.areaLabelsTooFar
          )}`
        );
      }

      if (readability.majorPinOverlapCount > 0) {
        throw new Error(
          `Overview major-pin overlap check failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            readability.majorPinOverlapSamples
          )}`
        );
      }

      if (readability.majorStandardOverlapCount > 0) {
        throw new Error(
          `Overview major-vs-standard overlap check failed at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            readability.majorStandardOverlapSamples
          )}`
        );
      }

      if (majorLabelAttachment.symbolsMissingLabel.length > 0) {
        throw new Error(
          `Overview major symbol(s) were rendered without labels at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            majorLabelAttachment.symbolsMissingLabel
          )}`
        );
      }

      if (majorLabelAttachment.labelsMissingCoverage.length > 0) {
        throw new Error(
          `Overview major labels had no sampled coverage at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            majorLabelAttachment.labelsMissingCoverage
          )}`
        );
      }

      // No orphan-label check: since ADR-0043 a name is its own symbol, so it can't come apart from
      // it; a group's name and its hit circle are filtered alike from one feature.
      const significantNearestPinMismatches = majorLabelAttachment.nearestPinMismatches.filter(
        (mismatch) => Number(mismatch.secondNearestDeltaPx ?? Number.POSITIVE_INFINITY) > 5
      );
      if (significantNearestPinMismatches.length > 0) {
        throw new Error(
          `Overview major labels were not nearest to their own symbol at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            significantNearestPinMismatches
          )}`
        );
      }

      const significantLabelOverlaps = majorLabelAttachment.labelCoveringOtherPins.filter(
        (entry) => entry.placeId !== null
      );
      if (significantLabelOverlaps.length > 0) {
        throw new Error(
          `Overview major labels intersected other major symbols at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            significantLabelOverlaps
          )}`
        );
      }

      results.push({
        viewport,
        ...readability,
        majorLabelAttachment
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyAsiaMinorSevenChurchesAtZoom65(browser, baseUrl) {
  const targetViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 }
  ];
  const results = [];

  for (const viewport of targetViewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitForMapToSettle(page);
      await waitForMapStyleLoaded(page);
      await setMapView(page, {
        center: [28.35, 38.4],
        zoom: 6.5
      });
      await waitForMapToSettle(page);

      // Each church shows by its own name or as a member of a drawn group name ("Laodicea +1"),
      // as every major does at every zoom (ADR-0043 item 5). Names are centred on their points,
      // so the pin-era "label beside its own pin" checks no longer apply; overlaps are checked by
      // verifyNoOverlappingNamesAcrossViews.
      const churchCoverage = await page.evaluate(
        ({ testHookKey, majorNameLayerIds, majorGroupLayerIds, churchIds }) => {
          const map = window[testHookKey];
          if (!map) {
            throw new Error("Map test hook is unavailable.");
          }

          const ownNamePlaceIds = new Set(
            map
              .queryRenderedFeatures(undefined, { layers: majorNameLayerIds })
              .map((feature) => String(feature.properties?.placeId ?? "").trim())
          );
          const groups = map
            .queryRenderedFeatures(undefined, { layers: majorGroupLayerIds })
            .map((feature) => ({
              labelText: String(feature.properties?.labelText ?? ""),
              memberPlaceIds: String(feature.properties?.memberPlaceIds ?? "").split(",")
            }));
          return churchIds.map((placeId) => ({
            placeId,
            shownBy: ownNamePlaceIds.has(placeId)
              ? "name"
              : (groups.find((group) => group.memberPlaceIds.includes(placeId))?.labelText ?? null)
          }));
        },
        {
          testHookKey: mapTestHookKey,
          majorNameLayerIds: mapLayerIds.majorPinLabels,
          majorGroupLayerIds: mapLayerIds.majorClusterLabelLayers,
          churchIds: asiaMinorSevenChurchPlaceIds
        }
      );

      const missingChurches = churchCoverage
        .filter((entry) => entry.shownBy === null)
        .map((entry) => entry.placeId);
      if (missingChurches.length > 0) {
        throw new Error(
          `Asia Minor zoom 6.5 shows neither the name nor a group name for ${JSON.stringify(
            missingChurches
          )} at ${viewport.width}x${viewport.height}: ${JSON.stringify(churchCoverage)}`
        );
      }

      const sevenChurchVisibleLabelPlaceIds = churchCoverage
        .filter((entry) => entry.shownBy === "name")
        .map((entry) => entry.placeId)
        .sort();
      if (sevenChurchVisibleLabelPlaceIds.length === 0) {
        throw new Error(
          `Asia Minor zoom 6.5 rendered no seven-church names at ${viewport.width}x${viewport.height}.`
        );
      }

      results.push({
        viewport,
        center: [28.35, 38.4],
        zoom: 6.5,
        churchCoverage,
        sevenChurchVisibleLabelPlaceIds
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyJerusalemGalileeAtZoom6(browser, baseUrl) {
  const targetViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 }
  ];
  const results = [];

  for (const viewport of targetViewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitForMapToSettle(page);
      await waitForMapStyleLoaded(page);
      await setMapView(page, {
        center: [35.24, 32.28],
        zoom: 6
      });
      await waitForMapToSettle(page);

      const overlap = await page.evaluate(
        ({ testHookKey, majorPinLayerId, majorClusterLayerId, standardPinLayerId, standardClusterLayerId }) => {
          const map = window[testHookKey];
          if (!map) {
            throw new Error("Map test hook is unavailable.");
          }

          const featureKey = (feature) => {
            const properties = feature.properties ?? {};
            const layerId = String(feature.layer?.id ?? "layer");
            const entryId = typeof properties.entryId === "string" ? properties.entryId.trim() : "";
            if (entryId.length > 0) {
              return `${layerId}:${entryId}`;
            }

            const clusterId = Number(properties.cluster_id);
            if (Number.isFinite(clusterId)) {
              return `${layerId}:cluster:${clusterId}`;
            }

            const placeId = typeof properties.placeId === "string" ? properties.placeId.trim() : "";
            if (placeId.length > 0) {
              return `${layerId}:place:${placeId}`;
            }

            return `${layerId}:${String(feature.id ?? "feature")}:${feature.geometry?.type ?? "geom"}`;
          };

          const projectPointFeature = (feature) => {
            if (feature.geometry?.type !== "Point") {
              return null;
            }

            const [longitude, latitude] = feature.geometry.coordinates;
            if (typeof longitude !== "number" || typeof latitude !== "number") {
              return null;
            }

            return map.project([longitude, latitude]);
          };

          const toSymbolSnapshot = (feature, clusterLayerId) => {
            const projected = projectPointFeature(feature);
            if (!projected) {
              return null;
            }

            const pointCount = Number(feature.properties?.point_count ?? 0);
              const isCluster = feature.properties?.cluster === true;
            const isSelectedPlace =
              feature.properties?.isSelectedPlace === true ||
              feature.properties?.isSelectedPlace === "true";
            const isHighlightedPlace =
              feature.properties?.isHighlightedPlace === true ||
              feature.properties?.isHighlightedPlace === "true";
            const fillRadius = isCluster
              ? pointCount >= 20
                ? 6
                : pointCount >= 8
                  ? 5
                  : 4
              : isSelectedPlace
                ? 10.5
                : isHighlightedPlace
                  ? 9.5
                  : map.getZoom() >= 6
                    ? 8
                    : 5.5;
            const effectiveRadius = isCluster ? fillRadius + 1.5 : fillRadius + 1;

            return {
              key: featureKey(feature),
              layerId: String(feature.layer?.id ?? ""),
              isCluster,
              pointPx: { x: projected.x, y: projected.y },
              effectiveRadius
            };
          };

          const toMajorSnapshot = (feature) => {
            const projected = projectPointFeature(feature);
            if (!projected) {
              return null;
            }

            const pointCount = Number(feature.properties?.point_count ?? 0);
            const isCluster = feature.properties?.cluster === true;
            const isSelectedPlace =
              feature.properties?.isSelectedPlace === true ||
              feature.properties?.isSelectedPlace === "true";
            const isHighlightedPlace =
              feature.properties?.isHighlightedPlace === true ||
              feature.properties?.isHighlightedPlace === "true";
            const fillRadius = isCluster
              ? pointCount >= 20
                ? 11
                : pointCount >= 8
                  ? 10
                  : 9
              : isSelectedPlace
                ? 10.5
                : isHighlightedPlace
                  ? 9.5
                  : 8;

            return {
              key: featureKey(feature),
              layerId: String(feature.layer?.id ?? ""),
              isCluster,
              pointPx: { x: projected.x, y: projected.y },
              effectiveRadius: fillRadius + 1
            };
          };

          const collectUniqueSymbols = (features, mapSymbol) => {
            const byKey = new Map();
            for (const feature of features) {
              const snapshot = mapSymbol(feature);
              if (!snapshot || byKey.has(snapshot.key)) {
                continue;
              }
              byKey.set(snapshot.key, snapshot);
            }
            return Array.from(byKey.values());
          };

          const majorSymbols = collectUniqueSymbols(
            map.queryRenderedFeatures(undefined, { layers: [majorPinLayerId, majorClusterLayerId] }),
            toMajorSnapshot
          );
          const standardSymbols = collectUniqueSymbols(
            map.queryRenderedFeatures(undefined, {
              layers: [standardPinLayerId, standardClusterLayerId]
            }),
            (feature) => toSymbolSnapshot(feature, standardClusterLayerId)
          );

          const majorPinOverlapSamples = [];
          let majorPinOverlapCount = 0;
          for (let index = 0; index < majorSymbols.length; index += 1) {
            const left = majorSymbols[index];
            for (let otherIndex = index + 1; otherIndex < majorSymbols.length; otherIndex += 1) {
              const right = majorSymbols[otherIndex];
              const distance = Math.hypot(left.pointPx.x - right.pointPx.x, left.pointPx.y - right.pointPx.y);
              const minimumSeparation = left.effectiveRadius + right.effectiveRadius;
              if (distance + 0.25 >= minimumSeparation) {
                continue;
              }

              majorPinOverlapCount += 1;
              if (majorPinOverlapSamples.length < 8) {
                majorPinOverlapSamples.push({
                  left,
                  right,
                  distancePx: distance,
                  requiredPx: minimumSeparation
                });
              }
            }
          }

          const majorStandardOverlapSamples = [];
          let majorStandardOverlapCount = 0;
          let majorStandardNonClusterOverlapCount = 0;
          const majorStandardNonClusterOverlapSamples = [];
          for (const majorSymbol of majorSymbols) {
            for (const standardSymbol of standardSymbols) {
              const distance = Math.hypot(
                majorSymbol.pointPx.x - standardSymbol.pointPx.x,
                majorSymbol.pointPx.y - standardSymbol.pointPx.y
              );
              const minimumSeparation = majorSymbol.effectiveRadius + standardSymbol.effectiveRadius;
              if (distance + 0.25 >= minimumSeparation) {
                continue;
              }

              majorStandardOverlapCount += 1;
              if (!majorSymbol.isCluster) {
                majorStandardNonClusterOverlapCount += 1;
                if (majorStandardNonClusterOverlapSamples.length < 8) {
                  majorStandardNonClusterOverlapSamples.push({
                    major: majorSymbol,
                    standard: standardSymbol,
                    distancePx: distance,
                    requiredPx: minimumSeparation
                  });
                }
              }
              if (majorStandardOverlapSamples.length < 8) {
                majorStandardOverlapSamples.push({
                  major: majorSymbol,
                  standard: standardSymbol,
                  distancePx: distance,
                  requiredPx: minimumSeparation
                });
              }
            }
          }

          return {
            majorSymbolCount: majorSymbols.length,
            standardSymbolCount: standardSymbols.length,
            majorPinOverlapCount,
            majorPinOverlapSamples,
            majorStandardOverlapCount,
            majorStandardOverlapSamples,
            majorStandardNonClusterOverlapCount,
            majorStandardNonClusterOverlapSamples
          };
        },
        {
          testHookKey: mapTestHookKey,
          majorPinLayerId: mapLayerIds.majorPins,
          majorClusterLayerId: mapLayerIds.majorClusterPins,
          standardPinLayerId: mapLayerIds.cityPins,
          standardClusterLayerId: mapLayerIds.clusterPins
        }
      );

      const majorLabelAttachment = await collectMajorLabelAttachmentDiagnostics(page, {
        majorPinLayerIds: allMajorPinLayerIds,
        majorClusterLayerIds: allMajorClusterPinLayerIds,
        majorPinLabelLayerIds: mapLayerIds.majorPinLabels,
        majorClusterLabelLayerIds: mapLayerIds.majorClusterLabelLayers
      });

      if (overlap.majorStandardNonClusterOverlapCount > 0) {
        throw new Error(
          `Jerusalem/Galilee zoom 6 has major-vs-standard overlaps at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            overlap.majorStandardNonClusterOverlapSamples
          )}`
        );
      }

      results.push({
        viewport,
        center: [35.24, 32.28],
        zoom: 6,
        ...overlap,
        majorLabelAttachment
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function waitForMapStyleLoaded(page) {
  await page.waitForFunction((testHookKey) => {
    const map = window[testHookKey];
    return Boolean(map && map.isStyleLoaded());
  }, mapTestHookKey, { timeout: 40_000 });
}

async function collectRenderedTextValues(page, layerIds, propertyName) {
  const targetLayerIds = Array.isArray(layerIds) ? layerIds : [layerIds];
  return page.evaluate(
    ({ testHookKey, targetLayerIds, targetPropertyName }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const rendered = map.queryRenderedFeatures(undefined, {
        layers: targetLayerIds
      });
      const byEntry = new Map();
      for (const feature of rendered) {
        const entryId = String(
          feature.properties?.entryId ??
            feature.id ??
            `${feature.layer.id}:${feature.geometry?.type ?? "unknown"}`
        );
        if (byEntry.has(entryId)) {
          continue;
        }

        const value = feature.properties?.[targetPropertyName];
        if (typeof value !== "string" || value.trim().length === 0) {
          continue;
        }
        byEntry.set(entryId, value);
      }

      return Array.from(byEntry.values());
    },
    {
      testHookKey: mapTestHookKey,
      targetLayerIds,
      targetPropertyName: propertyName
    }
  );
}

async function verifyImportantPlacesFirstOnOverview(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);

  const overview = await page.evaluate(
    async ({
      testHookKey,
      expectedMajorPinIds,
      majorSourceId,
      majorClusterLayerId,
      majorClusterLabelLayerIds,
      majorPinLayerId,
      majorPinLabelLayerIds,
      standardPinLabelLayerId
    }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      if (!map.getSource(majorSourceId)) {
        throw new Error("Major names source is unavailable.");
      }

      const majorPinLabels = map.queryRenderedFeatures(undefined, {
        layers: majorPinLabelLayerIds
      });
      const majorPins = map.queryRenderedFeatures(undefined, {
        layers: [majorPinLayerId]
      });
      const standardPinLabels = map.queryRenderedFeatures(undefined, {
        layers: [standardPinLabelLayerId]
      });
      const majorClusterFeatures = map.queryRenderedFeatures(undefined, {
        layers: [majorClusterLayerId]
      });
      const majorClusterLabelFeatures = map.queryRenderedFeatures(undefined, {
        layers: majorClusterLabelLayerIds
      });

      const majorPinLabelPlaceIds = new Set(
        majorPinLabels
          .map((feature) => String(feature.properties?.placeId ?? "").trim())
          .filter((value) => value.length > 0)
      );
      const majorPinVisiblePlaceIds = new Set(
        majorPins
          .map((feature) => String(feature.properties?.placeId ?? "").trim())
          .filter((value) => value.length > 0)
      );
      const unlabelledMajorPinPlaceIds = Array.from(majorPinVisiblePlaceIds)
        .filter((placeId) => !majorPinLabelPlaceIds.has(placeId))
        .sort();
      const standardPinLabelPlaceIds = new Set(
        standardPinLabels
          .map((feature) => String(feature.properties?.placeId ?? "").trim())
          .filter((value) => value.length > 0)
      );

      const byClusterId = new Map();
      for (const feature of majorClusterFeatures) {
        const clusterId = Number(feature.properties?.cluster_id);
        const pointCount = Number(feature.properties?.point_count);
        if (!Number.isFinite(clusterId) || !Number.isFinite(pointCount)) {
          continue;
        }
        if (!byClusterId.has(clusterId)) {
          byClusterId.set(clusterId, {
            clusterId,
            pointCount,
            memberPlaceIds: String(feature.properties?.memberPlaceIds ?? "").split(","),
            memberNames: String(feature.properties?.memberNames ?? "").split(", "),
            coordinates:
              feature.geometry?.type === "Point" ? feature.geometry.coordinates : null
          });
        }
      }

      const clusterLabelById = new Map();
      for (const feature of majorClusterLabelFeatures) {
        const clusterId = Number(feature.properties?.cluster_id);
        if (!Number.isFinite(clusterId) || clusterLabelById.has(clusterId)) {
          continue;
        }
        const labelText = String(feature.properties?.clusterLabelText ?? "").trim();
        clusterLabelById.set(clusterId, labelText);
      }

      const majorIdsCovered = new Set(majorPinLabelPlaceIds);
      const majorClusterSummaries = [];
      for (const clusterSummary of byClusterId.values()) {
        // A group lists its members by importance, its top place first.
        const members = clusterSummary.memberPlaceIds
          .map((placeId, importanceRank) => ({
            placeId: placeId.trim(),
            placeName: String(clusterSummary.memberNames[importanceRank] ?? "").trim(),
            importanceRank
          }))
          .filter((member) => member.placeId.length > 0 && member.placeName.length > 0);

        for (const member of members) {
          majorIdsCovered.add(member.placeId);
        }

        const topMember = members[0] ?? null;
        majorClusterSummaries.push({
          clusterId: clusterSummary.clusterId,
          pointCount: clusterSummary.pointCount,
          topPlaceId: topMember?.placeId ?? null,
          topPlaceName: topMember?.placeName ?? null,
          labelText:
            clusterLabelById.get(clusterSummary.clusterId) ??
            (topMember
              ? `${topMember.placeName} +${Math.max(0, clusterSummary.pointCount - 1)}`
              : ""),
          memberIds: members.map((member) => member.placeId),
          memberNames: members.map((member) => member.placeName),
          coordinates: clusterSummary.coordinates
        });
      }

      const missingMajorIds = expectedMajorPinIds.filter((id) => !majorIdsCovered.has(id));
      const jerusalemCluster =
        majorClusterSummaries.find((summary) => summary.memberIds.includes("jerusalem")) ?? null;

      return {
        majorPinLabelPlaceIds: Array.from(majorPinLabelPlaceIds).sort(),
        majorPinVisiblePlaceIds: Array.from(majorPinVisiblePlaceIds).sort(),
        unlabelledMajorPinPlaceIds,
        standardPinLabelPlaceIds: Array.from(standardPinLabelPlaceIds).sort(),
        majorIdsCovered: Array.from(majorIdsCovered).sort(),
        missingMajorIds,
        majorClusterCount: majorClusterSummaries.length,
        majorClusterSummaries,
        jerusalemCluster
      };
    },
    {
      testHookKey: mapTestHookKey,
      expectedMajorPinIds: expectedMajorPinPlaceIds,
      majorSourceId: "ibm-major-city-pins",
      majorClusterLayerId: mapLayerIds.majorClusterPins,
      majorClusterLabelLayerIds: mapLayerIds.majorClusterLabelLayers,
      majorPinLayerId: mapLayerIds.majorPins,
      majorPinLabelLayerIds: mapLayerIds.majorPinLabels,
      standardPinLabelLayerId: "ibm-city-pin"
    }
  );

  if (overview.missingMajorIds.length > 3) {
    throw new Error(
      `Overview is missing major pin places from labels/groups: ${JSON.stringify(
        overview.missingMajorIds
      )}`
    );
  }

  if (overview.unlabelledMajorPinPlaceIds.length > 0) {
    throw new Error(
      `Overview has visible unlabelled major pins: ${JSON.stringify(
        overview.unlabelledMajorPinPlaceIds
      )}`
    );
  }

  if (overview.standardPinLabelPlaceIds.length > 0) {
    throw new Error(
      `Overview shows non-major pin labels at default zoom: ${JSON.stringify(
        overview.standardPinLabelPlaceIds
      )}`
    );
  }

  if (!overview.jerusalemCluster) {
    throw new Error(
      `Could not find a major cluster containing Jerusalem at default zoom: ${JSON.stringify(
        overview.majorClusterSummaries
      )}`
    );
  }

  if (overview.jerusalemCluster.topPlaceId !== "jerusalem") {
    throw new Error(
      `Jerusalem cluster should prioritize Jerusalem, got ${JSON.stringify(
        overview.jerusalemCluster
      )}`
    );
  }

  const jerusalemNearbyCount = Math.max(0, Number(overview.jerusalemCluster.pointCount) - 1);
  if (jerusalemNearbyCount < 4) {
    throw new Error(
      `Jerusalem cluster should include at least 4 nearby places, got ${jerusalemNearbyCount}.`
    );
  }

  const nazarethCluster =
    overview.majorClusterSummaries.find((summary) => summary.memberIds.includes("nazareth")) ?? null;
  if (!nazarethCluster) {
    throw new Error(
      `Could not find a major cluster containing Nazareth at default zoom: ${JSON.stringify(
        overview.majorClusterSummaries
      )}`
    );
  }
  if (nazarethCluster.clusterId === overview.jerusalemCluster.clusterId) {
    throw new Error(
      `Overview should keep Nazareth and Jerusalem in separate major clusters, got shared cluster ${nazarethCluster.clusterId}.`
    );
  }
  const jerusalemGroupCount = Math.max(0, Number(overview.jerusalemCluster.pointCount ?? 0) - 1);
  const nazarethGroupCount = Math.max(0, Number(nazarethCluster.pointCount ?? 0) - 1);
  if (
    overview.jerusalemCluster.topPlaceId !== "jerusalem" ||
    nazarethCluster.topPlaceId !== "nazareth" ||
    jerusalemGroupCount < 1 ||
    nazarethGroupCount < 1
  ) {
    throw new Error(
      `Overview should show separate Jerusalem+N and Nazareth+N major groups: ${JSON.stringify({
        jerusalemCluster: overview.jerusalemCluster,
        nazarethCluster
      })}.`
    );
  }

  const jerusalemClusterCoordinates = overview.jerusalemCluster.coordinates;
  if (
    !Array.isArray(jerusalemClusterCoordinates) ||
    jerusalemClusterCoordinates.length < 2 ||
    typeof jerusalemClusterCoordinates[0] !== "number" ||
    typeof jerusalemClusterCoordinates[1] !== "number"
  ) {
    throw new Error(
      `Jerusalem cluster coordinates were unavailable: ${JSON.stringify(overview.jerusalemCluster)}`
    );
  }

  const jerusalemPoint = await page.evaluate(
    ({ testHookKey, coordinates }) => {
      const map = window[testHookKey];
      if (!map) {
        return null;
      }

      const projected = map.project(coordinates);
      return {
        x: projected.x,
        y: projected.y
      };
    },
    {
      testHookKey: mapTestHookKey,
      coordinates: jerusalemClusterCoordinates
    }
  );
  if (!jerusalemPoint) {
    throw new Error("Failed to project Jerusalem cluster coordinates to screen space.");
  }

  await page.mouse.click(jerusalemPoint.x, jerusalemPoint.y);
  await page.waitForFunction(() => {
    const parameters = new URLSearchParams(window.location.search.slice(1));
    return parameters.get("place") === "jerusalem";
  }, undefined, { timeout: 30_000, polling: 100 });
  await page.getByRole("heading", { level: 1, name: "Jerusalem" }).waitFor({ timeout: 30_000 });

  await page.evaluate(
    ({ testHookKey, center, zoom }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      map.jumpTo({ center, zoom });
    },
    {
      testHookKey: mapTestHookKey,
      center: [22.5, 35],
      zoom: 6
    }
  );
  await waitForMapToSettle(page);

  const zoom6StandardLabels = await page.evaluate(
    ({ testHookKey, standardPinLabelLayerId }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const features = map.queryRenderedFeatures(undefined, {
        layers: [standardPinLabelLayerId]
      });
      const labelsByPlaceId = new Map();
      for (const feature of features) {
        const placeId = String(feature.properties?.placeId ?? "").trim();
        const labelText = String(feature.properties?.labelText ?? "").trim();
        if (!placeId || !labelText || labelsByPlaceId.has(placeId)) {
          continue;
        }
        labelsByPlaceId.set(placeId, labelText);
      }

      return {
        labelCount: labelsByPlaceId.size,
        labels: Array.from(labelsByPlaceId.values()).sort((left, right) =>
          left.localeCompare(right, undefined, { sensitivity: "base" })
        ),
        placeIds: Array.from(labelsByPlaceId.keys()).sort()
      };
    },
    {
      testHookKey: mapTestHookKey,
      standardPinLabelLayerId: "ibm-city-pin"
    }
  );

  if (zoom6StandardLabels.labelCount === 0) {
    throw new Error("Expected non-major pin labels to appear at zoom 6, but none were rendered.");
  }

  return {
    overview,
    jerusalemNearbyCount,
    zoom6StandardLabels
  };
}

async function verifyPinLabelRegression(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  const capernaumLabels = await collectRenderedTextValues(page, mapLayerIds.pinLabels, "labelText");

  for (const requiredLabel of requiredCapernaumPinLabels) {
    if (!capernaumLabels.includes(requiredLabel)) {
      throw new Error(
        `Pin-label regression at ?place=capernaum: missing '${requiredLabel}' in ${JSON.stringify(capernaumLabels)}`
      );
    }
  }

  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  const galileeLabels = await collectRenderedTextValues(page, mapLayerIds.pinLabels, "labelText");
  if (galileeLabels.length < minimumGalileePinLabels) {
    throw new Error(
      `Pin-label regression at ?place=galilee: expected at least ${minimumGalileePinLabels} labels, got ${galileeLabels.length} (${JSON.stringify(galileeLabels)})`
    );
  }

  return {
    capernaumLabels,
    galileeLabelCount: galileeLabels.length,
    galileeLabelSample: galileeLabels.slice(0, 16)
  };
}

async function verifyMajorPlacesRemainCoveredAcrossZooms(page, baseUrl) {
  await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);

  const coverage = await page.evaluate(
    async ({ testHookKey, targetPlaceIds, majorLabelLayerIds }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const indexPayload = await fetch("/generated/places.index.json")
        .then((response) => response.json())
        .catch(() => null);
      const records = Array.isArray(indexPayload) ? indexPayload : [];
      const byId = new Map(records.map((place) => [String(place.id ?? ""), place]));
      const targets = targetPlaceIds
        .map((placeId) => {
          const place = byId.get(placeId);
          const candidate = Array.isArray(place?.candidates) ? place.candidates[0] : null;
          const coordinates =
            candidate &&
            Array.isArray(candidate.coordinates) &&
            candidate.coordinates.length >= 2 &&
            Number.isFinite(Number(candidate.coordinates[0])) &&
            Number.isFinite(Number(candidate.coordinates[1]))
              ? [Number(candidate.coordinates[0]), Number(candidate.coordinates[1])]
              : null;
          if (!coordinates) {
            return null;
          }
          return { placeId, coordinates };
        })
        .filter((target) => target !== null);

      // A major counts as shown only by its own drawn name.
      const shownBy = (placeId) => {
        const ownName = map
          .queryRenderedFeatures(undefined, { layers: majorLabelLayerIds })
          .some(
            (feature) =>
              String(feature.properties?.placeId ?? "").trim() === placeId &&
              String(feature.properties?.labelText ?? "").trim().length > 0
          );
        return ownName ? "name" : null;
      };

      const failures = [];
      const zooms = Array.from({ length: 17 }, (_value, index) => 3 + index * 0.5);
      const statsByZoom = [];
      for (const zoom of zooms) {
        let coveredCount = 0;
        for (const target of targets) {
          map.jumpTo({ center: target.coordinates, zoom });
          await new Promise((resolve) => map.once("idle", resolve));

          let shown = shownBy(target.placeId);
          if (!shown) {
            map.triggerRepaint();
            await new Promise((resolve) => map.once("render", resolve));
            shown = shownBy(target.placeId);
          }

          if (!shown) {
            failures.push({
              zoom,
              placeId: target.placeId,
              center: target.coordinates,
              renderedMajorNames: map
                .queryRenderedFeatures(undefined, { layers: majorLabelLayerIds })
                .map((feature) => String(feature.properties?.placeId ?? ""))
                .slice(0, 20)
            });
            continue;
          }

          coveredCount += 1;
        }

        statsByZoom.push({
          zoom,
          coveredCount,
          totalTargets: targets.length
        });
      }

      return {
        targetCount: targets.length,
        statsByZoom,
        failures
      };
    },
    {
      testHookKey: mapTestHookKey,
      targetPlaceIds: expectedMajorPinPlaceIds,
      majorLabelLayerIds: [...mapLayerIds.majorPinLabels, "ibm-routes-major-pin"]
    }
  );

  if (coverage.targetCount !== expectedMajorPinPlaceIds.length) {
    throw new Error(
      `Major place coverage check: expected ${expectedMajorPinPlaceIds.length} targets, got ${coverage.targetCount}.`
    );
  }

  if (coverage.failures.length > 0) {
    throw new Error(
      `Major place coverage check failed: ${JSON.stringify(coverage.failures.slice(0, 20))}`
    );
  }

  return coverage;
}

// Every layer that draws our places' or a route's names.
const nameLayerIds = [
  "ibm-major-pin",
  "ibm-major-pin-no-dot",
  "ibm-routes-major-pin",
  "ibm-city-pin",
  "ibm-city-pin-no-dot",
  "ibm-routes-city-pin",
  "ibm-site-pin",
  "ibm-site-pin-no-dot",
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

async function settleMapInPage(page) {
  await page.evaluate(
    (testHookKey) =>
      new Promise((resolve) => {
        const map = window[testHookKey];
        const done = () => {
          if (map.loaded() && !map.isMoving()) {
            resolve();
            return;
          }
          map.once("idle", done);
        };
        map.once("idle", done);
        map.triggerRepaint();
      }),
    mapTestHookKey
  );
  await page.waitForTimeout(300);
}

async function waitForSelectedPlace(page, placeId) {
  await page.waitForFunction(
    (expectedPlaceId) =>
      new URLSearchParams(window.location.search.slice(1)).get("place") === expectedPlaceId,
    placeId,
    { timeout: 30_000, polling: 100 }
  );
}

// The old bug (BACKLOG, MC10): from zoom 6, Tarsus's dot lost the collision to its own name and could
// no longer be clicked. Names are now the only symbol, so Tarsus's name shows and a click selects it.
async function verifyTarsusNameShowsAndClicks(page, baseUrl) {
  const results = [];
  for (const zoom of [7, 9]) {
    await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await waitForMapStyleLoaded(page);
    await page.evaluate(
      ({ testHookKey, targetZoom }) =>
        window[testHookKey].jumpTo({ center: [34.896467, 36.914043], zoom: targetZoom }),
      { testHookKey: mapTestHookKey, targetZoom: zoom }
    );
    await settleMapInPage(page);

    const point = await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      const tarsus = map
        .queryRenderedFeatures(undefined, { layers: ["ibm-city-pin"] })
        .find((feature) => feature.properties?.placeId === "tarsus");
      if (!tarsus || tarsus.geometry?.type !== "Point") {
        return null;
      }
      const projected = map.project(tarsus.geometry.coordinates);
      return { x: projected.x, y: projected.y };
    }, mapTestHookKey);
    if (!point) {
      throw new Error(`Tarsus's name should be drawn at zoom ${zoom}.`);
    }

    await page.mouse.click(point.x, point.y);
    await waitForSelectedPlace(page, "tarsus");
    results.push({ zoom, point });
  }
  return results;
}

// Touch targets are at least 44 px tall (spec §7). We check both a major label and a standard offset label.
async function verifyTouchTapTargetOnNames(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await waitForMapStyleLoaded(page);
    await page.evaluate(
      (testHookKey) => window[testHookKey].jumpTo({ center: [35.444564, 31.871719], zoom: 11 }),
      mapTestHookKey
    );
    await settleMapInPage(page);

    const probe = await page.evaluate(
      ({ testHookKey, layerIds }) => {
        const map = window[testHookKey];
        const jericho = map
          .queryRenderedFeatures(undefined, { layers: ["ibm-major-pin"] })
          .find((feature) => feature.properties?.placeId === "jericho");
        if (!jericho || jericho.geometry?.type !== "Point") {
          return null;
        }
        const projected = map.project(jericho.geometry.coordinates);
        const othersNearTap = map
          .queryRenderedFeatures(
            [
              [projected.x - 40, projected.y - 40],
              [projected.x + 40, projected.y - 12]
            ],
            { layers: layerIds }
          )
          .filter((feature) => feature.properties?.placeId !== "jericho").length;
        return {
          x: projected.x,
          y: projected.y,
          coarsePointer: window.matchMedia("(pointer: coarse)").matches,
          coarseAnyPointer: window.matchMedia("(any-pointer: coarse)").matches,
          othersNearTap
        };
      },
      { testHookKey: mapTestHookKey, layerIds: nameLayerIds }
    );
    if (!probe) {
      throw new Error("Touch tap-target check: Jericho's name should be drawn at zoom 11 on a phone.");
    }
    if (!probe.coarsePointer) {
      throw new Error("Touch tap-target check: the phone context should report a coarse pointer.");
    }
    if (!probe.coarseAnyPointer) {
      throw new Error("Touch tap-target check: the phone context should report any-pointer: coarse.");
    }
    if (probe.othersNearTap > 0) {
      throw new Error("Touch tap-target check: another name is near the tap; the check needs an emptier spot.");
    }

    await page.touchscreen.tap(probe.x, probe.y - 21);
    await waitForSelectedPlace(page, "jericho");

    await page.goto(`${baseUrl}/?tab=map`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await waitForMapStyleLoaded(page);
    await page.evaluate(
      (testHookKey) => window[testHookKey].jumpTo({ center: [35.5754, 32.8809], zoom: 10 }),
      mapTestHookKey
    );
    await settleMapInPage(page);

    const offsetProbe = await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      const labelLayers = [
        "ibm-city-pin",
        "ibm-city-pin-no-dot",
        "ibm-site-pin",
        "ibm-site-pin-no-dot",
        "ibm-major-pin",
        "ibm-major-pin-no-dot"
      ];
      const hitsPlaceAt = (x, y, placeId) =>
        map
          .queryRenderedFeatures(
            [
              [x, y],
              [x, y]
            ],
            { layers: labelLayers }
          )
          .some((feature) => feature.properties?.placeId === placeId);
      const candidates = map
        .queryRenderedFeatures(undefined, { layers: ["ibm-city-pin"] })
        .filter((feature) => feature.geometry?.type === "Point")
        .map((feature) => ({
          placeId: String(feature.properties?.placeId ?? ""),
          coordinates: feature.geometry.coordinates
        }))
        .filter((candidate) => candidate.placeId.length > 0);
      for (const candidate of candidates) {
        const projected = map.project(candidate.coordinates);
        let lastInside = null;
        let firstOutside = null;
        for (let dx = 0; dx <= 80; dx += 1) {
          if (hitsPlaceAt(projected.x + dx, projected.y, candidate.placeId)) {
            lastInside = projected.x + dx;
            continue;
          }
          if (lastInside !== null) {
            firstOutside = projected.x + dx;
            break;
          }
        }
        if (lastInside === null || firstOutside === null) {
          continue;
        }
        const tapX = firstOutside + 9;
        const tapY = projected.y;
        const outsideDistance = tapX - lastInside;
        const othersNearTap = map
          .queryRenderedFeatures(
            [
              [tapX - 18, tapY - 18],
              [tapX + 18, tapY + 18]
            ],
            { layers: labelLayers }
          )
          .filter((feature) => feature.properties?.placeId !== candidate.placeId).length;
        return {
          placeId: candidate.placeId,
          namePoint: { x: projected.x, y: projected.y },
          tapPoint: { x: tapX, y: tapY },
          outsideDistance,
          othersNearTap
        };
      }
      return null;
    }, mapTestHookKey);
    if (!offsetProbe) {
      return {
        jericho: { tapPoint: { x: probe.x, y: probe.y - 21 }, namePoint: { x: probe.x, y: probe.y } },
        offsetLabelProbe: {
          skipped: true,
          reason: "Could not find an isolated rendered offset label in this headless run."
        }
      };
    }
    if (offsetProbe.othersNearTap > 0) {
      throw new Error("Touch tap-target check: another label is too close to the offset-label tap probe.");
    }
    if (offsetProbe.outsideDistance <= 8 || offsetProbe.outsideDistance >= 13) {
      throw new Error(
        `Touch tap-target check: offset-label probe must be between 8px and 13px outside its box (${JSON.stringify(
          offsetProbe
        )}).`
      );
    }
    await page.touchscreen.tap(offsetProbe.tapPoint.x, offsetProbe.tapPoint.y);
    await waitForSelectedPlace(page, offsetProbe.placeId);
    return {
      jericho: { tapPoint: { x: probe.x, y: probe.y - 21 }, namePoint: { x: probe.x, y: probe.y } },
      offsetLabelProbe: offsetProbe
    };
  } finally {
    await page.close();
    await context.close();
  }
}

// The selected place's name always shows on the map when it's a single-name place (spec §2), and
// places with several candidates keep candidate dots while selected.
async function verifySelectedMajorNameAlwaysShows(page, baseUrl) {
  const results = [];
  for (const placeId of ["bethany", "cana", "bethany-beyond-the-jordan", "jerusalem"]) {
    await page.goto(`${baseUrl}/?place=${placeId}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await waitForMapStyleLoaded(page);

    const result = await page.evaluate(
      async ({ testHookKey, selectedPlaceId }) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }
        const settle = () =>
          new Promise((resolve) => {
            const done = () => {
              if (map.loaded() && !map.isMoving() && map.areTilesLoaded()) {
                resolve();
                return;
              }
              map.once("idle", done);
            };
            map.once("idle", done);
            map.triggerRepaint();
          });
        await settle();

        const selectedNames = () =>
          map
            .queryRenderedFeatures(undefined, {
              layers: ["ibm-selected-major-pin-label", "ibm-selected-site-pin-label", "ibm-selected-pin-label"]
            })
            .filter(
              (feature) =>
                feature.properties?.isSelectedPlace === true &&
                feature.properties?.placeId === selectedPlaceId
            )
            .map((feature) => String(feature.properties?.labelText ?? ""));

        const byZoom = [{ zoom: Number(map.getZoom().toFixed(2)), names: selectedNames() }];
        for (const zoom of [5, 7, 9]) {
          map.jumpTo({ zoom });
          await settle();
          byZoom.push({ zoom, names: selectedNames() });
        }
        const candidateLetters = Array.from(
          new Set(
            map
              .queryRenderedFeatures(undefined, { layers: ["ibm-candidate-pin"] })
              .map((feature) => String(feature.properties?.candidateLetter ?? ""))
          )
        ).sort();
        return { byZoom, candidateLetters };
      },
      { testHookKey: mapTestHookKey, selectedPlaceId: placeId }
    );

    const missing = result.byZoom.filter((entry) => entry.names.length !== 1);
    if (missing.length > 0) {
      throw new Error(
        `Selected place '${placeId}' should show exactly one selected name at every zoom: ${JSON.stringify(result.byZoom)}`
      );
    }
    if (placeId === "cana" && result.candidateLetters.length < 2) {
      throw new Error(
        `Selected Cana should show its candidate dots: ${JSON.stringify(result.candidateLetters)}`
      );
    }
    results.push({ placeId, ...result });
  }

  return results;
}

async function verifyNameLayersDisallowOverlap(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);

  const check = await page.evaluate(({ testHookKey, layerIds }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }

    const nameLayerIds = layerIds;

    // A name with text-ignore-placement=true hides nothing placed after it, even in its own layer.
    const entries = [];
    for (const layerId of nameLayerIds) {
      if (!map.getLayer(layerId)) {
        entries.push({ layerId, present: false, textAllowOverlap: null, textIgnorePlacement: null });
        continue;
      }
      const rawTextAllowOverlap = map.getLayoutProperty(layerId, "text-allow-overlap");
      const rawTextIgnorePlacement = map.getLayoutProperty(layerId, "text-ignore-placement");
      entries.push({
        layerId,
        present: true,
        textAllowOverlap: rawTextAllowOverlap == null ? false : rawTextAllowOverlap,
        textIgnorePlacement: rawTextIgnorePlacement == null ? false : rawTextIgnorePlacement
      });
    }

    const missing = entries.filter((entry) => !entry.present).map((entry) => entry.layerId);
    const violations = entries.filter((entry) => {
      if (!entry.present) {
        return false;
      }

      return entry.textAllowOverlap !== false || entry.textIgnorePlacement !== false;
    });
    return { entries, missing, violations };
  }, { testHookKey: mapTestHookKey, layerIds: nameLayerIds });

  if (check.missing.length > 0) {
    throw new Error(`Name overlap check: name layers missing from the map: ${check.missing.join(", ")}`);
  }

  if (check.violations.length > 0) {
    throw new Error(
      `Name overlap check: expected text-allow-overlap=false and text-ignore-placement=false for all name layers, got ${JSON.stringify(
        check.violations
      )}`
    );
  }

  return check;
}

// Reads MapLibre's placed label boxes (an internal API: fails loudly if it changes) and fails on any two
// names whose boxes overlap, on the Map tab across zooms and with a route chosen. A name may cross a
// route's line, its arrows and the stage-number pill shown while a stage is hovered or selected, as
// on Google Maps: names that hid for a passing pill would flicker.
async function verifyNoOverlappingNamesAcrossViews(page, baseUrl) {
  const views = [
    {
      url: `${baseUrl}/?tab=map`,
      label: "overview z5 (largest cluster pressure)",
      center: [33.2, 34.5],
      zoom: 5
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "jerusalem z11 (dense city/site labels)",
      center: [35.23, 31.78],
      zoom: 11
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "galilee z10 (dense cluster around Capernaum)",
      center: [35.57, 32.88],
      zoom: 10
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "antioch z9 (long labels in coastal belt)",
      center: [36.16, 36.2],
      zoom: 9
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "ephesus z8 (major place tier)",
      center: [27.34, 37.94],
      zoom: 8
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "philippi z7 (city tier transitions)",
      center: [24.29, 41.01],
      zoom: 7
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "rome z6 (western edge, sparse labels)",
      center: [12.5, 41.9],
      zoom: 6
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "jericho z9 (Jordan valley overlap risk)",
      center: [35.47, 31.86],
      zoom: 9
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "cyprus z7 (island labels)",
      center: [33.4, 35.1],
      zoom: 7
    },
    {
      url: `${baseUrl}/?tab=map`,
      label: "phone viewport z8",
      center: [35.57, 32.88],
      zoom: 8,
      viewport: { width: 390, height: 844 }
    },
    {
      url: `${baseUrl}/?tab=routes&route=paul-rome`,
      label: "routes paul-rome z7 (route labels + names)",
      center: [24.3, 35.1],
      zoom: 7
    },
    {
      url: `${baseUrl}/?tab=routes&route=paul-1`,
      label: "routes paul-1 z7 (route labels + names)",
      center: [31.2, 37.4],
      zoom: 7
    }
  ];

  const failures = [];
  const unavailableViews = [];
  let measuredViewCount = 0;
  let currentUrl = null;
  for (const view of views) {
    if (view.url !== currentUrl) {
      await page.goto(view.url, { waitUntil: "domcontentloaded", timeout: 120_000 });
      await waitForMapToSettle(page);
      await waitForMapStyleLoaded(page);
      currentUrl = view.url;
    }
    if (view.viewport) {
      await page.setViewportSize(view.viewport);
    } else {
      await page.setViewportSize({ width: 1440, height: 960 });
    }

    const result = await page.evaluate(
      async ({ testHookKey, layerIds, center, zoom }) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }
        const nameLayerIdSet = new Set(layerIds);
        map.jumpTo({ center, zoom });
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise((resolve) => setTimeout(resolve, 250));

        const placement = map.style?.placement;
        const collisionIndex = placement?.collisionIndex;
        if (
          !collisionIndex?.grid?.boxKeys ||
          !collisionIndex?.ignoredGrid?.boxKeys ||
          !placement?.retainedQueryData
        ) {
          return {
            boxCount: 0,
            overlaps: [],
            unavailable: true
          };
        }

        // The grids store boxes 100 px out from the viewport's top-left corner.
        const gridPaddingPx = 100;
        const boxes = [];
        for (const grid of [collisionIndex.grid, collisionIndex.ignoredGrid]) {
          for (let index = 0; index < grid.boxKeys.length; index += 1) {
            const key = grid.boxKeys[index];
            const retained = placement.retainedQueryData[key.bucketInstanceId];
            const layerId = retained
              ? String(retained.featureIndex.bucketLayerIDs[retained.bucketIndex]?.[0] ?? "")
              : "";
            if (!nameLayerIdSet.has(layerId)) {
              continue;
            }
            boxes.push({
              layerId,
              key: `${key.bucketInstanceId}:${key.featureIndex}`,
              x1: grid.bboxes[index * 4] - gridPaddingPx,
              y1: grid.bboxes[index * 4 + 1] - gridPaddingPx,
              x2: grid.bboxes[index * 4 + 2] - gridPaddingPx,
              y2: grid.bboxes[index * 4 + 3] - gridPaddingPx
            });
          }
        }

        const rect = map.getContainer().getBoundingClientRect();
        const visible = boxes.filter(
          (box) => box.x2 > 0 && box.y2 > 0 && box.x1 < rect.width && box.y1 < rect.height
        );

        const nameOfBox = (box) => {
          const counts = new Map();
          for (const [fx, fy] of [
            [0.5, 0.5],
            [0.25, 0.25],
            [0.75, 0.25],
            [0.25, 0.75],
            [0.75, 0.75]
          ]) {
            const x = box.x1 + (box.x2 - box.x1) * fx;
            const y = box.y1 + (box.y2 - box.y1) * fy;
            for (const feature of map.queryRenderedFeatures([x, y], { layers: [box.layerId] })) {
              const properties = feature.properties ?? {};
              const name = String(
                properties.labelText ?? properties.label ?? properties.placeName ?? properties.cluster_id ?? "?"
              );
              counts.set(name, (counts.get(name) ?? 0) + 1);
            }
          }
          return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "?";
        };

        const overlaps = [];
        for (let left = 0; left < visible.length; left += 1) {
          for (let right = left + 1; right < visible.length; right += 1) {
            const a = visible[left];
            const b = visible[right];
            if (a.key === b.key) {
              continue;
            }
            const width = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
            const height = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
            if (width > 1 && height > 1) {
              overlaps.push(
                `${nameOfBox(a)} [${a.layerId}] x ${nameOfBox(b)} [${b.layerId}] (${Math.round(width * height)} px²)`
              );
            }
          }
        }
        return { boxCount: visible.length, overlaps };
      },
      { testHookKey: mapTestHookKey, layerIds: nameLayerIds, center: view.center, zoom: view.zoom }
    );

    measuredViewCount += result.boxCount > 0 ? 1 : 0;
    if (result.unavailable) {
      unavailableViews.push(view.label);
      continue;
    }
    if (result.overlaps.length > 0) {
      failures.push({ view: view.label, overlaps: result.overlaps.slice(0, 6) });
    }
  }

  if (unavailableViews.length > 0) {
    console.warn(
      `No-overlap collision-index probe unavailable in ${unavailableViews.length} view(s): ${JSON.stringify(unavailableViews)}`
    );
  }

  if (measuredViewCount < views.length / 2) {
    throw new Error(
      `No-overlap check was vacuous: only ${measuredViewCount} of ${views.length} views had any names.`
    );
  }

  if (failures.length > 0) {
    throw new Error(`Names overlap in ${failures.length} view(s): ${JSON.stringify(failures, null, 2)}`);
  }

  return { viewCount: views.length, measuredViewCount, unavailableViews };
}

async function verifyCandidatePinColorRendering(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });

  const sample = await page.evaluate(
    ({ testHookKey, candidateLayerId }) =>
      new Promise((resolve, reject) => {
        const map = window[testHookKey];
        if (!map) {
          reject(new Error("Map test hook is unavailable."));
          return;
        }

        const features = map.queryRenderedFeatures(undefined, {
          layers: [candidateLayerId]
        });
        if (features.length === 0) {
          reject(new Error("Candidate-pin color check was vacuous: no candidate pins were rendered."));
          return;
        }

        const target =
          features.find((feature) => Number(feature.properties?.candidateIndex) === 0) ?? features[0];
        if (target.geometry?.type !== "Point") {
          reject(new Error("Candidate-pin color check target did not have point geometry."));
          return;
        }

        const [longitude, latitude] = target.geometry.coordinates;
        const point = map.project([longitude, latitude]);
        const mapCanvas = map.getCanvas();
        const scaleX = mapCanvas.width / mapCanvas.clientWidth;
        const scaleY = mapCanvas.height / mapCanvas.clientHeight;
        const centerX = Math.round(point.x * scaleX);
        const centerY = Math.round(point.y * scaleY);
        const sampleRadius = 11;

        const sampleOnNextRender = () => {
          try {
            const gl = map.painter?.context?.gl;
            if (!gl || typeof gl.readPixels !== "function") {
              throw new Error("WebGL context is unavailable for candidate-pin pixel sampling.");
            }

            const left = Math.max(0, centerX - sampleRadius);
            const right = Math.min(mapCanvas.width - 1, centerX + sampleRadius);
            const top = Math.max(0, centerY - sampleRadius);
            const bottom = Math.min(mapCanvas.height - 1, centerY + sampleRadius);
            const sampleWidth = right - left + 1;
            const sampleHeight = bottom - top + 1;
            const glY = mapCanvas.height - bottom - 1;
            const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
            gl.readPixels(left, glY, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            let opaquePixelCount = 0;
            let redOrWhitePixelCount = 0;
            let blackPixelCount = 0;

            for (let index = 0; index < pixels.length; index += 4) {
              const red = pixels[index];
              const green = pixels[index + 1];
              const blue = pixels[index + 2];
              const alpha = pixels[index + 3];
              if (alpha <= 40) {
                continue;
              }

              opaquePixelCount += 1;
              const isRedish = red > 140 && green < 115 && blue < 115;
              const isWhiteish = red > 210 && green > 210 && blue > 210;
              const isBlackish = red < 35 && green < 35 && blue < 35;
              if (isRedish || isWhiteish) {
                redOrWhitePixelCount += 1;
              }
              if (isBlackish) {
                blackPixelCount += 1;
              }
            }

            resolve({
              candidateCount: features.length,
              iconId: String(target.properties?.iconId ?? ""),
              opaquePixelCount,
              redOrWhitePixelCount,
              blackPixelCount
            });
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        };

        map.once("render", sampleOnNextRender);
        map.triggerRepaint();
      }),
    {
    testHookKey: mapTestHookKey,
    candidateLayerId: mapLayerIds.candidatePins
    }
  );

  if (sample.opaquePixelCount < 40) {
    throw new Error(
      `Candidate-pin color check sampled too few opaque pixels (${sample.opaquePixelCount}).`
    );
  }

  if (sample.redOrWhitePixelCount < 24) {
    throw new Error(
      `Candidate-pin color check expected red/white icon pixels, got ${sample.redOrWhitePixelCount} in sample ${JSON.stringify(sample)}.`
    );
  }

  const allowedBlackPixels = Math.max(12, Math.floor(sample.opaquePixelCount * 0.3));
  if (sample.blackPixelCount > allowedBlackPixels) {
    throw new Error(
      `Candidate-pin color check found too many black pixels (${sample.blackPixelCount}/${sample.opaquePixelCount}) around icon ${sample.iconId}.`
    );
  }

  return sample;
}

async function verifyCandidateDotsSelectionVisibility(page, baseUrl) {
  const inspectPlace = async () =>
    page.evaluate(
      ({ testHookKey, pinLabelLayerIds, selectedLabelLayerIds, candidateLayerId }) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }

        const labels = map.queryRenderedFeatures(undefined, {
          layers: pinLabelLayerIds
        });
        const selectedLabels = map.queryRenderedFeatures(undefined, {
          layers: selectedLabelLayerIds
        });
        const candidates = map.queryRenderedFeatures(undefined, {
          layers: [candidateLayerId]
        });

        const countForPlace = (features, placeId) =>
          features.filter((feature) => String(feature.properties?.placeId ?? "") === placeId).length;

        return {
          emmausLabelCount: countForPlace(labels, "emmaus"),
          emmausSelectedLabelCount: countForPlace(selectedLabels, "emmaus"),
          emmausCandidateCount: countForPlace(candidates, "emmaus"),
          jerichoCandidateCount: countForPlace(candidates, "jericho")
        };
      },
      {
        testHookKey: mapTestHookKey,
        pinLabelLayerIds: mapLayerIds.pinLabels,
        selectedLabelLayerIds: selectedPlaceLabelLayerIds,
        candidateLayerId: mapLayerIds.candidatePins
      }
    );

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });
  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      return;
    }
    map.jumpTo({ center: [35.23, 31.78], zoom: 9 });
  }, mapTestHookKey);
  await waitForMapToSettle(page);

  const unselected = await inspectPlace();
  if (unselected.emmausLabelCount < 1) {
    throw new Error(
      `Candidate visibility check: expected Emmaus name when unselected at zoom 9, got ${JSON.stringify(unselected)}.`
    );
  }
  if (unselected.emmausCandidateCount > 0 || unselected.jerichoCandidateCount > 0) {
    throw new Error(
      `Candidate visibility check: candidate dots must be hidden when unselected, got ${JSON.stringify(unselected)}.`
    );
  }

  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  const selected = await inspectPlace();
  if (selected.emmausSelectedLabelCount < 1) {
    throw new Error(
      `Candidate visibility check: selected Emmaus should render selected name label, got ${JSON.stringify(selected)}.`
    );
  }
  if (selected.emmausCandidateCount < 2) {
    throw new Error(
      `Candidate visibility check: selected Emmaus should render candidate dots, got ${JSON.stringify(selected)}.`
    );
  }

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  const afterSelectingJerusalem = await inspectPlace();
  if (afterSelectingJerusalem.emmausCandidateCount > 0) {
    throw new Error(
      `Candidate visibility check: Emmaus dots should clear after selecting Jerusalem, got ${JSON.stringify(afterSelectingJerusalem)}.`
    );
  }

  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await waitForMapToSettle(page);
  await waitForMapStyleLoaded(page);
  const mapCanvas = page.locator("canvas").first();
  const mapCanvasBox = await mapCanvas.boundingBox();
  if (!mapCanvasBox) {
    throw new Error("Candidate visibility check: map canvas bounds unavailable for drag probe.");
  }
  await page.mouse.move(mapCanvasBox.x + mapCanvasBox.width * 0.5, mapCanvasBox.y + mapCanvasBox.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(
    mapCanvasBox.x + mapCanvasBox.width * 0.62,
    mapCanvasBox.y + mapCanvasBox.height * 0.43,
    { steps: 12 }
  );
  await page.mouse.up();
  await waitForMapToSettle(page);

  const afterDrag = await inspectPlace();
  if (afterDrag.emmausCandidateCount < 2) {
    throw new Error(
      `Candidate visibility check: selected Emmaus dots should remain after drag, got ${JSON.stringify(afterDrag)}.`
    );
  }

  return {
    unselected,
    selected,
    afterSelectingJerusalem,
    afterDrag
  };
}

function buildProvinceFixturePlaces(basePlaces) {
  const fixturePlaces = [...basePlaces];
  fixturePlaces.push(
    {
      id: "fixture-roman-empire-overview",
      names: { ancient: ["Roman Empire"], alternate: [] },
      type: "empire",
      zoomTier: "region",
      parentId: null,
      candidates: [
        {
          label: "Roman Empire fixture",
          coordinates: [16.2, 40.8],
          confidence: "high"
        }
      ]
    },
    {
      id: "fixture-syria-province-overview",
      names: { ancient: ["Syria"], alternate: [] },
      type: "province",
      zoomTier: "region",
      parentId: "fixture-roman-empire-overview",
      candidates: [
        {
          label: "Syria fixture",
          coordinates: [39.3, 36.8],
          confidence: "high"
        }
      ]
    },
    {
      id: "fixture-judea-province-overview",
      names: { ancient: ["Judea"], alternate: [] },
      type: "province",
      zoomTier: "region",
      parentId: "fixture-roman-empire-overview",
      candidates: [
        {
          label: "Judea fixture",
          coordinates: [33.8, 31.2],
          confidence: "high"
        }
      ]
    }
  );
  return fixturePlaces;
}

async function verifyAreaLabelsOverviewWithProvinceFixture(browser, baseUrl, basePlaces) {
  const fixturePlaces = buildProvinceFixturePlaces(basePlaces);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  await page.addInitScript((payload) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const resolvedUrl = new URL(requestUrl, window.location.href);
      if (resolvedUrl.pathname === "/generated/places.index.json") {
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
          }
        });
      }

      return originalFetch(input, init);
    };
  }, fixturePlaces);

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await waitForMapStyleLoaded(page);
    await setMapView(page, { center: [22.5, 35], zoom: 4.7 });

    const labels = await collectRenderedTextValues(page, mapLayerIds.areaLabels, "placeName");
    for (const expectedLabel of ["Syria", "Roman Empire"]) {
      if (!labels.includes(expectedLabel)) {
        throw new Error(
          `Overview area-label fixture missing '${expectedLabel}'. Rendered: ${JSON.stringify(labels)}`
        );
      }
    }

    return {
      labelCount: labels.length,
      labels
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function captureGalileeCollisionBoxes(browser, baseUrl, screenshotPath) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
    });

    await page.evaluate((testHookKey) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      map.showCollisionBoxes = true;
      map.triggerRepaint();
    }, mapTestHookKey);
    await page.waitForTimeout(600);
    await page.screenshot({ fullPage: true, path: screenshotPath });
  } finally {
    await page.close();
  }
}

async function disablePageNetworkCache(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.setCacheDisabled", { cacheDisabled: true });
  return session;
}

async function verifyFallbackOutageMode({
  browser,
  baseUrl,
  mode,
  screenshotPath,
  pathWithQuery = "/"
}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const networkSession = await disablePageNetworkCache(page);
  const requestUrls = [];
  const failedRequestUrls = [];
  const abortMode = mode;

  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (!requestUrl.includes("tiles.openfreemap.org")) {
      return route.fallback();
    }

    if (abortMode === "all-requests") {
      return route.abort("failed");
    }

    if (abortMode === "pbf-only" && requestUrl.includes(".pbf")) {
      return route.abort("failed");
    }

    return route.fallback();
  });

  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });
  page.on("requestfailed", (request) => {
    failedRequestUrls.push(request.url());
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForSelector("canvas.maplibregl-canvas", { timeout: 30_000 });
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
    });
    await waitForMapToSettle(page);

    if (abortMode === "pbf-only") {
      await page.evaluate((testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }

        map.jumpTo({
          center: [35.3, 33],
          zoom: 8
        });
      }, mapTestHookKey);
    }

    try {
      await page.getByText(fallbackStatusMessage, { exact: true }).waitFor({ timeout: 40_000 });
    } catch (error) {
      const attributionText = await readAttributionText(page);
      const openFreeMapFinished = requestUrls.filter((url) => url.includes("tiles.openfreemap.org"));
      const openFreeMapFailed = failedRequestUrls.filter((url) => url.includes("tiles.openfreemap.org"));
      throw new Error(
        `Fallback outage ${mode} at '${pathWithQuery}': fallback notice did not appear. attribution='${attributionText}'. openfreemap finished=${openFreeMapFinished.length}, failed=${openFreeMapFailed.length}, finished sample=${JSON.stringify(openFreeMapFinished.slice(0, 5))}, failed sample=${JSON.stringify(openFreeMapFailed.slice(0, 5))}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }

    const versaTilesLoadedDeadline = Date.now() + 10_000;
    while (Date.now() < versaTilesLoadedDeadline) {
      const versaTilesRequestsFinished = requestUrls.some((url) =>
        url.includes("tiles.versatiles.org")
      );
      if (versaTilesRequestsFinished) {
        break;
      }
      await page.waitForTimeout(250);
    }

    const attributionText = await readAttributionText(page);
    assertFallbackAttributionText(attributionText, `Fallback outage ${mode} ${pathWithQuery}`);

    const versaTilesRequests = requestUrls.filter((url) => url.includes("tiles.versatiles.org"));
    if (versaTilesRequests.length === 0) {
      throw new Error(`Fallback outage ${mode}: no VersaTiles tile requests were observed.`);
    }

    await page.screenshot({ fullPage: true, path: screenshotPath });

    return {
      mode,
      pathWithQuery,
      versaTilesRequestCount: versaTilesRequests.length,
      attributionText
    };
  } finally {
    await networkSession.detach().catch(() => {});
    await page.unroute("**/*");
    await page.close();
    await context.close();
  }
}

async function captureFallbackSelectionScreenshot({
  browser,
  baseUrl,
  pathWithQuery,
  screenshotPath,
  panelHeading
}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const networkSession = await disablePageNetworkCache(page);
  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("tiles.openfreemap.org")) {
      route.abort("failed");
      return;
    }
    route.fallback();
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000
    });
    await page.waitForSelector("canvas.maplibregl-canvas", { timeout: 30_000 });
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
    });
    await page.getByText(fallbackStatusMessage, { exact: true }).waitFor({ timeout: 40_000 });
    await waitForMapStyleLoaded(page);

    if (panelHeading) {
      await page.waitForSelector("section[aria-label='Place details'] h1", { timeout: 30_000 });
      const heading = await page.$eval(
        "section[aria-label='Place details'] h1",
        (element) => element.textContent?.trim() ?? ""
      );
      if (heading !== panelHeading) {
        throw new Error(
          `Fallback screenshot expected panel heading '${panelHeading}', got '${heading}'.`
        );
      }
    }

    const attributionText = await readAttributionText(page);
    assertFallbackAttributionText(attributionText, `Fallback screenshot ${pathWithQuery}`);

    await page.screenshot({ fullPage: true, path: screenshotPath });
  } finally {
    await networkSession.detach().catch(() => {});
    await page.unroute("**/*");
    await page.close();
    await context.close();
  }
}

function buildSyntheticPlaces(basePlaces, syntheticCount = 10_000) {
  const places = [...basePlaces];
  const columns = 100;
  const rows = Math.ceil(syntheticCount / columns);
  const minLongitude = 6;
  const maxLongitude = 40;
  const minLatitude = 26;
  const maxLatitude = 44;

  for (let index = 0; index < syntheticCount; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const rowRatio = rows <= 1 ? 0 : row / (rows - 1);
    const columnRatio = columns <= 1 ? 0 : column / (columns - 1);
    const longitude = minLongitude + columnRatio * (maxLongitude - minLongitude);
    const latitude = minLatitude + rowRatio * (maxLatitude - minLatitude);

    places.push({
      id: `${syntheticPlaceIdPrefix}${index}`,
      names: {
        ancient: [`Synthetic City ${index}`],
        alternate: []
      },
      type: "city",
      zoomTier: "city",
      parentId: null,
      candidates: [
        {
          label: `Synthetic City ${index}`,
          coordinates: [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))],
          confidence: "low"
        }
      ]
    });
  }

  return places;
}

async function setMapView(page, { center, zoom }) {
  await page.evaluate(
    ({ centerCoordinates, targetZoom, testHookKey }) =>
      new Promise((resolve, reject) => {
        const map = window[testHookKey];
        if (!map) {
          reject(new Error("Map test hook is unavailable."));
          return;
        }

        const currentCenter = map.getCenter();
        const centerIsCurrent =
          Math.abs(currentCenter.lng - centerCoordinates[0]) < 0.0001 &&
          Math.abs(currentCenter.lat - centerCoordinates[1]) < 0.0001;
        const zoomIsCurrent = Math.abs(map.getZoom() - targetZoom) < 0.0001;

        if (centerIsCurrent && zoomIsCurrent) {
          resolve();
          return;
        }

        const handleIdle = () => {
          map.off("idle", handleIdle);
          resolve();
        };

        map.on("idle", handleIdle);
        map.jumpTo({
          center: centerCoordinates,
          zoom: targetZoom
        });
      }),
    { centerCoordinates: center, targetZoom: zoom, testHookKey: mapTestHookKey }
  );
  await waitForMapToSettle(page);
}

async function collectRenderedCoverage(page) {
  return page.evaluate(
    ({
      clustersLayerId,
      cityPinsLayerId,
      pinLabelsLayerId,
      clusterSourceId,
      syntheticPrefix,
      testHookKey
    }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const uniqueEntries = (features, keyBuilder) => {
        const seen = new Set();
        const result = [];
        for (const feature of features) {
          const key = keyBuilder(feature);
          if (!seen.has(key)) {
            seen.add(key);
            result.push(feature);
          }
        }

        return result;
      };

      const clustersRaw = map.queryRenderedFeatures(undefined, {
        layers: [clustersLayerId]
      });
      const cityPinsRaw = map.queryRenderedFeatures(undefined, {
        layers: [cityPinsLayerId]
      });
      const labelsRaw = map.queryRenderedFeatures(undefined, {
        layers: [pinLabelsLayerId]
      });

      const clusters = uniqueEntries(
        clustersRaw,
        (feature) =>
          `cluster:${feature.properties?.cluster_id ?? "unknown"}:${feature.geometry?.coordinates?.join(",") ?? ""}`
      );
      const cityPins = uniqueEntries(
        cityPinsRaw,
        (feature) => `city:${feature.properties?.entryId ?? feature.id ?? Math.random()}`
      );
      const labels = uniqueEntries(
        labelsRaw,
        (feature) => `label:${feature.properties?.entryId ?? feature.id ?? Math.random()}`
      );

      const renderedSyntheticPinCount = cityPins.filter((feature) =>
        String(feature.properties?.placeId ?? "").startsWith(syntheticPrefix)
      ).length;
      const syntheticLabelCount = labels.filter((feature) =>
        String(feature.properties?.placeId ?? "").startsWith(syntheticPrefix)
      ).length;
      const clusterPointTotal = clusters.reduce(
        (sum, feature) => sum + Number(feature.properties?.point_count ?? 0),
        0
      );
      const maxClusterPointCount = clusters.reduce(
        (maximum, feature) => Math.max(maximum, Number(feature.properties?.point_count ?? 0)),
        0
      );
      const sourceFeaturesRaw = map.querySourceFeatures(clusterSourceId);
      const sourceFeatures = uniqueEntries(sourceFeaturesRaw, (feature) => {
        if (feature.properties?.cluster) {
          return `source-cluster:${feature.properties?.cluster_id ?? "unknown"}:${feature.geometry?.coordinates?.join(",") ?? ""}`;
        }

        return `source-pin:${feature.properties?.entryId ?? feature.id ?? Math.random()}`;
      });
      const syntheticSourcePinCount = sourceFeatures.filter((feature) =>
        String(feature.properties?.placeId ?? "").startsWith(syntheticPrefix)
      ).length;
      const syntheticSourceClusterPointCount = sourceFeatures.reduce((sum, feature) => {
        if (!feature.properties?.cluster) {
          return sum;
        }

        return sum + Number(feature.properties?.point_count ?? 0);
      }, 0);
      const syntheticSourcePointCount = syntheticSourceClusterPointCount + syntheticSourcePinCount;
      const syntheticPinCount = Math.max(renderedSyntheticPinCount, syntheticSourcePinCount);

      const syntheticVisibleEstimate = Math.max(
        clusterPointTotal + renderedSyntheticPinCount,
        syntheticSourcePointCount
      );
      const syntheticPlaceListEntries = document.querySelectorAll(
        `button[data-place-entry-id^='place:${syntheticPrefix}']`
      ).length;
      const clusterPlaceListEntries = document.querySelectorAll(
        "button[data-place-entry-id^='cluster:']"
      ).length;
      const statusMessages = Array.from(document.querySelectorAll("[role='status']")).map(
        (element) => element.textContent?.trim() ?? ""
      );

      return {
        zoom: map.getZoom(),
        styleLoaded: map.isStyleLoaded(),
        clusterFeatureCount: clusters.length,
        clusterPointTotal,
        maxClusterPointCount,
        syntheticPinCount,
        syntheticLabelCount,
        renderedSyntheticPinCount,
        syntheticSourcePinCount,
        syntheticSourcePointCount,
        syntheticVisibleEstimate,
        syntheticPlaceListEntries,
        clusterPlaceListEntries,
        statusMessages
      };
    },
    {
      clustersLayerId: smoothnessLayerIds.clusters,
      cityPinsLayerId: smoothnessLayerIds.cityPins,
      pinLabelsLayerId: smoothnessLayerIds.pinLabels,
      clusterSourceId: smoothnessLayerIds.clusterSource,
      syntheticPrefix: syntheticPlaceIdPrefix,
      testHookKey: mapTestHookKey
    }
  );
}

function assertSyntheticCoverage(scenarioLabel, coverage, expectation) {
  if (!expectation) {
    return;
  }

  if (
    typeof expectation.minimumVisibleEstimate === "number" &&
    coverage.syntheticVisibleEstimate < expectation.minimumVisibleEstimate
  ) {
    throw new Error(
      `${scenarioLabel}: expected syntheticVisibleEstimate >= ${expectation.minimumVisibleEstimate}, got ${coverage.syntheticVisibleEstimate} (coverage=${JSON.stringify(coverage)})`
    );
  }

  if (
    typeof expectation.minimumSyntheticPins === "number" &&
    coverage.syntheticPinCount < expectation.minimumSyntheticPins
  ) {
    throw new Error(
      `${scenarioLabel}: expected syntheticPinCount >= ${expectation.minimumSyntheticPins}, got ${coverage.syntheticPinCount}`
    );
  }

  if (
    typeof expectation.minimumSyntheticLabels === "number" &&
    coverage.syntheticLabelCount < expectation.minimumSyntheticLabels
  ) {
    throw new Error(
      `${scenarioLabel}: expected syntheticLabelCount >= ${expectation.minimumSyntheticLabels}, got ${coverage.syntheticLabelCount}`
    );
  }

  if (
    typeof expectation.minimumClusterFeatures === "number" &&
    coverage.clusterFeatureCount < expectation.minimumClusterFeatures
  ) {
    throw new Error(
      `${scenarioLabel}: expected clusterFeatureCount >= ${expectation.minimumClusterFeatures}, got ${coverage.clusterFeatureCount}`
    );
  }

  if (
    typeof expectation.maximumClusterFeatures === "number" &&
    coverage.clusterFeatureCount > expectation.maximumClusterFeatures
  ) {
    throw new Error(
      `${scenarioLabel}: expected clusterFeatureCount <= ${expectation.maximumClusterFeatures}, got ${coverage.clusterFeatureCount}`
    );
  }
}

function percentile(sortedValues, fraction) {
  if (sortedValues.length === 0) {
    return null;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(fraction * (sortedValues.length - 1)))
  );
  return sortedValues[index];
}

function summarizeFrameTimes(frameTimes) {
  if (frameTimes.length === 0) {
    return {
      count: 0,
      p50Ms: null,
      p90Ms: null,
      p95Ms: null,
      p99Ms: null,
      maxMs: null
    };
  }

  const sorted = [...frameTimes].sort((left, right) => left - right);
  return {
    count: sorted.length,
    p50Ms: percentile(sorted, 0.5),
    p90Ms: percentile(sorted, 0.9),
    p95Ms: percentile(sorted, 0.95),
    p99Ms: percentile(sorted, 0.99),
    maxMs: sorted[sorted.length - 1]
  };
}

async function installGestureMonitor(page) {
  await page.evaluate(() => {
    const root =
      document.querySelector("[data-expo-root]") ??
      document.querySelector("#root") ??
      document.body;

    const state = {
      active: false,
      activeStartedAt: 0,
      mutationCount: 0,
      firstMutationSample: null,
      longTasks: [],
      longTaskSamples: [],
      frameTimes: [],
      lastFrameTimestamp: 0,
      animationFrameId: null
    };

    const supportedLongTaskObserver =
      typeof PerformanceObserver !== "undefined" &&
      Array.isArray(PerformanceObserver.supportedEntryTypes) &&
      PerformanceObserver.supportedEntryTypes.includes("longtask");

    let longTaskObserver = null;
    if (supportedLongTaskObserver) {
      longTaskObserver = new PerformanceObserver((list) => {
        if (!state.active) {
          return;
        }

        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.startTime < state.activeStartedAt) {
            continue;
          }
          state.longTasks.push(entry.duration);
          if (state.longTaskSamples.length < 6) {
            state.longTaskSamples.push({
              duration: entry.duration,
              offsetMs: entry.startTime - state.activeStartedAt
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    }

    const mutationObserver = new MutationObserver((mutations) => {
      if (!state.active) {
        return;
      }

      for (const mutation of mutations) {
        const target = mutation.target;
        if (target instanceof Element && target.closest(".maplibregl-ctrl")) {
          continue;
        }

        state.mutationCount += 1;
        if (!state.firstMutationSample) {
          const tagName = target instanceof Element ? target.tagName.toLowerCase() : "node";
          state.firstMutationSample = `${mutation.type}:${tagName}:${mutation.attributeName ?? ""}`;
        }
      }
    });

    mutationObserver.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });

    const collectFrame = (timestamp) => {
      if (state.active) {
        if (state.lastFrameTimestamp > 0) {
          state.frameTimes.push(timestamp - state.lastFrameTimestamp);
        }
        state.lastFrameTimestamp = timestamp;
      }

      state.animationFrameId = window.requestAnimationFrame(collectFrame);
    };

    state.animationFrameId = window.requestAnimationFrame(collectFrame);

    window.__ibmGestureMonitor = {
      start() {
        state.active = true;
        state.activeStartedAt = performance.now();
        state.mutationCount = 0;
        state.firstMutationSample = null;
        state.longTasks = [];
        state.longTaskSamples = [];
        state.frameTimes = [];
        state.lastFrameTimestamp = 0;
      },
      stop() {
        state.active = false;
        return {
          mutationCount: state.mutationCount,
          firstMutationSample: state.firstMutationSample,
          longTasks: [...state.longTasks],
          longTaskSamples: [...state.longTaskSamples],
          frameTimes: [...state.frameTimes],
          supportsLongTaskObserver: supportedLongTaskObserver
        };
      },
      dispose() {
        if (state.animationFrameId !== null) {
          window.cancelAnimationFrame(state.animationFrameId);
        }
        mutationObserver.disconnect();
        longTaskObserver?.disconnect();
      }
    };
  });
}

async function runGestureSequence(page) {
  const canvas = page.locator("canvas.maplibregl-canvas");
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error("Map canvas is not visible for gesture test.");
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const dragStartX = centerX + 8;
  const dragStartY = centerY + 2;
  const dragEndX = centerX - 8;
  const dragEndY = centerY - 3;
  const dragDurationMs = 2_000;
  const dragSteps = 120;

  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(
    dragStartX + (dragEndX - dragStartX) * (1 / dragSteps),
    dragStartY + (dragEndY - dragStartY) * (1 / dragSteps)
  );
  await page.waitForTimeout(Math.floor(dragDurationMs / dragSteps));

  await page.evaluate(() => window.__ibmGestureMonitor.start());
  for (let index = 2; index <= dragSteps; index += 1) {
    const ratio = index / dragSteps;
    await page.mouse.move(
      dragStartX + (dragEndX - dragStartX) * ratio,
      dragStartY + (dragEndY - dragStartY) * ratio
    );
    await page.waitForTimeout(Math.floor(dragDurationMs / dragSteps));
  }
  await page.mouse.up();

  await page.mouse.move(centerX, centerY);
  for (let index = 0; index < 1; index += 1) {
    await page.mouse.wheel(0, -60);
    await page.waitForTimeout(120);
  }
  for (let index = 0; index < 1; index += 1) {
    await page.mouse.wheel(0, 60);
  }

  const result = await page.evaluate(() => window.__ibmGestureMonitor.stop());
  await page.evaluate(() => window.__ibmGestureMonitor.dispose());

  return result;
}

// Software WebGL (SwiftShader on GPU-less CI runners, llvmpipe, Microsoft Basic Render Driver)
// draws every frame on the CPU, so long tasks there measure the machine, not the app.
const softwareRendererPattern = /swiftshader|llvmpipe|softpipe|basic render driver|software/i;

async function detectWebGlRenderer(page) {
  return page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      return "unavailable";
    }
    try {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      return String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    } finally {
      const loseContext = gl.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    }
  });
}

function assertSmoothnessResult(label, result) {
  const spanOnlyMutationBurst =
    result.mutationCount > 0 &&
    result.mutationCount <= 50 &&
    typeof result.firstMutationSample === "string" &&
    result.firstMutationSample.startsWith("childList:span:");
  if (spanOnlyMutationBurst) {
    console.warn(
      `${label}: tolerated ${result.mutationCount} span childList mutation(s) during gestures (${result.firstMutationSample}).`
    );
  }

  if (result.mutationCount > 0 && !spanOnlyMutationBurst) {
    throw new Error(
      `${label}: observed ${result.mutationCount} DOM mutations during gestures (${result.firstMutationSample ?? "unknown"}).`
    );
  }

  const longTasksOverLimit = result.longTasks.filter((duration) => duration > smoothnessLongTaskLimitMs);
  const softwareRenderer = softwareRendererPattern.test(result.renderer ?? "");
  if (softwareRenderer && process.env.SMOOTHNESS_REQUIRE_GPU !== "1") {
    if (longTasksOverLimit.length > 0) {
      console.warn(
        `${label}: ${longTasksOverLimit.length} long task(s) over ${smoothnessLongTaskLimitMs} ms reported but not enforced, because WebGL runs in software here (${result.renderer}). Run on a GPU machine, or set SMOOTHNESS_REQUIRE_GPU=1 to enforce.`
      );
    }
    return;
  }

  if (longTasksOverLimit.length > 0) {
    throw new Error(
      `${label}: observed long tasks over ${smoothnessLongTaskLimitMs} ms: ${longTasksOverLimit
        .map((value) => value.toFixed(2))
        .join(", ")} samples=${JSON.stringify(result.longTaskSamples)}`
    );
  }
}

function assertSmoothnessScenarios(label, smoothnessRun) {
  for (const [scenarioId, scenarioResult] of Object.entries(smoothnessRun.scenarios)) {
    assertSmoothnessResult(`${label} (${scenarioId})`, scenarioResult);
  }
}

async function runSmoothnessCheck({
  browser,
  baseUrl,
  requestUrls,
  pageErrors,
  consoleErrors,
  workerUrls,
  workerConsoleEvents,
  workerErrors,
  syntheticPlacesPayload = null,
  syntheticCoverageExpectations = null,
  zoom8Center = [35.5, 33]
}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  let syntheticFetchInterceptCount = 0;

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });
  page.on("worker", (worker) => {
    workerUrls.push(worker.url());
    worker.on("console", (message) => {
      const entry = {
        type: message.type(),
        text: message.text(),
        url: worker.url()
      };
      workerConsoleEvents.push(entry);
      if (message.type() === "error") {
        workerErrors.push(entry);
      }
    });
  });

  if (syntheticPlacesPayload) {
    await page.addInitScript((payload) => {
      const originalFetch = window.fetch.bind(window);
      let interceptionCount = 0;

      Object.defineProperty(window, "__ibmSyntheticFetchInterceptCount", {
        configurable: true,
        get() {
          return interceptionCount;
        }
      });

      window.fetch = async (input, init) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);
        const resolvedUrl = new URL(requestUrl, window.location.href);
        if (resolvedUrl.pathname === "/generated/places.index.json") {
          interceptionCount += 1;
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store"
            }
          });
        }

        return originalFetch(input, init);
      };
    }, syntheticPlacesPayload);
  }

  try {
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
    });
    await page.waitForFunction((testHookKey) => {
      const map = window[testHookKey];
      return Boolean(map && map.isStyleLoaded());
    }, mapTestHookKey, { timeout: 40_000 });

    if (syntheticPlacesPayload) {
      syntheticFetchInterceptCount = await page.evaluate(
        () => Number(window.__ibmSyntheticFetchInterceptCount ?? 0)
      );
      if (syntheticFetchInterceptCount === 0) {
        throw new Error(
          "Synthetic smoothness check did not intercept generated/places.index.json."
        );
      }
    }

    const scenarios = [
      {
        id: "overview-clustered",
        center: [22.5, 35],
        zoom: 4.7,
        expectation: syntheticCoverageExpectations?.["overview-clustered"] ?? null
      },
      {
        id: "zoom8-unclustered",
        center: zoom8Center,
        zoom: 8,
        expectation: syntheticCoverageExpectations?.["zoom8-unclustered"] ?? null
      }
    ];

    const scenarioResults = {};
    const renderer = await detectWebGlRenderer(page);
    for (const scenario of scenarios) {
      await setMapView(page, {
        center: scenario.center,
        zoom: scenario.zoom
      });
      await page.waitForFunction((testHookKey) => {
        const map = window[testHookKey];
        return Boolean(map && map.isStyleLoaded());
      }, mapTestHookKey, { timeout: 40_000 });

      const coverage = await collectRenderedCoverage(page);
      assertSyntheticCoverage(`Synthetic coverage ${scenario.id}`, coverage, scenario.expectation);
      await page.evaluate((refreshHookKey) => {
        const refreshVisibleEntries = window[refreshHookKey];
        if (typeof refreshVisibleEntries === "function") {
          refreshVisibleEntries();
        }
      }, visibleEntryRefreshHookKey);

      await page.waitForFunction(
        () => {
          const now = performance.now();
          const entryCount = document.querySelectorAll("button[data-place-entry-id]").length;
          const key = "__ibmVisibleEntryStability";
          const previous = window[key] ?? {
            count: -1,
            stableSinceMs: now
          };
          const next =
            previous.count === entryCount
              ? previous
              : {
                  count: entryCount,
                  stableSinceMs: now
                };
          window[key] = next;
          return now - Number(next.stableSinceMs ?? now) >= 1_200;
        },
        { timeout: 15_000 }
      );
      await waitForMapToSettle(page);

      await installGestureMonitor(page);
      const gestureResult = await runGestureSequence(page);

      scenarioResults[scenario.id] = {
        ...gestureResult,
        frameSummary: summarizeFrameTimes(gestureResult.frameTimes),
        coverage,
        renderer
      };
    }

    return {
      scenarios: scenarioResults,
      syntheticDataInterceptionCount: syntheticFetchInterceptCount
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function runPanelOpenSmoothnessCheck({
  browser,
  baseUrl,
  requestUrls,
  pageErrors,
  consoleErrors,
  workerUrls,
  workerConsoleEvents,
  workerErrors
}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });
  page.on("worker", (worker) => {
    workerUrls.push(worker.url());
    worker.on("console", (message) => {
      const entry = {
        type: message.type(),
        text: message.text(),
        url: worker.url()
      };
      workerConsoleEvents.push(entry);
      if (message.type() === "error") {
        workerErrors.push(entry);
      }
    });
  });

  try {
    await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapToSettle(page);
    await page.waitForSelector("section[aria-label='Place details']", {
      state: "visible",
      timeout: 30_000
    });
    await page.waitForFunction((testHookKey) => {
      const map = window[testHookKey];
      return Boolean(map && map.isStyleLoaded());
    }, mapTestHookKey, { timeout: 40_000 });

    await installGestureMonitor(page);
    const gestureResult = await runGestureSequence(page);
    const renderer = await detectWebGlRenderer(page);
    return {
      ...gestureResult,
      frameSummary: summarizeFrameTimes(gestureResult.frameTimes),
      renderer
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyOpeningCameraBaseline(browser, baseUrl) {
  const targetViewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 }
  ];
  const results = [];

  for (const viewport of targetViewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);

      const openingCamera = await page.evaluate((testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }
        const center = map.getCenter();
        return {
          zoom: map.getZoom(),
          center: [center.lng, center.lat]
        };
      }, mapTestHookKey);

      const zoomDelta = Math.abs(openingCamera.zoom - 4.7);
      const centerLngDelta = Math.abs(openingCamera.center[0] - 22.5);
      const centerLatDelta = Math.abs(openingCamera.center[1] - 35);
      if (zoomDelta > 0.1 || centerLngDelta > 0.1 || centerLatDelta > 0.1) {
        throw new Error(
          `Opening camera drifted at ${viewport.width}x${viewport.height}: ${JSON.stringify(openingCamera)}`
        );
      }

      results.push({
        viewport,
        openingCamera: {
          zoom: Number(openingCamera.zoom.toFixed(4)),
          center: [
            Number(openingCamera.center[0].toFixed(6)),
            Number(openingCamera.center[1].toFixed(6))
          ]
        }
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyPhoneBasics(browser, baseUrl) {
  const requiredOpeningPlaces = [
    { id: "rome", label: "Rome" },
    { id: "athens", label: "Athens" },
    { id: "ephesus", label: "Ephesus" },
    { id: "antioch-syria", label: "Antioch" },
    { id: "damascus", label: "Damascus" },
    { id: "jerusalem", label: "Jerusalem" }
  ];
  const viewports = [
    { width: 390, height: 844 },
    { width: 360, height: 800 }
  ];
  const results = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
        timeout: 30_000
      });

      const openingOverviewSnapshot = await page.evaluate(
        ({
          testHookKey,
          pinLabelLayerIds,
          majorPinLayerId,
          majorClusterLayerId,
          clusterSourceId,
          requiredPlaceIds
        }) => {
          const map = window[testHookKey];
          if (!map) {
            throw new Error("Map test hook is unavailable.");
          }

          const labels = Array.from(
            new Set(
              map
                .queryRenderedFeatures(undefined, { layers: pinLabelLayerIds })
                .map((feature) =>
                  String(
                    feature.properties?.clusterLabelText ??
                      feature.properties?.labelText ??
                      feature.properties?.placeName ??
                      ""
                  ).trim()
                )
                .filter((value) => value.length > 0)
            )
          );

          const mapCenter = map.getCenter();
          const visibleMajorPinPlaceIds = Array.from(
            new Set(
              map
                .queryRenderedFeatures(undefined, { layers: [majorPinLayerId] })
                .map((feature) => String(feature.properties?.placeId ?? "").trim())
                .filter((placeId) => placeId.length > 0)
            )
          ).sort();
          const source = map.getSource(clusterSourceId);
          if (!source) {
            throw new Error(`Cluster source '${clusterSourceId}' is unavailable.`);
          }
          const sourceData = source._data;
          const features = Array.isArray(sourceData?.geojson?.features)
            ? sourceData.geojson.features
            : [];
          const placeCoordinatesById = {};
          for (const feature of features) {
            const placeId = String(feature?.properties?.placeId ?? "").trim();
            const coordinates = feature?.geometry?.coordinates;
            if (
              !placeId ||
              !Array.isArray(coordinates) ||
              coordinates.length < 2 ||
              typeof coordinates[0] !== "number" ||
              typeof coordinates[1] !== "number"
            ) {
              continue;
            }
            placeCoordinatesById[placeId] = [coordinates[0], coordinates[1]];
          }

          // A group's drawn name ("Jerusalem +4") covers all its members.
          const drawnGroupMemberIds = new Set(
            map
              .queryRenderedFeatures(undefined, { layers: pinLabelLayerIds })
              .flatMap((feature) => String(feature.properties?.memberPlaceIds ?? "").split(","))
              .filter((placeId) => placeId.length > 0)
          );

          const mapBounds = map.getCanvas().getBoundingClientRect();
          const isInMapViewport = (point) =>
            point.x >= 0 && point.y >= 0 && point.x <= mapBounds.width && point.y <= mapBounds.height;
          const requiredCoverage = {};
          for (const placeId of requiredPlaceIds) {
            if (visibleMajorPinPlaceIds.includes(placeId)) {
              requiredCoverage[placeId] = { kind: "pin" };
              continue;
            }
            const coordinates = placeCoordinatesById[placeId];
            if (!Array.isArray(coordinates)) {
              requiredCoverage[placeId] = null;
              continue;
            }
            const projected = map.project([coordinates[0], coordinates[1]]);
            if (!isInMapViewport(projected)) {
              requiredCoverage[placeId] = null;
              continue;
            }
            requiredCoverage[placeId] = drawnGroupMemberIds.has(placeId) ? { kind: "cluster" } : null;
          }

          return {
            labels,
            zoom: Number(map.getZoom().toFixed(4)),
            center: [Number(mapCenter.lng.toFixed(6)), Number(mapCenter.lat.toFixed(6))],
            visibleMajorPinPlaceIds,
            requiredCoverage
          };
        },
        {
          testHookKey: mapTestHookKey,
          pinLabelLayerIds: mapLayerIds.pinLabels,
          majorPinLayerId: mapLayerIds.majorPins,
          majorClusterLayerId: mapLayerIds.majorClusterPins,
          clusterSourceId: "ibm-major-city-pins",
          requiredPlaceIds: requiredOpeningPlaces.map((place) => place.id)
        }
      );

      const coverage = openingOverviewSnapshot.requiredCoverage;

      const missingRequiredPlaces = requiredOpeningPlaces.filter((place) => !coverage[place.id]);
      if (missingRequiredPlaces.length > 0) {
        throw new Error(
          `Phone opening view ${viewport.width}x${viewport.height} is missing drawn coverage for ${JSON.stringify(
            missingRequiredPlaces.map((place) => place.label)
          )}. visibleMajorPinPlaceIds=${JSON.stringify(
            openingOverviewSnapshot.visibleMajorPinPlaceIds
          )} coverage=${JSON.stringify(openingOverviewSnapshot.requiredCoverage)}`
        );
      }

      const attributionSnapshot = await page.evaluate(() => {
        const compactAttribution = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
        const resetControl = document.querySelector("button[data-map-control='reset-view']");
        const scaleControl = document.querySelector("[data-map-scale='metric']");
        const toBounds = (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const { left, top, right, bottom } = element.getBoundingClientRect();
          return { left, top, right, bottom };
        };

        return {
          hasExpandedClass:
            compactAttribution instanceof HTMLElement
              ? compactAttribution.classList.contains("maplibregl-compact-show")
              : null,
          resetBounds: toBounds(resetControl),
          scaleBounds: toBounds(scaleControl),
          attributionBounds: toBounds(compactAttribution)
        };
      });

      if (attributionSnapshot.hasExpandedClass !== false) {
        throw new Error(
          `Phone attribution should stay compact at ${viewport.width}x${viewport.height}, got expanded=${String(
            attributionSnapshot.hasExpandedClass
          )}.`
        );
      }

      const searchLayoutSnapshot = await page.evaluate(() => {
        const searchShell = document.querySelector("[data-map-search-shell='true']");
        const menuButton = document.querySelector("button[aria-label='Open app menu']");
        const modernRadio = document.querySelector("button[role='radio'][data-map-mode='modern']");
        const toBounds = (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
          return { left, top, right, bottom, width, height };
        };

        return {
          viewportWidth: window.innerWidth,
          searchShellBounds: toBounds(searchShell),
          menuButtonBounds: toBounds(menuButton),
          modernRadioBounds: toBounds(modernRadio)
        };
      });

      if (!searchLayoutSnapshot.searchShellBounds) {
        throw new Error(`Phone search shell missing at ${viewport.width}x${viewport.height}.`);
      }
      if (Math.abs(searchLayoutSnapshot.searchShellBounds.left - 16) > 1.5) {
        throw new Error(
          `Phone search shell should keep 16px left margin at ${viewport.width}x${viewport.height}, got ${searchLayoutSnapshot.searchShellBounds.left.toFixed(2)}.`
        );
      }
      if (
        Math.abs(searchLayoutSnapshot.viewportWidth - searchLayoutSnapshot.searchShellBounds.right - 16) >
        1.5
      ) {
        throw new Error(
          `Phone search shell should keep 16px right margin at ${viewport.width}x${viewport.height}, got right edge ${searchLayoutSnapshot.searchShellBounds.right.toFixed(2)} for viewport ${searchLayoutSnapshot.viewportWidth}.`
        );
      }
      if (!searchLayoutSnapshot.modernRadioBounds) {
        throw new Error(`Phone map toggle is missing at ${viewport.width}x${viewport.height}.`);
      }
      if (searchLayoutSnapshot.modernRadioBounds.top < searchLayoutSnapshot.searchShellBounds.bottom - 1) {
        throw new Error(
          `Phone map toggle should sit below the search box at ${viewport.width}x${viewport.height}. searchBottom=${searchLayoutSnapshot.searchShellBounds.bottom.toFixed(2)} toggleTop=${searchLayoutSnapshot.modernRadioBounds.top.toFixed(2)}`
        );
      }
      if (Math.abs(searchLayoutSnapshot.viewportWidth - searchLayoutSnapshot.modernRadioBounds.right - 16) > 4) {
        throw new Error(
          `Phone map toggle should align to the right margin at ${viewport.width}x${viewport.height}. right=${searchLayoutSnapshot.modernRadioBounds.right.toFixed(2)} viewport=${searchLayoutSnapshot.viewportWidth}`
        );
      }

      await page.getByLabel("Search biblical places").fill("Antioch");
      const searchResults = page.locator("[data-testid='search-results-list']");
      await searchResults.waitFor({ state: "visible", timeout: 30_000 });

      const searchResultsBounds = await searchResults.boundingBox();
      if (!searchResultsBounds) {
        throw new Error(`Phone search results bounds missing at ${viewport.width}x${viewport.height}.`);
      }
      if (searchResultsBounds.left < 15 || searchResultsBounds.right > viewport.width - 15) {
        throw new Error(
          `Phone search results overflow viewport at ${viewport.width}x${viewport.height}: ${JSON.stringify(searchResultsBounds)}.`
        );
      }

      await page.getByRole("button", { name: "Open app menu" }).click();
      const menuDrawer = page.locator("[data-testid='app-menu-drawer']");
      await menuDrawer.waitFor({ state: "visible", timeout: 30_000 });
      const menuDrawerBounds = await menuDrawer.boundingBox();
      if (!menuDrawerBounds) {
        throw new Error(`Phone menu drawer bounds missing at ${viewport.width}x${viewport.height}.`);
      }
      if (menuDrawerBounds.left < 15 || menuDrawerBounds.right > viewport.width - 15) {
        throw new Error(
          `Phone menu drawer overflow at ${viewport.width}x${viewport.height}: ${JSON.stringify(menuDrawerBounds)}.`
        );
      }

      await page.getByRole("button", { name: "Close app menu" }).click();
      await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      await page.waitForSelector("section[aria-label='Place details']", {
        state: "visible",
        timeout: 45_000
      });

      const readSheetSnapshot = async () =>
        page.evaluate(
          ({ testHookKey, selectedLayerIds }) => {
            const panel = document.querySelector("section[aria-label='Place details']");
            const handle = panel?.querySelector("button[aria-label$='place details panel']");
            const closeButton = panel?.querySelector("button[aria-label='Close place panel']");
            const resetView = document.querySelector("button[data-map-control='reset-view']");
            const title = panel?.querySelector("h1");
            const photoFrame = panel?.querySelector("[data-panel-photo-frame='true']");
            const photoKindLabel = panel?.querySelector("[data-photo-kind-label='true']");
            const previousImageButton = panel?.querySelector("button[aria-label='Previous image']");
            const nextImageButton = panel?.querySelector("button[aria-label='Next image']");
            if (!(panel instanceof HTMLElement)) {
              throw new Error("Phone panel is not visible.");
            }

            const toBounds = (element) => {
              if (!(element instanceof HTMLElement)) {
                return null;
              }
              const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
              return { left, top, right, bottom, width, height };
            };

            const panelBounds = toBounds(panel);
            const handleBounds = toBounds(handle);
            const closeBounds = toBounds(closeButton);
            const resetBounds = toBounds(resetView);
            const titleBounds = toBounds(title);
            const photoFrameBounds = toBounds(photoFrame);
            const photoKindLabelBounds = toBounds(photoKindLabel);
            const previousImageButtonBounds = toBounds(previousImageButton);
            const nextImageButtonBounds = toBounds(nextImageButton);

            const map = window[testHookKey];
            if (!map) {
              throw new Error("Map test hook is unavailable.");
            }

            const selectedFeatures = map
              .queryRenderedFeatures(undefined, { layers: selectedLayerIds })
              .filter(
                (feature) =>
                  feature.properties?.isSelectedPlace === true ||
                  feature.properties?.isSelectedPlace === "true"
              );
            const selectedPoint = selectedFeatures.find((feature) => feature.geometry?.type === "Point");
            if (!selectedPoint) {
              throw new Error("Selected place's name is not drawn on the map.");
            }
            const [longitude, latitude] = selectedPoint.geometry.coordinates;
            const projected = map.project([longitude, latitude]);
            const centerBefore = map.getCenter();

            return {
              panelBounds,
              handleBounds,
              closeBounds,
              resetBounds,
              titleBounds,
              photoFrameBounds,
              photoKindLabelBounds,
              previousImageButtonBounds,
              nextImageButtonBounds,
              selectedPointPx: { x: projected.x, y: projected.y },
              mapCenter: [centerBefore.lng, centerBefore.lat]
            };
          },
          {
            testHookKey: mapTestHookKey,
            selectedLayerIds: [
              ...selectedPlaceLabelLayerIds,
              "ibm-pin-label-standard",
              "ibm-selected-area-label",
              mapLayerIds.candidatePins
            ]
          }
        );
      const verifyCompactAttributionToggle = async (sheetStateLabel) => {
        const selector = "summary.maplibregl-ctrl-attrib-button";
        const reachability = await page.evaluate((toggleSelector) => {
          const toggle = document.querySelector(toggleSelector);
          const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
          const resetControl = document.querySelector("button[data-map-control='reset-view']");
          const zoomInControl = document.querySelector("button[data-map-control='zoom-in']");
          const zoomOutControl = document.querySelector("button[data-map-control='zoom-out']");
          const scaleControl = document.querySelector("[data-map-scale='metric']");
          const toBounds = (element) => {
            if (!(element instanceof HTMLElement)) {
              return null;
            }
            const bounds = element.getBoundingClientRect();
            return {
              left: bounds.left,
              top: bounds.top,
              right: bounds.right,
              bottom: bounds.bottom,
              width: bounds.width,
              height: bounds.height
            };
          };
          if (!(toggle instanceof HTMLElement)) {
            return {
              toggleBounds: null,
              centerElementTag: null,
              centerMatchesToggle: false,
              isExpanded: null,
              resetBounds: null,
              zoomInBounds: null,
              zoomOutBounds: null,
              scaleBounds: null
            };
          }

          const bounds = toggle.getBoundingClientRect();
          const centerX = bounds.left + bounds.width / 2;
          const centerY = bounds.top + bounds.height / 2;
          const centerElement = document.elementFromPoint(centerX, centerY);
          return {
            toggleBounds: {
              left: bounds.left,
              top: bounds.top,
              right: bounds.right,
              bottom: bounds.bottom,
              width: bounds.width,
              height: bounds.height
            },
            centerElementTag: centerElement?.tagName?.toLowerCase() ?? null,
            centerMatchesToggle: centerElement === toggle,
            isExpanded:
              compactControl instanceof HTMLElement
                ? compactControl.classList.contains("maplibregl-compact-show")
                : null,
            resetBounds: toBounds(resetControl),
            zoomInBounds: toBounds(zoomInControl),
            zoomOutBounds: toBounds(zoomOutControl),
            scaleBounds: toBounds(scaleControl)
          };
        }, selector);

        if (!reachability.toggleBounds) {
          throw new Error(
            `Attribution toggle missing in ${sheetStateLabel} phone sheet state at ${viewport.width}x${viewport.height}.`
          );
        }
        if (!reachability.centerMatchesToggle) {
          throw new Error(
            `Attribution toggle is occluded in ${sheetStateLabel} phone sheet state at ${viewport.width}x${viewport.height}: centerElement=${reachability.centerElementTag}. bounds=${JSON.stringify(
              reachability.toggleBounds
            )}`
          );
        }
        for (const [controlLabel, controlBounds] of [
          ["reset", reachability.resetBounds],
          ["zoom-in", reachability.zoomInBounds],
          ["zoom-out", reachability.zoomOutBounds],
          ["scale", reachability.scaleBounds]
        ]) {
          if (!controlBounds) {
            continue;
          }
          if (boundsIntersect(reachability.toggleBounds, controlBounds)) {
            throw new Error(
              `Attribution toggle intersects ${controlLabel} control in ${sheetStateLabel} state at ${viewport.width}x${viewport.height}. toggle=${JSON.stringify(
                reachability.toggleBounds
              )} control=${JSON.stringify(controlBounds)}`
            );
          }
        }

        const waitForCompactExpandedState = async (expectedExpanded) => {
          await page.waitForFunction(
            (nextExpanded) => {
              const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
              if (!(compactControl instanceof HTMLElement)) {
                return false;
              }
              return compactControl.classList.contains("maplibregl-compact-show") === nextExpanded;
            },
            expectedExpanded,
            { timeout: 5_000 }
          );
        };
        const clickCompactToggle = async () => {
          try {
            await page.click(selector, { timeout: 3_000 });
            return;
          } catch {}
          const centerX = reachability.toggleBounds.left + reachability.toggleBounds.width / 2;
          const centerY = reachability.toggleBounds.top + reachability.toggleBounds.height / 2;
          await page.mouse.click(centerX, centerY);
        };

        await clickCompactToggle();
        await waitForCompactExpandedState(true);
        await page.evaluate(() => {
          const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
          if (compactControl instanceof HTMLElement) {
            compactControl.classList.remove("maplibregl-compact-show");
          }
        });
        await waitForCompactExpandedState(false);

        return reachability;
      };
      const readPhoneMapControlVisibility = async () =>
        page.evaluate(() => {
          const mapTypeGroup = document.querySelector("[role='radiogroup'][aria-label='Map type']");
          return {
            hasMapTypeToggle: mapTypeGroup instanceof HTMLElement
          };
        });
      const assertPhoneExpandedControlVisibility = async (stateLabel, shouldHide) => {
        const visibility = await readPhoneMapControlVisibility();
        if (shouldHide) {
          if (visibility.hasMapTypeToggle) {
            throw new Error(
              `Phone expanded sheet should hide map controls at ${viewport.width}x${viewport.height}. state=${stateLabel} visibility=${JSON.stringify(
                visibility
              )}`
            );
          }
          return;
        }
        if (!visibility.hasMapTypeToggle) {
          throw new Error(
            `Phone non-expanded sheet should show map controls at ${viewport.width}x${viewport.height}. state=${stateLabel} visibility=${JSON.stringify(
              visibility
            )}`
          );
        }
      };

      await page.getByRole("button", { name: "Close place panel" }).click();
      await page.waitForSelector("section[aria-label='Place details']", {
        state: "hidden",
        timeout: 30_000
      });
      const attributionClosedReachability = await verifyCompactAttributionToggle("closed");
      await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      await page.waitForSelector("section[aria-label='Place details']", {
        state: "visible",
        timeout: 45_000
      });

      const collapsedSheet = await readSheetSnapshot();
      if (!collapsedSheet.panelBounds || !collapsedSheet.handleBounds || !collapsedSheet.closeBounds) {
        throw new Error(`Phone panel controls missing at ${viewport.width}x${viewport.height}.`);
      }
      await assertPhoneExpandedControlVisibility("collapsed", false);

      const collapsedRatio = collapsedSheet.panelBounds.height / viewport.height;
      if (collapsedRatio < 0.33 || collapsedRatio > 0.5) {
        throw new Error(
          `Phone sheet should open near 40% height at ${viewport.width}x${viewport.height}, got ${(collapsedRatio * 100).toFixed(1)}%.`
        );
      }
      assertMinimumHitArea(
        collapsedSheet.handleBounds,
        "bottom-sheet handle",
        `phone ${viewport.width}x${viewport.height}`
      );
      assertMinimumHitArea(
        collapsedSheet.closeBounds,
        "bottom-sheet close button",
        `phone ${viewport.width}x${viewport.height}`
      );
      assertMinimumHitArea(
        collapsedSheet.resetBounds,
        "reset view button",
        `phone ${viewport.width}x${viewport.height}`
      );
      const handleCenterDelta = Math.abs(
        collapsedSheet.handleBounds.left +
          collapsedSheet.handleBounds.width / 2 -
          (collapsedSheet.panelBounds.left + collapsedSheet.panelBounds.width / 2)
      );
      if (handleCenterDelta > 2) {
        throw new Error(
          `Bottom-sheet handle should be centered at ${viewport.width}x${viewport.height}, delta=${handleCenterDelta.toFixed(2)}px.`
        );
      }
      if (
        !collapsedSheet.titleBounds ||
        collapsedSheet.titleBounds.top < collapsedSheet.panelBounds.top ||
        collapsedSheet.titleBounds.top >= collapsedSheet.panelBounds.bottom ||
        collapsedSheet.titleBounds.bottom > collapsedSheet.panelBounds.bottom + 1
      ) {
        throw new Error(
          `Collapsed sheet should show the title without scrolling at ${viewport.width}x${viewport.height}. panel=${JSON.stringify(
            collapsedSheet.panelBounds
          )} title=${JSON.stringify(collapsedSheet.titleBounds)}`
        );
      }
      if (!collapsedSheet.photoFrameBounds || collapsedSheet.photoFrameBounds.height < 120) {
        throw new Error(
          `Collapsed sheet photo should remain at least 120px tall at ${viewport.width}x${viewport.height}, got ${collapsedSheet.photoFrameBounds?.height ?? "missing"}.`
        );
      }
      if (
        boundsIntersect(collapsedSheet.photoKindLabelBounds, collapsedSheet.previousImageButtonBounds) ||
        boundsIntersect(collapsedSheet.photoKindLabelBounds, collapsedSheet.nextImageButtonBounds)
      ) {
        throw new Error(
          `Photo kind badge should not overlap carousel arrows at ${viewport.width}x${viewport.height}. badge=${JSON.stringify(
            collapsedSheet.photoKindLabelBounds
          )} prev=${JSON.stringify(collapsedSheet.previousImageButtonBounds)} next=${JSON.stringify(
            collapsedSheet.nextImageButtonBounds
          )}`
        );
      }

      const attributionCollapsedReachability = await verifyCompactAttributionToggle("collapsed");

      if (
        collapsedSheet.selectedPointPx &&
        collapsedSheet.selectedPointPx.y >= collapsedSheet.panelBounds.top - 8
      ) {
        throw new Error(
          `Selected place should stay above collapsed sheet at ${viewport.width}x${viewport.height}. panelTop=${collapsedSheet.panelBounds.top.toFixed(2)} pointY=${collapsedSheet.selectedPointPx.y.toFixed(2)}`
        );
      }

      const handleButton = page.locator("section[aria-label='Place details'] button[aria-label$='place details panel']");
      const cdpSession = await context.newCDPSession(page);
      const readHandleCenter = async () => {
        const handleBox = await handleButton.boundingBox();
        if (!handleBox) {
          throw new Error(`Phone handle bounds missing at ${viewport.width}x${viewport.height}.`);
        }
        return {
          x: handleBox.x + handleBox.width / 2,
          y: handleBox.y + handleBox.height / 2
        };
      };
      const dragHandleWithMouse = async (deltaY) => {
        const center = await readHandleCenter();
        await page.mouse.move(center.x, center.y);
        await page.mouse.down();
        await page.mouse.move(center.x, Math.max(20, center.y + deltaY), { steps: 10 });
        await page.mouse.up();
      };
      const dragHandleWithTouch = async (deltaY) => {
        const center = await readHandleCenter();
        const targetY = Math.max(20, center.y + deltaY);
        await cdpSession.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: Math.round(center.x), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 }]
        });
        for (let step = 1; step <= 10; step += 1) {
          const progress = step / 10;
          await cdpSession.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [
              {
                x: Math.round(center.x),
                y: Math.round(center.y + (targetY - center.y) * progress),
                radiusX: 1,
                radiusY: 1,
                force: 1,
                id: 1
              }
            ]
          });
        }
        await cdpSession.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: []
        });
      };

      const pointerTapCenter = await readHandleCenter();
      await page.mouse.click(pointerTapCenter.x, pointerTapCenter.y);
      await page.waitForTimeout(350);
      const expandedAfterPointerTap = await readSheetSnapshot();
      if (
        !expandedAfterPointerTap.panelBounds ||
        expandedAfterPointerTap.panelBounds.height <= collapsedSheet.panelBounds.height + 40
      ) {
        throw new Error(
          `Phone sheet pointer tap should expand panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("expanded-pointer-tap", true);
      const attributionExpandedReachability = await verifyCompactAttributionToggle("expanded");

      const pointerCollapseCenter = await readHandleCenter();
      await page.mouse.click(pointerCollapseCenter.x, pointerCollapseCenter.y);
      await page.waitForTimeout(350);
      const collapsedAfterPointerTap = await readSheetSnapshot();
      if (
        !collapsedAfterPointerTap.panelBounds ||
        collapsedAfterPointerTap.panelBounds.height >= expandedAfterPointerTap.panelBounds.height - 40
      ) {
        throw new Error(
          `Phone sheet pointer tap should collapse panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("collapsed-after-pointer-tap", false);

      await handleButton.tap();
      await page.waitForTimeout(350);
      const expandedAfterTouchTap = await readSheetSnapshot();
      if (
        !expandedAfterTouchTap.panelBounds ||
        expandedAfterTouchTap.panelBounds.height <= collapsedAfterPointerTap.panelBounds.height + 40
      ) {
        throw new Error(
          `Phone sheet touch tap should expand panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("expanded-touch-tap", true);

      await handleButton.tap();
      await page.waitForTimeout(350);
      const collapsedAfterTouchTap = await readSheetSnapshot();
      if (
        !collapsedAfterTouchTap.panelBounds ||
        collapsedAfterTouchTap.panelBounds.height >= expandedAfterTouchTap.panelBounds.height - 40
      ) {
        throw new Error(
          `Phone sheet touch tap should collapse panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("collapsed-after-touch-tap", false);

      await dragHandleWithMouse(-180);
      await page.waitForTimeout(350);
      const expandedAfterPointerDrag = await readSheetSnapshot();
      if (
        !expandedAfterPointerDrag.panelBounds ||
        expandedAfterPointerDrag.panelBounds.height <= collapsedAfterTouchTap.panelBounds.height + 40
      ) {
        throw new Error(
          `Phone sheet pointer drag-up should expand panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("expanded-pointer-drag", true);

      await dragHandleWithMouse(220);
      await page.waitForTimeout(350);
      const collapsedAfterPointerDrag = await readSheetSnapshot();
      if (
        !collapsedAfterPointerDrag.panelBounds ||
        collapsedAfterPointerDrag.panelBounds.height >= expandedAfterPointerDrag.panelBounds.height - 40
      ) {
        throw new Error(
          `Phone sheet pointer drag-down should collapse panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("collapsed-after-pointer-drag", false);

      await dragHandleWithTouch(-180);
      await page.waitForTimeout(350);
      const expandedAfterTouchDrag = await readSheetSnapshot();
      if (
        !expandedAfterTouchDrag.panelBounds ||
        expandedAfterTouchDrag.panelBounds.height <= collapsedAfterPointerDrag.panelBounds.height + 40
      ) {
        throw new Error(
          `Phone sheet touch drag-up should expand panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("expanded-touch-drag", true);

      await dragHandleWithTouch(220);
      await page.waitForTimeout(350);
      const collapsedAfterTouchDrag = await readSheetSnapshot();
      if (
        !collapsedAfterTouchDrag.panelBounds ||
        collapsedAfterTouchDrag.panelBounds.height >= expandedAfterTouchDrag.panelBounds.height - 40
      ) {
        throw new Error(
          `Phone sheet touch drag-down should collapse panel at ${viewport.width}x${viewport.height}.`
        );
      }
      await assertPhoneExpandedControlVisibility("collapsed-after-touch-drag", false);

      const assertPhonePlaceHeader = async ({
        placeId,
        expectedName,
        expectedTodayLineNeedles,
        todayLineDescription
      }) => {
        await page.goto(`${baseUrl}/?place=${placeId}`, {
          waitUntil: "networkidle",
          timeout: 90_000
        });
        await waitForMapToSettle(page);
        await page.waitForSelector("section[aria-label='Place details']", {
          state: "visible",
          timeout: 45_000
        });

        const readHeaderSnapshot = async () =>
          page.evaluate(() => {
            const panel = document.querySelector("section[aria-label='Place details']");
            if (!(panel instanceof HTMLElement)) {
              throw new Error("Phone panel is not visible.");
            }
            const title = panel.querySelector("h1");
            const todayLine = panel.querySelector("[data-modern-name-line='true']");
            return {
              panelHeight: panel.getBoundingClientRect().height,
              titleText: title?.textContent?.trim() ?? "",
              todayLineText: todayLine?.textContent?.replace(/\s+/gu, " ").trim() ?? ""
            };
          });

        const collapsedSnapshot = await readHeaderSnapshot();
        if (collapsedSnapshot.titleText !== expectedName) {
          throw new Error(
            `Phone ${viewport.width}x${viewport.height} ${placeId} collapsed title mismatch: expected '${expectedName}', got '${collapsedSnapshot.titleText}'.`
          );
        }
        if (
          !expectedTodayLineNeedles.every((needle) =>
            collapsedSnapshot.todayLineText.includes(needle)
          )
        ) {
          throw new Error(
            `Phone ${viewport.width}x${viewport.height} ${placeId} collapsed ${todayLineDescription} mismatch: expected ${JSON.stringify(
              expectedTodayLineNeedles
            )}, got '${collapsedSnapshot.todayLineText}'.`
          );
        }

        const handle = page
          .locator("section[aria-label='Place details'] button[aria-label$='place details panel']")
          .first();
        await handle.tap();
        await page.waitForTimeout(350);

        const expandedSnapshot = await readHeaderSnapshot();
        if (expandedSnapshot.titleText !== expectedName) {
          throw new Error(
            `Phone ${viewport.width}x${viewport.height} ${placeId} expanded title mismatch: expected '${expectedName}', got '${expandedSnapshot.titleText}'.`
          );
        }
        if (
          !expectedTodayLineNeedles.every((needle) =>
            expandedSnapshot.todayLineText.includes(needle)
          )
        ) {
          throw new Error(
            `Phone ${viewport.width}x${viewport.height} ${placeId} expanded ${todayLineDescription} mismatch: expected ${JSON.stringify(
              expectedTodayLineNeedles
            )}, got '${expandedSnapshot.todayLineText}'.`
          );
        }
        if (expandedSnapshot.panelHeight <= collapsedSnapshot.panelHeight + 40) {
          throw new Error(
            `Phone ${viewport.width}x${viewport.height} ${placeId} sheet did not expand while checking header.`
          );
        }
      };

      await assertPhonePlaceHeader({
        placeId: "lystra",
        expectedName: "Lystra",
        expectedTodayLineNeedles: ["Today:", "Türkiye"],
        todayLineDescription: "Today line"
      });

      await assertPhonePlaceHeader({
        placeId: "derbe",
        expectedName: "Derbe",
        expectedTodayLineNeedles: ["Today:", "Türkiye"],
        todayLineDescription: "Today line"
      });

      results.push({
        viewport,
        openingOverviewSnapshot,
        openingCoverage: coverage,
        attributionSnapshot,
        attributionClosedReachability,
        attributionCollapsedReachability,
        attributionExpandedReachability,
        collapsedHeightRatio: collapsedRatio,
        searchResultsBounds,
        menuDrawerBounds
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyDesktopAttributionReachability(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded", timeout: 150_000 });
    await waitForMapToSettle(page);

    const snapshot = await page.evaluate(() => {
      const toggle = document.querySelector("summary.maplibregl-ctrl-attrib-button");
      const reset = document.querySelector("button[data-map-control='reset-view']");
      const zoomIn = document.querySelector("button[data-map-control='zoom-in']");
      const zoomOut = document.querySelector("button[data-map-control='zoom-out']");
      const scale = document.querySelector("[data-map-scale='metric']");
      const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
      const toBounds = (element) => {
        if (!(element instanceof HTMLElement)) {
          return null;
        }
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height
        };
      };

      if (!(toggle instanceof HTMLElement)) {
        return {
          toggleBounds: null,
          centerMatchesToggle: false,
          centerElementTag: null,
          resetBounds: toBounds(reset),
          zoomInBounds: toBounds(zoomIn),
          zoomOutBounds: toBounds(zoomOut),
          scaleBounds: toBounds(scale),
          expanded: null
        };
      }

      const bounds = toggle.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const centerElement = document.elementFromPoint(centerX, centerY);
      return {
        toggleBounds: {
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height
        },
        centerMatchesToggle: centerElement === toggle,
        centerElementTag: centerElement?.tagName?.toLowerCase() ?? null,
        resetBounds: toBounds(reset),
        zoomInBounds: toBounds(zoomIn),
        zoomOutBounds: toBounds(zoomOut),
        scaleBounds: toBounds(scale),
        expanded:
          compactControl instanceof HTMLElement
            ? compactControl.classList.contains("maplibregl-compact-show")
            : null
      };
    });

    if (!snapshot.toggleBounds || !snapshot.centerMatchesToggle) {
      throw new Error(
        `Desktop attribution toggle is occluded or missing: center=${snapshot.centerElementTag} toggle=${JSON.stringify(
          snapshot.toggleBounds
        )}`
      );
    }

    for (const [label, bounds] of [
      ["reset", snapshot.resetBounds],
      ["zoom-in", snapshot.zoomInBounds],
      ["zoom-out", snapshot.zoomOutBounds],
      ["scale", snapshot.scaleBounds]
    ]) {
      if (!bounds) {
        continue;
      }
      if (boundsIntersect(snapshot.toggleBounds, bounds)) {
        throw new Error(
          `Desktop attribution toggle intersects ${label} control: toggle=${JSON.stringify(
            snapshot.toggleBounds
          )} control=${JSON.stringify(bounds)}`
        );
      }
    }

    const expandedBeforeToggle = await page.evaluate(() => {
      const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
      if (!(compactControl instanceof HTMLElement)) {
        return null;
      }
      return compactControl.classList.contains("maplibregl-compact-show");
    });
    const readExpandedState = async () =>
      page.evaluate(() => {
        const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
        if (!(compactControl instanceof HTMLElement)) {
          return null;
        }
        return compactControl.classList.contains("maplibregl-compact-show");
      });
    const pressAttributionToggle = async () => {
      await page.click("summary.maplibregl-ctrl-attrib-button");
      await page.waitForTimeout(200);
      return readExpandedState();
    };

    let expandedAfterOpenAttempt = await pressAttributionToggle();
    if (expandedAfterOpenAttempt === expandedBeforeToggle) {
      expandedAfterOpenAttempt = await pressAttributionToggle();
    }

    let expandedAfterCloseAttempt = expandedAfterOpenAttempt;
    if (expandedAfterOpenAttempt !== null) {
      expandedAfterCloseAttempt = await pressAttributionToggle();
      if (expandedAfterCloseAttempt !== expandedBeforeToggle) {
        expandedAfterCloseAttempt = await pressAttributionToggle();
      }
    }

    if (
      expandedBeforeToggle !== null &&
      expandedAfterOpenAttempt !== null &&
      expandedAfterCloseAttempt !== null &&
      (expandedAfterOpenAttempt === expandedBeforeToggle ||
        expandedAfterCloseAttempt !== expandedBeforeToggle)
    ) {
      throw new Error(
        `Desktop attribution toggle did not open/close as expected: before=${expandedBeforeToggle} open=${expandedAfterOpenAttempt} close=${expandedAfterCloseAttempt}`
      );
    }

    return snapshot;
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyScaleBarUpdatesWithZoom(browser, baseUrl) {
  const targetViewports = [
    {
      width: 1440,
      height: 900,
      hasTouch: false,
      isMobile: false,
      label: "desktop",
      zooms: [4, 5, 7, 9, 11],
      requireCollapsedSheet: false
    },
    {
      width: 390,
      height: 844,
      hasTouch: true,
      isMobile: true,
      label: "phone-390x844",
      zooms: [4, 5],
      requireCollapsedSheet: true
    }
  ];
  const results = [];

  const assertScaleMatchesGeometry = (snapshot, label) => {
    const labelMeters = parseScaleLabelMeters(snapshot.labelText);
    if (labelMeters === null) {
      throw new Error(`Scale label did not parse for ${label}: '${snapshot.labelText}'.`);
    }

    const deltaRatio = Math.abs(snapshot.realDistanceMeters - labelMeters) / snapshot.realDistanceMeters;
    if (deltaRatio > 0.05) {
      throw new Error(
        `Scale bar mismatch for ${label}: label=${labelMeters}m real=${snapshot.realDistanceMeters.toFixed(
          2
        )}m delta=${(deltaRatio * 100).toFixed(2)}%.`
      );
    }

    return {
      labelMeters,
      realDistanceMeters: Number(snapshot.realDistanceMeters.toFixed(2)),
      deltaRatio: Number(deltaRatio.toFixed(4))
    };
  };

  for (const viewport of targetViewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.hasTouch,
      isMobile: viewport.isMobile
    });
    const page = await context.newPage();

    const readScaleSnapshot = async () =>
      page.evaluate((testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }

        const scaleBar = document.querySelector("[data-map-scale='metric']");
        if (!(scaleBar instanceof HTMLElement)) {
          throw new Error("Scale bar is unavailable.");
        }
        const scaleFill = scaleBar.firstElementChild;
        const scaleLabel = scaleBar.querySelector("span");
        if (!(scaleFill instanceof HTMLElement) || !(scaleLabel instanceof HTMLElement)) {
          throw new Error("Scale bar internals are unavailable.");
        }

        const canvas = map.getCanvas();
        const canvasRect = canvas.getBoundingClientRect();
        const fillRect = scaleFill.getBoundingClientRect();
        const y = fillRect.top + fillRect.height / 2 - canvasRect.top;
        const fillLeft = fillRect.left - canvasRect.left;
        const fillRight = fillRect.right - canvasRect.left;
        const leftPoint = map.unproject([fillLeft, y]);
        const rightPoint = map.unproject([fillRight, y]);
        const realDistanceMeters = leftPoint.distanceTo(rightPoint);

        return {
          labelText: scaleLabel.textContent?.trim() ?? "",
          zoom: map.getZoom(),
          fillWidthPx: fillRect.width,
          realDistanceMeters
        };
      }, mapTestHookKey);

    try {
      await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      if (viewport.requireCollapsedSheet) {
        const collapsedRatio = await page.evaluate(() => {
          const panel = document.querySelector("section[aria-label='Place details']");
          if (!(panel instanceof HTMLElement)) {
            throw new Error("Phone place panel is not visible for scale-bar check.");
          }
          return panel.getBoundingClientRect().height / window.innerHeight;
        });
        if (collapsedRatio < 0.33 || collapsedRatio > 0.5) {
          throw new Error(
            `${viewport.label}: expected collapsed sheet near 40%, got ${(collapsedRatio * 100).toFixed(1)}%.`
          );
        }
      }

      const beforeZoomOut = await readScaleSnapshot();
      await page.evaluate((testHookKey) => {
        const map = window[testHookKey];
        if (!map) {
          throw new Error("Map test hook is unavailable.");
        }
        map.jumpTo({ zoom: Math.max(map.getMinZoom(), map.getZoom() - 4) });
      }, mapTestHookKey);
      await waitForMapToSettle(page);
      const afterZoomOut = await readScaleSnapshot();
      if (afterZoomOut.labelText === beforeZoomOut.labelText) {
        throw new Error(
          `${viewport.label}: scale label did not change after 4-level zoom-out. before='${beforeZoomOut.labelText}' after='${afterZoomOut.labelText}'.`
        );
      }

      const zoomChecks = [];
      for (const targetZoom of viewport.zooms) {
        await page.evaluate(
          ({ testHookKey, zoom }) => {
            const map = window[testHookKey];
            if (!map) {
              throw new Error("Map test hook is unavailable.");
            }
            map.jumpTo({ zoom });
          },
          { testHookKey: mapTestHookKey, zoom: targetZoom }
        );
        await waitForMapToSettle(page);
        const snapshot = await readScaleSnapshot();
        zoomChecks.push({
          zoom: Number(snapshot.zoom.toFixed(3)),
          labelText: snapshot.labelText,
          fillWidthPx: Number(snapshot.fillWidthPx.toFixed(2)),
          consistency: assertScaleMatchesGeometry(
            snapshot,
            `${viewport.label} zoom ${targetZoom}`
          )
        });
      }

      results.push({
        viewport: { width: viewport.width, height: viewport.height },
        zoomOutChangedLabel: {
          before: beforeZoomOut.labelText,
          after: afterZoomOut.labelText
        },
        zoomChecks
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

function rectanglesOverlap(first, second) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}

async function verifyTimelineTickLabelsDoNotOverlapAcrossLayouts(browser, baseUrl) {
  const scenarios = [
    {
      label: "desktop-opening-1440x900",
      viewport: { width: 1440, height: 900 },
      url: baseUrl,
      contextOptions: {}
    },
    {
      label: "desktop-panel-open-1024x768",
      viewport: { width: 1024, height: 768 },
      url: `${baseUrl}/?place=ephesus`,
      contextOptions: {}
    },
    {
      label: "phone-opening-390x844",
      viewport: { width: 390, height: 844 },
      url: baseUrl,
      contextOptions: {
        hasTouch: true,
        isMobile: true
      }
    },
    {
      label: "phone-opening-360x640",
      viewport: { width: 360, height: 640 },
      url: baseUrl,
      contextOptions: {
        hasTouch: true,
        isMobile: true
      }
    }
  ];
  const results = [];

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      ...scenario.contextOptions
    });
    const page = await context.newPage();
    try {
      await page.goto(scenario.url, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      await page.locator("input[data-timeline-slider='true']").waitFor({ state: "visible", timeout: 30_000 });

      const tickSnapshot = await page.evaluate(() => {
        const labels = Array.from(
          document.querySelectorAll("[data-timeline-tick-stop-id] span:nth-child(2)")
        )
          .map((node) => {
            if (!(node instanceof HTMLElement)) {
              return null;
            }
            const bounds = node.getBoundingClientRect();
            if (bounds.width <= 0 || bounds.height <= 0) {
              return null;
            }
            return {
              text: node.textContent?.trim() ?? "",
              left: bounds.left,
              right: bounds.right,
              top: bounds.top,
              bottom: bounds.bottom
            };
          })
          .filter((entry) => entry !== null);

        const overlaps = [];
        for (let index = 1; index < labels.length; index += 1) {
          const previous = labels[index - 1];
          const current = labels[index];
          if (previous.right > current.left) {
            overlaps.push({
              leftLabel: previous.text,
              rightLabel: current.text,
              overlapPx: previous.right - current.left
            });
          }
        }

        return {
          visibleLabels: labels.map((entry) => entry.text),
          overlaps
        };
      });

      if (tickSnapshot.overlaps.length > 0) {
        throw new Error(
          `Timeline tick labels overlap in ${scenario.label}: ${JSON.stringify(tickSnapshot.overlaps)}`
        );
      }

      results.push({
        label: scenario.label,
        viewport: scenario.viewport,
        visibleLabels: tickSnapshot.visibleLabels
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyExpandedAttributionAboveTimeline(browser, baseUrl) {
  const scenarios = [
    {
      label: "desktop-opening-1440x900",
      viewport: { width: 1440, height: 900 },
      url: baseUrl,
      contextOptions: {}
    },
    {
      label: "desktop-panel-open-1024x768",
      viewport: { width: 1024, height: 768 },
      url: `${baseUrl}/?place=ephesus`,
      contextOptions: {}
    },
    {
      label: "phone-opening-390x844",
      viewport: { width: 390, height: 844 },
      url: baseUrl,
      contextOptions: {
        hasTouch: true,
        isMobile: true
      }
    },
    {
      label: "phone-opening-360x640",
      viewport: { width: 360, height: 640 },
      url: baseUrl,
      contextOptions: {
        hasTouch: true,
        isMobile: true
      }
    },
    {
      label: "desktop-sources-open-1440x900",
      viewport: { width: 1440, height: 900 },
      url: `${baseUrl}/?year=44`,
      contextOptions: {},
      openSourcesPopover: true
    },
    {
      label: "phone-sources-open-390x844",
      viewport: { width: 390, height: 844 },
      url: `${baseUrl}/?year=44`,
      contextOptions: {
        hasTouch: true,
        isMobile: true
      },
      openSourcesPopover: true
    }
  ];
  const results = [];

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      ...scenario.contextOptions
    });
    const page = await context.newPage();
    try {
      await page.goto(scenario.url, { waitUntil: "domcontentloaded", timeout: 150_000 });
      await waitForMapToSettle(page);
      if (scenario.openSourcesPopover) {
        if (scenario.contextOptions.isMobile) {
          await page.getByRole("button", { name: "Sources" }).tap();
        } else {
          await page.getByRole("button", { name: "Sources" }).click();
        }
        await page.locator("[data-timeline-sources-popover='true']").waitFor({
          state: "visible",
          timeout: 10_000
        });
      }
      await page.waitForSelector("summary.maplibregl-ctrl-attrib-button", {
        state: "visible",
        timeout: 30_000
      });
      if (scenario.contextOptions.isMobile) {
        await page.tap("summary.maplibregl-ctrl-attrib-button");
      } else {
        await page.click("summary.maplibregl-ctrl-attrib-button");
      }
      await page.waitForTimeout(500);

      const snapshot = await page.evaluate(() => {
        const toBounds = (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          };
        };

        const timelineCard = document.querySelector("[data-timeline-card='true']");
        const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
        const toggle = document.querySelector("summary.maplibregl-ctrl-attrib-button");
        const scaleBar = document.querySelector("[data-map-scale='metric']");
        const sourcesPopover = document.querySelector("[data-timeline-sources-popover='true']");
        let centerElementTag = null;
        let toggleHit = false;
        if (toggle instanceof HTMLElement) {
          const rect = toggle.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const centerElement = document.elementFromPoint(centerX, centerY);
          centerElementTag = centerElement?.tagName?.toLowerCase() ?? null;
          toggleHit = centerElement === toggle;
        }

        return {
          timelineBounds: toBounds(timelineCard),
          sourcesPopoverBounds: toBounds(sourcesPopover),
          attributionBounds: toBounds(compactControl),
          scaleBounds: toBounds(scaleBar),
          toggleBounds: toBounds(toggle),
          centerElementTag,
          toggleHit
        };
      });

      if (!snapshot.timelineBounds || !snapshot.attributionBounds || !snapshot.toggleBounds) {
        throw new Error(
          `Missing timeline or attribution bounds in ${scenario.label}: ${JSON.stringify(snapshot)}`
        );
      }
      if (rectanglesOverlap(snapshot.timelineBounds, snapshot.attributionBounds)) {
        throw new Error(
          `Expanded attribution intersects timeline card in ${scenario.label}. timeline=${JSON.stringify(
            snapshot.timelineBounds
          )} attribution=${JSON.stringify(snapshot.attributionBounds)}`
        );
      }
      if (snapshot.scaleBounds && rectanglesOverlap(snapshot.scaleBounds, snapshot.attributionBounds)) {
        throw new Error(
          `Expanded attribution intersects scale bar in ${scenario.label}. scale=${JSON.stringify(
            snapshot.scaleBounds
          )} attribution=${JSON.stringify(snapshot.attributionBounds)}`
        );
      }
      if (
        scenario.openSourcesPopover &&
        snapshot.sourcesPopoverBounds &&
        rectanglesOverlap(snapshot.sourcesPopoverBounds, snapshot.attributionBounds)
      ) {
        throw new Error(
          `Expanded attribution intersects Sources popover in ${scenario.label}. popover=${JSON.stringify(
            snapshot.sourcesPopoverBounds
          )} attribution=${JSON.stringify(snapshot.attributionBounds)}`
        );
      }
      if (!snapshot.toggleHit) {
        throw new Error(
          `Attribution toggle is occluded in ${scenario.label}: centerElement=${snapshot.centerElementTag}`
        );
      }

      results.push({
        label: scenario.label,
        viewport: scenario.viewport,
        timelineBounds: snapshot.timelineBounds,
        sourcesPopoverBounds: snapshot.sourcesPopoverBounds,
        attributionBounds: snapshot.attributionBounds,
        scaleBounds: snapshot.scaleBounds
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function verifyRoutesTabRealDataScenarios(browser, baseUrl) {
  const screenshotDirectory = path.join(
    process.env.TEMP ?? os.tmpdir(),
    "ibm-m5-05",
    "r6"
  );
  await fs.mkdir(screenshotDirectory, { recursive: true });
  const screenshotPaths = {
    desktopRouteList: path.join(screenshotDirectory, "desktop-route-list-no-lines.png"),
    desktopPaul2Hovered: path.join(screenshotDirectory, "desktop-paul-2-stage-hovered.png"),
    desktopPaulRomeHovered: path.join(screenshotDirectory, "desktop-paul-rome-stage-hovered.png"),
    desktopJesusSelected: path.join(screenshotDirectory, "desktop-jesus-part-selected.png"),
    desktopRouteNotesEnd: path.join(screenshotDirectory, "desktop-route-notes-end.png"),
    phoneRouteSelected: path.join(screenshotDirectory, "phone-route-chosen.png")
  };
  const expectedRoutes = [
    { title: "Paul's first journey", stageCount: 14 },
    { title: "Paul's second journey", stageCount: 14 },
    { title: "Paul's third journey", stageCount: 15 },
    { title: "Paul's voyage to Rome", stageCount: 8 },
    { title: "Jesus' early ministry", stageCount: 10 },
    { title: "Jesus in Galilee", stageCount: 4 },
    { title: "Jesus beyond Galilee", stageCount: 7 },
    { title: "Jesus' final journey to Jerusalem", stageCount: 7 },
    { title: "Jesus' last week in Jerusalem", stageCount: 2 },
    { title: "Jesus after the resurrection", stageCount: 2 }
  ];

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference"
  });
  const desktopPage = await desktopContext.newPage();
  const consoleErrors = [];
  desktopPage.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  const intersects = (left, right) =>
    !(
      left.right <= right.left ||
      left.left >= right.right ||
      left.bottom <= right.top ||
      left.top >= right.bottom
    );
  const verifyRouteTabsAvoidPanelsAndToggle = async (viewportWidth) => {
    const context = await browser.newContext({
      viewport: { width: viewportWidth, height: 900 },
      reducedMotion: "no-preference"
    });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}/?tab=routes&route=paul-2&place=corinth`, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(page);
      await page.locator("section[aria-label='Route details']").waitFor({ timeout: 30_000 });
      await page.locator("section[aria-label='Place details'][data-route-place-panel='true']").waitFor({ timeout: 30_000 });
      const layout = await page.evaluate(() => {
        const tabs = document.querySelector("[role='tablist'][aria-label='View']");
        const routePanel = document.querySelector("section[aria-label='Route details']");
        const placePanel = document.querySelector("section[aria-label='Place details'][data-route-place-panel='true']");
        const mapTypeToggle = document.querySelector("[role='radiogroup'][aria-label='Map type']");
        const toBox = (element) => {
          if (!(element instanceof HTMLElement)) {
            return null;
          }
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          };
        };
        if (!(tabs instanceof HTMLElement)) {
          return null;
        }
        const tabsRect = toBox(tabs);
        const routeRect = toBox(routePanel);
        const placeRect = toBox(placePanel);
        const mapTypeRect = toBox(mapTypeToggle);
        return {
          tabsRect,
          routeRect,
          placeRect,
          mapTypeRect
        };
      });
      if (!layout || !layout.tabsRect || !layout.routeRect || !layout.placeRect || !layout.mapTypeRect) {
        throw new Error(`Routes real-data check: missing layout boxes for ${viewportWidth}px dual-panel tabs check.`);
      }
      if (intersects(layout.tabsRect, layout.routeRect)) {
        throw new Error(
          `Routes real-data check: view tabs overlap route panel at ${viewportWidth}px (${JSON.stringify(layout)}).`
        );
      }
      if (intersects(layout.tabsRect, layout.placeRect)) {
        throw new Error(
          `Routes real-data check: view tabs overlap place panel at ${viewportWidth}px (${JSON.stringify(layout)}).`
        );
      }
      if (intersects(layout.tabsRect, layout.mapTypeRect)) {
        throw new Error(
          `Routes real-data check: view tabs overlap map toggle at ${viewportWidth}px (${JSON.stringify(layout)}).`
        );
      }
      return {
        viewportWidth,
        tabsRect: layout.tabsRect
      };
    } finally {
      await page.close();
      await context.close();
    }
  };
  const verifyNoBaseFeaturesNearRouteDots = async (page, scenarioLabel) => {
    const result = await page.evaluate(async ({ testHook }) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }

      const routeLayers = ["ibm-routes-stops", "ibm-routes-via", "ibm-routes-mentioned"];
      const routePoints = map
        .queryRenderedFeatures(undefined, { layers: routeLayers })
        .filter((feature) => feature?.properties?.stopKind === "location")
        .map((feature) => {
          const coordinates = feature.geometry?.coordinates;
          if (!Array.isArray(coordinates) || coordinates.length < 2) {
            return null;
          }
          const projected = map.project([coordinates[0], coordinates[1]]);
          const canvas = map.getCanvas();
          if (
            projected.x < 0 ||
            projected.y < 0 ||
            projected.x > canvas.width ||
            projected.y > canvas.height
          ) {
            return null;
          }
          return {
            stopId: String(feature.properties?.stopId ?? ""),
            x: projected.x,
            y: projected.y
          };
        })
        .filter((entry) => entry !== null);
      return {
        routePointCount: routePoints.length
      };
    }, { testHook: mapTestHookKey });

    if (!result) {
      throw new Error(`Routes real-data check: could not inspect base-feature overlap in ${scenarioLabel}.`);
    }
    if (result.routePointCount < 1) {
      throw new Error(`Routes real-data check: no route points rendered in ${scenarioLabel}.`);
    }
    return result;
  };

  try {
    await desktopPage.goto(`${baseUrl}/?tab=routes`, { waitUntil: "domcontentloaded", timeout: 150_000 });
    await waitForMapToSettle(desktopPage);
    await desktopPage.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
    const routeListNoLineState = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      return {
        lineCount: map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-lines-foreground"] }).length,
        stopCount: map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-stops"] }).length,
        placePinCount: map.queryRenderedFeatures(undefined, {
          layers: [
            "ibm-city-pin",
            "ibm-city-pin-no-dot",
            "ibm-major-pin",
            "ibm-major-pin-no-dot",
            "ibm-site-pin",
            "ibm-site-pin-no-dot"
          ]
        }).length
      };
    }, mapTestHookKey);
    if (!routeListNoLineState || routeListNoLineState.lineCount > 0 || routeListNoLineState.stopCount > 0) {
      throw new Error(
        `Routes real-data check: expected no lines in route list state (${JSON.stringify(routeListNoLineState)}).`
      );
    }
    if (routeListNoLineState.placePinCount < 1) {
      throw new Error("Routes real-data check: expected map places in route list state.");
    }
    await desktopPage.screenshot({ path: screenshotPaths.desktopRouteList, fullPage: true });
    await desktopPage.getByRole("button", { name: "Paul's first journey" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    await desktopPage.getByText(/Borders as in AD \d+/, { exact: false }).waitFor({ timeout: 30_000 });
    const cameraBeforeTabSwitch = await desktopPage.evaluate(async (testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      map.jumpTo({ center: [17.2, 36.8], zoom: 9.3 });
      await new Promise((resolve) => map.once("idle", resolve));
      const center = map.getCenter();
      return { zoom: map.getZoom(), center: [center.lng, center.lat] };
    }, mapTestHookKey);
    await desktopPage.getByRole("tab", { name: "Map" }).click();
    await desktopPage.getByRole("tab", { name: "Routes" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    const cameraAfterTabSwitch = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const center = map.getCenter();
      return { zoom: map.getZoom(), center: [center.lng, center.lat] };
    }, mapTestHookKey);
    if (!cameraBeforeTabSwitch || !cameraAfterTabSwitch) {
      throw new Error("Routes real-data check: could not verify camera persistence across tab switch.");
    }
    if (
      Math.abs(cameraBeforeTabSwitch.zoom - cameraAfterTabSwitch.zoom) > 0.01 ||
      Math.abs(cameraBeforeTabSwitch.center[0] - cameraAfterTabSwitch.center[0]) > 0.0001 ||
      Math.abs(cameraBeforeTabSwitch.center[1] - cameraAfterTabSwitch.center[1]) > 0.0001
    ) {
      throw new Error(
        `Routes real-data check: camera changed after Routes → Map → Routes (${JSON.stringify({
          before: cameraBeforeTabSwitch,
          after: cameraAfterTabSwitch
        })}).`
      );
    }
    await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return false;
      }
      const methods = ["jumpTo", "easeTo", "flyTo", "fitBounds"];
      const originals = {};
      const calls = [];
      const extractCenterFromBounds = (bounds) => {
        if (bounds && typeof bounds.getCenter === "function") {
          const center = bounds.getCenter();
          return center && Number.isFinite(center.lng) && Number.isFinite(center.lat)
            ? [center.lng, center.lat]
            : null;
        }
        if (
          Array.isArray(bounds) &&
          bounds.length === 2 &&
          Array.isArray(bounds[0]) &&
          Array.isArray(bounds[1]) &&
          bounds[0].length >= 2 &&
          bounds[1].length >= 2
        ) {
          return [
            (Number(bounds[0][0]) + Number(bounds[1][0])) / 2,
            (Number(bounds[0][1]) + Number(bounds[1][1])) / 2
          ];
        }
        return null;
      };
      for (const method of methods) {
        const original = map[method];
        if (typeof original !== "function") {
          continue;
        }
        originals[method] = original;
        map[method] = (...args) => {
          let center = null;
          let zoom = null;
          if (method === "fitBounds") {
            center = extractCenterFromBounds(args[0]);
            if (args[1] && typeof args[1] === "object" && Number.isFinite(args[1].zoom)) {
              zoom = Number(args[1].zoom);
            }
          } else if (args[0] && typeof args[0] === "object") {
            if (Array.isArray(args[0].center) && args[0].center.length >= 2) {
              center = [Number(args[0].center[0]), Number(args[0].center[1])];
            }
            if (Number.isFinite(args[0].zoom)) {
              zoom = Number(args[0].zoom);
            }
          }
          calls.push({ method, center, zoom });
          return original.apply(map, args);
        };
      }
      window.__ibmCameraCallProbe = { methods, originals, calls };
      return true;
    }, mapTestHookKey);
    const routesSearchCameraBefore = await desktopPage.evaluate(async (testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      map.jumpTo({ center: [5, 30], zoom: 6.1 });
      await new Promise((resolve) => map.once("idle", resolve));
      const center = map.getCenter();
      return { zoom: map.getZoom(), center: [center.lng, center.lat] };
    }, mapTestHookKey);
    const searchInput = desktopPage.getByLabel("Search biblical places");
    await searchInput.fill("Bethlehem");
    await desktopPage.waitForSelector("[data-testid='search-results-list']", { timeout: 30_000 });
    await desktopPage
      .locator("[data-testid='search-results-list'] [role='option']")
      .filter({ hasText: "Bethlehem" })
      .first()
      .click();
    await desktopPage.getByRole("heading", { level: 1, name: "Bethlehem" }).waitFor({ timeout: 30_000 });
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    const routesTabSelectedAfterSearch = await desktopPage
      .getByRole("tab", { name: "Routes" })
      .getAttribute("aria-selected");
    if (routesTabSelectedAfterSearch !== "true") {
      throw new Error("Routes real-data regression: search on Routes tab should keep Routes selected.");
    }
    const routesSearchCameraAfter = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const center = map.getCenter();
      return { zoom: map.getZoom(), center: [center.lng, center.lat] };
    }, mapTestHookKey);
    const cameraProbeCalls = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      const probe = window.__ibmCameraCallProbe;
      const calls = Array.isArray(probe?.calls) ? [...probe.calls] : [];
      if (map && probe && probe.originals) {
        for (const method of probe.methods ?? []) {
          if (typeof probe.originals[method] === "function") {
            map[method] = probe.originals[method];
          }
        }
      }
      delete window.__ibmCameraCallProbe;
      return calls;
    }, mapTestHookKey);
    if (!routesSearchCameraBefore || !routesSearchCameraAfter) {
      throw new Error("Routes real-data check: could not inspect camera before/after search selection on Routes tab.");
    }
    if (Math.abs(routesSearchCameraAfter.zoom - routesSearchCameraBefore.zoom) > 0.02) {
      throw new Error(
        `Routes real-data regression: search selection on Routes tab changed zoom (${JSON.stringify({
          before: routesSearchCameraBefore,
          after: routesSearchCameraAfter,
          calls: cameraProbeCalls
        })}).`
      );
    }
    if (
      Math.abs(routesSearchCameraAfter.center[0] - routesSearchCameraBefore.center[0]) < 0.2 &&
      Math.abs(routesSearchCameraAfter.center[1] - routesSearchCameraBefore.center[1]) < 0.2
    ) {
      throw new Error(
        `Routes real-data regression: search selection on Routes tab did not pan to an off-screen place (${JSON.stringify({
          before: routesSearchCameraBefore,
          after: routesSearchCameraAfter
        })}).`
      );
    }
    const disruptiveSearchCameraCall = cameraProbeCalls.find((call) => {
      if (call.method === "fitBounds" || call.method === "flyTo") {
        return true;
      }
      if (call.method !== "jumpTo") {
        return false;
      }
      if (!Array.isArray(call.center) || !routesSearchCameraBefore) {
        return true;
      }
      return (
        Math.abs(call.center[0] - routesSearchCameraBefore.center[0]) > 0.0001 ||
        Math.abs(call.center[1] - routesSearchCameraBefore.center[1]) > 0.0001 ||
        (call.zoom !== null && Math.abs(call.zoom - routesSearchCameraBefore.zoom) > 0.001)
      );
    });
    if (disruptiveSearchCameraCall) {
      throw new Error(
        `Routes real-data regression: search selection on Routes tab should not fit/fly camera (${JSON.stringify({
          disruptiveSearchCameraCall,
          calls: cameraProbeCalls
        })}).`
      );
    }
    await desktopPage.getByRole("button", { name: "Close" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("heading", { level: 2, name: "Routes" }).waitFor({ timeout: 30_000 });
    await desktopPage.getByRole("button", { name: "Paul's first journey" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    await desktopPage.waitForTimeout(500);
    const cameraAfterReselect = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const center = map.getCenter();
      return { zoom: map.getZoom(), center: [center.lng, center.lat] };
    }, mapTestHookKey);
    if (!cameraAfterReselect) {
      throw new Error("Routes real-data check: could not inspect camera after reselecting the route.");
    }
    if (
      Math.abs(cameraAfterReselect.zoom - cameraAfterTabSwitch.zoom) < 0.3 &&
      Math.abs(cameraAfterReselect.center[0] - cameraAfterTabSwitch.center[0]) < 0.2 &&
      Math.abs(cameraAfterReselect.center[1] - cameraAfterTabSwitch.center[1]) < 0.2
    ) {
      throw new Error(
        `Routes real-data check: reselecting route after ‹ All routes did not fit camera (${JSON.stringify({
          beforeReselect: cameraAfterTabSwitch,
          afterReselect: cameraAfterReselect
        })}).`
      );
    }
    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("heading", { level: 2, name: "Routes" }).waitFor({ timeout: 30_000 });
    await desktopPage.waitForTimeout(800);
    await desktopPage.evaluate(() => {
      window.__ibmRouteSelectLongTasks = [];
      window.__ibmRouteSelectLongTaskObserver?.disconnect?.();
      if (
        typeof PerformanceObserver === "undefined" ||
        !Array.isArray(PerformanceObserver.supportedEntryTypes) ||
        !PerformanceObserver.supportedEntryTypes.includes("longtask")
      ) {
        return;
      }
      const observer = new PerformanceObserver((list) => {
        const bucket = window.__ibmRouteSelectLongTasks ?? [];
        for (const entry of list.getEntries()) {
          bucket.push(entry.duration);
        }
        window.__ibmRouteSelectLongTasks = bucket;
      });
      observer.observe({ entryTypes: ["longtask"] });
      window.__ibmRouteSelectLongTaskObserver = observer;
    });

    await desktopPage.getByRole("button", { name: "Paul's second journey" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's second journey" }).waitFor({ timeout: 30_000 });
    await desktopPage.waitForTimeout(700);
    const routeSelectionLongTaskSummary = await desktopPage.evaluate(() => {
      const durations = window.__ibmRouteSelectLongTasks ?? [];
      window.__ibmRouteSelectLongTaskObserver?.disconnect?.();
      return {
        count: durations.length,
        maxMs: durations.length > 0 ? Math.max(...durations) : 0
      };
    });
    const routeSelectionRenderer = await detectWebGlRenderer(desktopPage);
    const routeSelectionOnSoftwareRenderer = softwareRendererPattern.test(routeSelectionRenderer ?? "");
    if (
      routeSelectionLongTaskSummary.maxMs > smoothnessLongTaskLimitMs &&
      !(routeSelectionOnSoftwareRenderer && process.env.SMOOTHNESS_REQUIRE_GPU !== "1")
    ) {
      throw new Error(
        `Routes real-data check: route selection produced long task ${routeSelectionLongTaskSummary.maxMs.toFixed(
          1
        )} ms (limit ${smoothnessLongTaskLimitMs} ms).`
      );
    }
    if (
      routeSelectionLongTaskSummary.maxMs > smoothnessLongTaskLimitMs &&
      routeSelectionOnSoftwareRenderer &&
      process.env.SMOOTHNESS_REQUIRE_GPU !== "1"
    ) {
      console.warn(
        `Routes real-data check: route selection reported ${routeSelectionLongTaskSummary.maxMs.toFixed(
          1
        )} ms long task but not enforced on software renderer (${routeSelectionRenderer}).`
      );
    }

    const routeHoverProbeReady = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return false;
      }
      const sourceIds = Object.keys(map.getStyle()?.sources ?? {});
      const wrappedSources = [];
      const counts = {};
      for (const sourceId of sourceIds) {
        const source = map.getSource(sourceId);
        if (!source || typeof source.setData !== "function") {
          continue;
        }
        const original = source.setData.bind(source);
        source.setData = (...args) => {
          counts[sourceId] = (counts[sourceId] ?? 0) + 1;
          return original(...args);
        };
        wrappedSources.push({ source, original });
      }
      window.__ibmRoutesRealHoverSetDataProbe = {
        counts,
        restore: () => {
          for (const wrapped of wrappedSources) {
            wrapped.source.setData = wrapped.original;
          }
        }
      };
      return true;
    }, mapTestHookKey);
    if (!routeHoverProbeReady) {
      throw new Error("Routes real-data check: could not initialize hover setData probe.");
    }
    await desktopPage.locator("[data-route-stage-index='3']").hover();
    await desktopPage.waitForTimeout(120);
    await desktopPage.locator("[data-route-stage-index='2']").hover();
    await desktopPage.waitForTimeout(120);
    const realHoverSetDataCounts = await desktopPage.evaluate(() => {
      const probe = window.__ibmRoutesRealHoverSetDataProbe;
      if (!probe) {
        return null;
      }
      const counts = { ...probe.counts };
      probe.restore();
      window.__ibmRoutesRealHoverSetDataProbe = null;
      return counts;
    });
    if (!realHoverSetDataCounts) {
      throw new Error("Routes real-data check: could not read hover setData counts.");
    }
    const realHoverUpdatedSources = Object.entries(realHoverSetDataCounts)
      .filter(([, count]) => Number(count) > 0)
      .map(([sourceId]) => sourceId);
    if (!realHoverUpdatedSources.includes("ibm-route-lines") || !realHoverUpdatedSources.includes("ibm-route-points")) {
      throw new Error(
        `Routes real-data check: hover should update only route sources (${JSON.stringify(realHoverSetDataCounts)}).`
      );
    }

    const routePlaceVisibilityCheck = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const basePlaceVisibilityByZoom = [];
      for (const zoom of [6.8, 8.5, 10]) {
        map.jumpTo({ center: [28, 36], zoom });
        basePlaceVisibilityByZoom.push({
          zoom,
          pinCount: map.queryRenderedFeatures(undefined, {
            layers: [
              "ibm-city-pin",
              "ibm-city-pin-no-dot",
              "ibm-major-pin",
              "ibm-major-pin-no-dot",
              "ibm-site-pin",
              "ibm-site-pin-no-dot"
            ]
          }).length
        });
      }
      return { basePlaceVisibilityByZoom };
    }, mapTestHookKey);
    if (!routePlaceVisibilityCheck) {
      throw new Error("Routes real-data check: could not verify route/base place visibility.");
    }
    const hasBasePins = routePlaceVisibilityCheck.basePlaceVisibilityByZoom.some(
      (snapshot) => snapshot.pinCount > 0
    );
    if (!hasBasePins) {
      throw new Error(
        `Routes real-data check: expected base place pins while a route is selected (${JSON.stringify(routePlaceVisibilityCheck)}).`
      );
    }
    const routeDotSuppressionChecks = [];
    const routeDotSuppressionScenarios = [
      {
        label: "paul-2 fitted view",
        url: `${baseUrl}/?tab=routes&route=paul-2`,
        heading: "Paul's second journey"
      },
      {
        label: "paul-rome fitted view",
        url: `${baseUrl}/?tab=routes&route=paul-rome`,
        heading: "Paul's voyage to Rome"
      },
      {
        label: "jesus-1 fitted view",
        url: `${baseUrl}/?tab=routes&route=jesus-1`,
        heading: "Jesus' early ministry"
      },
      {
        label: "paul-2 place=corinth",
        url: `${baseUrl}/?tab=routes&route=paul-2&place=corinth`,
        heading: "Corinth",
        headingLevel: 1
      }
    ];
    for (const scenario of routeDotSuppressionScenarios) {
      await desktopPage.goto(scenario.url, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(desktopPage);
      await desktopPage
        .getByRole("heading", {
          name: scenario.heading,
          level: scenario.headingLevel
        })
        .waitFor({ timeout: 30_000 });
      routeDotSuppressionChecks.push({
        scenario: scenario.label,
        ...(await verifyNoBaseFeaturesNearRouteDots(desktopPage, scenario.label))
      });
    }

    const clickRouteStopById = async (page, stopId, stopKind = "location") => {
      const clicked = await page.evaluate(
        async ({ testHook, routeStopId, routeStopKind }) => {
          const map = window[testHook];
          if (!map) {
            return false;
          }
          const pointsSource = map.getSource("ibm-route-points");
          const pointsData =
            pointsSource && typeof pointsSource.getData === "function"
              ? await pointsSource.getData()
              : null;
          const stopFeature = (pointsData?.features ?? []).find((feature) => {
            const properties = feature?.properties ?? {};
            const coordinates = feature?.geometry?.coordinates;
            return (
              properties.kind === "stop" &&
              properties.stopKind === routeStopKind &&
              properties.stopId === routeStopId &&
              Array.isArray(coordinates) &&
              coordinates.length >= 2
            );
          });
          if (!stopFeature) {
            return false;
          }
          const coordinates = stopFeature.geometry.coordinates;
          map.jumpTo({ center: [coordinates[0], coordinates[1]], zoom: 10.8 });
          await new Promise((resolve) => map.once("idle", resolve));
          const projected = map.project([coordinates[0], coordinates[1]]);
          map.fire("click", {
            point: projected,
            lngLat: { lng: coordinates[0], lat: coordinates[1] }
          });
          return true;
        },
        { testHook: mapTestHookKey, routeStopId: stopId, routeStopKind: stopKind }
      );
      if (!clicked) {
        throw new Error(`Routes real-data check: could not click route stop '${stopId}' (${stopKind}) on map.`);
      }
    };

    const assertRouteStopPanelContents = async ({ name, todayName, candidateCount, scriptureRef }) => {
      const panel = desktopPage.locator("section[aria-label='Place details'][data-route-place-panel='true']");
      await panel.waitFor({ state: "visible", timeout: 30_000 });
      await panel.locator("[data-route-stop-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
      await panel.getByRole("heading", { level: 1, name }).waitFor({ timeout: 30_000 });
      if (todayName) {
        await panel.getByText(`Today: ${todayName}`, { exact: false }).waitFor({ timeout: 30_000 });
      }
      if (candidateCount > 1) {
        await panel.getByRole("heading", { level: 2, name: "Candidate sites" }).waitFor({ timeout: 30_000 });
      }
      await panel.getByRole("heading", { level: 2, name: "In the Bible" }).waitFor({ timeout: 30_000 });
      if (scriptureRef) {
        await panel.locator("strong").filter({ hasText: scriptureRef }).first().waitFor({ timeout: 30_000 });
      }
      await panel.getByRole("heading", { level: 2, name: /Sources/u }).waitFor({ timeout: 30_000 });
      const sourceItemsCount = await panel.locator("ol li").count();
      if (sourceItemsCount < 1) {
        throw new Error(`Routes real-data check: stop entry '${name}' should show at least one source.`);
      }
    };

    const loadRouteStopTargets = async (routeId, heading) => {
      await desktopPage.goto(`${baseUrl}/?tab=routes&route=${routeId}`, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(desktopPage);
      await desktopPage.getByRole("heading", { name: heading }).waitFor({ timeout: 30_000 });
      return desktopPage.evaluate(async (testHook) => {
        const map = window[testHook];
        if (!map) {
          return null;
        }
        const pointsSource = map.getSource("ibm-route-points");
        const pointsData =
          pointsSource && typeof pointsSource.getData === "function"
            ? await pointsSource.getData()
            : null;
        const stopPoints = (pointsData?.features ?? []).filter((feature) => {
          const properties = feature?.properties ?? {};
          const coordinates = feature?.geometry?.coordinates;
          return (
            properties.kind === "stop" &&
            properties.stopKind === "route-stop" &&
            Array.isArray(coordinates) &&
            coordinates.length >= 2
          );
        });
        if (stopPoints.length === 0) {
          return {
            routeStopCount: 0
          };
        }
        const routeStopIds = new Set(stopPoints.map((feature) => String(feature.properties?.stopId ?? "")));
        const routeStopsPayload = await fetch("/generated/routes.stops.json")
          .then((response) => response.json())
          .catch(() => null);
        const byId = new Map((routeStopsPayload?.stops ?? []).map((stop) => [stop.id, stop]));
        const toTarget = (feature) => {
          const stopId = String(feature.properties?.stopId ?? "");
          const stopRecord = byId.get(stopId);
          const coordinates = feature.geometry.coordinates;
          return {
            id: stopId,
            name: String(feature.properties?.label ?? stopRecord?.name ?? stopId),
            todayName: stopRecord?.todayName ?? null,
            candidateCount: Array.isArray(stopRecord?.candidates) ? stopRecord.candidates.length : 0,
            scriptureRef: stopRecord?.scripture?.[0]?.ref ?? null,
            coordinates: [Number(coordinates[0]), Number(coordinates[1])],
            isDisputed:
              Array.isArray(stopRecord?.candidates) &&
              stopRecord.candidates.some(
                (candidate) =>
                  candidate?.confidence === "disputed" || Number(stopRecord.candidates.length) > 1
              )
          };
        };
        const regularFeature =
          stopPoints.find((feature) => {
            const stopId = String(feature.properties?.stopId ?? "");
            const stopRecord = byId.get(stopId);
            if (!stopRecord) {
              return true;
            }
            const isDisputed = stopRecord.candidates.some((candidate) => candidate.confidence === "disputed");
            return !isDisputed && stopRecord.candidates.length <= 1;
          }) ?? stopPoints[0];
        const disputedFeature =
          stopPoints.find((feature) => {
            const stopId = String(feature.properties?.stopId ?? "");
            const stopRecord = byId.get(stopId);
            if (!stopRecord) {
              return false;
            }
            return (
              stopRecord.candidates.length > 1 ||
              stopRecord.candidates.some((candidate) => candidate.confidence === "disputed")
            );
          }) ?? null;
        const offscreenCenterFeature =
          stopPoints.find(
            (feature) => String(feature.properties?.stopId ?? "") !== String(regularFeature.properties?.stopId ?? "")
          ) ?? stopPoints[0];
        return {
          routeStopCount: stopPoints.length,
          regular: toTarget(regularFeature),
          disputed: disputedFeature ? toTarget(disputedFeature) : null,
          offscreenCenter: [
            Number(offscreenCenterFeature.geometry.coordinates[0]),
            Number(offscreenCenterFeature.geometry.coordinates[1])
          ],
          hasCountryOfTheGadarenes: routeStopIds.has("country-of-the-gadarenes")
        };
      }, mapTestHookKey);
    };

    let routeStopTargets = await loadRouteStopTargets("jesus-1", "Jesus' early ministry");
    if (!routeStopTargets || routeStopTargets.routeStopCount < 1) {
      routeStopTargets = await loadRouteStopTargets("paul-rome", "Paul's voyage to Rome");
    }
    if (routeStopTargets && routeStopTargets.routeStopCount > 0 && routeStopTargets.regular) {
      const routeStopSelectionTargets = [
        routeStopTargets.regular,
        routeStopTargets.disputed ?? routeStopTargets.regular
      ];
      for (const target of routeStopSelectionTargets) {
        await clickRouteStopById(desktopPage, target.id, "route-stop");
        await assertRouteStopPanelContents(target);
        await desktopPage.getByRole("button", { name: "Close" }).click();
        await desktopPage.getByRole("heading", { name: /journey|journeys/u }).first().waitFor({ timeout: 30_000 });

        await desktopPage
          .locator("section[aria-label='Route details'] [data-route-stage-index] button")
          .filter({ hasText: target.name })
          .first()
          .click();
        await assertRouteStopPanelContents(target);
        await desktopPage.getByRole("button", { name: "Close" }).click();
        await desktopPage.getByRole("heading", { name: /journey|journeys/u }).first().waitFor({ timeout: 30_000 });
      }

      const offscreenStopTarget = routeStopTargets.disputed ?? routeStopTargets.regular;
      const offscreenProbeCenterCoordinates = await desktopPage.evaluate(
        async ({ testHook, targetStopId }) => {
          const map = window[testHook];
          if (!map) {
            return null;
          }
          const pointsSource = map.getSource("ibm-route-points");
          const pointsData =
            pointsSource && typeof pointsSource.getData === "function"
              ? await pointsSource.getData()
              : null;
          const otherStop = (pointsData?.features ?? []).find((feature) => {
            const properties = feature?.properties ?? {};
            const coordinates = feature?.geometry?.coordinates;
            return (
              properties.kind === "stop" &&
              properties.stopKind === "route-stop" &&
              properties.stopId !== targetStopId &&
              Array.isArray(coordinates) &&
              coordinates.length >= 2
            );
          });
          if (!otherStop) {
            return null;
          }
          return [Number(otherStop.geometry.coordinates[0]), Number(otherStop.geometry.coordinates[1])];
        },
        { testHook: mapTestHookKey, targetStopId: offscreenStopTarget.id }
      );
      const stopEntryPanCheckBefore = await desktopPage.evaluate(
        async ({ testHook, centerCoordinates }) => {
          const map = window[testHook];
          if (!map || !Array.isArray(centerCoordinates) || centerCoordinates.length < 2) {
            return null;
          }
          map.jumpTo({ center: centerCoordinates, zoom: 10.9 });
          await new Promise((resolve) => map.once("idle", resolve));
          const center = map.getCenter();
          return { zoom: map.getZoom(), center: [center.lng, center.lat] };
        },
        { testHook: mapTestHookKey, centerCoordinates: offscreenProbeCenterCoordinates }
      );
      await desktopPage
        .locator("section[aria-label='Route details'] [data-route-stage-index] button")
        .filter({ hasText: offscreenStopTarget.name })
        .first()
        .click();
      await desktopPage
        .getByRole("heading", { level: 1, name: offscreenStopTarget.name })
        .waitFor({ timeout: 30_000 });
      await desktopPage.waitForTimeout(450);
      const stopEntryPanCheckAfter = await desktopPage.evaluate((testHook) => {
        const map = window[testHook];
        if (!map) {
          return null;
        }
        const center = map.getCenter();
        return { zoom: map.getZoom(), center: [center.lng, center.lat] };
      }, mapTestHookKey);
      if (!stopEntryPanCheckBefore || !stopEntryPanCheckAfter) {
        throw new Error("Routes real-data check: could not inspect camera for stop-entry off-screen pan.");
      }
      if (Math.abs(stopEntryPanCheckAfter.zoom - stopEntryPanCheckBefore.zoom) > 0.02) {
        throw new Error(
          `Routes real-data check: selecting stop entry from stage list changed zoom (${JSON.stringify({
            before: stopEntryPanCheckBefore,
            after: stopEntryPanCheckAfter
          })}).`
        );
      }
      if (
        Math.abs(stopEntryPanCheckAfter.center[0] - stopEntryPanCheckBefore.center[0]) < 0.2 &&
        Math.abs(stopEntryPanCheckAfter.center[1] - stopEntryPanCheckBefore.center[1]) < 0.2
      ) {
        throw new Error(
          `Routes real-data check: selecting off-screen stop entry did not pan (${JSON.stringify({
            before: stopEntryPanCheckBefore,
            after: stopEntryPanCheckAfter,
            target: offscreenStopTarget
          })}).`
        );
      }
      await desktopPage.getByRole("button", { name: "Close" }).click();
    } else {
      console.log(
        "Routes real-data check: no route-stop entries found in loaded routes data; skipping real-data stop-entry coverage checks."
      );
    }

    await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-2`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage.getByRole("heading", { name: "Paul's second journey" }).waitFor({ timeout: 30_000 });

    await clickRouteStopById(desktopPage, "corinth");
    await desktopPage.getByRole("heading", { level: 1, name: "Corinth" }).waitFor({ timeout: 30_000 });
    await desktopPage.locator("section[aria-label='Route details'] [data-routes-panel='true']").waitFor({ timeout: 30_000 });
    await desktopPage.locator("section[aria-label='Place details'][data-route-place-panel='true']").waitFor({ timeout: 30_000 });

    await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-2&stage=6&place=corinth`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage.getByRole("heading", { level: 1, name: "Corinth" }).waitFor({ timeout: 30_000 });
    await desktopPage.locator("section[aria-label='Route details'] [data-routes-panel='true']").waitFor({ timeout: 30_000 });
    const corinthDeepLinkStageSelected = await desktopPage
      .locator("[data-route-stage-index='6']")
      .getAttribute("data-route-stage-selected");
    if (corinthDeepLinkStageSelected !== "true") {
      throw new Error(`Routes real-data check: route+place deep link should keep stage selection (stage 6=${corinthDeepLinkStageSelected}).`);
    }
    const corinthSelectedRouteStyleCheck = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const pointsSource = map.getSource("ibm-route-points");
      if (!pointsSource || typeof pointsSource.getData !== "function") {
        return null;
      }
      return pointsSource.getData().then((pointsData) => {
        const selectedCorinthPoints = (pointsData?.features ?? []).filter((feature) => {
          const properties = feature?.properties ?? {};
          return (
            properties.stopKind === "location" &&
            properties.stopId === "corinth" &&
            properties.kind !== "stage-pill" &&
            properties.isSelectedPlace === true
          );
        });
        const corinthLabelCount = map
          .queryRenderedFeatures(undefined, {
            layers: [
              "ibm-major-pin",
              "ibm-major-pin-no-dot",
              "ibm-routes-major-pin",
              "ibm-city-pin",
              "ibm-city-pin-no-dot",
              "ibm-routes-city-pin",
              "ibm-site-pin",
              "ibm-site-pin-no-dot",
              "ibm-routes-site-pin",
              "ibm-selected-major-pin-label",
              "ibm-selected-site-pin-label",
              "ibm-selected-pin-label"
            ]
          })
          .filter((feature) => feature.properties?.placeId === "corinth").length;
        const selectedLabelCount = map
          .queryRenderedFeatures(undefined, {
            layers: ["ibm-selected-major-pin-label", "ibm-selected-site-pin-label", "ibm-selected-pin-label"]
          })
          .filter((feature) => feature.properties?.placeId === "corinth").length;
        return {
          selectedCorinthPointCount: selectedCorinthPoints.length,
          corinthLabelCount,
          selectedLabelCount,
          stopPaint: {
            radius: map.getPaintProperty("ibm-routes-stops", "circle-radius"),
            color: map.getPaintProperty("ibm-routes-stops", "circle-color"),
            strokeColor: map.getPaintProperty("ibm-routes-stops", "circle-stroke-color")
          },
          // MapLibre places names from the top layer down; selected place labels stay above base labels.
          selectedLabelLayout: (() => {
            const layerOrder = map.getStyle().layers.map((layer) => layer.id);
            const selectedIndex = layerOrder.indexOf("ibm-selected-pin-label");
            const namesAbove = layerOrder
              .slice(selectedIndex + 1)
              .filter(
                (layerId) =>
                  map.getLayer(layerId)?.type === "symbol" &&
                  !layerId.startsWith("ibm-routes-stage-pill") &&
                  !layerId.startsWith("ibm-selected-") &&
                  layerId !== "ibm-routes-lines-arrows"
              );
            return { selectedIndex, namesAbove };
          })()
        };
      });
    }, mapTestHookKey);
    if (!corinthSelectedRouteStyleCheck || corinthSelectedRouteStyleCheck.selectedCorinthPointCount < 1) {
      throw new Error(
        `Routes real-data check: Corinth route point should be selected when place=corinth (${JSON.stringify(corinthSelectedRouteStyleCheck)}).`
      );
    }
    if (corinthSelectedRouteStyleCheck.corinthLabelCount < 1) {
      throw new Error("Routes real-data check: selected Corinth route label should render.");
    }
    if (corinthSelectedRouteStyleCheck.selectedLabelCount < 1) {
      throw new Error("Routes real-data check: selected Corinth should render in selected place label layer.");
    }
    if (
      corinthSelectedRouteStyleCheck.selectedLabelLayout.selectedIndex < 0 ||
      corinthSelectedRouteStyleCheck.selectedLabelLayout.namesAbove.length > 0
    ) {
      throw new Error(
        `Routes real-data check: selected place label layer should be placed before every other name (${JSON.stringify(
          corinthSelectedRouteStyleCheck.selectedLabelLayout
        )}).`
      );
    }
    await desktopPage
      .locator("section[aria-label='Place details'][data-route-place-panel='true'] button[aria-label='Close place panel']")
      .click();
    await desktopPage
      .locator("section[aria-label='Place details'][data-route-place-panel='true']")
      .waitFor({ state: "hidden", timeout: 30_000 });
    const corinthSelectionClearedCheck = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const pointsSource = map.getSource("ibm-route-points");
      if (!pointsSource || typeof pointsSource.getData !== "function") {
        return null;
      }
      return pointsSource.getData().then((pointsData) => {
        const selectedCorinthPoints = (pointsData?.features ?? []).filter((feature) => {
          const properties = feature?.properties ?? {};
          return (
            properties.stopKind === "location" &&
            properties.stopId === "corinth" &&
            properties.kind !== "stage-pill" &&
            properties.isSelectedPlace === true
          );
        });
        return {
          selectedCorinthPointCount: selectedCorinthPoints.length,
          search: window.location.search
        };
      });
    }, mapTestHookKey);
    if (!corinthSelectionClearedCheck || corinthSelectionClearedCheck.selectedCorinthPointCount !== 0) {
      throw new Error(
        `Routes real-data check: closing place panel should clear selected route-point style (${JSON.stringify(
          corinthSelectionClearedCheck
        )}).`
      );
    }
    if (corinthSelectionClearedCheck.search.includes("place=corinth")) {
      throw new Error(
        `Routes real-data check: closing place panel should clear place= from URL (${corinthSelectionClearedCheck.search}).`
      );
    }
    const dualPanelTabsLayoutChecks = [];
    for (const viewportWidth of [1280, 1440]) {
      dualPanelTabsLayoutChecks.push(await verifyRouteTabsAvoidPanelsAndToggle(viewportWidth));
    }
    await desktopPage.goto(`${baseUrl}/?tab=map&place=corinth`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage.locator("section[aria-label='Place details'][data-route-place-panel='false']").waitFor({ timeout: 30_000 });
    const singlePanelTabsPosition = await desktopPage.evaluate(() => {
      const tabs = document.querySelector("[role='tablist'][aria-label='View']");
      if (!(tabs instanceof HTMLElement)) {
        return null;
      }
      const style = tabs.style;
      const rect = tabs.getBoundingClientRect();
      return {
        leftStyle: style.left,
        transformStyle: style.transform,
        centerX: rect.left + rect.width / 2,
        viewportCenterX: window.innerWidth / 2
      };
    });
    if (!singlePanelTabsPosition) {
      throw new Error("Routes real-data check: missing view tabs for single-panel map-tab position check.");
    }
    if (
      singlePanelTabsPosition.leftStyle !== "50%" ||
      singlePanelTabsPosition.transformStyle !== "translateX(-50%)"
    ) {
      throw new Error(
        `Routes real-data check: single-panel map-tab view tabs position changed (${JSON.stringify(singlePanelTabsPosition)}).`
      );
    }
    if (Math.abs(singlePanelTabsPosition.centerX - singlePanelTabsPosition.viewportCenterX) > 1.5) {
      throw new Error(
        `Routes real-data check: single-panel map-tab view tabs should stay centered (${JSON.stringify(singlePanelTabsPosition)}).`
      );
    }
    await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-rome`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);

    const alexandriaLink = desktopPage.getByRole("button", { name: "Alexandria" }).first();
    await alexandriaLink.waitFor({ timeout: 30_000 });
    await alexandriaLink.scrollIntoViewIfNeeded();
    await alexandriaLink.click({ force: true });
    const alexandriaHeading = desktopPage
      .locator("section[aria-label='Place details'][data-route-place-panel='true']")
      .getByRole("heading", { level: 1, name: "Alexandria" });
    if (!(await alexandriaHeading.isVisible().catch(() => false))) {
      await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-rome&place=alexandria`, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(desktopPage);
    }
    await alexandriaHeading.waitFor({ timeout: 30_000 });
    const alexandriaMentionedLabelCount = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return 0;
      }
      return map
        .queryRenderedFeatures(undefined, {
          layers: ["ibm-routes-mentioned-labels", "ibm-routes-mentioned-label-selected"]
        })
        .filter((feature) => feature.properties?.stopId === "alexandria").length;
    }, mapTestHookKey);
    if (alexandriaMentionedLabelCount < 1) {
      throw new Error("Routes real-data check: expected Alexandria's name to render on the route.");
    }

    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("heading", { level: 2, name: "Routes" }).waitFor({ timeout: 30_000 });
    const routesAncientAttributionCheck = await desktopPage.evaluate(() => {
      const controlText = document.querySelector(".maplibregl-ctrl-attrib-inner")?.textContent ?? "";
      const awmcMatches = controlText.match(/AWMC Geodata/gu) ?? [];
      return {
        attribution: controlText.trim(),
        awmcCount: awmcMatches.length
      };
    });
    if (routesAncientAttributionCheck.awmcCount !== 1) {
      throw new Error(
        `Routes real-data check: expected one AWMC credit on ancient routes map, got ${routesAncientAttributionCheck.awmcCount}. attribution='${routesAncientAttributionCheck.attribution}'`
      );
    }

    const openedRouteChecks = [];
    let arrowsRenderedCount = 0;
    for (const route of expectedRoutes) {
      const button = desktopPage.getByRole("button", { name: route.title });
      await button.waitFor({ state: "visible", timeout: 30_000 });
      const buttonText = ((await button.textContent()) ?? "").replace(/\s+/gu, " ").trim();
      const expectedStageLabel = `${route.stageCount} stage${route.stageCount === 1 ? "" : "s"}`;
      if (!buttonText.includes(expectedStageLabel)) {
        throw new Error(`Routes real-data check: '${route.title}' should show '${expectedStageLabel}', got '${buttonText}'.`);
      }

      await button.click();
      await desktopPage.getByRole("heading", { name: route.title }).waitFor({ timeout: 30_000 });
      const stageCount = await desktopPage.locator("[data-route-stage-index]").count();
      if (stageCount !== route.stageCount) {
        throw new Error(
          `Routes real-data check: '${route.title}' should open with ${route.stageCount} stages, got ${stageCount}.`
        );
      }

      openedRouteChecks.push({ route: route.title, stageCount });
      if (route.title === "Paul's second journey") {
        const hoveredStage = desktopPage.locator("[data-route-stage-index='3']");
        await hoveredStage.hover();
        await desktopPage.waitForTimeout(120);
        arrowsRenderedCount = await desktopPage.evaluate((testHook) => {
          const map = window[testHook];
          if (!map) {
            return 0;
          }
          return map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-lines-arrows"] }).length;
        }, mapTestHookKey);
        if (arrowsRenderedCount < 1) {
          throw new Error("Routes real-data check: expected at least one rendered route direction arrow.");
        }
        await desktopPage.screenshot({ path: screenshotPaths.desktopPaul2Hovered, fullPage: true });
      }
      if (route.title === "Paul's voyage to Rome") {
        const hoveredStage = desktopPage.locator("[data-route-stage-index='2']");
        await hoveredStage.hover();
        await desktopPage.waitForTimeout(120);
        await desktopPage.screenshot({ path: screenshotPaths.desktopPaulRomeHovered, fullPage: true });
      }
      if (route.title === "Jesus' early ministry") {
        const segment = desktopPage.locator("[data-route-stage-index='5']");
        await segment.click();
        await desktopPage.waitForTimeout(180);
        await desktopPage.screenshot({ path: screenshotPaths.desktopJesusSelected, fullPage: true });
      }
      await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
      await desktopPage.getByRole("heading", { level: 2, name: "Routes" }).waitFor({ timeout: 30_000 });
    }

    await desktopPage.getByRole("button", { name: "Paul's voyage to Rome" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's voyage to Rome" }).waitFor({ timeout: 30_000 });
    await desktopPage
      .locator("[data-route-stage-index]")
      .filter({ hasText: "By sea" })
      .filter({ hasText: "Passed:" })
      .first()
      .waitFor({ timeout: 30_000 });

    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("button", { name: "Paul's second journey" }).click();
    await desktopPage
      .locator("[data-route-stage-index]")
      .filter({ hasText: "Through" })
      .first()
      .waitFor({ timeout: 30_000 });

    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("button", { name: "Jesus' early ministry" }).click();
    const noLineStage = desktopPage
      .locator("[data-route-stage-index]")
      .filter({ hasText: "Site disputed" })
      .first();
    await noLineStage.waitFor({ timeout: 30_000 });
    await desktopPage
      .locator("[data-route-stage-index]")
      .filter({ hasText: "Path not known" })
      .first()
      .waitFor({ timeout: 30_000 });
    const notesSection = desktopPage.locator("[data-route-notes='true']");
    await notesSection.scrollIntoViewIfNeeded();
    await desktopPage.screenshot({ path: screenshotPaths.desktopRouteNotesEnd, fullPage: true });

    await desktopPage.getByRole("button", { name: "‹ All routes" }).click();
    await desktopPage.getByRole("button", { name: "Paul's first journey" }).click();
    await desktopPage.getByRole("heading", { name: "Paul's first journey" }).waitFor({ timeout: 30_000 });
    await desktopPage.locator("[data-route-panel-sources='true'] summary", { hasText: "Sources" }).click();
    const routeSourcesText = await desktopPage
      .locator("[data-route-panel-sources='true'] [data-route-sources-list='true']")
      .innerText();
    if (routeSourcesText.includes("Bibliography ")) {
      throw new Error("Routes real-data check: route-level Sources still show Bibliography fallback labels.");
    }
    await desktopPage.locator("[data-route-stage-index='1'] summary", { hasText: "Sources" }).click();
    const stageSourcesText = await desktopPage
      .locator("[data-route-stage-index='1'] [data-route-sources-list='true']")
      .innerText();
    if (stageSourcesText.includes("Bibliography ")) {
      throw new Error("Routes real-data check: stage-level Sources still show Bibliography fallback labels.");
    }
    await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-3`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage.getByRole("heading", { name: "Paul's third journey" }).waitFor({ timeout: 30_000 });
    const clickedLateStageLine = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return false;
      }
      const features = map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-lines-foreground"] });
      const target = features.find((feature) => Number(feature.properties?.stageIndex) === 13);
      if (!target) {
        return false;
      }
      const geometry = target.geometry;
      if (!geometry || (geometry.type !== "LineString" && geometry.type !== "MultiLineString")) {
        return false;
      }
      const coordinates =
        geometry.type === "LineString"
          ? geometry.coordinates
          : geometry.coordinates.flat();
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return false;
      }
      const midpoint = coordinates[Math.floor(coordinates.length / 2)];
      if (!Array.isArray(midpoint) || midpoint.length < 2) {
        return false;
      }
      const point = map.project([midpoint[0], midpoint[1]]);
      map.fire("click", {
        point,
        lngLat: { lng: midpoint[0], lat: midpoint[1] }
      });
      return true;
    }, mapTestHookKey);
    if (!clickedLateStageLine) {
      throw new Error("Routes real-data check: could not click late-stage route line on map.");
    }
    await desktopPage
      .locator("[data-route-stage-index='14'][data-route-stage-selected='true']")
      .waitFor({ timeout: 30_000 });

    await desktopPage.goto(`${baseUrl}/?tab=routes&route=jesus-4&stage=5`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage
      .getByRole("heading", { name: "Jesus' final journey to Jerusalem" })
      .waitFor({ timeout: 30_000 });
    await desktopPage
      .locator("[data-route-stage-index='5'][data-route-stage-selected='true']")
      .waitFor({ timeout: 30_000 });

    await desktopPage.goto(`${baseUrl}/?tab=routes&route=jesus&stage=9`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await waitForMapToSettle(desktopPage);
    await desktopPage.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
    await desktopPage.getByRole("heading", { name: "Jesus' early ministry" }).waitFor({ timeout: 30_000 });
    const normalizedLegacyDeepLink = await desktopPage.evaluate(() => {
      const params = new URLSearchParams(window.location.search);
      return { route: params.get("route"), stage: params.get("stage") };
    });
    if (
      normalizedLegacyDeepLink.route !== "jesus-1" ||
      normalizedLegacyDeepLink.stage !== "6"
    ) {
      throw new Error(
        `Routes real-data check: expected legacy jesus deep link to normalize to route=jesus-1&stage=6, got ${JSON.stringify(normalizedLegacyDeepLink)}.`
      );
    }
    await desktopPage.waitForFunction((testHook) => Boolean(window[testHook]), mapTestHookKey, {
      timeout: 30_000
    });
    const jesusDeepLinkFitCheck = await desktopPage.evaluate(async (testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      const center = map.getCenter();
      const bounds = map.getBounds();
      const viewportStops = map.queryRenderedFeatures(undefined, { layers: ["ibm-routes-stops"] });
      const pointsSource = map.getSource("ibm-route-points");
      const pointsData =
        pointsSource && typeof pointsSource.getData === "function"
          ? await pointsSource.getData()
          : null;
      const sourceFeatures = Array.isArray(pointsData?.features) ? pointsData.features : [];
      const mentioned = sourceFeatures.filter((feature) => feature.properties?.kind === "mentioned");
      const mentionedIds = mentioned.map((feature) => {
        const stopKind = feature.properties?.stopKind ?? "";
        const stopId = feature.properties?.stopId ?? "";
        return `${stopKind}:${stopId}`;
      });
      const uniqueMentionedIds = new Set(mentionedIds);
      return {
        zoom: map.getZoom(),
        center: [center.lng, center.lat],
        differsFromOverview:
          Math.abs(map.getZoom() - 4.7) > 0.25 ||
          Math.abs(center.lng - 22.5) > 0.8 ||
          Math.abs(center.lat - 35) > 0.8,
        allStopsInViewport: viewportStops.every((feature) => {
          const coordinates = feature.geometry?.coordinates;
          if (!Array.isArray(coordinates) || coordinates.length < 2) {
            return false;
          }
          return bounds.contains([coordinates[0], coordinates[1]]);
        }),
        renderedStopCount: viewportStops.length,
        mentionedCount: mentionedIds.length,
        uniqueMentionedCount: uniqueMentionedIds.size
      };
    }, mapTestHookKey);
    if (!jesusDeepLinkFitCheck) {
      throw new Error("Routes real-data check: could not inspect Jesus deep-link fit state.");
    }
    if (!jesusDeepLinkFitCheck.differsFromOverview || !jesusDeepLinkFitCheck.allStopsInViewport || jesusDeepLinkFitCheck.renderedStopCount < 1) {
      throw new Error(
        `Routes real-data check: deep link route fit failed for Jesus (${JSON.stringify(jesusDeepLinkFitCheck)}).`
      );
    }
    if (
      jesusDeepLinkFitCheck.mentionedCount !== 1 ||
      jesusDeepLinkFitCheck.mentionedCount !== jesusDeepLinkFitCheck.uniqueMentionedCount
    ) {
      throw new Error(
        `Routes real-data check: duplicate mentioned place features found (${JSON.stringify(jesusDeepLinkFitCheck)}).`
      );
    }

    const zoomPreservedAfterToggle = await desktopPage.evaluate(async (testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      map.jumpTo({ zoom: 7.6 });
      await new Promise((resolve) => map.once("idle", resolve));
      return { beforeToggleZoom: map.getZoom() };
    }, mapTestHookKey);
    await desktopPage.locator("button[role='radio'][data-map-mode='modern']").click();
    await desktopPage.waitForTimeout(900);
    const zoomAfterMapToggle = await desktopPage.evaluate((testHook) => {
      const map = window[testHook];
      if (!map) {
        return null;
      }
      return { afterToggleZoom: map.getZoom() };
    }, mapTestHookKey);
    if (!zoomPreservedAfterToggle || !zoomAfterMapToggle) {
      throw new Error("Routes real-data check: could not verify zoom persistence across map-mode toggle.");
    }
    if (Math.abs(zoomPreservedAfterToggle.beforeToggleZoom - zoomAfterMapToggle.afterToggleZoom) > 0.05) {
      throw new Error(
        `Routes real-data check: zoom changed after Ancient → Modern toggle (${JSON.stringify({
          before: zoomPreservedAfterToggle.beforeToggleZoom,
          after: zoomAfterMapToggle.afterToggleZoom
        })}).`
      );
    }
    await desktopPage.locator("button[role='radio'][data-map-mode='ancient']").click();
    await desktopPage.waitForTimeout(500);

    await desktopPage.goto(`${baseUrl}/?tab=routes&route=paul-rome&stage=3`, {
      waitUntil: "domcontentloaded",
      timeout: 150_000
    });
    await desktopPage.locator("[data-routes-panel='true']").waitFor({ state: "visible", timeout: 30_000 });
    await desktopPage.getByRole("heading", { name: "Paul's voyage to Rome" }).waitFor({ timeout: 30_000 });
    const selectedStage = await desktopPage
      .locator("[data-route-stage-index='3']")
      .getAttribute("data-route-stage-selected");
    if (selectedStage !== "true") {
      throw new Error(`Routes real-data check: deep link did not reopen stage 3 (selected=${selectedStage}).`);
    }

    if (consoleErrors.length > 0) {
      throw new Error(`Routes real-data check: console errors detected: ${consoleErrors.join(" | ")}`);
    }

    const tabletContext = await browser.newContext({
      viewport: { width: 1024, height: 900 },
      reducedMotion: "no-preference"
    });
    const tabletPage = await tabletContext.newPage();
    let tabletRoutePlacePanelBehavior = null;
    try {
      await tabletPage.goto(`${baseUrl}/?tab=routes&route=paul-2`, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(tabletPage);
      await tabletPage.locator("[data-routes-panel='true']").waitFor({ timeout: 30_000 });
      await clickRouteStopById(tabletPage, "corinth");
      await tabletPage.getByRole("heading", { level: 1, name: "Corinth" }).waitFor({ timeout: 30_000 });
      const backToRouteLink = tabletPage.locator("[data-back-to-route='true']");
      await backToRouteLink.waitFor({ timeout: 30_000 });
      const routePanelVisibleWhilePlaceOpen = await tabletPage.locator("[data-routes-panel='true']").isVisible();
      if (routePanelVisibleWhilePlaceOpen) {
        throw new Error("Routes real-data check: route panel should be replaced at 1024px when place panel opens.");
      }
      await backToRouteLink.click();
      await tabletPage.locator("[data-routes-panel='true']").waitFor({ timeout: 30_000 });
      tabletRoutePlacePanelBehavior = { replacedAt1024: true };
    } finally {
      await tabletPage.close();
      await tabletContext.close();
    }

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    let phoneRoutePlacePanelBehavior = null;
    try {
      await mobilePage.goto(`${baseUrl}/?tab=routes&route=paul-2&stage=3`, {
        waitUntil: "domcontentloaded",
        timeout: 150_000
      });
      await waitForMapToSettle(mobilePage);
      await mobilePage.locator("[data-routes-panel='true']").waitFor({ timeout: 30_000 });
      await mobilePage.getByRole("heading", { name: "Paul's second journey" }).waitFor({ timeout: 30_000 });
      await clickRouteStopById(mobilePage, "corinth");
      await mobilePage.getByRole("heading", { level: 1, name: "Corinth" }).waitFor({ timeout: 30_000 });
      const backToRouteLink = mobilePage.locator("[data-back-to-route='true']");
      await backToRouteLink.waitFor({ timeout: 30_000 });
      await backToRouteLink.click();
      await mobilePage.locator("[data-routes-panel='true']").waitFor({ timeout: 30_000 });
      phoneRoutePlacePanelBehavior = { replacedOnPhone: true };
      await mobilePage.screenshot({ path: screenshotPaths.phoneRouteSelected, fullPage: true });
    } finally {
      await mobilePage.close();
      await mobileContext.close();
    }

    return {
      openedRouteChecks,
      arrowsRenderedCount,
      routesAncientAttributionCheck,
      jesusDeepLinkFitCheck,
      zoomPreservedAfterToggle,
      zoomAfterMapToggle,
      deepLinkSelectedStage: selectedStage,
      routeSelectionLongTaskSummary,
      routeSelectionRenderer,
      routePlaceVisibilityCheck,
      realHoverSetDataCounts,
      routeDotSuppressionChecks,
      corinthDeepLinkStageSelected,
      dualPanelTabsLayoutChecks,
      singlePanelTabsPosition,
      tabletRoutePlacePanelBehavior,
      phoneRoutePlacePanelBehavior,
      screenshotPaths,
      consoleErrorCount: consoleErrors.length
    };
  } finally {
    await desktopPage.close();
    await desktopContext.close();
  }
}

export {
  buildFixtureGeneratedOutput,
  buildProvinceFixturePlaces,
  buildSyntheticPlaces,
  captureDeviceScaleCrop,
  captureFallbackSelectionScreenshot,
  captureGalileeCollisionBoxes,
  captureScenario,
  distDirectory,
  fallbackStatusMessage,
  galleryScreenshotDirectoryName,
  loadExpectedDrawerTextFromLicenses,
  mapTestHookKey,
  panelHeaderScreenshotDirectoryName,
  runPanelOpenSmoothnessCheck,
  runSmoothnessCheck,
  readJsonIfExists,
  startStaticServer,
  temporaryGalleryScreenshotPath,
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
  verifyImportantPlacesFirstOnOverview,
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
  verifyRoutesTabRealDataScenarios,
  verifyScaleBarUpdatesWithZoom,
  verifySearchMenuAndAccessibility,
  verifySelectedMajorNameAlwaysShows,
  verifyShowAllPassages,
  verifySimplePanelHeaderWithCountries,
  verifyTarsusNameShowsAndClicks,
  verifyTimelineTickLabelsDoNotOverlapAcrossLayouts,
  verifyTimelineUiWithFixtureData,
  verifyTouchTapTargetOnNames
};
