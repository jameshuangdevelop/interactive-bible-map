import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const distDirectory = path.join(repositoryRoot, "app", "dist");
const mapLibreDistDirectory = path.join(repositoryRoot, "node_modules", "maplibre-gl", "dist");

const mapHooks = {
  app: "__ibmMapForTests",
  demo: "__ibmBenchMap"
};

const visibilityThrottleGapMs = 900;
const mapIdleTimeoutMs = 60_000;
const mapReadyTimeoutMs = 120_000;
const scenarioAttemptLimit = 4;
const softwareRendererPattern = /(swiftshader|software|llvmpipe|softpipe|mesa offscreen)/i;
const mainAttributionNeedle = "OpenFreeMap";
const fallbackAttributionNeedles = ["VersaTiles", "ESA WorldCover 2021"];
const fallbackStylePathNeedle = "versatiles-colorful/style.json";

const mapBenchmarkTargets = {
  app: {
    id: "app",
    name: "Interactive Bible Map",
    mapHookKey: mapHooks.app,
    basePath: "/",
    includesFlyTo: true
  },
  openfreemap: {
    id: "openfreemap",
    name: "OpenFreeMap quick-start demo baseline",
    mapHookKey: mapHooks.demo,
    basePath: "/__bench/openfreemap-demo",
    includesFlyTo: false
  }
};

function parseArguments(argv) {
  const options = {
    mode: "both",
    target: "both",
    appQuery: "",
    outJson: null,
    outMarkdown: null,
    chromiumArgs: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--mode" && argv[index + 1]) {
      options.mode = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--mode=")) {
      options.mode = argument.slice("--mode=".length);
      continue;
    }

    if (argument === "--json" && argv[index + 1]) {
      options.outJson = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--json=")) {
      options.outJson = argument.slice("--json=".length);
      continue;
    }

    if (argument === "--markdown" && argv[index + 1]) {
      options.outMarkdown = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--markdown=")) {
      options.outMarkdown = argument.slice("--markdown=".length);
      continue;
    }

    if (argument === "--target" && argv[index + 1]) {
      options.target = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--target=")) {
      options.target = argument.slice("--target=".length);
      continue;
    }

    if (argument === "--app-query" && argv[index + 1]) {
      options.appQuery = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument.startsWith("--app-query=")) {
      options.appQuery = argument.slice("--app-query=".length);
      continue;
    }

    if (argument === "--chromium-arg" && argv[index + 1]) {
      options.chromiumArgs.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (argument.startsWith("--chromium-arg=")) {
      options.chromiumArgs.push(argument.slice("--chromium-arg=".length));
      continue;
    }
  }

  if (!["headless", "headed", "both"].includes(options.mode)) {
    throw new Error(`Unsupported --mode '${options.mode}'. Use headless, headed, or both.`);
  }

  if (!["app", "openfreemap", "both"].includes(options.target)) {
    throw new Error("Unsupported --target. Use app, openfreemap, or both.");
  }

  if (options.appQuery.length > 0 && !options.appQuery.startsWith("?")) {
    options.appQuery = `?${options.appQuery}`;
  }

  return options;
}

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
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function buildOpenFreeMapDemoPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenFreeMap quick-start benchmark</title>
    <link href="/__bench/maplibre/maplibre-gl.css" rel="stylesheet" />
    <style>
      html, body, #map { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      body { background: #f8f4f0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script type="module">
      import * as maplibregl from "/__bench/maplibre/maplibre-gl.mjs";
      maplibregl.setWorkerUrl("/__bench/maplibre/maplibre-gl-worker.mjs");
      const map = new maplibregl.Map({
        container: "map",
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [22.5, 35],
        zoom: 4.7,
        minZoom: 3,
        maxZoom: 14
      });
      window.__ibmBenchMap = map;
    </script>
  </body>
