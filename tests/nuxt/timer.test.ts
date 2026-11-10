// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FeaturedSkillCard, SessionDialogHost, SkillCard, SkillProgressCard, TimerBar } from '#components'
import type { SkillWithStats } from '#shared/types/domain'

// Real guest (in-memory) repositories; only the Supabase client is faked
mockNuxtImport('useSupabaseClient', () => () => ({}))

const KEY = 'slt-timer'
const min = (n: number) => n * 60_000
const stored = () => JSON.parse(localStorage.getItem(KEY) ?? 'null')
const signInAs = (id: string | null) => { useSupabaseUser().value = id ? ({ sub: id } as never) : null }

let pinia: ReturnType<typeof createPinia>
const timer = () => useTimerStore(pinia)
/** A "page reload": the old page's store (and its interval) is gone; fresh stores, same localStorage */
const reload = () => {
  if (pinia) useTimerStore(pinia).$dispose()
  pinia = createPinia()
  setActivePinia(pinia)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(new Date(2026, 10, 10, 18, 0, 0))
  localStorage.clear()
  reload()
  signInAs(null)
  useSupabaseSession().value = null
  useGuestDatabase().reset()
  useGuest().leave()
  useGuest().enter() // most tests run as a demo guest (owner "guest")
  useSessionDialog().close()
  useToast().toasts.value = []
})

afterEach(() => {
  timer().discard() // stops any interval
  vi.useRealTimers()
})

describe('timer store', () => {
  it('starts a running timer for a skill and saves it straight away', () => {
    expect(timer().start('skill-2')).toBe(true)
    expect(timer().state).toMatchObject({ skillId: 'skill-2', status: 'running', startedOn: '2026-11-10' })
    expect(stored()).toMatchObject({ owner: 'guest', state: { skillId: 'skill-2', status: 'running' } })
  })

  it('allows only one timer at a time', () => {
    timer().start('skill-2')
    expect(timer().start('skill-1')).toBe(false)
    expect(timer().state!.skillId).toBe('skill-2')
  })

  it('cannot start for someone who is not in the app', () => {
    useGuest().leave()
    expect(timer().start('skill-2')).toBe(false)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('the clock advances with real time', () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(12) + 34_000)
    expect(formatElapsed(timer().elapsed)).toBe('12:34')
    expect(timer().minutes).toBe(13)
  })

  it('pause stops the clock and resume continues, excluding the break', () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(10))
    timer().pause()
    vi.advanceTimersByTime(min(30)) // a long break
    expect(timer().elapsed).toBe(min(10))
    expect(stored().state).toMatchObject({ status: 'paused', accumulatedMs: min(10), runningSince: null })
    timer().resume()
    vi.advanceTimersByTime(min(5))
    expect(timer().elapsed).toBe(min(15))
  })

  it('announces state changes for screen readers, in words', () => {
    timer().start('skill-2')
    expect(timer().announcement).toBe('Timer started')
    vi.advanceTimersByTime(min(12))
    timer().pause()
    expect(timer().announcement).toBe('Timer paused at 12 minutes')
    timer().resume()
    expect(timer().announcement).toBe('Timer resumed')
  })

  it('discard forgets the timer everywhere', () => {
    timer().start('skill-2')
    timer().discard()
    expect(timer().state).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('keeps working when storage is blocked (it just can\'t be recovered later)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(timer().start('skill-2')).toBe(true)
    vi.advanceTimersByTime(min(3))
    expect(timer().elapsed).toBe(min(3))
    setItem.mockRestore()
  })

  it('saves a heartbeat while the page is open', () => {
    timer().start('skill-2')
    const first = stored().lastSeenAt
    vi.advanceTimersByTime(16_000)
    expect(stored().lastSeenAt).toBeGreaterThan(first)
  })
})

