'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ShieldOff, UserCog, Ban, CheckCircle, Trash2, Mail, MailCheck,
  BookOpen, Layers, Tags, Bell, Brain, Gamepad2, CalendarDays, MessageSquare, Shield,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n, useBookName } from '@/contexts/I18nContext'
import { formatDate } from '@/lib/i18n/format'
import { api } from '@/lib/admin/api'
import { nomAffiche } from '@/lib/profil/identite'
import { TICKET_STATUS_BADGE } from '@/lib/tickets'
import BadgeStatut from '@/components/admin/BadgeStatut'
import Composeur from '@/components/admin/Composeur'
import { getFilDe } from '@/lib/storage/messages-store'
import { ordonnerFil } from '@/lib/messages/messages'
import type { Message } from '@/lib/messages/messages'

type Fiche = {
  profil: Record<string, any>
  auth: { email: string | null; lastSignIn: string | null; createdAt: string | null; confirmedAt: string | null }
  compteurs: Record<string, number>
  dernieresLectures: any[]
  plans: any[]
  tickets: any[]
  reglages: Record<string, any> | null
}

function Carte({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold mb-3">{titre}</h2>
      {children}
    </div>
  )
}

function Champ({ label, valeur, repli }: { label: string; valeur?: string | null; repli: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm text-end ${valeur ? '' : 'text-gray-400'}`}>{valeur || repli}</span>
    </div>
  )
}

function Compteur({ icone, label, valeur }: { icone: React.ReactNode; label: string; valeur: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-1.5 text-gray-500 mb-1">{icone}<span className="text-[11px] uppercase tracking-wide">{label}</span></div>
      <p className="text-xl font-bold">{valeur}</p>
    </div>
  )
}

export default function FicheUtilisateurPage() {
  const { isAdmin } = useAuth()
  const { t, locale } = useI18n()
  const nomDuLivre = useBookName()
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [fiche, setFiche] = useState<Fiche | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [fil, setFil] = useState<Message[]>([])

  // `useCallback` plutôt qu'un `eslint-disable` : la fonction dépend de
  // `params.id`, et l'effet doit la relancer quand il change.
  const charger = useCallback(async () => {
    setChargement(true); setErreur('')
    const res = await api(`/api/admin/users/${params.id}`)
    if (res.error) { setErreur(res.error); setChargement(false); return }
    setFiche(res.data as Fiche)
    setChargement(false)
  }, [params.id])

  useEffect(() => { charger() }, [charger])

  /**
   * Le fil se lit **directement dans Supabase**, avec la session de
   * l'administrateur : la policy `messages_select` l'y autorise. Passer par une
   * route serait un aller-retour de plus pour la même donnée, et une occasion
   * de plus de désaccorder les deux chemins.
   */
  const chargerFil = useCallback(async () => {
    setFil(ordonnerFil(await getFilDe(params.id)))
  }, [params.id])

  useEffect(() => { chargerFil() }, [chargerFil])

  const patch = async (corps: Record<string, unknown>) => {
    setOccupe(true)
    const res = await api(`/api/admin/users/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    })
    if (res.error) { alert(res.error); setOccupe(false); return }
    await charger(); setOccupe(false)
  }

  const supprimer = async () => {
    if (!fiche) return
    if (!confirm(t.admin.confirmDelete(fiche.profil.name || ''))) return
    setOccupe(true)
    const res = await api(`/api/admin/users/${params.id}`, { method: 'DELETE' })
    if (res.error) { alert(res.error); setOccupe(false); return }
    // La fiche n'existe plus : rester dessus afficherait un 404.
    router.push('/admin/utilisateurs')
  }

  if (chargement) return <p className="text-gray-500">{t.common.loading}</p>
  if (!isAdmin || erreur || !fiche) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">
        {isAdmin ? t.admin.ficheNotFound : t.admin.denied}
      </h1>
      <p className="text-gray-500">{erreur || t.admin.notAdmin}</p>
      <Link href="/admin/utilisateurs" className="inline-block mt-4 text-sm text-[--primary]">
        {t.admin.usersTitle}
      </Link>
    </div>
  )

  const p = fiche.profil
  const nom = nomAffiche({ firstName: p.first_name, lastName: p.last_name, name: p.name }, t.admin.noName)
  const absent = t.admin.ficheNotProvided
  const date = (iso: string | null | undefined) =>
    iso ? formatDate(locale, iso, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

  return (
    <div className="max-w-4xl">
      <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1.5 text-sm text-[--primary] hover:underline no-underline">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t.admin.usersTitle}
      </Link>

      {/* En-tête */}
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-4">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt="" width="56" height="56"
            className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-gray-100" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[--primary] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {nom[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold">{nom}</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />{fiche.auth.email || absent}
          </p>
        </div>
        {/* Le statut, en grand et en couleur : c'est la première chose qu'on
            vient lire sur une fiche. Même composant que la liste — deux
            pastilles séparées avaient déjà divergé une fois. */}
        <div className="flex flex-wrap items-center gap-2">
          <BadgeStatut compte={{ suspended: !!p.suspended, lastSignIn: fiche.auth.lastSignIn }} taille="grande" />
          {p.is_admin && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[--primary-light] px-2.5 py-1 text-sm font-medium text-[--primary]">
              <Shield className="w-4 h-4" />{t.admin.roleAdmin}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => patch({ is_admin: !p.is_admin })} disabled={occupe}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-gray-300 disabled:opacity-40">
          <UserCog className="w-4 h-4" />{p.is_admin ? t.admin.demote : t.admin.promote}
        </button>
        <button onClick={() => patch({ suspended: !p.suspended })} disabled={occupe}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:border-gray-300 disabled:opacity-40">
          {p.suspended ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
          {p.suspended ? t.admin.reactivate : t.admin.suspend}
        </button>
        <button onClick={supprimer} disabled={occupe}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40">
          <Trash2 className="w-4 h-4" />{t.common.delete}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Carte titre={t.admin.ficheIdentity}>
          <Champ label={t.profile.firstName} valeur={p.first_name} repli={absent} />
          <Champ label={t.profile.lastName} valeur={p.last_name} repli={absent} />
          <Champ label={t.profile.city} valeur={p.city} repli={absent} />
          <Champ label={t.profile.phone} valeur={p.phone} repli={absent} />
          <Champ label={t.profile.birthDate} valeur={p.birth_date} repli={absent} />
          <Champ
            label={t.authScreens.discoverySource}
            valeur={p.discovery_source ? t.authScreens.discoverySources[p.discovery_source] : null}
            repli={absent}
          />
          <Champ label={t.profile.bio} valeur={p.bio} repli={absent} />
          <Champ
            label={t.profile.socials}
            valeur={Object.entries(p.social_links ?? {})
              .filter(([, v]) => v)
              .map(([k, v]) => `${k} : ${v}`)
              .join(' · ') || null}
            repli={absent}
          />
        </Carte>

        <Carte titre={t.admin.ficheAccount}>
          <Champ label={t.admin.colEmail} valeur={fiche.auth.email} repli={absent} />
          <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-gray-100">
            <span className="text-xs text-gray-500">{t.admin.colStatus}</span>
            <span className={`text-sm inline-flex items-center gap-1 ${fiche.auth.confirmedAt ? 'text-green-700' : 'text-amber-700'}`}>
              <MailCheck className="w-3.5 h-3.5" />
              {fiche.auth.confirmedAt ? t.admin.ficheEmailConfirmed : t.admin.ficheEmailPending}
            </span>
          </div>
          <Champ label={t.admin.ficheSignedUp} valeur={date(fiche.auth.createdAt ?? p.created_at)} repli={absent} />
          <Champ label={t.admin.colLastSignIn} valeur={date(fiche.auth.lastSignIn)} repli={t.admin.never} />
          <Champ label={t.admin.ficheLanguage} valeur={fiche.reglages?.language ?? null} repli={absent} />
          <Champ label={t.admin.fichePushDevices} valeur={String(fiche.compteurs.abonnementsPush)} repli={absent} />
        </Carte>
      </div>

      {/* Les réglages viennent de la colonne `jsonb` : on affiche ce qu'on sait
          nommer, et rien n'est supposé absent — une clé jamais écrite rend le
          repli plutôt qu'une valeur par défaut inventée. */}
      <div className="mb-4">
        <Carte titre={t.nav.settings}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Champ label={t.settings.theme} valeur={fiche.reglages?.theme ?? null} repli={absent} />
            <Champ label={t.settings.colorTheme} valeur={fiche.reglages?.colorTheme ?? null} repli={absent} />
            <Champ
              label={t.settings.goal}
              valeur={fiche.reglages?.readingGoal
                ? `${fiche.reglages.readingGoal.cible ?? fiche.reglages.readingGoal.target ?? '?'} ${t.settings.goalUnits[fiche.reglages.readingGoal.unite ?? 'chapters'] ?? ''} ${t.settings.goalPeriods[fiche.reglages.readingGoal.periode ?? 'day'] ?? ''}`.trim()
                : null}
              repli={absent}
            />
            <Champ
              label={t.admin.ficheNotifications}
              valeur={fiche.reglages?.notificationsEnabled === true ? t.common.yes : t.common.no}
              repli={absent}
            />
            <Champ label={t.settings.fontUi} valeur={fiche.reglages?.uiFont ?? null} repli={absent} />
            <Champ label={t.settings.fontReading} valeur={fiche.reglages?.readingFont ?? null} repli={absent} />
            <Champ
              label={t.settings.pages}
              valeur={(fiche.reglages?.hiddenPages ?? []).length
                ? (fiche.reglages?.hiddenPages ?? []).join(', ')
                : null}
              repli={absent}
            />
            <Champ label={t.settings.tour} valeur={date(fiche.reglages?.tourCompletedAt) } repli={absent} />
          </div>
        </Carte>
      </div>

      <Carte titre={t.admin.ficheActivity}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Compteur icone={<BookOpen className="w-3.5 h-3.5" />} label={t.admin.statReadings} valeur={fiche.compteurs.readings} />
          <Compteur icone={<Layers className="w-3.5 h-3.5" />} label={t.admin.statPlans} valeur={fiche.compteurs.plans} />
          <Compteur icone={<CalendarDays className="w-3.5 h-3.5" />} label={t.admin.fichePlanDays} valeur={fiche.compteurs.planDays} />
          <Compteur icone={<Tags className="w-3.5 h-3.5" />} label={t.admin.statContexts} valeur={fiche.compteurs.contexts} />
          <Compteur icone={<Brain className="w-3.5 h-3.5" />} label={t.admin.ficheMemorised} valeur={fiche.compteurs.memorised} />
          <Compteur icone={<Gamepad2 className="w-3.5 h-3.5" />} label={t.admin.ficheSessions} valeur={fiche.compteurs.sessions} />
        </div>
      </Carte>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Carte titre={t.admin.ficheReadings}>
          {fiche.dernieresLectures.length === 0 ? (
            <p className="text-sm text-gray-400">{t.admin.ficheNothing}</p>
          ) : (
            <ul className="space-y-1.5 list-none p-0 m-0">
              {fiche.dernieresLectures.map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{nomDuLivre(l.book)} {l.chapterStart}{l.chapterEnd !== l.chapterStart ? `–${l.chapterEnd}` : ''}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(locale, l.date, { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte titre={t.admin.fichePlans}>
          {fiche.plans.length === 0 ? (
            <p className="text-sm text-gray-400">{t.admin.ficheNothing}</p>
          ) : (
            <ul className="space-y-1.5 list-none p-0 m-0">
              {fiche.plans.map((pl) => (
                <li key={pl.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{pl.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{t.admin.statPlanDays(pl.totalDays)}</span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <div className="mt-4">
        <Carte titre={t.messages.title}>
          {fil.length > 0 && (
            <ul className="space-y-2 list-none p-0 m-0 mb-4 max-h-72 overflow-y-auto">
              {fil.map((m) => (
                <li key={m.id}
                  className={`rounded-lg border p-3 ${m.fromAdmin ? 'border-gray-200 bg-gray-50' : 'border-[--primary] bg-[--primary-light]'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">
                      {m.fromAdmin ? (m.sentByName || t.messages.fromAdmin) : nom}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatDate(locale, m.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {m.fromAdmin && !m.readAt ? ` · ${t.messages.unread}` : ''}
                    </span>
                  </div>
                  {m.subject && <p className="text-sm font-medium mt-1">{m.subject}</p>}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{m.body}</p>
                </li>
              ))}
            </ul>
          )}
          <Composeur
            destinataires={[params.id]}
            libelleBouton={t.messages.writeTo(nom)}
            onEnvoye={chargerFil}
          />
        </Carte>
      </div>

      <div className="mt-4">
        <Carte titre={t.admin.ficheTickets}>
          {fiche.tickets.length === 0 ? (
            <p className="text-sm text-gray-400">{t.admin.ficheNothing}</p>
          ) : (
            <ul className="space-y-2 list-none p-0 m-0">
              {fiche.tickets.map((ticket) => (
                <li key={ticket.id} className="flex items-start gap-2 text-sm">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="flex-1">{ticket.message}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${TICKET_STATUS_BADGE[ticket.status] ?? ''}`}>
                    {t.common.ticketStatuses[ticket.status] ?? ticket.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </div>
  )
}
