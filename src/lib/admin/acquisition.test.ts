import { describe, it, expect } from 'vitest'
import { parProvenance, parMois, parVille, moisDe, PROVENANCE_INCONNUE } from './acquisition'
import type { LigneUtilisateur } from './utilisateurs'

const ligne = (over: Partial<LigneUtilisateur> = {}): LigneUtilisateur => ({
  id: 'u1', name: 'Marie', first_name: 'Marie', last_name: 'Dupont',
  city: 'Nîmes', phone: null, discovery_source: 'internet',
  email: 'm@x.fr', is_admin: false, suspended: false,
  created_at: '2026-08-05T10:00:00.000Z', lastSignIn: null,
  readings: 0, plans: 0, contexts: 0,
  ...over,
})

const part = (parts: ReturnType<typeof parProvenance>, cle: string) =>
  parts.find((p) => p.cle === cle)!

describe('provenance', () => {
  it('donne une part propre aux comptes non renseignés', () => {
    // Les 112 comptes d'avant n'ont pas été interrogés : les écarter
    // annoncerait « 100 % par Internet » sur une seule réponse.
    const l = [ligne(), ligne({ id: 'u2', discovery_source: null })]
    expect(part(parProvenance(l), PROVENANCE_INCONNUE).nombre).toBe(1)
    expect(part(parProvenance(l), 'internet').pourcent).toBe(50)
  })

  it('compte le pourcentage sur le total, pas sur les réponses connues', () => {
    const l = [ligne(), ligne({ id: 'u2', discovery_source: null }), ligne({ id: 'u3', discovery_source: null })]
    expect(part(parProvenance(l), 'internet').pourcent).toBe(33)
  })

  it('rend les quatre provenances même à zéro', () => {
    const parts = parProvenance([ligne()])
    expect(parts.map((p) => p.cle)).toEqual([
      'internet', 'reseaux', 'connaissance', 'autre', PROVENANCE_INCONNUE,
    ])
    expect(part(parts, 'reseaux').nombre).toBe(0)
  })

  it('traite une chaîne blanche comme une absence', () => {
    expect(part(parProvenance([ligne({ discovery_source: '  ' })]), PROVENANCE_INCONNUE).nombre).toBe(1)
  })

  it('ne divise pas par zéro sur une liste vide', () => {
    expect(parProvenance([]).every((p) => p.pourcent === 0)).toBe(true)
  })
})

describe('inscriptions par mois', () => {
  const MAINTENANT = new Date(2026, 7, 20) // 20 août 2026, heure locale

  it('rend les mois vides à zéro', () => {
    // Une série qui saute les mois creux dessine une courbe régulière là où il
    // y a eu un trou.
    const l = [ligne({ created_at: new Date(2026, 5, 10).toISOString() })]
    const serie = parMois(l, 3, MAINTENANT)
    expect(serie.map((m) => m.mois)).toEqual(['2026-06', '2026-07', '2026-08'])
    expect(serie.map((m) => m.nombre)).toEqual([1, 0, 0])
  })

  it('finit sur le mois courant', () => {
    expect(parMois([], 12, MAINTENANT).at(-1)!.mois).toBe('2026-08')
  })

  it('franchit un changement d’année', () => {
    const serie = parMois([], 3, new Date(2026, 0, 15))
    expect(serie.map((m) => m.mois)).toEqual(['2025-11', '2025-12', '2026-01'])
  })

  it('lit la date en local et non en UTC', () => {
    // Le piège s'est déjà présenté trois fois dans ce dépôt.
    const premierDuMois = new Date(2026, 7, 1, 0, 30)
    expect(moisDe(premierDuMois.toISOString())).toBe('2026-08')
  })

  it('ignore une date illisible plutôt que de lever', () => {
    expect(moisDe('pas une date')).toBe('')
    expect(() => parMois([ligne({ created_at: 'n’importe quoi' })], 3, MAINTENANT)).not.toThrow()
  })
})

describe('villes', () => {
  it('regroupe les graphies d’une même ville', () => {
    const l = [ligne({ city: 'Nîmes' }), ligne({ id: 'u2', city: 'nimes' }), ligne({ id: 'u3', city: 'NÎMES' })]
    const villes = parVille(l)
    expect(villes).toHaveLength(1)
    expect(villes[0].nombre).toBe(3)
  })

  it('affiche l’orthographe la plus fréquente, pas la première vue', () => {
    const l = [
      ligne({ city: 'nimes' }),
      ligne({ id: 'u2', city: 'Nîmes' }),
      ligne({ id: 'u3', city: 'Nîmes' }),
    ]
    expect(parVille(l)[0].cle).toBe('Nîmes')
  })

  it('ne compte que les comptes qui ont renseigné une ville', () => {
    const l = [ligne({ city: 'Paris' }), ligne({ id: 'u2', city: null })]
    expect(parVille(l)[0].pourcent).toBe(100)
  })

  it('classe par nombre puis par ordre alphabétique', () => {
    const l = [
      ligne({ city: 'Lyon' }), ligne({ id: 'u2', city: 'Avignon' }),
      ligne({ id: 'u3', city: 'Paris' }), ligne({ id: 'u4', city: 'Paris' }),
    ]
    expect(parVille(l).map((v) => v.cle)).toEqual(['Paris', 'Avignon', 'Lyon'])
  })

  it('se limite au maximum demandé', () => {
    const l = Array.from({ length: 15 }, (_, i) => ligne({ id: `u${i}`, city: `Ville${i}` }))
    expect(parVille(l, 5)).toHaveLength(5)
  })

  it('rend une liste vide plutôt que de lever', () => {
    expect(parVille([])).toEqual([])
  })
})
