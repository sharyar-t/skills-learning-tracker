// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppHeader, GuestBanner, GuestUpsell } from '#components'
import enterGuest from '~/middleware/enter-guest'
import requireSession from '~/middleware/require-session'
import { effectScope } from 'vue'

// Guest mode uses the REAL in-memory repositories — only the Supabase client and sign-in state are faked
const { auth, vue } = await vi.hoisted(async () => ({ auth: { signedIn: false }, vue: await import('vue') }))
mockNuxtImport('useSupabaseClient', () => () => ({}))
mockNuxtImport('useAuth', () => () => ({
  isAuthenticated: vue.ref(auth.signedIn),
  email: vue.ref(auth.signedIn ? 'me@example.com' : null),
  signOut: async () => ({ error: null }),
}))

let pinia: ReturnType<typeof createPinia>
const guest = () => useGuest()
const stores = () => ({ skills: useSkillsStore(pinia), sessions: useSessionsStore(pinia) })
const signIn = () => { useSupabaseSession().value = { access_token: 'x' } as never }
const flush = () => flushPromises()

beforeEach(() => {
  auth.signedIn = false
  pinia = createPinia()
  setActivePinia(pinia)
  useSupabaseSession().value = null
  useSupabaseCookieRedirect().path.value = null
  useGuestDatabase().reset() // every test starts from the pristine demo, like every real page load
  guest().leave()
  vi.restoreAllMocks()
})

describe('useGuest', () => {
  it('starts out not a guest, and enter / leave switch the mode for everyone sharing the flag', () => {
    const a = guest()
    const b = guest()
    expect(a.isGuest.value).toBe(false)
    a.enter()
    expect(a.isGuest.value).toBe(true)
    expect(b.isGuest.value).toBe(true) // another component sees it too
    b.leave()
    expect(a.isGuest.value).toBe(false)
  })

  it('persists in a cookie across refreshes, and clears it when the demo ends', async () => {
    guest().enter()
    await flush() // Nuxt writes cookies when the ref's watcher runs
    expect(decodeURIComponent(document.cookie)).toContain('slt-guest="1"') // Nuxt stores cookie values as JSON
    guest().leave()
    await flush()
    expect(decodeURIComponent(document.cookie)).not.toContain('slt-guest="1"')
  })

  it('a real signed-in session always wins', () => {
    guest().enter()
    signIn()
    expect(guest().isGuest.value).toBe(false)
  })

  it('reminds about unsaved changes once per visit, only to guests', () => {
    expect(guest().consumeHint()).toBeNull()
    guest().enter()
    expect(guest().consumeHint()).toMatch(/won't be saved/)
    expect(guest().consumeHint()).toBeNull()
    guest().leave()
    guest().enter()
    expect(guest().consumeHint()).not.toBeNull() // a new visit gets it again
  })
})

describe('the app running on the demo database', () => {
  it('loads six skills and the 47 demo sessions, with live streaks and goals', async () => {
    guest().enter()
    const { skills, sessions } = stores()
    await skills.load()
    await sessions.load()

    expect(skills.skills.map(s => s.name)).toEqual(['Spanish', 'AI Engineering', 'Guitar', 'TypeScript', 'Cooking', 'UI Design'])
    expect(skills.skills.reduce((sum, s) => sum + s.sessionCount, 0)).toBe(47)
    expect(skills.byId.get('skill-1')!.streak).toMatchObject({ current: 8, status: 'active' })
    expect(skills.byId.get('skill-3')!.streak).toMatchObject({ current: 3, status: 'at-risk' })
    expect(skills.byId.get('skill-1')!.goal).toEqual({ type: 'weekly', targetHours: 5 })
    expect(sessions.items).toHaveLength(25)
    expect(sessions.hasMore).toBe(true)
    expect(sessions.items[0]!.date).toBe(skills.today) // the latest practice is today
  })

  it('pages through the whole history', async () => {
    guest().enter()
    const { sessions } = stores()
    await sessions.load()
    await sessions.loadMore()
    expect(sessions.items).toHaveLength(47)
    expect(sessions.hasMore).toBe(false)
  })

  it('logging a session as a guest updates the card, the streak and the list at once', async () => {
    guest().enter()
    const { skills, sessions } = stores()
    await skills.load()
    await sessions.load()
    const before = skills.byId.get('skill-3')! // TypeScript: streak at risk
    expect(before.streak.status).toBe('at-risk')

    const result = await sessions.create({ skillId: 'skill-3', durationMinutes: 45, date: skills.today, notes: 'Generics' })
    expect(result.error).toBeNull()

    const after = skills.byId.get('skill-3')!
    expect(after.totalMinutes).toBe(before.totalMinutes + 45)
    expect(after.sessionCount).toBe(before.sessionCount + 1)
    expect(after.streak).toMatchObject({ current: 4, status: 'active' })
    expect(sessions.items[0]).toMatchObject({ skillId: 'skill-3', notes: 'Generics' })
  })

  it('keeps changes for the rest of the visit, even across a reload of the lists', async () => {
    guest().enter()
    const { skills, sessions } = stores()
    await skills.load()
    await skills.create({ name: 'Piano', color: '#EC4899', goal: null })
    await sessions.create({ skillId: 'skill-1', durationMinutes: 20, date: skills.today, notes: null })

    skills.clear()
    sessions.clear()
    await skills.load()
    await sessions.load()
    expect(skills.skills.map(s => s.name)).toContain('Piano')
    expect(skills.byId.get('skill-1')!.sessionCount).toBe(15)
  })

  it('deleting a skill removes its sessions everywhere', async () => {
    guest().enter()
    const { skills, sessions } = stores()
    await skills.load()
    await sessions.load()
    await skills.remove('skill-2') // Guitar, 11 sessions
    expect(skills.byId.has('skill-2')).toBe(false)
    expect(sessions.items.some(s => s.skillId === 'skill-2')).toBe(false)
    skills.clear()
    await skills.load()
    expect(skills.skills.reduce((sum, s) => sum + s.sessionCount, 0)).toBe(47 - 11)
  })

  it('every new visit starts from the pristine demo', async () => {
    guest().enter()
    const { skills } = stores()
    await skills.load()
    await skills.remove('skill-1')

    // New visit: the database object is gone (page reload), the cookie keeps the mode
    useGuestDatabase().reset()
    skills.clear()
    await skills.load()
    expect(skills.skills).toHaveLength(6)
  })
})

describe('switching between demo and account', () => {
  const sync = () => effectScope().run(() => useDataModeSync())

  it('drops cached data when the demo starts or ends, so demo data never shows in a real account', async () => {
    const { skills, sessions } = stores()
    sync()
    guest().enter()
    await flush()
    await skills.load()
    await sessions.load()
    expect(skills.skills).toHaveLength(6)

    guest().leave()
    await flush()
    expect(skills.skills).toEqual([])
    expect(skills.status).toBe('idle')
    expect(sessions.items).toEqual([])
  })

  it('ends the demo for good when someone signs in, so signing out later doesn\'t resume it', async () => {
    sync()
    guest().enter()
    await flush()
    signIn()
    await flush()
    useSupabaseSession().value = null // …and later they sign out
    await flush()
    expect(guest().isGuest.value).toBe(false)
  })
})

describe('route middleware', () => {
  const to = { fullPath: '/skills?x=1' } as never
  const run = (middleware: unknown) => (middleware as (to: never, from: never) => unknown)(to, {} as never)
  const pushes = () => vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)

  it('require-session lets a guest in', async () => {
    guest().enter()
    const push = pushes()
    expect(await run(requireSession)).toBeUndefined()
    expect(push).not.toHaveBeenCalled()
  })

  it('require-session lets a signed-in user in', async () => {
    signIn()
    const push = pushes()
    expect(await run(requireSession)).toBeUndefined()
    expect(push).not.toHaveBeenCalled()
  })

  it('require-session sends everyone else to sign in, remembering where they were going', async () => {
    const push = pushes()
    await run(requireSession)
    expect(push).toHaveBeenCalledWith('/login')
    expect(useSupabaseCookieRedirect().path.value).toBe('/skills?x=1')
  })

  it('the /guest doorway starts the demo and lands on the dashboard', async () => {
    const push = pushes()
    await run(enterGuest)
    expect(guest().isGuest.value).toBe(true)
    expect(push).toHaveBeenCalledWith('/dashboard')
  })

  it('the /guest doorway does not put a signed-in user into the demo', async () => {
    signIn()
    const push = pushes()
    await run(enterGuest)
    expect(guest().isGuest.value).toBe(false)
    expect(push).toHaveBeenCalledWith('/dashboard')
  })
})

