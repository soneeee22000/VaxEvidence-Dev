"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, CheckCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import LottiePulse from "@/components/landing/lottie-pulse";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";
import { heroHighlights } from "@/components/landing/content";

export default function HeroSection() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useSpring(useTransform(scrollY, [0, 600], [0, -40]), {
    stiffness: 120,
    damping: 24,
  });

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 right-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            variants={stagger(0.15, 0.1)}
            initial={reduceMotion ? false : "hidden"}
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div
              variants={fadeUp(0)}
              className="inline-flex items-center mb-6 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium shadow-soft"
            >
              Built by Vaccine Scientists, for Vaccine Scientists
            </motion.div>
            <motion.h1
              variants={fadeUp(0.05)}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-6 text-balance"
            >
              Stop Spending <span className="text-gradient">6 Months</span> on
              Vaccine Effectiveness Studies
            </motion.h1>
            <motion.p
              variants={fadeUp(0.1)}
              className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl text-pretty"
            >
              The first Real-World Evidence platform designed specifically for
              vaccine researchers. Generate regulatory-ready study protocols in
              days, not months.
            </motion.p>

            <motion.div
              variants={fadeUp(0.15)}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="text-base shadow-soft" asChild>
                  <Link href="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base bg-transparent"
                  asChild
                >
                  <Link href="#how-it-works">Watch Demo</Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp(0.2)}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            >
              {heroHighlights.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-green-600" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative">
            <motion.div
              className="absolute -right-6 -top-12 h-36 w-36 opacity-80"
              style={reduceMotion ? undefined : { y: parallaxY }}
            >
              <LottiePulse className="h-full w-full" />
            </motion.div>

            <div className="relative perspective-1000">
              <motion.div
                className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-xl card-tilt"
                whileHover={
                  reduceMotion ? undefined : { rotateX: 3, rotateY: -3, y: -6 }
                }
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    Study Protocol Generator
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Vaccine Type
                    </label>
                    <div className="bg-background px-3 py-2.5 rounded-md border border-border text-sm">
                      mRNA COVID-19 Vaccine
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Population
                    </label>
                    <div className="bg-background px-3 py-2.5 rounded-md border border-border text-sm">
                      Adults 18-65, Healthcare Workers
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Primary Outcome
                    </label>
                    <div className="bg-background px-3 py-2.5 rounded-md border border-border text-sm">
                      Vaccine Effectiveness vs Hospitalization
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Generate Protocol
                    <Zap className="ml-2 w-4 h-4" />
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Average generation time: 47 seconds</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-card rounded-xl shadow-lg border border-border p-3 sm:p-4"
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="text-2xl font-bold text-primary">92%</div>
              <div className="text-xs text-muted-foreground">Time Saved</div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-card rounded-xl shadow-lg border border-border p-3 sm:p-4"
              animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-muted-foreground">
                Regulatory Ready
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-6 text-xs text-muted-foreground hidden lg:flex items-center gap-2">
        <CheckCircle className="w-3.5 h-3.5 text-primary" />
        <span>Trusted by leading vaccine researchers</span>
        <Link
          href="#features"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          Explore
        </Link>
      </div>
    </section>
  );
}
