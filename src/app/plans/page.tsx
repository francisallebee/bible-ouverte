"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Calendar, Trash2, ListChecks, FileText, AlertTriangle } from "lucide-react";
import { seedIfNeeded, getEnabledVersions, getAllPlans, addPlan, deletePlan, generatePlanDays, addPlanDays, getCurrentUserId, getSettings } from "@/lib/storage";
import { PLAN_TEMPLATES, templateDays, type PlanTemplate } from "@/lib/plans/catalog";
import { templatePlanDays, templateDayRows, templateRealDays } from "@/lib/plans/from-template";
import { joursDepuisTexte, joursDepuisPages, documentDayRows, nomDePlanPour, type Decoupage, type Contenu, type PlanDepuisDocument } from "@/lib/plans/from-document";
import { cheminDeDocument, deposerDocument } from "@/lib/plans/document-store";
import { useAuth } from "@/contexts/AuthContext";
import { texteDuFichier, type RaisonRefus } from "@/lib/import/fichiers";
import type { ProgressionPdf } from "@/lib/import/pdf";
import { ecrireReference } from "@/lib/lectures/reference";
import type { BibleVersion, ReadingPlan, PlanDuration, PlanKind } from "@/lib/storage";
import { useI18n, useBookName } from "@/contexts/I18nContext";
import { formatDate } from "@/lib/i18n/format";

/**
 * La forme du formulaire : les deux sortes de plan, plus « depuis un
 * document » — qui produit l'une ou l'autre selon le rythme choisi, et n'est
 * donc pas un `PlanKind` de plus en base.
 */
type FormeDePlan = PlanKind | "document";

/**
 * Le découpage offert au formulaire : ceux du texte, plus `page` — les pages
 * d'un PDF **gardé**, qui se lit ensuite tel quel. Réservé à l'administrateur
 * par la policy du seau ; le formulaire ne le propose donc qu'à lui.
 */
