"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track-event";

interface DemoCtaCardProps {
  /** Action label, e.g. "edit this protocol" or "make screening decisions". */
  action: string;
}

/**
 * Replaces mutation buttons in demo mode with a sign-up CTA card.
 */
export function DemoCtaCard({ action }: DemoCtaCardProps) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="flex items-center gap-3 py-4">
        <Lock className="h-5 w-5 shrink-0 text-primary/60" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Want to {action}?
          </p>
          <p className="text-xs text-muted-foreground">
            Sign up for free to unlock all features.
          </p>
        </div>
        <Button
          size="sm"
          asChild
          onClick={() => trackEvent("demo_signup_clicked", { action })}
        >
          <Link href="/auth">
            Sign Up Free
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
