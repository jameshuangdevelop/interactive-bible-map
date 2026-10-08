import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { polygonsOf } from "./lib/geometry-cleanup.mjs";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

const OUTPUT_DIRECTORY = path.join(repositoryRoot, "data", "geo");
const OUTPUT_AREAS_PATH = path.join(OUTPUT_DIRECTORY, "ancient-areas.geojson");
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
const AWMC_EMPIRE_200_EXTENT_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_200_extent/roman_empire_ce_200_extent.geojson";
const AWMC_EMPIRE_60_BCE_PATH =
  "Cultural-Data/political_shading/roman_empire_bce_60/roman_empire_bce_60.geojson";
const AWMC_SENATORIAL_PROVINCES_PATH =
  "Cultural-Data/political_shading/senatorial_province/roman_senatorial_provinces.geojson";
const AWMC_HEROD_PATH = "Cultural-Data/political_shading/herod/herods_kingdom.geojson";
const AWMC_ROADS_PATH = "Cultural-Data/roads/roads.geojson";
const AWMC_COASTLINE_PATH = "Physical Data/shoreline/shoreline.geojson";
const NATURAL_EARTH_COASTLINE_PATH = "geojson/ne_10m_coastline.geojson";
const NATURAL_EARTH_LAND_PATH = "geojson/ne_10m_land.geojson";
const NATURAL_EARTH_RIVERS_PATH = "geojson/ne_10m_rivers_lake_centerlines.geojson";

const PROJECT_BOUNDS = Object.freeze({
  minLon: -20,
  maxLon: 60,
  minLat: -5,
  maxLat: 50
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
    references: [{ label: "Byzantium", coordinates: [28.98, 41.01] }]
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
    references: [{ label: "Paphos", coordinates: [32.406593, 34.757212] }]
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
    references: [{ label: "Damascus", coordinates: [36.309102, 33.511612] }]
  },
  {
    areaId: "judea-samaria-idumea",
    references: [
      { label: "Jerusalem", coordinates: [35.234156, 31.776679] },
      { label: "Samaria", coordinates: [35.190436, 32.276529] }
    ]
  },
  {
    areaId: "galilee-perea",
    references: [
      { label: "Nazareth", coordinates: [35.303, 32.699] },
      { label: "Perea near Machaerus", coordinates: [35.66, 31.73] }
    ]
  },
  {
    areaId: "philip-tetrarchy-lands",
    references: [
      { label: "Paneas (Caesarea Philippi)", coordinates: [35.692, 33.247] },
      { label: "Bethsaida Julias", coordinates: [35.622, 32.893] }
    ]
  },
  {
    areaId: "cilicia",
    references: [{ label: "Tarsus", coordinates: [34.896467, 36.914043] }]
  },
  {
    areaId: "cilicia-tracheia",
    references: [{ label: "Coracesium", coordinates: [32.0, 36.55] }]
  },
  {
    areaId: "pamphylia",
    references: [{ label: "Perga", coordinates: [30.852, 36.959] }]
  },
  {
    areaId: "lycia",
    references: [{ label: "Phaselis", coordinates: [30.55, 36.53] }]
  },
  {
    areaId: "galatia",
    references: [
      { label: "Antioch of Pisidia", coordinates: [31.184, 38.321] },
      { label: "Iconium", coordinates: [32.484, 37.874] }
    ]
  },
  {
    areaId: "cappadocia-pontus-east",
    references: [
      { label: "Caesarea Mazaca", coordinates: [35.49, 38.73] },
      { label: "Trapezus", coordinates: [39.72, 41.0] }
    ]
  },
  {
    areaId: "paphlagonia-pontus-galaticus",
    references: [
      { label: "Amastris", coordinates: [32.39, 41.75] },
      { label: "Amisus", coordinates: [36.33, 41.29] }
    ]
  },
  {
    areaId: "commagene",
    references: [{ label: "Samosata", coordinates: [38.606, 37.58] }]
  },
  {
    areaId: "arabia",
    references: [{ label: "Petra", coordinates: [35.444, 30.328] }]
  },
  {
    areaId: "egypt",
    references: [{ label: "Alexandria", coordinates: [29.9, 31.2] }]
  },
  {
    areaId: "armenia",
    references: [{ label: "Artaxata", coordinates: [44.57, 39.96] }]
  },
  {
    areaId: "parthian-empire",
    references: [{ label: "Ctesiphon", coordinates: [44.58, 33.1] }]
  }
];

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
    coordinates
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
    coordinates: dissolvedFeatures[0].geometry.coordinates
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function buildCustomSplitLines() {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          splitId: "galilee-samaria-ginea-line",
          source: "bib:josephus-jewish-war-3.3.1-and-3.3.4"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [34.74, 32.85],
            [35.25, 32.47],
            [35.55, 32.52]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          splitId: "achaia-macedonia-approx",
          source: "awmc:roman-empire-ce-200-provinces"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [20.95, 39.5],
            [24.25, 39.5]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          splitId: "perea-north-edge-at-pella",
          source: "bib:josephus-jewish-war-3.3.3"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [35.62, 32.47],
            [36.24, 32.47]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          splitId: "egypt-arabia-approx-ad200-sinai",
          source: "awmc:roman-empire-ce-200-provinces"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [33.4, 31.45],
            [34.4, 30.8],
            [35.2, 30.1],
            [35.95, 29.15]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          splitId: "cilicia-pedias-tracheia-lamus-approx",
          source: "bib:strabo-geography-14.5.6"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [34.2, 36.45],
            [34.2, 36.15]
          ]
        }
      },
      {
        type: "Feature",
        properties: {
          splitId: "galatia-cappadocia-approx-lake-tatta",
          source: "bib:strabo-geography-12.5.4"
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [33.2, 39.05],
            [34.6, 38.95],
            [36.15, 38.75]
          ]
        }
      }
    ]
  };
}

