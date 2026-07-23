"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, BookPlus, BookOpen, BarChart3, CalendarDays, BookMarked } from "lucide-react";
import { seedIfNeeded, getAllReadings, getLatestReading, getAllContexts } from "@/lib/storage";
import type { ReadingEntry, ReadingContext } from "@/lib/storage";
import { getBookName } from "@/features/bible";

export default function DashboardPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [latest, setLatest] = useState<ReadingEntry | undefined>();
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [all, last, ctxs] = await Promise.all([
        getAllReadings(),
        getLatestReading(),
        getAllContexts(),
      ]);
      setReadings(all);
      setLatest(last);
      setContexts(ctxs);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = readings.filter((r) => new Date(r.date) >= startOfWeek).length;
  const thisMonth = readings.filter((r) => new Date(r.date) >= startOfMonth).length;

  const contextCounts: Record<string, number> = {};
  for (const r of readings) for (const tag of (r.tags || [])) contextCounts[tag] = (contextCounts[tag] || 0) + 1;
  const total = readings.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-[#1e3a5f]" />
          Tableau de bord
        </h1>
        <Link href="/new-reading" className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] no-underline flex items-center gap-2">
          <BookPlus className="w-4 h-4" />
          Nouvelle lecture
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookMarked} label="Total lectures" value={String(total)} />
        <StatCard icon={CalendarDays} label="Cette semaine" value={String(thisWeek)} />
        <StatCard icon={BarChart3} label="Ce mois" value={String(thisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-500 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Dernière lecture
          </h2>
          {latest ? (
            <div>
              <p className="text-lg font-medium">
                {getBookName(latest.book)} {latest.chapterStart}
                {latest.chapterEnd && latest.chapterEnd !== latest.chapterStart ? `-${latest.chapterEnd}` : ""}
                {latest.verseStart ? `:${latest.verseStart}` : ""}
                {latest.verseEnd && latest.verseEnd !== latest.verseStart ? `-${latest.verseEnd}` : ""}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(latest.date).toLocaleDateString("fr-FR")}
              </p>
              {latest.notes && <p className="text-sm text-gray-600 mt-2 italic">{latest.notes}</p>}
            </div>
          ) : (
            <p className="text-gray-400">
              Aucune lecture pour le moment.{" "}
              <Link href="/new-reading" className="text-[#1e3a5f] underline">Commencer</Link>
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-500 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Par contexte
          </h2>
          {total === 0 ? (
            <p className="text-gray-400">Aucune donnée.</p>
          ) : (
            <div className="space-y-3">
              {contexts.map((ctx) => {
                const count = contextCounts[ctx.id] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={ctx.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ctx.name}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ctx.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
