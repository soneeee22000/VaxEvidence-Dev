"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { validateCredentials, setAuthCookie } from "@/lib/auth/dev-auth"

export default function AuthPage() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/e605cce5-96c8-48d9-ac3a-0c2be5d3a457',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/page.tsx',message:'AuthPage mounted',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  }, []);
  // #endregion
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.")
      return
    }

    setIsSubmitting(true)
    
    // Simulate network delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (validateCredentials(username, password)) {
      setAuthCookie()
      router.replace("/app")
    } else {
      setError("Invalid credentials. Try admin / 12345")
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">VaxEvidence</CardTitle>
            <CardDescription>
              Development Login
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <strong>Dev credentials:</strong> admin / 12345
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <Link 
                href="/" 
                className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to home
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
