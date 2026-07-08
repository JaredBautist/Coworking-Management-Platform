import { useEffect } from 'react'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function resolveIsDark(theme: Theme): boolean {
  if (theme === 'system') {
    return window.matchMedia(MEDIA_QUERY).matches
  }
  return theme === 'dark'
}

/**
 * Applies/removes the `.dark` class on <html> based on the persisted theme,
 * and follows the OS preference while the theme is `system`.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    const root = document.documentElement

    const apply = () => {
      root.classList.toggle('dark', resolveIsDark(theme))
    }

    apply()

    if (theme !== 'system') return

    const media = window.matchMedia(MEDIA_QUERY)
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return { theme, setTheme }
}
