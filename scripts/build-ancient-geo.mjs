// Builds the ancient layer's geometry in data/geo/ from pinned sources: `npm run build:ancient-geo`.
//
// 1. Downloads every upstream file from a URL pinned to a commit and checks its SHA-256
//    (scripts/lib/ancient-geo-inputs.mjs). The OpenStreetMap rivers come from the committed
//    data/geo/sources/osm-waterways.geojson, so the build never reads live OpenStreetMap data.
// 2. Builds AWMC's AD 69 and AD 14 partitions (scripts/lib/ancient-partition.mjs), the AD 200 cells and
//    the ancient coastline.
// 3. Composes the areas, the empire's edge and the roads, and runs the acceptance checks
//    (scripts/lib/ancient-compose.mjs).
// 4. Only when every check passes does it write the four layers to data/geo/.
//
// Intermediates, the composition report and its previews live in a cache folder: ibm-ancient-geo in the
// system temp folder, or ANCIENT_GEO_CACHE. Its work/ and report/ folders are emptied at the start of every
// run; checked downloads in inputs/ are reused.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mapshaper from "mapshaper";
import { ANCIENT_GEO_INPUTS, AWMC_COMMIT, NATURAL_EARTH_COMMIT, ancientGeoCache, extractZip, fetchPinnedInputs, readJsonFile } from "./lib/ancient-geo-inputs.mjs";
import { buildAncientPartitions } from "./lib/ancient-partition.mjs";
import { composeAncientAreas } from "./lib/ancient-compose.mjs";
import { pointInGeometry } from "./lib/ancient-area-checks.mjs";
import { polygonsOf } from "./lib/geometry-cleanup.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIRECTORY = path.join(repositoryRoot, "data", "geo");
const OUTPUT_FILES = ["ancient-areas.geojson", "ancient-empire-edge.geojson", "ancient-roads.geojson", "ancient-coastline.geojson"];

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

// A processing aid: an internal line that separates Petra's AD 200 cell from Sinai and the Libyan desert
// in an intermediate step. AWMC's AD 200 linework leaves Arabia Petraea open to the south-west, so
// without it the cell that holds Petra and Bostra would run on through Sinai into the Libyan desert. No
// source draws the line, so it may only pick Petra's cell: `arabia` also takes the land beyond it (the
// cell south-west of it, but only outside AWMC's AD 69 extent, and AWMC's AD 69 Sinai faces), and no
// drawn border follows the line. The build checks this: it fails if any stretch of area border longer
// than 5 km lies within 1 km of the line (borders that cross it spend about 2 to 4 km there).
const PETRA_CELL_AID = {
  id: "petra-ad200-cell-aid",
  name: "the processing aid that separates Petra's AD 200 cell",
  description: "An internal line that separates Petra's AD 200 cell from Sinai and the Libyan desert in an intermediate step; no drawn border follows it.",
  coordinates: [[33.4, 31.45], [34.4, 30.8], [35.2, 30.1], [35.95, 29.15]]
};

function quote(filePath) {
  return `"${filePath.replaceAll("\\", "/")}"`;
}

