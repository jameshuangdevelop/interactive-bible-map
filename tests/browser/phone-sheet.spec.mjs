import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures.mjs";

const PHONE_VIEWPORT = { width: 390, height: 844 };
const SHEET_FULL_TOP_MAX_PX = 8;
const SHEET_SETTLE_TIMEOUT_MS = 15_000;

test.use({
  viewport: PHONE_VIEWPORT,
  hasTouch: true,
  isMobile: true
});

async function dragHandle(page, selector, deltaY, options = {}) {
  const { steps = 14 } = options;
  const handle = page.locator(selector);
  await expect(handle).toBeVisible();
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`No bounding box for ${selector}`);
  }
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + deltaY, { steps });
  await page.mouse.up();
}

async function dragInsideElement(page, element, options) {
  const { startRatioX = 0.5, startRatioY, deltaY, steps = 14 } = options;
  const box = await element.boundingBox();
  if (!box) {
    throw new Error("No bounding box for drag target.");
  }
  const startX = box.x + box.width * startRatioX;
  const startY = box.y + box.height * startRatioY;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + deltaY, { steps });
  await page.mouse.up();
}

async function stripDragStartRatioX(page, stripLocator, options = {}) {
  const {
    minimumDistancePx = 40,
    closeButtonLocator = null,
    handleLocator = page.locator("[data-sheet-handle='place']")
  } = options;
  const handleBox = await handleLocator.boundingBox();
  if (!handleBox) {
    throw new Error("Missing sheet handle bounding box.");
  }
  const handleCenterX = handleBox.x + handleBox.width / 2;
  const closeBox = closeButtonLocator ? await closeButtonLocator.boundingBox() : null;
  const closeCenterX = closeBox ? closeBox.x + closeBox.width / 2 : null;
  const stripBox = await stripLocator.boundingBox();
  if (!stripBox) {
    throw new Error("Missing strip bounding box.");
  }
  const candidateXs = [
    stripBox.x + 44,
    stripBox.x + stripBox.width * 0.2,
    stripBox.x + stripBox.width * 0.8,
    stripBox.x + stripBox.width - 44
  ];
  const safeX = candidateXs.find((candidateX) => {
    if (Math.abs(candidateX - handleCenterX) < minimumDistancePx) {
      return false;
    }
    if (typeof closeCenterX === "number" && Math.abs(candidateX - closeCenterX) < minimumDistancePx) {
      return false;
    }
    return true;
  });
  if (typeof safeX !== "number") {
    throw new Error("No safe strip drag start point found.");
  }
  return (safeX - stripBox.x) / stripBox.width;
}

async function waitForSheetSettledAtFull(page, sheetSelector) {
  await expect
    .poll(
      async () =>
        page.evaluate(async ({ selector, fullTopMaxPx }) => {
          const sheet = document.querySelector(selector);
          if (!(sheet instanceof HTMLElement)) {
            return false;
          }

          const topAtStart = sheet.getBoundingClientRect().top;
          if (topAtStart > fullTopMaxPx) {
            return false;
          }

          const stableAcrossFrames = await new Promise((resolve) => {
            requestAnimationFrame(() => {
              const top1 = sheet.getBoundingClientRect().top;
              requestAnimationFrame(() => {
                const top2 = sheet.getBoundingClientRect().top;
                resolve(Math.abs(top2 - top1) <= 0.5);
              });
            });
          });
          if (stableAcrossFrames) {
            return sheet.getBoundingClientRect().top <= fullTopMaxPx;
          }

          const transitionSettled = await new Promise((resolve) => {
            const styles = window.getComputedStyle(sheet);
            const parseMsList = (value) =>
              value
                .split(",")
                .map((entry) => Number.parseFloat(entry.trim()) * 1_000)
                .filter((entry) => Number.isFinite(entry) && entry > 0);
            const durations = parseMsList(styles.transitionDuration);
            const delays = parseMsList(styles.transitionDelay);
            const maxTransitionMs = Math.max(
              0,
              ...durations.map((duration, index) => duration + (delays[index] ?? delays[0] ?? 0))
            );
            const hasTransition =
              styles.transitionProperty !== "none" &&
              Number.isFinite(maxTransitionMs) &&
              maxTransitionMs > 0;
            if (!hasTransition) {
              resolve(false);
              return;
            }

            let settled = false;
            const finish = (value) => {
              if (settled) {
                return;
              }
              settled = true;
              sheet.removeEventListener("transitionend", onTransitionEnd);
              sheet.removeEventListener("transitioncancel", onTransitionEnd);
              window.clearTimeout(timer);
              resolve(value);
            };
            const onTransitionEnd = (event) => {
              if (event.target === sheet) {
                finish(true);
              }
            };
            const timer = window.setTimeout(
              () => finish(false),
              Math.min(800, Math.max(220, maxTransitionMs + 80))
            );
            sheet.addEventListener("transitionend", onTransitionEnd);
            sheet.addEventListener("transitioncancel", onTransitionEnd);
          });

          const topAtEnd = sheet.getBoundingClientRect().top;
          return topAtEnd <= fullTopMaxPx && transitionSettled;
        }, { selector: sheetSelector, fullTopMaxPx: SHEET_FULL_TOP_MAX_PX }),
      { timeout: SHEET_SETTLE_TIMEOUT_MS }
    )
    .toBe(true);
}

