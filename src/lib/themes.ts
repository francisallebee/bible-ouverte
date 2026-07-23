export interface ColorTheme {
  id: string
  name: string
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
    name: 'Marine',
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
    name: 'Forêt',
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
    name: 'Pourpre',
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
    name: 'Ocre',
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
    name: 'Ardoise',
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
