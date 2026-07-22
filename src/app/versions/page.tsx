"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import {
  seedIfNeeded, getAllVersions, getSettings, updateVersion, updateSettings,
} from "@/lib/storage";
import type { BibleVersion, AppSettings } from "@/lib/storage";

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-[#1e3a5f]" />
        Versions bibliques
      </h1>

      <div className="space-y-3">
        {versions.map((v) => {
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
    </div>
  );
}
