import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  type ReactNode,
  type RefObject
} from "react";

import { candidateIndexToLetter, getPrimaryPlaceName } from "../map/place-visibility";
import { buildModernLocationLabel } from "../map/modern-location-label";
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
  type AboutPlaceMention,
  buildAboutPlaceMatchIndex,
  buildAlsoKnownAs,
  buildImageKindLabel,
  buildHierarchyItems,
  buildPhotoCreditEntry,
  collectSourceIdsInPanelOrder,
  confidenceLabel,
  groupScriptureByBook,
  imageIndexesToLoad,
  isDisputedRecord,
  matchAboutPlaceMentions,
  nextImageIndex,
  shouldRenderThumbnailRow,
  sortScriptureByCanonicalOrder
} from "./panel-model";
import { formatSourceCitation } from "./source-format";
import {
  buildCommonsThumbnailUrl,
  selectCommonsThumbnailWidthForFrame
} from "./commons-thumbnail";
import { tokens } from "../../theme/tokens";

const PANEL_SECTION_GAP = tokens.spacing.lg;
const SCRIPTURE_INITIAL_COUNT = 5;
const SCRIPTURE_CHUNK_SIZE = 24;
const PANEL_IMAGE_ASPECT_RATIO = 17 / 10;
const PANEL_IMAGE_DESKTOP_WIDTH = 408;
const THUMBNAIL_IMAGE_WIDTH = 72;
const THUMBNAIL_IMAGE_HEIGHT = 48;
const VIEWER_DIALOG_MAX_WIDTH = 1280;
const VIEWER_DIALOG_VIEWPORT_MARGIN = 32;
const VIEWER_DIALOG_PADDING = tokens.spacing.md * 2;
const DIALOG_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const PHOTO_CREDITS_NOTE =
  "Photos are unmodified, except that the panel crops them to fit. Open a photo to see it whole.";
const PHOTO_CREDIT_HIGHLIGHT_DURATION_MS = 1_500;
type CollapsibleSectionId =
  | "about"
  | "places-in"
  | "in-bible"
  | "ot-connections"
  | "sources"
  | "photo-credits";
const DEFAULT_COLLAPSIBLE_SECTION_EXPANDED_STATE: Record<CollapsibleSectionId, boolean> = {
  about: true,
  "places-in": true,
  "in-bible": true,
  "ot-connections": true,
  sources: false,
  "photo-credits": false
};
// Module-level by design while a single panel instance renders; move this into context if that changes.
let rememberedCollapsibleSectionExpandedState = {
  ...DEFAULT_COLLAPSIBLE_SECTION_EXPANDED_STATE
};
const reviewedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
});

function photoCreditTargetId(placeId: string, imageIndex: number) {
  return `photo-credit-${placeId}-${imageIndex + 1}`;
}

function panelSectionContentId(placeId: string, sectionId: CollapsibleSectionId) {
  return `panel-section-content-${sectionId}-${placeId}`;
}

function headingWithCount(label: string, count: number) {
  return `${label} · ${count}`;
}

function clearEntryHighlightTimeout(highlightTimeoutRef: {
  current: number | null;
}) {
  if (highlightTimeoutRef.current === null) {
    return;
  }
  window.clearTimeout(highlightTimeoutRef.current);
  highlightTimeoutRef.current = null;
}

function focusAndHighlightEntry({
  targetId,
  setHighlightedEntryId,
  highlightTimeoutRef
}: {
  targetId: string;
  setHighlightedEntryId: Dispatch<SetStateAction<string | null>>;
  highlightTimeoutRef: { current: number | null };
}) {
  const targetElement = document.getElementById(targetId);
  if (!(targetElement instanceof HTMLElement)) {
    return;
  }

  targetElement.focus();
  targetElement.scrollIntoView({
    block: "nearest"
  });
  setHighlightedEntryId(targetId);
  clearEntryHighlightTimeout(highlightTimeoutRef);
  highlightTimeoutRef.current = window.setTimeout(() => {
    setHighlightedEntryId((current) => (current === targetId ? null : current));
    highlightTimeoutRef.current = null;
  }, PHOTO_CREDIT_HIGHLIGHT_DURATION_MS);
}

function panelJumpTargetStyle({
  isFocused,
  isHighlighted,
  prefersReducedMotion
}: {
  isFocused: boolean;
  isHighlighted: boolean;
  prefersReducedMotion: boolean;
}): CSSProperties {
  return {
    borderRadius: "4px",
    outline: isFocused || isHighlighted ? `2px solid ${tokens.color.accent}` : "none",
    outlineOffset: "2px",
    backgroundColor: isHighlighted ? "rgba(26,115,232,0.12)" : "transparent",
    transition: prefersReducedMotion
      ? "none"
      : "background-color 180ms ease-out, outline-color 180ms ease-out"
  };
}

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
  onSmallScreenHandlePointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onClose: () => void;
  onSelectPlace: (selection: PlaceSelection) => void;
  onSelectPlaceFromAbout: (selection: PlaceSelection) => void;
  onHighlightPlace: (placeId: string | null) => void;
  onSelectCandidate: (candidateIndex: number) => void;
}

function toSafeHttpUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function toSafeImageUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmed) || trimmed.startsWith("//")) {
      return null;
    }

    const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    try {
      const parsed = new URL(normalized, "https://interactive-bible-map.local");
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return null;
    }
  }
}

function resolveDisplayImageRequest({
  image,
  frameWidth,
  frameHeight,
  devicePixelRatio,
  fitMode
}: {
  image: Pick<MediaImageRecord, "url" | "width" | "height">;
  frameWidth: number;
  frameHeight: number;
  devicePixelRatio: number;
  fitMode: "cover" | "contain";
}) {
  const safeImageUrl = toSafeImageUrl(image.url);
  if (!safeImageUrl) {
    return {
      requestUrl: null as string | null
    };
  }

  const selectedWidth = selectCommonsThumbnailWidthForFrame({
    renderedWidth: frameWidth,
    renderedHeight: frameHeight,
    devicePixelRatio,
    fitMode,
    originalWidth: image.width,
    originalHeight: image.height
  });

  return {
    requestUrl:
      typeof selectedWidth === "number"
        ? buildCommonsThumbnailUrl(safeImageUrl, selectedWidth)
        : safeImageUrl
  };
}

function focusableElementsInDialog(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled")
  );
}

function cycleDialogFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") {
    return;
  }

  const container = event.currentTarget;
  const focusable = focusableElementsInDialog(container);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const currentIndex = activeElement ? focusable.indexOf(activeElement) : -1;
  const movingBackward = event.shiftKey;
  let targetIndex = 0;

  if (movingBackward) {
    targetIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
  } else {
    targetIndex = currentIndex < 0 || currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
  }

  event.preventDefault();
  focusable[targetIndex]?.focus();
}

interface CreditSegment {
  key: string;
  text: string;
  href: string | null;
}

