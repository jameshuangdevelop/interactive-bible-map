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
const AWMC_ZIP_URL = `https://raw.githubusercontent.com/AWMC/geodata/${AWMC_COMMIT}/${encodeURIComponent("Cultural Shapefiles Apr 2024.zip")}`;
const NATURAL_EARTH_LAND_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NATURAL_EARTH_COMMIT}/geojson/ne_10m_land.geojson`;

const WORK_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03-method");
const REPORT_DIRECTORY = path.join(os.tmpdir(), "ibm-m4-03");
const BBOX = Object.freeze({ minLon: 9, minLat: 24, maxLon: 50, maxLat: 48 });
const BBOX_STRING = `${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`;

const REFERENCE_TOWNS = Object.freeze([
  { name: "Aegyptus", town: "Alexandria", lon: 29.9, lat: 31.2 },
  { name: "Africa", town: "Leptis Magna", lon: 14.292, lat: 32.639 },
  { name: "Achaia", town: "Corinth", lon: 22.878614, lat: 37.905642 },
  { name: "Arabia", town: "Petra", lon: 35.444, lat: 30.328 },
  { name: "Asia", town: "Ephesus", lon: 27.342403, lat: 37.940164 },
  { name: "Bithynia et Pontus", town: "Nicomedia", lon: 29.92, lat: 40.77 },
  { name: "Cappadocia", town: "Caesarea Mazaca", lon: 35.49, lat: 38.73 },
  { name: "Cilicia", town: "Tarsus", lon: 34.896467, lat: 36.914043 },
  { name: "Creta et Cyrene", town: "Gortyna (Crete)", lon: 24.944, lat: 35.06 },
  { name: "Creta et Cyrene", town: "Cyrene", lon: 21.86, lat: 32.83 },
  { name: "Cyprus", town: "Paphos", lon: 32.43, lat: 34.77 },
  { name: "Dalmatia", town: "Delminium hinterland", lon: 17.2, lat: 43.8 },
  { name: "Epirus", town: "Nicopolis", lon: 20.75, lat: 39.02 },
  { name: "Galatia", town: "Ancyra", lon: 32.86, lat: 39.93 },
  { name: "Italia", town: "Rome", lon: 12.491258, lat: 41.889977 },
  { name: "Lycia et Pamphylia", town: "Perga", lon: 30.852, lat: 36.959 },
  { name: "Macedonia", town: "Thessalonica", lon: 22.952885, lat: 40.628342 },
  { name: "Mesopotamia", town: "Edessa", lon: 39.028, lat: 37.16 },
  { name: "Moesia Inferior", town: "Odessos", lon: 27.915, lat: 43.214 },
  { name: "Osroene", town: "Nisibis", lon: 41.22, lat: 37.07 },
  { name: "Pannonia", town: "Sirmium", lon: 19.61, lat: 44.98 },
  { name: "Sicilia", town: "Syracuse", lon: 15.2, lat: 37.12 },
  { name: "Syria Coele", town: "Antioch", lon: 36.181667, lat: 36.204722 },
  { name: "Syria Palaestina", town: "Jerusalem", lon: 35.234156, lat: 31.776679 },
  { name: "Syria Phoenice", town: "Tyre", lon: 35.209358, lat: 33.268071 },
  { name: "Thracia", town: "Hadrianopolis", lon: 26.56, lat: 41.68 },
  { name: "outside-armenia", town: "Artaxata", lon: 44.57, lat: 39.96 },
  { name: "outside-parthia", town: "Ctesiphon", lon: 44.58, lat: 33.1 }
]);

const SIZE_CHECKS = Object.freeze([
  { key: "Cyprus", expectedKm2: 9250, tolerance: 0.3 },
  { key: "Sicilia", expectedKm2: 25700, tolerance: 0.3 },
  { key: "Creta et Cyrene::Gortyna (Crete)", expectedKm2: 8300, tolerance: 0.3 },
  { key: "Achaia", expectedKm2: 30000, tolerance: 0.3 },
  { key: "Thracia", expectedKm2: 85000, tolerance: 0.3 },
  { key: "Dalmatia", expectedKm2: 90000, tolerance: 0.3 }
]);

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-15) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon([x, y], geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    const [outer, ...holes] = geometry.coordinates;
    if (!pointInRing([x, y], outer)) return false;
    return !holes.some((ring) => pointInRing([x, y], ring));
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => {
      const [outer, ...holes] = polygon;
      if (!pointInRing([x, y], outer)) return false;
      return !holes.some((ring) => pointInRing([x, y], ring));
    });
  }
  return false;
}

function polygonsFromGeometry(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function polygonAreaApproxKm2(polygonCoordinates) {
  const ringAreaDegrees2 = (ring) => {
    if (!ring || ring.length < 4) return 0;
    let shoelace = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      shoelace += x1 * y2 - x2 * y1;
    }
    return Math.abs(shoelace) / 2;
  };
  const outerRing = polygonCoordinates[0] ?? [];
  if (outerRing.length < 4) return 0;
  let latitudeSum = 0;
  for (let i = 0; i < outerRing.length - 1; i += 1) latitudeSum += outerRing[i][1];
  const outerArea = ringAreaDegrees2(outerRing);
  const holesArea = polygonCoordinates.slice(1).reduce((sum, ring) => sum + ringAreaDegrees2(ring), 0);
  const areaDegrees2 = Math.max(0, outerArea - holesArea);
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

function centroidApprox(geometry) {
  let sx = 0;
  let sy = 0;
  let count = 0;
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      sx += node[0];
      sy += node[1];
      count += 1;
      return;
    }
    for (const child of node) walk(child);
  };
  walk(geometry?.coordinates);
  return count > 0 ? [sx / count, sy / count] : [0, 0];
}

function ensureFeatureCollection(geojson) {
  if (geojson.type === "FeatureCollection") return geojson;
  const geometries = Array.isArray(geojson.geometries) ? geojson.geometries : [];
  return {
    type: "FeatureCollection",
    features: geometries.map((geometry) => ({ type: "Feature", properties: {}, geometry }))
  };
}

async function runMapshaper(args) {
  if (process.platform === "win32") {
    await execFileAsync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npx", "mapshaper", ...args], {
      cwd: repositoryRoot,
      windowsHide: true
    });
    return;
  }
  await execFileAsync("npx", ["mapshaper", ...args], { cwd: repositoryRoot, windowsHide: true });
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const payload = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.writeFile(destinationPath, payload);
}

async function extractZip(zipPath, destinationDirectory) {
  const escapedZip = zipPath.replaceAll("'", "''");
  const escapedDest = destinationDirectory.replaceAll("'", "''");
  const command = `Expand-Archive -Path '${escapedZip}' -DestinationPath '${escapedDest}' -Force`;
  await execFileAsync("powershell", ["-NoProfile", "-Command", command], { windowsHide: true });
}

async function buildLandMask(paths) {
  await runMapshaper([
    "-i",
    paths.neLandPath,
    "-clip",
    `bbox=${BBOX_STRING}`,
    "-dissolve",
    "-clean",
    "-o",
    "format=geojson",
    paths.landMaskPath
  ]);
  await runMapshaper(["-i", paths.landMaskPath, "-lines", "-o", "format=geojson", paths.landBoundaryPath]);
}

async function buildFaces(tag, lineShpPath, extentShpPath, paths) {
  const facesPath = path.join(WORK_DIRECTORY, `${tag}-faces.geojson`);
  await runMapshaper([
    "-i",
    lineShpPath,
    "name=prov",
    "-i",
    extentShpPath,
    "name=extent",
    "-target",
    "extent",
    "-dissolve",
    "-lines",
    "name=extentline",
    "-i",
    paths.landBoundaryPath,
    "name=land",
    "-target",
    "prov,extentline,land",
    "-merge-layers",
    "force",
    "name=linework",
    "-target",
    "linework",
    "-snap",
    "interval=0.002",
    "-clean",
    "snap-interval=0.002",
    "-polygons",
    "gap-tolerance=0.006",
    "-clip",
    paths.landMaskPath,
    "-filter-slivers",
    "min-area=50km2",
    "-explode",
    "-o",
    "format=geojson",
    facesPath
  ]);
  return facesPath;
}

function assignNames(features) {
  const assigned = [];
  for (const reference of REFERENCE_TOWNS) {
    const matchIndex = features.findIndex((feature) =>
      pointInPolygon([reference.lon, reference.lat], feature.geometry)
    );
    if (matchIndex === -1) continue;
    assigned.push({
      name: reference.name,
      referenceTown: reference.town,
      faceId: `f${String(matchIndex + 1).padStart(4, "0")}`,
      areaKm2: geometryAreaApproxKm2(features[matchIndex].geometry),
      centroid: centroidApprox(features[matchIndex].geometry),
      geometry: features[matchIndex].geometry
    });
  }
  return assigned.sort((a, b) => a.name.localeCompare(b.name) || a.referenceTown.localeCompare(b.referenceTown));
}

function svgPathForRing(ring, width, height) {
  const project = ([lon, lat]) => {
    const x = ((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * width;
    const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * height;
    return [x, y];
  };
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function colorForKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash << 5) - hash + key.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},55%,78%)`;
}