</html>`;
}

async function startStaticServer(rootDirectory) {
  const openFreeMapDemoPage = buildOpenFreeMapDemoPage();
  const notFoundPaths = [];

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      if (requestUrl.pathname === "/__bench/openfreemap-demo") {
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(openFreeMapDemoPage);
        return;
      }

      if (requestUrl.pathname.startsWith("/__bench/maplibre/")) {
        const relativeFile = requestUrl.pathname.slice("/__bench/maplibre/".length);
        const candidatePath = path.resolve(path.join(mapLibreDistDirectory, relativeFile));
        const maplibreRoot = path.resolve(mapLibreDistDirectory);

        if (!candidatePath.startsWith(maplibreRoot)) {
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
        return;
      }

      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") {
        pathname = "/index.html";
      }

      const normalizedPath = path.normalize(pathname).replace(/^([\\/])+/, "");
      const candidatePath = path.resolve(path.join(rootDirectory, normalizedPath));
      const rootResolved = path.resolve(rootDirectory);

      if (!candidatePath.startsWith(rootResolved)) {
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

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not start static benchmark server.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    notFoundPaths,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}

function percentile(values, fraction) {
  if (values.length === 0) {
    return null;
  }

  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.floor((values.length - 1) * fraction))
  );
  return values[index];
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

function summarizeLongTasks(longTasks) {
  if (longTasks.length === 0) {
    return {
      count: 0,
      p95Ms: null,
      maxMs: null
    };
  }

  const sorted = [...longTasks].sort((left, right) => left - right);
  return {
    count: sorted.length,
    p95Ms: percentile(sorted, 0.95),
    maxMs: sorted[sorted.length - 1]
  };
}

function formatMilliseconds(value) {
  if (typeof value !== "number") {
    return "n/a";
  }

  return value.toFixed(1);
}

function formatFrameSummary(summary) {
  return [
    `p50 ${formatMilliseconds(summary.p50Ms)} ms`,
    `p95 ${formatMilliseconds(summary.p95Ms)} ms`,
    `p99 ${formatMilliseconds(summary.p99Ms)} ms`,
    `max ${formatMilliseconds(summary.maxMs)} ms`
  ].join(" · ");
}

function formatBytes(bytes) {
  if (typeof bytes !== "number") {
    return "n/a";
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function isTileRequestUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  const fromKnownTileHost =
    host.includes("openfreemap.org") ||
    host.includes("versatiles.org") ||
    host.includes("openmaptiles.org");
  if (!fromKnownTileHost) {
    return false;
  }

  const pathname = url.pathname.toLowerCase();
  if (pathname.includes("/styles/") || pathname.endsWith(".json")) {
    return false;
  }

  if (pathname.includes("/fonts/") || pathname.includes("/glyphs/") || pathname.includes("/sprites/")) {
    return false;
  }

  return true;
}

async function waitForMapReady(page, mapHookKey) {
  await page.waitForSelector("canvas.maplibregl-canvas", { timeout: mapReadyTimeoutMs });
  try {
    await page.waitForFunction((hookKey) => Boolean(window[hookKey]), mapHookKey, {
      timeout: mapReadyTimeoutMs
    });
  } catch (error) {
    throw new Error(`Map hook '${mapHookKey}' did not appear in time.`);
  }
  try {
    await page.waitForFunction(
      (hookKey) => {
        const map = window[hookKey];
        return Boolean(map && map.isStyleLoaded && map.isStyleLoaded());
      },
      mapHookKey,
      { timeout: mapReadyTimeoutMs }
    );
  } catch (error) {
    throw new Error(`Map hook '${mapHookKey}' appeared, but style never reported loaded.`);
  }
  await waitForMapIdle(page, mapHookKey, mapIdleTimeoutMs);
}

async function waitForMapIdle(page, mapHookKey, timeoutMs) {
  return page.evaluate(
    ({ hookKey, timeout }) =>
      new Promise((resolve) => {
        const map = window[hookKey];
        if (!map) {
          resolve({ ok: false, reason: "map-missing", elapsedMs: null });
          return;
        }

        const startedAt = performance.now();
        let timer = null;
        const complete = (reason) => {
          map.off("idle", onIdle);
          if (timer !== null) {
            clearTimeout(timer);
          }
          const elapsedMs = performance.now() - startedAt;
          resolve({
            ok: reason === "idle" || reason === "already-idle",
            reason,
            elapsedMs
          });
        };

        const onIdle = () => complete("idle");
        if (typeof map.areTilesLoaded === "function" && map.areTilesLoaded()) {
          complete("already-idle");
          return;
        }

        map.on("idle", onIdle);
        timer = window.setTimeout(() => complete("timeout"), timeout);
      }),
    { hookKey: mapHookKey, timeout: timeoutMs }
  );
}

async function installSetStyleProbe(page, mapHookKey) {
  const installed = await page.evaluate((hookKey) => {
    const map = window[hookKey];
    if (!map) {
      return false;
    }

    if (window.__ibmBenchSetStyleProbe?.installed) {
      return true;
    }

    const originalSetStyle = map.setStyle.bind(map);
    const calls = [];

    map.setStyle = (...args) => {
      const firstArgument = args[0];
      const styleLabel =
        typeof firstArgument === "string"
          ? firstArgument
          : firstArgument && typeof firstArgument === "object" && typeof firstArgument.name === "string"
            ? firstArgument.name
            : "[style-object]";
      calls.push({
        atMs: performance.now(),
        style: styleLabel,
        argumentType: typeof firstArgument
      });
      return originalSetStyle(...args);
    };

    window.__ibmBenchSetStyleProbe = {
      installed: true,
      calls
    };
    return true;
  }, mapHookKey);

  if (!installed) {
    throw new Error(`Could not install setStyle probe for map hook '${mapHookKey}'.`);
  }
}

async function readMainStyleHealth(page, mapHookKey) {
  return page.evaluate(
    ({
      hookKey,
      mainNeedle,
      fallbackNeedles,
      fallbackStyleNeedle
    }) => {
      const map = window[hookKey];
      const probe = window.__ibmBenchSetStyleProbe;
      const setStyleCalls = Array.isArray(probe?.calls) ? probe.calls : [];
      const attributionElement = document.querySelector(".maplibregl-ctrl-attrib");
      const attributionText =
        attributionElement?.textContent?.replace(/\s+/g, " ").trim() ?? "";

      const style = map?.getStyle?.() ?? null;
      const sourceUrls = [];
      if (style?.sources && typeof style.sources === "object") {
        for (const source of Object.values(style.sources)) {
          if (source && typeof source.url === "string") {
            sourceUrls.push(source.url);
          }
        }
      }

      const sprite = typeof style?.sprite === "string" ? style.sprite : "";
      const glyphs = typeof style?.glyphs === "string" ? style.glyphs : "";
      const styleSummary = [sprite, glyphs, ...sourceUrls].filter(Boolean).join(" | ");
      const hasMainAttribution = attributionText.includes(mainNeedle);
      const hasFallbackAttribution = fallbackNeedles.some((needle) => attributionText.includes(needle));
      const hasFallbackStyleNeedle =
        styleSummary.includes(fallbackStyleNeedle) ||
        sourceUrls.some((url) => /versatiles/i.test(url));
      const setStyleSwitchCalls = setStyleCalls.filter((call) => {
        if (call?.argumentType === "string") {
          return true;
        }

        return typeof call?.style === "string" && call.style.includes(fallbackStyleNeedle);
      });

      return {
        hasMainAttribution,
        hasFallbackAttribution,
        hasFallbackStyleNeedle,
        setStyleCallCount: setStyleCalls.length,
        setStyleSwitchCallCount: setStyleSwitchCalls.length,
        setStyleCalls,
        setStyleSwitchCalls,
        attributionText,
        styleSummary
      };
    },
    {
      hookKey: mapHookKey,
      mainNeedle: mainAttributionNeedle,
      fallbackNeedles: fallbackAttributionNeedles,
      fallbackStyleNeedle: fallbackStylePathNeedle
    }
  );
}

function assertMainStyleHealth(target, scenario, health) {
  if (target.id !== "app") {
    return;
  }

  if (!health.hasMainAttribution) {
    throw new Error(
      `${target.name} ${scenario.id}: expected attribution containing '${mainAttributionNeedle}', got '${health.attributionText}'.`
    );
  }

  if (health.setStyleSwitchCallCount > 0) {
    throw new Error(
      `${target.name} ${scenario.id}: expected no style-switch setStyle calls, observed ${health.setStyleSwitchCallCount} (${JSON.stringify(health.setStyleSwitchCalls)}).`
    );
  }

  if (health.hasFallbackAttribution || health.hasFallbackStyleNeedle) {
    throw new Error(
      `${target.name} ${scenario.id}: fallback style signals detected (attribution='${health.attributionText}', style='${health.styleSummary}').`
    );
  }
}

async function installMapPaintProbe(page) {
  await page.addInitScript(() => {
    window.__ibmBenchNavStartMs = performance.now();
    window.__ibmBenchFirstMapPaintMs = null;

    const sample = () => {
      if (window.__ibmBenchFirstMapPaintMs !== null) {
        return;
      }

      const canvas = document.querySelector("canvas.maplibregl-canvas");
      if (!canvas) {
        window.requestAnimationFrame(sample);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        window.requestAnimationFrame(sample);
        return;
      }

      window.__ibmBenchFirstMapPaintMs = performance.now() - window.__ibmBenchNavStartMs;
    };

    window.requestAnimationFrame(sample);
  });
}

async function readFirstMapPaintMs(page) {
  return page.evaluate(() =>
    typeof window.__ibmBenchFirstMapPaintMs === "number" ? window.__ibmBenchFirstMapPaintMs : null
  );
}

async function readWebGlRendererInfo(page) {
  return page.evaluate(({ patternSource, patternFlags }) => {
    const pattern = new RegExp(patternSource, patternFlags);
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2", { antialias: false, alpha: false }) ??
      canvas.getContext("webgl", { antialias: false, alpha: false });

    if (!context) {
      return {
        vendor: null,
        renderer: null,
        unmaskedVendor: null,
        unmaskedRenderer: null,
        rendererString: "webgl unavailable",
        isSoftwareRenderer: false
      };
    }

    try {
      const vendor = context.getParameter(context.VENDOR);
      const renderer = context.getParameter(context.RENDERER);
      const debugExtension = context.getExtension("WEBGL_debug_renderer_info");
      const unmaskedVendor = debugExtension
        ? context.getParameter(debugExtension.UNMASKED_VENDOR_WEBGL)
        : null;
      const unmaskedRenderer = debugExtension
        ? context.getParameter(debugExtension.UNMASKED_RENDERER_WEBGL)
        : null;

      const asString = (value) => (typeof value === "string" ? value : null);
      const values = [asString(unmaskedRenderer), asString(renderer), asString(vendor)].filter(Boolean);
      const rendererString = values.join(" | ") || "unknown renderer";
      const isSoftwareRenderer = pattern.test(rendererString);

      return {
        vendor: asString(vendor),
        renderer: asString(renderer),
        unmaskedVendor: asString(unmaskedVendor),
        unmaskedRenderer: asString(unmaskedRenderer),
        rendererString,
        isSoftwareRenderer
      };
    } finally {
      const loseContext = context.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    }
  }, { patternSource: softwareRendererPattern.source, patternFlags: softwareRendererPattern.flags });
}

async function installGestureMonitor(page) {
  await page.evaluate(() => {
    const root = document.querySelector("[data-expo-root]") ?? document.querySelector("#root") ?? document.body;

    const state = {
      active: false,
      activeStartedAt: 0,
      mutationCount: 0,
      firstMutationSample: null,
      longTasks: [],
      frameTimes: [],
      lastFrameTimestamp: 0,
      rafId: null,
      maxFrameIntervalMs: 0,
      visibilityStateAtStart: "unknown",
      hiddenFrameCount: 0,
      hiddenVisibilitySampleCount: 0
    };

    const supportsLongTaskObserver =
      typeof PerformanceObserver !== "undefined" &&
      Array.isArray(PerformanceObserver.supportedEntryTypes) &&
      PerformanceObserver.supportedEntryTypes.includes("longtask");

    let longTaskObserver = null;
    if (supportsLongTaskObserver) {
      longTaskObserver = new PerformanceObserver((list) => {
        if (!state.active) {
          return;
        }

        for (const entry of list.getEntries()) {
          if (entry.startTime < state.activeStartedAt) {
            continue;
          }
          state.longTasks.push(entry.duration);
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
          const tag = target instanceof Element ? target.tagName.toLowerCase() : "node";
          state.firstMutationSample = `${mutation.type}:${tag}:${mutation.attributeName ?? ""}`;
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
        if (document.visibilityState !== "visible") {
          state.hiddenVisibilitySampleCount += 1;
        }
        if (state.lastFrameTimestamp > 0) {
          const deltaMs = timestamp - state.lastFrameTimestamp;
          state.frameTimes.push(deltaMs);
          if (deltaMs > state.maxFrameIntervalMs) {
            state.maxFrameIntervalMs = deltaMs;
          }
          if (document.visibilityState !== "visible") {
            state.hiddenFrameCount += 1;
          }
        }
        state.lastFrameTimestamp = timestamp;
      }

      state.rafId = window.requestAnimationFrame(collectFrame);
    };

    state.rafId = window.requestAnimationFrame(collectFrame);

    window.__ibmBenchGestureMonitor = {
      start() {
        state.active = true;
        state.activeStartedAt = performance.now();
        state.mutationCount = 0;
        state.firstMutationSample = null;
        state.longTasks = [];
        state.frameTimes = [];
        state.lastFrameTimestamp = 0;
        state.maxFrameIntervalMs = 0;
        state.visibilityStateAtStart = document.visibilityState;
        state.hiddenFrameCount = 0;
        state.hiddenVisibilitySampleCount = 0;
      },
      stop() {
        state.active = false;
        return {
          mutationCount: state.mutationCount,
          firstMutationSample: state.firstMutationSample,
          longTasks: [...state.longTasks],
          frameTimes: [...state.frameTimes],
          maxFrameIntervalMs: state.maxFrameIntervalMs,
          visibilityStateAtStart: state.visibilityStateAtStart,
          hiddenFrameCount: state.hiddenFrameCount,
          hiddenVisibilitySampleCount: state.hiddenVisibilitySampleCount,
          supportsLongTaskObserver
        };
      },
      dispose() {
        if (state.rafId !== null) {
          window.cancelAnimationFrame(state.rafId);
        }
        mutationObserver.disconnect();
        longTaskObserver?.disconnect();
      }
    };
  });
}

async function startGestureMonitor(page) {
  await page.evaluate(() => {
    window.__ibmBenchGestureMonitor.start();
  });
}

async function stopGestureMonitor(page) {
  return page.evaluate(() => window.__ibmBenchGestureMonitor.stop());
}

async function disposeGestureMonitor(page) {
  await page.evaluate(() => {
    window.__ibmBenchGestureMonitor.dispose();
  });
}

async function setMapView(page, mapHookKey, { center, zoom }) {
  await page.evaluate(
    ({ hookKey, targetCenter, targetZoom }) =>
      new Promise((resolve, reject) => {
        const map = window[hookKey];
        if (!map) {
          reject(new Error("Map test hook is unavailable."));
          return;
        }

        const currentCenter = map.getCenter();
        const centerIsCurrent =
          Math.abs(currentCenter.lng - targetCenter[0]) < 0.0001 &&
          Math.abs(currentCenter.lat - targetCenter[1]) < 0.0001;
        const zoomIsCurrent = Math.abs(map.getZoom() - targetZoom) < 0.0001;
        if (centerIsCurrent && zoomIsCurrent) {
          resolve();
          return;
        }

        const onIdle = () => {
          map.off("idle", onIdle);
          resolve();
        };

        map.on("idle", onIdle);
        map.jumpTo({
          center: targetCenter,
          zoom: targetZoom
        });
      }),
    {
      hookKey: mapHookKey,
      targetCenter: center,
      targetZoom: zoom
    }
  );

  await page.waitForTimeout(200);
}

async function refreshVisibleEntries(page) {
  await page.evaluate(() => {
    const refresh = window.__ibmRefreshVisibleEntriesForTests;
    if (typeof refresh === "function") {
      refresh();
    }
  });
}

async function runDragGesture(page, mapBounds) {
  const centerX = mapBounds.x + mapBounds.width * 0.68;
  const centerY = mapBounds.y + mapBounds.height * 0.56;
  const startX = centerX + 20;
  const startY = centerY + 12;
  const endX = centerX - 180;
  const endY = centerY - 70;
  const durationMs = 2_000;
  const steps = 120;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 2, startY + 1);
  await page.waitForTimeout(Math.floor(durationMs / steps));

  for (let index = 2; index <= steps; index += 1) {
    const ratio = index / steps;
    await page.mouse.move(startX + (endX - startX) * ratio, startY + (endY - startY) * ratio);
    await page.waitForTimeout(Math.floor(durationMs / steps));
  }

  await page.mouse.up();
}

async function runWheelZoomGesture(page, mapBounds) {
  const centerX = mapBounds.x + mapBounds.width * 0.62;
  const centerY = mapBounds.y + mapBounds.height * 0.5;

  await page.mouse.move(centerX, centerY);
  for (let index = 0; index < 6; index += 1) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(110);
  }
  for (let index = 0; index < 6; index += 1) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(110);
  }
}

async function runCtrlWheelPinchGesture(page, mapBounds) {
  const centerX = mapBounds.x + mapBounds.width * 0.62;
  const centerY = mapBounds.y + mapBounds.height * 0.5;

  await page.mouse.move(centerX, centerY);
  await page.keyboard.down("Control");
  try {
    for (let index = 0; index < 6; index += 1) {
      await page.mouse.wheel(0, -80);
      await page.waitForTimeout(100);
    }
    for (let index = 0; index < 6; index += 1) {
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(100);
    }
  } finally {
    await page.keyboard.up("Control");
  }
}

async function runFlyToSelectionScenario(page, mapHookKey) {
  await setMapView(page, mapHookKey, { center: [35.2, 32.8], zoom: 8 });
  await refreshVisibleEntries(page);
  await page.waitForFunction(() => {
    const selector =
      "button[data-place-entry-id^='place:'],button[data-place-entry-id^='area:'],button[data-place-entry-id^='cluster:']";
    return document.querySelectorAll(selector).length > 0;
  }, { timeout: 20_000 });
  await page.waitForTimeout(1_100);
  await refreshVisibleEntries(page);

  const selectedEntryId = await page.evaluate(() => {
    const target =
      document.querySelector("button[data-place-entry-id='place:capernaum']") ??
      document.querySelector("button[data-place-entry-id='area:galilee']") ??
      document.querySelector("button[data-place-entry-id^='place:']") ??
      document.querySelector("button[data-place-entry-id^='area:']");
    if (!(target instanceof HTMLButtonElement)) {
      return null;
    }

    const entryId = target.getAttribute("data-place-entry-id");
    target.click();
    return entryId;
  });

  if (!selectedEntryId) {
    throw new Error("Could not find a selectable place entry for fly-to benchmark.");
  }

  await page.waitForFunction(
    () => {
      const parameters = new URLSearchParams(window.location.search.slice(1));
      return parameters.has("place");
    },
    { timeout: 30_000 }
  );

  return selectedEntryId;
}

function createTileTracker(page) {
  const scenarioState = {
    active: false,
    tileRequestCount: 0,
    knownTileBytes: 0,
    unknownTileBytes: 0,
    pendingResponses: []
  };

  page.on("response", (response) => {
    if (!scenarioState.active) {
      return;
    }

    const responseUrl = response.url();
    if (!isTileRequestUrl(responseUrl)) {
      return;
    }

    const task = (async () => {
      scenarioState.tileRequestCount += 1;
      const headers = await response.allHeaders();
      const contentLengthHeader = headers["content-length"];
      if (typeof contentLengthHeader === "string") {
        const parsed = Number(contentLengthHeader);
        if (Number.isFinite(parsed) && parsed >= 0) {
          scenarioState.knownTileBytes += parsed;
          return;
        }
      }
      scenarioState.unknownTileBytes += 1;
    })();

    scenarioState.pendingResponses.push(task);
  });

  return {
    start() {
      scenarioState.active = true;
      scenarioState.tileRequestCount = 0;
      scenarioState.knownTileBytes = 0;
      scenarioState.unknownTileBytes = 0;
      scenarioState.pendingResponses = [];
    },
    async stop() {
      scenarioState.active = false;
      await Promise.allSettled(scenarioState.pendingResponses);
      return {
        tileRequestCount: scenarioState.tileRequestCount,
        knownTileBytes: scenarioState.knownTileBytes,
        unknownTileBytes: scenarioState.unknownTileBytes
      };
    }
  };
}

function isThrottledRun(monitorResult) {
  if (monitorResult.visibilityStateAtStart !== "visible") {
    return true;
  }

  if (monitorResult.hiddenVisibilitySampleCount > 0 || monitorResult.hiddenFrameCount > 0) {
    return true;
  }

  return monitorResult.maxFrameIntervalMs >= visibilityThrottleGapMs;
}

function buildScenarioList(target) {
  const appendQuery = (urlPath, queryString) => {
    if (!queryString || target.id !== "app") {
      return urlPath;
    }

    const [pathPart, existingQuery = ""] = urlPath.split("?");
    const extra = queryString.startsWith("?") ? queryString.slice(1) : queryString;
    const merged = [existingQuery, extra].filter((value) => value.length > 0).join("&");
    return merged.length > 0 ? `${pathPart}?${merged}` : pathPart;
  };

  const queryString = target.appQuery ?? "";
  const scenarios = [
    {
      id: "drag-overview",
      description: "2s drag at overview",
      path: appendQuery(target.basePath, queryString),
      prepare: null,
      runGesture: runDragGesture
    },
    {
      id: "drag-galilee",
      description: "2s drag near Galilee",
      path:
        target.id === "app"
          ? appendQuery(`${target.basePath}?place=galilee`, queryString)
          : target.basePath,
      prepare:
        target.id === "openfreemap"
          ? async (page, mapHookKey) => {
              await setMapView(page, mapHookKey, { center: [35.2, 32.8], zoom: 8 });
            }
          : null,
      runGesture: runDragGesture
    },
    {
      id: "wheel-zoom-6in6out",
      description: "wheel zoom 6 steps in + 6 out",
      path: appendQuery(target.basePath, queryString),
      prepare: async (page, mapHookKey) => {
        await setMapView(page, mapHookKey, { center: [35.2, 32.8], zoom: 8 });
      },
      runGesture: runWheelZoomGesture
    },
    {
      id: "ctrlwheel-pinch-6in6out",
      description: "trackpad-style pinch (Ctrl+wheel) 6 in + 6 out",
      path: appendQuery(target.basePath, queryString),
      prepare: async (page, mapHookKey) => {
        await setMapView(page, mapHookKey, { center: [35.2, 32.8], zoom: 8 });
      },
      runGesture: runCtrlWheelPinchGesture
    }
  ];

  if (target.includesFlyTo) {
    scenarios.push({
      id: "flyto-selection",
      description: "fly-to after selecting a place",
      path: appendQuery(target.basePath, queryString),
      prepare: null,
      runGesture: null,
      runCustom: runFlyToSelectionScenario
    });
  }

  return scenarios;
}

async function runScenarioAttempt({
  browser,
  target,
  mode,
  baseUrl,
  scenario
}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = await context.newPage();
  const tileTracker = createTileTracker(page);
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(
        `[bench-map:${mode}:${target.id}:${scenario.id}] console error: ${message.text()}`
      );
    }
  });
  page.on("pageerror", (error) => {
    console.error(`[bench-map:${mode}:${target.id}:${scenario.id}] page error: ${error.message}`);
  });

  try {
    await installMapPaintProbe(page);
    const scenarioUrl = `${baseUrl}${scenario.path}`;
    await page.goto(scenarioUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForMapReady(page, target.mapHookKey);
    const webglRenderer = await readWebGlRendererInfo(page);
    await installSetStyleProbe(page, target.mapHookKey);

    if (typeof scenario.prepare === "function") {
      await scenario.prepare(page, target.mapHookKey);
      await waitForMapIdle(page, target.mapHookKey, mapIdleTimeoutMs);
    }

    const mapCanvas = page.locator("canvas.maplibregl-canvas");
    const mapBounds = await mapCanvas.boundingBox();
    if (!mapBounds) {
      throw new Error(`${target.name} ${scenario.id}: map canvas not visible.`);
    }

    if (mode === "headed") {
      await page.bringToFront();
    }

    await installGestureMonitor(page);
    tileTracker.start();
    await startGestureMonitor(page);

    let flyToSelectionEntryId = null;
    if (typeof scenario.runCustom === "function") {
      flyToSelectionEntryId = await scenario.runCustom(page, target.mapHookKey);
    } else if (typeof scenario.runGesture === "function") {
      await scenario.runGesture(page, mapBounds);
    }

    const idleResult = await waitForMapIdle(page, target.mapHookKey, mapIdleTimeoutMs);
    const monitorResult = await stopGestureMonitor(page);
    await disposeGestureMonitor(page);
    const tileResult = await tileTracker.stop();
    const firstMapPaintMs = await readFirstMapPaintMs(page);
    const mainStyleHealth = await readMainStyleHealth(page, target.mapHookKey);
    assertMainStyleHealth(target, scenario, mainStyleHealth);

    return {
      mode,
      targetId: target.id,
      targetName: target.name,
      scenarioId: scenario.id,
      scenarioDescription: scenario.description,
      firstMapPaintMs,
      idleAfterGestureMs: idleResult.elapsedMs,
      idleSignal: idleResult.reason,
      frameSummary: summarizeFrameTimes(monitorResult.frameTimes),
      longTaskSummary: summarizeLongTasks(monitorResult.longTasks),
      mutationCount: monitorResult.mutationCount,
      firstMutationSample: monitorResult.firstMutationSample,
      maxFrameIntervalMs: monitorResult.maxFrameIntervalMs,
      hiddenFrameCount: monitorResult.hiddenFrameCount,
      hiddenVisibilitySampleCount: monitorResult.hiddenVisibilitySampleCount,
      visibilityStateAtStart: monitorResult.visibilityStateAtStart,
      tileRequestCount: tileResult.tileRequestCount,
      tileKnownBytes: tileResult.knownTileBytes,
      tileUnknownByteCount: tileResult.unknownTileBytes,
      selectedEntryId: flyToSelectionEntryId,
      webglRenderer,
      mainStyleHealth
    };
  } finally {
    await context.close();
  }
}

async function runScenarioWithRetries(input) {
  const discardedAttempts = [];
  let accepted = null;

  for (let attemptIndex = 0; attemptIndex < scenarioAttemptLimit; attemptIndex += 1) {
    const attemptResult = await runScenarioAttempt(input);
    const throttled = isThrottledRun(attemptResult);
    const taggedAttempt = {
      ...attemptResult,
      attempt: attemptIndex + 1,
      throttled
    };

    if (!throttled) {
      accepted = taggedAttempt;
      break;
    }

    discardedAttempts.push(taggedAttempt);
  }

  if (accepted) {
    return {
      accepted,
      discardedAttempts
    };
  }

  const fallbackAttempt = discardedAttempts[discardedAttempts.length - 1];
  return {
    accepted: {
      ...fallbackAttempt,
      retainedDespiteThrottle: true
    },
    discardedAttempts: discardedAttempts.slice(0, -1)
  };
}

async function runTargetBenchmark({ browser, mode, baseUrl, target }) {
  const scenarios = buildScenarioList(target);
  const scenarioResults = {};

  for (const scenario of scenarios) {
    console.error(`[bench-map] ${mode} ${target.id} ${scenario.id}`);
    const run = await runScenarioWithRetries({
      browser,
      target,
      mode,
      baseUrl,
      scenario
    });
    scenarioResults[scenario.id] = run;
  }

  const firstScenario = scenarios[0]?.id ? scenarioResults[scenarios[0].id] : null;
  const targetWebglRenderer = firstScenario?.accepted?.webglRenderer ?? null;

  return {
    targetId: target.id,
    targetName: target.name,
    mode,
    webglRenderer: targetWebglRenderer,
    scenarios: scenarioResults
  };
}

function benchmarkModesToRun(mode) {
  if (mode === "headless") {
    return ["headless"];
  }

  if (mode === "headed") {
    return ["headed"];
  }

  return ["headless", "headed"];
}

function summarizeForMarkdown(benchmarkResult) {
  const rows = [];
  for (const [mode, modeResult] of Object.entries(benchmarkResult.modes)) {
    for (const targetResult of modeResult.targets) {
      for (const [scenarioId, scenarioResult] of Object.entries(targetResult.scenarios)) {
        const accepted = scenarioResult.accepted;
        rows.push({
          mode,
          target: targetResult.targetName,
          scenarioId,
          scenarioDescription: accepted.scenarioDescription,
          frameSummary: accepted.frameSummary,
          longTaskSummary: accepted.longTaskSummary,
          idleAfterGestureMs: accepted.idleAfterGestureMs,
          tileRequestCount: accepted.tileRequestCount,
          tileKnownBytes: accepted.tileKnownBytes,
          tileUnknownByteCount: accepted.tileUnknownByteCount,
          firstMapPaintMs: accepted.firstMapPaintMs,
          webglRenderer:
            targetResult.webglRenderer?.rendererString ??
            accepted.webglRenderer?.rendererString ??
            "unknown renderer",
          softwareRenderer:
            targetResult.webglRenderer?.isSoftwareRenderer ??
            accepted.webglRenderer?.isSoftwareRenderer ??
            false,
          hasMainAttribution:
            accepted.mainStyleHealth?.hasMainAttribution ?? null,
          setStyleCallCount:
            accepted.mainStyleHealth?.setStyleCallCount ?? null,
          setStyleSwitchCallCount:
            accepted.mainStyleHealth?.setStyleSwitchCallCount ?? null,
          discardedAttempts: scenarioResult.discardedAttempts.length,
          retainedDespiteThrottle: Boolean(accepted.retainedDespiteThrottle)
        });
      }
    }
  }

  return rows;
}

function toMarkdownTable(benchmarkResult) {
  const rows = summarizeForMarkdown(benchmarkResult);
  const lines = [];
  lines.push(
    "| Mode | Target | WebGL renderer | Scenario | Main attribution | setStyle switches | Frame intervals | Long tasks | Idle after gesture | Tile requests | Tile bytes | First map paint | Notes |"
  );
  lines.push("|---|---|---|---|---|---:|---|---|---:|---:|---:|---:|---|");

  for (const row of rows) {
    const notes = [];
    if (row.discardedAttempts > 0) {
      notes.push(`discarded ${row.discardedAttempts} throttled run(s)`);
    }
    if (row.retainedDespiteThrottle) {
      notes.push("retained throttled run");
    }
    if (row.tileUnknownByteCount > 0) {
      notes.push(`${row.tileUnknownByteCount} tile response(s) without content-length`);
    }

    lines.push(
      [
        row.mode,
        row.target,
        row.webglRenderer,
        row.scenarioDescription,
        row.hasMainAttribution === null ? "n/a" : row.hasMainAttribution ? "yes" : "no",
        row.setStyleSwitchCallCount === null ? "n/a" : String(row.setStyleSwitchCallCount),
        formatFrameSummary(row.frameSummary),
        `count ${row.longTaskSummary.count}, max ${formatMilliseconds(row.longTaskSummary.maxMs)} ms`,
        formatMilliseconds(row.idleAfterGestureMs),
        String(row.tileRequestCount),
        formatBytes(row.tileKnownBytes),
        formatMilliseconds(row.firstMapPaintMs),
        notes.join("; ")
      ]
        .map((cell) => String(cell).replace(/\|/g, "\\|"))
        .join(" | ")
    );
  }

  return lines.join("\n");
}

async function ensureDistExists() {
  try {
    const stat = await fs.stat(distDirectory);
    if (!stat.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "app/dist does not exist. Run `npm run export:web` before `npm run bench:map`."
    );
  }
}

async function runBenchmarks(options) {
  await ensureDistExists();

  const staticServer = await startStaticServer(distDirectory);
  const selectedTargetIds =
    options.target === "both" ? ["app", "openfreemap"] : [options.target];

  const benchmarkResult = {
    generatedAt: new Date().toISOString(),
    machine: {
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      cpus: os.cpus()?.[0]?.model ?? "unknown",
      modeHint:
        "If this is a remote desktop session, visible headed windows are capped by the display refresh rate and covered windows may throttle to ~1 FPS."
    },
    server: {
      distDirectory,
      baseUrl: staticServer.baseUrl
    },
    options: {
      mode: options.mode,
      target: options.target,
      appQuery: options.appQuery,
      chromiumArgs: options.chromiumArgs
    },
    modes: {}
  };

  try {
    for (const mode of benchmarkModesToRun(options.mode)) {
      const headless = mode === "headless";
      const browser = await chromium.launch({
        headless,
        args: options.chromiumArgs
      });

      try {
        const targets = [];
        for (const targetId of selectedTargetIds) {
          const baseTarget = mapBenchmarkTargets[targetId];
          const target =
            targetId === "app"
              ? { ...baseTarget, appQuery: options.appQuery }
              : { ...baseTarget, appQuery: "" };
          const targetResult = await runTargetBenchmark({
            browser,
            mode,
            baseUrl: staticServer.baseUrl,
            target
          });
          targets.push(targetResult);
        }

        benchmarkResult.modes[mode] = {
          targets
        };
      } finally {
        await browser.close();
      }
    }

    benchmarkResult.notFoundPaths = staticServer.notFoundPaths;
    return benchmarkResult;
  } finally {
    await staticServer.close();
  }
}

function resolveOutputPath(maybeRelativePath) {
  if (!maybeRelativePath) {
    return null;
  }

  if (path.isAbsolute(maybeRelativePath)) {
    return maybeRelativePath;
  }

  return path.join(repositoryRoot, maybeRelativePath);
}

async function writeOutputs(result, options) {
  const jsonPath = resolveOutputPath(options.outJson);
  const markdownPath = resolveOutputPath(options.outMarkdown);

  if (jsonPath) {
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  const markdown = toMarkdownTable(result);
  if (markdownPath) {
    await fs.mkdir(path.dirname(markdownPath), { recursive: true });
    await fs.writeFile(markdownPath, `${markdown}\n`, "utf8");
  }

  const output = {
    ...result,
    markdownTable: markdown
  };
  console.log(JSON.stringify(output, null, 2));
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await runBenchmarks(options);
  await writeOutputs(result, options);
}

main().catch((error) => {
  console.error("bench-map failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
