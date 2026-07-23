'use client'

import { useEffect, useState } from 'react'
import {
  Shield, ShieldOff, BookOpen, Tags, Trash2, Users, Ban, CheckCircle,
  RefreshCw, UserCog, MessageSquare, Bug, Lightbulb, HelpCircle,
  MoreHorizontal, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/* ---------- types ---------- */
type AdminUser = {
  id: string; name: string; email: string | null; color: string
  is_admin: boolean; suspended: boolean; created_at: string
  lastSignIn: string | null; readings: number; plans: number; contexts: number
}

type AdminStats = {
  totalUsers: number; activeUsers: number; totalReadings: number
  totalPlans: number; totalPlanDays: number; totalContexts: number; admins: number
}

type Ticket = {
  id: string; user_id: string; title: string; description: string
  category: string; status: string; created_at: string; updated_at: string
  user_name: string; user_email: string | null; user_avatar: string | null
}

const CATEGORIES: Record<string, { label: string; icon: any }> = {
  bug: { label: 'Bug', icon: Bug },
  feature: { label: 'Proposition', icon: Lightbulb },
  question: { label: 'Question', icon: HelpCircle },
  other: { label: 'Autre', icon: MoreHorizontal },
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']

const STATUS_BADGE: Record<string, string> = {
  open: 'text-yellow-600 bg-yellow-50',
  in_progress: 'text-blue-600 bg-blue-50',
  resolved: 'text-green-600 bg-green-50',
  closed: 'text-gray-500 bg-gray-100',
}

/* ---------- components ---------- */
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number; sub?: string; color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`flex items-center gap-2 ${color} mb-1`}>{icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

/* ---------- page ---------- */
export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = useState<'users' | 'tickets'>('users')

  /* users state */
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  /* tickets state */
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  /* load users */
  const loadData = async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/admin/users').then(r => r.json())
    if (res.error) { setError(res.error); setLoading(false); return }
    setUsers(res.data.users || []); setStats(res.data.stats || null); setLoading(false)
  }

  /* load tickets */
  const loadTickets = async () => {
    setLoadingTickets(true)
    const res = await fetch('/api/admin/tickets').then(r => r.json())
    setTickets(res.data || []); setLoadingTickets(false)
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer ${name} et toutes ses données ?`)) return
    setActionId(id)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' }).then(r => r.json())
    if (res.error) { alert(res.error); setActionId(null); return }
    await loadData(); setActionId(null)
  }

  const handleToggleAdmin = async (id: string, current: boolean) => {
    setActionId(id)
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_admin: !current }) })
    await loadData(); setActionId(null)
  }

  const handleToggleSuspend = async (id: string, current: boolean) => {
    setActionId(id)
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: !current }) })
    await loadData(); setActionId(null)
  }

  const handleTicketStatus = async (id: string, status: string) => {
    await fetch('/api/admin/tickets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
    await loadTickets()
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>
  if (error || !isAdmin) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">Accès refusé</h1>
      <p className="text-gray-500">{error || "Tu n'es pas administrateur."}</p>
    </div>
  )

  const isOnline = (u: AdminUser) => u.lastSignIn && new Date(u.lastSignIn) > new Date(Date.now() - 5 * 60000)
  const filteredTickets = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#1e3a5f]" /> Administration
        </h1>
        <button onClick={tab === 'users' ? loadData : loadTickets}
          className="flex items-center gap-1.5 text-sm text-[#1e3a5f] hover:underline">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('users')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4 inline mr-1.5" />Utilisateurs
        </button>
        <button onClick={() => { setTab('tickets'); if (tickets.length === 0) loadTickets() }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'tickets' ? 'border-[#1e3a5f] text-[#1e3a5f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <MessageSquare className="w-4 h-4 inline mr-1.5" />Tickets{' '}
          {tickets.length > 0 && <span className="text-xs ml-1">({tickets.length})</span>}
        </button>
      </div>

      {/* === USERS TAB === */}
      {tab === 'users' && (
        <>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <StatCard icon={<Users className="w-4 h-4" />} label="Utilisateurs" value={stats.totalUsers}
                sub={`${stats.admins} admin · ${stats.activeUsers} actifs/7j`} color="text-[#1e3a5f]" />
              <StatCard icon={<BookOpen className="w-4 h-4" />} label="Lectures" value={stats.totalReadings} color="text-green-600" />
              <StatCard icon={<Ban className="w-4 h-4" />} label="Suspendus" value={users.filter(u => u.suspended).length} color="text-red-600" />
              <StatCard icon={<Users className="w-4 h-4" />} label="Plans" value={stats.totalPlans}
                sub={`${stats.totalPlanDays} jours`} color="text-blue-600" />
              <StatCard icon={<Tags className="w-4 h-4" />} label="Contextes" value={stats.totalContexts} color="text-purple-600" />
            </div>
          )}

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
                      <td className="p-3"><div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: u.color }}>{u.name[0]?.toUpperCase() || '?'}</div>
                        <div><span className="font-medium block leading-tight">{u.name || 'Sans nom'}</span><span className="text-xs text-gray-400 sm:hidden">{u.email || ''}</span></div>
                      </div></td>
                      <td className="p-3 text-gray-600 text-xs hidden sm:table-cell">{u.email || '—'}</td>
                      <td className="p-3 text-center">{u.is_admin ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Admin</span> : <span className="text-gray-400 text-xs">User</span>}</td>
                      <td className="p-3 text-center">{u.suspended ? <span className="flex items-center justify-center gap-1 text-red-600 text-xs"><Ban className="w-3 h-3" /> Suspendu</span> : isOnline(u) ? <span className="flex items-center justify-center gap-1 text-green-600 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> En ligne</span> : <span className="text-gray-400 text-xs">Hors ligne</span>}</td>
                      <td className="p-3 text-center">{u.readings}</td>
                      <td className="p-3 text-center hidden sm:table-cell">{u.plans}</td>
                      <td className="p-3 text-xs text-gray-500 hidden lg:table-cell">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}</td>
                      <td className="p-3"><div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleToggleAdmin(u.id, u.is_admin)} disabled={actionId === u.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[#1e3a5f] disabled:opacity-30" title={u.is_admin ? 'Rétrograder' : 'Promouvoir admin'}><UserCog className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleSuspend(u.id, u.suspended)} disabled={actionId === u.id} className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 ${u.suspended ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-red-600'}`} title={u.suspended ? 'Réactiver' : 'Suspendre'}>{u.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                        <button onClick={() => handleDelete(u.id, u.name)} disabled={actionId === u.id} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* === TICKETS TAB === */}
      {tab === 'tickets' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs border ${!statusFilter ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              Tous ({tickets.length})
            </button>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${statusFilter === s ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {STATUS_BADGE[s] ? s.replace('_', ' ') : s} ({tickets.filter(t => t.status === s).length})
              </button>
            ))}
          </div>

          {loadingTickets ? (
            <p className="text-gray-500">Chargement...</p>
          ) : filteredTickets.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Aucun ticket</p>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(t => {
                const cat = CATEGORIES[t.category] || { label: t.category, icon: MoreHorizontal }
                const CatIcon = cat.icon
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <CatIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] || ''}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">{cat.label}</span>
                          </div>
                          <h3 className="font-medium text-sm">{t.title}</h3>
                          {t.description && <p className="text-xs text-gray-600 mt-1">{t.description}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>Par {t.user_name}</span>
                            <span>·</span>
                            <span>{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      {/* Status selector */}
                      <div className="relative group shrink-0">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] hidden group-hover:block z-10">
                          {STATUS_OPTIONS.map(s => (
                            <button key={s} onClick={() => handleTicketStatus(t.id, s)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${t.status === s ? 'font-medium text-[#1e3a5f]' : 'text-gray-600'}`}>
                              {STATUS_BADGE[s] && <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_BADGE[s].replace('text-', 'bg-').split(' ')[0]}`} />}
                              {s.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
