"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Database,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  {
    icon: FileText,
    title: "Protocol Generation",
    description: "AI-powered study protocols following PICO frameworks tailored for vaccine research",
  },
  {
    icon: Database,
    title: "Multi-Database Integration",
    description: "Connect European EHR databases, US claims data, and vaccine registries in one platform",
  },
  {
    icon: Shield,
    title: "Regulatory Compliance",
    description: "FDA RWE framework and EMA DARWIN EU compatible exports built-in",
  },
  {
    icon: TrendingUp,
    title: "Vaccine-Specific Endpoints",
    description: "Pre-configured for seroconversion, breakthrough infections, and effectiveness metrics",
  },
  {
    icon: Users,
    title: "Collaboration Tools",
    description: "Built for cross-functional teams: epidemiologists, medical affairs, regulatory",
  },
  {
    icon: BarChart3,
    title: "Automated Reporting",
    description: "One-click PRISMA flowcharts, STROBE checklists, and publication-ready tables",
  },
]

const steps = [
  { step: "01", title: "Define Study", desc: "Enter vaccine type, population, and research question" },
  { step: "02", title: "AI Analysis", desc: "Automated literature search and data extraction" },
  { step: "03", title: "Review & Refine", desc: "Collaborate with team on AI-generated protocol" },
  { step: "04", title: "Export & Submit", desc: "Regulatory-ready documents in FDA/EMA format" },
]

export default function VaxEvidenceLanding() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5" aria-label="VaxEvidence Home">
              <img src="/logo-final.svg" alt="VaxEvidence Logo" className="w-9 h-9" />
              <span className="text-xl font-bold text-foreground">VaxEvidence</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                How It Works
              </a>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button size="sm">Request Demo</Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-1">
              <ThemeToggle />
              <button
                className="p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <Button size="sm" className="w-fit">
                  Request Demo
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center mb-6 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Built by Vaccine Scientists, for Vaccine Scientists
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-6 text-balance">
              Stop Spending <span className="text-primary">6 Months</span> on Vaccine Effectiveness Studies
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-xl text-pretty">
              The first Real-World Evidence platform designed specifically for vaccine researchers. Generate
              regulatory-ready study protocols in days, not months.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button size="lg" className="text-base">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-base bg-transparent">
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>FDA/EMA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>14-Day Trial</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-card rounded-2xl shadow-xl border border-border p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <span className="text-xs text-muted-foreground font-mono">Study Protocol Generator</span>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-foreground mb-2 block">Vaccine Type</label>
                  <div className="bg-background px-3 py-2.5 rounded-md border border-border text-sm">
                    mRNA COVID-19 Vaccine
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-foreground mb-2 block">Population</label>
                  <div className="bg-background px-3 py-2.5 rounded-md border border-border text-sm">
                    Adults 18-65, Healthcare Workers
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-foreground mb-2 block">Primary Outcome</label>
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
            </div>

            <div className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-card rounded-xl shadow-lg border border-border p-3 sm:p-4">
              <div className="text-2xl font-bold text-primary">92%</div>
              <div className="text-xs text-muted-foreground">Time Saved</div>
            </div>

            <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-card rounded-xl shadow-lg border border-border p-3 sm:p-4">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-muted-foreground">Regulatory Ready</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border-y border-border py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">The Vaccine RWE Crisis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Manual processes are holding back life-saving research
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="bg-muted/50 rounded-xl p-6 sm:p-8 border border-border">
              <div className="text-4xl sm:text-5xl font-bold text-red-500 dark:text-red-400 mb-3">6+ months</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Study Protocol Development</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manual literature reviews, database queries, and protocol writing
              </p>
            </article>

            <article className="bg-muted/50 rounded-xl p-6 sm:p-8 border border-border">
              <div className="text-4xl sm:text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-3">15+ hours</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Per Systematic Review</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Screening hundreds of papers manually with high error rates
              </p>
            </article>

            <article className="bg-muted/50 rounded-xl p-6 sm:p-8 border border-border sm:col-span-2 lg:col-span-1">
              <div className="text-4xl sm:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-3">$50K+</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Cost Per Study</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Senior epidemiologist time, database access, regulatory compliance
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything You Need for Vaccine RWE
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for vaccine effectiveness and safety studies
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <article
              key={idx}
              className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-muted/50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
              From Question to Protocol in Minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined workflow replaces months of manual work
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((item, idx) => (
              <div key={idx} className="relative">
                <article className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors h-full">
                  <div className="text-5xl font-bold text-primary/20 mb-3">{item.step}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </article>
                {idx < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-balance">
          Ready to Transform Your Vaccine Research?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">Join leading vaccine researchers using VaxEvidence</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              required
              className="h-12 text-base"
              aria-label="Email address"
            />
            <Button type="submit" size="lg" className="shrink-0">
              Start Free Trial
            </Button>
          </form>
        ) : (
          <div
            className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 max-w-md mx-auto"
            role="alert"
          >
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-green-800 dark:text-green-200 font-medium">Thank you! We&apos;ll be in touch soon.</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </section>

      <footer className="bg-card border-t border-border py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img src="/logo-final.svg" alt="VaxEvidence Logo" className="w-8 h-8" />
                <span className="text-lg font-bold text-foreground">VaxEvidence</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The Real-World Evidence platform built for vaccine scientists.
              </p>
            </div>

            <nav aria-label="Product links">
              <h4 className="font-semibold mb-4 text-sm text-foreground">Product</h4>
              <ul className="space-y-2.5 text-muted-foreground text-sm">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label="Company links">
              <h4 className="font-semibold mb-4 text-sm text-foreground">Company</h4>
              <ul className="space-y-2.5 text-muted-foreground text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </nav>

            <nav aria-label="Legal links">
              <h4 className="font-semibold mb-4 text-sm text-foreground">Legal</h4>
              <ul className="space-y-2.5 text-muted-foreground text-sm">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-border mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} VaxEvidence. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                LinkedIn
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
