"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FlaskConical,
  BookPlus, Search, History, BarChart3,
  BookOpen, Settings, Menu, X, Trophy, LogOut, Shield,
  User, Route, MessageCircle, Heart, Sparkles, Sun, Brain, Mail } from "lucide-react";
import { seedIfNeeded } from "@/lib/storage";
import { compterMesNonLus } from "@/lib/storage/messages-store";
import { APP_VERSION } from "@/lib/version";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/I18nContext";
import type { Dictionary } from "@/lib/i18n/ui/fr";
import { isPageVisible, ordonnerPages } from "@/lib/setup";

/**
 * Le libellé est désigné par sa clé, et non écrit ici : la liste est constante,
 * la traduction ne l'est pas. `label` reçoit le dictionnaire et y puise —
 * ainsi une clé renommée casse la compilation plutôt que l'affichage.
 */
export const NAV_LINKS: {
  href: string
  label: (t: Dictionary) => string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}[] = [
  { href: "/new-reading", label: (t) => t.nav.newReading, icon: BookPlus },
  { href: "/plans", label: (t) => t.nav.plans, icon: BookOpen },
  { href: "/search", label: (t) => t.nav.search, icon: Search },
  { href: "/progress", label: (t) => t.nav.progress, icon: Trophy },
  { href: "/history", label: (t) => t.nav.history, icon: History },
  { href: "/stats", label: (t) => t.nav.stats, icon: BarChart3 },
  { href: "/quiz", label: (t) => t.nav.quiz, icon: Sparkles },
  { href: "/verset-du-jour", label: (t) => t.nav.versetDuJour, icon: Sun },
  { href: "/memorisation", label: (t) => t.nav.memorisation, icon: Brain },
  { href: "/roadmap", label: (t) => t.nav.roadmap, icon: Route },
  { href: "/messages", label: (t) => t.nav.messages, icon: Mail },
  { href: "/support", label: (t) => t.nav.support, icon: MessageCircle },
  { href: "/soutenir", label: (t) => t.nav.donate, icon: Heart },
  // `/profil` n'est PAS dans cette liste : le bloc du bas de la barre —
  // avatar, nom, puis déconnexion — y mène déjà. Deux entrées vers le même
  // écran encombraient un menu qui débordait déjà de l'écran.
  //
  // `/settings` et `/admin` n'y sont plus non plus depuis le 29 août 2026 :
  // ce sont des écrans de compte, pas de lecture, et ils ont rejoint le bloc
  // du bas sous le profil — voir `NAV_COMPTE`. C'est aussi ce qui les met
  // hors de portée du réordonnancement, ce qui est voulu : le bloc du bas est
  // un point fixe, et Réglages doit rester trouvable même après que
  // l'utilisateur a rangé son menu.
];

/**
 * Les entrées du compte, sous le profil et au-dessus de la déconnexion.
 *
 * Elles ne se masquent ni ne se réordonnent : masquer Réglages rendrait tout
 * réglage irréversible, y compris celui-là — c'est la raison qui tenait déjà
 * `/settings` hors de `HIDEABLE_PAGES`.
 */
export const NAV_COMPTE: {
  href: string
  label: (t: Dictionary) => string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}[] = [
  { href: "/settings", label: (t) => t.nav.settings, icon: Settings },
  { href: "/admin", label: (t) => t.nav.admin, icon: Shield, adminOnly: true },
  { href: "/avance", label: (t) => t.nav.avance, icon: FlaskConical, adminOnly: true },
];

