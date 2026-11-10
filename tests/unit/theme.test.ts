import { describe, expect, it } from 'vitest'
import { parseTheme, resolveTheme, THEME_COLORS, THEME_STORAGE_KEY, themeInitScript } from '../../shared/utils/theme'

describe('parseTheme', () => {
  it.each(['light', 'dark', 'system'])('accepts %s', (value) => {
    expect(parseTheme(value)).toBe(value)
  })

  it.each([null, undefined, '', 'Dark', 'auto', 'blue', 1, {}, ['dark']])('rejects %j', (value) => {
    expect(parseTheme(value)).toBeNull()
  })
})

describe('resolveTheme', () => {
  it('follows the OS only for "system"', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })

  it('an explicit choice beats the OS', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('themeInitScript (runs in <head> before first paint)', () => {
  /** Execute the script against a stand-in document and storage */
  function run(stored: string | null, options: { storageThrows?: boolean } = {}) {
    const metas = [{ content: THEME_COLORS.light }, { content: THEME_COLORS.dark }].map(m => ({
      ...m,
      setAttribute(name: string, value: string) { if (name === 'content') this.content = value },
    }))
    const documentElement = { dataset: {} as Record<string, string> }
    const doc = { documentElement, querySelectorAll: (sel: string) => (sel === 'meta[name="theme-color"]' ? metas : []) }
    const storage = {
      getItem: (key: string) => {
        if (options.storageThrows) throw new Error('blocked')
        return key === THEME_STORAGE_KEY ? stored : null
      },
    }
    new Function('document', 'localStorage', themeInitScript())(doc, storage)
    return { theme: documentElement.dataset.theme, colors: metas.map(m => m.content) }
  }

  it('applies a saved dark choice and tints the browser chrome to match', () => {
    expect(run('dark')).toEqual({ theme: 'dark', colors: [THEME_COLORS.dark, THEME_COLORS.dark] })
  })

  it('applies a saved light choice', () => {
    expect(run('light')).toEqual({ theme: 'light', colors: [THEME_COLORS.light, THEME_COLORS.light] })
  })

  it.each([['system'], [null], ['garbage'], ['']])('leaves the OS in charge for %j', (stored) => {
    expect(run(stored)).toEqual({ theme: undefined, colors: [THEME_COLORS.light, THEME_COLORS.dark] })
  })

  it('never throws when storage is blocked (private mode, disabled cookies)', () => {
    expect(() => run('dark', { storageThrows: true })).not.toThrow()
    expect(run('dark', { storageThrows: true }).theme).toBeUndefined()
  })

  it('is small enough to inline without cost', () => {
    expect(themeInitScript().length).toBeLessThan(400)
  })
})
