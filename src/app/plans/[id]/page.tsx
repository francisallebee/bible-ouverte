"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Loader2, Edit3, Download, FileText, Table, Code, FileJson, File, Trash2, ListChecks, X,
} from "lucide-react";
import {
  seedIfNeeded, getPlan, getPlanDays, updatePlanDay, updatePlan,
  addReading, deleteReading, getAllVersions, generatePlanDays, deletePlanDaysByPlan, addPlanDays,
  addPlanEntry, deletePlanDay,
  getCurrentUserId, PLAN_CONTEXT_ID,
  exportPlanCSV, exportPlanMarkdown, exportPlanJSON, exportPlanHTML, exportPlanPDF,
} from "@/lib/storage";
import { useI18n, useBookName, useBooks } from "@/contexts/I18nContext";
import { formatDate } from "@/lib/i18n/format";
import PlanEntryAdder from "@/components/PlanEntryAdder";
import type { PlanEntryDraft } from "@/components/PlanEntryAdder";
import { describeRange } from "@/components/PassagePicker";
import { dayPassages, readingIdsOf } from "@/lib/storage/plan-passages";
import type { ReadingPlan, PlanDay, BibleVersion, PlanDuration } from "@/lib/storage";

/** Les durées proposées. Leurs libellés vivent dans les dictionnaires. */
const DURATIONS: { value: PlanDuration }[] = [
  { value: "1-year" },
  { value: "6-months" },
  { value: "3-months" },
  { value: "1-month" },
  { value: "custom" },
];