function selectRiverBoundaryFeatures(allRiversSource) {
  const names = new Set(["Jordan", "Euphrates", "Tigris", "Kiz?lirmak", "Kizilirmak", "Aras"]);
  return {
    type: "FeatureCollection",
    features: (allRiversSource.features ?? []).filter((feature) =>
      names.has(String(feature.properties?.name_en ?? feature.properties?.name ?? "").trim())
    )
  };
}

async function buildProvinceCells(workDirectory, sources) {
  const cellPath = path.join(workDirectory, "province-cells.geojson");
  await runMapshaper([
    "-i",
    sources.provinceLinesPath,
    "name=prov",
    "-i",
    sources.empireExtent200Path,
    "name=emp200",
    "-i",
    sources.empireExtent60Path,
    "name=emp60",
    "-i",
    sources.herodPath,
    "name=herod",
    "-i",
    sources.senatorialPath,
    "name=sen",
    "-i",
    sources.riversPath,
    "name=rivers",
    "-i",
    sources.customSplitLinesPath,
    "name=customsplits",
    "-target",
    "emp200",
    "-dissolve",
    "-lines",
    "name=emp200_line",
    "-target",
    "emp60",
    "-dissolve",
    "-lines",
    "name=emp60_line",
    "-target",
    "herod",
    "-dissolve",
    "-lines",
    "name=herod_line",
    "-target",
    "sen",
    "-dissolve",
    "-lines",
    "name=sen_line",
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
    "prov,coast,emp_line,emp200_line,emp60_line,herod_line,sen_line,rivers,customsplits",
    "-merge-layers",
    "force",
    "name=linework",
    "-target",
    "linework",
    "-snap",
    "interval=0.001",
    "-clean",
    "-polygons",
    "gap-tolerance=0.02",
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
          version: `commit:${AWMC_COMMIT};paths:${AWMC_PROVINCE_LINES_PATH}|${AWMC_COASTLINE_PATH}|${AWMC_EMPIRE_117_PATH}|${AWMC_EMPIRE_200_EXTENT_PATH}|${AWMC_EMPIRE_60_BCE_PATH}|${AWMC_HEROD_PATH}|${AWMC_SENATORIAL_PROVINCES_PATH};ne-commit:${NATURAL_EARTH_COMMIT};ne-path:${NATURAL_EARTH_RIVERS_PATH}`,
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
                "awmc:roman-empire-ce-200-extent",
                "awmc:roman-empire-bce-60-extent",
                "awmc:herod-outline",
                "awmc:roman-senatorial-provinces",
                "awmc:shoreline",
                "bib:josephus-jewish-war",
                "bib:strabo-geography"
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

function buildAncientCoastline(ancientCoastlineSource, modernCoastlineSource, modernLandSource) {
  // The layer shows old shores that silting has since left inland (ADR-0037 item 5): AWMC's shoreline is
  // kept where it lies well inland of today's coast. Today's coast is Natural Earth's coastline and the
  // outlines of its land, which also hold small islands the coastline layer leaves out (Agathonisi and
  // Farmakonisi off Miletus are in both datasets, so their shores are not ancient differences). Land
  // outlines are cut into short pieces so the bounding-box test stays quick.
  const modernLand = (modernLandSource.features ?? []).filter((feature) => feature.geometry);
  const modernLines = [];
  for (const feature of modernCoastlineSource.features ?? []) {
    modernLines.push(...toLineCoordinateArrays(feature.geometry ?? {}));
  }
  for (const feature of modernLand) {
    for (const polygon of polygonsOf(feature.geometry)) {
      for (const ring of polygon) {
        for (let start = 0; start < ring.length - 1; start += 200) modernLines.push(ring.slice(start, start + 201));
      }
    }
  }
  const modernBboxes = modernLines.map((line) => bboxFromLine(line));
  // A stretch that lies in today's sea is not an old shore left inland either, so most of its points
  // must be on today's land.
  const modernLandBboxes = modernLand.map((feature) => bboxFromLine(polygonsOf(feature.geometry).flatMap((polygon) => polygon[0])));
  const onModernLand = (point) => modernLand.some((feature, index) => {
    const box = modernLandBboxes[index];
    return point[0] >= box.minLon && point[0] <= box.maxLon && point[1] >= box.minLat && point[1] <= box.maxLat && pointInGeometry(point, feature.geometry);
  });
  const droppedInSea = [];

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
        const step = Math.max(1, Math.floor(line.length / 20));
        const samples = line.filter((_, index) => index % step === 0);
        if (samples.filter(onModernLand).length < samples.length / 2) {
          const box = bboxFromLine(line);
          droppedInSea.push(`${box.minLon.toFixed(2)}–${box.maxLon.toFixed(2)}°E, ${box.minLat.toFixed(2)}–${box.maxLat.toFixed(2)}°N`);
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
                "Kept ancient shoreline segments inside target coastal bbox only when their sampled points are >= ~0.03° from today's coast (Natural Earth's coastline and the outlines of its land, which include small islands) and most of them lie on today's land: old shores that silting has left inland. Shores of islands that both datasets hold, such as Agathonisi, and stretches in today's sea are left out.",
              sources: ["awmc:shoreline"]
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
    collection: { type: "FeatureCollection", features },
    droppedInSea
  };
}

async function main() {
  await fs.mkdir(WORK_DIRECTORY, { recursive: true });

  const paths = {
    provinceLinesPath: path.join(WORK_DIRECTORY, "provinces200-lines.geojson"),
    empireExtentPath: path.join(WORK_DIRECTORY, "empire117.geojson"),
    empireExtent200Path: path.join(WORK_DIRECTORY, "empire200.geojson"),
    empireExtent60Path: path.join(WORK_DIRECTORY, "empire60bce.geojson"),
    senatorialPath: path.join(WORK_DIRECTORY, "roman-senatorial-provinces.geojson"),
    herodPath: path.join(WORK_DIRECTORY, "herod.geojson"),
    roadsPath: path.join(WORK_DIRECTORY, "roads.geojson"),
    awmcCoastlinePath: path.join(WORK_DIRECTORY, "ancient-shoreline.geojson"),
    modernCoastlinePath: path.join(WORK_DIRECTORY, "modern-coastline.geojson"),
    modernLandPath: path.join(WORK_DIRECTORY, "modern-land.geojson"),
    riversAllPath: path.join(WORK_DIRECTORY, "rivers-all.geojson"),
    riversPath: path.join(WORK_DIRECTORY, "rivers-boundary-lines.geojson"),
    customSplitLinesPath: path.join(WORK_DIRECTORY, "custom-split-lines.geojson")
  };

  // AWMC's roads are downloaded here; the composition step picks and clips them once the areas exist.
  const [ancientCoastlineSource, modernCoastlineSource, riversAllSource, modernLandSource] = await Promise.all([
    downloadJson(`${AWMC_BASE_URL}/${AWMC_COASTLINE_PATH}`, paths.awmcCoastlinePath),
    downloadJson(`${NATURAL_EARTH_BASE_URL}/${NATURAL_EARTH_COASTLINE_PATH}`, paths.modernCoastlinePath),
    downloadJson(`${NATURAL_EARTH_BASE_URL}/${NATURAL_EARTH_RIVERS_PATH}`, paths.riversAllPath),
    downloadJson(`${NATURAL_EARTH_BASE_URL}/${NATURAL_EARTH_LAND_PATH}`, paths.modernLandPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_ROADS_PATH}`, paths.roadsPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_PROVINCE_LINES_PATH}`, paths.provinceLinesPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_117_PATH}`, paths.empireExtentPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_200_EXTENT_PATH}`, paths.empireExtent200Path),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_60_BCE_PATH}`, paths.empireExtent60Path),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_SENATORIAL_PROVINCES_PATH}`, paths.senatorialPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_HEROD_PATH}`, paths.herodPath)
  ]).then((values) => values.slice(0, 4));

  await writeJson(paths.riversPath, selectRiverBoundaryFeatures(riversAllSource));
  await writeJson(paths.customSplitLinesPath, buildCustomSplitLines());

  const provinceCells = await buildProvinceCells(WORK_DIRECTORY, paths);
  const areaBuildResult = await buildAncientAreas(provinceCells, WORK_DIRECTORY);
  const coastline = buildAncientCoastline(ancientCoastlineSource, modernCoastlineSource, modernLandSource);

  const rawAreasPath = path.join(WORK_DIRECTORY, "ancient-areas-raw.geojson");
  await writeJson(rawAreasPath, areaBuildResult.collection);
  await runMapshaper([
    "-i",
    rawAreasPath,
    "-filter-islands",
    "min-area=5km2",
    "-simplify",
    "weighted",
    "12%",
    "keep-shapes",
    "-clean",
    "-o",
    "format=geojson",
    OUTPUT_AREAS_PATH
  ]);

  await writeJson(OUTPUT_COASTLINE_PATH, coastline.collection);

  const cleanedAreas = JSON.parse(await fs.readFile(OUTPUT_AREAS_PATH, "utf8"));
  console.log(`Wrote ${OUTPUT_AREAS_PATH} (${(cleanedAreas.features ?? []).length} features)`);
  console.log(`Wrote ${OUTPUT_COASTLINE_PATH} (${coastline.collection.features.length} features; left out ${coastline.droppedInSea.length} shoreline stretch(es) in today's sea: ${coastline.droppedInSea.join("; ") || "none"})`);

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
