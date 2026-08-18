'use client'

import { useEffect, useState } from 'react'
import {
  Shield, ShieldOff, BookOpen, Tags, Trash2, Users, Ban, CheckCircle,
  RefreshCw, UserCog, MessageSquare, Bug, Lightbulb,
  MoreHorizontal, ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { TICKET_STATUSES, TICKET_STATUS_BADGE } from '@/lib/tickets'

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
  id: number; user_id: string; userName: string; type: string
  message: string; status: string; replies: any[]
  createdAt: string; updatedAt: string
}

/** Icône par catégorie. Les libellés vivent dans les dictionnaires. */
const CATEGORIES: Record<string, { icon: any }> = {
  bug: { icon: Bug },
  suggestion: { icon: Lightbulb },
}


/**
 * Une réponse non lue est une panne invisible.
 *
 * Les trois actions de cet écran — promouvoir, suspendre, changer le statut
 * d'un ticket — lançaient leur `fetch` sans jamais regarder ce qui revenait :
 * un 403 de `checkAdmin` ou un 500 de la base rendaient exactement le même
 * écran qu'un succès. Seule la suppression testait `res.error`.
 *
 * `cache: 'no-store'` sur les lectures pour la raison symétrique : une réponse
 * servie par le cache du navigateur affiche un état que le serveur n'a plus.
 */
