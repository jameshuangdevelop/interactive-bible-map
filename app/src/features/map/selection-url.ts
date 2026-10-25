import type { MapDisplayMode, PlaceSelection } from "./types";

export type ViewTab = "map" | "routes";

const LEGACY_JESUS_STAGE_SEGMENTS = [
  "segment-01",
  "segment-02",
  "segment-03",
  "segment-04",
  "segment-05",
  "segment-06",
  "segment-07",
  "segment-08",
  "segment-09",
  "segment-10",
  "segment-11",
  "segment-12",
  "segment-13",
  "segment-14",
  "segment-15",
  "segment-16",
  "segment-17",
  "segment-18",
  "segment-19",
  "segment-20",
  "segment-21",
  "segment-22",
  "segment-23",
  "segment-24",
  "segment-25",
  "segment-26",
  "segment-27",
  "segment-28",
  "segment-29",
  "segment-30",
  "segment-31",
  "segment-32"
] as const;

const SEGMENT_TO_ROUTE_STAGE: Record<string, { routeId: string; stage: number }> = {
  "segment-01": { routeId: "jesus-1", stage: 1 },
  "segment-05": { routeId: "jesus-1", stage: 2 },
  "segment-06": { routeId: "jesus-1", stage: 3 },
  "segment-07": { routeId: "jesus-1", stage: 4 },
  "segment-08": { routeId: "jesus-1", stage: 5 },
  "segment-09": { routeId: "jesus-1", stage: 6 },
  "segment-02": { routeId: "jesus-1", stage: 7 },
  "segment-10": { routeId: "jesus-1", stage: 8 },
  "segment-04": { routeId: "jesus-1", stage: 9 },
  "segment-03": { routeId: "jesus-1", stage: 10 },
  "segment-20": { routeId: "jesus-2", stage: 1 },
  "segment-19": { routeId: "jesus-2", stage: 2 },
  "segment-11": { routeId: "jesus-2", stage: 3 },
  "segment-12": { routeId: "jesus-2", stage: 4 },
  "segment-13": { routeId: "jesus-3", stage: 1 },
  "segment-14": { routeId: "jesus-3", stage: 2 },
  "segment-15": { routeId: "jesus-3", stage: 3 },
  "segment-16": { routeId: "jesus-3", stage: 4 },
  "segment-17": { routeId: "jesus-3", stage: 5 },
  "segment-18": { routeId: "jesus-3", stage: 6 },
  "segment-21": { routeId: "jesus-3", stage: 7 },
  "segment-25": { routeId: "jesus-4", stage: 1 },
  "segment-26": { routeId: "jesus-4", stage: 2 },
  "segment-27": { routeId: "jesus-4", stage: 3 },
  "segment-22": { routeId: "jesus-4", stage: 4 },
  "segment-28": { routeId: "jesus-4", stage: 5 },
  "segment-23": { routeId: "jesus-4", stage: 6 },
  "segment-24": { routeId: "jesus-4", stage: 7 },
  "segment-29": { routeId: "jesus-5", stage: 1 },
  "segment-30": { routeId: "jesus-5", stage: 2 },
  "segment-31": { routeId: "jesus-6", stage: 1 },
  "segment-32": { routeId: "jesus-6", stage: 2 }
};

function parsePositiveStageValue(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseRouteSelectionFromSearch(search: string) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawRouteId = parameters.get("route")?.trim();
  const rawStage = parsePositiveStageValue(parameters.get("stage"));
  const routeId = rawRouteId && rawRouteId.length > 0 ? rawRouteId : null;

  if (routeId !== "jesus") {
    return { routeId, stage: rawStage };
  }

  if (rawStage === null) {
    return { routeId: "jesus-1", stage: null };
  }

  const legacySegmentId = LEGACY_JESUS_STAGE_SEGMENTS[rawStage - 1];
  if (!legacySegmentId) {
    return { routeId: "jesus-1", stage: null };
  }

  const mapped = SEGMENT_TO_ROUTE_STAGE[legacySegmentId];
  if (!mapped) {
    return { routeId: "jesus-1", stage: null };
  }

  return { routeId: mapped.routeId, stage: mapped.stage };
}

export function candidateLetterToIndex(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length !== 1) {
    return null;
  }

  const code = trimmed.toUpperCase().charCodeAt(0);
  const lowerBound = "A".charCodeAt(0);
  const upperBound = "Z".charCodeAt(0);
  if (code < lowerBound || code > upperBound) {
    return null;
  }

  return code - lowerBound;
}

export function parseSelectionFromSearch(search: string): PlaceSelection | null {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const placeId = parameters.get("place")?.trim();
  if (!placeId) {
    return null;
  }

  return {
    placeId,
    candidateIndex: candidateLetterToIndex(parameters.get("candidate"))
  };
}

export function applySelectionToSearch(search: string, selection: PlaceSelection | null) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (!selection) {
    parameters.delete("place");
    parameters.delete("candidate");
  } else {
    parameters.set("place", selection.placeId);

    if (selection.candidateIndex === null || selection.candidateIndex < 0) {
      parameters.delete("candidate");
    } else {
      parameters.set(
        "candidate",
        String.fromCharCode("a".charCodeAt(0) + selection.candidateIndex)
      );
    }
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function parseMapModeFromSearch(search: string): MapDisplayMode {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parameters.get("map")?.trim().toLowerCase() === "modern" ? "modern" : "ancient";
}

export function applyMapModeToSearch(search: string, mapMode: MapDisplayMode) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (mapMode === "modern") {
    parameters.set("map", "modern");
  } else {
    parameters.delete("map");
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function parseTimelineYearFromSearch(search: string) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const year = parameters.get("year")?.trim();
  if (!year) {
    return null;
  }

  const parsed = Number.parseInt(year, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function applyTimelineYearToSearch(search: string, year: number | null) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (year === null || !Number.isFinite(year)) {
    parameters.delete("year");
  } else {
    parameters.set("year", String(Math.trunc(year)));
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function parseViewTabFromSearch(search: string): ViewTab {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parameters.get("tab")?.trim().toLowerCase() === "routes" ? "routes" : "map";
}

export function applyViewTabToSearch(search: string, tab: ViewTab) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (tab === "routes") {
    parameters.set("tab", "routes");
  } else {
    parameters.delete("tab");
    parameters.delete("route");
    parameters.delete("stage");
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function parseRouteIdFromSearch(search: string) {
  return parseRouteSelectionFromSearch(search).routeId;
}

export function applyRouteIdToSearch(search: string, routeId: string | null) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!routeId) {
    parameters.delete("route");
    parameters.delete("stage");
  } else {
    parameters.set("route", routeId);
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}

export function parseRouteStageFromSearch(search: string) {
  return parseRouteSelectionFromSearch(search).stage;
}

export function applyRouteStageToSearch(search: string, stage: number | null) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (stage === null || !Number.isFinite(stage) || stage <= 0) {
    parameters.delete("stage");
  } else {
    parameters.set("stage", String(Math.trunc(stage)));
  }

  const next = parameters.toString();
  return next.length > 0 ? `?${next}` : "";
}
