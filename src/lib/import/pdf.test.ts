import { describe, it, expect } from 'vitest'
import { lignesDepuisElements, type ElementTexte } from './pdf'

/** Un fragment à une position, avec sa hauteur de police. */
const el = (str: string, y: number, hauteur = 10, x = 50, hasEOL = false): ElementTexte =>
  ({ str, hasEOL, transform: [hauteur, 0, 0, hauteur, x, y], height: hauteur })

describe('lignesDepuisElements', () => {
  it('assemble les fragments d’une même ordonnée en une ligne', () => {
    expect(lignesDepuisElements([el('Jean ', 700), el('3:16', 700, 10, 80), el('Ps 23', 688)])).toBe('Jean 3:16\nPs 23')
  })

  it('un saut vertical large ouvre un paragraphe', () => {
    const page = [el('Ligne un', 700), el('Ligne deux', 688), el('Ligne trois', 676), el('Nouveau paragraphe', 640), el('sa suite', 628)]
    expect(lignesDepuisElements(page)).toBe('Ligne un\nLigne deux\nLigne trois\n\nNouveau paragraphe\nsa suite')
  })

  it('une ligne en grande police est un titre', () => {
    const page = [el('Jour 3', 720, 18), el('Genèse 4-7 et Ps 2.', 700), el('Relis lentement.', 688), el('Note ce qui te frappe.', 676)]
    expect(lignesDepuisElements(page)).toBe('# Jour 3\nGenèse 4-7 et Ps 2.\nRelis lentement.\nNote ce qui te frappe.')
  })

  it('un long texte en grande police n’est pas un titre', () => {
    const long = 'x'.repeat(130)
    expect(lignesDepuisElements([el(long, 720, 18), el('a', 700), el('b', 688)])).toBe(`${long}\na\nb`)
  })

  it('hasEOL ferme la ligne même à la même ordonnée', () => {
    expect(lignesDepuisElements([el('a', 700, 10, 50, true), el('b', 700, 10, 60)])).toBe('a\nb')
  })

  it('les blancs seuls ne font pas de ligne, et rien ne rend rien', () => {
    expect(lignesDepuisElements([el(' ', 700), el('', 688)])).toBe('')
    expect(lignesDepuisElements([])).toBe('')
  })
})
