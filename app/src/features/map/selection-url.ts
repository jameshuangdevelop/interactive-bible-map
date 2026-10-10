import type { MapDisplayMode, PlaceSelection } from "./types";

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
