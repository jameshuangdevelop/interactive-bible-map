import {
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";

import type { PlaceSelection, PlaceIndexRecord } from "../features/map/types";
import {
  type HighlightRange,
  type PlaceSearchResult,
  searchPlacesByName
} from "../features/search/place-search";
import {
  ABOUT_THIS_MAP_TEXT,
  CITE_ONLY_BIBLE_VERSIONS,
  DATA_LICENSE_TEXT,
  FALLBACK_VERSATILES_SOURCES_CREDITS_MARKDOWN,
  LICENSE_DETAILS_URL,
  MAIN_BASEMAP_SOURCES_CREDITS_MARKDOWN,
  UPSTREAM_SOURCES,
  WEB_NOTICE_TEXT
} from "../features/search/sources-credits-content";
import {
  parseSafeMarkdownBlocks,
  renderInlineSafeMarkdown
} from "../features/search/safe-markdown";
import { tokens } from "../theme/tokens";

const SEARCH_RESULTS_LIMIT = 8;
const MENU_DRAWER_TITLE_ID = "app-menu-title";
const SOURCES_SECTION_ID = "app-menu-sources";
const ABOUT_SECTION_ID = "app-menu-about";
const drawerFocusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SearchMenuProps {
  places: PlaceIndexRecord[];
  inputRef: RefObject<HTMLInputElement | null>;
  onSelectPlace: (selection: PlaceSelection) => void;
}

function toOptionId(baseId: string, index: number) {
  return `${baseId}-option-${index}`;
}

function renderTextWithHighlight(text: string, highlightRange: HighlightRange | null) {
  if (!highlightRange) {
    return text;
  }

  const [start, end] = highlightRange;
  const safeStart = Math.max(0, Math.min(text.length, start));
  const safeEnd = Math.max(safeStart, Math.min(text.length, end));
  if (safeStart >= safeEnd) {
    return text;
  }

  return (
    <>
      {text.slice(0, safeStart)}
      <strong>{text.slice(safeStart, safeEnd)}</strong>
      {text.slice(safeEnd)}
    </>
  );
}

function resultAccessibleName(result: PlaceSearchResult) {
  const also = result.alsoName ? ` Also known as ${result.alsoName}.` : "";
  return `${result.title}. ${result.subtitle}.${also}`;
}

function isEditableTarget(target: EventTarget | null, searchInput: HTMLInputElement | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target === searchInput) {
    return true;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function getFocusableDrawerElements(drawerElement: HTMLElement) {
  return Array.from(drawerElement.querySelectorAll<HTMLElement>(drawerFocusableSelector)).filter(
    (element) => !element.closest("[inert]")
  );
}

function renderMarkdownBlocks(
  markdown: string,
  keyPrefix: string,
  options?: { stripLeadingHeadingLine?: boolean }
) {
  const blocks = parseSafeMarkdownBlocks(markdown, options);
  return blocks.map((block, blockIndex) => {
    if (block.kind === "paragraph") {
      return (
        <p
          key={`${keyPrefix}-paragraph-${blockIndex}`}
          style={{
            margin: blockIndex === 0 ? 0 : `${tokens.spacing.xs}px 0 0`,
            color: tokens.color.textSecondary,
            fontSize: `${tokens.typography.captionSize}px`,
            lineHeight: `${tokens.typography.captionLineHeight}px`
          }}
        >
          {renderInlineSafeMarkdown(block.text, `${keyPrefix}-paragraph-inline-${blockIndex}`)}
        </p>
      );
    }

    return (
      <ul
        key={`${keyPrefix}-list-${blockIndex}`}
        style={{
          margin: `${tokens.spacing.xs}px 0 0`,
          paddingLeft: "18px",
          color: tokens.color.textSecondary,
          fontSize: `${tokens.typography.captionSize}px`,
          lineHeight: `${tokens.typography.captionLineHeight}px`
        }}
      >
        {block.items.map((item, itemIndex) => (
          <li key={`${keyPrefix}-list-${blockIndex}-item-${itemIndex}`}>
            {renderInlineSafeMarkdown(item, `${keyPrefix}-list-inline-${blockIndex}-${itemIndex}`)}
          </li>
        ))}
      </ul>
    );
  });
}

export function SearchMenu({ places, inputRef, onSelectPlace }: SearchMenuProps) {
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerDialogRef = useRef<HTMLDivElement | null>(null);
  const drawerOverlayRef = useRef<HTMLDivElement | null>(null);
  const drawerContentRef = useRef<HTMLDivElement | null>(null);
  const backgroundInertElementsRef = useRef<HTMLElement[]>([]);

  const listboxId = useId();
  const searchQuery = query.trim();
  const results = useMemo(
    () => searchPlacesByName(places, searchQuery, SEARCH_RESULTS_LIMIT),
    [places, searchQuery]
  );

  const showSearchPanel = inputFocused && searchQuery.length > 0;
  const hasNoResults = showSearchPanel && results.length === 0;
  const listboxExpanded = showSearchPanel && (results.length > 0 || hasNoResults);
  const clampedActiveResultIndex =
    results.length === 0
      ? -1
      : activeResultIndex < 0
        ? -1
        : Math.min(activeResultIndex, results.length - 1);
  const activeOptionId =
    listboxExpanded && clampedActiveResultIndex >= 0 && clampedActiveResultIndex < results.length
      ? toOptionId(listboxId, clampedActiveResultIndex)
      : undefined;

  const clearQuery = useCallback(() => {
    setQuery("");
    setActiveResultIndex(-1);
  }, []);

  const selectResult = useCallback(
    (result: PlaceSearchResult) => {
      onSelectPlace({
        placeId: result.place.id,
        candidateIndex: null
      });
      clearQuery();
    },
    [clearQuery, onSelectPlace]
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      menuButtonRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const restoreBackgroundInteractivity = () => {
      for (const element of backgroundInertElementsRef.current) {
        element.removeAttribute("inert");
        element.removeAttribute("aria-hidden");
      }
      backgroundInertElementsRef.current = [];
    };

    const appShellRoot = menuButtonRef.current?.closest<HTMLElement>("[data-app-shell-root]");
    const drawerOverlayElement = drawerOverlayRef.current;
    if (appShellRoot && drawerOverlayElement) {
      const inertTargets = Array.from(appShellRoot.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && !child.contains(drawerOverlayElement)
      );
      for (const element of inertTargets) {
        element.setAttribute("inert", "");
        element.setAttribute("aria-hidden", "true");
      }
      backgroundInertElementsRef.current = inertTargets;
    }

    menuCloseButtonRef.current?.focus();

    const handleDrawerKeyboard = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        if (event.key !== "Tab") {
          return;
        }

        const drawerElement = drawerDialogRef.current;
        if (!drawerElement) {
          return;
        }

        const focusableElements = getFocusableDrawerElements(drawerElement);
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const focusInsideDrawer = activeElement ? drawerElement.contains(activeElement) : false;

        if (event.shiftKey) {
          if (!focusInsideDrawer || activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
          return;
        }

        if (!focusInsideDrawer || activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    };

    window.addEventListener("keydown", handleDrawerKeyboard, true);
    return () => {
      window.removeEventListener("keydown", handleDrawerKeyboard, true);
      restoreBackgroundInteractivity();
    };
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    const focusSearchFromSlash = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isEditableTarget(event.target, inputRef.current)) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      setInputFocused(true);
    };

    window.addEventListener("keydown", focusSearchFromSlash);
    return () => {
      window.removeEventListener("keydown", focusSearchFromSlash);
    };
  }, [inputRef]);

  const onInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        if (results.length === 0) {
          return;
        }

        event.preventDefault();
        setActiveResultIndex((current) => {
          if (current < 0) {
            return 0;
          }
          return Math.min(results.length - 1, current + 1);
        });
        return;
      }

      if (event.key === "ArrowUp") {
        if (results.length === 0) {
          return;
        }

        event.preventDefault();
        setActiveResultIndex((current) => {
          if (current < 0) {
            return results.length - 1;
          }
          return Math.max(0, current - 1);
        });
        return;
      }

      if (event.key === "Enter") {
        if (results.length === 0 || searchQuery.length === 0) {
          return;
        }

        event.preventDefault();
        const targetIndex = clampedActiveResultIndex >= 0 ? clampedActiveResultIndex : 0;
        const targetResult = results[targetIndex];
        if (!targetResult) {
          return;
        }

        selectResult(targetResult);
        return;
      }

      if (event.key === "Escape" && searchQuery.length > 0) {
        event.preventDefault();
        event.stopPropagation();
        clearQuery();
      }
    },
    [clampedActiveResultIndex, clearQuery, results, searchQuery.length, selectResult]
  );

  const resultAnnouncement = useMemo(() => {
    if (searchQuery.length === 0) {
      return "";
    }

    if (results.length === 0) {
      return `No places match '${searchQuery}'. Search covers place names only.`;
    }

    const label = results.length === 1 ? "result" : "results";
    return `${results.length} ${label} for '${searchQuery}'.`;
  }, [results.length, searchQuery]);

  return (
    <>
      <div
        data-testid="search-shell"
        style={{
          position: "absolute",
          top: `${tokens.spacing.md}px`,
          left: `${tokens.spacing.md}px`,
          width: "min(400px, calc(100vw - 32px))",
          zIndex: 40
        }}
      >
        <div
          style={{
            height: "48px",
            borderRadius: "999px",
            border: `1px solid ${tokens.color.divider}`,
            backgroundColor: tokens.color.surface,
            display: "flex",
            alignItems: "center",
            gap: `${tokens.spacing.sm}px`,
            paddingInline: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
            boxShadow: tokens.shadow.box
          }}
        >
          <button
            aria-label="Open app menu"
            onClick={() => {
              setMenuOpen(true);
              setInputFocused(false);
            }}
            ref={menuButtonRef}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "20px",
              border: `1px solid ${tokens.color.divider}`,
              backgroundColor: tokens.color.surface,
              color: tokens.color.textPrimary,
              cursor: "pointer"
            }}
            type="button"
          >
            ☰
          </button>
          <input
            aria-activedescendant={activeOptionId}
            aria-autocomplete="list"
            aria-controls={listboxExpanded ? listboxId : undefined}
            aria-expanded={listboxExpanded}
            aria-haspopup="listbox"
            aria-label="Search biblical places"
            onBlur={() => {
              setInputFocused(false);
              setActiveResultIndex(-1);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveResultIndex(-1);
            }}
            onFocus={() => {
              setInputFocused(true);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search biblical places"
            ref={inputRef}
            role="combobox"
            style={{
              border: "none",
              flex: 1,
              color: tokens.color.textPrimary,
              backgroundColor: "transparent",
              fontFamily: tokens.typography.uiFont,
              fontSize: `${tokens.typography.bodySize}px`,
              outline: "none"
            }}
            type="search"
            value={query}
          />
          {query.length > 0 ? (
            <button
              aria-label="Clear search"
              onClick={() => {
                clearQuery();
                inputRef.current?.focus();
              }}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "14px",
                border: `1px solid ${tokens.color.divider}`,
                backgroundColor: tokens.color.surface,
                color: tokens.color.textSecondary,
                cursor: "pointer"
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>

        {showSearchPanel ? (
          results.length > 0 ? (
            <div
              aria-label="Place search results"
              data-testid="search-results-list"
              id={listboxId}
              role="listbox"
              style={{
                marginTop: `${tokens.spacing.sm}px`,
                borderRadius: `${tokens.radius.panel}px`,
                border: `1px solid ${tokens.color.divider}`,
                backgroundColor: tokens.color.surface,
                boxShadow: tokens.shadow.box
              }}
            >
              {results.map((result, index) => {
                const optionId = toOptionId(listboxId, index);
                const active = index === clampedActiveResultIndex;
                return (
                  <div
                    aria-label={resultAccessibleName(result)}
                    aria-selected={active}
                    id={optionId}
                    key={`${result.place.id}:${result.matchedName}`}
                    onClick={() => {
                      selectResult(result);
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => {
                      setActiveResultIndex(index);
                    }}
                    role="option"
                    style={{
                      cursor: "pointer",
                      padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                      borderTop:
                        index === 0 ? "none" : `1px solid ${tokens.color.subtleSurface}`,
                      backgroundColor: active ? tokens.color.subtleSurface : tokens.color.surface
                    }}
                  >
                    <div
                      style={{
                        color: tokens.color.textPrimary,
                        fontSize: `${tokens.typography.bodySize}px`,
                        lineHeight: `${tokens.typography.bodyLineHeight}px`
                      }}
                    >
                      {renderTextWithHighlight(result.title, result.titleHighlightRange)}
                      {result.alsoName ? (
                        <>
                          {" — also: "}
                          {renderTextWithHighlight(result.alsoName, result.alsoNameHighlightRange)}
                        </>
                      ) : null}
                    </div>
                    <div
                      style={{
                        color: tokens.color.textSecondary,
                        fontSize: `${tokens.typography.captionSize}px`,
                        lineHeight: `${tokens.typography.captionLineHeight}px`
                      }}
                    >
                      {result.subtitle}
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  borderTop: `1px solid ${tokens.color.divider}`,
                  padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
                  color: tokens.color.textSecondary,
                  fontSize: `${tokens.typography.captionSize}px`,
                  lineHeight: `${tokens.typography.captionLineHeight}px`
                }}
              >
                ↑ ↓ to move · Enter to open · Esc to clear
              </div>
            </div>
          ) : (
            <div
              aria-live="polite"
              data-testid="search-no-results"
              role="status"
              style={{
                marginTop: `${tokens.spacing.sm}px`,
                borderRadius: `${tokens.radius.panel}px`,
                border: `1px solid ${tokens.color.divider}`,
                backgroundColor: tokens.color.surface,
                boxShadow: tokens.shadow.box,
                padding: `${tokens.spacing.md}px`
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: tokens.color.textPrimary,
                  fontSize: `${tokens.typography.bodySize}px`,
                  lineHeight: `${tokens.typography.bodyLineHeight}px`
                }}
              >
                {`No places match '${searchQuery}'.`}
              </p>
              <p
                style={{
                  margin: `${tokens.spacing.xs}px 0 0`,
                  color: tokens.color.textSecondary,
                  fontSize: `${tokens.typography.captionSize}px`,
                  lineHeight: `${tokens.typography.captionLineHeight}px`
                }}
              >
                Search covers place names only.
              </p>
            </div>
          )
        ) : null}
      </div>

      <div
        aria-live="polite"
        role="status"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0
        }}
      >
        {resultAnnouncement}
      </div>

      {menuOpen ? (
        <div
          ref={drawerOverlayRef}
          onClick={closeMenu}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(32,33,36,0.32)",
            zIndex: 45
          }}
        >
          <div
            aria-labelledby={MENU_DRAWER_TITLE_ID}
            aria-modal="true"
            data-testid="app-menu-drawer"
            onClick={(event) => {
              event.stopPropagation();
            }}
            ref={drawerDialogRef}
            role="dialog"
            style={{
              position: "absolute",
              top: `${tokens.spacing.md}px`,
              left: `${tokens.spacing.md}px`,
              width: "min(460px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 32px)",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${tokens.color.divider}`,
              borderRadius: `${tokens.radius.panel}px`,
              backgroundColor: tokens.color.surface,
              boxShadow: tokens.shadow.box
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${tokens.spacing.md}px ${tokens.spacing.md}px ${tokens.spacing.sm}px`
              }}
            >
              <h2
                id={MENU_DRAWER_TITLE_ID}
                style={{
                  margin: 0,
                  color: tokens.color.textPrimary,
                  fontSize: `${tokens.typography.sectionHeadingSize}px`,
                  lineHeight: `${tokens.typography.sectionHeadingLineHeight}px`,
                  fontWeight: 500
                }}
              >
                Menu
              </h2>
              <button
                aria-label="Close app menu"
                onClick={closeMenu}
                ref={menuCloseButtonRef}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "16px",
                  border: `1px solid ${tokens.color.divider}`,
                  backgroundColor: tokens.color.surface,
                  color: tokens.color.textPrimary,
                  cursor: "pointer"
                }}
                type="button"
              >
                ×
              </button>
            </div>

            <div
              ref={drawerContentRef}
              style={{
                overflowY: "auto",
                padding: `0 ${tokens.spacing.md}px ${tokens.spacing.md}px`
              }}
            >
              <nav
                aria-label="Menu entries"
                style={{
                  display: "flex",
                  gap: `${tokens.spacing.sm}px`,
                  flexWrap: "wrap",
                  marginBottom: `${tokens.spacing.md}px`
                }}
              >
                <button
                  onClick={() => {
                    document.getElementById(ABOUT_SECTION_ID)?.scrollIntoView({
                      block: "start",
                      behavior: "smooth"
                    });
                  }}
                  style={{
                    borderRadius: "999px",
                    border: `1px solid ${tokens.color.divider}`,
                    backgroundColor: tokens.color.surface,
                    padding: "6px 10px",
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  About this map
                </button>
                <button
                  onClick={() => {
                    document.getElementById(SOURCES_SECTION_ID)?.scrollIntoView({
                      block: "start",
                      behavior: "smooth"
                    });
                  }}
                  style={{
                    borderRadius: "999px",
                    border: `1px solid ${tokens.color.divider}`,
                    backgroundColor: tokens.color.surface,
                    padding: "6px 10px",
                    cursor: "pointer"
                  }}
                  type="button"
                >
                  Sources & credits
                </button>
                <a
                  href="https://github.com/jameshuangdevelop/interactive-bible-map/issues/new"
                  rel="noopener noreferrer"
                  style={{
                    borderRadius: "999px",
                    border: `1px solid ${tokens.color.divider}`,
                    color: tokens.color.textPrimary,
                    textDecoration: "none",
                    padding: "6px 10px"
                  }}
                  target="_blank"
                >
                  Report an issue
                </a>
                <a
                  href="https://github.com/jameshuangdevelop/interactive-bible-map"
                  rel="noopener noreferrer"
                  style={{
                    borderRadius: "999px",
                    border: `1px solid ${tokens.color.divider}`,
                    color: tokens.color.textPrimary,
                    textDecoration: "none",
                    padding: "6px 10px"
                  }}
                  target="_blank"
                >
                  View on GitHub
                </a>
              </nav>

              <section
                aria-labelledby={`${ABOUT_SECTION_ID}-heading`}
                id={ABOUT_SECTION_ID}
                style={{ marginBottom: `${tokens.spacing.lg}px` }}
              >
                <h3
                  id={`${ABOUT_SECTION_ID}-heading`}
                  style={{
                    margin: 0,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.bodySize}px`,
                    lineHeight: `${tokens.typography.bodyLineHeight}px`
                  }}
                >
                  About this map
                </h3>
                <p
                  style={{
                    margin: `${tokens.spacing.sm}px 0 0`,
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.bodySize}px`,
                    lineHeight: `${tokens.typography.bodyLineHeight}px`
                  }}
                >
                  {ABOUT_THIS_MAP_TEXT}
                </p>
              </section>

              <section
                aria-labelledby={`${SOURCES_SECTION_ID}-heading`}
                id={SOURCES_SECTION_ID}
                style={{ marginBottom: `${tokens.spacing.sm}px` }}
              >
                <h3
                  id={`${SOURCES_SECTION_ID}-heading`}
                  style={{
                    margin: 0,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.bodySize}px`,
                    lineHeight: `${tokens.typography.bodyLineHeight}px`
                  }}
                >
                  Sources & credits
                </h3>
                <p
                  data-testid="credits-data-license"
                  style={{
                    margin: `${tokens.spacing.sm}px 0 0`,
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  {DATA_LICENSE_TEXT}{" "}
                  (
                  <a href={LICENSE_DETAILS_URL} rel="noopener noreferrer" target="_blank">
                    full license details
                  </a>
                  ).
                </p>
                <p
                  data-testid="credits-web-notice"
                  style={{
                    margin: `${tokens.spacing.sm}px 0 0`,
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  {renderInlineSafeMarkdown(WEB_NOTICE_TEXT, "web-notice")}
                </p>
                <h4
                  style={{
                    margin: `${tokens.spacing.md}px 0 ${tokens.spacing.xs}px`,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  Map
                </h4>
                <div
                  data-testid="credits-map-markdown"
                  style={{
                    margin: 0
                  }}
                >
                  {renderMarkdownBlocks(MAIN_BASEMAP_SOURCES_CREDITS_MARKDOWN, "map-markdown", {
                    stripLeadingHeadingLine: true
                  })}
                </div>
                <h4
                  style={{
                    margin: `${tokens.spacing.md}px 0 ${tokens.spacing.xs}px`,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  Backup map (shown only when the main map can&apos;t load)
                </h4>
                <div
                  data-testid="credits-backup-map-markdown"
                  style={{
                    margin: 0
                  }}
                >
                  {renderMarkdownBlocks(
                    FALLBACK_VERSATILES_SOURCES_CREDITS_MARKDOWN,
                    "backup-map-markdown",
                    {
                      stripLeadingHeadingLine: true
                    }
                  )}
                </div>
                <h4
                  style={{
                    margin: `${tokens.spacing.md}px 0 ${tokens.spacing.xs}px`,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  Data sources
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  {UPSTREAM_SOURCES.map((source) => (
                    <li key={source.name}>
                      {source.url ? (
                        renderInlineSafeMarkdown(
                          `[${source.name}](${source.url})`,
                          `upstream-source-${source.name}`
                        )
                      ) : (
                        renderInlineSafeMarkdown(
                          source.name,
                          `upstream-source-${source.name}`
                        )
                      )}
                      {source.note ? ` — ${source.note}` : ""}
                    </li>
                  ))}
                </ul>
                <h4
                  style={{
                    margin: `${tokens.spacing.md}px 0 ${tokens.spacing.xs}px`,
                    color: tokens.color.textPrimary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  Cite-only Bible versions used for place-name spellings
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "18px",
                    color: tokens.color.textSecondary,
                    fontSize: `${tokens.typography.captionSize}px`,
                    lineHeight: `${tokens.typography.captionLineHeight}px`
                  }}
                >
                  {CITE_ONLY_BIBLE_VERSIONS.map((version) => (
                    <li key={version}>{version}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
