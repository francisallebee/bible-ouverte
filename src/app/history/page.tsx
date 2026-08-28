"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { History, BookPlus, ChevronRight, ChevronDown, CheckSquare, Trash2, Tag, Loader, Layers } from "lucide-react";
import { seedIfNeeded, getAllReadings, getAllVersions, getAllContexts, deleteReading, updateReading } from "@/lib/storage";
import type { ReadingEntry, BibleVersion, ReadingContext } from "@/lib/storage";
import { grouperParSaisie, referencesDe, referenceDe } from "@/lib/lectures/saisies";
import type { Saisie } from "@/lib/lectures/saisies";
import { sortContexts } from "@/components/ContextPicker";
import BookPicker from "@/components/BookPicker";
import { useI18n, useBookName, useBooks, useContextName } from "@/contexts/I18nContext";
import { isOldTestament } from "@/features/bible";
import { formatDate } from "@/lib/i18n/format";
import { localeInfo } from "@/lib/i18n/locales";

/** Un nœud de l'arbre de regroupement : soit des enfants, soit des lectures. */
type Noeud = {
  cle: string;
  titre: string;
  compte: number;
  enfants?: Noeud[];
  entrees?: ReadingEntry[];
};

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const getBookName = useBookName();
  const contextName = useContextName();
  const books = useBooks();
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

  /** L'axe de regroupement. La date reste le défaut : c'est le journal d'un lecteur. */
  const [axe, setAxe] = useState<"date" | "book" | "context">("date");

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

  /**
   * Les lectures en arbre, selon l'axe choisi.
   *
   * Un seul type de nœud pour les trois axes, et une profondeur variable :
   * la date descend sur trois niveaux — année, mois, jour —, le livre sur
   * deux — testament, livre —, le contexte sur un seul. Le rendu est
   * récursif, il n'a donc pas à connaître l'axe.
   *
   * Les clés portent leur préfixe d'axe (`a:2026`, `l:JHN`) : sans cela, un
   * repli ouvert sur une année rouvrirait un livre du même nom après un
   * changement d'axe.
   */
  const arbre = useMemo<Noeud[]>(() => {
    if (axe === "date") {
      const parAnnee = new Map<string, Map<string, ReadingEntry[]>>();
      for (const r of filtered) {
        const jour = r.date.slice(0, 10);
        const annee = jour.slice(0, 4);
        const mois = jour.slice(0, 7);
        const m = parAnnee.get(annee) ?? new Map<string, ReadingEntry[]>();
        const j = m.get(mois) ?? [];
        // Le jour est reconstitué plus bas ; on empile d'abord par mois.
        j.push(r);
        m.set(mois, j);
        parAnnee.set(annee, m);
      }
      return Array.from(parAnnee.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([annee, mois]) => {
          const enfants = Array.from(mois.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([cleMois, lectures]) => {
              const parJour = new Map<string, ReadingEntry[]>();
              for (const r of lectures) {
                const jour = r.date.slice(0, 10);
                parJour.set(jour, [...(parJour.get(jour) ?? []), r]);
              }
              const jours = Array.from(parJour.entries())
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([jour, entrees]) => ({
                  cle: `j:${jour}`,
                  titre: formatDate(locale, jour, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  }),
                  compte: entrees.length,
                  entrees,
                }));
              return {
                cle: `m:${cleMois}`,
                titre: formatDate(locale, `${cleMois}-01`, { month: "long", year: "numeric" }),
                compte: lectures.length,
                enfants: jours,
              };
            });
          return {
            cle: `a:${annee}`,
            titre: annee,
            compte: enfants.reduce((n, e) => n + e.compte, 0),
            enfants,
          };
        });
    }

    if (axe === "book") {
      const parLivre = new Map<string, ReadingEntry[]>();
      for (const r of filtered) parLivre.set(r.book, [...(parLivre.get(r.book) ?? []), r]);
      // L'ordre canonique vient de `books`, jamais de l'alphabet : « 2 Rois »
      // ne se range pas après « Actes ».
      const ordonnes = books
        .filter((b) => parLivre.has(b.abbreviation))
        .map((b) => ({
          cle: `l:${b.abbreviation}`,
          titre: b.name,
          compte: parLivre.get(b.abbreviation)!.length,
          entrees: parLivre.get(b.abbreviation)!,
          ancien: isOldTestament(b.abbreviation),
        }));
      return (["old", "new"] as const)
        .map((testament) => {
          const enfants = ordonnes
            .filter((l) => l.ancien === (testament === "old"))
            .map(({ ancien, ...noeud }) => noeud);
          return {
            cle: `t:${testament}`,
            titre: testament === "old" ? t.bookPicker.oldTestament : t.bookPicker.newTestament,
            compte: enfants.reduce((n, e) => n + e.compte, 0),
            enfants,
          };
        })
        .filter((n) => n.compte > 0);
    }

    const parContexte = new Map<string, ReadingEntry[]>();
    for (const r of filtered) {
      const cle = r.contextId || "";
      parContexte.set(cle, [...(parContexte.get(cle) ?? []), r]);
    }
    return Array.from(parContexte.entries())
      .map(([id, entrees]) => {
        const ctx = id ? contexts.find((c) => c.id === id) : undefined;
        return {
          cle: `c:${id || "aucun"}`,
          titre: ctx ? `${ctx.emoji} ${contextName(ctx)}` : t.contextPicker.none,
          compte: entrees.length,
          entrees,
        };
      })
      .sort((a, b) => a.titre.localeCompare(b.titre, localeInfo(locale).tag));
  }, [filtered, axe, locale, books, contexts, contextName, t]);

  /** Toutes les clés de l'arbre, pour « tout déplier ». */
  const toutesLesCles = useMemo(() => {
    const cles: string[] = [];
    const parcours = (noeuds: Noeud[]) => {
      for (const n of noeuds) {
        cles.push(n.cle);
        if (n.enfants) parcours(n.enfants);
      }
    };
    parcours(arbre);
    return cles;
  }, [arbre]);

  const contextMap = useMemo(() => {
    const m: Record<string, ReadingContext> = {};
    for (const c of contexts) m[c.id] = c;
    return m;
  }, [contexts]);

  const allExpanded = toutesLesCles.length > 0 && toutesLesCles.every((c) => expanded.has(c));

  function toggleCle(cle: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cle)) next.delete(cle);
      else next.add(cle);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(toutesLesCles));
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

  /**
   * Cocher ou décocher tout un enregistrement.
   *
   * **Tout ou rien, et le tout l'emporte.** Un groupe partiellement coché se
   * coche entièrement plutôt que de se vider : c'est le geste qu'on attend
   * d'une case d'en-tête, et l'autre sens ferait perdre une sélection déjà
   * faite d'un clic destiné à l'étendre.
   */
  function toggleGroupe(ids: number[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
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
    setExpanded(new Set(toutesLesCles));
    setSelected(new Set(filtered.map((r) => r.id as number)));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const message = ids.length === 1
      ? t.history.confirmDeleteOne
      : t.history.confirmDeleteMany(ids.length);
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
    return <p className="text-gray-500">{t.common.loading}</p>;
  }

  /** Une lecture, telle qu'elle s'affiche dans la liste. */
  function rendreLecture(r: ReadingEntry, retrait = false) {
    const ctx = r.contextId ? contextMap[r.contextId] : undefined;
    const readingId = r.id as number;
    const marge = retrait ? "ps-11" : "ps-4";
    const content = (
      <>
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-gray-900">
            {referenceDe(r, getBookName)}
          </p>
          {ctx && (
            <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 shrink-0">
              <span aria-hidden="true">{ctx.emoji} </span>{contextName(ctx)}
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
          className={`block ${marge} pe-4 py-3 hover:bg-gray-50 transition-colors no-underline`}
        >
          {content}
        </Link>
      );
    }

    const isSelected = selected.has(readingId);
    return (
      <label
        key={readingId}
        className={`flex items-start gap-3 ${marge} pe-4 py-3 cursor-pointer transition-colors ${
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
  }

  /**
   * Un enregistrement qui a produit plusieurs lectures, replié en une entrée.
   *
   * Il porte le résumé de ses passages et se déplie sur la liste, où chaque
   * lecture reste un lien vers son détail : **rien n'est masqué, seulement
   * rassemblé**. La case d'en-tête coche l'enregistrement entier — sans elle,
   * cocher 39 passages un par un dans un groupe replié serait un piège.
   */
  function rendreGroupe(saisie: Saisie) {
    const ouvert = expanded.has(saisie.cle);
    const panelId = `saisie-${saisie.cle}`;
    const references = referencesDe(saisie.entrees, getBookName);
    const tetes = references.slice(0, 3).join(", ");
    const reste = references.length - Math.min(3, references.length);
    const premiere = saisie.entrees[0];
    const ctx = premiere.contextId ? contextMap[premiere.contextId] : undefined;
    const ids = saisie.entrees.map((e) => e.id as number);
    const toutCoche = ids.every((id) => selected.has(id));

    return (
      <div key={saisie.cle}>
        <div className={`flex items-start gap-3 ps-4 pe-2 py-3 transition-colors ${
          selectMode && toutCoche ? "bg-[--primary-light]" : ""
        }`}>
          {selectMode && (
            <input
              type="checkbox"
              checked={toutCoche}
              onChange={() => toggleGroupe(ids)}
              disabled={busy}
              aria-label={t.history.selectGroup}
              className="accent-[--primary] w-4 h-4 mt-1 shrink-0"
            />
          )}
          <button
            type="button"
            onClick={() => toggleCle(saisie.cle)}
            aria-expanded={ouvert}
            aria-controls={panelId}
            className="flex-1 min-w-0 flex items-start gap-2 text-start hover:opacity-80 transition-opacity"
          >
            <Layers className="w-4 h-4 text-[--primary] mt-1 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-base font-semibold text-gray-900 truncate">
                  {tetes}{reste > 0 ? ` ${t.history.andMore(reste)}` : ""}
                </span>
                {ctx && (
                  <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 shrink-0">
                    <span aria-hidden="true">{ctx.emoji} </span>{contextName(ctx)}
                  </span>
                )}
              </span>
              <span className="block text-sm text-gray-500 mt-1">
                {t.history.passageCount(saisie.entrees.length)}
                {premiere.notes ? ` — ${premiere.notes.length > 40 ? premiere.notes.slice(0, 40) + "…" : premiere.notes}` : ""}
              </span>
            </span>
            {ouvert
              ? <ChevronDown className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-400 mt-1 shrink-0 rtl:rotate-180" />}
          </button>
        </div>
        {ouvert && (
          <div id={panelId} className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50/50">
            {saisie.entrees.map((r) => rendreLecture(r, true))}
          </div>
        )}
      </div>
    );
  }

  /**
   * Les lectures d'un nœud, regroupées par enregistrement.
   *
   * Le regroupement s'applique aux trois axes et non au seul axe des dates :
   * il porte sur ce qui a été saisi d'un geste, ce qui reste vrai qu'on
   * regarde par livre ou par contexte.
   */
  function rendreEntrees(entrees: ReadingEntry[]) {
    return (
      <div className="border-t border-gray-100 divide-y divide-gray-100">
        {grouperParSaisie(entrees).map((saisie) =>
          saisie.entrees.length === 1
            ? rendreLecture(saisie.entrees[0])
            : rendreGroupe(saisie))}
      </div>
    );
  }

  /**
   * Rendu récursif : le nœud ne sait pas de quel axe il vient, seulement s'il
   * porte des enfants ou des lectures. Le retrait croît avec la profondeur,
   * en propriété logique pour que l'arabe le pose à droite.
   */
  function rendreNoeud(n: Noeud, profondeur: number) {
    const ouvert = expanded.has(n.cle);
    const panelId = `groupe-${n.cle}`;
    return (
      <div key={n.cle}
        className={profondeur === 0
          ? "bg-white rounded-xl border border-gray-200 overflow-hidden"
          : "border-t border-gray-100"}>
        <button
          type="button"
          onClick={() => toggleCle(n.cle)}
          aria-expanded={ouvert}
          aria-controls={panelId}
          style={{ paddingInlineStart: `${1 + profondeur}rem` }}
          className="w-full flex items-center gap-2 pe-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          {ouvert
            ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
            : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />}
          <span className={`flex-1 min-w-0 truncate ${
            profondeur === 0 ? "font-medium text-gray-900" : "text-gray-700"
          }`}>
            {n.titre}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            {t.history.readingCount(n.compte)}
          </span>
        </button>

        {ouvert && (
          <div id={panelId}>
            {n.enfants
              ? n.enfants.map((enfant) => rendreNoeud(enfant, profondeur + 1))
              : rendreEntrees(n.entrees ?? [])}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-[--primary]" />
          {t.history.title}
        </h1>
        <div className="flex items-center gap-2">
          {readings.length > 0 && !selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" aria-hidden="true" />
              {t.history.select}
            </button>
          )}
          <Link
            href="/new-reading"
            className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] no-underline flex items-center gap-1.5"
          >
            <BookPlus className="w-4 h-4" />
            {t.nav.newReading}
          </Link>
        </div>
      </div>

      {selectMode && (
        <div className="bg-[--primary-light] border border-[--primary]/20 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[--primary] me-1">
            {t.history.selectedCount(selected.size)}
          </span>

          <button
            onClick={selectAllFiltered}
            disabled={busy || filtered.length === 0}
            className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            {t.history.selectAll(filtered.length)}
          </button>

          <div className="flex items-center gap-1.5">
            <label htmlFor="bulk-context" className="sr-only">{t.history.contextToApply}</label>
            <select
              id="bulk-context"
              value={bulkContext}
              onChange={(e) => setBulkContext(e.target.value)}
              disabled={busy || selected.size === 0}
              className="border border-gray-300 bg-white rounded-lg px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="">{t.contextPicker.none}</option>
              {sortContexts(contexts, contextName, localeInfo(locale).tag).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji ? `${c.emoji} ` : ""}{contextName(c)}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkContext}
              disabled={busy || selected.size === 0}
              className="border border-gray-300 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" aria-hidden="true" />
              {t.history.apply}
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
            {t.common.delete}
          </button>

          <button
            onClick={exitSelectMode}
            disabled={busy}
            className="text-xs text-gray-500 hover:text-gray-700 ms-auto disabled:opacity-50"
          >
            {t.history.leave}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder={t.history.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px] sm:min-w-[200px] w-full sm:w-auto"
        />
        {/* La même fenêtre que Nouvelle lecture, Recherche biblique et l'ajout
            à un plan — deux testaments, filtre par nom. Ici c'est un filtre,
            d'où le « tous les livres » que le formulaire de saisie n'a pas. */}
        <div className="min-w-[12rem]">
          <BookPicker
            value={bookFilter}
            onSelect={setBookFilter}
            emptyLabel={t.history.allBooks}
            ariaLabel={t.history.allBooks}
          />
        </div>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder={t.history.startDate}
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          placeholder={t.history.endDate}
        />
        <button
          onClick={resetFilters}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          {t.history.reset}
        </button>
        <div className="flex items-center gap-2">
          <label htmlFor="history-axe" className="text-sm text-gray-500">{t.history.groupBy}</label>
          <select id="history-axe" value={axe}
            onChange={(e) => { setAxe(e.target.value as typeof axe); setExpanded(new Set()); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]">
            <option value="date">{t.history.byDate}</option>
            <option value="book">{t.history.byBook}</option>
            <option value="context">{t.history.byContext}</option>
          </select>
        </div>
        {arbre.length > 0 && (
          <button
            onClick={toggleAll}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1.5"
          >
            {allExpanded
              ? <><ChevronRight className="w-4 h-4" aria-hidden="true" />{t.history.collapseAll}</>
              : <><ChevronDown className="w-4 h-4" aria-hidden="true" />{t.history.expandAll}</>}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t.history.empty}</p>
          <Link
            href="/new-reading"
            className="text-[--primary] underline text-sm"
          >
            {t.nav.newReading}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {arbre.map((n) => rendreNoeud(n, 0))}
        </div>
      )}
    </div>
  );
}
