import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  fetchCommonsImageSizes,
  parseCommonsFileNameFromUploadUrl
} from "./lib/commons-image-sizes.mjs";
import {
  createChangedSinceSelectionKey,
  isAiImage,
  selectImagesChangedSinceRef
} from "./lib/check-images-changed-since.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const mediaDirectory = path.join(repositoryRoot, "data", "media");
const commonsThumbnailSourcePath = path.join(
  repositoryRoot,
  "app",
  "src",
  "features",
  "place-panel",
  "commons-thumbnail.ts"
);
const aiMediaDirectory = path.join(repositoryRoot, "media", "ai");

const COMMONS_PREFIX = "/wikipedia/commons/";
const COMMONS_THUMB_PREFIX = "/wikipedia/commons/thumb/";
const REQUEST_CONCURRENCY = 2;
const RETRY_DELAYS_MS = [0, 2000, 5000, 10000, 20000];
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MIN_REQUEST_INTERVAL_MS = 500;
const USER_AGENT =
  "InteractiveBibleMapImageCheck/1.0 (+https://github.com/jameshuangdevelop/interactive-bible-map; contact: repo issues)";
const MAX_AI_IMAGE_WIDTH_PX = 1600;
const MAX_AI_IMAGE_BYTES = 400 * 1024;
const AI_MEDIA_URL_PATTERN =
  /^media\/ai\/([a-z0-9]+(?:-[a-z0-9]+)*-ai-[0-9]{2})\.webp$/u;
const execFileAsync = promisify(execFile);

function readCliArgument(argv, argumentName) {
  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (entry === `--${argumentName}`) {
      return argv[index + 1] ?? null;
    }

    const prefix = `--${argumentName}=`;
    if (entry.startsWith(prefix)) {
      return entry.slice(prefix.length);
    }
  }

  return null;
}

function readChangedSinceRef(argv = process.argv.slice(2)) {
  const rawRef = readCliArgument(argv, "changed-since");
  if (rawRef === null) {
    return null;
  }

  const changedSinceRef = rawRef.trim();
  if (!changedSinceRef) {
    throw new Error("Expected a git ref after --changed-since.");
  }

  return changedSinceRef;
}

function normalizeRelativePath(pathValue) {
  return String(pathValue).replace(/\\/gu, "/");
}

function collectCommandOutput(error) {
  const stdout = typeof error?.stdout === "string" ? error.stdout : "";
  const stderr = typeof error?.stderr === "string" ? error.stderr : "";
  const message = error instanceof Error ? error.message : String(error);
  return `${stdout}\n${stderr}\n${message}`.trim();
}

function isMissingPathAtRefError(error) {
  const output = collectCommandOutput(error).toLowerCase();
  return output.includes("exists on disk, but not in") || output.includes("does not exist in");
}

function toCommonsOriginalPathname(pathname) {
  if (pathname.startsWith(COMMONS_THUMB_PREFIX)) {
    const relativePath = pathname.slice(COMMONS_THUMB_PREFIX.length);
    const segments = relativePath.split("/").filter((segment) => segment.length > 0);
    if (segments.length < 4) {
      return null;
    }

    const originalPathSegments = segments.slice(0, -1);
    const fileName = originalPathSegments[originalPathSegments.length - 1];
    const thumbnailFileName = segments[segments.length - 1];
    const expectedSvgThumbnailFileName = `${fileName}.png`;
    if (
      !fileName ||
      !thumbnailFileName ||
      !/^[1-9][0-9]*px-/u.test(thumbnailFileName) ||
      !(
        thumbnailFileName.endsWith(fileName) ||
        thumbnailFileName.endsWith(expectedSvgThumbnailFileName)
      )
    ) {
      return null;
    }

    return `${COMMONS_PREFIX}${originalPathSegments.join("/")}`;
  }

  if (pathname.startsWith(COMMONS_PREFIX)) {
    return pathname;
  }

  return null;
}

