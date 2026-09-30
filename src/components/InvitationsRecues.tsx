'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MailOpen, Check, X } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import {
  mesInvitations, accepterInvitation, refuserInvitation, ErreurInvitation,
  type EchecInvitation,
} from '@/lib/plans/partage'
import type { PlanInvitation } from '@/lib/storage/types'

/**
 * Les invitations **reçues**, en tête de l'écran des plans.
 *
 * Seules les nominatives y paraissent, et ce n'est pas un oubli : un lien
 * ouvert n'est adressé à personne, il n'a donc aucune boîte où attendre. Il
 * s'ouvre, ou il s'ignore.
 *
 * Le bloc disparaît entièrement quand il n'y a rien — un cadre vide intitulé
 * « Invitations reçues » donnerait l'impression permanente d'attendre quelque
 * chose.
 */
export default function InvitationsRecues() {
  const { t } = useI18n()
  const router = useRouter()
  const [liste, setListe] = useState<(PlanInvitation & { planNom: string })[]>([])
  const [busy, setBusy] = useState<number | null>(null)
  const [echec, setEchec] = useState<EchecInvitation | null>(null)

  const recharger = useCallback(async () => { setListe(await mesInvitations()) }, [])
  useEffect(() => { void recharger() }, [recharger])

  async function repondre(inv: PlanInvitation, accepte: boolean) {
    setBusy(inv.id)
    setEchec(null)
    try {
      if (accepte) {
        const planId = await accepterInvitation(inv.jeton)
        router.push(`/plans/${planId}`)
        return
      }
      await refuserInvitation(inv.jeton)
      await recharger()
    } catch (e) {
      setEchec(e instanceof ErreurInvitation ? e.cause : 'inconnu')
    }
    setBusy(null)
  }

  if (liste.length === 0) return null

  return (
    <div className="bg-[--primary-light] rounded-xl p-4 mb-6">
      <p className="font-medium text-[--primary] flex items-center gap-2 mb-3">
        <MailOpen className="w-5 h-5 shrink-0" />
        {t.partage.invitationsRecues}
      </p>

      {echec && (
        <p role="alert" className="text-sm text-[--text] bg-[--danger-light] border border-[--alerte-danger] rounded-lg px-3 py-2 mb-3">
          {t.partage.erreurs[echec]}
        </p>
      )}

      <ul className="space-y-2">
        {liste.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center gap-2 bg-[--surface] rounded-lg px-3 py-2">
            <span className="flex-1 min-w-0 text-sm text-[--text] truncate">
              {t.partage.quelquunVousInvite(inv.planNom)}
            </span>
            <button
              type="button" onClick={() => repondre(inv, true)} disabled={busy !== null}
              className="bg-[--primary] text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-[--primary-hover] disabled:opacity-50 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />{t.partage.accepter}
            </button>
            <button
              type="button" onClick={() => repondre(inv, false)} disabled={busy !== null}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <X className="w-3.5 h-3.5" />{t.partage.refuser}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
