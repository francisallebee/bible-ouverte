"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Download, Upload, Sun, Info, BookOpen, Target, Cloud, RefreshCw, AlertTriangle, Palette, Clock, Bell, Compass, Languages, LayoutList, Check, Type } from "lucide-react";
import { seedIfNeeded, getSettings, updateSettings, countPassages, getAllVersions, updateVersion, deletePassagesForVersion } from "@/lib/storage";
import { importBibleVersion, forgetImportedVersion } from "@/features/bible";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { AVAILABLE_LOCALES } from "@/lib/i18n/ui";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { APP_VERSION } from "@/lib/version";
import { TOUR_START } from "@/lib/tour";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SyncButton from "@/components/SyncButton";
import { exportData, importData } from "@/lib/storage/export-import";
import type { AppSettings, BibleVersion } from "@/lib/storage";
import { COLOR_THEMES, applyColorTheme, applyTheme, CUSTOM_THEME_ID, DEFAULT_CUSTOM } from "@/lib/themes";
import { NAV_LINKS } from "@/components/Sidebar";
import {
  FONTS, DEFAULT_FONT_ID, applyFonts,
  UI_SCALES, DEFAULT_UI_SCALE, READING_SIZES, DEFAULT_READING_SIZE,
  READING_STYLES, DEFAULT_READING_STYLE,
} from "@/lib/fonts";
import { HIDEABLE_PAGES, isPageVisible, shouldForceSetup } from "@/lib/setup";
import { AUTO_LOGOUT_CHOICES } from "@/lib/auto-logout";
import {
  notificationStatus, readDeviceState, requestNotificationPermission, showTestNotification,
  NOTIFICATION_TRIGGERS, resolveTriggers, readTimeZone, DEFAULT_REMINDER_TIME,
  subscribeDevice, unsubscribeDevice,
} from "@/lib/notifications";
import type { DeviceNotificationState } from "@/lib/notifications";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
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
          ? t.errors.versionDownload(version.name)
          : t.errors.versionDelete(version.name),
      );
    }
    setBusyVersion(null);
  }

  /** Le passage obligé n'est en cours que pour un compte neuf qui n'a pas validé. */
  const personnalisationEnCours = shouldForceSetup(user?.created_at, settings);

  async function basculerPage(href: string, visible: boolean) {
    const actuelles = settings?.hiddenPages ?? [];
    const hiddenPages = visible
      ? actuelles.filter((p) => p !== href)
      : [...actuelles.filter((p) => p !== href), href];
    await updateSettings({ hiddenPages });
    setSettings((prev) => (prev ? { ...prev, hiddenPages } : prev));
  }

  const couleursPerso = settings?.customColors ?? DEFAULT_CUSTOM;

  /**
   * Applique tout de suite, enregistre ensuite.
   *
   * Choisir une couleur sans la voir n'aurait aucun sens : l'aperçu, c'est
   * l'application elle-même. `applyColorTheme` ne touche que des variables
   * CSS, donc le rendu suit le curseur sans attendre l'écriture.
   */
  async function changerCouleurPerso(champ: "primary" | "accent", valeur: string) {
    const customColors = { ...couleursPerso, [champ]: valeur };
    applyColorTheme(CUSTOM_THEME_ID, customColors);
    setSettings((prev) => (prev ? { ...prev, customColors, colorTheme: CUSTOM_THEME_ID } : prev));
    await updateSettings({ customColors, colorTheme: CUSTOM_THEME_ID });
  }

  type ChampTypo = "uiFont" | "readingFont" | "uiScale" | "readingSize" | "readingStyle";

  /**
   * Applique tout de suite, enregistre ensuite — comme pour les couleurs.
   * Choisir une taille sans la voir n'aurait aucun sens.
   */
  async function changerTypo(champ: ChampTypo, id: string) {
    applyFonts({
      uiFont: settings?.uiFont,
      readingFont: settings?.readingFont,
      uiScale: settings?.uiScale,
      readingSize: settings?.readingSize,
      readingStyle: settings?.readingStyle,
      [champ]: id,
    });
    setSettings((prev) => (prev ? { ...prev, [champ]: id } : prev));
    await updateSettings({ [champ]: id });
  }

  async function terminerPersonnalisation() {
    const setupCompletedAt = new Date().toISOString();
    await updateSettings({ setupCompletedAt });
    setSettings((prev) => (prev ? { ...prev, setupCompletedAt } : prev));
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
      if (s?.colorTheme) applyColorTheme(s.colorTheme, s?.customColors);
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
      setExportStatus(t.settings.exportOk);
    } catch {
      setExportStatus(t.settings.exportError);
    }
  }

  async function handleImport(file: File) {
    if (!confirm(t.settings.importConfirm)) return;
    setImportStatus(t.settings.importRunning);
    try {
      const text = await file.text();
      const result = await importData(text);
      if (result.ok) {
        setImportStatus(t.settings.importOk(result.count));
      } else {
        setImportStatus(t.settings.importError(result.errors.join(", ")));
      }
    } catch {
      setImportStatus(t.settings.importReadError);
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
      alert(t.settings.deleteError)
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
    setNotifBusy(true);
    setNotifTest("");
    // Le fuseau est relevé à l'activation, et non demandé : le navigateur le
    // connaît, et sans lui « à 7 h » n'a pas de sens côté serveur.
    await updateSettings(enabled
      ? { notificationsEnabled: true, timeZone: readTimeZone() }
      : { notificationsEnabled: false });
    const s = await getSettings();
    setSettings(s ?? null);

    // L'abonnement de l'appareil suit le réglage du compte. Sans lui, activer
    // les notifications n'enregistrerait rien et le serveur n'aurait personne
    // à qui écrire.
    if (enabled) {
      const result = await subscribeDevice();
      if (result !== "subscribed") {
        setNotifTest(result === "no-permission"
          ? t.notifications.noPermission
          : t.notifications.subscribeFailed);
      }
    } else {
      await unsubscribeDevice();
    }
    setNotifBusy(false);
  }

  async function handleTriggerToggle(id: string, on: boolean) {
    const current = resolveTriggers(settings?.notificationTriggers);
    await updateSettings({ notificationTriggers: { ...current, [id]: on } });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  async function handleReminderTimeChange(time: string) {
    await updateSettings({ dailyReminderTime: time, timeZone: readTimeZone() });
    const s = await getSettings();
    setSettings(s ?? null);
  }

  async function handleTestNotification() {
    setNotifTest(t.notifications.testSending);
    const messages: Record<string, string> = {
      sent: t.notifications.testSent,
      "no-permission": t.notifications.noPermission,
      unsupported: t.notifications.testUnsupported,
      failed: t.notifications.testFailed,
    };
    setNotifTest(messages[await showTestNotification()]);
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
    applyColorTheme(themeId, s?.customColors);
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
          {t.settings.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">
          {t.settings.subtitle}
        </p>
      </div>

      {personnalisationEnCours && (
        <div className="mb-6 rounded-xl border border-[--primary]/20 bg-[--primary-light] p-5">
          <p className="font-semibold text-[--primary] mb-1">{t.settings.setupTitle}</p>
          <p className="text-sm text-[--text-secondary]">{t.settings.setupHint}</p>
        </div>
      )}

      <div className="space-y-4">
        <SectionCard icon={Languages} title={t.language.title}>
          <select
            value={locale}
            onChange={(e) => { void setLocale(e.target.value as Locale) }}
            className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] w-full sm:w-auto"
          >
            {AVAILABLE_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
          <p className="text-sm text-[--text-secondary] mt-3">
            {t.language.bibleLanguages}
          </p>
        </SectionCard>

        <SectionCard icon={Sun} title={t.settings.theme}>
          <select
            value={settings?.theme ?? "light"}
            onChange={(e) => handleThemeChange(e.target.value)}
            className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] w-full sm:w-auto"
          >
            <option value="light">{t.settings.themeLight}</option>
            <option value="dark">{t.settings.themeDark}</option>
            <option value="system">{t.settings.themeSystem}</option>
          </select>
          {settings?.theme === 'system' && (
            <p className="text-sm text-[--text-secondary] mt-3">
              {t.settings.themeSystemHint}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Palette} title={t.settings.colorTheme}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.colorThemeHint}
          </p>
          <div className="flex flex-wrap gap-3">
            {/* `charte` et non `t` : `t` est désormais le dictionnaire, et la
                variable de boucle le masquait dans tout ce bloc. */}
            {[...COLOR_THEMES, {
              id: CUSTOM_THEME_ID,
              emoji: '🎨',
              colors: { ...DEFAULT_CUSTOM, ...couleursPerso },
            }].map(charte => {
              const active = (settings?.colorTheme || 'marine') === charte.id;
              return (
                <button key={charte.id} onClick={() => handleColorThemeChange(charte.id)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-[--primary] bg-[--primary-light] shadow-sm'
                      : 'border-[--border] hover:border-gray-300'
                  }`}>
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: charte.colors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: charte.colors.accent }} />
                  </div>
                  <div className="text-start">
                    <p className={`text-sm font-medium ${active ? 'text-[--primary]' : 'text-[--text]'}`}>
                      {charte.emoji} {t.colorThemes[charte.id] ?? charte.id}
                    </p>
                  </div>
                  {active && (
                    <span className="text-xs bg-[--primary] text-white px-2 py-0.5 rounded-full font-medium">{t.settings.active}</span>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Palette} title={t.settings.customTheme}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.customThemeHint}
          </p>
          <div className="flex flex-wrap gap-4">
            {([
              ["primary", t.settings.customPrimary],
              ["accent", t.settings.customAccent],
            ] as const).map(([champ, libelle]) => (
              <label key={champ} className="flex items-center gap-2.5 text-sm text-[--text]">
                <input
                  type="color"
                  value={couleursPerso[champ]}
                  onChange={(e) => changerCouleurPerso(champ, e.target.value)}
                  className="w-10 h-10 rounded-lg border border-[--border] bg-[--surface] cursor-pointer p-1"
                />
                {libelle}
              </label>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Type} title={t.settings.fontsTitle}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.fontsHint}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              ["uiFont", t.settings.fontUi],
              ["readingFont", t.settings.fontReading],
            ] as const).map(([champ, libelle]) => (
              <div key={champ}>
                <label htmlFor={`police-${champ}`} className="block text-xs font-medium text-[--text-secondary] mb-1">
                  {libelle}
                </label>
                <select
                  id={`police-${champ}`}
                  value={settings?.[champ] ?? DEFAULT_FONT_ID}
                  onChange={(e) => changerTypo(champ, e.target.value)}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]"
                >
                  {FONTS.map((police) => (
                    <option key={police.id} value={police.id}>
                      {t.fonts[police.id] ?? police.id}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {([
              ["uiScale", t.settings.uiScaleLabel, UI_SCALES, DEFAULT_UI_SCALE, t.fontSizes],
              ["readingSize", t.settings.readingSizeLabel, READING_SIZES, DEFAULT_READING_SIZE, t.fontSizes],
              ["readingStyle", t.settings.readingStyleLabel, READING_STYLES, DEFAULT_READING_STYLE, t.fontStyles],
            ] as const).map(([champ, libelle, choix, defaut, libelles]) => (
              <div key={champ}>
                <label htmlFor={`typo-${champ}`} className="block text-xs font-medium text-[--text-secondary] mb-1">
                  {libelle}
                </label>
                <select
                  id={`typo-${champ}`}
                  value={settings?.[champ] ?? defaut}
                  onChange={(e) => changerTypo(champ, e.target.value)}
                  className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]"
                >
                  {choix.map((c) => (
                    <option key={c.id} value={c.id}>{libelles[c.id] ?? c.id}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Un aperçu, parce qu'un nom de taille ne dit rien : « Grand » se
              juge sur un verset, pas dans une liste déroulante. */}
          <p className="texte-biblique mt-4 rounded-lg border border-[--border] p-3 text-[--text]">
            <sup className="text-xs text-[--text-secondary] me-0.5">16</sup>
            {t.settings.fontPreview}
          </p>
        </SectionCard>

        <SectionCard icon={Target} title={t.settings.goal}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.goalHint}
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
              <option value="chapters-per-day">{t.settings.goalChapters}</option>
              <option value="verses-per-day">{t.settings.goalVerses}</option>
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
            <span className="text-sm text-[--text-secondary]">{t.settings.perDay}</span>
          </div>
          {settings?.readingGoal && (
            <p className="text-xs text-[--text-secondary] mt-2">
              {t.settings.goalSummary(
                settings.readingGoal.target,
                settings.readingGoal.type === "chapters-per-day",
              )}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={BookOpen} title={t.settings.versions}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.versionsHint}
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
                  {isDefault && <span className="text-xs bg-[--primary] text-white px-2 py-0.5 rounded-full font-medium">{t.settings.versionDefault}</span>}
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
                      ? (v.isEnabled ? t.settings.versionDeleting : t.settings.versionDownloading)
                      : t.settings.versionEnabled}
                  </label>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Download} title={t.settings.exportTitle}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.exportHint}
          </p>
          <button
            onClick={handleExport}
            className="bg-[--primary] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[--primary-hover] transition-colors flex items-center gap-1.5 shadow-[--shadow]"
          >
            <Download className="w-4 h-4" />
            {t.settings.exportButton}
          </button>
          {exportStatus && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {exportStatus}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Upload} title={t.settings.importTitle}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.importHint}
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
            {t.settings.importButton}
          </button>
          {importStatus && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              importStatus.includes(t.settings.errorMarker) ? "text-red-500" : "text-green-600"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                importStatus.includes(t.settings.errorMarker) ? "bg-red-500" : "bg-green-500"
              }`} />
              {importStatus}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={Bell} title={t.notifications.title}>
          {(() => {
            // Tant que l'état de l'appareil n'est pas lu, ne rien affirmer :
            // afficher « non géré » puis se dédire au montage serait pire que
            // d'attendre une fraction de seconde.
            if (!deviceNotif) {
              return <p className="text-sm text-[--text-secondary]">{t.notifications.readingDevice}</p>;
            }
            const status = notificationStatus(deviceNotif, settings?.notificationsEnabled ?? false);

            if (status.kind === "ios-not-installed") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  {t.notifications.iosNotInstalled}
                </p>
              );
            }

            if (status.kind === "unsupported") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  {t.notifications.unsupported}
                </p>
              );
            }

            if (status.kind === "denied") {
              return (
                <p className="text-sm text-[--text-secondary]">
                  {t.notifications.denied}
                </p>
              );
            }

            if (status.kind === "needs-permission") {
              return (
                <>
                  <p className="text-sm text-[--text-secondary] mb-3">
                    {t.notifications.needsPermission}
                  </p>
                  <button type="button" onClick={handleAskPermission} disabled={notifBusy}
                    className="bg-[--primary] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
                    {notifBusy ? t.notifications.waiting : t.notifications.allow}
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
                    {t.notifications.receiveOnDevice}
                  </span>
                </label>
                {status.enabled && (() => {
                  const triggers = resolveTriggers(settings?.notificationTriggers);
                  return (
                    <div className="mt-4 pt-4 border-t border-[--border] space-y-3">
                      <p className="text-sm font-medium text-[--text]">{t.notifications.whatTriggers}</p>
                      {/* `declencheur` et non `t` : `t` est le dictionnaire. */}
                      {NOTIFICATION_TRIGGERS.map((declencheur) => (
                        <div key={declencheur.id}>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={triggers[declencheur.id]}
                              onChange={(e) => handleTriggerToggle(declencheur.id, e.target.checked)}
                              className="accent-[--primary] w-4 h-4 mt-0.5" />
                            <span className="min-w-0">
                              <span className="block text-sm text-[--text]">
                                {t.notifications.triggers[declencheur.id].label}
                              </span>
                              <span className="block text-xs text-[--text-secondary]">
                                {t.notifications.triggers[declencheur.id].hint}
                              </span>
                            </span>
                          </label>
                          {declencheur.id === "daily" && triggers.daily && (
                            <div className="flex items-center gap-2 mt-2 ms-7">
                              <label htmlFor="reminder-time" className="text-xs text-[--text-secondary]">
                                {t.notifications.at}
                              </label>
                              <input id="reminder-time" type="time"
                                value={settings?.dailyReminderTime ?? DEFAULT_REMINDER_TIME}
                                onChange={(e) => handleReminderTimeChange(e.target.value)}
                                className="border border-[--border] rounded-lg px-2.5 py-1.5 text-sm bg-[--surface] text-[--text]" />
                              <span className="text-xs text-[--text-secondary]">
                                {t.notifications.timeZoneOf(settings?.timeZone ?? readTimeZone())}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <p className="text-sm text-[--text-secondary] mt-4">
                  {t.notifications.granted}
                </p>
                <button type="button" onClick={handleTestNotification}
                  className="mt-3 border border-[--border] rounded-lg px-4 py-2 text-sm text-[--text] hover:bg-gray-50 transition-colors">
                  {t.notifications.sendTest}
                </button>
                {notifTest && (
                  <p className="text-sm text-[--text-secondary] mt-2">{notifTest}</p>
                )}
              </>
            );
          })()}
        </SectionCard>

        <SectionCard icon={Clock} title={t.settings.autoLogout}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.autoLogoutHint}
          </p>
          <select
            value={settings?.autoLogoutMinutes ?? 0}
            onChange={(e) => handleAutoLogoutChange(Number(e.target.value))}
            className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] w-full sm:w-auto"
          >
            {AUTO_LOGOUT_CHOICES.map((c) => (
              <option key={c.minutes} value={c.minutes}>
                {t.settings.autoLogoutChoices[c.minutes]}
              </option>
            ))}
          </select>
          {(settings?.autoLogoutMinutes ?? 0) > 0 && (
            <p className="text-sm text-[--text-secondary] mt-3">
              {t.settings.autoLogoutWarning}
            </p>
          )}
        </SectionCard>

        <SectionCard icon={LayoutList} title={t.settings.pages}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.pagesHint}
          </p>
          <div className="space-y-1">
            {NAV_LINKS.filter((l) => (HIDEABLE_PAGES as readonly string[]).includes(l.href)).map((lien) => {
              const visible = isPageVisible(lien.href, settings?.hiddenPages);
              const Icone = lien.icon;
              return (
                <label key={lien.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={visible}
                    onChange={(e) => basculerPage(lien.href, e.target.checked)}
                    className="accent-[--primary] w-4 h-4 shrink-0" />
                  <Icone className="w-4 h-4 text-[--text-secondary] shrink-0" />
                  <span className="text-sm text-[--text]">{lien.label(t)}</span>
                </label>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard icon={Compass} title={t.settings.tour}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.tourHint}
          </p>
          <p className="text-sm text-[--text-secondary] mb-3">
            {settings?.tourCompletedAt
              ? t.settings.tourDone(formatDate(locale, settings.tourCompletedAt, {
                  day: 'numeric', month: 'long', year: 'numeric',
                }))
              : t.settings.tourNotYet}
          </p>
          <button
            onClick={() => window.dispatchEvent(new Event(TOUR_START))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[--primary] hover:opacity-90 transition-opacity"
          >
            <Compass className="w-4 h-4" />
            {t.settings.tourReplay}
          </button>
        </SectionCard>

        <SectionCard icon={Cloud} title={t.settings.sync}>
          <p className="text-sm text-[--text-secondary] mb-3">
            {t.settings.syncHint}
          </p>
          <SyncButton />
        </SectionCard>

        {user && (
          <SectionCard icon={AlertTriangle} title={t.settings.deleteAccount} className="border-red-200">
            {deleteStep === 'initial' && (
              <>
                <p className="text-sm text-red-600 mb-3 font-medium">
                  {t.settings.deleteWarning}
                </p>
                <button
                  onClick={() => setDeleteStep('confirm')}
                  className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  {t.settings.deleteAccount}
                </button>
              </>
            )}
            {deleteStep === 'confirm' && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg p-3">
                  {t.settings.deleteConfirm}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteStep('initial')}
                    disabled={deleting}
                    className="border border-[--border] text-[--text] px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? t.settings.deleting : t.settings.deleteYes}
                  </button>
                </div>
              </div>
            )}
            {deleteStep === 'done' && (
              <p className="text-sm text-green-600 font-medium">{t.settings.deleteDone}</p>
            )}
          </SectionCard>
        )}

        <SectionCard icon={Info} title={t.settings.info}>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between py-1">
              <dt className="text-[--text-secondary]">{t.settings.infoApp}</dt>
              <dd className="text-[--text] font-medium">Bible Ouverte</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">{t.settings.infoVersion}</dt>
              <dd className="text-[--text]">{APP_VERSION}</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">{t.settings.infoOffline}</dt>
              <dd className="text-green-600 font-medium">{t.settings.infoOfflineOn}</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">{t.settings.infoStorage}</dt>
              <dd className="text-[--text]">IndexedDB</dd>
            </div>
            <div className="flex justify-between py-1 border-t border-[--border]">
              <dt className="text-[--text-secondary]">{t.settings.infoVerses}</dt>
              <dd className="text-[--text]">{formatNumber(locale, verseCount)}</dd>
            </div>
          </dl>
        </SectionCard>

        {/* En bas, et non dans le bandeau d'en-tête : le bouton doit se
            mériter par le parcours des réglages, pas se cliquer d'emblée. */}
        {personnalisationEnCours && (
          <button
            onClick={terminerPersonnalisation}
            className="w-full flex items-center justify-center gap-2 bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] transition-colors"
          >
            <Check className="w-4 h-4" />
            {t.settings.setupDone}
          </button>
        )}
      </div>
    </div>
  );
}
