import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

const OUTPUT_DIRECTORY = path.join(repositoryRoot, "data", "geo");
const OUTPUT_AREAS_PATH = path.join(OUTPUT_DIRECTORY, "ancient-areas.geojson");
const OUTPUT_ROADS_PATH = path.join(OUTPUT_DIRECTORY, "ancient-roads.geojson");
const OUTPUT_COASTLINE_PATH = path.join(OUTPUT_DIRECTORY, "ancient-coastline.geojson");

const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
const AWMC_BASE_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}`;
const AWMC_ROADS_PATH = "Cultural-Data/roads/roads.geojson";

const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});

const EXCLUDED_POST_AD100_ROAD_NAMES = ["Via Nova Traiana"];

function ensureLineGeometry(geometry) {
  return geometry?.type === "LineString" || geometry?.type === "MultiLineString";
}

function roundNumber(value, decimals = 5) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundCoordinates(value, decimals = 5) {
  if (Array.isArray(value)) {
    return value.map((item) => roundCoordinates(item, decimals));
  }
  return typeof value === "number" ? roundNumber(value, decimals) : value;
}

function geometryIntersectsBounds(geometry, bounds) {
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  const ingest = (value) => {
    if (!Array.isArray(value)) {
      return;
    }
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      const [lon, lat] = value;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    for (const nested of value) {
      ingest(nested);
    }
  };

  ingest(geometry?.coordinates);
  if (!Number.isFinite(minLon) || !Number.isFinite(minLat)) {
    return false;
  }

  return !(
    maxLon < bounds.minLon ||
    minLon > bounds.maxLon ||
    maxLat < bounds.minLat ||
    minLat > bounds.maxLat
  );
}

async function downloadJsonFromAwmc(relativePath) {
  const url = `${AWMC_BASE_URL}/${relativePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function buildRoadFeature(sourceFeature, fallbackIndex) {
  const properties = sourceFeature.properties ?? {};
  const objectIdRaw = properties.OBJECTID;
  const objectId =
    Number.isFinite(Number(objectIdRaw)) && Number(objectIdRaw) >= 0
      ? Number(objectIdRaw)
      : fallbackIndex + 1;
  const roadName = typeof properties.Name === "string" ? properties.Name.trim() : "";
  const timeperiod = typeof properties.timeperiod === "string" ? properties.timeperiod.trim() : "";
  const known = String(properties.Known_or_a ?? "").trim() === "1";
  const major = String(properties.Major_or_M ?? "").trim() === "1";
  const roadId = `awmc-road-${objectId}-${fallbackIndex + 1}`;

  return {
    type: "Feature",
    properties: {
      roadId,
      major,
      known,
      timeperiod,
      provenance: {
        dataset: "AWMC geodata",
        version: `commit:${AWMC_COMMIT};path:${AWMC_ROADS_PATH}`,
        upstreamFeatureIds: [
          `awmc:roads-objectid-${objectId}`,
          `awmc:roads-feature-${fallbackIndex + 1}`
        ],
        changes: [
          {
            kind: "filter",
            detail:
              "Kept only AWMC Roman-period major roads that intersect the Interactive Bible Map extent; excluded post-AD-100 roads by cited name filter.",
            sources: ["awmc:roads-major-filter", "awmc:roads-roman-period-filter"]
          }
        ]
      }
    },
    geometry: {
      ...sourceFeature.geometry,
      coordinates: roundCoordinates(sourceFeature.geometry.coordinates)
    },
    _derived: {
      roadName
    }
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function byRoadId(left, right) {
  return left.properties.roadId.localeCompare(right.properties.roadId);
}

async function main() {
  const [roadsSource] = await Promise.all([downloadJsonFromAwmc(AWMC_ROADS_PATH)]);

  const roadFeatures = [];

  for (let index = 0; index < (roadsSource.features ?? []).length; index += 1) {
    const sourceFeature = roadsSource.features[index];
    const properties = sourceFeature.properties ?? {};
    const major = String(properties.Major_or_M ?? "").trim() === "1";
    const timeperiod = typeof properties.timeperiod === "string" ? properties.timeperiod : "";
    const roadName = typeof properties.Name === "string" ? properties.Name.trim() : "";

    if (!major) {
      continue;
    }
    if (!timeperiod.includes("R")) {
      continue;
    }
    if (!ensureLineGeometry(sourceFeature.geometry)) {
      continue;
    }
    if (!geometryIntersectsBounds(sourceFeature.geometry, PROJECT_BOUNDS)) {
      continue;
    }
    if (
      EXCLUDED_POST_AD100_ROAD_NAMES.some(
        (excludedName) => roadName.toLowerCase() === excludedName.toLowerCase()
      )
    ) {
      continue;
    }

    roadFeatures.push(buildRoadFeature(sourceFeature, index));
  }

  const ancientAreas = {
    type: "FeatureCollection",
    features: []
  };

  const ancientRoads = {
    type: "FeatureCollection",
    features: roadFeatures.sort(byRoadId).map(({ _derived, ...feature }) => feature)
  };

  const ancientCoastline = {
    type: "FeatureCollection",
    features: []
  };

  await Promise.all([
    writeJson(OUTPUT_AREAS_PATH, ancientAreas),
    writeJson(OUTPUT_ROADS_PATH, ancientRoads),
    writeJson(OUTPUT_COASTLINE_PATH, ancientCoastline)
  ]);

  console.log(`Wrote ${OUTPUT_AREAS_PATH}`);
  console.log(`Wrote ${OUTPUT_ROADS_PATH} (${ancientRoads.features.length} features)`);
  console.log(`Wrote ${OUTPUT_COASTLINE_PATH}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
