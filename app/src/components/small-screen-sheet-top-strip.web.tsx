import { type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";

import { tokens } from "../theme/tokens";

const STRIP_HEIGHT_PX = 44;
const STRIP_STICKY_TOP_OVERLAP_PX = tokens.spacing.md;

interface SmallScreenSheetTopStripProps {
  stripId: "place" | "route-list" | "route-stop";
  expanded: boolean;
  focused: boolean;
  onHandleBlur: () => void;
  onHandleClick: () => void;
  onHandleFocus: () => void;
  onHandlePointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  rightAction?: ReactNode;
}

export function SmallScreenSheetTopStrip({
  stripId,
  expanded,
  focused,
  onHandleBlur,
  onHandleClick,
  onHandleFocus,
  onHandlePointerDown,
  rightAction
}: SmallScreenSheetTopStripProps) {
  const stripContainerStyle: CSSProperties = {
    position: "sticky",
    top: `-${STRIP_STICKY_TOP_OVERLAP_PX}px`,
    marginTop: `-${STRIP_STICKY_TOP_OVERLAP_PX}px`,
    boxSizing: "border-box",
    height: `${STRIP_HEIGHT_PX + STRIP_STICKY_TOP_OVERLAP_PX}px`,
    minHeight: `${STRIP_HEIGHT_PX + STRIP_STICKY_TOP_OVERLAP_PX}px`,
    paddingTop: `${STRIP_STICKY_TOP_OVERLAP_PX}px`,
    marginBottom: `${tokens.spacing.sm}px`,
    backgroundColor: tokens.color.surface,
    touchAction: "none",
    zIndex: 3
  };
  const stripDragTargetStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    border: "none",
    padding: 0,
    margin: 0,
    backgroundColor: "rgba(0, 0, 0, 0.001)",
    pointerEvents: "auto",
    touchAction: "none",
    cursor: "grab",
    zIndex: 1
  };
  const handleStyle: CSSProperties = {
    width: "44px",
    height: "44px",
    border: "none",
    borderRadius: "999px",
    backgroundColor: "transparent",
    touchAction: "none",
    cursor: "pointer",
    padding: 0,
    position: "absolute",
    left: "50%",
    top: `${STRIP_STICKY_TOP_OVERLAP_PX}px`,
    transform: "translateX(-50%)",
    zIndex: 2,
    outline: focused ? `2px solid ${tokens.color.accent}` : "none",
    outlineOffset: "2px"
  };

  return (
    <div data-sheet-drag-strip-container={stripId} style={stripContainerStyle}>
      <div
        aria-hidden="true"
        data-sheet-drag-strip={stripId}
        style={stripDragTargetStyle}
      />
      <button
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse details" : "Expand details"}
        data-sheet-handle={stripId}
        onBlur={onHandleBlur}
        onClick={onHandleClick}
        onFocus={onHandleFocus}
        onPointerDown={onHandlePointerDown}
        style={handleStyle}
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
      {rightAction ? (
        <div
          style={{
            position: "absolute",
            top: `${STRIP_STICKY_TOP_OVERLAP_PX}px`,
            right: 0,
            height: `${STRIP_HEIGHT_PX}px`,
            display: "flex",
            alignItems: "center",
            zIndex: 2
          }}
        >
          {rightAction}
        </div>
      ) : null}
    </div>
  );
}
