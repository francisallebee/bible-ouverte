'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Bug, Lightbulb, Send, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import { getAllTickets, addTicket, addReply } from '@/lib/storage/support-store'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrentUserId } from '@/lib/storage/user-id'
import type { SupportTicket } from '@/lib/storage/types'

export default function SupportPage() {
  const { isAdmin } = useAuth()
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

  const load = async () => {
    setTickets(await getAllTickets())
    setUserId(await getCurrentUserId())
    const name = localStorage.getItem('profile_name') || ''
    if (name) setUserName(name)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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

  const handleReply = async (ticketId: number) => {
    if (!replyText.trim()) return
    const name = isAdmin ? (localStorage.getItem('profile_name') || 'Administrateur') : (localStorage.getItem('profile_name') || 'Utilisateur')
    await addReply(ticketId, replyText.trim(), isAdmin, name)
    setReplyText(''); setReplyTicketId(null)
    await load()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <span className="w-10 h-10 bg-[--primary-light] rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-[--primary]" />
          </span>
          Support & Suggestions
        </h1>
        <p className="text-[--text-secondary] text-sm mt-1.5 ml-[3.25rem]">
          Signale un bug ou propose une amélioration
        </p>
      </div>

      <button onClick={() => setShowForm(!showForm)}
        className="w-full bg-[--surface] border border-[--border] rounded-xl p-4 mb-6 text-left hover:border-[--primary]/30 transition-colors shadow-[--shadow]">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 bg-[--primary-light] rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-[--primary]" />
          </span>
          <div>
            <p className="text-sm font-medium text-[--text]">Nouveau message</p>
            <p className="text-xs text-[--text-secondary]">Partage ton retour sur l&apos;application</p>
          </div>
        </div>
      </button>

      {showForm && (
        <div className="bg-[--surface] rounded-xl border border-[--border] p-5 mb-6 space-y-4 shadow-[--shadow]">
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1.5">Type</label>
            <div className="flex gap-2">
              {([{ id: 'bug', label: '🐛 Bug', desc: 'Un problème technique' }] as const).map(o => (
                <button key={o.id} onClick={() => setType(o.id)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm border text-left transition-all ${
                    type === o.id ? 'border-[--primary] bg-[--primary-light]' : 'border-[--border]'
                  }`}>
                  <p className="font-medium text-[--text]">{o.label}</p>
                </button>
              ))}
              {([{ id: 'suggestion', label: '💡 Suggestion', desc: 'Une idée d\'amélioration' }] as const).map(o => (
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
            <label className="block text-sm font-medium text-[--text] mb-1.5">Nom (visible par tous)</label>
            <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
              placeholder="Ton prénom ou pseudo"
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={4} placeholder={type === 'bug' ? 'Décris le bug : que s\'est-il passé ?' : 'Décris ton idée d\'amélioration...'}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving || !message.trim() || !userName.trim()}
              className="bg-[--primary] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors flex items-center gap-1.5">
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" /> Envoyer
            </button>
            <button onClick={() => setShowForm(false)} className="border border-[--border] text-[--text] px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader className="w-6 h-6 animate-spin text-[--primary]" /></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-[--text-secondary]">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Aucun message pour le moment</p>
          <p className="text-xs mt-1">Sois le premier à partager ton retour !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-[--surface] rounded-xl border border-[--border] shadow-[--shadow] overflow-hidden">
              <button onClick={() => ticket.id && toggleExpanded(ticket.id)}
                className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ticket.type === 'bug' ? 'text-red-600 bg-red-50' : 'text-purple-600 bg-purple-50'
                      }`}>
                        {ticket.type === 'bug' ? '🐛 Bug' : '💡 Suggestion'}
                      </span>
                      <span className="text-xs text-[--text-secondary]">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-[--text] line-clamp-2">{ticket.message}</p>
                    <p className="text-xs text-[--text-secondary] mt-1.5">— {ticket.userName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.replies.length > 0 && (
                      <span className="text-xs bg-[--primary-light] text-[--primary] px-2 py-0.5 rounded-full font-medium">
                        {ticket.replies.length} réponse{ticket.replies.length > 1 ? 's' : ''}
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
                      <div key={reply.id} className={`flex gap-3 ${reply.isAdmin ? '' : 'ml-6'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          reply.isAdmin ? 'bg-[--primary]' : 'bg-gray-400'
                        }`}>
                          {reply.userName[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-[--text]">{reply.userName}</span>
                            {reply.isAdmin && <span className="text-[10px] bg-[--primary-light] text-[--primary] px-1.5 py-0.5 rounded-full font-medium">Admin</span>}
                            <span className="text-[10px] text-[--text-secondary]">{new Date(reply.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-sm text-[--text-secondary]">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[--border] px-4 py-3">
                    {replyTicketId === ticket.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                          placeholder={isAdmin ? 'Répondre...' : 'Ajouter un commentaire...'}
                          onKeyDown={e => e.key === 'Enter' && handleReply(ticket.id!)}
                          className="flex-1 border border-[--border] rounded-lg px-3 py-2 text-sm bg-[--surface] text-[--text]" autoFocus />
                        <button onClick={() => handleReply(ticket.id!)} disabled={!replyText.trim()}
                          className="bg-[--primary] text-white px-3 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 transition-colors">
                          <Send className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setReplyTicketId(null); setReplyText('') }}
                          className="text-xs text-gray-400 hover:text-gray-600">Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => setReplyTicketId(ticket.id!)}
                        className="text-xs text-[--primary] hover:underline font-medium">
                        {isAdmin ? '✏️ Répondre' : '💬 Commenter'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
