'use client'

import { useEffect, useMemo, useState } from 'react'
import { Route, Plus, Edit3, Trash2, Loader, ChevronDown, ChevronRight } from 'lucide-react'
import { getAllRoadmapItems, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem, toggleReaction } from '@/lib/storage/roadmap-store'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import type { RoadmapItem } from '@/lib/storage/types'
import { getCurrentUserId } from '@/lib/storage/user-id'

/** Couleur de chaque statut. Les libellés vivent dans les dictionnaires. */
const STATUS_CONFIG: Record<string, { color: string }> = {
  planned: { color: 'text-gray-500 bg-gray-100' },
  projet: { color: 'text-purple-600 bg-purple-50' },
  'in-progress': { color: 'text-blue-600 bg-blue-50' },
  done: { color: 'text-green-600 bg-green-50' },
  cancelled: { color: 'text-red-500 bg-red-50' },
}

/**
 * Ordre d'affichage des groupes : ce qui avance d'abord, ce qui est clos
 * ensuite. Il ne suit pas l'ordre de STATUS_CONFIG, qui sert au menu du
 * formulaire.
 */
const STATUS_ORDER = ['in-progress', 'projet', 'planned', 'done', 'cancelled'] as const

/**
 * Groupes repliés au chargement. Terminé et Annulé n'appellent plus d'action :
 * les replier par défaut est ce qui « gagne de la place », comme le demandait
 * la feuille de route.
 */
const COLLAPSED_BY_DEFAULT = ['done', 'cancelled']

const REACTIONS = ['👍', '👎', '❤️', '🚀']

export default function RoadmapPage() {
  const { isAdmin } = useAuth()
  const { t, locale } = useI18n()
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('default')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<RoadmapItem['status']>('planned')
  const [saving, setSaving] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(COLLAPSED_BY_DEFAULT))

  /**
   * Items regroupés par statut, dans l'ordre d'avancement. Un statut sans
   * aucun item ne produit pas de groupe : la page ne se remplit pas de
   * rubriques vides.
   */
  const groups = useMemo(() => {
    return STATUS_ORDER
      .map(key => ({ key, items: items.filter(i => i.status === key) }))
      .filter(g => g.items.length > 0)
  }, [items])

  const toggleGroup = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const load = async () => {
    setItems(await getAllRoadmapItems())
    setUserId(await getCurrentUserId())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setTitle(''); setDescription(''); setStatus('planned')
    setShowForm(false); setEditId(null)
  }

  const startEdit = (item: RoadmapItem) => {
    setTitle(item.title); setDescription(item.description)
    setStatus(item.status); setEditId(item.id!); setShowForm(true)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    if (editId) {
      await updateRoadmapItem(editId, { title, description, status, updatedAt: new Date().toISOString() })
    } else {
      await addRoadmapItem({ title, description, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    }
    setSaving(false); resetForm(); await load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t.roadmap.confirmDelete)) return
    await deleteRoadmapItem(id)
    await load()
  }

  const handleReaction = async (itemId: number, emoji: string) => {
    await toggleReaction(itemId, emoji)
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="w-6 h-6 text-[--primary]" />
          {t.roadmap.title}
        </h1>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-[--primary] text-white px-4 py-3 rounded-lg text-sm hover:bg-[--primary-hover] flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t.roadmap.add}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-[--surface] rounded-xl border border-[--border] p-5 mb-6 space-y-3 shadow-[--shadow]">
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1">{t.roadmap.itemTitle}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t.roadmap.titlePlaceholder}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1">{t.roadmap.description}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder={t.roadmap.descriptionPlaceholder}
              className="w-full border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--text] mb-1">{t.roadmap.status}</label>
            <select value={status} onChange={e => setStatus(e.target.value as RoadmapItem['status'])}
              className="border border-[--border] rounded-lg px-3 py-2.5 text-sm bg-[--surface] text-[--text]">
              {Object.keys(STATUS_CONFIG).map((k) => (
                <option key={k} value={k}>{t.roadmap.statuses[k]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()}
              className="bg-[--primary] text-white px-4 py-2 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              {editId ? t.common.edit : t.roadmap.add}
            </button>
            <button onClick={resetForm} className="border border-[--border] text-[--text] px-4 py-2 rounded-lg text-sm hover:bg-gray-50">{t.common.cancel}</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">{t.common.loading}</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Route className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>{t.roadmap.empty}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ key, items: groupItems }) => {
            const sc = STATUS_CONFIG[key] || STATUS_CONFIG.planned
            const isOpen = !collapsed.has(key)
            const panelId = `statut-${key}`
            return (
              <section key={key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center gap-2 mb-2 text-left group"
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>{t.roadmap.statuses[key]}</span>
                  <span className="text-xs text-[--text-secondary]">
                    {t.roadmap.itemCount(groupItems.length)}
                  </span>
                </button>

                {isOpen && (
                  <div id={panelId} className="space-y-3">
                    {groupItems.map(item => (
                      <div key={item.id} className="bg-[--surface] rounded-xl border border-[--border] p-4 shadow-[--shadow]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-[--text]">{item.title}</h3>
                            {item.description && <p className="text-xs text-[--text-secondary] mt-1">{item.description}</p>}
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(locale, item.createdAt)}
                              {item.updatedAt !== item.createdAt && t.roadmap.modifiedOn(formatDate(locale, item.updatedAt))}
                            </p>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => item.id && handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[--border]">
                          {REACTIONS.map(emoji => {
                            const count = Object.values(item.reactions ?? {}).filter(v => v === emoji).length
                            return (
                              <button key={emoji} onClick={() => item.id && handleReaction(item.id, emoji)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                                  item.reactions?.[userId] === emoji ? 'bg-[--primary-light] border-[--primary]/20' : 'border-[--border] hover:border-gray-300'
                                }`}>
                                <span className="text-base">{emoji}</span>
                                {count > 0 && <span className="font-medium text-[--primary] text-xs">{count}</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 text-center">
        {isAdmin ? t.roadmap.footerAdmin : t.roadmap.footerUser}
      </p>
    </div>
  )
}
