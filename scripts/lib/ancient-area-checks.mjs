// Acceptance checks and previews for the composed ancient areas (data/geo/ancient-areas.geojson).
import fs from "node:fs/promises";
import path from "node:path";
import mapshaper from "mapshaper";
import booleanValid from "@turf/boolean-valid";
import polylabel from "polylabel";
import sharp from "sharp";
import { countConsecutiveDuplicateVertices, geometryAreaKm2, polygonsOf } from "./geometry-cleanup.mjs";

const NEAR_BORDER_KM = 3;

function featureCollection(features) {
  return { type: "FeatureCollection", features };
}

function asFeatureCollection(geojson) {
  if (!geojson) return featureCollection([]);
  if (geojson.type === "FeatureCollection") return geojson;
  if (geojson.type === "GeometryCollection") {
    return featureCollection((geojson.geometries ?? []).map((geometry) => ({ type: "Feature", properties: {}, geometry })));
  }
  return featureCollection([]);
}

async function runInMemory(commands, inputs) {
  const output = await mapshaper.applyCommands(commands, inputs);
  const text = output["out.json"];
  return asFeatureCollection(text ? JSON.parse(typeof text === "string" ? text : text.toString()) : null);
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [xi, yi] = ring[index];
    const [xj, yj] = ring[previous];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInGeometry(point, geometry) {
  return polygonsOf(geometry).some(([outer, ...holes]) => pointInRing(point, outer) && !holes.some((hole) => pointInRing(point, hole)));
}

export function distancePointToSegmentKm(point, start, end) {
  const lat = (point[1] * Math.PI) / 180;
  const project = ([lon, pointLat]) => [(lon - point[0]) * 111.32 * Math.cos(lat), (pointLat - point[1]) * 110.574];
  const a = project(start);
  const b = project(end);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / denominator));
  return Math.hypot(a[0] + t * dx, a[1] + t * dy);
}

// The stretches of the areas' borders that lie within `withinKm` of a line, walked along every ring in
// steps of about 50 m: [{ areaId, lengthKm, start, closestKm }]. A border that crosses the line spends a
// short stretch near it (about 2 × withinKm / sin of the crossing angle); one that follows it, a long one.
export function borderStretchesNear(features, line, withinKm) {
  const lats = line.map(([, lat]) => lat);
  const latMargin = withinKm / 110.574 + 0.001;
  const lonMargin = withinKm / (111.32 * Math.cos((Math.max(...lats.map(Math.abs)) * Math.PI) / 180)) + 0.001;
  const box = [Math.min(...line.map(([lon]) => lon)) - lonMargin, Math.min(...lats) - latMargin, Math.max(...line.map(([lon]) => lon)) + lonMargin, Math.max(...lats) + latMargin];
  const nearest = (point) => Math.min(...line.slice(1).map((end, index) => distancePointToSegmentKm(point, line[index], end)));
  const segmentKm = (start, end) => Math.hypot((end[0] - start[0]) * 111.32 * Math.cos((((start[1] + end[1]) / 2) * Math.PI) / 180), (end[1] - start[1]) * 110.574);
  const stretches = [];
  for (const feature of features) {
    const areaId = feature.properties?.areaId;
    for (const ring of polygonsOf(feature.geometry).flat()) {
      const ringStretches = [];
      let open = null;
      let startsAtRingStart = false;
      for (let index = 1; index < ring.length; index += 1) {
        const [start, end] = [ring[index - 1], ring[index]];
        if (Math.max(start[0], end[0]) < box[0] || Math.min(start[0], end[0]) > box[2] || Math.max(start[1], end[1]) < box[1] || Math.min(start[1], end[1]) > box[3]) {
          if (open) ringStretches.push(open);
          open = null;
          continue;
        }
        const lengthKm = segmentKm(start, end);
        const steps = Math.max(1, Math.ceil(lengthKm / 0.05));
        for (let step = 0; step < steps; step += 1) {
          const t = (step + 0.5) / steps;
          const point = [start[0] + t * (end[0] - start[0]), start[1] + t * (end[1] - start[1])];
          const distance = nearest(point);
          if (distance <= withinKm) {
            if (!open) {
              open = { areaId, lengthKm: 0, start: point, closestKm: distance };
              if (index === 1 && step === 0) startsAtRingStart = true;
            }
            open.lengthKm += lengthKm / steps;
            open.closestKm = Math.min(open.closestKm, distance);
          } else if (open) {
            ringStretches.push(open);
            open = null;
          }
        }
      }
      // A stretch still open at the ring's end runs on through its first vertex.
      if (open && startsAtRingStart && ringStretches.length > 0) {
        ringStretches[0] = { ...ringStretches[0], lengthKm: ringStretches[0].lengthKm + open.lengthKm, start: open.start, closestKm: Math.min(ringStretches[0].closestKm, open.closestKm) };
      } else if (open) {
        ringStretches.push(open);
      }
      stretches.push(...ringStretches);
    }
  }
  return stretches.sort((left, right) => right.lengthKm - left.lengthKm);
}

