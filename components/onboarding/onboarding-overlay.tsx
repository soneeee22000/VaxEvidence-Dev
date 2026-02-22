"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOnboarding } from "@/lib/onboarding/onboarding-context";
import { SpotlightHighlight } from "./spotlight-highlight";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Compass,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";

const STEP_ICONS = [Sparkles, FileText, Compass, PartyPopper];

/**
 * Full-screen onboarding overlay with step-by-step wizard.
 * Renders nothing when onboarding is not active.
 */
export function OnboardingOverlay() {
  const {
    isOnboarding,
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    sampleProtocolId,
  } = useOnboarding();

  if (!isOnboarding || !currentStep) return null;

  const isLastStep = stepIndex === totalSteps - 1;
  const hasSpotlight = currentStep.spotlightTarget !== null;
  const StepIcon = STEP_ICONS[stepIndex] ?? Sparkles;

  return (
    <>
      {/* Spotlight overlay for tour steps */}
      <SpotlightHighlight targetId={currentStep.spotlightTarget} />

      {/* Dark overlay for non-spotlight steps */}
      {!hasSpotlight && (
        <div className="fixed inset-0 z-[90] bg-black/60" aria-hidden="true" />
      )}

      {/* Step card */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-md mx-4"
          >
            <Card className="shadow-2xl border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <StepIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {currentStep.description}
                </CardDescription>
              </CardHeader>

              {/* Sample protocol link on step 2 */}
              {currentStep.id === "sample-protocol" && sampleProtocolId && (
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/app/${sampleProtocolId}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Sample Protocol
                    </Link>
                  </Button>
                </CardContent>
              )}

              {/* Complete step CTA */}
              {isLastStep && sampleProtocolId && (
                <CardContent className="pt-0">
                  <Button size="sm" className="w-full" asChild>
                    <Link
                      href={`/app/${sampleProtocolId}`}
                      onClick={completeOnboarding}
                    >
                      Explore Sample Protocol
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              )}

              <CardFooter className="flex items-center justify-between">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i === stepIndex
                          ? "bg-primary"
                          : i < stepIndex
                            ? "bg-primary/40"
                            : "bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={skipOnboarding}>
                    Skip
                  </Button>
                  {!isLastStep && (
                    <Button size="sm" onClick={nextStep}>
                      Next
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                  {isLastStep && !sampleProtocolId && (
                    <Button size="sm" onClick={completeOnboarding}>
                      Get Started
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
