'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardPaste, Check, AlertTriangle, Sparkles, FileUp, Camera, Link2 } from 'lucide-react'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import {
  seedIfNeeded, getEnabledVersions, getAllContexts, getSettings, getPassagesForRange, addReading,
} from '@/lib/storage'
import type { BibleVersion, ReadingContext } from '@/lib/storage'
import { extraireReferences, type ReferenceExtraite, type RejetExtraction } from '@/lib/import/references'
import { texteDuFichier, type RaisonRefus } from '@/lib/import/fichiers'
import { reconnaitreTexte } from '@/lib/import/ocr'
import type { ProgressionAudio } from '@/lib/import/audio'
import type { ProgressionPdf } from '@/lib/import/pdf'
import { ecrireReference } from '@/lib/lectures/reference'
import { aujourdhui } from '@/lib/objectifs/objectifs'
import { formatDate } from '@/lib/i18n/format'
import ContextPicker from '@/components/ContextPicker'

/**
 * L'import de lectures — le presse-papier, les fichiers (PDF et
 * enregistrements audio compris), la photo, le lien.
 *
 * Un texte collé — ou extrait d'un fichier par `texteDuFichier`, ou reconnu
 * sur une photo par `reconnaitreTexte`, ou rapporté d'une adresse par la
 * route `api/import/lien` puis extrait par ce même `texteDuFichier`, toujours
 * dans le navigateur, et déposé dans le même champ pour que le lecteur voie ce
 * qui a été lu — passe par `extraireReferences`, et chaque référence reconnue
 * devient une proposition cochée ; les fragments non reconnus sont montrés
 * avec leur raison, jamais avalés. **Rien ne s'enregistre sans relecture** :
 * c'est la seule protection contre une référence mal lue, et elle vaut pour
 * tous les chemins qui suivront — fichier, photo, dictée — qui déboucheront
 * tous ici, une fois leur texte obtenu.
 *
 * C'est la **septième** voie de création d'une lecture. Elle passe par le même
 * store que les six autres, avec les mêmes champs obligatoires ; le texte du
 * passage vient du cache local de la version choisie, comme partout, et la
 * trace de l'import est le nom de séance — décision du propriétaire du
 * 17 septembre 2026.
 *
 * Réservé à l'administrateur pour le moment (`/avance`). Ce garde-fou est
 * celui de la page : il décide de ce qui s'affiche, et rien ici ne touche aux
 * données d'autrui — les lectures créées sont celles du compte connecté, sous
 * sa propre RLS.
 */

interface Proposition extends ReferenceExtraite {
  retenue: boolean
}

