/**
 * Calculate inverse-variance weight from confidence interval bounds.
 *
 * Uses the standard formula: weight = 1 / SE^2, where
 * SE = (CI_upper - CI_lower) / (2 * 1.96) for a 95% CI.
 *
 * @param ciLower - Lower bound of the 95% confidence interval.
 * @param ciUpper - Upper bound of the 95% confidence interval.
 * @returns The inverse-variance weight, or 0 if inputs are invalid.
 */
export function calculateInverseVarianceWeight(
  ciLower: number,
  ciUpper: number,
): number {
  const se = (ciUpper - ciLower) / (2 * 1.96);
  if (se <= 0 || !isFinite(se)) return 0;
  return 1 / (se * se);
}
