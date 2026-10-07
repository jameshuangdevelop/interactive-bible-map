import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import { buildAncientAppData } from "./ancient-app-data-builder.mjs";
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

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function inferDataRootFromDirectory(directoryPath, expectedLeafDirectoryName) {
  const directoryName = path.basename(directoryPath).toLowerCase();
  if (directoryName === expectedLeafDirectoryName) {
    return path.dirname(directoryPath);
  }

  return directoryPath;
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

function toAppNames(names) {
  if (!names || typeof names !== "object") {
    return names;
  }

  const { otherLanguages: _otherLanguages, ...appNames } = names;
  return appNames;
}

function toAppLocationRecord(locationRecord) {
  return {
    ...locationRecord,
    names: toAppNames(locationRecord.names),
    passageCount: Array.isArray(locationRecord.scripture)
      ? locationRecord.scripture.length
      : 0
  };
}

function toIndexRecord(locationRecord) {
  return {
    id: locationRecord.id,
    names: toAppNames(locationRecord.names),
    type: locationRecord.type,
    zoomTier: locationRecord.zoomTier,
    prominence: locationRecord.prominence,
    passageCount: Array.isArray(locationRecord.scripture)
      ? locationRecord.scripture.length
      : 0,
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
  const dataRoot =
    options.dataRoot != null
      ? path.resolve(options.dataRoot)
      : inferDataRootFromDirectory(locationsDirectory, "locations");
  const ancientSourceDirectory = options.ancientSourceDirectory
    ? path.resolve(options.ancientSourceDirectory)
    : null;
  const ancientDataRoot = ancientSourceDirectory ?? dataRoot;
  const ancientAreasPath = path.resolve(
    options.ancientAreasPath ?? path.join(ancientDataRoot, "geo", "ancient-areas.geojson")
  );
  const ancientRoadsPath = path.resolve(
    options.ancientRoadsPath ?? path.join(ancientDataRoot, "geo", "ancient-roads.geojson")
  );
  const ancientCoastlinePath = path.resolve(
    options.ancientCoastlinePath ??
      path.join(ancientDataRoot, "geo", "ancient-coastline.geojson")
  );
  const resolvedTimelinePath = path.resolve(
    options.timelinePath ?? path.join(ancientDataRoot, "timeline.json")
  );
  const outputDirectory = path.resolve(options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY);

  const validationResult = await validateData({
    locationsDirectory,
    mediaDirectory,
    bibliographyPath,
    timelinePath: resolvedTimelinePath,
    ancientAreasPath,
    ancientRoadsPath,
    ancientCoastlinePath,
    webVplPath: options.webVplPath,
    webSnapshotMetadataPath: options.webSnapshotMetadataPath,
    skipSnapshotChecksumCheck: options.skipSnapshotChecksumCheck,
    requireEmpireRoot: options.requireEmpireRoot,
    requireModernCountries: options.requireModernCountries,
    requireAncientShapes: options.requireAncientShapes,
    requireDerivedPoliticalHistory: options.requireDerivedPoliticalHistory
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
  const outputFiles = [
    {
      file: "places.index.json",
      bytes: Buffer.byteLength(indexPayload, "utf8"),
      gzipBytes: zlib.gzipSync(indexPayload, { level: zlib.constants.Z_BEST_COMPRESSION }).length
    }
  ];

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
      location: toAppLocationRecord(locationRecord),
      media: mediaByLocationId.get(locationRecord.id) ?? null,
      bibliography: resolvedBibliography
    };

    const destinationPath = path.join(placesDirectory, `${locationRecord.id}.json`);
    const placePayloadText = JSON.stringify(placePayload);
    await fs.writeFile(destinationPath, placePayloadText, "utf8");
    outputFiles.push({
      file: `places/${locationRecord.id}.json`,
      bytes: Buffer.byteLength(placePayloadText, "utf8"),
      gzipBytes: zlib.gzipSync(placePayloadText, { level: zlib.constants.Z_BEST_COMPRESSION }).length
    });
  }

  const [timelineExists, areasExists, roadsExists, coastlineExists] = await Promise.all([
    pathExists(resolvedTimelinePath),
    pathExists(ancientAreasPath),
    pathExists(ancientRoadsPath),
    pathExists(ancientCoastlinePath)
  ]);

  let ancientBuild = {
    generated: false,
    skippedReason:
      "Skipped ancient generated files because timeline or ancient geo source files are missing."
  };

  if (timelineExists && areasExists && roadsExists && coastlineExists) {
    const [timelineData, ancientAreasData, ancientRoadsData, ancientCoastlineData] =
      await Promise.all([
        readJsonFile(resolvedTimelinePath),
        readJsonFile(ancientAreasPath),
        readJsonFile(ancientRoadsPath),
        readJsonFile(ancientCoastlinePath)
      ]);
    const ancientBuildResult = await buildAncientAppData({
      timelineData,
      ancientAreasData,
      ancientRoadsData,
      ancientCoastlineData,
      outputDirectory
    });
    outputFiles.push(...ancientBuildResult.writtenFiles);
    ancientBuild = {
      generated: true,
      skippedReason: null
    };
  }

  return {
    validationResult,
    outputDirectory,
    locationCount: locationRecords.length,
    indexBytes: Buffer.byteLength(indexPayload, "utf8"),
    outputFiles,
    ancientBuild
  };
}
