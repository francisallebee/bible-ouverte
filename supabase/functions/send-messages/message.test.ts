import { describe, expect, it } from 'vitest'
import { composeMessageEmail, aEnvoyer, escapeHtml, MAX_TENTATIVES } from './message'
import type { MessageAEnvoyer } from './message'

const m = (over: Partial<MessageAEnvoyer> = {}): MessageAEnvoyer => ({
  id: 1,
  userId: 'u1',
  subject: 'Une nouveauté',
  body: 'Bonjour, voici la nouvelle version.',
  sentByName: 'Francis',
  email: 'marie@exemple.fr',
  firstName: 'Marie',
  name: 'Marie Dupont',
  ...over,
})

describe('rédaction', () => {
  it('salue par le prénom et signe par l’auteur', () => {
    const c = composeMessageEmail(m())!
    expect(c.text).toContain('Bonjour Marie,')
    expect(c.text).toContain('— Francis')
  })

  it('renvoie vers la boîte de l’application, pas vers une réponse au courriel', () => {
    // L'expéditeur est une adresse de service : répondre n'aboutirait nulle part.
    const c = composeMessageEmail(m())!
    expect(c.text).toContain('https://bible-ouverte.vercel.app/messages')
    expect(c.html).toContain('href="https://bible-ouverte.vercel.app/messages"')
  })

  it('porte le sujet dans l’objet, et s’en passe sinon', () => {
    expect(composeMessageEmail(m())!.subject).toBe('Bible Ouverte — Une nouveauté')
    expect(composeMessageEmail(m({ subject: '  ' }))!.subject)
      .toBe('Bible Ouverte — un message pour toi')
  })

  it('salue sans nom plutôt que « Bonjour , »', () => {
    const c = composeMessageEmail(m({ firstName: null, name: null }))!
    expect(c.text.startsWith('Bonjour,')).toBe(true)
  })

  it('retombe sur le nom d’affichage quand le prénom manque', () => {
    expect(composeMessageEmail(m({ firstName: null }))!.text).toContain('Bonjour Marie Dupont,')
  })

  it('n’interprète jamais le corps comme du HTML', () => {
    const c = composeMessageEmail(m({ body: '<script>alert(1)</script>' }))!
    expect(c.html).not.toContain('<script>')
    expect(c.html).toContain('&lt;script&gt;')
  })

  it('rend les sauts de ligne tapés', () => {
    expect(composeMessageEmail(m({ body: 'une\ndeux' }))!.html).toContain('une<br>deux')
  })

  it('rend null sans adresse ou sans corps', () => {
    expect(composeMessageEmail(m({ email: null }))).toBeNull()
    expect(composeMessageEmail(m({ body: '   ' }))).toBeNull()
  })
})

describe('qui reçoit un doublon', () => {
  it('écarte ceux qui n’ont pas d’adresse', () => {
    // Le message reste lisible dans l'application : le courriel est un
    // doublon, pas le canal principal.
    expect(aEnvoyer([m(), m({ id: 2, email: null })]).map((x) => x.id)).toEqual([1])
  })

  it('écarte un corps vide', () => {
    expect(aEnvoyer([m({ body: ' ' })])).toEqual([])
  })

  it('borne les tentatives à trois', () => {
    expect(MAX_TENTATIVES).toBe(3)
  })
})

describe('échappement', () => {
  it('couvre les cinq caractères qui comptent', () => {
    expect(escapeHtml('<a href="x">&</a>'))
      .toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
  })
})
