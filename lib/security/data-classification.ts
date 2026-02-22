// =============================================================================
// DATA CLASSIFICATION
// =============================================================================
// Field-level data classification for export filtering and HIPAA compliance.
// Each field in a resource type is assigned a classification level that
// determines its visibility at different access tiers.
//
// Levels (ascending sensitivity):
//   public       — openly available information (e.g., published DOIs)
//   internal     — organization-internal, not publicly disclosed
//   confidential — restricted to authorized personnel only
//   phi          — Protected Health Information (HIPAA-regulated)
// =============================================================================

/** Data classification levels, ordered by sensitivity. */
export const classificationLevels = [
  "public",
  "internal",
  "confidential",
  "phi",
] as const;

export type ClassificationLevel = (typeof classificationLevels)[number];

/** Numeric ordering for classification comparison. */
const LEVEL_ORDER: Record<ClassificationLevel, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  phi: 3,
};

/** Field classification map per resource type. */
export const FIELD_CLASSIFICATIONS: Record<
  string,
  Record<string, ClassificationLevel>
> = {
  protocols: {
    id: "internal",
    title: "internal",
    study_question: "internal",
    population: "confidential",
    intervention: "internal",
    comparator: "internal",
    outcomes: "internal",
    design: "public",
    status: "internal",
    user_id: "confidential",
    created_at: "internal",
    updated_at: "internal",
  },
  evidence_items: {
    id: "internal",
    title: "public",
    authors: "public",
    doi: "public",
    journal: "public",
    description: "internal",
    tags: "internal",
    user_id: "confidential",
  },
  datasets: {
    id: "internal",
    name: "internal",
    description: "internal",
    file_name: "internal",
    storage_path: "confidential",
    user_id: "confidential",
    metadata: "confidential",
  },
  screening_decisions: {
    id: "internal",
    decision: "internal",
    notes: "confidential",
    decided_by: "confidential",
  },
};

/**
 * Filter an object to only include fields at or below a given classification level.
 *
 * @param resourceType - The resource type key in FIELD_CLASSIFICATIONS.
 * @param data - The data object to filter.
 * @param maxLevel - The maximum classification level to include.
 * @returns A filtered copy of the data with only permitted fields.
 */
export function filterByClassification(
  resourceType: string,
  data: Record<string, unknown>,
  maxLevel: ClassificationLevel,
): Record<string, unknown> {
  const classifications = FIELD_CLASSIFICATIONS[resourceType];
  if (!classifications) return data;

  const maxLevelNum = LEVEL_ORDER[maxLevel];
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const fieldLevel = classifications[key] ?? "internal";
    if (LEVEL_ORDER[fieldLevel] <= maxLevelNum) {
      filtered[key] = value;
    }
  }

  return filtered;
}

/**
 * Get all PHI fields for a resource type (for HIPAA compliance checks).
 *
 * @param resourceType - The resource type key in FIELD_CLASSIFICATIONS.
 * @returns An array of field names classified as PHI.
 */
export function getPhiFields(resourceType: string): string[] {
  const classifications = FIELD_CLASSIFICATIONS[resourceType];
  if (!classifications) return [];

  return Object.entries(classifications)
    .filter(([, level]) => level === "phi")
    .map(([field]) => field);
}

/**
 * Get all resource types that have classification definitions.
 *
 * @returns An array of resource type names.
 */
export function getClassifiedResourceTypes(): string[] {
  return Object.keys(FIELD_CLASSIFICATIONS);
}

/**
 * Get the classification summary for a resource type.
 * Returns a count of fields at each classification level.
 *
 * @param resourceType - The resource type key in FIELD_CLASSIFICATIONS.
 * @returns A record mapping each level to its field count, or null if not defined.
 */
export function getClassificationSummary(
  resourceType: string,
): Record<ClassificationLevel, number> | null {
  const classifications = FIELD_CLASSIFICATIONS[resourceType];
  if (!classifications) return null;

  const summary: Record<ClassificationLevel, number> = {
    public: 0,
    internal: 0,
    confidential: 0,
    phi: 0,
  };

  for (const level of Object.values(classifications)) {
    summary[level]++;
  }

  return summary;
}
