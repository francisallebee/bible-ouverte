'use client'

import { useEffect, useState } from 'react'
import {
  Shield, ShieldOff, BookOpen, Tags, Trash2, Users, Activity,
  BarChart3, Ban, CheckCircle, RefreshCw, UserCog,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type AdminUser = {
  id: string
  name: string
  email: string | null
  color: string
  is_admin: boolean
  suspended: boolean
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
  const [actionId, setActionId] = useState<string | null>(null)

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
    if (!confirm(`Supprimer ${name} et toutes ses données ? Action irréversible.`)) return
    setActionId(targetId)
    const res = await fetch(`/api/admin/users/${targetId}`, { method: 'DELETE' }).then(r => r.json())
    if (res.error) { alert(res.error); setActionId(null); return }
    await loadData()
    setActionId(null)
  }

  const handleToggleAdmin = async (targetId: string, current: boolean) => {
    setActionId(targetId)
    await fetch(`/api/admin/users/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: !current }),
    })
    await loadData()
    setActionId(null)
  }

  const handleToggleSuspend = async (targetId: string, current: boolean) => {
    setActionId(targetId)
    await fetch(`/api/admin/users/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspended: !current }),
    })
    await loadData()
    setActionId(null)
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

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Users className="w-4 h-4" />} label="Utilisateurs" value={stats.totalUsers}
            sub={`${stats.admins} admin · ${stats.activeUsers} actifs/7j`} color="text-[#1e3a5f]" />
          <StatCard icon={<BookOpen className="w-4 h-4" />} label="Lectures" value={stats.totalReadings}
            color="text-green-600" />
          <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Plans" value={stats.totalPlans}
            sub={`${stats.totalPlanDays} jours`} color="text-blue-600" />
          <StatCard icon={<Tags className="w-4 h-4" />} label="Contextes" value={stats.totalContexts}
            color="text-purple-600" />
          <StatCard icon={<Ban className="w-4 h-4" />} label="Suspendus"
            value={users.filter(u => u.suspended).length}
            sub={`${users.filter(u => u.suspended && isOnline(u)).length} en ligne`} color="text-red-600" />
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 font-medium text-gray-600">Utilisateur</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-center p-3 font-medium text-gray-600">Rôle</th>
                <th className="text-center p-3 font-medium text-gray-600">Statut</th>
                <th className="text-center p-3 font-medium text-gray-600"><BookOpen className="w-4 h-4 inline" /></th>
                <th className="text-center p-3 font-medium text-gray-600 hidden sm:table-cell">Plans</th>
                <th className="text-left p-3 font-medium text-gray-600 hidden lg:table-cell">Connexion</th>
                <th className="text-center p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${u.suspended ? 'opacity-60' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: u.color }}>
                        {u.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <span className="font-medium block leading-tight">{u.name || 'Sans nom'}</span>
                        <span className="text-xs text-gray-400 sm:hidden">{u.email || ''}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 text-xs hidden sm:table-cell">{u.email || '—'}</td>
                  <td className="p-3 text-center">
                    {u.is_admin ? (
                      <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Admin</span>
                    ) : (
                      <span className="text-gray-400 text-xs">User</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {u.suspended ? (
                      <span className="flex items-center justify-center gap-1 text-red-600 text-xs">
                        <Ban className="w-3 h-3" /> Suspendu
                      </span>
                    ) : isOnline(u) ? (
                      <span className="flex items-center justify-center gap-1 text-green-600 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> En ligne
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Hors ligne</span>
                    )}
                  </td>
                  <td className="p-3 text-center">{u.readings}</td>
                  <td className="p-3 text-center hidden sm:table-cell">{u.plans}</td>
                  <td className="p-3 text-xs text-gray-500 hidden lg:table-cell">
                    {u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : 'Jamais'}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Toggle admin */}
                      <button
                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                        disabled={actionId === u.id}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#1e3a5f] disabled:opacity-30"
                        title={u.is_admin ? 'Rétrograder utilisateur' : 'Promouvoir admin'}
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      {/* Suspend / Unsuspend */}
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.suspended)}
                        disabled={actionId === u.id}
                        className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 ${
                          u.suspended ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-red-600'
                        }`}
                        title={u.suspended ? 'Réactiver' : 'Suspendre'}
                      >
                        {u.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={actionId === u.id}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30"
                        title="Supprimer définitivement"
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

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`flex items-center gap-2 ${color} mb-1`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