async function waitForSheetSettledAtHalf(page, sheetSelector) {
  await expect
    .poll(
      async () =>
        page.evaluate(async ({ selector, fullTopMaxPx }) => {
          const sheet = document.querySelector(selector);
          if (!(sheet instanceof HTMLElement)) {
            return false;
          }

          const topAtStart = sheet.getBoundingClientRect().top;
          const viewportHeightPx = window.innerHeight;
          const expectedHalfHeightPx = Number.parseFloat(
            sheet.getAttribute("data-small-screen-half-height-px") ?? ""
          );
          if (!Number.isFinite(expectedHalfHeightPx)) {
            return false;
          }
          const expectedHalfTopPx = Math.max(0, viewportHeightPx - expectedHalfHeightPx);
          if (topAtStart <= fullTopMaxPx + 20) {
            return false;
          }
          if (Math.abs(topAtStart - expectedHalfTopPx) > 24) {
            return false;
          }

          const stableAcrossFrames = await new Promise((resolve) => {
            requestAnimationFrame(() => {
              const top1 = sheet.getBoundingClientRect().top;
              requestAnimationFrame(() => {
                const top2 = sheet.getBoundingClientRect().top;
                resolve(Math.abs(top2 - top1) <= 0.5);
              });
            });
          });

          if (!stableAcrossFrames) {
            return false;
          }

          const topAtEnd = sheet.getBoundingClientRect().top;
          return topAtEnd > fullTopMaxPx + 20 && Math.abs(topAtEnd - expectedHalfTopPx) <= 24;
        }, { selector: sheetSelector, fullTopMaxPx: SHEET_FULL_TOP_MAX_PX }),
      { timeout: SHEET_SETTLE_TIMEOUT_MS }
    )
    .toBe(true);
}

async function getControlViewportState(page, selector) {
  return page.evaluate((controlSelector) => {
    const control = document.querySelector(controlSelector);
    if (!(control instanceof HTMLElement)) {
      return null;
    }
    const rect = control.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const ownerAtCenter = document.elementFromPoint(centerX, centerY);
    return {
      topPx: Math.round(rect.top),
      bottomPx: Math.round(rect.bottom),
      centerInViewport:
        centerX >= 0 &&
        centerY >= 0 &&
        centerX <= window.innerWidth &&
        centerY <= window.innerHeight,
      ownsCenterPoint: Boolean(ownerAtCenter && control.contains(ownerAtCenter))
    };
  }, selector);
}

async function waitForPlacePanelReady(page) {
  const placeSheet = page.locator("section[aria-label='Place details']").first();
  await expect(placeSheet).toBeVisible();
  await expect(placeSheet.getByText("Loading details…")).toHaveCount(0);
}

async function waitForRoutePanelReady(page) {
  const routeSheet = page.locator("section[aria-label='Route details']").first();
  await expect(routeSheet).toBeVisible();
  await expect(routeSheet.getByText("Loading routes…")).toHaveCount(0);
  await expect(routeSheet.locator("[data-route-stage-index='1']")).toBeVisible();
}


test("map sheet drags between half, full, half, and closed @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  await expect(sheet).toBeVisible();
  await expect
    .poll(async () => (await page.url()).includes("place=capernaum"))
    .toBe(true);

  await dragHandle(page, "[data-sheet-handle='place']", -320);
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");

  await dragHandle(page, "[data-sheet-handle='place']", 360);
  await expect(page.locator("[data-sheet-handle='place']")).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(async () => (await page.url()).includes("place=capernaum"))
    .toBe(true);

  await dragHandle(page, "[data-sheet-handle='place']", 360, { steps: 1 });
  await expect
    .poll(async () => (await page.url()).includes("place="), { timeout: 15_000 })
    .toBe(false);
});

