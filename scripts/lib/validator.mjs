import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { CANONICAL_BOOKS, OLD_TESTAMENT_BOOKS, parseReference } from "./books.mjs";
import {
  DEFAULT_WEB_VPL_PATH,
  getWebTextForReference,
  loadWebVerseIndex
} from "./web-text.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

const DEFAULT_LOCATION_DIRECTORY = path.join(repositoryRoot, "data", "locations");
const DEFAULT_MEDIA_DIRECTORY = path.join(repositoryRoot, "data", "media");

const DEFAULT_LOCATION_SCHEMA_PATH = path.join(
  repositoryRoot,
  "schema",
  "location.schema.json"
);
const DEFAULT_MEDIA_SCHEMA_PATH = path.join(
  repositoryRoot,
  "schema",
  "media.schema.json"
);
const DEFAULT_SOURCE_ID_SCHEMA_PATH = path.join(
  repositoryRoot,
  "schema",
  "source-id.schema.json"
);
const DEFAULT_BIBLIOGRAPHY_SCHEMA_PATH = path.join(
  repositoryRoot,
  "schema",
  "bibliography.schema.json"
);
const DEFAULT_BIBLIOGRAPHY_PATH = path.join(
  repositoryRoot,
  "data",
  "bibliography.json"
);
const DEFAULT_WEB_SNAPSHOT_METADATA_PATH = path.join(
  repositoryRoot,
  "data",
  "reference",
  "engwebp_snapshot_metadata.json"
);

export const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});
export const REQUIRE_EMPIRE_ROOT = false;

const CANONICAL_BOOK_SET = new Set(CANONICAL_BOOKS);
const REGION_LEVEL_TYPES = new Set(["empire", "province", "region"]);

function toPosixPath(value) {
  return value.replace(/\\/gu, "/");
}

function relativeFromRepositoryRoot(filePath) {
  return toPosixPath(path.relative(repositoryRoot, filePath));
}

function pointerToJsonPath(pointer, missingProperty) {
  let pathValue = "$";
  if (pointer) {
    const segments = pointer
      .split("/")
      .slice(1)
      .map((segment) =>
        decodeURIComponent(segment.replace(/~1/gu, "/").replace(/~0/gu, "~"))
      );

    for (const segment of segments) {
      if (/^[0-9]+$/u.test(segment)) {
        pathValue += `[${segment}]`;
      } else if (/^[A-Za-z_][A-Za-z0-9_]*$/u.test(segment)) {
        pathValue += `.${segment}`;
      } else {
        pathValue += `["${segment.replace(/"/gu, '\\"')}"]`;
      }
    }
  }

  if (missingProperty) {
    pathValue += `.${missingProperty}`;
  }

  return pathValue;
}

function recordError(errors, file, pathValue, message) {
  errors.push({
    file,
    path: pathValue,
    message
  });
}

async function listJsonFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => path.join(directoryPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
}

function normalizeNameForDuplicateCheck(value) {
  return value.normalize("NFC").toLowerCase();
}

function splitModernNameVariants(modernName) {
  if (typeof modernName !== "string") {
    return [];
  }
  return modernName.split("/");
}

