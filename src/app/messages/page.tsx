'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, Send, Loader2, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import {
  getMesMessages, marquerLus, repondre, archiverMessage, supprimerMessage,
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
  /**
   * L'onglet regardé. Les archivés ne sont pas cachés par la RLS — seuls les
   * supprimés le sont —, c'est donc l'écran qui les range, et l'on peut y
   * revenir pour désarchiver.
   */
  const [ongletArchives, setOngletArchives] = useState(false)
  const [enCours, setEnCours] = useState<number | null>(null)
  /** Le fil de l'onglet regardé. `!!` parce que la colonne est une date, pas un booléen. */
  const visibles = fil.filter((m) => !!m.archivedAt === ongletArchives)

  /**
   * Archive ou désarchive, et met à jour l'état local.
   *
   * Pas de relecture après l'écriture : elle rapporterait l'ancienne valeur
   * tant que la mutation est en vol, comme le rappelle `AGENTS.md`.
   */
  const basculerArchive = async (id: number, archive: boolean) => {
    setEnCours(id)
    const ok = await archiverMessage(id, archive)
    if (ok) {
      setFil((prev) => prev.map((m) =>
        m.id === id ? { ...m, archivedAt: archive ? new Date().toISOString() : null } : m))
    }
    setEnCours(null)
  }

  /** Retire un message de la boîte. La ligne demeure, l'administration la voit. */
  const supprimer = async (id: number) => {
    if (!window.confirm(t.messages.confirmDelete)) return
    setEnCours(id)
    const ok = await supprimerMessage(id)
    if (ok) setFil((prev) => prev.filter((m) => m.id !== id))
    setEnCours(null)
  }

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

      {/*
        Deux vues d'un même fil. Les archivés ne sont pas masqués par la RLS —
        seuls les supprimés le sont —, donc c'est ici que le partage se fait,
        et l'on peut revenir en arrière depuis l'onglet.
      */}
      <div className="flex gap-2 mb-4">
        {[false, true].map((archives) => (
          <button key={String(archives)} type="button"
            onClick={() => setOngletArchives(archives)}
            aria-pressed={ongletArchives === archives}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              ongletArchives === archives
                ? 'bg-[--primary] text-white'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}>
            {archives ? t.messages.archived : t.messages.active}
            <span className="ms-1.5 opacity-75">
              {fil.filter((m) => !!m.archivedAt === archives).length}
            </span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Mail className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">
            {ongletArchives ? t.messages.emptyArchived : t.messages.empty}
          </p>
          {!ongletArchives && <p className="text-sm text-gray-400 mt-1">{t.messages.emptyHint}</p>}
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0 mb-6">
          {visibles.map((m) => (
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
              {/*
                `whitespace-pre-wrap` : les sauts de ligne tapés sont ceux qu'on
                lit. Le corps n'est jamais interprété comme du HTML.
                Le plafond de hauteur et son ascenseur : un message long
                occupait tout l'écran et repoussait le suivant hors de vue.
                `max-h-64` plutôt qu'un nombre de lignes — un texte tronqué à
                `line-clamp` cache sa fin sans dire qu'elle existe, quand un
                ascenseur la montre et la rend atteignable.
              */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {m.body}
              </p>

              <div className="flex justify-end gap-1.5 mt-2 pt-2 border-t border-gray-100">
                <button type="button" disabled={enCours === m.id}
                  onClick={() => basculerArchive(m.id, !m.archivedAt)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-50 rounded-lg px-2 py-1 transition-colors">
                  {m.archivedAt
                    ? <><ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" />{t.messages.unarchive}</>
                    : <><Archive className="w-3.5 h-3.5" aria-hidden="true" />{t.messages.archive}</>}
                </button>
                <button type="button" disabled={enCours === m.id}
                  onClick={() => supprimer(m.id)}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 rounded-lg px-2 py-1 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.common.delete}
                </button>
              </div>
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
