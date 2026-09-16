import { describe, it, expect } from 'vitest'
import { COLOR_THEMES, derivedColors, variantesSombres, remplissageLisible, teintesDe, DEFAULT_CUSTOM } from './themes'
import { DEFAULT_CONTEXTS } from './storage/seed'
import { PALETTE } from './statistiques/palette'

/**
 * Le mode sombre doit rester lisible pour **toute** charte, y compris celles
 * qui n'existent pas encore.
 *
 * Ce fichier parcourt `COLOR_THEMES` plutôt que d'énumérer dix couleurs : un
 * test qui encode un comptage réclame une retouche à chaque ajout, et cette
 * retouche est le moment où l'on risque de le relâcher au lieu de le corriger
 * (leçon du 1er septembre 2026). Ajouter une charte au teint trop clair fera
 * donc échouer ce test tout seul, sans que personne ait à y penser.
 */

/** Les couleurs du mode sombre, telles que `html.dark` les pose. */
const SURFACE = '#1e293b'
const FOND = '#0f172a'
const TEXTE = '#f1f5f9'
const BLANC = '#ffffff'

/** Le seuil de l'AA du WCAG pour du texte ordinaire. */
const SEUIL = 4.5

function canaux(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance(hex: string): number {
  const [r, g, b] = canaux(hex).map((v) => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Les chartes du produit, plus celle que l'utilisateur compose lui-même. */
const TOUTES = [
  ...COLOR_THEMES.map((c) => ({ id: c.id, primary: c.colors.primary })),
  { id: 'personnalisee', primary: derivedColors(DEFAULT_CUSTOM).primary },
]

describe('la sonde de contrôle', () => {
  it('mesure juste sur des valeurs dont on connaît la réponse', () => {
    // Sans elle, un contraste faux passerait pour un défaut de charte — c'est
    // l'audit du 2 septembre 2026 qui a annoncé 1,05 sur un titre lisible.
    expect(contraste(BLANC, '#000000')).toBeCloseTo(21, 1)
    expect(contraste(BLANC, BLANC)).toBeCloseTo(1, 5)
    expect(contraste(TEXTE, SURFACE)).toBeGreaterThan(SEUIL)
  })
})

describe('variantesSombres', () => {
  it('refuse une couleur illisible plutôt que d’inventer', () => {
    expect(variantesSombres('pas une couleur')).toBeNull()
  })

  it.each(TOUTES)('$id : le texte se lit sur la surface sombre', ({ primary }) => {
    const v = variantesSombres(primary)!
    // C'est le défaut mesuré le 9 septembre : `text-[--primary]` sur
    // `--surface` donnait 1,11 sur la charte pourpre.
    expect(contraste(v.clair, SURFACE)).toBeGreaterThanOrEqual(SEUIL)
    expect(contraste(v.clair, FOND)).toBeGreaterThanOrEqual(SEUIL)
  })

  it.each(TOUTES)('$id : le panneau teinté porte ses deux textes', ({ primary }) => {
    const v = variantesSombres(primary)!
    expect(contraste(v.clair, v.panneau)).toBeGreaterThanOrEqual(SEUIL)
    expect(contraste(TEXTE, v.panneau)).toBeGreaterThanOrEqual(SEUIL)
  })

  it.each(TOUTES)('$id : le panneau se distingue des deux fonds', ({ primary }) => {
    const v = variantesSombres(primary)!
    // Premier énoncé de ce test, le 9 septembre 2026 : « le panneau reste plus
    // sombre que la surface ». Il a échoué sur turquoise, et c'est **le test**
    // qui avait tort — il transposait une intuition de mode clair, où la teinte
    // s'éloigne du blanc dans un seul sens. En mode sombre `--surface` est déjà
    // plus claire que `--bg` : le panneau est encadré par deux fonds, et se
    // détacher de l'un le rapproche de l'autre.
    //
    // Le repère du mode clair — ses propres panneaux teintés tiennent 1,064 à
    // 1,191 contre leurs fonds — s'est révélé **inatteignable** ici, pour cette
    // raison : mesuré sur toutes les parts de 0,40 à 0,86, le meilleur écart
    // minimal possible est 1,047, et il est atteint à 0,72. La part retenue est
    // donc l'optimum, et non un choix de goût.
    //
    // Ce qui est exigé ici est donc le seul énoncé qui ait un sens : que le
    // panneau ne se confonde avec aucun des deux. Une charte dont la couleur
    // frôlerait le fond sombre le ferait échouer, ce qui est son rôle.
    expect(contraste(v.panneau, FOND)).toBeGreaterThan(1.03)
    expect(contraste(v.panneau, SURFACE)).toBeGreaterThan(1.03)
  })

  it.each(TOUTES)('$id : le fond de bouton garde son texte blanc', ({ primary }) => {
    // `--primary` n'est pas touchée par le correctif, et ne doit pas l'être :
    // les 65 `bg-[--primary]` portent du texte blanc.
    expect(contraste(BLANC, primary)).toBeGreaterThanOrEqual(SEUIL)
  })
})

describe('remplissageLisible', () => {
  /** Les pistes des deux modes, telles que `globals.css` les pose. */
  const PISTE_CLAIRE = '#f3f4f6'
  const PISTE_SOMBRE = '#334155'
  /** Le seuil du WCAG pour un composant non textuel. */
  const SEUIL_COMPOSANT = 3

  /**
   * Les douze contextes par défaut, les sept couleurs de la palette de
   * Statistiques, les deux couleurs de catégorie de Progression, et trois extrêmes qu'un utilisateur peut choisir : le blanc,
   * le noir, un jaune pâle. La table des contextes est lue, non recopiée — une
   * couleur changée dans `seed.ts` se mesure ici sans retouche.
   */
  const COULEURS = [
    ...DEFAULT_CONTEXTS.map((c) => ({ id: c.id, couleur: c.color })),
    // La palette de Statistiques, dont le bleu nuit rendait 1,27 sur `--surface`.
    ...PALETTE.map((couleur, i) => ({ id: `palette ${i + 1}`, couleur })),
    { id: 'categorie lue', couleur: '#16a34a' },
    { id: 'categorie en cours', couleur: '#4a90d9' },
    { id: 'blanc', couleur: '#ffffff' },
    { id: 'noir', couleur: '#000000' },
    { id: 'jaune pale', couleur: '#ffff88' },
  ]

  it('refuse une couleur illisible plutôt que d’inventer', () => {
    expect(remplissageLisible('pas une couleur')).toBeNull()
  })

  it.each(COULEURS)('$id : se détache de la piste dans les deux modes', ({ couleur }) => {
    const r = remplissageLisible(couleur)!
    // Mesuré le 16 septembre 2026 avant correctif : Méditation rendait 1,91
    // en clair, Bible 1,36 en sombre — la barre était de la couleur du rail.
    expect(contraste(r.claire, PISTE_CLAIRE)).toBeGreaterThanOrEqual(SEUIL_COMPOSANT)
    expect(contraste(r.sombre, PISTE_SOMBRE)).toBeGreaterThanOrEqual(SEUIL_COMPOSANT)
  })

  it.each(COULEURS)('$id : reste la couleur choisie quand elle tient déjà', ({ couleur }) => {
    // Le remède pousse du minimum nécessaire, jamais par principe : un contexte
    // dont la couleur se voit garde exactement celle que l'utilisateur a choisie.
    const r = remplissageLisible(couleur)!
    if (contraste(couleur, PISTE_CLAIRE) >= SEUIL_COMPOSANT) expect(r.claire).toBe(couleur)
    if (contraste(couleur, PISTE_SOMBRE) >= SEUIL_COMPOSANT) expect(r.sombre).toBe(couleur)
  })

  it('pousse dans le bon sens : vers le noir en clair, vers le blanc en sombre', () => {
    const r = remplissageLisible('#2ecc71')!
    expect(luminance(r.claire)).toBeLessThan(luminance('#2ecc71'))
    const s = remplissageLisible('#6d4c41')!
    expect(luminance(s.sombre)).toBeGreaterThan(luminance('#6d4c41'))
  })
})

describe('teintesDe', () => {
  it('pose les deux teintes de remplissageLisible en variables inline', () => {
    const r = remplissageLisible('#6d4c41')!
    expect(teintesDe('#6d4c41')).toEqual({ '--teinte-claire': r.claire, '--teinte-sombre': r.sombre })
  })

  it('porte la couleur telle quelle quand elle est illisible, plutôt que rien', () => {
    // Le composant ne doit pas perdre sa barre pour une valeur inattendue :
    // l'attribut `fill` reste de toute façon en repli sous la classe.
    expect(teintesDe('pas une couleur')).toEqual({ '--teinte-claire': 'pas une couleur', '--teinte-sombre': 'pas une couleur' })
  })
})
