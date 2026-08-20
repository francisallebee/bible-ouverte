import { describe, it, expect } from 'vitest'
import {
  filtrerParSegment, chercher, trier, paginer, versCSV, COLONNES_CSV,
  JOURS_ACTIF, JOURS_INACTIF, statutDe, MINUTES_EN_LIGNE, banActif,
} from './utilisateurs'
import type { LigneUtilisateur } from './utilisateurs'

const MAINTENANT = new Date('2026-08-20T08:00:00.000Z')
const ilYA = (jours: number) =>
  new Date(MAINTENANT.getTime() - jours * 86400000).toISOString()

const ligne = (over: Partial<LigneUtilisateur> = {}): LigneUtilisateur => ({
  id: 'u1',
  name: 'Marie Dupont',
  first_name: 'Marie',
  last_name: 'Dupont',
  city: 'Nîmes',
  phone: null,
  discovery_source: 'internet',
  email: 'marie@exemple.fr',
  is_admin: false,
  suspended: false,
  created_at: '2026-08-01T10:00:00.000Z',
  lastSignIn: ilYA(1),
  readings: 12,
  plans: 1,
  contexts: 3,
  ...over,
})

describe('segments', () => {
  it('rend tout le monde sur « tous »', () => {
    const l = [ligne(), ligne({ id: 'u2', suspended: true })]
    expect(filtrerParSegment(l, 'tous', MAINTENANT)).toHaveLength(2)
  })

  it('compte comme actif une connexion de moins de sept jours', () => {
    const l = [ligne({ lastSignIn: ilYA(JOURS_ACTIF - 1) }), ligne({ id: 'u2', lastSignIn: ilYA(JOURS_ACTIF + 1) })]
    expect(filtrerParSegment(l, 'actifs', MAINTENANT).map((x) => x.id)).toEqual(['u1'])
  })

  it('laisse un intervalle vide entre actif et inactif', () => {
    // Vu il y a dix jours : ni l'un ni l'autre. Deux segments qui se touchent
    // donneraient une somme égale au total, et mentiraient sur les gens.
    const dixJours = [ligne({ lastSignIn: ilYA(10) })]
    expect(filtrerParSegment(dixJours, 'actifs', MAINTENANT)).toEqual([])
    expect(filtrerParSegment(dixJours, 'inactifs', MAINTENANT)).toEqual([])
  })

  it('sépare « jamais connecté » de « inactif »', () => {
    // Une absence de date n'est pas une date ancienne.
    const jamais = [ligne({ lastSignIn: null })]
    expect(filtrerParSegment(jamais, 'inactifs', MAINTENANT)).toEqual([])
    expect(filtrerParSegment(jamais, 'jamais', MAINTENANT)).toHaveLength(1)
    expect(filtrerParSegment([ligne({ lastSignIn: ilYA(JOURS_INACTIF + 1) })], 'inactifs', MAINTENANT)).toHaveLength(1)
  })

  it('trouve les suspendus et les administrateurs', () => {
    const l = [ligne(), ligne({ id: 'u2', suspended: true }), ligne({ id: 'u3', is_admin: true })]
    expect(filtrerParSegment(l, 'suspendus', MAINTENANT).map((x) => x.id)).toEqual(['u2'])
    expect(filtrerParSegment(l, 'admins', MAINTENANT).map((x) => x.id)).toEqual(['u3'])
  })

  it('repère les identités incomplètes, y compris à blanc', () => {
    const l = [
      ligne(),
      ligne({ id: 'u2', first_name: null, last_name: null }),
      ligne({ id: 'u3', first_name: '  ', last_name: 'Dupont' }),
    ]
    expect(filtrerParSegment(l, 'incomplets', MAINTENANT).map((x) => x.id)).toEqual(['u2', 'u3'])
  })
})

describe('recherche', () => {
  it('ignore les accents et la casse', () => {
    // Chercher « nimes » doit trouver « Nîmes ».
    expect(chercher([ligne()], 'nimes')).toHaveLength(1)
    expect(chercher([ligne()], 'MARIE')).toHaveLength(1)
  })

  it('cherche aussi dans l’adresse', () => {
    expect(chercher([ligne()], 'exemple.fr')).toHaveLength(1)
  })

  it('ne filtre rien sur une requête vide ou blanche', () => {
    expect(chercher([ligne(), ligne({ id: 'u2' })], '   ')).toHaveLength(2)
  })

  it('ne rend rien quand rien ne correspond', () => {
    expect(chercher([ligne()], 'zzz')).toEqual([])
  })

  it('supporte un champ absent sans lever', () => {
    expect(chercher([ligne({ email: null, city: null, first_name: null })], 'dupont')).toHaveLength(1)
  })
})

