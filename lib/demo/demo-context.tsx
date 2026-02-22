"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEMO_PROTOCOL,
  DEMO_EVIDENCE_ITEMS,
  DEMO_SCREENING_DECISIONS,
  DEMO_SCREENING_COUNTS,
} from "@/lib/demo/demo-data";

/**
 * Shape of the demo context — all static, no mutations.
 */
interface DemoContextValue {
  isDemo: true;
  protocol: typeof DEMO_PROTOCOL;
  evidenceItems: typeof DEMO_EVIDENCE_ITEMS;
  screeningDecisions: typeof DEMO_SCREENING_DECISIONS;
  counts: typeof DEMO_SCREENING_COUNTS;
}

const DemoContext = createContext<DemoContextValue | null>(null);

/**
 * Provides static demo data to all `/demo` pages.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const value: DemoContextValue = {
    isDemo: true,
    protocol: DEMO_PROTOCOL,
    evidenceItems: DEMO_EVIDENCE_ITEMS,
    screeningDecisions: DEMO_SCREENING_DECISIONS,
    counts: DEMO_SCREENING_COUNTS,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

/**
 * Hook to access demo data. Throws if used outside DemoProvider.
 */
export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return ctx;
}
