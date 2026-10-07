import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

const OUTPUT_DIRECTORY = path.join(repositoryRoot, "data", "geo");
const OUTPUT_AREAS_PATH = path.join(OUTPUT_DIRECTORY, "ancient-areas.geojson");
const OUTPUT_ROADS_PATH = path.join(OUTPUT_DIRECTORY, "ancient-roads.geojson");
const OUTPUT_COASTLINE_PATH = path.join(OUTPUT_DIRECTORY, "ancient-coastline.geojson");

const WORK_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03-build");

const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
const NATURAL_EARTH_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const AWMC_BASE_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}`;
const NATURAL_EARTH_BASE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_COMMIT}`;

const AWMC_PROVINCE_LINES_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_200_provinces/roman_empire_ce_200_provinces.geojson";
const AWMC_EMPIRE_117_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson";
const AWMC_HEROD_PATH = "Cultural-Data/political_shading/herod/herods_kingdom.geojson";
const AWMC_ROADS_PATH = "Cultural-Data/roads/roads.geojson";
const AWMC_COASTLINE_PATH = "Physical Data/shoreline/shoreline.geojson";
const NATURAL_EARTH_COASTLINE_PATH = "geojson/ne_10m_coastline.geojson";

const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
});
const ROAD_FOCUS_BOUNDS = Object.freeze({
  minLon: 10,
  maxLon: 40,
  minLat: 28,
  maxLat: 45
});

const COASTLINE_TARGETS = [
  {
    coastlineId: "ephesus-gulf",
    minLon: 26.95,
    maxLon: 27.65,
    minLat: 37.75,
    maxLat: 38.2
  },
  {
    coastlineId: "miletus-gulf",
    minLon: 27.0,
    maxLon: 27.45,
    minLat: 37.25,
    maxLat: 37.7
  }
];

const AREA_DEFINITIONS = [
  {
    areaId: "italy",
    references: [
      { label: "Rome", coordinates: [12.491258, 41.889977] },
      { label: "Puteoli", coordinates: [14.121869, 40.827957] }
    ]
  },
  {
    areaId: "sicily",
    references: [{ label: "Syracuse (proxy for Sicily)", coordinates: [15.287, 37.067] }]
  },
  {
    areaId: "achaia",
    references: [
      { label: "Corinth", coordinates: [22.878614, 37.905642] },
      { label: "Athens", coordinates: [23.723914, 37.971637] }
    ]
  },
  {
    areaId: "macedonia",
    references: [
      { label: "Thessalonica", coordinates: [22.952885, 40.628342] },
      { label: "Philippi", coordinates: [24.284637, 41.012651] }
    ]
  },
  {
    areaId: "thrace",
    references: [
      { label: "Byzantium", coordinates: [28.98, 41.01] },
      { label: "Perinthus", coordinates: [27.97, 40.98] }
    ]
  },
  {
    areaId: "illyricum",
    references: [
      { label: "Salona", coordinates: [16.44, 43.51] },
      { label: "Sirmium", coordinates: [19.61, 44.98] }
    ]
  },
  {
    areaId: "asia",
    references: [
      { label: "Ephesus", coordinates: [27.342403, 37.940164] },
      { label: "Pergamum", coordinates: [27.184167, 39.1325] }
    ]
  },
  {
    areaId: "bithynia",
    references: [
      { label: "Nicomedia", coordinates: [29.92, 40.77] },
      { label: "Nicaea", coordinates: [29.72, 40.43] }
    ]
  },
  {
    areaId: "cyprus",
    references: [
      { label: "Paphos", coordinates: [32.406593, 34.757212] },
      { label: "Salamis", coordinates: [33.903589, 35.175101] }
    ]
  },
  {
    areaId: "crete-cyrene",
    references: [
      { label: "Crete", coordinates: [24.893333, 35.309722] },
      { label: "Cyrene", coordinates: [21.86, 32.83] }
    ]
  },
  {
    areaId: "syria",
    references: [
      { label: "Antioch on the Orontes", coordinates: [36.181667, 36.204722] },
      { label: "Damascus", coordinates: [36.309102, 33.511612] },
      { label: "Tyre", coordinates: [35.209358, 33.268071] }
    ]
  },
  {
    areaId: "judea-province",
    references: [
      { label: "Jerusalem", coordinates: [35.234156, 31.776679] },
      { label: "Samaria", coordinates: [35.190436, 32.276529] }
    ]
  },
  {
    areaId: "cilicia",
    references: [{ label: "Tarsus", coordinates: [34.896467, 36.914043] }]
  },
  {
    areaId: "egypt",
    references: [{ label: "Alexandria", coordinates: [29.9, 31.2] }]
  }
];

