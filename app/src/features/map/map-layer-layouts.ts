export const CLUSTER_COUNT_LAYOUT = {
  "text-field": ["get", "point_count_abbreviated"],
  "text-font": ["Noto Sans Bold"],
  "text-size": 12,
  "text-allow-overlap": true,
  "text-ignore-placement": true
} as const;

export const QUESTION_BADGE_LAYOUT = {
  "icon-size": 1,
  "icon-anchor": "top-right",
  "icon-offset": [0.45, -0.45] as [number, number],
  "icon-allow-overlap": true,
  "icon-ignore-placement": true
} as const;

export const PIN_COLLISION_LAYOUT = {
  "icon-size": 1,
  "icon-allow-overlap": true,
  "icon-ignore-placement": false
} as const;
