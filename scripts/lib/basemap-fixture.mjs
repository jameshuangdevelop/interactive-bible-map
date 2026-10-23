import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(moduleDirectory, "..", "..");
export const basemapFixtureLockPath = path.join(
  repositoryRoot,
  "tests",
  "fixtures",
  "basemap-fixture.lock.json"
);
export const basemapFixtureCacheRoot = path.join(
  repositoryRoot,
  ".cache",
  "basemap-fixture"
);

function isLiveNetworkEnabled(env = process.env) {
  return env.IBM_LIVE_NETWORK === "1";
}

function isRecordMode(env = process.env) {
  return env.IBM_BASEMAP_RECORD === "1";
}

export async function readBasemapFixtureLock() {
  const raw = await fs.readFile(basemapFixtureLockPath, "utf8");
  const parsed = JSON.parse(raw);
  const requiredKeys = ["repo", "tag", "asset", "sha256", "bytes", "files", "recordedAt"];
  for (const key of requiredKeys) {
    if (!(key in parsed)) {
      throw new Error(`Basemap fixture lock is missing required key '${key}' (${basemapFixtureLockPath}).`);
    }
  }
  return parsed;
}

export function releaseDownloadUrlFromLock(lock) {
  return `https://github.com/${lock.repo}/releases/download/${lock.tag}/${lock.asset}`;
}

export function cacheDirectoryFromLock(lock) {
  return path.join(basemapFixtureCacheRoot, lock.sha256);
}

async function runTarExtract(archivePath, destinationDirectory) {
  await new Promise((resolve, reject) => {
    const child = spawn("tar", ["-xf", archivePath, "-C", destinationDirectory], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`tar extract failed (${archivePath}): ${stderr.trim() || `exit ${code}`}`));
    });
  });
}

async function sha256File(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function verifyFixtureDirectory(candidateDirectory, lock) {
  try {
    const manifestRaw = await fs.readFile(path.join(candidateDirectory, "manifest.json"), "utf8");
    const manifest = JSON.parse(manifestRaw);
    const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
    if (entries.length === 0) {
      return {
        ok: false,
        message: "manifest contains no entries"
      };
    }
    await Promise.all(
      entries.map(async (entry) => {
        if (!entry || typeof entry.file !== "string") {
          throw new Error(`manifest entry is missing a file path: ${JSON.stringify(entry)}`);
        }
        const fixturePath = path.join(candidateDirectory, entry.file);
        const stats = await fs.stat(fixturePath);
        if (!stats.isFile() || stats.size <= 0) {
          throw new Error(`fixture file is empty or missing: ${entry.file}`);
        }
      })
    );
    return { ok: true, manifest };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function fetchWithRetry(url, destinationPath, { attempts = 3, logger = console } = {}) {
  const delaysMs = [0, 1_000, 3_000, 6_000];
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1) {
      const delayMs = delaysMs[Math.min(attempt - 1, delaysMs.length - 1)];
      if (delayMs > 0) {
        logger.log(`Retrying basemap fixture download (attempt ${attempt}/${attempts}) after ${delayMs} ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(destinationPath, buffer);
      return {
        bytes: buffer.length
      };
    } catch (error) {
      lastError = error;
      logger.warn(`Basemap fixture download attempt ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(
    `Failed to download basemap fixture after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

export async function ensureBasemapFixture(options = {}) {
  const { logger = console, env = process.env, allowDownload = true } = options;
  if (isLiveNetworkEnabled(env) || isRecordMode(env)) {
    return {
      mode: isLiveNetworkEnabled(env) ? "live-network" : "record",
      skipped: true
    };
  }

  const lock = await readBasemapFixtureLock();
  const cacheDirectory = cacheDirectoryFromLock(lock);
  const existing = await verifyFixtureDirectory(cacheDirectory, lock);
  if (existing.ok) {
    return {
      mode: "replay",
      skipped: false,
      downloaded: false,
      cacheDirectory,
      lock,
      manifest: existing.manifest
    };
  }

  if (!allowDownload) {
    throw new Error(
      `Basemap fixture cache is missing or invalid at '${cacheDirectory}' (${existing.message ?? "unknown reason"}). Run npm run fetch:basemap-fixture.`
    );
  }

  await fs.mkdir(basemapFixtureCacheRoot, { recursive: true });
  const tempRoot = path.join(basemapFixtureCacheRoot, ".tmp");
  await fs.mkdir(tempRoot, { recursive: true });
  const downloadPath = path.join(tempRoot, `${lock.sha256}.tar.download`);
  const extractionPath = path.join(tempRoot, `${lock.sha256}.extracting-${process.pid}-${Date.now()}`);
  await fs.rm(downloadPath, { force: true });
  await fs.rm(extractionPath, { recursive: true, force: true });
  await fs.mkdir(extractionPath, { recursive: true });

  const releaseUrl = releaseDownloadUrlFromLock(lock);
  logger.log(`Downloading basemap fixture from ${releaseUrl}`);
  const downloadResult = await fetchWithRetry(releaseUrl, downloadPath, { logger, attempts: 3 });

  const downloadedHash = await sha256File(downloadPath);
  if (downloadedHash !== lock.sha256) {
    throw new Error(
      `Basemap fixture checksum mismatch: expected ${lock.sha256}, got ${downloadedHash}.`
    );
  }

  const downloadedStats = await fs.stat(downloadPath);
  if (downloadedStats.size !== lock.bytes) {
    throw new Error(
      `Basemap fixture size mismatch: expected ${lock.bytes} bytes, got ${downloadedStats.size} bytes.`
    );
  }

  await runTarExtract(downloadPath, extractionPath);
  const extracted = await verifyFixtureDirectory(extractionPath, lock);
  if (!extracted.ok) {
    throw new Error(`Extracted basemap fixture is invalid: ${extracted.message}`);
  }

  await fs.rm(cacheDirectory, { recursive: true, force: true });
  await fs.rename(extractionPath, cacheDirectory);
  await fs.rm(downloadPath, { force: true });

  return {
    mode: "replay",
    skipped: false,
    downloaded: true,
    bytes: downloadResult.bytes,
    cacheDirectory,
    lock,
    manifest: extracted.manifest
  };
}

export async function resolveBasemapFixtureDirectory(options = {}) {
  const { env = process.env } = options;
  if (isLiveNetworkEnabled(env) || isRecordMode(env)) {
    return null;
  }
  const lock = await readBasemapFixtureLock();
  const cacheDirectory = cacheDirectoryFromLock(lock);
  const verification = await verifyFixtureDirectory(cacheDirectory, lock);
  if (!verification.ok) {
    throw new Error(
      `Basemap fixture cache is missing or invalid at '${cacheDirectory}' (${verification.message ?? "unknown reason"}). Run npm run fetch:basemap-fixture before running browser tests.`
    );
  }
  return cacheDirectory;
}