async function api(url: string, init?: RequestInit): Promise<{ data?: any; error?: string }> {
  try {
    const res = await fetch(url, { cache: 'no-store', ...init })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { error: body?.error || `HTTP ${res.status}` }
    if (body?.error) return { error: body.error }
    return { data: body?.data }
  } catch (e: any) {
    // `String(e)` et non `e.message` : un rejet sans message rendrait une
    // erreur vide, que l'appelant prendrait pour un succès.
    return { error: e?.message || String(e) }
  }
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
  const { t, locale } = useI18n()
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
  const [ticketsError, setTicketsError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  /* load users */
  const loadData = async () => {
    setLoading(true); setError('')
    const res = await api('/api/admin/users')
    if (res.error) { setError(res.error); setLoading(false); return }
    setUsers(res.data?.users || []); setStats(res.data?.stats || null); setLoading(false)
  }

  /* load tickets */
  const loadTickets = async () => {
    setLoadingTickets(true); setTicketsError('')
    const res = await api('/api/admin/tickets')
    if (res.error) { setTicketsError(res.error); setTickets([]); setLoadingTickets(false); return }
    setTickets(res.data || []); setLoadingTickets(false)
  }

  useEffect(() => { loadData() }, [])

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    setActionId(id)
    const res = await api(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.error) { alert(res.error); setActionId(null); return }
    await loadData(); setActionId(null)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t.admin.confirmDelete(name))) return
    setActionId(id)
    const res = await api(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.error) { alert(res.error); setActionId(null); return }
    await loadData(); setActionId(null)
  }

  const handleToggleAdmin = (id: string, current: boolean) => patchUser(id, { is_admin: !current })

  const handleToggleSuspend = (id: string, current: boolean) => patchUser(id, { suspended: !current })

  const handleTicketStatus = async (id: number, status: string) => {
    const res = await api('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.error) { alert(res.error); return }
    await loadTickets()
  }

  if (loading) return <p className="text-gray-500">{t.common.loading}</p>
  if (error || !isAdmin) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">{t.admin.denied}</h1>
      <p className="text-gray-500">{error || t.admin.notAdmin}</p>
    </div>
  )

  const isOnline = (u: AdminUser) => u.lastSignIn && new Date(u.lastSignIn) > new Date(Date.now() - 5 * 60000)
  const filteredTickets = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-[--primary]" /> {t.admin.title}
        </h1>
        <button onClick={tab === 'users' ? loadData : loadTickets}
          className="flex items-center gap-1.5 text-sm text-[--primary] hover:underline">
          <RefreshCw className="w-4 h-4" /> {t.admin.refresh}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button onClick={() => setTab('users')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-[--primary] text-[--primary]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Users className="w-4 h-4 inline me-1.5" />{t.admin.tabUsers}
        </button>
        <button onClick={() => { setTab('tickets'); if (tickets.length === 0) loadTickets() }}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'tickets' ? 'border-[--primary] text-[--primary]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <MessageSquare className="w-4 h-4 inline me-1.5" />{t.admin.tabTickets}{' '}
          {tickets.length > 0 && <span className="text-xs ms-1">({tickets.length})</span>}
        </button>
      </div>

      {/* === USERS TAB === */}
      {tab === 'users' && (
        <>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <StatCard icon={<Users className="w-4 h-4" />} label={t.admin.statUsers} value={stats.totalUsers}
                sub={t.admin.statUsersSub(stats.admins, stats.activeUsers)} color="text-[--primary]" />
              <StatCard icon={<BookOpen className="w-4 h-4" />} label={t.admin.statReadings} value={stats.totalReadings} color="text-green-600" />
              <StatCard icon={<Ban className="w-4 h-4" />} label={t.admin.statSuspended} value={users.filter(u => u.suspended).length} color="text-red-600" />
              <StatCard icon={<Users className="w-4 h-4" />} label={t.admin.statPlans} value={stats.totalPlans}
                sub={t.admin.statPlanDays(stats.totalPlanDays)} color="text-blue-600" />
              <StatCard icon={<Tags className="w-4 h-4" />} label={t.admin.statContexts} value={stats.totalContexts} color="text-purple-600" />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-start p-3 font-medium text-gray-600">{t.admin.colUser}</th>
                    <th className="text-start p-3 font-medium text-gray-600 hidden sm:table-cell">{t.admin.colEmail}</th>
                    <th className="text-center p-3 font-medium text-gray-600">{t.admin.colRole}</th>
                    <th className="text-center p-3 font-medium text-gray-600">{t.admin.colStatus}</th>
                    <th className="text-center p-3 font-medium text-gray-600"><BookOpen className="w-4 h-4 inline" /></th>
                    <th className="text-center p-3 font-medium text-gray-600 hidden sm:table-cell">{t.admin.colPlans}</th>
                    <th className="text-start p-3 font-medium text-gray-600 hidden lg:table-cell">{t.admin.colLastSignIn}</th>
                    <th className="text-center p-3 font-medium text-gray-600">{t.admin.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${u.suspended ? 'opacity-60' : ''}`}>
                      <td className="p-3"><div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: u.color }}>{u.name[0]?.toUpperCase() || '?'}</div>
                        <div><span className="font-medium block leading-tight">{u.name || t.admin.noName}</span><span className="text-xs text-gray-400 sm:hidden">{u.email || ''}</span></div>
                      </div></td>
                      <td className="p-3 text-gray-600 text-xs hidden sm:table-cell">{u.email || '—'}</td>
                      <td className="p-3 text-center">{u.is_admin ? <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">{t.admin.roleAdmin}</span> : <span className="text-gray-400 text-xs">{t.admin.roleUser}</span>}</td>
                      <td className="p-3 text-center">{u.suspended ? <span className="flex items-center justify-center gap-1 text-red-600 text-xs"><Ban className="w-3 h-3" /> {t.admin.suspended}</span> : isOnline(u) ? <span className="flex items-center justify-center gap-1 text-green-600 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t.admin.online}</span> : <span className="text-gray-400 text-xs">{t.admin.offline}</span>}</td>
                      <td className="p-3 text-center">{u.readings}</td>
                      <td className="p-3 text-center hidden sm:table-cell">{u.plans}</td>
                      <td className="p-3 text-xs text-gray-500 hidden lg:table-cell">{u.lastSignIn ? formatDate(locale, u.lastSignIn, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t.admin.never}</td>
                      <td className="p-3"><div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleToggleAdmin(u.id, u.is_admin)} disabled={actionId === u.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[--primary] disabled:opacity-30" title={u.is_admin ? t.admin.demote : t.admin.promote}><UserCog className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleSuspend(u.id, u.suspended)} disabled={actionId === u.id} className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 ${u.suspended ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-red-600'}`} title={u.suspended ? t.admin.reactivate : t.admin.suspend}>{u.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                        <button onClick={() => handleDelete(u.id, u.name)} disabled={actionId === u.id} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30" title={t.common.delete}><Trash2 className="w-4 h-4" /></button>
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
              className={`px-3 py-1.5 rounded-lg text-xs border ${!statusFilter ? 'border-[--primary] bg-[--primary] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {t.admin.allTickets(tickets.length)}
            </button>
            {TICKET_STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs border ${statusFilter === s ? 'border-[--primary] bg-[--primary] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t.common.ticketStatuses[s] ?? s} ({tickets.filter(x => x.status === s).length})
              </button>
            ))}
          </div>

          {ticketsError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{ticketsError}</p>
          )}

          {loadingTickets ? (
            <p className="text-gray-500">{t.common.loading}</p>
          ) : filteredTickets.length === 0 ? (
            <p className="text-gray-400 text-center py-12">{t.admin.noTicket}</p>
          ) : (
            <div className="space-y-3">
              {/* `ticket` et non `t` : `t` est le dictionnaire. */}
              {filteredTickets.map(ticket => {
                const cat = CATEGORIES[ticket.type] || { icon: MoreHorizontal }
                const CatIcon = cat.icon
                return (
                  <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <CatIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TICKET_STATUS_BADGE[ticket.status] || ''}`}>
                              {t.common.ticketStatuses[ticket.status] ?? ticket.status}
                            </span>
                            <span className="text-xs text-gray-400">{t.admin.categories[ticket.type] ?? ticket.type}</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span>{t.admin.by(ticket.userName)}</span>
                            <span>·</span>
                            <span>{formatDate(locale, ticket.createdAt)}</span>
                            {ticket.replies?.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{t.admin.replyCount(ticket.replies.length)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Status selector */}
                      <div className="relative group shrink-0">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="absolute end-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] hidden group-hover:block z-10">
                          {TICKET_STATUSES.map(s => (
                            <button key={s} onClick={() => handleTicketStatus(ticket.id, s)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${ticket.status === s ? 'font-medium text-[--primary]' : 'text-gray-600'}`}>
                              {TICKET_STATUS_BADGE[s] && <span className={`inline-block w-2 h-2 rounded-full mr-2 ${TICKET_STATUS_BADGE[s].replace('text-', 'bg-').split(' ')[0]}`} />}
                              {t.common.ticketStatuses[s] ?? s}
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