function buildCommonsThumbnailUrl(originalUrl, width) {
  const parsed = new URL(originalUrl);
  parsed.search = "";
  parsed.hash = "";

  const commonsOriginalPath = toCommonsOriginalPathname(parsed.pathname);
  if (!commonsOriginalPath) {
    throw new Error("Not a Commons original URL");
  }

  const relativePath = commonsOriginalPath.slice(COMMONS_PREFIX.length);
  const segments = relativePath.split("/").filter((segment) => segment.length > 0);
  const fileName = segments[segments.length - 1];
  if (!fileName || segments.length < 3) {
    throw new Error("Invalid Commons original path");
  }

  const thumbnailFileName = /\.svg$/iu.test(fileName) ? `${fileName}.png` : fileName;
  parsed.pathname = `${COMMONS_THUMB_PREFIX}${relativePath}/${width}px-${thumbnailFileName}`;
  return parsed.toString();
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16);
}

function parseWebpDimensions(buffer) {
  if (buffer.length < 16) {
    return null;
  }

  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;

    if (chunkDataEnd > buffer.length) {
      return null;
    }

    if (chunkType === "VP8X") {
      if (chunkSize < 10) {
        return null;
      }
      const width = readUInt24LE(buffer, chunkDataStart + 4) + 1;
      const height = readUInt24LE(buffer, chunkDataStart + 7) + 1;
      return { width, height };
    }

    if (chunkType === "VP8 ") {
      if (chunkSize < 10) {
        return null;
      }
      const width = buffer.readUInt16LE(chunkDataStart + 6) & 0x3fff;
      const height = buffer.readUInt16LE(chunkDataStart + 8) & 0x3fff;
      return { width, height };
    }

    if (chunkType === "VP8L") {
      if (chunkSize < 5 || buffer[chunkDataStart] !== 0x2f) {
        return null;
      }

      const packed = buffer.readUInt32LE(chunkDataStart + 1);
      const width = (packed & 0x3fff) + 1;
      const height = ((packed >> 14) & 0x3fff) + 1;
      return { width, height };
    }

    offset = chunkDataEnd + (chunkSize % 2);
  }

  return null;
}

async function loadCommonsThumbnailWidths() {
  const sourceText = await fs.readFile(commonsThumbnailSourcePath, "utf8");
  const match = /COMMONS_THUMBNAIL_WIDTHS\s*=\s*\[([^\]]+)\]/u.exec(sourceText);
  if (!match) {
    throw new Error(
      "Could not find COMMONS_THUMBNAIL_WIDTHS in app/src/features/place-panel/commons-thumbnail.ts"
    );
  }

  const widths = match[1]
    .split(",")
    .map((segment) => Number.parseInt(segment.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (widths.length === 0) {
    throw new Error("No thumbnail widths were parsed from commons-thumbnail.ts");
  }

  return widths;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

let lastRequestStartAt = 0;
let requestGate = Promise.resolve();

async function waitForRequestSlot() {
  const nextGate = requestGate.then(async () => {
    const now = Date.now();
    const waitMilliseconds = Math.max(0, MIN_REQUEST_INTERVAL_MS - (now - lastRequestStartAt));
    if (waitMilliseconds > 0) {
      await delay(waitMilliseconds);
    }
    lastRequestStartAt = Date.now();
  });

  requestGate = nextGate.catch(() => {});
  await nextGate;
}

function retryDelayFromHeaders(response) {
  const retryAfterHeader = response.headers.get("retry-after");
  if (!retryAfterHeader) {
    return null;
  }

  const asSeconds = Number.parseInt(retryAfterHeader, 10);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return asSeconds * 1000;
  }

  const asDate = Date.parse(retryAfterHeader);
  if (!Number.isFinite(asDate)) {
    return null;
  }

  return Math.max(0, asDate - Date.now());
}

async function requestImageAvailability(url) {
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "image/*,*/*;q=0.8"
  };
  await waitForRequestSlot();
  const response = await fetch(url, {
    method: "HEAD",
    headers,
    redirect: "follow"
  });

  if (response.status === 405 || response.status === 501) {
    await waitForRequestSlot();
    const fallbackResponse = await fetch(url, {
      method: "GET",
      headers: {
        ...headers,
        Range: "bytes=0-0"
      },
      redirect: "follow"
    });
    await fallbackResponse.arrayBuffer();
    return fallbackResponse;
  }

  return response;
}

