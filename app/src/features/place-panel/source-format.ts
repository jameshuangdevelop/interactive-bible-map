import type { BibliographyEntry } from "../map/types";

export interface SourceCitation {
  id: string;
  label: string;
  url: string | null;
}

function normalizeWikiTitle(value: string) {
  return value.trim().replace(/\s+/gu, "_");
}

function bibliographyLabel(entry: BibliographyEntry) {
  const authorLabel = entry.authors.join(", ");
  return `${authorLabel}, ${entry.title} (${entry.year})`;
}

export function formatSourceCitation(
  sourceId: string,
  bibliographyById: Map<string, BibliographyEntry>
): SourceCitation {
  const separatorIndex = sourceId.indexOf(":");
  if (separatorIndex < 0) {
    return {
      id: sourceId,
      label: sourceId,
      url: null
    };
  }

  const prefix = sourceId.slice(0, separatorIndex);
  const value = sourceId.slice(separatorIndex + 1);

  switch (prefix) {
    case "pleiades":
      return {
        id: sourceId,
        label: `Pleiades place ${value}`,
        url: `https://pleiades.stoa.org/places/${value}`
      };
    case "wikidata":
      return {
        id: sourceId,
        label: `Wikidata ${value}`,
        url: `https://www.wikidata.org/wiki/${value}`
      };
    case "dare":
      return {
        id: sourceId,
        label: `DARE ${value}`,
        url: `https://imperium.ahlfeldt.se/places/${value}`
      };
    case "openbible":
      return {
        id: sourceId,
        label: `OpenBible ${value}`,
        url: `https://www.openbible.info/geo/${value}`
      };
    case "osm":
      return {
        id: sourceId,
        label: `OpenStreetMap ${value}`,
        url: `https://www.openstreetmap.org/${value}`
      };
    case "naturalearth":
      return {
        id: sourceId,
        label: `Natural Earth ${value}`,
        url: "https://www.naturalearthdata.com/"
      };
    case "commons": {
      const normalized = normalizeWikiTitle(value);
      const escaped = encodeURIComponent(normalized).replace(/%3A/giu, ":");
      return {
        id: sourceId,
        label: `Wikimedia Commons ${value}`,
        url: `https://commons.wikimedia.org/wiki/${escaped}`
      };
    }
    case "orbis":
      return {
        id: sourceId,
        label: `ORBIS ${value}`,
        url: "https://orbis.stanford.edu/"
      };
    case "awmc":
      return {
        id: sourceId,
        label: `AWMC ${value}`,
        url: "https://github.com/AWMC/geodata"
      };
    case "wikipedia":
      return {
        id: sourceId,
        label: `Wikipedia ${value}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(normalizeWikiTitle(value))}`
      };
    case "perseus":
      return {
        id: sourceId,
        label: `Perseus ${value}`,
        url: `https://www.perseus.tufts.edu/hopper/searchresults?q=${encodeURIComponent(value)}`
      };
    case "scripture":
      return {
        id: sourceId,
        label: value,
        url: null
      };
    case "bib": {
      const entry = bibliographyById.get(value);
      if (!entry) {
        return {
          id: sourceId,
          label: `Bibliography ${value}`,
          url: null
        };
      }

      return {
        id: sourceId,
        label: bibliographyLabel(entry),
        url: entry.url ?? null
      };
    }
    default:
      return {
        id: sourceId,
        label: sourceId,
        url: null
      };
  }
}
