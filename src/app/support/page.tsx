'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Bug, Lightbulb, Send, ChevronDown, ChevronUp, Loader, Trash2 } from 'lucide-react'
import { getAllTickets, addTicket, addReply, deleteTicket } from '@/lib/storage/support-store'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { getCurrentUserId } from '@/lib/storage/user-id'
import type { SupportTicket } from '@/lib/storage/types'
import { TICKET_STATUS_BADGE, isClosed } from '@/lib/tickets'

export default function SupportPage() {
  const { isAdmin } = useAuth()
  const { t, locale } = useI18n()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('default')
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion')
  const [userName, setUserName] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [replyText, setReplyText] = useState('')
  const [replyTicketId, setReplyTicketId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [replyError, setReplyError] = useState('')
  const [closDeplies, setClosDeplies] = useState(false)

  const load = async () => {
    setTickets(await getAllTickets())
    setUserId(await getCurrentUserId())
    const name = localStorage.getItem('profile_name') || ''
    if (name) setUserName(name)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const ouverts = tickets.filter(ticket => !isClosed(ticket.status))
  const clos = tickets.filter(ticket => isClosed(ticket.status))

  const toggleExpanded = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!message.trim() || !userName.trim()) return
    setSaving(true)
    await addTicket({ type, message: message.trim(), userName: userName.trim() })
    setSaving(false); setShowForm(false); setMessage('')
    await load()
  }

  const handleDelete = async (ticketId: number) => {
    if (!confirm(t.support.confirmDelete)) return
    setDeleteError('')
    const deleted = await deleteTicket(ticketId)
    if (!deleted) {
      setDeleteError(t.support.deleteFailed)
      return
    }
    await load()
  }

  const handleReply = async (ticketId: number) => {
    if (!replyText.trim()) return
    const name = isAdmin
      ? (localStorage.getItem('profile_name') || t.support.defaultAdminName)
      : (localStorage.getItem('profile_name') || t.support.defaultUserName)
    setReplyError('')
    const ecrit = await addReply(ticketId, replyText.trim(), isAdmin, name)
    if (!ecrit) { setReplyError(t.support.replyFailed); return }
    setReplyText(''); setReplyTicketId(null)
    await load()
  }

  /**
   * Une seule carte pour les deux sections : un ticket clos ne diffère que
   * par son rangement et par l'absence de champ de réponse.
   */
  const carteTicket = (ticket: SupportTicket) => (
    <div key={ticket.id} className="bg-[--surface] rounded-xl border border-[--border] shadow-[--shadow] overflow-hidden">
      <button onClick={() => ticket.id && toggleExpanded(ticket.id)}
        className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                ticket.type === 'bug' ? 'text-red-600 bg-red-50' : 'text-purple-600 bg-purple-50'
              }`}>
                {ticket.type === 'bug' ? t.support.bug : t.support.suggestion}
              </span>
              {/* Même colonne `tickets.status` et mêmes libellés qu'Administration :
                  les deux écrans ne peuvent pas afficher des états différents. */}
              {ticket.status && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_BADGE[ticket.status] || ''}`}>
                  {t.common.ticketStatuses[ticket.status] ?? ticket.status}
                </span>
              )}
              <span className="text-xs text-[--text-secondary]">
                {formatDate(locale, ticket.createdAt)}
              </span>
            </div>
            <p className="text-sm text-[--text] line-clamp-2">{ticket.message}</p>
            <p className="text-xs text-[--text-secondary] mt-1.5">— {ticket.userName}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {ticket.replies.length > 0 && (
              <span className="text-xs bg-[--primary-light] text-[--primary] px-2 py-0.5 rounded-full font-medium">
                {t.support.replyCount(ticket.replies.length)}
              </span>
            )}
            {expanded.has(ticket.id!) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded.has(ticket.id!) && (
        <div className="border-t border-[--border]">
          <div className="p-4 space-y-3">
            <p className="text-sm text-[--text] whitespace-pre-wrap">{ticket.message}</p>

            {ticket.replies.map(reply => (
              <div key={reply.id} className={`flex gap-3 ${reply.isAdmin ? '' : 'ms-6'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  reply.isAdmin ? 'bg-[--primary]' : 'bg-gray-400'
                }`}>
                  {reply.userName[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[--text]">{reply.userName}</span>
                    {reply.isAdmin && <span className="text-[10px] bg-[--primary-light] text-[--primary] px-1.5 py-0.5 rounded-full font-medium">{t.support.admin}</span>}
                    <span className="text-[10px] text-[--text-secondary]">{formatDate(locale, reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[--text-secondary]">{reply.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[--border] px-4 py-3">
            {isClosed(ticket.status) ? (
              /* La clôture appartient au seul administrateur, et elle ferme le
                 fil pour tout le monde. Masquer le champ ne suffirait pas : le
                 refus est aussi dans la base, migration 20260818200000. */
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[--text-secondary]">{t.support.closedNotice}</p>
                {isAdmin && (
                  <button onClick={() => ticket.id && handleDelete(ticket.id)}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium flex items-center gap-1 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.common.delete}
                  </button>
                )}
              </div>
            ) : replyTicketId === ticket.id ? (
              <div className="flex gap-2">
                <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={isAdmin ? t.support.replyPlaceholder : t.support.commentPlaceholder}
                  onKeyDown={e => e.key === 'Enter' && handleReply(ticket.id!)}
                  className="flex-1 border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" autoFocus />
                <button onClick={() => handleReply(ticket.id!)} disabled={!replyText.trim()}
                  className="bg-[--primary] text-white px-3 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
                <button onClick={() => { setReplyTicketId(null); setReplyText('') }}
                  className="text-xs text-gray-400 hover:text-gray-600">{t.common.cancel}</button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button onClick={() => setReplyTicketId(ticket.id!)}
                  className="text-xs text-[--primary] hover:underline font-medium">
                  {isAdmin ? t.support.reply : t.support.comment}
                </button>
                {replyError && <span className="text-xs text-red-600">{replyError}</span>}
                {isAdmin && (
                  <button onClick={() => ticket.id && handleDelete(ticket.id)}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline font-medium flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.common.delete}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[--primary]" />
          </span>
          {t.support.title}
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ms-[3.25rem]">
          {t.support.subtitle}
        </p>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full bg-[--surface] border border-[--border] rounded-xl p-4 mb-6 text-left hover:border-[--primary]/30 transition-colors shadow-[--shadow]">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 bg-[--primary-light] rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-[--primary]" />
          </span>
          <div>
            <p className="text-sm font-medium text-[--text]">{t.support.newMessage}</p>
            <p className="text-xs text-[--text-secondary]">{t.support.newMessageHint}</p>
          </div>
        </div>
      </button>

      {showForm && (
        <div className="bg-[--surface] rounded-xl border border-[--border] p-5 mb-6 space-y-4 shadow-[--shadow]">
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1.5">{t.support.type}</label>
            <div className="flex gap-2">
              {([{ id: 'bug', label: t.support.bug }] as const).map(o => (
                <button key={o.id} onClick={() => setType(o.id)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm border text-left transition-all ${
                    type === o.id ? 'border-[--primary] bg-[--primary-light]' : 'border-[--border]'
                  }`}>
                  <p className="font-medium text-[--text]">{o.label}</p>
                </button>
              ))}
              {([{ id: 'suggestion', label: t.support.suggestion }] as const).map(o => (
                <button key={o.id} onClick={() => setType(o.id)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm border text-left transition-all ${
                    type === o.id ? 'border-[--primary] bg-[--primary-light]' : 'border-[--border]'
                  }`}>
                  <p className="font-medium text-[--text]">{o.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1.5">{t.support.name}</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder={t.support.namePlaceholder}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1.5">{t.support.message}</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={4} placeholder={type === 'bug' ? t.support.bugPlaceholder : t.support.suggestionPlaceholder}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving || !message.trim() || !userName.trim()}
              className="bg-[--primary] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" /> {t.support.send}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-[--border] text-[--text] px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">{t.common.cancel}</button>
          </div>
        </div>
      )}

      {deleteError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          {deleteError}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-[--primary]" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-[--text-secondary]">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t.support.empty}</p>
          <p className="text-xs mt-1">{t.support.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ouverts.map(carteTicket)}

          {/* Les tickets clos sont rangés à part et repliés, comme la feuille de
              route replie « terminé » : consultables, sans encombrer la liste
              vivante. */}
          {clos.length > 0 && (
            <div className="pt-2">
              <button onClick={() => setClosDeplies(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[--border] bg-[--surface] text-sm font-medium text-[--text-secondary] hover:border-[--primary]/30 transition-colors">
                <span>{t.support.closedSection(clos.length)}</span>
                {closDeplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {closDeplies && (
                <div className="space-y-3 mt-3">{clos.map(carteTicket)}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
