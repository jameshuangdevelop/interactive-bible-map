import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures.mjs";

const PHONE_VIEWPORT = { width: 390, height: 844 };

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

async function readMapCamera(page) {
  return page.evaluate(() => {
    const map = window.__ibmMapForTests;
    if (!map) {
      return null;
    }
    const center = map.getCenter();
    return {
      lng: center.lng,
      lat: center.lat,
      zoom: map.getZoom()
    };
  });
}

test("map sheet drags between half, full, half, and closed @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=capernaum`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  await expect(sheet).toBeVisible();
  await expect
    .poll(async () => (await page.url()).includes("place=capernaum"))
    .toBe(true);

  await dragHandle(page, "[data-sheet-handle='place']", -320);
  await expect
    .poll(async () => {
      const box = await sheet.boundingBox();
      return box?.y ?? 999;
    })
    .toBeLessThanOrEqual(8);

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
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await expect(handle).toHaveAttribute("aria-expanded", "false");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(async () => {
      const box = await sheet.boundingBox();
      return box?.y ?? 999;
    })
    .toBeLessThanOrEqual(8);
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "false");
});

test("dragging the handle does not move map camera for an open place @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  await expect
    .poll(async () => {
      const map = await readMapCamera(page);
      return map !== null;
    })
    .toBe(true);
  await expect
    .poll(async () => {
      const camera = await readMapCamera(page);
      const moving = await page.evaluate(() => window.__ibmMapForTests?.isMoving() ?? true);
      return Boolean(camera && camera.zoom >= 10.5 && !moving);
    })
    .toBe(true);

  const before = await readMapCamera(page);
  if (!before) {
    throw new Error("Map test hook unavailable.");
  }

  await dragHandle(page, "[data-sheet-handle='place']", -320);
  await dragHandle(page, "[data-sheet-handle='place']", 320);
  await expect
    .poll(async () => page.evaluate(() => window.__ibmMapForTests?.isMoving() ?? true))
    .toBe(false);

  const after = await readMapCamera(page);
  if (!after) {
    throw new Error("Map test hook unavailable.");
  }
  expect(Math.abs(after.lng - before.lng)).toBeLessThan(0.00001);
  expect(Math.abs(after.lat - before.lat)).toBeLessThan(0.00001);
  expect(Math.abs(after.zoom - before.zoom)).toBeLessThan(0.00001);
});

test("downward drags in scrolled content do not move the full sheet @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
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

test("route sheets support half/full and close route-place details by dragging down @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?tab=routes&route=paul-1&stage=1`, { waitUntil: "domcontentloaded" });
  const routeListSheet = page.locator("section[aria-label='Route details']");
  const routeListHandle = page.locator("[data-sheet-handle='route-list']");
  await expect(routeListSheet).toBeVisible();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "false");
  await routeListHandle.click();
  await expect(routeListHandle).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(async () => {
      const box = await routeListSheet.boundingBox();
      return box?.y ?? 999;
    })
    .toBeLessThanOrEqual(8);
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

  const scan = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
  expect(scan.violations).toEqual([]);
});
