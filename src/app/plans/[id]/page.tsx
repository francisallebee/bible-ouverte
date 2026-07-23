"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Loader2, Edit3, Download, FileText, Table, Code, FileJson, File,
} from "lucide-react";
import {
  seedIfNeeded, getPlan, getPlanDays, updatePlanDay, updatePlan,
  addReading, deleteReading, getAllVersions, generatePlanDays, deletePlanDaysByPlan, addPlanDays,
  getCurrentUserId,
  exportPlanCSV, exportPlanMarkdown, exportPlanJSON, exportPlanHTML, exportPlanPDF,
} from "@/lib/storage";
import { getBookName, BOOKS } from "@/features/bible";
import type { ReadingPlan, PlanDay, BibleVersion, PlanDuration } from "@/lib/storage";

const DURATIONS: { value: PlanDuration; label: string }[] = [
  { value: "1-year", label: "1 an (365 jours)" },
  { value: "6-months", label: "6 mois (182 jours)" },
  { value: "3-months", label: "3 mois (91 jours)" },
  { value: "1-month", label: "1 mois (30 jours)" },
  { value: "custom", label: "Personnalisé" },
];

export default function PlanDetailPage() {
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

  const DAYS_PER_PAGE = 14;

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

  const readDays = days.filter((d) => d.isRead).length;
  const progress = days.length > 0 ? Math.round((readDays / days.length) * 100) : 0;
  const pageCount = Math.ceil(days.length / DAYS_PER_PAGE);
  const pageDays = days.slice(currentPage * DAYS_PER_PAGE, (currentPage + 1) * DAYS_PER_PAGE);

  async function handleToggleDay(day: PlanDay) {
    setTogglingDay(day.day);
    try {
      const updatedDay = { ...day };
      if (!day.isRead) {
        const readingId = await addReading({
          date: day.date,
          book: day.book,
          chapterStart: day.chapterStart,
          chapterEnd: day.chapterEnd,
          verseStart: 1,
          verseEnd: 1,
          passageText: "",
          translationId: plan!.versionId,
          tags: ["general"],
          notes: `Plan : ${plan!.name} (jour ${day.day})`,
        });
        updatedDay.isRead = true;
        updatedDay.readingId = readingId as number;
      } else {
        if (day.readingId) await deleteReading(day.readingId);
        updatedDay.isRead = false;
        delete updatedDay.readingId;
      }
      await updatePlanDay(updatedDay);
      setDays((prev) => prev.map((d) => (d.day === day.day ? updatedDay : d)));
    } catch (e) {
      console.error(e);
    }
    setTogglingDay(null);
  }

  const handleSaveEdit = useCallback(async () => {
    if (!plan || !formName.trim() || !formVersion) return;
    setSaving(true);
    try {
      const totalDays = formDuration === "custom" ? formCustomDays
        : ({ "1-year": 365, "6-months": 182, "3-months": 91, "1-month": 30 } as Record<string, number>)[formDuration];

      const updated: ReadingPlan = {
        ...plan,
        name: formName.trim(),
        duration: formDuration,
        customDays: formDuration === "custom" ? formCustomDays : undefined,
        books: formBooks.length > 0 ? formBooks : undefined,
        versionId: formVersion,
        startDate: formStartDate,
        totalDays,
        updatedAt: new Date().toISOString(),
      };

      await updatePlan(updated);
      await deletePlanDaysByPlan(planId);

      const rawDays = generatePlanDays(formDuration, formStartDate, formCustomDays, formBooks.length > 0 ? formBooks : undefined);
      const userId = await getCurrentUserId();
      await addPlanDays(rawDays.map((d) => ({ ...d, planId, userId, isRead: false })));

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

  if (!loaded) return <p className="text-gray-500">Chargement...</p>;
  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Plan introuvable.</p>
        <Link href="/plans" className="text-[#1e3a5f] underline text-sm">Retour aux plans</Link>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push("/plans")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux plans
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-[#1e3a5f]" />
          <div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <p className="text-sm text-gray-500">
              {readDays}/{days.length} jours lus ({progress}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Exporter
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg p-1 min-w-[180px] hidden group-hover:block z-10">
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
            <Edit3 className="w-4 h-4" /> Modifier
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-semibold mb-4">Modifier le plan</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Durée</label>
                <select value={formDuration} onChange={(e) => setFormDuration(e.target.value as PlanDuration)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              {formDuration === "custom" && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de jours</label>
                  <input type="number" min={1} value={formCustomDays} onChange={(e) => setFormCustomDays(Math.max(1, Number(e.target.value)))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
                <select value={formVersion} onChange={(e) => setFormVersion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date de début</label>
                <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Livres (laisser vide pour toute la Bible)</label>
              <details className="text-sm">
                <summary className="cursor-pointer text-[#1e3a5f] hover:underline">
                  {formBooks.length === 0 ? "Tous les livres" : `${formBooks.length} livre(s) sélectionné(s)`}
                </summary>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 mt-2 max-h-60 overflow-y-auto">
                  {BOOKS.map((b) => (
                    <label key={b.abbreviation} className="flex items-center gap-1.5 text-sm cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5">
                      <input type="checkbox" checked={formBooks.includes(b.abbreviation)} onChange={() => toggleBook(b.abbreviation)} className="accent-[#1e3a5f]" />
                      {b.name}
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveEdit} disabled={!formName.trim() || saving} className="bg-[#1e3a5f] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200">Annuler</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1e3a5f] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{days.length - readDays} jours restants sur {days.length}</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <span className="text-sm text-gray-500">{currentPage + 1} / {pageCount}</span>
        <button onClick={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))} disabled={currentPage >= pageCount - 1}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {pageDays.map((day) => (
          <div key={day.day} onClick={() => handleToggleDay(day)}
            className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-all cursor-pointer select-none ${
              day.isRead ? "border-green-200 bg-green-50/30" : "border-gray-200 hover:border-gray-300"
            } ${togglingDay === day.day ? "opacity-60" : ""}`}>
            <button disabled={togglingDay === day.day} className="shrink-0" onClick={(e) => { e.stopPropagation(); handleToggleDay(day); }}>
              {togglingDay === day.day ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                : day.isRead ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono shrink-0">Jour {day.day}</span>
                <span className="text-xs text-gray-400">{new Date(day.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {getBookName(day.book)} {day.chapterStart}{day.chapterEnd !== day.chapterStart ? `-${day.chapterEnd}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
