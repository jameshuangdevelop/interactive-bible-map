import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateData } from "./validator.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

const DEFAULT_LOCATIONS_DIRECTORY = path.join(repositoryRoot, "data", "locations");
const DEFAULT_MEDIA_DIRECTORY = path.join(repositoryRoot, "data", "media");
const DEFAULT_BIBLIOGRAPHY_PATH = path.join(repositoryRoot, "data", "bibliography.json");
const DEFAULT_OUTPUT_DIRECTORY = path.join(repositoryRoot, "app", "public", "generated");

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

function collectBibSourceIds(locationRecord) {
  const bibliographyIds = new Set();

  function ingestSources(sources) {
    if (!Array.isArray(sources)) {
      return;
    }

    for (const sourceId of sources) {
      if (typeof sourceId !== "string" || !sourceId.startsWith("bib:")) {
        continue;
      }
      bibliographyIds.add(sourceId.slice("bib:".length));
    }
  }

  ingestSources(locationRecord.summary?.sources);

  if (Array.isArray(locationRecord.candidates)) {
    for (const candidate of locationRecord.candidates) {
      ingestSources(candidate?.sources);
    }
  }

  if (Array.isArray(locationRecord.history)) {
    for (const historyEntry of locationRecord.history) {
      ingestSources(historyEntry?.sources);
    }
  }

  if (Array.isArray(locationRecord.otConnections)) {
    for (const connection of locationRecord.otConnections) {
      ingestSources(connection?.sources);
    }
  }

  if (Array.isArray(locationRecord.politicalHistory)) {
    for (const period of locationRecord.politicalHistory) {
      ingestSources(period?.sources);
    }
  }

  return Array.from(bibliographyIds).sort((a, b) => a.localeCompare(b));
}

function toIndexRecord(locationRecord) {
  return {
    id: locationRecord.id,
    names: locationRecord.names,
    type: locationRecord.type,
    zoomTier: locationRecord.zoomTier,
    parentId: locationRecord.parentId ?? null,
    candidates: (locationRecord.candidates ?? []).map((candidate) => ({
      label: candidate.label,
      coordinates: candidate.coordinates,
      confidence: candidate.confidence
    }))
  };
}

export async function buildAppData(options = {}) {
  const locationsDirectory = path.resolve(
    options.locationsDirectory ?? DEFAULT_LOCATIONS_DIRECTORY
  );
  const mediaDirectory = path.resolve(options.mediaDirectory ?? DEFAULT_MEDIA_DIRECTORY);
  const bibliographyPath = path.resolve(options.bibliographyPath ?? DEFAULT_BIBLIOGRAPHY_PATH);
  const outputDirectory = path.resolve(options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY);

  const validationResult = await validateData({
    locationsDirectory,
    mediaDirectory,
    bibliographyPath,
    webVplPath: options.webVplPath,
    webSnapshotMetadataPath: options.webSnapshotMetadataPath,
    skipSnapshotChecksumCheck: options.skipSnapshotChecksumCheck
  });

  if (validationResult.errors.length > 0) {
    const validationError = new Error(
      `Data validation failed with ${validationResult.errors.length} error(s) and ${validationResult.warnings.length} warning(s).`
    );
    validationError.validationResult = validationResult;
    throw validationError;
  }

  const [locationFiles, mediaFiles, bibliography] = await Promise.all([
    listJsonFiles(locationsDirectory),
    listJsonFiles(mediaDirectory),
    readJsonFile(bibliographyPath)
  ]);

  const locationRecords = await Promise.all(locationFiles.map((filePath) => readJsonFile(filePath)));
  const mediaRecords = await Promise.all(mediaFiles.map((filePath) => readJsonFile(filePath)));
  locationRecords.sort((a, b) => a.id.localeCompare(b.id));

  const mediaByLocationId = new Map(
    mediaRecords
      .filter((record) => typeof record?.locationId === "string")
      .map((record) => [record.locationId, record])
  );

  const bibliographyById = new Map(
    (bibliography.entries ?? [])
      .filter((entry) => typeof entry?.id === "string")
      .map((entry) => [entry.id, entry])
  );

  const indexRecords = locationRecords.map((locationRecord) => toIndexRecord(locationRecord));
  const indexPayload = JSON.stringify(indexRecords);

  await fs.rm(outputDirectory, { recursive: true, force: true });
  const placesDirectory = path.join(outputDirectory, "places");
  await fs.mkdir(placesDirectory, { recursive: true });

  await fs.writeFile(path.join(outputDirectory, "places.index.json"), indexPayload, "utf8");

  for (const locationRecord of locationRecords) {
    const bibliographyIds = collectBibSourceIds(locationRecord);
    const resolvedBibliography = bibliographyIds.map((id) => {
      const entry = bibliographyById.get(id);
      if (!entry) {
        throw new Error(
          `Missing bibliography entry '${id}' while building app payload for '${locationRecord.id}'.`
        );
      }
      return entry;
    });

    const placePayload = {
      location: locationRecord,
      media: mediaByLocationId.get(locationRecord.id) ?? null,
      bibliography: resolvedBibliography
    };

    const destinationPath = path.join(placesDirectory, `${locationRecord.id}.json`);
    await fs.writeFile(destinationPath, JSON.stringify(placePayload), "utf8");
  }

  return {
    validationResult,
    outputDirectory,
    locationCount: locationRecords.length,
    indexBytes: Buffer.byteLength(indexPayload, "utf8")
  };
}
