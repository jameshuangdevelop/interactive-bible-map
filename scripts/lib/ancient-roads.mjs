// AWMC roads for the ancient layer: the major roads of the Roman period (ADR-0037 item 5). AWMC's roads
// carry Barrington Atlas periods, not dates: "R" is the Roman period, 30 BC – AD 300. Minor roads are
// left out (ADR-0037's update of 2026-10-08, item 1): AWMC dates none in the Holy Land, Egypt or Cyprus.

// Major roads are kept across the map's extent.
export const MAJOR_ROAD_BOUNDS = Object.freeze({ minLon: 10, maxLon: 40, minLat: 28, maxLat: 45 });

const DACIA_SOURCES = ["bib:livius-trajan", "bib:cassius-dio-roman-history"];
const DACIA_EVIDENCE = "north of the Danube in Dacia, which Rome conquered in 101–106 (Livius \"Trajan\"; Cassius Dio 68.14.3)";
const DACIA_SHORT = "in Dacia, conquered 101–106";

// Roads with the Roman period that sources date after AD 100, left out by AWMC OBJECTID. The list and
// its evidence are from the Fact-Checker's report (docs/verification/M4-ancient-geometry.md, "Roads").
export const EXCLUDED_POST_AD100_ROADS = Object.freeze([
  { objectId: 1320, road: "Lederata to Tibiscum", evidence: DACIA_EVIDENCE, short: DACIA_SHORT, sources: DACIA_SOURCES },
  { objectId: 1363, road: "Oescus north to Napoca", evidence: DACIA_EVIDENCE, short: DACIA_SHORT, sources: DACIA_SOURCES },
  { objectId: 1403, road: "Tibiscum to Dierna", evidence: DACIA_EVIDENCE, short: DACIA_SHORT, sources: DACIA_SOURCES },
  { objectId: 1407, road: "Drobeta north towards Sarmizegetusa", evidence: DACIA_EVIDENCE, short: DACIA_SHORT, sources: DACIA_SOURCES },
  {
    objectId: 1203,
    road: "the Via Traiana Nova, Volsinii to the borders of Clusium",
    evidence: "Trajan's road: its milestone names him Dacicus, titles of 102–103 (W. V. Harris, ZPE 85, 1991; Livius \"Trajan\")",
    short: "the Via Traiana Nova, Trajanic",
    sources: ["bib:livius-trajan"]
  },
  {
    objectId: 2169,
    road: "the Via Herculia, Aequum Tuticum towards Venusia",
    evidence: "a public road under Diocletian and Maximian Herculius, late in the third century (Pleiades 469059303)",
    short: "the Via Herculia, late third century",
    sources: ["pleiades:469059303"]
  },
  {
    objectId: 2698,
    road: "Oea south to Gheriat el-Garbia",
    evidence: "it ends at a fort built in 201 under Septimius Severus (Livius \"Gheriat el-Garbia\"; Pleiades 344374)",
    short: "to Gheriat el-Garbia, a fort of 201",
    sources: ["pleiades:344374"]
  }
]);

const EXCLUDED_OBJECT_IDS = new Set(EXCLUDED_POST_AD100_ROADS.map((entry) => entry.objectId));

export function isRomanPeriod(timeperiod) {
  return typeof timeperiod === "string" && timeperiod.includes("R");
}

export function roadLines(geometry) {
  if (geometry?.type === "LineString") return [geometry.coordinates];
  if (geometry?.type === "MultiLineString") return geometry.coordinates;
  return [];
}

function lineBounds(lines) {
  const bounds = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
  for (const line of lines) {
    for (const [lon, lat] of line) {
      bounds.minLon = Math.min(bounds.minLon, lon);
      bounds.maxLon = Math.max(bounds.maxLon, lon);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
    }
  }
  return bounds;
}

function boundsIntersect(left, right) {
  return !(right.maxLon < left.minLon || right.minLon > left.maxLon || right.maxLat < left.minLat || right.minLat > left.maxLat);
}