const EXCLUDED_POST_AD100_ROAD_NAMES = ["Via Nova Traiana"];

function pathForMapshaper() {
  if (process.platform === "win32") {
    return {
      command: process.env.ComSpec ?? "cmd.exe",
      argsPrefix: ["/d", "/s", "/c", "npx", "mapshaper"]
    };
  }
  return {
    command: "npx",
    argsPrefix: ["mapshaper"]
  };
}

async function runMapshaper(args) {
  const mapshaper = pathForMapshaper();
  await execFileAsync(mapshaper.command, [...mapshaper.argsPrefix, ...args], {
    cwd: repositoryRoot,
    windowsHide: true
  });
}

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

async function downloadJson(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const content = await response.text();
  await fs.writeFile(destinationPath, content, "utf8");
  return JSON.parse(content);
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry) {
    return false;
  }
  if (geometry.type === "Polygon") {
    return pointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInRing(point, polygon[0]));
  }
  return false;
}

function toCellId(index) {
  return `c${String(index + 1).padStart(4, "0")}`;
}

function toLineCoordinateArrays(geometry) {
  if (geometry.type === "LineString") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates;
  }
  return [];
}

function bboxFromLine(lineCoordinates) {
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const [lon, lat] of lineCoordinates) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, maxLon, minLat, maxLat };
}

function bboxIntersects(left, right) {
  return !(
    right.maxLon < left.minLon ||
    right.minLon > left.maxLon ||
    right.maxLat < left.minLat ||
    right.minLat > left.maxLat
  );
}

function distancePointToSegment(point, segmentStart, segmentEnd) {
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  return Math.hypot(px - nearestX, py - nearestY);
}

function minDistanceToModernCoast(point, modernLines, modernBboxes) {
  const searchWindow = {
    minLon: point[0] - 1,
    maxLon: point[0] + 1,
    minLat: point[1] - 1,
    maxLat: point[1] + 1
  };
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < modernLines.length; index += 1) {
    if (!bboxIntersects(searchWindow, modernBboxes[index])) {
      continue;
    }
    const line = modernLines[index];
    for (let vertexIndex = 1; vertexIndex < line.length; vertexIndex += 1) {
      const distance = distancePointToSegment(point, line[vertexIndex - 1], line[vertexIndex]);
      if (distance < minimum) {
        minimum = distance;
      }
    }
  }
  return minimum;
}

function multiPolygonFromCells(cellGeometries) {
  const coordinates = [];
  for (const geometry of cellGeometries) {
    if (geometry.type === "Polygon") {
      coordinates.push(geometry.coordinates);
      continue;
    }
    if (geometry.type === "MultiPolygon") {
      coordinates.push(...geometry.coordinates);
    }
  }
  return {
    type: "MultiPolygon",
    coordinates: roundCoordinates(coordinates)
  };
}

function toFeatureCollectionFromGeometries(cellGeometries) {
  return {
    type: "FeatureCollection",
    features: cellGeometries.map((geometry, index) => ({
      type: "Feature",
      properties: { id: index + 1 },
      geometry
    }))
  };
}

