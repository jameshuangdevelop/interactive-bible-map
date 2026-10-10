import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import { waitForMapToSettle, withResolvedBaseUrl } from "./lib/web-checks.mjs";

function resolveViewport() {
  const raw = process.env.PLAYWRIGHT_VIEWPORT;
  if (!raw) {
    return { width: 1440, height: 960 };
  }

  const match = /^(\d+)x(\d+)$/u.exec(raw.trim());
  if (!match) {
    throw new Error(`Invalid PLAYWRIGHT_VIEWPORT '${raw}'. Expected '<width>x<height>'.`);
  }

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid PLAYWRIGHT_VIEWPORT '${raw}'. Width and height must be positive integers.`);
  }

  return { width, height };
}

function toBlockingViolations(violations) {
  return violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
}

function summarizeViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact,
    nodeCount: violation.nodes.length
  };
}

async function runAxeScenario(page, baseUrl, scenario) {
  // waitForMapToSettle waits for the real map-ready state.
  await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForMapToSettle(page);
  await scenario.prepare(page);

  const axeResult = await new AxeBuilder({ page }).analyze();
  const blockingViolations = toBlockingViolations(axeResult.violations);

  return {
    name: scenario.name,
    path: scenario.path,
    totalViolations: axeResult.violations.length,
    blockingViolations: blockingViolations.map(summarizeViolation)
  };
}

async function run() {
  await withResolvedBaseUrl(async ({ baseUrl, usingProvidedBaseUrl }) => {
    const viewport = resolveViewport();
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport
    });
    const page = await context.newPage();

    try {
      const scenarios = [
        {
          name: "overview",
          path: "",
          prepare: async () => {}
        },
        {
          name: "open-place-panel",
          path: "/?place=capernaum",
          prepare: async (currentPage) => {
            await currentPage.waitForSelector("section[aria-label='Place details']", {
              state: "visible",
              timeout: 45_000
            });
          }
        },
        {
          name: "search-box-open",
          path: "",
          prepare: async (currentPage) => {
            const searchInput = currentPage.locator("input[aria-label='Search biblical places']");
            await searchInput.fill("Antioch");
            await currentPage.waitForSelector("[data-testid='search-results-list']", { timeout: 45_000 });
            await currentPage.waitForFunction(
              () => document.querySelectorAll("[data-testid='search-results-list'] [role='option']").length >= 2,
              { timeout: 45_000 }
            );
          }
        }
      ];

      const results = [];
      for (const scenario of scenarios) {
        results.push(await runAxeScenario(page, baseUrl, scenario));
      }

      const blockingViolations = results.flatMap((result) =>
        result.blockingViolations.map((violation) => ({
          scenario: result.name,
          ...violation
        }))
      );

      const summary = {
        baseUrl,
        usingProvidedBaseUrl,
        viewport,
        scenarioCount: results.length,
        scenarios: results,
        blockingViolationCount: blockingViolations.length,
        blockingViolations
      };

      console.log(JSON.stringify(summary, null, 2));

      if (blockingViolations.length > 0) {
        throw new Error(`Found ${blockingViolations.length} serious/critical axe violation(s).`);
      }
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
