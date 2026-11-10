import { describe, expect, it } from 'vitest'
import sample from '../../data/sample-skills.json'
import { createGuestDb, createGuestSessionsRepository, createGuestSkillsRepository } from '../../app/utils/guest-repositories'
import type { SampleData } from '../../shared/types/domain'
import { DataError } from '../../shared/utils/data-errors'
import { shiftDate } from '../../shared/utils/dates'
import { deriveStats, groupTotalsBySkill } from '../../shared/utils/stats'

const data = sample as unknown as SampleData
const TODAY = '2026-11-10'

function setup() {
  const db = createGuestDb(data, TODAY)
  const getDb = async () => db
  return { db, skills: createGuestSkillsRepository(getDb), sessions: createGuestSessionsRepository(getDb) }
}

const sessionInput = (over: Partial<{ skillId: string, durationMinutes: number, date: string, notes: string | null }> = {}) =>
  ({ skillId: 'skill-1', durationMinutes: 30, date: TODAY, notes: null, ...over })

describe('createGuestDb', () => {
  it('is the demo data, anchored to today', () => {
    const { db } = setup()
    expect(db.skills).toHaveLength(6)
    expect(db.sessions).toHaveLength(47)
    expect(Math.max(...db.sessions.map(s => s.date.localeCompare(TODAY)))).toBe(0) // none after today…
    expect(db.sessions.some(s => s.date === TODAY)).toBe(true) // …and the latest is today
  })

  it('copies the sample, so one guest can never change what the next one sees', () => {
    const before = JSON.stringify(data)
    const { db } = setup()
    db.sessions[0]!.durationMinutes = 999
    db.skills[0]!.name = 'Changed'
    expect(JSON.stringify(data)).toBe(before)
    expect(createGuestDb(data, TODAY).skills[0]!.name).not.toBe('Changed')
  })
})

describe('guest skills repository', () => {
  it('lists skills with daily totals, from which the README streaks follow', async () => {
    const { skills } = setup()
    const { skills: list, totals } = await skills.list()
    expect(list.map(s => s.name)).toEqual(['Spanish', 'AI Engineering', 'Guitar', 'TypeScript', 'Cooking', 'UI Design'])
    const grouped = groupTotalsBySkill(totals)
    expect(deriveStats(grouped.get('skill-1') ?? [], TODAY).streak).toMatchObject({ current: 8, status: 'active' })
    expect(deriveStats(grouped.get('skill-3') ?? [], TODAY).streak).toMatchObject({ current: 3, status: 'at-risk' })
  })

  it('creates, edits and deletes skills', async () => {
    const { skills } = setup()
    const created = await skills.create({ name: '  Piano ', color: '#EC4899', goal: { type: 'weekly', targetHours: 3 } })
    expect(created).toMatchObject({ name: 'Piano', color: '#EC4899', goal: { type: 'weekly', targetHours: 3 } })
    expect((await skills.list()).skills.at(-1)!.id).toBe(created.id)

    const edited = await skills.update(created.id, { name: 'Piano (jazz)', color: '#EC4899', goal: null })
    expect(edited).toMatchObject({ name: 'Piano (jazz)', goal: null })

    await skills.remove(created.id)
    expect((await skills.list()).skills.some(s => s.id === created.id)).toBe(false)
  })

  it('removing a skill removes its sessions too, like the database cascade', async () => {
    const { db, skills, sessions } = setup()
    const guitar = db.sessions.filter(s => s.skillId === 'skill-2').length
    expect(guitar).toBe(11)
    await skills.remove('skill-2')
    expect(db.sessions).toHaveLength(47 - guitar)
    const page = await sessions.list({ limit: 100 })
    expect(page.items.some(s => s.skillId === 'skill-2')).toBe(false)
    expect((await skills.list()).totals.some(t => t.skillId === 'skill-2')).toBe(false)
  })

  it('reports a skill that no longer exists the way the database path does', async () => {
    const { skills } = setup()
    await expect(skills.update('nope', { name: 'x', color: '#000000', goal: null })).rejects.toThrow(DataError)
    await expect(skills.update('nope', { name: 'x', color: '#000000', goal: null })).rejects.toThrow(/no longer exists/)
  })

  it('hands out copies, never the live objects', async () => {
    const { db, skills } = setup()
    const { skills: list } = await skills.list()
    list[0]!.name = 'tampered'
    expect(db.skills[0]!.name).toBe('Spanish')
  })
})

