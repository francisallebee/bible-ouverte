'use client'

import type { CSSProperties } from 'react'
import { teintesDe } from '@/lib/themes'

/**
 * Une barre de progression qui dit **deux** choses : entamé et lu en entier.
 *
 * Jusqu'au 30 septembre 2026, toutes les barres de Progression comptaient un
 * chapitre dès qu'une lecture le touchait. Jean 3:16-18 — trois versets sur
 * trente-six — remplissait la barre comme une lecture complète de Jean 3. Le
 * compteur en tête du même écran, lui, faisait la différence depuis le
 * 9 septembre : **129 des 169 chapitres du propriétaire étaient partiels**,
 * soit 76 %, et les barres le taisaient toutes.
 *
 * **Les deux segments se suivent, ils ne s'additionnent pas.** `entames`
 * comprend `entiers` — un chapitre lu en entier a bien été entamé —, si bien
 * que le second segment ne mesure que la différence. Les additionner
 * dépasserait le total, et c'est l'erreur qu'une barre à deux couleurs invite
 * à faire.
 *
 * **La distinction ne tient pas qu'à la couleur.** Le segment partiel est
 * rayé, pas seulement éclairci : sur une barre de douze pixels, deux teintes
 * de la même couleur se confondent pour un lecteur daltonien comme pour un
 * écran mal réglé. La rayure se voit sans distinguer les teintes, et c'est ce
 * qui la rend lisible dans les deux modes sans mesure par charte — les dix
 * chartes changent la teinte, aucune ne change la rayure.
 *
 * **Le mode sombre passe par `teintesDe` et la classe `.barre-lecture`**, et
 * non par un style en ligne : une couleur écrite en dur dans le dégradé serait
 * imperméable à `html.dark`, et c'est précisément le défaut que
 * `remplissage-teinte` répare depuis le 1er septembre 2026. La classe pose
 * `--teinte`, que les deux segments lisent — la bande pleine par sa couleur de
 * fond, la rayure dans son dégradé.
 */

interface Props {
  /** Chapitres touchés, entiers compris. */
  entames: number
  /** Ceux dont tous les versets ont été lus. */
  entiers: number
  /** Le dénominateur. Zéro rend une barre vide plutôt qu'une division par zéro. */
  total: number
  /**
   * La couleur propre à cette barre — testament, catégorie, contexte.
   *
   * Une couleur littérale passe par `teintesDe`, qui en tire la variante
   * lisible en mode sombre. Une **variable CSS** ne peut pas être analysée :
   * il faut alors donner `couleurSombre` à la main.
   */
  couleur: string
  /**
   * La variante sombre, quand `couleur` est une variable CSS.
   *
   * Sans elle, `var(--primary)` restait posée telle quelle dans les deux
   * modes, et `--primary` ne tient que **1,27** sur `--piste` en sombre —
   * mesuré le 30 septembre 2026 sur la carte des chapitres de Statistiques,
   * où la barre était quasi invisible. C'est la séparation des deux rôles que
   * `themes.ts` décrit : `--primary` est un fond, `--primary-clair` un
   * premier plan, et aucune valeur unique ne sert les deux.
   */
  couleurSombre?: string
  /** Hauteur Tailwind, pour suivre la barre qu'elle remplace. */
  hauteur?: string
  className?: string
  /** Lu par les lecteurs d'écran à la place des deux segments muets. */
  libelle?: string
}

export default function BarreLecture({
  entames, entiers, total, couleur, couleurSombre, hauteur = 'h-3', className = '', libelle,
}: Props) {
  const borne = (n: number) => (total > 0 ? Math.min(100, Math.max(0, (n / total) * 100)) : 0)
  const partEntiers = borne(entiers)
  // La différence, et non `entames` : les segments se suivent dans la boîte.
  const partPartiels = Math.max(0, borne(entames) - partEntiers)

  return (
    <div
      className={`barre-lecture ${hauteur} bg-[--piste] rounded-full overflow-hidden flex ${className}`}
      style={
        couleurSombre
          ? ({ '--teinte-claire': couleur, '--teinte-sombre': couleurSombre } as CSSProperties)
          : teintesDe(couleur)
      }
      role="progressbar"
      aria-valuenow={Math.round(borne(entames))}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={libelle}
    >
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${partEntiers}%`, backgroundColor: 'var(--teinte)' }}
      />
      {/*
        La rayure est faite de la même teinte à deux opacités : elle suit donc
        la couleur de la barre sans qu'aucune charte n'ait à déclarer la
        sienne, et reste visible sur `--piste` clair comme sombre puisque la
        bande pleine, elle, ne change pas.
      */}
      <div
        className="h-full transition-[width] duration-500"
        style={{
          width: `${partPartiels}%`,
          backgroundImage:
            'repeating-linear-gradient(135deg, var(--teinte) 0 4px, '
            + 'color-mix(in srgb, var(--teinte) 28%, transparent) 4px 8px)',
        }}
      />
    </div>
  )
}
