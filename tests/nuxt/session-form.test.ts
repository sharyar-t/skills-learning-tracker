// @vitest-environment nuxt
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionForm } from '#components'
import type { PracticeSession, SessionInput } from '#shared/types/domain'
import { DataError } from '../../shared/utils/data-errors'

const { skillsRepo, sessionsRepo } = vi.hoisted(() => ({
  skillsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  sessionsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
// The Supabase client is only handed to the (mocked) repositories, so a stub is enough
mockNuxtImport('useSupabaseClient', () => () => ({}))
mockNuxtImport('createSkillsRepository', () => () => skillsRepo)
mockNuxtImport('createSessionsRepository', () => () => sessionsRepo)

const today = toISODate()
const yesterday = shiftDate(today, -1)

const guitar = { id: 'guitar', name: 'Guitar', color: '#8B5CF6', goal: null, createdAt: '2025-12-15T14:30:00Z' }
const spanish = { id: 'spanish', name: 'Spanish', color: '#059669', goal: null, createdAt: '2025-11-01T10:00:00Z' }

function savedAs(input: SessionInput, id = 'new-1'): PracticeSession {
  return { id, skillId: input.skillId, durationMinutes: input.durationMinutes, date: input.date, notes: input.notes, createdAt: new Date().toISOString() }
}

// A fresh Pinia per test: the test Nuxt app doesn't install the Pinia plugin, so we do it ourselves
let pinia: ReturnType<typeof createPinia>

async function stores() {
  return { skills: useSkillsStore(pinia), sessions: useSessionsStore(pinia) }
}

async function mountForm(props: { session?: PracticeSession | null, skillId?: string | null } = {}) {
  const { skills } = await stores()
  await skills.load()
  return mountSuspended(SessionForm, { props, global: { plugins: [pinia] } })
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
  // Guitar was practiced yesterday (streak 1, at risk); Spanish never
  skillsRepo.list.mockResolvedValue({
    skills: [spanish, guitar],
    totals: [{ skillId: 'guitar', date: yesterday, minutes: 30, sessions: 1 }],
  })
  sessionsRepo.create.mockImplementation(async (input: SessionInput) => savedAs(input))
})

const durationInput = (w: Awaited<ReturnType<typeof mountForm>>) => w.find('input[type="text"]')
const submit = (w: Awaited<ReturnType<typeof mountForm>>) => w.find('form').trigger('submit')

describe('SessionForm — logging', () => {
  it('defaults to the most recently practiced skill', async () => {
    const wrapper = await mountForm()
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('guitar')
  })

  it('preselects the skill it was opened from', async () => {
    const wrapper = await mountForm({ skillId: 'spanish' })
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('spanish')
  })

  it('logs a preset duration for today and reports the streak change', async () => {
    const wrapper = await mountForm()
    await wrapper.findAll('button').find(b => b.text() === '30m')!.trigger('click')
    expect(wrapper.find('[aria-pressed="true"]').text()).toBe('30m')
    await submit(wrapper)
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))

    expect(sessionsRepo.create).toHaveBeenCalledWith({ skillId: 'guitar', durationMinutes: 30, date: today, notes: null })
    const [saved] = wrapper.emitted('saved')![0] as [{ before: { current: number }, after: { current: number, status: string }, skillName: string }]
    expect(saved.skillName).toBe('Guitar')
    expect(saved.before.current).toBe(1)
    expect(saved.after).toMatchObject({ current: 2, status: 'active' })
  })

  it('understands free-text durations and shows how it was read', async () => {
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('1h 30m')
    expect(wrapper.text()).toContain('= 1h 30m')
    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalled())
    expect(sessionsRepo.create.mock.calls[0]![0]).toMatchObject({ durationMinutes: 90 })
  })

  it('warns about sessions over 8 hours but still allows them', async () => {
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('9h')
    expect(wrapper.text()).toContain('long session')
    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalled())
  })

  it('updates the skill card numbers immediately, without refetching', async () => {
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('45')
    await submit(wrapper)
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))

    const guitarNow = (await stores()).skills.byId.get('guitar')!
    expect(guitarNow).toMatchObject({ totalMinutes: 75, sessionCount: 2, lastPracticedOn: today })
    expect(guitarNow.streak).toMatchObject({ current: 2, status: 'active' })
    expect(skillsRepo.list).toHaveBeenCalledTimes(1)
  })

  it('backfills a previous day and remembers the skill for next time', async () => {
    const wrapper = await mountForm()
    await wrapper.find('select').setValue('spanish')
    await wrapper.find('input[value="yesterday"]').setValue()
    await durationInput(wrapper).setValue('20')
    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalled())

    expect(sessionsRepo.create.mock.calls[0]![0]).toMatchObject({ skillId: 'spanish', date: yesterday, durationMinutes: 20 })
    expect(localStorage.getItem('slt-last-skill')).toContain('spanish')
  })

  it('keeps notes collapsed until asked, and trims them when saved', async () => {
    const wrapper = await mountForm()
    expect(wrapper.find('textarea').exists()).toBe(false)
    await wrapper.findAll('button').find(b => b.text().includes('Add notes'))!.trigger('click')
    await wrapper.find('textarea').setValue('  Scales and\nchord changes  ')
    await durationInput(wrapper).setValue('30')
    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalled())
    expect(sessionsRepo.create.mock.calls[0]![0].notes).toBe('Scales and\nchord changes')
  })
})

