import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

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
const licensesDocumentPath = path.join(repositoryRoot, "docs", "LICENSES.md");

const smoothnessLongTaskLimitMs = 50;
const syntheticPlaceIdPrefix = "synthetic-city-";
const galleryScreenshotDirectoryName = "ibm-m35-gallery";
const panelHeaderScreenshotDirectoryName = "ibm-m3-15";
const fallbackStatusMessage = "The main map service isn't responding. Showing the backup map.";
const fallbackAttributionNeedles = ["VersaTiles", "ESA WorldCover 2021"];
const mainAttributionNeedle = "OpenFreeMap";
const fallbackStylePathNeedle = "versatiles-colorful/style.json";
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
  pinLabels: "ibm-pin-label"
};
const mapLayerIds = {
  areaLabels: ["ibm-area-label-overview", "ibm-area-label"],
  clusterPins: "ibm-cluster-circle",
  clusterCounts: "ibm-cluster-count",
  cityPins: "ibm-city-pin",
  sitePins: "ibm-site-pin",
  candidatePins: "ibm-candidate-pin",
  pinLabels: "ibm-pin-label"
};
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
      notFoundPaths.push(requestUrl.pathname);
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

async function waitForPanelSectionToggle(page, sectionId) {
  const toggle = page.locator(panelSectionToggleSelector(sectionId)).first();
  await toggle.waitFor({ state: "visible", timeout: 30_000 });
  return toggle;
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

  const sectionKeyboardToggleStates = {};
  for (const sectionId of sectionToggleIds) {
    const toggle = await waitForPanelSectionToggle(page, sectionId);
    const initialExpanded = await toggle.getAttribute("aria-expanded");
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
    sectionKeyboardToggleStates[sectionId] = {
      initialExpanded,
      expandedAfterEnter,
      expandedAfterSpace
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

  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
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
    ({ testHookKey, cityPinsLayerId, sitePinsLayerId, candidatePinsLayerId, interactiveLayers }) => {
      const map = window[testHookKey];
      if (!map) {
        return null;
      }

      const canvas = map.getCanvas();
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const margin = 16;

      const resolveCapernaumPoint = () => {
        for (const layerId of [candidatePinsLayerId, sitePinsLayerId, cityPinsLayerId]) {
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
      cityPinsLayerId: mapLayerIds.cityPins,
      sitePinsLayerId: mapLayerIds.sitePins,
      candidatePinsLayerId: mapLayerIds.candidatePins,
      interactiveLayers: [
        mapLayerIds.clusterPins,
        mapLayerIds.clusterCounts,
        mapLayerIds.candidatePins,
        mapLayerIds.sitePins,
        mapLayerIds.cityPins,
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
    copyLink: await page.getByRole("button", { name: "Copy link", exact: true }).count(),
    sources: await page.getByRole("button", { name: "Sources", exact: true }).count()
  };
  if (
    removedActionButtons.zoomTo > 0 ||
    removedActionButtons.fitAllSites > 0 ||
    removedActionButtons.copyLink > 0 ||
    removedActionButtons.sources > 0
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

  return {
    totalPassages,
    initialCount,
    finalCount,
    collapsedCount,
    expandedButtonText,
    collapsedButtonText
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
    if (setStyleCalls.some((value) => value.includes(fallbackStylePathNeedle))) {
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
        mapLayerIds.clusterPins,
        mapLayerIds.cityPins,
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
    ({ testHookKey, areaLayerIds, clusterLayerId, clusterCountLayerId }) => {
      const map = window[testHookKey];
      if (!map) {
        throw new Error("Map test hook is unavailable.");
      }

      const clusters = map.queryRenderedFeatures(undefined, {
        layers: [clusterLayerId]
      });
      const clusterIdsWithCounts = new Set(
        map
          .queryRenderedFeatures(undefined, { layers: [clusterCountLayerId] })
          .map((feature) => feature.properties?.cluster_id)
      );
      const clustersWithoutCounts = clusters.filter(
        (feature) => !clusterIdsWithCounts.has(feature.properties?.cluster_id)
      );
      const collisions = [];

      for (const clusterFeature of clusters) {
        if (clusterFeature.geometry?.type !== "Point") {
          continue;
        }

        const [longitude, latitude] = clusterFeature.geometry.coordinates;
        const point = map.project([longitude, latitude]);
        const pointCount = Number(clusterFeature.properties?.point_count ?? 0);
        const circleRadius = pointCount >= 20 ? 18 : pointCount >= 8 ? 16 : 14;
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
        clustersWithoutCountCount: clustersWithoutCounts.length,
        collisionCount: collisions.length,
        collisionSamples: collisions.slice(0, 8)
      };
    },
    {
      testHookKey: mapTestHookKey,
      areaLayerIds: mapLayerIds.areaLabels,
      clusterLayerId: mapLayerIds.clusterPins,
      clusterCountLayerId: mapLayerIds.clusterCounts
    }
  );

  if (overlap.clusterCount === 0) {
    throw new Error("Overview cluster-overlap check was vacuous: no clusters were rendered.");
  }

  // Every count bubble must show its number (spec §2); a bubble without one is just a red dot.
  if (overlap.clustersWithoutCountCount > 0) {
    throw new Error(
      `${overlap.clustersWithoutCountCount} of ${overlap.clusterCount} count bubbles on the overview show no number.`
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

  const overlap = await page.evaluate(({ testHookKey, areaLayerIds, pinLabelsLayerId }) => {
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

    const labelsInsideSearchBox = map.queryRenderedFeatures(
      [
        [minX, minY],
        [maxX, maxY]
      ],
      {
        layers: [...areaLayerIds, pinLabelsLayerId]
      }
    );

    const allLabels = map.queryRenderedFeatures(undefined, {
      layers: [...areaLayerIds, pinLabelsLayerId]
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
    pinLabelsLayerId: mapLayerIds.pinLabels
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
          coordinates: [12.4964, 41.9028],
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
          coordinates: [36.181667, 36.204722],
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
          coordinates: [34.892, 32.5015],
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
    if (!labels.includes("Roman Empire")) {
      throw new Error(
        `Overview area-label fixture missing 'Roman Empire'. Rendered: ${JSON.stringify(labels)}`
      );
    }
    if (!labels.includes("Syria")) {
      throw new Error(
        `Overview area-label fixture missing 'Syria'. Rendered: ${JSON.stringify(labels)}`
      );
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
  screenshotPath
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
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
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
        `Fallback outage ${mode}: fallback notice did not appear. attribution='${attributionText}'. openfreemap finished=${openFreeMapFinished.length}, failed=${openFreeMapFailed.length}, finished sample=${JSON.stringify(openFreeMapFinished.slice(0, 5))}, failed sample=${JSON.stringify(openFreeMapFailed.slice(0, 5))}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
    await page.waitForTimeout(1_000);

    const attributionText = await readAttributionText(page);
    assertFallbackAttributionText(attributionText, `Fallback outage ${mode}`);

    const versaTilesRequests = requestUrls.filter((url) => url.includes("tiles.versatiles.org"));
    if (versaTilesRequests.length === 0) {
      throw new Error(`Fallback outage ${mode}: no VersaTiles tile requests were observed.`);
    }

    await page.screenshot({ fullPage: true, path: screenshotPath });

    return {
      mode,
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
    ({ clustersLayerId, cityPinsLayerId, pinLabelsLayerId, syntheticPrefix, testHookKey }) => {
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

      const syntheticPinCount = cityPins.filter((feature) =>
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
      const syntheticVisibleEstimate = clusterPointTotal + syntheticPinCount;
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
  if (result.mutationCount > 0) {
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

  try {
    const expectedDrawerText = await loadExpectedDrawerTextFromLicenses();

    const normalLoadMainBasemapChecks = [
      await verifyNormalLoadStaysOnMainBasemap(browser, staticServer.baseUrl, "/"),
      await verifyNormalLoadStaysOnMainBasemap(browser, staticServer.baseUrl, "/?place=galilee")
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
    const searchAndMenuChecks = await verifySearchMenuAndAccessibility(
      page,
      staticServer.baseUrl,
      screenshotPaths.searchResults,
      screenshotPaths.creditsDrawer,
      expectedDrawerText
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
      candidatePinColorCheck,
      candidateSelectionCheck,
      overviewAreaLabelFixtureCheck,
      overviewClusterOverlap,
      overviewSearchBoxLabelOverlap,
      normalLoadMainBasemapChecks,
      keyboardAndEscapeChecks,
      searchAndMenuChecks,
      keyboardDisclosureChecks,
      placeDetailsRaceCheck,
      galileePinOverlap,
      fallbackOutageChecks: {
        pbfOnly: fallbackPbfOutage,
        allRequests: fallbackAllRequestsOutage
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
