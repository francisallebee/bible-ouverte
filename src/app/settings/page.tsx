"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Download, Upload, Sun, Info, BookOpen, Target, Cloud, RefreshCw, AlertTriangle, Palette, Clock, Bell } from "lucide-react";
import { seedIfNeeded, getSettings, updateSettings, countPassages, getAllVersions, updateVersion, deletePassagesForVersion } from "@/lib/storage";
import { importBibleVersion, forgetImportedVersion } from "@/features/bible";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SyncButton from "@/components/SyncButton";
import { exportData, importData } from "@/lib/storage/export-import";
import type { AppSettings, BibleVersion } from "@/lib/storage";
import { COLOR_THEMES, applyColorTheme, applyTheme } from "@/lib/themes";
import { AUTO_LOGOUT_CHOICES } from "@/lib/auto-logout";
import {
  notificationStatus, readDeviceState, requestNotificationPermission, showTestNotification,
} from "@/lib/notifications";
import type { DeviceNotificationState } from "@/lib/notifications";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [verseCount, setVerseCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'initial' | 'confirm' | 'deleting' | 'done'>('initial');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [busyVersion, setBusyVersion] = useState<string | null>(null);
  const [versionError, setVersionError] = useState("");

  // Lu au montage seulement : `Notification.permission` n'existe pas au rendu
  // serveur, et l'état de départ doit donc être neutre.
  const [deviceNotif, setDeviceNotif] = useState<DeviceNotificationState | null>(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifTest, setNotifTest] = useState("");

  async function loadVersions() {
    setVersions(await getAllVersions());
  }

  async function handleSetDefault(versionId: string) {
    await updateSettings({ defaultVersionId: versionId });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  /**
   * La case commande réellement le contenu du cache.
   *
   * Elle ne servait à rien : `isEnabled` n'était lu par personne, et les sept
   * versions restaient téléchargées et proposées quoi qu'on coche. Activer
   * importe désormais le texte — environ 6 Mo et 31 000 versets, d'où
   * l'indicateur d'attente — et désactiver l'efface pour rendre la place.
   */
  async function handleToggleEnabled(version: BibleVersion) {
    if (version.id === settings?.defaultVersionId) return;
    if (busyVersion) return;

    const enabling = !version.isEnabled;
    setBusyVersion(version.id);
    setVersionError("");
    try {
      if (enabling) {
        await updateVersion(version.id, { isEnabled: true });
        await importBibleVersion(version.id);
      } else {
        await updateVersion(version.id, { isEnabled: false });
        await deletePassagesForVersion(version.id);
        forgetImportedVersion(version.id);
      }
      setVersions((prev) =>
        prev.map((v) => v.id === version.id ? { ...v, isEnabled: enabling } : v),
      );
      setVerseCount(await countPassages(settings?.defaultVersionId || "ls1910"));
    } catch {
      // L'import a échoué : remettre la case dans son état réel plutôt que de
      // laisser croire à une version disponible hors ligne.
      await updateVersion(version.id, { isEnabled: !enabling });
      setVersionError(
        enabling
          ? `Téléchargement de « ${version.name} » impossible. Vérifie ta connexion.`
          : `Suppression de « ${version.name} » impossible.`,
      );
    }
    setBusyVersion(null);
  }

  useEffect(() => {
    (async () => {
      await seedIfNeeded();
      const [s, vc] = await Promise.all([
        getSettings(),
        countPassages("ls1910"),
      ]);
      setSettings(s ?? null);
      setVerseCount(vc);
      applyTheme(s?.theme);
      if (s?.colorTheme) applyColorTheme(s.colorTheme);
      setDeviceNotif(readDeviceState());
      setLoaded(true);
      await loadVersions();
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

  async function handleDeleteAccount() {
    setDeleteStep('deleting')
    setDeleting(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      const data = await res.json()
      if (data.error) { alert(data.error); setDeleteStep('initial'); setDeleting(false); return }
      setDeleteStep('done')
      const supabase = createClient()
      await supabase.auth.signOut()
      setTimeout(() => { router.push('/auth/login'); router.refresh() }, 2000)
    } catch {
      alert('Erreur lors de la suppression')
      setDeleteStep('initial')
      setDeleting(false)
    }
  }

  async function handleThemeChange(theme: string) {
    await updateSettings({ theme });
    const s = await getSettings();
    setSettings(s ?? null);
    applyTheme(theme);
  }

  async function refreshDeviceNotifications() {
    setDeviceNotif(readDeviceState());
  }

  async function handleAskPermission() {
    setNotifBusy(true);
    const result = await requestNotificationPermission();
    await refreshDeviceNotifications();
    // Accorder la permission vaut activation : personne ne la donne pour la
    // laisser inactive, et un second geste au même endroit serait un piège.
    if (result === "granted" && !settings?.notificationsEnabled) {
      await handleNotificationsToggle(true);
    }
    setNotifBusy(false);
  }

  async function handleNotificationsToggle(enabled: boolean) {
    await updateSettings({ notificationsEnabled: enabled });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  function handleTestNotification() {
    setNotifTest(showTestNotification()
      ? "Notification envoyée. Si tu ne la vois pas, vérifie les réglages de ton appareil."
      : "Envoi impossible : la permission n'est pas accordée sur cet appareil.");
  }

  async function handleAutoLogoutChange(minutes: number) {
    await updateSettings({ autoLogoutMinutes: minutes });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  async function handleColorThemeChange(themeId: string) {
    await updateSettings({ colorTheme: themeId });
    const s = await getSettings();
    setSettings(s ?? null);
    applyColorTheme(themeId);
  }

  function SectionCard({ icon: Icon, title, children, className = "" }: { icon: React.ComponentType<{ className?: string }>, title: string, children: React.ReactNode, className?: string }) {
    return (
      <section className={`bg-[--surface] rounded-xl border border-[--border] p-5 shadow-[--shadow] ${className}`}>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2.5 text-[--text]">
          <Icon className="w-4 h-4" />
          {title}
        </h2>
        {children}
      </section>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[--primary] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-[--primary]" />
          </span>
          Réglages
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ml-[3.25rem]">
          Personnalise ton expérience
        </p>
      </div>

      <div className="space-y-4">
        <SectionCard icon={Sun} title="Thème">
          <select
            value={settings?.theme ?? "light"}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] w-full sm:w-auto"
          >
            <option value="light">☀️ Clair</option>
            <option value="dark">🌙 Sombre</option>
            <option value="system">🖥️ Système</option>
          </select>
          {settings?.theme === 'system' && (
            <p className="text-sm text-[--text-secondary] mt-3">
              L&apos;application suit le réglage jour/nuit de ton appareil et
              bascule dès qu&apos;il change.
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Palette} title="Charte graphique">
          <p className="text-sm text-[--text-secondary] mb-3">
            Change l&apos;ambiance de l&apos;application en un clic.
          </p>
          <div className="flex flex-wrap gap-3">
            {COLOR_THEMES.map(t => {
              const active = (settings?.colorTheme || 'marine') === t.id;
              return (
                <button key={t.id} onClick={() => handleColorThemeChange(t.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-[--primary] bg-[--primary-light] shadow-sm'
                      : 'border-[--border] hover:border-gray-300'
                  }`}>
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: t.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: t.colors.accent }} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${active ? 'text-[--primary]' : 'text-[--text]'}`}>
                      {t.emoji} {t.name}
                    </p>
                  </div>
                  {active && (
                    <span className="text-xs bg-[--primary] text-white px-2 py-0.5 rounded-full font-medium">Actif</span>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Target} title="Objectif de lecture">
          <p className="text-sm text-[--text-secondary] mb-3">
            Fixe un objectif quotidien pour suivre ta progression.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={settings?.readingGoal?.type ?? "chapters-per-day"}
              onChange={async (e) => {
                const type = e.target.value as "chapters-per-day" | "verses-per-day";
                const target = settings?.readingGoal?.target ?? 1;
                await updateSettings({ readingGoal: { type, target } });
                const s = await getSettings();
                setSettings(s ?? null);
              }}
              className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]"
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
              className="w-20 border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]"
            />
            <span className="text-sm text-[--text-secondary]">par jour</span>
          </div>
          {settings?.readingGoal && (
            <p className="text-xs text-[--text-secondary] mt-2">
              → {settings.readingGoal.target} {settings.readingGoal.type === "chapters-per-day" ? "chapitres" : "versets"} par jour
            </p>
          )}
        </SectionCard>

        <SectionCard icon={BookOpen} title="Versions bibliques">
          <p className="text-sm text-[--text-secondary] mb-3">
            Une version activée est téléchargée sur cet appareil pour la lecture
            hors ligne — environ 6 Mo chacune. La désactiver libère cette place.
          </p>
          {versionError && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {versionError}
            </p>
          )}
          <div className="space-y-2">
            {versions.filter(v => !v.id.startsWith('audio-') && !v.id.startsWith('ai-')).map(v => {
              const isDefault = v.id === settings?.defaultVersionId;
              return (
                <div key={v.id} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-colors ${
                  isDefault ? 'border-[--primary] bg-[--primary-light]' : 'border-[--border] hover:border-gray-300'
                }`}>
                  <label className={`flex items-center gap-3 flex-1 min-w-0 cursor-pointer ${isDefault ? 'font-medium text-[--primary]' : 'text-[--text]'}`}>
                    <input type="radio" name="defaultVersion" checked={isDefault}
                      onChange={() => handleSetDefault(v.id)}
                      className="accent-[--primary] w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{v.name}</span>
                  </label>
                  {isDefault && <span className="text-xs bg-[--primary] text-white px-2 py-0.5 rounded-full font-medium">Par défaut</span>}
                  <label className={`flex items-center gap-1.5 text-xs text-[--text-secondary] shrink-0 ${
                    isDefault || busyVersion ? 'cursor-default' : 'cursor-pointer'
                  }`}>
                    {busyVersion === v.id ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[--primary] border-t-transparent animate-spin" />
                    ) : (
                      <input type="checkbox" checked={v.isEnabled} disabled={isDefault || busyVersion !== null}
                        onChange={() => handleToggleEnabled(v)}
                        className="accent-[--primary] w-3.5 h-3.5" />
                    )}
                    {busyVersion === v.id
                      ? (v.isEnabled ? 'Suppression…' : 'Téléchargement…')
                      : 'Activée'}
                  </label>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Download} title="Export des données">
          <p className="text-sm text-[--text-secondary] mb-3">
            Télécharge toutes tes données au format JSON.
          </p>
          <button
            onClick={handleExport}
            className="bg-[--primary] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[--primary-hover] transition-colors flex items-center gap-1.5 shadow-[--shadow]"
          >
            <Download className="w-4 h-4" />
            Exporter en JSON
          </button>
          {exportStatus && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {exportStatus}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Upload} title="Import des données">
          <p className="text-sm text-[--text-secondary] mb-3">
            Importe un fichier JSON précédemment exporté.
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
            className="bg-[--surface] text-[--text] border border-[--border] px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Importer un fichier JSON
          </button>
          {importStatus && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              importStatus.includes("Erreur") ? "text-red-500" : "text-green-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                importStatus.includes("Erreur") ? "bg-red-500" : "bg-green-500"
              }`} />
              {importStatus}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Bell} title="Notifications">
          {(() => {
            // Tant que l'état de l'appareil n'est pas lu, ne rien affirmer :
            // afficher « non géré » puis se dédire au montage serait pire que
            // d'attendre une fraction de seconde.
            if (!deviceNotif) {
              return <p className="text-sm text-[--text-secondary]">Lecture de l&apos;appareil…</p>;
            }
            const status = notificationStatus(deviceNotif, settings?.notificationsEnabled ?? false);

            if (status.kind === "ios-not-installed") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  Sur iPhone et iPad, les notifications ne sont délivrées qu&apos;aux
                  applications installées. Ouvre le menu de partage de Safari, puis
                  « Sur l&apos;écran d&apos;accueil », et reviens ici depuis
                  l&apos;application ainsi installée.
                </p>
              );
            }

            if (status.kind === "unsupported") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  Ce navigateur ne gère pas les notifications. Le réglage reste
                  disponible depuis un appareil qui les prend en charge.
                </p>
              );
            }

            if (status.kind === "denied") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  Les notifications ont été refusées pour ce site. Une application
                  ne peut pas revenir sur ce choix : il faut le rouvrir dans les
                  réglages de ton navigateur.
                </p>
              );
            }

            if (status.kind === "needs-permission") {
              return (
                <>
                  <p className="text-sm text-[--text-secondary] mb-3">
                    Reçois un rappel de lecture sur cet appareil. Ton navigateur
                    va te demander ton accord.
                  </p>
                  <button type="button" onClick={handleAskPermission} disabled={notifBusy}
                    className="bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
                    {notifBusy ? "En attente de ta réponse…" : "Autoriser les notifications"}
                  </button>
                </>
              );
            }

            return (
              <>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={status.enabled}
                    onChange={(e) => handleNotificationsToggle(e.target.checked)}
                    className="accent-[--primary] w-4 h-4" />
                  <span className="text-sm text-[--text]">
                    Recevoir des notifications sur cet appareil
                  </span>
                </label>
                <p className="text-sm text-[--text-secondary] mt-3">
                  L&apos;autorisation est accordée. Rien n&apos;est encore envoyé :
                  le choix des rappels et leur envoi restent à venir.
                </p>
                <button type="button" onClick={handleTestNotification}
                  className="mt-3 border border-[--border] rounded-lg px-4 py-2 text-sm text-[--text] hover:bg-gray-50 transition-colors">
                  Envoyer une notification de test
                </button>
                {notifTest && (
                  <p className="text-sm text-[--text-secondary] mt-2">{notifTest}</p>
                )}
              </>
            );
          })()}
        </SectionCard>

        <SectionCard icon={Clock} title="Déconnexion automatique">
          <p className="text-sm text-[--text-secondary] mb-3">
            Ferme la session après une période sans activité. Utile si tu lis
            depuis un appareil partagé.
          </p>
          <select
            value={settings?.autoLogoutMinutes ?? 0}
            onChange={(e) => handleAutoLogoutChange(Number(e.target.value))}
            className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] w-full sm:w-auto"
          >
            {AUTO_LOGOUT_CHOICES.map((c) => (
              <option key={c.minutes} value={c.minutes}>{c.label}</option>
            ))}
          </select>
          {(settings?.autoLogoutMinutes ?? 0) > 0 && (
            <p className="text-sm text-[--text-secondary] mt-3">
              Une fenêtre te préviendra une minute avant la coupure, pour que
              rien de ce que tu es en train de saisir ne soit perdu.
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Cloud} title="Synchronisation cloud">
          <p className="text-sm text-[--text-secondary] mb-3">
            Synchronise tes données avec ton compte pour les retrouver sur tous tes appareils.
          </p>
          <SyncButton />
        </SectionCard>

        {user && (
          <SectionCard icon={AlertTriangle} title="Supprimer mon compte" className="border-red-200">
            {deleteStep === 'initial' && (
              <>
                <p className="text-sm text-red-600 mb-3 font-medium">
                  Cette action est irréversible. Toutes tes données seront définitivement effacées.
                </p>
                <button
                  onClick={() => setDeleteStep('confirm')}
                  className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  Supprimer mon compte
                </button>
              </>
            )}
            {deleteStep === 'confirm' && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg p-3">
                  ⚠️ Es-tu sûr ? Tes lectures, plans et fichiers seront perdus à jamais.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteStep('initial')}
                    disabled={deleting}
                    className="border border-[--border] text-[--text] px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Suppression…' : 'Oui, tout supprimer'}
                  </button>
                </div>
              </div>
            )}
            {deleteStep === 'done' && (
              <p className="text-sm text-green-600 font-medium">Compte supprimé. Redirection...</p>
            )}
          </SectionCard>
        )}

        <SectionCard icon={Info} title="Informations">
          <dl className="text-sm space-y-2">
            <div className="flex justify-between py-1">
              <dt className="text-[--text-secondary]">Application</dt>
              <dd className="text-[--text] font-medium">Bible Ouverte</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">Version</dt>
              <dd className="text-[--text]">0.1.0</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">Mode hors ligne</dt>
              <dd className="text-green-600 font-medium">Activé</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">Stockage</dt>
              <dd className="text-[--text]">IndexedDB</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">Versets disponibles</dt>
              <dd className="text-[--text]">{verseCount.toLocaleString("fr-FR")}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
