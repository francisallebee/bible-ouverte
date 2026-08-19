/**
 * Les polices proposées, pour l'interface et pour le texte biblique.
 *
 * Deux réglages distincts, parce que les deux besoins le sont : une interface
 * gagne à être neutre et compacte, un texte lu longuement gagne à être posé.
 *
 * **Aucune de ces polices ne couvre l'arabe**, et c'est pourquoi chaque pile se
 * termine par `system-ui`. Un lecteur de la Van Dyck garde donc la police
 * arabe de son appareil, quelle que soit la police latine choisie — l'inverse
 * aurait produit un rendu de secours imprévisible. C'est aussi la raison pour
 * laquelle « Système » reste le défaut.
 *
 * Les variables `--font-*` sont définies par `next/font` dans `layout.tsx`. Ce
 * fichier ne connaît que leurs noms : il ne charge rien, et reste donc testable
 * sans navigateur.
 */

export interface FontChoice {
  id: string
  /** La pile complète, variable `next/font` en tête quand il y en a une. */
  stack: string
  /** Vrai si la police est téléchargée avec l'application. */
  downloaded: boolean
}

const SYSTEME =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

export const FONTS: FontChoice[] = [
  { id: 'systeme', stack: SYSTEME, downloaded: false },
  { id: 'inter', stack: `var(--font-inter), ${SYSTEME}`, downloaded: true },
  { id: 'lora', stack: `var(--font-lora), Georgia, "Times New Roman", serif`, downloaded: true },
  { id: 'garamond', stack: `var(--font-garamond), Georgia, "Times New Roman", serif`, downloaded: true },
  { id: 'hyperlegible', stack: `var(--font-hyperlegible), ${SYSTEME}`, downloaded: true },
]

export const DEFAULT_FONT_ID = 'systeme'

export function fontStack(id: string | undefined): string {
  return FONTS.find((f) => f.id === id)?.stack ?? SYSTEME
}

/**
 * Pose les deux piles sur `<html>`.
 *
 * Comme pour les couleurs, on n'écrit que des variables CSS : le rendu suit
 * sans rechargement, et rien n'a besoin de connaître la liste des écrans qui
 * affichent du texte biblique.
 */
export function applyFonts(uiFontId?: string, readingFontId?: string): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--font-ui', fontStack(uiFontId))
  root.style.setProperty('--font-reading', fontStack(readingFontId))
}
