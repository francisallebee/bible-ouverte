"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Calendar, Trash2 } from "lucide-react";
import { seedIfNeeded, getAllVersions, getAllPlans, addPlan, deletePlan, generatePlanDays, addPlanDays, getCurrentUserId, getSettings } from "@/lib/storage";
import type { BibleVersion, ReadingPlan, PlanDuration } from "@/lib/storage";

const DURATIONS: { value: PlanDuration; label: string; days?: number }[] = [
  { value: "1-year", label: "1 an", days: 365 },
  { value: "6-months", label: "6 mois", days: 182 },
  { value: "3-months", label: "3 mois", days: 91 },
  { value: "1-month", label: "1 mois", days: 30 },
  { value: "custom", label: "Personnalisé" },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDuration, setFormDuration] = useState<PlanDuration>("1-year");
  const [formCustomDays, setFormCustomDays] = useState(30);
  const [formVersion, setFormVersion] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSaving, setFormSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function load() {
    await seedIfNeeded();
    const [p, v] = await Promise.all([getAllPlans(), getAllVersions()]);
    setPlans(p);
    setVersions(v);
    if (v.length > 0 && !formVersion) {
      const s = await getSettings();
      setFormVersion(s?.defaultVersionId || v[0].id);
    }
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!formName.trim() || !formVersion) return;
    setFormSaving(true);

    const userId = await getCurrentUserId();
    const duration = formDuration;
    const totalDays = duration === "custom" ? formCustomDays : (DURATIONS.find(d => d.value === duration)?.days ?? 30);

    const planId = await addPlan({
      userId,
      name: formName.trim(),
      versionId: formVersion,
      duration,
      customDays: duration === "custom" ? formCustomDays : undefined,
      startDate: formStartDate,
      totalDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const days = generatePlanDays(duration, formStartDate, duration === "custom" ? formCustomDays : undefined);
    await addPlanDays(days.map(d => ({ ...d, planId, userId, isRead: false })));

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
    return <p className="text-gray-500">Chargement...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[--primary]" />
          Plans de lecture
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Nouveau plan
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6 max-w-lg">
          <h3 className="font-medium text-sm mb-4">Créer un plan de lecture</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Mon plan 2026"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Durée</label>
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value as PlanDuration)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}{d.days ? ` (${d.days} jours)` : ""}</option>
                ))}
              </select>
              {formDuration === "custom" && (
                <input
                  type="number"
                  min={1}
                  value={formCustomDays}
                  onChange={(e) => setFormCustomDays(Math.max(1, Number(e.target.value)))}
                  placeholder="Nombre de jours"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date de début</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!formName.trim() || formSaving}
              className="bg-[--primary] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50"
            >
              {formSaving ? "Création..." : "Créer le plan"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">Aucun plan de lecture.</p>
          <p className="text-gray-400 text-sm">
            Créez un plan pour lire la Bible sur une durée définie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const durationLabel = DURATIONS.find(d => d.value === plan.duration)?.label ?? plan.duration;
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
                      {durationLabel} &middot; {plan.totalDays} jours
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
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(plan.startDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm shadow-xl mx-4">
            <h3 className="font-semibold mb-2">Supprimer ce plan ?</h3>
            <p className="text-sm text-gray-500 mb-4">Cette action est irréversible.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
