"use client";

// =============================================================================
// APP LAYOUT
// =============================================================================
// Main layout for authenticated app pages. Uses Supabase Auth.
// =============================================================================

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { QueryProvider } from "@/lib/query/query-provider";
import {
  FileText,
  BookOpen,
  Database,
  LogOut,
  Activity,
  LayoutTemplate,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchPendingReviewCount } from "@/lib/supabase/reviews";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  // Client-side auth guard — redirect to login when session is gone
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    const loadPendingReviews = async () => {
      const { data } = await fetchPendingReviewCount(user.id);
      if (data !== null) {
        setPendingReviewCount(data);
      }
    };
    loadPendingReviews();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingReviews, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.replace("/auth");
    router.refresh();
  };

  const navLinks = [
    {
      href: "/app",
      label: "Protocols",
      icon: FileText,
      exact: true,
    },
    {
      href: "/app/templates",
      label: "Templates",
      icon: LayoutTemplate,
      exact: false,
    },
    {
      href: "/app/datasets",
      label: "Datasets",
      icon: Database,
      exact: false,
    },
    {
      href: "/app/evidence",
      label: "Evidence Library",
      icon: BookOpen,
      exact: false,
    },
    {
      href: "/app/activity",
      label: "Activity",
      icon: Activity,
      exact: false,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Don't render app shell while auth is loading or user is absent
  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
          <div className="mr-6 flex items-center">
            <Link
              href="/app"
              className="flex items-center gap-2.5"
              aria-label="VaxEvidence Home"
            >
              <img
                src="/logo-final.svg"
                alt="VaxEvidence Logo"
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
              const active = isActive(link.href, link.exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary relative ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {link.badge && (
                    <Badge
                      variant="destructive"
                      className="ml-1 px-1.5 py-0 text-xs"
                    >
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email ?? "Loading..."}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </AuthProvider>
    </QueryProvider>
  );
}
