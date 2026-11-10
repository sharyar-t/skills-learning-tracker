// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityHeatmap, GoalRing, NudgeCard } from '#components'
import DashboardPage from '~/pages/dashboard.vue'
import type { DailyTotal, PracticeSession, Skill } from '#shared/types/domain'
import sample from '../../data/sample-skills.json'

const { skillsRepo, sessionsRepo } = vi.hoisted(() => ({
  skillsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  sessionsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
mockNuxtImport('useSupabaseClient', () => () => ({}))
mockNuxtImport('createSkillsRepository', () => () => skillsRepo)
mockNuxtImport('createSessionsRepository', () => () => sessionsRepo)

// The sample data describes 2026-03-19; pin "today" so streaks and weeks are what the data intends
const AS_OF = '2026-03-19'

const skills = sample.skills as Skill[]
const sessions: PracticeSession[] = sample.sessions
  .map(s => ({ id: s.id, skillId: s.skillId, durationMinutes: s.durationMinutes, date: s.date, notes: s.notes, createdAt: s.createdAt }))
  .sort(compareSessionsNewestFirst)

const totals: DailyTotal[] = (() => {
  const map = new Map<string, DailyTotal>()
  for (const s of sessions) {
    const key = `${s.skillId}|${s.date}`
    const t = map.get(key) ?? { skillId: s.skillId, date: s.date, minutes: 0, sessions: 0 }
    t.minutes += s.durationMinutes
    t.sessions += 1
    map.set(key, t)
  }
  return [...map.values()]
})()

let pinia: ReturnType<typeof createPinia>

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 19, 12, 0))
  pinia = createPinia()
  setActivePinia(pinia)
  skillsRepo.list.mockResolvedValue({ skills, totals })
  sessionsRepo.list.mockResolvedValue({ items: sessions.slice(0, 25), hasMore: true })
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('ActivityHeatmap', () => {
  const mountHeatmap = () => mountSuspended(ActivityHeatmap, { props: { totals, skills, today: AS_OF }, attachTo: document.body })
  type W = Awaited<ReturnType<typeof mountHeatmap>>
  const cells = (w: W) => w.findAll('button[aria-label]')
  const cell = (w: W, labelStart: string) => cells(w).find(c => c.attributes('aria-label')!.startsWith(labelStart))!

  it('draws six months of days and dims the days that haven\'t happened yet', async () => {
    const wrapper = await mountHeatmap()
    expect(cells(wrapper)).toHaveLength(27 * 7 - 3) // Fri, Sat, Sun of the current week are in the future
    expect(wrapper.findAll('div[aria-hidden="true"].border-dashed')).toHaveLength(3)
  })

  it('summarises the window', async () => {
    const wrapper = await mountHeatmap()
    expect(wrapper.text()).toContain('47 sessions')
    expect(wrapper.text()).toContain('in the last 6 months')
  })

  it('names every day in words: time, sessions and skills', async () => {
    const wrapper = await mountHeatmap()
    const label = cell(wrapper, 'Today:').attributes('aria-label')!
    expect(label).toMatch(/in 4 sessions/)
    for (const name of ['Spanish', 'Guitar', 'AI Engineering', 'UI Design']) expect(label).toContain(name)
    expect(cell(wrapper, 'Tue, Mar 17:').attributes('aria-label')).toMatch(/Mar 17: \d/)
    expect(cell(wrapper, 'Mon, Mar 9:').attributes('aria-label')).toContain('Mon, Mar 9: ')
  })

  it('highlights today, and today is the only square in the tab order', async () => {
    const wrapper = await mountHeatmap()
    expect(cell(wrapper, 'Today:').classes()).toContain('ring-2')
    const tabbable = cells(wrapper).filter(c => c.attributes('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]!.attributes('aria-label')).toMatch(/^Today:/)
  })

  it('uses the brand intensity levels', async () => {
    const wrapper = await mountHeatmap()
    expect(cell(wrapper, 'Today:').classes()).toContain('bg-heatmap-heavy') // 4 sessions, well over an hour
    expect(cell(wrapper, 'Tue, Mar 10:').classes().some(c => c.startsWith('bg-heatmap-'))).toBe(true)
    const empty = cells(wrapper).find(c => c.attributes('aria-label')!.endsWith('no practice'))!
    expect(empty.classes()).toContain('bg-heatmap-empty')
  })

  it('moves between days with the arrow keys (left/right = week, up/down = day) and stops at today', async () => {
    const wrapper = await mountHeatmap()
    const today = cell(wrapper, 'Today:')
    await today.trigger('keydown', { key: 'ArrowLeft' })
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Thu, Mar 12:/))

    await cell(wrapper, 'Thu, Mar 12:').trigger('keydown', { key: 'ArrowUp' })
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toMatch(/^Wed, Mar 11:/))

    await today.trigger('keydown', { key: 'ArrowRight' }) // next week is the future
    await today.trigger('keydown', { key: 'ArrowDown' }) // tomorrow is the future
    expect(cells(wrapper).filter(c => c.attributes('tabindex') === '0')).toHaveLength(1)
  })

  it('shows a tooltip with date, time and skills on hover, and hides it again', async () => {
    const wrapper = await mountHeatmap()
    await cell(wrapper, 'Today:').trigger('mouseenter')
    const tooltip = wrapper.find('div.absolute.z-10')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Today')
    expect(tooltip.text()).toContain('4 sessions')
    expect(tooltip.text()).toContain('Spanish')
    await cell(wrapper, 'Today:').trigger('mouseleave')
    expect(wrapper.find('div.absolute.z-10').exists()).toBe(false)
  })

  it('renders the tooltip outside the scroll container, which would clip it above the top row', async () => {
    const wrapper = await mountHeatmap()
    await cell(wrapper, 'Today:').trigger('mouseenter')
    const tooltip = wrapper.find('div.absolute.z-10').element
    expect(tooltip.closest('.overflow-x-auto')).toBeNull()
    expect(tooltip.closest('section')).not.toBeNull()
  })

  it('keeps the tooltip open after a tap until Escape', async () => {
    const wrapper = await mountHeatmap()
    const today = cell(wrapper, 'Today:')
    await today.trigger('click')
    await today.trigger('mouseleave')
    expect(wrapper.find('div.absolute.z-10').exists()).toBe(true)
    await today.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('div.absolute.z-10').exists()).toBe(false)
  })

  it('says "no practice" for an empty day', async () => {
    const wrapper = await mountHeatmap()
    const empty = cells(wrapper).find(c => c.attributes('aria-label')!.endsWith('no practice'))!
    await empty.trigger('mouseenter')
    expect(wrapper.find('div.absolute.z-10').text()).toContain('No practice')
  })

  it('filters to a single skill', async () => {
    const wrapper = await mountHeatmap()
    expect(cell(wrapper, 'Today:').attributes('aria-label')).toContain('Spanish')

    const guitar = skills.find(s => s.name === 'Guitar')!
    await wrapper.find('select').setValue(guitar.id)
    const label = cell(wrapper, 'Today:').attributes('aria-label')!
    expect(label).toContain('Guitar')
    expect(label).not.toContain('Spanish')
    expect(wrapper.text()).toMatch(/11 sessions/)
  })

  it('invites the user to log sessions when there is nothing yet', async () => {
    const wrapper = await mountSuspended(ActivityHeatmap, { props: { totals: [], skills, today: AS_OF } })
    expect(wrapper.text()).toContain('will fill in here')
    expect(wrapper.findAll('button[aria-label]').every(b => b.attributes('aria-label')!.endsWith('no practice'))).toBe(true)
  })
})

