'use client'

import { useEffect, useState } from 'react'
import { User, Save, Camera, KeyRound } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { nomAffiche, PROVENANCES } from '@/lib/profil/identite'
import { useI18n } from '@/contexts/I18nContext'
import { resizeImage } from '@/lib/image-utils'
import { createClient } from '@/lib/supabase/client'
import { describePasswordProblems, PASSWORD_MIN_LENGTH } from '@/lib/auth/password'

type ProfileData = {
  id: string
  /** Le nom d'affichage. Dérivé du prénom et du nom, jamais saisi directement. */
  name: string
  first_name: string | null
  last_name: string | null
  city: string | null
  discovery_source: string | null
  avatar_url: string | null
  birth_date: string | null
  phone: string | null
  bio: string | null
  social_links: Record<string, string>
}

export default function ProfilPage() {
  const { t } = useI18n()
  const { user, identiteManquante, refreshUser } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSaved, setPwSaved] = useState(false)

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const json = await res.json()
      if (json.data) {
        const cachedAvatar = localStorage.getItem('profile_avatar')
        const serverAvatar = json.data.avatar_url || null
        setProfile({
          ...json.data,
          social_links: json.data.social_links || {},
          avatar_url: serverAvatar || cachedAvatar || null,
          birth_date: json.data.birth_date || null,
          phone: json.data.phone || null,
          bio: json.data.bio || null,
          first_name: json.data.first_name || null,
          last_name: json.data.last_name || null,
          city: json.data.city || null,
          discovery_source: json.data.discovery_source || null,
        })
        localStorage.setItem('profile_name', json.data.name || '')
        // L'avatar du serveur fait foi (synchronisé entre appareils)
        if (serverAvatar) localStorage.setItem('profile_avatar', serverAvatar)
      } else {
        console.error('Profil API error:', json.error)
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    }
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true); setSaved(false)
    /**
     * `name` est **recalculé**, jamais saisi.
     *
     * C'est une colonne dérivée, et le piège des trois chemins s'y applique :
     * sans cette ligne, modifier son prénom laisserait l'ancien nom dans le
     * tableau d'administration, sur ses tickets et dans l'alerte
     * d'inscription. `nomAffiche` applique la règle du trigger SQL.
     */
    const { id, ...reste } = profile
    const data = { ...reste, name: nomAffiche(
      { firstName: profile.first_name, lastName: profile.last_name, name: profile.name },
      profile.name,
    ) }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json())
    if (res.data) {
      setSaved(true)
      localStorage.setItem('profile_name', data.name)
      // La couleur n'est plus modifiable : l'avatar de repli suit le thème.
      localStorage.removeItem('profile_color')
      if (profile.avatar_url) localStorage.setItem('profile_avatar', profile.avatar_url)
      else localStorage.removeItem('profile_avatar')
      // Sans cela, `ProfileGate` continuerait de ramener ici : son information
      // vient d'AuthContext, qui ne relit pas le profil de lui-même.
      await refreshUser()
    }
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  /**
   * Le mot de passe actuel est exigé, alors que Supabase ne le réclame pas :
   * `updateUser` accepte un nouveau mot de passe sur la seule foi de la session.
   * Sans cette vérification, quiconque accède à un appareil déverrouillé
   * pourrait changer le mot de passe et évincer le propriétaire du compte.
   *
   * La vérification passe par une reconnexion : c'est le seul moyen, avec la
   * clé anon, de confirmer un mot de passe. Elle porte sur le même compte, la
   * session est simplement renouvelée.
   */
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwError('')
    setPwSaved(false)

    if (newPassword !== confirmPassword) {
      setPwError(t.profile.mismatch)
      return
    }
    if (newPassword === currentPassword) {
      setPwError(t.profile.sameAsCurrent)
      return
    }
    // Mêmes règles que le serveur : les vérifier ici affiche un message en
    // français plutôt que l'erreur brute de Supabase.
    const problem = describePasswordProblems(
      newPassword,
      t.auth.passwordRules.labels,
      t.auth.passwordRules.sentence,
      t.auth.passwordRules.and,
    )
    if (problem) {
      setPwError(problem)
      return
    }

    setPwSaving(true)
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPassword,
    })
    if (signInError) {
      setPwError(t.profile.wrongCurrent)
      setPwSaving(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setPwError(updateError.message)
      setPwSaving(false)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwSaved(true)
    setPwSaving(false)
    setTimeout(() => setPwSaved(false), 5000)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const resized = await resizeImage(file, 400, 400)
    setProfile({ ...profile, avatar_url: resized })
    localStorage.setItem('profile_avatar', resized)
  }

  const updateSocial = (key: string, value: string) => {
    if (!profile) return
    setProfile({ ...profile, social_links: { ...profile.social_links, [key]: value } })
  }

  const removeSocial = (key: string) => {
    if (!profile) return
    const { [key]: _, ...rest } = profile.social_links
    setProfile({ ...profile, social_links: rest })
  }

  const addSocial = () => {
    if (!profile) return
    const key = prompt(t.profile.socialPrompt)
    if (key && key.trim()) {
      setProfile({ ...profile, social_links: { ...profile.social_links, [key.trim()]: '' } })
    }
  }

  if (loading) return <p className="text-gray-500">{t.common.loading}</p>
  if (!profile) return <p className="text-red-500">{t.profile.loadError}</p>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-[--primary]" />
        {t.profile.title}
      </h1>

      {/* Le bandeau du passage obligé. Les couleurs du texte sont posées
          explicitement : `bg-amber-50` n'est remappé nulle part en mode sombre,
          et un texte sans classe de couleur y hériterait de `--text`, presque
          blanc sur presque blanc (règle 15). */}
      {identiteManquante && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">{t.profile.completeTitle}</p>
          <p className="mt-1 text-sm text-amber-800">{t.profile.completeHint}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold bg-[--primary]">
                {profile.name[0]?.toUpperCase() || '?'}
              </div>
            )}
            <label className="absolute bottom-0 end-0 w-8 h-8 bg-[--primary] rounded-full flex items-center justify-center cursor-pointer hover:bg-[--primary-hover]">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {profile.avatar_url && (
              <button
                onClick={() => {
                  setProfile({ ...profile, avatar_url: null })
                  localStorage.removeItem('profile_avatar')
                }}
                className="absolute top-0 end-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                title={t.profile.removeAvatar}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Prénom et nom. Le nom d'affichage en découle à l'enregistrement. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profil-prenom" className="block text-sm font-medium text-gray-700 mb-1">{t.profile.firstName}</label>
            <input id="profil-prenom" type="text" autoComplete="given-name"
              value={profile.first_name || ''}
              onChange={e => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="profil-nom" className="block text-sm font-medium text-gray-700 mb-1">{t.profile.lastName}</label>
            <input id="profil-nom" type="text" autoComplete="family-name"
              value={profile.last_name || ''}
              onChange={e => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.email}</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
        </div>

        {/* Birth date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.birthDate}</label>
          <input type="date" value={profile.birth_date || ''} onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.phone}</label>
          <input type="tel" value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })}
            placeholder={t.profile.phonePlaceholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Ville */}
        <div>
          <label htmlFor="profil-ville" className="block text-sm font-medium text-gray-700 mb-1">{t.profile.city}</label>
          <input id="profil-ville" type="text" autoComplete="address-level2"
            value={profile.city || ''}
            onChange={e => setProfile({ ...profile, city: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Provenance. Les libellés viennent d'`authScreens` plutôt que d'être
            recopiés ici : quatre traductions à un seul endroit. */}
        <div>
          <label htmlFor="profil-provenance" className="block text-sm font-medium text-gray-700 mb-1">
            {t.authScreens.discoverySource}
          </label>
          <select id="profil-provenance" value={profile.discovery_source || ''}
            onChange={e => setProfile({ ...profile, discovery_source: e.target.value || null })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">{t.authScreens.discoveryPlaceholder}</option>
            {PROVENANCES.map((origine) => (
              <option key={origine} value={origine}>{t.authScreens.discoverySources[origine]}</option>
            ))}
          </select>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.bio}</label>
          <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}
            rows={3} placeholder={t.profile.bioPlaceholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
        </div>

        {/* Social links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">{t.profile.socials}</label>
            <button onClick={addSocial} className="text-xs text-[--primary] hover:underline">{t.profile.addSocial}</button>
          </div>
          {Object.entries(profile.social_links).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 mb-2">
              <input type="text" value={key} readOnly
                className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-xs bg-gray-50" />
              <input type="url" value={val} onChange={e => updateSocial(key, e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs" />
              <button onClick={() => removeSocial(key)} className="text-red-500 text-xs hover:underline shrink-0">×</button>
            </div>
          ))}
          {Object.keys(profile.social_links).length === 0 && (
            <p className="text-xs text-gray-400 italic">{t.profile.noSocial}</p>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[--primary] text-white py-3 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t.profile.saving : t.profile.save}
        </button>
        {saved && <p className="text-sm text-green-600 text-center">{t.profile.saved}</p>}
      </div>

      {/* Voir le commentaire de `auth/login` : trois mots de passe transitent
          ici, dont l'actuel. */}
      <form method="post" onSubmit={handleChangePassword} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mt-6">
        <h2 className="text-base font-semibold flex items-center gap-2 text-gray-900">
          <KeyRound className="w-4 h-4 text-[--primary]" />
          {t.profile.password}
        </h2>

        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
            {t.profile.currentPassword}
          </label>
          <input id="current-password" type="password" autoComplete="current-password"
            value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            {t.profile.newPassword}
          </label>
          <input id="new-password" type="password" autoComplete="new-password"
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <p className="text-xs text-gray-400 mt-1">
            {t.profile.passwordHint(PASSWORD_MIN_LENGTH)}
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            {t.profile.confirmPassword}
          </label>
          <input id="confirm-password" type="password" autoComplete="new-password"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {pwError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {pwError}
          </p>
        )}

        <button type="submit"
          disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-[--primary] text-white py-3 rounded-lg text-sm hover:bg-[--primary-hover] disabled:opacity-50 flex items-center justify-center gap-2">
          {pwSaving
            ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : <KeyRound className="w-4 h-4" />}
          {pwSaving ? t.profile.changing : t.profile.changePassword}
        </button>

        {pwSaved && (
          <p className="text-sm text-green-600 text-center">
            {t.profile.passwordChanged}
          </p>
        )}
      </form>
    </div>
  )
}
