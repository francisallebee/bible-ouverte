'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus, ChevronDown, Bug, Lightbulb, HelpCircle, MoreHorizontal, Loader } from 'lucide-react'

type Ticket = {
  id: string
  title: string
  description: string
  category: string
  status: string
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  { value: 'bug', label: 'Bug / Incident', icon: Bug },
  { value: 'feature', label: 'Proposition', icon: Lightbulb },
  { value: 'question', label: 'Question', icon: HelpCircle },
  { value: 'other', label: 'Autre', icon: MoreHorizontal },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Ouvert', color: 'text-yellow-600 bg-yellow-50' },
  in_progress: { label: 'En cours', color: 'text-blue-600 bg-blue-50' },
  resolved: { label: 'Résolu', color: 'text-green-600 bg-green-50' },
  closed: { label: 'Fermé', color: 'text-gray-500 bg-gray-100' },
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('bug')
  const [sending, setSending] = useState(false)

  const loadTickets = async () => {
    const res = await fetch('/api/tickets').then(r => r.json())
    setTickets(res.data || [])
    setLoading(false)
  }

  useEffect(() => { loadTickets() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSending(true)
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, category }),
    })
    setSending(false)
    setShowForm(false)
    setTitle(''); setDescription(''); setCategory('bug')
    await loadTickets()
  }

  const CatIcon = CATEGORIES.find(c => c.value === category)?.icon || Bug

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#1e3a5f]" />
          Support
        </h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-[#1e3a5f] text-white px-4 py-3 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Nouveau ticket
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-colors ${
                    category === c.value ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  <c.icon className="w-3.5 h-3.5" /> {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Résume le problème en quelques mots"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="Décris en détail ce qui se passe..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={sending || !title.trim()}
              className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 flex items-center gap-1.5">
              {sending && <Loader className="w-4 h-4 animate-spin" />}
              Envoyer
            </button>
          </div>
        </form>
      )}

      {/* Tickets list */}
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Aucun ticket pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_LABELS[t.status]?.color || ''}`}>
                      {STATUS_LABELS[t.status]?.label || t.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm">{t.title}</h3>
                  {t.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{t.description}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
