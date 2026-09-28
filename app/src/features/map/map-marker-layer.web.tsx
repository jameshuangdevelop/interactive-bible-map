import type { MouseEvent } from "react";

export type ScreenMarkerKind = "pin" | "candidate-pin" | "region-label" | "cluster";

export interface ScreenMarker {
  id: string;
  kind: ScreenMarkerKind;
  x: number;
  y: number;
  selected: boolean;
  accessibleName: string;
  title: string;
  color: string;
  inlineLabel?: string;
  showInlineLabel?: boolean;
  showQuestionBadge?: boolean;
  candidateLetter?: string;
  clusterCount?: number;
}

interface MapMarkerLayerProps {
  markers: ScreenMarker[];
  onMarkerActivate: (marker: ScreenMarker) => void;
}

const focusRingStyles = `
.ibm-map-marker:focus-visible {
  outline: 2px solid #1A73E8;
  outline-offset: 2px;
}
`;

function getPinDotSize(marker: ScreenMarker) {
  if (marker.selected) {
    return 21;
  }

  return 16;
}

function pinDotStyles(marker: ScreenMarker) {
  const size = getPinDotSize(marker);
  const isCandidate = marker.kind === "candidate-pin";

  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "999px",
    border: `2px ${isCandidate ? "dashed" : "solid"} #FFFFFF`,
    backgroundColor: marker.color,
    color: "#FFFFFF",
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: isCandidate ? "11px" : "0px",
    fontWeight: 700,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: marker.selected
      ? "0 2px 8px rgba(60,64,67,0.5)"
      : "0 1px 2px rgba(60,64,67,0.35)"
  } as const;
}

function clusterBubbleStyles(marker: ScreenMarker) {
  return {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    border: "3px solid #FFFFFF",
    backgroundColor: marker.color,
    color: "#FFFFFF",
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(60,64,67,0.35)"
  } as const;
}

function regionLabelStyles(marker: ScreenMarker) {
  return {
    border: "none",
    background: "transparent",
    color: marker.color,
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "12px",
    letterSpacing: "2px",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    padding: "2px 4px",
    textShadow:
      "-1px 0 0 rgba(255,255,255,0.95), 0 1px 0 rgba(255,255,255,0.95), 1px 0 0 rgba(255,255,255,0.95), 0 -1px 0 rgba(255,255,255,0.95)"
  };
}

function inlinePinLabelStyles() {
  return {
    position: "absolute" as const,
    left: "calc(50% + 12px)",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#202124",
    fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap" as const,
    textShadow:
      "-1px 0 0 rgba(255,255,255,0.95), 0 1px 0 rgba(255,255,255,0.95), 1px 0 0 rgba(255,255,255,0.95), 0 -1px 0 rgba(255,255,255,0.95), -1px -1px 0 rgba(255,255,255,0.95), 1px 1px 0 rgba(255,255,255,0.95)"
  };
}

function markerButtonStyles(marker: ScreenMarker) {
  const regionLabel = marker.kind === "region-label";

  return {
    position: "absolute" as const,
    left: `${marker.x}px`,
    top: `${marker.y}px`,
    transform: "translate(-50%, -50%)",
    cursor: "pointer",
    pointerEvents: "auto" as const,
    touchAction: "manipulation" as const,
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    width: regionLabel ? "auto" : "44px",
    height: "44px",
    minWidth: "44px",
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  };
}

function renderMarkerContent(marker: ScreenMarker) {
  if (marker.kind === "region-label") {
    return <span style={regionLabelStyles(marker)}>{marker.inlineLabel ?? marker.title}</span>;
  }

  if (marker.kind === "cluster") {
    return (
      <span data-marker-cluster-bubble style={clusterBubbleStyles(marker)}>
        {marker.clusterCount}
      </span>
    );
  }

  return (
    <>
      <span data-marker-dot style={pinDotStyles(marker)}>
        {marker.kind === "candidate-pin" ? marker.candidateLetter : null}
      </span>
      {marker.inlineLabel && marker.showInlineLabel !== false ? (
        <span data-marker-inline-label style={inlinePinLabelStyles()}>
          {marker.inlineLabel}
        </span>
      ) : null}
    </>
  );
}

export function MapMarkerLayer({ markers, onMarkerActivate }: MapMarkerLayerProps) {
  return (
    <div
      aria-hidden={false}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none"
      }}
    >
      <style>{focusRingStyles}</style>
      {markers.map((marker) => (
        <button
          key={marker.id}
          aria-label={marker.accessibleName}
          className="ibm-map-marker"
          data-marker-id={marker.id}
          data-marker-kind={marker.kind}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onMarkerActivate(marker);
          }}
          style={markerButtonStyles(marker)}
          title={marker.title}
          type="button"
        >
          {renderMarkerContent(marker)}
          {marker.showQuestionBadge ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: "calc(50% + 3px)",
                top: "calc(50% - 13px)",
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                border: "1px solid #FFFFFF",
                backgroundColor: "#FFFFFF",
                color: "#5F6368",
                fontFamily: 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: "10px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ?
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
