'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Check, X, Loader, UserPlus } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  lireInvitation, accepterInvitation, refuserInvitation, ErreurInvitation,
  type EchecInvitation,
} from '@/lib/plans/partage'
import type { InvitationVue } from '@/lib/storage/types'

/**
 * La page qu'un invité ouvre — **avec ou sans compte**.
 *
 * C'est le seul écran de l'application, hors `/` et `/auth`, servi sans
 * session (voir `isPublicPath`). Et ce n'est pas une commodité : le
 * propriétaire a demandé le 30 septembre 2026 qu'une personne non inscrite
 * « soit invitée à l'être ». Un mur de connexion aurait perdu le jeton en
 * route ; elle se serait inscrite, serait arrivée sur une application vide, et
 * n'aurait jamais retrouvé l'invitation.
 *
 * Elle ne donne accès à rien. `invitation_par_jeton()` ne rend que le nom du
 * plan, celui de l'hôte et l'état de l'invitation ; rejoindre exige une
 * session, et c'est la **fonction en base** qui le vérifie, pas cet écran.
 */
export default function InvitationPage() {
  const { t } = useI18n()
  const { user, loading: sessionEnCours } = useAuth()
  const router = useRouter()
  const params = useParams<{ jeton: string }>()
  const jeton = String(params?.jeton ?? '')

  const [vue, setVue] = useState<InvitationVue | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [echec, setEchec] = useState<EchecInvitation | null>(null)

  useEffect(() => {
    let vivant = true
    // `undefined` pendant la lecture, `null` quand il n'y a rien : les
    // confondre montrerait « cette invitation n'existe pas » le temps d'un
    // aller-retour, à une invitation parfaitement valide.
    lireInvitation(jeton).then((v) => { if (vivant) setVue(v) })
    return () => { vivant = false }
  }, [jeton, user?.id])

  async function rejoindre() {
    setBusy(true)
    setEchec(null)
    try {
      const planId = await accepterInvitation(jeton)
      router.push(`/plans/${planId}`)
    } catch (e) {
      setEchec(e instanceof ErreurInvitation ? e.cause : 'inconnu')
      setBusy(false)
    }
  }

  async function refuser() {
    setBusy(true)
    setEchec(null)
    try {
      await refuserInvitation(jeton)
      router.push('/plans')
    } catch (e) {
      setEchec(e instanceof ErreurInvitation ? e.cause : 'inconnu')
      setBusy(false)
    }
  }

  const carte = 'w-full max-w-md bg-[--surface] border border-[--border] rounded-2xl p-6 shadow-[--shadow-md]'
  const bouton = 'w-full rounded-lg px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors'

  if (vue === undefined || sessionEnCours) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <p className="text-[--text-secondary]">{t.common.loading}</p>
      </div>
    )
  }

  if (vue === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className={carte}>
          <p className="text-[--text]">{t.partage.erreurs.introuvable}</p>
        </div>
      </div>
    )
  }

  const inutilisable = vue.expiree || vue.statut !== 'en_attente'

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className={carte}>
        <div className="flex items-center gap-2.5 mb-4">
          <BookOpen className="w-6 h-6 text-[--primary] shrink-0" />
          <h1 className="text-lg font-semibold text-[--text]">{t.partage.invitationRecue}</h1>
        </div>

        <p className="text-[--text] mb-1">
          {/* Le nom de l'hôte peut manquer — un profil sans prénom. La phrase
              impersonnelle n'est donc pas un repli paresseux : « t'invite à »
              précédé d'un vide se lirait comme un défaut. */}
          {vue.invitePar
            ? t.partage.vousInvite(vue.invitePar, vue.planNom)
            : t.partage.quelquunVousInvite(vue.planNom)}
        </p>
        <p className="text-sm text-[--text-secondary] mb-5">{t.partage.explication}</p>

        {echec && (
          <p role="alert" className="text-sm text-[--text] bg-[--danger-light] border border-[--alerte-danger] rounded-lg px-3 py-2 mb-4">
            {t.partage.erreurs[echec]}
          </p>
        )}

        {vue.dejaMembre ? (
          <>
            <p className="text-sm text-[--text-secondary] mb-3">{t.partage.dejaMembre}</p>
            {/*
              « Voir le plan » menait à la **liste** des plans : le libellé
              promettait plus que le lien ne tenait, vu à l'écran le
              30 septembre 2026. La page ne connaît pas l'identifiant du plan —
              `invitation_par_jeton()` ne le rend pas, et à dessein : un
              inconnu n'a pas à l'apprendre. Mais `accepter_invitation()` le
              rend, et **sort aussitôt** quand on est déjà membre, sans rien
              écrire. C'est le retour anticipé prévu pour ce cas exact, et il
              évite une migration pour un numéro.
            */}
            <button
              type="button" onClick={rejoindre} disabled={busy}
              className={`${bouton} bg-[--primary] text-white hover:bg-[--primary-hover] disabled:opacity-60`}
            >
              {busy ? <Loader className="w-4 h-4 animate-spin" /> : null}
              {t.partage.voirLePlan}
            </button>
          </>
        ) : inutilisable ? (
          <p className="text-sm text-[--text-secondary]">
            {vue.expiree ? t.partage.erreurs.expiree : t.partage.erreurs['deja-traitee']}
          </p>
        ) : user ? (
          <div className="space-y-2">
            <button
              type="button" onClick={rejoindre} disabled={busy}
              className={`${bouton} bg-[--primary] text-white hover:bg-[--primary-hover] disabled:opacity-60`}
            >
              {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {t.partage.accepter}
            </button>
            {/*
              « Refuser » n'apparaît que sur une invitation nominative. Un lien
              ouvert ne se refuse pas : le refuser le fermerait pour tous ceux
              qui l'ont reçu, et la fonction en base lève. Un bouton qui échoue
              est pire que pas de bouton.
            */}
            {vue.nominative ? (
              <button
                type="button" onClick={refuser} disabled={busy}
                className={`${bouton} border border-[--border] text-[--text-secondary] hover:bg-[--bg] disabled:opacity-60`}
              >
                <X className="w-4 h-4" />
                {t.partage.refuser}
              </button>
            ) : (
              <p className="text-xs text-[--text-secondary] text-center pt-1">
                {t.partage.refusImpossible}
              </p>
            )}
          </div>
        ) : (
          /*
            Sans compte : la demande explicite du propriétaire. Le jeton voyage
            dans `next`, que `retourApresConnexion` borne à `/invitation/…` —
            un `next` rendu sans filtre est une redirection ouverte.
          */
          <div className="space-y-2">
            <p className="font-medium text-[--text]">{t.partage.pourRejoindre}</p>
            <p className="text-sm text-[--text-secondary] pb-1">{t.partage.pourRejoindreAide}</p>
            <Link
              href={`/auth/signup?next=${encodeURIComponent(`/invitation/${jeton}`)}`}
              className={`${bouton} bg-[--primary] text-white hover:bg-[--primary-hover]`}
            >
              <UserPlus className="w-4 h-4" />
              {t.partage.creerCompte}
            </Link>
            <Link
              href={`/auth/login?next=${encodeURIComponent(`/invitation/${jeton}`)}`}
              className={`${bouton} border border-[--border] text-[--text-secondary] hover:bg-[--bg]`}
            >
              {t.partage.seConnecter}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