// One change text for every kept road: the OBJECTIDs left out, grouped by their short reason.
function listWithAnd(items) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
const EXCLUSION_GROUPS = [...new Set(EXCLUDED_POST_AD100_ROADS.map((entry) => entry.short))].map((short) => `${listWithAnd(EXCLUDED_POST_AD100_ROADS.filter((entry) => entry.short === short).map((entry) => String(entry.objectId)))} (${short})`);
const DATE_EXCLUSION_CHANGE = Object.freeze({
  kind: "date-exclusions",
  detail: `Left out as later than AD 100, by AWMC OBJECTID: ${listWithAnd(EXCLUSION_GROUPS)}; the evidence is in docs/verification/M4-ancient-geometry.md, "Roads". Roads with no Barrington period, such as the Via Nova Traiana and the Strata Diocletiana, are left out by the period rule.`,
  sources: [...new Set(EXCLUDED_POST_AD100_ROADS.flatMap((entry) => entry.sources))]
});

// Picks AWMC's major roads of the Roman period that touch MAJOR_ROAD_BOUNDS, less
// EXCLUDED_POST_AD100_ROADS. Each road keeps AWMC's `known` flag (known roads are drawn solid,
// conjectured ones dashed) and its `major` flag. Returns the roads and the ids of the roads the date
// list left out.
export function selectAncientRoads(roadsSource, { awmcCommit, awmcRoadsPath }) {
  const features = [];
  const excludedRoadIds = [];
  const round = (value) => Math.round(value * 1e5) / 1e5;
  for (const [index, sourceFeature] of (roadsSource.features ?? []).entries()) {
    const properties = sourceFeature.properties ?? {};
    const lines = roadLines(sourceFeature.geometry);
    if (lines.length === 0 || !isRomanPeriod(properties.timeperiod)) continue;
    const major = String(properties.Major_or_M ?? "").trim() === "1";
    if (!major || !boundsIntersect(lineBounds(lines), MAJOR_ROAD_BOUNDS)) continue;
    const rawObjectId = Number(properties.OBJECTID);
    const objectId = Number.isFinite(rawObjectId) && rawObjectId >= 0 ? rawObjectId : index + 1;
    const roadId = `awmc-road-${objectId}-${index + 1}`;
    if (EXCLUDED_OBJECT_IDS.has(objectId)) {
      excludedRoadIds.push(roadId);
      continue;
    }
    features.push({
      type: "Feature",
      properties: {
        roadId,
        major,
        known: String(properties.Known_or_a ?? "").trim() === "1",
        timeperiod: properties.timeperiod.trim(),
        provenance: {
          dataset: "AWMC geodata",
          version: `commit:${awmcCommit};path:${awmcRoadsPath}`,
          upstreamFeatureIds: [`awmc:roads-objectid-${objectId}`, `awmc:roads-feature-${index + 1}`],
          changes: [
            {
              kind: "filter",
              detail: `An AWMC major road of the Roman period (Barrington "R", 30 BC – AD 300) in ${MAJOR_ROAD_BOUNDS.minLon}–${MAJOR_ROAD_BOUNDS.maxLon}°E, ${MAJOR_ROAD_BOUNDS.minLat}–${MAJOR_ROAD_BOUNDS.maxLat}°N (ADR-0037 item 5).`,
              sources: ["awmc:roads-major-filter", "awmc:roads-roman-period-filter"]
            },
            { ...DATE_EXCLUSION_CHANGE }
          ]
        }
      },
      geometry: { type: "MultiLineString", coordinates: lines.map((line) => line.map(([lon, lat]) => [round(lon), round(lat)])) }
    });
  }
  features.sort((left, right) => left.properties.roadId.localeCompare(right.properties.roadId));
  return { roads: { type: "FeatureCollection", features }, excludedRoadIds };
}