describe('SessionForm — validation and failures', () => {
  it('blocks an empty duration with a specific, associated error', async () => {
    const wrapper = await mountForm()
    await submit(wrapper)

    const input = durationInput(wrapper)
    expect(input.attributes('aria-invalid')).toBe('true')
    const errorId = input.attributes('aria-describedby')!.split(' ').find(id => id.endsWith('-error'))!
    expect(wrapper.find(`#${errorId}`).text()).toMatch(/how long/)
    expect(sessionsRepo.create).not.toHaveBeenCalled()
  })

  it('rejects durations it cannot read', async () => {
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('a while')
    await submit(wrapper)
    expect(wrapper.text()).toContain('Couldn\'t read that')
    expect(sessionsRepo.create).not.toHaveBeenCalled()
  })

  it('keeps everything the user typed when saving fails, and does not report success', async () => {
    sessionsRepo.create.mockRejectedValueOnce(new DataError('Couldn\'t save your session. Check your connection and try again.'))
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('45')
    await submit(wrapper)
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))

    expect(wrapper.find('[role="alert"]').text()).toContain('Check your connection')
    expect((durationInput(wrapper).element as HTMLInputElement).value).toBe('45')
    expect(wrapper.emitted('saved')).toBeUndefined()
    expect((await stores()).skills.byId.get('guitar')!.totalMinutes).toBe(30) // nothing was applied
  })

  it('asks before saving an identical session twice in a row', async () => {
    const wrapper = await mountForm()
    await durationInput(wrapper).setValue('30')
    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalledTimes(1))

    // The dialog normally closes; here the same form is submitted again straight away
    await submit(wrapper)
    expect(sessionsRepo.create).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="alert"]').text()).toContain('You just logged 30m of Guitar for today')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Log it again')

    await submit(wrapper)
    await vi.waitFor(() => expect(sessionsRepo.create).toHaveBeenCalledTimes(2))
  })
})

describe('SessionForm — editing', () => {
  const existing: PracticeSession = { id: 's-1', skillId: 'guitar', durationMinutes: 90, date: yesterday, notes: 'Barre chords', createdAt: '2026-03-18T18:00:00Z' }

  it('prefills the session, opens its notes and selects the right day', async () => {
    const wrapper = await mountForm({ session: existing })
    expect((durationInput(wrapper).element as HTMLInputElement).value).toBe('1h 30m')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Barre chords')
    expect((wrapper.find('input[value="yesterday"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Save changes')
  })

  it('moves practice between skills and days in the totals when edited', async () => {
    sessionsRepo.update.mockImplementation(async (_id: string, input: SessionInput) => savedAs(input, 's-1'))
    const { skills } = await stores()
    skills.adjustTotals('guitar', yesterday, 90 - 30, 0) // totals already include the 90 min session
    const wrapper = await mountForm({ session: existing })

    await wrapper.find('select').setValue('spanish')
    await durationInput(wrapper).setValue('60')
    await submit(wrapper)
    await vi.waitFor(() => expect(wrapper.emitted('saved')).toHaveLength(1))

    expect(sessionsRepo.update).toHaveBeenCalledWith('s-1', expect.objectContaining({ skillId: 'spanish', durationMinutes: 60 }))
    expect(skills.byId.get('spanish')).toMatchObject({ totalMinutes: 60, sessionCount: 1 })
  })
})
