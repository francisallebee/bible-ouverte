import { describe, expect, it } from 'vitest'
import {
  comptesASignaler, composeNewUserEmail, dateLisible, designer, escapeHtml,
  composeWelcomeEmail, comptesAAccueillir, MAX_TENTATIVES_BIENVENUE,
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

describe('le message de bienvenue', () => {
  it('salue par le nom complet et signe par le prénom seul', () => {
    // « Bien à Dupont » sonnerait comme une relance de facture.
    const c = compte({ name: 'Marie Dupont', firstName: 'Marie', lastName: 'Dupont' })
    const courriel = composeWelcomeEmail(c)!
    expect(courriel.text).toContain('Bonjour Marie Dupont,')
    expect(courriel.text).toContain('Bien à Marie, à bientôt ! 👋')
  })

  it('ne laisse partir aucun marqueur d’un autre outil', () => {
    // Le texte d'origine portait `<$Person.firstName$>`, collé depuis une
    // autre messagerie. Il serait parti tel quel.
    const courriel = composeWelcomeEmail(compte({ firstName: 'Marie' }))!
    expect(courriel.text).not.toContain('$Person')
    expect(courriel.html).not.toContain('$Person')
  })

  it('écrit « N’hésite » et non « N’hésites »', () => {
    const courriel = composeWelcomeEmail(compte({ firstName: 'Marie' }))!
    expect(courriel.text).toContain('N’hésite pas')
    expect(courriel.text).not.toContain('N’hésites')
  })

  it('porte le lien Patreon, en texte comme en HTML', () => {
    const courriel = composeWelcomeEmail(compte({ firstName: 'Marie' }))!
    const lien = 'https://www.patreon.com/Oappliday/posts/165644244?utm_campaign=postshare_fan'
    expect(courriel.text).toContain(lien)
    expect(courriel.html).toContain(`href="${lien}"`)
  })

  it('retombe sur le nom d’affichage quand le prénom manque', () => {
    // Les comptes d'avant le 20 août 2026 n'ont que `name`.
    const courriel = composeWelcomeEmail(compte({ name: 'francisallebee', firstName: null }))!
    expect(courriel.text).toContain('Bonjour francisallebee,')
    expect(courriel.text).toContain('Bien à francisallebee,')
  })

  it('échappe ce qui partirait comme balise', () => {
    const courriel = composeWelcomeEmail(compte({ name: '<script>', firstName: '<script>' }))!
    expect(courriel.html).not.toContain('<script>')
    expect(courriel.html).toContain('&lt;script&gt;')
  })

  it('rend null plutôt qu’un message sans destinataire', () => {
    expect(composeWelcomeEmail(compte({ email: null }))).toBeNull()
    expect(composeWelcomeEmail(compte({ email: '  ' }))).toBeNull()
  })
})

describe('à qui écrire, et à qui ne pas réécrire', () => {
  const etat = (over: Partial<{ userId: string; welcomedAt: string | null; welcomeAttempts: number }> = {}) => ({
    userId: '7e8695d3-0000-0000-0000-000000000000',
    welcomedAt: null,
    welcomeAttempts: 0,
    ...over,
  })

  it('accueille un compte neuf sans ligne d’état', () => {
    expect(comptesAAccueillir([compte()], [])).toHaveLength(1)
  })

  it('n’écrit jamais deux fois', () => {
    // C'est ce que protège le remplissage rétroactif des 112 lignes
    // existantes : elles portent toutes un `welcomedAt`.
    const dejaServi = [etat({ welcomedAt: '2026-08-20T08:00:00.000Z' })]
    expect(comptesAAccueillir([compte()], dejaServi)).toEqual([])
  })

  it('réessaie après un échec, mais pas indéfiniment', () => {
    // La trace d'alerte étant écrite avant l'envoi, sans compteur un refus
    // SMTP ferait disparaître le message en silence.
    expect(comptesAAccueillir([compte()], [etat({ welcomeAttempts: 1 })])).toHaveLength(1)
    expect(comptesAAccueillir([compte()], [etat({ welcomeAttempts: MAX_TENTATIVES_BIENVENUE })])).toEqual([])
  })

  it('laisse de côté un compte sans adresse', () => {
    expect(comptesAAccueillir([compte({ email: null })], [])).toEqual([])
  })
})