export function distanceToGeometryKm(point, geometry) {
  let minimum = Number.POSITIVE_INFINITY;
  for (const polygon of polygonsOf(geometry)) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) minimum = Math.min(minimum, distancePointToSegmentKm(point, ring[index - 1], ring[index]));
    }
  }
  return minimum;
}

// A point well inside the largest part, for labels and for describing leftover pieces.
export function labelPoint(geometry) {
  const largest = polygonsOf(geometry).map((polygon) => ({ polygon, area: geometryAreaKm2({ type: "Polygon", coordinates: polygon }) })).sort((left, right) => right.area - left.area)[0];
  if (!largest) return null;
  return polylabel(largest.polygon, 0.001).slice(0, 2);
}

export function validityRows(collection) {
  return collection.features.map((feature) => ({
    areaId: feature.properties.areaId,
    areaKm2: geometryAreaKm2(feature.geometry),
    parts: polygonsOf(feature.geometry).length,
    valid: booleanValid(feature),
    duplicateVertices: countConsecutiveDuplicateVertices(feature.geometry)
  }));
}

// Overlaps between areas, using mapshaper's mosaic (every overlapping piece becomes its own tile).
export async function overlapRows(collection) {
  const input = featureCollection(collection.features.map((feature) => ({ type: "Feature", properties: { areaId: feature.properties.areaId }, geometry: feature.geometry })));
  const mosaic = await runInMemory("-i in.json -mosaic calc='n=count(),ids=collect(areaId)' -o out.json format=geojson", { "in.json": input });
  const byPair = new Map();
  for (const tile of mosaic.features) {
    if ((tile.properties?.n ?? 1) < 2) continue;
    const key = [].concat(tile.properties.ids).sort().join(" + ");
    byPair.set(key, (byPair.get(key) ?? 0) + geometryAreaKm2(tile.geometry));
  }
  return [...byPair.entries()].map(([pair, areaKm2]) => ({ pair, areaKm2 })).sort((left, right) => right.areaKm2 - left.areaKm2);
}

// Land that should be covered (AD 69 extent on land, plus Nabataea) but lies in no area.
// `explanations` is [{ label, point }]: a leftover piece containing `point` is listed under `label`.
export async function coverageRows(domainFeatures, collection, explanations, minimumKm2) {
  const domain = featureCollection(domainFeatures.map((feature) => ({ type: "Feature", properties: {}, geometry: feature.geometry })));
  const areas = featureCollection(collection.features.map((feature) => ({ type: "Feature", properties: {}, geometry: feature.geometry })));
  // The domain is erased piece by piece and only then united: uniting first (with -dissolve2 or
  // -dissolve) and erasing every area from that one large polygon can return nothing at all in
  // mapshaper 0.6.113, where the leftover is small. `-dissolve2` (not `-dissolve`) unites overlapping
  // pieces without leaving holes.
  const leftover = await runInMemory("-i domain.json name=domain -i areas.json name=areas -target domain -erase areas -dissolve2 -explode -o out.json format=geojson", {
    "domain.json": domain,
    "areas.json": areas
  });
  const rows = [];
  let smallCount = 0;
  let smallKm2 = 0;
  // mapshaper's erase can return a piece that lies in no domain feature, where an area's edges coincide
  // with a domain feature's round a hole that both leave out (such as a lagoon); such a piece isn't land
  // to cover, so every piece must have its inner point in the domain.
  const domainBoxes = domain.features.map((feature) => polygonsOf(feature.geometry).flatMap((polygon) => polygon[0]).reduce((box, [lon, lat]) => [Math.min(box[0], lon), Math.min(box[1], lat), Math.max(box[2], lon), Math.max(box[3], lat)], [Infinity, Infinity, -Infinity, -Infinity]));
  const inDomain = (point) => domain.features.some((feature, index) => point[0] >= domainBoxes[index][0] && point[0] <= domainBoxes[index][2] && point[1] >= domainBoxes[index][1] && point[1] <= domainBoxes[index][3] && pointInGeometry(point, feature.geometry));
  for (const piece of leftover.features) {
    if (!inDomain(labelPoint(piece.geometry))) continue;
    const areaKm2 = geometryAreaKm2(piece.geometry);
    if (areaKm2 <= minimumKm2) {
      smallCount += 1;
      smallKm2 += areaKm2;
      continue;
    }
    const matched = [...new Set(explanations.filter((candidate) => pointInGeometry(candidate.point, piece.geometry)).map((candidate) => candidate.label))];
    rows.push({ areaKm2, point: labelPoint(piece.geometry), explanation: matched.length > 0 ? matched.join(", ") : null, geometry: piece.geometry });
  }
  rows.sort((left, right) => right.areaKm2 - left.areaKm2);
  return { rows, smallCount, smallKm2 };
}

