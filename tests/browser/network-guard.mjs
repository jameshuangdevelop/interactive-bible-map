import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { promisify } from "node:util";
import sharp from "sharp";
import { PMTiles } from "pmtiles";
import { resolveBasemapFixtureDirectory } from "../../scripts/lib/basemap-fixture.mjs";
import {
  classifyBasemapUrl,
  decideReplayRequestPolicy,
  isLocalhostUrl
} from "./network-policy.mjs";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");
const defaultEventLogPath = path.join(repositoryRoot, "tests", "artifacts", "network-events.ndjson");

const basemapHosts = new Set(["tiles.openfreemap.org", "tiles.versatiles.org"]);
const replayDisabled = process.env.IBM_LIVE_NETWORK === "1";
const recordMode = process.env.IBM_BASEMAP_RECORD === "1";
const replayMode = !replayDisabled && !recordMode;
const eventLogPath = process.env.IBM_NETWORK_EVENTS_PATH ?? null;
const fixtureMissLogPath = path.join(
  repositoryRoot,
  "tests",
  "artifacts",
  "basemap-fixture-misses.ndjson"
);

const recordDirectoryOverride = process.env.IBM_BASEMAP_RECORD_DIR?.trim() || null;
const recordDirectory = recordDirectoryOverride
  ? path.resolve(repositoryRoot, recordDirectoryOverride)
  : path.join(repositoryRoot, ".cache", "basemap-fixture", "recording-current");
const fixtureBuilderUserAgent =
  "interactive-bible-map-test-fixture (+https://github.com/jameshuangdevelop/interactive-bible-map)";
const upstreamRequestConcurrency = 4;
const openFreeMapPlanetDirsUrl = "https://btrfs.openfreemap.com/dirs.txt";
const openFreeMapAttributionHtml =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

const requestDecisionsByContext = new WeakMap();
const bufferedFailuresByContext = new WeakMap();
const networkEscapeCountsByContext = new WeakMap();
const fixtureMissesByContext = new WeakMap();

let eventLogChain = Promise.resolve();
let fixtureMissLogChain = Promise.resolve();
let placeholderCachePromise = null;
let manifestCachePromise = null;
let replayBodyCachePromise = null;
let recordEntriesByUrl = new Map();
let replayFixtureDirectoryPromise = null;
let openFreeMapPlanetVersionPromise = null;
const pmtilesInstancesByVersion = new Map();
const openFreeMapPublicResponsesByUrl = new Map();
const versatilesPublicResponsesByUrl = new Map();
const upstreamFetchCounts = new Map();
let upstreamRequestsInFlight = 0;
const upstreamRequestQueue = [];

async function resolveReplayFixtureDirectory() {
  if (!replayFixtureDirectoryPromise) {
    replayFixtureDirectoryPromise = resolveBasemapFixtureDirectory({
      env: process.env
    });
  }
  return replayFixtureDirectoryPromise;
}

function normalizeHeaders(headers) {
  if (!headers) {
    return {};
  }
  if (typeof headers.entries === "function") {
    return Object.fromEntries(
      [...headers.entries()].map(([key, value]) => [String(key).toLowerCase(), String(value)])
    );
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [String(key).toLowerCase(), String(value)])
  );
}

function noteUpstreamFetch(url) {
  const host = new URL(url).hostname;
  upstreamFetchCounts.set(host, (upstreamFetchCounts.get(host) ?? 0) + 1);
}

async function withUpstreamConcurrencyLimit(task) {
  if (upstreamRequestsInFlight >= upstreamRequestConcurrency) {
    await new Promise((resolve) => {
      upstreamRequestQueue.push(resolve);
    });
  }
  upstreamRequestsInFlight += 1;
  try {
    return await task();
  } finally {
    upstreamRequestsInFlight -= 1;
    const next = upstreamRequestQueue.shift();
    if (next) {
      next();
    }
  }
}

