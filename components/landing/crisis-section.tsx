"use client"

import { motion, useReducedMotion } from "framer-motion"
import { crisisCards } from "@/components/landing/content"
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion"

const toneStyles: Record<string, string> = {
  danger: "text-red-500 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  accent: "text-orange-600 dark:text-orange-400",
}

export default function CrisisSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="bg-card border-y border-border py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            The Vaccine RWE Crisis
          </motion.h2>
          <motion.p variants={fadeUp(0.1)} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manual processes are holding back life-saving research
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
              className="bg-muted/50 rounded-xl p-6 sm:p-8 border border-border shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`text-4xl sm:text-5xl font-bold mb-3 ${toneStyles[card.tone]}`}>{card.value}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
