"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { addContext } from "@/lib/storage";
import type { ReadingContext } from "@/lib/storage";
import { useI18n, useContextName } from "@/contexts/I18nContext";
import { localeInfo } from "@/lib/i18n/locales";

/**
 * Emojis proposés à la création d'un contexte. Une grille courte couvrant les
 * usages courants évite d'embarquer un sélecteur complet — quelques dizaines de
 * kilo-octets pour un champ utilisé une fois de temps en temps — et le champ de
 * saisie libre à côté laisse coller n'importe quel autre caractère.
 */
const EMOJI_CHOICES = [
  "📖", "📕", "📘", "📙", "📚", "🧘", "⛪", "🎤", "🙏", "✝️",
  "🎧", "🎙️", "📻", "📺", "💻", "📱", "🎬", "🎵", "📰", "✍️",
  "☕", "🌅", "🌙", "🚗", "✈️", "🚆", "🚶", "🏠", "👨‍👩‍👧", "👥",
  "💡", "❤️", "⭐", "🔥", "🌱", "🕊️", "📌", "🗓️", "⏰", "🎯",
];

/**
 * Tri par nom affiché, dans l'ordre alphabétique de la langue.
 *
 * Sur le nom **affiché** et non sur celui de la base : « Église » se traduit en
 * « Church », et une liste triée sur le nom stocké paraîtrait en désordre à un
 * lecteur anglophone. La langue est passée à `localeCompare`, car l'ordre des
 * lettres accentuées n'est pas le même partout.
 */
export function sortContexts(
  contexts: ReadingContext[],
  displayName: (c: ReadingContext) => string = (c) => c.name,
  localeTag = "fr",
): ReadingContext[] {
  return [...contexts].sort(
    (a, b) => displayName(a).localeCompare(displayName(b), localeTag),
  );
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques décomposés
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Props {
  contexts: ReadingContext[];
  value: string;
  onChange: (contextId: string) => void;
  /** Appelé après création pour que le parent recharge la liste. */
  onContextAdded: (created: ReadingContext) => void;
  id?: string;
}

export default function ContextPicker({ contexts, value, onChange, onContextAdded, id = "context" }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📖");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { t, locale } = useI18n();
  const contextName = useContextName();
  const sorted = sortContexts(contexts, contextName, localeInfo(locale).tag);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.contextPicker.errorNoName);
      return;
    }

    const slug = slugify(trimmed);
    if (!slug) {
      setError(t.contextPicker.errorUnusable);
      return;
    }
    if (contexts.some((c) => c.id === slug || c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(t.contextPicker.errorExists);
      return;
    }

    setSaving(true);
    const created: ReadingContext = {
      id: slug,
      name: trimmed,
      slug,
      color: "#6366f1",
      icon: "tag",
      emoji: emoji || "📌",
      isSystemDefault: false,
    };
    await addContext(created);
    setSaving(false);

    onContextAdded(created);
    onChange(created.id);
    setAdding(false);
    setName("");
    setEmoji("📖");
    setError("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[--primary]"
        >
          <option value="">{t.contextPicker.none}</option>
          {sorted.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji ? `${c.emoji} ` : ""}{contextName(c)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setAdding(!adding); setError(""); }}
          aria-expanded={adding}
          aria-label={adding ? t.contextPicker.cancelAdd : t.contextPicker.add}
          title={adding ? t.contextPicker.cancel : t.contextPicker.add}
          className="px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
        >
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {adding && (
        <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50/60">
          <label htmlFor="new-context-name" className="block text-xs font-medium text-gray-600 mb-1">
            {t.contextPicker.newName}
          </label>
          <div className="flex gap-2">
            <span
              aria-hidden="true"
              className="w-10 h-10 flex items-center justify-center text-xl border border-gray-300 rounded-lg bg-white shrink-0"
            >
              {emoji}
            </span>
            <input
              id="new-context-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
              placeholder={t.contextPicker.namePlaceholder}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[--primary]"
            />
          </div>

          <p className="text-xs font-medium text-gray-600 mt-3 mb-1">{t.contextPicker.emoji}</p>
          <div className="flex flex-wrap gap-1">
            {EMOJI_CHOICES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={t.contextPicker.chooseEmoji(e)}
                aria-pressed={emoji === e}
                className={`w-8 h-8 rounded text-lg leading-none transition-colors ${
                  emoji === e ? "bg-[--primary-light] ring-2 ring-[--primary]" : "hover:bg-gray-200"
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <label htmlFor="custom-emoji" className="block text-xs text-gray-500 mt-3 mb-1">
            {t.contextPicker.ownEmoji}
          </label>
          <input
            id="custom-emoji"
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(Array.from(e.target.value).slice(0, 2).join(""))}
            className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-[--primary]"
          />

          {error && <p aria-live="polite" className="text-red-600 text-xs mt-2">{error}</p>}

          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="mt-3 flex items-center gap-1.5 bg-[--primary] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving ? t.contextPicker.adding : t.contextPicker.confirmAdd}
          </button>
        </div>
      )}
    </div>
  );
}
