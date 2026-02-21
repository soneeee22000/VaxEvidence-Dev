/**
 * Collaborator colors and deterministic assignment.
 *
 * Uses 8 OKLCH colors that remain readable on both dark and light
 * backgrounds. A simple hash of the userId picks the color, so the
 * same user always gets the same color within a session.
 */

/** 8 distinct OKLCH collaborator accent colors. */
export const COLLABORATOR_COLORS = [
  "oklch(0.72 0.19 29)", // coral
  "oklch(0.72 0.17 142)", // emerald
  "oklch(0.72 0.18 250)", // blue
  "oklch(0.72 0.16 330)", // purple
  "oklch(0.72 0.18 60)", // amber
  "oklch(0.72 0.17 180)", // teal
  "oklch(0.72 0.19 350)", // pink
  "oklch(0.72 0.15 100)", // lime
] as const;

/** Tailwind ring color classes matching the OKLCH palette above. */
export const COLLABORATOR_RING_CLASSES = [
  "ring-red-400",
  "ring-emerald-400",
  "ring-blue-400",
  "ring-purple-400",
  "ring-amber-400",
  "ring-teal-400",
  "ring-pink-400",
  "ring-lime-400",
] as const;

/** Tailwind background color classes for avatar circles. */
export const COLLABORATOR_BG_CLASSES = [
  "bg-red-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-lime-500",
] as const;

/**
 * Deterministically assigns a color index to a userId via a simple
 * hash. The same userId always maps to the same color.
 */
export function getUserColorIndex(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % COLLABORATOR_COLORS.length;
}

/** Returns the OKLCH color string for a given userId. */
export function getUserColor(userId: string): string {
  return COLLABORATOR_COLORS[getUserColorIndex(userId)];
}
