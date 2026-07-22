"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Check, Trash2, User as UserIcon, ArrowLeft } from "lucide-react";
import {
  seedIfNeeded, getAllUsers, addUser, deleteUser, switchUser, getCurrentUserId, getAllReadings, getAllPlans,
} from "@/lib/storage";
import type { UserProfile } from "@/lib/storage";

const COLORS = ["#4a90d9", "#7b68ee", "#2ecc71", "#e74c3c", "#f39c12", "#1e3a5f", "#e91e63", "#00bcd4"];

export default function ProfilesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#4a90d9");
  const [dataCounts, setDataCounts] = useState<Record<string, { readings: number; plans: number }>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    await seedIfNeeded();
    const [u, c] = await Promise.all([getAllUsers(), getCurrentUserId()]);
    setUsers(u);
    setCurrentUserId(c);

    const counts: Record<string, { readings: number; plans: number }> = {};
    for (const user of u) {
      const readings = (await getAllReadings()).filter((r) => r.userId === user.id).length;
      const plans = (await getAllPlans()).filter((p) => p.userId === user.id).length;
      counts[user.id] = { readings, plans };
    }
    setDataCounts(counts);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!formName.trim()) return;
    const id = formName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    await addUser({
      id,
      name: formName.trim(),
      color: formColor,
      createdAt: new Date().toISOString(),
    });
    setShowForm(false);
    setFormName("");
    await load();
  }

  async function handleSwitch(userId: string) {
    await switchUser(userId);
    setCurrentUserId(userId);
  }

  async function handleDelete(id: string) {
    const readings = (await getAllReadings()).filter((r) => r.userId === id).length;
    const plans = (await getAllPlans()).filter((p) => p.userId === id).length;
    if (readings > 0 || plans > 0) {
      if (!confirm(`Cet utilisateur a ${readings} lecture(s) et ${plans} plan(s). Supprimer quand même ?`)) {
        setDeleteConfirm(null);
        return;
      }
    }
    await deleteUser(id);
    setDeleteConfirm(null);
    if (currentUserId === id) {
      const remaining = users.filter((u) => u.id !== id);
      if (remaining.length > 0) {
        await switchUser(remaining[0].id);
      }
    }
    await load();
  }

  if (!loaded) return <p className="text-gray-500">Chargement...</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => router.push("/settings")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux réglages
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-[#1e3a5f]" />
          Utilisateurs
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-medium text-sm mb-3">Nouvel utilisateur</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: formColor }}>
              {formName ? formName[0].toUpperCase() : "?"}
            </div>
            <input
              type="text"
              placeholder="Prénom ou pseudo"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500 mr-1">Couleur :</span>
            {COLORS.map((c) => (
              <button key={c} onClick={() => setFormColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${formColor === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!formName.trim()}
              className="bg-[#1e3a5f] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50">
              Ajouter
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => {
          const isActive = user.id === currentUserId;
          const counts = dataCounts[user.id] ?? { readings: 0, plans: 0 };
          return (
            <div key={user.id}
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                isActive ? "border-[#1e3a5f] ring-1 ring-[#1e3a5f]" : "border-gray-200"
              }`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ backgroundColor: user.color }}>
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  {isActive && (
                    <span className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Actif
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {counts.readings} lecture(s) · {counts.plans} plan(s)
                </p>
              </div>
              {!isActive && (
                <button onClick={() => handleSwitch(user.id)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Utiliser
                </button>
              )}
              <button onClick={() => setDeleteConfirm(user.id)}
                disabled={users.length <= 1}
                className={`text-sm ${users.length <= 1 ? "text-gray-300 cursor-not-allowed" : "text-red-500 hover:text-red-700"}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm shadow-xl mx-4">
            <h3 className="font-semibold mb-2">Supprimer cet utilisateur ?</h3>
            <p className="text-sm text-gray-500 mb-4">Les lectures et plans seront conservés.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