function toTrimmedNonEmptyNameList(values) {
  return values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function collectTrimmedLocationNames(locationRecord) {
  const names = [];
  if (Array.isArray(locationRecord.names?.ancient)) {
    names.push(...locationRecord.names.ancient);
  }
  names.push(...splitModernNameVariants(locationRecord.names?.modern));
  if (Array.isArray(locationRecord.names?.alternate)) {
    names.push(...locationRecord.names.alternate);
  }
  if (Array.isArray(locationRecord.names?.otherLanguages)) {
    names.push(...locationRecord.names.otherLanguages);
  }

  return toTrimmedNonEmptyNameList(names);
}

function collectLocationNameEntries(locationRecord) {
  const entries = [];

  // names.modern is deliberately excluded here: many places (Rome, Jerusalem, Damascus,
  // Capernaum's "Kfar Nahum") are still known today by the same name they carried in
  // antiquity or in another language, so modern legitimately repeating an ancient,
  // alternate, or otherLanguages entry is expected, not a data error. This check instead
  // catches accidental duplication among the three "historical name" buckets themselves.
  if (Array.isArray(locationRecord.names?.ancient)) {
    locationRecord.names.ancient.forEach((name, index) => {
      entries.push({
        path: `$.names.ancient[${index}]`,
        value: name
      });
    });
  }

  if (Array.isArray(locationRecord.names?.alternate)) {
    locationRecord.names.alternate.forEach((name, index) => {
      entries.push({
        path: `$.names.alternate[${index}]`,
        value: name
      });
    });
  }

  if (Array.isArray(locationRecord.names?.otherLanguages)) {
    locationRecord.names.otherLanguages.forEach((name, index) => {
      entries.push({
        path: `$.names.otherLanguages[${index}]`,
        value: name
      });
    });
  }

  return entries
    .filter((entry) => typeof entry.value === "string")
    .map((entry) => ({
      ...entry,
      value: entry.value.trim()
    }))
    .filter((entry) => entry.value.length > 0);
}

function collectLocationNames(locationRecord) {
  return collectTrimmedLocationNames(locationRecord)
    .map(normalizeText)
    .filter((name) => name.length > 0);
}

function verseContainsLocationName(verseText, names) {
  const normalizedVerse = normalizeText(verseText);
  return names.some((name) => normalizedVerse.includes(name));
}

function coordinateInsideBounds(coordinates) {
  const [lon, lat] = coordinates;
  return (
    lon >= PROJECT_BOUNDS.minLon &&
    lon <= PROJECT_BOUNDS.maxLon &&
    lat >= PROJECT_BOUNDS.minLat &&
    lat <= PROJECT_BOUNDS.maxLat
  );
}

async function loadSchemas(
  locationSchemaPath,
  mediaSchemaPath,
  sourceIdSchemaPath,
  bibliographySchemaPath
) {
  const [locationSchema, mediaSchema, sourceIdSchema, bibliographySchema] =
    await Promise.all([
      readJsonFile(locationSchemaPath),
      readJsonFile(mediaSchemaPath),
      readJsonFile(sourceIdSchemaPath),
      readJsonFile(bibliographySchemaPath)
    ]);
  return { locationSchema, mediaSchema, sourceIdSchema, bibliographySchema };
}

function sourceArrayHasOnlyWikipedia(sourceIds) {
  return (
    sourceIds.length > 0 &&
    sourceIds.every(
      (sourceId) => typeof sourceId === "string" && sourceId.startsWith("wikipedia:")
    )
  );
}

function sourceArrayHasScriptureSource(sourceIds) {
  return (
    Array.isArray(sourceIds) &&
    sourceIds.some(
      (sourceId) =>
        typeof sourceId === "string" && sourceId.startsWith("scripture:")
    )
  );
}

function locationHasScriptureSources(locationData) {
  if (!locationData || typeof locationData !== "object") {
    return false;
  }

  if (sourceArrayHasScriptureSource(locationData.summary?.sources)) {
    return true;
  }

  if (
    Array.isArray(locationData.candidates) &&
    locationData.candidates.some((candidate) =>
      sourceArrayHasScriptureSource(candidate?.sources)
    )
  ) {
    return true;
  }

  if (
    Array.isArray(locationData.history) &&
    locationData.history.some((entry) => sourceArrayHasScriptureSource(entry?.sources))
  ) {
    return true;
  }

  if (
    Array.isArray(locationData.otConnections) &&
    locationData.otConnections.some((entry) =>
      sourceArrayHasScriptureSource(entry?.sources)
    )
  ) {
    return true;
  }

  if (
    Array.isArray(locationData.politicalHistory) &&
    locationData.politicalHistory.some((entry) =>
      sourceArrayHasScriptureSource(entry?.sources)
    )
  ) {
    return true;
  }

  return false;
}

function validateSourceArray({
  sourceIds,
  file,
  pathValue,
  bibliographyIds,
  webVerseIndex,
  errors
}) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
    return;
  }

  if (sourceArrayHasOnlyWikipedia(sourceIds)) {
    recordError(
      errors,
      file,
      pathValue,
      "sources arrays must include at least one non-wikipedia source ID"
    );
  }

  sourceIds.forEach((sourceId, sourceIndex) => {
    if (typeof sourceId !== "string") {
      return;
    }

    if (sourceId.startsWith("bib:")) {
      const bibliographyId = sourceId.slice("bib:".length);
      if (!bibliographyIds.has(bibliographyId)) {
        recordError(
          errors,
          file,
          `${pathValue}[${sourceIndex}]`,
          `Bibliography source '${sourceId}' was not found in data/bibliography.json`
        );
      }
      return;
    }

    if (!sourceId.startsWith("scripture:")) {
      return;
    }

    const sourceReference = sourceId.slice("scripture:".length);
    let parsedReference;
    try {
      parsedReference = parseReference(sourceReference);
    } catch (error) {
      recordError(
        errors,
        file,
        `${pathValue}[${sourceIndex}]`,
        `Invalid scripture source '${sourceId}': ${error.message}`
      );
      return;
    }

    if (!CANONICAL_BOOK_SET.has(parsedReference.book)) {
      recordError(
        errors,
        file,
        `${pathValue}[${sourceIndex}]`,
        `Scripture source '${sourceId}' uses a non-canonical book '${parsedReference.book}'`
      );
      return;
    }

    if (!webVerseIndex) {
      recordError(
        errors,
        file,
        `${pathValue}[${sourceIndex}]`,
        `Unable to validate scripture source '${sourceId}' because WEB text is unavailable`
      );
      return;
    }

    try {
      getWebTextForReference(sourceReference, webVerseIndex);
    } catch (error) {
      recordError(
        errors,
        file,
        `${pathValue}[${sourceIndex}]`,
        `Scripture source '${sourceId}' references verse(s) not found in WEB snapshot: ${error.message}`
      );
    }
  });
}