describe('tri', () => {
  it('range les jamais connectés en fin de liste, dans les deux sens', () => {
    // Traiter `null` comme l'époque zéro les confondrait avec les plus anciens.
    const l = [ligne({ id: 'jamais', lastSignIn: null }), ligne({ id: 'recent', lastSignIn: ilYA(1) })]
    expect(trier(l, 'connexion', 'desc').map((x) => x.id)).toEqual(['recent', 'jamais'])
    expect(trier(l, 'connexion', 'asc').map((x) => x.id)).toEqual(['recent', 'jamais'])
  })

  it('trie par nom selon l’alphabet français', () => {
    const l = [ligne({ id: 'b', name: 'Émile' }), ligne({ id: 'a', name: 'Alice' })]
    expect(trier(l, 'nom', 'asc').map((x) => x.id)).toEqual(['a', 'b'])
  })

  it('trie par nombre de lectures', () => {
    const l = [ligne({ id: 'peu', readings: 2 }), ligne({ id: 'beaucoup', readings: 40 })]
    expect(trier(l, 'lectures', 'desc').map((x) => x.id)).toEqual(['beaucoup', 'peu'])
  })

  it('ne modifie pas la liste reçue', () => {
    const l = [ligne({ id: 'a', readings: 1 }), ligne({ id: 'b', readings: 9 })]
    trier(l, 'lectures', 'desc')
    expect(l.map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('pagination', () => {
  it('découpe en pages entières', () => {
    expect(paginer(112, 25, 1)).toMatchObject({ page: 1, pages: 5, debut: 0, fin: 25 })
    expect(paginer(112, 25, 5)).toMatchObject({ page: 5, debut: 100, fin: 112 })
  })

  it('ramène une page hors limites à la dernière, plutôt que de vider', () => {
    // On filtre alors qu'on est en page 4 : un tableau blanc n'explique rien.
    expect(paginer(10, 25, 4).page).toBe(1)
    expect(paginer(112, 25, 99).page).toBe(5)
  })

  it('tient sur une liste vide', () => {
    expect(paginer(0, 25, 1)).toMatchObject({ page: 1, pages: 1, debut: 0, fin: 0 })
  })

  it('ne divise jamais par zéro sur une taille absurde', () => {
    expect(paginer(10, 0, 1).pages).toBe(10)
  })
})

describe('export CSV', () => {
  it('sépare par des points-virgules, ce qu’Excel français attend', () => {
    const csv = versCSV([ligne()])
    expect(csv.split('\r\n')[0]).toContain('"Nom affiché";"Prénom"')
    expect(COLONNES_CSV).toHaveLength(14)
  })

  it('commence par une marque d’ordre d’octets', () => {
    // Sans elle, Excel lit en ANSI et « Prénom » devient « PrÃ©nom ».
    expect(versCSV([]).charCodeAt(0)).toBe(0xfeff)
  })

  it('ne laisse pas un point-virgule dans un nom décaler les colonnes', () => {
    const csv = versCSV([ligne({ name: 'Dupont; Marie' })])
    expect(csv).toContain('"Dupont; Marie"')
    // 14 champs, donc 13 séparateurs hors des guillemets.
    const corps = csv.split('\r\n')[1]
    expect(corps.split('";"')).toHaveLength(14)
  })

  it('double les guillemets plutôt que de les laisser fermer le champ', () => {
    expect(versCSV([ligne({ name: 'Le "Grand" Jean' })])).toContain('"Le ""Grand"" Jean"')
  })

  it('écrit une case vide pour une valeur absente', () => {
    expect(versCSV([ligne({ email: null, lastSignIn: null })])).toContain('""')
  })
})

describe('statut affiché', () => {
  const ilYAMinutes = (m: number) => new Date(MAINTENANT.getTime() - m * 60000).toISOString()

  it('rend « en ligne » sur une connexion toute fraîche', () => {
    expect(statutDe({ suspended: false, lastSignIn: ilYAMinutes(1) }, MAINTENANT)).toBe('en-ligne')
  })

  it('cesse de le prétendre au-delà de la fenêtre', () => {
    expect(statutDe({ suspended: false, lastSignIn: ilYAMinutes(MINUTES_EN_LIGNE + 1) }, MAINTENANT))
      .toBe('hors-ligne')
  })

  it('fait primer la suspension sur la présence', () => {
    // Un compte suspendu vu il y a deux minutes n'est pas « en ligne » : il est
    // suspendu, et c'est la seule chose qui importe à qui regarde la liste.
    expect(statutDe({ suspended: true, lastSignIn: ilYAMinutes(2) }, MAINTENANT)).toBe('suspendu')
  })

  it('range « jamais connecté » hors ligne', () => {
    expect(statutDe({ suspended: false, lastSignIn: null }, MAINTENANT)).toBe('hors-ligne')
  })

  it('ne prend pas une date illisible pour une présence', () => {
    expect(statutDe({ suspended: false, lastSignIn: 'n’importe quoi' }, MAINTENANT)).toBe('hors-ligne')
  })
})

describe('bannissement', () => {
  it('reconnaît un bannissement encore en cours', () => {
    // La route pose `ban_duration: '876000h'`, soit une centaine d'années.
    expect(banActif('2126-07-27T13:01:26.703Z', MAINTENANT)).toBe(true)
  })

  it('ignore un bannissement expiré', () => {
    expect(banActif('2020-01-01T00:00:00.000Z', MAINTENANT)).toBe(false)
  })

  it('traite l’absence comme un compte libre', () => {
    expect(banActif(null, MAINTENANT)).toBe(false)
    expect(banActif(undefined, MAINTENANT)).toBe(false)
  })

  it('ne prend pas une date illisible pour un bannissement', () => {
    expect(banActif('jamais', MAINTENANT)).toBe(false)
  })
})
