import type { CSSProperties } from "react";

import { tokens } from "../theme/tokens";

export const collapsibleHeadingButtonStyle: CSSProperties = {
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
  fontWeight: 500,
  outlineOffset: "2px"
};

export const collapsibleHeadingChevronContainerStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: tokens.color.textSecondary,
  flexShrink: 0
};

export const collapsibleHeadingChevronStyle: CSSProperties = {
  width: "12px",
  height: "12px",
  display: "block",
  transformOrigin: "50% 50%"
};

export function CollapsibleChevron({
  expanded,
  prefersReducedMotion
}: {
  expanded: boolean;
  prefersReducedMotion: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        ...collapsibleHeadingChevronStyle,
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
  );
}
