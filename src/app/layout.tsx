import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Lora, EB_Garamond, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import AppShell from "@/components/AppShell";

/**
 * Les polices proposées aux Réglages, installées avec l'application.
 *
 * `next/font` les télécharge à la compilation et les sert depuis le même
 * domaine : aucune requête vers Google au chargement, et donc aucune fuite
 * d'adresse IP des lecteurs. `display: "swap"` laisse le texte s'afficher avec
 * la police système en attendant la sienne, plutôt que de le retenir.
 *
 * Seules leurs **variables** sont posées ici. C'est le réglage de l'utilisateur
 * qui décide laquelle sert, via `--font-ui` et `--font-reading` — voir
 * `lib/fonts.ts`.
 *
 * `preload: false` est le point à ne pas retirer. Par défaut, `next/font` pose
 * un `<link rel="preload">` par police et le navigateur les télécharge toutes
 * au chargement — mesuré le 19 août 2026 : cinq fichiers `woff2` tirés sur un
 * appareil réglé sur « Système », donc n'en utilisant aucune. Sans préchargement,
 * la police n'est demandée que si un texte l'emploie réellement, et le défaut
 * ne coûte plus rien.
 */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false });
const garamond = EB_Garamond({ subsets: ["latin"], variable: "--font-garamond", display: "swap", preload: false });
const hyperlegible = Atkinson_Hyperlegible({
  subsets: ["latin"], weight: ["400", "700"], variable: "--font-hyperlegible",
  display: "swap", preload: false,
});

const POLICES = [inter, lora, garamond, hyperlegible].map((f) => f.variable).join(" ");

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
    <html lang="fr" dir="ltr" className={POLICES}>
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
