import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { buildAncientAppData } from "./lib/ancient-app-data-builder.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const distDirectory = path.join(repositoryRoot, "app", "dist");
const generatedPlacesPath = path.join(
  repositoryRoot,
  "app",
  "public",
  "generated",
  "places.index.json"
);
const generatedTimelinePath = path.join(
  repositoryRoot,
  "app",
  "public",
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
const smoothnessLayerIds = {
  clusters: "ibm-cluster-circle",
  cityPins: "ibm-city-pin",
  pinLabels: "ibm-pin-label-standard",
  clusterSource: "ibm-clustered-city-pins"
};
const mapLayerIds = {
  areaLabels: [
    "ibm-major-area-label-overview",
    "ibm-major-area-label",
    "ibm-area-label-overview",
    "ibm-area-label",
    "ibm-selected-area-label"
  ],
  majorClusterPins: "ibm-major-cluster-circle",
  majorClusterLabelLayers: ["ibm-major-cluster-label", "ibm-major-cluster-label-left"],
  clusterPins: "ibm-cluster-circle",
  majorPins: "ibm-major-pin",
  majorPinLabels: ["ibm-pin-label", "ibm-pin-label-left"],
  cityPins: "ibm-city-pin",
  sitePins: "ibm-site-pin",
  candidatePins: "ibm-candidate-pin",
  pinLabels: [
    "ibm-major-cluster-label",
    "ibm-major-cluster-label-left",
    "ibm-pin-label",
    "ibm-pin-label-left",
    "ibm-pin-label-standard",
    "ibm-selected-major-pin-label",
    "ibm-selected-pin-label"
  ],
  ancientHolderLabels: ["ibm-ancient-holder-label", "ibm-ancient-holder-label-clickable"],
  ancientAreaFill: "ibm-ancient-area-fill",
  ancientUncertainFill: "ibm-ancient-uncertain-fill"
};
const allClusterPinLayerIds = [mapLayerIds.majorClusterPins, mapLayerIds.clusterPins];
const allClusterLabelLayerIds = [...mapLayerIds.majorClusterLabelLayers, mapLayerIds.clusterPins];
const allCityPinLayerIds = [mapLayerIds.majorPins, mapLayerIds.cityPins];
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
  });

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

    await route.continue();
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
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
    await waitForMapToSettle(page);
    await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
      timeout: 30_000
    });

    await page.getByRole("button", { name: "Show image 5 of 10" }).click();
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
  await page.waitForSelector("canvas.maplibregl-canvas", { timeout: 30_000 });
  await page.waitForSelector("button[data-place-entry-id]", { timeout: 30_000 });
  // A fixed delay isn't enough on a slow or busy machine (software WebGL on CI runners), so also
  // wait until the camera has stopped and every tile has loaded, then allow for label placement.
  await page.waitForFunction(
    (testHookKey) => {
      const map = window[testHookKey];
      return Boolean(map && map.loaded() && !map.isMoving() && map.areTilesLoaded());
    },
    mapTestHookKey,
    { timeout: 60_000, polling: 250 }
  );
  // One-time start-up changes, such as the attribution collapsing after 5 s (LICENSES.md L4),
  // must finish before any gesture is measured, so settle no earlier than 8 s after navigation.
  await page.waitForFunction(() => performance.now() >= 8_000, undefined, { timeout: 60_000, polling: 250 });
  await page.waitForTimeout(1_500);
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

    if (element.matches("button[data-map-control]") || element.closest(".maplibregl-ctrl")) {
      return {
        category: "map-control",
        descriptor:
          element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "map control"
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
  const firstMapControlIndex = sequence.findIndex((item) => item.category === "map-control");
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
    firstMapControlIndex < 0 ||
    firstPlaceIndex < 0 ||
    firstPanelIndex < 0 ||
    firstMapControlIndex <= firstSearchIndex ||
    firstPlaceIndex <= firstMapControlIndex ||
    firstPanelIndex <= firstPlaceIndex
  ) {
    throw new Error(
      `Unexpected tab-group order. Sequence: ${sequence.map((item) => item.category).join(" -> ")}`
    );
  }
}