function renderCreditSegments(segments: CreditSegment[]) {
  return segments.map((segment, index) => {
    const safeHref = toSafeHttpUrl(segment.href);
    return (
      <span key={segment.key}>
        {index > 0 ? " · " : null}
        {safeHref ? (
          <a href={safeHref} rel="noopener noreferrer" target="_blank">
            {segment.text}
          </a>
        ) : (
          segment.text
        )}
      </span>
    );
  });
}

function formatReviewedDate(lastReviewed: string | undefined) {
  if (!lastReviewed) {
    return "unknown";
  }

  const parsedDate = new Date(lastReviewed);
  if (Number.isNaN(parsedDate.valueOf())) {
    return "unknown";
  }

  return reviewedDateFormatter.format(parsedDate);
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
  locationId,
  frameWidth,
  frameHeight,
  devicePixelRatio,
  imageObjectFit,
  counterText,
  failedImageRequests,
  onRequestFailure,
  onOpenViewer,
  openViewerTargetRef,
  onPreviousImage,
  onNextImage,
  showInlineCreditLine = true,
  activeImageOrdinal = 1,
  photoCreditLinkTargetId,
  onPhotoCreditLinkSelect
}: {
  image: MediaImageRecord;
  locationId: string;
  frameWidth: number;
  frameHeight: number;
  devicePixelRatio: number;
  imageObjectFit: "cover" | "contain";
  counterText: string | null;
  failedImageRequests: Record<string, true>;
  onRequestFailure: (requestUrl: string) => void;
  onOpenViewer?: () => void;
  openViewerTargetRef?: RefObject<HTMLButtonElement | null>;
  onPreviousImage?: () => void;
  onNextImage?: () => void;
  showInlineCreditLine?: boolean;
  activeImageOrdinal?: number;
  photoCreditLinkTargetId?: string;
  onPhotoCreditLinkSelect?: () => void;
}) {
  const { requestUrl: imageUrl } = resolveDisplayImageRequest({
    image,
    frameWidth,
    frameHeight,
    devicePixelRatio,
    fitMode: imageObjectFit
  });
  const showFallback = !imageUrl || Boolean(failedImageRequests[imageUrl]);
  const kindLabel = buildImageKindLabel(image.kind);
  const photoCredit = buildPhotoCreditEntry(image, locationId);
  const showCreditJumpLink =
    !showInlineCreditLine &&
    typeof onPhotoCreditLinkSelect === "function" &&
    typeof photoCreditLinkTargetId === "string" &&
    photoCreditLinkTargetId.length > 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0
      }}
    >
      <div
        style={{
          width: "100%",
          height: `${Math.max(1, Math.round(frameHeight))}px`,
          backgroundColor: tokens.color.subtleSurface,
          borderRadius: `${tokens.radius.panel}px`,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {showFallback ? (
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
            data-panel-photo-image="true"
            onError={() => {
              if (imageUrl) {
                onRequestFailure(imageUrl);
              }
            }}
            src={imageUrl}
            width={typeof image.width === "number" ? image.width : undefined}
            height={typeof image.height === "number" ? image.height : undefined}
            style={{
              width: "100%",
              height: "100%",
              objectFit: imageObjectFit,
              display: "block"
            }}
          />
        )}
        {onOpenViewer ? (
          <button
            aria-label="Open image viewer"
            data-image-viewer-open="true"
            onClick={onOpenViewer}
            ref={openViewerTargetRef}
            style={imageViewerOpenButtonStyle}
            type="button"
          />
        ) : null}
        {counterText ? (
          <span
            data-photo-counter="true"
            style={{
              position: "absolute",
              bottom: `${tokens.spacing.sm}px`,
              right: `${tokens.spacing.sm}px`,
              backgroundColor: "rgba(32,33,36,0.76)",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "2px 8px",
              fontSize: `${tokens.typography.captionSize}px`,
              lineHeight: `${tokens.typography.captionLineHeight}px`,
              pointerEvents: "none",
              zIndex: 1
            }}
          >
            {counterText}
          </span>
        ) : null}
        {kindLabel ? (
          <span
            data-photo-kind-label="true"
            style={{
              position: "absolute",
              top: `${tokens.spacing.sm}px`,
              left: `${tokens.spacing.sm}px`,
              borderRadius: "999px",
              padding: "4px 8px",
              backgroundColor: "rgba(32,33,36,0.92)",
              color: "#FFFFFF",
              fontSize: `${tokens.typography.captionSize}px`,
              lineHeight: `${tokens.typography.captionLineHeight}px`,
              zIndex: 1
            }}
          >
            {kindLabel}
          </span>
        ) : null}
        {onPreviousImage && onNextImage ? (
          <>
            <button
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                onPreviousImage();
              }}
              style={carouselButtonStyle("left")}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                onNextImage();
              }}
              style={carouselButtonStyle("right")}
              type="button"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {showInlineCreditLine ? (
        <p
          data-photo-credit="true"
          style={{
            marginTop: `${tokens.spacing.sm}px`,
            marginBottom: 0,
            color: tokens.color.textSecondary,
            fontSize: `${tokens.typography.captionSize}px`,
            lineHeight: `${tokens.typography.captionLineHeight}px`,
            overflowWrap: "anywhere"
          }}
        >
          {renderCreditSegments(photoCredit.segments)}
        </p>
      ) : null}
      <p
        data-photo-caption="true"
        style={{
          marginTop: showInlineCreditLine ? `${tokens.spacing.xs}px` : `${tokens.spacing.sm}px`,
          marginBottom: 0,
          color: tokens.color.textSecondary,
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`,
          overflowWrap: "anywhere"
        }}
      >
        {image.caption}
      </p>
      {showCreditJumpLink ? (
        <p
          style={{
            marginTop: `${tokens.spacing.xs}px`,
            marginBottom: 0,
            color: tokens.color.textSecondary,
            fontSize: `${tokens.typography.captionSize}px`,
            lineHeight: `${tokens.typography.captionLineHeight}px`
          }}
        >
          <a
            aria-label={`Credit for image ${activeImageOrdinal}`}
            data-photo-credit-link="true"
            href={`#${photoCreditLinkTargetId}`}
            onClick={(event) => {
              event.preventDefault();
              onPhotoCreditLinkSelect();
            }}
            style={{
              color: tokens.color.textSecondary,
              textDecoration: "underline",
              textUnderlineOffset: "2px"
            }}
          >
            Credit
          </a>
        </p>
      ) : null}
    </div>
  );
}

