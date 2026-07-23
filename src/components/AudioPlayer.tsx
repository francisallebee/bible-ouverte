'use client'

import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { Play, Pause, Square, SkipBack, SkipForward, Timer, X } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

export default function AudioPlayer() {
  const {
    state, bookName, chapter, position, duration, speed, stop, pause, resume, seek,
    setSpeed, timerRemaining, timerActive, setTimer, cancelTimer,
  } = useAudioPlayer()

  const [showTimer, setShowTimer] = useState(false)
  const [timerInput, setTimerInput] = useState('15')
  const [localPos, setLocalPos] = useState(0)
  const barRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalPos(position)
  }, [position])

  const pct = duration > 0 ? (localPos / duration) * 100 : 0

  if (state === 'idle') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
              {bookName} {chapter}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(localPos)} / {formatTime(duration)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => seek(Math.max(0, localPos - 10))}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              title="Reculer 10s"
            >
              <SkipBack size={16} />
            </button>

            {state === 'playing' ? (
              <button
                onClick={pause}
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Pause size={18} />
              </button>
            ) : (
              <button
                onClick={resume}
                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Play size={18} />
              </button>
            )}

            <button
              onClick={() => seek(Math.min(duration, localPos + 10))}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              title="Avancer 10s"
            >
              <SkipForward size={16} />
            </button>

            <div className="flex items-center gap-1">
              {[0.75, 1, 1.25, 1.5].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    speed === s
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTimer(!showTimer)}
              className={`p-1.5 rounded relative ${
                timerActive
                  ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
              title="Minuteur"
            >
              <Timer size={16} />
              {timerActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </button>

            <button
              onClick={stop}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              title="Arrêter"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <input
          ref={barRef}
          type="range"
          min={0}
          max={duration || 1}
          value={localPos}
          onChange={e => seek(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-gray-200 dark:bg-gray-700
            accent-blue-600
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600
            [&::-webkit-slider-thumb]:shadow"
        />

        {showTimer && (
          <div className="flex items-center gap-2 px-1 pb-1">
            <input
              type="number"
              min={1}
              max={120}
              value={timerInput}
              onChange={e => setTimerInput(e.target.value)}
              className="w-16 text-xs px-1.5 py-0.5 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">min</span>
            {timerActive ? (
              <>
                <span className="text-xs text-orange-500">
                  {Math.floor(timerRemaining / 60)}:{(timerRemaining % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={cancelTimer}
                  className="text-xs text-red-500 hover:underline"
                >
                  Annuler
                </button>
              </>
            ) : (
              <button
                onClick={() => setTimer(Number(timerInput) || 15)}
                className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Démarrer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
