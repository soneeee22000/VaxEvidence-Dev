"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { workflowSteps } from "@/components/landing/content";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * How-it-works section — 4-step flow with glass cards and step connectors.
 */
export default function HowItWorksSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="relative py-16 lg:py-24 overflow-hidden"
    >
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-12 lg:mb-16"
          variants={stagger(0.12, 0)}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.h2
            variants={fadeUp(0)}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance"
          >
            From Question to Protocol in Minutes
          </motion.h2>
          <motion.p
            variants={fadeUp(0.1)}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            A streamlined workflow that replaces months of manual work
          </motion.p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4"
          variants={stagger(0.12, 0.1)}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
        >
          {workflowSteps.map((item, idx) => (
            <div key={item.step} className="relative">
              <motion.article
                variants={fadeUp(0)}
                className="glass-card rounded-xl p-6 h-full"
              >
                <div className="text-5xl font-bold text-glow opacity-30 mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.article>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-primary/40" />
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