function GalleryThumbnails({
  images,
  activeImageIndex,
  devicePixelRatio,
  failedImageRequests,
  onRequestFailure,
  onSelectImage
}: {
  images: MediaImageRecord[];
  activeImageIndex: number;
  devicePixelRatio: number;
  failedImageRequests: Record<string, true>;
  onRequestFailure: (requestUrl: string) => void;
  onSelectImage: (nextIndex: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const row = rowRef.current;
    const selectedButton = buttonRefs.current[activeImageIndex];
    if (!row || !selectedButton) {
      return;
    }

    // Scroll only the thumbnail row. scrollIntoView would also move Chromium's sequential focus
    // navigation starting point to the thumbnail, so the first Tab after opening a place from a
    // link would skip the search box and land in the gallery.
    const rowBounds = row.getBoundingClientRect();
    const buttonBounds = selectedButton.getBoundingClientRect();
    if (buttonBounds.left < rowBounds.left) {
      row.scrollLeft -= rowBounds.left - buttonBounds.left;
    } else if (buttonBounds.right > rowBounds.right) {
      row.scrollLeft += buttonBounds.right - rowBounds.right;
    }
  }, [activeImageIndex, images.length]);

  return (
    <div
      aria-label="Image thumbnails"
      data-thumbnail-row="true"
      ref={rowRef}
      style={{
        display: "flex",
        gap: `${tokens.spacing.sm}px`,
        marginTop: `${tokens.spacing.sm}px`,
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: `${tokens.spacing.xs}px`,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        overscrollBehaviorX: "contain"
      }}
    >
      {images.map((image, imageIndex) => {
        const thumbnail = resolveDisplayImageRequest({
          image,
          frameWidth: THUMBNAIL_IMAGE_WIDTH,
          frameHeight: THUMBNAIL_IMAGE_HEIGHT,
          devicePixelRatio,
          fitMode: "cover"
        });
        const isFailed =
          !thumbnail.requestUrl || Boolean(failedImageRequests[thumbnail.requestUrl]);
        const selected = imageIndex === activeImageIndex;

        return (
          <button
            aria-label={`Show image ${imageIndex + 1} of ${images.length}`}
            data-gallery-thumbnail={selected ? "selected" : "idle"}
            key={image.id}
            onClick={() => onSelectImage(imageIndex)}
            ref={(element) => {
              buttonRefs.current[imageIndex] = element;
            }}
            style={{
              width: `${THUMBNAIL_IMAGE_WIDTH}px`,
              minWidth: `${THUMBNAIL_IMAGE_WIDTH}px`,
              height: `${THUMBNAIL_IMAGE_HEIGHT}px`,
              borderRadius: `${tokens.radius.panel}px`,
              border: selected
                ? `2px solid ${tokens.color.accent}`
                : `1px solid ${tokens.color.divider}`,
              backgroundColor: tokens.color.subtleSurface,
              overflow: "hidden",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            type="button"
          >
            {isFailed ? (
              <span
                style={{
                  color: tokens.color.textSecondary,
                  fontSize: `${tokens.typography.captionSize}px`,
                  lineHeight: `${tokens.typography.captionLineHeight}px`,
                  padding: `0 ${tokens.spacing.xs}px`,
                  textAlign: "center"
                }}
              >
                -
              </span>
            ) : (
              <img
                alt={image.caption}
                loading="lazy"
                onError={() => {
                  if (thumbnail.requestUrl) {
                    onRequestFailure(thumbnail.requestUrl);
                  }
                }}
                src={thumbnail.requestUrl ?? undefined}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            )}
          </button>
        );
      })}
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
  sourceOrdinalById,
  onSelectSource
}: {
  sources: SourceId[];
  sourceOrdinalById: Map<SourceId, number>;
  onSelectSource?: (sourceOrdinal: number) => void;
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
          onClick={(event) => {
            if (!onSelectSource) {
              return;
            }
            event.preventDefault();
            onSelectSource(ordinal);
          }}
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

function CollapsibleSectionHeading({
  sectionId,
  contentId,
  label,
  expanded,
  prefersReducedMotion,
  onToggle
}: {
  sectionId: CollapsibleSectionId;
  contentId: string;
  label: string;
  expanded: boolean;
  prefersReducedMotion: boolean;
  onToggle: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const chevronState = expanded ? "expanded" : "collapsed";

  return (
    <h2 style={sectionHeadingStyle}>
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        data-panel-section-toggle={sectionId}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onClick={onToggle}
        style={{
          ...sectionHeadingToggleButtonStyle,
          backgroundColor: isHovered ? tokens.color.subtleSurface : "transparent"
        }}
        type="button"
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          data-panel-section-chevron={sectionId}
          data-panel-section-chevron-state={chevronState}
          style={sectionHeadingChevronContainerStyle}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            style={{
              ...sectionHeadingChevronStyle,
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: prefersReducedMotion ? "none" : "transform 180ms ease"
            }}
            viewBox="0 0 12 12"
          >
            <path
              d="M4 2.5L8 6L4 9.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </span>
      </button>
    </h2>
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

function renderAboutParagraphWithLinks({
  paragraphText,
  mentions,
  onSelectPlace,
  onHighlightPlace
}: {
  paragraphText: string;
  mentions: AboutPlaceMention[];
  onSelectPlace: (selection: PlaceSelection) => void;
  onHighlightPlace: (placeId: string | null) => void;
}) {
  if (mentions.length === 0) {
    return paragraphText;
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const mention of mentions) {
    if (mention.start > cursor) {
      parts.push(
        <span key={`text-${mention.paragraphIndex}-${mention.start}`}>
          {paragraphText.slice(cursor, mention.start)}
        </span>
      );
    }

    parts.push(
      <button
        data-about-place-id={mention.placeId}
        data-about-place-link="true"
        key={`link-${mention.paragraphIndex}-${mention.start}-${mention.placeId}`}
        onBlur={() => {
          onHighlightPlace(null);
        }}
        onClick={() => {
          onSelectPlace({
            placeId: mention.placeId,
            candidateIndex: null
          });
        }}
        onFocus={() => {
          onHighlightPlace(mention.placeId);
        }}
        onMouseEnter={() => {
          onHighlightPlace(mention.placeId);
        }}
        onMouseLeave={() => {
          onHighlightPlace(null);
        }}
        style={aboutPlaceLinkStyle}
        type="button"
      >
        {paragraphText.slice(mention.start, mention.end)}
      </button>
    );
    cursor = mention.end;
  }

  if (cursor < paragraphText.length) {
    parts.push(
      <span key={`text-tail-${mentions[mentions.length - 1]?.paragraphIndex ?? 0}-${cursor}`}>
        {paragraphText.slice(cursor)}
      </span>
    );
  }

  return parts;
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
    <div aria-hidden="true" data-place-panel-skeleton="true">
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
  onSmallScreenHandlePointerDown,
  onClose,
  onSelectPlace,
  onSelectPlaceFromAbout,
  onHighlightPlace,
  onSelectCandidate
}: PlacePanelProps) {
  const imageViewerRef = useRef<HTMLDivElement | null>(null);
  const imageViewerOpenTargetRef = useRef<HTMLButtonElement | null>(null);
  const imageViewerInertTargetsRef = useRef<HTMLElement[]>([]);
  const photoCreditHighlightTimeoutRef = useRef<number | null>(null);
  const sourceEntryHighlightTimeoutRef = useRef<number | null>(null);
  const showAllScriptureToggleRef = useRef<HTMLButtonElement | null>(null);
  const pendingScriptureCollapseTopRef = useRef<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImageRequests, setFailedImageRequests] = useState<Record<string, true>>({});
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [highlightedSourceEntryId, setHighlightedSourceEntryId] = useState<string | null>(null);
  const [focusedSourceEntryId, setFocusedSourceEntryId] = useState<string | null>(null);
  const [highlightedPhotoCreditId, setHighlightedPhotoCreditId] = useState<string | null>(null);
  const [focusedPhotoCreditId, setFocusedPhotoCreditId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<CollapsibleSectionId, boolean>>(
    () => ({ ...rememberedCollapsibleSectionExpandedState })
  );
  const [expandedCandidateSupport, setExpandedCandidateSupport] = useState<Record<number, true>>({});
  const [showAllScripture, setShowAllScripture] = useState(false);
  const [visibleScriptureCount, setVisibleScriptureCount] = useState(SCRIPTURE_INITIAL_COUNT);

  const location = placeDetails?.location ?? null;
  const images = useMemo(() => placeDetails?.media?.images ?? [], [placeDetails?.media?.images]);
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
  const aboutParagraphs = useMemo(() => {
    if (!location) {
      return [] as {
        text: string;
        sources: SourceId[];
      }[];
    }

    return [
      {
        text: location.summary.text,
        sources: location.summary.sources
      },
      ...location.history.map((entry) => ({
        text: entry.text,
        sources: entry.sources
      }))
    ];
  }, [location]);
  const aboutPlaceMatchIndex = useMemo(() => buildAboutPlaceMatchIndex(places), [places]);
  const aboutMentionsByParagraph = useMemo(() => {
    const mentionsByParagraph = new Map<number, AboutPlaceMention[]>();
    if (!location) {
      return mentionsByParagraph;
    }

    const matches = matchAboutPlaceMentions({
      matchIndex: aboutPlaceMatchIndex,
      currentPlaceId: placeForDisplay.id,
      paragraphs: aboutParagraphs.map((entry) => entry.text)
    });

    for (const match of matches) {
      const existing = mentionsByParagraph.get(match.paragraphIndex) ?? [];
      existing.push(match);
      mentionsByParagraph.set(match.paragraphIndex, existing);
    }

    return mentionsByParagraph;
  }, [aboutParagraphs, aboutPlaceMatchIndex, location, placeForDisplay.id]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => {
        mediaQuery.removeEventListener("change", updatePreference);
      };
    }

    mediaQuery.addListener(updatePreference);
    return () => {
      mediaQuery.removeListener(updatePreference);
    };
  }, []);

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

  useLayoutEffect(() => {
    if (showAllScripture) {
      return;
    }

    const topBeforeCollapse = pendingScriptureCollapseTopRef.current;
    if (topBeforeCollapse === null) {
      return;
    }
    pendingScriptureCollapseTopRef.current = null;

    const refreshedButton = showAllScriptureToggleRef.current;
    refreshedButton?.focus({ preventScroll: true });

    if (!refreshedButton) {
      return;
    }

    const topAfterCollapse = refreshedButton.getBoundingClientRect().top;
    const scrollOffsetDelta = topAfterCollapse - topBeforeCollapse;
    if (Math.abs(scrollOffsetDelta) < 1) {
      return;
    }

    const panelContainer = refreshedButton.closest<HTMLElement>("section[aria-label='Place details']");
    if (panelContainer) {
      panelContainer.scrollTop += scrollOffsetDelta;
      return;
    }

    window.scrollBy({
      top: scrollOffsetDelta
    });
  }, [showAllScripture]);

  const visibleScripture = sortedScripture.slice(0, visibleScriptureCount);
  const groupedScripture = groupScriptureByBook(visibleScripture);

  const normalizedActiveImageIndex =
    images.length === 0 ? 0 : Math.min(activeImageIndex, images.length - 1);
  const selectedImage = images[normalizedActiveImageIndex] ?? null;
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 960 : window.innerHeight;
  const devicePixelRatio =
    typeof window === "undefined"
      ? 1
      : Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
        ? window.devicePixelRatio
        : 1;
  const panelFrameWidth = isSmallScreen
    ? Math.max(330, viewportWidth - VIEWER_DIALOG_VIEWPORT_MARGIN)
    : PANEL_IMAGE_DESKTOP_WIDTH;
  const panelFrameHeight = panelFrameWidth / PANEL_IMAGE_ASPECT_RATIO;
  const selectedImageAspectRatio =
    selectedImage &&
    typeof selectedImage.width === "number" &&
    selectedImage.width > 0 &&
    typeof selectedImage.height === "number" &&
    selectedImage.height > 0
      ? selectedImage.width / selectedImage.height
      : PANEL_IMAGE_ASPECT_RATIO;
  const viewerDialogWidth = Math.min(
    VIEWER_DIALOG_MAX_WIDTH,
    Math.max(320, viewportWidth - VIEWER_DIALOG_VIEWPORT_MARGIN)
  );
  const viewerDialogHeight = Math.max(320, viewportHeight - VIEWER_DIALOG_VIEWPORT_MARGIN);
  const viewerContentWidth = Math.max(1, viewerDialogWidth - VIEWER_DIALOG_PADDING);
  const viewerContentHeight = Math.max(1, viewerDialogHeight - VIEWER_DIALOG_PADDING);
  const viewerFrameHeight = Math.min(
    viewerContentHeight,
    viewerContentWidth / selectedImageAspectRatio
  );
  const viewerFrameWidth = viewerFrameHeight * selectedImageAspectRatio;
  const showThumbnailStrip = shouldRenderThumbnailRow(images.length);
  const alsoKnownAs = buildAlsoKnownAs(placeForDisplay.names);
  const modernLocationLabel = buildModernLocationLabel(placeForDisplay.names);
  const titleName = getPrimaryPlaceName(placeForDisplay);
  const photoCreditEntries = useMemo(
    () =>
      images.map((image, imageIndex) => ({
        imageId: image.id,
        imageIndex,
        entryId: photoCreditTargetId(placeForDisplay.id, imageIndex),
        segments: buildPhotoCreditEntry(image, placeForDisplay.id).segments
      })),
    [images, placeForDisplay.id]
  );
  const aboutSectionContentId = panelSectionContentId(selectedPlace.id, "about");
  const placesInSectionContentId = panelSectionContentId(selectedPlace.id, "places-in");
  const inBibleSectionContentId = panelSectionContentId(selectedPlace.id, "in-bible");
  const otConnectionsSectionContentId = panelSectionContentId(
    selectedPlace.id,
    "ot-connections"
  );
  const sourcesSectionContentId = panelSectionContentId(selectedPlace.id, "sources");
  const photoCreditsSectionContentId = panelSectionContentId(
    selectedPlace.id,
    "photo-credits"
  );
  const aboutSectionExpanded = expandedSections.about;
  const placesInSectionExpanded = expandedSections["places-in"];
  const inBibleSectionExpanded = expandedSections["in-bible"];
  const otConnectionsSectionExpanded = expandedSections["ot-connections"];
  const sourcesSectionExpanded = expandedSections.sources;
  const photoCreditsSectionExpanded = expandedSections["photo-credits"];
  const placesInSectionHeading = headingWithCount(`Places in ${titleName}`, childPlaces.length);
  const inBibleSectionHeading = `In the Bible · ${sortedScripture.length} ${
    sortedScripture.length === 1 ? "passage" : "passages"
  }`;
  const otConnectionsSectionHeading = headingWithCount(
    "Old Testament connections",
    location?.otConnections.length ?? 0
  );
  const sourcesSectionHeading = headingWithCount("Sources", sourceCitations.length);
  const photoCreditsSectionHeading = headingWithCount("Photo credits", photoCreditEntries.length);

  useEffect(
    () => () => {
      clearEntryHighlightTimeout(photoCreditHighlightTimeoutRef);
      clearEntryHighlightTimeout(sourceEntryHighlightTimeoutRef);
    },
    []
  );

  useEffect(() => {
    clearEntryHighlightTimeout(photoCreditHighlightTimeoutRef);
    clearEntryHighlightTimeout(sourceEntryHighlightTimeoutRef);
  }, [selectedPlace.id]);

  useEffect(
    () => () => {
      onHighlightPlace(null);
    },
    [onHighlightPlace]
  );

  useEffect(() => {
    if (!selectedImage || images.length <= 1) {
      return;
    }

    const [, nextIndex] = imageIndexesToLoad(normalizedActiveImageIndex, images.length);
    if (typeof nextIndex !== "number") {
      return;
    }

    const nextImage = images[nextIndex];
    const nextRequest = resolveDisplayImageRequest({
      image: nextImage,
      frameWidth: panelFrameWidth,
      frameHeight: panelFrameHeight,
      devicePixelRatio,
      fitMode: "cover"
    });
    if (!nextRequest.requestUrl || failedImageRequests[nextRequest.requestUrl]) {
      return;
    }

    const preload = new Image();
    preload.decoding = "async";
    preload.src = nextRequest.requestUrl;
  }, [
    activeImageIndex,
    devicePixelRatio,
    failedImageRequests,
    images,
    images.length,
    normalizedActiveImageIndex,
    panelFrameHeight,
    panelFrameWidth,
    selectedImage
  ]);

  useEffect(() => {
    if (!isImageViewerOpen || images.length <= 1) {
      return;
    }

    const [, nextIndex] = imageIndexesToLoad(normalizedActiveImageIndex, images.length);
    if (typeof nextIndex !== "number") {
      return;
    }

    const nextImage = images[nextIndex];
    const nextViewerRequest = resolveDisplayImageRequest({
      image: nextImage,
      frameWidth: viewerFrameWidth,
      frameHeight: viewerFrameHeight,
      devicePixelRatio,
      fitMode: "contain"
    });
    if (!nextViewerRequest.requestUrl || failedImageRequests[nextViewerRequest.requestUrl]) {
      return;
    }

    const preload = new Image();
    preload.decoding = "async";
    preload.src = nextViewerRequest.requestUrl;
  }, [
    activeImageIndex,
    devicePixelRatio,
    failedImageRequests,
    images,
    images.length,
    isImageViewerOpen,
    normalizedActiveImageIndex,
    viewerFrameHeight,
    viewerFrameWidth
  ]);

  useEffect(() => {
    if (!isImageViewerOpen) {
      for (const element of imageViewerInertTargetsRef.current) {
        element.removeAttribute("inert");
      }
      imageViewerInertTargetsRef.current = [];
      return undefined;
    }

    const appShellRoot = imageViewerRef.current?.closest<HTMLElement>("[data-app-shell-root]");
    const imageViewerOverlay = imageViewerRef.current?.closest<HTMLElement>(
      "[data-image-viewer-overlay='true']"
    );

    if (!appShellRoot || !imageViewerOverlay) {
      return undefined;
    }

    const inertTargets = Array.from(appShellRoot.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && !child.contains(imageViewerOverlay)
    );
    const newlyInertTargets: HTMLElement[] = [];
    for (const element of inertTargets) {
      if (element.hasAttribute("inert")) {
        continue;
      }

      element.setAttribute("inert", "");
      newlyInertTargets.push(element);
    }

    imageViewerInertTargetsRef.current = newlyInertTargets;
    return () => {
      for (const element of imageViewerInertTargetsRef.current) {
        element.removeAttribute("inert");
      }
      imageViewerInertTargetsRef.current = [];
    };
  }, [isImageViewerOpen]);

  useEffect(() => {
    if (!isImageViewerOpen) {
      return;
    }

    const dialog = imageViewerRef.current;
    if (!dialog) {
      return;
    }

    const focusable = focusableElementsInDialog(dialog);
    if (focusable.length > 0) {
      focusable[0].focus();
      return;
    }

    dialog.focus();
  }, [isImageViewerOpen]);

  const moveImageBy = (step: number) => {
    setActiveImageIndex((currentIndex) => nextImageIndex(currentIndex, images.length, step));
  };

  const markImageRequestFailed = (requestUrl: string) => {
    setFailedImageRequests((current) => {
      if (current[requestUrl]) {
        return current;
      }

      return {
        ...current,
        [requestUrl]: true
      };
    });
  };

  const setSectionExpanded = (sectionId: CollapsibleSectionId, expanded: boolean) => {
    setExpandedSections((current) => {
      if (current[sectionId] === expanded) {
        return current;
      }

      const next = {
        ...current,
        [sectionId]: expanded
      };
      rememberedCollapsibleSectionExpandedState = next;
      return next;
    });
  };

  const toggleSectionExpanded = (sectionId: CollapsibleSectionId) => {
    setExpandedSections((current) => {
      const next = {
        ...current,
        [sectionId]: !current[sectionId]
      };
      rememberedCollapsibleSectionExpandedState = next;
      return next;
    });
  };

  const focusPhotoCreditEntry = (targetId: string) => {
    focusAndHighlightEntry({
      targetId,
      setHighlightedEntryId: setHighlightedPhotoCreditId,
      highlightTimeoutRef: photoCreditHighlightTimeoutRef
    });
  };

  const focusSourceEntry = (targetId: string) => {
    focusAndHighlightEntry({
      targetId,
      setHighlightedEntryId: setHighlightedSourceEntryId,
      highlightTimeoutRef: sourceEntryHighlightTimeoutRef
    });
  };

  const jumpToSource = (sourceOrdinal: number) => {
    const targetId = `source-${sourceOrdinal}`;
    setSectionExpanded("sources", true);
    window.requestAnimationFrame(() => {
      focusSourceEntry(targetId);
    });
  };

  const jumpToPhotoCredit = (imageIndex: number) => {
    const targetId = photoCreditTargetId(placeForDisplay.id, imageIndex);
    setSectionExpanded("photo-credits", true);
    window.requestAnimationFrame(() => {
      focusPhotoCreditEntry(targetId);
    });
  };

  const toggleShowAllScripture = () => {
    if (!showAllScripture) {
      pendingScriptureCollapseTopRef.current = null;
      setShowAllScripture(true);
      return;
    }

    const toggleButton = showAllScriptureToggleRef.current;
    pendingScriptureCollapseTopRef.current = toggleButton?.getBoundingClientRect().top ?? null;

    setShowAllScripture(false);
    setVisibleScriptureCount(SCRIPTURE_INITIAL_COUNT);
  };

  const openImageViewer = () => {
    if (!selectedImage) {
      return;
    }

    setIsImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    window.requestAnimationFrame(() => {
      imageViewerOpenTargetRef.current?.focus();
    });
  };

  const locationStatusIndicator = (() => {
    if (hasMultipleCandidates && isDisputed) {
      return (
        <span
          data-location-chip="disputed"
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: "999px",
            backgroundColor: tokens.color.confidenceDisputedBackground,
            color: tokens.color.confidenceDisputedText,
            padding: "2px 10px",
            fontWeight: 500,
            fontSize: `${tokens.typography.captionSize}px`,
            lineHeight: `${tokens.typography.captionLineHeight}px`
          }}
        >
          Location disputed · {placeForDisplay.candidates.length} proposed{" "}
          {placeForDisplay.candidates.length === 1 ? "site" : "sites"}
        </span>
      );
    }

    if (hasMultipleCandidates) {
      return (
        <span
          data-location-chip="multi-site"
          style={{
            color: tokens.color.textSecondary,
            fontSize: `${tokens.typography.bodySize}px`,
            lineHeight: `${tokens.typography.bodyLineHeight}px`
          }}
        >
          {placeForDisplay.candidates.length} sites
        </span>
      );
    }

    const candidate = placeForDisplay.candidates[0];
    if (!candidate) {
      return null;
    }

    const chip = typeChipStyle(candidate.confidence);
    return (
      <span
        data-location-chip="confidence"
        style={{
          display: "inline-flex",
          alignItems: "center",
          borderRadius: "999px",
          padding: "2px 10px",
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
              onPointerDown={onSmallScreenHandlePointerDown}
              onClick={onToggleSmallScreenExpanded}
              style={{
                width: "44px",
                height: "44px",
                border: "none",
                borderRadius: "999px",
                backgroundColor: "transparent",
                cursor: "pointer",
                alignSelf: "center"
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: "36px",
                  height: "6px",
                  margin: "0 auto",
                  borderRadius: "999px",
                  backgroundColor: tokens.color.divider
                }}
              />
            </button>
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
    <div style={{ minWidth: 0, maxWidth: "100%" }}>
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
            onPointerDown={onSmallScreenHandlePointerDown}
            onClick={onToggleSmallScreenExpanded}
            style={{
              width: "44px",
              height: "44px",
              border: "none",
              borderRadius: "999px",
              backgroundColor: "transparent",
              cursor: "pointer"
            }}
            type="button"
          >
            <span
              aria-hidden="true"
              style={{
                display: "block",
                width: "36px",
                height: "6px",
                margin: "0 auto",
                borderRadius: "999px",
                backgroundColor: tokens.color.divider
              }}
            />
          </button>
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

      <div
        style={{
          display: "grid",
          gap: `${PANEL_SECTION_GAP}px`,
          minWidth: 0,
          maxWidth: "100%",
          overflowX: "hidden"
        }}
      >
        {selectedImage ? (
          <section data-panel-section="photos" style={{ minWidth: 0, maxWidth: "100%", width: "100%" }}>
            <WikimediaImage
              counterText={
                images.length > 1
                  ? `${normalizedActiveImageIndex + 1} / ${images.length}`
                  : null
              }
              devicePixelRatio={devicePixelRatio}
              failedImageRequests={failedImageRequests}
              frameHeight={panelFrameHeight}
              frameWidth={panelFrameWidth}
              image={selectedImage}
              imageObjectFit="cover"
              locationId={placeForDisplay.id}
              activeImageOrdinal={normalizedActiveImageIndex + 1}
              onNextImage={
                images.length > 1
                  ? () => {
                      moveImageBy(1);
                    }
                  : undefined
              }
              onOpenViewer={openImageViewer}
              onPreviousImage={
                images.length > 1
                  ? () => {
                      moveImageBy(-1);
                    }
                  : undefined
              }
              onRequestFailure={markImageRequestFailed}
              openViewerTargetRef={imageViewerOpenTargetRef}
              photoCreditLinkTargetId={
                photoCreditEntries[normalizedActiveImageIndex]?.entryId
              }
              onPhotoCreditLinkSelect={() => {
                jumpToPhotoCredit(normalizedActiveImageIndex);
              }}
              showInlineCreditLine={false}
            />
            {showThumbnailStrip ? (
              <GalleryThumbnails
                activeImageIndex={normalizedActiveImageIndex}
                devicePixelRatio={devicePixelRatio}
                failedImageRequests={failedImageRequests}
                images={images}
                onRequestFailure={markImageRequestFailed}
                onSelectImage={setActiveImageIndex}
              />
            ) : null}
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
          {modernLocationLabel || locationStatusIndicator ? (
            <p data-modern-name-line="true" style={todayLineStyle}>
              {modernLocationLabel ? <span>{`Today: ${modernLocationLabel}`}</span> : null}
              {locationStatusIndicator}
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
                const supportTextId = `candidate-support-${selectedPlace.id}-${candidateIndex}`;

                return (
                  <div
                    key={`${candidate.label}:${candidateIndex}`}
                    style={{
                      border: selected
                        ? `1px solid ${tokens.color.accent}`
                        : `1px solid ${tokens.color.divider}`,
                      borderRadius: `${tokens.radius.panel}px`,
                      backgroundColor: selected ? "#E8F0FE" : tokens.color.surface,
                      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`
                    }}
                  >
                    <button
                      aria-label={`Candidate ${letter}: ${candidate.label}`}
                      onClick={() => onSelectCandidate(candidateIndex)}
                      style={{
                        border: "none",
                        background: "transparent",
                        width: "100%",
                        padding: 0,
                        cursor: "pointer",
                        textAlign: "left"
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
                    </button>
                    <p
                      id={supportTextId}
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
                        onSelectSource={jumpToSource}
                        sourceOrdinalById={sourceOrdinalById}
                        sources={candidate.sources}
                      />
                    </p>
                    {supportCanExpand ? (
                      <button
                        aria-controls={supportTextId}
                        aria-expanded={expanded}
                        data-candidate-support-toggle="true"
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: "0 4px",
                          minHeight: "44px",
                          cursor: "pointer",
                          color: tokens.color.accent,
                          fontSize: `${tokens.typography.captionSize}px`,
                          lineHeight: `${tokens.typography.captionLineHeight}px`,
                          textDecoration: "underline",
                          textUnderlineOffset: "2px"
                        }}
                        onClick={() => {
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
                        type="button"
                      >
                        {expanded ? "Show less" : "Show more"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {location ? (
          <>
            <section data-panel-section="about">
              <hr style={sectionDividerStyle} />
              <CollapsibleSectionHeading
                contentId={aboutSectionContentId}
                expanded={aboutSectionExpanded}
                label="About"
                onToggle={() => {
                  toggleSectionExpanded("about");
                }}
                prefersReducedMotion={prefersReducedMotion}
                sectionId="about"
              />
              <div
                data-panel-section-content="about"
                hidden={!aboutSectionExpanded}
                id={aboutSectionContentId}
              >
                {aboutParagraphs.map((entry, index) => {
                  const mentions = aboutMentionsByParagraph.get(index) ?? [];
                  return (
                    <p key={`${entry.text}:${index}`} style={bodyTextStyle}>
                      {renderAboutParagraphWithLinks({
                        paragraphText: entry.text,
                        mentions,
                        onSelectPlace: onSelectPlaceFromAbout,
                        onHighlightPlace
                      })}
                      <SourceMarkers
                        onSelectSource={jumpToSource}
                        sourceOrdinalById={sourceOrdinalById}
                        sources={entry.sources}
                      />
                    </p>
                  );
                })}
              </div>
            </section>

            {childPlaces.length > 0 ? (
              <section data-panel-section="places-in">
                <hr style={sectionDividerStyle} />
                <CollapsibleSectionHeading
                  contentId={placesInSectionContentId}
                  expanded={placesInSectionExpanded}
                  label={placesInSectionHeading}
                  onToggle={() => {
                    toggleSectionExpanded("places-in");
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                  sectionId="places-in"
                />
                <div
                  data-panel-section-content="places-in"
                  hidden={!placesInSectionExpanded}
                  id={placesInSectionContentId}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: `${tokens.spacing.sm}px` }}>
                    {childPlaces.map((childPlace) => (
                      <button
                        data-places-in-place-id={childPlace.id}
                        key={childPlace.id}
                        onBlur={() => {
                          onHighlightPlace(null);
                        }}
                        onClick={() =>
                          onSelectPlace({
                            placeId: childPlace.id,
                            candidateIndex: null
                          })
                        }
                        onFocus={() => {
                          onHighlightPlace(childPlace.id);
                        }}
                        onMouseEnter={() => {
                          onHighlightPlace(childPlace.id);
                        }}
                        onMouseLeave={() => {
                          onHighlightPlace(null);
                        }}
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
                </div>
              </section>
            ) : null}

            {sortedScripture.length > 0 ? (
              <section data-panel-section="in-bible">
                <hr style={sectionDividerStyle} />
                <CollapsibleSectionHeading
                  contentId={inBibleSectionContentId}
                  expanded={inBibleSectionExpanded}
                  label={inBibleSectionHeading}
                  onToggle={() => {
                    toggleSectionExpanded("in-bible");
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                  sectionId="in-bible"
                />
                <div
                  data-panel-section-content="in-bible"
                  hidden={!inBibleSectionExpanded}
                  id={inBibleSectionContentId}
                >
                  <div id={`scripture-passages-${selectedPlace.id}`}>
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
                  </div>
                  {sortedScripture.length > SCRIPTURE_INITIAL_COUNT ? (
                    <button
                      aria-controls={`scripture-passages-${selectedPlace.id}`}
                      aria-expanded={showAllScripture}
                      data-show-all-passages="true"
                      onClick={toggleShowAllScripture}
                      ref={showAllScriptureToggleRef}
                      style={showAllControlStyle}
                      type="button"
                    >
                      {showAllScripture
                        ? "Show fewer"
                        : `Show all ${sortedScripture.length} passages`}
                    </button>
                  ) : null}
                  {showAllScripture && visibleScriptureCount < sortedScripture.length ? (
                    <p style={secondaryTextStyle}>Loading more passages…</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {location.otConnections.length > 0 ? (
              <section data-panel-section="ot-connections">
                <hr style={sectionDividerStyle} />
                <CollapsibleSectionHeading
                  contentId={otConnectionsSectionContentId}
                  expanded={otConnectionsSectionExpanded}
                  label={otConnectionsSectionHeading}
                  onToggle={() => {
                    toggleSectionExpanded("ot-connections");
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                  sectionId="ot-connections"
                />
                <div
                  data-panel-section-content="ot-connections"
                  hidden={!otConnectionsSectionExpanded}
                  id={otConnectionsSectionContentId}
                >
                  {location.otConnections.map((connection) => (
                    <p key={`${connection.ref}:${connection.note}`} style={bodyTextStyle}>
                      <strong>{connection.ref}</strong> — {connection.note}
                      <SourceMarkers
                        onSelectSource={jumpToSource}
                        sourceOrdinalById={sourceOrdinalById}
                        sources={connection.sources}
                      />
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {sourceCitations.length > 0 ? (
              <section data-panel-section="sources">
                <hr style={sectionDividerStyle} />
                <CollapsibleSectionHeading
                  contentId={sourcesSectionContentId}
                  expanded={sourcesSectionExpanded}
                  label={sourcesSectionHeading}
                  onToggle={() => {
                    toggleSectionExpanded("sources");
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                  sectionId="sources"
                />
                <div
                  data-panel-section-content="sources"
                  hidden={!sourcesSectionExpanded}
                  id={sourcesSectionContentId}
                >
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: "22px",
                      color: tokens.color.textSecondary
                    }}
                  >
                    {sourceCitations.map((citation, index) => {
                      const sourceEntryId = `source-${index + 1}`;
                      const isHighlighted = highlightedSourceEntryId === sourceEntryId;
                      const isFocused = focusedSourceEntryId === sourceEntryId;
                      const safeCitationUrl = toSafeHttpUrl(citation.url);
                      return (
                        <li
                          data-source-entry="true"
                          id={sourceEntryId}
                          key={citation.id}
                          onBlur={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              nextFocused instanceof Node &&
                              event.currentTarget.contains(nextFocused)
                            ) {
                              return;
                            }
                            setFocusedSourceEntryId((current) =>
                              current === sourceEntryId ? null : current
                            );
                          }}
                          onFocus={() => {
                            setFocusedSourceEntryId(sourceEntryId);
                          }}
                          style={{
                            marginBottom: `${tokens.spacing.sm}px`,
                            fontSize: `${tokens.typography.bodySize}px`,
                            lineHeight: `${tokens.typography.bodyLineHeight}px`,
                            ...panelJumpTargetStyle({
                              isFocused,
                              isHighlighted,
                              prefersReducedMotion
                            })
                          }}
                          tabIndex={-1}
                        >
                          {safeCitationUrl ? (
                            <a href={safeCitationUrl} rel="noopener noreferrer" target="_blank">
                              {citation.label}
                            </a>
                          ) : (
                            citation.label
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            ) : null}

            {photoCreditEntries.length > 0 ? (
              <section data-panel-section="photo-credits">
                <hr style={sectionDividerStyle} />
                <CollapsibleSectionHeading
                  contentId={photoCreditsSectionContentId}
                  expanded={photoCreditsSectionExpanded}
                  label={photoCreditsSectionHeading}
                  onToggle={() => {
                    toggleSectionExpanded("photo-credits");
                  }}
                  prefersReducedMotion={prefersReducedMotion}
                  sectionId="photo-credits"
                />
                <div
                  data-panel-section-content="photo-credits"
                  hidden={!photoCreditsSectionExpanded}
                  id={photoCreditsSectionContentId}
                >
                  <p
                    data-photo-credits-note="true"
                    style={{
                      marginTop: 0,
                      marginBottom: `${tokens.spacing.sm}px`,
                      color: tokens.color.textSecondary,
                      fontSize: `${tokens.typography.bodySize}px`,
                      lineHeight: `${tokens.typography.bodyLineHeight}px`
                    }}
                  >
                    {PHOTO_CREDITS_NOTE}
                  </p>
                  <ol
                    data-photo-credits-list="true"
                    style={{
                      margin: 0,
                      paddingLeft: "22px",
                      color: tokens.color.textSecondary
                    }}
                  >
                    {photoCreditEntries.map((entry) => {
                      const isHighlighted = highlightedPhotoCreditId === entry.entryId;
                      const isFocused = focusedPhotoCreditId === entry.entryId;
                      return (
                        <li
                          id={entry.entryId}
                          key={entry.imageId}
                          data-photo-credits-entry="true"
                          data-photo-credit-entry-index={entry.imageIndex + 1}
                          onBlur={(event) => {
                            const nextFocused = event.relatedTarget;
                            if (
                              nextFocused instanceof Node &&
                              event.currentTarget.contains(nextFocused)
                            ) {
                              return;
                            }
                            setFocusedPhotoCreditId((current) =>
                              current === entry.entryId ? null : current
                            );
                          }}
                          onFocus={() => {
                            setFocusedPhotoCreditId(entry.entryId);
                          }}
                          style={{
                            marginBottom: `${tokens.spacing.sm}px`,
                            fontSize: `${tokens.typography.bodySize}px`,
                            lineHeight: `${tokens.typography.bodyLineHeight}px`,
                            ...panelJumpTargetStyle({
                              isFocused,
                              isHighlighted,
                              prefersReducedMotion
                            })
                          }}
                          tabIndex={-1}
                        >
                          {renderCreditSegments(entry.segments)}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            ) : null}

            <footer data-panel-section="footer">
              <hr style={sectionDividerStyle} />
              <p style={secondaryTextStyle}>
                Checked by the project&apos;s Fact-Checker · last reviewed{" "}
                {formatReviewedDate(location.lastReviewed)}
              </p>
              <a
                href={`https://github.com/jameshuangdevelop/interactive-bible-map/issues/new?title=${encodeURIComponent(`Place: ${selectedPlace.id}`)}`}
                rel="noopener noreferrer"
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

      {selectedImage && isImageViewerOpen ? (
        <div
          data-image-viewer-overlay="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeImageViewer();
            }
          }}
          style={imageViewerOverlayStyle}
        >
          <div
            aria-label="Image viewer"
            aria-modal="true"
            data-image-viewer-dialog="true"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeImageViewer();
                return;
              }

              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveImageBy(1);
                return;
              }

              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveImageBy(-1);
                return;
              }

              cycleDialogFocus(event);
            }}
            ref={imageViewerRef}
            role="dialog"
            style={imageViewerDialogStyle}
            tabIndex={-1}
          >
            <button
              aria-label="Close image viewer"
              data-image-viewer-close="true"
              onClick={closeImageViewer}
              style={imageViewerCloseButtonStyle}
              type="button"
            >
              ×
            </button>
            <WikimediaImage
              counterText={
                images.length > 1
                  ? `${normalizedActiveImageIndex + 1} / ${images.length}`
                  : null
              }
              devicePixelRatio={devicePixelRatio}
              failedImageRequests={failedImageRequests}
              frameHeight={viewerFrameHeight}
              frameWidth={viewerFrameWidth}
              image={selectedImage}
              imageObjectFit="contain"
              locationId={placeForDisplay.id}
              onNextImage={
                images.length > 1
                  ? () => {
                      moveImageBy(1);
                    }
                  : undefined
              }
              onPreviousImage={
                images.length > 1
                  ? () => {
                      moveImageBy(-1);
                    }
                  : undefined
              }
              onRequestFailure={markImageRequestFailed}
            />
          </div>
        </div>
      ) : null}

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

const closeButtonStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  border: `1px solid ${tokens.color.divider}`,
  backgroundColor: tokens.color.surface,
  cursor: "pointer",
  fontSize: "18px",
  color: tokens.color.textSecondary,
  lineHeight: 1
};

const imageViewerOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(32,33,36,0.76)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: `${tokens.spacing.md}px`,
  zIndex: 40
};

const imageViewerDialogStyle: CSSProperties = {
  width: "min(1280px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  backgroundColor: tokens.color.surface,
  borderRadius: `${tokens.radius.panel}px`,
  padding: `${tokens.spacing.md}px`,
  position: "relative",
  boxShadow: tokens.shadow.box
};

const imageViewerCloseButtonStyle: CSSProperties = {
  position: "absolute",
  top: `${tokens.spacing.sm}px`,
  right: `${tokens.spacing.sm}px`,
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  border: `1px solid ${tokens.color.divider}`,
  backgroundColor: "rgba(255,255,255,0.92)",
  color: tokens.color.textSecondary,
  cursor: "pointer",
  fontSize: "18px",
  lineHeight: 1,
  zIndex: 1
};

const imageViewerOpenButtonStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "zoom-in",
  padding: 0,
  zIndex: 0
};

function carouselButtonStyle(side: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: `${tokens.spacing.sm}px`,
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.88)",
    color: tokens.color.textSecondary,
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    zIndex: 2
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

const sectionHeadingToggleButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  borderRadius: "4px",
  color: tokens.color.textPrimary,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: `${tokens.spacing.sm}px`,
  textAlign: "left",
  fontFamily: tokens.typography.uiFont,
  fontSize: `${tokens.typography.sectionHeadingSize}px`,
  lineHeight: `${tokens.typography.sectionHeadingLineHeight}px`,
  fontWeight: 500
};

const sectionHeadingChevronContainerStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: tokens.color.textSecondary,
  flexShrink: 0
};

const sectionHeadingChevronStyle: CSSProperties = {
  width: "12px",
  height: "12px",
  display: "block",
  transformOrigin: "50% 50%"
};

const secondaryTextStyle: CSSProperties = {
  marginTop: `${tokens.spacing.xs}px`,
  marginBottom: 0,
  color: tokens.color.textSecondary,
  fontSize: `${tokens.typography.bodySize}px`,
  lineHeight: `${tokens.typography.bodyLineHeight}px`
};

const todayLineStyle: CSSProperties = {
  ...secondaryTextStyle,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: `${tokens.spacing.xs}px`
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

const aboutPlaceLinkStyle: CSSProperties = {
  ...textActionStyle,
  display: "inline",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit"
};

const showAllControlStyle: CSSProperties = {
  ...textActionStyle,
  minHeight: "44px",
  padding: "0 4px"
};
