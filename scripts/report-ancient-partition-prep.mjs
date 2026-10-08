import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
const NATURAL_EARTH_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const AWMC_BASE_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}`;
const NATURAL_EARTH_BASE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_COMMIT}`;

const AWMC_PROVINCE_LINES_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_200_provinces/roman_empire_ce_200_provinces.geojson";
const AWMC_COASTLINE_PATH = "Physical Data/shoreline/shoreline.geojson";
const AWMC_EMPIRE_117_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson";
const AWMC_EMPIRE_200_EXTENT_PATH =
  "Cultural-Data/political_shading/roman_empire_ce_200_extent/roman_empire_ce_200_extent.geojson";
const NATURAL_EARTH_LAND_PATH = "geojson/ne_10m_land.geojson";

const FOCUS_BOUNDS = Object.freeze({
  minLon: 10,
  maxLon: 50,
  minLat: 25,
  maxLat: 47
});
const FOCUS_BBOX = `${FOCUS_BOUNDS.minLon},${FOCUS_BOUNDS.minLat},${FOCUS_BOUNDS.maxLon},${FOCUS_BOUNDS.maxLat}`;

const WORK_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03-method");
const REPORT_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03");

const PROVINCE_REFERENCES = [
  { areaName: "Achaia", referenceTown: "Corinth", coordinates: [22.878614, 37.905642] },
  { areaName: "Macedonia", referenceTown: "Thessalonica", coordinates: [22.952885, 40.628342] },
  { areaName: "Epirus", referenceTown: "Nicopolis", coordinates: [20.75, 39.02] },
  { areaName: "Thracia", referenceTown: "Byzantium", coordinates: [28.98, 41.01] },
  { areaName: "Moesia Inferior", referenceTown: "Odessos", coordinates: [27.915, 43.214] },
  { areaName: "Asia", referenceTown: "Ephesus", coordinates: [27.342403, 37.940164] },
  { areaName: "Bithynia et Pontus", referenceTown: "Nicomedia", coordinates: [29.92, 40.77] },
  { areaName: "Galatia", referenceTown: "Ancyra", coordinates: [32.86, 39.93] },
  { areaName: "Cappadocia", referenceTown: "Caesarea Mazaca", coordinates: [35.49, 38.73] },
  { areaName: "Lycia et Pamphylia", referenceTown: "Perga", coordinates: [30.852, 36.959] },
  { areaName: "Cilicia", referenceTown: "Tarsus", coordinates: [34.896467, 36.914043] },
  { areaName: "Syria Coele", referenceTown: "Antioch on the Orontes", coordinates: [36.181667, 36.204722] },
  { areaName: "Syria Phoenice", referenceTown: "Tyre", coordinates: [35.209358, 33.268071] },
  { areaName: "Syria Palaestina", referenceTown: "Jerusalem", coordinates: [35.234156, 31.776679] },
  { areaName: "Arabia", referenceTown: "Petra", coordinates: [35.444, 30.328] },
  { areaName: "Aegyptus", referenceTown: "Alexandria", coordinates: [29.9, 31.2] },
  { areaName: "Cyprus", referenceTown: "Paphos", coordinates: [32.406593, 34.757212] },
  { areaName: "Creta et Cyrene", referenceTown: "Crete", coordinates: [24.893333, 35.309722] },
  { areaName: "Creta et Cyrene", referenceTown: "Cyrene", coordinates: [21.86, 32.83] },
  { areaName: "Italia", referenceTown: "Rome", coordinates: [12.491258, 41.889977] },
  { areaName: "Sicilia", referenceTown: "Syracuse", coordinates: [15.287, 37.067] },
  { areaName: "Dalmatia", referenceTown: "Salona", coordinates: [16.44, 43.51] },
  { areaName: "Pannonia", referenceTown: "Sirmium", coordinates: [19.61, 44.98] },
  { areaName: "Mesopotamia", referenceTown: "Edessa", coordinates: [39.028, 37.16] },
  { areaName: "Osroene", referenceTown: "Nisibis", coordinates: [41.22, 37.07] },
  { areaName: "Africa", referenceTown: "Leptis Magna", coordinates: [14.292, 32.639] },
  { areaName: "outside-parthia", referenceTown: "Ctesiphon", coordinates: [44.58, 33.1] },
  { areaName: "outside-armenia", referenceTown: "Artaxata", coordinates: [44.57, 39.96] }
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

async function downloadJson(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const content = await response.text();
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, content, "utf8");
  return JSON.parse(content);
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
      minLon = Math.min(minLon, value[0]);
      maxLon = Math.max(maxLon, value[0]);
      minLat = Math.min(minLat, value[1]);
      maxLat = Math.max(maxLat, value[1]);
      return;
    }
    for (const nested of value) {
      ingest(nested);
    }
  };
  ingest(geometry?.coordinates);

  if (!Number.isFinite(minLon)) {
    return false;
  }

  return !(
    maxLon < bounds.minLon ||
    minLon > bounds.maxLon ||
    maxLat < bounds.minLat ||
    minLat > bounds.maxLat
  );
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

