// AWMC's AD 69 and AD 14 province partitions for the ancient layer: AWMC's province lines, extent and
// coastline are polygonised into faces and cut to Natural Earth land, and the faces that hold a reference
// town are named. Where a province line stops short of another line, it is extended straight on for up
// to EXTENSION_LIMIT_KM to close the face. scripts/build-ancient-geo.mjs calls buildAncientPartitions.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(moduleDirectory, "..", "..");

// The frame lies outside AWMC's AD 69 extent on every side (the extent spans 9.5°W–40.7°E and
// 22.9–54.4°N), so no face inside the empire is cut by a straight frame edge.
const BBOX = Object.freeze({ minLon: -11, minLat: 22.5, maxLon: 50, maxLat: 56 });
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

async function runMapshaper(args) {
  await mapshaper.runCommands(args);
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

async function preparePartitionInputs(workDirectory, tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, extensionFeatures) {
  const directory = path.join(workDirectory, tag);
  await fs.mkdir(directory, { recursive: true });
  const provinceLinesPath = path.join(directory, "province-lines.geojson");
  const extentLinePath = path.join(directory, "extent-line.geojson");
  const coastlinePath = path.join(directory, "awmc-coastline.geojson");
  const landMaskPath = path.join(directory, "ne-land-mask.geojson");
  const extensionPath = path.join(directory, "extensions.geojson");
  const bboxPath = path.join(directory, "bbox-frame.geojson");
  await runMapshaper(["-i", provinceShpPath, "-clip", `bbox=${BBOX_STRING}`, "-each", "_ibmLineId=this.id", "-o", "format=geojson", provinceLinesPath]);
  // The extent's polygons overlap in places (AD 69 over Raetia); `-clean -dissolve2` unites them where a
  // plain `-dissolve` would leave land covered twice as a hole.
  await runMapshaper(["-i", extentShpPath, "-clean", "-dissolve2", "-lines", "-clip", `bbox=${BBOX_STRING}`, "-o", "format=geojson", extentLinePath]);
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

async function polygonizePartition(workDirectory, tag, inputPaths) {
  const allFacesPath = path.join(workDirectory, tag, "all-faces.geojson");
  const landFacesPath = path.join(workDirectory, tag, "land-faces.geojson");
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

async function buildPartition(workDirectory, tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, referenceTowns) {
  const initialInputs = await preparePartitionInputs(workDirectory, tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, []);
  const provinceLines = JSON.parse(await fs.readFile(initialInputs.provinceLinesPath, "utf8"));
  const extentLines = JSON.parse(await fs.readFile(initialInputs.extentLinePath, "utf8"));
  const coastline = JSON.parse(await fs.readFile(initialInputs.coastlinePath, "utf8"));
  const dangleReport = findDangles(provinceLines, [
    { source: "province", features: provinceLines.features ?? [] },
    { source: "extent", features: extentLines.features ?? [] },
    { source: "awmc-coastline", features: coastline.features ?? [] }
  ]);
  const inputs = await preparePartitionInputs(workDirectory, tag, provinceShpPath, extentShpPath, coastShpPath, neLandPath, dangleReport.extensions);
  const faces = await polygonizePartition(workDirectory, tag, inputs);
  const named = nameFaces(faces.landFaces, referenceTowns);
  return { ...faces, named, dangleReport };
}

// Builds the AD 69 and AD 14 partitions in `workDirectory` (a folder for each, holding its land faces,
// land mask and AWMC coastline) and writes each one's named faces there as `<tag>-named-faces.geojson`.
// Returns counts for the composition report.
export async function buildAncientPartitions({ culturalRoot, coastShpPath, neLandPath, workDirectory }) {
  const referenceTowns = await loadReferenceTownPoints();
  const shapefile = (folder) => path.join(culturalRoot, "political_shading", folder, `${folder}.shp`);
  const summary = {};
  for (const [tag, provinces, extent] of [
    ["ad69", "roman_empire_ad_69_provinces", "roman_empire_ad_69_extent"],
    ["ad14", "roman_empire_ad_14_provinces", "roman_empire_ad_14_extent"]
  ]) {
    const partition = await buildPartition(workDirectory, tag, shapefile(provinces), shapefile(extent), coastShpPath, neLandPath, referenceTowns);
    await fs.writeFile(
      path.join(workDirectory, `${tag}-named-faces.geojson`),
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
    summary[tag] = {
      rawFaces: partition.allFaces.features.length,
      landFaces: partition.landFaces.features.length,
      namedFaces: partition.named.length,
      dangles: partition.dangleReport.dangles.length,
      extensions: partition.dangleReport.extensions.length
    };
  }
  return summary;
}
