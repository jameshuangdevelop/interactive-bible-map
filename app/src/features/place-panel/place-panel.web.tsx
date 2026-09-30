import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { candidateIndexToLetter, getPrimaryPlaceName } from "../map/place-visibility";
import type {
  Confidence,
  MediaImageRecord,
  PlaceDetailsPayload,
  PlaceIndexRecord,
  PlaceRecord,
  PlaceSelection,
  SourceId
} from "../map/types";
import {
  buildAlsoKnownAs,
  buildHierarchyItems,
  collectSourceIdsInPanelOrder,
  confidenceLabel,
  groupScriptureByBook,
  isDisputedRecord,
  sortScriptureByCanonicalOrder
} from "./panel-model";
import { formatSourceCitation } from "./source-format";
import { tokens } from "../../theme/tokens";

const PANEL_SECTION_GAP = tokens.spacing.lg;
const SCRIPTURE_INITIAL_COUNT = 5;
const SCRIPTURE_CHUNK_SIZE = 24;
const SOURCE_SECTION_ANCHOR_ID = "place-panel-sources";

interface PlacePanelProps {
  selectedPlace: PlaceIndexRecord;
  selection: PlaceSelection;
  placeDetails: PlaceDetailsPayload | null;
  isLoading: boolean;
  loadErrorMessage: string | null;
  places: PlaceIndexRecord[];
  placesById: Map<string, PlaceIndexRecord>;
  isSmallScreen: boolean;
  isSmallScreenExpanded: boolean;
  onToggleSmallScreenExpanded: () => void;
  onClose: () => void;
  onSelectPlace: (selection: PlaceSelection) => void;
  onSelectCandidate: (candidateIndex: number) => void;
  onZoomTo: () => void;
  onCopyLink: () => void | Promise<void>;
}

function typeChipStyle(confidence: Confidence) {
  if (confidence === "high") {
    return {
      color: tokens.color.confidenceHighText,
      backgroundColor: tokens.color.confidenceHighBackground
    };
  }
  if (confidence === "medium") {
    return {
      color: tokens.color.confidenceMediumText,
      backgroundColor: tokens.color.confidenceMediumBackground
    };
  }
  if (confidence === "disputed") {
    return {
      color: tokens.color.confidenceDisputedText,
      backgroundColor: tokens.color.confidenceDisputedBackground
    };
  }
  return {
    color: tokens.color.confidenceLowText,
    backgroundColor: tokens.color.confidenceLowBackground
  };
}

