import { test as base, expect } from "@playwright/test";
import { distDirectory, startStaticServer } from "../../scripts/verify-web-export-playwright.mjs";

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

      const attachContext = (context) => {
        if (trackedContexts.has(context)) {
          return;
        }
        trackedContexts.add(context);
        context.on("page", attachPage);
        for (const page of context.pages()) {
          attachPage(page);
        }
      };

      const originalNewContext = browser.newContext.bind(browser);
      browser.newContext = async (...args) => {
        const context = await originalNewContext(...args);
        attachContext(context);
        return context;
      };

      for (const context of browser.contexts()) {
        attachContext(context);
      }

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

      expect(
        failures,
        `Runtime guards failed in ${testInfo.titlePath.join(" > ")}`
      ).toEqual([]);
    },
    { auto: true }
  ]
});

export { expect };
