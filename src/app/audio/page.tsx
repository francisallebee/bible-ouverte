'use client'

import { useState, useEffect } from 'react'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { getAllVersions, getSettings } from '@/lib/storage'
import { getAudioSessions, deleteAudioSession } from '@/lib/storage/audio-store'
import { BOOKS, getBook, getBookName } from '@/features/bible'
import type { BibleVersion, AudioSession } from '@/lib/storage/types'
import { Play, Trash2, RotateCcw, Headphones } from 'lucide-react'
import { formatTime } from '@/lib/utils'

export default function AudioPage() {
  const { play, state, bookName: currentBook, chapter: currentChapter } = useAudioPlayer()

  const [versions, setVersions] = useState<BibleVersion[]>([])
  const [versionId, setVersionId] = useState('audio-ls1910')
  const [book, setBook] = useState('GEN')
  const [chapter, setChapter] = useState(1)
  const [history, setHistory] = useState<AudioSession[]>([])

  const bookData = getBook(book)
  const maxChapters = bookData?.chapters ?? 1

  useEffect(() => {
    (async () => {
      const all = await getAllVersions()
      const audio = all.filter(v => (v.id.startsWith('audio-') || v.id.startsWith('ai-')) && v.isEnabled)
      setVersions(audio)
      if (audio.length > 0) setVersionId(audio[0].id)
      const h = await getAudioSessions()
      setHistory(h)
    })()
  }, [])

  const refreshHistory = async () => {
    const h = await getAudioSessions()
    setHistory(h)
  }

  const handlePlay = () => {
    play(versionId, book, chapter)
    setTimeout(refreshHistory, 500)
  }

  const handleReread = (s: AudioSession) => {
    play(s.versionId, s.book, s.chapter, s.verseStart, s.verseEnd)
  }

  const handleDelete = async (id: number) => {
    await deleteAudioSession(id)
    refreshHistory()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <Headphones className="w-6 h-6" />
        Audio Bible
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
            <select
              value={versionId}
              onChange={e => setVersionId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Livre</label>
            <select
              value={book}
              onChange={e => { setBook(e.target.value); setChapter(1) }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {BOOKS.map(b => (
                <option key={b.abbreviation} value={b.abbreviation}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chapitre</label>
            <select
              value={chapter}
              onChange={e => setChapter(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {Array.from({ length: maxChapters }, (_, i) => (
                <option key={i + 1} value={i + 1}>Chapitre {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handlePlay}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
        >
          <Play size={20} />
          Lire {getBookName(book)} chapitre {chapter}
        </button>
      </div>

      {state !== 'idle' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              En cours : {currentBook} chapitre {currentChapter}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Lecteur actif en bas de l'écran
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Historique d'écoute</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune écoute pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {history.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getBookName(s.book)} {s.chapter}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {s.completed ? 'Terminé' : `${formatTime(s.position)} / ${formatTime(s.duration)}`}
                    {' · '}{s.date}
                  </p>
                </div>
                <button
                  onClick={() => handleReread(s)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  title="Réécouter"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => s.id && handleDelete(s.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