async function checkUrlWithRetry(task) {
  let lastFailure = null;
  for (let attemptIndex = 0; attemptIndex < RETRY_DELAYS_MS.length; attemptIndex += 1) {
    if (attemptIndex > 0) {
      const waitMilliseconds = RETRY_DELAYS_MS[attemptIndex];
      if (waitMilliseconds > 0) {
        await delay(waitMilliseconds);
      }
    }

    try {
      const response = await requestImageAvailability(task.url);
      if (response.status >= 200 && response.status < 400) {
        return null;
      }

      lastFailure = {
        ...task,
        status: response.status,
        message: `HTTP ${response.status}`
      };

      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        return lastFailure;
      }

      const retryAfterMilliseconds = retryDelayFromHeaders(response);
      if (
        retryAfterMilliseconds &&
        attemptIndex + 1 < RETRY_DELAYS_MS.length &&
        retryAfterMilliseconds > RETRY_DELAYS_MS[attemptIndex + 1]
      ) {
        await delay(retryAfterMilliseconds);
      }
    } catch (error) {
      lastFailure = {
        ...task,
        status: "network-error",
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  return lastFailure;
}

async function runWithConcurrency(items, concurrency, worker) {
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

async function loadMediaRecords() {
  const mediaFiles = (await fs.readdir(mediaDirectory))
    .filter((name) => name.endsWith(".json"))
    .sort();

  return Promise.all(
    mediaFiles.map(async (name) => {
      const filePath = path.join(mediaDirectory, name);
      const record = JSON.parse(await fs.readFile(filePath, "utf8"));
      return {
        fileName: name,
        ...record
      };
    })
  );
}

async function readMediaRecordAtRef(changedSinceRef, fileName) {
  const relativePath = `data/media/${fileName}`;
  try {
    const { stdout } = await execFileAsync("git", ["show", `${changedSinceRef}:${relativePath}`], {
      cwd: repositoryRoot,
      maxBuffer: 10 * 1024 * 1024
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (isMissingPathAtRefError(error)) {
      return null;
    }

    throw new Error(
      `Could not read ${relativePath} at ${changedSinceRef}: ${collectCommandOutput(error)}`
    );
  }
}

async function loadBaseMediaRecordsByFileName(changedSinceRef, mediaRecords) {
  const mediaRecordsWithFileName = mediaRecords.filter(
    (mediaRecord) => typeof mediaRecord?.fileName === "string" && mediaRecord.fileName.length > 0
  );

  const entries = (
    await runWithConcurrency(mediaRecordsWithFileName, 4, async (mediaRecord) => {
      const baseRecord = await readMediaRecordAtRef(changedSinceRef, mediaRecord.fileName);
      return [mediaRecord.fileName, baseRecord];
    })
  ).filter((entry) => entry[1] !== null);

  return new Map(entries);
}

async function loadChangedAiFilesSinceRef(changedSinceRef) {
  const { stdout } = await execFileAsync(
    "git",
    ["diff", "--name-only", changedSinceRef, "--", "media/ai"],
    {
      cwd: repositoryRoot,
      maxBuffer: 10 * 1024 * 1024
    }
  );

  const changedPaths = stdout
    .split(/\r?\n/u)
    .map((line) => normalizeRelativePath(line.trim()))
    .filter((line) => line.length > 0 && line.toLowerCase().endsWith(".webp"));

  const existingChangedPaths = (
    await Promise.all(
      changedPaths.map(async (relativePath) => {
        const absolutePath = path.resolve(repositoryRoot, relativePath);
        try {
          const stats = await fs.stat(absolutePath);
          if (!stats.isFile()) {
            return null;
          }
        } catch {
          return null;
        }

        return relativePath;
      })
    )
  ).filter((relativePath) => relativePath !== null);

  return new Set(existingChangedPaths);
}

async function selectChangedImagesSinceRef(changedSinceRef, mediaRecords) {
  const [baseMediaRecordsByFileName, changedAiFiles] = await Promise.all([
    loadBaseMediaRecordsByFileName(changedSinceRef, mediaRecords),
    loadChangedAiFilesSinceRef(changedSinceRef)
  ]);

  return selectImagesChangedSinceRef({
    currentMediaRecords: mediaRecords,
    baseMediaRecordsByFileName,
    changedAiFiles
  });
}

function logChangedSinceSelection(changedSinceRef, summary) {
  console.log(
    `Selected ${summary.selectedImages} of ${summary.totalCurrentImages} image(s) with --changed-since ${changedSinceRef}.`
  );
  console.log(
    `Reasons: ${summary.newMediaFileImages} from new media files, ${summary.addedImages} newly added image(s), ${summary.changedMetadataImages} with changed check fields, ${summary.aiFileChangedImages} with changed AI files.`
  );
  console.log(
    `Skipped ${summary.unchangedImages} unchanged image(s); ${summary.removedImages} removed image(s) were not checked.`
  );
}

async function validateAiImage(task) {
  const failures = [];
  const match = AI_MEDIA_URL_PATTERN.exec(task.image.url);
  if (!match) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "invalid-url",
      message: "AI image url must use media/ai/<location-id>-ai-NN.webp",
      url: task.image.url
    });
    return failures;
  }

  const expectedFileId = match[1];
  if (expectedFileId !== task.image.id) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "id-mismatch",
      message: `AI image url file id '${expectedFileId}' must match image id '${task.image.id}'`,
      url: task.image.url
    });
  }

  const filePath = path.join(aiMediaDirectory, path.basename(task.image.url));
  let stats;
  try {
    stats = await fs.stat(filePath);
  } catch (error) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "missing-file",
      message: error instanceof Error ? error.message : String(error),
      url: task.image.url
    });
    return failures;
  }

  if (!stats.isFile()) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "not-a-file",
      message: "AI media path is not a file",
      url: task.image.url
    });
    return failures;
  }

  if (stats.size > MAX_AI_IMAGE_BYTES) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "too-large",
      message: `File is ${stats.size} bytes; limit is ${MAX_AI_IMAGE_BYTES}`,
      url: task.image.url
    });
  }

  const buffer = await fs.readFile(filePath);
  const dimensions = parseWebpDimensions(buffer);
  if (!dimensions) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "invalid-webp",
      message: "File is not a valid WebP image",
      url: task.image.url
    });
    return failures;
  }

  if (dimensions.width > MAX_AI_IMAGE_WIDTH_PX) {
    failures.push({
      locationId: task.locationId,
      imageId: task.image.id,
      variant: "ai-file",
      status: "too-wide",
      message: `Image width is ${dimensions.width}px; limit is ${MAX_AI_IMAGE_WIDTH_PX}px`,
      url: task.image.url
    });
  }

  return failures;
}

