'use client'

import { FlaskConical, ShieldOff } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Le banc d'essai des fonctions avancées.
 *
 * Une section réservée à l'administrateur, où les fonctions se montrent avant
 * d'être proposées à tout le monde. Elle est volontairement **vide** à sa
 * naissance : c'est un cadre, pas une fonctionnalité, et le remplir d'avance
 * de choses non demandées irait contre sa raison d'être.
 *
 * **Le garde-fou est celui d'`/admin`, et il a la même portée.** `isAdmin`
 * vient d'`AuthContext`, donc du navigateur : il décide de ce qui s'affiche,
 * jamais de ce qui est permis. Toute fonction posée ici qui touchera aux
 * données d'autrui devra porter sa propre barrière — RLS, ou route servie par
 * la clé service_role —, exactement comme le fait l'écran d'administration.
 * Une page réservée n'est pas une donnée protégée.
 */
export default function AvancePage() {
  const { t } = useI18n()
  const { isAdmin, loading } = useAuth()

  if (loading) return <p className="text-gray-500">{t.common.loading}</p>

  if (!isAdmin) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">{t.admin.denied}</h1>
      <p className="text-gray-500">{t.admin.notAdmin}</p>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-[--primary]" />
          </span>
          {t.avance.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">
          {t.avance.subtitle}
        </p>
      </div>

      {/*
        L'emplacement des essais. Il dit ce qu'il attend plutôt que de rester
        blanc : un cadre vide sans explication se lit comme un écran cassé.
      */}
      <div className="bg-[--surface] rounded-xl border border-dashed border-[--border] p-10 text-center">
        <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-[--text]">{t.avance.empty}</p>
        <p className="text-sm text-[--text-secondary] mt-1.5 max-w-md mx-auto">
          {t.avance.emptyHint}
        </p>
      </div>
    </div>
  )
}
