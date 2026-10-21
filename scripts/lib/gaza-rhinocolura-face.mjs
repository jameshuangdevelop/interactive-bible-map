import fs from "node:fs/promises";
import path from "node:path";
import mapshaper from "mapshaper";
import { AWMC_COMMIT, NATURAL_EARTH_COMMIT } from "./ancient-geo-inputs.mjs";
import { geometryAreaKm2 } from "./geometry-cleanup.mjs";

const FACE_TAG = "raphia-coast-erase-output.geojson";

function normalizeFeatures(document) {
  if (!document) return [];
  if (document.type === "FeatureCollection") {
    return (document.features ?? []).filter((feature) => feature?.geometry);
  }
  if (document.type === "GeometryCollection") {
    return (document.geometries ?? [])
      .filter((geometry) => geometry?.type)
      .map((geometry) => ({ type: "Feature", properties: {}, geometry }));
  }
  if (document.type === "Feature" && document.geometry) {
    return [document];
  }
  return [];
}

async function dissolveFeatures(features, workDirectory) {
  if (features.length === 0) return [];
  const inputPath = path.join(workDirectory, "gaza-face-input.geojson");
  const outputPath = path.join(workDirectory, "gaza-face-output.geojson");
  await fs.writeFile(
    inputPath,
    `${JSON.stringify({
      type: "FeatureCollection",
      features: features.map((feature) => ({
        type: "Feature",
        properties: { group: 1 },
        geometry: feature.geometry
      }))
    })}\n`,
    "utf8"
  );
  await mapshaper.runCommands(`-i ${inputPath} -dissolve2 group -o format=geojson ${outputPath}`);
  const dissolved = JSON.parse(await fs.readFile(outputPath, "utf8"));
  return normalizeFeatures(dissolved);
}

export async function regenerateGazaRhinocoluraFaceFromCache(cacheRoot, { workDirectory } = {}) {
  const composePath = path.join(cacheRoot, "work", "compose", FACE_TAG);
  const raw = JSON.parse(await fs.readFile(composePath, "utf8"));
  const features = normalizeFeatures(raw);
  if (features.length === 0) {
    throw new Error(`Missing geometry in ${composePath}.`);
  }
  const workspace = workDirectory ?? path.join(cacheRoot, "work", "region-outline-metadata");
  await fs.mkdir(workspace, { recursive: true });
  const dissolved = await dissolveFeatures(features, workspace);
  if (dissolved.length !== 1) {
    throw new Error(`Expected one dissolved Gaza-Rhinocolura face, got ${dissolved.length}.`);
  }
  const geometry = dissolved[0].geometry;
  const areaKm2 = Math.round(geometryAreaKm2(geometry));
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          source: "awmc:ad69-face-raw-0001",
          provenance: {
            dataset:
              "AWMC Roman Empire AD 69 land faces (raw) clipped by pinned Natural Earth land in scripts/build-ancient-geo.mjs",
            awmcCommit: AWMC_COMMIT,
            naturalEarthCommit: NATURAL_EARTH_COMMIT,
            derivation:
              `Derived by scripts/lib/ancient-compose.mjs as booleanOp('raphia-coast','erase'): AD 69 raw face raw-0001, minus Aegyptus, the AD 69 Syria merged face and the Herodian base; this is the ${areaKm2.toLocaleString("en-US")} km² Gaza-Rhinocolura coastal face used by the judea-samaria-idumea ruling change.`
          }
        },
        geometry
      }
    ]
  };
}
