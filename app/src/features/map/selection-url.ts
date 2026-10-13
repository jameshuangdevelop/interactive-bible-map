import type { MapDisplayMode, PlaceSelection } from "./types";

export type ViewTab = "map" | "routes";

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
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const value = parameters.get("route")?.trim();
  return value && value.length > 0 ? value : null;
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
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const value = parameters.get("stage")?.trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
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
