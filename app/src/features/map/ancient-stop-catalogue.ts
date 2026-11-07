import type {
  AncientAreaAssignment,
  AncientHolderBorderFeature,
  AncientHolderLabelPoint,
  AncientStopCataloguePayload,
  AncientStopCompactPayload,
  AncientStopPayload
} from "./ancient-layer.types";

type CatalogueEntryType = "areas" | "holderBorders" | "holderLabels";
type AncientStopCatalogueFetch = (url: string, init?: RequestInit) => Promise<Response>;

function requireCatalogueArray<Entry>(
  value: Entry[] | undefined,
  entryType: CatalogueEntryType
): Entry[] {
  if (!Array.isArray(value)) {
    throw new Error(`Ancient stop catalogue is missing '${entryType}' array.`);
  }
  return value;
}

function requireStopIndexArray(
  value: number[] | undefined,
  entryType: CatalogueEntryType,
  stopId: string
) {
  if (!Array.isArray(value)) {
    throw new Error(`Stop '${stopId}' is missing '${entryType}' index array.`);
  }
  return value;
}

function stopCatalogueEntryAt<Entry>({
  entries,
  index,
  entryType,
  stopId
}: {
  entries: Entry[];
  index: number;
  entryType: CatalogueEntryType;
  stopId: string;
}) {
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) {
    throw new Error(`Stop '${stopId}' has invalid ${entryType} catalogue index '${index}'.`);
  }
  return entries[index];
}

export function expandAncientStopPayloadFromCatalogue(
  stopPayload: AncientStopCompactPayload,
  stopCatalogue: AncientStopCataloguePayload
): AncientStopPayload {
  // Keep this in sync with scripts/lib/ancient-app-data-builder.mjs:expandStopPayloadFromCatalogue.
  const stopId = typeof stopPayload.stopId === "string" && stopPayload.stopId.length > 0
    ? stopPayload.stopId
    : "unknown-stop";

  const catalogueAreas = requireCatalogueArray<AncientAreaAssignment>(stopCatalogue.areas, "areas");
  const catalogueHolderBorders = requireCatalogueArray<AncientHolderBorderFeature>(
    stopCatalogue.holderBorders,
    "holderBorders"
  );
  const catalogueHolderLabels = requireCatalogueArray<AncientHolderLabelPoint>(
    stopCatalogue.holderLabels,
    "holderLabels"
  );

  const areas = requireStopIndexArray(stopPayload.areas, "areas", stopId).map((index) => stopCatalogueEntryAt({
    entries: catalogueAreas,
    index,
    entryType: "areas",
    stopId
  }));
  const holderBorderFeatures = requireStopIndexArray(stopPayload.holderBorders, "holderBorders", stopId).map(
    (index) => stopCatalogueEntryAt({
      entries: catalogueHolderBorders,
      index,
      entryType: "holderBorders",
      stopId
    })
  );
  const holderLabels = requireStopIndexArray(stopPayload.holderLabels, "holderLabels", stopId).map((index) => stopCatalogueEntryAt({
    entries: catalogueHolderLabels,
    index,
    entryType: "holderLabels",
    stopId
  }));

  return {
    ...stopPayload,
    areas,
    holderBorders: {
      type: "FeatureCollection",
      features: holderBorderFeatures
    },
    holderLabels
  };
}

export function createAncientStopCatalogueLoader(fetchCatalogue: AncientStopCatalogueFetch) {
  let stopCataloguePayload: AncientStopCataloguePayload | null = null;
  let stopCataloguePromise: Promise<AncientStopCataloguePayload> | null = null;

  return async function loadAncientStopCatalogue(): Promise<AncientStopCataloguePayload> {
    if (stopCataloguePayload) {
      return stopCataloguePayload;
    }

    if (stopCataloguePromise) {
      return stopCataloguePromise;
    }

    stopCataloguePromise = fetchCatalogue("/generated/ancient.stop-catalogue.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ancient stop catalogue (${response.status})`);
        }
        const payload = (await response.json()) as AncientStopCataloguePayload;
        stopCataloguePayload = payload;
        return payload;
      })
      .catch((error) => {
        stopCataloguePromise = null;
        throw error;
      });

    return stopCataloguePromise;
  };
}

export const loadAncientStopCatalogue = createAncientStopCatalogueLoader((url, init) => fetch(url, init));
