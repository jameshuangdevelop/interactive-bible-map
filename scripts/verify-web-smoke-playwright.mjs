import { chromium } from "playwright";

import { waitForMapToSettle, withResolvedBaseUrl } from "./lib/web-checks.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function readLoadedPanelImageState(page, previousSrc = null) {
  const imageSelector = "section[aria-label='Place details'] [data-panel-photo-image='true']";
  await page.waitForFunction(
    ({ selector, previousImageSource }) => {
      const image = document.querySelector(selector);
      if (!(image instanceof HTMLImageElement)) {
        return false;
      }

      if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        return false;
      }

      const currentSource = image.currentSrc || image.src || "";
      if (!currentSource) {
        return false;
      }

      if (previousImageSource && previousImageSource === currentSource) {
        return false;
      }

      return true;
    },
    { selector: imageSelector, previousImageSource: previousSrc },
    { timeout: 45_000, polling: 250 }
  );

  return page.$eval(imageSelector, (element) => {
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

function assertCreditIncludes(creditText, requiredMarkers, label) {
  for (const marker of requiredMarkers) {
    if (!creditText.includes(marker)) {
      throw new Error(`${label} is missing '${marker}' in credit line: '${creditText.trim()}'.`);
    }
  }
}

const placePanelSelector = "section[aria-label='Place details']";

function sectionToggleSelector(sectionId) {
  return `${placePanelSelector} [data-panel-section='${sectionId}'] [data-panel-section-toggle='${sectionId}']`;
}

async function assertCollapsedSectionWithCount(page, sectionId, sectionLabel) {
  const toggle = page.locator(sectionToggleSelector(sectionId)).first();
  await toggle.waitFor({ state: "visible", timeout: 45_000 });
  const expanded = await toggle.getAttribute("aria-expanded");
  assert(expanded === "false", `${sectionLabel} should start collapsed, got aria-expanded='${expanded}'.`);

  const text = ((await toggle.textContent()) ?? "").replace(/\s+/gu, " ").trim();
  const pattern = new RegExp(`^${sectionLabel} · [0-9]+$`, "u");
  assert(pattern.test(text), `${sectionLabel} heading should show a count, got '${text}'.`);
}

async function setPanelSectionExpanded(page, sectionId, expanded) {
  const toggle = page.locator(sectionToggleSelector(sectionId)).first();
  await toggle.waitFor({ state: "visible", timeout: 45_000 });
  const current = (await toggle.getAttribute("aria-expanded")) === "true";
  if (current === expanded) {
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
    { selector: sectionToggleSelector(sectionId), expectedExpanded: expanded },
    { timeout: 45_000, polling: 100 }
  );
}

async function verifyMapLoads(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForMapToSettle(page);

  const snapshot = await page.evaluate(() => ({
    mapCanvasCount: document.querySelectorAll("canvas.maplibregl-canvas").length,
    placeEntryCount: document.querySelectorAll("button[data-place-entry-id]").length
  }));

  assert(snapshot.mapCanvasCount > 0, "Map canvas did not render.");
  assert(snapshot.placeEntryCount > 0, "Visible place list did not render.");
  return snapshot;
}

async function verifyCapernaumPanelAndImages(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForMapToSettle(page);
  assert(
    page.url().includes("?place=capernaum"),
    `Capernaum deep link did not resolve as expected, got '${page.url()}'.`
  );
  await page.getByRole("heading", { level: 1, name: "Capernaum" }).waitFor({ timeout: 45_000 });
  await page.waitForSelector("section[aria-label='Place details'] [data-panel-section='photos']", {
    timeout: 45_000
  });
  const todayLineLocator = page.locator(
    "section[aria-label='Place details'] [data-modern-name-line='true']"
  );
  await todayLineLocator.first().waitFor({ timeout: 45_000 });
  const todayLineText = ((await todayLineLocator.first().textContent()) ?? "")
    .replace(/\s+/gu, " ")
    .trim();
  assert(
    todayLineText.startsWith("Today: "),
    `Expected Capernaum panel to include a Today line, got '${todayLineText}'.`
  );
  await assertCollapsedSectionWithCount(page, "sources", "Sources");
  await assertCollapsedSectionWithCount(page, "photo-credits", "Photo credits");

  const photoCreditsEntrySelector =
    "section[aria-label='Place details'] [data-panel-section='photo-credits'] [data-photo-credits-entry='true']";
  await setPanelSectionExpanded(page, "photo-credits", true);
  await page.waitForSelector(photoCreditsEntrySelector, { timeout: 45_000 });
  const inlinePhotoCreditCount = await page
    .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-credit='true']")
    .count();
  assert(
    inlinePhotoCreditCount === 0,
    `Inline panel photo-credit lines should be removed, found ${inlinePhotoCreditCount}.`
  );

  const photoCreditEntries = await page.$$eval(photoCreditsEntrySelector, (elements) =>
    elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );
  assert(photoCreditEntries.length > 0, "Capernaum should render at least one photo-credits entry.");
  const aiCreditText = photoCreditEntries[0] ?? "";
  assertCreditIncludes(
    aiCreditText,
    ["AI-generated reconstruction", "Based on: research brief"],
    "Lead AI photo-credits entry"
  );

  const aiImage = await readLoadedPanelImageState(page);
  const aiImagePath = new URL(aiImage.currentSrc).pathname;
  assert(
    aiImagePath.includes("/media/ai/"),
    `Capernaum lead image must be served from media/ai, got '${aiImage.currentSrc}'.`
  );
  await setPanelSectionExpanded(page, "photo-credits", false);

  const nextImageButton = page.getByRole("button", { name: "Next image" });
  assert((await nextImageButton.count()) > 0, "Capernaum gallery is missing a Next image control.");

  let commonsImage = null;
  let commonsCreditText = "";
  let focusedCreditEntry = null;
  let previousSrc = aiImage.currentSrc;
  const seenImageSources = new Set([aiImage.currentSrc]);

  for (let index = 0; index < 10; index += 1) {
    await nextImageButton.first().click();
    const candidateImage = await readLoadedPanelImageState(page, previousSrc);
    previousSrc = candidateImage.currentSrc;
    if (seenImageSources.has(candidateImage.currentSrc)) {
      continue;
    }
    seenImageSources.add(candidateImage.currentSrc);

    const parsed = new URL(candidateImage.currentSrc);
    if (parsed.hostname !== "upload.wikimedia.org" || !parsed.pathname.includes("/wikipedia/commons/")) {
      continue;
    }

    if (!/(?:^|\/)(?:330|500|960|1280)px-[^/]+$/u.test(parsed.pathname)) {
      throw new Error(
        `Commons image must use an allow-listed thumbnail width, got '${candidateImage.currentSrc}'.`
      );
    }

    const currentImageNumber = await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-counter='true']")
      .evaluate((element) => {
        const text = element.textContent ?? "";
        const [leading] = text.split("/");
        const parsed = Number.parseInt(leading?.trim() ?? "", 10);
        return Number.isFinite(parsed) ? parsed : 1;
      })
      .catch(() => 1);

    await page
      .locator("section[aria-label='Place details'] [data-panel-section='photos'] [data-photo-credit-link='true']")
      .first()
      .click();
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        return (
          element instanceof HTMLButtonElement &&
          element.getAttribute("aria-expanded") === "true"
        );
      },
      sectionToggleSelector("photo-credits"),
      { timeout: 45_000, polling: 100 }
    );

    await page.waitForFunction(() => {
      const activeElement = document.activeElement;
      return (
        activeElement instanceof HTMLElement &&
        activeElement.getAttribute("data-photo-credits-entry") === "true"
      );
    });
    focusedCreditEntry = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLElement)) {
        return null;
      }

      const indexValue = activeElement.getAttribute("data-photo-credit-entry-index");
      const imageIndex = Number.parseInt(indexValue ?? "", 10);
      return {
        text: (activeElement.textContent ?? "").replace(/\s+/gu, " ").trim(),
        imageIndex: Number.isFinite(imageIndex) ? imageIndex : null
      };
    });
    assert(
      focusedCreditEntry?.imageIndex === currentImageNumber,
      `Credit link should focus image ${currentImageNumber}, got ${JSON.stringify(focusedCreditEntry)}.`
    );
    commonsCreditText = focusedCreditEntry?.text ?? "";
    assertCreditIncludes(commonsCreditText, ["Photo:", "Wikimedia Commons"], "Commons photo-credits entry");
    commonsImage = {
      ...candidateImage,
      pathname: parsed.pathname
    };
    break;
  }

  if (!commonsImage) {
    throw new Error("Could not find a loaded Wikimedia Commons photo in Capernaum's gallery.");
  }

  return {
    panelHeading: "Capernaum",
    todayLine: todayLineText,
    leadAiImage: {
      ...aiImage,
      pathname: aiImagePath,
      credit: aiCreditText
    },
    commonsImage: {
      ...commonsImage,
      credit: commonsCreditText,
      focusedCreditEntry
    }
  };
}

