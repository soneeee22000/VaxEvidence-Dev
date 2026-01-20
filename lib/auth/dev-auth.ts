// =============================================================================
// DEV-ONLY AUTHENTICATION
// =============================================================================
// This is a simplified auth system for development purposes only.
// In production, replace with Supabase Auth or your preferred auth provider.
// =============================================================================

// Hardcoded dev credentials
const DEV_CREDENTIALS = {
  username: "admin",
  password: "12345",
} as const

// Cookie name for auth state
const AUTH_COOKIE_NAME = "vaxevidence_dev_auth"

// Dev user info (must match UUID in Supabase auth.users)
export const DEV_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "admin@vaxevidence.dev",
  name: "Dev Admin",
} as const

/**
 * Validate credentials against hardcoded dev values
 */
export function validateCredentials(username: string, password: string): boolean {
  return username === DEV_CREDENTIALS.username && password === DEV_CREDENTIALS.password
}

/**
 * Set auth cookie (client-side)
 */
export function setAuthCookie(): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // 7 days
  document.cookie = `${AUTH_COOKIE_NAME}=authenticated; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
}

/**
 * Remove auth cookie (client-side)
 */
export function removeAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/**
 * Check if auth cookie exists (client-side)
 */
export function isAuthenticatedClient(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.includes(`${AUTH_COOKIE_NAME}=authenticated`)
}

/**
 * Get auth cookie value from request cookies (server-side/middleware)
 */
export function getAuthFromCookies(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  return cookieHeader.includes(`${AUTH_COOKIE_NAME}=authenticated`)
}

/**
 * Cookie name export for middleware
 */
export { AUTH_COOKIE_NAME }
