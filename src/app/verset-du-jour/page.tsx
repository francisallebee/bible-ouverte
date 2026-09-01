'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sun, Check, CalendarDays, Sparkles } from 'lucide-react'
import {
  seedIfNeeded, getAllReadings, getEnabledVersions, getSettings, updateSettings,
  recordSession, getSessions, addReading,
} from '@/lib/storage'
import type { BiblePassage, GameSession } from '@/lib/storage'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { textDirection } from '@/lib/i18n/locales'
import { rassemblerVersets } from '@/lib/quiz/matiere'
import { versetStable, degradeDe, jourLocal } from '@/lib/verset-du-jour/choix'

/**
 * Le contexte donné aux lectures nées d'ici.
 *
 * Sans lui, ces lectures s'accumuleraient sous « sans contexte » et fausseraient
 * la répartition — c'est la remarque déjà faite pour les plans.
 */
const CONTEXTE = 'bible'

export default function VersetDuJourPage() {
  const { t, locale } = useI18n()
  const getBookName = useBookName()

  const [chargement, setChargement] = useState(true)
  const [verset, setVerset] = useState<BiblePassage | null>(null)
  const [langueDuTexte, setLangueDuTexte] = useState('fr')
  const [versionId, setVersionId] = useState('')
  const [parties, setParties] = useState<GameSession[]>([])
  const [enregistrement, setEnregistrement] = useState(false)

  const jour = jourLocal()
  const dejaLu = parties.some((p) => p.createdAt.slice(0, 10) === jour)
  const reference = verset
    ? `${getBookName(verset.book)} ${verset.chapter}:${verset.verse}`
    : ''
  const decor = reference ? degradeDe(reference) : null

  useEffect(() => {
    (async () => {
      await seedIfNeeded()
      const [lectures, versions, reglages, jouees] = await Promise.all([
        getAllReadings(), getEnabledVersions(), getSettings(), getSessions('verset-du-jour'),
      ])
      setParties(jouees)

      const version = reglages?.defaultVersionId || versions[0]?.id
      if (version) {
        setVersionId(version)
        setLangueDuTexte(versions.find((v) => v.id === version)?.language ?? 'fr')
        // Le tirage se fait sur une matière triée — `versetStable` s'en charge —
        // mais surtout il ne se refait pas si le jour a déjà le sien : la
        // matière grandit à chaque lecture, marquer celle-ci « lu » comprise,
        // et le verset se déplaçait donc lui-même dans la journée.
        const versets = await rassemblerVersets({ lectures, versionId: version, alea: () => 0.5 })
        const { verset: choisi, aRetenir } = versetStable(versets, jour, reglages?.versetDuJour)
        setVerset(choisi)
        // N'écrire que lorsque le tirage a réellement eu lieu : la mémoire
        // vaut pour la journée, pas pour chaque ouverture de l'écran.
        if (aRetenir) await updateSettings({ versetDuJour: aRetenir })
      }
      setChargement(false)
    })()
    // `jour` ne change pas pendant une session d'écran ; le recalculer
    // ferait relire tout le cache à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function marquerLu() {
    if (!verset || dejaLu) return
    setEnregistrement(true)
    try {
      // Deux écritures, qui ne mesurent pas la même chose : la partie nourrit
      // les statistiques de cette page, la lecture entre dans celles de
      // l'application — c'est ce que demande « le verset du jour doit rentrer
      // dans les statistiques ».
      await addReading({
        date: jour,
        book: verset.book,
        chapterStart: verset.chapter,
        chapterEnd: verset.chapter,
        verseStart: verset.verse,
        verseEnd: verset.verse,
        passageText: verset.text,
        translationId: versionId,
        tags: [],
        contextId: CONTEXTE,
        // Une lecture isolée, qui n'appartient à aucune séance de saisie.
        sessionTitle: '',
        notes: t.versetDuJour.noteLecture,
      })
      const partie = await recordSession({
        kind: 'verset-du-jour',
        score: 1,
        total: 1,
        book: verset.book,
        chapter: verset.chapter,
        verse: verset.verse,
      })
      setParties((p) => [partie, ...p])
    } finally {
      setEnregistrement(false)
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-[--primary] border-t-transparent rounded-full" />
      </div>
    )
  }

  const joursLus = new Set(parties.map((p) => p.createdAt.slice(0, 10))).size

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500">
            <Sun className="w-5 h-5 text-white" />
          </span>
          {t.versetDuJour.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">{t.versetDuJour.subtitle}</p>
      </div>

      {!verset ? (
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center">
          <p className="text-[--text] font-medium mb-1">{t.versetDuJour.pasDeVerset}</p>
          <p className="text-sm text-[--text-secondary] mb-4">{t.versetDuJour.pasDeVersetAide}</p>
          <Link href="/new-reading" className="text-[--primary] underline text-sm">
            {t.nav.newReading}
          </Link>
        </div>
      ) : (
        <>
          {/* Le décor se déduit de la référence : le même verset donne toujours
              le même fond, et aucun fichier n'est téléchargé. */}
          <div className="rounded-3xl p-8 sm:p-10 text-white shadow-lg"
            style={{ backgroundImage: decor!.css }}>
            <p className="text-white/70 text-xs uppercase tracking-widest mb-4">
              {t.versetDuJour.duJour}
            </p>
            <p className="texte-biblique text-xl sm:text-2xl leading-relaxed"
              dir={textDirection(langueDuTexte)}>
              {verset.text}
            </p>
            <p className="mt-5 font-medium text-white/90">{reference}</p>
          </div>

          <div className="mt-4">
            {dejaLu ? (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <Check className="w-4 h-4" />
                {t.versetDuJour.dejaLu}
              </p>
            ) : (
              <>
                <button onClick={marquerLu} disabled={enregistrement}
                  className="w-full bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] disabled:opacity-60 transition-colors">
                  {enregistrement ? t.versetDuJour.enregistrement : t.versetDuJour.marquerLu}
                </button>
                <p className="text-xs text-[--text-secondary] text-center mt-2">
                  {t.versetDuJour.ajouteAuxLectures}
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
                <CalendarDays className="w-4 h-4" />
              </span>
              <p className="text-2xl font-bold text-[--text]">{joursLus}</p>
              <p className="text-xs text-[--text-secondary]">{t.versetDuJour.statJours}</p>
            </div>
            <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-2">
                <Sparkles className="w-4 h-4" />
              </span>
              <p className="text-2xl font-bold text-[--text]">{parties.length}</p>
              <p className="text-xs text-[--text-secondary]">{t.versetDuJour.statTotal}</p>
            </div>
          </div>

          <p className="text-xs text-[--text-secondary] text-center mt-6">
            {t.versetDuJour.prochainDemain(new Date().toLocaleDateString(locale))}
          </p>
        </>
      )}
    </div>
  )
}