async function writeJson(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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

// The AD 200 cells that Cilicia and Arabia are cut from: AWMC's AD 200 province lines, shoreline and
// extents of AD 117, AD 200 and 60 BC, Herod's kingdom and the senatorial provinces, and the processing
// aid above, polygonised together.
async function buildAd200Cells(inputs, workDirectory) {
  const aidPath = path.join(workDirectory, `${PETRA_CELL_AID.id}.geojson`);
  const cellPath = path.join(workDirectory, "ad200-cells.geojson");
  await writeJson(aidPath, {
    type: "FeatureCollection",
    features: [{ type: "Feature", properties: { aidId: PETRA_CELL_AID.id }, geometry: { type: "LineString", coordinates: PETRA_CELL_AID.coordinates } }]
  });
  await mapshaper.runCommands([
    `-i ${quote(inputs.awmcAd200Provinces)} name=prov`,
    `-i ${quote(inputs.awmcAd200Extent)} name=emp200`,
    `-i ${quote(inputs.awmc60BceExtent)} name=emp60`,
    `-i ${quote(inputs.awmcHerodsKingdom)} name=herod`,
    `-i ${quote(inputs.awmcSenatorialProvinces)} name=sen`,
    `-i ${quote(aidPath)} name=aid`,
    "-target emp200 -dissolve -lines name=emp200_line",
    "-target emp60 -dissolve -lines name=emp60_line",
    "-target herod -dissolve -lines name=herod_line",
    "-target sen -dissolve -lines name=sen_line",
    `-i ${quote(inputs.awmcShoreline)} name=coast`,
    `-i ${quote(inputs.awmcAd117Extent)} name=emp`,
    "-target emp -dissolve -lines name=emp_line",
    "-target prov,coast,emp_line,emp200_line,emp60_line,herod_line,sen_line,aid",
    "-merge-layers force name=linework",
    "-target linework -snap interval=0.001 -clean -polygons gap-tolerance=0.02 -rename-layers cells",
    `-o format=geojson ${quote(cellPath)}`
  ].join(" "));
  return cellPath;
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
          version: `awmc-commit:${AWMC_COMMIT};awmc-path:${ANCIENT_GEO_INPUTS.awmcShoreline.upstreamPath};ne-commit:${NATURAL_EARTH_COMMIT};ne-path:${ANCIENT_GEO_INPUTS.naturalEarthCoastline.upstreamPath}`,
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
  const started = Date.now();
  const cache = ancientGeoCache();
  await fs.rm(cache.work, { recursive: true, force: true });
  await fs.rm(cache.report, { recursive: true, force: true });
  await fs.mkdir(cache.work, { recursive: true });
  console.log(`Cache folder: ${cache.root}`);

  const inputs = await fetchPinnedInputs(cache.inputs);
  console.log(`Checked ${Object.keys(inputs).length} pinned inputs (SHA-256) in ${cache.inputs}`);
  const culturalRoot = await extractZip(inputs.awmcCulturalShapefiles, path.join(cache.work, "awmc-cultural"));
  const coastlineRoot = await extractZip(inputs.awmcCoastlineShapefile, path.join(cache.work, "awmc-coastline"));
  const partitions = await buildAncientPartitions({ culturalRoot, coastShpPath: path.join(coastlineRoot, "coastline", "coastline.shp"), neLandPath: inputs.naturalEarthLand, workDirectory: cache.work });
  for (const [tag, counts] of Object.entries(partitions)) console.log(`${tag.toUpperCase()} partition: ${counts.landFaces} land faces, ${counts.namedFaces} named, ${counts.extensions} of ${counts.dangles} dangling line ends extended`);
  const ad200CellsPath = await buildAd200Cells(inputs, cache.work);

  const stagingDirectory = path.join(cache.work, "output");
  const coastlinePath = path.join(stagingDirectory, "ancient-coastline.geojson");
  const coastline = buildAncientCoastline(await readJsonFile(inputs.awmcShoreline), await readJsonFile(inputs.naturalEarthCoastline), await readJsonFile(inputs.naturalEarthLand));
  await writeJson(coastlinePath, coastline.collection);

  const result = await composeAncientAreas({
    inputs,
    culturalRoot,
    partitionDirectory: cache.work,
    ad200CellsPath,
    coastlinePath,
    workDirectory: path.join(cache.work, "compose"),
    outputDirectory: stagingDirectory,
    reportDirectory: cache.report,
    previewDirectory: cache.previews,
    processingAids: [PETRA_CELL_AID]
  });

  // Every acceptance check passed, so the layers can replace the committed ones.
  for (const file of OUTPUT_FILES) await fs.copyFile(path.join(stagingDirectory, file), path.join(OUTPUT_DIRECTORY, file));
  console.log(`Wrote data/geo/: ${result.areaCount} areas, the empire's edge (${result.edgePieces} pieces, ${Math.round(result.edgeKm).toLocaleString("en-US")} km), ${result.roadCount} roads and the coastline (${coastline.collection.features.length} features; left out ${coastline.droppedInSea.length} shoreline stretch(es) in today's sea)`);
  console.log(`All acceptance checks pass (${result.placeChecks} place checks). Report: ${result.reportPath}`);
  console.log(`Previews: ${cache.previews}`);
  console.log(`Took ${Math.round((Date.now() - started) / 1000)} s.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
