// =============================================================================
// APP LAYOUT - Dev Mode
// =============================================================================
// Simplified layout for development. Middleware handles auth protection.
// =============================================================================

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
