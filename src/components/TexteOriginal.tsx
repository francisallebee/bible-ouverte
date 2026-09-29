'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { textDirection } from '@/lib/i18n/locales'
import { useI18n } from '@/contexts/I18nContext'
import { getEntreeStrong } from '@/lib/storage/strong-store'
import type { EntreeStrong, MotOriginal, VersetOriginal } from '@/lib/storage/types'

/**
 * Le texte original, mot à mot, chaque mot cliquable.
 *
 * C'est le dernier maillon de la chaîne commencée le 29 septembre 2026 : le
 * script de conversion, les lexiques, les textes balisés, et enfin l'écran qui
 * montre une définition. Tant qu'il n'existait pas, `LEXIQUES_VISIBLES` gardait
 * la case des Réglages masquée — cocher aurait occupé des mégaoctets pour rien.
 *
 * **Il ne passe pas par `TexteBiblique`, et c'est voulu.** Ce dernier est le
 * point de passage du texte **traduit** : il rend des versets ou un texte, pas
 * des mots. La Mémorisation avait déjà été laissée dehors pour cette raison
 * exacte — elle rend un mot à la fois. Les deux le rejoindront le jour où il
 * saura rendre des mots, c'est-à-dire quand il y aura **deux** appelants à
 * servir et non un ; inventer l'abstraction avant son second usage coûterait
 * plus qu'elle ne rapporte.
 *
 * **Le sens d'écriture vient de la langue du texte**, jamais de l'interface :
 * l'hébreu s'écrit de droite à gauche dans une application réglée en français.
 * `textDirection` a dû apprendre `he` pour l'occasion — il ne connaissait que
 * les langues d'interface, et rendait la Genèse à l'envers.
 */

interface Props {
  versets: VersetOriginal[]
  /** `he` ou `el`. */
  langue: string
  /** La mention imposée par la licence, affichée avec la définition. */
  attribution?: string
  className?: string
}

export default function TexteOriginal({ versets, langue, attribution, className = '' }: Props) {
  const { t } = useI18n()
  const [choisi, setChoisi] = useState<{ mot: MotOriginal; ref: string; index: number } | null>(null)
  const [entree, setEntree] = useState<EntreeStrong | null | undefined>(undefined)

  const dir = textDirection(langue)

  useEffect(() => {
    let vivant = true
    if (!choisi?.mot.s) {
      setEntree(null)
      return
    }
    // `undefined` pendant la lecture, `null` quand il n'y a rien : les deux se
    // disent autrement à l'écran, et les confondre montrerait « aucune
    // définition » le temps d'un aller-retour dans IndexedDB.
    setEntree(undefined)
    getEntreeStrong(choisi.mot.s).then((e) => {
      if (vivant) setEntree(e ?? null)
    })
    return () => { vivant = false }
  }, [choisi])

  if (!versets.length) return null

  return (
    <div className={className}>
      <div dir={dir} className="leading-loose">
        {versets.map((verset) => (
          <p key={verset.ref} className="mb-2">
            <span className="text-xs text-[--text-secondary] me-1.5 align-top">{verset.verse}</span>
            {verset.mots.map((mot, i) => {
              const actif = choisi?.ref === verset.ref && choisi.index === i
              return (
                <span key={`${verset.ref}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setChoisi(actif ? null : { mot, ref: verset.ref, index: i })}
                    /*
                      Les classes grises sont reprises de blocs déjà remappés en
                      mode sombre — règle 15 : une variante est une classe
                      distincte, et `hover:` en est une. `--primary-light` et
                      `--primary` forment le couple déjà mesuré à 11,02 en clair
                      et 7,57 en sombre dans les Réglages.
                    */
                    className={`rounded px-0.5 transition-colors ${
                      actif
                        ? 'bg-[--primary-light] text-[--primary]'
                        : 'hover:bg-[--primary-light] cursor-pointer'
                    } ${mot.s ? '' : 'opacity-60'}`}
                    aria-label={mot.s ? `${mot.t} — ${mot.s}` : mot.t}
                  >
                    {mot.t}
                  </button>
                  {/*
                    Le maqqef et le sof-pasuq sont hors du bouton : ils ne sont
                    pas le mot, ils le suivent. Les mettre dedans les rendrait
                    cliquables et surlignés avec lui, ce qui est faux.
                  */}
                  {mot.a ?? ' '}
                </span>
              )
            })}
          </p>
        ))}
      </div>

      {choisi && (
        <div className="mt-2 rounded-lg border border-[--border] bg-[--surface] p-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p dir={dir} className="text-base font-medium text-[--text]">{choisi.mot.t}</p>
              {entree === undefined && (
                <p className="text-[--text-secondary] mt-1">{t.strong.chargement}</p>
              )}
              {/*
                Tout ce qui suit est **en écriture latine** — le lexique de
                Strong est une œuvre anglaise de 1890 — et porte donc son propre
                `dir="ltr"`, quelle que soit la langue de l'interface.
                Sans lui, en arabe, l'algorithme bidi renvoyait l'apostrophe de
                `shaw-neh'` en tête de ligne et mêlait l'hébreu de l'étymologie
                au latin dans le désordre. Vu à l'écran le 29 septembre 2026,
                langue basculée : c'est la règle 10, et un relevé n'aurait rien
                montré — les chaînes étaient justes, c'est leur rendu qui ne
                l'était pas.
              */}
              {entree === null && (
                <p className="text-[--text-secondary] mt-1">
                  {choisi.mot.s ? t.strong.definitionAbsente(choisi.mot.s) : t.strong.sansNumero}
                </p>
              )}
              {entree && (
                <>
                  <p dir="ltr" className="text-[--text-secondary] mt-0.5 text-start">
                    {entree.number}
                    {entree.translit ? ` · ${entree.translit}` : ''}
                    {entree.pron ? ` · ${entree.pron}` : ''}
                  </p>
                  {entree.definition
                    ? <p dir="ltr" className="text-[--text] mt-1.5 text-start">{entree.definition}</p>
                    : <p className="text-[--text-secondary] mt-1.5">{t.strong.definitionVide}</p>}
                  {entree.derivation && (
                    <p dir="ltr" className="text-[--text-secondary] mt-1 text-xs text-start">{entree.derivation}</p>
                  )}
                </>
              )}
              {/*
                La mention de licence, affichée avec la définition et non
                ailleurs : c'est la contrepartie de la CC BY-SA acceptée le
                29 septembre 2026, et elle était portée jusqu'ici par le fichier
                sans que rien ne la montre.
              */}
              {attribution && (
                <p dir="ltr" className="text-[--text-secondary] mt-2 text-[11px] leading-snug text-start">{attribution}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setChoisi(null)}
              className="text-[--text-secondary] hover:text-[--text] shrink-0"
              aria-label={t.common.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
