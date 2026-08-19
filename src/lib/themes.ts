export interface ColorTheme {
  id: string
  /** Le nom vit dans les dictionnaires, sous `colorThemes`, par identifiant. */
  emoji: string
  colors: {
    primary: string
    'primary-hover': string
    'primary-light': string
    accent: string
    'accent-light': string
  }
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'marine',
    emoji: '🌊',
    colors: {
      primary: '#1e3a5f',
      'primary-hover': '#2a4f7a',
      'primary-light': '#e8eef5',
      accent: '#7b68ee',
      'accent-light': '#f0eeff',
    },
  },
  {
    id: 'foret',
    emoji: '🌲',
    colors: {
      primary: '#1a4a3a',
      'primary-hover': '#2a5e4a',
      'primary-light': '#e8f5ee',
      accent: '#2ecc71',
      'accent-light': '#e8faf0',
    },
  },
  {
    id: 'pourpre',
    emoji: '💜',
    colors: {
      primary: '#4a1a5e',
      'primary-hover': '#5e2a72',
      'primary-light': '#f2e8f5',
      accent: '#e91e63',
      'accent-light': '#fce4ec',
    },
  },
  {
    id: 'ocre',
    emoji: '🏺',
    colors: {
      primary: '#5e3a1a',
      'primary-hover': '#724a2a',
      'primary-light': '#f5eee8',
      accent: '#f39c12',
      'accent-light': '#fef9e7',
    },
  },
  {
    id: 'ardoise',
    emoji: '🪨',
    colors: {
      primary: '#2d3748',
      'primary-hover': '#4a5568',
      'primary-light': '#edf2f7',
      accent: '#3182ce',
      'accent-light': '#ebf4ff',
    },
  },
  {
    id: 'rubis',
    emoji: '🍷',
    colors: {
      primary: '#8c1c2f',
      'primary-hover': '#a52a41',
      'primary-light': '#fbeaed',
      accent: '#c2410c',
      'accent-light': '#fdeee6',
    },
  },
  {
    id: 'turquoise',
    emoji: '🐚',
    colors: {
      primary: '#0f6f77',
      'primary-hover': '#158892',
      'primary-light': '#e6f4f5',
      accent: '#0891b2',
      'accent-light': '#e5f6fb',
    },
  },
  {
    id: 'indigo',
    emoji: '🌌',
    colors: {
      primary: '#3730a3',
      'primary-hover': '#4c46bd',
      'primary-light': '#eeedfa',
      accent: '#7c3aed',
      'accent-light': '#f2ecfe',
    },
  },
  {
    id: 'rose',
    emoji: '🌸',
    colors: {
      primary: '#9d2263',
      'primary-hover': '#b82c76',
      'primary-light': '#fceaf2',
      accent: '#db2777',
      'accent-light': '#fdebf3',
    },
  },
  {
    id: 'cafe',
    emoji: '☕',
    colors: {
      primary: '#5a3a26',
      'primary-hover': '#734b31',
      'primary-light': '#f4eee9',
      accent: '#a16207',
      'accent-light': '#fbf3e3',
    },
  },
]

/** L'identifiant de la charte définie par l'utilisateur lui-même. */
export const CUSTOM_THEME_ID = 'perso'

/** Les deux couleurs qu'il choisit ; le reste s'en déduit. */
export interface CustomColors {
  primary: string
  accent: string
}

export const DEFAULT_CUSTOM: CustomColors = { primary: '#1e3a5f', accent: '#7b68ee' }

function versCanaux(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function versHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Mélange vers le blanc : `part` à 0 rend la couleur, à 1 rend du blanc. */
function versLeBlanc(canaux: [number, number, number], part: number): [number, number, number] {
  return canaux.map((v) => v + (255 - v) * part) as [number, number, number]
}

/**
 * Complète deux couleurs en une charte entière.
 *
 * L'utilisateur n'en choisit que deux : demander cinq nuances cohérentes à
 * quelqu'un qui veut juste « du vert » serait lui confier un travail de
 * coloriste. Le survol s'éclaircit légèrement, les fonds beaucoup — ce sont les
 * mêmes rapports que dans les dix chartes livrées, relevés sur elles.
 *
 * Une valeur illisible retombe sur la charte par défaut plutôt que de poser des
 * variables vides, qui laisseraient l'application sans couleur du tout.
 */
export function derivedColors(custom: CustomColors): ColorTheme['colors'] {
  const p = versCanaux(custom.primary) ?? versCanaux(DEFAULT_CUSTOM.primary)!
  const a = versCanaux(custom.accent) ?? versCanaux(DEFAULT_CUSTOM.accent)!
  return {
    primary: versHex(p),
    'primary-hover': versHex(versLeBlanc(p, 0.18)),
    'primary-light': versHex(versLeBlanc(p, 0.92)),
    accent: versHex(a),
    'accent-light': versHex(versLeBlanc(a, 0.93)),
  }
}

export function applyColorTheme(themeId: string, custom?: CustomColors) {
  const colors = themeId === CUSTOM_THEME_ID
    ? derivedColors(custom ?? DEFAULT_CUSTOM)
    : COLOR_THEMES.find(t => t.id === themeId)?.colors
  if (!colors) return
  const root = document.documentElement
  Object.entries(colors).forEach(([key, val]) => {
    root.style.setProperty(`--${key}`, val)
  })
}

/** Mode d'apparence enregistré dans les réglages (`AppSettings.theme`). */
export type ThemeMode = 'light' | 'dark' | 'system'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Dernier mode appliqué. C'est `watchSystemTheme` qui le relit : sans lui, il
 * faudrait faire redescendre les réglages jusqu'à l'écouteur, qui se
 * retrouverait avec une valeur figée au montage.
 */
let currentMode: string | undefined

function prefersDark(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(DARK_QUERY).matches
}

/**
 * Pose ou retire la classe `dark` sur `<html>`. En mode « système », suit la
 * préférence du système d'exploitation. Tout endroit qui change l'apparence
 * doit passer par ici, sinon `watchSystemTheme` travaille sur un mode périmé.
 */
export function applyTheme(theme: string | undefined) {
  currentMode = theme
  const dark = theme === 'dark' || (theme === 'system' && prefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * Réapplique le thème quand le système bascule jour/nuit pendant que
 * l'application est ouverte. Sans effet hors du mode « système ».
 * Renvoie la fonction de désabonnement.
 */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const media = window.matchMedia(DARK_QUERY)
  const onChange = () => {
    if (currentMode === 'system') applyTheme('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
