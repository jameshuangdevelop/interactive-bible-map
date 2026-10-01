import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COMMONS_API_USER_AGENT,
  fetchCommonsImageSizes,
  parseCommonsFileNameFromUploadUrl
} from "./lib/commons-image-sizes.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");
const mediaDirectory = path.join(repositoryRoot, "data", "media");

function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function listMediaFiles() {
  const entries = await fs.readdir(mediaDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(mediaDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function isCommonsImage(image) {
  return image?.aiGenerated !== true && image?.kind !== "ai-reconstruction";
}

function withUpdatedCommonsSize(image, width, height) {
  const updated = {};
  let insertedAfterUrl = false;

  for (const [key, value] of Object.entries(image)) {
    if (key === "width" || key === "height") {
      continue;
    }

    updated[key] = value;
    if (key === "url") {
      updated.width = width;
      updated.height = height;
      insertedAfterUrl = true;
    }
  }

  if (!insertedAfterUrl) {
    updated.width = width;
    updated.height = height;
  }

  return updated;
}

const mediaFiles = await listMediaFiles();
const mediaRecords = await Promise.all(
  mediaFiles.map(async (filePath) => {
    const content = await fs.readFile(filePath, "utf8");
    return {
      filePath,
      relativePath: path.relative(repositoryRoot, filePath).replace(/\\/gu, "/"),
      record: JSON.parse(content)
    };
  })
);

const commonsImages = [];
for (const mediaEntry of mediaRecords) {
  const images = Array.isArray(mediaEntry.record.images) ? mediaEntry.record.images : [];
  for (const [imageIndex, image] of images.entries()) {
    if (!image || typeof image !== "object" || !isCommonsImage(image)) {
      continue;
    }

    const fileName = parseCommonsFileNameFromUploadUrl(image.url);
    if (!fileName) {
      throw new Error(
        `Could not parse Commons file name from ${mediaEntry.relativePath} image ${image.id ?? imageIndex}`
      );
    }

    commonsImages.push({
      mediaEntry,
      imageIndex,
      imageId: image.id,
      fileName
    });
  }
}

const sizeByFileName = await fetchCommonsImageSizes(
  commonsImages.map((entry) => entry.fileName),
  {
    userAgent: COMMONS_API_USER_AGENT,
    maxConcurrency: 2
  }
);

let changedFiles = 0;
let changedImages = 0;

for (const mediaEntry of mediaRecords) {
  const images = Array.isArray(mediaEntry.record.images) ? mediaEntry.record.images : [];
  let fileChanged = false;

  for (const [imageIndex, image] of images.entries()) {
    if (!image || typeof image !== "object" || !isCommonsImage(image)) {
      continue;
    }

    const fileName = parseCommonsFileNameFromUploadUrl(image.url);
    if (!fileName) {
      continue;
    }

    const size = sizeByFileName.get(fileName);
    if (!size) {
      throw new Error(`No Commons size metadata found for '${fileName}'`);
    }

    const widthMatches = Number.isInteger(image.width) && image.width === size.width;
    const heightMatches = Number.isInteger(image.height) && image.height === size.height;
    if (widthMatches && heightMatches) {
      continue;
    }

    mediaEntry.record.images[imageIndex] = withUpdatedCommonsSize(
      image,
      size.width,
      size.height
    );
    fileChanged = true;
    changedImages += 1;
  }

  if (!fileChanged) {
    continue;
  }

  changedFiles += 1;
  await fs.writeFile(mediaEntry.filePath, stringifyJson(mediaEntry.record), "utf8");
}

console.log(
  `Processed ${mediaFiles.length} media file(s), checked ${commonsImages.length} Commons image(s), updated ${changedImages} image(s) across ${changedFiles} file(s).`
);
