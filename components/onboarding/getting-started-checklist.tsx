"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/onboarding/onboarding-context";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  CheckCircle2,
  Circle,
  FileText,
  Library,
  Filter,
  ShieldCheck,
  X,
} from "lucide-react";

interface GettingStartedChecklistProps {
  /** Number of protocols the user has created. */
  protocolCount: number;
  /** Number of evidence items in the library. */
  evidenceCount: number;
  /** Whether any screening decisions exist. */
  hasScreeningDecisions: boolean;
  /** Whether any risk-of-bias assessments exist. */
  hasRobAssessments: boolean;
  /** ID of the first protocol (for linking). */
  firstProtocolId: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  icon: typeof FileText;
  complete: boolean;
}

/**
 * Persistent Getting Started checklist shown on the dashboard.
 * Tracks real user progress and links to relevant pages.
 */
export function GettingStartedChecklist({
  protocolCount,
  evidenceCount,
  hasScreeningDecisions,
  hasRobAssessments,
  firstProtocolId,
}: GettingStartedChecklistProps) {
  const { isOnboarding, isChecklistDismissed, dismissChecklist } =
    useOnboarding();

  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: "protocol",
        label: "Explore or create a protocol",
        href: firstProtocolId ? `/app/${firstProtocolId}` : "/app/new",
        icon: FileText,
        complete: protocolCount > 0,
      },
      {
        id: "evidence",
        label: "Add evidence to your library",
        href: "/app/evidence/new",
        icon: Library,
        complete: evidenceCount > 0,
      },
      {
        id: "screening",
        label: "Screen your evidence",
        href: firstProtocolId
          ? `/app/${firstProtocolId}/screening`
          : "/app/new",
        icon: Filter,
        complete: hasScreeningDecisions,
      },
      {
        id: "rob",
        label: "Run a risk-of-bias assessment",
        href: firstProtocolId
          ? `/app/${firstProtocolId}/screening`
          : "/app/new",
        icon: ShieldCheck,
        complete: hasRobAssessments,
      },
    ],
    [
      protocolCount,
      evidenceCount,
      hasScreeningDecisions,
      hasRobAssessments,
      firstProtocolId,
    ],
  );

  const completedCount = items.filter((item) => item.complete).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  // Hide while onboarding overlay is active or checklist was dismissed
  if (isOnboarding || isChecklistDismissed) return null;

  // Auto-hide when all items are complete
  if (completedCount === items.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <CardDescription>
                  {completedCount} of {items.length} complete
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={dismissChecklist}
                aria-label="Dismiss checklist"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progressPercent} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {items.map((item) => {
              const Icon = item.complete ? CheckCircle2 : Circle;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() =>
                    trackEvent("checklist_item_clicked", { item: item.id })
                  }
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                    item.complete ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 ${
                      item.complete
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    }`}
                  />
                  <item.icon
                    className={`h-4 w-4 flex-shrink-0 ${
                      item.complete
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  />
                  <span className={item.complete ? "line-through" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
