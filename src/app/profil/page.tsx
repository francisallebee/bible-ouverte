'use client'

import { useEffect, useState } from 'react'
import { User, Save, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { resizeImage } from '@/lib/image-utils'

type ProfileData = {
  id: string
  name: string
  color: string
  avatar_url: string | null
  birth_date: string | null
  phone: string | null
  bio: string | null
  social_links: Record<string, string>
}

export default function ProfilPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const json = await res.json()
      if (json.data) {
        setProfile({
          ...json.data,
          social_links: json.data.social_links || {},
          avatar_url: json.data.avatar_url || null,
          birth_date: json.data.birth_date || null,
          phone: json.data.phone || null,
          bio: json.data.bio || null,
        })
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
    const { id, ...data } = profile
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json())
    if (res.data) setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const resized = await resizeImage(file, 400, 400)
    setProfile({ ...profile, avatar_url: resized })
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
    const key = prompt('Nom du réseau (ex: instagram, twitter, facebook)')
    if (key && key.trim()) {
      setProfile({ ...profile, social_links: { ...profile.social_links, [key.trim()]: '' } })
    }
  }

  if (loading) return <p className="text-gray-500">Chargement...</p>
  if (!profile) return <p className="text-red-500">Erreur de chargement du profil</p>

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-[#1e3a5f]" />
        Mon profil
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100" />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: profile.color }}>
                {profile.name[0]?.toUpperCase() || '?'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#1e3a5f] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#2a4f7a]">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
          <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
          <input type="color" value={profile.color} onChange={e => setProfile({ ...profile, color: e.target.value })}
            className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
        </div>

        {/* Birth date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
          <input type="date" value={profile.birth_date || ''} onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input type="tel" value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })}
            placeholder="+33 6 12 34 56 78"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })}
            rows={3} placeholder="Quelques mots sur toi..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
        </div>

        {/* Social links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Réseaux sociaux</label>
            <button onClick={addSocial} className="text-xs text-[#1e3a5f] hover:underline">+ Ajouter</button>
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
            <p className="text-xs text-gray-400 italic">Aucun réseau ajouté</p>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg text-sm hover:bg-[#2a4f7a] disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {saved && <p className="text-sm text-green-600 text-center">✓ Profil mis à jour</p>}
      </div>
    </div>
  )
}
