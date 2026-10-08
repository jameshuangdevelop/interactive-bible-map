import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..");

const AWMC_COMMIT = "7ecf8bccea2efe1e1e9df2daf6001942de73fb87";
const NATURAL_EARTH_COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const AWMC_BASE_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}`;
const NATURAL_EARTH_LAND_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_COMMIT}/geojson/ne_10m_land.geojson`;
const CULTURAL_ZIP_URL = `${AWMC_BASE_URL}/${encodeURIComponent("Cultural Shapefiles Apr 2024.zip")}`;
const COASTLINE_ZIP_URL = `${AWMC_BASE_URL}/Physical%20Data/shoreline/coastline.zip`;

const WORK_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03b-work");
const REPORT_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03b");
const BBOX = Object.freeze({ minLon: 9, minLat: 24, maxLon: 50, maxLat: 48 });
const BBOX_STRING = `${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`;
const DANGLE_TOLERANCE_KM = 0.1;
const EXTENSION_LIMIT_KM = 30;
const EARTH_RADIUS_KM = 6371.0088;

const LOCATION_REFERENCE_IDS = Object.freeze({
  Rome: "rome",
  Corinth: "corinth",
  Thessalonica: "thessalonica",
  Ephesus: "ephesus",
  Tarsus: "tarsus",
  Damascus: "damascus",
  Jerusalem: "jerusalem",
  Paphos: "paphos",
  Perga: "perga",
  "Caesarea Philippi": "caesarea-philippi"
});

const PLEIADES_REFERENCE_POINTS = Object.freeze({
  Syracuse: { coordinates: [15.287, 37.067], source: "pleiades:462503" },
  Byzantium: { coordinates: [28.9769, 41.0122], source: "pleiades:520998" },
  Salona: { coordinates: [16.49, 43.54], source: "pleiades:197470" },
  Nicomedia: { coordinates: [29.92, 40.77], source: "pleiades:511337" },
  Ancyra: { coordinates: [32.854, 39.932], source: "pleiades:619103" },
  "Caesarea Mazaca": { coordinates: [35.49, 38.73], source: "pleiades:628879" },
  Antioch: { coordinates: [36.181667, 36.204722], source: "pleiades:658381" },
  Alexandria: { coordinates: [29.9, 31.2], source: "pleiades:727070" },
  Cyrene: { coordinates: [21.86, 32.83], source: "pleiades:373778" },
  Gortyna: { coordinates: [24.947, 35.061], source: "pleiades:589796" },
  Patara: { coordinates: [29.318, 36.264], source: "pleiades:639053" },
  Petra: { coordinates: [35.444, 30.328], source: "pleiades:697725" },
  Samosata: { coordinates: [38.606, 37.58], source: "pleiades:658603" },
  Emesa: { coordinates: [36.72, 34.73], source: "pleiades:668263" },
  Amaseia: { coordinates: [35.833, 40.653], source: "pleiades:857036" },
  Neocaesarea: { coordinates: [36.558, 40.326], source: "pleiades:857229" },
  "Nicopolis (Armenia Minor)": { coordinates: [38.18, 39.88], source: "pleiades:857238" },
  Artaxata: { coordinates: [44.57, 39.96], source: "pleiades:874318" },
  Ctesiphon: { coordinates: [44.58, 33.1], source: "pleiades:893989" }
});

