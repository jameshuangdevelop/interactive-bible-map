// Rules for drawing and checking the routes' lines (ADR-0038 item 5 and its update of 2026-10-14).
// The builder (scripts/build-route-lines.mjs) and the audit (scripts/lib/route-line-audit.mjs) both
// read them, so the line drawn and the line checked follow the same rules.

// The only stretch of a line allowed on the wrong surface: a connector at each end, from a stop that
// lies on the shore or a little inland to the water (or, for a line by land, from a stop that Natural
// Earth's coarse shore puts in the water to the land). Anything longer, or anywhere else, fails.
export const CONNECTOR_MAX_KM = 3;

// A stop of a stage by sea that lies inland or inside an island, further than CONNECTOR_MAX_KM from
// the water, is reached by an approach instead (ADR-0038, update of 2026-10-14, "stops away from the
// water"): the line goes by sea to the coast nearest the stop, then straight over land to it. The
// approach may be up to APPROACH_MAX_KM, must cross no water (the audit checks it as a line by land),
// and is recorded in a `start-approach` or `end-approach` change with its length.
export const APPROACH_MAX_KM = 30;

// Lines by sea stay within this ratio of the shortest path over water through the same places
// passed, unless their provenance records the text's reason in a `detour-reason` change.
export const SEA_DETOUR_MAX_RATIO = 1.25;

// Line ends must lie within this distance of their stops' sites.
export const END_TOLERANCE_M = 1;

// The region the lines are drawn and checked in: the eastern and central Mediterranean.
export const REGION_BOUNDS = Object.freeze({ minLon: 10, maxLon: 40, minLat: 28, maxLat: 46 });

// Path search grid: cells of 500 Web Mercator metres, about 0.40 km on the ground at 36° N and
// 0.38 km at 41° N, fine enough for the narrowest passage on the routes, the Strait of Messina
// (about 3 km). Paths are then string-pulled against the exact coast, so the grid sets only which
// way round land a path goes, not where its vertices lie.
export const RASTER_CELL_M = 500;

// Paths keep off the coast where the water allows, because the basemap's coast (OpenStreetMap) is
// more detailed than Natural Earth's. In the grid search, a step within `clearanceM` of the coast
// costs up to (1 + weight) times more. When the path is straightened, each straight piece must keep
// min(keepM, the exact clearance at its ends, the clearance of the stretch it replaces) from the
// coast, so it comes closer only in a narrower passage, round a cape it already rounded, or near a
// stop. Lines by land keep a smaller distance from lake shores and the sea in the same way.
export const SEA_CLEARANCE = Object.freeze({ clearanceM: 1500, weight: 4, keepM: 1300 });
export const LAND_CLEARANCE = Object.freeze({ clearanceM: 1000, weight: 4, keepM: 800 });

// Search windows: the places a line joins, plus this margin; widened if no path is found.
export const WINDOW_MARGINS_KM = Object.freeze([150, 400, 1200]);

// A place passed by sea is passed when the line comes within this distance of it: of its site for a
// town or cape, or of its coast for an island.
export const POINT_PASS_KM = 5;
export const ISLAND_PASS_KM = 10;

// Places passed that are islands, by stop key (`location:<id>` or `route-stop:<id>`).
export const ISLAND_VIAS = new Set([
  "location:cyprus",
  "location:crete",
  "route-stop:chios",
  "route-stop:cauda"
]);

// Lines by land follow an AWMC road only where a dated road lies within this distance of each stop.
export const ROAD_SNAP_MAX_KM = 15;

// Sides of islands that the text gives. A side pass is a gate: the stretch of open water on that side
// of the island, along the meridian (north or south) of the island's label point, from its coast out
// to `gateKm` or to the next land. The line must cross it. `at` names the place passed it belongs to:
// with `instead`, the gate is how that place is passed; with `after`, the gate comes next.
export const SIDE_PASSES = new Map([
  [
    "paul-3::stage-12",
    [
      {
        at: "location:cyprus",
        island: "location:cyprus",
        side: "south",
        placement: "instead",
        gateKm: 150,
        detail:
          "Acts 21:3 says the ship came in sight of Cyprus, \"leaving it on the left hand\", while sailing to Syria, so the line passes south of the island: it crosses the open water south of Cyprus on the meridian of the island's label point.",
        sources: ["scripture:Acts 21:3"]
      }
    ]
  ],
  [
    "paul-rome::stage-02",
    [
      {
        at: "location:cyprus",
        island: "location:cyprus",
        side: "north",
        placement: "instead",
        gateKm: 150,
        detail:
          "Acts 27:4-5 says the ship \"sailed under the lee of Cyprus, because the winds were contrary\", and then across the sea off Cilicia and Pamphylia, so the line passes north of the island: it crosses the water between Cyprus and Asia Minor on the meridian of the island's label point.",
        sources: ["scripture:Acts 27:4-5"]
      }
    ]
  ],
  [
    "paul-rome::stage-03",
    [
      {
        at: "route-stop:salmone",
        island: "location:crete",
        side: "south",
        placement: "after",
        gateKm: 60,
        detail:
          "Acts 27:7-8 says the ship \"sailed under the lee of Crete, opposite Salmone\" and, \"sailing along it\", came to Fair Havens, so after Salmone the line follows Crete's south coast: it crosses the water south of Crete on the meridian of the island's label point.",
        sources: ["scripture:Acts 27:7-8"]
      }
    ]
  ],
  [
    "paul-rome::stage-04",
    [
      {
        at: "route-stop:cauda",
        island: "route-stop:cauda",
        side: "south",
        placement: "instead",
        gateKm: 40,
        detail:
          "Acts 27:14 says the storm wind \"beat down from shore\", from Crete to the north, and Acts 27:16 has the ship run \"under the lee of a small island called Clauda\", so the line passes Cauda on its sheltered south side rather than crossing it: it crosses the water south of the island on the meridian of its label point.",
        sources: ["scripture:Acts 27:14", "scripture:Acts 27:16"]
      }
    ]
  ]
]);

// Reasons the text gives for a line by sea that goes beyond SEA_DETOUR_MAX_RATIO, recorded as a
// `detour-reason` change. The storm's line is the shortest path over water through the lee of Cauda;
// its reason is recorded whatever its ratio, because the text, not navigation, sets its course.
export const DETOUR_REASONS = new Map([
  [
    "paul-rome::stage-04",
    {
      detail:
        "The storm: Acts 27:15 says \"we gave way to it and were driven along\", Acts 27:16 has the ship pass under the lee of Cauda, and Acts 28:1 has it reach Malta. The text gives no course between, so after Cauda the line runs straight across the open sea to Malta.",
      sources: ["scripture:Acts 27:15", "scripture:Acts 27:16", "scripture:Acts 28:1"]
    }
  ]
]);

// How each line was drawn: the kind of the first change in its provenance.
export const METHODS = Object.freeze({
  SEA: "shortest-over-water",
  ROAD: "awmc-road",
  STRAIGHT_LAND: "straight-over-land",
  SHORTEST_LAND: "shortest-over-land",
  UNKNOWN: "path-not-known"
});
export const METHOD_KINDS = new Set(Object.values(METHODS));

export function stopKey(stopRef) {
  return stopRef?.kind === "location" ? `location:${stopRef.locationId}` : `route-stop:${stopRef?.stopId}`;
}

export function stageKey(routeId, stageId) {
  return `${routeId}::${stageId}`;
}
