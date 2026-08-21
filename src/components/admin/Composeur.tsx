'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { api } from '@/lib/admin/api'
import { validerMessage, SUJET_MAX, CORPS_MAX } from '@/lib/messages/messages'

/**
 * Le formulaire d'envoi de l'administration, partagé par la fiche et la liste.
 *
 * Un seul composant parce que les deux emplacements n'ont qu'une différence :
 * le nombre de destinataires. Deux formulaires auraient divergé au premier
 * champ ajouté — c'est ce qui vient d'arriver au tableau des utilisateurs.
 *
 * La validation appelle `lib/messages`, la même fonction que la route : le
 * navigateur affiche l'erreur tôt, le serveur ne le croit pas sur parole.
 */
export default function Composeur({
  destinataires, libelleBouton, confirmation, onEnvoye,
}: {
  destinataires: string[]
  libelleBouton: string
  /** Demandée avant l'envoi quand il y a plus d'un destinataire. */
  confirmation?: string
  onEnvoye?: (envoyes: number) => void
}) {
  const { t } = useI18n()
  const [sujet, setSujet] = useState('')
  const [corps, setCorps] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  /** Par défaut faux : le message dans l'application est le cas ordinaire. */
  const [courrielSeul, setCourrielSeul] = useState(false)

  const envoyer = async () => {
    setErreur(''); setSucces('')
    const defaut = validerMessage({ subject: sujet, body: corps }, destinataires)
    if (defaut) { setErreur(t.messages.errors[defaut] ?? defaut); return }
    if (confirmation && !confirm(confirmation)) return

    setEnvoi(true)
    const res = await api('/api/admin/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: sujet, body: corps, userIds: destinataires, emailOnly: courrielSeul }),
    })
    setEnvoi(false)
    if (res.error) {
      // La route rend l'identifiant du défaut quand c'est une validation ; le
      // traduire ici plutôt que d'afficher « corpsVide » à l'utilisateur.
      setErreur(t.messages.errors[res.error] ?? res.error)
      return
    }
    const envoyes = res.data?.envoyes ?? 0
    setSucces(t.messages.sentCount(envoyes))
    setSujet(''); setCorps('')
    onEnvoye?.(envoyes)
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="msg-sujet" className="block text-xs font-medium text-gray-500 mb-1">
          {t.messages.subject}
        </label>
        <input id="msg-sujet" type="text" value={sujet} maxLength={SUJET_MAX}
          onChange={(e) => setSujet(e.target.value)}
          placeholder={t.messages.subjectPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div>
        <label htmlFor="msg-corps" className="block text-xs font-medium text-gray-500 mb-1">
          {t.messages.body}
        </label>
        <textarea id="msg-corps" value={corps} rows={4} maxLength={CORPS_MAX}
          onChange={(e) => setCorps(e.target.value)}
          placeholder={t.messages.bodyPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <p className="text-[11px] text-gray-400 mt-0.5">{corps.trim().length} / {CORPS_MAX}</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" checked={courrielSeul}
          onChange={(e) => setCourrielSeul(e.target.checked)}
          className="rounded border-gray-300" />
        {t.messages.emailOnly}
      </label>
      <p className="text-[11px] text-gray-400 -mt-2">{t.messages.emailOnlyHint}</p>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      {succes && <p className="text-sm text-green-600">{succes}</p>}
      <button onClick={envoyer} disabled={envoi || !corps.trim()}
        className="inline-flex items-center gap-2 bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50">
        {envoi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:rotate-180" />}
        {envoi ? t.messages.sending : libelleBouton}
      </button>
    </div>
  )
}
