'use client'

import { useEffect, useState } from 'react'
import {
  Shield, ShieldOff, BookOpen, Tags, Trash2, Users, Activity,
  BarChart3, UserCheck, UserX, ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type AdminUser = {
  id: string
  name: string
  email: string | null
  color: string
  is_admin: boolean
  created_at: string
  lastSignIn: string | null
  readings: number
  plans: number
  contexts: number
}

type AdminStats = {
  totalUsers: number
  activeUsers: number
  totalReadings: number
  totalPlans: number
  totalPlanDays: number
  totalContexts: number
  admins: number
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/users').then(r => r.json())
    if (res.error) { setError(res.error); setLoading(false); return }
    setUsers(res.data.users || [])
    setStats(res.data.stats || null)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (targetId: string, name: string) => {
    if (!confirm(`Supprimer ${name} et toutes ses données ? Cette action est irréversible.`)) return
    setDeletingId(targetId)
    const res = await fetch(`/api/admin/users/${targetId}`, { method: 'DELETE' }).then(r => r.json())
    if (res.error) { alert(res.error); setDeletingId(null); return }
    await loadData()
    setDeletingId(null)
  }

  const handleToggleAdmin = async (targetId: string, current: boolean) => {
    const res = await fetch(`/api/admin/users/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !current }),
    }).then(r => r.json())
    if (res.error) { alert(res.error); return }
    await loadData()
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>

  if (error || !isAdmin) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">Accès refusé</h1>
      <p className="text-gray-500">{error || "Tu n'es pas administrateur."}</p>
    </div>
  )

  const isOnline = (u: AdminUser) =>
    u.lastSignIn && new Date(u.lastSignIn) > new Date(Date.now() - 5 * 60000)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#1e3a5f]" />
          Administration
        </h1>
        <button onClick={loadData} className="flex items-center gap-1.5 text-sm text-[#1e3a5f] hover:underline">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-[#1e3a5f] mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Utilisateurs</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500">{stats.admins} admin · {stats.activeUsers} actifs/7j</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Lectures</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalReadings}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Plans</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalPlans}</p>
            <p className="text-xs text-gray-500">{stats.totalPlanDays} jours</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Tags className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Contextes</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalContexts}</p>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left p-3 font-medium text-gray-600">Email</th>
                <th className="text-center p-3 font-medium text-gray-600">Rôle</th>
                <th className="text-center p-3 font-medium text-gray-600">Statut</th>
                <th className="text-center p-3 font-medium text-gray-600"><BookOpen className="w-4 h-4 inline" /></th>
                <th className="text-center p-3 font-medium text-gray-600">Plans</th>
                <th className="text-left p-3 font-medium text-gray-600">Dernière connexion</th>
                <th className="text-center p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: u.color }}>
                        {u.name[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium">{u.name || 'Sans nom'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 text-xs">{u.email || '—'}</td>
                  <td className="p-3 text-center">
                    {u.is_admin ? (
                      <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Admin</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Utilisateur</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isOnline(u) ? (
                      <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> En ligne
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">{u.readings}</td>
                  <td className="p-3 text-center">{u.plans}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : 'Jamais'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#1e3a5f]"
                        title={u.is_admin ? 'Rétrograder' : 'Promouvoir admin'}
                      >
                        {u.is_admin ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={deletingId === u.id}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        title="Supprimer cet utilisateur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucun utilisateur trouvé.</p>
      )}
    </div>
  )
}
