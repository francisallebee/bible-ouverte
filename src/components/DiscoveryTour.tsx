'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Bell, BookOpen, BookPlus, Check, CloudOff, Compass, Heart, History,
  MessageCircle, Route, Search, Settings, Shield, Tags, Trophy, User, X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getSettings, updateSettings } from '@/lib/storage'
import {
  TOUR_START, clampIndex, hrefToVisit, isLastStep, shouldStartTour, visibleSteps,
} from '@/lib/tour'
import type { TourIcon } from '@/lib/tour'

/**
 * Le parcours découverte, présenté par-dessus l'application réelle.
 *
 * Chaque étape ouvre l'écran dont elle parle : on lit l'explication en ayant
 * l'écran sous les yeux, et non une capture qui vieillirait. C'est aussi ce qui
 * évite d'entretenir des illustrations en double.
 *
 * La règle — quand il se déclenche, ce qu'il montre à qui, où il mène — vit
 * dans `lib/tour.ts` et y est couverte par des tests. Ce fichier ne fait que
 * l'afficher.
 */

/** Le nom d'icône de `lib/tour.ts` rejoint ici son composant. */
const ICONES: Record<TourIcon, React.ComponentType<{ className?: string }>> = {
  compass: Compass,
  'book-plus': BookPlus,
  tags: Tags,
  'book-open': BookOpen,
  search: Search,
  trophy: Trophy,
  history: History,
  chart: BarChart3,
  settings: Settings,
  bell: Bell,
  'cloud-off': CloudOff,
  route: Route,
  message: MessageCircle,
  heart: Heart,
  user: User,
  shield: Shield,
  check: Check,
}

