"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookPlus, Search, History, BarChart3,
  BookOpen, Settings, Menu, X, Trophy, LogOut, Shield,
  User, Route,
} from "lucide-react";
import { seedIfNeeded } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const links: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean }[] = [
  { href: "/new-reading", label: "Nouvelle lecture", icon: BookPlus },
  { href: "/plans", label: "Plans de lecture", icon: BookOpen },
  { href: "/search", label: "Recherche biblique", icon: Search },
  { href: "/progress", label: "Progression", icon: Trophy },
  { href: "/history", label: "Historique", icon: History },
  { href: "/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/settings", label: "Réglages", icon: Settings },
  { href: "/roadmap", label: "Feuille de route", icon: Route },
  { href: "/profil", label: "Mon profil", icon: User },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileColor, setProfileColor] = useState("#1e3a5f");

  useEffect(() => { seedIfNeeded() }, []);

  useEffect(() => {
    const name = localStorage.getItem("profile_name") || "";
    const avatar = localStorage.getItem("profile_avatar");
    const color = localStorage.getItem("profile_color") || "#1e3a5f";
    setProfileName(name);
    setProfileAvatar(avatar);
    setProfileColor(color);
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
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-all active:scale-95"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <nav
        className={`fixed top-0 left-0 bottom-0 w-64 lg:w-[var(--nav-width)] bg-white border-r border-gray-200 flex flex-col p-4 z-40 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-xl font-bold text-[#1e3a5f] mb-8 no-underline pt-2">
          <BookOpen className="w-6 h-6" />
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
                className={`rounded-lg px-3 py-2.5 text-sm transition-all no-underline flex items-center gap-3 ${
                  active
                    ? "bg-[#1e3a5f] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="pt-3 border-t border-gray-100">
            <Link href="/profil" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors no-underline">
              {profileAvatar ? (
                <img src={profileAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: profileColor }}>
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
              Déconnexion
            </button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
          Bible Ouverte v0.1.0
        </p>
      </nav>
    </>
  );
}