const REFERENCE_TOWNS = Object.freeze([
  { town: "Rome", territory: "Italia", expectedKm2: 301000 },
  { town: "Syracuse", territory: "Sicilia", expectedKm2: 25700 },
  { town: "Corinth", territory: "Achaia", expectedKm2: 30000 },
  { town: "Thessalonica", territory: "Macedonia", expectedKm2: 70000 },
  { town: "Byzantium", territory: "Thracia", expectedKm2: 85000 },
  { town: "Salona", territory: "Dalmatia", expectedKm2: 90000 },
  { town: "Ephesus", territory: "Asia", expectedKm2: 135000 },
  { town: "Nicomedia", territory: "Bithynia et Pontus", expectedKm2: 115000 },
  { town: "Ancyra", territory: "Galatia", expectedKm2: 150000 },
  { town: "Caesarea Mazaca", territory: "Cappadocia", expectedKm2: 170000 },
  { town: "Tarsus", territory: "Cilicia", expectedKm2: 30000 },
  { town: "Antioch", territory: "Syria", expectedKm2: 220000 },
  { town: "Damascus", territory: "Syria", expectedKm2: 220000 },
  { town: "Jerusalem", territory: "Judaea", expectedKm2: 21000 },
  { town: "Alexandria", territory: "Aegyptus", expectedKm2: 100000 },
  { town: "Cyrene", territory: "Cyrenaica", expectedKm2: 60000 },
  { town: "Gortyna", territory: "Creta", expectedKm2: 8300 },
  { town: "Paphos", territory: "Cyprus", expectedKm2: 9250 },
  { town: "Perga", territory: "Pamphylia", expectedKm2: 25000 },
  { town: "Patara", territory: "Lycia", expectedKm2: 18000 },
  { town: "Petra", territory: "Nabataea", expectedKm2: 180000 },
  { town: "Samosata", territory: "Commagene", expectedKm2: 12000 },
  { town: "Emesa", territory: "Emesa", expectedKm2: 9000 },
  { town: "Caesarea Philippi", territory: "Agrippa II kingdom", expectedKm2: 12000 },
  { town: "Amaseia", territory: "Pontus Galaticus", expectedKm2: 35000 },
  { town: "Neocaesarea", territory: "Pontus Polemoniacus", expectedKm2: 25000 },
  { town: "Nicopolis (Armenia Minor)", territory: "Armenia Minor", expectedKm2: 30000 },
  { town: "Artaxata", territory: "Armenia", expectedKm2: 300000 },
  { town: "Ctesiphon", territory: "Parthia", expectedKm2: 800000 }
]);

function mapshaperCommand(args) {
  if (process.platform === "win32") {
    return { command: process.env.ComSpec ?? "cmd.exe", args: ["/d", "/s", "/c", "npx", "mapshaper", ...args] };
  }
  return { command: "npx", args: ["mapshaper", ...args] };
}

async function runMapshaper(args) {
  const { command, args: commandArgs } = mapshaperCommand(args);
  await execFileAsync(command, commandArgs, { cwd: repositoryRoot, windowsHide: true, maxBuffer: 1024 * 1024 * 20 });
}

async function downloadFile(url, destinationPath) {
  try {
    await fs.access(destinationPath);
    return;
  } catch {
    // Download below.
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, Buffer.from(await response.arrayBuffer()));
}

async function extractZip(zipPath, destinationDirectory) {
  await fs.rm(destinationDirectory, { recursive: true, force: true });
  await fs.mkdir(destinationDirectory, { recursive: true });
  const escapedZip = zipPath.replaceAll("'", "''");
  const escapedDest = destinationDirectory.replaceAll("'", "''");
  await execFileAsync(
    "powershell",
    ["-NoProfile", "-Command", `Expand-Archive -Path '${escapedZip}' -DestinationPath '${escapedDest}' -Force`],
    { windowsHide: true }
  );
}

async function findFirstFile(directory, predicate) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findFirstFile(entryPath, predicate);
      if (nested) return nested;
    } else if (predicate(entryPath)) {
      return entryPath;
    }
  }
  return null;
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    const [outer, ...holes] = geometry.coordinates;
    return pointInRing(point, outer) && !holes.some((ring) => pointInRing(point, ring));
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(([outer, ...holes]) => pointInRing(point, outer) && !holes.some((ring) => pointInRing(point, ring)));
  }
  return false;
}

function polygonsFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function linesFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function ringAreaKm2(ring) {
  if (!ring || ring.length < 4) return 0;
  let total = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [lon1, lat1] = ring[index].map((value) => (value * Math.PI) / 180);
    const [lon2, lat2] = ring[index + 1].map((value) => (value * Math.PI) / 180);
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

function polygonAreaKm2(polygon) {
  const [outer, ...holes] = polygon;
  return Math.max(0, ringAreaKm2(outer) - holes.reduce((sum, ring) => sum + ringAreaKm2(ring), 0));
}

function geometryAreaKm2(geometry) {
  return polygonsFromGeometry(geometry).reduce((sum, polygon) => sum + polygonAreaKm2(polygon), 0);
}

function distanceToGeometryKm(point, geometry) {
  let minimum = Number.POSITIVE_INFINITY;
  for (const line of linesFromGeometry(geometry)) {
    for (let index = 1; index < line.length; index += 1) {
      minimum = Math.min(minimum, distancePointToSegmentKm(point, line[index - 1], line[index]));
    }
  }
  return minimum;
}

function centroidApprox(geometry) {
  const points = [];
  const collect = (node) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      points.push(node);
      return;
    }
    for (const child of node) collect(child);
  };
  collect(geometry?.coordinates);
  if (points.length === 0) return [0, 0];
  return [
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length
  ];
}

function kmProject(point, origin) {
  const lat = (origin[1] * Math.PI) / 180;
  return [(point[0] - origin[0]) * 111.32 * Math.cos(lat), (point[1] - origin[1]) * 110.574];
}

function kmDistance(left, right) {
  const projected = kmProject(left, right);
  return Math.hypot(projected[0], projected[1]);
}

function distancePointToSegmentKm(point, start, end) {
  const a = kmProject(start, point);
  const b = kmProject(end, point);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, (-(a[0] * dx + a[1] * dy)) / denominator));
  const nearest = [a[0] + t * dx, a[1] + t * dy];
  return Math.hypot(nearest[0], nearest[1]);
}

function lineBBox(line) {
  return line.reduce(
    (bbox, [lon, lat]) => ({
      minLon: Math.min(bbox.minLon, lon),
      minLat: Math.min(bbox.minLat, lat),
      maxLon: Math.max(bbox.maxLon, lon),
      maxLat: Math.max(bbox.maxLat, lat)
    }),
    { minLon: Number.POSITIVE_INFINITY, minLat: Number.POSITIVE_INFINITY, maxLon: Number.NEGATIVE_INFINITY, maxLat: Number.NEGATIVE_INFINITY }
  );
}

function bboxIntersects(left, right) {
  return !(right.maxLon < left.minLon || right.minLon > left.maxLon || right.maxLat < left.minLat || right.minLat > left.maxLat);
}

function buildSegments(lineCollections) {
  const segments = [];
  for (const collection of lineCollections) {
    for (const feature of collection.features ?? []) {
      const featureId = `${collection.source}:${feature.properties?._ibmLineId ?? feature.properties?.OBJECTID ?? segments.length}`;
      for (const line of linesFromGeometry(feature.geometry)) {
        for (let index = 1; index < line.length; index += 1) {
          const start = line[index - 1];
          const end = line[index];
          const bbox = lineBBox([start, end]);
          segments.push({ source: collection.source, featureId, start, end, bbox });
        }
      }
    }
  }
  return segments;
}

function nearestSegmentDistance(point, segments, ownFeatureId, maxKm) {
  const degreeWindow = maxKm / 80;
  const search = {
    minLon: point[0] - degreeWindow,
    maxLon: point[0] + degreeWindow,
    minLat: point[1] - degreeWindow,
    maxLat: point[1] + degreeWindow
  };
  let minimum = Number.POSITIVE_INFINITY;
  let nearest = null;
  for (const segment of segments) {
    if (segment.featureId === ownFeatureId || !bboxIntersects(search, segment.bbox)) continue;
    const distance = distancePointToSegmentKm(point, segment.start, segment.end);
    if (distance < minimum) {
      minimum = distance;
      nearest = segment;
    }
  }
  return { distanceKm: minimum, segment: nearest };
}

