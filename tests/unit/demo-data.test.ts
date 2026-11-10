import { describe, expect, it } from 'vitest'
import sample from '../../data/sample-skills.json'
import type { SampleData } from '../../shared/types/domain'
import { daysBetween, shiftDate } from '../../shared/utils/dates'
import { buildDemoData } from '../../shared/utils/demo-data'
import { deriveStats, groupTotalsBySkill, totalsFromSessions } from '../../shared/utils/stats'

const data = sample as unknown as SampleData
const ANCHOR = '2026-03-19'

const streaksAsOf = (today: string) => {
  const demo = buildDemoData(data, today)
  const grouped = groupTotalsBySkill(demo.totals)
  return Object.fromEntries(demo.skills.map(s => [s.name, deriveStats(grouped.get(s.id) ?? [], today).streak]))
}

describe('totalsFromSessions', () => {
  it('collapses sessions into one row per skill per day', () => {
    const totals = totalsFromSessions([
      { skillId: 'a', date: '2026-03-19', durationMinutes: 30 },
      { skillId: 'a', date: '2026-03-19', durationMinutes: 15 },
      { skillId: 'b', date: '2026-03-19', durationMinutes: 20 },
      { skillId: 'a', date: '2026-03-18', durationMinutes: 10 },
    ])
    expect(totals).toHaveLength(3)
    expect(totals.find(t => t.skillId === 'a' && t.date === '2026-03-19')).toEqual({ skillId: 'a', date: '2026-03-19', minutes: 45, sessions: 2 })
  })
})

describe('buildDemoData', () => {
  it('leaves the data untouched when today is the sample\'s own last day', () => {
    const demo = buildDemoData(data, ANCHOR)
    expect(demo.sessions).toHaveLength(47)
    expect(demo.skills).toHaveLength(6)
    expect(new Set(demo.sessions.map(s => s.date))).toEqual(new Set(data.sessions.map(s => s.date)))
  })

  it('moves the most recent practice to today, whatever today is', () => {
    for (const today of ['2026-11-10', '2027-02-28', '2026-03-19']) {
      const demo = buildDemoData(data, today)
      expect(demo.sessions[0]!.date).toBe(today)
      expect(demo.sessions.every(s => s.date <= today)).toBe(true)
    }
  })

  it('keeps every gap between sessions exactly as in the original', () => {
    const demo = buildDemoData(data, '2026-11-10')
    const gaps = (dates: string[]) => dates.map(d => daysBetween(dates[0]!, d))
    const original = [...data.sessions.map(s => s.date)].sort().reverse()
    expect(gaps(demo.sessions.map(s => s.date))).toEqual(gaps(original))
  })

  it('returns sessions newest first, and matching daily totals', () => {
    const demo = buildDemoData(data, '2026-11-10')
    const dates = demo.sessions.map(s => s.date)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(demo.totals.reduce((sum, t) => sum + t.sessions, 0)).toBe(47)
    expect(demo.totals.reduce((sum, t) => sum + t.minutes, 0)).toBe(data.sessions.reduce((sum, s) => sum + s.durationMinutes, 0))
  })

  it('keeps the streaks from data/README.md alive on any date (Cooking\'s longest is 1, see streaks.test.ts)', () => {
    for (const today of [ANCHOR, '2026-11-10', shiftDate(ANCHOR, 400)]) {
      const streaks = streaksAsOf(today)
      expect(streaks.Spanish).toMatchObject({ current: 8, status: 'active' })
      expect(streaks.Guitar).toMatchObject({ current: 8, status: 'active' })
      expect(streaks.TypeScript).toMatchObject({ current: 3, status: 'at-risk' })
      expect(streaks.Cooking).toMatchObject({ current: 0, status: 'none' })
      expect(streaks['AI Engineering']).toMatchObject({ current: 1, status: 'active' })
      expect(streaks['UI Design']).toMatchObject({ current: 2, status: 'active' })
    }
  })

  it('does not mutate the sample', () => {
    const before = JSON.stringify(data)
    buildDemoData(data, '2026-11-10')
    expect(JSON.stringify(data)).toBe(before)
  })

  it('copes with an empty sample', () => {
    expect(buildDemoData({ skills: [], sessions: [] }, ANCHOR)).toEqual({ skills: [], sessions: [], totals: [] })
  })
})