type DecoupageDuFormulaire = Decoupage | "page";

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
  const { isAdmin } = useAuth();
  const getBookName = useBookName();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formKind, setFormKind] = useState<FormeDePlan>("scheduled");

  /**
   * Le plan depuis un document : le texte sort du fichier par la voie de
   * l'import (`texteDuFichier`), et `joursDepuisTexte` en fait les jours —
   * une ligne qui porte une référence est un jour. Le document est relu à
   * chaque changement de découpage, sans le rouvrir : son texte est gardé.
   */
  const documentRef = useRef<HTMLInputElement>(null);
  const [documentTexte, setDocumentTexte] = useState<string | null>(null);
  /** Le PDF lui-même, et son texte page par page : le découpage `page` garde le premier et lit le second. */
  const [documentFichier, setDocumentFichier] = useState<File | null>(null);
  const [documentPages, setDocumentPages] = useState<string[] | null>(null);
  const [documentPagesParJour, setDocumentPagesParJour] = useState(1);
  const [documentNom, setDocumentNom] = useState("");
  const [documentLecture, setDocumentLecture] = useState(false);
  const [documentPdf, setDocumentPdf] = useState<ProgressionPdf | null>(null);
  const [documentRefus, setDocumentRefus] = useState<RaisonRefus | null>(null);
  const [documentErreur, setDocumentErreur] = useState(false);
  const [documentDecoupage, setDocumentDecoupage] = useState<DecoupageDuFormulaire>("ligne");
  const [documentDate, setDocumentDate] = useState(true);
  const [documentContenu, setDocumentContenu] = useState<Contenu>("references");
  const pageOfferte = documentPages !== null && isAdmin;
  const documentPlan: PlanDepuisDocument | null =
    documentTexte === null ? null
    : documentDecoupage === "page" ? (documentPages ? joursDepuisPages(documentPages, documentPagesParJour) : null)
    : joursDepuisTexte(documentTexte, documentDecoupage, documentContenu);
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

  async function lireDocument(fichier: File) {
    setDocumentLecture(true);
    setDocumentRefus(null);
    setDocumentErreur(false);
    setDocumentTexte(null);
    setDocumentPages(null);
    setDocumentFichier(null);
    try {
      const lu = await texteDuFichier(fichier, { locale, onProgressionPdf: setDocumentPdf });
      if ("refus" in lu) { setDocumentRefus(lu.refus); return; }
      setDocumentTexte(lu.texte);
      setDocumentNom(fichier.name);
      // Un PDF, pour l'administrateur : le découpage par page, une page par
      // jour, est celui qu'on propose d'abord — c'est la demande du
      // propriétaire du 17 septembre 2026. Les autres formats n'ont pas de page.
      if (lu.pages && isAdmin) {
        setDocumentPages(lu.pages);
        setDocumentFichier(fichier);
        setDocumentDecoupage("page");
      } else if (documentDecoupage === "page") {
        setDocumentDecoupage("ligne");
      }
      if (!formName.trim()) setFormName(nomDePlanPour(fichier.name));
    } finally {
      setDocumentLecture(false);
      setDocumentPdf(null);
      if (documentRef.current) documentRef.current.value = "";
    }
  }

  async function handleCreate() {
    if (!formName.trim() || !formVersion) return;
    if (formKind === "document" && (!documentPlan || documentPlan.jours.length === 0)) return;
    setFormSaving(true);

    const userId = await getCurrentUserId();
    const now = new Date().toISOString();

    if (formKind === "document" && documentPlan) {
      // Le PDF d'un plan par pages est déposé **avant** que le plan existe :
      // si le seau refuse, rien n'a été créé ; si le plan échoue ensuite, le
      // fichier orphelin est retiré. Le chemin porte le préfixe du compte,
      // seul que la policy admette.
      let document: string | undefined;
      if (documentDecoupage === "page" && documentFichier) {
        document = cheminDeDocument(userId);
        try {
          await deposerDocument(document, documentFichier);
        } catch (e) {
          console.warn("dépôt du document :", e);
          setDocumentErreur(true);
          setFormSaving(false);
          return;
        }
      }
      // Daté ou libre selon le rythme choisi : en base, c'est l'un des deux
      // `PlanKind` existants, et l'écran du plan n'a rien à apprendre.
      const jours = documentPlan.jours;
      const planId = await addPlan({
        userId,
        name: formName.trim(),
        versionId: formVersion,
        kind: documentDate ? "scheduled" : "free",
        duration: "custom",
        customDays: jours.length,
        startDate: formStartDate,
        totalDays: jours.length,
        ...(document ? { document } : {}),
        createdAt: now,
        updatedAt: now,
      });
      await addPlanDays(documentDayRows(jours, documentDate ? formStartDate : null).map((d) => ({ ...d, planId, userId })));
    } else if (formKind === "free") {
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
    setDocumentTexte(null);
    setDocumentPages(null);
    setDocumentFichier(null);
    setDocumentNom("");
    await load();
  }

  /** Durée retenue pour chaque modèle à flux, avant démarrage. */
  const [dureeModele, setDureeModele] = useState<Record<string, number>>({});
  const [modeleEnCours, setModeleEnCours] = useState<string | null>(null);

  /**
   * Démarre un plan bâti sur un modèle du catalogue.
   *
   * `totalDays` reçoit les jours **réellement produits** et non la durée
   * demandée : les journées vides sont écartées, et un plan peut donc être plus
   * court que la durée choisie. C'est la même règle que pour les plans
   * engendrés depuis une sélection de livres.
   */
  async function handleStartTemplate(modele: PlanTemplate) {
    if (!formVersion) return;
    setModeleEnCours(modele.id);
    try {
      const duree = modele.kind === "streams"
        ? (dureeModele[modele.id] ?? modele.durations[0])
        : undefined;
      const debut = new Date().toISOString().slice(0, 10);
      const jours = templatePlanDays(modele, debut, duree);
      const userId = await getCurrentUserId();
      const now = new Date().toISOString();

      const planId = await addPlan({
        userId,
        name: t.planCatalog.plans[modele.id]?.name ?? modele.id,
        versionId: formVersion,
        kind: "scheduled",
        duration: "custom",
        customDays: templateRealDays(modele, duree),
        startDate: debut,
        totalDays: jours.length,
        createdAt: now,
        updatedAt: now,
      });

      await addPlanDays(templateDayRows(jours).map((d) => ({ ...d, planId, userId })));
      await load();
    } catch (e) {
      console.error(e);
    }
    setModeleEnCours(null);
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
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.name}</label>
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
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.kind}</label>
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
                <button
                  type="button"
                  onClick={() => setFormKind("document")}
                  aria-pressed={formKind === "document"}
                  className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors sm:col-span-2 ${
                    formKind === "document"
                      ? "border-[--primary] bg-white ring-1 ring-[--primary]"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileText className="w-4 h-4" /> {t.plans.document}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {t.plans.documentHint}
                  </span>
                </button>
              </div>
            </div>

            {formKind === "document" && (
              <div className="space-y-3">
                <input
                  ref={documentRef}
                  type="file"
                  className="sr-only"
                  accept=".txt,.md,.csv,.tsv,.html,.htm,.docx,.xlsx,.pptx,.odt,.ods,.odp,.epub,.fb2,.pdf,text/*,application/pdf"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void lireDocument(f); }}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => documentRef.current?.click()}
                    disabled={documentLecture}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    {t.plans.documentChoose}
                  </button>
                  {documentLecture && (
                    <span className="text-sm text-[--text-secondary]" role="status">
                      {documentPdf ? t.plans.documentPdf(documentPdf.page, documentPdf.pages) : t.plans.documentReading}
                    </span>
                  )}
                  {!documentLecture && documentNom && <span className="text-sm text-[--text-secondary]">{documentNom}</span>}
                </div>
                {documentRefus && (
                  <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5" role="alert">
                    <AlertTriangle className="w-4 h-4" />
                    {t.avance.import.fileRefus[documentRefus]}
                  </p>
                )}
                {documentErreur && (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5" role="alert">
                    <AlertTriangle className="w-4 h-4" />
                    {t.plans.documentUploadError}
                  </p>
                )}

                {documentPlan && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.documentSplit}</label>
                        <select
                          value={documentDecoupage}
                          onChange={(e) => setDocumentDecoupage(e.target.value as DecoupageDuFormulaire)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          {pageOfferte && <option value="page">{t.plans.documentSplitPage}</option>}
                          <option value="titre">{t.plans.documentSplitHeading}</option>
                          <option value="ligne">{t.plans.documentSplitLine}</option>
                          <option value="passage">{t.plans.documentSplitPassage}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.documentRhythm}</label>
                        <select
                          value={documentDate ? "date" : "libre"}
                          onChange={(e) => setDocumentDate(e.target.value === "date")}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="date">{t.plans.documentDated}</option>
                          <option value="libre">{t.plans.documentFreeRhythm}</option>
                        </select>
                      </div>
                    </div>
                    {documentDate && (
                      <input
                        type="date"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        aria-label={t.plans.startDate}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    )}
                    {documentDecoupage === "page" ? (
                      // Le PDF est gardé et se lit tel quel : pas de « contenu »
                      // à choisir, seulement le pas — combien de pages par jour.
                      <div>
                        <label htmlFor="pages-par-jour" className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.documentPagesPerDay}</label>
                        <input
                          id="pages-par-jour"
                          type="number"
                          min={1}
                          max={50}
                          value={documentPagesParJour}
                          onChange={(e) => setDocumentPagesParJour(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                          className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-[--text-secondary] mt-1">{t.plans.documentPageHint}</p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.documentContent}</label>
                        <select
                          value={documentContenu}
                          onChange={(e) => setDocumentContenu(e.target.value as Contenu)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="references">{t.plans.documentContentRefs}</option>
                          <option value="integral">{t.plans.documentContentFull}</option>
                        </select>
                      </div>
                    )}

                    {/* L'aperçu : ce que le plan aura pour jours, avant de le
                        créer. Les dix premiers, puis le compte du reste. */}
                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                      <p className="text-sm font-medium">
                        {documentPlan.jours.length > 0 ? t.plans.documentDays(documentPlan.jours.length) : t.plans.documentEmpty}
                      </p>
                      {documentPlan.lignesIgnorees > 0 && (
                        <p className="text-xs text-[--text-secondary]">{t.plans.documentIgnored(documentPlan.lignesIgnorees)}</p>
                      )}
                      {documentPlan.sectionsJointes > 0 && (
                        <p className="text-xs text-[--text-secondary]">
                          {documentDecoupage === "page" ? t.plans.documentPagesJoined(documentPlan.sectionsJointes) : t.plans.documentSectionsJoined(documentPlan.sectionsJointes)}
                        </p>
                      )}
                      {documentPlan.jours.length > 0 && (
                        <ol className="mt-2 text-sm space-y-1 max-h-56 overflow-y-auto">
                          {documentPlan.jours.slice(0, 10).map((j) => (
                            <li key={j.day} className="flex gap-2">
                              <span className="text-xs text-gray-400 font-mono shrink-0 pt-0.5">{t.planDetail.day(j.day)}</span>
                              <span className="min-w-0">
                                {/* Par page : les pages réelles du jour d'abord — c'est ce qu'on lira. */}
                                {j.pageDebut !== undefined && (
                                  <span className="text-xs text-[--text-secondary] me-2">{t.planDetail.pages(j.pageDebut, j.pageFin ?? j.pageDebut)}</span>
                                )}
                                {j.passages.map((p) => ecrireReference(getBookName(p.book), p.book, p)).join(", ")}
                                {/* En mode intégral, un aperçu de la page du jour : ses premiers mots ; par page, la première ligne de la page. */}
                                {(j.texte || j.pageDebut !== undefined) && (
                                  <span className="block text-xs text-[--text-secondary] truncate">
                                    {(j.texte ?? j.source).replace(/^(?:#{1,3}|-)\s+/gm, "").replace(/\s+/g, " ").slice(0, 120)}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                          {documentPlan.jours.length > 10 && (
                            <li className="text-xs text-[--text-secondary]">{t.plans.documentMore(documentPlan.jours.length - 10)}</li>
                          )}
                        </ol>
                      )}
                      {documentPlan.rejets.length > 0 && (
                        <div className="mt-2 text-xs text-amber-900">
                          <p className="font-medium">{t.plans.documentRejected}</p>
                          <ul>
                            {documentPlan.rejets.slice(0, 5).map((r, i) => (
                              <li key={i}>« {r.source} » — {t.avance.import.reasons[r.raison]}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {formKind === "scheduled" && (
              <div>
                <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.duration}</label>
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
              <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.version}</label>
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
                <label className="block text-xs font-medium text-[--text-secondary] mb-1">{t.plans.startDate}</label>
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
              disabled={!formName.trim() || formSaving || (formKind === "document" && !(documentPlan && documentPlan.jours.length > 0))}
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

      {/*
        L'ordre des deux blocs dépend de ce que le lecteur possède, et ce n'est
        pas un caprice : le catalogue passait **toujours** en premier, avec une
        raison qui ne vaut que pour qui n'a encore aucun plan — « c'est la porte
        d'entrée, et elle ne doit pas se mériter par un défilement ».

        Cette raison tombe dès qu'un plan existe : on vient alors pour reprendre
        sa lecture, pas pour en choisir une autre, et faire défiler tout le
        catalogue pour retrouver son propre plan est le défaut signalé le
        9 septembre 2026 par le propriétaire du dépôt.

        Les deux cas sont donc servis par `order`, et non par un second rendu :
        le catalogue reste premier tant que la liste est vide — un état vide
        placé au-dessus de lui n'aurait rien à montrer —, et passe dessous dès
        qu'il y a un plan. Les classes sont écrites en toutes lettres des deux
        côtés du ternaire : une classe Tailwind construite à l'exécution
        n'existe pas (règle 14).
      */}
      <div className="flex flex-col gap-8">
      <section className={plans.length === 0 ? "order-1" : "order-2"}>
        <h2 className="text-lg font-semibold mb-1">{t.planCatalog.title}</h2>
        <p className="text-sm text-gray-500 mb-4">{t.planCatalog.hint}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLAN_TEMPLATES.map((modele) => {
            const libelle = t.planCatalog.plans[modele.id];
            const duree = modele.kind === "streams"
              ? (dureeModele[modele.id] ?? modele.durations[0])
              : undefined;
            return (
              <div key={modele.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                <div>
                  <p className="font-medium text-gray-900">
                    <span aria-hidden="true">{modele.emoji} </span>
                    {libelle?.name ?? modele.id}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{libelle?.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-auto flex-wrap">
                  {modele.kind === "streams" ? (
                    <select
                      value={duree}
                      aria-label={t.planCatalog.duration}
                      onChange={(e) => setDureeModele((p) => ({ ...p, [modele.id]: Number(e.target.value) }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      {modele.durations.map((n) => (
                        <option key={n} value={n}>{t.planCatalog.dayCount(n)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t.planCatalog.dayCount(templateDays(modele))}
                    </span>
                  )}
                  <button
                    onClick={() => handleStartTemplate(modele)}
                    disabled={!formVersion || modeleEnCours !== null}
                    className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors ms-auto"
                  >
                    {modeleEnCours === modele.id ? t.plans.creating : t.planCatalog.start}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className={plans.length === 0 ? "order-2" : "order-1"}>
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
                  {/* Le bouton n'a qu'une icône : sans libellé, un lecteur
                      d'écran n'annonce rien. Ses homologues du détail d'un
                      plan et des Réglages en portaient un ; celui-ci non. */}
                  <button
                    onClick={() => setDeleteConfirm(plan.id as number)}
                    aria-label={t.plans.deletePlan(plan.name)}
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
      </div>
      </div>

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