async function dissolveCellGeometries(cellGeometries, workDirectory, areaId) {
  if (cellGeometries.length === 1) {
    return multiPolygonFromCells(cellGeometries);
  }

  const inputPath = path.join(workDirectory, `area-${areaId}-cells.geojson`);
  const outputPath = path.join(workDirectory, `area-${areaId}-dissolved.geojson`);
  await fs.writeFile(
    inputPath,
    JSON.stringify(toFeatureCollectionFromGeometries(cellGeometries)),
    "utf8"
  );

  await runMapshaper([
    "-i",
    inputPath,
    "-dissolve",
    "-clean",
    "-o",
    "format=geojson",
    outputPath
  ]);

  const dissolved = JSON.parse(await fs.readFile(outputPath, "utf8"));
  const dissolvedFeatures = dissolved.features ?? [];
  if (dissolvedFeatures.length === 0) {
    return multiPolygonFromCells(cellGeometries);
  }

  return {
    ...dissolvedFeatures[0].geometry,
    coordinates: roundCoordinates(dissolvedFeatures[0].geometry.coordinates)
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function buildProvinceCells(workDirectory, sources) {
  const cellPath = path.join(workDirectory, "province-cells.geojson");
  await runMapshaper([
    "-i",
    sources.provinceLinesPath,
    "name=prov",
    "-i",
    sources.awmcCoastlinePath,
    "name=coast",
    "-i",
    sources.empireExtentPath,
    "name=emp",
    "-target",
    "emp",
    "-dissolve",
    "-lines",
    "name=emp_line",
    "-target",
    "prov,coast,emp_line",
    "-merge-layers",
    "force",
    "name=linework",
    "-target",
    "linework",
    "-snap",
    "interval=0.001",
    "-clean",
    "-polygons",
    "gap-tolerance=0.2",
    "-rename-layers",
    "cells",
    "-o",
    "format=geojson",
    cellPath
  ]);

  const cellCollection = JSON.parse(await fs.readFile(cellPath, "utf8"));
  const geometries = Array.isArray(cellCollection.geometries) ? cellCollection.geometries : [];
  return geometries.map((geometry, index) => ({
    cellId: toCellId(index),
    geometry
  }));
}

async function buildAncientAreas(cellFeatures, workDirectory) {
  const cellById = new Map(cellFeatures.map((cellFeature) => [cellFeature.cellId, cellFeature]));
  const usedByCellId = new Map();
  const unresolvedAreas = [];
  const areaFeatures = [];

  for (const definition of AREA_DEFINITIONS) {
    const resolvedReferenceCells = [];
    for (const reference of definition.references) {
      const cell = cellFeatures.find((item) => pointInPolygon(reference.coordinates, item.geometry));
      if (!cell) {
        continue;
      }
      resolvedReferenceCells.push({
        ...reference,
        cellId: cell.cellId
      });
    }

    const cellIds = [...new Set(resolvedReferenceCells.map((entry) => entry.cellId))];
    if (cellIds.length === 0) {
      unresolvedAreas.push(`${definition.areaId}: no polygonized cell found for reference towns`);
      continue;
    }

    let hasConflict = false;
    for (const cellId of cellIds) {
      const previousArea = usedByCellId.get(cellId);
      if (previousArea && previousArea !== definition.areaId) {
        unresolvedAreas.push(
          `${definition.areaId}: cell ${cellId} already assigned to ${previousArea}; unresolved shared border`
        );
        hasConflict = true;
      }
    }
    if (hasConflict) {
      continue;
    }

    for (const cellId of cellIds) {
      usedByCellId.set(cellId, definition.areaId);
    }

    const cellGeometries = cellIds
      .map((cellId) => cellById.get(cellId)?.geometry)
      .filter(Boolean);
    const geometry = await dissolveCellGeometries(
      cellGeometries,
      workDirectory,
      definition.areaId
    );
    areaFeatures.push({
      type: "Feature",
      properties: {
        areaId: definition.areaId,
        provenance: {
          dataset: "AWMC geodata",
          version: `commit:${AWMC_COMMIT};paths:${AWMC_PROVINCE_LINES_PATH}|${AWMC_COASTLINE_PATH}|${AWMC_EMPIRE_117_PATH}`,
          upstreamFeatureIds: cellIds.map((cellId) => `awmc:province-cell-${cellId}`),
          changes: [
            {
              kind: "polygonize-union",
              detail: `Polygonized AD 200 province lines with AWMC coastline and empire extent, then unioned cells ${cellIds.join(
                ", "
              )} by reference towns.`,
              sources: [
                "awmc:roman-empire-ce-200-provinces",
                "awmc:roman-empire-ce-117-extent",
                "awmc:shoreline"
              ]
            },
            {
              kind: "reference-towns",
              detail: resolvedReferenceCells
                .map(
                  (entry) =>
                    `${entry.label}(${entry.coordinates[0].toFixed(3)},${entry.coordinates[1].toFixed(3)})=>${entry.cellId}`
                )
                .join("; "),
              sources: ["awmc:reference-town-point-in-polygon"]
            }
          ]
        }
      },
      geometry
    });
  }

  return {
    collection: {
      type: "FeatureCollection",
      features: areaFeatures.sort((left, right) => left.properties.areaId.localeCompare(right.properties.areaId))
    },
    unresolvedAreas
  };
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
        upstreamFeatureIds: [`awmc:roads-objectid-${objectId}`, `awmc:roads-feature-${fallbackIndex + 1}`],
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

function buildAncientRoads(roadsSource) {
  const roadFeatures = [];
  for (let index = 0; index < (roadsSource.features ?? []).length; index += 1) {
    const sourceFeature = roadsSource.features[index];
    const properties = sourceFeature.properties ?? {};
    const major = String(properties.Major_or_M ?? "").trim() === "1";
    const timeperiod = typeof properties.timeperiod === "string" ? properties.timeperiod : "";
    const roadName = typeof properties.Name === "string" ? properties.Name.trim() : "";

    if (!major || !timeperiod.includes("R")) {
      continue;
    }
    if (!ensureLineGeometry(sourceFeature.geometry)) {
      continue;
    }
    if (!geometryIntersectsBounds(sourceFeature.geometry, ROAD_FOCUS_BOUNDS)) {
      continue;
    }
    if (
      EXCLUDED_POST_AD100_ROAD_NAMES.some(
        (excludedRoad) => roadName.toLowerCase() === excludedRoad.toLowerCase()
      )
    ) {
      continue;
    }

    roadFeatures.push(buildRoadFeature(sourceFeature, index));
  }

  return {
    type: "FeatureCollection",
    features: roadFeatures
      .sort((left, right) => left.properties.roadId.localeCompare(right.properties.roadId))
      .map(({ _derived, ...feature }) => feature)
  };
}

function buildAncientCoastline(ancientCoastlineSource, modernCoastlineSource) {
  const modernLines = [];
  for (const feature of modernCoastlineSource.features ?? []) {
    modernLines.push(...toLineCoordinateArrays(feature.geometry ?? {}));
  }
  const modernBboxes = modernLines.map((line) => bboxFromLine(line));

  const features = [];

  for (const target of COASTLINE_TARGETS) {
    const targetBox = {
      minLon: target.minLon,
      maxLon: target.maxLon,
      minLat: target.minLat,
      maxLat: target.maxLat
    };
    const keptSegments = [];
    const upstreamIds = [];

    for (const feature of ancientCoastlineSource.features ?? []) {
      const objectId = Number(feature?.properties?.OBJECTID);
      const lineArrays = toLineCoordinateArrays(feature.geometry ?? {});

      for (const line of lineArrays) {
        const lineBox = bboxFromLine(line);
        if (!bboxIntersects(targetBox, lineBox)) {
          continue;
        }

        const sampleIndexes = new Set([
          0,
          Math.floor(line.length / 2),
          Math.max(0, line.length - 1)
        ]);
        const distances = [];
        for (const sampleIndex of sampleIndexes) {
          const samplePoint = line[sampleIndex];
          distances.push(minDistanceToModernCoast(samplePoint, modernLines, modernBboxes));
        }
        const averageDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length;
        if (averageDistance < 0.03) {
          continue;
        }

        keptSegments.push(line);
        if (Number.isFinite(objectId)) {
          upstreamIds.push(`awmc:shoreline-objectid-${objectId}`);
        }
      }
    }

    if (keptSegments.length === 0) {
      continue;
    }

    features.push({
      type: "Feature",
      properties: {
        coastlineId: target.coastlineId,
        provenance: {
          dataset: "AWMC geodata; Natural Earth",
          version: `awmc-commit:${AWMC_COMMIT};awmc-path:${AWMC_COASTLINE_PATH};ne-commit:${NATURAL_EARTH_COMMIT};ne-path:${NATURAL_EARTH_COASTLINE_PATH}`,
          upstreamFeatureIds: [...new Set(upstreamIds)].length > 0 ? [...new Set(upstreamIds)] : ["awmc:shoreline-target-bbox"],
          changes: [
            {
              kind: "ancient-modern-coast-compare",
              detail:
                "Kept ancient shoreline segments inside target coastal bbox only when their sampled points are >= ~0.03° from modern Natural Earth coastline.",
              sources: ["awmc:shoreline", "awmc:natural-earth-10m-coastline-comparison"]
            }
          ]
        }
      },
      geometry: {
        type: "MultiLineString",
        coordinates: roundCoordinates(keptSegments)
      }
    });
  }

  return {
    type: "FeatureCollection",
    features
  };
}

async function main() {
  await fs.mkdir(WORK_DIRECTORY, { recursive: true });

  const paths = {
    provinceLinesPath: path.join(WORK_DIRECTORY, "provinces200-lines.geojson"),
    empireExtentPath: path.join(WORK_DIRECTORY, "empire117.geojson"),
    herodPath: path.join(WORK_DIRECTORY, "herod.geojson"),
    roadsPath: path.join(WORK_DIRECTORY, "roads.geojson"),
    awmcCoastlinePath: path.join(WORK_DIRECTORY, "ancient-shoreline.geojson"),
    modernCoastlinePath: path.join(WORK_DIRECTORY, "modern-coastline.geojson")
  };

  const [roadsSource, ancientCoastlineSource, modernCoastlineSource] = await Promise.all([
    downloadJson(`${AWMC_BASE_URL}/${AWMC_ROADS_PATH}`, paths.roadsPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_COASTLINE_PATH}`, paths.awmcCoastlinePath),
    downloadJson(`${NATURAL_EARTH_BASE_URL}/${NATURAL_EARTH_COASTLINE_PATH}`, paths.modernCoastlinePath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_PROVINCE_LINES_PATH}`, paths.provinceLinesPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_117_PATH}`, paths.empireExtentPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_HEROD_PATH}`, paths.herodPath)
  ]).then((values) => [values[0], values[1], values[2]]);

  const provinceCells = await buildProvinceCells(WORK_DIRECTORY, paths);
  const areaBuildResult = await buildAncientAreas(provinceCells, WORK_DIRECTORY);
  const roads = buildAncientRoads(roadsSource);
  const coastline = buildAncientCoastline(ancientCoastlineSource, modernCoastlineSource);

  const rawAreasPath = path.join(WORK_DIRECTORY, "ancient-areas-raw.geojson");
  await writeJson(rawAreasPath, areaBuildResult.collection);
  await runMapshaper([
    "-i",
    rawAreasPath,
    "-clean",
    "-o",
    "format=geojson",
    OUTPUT_AREAS_PATH
  ]);

  await Promise.all([
    writeJson(OUTPUT_ROADS_PATH, roads),
    writeJson(OUTPUT_COASTLINE_PATH, coastline)
  ]);

  const cleanedAreas = JSON.parse(await fs.readFile(OUTPUT_AREAS_PATH, "utf8"));
  console.log(`Wrote ${OUTPUT_AREAS_PATH} (${(cleanedAreas.features ?? []).length} features)`);
  console.log(`Wrote ${OUTPUT_ROADS_PATH} (${roads.features.length} features)`);
  console.log(`Wrote ${OUTPUT_COASTLINE_PATH} (${coastline.features.length} features)`);

  if (areaBuildResult.unresolvedAreas.length > 0) {
    console.log("Unresolved areas:");
    for (const message of areaBuildResult.unresolvedAreas) {
      console.log(`- ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