export default function ImportLectures() {
  const { t, locale } = useI18n()
  const getBookName = useBookName()

  const [versions, setVersions] = useState<BibleVersion[]>([])
  const [versionId, setVersionId] = useState('')
  const [contexts, setContexts] = useState<ReadingContext[]>([])
  const [contextId, setContextId] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [sessionTitle, setSessionTitle] = useState('')
  const [texte, setTexte] = useState('')
  const [propositions, setPropositions] = useState<Proposition[] | null>(null)
  const [rejets, setRejets] = useState<RejetExtraction[]>([])
  const [saving, setSaving] = useState(false)
  const [enregistrees, setEnregistrees] = useState<number | null>(null)
  const [refusFichier, setRefusFichier] = useState<RaisonRefus | null>(null)
  const [lectureFichier, setLectureFichier] = useState(false)
  const [pdf, setPdf] = useState<ProgressionPdf | null>(null)
  const [audio, setAudio] = useState<ProgressionAudio | null>(null)
  const fichierRef = useRef<HTMLInputElement>(null)
  /** `null` au repos ; `-1` pendant le chargement du moteur ; 0 à 100 pendant la lecture. */
  const [ocr, setOcr] = useState<number | null>(null)
  const [ocrMessage, setOcrMessage] = useState<'vide' | 'erreur' | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const [lien, setLien] = useState('')
  const [lectureLien, setLectureLien] = useState(false)
  const [refusLien, setRefusLien] = useState<keyof typeof t.avance.import.linkRefus | null>(null)

  useEffect(() => {
    ;(async () => {
      await seedIfNeeded()
      const [vers, ctxs, s] = await Promise.all([getEnabledVersions(), getAllContexts(), getSettings()])
      setVersions(vers)
      setContexts(ctxs)
      if (vers.length > 0) setVersionId(s?.defaultVersionId || vers[0].id)
    })()
  }, [])

  const retenues = useMemo(() => (propositions ?? []).filter((p) => p.retenue), [propositions])

  function analyser(contenu: string = texte, seance?: string) {
    const { references, rejets: refuses } = extraireReferences(contenu)
    setPropositions(references.map((r) => ({ ...r, retenue: true })))
    setRejets(refuses)
    setEnregistrees(null)
    // Le nom de séance par défaut porte la source et la date : c'est la trace
    // de l'import. Il reste modifiable, et vide s'il est effacé.
    if (seance) setSessionTitle(seance)
    else if (!sessionTitle) setSessionTitle(t.avance.import.sessionDefault(formatDate(locale, date)))
  }

  /**
   * Le fichier est lu sur l'appareil, son texte déposé dans le champ, et
   * l'analyse part aussitôt. Un refus est dit avec sa raison ; le champ reste
   * ce qu'il était.
   */
  async function lireFichier(fichier: File, seance?: string) {
    setLectureFichier(true)
    setRefusFichier(null)
    try {
      const lu = await texteDuFichier(fichier, { locale, onProgressionPdf: setPdf, onProgressionAudio: setAudio })
      if ('refus' in lu) { setRefusFichier(lu.refus); return }
      setTexte(lu.texte)
      analyser(lu.texte, seance ?? t.avance.import.sessionDefaultFichier(fichier.name, formatDate(locale, date)))
    } finally {
      setLectureFichier(false)
      setPdf(null)
      setAudio(null)
      if (fichierRef.current) fichierRef.current.value = ''
    }
  }

  /**
   * Le serveur va chercher le document et le rend tel quel ; il devient un
   * `File` nommé par l'en-tête `X-Import-Nom`, et suit la voie d'un fichier
   * choisi — une seule extraction. Un refus de la route porte son code, que
   * le dictionnaire traduit.
   */
  async function lireLien() {
    const adresse = lien.trim()
    if (!adresse) return
    setLectureLien(true)
    setRefusLien(null)
    setRefusFichier(null)
    try {
      const reponse = await fetch('/api/import/lien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: adresse }),
      })
      if (!reponse.ok) {
        const code = reponse.status === 403 ? 'acces' : ((await reponse.json().catch(() => ({})))?.error ?? 'inaccessible')
        setRefusLien(code in t.avance.import.linkRefus ? (code as keyof typeof t.avance.import.linkRefus) : 'inaccessible')
        return
      }
      const nom = decodeURIComponent(reponse.headers.get('X-Import-Nom') ?? 'page.html')
      const fichier = new File([await reponse.blob()], nom, { type: reponse.headers.get('Content-Type') ?? '' })
      await lireFichier(fichier, t.avance.import.sessionDefaultLien(nom, formatDate(locale, date)))
    } catch {
      setRefusLien('inaccessible')
    } finally {
      setLectureLien(false)
    }
  }

  function basculer(index: number) {
    setPropositions((prev) => prev?.map((p, i) => (i === index ? { ...p, retenue: !p.retenue } : p)) ?? null)
  }

  async function enregistrer() {
    if (retenues.length === 0 || !versionId) return
    setSaving(true)
    try {
      for (const r of retenues) {
        const passages = await getPassagesForRange(versionId, r.book, r)
        await addReading({
          date,
          book: r.book,
          chapterStart: r.chapterStart,
          chapterEnd: r.chapterEnd,
          verseStart: r.verseStart,
          verseEnd: r.verseEnd,
          passageText: passages.map((p) => p.text).join(' '),
          translationId: versionId,
          tags: [],
          contextId,
          sessionTitle: sessionTitle.trim(),
          notes: '',
        })
      }
      setEnregistrees(retenues.length)
      setPropositions(null)
      setRejets([])
      setTexte('')
    } finally {
      setSaving(false)
    }
  }

  /**
   * L'appareil s'ouvre directement (`capture`), une photo à la fois : sur iOS
   * l'appareil ne prend qu'une image par ouverture, et le `multiple` ne
   * valait que pour la galerie — le propriétaire l'a vu le 17 septembre 2026.
   * Le texte reconnu **s'ajoute** au champ, à la suite de ce qui s'y trouve ;
   * une page de plus est une photo de plus, et l'analyse suit à chaque ajout.
   * Une photo sans texte le dit, une lecture qui échoue aussi — le champ
   * reste ce qu'il était dans les deux cas.
   */
  async function lirePhoto(fichier: File) {
    setOcr(-1)
    setOcrMessage(null)
    setRefusFichier(null)
    try {
      const texteLu = await reconnaitreTexte(fichier, locale, (part) => setOcr(Math.round(part * 100)))
      if (!texteLu) { setOcrMessage('vide'); return }
      const cumul = texte.trim() ? `${texte.trim()}\n\n${texteLu}` : texteLu
      setTexte(cumul)
      analyser(cumul, sessionTitle || t.avance.import.sessionDefaultPhoto(formatDate(locale, date)))
    } catch {
      setOcrMessage('erreur')
    } finally {
      setOcr(null)
      if (photoRef.current) photoRef.current.value = ''
    }
  }

  const champ = 'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white'
  const occupe = lectureFichier || ocr !== null || lectureLien

  return (
    <section className="bg-[--surface] rounded-xl border border-[--border] p-5 sm:p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ClipboardPaste className="w-5 h-5 text-[--primary]" />
        {t.avance.import.title}
      </h2>
      <p className="text-sm text-[--text-secondary] mt-1 mb-4">{t.avance.import.hint}</p>

      <label htmlFor="import-texte" className="block text-sm font-medium mb-1">{t.avance.import.textLabel}</label>
      <textarea
        id="import-texte"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={5}
        placeholder={t.avance.import.textPlaceholder}
        className={`${champ} resize-y`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => analyser()}
          disabled={!texte.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[--primary] text-white font-medium disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {t.avance.import.analyse}
        </button>
        <input
          ref={fichierRef}
          type="file"
          className="sr-only"
          accept=".txt,.md,.csv,.tsv,.log,.html,.htm,.docx,.xlsx,.pptx,.odt,.ods,.odp,.epub,.fb2,.pdf,.mobi,.azw,.azw3,.mp3,.m4a,.wav,.ogg,.aac,.flac,text/*,audio/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void lireFichier(f) }}
        />
        <button
          type="button"
          onClick={() => fichierRef.current?.click()}
          disabled={occupe}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium disabled:opacity-50"
        >
          <FileUp className="w-4 h-4" />
          {t.avance.import.fileButton}
        </button>
        {/* `capture` : l'appareil s'ouvre directement, sans passer par la
            photothèque — demande du propriétaire du 17 septembre 2026. */}
        <input
          ref={photoRef}
          type="file"
          className="sr-only"
          accept="image/*"
          capture="environment"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void lirePhoto(f) }}
        />
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          disabled={occupe}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          {t.avance.import.photoButton}
        </button>
        {pdf && (
          <p className="text-sm text-[--text-secondary]" role="status" aria-live="polite">
            {pdf.ocr === undefined
              ? t.avance.import.pdfProgress(pdf.page, pdf.pages)
              : t.avance.import.pdfOcr(pdf.page, pdf.pages, Math.round(pdf.ocr * 100))}
          </p>
        )}
        {audio && (
          <p className="text-sm text-[--text-secondary]" role="status" aria-live="polite">
            {audio.etape === 'decodage'
              ? t.avance.import.audioDecoding
              : audio.etape === 'modele'
                ? t.avance.import.audioModel(Math.round(audio.part * 100))
                : t.avance.import.audioTranscribing}
          </p>
        )}
        {ocr !== null && (
          <p className="text-sm text-[--text-secondary]" role="status" aria-live="polite">
            {ocr < 0 ? t.avance.import.ocrLoading : t.avance.import.ocrProgress(ocr)}
          </p>
        )}
        {enregistrees !== null && (
          <p className="text-sm text-green-700 inline-flex items-center gap-1.5" role="status">
            <Check className="w-4 h-4" />
            {t.avance.import.saved(enregistrees)}
          </p>
        )}
      </div>
      <p className="text-xs text-[--text-secondary] mt-2">{t.avance.import.fileHint}</p>
      <p className="text-xs text-[--text-secondary] mt-1">{t.avance.import.photoHint}</p>

      <label htmlFor="import-lien" className="block text-sm font-medium mt-4 mb-1">{t.avance.import.linkLabel}</label>
      <div className="flex flex-wrap gap-2">
        <input
          id="import-lien"
          type="url"
          inputMode="url"
          value={lien}
          onChange={(e) => setLien(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void lireLien() } }}
          placeholder={t.avance.import.linkPlaceholder}
          className={`${champ} flex-1 min-w-[12rem]`}
        />
        <button
          type="button"
          onClick={() => void lireLien()}
          disabled={occupe || !lien.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium disabled:opacity-50"
        >
          <Link2 className="w-4 h-4" />
          {lectureLien ? t.avance.import.linkLoading : t.avance.import.linkButton}
        </button>
      </div>
      <p className="text-xs text-[--text-secondary] mt-1">{t.avance.import.linkHint}</p>
      {refusLien && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 inline-flex items-center gap-1.5" role="alert">
          <AlertTriangle className="w-4 h-4" />
          {t.avance.import.linkRefus[refusLien]}
        </p>
      )}
      {ocrMessage && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 inline-flex items-center gap-1.5" role="alert">
          <AlertTriangle className="w-4 h-4" />
          {ocrMessage === 'vide' ? t.avance.import.ocrEmpty : t.avance.import.ocrError}
        </p>
      )}
      {refusFichier && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 inline-flex items-center gap-1.5" role="alert">
          <AlertTriangle className="w-4 h-4" />
          {t.avance.import.fileRefus[refusFichier]}
        </p>
      )}

      {propositions !== null && (
        <div className="mt-6 space-y-5">
          <div>
            <h3 className="font-medium mb-2">
              {propositions.length > 0 ? t.avance.import.found(propositions.length) : t.avance.import.none}
            </h3>
            {propositions.length > 0 && (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {propositions.map((p, i) => {
                  const reference = ecrireReference(getBookName(p.book), p.book, p)
                  return (
                  <li key={`${p.book}-${p.chapterStart}-${p.verseStart}-${p.chapterEnd}-${p.verseEnd}`}>
                    <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.retenue}
                        onChange={() => basculer(i)}
                        aria-label={reference}
                        className="mt-1 h-4 w-4 accent-[--primary]"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">{reference}</span>
                        {/* Le fragment tel qu'écrit : c'est lui que le lecteur
                            compare à la référence lue, et c'est là qu'une
                            erreur d'OCR se verra. */}
                        <span className="block text-xs text-[--text-secondary] truncate">« {p.source} »</span>
                      </span>
                    </label>
                  </li>
                  )
                })}
              </ul>
            )}
          </div>

          {rejets.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {t.avance.import.rejected}
              </p>
              <ul className="mt-1.5 text-sm text-amber-900 space-y-0.5">
                {rejets.map((r, i) => (
                  <li key={i}>« {r.source} » — {t.avance.import.reasons[r.raison]}</li>
                ))}
              </ul>
            </div>
          )}

          {propositions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="import-date" className="block text-sm font-medium mb-1">{t.avance.import.date}</label>
                <input id="import-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={champ} />
              </div>
              <div>
                <label htmlFor="import-version" className="block text-sm font-medium mb-1">{t.avance.import.version}</label>
                <select id="import-version" value={versionId} onChange={(e) => setVersionId(e.target.value)} className={champ}>
                  {versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="import-context" className="block text-sm font-medium mb-1">{t.avance.import.context}</label>
                <ContextPicker
                  id="import-context"
                  contexts={contexts}
                  value={contextId}
                  onChange={setContextId}
                  onContextAdded={(c) => { setContexts((prev) => [...prev, c]); setContextId(c.id) }}
                />
              </div>
              <div>
                <label htmlFor="import-session" className="block text-sm font-medium mb-1">{t.avance.import.session}</label>
                <input id="import-session" type="text" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className={champ} />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={enregistrer}
                  disabled={saving || retenues.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[--primary] text-white font-medium disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving ? t.avance.import.saving : t.avance.import.save(retenues.length)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
