// =============================================================================
// AUTH LAYOUT - Dev Mode
// =============================================================================
// Simplified layout for development. Middleware handles auth redirects.
// =============================================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