export default function DiscoveryTour() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const [ouvert, setOuvert] = useState(false)
  const [indice, setIndice] = useState(0)
  const carte = useRef<HTMLDivElement>(null)

  // Mémoïsé : `visibleSteps` rend un tableau neuf à chaque appel, ce qui
  // relancerait l'effet de navigation à chaque rendu — et pousserait deux fois
  // la même route avant que `pathname` ait eu le temps de se mettre à jour.
  const etapes = useMemo(() => visibleSteps(isAdmin === true), [isAdmin])
  const etape = etapes[clampIndex(etapes, indice)]
  const derniere = isLastStep(etapes, indice)

  // Déclenchement automatique, une seule fois par compte. Le drapeau de session
  // empêche une seconde ouverture si les réglages sont rechargés entre-temps —
  // ce que fait `AppShell` à chaque changement de réglage.
  const dejaTente = useRef(false)
  useEffect(() => {
    if (dejaTente.current) return
    let annule = false
    ;(async () => {
      const reglages = await getSettings()
      if (annule || dejaTente.current) return
      dejaTente.current = true
      if (shouldStartTour(reglages)) {
        setIndice(0)
        setOuvert(true)
      }
    })()
    return () => { annule = true }
  }, [])

  // Réouverture à la demande, depuis les réglages.
  useEffect(() => {
    function rouvrir() {
      dejaTente.current = true
      setIndice(0)
      setOuvert(true)
    }
    window.addEventListener(TOUR_START, rouvrir)
    return () => window.removeEventListener(TOUR_START, rouvrir)
  }, [])

  // L'écran suit l'étape. `hrefToVisit` rend `null` quand on y est déjà : deux
  // étapes voisines peuvent viser la même page, et la recharger sous les yeux
  // de quelqu'un qui lit serait désagréable.
  //
  // Une seule tentative par étape. Sans cette garde, un écran qui renvoie
  // ailleurs — une redirection, un accès refusé — remet `pathname` sur une
  // autre valeur, l'effet repart, et le parcours se bat indéfiniment contre la
  // page : c'est ce qui faisait tomber l'application sur `/contexts`, qui
  // n'existe plus que pour rediriger. On tente donc, et on s'en accommode.
  const dernierSaut = useRef<string | null>(null)
  useEffect(() => {
    if (!ouvert) {
      dernierSaut.current = null
      return
    }
    const cible = hrefToVisit(etapes, indice, pathname)
    if (!cible) return

    const tentative = `${indice}:${cible}`
    if (dernierSaut.current === tentative) return
    dernierSaut.current = tentative
    router.push(cible)
  }, [ouvert, indice, pathname, etapes, router])

  useEffect(() => {
    if (ouvert) carte.current?.focus()
  }, [ouvert, indice])

  const terminer = useCallback(async () => {
    setOuvert(false)
    // La date est posée même quand le parcours est passé : quelqu'un qui a dit
    // non ne doit pas se le voir reproposer à chaque ouverture.
    try {
      await updateSettings({ tourCompletedAt: new Date().toISOString() })
    } catch {
      // Un échec d'enregistrement ne doit pas retenir l'utilisateur sur la
      // carte. Au pire le parcours se represente à la prochaine session.
    }
  }, [])

  const suivant = useCallback(() => {
    if (derniere) { void terminer(); return }
    setIndice((i) => clampIndex(etapes, i + 1))
  }, [derniere, etapes, terminer])

  const precedent = useCallback(() => {
    setIndice((i) => clampIndex(etapes, i - 1))
  }, [etapes])

  useEffect(() => {
    if (!ouvert) return
    function auClavier(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') { e.preventDefault(); suivant() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); precedent() }
      else if (e.key === 'Escape') { e.preventDefault(); void terminer() }
    }
    window.addEventListener('keydown', auClavier)
    return () => window.removeEventListener('keydown', auClavier)
  }, [ouvert, suivant, precedent, terminer])

  if (!ouvert || !etape) return null

  const Icone = ICONES[etape.icon]
  const position = clampIndex(etapes, indice)

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:p-6 pointer-events-none">
      {/*
        Voile léger, et non opaque : la carte commente l'écran qui est derrière,
        le masquer viderait le parcours de son intérêt.
      */}
      <div
        className="absolute inset-0 bg-black/35 pointer-events-auto motion-safe:transition-opacity"
        onClick={() => void terminer()}
        aria-hidden="true"
      />

      <div
        ref={carte}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titre"
        tabIndex={-1}
        // La hauteur est bornée : les étapes les plus fournies — les réglages,
        // les rappels — dépassent sinon un écran de téléphone, et leurs boutons
        // sortent du champ. Le débordement défile dans la carte, pas dans la page.
        className="bo-tour relative pointer-events-auto w-full max-w-xl max-h-[85dvh] overflow-y-auto bg-[--surface] border border-[--border] rounded-2xl shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-[--primary]"
      >
        <button
          type="button"
          onClick={() => void terminer()}
          aria-label="Fermer le parcours découverte"
          className="absolute top-3 right-3 p-2 rounded-lg text-[--text-secondary] hover:text-[--text] hover:bg-[--primary-light] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-[--primary-light] flex items-center justify-center">
              <Icone className="w-5 h-5 text-[--primary]" />
            </span>
            <div className="min-w-0 pr-8">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[--text-secondary]">
                Étape {position + 1} sur {etapes.length}
              </p>
              <h2 id="tour-titre" className="text-lg sm:text-xl font-bold text-[--text] mt-0.5">
                {etape.title}
              </h2>
            </div>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-[--text-secondary]">
            {etape.body}
          </p>

          {etape.points && (
            <ul className="mt-3.5 flex flex-col gap-2">
              {etape.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-[--text-secondary]">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-[--primary]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Progression : une barre par étape, franchies en couleur. */}
          <div className="mt-5 flex gap-1" aria-hidden="true">
            {etapes.map((e, i) => (
              <span
                key={e.id}
                className={`h-1 flex-1 rounded-full motion-safe:transition-colors ${
                  i <= position ? 'bg-[--primary]' : 'bg-[--border]'
                }`}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void terminer()}
              className="text-[13.5px] text-[--text-secondary] hover:text-[--text] transition-colors mr-auto"
            >
              {derniere ? 'Fermer' : 'Passer le parcours'}
            </button>

            {position > 0 && (
              <button
                type="button"
                onClick={precedent}
                className="px-4 py-2 rounded-lg text-[14px] font-medium text-[--text] border border-[--border] hover:bg-[--primary-light] transition-colors"
              >
                Précédent
              </button>
            )}

            <button
              type="button"
              onClick={suivant}
              className="px-5 py-2 rounded-lg text-[14px] font-semibold text-white bg-[--primary] hover:opacity-90 transition-opacity"
            >
              {derniere ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