function intersectRayWithSegmentKm(originLonLat, directionLonLat, startLonLat, endLonLat) {
  const direction = kmProject(directionLonLat, originLonLat);
  const directionLength = Math.hypot(direction[0], direction[1]);
  if (directionLength === 0) return null;
  const r = [direction[0] / directionLength, direction[1] / directionLength];
  const q = kmProject(startLonLat, originLonLat);
  const sEnd = kmProject(endLonLat, originLonLat);
  const s = [sEnd[0] - q[0], sEnd[1] - q[1]];
  const cross = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(cross) < 1e-9) return null;
  const t = (q[0] * s[1] - q[1] * s[0]) / cross;
  const u = (q[0] * r[1] - q[1] * r[0]) / cross;
  if (t <= 0 || u < 0 || u > 1) return null;
  return {
    distanceKm: t,
    point: [
      startLonLat[0] + (endLonLat[0] - startLonLat[0]) * u,
      startLonLat[1] + (endLonLat[1] - startLonLat[1]) * u
    ]
  };
}

function findExtensionTarget(dangle, segments) {
  const degreeWindow = EXTENSION_LIMIT_KM / 80;
  const search = {
    minLon: dangle.lon - degreeWindow,
    maxLon: dangle.lon + degreeWindow,
    minLat: dangle.lat - degreeWindow,
    maxLat: dangle.lat + degreeWindow
  };
  let best = null;
  for (const segment of segments) {
    if (segment.featureId === dangle.featureId || !bboxIntersects(search, segment.bbox)) continue;
    const hit = intersectRayWithSegmentKm([dangle.lon, dangle.lat], dangle.rayPoint, segment.start, segment.end);
    if (!hit || hit.distanceKm > EXTENSION_LIMIT_KM) continue;
    if (!best || hit.distanceKm < best.distanceKm) {
      best = { ...hit, targetSource: segment.source, targetFeatureId: segment.featureId };
    }
  }
  return best;
}

function findDangles(provinceLines, lineCollections) {
  const segments = buildSegments(lineCollections);
  const dangles = [];
  let endpointCount = 0;
  for (const feature of provinceLines.features ?? []) {
    const featureId = `province:${feature.properties?._ibmLineId ?? feature.properties?.OBJECTID ?? endpointCount}`;
    for (const line of linesFromGeometry(feature.geometry)) {
      if (line.length < 2) continue;
      const endpoints = [
        { point: line[0], rayPoint: [line[0][0] + (line[0][0] - line[1][0]), line[0][1] + (line[0][1] - line[1][1])], end: "start" },
        {
          point: line[line.length - 1],
          rayPoint: [
            line[line.length - 1][0] + (line[line.length - 1][0] - line[line.length - 2][0]),
            line[line.length - 1][1] + (line[line.length - 1][1] - line[line.length - 2][1])
          ],
          end: "end"
        }
      ];
      for (const endpoint of endpoints) {
        endpointCount += 1;
        const nearest = nearestSegmentDistance(endpoint.point, segments, featureId, DANGLE_TOLERANCE_KM);
        if (nearest.distanceKm <= DANGLE_TOLERANCE_KM) continue;
        const dangle = {
          dangleId: `d${String(dangles.length + 1).padStart(3, "0")}`,
          featureId,
          end: endpoint.end,
          lon: endpoint.point[0],
          lat: endpoint.point[1],
          nearestKm: nearest.distanceKm,
          nearestSource: nearest.segment?.source ?? "",
          rayPoint: endpoint.rayPoint
        };
        dangles.push(dangle);
      }
    }
  }
  const extensions = [];
  for (const dangle of dangles) {
    const target = findExtensionTarget(dangle, segments);
    if (!target) continue;
    extensions.push({
      extensionId: `x${String(extensions.length + 1).padStart(3, "0")}`,
      dangleId: dangle.dangleId,
      fromLon: dangle.lon,
      fromLat: dangle.lat,
      toLon: target.point[0],
      toLat: target.point[1],
      lengthKm: kmDistance([dangle.lon, dangle.lat], target.point),
      targetSource: target.targetSource,
      targetFeatureId: target.targetFeatureId
    });
  }
  return { endpointCount, dangles, extensions };
}

