"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * CTA section — gradient mesh background with sign-up prompt.
 */
export default function CTASection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Gradient mesh bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[300px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-[250px] w-[350px] rounded-full bg-primary/5 blur-[80px]" />
      </div>
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center relative">
        <motion.div
          variants={stagger(0.12, 0)}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.h2
            variants={fadeUp(0)}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance"
          >
            Ready to Streamline Your Research?
          </motion.h2>
          <motion.p
            variants={fadeUp(0.1)}
            className="text-lg text-muted-foreground mb-8 max-w-md mx-auto"
          >
            Create your first protocol in minutes. Import evidence from PubMed,
            screen studies, and export regulatory-ready reports.
          </motion.p>

          <motion.div
            variants={fadeUp(0.2)}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button asChild size="lg" className="shadow-soft h-12 px-8">
                <Link href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/demo">Try the Demo</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeUp(0.25)}
            className="text-sm text-muted-foreground mt-6"
          >
            Free to use. No credit card required.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
