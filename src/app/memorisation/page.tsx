'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Eye, Check, Plus, Trash2, Shuffle, CalendarClock, AlertCircle } from 'lucide-react'
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
  masquerMots, partMasquee, prochainEtat, reussiteDe, estDu, memeIntervalle, texteDe, NIVEAU_MAX,
  type MotMasque, type Intervalle,
} from '@/lib/memorisation/revision'
import PassageAdder, { type PassageDraft } from '@/components/PassageAdder'
import { describeRange } from '@/components/PassagePicker'

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
  /** Ce que l'écran a à dire sans l'interrompre — un texte absent du cache. */
  const [avis, setAvis] = useState<string | null>(null)

  /* séance en cours */
  const [encours, setEncours] = useState<MemorisedVerse | null>(null)
  const [mots, setMots] = useState<MotMasque[]>([])
  const [reveles, setReveles] = useState<Set<number>>(new Set())
  const [bilan, setBilan] = useState<{ reussite: number; monte: boolean; prochain: string } | null>(null)
  /** Une séance qui ne compte pas : voir `commencer`. */
  const [entrainement, setEntrainement] = useState(false)

  const dus = suivis.filter((v) => estDu(v, jour))
  /** « Jean 3:16 », ou « Jean 3:16-18 » : la même écriture que partout ailleurs. */
  const reference = (v: Intervalle) => describeRange(getBookName(v.book), v.book, {
    chapterStart: v.chapter, chapterEnd: v.chapterEnd, verseStart: v.verse, verseEnd: v.verseEnd,
  })
  const seul = (p: BiblePassage): Intervalle => ({
    book: p.book, chapter: p.chapter, verse: p.verse, chapterEnd: p.chapter, verseEnd: p.verse,
  })
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

  async function ajouter(i: Intervalle) {
    setOccupe(true)
    setAvis(null)
    try {
      // Échéance du jour : un passage qu'on vient d'ajouter se travaille tout
      // de suite, il n'y a rien à attendre d'un premier rappel repoussé.
      const ajoute = await addMemorised({ ...i, versionId, prochain: jour })
      if (ajoute) setSuivis(await getMemorised())
    } finally {
      setOccupe(false)
    }
  }

  async function ajouterAuHasard() {
    const libres = candidats.filter((p) => !suivis.some((v) => memeIntervalle(v, seul(p))))
    if (libres.length === 0) return
    await ajouter(seul(libres[Math.floor(Math.random() * libres.length)]))
  }

  /**
   * Le passage choisi avec le sélecteur commun — un verset ou un groupe.
   * `PassageAdder` parle en `chapterStart`/`verseStart`, la table en
   * `chapter`/`verse` : c'est ici que les deux vocabulaires se rejoignent.
   */
  async function ajouterChoisi(d: PassageDraft) {
    await ajouter({
      book: d.book, chapter: d.chapterStart, verse: d.verseStart,
      chapterEnd: d.chapterEnd, verseEnd: d.verseEnd,
    })
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
      chapterStart: v.chapter, chapterEnd: v.chapterEnd, verseStart: v.verse, verseEnd: v.verseEnd,
    })
    // Un groupe de versets s'apprend comme un seul texte, numéros exclus.
    const texte = texteDe(passages)
    if (!texte) {
      // Le texte n'est pas sur l'appareil — la traduction n'est plus active.
      // Le dire plutôt que de ne rien faire : un bouton muet passe pour cassé.
      setAvis(t.memorisation.texteIndisponible)
      return
    }
    const niveau = libre ? Math.max(1, v.niveau) : v.niveau
    // Le tirage est ensemencé par la référence et le niveau : recommencer une
    // séance repose les mêmes trous, ce qui permet de s'y reprendre.
    let graine = `${v.book}${v.chapter}${v.verse}${v.chapterEnd}${v.verseEnd}${niveau}`.length * 7919
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
      // La fin de l'intervalle va dans `details` : `game_sessions` ne porte
      // qu'un verset, et un groupe est ce qui lui est propre.
      details: {
        niveau: suivant.niveau, indices: reveles.size,
        chapterEnd: encours.chapterEnd, verseEnd: encours.verseEnd,
      },
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
          {/* Même famille que le bouton de Quizz, et même remède, mesuré le
              16 septembre 2026 : le blanc tenait 2,54 sur le premier arrêt de
              l'ancien dégradé — celui qui passe par l'émeraude, le teal et le
              cyan de rang 500 —, 2,21 pour l'aide à 85 %, et le voile blanc du
              bouton l'abaissait encore (2,22 au repos, 2,03 au survol). Ici le
              petit texte est au coin du premier arrêt, donc un cran de 600
              (3,77) n'aurait pas suffi : les trois arrêts passent au rang 700,
              5,36 à 5,48 pour du blanc opaque en tout point, et le voile est
              noir — il fonce le fond sous du texte blanc au lieu de
              l'éclaircir. L'aide est opaque, comme sur Quizz. Les anciennes
              classes ne sont pas nommées : Tailwind lit un commentaire. */}
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 shadow-lg mb-6">
            <p className="text-3xl font-bold">{dus.length}</p>
            <p className="text-sm mt-1">{t.memorisation.aRevoir}</p>
            <button onClick={ajouterAuHasard} disabled={occupe || candidats.length === 0}
              className="mt-4 inline-flex items-center gap-2 bg-black/15 hover:bg-black/25 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Shuffle className="w-4 h-4" />
              {t.memorisation.ajouterHasard}
            </button>
          </div>

          {/* Le sélecteur commun de l'application — livre, puis chapitres et
              versets dans la même fenêtre que Nouvelle lecture, Recherche et
              les plans. Un verset ou un groupe : la table porte l'intervalle
              depuis le 15 septembre 2026. */}
          <div className="mb-6">
            <PassageAdder versionId={versionId} onAdd={ajouterChoisi}
              title={t.memorisation.choisirPassage}
              submitLabel={t.memorisation.mettreEnApprentissage} />
          </div>

          {avis && (
            <p role="status" className="flex items-start gap-2 text-sm text-[--text-secondary] mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {avis}
            </p>
          )}

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
                        {reference(v)}
                      </p>
                      <p className="text-xs text-[--text-secondary] flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {/* La date passe par `Intl`, comme celle du bilan : la ligne
                            écrivait « 2026-09-17 » tel quel, ce qu'on ne voit qu'une fois
                            un passage révisé — vu le 16 septembre 2026, à la première
                            séance réelle sur un groupe. */}
                        {du ? t.memorisation.duAujourdhui
                          : t.memorisation.revoirLe(formatDate(locale, v.prochain, { day: 'numeric', month: 'long' }))}
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
                  <button key={`${p.book}-${p.chapter}-${p.verse}`} onClick={() => ajouter(seul(p))} disabled={occupe}
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
            {reference(encours)}
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
        <div className="rounded-2xl p-8 text-center text-white bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 shadow-lg">
          <Check className="w-10 h-10 mx-auto mb-3" />
          <p className="text-4xl font-bold">{Math.round(bilan.reussite * 100)} %</p>
          <p className="mt-3 text-lg font-medium">
            {entrainement
              ? t.memorisation.entrainementBilan
              : bilan.monte ? t.memorisation.monte : t.memorisation.reste}
          </p>
          <p className="mt-1 text-sm">
            {entrainement
              ? t.memorisation.entrainementSansEffet
              : t.memorisation.prochaine(formatDate(locale, bilan.prochain, { weekday: 'long', day: 'numeric', month: 'long' }))}
          </p>
          <button onClick={() => setEtape('liste')}
            className="mt-6 inline-flex items-center gap-2 bg-black/15 hover:bg-black/25 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            {t.memorisation.retour}
          </button>
        </div>
      )}
    </div>
  )
}