function summarizeFailureRows(failures) {
  return failures.map((failure) => ({
    location: failure.locationId,
    image: failure.imageId,
    variant: failure.variant,
    status: failure.status,
    message: failure.message,
    url: failure.url
  }));
}

async function main() {
  const changedSinceRef = readChangedSinceRef();
  const thumbnailWidths = await loadCommonsThumbnailWidths();
  const mediaRecords = await loadMediaRecords();
  let selectedImageKeys = null;

  if (changedSinceRef) {
    const changedSinceSelection = await selectChangedImagesSinceRef(changedSinceRef, mediaRecords);
    logChangedSinceSelection(changedSinceRef, changedSinceSelection.summary);
    selectedImageKeys = new Set(
      changedSinceSelection.selected.map((selection) => selection.selectionKey)
    );
  }

  const commonsTasks = [];
  const commonsSizeChecks = [];
  const aiTasks = [];

  for (const mediaRecord of mediaRecords) {
    const locationId = mediaRecord.locationId;
    const images = Array.isArray(mediaRecord.images) ? mediaRecord.images : [];

    for (const [imageIndex, image] of images.entries()) {
      if (!image || typeof image !== "object" || typeof image.url !== "string") {
        continue;
      }

      if (
        selectedImageKeys &&
        !selectedImageKeys.has(createChangedSinceSelectionKey(mediaRecord.fileName, imageIndex))
      ) {
        continue;
      }

      if (isAiImage(image)) {
        aiTasks.push({ locationId, image });
        continue;
      }

      const parsed = new URL(image.url);
      parsed.search = "";
      parsed.hash = "";
      const originalUrl = parsed.toString();
      const commonsFileName = parseCommonsFileNameFromUploadUrl(originalUrl);

      if (!commonsFileName) {
        commonsSizeChecks.push({
          locationId,
          imageId: image.id,
          variant: "size-metadata",
          status: "invalid-commons-url",
          message: "Could not parse Commons file name from image url",
          url: originalUrl
        });
      } else {
        commonsSizeChecks.push({
          locationId,
          imageId: image.id,
          fileName: commonsFileName,
          width: image.width,
          height: image.height,
          url: originalUrl
        });
      }

      commonsTasks.push({
        locationId,
        imageId: image.id,
        variant: "original",
        url: originalUrl
      });

      for (const width of thumbnailWidths) {
        commonsTasks.push({
          locationId,
          imageId: image.id,
          variant: `${width}px`,
          url: buildCommonsThumbnailUrl(originalUrl, width)
        });
      }
    }
  }

  const sizeFailures = [];
  const sizeLookupFileNames = Array.from(
    new Set(
      commonsSizeChecks
        .map((entry) => entry.fileName)
        .filter((fileName) => typeof fileName === "string" && fileName.length > 0)
    )
  );
  const commonsSizeByFileName = await fetchCommonsImageSizes(sizeLookupFileNames, {
    userAgent: USER_AGENT,
    maxConcurrency: REQUEST_CONCURRENCY
  });

  for (const check of commonsSizeChecks) {
    if (check.status === "invalid-commons-url") {
      sizeFailures.push(check);
      continue;
    }

    if (!Number.isInteger(check.width) || !Number.isInteger(check.height)) {
      sizeFailures.push({
        locationId: check.locationId,
        imageId: check.imageId,
        variant: "size-metadata",
        status: "missing-dimensions",
        message: "width/height are missing or invalid on the media record",
        url: check.url
      });
      continue;
    }

    const actualSize = commonsSizeByFileName.get(check.fileName);
    if (!actualSize) {
      sizeFailures.push({
        locationId: check.locationId,
        imageId: check.imageId,
        variant: "size-metadata",
        status: "size-not-found",
        message: `No Commons size metadata found for File:${check.fileName}`,
        url: check.url
      });
      continue;
    }

    if (actualSize.width !== check.width || actualSize.height !== check.height) {
      sizeFailures.push({
        locationId: check.locationId,
        imageId: check.imageId,
        variant: "size-metadata",
        status: "size-mismatch",
        message: `Recorded ${check.width}x${check.height} but Commons reports ${actualSize.width}x${actualSize.height}`,
        url: check.url
      });
    }
  }

  const urlFailures = (
    await runWithConcurrency(commonsTasks, REQUEST_CONCURRENCY, (task) =>
      checkUrlWithRetry(task)
    )
  ).filter((failure) => Boolean(failure));

  const aiFailures = (
    await Promise.all(aiTasks.map(async (task) => validateAiImage(task)))
  ).flat();

  const failures = [...sizeFailures, ...urlFailures, ...aiFailures];
  console.log(
    `Checked ${commonsTasks.length} Commons URLs (original + ${thumbnailWidths.join(", ")}px), ${commonsSizeChecks.length} Commons size records, and ${aiTasks.length} AI files.`
  );

  if (failures.length > 0) {
    console.error(`Found ${failures.length} image check failure(s).`);
    console.table(summarizeFailureRows(failures));
    process.exitCode = 1;
    return;
  }

  console.log("All image checks passed.");
}

await main();