test("tapping the map sheet handle toggles half and full @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=ephesus`, { waitUntil: "domcontentloaded" });
  const handle = page.locator("[data-sheet-handle='place']");
  await expect(handle).toHaveAttribute("aria-expanded", "false");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "false");
});

test("full sheet intentionally covers map, center, and attribution trigger @phone", async ({
  page,
  baseUrl
}) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await expect(handle).toHaveAttribute("aria-expanded", "false");
  const halfTop = (await sheet.boundingBox())?.y ?? 0;
  expect(halfTop).toBeGreaterThan(40);
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");

  const coverage = await page.evaluate(() => {
    const sheet = document.querySelector("section[aria-label='Place details']");
    const map = document.querySelector(".ibm-map-root");
    const attribButton = document.querySelector(".maplibregl-ctrl-attrib-button");
    if (!(sheet instanceof HTMLElement) || !(map instanceof HTMLElement)) {
      return null;
    }
    const mapRect = map.getBoundingClientRect();
    const points = [
      { label: "map-top-left", x: mapRect.left + 6, y: mapRect.top + 6 },
      { label: "map-top-right", x: mapRect.right - 6, y: mapRect.top + 6 },
      { label: "map-bottom-left", x: mapRect.left + 6, y: mapRect.bottom - 6 },
      { label: "map-bottom-right", x: mapRect.right - 6, y: mapRect.bottom - 6 },
      { label: "map-center", x: mapRect.left + mapRect.width / 2, y: mapRect.top + mapRect.height / 2 }
    ];
    if (attribButton instanceof HTMLElement) {
      const rect = attribButton.getBoundingClientRect();
      points.push({
        label: "attribution-button",
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    return points.map((point) => {
      const el = document.elementFromPoint(point.x, point.y);
      return {
        label: point.label,
        coveredBySheet: Boolean(el && sheet.contains(el)),
        mapElementVisible: Boolean(el && map.contains(el))
      };
    });
  });
  if (!coverage) {
    throw new Error("Missing sheet or map element for full-sheet coverage test.");
  }
  for (const sample of coverage) {
    expect(sample.mapElementVisible, `${sample.label} should not expose map content at full`).toBe(false);
    if (sample.label === "attribution-button" || sample.label === "map-center") {
      expect(sample.coveredBySheet, `${sample.label} should be covered by the full sheet`).toBe(true);
    }
  }
});

test("tapping body text at full keeps the sheet full @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  const topBefore = (await sheet.boundingBox())?.y ?? 999;
  await expect(topBefore).toBeLessThanOrEqual(8);

  await page.getByText("Today: Jerusalem").first().click({ position: { x: 10, y: 10 } });
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  const topAfter = (await sheet.boundingBox())?.y ?? 999;
  expect(Math.abs(topAfter - topBefore)).toBeLessThanOrEqual(4);
});

test("photo arrows stay on-screen even with an unbreakable About token @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  await expect(sheet).toBeVisible();
  await expect(page.getByRole("button", { name: "Next image" })).toBeVisible();

  await page.evaluate(() => {
    const aboutParagraph = document.querySelector(
      "section[aria-label='Place details'] [data-panel-section='about'] p"
    );
    if (!(aboutParagraph instanceof HTMLElement) || aboutParagraph.dataset.m703ProbeInjected === "true") {
      return;
    }
    aboutParagraph.dataset.m703ProbeInjected = "true";
    aboutParagraph.textContent = `${aboutParagraph.textContent ?? ""} ${"W".repeat(52)}`;
  });

  const metrics = await page.evaluate(() => {
    const detailsSheet = document.querySelector("section[aria-label='Place details']");
    const frame = detailsSheet?.querySelector("[data-panel-photo-frame='true']");
    const panelBody =
      detailsSheet?.querySelector("[data-place-panel-body='true']") ??
      detailsSheet?.querySelector(":scope > div > div:nth-of-type(2)");
    const nextButton = detailsSheet?.querySelector("button[aria-label='Next image']");
    const aboutParagraph = detailsSheet?.querySelector("[data-panel-section='about'] p");
    if (
      !(detailsSheet instanceof HTMLElement) ||
      !(panelBody instanceof HTMLElement) ||
      !(frame instanceof HTMLElement) ||
      !(nextButton instanceof HTMLButtonElement) ||
      !(aboutParagraph instanceof HTMLElement)
    ) {
      return null;
    }

    const sheetRect = detailsSheet.getBoundingClientRect();
    const panelBodyRect = panelBody.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const nextRect = nextButton.getBoundingClientRect();
    const nextCenterX = nextRect.left + nextRect.width / 2;
    const nextCenterY = nextRect.top + nextRect.height / 2;
    const centerElement = document.elementFromPoint(nextCenterX, nextCenterY);
    const descendants = panelBody.querySelectorAll("*");
    let widestDescendantPx = 0;
    descendants.forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }
      widestDescendantPx = Math.max(widestDescendantPx, element.getBoundingClientRect().width);
    });

    return {
      sheetRightPx: sheetRect.right,
      frameRightPx: frameRect.right,
      panelBodyWidthPx: panelBodyRect.width,
      widestDescendantPx,
      aboutParagraphClientWidthPx: aboutParagraph.clientWidth,
      aboutParagraphScrollWidthPx: aboutParagraph.scrollWidth,
      nextCenterInViewport:
        nextCenterX >= 0 &&
        nextCenterY >= 0 &&
        nextCenterX <= window.innerWidth &&
        nextCenterY <= window.innerHeight,
      nextCenterOwnedByButton: Boolean(centerElement && nextButton.contains(centerElement))
    };
  });

  if (!metrics) {
    throw new Error("Missing sheet, panel body, frame, or next-image button.");
  }
  expect(metrics.frameRightPx).toBeLessThanOrEqual(metrics.sheetRightPx + 0.5);
  expect(metrics.nextCenterInViewport).toBe(true);
  expect(metrics.nextCenterOwnedByButton).toBe(true);
  expect(metrics.widestDescendantPx).toBeLessThanOrEqual(metrics.panelBodyWidthPx + 0.5);
  expect(metrics.aboutParagraphScrollWidthPx).toBeLessThanOrEqual(
    metrics.aboutParagraphClientWidthPx + 1
  );
});