describe('GoalRing', () => {
  const progress = { type: 'weekly', targetHours: 5, doneMinutes: 195, fraction: 0.65, percent: 65, met: false, behindPace: false } as const

  it('is a progressbar with the numbers as text, not just a drawn arc', async () => {
    const wrapper = await mountSuspended(GoalRing, { props: { skillName: 'Spanish', color: '#059669', progress } })
    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.attributes('aria-label')).toBe('Spanish weekly goal')
    expect(bar.attributes('aria-valuenow')).toBe('65')
    expect(bar.attributes('aria-valuetext')).toBe('3.3 of 5 h this week (65%)')
    expect(wrapper.text()).toContain('65%')
  })

  it('shows a check instead of a percentage once the goal is met, and caps at 100', async () => {
    const met = { ...progress, doneMinutes: 360, fraction: 1, percent: 120, met: true }
    const wrapper = await mountSuspended(GoalRing, { props: { skillName: 'Spanish', color: '#059669', progress: met } })
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuetext')).toContain('(120%)')
    expect(wrapper.text()).not.toContain('120%')
  })
})

describe('NudgeCard', () => {
  it('offers one action and reports which skill it is for', async () => {
    const nudge = { kind: 'at-risk', skillId: 'skill-3', title: 'TypeScript: your 3-day streak is at risk', body: 'Practice today.', cta: 'Log TypeScript' } as const
    const wrapper = await mountSuspended(NudgeCard, { props: { nudge } })
    expect(wrapper.find('h2').text()).toBe(nudge.title)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('act')).toEqual([['skill-3']])
  })

  it('has no button when everything is on track', async () => {
    const nudge = { kind: 'on-track', skillId: null, title: 'You\'re on track', body: 'Nice work.', cta: null } as const
    const wrapper = await mountSuspended(NudgeCard, { props: { nudge } })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

describe('Dashboard page (sample data as of 2026-03-19)', () => {
  async function mountPage() {
    const wrapper = await mountSuspended(DashboardPage, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false))
    await flushPromises()
    return wrapper
  }

  it('gives Spanish the hero card with its weekly goal ring', async () => {
    const wrapper = await mountPage()
    const hero = wrapper.find('section[aria-labelledby]')
    expect(hero.text()).toContain('Featured skill')
    expect(hero.find('h2').text()).toContain('Spanish')
    expect(hero.find('[role="progressbar"]').attributes('aria-label')).toBe('Spanish weekly goal')
    expect(hero.text()).toContain('8-day streak')
    expect(hero.text()).toContain('Practiced today')
  })

  it('suggests the one thing that needs attention: TypeScript\'s streak', async () => {
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('TypeScript: your 3-day streak is at risk')
    expect(wrapper.text()).toContain('Log TypeScript')
  })

  it('shows the other five skills — rings where there is a goal, time where there is not', async () => {
    const wrapper = await mountPage()
    const cards = wrapper.findAll('article')
    expect(cards).toHaveLength(5)
    const typescript = cards.find(c => c.text().includes('TypeScript'))!
    expect(typescript.find('[role="progressbar"]').exists()).toBe(false) // no goal
    const guitar = cards.find(c => c.text().includes('Guitar'))!
    expect(guitar.find('[role="progressbar"]').attributes('aria-label')).toBe('Guitar total goal')
  })

  it('shows an overall streak, the heatmap and the five latest sessions', async () => {
    const wrapper = await mountPage()
    expect(wrapper.find('header').text()).toContain('Overall')
    expect(wrapper.find('header').text()).toMatch(/\d+-day streak/)
    expect(wrapper.findAll('button[aria-label*=": "]').length).toBeGreaterThan(150)
    const recent = wrapper.find('section[aria-labelledby]:last-of-type')
    expect(recent.findAll('li')).toHaveLength(5)
    expect(recent.text()).toContain('View all')
  })

  it('opens the log dialog for the right skill from a card', async () => {
    const wrapper = await mountPage()
    const dialog = (await import('~/composables/useSessionDialog')).useSessionDialog()
    await wrapper.findAll('article').find(c => c.text().includes('TypeScript'))!.find('button[aria-label^="Log a session"]').trigger('click')
    expect(dialog.state.value).toMatchObject({ open: true, skillId: 'skill-3' })
  })

  it('welcomes a user with no skills instead of showing empty widgets', async () => {
    skillsRepo.list.mockResolvedValue({ skills: [], totals: [] })
    sessionsRepo.list.mockResolvedValue({ items: [], hasMore: false })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Add your first skill')
    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Activity')
  })

  it('stays complete with a single skill and two sessions — no empty "Your skills" grid', async () => {
    const one = skills[0]!
    const two = sessions.filter(s => s.skillId === one.id).slice(0, 2)
    skillsRepo.list.mockResolvedValue({ skills: [one], totals: totals.filter(t => t.skillId === one.id).slice(0, 2) })
    sessionsRepo.list.mockResolvedValue({ items: two, hasMore: false })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('Featured skill')
    expect(wrapper.text()).not.toContain('Your skills')
    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.text()).toContain('Activity')
  })

  it('shows an error with a retry when loading fails', async () => {
    skillsRepo.list.mockRejectedValueOnce(new DataError('Couldn\'t load your skills. Check your connection and try again.'))
    const wrapper = await mountSuspended(DashboardPage, { global: { plugins: [pinia] } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Check your connection'))
    expect(wrapper.text()).toContain('Try again')
    await wrapper.findAll('button').find(b => b.text() === 'Try again')!.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Featured skill'))
  })
})
