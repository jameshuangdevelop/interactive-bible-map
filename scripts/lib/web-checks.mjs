import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(moduleDirectory, "..", "..");
export const distDirectory = path.join(repositoryRoot, "app", "dist");

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
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export function readCliArgument(argv, name) {
  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (entry === `--${name}`) {
      return argv[index + 1] ?? null;
    }

    const prefix = `--${name}=`;
    if (entry.startsWith(prefix)) {
      return entry.slice(prefix.length);
    }
  }

  return null;
}

function normalizeBaseUrl(baseUrl) {
  const parsed = new URL(baseUrl);
  parsed.search = "";
  parsed.hash = "";
  const normalized = parsed.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function readBaseUrlArgument(argv = process.argv.slice(2), env = process.env) {
  const baseUrlArgument = readCliArgument(argv, "base-url");
  const baseUrlFromEnvironment = env.BASE_URL?.trim();
  const baseUrl = baseUrlArgument ?? (baseUrlFromEnvironment ? baseUrlFromEnvironment : null);
  if (!baseUrl) {
    return null;
  }

  return normalizeBaseUrl(baseUrl);
}

export async function startStaticServer(rootDirectory, options = {}) {
  const host = options.host ?? "127.0.0.1";
  const port =
    typeof options.port === "number" && Number.isInteger(options.port) && options.port >= 0
      ? options.port
      : 0;
  const absoluteRootDirectory = path.resolve(rootDirectory);

  await fs.access(absoluteRootDirectory);

  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://localhost");
      let requestPath = decodeURIComponent(requestUrl.pathname);
      if (requestPath === "/") {
        requestPath = "/index.html";
      }

      const normalizedPath = path.normalize(requestPath).replace(/^([\\/])+/, "");
      const candidatePath = path.resolve(path.join(absoluteRootDirectory, normalizedPath));
      const relativePath = path.relative(absoluteRootDirectory, candidatePath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        response.writeHead(403, {
          "Content-Type": "text/plain; charset=utf-8"
        });
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
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Not found");
    }
  });

  await new Promise((resolve) => {
    server.listen(port, host, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine static server address.");
  }

  return {
    baseUrl: `http://${host}:${address.port}`,
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

export async function resolveBaseUrlAndServer(options = {}) {
  const argv = options.argv ?? process.argv.slice(2);
  const env = options.env ?? process.env;
  const providedBaseUrl = options.baseUrl ?? readBaseUrlArgument(argv, env);
  if (providedBaseUrl) {
    return {
      baseUrl: providedBaseUrl,
      usingProvidedBaseUrl: true,
      close: async () => {}
    };
  }

  const portArgument = readCliArgument(argv, "port");
  const parsedPort = portArgument ? Number.parseInt(portArgument, 10) : Number.NaN;
  const staticServer = await startStaticServer(options.rootDirectory ?? distDirectory, {
    port: Number.isInteger(parsedPort) && parsedPort >= 0 ? parsedPort : undefined
  });

  return {
    baseUrl: staticServer.baseUrl,
    usingProvidedBaseUrl: false,
    close: staticServer.close
  };
}

export async function withResolvedBaseUrl(task, options = {}) {
  const resolved = await resolveBaseUrlAndServer(options);
  try {
    return await task({
      baseUrl: resolved.baseUrl,
      usingProvidedBaseUrl: resolved.usingProvidedBaseUrl
    });
  } finally {
    await resolved.close();
  }
}

export async function waitForMapToSettle(page, options = {}) {
  const timeout = options.timeoutMs ?? 60_000;
  const settleDelayMs = options.settleDelayMs ?? 1_000;
  const mapTestHookKey = options.mapTestHookKey ?? "__ibmMapForTests";

  await page.waitForSelector("canvas.maplibregl-canvas", { timeout });
  await page.waitForSelector("button[data-place-entry-id]", { timeout });
  await page.waitForFunction(
    (testHookKey) => {
      const map = window[testHookKey];
      if (!map) {
        return true;
      }

      return map.loaded() && !map.isMoving() && map.areTilesLoaded();
    },
    mapTestHookKey,
    { timeout, polling: 250 }
  );
  await page.waitForTimeout(settleDelayMs);
}
