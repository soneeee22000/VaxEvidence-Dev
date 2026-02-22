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
    id: "sample-protocol",
    title: "Your First Protocol",
    description:
      "We created a sample protocol to help you explore. It demonstrates the PICO framework, evidence linking, and screening pipeline.",
    spotlightTarget: null,
  },
  {
    id: "nav-tour",
    title: "Navigate Your Workspace",
    description:
      "Use the top navigation to switch between Protocols, Templates, Evidence Library, and more. Each section helps you build a complete study.",
    spotlightTarget: "nav-protocols",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description:
      "Start by exploring your sample protocol, or create a new one from scratch. The feedback button in the bottom-right corner is always available if you need help.",
    spotlightTarget: null,
  },
];