function WikimediaImage({
  image,
  thumbnailWidth,
  failed,
  onError
}: {
  image: MediaImageRecord;
  thumbnailWidth: number;
  failed: boolean;
  onError: () => void;
}) {
  const imageUrl = commonsThumbnailUrl(image.url, thumbnailWidth);

  return (
    <div>
      <div
        style={{
          width: "100%",
          aspectRatio: "17 / 10",
          backgroundColor: tokens.color.subtleSurface,
          borderRadius: `${tokens.radius.panel}px`,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {failed ? (
          <span
            style={{
              color: tokens.color.textSecondary,
              fontSize: `${tokens.typography.bodySize}px`
            }}
          >
            Image unavailable
          </span>
        ) : (
          <img
            alt={image.caption}
            onError={onError}
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        )}
        {image.aiGenerated ? (
          <span
            style={{
              position: "absolute",
              top: `${tokens.spacing.sm}px`,
              left: `${tokens.spacing.sm}px`,
              borderRadius: "999px",
              padding: "4px 8px",
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "#FFFFFF",
              fontSize: `${tokens.typography.captionSize}px`,
              lineHeight: `${tokens.typography.captionLineHeight}px`
            }}
          >
            AI-generated reconstruction
          </span>
        ) : null}
      </div>
      <p
        data-photo-credit="true"
        style={{
          marginTop: `${tokens.spacing.sm}px`,
          marginBottom: 0,
          color: tokens.color.textSecondary,
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`
        }}
      >
        Photo: {image.author} ·{" "}
        <a href={image.licenseUrl} rel="noreferrer" target="_blank">
          {image.license}
        </a>{" "}
        ·{" "}
        <a href={image.sourcePage} rel="noreferrer" target="_blank">
          Wikimedia Commons
        </a>
      </p>
      <p
        style={{
          marginTop: `${tokens.spacing.xs}px`,
          marginBottom: 0,
          color: tokens.color.textSecondary,
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`
        }}
      >
        {image.caption}
      </p>
    </div>
  );
}

function sourceMarkersFor(
  sources: SourceId[],
  sourceOrdinalById: Map<SourceId, number>
) {
  return sources
    .map((sourceId) => sourceOrdinalById.get(sourceId))
    .filter((value): value is number => typeof value === "number");
}

function SourceMarkers({
  sources,
  sourceOrdinalById
}: {
  sources: SourceId[];
  sourceOrdinalById: Map<SourceId, number>;
}) {
  const ordinals = sourceMarkersFor(sources, sourceOrdinalById);
  if (ordinals.length === 0) {
    return null;
  }

  return (
    <span style={{ marginLeft: "4px" }}>
      {ordinals.map((ordinal) => (
        <a
          href={`#source-${ordinal}`}
          key={ordinal}
          style={{
            color: tokens.color.accent,
            textDecoration: "none",
            marginRight: "4px",
            fontSize: `${tokens.typography.captionSize}px`
          }}
        >
          [{ordinal}]
        </a>
      ))}
    </span>
  );
}

function LinkLikeButton({
  label,
  placeId,
  onSelectPlace
}: {
  label: string;
  placeId: string;
  onSelectPlace: (selection: PlaceSelection) => void;
}) {
  return (
    <button
      onClick={() => onSelectPlace({ placeId, candidateIndex: null })}
      style={{
        color: tokens.color.accent,
        background: "transparent",
        border: "none",
        padding: 0,
        font: "inherit",
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: "2px"
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function commonsThumbnailUrl(originalUrl: string, width: number) {
  const safeWidth = Math.max(256, Math.min(1200, width));

  try {
    const parsed = new URL(originalUrl);
    parsed.search = "";
    const commonsPrefix = "/wikipedia/commons/";
    if (!parsed.pathname.startsWith(commonsPrefix)) {
      return parsed.toString();
    }

    if (parsed.pathname.startsWith("/wikipedia/commons/thumb/")) {
      return parsed.toString();
    }

    const relativePath = parsed.pathname.slice(commonsPrefix.length);
    const segments = relativePath.split("/");
    const fileName = segments[segments.length - 1];
    if (!fileName || segments.length < 3) {
      return parsed.toString();
    }

    parsed.pathname = `${commonsPrefix}thumb/${relativePath}/${safeWidth}px-${fileName}`;
    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

function SkeletonPanelBody() {
  const block = (width: string, key: string) => (
    <div
      key={key}
      style={{
        width,
        height: "12px",
        borderRadius: "999px",
        backgroundColor: "#E8EAED",
        marginBottom: `${tokens.spacing.sm}px`
      }}
    />
  );

  return (
    <div aria-hidden="true">
      <div
        style={{
          width: "100%",
          aspectRatio: "17 / 10",
          borderRadius: `${tokens.radius.panel}px`,
          backgroundColor: "#E8EAED",
          marginBottom: `${tokens.spacing.md}px`
        }}
      />
      {block("46%", "a")}
      {block("78%", "b")}
      {block("64%", "c")}
      <div
        style={{
          marginTop: `${tokens.spacing.md}px`,
          marginBottom: `${tokens.spacing.md}px`,
          display: "flex",
          gap: `${tokens.spacing.sm}px`
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#E8EAED"
          }}
        />
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#E8EAED"
          }}
        />
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#E8EAED"
          }}
        />
      </div>
      <hr
        style={{
          border: "none",
          borderTop: `1px solid ${tokens.color.divider}`,
          margin: `${tokens.spacing.md}px 0`
        }}
      />
      {block("92%", "d")}
      {block("88%", "e")}
      {block("54%", "f")}
      <hr
        style={{
          border: "none",
          borderTop: `1px solid ${tokens.color.divider}`,
          margin: `${tokens.spacing.md}px 0`
        }}
      />
      {block("82%", "g")}
      {block("90%", "h")}
      {block("74%", "i")}
    </div>
  );
}

export function PlacePanel({
  selectedPlace,
  selection,
  placeDetails,
  isLoading,
  loadErrorMessage,
  places,
  placesById,
  isSmallScreen,
  isSmallScreenExpanded,
  onToggleSmallScreenExpanded,
  onClose,
  onSelectPlace,
  onSelectCandidate,
  onZoomTo,
  onCopyLink
}: PlacePanelProps) {
  const sourceSectionRef = useRef<HTMLElement | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const [expandedCandidateSupport, setExpandedCandidateSupport] = useState<Record<number, true>>({});
  const [showAllScripture, setShowAllScripture] = useState(false);
  const [visibleScriptureCount, setVisibleScriptureCount] = useState(SCRIPTURE_INITIAL_COUNT);

  const location = placeDetails?.location ?? null;
  const images = placeDetails?.media?.images ?? [];
  const bibliographyById = useMemo(
    () => new Map((placeDetails?.bibliography ?? []).map((entry) => [entry.id, entry] as const)),
    [placeDetails?.bibliography]
  );

  const placeForDisplay: PlaceIndexRecord | PlaceRecord = location ?? selectedPlace;
  const hasMultipleCandidates = placeForDisplay.candidates.length > 1;
  const isDisputed = isDisputedRecord(placeForDisplay);
  const childPlaces = useMemo(
    () =>
      places
        .filter((candidate) => candidate.parentId === selectedPlace.id)
        .sort((left, right) =>
          getPrimaryPlaceName(left).localeCompare(getPrimaryPlaceName(right))
        ),
    [places, selectedPlace.id]
  );

  const hierarchyItems = useMemo(
    () => buildHierarchyItems(selectedPlace, placesById),
    [placesById, selectedPlace]
  );

  const sourceIds = useMemo(
    () => (location ? collectSourceIdsInPanelOrder(location) : []),
    [location]
  );
  const sourceCitations = useMemo(
    () =>
      sourceIds.map((sourceId) => formatSourceCitation(sourceId, bibliographyById)),
    [bibliographyById, sourceIds]
  );
  const sourceOrdinalById = useMemo(() => {
    const map = new Map<SourceId, number>();
    sourceIds.forEach((sourceId, index) => {
      map.set(sourceId, index + 1);
    });
    return map;
  }, [sourceIds]);

  const sortedScripture = useMemo(
    () => (location ? sortScriptureByCanonicalOrder(location.scripture) : []),
    [location]
  );

  useEffect(() => {
    if (!showAllScripture || visibleScriptureCount >= sortedScripture.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setVisibleScriptureCount((currentCount) =>
        Math.min(sortedScripture.length, currentCount + SCRIPTURE_CHUNK_SIZE)
      );
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showAllScripture, sortedScripture.length, visibleScriptureCount]);

  const visibleScripture = sortedScripture.slice(0, visibleScriptureCount);
  const groupedScripture = groupScriptureByBook(visibleScripture);

  const imageWidth = isSmallScreen
    ? Math.max(
        360,
        Math.min(900, (typeof window === "undefined" ? 600 : window.innerWidth) * 2)
      )
    : 816;
  const selectedImage = images[activeImageIndex] ?? null;
  const alsoKnownAs = buildAlsoKnownAs(placeForDisplay.names);
  const modernName = placeForDisplay.names.modern;
  const titleName = getPrimaryPlaceName(placeForDisplay);

  const confidenceRow = (() => {
    if (hasMultipleCandidates && isDisputed) {
      return (
        <div
          data-disputed-banner="true"
          style={{
            borderRadius: `${tokens.radius.panel}px`,
            backgroundColor: tokens.color.confidenceDisputedBackground,
            color: tokens.color.confidenceDisputedText,
            padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
            fontWeight: 500,
            fontSize: `${tokens.typography.bodySize}px`
          }}
        >
          Location disputed · {placeForDisplay.candidates.length} proposed{" "}
          {placeForDisplay.candidates.length === 1 ? "site" : "sites"}
        </div>
      );
    }

    if (hasMultipleCandidates) {
      return (
        <p
          style={{
            marginTop: `${tokens.spacing.sm}px`,
            marginBottom: 0,
            color: tokens.color.textSecondary
          }}
        >
          {placeForDisplay.candidates.length} sites
        </p>
      );
    }

    const candidate = placeForDisplay.candidates[0];
    if (!candidate) {
      return null;
    }

    const chip = typeChipStyle(candidate.confidence);
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          marginTop: `${tokens.spacing.sm}px`,
          borderRadius: "999px",
          padding: "4px 10px",
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`,
          fontWeight: 600,
          color: chip.color,
          backgroundColor: chip.backgroundColor
        }}
      >
        {confidenceLabel(candidate.confidence, true)}
      </span>
    );
  })();

  const onScrollToSources = () => {
    sourceSectionRef.current?.scrollIntoView({
      behavior:
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      block: "start"
    });
  };

  if (isLoading && !location) {
    return (
      <div>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: `${tokens.spacing.md}px`
          }}
        >
          {isSmallScreen ? (
            <button
              aria-label={
                isSmallScreenExpanded ? "Collapse place details panel" : "Expand place details panel"
              }
              onClick={onToggleSmallScreenExpanded}
              style={{
                width: "44px",
                height: "6px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: tokens.color.divider,
                cursor: "pointer",
                alignSelf: "center"
              }}
              type="button"
            />
          ) : (
            <span />
          )}
          <button
            aria-label="Close place panel"
            onClick={onClose}
            style={closeButtonStyle}
            type="button"
          >
            ×
          </button>
        </header>
        <h1
          style={{
            margin: 0,
            color: tokens.color.textPrimary,
            fontSize: `${tokens.typography.titleSize}px`,
            lineHeight: `${tokens.typography.titleLineHeight}px`,
            fontWeight: 600
          }}
        >
          {titleName}
        </h1>
        <p
          style={{
            marginTop: `${tokens.spacing.sm}px`,
            marginBottom: `${tokens.spacing.md}px`,
            color: tokens.color.textSecondary
          }}
        >
          Loading details…
        </p>
        <SkeletonPanelBody />
      </div>
    );
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: `${tokens.spacing.md}px`
        }}
      >
        {isSmallScreen ? (
          <button
            aria-label={
              isSmallScreenExpanded ? "Collapse place details panel" : "Expand place details panel"
            }
            onClick={onToggleSmallScreenExpanded}
            style={{
              width: "44px",
              height: "6px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: tokens.color.divider,
              cursor: "pointer"
            }}
            type="button"
          />
        ) : (
          <span />
        )}
        <button
          aria-label="Close place panel"
          onClick={onClose}
          style={closeButtonStyle}
          type="button"
        >
          ×
        </button>
      </header>

      <div style={{ display: "grid", gap: `${PANEL_SECTION_GAP}px` }}>
        {selectedImage ? (
          <section data-panel-section="photos">
            <div style={{ position: "relative" }}>
              <WikimediaImage
                failed={Boolean(failedImages[selectedImage.id])}
                image={selectedImage}
                onError={() =>
                  setFailedImages((current) => ({
                    ...current,
                    [selectedImage.id]: true
                  }))
                }
                thumbnailWidth={imageWidth}
              />
              {images.length > 1 ? (
                <>
                  <button
                    aria-label="Previous photo"
                    onClick={() =>
                      setActiveImageIndex(
                        (currentIndex) =>
                          (currentIndex - 1 + images.length) % images.length
                      )
                    }
                    style={carouselButtonStyle("left")}
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next photo"
                    onClick={() =>
                      setActiveImageIndex((currentIndex) => (currentIndex + 1) % images.length)
                    }
                    style={carouselButtonStyle("right")}
                    type="button"
                  >
                    ›
                  </button>
                  <span
                    style={{
                      position: "absolute",
                      bottom: `${tokens.spacing.sm}px`,
                      right: `${tokens.spacing.sm}px`,
                      backgroundColor: "rgba(32,33,36,0.76)",
                      color: "#FFFFFF",
                      borderRadius: "999px",
                      padding: "2px 8px",
                      fontSize: `${tokens.typography.captionSize}px`
                    }}
                  >
                    {activeImageIndex + 1} / {images.length}
                  </span>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <section data-panel-section="names">
          <h1
            style={{
              margin: 0,
              color: tokens.color.textPrimary,
              fontSize: `${tokens.typography.titleSize}px`,
              lineHeight: `${tokens.typography.titleLineHeight}px`,
              fontWeight: 600
            }}
          >
            {titleName}
          </h1>
          {!isDisputed && modernName ? (
            <p data-modern-name-line="true" style={secondaryTextStyle}>
              Today: {modernName}
            </p>
          ) : null}
          {alsoKnownAs.length > 0 ? (
            <p style={secondaryTextStyle}>Also known as {alsoKnownAs.join(", ")}</p>
          ) : null}
          <p style={secondaryTextStyle}>
            {hierarchyItems.map((item, index) => (
              <span key={`${item.label}:${item.placeId ?? "none"}`}>
                {index > 0 ? " · " : null}
                {item.placeId ? (
                  <LinkLikeButton
                    label={item.label}
                    onSelectPlace={onSelectPlace}
                    placeId={item.placeId}
                  />
                ) : (
                  item.label
                )}
              </span>
            ))}
          </p>
          {confidenceRow}
        </section>

        {location && hasMultipleCandidates ? (
          <section data-panel-section="candidates">
            <hr style={sectionDividerStyle} />
            <h2 style={sectionHeadingStyle}>
              {isDisputed ? "Proposed sites" : "Sites"}
            </h2>
            <div style={{ display: "grid", gap: `${tokens.spacing.sm}px` }}>
              {location.candidates.map((candidate, candidateIndex) => {
                const selected = selection.candidateIndex === candidateIndex;
                const chip = typeChipStyle(candidate.confidence);
                const expanded = Boolean(expandedCandidateSupport[candidateIndex]);
                const support = candidate.support;
                const supportCanExpand = support.length > 170;
                const letter = candidateIndexToLetter(candidateIndex);

                return (
                  <button
                    aria-label={`Candidate ${letter}: ${candidate.label}`}
                    key={`${candidate.label}:${candidateIndex}`}
                    onClick={() => onSelectCandidate(candidateIndex)}
                    style={{
                      border: selected
                        ? `1px solid ${tokens.color.accent}`
                        : `1px solid ${tokens.color.divider}`,
                      borderRadius: `${tokens.radius.panel}px`,
                      backgroundColor: selected ? "#E8F0FE" : tokens.color.surface,
                      textAlign: "left",
                      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                      cursor: "pointer"
                    }}
                    type="button"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: `${tokens.spacing.sm}px`
                      }}
                    >
                      <strong style={{ color: tokens.color.textPrimary }}>
                        {letter}. {candidate.label}
                      </strong>
                      <span
                        style={{
                          borderRadius: "999px",
                          padding: "2px 8px",
                          fontSize: `${tokens.typography.captionSize}px`,
                          lineHeight: `${tokens.typography.captionLineHeight}px`,
                          fontWeight: 600,
                          color: chip.color,
                          backgroundColor: chip.backgroundColor
                        }}
                      >
                        {confidenceLabel(candidate.confidence, false)}
                      </span>
                    </div>
                    <p
                      style={{
                        marginTop: `${tokens.spacing.sm}px`,
                        marginBottom: `${tokens.spacing.xs}px`,
                        color: tokens.color.textSecondary,
                        fontSize: `${tokens.typography.bodySize}px`,
                        lineHeight: `${tokens.typography.bodyLineHeight}px`,
                        ...(expanded
                          ? {}
                          : {
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden"
                            })
                      }}
                    >
                      {support}
                      <SourceMarkers
                        sourceOrdinalById={sourceOrdinalById}
                        sources={candidate.sources}
                      />
                    </p>
                    {supportCanExpand ? (
                      <span
                        style={{
                          color: tokens.color.accent,
                          fontSize: `${tokens.typography.captionSize}px`,
                          lineHeight: `${tokens.typography.captionLineHeight}px`,
                          textDecoration: "underline",
                          textUnderlineOffset: "2px"
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setExpandedCandidateSupport((current) => {
                            if (current[candidateIndex]) {
                              const { [candidateIndex]: _removed, ...rest } = current;
                              return rest;
                            }
                            return {
                              ...current,
                              [candidateIndex]: true
                            };
                          });
                        }}
                      >
                        {expanded ? "Show less" : "Show more"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section data-panel-section="actions">
          <hr style={sectionDividerStyle} />
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: `${tokens.spacing.md}px`
            }}
          >
            <ActionIconButton
              icon="◉"
              label={hasMultipleCandidates ? "Fit all sites" : "Zoom to"}
              onPress={onZoomTo}
            />
            <ActionIconButton icon="🔗" label="Copy link" onPress={onCopyLink} />
            <ActionIconButton
              disabled={sourceCitations.length === 0}
              icon="≡"
              label="Sources"
              onPress={onScrollToSources}
            />
          </div>
        </section>

        {location ? (
          <>
            <section data-panel-section="about">
              <hr style={sectionDividerStyle} />
              <h2 style={sectionHeadingStyle}>About</h2>
              <p style={bodyTextStyle}>
                {location.summary.text}
                <SourceMarkers
                  sourceOrdinalById={sourceOrdinalById}
                  sources={location.summary.sources}
                />
              </p>
              {location.history.map((entry, index) => (
                <p key={`${entry.text}:${index}`} style={bodyTextStyle}>
                  {entry.text}
                  <SourceMarkers
                    sourceOrdinalById={sourceOrdinalById}
                    sources={entry.sources}
                  />
                </p>
              ))}
            </section>

            {sortedScripture.length > 0 ? (
              <section data-panel-section="in-bible">
                <hr style={sectionDividerStyle} />
                <h2 style={sectionHeadingStyle}>
                  In the Bible · {sortedScripture.length}{" "}
                  {sortedScripture.length === 1 ? "passage" : "passages"}
                </h2>
                {groupedScripture.map((group) => (
                  <div key={group.book} style={{ marginBottom: `${tokens.spacing.md}px` }}>
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: `${tokens.spacing.sm}px`,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: tokens.color.textSecondary,
                        fontSize: `${tokens.typography.captionSize}px`,
                        lineHeight: `${tokens.typography.captionLineHeight}px`,
                        fontWeight: 600
                      }}
                    >
                      {group.book}
                    </h3>
                    {group.passages.map((passage) => (
                      <article
                        key={passage.ref}
                        style={{
                          marginBottom: `${tokens.spacing.sm}px`
                        }}
                      >
                        <p
                          style={{
                            marginTop: 0,
                            marginBottom: "2px",
                            color: tokens.color.textPrimary,
                            fontSize: `${tokens.typography.bodySize}px`,
                            lineHeight: `${tokens.typography.bodyLineHeight}px`,
                            fontWeight: 700
                          }}
                        >
                          {passage.ref}
                        </p>
                        <p
                          style={{
                            marginTop: 0,
                            marginBottom: 0,
                            color: tokens.color.textPrimary,
                            fontSize: `${tokens.typography.scriptureSize}px`,
                            lineHeight: `${tokens.typography.scriptureLineHeight}px`,
                            fontFamily: tokens.typography.scriptureFont
                          }}
                        >
                          {passage.textWEB}
                        </p>
                      </article>
                    ))}
                  </div>
                ))}
                {!showAllScripture && sortedScripture.length > SCRIPTURE_INITIAL_COUNT ? (
                  <button
                    data-show-all-passages="true"
                    onClick={() => setShowAllScripture(true)}
                    style={textActionStyle}
                    type="button"
                  >
                    Show all {sortedScripture.length} passages
                  </button>
                ) : null}
                {showAllScripture && visibleScriptureCount < sortedScripture.length ? (
                  <p style={secondaryTextStyle}>Loading more passages…</p>
                ) : null}
              </section>
            ) : null}

            {location.otConnections.length > 0 ? (
              <section data-panel-section="ot-connections">
                <hr style={sectionDividerStyle} />
                <h2 style={sectionHeadingStyle}>
                  Old Testament connections · {location.otConnections.length}
                </h2>
                {location.otConnections.map((connection) => (
                  <p key={`${connection.ref}:${connection.note}`} style={bodyTextStyle}>
                    <strong>{connection.ref}</strong> — {connection.note}
                    <SourceMarkers
                      sourceOrdinalById={sourceOrdinalById}
                      sources={connection.sources}
                    />
                  </p>
                ))}
              </section>
            ) : null}

            {childPlaces.length > 0 ? (
              <section data-panel-section="places-in">
                <hr style={sectionDividerStyle} />
                <h2 style={sectionHeadingStyle}>Places in {titleName}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: `${tokens.spacing.sm}px` }}>
                  {childPlaces.map((childPlace) => (
                    <button
                      key={childPlace.id}
                      onClick={() =>
                        onSelectPlace({
                          placeId: childPlace.id,
                          candidateIndex: null
                        })
                      }
                      style={{
                        border: `1px solid ${tokens.color.divider}`,
                        borderRadius: "999px",
                        backgroundColor: tokens.color.surface,
                        padding: "6px 12px",
                        color: tokens.color.textPrimary,
                        cursor: "pointer",
                        fontFamily: tokens.typography.uiFont,
                        fontSize: `${tokens.typography.bodySize}px`,
                        lineHeight: `${tokens.typography.bodyLineHeight}px`
                      }}
                      type="button"
                    >
                      {getPrimaryPlaceName(childPlace)}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {sourceCitations.length > 0 ? (
              <section data-panel-section="sources" id={SOURCE_SECTION_ANCHOR_ID} ref={sourceSectionRef}>
                <hr style={sectionDividerStyle} />
                <h2 style={sectionHeadingStyle}>Sources</h2>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: "22px",
                    color: tokens.color.textSecondary
                  }}
                >
                  {sourceCitations.map((citation, index) => (
                    <li
                      id={`source-${index + 1}`}
                      key={citation.id}
                      style={{
                        marginBottom: `${tokens.spacing.sm}px`,
                        fontSize: `${tokens.typography.bodySize}px`,
                        lineHeight: `${tokens.typography.bodyLineHeight}px`
                      }}
                    >
                      {citation.url ? (
                        <a href={citation.url} rel="noreferrer" target="_blank">
                          {citation.label}
                        </a>
                      ) : (
                        citation.label
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <footer data-panel-section="footer">
              <hr style={sectionDividerStyle} />
              <p style={secondaryTextStyle}>
                Checked by the project&apos;s Fact-Checker · last reviewed{" "}
                {location.lastReviewed ?? "unknown"}
              </p>
              <a
                href={`https://github.com/jameshuangdevelop/interactive-bible-map/issues/new?title=${encodeURIComponent(`Place: ${selectedPlace.id}`)}`}
                rel="noreferrer"
                style={{
                  color: tokens.color.accent,
                  fontSize: `${tokens.typography.bodySize}px`
                }}
                target="_blank"
              >
                Report an issue
              </a>
            </footer>
          </>
        ) : null}
      </div>

      {loadErrorMessage ? (
        <div
          role="alert"
          style={{
            marginTop: `${tokens.spacing.md}px`,
            backgroundColor: tokens.color.confidenceDisputedBackground,
            color: tokens.color.confidenceDisputedText,
            borderRadius: `${tokens.radius.panel}px`,
            padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`
          }}
        >
          {loadErrorMessage}
        </div>
      ) : null}
    </div>
  );
}

function ActionIconButton({
  icon,
  label,
  disabled = false,
  onPress
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  onPress: () => void | Promise<void>;
}) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        void onPress();
      }}
      style={{
        border: "none",
        background: "transparent",
        display: "grid",
        justifyItems: "center",
        gap: "6px",
        color: disabled ? tokens.color.textSecondary : tokens.color.accent,
        cursor: disabled ? "default" : "pointer",
        padding: 0
      }}
      type="button"
    >
      <span
        aria-hidden="true"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "999px",
          border: `1px solid ${tokens.color.divider}`,
          backgroundColor: tokens.color.surface,
          display: "grid",
          placeItems: "center",
          fontSize: "16px",
          lineHeight: 1
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`
        }}
      >
        {label}
      </span>
    </button>
  );
}

const closeButtonStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "16px",
  border: `1px solid ${tokens.color.divider}`,
  backgroundColor: tokens.color.surface,
  cursor: "pointer",
  fontSize: "18px",
  color: tokens.color.textSecondary,
  lineHeight: 1
};

function carouselButtonStyle(side: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: `${tokens.spacing.sm}px`,
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.88)",
    color: tokens.color.textSecondary,
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1
  };
}

const sectionDividerStyle: CSSProperties = {
  border: "none",
  borderTop: `1px solid ${tokens.color.divider}`,
  margin: 0
};

const sectionHeadingStyle: CSSProperties = {
  marginTop: `${tokens.spacing.md}px`,
  marginBottom: `${tokens.spacing.sm}px`,
  color: tokens.color.textPrimary,
  fontSize: `${tokens.typography.sectionHeadingSize}px`,
  lineHeight: `${tokens.typography.sectionHeadingLineHeight}px`,
  fontWeight: 500
};

const secondaryTextStyle: CSSProperties = {
  marginTop: `${tokens.spacing.xs}px`,
  marginBottom: 0,
  color: tokens.color.textSecondary,
  fontSize: `${tokens.typography.bodySize}px`,
  lineHeight: `${tokens.typography.bodyLineHeight}px`
};

const bodyTextStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: `${tokens.spacing.sm}px`,
  color: tokens.color.textPrimary,
  fontSize: `${tokens.typography.bodySize}px`,
  lineHeight: `${tokens.typography.bodyLineHeight}px`
};

const textActionStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  color: tokens.color.accent,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
  cursor: "pointer",
  fontFamily: tokens.typography.uiFont,
  fontSize: `${tokens.typography.bodySize}px`,
  lineHeight: `${tokens.typography.bodyLineHeight}px`
};
