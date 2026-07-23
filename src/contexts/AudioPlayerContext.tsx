'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { getSettings, updateSettings, getPassagesByRange } from '@/lib/storage'
import { addAudioSession, updateAudioSession } from '@/lib/storage/audio-store'
import { getBookName } from '@/features/bible'

type PlayerState = 'idle' | 'playing' | 'paused'

type AudioPlayerContextType = {
  state: PlayerState
  versionId: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  position: number
  duration: number
  speed: number
  timerRemaining: number
  timerActive: boolean
  sessionId: number | null
  bookName: string
  voices: SpeechSynthesisVoice[]
  play: (versionId: string, book: string, chapter: number, verseStart?: number, verseEnd?: number) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  setSpeed: (speed: number) => void
  seek: (pos: number) => void
  setTimer: (minutes: number) => void
  cancelTimer: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  state: 'idle', versionId: '', book: '', chapter: 1, verseStart: 1, verseEnd: 999,
  position: 0, duration: 0, speed: 1, timerRemaining: 0, timerActive: false,
  sessionId: null, bookName: '', voices: [],
  play: async () => {}, pause: () => {}, resume: () => {}, stop: () => {},
  setSpeed: () => {}, seek: () => {}, setTimer: () => {}, cancelTimer: () => {},
})

let utteranceRef: SpeechSynthesisUtterance | null = null

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlayerState>('idle')
  const [versionId, setVersionId] = useState('')
  const [book, setBook] = useState('')
  const [chapter, setChapter] = useState(1)
  const [verseStart, setVerseStart] = useState(1)
  const [verseEnd, setVerseEnd] = useState(999)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [timerRemaining, setTimerRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [bookName, setBookName] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [textQueue, setTextQueue] = useState<string[]>([])
  const [verseIndex, setVerseIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const constextRef = useRef<AudioPlayerContextType | null>(null)

  const stop = useCallback(() => {
    if (utteranceRef) {
      speechSynthesis.cancel()
      utteranceRef = null
    }
    setState('idle')
    setPosition(0)
    setDuration(0)
    setTextQueue([])
    setVerseIndex(0)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined }
    setTimerActive(false)
    setTimerRemaining(0)
  }, [])

  const pause = useCallback(() => {
    if (state === 'playing') {
      speechSynthesis.pause()
      setState('paused')
    }
  }, [state])

  const resume = useCallback(() => {
    if (state === 'paused') {
      speechSynthesis.resume()
      setState('playing')
    }
  }, [state])

  const playText = useCallback((texts: string[], vId: string, bk: string, ch: number, vs: number, ve: number) => {
    stop()
    if (texts.length === 0) return

    const allText = texts.join(' ')
    const utterance = new SpeechSynthesisUtterance(allText)
    utterance.lang = 'fr-FR'
    utterance.rate = speed

    const frVoice = voices.find(v => v.lang.startsWith('fr'))
    if (frVoice) utterance.voice = frVoice

    const words = allText.split(/\s+/).length
    const estDuration = (words / (3 * speed)) * 60
    setDuration(estDuration)
    setPosition(0)
    setTextQueue(texts)
    setVerseIndex(0)

    const startTime = Date.now()
    const posInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setPosition(elapsed)
    }, 250)

    utterance.onend = () => {
      clearInterval(posInterval)
      setPosition(estDuration)
      setState('idle')
      if (sessionId) updateAudioSession(sessionId, { position: estDuration, completed: true })
      setTextQueue([])
    }

    utteranceRef = utterance
    speechSynthesis.speak(utterance)
    setState('playing')
  }, [speed, voices, stop, sessionId])

  const play = useCallback(async (vId: string, bk: string, ch: number, vs = 1, ve = 999) => {
    try {
      const prefix = vId.startsWith('audio-') ? 'audio-' : vId.startsWith('ai-') ? 'ai-' : '';
      const textVersionId = prefix ? vId.slice(prefix.length) : vId
      const passages = await getPassagesByRange(textVersionId, bk, ch, vs, ve)
      if (passages.length === 0) return

      const texts = passages.map(p => p.text)
      setVersionId(vId)
      setBook(bk)
      setChapter(ch)
      setVerseStart(vs)
      setVerseEnd(ve)
      setBookName(getBookName(bk))

      const id = await addAudioSession({
        versionId: vId, book: bk, chapter: ch, verseStart: vs, verseEnd: ve,
        position: 0, duration: 0, completed: false,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      })
      setSessionId(id)

      playText(texts, vId, bk, ch, vs, ve)
    } catch { /* ignore */ }
  }, [playText])

  const seek = useCallback((pos: number) => {
    if (utteranceRef) {
      speechSynthesis.cancel()
      utteranceRef = null
    }
    const pct = pos / (duration || 1)
    const idx = Math.floor(pct * textQueue.length)
    const remaining = textQueue.slice(idx)
    if (remaining.length > 0) {
      playText(remaining, versionId, book, chapter, verseStart + idx, verseEnd)
    }
  }, [duration, textQueue, playText, versionId, book, chapter, verseStart, verseEnd])

  const setTimer = useCallback((minutes: number) => {
    setTimerRemaining(minutes * 60)
    setTimerActive(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          stop()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stop])

  const cancelTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined }
    setTimerActive(false)
    setTimerRemaining(0)
  }, [])

  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices().filter(v => v.lang.startsWith('fr'))
      setVoices(v)
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  useEffect(() => {
    (async () => {
      const s = await getSettings()
      if (s?.audioSpeed) setSpeed(s.audioSpeed)
    })()
  }, [])

  useEffect(() => {
    updateSettings({ audioSpeed: speed }).catch(() => {})
  }, [speed])

  const handleSetSpeed = useCallback((s: number) => {
    setSpeed(s)
    if (state === 'playing' || state === 'paused') {
      if (utteranceRef) {
        speechSynthesis.cancel()
        utteranceRef = null
      }
      const idx = Math.floor((position / (duration || 1)) * textQueue.length)
      const remaining = textQueue.slice(idx)
      if (remaining.length > 0) {
        const allText = remaining.join(' ')
        const utterance = new SpeechSynthesisUtterance(allText)
        utterance.lang = 'fr-FR'
        utterance.rate = s
        const frVoice = voices.find(v => v.lang.startsWith('fr'))
        if (frVoice) utterance.voice = frVoice
        utteranceRef = utterance
        speechSynthesis.speak(utterance)
        if (state === 'paused') speechSynthesis.pause()
      }
    }
  }, [state, position, duration, textQueue, voices])

  const value: AudioPlayerContextType = {
    state, versionId, book, chapter, verseStart, verseEnd,
    position, duration, speed, timerRemaining, timerActive,
    sessionId, bookName, voices,
    play, pause, resume, stop, setSpeed: handleSetSpeed, seek, setTimer, cancelTimer,
  }
  constextRef.current = value

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export const useAudioPlayer = () => useContext(AudioPlayerContext)
