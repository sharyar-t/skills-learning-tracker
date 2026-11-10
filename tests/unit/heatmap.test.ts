import { describe, expect, it } from 'vitest'
import type { DailyTotal } from '../../shared/types/domain'
import {
  aggregateDays,
  buildHeatmapColumns,
  describeDay,
  HEATMAP_WEEKS,
  heatLevel,
  summarizeWindow,
} from '../../shared/utils/heatmap'

const today = '2026-03-19' // Thursday

describe('heatLevel', () => {
  it.each([
    [0, 0], [1, 1], [29, 1], [30, 2], [59, 2], [60, 3], [240, 3],
  ])('%i min → level %i', (minutes, level) => {
    expect(heatLevel(minutes)).toBe(level)
  })
})

describe('buildHeatmapColumns', () => {
  const columns = buildHeatmapColumns(today)
  const cells = columns.flatMap(c => c.cells)

  it('covers about six months in whole weeks, Monday first', () => {
    expect(columns).toHaveLength(HEATMAP_WEEKS)
    expect(cells).toHaveLength(HEATMAP_WEEKS * 7)
    expect(columns[0]!.cells[0]!.date).toBe('2025-09-15') // a Monday, 26 weeks before this week's Monday
    expect(new Set(columns.map(c => c.cells.length))).toEqual(new Set([7]))
  })

  it('has strictly consecutive days', () => {
    for (let i = 1; i < cells.length; i++) {
      expect(new Date(`${cells[i]!.date}T00:00:00Z`).getTime() - new Date(`${cells[i - 1]!.date}T00:00:00Z`).getTime()).toBe(86_400_000)
    }
  })

  it('marks exactly one today and dims the rest of the current week', () => {
    expect(cells.filter(c => c.isToday).map(c => c.date)).toEqual([today])
    expect(cells.filter(c => c.isFuture).map(c => c.date)).toEqual(['2026-03-20', '2026-03-21', '2026-03-22'])
  })

  it('ends on the current week (Mon–Sun)', () => {
    const last = columns.at(-1)!
    expect(last.cells[0]!.date).toBe('2026-03-16')
    expect(last.cells[6]!.date).toBe('2026-03-22')
  })

  it('labels the first column of each month once', () => {
    const labels = columns.map(c => c.monthLabel).filter(Boolean)
    expect(labels).toEqual(['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'])
  })
})

describe('aggregateDays', () => {
  const totals: DailyTotal[] = [
    { skillId: 'spanish', date: '2026-03-19', minutes: 45, sessions: 1 },
    { skillId: 'guitar', date: '2026-03-19', minutes: 30, sessions: 2 },
    { skillId: 'guitar', date: '2026-03-18', minutes: 20, sessions: 1 },
  ]

  it('adds skills together per day, largest first, with the session count', () => {
    const day = aggregateDays(totals).get('2026-03-19')!
    expect(day).toEqual({
      minutes: 75,
      sessions: 3,
      skills: [{ skillId: 'spanish', minutes: 45 }, { skillId: 'guitar', minutes: 30 }],
    })
  })

  it('filters to one skill', () => {
    const days = aggregateDays(totals, 'guitar')
    expect([...days.keys()].sort()).toEqual(['2026-03-18', '2026-03-19'])
    expect(days.get('2026-03-19')).toMatchObject({ minutes: 30, sessions: 2 })
    expect(aggregateDays(totals, 'cooking').size).toBe(0)
  })

  it('leaves out days with no practice', () => {
    expect(aggregateDays(totals).has('2026-03-17')).toBe(false)
  })
})

describe('summarizeWindow', () => {
  it('counts only what the grid shows', () => {
    const days = aggregateDays([
      { skillId: 'a', date: '2026-03-19', minutes: 30, sessions: 1 },
      { skillId: 'a', date: '2026-03-18', minutes: 60, sessions: 2 },
      { skillId: 'a', date: '2025-01-01', minutes: 999, sessions: 9 }, // older than six months
    ])
    expect(summarizeWindow(days, today)).toEqual({ minutes: 90, sessions: 3, activeDays: 2 })
  })
})

describe('describeDay', () => {
  const name = (id: string) => ({ spanish: 'Spanish', guitar: 'Guitar' })[id] ?? id

  it('spells out time, sessions and skills — so colour is never the only signal', () => {
    const activity = aggregateDays([
      { skillId: 'spanish', date: '2026-03-16', minutes: 45, sessions: 1 },
      { skillId: 'guitar', date: '2026-03-16', minutes: 30, sessions: 1 },
    ]).get('2026-03-16')
    expect(describeDay('2026-03-16', today, activity, name)).toBe('Mon, Mar 16: 1h 15m in 2 sessions — Spanish 45m, Guitar 30m')
  })

  it('says so when there was no practice, and uses Today/Yesterday', () => {
    expect(describeDay('2026-03-17', today, undefined, name)).toBe('Tue, Mar 17: no practice')
    expect(describeDay(today, today, undefined, name)).toBe('Today: no practice')
  })

  it('uses the singular for one session', () => {
    const activity = aggregateDays([{ skillId: 'guitar', date: '2026-03-18', minutes: 20, sessions: 1 }]).get('2026-03-18')
    expect(describeDay('2026-03-18', today, activity, name)).toBe('Yesterday: 20m in 1 session — Guitar 20m')
  })
})
