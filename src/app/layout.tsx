import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import AppShell from "@/components/AppShell";

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
    // `lang` et `dir` sont repris côté client par `I18nProvider` dès que la
    // langue de l'utilisateur est connue. Les valeurs posées ici sont celles du
    // rendu serveur, qui ne sait rien de lui.
    <html lang="fr" dir="ltr">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        {/* iOS ignore le SVG et la transparence : PNG opaque de 180×180. */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          {/* Sous AuthProvider : la langue vit dans les réglages du compte, et
              doit être relue quand on change de compte. */}
          <I18nProvider>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </AuthProvider>
        <Script src="/sw-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
