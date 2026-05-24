import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { EazoProvider } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import KintsugiNav from "@/components/layout/kintsugi-nav";
import { ThemeProvider } from "@/components/ThemeProvider";
import SplashGateProvider from "@/components/SplashGateProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#221E1D",
};

export const metadata: Metadata = {
  title: "Kintsugi — Heal in Gold",
  description:
    "A gentle companion for mapping emotional fractures and reframing pain through the philosophy of Kintsugi.",
  metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : undefined,
  openGraph: {
    title: "Kintsugi — Heal in Gold",
    description: "Kintsugi — Heal in Gold is a mental wellness companion built on the Japanese art of repairing broken pottery with gold lacquer — treating emotional p...",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Kintsugi — Heal in Gold",
    description: "Kintsugi — Heal in Gold is a mental wellness companion built on the Japanese art of repairing broken pottery with gold lacquer — treating emotional p...",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        inter.variable,
        cormorant.variable
      )}
    >
      <body
        className="min-h-svh flex flex-col"
        style={{ backgroundColor: "#221E1D", color: "#F5F0E8" }}
      >
        <EazoProvider>
          <UserSyncEffect />
          <ThemeProvider>
          <SplashGateProvider>
          <div className="flex min-h-svh" style={{ backgroundColor: "var(--k-bg)", color: "var(--k-text)", transition: "background-color 0.5s, color 0.5s" }}>
            {/* Desktop sidebar — hidden on mobile */}
            <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 md:border-r z-20 transition-colors duration-500"
              style={{ borderColor: "var(--k-border)", backgroundColor: "var(--k-bg-surface)" }}>
              <KintsugiNav variant="sidebar" />
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col md:ml-60 min-h-svh">
              {children}
            </main>
          </div>

          {/* Mobile bottom nav */}
          <nav className="fixed bottom-0 left-0 right-0 md:hidden z-30 border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-500"
            style={{ borderColor: "var(--k-border)", backgroundColor: "var(--k-bg-surface)" }}>
            <KintsugiNav variant="bottom" />
          </nav>

          <Toaster />
          </SplashGateProvider>
          </ThemeProvider>
        </EazoProvider>
      </body>
    </html>
  );
}
