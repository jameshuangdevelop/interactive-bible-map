import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

import { getWebTextForReference } from "./web-text.mjs";

function roundNumber(value, decimals = 5) {
  if (typeof value !== "number") {
    return value;
  }
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundCoordinates(value, decimals = 5) {
  if (Array.isArray(value)) {
    return value.map((entry) => roundCoordinates(entry, decimals));
  }
  if (typeof value === "number") {
    return roundNumber(value, decimals);
  }
  return value;
}

function roundGeometry(geometry, decimals = 5) {
  return {
    ...geometry,
    coordinates: roundCoordinates(geometry.coordinates, decimals)
  };
}

async function writeJsonWithSize(outputDirectory, relativePath, payload) {
  const destinationPath = path.join(outputDirectory, relativePath);
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  const text = JSON.stringify(payload);
  await fs.writeFile(destinationPath, text, "utf8");
  const bytes = Buffer.byteLength(text, "utf8");
  const gzipBytes = zlib.gzipSync(text, { level: zlib.constants.Z_BEST_COMPRESSION }).length;
  return { file: relativePath.replace(/\\/gu, "/"), bytes, gzipBytes };
}

function withWebText(scriptureEntries, webVerseIndex) {
  if (!Array.isArray(scriptureEntries)) {
    return [];
  }
  return scriptureEntries.map((entry) => {
    if (!entry || typeof entry !== "object" || typeof entry.ref !== "string") {
      return entry;
    }
    return {
      ...entry,
      textWEB: getWebTextForReference(entry.ref, webVerseIndex)
    };
  });
}

export async function buildRoutesAppData({
  routesData,
  routeStopsData,
  routeLinesData,
  webVerseIndex,
  outputDirectory,
  outputPrefix = "routes"
}) {
  const routes = Array.isArray(routesData?.routes) ? routesData.routes : [];
  const stops = Array.isArray(routeStopsData?.stops) ? routeStopsData.stops : [];
  const lineFeatures = Array.isArray(routeLinesData?.features) ? routeLinesData.features : [];
  const routeById = new Map(routes.map((route) => [route.id, route]));

  const routesIndexPayload = {
    version: 1,
    routeCount: routes.length,
    routes: routes.map((route) => ({
      id: route.id,
      title: route.title,
      fromYear: route.fromYear,
      toYear: route.toYear,
      yearNote: route.yearNote ?? null,
      structure: route.structure,
      note: route.note,
      stageCount: Array.isArray(route.stages) ? route.stages.length : 0,
      sources: route.sources ?? []
    }))
  };

  const stagesPayload = {
    version: 1,
    routes: routes.map((route) => ({
      id: route.id,
      stages: (route.stages ?? []).map((stage) => ({
        ...stage,
        scripture: withWebText(stage.scripture, webVerseIndex)
      }))
    }))
  };

  const stopsPayload = {
    version: 1,
    stops: stops.map((stop) => ({
      ...stop,
      scripture: withWebText(stop.scripture, webVerseIndex)
    }))
  };

  const validLineKeys = new Set();
  for (const route of routes) {
    for (const stage of route.stages ?? []) {
      if (typeof stage?.lineId === "string") {
        validLineKeys.add(`${route.id}::${stage.id}::${stage.lineId}`);
      }
    }
  }

  const linesPayload = {
    type: "FeatureCollection",
    features: lineFeatures
      .filter((feature) => {
        const lineId = feature?.properties?.lineId;
        const routeId = feature?.properties?.routeId;
        const stageId = feature?.properties?.stageId;
        if (
          typeof lineId !== "string" ||
          typeof routeId !== "string" ||
          typeof stageId !== "string"
        ) {
          return false;
        }
        if (!routeById.has(routeId)) {
          return false;
        }
        return validLineKeys.has(`${routeId}::${stageId}::${lineId}`);
      })
      .map((feature) => ({
        type: "Feature",
        properties: {
          lineId: feature.properties.lineId,
          routeId: feature.properties.routeId,
          stageId: feature.properties.stageId
        },
        geometry: roundGeometry(feature.geometry, 5)
      }))
  };

  const writtenFiles = [];
  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, `${outputPrefix}.routes.json`, routesIndexPayload)
  );
  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, `${outputPrefix}.stages.json`, stagesPayload)
  );
  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, `${outputPrefix}.stops.json`, stopsPayload)
  );
  writtenFiles.push(
    await writeJsonWithSize(outputDirectory, `${outputPrefix}.lines.geojson`, linesPayload)
  );

  return {
    writtenFiles,
    routeCount: routes.length,
    stageCount: routes.reduce((sum, route) => sum + (route.stages?.length ?? 0), 0),
    stopCount: stops.length
  };
}
