import { describe, it, expect } from 'vitest'
import { langueWhisper, versMono, FREQUENCE_WHISPER } from './audio'
import { LOCALES } from '@/lib/i18n/locales'

describe('langueWhisper', () => {
  it('nomme la langue de chaque locale de l’interface, comme Whisper l’attend', () => {
    for (const { code } of LOCALES) expect(langueWhisper(code)).toMatch(/^[a-z]+$/)
    expect(langueWhisper('fr')).toBe('french')
    expect(langueWhisper('ar')).toBe('arabic')
  })
})

describe('versMono', () => {
  it('rend le canal unique tel quel', () => {
    const c = new Float32Array([0.5, -0.5])
    expect(versMono([c])).toBe(c)
  })
  it('moyenne les canaux d’une stéréo', () => {
    const g = new Float32Array([1, 0, -1]), d = new Float32Array([0, 0, 1])
    expect(Array.from(versMono([g, d]))).toEqual([0.5, 0, 0])
  })
  it('ne rend rien sans canal', () => {
    expect(versMono([]).length).toBe(0)
  })
  it('Whisper entend à 16 kHz', () => {
    expect(FREQUENCE_WHISPER).toBe(16_000)
  })
})
