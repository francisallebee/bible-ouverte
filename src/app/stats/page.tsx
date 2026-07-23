"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { seedIfNeeded, getAllReadings, getAllContexts, getAllVersions } from "@/lib/storage";
import type { ReadingEntry, ReadingContext, BibleVersion } from "@/lib/storage";
import { getBookName } from "@/features/bible";

const COLORS = ["#1e3a5f", "#4a90d9", "#7b68ee", "#2ecc71", "#e74c3c", "#f39c12", "#95a5a6"];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: first, end: last };
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function StatsPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [all, ctxs, vers] = await Promise.all([
        getAllReadings(),
        getAllContexts(),
        getAllVersions(),
      ]);
      setReadings(all);
      setContexts(ctxs);
      setVersions(vers);
      setLoaded(true);
    })();
  }, []);

  const total = readings.length;

  const weekCount = useMemo(() => {
    const { start, end } = getWeekRange();
    return readings.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    }).length;
  }, [readings]);

  const monthCount = useMemo(() => {
    const { start, end } = getMonthRange();
    return readings.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d <= end;
    }).length;
  }, [readings]);

  const byDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of readings) {
      const key = r.date.slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    }
    const result: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = toDateStr(d);
      result.push({ date: fmtDate(d), count: counts[key] || 0 });
    }
    return result;
  }, [readings]);

  const ctxMap = useMemo(() => {
    const m: Record<string, ReadingContext> = {};
    for (const c of contexts) m[c.id] = c;
    return m;
  }, [contexts]);

  const byContext = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of readings) {
      for (const tag of (r.tags || [])) counts[tag] = (counts[tag] || 0) + 1;
    }
    return Object.entries(counts).map(([id, value]) => ({
      name: ctxMap[id]?.name ?? id,
      value,
      color: ctxMap[id]?.color ?? "#95a5a6",
    }));
  }, [readings, ctxMap]);

  const topBooks = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of readings) {
      counts[r.book] = (counts[r.book] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([abbrev, count], i) => ({
        name: getBookName(abbrev),
        count,
        fill: COLORS[i % COLORS.length],
      }));
  }, [readings]);

  const versionMap = useMemo(() => {
    const m: Record<string, BibleVersion> = {};
    for (const v of versions) m[v.id] = v;
    return m;
  }, [versions]);

  const byVersion = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of readings) {
      counts[r.translationId] = (counts[r.translationId] || 0) + 1;
    }
    return Object.entries(counts).map(([id, count], i) => ({
      name: versionMap[id]?.name ?? id,
      count,
      fill: COLORS[i % COLORS.length],
    }));
  }, [readings, versionMap]);

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  if (total === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#1e3a5f]" />
          Statistiques
        </h1>
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune donnée de lecture pour le moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-[#1e3a5f]" />
        Statistiques
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total lectures</p>
          <p className="text-3xl font-bold text-[#1e3a5f]">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Cette semaine</p>
          <p className="text-3xl font-bold text-[#4a90d9]">{weekCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Ce mois</p>
          <p className="text-3xl font-bold text-[#7b68ee]">{monthCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Lectures par jour (30 jours)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byDay}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4a90d9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Répartition par contexte</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={byContext}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {byContext.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Top 10 livres</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topBooks} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topBooks.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Répartition par version</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byVersion}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {byVersion.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