async function fetchBinaryWithUserAgent(url, options = {}) {
  const { allowErrorStatus = false, ...fetchOptions } = options;
  const retryDelaysMs = [0, 300, 900];
  let lastError = null;
  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      return await withUpstreamConcurrencyLimit(async () => {
        noteUpstreamFetch(url);
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            "User-Agent": fixtureBuilderUserAgent,
            ...(fetchOptions.headers ?? {})
          }
        });
        if (!response.ok && !allowErrorStatus) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }
        const body = Buffer.from(await response.arrayBuffer());
        return {
          status: response.status,
          headers: normalizeHeaders(response.headers),
          body
        };
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function listOpenFreeMapPlanetVersions() {
  const listing = await fetchBinaryWithUserAgent(openFreeMapPlanetDirsUrl);
  const text = listing.body.toString("utf8");
  const versions = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => /^areas\/planet\/[^/]+$/u.test(line))
    .map((line) => line.split("/").at(-1))
    .sort();
  if (versions.length === 0) {
    throw new Error(`Could not find any planet versions in ${openFreeMapPlanetDirsUrl}.`);
  }
  return versions;
}

async function resolveOpenFreeMapPlanetVersion() {
  if (!openFreeMapPlanetVersionPromise) {
    openFreeMapPlanetVersionPromise = (async () => {
      const fromEnvironment = process.env.IBM_OPENFREEMAP_PLANET_VERSION?.trim();
      if (fromEnvironment) {
        return fromEnvironment;
      }
      const versions = await listOpenFreeMapPlanetVersions();
      return versions.at(-1);
    })();
  }
  return openFreeMapPlanetVersionPromise;
}

class LimitedFetchSource {
  constructor(url) {
    this.url = url;
  }

  getKey() {
    return this.url;
  }

  async getBytes(offset, length) {
    const response = await fetchBinaryWithUserAgent(this.url, {
      headers: {
        range: `bytes=${offset}-${offset + length - 1}`
      }
    });
    return {
      data: response.body.buffer.slice(
        response.body.byteOffset,
        response.body.byteOffset + response.body.byteLength
      ),
      etag: response.headers.etag,
      cacheControl: response.headers["cache-control"],
      expires: response.headers.expires
    };
  }
}

async function getPlanetPmtiles(version) {
  if (!pmtilesInstancesByVersion.has(version)) {
    const pmtilesUrl = `https://btrfs.openfreemap.com/areas/planet/${version}/tiles.pmtiles`;
    pmtilesInstancesByVersion.set(version, new PMTiles(new LimitedFetchSource(pmtilesUrl)));
  }
  return pmtilesInstancesByVersion.get(version);
}

function parseOpenFreeMapVectorRequest(pathname) {
  const match = pathname.match(/^\/planet\/([^/]+)\/(\d+)\/(\d+)\/(\d+)\.pbf$/u);
  if (!match) {
    return null;
  }
  return {
    version: match[1],
    z: Number.parseInt(match[2], 10),
    x: Number.parseInt(match[3], 10),
    y: Number.parseInt(match[4], 10)
  };
}

function parseVersaTilesVectorRequest(pathname) {
  const match = pathname.match(/^\/tiles\/osm\/(\d+)\/(\d+)\/(\d+)$/u);
  if (!match) {
    return null;
  }
  return {
    z: Number.parseInt(match[1], 10),
    x: Number.parseInt(match[2], 10),
    y: Number.parseInt(match[3], 10)
  };
}

function neighborTileCoordinates(z, x, y) {
  const maxIndex = 2 ** z - 1;
  const coordinates = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx > maxIndex || ny > maxIndex) {
        continue;
      }
      coordinates.push({ x: nx, y: ny });
    }
  }
  return coordinates;
}

async function prefetchOpenFreeMapVectorNeighbors(vectorRequest, resourceType) {
  const coordinates = neighborTileCoordinates(vectorRequest.z, vectorRequest.x, vectorRequest.y);
  await Promise.all(
    coordinates.map(async ({ x, y }) => {
      const url = `https://tiles.openfreemap.org/planet/${vectorRequest.version}/${vectorRequest.z}/${x}/${y}.pbf`;
      const response = await loadOpenFreeMapPublicResponse(url);
      await recordBasemapResponse({
        responseUrl: url,
        status: response.status,
        headers: response.headers,
        body: response.body,
        resourceType
      });
    })
  );
}

