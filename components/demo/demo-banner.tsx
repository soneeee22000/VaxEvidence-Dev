"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FlaskConical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/track-event";

/**
 * Sticky top banner shown in demo mode.
 * Reminds visitors they are in demo mode with a signup CTA.
 */
export function DemoBanner() {
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-gradient-to-r from-primary/90 to-primary px-4 py-2 text-sm text-primary-foreground"
    >
      <FlaskConical className="h-4 w-4 shrink-0" />
      <span className="font-medium">
        Exploring Demo Mode — data is read-only
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="ml-2 h-7 text-xs"
        asChild
        onClick={() => trackEvent("demo_signup_clicked")}
      >
        <Link href="/auth">
          Sign Up Free
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </motion.div>
  );
}