function polygonsFromGeometry(geometry) {
  if (!geometry) {
    return [];
  }
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }
  return [];
}

function polygonAreaApproxKm2(polygonCoordinates) {
  const outerRing = polygonCoordinates[0] ?? [];
  if (outerRing.length < 4) {
    return 0;
  }
  let shoelace = 0;
  let latitudeSum = 0;
  for (let index = 0; index < outerRing.length - 1; index += 1) {
    const [x1, y1] = outerRing[index];
    const [x2, y2] = outerRing[index + 1];
    shoelace += x1 * y2 - x2 * y1;
    latitudeSum += y1;
  }
  const areaDegrees2 = Math.abs(shoelace) / 2;
  const latitudeRadians = (latitudeSum / Math.max(1, outerRing.length - 1)) * (Math.PI / 180);
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLon = 111.32 * Math.cos(latitudeRadians);
  return areaDegrees2 * kmPerDegreeLat * kmPerDegreeLon;
}

function geometryAreaApproxKm2(geometry) {
  return polygonsFromGeometry(geometry)
    .map((polygon) => polygonAreaApproxKm2(polygon))
    .reduce((sum, value) => sum + value, 0);
}

function geometryCentroid(geometry) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  const ingest = (value) => {
    if (!Array.isArray(value)) {
      return;
    }
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      sumX += value[0];
      sumY += value[1];
      count += 1;
      return;
    }
    for (const nested of value) {
      ingest(nested);
    }
  };
  ingest(geometry?.coordinates);
  if (count === 0) {
    return null;
  }
  return [sumX / count, sumY / count];
}

