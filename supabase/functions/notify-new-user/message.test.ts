import { describe, expect, it } from 'vitest'
import {
  comptesASignaler, composeNewUserEmail, dateLisible, designer, escapeHtml,
} from './message'
import type { NouveauCompte } from './message'

const compte = (over: Partial<NouveauCompte> = {}): NouveauCompte => ({
  id: '7e8695d3-0000-0000-0000-000000000000',
  name: 'Marie Dupont',
  email: 'marie@exemple.fr',
  createdAt: '2026-08-14T09:30:00.000Z',
  ...over,
})

describe('designer', () => {
  it('préfère le nom', () => {
    expect(designer(compte())).toBe('Marie Dupont')
  })

  it("retombe sur l'adresse quand le nom manque", () => {
    // Le nom n'est pas obligatoire à l'inscription : afficher une ligne vide
    // ferait douter d'un défaut d'envoi.
    expect(designer(compte({ name: null }))).toBe('marie@exemple.fr')
    expect(designer(compte({ name: '   ' }))).toBe('marie@exemple.fr')
  })

  it("retombe sur l'identifiant quand tout manque", () => {
    expect(designer(compte({ name: null, email: null }))).toBe('compte 7e8695d3')
  })
})

describe('escapeHtml', () => {
  it('neutralise ce qui partirait comme balise', () => {
    // Un nom est saisi par l'utilisateur : il arrive tel quel dans le corps.
    expect(escapeHtml('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(escapeHtml('Jean & "Marie"')).toBe('Jean &amp; &quot;Marie&quot;')
  })
})

describe('dateLisible', () => {
  it('rend une date française en heure de Paris', () => {
    // 09:30 UTC en août = 11:30 à Paris.
    expect(dateLisible('2026-08-14T09:30:00.000Z')).toContain('11:30')
    expect(dateLisible('2026-08-14T09:30:00.000Z')).toContain('août')
  })

  it("rend la valeur brute plutôt que « Invalid Date »", () => {
    expect(dateLisible('pas une date')).toBe('pas une date')
  })
})

describe('composeNewUserEmail', () => {
  it("renonce quand il n'y a rien à signaler", () => {
    expect(composeNewUserEmail([])).toBeNull()
  })

  it('nomme la personne dans le sujet quand elle est seule', () => {
    const c = composeNewUserEmail([compte()])
    expect(c?.subject).toBe('Bible Ouverte — nouvelle inscription : Marie Dupont')
    expect(c?.text).toContain('Une personne vient de créer un compte')
    expect(c?.text).toContain('marie@exemple.fr')
  })

  it('compte les inscriptions quand il y en a plusieurs', () => {
    // Le balayage passe au quart d'heure : il peut en trouver plusieurs.
    const c = composeNewUserEmail([compte(), compte({ id: 'b', name: 'Paul' })])
    expect(c?.subject).toBe('Bible Ouverte — 2 nouvelles inscriptions')
    expect(c?.text).toContain('2 personnes viennent de créer un compte')
  })

  it("n'envoie qu'un seul courriel pour tout le lot", () => {
    // Un par compte reproduirait le défaut corrigé sur la feuille de route :
    // un afflux de messages qu'on finit par filtrer, donc par ne plus lire.
    const c = composeNewUserEmail([compte(), compte({ id: 'b' }), compte({ id: 'c' })])
    expect(c).not.toBeNull()
    expect(c?.html.match(/<li>/g)).toHaveLength(3)
  })

  it('échappe le nom dans le corps HTML', () => {
    const c = composeNewUserEmail([compte({ name: '<b>Marie</b>' })])
    expect(c?.html).toContain('&lt;b&gt;Marie&lt;/b&gt;')
    expect(c?.html).not.toContain('<b>Marie</b>')
  })

  it("ne répète pas l'adresse quand elle sert déjà de nom", () => {
    const c = composeNewUserEmail([compte({ name: null })])
    expect(c?.text).toContain('marie@exemple.fr')
    expect(c?.text).not.toContain('marie@exemple.fr (marie@exemple.fr)')
  })
})

describe('comptesASignaler', () => {
  const a = compte({ id: 'a', createdAt: '2026-08-14T10:00:00.000Z' })
  const b = compte({ id: 'b', createdAt: '2026-08-14T08:00:00.000Z' })

  it('écarte ceux qui ont déjà leur trace', () => {
    expect(comptesASignaler([a, b], ['a']).map((c) => c.id)).toEqual(['b'])
  })

  it('rend une liste vide quand tout est déjà signalé', () => {
    expect(comptesASignaler([a, b], ['a', 'b'])).toHaveLength(0)
  })

  it('classe du plus ancien au plus récent', () => {
    // L'alerte se lit dans l'ordre où les gens sont arrivés.
    expect(comptesASignaler([a, b], []).map((c) => c.id)).toEqual(['b', 'a'])
  })
})
