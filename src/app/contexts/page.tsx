"use client";

import { useEffect, useState } from "react";
import { Tags, Plus } from "lucide-react";
import {
  seedIfNeeded, getAllContexts, addContext, updateContext, deleteContext,
} from "@/lib/storage";
import type { ReadingContext } from "@/lib/storage";

const ICON_EMOJI: Record<string, string> = {
  book: "📖",
  church: "⛪",
  video: "🎥",
  monitor: "💻",
  "more-horizontal": "📌",
  user: "👤",
  heart: "❤️",
  star: "⭐",
  home: "🏠",
  study: "📚",
  prayer: "🙏",
};

function getEmoji(icon: string): string {
  return ICON_EMOJI[icon] || "📌";
}

const COLOR_PRESETS = [
  "#4a90d9", "#7b68ee", "#2ecc71", "#e74c3c", "#f39c12",
  "#95a5a6", "#1e3a5f", "#e91e63", "#00bcd4", "#ff5722",
];

export default function ContextsPage() {
  const [contexts, setContexts] = useState<ReadingContext[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#4a90d9");

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    await seedIfNeeded();
    setContexts(await getAllContexts());
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setFormName("");
    setFormColor("#4a90d9");
    setAdding(true);
    setEditingId(null);
  }

  async function saveAdd() {
    if (!formName.trim()) return;
    const id = formName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    await addContext({
      id,
      name: formName.trim(),
      slug: id,
      color: formColor,
      icon: "user",
      isSystemDefault: false,
    });
    setAdding(false);
    await load();
  }

  function startEdit(ctx: ReadingContext) {
    setEditingId(ctx.id);
    setFormName(ctx.name);
    setFormColor(ctx.color);
    setAdding(false);
  }

  async function saveEdit(id: string) {
    if (!formName.trim()) return;
    await updateContext(id, { name: formName.trim(), color: formColor });
    setEditingId(null);
    await load();
  }

  async function handleDelete(id: string) {
    try {
      await deleteContext(id);
    } catch {
      alert("Impossible de supprimer ce contexte : des lectures y sont associées.");
    }
    setDeleteConfirm(null);
    await load();
  }

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tags className="w-6 h-6 text-[#1e3a5f]" />
          Contextes
        </h1>
        <button
          onClick={startAdd}
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Ajouter un contexte
        </button>
      </div>

      {adding && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-medium text-sm mb-3">Nouveau contexte</h3>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
              style={{ backgroundColor: formColor }}
            />
            <input
              type="text"
              placeholder="Nom du contexte"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500 mr-1">Couleur :</span>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setFormColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  formColor === c ? "border-gray-800 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveAdd}
              disabled={!formName.trim()}
              className="bg-[#1e3a5f] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50"
            >
              Ajouter
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {contexts.map((ctx) => {
          const isEditing = editingId === ctx.id;
          return (
            <div
              key={ctx.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 hover:border-gray-300 transition-colors"
            >
              {isEditing ? (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: formColor }}
                    />
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setFormColor(c)}
                          className={`w-4 h-4 rounded-full ${
                            formColor === c ? "ring-2 ring-offset-1 ring-gray-800" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => saveEdit(ctx.id)}
                    className="text-sm text-green-600 font-medium hover:underline"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: ctx.color }}
                    />
                    <span className="text-base">{getEmoji(ctx.icon)}</span>
                    <span className="font-medium truncate">{ctx.name}</span>
                    {ctx.isSystemDefault && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        Système
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(ctx)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ctx.id)}
                      disabled={ctx.isSystemDefault}
                      className={`text-sm ${
                        ctx.isSystemDefault
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-red-500 hover:text-red-700"
                      }`}
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {contexts.length === 0 && (
        <p className="text-gray-400 text-center py-12">Aucun contexte.</p>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm shadow-xl mx-4">
            <h3 className="font-semibold mb-2">Supprimer ce contexte ?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Les lectures associées ne seront pas supprimées.
            </p>
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