describe('demo UI', () => {
  it('GuestBanner appears only in the demo, says changes aren\'t saved, and offers sign up and exit', async () => {
    const hidden = await mountSuspended(GuestBanner)
    expect(hidden.find('[aria-label="Demo mode"]').exists()).toBe(false)

    guest().enter()
    const wrapper = await mountSuspended(GuestBanner)
    const region = wrapper.find('[aria-label="Demo mode"]')
    expect(region.text()).toContain('Demo mode')
    expect(region.text()).toContain('Changes aren\'t saved')
    expect(region.find('a[href="/signup"]').text()).toBe('Sign up to keep your own data')
    expect(region.findAll('button').map(b => b.text())).toEqual(['Exit demo'])
  })

  it('"Exit demo" ends the mode and returns to the landing page', async () => {
    guest().enter()
    const push = vi.spyOn(useRouter(), 'push').mockResolvedValue(undefined)
    const wrapper = await mountSuspended(GuestBanner)
    await wrapper.find('button').trigger('click')
    await flush()
    expect(guest().isGuest.value).toBe(false)
    expect(push).toHaveBeenCalledWith('/')
  })

  it('GuestUpsell states what signing up unlocks, honestly, with both ways in', async () => {
    const wrapper = await mountSuspended(GuestUpsell)
    const text = wrapper.text()
    expect(text).toContain('Make it yours')
    expect(text).toContain('nothing resets when you close the tab')
    expect(text).toContain('any device')
    expect(text).toContain('demo data isn\'t carried over')
    expect(wrapper.find('a[href="/signup"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
  })

  it('the header gives a guest the app navigation and a Sign up button — no Sign out, no email', async () => {
    guest().enter()
    const wrapper = await mountSuspended(AppHeader)
    const text = wrapper.text()
    expect(wrapper.findAll('nav[aria-label="Main"]').length).toBeGreaterThan(0)
    expect(wrapper.find('a[href="/dashboard"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/skills"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/sessions"]').exists()).toBe(true)
    expect(text).toContain('Log session')
    expect(text).toContain('Sign up')
    expect(text).not.toContain('Sign out')
    expect(text).not.toContain('Sign in')
  })

  it('the header for a stranger still just offers Sign in / Sign up', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.find('nav[aria-label="Main"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.text()).not.toContain('Log session')
  })

  it('a signed-in user keeps Sign out and their email, even with a stale demo flag', async () => {
    auth.signedIn = true
    signIn()
    guest().enter()
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.text()).toContain('Sign out')
    expect(wrapper.text()).toContain('me@example.com')
    expect(wrapper.text()).not.toContain('Sign up')
  })
})