async function prefetchVersaTilesVectorNeighbors(vectorRequest, resourceType) {
  const coordinates = neighborTileCoordinates(vectorRequest.z, vectorRequest.x, vectorRequest.y);
  await Promise.all(
    coordinates.map(async ({ x, y }) => {
      const url = `https://tiles.versatiles.org/tiles/osm/${vectorRequest.z}/${x}/${y}`;
      const response = await loadVersaTilesPublicResponse(url);
      await recordBasemapResponse({
        responseUrl: url,
        status: response.status,
        headers: response.headers,
        body: response.body,
        resourceType
      });
    })
  );
}

async function buildOpenFreeMapTileJson(version) {
  const pmtiles = await getPlanetPmtiles(version);
  const metadata = await pmtiles.getMetadata();
  const header = await pmtiles.getHeader();
  const tileJson = {
    tilejson: "3.0.0",
    name: "OpenFreeMap Planet",
    attribution: metadata?.attribution ?? openFreeMapAttributionHtml,
    scheme: "xyz",
    tiles: [`https://tiles.openfreemap.org/planet/${version}/{z}/{x}/{y}.pbf`],
    minzoom: header.minZoom,
    maxzoom: header.maxZoom,
    bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
    vector_layers: metadata?.vector_layers ?? []
  };
  return Buffer.from(JSON.stringify(tileJson), "utf8");
}

function openFreeMapPublicSourceUrlForPath(pathname) {
  const spriteMatch = pathname.match(/^\/sprites\/ofm_f384\/(ofm(?:@2x)?\.(?:json|png))$/u);
  if (spriteMatch) {
    return `https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/sprites/sprites/ofm_f384/${spriteMatch[1]}`;
  }

  const glyphMatch = pathname.match(/^\/fonts\/([^/]+)\/(\d+-\d+)\.pbf$/u);
  if (glyphMatch) {
    return `https://demotiles.maplibre.org/font/${glyphMatch[1]}/${glyphMatch[2]}.pbf`;
  }

  const reliefMatch = pathname.match(/^\/natural_earth\/ne2sr\/(\d+)\/(\d+)\/(\d+)\.png$/u);
  if (reliefMatch) {
    const [, z, x, y] = reliefMatch;
    return `https://raw.githubusercontent.com/lukasmartinelli/naturalearthtiles/gh-pages/tiles/natural_earth_2_shaded_relief.raster/${z}/${x}/${y}.png`;
  }

  if (pathname === "/styles/liberty") {
    return "https://raw.githubusercontent.com/hyperknot/openfreemap-styles/main/styles/liberty/style.json";
  }

  return null;
}

async function loadOpenFreeMapPublicResponse(requestUrl) {
  if (!openFreeMapPublicResponsesByUrl.has(requestUrl)) {
    openFreeMapPublicResponsesByUrl.set(
      requestUrl,
      (async () => {
        const parsedUrl = new URL(requestUrl);
        if (parsedUrl.pathname === "/planet") {
          const version = await resolveOpenFreeMapPlanetVersion();
          const body = await buildOpenFreeMapTileJson(version);
          return {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=300",
              "access-control-allow-origin": "*"
            },
            body
          };
        }
        const tileJsonMatch = parsedUrl.pathname.match(/^\/planet\/([^/]+)\/tiles\.json$/u);
        if (tileJsonMatch) {
          const version = tileJsonMatch[1];
          const body = await buildOpenFreeMapTileJson(version);
          return {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "public, max-age=300",
              "access-control-allow-origin": "*"
            },
            body
          };
        }

        const vectorRequest = parseOpenFreeMapVectorRequest(parsedUrl.pathname);
        if (vectorRequest) {
          const pmtiles = await getPlanetPmtiles(vectorRequest.version);
          const tile = await pmtiles.getZxy(vectorRequest.z, vectorRequest.x, vectorRequest.y);
          if (!tile) {
            return {
              status: 404,
              headers: {
                "content-type": "text/plain; charset=utf-8",
                "access-control-allow-origin": "*"
              },
              body: Buffer.from("Not found", "utf8")
            };
          }
          return {
            status: 200,
            headers: {
              "content-type": "application/x-protobuf",
              "cache-control": tile.cacheControl ?? "public, max-age=300",
              expires: tile.expires ?? "",
              "access-control-allow-origin": "*"
            },
            body: Buffer.from(tile.data)
          };
        }

        const sourceUrl = openFreeMapPublicSourceUrlForPath(parsedUrl.pathname);
        if (!sourceUrl) {
          throw new Error(
            `No public-source mapping configured for OpenFreeMap URL: ${requestUrl}`
          );
        }
        const upstream = await fetchBinaryWithUserAgent(sourceUrl);
        return {
          status: upstream.status,
          headers: {
            ...upstream.headers,
            "access-control-allow-origin": "*"
          },
          body: upstream.body
        };
      })()
    );
  }
  return openFreeMapPublicResponsesByUrl.get(requestUrl);
}

