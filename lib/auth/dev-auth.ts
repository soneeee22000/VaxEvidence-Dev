// =============================================================================
// DEV-ONLY AUTHENTICATION
// =============================================================================
// This is a simplified auth system for development purposes only.
// All exports become inert when NODE_ENV !== "development", ensuring
// dev credentials never leak into production builds.
// =============================================================================

/** True only during local development; resolved at build time by Next.js. */
const IS_DEV = process.env.NODE_ENV === "development";

// Hardcoded dev credentials
const DEV_CREDENTIALS = {
  username: "admin",
  // eslint-disable-next-line no-secrets/no-secrets -- dev-only placeholder, gated by IS_DEV
  pass: "12345",
} as const;

// Cookie name for auth state
const AUTH_COOKIE_NAME = "vaxevidence_dev_auth";

// Dev user info (must match UUID in Supabase auth.users)
export const DEV_USER = IS_DEV
  ? ({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "admin@vaxevidence.dev",
      name: "Dev Admin",
    } as const)
  : ({ id: "", email: "", name: "" } as const);

/**
 * Validate credentials against hardcoded dev values.
 * Always returns false in production.
 */
export function validateCredentials(
  username: string,
  password: string,
): boolean {
  if (!IS_DEV) return false;
  return (
    username === DEV_CREDENTIALS.username && password === DEV_CREDENTIALS.pass
  );
}

/**
 * Set auth cookie (client-side).
 * No-op in production.
 */
export function setAuthCookie(): void {
  if (!IS_DEV) return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days
  document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Remove auth cookie (client-side).
 * No-op in production.
 */
export function removeAuthCookie(): void {
  if (!IS_DEV) return;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Check if auth cookie exists (client-side).
 * Always returns false in production.
 */
export function isAuthenticatedClient(): boolean {
  if (!IS_DEV) return false;
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${AUTH_COOKIE_NAME}=authenticated`);
}

/**
 * Get auth cookie value from request cookies (server-side/middleware).
 * Always returns false in production.
 */
export function getAuthFromCookies(cookieHeader: string | null): boolean {
  if (!IS_DEV) return false;
  if (!cookieHeader) return false;
  return cookieHeader.includes(`${AUTH_COOKIE_NAME}=authenticated`);
}

/**
 * Cookie name export for middleware.
 */
export { AUTH_COOKIE_NAME };
