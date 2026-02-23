"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, stagger, viewportOnce } from "@/components/landing/motion";

/**
 * CTA section — gradient mesh background with waitlist form.
 */
export default function CTASection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          source: "landing-page",
          honeypot: "",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Something went wrong.");
        return;
      }

      setStatus("success");
      setSubmitted(true);
      setName("");
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

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
            className="text-lg text-muted-foreground mb-8"
          >
            Join the waitlist for early access to VaxEvidence.
          </motion.p>

          {!submitted ? (
            <motion.form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
              variants={fadeUp(0.2)}
            >
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="h-12 text-base bg-card/70 backdrop-blur-sm"
                aria-label="Full name"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                required
                className="h-12 text-base bg-card/70 backdrop-blur-sm"
                aria-label="Email address"
              />
              <motion.div
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="shrink-0 shadow-soft h-12"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Submitting..." : "Join Waitlist"}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.div
              variants={fadeUp(0.2)}
              className="glass-card rounded-lg p-6 max-w-md mx-auto"
              role="alert"
            >
              <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium">
                Thank you! We&apos;ll be in touch soon.
              </p>
            </motion.div>
          )}

          {message ? (
            <p
              className={`text-sm mt-4 ${status === "success" ? "text-primary" : "text-destructive"}`}
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}

          <motion.p
            variants={fadeUp(0.25)}
            className="text-sm text-muted-foreground mt-6"
          >
            Free to get started. No credit card required.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
