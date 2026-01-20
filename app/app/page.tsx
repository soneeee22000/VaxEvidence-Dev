"use client"

import { useEffect, useState } from "react"
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
import { removeAuthCookie, DEV_USER } from "@/lib/auth/dev-auth"
import {
  fetchProtocols,
  type ProtocolRecord,
} from "@/lib/supabase/protocols"
import { BookOpen } from "lucide-react"

export default function AppDashboardPage() {
  const router = useRouter()
  const [protocols, setProtocols] = useState<ProtocolRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    // Load protocols from Supabase
    const loadProtocols = async () => {
      const { data, error } = await fetchProtocols()
      if (!error && data) {
        setProtocols(data)
      }
      setIsLoading(false)
    }
    
    loadProtocols()
  }, [])

  const handleSignOut = () => {
    setIsSigningOut(true)
    removeAuthCookie()
    router.replace("/auth")
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
                Signed in as {DEV_USER.email}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/app/evidence">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Evidence Library
                </Link>
              </Button>
              <Button asChild>
                <Link href="/app/new">New protocol</Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {protocols.length === 0 && (
              <div className="rounded-lg border border-dashed border-muted px-4 py-6 text-center text-muted-foreground">
                <p className="text-base font-medium text-foreground">
                  No protocols yet
                </p>
                <p className="mt-1 text-sm">
                  Create your first study protocol to get started.
                </p>
              </div>
            )}
            {protocols.length > 0 && (
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

        {/* Dev mode indicator */}
        <div className="rounded-md bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-600 dark:text-blue-400">
          <strong>Dev Mode:</strong> Using Supabase database with dev authentication.
        </div>
      </div>
    </main>
  )
}
