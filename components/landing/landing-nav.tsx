"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { fadeIn } from "@/components/landing/motion";

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <nav className="bg-background/85 backdrop-blur-xl border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="VaxEvidence Home"
          >
            <Image
              src="/logo-final.svg"
              alt="VaxEvidence Logo"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="text-xl font-bold text-foreground">
              VaxEvidence
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how-it-works" className="nav-link">
              How It Works
            </a>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button asChild size="sm" variant="outline">
                <Link href="/auth">Log in</Link>
              </Button>
              <Button asChild size="sm" className="shadow-soft">
                <Link href="/auth">Sign up</Link>
              </Button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-border"
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div
                className="flex flex-col gap-4"
                variants={fadeIn(0)}
                initial={reduceMotion ? false : "hidden"}
                animate="visible"
              >
                <a
                  href="#features"
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth">Log in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="w-fit shadow-soft"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/auth">Sign up</Link>
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
