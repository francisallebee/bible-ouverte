'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Check, X, RotateCcw, Trophy, Flame, Target, CalendarDays } from 'lucide-react'
import {
  seedIfNeeded, getAllReadings, getEnabledVersions, getSettings,
  recordSession, getSessions, computeStats,
} from '@/lib/storage'
import type { GameSession } from '@/lib/storage'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { construireQuiz, type QuizQuestion } from '@/lib/quiz/questions'
import { rassemblerVersets } from '@/lib/quiz/matiere'

const NOMBRE_DE_QUESTIONS = 10

/** Assez de lectures pour que les leurres ne soient pas évidents. */
const LECTURES_MINIMUM = 4

type Etape = 'chargement' | 'accueil' | 'jeu' | 'resultat' | 'faute-de-matiere'

export default function QuizPage() {
  const { t } = useI18n()
  const getBookName = useBookName()

  const [etape, setEtape] = useState<Etape>('chargement')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [choisi, setChoisi] = useState<number | null>(null)
  const [bonnes, setBonnes] = useState(0)
  const [parties, setParties] = useState<GameSession[]>([])
  const [prepare, setPrepare] = useState(false)

  const stats = computeStats(parties)

  useEffect(() => {
    (async () => {
      await seedIfNeeded()
      setParties(await getSessions('quiz'))
      setEtape('accueil')
    })()
  }, [])

  async function commencer() {
    setPrepare(true)
    try {
      const [lectures, versions, reglages] = await Promise.all([
        getAllReadings(), getEnabledVersions(), getSettings(),
      ])
      const versionId = reglages?.defaultVersionId || versions[0]?.id
      if (!versionId || lectures.length < LECTURES_MINIMUM) {
        setEtape('faute-de-matiere')
        return
      }

      const versets = await rassemblerVersets({ lectures, versionId, alea: Math.random })
      const quiz = construireQuiz({
        versets, nomDuLivre: getBookName, alea: Math.random, nombre: NOMBRE_DE_QUESTIONS,
      })

      if (quiz.length === 0) {
        setEtape('faute-de-matiere')
        return
      }
      setQuestions(quiz)
      setIndex(0)
      setChoisi(null)
      setBonnes(0)
      setEtape('jeu')
    } finally {
      setPrepare(false)
    }
  }

  function repondre(i: number) {
    if (choisi !== null) return
    setChoisi(i)
    if (i === questions[index].bonne) setBonnes((n) => n + 1)
  }

  async function suivante() {
    if (index + 1 < questions.length) {
      setIndex((n) => n + 1)
      setChoisi(null)
      return
    }
    // La partie n'est enregistrée qu'une fois terminée : abandonner en cours de
    // route ne doit pas peser sur les statistiques comme un échec.
    const enregistree = await recordSession({
      kind: 'quiz',
      score: bonnes,
      total: questions.length,
      details: { genres: questions.map((q) => q.kind) },
    })
    setParties((p) => [enregistree, ...p])
    setEtape('resultat')
  }

  /** Le mot d'encouragement suit le résultat, sans jamais railler. */
  function encouragement(pourcent: number): string {
    if (pourcent === 100) return t.quiz.bravoParfait
    if (pourcent >= 70) return t.quiz.bravoBien
    if (pourcent >= 40) return t.quiz.bravoMoyen
    return t.quiz.bravoDebut
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
          <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="w-5 h-5 text-white" />
          </span>
          {t.quiz.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">{t.quiz.subtitle}</p>
      </div>

      {etape === 'faute-de-matiere' && (
        <div className="rounded-2xl border border-[--border] bg-[--surface] p-8 text-center">
          <p className="text-[--text] font-medium mb-1">{t.quiz.pasAssez}</p>
          <p className="text-sm text-[--text-secondary] mb-4">{t.quiz.pasAssezAide}</p>
          <Link href="/new-reading" className="text-[--primary] underline text-sm">
            {t.nav.newReading}
          </Link>
        </div>
      )}

      {etape === 'accueil' && (
        <>
          <button onClick={commencer} disabled={prepare}
            className="w-full rounded-2xl p-6 text-white text-start bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 shadow-lg hover:brightness-105 disabled:opacity-70 transition-all active:scale-[0.99]">
            <p className="text-lg font-semibold">{prepare ? t.quiz.preparation : t.quiz.commencer}</p>
            <p className="text-white/80 text-sm mt-1">{t.quiz.commencerAide(NOMBRE_DE_QUESTIONS)}</p>
          </button>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <Carte icon={<Trophy className="w-4 h-4" />} libelle={t.quiz.statParties} valeur={String(stats.parties)} teinte="from-amber-400 to-orange-500" />
            <Carte icon={<Target className="w-4 h-4" />} libelle={t.quiz.statReussite} valeur={`${stats.reussite} %`} teinte="from-emerald-400 to-teal-500" />
            <Carte icon={<Flame className="w-4 h-4" />} libelle={t.quiz.statMeilleur} valeur={`${stats.meilleur} %`} teinte="from-rose-400 to-pink-500" />
            <Carte icon={<CalendarDays className="w-4 h-4" />} libelle={t.quiz.statJours} valeur={String(stats.jours)} teinte="from-sky-400 to-indigo-500" />
          </div>
        </>
      )}

      {etape === 'jeu' && questions[index] && (
        <div>
          <div className="flex items-center justify-between text-sm text-[--text-secondary] mb-2">
            <span>{t.quiz.progression(index + 1, questions.length)}</span>
            <span>{t.quiz.bonnes(bonnes)}</span>
          </div>
          <div className="h-2 rounded-full bg-[--border] overflow-hidden mb-6">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${((index + (choisi !== null ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>

          <div className="rounded-2xl border border-[--border] bg-[--surface] p-5 mb-4 shadow-[--shadow]">
            <p className="text-xs font-medium uppercase tracking-wide text-[--primary] mb-2">
              {questions[index].kind === 'chapitre'
                ? t.quiz.consigneChapitre(getBookName(questions[index].source.book))
                : t.quiz.consignes[questions[index].kind]}
            </p>
            <p className="texte-biblique text-[--text] leading-relaxed">{questions[index].enonce}</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {questions[index].choix.map((choix, i) => {
              const juste = i === questions[index].bonne
              const repondu = choisi !== null
              return (
                <button key={`${choix}-${i}`} onClick={() => repondre(i)} disabled={repondu}
                  className={`w-full text-start px-4 py-3 rounded-xl border transition-all ${
                    !repondu
                      ? 'border-[--border] bg-[--surface] hover:border-[--primary] hover:scale-[1.01]'
                      : juste
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                        : i === choisi
                          ? 'border-rose-300 bg-rose-50 text-rose-900'
                          : 'border-[--border] bg-[--surface] opacity-50'
                  }`}>
                  <span className="flex items-center justify-between gap-3">
                    <span>{choix}</span>
                    {repondu && juste && <Check className="w-4 h-4 shrink-0" />}
                    {repondu && !juste && i === choisi && <X className="w-4 h-4 shrink-0" />}
                  </span>
                </button>
              )
            })}
          </div>

          {choisi !== null && (
            <div className="mt-4">
              <p className="text-sm text-[--text-secondary] mb-3">
                {t.quiz.cetaitDans(
                  `${getBookName(questions[index].source.book)} ${questions[index].source.chapter}:${questions[index].source.verse}`,
                )}
              </p>
              <button onClick={suivante}
                className="w-full bg-[--primary] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[--primary-hover] transition-colors">
                {index + 1 < questions.length ? t.quiz.suivante : t.quiz.terminer}
              </button>
            </div>
          )}
        </div>
      )}

      {etape === 'resultat' && (
        <div className="rounded-2xl p-8 text-center text-white bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 shadow-lg">
          <p className="text-5xl font-bold">{Math.round((bonnes / questions.length) * 100)} %</p>
          <p className="mt-1 text-white/90">{t.quiz.resultat(bonnes, questions.length)}</p>
          <p className="mt-4 text-lg font-medium">{encouragement(Math.round((bonnes / questions.length) * 100))}</p>
          <button onClick={commencer} disabled={prepare}
            className="mt-6 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <RotateCcw className="w-4 h-4" />
            {t.quiz.rejouer}
          </button>
        </div>
      )}
    </div>
  )
}

function Carte({ icon, libelle, valeur, teinte }: {
  icon: React.ReactNode; libelle: string; valeur: string; teinte: string
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-gradient-to-br ${teinte} mb-2`}>
        {icon}
      </span>
      <p className="text-2xl font-bold text-[--text]">{valeur}</p>
      <p className="text-xs text-[--text-secondary]">{libelle}</p>
    </div>
  )
}
