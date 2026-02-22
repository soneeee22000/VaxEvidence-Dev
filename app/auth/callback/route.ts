import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { provisionSSOUser } from "@/lib/auth/sso-provision";

/**
 * Auth callback handler for email confirmations, magic links, and SSO.
 * Exchanges the auth code for a session, runs JIT provisioning for SSO
 * users, and redirects to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      /* After successful auth, attempt JIT provisioning for SSO users.
       * This adds the user to a workspace if their email domain matches
       * an active SSO configuration with auto_provision enabled. */
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          await provisionSSOUser({
            userId: user.id,
            email: user.email,
          });
        }
      } catch {
        /* JIT provisioning failure should not block the auth flow.
         * The user can still sign in; they just might not be auto-added
         * to a workspace. */
        console.warn("SSO JIT provisioning failed (non-blocking)");
      }

      return response;
    }
  }

  // If there's an error or no code, redirect to auth page with error
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
}
