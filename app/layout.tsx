import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { TimecodeBar } from "@/components/timecode-bar";
import { Preloader } from "@/components/preloader";
import { LiquidGlassFilter } from "@/components/liquid-glass-filter";
import { AdminModeBadge } from "@/components/admin-mode-badge";
import "./globals.css";

// Display: serif expresiva con optical sizing — títulos, tarjetas de cine.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

// UI/Body: geométrica, técnica — se lleva bien con el modo Neón.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Mono: para timecodes, fechas, metadata de proyecto.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://djezshadow.vercel.app"),
  title: { default: "DJEZSHADOW®", template: "%s · DJEZSHADOW®" },
  description: "Portfolio de filmmaking — DJEZSHADOW",
  openGraph: {
    title: "DJEZSHADOW®",
    description: "Portfolio de filmmaking — DJEZSHADOW",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <LiquidGlassFilter />
          <Preloader />
          <TimecodeBar />
          <AdminModeBadge />
          <main className="pt-14">{children}</main>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
