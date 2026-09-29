const MAP_AREA_EDGE_PADDING_PX = 16;

export function getScaleControlLeftOffset(leftPanelWidth: number) {
  const panelInset = Math.max(0, leftPanelWidth);
  return panelInset + MAP_AREA_EDGE_PADDING_PX;
}
