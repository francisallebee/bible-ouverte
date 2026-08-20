import { describe, it, expect } from 'vitest'
import { doitPinger, INTERVALLE_PING_MS } from './presence'

const MAINTENANT = 1_800_000_000_000

describe('cadence du signe de vie', () => {
  it('envoie quand rien n’a jamais été envoyé', () => {
    expect(doitPinger(null, MAINTENANT)).toBe(true)
  })

  it('se tait avant l’intervalle', () => {
    expect(doitPinger(String(MAINTENANT - INTERVALLE_PING_MS + 1000), MAINTENANT)).toBe(false)
  })

  it('envoie une fois l’intervalle écoulé', () => {
    expect(doitPinger(String(MAINTENANT - INTERVALLE_PING_MS), MAINTENANT)).toBe(true)
  })

  it('ne se bloque pas sur une date future', () => {
    // Horloge remise à l'heure, fuseau changé : sans ce garde-fou, plus aucun
    // signe de vie ne partirait jamais.
    expect(doitPinger(String(MAINTENANT + 86400000), MAINTENANT)).toBe(true)
  })

  it('ignore une valeur illisible plutôt que de se taire', () => {
    expect(doitPinger('hier', MAINTENANT)).toBe(true)
    expect(doitPinger('', MAINTENANT)).toBe(true)
  })
})
