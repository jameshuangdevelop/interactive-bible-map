import type {
  AncientAreaAssignment,
  AncientHolderBorderFeature,
  AncientHolderLabelPoint,
  AncientStopCataloguePayload,
  AncientStopCompactPayload,
  AncientStopPayload
} from "./ancient-layer.types";

type CatalogueEntryType = "areas" | "holderBorders" | "holderLabels";

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
