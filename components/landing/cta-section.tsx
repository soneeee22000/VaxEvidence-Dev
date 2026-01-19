"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion"

export default function CTASection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const reduceMotion = useReducedMotion()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
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
          Ready to Transform Your Vaccine Research?
        </motion.h2>
        <motion.p variants={fadeUp(0.1)} className="text-lg text-muted-foreground mb-8">
          Join leading vaccine researchers using VaxEvidence
        </motion.p>

        {!submitted ? (
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            variants={fadeUp(0.2)}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="h-12 text-base"
              aria-label="Email address"
            />
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" size="lg" className="shrink-0 shadow-soft">
                Start Free Trial
              </Button>
            </motion.div>
          </motion.form>
        ) : (
          <motion.div
            variants={fadeUp(0.2)}
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-md mx-auto"
            role="alert"
          >
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-green-800 dark:text-green-200 font-medium">Thank you! We&apos;ll be in touch soon.</p>
          </motion.div>
        )}

        <motion.p variants={fadeUp(0.25)} className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </motion.p>
      </motion.div>
    </section>
  )
}
