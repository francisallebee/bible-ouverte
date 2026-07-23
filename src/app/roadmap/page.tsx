'use client'

import { useEffect, useState } from 'react'
import { Route, Plus, Edit3, Trash2, Loader } from 'lucide-react'
import { getAllRoadmapItems, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem } from '@/lib/storage/roadmap-store'
import { useAuth } from '@/contexts/AuthContext'
import type { RoadmapItem } from '@/lib/storage/types'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planifié', color: 'text-gray-500 bg-gray-100' },
  'in-progress': { label: 'En cours', color: 'text-blue-600 bg-blue-50' },
  done: { label: 'Terminé', color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Annulé', color: 'text-red-500 bg-red-50' },
}

export default function RoadmapPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<RoadmapItem['status']>('planned')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setItems(await getAllRoadmapItems())
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
    if (!confirm('Supprimer cet élément de la feuille de route ?')) return
    await deleteRoadmapItem(id)
    await load()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="w-6 h-6 text-[#1e3a5f]" />
          Feuille de route
        </h1>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-[#1e3a5f] text-white px-4 py-3 rounded-lg text-sm hover:bg-[#2a4f7a] flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Nom de la fonctionnalité"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={3} placeholder="Décris brièvement..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={status} onChange={e => setStatus(e.target.value as RoadmapItem['status'])}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()}
              className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 flex items-center gap-1.5">
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              {editId ? 'Modifier' : 'Ajouter'}
            </button>
            <button onClick={resetForm} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Annuler</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Route className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Aucun élément pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                    </div>
                    <h3 className="font-medium text-sm">{item.title}</h3>
                    {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                      {item.updatedAt !== item.createdAt && ` · modifié ${new Date(item.updatedAt).toLocaleDateString('fr-FR')}`}
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
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6 text-center">
        {isAdmin ? 'Vous pouvez ajouter, modifier ou supprimer des éléments.' : 'Les fonctionnalités à venir seront listées ici.'}
      </p>
    </div>
  )
}
