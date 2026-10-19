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

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!(await page.url()).includes("place=")) {
      break;
    }
    await dragHandle(page, "[data-sheet-handle='place']", 360, { steps: 1 });
  }
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

test("full map sheet content scrolls while the sheet stays in place @phone", async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?place=jerusalem`, { waitUntil: "domcontentloaded" });
  const sheet = page.locator("section[aria-label='Place details']").first();
  const handle = page.locator("[data-sheet-handle='place']");
  await handle.click();
  await expect(handle).toHaveAttribute("aria-expanded", "true");
  const fullTop = (await sheet.boundingBox())?.y ?? 999;
  await expect(fullTop).toBeLessThanOrEqual(8);

  const beforeScrollTop = await sheet.evaluate((element) => {
    element.scrollTop = 640;
    return element.scrollTop;
  });
  const afterScrollTop = await sheet.evaluate((element) => {
    element.scrollTop = Math.max(0, element.scrollTop - 220);
    return element.scrollTop;
  });
  expect(beforeScrollTop).toBeGreaterThan(200);
  expect(afterScrollTop).toBeLessThan(beforeScrollTop);
  const afterTop = (await sheet.boundingBox())?.y ?? 999;
  expect(Math.abs(afterTop - fullTop)).toBeLessThanOrEqual(4);
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
