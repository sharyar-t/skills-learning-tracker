import type { ThemePreference } from '../types/domain'

export const THEME_STORAGE_KEY = 'slt-theme'

/** Page background per theme — also what mobile browsers tint their chrome with (`theme-color`). */
export const THEME_COLORS = { light: '#FAFAF8', dark: '#131614' } as const

export type ResolvedTheme = 'light' | 'dark'

/** Anything stored or received that isn't one of the three valid choices is ignored. */
export function parseTheme(value: unknown): ThemePreference | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/**
 * Inline script for <head>: applies a saved light/dark choice before the first paint, so there is no
 * flash of the wrong theme. "system" (or nothing saved) leaves the CSS to follow the OS setting.
 * Kept tiny and defensive — storage can be blocked, and it must never throw.
 */
export function themeInitScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY)
  const colors = JSON.stringify(THEME_COLORS)
  return `try{var t=localStorage.getItem(${key});if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;var c=${colors}[t];document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',c)})}}catch(e){}`
}