function computeSha256Hex(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function validateWebSnapshotChecksum({
  metadataPath,
  webVplPath,
  errors
}) {
  const metadataRelativePath = relativeFromRepositoryRoot(metadataPath);
  let metadata;

  try {
    metadata = await readJsonFile(metadataPath);
  } catch (error) {
    recordError(
      errors,
      metadataRelativePath,
      "$",
      `Unable to read WEB snapshot metadata: ${error.message}`
    );
    return;
  }

  if (typeof metadata?.sourceFile !== "string" || metadata.sourceFile.length === 0) {
    recordError(
      errors,
      metadataRelativePath,
      "$.sourceFile",
      "WEB snapshot metadata must include a non-empty sourceFile field"
    );
    return;
  }

  if (
    typeof metadata?.sha256 !== "string" ||
    !/^[a-f0-9]{64}$/u.test(metadata.sha256.toLowerCase())
  ) {
    recordError(
      errors,
      metadataRelativePath,
      "$.sha256",
      "WEB snapshot metadata must include a lowercase SHA-256 checksum"
    );
    return;
  }

  const snapshotFilePath = webVplPath
    ? path.resolve(webVplPath)
    : path.resolve(path.dirname(metadataPath), metadata.sourceFile);

  let snapshotBuffer;
  try {
    snapshotBuffer = await fs.readFile(snapshotFilePath);
  } catch (error) {
    recordError(
      errors,
      relativeFromRepositoryRoot(snapshotFilePath),
      "$",
      `Unable to read WEB snapshot file: ${error.message}`
    );
    return;
  }

  const expected = metadata.sha256.toLowerCase();
  const actual = computeSha256Hex(snapshotBuffer).toLowerCase();
  if (expected !== actual) {
    recordError(
      errors,
      metadataRelativePath,
      "$.sha256",
      `WEB snapshot checksum mismatch: expected ${expected}, got ${actual}`
    );
  }
}

function buildLocationRecordById(locationRecords) {
  const locationRecordsById = new Map();

  for (const locationRecord of locationRecords) {
    const locationId = locationRecord.data?.id;
    if (typeof locationId !== "string" || locationRecordsById.has(locationId)) {
      continue;
    }
    locationRecordsById.set(locationId, locationRecord);
  }

  return locationRecordsById;
}

function getParentId(locationData) {
  return typeof locationData?.parentId === "string" ? locationData.parentId : undefined;
}

function validateLocationHierarchy({
  locationRecordsById,
  requireEmpireRoot,
  errors
}) {
  for (const locationRecord of locationRecordsById.values()) {
    const { data, relativePath } = locationRecord;
    const locationType = data?.type;
    const parentId = getParentId(data);

    if (REGION_LEVEL_TYPES.has(locationType) && data?.zoomTier !== "region") {
      recordError(
        errors,
        relativePath,
        "$.zoomTier",
        `Records of type '${locationType}' must use zoomTier 'region'`
      );
    }

    if (locationType === "empire" && parentId) {
      recordError(
        errors,
        relativePath,
        "$.parentId",
        "Records of type 'empire' must not define parentId"
      );
    }

    if (locationType === "province") {
      if (!parentId) {
        recordError(
          errors,
          relativePath,
          "$.parentId",
          "Records of type 'province' must define parentId pointing to an empire record"
        );
        continue;
      }

      const parentRecord = locationRecordsById.get(parentId);
      if (parentRecord && parentRecord.data?.type !== "empire") {
        recordError(
          errors,
          relativePath,
          "$.parentId",
          `Province parent '${parentId}' must reference a record of type 'empire'`
        );
      }
    }
  }

  const reportedCycleSignatures = new Set();

  for (const startId of locationRecordsById.keys()) {
    const traversalPath = [];
    const traversalIndexById = new Map();
    let currentId = startId;

    while (typeof currentId === "string") {
      if (traversalIndexById.has(currentId)) {
        const cycleStartIndex = traversalIndexById.get(currentId);
        const cycleIds = traversalPath.slice(cycleStartIndex);
        const cycleSignature = [...cycleIds].sort((a, b) => a.localeCompare(b)).join("|");

        if (!reportedCycleSignatures.has(cycleSignature)) {
          reportedCycleSignatures.add(cycleSignature);
          const cyclePath = [...cycleIds, currentId].join(" -> ");

          for (const cycleId of cycleIds) {
            const cycleRecord = locationRecordsById.get(cycleId);
            if (!cycleRecord) {
              continue;
            }
            recordError(
              errors,
              cycleRecord.relativePath,
              "$.parentId",
              `parentId chain must not contain cycles (found: ${cyclePath})`
            );
          }
        }

        break;
      }

      traversalIndexById.set(currentId, traversalPath.length);
      traversalPath.push(currentId);

      const currentRecord = locationRecordsById.get(currentId);
      if (!currentRecord) {
        break;
      }

      const nextParentId = getParentId(currentRecord.data);
      if (!nextParentId) {
        break;
      }
      currentId = nextParentId;
    }
  }

  if (!requireEmpireRoot) {
    return;
  }

  for (const locationRecord of locationRecordsById.values()) {
    let currentRecord = locationRecord;
    const visitedIds = new Set();
    let chainResolved = true;

    while (currentRecord) {
      const currentId = currentRecord.data?.id;
      if (typeof currentId === "string") {
        if (visitedIds.has(currentId)) {
          chainResolved = false;
          break;
        }
        visitedIds.add(currentId);
      }

      const parentId = getParentId(currentRecord.data);
      if (!parentId) {
        break;
      }

      const parentRecord = locationRecordsById.get(parentId);
      if (!parentRecord) {
        chainResolved = false;
        break;
      }

      currentRecord = parentRecord;
    }

    if (!chainResolved || !currentRecord) {
      continue;
    }

    if (currentRecord.data?.type !== "empire") {
      recordError(
        errors,
        locationRecord.relativePath,
        "$.parentId",
        "parentId chain must end at an empire record when REQUIRE_EMPIRE_ROOT is enabled"
      );
    }
  }
}

export async function validateData(options = {}) {
  const locationsDirectory = path.resolve(
    options.locationsDirectory ?? DEFAULT_LOCATION_DIRECTORY
  );
  const mediaDirectory = path.resolve(options.mediaDirectory ?? DEFAULT_MEDIA_DIRECTORY);
  const locationSchemaPath = path.resolve(
    options.locationSchemaPath ?? DEFAULT_LOCATION_SCHEMA_PATH
  );
  const mediaSchemaPath = path.resolve(
    options.mediaSchemaPath ?? DEFAULT_MEDIA_SCHEMA_PATH
  );
  const sourceIdSchemaPath = path.resolve(
    options.sourceIdSchemaPath ?? DEFAULT_SOURCE_ID_SCHEMA_PATH
  );
  const bibliographySchemaPath = path.resolve(
    options.bibliographySchemaPath ?? DEFAULT_BIBLIOGRAPHY_SCHEMA_PATH
  );
  const bibliographyPath = path.resolve(
    options.bibliographyPath ?? DEFAULT_BIBLIOGRAPHY_PATH
  );
  const webSnapshotMetadataPath = path.resolve(
    options.webSnapshotMetadataPath ?? DEFAULT_WEB_SNAPSHOT_METADATA_PATH
  );
  const webVplPath = options.webVplPath
    ? path.resolve(options.webVplPath)
    : path.resolve(DEFAULT_WEB_VPL_PATH);
  const skipSnapshotChecksumCheck = options.skipSnapshotChecksumCheck === true;
  const requireEmpireRoot =
    typeof options.requireEmpireRoot === "boolean"
      ? options.requireEmpireRoot
      : REQUIRE_EMPIRE_ROOT;

  const errors = [];
  const warnings = [];

  const { locationSchema, mediaSchema, sourceIdSchema, bibliographySchema } =
    await loadSchemas(
      locationSchemaPath,
      mediaSchemaPath,
      sourceIdSchemaPath,
      bibliographySchemaPath
    );

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(sourceIdSchema);
  const validateLocationSchema = ajv.compile(locationSchema);
  const validateMediaSchema = ajv.compile(mediaSchema);
  const validateBibliographySchema = ajv.compile(bibliographySchema);

  let bibliographyData = { entries: [] };
  const bibliographyRelativePath = relativeFromRepositoryRoot(bibliographyPath);

  try {
    bibliographyData = await readJsonFile(bibliographyPath);
  } catch (error) {
    recordError(
      errors,
      bibliographyRelativePath,
      "$",
      `Unable to read bibliography file: ${error.message}`
    );
  }

  if (!validateBibliographySchema(bibliographyData)) {
    for (const issue of validateBibliographySchema.errors ?? []) {
      recordError(
        errors,
        bibliographyRelativePath,
        pointerToJsonPath(issue.instancePath, issue.params?.missingProperty),
        `Schema validation failed: ${issue.message}`
      );
    }
  }

  const bibliographyIds = new Set();
  if (Array.isArray(bibliographyData?.entries)) {
    bibliographyData.entries.forEach((entry, entryIndex) => {
      if (typeof entry?.id !== "string") {
        return;
      }

      if (bibliographyIds.has(entry.id)) {
        recordError(
          errors,
          bibliographyRelativePath,
          `$.entries[${entryIndex}].id`,
          `Duplicate bibliography id '${entry.id}'`
        );
        return;
      }

      bibliographyIds.add(entry.id);
    });
  }

  if (!skipSnapshotChecksumCheck) {
    await validateWebSnapshotChecksum({
      metadataPath: webSnapshotMetadataPath,
      webVplPath: options.webVplPath ? webVplPath : undefined,
      errors
    });
  }

  const locationFiles = await listJsonFiles(locationsDirectory);
  const mediaFiles = await listJsonFiles(mediaDirectory);

  const locationRecords = [];
  const mediaRecords = [];

  for (const locationFilePath of locationFiles) {
    let locationRecord;
    try {
      locationRecord = await readJsonFile(locationFilePath);
    } catch (error) {
      recordError(
        errors,
        relativeFromRepositoryRoot(locationFilePath),
        "$",
        `Invalid JSON: ${error.message}`
      );
      continue;
    }

    if (!validateLocationSchema(locationRecord)) {
      for (const issue of validateLocationSchema.errors ?? []) {
        recordError(
          errors,
          relativeFromRepositoryRoot(locationFilePath),
          pointerToJsonPath(issue.instancePath, issue.params?.missingProperty),
          `Schema validation failed: ${issue.message}`
        );
      }
    }

    locationRecords.push({
      filePath: locationFilePath,
      relativePath: relativeFromRepositoryRoot(locationFilePath),
      data: locationRecord
    });
  }

  for (const mediaFilePath of mediaFiles) {
    let mediaRecord;
    try {
      mediaRecord = await readJsonFile(mediaFilePath);
    } catch (error) {
      recordError(
        errors,
        relativeFromRepositoryRoot(mediaFilePath),
        "$",
        `Invalid JSON: ${error.message}`
      );
      continue;
    }

    if (!validateMediaSchema(mediaRecord)) {
      for (const issue of validateMediaSchema.errors ?? []) {
        recordError(
          errors,
          relativeFromRepositoryRoot(mediaFilePath),
          pointerToJsonPath(issue.instancePath, issue.params?.missingProperty),
          `Schema validation failed: ${issue.message}`
        );
      }
    }

    mediaRecords.push({
      filePath: mediaFilePath,
      relativePath: relativeFromRepositoryRoot(mediaFilePath),
      data: mediaRecord
    });
  }

  const locationIdToFiles = new Map();
  const imageIdToFiles = new Map();
  const locationIds = new Set();

  for (const locationRecord of locationRecords) {
    const { data } = locationRecord;
    if (typeof data.id !== "string") {
      continue;
    }

    locationIds.add(data.id);
    const idFiles = locationIdToFiles.get(data.id) ?? [];
    idFiles.push(locationRecord.relativePath);
    locationIdToFiles.set(data.id, idFiles);

    const expectedIdFromFilename = path.basename(locationRecord.filePath, ".json");
    if (data.id !== expectedIdFromFilename) {
      recordError(
        errors,
        locationRecord.relativePath,
        "$.id",
        `id must equal file name '${expectedIdFromFilename}'`
      );
    }
  }

  for (const [id, files] of locationIdToFiles.entries()) {
    if (files.length < 2) {
      continue;
    }

    for (const filePath of files) {
      recordError(
        errors,
        filePath,
        "$.id",
        `Duplicate location id '${id}' also appears in ${files
          .filter((entry) => entry !== filePath)
          .join(", ")}`
      );
    }
  }

  const locationRecordsById = buildLocationRecordById(locationRecords);
  validateLocationHierarchy({ locationRecordsById, requireEmpireRoot, errors });

  let webVerseIndex;
  const hasScriptureSources = locationRecords.some((record) =>
    locationHasScriptureSources(record.data)
  );
  const hasScripture = locationRecords.some(
    (record) => Array.isArray(record.data.scripture) && record.data.scripture.length > 0
  );
  if (hasScripture || hasScriptureSources) {
    try {
      webVerseIndex = await loadWebVerseIndex(webVplPath);
    } catch (error) {
      for (const locationRecord of locationRecords) {
        recordError(
          errors,
          locationRecord.relativePath,
          hasScripture ? "$.scripture" : "$",
          `Unable to read WEB source text required for scripture validation: ${error.message}`
        );
      }
      return { errors, warnings };
    }
  }

  for (const locationRecord of locationRecords) {
    const { data } = locationRecord;
    if (!data || typeof data !== "object") {
      continue;
    }

    const hasDisputedCandidate =
      Array.isArray(data.candidates) &&
      data.candidates.some((candidate) => candidate?.confidence === "disputed");

    if (typeof data.parentId === "string" && !locationIds.has(data.parentId)) {
      recordError(
        errors,
        locationRecord.relativePath,
        "$.parentId",
        `parentId '${data.parentId}' does not match any location id`
      );
    }

    if (Array.isArray(data.candidates)) {
      if (hasDisputedCandidate && data.candidates.length < 2) {
        recordError(
          errors,
          locationRecord.relativePath,
          "$.candidates",
          "At least two candidates are required when any candidate confidence is 'disputed'"
        );
      }

      data.candidates.forEach((candidate, candidateIndex) => {
        if (!candidate || typeof candidate !== "object") {
          return;
        }

        if (
          typeof candidate.coordinateSource === "string" &&
          candidate.coordinateSource.startsWith("osm:")
        ) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.candidates[${candidateIndex}].coordinateSource`,
            "Coordinate source must not use OSM-derived IDs; use a non-OSM coordinate source"
          );
        }

        if (
          typeof candidate.coordinateSource === "string" &&
          candidate.coordinateSource.startsWith("wikipedia:")
        ) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.candidates[${candidateIndex}].coordinateSource`,
            "Coordinate source must not use wikipedia: IDs; use a geospatial dataset source"
          );
        }

        if (
          typeof candidate.coordinateSource === "string" &&
          candidate.coordinateSource.startsWith("scripture:")
        ) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.candidates[${candidateIndex}].coordinateSource`,
            "Coordinate source must not use scripture: IDs; use a geospatial dataset source"
          );
        }

        if (
          Array.isArray(candidate.sources) &&
          typeof candidate.coordinateSource === "string" &&
          !candidate.sources.includes(candidate.coordinateSource)
        ) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.candidates[${candidateIndex}].coordinateSource`,
            "coordinateSource must also appear in candidates[].sources"
          );
        }

        validateSourceArray({
          sourceIds: candidate.sources,
          file: locationRecord.relativePath,
          pathValue: `$.candidates[${candidateIndex}].sources`,
          bibliographyIds,
          webVerseIndex,
          errors
        });

        if (Array.isArray(candidate.coordinates) && candidate.coordinates.length === 2) {
          if (!coordinateInsideBounds(candidate.coordinates)) {
            recordError(
              errors,
              locationRecord.relativePath,
              `$.candidates[${candidateIndex}].coordinates`,
              `Coordinates must be inside project bounds [${PROJECT_BOUNDS.minLon}, ${PROJECT_BOUNDS.minLat}] to [${PROJECT_BOUNDS.maxLon}, ${PROJECT_BOUNDS.maxLat}]`
            );
          }
        }
      });
    }

    if (typeof data.names?.modern === "string") {
      if (/\bdisputed\b/iu.test(data.names.modern)) {
        recordError(
          errors,
          locationRecord.relativePath,
          "$.names.modern",
          "names.modern must not contain the word 'disputed'"
        );
      }

      if (hasDisputedCandidate) {
        recordError(
          errors,
          locationRecord.relativePath,
          "$.names.modern",
          "names.modern must be omitted when any candidate confidence is 'disputed'"
        );
      }
    }

    if (Array.isArray(data.names?.otherLanguages) && data.names.otherLanguages.length > 0) {
      const namesByNormalizedValue = new Map();
      for (const nameEntry of collectLocationNameEntries(data)) {
        const normalizedName = normalizeNameForDuplicateCheck(nameEntry.value);
        if (normalizedName.length === 0) {
          continue;
        }

        const entries = namesByNormalizedValue.get(normalizedName) ?? [];
        entries.push(nameEntry);
        namesByNormalizedValue.set(normalizedName, entries);
      }

      for (const duplicateNameEntries of namesByNormalizedValue.values()) {
        if (duplicateNameEntries.length < 2) {
          continue;
        }

        const duplicateLocations = duplicateNameEntries
          .map((entry) => `${entry.path} ('${entry.value}')`)
          .join(", ");
        recordError(
          errors,
          locationRecord.relativePath,
          "$.names",
          `Duplicate location name '${duplicateNameEntries[0].value}' appears more than once across names.ancient, names.alternate, and names.otherLanguages: ${duplicateLocations}`
        );
      }
    }

    validateSourceArray({
      sourceIds: data.summary?.sources,
      file: locationRecord.relativePath,
      pathValue: "$.summary.sources",
      bibliographyIds,
      webVerseIndex,
      errors
    });

    if (Array.isArray(data.history)) {
      data.history.forEach((entry, historyIndex) => {
        validateSourceArray({
          sourceIds: entry?.sources,
          file: locationRecord.relativePath,
          pathValue: `$.history[${historyIndex}].sources`,
          bibliographyIds,
          webVerseIndex,
          errors
        });
      });
    }

    if (Array.isArray(data.otConnections)) {
      data.otConnections.forEach((connection, connectionIndex) => {
        if (typeof connection?.ref === "string") {
          try {
            const parsedRef = parseReference(connection.ref);
            if (!OLD_TESTAMENT_BOOKS.has(parsedRef.book)) {
              recordError(
                errors,
                locationRecord.relativePath,
                `$.otConnections[${connectionIndex}].ref`,
                "otConnections.ref must use an Old Testament book"
              );
            }
          } catch (error) {
            recordError(
              errors,
              locationRecord.relativePath,
              `$.otConnections[${connectionIndex}].ref`,
              error.message
            );
          }
        }

        validateSourceArray({
          sourceIds: connection?.sources,
          file: locationRecord.relativePath,
          pathValue: `$.otConnections[${connectionIndex}].sources`,
          bibliographyIds,
          webVerseIndex,
          errors
        });
      });
    }

    if (Array.isArray(data.politicalHistory)) {
      data.politicalHistory.forEach((entry, entryIndex) => {
        if (typeof entry?.fromYear === "number" && typeof entry?.toYear === "number") {
          if (entry.fromYear > entry.toYear) {
            recordError(
              errors,
              locationRecord.relativePath,
              `$.politicalHistory[${entryIndex}]`,
              "politicalHistory.fromYear must be less than or equal to politicalHistory.toYear"
            );
          }
        }

        validateSourceArray({
          sourceIds: entry?.sources,
          file: locationRecord.relativePath,
          pathValue: `$.politicalHistory[${entryIndex}].sources`,
          bibliographyIds,
          webVerseIndex,
          errors
        });
      });
    }

    if (Array.isArray(data.scripture) && webVerseIndex) {
      const locationNames = collectLocationNames(data);

      data.scripture.forEach((verse, verseIndex) => {
        if (!verse || typeof verse !== "object") {
          return;
        }

        if (typeof verse.ref !== "string" || typeof verse.textWEB !== "string") {
          return;
        }

        let expectedWebText;
        try {
          const parsedRef = parseReference(verse.ref);
          if (typeof verse.book === "string" && parsedRef.book !== verse.book) {
            recordError(
              errors,
              locationRecord.relativePath,
              `$.scripture[${verseIndex}].book`,
              `scripture.book '${verse.book}' must match scripture.ref book '${parsedRef.book}'`
            );
          }
          expectedWebText = getWebTextForReference(verse.ref, webVerseIndex);
        } catch (error) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.scripture[${verseIndex}].ref`,
            error.message
          );
          return;
        }

        if (verse.textWEB !== expectedWebText) {
          recordError(
            errors,
            locationRecord.relativePath,
            `$.scripture[${verseIndex}].textWEB`,
            "scripture.textWEB does not match the WEB engwebp source text"
          );
        }

        if (
          locationNames.length > 0 &&
          !verseContainsLocationName(expectedWebText, locationNames)
        ) {
          warnings.push({
            file: locationRecord.relativePath,
            path: `$.scripture[${verseIndex}].textWEB`,
            message:
              "WEB verse text contains none of this location's configured names; double-check the scripture linkage"
          });
        }
      });
    }
  }

  for (const mediaRecord of mediaRecords) {
    const { data } = mediaRecord;
    if (!data || typeof data !== "object") {
      continue;
    }

    const expectedLocationIdFromFilename = path.basename(mediaRecord.filePath, ".json");
    if (
      typeof data.locationId === "string" &&
      data.locationId !== expectedLocationIdFromFilename
    ) {
      recordError(
        errors,
        mediaRecord.relativePath,
        "$.locationId",
        `locationId must equal file name '${expectedLocationIdFromFilename}'`
      );
    }

    if (typeof data.locationId === "string" && !locationIds.has(data.locationId)) {
      recordError(
        errors,
        mediaRecord.relativePath,
        "$.locationId",
        `locationId '${data.locationId}' does not match any location id`
      );
    }

    if (Array.isArray(data.images)) {
      data.images.forEach((image, imageIndex) => {
        if (!image || typeof image !== "object" || typeof image.id !== "string") {
          return;
        }

        const imageIdPath = `$.images[${imageIndex}].id`;
        if (typeof data.locationId === "string") {
          const expectedPrefix = `${data.locationId}-`;
          if (!image.id.startsWith(expectedPrefix)) {
            recordError(
              errors,
              mediaRecord.relativePath,
              imageIdPath,
              `Image id '${image.id}' must start with '${expectedPrefix}' to match locationId`
            );
          } else {
            const expectedId = `${data.locationId}-${String(imageIndex + 1).padStart(2, "0")}`;
            if (image.id !== expectedId) {
              recordError(
                errors,
                mediaRecord.relativePath,
                imageIdPath,
                `Image id '${image.id}' must be '${expectedId}' to keep sequential order 01, 02, ...`
              );
            }
          }
        }

        const files = imageIdToFiles.get(image.id) ?? [];
        files.push({
          file: mediaRecord.relativePath,
          path: imageIdPath
        });
        imageIdToFiles.set(image.id, files);
      });
    }
  }

  for (const [imageId, files] of imageIdToFiles.entries()) {
    if (files.length < 2) {
      continue;
    }

    for (const entry of files) {
      recordError(
        errors,
        entry.file,
        entry.path,
        `Duplicate image id '${imageId}' also appears in ${files
          .filter((candidate) => candidate !== entry)
          .map((candidate) => `${candidate.file}:${candidate.path}`)
          .join(", ")}`
      );
    }
  }

  return { errors, warnings };
}