function ensureFeatureCollection(geojson) {
  if (geojson.type === "FeatureCollection") {
    return geojson;
  }
  const geometries = Array.isArray(geojson.geometries) ? geojson.geometries : [];
  return {
    type: "FeatureCollection",
    features: geometries.map((geometry, index) => ({
      type: "Feature",
      properties: { cellId: `c${String(index + 1).padStart(4, "0")}` },
      geometry
    }))
  };
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  await fs.mkdir(WORK_DIRECTORY, { recursive: true });
  await fs.mkdir(REPORT_DIRECTORY, { recursive: true });

  const paths = {
    coastPath: path.join(WORK_DIRECTORY, "ancient-shoreline.geojson"),
    neLandPath: path.join(WORK_DIRECTORY, "ne-land.geojson"),
    provinceLinesPath: path.join(WORK_DIRECTORY, "province-lines.geojson"),
    extent117Path: path.join(WORK_DIRECTORY, "extent-117.geojson"),
    extent200Path: path.join(WORK_DIRECTORY, "extent-200.geojson"),
    awmcCoastFacesPath: path.join(WORK_DIRECTORY, "awmc-coast-faces.geojson"),
    landMaskInputPath: path.join(WORK_DIRECTORY, "land-mask-input.geojson"),
    landMaskPath: path.join(WORK_DIRECTORY, "land-mask.geojson"),
    landMaskFocusPath: path.join(WORK_DIRECTORY, "land-mask-focus.geojson"),
    landMaskLinesPath: path.join(WORK_DIRECTORY, "land-mask-lines.geojson"),
    partitionRawPath: path.join(WORK_DIRECTORY, "ad200-partition-raw.geojson")
  };

  const [neLand, extent117, extent200] = await Promise.all([
    downloadJson(`${NATURAL_EARTH_BASE_URL}/${NATURAL_EARTH_LAND_PATH}`, paths.neLandPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_117_PATH}`, paths.extent117Path),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_EMPIRE_200_EXTENT_PATH}`, paths.extent200Path),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_COASTLINE_PATH}`, paths.coastPath),
    downloadJson(`${AWMC_BASE_URL}/${AWMC_PROVINCE_LINES_PATH}`, paths.provinceLinesPath)
  ]).then((values) => [values[0], values[1], values[2]]);

  await runMapshaper([
    "-i",
    paths.coastPath,
    "-snap",
    "interval=0.01",
    "-clean",
    "-polygons",
    "gap-tolerance=0.02",
    "-o",
    "format=geojson",
    paths.awmcCoastFacesPath
  ]);

  const awmcCoastFaces = ensureFeatureCollection(
    JSON.parse(await fs.readFile(paths.awmcCoastFacesPath, "utf8"))
  );
  const neLandFeatures = ensureFeatureCollection(neLand).features.filter((feature) =>
    geometryIntersectsBounds(feature.geometry, FOCUS_BOUNDS)
  );

  const awmcLandFeatures = awmcCoastFaces.features.filter((feature) => {
    if (!geometryIntersectsBounds(feature.geometry, FOCUS_BOUNDS)) {
      return false;
    }
    const center = geometryCentroid(feature.geometry);
    if (!center) {
      return false;
    }
    return neLandFeatures.some((landFeature) => pointInPolygon(center, landFeature.geometry));
  });

  await writeJson(paths.landMaskInputPath, {
    type: "FeatureCollection",
    features: [...awmcLandFeatures, ...neLandFeatures]
  });

  await runMapshaper([
    "-i",
    paths.landMaskInputPath,
    "-dissolve",
    "-clean",
    "-o",
    "format=geojson",
    paths.landMaskPath
  ]);

  await runMapshaper([
    "-i",
    paths.landMaskPath,
    "-clip",
    `bbox=${FOCUS_BBOX}`,
    "-clean",
    "-o",
    "format=geojson",
    paths.landMaskFocusPath
  ]);

  await runMapshaper([
    "-i",
    paths.landMaskFocusPath,
    "-lines",
    "-o",
    "format=geojson",
    paths.landMaskLinesPath
  ]);

  await runMapshaper([
    "-i",
    paths.provinceLinesPath,
    "name=prov",
    "-i",
    paths.extent200Path,
    "name=ext200",
    "-target",
    "ext200",
    "-dissolve",
    "-lines",
    "name=ext200l",
    "-i",
    paths.landMaskLinesPath,
    "name=land",
    "-target",
    "prov,land,ext200l",
    "-merge-layers",
    "force",
    "name=linework",
    "-target",
    "linework",
    "-snap",
    "interval=0.01",
    "-clean",
    "-polygons",
    "gap-tolerance=0.01",
    "-o",
    "format=geojson",
    paths.partitionRawPath
  ]);

  const partitionRaw = ensureFeatureCollection(
    JSON.parse(await fs.readFile(paths.partitionRawPath, "utf8"))
  );
  const landMask = ensureFeatureCollection(
    JSON.parse(await fs.readFile(paths.landMaskFocusPath, "utf8"))
  );
  const landMaskGeometries = landMask.features.map((feature) => feature.geometry);
  const extent117Geometries = ensureFeatureCollection(extent117).features.map((feature) => feature.geometry);
  const extent200Geometries = ensureFeatureCollection(extent200).features.map((feature) => feature.geometry);

  const cells = partitionRaw.features
    .map((feature, index) => ({
      cellId: `c${String(index + 1).padStart(4, "0")}`,
      geometry: feature.geometry
    }))
    .filter((cell) => {
      const center = geometryCentroid(cell.geometry);
      if (!center) {
        return false;
      }
      return landMaskGeometries.some((geometry) => pointInPolygon(center, geometry));
    });

  const assignments = [];
  const assignmentByCellId = new Map();

  for (const reference of PROVINCE_REFERENCES) {
    const matched = cells.find(
      (cell) =>
        !assignmentByCellId.has(cell.cellId) && pointInPolygon(reference.coordinates, cell.geometry)
    );
    if (!matched) {
      continue;
    }
    const assignment = {
      ...reference,
      cellId: matched.cellId,
      areaKm2: geometryAreaApproxKm2(matched.geometry)
    };
    assignments.push(assignment);
    assignmentByCellId.set(matched.cellId, assignment);
  }

  const provinceRows = [];
  const grouped = new Map();
  for (const assignment of assignments) {
    if (!grouped.has(assignment.areaName)) {
      grouped.set(assignment.areaName, {
        areaName: assignment.areaName,
        referenceTowns: new Set(),
        areaKm2: 0
      });
    }
    const row = grouped.get(assignment.areaName);
    row.referenceTowns.add(assignment.referenceTown);
    row.areaKm2 += assignment.areaKm2;
  }
  for (const row of grouped.values()) {
    provinceRows.push({
      areaName: row.areaName,
      referenceTowns: [...row.referenceTowns].join("; "),
      areaKm2: row.areaKm2
    });
  }
  provinceRows.sort((left, right) => left.areaName.localeCompare(right.areaName));

  const unassignedInScope = [];
  for (const cell of cells) {
    if (assignmentByCellId.has(cell.cellId)) {
      continue;
    }
    const center = geometryCentroid(cell.geometry);
    if (!center) {
      continue;
    }
    const in117 = extent117Geometries.some((geometry) => pointInPolygon(center, geometry));
    const in200 = extent200Geometries.some((geometry) => pointInPolygon(center, geometry));
    if (!in117 && !in200) {
      continue;
    }
    if (!geometryIntersectsBounds(cell.geometry, FOCUS_BOUNDS)) {
      continue;
    }
    unassignedInScope.push({
      cellId: cell.cellId,
      centroidLon: center[0],
      centroidLat: center[1],
      areaKm2: geometryAreaApproxKm2(cell.geometry)
    });
  }
  unassignedInScope.sort((left, right) => right.areaKm2 - left.areaKm2);

  const provincesListPath = path.join(REPORT_DIRECTORY, "ad200-province-names.csv");
  const provinceCsv = [
    "name,referenceTown,approxAreaKm2",
    ...provinceRows.map((row) => `${row.areaName},${row.referenceTowns},${row.areaKm2.toFixed(1)}`)
  ].join("\n");
  await fs.writeFile(provincesListPath, `${provinceCsv}\n`, "utf8");

  const coveragePath = path.join(REPORT_DIRECTORY, "m4-03-coverage-report.md");
  let coverageReport = "# M4-03 Coverage Report (method-prep)\n\n";
  coverageReport += `- Land-mask faces (ancient coastline + NE fallback): ${awmcLandFeatures.length + neLandFeatures.length}\n`;
  coverageReport += `- Partition cells on land: ${cells.length}\n`;
  coverageReport += `- Assigned named cells: ${assignmentByCellId.size}\n`;
  coverageReport += `- Unassigned cells in AD 117/200 scope: ${unassignedInScope.length}\n\n`;
  coverageReport += "## Largest unassigned cells in scope\n\n";
  coverageReport += "| cellId | centroidLon | centroidLat | approxKm2 |\n|---|---:|---:|---:|\n";
  for (const row of unassignedInScope.slice(0, 250)) {
    coverageReport += `| ${row.cellId} | ${row.centroidLon.toFixed(4)} | ${row.centroidLat.toFixed(4)} | ${row.areaKm2.toFixed(1)} |\n`;
  }
  coverageReport += "\n## Province naming rows\n\n";
  coverageReport += "| name | referenceTown(s) | approxAreaKm2 |\n|---|---|---:|\n";
  for (const row of provinceRows) {
    coverageReport += `| ${row.areaName} | ${row.referenceTowns} | ${row.areaKm2.toFixed(1)} |\n`;
  }
  await fs.writeFile(coveragePath, coverageReport, "utf8");

  console.log(`Wrote ${provincesListPath}`);
  console.log(`Wrote ${coveragePath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
