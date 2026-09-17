'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardPaste, Check, AlertTriangle, Sparkles, FileUp } from 'lucide-react'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import {
  seedIfNeeded, getEnabledVersions, getAllContexts, getSettings, getPassagesForRange, addReading,
} from '@/lib/storage'
import type { BibleVersion, ReadingContext } from '@/lib/storage'
import { extraireReferences, type ReferenceExtraite, type RejetExtraction } from '@/lib/import/references'
import { texteDuFichier, type RaisonRefus } from '@/lib/import/fichiers'
import { ecrireReference } from '@/lib/lectures/reference'
import { aujourdhui } from '@/lib/objectifs/objectifs'
import { formatDate } from '@/lib/i18n/format'
import ContextPicker from '@/components/ContextPicker'

/**
 * L'import de lectures — le presse-papier, puis les fichiers.
 *
 * Un texte collé — ou extrait d'un fichier par `texteDuFichier`, dans le
 * navigateur, et déposé dans le même champ pour que le lecteur voie ce qui a
 * été lu — passe par `extraireReferences`, et chaque référence reconnue
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
  const fichierRef = useRef<HTMLInputElement>(null)

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
  async function lireFichier(fichier: File) {
    setLectureFichier(true)
    setRefusFichier(null)
    try {
      const lu = await texteDuFichier(fichier)
      if ('refus' in lu) { setRefusFichier(lu.refus); return }
      setTexte(lu.texte)
      analyser(lu.texte, t.avance.import.sessionDefaultFichier(fichier.name, formatDate(locale, date)))
    } finally {
      setLectureFichier(false)
      if (fichierRef.current) fichierRef.current.value = ''
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

  const champ = 'w-full border border-gray-300 rounded-lg px-3 py-2 bg-white'

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
          accept=".txt,.md,.csv,.tsv,.log,.html,.htm,.docx,.xlsx,.pptx,.odt,.ods,.odp,.pdf,text/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void lireFichier(f) }}
        />
        <button
          type="button"
          onClick={() => fichierRef.current?.click()}
          disabled={lectureFichier}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white font-medium disabled:opacity-50"
        >
          <FileUp className="w-4 h-4" />
          {t.avance.import.fileButton}
        </button>
        {enregistrees !== null && (
          <p className="text-sm text-green-700 inline-flex items-center gap-1.5" role="status">
            <Check className="w-4 h-4" />
            {t.avance.import.saved(enregistrees)}
          </p>
        )}
      </div>
      <p className="text-xs text-[--text-secondary] mt-2">{t.avance.import.fileHint}</p>
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
