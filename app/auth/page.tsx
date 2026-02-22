"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/browser";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* SSO detection state */
  const [ssoAvailable, setSsoAvailable] = useState(false);
  const [ssoDisplayName, setSsoDisplayName] = useState<string | null>(null);
  const [isSsoLoading, setIsSsoLoading] = useState(false);

  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }

      // Redirect to app dashboard
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }

      setMessage("Check your email for a confirmation link.");
      setIsSubmitting(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  /**
   * Detect SSO availability when user finishes typing their email.
   * Called onBlur of the email input fields.
   */
  const handleEmailBlur = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setSsoAvailable(false);
      setSsoDisplayName(null);
      return;
    }

    try {
      const res = await fetch("/api/auth/sso/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        setSsoAvailable(false);
        return;
      }

      const { data } = (await res.json()) as {
        data: { has_sso: boolean; display_name?: string };
      };

      setSsoAvailable(data.has_sso);
      setSsoDisplayName(data.display_name ?? null);
    } catch {
      setSsoAvailable(false);
    }
  }, [email]);

  /**
   * Initiate SSO login flow. Calls the SSO login API and redirects
   * the user to the identity provider.
   */
  const handleSsoLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsSsoLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/sso/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ?? "Failed to initiate SSO login",
        );
        setIsSsoLoading(false);
        return;
      }

      const { data } = (await res.json()) as {
        data: { url: string };
      };

      /* Redirect to the IdP login page. */
      window.location.href = data.url;
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSsoLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsSubmitting(false);
        return;
      }

      setMessage("Check your email for a magic link to sign in.");
      setIsSubmitting(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">VaxEvidence</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="signin-email"
                    >
                      Email
                    </label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="signin-password"
                    >
                      Password
                    </label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                    />
                  </div>

                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  {message && (
                    <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
                      {message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleMagicLink}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Magic Link (Email)"}
                  </Button>

                  {/* SSO login button — shown when email domain has active SSO */}
                  {ssoAvailable && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400"
                      onClick={handleSsoLogin}
                      disabled={isSsoLoading}
                    >
                      {isSsoLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      {isSsoLoading
                        ? "Redirecting..."
                        : `Sign in with SSO${ssoDisplayName ? ` (${ssoDisplayName})` : ""}`}
                    </Button>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="signup-email"
                    >
                      Email
                    </label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={handleEmailBlur}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor="signup-password"
                    >
                      Password
                    </label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  {message && (
                    <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
                      {message}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Link
              href="/"
              className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
