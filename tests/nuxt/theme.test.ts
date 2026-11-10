// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader, ThemeToggle } from '#components'

const { db, auth, vue } = await vi.hoisted(async () => ({
  db: { upsert: vi.fn(), maybeSingle: vi.fn() },
  auth: { signedIn: false },
  vue: await import('vue'),
}))

// A stand-in for the user_preferences table
mockNuxtImport('useSupabaseClient', () => () => ({
  from: (table: string) => ({
    upsert: (...args: unknown[]) => db.upsert(table, ...args),
    select: () => ({ eq: () => ({ maybeSingle: () => db.maybeSingle() }) }),
  }),
}))
mockNuxtImport('useAuth', () => () => ({
  isAuthenticated: vue.ref(auth.signedIn),
  email: vue.ref(null),
  signOut: async () => ({ error: null }),
}))

const root = () => document.documentElement
const metas = () => [...document.head.querySelectorAll('meta[name="theme-color"]')].map(m => m.getAttribute('content'))
const signInAs = (id: string | null) => { useSupabaseUser().value = id ? ({ sub: id } as never) : null }

beforeEach(() => {
  setActivePinia(createPinia()) // the header's timer bar reads a store
  vi.clearAllMocks()
  vi.useRealTimers()
  localStorage.clear()
  delete root().dataset.theme
  root().classList.remove('theme-transition')
  document.head.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove())
  for (const [media, content] of [['(prefers-color-scheme: light)', '#FAFAF8'], ['(prefers-color-scheme: dark)', '#131614']]) {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = content!
    meta.setAttribute('media', media!)
    document.head.appendChild(meta)
  }
  useState('theme-preference').value = 'system'
  useState('theme-explicit').value = false
  signInAs(null)
  auth.signedIn = false
  db.upsert.mockResolvedValue({ error: null })
  db.maybeSingle.mockResolvedValue({ data: null, error: null })
})

describe('useTheme — this device', () => {
  it('starts on System with nothing chosen', () => {
    const theme = useTheme()
    expect(theme.preference.value).toBe('system')
    expect(theme.explicit.value).toBe(false)
  })

  it('applies a choice at once, remembers it, and marks it as chosen', () => {
    const theme = useTheme()
    theme.set('dark')
    expect(root().dataset.theme).toBe('dark')
    expect(localStorage.getItem('slt-theme')).toBe('dark')
    expect(theme.preference.value).toBe('dark')
    expect(theme.explicit.value).toBe(true)
    expect(theme.resolved.value).toBe('dark')
  })

  it('"System" removes the override so the OS decides — and is remembered as a deliberate choice', () => {
    const theme = useTheme()
    theme.set('dark')
    theme.set('system')
    expect(root().dataset.theme).toBeUndefined()
    expect(localStorage.getItem('slt-theme')).toBe('system')
    expect(theme.explicit.value).toBe(true)
  })

  it('tints the browser chrome with the chosen theme, and restores the per-scheme defaults for System', () => {
    const theme = useTheme()
    theme.set('dark')
    expect(metas()).toEqual(['#131614', '#131614'])
    theme.set('light')
    expect(metas()).toEqual(['#FAFAF8', '#FAFAF8'])
    theme.set('system')
    expect(metas()).toEqual(['#FAFAF8', '#131614'])
  })

  it('fades colours only for a moment while switching', () => {
    vi.useFakeTimers()
    const theme = useTheme()
    theme.set('dark')
    expect(root().classList.contains('theme-transition')).toBe(true)
    vi.advanceTimersByTime(299)
    expect(root().classList.contains('theme-transition')).toBe(true)
    vi.advanceTimersByTime(2)
    expect(root().classList.contains('theme-transition')).toBe(false)
  })

  it('restores a saved choice after a reload without animating (the <head> script already applied it)', () => {
    localStorage.setItem('slt-theme', 'dark')
    const theme = useTheme()
    theme.load()
    expect(theme.preference.value).toBe('dark')
    expect(theme.explicit.value).toBe(true)
    expect(root().classList.contains('theme-transition')).toBe(false)
  })

  it('follows a change made in another tab by applying it here', () => {
    localStorage.setItem('slt-theme', 'light')
    const theme = useTheme()
    theme.load({ apply: true })
    expect(root().dataset.theme).toBe('light')
  })

  it.each([['garbage'], ['Dark'], ['']])('ignores a corrupt saved value (%j)', (stored) => {
    localStorage.setItem('slt-theme', stored)
    const theme = useTheme()
    theme.load()
    expect(theme.preference.value).toBe('system')
    expect(theme.explicit.value).toBe(false)
  })

  it('still switches when storage is blocked — it just isn\'t remembered', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const theme = useTheme()
    expect(() => theme.set('dark')).not.toThrow()
    expect(root().dataset.theme).toBe('dark')
    expect(() => theme.load()).not.toThrow()
    setItem.mockRestore()
    getItem.mockRestore()
  })
})

