import { describe, expect, it } from 'vitest'
import type { DailyTotal } from '../../shared/types/domain'
import { goalProgress } from '../../shared/utils/dashboard'
import { averageSessionMinutes, goalPace, monthlyTrend, weeklyTrend } from '../../shared/utils/trends'

const TODAY = '2026-03-19' // a Thursday
const day = (date: string, minutes: number, sessions = 1): DailyTotal => ({ skillId: 's', date, minutes, sessions })

describe('weeklyTrend', () => {
  it('returns the requested number of weeks, oldest first, ending with the current week', () => {
    const weeks = weeklyTrend([], TODAY, 4)
    expect(weeks.map(week => week.start)).toEqual(['2026-02-23', '2026-03-02', '2026-03-09', '2026-03-16'])
    expect(weeks.every(week => week.minutes === 0 && week.sessions === 0)).toBe(true)
  })

  it('labels weeks by their Monday', () => {
    expect(weeklyTrend([], TODAY, 1)[0]!.label).toBe('Mar 16')
  })

  it('puts Monday and Sunday in the same week', () => {
    const weeks = weeklyTrend([day('2026-03-09', 30), day('2026-03-15', 45, 2)], TODAY, 2)
    expect(weeks[0]).toMatchObject({ start: '2026-03-09', minutes: 75, sessions: 3 })
    expect(weeks[1]).toMatchObject({ start: '2026-03-16', minutes: 0 })
  })

  it('ignores days before the window and in the future', () => {
    const weeks = weeklyTrend([day('2026-01-01', 60), day('2026-03-20', 60)], TODAY, 4)
    expect(weeks.reduce((sum, week) => sum + week.minutes, 0)).toBe(0)
  })
})

describe('monthlyTrend', () => {
  it('ends with the current month and crosses year boundaries', () => {
    const months = monthlyTrend([], '2026-02-10', 4)
    expect(months.map(month => month.start)).toEqual(['2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01'])
    expect(months.map(month => month.label)).toEqual(['Nov', 'Dec', 'Jan', 'Feb'])
  })

  it('sums each month and ignores the future', () => {
    const months = monthlyTrend([day('2026-02-28', 60), day('2026-03-01', 30), day('2026-03-19', 20, 2), day('2026-03-25', 99)], TODAY, 2)
    expect(months[0]).toMatchObject({ start: '2026-02-01', minutes: 60, sessions: 1 })
    expect(months[1]).toMatchObject({ start: '2026-03-01', minutes: 50, sessions: 3 })
  })
})

describe('averageSessionMinutes', () => {
  it('rounds the mean and handles no sessions', () => {
    expect(averageSessionMinutes(100, 3)).toBe(33)
    expect(averageSessionMinutes(0, 0)).toBe(0)
  })
})

describe('goalPace', () => {
  it('reports a met goal', () => {
    const totals = [day('2026-03-16', 300)]
    const progress = goalProgress({ type: 'weekly', targetHours: 5 }, totals, TODAY)
    expect(goalPace(progress, totals, TODAY).kind).toBe('met')
  })

  it('says behind or on pace for weekly goals', () => {
    const behind = goalProgress({ type: 'weekly', targetHours: 7 }, [], TODAY)
    expect(goalPace(behind, [], TODAY).kind).toBe('behind')

    const totals = [day('2026-03-16', 200)]
    const onTrack = goalProgress({ type: 'weekly', targetHours: 7 }, totals, TODAY)
    expect(goalPace(onTrack, totals, TODAY).kind).toBe('on-track')
  })

  it('estimates the weeks left for a total goal from the last four weeks', () => {
    // 4 h in the last 4 weeks → 1 h/week; 10 h target with 4 h done → 6 weeks to go
    const totals = [day('2026-03-02', 240)]
    const progress = goalProgress({ type: 'total', targetHours: 10 }, totals, TODAY)
    const pace = goalPace(progress, totals, TODAY)
    expect(pace.kind).toBe('on-track')
    expect(pace.message).toContain('6 more weeks')
  })

  it('has no estimate for a total goal without recent practice', () => {
    const totals = [day('2025-12-01', 120)]
    const progress = goalProgress({ type: 'total', targetHours: 10 }, totals, TODAY)
    expect(goalPace(progress, totals, TODAY).kind).toBe('no-data')
  })
})
