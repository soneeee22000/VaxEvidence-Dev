/**
 * Onboarding step definitions for new user guided tour.
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  /** data-onboarding-id of the element to spotlight (null = centered card). */
  spotlightTarget: string | null;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to VaxEvidence",
    description:
      "The Real-World Evidence platform for vaccine researchers. Build regulatory-ready study protocols, manage evidence, and run systematic reviews — all in one place.",
    spotlightTarget: null,
  },
  {
    id: "checklist-intro",
    title: "Your Getting Started Guide",
    description:
      "We created a sample protocol for you to explore. Your dashboard has a Getting Started checklist that tracks your progress — create protocols, add evidence, screen studies, and assess risk of bias. Close this overlay to begin.",
    spotlightTarget: null,
  },
];
