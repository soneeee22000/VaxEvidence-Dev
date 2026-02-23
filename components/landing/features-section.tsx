"use client";

import { motion, useReducedMotion } from "framer-motion";
import { featureItems } from "@/components/landing/content";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * Features section — glow-card with gradient border on hover.
 */
export default function FeaturesSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
    >
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
          Everything You Need for Vaccine RWE
        </motion.h2>
        <motion.p
          variants={fadeUp(0.1)}
          className="text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Purpose-built for vaccine effectiveness and safety studies
        </motion.p>
      </motion.div>

      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={stagger(0.1, 0.1)}
        initial={reduceMotion ? false : "hidden"}
        whileInView="visible"
        viewport={viewportOnce}
      >
        {featureItems.map((feature) => (
          <motion.article
            key={feature.title}
            variants={fadeUp(0)}
            className="glow-card rounded-xl p-6 group"
          >
            <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4 bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
