'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Link2, Mail, Copy, Check, Trash2, LogOut, Loader } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import {
  creerLien, lienDInvitation, invitationsDuPlan, revoquerInvitation,
  membresDuPlan, quitterPlan,
} from '@/lib/plans/partage'
import type { PlanInvitation, PlanMembre } from '@/lib/storage/types'

/**
 * Le panneau de partage d'un plan.
 *
 * Deux chemins, sur décision du propriétaire du 30 septembre 2026 : un lien
 * qu'on transmet soi-même, et une adresse courriel. Le second passe par une
 * route serveur — `profiles` ne porte pas d'adresse et `auth.users` n'est pas
 * exposée —, le premier par une simple insertion, la policy « un membre
 * invite » faisant la garde.
 *
 * **La réponse ne dit jamais si l'adresse a un compte.** Une route qui
 * répondrait « cette adresse n'est pas inscrite » serait un test d'existence.
 * Le même message paraît dans les deux cas, et le lien est donné en dessous
 * pour que l'expéditeur puisse le transmettre lui-même — ce qui rattrape
 * exactement le cas de la personne non inscrite.
 */

interface Props {
  planId: number
  /** `false` quand le plan a été rejoint : on peut alors le quitter. */
  estProprietaire: boolean
  /** Appelé après un départ, pour que l'écran quitte le plan disparu. */
  onQuitte?: () => void
}

export default function PartagePlan({ planId, estProprietaire, onQuitte }: Props) {
  const { t } = useI18n()
  const [membres, setMembres] = useState<PlanMembre[]>([])
  const [invitations, setInvitations] = useState<PlanInvitation[]>([])
  const [lien, setLien] = useState('')
  const [copie, setCopie] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [busy, setBusy] = useState(false)

  /*
    `useCallback` plutôt qu'un `eslint-disable` : la fonction est appelée par
    l'effet ET par chaque geste du panneau, et museler la règle aurait laissé
    passer le jour où elle dépendra d'autre chose. Les invitations ne sont
    relues que par le créateur — un membre n'en voit aucune, sa policy ne les
    lui rendant pas, et demander une liste qu'on sait vide est un
    aller-retour pour rien.
  */
  const recharger = useCallback(async () => {
    const [m, i] = await Promise.all([
      membresDuPlan(planId),
      estProprietaire ? invitationsDuPlan(planId) : Promise.resolve([]),
    ])
    setMembres(m)
    setInvitations(i.filter((x) => x.statut === 'en_attente'))
  }, [planId, estProprietaire])

  useEffect(() => { void recharger() }, [recharger])

  async function faireLien() {
    setBusy(true); setErreur(''); setMessage('')
    const jeton = await creerLien(planId)
    if (jeton) { setLien(lienDInvitation(jeton)); await recharger() }
    else setErreur(t.partage.erreurs.inconnu)
    setBusy(false)
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      // `clipboard` échoue hors HTTPS et quand l'onglet n'a pas le focus.
      // Le lien reste sélectionnable à la main : ne rien dire vaut mieux
      // qu'une alerte pour un geste que l'utilisateur peut faire lui-même.
    }
  }

  async function inviterParCourriel(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErreur(''); setMessage('')
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, email }),
      })
      const corps = await res.json().catch(() => null)
      if (!res.ok) {
        setErreur(corps?.error ?? t.partage.erreurs.inconnu)
      } else {
        setMessage(t.partage.invitationEnvoyee)
        if (corps?.data?.jeton) setLien(lienDInvitation(corps.data.jeton))
        setEmail('')
        await recharger()
      }
    } catch {
      setErreur(t.partage.erreurs.inconnu)
    }
    setBusy(false)
  }

  const champ = 'border border-gray-300 rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]'
  const boutonSecondaire = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 shrink-0'

  return (
    <div className="bg-[--surface] border border-[--border] rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[--primary] shrink-0" />
        <h2 className="font-semibold text-[--text]">{t.partage.titre}</h2>
      </div>
      <p className="text-sm text-[--text-secondary]">{t.partage.explication}</p>

      {erreur && (
        <p role="alert" className="text-sm text-[--text] bg-[--danger-light] border border-[--alerte-danger] rounded-lg px-3 py-2">
          {erreur}
        </p>
      )}
      {message && (
        <p className="text-sm text-[--text] bg-[--primary-light] rounded-lg px-3 py-2">{message}</p>
      )}

      <div>
        <p className="text-sm font-medium text-[--text] flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-[--text-secondary]" />{t.partage.parLien}
        </p>
        <p className="text-xs text-[--text-secondary] mb-2">{t.partage.parLienAide}</p>
        {lien ? (
          <div className="flex flex-wrap items-center gap-2">
            {/* En lecture seule et non en simple texte : sur un téléphone, un
                appui long sur un champ propose « tout sélectionner », ce qu'un
                paragraphe ne fait pas. C'est le recours quand le
                presse-papiers est refusé. */}
            <input readOnly value={lien} onFocus={(e) => e.currentTarget.select()}
              className={`${champ} flex-1 min-w-0`} aria-label={t.partage.parLien} />
            <button type="button" onClick={copier} className={boutonSecondaire}>
              {copie ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copie ? t.partage.copie : t.partage.copier}
            </button>
          </div>
        ) : (
          <button type="button" onClick={faireLien} disabled={busy} className={boutonSecondaire}>
            {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {t.partage.creerLien}
          </button>
        )}
      </div>

      <form onSubmit={inviterParCourriel}>
        <label htmlFor="partage-email" className="text-sm font-medium text-[--text] flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-[--text-secondary]" />{t.partage.parAdresse}
        </label>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <input
            id="partage-email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.partage.adressePlaceholder}
            className={`${champ} flex-1 min-w-0`}
          />
          <button type="submit" disabled={busy || !email} className={`${boutonSecondaire} disabled:opacity-50`}>
            {t.partage.inviter}
          </button>
        </div>
      </form>

      <div>
        <p className="text-sm font-medium text-[--text] mb-1.5">{t.partage.membres}</p>
        <ul className="space-y-1">
          {membres.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-[--text] truncate">{m.nom || '—'}</span>
              <span className="text-xs text-[--text-secondary] shrink-0">
                {m.role === 'proprietaire' ? t.partage.proprietaire : t.partage.membre}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {estProprietaire && invitations.length > 0 && (
        <div>
          <p className="text-sm font-medium text-[--text] mb-1.5">{t.partage.invitationsEnCours}</p>
          <ul className="space-y-1">
            {invitations.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[--text-secondary] truncate">{i.email || t.partage.parLien}</span>
                <button
                  type="button"
                  onClick={async () => { await revoquerInvitation(i.id); await recharger() }}
                  className="text-[--text-secondary] hover:text-[--alerte-danger] shrink-0"
                  aria-label={t.partage.revoquer}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!estProprietaire && (
        <div className="pt-1 border-t border-[--border]">
          <p className="text-xs text-[--text-secondary] mt-3 mb-2">{t.partage.quitterConfirmation}</p>
          <button
            type="button"
            onClick={async () => { if (await quitterPlan(planId)) onQuitte?.() }}
            className={boutonSecondaire}
          >
            <LogOut className="w-4 h-4" />{t.partage.quitter}
          </button>
        </div>
      )}
    </div>
  )
}
