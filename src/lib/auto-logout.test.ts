import { describe, it, expect } from 'vitest'
import { autoLogoutState, WARNING_SECONDS } from './auto-logout'

/**
 * La règle de temps de la déconnexion automatique.
 *
 * Elle est testée ici plutôt qu'au navigateur : chronométrer un compte à
 * rebours à travers le réseau donne des relevés qu'on ne sait pas relire — la
 * latence des allers-retours s'ajoute au temps mesuré, et une activité de
 * l'utilisateur pendant l'essai réarme le compteur sans qu'on le voie.
 * L'écran, lui, a été vérifié séparément.
 */

const MINUTE = 60_000
const t0 = 1_770_000_000_000 // instant arbitraire, fixe

describe('autoLogoutState', () => {
  it('ne fait rien quand le réglage est « Jamais »', () => {
    expect(autoLogoutState(0, t0, t0 + 10 * MINUTE)).toEqual({ kind: 'idle' })
  })

  it('ne fait rien non plus sur une valeur négative', () => {
    expect(autoLogoutState(-5, t0, t0 + 10 * MINUTE)).toEqual({ kind: 'idle' })
  })

  it('reste silencieuse tant que l\'avertissement n\'est pas atteint', () => {
    // 30 minutes de délai, 5 minutes écoulées : il reste 25 minutes.
    expect(autoLogoutState(30, t0, t0 + 5 * MINUTE)).toEqual({ kind: 'idle' })
  })

  it('avertit exactement une minute avant la coupure', () => {
    const justeAvant = autoLogoutState(30, t0, t0 + 29 * MINUTE - 1)
    expect(justeAvant).toEqual({ kind: 'idle' })

    const alEcheance = autoLogoutState(30, t0, t0 + 29 * MINUTE)
    expect(alEcheance).toEqual({ kind: 'warning', seconds: WARNING_SECONDS })
  })

  it('décompte les secondes restantes pendant l\'avertissement', () => {
    expect(autoLogoutState(30, t0, t0 + 29 * MINUTE + 30_000))
      .toEqual({ kind: 'warning', seconds: 30 })
    expect(autoLogoutState(30, t0, t0 + 30 * MINUTE - 1000))
      .toEqual({ kind: 'warning', seconds: 1 })
  })

  it('expire à l\'échéance, et pas avant', () => {
    expect(autoLogoutState(30, t0, t0 + 30 * MINUTE - 1))
      .toEqual({ kind: 'warning', seconds: 1 })
    expect(autoLogoutState(30, t0, t0 + 30 * MINUTE)).toEqual({ kind: 'expired' })
  })

  it('reste expirée bien après l\'échéance', () => {
    // Le cas de l'onglet en arrière-plan, dont le minuteur a été ralenti : on
    // ne revient jamais en arrière parce qu'un tour a été manqué.
    expect(autoLogoutState(30, t0, t0 + 3 * 60 * MINUTE)).toEqual({ kind: 'expired' })
  })

  it('repousse l\'échéance quand l\'activité est plus récente', () => {
    const now = t0 + 25 * MINUTE
    // Sans activité depuis t0, l'avertissement serait déjà proche.
    expect(autoLogoutState(30, t0, now)).toEqual({ kind: 'idle' })
    // Une activité à 24 minutes remet trente minutes au compteur.
    const apresActivite = autoLogoutState(30, t0 + 24 * MINUTE, now)
    expect(apresActivite).toEqual({ kind: 'idle' })
    // Et l'avertissement ne tombe qu'une minute avant la nouvelle échéance.
    expect(autoLogoutState(30, t0 + 24 * MINUTE, t0 + 53 * MINUTE))
      .toEqual({ kind: 'warning', seconds: WARNING_SECONDS })
  })

  it('avertit dès le premier instant quand le délai vaut une minute', () => {
    // Cas limite : délai égal à la durée de l'avertissement.
    expect(autoLogoutState(1, t0, t0)).toEqual({ kind: 'warning', seconds: 60 })
  })

  it('couvre les quatre délais proposés', () => {
    for (const minutes of [15, 30, 60, 240]) {
      expect(autoLogoutState(minutes, t0, t0)).toEqual({ kind: 'idle' })
      expect(autoLogoutState(minutes, t0, t0 + minutes * MINUTE))
        .toEqual({ kind: 'expired' })
    }
  })
})
