"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ONBOARDING_STEPS, type OnboardingStep } from "./onboarding-steps";
import { seedSampleProtocol } from "@/lib/demo/sample-protocol";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/browser";
import { trackEvent } from "@/lib/analytics/track-event";

const LOCALSTORAGE_KEY = "vax-onboarding-complete";
const CHECKLIST_DISMISSED_KEY = "vax-checklist-dismissed";

interface OnboardingContextValue {
  /** Whether the onboarding overlay is currently visible. */
  isOnboarding: boolean;
  /** Current step definition. */
  currentStep: OnboardingStep | null;
  /** Current step index (0-based). */
  stepIndex: number;
  /** Total number of steps. */
  totalSteps: number;
  /** Move to the next step. */
  nextStep: () => void;
  /** Skip onboarding entirely. */
  skipOnboarding: () => void;
  /** Complete onboarding (called on last step). */
  completeOnboarding: () => void;
  /** The seeded sample protocol ID, if available. */
  sampleProtocolId: string | null;
  /** Whether the Getting Started checklist has been dismissed. */
  isChecklistDismissed: boolean;
  /** Dismiss the Getting Started checklist permanently. */
  dismissChecklist: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

/**
 * Provides onboarding state for new users.
 * Checks user_metadata and localStorage to determine if onboarding should show.
 * Seeds a sample protocol on first visit.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [sampleProtocolId, setSampleProtocolId] = useState<string | null>(null);
  const [isChecklistDismissed, setIsChecklistDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true";
  });
  const hasCheckedRef = useRef(false);

  // Check if onboarding is needed on mount
  useEffect(() => {
    if (!user || hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const localComplete =
      typeof window !== "undefined" &&
      localStorage.getItem(LOCALSTORAGE_KEY) === "true";
    const metadataComplete = user.user_metadata?.onboarding_completed === true;

    if (localComplete || metadataComplete) return;

    // New user — seed sample protocol and start onboarding
    const initOnboarding = async () => {
      const protocolId = await seedSampleProtocol(user.id);
      if (protocolId) {
        setSampleProtocolId(protocolId);
      }
      setIsOnboarding(true);
    };
    initOnboarding();
  }, [user]);

  const markComplete = useCallback(async () => {
    // Persist completion in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALSTORAGE_KEY, "true");
    }
    // Persist in user metadata (best-effort)
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
    } catch {
      /* swallow — localStorage is the primary store */
    }
    setIsOnboarding(false);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      trackEvent("onboarding_completed");
      markComplete();
    }
  }, [stepIndex, markComplete]);

  const skipOnboarding = useCallback(() => {
    trackEvent("onboarding_skipped", { skippedAtStep: stepIndex });
    markComplete();
  }, [stepIndex, markComplete]);

  const completeOnboarding = useCallback(() => {
    trackEvent("onboarding_completed");
    markComplete();
  }, [markComplete]);

  const dismissChecklist = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    }
    setIsChecklistDismissed(true);
    trackEvent("checklist_dismissed");
  }, []);

  const currentStep = isOnboarding
    ? (ONBOARDING_STEPS[stepIndex] ?? null)
    : null;

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        stepIndex,
        totalSteps: ONBOARDING_STEPS.length,
        nextStep,
        skipOnboarding,
        completeOnboarding,
        sampleProtocolId,
        isChecklistDismissed,
        dismissChecklist,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding state. Must be used within OnboardingProvider.
 */
export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
