'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Eye, Check, Plus, Trash2, Shuffle, CalendarClock } from 'lucide-react'
import {
  seedIfNeeded, getAllReadings, getEnabledVersions, getSettings,
  getMemorised, addMemorised, updateMemorised, removeMemorised, recordSession,
} from '@/lib/storage'
import type { BiblePassage, MemorisedVerse } from '@/lib/storage'
import { getPassagesForRange } from '@/lib/storage/passage-store'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { textDirection } from '@/lib/i18n/locales'
import { rassemblerVersets } from '@/lib/quiz/matiere'
import { jourLocal } from '@/lib/verset-du-jour/choix'
import {
  masquerMots, partMasquee, prochainEtat, reussiteDe, estDu, NIVEAU_MAX,
  type MotMasque,
} from '@/lib/memorisation/revision'

type Etape = 'chargement' | 'liste' | 'seance' | 'bilan'

export default function MemorisationPage() {
  const { t, locale } = useI18n()
  const getBookName = useBookName()
  const jour = jourLocal()

  const [etape, setEtape] = useState<Etape>('chargement')
  const [suivis, setSuivis] = useState<MemorisedVerse[]>([])
  const [versionId, setVersionId] = useState('')
  const [langue, setLangue] = useState('fr')
  const [candidats, setCandidats] = useState<BiblePassage[]>([])
  const [occupe, setOccupe] = useState(false)

  /* séance en cours */
  const [encours, setEncours] = useState<MemorisedVerse | null>(null)
  const [mots, setMots] = useState<MotMasque[]>([])
  const [reveles, setReveles] = useState<Set<number>>(new Set())
  const [bilan, setBilan] = useState<{ reussite: number; monte: boolean; prochain: string } | null>(null)
  /** Une séance qui ne compte pas : voir `commencer`. */
  const [entrainement, setEntrainement] = useState(false)

  const dus = suivis.filter((v) => estDu(v, jour))
  /** Zéro au niveau 0 : le module ne masque rien au premier passage. */
  const masques = mots.filter((m) => m.masque).length

  useEffect(() => {
    (async () => {
      await seedIfNeeded()
      const [lectures, versions, reglages, memorises] = await Promise.all([
        getAllReadings(), getEnabledVersions(), getSettings(), getMemorised(),
      ])
      setSuivis(memorises)
      const version = reglages?.defaultVersionId || versions[0]?.id
      if (version) {
        setVersionId(version)
        setLangue(versions.find((v) => v.id === version)?.language ?? 'fr')
        setCandidats(await rassemblerVersets({ lectures, versionId: version, alea: Math.random }))
      }
      setEtape('liste')
    })()
  }, [])

  async function ajouter(p: BiblePassage) {
    setOccupe(true)
    try {
      // Échéance du jour : un verset qu'on vient d'ajouter se travaille tout de
      // suite, il n'y a rien à attendre d'un premier rappel repoussé.
      const ajoute = await addMemorised({
        book: p.book, chapter: p.chapter, verse: p.verse, versionId, prochain: jour,
      })
      if (ajoute) setSuivis(await getMemorised())
    } finally {
      setOccupe(false)
    }
  }

  async function ajouterAuHasard() {
    const libres = candidats.filter((p) => !suivis.some(
      (v) => v.book === p.book && v.chapter === p.chapter && v.verse === p.verse,
    ))
    if (libres.length === 0) return
    await ajouter(libres[Math.floor(Math.random() * libres.length)])
  }

  /**
   * Ouvre une séance, réelle ou libre.
   *
   * **L'entraînement libre n'écrit rien** — ni niveau, ni échéance, ni séance
   * dans les statistiques. C'est tout son sens : la révision espacée ne vaut
   * que par ses intervalles, et s'exercer trois fois dans la journée ne doit
   * pas rapprocher ni éloigner le prochain rappel.
   *
   * Il force **au moins un cran de masquage**. Au niveau 0 le module ne cache
   * rien — on lit le verset, on ne le devine pas —, ce qui est juste pour un
   * premier passage et vide de sens pour un entraînement demandé exprès.
   */
  async function commencer(v: MemorisedVerse, libre = false) {
    const passages = await getPassagesForRange(v.versionId, v.book, {
      chapterStart: v.chapter, chapterEnd: v.chapter, verseStart: v.verse, verseEnd: v.verse,
    })
    const texte = passages[0]?.text
    if (!texte) return
    const niveau = libre ? Math.max(1, v.niveau) : v.niveau
    // Le tirage est ensemencé par la référence et le niveau : recommencer une
    // séance repose les mêmes trous, ce qui permet de s'y reprendre.
    let graine = `${v.book}${v.chapter}${v.verse}${niveau}`.length * 7919
    const alea = () => {
      graine = (graine * 1103515245 + 12345) % 2147483648
      return graine / 2147483648
    }
    setEncours(v)
    setEntrainement(libre)
    setMots(masquerMots(texte, partMasquee(niveau), alea))
    setReveles(new Set())
    setEtape('seance')
  }

  async function terminer() {
    if (!encours) return
    const reussite = reussiteDe(masques, reveles.size)

    if (entrainement) {
      // Rien n'est écrit, pas même `recordSession` : une séance libre qui
      // gonflerait les statistiques ferait mentir la courbe de progression.
      setBilan({ reussite, monte: false, prochain: encours.prochain })
      setEtape('bilan')
      return
    }

    const suivant = prochainEtat({ niveau: encours.niveau, prochain: encours.prochain }, reussite, jour)

    const misAJour = await updateMemorised(encours, suivant.niveau, suivant.prochain)
    await recordSession({
      kind: 'memorisation',
      score: masques - reveles.size,
      total: masques,
      book: encours.book, chapter: encours.chapter, verse: encours.verse,
      details: { niveau: suivant.niveau, indices: reveles.size },
    })
    setSuivis((liste) => liste.map((v) => (v.id === misAJour.id ? misAJour : v)))
    setBilan({ reussite, monte: suivant.niveau > encours.niveau, prochain: suivant.prochain })
    setEtape('bilan')
  }

  async function retirer(v: MemorisedVerse) {
    await removeMemorised(v)
    setSuivis((liste) => liste.filter((x) => x.id !== v.id))
  }

  if (etape === 'chargement') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[--primary] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500">
            <Brain className="w-5 h-5 text-white" />
          </span>
          {t.memorisation.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">{t.memorisation.subtitle}</p>
      </div>

      {etape === 'liste' && (
        <>
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg mb-6">
            <p className="text-3xl font-bold">{dus.length}</p>
            <p className="text-white/85 text-sm mt-1">{t.memorisation.aRevoir}</p>
            <button onClick={ajouterAuHasard} disabled={occupe || candidats.length === 0}
              className="mt-4 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Shuffle className="w-4 h-4" />
              {t.memorisation.ajouterHasard}
            </button>
          </div>

          {suivis.length === 0 ? (
            <div className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center">
              <p className="text-[--text] font-medium mb-1">{t.memorisation.aucun}</p>
              <p className="text-sm text-[--text-secondary] mb-4">{t.memorisation.aucunAide}</p>
              <Link href="/new-reading" className="text-[--primary] underline text-sm">
                {t.nav.newReading}
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {suivis.map((v) => {
                const du = estDu(v, jour)
                return (
                  <div key={v.id} className="flex items-center gap-3 rounded-xl border border-[--border] bg-[--surface] px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[--text] truncate">
                        {getBookName(v.book)} {v.chapter}:{v.verse}
                      </p>
                      <p className="text-xs text-[--text-secondary] flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {du ? t.memorisation.duAujourdhui : t.memorisation.revoirLe(v.prochain)}
                        {' · '}
                        {t.memorisation.niveau(v.niveau, NIVEAU_MAX)}
                      </p>
                    </div>
                    <button onClick={() => commencer(v)} disabled={!du}
                      className="shrink-0 bg-[--primary] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-40 transition-colors">
                      {t.memorisation.reviser}
                    </button>
                    {/*
                      Toujours actif, y compris quand le verset n'est pas dû :
                      c'est précisément ce qu'il apporte. Sans lui, un verset
                      ajouté aujourd'hui ne s'exerce qu'à partir de demain.
                    */}
                    <button onClick={() => commencer(v, true)}
                      className="shrink-0 border border-[--border] text-[--text-secondary] px-3 py-1.5 rounded-lg text-sm hover:border-[--primary] hover:text-[--primary] transition-colors">
                      {t.memorisation.sentrainer}
                    </button>
                    <button onClick={() => retirer(v)} aria-label={t.memorisation.retirer}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {candidats.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-[--text-secondary] uppercase tracking-wide mb-3">
                {t.memorisation.choisir}
              </h2>
              <div className="space-y-2">
                {candidats.slice(0, 6).map((p) => (
                  <button key={`${p.book}-${p.chapter}-${p.verse}`} onClick={() => ajouter(p)} disabled={occupe}
                    className="w-full text-start rounded-xl border border-[--border] bg-[--surface] px-4 py-3 hover:border-[--primary] disabled:opacity-50 transition-colors">
                    <span className="flex items-center gap-2 text-xs font-medium text-[--primary] mb-1">
                      <Plus className="w-3.5 h-3.5" />
                      {getBookName(p.book)} {p.chapter}:{p.verse}
                    </span>
                    <span className="texte-biblique block text-sm text-[--text] line-clamp-2" dir={textDirection(langue)}>
                      {p.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {etape === 'seance' && encours && (
        <div>
          <p className="text-sm text-[--text-secondary] mb-1">
            {getBookName(encours.book)} {encours.chapter}:{encours.verse}
          </p>
          <p className="text-xs text-[--text-secondary] mb-4">
            {t.memorisation.consigne(reveles.size, masques)}
          </p>

          <div className="texte-biblique rounded-2xl border border-[--border] bg-[--surface] p-5 leading-loose text-[--text]"
            dir={textDirection(langue)}>
            {mots.map((m, i) => {
              const cache = m.masque && !reveles.has(i)
              if (!cache) {
                return <span key={i} className={m.masque ? 'text-[--primary] font-medium' : ''}>{m.mot}{' '}</span>
              }
              return (
                <button key={i} onClick={() => setReveles((r) => new Set(r).add(i))}
                  aria-label={t.memorisation.reveler}
                  className="inline-flex items-center align-baseline rounded bg-[--primary-light] text-[--primary] px-2 mx-0.5 hover:brightness-95 transition">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="ms-1">{'·'.repeat(Math.min(8, m.mot.length))}</span>
                </button>
              )
            })}
          </div>

          <button onClick={terminer}
            className="w-full mt-4 bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] transition-colors">
            {t.memorisation.terminer}
          </button>
        </div>
      )}

      {etape === 'bilan' && bilan && (
        <div className="rounded-2xl p-8 text-center text-white bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg">
          <Check className="w-10 h-10 mx-auto mb-3" />
          <p className="text-4xl font-bold">{Math.round(bilan.reussite * 100)} %</p>
          <p className="mt-3 text-lg font-medium">
            {entrainement
              ? t.memorisation.entrainementBilan
              : bilan.monte ? t.memorisation.monte : t.memorisation.reste}
          </p>
          <p className="mt-1 text-white/85 text-sm">
            {entrainement
              ? t.memorisation.entrainementSansEffet
              : t.memorisation.prochaine(formatDate(locale, bilan.prochain, { weekday: 'long', day: 'numeric', month: 'long' }))}
          </p>
          <button onClick={() => setEtape('liste')}
            className="mt-6 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {t.memorisation.retour}
          </button>
        </div>
      )}
    </div>
  )
}
