export const ANCIENT_LAYER_STYLE = {
  areaFill: {
    romanProvince: { color: "#B3261E", opacity: 0.06 },
    client: { color: "#E8A33D", opacity: 0.12 },
    outsideEmpire: { color: "#5F6368", opacity: 0.06 }
  },
  border: {
    stateColor: "hsl(0, 0%, 55%)",
    disputedColor: "hsl(248, 1%, 41%)"
  },
  roads: {
    casingColor: "#e9ac77",
    knownColor: "#fea"
  },
  coastline: {
    lineColor: "#a0c8f0",
    labelColor: "#74aee9",
    labelHaloColor: "rgba(255,255,255,0.7)"
  },
  uncertain: {
    hatchColor: "#80868B"
  }
} as const;
