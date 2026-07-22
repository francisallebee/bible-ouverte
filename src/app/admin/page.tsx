'use client'

import { useEffect, useState } from 'react'
import { Shield, ShieldOff, BookOpen, Tags, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type UserData = {
  id: string
  name: string
  color: string
  is_admin: boolean
  created_at: string
  readings: number
  plans: number
  contexts: number
}

export default function AdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(res => {
        if (res.error) { setError(res.error); return }
        setUsers(res.data || [])
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Chargement...</p>

  if (error) return (
    <div className="max-w-2xl mx-auto mt-12 text-center">
      <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-gray-700 mb-2">Accès refusé</h1>
      <p className="text-gray-500">{error}</p>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-[#1e3a5f]" />
        Administration
      </h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 font-medium text-gray-600">Utilisateur</th>
              <th className="text-left p-3 font-medium text-gray-600">Admin</th>
              <th className="text-center p-3 font-medium text-gray-600"><BookOpen className="w-4 h-4 inline" /> Lectures</th>
              <th className="text-center p-3 font-medium text-gray-600">Plans</th>
              <th className="text-center p-3 font-medium text-gray-600"><Tags className="w-4 h-4 inline" /> Contextes</th>
              <th className="text-left p-3 font-medium text-gray-600">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.name[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium">{u.name || 'Sans nom'}</span>
                  </div>
                </td>
                <td className="p-3">
                  {u.is_admin ? (
                    <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full">Admin</span>
                  ) : (
                    <span className="text-gray-400 text-xs">Non</span>
                  )}
                </td>
                <td className="p-3 text-center">{u.readings}</td>
                <td className="p-3 text-center">{u.plans}</td>
                <td className="p-3 text-center">{u.contexts}</td>
                <td className="p-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucun utilisateur trouvé.</p>
      )}
    </div>
  )
}