async function loadVersaTilesPublicResponse(requestUrl) {
  if (!versatilesPublicResponsesByUrl.has(requestUrl)) {
    versatilesPublicResponsesByUrl.set(
      requestUrl,
      (async () => {
        const upstream = await fetchBinaryWithUserAgent(requestUrl, {
          allowErrorStatus: true
        });
        return {
          status: upstream.status,
          headers: {
            ...upstream.headers,
            "access-control-allow-origin": "*"
          },
          body: upstream.body
        };
      })()
    );
  }
  return versatilesPublicResponsesByUrl.get(requestUrl);
}

function isWikimediaCommonsHost(parsedUrl) {
  return (
    parsedUrl.hostname === "upload.wikimedia.org" &&
    parsedUrl.pathname.includes("/wikipedia/commons/")
  );
}

function shouldBypassNetworkGuard(urlString) {
  return isLocalhostUrl(urlString);
}

function mapExtensionToContentType(requestPathname) {
  const lowerPath = requestPathname.toLowerCase();
  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }
  if (lowerPath.endsWith(".webp")) {
    return "image/webp";
  }
  if (lowerPath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }
  return "image/jpeg";
}

async function ensurePlaceholderCache() {
  if (!placeholderCachePromise) {
    placeholderCachePromise = (async () => {
      const baseImage = sharp({
        create: {
          width: 8,
          height: 8,
          channels: 3,
          background: { r: 181, g: 190, b: 206 }
        }
      });
      return {
        "image/jpeg": await baseImage.clone().jpeg({ quality: 70 }).toBuffer(),
        "image/png": await baseImage.clone().png({ compressionLevel: 9 }).toBuffer(),
        "image/webp": await baseImage.clone().webp({ quality: 60 }).toBuffer(),
        "image/gif": await baseImage.clone().gif().toBuffer(),
        "image/svg+xml": Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#b5bece"/></svg>',
          "utf8"
        )
      };
    })();
  }

  let transparentRasterTilePromise = null;
  async function getTransparentRasterReliefTile() {
    if (!transparentRasterTilePromise) {
      transparentRasterTilePromise = sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .png({ compressionLevel: 9 })
        .toBuffer();
    }
    return transparentRasterTilePromise;
  }
  return placeholderCachePromise;
}

function buildFixturePathForUrl(url) {
  const hash = crypto.createHash("sha256").update(url).digest("hex");
  return `responses/${hash}.bin.gz`;
}

async function loadManifest() {
  if (!manifestCachePromise) {
    manifestCachePromise = (async () => {
      const basemapFixtureDirectory = await resolveReplayFixtureDirectory();
      const basemapManifestPath = path.join(basemapFixtureDirectory, "manifest.json");
      const manifestContent = await fs.readFile(basemapManifestPath, "utf8");
      const manifest = JSON.parse(manifestContent);
      const entriesByUrl = new Map(
        manifest.entries.map((entry) => [entry.url, { ...entry, absolutePath: path.join(basemapFixtureDirectory, entry.file) }])
      );
      return {
        metadata: manifest.metadata ?? {},
        entriesByUrl
      };
    })();
  }
  return manifestCachePromise;
}

