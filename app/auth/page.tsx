"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"

type AuthMode = "signup" | "login"
type Step = "request" | "verify"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("signup")
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmailValid = useMemo(() => email.includes("@"), [email])
  const isOtpValid = useMemo(() => otp.trim().length >= 6, [otp])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (data.session) {
        router.replace("/app")
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/app")
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [router])

  const handleRequestCode = async () => {
    setError(null)
    setStatus(null)

    if (!isEmailValid) {
      setError("Enter a valid email address to continue.")
      return
    }

    setIsSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
      },
    })
    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    setStatus("Check your email for the 6-digit code.")
    setStep("verify")
  }

  const handleVerifyCode = async () => {
    setError(null)
    setStatus(null)

    if (!isEmailValid) {
      setError("Email is required to verify your code.")
      return
    }

    if (!isOtpValid) {
      setError("Enter the 6-digit code from your email.")
      return
    }

    setIsSubmitting(true)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    })
    setIsSubmitting(false)

    if (verifyError) {
      setError(verifyError.message)
      return
    }

    setStatus("Verified! Redirecting...")
    router.replace("/app")
  }

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode)
    setStep("request")
    setOtp("")
    setStatus(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {step === "request"
                ? "We’ll send a 6-digit code to your inbox."
                : "Enter the code to finish signing in."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            {step === "verify" && (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="otp">
                  Verification code
                </label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
              </div>
            )}

            {status && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                {status}
              </p>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3">
            {step === "request" ? (
              <Button
                type="button"
                onClick={handleRequestCode}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Sending code..."
                  : mode === "signup"
                    ? "Send sign-up code"
                    : "Send login code"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Verifying..." : "Verify code"}
              </Button>
            )}

            {step === "verify" && (
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <button
                  type="button"
                  className="text-left text-sm text-primary hover:underline"
                  onClick={handleRequestCode}
                  disabled={isSubmitting}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  className="text-left text-sm text-muted-foreground hover:underline"
                  onClick={() => setStep("request")}
                  disabled={isSubmitting}
                >
                  Edit email address
                </button>
              </div>
            )}
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Already have an account?" : "New to VaxEvidence?"}{" "}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => handleModeChange(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "Log in instead" : "Create an account"}
          </button>
        </div>
      </div>
    </main>
  )
}