async function loadReferenceTownPoints() {
  const points = new Map();
  for (const [town, locationId] of Object.entries(LOCATION_REFERENCE_IDS)) {
    const location = JSON.parse(await fs.readFile(path.join(repositoryRoot, "data", "locations", `${locationId}.json`), "utf8"));
    const coordinates = location.candidates?.[0]?.coordinates;
    if (coordinates) points.set(town, { coordinates, source: `${locationId}.json` });
  }
  for (const [town, point] of Object.entries(PLEIADES_REFERENCE_POINTS)) {
    points.set(town, point);
  }
  return REFERENCE_TOWNS.map((reference) => {
    const point = points.get(reference.town);
    if (!point) throw new Error(`Missing coordinates for ${reference.town}`);
    return { ...reference, ...point };
  });
}

function ensureFeatureCollection(geojson) {
  if (geojson.type === "FeatureCollection") return geojson;
  const geometries = geojson.geometries ?? [];
  return { type: "FeatureCollection", features: geometries.map((geometry, index) => ({ type: "Feature", properties: { id: index + 1 }, geometry })) };
}

function nameFaces(faceCollection, referenceTowns) {
  const faceRows = faceCollection.features.map((feature, index) => ({
    faceId: `f${String(index + 1).padStart(4, "0")}`,
    feature,
    towns: [],
    territories: new Map()
  }));
  for (const reference of referenceTowns) {
    let row = faceRows.find((candidate) => pointInPolygon(reference.coordinates, candidate.feature.geometry));
    if (!row) {
      const nearest = faceRows
        .map((candidate) => ({
          candidate,
          distanceKm: distanceToGeometryKm(reference.coordinates, candidate.feature.geometry)
        }))
        .sort((left, right) => left.distanceKm - right.distanceKm)[0];
      if (nearest && nearest.distanceKm <= 25) {
        row = nearest.candidate;
      }
    }
    if (!row) continue;
    row.towns.push(`${reference.town} (${reference.source})`);
    if (!row.territories.has(reference.territory)) {
      row.territories.set(reference.territory, reference.expectedKm2);
    }
  }
  return faceRows
    .filter((row) => row.towns.length > 0)
    .map((row) => {
      const territoryNames = [...row.territories.keys()].sort();
      const expectedKm2 = [...row.territories.values()].reduce((sum, value) => sum + value, 0);
      const observedKm2 = geometryAreaKm2(row.feature.geometry);
      const delta = expectedKm2 > 0 ? (observedKm2 - expectedKm2) / expectedKm2 : 0;
      return {
        faceId: row.faceId,
        name: territoryNames.join(" / "),
        towns: row.towns.join("; "),
        territoryCount: territoryNames.length,
        observedKm2,
        expectedKm2,
        check: Math.abs(delta) <= 0.3 ? "ok" : "flag",
        note: territoryNames.length > 1 ? "source partition does not separate these reference towns" : "",
        geometry: row.feature.geometry
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function writeCsv(filePath, rows, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => escape(row[column])).join(","));
  }
  await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
}

function colorForKey(key) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = (hash << 5) - hash + key.charCodeAt(index);
  return `hsl(${Math.abs(hash) % 360},58%,76%)`;
}

