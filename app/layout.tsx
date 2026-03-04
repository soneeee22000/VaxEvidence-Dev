import type React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VaxEvidence | Real-World Evidence Platform for Vaccine Research",
  description:
    "The first RWE platform built for vaccine scientists. Generate regulatory-ready study protocols in days, not months. FDA/EMA compliant.",
  generator: "Next.js",
  keywords: [
    "vaccine research",
    "real-world evidence",
    "RWE",
    "FDA",
    "EMA",
    "clinical research",
    "vaccine effectiveness",
  ],
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/logo-final.svg",
  },
  metadataBase: new URL("https://vaxevidence-dev.vercel.app"),
  openGraph: {
    title: "VaxEvidence | Real-World Evidence Platform for Vaccine Research",
    description:
      "PICO protocols, PRISMA systematic reviews, and FDA/EMA regulatory exports. Built with Next.js 16, React 19, TypeScript, and Supabase.",
    url: "https://vaxevidence-dev.vercel.app",
    siteName: "VaxEvidence",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaxEvidence | Real-World Evidence Platform",
    description:
      "PICO protocols, PRISMA systematic reviews, and FDA/EMA regulatory exports for vaccine research scientists.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
