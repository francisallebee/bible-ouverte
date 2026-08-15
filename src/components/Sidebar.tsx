"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookPlus, Search, History, BarChart3,
  BookOpen, Settings, Menu, X, Trophy, LogOut, Shield,
  User, Route, MessageCircle, Heart,
} from "lucide-react";
import { seedIfNeeded } from "@/lib/storage";
import { APP_VERSION } from "@/lib/version";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/contexts/I18nContext";
import type { Dictionary } from "@/lib/i18n/ui/fr";

/**
 * Le libellé est désigné par sa clé, et non écrit ici : la liste est constante,
 * la traduction ne l'est pas. `label` reçoit le dictionnaire et y puise —
 * ainsi une clé renommée casse la compilation plutôt que l'affichage.
 */
const links: {
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
  { href: "/settings", label: (t) => t.nav.settings, icon: Settings },
  { href: "/roadmap", label: (t) => t.nav.roadmap, icon: Route },
  { href: "/support", label: (t) => t.nav.support, icon: MessageCircle },
  { href: "/soutenir", label: (t) => t.nav.donate, icon: Heart },
  { href: "/profil", label: (t) => t.nav.profile, icon: User },
  { href: "/admin", label: (t) => t.nav.admin, icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const t = useT();
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  useEffect(() => { seedIfNeeded() }, []);

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
        <Link href="/new-reading" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-xl font-bold text-[--primary] mb-8 no-underline pt-2">
          <img src="/logo.svg" alt="Logo" width="28" height="28" className="w-7 h-7" />
          <span>Bible Ouverte</span>
        </Link>

        <div className="flex flex-col gap-0.5 flex-1">
          {links
            .filter(l => !l.adminOnly || isAdmin)
            .map(({ href, label, icon: Icon }) => {
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
                {label(t)}
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="pt-3 border-t border-gray-100">
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full mt-0.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.signOut}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
          Bible Ouverte v{APP_VERSION}
        </p>
      </nav>
    </>
  );
}
