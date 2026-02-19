"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import { WorkspaceExportButton } from "@/components/export/workspace-export-button"
import { fetchProtocols, type ProtocolRecord } from "@/lib/supabase/protocols"
import { createClient } from "@/lib/supabase/browser"

export default function AppDashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [protocols, setProtocols] = useState<ProtocolRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const hasProtocols = useMemo(() => protocols.length > 0, [protocols.length])

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!isMounted) return

      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth")
        return
      }

      setEmail(user.email ?? null)

      const { data, error: fetchError } = await fetchProtocols()
      if (!isMounted) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setProtocols(data ?? [])
      }
      setIsLoading(false)
    }

    load()

    return () => {
      isMounted = false
    }
  }, [router, supabase.auth])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.replace("/auth")
    router.refresh()
  }

  const formatDate = (value: string) => new Date(value).toLocaleDateString()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-4xl">
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Protocol Builder</CardTitle>
              <CardDescription>
                {email ? `Signed in as ${email}` : "Your authenticated workspace"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/app/new">New protocol</Link>
              </Button>
              <WorkspaceExportButton />
              <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {!hasProtocols && !error && (
              <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center text-muted-foreground">
                <p className="text-base font-medium text-foreground">
                  No protocols yet
                </p>
                <p className="mt-1 text-sm">
                  Create your first study protocol to get started.
                </p>
              </div>
            )}
            {hasProtocols && (
              <div className="grid gap-4 md:grid-cols-2">
                {protocols.map((protocol) => (
                  <Card key={protocol.id} className="border-muted/70">
                    <CardHeader>
                      <CardTitle className="text-lg">{protocol.title}</CardTitle>
                      <CardDescription className="capitalize">
                        {protocol.status.replace("_", " ")} • Updated{" "}
                        {formatDate(protocol.updated_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p className="line-clamp-3">{protocol.study_question}</p>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/${protocol.id}`}>View protocol</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
