import type { ScreeningDecisionWithEvidence } from "@/lib/validators/screening";

/** A group of potential duplicate evidence items. */
export interface DuplicateGroup {
  /** Index of the group for display. */
  groupIndex: number;
  /** Reason duplicates were detected. */
  matchType: "doi" | "external_id" | "title_similarity";
  /** The evidence items in this duplicate group. */
  items: ScreeningDecisionWithEvidence[];
}

/** Normalize a string for comparison: lowercase, strip non-alphanumeric. */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute bigrams of a string for similarity comparison.
 * Returns a Map of bigram -> count.
 */
function bigrams(str: string): Map<string, number> {
  const result = new Map<string, number>();
  const normalized = normalize(str);
  for (let i = 0; i < normalized.length - 1; i++) {
    const bigram = normalized.slice(i, i + 2);
    result.set(bigram, (result.get(bigram) ?? 0) + 1);
  }
  return result;
}

/** Dice coefficient similarity between two strings (0-1). */
function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);

  let intersection = 0;
  for (const [bigram, count] of bigramsA) {
    intersection += Math.min(count, bigramsB.get(bigram) ?? 0);
  }

  let totalA = 0;
  for (const count of bigramsA.values()) totalA += count;
  let totalB = 0;
  for (const count of bigramsB.values()) totalB += count;

  if (totalA + totalB === 0) return 0;
  return (2 * intersection) / (totalA + totalB);
}

const TITLE_SIMILARITY_THRESHOLD = 0.85;

/**
 * Detect duplicate evidence items based on DOI, external ID, and fuzzy title matching.
 * Returns groups of potential duplicates.
 */
export function detectDuplicates(
  decisions: ScreeningDecisionWithEvidence[],
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const assigned = new Set<string>();
  let groupIndex = 0;

  // Pass 1: Exact DOI match
  const doiMap = new Map<string, ScreeningDecisionWithEvidence[]>();
  for (const d of decisions) {
    const doi = d.evidence_items.doi?.trim().toLowerCase();
    if (!doi) continue;
    const existing = doiMap.get(doi) ?? [];
    existing.push(d);
    doiMap.set(doi, existing);
  }
  for (const items of doiMap.values()) {
    if (items.length > 1) {
      groups.push({ groupIndex: groupIndex++, matchType: "doi", items });
      for (const item of items) assigned.add(item.id);
    }
  }

  // Pass 2: Exact external_id match (e.g., PMID)
  const extIdMap = new Map<string, ScreeningDecisionWithEvidence[]>();
  for (const d of decisions) {
    if (assigned.has(d.id)) continue;
    const extId = d.evidence_items.external_id?.trim().toLowerCase();
    if (!extId) continue;
    const existing = extIdMap.get(extId) ?? [];
    existing.push(d);
    extIdMap.set(extId, existing);
  }
  for (const items of extIdMap.values()) {
    if (items.length > 1) {
      groups.push({
        groupIndex: groupIndex++,
        matchType: "external_id",
        items,
      });
      for (const item of items) assigned.add(item.id);
    }
  }

  // Pass 3: Fuzzy title similarity (Dice coefficient >= 0.85)
  const unassigned = decisions.filter((d) => !assigned.has(d.id));
  const titleGroups: ScreeningDecisionWithEvidence[][] = [];

  for (let i = 0; i < unassigned.length; i++) {
    if (assigned.has(unassigned[i].id)) continue;
    const group = [unassigned[i]];
    assigned.add(unassigned[i].id);

    for (let j = i + 1; j < unassigned.length; j++) {
      if (assigned.has(unassigned[j].id)) continue;
      const similarity = diceSimilarity(
        unassigned[i].evidence_items.title,
        unassigned[j].evidence_items.title,
      );
      if (similarity >= TITLE_SIMILARITY_THRESHOLD) {
        group.push(unassigned[j]);
        assigned.add(unassigned[j].id);
      }
    }

    if (group.length > 1) {
      titleGroups.push(group);
    }
  }

  for (const items of titleGroups) {
    groups.push({
      groupIndex: groupIndex++,
      matchType: "title_similarity",
      items,
    });
  }

  return groups;
}
