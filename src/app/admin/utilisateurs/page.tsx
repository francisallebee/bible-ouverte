'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Users, Search, Download, ShieldOff, ArrowLeft, ChevronRight,
  UserCog, Ban, CheckCircle, Trash2, RefreshCw, Mail, FileUser,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { api } from '@/lib/admin/api'
import Composeur from '@/components/admin/Composeur'
import BadgeStatut from '@/components/admin/BadgeStatut'
import {
  SEGMENTS, TRIS, chercher, filtrerParSegment, trier, paginer, versCSV,
} from '@/lib/admin/utilisateurs'
import type { LigneUtilisateur, Segment, Tri, Ordre } from '@/lib/admin/utilisateurs'

const PAR_PAGE = 25

export default function AdminUtilisateursPage() {
  const { isAdmin } = useAuth()
  const { t, locale } = useI18n()

  const [lignes, setLignes] = useState<LigneUtilisateur[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const [recherche, setRecherche] = useState('')
  const [segment, setSegment] = useState<Segment>('tous')
  const [tri, setTri] = useState<Tri>('inscription')
  const [ordre, setOrdre] = useState<Ordre>('desc')
  const [page, setPage] = useState(1)
  const [composer, setComposer] = useState(false)

  const charger = async () => {
    setChargement(true); setErreur('')
    const res = await api('/api/admin/users')
    if (res.error) { setErreur(res.error); setChargement(false); return }
    setLignes(res.data?.users || [])
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  /**
   * Le filtrage se fait **en mémoire**, sur les lignes déjà reçues.
   *
   * `/api/admin/users` rend tout le monde en une fois — c'est son contrat
   * depuis la réécriture du 18 août 2026, et sept requêtes suffisent. Filtrer
   * côté serveur demanderait un aller-retour par frappe au clavier, pour une
   * liste qui tient en mémoire à cette échelle. À revoir le jour où les
   * comptes se compteront en milliers, pas avant.
   */
  const filtrees = useMemo(() => {
    const parSegment = filtrerParSegment(lignes, segment)
    return trier(chercher(parSegment, recherche), tri, ordre)
  }, [lignes, segment, recherche, tri, ordre])

  const pagination = useMemo(
    () => paginer(filtrees.length, PAR_PAGE, page),
    [filtrees.length, page],
  )
  const visibles = filtrees.slice(pagination.debut, pagination.fin)

  // Une recherche ou un segment neufs remettent en page 1 : rester en page 4
  // d'une liste qui n'en compte plus qu'une donnerait un tableau blanc.
  useEffect(() => { setPage(1) }, [recherche, segment])

  const compterSegment = (s: Segment) => filtrerParSegment(lignes, s).length

  const exporter = () => {
    // Ce sont les lignes **filtrées** qui partent, pas les 112 : exporter autre
    // chose que ce qu'on regarde serait une surprise.
    const blob = new Blob([versCSV(filtrees)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `bible-ouverte-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`
    lien.click()
    URL.revokeObjectURL(url)
  }

  const patch = async (id: string, corps: Record<string, unknown>) => {
    setActionId(id)
    const res = await api(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    })
    if (res.error) { alert(res.error); setActionId(null); return }
    await charger(); setActionId(null)
  }

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(t.admin.confirmDelete(nom))) return
    setActionId(id)
    const res = await api(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.error) { alert(res.error); setActionId(null); return }
    await charger(); setActionId(null)
  }

  if (chargement) return <p className="text-gray-500">{t.common.loading}</p>
  if (erreur || !isAdmin) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">{t.admin.denied}</h1>
      <p className="text-gray-500">{erreur || t.admin.notAdmin}</p>
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[--primary] hover:underline no-underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t.admin.backToAdmin}
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2 mt-1">
            <Users className="w-6 h-6 text-[--primary]" />
            {t.admin.usersTitle}
            <span className="text-sm font-normal text-gray-500">{t.admin.usersSubtitle(lignes.length)}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={charger}
            className="flex items-center gap-1.5 text-sm text-[--primary] hover:underline">
            <RefreshCw className="w-4 h-4" /> {t.admin.refresh}
          </button>
          <button onClick={exporter}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300">
            <Download className="w-4 h-4" /> {t.admin.exportCsv}
          </button>
        </div>
      </div>

      {/* Recherche et tri */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t.admin.searchPlaceholder}
            aria-label={t.admin.searchPlaceholder}
            className="w-full rounded-lg border border-gray-300 ps-9 pe-3 py-2 text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="tri" className="text-xs text-gray-500">{t.admin.sortLabel}</label>
          <select id="tri" value={tri} onChange={(e) => setTri(e.target.value as Tri)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            {TRIS.map((v) => <option key={v} value={v}>{t.admin.sorts[v]}</option>)}
          </select>
          <button onClick={() => setOrdre(ordre === 'asc' ? 'desc' : 'asc')}
            aria-label={t.admin.sortLabel}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400">
            {ordre === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Segments */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTS.map((s) => (
          <button key={s} onClick={() => setSegment(s)}
            className={`px-3 py-1.5 rounded-lg text-xs border ${segment === s ? 'border-[--primary] bg-[--primary] text-white' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {t.admin.segments[s]} ({compterSegment(s)})
          </button>
        ))}
      </div>

      {/* Envoi groupé. Les destinataires sont les lignes **filtrées**, pas la
          page affichée : écrire aux 25 d'une page alors qu'on vient de
          sélectionner un segment de 40 serait un piège. */}
      {filtrees.length > 0 && (
        <div className="mb-4">
          <button onClick={() => setComposer(!composer)}
            aria-expanded={composer}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-gray-300">
            <Mail className="w-4 h-4" />
            {t.messages.writeToSelection(filtrees.length)}
          </button>
          {composer && (
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4">
              <Composeur
                destinataires={filtrees.map((u) => u.id)}
                libelleBouton={t.messages.send}
                confirmation={filtrees.length > 1 ? t.messages.confirmBulk(filtrees.length) : undefined}
                onEnvoye={() => setComposer(false)}
              />
            </div>
          )}
        </div>
      )}

      {visibles.length === 0 ? (
        <p className="text-gray-400 text-center py-12">{t.admin.noResult}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-start p-3 font-medium text-gray-600">{t.admin.colUser}</th>
                  <th className="text-start p-3 font-medium text-gray-600 hidden md:table-cell">{t.admin.colEmail}</th>
                  <th className="text-start p-3 font-medium text-gray-600 hidden lg:table-cell">{t.profile.city}</th>
                  <th className="text-center p-3 font-medium text-gray-600">{t.admin.colRole}</th>
                  <th className="text-center p-3 font-medium text-gray-600">{t.admin.colStatus}</th>
                  <th className="text-center p-3 font-medium text-gray-600">{t.progress.chaptersRead}</th>
                  <th className="text-start p-3 font-medium text-gray-600 hidden lg:table-cell">{t.admin.colLastSignIn}</th>
                  <th className="text-center p-3 font-medium text-gray-600">{t.admin.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((u) => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-gray-50 ${u.suspended ? 'opacity-60' : ''}`}>
                    <td className="p-3">
                      <Link href={`/admin/utilisateurs/${u.id}`}
                        className="flex items-center gap-2 no-underline text-inherit">
                        <div className="w-7 h-7 rounded-full bg-[--primary] flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <span className="font-medium block leading-tight">{u.name || t.admin.noName}</span>
                          <span className="text-xs text-gray-400 md:hidden">{u.email || ''}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 rtl:rotate-180" />
                      </Link>
                    </td>
                    <td className="p-3 text-gray-600 text-xs hidden md:table-cell">{u.email || '—'}</td>
                    <td className="p-3 text-gray-600 text-xs hidden lg:table-cell">{u.city || '—'}</td>
                    <td className="p-3 text-center">
                      {u.is_admin
                        ? <span className="text-green-700 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">{t.admin.roleAdmin}</span>
                        : <span className="text-gray-400 text-xs">{t.admin.roleUser}</span>}
                    </td>
                    <td className="p-3 text-center"><BadgeStatut compte={u} /></td>
                    <td className="p-3 text-center">{u.readings}</td>
                    <td className="p-3 text-xs text-gray-500 hidden lg:table-cell">
                      {u.lastSignIn
                        ? formatDate(locale, u.lastSignIn, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : t.admin.never}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => patch(u.id, { is_admin: !u.is_admin })} disabled={actionId === u.id}
                          aria-label={u.is_admin ? t.admin.demote : t.admin.promote}
                          title={u.is_admin ? t.admin.demote : t.admin.promote}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[--primary] disabled:opacity-30">
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button onClick={() => patch(u.id, { suspended: !u.suspended })} disabled={actionId === u.id}
                          aria-label={u.suspended ? t.admin.reactivate : t.admin.suspend}
                          title={u.suspended ? t.admin.reactivate : t.admin.suspend}
                          className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 ${u.suspended ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-red-600'}`}>
                          {u.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button onClick={() => supprimer(u.id, u.name)} disabled={actionId === u.id}
                          aria-label={t.common.delete} title={t.common.delete}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {/* Le nom est déjà un lien, mais rien ne le disait :
                            un bouton nommé vaut mieux qu'une zone cliquable
                            qu'il faut deviner. */}
                        <Link href={`/admin/utilisateurs/${u.id}`}
                          aria-label={t.admin.openFiche} title={t.admin.openFiche}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-[--primary] no-underline">
                          <FileUser className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtrees.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p className="text-xs text-gray-500">
            {t.admin.showing(pagination.debut + 1, pagination.fin, pagination.total)}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 disabled:opacity-30">
              {t.admin.previous}
            </button>
            <span className="text-xs text-gray-500">{t.admin.pageOf(pagination.page, pagination.pages)}</span>
            <button onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-gray-300 disabled:opacity-30">
              {t.admin.next}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
