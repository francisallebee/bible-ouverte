'use client'

import { Cloud, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SyncButton() {
  const { user } = useAuth()

  return (
    <div>
      {user ? (
        <p className="text-sm text-green-600 flex items-center gap-1.5">
          <Cloud className="w-4 h-4" />
          Synchronisé automatiquement
        </p>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Connecte-toi pour sauvegarder tes données dans le cloud.
        </p>
      )}
    </div>
  )
}
