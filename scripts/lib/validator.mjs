import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { OLD_TESTAMENT_BOOKS, parseReference } from "./books.mjs";
import { DEFAULT_WEB_VPL_PATH, getWebTextForReference, loadWebVerseIndex } from "./web-text.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

const DEFAULT_LOCATION_DIRECTORY = path.join(repositoryRoot, "data", "locations");
const DEFAULT_MEDIA_DIRECTORY = path.join(repositoryRoot, "data", "media");

const DEFAULT_LOCATION_SCHEMA_PATH = path.join(repositoryRoot, "schema", "location.schema.json");
const DEFAULT_MEDIA_SCHEMA_PATH = path.join(repositoryRoot, "schema", "media.schema.json");
const DEFAULT_SOURCE_ID_SCHEMA_PATH = path.join(repositoryRoot, "schema", "source-id.schema.json");

export const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});

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
      .map((segment) => decodeURIComponent(segment.replace(/~1/gu, "/").replace(/~0/gu, "~")));

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

function collectLocationNames(locationRecord) {
  const names = [];
  if (Array.isArray(locationRecord.names?.ancient)) {
    names.push(...locationRecord.names.ancient);
  }
  if (typeof locationRecord.names?.modern === "string") {
    names.push(...locationRecord.names.modern.split("/"));
  }
  if (Array.isArray(locationRecord.names?.alternate)) {
    names.push(...locationRecord.names.alternate);
  }
  return names
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
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

async function loadSchemas(locationSchemaPath, mediaSchemaPath, sourceIdSchemaPath) {
  const [locationSchema, mediaSchema, sourceIdSchema] = await Promise.all([
    readJsonFile(locationSchemaPath),
    readJsonFile(mediaSchemaPath),
    readJsonFile(sourceIdSchemaPath)
  ]);
  return { locationSchema, mediaSchema, sourceIdSchema };
}

export async function validateData(options = {}) {
  const locationsDirectory = path.resolve(options.locationsDirectory ?? DEFAULT_LOCATION_DIRECTORY);
  const mediaDirectory = path.resolve(options.mediaDirectory ?? DEFAULT_MEDIA_DIRECTORY);
  const locationSchemaPath = path.resolve(
    options.locationSchemaPath ?? DEFAULT_LOCATION_SCHEMA_PATH
  );
  const mediaSchemaPath = path.resolve(options.mediaSchemaPath ?? DEFAULT_MEDIA_SCHEMA_PATH);
  const sourceIdSchemaPath = path.resolve(
    options.sourceIdSchemaPath ?? DEFAULT_SOURCE_ID_SCHEMA_PATH
  );
  const webVplPath = path.resolve(options.webVplPath ?? DEFAULT_WEB_VPL_PATH);

  const errors = [];
  const warnings = [];

  const { locationSchema, mediaSchema, sourceIdSchema } = await loadSchemas(
    locationSchemaPath,
    mediaSchemaPath,
    sourceIdSchemaPath
  );

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(sourceIdSchema);
  const validateLocationSchema = ajv.compile(locationSchema);
  const validateMediaSchema = ajv.compile(mediaSchema);

  const locationFiles = await listJsonFiles(locationsDirectory);
  const mediaFiles = await listJsonFiles(mediaDirectory);

  const locationRecords = [];
  const mediaRecords = [];

  for (const locationFilePath of locationFiles) {
    let locationRecord;
    try {
      locationRecord = await readJsonFile(locationFilePath);
    } catch (error) {
      errors.push({
        file: relativeFromRepositoryRoot(locationFilePath),
        path: "$",
        message: `Invalid JSON: ${error.message}`
      });
      continue;
    }

    if (!validateLocationSchema(locationRecord)) {
      for (const issue of validateLocationSchema.errors ?? []) {
        errors.push({
          file: relativeFromRepositoryRoot(locationFilePath),
          path: pointerToJsonPath(issue.instancePath, issue.params?.missingProperty),
          message: `Schema validation failed: ${issue.message}`
        });
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
      errors.push({
        file: relativeFromRepositoryRoot(mediaFilePath),
        path: "$",
        message: `Invalid JSON: ${error.message}`
      });
      continue;
    }

    if (!validateMediaSchema(mediaRecord)) {
      for (const issue of validateMediaSchema.errors ?? []) {
        errors.push({
          file: relativeFromRepositoryRoot(mediaFilePath),
          path: pointerToJsonPath(issue.instancePath, issue.params?.missingProperty),
          message: `Schema validation failed: ${issue.message}`
        });
      }
    }

    mediaRecords.push({
      filePath: mediaFilePath,
      relativePath: relativeFromRepositoryRoot(mediaFilePath),
      data: mediaRecord
    });
  }

  const locationIdToFiles = new Map();
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
      errors.push({
        file: locationRecord.relativePath,
        path: "$.id",
        message: `id must equal file name '${expectedIdFromFilename}'`
      });
    }
  }

  for (const [id, files] of locationIdToFiles.entries()) {
    if (files.length < 2) {
      continue;
    }

    for (const filePath of files) {
      errors.push({
        file: filePath,
        path: "$.id",
        message: `Duplicate location id '${id}' also appears in ${files.filter((entry) => entry !== filePath).join(", ")}`
      });
    }
  }

  let webVerseIndex;
  const hasScripture = locationRecords.some((record) => Array.isArray(record.data.scripture) && record.data.scripture.length > 0);
  if (hasScripture) {
    try {
      webVerseIndex = await loadWebVerseIndex(webVplPath);
    } catch (error) {
      for (const locationRecord of locationRecords) {
        errors.push({
          file: locationRecord.relativePath,
          path: "$.scripture",
          message: `Unable to read WEB source text: ${error.message}`
        });
      }
      return { errors, warnings };
    }
  }

  for (const locationRecord of locationRecords) {
    const { data } = locationRecord;
    if (!data || typeof data !== "object") {
      continue;
    }

    if (typeof data.parentId === "string" && !locationIds.has(data.parentId)) {
      errors.push({
        file: locationRecord.relativePath,
        path: "$.parentId",
        message: `parentId '${data.parentId}' does not match any location id`
      });
    }

    if (Array.isArray(data.candidates)) {
      const hasDisputedCandidate = data.candidates.some(
        (candidate) => candidate?.confidence === "disputed"
      );
      if (hasDisputedCandidate && data.candidates.length < 2) {
        errors.push({
          file: locationRecord.relativePath,
          path: "$.candidates",
          message:
            "At least two candidates are required when any candidate confidence is 'disputed'"
        });
      }

      data.candidates.forEach((candidate, candidateIndex) => {
        if (!candidate || typeof candidate !== "object") {
          return;
        }

        if (typeof candidate.coordinateSource === "string" && candidate.coordinateSource.startsWith("osm:")) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.candidates[${candidateIndex}].coordinateSource`,
            message:
              "Coordinate source must not use OSM-derived IDs; use a non-OSM coordinate source"
          });
        }

        if (
          Array.isArray(candidate.sources) &&
          typeof candidate.coordinateSource === "string" &&
          !candidate.sources.includes(candidate.coordinateSource)
        ) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.candidates[${candidateIndex}].coordinateSource`,
            message: "coordinateSource must also appear in candidates[].sources"
          });
        }

        if (Array.isArray(candidate.coordinates) && candidate.coordinates.length === 2) {
          if (!coordinateInsideBounds(candidate.coordinates)) {
            errors.push({
              file: locationRecord.relativePath,
              path: `$.candidates[${candidateIndex}].coordinates`,
              message: `Coordinates must be inside project bounds [${PROJECT_BOUNDS.minLon}, ${PROJECT_BOUNDS.minLat}] to [${PROJECT_BOUNDS.maxLon}, ${PROJECT_BOUNDS.maxLat}]`
            });
          }
        }
      });
    }

    if (Array.isArray(data.otConnections)) {
      data.otConnections.forEach((connection, connectionIndex) => {
        if (typeof connection?.ref !== "string") {
          return;
        }

        try {
          const parsedRef = parseReference(connection.ref);
          if (!OLD_TESTAMENT_BOOKS.has(parsedRef.book)) {
            errors.push({
              file: locationRecord.relativePath,
              path: `$.otConnections[${connectionIndex}].ref`,
              message: "otConnections.ref must use an Old Testament book"
            });
          }
        } catch (error) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.otConnections[${connectionIndex}].ref`,
            message: error.message
          });
        }
      });
    }

    if (Array.isArray(data.politicalHistory)) {
      data.politicalHistory.forEach((entry, entryIndex) => {
        if (typeof entry?.fromYear !== "number" || typeof entry?.toYear !== "number") {
          return;
        }

        if (entry.fromYear > entry.toYear) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.politicalHistory[${entryIndex}]`,
            message: "politicalHistory.fromYear must be less than or equal to politicalHistory.toYear"
          });
        }
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
            errors.push({
              file: locationRecord.relativePath,
              path: `$.scripture[${verseIndex}].book`,
              message: `scripture.book '${verse.book}' must match scripture.ref book '${parsedRef.book}'`
            });
          }
          expectedWebText = getWebTextForReference(verse.ref, webVerseIndex);
        } catch (error) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.scripture[${verseIndex}].ref`,
            message: error.message
          });
          return;
        }

        if (verse.textWEB !== expectedWebText) {
          errors.push({
            file: locationRecord.relativePath,
            path: `$.scripture[${verseIndex}].textWEB`,
            message: "scripture.textWEB does not match the WEB engwebp source text"
          });
        }

        if (locationNames.length > 0 && !verseContainsLocationName(expectedWebText, locationNames)) {
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
    if (typeof data.locationId === "string" && data.locationId !== expectedLocationIdFromFilename) {
      errors.push({
        file: mediaRecord.relativePath,
        path: "$.locationId",
        message: `locationId must equal file name '${expectedLocationIdFromFilename}'`
      });
    }

    if (typeof data.locationId === "string" && !locationIds.has(data.locationId)) {
      errors.push({
        file: mediaRecord.relativePath,
        path: "$.locationId",
        message: `locationId '${data.locationId}' does not match any location id`
      });
    }
  }

  return { errors, warnings };
}