describe('useTheme — the account', () => {
  it('does not touch the database for visitors and guests', async () => {
    const theme = useTheme()
    theme.set('dark')
    await theme.syncWithAccount()
    expect(db.upsert).not.toHaveBeenCalled()
    expect(db.maybeSingle).not.toHaveBeenCalled()
  })

  it('saves each choice to the signed-in user\'s preferences', () => {
    signInAs('user-1')
    useTheme().set('light')
    expect(db.upsert).toHaveBeenCalledWith('user_preferences', { user_id: 'user-1', theme: 'light' }, { onConflict: 'user_id' })
  })

  it('a failing save never breaks switching', async () => {
    signInAs('user-1')
    db.upsert.mockRejectedValue(new Error('network down'))
    const theme = useTheme()
    expect(() => theme.set('dark')).not.toThrow()
    await Promise.resolve()
    expect(root().dataset.theme).toBe('dark')
  })

  describe('on sign-in', () => {
    it('a NEW device (nothing chosen) inherits the account\'s theme, without writing it back', async () => {
      signInAs('user-1')
      db.maybeSingle.mockResolvedValue({ data: { theme: 'dark' }, error: null })
      const theme = useTheme()
      await theme.syncWithAccount()
      expect(theme.preference.value).toBe('dark')
      expect(root().dataset.theme).toBe('dark')
      expect(localStorage.getItem('slt-theme')).toBe('dark')
      expect(db.upsert).not.toHaveBeenCalled()
    })

    it('a new device does not adopt an account set to System (nothing to adopt)', async () => {
      signInAs('user-1')
      db.maybeSingle.mockResolvedValue({ data: { theme: 'system' }, error: null })
      const theme = useTheme()
      await theme.syncWithAccount()
      expect(theme.explicit.value).toBe(false)
      expect(root().dataset.theme).toBeUndefined()
    })

    it('a device with its own choice keeps it and updates the account', async () => {
      signInAs('user-1')
      const theme = useTheme()
      theme.set('light') // chosen as a visitor
      db.upsert.mockClear()
      db.maybeSingle.mockResolvedValue({ data: { theme: 'dark' }, error: null })
      await theme.syncWithAccount()
      expect(theme.preference.value).toBe('light')
      expect(root().dataset.theme).toBe('light')
      expect(db.upsert).toHaveBeenCalledWith('user_preferences', { user_id: 'user-1', theme: 'light' }, { onConflict: 'user_id' })
    })

    it('does nothing when device and account already agree', async () => {
      signInAs('user-1')
      const theme = useTheme()
      theme.set('dark')
      db.upsert.mockClear()
      db.maybeSingle.mockResolvedValue({ data: { theme: 'dark' }, error: null })
      await theme.syncWithAccount()
      expect(db.upsert).not.toHaveBeenCalled()
    })

    it('creates the account row when there is none yet', async () => {
      signInAs('user-1')
      const theme = useTheme()
      theme.set('dark')
      db.upsert.mockClear()
      db.maybeSingle.mockResolvedValue({ data: null, error: null })
      await theme.syncWithAccount()
      expect(db.upsert).toHaveBeenCalledOnce()
    })

    it('leaves everything alone if the account can\'t be read', async () => {
      signInAs('user-1')
      db.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } })
      const theme = useTheme()
      await theme.syncWithAccount()
      expect(theme.explicit.value).toBe(false)
      expect(db.upsert).not.toHaveBeenCalled()
    })

    it('ignores an invalid value stored in the account', async () => {
      signInAs('user-1')
      db.maybeSingle.mockResolvedValue({ data: { theme: 'neon' }, error: null })
      const theme = useTheme()
      await theme.syncWithAccount()
      expect(theme.explicit.value).toBe(false)
    })
  })
})

describe('ThemeToggle', () => {
  const radios = (w: VueWrapper) => w.findAll<HTMLInputElement>('input[type="radio"]')
  const checkedStates = (w: VueWrapper) => radios(w).map((r: DOMWrapper<HTMLInputElement>) => r.element.checked)

  it('is a named group of three radios, each with a text label for screen readers', async () => {
    const wrapper = await mountSuspended(ThemeToggle)
    expect(wrapper.find('legend').text()).toBe('Theme')
    expect(radios(wrapper)).toHaveLength(3)
    expect(wrapper.findAll('label').map(l => l.text())).toEqual(['System', 'Light', 'Dark'])
    expect(new Set(radios(wrapper).map((r: DOMWrapper<HTMLInputElement>) => r.attributes('name'))).size).toBe(1) // one group: arrow keys move through it
  })

  it('shows the current choice', async () => {
    const wrapper = await mountSuspended(ThemeToggle)
    expect(checkedStates(wrapper)).toEqual([true, false, false])
    useTheme().set('dark')
    await wrapper.vm.$nextTick()
    expect(checkedStates(wrapper)).toEqual([false, false, true])
  })

  it('picking Dark switches the page, and picking System hands control back to the OS', async () => {
    const wrapper = await mountSuspended(ThemeToggle)
    await radios(wrapper)[2]!.setValue()
    expect(root().dataset.theme).toBe('dark')
    expect(localStorage.getItem('slt-theme')).toBe('dark')
    await radios(wrapper)[0]!.setValue()
    expect(root().dataset.theme).toBeUndefined()
  })

  it('gives every option a 44px tap target on small screens', async () => {
    const wrapper = await mountSuspended(ThemeToggle)
    for (const label of wrapper.findAll('label')) expect(label.find('span').classes()).toContain('size-11')
  })
})

describe('the toggle in the header', () => {
  const toggles = (w: VueWrapper) => w.findAll('fieldset')

  it('a visitor gets one, always visible', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(toggles(wrapper)).toHaveLength(1)
    expect(toggles(wrapper)[0]!.classes()).not.toContain('hidden')
  })

  it('someone in the app gets one for wide screens (top row) and one for narrow screens (second row)', async () => {
    useGuest().enter()
    const wrapper = await mountSuspended(AppHeader)
    const found = toggles(wrapper)
    expect(found).toHaveLength(2)
    expect(found[0]!.classes()).toEqual(expect.arrayContaining(['hidden', 'sm:block']))
    expect(found[1]!.classes()).toContain('sm:hidden')
    useGuest().leave()
  })
})