export default function Sidebar(
  { hiddenPages, pageOrder }: { hiddenPages?: string[]; pageOrder?: string[] },
) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const t = useT();
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => { seedIfNeeded() }, []);

  /**
   * Le compteur de messages non lus.
   *
   * Une seule requête, `head: true` : le compte revient dans l'en-tête et
   * aucun corps de message ne descend. Elle se relance au changement de page —
   * c'est ce qui fait disparaître la pastille après un passage par
   * `/messages`, sans qu'aucun état ne soit partagé entre les deux écrans.
   *
   * Un échec est silencieux et rend zéro : une pastille est une invitation,
   * pas une information dont l'absence doit alarmer.
   */
  const [nonLus, setNonLus] = useState(0);

  useEffect(() => {
    if (!user) { setNonLus(0); return }
    let annule = false;
    compterMesNonLus().then((n) => { if (!annule) setNonLus(n) });
    return () => { annule = true };
  }, [user, pathname]);

  useEffect(() => {
    const name = localStorage.getItem("profile_name") || "";
    const avatar = localStorage.getItem("profile_avatar");
    setProfileName(name);
    setProfileAvatar(avatar);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 start-4 z-50 w-11 h-11 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition active:scale-95"
        aria-label={t.nav.menu}
      >
        {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <nav
        // `start-0` et `border-e` plutôt que `left-0` et `border-r` : la barre
        // passe d'elle-même à droite en écriture droite-à-gauche. Le retrait
        // hors écran, lui, doit changer de signe — d'où la variante `rtl:`.
        className={`fixed top-0 start-0 bottom-0 w-64 lg:w-[var(--nav-width)] bg-white border-e border-gray-200 flex flex-col p-4 z-40 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        } lg:translate-x-0`}
      >
        <Link href="/new-reading" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-xl font-bold text-[--primary] mb-8 no-underline pt-2 shrink-0">
          <img src="/logo.svg" alt="Logo" width="28" height="28" className="w-7 h-7" />
          <span>Bible Ouverte</span>
        </Link>

        {/* `overflow-y-auto` et surtout `min-h-0`.
            La barre est `fixed top-0 bottom-0` : quand les entrées dépassent la
            hauteur de l'écran, le bas — profil, déconnexion, version — sortait
            du cadre sans qu'aucun défilement ne permette d'y revenir. Il fallait
            quinze entrées et un écran de moins de 900 px, ce qui est le cas de
            tout téléphone : mesuré à 862 px nécessaires le 20 août 2026.
            `min-h-0` n'est pas décoratif — sans lui, un enfant `flex-1` refuse
            de se comprimer sous la taille de son contenu, et `overflow-y-auto`
            n'a rien à faire défiler. */}
        <div className="flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto">
          {ordonnerPages(
            NAV_LINKS
              .filter(l => !l.adminOnly || isAdmin)
              .filter(l => isPageVisible(l.href, hiddenPages)),
            pageOrder,
          ).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm transition no-underline flex items-center gap-3 ${
                  active
                    ? "bg-[--primary] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label(t)}</span>
                {/* La pastille des messages non lus. Ses couleurs de texte sont
                    posées explicitement : `bg-red-500` n'est remappé nulle part
                    en mode sombre, et un texte sans classe y hériterait de
                    `--text` (règle 15). */}
                {href === "/messages" && nonLus > 0 && (
                  <span
                    aria-label={t.messages.navBadge(nonLus)}
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                      active ? "bg-white text-[--primary]" : "bg-red-500 text-white"
                    }`}
                  >
                    {nonLus}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="pt-3 border-t border-gray-100 shrink-0">
            <Link href="/profil" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors no-underline">
              {profileAvatar ? (
                <img src={profileAvatar} alt="" width="32" height="32" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-[--primary]">
                  {(profileName?.[0] || user.email?.[0] || "?").toUpperCase()}
                </div>
              )}
              <span className="flex-1 truncate text-sm text-gray-700">{profileName || user.email}</span>
            </Link>

            {NAV_COMPTE
              .filter(l => !l.adminOnly || isAdmin)
              .map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mt-0.5 transition-colors no-underline ${
                      active
                        ? "bg-[--primary] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{label(t)}</span>
                  </Link>
                );
              })}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full mt-0.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.signOut}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100 shrink-0">
          Bible Ouverte v{APP_VERSION}
        </p>
      </nav>
    </>
  );
}
