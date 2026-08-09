"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { History, BookPlus, ChevronRight, ChevronDown, CheckSquare, Trash2, Tag, Loader } from "lucide-react";
import { seedIfNeeded, getAllReadings, getAllVersions, getAllContexts, deleteReading, updateReading } from "@/lib/storage";
import type { ReadingEntry, BibleVersion, ReadingContext } from "@/lib/storage";
import { sortContexts } from "@/components/ContextPicker";
import { BOOKS, getBookName } from "@/features/bible";

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingEntry[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);
  /** Dates dépliées. Tout est replié à l'ouverture. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /**
   * Sélection multiple. Hors de ce mode, une entrée reste un lien vers son
   * détail : la sélection ne doit pas voler le geste principal de la page.
   */
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [bulkContext, setBulkContext] = useState("");

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

  function toggleSelected(readingId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(readingId)) next.delete(readingId);
      else next.add(readingId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setBulkContext("");
  }

  /**
   * Porte sur toutes les entrées que les filtres laissent passer, y compris
   * celles des jours repliés — d'où le dépliage : sélectionner puis supprimer
   * des lignes qu'on ne voit pas serait un piège. Le nombre annoncé sur le
   * bouton correspond ainsi toujours à ce qui est à l'écran.
   */
  function selectAllFiltered() {
    setExpanded(new Set(groups.map((g) => g.date)));
    setSelected(new Set(filtered.map((r) => r.id as number)));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const message = ids.length === 1
      ? "Supprimer cette lecture ? Cette action est définitive."
      : `Supprimer ces ${ids.length} lectures ? Cette action est définitive.`;
    if (!window.confirm(message)) return;

    setBusy(true);
    for (const readingId of ids) {
      await deleteReading(readingId);
    }
    // L'état local est mis à jour directement, sans repasser par
    // `getAllReadings()`. Celui-ci resynchronise depuis Supabase, où l'écriture
    // partie en arrière-plan n'est pas forcément arrivée : la liste se
    // repeuplait alors avec l'état d'avant. Le cache IndexedDB, lui, est déjà
    // à jour — `deleteReading` l'écrit avant de pousser vers le cloud.
    setReadings((prev) => prev.filter((r) => !selected.has(r.id as number)));
    setBusy(false);
    exitSelectMode();
  }

  /**
   * Seul le contexte est modifiable en bloc. Les autres champs — livre,
   * chapitres, versets — décrivent un passage précis et n'ont pas de sens
   * commun à plusieurs entrées.
   */
  async function handleBulkContext() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBusy(true);
    for (const readingId of ids) {
      await updateReading(readingId, { contextId: bulkContext });
    }
    // Voir `handleBulkDelete` : l'état local plutôt qu'une resynchronisation,
    // qui rapporterait l'ancienne valeur tant que l'écriture distante est en
    // vol.
    setReadings((prev) =>
      prev.map((r) =>
        selected.has(r.id as number) ? { ...r, contextId: bulkContext } : r,
      ),
    );
    setBusy(false);
    exitSelectMode();
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
        <div className="flex items-center gap-2">
          {readings.length > 0 && !selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" aria-hidden="true" />
              Sélectionner
            </button>
          )}
          <Link
            href="/new-reading"
            className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] no-underline flex items-center gap-1.5"
          >
            <BookPlus className="w-4 h-4" />
            Nouvelle lecture
          </Link>
        </div>
      </div>

      {selectMode && (
        <div className="bg-[--primary-light] border border-[--primary]/20 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[--primary] mr-1">
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>

          <button
            onClick={selectAllFiltered}
            disabled={busy || filtered.length === 0}
            className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Tout sélectionner ({filtered.length})
          </button>

          <div className="flex items-center gap-1.5">
            <label htmlFor="bulk-context" className="sr-only">Contexte à appliquer</label>
            <select
              id="bulk-context"
              value={bulkContext}
              onChange={(e) => setBulkContext(e.target.value)}
              disabled={busy || selected.size === 0}
              className="border border-gray-300 bg-white rounded-lg px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="">— Aucun contexte —</option>
              {sortContexts(contexts).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ""}{c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkContext}
              disabled={busy || selected.size === 0}
              className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" aria-hidden="true" />
              Appliquer
            </button>
          </div>

          <button
            onClick={handleBulkDelete}
            disabled={busy || selected.size === 0}
            className="border border-red-200 bg-white rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            {busy
              ? <Loader className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
            Supprimer
          </button>

          <button
            onClick={exitSelectMode}
            disabled={busy}
            className="text-xs text-gray-500 hover:text-gray-700 ml-auto disabled:opacity-50"
          >
            Quitter
          </button>
        </div>
      )}

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
                      const readingId = r.id as number;
                      const content = (
                        <>
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
                        </>
                      );

                      if (!selectMode) {
                        return (
                          <Link
                            key={readingId}
                            href={`/reading/${readingId}`}
                            className="block px-4 py-3 hover:bg-gray-50 transition-colors no-underline"
                          >
                            {content}
                          </Link>
                        );
                      }

                      const isSelected = selected.has(readingId);
                      return (
                        <label
                          key={readingId}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected ? "bg-[--primary-light]" : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelected(readingId)}
                            disabled={busy}
                            className="accent-[--primary] w-4 h-4 mt-1 shrink-0"
                          />
                          <span className="flex-1 min-w-0">{content}</span>
                        </label>
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
