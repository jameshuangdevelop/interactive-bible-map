export const CLUSTER_COUNT_LAYOUT = {
  "text-field": ["get", "point_count_abbreviated"] as ["get", string],
  "text-font": ["Noto Sans Bold"] as [string],
  "text-size": 12,
  "text-allow-overlap": true as const,
  "text-ignore-placement": true as const
};

export const QUESTION_BADGE_LAYOUT = {
  "icon-size": 1,
  "icon-anchor": "bottom-left" as const,
  "icon-offset": [-0.15, 0.15] as [number, number],
  "icon-allow-overlap": true as const,
  "icon-ignore-placement": true as const
};

export const PIN_COLLISION_LAYOUT = {
  "icon-size": 1,
  "icon-anchor": "center" as const,
  "icon-allow-overlap": true as const,
  "icon-ignore-placement": false as const
};

export const PIN_COLLISION_IMAGE_SIZE = 36;
export const CLUSTER_COLLISION_IMAGE_SIZE = 44;
