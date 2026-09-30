import { describe, it, expect } from 'vitest'
import { retourApresConnexion } from './retour'

/**
 * La redirection ouverte, écartée par une liste blanche.
 *
 * Un `next` rendu sans filtre laisse envoyer `?next=https://ailleurs.example`
 * et faire passer une page étrangère pour la nôtre au sortir d'une connexion
 * réussie — le moment précis où l'utilisateur fait le plus confiance à ce
 * qu'il voit. Ces cas ne sont pas hypothétiques : `//hôte` et `/\hôte` sont
 * des URL **absolues** pour un navigateur malgré leur barre initiale, et c'est
 * le contournement classique d'un contrôle qui se contenterait de vérifier la
 * première lettre.
 */
describe('la destination d’après-connexion', () => {
  const jeton = 'a'.repeat(64)

  it('accepte un lien d’invitation interne', () => {
    expect(retourApresConnexion(`/invitation/${jeton}`)).toBe(`/invitation/${jeton}`)
  })

  it('retombe sur l’accueil sans destination', () => {
    expect(retourApresConnexion(null)).toBe('/')
    expect(retourApresConnexion('')).toBe('/')
  })

  it('refuse une URL absolue', () => {
    expect(retourApresConnexion('https://ailleurs.example')).toBe('/')
    expect(retourApresConnexion('http://ailleurs.example')).toBe('/')
  })

  it('refuse les barres doubles, qui sont absolues malgré les apparences', () => {
    expect(retourApresConnexion('//ailleurs.example')).toBe('/')
    expect(retourApresConnexion('/\\ailleurs.example')).toBe('/')
    expect(retourApresConnexion('//ailleurs.example/invitation/' + jeton)).toBe('/')
  })

  it('refuse tout autre chemin interne', () => {
    // Pas par méfiance envers `/settings`, mais parce qu'aucun écran n'a
    // besoin de ce retour : une liste blanche large est une liste blanche qui
    // se périme.
    expect(retourApresConnexion('/settings')).toBe('/')
    expect(retourApresConnexion('/admin')).toBe('/')
  })

  it('refuse un jeton qui n’en est pas un', () => {
    expect(retourApresConnexion('/invitation/../admin')).toBe('/')
    expect(retourApresConnexion('/invitation/court')).toBe('/')
    expect(retourApresConnexion(`/invitation/${jeton}?x=1`)).toBe('/')
  })
})
