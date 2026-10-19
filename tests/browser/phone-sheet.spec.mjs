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
          return topAtEnd <= fullTopMaxPx && (stableAcrossFrames || transitionSettled);
        }, { selector: sheetSelector, fullTopMaxPx: SHEET_FULL_TOP_MAX_PX }),
      { timeout: SHEET_SETTLE_TIMEOUT_MS }
    )
    .toBe(true);
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
