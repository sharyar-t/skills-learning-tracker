import type { ThemePreference } from '#shared/types/domain'

const TRANSITION_CLASS = 'theme-transition'
const TRANSITION_MS = 300

let transitionTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Applies a theme choice to the page. "system" removes the override so the CSS follows the OS.
 * `animate` fades colours over a moment — only when the user switches, never on load.
 */
export function applyThemeToDocument(doc: Document, preference: ThemePreference, options: { animate?: boolean } = {}) {
  const root = doc.documentElement

  if (options.animate) {
    root.classList.add(TRANSITION_CLASS)
    clearTimeout(transitionTimer)
    transitionTimer = setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS)
  }

  if (preference === 'system') delete root.dataset.theme
  else root.dataset.theme = preference

  // The page ships two theme-color tags (one per OS scheme). An explicit choice points both at it.
  doc.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    const isDarkTag = (meta.getAttribute('media') ?? '').includes('dark')
    const color = preference === 'system' ? THEME_COLORS[isDarkTag ? 'dark' : 'light'] : THEME_COLORS[preference]
    meta.setAttribute('content', color)
  })
}
