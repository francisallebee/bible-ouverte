'use client'

import { useState } from 'react'
import { Cloud, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { fullSync } from '@/lib/supabase/sync'

export default function SyncButton() {
  const { user } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <p className="text-sm text-gray-500 italic">
        Connecte-toi pour synchroniser tes données.
      </p>
    )
  }

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    setError(null)
    try {
      const res = await fullSync()
      setResult(`Synchronisé : ${res.pushed.readings + res.pushed.plans + res.pushed.planDays + res.pushed.contexts} envoyés, ${res.pulled.readings + res.pulled.plans + res.pulled.planDays + res.pulled.contexts} reçus.`)
    } catch (e) {
      setError('Erreur : ' + (e instanceof Error ? e.message : 'Échec de la synchronisation'))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
      >
        {syncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Cloud className="w-4 h-4" />
        )}
        {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
      </button>
      {result && (
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> {result}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  )
}