function projectPoint([lon, lat], width, height) {
  return [
    ((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * width,
    ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * height
  ];
}

function svgPathForRing(ring, width, height) {
  return ring
    .map((point, index) => {
      const [x, y] = projectPoint(point, width, height);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

async function writePreview(tag, faceCollection, namedRows) {
  const width = 1800;
  const height = 1050;
  const labelByGeometry = new Map(namedRows.map((row) => [row.geometry, row]));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#eef3f7"/>`;
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="#f7f2e8" opacity="0.8"/>`;
  for (const feature of faceCollection.features) {
    const row = labelByGeometry.get(feature.geometry);
    const key = row?.name ?? "unlabelled";
    for (const polygon of polygonsFromGeometry(feature.geometry)) {
      const outer = polygon[0];
      if (!outer) continue;
      svg += `<path d="${svgPathForRing(outer, width, height)} Z" fill="${colorForKey(key)}" stroke="#333" stroke-width="0.8" fill-opacity="0.78"/>`;
    }
  }
  for (const row of namedRows) {
    const [x, y] = projectPoint(centroidApprox(row.geometry), width, height);
    const label = `${row.name}${row.territoryCount > 1 ? "*" : ""}`;
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Arial, sans-serif" font-size="15" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke">${label}</text>`;
  }
  svg += `<text x="22" y="34" font-family="Arial, sans-serif" font-size="24" fill="#111">${tag.toUpperCase()} AWMC-line partition; * = merged reference towns</text>`;
  svg += `</svg>`;
  const svgPath = path.join(REPORT_DIRECTORY, `${tag}-partition-preview.svg`);
  const pngPath = path.join(REPORT_DIRECTORY, `${tag}-partition-preview.png`);
  await fs.writeFile(svgPath, `${svg}\n`, "utf8");
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  return { svgPath, pngPath };
}

async function preparePartitionInputs(tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, extensionFeatures) {
  const directory = path.join(WORK_DIRECTORY, tag);
  await fs.mkdir(directory, { recursive: true });
  const provinceLinesPath = path.join(directory, "province-lines.geojson");
  const extentLinePath = path.join(directory, "extent-line.geojson");
  const coastlinePath = path.join(directory, "awmc-coastline.geojson");
  const landMaskPath = path.join(directory, "ne-land-mask.geojson");
  const extensionPath = path.join(directory, "extensions.geojson");
  const bboxPath = path.join(directory, "bbox-frame.geojson");
  await runMapshaper(["-i", provinceShpPath, "-clip", `bbox=${BBOX_STRING}`, "-each", "_ibmLineId=this.id", "-o", "format=geojson", provinceLinesPath]);
  await runMapshaper(["-i", extentShpPath, "-dissolve", "-lines", "-clip", `bbox=${BBOX_STRING}`, "-o", "format=geojson", extentLinePath]);
  await runMapshaper(["-i", coastShpPath, "-clip", `bbox=${BBOX_STRING}`, "-each", "_ibmLineId=this.id", "-o", "format=geojson", coastlinePath]);
  await runMapshaper(["-i", neLandPath, "-clip", `bbox=${BBOX_STRING}`, "-dissolve", "-o", "format=geojson", landMaskPath]);
  await fs.writeFile(
    extensionPath,
    JSON.stringify({
      type: "FeatureCollection",
      features: extensionFeatures.map((extension) => ({
        type: "Feature",
        properties: extension,
        geometry: { type: "LineString", coordinates: [[extension.fromLon, extension.fromLat], [extension.toLon, extension.toLat]] }
      }))
    }),
    "utf8"
  );
  await fs.writeFile(
    bboxPath,
    JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { frame: BBOX_STRING },
          geometry: {
            type: "LineString",
            coordinates: [
              [BBOX.minLon, BBOX.minLat],
              [BBOX.maxLon, BBOX.minLat],
              [BBOX.maxLon, BBOX.maxLat],
              [BBOX.minLon, BBOX.maxLat],
              [BBOX.minLon, BBOX.minLat]
            ]
          }
        }
      ]
    }),
    "utf8"
  );
  return { provinceLinesPath, extentLinePath, coastlinePath, landMaskPath, extensionPath, bboxPath };
}

async function polygonizePartition(tag, inputPaths) {
  const allFacesPath = path.join(WORK_DIRECTORY, tag, "all-faces.geojson");
  const landFacesPath = path.join(WORK_DIRECTORY, tag, "land-faces.geojson");
  await runMapshaper([
    "-i",
    inputPaths.provinceLinesPath,
    "name=prov",
    "-i",
    inputPaths.extentLinePath,
    "name=extentline",
    "-i",
    inputPaths.coastlinePath,
    "name=coast",
    "-i",
    inputPaths.extensionPath,
    "name=extensions",
    "-i",
    inputPaths.bboxPath,
    "name=bbox",
    "-target",
    "prov,extentline,coast,extensions,bbox",
    "-merge-layers",
    "force",
    "name=linework",
    "-target",
    "linework",
    "-snap",
    "interval=0.001",
    "-clean",
    "snap-interval=0.001",
    "-polygons",
    "gap-tolerance=0.05",
    "-filter-slivers",
    "min-area=10km2",
    "-o",
    "format=geojson",
    allFacesPath
  ]);
  await runMapshaper([
    "-i",
    allFacesPath,
    "-clip",
    inputPaths.landMaskPath,
    "-explode",
    "-filter-slivers",
    "min-area=50km2",
    "-o",
    "format=geojson",
    landFacesPath
  ]);
  return {
    allFaces: ensureFeatureCollection(JSON.parse(await fs.readFile(allFacesPath, "utf8"))),
    landFaces: ensureFeatureCollection(JSON.parse(await fs.readFile(landFacesPath, "utf8")))
  };
}