describe('recovering a timer', () => {
  it('survives a page reload and keeps counting through it', () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(7))
    reload()
    expect(timer().state).toBeNull() // fresh page
    vi.advanceTimersByTime(min(3)) // …the reload took a while
    const recovered = timer().restore()
    expect(timer().state).toMatchObject({ skillId: 'skill-2', status: 'running' })
    expect(timer().elapsed).toBe(min(10))
    expect(recovered!.awayMs).toBeGreaterThan(0)
  })

  it('keeps running while the browser is closed, and says how long it was away', () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(2))
    timer().heartbeat()
    reload() // browser closed here
    vi.setSystemTime(Date.now() + min(48)) // …and reopened 48 minutes later
    const recovered = timer().restore()
    expect(timer().elapsed).toBe(min(50))
    expect(recovered!.awayMs).toBe(min(48))
  })

  it('a paused timer comes back paused, with nothing added', () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(20))
    timer().pause()
    reload()
    vi.setSystemTime(Date.now() + min(600))
    const recovered = timer().restore()
    expect(timer().state!.status).toBe('paused')
    expect(timer().elapsed).toBe(min(20))
    expect(recovered!.awayMs).toBe(0)
  })

  it('resumes ticking after recovery', () => {
    timer().start('skill-2')
    reload()
    timer().restore()
    vi.advanceTimersByTime(5000)
    expect(timer().elapsed).toBe(5000)
  })

  it('never hands one person\'s timer to another on a shared device', () => {
    timer().start('skill-2') // as the demo guest
    reload()
    useGuest().leave()
    signInAs('user-1')
    expect(timer().restore()).toBeNull()
    expect(timer().state).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull() // and it is removed, not left lying around
  })

  it('hides the timer when signed out, but keeps it for its owner', () => {
    useGuest().leave()
    signInAs('user-1')
    timer().start('skill-2')
    signInAs(null) // signed out
    timer().restore()
    expect(timer().state).toBeNull()
    expect(stored()).toMatchObject({ owner: 'user-1' })
    signInAs('user-1') // back again
    timer().restore()
    expect(timer().state).toMatchObject({ skillId: 'skill-2' })
  })

  it.each([['garbage'], ['{"state":{}}'], ['null']])('ignores a corrupt saved timer (%s)', (raw) => {
    localStorage.setItem(KEY, raw)
    expect(timer().restore()).toBeNull()
    expect(timer().state).toBeNull()
  })

  it('deleting the skill discards its timer; other skills\' timers are untouched', async () => {
    const skills = useSkillsStore(pinia)
    await skills.load()
    timer().start('skill-2')
    await skills.remove('skill-1')
    expect(timer().state).not.toBeNull()
    await skills.remove('skill-2')
    expect(timer().state).toBeNull()
  })
})

describe('TimerBar (the persistent indicator)', () => {
  const mountBar = async () => {
    const wrapper = await mountSuspended(TimerBar, { global: { plugins: [pinia] }, attachTo: document.body })
    await flushPromises()
    return wrapper
  }

  it('is absent when there is no timer', async () => {
    const wrapper = await mountBar()
    expect(wrapper.find('[aria-label="Practice timer"]').exists()).toBe(false)
  })

  it('shows the skill, the state in words, and the elapsed time as a timer', async () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(12) + 34_000)
    const wrapper = await mountBar()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Guitar'))
    expect(wrapper.text()).toContain('timer running')
    const clock = wrapper.find('[role="timer"]')
    expect(clock.text()).toBe('12:34')
    expect(clock.attributes('aria-label')).toBe('Elapsed practice time')
    expect(clock.attributes('aria-live')).toBeUndefined() // not announced every second
  })

  it('ticks on screen', async () => {
    timer().start('skill-2')
    const wrapper = await mountBar()
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="timer"]').text()).toBe('00:03')
  })

  it('Pause becomes Resume, and the status text changes with it', async () => {
    timer().start('skill-2')
    const wrapper = await mountBar()
    const toggle = () => wrapper.findAll('button').find(b => /Pause|Resume/.test(b.text()))!
    expect(toggle().text()).toBe('Pause')
    await toggle().trigger('click')
    expect(timer().state!.status).toBe('paused')
    expect(toggle().text()).toBe('Resume')
    expect(wrapper.text()).toContain('timer paused')
    await toggle().trigger('click')
    expect(timer().state!.status).toBe('running')
  })

  it('"Stop & log" pauses and opens the log form with the timed minutes, skill and start date', async () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(25) + 10_000)
    const wrapper = await mountBar()
    await vi.waitFor(() => expect(wrapper.text()).toContain('Guitar'))
    await wrapper.findAll('button').find(b => b.text().includes('Stop'))!.trigger('click')
    expect(timer().state!.status).toBe('paused')
    expect(useSessionDialog().state.value).toMatchObject({ open: true, skillId: 'skill-2', prefill: { minutes: 25, date: '2026-11-10' }, source: 'timer' })
  })

  it('discarding asks first, and says what would be lost', async () => {
    timer().start('skill-2')
    vi.advanceTimersByTime(min(8))
    const wrapper = await mountBar()
    await wrapper.find('[aria-label="Discard timer"]').trigger('click')
    expect(timer().state).not.toBeNull() // nothing lost yet
    const dialog = wrapper.find('dialog')
    expect(dialog.attributes('role')).toBe('alertdialog')
    expect(dialog.text()).toContain('08:00 of practice won\'t be logged')
    await dialog.findAll('button').find(b => b.text() === 'Discard timer')!.trigger('click')
    await flushPromises()
    expect(timer().state).toBeNull()
  })

  it('announces changes in a polite status region', async () => {
    timer().start('skill-2')
    const wrapper = await mountBar()
    expect(wrapper.find('p[role="status"]').text()).toBe('Timer started')
  })
})

