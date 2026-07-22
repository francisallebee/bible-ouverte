import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import LayoutClient from "@/lib/pwa/layout-client";

export const metadata: Metadata = {
  title: "Bible Ouverte",
  description: "Suivi de lectures bibliques hors ligne",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Bible Ouverte" },
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-screen">
        <LayoutClient>
          <Sidebar />
          <main className="lg:ml-[var(--nav-width)] p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
            {children}
          </main>
        </LayoutClient>
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
