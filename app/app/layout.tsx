"use client"

// =============================================================================
// APP LAYOUT - Dev Mode
// =============================================================================
// Simplified layout for development. Middleware handles auth protection.
// =============================================================================

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { removeAuthCookie, DEV_USER } from "@/lib/auth/dev-auth"
import { FileText, BookOpen, Database, LogOut, Activity } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchPendingReviewCount } from "@/lib/supabase/reviews"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [pendingReviewCount, setPendingReviewCount] = useState(0)

  useEffect(() => {
    const loadPendingReviews = async () => {
      const { data } = await fetchPendingReviewCount(DEV_USER.id)
      if (data !== null) {
        setPendingReviewCount(data)
      }
    }
    loadPendingReviews()
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingReviews, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = () => {
    setIsSigningOut(true)
    removeAuthCookie()
    router.replace("/auth")
  }

  const navLinks = [
    {
      href: "/app",
      label: "Protocols",
      icon: FileText,
      exact: true,
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
  ]

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/app" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">VaxEvidence</span>
            </Link>
          </div>
          <nav className="flex items-center gap-6 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href, link.exact)
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
                    <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {DEV_USER.email}
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
  )
}
