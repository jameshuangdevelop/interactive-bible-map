import mapshaper from "mapshaper";

const POLYGON_TYPES = new Set(["Polygon", "MultiPolygon"]);

export const HOLDER_UNION_GAP_FILL_AREA_KM2 = 0.0001;
const ROMAN_SIDE_UNION_SIMPLIFY_INTERVAL_METERS = 5000;
const ROMAN_SIDE_UNION_COORDINATE_DECIMALS = 2;

function asGeometryFromMapshaperOutput(outputText) {
  const payload = JSON.parse(typeof outputText === "string" ? outputText : outputText.toString());
  if (payload?.type === "FeatureCollection") {
    return payload.features?.[0]?.geometry ?? null;
  }
  if (payload?.type === "GeometryCollection") {
    return payload.geometries?.[0] ?? null;
  }
  if (payload?.type === "Feature") {
    return payload.geometry ?? null;
  }
  return payload?.geometry ?? payload ?? null;
}

function isPolygonGeometry(geometry) {
  return Boolean(geometry && typeof geometry === "object" && POLYGON_TYPES.has(geometry.type));
}

function roundNumber(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundCoordinates(value, decimals) {
  if (Array.isArray(value)) {
    return value.map((entry) => roundCoordinates(entry, decimals));
  }
  return typeof value === "number" ? roundNumber(value, decimals) : value;
}

function roundGeometry(geometry, decimals) {
  return {
    ...geometry,
    coordinates: roundCoordinates(geometry.coordinates, decimals)
  };
}

async function dissolveGeometries(geometries, gapFillAreaKm2) {
  if (geometries.length < 2) {
    return null;
  }
  const features = geometries.map((geometry) => ({
    type: "Feature",
    properties: { group: 1 },
    geometry
  }));
  const output = await mapshaper.applyCommands(
    `-i in.json -dissolve2 group gap-fill-area=${gapFillAreaKm2}km2 -o out.json format=geojson`,
    {
      "in.json": {
        type: "FeatureCollection",
        features
      }
    }
  );
  const geometry = asGeometryFromMapshaperOutput(output["out.json"]);
  return isPolygonGeometry(geometry) ? geometry : null;
}

async function simplifyGeometry(geometry, intervalMeters) {
  if (!geometry || !intervalMeters) {
    return geometry;
  }
  const output = await mapshaper.applyCommands(
    `-i in.json -simplify dp interval=${intervalMeters}m keep-shapes -o out.json format=geojson`,
    {
      "in.json": {
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry }]
      }
    }
  );
  const simplified = asGeometryFromMapshaperOutput(output["out.json"]);
  return isPolygonGeometry(simplified) ? simplified : geometry;
}

function collectAreaIdsForHolder(assignments) {
  const byLocationId = new Map();
  for (const assignment of assignments) {
    if (!assignment.hasShape || typeof assignment.holderLocationId !== "string") {
      continue;
    }
    const holderLocationId = assignment.holderLocationId.trim();
    if (holderLocationId.length === 0) {
      continue;
    }
    const areaIds = byLocationId.get(holderLocationId) ?? new Set();
    areaIds.add(assignment.areaId);
    byLocationId.set(holderLocationId, areaIds);
  }
  return byLocationId;
}

function collectRomanSideAreaIds(assignments) {
  const areaIds = new Set();
  for (const assignment of assignments) {
    if (assignment.hasShape && assignment.holderRomanSide) {
      areaIds.add(assignment.areaId);
    }
  }
  return [...areaIds];
}

function geometriesForAreaIds(areaIds, areaGeometryById) {
  return areaIds
    .map((areaId) => areaGeometryById.get(areaId))
    .filter((geometry) => isPolygonGeometry(geometry));
}

export async function buildAncientHolderUnions({
  assignments,
  areaGeometryById,
  gapFillAreaKm2 = HOLDER_UNION_GAP_FILL_AREA_KM2,
  decimals = 4
}) {
  const holderUnions = {};
  const holderAreaIdsByLocationId = collectAreaIdsForHolder(assignments);
  for (const [holderLocationId, areaIdsSet] of [...holderAreaIdsByLocationId.entries()].sort(
    ([left], [right]) => left.localeCompare(right)
  )) {
    const areaIds = [...areaIdsSet];
    if (areaIds.length < 2) {
      continue;
    }
    const unionGeometry = await dissolveGeometries(
      geometriesForAreaIds(areaIds, areaGeometryById),
      gapFillAreaKm2
    );
    if (!unionGeometry) {
      continue;
    }
    holderUnions[holderLocationId] = roundGeometry(unionGeometry, decimals);
  }

  const romanSideUnion = await dissolveGeometries(
    geometriesForAreaIds(collectRomanSideAreaIds(assignments), areaGeometryById),
    gapFillAreaKm2
  );
  const simplifiedRomanSideUnion = await simplifyGeometry(
    romanSideUnion,
    ROMAN_SIDE_UNION_SIMPLIFY_INTERVAL_METERS
  );

  return {
    holderUnions,
    romanSideUnion: simplifiedRomanSideUnion
      ? roundGeometry(simplifiedRomanSideUnion, ROMAN_SIDE_UNION_COORDINATE_DECIMALS)
      : null
  };
}