async function loadReplayBodies() {
  if (!replayBodyCachePromise) {
    replayBodyCachePromise = (async () => {
      const { entriesByUrl } = await loadManifest();
      const responseBodiesByUrl = new Map();
      await Promise.all(
        [...entriesByUrl.values()].map(async (entry) => {
          const compressedBody = await fs.readFile(entry.absolutePath);
          responseBodiesByUrl.set(entry.url, await gunzip(compressedBody));
        })
      );
      return responseBodiesByUrl;
    })();
  }
  return replayBodyCachePromise;
}

function queueEventWrite(event) {
  if (!eventLogPath) {
    return;
  }
  eventLogChain = eventLogChain
    .then(async () => {
      await fs.mkdir(path.dirname(eventLogPath), { recursive: true });
      await fs.appendFile(eventLogPath, `${JSON.stringify(event)}\n`);
    })
    .catch((error) => {
      // Surface write failures in test output and continue so tests still fail normally.
      // eslint-disable-next-line no-console
      console.error(`Failed to write network event log: ${error instanceof Error ? error.message : String(error)}`);
    });
}

function recordFailure(context, message) {
  const failures = bufferedFailuresByContext.get(context) ?? [];
  failures.push(message);
  bufferedFailuresByContext.set(context, failures);
}

function recordFixtureMiss(context, url) {
  const misses = fixtureMissesByContext.get(context) ?? new Set();
  misses.add(url);
  fixtureMissesByContext.set(context, misses);
  fixtureMissLogChain = fixtureMissLogChain
    .then(async () => {
      await fs.mkdir(path.dirname(fixtureMissLogPath), { recursive: true });
      await fs.appendFile(
        fixtureMissLogPath,
        `${JSON.stringify({ at: new Date().toISOString(), url })}\n`
      );
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to write basemap fixture miss log: ${error instanceof Error ? error.message : String(error)}`
      );
    });
}

async function recordBasemapResponse({
  responseUrl,
  status,
  headers,
  body,
  resourceType
}) {
  const parsed = new URL(responseUrl);
  if (!basemapHosts.has(parsed.hostname)) {
    return;
  }
  if (recordEntriesByUrl.has(responseUrl)) {
    return;
  }
  const file = buildFixturePathForUrl(responseUrl);
  const destination = path.join(recordDirectory, file);
  const compressedBody = await gzip(body, { level: 9 });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, compressedBody);
  const contentType = headers["content-type"] ?? headers["Content-Type"] ?? "application/octet-stream";
  recordEntriesByUrl.set(responseUrl, {
    url: responseUrl,
    file,
    status,
    contentType,
    headers: {
      "cache-control": headers["cache-control"] ?? headers["Cache-Control"] ?? "",
      etag: headers.etag ?? headers.ETag ?? "",
      "last-modified": headers["last-modified"] ?? headers["Last-Modified"] ?? "",
      expires: headers.expires ?? headers.Expires ?? "",
      "access-control-allow-origin":
        headers["access-control-allow-origin"] ?? headers["Access-Control-Allow-Origin"] ?? "*"
    },
    bytes: body.length,
    resourceType
  });
}

async function setupResponseObserver(context) {
  const decisions = requestDecisionsByContext.get(context) ?? new WeakMap();
  requestDecisionsByContext.set(context, decisions);
  context.on("response", async (response) => {
    const request = response.request();
    const responseUrl = response.url();
    if (shouldBypassNetworkGuard(responseUrl)) {
      return;
    }

    let responseBodyBytes = null;
    try {
      const body = await response.body();
      responseBodyBytes = body.length;
    } catch {
      responseBodyBytes = null;
    }

    queueEventWrite({
      at: new Date().toISOString(),
      phase: recordMode ? "record" : replayMode ? "replay" : "live",
      url: responseUrl,
      host: new URL(responseUrl).hostname,
      status: response.status(),
      resourceType: request.resourceType(),
      bytes: responseBodyBytes,
      decision: decisions.get(request) ?? "network-unknown"
    });
  });
}

export async function attachNetworkGuardsToContext(context) {
  await setupResponseObserver(context);

  const requestDecisions = requestDecisionsByContext.get(context) ?? new WeakMap();
  requestDecisionsByContext.set(context, requestDecisions);
  networkEscapeCountsByContext.set(context, 0);
  bufferedFailuresByContext.set(context, []);
  fixtureMissesByContext.set(context, new Set());

  await context.route("**/*", async (route) => {
    const request = route.request();
    const requestUrl = request.url();
    if (shouldBypassNetworkGuard(requestUrl)) {
      requestDecisions.set(request, "local");
      await route.continue();
      return;
    }

    const parsedUrl = new URL(requestUrl);
    if (recordMode && basemapHosts.has(parsedUrl.hostname)) {
      try {
        const openFreeMapVectorRequest =
          parsedUrl.hostname === "tiles.openfreemap.org"
            ? parseOpenFreeMapVectorRequest(parsedUrl.pathname)
            : null;
        const versaTilesVectorRequest =
          parsedUrl.hostname === "tiles.versatiles.org"
            ? parseVersaTilesVectorRequest(parsedUrl.pathname)
            : null;
        const replayResponse =
          parsedUrl.hostname === "tiles.openfreemap.org"
            ? await loadOpenFreeMapPublicResponse(requestUrl)
            : await loadVersaTilesPublicResponse(requestUrl);
        await recordBasemapResponse({
          responseUrl: requestUrl,
          status: replayResponse.status,
          headers: replayResponse.headers,
          body: replayResponse.body,
          resourceType: request.resourceType()
        });
        requestDecisions.set(
          request,
          parsedUrl.hostname === "tiles.openfreemap.org"
            ? "network-recorded-openfreemap-public-source"
            : "network-recorded-versatiles"
        );
        const currentCount = networkEscapeCountsByContext.get(context) ?? 0;
        networkEscapeCountsByContext.set(context, currentCount + 1);
        await route.fulfill({
          status: replayResponse.status,
          headers: {
            ...replayResponse.headers,
            "content-length": String(replayResponse.body.length)
          },
          body: replayResponse.body
        });
        if (openFreeMapVectorRequest) {
          await prefetchOpenFreeMapVectorNeighbors(
            openFreeMapVectorRequest,
            request.resourceType()
          );
        } else if (versaTilesVectorRequest) {
          await prefetchVersaTilesVectorNeighbors(
            versaTilesVectorRequest,
            request.resourceType()
          );
        }
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes("Test ended") ||
          message.includes("Request context disposed") ||
          message.includes("Target page, context or browser has been closed")
        ) {
          requestDecisions.set(request, "network-recorded-disposed");
          await route.abort("failed").catch(() => {});
          return;
        }
        throw error;
      }
    }

    if (recordMode || replayDisabled) {
      requestDecisions.set(request, "network-allowed");
      const currentCount = networkEscapeCountsByContext.get(context) ?? 0;
      networkEscapeCountsByContext.set(context, currentCount + 1);
      await route.continue();
      return;
    }

    if (basemapHosts.has(parsedUrl.hostname)) {
      const { entriesByUrl } = await loadManifest();
      const fixtureEntry = entriesByUrl.get(requestUrl);
      const decision = decideReplayRequestPolicy({
        url: requestUrl,
        hasFixtureEntry: Boolean(fixtureEntry)
      });
      if (!fixtureEntry) {
        if (decision.type === "missing-vector-tile") {
          recordFixtureMiss(context, requestUrl);
          requestDecisions.set(request, "missing-vector-tile-empty-204");
          await route.fulfill({
            status: 204,
            headers: {
              "content-type": "application/x-protobuf",
              "access-control-allow-origin": "*",
              "cache-control": "no-store",
              "content-length": "0"
            },
            body: ""
          });
          return;
        }

        if (decision.type === "missing-raster-relief-tile") {
          const body = await getTransparentRasterReliefTile();
          recordFixtureMiss(context, requestUrl);
          requestDecisions.set(request, "missing-raster-relief-transparent-200");
          await route.fulfill({
            status: 200,
            headers: {
              "content-type": "image/png",
              "access-control-allow-origin": "*",
              "cache-control": "no-store",
              "content-length": String(body.length)
            },
            body
          });
          return;
        }

        const resource = classifyBasemapUrl(requestUrl).resourceType;
        const message = `Missing deterministic basemap fixture (${resource}) for ${requestUrl}. Re-record fixtures with npm run record:basemap.`;
        recordFailure(context, message);
        requestDecisions.set(request, "missing-strict-basemap");
        await route.fulfill({
          status: 599,
          contentType: "text/plain; charset=utf-8",
          body: message
        });
        return;
      }

      const responseBodiesByUrl = await loadReplayBodies();
      const body = responseBodiesByUrl.get(requestUrl);
      if (!body) {
        const message = `Fixture body missing for ${requestUrl}. Re-record fixtures with npm run record:basemap.`;
        recordFailure(context, message);
        requestDecisions.set(request, "missing-basemap-body");
        await route.fulfill({
          status: 599,
          contentType: "text/plain; charset=utf-8",
          body: message
        });
        return;
      }

      requestDecisions.set(request, "fixture-basemap");
      const fulfillHeaders = {
        ...fixtureEntry.headers,
        "access-control-allow-origin": fixtureEntry.headers?.["access-control-allow-origin"] || "*",
        "content-type": fixtureEntry.contentType,
        "content-length": String(body.length)
      };
      await route.fulfill({
        status: fixtureEntry.status,
        headers: fulfillHeaders,
        body
      });
      return;
    }

    if (isWikimediaCommonsHost(parsedUrl)) {
      const placeholders = await ensurePlaceholderCache();
      const contentType = mapExtensionToContentType(parsedUrl.pathname);
      const body = placeholders[contentType] ?? placeholders["image/jpeg"];
      requestDecisions.set(request, "fixture-wikimedia-placeholder");
      await route.fulfill({
        status: 200,
        contentType,
        body,
        headers: {
          "cache-control": "public, max-age=31536000",
          "access-control-allow-origin": "*",
          "content-length": String(body.length)
        }
      });
      return;
    }

    const message = `Blocked external network request: ${requestUrl}`;
    requestDecisions.set(request, "blocked-external");
    recordFailure(context, message);
    await route.abort("failed");
  });
}

export function collectNetworkGuardFailures(context) {
  return [...(bufferedFailuresByContext.get(context) ?? [])];
}

export function collectBasemapFixtureMisses(context) {
  return [...(fixtureMissesByContext.get(context) ?? new Set())];
}

export function collectNetworkEscapes(context) {
  return networkEscapeCountsByContext.get(context) ?? 0;
}

export async function flushNetworkEventLogWrites() {
  await eventLogChain;
  await fixtureMissLogChain;
}

export async function writeRecordedBasemapManifest() {
  if (!recordMode) {
    return null;
  }
  const manifestPath = path.join(recordDirectory, "manifest.json");
  const mergedEntriesByUrl = new Map();
  try {
    const existingManifestRaw = await fs.readFile(manifestPath, "utf8");
    const existingManifest = JSON.parse(existingManifestRaw);
    for (const entry of existingManifest.entries ?? []) {
      if (entry?.url && entry?.file) {
        mergedEntriesByUrl.set(entry.url, entry);
      }
    }
  } catch {
    // Ignore missing or invalid existing manifest in record mode; we'll write a fresh one.
  }
  for (const [url, entry] of recordEntriesByUrl.entries()) {
    const { bytes, resourceType, ...persistedEntry } = entry;
    mergedEntriesByUrl.set(url, persistedEntry);
  }
  const sortedEntries = [...mergedEntriesByUrl.values()].sort((left, right) =>
    left.url.localeCompare(right.url)
  );
  const manifest = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceHosts: [...basemapHosts],
      notice: "NOTICE.md",
      recordModeUpstreamFetchCounts: Object.fromEntries(
        [...upstreamFetchCounts.entries()].sort((left, right) => left[0].localeCompare(right[0]))
      ),
      note:
        "Recorded by tests/browser/network-guard.mjs. Keep tile URLs stable by replaying the recorded TileJSON."
    },
    entries: sortedEntries
  };
  await fs.mkdir(recordDirectory, { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return {
    entries: sortedEntries.length,
    totalBytes: null,
    directory: recordDirectory
  };
}

export function getNetworkGuardMode() {
  if (recordMode) {
    return "record";
  }
  if (replayMode) {
    return "replay";
  }
  return "live";
}

export const networkGuardDefaults = {
  defaultEventLogPath
};
