"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Calendar, Trash2, ListChecks } from "lucide-react";
import { seedIfNeeded, getEnabledVersions, getAllPlans, addPlan, deletePlan, generatePlanDays, addPlanDays, getCurrentUserId, getSettings } from "@/lib/storage";
import type { BibleVersion, ReadingPlan, PlanDuration, PlanKind } from "@/lib/storage";
import { useI18n } from "@/contexts/I18nContext";
import { formatDate } from "@/lib/i18n/format";

/** Les durées proposées. Leurs libellés vivent dans les dictionnaires. */
const DURATIONS: { value: PlanDuration; days?: number }[] = [
  { value: "1-year", days: 365 },
  { value: "6-months", days: 182 },
  { value: "3-months", days: 91 },
  { value: "1-month", days: 30 },
  { value: "custom" },
];

export default function PlansPage() {
  const { t, locale } = useI18n();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKind, setFormKind] = useState<PlanKind>("scheduled");
  const [formDuration, setFormDuration] = useState<PlanDuration>("1-year");
  const [formCustomDays, setFormCustomDays] = useState(30);
  const [formVersion, setFormVersion] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSaving, setFormSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function load() {
    await seedIfNeeded();
    const [p, v] = await Promise.all([getAllPlans(), getEnabledVersions()]);
    setPlans(p);
    setVersions(v);
    if (v.length > 0 && !formVersion) {
      const s = await getSettings();
      setFormVersion(s?.defaultVersionId || v[0].id);
    }
    setLoaded(true);
  }

  // Chargement au montage uniquement. `load` lit formVersion pour ne pas
  // écraser un choix déjà fait : l'ajouter aux dépendances relancerait le
  // chargement à chaque changement de version dans le formulaire.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!formName.trim() || !formVersion) return;
    setFormSaving(true);

    const userId = await getCurrentUserId();
    const now = new Date().toISOString();

    if (formKind === "free") {
      // Un plan libre naît vide : ses passages s'ajoutent un à un depuis son
      // écran. `duration` et `startDate` sont sans objet ici, mais leurs
      // colonnes sont `not null` — d'où ces valeurs de remplissage, que
      // l'écran n'affiche jamais pour ce type de plan.
      await addPlan({
        userId,
        name: formName.trim(),
        versionId: formVersion,
        kind: "free",
        duration: "custom",
        startDate: formStartDate,
        totalDays: 0,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const duration = formDuration;

      // Le plan est généré d'abord : totalDays doit refléter les jours réellement
      // produits, pas la durée demandée. Un livre ne pouvant pas être lu sur plus
      // de jours qu'il n'a de chapitres, une durée courte donne un plan plus long
      // que demandé, et l'écran doit annoncer le bon nombre.
      const days = generatePlanDays(duration, formStartDate, duration === "custom" ? formCustomDays : undefined);

      const planId = await addPlan({
        userId,
        name: formName.trim(),
        versionId: formVersion,
        kind: "scheduled",
        duration,
        customDays: duration === "custom" ? formCustomDays : undefined,
        startDate: formStartDate,
        totalDays: days.length,
        createdAt: now,
        updatedAt: now,
      });

      await addPlanDays(days.map(d => ({ ...d, planId, userId, verseStart: 1, verseEnd: 1, isRead: false })));
    }

    setFormSaving(false);
    setShowForm(false);
    setFormName("");
    await load();
  }

  async function handleDelete(id: number) {
    await deletePlan(id);
    setDeleteConfirm(null);
    await load();
  }

  if (!loaded) {
    return <p className="text-gray-500">{t.common.loading}</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[--primary]" />
          {t.plans.title}
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t.plans.newPlan}
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6 max-w-lg">
          <h3 className="font-medium text-sm mb-4">{t.plans.createTitle}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.plans.name}</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.plans.namePlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.plans.kind}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormKind("scheduled")}
                  aria-pressed={formKind === "scheduled"}
                  className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    formKind === "scheduled"
                      ? "border-[--primary] bg-white ring-1 ring-[--primary]"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4" /> {t.plans.scheduled}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {t.plans.scheduledHint}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormKind("free")}
                  aria-pressed={formKind === "free"}
                  className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    formKind === "free"
                      ? "border-[--primary] bg-white ring-1 ring-[--primary]"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <ListChecks className="w-4 h-4" /> {t.plans.free}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {t.plans.freeHint}
                  </span>
                </button>
              </div>
            </div>

            {formKind === "scheduled" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.plans.duration}</label>
                <select
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value as PlanDuration)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>{t.plans.durations[d.value]}{d.days ? t.plans.durationDays(d.days) : ""}</option>
                  ))}
                </select>
                {formDuration === "custom" && (
                  <input
                    type="number"
                    min={1}
                    value={formCustomDays}
                    onChange={(e) => setFormCustomDays(Math.max(1, Number(e.target.value)))}
                    placeholder={t.plans.customDaysPlaceholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2"
                  />
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t.plans.version}</label>
              <select
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            {formKind === "scheduled" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t.plans.startDate}</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!formName.trim() || formSaving}
              className="bg-[--primary] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50"
            >
              {formSaving ? t.plans.creating : t.plans.create}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">{t.plans.empty}</p>
          <p className="text-gray-400 text-sm">
            {t.plans.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isFree = plan.kind === "free";
            const durationLabel = t.plans.durations[plan.duration] ?? plan.duration;
            return (
              <div key={plan.id as number} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link
                      href={`/plans/${plan.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-[--primary] no-underline"
                    >
                      {plan.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isFree ? t.plans.freePlan : t.plans.scheduledSummary(durationLabel, plan.totalDays)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(plan.id as number)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {isFree ? (
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3.5 h-3.5" />
                      {t.plans.undated}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(locale, plan.startDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm shadow-xl mx-4">
            <h3 className="font-semibold mb-2">{t.plans.deleteTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">{t.plans.deleteHint}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
