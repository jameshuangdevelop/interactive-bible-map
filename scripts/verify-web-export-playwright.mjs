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
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);

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

  return {
    emmaus: {
      controlId: candidateSupportControlId,
      expandedAfterEnter: emmausExpanded,
      collapsedAfterSpace: emmausCollapsed
    },
    jerusalem: {
      controlId: jerusalemControlId,
      expandedAfterEnter: jerusalemExpanded
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

async function verifyCopyLinkAction(browser, baseUrl) {
  const clipboardContext = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const clipboardPage = await clipboardContext.newPage();

  try {
    await clipboardPage.goto(`${baseUrl}/?place=capernaum`, {
      waitUntil: "networkidle",
      timeout: 60_000
    });
    await waitForMapToSettle(clipboardPage);
    await clipboardPage.evaluate(() => {
      window.__copiedViaClipboard = [];
      const captureWriteText = async (value) => {
        window.__copiedViaClipboard.push(String(value));
      };

      if (navigator.clipboard && typeof navigator.clipboard === "object") {
        try {
          navigator.clipboard.writeText = captureWriteText;
          return;
        } catch {
          // fall through to defineProperty path
        }
      }

      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: captureWriteText
        }
      });
    });

    await clipboardPage.getByRole("button", { name: "Copy link" }).click();
    await clipboardPage.getByText("Link copied", { exact: true }).waitFor({ timeout: 10_000 });

    const clipboardResult = await clipboardPage.evaluate(() => ({
      copiedText: window.__copiedViaClipboard[0] ?? null,
      href: window.location.href
    }));

    if (clipboardResult.copiedText !== clipboardResult.href) {
      throw new Error(
        `Copy-link clipboard path mismatch: copied='${clipboardResult.copiedText}', href='${clipboardResult.href}'.`
      );
    }

    const fallbackContext = await browser.newContext({
      viewport: { width: 1440, height: 960 }
    });
    const fallbackPage = await fallbackContext.newPage();

    try {
      await fallbackPage.goto(`${baseUrl}/?place=capernaum`, {
        waitUntil: "networkidle",
        timeout: 60_000
      });
      await waitForMapToSettle(fallbackPage);
      await fallbackPage.evaluate(() => {
        window.__copiedViaFallback = [];

        if (navigator.clipboard && typeof navigator.clipboard === "object") {
          try {
            navigator.clipboard.writeText = undefined;
          } catch {
            // Continue and try defineProperty fallback below.
          }
        }

        try {
          Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
        } catch {
          // writeText override above is enough to force fallback when clipboard exists.
        }

        const originalExecCommand = document.execCommand.bind(document);
        document.execCommand = (commandId) => {
          if (commandId === "copy") {
            const textarea = document.querySelector("textarea");
            window.__copiedViaFallback.push(
              textarea instanceof HTMLTextAreaElement ? textarea.value : null
            );
            return true;
          }
          return originalExecCommand(commandId);
        };
      });

      await fallbackPage.getByRole("button", { name: "Copy link" }).click();
      await fallbackPage.getByText("Link copied", { exact: true }).waitFor({ timeout: 10_000 });

      const fallbackResult = await fallbackPage.evaluate(() => ({
        copiedText: window.__copiedViaFallback[0] ?? null,
        fallbackCallCount: window.__copiedViaFallback.length,
        href: window.location.href
      }));
      if (fallbackResult.fallbackCallCount === 0) {
        throw new Error("Copy-link fallback path was vacuous: document.execCommand('copy') was not called.");
      }

      if (fallbackResult.copiedText !== fallbackResult.href) {
        throw new Error(
          `Copy-link fallback path mismatch: copied='${fallbackResult.copiedText}', href='${fallbackResult.href}'.`
        );
      }

      return {
        clipboardResult,
        fallbackResult
      };
    } finally {
      await fallbackPage.close();
      await fallbackContext.close();
    }
  } finally {
    if (!clipboardPage.isClosed()) {
      await clipboardPage.close();
    }
    await clipboardContext.close();
  }
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
    "actions",
    "about",
    "in-bible",
    "ot-connections",
    "places-in",
    "sources",
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

  const firstCreditText =
    (await page.locator("section[aria-label='Place details'] [data-photo-credit='true']").textContent()) ??
    "";
  if (!firstCreditText.includes("Photo:") || !firstCreditText.includes("Wikimedia Commons")) {
    throw new Error(`Missing required photo credit text on lead image: '${firstCreditText.trim()}'`);
  }

  const nextPhoto = page.locator("button[aria-label='Next photo']");
  const hasCarousel = (await nextPhoto.count()) > 0;
  let secondCreditText = null;
  if (hasCarousel) {
    await nextPhoto.first().click();
    await page.waitForTimeout(200);
    secondCreditText =
      (await page
        .locator("section[aria-label='Place details'] [data-photo-credit='true']")
        .textContent()) ?? "";
    if (
      !secondCreditText.includes("Photo:") ||
      !secondCreditText.includes("Wikimedia Commons")
    ) {
      throw new Error(
        `Photo credit did not render after switching images: '${secondCreditText.trim()}'`
      );
    }
  }

  return {
    sectionIds,
    hasCarousel,
    firstCreditText: firstCreditText.trim(),
    secondCreditText: secondCreditText?.trim() ?? null
  };
}

