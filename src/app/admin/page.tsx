'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Shield, ShieldOff, BookOpen, Tags, Users, Ban,
  RefreshCw, MessageSquare, Bug, Lightbulb,
  MoreHorizontal, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { TICKET_STATUSES, TICKET_STATUS_BADGE } from '@/lib/tickets'
import { api } from '@/lib/admin/api'

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

          {/* La gestion vit désormais sur son propre écran.
              Le tableau qui était ici a été retiré plutôt que dupliqué : deux
              listes d'utilisateurs sur deux écrans auraient divergé au premier
              correctif appliqué à une seule. */}
          <Link href="/admin/utilisateurs"
            className="flex items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-5 no-underline text-inherit hover:border-gray-300 transition-colors">
            <span className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[--primary]" />
              <span>
                <span className="font-semibold block">{t.admin.manageUsers}</span>
                <span className="text-sm text-gray-500">{t.admin.usersSubtitle(users.length)}</span>
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 rtl:rotate-180" />
          </Link>
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
                        <button aria-label={t.admin.changeStatus}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
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
