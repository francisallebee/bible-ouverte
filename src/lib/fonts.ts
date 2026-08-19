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

/**
 * Échelle de l'interface, appliquée sur `<html>`.
 *
 * C'est le seul levier qui agisse vraiment : les classes Tailwind posent leurs
 * tailles en `rem`, donc changer la base les entraîne toutes, espacements
 * compris. Une taille posée sur `body` n'aurait touché que le texte sans classe,
 * c'est-à-dire presque rien.
 *
 * L'amplitude est volontairement modeste. Au-delà, la barre latérale et les
 * grilles de chiffres du sélecteur de chapitres commencent à se chevaucher :
 * agrandir l'interface n'est pas la même demande qu'agrandir le texte lu, et
 * c'est ce dernier que le réglage suivant sert.
 */
export const UI_SCALES = [
  { id: 'compact', value: '93.75%' },
  { id: 'normal', value: '100%' },
  { id: 'grand', value: '106.25%' },
  { id: 'tres-grand', value: '112.5%' },
]

export const DEFAULT_UI_SCALE = 'normal'

/**
 * Taille du texte biblique, indépendante de l'interface.
 *
 * L'amplitude y est bien plus large : c'est le texte qu'on lit longtemps, et
 * celui qu'on agrandit quand la vue baisse. Il vit dans un bloc à lui, rien ne
 * se chevauche quand il grandit.
 */
export const READING_SIZES = [
  { id: 'petit', value: '0.9375rem' },
  { id: 'normal', value: '1rem' },
  { id: 'grand', value: '1.1875rem' },
  { id: 'tres-grand', value: '1.4375rem' },
  { id: 'geant', value: '1.75rem' },
]

export const DEFAULT_READING_SIZE = 'normal'

/** Style du texte biblique. Le gras s'arrête à 600 : 700 fatigue sur un paragraphe entier. */
export const READING_STYLES = [
  { id: 'normal', style: 'normal', weight: '400' },
  { id: 'italique', style: 'italic', weight: '400' },
  { id: 'gras', style: 'normal', weight: '600' },
  { id: 'gras-italique', style: 'italic', weight: '600' },
]

export const DEFAULT_READING_STYLE = 'normal'

function valeurOuDefaut<T extends { id: string }>(liste: T[], id: string | undefined, defaut: string): T {
  return liste.find((x) => x.id === id) ?? liste.find((x) => x.id === defaut)!
}

export function uiScale(id?: string): string {
  return valeurOuDefaut(UI_SCALES, id, DEFAULT_UI_SCALE).value
}

export function readingSize(id?: string): string {
  return valeurOuDefaut(READING_SIZES, id, DEFAULT_READING_SIZE).value
}

export function readingStyle(id?: string): { style: string; weight: string } {
  const s = valeurOuDefaut(READING_STYLES, id, DEFAULT_READING_STYLE)
  return { style: s.style, weight: s.weight }
}

export function fontStack(id: string | undefined): string {
  return FONTS.find((f) => f.id === id)?.stack ?? SYSTEME
}

/** Ce que l'écran des réglages sait de la typographie. */
export interface FontSettings {
  uiFont?: string
  readingFont?: string
  uiScale?: string
  readingSize?: string
  readingStyle?: string
}

/**
 * Pose toute la typographie sur `<html>`.
 *
 * Comme pour les couleurs, on n'écrit que des variables CSS : le rendu suit
 * sans rechargement, et rien n'a besoin de connaître la liste des écrans qui
 * affichent du texte biblique.
 *
 * L'échelle de l'interface fait exception et s'écrit directement en
 * `font-size` : c'est la base des `rem`, pas une variable qu'une règle irait
 * lire.
 */
export function applyFonts(reglages: FontSettings = {}): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--font-ui', fontStack(reglages.uiFont))
  root.style.setProperty('--font-reading', fontStack(reglages.readingFont))
  root.style.setProperty('--font-reading-size', readingSize(reglages.readingSize))

  const { style, weight } = readingStyle(reglages.readingStyle)
  root.style.setProperty('--font-reading-style', style)
  root.style.setProperty('--font-reading-weight', weight)

  root.style.fontSize = uiScale(reglages.uiScale)
}
