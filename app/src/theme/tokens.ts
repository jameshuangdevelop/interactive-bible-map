export const tokens = {
  color: {
    textPrimary: "#202124",
    textSecondary: "#5F6368",
    surface: "#FFFFFF",
    subtleSurface: "#F1F3F4",
    divider: "#DADCE0",
    accent: "#1A73E8",
    confidenceHighText: "#137333",
    confidenceHighBackground: "#E6F4EA",
    confidenceMediumText: "#9A5200",
    confidenceMediumBackground: "#FEF7E0",
    confidenceLowText: "#5F6368",
    confidenceLowBackground: "#F1F3F4",
    confidenceDisputedText: "#A50E0E",
    confidenceDisputedBackground: "#FCE8E6"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24
  },
  radius: {
    panel: 8,
    chip: 16,
    button: 20
  },
  shadow: {
    elevation: 6,
    color: "rgba(60,64,67,0.3)",
    box:
      "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)"
  },
  typography: {
    uiFont: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    scriptureFont: 'Georgia, "Noto Serif", "Times New Roman", serif',
    titleSize: 22,
    titleLineHeight: 28,
    sectionHeadingSize: 16,
    sectionHeadingLineHeight: 24,
    bodySize: 14,
    bodyLineHeight: 20,
    scriptureSize: 15,
    scriptureLineHeight: 24,
    captionSize: 12,
    captionLineHeight: 16
  }
} as const;
