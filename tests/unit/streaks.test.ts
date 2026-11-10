import { describe, expect, it } from 'vitest'
import sample from '../../data/sample-skills.json'
import { toISODate } from '../../shared/utils/dates'
import { computeStreak } from '../../shared/utils/streaks'

describe('computeStreak', () => {
  const today = '2026-03-19'

  it('returns none for no sessions', () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0, status: 'none' })
  })

  it('is active when practiced today', () => {
    expect(computeStreak(['2026-03-17', '2026-03-18', '2026-03-19'], today)).toEqual({ current: 3, longest: 3, status: 'active' })
  })

  it('is at risk (not broken) when the last practice was yesterday', () => {
    expect(computeStreak(['2026-03-17', '2026-03-18'], today)).toEqual({ current: 2, longest: 2, status: 'at-risk' })
  })

  it('breaks after a fully missed day but remembers the longest streak', () => {
    expect(computeStreak(['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-17'], today)).toEqual({ current: 0, longest: 3, status: 'none' })
  })

  it('counts a day once however many sessions it has', () => {
    expect(computeStreak(['2026-03-19', '2026-03-19', '2026-03-19', '2026-03-18'], today).current).toBe(2)
  })

  it('does not depend on input order', () => {
    expect(computeStreak(['2026-03-19', '2026-03-17', '2026-03-18'], today).current).toBe(3)
  })

  it('ignores future dates', () => {
    expect(computeStreak(['2026-03-19', '2026-03-20', '2026-03-21'], today)).toEqual({ current: 1, longest: 1, status: 'active' })
  })

  it('finds a longest streak that is not the current one', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-03-19']
    expect(computeStreak(dates, today)).toEqual({ current: 1, longest: 4, status: 'active' })
  })

  it('counts consecutive days across month, year and DST boundaries', () => {
    expect(computeStreak(['2025-12-31', '2026-01-01'], '2026-01-01').current).toBe(2)
    expect(computeStreak(['2026-02-28', '2026-03-01'], '2026-03-01').current).toBe(2)
    // US DST starts 2026-03-08, EU 2026-03-29 — a 23-hour day must still be one day
    expect(computeStreak(['2026-03-07', '2026-03-08', '2026-03-09'], '2026-03-09').current).toBe(3)
    expect(computeStreak(['2026-03-28', '2026-03-29', '2026-03-30'], '2026-03-30').current).toBe(3)
  })
})

describe('computeStreak on the sample data (data/README.md, as of 2026-03-19)', () => {
  const byName = (name: string) => {
    const skill = sample.skills.find(s => s.name === name)!
    return computeStreak(sample.sessions.filter(s => s.skillId === skill.id).map(s => s.date), '2026-03-19')
  }

  it.each([
    ['Spanish', 8, 8],
    ['Guitar', 8, 8],
    ['TypeScript', 3, 3],
    // data/README.md lists a longest streak of 2 here, but the sessions (Mar 5, 10, 13, 15, 17) never fall on consecutive days
    ['Cooking', 0, 1],
    ['AI Engineering', 1, 1],
    ['UI Design', 2, 2],
  ])('%s → current %i, longest %i', (name, current, longest) => {
    expect(byName(name)).toMatchObject({ current, longest })
  })

  it('marks Cooking as broken and TypeScript as at risk', () => {
    expect(byName('Cooking').status).toBe('none')
    expect(byName('TypeScript').status).toBe('at-risk')
    expect(byName('Spanish').status).toBe('active')
  })
})

describe('toISODate', () => {
  it('uses local date parts, so 11:55 PM stays on the same day', () => {
    expect(toISODate(new Date(2026, 2, 19, 23, 55))).toBe('2026-03-19')
    expect(toISODate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
  })
})
