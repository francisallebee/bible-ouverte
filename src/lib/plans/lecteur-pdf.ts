/**
 * La part pure du lecteur de PDF : ce qui se calcule sans écran.
 *
 * Le propriétaire, sur son iPhone, le 17 septembre 2026 : le lecteur est
 * « bien, mais on peut mieux faire, en fonction du document lui-même ». Ce
 * qu'il voyait d'abord d'une page A4 réduite à la largeur d'un téléphone,
 * c'étaient ses marges. Trois réponses, dont la règle est ici :
 *
 * 1. **Rogner les marges** : la boîte réelle de l'encre d'une page, trouvée
 *    dans un rendu à basse résolution, pour ajuster le *contenu* et non la
 *    feuille à l'écran (`boiteDEncre`).
 * 2. **Pincer pour zoomer** : le zoom suit l'écart des doigts, borné, et le
 *    défilement se recale pour que le point pincé reste sous eux
 *    (`zoomPince`, `defilementApresZoom`).
 * 3. Le mode sombre est du CSS ; rien à calculer.
 */

export interface Boite {
  x: number
  y: number
  w: number
  h: number
}

export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 4
export const ZOOM_PAS = 0.25

export function zoomBorne(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
}

/**
 * La boîte qui contient tout ce qui n'est pas blanc, en pixels de l'image
 * donnée, élargie d'une petite marge (`marge`, part de la dimension) pour
 * que l'encre ne touche pas le bord. `null` si la page est blanche.
 *
 * « Blanc » : les trois canaux au-dessus de `seuil` — le papier d'un scan
 * n'est jamais tout à fait 255 — ou un pixel transparent. Une image RGBA,
 * telle que `getImageData` la rend.
 */
export function boiteDEncre(pixels: Uint8ClampedArray | Uint8Array, largeur: number, hauteur: number, seuil = 235, marge = 0.02): Boite | null {
  let x0 = largeur, y0 = hauteur, x1 = -1, y1 = -1
  for (let y = 0; y < hauteur; y++) {
    const ligne = y * largeur * 4
    for (let x = 0; x < largeur; x++) {
      const i = ligne + x * 4
      if (pixels[i + 3] === 0) continue
      if (pixels[i] > seuil && pixels[i + 1] > seuil && pixels[i + 2] > seuil) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  if (x1 < 0) return null
  const mx = Math.round(largeur * marge)
  const my = Math.round(hauteur * marge)
  x0 = Math.max(0, x0 - mx); y0 = Math.max(0, y0 - my)
  x1 = Math.min(largeur - 1, x1 + mx); y1 = Math.min(hauteur - 1, y1 + my)
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/**
 * Une boîte trop petite n'est pas une page à rogner : un numéro de page seul
 * sur une feuille blanche ferait un zoom absurde. En dessous d'un quart de la
 * largeur ou d'un dixième de la hauteur, on garde la page entière.
 */
export function boiteUtile(boite: Boite | null, largeur: number, hauteur: number): Boite | null {
  if (!boite) return null
  if (boite.w < largeur * 0.25 || boite.h < hauteur * 0.1) return null
  return boite
}

/** Le zoom pendant un pincement : l'écart courant des doigts sur l'écart initial, appliqué au zoom de départ, borné. */
export function zoomPince(zoomInitial: number, ecartInitial: number, ecartCourant: number): number {
  if (ecartInitial <= 0) return zoomBorne(zoomInitial)
  return zoomBorne(zoomInitial * (ecartCourant / ecartInitial))
}

/** Le double-toucher : vers 2 depuis l'ajustement à la largeur, retour à 1 depuis tout autre zoom. */
export function zoomDoubleToucher(zoom: number): number {
  return Math.abs(zoom - 1) < 0.01 ? 2 : 1
}

/**
 * Le défilement qui garde un point fixe sous le doigt quand le contenu passe
 * d'une échelle à une autre : la distance du haut du contenu au point,
 * multipliée par le rapport, moins la position du point dans la fenêtre.
 */
export function defilementApresZoom(defilement: number, focal: number, rapport: number): number {
  return Math.max(0, (defilement + focal) * rapport - focal)
}

export function ecart(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function milieu(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
