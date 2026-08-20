'use client'

import { Ban } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { statutDe } from '@/lib/admin/utilisateurs'
import type { LigneUtilisateur } from '@/lib/admin/utilisateurs'

/**
 * Le statut d'un compte, en pastille colorée.
 *
 * **Un seul composant pour la liste et pour la fiche.** Les deux affichaient la
 * même chose de deux façons, et c'est exactement ce qui a fait perdre « En
 * ligne » en cours de journée : une règle recopiée finit par ne l'être plus.
 *
 * Les couleurs de texte sont posées explicitement. Ni `bg-red-50` ni
 * `bg-green-50` ne sont remappés par le bloc `html.dark` de `globals.css`, qui
 * ne réécrit que les gris : un texte sans classe de couleur y hériterait de
 * `--text`, presque blanc sur presque blanc. C'est la règle 15.
 */
export default function BadgeStatut({
  compte, taille = 'normale',
}: {
  compte: Pick<LigneUtilisateur, 'suspended' | 'lastSignIn'>
  /** `grande` sur la fiche, où la pastille est un titre plus qu'une cellule. */
  taille?: 'normale' | 'grande'
}) {
  const { t } = useI18n()
  const statut = statutDe(compte)
  const espace = taille === 'grande' ? 'px-2.5 py-1 text-sm' : 'px-2 py-0.5 text-xs'

  if (statut === 'suspendu') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 font-medium text-red-700 ${espace}`}>
        <Ban className={taille === 'grande' ? 'w-4 h-4' : 'w-3 h-3'} />
        {t.admin.suspended}
      </span>
    )
  }

  if (statut === 'en-ligne') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-green-50 font-medium text-green-700 ${espace}`}>
        {/* Le point vert : c'est lui qu'on repère du coin de l'œil, avant même
            de lire le mot. */}
        <span className={`rounded-full bg-green-600 inline-block ${taille === 'grande' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
        {t.admin.online}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 font-medium text-gray-600 ${espace}`}>
      <span className={`rounded-full bg-gray-400 inline-block ${taille === 'grande' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
      {t.admin.offline}
    </span>
  )
}
