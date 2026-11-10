// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PracticeSession, SessionInput } from '#shared/types/domain'
import { DataError } from '../../shared/utils/data-errors'

const { skillsRepo, sessionsRepo } = vi.hoisted(() => ({
  skillsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  sessionsRepo: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))
mockNuxtImport('useSupabaseClient', () => () => ({}))
mockNuxtImport('createSkillsRepository', () => () => skillsRepo)
mockNuxtImport('createSessionsRepository', () => () => sessionsRepo)

const today = toISODate()
const day = (offset: number) => shiftDate(today, offset)

const skill = (id: string) => ({ id, name: id, color: '#059669', goal: null, createdAt: '2025-11-01T10:00:00Z' })
const session = (id: string, skillId: string, date: string, minutes = 30, createdAt = `${date}T10:00:00Z`): PracticeSession =>
  ({ id, skillId, durationMinutes: minutes, date, notes: null, createdAt })

let pinia: ReturnType<typeof createPinia>

async function setup(items: PracticeSession[], hasMore = false) {
  const skills = useSkillsStore(pinia)
  const sessions = useSessionsStore(pinia)
  skillsRepo.list.mockResolvedValue({
    skills: [skill('guitar'), skill('spanish')],
    totals: items.map(s => ({ skillId: s.skillId, date: s.date, minutes: s.durationMinutes, sessions: 1 })),
  })
  sessionsRepo.list.mockResolvedValue({ items, hasMore })
  await skills.load()
  await sessions.load()
  return { skills, sessions }
}

const createdFrom = (input: SessionInput, id = 'new'): PracticeSession => ({ id, ...input, createdAt: new Date().toISOString() })

beforeEach(() => {
  vi.clearAllMocks()
  pinia = createPinia()
  setActivePinia(pinia)
  sessionsRepo.create.mockImplementation(async (input: SessionInput) => createdFrom(input))
})

describe('sessions store — paging', () => {
  it('loads the first page and asks for the next one after the last item', async () => {
    const first = [session('a', 'guitar', day(0)), session('b', 'guitar', day(-1))]
    const { sessions } = await setup(first, true)
    expect(sessions.hasMore).toBe(true)

    sessionsRepo.list.mockResolvedValueOnce({ items: [session('c', 'guitar', day(-2))], hasMore: false })
    await sessions.loadMore()

    expect(sessionsRepo.list).toHaveBeenLastCalledWith({
      limit: 25, skillId: null, after: { date: day(-1), createdAt: `${day(-1)}T10:00:00Z` },
    })
    expect(sessions.items.map(s => s.id)).toEqual(['a', 'b', 'c'])
    expect(sessions.hasMore).toBe(false)
  })

  it('keeps the list and reports an error when loading more fails', async () => {
    const { sessions } = await setup([session('a', 'guitar', day(0))], true)
    sessionsRepo.list.mockRejectedValueOnce(new DataError('Couldn\'t load more sessions. Check your connection and try again.'))
    await sessions.loadMore()
    expect(sessions.items).toHaveLength(1)
    expect(sessions.loadMoreError).toMatch(/Check your connection/)
    expect(sessions.loadingMore).toBe(false)
  })
})

describe('sessions store — logging', () => {
  it('puts a new session in its place, newest first', async () => {
    const { sessions } = await setup([session('a', 'guitar', day(-1)), session('b', 'guitar', day(-3))])
    await sessions.create({ skillId: 'guitar', durationMinutes: 20, date: day(-2), notes: null })
    await sessions.create({ skillId: 'guitar', durationMinutes: 10, date: day(0), notes: null })
    expect(sessions.items.map(s => s.date)).toEqual([day(0), day(-1), day(-2), day(-3)])
  })

  it('does not splice a session into the middle when it belongs to a page that is not loaded yet', async () => {
    const { skills, sessions } = await setup([session('a', 'guitar', day(0)), session('b', 'guitar', day(-1))], true)
    await sessions.create({ skillId: 'guitar', durationMinutes: 15, date: day(-30), notes: null })
    expect(sessions.items).toHaveLength(2) // it will arrive with "Load more"
    expect(skills.byId.get('guitar')!.sessionCount).toBe(3) // but the numbers are already right
  })

  it('leaves the filtered list alone when the session is for another skill', async () => {
    const { sessions } = await setup([session('a', 'guitar', day(0))])
    sessionsRepo.list.mockResolvedValueOnce({ items: [session('a', 'guitar', day(0))], hasMore: false })
    await sessions.setFilter('guitar')
    expect(sessionsRepo.list).toHaveBeenLastCalledWith({ limit: 25, skillId: 'guitar' })

    await sessions.create({ skillId: 'spanish', durationMinutes: 30, date: day(0), notes: null })
    expect(sessions.items.map(s => s.skillId)).toEqual(['guitar'])
  })

  it('changes nothing when saving fails', async () => {
    const { skills, sessions } = await setup([session('a', 'guitar', day(0))])
    sessionsRepo.create.mockRejectedValueOnce(new DataError('nope'))
    const result = await sessions.create({ skillId: 'guitar', durationMinutes: 45, date: day(0), notes: null })
    expect(result.error).toBe('nope')
    expect(sessions.items).toHaveLength(1)
    expect(skills.byId.get('guitar')!.totalMinutes).toBe(30)
  })

  it('remembers a save so an immediate repeat can be flagged', async () => {
    const { sessions } = await setup([])
    const input = { skillId: 'guitar', durationMinutes: 30, date: day(0), notes: null }
    expect(sessions.isRecentDuplicate(input)).toBe(false)
    await sessions.create(input)
    expect(sessions.isRecentDuplicate(input)).toBe(true)
    expect(sessions.isRecentDuplicate({ ...input, durationMinutes: 31 })).toBe(false)
    expect(sessions.isRecentDuplicate({ ...input, skillId: 'spanish' })).toBe(false)
    expect(sessions.isRecentDuplicate({ ...input, date: day(-1) })).toBe(false)
  })
})

describe('sessions store — deleting', () => {
  it('removes the session and takes its time (and streak day) off the skill', async () => {
    const a = session('a', 'guitar', day(0), 30)
    const b = session('b', 'guitar', day(-1), 45)
    const { skills, sessions } = await setup([a, b])
    expect(skills.byId.get('guitar')!.streak).toMatchObject({ current: 2, status: 'active' })

    await sessions.remove(a)
    expect(sessions.items.map(s => s.id)).toEqual(['b'])
    expect(skills.byId.get('guitar')).toMatchObject({ totalMinutes: 45, sessionCount: 1 })
    expect(skills.byId.get('guitar')!.streak).toMatchObject({ current: 1, status: 'at-risk' })
  })

  it('keeps everything when the delete fails', async () => {
    const a = session('a', 'guitar', day(0))
    const { skills, sessions } = await setup([a])
    sessionsRepo.remove.mockRejectedValueOnce(new DataError('Couldn\'t delete this session.'))
    const result = await sessions.remove(a)
    expect(result.error).toMatch(/delete/)
    expect(sessions.items).toHaveLength(1)
    expect(skills.byId.get('guitar')!.sessionCount).toBe(1)
  })

  it('deleting a skill also clears its sessions and totals', async () => {
    const { skills, sessions } = await setup([session('a', 'guitar', day(0)), session('b', 'spanish', day(0))])
    await skills.remove('guitar')
    expect(skillsRepo.remove).toHaveBeenCalledWith('guitar')
    expect(sessions.items.map(s => s.skillId)).toEqual(['spanish'])
    expect(skills.byId.has('guitar')).toBe(false)
    expect(skills.byId.get('spanish')!.sessionCount).toBe(1)
  })

  it('clear() resets everything, so the next account never sees stale data', async () => {
    const { skills, sessions } = await setup([session('a', 'guitar', day(0))], true)
    skills.clear()
    sessions.clear()
    expect(skills.skills).toEqual([])
    expect(sessions.items).toEqual([])
    expect(sessions.status).toBe('idle')
    expect(sessions.hasMore).toBe(false)
  })
})
