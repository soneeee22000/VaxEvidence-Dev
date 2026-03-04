import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "VaxEvidence - Real-World Evidence Platform for Vaccine Research";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic Open Graph image generated at the edge.
 * Dark theme matching the app design system.
 */
export default function OGImage(): ImageResponse {
  const techBadges = [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Supabase",
    "Tailwind CSS",
  ];

  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 80px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #0d9488, #14b8a6, #0d9488)",
        }}
      />

      {/* Project name */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#f8fafc",
          letterSpacing: "-2px",
          marginBottom: "16px",
          display: "flex",
        }}
      >
        VaxEvidence
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: "#94a3b8",
          textAlign: "center",
          maxWidth: "800px",
          lineHeight: 1.4,
          marginBottom: "40px",
          display: "flex",
        }}
      >
        Real-World Evidence Platform for Vaccine Research
      </div>

      {/* Feature highlights */}
      <div
        style={{
          fontSize: 20,
          color: "#14b8a6",
          textAlign: "center",
          marginBottom: "48px",
          display: "flex",
          gap: "24px",
        }}
      >
        <span>PICO Protocols</span>
        <span style={{ color: "#475569" }}>|</span>
        <span>PRISMA Reviews</span>
        <span style={{ color: "#475569" }}>|</span>
        <span>FDA/EMA Exports</span>
        <span style={{ color: "#475569" }}>|</span>
        <span>Real-time Collaboration</span>
      </div>

      {/* Tech badges */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {techBadges.map((badge) => (
          <div
            key={badge}
            style={{
              background: "rgba(14, 165, 153, 0.15)",
              border: "1px solid rgba(14, 165, 153, 0.3)",
              borderRadius: "8px",
              padding: "8px 20px",
              fontSize: 18,
              color: "#5eead4",
              display: "flex",
            }}
          >
            {badge}
          </div>
        ))}
      </div>

      {/* Bottom stats */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          gap: "40px",
          fontSize: 16,
          color: "#64748b",
        }}
      >
        <span>136 Components</span>
        <span>76 API Routes</span>
        <span>1,462 Tests</span>
        <span>23 Migrations</span>
      </div>
    </div>,
    { ...size },
  );
}