async function writePreviewSvg(tag, allFaces, namedFaces) {
  const width = 1800;
  const height = 1050;
  const labelsByGeometry = new Map(namedFaces.map((face) => [face.geometry, `${face.name}`]));
  let body = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
  body += `<rect x="0" y="0" width="${width}" height="${height}" fill="#f7f7f7"/>\n`;
  for (const feature of allFaces) {
    const labelRow = namedFaces.find((row) => row.geometry === feature.geometry);
    const label = labelRow ? labelRow.name : "unlabeled";
    const fill = colorForKey(label);
    for (const polygon of polygonsFromGeometry(feature.geometry)) {
      const ring = polygon[0];
      if (!ring || ring.length < 4) continue;
      body += `<path d="${svgPathForRing(ring, width, height)} Z" fill="${fill}" stroke="#333" stroke-width="0.9" fill-opacity="0.75"/>\n`;
    }
  }
  for (const row of namedFaces) {
    const [lon, lat] = row.centroid;
    const x = ((lon - BBOX.minLon) / (BBOX.maxLon - BBOX.minLon)) * width;
    const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * height;
    body += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke">${row.name}</text>\n`;
  }
  body += `<text x="20" y="30" font-size="24" font-family="Arial, sans-serif" fill="#111">${tag.toUpperCase()} partition preview (9°E–50°E, 24°N–48°N)</text>\n`;
  body += "</svg>\n";
  const outPath = path.join(REPORT_DIRECTORY, `${tag}-partition-preview.svg`);
  await fs.writeFile(outPath, body, "utf8");
  return outPath;
}

