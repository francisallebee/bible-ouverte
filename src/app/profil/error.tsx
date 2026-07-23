'use client'

export default function ProfilError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
      <p className="text-gray-700 mb-4">{error.message}</p>
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto mb-4">{error.stack}</pre>
      <button onClick={reset} className="bg-[--primary] text-white px-4 py-2 rounded-lg hover:bg-[--primary-hover]">
        Réessayer
      </button>
    </div>
  )
}