test("dragging from the place top strip moves the sheet while strip taps do nothing @phone", async ({
  page,
  baseUrl
}) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  await waitForPlacePanelReady(page);
  const placeSheet = page.locator("section[aria-label='Place details']").first();
  const placeHandle = page.locator("[data-sheet-handle='place']");
  const placeStrip = page.locator("[data-sheet-drag-strip='place']");
  const closeButton = page.getByRole("button", { name: "Close place panel" });
  await expect(placeHandle).toHaveAttribute("aria-expanded", "false");
  await expect(placeStrip).toBeVisible();
  await waitForSheetSettledAtHalf(page, "section[aria-label='Place details']");

  const placeStripStartRatioX = await stripDragStartRatioX(page, placeStrip, {
    minimumDistancePx: 40,
    handleLocator: placeHandle,
    closeButtonLocator: closeButton
  });
  const placeStripBox = await placeStrip.boundingBox();
  if (!placeStripBox) {
    throw new Error("Missing place strip bounding box.");
  }
  const stripTapX = Math.round(placeStripStartRatioX * placeStripBox.width);
  await waitForSheetSettledAtHalf(page, "section[aria-label='Place details']");
  const halfTopBeforeTap = (await placeSheet.boundingBox())?.y ?? 999;
  await placeStrip.click({ position: { x: stripTapX, y: 22 } });
  await expect(placeHandle).toHaveAttribute("aria-expanded", "false");
  const halfTopAfterTap = (await placeSheet.boundingBox())?.y ?? 999;
  expect(Math.abs(halfTopAfterTap - halfTopBeforeTap)).toBeLessThanOrEqual(4);

  await waitForSheetSettledAtHalf(page, "section[aria-label='Place details']");
  await dragInsideElement(page, placeStrip, {
    startRatioX: placeStripStartRatioX,
    startRatioY: 0.5,
    deltaY: -320
  });
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  await expect(placeHandle).toHaveAttribute("aria-expanded", "true");

  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  const fullTopBeforeTap = (await placeSheet.boundingBox())?.y ?? 999;
  await placeStrip.click({ position: { x: stripTapX, y: 22 } });
  await expect(placeHandle).toHaveAttribute("aria-expanded", "true");
  const fullTopAfterTap = (await placeSheet.boundingBox())?.y ?? 999;
  expect(Math.abs(fullTopAfterTap - fullTopBeforeTap)).toBeLessThanOrEqual(4);

  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  await dragInsideElement(page, placeStrip, {
    startRatioX: placeStripStartRatioX,
    startRatioY: 0.5,
    deltaY: 320
  });
  await expect(placeHandle).toHaveAttribute("aria-expanded", "false");
});