function buildSizeChecks(namedRows) {
  return SIZE_CHECKS.map((check) => {
    let matched;
    if (check.key.includes("::")) {
      const [name, town] = check.key.split("::");
      matched = namedRows.find((row) => row.name === name && row.referenceTown === town);
    } else {
      matched = namedRows.find((row) => row.name === check.key);
    }
    if (!matched) {
      return { ...check, observedKm2: null, withinTolerance: false };
    }
    const deltaFraction = Math.abs(matched.areaKm2 - check.expectedKm2) / check.expectedKm2;
    return { ...check, observedKm2: matched.areaKm2, withinTolerance: deltaFraction <= check.tolerance };
  });
}

async function writeCsv(outputPath, rows) {
  const header = "name,referenceTown,faceId,approxAreaKm2";
  const lines = rows.map((row) => `${row.name},"${row.referenceTown}",${row.faceId},${row.areaKm2.toFixed(1)}`);
  await fs.writeFile(outputPath, `${[header, ...lines].join("\n")}\n`, "utf8");
}

async function main() {
  await fs.mkdir(WORK_DIRECTORY, { recursive: true });
  await fs.mkdir(REPORT_DIRECTORY, { recursive: true });

  const paths = {
    awmcZipPath: path.join(WORK_DIRECTORY, "Cultural-Shapefiles-Apr-2024.zip"),
    awmcExtractPath: path.join(WORK_DIRECTORY, "awmc-shp-2024"),
    neLandPath: path.join(WORK_DIRECTORY, "ne_10m_land.geojson"),
    landMaskPath: path.join(WORK_DIRECTORY, "land-mask.geojson"),
    landBoundaryPath: path.join(WORK_DIRECTORY, "land-boundary-lines.geojson")
  };

  await Promise.all([downloadFile(AWMC_ZIP_URL, paths.awmcZipPath), downloadFile(NATURAL_EARTH_LAND_URL, paths.neLandPath)]);
  await extractZip(paths.awmcZipPath, paths.awmcExtractPath);
  await buildLandMask(paths);

  const ad69Shp = path.join(paths.awmcExtractPath, "political_shading", "roman_empire_ad_69_provinces", "roman_empire_ad_69_provinces.shp");
  const ad14Shp = path.join(paths.awmcExtractPath, "political_shading", "roman_empire_ad_14_provinces", "roman_empire_ad_14_provinces.shp");
  const ad69ExtentShp = path.join(paths.awmcExtractPath, "political_shading", "roman_empire_ad_69_extent", "roman_empire_ad_69_extent.shp");
  const ad14ExtentShp = path.join(paths.awmcExtractPath, "political_shading", "roman_empire_ad_14_extent", "roman_empire_ad_14_extent.shp");
  const herodShp = path.join(paths.awmcExtractPath, "political_shading", "herod", "herod.shp");

  const ad69FacesPath = await buildFaces("ad69", ad69Shp, ad69ExtentShp, paths);
  const ad14FacesPath = await buildFaces("ad14", ad14Shp, ad14ExtentShp, paths);

  const ad69Faces = ensureFeatureCollection(JSON.parse(await fs.readFile(ad69FacesPath, "utf8"))).features;
  const ad14Faces = ensureFeatureCollection(JSON.parse(await fs.readFile(ad14FacesPath, "utf8"))).features;
  const ad69Named = assignNames(ad69Faces);
  const ad14Named = assignNames(ad14Faces);

  const ad69CsvPath = path.join(REPORT_DIRECTORY, "ad69-faces.csv");
  const ad14CsvPath = path.join(REPORT_DIRECTORY, "ad14-faces.csv");
  await writeCsv(ad69CsvPath, ad69Named);
  await writeCsv(ad14CsvPath, ad14Named);

  const ad69PreviewPath = await writePreviewSvg("ad69", ad69Faces, ad69Named);
  const ad14PreviewPath = await writePreviewSvg("ad14", ad14Faces, ad14Named);

  const herodRecord12Path = path.join(REPORT_DIRECTORY, "herod-record-12.geojson");
  await runMapshaper([
    "-i",
    herodShp,
    "-each",
    "_idx=this.id",
    "-filter",
    "_idx==12",
    "-o",
    "format=geojson",
    herodRecord12Path
  ]);

  const sizeChecks = [
    ...buildSizeChecks(ad69Named).map((row) => ({ ...row, partition: "AD 69" })),
    ...buildSizeChecks(ad14Named).map((row) => ({ ...row, partition: "AD 14" }))
  ];
  const checksPath = path.join(REPORT_DIRECTORY, "partition-size-checks.md");
  let md = "# AD69/AD14 partition size checks\n\n";
  md += `- AWMC commit: \`${AWMC_COMMIT}\`\n`;
  md += `- Natural Earth commit: \`${NATURAL_EARTH_COMMIT}\`\n`;
  md += `- Scope: ${BBOX_STRING}\n\n`;
  md += "| Partition | Face | Expected km² | Observed km² | Within ±30% |\n|---|---|---:|---:|---|\n";
  for (const row of sizeChecks) {
    md += `| ${row.partition} | ${row.key} | ${row.expectedKm2.toFixed(0)} | ${
      row.observedKm2 === null ? "n/a" : row.observedKm2.toFixed(1)
    } | ${row.withinTolerance ? "yes" : "no"} |\n`;
  }
  await fs.writeFile(checksPath, md, "utf8");

  console.log(`Wrote ${ad69CsvPath}`);
  console.log(`Wrote ${ad14CsvPath}`);
  console.log(`Wrote ${checksPath}`);
  console.log(`Wrote ${ad69PreviewPath}`);
  console.log(`Wrote ${ad14PreviewPath}`);
  console.log(`Wrote ${herodRecord12Path}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
