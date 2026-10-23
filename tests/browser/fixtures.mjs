import { test as base, expect } from "@playwright/test";
import { distDirectory, startStaticServer } from "../../scripts/verify-web-export-playwright.mjs";
import {
  attachNetworkGuardsToContext,
  collectBasemapFixtureMisses,
  collectNetworkEscapes,
  collectNetworkGuardFailures,
  flushNetworkEventLogWrites,
  getNetworkGuardMode,
  writeRecordedBasemapManifest
} from "./network-guard.mjs";

export const test = base.extend({
  server: [
    async ({}, use) => {
      const server = await startStaticServer(distDirectory);
      try {
        await use(server);
      } finally {
        await server.close();
      }
    },
    { scope: "worker" }
  ],
  baseUrl: async ({ server }, use) => {
    await use(server.baseUrl);
  },
  runtimeGuards: [
    async ({ browser, server }, use, testInfo) => {
      const pageErrors = [];
      const workerErrors = [];
      const missingPathsStart = server.notFoundPaths.length;
      const trackedContexts = new Set();
      const trackedPages = new Set();
      const networkGuardMode = getNetworkGuardMode();

      const attachPage = (page) => {
        if (trackedPages.has(page)) {
          return;
        }
        trackedPages.add(page);

        page.on("pageerror", (error) => {
          pageErrors.push(error.message);
        });

        page.on("worker", (worker) => {
          worker.on("console", (message) => {
            if (message.type() === "error") {
              workerErrors.push(`[${worker.url()}] ${message.text()}`);
            }
          });
        });
      };

      const attachContext = async (context) => {
        if (trackedContexts.has(context)) {
          return;
        }
        trackedContexts.add(context);
        await attachNetworkGuardsToContext(context);
        context.on("page", attachPage);
        for (const page of context.pages()) {
          attachPage(page);
        }
      };

      const originalNewContext = browser.newContext.bind(browser);
      browser.newContext = async (...args) => {
        const context = await originalNewContext(...args);
        await attachContext(context);
        return context;
      };

      await Promise.all(browser.contexts().map((context) => attachContext(context)));

      try {
        await use();
      } finally {
        browser.newContext = originalNewContext;
      }

      const missingPaths = server.notFoundPaths.slice(missingPathsStart);
      const failures = [];
      if (pageErrors.length > 0) {
        failures.push(`Page errors: ${JSON.stringify(pageErrors.slice(0, 5))}`);
      }
      if (workerErrors.length > 0) {
        failures.push(`Worker errors: ${JSON.stringify(workerErrors.slice(0, 5))}`);
      }
      if (missingPaths.length > 0) {
        failures.push(`Missing files: ${JSON.stringify(missingPaths.slice(0, 10))}`);
      }
      for (const context of trackedContexts) {
        failures.push(...collectNetworkGuardFailures(context));
        const misses = collectBasemapFixtureMisses(context);
        for (const url of misses) {
          testInfo.annotations.push({
            type: "basemap-fixture-miss",
            description: url
          });
        }
      }
      if (networkGuardMode === "replay") {
        const networkEscapeCount = [...trackedContexts].reduce(
          (sum, context) => sum + collectNetworkEscapes(context),
          0
        );
        if (networkEscapeCount > 0) {
          failures.push(`Network replay leaked ${networkEscapeCount} outside request(s) to the live network.`);
        }
      }
      await flushNetworkEventLogWrites();
      await writeRecordedBasemapManifest();

      expect(
        failures,
        `Runtime guards failed in ${testInfo.titlePath.join(" > ")}`
      ).toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };
