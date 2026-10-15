import { useEffect, useRef } from "react";

import { formatSourceCitation } from "../place-panel/source-format";
import type { PlaceIndexRecord } from "../map/types";
import { resolveRouteStop, stageLabelNumber } from "./routes-data";
import type { HydratedRoute, LoadedRoutesData, RouteStageRecord, RouteStopRecord, RouteStopResolved } from "./types";
import { tokens } from "../../theme/tokens";

type RoutesLoadState = "idle" | "loading" | "ready" | "error";

function formatApproximateYears(fromYear: number, toYear: number) {
  const start = fromYear < 0 ? `${Math.abs(fromYear)} BC` : `AD ${fromYear}`;
  const end = toYear < 0 ? `${Math.abs(toYear)} BC` : `AD ${toYear}`;
  return `About ${start} – ${end}`;
}

function formatStageCount(count: number) {
  return `${count} stage${count === 1 ? "" : "s"}`;
}

function SourcesDisclosure({
  sourceIds,
  bibliographyById,
  idPrefix,
  summaryLabel = "Show sources"
}: {
  sourceIds: string[];
  bibliographyById: LoadedRoutesData["bibliographyById"];
  idPrefix: string;
  summaryLabel?: string;
}) {
  return (
    <details style={{ marginTop: `${tokens.spacing.xs}px` }}>
      <summary style={{ cursor: "pointer", color: "#1A73E8" }}>{summaryLabel}</summary>
      {sourceIds.length > 0 ? (
        <ul data-route-sources-list="true" style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
          {sourceIds.map((sourceId, index) => {
            const citation = formatSourceCitation(sourceId, bibliographyById);
            return (
              <li key={`${idPrefix}:${sourceId}:${index}`}>
                {citation.url ? (
                  <a href={citation.url} rel="noreferrer noopener" target="_blank">
                    {citation.label}
                  </a>
                ) : (
                  citation.label
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p style={{ margin: `${tokens.spacing.xs}px 0 0`, color: tokens.color.textSecondary }}>
          No sources listed.
        </p>
      )}
    </details>
  );
}

function formatBorderYear(year: number) {
  return year < 0 ? `${Math.abs(year)} BC` : `AD ${year}`;
}

function formatReadableList(values: string[]) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

export function formatRouteTravelModeText(stage: Pick<RouteStageRecord, "travelMode" | "namedRegions">) {
  if (stage.travelMode === "land") {
    return "By land";
  }
  if (stage.travelMode === "sea") {
    return "By sea";
  }
  if (stage.namedRegions?.length) {
    return `Through ${stage.namedRegions.map((region) => region.name).join(", ")}`;
  }
  return "Path not known";
}

function stopCandidatesText(
  resolved: RouteStopResolved,
  placesById: Map<string, PlaceIndexRecord>
) {
  if (resolved.kind === "route-stop") {
    return (resolved.stop?.candidates ?? []).map((candidate) => candidate.label);
  }

  const place = placesById.get(resolved.id);
  if (!place) {
    return [];
  }
  return place.candidates.map((candidate) => candidate.label);
}

export function RoutesPanel({
  routesLoadState,
  routesData,
  hydratedRoutes,
  selectedRoute,
  selectedStageIndex,
  selectedRouteStop,
  selectedRouteBorderYear,
  placesById,
  routeStopsById,
  onRetryLoad,
  onSelectRoute,
  onSelectStage,
  onBackToAllRoutes,
  onRouteStopCardBack,
  onResolveStopSelection,
  onHighlightStage
}: {
  routesLoadState: RoutesLoadState;
  routesData: LoadedRoutesData | null;
  hydratedRoutes: HydratedRoute[];
  selectedRoute: HydratedRoute | null;
  selectedStageIndex: number | null;
  selectedRouteStop: RouteStopRecord | null;
  selectedRouteBorderYear: number | null;
  placesById: Map<string, PlaceIndexRecord>;
  routeStopsById: Map<string, RouteStopRecord>;
  onRetryLoad: () => void;
  onSelectRoute: (routeId: string) => void;
  onSelectStage: (stageIndex: number) => void;
  onBackToAllRoutes: () => void;
  onRouteStopCardBack: () => void;
  onResolveStopSelection: (resolved: RouteStopResolved, stageIndex: number) => void;
  onHighlightStage: (stageIndex: number | null) => void;
}) {
  const stageItemRefs = useRef(new Map<number, HTMLLIElement | null>());
  const suppressScrollStageIndexRef = useRef<number | null>(null);
  const previousSelectedStageIndexRef = useRef<number | null>(null);
  const bibliographyById = routesData?.bibliographyById ?? new Map();

  useEffect(() => {
    if (!selectedRoute || selectedStageIndex === null || selectedStageIndex < 0) {
      previousSelectedStageIndexRef.current = selectedStageIndex;
      return;
    }

    if (previousSelectedStageIndexRef.current === selectedStageIndex) {
      return;
    }

    const suppressScroll = suppressScrollStageIndexRef.current === selectedStageIndex;
    suppressScrollStageIndexRef.current = null;
    previousSelectedStageIndexRef.current = selectedStageIndex;
    if (suppressScroll) {
      return;
    }

    const stageItem = stageItemRefs.current.get(selectedStageIndex);
    if (!stageItem) {
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stageItem.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth"
    });
  }, [selectedRoute, selectedStageIndex]);

  if (routesLoadState === "loading" || routesLoadState === "idle") {
    return <p aria-live="polite">Loading routes…</p>;
  }

  if (routesLoadState === "error") {
    return (
      <div role="status">
        Routes couldn&apos;t load.{" "}
        <button
          onClick={onRetryLoad}
          style={{ border: "none", background: "none", color: "#1A73E8", textDecoration: "underline", cursor: "pointer", padding: 0 }}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  if (routesData && hydratedRoutes.length === 0) {
    return <p>No routes yet.</p>;
  }

  if (!selectedRoute) {
    return (
      <div>
        <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>Routes</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: `${tokens.spacing.sm}px 0 0` }}>
          {hydratedRoutes.map((entry) => (
            <li key={entry.route.id}>
              <button
                onClick={() => onSelectRoute(entry.route.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderRadius: "8px",
                  border: `1px solid ${tokens.color.divider}`,
                  background: "#FFFFFF",
                  padding: `${tokens.spacing.sm}px`,
                  marginBottom: `${tokens.spacing.sm}px`,
                  cursor: "pointer"
                }}
                type="button"
              >
                <div style={{ fontWeight: 600 }}>{entry.route.title}</div>
                <div style={{ color: tokens.color.textSecondary, marginTop: `${tokens.spacing.xs}px` }}>
                  {formatApproximateYears(entry.route.fromYear, entry.route.toYear)} · {formatStageCount(entry.stages.length)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const routeNotes = selectedRoute.route.notes.filter((note) => note.trim().length > 0);
  const stageDisputedNotes = selectedRoute.stages.flatMap((stage, stageIndex) => {
    if (stage.lineId) {
      return [];
    }

    const from = resolveRouteStop(stage.from, placesById, routeStopsById);
    const to = resolveRouteStop(stage.to, placesById, routeStopsById);
    const fromCandidates = stopCandidatesText(from, placesById);
    const toCandidates = stopCandidatesText(to, placesById);
    const candidateSites = [
      ...(fromCandidates.length > 1 ? [`${from.name}: ${fromCandidates.join(", ")}`] : []),
      ...(toCandidates.length > 1 ? [`${to.name}: ${toCandidates.join(", ")}`] : [])
    ];
    const routeStageLabel = stageLabelNumber(selectedRoute.route.structure, stageIndex);
    const stageName = `${from.name} → ${to.name}`;
    const reason = stage.noLineReason?.trim() || "Site disputed.";
    const candidatesSuffix = candidateSites.length > 0 ? ` Candidate sites: ${candidateSites.join("; ")}.` : "";
    return [`${routeStageLabel} (${stageName}): ${reason}${candidatesSuffix}`];
  });
  const allNotes = [...routeNotes, ...stageDisputedNotes];

  return (
    <div>
      <button
        onClick={onBackToAllRoutes}
        style={{ border: "none", background: "none", color: "#1A73E8", padding: 0, cursor: "pointer" }}
        type="button"
      >
        ‹ All routes
      </button>
      <h1 style={{ fontSize: `${tokens.typography.titleSize}px`, lineHeight: `${tokens.typography.titleLineHeight}px`, margin: `${tokens.spacing.sm}px 0 0` }}>
        {selectedRoute.route.title}
      </h1>
      <p style={{ margin: `${tokens.spacing.xs}px 0`, color: tokens.color.textSecondary }}>
        {formatApproximateYears(selectedRoute.route.fromYear, selectedRoute.route.toYear)}
      </p>
      <p style={{ margin: `${tokens.spacing.xs}px 0`, color: tokens.color.textSecondary }}>
        Borders as in {formatBorderYear(selectedRouteBorderYear ?? selectedRoute.route.fromYear)}
      </p>
      <p style={{ margin: `${tokens.spacing.sm}px 0`, color: tokens.color.textSecondary }}>
        {selectedRoute.route.summary}
      </p>
      <div style={{ margin: `${tokens.spacing.sm}px 0` }}>
        <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>What the Bible says</h2>
        <p style={{ margin: `${tokens.spacing.xs}px 0 0`, color: tokens.color.textSecondary }}>
          {selectedRoute.route.bibleText}
        </p>
      </div>
      {selectedRouteStop ? (
        <div style={{ border: `1px solid ${tokens.color.divider}`, borderRadius: "8px", padding: `${tokens.spacing.sm}px`, marginBottom: `${tokens.spacing.sm}px` }}>
          <button
            onClick={onRouteStopCardBack}
            style={{ border: "none", background: "none", color: "#1A73E8", padding: 0, cursor: "pointer" }}
            type="button"
          >
            ‹ Back to route
          </button>
          <strong style={{ display: "block", marginTop: `${tokens.spacing.xs}px` }}>{selectedRouteStop.name}</strong>
          {selectedRouteStop.todayName ? <p style={{ margin: `${tokens.spacing.xs}px 0 0` }}>Today: {selectedRouteStop.todayName}</p> : null}
          {selectedRouteStop.candidates.length > 1 ? (
            <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
              Candidate sites:
              <ul data-route-stop-candidates="true" style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px" }}>
                {selectedRouteStop.candidates.map((candidate) => (
                  <li key={`${selectedRouteStop.id}:${candidate.label}`}>{candidate.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {selectedRouteStop.scripture.length > 0 ? (
            <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
              Passages: {selectedRouteStop.scripture.map((entry) => entry.ref).join(", ")}
            </div>
          ) : null}
          <SourcesDisclosure
            bibliographyById={bibliographyById}
            idPrefix={`route-stop:${selectedRouteStop.id}`}
            sourceIds={selectedRouteStop.sources}
            summaryLabel="Sources"
          />
          <p style={{ margin: `${tokens.spacing.xs}px 0 0`, color: tokens.color.textSecondary }}>Not yet on the main map.</p>
        </div>
      ) : null}
      <ol style={{ paddingLeft: "20px", margin: `${tokens.spacing.sm}px 0 0` }}>
        {selectedRoute.stages.map((stage, stageIndex) => {
          const from = resolveRouteStop(stage.from, placesById, routeStopsById);
          const to = resolveRouteStop(stage.to, placesById, routeStopsById);
          const isActive = selectedStageIndex === stageIndex;
          const mentionedNames = (stage.mentioned ?? [])
            .map((mentioned) => resolveRouteStop(mentioned, placesById, routeStopsById).name)
            .filter((name, index, array) => array.indexOf(name) === index);
          const travelModeText = formatRouteTravelModeText(stage);
          const stageTypeLabel =
            selectedRoute.route.structure === "standalone-segments" ? "Segment" : "Stage";
          const stageAccessibleTravelText =
            travelModeText.length > 0
              ? `${travelModeText[0].toLowerCase()}${travelModeText.slice(1)}`
              : travelModeText;
          return (
            <li
              aria-current={isActive ? "true" : undefined}
              aria-label={`${stageTypeLabel} ${stageIndex + 1}: ${from.name} to ${to.name}, ${stageAccessibleTravelText}`}
              data-route-stage-selected={isActive ? "true" : "false"}
              data-route-stage-index={stageIndex + 1}
              key={stage.id}
              onClick={() => {
                suppressScrollStageIndexRef.current = stageIndex;
                onSelectStage(stageIndex);
              }}
              onBlur={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  return;
                }
                onHighlightStage(null);
              }}
              onFocus={() => onHighlightStage(stageIndex)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  suppressScrollStageIndexRef.current = stageIndex;
                  onSelectStage(stageIndex);
                }
              }}
              onMouseEnter={() => onHighlightStage(stageIndex)}
              onMouseLeave={() => onHighlightStage(null)}
              ref={(element) => {
                stageItemRefs.current.set(stageIndex, element);
              }}
              tabIndex={0}
              style={{
                marginBottom: `${tokens.spacing.sm}px`,
                borderRadius: "8px",
                border: `1px solid ${isActive ? tokens.color.accent : tokens.color.divider}`,
                padding: `${tokens.spacing.sm}px`
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {stageTypeLabel} {stageIndex + 1}{" "}
                ·{" "}
                <button
                  onClick={() => {
                    onSelectStage(stageIndex);
                    onResolveStopSelection(from, stageIndex);
                  }}
                  style={{ border: "none", background: "none", color: "#1A73E8", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  type="button"
                >
                  {from.name}
                </button>{" "}
                →{" "}
                <button
                  onClick={() => {
                    onSelectStage(stageIndex);
                    onResolveStopSelection(to, stageIndex);
                  }}
                  style={{ border: "none", background: "none", color: "#1A73E8", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                  type="button"
                >
                  {to.name}
                </button>
              </div>
              <div style={{ color: tokens.color.textSecondary, marginTop: `${tokens.spacing.xs}px` }}>
                {travelModeText}
              </div>
              {stage.via?.length ? (
                <div style={{ marginTop: `${tokens.spacing.xs}px`, color: tokens.color.textSecondary }}>
                  Passed: {stage.via.map((via) => resolveRouteStop(via, placesById, routeStopsById).name).join(", ")}
                </div>
              ) : null}
              {mentionedNames.length > 0 ? (
                <div style={{ marginTop: `${tokens.spacing.xs}px`, color: tokens.color.textSecondary }}>
                  Also named: {mentionedNames.join(", ")}
                </div>
              ) : null}
              {selectedRoute.route.structure === "standalone-segments" && stage.attestation ? (
                <div style={{ marginTop: `${tokens.spacing.xs}px`, color: tokens.color.textSecondary }}>
                  Told in {formatReadableList(stage.attestation.gospels)}
                </div>
              ) : null}
              {!stage.lineId ? (
                <div
                  style={{
                    marginTop: `${tokens.spacing.xs}px`,
                    display: "inline-block",
                    borderRadius: "999px",
                    border: `1px solid ${tokens.color.divider}`,
                    padding: "2px 8px",
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`
                  }}
                >
                  Site disputed
                </div>
              ) : null}
              <div style={{ marginTop: `${tokens.spacing.xs}px` }}>
                {stage.scripture.map((passage) => (
                  <details key={`${stage.id}:${passage.ref}`}>
                    <summary style={{ cursor: "pointer", color: "#1A73E8" }}>{passage.ref}</summary>
                    <p style={{ margin: `${tokens.spacing.xs}px 0 0`, fontFamily: tokens.typography.scriptureFont }}>{passage.textWEB}</p>
                  </details>
                ))}
              </div>
              <SourcesDisclosure
                bibliographyById={bibliographyById}
                idPrefix={`route-stage:${selectedRoute.route.id}:${stage.id}`}
                sourceIds={stage.sources}
                summaryLabel="Sources"
              />
            </li>
          );
        })}
      </ol>
      {allNotes.length > 0 ? (
        <div data-route-notes="true" style={{ marginTop: `${tokens.spacing.sm}px` }}>
          <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>Notes</h2>
          <ul style={{ margin: `${tokens.spacing.xs}px 0 0`, paddingLeft: "18px", color: tokens.color.textSecondary }}>
            {allNotes.map((note) => (
              <li key={`${selectedRoute.route.id}:${note}`}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div data-route-panel-sources="true" style={{ marginTop: `${tokens.spacing.sm}px` }}>
        <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>Sources</h2>
        <SourcesDisclosure
          bibliographyById={bibliographyById}
          idPrefix={`route:${selectedRoute.route.id}`}
          sourceIds={selectedRoute.route.sources}
          summaryLabel="Show sources"
        />
      </div>
    </div>
  );
}