// The geometry acceptance checks of M4-03 and the Fact-Checker's fixes, over the lists the composition
// reports: every expected area built, valid and without repeated vertices; no overlap larger than
// `maxOverlapKm2`; no unexplained coverage gap; every place inside its area, within 3 km of it or with
// an explanation; every anchor in its area; the old-sea points in no area; no stretch of the empire's
// edge longer than `maxCoastStretchKm` along today's coast; and no stretch of border longer than
// `maxAidStretchKm` near a processing aid (`aidStretches`, from borderStretchesNear), which would mean a
// border follows a line that is only meant to help an intermediate step. Returns the failures, in words.
export function acceptanceFailures({ builtAreaIds, expectedAreaIds, validity, overlaps, coverageGaps, places, anchors, emptyPoints, coastStretches, aidStretches = [] }, { maxOverlapKm2 = 1, maxCoastStretchKm = 10, maxAidStretchKm = 5 } = {}) {
  const failures = [];
  const at = (point) => point.map((value) => value.toFixed(3)).join(", ");
  for (const areaId of expectedAreaIds) if (!builtAreaIds.includes(areaId)) failures.push(`${areaId} was not built`);
  for (const row of validity) {
    if (!row.valid) failures.push(`${row.areaId} is not a valid polygon`);
    if (row.duplicateVertices > 0) failures.push(`${row.areaId} repeats ${row.duplicateVertices} vertices`);
  }
  for (const row of overlaps) if (row.areaKm2 > maxOverlapKm2) failures.push(`${row.pair} overlap by ${row.areaKm2.toFixed(2)} km²`);
  for (const row of coverageGaps) if (!row.explanation) failures.push(`${row.areaKm2.toFixed(1)} km² at ${at(row.point)} lies in no area, unexplained`);
  for (const row of places) {
    if (row.status !== "inside" && row.status !== "near-border" && !row.explanation) failures.push(`${row.label} is ${row.status === "area-not-built" ? "linked to an area that wasn't built" : `${row.distanceKm.toFixed(1)} km outside`} \`${row.areaId}\`, unexplained`);
  }
  for (const check of anchors) if (!check.areaIds.includes(check.expected)) failures.push(`${check.name} lies in ${check.areaIds.join(", ") || "no area"}, not ${check.expected}`);
  for (const check of emptyPoints) if (check.areaIds.length > 0) failures.push(`${check.name} lies in ${check.areaIds.join(", ")}, which should hold no land there`);
  for (const stretch of coastStretches) if (stretch.lengthKm > maxCoastStretchKm) failures.push(`the empire's edge runs ${stretch.lengthKm.toFixed(1)} km along today's coast from ${at(stretch.start)}`);
  for (const stretch of aidStretches) if (stretch.lengthKm > maxAidStretchKm) failures.push(`${stretch.areaId}'s border runs ${stretch.lengthKm.toFixed(1)} km close to ${stretch.aid} from ${at(stretch.start)}, so that line would shape a border`);
  return failures;
}

