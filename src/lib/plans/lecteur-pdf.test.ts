import { describe, it, expect } from 'vitest'
import { boiteDEncre, boiteUtile, zoomPince, zoomDoubleToucher, defilementApresZoom, zoomBorne, ecart, milieu, ZOOM_MAX, ZOOM_MIN } from './lecteur-pdf'

/** Une image RGBA blanche de `l` × `h`, avec de l'encre aux points donnés. */
function image(l: number, h: number, encre: Array<[number, number]>, valeur = 0): Uint8ClampedArray {
  const px = new Uint8ClampedArray(l * h * 4).fill(255)
  for (const [x, y] of encre) { const i = (y * l + x) * 4; px[i] = px[i + 1] = px[i + 2] = valeur }
  return px
}

describe('boiteDEncre', () => {
  it('trouve la boîte des pixels non blancs, élargie de la marge, bornée à l’image', () => {
    // Une image de 100 × 200, encre de (20,40) à (60,150) : marge 2 % = 2 px et 4 px.
    expect(boiteDEncre(image(100, 200, [[20, 40], [60, 150], [40, 90]]), 100, 200)).toEqual({ x: 18, y: 36, w: 45, h: 119 })
  })
  it('une page blanche rend null ; un gris de papier scanné (240) passe pour blanc, un gris d’encre (200) non', () => {
    expect(boiteDEncre(image(10, 10, []), 10, 10)).toBeNull()
    expect(boiteDEncre(image(10, 10, [[5, 5]], 240), 10, 10)).toBeNull()
    expect(boiteDEncre(image(10, 10, [[5, 5]], 200), 10, 10)).not.toBeNull()
  })
  it('un pixel transparent ne compte pas', () => {
    const px = image(10, 10, [[5, 5]])
    px[(5 * 10 + 5) * 4 + 3] = 0
    expect(boiteDEncre(px, 10, 10)).toBeNull()
  })
  it('la boîte d’un bord touche le bord : la marge ne sort pas de l’image', () => {
    expect(boiteDEncre(image(100, 100, [[0, 0], [99, 99]]), 100, 100)).toEqual({ x: 0, y: 0, w: 100, h: 100 })
  })
})

describe('boiteUtile', () => {
  it('garde une boîte d’au moins un quart de largeur et un dixième de hauteur, refuse un numéro de page seul', () => {
    expect(boiteUtile({ x: 10, y: 10, w: 50, h: 80 }, 100, 200)).not.toBeNull()
    expect(boiteUtile({ x: 45, y: 190, w: 8, h: 6 }, 100, 200)).toBeNull()
    expect(boiteUtile(null, 100, 200)).toBeNull()
  })
})

describe('le zoom', () => {
  it('borné entre les deux extrêmes, 1 si absurde', () => {
    expect(zoomBorne(0.1)).toBe(ZOOM_MIN)
    expect(zoomBorne(99)).toBe(ZOOM_MAX)
    expect(zoomBorne(NaN)).toBe(1)
  })
  it('pincer : l’écart courant sur l’écart initial, appliqué au zoom de départ', () => {
    expect(zoomPince(1, 100, 150)).toBe(1.5)
    expect(zoomPince(2, 100, 50)).toBe(1)
    expect(zoomPince(1, 0, 150)).toBe(1)
    expect(zoomPince(3, 100, 300)).toBe(ZOOM_MAX)
  })
  it('double-toucher : 1 → 2, tout autre → 1', () => {
    expect(zoomDoubleToucher(1)).toBe(2)
    expect(zoomDoubleToucher(2)).toBe(1)
    expect(zoomDoubleToucher(1.5)).toBe(1)
  })
  it('le défilement garde le point focal en place quand le contenu double', () => {
    // Le point à 300 px du haut de la fenêtre, fenêtre défilée de 1000 : le
    // contenu double, le point était à 1300 du haut du contenu, il est à 2600 ; pour le garder à 300, défiler à 2300.
    expect(defilementApresZoom(1000, 300, 2)).toBe(2300)
    expect(defilementApresZoom(100, 300, 0.5)).toBe(0)
  })
  it('écart et milieu de deux doigts', () => {
    expect(ecart({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(milieu({ x: 0, y: 0 }, { x: 4, y: 2 })).toEqual({ x: 2, y: 1 })
  })
})