test("at full, place sheet scrolling keeps the handle and close button in view @phone", async ({
  page,
  baseUrl
}) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  await waitForPlacePanelReady(page);
  const placeSheet = page.locator("section[aria-label='Place details']").first();
  const placeHandle = page.locator("[data-sheet-handle='place']");
  const closeButton = page.getByRole("button", { name: "Close place panel" });
  await placeHandle.click();
  await expect(placeHandle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  await placeSheet.evaluate((element) => {
    element.scrollBy(0, 900);
  });

  const placeHandleState = await getControlViewportState(page, "[data-sheet-handle='place']");
  const closeButtonState = await getControlViewportState(page, "[aria-label='Close place panel']");
  const topEdgeOwnerState = await page.evaluate(() => {
    const sheet = document.querySelector("section[aria-label='Place details']");
    const strip = document.querySelector("[data-sheet-drag-strip-container='place']");
    if (!(sheet instanceof HTMLElement) || !(strip instanceof HTMLElement)) {
      return null;
    }
    const sheetRect = sheet.getBoundingClientRect();
    const probeElement = document.elementFromPoint(sheetRect.left + sheetRect.width / 2, sheetRect.top + 2);
    return {
      top2PxOwnedByStrip: Boolean(probeElement && strip.contains(probeElement))
    };
  });
  if (!placeHandleState || !closeButtonState) {
    throw new Error("Missing place top controls after scroll.");
  }
  if (!topEdgeOwnerState) {
    throw new Error("Missing top-edge strip probe state.");
  }
  expect(placeHandleState.centerInViewport).toBe(true);
  expect(placeHandleState.ownsCenterPoint).toBe(true);
  expect(placeHandleState.topPx).toBeGreaterThanOrEqual(0);
  expect(closeButtonState.centerInViewport).toBe(true);
  expect(closeButtonState.ownsCenterPoint).toBe(true);
  expect(closeButtonState.topPx).toBeGreaterThanOrEqual(0);
  expect(topEdgeOwnerState.top2PxOwnedByStrip).toBe(true);

  await closeButton.click();
  await expect
    .poll(async () => (await page.url()).includes("place="), { timeout: SHEET_SETTLE_TIMEOUT_MS })
    .toBe(false);
});

