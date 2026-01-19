"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"

export default function AppPlaceholderPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (!data.session) {
        router.replace("/auth")
        return
      }
      setEmail(data.session.user.email ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.replace("/auth")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Loading your workspace...</CardTitle>
              <CardDescription>Please wait a moment.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>VaxEvidence App</CardTitle>
            <CardDescription>Authenticated placeholder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              You are signed in{email ? ` as ${email}` : ""}. We’ll replace this
              placeholder with the MVP dashboard next.
            </p>
            <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center">
              <p className="text-base font-medium text-foreground">
                MVP workspace coming soon
              </p>
              <p className="mt-1">
                This space will soon house study protocol generation, datasets,
                and collaboration tools.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
