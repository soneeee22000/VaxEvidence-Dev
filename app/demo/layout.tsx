"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DemoProvider } from "@/lib/demo/demo-context";
import { DemoBanner } from "@/components/demo/demo-banner";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { FileText, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

/**
 * Layout for /demo pages. No auth required, wraps with DemoProvider.
 */
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("demo_started");
  }, []);

  const navLinks = [
    { href: "/demo", label: "Protocols", icon: FileText, exact: true },
  ];

  return (
    <DemoProvider>
      <div className="min-h-screen bg-background">
        <DemoBanner />

        {/* Navigation Bar */}
        <header className="sticky top-[36px] z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
            <div className="mr-6 flex items-center">
              <Link
                href="/demo"
                className="flex items-center gap-2.5"
                aria-label="VaxEvidence Demo"
              >
                <Image
                  src="/logo-final.svg"
                  alt="VaxEvidence Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0"
                />
                <span className="font-bold text-xl tracking-tight">
                  VaxEvidence
                </span>
              </Link>
            </div>
            <nav className="flex items-center gap-6 flex-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = link.exact
                  ? pathname === link.href
                  : pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <Button size="sm" asChild>
                <Link href="/auth">
                  Sign Up Free
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        <FeedbackWidget />
      </div>
    </DemoProvider>
  );
}
