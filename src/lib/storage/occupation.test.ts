import { describe, it, expect } from 'vitest'
import {
  poidsRessource, poidsActif, poidsCatalogue, niveauOccupation, formaterOctets,
} from './occupation'
import { LEXIQUES } from '@/features/bible/strong'
import { ORIGINAUX } from '@/features/bible/originaux'

/**
 * L'avertissement de mémoire, et le piège qui l'aurait rendu inutile.
 *
 * Le premier test est le seul qui protège d'un défaut déjà identifié : garder
 * le seul ratio `utilise / quota` aurait fait une alerte qui **ne se déclenche
 * jamais sur Chrome**, dont le quota est une part du disque libre — souvent des
 * dizaines de gigaoctets, où 116 Mio font moins d'un pour cent. Le lecteur
 * aurait eu un panneau vert avec une base saturée.
 */
describe('le niveau d’alerte', () => {
  it('alerte sur le volume même quand le quota est immense', () => {
    // Chrome sur un disque à moitié vide : 40 Gio accordés.
    const chrome = { utilise: 110 * 1024 * 1024, quota: 40 * 1024 * 1024 * 1024 }
    expect(chrome.utilise / chrome.quota).toBeLessThan(0.01)
    expect(niveauOccupation(chrome)).toBe('critique')
  })

  it('alerte sur le quota même quand le volume est modeste', () => {
    // Un iPhone presque plein : le quota tombe, et 40 Mio suffisent.
    expect(niveauOccupation({ utilise: 40 * 1024 * 1024, quota: 48 * 1024 * 1024 })).toBe('critique')
  })

  it('reste calme quand les deux signaux le sont', () => {
    expect(niveauOccupation({ utilise: 12 * 1024 * 1024, quota: 2 * 1024 * 1024 * 1024 })).toBe('ok')
  })

  it('se tait plutôt que d’inventer quand le navigateur ne mesure rien', () => {
    // `null` arrive sur Safari avant la 17 et en navigation privée. Un niveau
    // deviné ferait paraître une alerte sans aucun chiffre pour l'appuyer.
    expect(niveauOccupation(null)).toBe('ok')
  })

  it('juge sur le volume seul quand le quota manque', () => {
    expect(niveauOccupation({ utilise: 70 * 1024 * 1024, quota: null })).toBe('attention')
    expect(niveauOccupation({ utilise: 5 * 1024 * 1024, quota: null })).toBe('ok')
  })
})

describe('les poids annoncés', () => {
  /**
   * Une case, deux fichiers — le troisième chemin de la règle 17 se paie ici.
   *
   * Cocher l'hébreu descend le lexique **et** l'OSHB. Annoncer les 2,53 Mio du
   * seul lexique tromperait de 15,7 Mio, et c'est le texte qui domine.
   */
  it('compte le texte original avec le lexique qui le commande', () => {
    for (const lexique of LEXIQUES) {
      const original = ORIGINAUX.find((o) => o.lexiqueId === lexique.id)
      expect(original, `${lexique.id} sans texte original`).toBeDefined()
      expect(poidsRessource(lexique.id)).toBe(lexique.octets + original!.octets)
      expect(poidsRessource(lexique.id)).toBeGreaterThan(lexique.octets)
    }
  })

  it('rend zéro pour un identifiant inconnu plutôt que de jeter', () => {
    // L'écran somme ce qui est coché ; une exception y blanchirait la carte
    // entière pour une ressource retirée du registre.
    expect(poidsRessource('strong-copte')).toBe(0)
    expect(poidsActif([])).toBe(0)
  })

  it('chiffre le catalogue entier au-delà de cent mégaoctets', () => {
    // Le repère qui justifie l'avertissement : tout cocher dépasse 100 Mio.
    expect(poidsCatalogue()).toBeGreaterThan(100 * 1024 * 1024)
  })
})

describe('le format des octets', () => {
  // Les symboles viennent du dictionnaire : « Mio » est français, « MiB »
  // anglais. Le test les pose à la main pour ne pas dépendre de l'import d'un
  // dictionnaire entier.
  const FR = ['o', 'Kio', 'Mio', 'Gio']
  const EN = ['B', 'KiB', 'MiB', 'GiB']

  it('monte d’unité et suit la virgule de la locale', () => {
    expect(formaterOctets('fr', 900, FR)).toBe('900 o')
    expect(formaterOctets('fr', 6786199, FR)).toBe('6,5 Mio')
    expect(formaterOctets('en', 6786199, EN)).toBe('6.5 MiB')
  })

  it('n’affiche pas de décimale en deçà du mégaoctet', () => {
    // « 2 Kio » et non « 2,0 Kio » : la décimale n'apprend rien à cette échelle.
    expect(formaterOctets('fr', 2048, FR)).toBe('2 Kio')
  })
})