async function buildPartition(tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, referenceTowns) {
  const initialInputs = await preparePartitionInputs(tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, []);
  const provinceLines = JSON.parse(await fs.readFile(initialInputs.provinceLinesPath, "utf8"));
  const extentLines = JSON.parse(await fs.readFile(initialInputs.extentLinePath, "utf8"));
  const coastline = JSON.parse(await fs.readFile(initialInputs.coastlinePath, "utf8"));
  const dangleReport = findDangles(provinceLines, [
    { source: "province", features: provinceLines.features ?? [] },
    { source: "extent", features: extentLines.features ?? [] },
    { source: "awmc-coastline", features: coastline.features ?? [] }
  ]);
  const inputs = await preparePartitionInputs(tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, dangleReport.extensions);
  const faces = await polygonizePartition(tag, inputs);
  const named = nameFaces(faces.landFaces, referenceTowns);
  return { ...faces, named, dangleReport };
}

async function writeDangleOutputs(partitions) {
  const dangleRows = [];
  const extensionRows = [];
  for (const [tag, partition] of Object.entries(partitions)) {
    for (const row of partition.dangleReport.dangles) dangleRows.push({ partition: tag.toUpperCase(), ...row, nearestKm: Number.isFinite(row.nearestKm) ? row.nearestKm.toFixed(3) : "" });
    for (const row of partition.dangleReport.extensions) extensionRows.push({ partition: tag.toUpperCase(), ...row, lengthKm: row.lengthKm.toFixed(3) });
  }
  const dangleCsvPath = path.join(REPORT_DIRECTORY, "dangles.csv");
  const extensionCsvPath = path.join(REPORT_DIRECTORY, "dangle-extensions.csv");
  await writeCsv(dangleCsvPath, dangleRows, ["partition", "dangleId", "featureId", "end", "lon", "lat", "nearestKm", "nearestSource"]);
  await writeCsv(extensionCsvPath, extensionRows, ["partition", "extensionId", "dangleId", "fromLon", "fromLat", "toLon", "toLat", "lengthKm", "targetSource", "targetFeatureId"]);
  const reportPath = path.join(REPORT_DIRECTORY, "dangle-report.md");
  const lines = ["# Ancient partition dangles", ""];
  for (const [tag, partition] of Object.entries(partitions)) {
    const unresolved = partition.dangleReport.dangles.length - partition.dangleReport.extensions.length;
    lines.push(
      `- ${tag.toUpperCase()}: ${partition.dangleReport.dangles.length} dangling province-line endpoints from ${partition.dangleReport.endpointCount} endpoints; ${partition.dangleReport.extensions.length} extensions within ${EXTENSION_LIMIT_KM} km; ${unresolved} unresolved.`
    );
  }
  lines.push("", `CSV: ${dangleCsvPath}`, `Extensions: ${extensionCsvPath}`);
  await fs.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
  return { dangleCsvPath, extensionCsvPath, reportPath };
}

