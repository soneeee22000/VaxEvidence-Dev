"use client";

import { useEffect, useState } from "react";

interface SpotlightHighlightProps {
  /** data-onboarding-id of the target element. Null means no spotlight. */
  targetId: string | null;
  /** Padding around the target element. */
  padding?: number;
}

/**
 * Compute the CSS clip-path for a spotlight cutout around a DOM element.
 */
function getClipPathForElement(
  targetId: string | null,
  padding: number,
): string | null {
  if (!targetId) return null;

  const el = document.querySelector(`[data-onboarding-id="${targetId}"]`);
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  const x = rect.left - padding;
  const y = rect.top - padding;
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 8;

  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x + r}px ${y}px, ${x + w - r}px ${y}px, ${x + w}px ${y + r}px, ${x + w}px ${y + h - r}px, ${x + w - r}px ${y + h}px, ${x + r}px ${y + h}px, ${x}px ${y + h - r}px, ${x}px ${y + r}px, ${x + r}px ${y}px)`;
}

/**
 * Full-screen dark overlay with a CSS clip-path cutout around a target element.
 * Uses ResizeObserver for repositioning.
 */
export function SpotlightHighlight({
  targetId,
  padding = 8,
}: SpotlightHighlightProps) {
  const [clipPath, setClipPath] = useState<string | null>(null);

  useEffect(() => {
    /** Recompute clip-path via rAF to avoid synchronous setState in effect. */
    const refresh = () => {
      requestAnimationFrame(() => {
        setClipPath(getClipPathForElement(targetId, padding));
      });
    };

    refresh();

    if (!targetId) return;

    const el = document.querySelector(`[data-onboarding-id="${targetId}"]`);
    if (!el) return;

    const observer = new ResizeObserver(refresh);
    observer.observe(el);
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [targetId, padding]);

  if (!clipPath) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 transition-[clip-path] duration-300 ease-out pointer-events-auto"
      style={{ clipPath }}
      aria-hidden="true"
    />
  );
}