async function verifyKeyboardOrderAndEscapeBehavior(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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
  });

  const postEscapeFocus = await getActiveElementSnapshot(page);
  if (postEscapeFocus.category !== "search") {
    throw new Error(
      `Escape from URL selection should focus search, got '${postEscapeFocus.category}'.`
    );
  }

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
  }, openerEntryId);

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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
  });

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
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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
  });
  const emmausExpanded = await candidateToggle.getAttribute("aria-expanded");
  const candidateSupportControlId = await candidateToggle.getAttribute("aria-controls");

  await page.keyboard.press("Space");
  await page.waitForFunction(() => {
    const button = document.querySelector(
      "section[aria-label='Place details'] button[data-candidate-support-toggle='true']"
    );
    return button instanceof HTMLButtonElement && button.getAttribute("aria-expanded") === "false";
  });
  const emmausCollapsed = await candidateToggle.getAttribute("aria-expanded");

  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
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
    await route.continue();
  });

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
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
        waitUntil: "networkidle",
        timeout: 60_000
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

  await page.goBack({ waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.evaluate((testHookKey) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }

    map.jumpTo({
      center: [35.5754, 32.8809],
      zoom: 11
    });
  }, mapTestHookKey);
  await waitForMapToSettle(page);

  const probe = await page.evaluate(
    ({
      testHookKey,
      cityPinsLayerIds,
      sitePinsLayerId,
      candidatePinsLayerId,
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

      const resolveCapernaumPoint = () => {
        for (const layerId of [candidatePinsLayerId, sitePinsLayerId, ...cityPinsLayerIds]) {
          const features = map.queryRenderedFeatures(undefined, { layers: [layerId] });
          for (const feature of features) {
            if (feature.geometry?.type !== "Point" || feature.properties?.placeId !== "capernaum") {
              continue;
            }

            const [lng, lat] = feature.geometry.coordinates;
            const point = map.project([lng, lat]);
            if (
              point.x < margin ||
              point.y < margin ||
              point.x > width - margin ||
              point.y > height - margin
            ) {
              continue;
            }

            return {
              x: point.x,
              y: point.y
            };
          }
        }

        return null;
      };

      const capernaumPoint = resolveCapernaumPoint();
      if (!capernaumPoint) {
        return null;
      }

      const findEmptyPoint = () => {
        const step = 20;
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
        capernaumPoint,
        emptyPoint: findEmptyPoint()
      };
    },
    {
      testHookKey: mapTestHookKey,
      cityPinsLayerIds: allCityPinLayerIds,
      sitePinsLayerId: mapLayerIds.sitePins,
      candidatePinsLayerId: mapLayerIds.candidatePins,
      interactiveLayers: [
        ...allClusterPinLayerIds,
        ...allClusterLabelLayerIds,
        mapLayerIds.candidatePins,
        mapLayerIds.sitePins,
        ...allCityPinLayerIds,
        ...mapLayerIds.areaLabels
      ]
    }
  );
  if (!probe?.capernaumPoint || !probe.emptyPoint) {
    throw new Error(`Could not resolve map probe points for cursor/click checks: ${JSON.stringify(probe)}`);
  }

  await page.mouse.move(probe.capernaumPoint.x, probe.capernaumPoint.y);
  const cursorOverPin = await page.$eval("canvas.maplibregl-canvas", (element) =>
    window.getComputedStyle(element).cursor
  );
  if (!cursorOverPin.includes("pointer")) {
    throw new Error(`Cursor over Capernaum pin should be pointer, got '${cursorOverPin}'.`);
  }

  await page.mouse.move(probe.emptyPoint.x, probe.emptyPoint.y);
  const cursorOverEmptyMap = await page.$eval("canvas.maplibregl-canvas", (element) =>
    window.getComputedStyle(element).cursor
  );
  if (cursorOverEmptyMap.includes("pointer")) {
    throw new Error(`Cursor over empty map should not be pointer, got '${cursorOverEmptyMap}'.`);
  }

  await page.mouse.click(probe.capernaumPoint.x + 6, probe.capernaumPoint.y + 6);
  await page.waitForFunction(() => {
    const parameters = new URLSearchParams(window.location.search.slice(1));
    return parameters.get("place") === "capernaum";
  }, undefined, { timeout: 30_000, polling: 100 });
  await page.getByRole("heading", { level: 1, name: "Capernaum" }).waitFor({ timeout: 30_000 });

  return {
    capernaumPoint: probe.capernaumPoint,
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
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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
    const focusRestored = await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active instanceof HTMLElement && active.getAttribute("data-image-viewer-open") === "true"
      );
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

  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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

    route.continue();
  });

  try {
    await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=jericho`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=italy`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=roman-empire`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  const empireNamesText =
    (await page
      .locator("section[aria-label='Place details'] [data-panel-section='names']")
      .textContent()) ?? "";
  if (!empireNamesText.includes("Empire")) {
    throw new Error(`Empire record must render the 'Empire' hierarchy line, got '${empireNamesText.trim()}'.`);
  }

  await page.goto(`${baseUrl}/?place=achaia`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.keyboard.press("/");
  await page.waitForFunction(() => {
    const active = document.activeElement;
    return Boolean(active && active.matches("input[aria-label='Search biblical places']"));
  });
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
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
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
        waitUntil: "networkidle",
        timeout: 60_000
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
          });
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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
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
    await page.waitForTimeout(2_000);
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
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
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

async function verifyNormalLoadStaysOnMainBasemap(browser, baseUrl, pathWithQuery) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const requestUrls = [];
  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
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
    await page.waitForTimeout(30_000);

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
      setStyleCallCount: setStyleCalls.length,
      versaTilesRequestCount,
      attributionText
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyModernMapToggle(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);

  const timelineSliderCount = await page.locator("input[data-timeline-slider='true']").count();
  const sourcesButtonCount = await page.getByRole("button", { name: "Sources" }).count();
  const mapKeyCount = await page.getByRole("button", { name: "Map key" }).count();

  if (timelineSliderCount !== 0 || sourcesButtonCount !== 0 || mapKeyCount !== 0) {
    throw new Error(
      `Default build should hide timeline/layer UI when ancient data is absent. slider=${timelineSliderCount}, sources=${sourcesButtonCount}, mapKey=${mapKeyCount}`
    );
  }

  return {
    timelineSliderCount,
    sourcesButtonCount,
    mapKeyCount
  };
}

async function verifyTimelineUiWithDefaultData(page, baseUrl, timelinePayload) {
  const sortedStops = [...timelinePayload.stops].sort((left, right) => left.year - right.year);
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  const timelineSlider = page.locator("input[data-timeline-slider='true']").first();
  await timelineSlider.waitFor({ state: "visible", timeout: 30_000 });

  const tickCount = await page.locator("[data-timeline-tick-stop-id]").count();
  if (tickCount !== sortedStops.length) {
    throw new Error(`Expected ${sortedStops.length} timeline ticks in default build, got ${tickCount}.`);
  }

  const earlierButton = page.getByRole("button", { name: "Earlier change" });
  const laterButton = page.getByRole("button", { name: "Later change" });
  const alignmentChecks = [];
  for (let index = 0; index < sortedStops.length; index += 1) {
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
    const tickLocator = page.locator(`[data-timeline-tick-stop-id="${sortedStops[index].id}"]`).first();
    const thumbLocator = page.locator("[data-timeline-slider-thumb='true']").first();
    await tickLocator.waitFor({ state: "visible", timeout: 30_000 });
    await thumbLocator.waitFor({ state: "visible", timeout: 30_000 });
    const tickBox = await tickLocator.boundingBox();
    const thumbBox = await thumbLocator.boundingBox();
    if (!tickBox || !thumbBox) {
      throw new Error(`Missing tick or thumb geometry for default stop '${sortedStops[index].id}'.`);
    }

    const tickCenterX = tickBox.x + tickBox.width / 2;
    const thumbCenterX = thumbBox.x + thumbBox.width / 2;
    const deltaPx = Math.abs(tickCenterX - thumbCenterX);
    if (deltaPx > 2) {
      throw new Error(
        `Default timeline tick misaligned for stop '${sortedStops[index].id}': ${deltaPx.toFixed(2)}px from thumb center.`
      );
    }

    alignmentChecks.push({
      stopId: sortedStops[index].id,
      deltaPx
    });
  }

  const labelFit = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("[data-timeline-tick-stop-id] span:nth-child(2)"))
      .map((node) => {
        if (!(node instanceof HTMLElement)) {
          return null;
        }
        const bounds = node.getBoundingClientRect();
        return {
          text: node.textContent?.trim() ?? "",
          left: bounds.left,
          right: bounds.right,
          width: bounds.width
        };
      })
      .filter((entry) => entry && entry.width > 0);
    const collisions = [];
    for (let index = 1; index < labels.length; index += 1) {
      const previous = labels[index - 1];
      const current = labels[index];
      if (previous.right > current.left) {
        collisions.push({
          leftLabel: previous.text,
          rightLabel: current.text,
          overlapPx: previous.right - current.left
        });
      }
    }

    const slider = document.querySelector("[data-timeline-slider='true']");
    const sliderWidth = slider instanceof HTMLElement ? slider.getBoundingClientRect().width : null;
    const maxHalfPair = labels.reduce((maxValue, current, index) => {
      if (index === 0) {
        return maxValue;
      }
      const previous = labels[index - 1];
      return Math.max(maxValue, previous.width / 2 + current.width / 2 + 2);
    }, 0);
    const requiredSliderWidthPx =
      labels.length > 1 ? Math.ceil(maxHalfPair * (labels.length - 1) + 20) : sliderWidth;
    return {
      sliderWidth,
      collisions,
      requiredSliderWidthPx
    };
  });
  if (labelFit.collisions.length > 0) {
    throw new Error(
      `Default timeline tick labels overlap at 1440x960: ${JSON.stringify(labelFit.collisions)}`
    );
  }

  await page.goto(`${baseUrl}/?year=50`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.evaluate(async ({ testHookKey }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    await new Promise((resolve) => {
      map.once("moveend", resolve);
      map.easeTo({
        center: [35.2, 31.8],
        zoom: 7,
        duration: 0
      });
    });
  }, { testHookKey: mapTestHookKey });
  await waitForMapToSettle(page);
  const labelsAtAd50 = await page.evaluate(({ testHookKey, areaLayerIds }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const rendered = map.queryRenderedFeatures(undefined, {
      layers: areaLayerIds
    });
    const provinceLabelIds = new Set(
      rendered
        .filter((feature) => feature.properties?.areaKind === "province")
        .map((feature) => feature.properties?.placeId)
        .filter((placeId) => typeof placeId === "string")
    );

    return {
      provinceLabelIds: [...provinceLabelIds]
    };
  }, { testHookKey: mapTestHookKey, areaLayerIds: mapLayerIds.areaLabels });

  if (labelsAtAd50.provinceLabelIds.length === 0) {
    throw new Error(
      `Expected province labels at AD 50, got ${JSON.stringify(labelsAtAd50.provinceLabelIds)}.`
    );
  }

  await page.goto(`${baseUrl}/?year=44`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.evaluate(async ({ testHookKey }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    await new Promise((resolve) => {
      map.once("moveend", resolve);
      map.easeTo({
        center: [35.2, 31.8],
        zoom: 7,
        duration: 0
      });
    });
  }, { testHookKey: mapTestHookKey });
  await waitForMapToSettle(page);
  const judeaAtAd44 = await page.evaluate(({ testHookKey, areaLayerIds }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const rendered = map.queryRenderedFeatures(undefined, {
      layers: areaLayerIds
    });
    return rendered.some((feature) => feature.properties?.placeId === "judea-province");
  }, { testHookKey: mapTestHookKey, areaLayerIds: mapLayerIds.areaLabels });
  const judeaProvinceShownAtAd50 = labelsAtAd50.provinceLabelIds.includes("judea-province");
  if (judeaProvinceShownAtAd50 && judeaAtAd44) {
    throw new Error("Judea province label should be hidden in AD 44.");
  }
  await page.goto(`${baseUrl}/?year=41`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  const judeaAtAd41 = await page.evaluate(({ testHookKey, areaLayerIds }) => {
    const map = window[testHookKey];
    if (!map) {
      throw new Error("Map test hook is unavailable.");
    }
    const rendered = map.queryRenderedFeatures(undefined, {
      layers: areaLayerIds
    });
    return rendered.some((feature) => feature.properties?.placeId === "judea-province");
  }, { testHookKey: mapTestHookKey, areaLayerIds: mapLayerIds.areaLabels });
  if (judeaProvinceShownAtAd50 && judeaAtAd41) {
    throw new Error("Judea province label should be hidden in AD 41.");
  }

  await page.goto(`${baseUrl}/?year=44`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.getByRole("button", { name: "Sources" }).click();
  await page.locator("[data-timeline-sources-popover='true']").waitFor({
    state: "visible",
    timeout: 5_000
  });
  const defaultPopoverSnapshot = await page.evaluate(() => {
    const popover = document.querySelector("[data-timeline-sources-popover='true']");
    if (!(popover instanceof HTMLElement)) {
      return null;
    }

    const passageItems = Array.from(popover.querySelectorAll("li"))
      .map((item) => item.textContent?.trim() ?? "")
      .filter((value) => value.length > 0);
    const sourceTexts = passageItems.filter((value) => !/^[A-Z][a-z]{1,}\s+\d+:\d+/u.test(value));
    return {
      text: popover.textContent?.trim() ?? "",
      sourceTexts
    };
  });
  if (!defaultPopoverSnapshot || defaultPopoverSnapshot.text.length === 0) {
    throw new Error("Expected AD 44 timeline sources popover content.");
  }
  if (defaultPopoverSnapshot.sourceTexts.some((text) => text.includes("Bibliography "))) {
    throw new Error(
      `Default AD 44 sources popover showed bibliography fallback text: ${JSON.stringify(defaultPopoverSnapshot.sourceTexts)}`
    );
  }

  const holderTooltipText = await page.evaluate(
    async ({ testHookKey, holderLayerId }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const rendered = map.queryRenderedFeatures(undefined, { layers: [holderLayerId] });
      const holderFeature = rendered.find((feature) => {
        const coordinates = feature?.geometry?.coordinates;
        return (
          feature?.geometry?.type === "Point" &&
          Array.isArray(coordinates) &&
          coordinates.length >= 2 &&
          typeof coordinates[0] === "number" &&
          typeof coordinates[1] === "number"
        );
      });
      if (!holderFeature) {
        return null;
      }

      const [lng, lat] = holderFeature.geometry.coordinates;
      const projected = map.project([lng, lat]);
      return { x: projected.x, y: projected.y };
    },
    { testHookKey: mapTestHookKey, holderLayerId: mapLayerIds.ancientHolderLabels[0] }
  );
  let holderTooltipValue = null;
  if (holderTooltipText) {
    await page.mouse.move(holderTooltipText.x, holderTooltipText.y);
    await page.waitForTimeout(150);
    holderTooltipValue = (await page.locator("div[role='tooltip']").textContent())?.trim() ?? null;
    if (!holderTooltipValue || (!holderTooltipValue.includes(" – ") && !holderTooltipValue.includes("from "))) {
      throw new Error(`Expected holder tooltip with years, got '${holderTooltipValue ?? ""}'.`);
    }
  }

  await page.goto(`${baseUrl}/?year=44`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  const unclearTooltipText = await page.evaluate(
    async ({ testHookKey, uncertainLayerId }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      await new Promise((resolve) => {
        map.once("moveend", resolve);
        map.easeTo({
          center: [30.88, 37.22],
          zoom: 7,
          duration: 0
        });
      });

      const center = map.project(map.getCenter());
      const offsets = [
        [0, 0], [20, 0], [-20, 0], [0, 20], [0, -20], [30, 30], [-30, -30], [30, -30], [-30, 30]
      ];
      for (const [dx, dy] of offsets) {
        const point = [center.x + dx, center.y + dy];
        const features = map.queryRenderedFeatures(point, { layers: [uncertainLayerId] });
        const match = features.find((feature) => {
          const tooltipText = feature?.properties?.tooltipText;
          return (
            typeof tooltipText === "string" &&
            tooltipText.startsWith("Status unclear in the sources")
          );
        });
        if (match) {
          return { x: point[0], y: point[1] };
        }
      }

      return null;
    },
    {
      testHookKey: mapTestHookKey,
      uncertainLayerId: mapLayerIds.ancientUncertainFill
    }
  );
  let unclearTooltipValue = null;
  if (unclearTooltipText) {
    await page.mouse.move(unclearTooltipText.x, unclearTooltipText.y);
    await page.waitForTimeout(150);
    unclearTooltipValue = (await page.locator("div[role='tooltip']").textContent())?.trim() ?? null;
    if (!unclearTooltipValue || !unclearTooltipValue.startsWith("Status unclear in the sources")) {
      throw new Error(`Expected unclear-area tooltip, got '${unclearTooltipValue ?? ""}'.`);
    }
  }

  const renderedHolderLabelsWithLocation = await page.evaluate(
    async ({ testHookKey, holderLayerIds, sortedStopIds }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }
      const slider = document.querySelector("input[data-timeline-slider='true']");
      const stopIndex = slider instanceof HTMLInputElement ? Number.parseInt(slider.value, 10) : -1;
      const stopId = Number.isFinite(stopIndex) && stopIndex >= 0 ? sortedStopIds[stopIndex] : null;
      if (!stopId) {
        return [];
      }

      const stopResponse = await fetch(`/generated/ancient.stop.${encodeURIComponent(stopId)}.json`, {
        cache: "no-store"
      });
      if (!stopResponse.ok) {
        throw new Error(`Could not load stop payload for '${stopId}' (${stopResponse.status}).`);
      }
      const stopPayload = await stopResponse.json();
      const holdersWithLocation = new Set(
        Array.isArray(stopPayload.areas)
          ? stopPayload.areas
              .filter((area) => typeof area?.holderLocationId === "string" && area.holderLocationId.length > 0)
              .map((area) => area.holderId)
          : []
      );

      const rendered = map.queryRenderedFeatures(undefined, { layers: holderLayerIds });
      return rendered
        .map((feature) => String(feature.properties?.holderId ?? "").trim())
        .filter((holderId) => holderId.length > 0 && holdersWithLocation.has(holderId));
    },
    {
      testHookKey: mapTestHookKey,
      holderLayerIds: mapLayerIds.ancientHolderLabels,
      sortedStopIds: sortedStops.map((stop) => stop.id)
    }
  );
  if (renderedHolderLabelsWithLocation.length > 0) {
    throw new Error(
      `AD 44 rendered holder labels should exclude holders with locationId, got ${JSON.stringify(renderedHolderLabelsWithLocation)}`
    );
  }

  return {
    stopCount: sortedStops.length,
    alignmentChecks,
    labelFit,
    provinceLabelsAtAd50: labelsAtAd50.provinceLabelIds,
    judeaProvinceShownAtAd50,
    judeaProvinceVisibleAtAd41: judeaAtAd41,
    judeaProvinceVisibleAtAd44: judeaAtAd44,
    holderTooltipText: holderTooltipValue,
    unclearTooltipText: unclearTooltipValue,
    renderedHolderLabelsWithLocation
  };
}

async function buildFixtureGeneratedOutput() {
  const outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ibm-m4-05-fixture-generated-"));
  const [timelineData, ancientAreasData, ancientRoadsData, ancientCoastlineData, ancientEmpireEdgeData, bibliography] =
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
      await route.continue();
    }
  });

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
    await waitForMapToSettle(page);
    await page.locator("input[data-timeline-slider='true']").waitFor({ state: "visible", timeout: 30_000 });
    const timelineSlider = page.locator("input[data-timeline-slider='true']").first();
    await page.waitForTimeout(1_000);
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
    if (longTasksOverBudget.length > 0) {
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
      await page.waitForTimeout(150);
      const tooltipText = await page.locator("div[role='tooltip']").textContent();
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
        await route.continue();
      }
    });
    try {
      await failurePage.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
    timeout: 30_000
  });

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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
    throw new Error("Overview cluster-overlap check was vacuous: no clusters were rendered.");
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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
    majorPinLayerId,
    majorClusterLayerId,
    majorPinLabelLayerIds,
    majorClusterLabelLayerIds
  }
) {
  return page.evaluate(
    ({
      testHookKey,
      majorPinLayerId,
      majorClusterLayerId,
      majorPinLabelLayerIds,
      majorClusterLabelLayerIds
    }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const symbolLayerIds = [majorPinLayerId, majorClusterLayerId];
      const majorLabelLayerIds = [...majorPinLabelLayerIds, ...majorClusterLabelLayerIds];
      const majorClusterLabelLayerIdSet = new Set(majorClusterLabelLayerIds);

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
      majorPinLayerId,
      majorClusterLayerId,
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
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
        majorPinLayerId: mapLayerIds.majorPins,
        majorClusterLayerId: mapLayerIds.majorClusterPins,
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

      if (majorLabelAttachment.orphanLabels.length > 0) {
        throw new Error(
          `Overview major labels did not map to rendered major symbols at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            majorLabelAttachment.orphanLabels
          )}`
        );
      }

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
  const sevenChurchPlaceIds = new Set(asiaMinorSevenChurchPlaceIds);
  const results = [];

  for (const viewport of targetViewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    try {
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
      await waitForMapToSettle(page);
      await waitForMapStyleLoaded(page);
      await setMapView(page, {
        center: [28.35, 38.4],
        zoom: 6.5
      });
      await waitForMapToSettle(page);

      const pinSnapshot = await page.evaluate(
        ({ testHookKey, majorPinLayerId, majorClusterLayerId }) => {
          const map = window[testHookKey];
          if (!map) {
            throw new Error("Map test hook is unavailable.");
          }

          const visibleMajorPinPlaceIds = Array.from(
            new Set(
              map
                .queryRenderedFeatures(undefined, { layers: [majorPinLayerId] })
                .map((feature) => String(feature.properties?.placeId ?? "").trim())
                .filter((placeId) => placeId.length > 0)
            )
          ).sort();

          const visibleMajorClusterIds = Array.from(
            new Set(
              map
                .queryRenderedFeatures(undefined, { layers: [majorClusterLayerId] })
                .map((feature) => Number(feature.properties?.cluster_id))
                .filter((clusterId) => Number.isFinite(clusterId))
            )
          );

          return {
            visibleMajorPinPlaceIds,
            majorClusterCount: visibleMajorClusterIds.length,
            majorClusterIds: visibleMajorClusterIds
          };
        },
        {
          testHookKey: mapTestHookKey,
          majorPinLayerId: mapLayerIds.majorPins,
          majorClusterLayerId: mapLayerIds.majorClusterPins
        }
      );

      const majorLabelAttachment = await collectMajorLabelAttachmentDiagnostics(page, {
        majorPinLayerId: mapLayerIds.majorPins,
        majorClusterLayerId: mapLayerIds.majorClusterPins,
        majorPinLabelLayerIds: mapLayerIds.majorPinLabels,
        majorClusterLabelLayerIds: mapLayerIds.majorClusterLabelLayers
      });

      const missingSevenChurchPins = asiaMinorSevenChurchPlaceIds
        .filter((placeId) => !pinSnapshot.visibleMajorPinPlaceIds.includes(placeId));
      if (missingSevenChurchPins.length > 0) {
        throw new Error(
          `Asia Minor zoom 6.5 is missing seven-church major pins at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            missingSevenChurchPins
          )}. Visible major pins: ${JSON.stringify(pinSnapshot.visibleMajorPinPlaceIds)}`
        );
      }

      if (pinSnapshot.majorClusterCount > 0) {
        throw new Error(
          `Asia Minor zoom 6.5 should render separate major pins (no major clusters) at ${viewport.width}x${viewport.height}, but found: ${JSON.stringify(
            pinSnapshot.majorClusterIds
          )}`
        );
      }

      const sevenChurchLabelKeys = new Set(
        majorLabelAttachment.majorLabels
          .filter((label) => !label.isCluster && sevenChurchPlaceIds.has(label.placeId ?? ""))
          .map((label) => label.key)
      );
      const sevenChurchVisibleLabelPlaceIds = Array.from(
        new Set(
          majorLabelAttachment.majorLabels
            .filter((label) => !label.isCluster && sevenChurchPlaceIds.has(label.placeId ?? ""))
            .map((label) => label.placeId)
            .filter((placeId) => typeof placeId === "string" && placeId.length > 0)
        )
      ).sort();

      if (sevenChurchVisibleLabelPlaceIds.length === 0) {
        throw new Error(
          `Asia Minor zoom 6.5 rendered no seven-church labels at ${viewport.width}x${viewport.height}.`
        );
      }

      const sevenChurchNearestPinMismatches = majorLabelAttachment.nearestPinMismatches.filter(
        (entry) => sevenChurchLabelKeys.has(entry.key)
      );
      if (sevenChurchNearestPinMismatches.length > 0) {
        throw new Error(
          `Asia Minor zoom 6.5 has seven-church labels attached to the wrong symbol at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            sevenChurchNearestPinMismatches
          )}`
        );
      }

      const sevenChurchLabelCoveringOtherPins = majorLabelAttachment.labelCoveringOtherPins.filter(
        (entry) => sevenChurchLabelKeys.has(entry.key)
      );
      if (sevenChurchLabelCoveringOtherPins.length > 0) {
        throw new Error(
          `Asia Minor zoom 6.5 has seven-church labels intersecting other major pins at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            sevenChurchLabelCoveringOtherPins
          )}`
        );
      }

      results.push({
        viewport,
        center: [28.35, 38.4],
        zoom: 6.5,
        sevenChurchPinCount: asiaMinorSevenChurchPlaceIds.length,
        sevenChurchVisiblePinPlaceIds: asiaMinorSevenChurchPlaceIds,
        sevenChurchVisibleLabelPlaceIds,
        majorLabelAttachment
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
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
            const isCluster = String(feature.layer?.id ?? "") === clusterLayerId;
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
            const isCluster = String(feature.layer?.id ?? "") === majorClusterLayerId;
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
            majorStandardOverlapSamples
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
        majorPinLayerId: mapLayerIds.majorPins,
        majorClusterLayerId: mapLayerIds.majorClusterPins,
        majorPinLabelLayerIds: mapLayerIds.majorPinLabels,
        majorClusterLabelLayerIds: mapLayerIds.majorClusterLabelLayers
      });

      if (overlap.majorStandardOverlapCount > 0) {
        throw new Error(
          `Jerusalem/Galilee zoom 6 has major-vs-standard overlaps at ${viewport.width}x${viewport.height}: ${JSON.stringify(
            overlap.majorStandardOverlapSamples
          )}`
        );
      }

      if (majorLabelAttachment.majorLabelCount === 0) {
        throw new Error(
          `Jerusalem/Galilee zoom 6 rendered no major labels at ${viewport.width}x${viewport.height}.`
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
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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

      const majorSource = map.getSource(majorSourceId);
      if (!majorSource || typeof majorSource.getClusterLeaves !== "function") {
        throw new Error("Major clustered source is unavailable.");
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
        const leaves = await majorSource.getClusterLeaves(
          clusterSummary.clusterId,
          clusterSummary.pointCount,
          0
        );
        const members = leaves
          .map((feature) => {
            const placeId = String(feature.properties?.placeId ?? "").trim();
            const placeName = String(feature.properties?.placeName ?? "").trim();
            const importanceRank = Number(feature.properties?.importanceRank);
            if (!placeId || !placeName || !Number.isFinite(importanceRank)) {
              return null;
            }
            return { placeId, placeName, importanceRank };
          })
          .filter((value) => value !== null)
          .sort((left, right) => left.importanceRank - right.importanceRank);

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
      standardPinLabelLayerId: "ibm-pin-label-standard"
    }
  );

  if (overview.missingMajorIds.length > 0) {
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
  if (jerusalemNearbyCount !== 4) {
    throw new Error(
      `Jerusalem cluster should include 4 nearby places, got ${jerusalemNearbyCount}.`
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
      standardPinLabelLayerId: "ibm-pin-label-standard"
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
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
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

  await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "networkidle", timeout: 60_000 });
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

async function verifyCandidatePinColorRendering(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
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
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
    await page.goto(`${baseUrl}/?place=galilee`, { waitUntil: "networkidle", timeout: 60_000 });
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
      return route.continue();
    }

    if (abortMode === "all-requests") {
      return route.abort("failed");
    }

    if (abortMode === "pbf-only" && requestUrl.includes(".pbf")) {
      return route.abort("failed");
    }

    return route.continue();
  });

  page.on("requestfinished", (request) => {
    requestUrls.push(request.url());
  });
  page.on("requestfailed", (request) => {
    failedRequestUrls.push(request.url());
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector("canvas.maplibregl-canvas", { timeout: 30_000 });
    await page.waitForFunction((testHookKey) => Boolean(window[testHookKey]), mapTestHookKey, {
      timeout: 30_000
    });
    await page.waitForTimeout(1_000);

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
    route.continue();
  });

  try {
    await page.goto(`${baseUrl}${pathWithQuery}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000
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
  await page.waitForTimeout(450);
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
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
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
      await page.waitForTimeout(2_000);

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
    await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
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
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 90_000 });
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
      await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 90_000 });
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

          const visibleMajorClusterCenters = map
            .queryRenderedFeatures(undefined, { layers: [majorClusterLayerId] })
            .map((feature) => feature?.geometry?.coordinates)
            .filter(
              (coordinates) =>
                Array.isArray(coordinates) &&
                coordinates.length >= 2 &&
                typeof coordinates[0] === "number" &&
                typeof coordinates[1] === "number"
            )
            .map((coordinates) => {
              const projected = map.project([coordinates[0], coordinates[1]]);
              return { x: projected.x, y: projected.y };
            });

          const mapBounds = map.getCanvas().getBoundingClientRect();
          const isInMapViewport = (point) =>
            point.x >= 0 && point.y >= 0 && point.x <= mapBounds.width && point.y <= mapBounds.height;
          const majorClusterHitRadiusPx = 34;
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
            const coveringCluster = visibleMajorClusterCenters.find(
              (clusterCenter) =>
                Math.hypot(clusterCenter.x - projected.x, clusterCenter.y - projected.y) <=
                majorClusterHitRadiusPx
            );
            requiredCoverage[placeId] = coveringCluster ? { kind: "cluster" } : null;
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

      for (const place of requiredOpeningPlaces) {
        if (coverage[place.id]) {
          continue;
        }

        throw new Error(
          `Phone opening view ${viewport.width}x${viewport.height} is missing drawn coverage for '${place.label}'. visibleMajorPinPlaceIds=${JSON.stringify(
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
      await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "networkidle", timeout: 90_000 });
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
              throw new Error("Selected place feature is not visible on map.");
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
              mapLayerIds.majorPins,
              mapLayerIds.cityPins,
              mapLayerIds.sitePins,
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

        await page.click(selector);
        await page.waitForFunction(
          () => {
            const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
            return (
              compactControl instanceof HTMLElement &&
              compactControl.classList.contains("maplibregl-compact-show")
            );
          },
          { timeout: 5_000 }
        );
        await page.click(selector);
        await page.waitForFunction(
          () => {
            const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
            return (
              compactControl instanceof HTMLElement &&
              !compactControl.classList.contains("maplibregl-compact-show")
            );
          },
          { timeout: 5_000 }
        );

        return reachability;
      };

      await page.getByRole("button", { name: "Close place panel" }).click();
      await page.waitForSelector("section[aria-label='Place details']", {
        state: "hidden",
        timeout: 30_000
      });
      const attributionClosedReachability = await verifyCompactAttributionToggle("closed");
      await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "networkidle", timeout: 90_000 });
      await waitForMapToSettle(page);
      await page.waitForSelector("section[aria-label='Place details']", {
        state: "visible",
        timeout: 45_000
      });

      const collapsedSheet = await readSheetSnapshot();
      if (!collapsedSheet.panelBounds || !collapsedSheet.handleBounds || !collapsedSheet.closeBounds) {
        throw new Error(`Phone panel controls missing at ${viewport.width}x${viewport.height}.`);
      }

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

      if (collapsedSheet.selectedPointPx.y >= collapsedSheet.panelBounds.top - 8) {
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
    await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "networkidle", timeout: 90_000 });
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

    await page.click("summary.maplibregl-ctrl-attrib-button");
    await page.waitForFunction(
      () => {
        const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
        return (
          compactControl instanceof HTMLElement &&
          compactControl.classList.contains("maplibregl-compact-show")
        );
      },
      { timeout: 5_000 }
    );
    await page.click("summary.maplibregl-ctrl-attrib-button");
    await page.waitForFunction(
      () => {
        const compactControl = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
        return (
          compactControl instanceof HTMLElement &&
          !compactControl.classList.contains("maplibregl-compact-show")
        );
      },
      { timeout: 5_000 }
    );

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
      await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 90_000 });
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
      await page.goto(scenario.url, { waitUntil: "networkidle", timeout: 90_000 });
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
      await page.goto(scenario.url, { waitUntil: "networkidle", timeout: 90_000 });
      await waitForMapToSettle(page);
      await page.waitForSelector("summary.maplibregl-ctrl-attrib-button", {
        state: "visible",
        timeout: 30_000
      });
      await page.click("summary.maplibregl-ctrl-attrib-button");
      await page.waitForFunction(
        () => {
          const compact = document.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact");
          return compact instanceof HTMLElement && compact.classList.contains("maplibregl-compact-show");
        },
        { timeout: 5_000 }
      );

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
        let centerElementTag = null;
        let toggleHit = false;
        if (toggle instanceof HTMLElement) {
          const rect = toggle.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const centerElement = document.elementFromPoint(centerX, centerY);
          centerElementTag = centerElement?.tagName?.toLowerCase() ?? null;
          toggleHit =
            centerElement === toggle ||
            (centerElement instanceof HTMLElement && toggle.contains(centerElement));
        }

        return {
          timelineBounds: toBounds(timelineCard),
          attributionBounds: toBounds(compactControl),
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
      if (!snapshot.toggleHit) {
        throw new Error(
          `Attribution toggle is occluded in ${scenario.label}: centerElement=${snapshot.centerElementTag}`
        );
      }

      results.push({
        label: scenario.label,
        viewport: scenario.viewport,
        timelineBounds: snapshot.timelineBounds,
        attributionBounds: snapshot.attributionBounds
      });
    } finally {
      await page.close();
      await context.close();
    }
  }

  return results;
}

async function run() {
  const staticServer = await startStaticServer(distDirectory);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  const workerConsoleEvents = [];
  const workerErrors = [];
  const requestUrls = [];
  const workerUrls = [];

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

  const screenshotPaths = {
    overview: temporaryScreenshotPath("ibm-m3-04-overview.png"),
    searchResults: temporaryScreenshotPath("ibm-m3-05-search-results.png"),
    creditsDrawer: temporaryScreenshotPath("ibm-m3-05-credits-drawer.png"),
    capernaum: temporaryScreenshotPath("ibm-m3-04-capernaum.png"),
    galilee: temporaryScreenshotPath("ibm-m3-04-galilee.png"),
    emmaus: temporaryScreenshotPath("ibm-m3-04-emmaus.png"),
    jerusalemSiteZoom: temporaryScreenshotPath("ibm-m3-04-jerusalem-site-zoom.png"),
    canaCrop3x: temporaryScreenshotPath("ibm-m3-04-cana-crop-3x.png"),
    emmausCrop3x: temporaryScreenshotPath("ibm-m3-04-emmaus-crop-3x.png"),
    galileeCollisionBoxes: temporaryScreenshotPath("ibm-m3-04-galilee-collision-boxes.png"),
    fallbackCapernaum: temporaryScreenshotPath("ibm-m3-04-fallback-capernaum.png"),
    fallbackGalilee: temporaryScreenshotPath("ibm-m3-04-fallback-galilee.png"),
    fallbackPbfOutage: temporaryScreenshotPath("ibm-m3-04-fallback-pbf-outage.png"),
    fallbackAllRequestsOutage: temporaryScreenshotPath("ibm-m3-04-fallback-all-requests-outage.png"),
    ephesusPanelHeader: temporaryPanelHeaderScreenshotPath("ephesus-panel.png"),
    emmausPanelHeader: temporaryPanelHeaderScreenshotPath("emmaus-panel.png"),
    jerusalemPanelHeader: temporaryPanelHeaderScreenshotPath("jerusalem-panel.png"),
    ephesusSearchResult: temporaryPanelHeaderScreenshotPath("ephesus-search-result.png")
  };
  let fixtureGeneratedDirectory = null;

  try {
    const expectedDrawerText = await loadExpectedDrawerTextFromLicenses();

    const normalLoadMainBasemapChecks = [
      await verifyNormalLoadStaysOnMainBasemap(browser, staticServer.baseUrl, "/"),
      await verifyNormalLoadStaysOnMainBasemap(browser, staticServer.baseUrl, "/?place=galilee"),
      await verifyNormalLoadStaysOnMainBasemap(browser, staticServer.baseUrl, "/?map=modern"),
      await verifyNormalLoadStaysOnMainBasemap(
        browser,
        staticServer.baseUrl,
        "/?map=modern&place=galilee"
      )
    ];

    await captureScenario(page, staticServer.baseUrl, screenshotPaths.overview);
    await captureScenario(
      page,
      `${staticServer.baseUrl}/?place=capernaum`,
      screenshotPaths.capernaum,
      {
        panelHeading: "Capernaum"
      }
    );
    await captureScenario(
      page,
      `${staticServer.baseUrl}/?place=galilee`,
      screenshotPaths.galilee,
      {
        panelHeading: "Galilee"
      }
    );
    await captureScenario(page, `${staticServer.baseUrl}/?place=emmaus`, screenshotPaths.emmaus, {
      panelHeading: "Emmaus",
      requireCandidateLetters: [0, 1, 2, 3]
    });
    await captureScenario(
      page,
      `${staticServer.baseUrl}/?place=jerusalem`,
      screenshotPaths.jerusalemSiteZoom,
      {
        panelHeading: "Jerusalem",
        zoomJerusalemToSiteLevel: true
      }
    );
    await captureDeviceScaleCrop(
      browser,
      `${staticServer.baseUrl}/?place=galilee`,
      screenshotPaths.canaCrop3x,
      { panelHeading: "Galilee" }
    );
    await captureDeviceScaleCrop(
      browser,
      `${staticServer.baseUrl}/?place=emmaus`,
      screenshotPaths.emmausCrop3x,
      { panelHeading: "Emmaus" }
    );
    const panelSectionAndCreditChecks = await verifyPanelSectionOrderAndPhotoCredits(
      page,
      staticServer.baseUrl
    );
    const aboutPlaceLinkChecks = await verifyAboutPlaceLinksOpenPlacesAndSupportBack(
      page,
      staticServer.baseUrl
    );
    const pointerCursorAndNearPinClickCheck = await verifyPointerCursorAndNearPinClick(
      page,
      staticServer.baseUrl
    );
    const galleryFixtureChecks = await verifyGalleryFixtureWithViewer(
      browser,
      staticServer.baseUrl
    );
    const capernaumLeadImageLoadCheck = await verifyCapernaumLeadImageLoads(
      page,
      staticServer.baseUrl
    );
    const imageFailurePlaceholderCheck = await verifyImageFailurePlaceholderKeepsCredit(
      browser,
      staticServer.baseUrl
    );
    const disputedAndHierarchyChecks = await verifyDisputedAndHierarchyLayouts(
      page,
      staticServer.baseUrl
    );
    const simpleHeaderChecks = await verifySimplePanelHeaderWithCountries(page, staticServer.baseUrl, {
      ephesusPanel: screenshotPaths.ephesusPanelHeader,
      emmausPanel: screenshotPaths.emmausPanelHeader,
      jerusalemPanel: screenshotPaths.jerusalemPanelHeader,
      ephesusSearchResult: screenshotPaths.ephesusSearchResult
    });
    const showAllPassagesCheck = await verifyShowAllPassages(page, staticServer.baseUrl);
    const panelAccessibilityCheck = await verifyPanelAccessibility(browser, staticServer.baseUrl);
    const panelMapDomStability = await verifyPanelDoesNotMutateMapDom(page, staticServer.baseUrl);
    const overviewClusterOverlap = await verifyAreaLabelsAvoidClustersOnOverview(
      page,
      staticServer.baseUrl
    );
    const overviewSearchBoxLabelOverlap = await verifyLabelsAvoidSearchBoxOnOverview(
      page,
      staticServer.baseUrl
    );
    const galileePinOverlap = await verifyAreaLabelsAvoidPins(
      page,
      `${staticServer.baseUrl}/?place=galilee`
    );
    const pinLabelRegression = await verifyPinLabelRegression(page, staticServer.baseUrl);
    const importantPlacesFirstCheck = await verifyImportantPlacesFirstOnOverview(
      page,
      staticServer.baseUrl
    );
    const openingCameraBaselineCheck = await verifyOpeningCameraBaseline(
      browser,
      staticServer.baseUrl
    );
    const overviewLabelReadabilityCheck = await verifyOverviewLabelReadabilityAcrossViewports(
      browser,
      staticServer.baseUrl
    );
    const jerusalemGalileeZoom6Check = await verifyJerusalemGalileeAtZoom6(
      browser,
      staticServer.baseUrl
    );
    const asiaMinorSevenChurchesZoom65Check = await verifyAsiaMinorSevenChurchesAtZoom65(
      browser,
      staticServer.baseUrl
    );
    const candidatePinColorCheck = await verifyCandidatePinColorRendering(
      page,
      staticServer.baseUrl
    );
    const candidateSelectionCheck = await verifyCandidateSelectionUpdatesUrl(
      page,
      staticServer.baseUrl
    );
    await captureGalileeCollisionBoxes(
      browser,
      staticServer.baseUrl,
      screenshotPaths.galileeCollisionBoxes
    );

    const keyboardAndEscapeChecks = await verifyKeyboardOrderAndEscapeBehavior(
      page,
      staticServer.baseUrl
    );
    const modernMapToggleChecks = await verifyModernMapToggle(page, staticServer.baseUrl);
    const defaultTimelinePayload = await readJsonIfExists(generatedTimelinePath);
    const noTimelineUiCheck = defaultTimelinePayload
      ? null
      : await verifyNoTimelineUiOnDefaultBuild(page, staticServer.baseUrl);
    const defaultTimelineChecks = defaultTimelinePayload
      ? await verifyTimelineUiWithDefaultData(page, staticServer.baseUrl, defaultTimelinePayload)
      : null;
    fixtureGeneratedDirectory = await buildFixtureGeneratedOutput();
    const timelineFixtureChecks = await verifyTimelineUiWithFixtureData(
      browser,
      staticServer.baseUrl,
      fixtureGeneratedDirectory
    );
    const searchAndMenuChecks = await verifySearchMenuAndAccessibility(
      page,
      staticServer.baseUrl,
      screenshotPaths.searchResults,
      screenshotPaths.creditsDrawer,
      expectedDrawerText
    );
    const desktopAttributionReachabilityCheck = await verifyDesktopAttributionReachability(
      browser,
      staticServer.baseUrl
    );
    const expandedAttributionPlacementChecks = await verifyExpandedAttributionAboveTimeline(
      browser,
      staticServer.baseUrl
    );
    const phoneBasicsChecks = await verifyPhoneBasics(browser, staticServer.baseUrl);
    const scaleBarUpdateCheck = await verifyScaleBarUpdatesWithZoom(browser, staticServer.baseUrl);
    const timelineTickLabelOverlapChecks = await verifyTimelineTickLabelsDoNotOverlapAcrossLayouts(
      browser,
      staticServer.baseUrl
    );
    const keyboardDisclosureChecks = await verifyKeyboardDisclosureControls(
      page,
      staticServer.baseUrl
    );
    const placeDetailsRaceCheck = await verifyPlaceDetailsFetchRaceRecovery(
      browser,
      staticServer.baseUrl
    );

    const fallbackPbfOutage = await verifyFallbackOutageMode({
      browser,
      baseUrl: staticServer.baseUrl,
      mode: "pbf-only",
      screenshotPath: screenshotPaths.fallbackPbfOutage
    });
    const fallbackAllRequestsOutage = await verifyFallbackOutageMode({
      browser,
      baseUrl: staticServer.baseUrl,
      mode: "all-requests",
      screenshotPath: screenshotPaths.fallbackAllRequestsOutage
    });
    const fallbackModernPbfOutage = await verifyFallbackOutageMode({
      browser,
      baseUrl: staticServer.baseUrl,
      mode: "pbf-only",
      pathWithQuery: "/?map=modern",
      screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-modern-pbf-outage.png")
    });
    const fallbackModernAllRequestsOutage = await verifyFallbackOutageMode({
      browser,
      baseUrl: staticServer.baseUrl,
      mode: "all-requests",
      pathWithQuery: "/?map=modern",
      screenshotPath: temporaryScreenshotPath("ibm-m4-04-fallback-modern-all-requests-outage.png")
    });
    await captureFallbackSelectionScreenshot({
      browser,
      baseUrl: staticServer.baseUrl,
      pathWithQuery: "/?place=capernaum",
      screenshotPath: screenshotPaths.fallbackCapernaum,
      panelHeading: "Capernaum"
    });
    await captureFallbackSelectionScreenshot({
      browser,
      baseUrl: staticServer.baseUrl,
      pathWithQuery: "/?place=galilee",
      screenshotPath: screenshotPaths.fallbackGalilee,
      panelHeading: "Galilee"
    });

    const basePlaces = JSON.parse(await fs.readFile(generatedPlacesPath, "utf8"));
    const overviewAreaLabelFixtureCheck = await verifyAreaLabelsOverviewWithProvinceFixture(
      browser,
      staticServer.baseUrl,
      basePlaces
    );

    const smoothnessReal = await runSmoothnessCheck({
      browser,
      baseUrl: staticServer.baseUrl,
      requestUrls,
      pageErrors,
      consoleErrors,
      workerUrls,
      workerConsoleEvents,
      workerErrors
    });
    const syntheticPlaces = buildSyntheticPlaces(basePlaces, 10_000);

    const smoothnessSynthetic = await runSmoothnessCheck({
      browser,
      baseUrl: staticServer.baseUrl,
      requestUrls,
      pageErrors,
      consoleErrors,
      workerUrls,
      workerConsoleEvents,
      workerErrors,
      syntheticPlacesPayload: syntheticPlaces,
      zoom8Center: [39.5, 33],
      syntheticCoverageExpectations: {
        "overview-clustered": {
          minimumVisibleEstimate: 9_500,
          minimumClusterFeatures: 1
        },
        "zoom8-unclustered": {
          minimumSyntheticPins: 70,
          maximumClusterFeatures: 0
        }
      }
    });

    assertSmoothnessScenarios("real-data smoothness", smoothnessReal);
    assertSmoothnessScenarios("synthetic-data smoothness", smoothnessSynthetic);
    const panelOpenSmoothness = await runPanelOpenSmoothnessCheck({
      browser,
      baseUrl: staticServer.baseUrl,
      requestUrls,
      pageErrors,
      consoleErrors,
      workerUrls,
      workerConsoleEvents,
      workerErrors
    });
    assertSmoothnessResult("panel-open smoothness", panelOpenSmoothness);

    const tileRequestCount = requestUrls.filter(
      (url) => url.includes("tiles.openfreemap.org") || url.includes("tiles.versatiles.org")
    ).length;
    const workerRequestUrls = requestUrls.filter(
      (url) => url.includes("maplibre-gl-worker.mjs") || url.includes("maplibre-gl-shared.mjs")
    );

    const result = {
      baseUrl: staticServer.baseUrl,
      tileRequestCount,
      workerRequestUrls,
      workerUrls,
      pageErrors,
      consoleErrors,
      workerConsoleEvents,
      panelSectionAndCreditChecks,
      aboutPlaceLinkChecks,
      pointerCursorAndNearPinClickCheck,
      galleryFixtureChecks,
      capernaumLeadImageLoadCheck,
      imageFailurePlaceholderCheck,
      disputedAndHierarchyChecks,
      simpleHeaderChecks,
      showAllPassagesCheck,
      panelAccessibilityCheck,
      panelMapDomStability,
      pinLabelRegression,
      importantPlacesFirstCheck,
      openingCameraBaselineCheck,
      overviewLabelReadabilityCheck,
      jerusalemGalileeZoom6Check,
      asiaMinorSevenChurchesZoom65Check,
      candidatePinColorCheck,
      candidateSelectionCheck,
      overviewAreaLabelFixtureCheck,
      overviewClusterOverlap,
      overviewSearchBoxLabelOverlap,
      normalLoadMainBasemapChecks,
      keyboardAndEscapeChecks,
      modernMapToggleChecks,
      noTimelineUiCheck,
      defaultTimelineChecks,
      timelineFixtureChecks,
      searchAndMenuChecks,
      desktopAttributionReachabilityCheck,
      expandedAttributionPlacementChecks,
      phoneBasicsChecks,
      scaleBarUpdateCheck,
      timelineTickLabelOverlapChecks,
      keyboardDisclosureChecks,
      placeDetailsRaceCheck,
      galileePinOverlap,
      fallbackOutageChecks: {
        pbfOnly: fallbackPbfOutage,
        allRequests: fallbackAllRequestsOutage,
        modernPbfOnly: fallbackModernPbfOutage,
        modernAllRequests: fallbackModernAllRequestsOutage
      },
      smoothness: {
        realData: smoothnessReal,
        panelOpen: panelOpenSmoothness,
        syntheticData10k: {
          ...smoothnessSynthetic,
          syntheticPlacesAdded: syntheticPlaces.length - basePlaces.length
        }
      },
      notFoundPaths: staticServer.notFoundPaths,
      screenshotPaths
    };

    console.log(JSON.stringify(result, null, 2));

    const failed =
      staticServer.notFoundPaths.length > 0 ||
      pageErrors.length > 0 ||
      workerErrors.length > 0 ||
      tileRequestCount === 0 ||
      workerRequestUrls.length < 2;

    if (failed) {
      process.exitCode = 1;
    }
  } finally {
    if (fixtureGeneratedDirectory) {
      await fs.rm(fixtureGeneratedDirectory, { recursive: true, force: true });
    }
    await page.close();
    await context.close();
    await browser.close();
    await staticServer.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