describe('guest sessions repository', () => {
  it('lists newest first and pages with a keyset cursor, with no gaps or repeats', async () => {
    const { sessions } = setup()
    const seen: string[] = []
    let after: { date: string, createdAt: string } | null = null
    let pages = 0
    for (;;) {
      const page = await sessions.list({ limit: 10, after })
      seen.push(...page.items.map(s => s.id))
      pages++
      if (!page.hasMore) break
      const last = page.items.at(-1)!
      after = { date: last.date, createdAt: last.createdAt }
    }
    expect(pages).toBe(5)
    expect(seen).toHaveLength(47)
    expect(new Set(seen).size).toBe(47)
    const all = (await sessions.list({ limit: 100 })).items
    const dates = all.map(s => s.date)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(seen).toEqual(all.map(s => s.id))
  })

  it('filters by skill', async () => {
    const { sessions } = setup()
    const { items, hasMore } = await sessions.list({ limit: 25, skillId: 'skill-1' })
    expect(items).toHaveLength(14)
    expect(hasMore).toBe(false)
    expect(items.every(s => s.skillId === 'skill-1')).toBe(true)
  })

  it('creates a session that immediately shows up first and counts toward the skill', async () => {
    const { skills, sessions } = setup()
    const created = await sessions.create(sessionInput({ skillId: 'skill-4', durationMinutes: 40, notes: 'Risotto' }))
    expect(created).toMatchObject({ skillId: 'skill-4', durationMinutes: 40, date: TODAY, notes: 'Risotto' })
    expect((await sessions.list({ limit: 5 })).items[0]!.id).toBe(created.id)

    const grouped = groupTotalsBySkill((await skills.list()).totals)
    expect(deriveStats(grouped.get('skill-4') ?? [], TODAY)).toMatchObject({ sessionCount: 6, totalMinutes: 5 * 62 + 40 - 0 })
  })

  it('refuses a session for a skill that does not exist (the foreign key, in memory)', async () => {
    const { sessions } = setup()
    await expect(sessions.create(sessionInput({ skillId: 'ghost' }))).rejects.toThrow(/no longer exists/)
  })

  it('edits a session, including moving it to another skill and day', async () => {
    const { sessions } = setup()
    const created = await sessions.create(sessionInput())
    const updated = await sessions.update(created.id, sessionInput({ skillId: 'skill-3', date: shiftDate(TODAY, -2), durationMinutes: 75, notes: 'moved' }))
    expect(updated).toMatchObject({ id: created.id, skillId: 'skill-3', date: shiftDate(TODAY, -2), durationMinutes: 75, notes: 'moved', createdAt: created.createdAt })
    await expect(sessions.update('nope', sessionInput())).rejects.toThrow(/no longer exists/)
  })

  it('deletes a session', async () => {
    const { db, sessions } = setup()
    const created = await sessions.create(sessionInput())
    await sessions.remove(created.id)
    expect(db.sessions).toHaveLength(47)
  })

  it('gives every new record a distinct id', async () => {
    const { skills, sessions } = setup()
    const ids = new Set([
      (await skills.create({ name: 'A', color: '#000000', goal: null })).id,
      (await sessions.create(sessionInput())).id,
      (await sessions.create(sessionInput())).id,
      (await skills.create({ name: 'B', color: '#000000', goal: null })).id,
    ])
    expect(ids.size).toBe(4)
  })
})
