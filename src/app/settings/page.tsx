"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Download, Upload, Sun, Palette, Info, Smartphone, Tablet, Monitor, BookOpen, Target, Users, ImageIcon } from "lucide-react";
import { seedIfNeeded, getSettings, updateSettings, countPassages } from "@/lib/storage";
import { exportData, importData } from "@/lib/storage/export-import";
import type { AppSettings } from "@/lib/storage";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [verseCount, setVerseCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [s, vc] = await Promise.all([
        getSettings(),
        countPassages("ls1910"),
      ]);
      setSettings(s ?? null);
      setVerseCount(vc);
      setLoaded(true);
    })();
  }, []);

  async function handleExport() {
    setExportStatus("");
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bible-ouverte-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Export réussi.");
    } catch {
      setExportStatus("Erreur lors de l'export.");
    }
  }

  async function handleImport(file: File) {
    if (!confirm("Cette action remplacera vos données existantes. Continuer ?")) return;
    setImportStatus("Import en cours...");
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.ok) {
        setImportStatus(`${result.count} élément(s) importé(s) avec succès.`);
      } else {
        setImportStatus(`Erreur : ${result.errors.join(", ")}`);
      }
    } catch {
      setImportStatus("Erreur lors de la lecture du fichier.");
    }
  }

  async function handleThemeChange(theme: string) {
    await updateSettings({ theme });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  if (!loaded) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-[#1e3a5f]" />
        Réglages
      </h1>

      <div className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-[#1e3a5f]" />
            Thème
          </h2>
          <select
            value={settings?.theme ?? "light"}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre (bientôt disponible)</option>
          </select>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#1e3a5f]" />
            Affichage
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Ajuste l&apos;interface selon votre appareil.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["smartphone", "tablet", "desktop"] as const).map((preset) => (
              <button
                key={preset}
                onClick={async () => {
                  await updateSettings({ displayPreset: preset });
                  const s = await getSettings();
                  setSettings(s ?? null);
                }}
                className={`p-3 rounded-lg border text-sm text-center transition-all ${
                  (settings?.displayPreset ?? "desktop") === preset
                    ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="mb-1 flex justify-center">
                  {preset === "smartphone" ? (
                    <Smartphone className="w-6 h-6" />
                  ) : preset === "tablet" ? (
                    <Tablet className="w-6 h-6" />
                  ) : (
                    <Monitor className="w-6 h-6" />
                  )}
                </div>
                <div className="font-medium">
                  {preset === "smartphone"
                    ? "Smartphone"
                    : preset === "tablet"
                      ? "Tablette"
                      : "Desktop"}
                </div>
                <div className="text-xs opacity-70 mt-0.5">
                  {preset === "smartphone"
                    ? "< 768px"
                    : preset === "tablet"
                      ? "768-1024px"
                      : "> 1024px"}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#1e3a5f]" />
            Utilisateurs
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Gérez les profils pour que chaque personne ait son espace personnel.
          </p>
          <a href="/profiles" className="inline-flex items-center gap-1.5 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] no-underline">
            <Users className="w-4 h-4" />
            Gérer les utilisateurs
          </a>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Objectif de lecture
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Fixez un objectif quotidien pour suivre votre progression.
          </p>
          <div className="flex items-center gap-3">
            <select
              value={settings?.readingGoal?.type ?? "chapters-per-day"}
              onChange={async (e) => {
                const type = e.target.value as "chapters-per-day" | "verses-per-day";
                const target = settings?.readingGoal?.target ?? 1;
                await updateSettings({ readingGoal: { type, target } });
                const s = await getSettings();
                setSettings(s ?? null);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="chapters-per-day">Chapitres / jour</option>
              <option value="verses-per-day">Versets / jour</option>
            </select>
            <input
              type="number"
              min={1}
              value={settings?.readingGoal?.target ?? 1}
              onChange={async (e) => {
                const target = Math.max(1, Number(e.target.value));
                const type = settings?.readingGoal?.type ?? "chapters-per-day";
                await updateSettings({ readingGoal: { type, target } });
                const s = await getSettings();
                setSettings(s ?? null);
              }}
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">par jour</span>
          </div>
          {settings?.readingGoal && (
            <p className="text-xs text-gray-400 mt-2">
              Objectif actuel : {settings.readingGoal.target} {settings.readingGoal.type === "chapters-per-day" ? "chapitres" : "versets"} par jour
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-green-600" />
            Unsplash (photos libres)
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Clé d&apos;API Unsplash pour rechercher des photos depuis la page de lecture. 
            Obtenez-la gratuitement sur{" "}
            <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer"
              className="text-[#1e3a5f] underline">unsplash.com/developers</a>.
          </p>
          <input
            type="text"
            placeholder="Votre clé d'accès Unsplash"
            value={settings?.unsplashAccessKey ?? ""}
            onChange={async (e) => {
              await updateSettings({ unsplashAccessKey: e.target.value });
              const s = await getSettings();
              setSettings(s ?? null);
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {settings?.unsplashAccessKey && (
            <p className="text-xs text-green-600 mt-1">✓ Clé configurée</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1e3a5f]" />
            Version par défaut
          </h2>
          <p className="text-sm text-gray-600">{settings?.defaultVersionId ?? "ls1910"}</p>
          <a href="/versions" className="text-sm text-[#1e3a5f] underline mt-1 inline-block">
            Modifier dans Versions
          </a>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-[#1e3a5f]" />
            Export des données
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Téléchargez toutes vos données au format JSON.
          </p>
          <button
            onClick={handleExport}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Exporter en JSON
          </button>
          {exportStatus && (
            <p className="text-sm text-green-600 mt-2">{exportStatus}</p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#1e3a5f]" />
            Import des données
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Importez un fichier JSON précédemment exporté.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Importer un fichier JSON
          </button>
          {importStatus && (
            <p className={`text-sm mt-2 ${importStatus.includes("Erreur") ? "text-red-600" : "text-green-600"}`}>
              {importStatus}
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-[#1e3a5f]" />
            Informations
          </h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Application</dt>
              <dd>Bible Ouverte</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Version</dt>
              <dd>0.1.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Mode hors ligne</dt>
              <dd className="text-green-600">Activé</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Stockage</dt>
              <dd>IndexedDB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Versets disponibles</dt>
              <dd>{verseCount.toLocaleString("fr-FR")}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
