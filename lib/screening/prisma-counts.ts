import type { ScreeningStageCounts } from "@/lib/validators/screening";

/** PRISMA 2020 flow diagram box values computed from screening counts. */
export interface PrismaFlowData {
  /** Total records identified from databases/registers. */
  identified: number;
  /** Records removed as duplicates. */
  duplicatesRemoved: number;
  /** Records screened (after duplicate removal). */
  screened: number;
  /** Records excluded at screening. */
  screeningExcluded: number;
  /** Full-text articles assessed for eligibility. */
  eligibilityAssessed: number;
  /** Full-text articles excluded with reasons. */
  eligibilityExcluded: number;
  /** Studies included in the review. */
  included: number;
}

/** Compute PRISMA flow counts from screening stage counts. */
export function computePrismaCounts(
  counts: ScreeningStageCounts,
): PrismaFlowData {
  const id = counts.identification;
  const sc = counts.screening;
  const el = counts.eligibility;
  const inc = counts.included;

  return {
    identified: id.total,
    duplicatesRemoved: id.duplicate,
    screened: sc.total,
    screeningExcluded: sc.exclude,
    eligibilityAssessed: el.total,
    eligibilityExcluded: el.exclude,
    included: inc.total > 0 ? inc.include + inc.pending : el.include,
  };
}