async function verifyCapernaumLeadImageLoads(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
    timeout: 30_000
  });
  await page.waitForFunction(() => {
    const image = document.querySelector("[data-panel-photo-image='true']");
    return (
      image instanceof HTMLImageElement &&
      image.complete &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0
    );
  });

  const imageState = await page.$eval("[data-panel-photo-image='true']", (element) => {
    if (!(element instanceof HTMLImageElement)) {
      throw new Error("Lead photo element is not an image.");
    }

    return {
      src: element.getAttribute("src") ?? "",
      currentSrc: element.currentSrc,
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight
    };
  });

  if (!/(?:^|\/)(?:330|500|960|1280)px-[^/]+$/u.test(new URL(imageState.currentSrc).pathname)) {
    throw new Error(
      `Lead photo did not use an allow-listed Commons thumbnail width: '${imageState.currentSrc}'.`
    );
  }

  return imageState;
}

async function verifyImageFailurePlaceholderKeepsCredit(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  let blockedImageCount = 0;

  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (
      requestUrl.includes("upload.wikimedia.org/wikipedia/commons") &&
      /\.(?:jpg|jpeg|png|webp)(?:\?|$)/iu.test(requestUrl)
    ) {
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
    await page.waitForSelector("section[aria-label='Place details'] [data-photo-credit='true']", {
      timeout: 30_000
    });
    await page.waitForSelector("section[aria-label='Place details'] >> text=Image unavailable", {
      timeout: 30_000
    });

    const creditText =
      (await page
        .locator("section[aria-label='Place details'] [data-photo-credit='true']")
        .textContent()) ?? "";
    if (!creditText.includes("Photo:") || !creditText.includes("Wikimedia Commons")) {
      throw new Error(
        `Photo credit must remain visible when images fail to load, got '${creditText.trim()}'.`
      );
    }
    if (blockedImageCount === 0) {
      throw new Error("Image-failure placeholder check was vacuous: no Commons images were blocked.");
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
  await page.waitForSelector("section[aria-label='Place details'] [data-disputed-banner='true']", {
    timeout: 30_000
  });

  const disputedBanner =
    (await page
      .locator("section[aria-label='Place details'] [data-disputed-banner='true']")
      .textContent()) ?? "";
  if (!disputedBanner.includes("Location disputed") || !disputedBanner.includes("4 proposed sites")) {
    throw new Error(`Disputed-place banner mismatch: '${disputedBanner.trim()}'`);
  }

  const modernNameLineCount = await page
    .locator("section[aria-label='Place details'] [data-modern-name-line='true']")
    .count();
  if (modernNameLineCount !== 0) {
    throw new Error("Disputed places must not render a modern-name line.");
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
  const jerichoDisputedBannerCount = await page
    .locator("section[aria-label='Place details'] [data-disputed-banner='true']")
    .count();
  if (jerichoDisputedBannerCount > 0) {
    throw new Error("Jericho should not render a disputed banner.");
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
    disputedBanner: disputedBanner.trim(),
    candidateCount,
    jerichoNamesText: jerichoNamesText.trim(),
    italyNamesText: italyNamesText.trim(),
    empireNamesText: empireNamesText.trim(),
    achaiaNamesText: achaiaNamesText.trim()
  };
}

async function verifyShowAllPassages(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForMapToSettle(page);
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='in-bible']", {
    timeout: 30_000
  });

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

  await page
    .locator("section[aria-label='Place details'] [data-show-all-passages='true']")
    .click();

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

  return {
    totalPassages,
    initialCount,
    finalCount
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
    fallbackAllRequestsOutage: temporaryScreenshotPath("ibm-m3-04-fallback-all-requests-outage.png")
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
    const copyLinkCheck = await verifyCopyLinkAction(browser, staticServer.baseUrl);
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
      capernaumLeadImageLoadCheck,
      imageFailurePlaceholderCheck,
      disputedAndHierarchyChecks,
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
      copyLinkCheck,
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