// Every place with a place-level link is checked at each of its candidate sites; candidate-level
// links are checked at their own site.
export function placeRows(records, collection) {
  const areaById = new Map(collection.features.map((feature) => [feature.properties.areaId, feature]));
  const rows = [];
  for (const record of records) {
    const checks = [];
    for (const [index, candidate] of (record.candidates ?? []).entries()) {
      const areaId = candidate.politicalAreaId ?? record.politicalAreaId;
      if (!areaId || !Array.isArray(candidate.coordinates)) continue;
      checks.push({ label: (record.candidates.length > 1 ? `${record.id} candidate ${index}` : record.id), areaId, point: candidate.coordinates, linkLevel: candidate.politicalAreaId ? "candidate" : "place" });
    }
    for (const check of checks) {
      const area = areaById.get(check.areaId);
      if (!area) {
        rows.push({ ...check, status: "area-not-built", distanceKm: null, actualAreaIds: [] });
        continue;
      }
      if (pointInGeometry(check.point, area.geometry)) {
        rows.push({ ...check, status: "inside", distanceKm: 0, actualAreaIds: [check.areaId] });
        continue;
      }
      const distanceKm = distanceToGeometryKm(check.point, area.geometry);
      const actualAreaIds = collection.features.filter((feature) => pointInGeometry(check.point, feature.geometry)).map((feature) => feature.properties.areaId);
      rows.push({ ...check, status: distanceKm <= NEAR_BORDER_KM ? "near-border" : "outside", distanceKm, actualAreaIds });
    }
  }
  return rows;
}

// Distinct fills so that neighbouring areas can be told apart in previews.
const PREVIEW_PALETTE = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075", "#a9a9a9", "#ff7f50", "#6b8e23", "#dda0dd"];

function colorForKey(key, index) {
  if (Number.isInteger(index)) return PREVIEW_PALETTE[index % PREVIEW_PALETTE.length];
  let hash = 0;
  for (let position = 0; position < key.length; position += 1) hash = (hash << 5) - hash + key.charCodeAt(position);
  return `hsl(${Math.abs(hash) % 360},55%,72%)`;
}

function escapeXml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Renders areas (and optional lines and points) to a PNG in an equirectangular view scaled by cos(latitude).
export async function writePreviewPng(outputPath, { title, bounds, areas, lines = [], points = [], width = 1800 }) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const xScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const height = Math.round((width * (maxLat - minLat)) / ((maxLon - minLon) * xScale));
  const project = ([lon, lat]) => [((lon - minLon) / (maxLon - minLon)) * width, ((maxLat - lat) / (maxLat - minLat)) * height];
  const pathFor = (ring, close) => ring.map((position, index) => {
    const [x, y] = project(position);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join("") + (close ? "Z" : "");
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#dde8f0"/>`;
  areas.features.forEach((feature, index) => {
    const d = polygonsOf(feature.geometry).map((polygon) => polygon.map((ring) => pathFor(ring, true)).join("")).join("");
    svg += `<path d="${d}" fill="${colorForKey(feature.properties.areaId, index)}" fill-rule="evenodd" fill-opacity="0.55" stroke="#222" stroke-width="0.9"/>`;
  });
  for (const line of lines) {
    svg += `<path d="${pathFor(line.coordinates, false)}" fill="none" stroke="${line.color ?? "#1a4fd6"}" stroke-width="${line.width ?? 1.6}"${line.dash ? ` stroke-dasharray="${line.dash}"` : ""}/>`;
  }
  for (const feature of areas.features) {
    const point = labelPoint(feature.geometry);
    if (!point || point[0] < minLon || point[0] > maxLon || point[1] < minLat || point[1] > maxLat) continue;
    const [x, y] = project(point);
    svg += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="Arial, sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke">${escapeXml(feature.properties.areaId)}</text>`;
  }
  for (const point of points) {
    const [x, y] = project(point.coordinates);
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${point.color ?? "#c00"}" stroke="#fff" stroke-width="1.2"/>`;
    svg += `<text x="${(x + 6).toFixed(1)}" y="${(y - 5).toFixed(1)}" font-family="Arial, sans-serif" font-size="12" fill="#000" stroke="#fff" stroke-width="2.5" paint-order="stroke">${escapeXml(point.name)}</text>`;
  }
  svg += `<text x="12" y="28" font-family="Arial, sans-serif" font-size="20" fill="#000" stroke="#fff" stroke-width="3" paint-order="stroke">${escapeXml(title)}</text>`;
  svg += `<text x="12" y="${height - 12}" font-family="Arial, sans-serif" font-size="13" fill="#333">${bounds.join(", ")} (lon/lat)</text></svg>`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
  return outputPath;
}
