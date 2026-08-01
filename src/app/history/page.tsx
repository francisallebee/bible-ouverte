"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { History, BookPlus, ChevronRight, ChevronDown } from "lucide-react";
import { seedIfNeeded, getAllReadings, getAllVersions, getAllContexts } from "@/lib/storage";
import type { ReadingEntry, BibleVersion, ReadingContext } from "@/lib/storage";
import { BOOKS, getBookName } from "@/features/bible";

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);
  /** Dates dépliées. Tout est replié à l'ouverture. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [bookFilter, setBookFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [all, vers, ctxs] = await Promise.all([
        getAllReadings(),
        getAllVersions(),
        getAllContexts(),
      ]);
      setReadings(all);
      setVersions(vers);
      setContexts(ctxs);
      setLoaded(true);
    })();
  }, []);

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
  }, [readings, search, bookFilter, dateStart, dateEnd]);

  /** Lectures regroupées par date, la plus récente d'abord. */
  const groups = useMemo(() => {
    const byDate: Record<string, ReadingEntry[]> = {};
    for (const r of filtered) {
      const key = r.date.slice(0, 10);
      (byDate[key] ??= []).push(r);
    }
    return Object.entries(byDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, entries]) => ({ date, entries }));
  }, [filtered]);

  const contextMap = useMemo(() => {
    const m: Record<string, ReadingContext> = {};
    for (const c of contexts) m[c.id] = c;
    return m;
  }, [contexts]);

  const allExpanded = groups.length > 0 && groups.every((g) => expanded.has(g.date));

  function toggleDate(date: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(groups.map((g) => g.date)));
  }

  function resetFilters() {
    setSearch("");
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
          <History className="w-6 h-6 text-[--primary]" />
          Historique
        </h1>
        <Link
          href="/new-reading"
          className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] no-underline flex items-center gap-1.5"
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
        {groups.length > 0 && (
          <button
            onClick={toggleAll}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1.5"
          >
            {allExpanded
              ? <><ChevronRight className="w-4 h-4" aria-hidden="true" />Tout replier</>
              : <><ChevronDown className="w-4 h-4" aria-hidden="true" />Tout déplier</>}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucune lecture trouvée.</p>
          <Link
            href="/new-reading"
            className="text-[--primary] underline text-sm"
          >
            Nouvelle lecture
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isOpen = expanded.has(group.date);
            const panelId = `jour-${group.date}`;
            return (
              <div key={group.date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleDate(group.date)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />}
                  <span className="flex-1 min-w-0 font-medium text-gray-900 truncate">
                    {new Date(group.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {group.entries.length} lecture{group.entries.length > 1 ? "s" : ""}
                  </span>
                </button>

                {isOpen && (
                  <div id={panelId} className="border-t border-gray-100 divide-y divide-gray-100">
                    {group.entries.map((r) => {
                      const ctx = r.contextId ? contextMap[r.contextId] : undefined;
                      return (
                        <Link
                          key={r.id as number}
                          href={`/reading/${r.id}`}
                          className="block px-4 py-3 hover:bg-gray-50 transition-colors no-underline"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-gray-900">
                              {getBookName(r.book)} {r.chapterStart}
                              {r.chapterEnd !== r.chapterStart ? `-${r.chapterEnd}` : ""}
                              :{r.verseStart}
                              {r.verseEnd !== r.verseStart ? `-${r.verseEnd}` : ""}
                            </p>
                            {ctx && (
                              <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 shrink-0">
                                <span aria-hidden="true">{ctx.emoji} </span>{ctx.name}
                              </span>
                            )}
                          </div>
                          {r.notes && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {r.notes.length > 50 ? r.notes.slice(0, 50) + "…" : r.notes}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
