"use client";

import { motion, useReducedMotion } from "framer-motion";
import { crisisCards } from "@/components/landing/content";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * Crisis section — glass cards with primary-accented stat values.
 */
export default function CrisisSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 lg:py-20 overflow-hidden">
      {/* Subtle bg differentiation */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-12"
          variants={stagger(0.12, 0)}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.h2
            variants={fadeUp(0)}
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance"
          >
            The Cost of Manual Research
          </motion.h2>
          <motion.p
            variants={fadeUp(0.1)}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Traditional approaches to vaccine RWE studies are slow, expensive,
            and error-prone.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={stagger(0.1, 0.1)}
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
        >
          {crisisCards.map((card) => (
            <motion.article
              key={card.title}
              variants={fadeUp(0)}
              className="glass-card rounded-xl p-6 sm:p-8"
            >
              <div className="text-4xl sm:text-5xl font-bold text-glow mb-3">
                {card.value}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {card.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {card.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
