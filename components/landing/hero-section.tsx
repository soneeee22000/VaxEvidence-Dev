"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FlaskConical,
  Shield,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * Hero section — layered glows, dot grid texture, product preview card.
 */
export default function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Layered ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[15%] h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[400px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Dot grid texture */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <motion.div
            variants={stagger(0.15, 0.1)}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div
              variants={fadeUp(0)}
              className="inline-flex items-center mb-6 px-3 py-1.5 glass-card rounded-full text-sm font-medium text-muted-foreground"
            >
              Built for Regulatory-Grade Research
            </motion.div>

            <motion.h1
              variants={fadeUp(0.05)}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.08] tracking-tight mb-6 text-balance"
            >
              The Evidence Platform for{" "}
              <span className="text-glow">Vaccine Scientists</span>
            </motion.h1>

            <motion.p
              variants={fadeUp(0.1)}
              className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl text-pretty"
            >
              Build PICO-based study protocols, manage evidence from PubMed and
              clinical trial registries, run PRISMA-compliant reviews, and
              export regulatory-ready packages.
            </motion.p>

            <motion.div
              variants={fadeUp(0.15)}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button size="lg" className="text-base shadow-soft" asChild>
                  <Link href="/auth">
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base backdrop-blur-sm"
                  asChild
                >
                  <Link href="/demo">
                    <FlaskConical className="mr-2 w-4 h-4" />
                    Try Demo
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.p
              variants={fadeUp(0.2)}
              className="text-sm text-muted-foreground mt-5"
            >
              Free to use. No credit card required.
            </motion.p>
          </motion.div>

          {/* Right — product preview card */}
          <motion.div
            className="relative hidden lg:block"
            initial={reduceMotion ? false : { opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-primary/8 blur-[60px] rounded-3xl" />

            <div className="relative glass-card rounded-2xl p-6 sm:p-8">
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <span className="ml-auto text-xs text-muted-foreground font-mono">
                  vaxevidence.com/app
                </span>
              </div>

              {/* Mock dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      COVID-19 mRNA Vaccine Effectiveness
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Protocol PICO-2024-0847
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                    In Review
                  </span>
                </div>

                <div className="h-px bg-border" />

                {/* Stat row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="glass-card rounded-lg p-3 !border-border/50">
                    <Shield className="w-4 h-4 text-primary mb-1.5" />
                    <div className="text-xs text-muted-foreground">
                      FDA IND Ready
                    </div>
                  </div>
                  <div className="glass-card rounded-lg p-3 !border-border/50">
                    <BookOpen className="w-4 h-4 text-primary mb-1.5" />
                    <div className="text-xs text-muted-foreground">
                      47 Evidence Items
                    </div>
                  </div>
                  <div className="glass-card rounded-lg p-3 !border-border/50">
                    <BarChart3 className="w-4 h-4 text-primary mb-1.5" />
                    <div className="text-xs text-muted-foreground">
                      PRISMA Complete
                    </div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Screening</span>
                      <span className="text-primary font-medium">94%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-primary rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        Risk of Bias
                      </span>
                      <span className="text-primary font-medium">78%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[78%] bg-primary/70 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
