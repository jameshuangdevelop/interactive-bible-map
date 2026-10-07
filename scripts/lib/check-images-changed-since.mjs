export const CHANGED_SINCE_REASONS = Object.freeze({
  NEW_MEDIA_FILE: "new-media-file",
  ADDED_IMAGE: "added-image",
  CHANGED_METADATA: "changed-metadata",
  CHANGED_AI_FILE: "changed-ai-file"
});

const CHECK_RELEVANT_IMAGE_FIELDS = Object.freeze([
  "id",
  "url",
  "width",
  "height",
  "kind",
  "aiGenerated"
]);

function normalizeRelativePath(pathValue) {
  return String(pathValue).replace(/\\/gu, "/");
}

function isCheckableImage(image) {
  return Boolean(image && typeof image === "object" && typeof image.url === "string");
}

function imageComparisonKey(image, imageIndex) {
  if (typeof image?.id === "string" && image.id.length > 0) {
    return `id:${image.id}`;
  }

  return `index:${imageIndex}`;
}

function collectChangedFields(currentImage, baseImage) {
  const changedFields = [];
  for (const fieldName of CHECK_RELEVANT_IMAGE_FIELDS) {
    if (!Object.is(currentImage?.[fieldName], baseImage?.[fieldName])) {
      changedFields.push(fieldName);
    }
  }

  return changedFields;
}

export function isAiImage(image) {
  return Boolean(
    image &&
      typeof image === "object" &&
      (image.kind === "ai-reconstruction" || image.aiGenerated === true)
  );
}

export function createChangedSinceSelectionKey(fileName, imageIndex) {
  return `${fileName}#${imageIndex}`;
}

export function selectImagesChangedSinceRef({
  currentMediaRecords,
  baseMediaRecordsByFileName,
  changedAiFiles = new Set()
}) {
  const mediaRecords = Array.isArray(currentMediaRecords) ? currentMediaRecords : [];
  const baseRecordsByFileName =
    baseMediaRecordsByFileName instanceof Map ? baseMediaRecordsByFileName : new Map();
  const normalizedChangedAiFiles = new Set(
    Array.from(changedAiFiles ?? [], (relativePath) => normalizeRelativePath(relativePath))
  );

  const selected = [];
  const summary = {
    totalCurrentImages: 0,
    selectedImages: 0,
    newMediaFileImages: 0,
    addedImages: 0,
    changedMetadataImages: 0,
    aiFileChangedImages: 0,
    unchangedImages: 0,
    removedImages: 0
  };

  for (const mediaRecord of mediaRecords) {
    const fileName =
      typeof mediaRecord?.fileName === "string" && mediaRecord.fileName.length > 0
        ? mediaRecord.fileName
        : null;
    if (!fileName) {
      continue;
    }

    const locationId =
      typeof mediaRecord?.locationId === "string" && mediaRecord.locationId.length > 0
        ? mediaRecord.locationId
        : null;
    const currentImages = Array.isArray(mediaRecord?.images) ? mediaRecord.images : [];
    const baseMediaRecord = baseRecordsByFileName.get(fileName) ?? null;
    const baseImages = Array.isArray(baseMediaRecord?.images) ? baseMediaRecord.images : [];
    const baseMediaFileMissing = baseMediaRecord === null;

    const baseImagesByKey = new Map();
    if (!baseMediaFileMissing) {
      for (const [imageIndex, image] of baseImages.entries()) {
        if (!isCheckableImage(image)) {
          continue;
        }
        baseImagesByKey.set(imageComparisonKey(image, imageIndex), image);
      }
    }

    const currentImageKeys = new Set();

    for (const [imageIndex, image] of currentImages.entries()) {
      if (!isCheckableImage(image)) {
        continue;
      }

      summary.totalCurrentImages += 1;

      const imageKey = imageComparisonKey(image, imageIndex);
      currentImageKeys.add(imageKey);

      const reasonSet = new Set();
      const changedFields = [];

      if (baseMediaFileMissing) {
        reasonSet.add(CHANGED_SINCE_REASONS.NEW_MEDIA_FILE);
      } else {
        const baseImage = baseImagesByKey.get(imageKey);
        if (!baseImage) {
          reasonSet.add(CHANGED_SINCE_REASONS.ADDED_IMAGE);
        } else {
          changedFields.push(...collectChangedFields(image, baseImage));
          if (changedFields.length > 0) {
            reasonSet.add(CHANGED_SINCE_REASONS.CHANGED_METADATA);
          }
        }
      }

      if (isAiImage(image) && normalizedChangedAiFiles.has(normalizeRelativePath(image.url))) {
        reasonSet.add(CHANGED_SINCE_REASONS.CHANGED_AI_FILE);
      }

      if (reasonSet.size === 0) {
        summary.unchangedImages += 1;
        continue;
      }

      const reasons = Array.from(reasonSet);
      if (reasonSet.has(CHANGED_SINCE_REASONS.NEW_MEDIA_FILE)) {
        summary.newMediaFileImages += 1;
      }
      if (reasonSet.has(CHANGED_SINCE_REASONS.ADDED_IMAGE)) {
        summary.addedImages += 1;
      }
      if (reasonSet.has(CHANGED_SINCE_REASONS.CHANGED_METADATA)) {
        summary.changedMetadataImages += 1;
      }
      if (reasonSet.has(CHANGED_SINCE_REASONS.CHANGED_AI_FILE)) {
        summary.aiFileChangedImages += 1;
      }

      selected.push({
        fileName,
        locationId,
        imageId: typeof image.id === "string" && image.id.length > 0 ? image.id : null,
        index: imageIndex,
        url: image.url,
        reasons,
        changedFields,
        selectionKey: createChangedSinceSelectionKey(fileName, imageIndex)
      });
    }

    if (!baseMediaFileMissing) {
      for (const baseImageKey of baseImagesByKey.keys()) {
        if (!currentImageKeys.has(baseImageKey)) {
          summary.removedImages += 1;
        }
      }
    }
  }

  summary.selectedImages = selected.length;
  return { selected, summary };
}
