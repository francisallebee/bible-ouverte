"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { History, BookPlus } from "lucide-react";
import { seedIfNeeded, getAllReadings, getAllContexts, getAllVersions } from "@/lib/storage";
import type { ReadingEntry, ReadingContext, BibleVersion } from "@/lib/storage";
import { BOOKS, getBookName } from "@/features/bible";

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [contextFilter, setContextFilter] = useState("");
  const [bookFilter, setBookFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

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

  const contextMap = useMemo(() => {
    const m: Record<string, ReadingContext> = {};
    for (const c of contexts) m[c.id] = c;
    return m;
  }, [contexts]);

  const versionMap = useMemo(() => {
    const m: Record<string, BibleVersion> = {};
    for (const v of versions) m[v.id] = v;
    return m;
  }, [versions]);

  const filtered = useMemo(() => {
    let result = readings;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.notes && r.notes.toLowerCase().includes(q)) ||
          (r.passageText && r.passageText.toLowerCase().includes(q)),
      );
    }

    if (contextFilter) {
      result = result.filter((r) => r.contextId === contextFilter);
    }

    if (bookFilter) {
      result = result.filter((r) => r.book === bookFilter);
    }

    if (dateStart) {
      result = result.filter((r) => r.date >= dateStart);
    }

    if (dateEnd) {
      result = result.filter((r) => r.date <= dateEnd);
    }

    return result;
  }, [readings, search, contextFilter, bookFilter, dateStart, dateEnd]);

  function resetFilters() {
    setSearch("");
    setContextFilter("");
    setBookFilter("");
    setDateStart("");
    setDateEnd("");
  }

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-[#1e3a5f]" />
          Historique
        </h1>
        <Link
          href="/new-reading"
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] no-underline flex items-center gap-1.5"
        >
          <BookPlus className="w-4 h-4" />
          Nouvelle lecture
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher dans les notes ou le texte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px] sm:min-w-[200px] w-full sm:w-auto"
        />
        <select
          value={contextFilter}
          onChange={(e) => setContextFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les contextes</option>
          {contexts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={bookFilter}
          onChange={(e) => setBookFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les livres</option>
          {BOOKS.map((b) => (
            <option key={b.abbreviation} value={b.abbreviation}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Date début"
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Date fin"
        />
        <button
          onClick={resetFilters}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          Réinitialiser
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucune lecture trouvée.</p>
          <Link
            href="/new-reading"
            className="text-[#1e3a5f] underline text-sm"
          >
            Nouvelle lecture
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const ctx = contextMap[r.contextId];
            return (
              <Link
                key={r.id as number}
                href={`/reading/${r.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors no-underline"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-400">
                    {new Date(r.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {ctx && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: ctx.color + "20",
                        color: ctx.color,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: ctx.color }}
                      />
                      {ctx.name}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {getBookName(r.book)} {r.chapterStart}
                  {r.chapterEnd !== r.chapterStart ? `-${r.chapterEnd}` : ""}
                  :{r.verseStart}
                  {r.verseEnd !== r.verseStart ? `-${r.verseEnd}` : ""}
                </p>
                {r.notes && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {r.notes.length > 50
                      ? r.notes.slice(0, 50) + "…"
                      : r.notes}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
