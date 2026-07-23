"use client";

import { useEffect, useState } from "react";
import { BookOpen, Headphones } from "lucide-react";
import {
  seedIfNeeded, getAllVersions, getSettings, updateVersion, updateSettings,
} from "@/lib/storage";
import type { BibleVersion, AppSettings } from "@/lib/storage";

function isAudioVersion(v: BibleVersion) { return v.id.startsWith('audio-'); }

export default function VersionsPage() {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    await seedIfNeeded();
    const [vers, s] = await Promise.all([getAllVersions(), getSettings()]);
    setVersions(vers);
    setSettings(s ?? null);
    setLoaded(true);
  }

  useEffect(() => { load(); }, []);

  async function handleSetDefault(versionId: string) {
    await updateSettings({ defaultVersionId: versionId });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  async function handleToggleEnabled(version: BibleVersion) {
    if (version.id === settings?.defaultVersionId) return;
    await updateVersion(version.id, { isEnabled: !version.isEnabled });
    setVersions((prev) =>
      prev.map((v) =>
        v.id === version.id ? { ...v, isEnabled: !v.isEnabled } : v,
      ),
    );
  }

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  const textVersions = versions.filter(v => !isAudioVersion(v));
  const audioVersions = versions.filter(v => isAudioVersion(v));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
        Versions bibliques
      </h1>

      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <BookOpen size={18} />
        Texte
      </h2>
      <div className="space-y-3 mb-8">
        {textVersions.map((v) => {
          const isDefault = v.id === settings?.defaultVersionId;
          return (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <input
                type="radio"
                name="defaultVersion"
                checked={isDefault}
                onChange={() => handleSetDefault(v.id)}
                className="accent-[#1e3a5f]"
                title="Définir par défaut"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.name}</span>
                  {isDefault && (
                    <span className="text-xs bg-[#1e3a5f] text-white px-2 py-0.5 rounded-full">
                      Par défaut
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {v.language} · {v.copyrightStatus} · {v.source}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={v.isEnabled}
                  disabled={isDefault}
                  onChange={() => handleToggleEnabled(v)}
                  className="accent-[#1e3a5f]"
                />
                Activée
              </label>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Headphones size={18} />
        Audio (synthèse vocale)
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Ces versions utilisent la synthèse vocale de votre navigateur pour lire le texte à voix haute.
      </p>
      <div className="space-y-3">
        {audioVersions.map((v) => {
          return (
            <div
              key={v.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <Headphones className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    TTS
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Synthèse vocale · {v.language}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={v.isEnabled}
                  onChange={() => handleToggleEnabled(v)}
                  className="accent-[#1e3a5f]"
                />
                Activée
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