async function verifyAntiochSearch(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForMapToSettle(page);

  const searchInput = page.locator("input[aria-label='Search biblical places']");
  await searchInput.fill("Antioch");
  await page.waitForSelector("[data-testid='search-results-list']", { timeout: 45_000 });
  await page.waitForFunction(
    () => document.querySelectorAll("[data-testid='search-results-list'] [role='option']").length >= 2,
    { timeout: 45_000 }
  );

  const results = await page.$$eval("[data-testid='search-results-list'] [role='option']", (elements) =>
    elements.map((element) => (element.textContent ?? "").replace(/\s+/gu, " ").trim())
  );

  assert(results.length === 2, `Expected exactly 2 search results for Antioch, got ${results.length}.`);
  assert(
    results.some((entry) => entry.includes("Antioch on the Orontes")),
    `Search results are missing Antioch on the Orontes: ${JSON.stringify(results)}`
  );
  assert(
    results.some((entry) => entry.includes("Antioch in Pisidia")),
    `Search results are missing Antioch in Pisidia: ${JSON.stringify(results)}`
  );

  return {
    query: "Antioch",
    resultCount: results.length,
    results
  };
}

async function verifyEmmausDisputedLayout(page, baseUrl) {
  await page.goto(`${baseUrl}/?place=emmaus`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForMapToSettle(page);
  assert(
    page.url().includes("?place=emmaus"),
    `Emmaus deep link did not resolve as expected, got '${page.url()}'.`
  );
  await page.waitForSelector("section[aria-label='Place details'] [data-modern-name-line='true']", {
    timeout: 45_000
  });

  const disputedBanner =
    (
      await page
        .locator("section[aria-label='Place details'] [data-modern-name-line='true']")
        .textContent()
    )?.trim() ?? "";
  assert(
    disputedBanner.includes("Location disputed"),
    `Disputed layout banner mismatch for Emmaus: '${disputedBanner}'.`
  );
  assert(
    disputedBanner.includes("4 proposed sites"),
    `Emmaus banner must mention 4 proposed sites, got '${disputedBanner}'.`
  );

  const candidateCount = await page
    .locator("section[aria-label='Place details'] button[aria-label^='Candidate ']")
    .count();
  assert(candidateCount === 4, `Expected 4 Emmaus candidate entries, got ${candidateCount}.`);

  return {
    disputedBanner,
    candidateCount
  };
}

async function run() {
  await withResolvedBaseUrl(async ({ baseUrl, usingProvidedBaseUrl }) => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 }
    });
    const page = await context.newPage();

    try {
      const result = {
        baseUrl,
        usingProvidedBaseUrl,
        mapLoad: await verifyMapLoads(page, baseUrl),
        capernaum: await verifyCapernaumPanelAndImages(page, baseUrl),
        antiochSearch: await verifyAntiochSearch(page, baseUrl),
        emmaus: await verifyEmmausDisputedLayout(page, baseUrl)
      };

      console.log(JSON.stringify(result, null, 2));
    } finally {
      await page.close();
      await context.close();
      await browser.close();
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