test("dragging from the route-list top strip moves the sheet while strip taps do nothing @phone", async ({
  page,
  baseUrl
}) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-1&stage=6`, { waitUntil: "domcontentloaded" });
  await waitForRoutePanelReady(page);
  await waitForSheetSettledAtHalf(page, "section[aria-label='Route details']");
  const routeListHandle = page.locator("[data-sheet-handle='route-list']");
  const routeListStrip = page.locator("[data-sheet-drag-strip='route-list']");
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "false");
  await expect(routeListStrip).toBeVisible();
  const routeStripStartRatioX = await stripDragStartRatioX(page, routeListStrip, {
    minimumDistancePx: 40,
    handleLocator: routeListHandle
  });
  const routeStripBox = await routeListStrip.boundingBox();
  if (!routeStripBox) {
    throw new Error("Missing route strip bounding box.");
  }
  const routeDragStartY = routeStripBox.y + routeStripBox.height * 0.5;
  const routeDragDeltaY = Math.min(-320, 12 - routeDragStartY);
  await dragInsideElement(page, routeListStrip, {
    startRatioX: routeStripStartRatioX,
    startRatioY: 0.5,
    deltaY: routeDragDeltaY,
    steps: 18
  });
  await expect
    .poll(async () => await routeListHandle.getAttribute("aria-expanded"), {
      timeout: SHEET_SETTLE_TIMEOUT_MS
    })
    .toBe("true");

  await page.locator("section[aria-label='Route details']").evaluate((element) => {
    element.scrollBy(0, 600);
  });
  const routeHandleState = await getControlViewportState(page, "[data-sheet-handle='route-list']");
  if (!routeHandleState) {
    throw new Error("Missing route-list handle after scroll.");
  }
  expect(routeHandleState.centerInViewport).toBe(true);
  expect(routeHandleState.ownsCenterPoint).toBe(true);
  expect(routeHandleState.topPx).toBeGreaterThanOrEqual(0);
  await routeListHandle.click();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "false");
});

test("downward drags in scrolled content do not move the full sheet @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");
  const fullTop = (await sheet.boundingBox())?.y ?? 999;
  await expect(fullTop).toBeLessThanOrEqual(8);

  const fullTopBeforeScroll = (await sheet.boundingBox())?.y ?? 999;
  const beforeScrollTop = await sheet.evaluate((element) => {
    element.scrollTop = 640;
    return element.scrollTop;
  });
  expect(beforeScrollTop).toBeGreaterThan(200);
  await dragInsideElement(page, sheet, { startRatioY: 0.68, deltaY: 180, steps: 10 });
  await expect
    .poll(async () => (await page.url()).includes("place=jerusalem"))
    .toBe(true);
  const afterTop = (await sheet.boundingBox())?.y ?? 999;
  expect(Math.abs(fullTopBeforeScroll - fullTop)).toBeLessThanOrEqual(4);
  expect(Math.abs(afterTop - fullTop)).toBeLessThanOrEqual(4);
});

test("dragging down from top-of-content moves and closes the map sheet @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  await expect(sheet).toBeVisible();
  await sheet.evaluate((element) => {
    element.scrollTop = 0;
  });
  await dragInsideElement(page, sheet, {
    startRatioX: 0.1,
    startRatioY: 0.72,
    deltaY: 420,
    steps: 1
  });
  await expect
    .poll(async () => (await page.url()).includes("place="), { timeout: 15_000 })
    .toBe(false);
});

test("attribution sources popover fits at closed and half sheet heights on phone @phone", async ({ page, baseUrl }) => {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  const attributionButton = page.locator(".maplibregl-ctrl-attrib-button");
  await expect(attributionButton).toBeVisible();
  await attributionButton.click();
  const attributionExpanded = page.locator("details.maplibregl-ctrl-attrib.maplibregl-compact[open]");
  await expect(attributionExpanded).toBeVisible();
  const closedBox = await attributionExpanded.boundingBox();
  if (!closedBox) {
    throw new Error("Missing attribution popover bounding box.");
  }
  expect(closedBox.y).toBeGreaterThanOrEqual(0);
  expect(closedBox.y + closedBox.height).toBeLessThanOrEqual(PHONE_VIEWPORT.height);

  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("section[aria-label='Place details']")).toBeVisible();
  const halfAttributionButton = page.locator(".maplibregl-ctrl-attrib-button");
  await expect(halfAttributionButton).toBeVisible();
  await halfAttributionButton.click();
  const halfExpanded = page.locator("details.maplibregl-ctrl-attrib.maplibregl-compact[open]");
  await expect(halfExpanded).toBeVisible();
  const halfBox = await halfExpanded.boundingBox();
  const sheetBox = await page.locator("section[aria-label='Place details']").first().boundingBox();
  if (!halfBox || !sheetBox) {
    throw new Error("Missing sheet or attribution popover bounding box.");
  }
  expect(halfBox.y).toBeGreaterThanOrEqual(0);
  expect(halfBox.y + halfBox.height).toBeLessThanOrEqual(PHONE_VIEWPORT.height);
  expect(halfBox.y + halfBox.height).toBeLessThanOrEqual(sheetBox.y + 8);
});

test("route sheets support half/full and close route-place details by dragging down @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-1&stage=1`, { waitUntil: "domcontentloaded" });
  const routeListSheet = page.locator("section[aria-label='Route details']");
  const routeListHandle = page.locator("[data-sheet-handle='route-list']");
  await expect(routeListSheet).toBeVisible();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "false");
  await routeListHandle.click();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Route details']");
  await routeListHandle.click();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "false");

  await page.goto(`${baseUrl}/?tab=routes&route=paul-1&place=capernaum`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("section[aria-label='Place details']")).toBeVisible();
  await dragHandle(page, "[data-sheet-handle='place']", 420);
  await expect(page.locator("section[aria-label='Route details']")).toBeVisible();
});

test("axe scan passes when the full place sheet is open @phone @a11y", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const handle = page.locator("[data-sheet-handle='place']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await waitForSheetSettledAtFull(page, "section[aria-label='Place details']");

  const scan = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
  expect(scan.violations).toEqual([]);
});
