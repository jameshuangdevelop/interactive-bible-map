import { useEffect, useMemo, useRef, useState } from "react";

import { formatSourceCitation } from "../place-panel/source-format";
import type { PlaceIndexRecord } from "../map/types";
import { resolveRouteStop, stageLabelNumber } from "./routes-data";
import type {
  HydratedRoute,
  LoadedRoutesData,
  RouteStageRecord,
  RouteStopRecord,
  RouteStopResolved
} from "./types";
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
  selectedRouteBorderYear,
  placesById,
  routeStopsById,
  onRetryLoad,
  onSelectRoute,
  onSelectStage,
  onBackToAllRoutes,
  onResolveStopSelection,
  onHighlightStage,
  routeToRevealOnList = null
}: {
  routesLoadState: RoutesLoadState;
  routesData: LoadedRoutesData | null;
  hydratedRoutes: HydratedRoute[];
  selectedRoute: HydratedRoute | null;
  selectedStageIndex: number | null;
  selectedRouteBorderYear: number | null;
  placesById: Map<string, PlaceIndexRecord>;
  routeStopsById: Map<string, RouteStopRecord>;
  onRetryLoad: () => void;
  onSelectRoute: (routeId: string) => void;
  onSelectStage: (stageIndex: number) => void;
  onBackToAllRoutes: () => void;
  onResolveStopSelection: (resolved: RouteStopResolved, stageIndex: number) => void;
  onHighlightStage: (stageIndex: number | null) => void;
  routeToRevealOnList?: string | null;
}) {
  const stageItemRefs = useRef(new Map<number, HTMLLIElement | null>());
  const suppressScrollStageIndexRef = useRef<number | null>(null);
  const previousSelectedStageIndexRef = useRef<number | null>(null);
  const bibliographyById = routesData?.bibliographyById ?? new Map();
  const [openRouteGroups, setOpenRouteGroups] = useState<Record<string, boolean>>({});

  const groupedRoutes = useMemo(
    () =>
      [
        {
          id: "jesus",
          heading: "Jesus' journeys",
          routes: hydratedRoutes.filter((entry) => entry.route.id.startsWith("jesus-"))
        },
        {
          id: "paul",
          heading: "Paul's journeys",
          routes: hydratedRoutes.filter((entry) => entry.route.id.startsWith("paul-"))
        },
        {
          id: "other",
          heading: "Other routes",
          routes: hydratedRoutes.filter(
            (entry) => !entry.route.id.startsWith("paul-") && !entry.route.id.startsWith("jesus-")
          )
        }
      ].filter((group) => group.routes.length > 0),
    [hydratedRoutes]
  );
  const routeGroupIdByRouteId = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groupedRoutes) {
      for (const entry of group.routes) {
        map.set(entry.route.id, group.id);
      }
    }
    return map;
  }, [groupedRoutes]);
  const revealGroupId =
    !selectedRoute && routeToRevealOnList ? routeGroupIdByRouteId.get(routeToRevealOnList) ?? null : null;

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
    const routesList = (entries: HydratedRoute[]) => (
      <ul style={{ listStyle: "none", padding: 0, margin: `${tokens.spacing.sm}px 0 0` }}>
        {entries.map((entry) => (
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
    );

    return (
      <div>
        <h2 style={{ margin: 0, fontSize: `${tokens.typography.sectionHeadingSize}px` }}>Routes</h2>
        {groupedRoutes.map((group) => (
          <section key={group.id} style={{ marginTop: `${tokens.spacing.sm}px` }}>
            {(() => {
              const groupButtonId = `route-group-button-${group.id}`;
              const groupPanelId = `route-group-panel-${group.id}`;
              const groupOpen = openRouteGroups[group.id] ?? (revealGroupId === group.id);
              return (
                <>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: `${tokens.typography.captionSize}px`,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      color: tokens.color.textSecondary
                    }}
                  >
                    <button
                      aria-controls={groupPanelId}
                      aria-expanded={groupOpen}
                      data-route-group-button={group.id}
                      id={groupButtonId}
                      onClick={() =>
                        setOpenRouteGroups((current) => {
                          const currentOpen = current[group.id] ?? (revealGroupId === group.id);
                          return {
                            ...current,
                            [group.id]: !currentOpen
                          };
                        })
                      }
                      style={{
                        width: "100%",
                        minHeight: "44px",
                        border: `1px solid ${tokens.color.divider}`,
                        borderRadius: "10px",
                        padding: `${tokens.spacing.sm}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#FFFFFF",
                        color: tokens.color.textSecondary,
                        cursor: "pointer",
                        fontSize: "inherit",
                        letterSpacing: "inherit",
                        textTransform: "inherit",
                        fontWeight: 600,
                        textAlign: "left",
                        outlineOffset: "2px"
                      }}
                      type="button"
                    >
                      <span>{`${group.heading} · ${group.routes.length}`}</span>
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-block",
                          transform: groupOpen ? "rotate(180deg)" : "rotate(0deg)",
                          fontSize: "12px"
                        }}
                      >
                        ▼
                      </span>
                    </button>
                  </h3>
                  <div
                    aria-labelledby={groupButtonId}
                    hidden={!groupOpen}
                    id={groupPanelId}
                    role="region"
                  >
                    {routesList(group.routes)}
                  </div>
                </>
              );
            })()}
          </section>
        ))}
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
      <ol
        onMouseLeave={() => onHighlightStage(null)}
        style={{ paddingLeft: "20px", margin: `${tokens.spacing.sm}px 0 0` }}
      >
        {selectedRoute.stages.map((stage, stageIndex) => {
          const from = resolveRouteStop(stage.from, placesById, routeStopsById);
          const to = resolveRouteStop(stage.to, placesById, routeStopsById);
          const isActive = selectedStageIndex === stageIndex;
          const viaStops = (stage.via ?? []).map((via) => resolveRouteStop(via, placesById, routeStopsById));
          const mentionedStops = (stage.mentioned ?? [])
            .map((mentioned) => resolveRouteStop(mentioned, placesById, routeStopsById))
            .filter((resolved, index, array) =>
              array.findIndex((candidate) => candidate.kind === resolved.kind && candidate.id === resolved.id) === index
            );
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
              onMouseMove={() => onHighlightStage(stageIndex)}
              onMouseOver={() => onHighlightStage(stageIndex)}
              onMouseOut={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  return;
                }
                const nextElement = event.relatedTarget as Element | null;
                if (nextElement?.closest("li[data-route-stage-index]")) {
                  return;
                }
                onHighlightStage(null);
              }}
              onPointerEnter={() => onHighlightStage(stageIndex)}
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
                  onClick={(event) => {
                    event.stopPropagation();
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
                  onClick={(event) => {
                    event.stopPropagation();
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
              {viaStops.length > 0 ? (
                <div style={{ marginTop: `${tokens.spacing.xs}px`, color: tokens.color.textSecondary }}>
                  Passed:{" "}
                  {viaStops.map((viaStop, index) => (
                    <span key={`${stage.id}:via:${viaStop.kind}:${viaStop.id}`}>
                      {index > 0 ? ", " : null}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectStage(stageIndex);
                          onResolveStopSelection(viaStop, stageIndex);
                        }}
                        style={{ border: "none", background: "none", color: "#1A73E8", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                        type="button"
                      >
                        {viaStop.name}
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              {mentionedStops.length > 0 ? (
                <div style={{ marginTop: `${tokens.spacing.xs}px`, color: tokens.color.textSecondary }}>
                  Also named:{" "}
                  {mentionedStops.map((mentionedStop, index) => (
                    <span key={`${stage.id}:mentioned:${mentionedStop.kind}:${mentionedStop.id}`}>
                      {index > 0 ? ", " : null}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectStage(stageIndex);
                          onResolveStopSelection(mentionedStop, stageIndex);
                        }}
                        style={{ border: "none", background: "none", color: "#1A73E8", cursor: "pointer", padding: 0, textDecoration: "underline" }}
                        type="button"
                      >
                        {mentionedStop.name}
                      </button>
                    </span>
                  ))}
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
