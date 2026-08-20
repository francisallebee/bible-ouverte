'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, Send, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import {
  getMesMessages, marquerLus, repondre,
} from '@/lib/storage/messages-store'
import { ordonnerFil, CORPS_MAX } from '@/lib/messages/messages'
import type { Message } from '@/lib/messages/messages'

export default function MessagesPage() {
  const { t, locale } = useI18n()
  const [fil, setFil] = useState<Message[]>([])
  const [charge, setCharge] = useState(false)
  const [brouillon, setBrouillon] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const dejaMarques = useRef(false)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const recus = await getMesMessages()
      if (annule) return
      setFil(ordonnerFil(recus))
      setCharge(true)

      /**
       * Ouvrir la page vaut lecture.
       *
       * Le marquage part **une seule fois** par montage : sans le garde-fou,
       * un rechargement d'état relancerait l'écriture, et la pastille
       * clignoterait à chaque rendu. La date locale n'est pas réécrite dans
       * `fil` — la pastille de la barre latérale se recalcule à sa prochaine
       * ouverture, ce qui suffit et évite une source de vérité de plus.
       */
      if (dejaMarques.current) return
      const aMarquer = recus.filter((m) => m.fromAdmin && !m.readAt).map((m) => m.id)
      if (aMarquer.length === 0) return
      dejaMarques.current = true
      await marquerLus(aMarquer)
    })()
    return () => { annule = true }
  }, [])

  const envoyer = async () => {
    const corps = brouillon.trim()
    if (!corps) { setErreur(t.messages.errors.corpsVide); return }
    if (corps.length > CORPS_MAX) { setErreur(t.messages.errors.corpsTropLong); return }
    setEnvoi(true); setErreur('')
    const ecrit = await repondre(corps)
    setEnvoi(false)
    if (!ecrit) { setErreur(t.messages.sendFailed); return }
    // L'état local prend la ligne relue plutôt que de resynchroniser : c'est la
    // règle du dépôt après une mutation.
    setFil((precedent) => ordonnerFil([...precedent, ecrit]))
    setBrouillon('')
  }

  if (!charge) return <p className="text-gray-500">{t.common.loading}</p>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Mail className="w-6 h-6 text-[--primary]" />
        {t.messages.title}
      </h1>

      {fil.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">{t.messages.empty}</p>
          <p className="text-sm text-gray-400 mt-1">{t.messages.emptyHint}</p>
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0 mb-6">
          {fil.map((m) => (
            <li key={m.id}
              className={`rounded-xl border p-4 ${m.fromAdmin ? 'border-gray-200 bg-white' : 'border-[--primary] bg-[--primary-light] ms-6'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <span className="text-sm font-semibold">
                  {m.fromAdmin ? (m.sentByName || t.messages.fromAdmin) : t.messages.you}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(locale, m.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {m.subject && <p className="text-sm font-medium mb-1">{m.subject}</p>}
              {/* `whitespace-pre-wrap` : les sauts de ligne tapés sont ceux
                  qu'on lit. Le corps n'est jamais interprété comme du HTML. */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label htmlFor="reponse" className="block text-sm font-medium text-gray-700 mb-1">
          {t.messages.reply}
        </label>
        <textarea
          id="reponse"
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          rows={4}
          maxLength={CORPS_MAX}
          placeholder={t.messages.bodyPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {erreur && <p className="text-sm text-red-600 mt-1">{erreur}</p>}
        <button onClick={envoyer} disabled={envoi || !brouillon.trim()}
          className="mt-2 inline-flex items-center gap-2 bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50">
          {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:rotate-180" />}
          {envoi ? t.messages.sending : t.messages.send}
        </button>
      </div>
    </div>
  )
}