export default function PlanDetailPage() {
  const { t, locale } = useI18n();
  const getBookName = useBookName();
  const books = useBooks();
  const params = useParams();
  const router = useRouter();
  const planId = Number(params.id);

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [togglingDay, setTogglingDay] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Entrée d'un plan libre en attente de sa date de lecture. */
  const [dating, setDating] = useState<{ day: number; date: string } | null>(null);

  const DAYS_PER_PAGE = 14;
  const isFree = plan?.kind === "free";

  // edit form state
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState<PlanDuration>("1-year");
  const [formCustomDays, setFormCustomDays] = useState(30);
  const [formVersion, setFormVersion] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formBooks, setFormBooks] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [p, d, v] = await Promise.all([
        getPlan(planId),
        getPlanDays(planId),
        getAllVersions(),
      ]);
      setPlan(p ?? null);
      setDays(d ?? []);
      setVersions(v);
      if (p) {
        setFormName(p.name);
        setFormDuration(p.duration);
        setFormCustomDays(p.customDays ?? 30);
        setFormVersion(p.versionId);
        setFormStartDate(p.startDate);
        setFormBooks(p.books ?? []);
      }
      setLoaded(true);
    })();
  }, [planId]);

  /**
   * Versions proposées à l'édition : les versions actives, plus celle du plan
   * si elle a été désactivée depuis. Sans quoi le menu s'ouvrirait sur un
   * choix vide et changerait la version du plan sans qu'on l'ait demandé.
   */
  const selectableVersions = useMemo(() => {
    const enabled = versions.filter((v) => v.isEnabled);
    if (!formVersion || enabled.some((v) => v.id === formVersion)) return enabled;
    const current = versions.find((v) => v.id === formVersion);
    return current ? [current, ...enabled] : enabled;
  }, [versions, formVersion]);

  const readDays = days.filter((d) => d.isRead).length;
  const progress = days.length > 0 ? Math.round((readDays / days.length) * 100) : 0;
  const pageCount = Math.ceil(days.length / DAYS_PER_PAGE);
  const pageDays = days.slice(currentPage * DAYS_PER_PAGE, (currentPage + 1) * DAYS_PER_PAGE);

  /**
   * Coche une entrée : enregistre **une lecture par passage** à la date donnée.
   *
   * Une par passage, et non une par jour : c'est la règle du reste du produit,
   * les statistiques, la progression et les plans raisonnant tous par lecture.
   * Chaque passage retient son identifiant, sans quoi décocher un jour à
   * plusieurs passages en laisserait derrière lui dans l'historique.
   */
  async function markRead(day: PlanDay, date: string) {
    setTogglingDay(day.day);
    try {
      const passages = dayPassages(day);
      const ecrits = [];
      for (const passage of passages) {
        const readingId = await addReading({
          date,
          book: passage.book,
          chapterStart: passage.chapterStart,
          chapterEnd: passage.chapterEnd,
          // Les plans datés raisonnent au chapitre et posent 1:1 ; les plans
          // libres portent le passage exact qu'on a choisi.
          verseStart: passage.verseStart ?? 1,
          verseEnd: passage.verseEnd ?? 1,
          passageText: "",
          translationId: plan!.versionId,
          tags: ["general"],
          // Rattachée au contexte « Plan de lecture » : sans lui, ces lectures
          // s'accumulaient sous « Sans contexte » et y représentaient
          // l'essentiel du total, ce qui rendait la répartition illisible.
          contextId: PLAN_CONTEXT_ID,
          // Cocher un jour de plan n'est pas une séance de saisie. Le nom du
          // plan ferait un titre tentant, mais ce serait décider à la place
          // de l'utilisateur : laissé vide, comme toute lecture non nommée.
          sessionTitle: "",
          notes: plan!.kind === "free"
            ? `Plan : ${plan!.name}`
            : `Plan : ${plan!.name} (jour ${day.day})`,
        });
        ecrits.push({ ...passage, readingId: readingId as number });
      }
      const updatedDay: PlanDay = {
        ...day,
        date,
        isRead: true,
        // La colonne garde la première : c'est ce que lit un appareil resté
        // sur l'ancienne version.
        readingId: ecrits[0].readingId,
        ...(ecrits.length > 1 ? { passages: ecrits } : {}),
      };
      await updatePlanDay(updatedDay);
      setDays((prev) => prev.map((d) => (d.day === day.day ? updatedDay : d)));
    } catch (e) {
      console.error(e);
    }
    setTogglingDay(null);
  }

  async function unmarkRead(day: PlanDay) {
    setTogglingDay(day.day);
    try {
      // Toutes les lectures du jour, et pas seulement celle de la colonne.
      for (const id of readingIdsOf(day)) await deleteReading(id);
      const updatedDay: PlanDay = { ...day, isRead: false };
      delete updatedDay.readingId;
      if (updatedDay.passages) {
        updatedDay.passages = updatedDay.passages.map(({ readingId, ...reste }) => {
          void readingId;
          return reste;
        });
      }
      // Un plan libre n'a pas de date prévue : la décocher doit la reprendre,
      // sinon la ligne continuerait d'annoncer un jour de lecture démenti.
      if (plan?.kind === "free") updatedDay.date = "";
      await updatePlanDay(updatedDay);
      setDays((prev) => prev.map((d) => (d.day === day.day ? updatedDay : d)));
    } catch (e) {
      console.error(e);
    }
    setTogglingDay(null);
  }

  function handleToggleDay(day: PlanDay) {
    if (day.isRead) return unmarkRead(day);
    // Un plan daté a déjà sa date ; un plan libre la demande.
    if (plan?.kind !== "free") return markRead(day, day.date);
    setDating({ day: day.day, date: new Date().toISOString().slice(0, 10) });
  }

  async function handleAddEntry(entry: PlanEntryDraft) {
    const userId = await getCurrentUserId();
    await addPlanEntry({ ...entry, planId, userId, date: "", isRead: false });
    setDays(await getPlanDays(planId));
  }

  async function handleRemoveEntry(day: PlanDay) {
    // La lecture déjà enregistrée part avec l'entrée : la laisser derrière
    // gonflerait l'historique d'une ligne que plus rien ne rattache au plan.
    if (day.isRead && day.readingId) await deleteReading(day.readingId);
    if (day.id !== undefined) await deletePlanDay(day.id);
    setDays((prev) => prev.filter((d) => d.day !== day.day));
  }

  const handleSaveEdit = useCallback(async () => {
    if (!plan || !formName.trim() || !formVersion) return;
    setSaving(true);
    try {
      // Un plan libre n'a ni durée ni date de début : seuls son nom et sa
      // version se modifient. Passer par le générateur effacerait sa liste.
      if (plan.kind === "free") {
        const renamed: ReadingPlan = {
          ...plan,
          name: formName.trim(),
          versionId: formVersion,
          updatedAt: new Date().toISOString(),
        };
        await updatePlan(renamed);
        setPlan(renamed);
        setEditing(false);
        setSaving(false);
        return;
      }

      // Généré avant l'enregistrement : totalDays doit refléter les jours
      // réellement produits et non la durée demandée (voir plan-generator.ts).
      const rawDays = generatePlanDays(formDuration, formStartDate, formCustomDays, formBooks.length > 0 ? formBooks : undefined);

      const updated: ReadingPlan = {
        ...plan,
        name: formName.trim(),
        duration: formDuration,
        customDays: formDuration === "custom" ? formCustomDays : undefined,
        books: formBooks.length > 0 ? formBooks : undefined,
        versionId: formVersion,
        startDate: formStartDate,
        totalDays: rawDays.length,
        updatedAt: new Date().toISOString(),
      };

      await updatePlan(updated);
      await deletePlanDaysByPlan(planId);

      const userId = await getCurrentUserId();
      await addPlanDays(rawDays.map((d) => ({ ...d, planId, userId, verseStart: 1, verseEnd: 1, isRead: false })));

      const newDays = await getPlanDays(planId);
      setPlan(updated);
      setDays(newDays);
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }, [plan, formName, formDuration, formCustomDays, formVersion, formStartDate, formBooks, planId]);

  function toggleBook(abbrev: string) {
    setFormBooks((prev) =>
      prev.includes(abbrev) ? prev.filter((b) => b !== abbrev) : [...prev, abbrev],
    );
  }

  if (!loaded) return <p className="text-gray-500">{t.common.loading}</p>;
  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">{t.planDetail.notFound}</p>
        <Link href="/plans" className="text-[--primary] underline text-sm">{t.planDetail.backToPlans}</Link>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push("/plans")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> {t.planDetail.backToPlans}
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[--primary]" />
          <div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <p className="text-sm text-gray-500">
              {isFree
                ? t.planDetail.passagesRead(readDays, days.length, progress)
                : t.planDetail.daysRead(readDays, days.length, progress)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> {t.planDetail.export}
            </button>
            <div className="absolute end-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-1 min-w-[180px] hidden group-hover:block z-10">
              <button onClick={() => exportPlanPDF(plan, days)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <File className="w-4 h-4 text-red-600" /> PDF
              </button>
              <button onClick={() => exportPlanHTML(plan, days)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> HTML
              </button>
              <button onClick={() => exportPlanCSV(plan, days)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <Table className="w-4 h-4 text-green-600" /> CSV
              </button>
              <button onClick={() => exportPlanMarkdown(plan, days)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <Code className="w-4 h-4 text-gray-600" /> Markdown
              </button>
              <button onClick={() => exportPlanJSON(plan, days)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-600" /> JSON
              </button>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" /> {t.common.edit}
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-semibold mb-4">{t.planDetail.editPlan}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.planDetail.name}</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!isFree && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.planDetail.duration}</label>
                  <select value={formDuration} onChange={(e) => setFormDuration(e.target.value as PlanDuration)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {DURATIONS.map((d) => <option key={d.value} value={d.value}>{t.planDetail.durations[d.value]}</option>)}
                  </select>
                </div>
              )}
              {!isFree && formDuration === "custom" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.planDetail.customDays}</label>
                  <input type="number" min={1} value={formCustomDays} onChange={(e) => setFormCustomDays(Math.max(1, Number(e.target.value)))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.planDetail.version}</label>
                <select value={formVersion} onChange={(e) => setFormVersion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {selectableVersions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              {!isFree && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{t.planDetail.startDate}</label>
                  <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
            {/* Un plan libre n'a pas de jours à régénérer : sa liste se construit
                passage par passage, et rejouer le générateur l'effacerait. */}
            <div className={isFree ? "hidden" : undefined}>
              <label className="block text-xs font-medium text-gray-500 mb-2">{t.planDetail.booksLabel}</label>
              <details className="text-sm">
                <summary className="cursor-pointer text-[--primary] hover:underline">
                  {formBooks.length === 0 ? t.planDetail.allBooks : t.planDetail.booksSelected(formBooks.length)}
                </summary>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 mt-2 max-h-60 overflow-y-auto">
                  {books.map((b) => (
                    <label key={b.abbreviation} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5">
                      <input type="checkbox" checked={formBooks.includes(b.abbreviation)} onChange={() => toggleBook(b.abbreviation)} className="accent-[--primary]" />
                      {b.name}
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveEdit} disabled={!formName.trim() || saving} className="bg-[--primary] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? t.planDetail.saving : t.common.save}
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200">{t.common.cancel}</button>
          </div>
        </div>
      )}

      {isFree && (
        <div className="mb-6">
          <PlanEntryAdder versionId={plan.versionId} onAdd={handleAddEntry} />
        </div>
      )}

      {days.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[--primary] rounded-full transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t.planDetail.remaining(days.length - readDays, days.length, isFree)}
          </p>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> {t.planDetail.previous}
          </button>
          <span className="text-sm text-gray-500">{currentPage + 1} / {pageCount}</span>
          <button onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
            {t.planDetail.next} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {isFree && days.length === 0 && (
        <div className="text-center py-12">
          <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">{t.planDetail.emptyList}</p>
          <p className="text-gray-400 text-sm">
            {t.planDetail.emptyListHint}
          </p>
        </div>
      )}

      <div className="space-y-1">
        {pageDays.map((day) => (
          <div key={day.day}
            className={`bg-white rounded-xl border transition-colors ${
              day.isRead ? "border-green-200 bg-green-50/30" : "border-gray-200"
            } ${togglingDay === day.day ? "opacity-60" : ""}`}>
            <div className="flex items-center">
              <button onClick={() => handleToggleDay(day)} disabled={togglingDay === day.day}
                aria-pressed={day.isRead}
                className="flex-1 min-w-0 text-left px-4 py-3 flex items-center gap-3 select-none">
                {togglingDay === day.day ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin shrink-0" />
                  : day.isRead ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!isFree && <span className="text-xs text-gray-400 font-mono shrink-0">{t.planDetail.day(day.day)}</span>}
                    {/* Un plan libre n'annonce une date que lorsqu'elle existe :
                        `new Date("")` produirait « Invalid Date » à l'écran. */}
                    {day.date ? (
                      <span className="text-xs text-gray-400">
                        {isFree ? t.planDetail.readOn : ""}
                        {formatDate(locale, day.date, { day: "numeric", month: "short" })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{t.planDetail.notReadYet}</span>
                    )}
                  </div>
                  {/* Tous les passages du jour : un plan classique en fait lire
                      plusieurs, d'un livre différent chacun. Un jour à passage
                      unique rend exactement la même ligne qu'avant. */}
                  <div className="text-sm font-medium text-gray-900 space-y-0.5">
                    {dayPassages(day).map((passage, i) => (
                      <p key={`${passage.book}-${passage.chapterStart}-${i}`}>
                        {isFree
                          ? describeRange(getBookName(passage.book), {
                              chapterStart: passage.chapterStart,
                              chapterEnd: passage.chapterEnd,
                              verseStart: passage.verseStart ?? 1,
                              verseEnd: passage.verseEnd ?? 1,
                            })
                          : `${getBookName(passage.book)} ${passage.chapterStart}${passage.chapterEnd !== passage.chapterStart ? `-${passage.chapterEnd}` : ""}`}
                      </p>
                    ))}
                  </div>
                </div>
              </button>
              {isFree && (
                <button onClick={() => handleRemoveEntry(day)}
                  aria-label={t.planDetail.remove(`${getBookName(day.book)} ${day.chapterStart}`)}
                  className="px-4 py-3 text-gray-400 hover:text-red-600 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {dating?.day === day.day && (
              <div className="border-t border-gray-200 px-4 py-3 flex flex-wrap items-center gap-2">
                <label htmlFor={`date-${day.day}`} className="text-xs text-gray-500">
                  {t.planDetail.readOnLabel}
                </label>
                <input id={`date-${day.day}`} type="date" value={dating.date}
                  onChange={(e) => setDating({ day: day.day, date: e.target.value })}
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm" />
                <button
                  onClick={() => { const d = dating.date; setDating(null); markRead(day, d); }}
                  disabled={!dating.date}
                  className="bg-[--primary] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50">
                  {t.planDetail.validate}
                </button>
                <button onClick={() => setDating(null)} aria-label={t.common.cancel}
                  className="text-gray-400 hover:text-gray-600 p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
