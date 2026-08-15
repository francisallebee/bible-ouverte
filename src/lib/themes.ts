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
]

export function applyColorTheme(themeId: string) {
  const theme = COLOR_THEMES.find(t => t.id === themeId)
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, val]) => {
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