describe('from the timer into the log', () => {
  const openFromTimer = async (minutes: number) => {
    await useSkillsStore(pinia).load()
    timer().start('skill-2')
    vi.advanceTimersByTime(min(minutes))
    timer().pause()
    useSessionDialog().openLog({ skillId: 'skill-2', prefill: { minutes: timer().minutes, date: timer().state!.startedOn }, source: 'timer' })
    const wrapper = await mountSuspended(SessionDialogHost, { global: { plugins: [pinia] }, attachTo: document.body })
    await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(true))
    return wrapper
  }

  it('pre-fills the form with the timed duration and skill, and says it can be adjusted', async () => {
    const wrapper = await openFromTimer(42)
    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe('42m')
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('skill-2')
    expect(wrapper.text()).toContain('Your timer recorded 42m. Adjust it if you took a break.')
  })

  it('saving logs the session (with any adjustment) and ends the timer', async () => {
    const wrapper = await openFromTimer(42)
    await wrapper.find('input[type="text"]').setValue('35') // took a 7 minute break
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(timer().state).toBeNull())
    expect(localStorage.getItem(KEY)).toBeNull()
    const sessions = useSessionsStore(pinia)
    await sessions.load()
    expect(sessions.items[0]).toMatchObject({ skillId: 'skill-2', durationMinutes: 35, date: '2026-11-10' })
    expect(useToast().toasts.value.at(-1)!.title).toBe('35m of Guitar logged')
  })

  it('closing the form instead keeps the timer, paused — nothing is lost', async () => {
    const wrapper = await openFromTimer(42)
    await wrapper.findAll('button').find(b => b.text() === 'Cancel')!.trigger('click')
    expect(useSessionDialog().state.value.open).toBe(false)
    expect(timer().state).toMatchObject({ status: 'paused', accumulatedMs: min(42) })
  })

  it('a session that started before midnight is logged for the day it started', async () => {
    await useSkillsStore(pinia).load()
    vi.setSystemTime(new Date(2026, 10, 10, 23, 50, 0))
    timer().start('skill-2')
    vi.setSystemTime(new Date(2026, 10, 11, 0, 20, 0))
    timer().pause()
    expect(timer().state!.startedOn).toBe('2026-11-10')
    expect(timer().minutes).toBe(30)
  })
})

describe('starting a timer from a card', () => {
  const skill: SkillWithStats = {
    id: 'skill-2', name: 'Guitar', color: '#8B5CF6', goal: null, createdAt: '2025-12-15T14:30:00Z',
    totalMinutes: 390, sessionCount: 11, lastPracticedOn: '2026-11-10', streak: { current: 8, longest: 8, status: 'active' },
  }

  it('the hero card offers "Start timer" only where a timer can run', async () => {
    const without = await mountSuspended(FeaturedSkillCard, { props: { skill, progress: null, today: '2026-11-10' } })
    expect(without.text()).not.toContain('Start timer')

    const wrapper = await mountSuspended(FeaturedSkillCard, { props: { skill, progress: null, today: '2026-11-10', canStartTimer: true } })
    await wrapper.findAll('button').find(b => b.text().includes('Start timer'))!.trigger('click')
    expect(wrapper.emitted('timer')).toHaveLength(1)
  })

  const TIMER_BUTTON = 'button[aria-label="Start a timer for Guitar"]'

  it('the dashboard skill card has a labelled 44px timer button', async () => {
    const wrapper = await mountSuspended(SkillProgressCard, { props: { skill, progress: null, today: '2026-11-10', canStartTimer: true } })
    expect(wrapper.find(TIMER_BUTTON).classes()).toContain('size-11')
    await wrapper.find(TIMER_BUTTON).trigger('click')
    expect(wrapper.emitted('timer')).toHaveLength(1)

    const hidden = await mountSuspended(SkillProgressCard, { props: { skill, progress: null, today: '2026-11-10' } })
    expect(hidden.find(TIMER_BUTTON).exists()).toBe(false)
  })

  it('the skills page card has a labelled 44px timer button', async () => {
    const wrapper = await mountSuspended(SkillCard, { props: { skill, canStartTimer: true } })
    expect(wrapper.find(TIMER_BUTTON).classes()).toContain('size-11')
    await wrapper.find(TIMER_BUTTON).trigger('click')
    expect(wrapper.emitted('timer')).toHaveLength(1)

    const hidden = await mountSuspended(SkillCard, { props: { skill } })
    expect(hidden.find(TIMER_BUTTON).exists()).toBe(false)
  })
})
