const SCALE_DISTANCE_LEADING_STEPS = [1, 2, 3, 5, 10] as const;

export function roundScaleDistanceMeters(valueMeters: number) {
  if (!Number.isFinite(valueMeters) || valueMeters <= 0) {
    return 0;
  }

  const power = Math.pow(10, Math.floor(Math.log10(valueMeters)));
  const normalized = valueMeters / power;
  const candidate =
    [...SCALE_DISTANCE_LEADING_STEPS].reverse().find((step) => step <= normalized) ?? 1;
  return candidate * power;
}