async function main() {
  await fs.rm(REPORT_DIRECTORY, { recursive: true, force: true });
  await fs.mkdir(REPORT_DIRECTORY, { recursive: true });
  await fs.mkdir(WORK_DIRECTORY, { recursive: true });

  const culturalZipPath = path.join(WORK_DIRECTORY, "Cultural-Shapefiles-Apr-2024.zip");
  const coastlineZipPath = path.join(WORK_DIRECTORY, "coastline.zip");
  const neLandPath = path.join(WORK_DIRECTORY, "ne_10m_land.geojson");
  await Promise.all([
    downloadFile(CULTURAL_ZIP_URL, culturalZipPath),
    downloadFile(COASTLINE_ZIP_URL, coastlineZipPath),
    downloadFile(NATURAL_EARTH_LAND_URL, neLandPath)
  ]);

  const culturalExtractPath = path.join(WORK_DIRECTORY, "awmc-cultural");
  const coastlineExtractPath = path.join(WORK_DIRECTORY, "awmc-coastline");
  await Promise.all([extractZip(culturalZipPath, culturalExtractPath), extractZip(coastlineZipPath, coastlineExtractPath)]);
  const coastShpPath = await findFirstFile(coastlineExtractPath, (filePath) => path.basename(filePath).toLowerCase() === "coastline.shp");
  if (!coastShpPath) throw new Error("Could not find AWMC coastline.shp");

  const referenceTowns = await loadReferenceTownPoints();
  const paths = {
    ad69Province: path.join(culturalExtractPath, "political_shading", "roman_empire_ad_69_provinces", "roman_empire_ad_69_provinces.shp"),
    ad69Extent: path.join(culturalExtractPath, "political_shading", "roman_empire_ad_69_extent", "roman_empire_ad_69_extent.shp"),
    ad14Province: path.join(culturalExtractPath, "political_shading", "roman_empire_ad_14_provinces", "roman_empire_ad_14_provinces.shp"),
    ad14Extent: path.join(culturalExtractPath, "political_shading", "roman_empire_ad_14_extent", "roman_empire_ad_14_extent.shp")
  };

  const ad69 = await buildPartition("ad69", paths.ad69Province, paths.ad69Extent, coastShpPath, neLandPath, referenceTowns);
  const ad14 = await buildPartition("ad14", paths.ad14Province, paths.ad14Extent, coastShpPath, neLandPath, referenceTowns);

  const csvColumns = ["faceId", "name", "towns", "observedKm2", "expectedKm2", "check", "note"];
  for (const [tag, partition] of Object.entries({ ad69, ad14 })) {
    const rows = partition.named.map((row) => ({
      ...row,
      observedKm2: row.observedKm2.toFixed(0),
      expectedKm2: row.expectedKm2.toFixed(0)
    }));
    const csvPath = path.join(REPORT_DIRECTORY, `${tag}-named-faces.csv`);
    await writeCsv(csvPath, rows, csvColumns);
    await fs.writeFile(
      path.join(REPORT_DIRECTORY, `${tag}-named-faces.geojson`),
      JSON.stringify({
        type: "FeatureCollection",
        features: partition.named.map((row) => ({
          type: "Feature",
          properties: {
            faceId: row.faceId,
            name: row.name,
            towns: row.towns,
            observedKm2: Math.round(row.observedKm2),
            expectedKm2: Math.round(row.expectedKm2),
            check: row.check,
            note: row.note
          },
          geometry: row.geometry
        }))
      }),
      "utf8"
    );
  }

  const ad69Preview = await writePreview("ad69", ad69.landFaces, ad69.named);
  const ad14Preview = await writePreview("ad14", ad14.landFaces, ad14.named);
  const dangleOutputs = await writeDangleOutputs({ ad69, ad14 });

  const summary = [
    "# Ancient partition prep summary",
    "",
    `- AWMC commit: \`${AWMC_COMMIT}\``,
    `- Natural Earth commit: \`${NATURAL_EARTH_COMMIT}\``,
    `- BBox: ${BBOX_STRING}`,
    `- AD 69: ${ad69.allFaces.features.length} raw faces; ${ad69.landFaces.features.length} land faces; ${ad69.named.length} named faces.`,
    `- AD 14: ${ad14.allFaces.features.length} raw faces; ${ad14.landFaces.features.length} land faces; ${ad14.named.length} named faces.`,
    `- AD 69 preview: ${ad69Preview.pngPath}`,
    `- AD 14 preview: ${ad14Preview.pngPath}`,
    `- Dangles: ${dangleOutputs.reportPath}`
  ];
  await fs.writeFile(path.join(REPORT_DIRECTORY, "summary.md"), `${summary.join("\n")}\n`, "utf8");

  console.log(summary.join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
