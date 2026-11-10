import type { DailyTotal, ISODate } from '../types/domain'
import { formatDayHeading, shiftDate, weekStart } from './dates'
import { formatDuration, pluralize } from './format'

/** About six months: the current (partial) week plus 26 before it. */
export const HEATMAP_WEEKS = 27

export type HeatLevel = 0 | 1 | 2 | 3

/** Minutes per day → intensity, matching the brand kit: <30 light, 30–60 medium, 60+ heavy. */
export function heatLevel(minutes: number): HeatLevel {
  if (minutes >= 60) return 3
  if (minutes >= 30) return 2
  if (minutes >= 1) return 1
  return 0
}

export interface HeatCell {
  date: ISODate
  isToday: boolean
  isFuture: boolean
}

export interface HeatColumn {
  /** Monday → Sunday */
  cells: HeatCell[]
  /** Set on the first column of each month */
  monthLabel: string | null
}

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

/** Columns are weeks (Monday first), oldest on the left; the last column is the current week. */
export function buildHeatmapColumns(today: ISODate, weeks = HEATMAP_WEEKS): HeatColumn[] {
  const firstMonday = shiftDate(weekStart(today), -7 * (weeks - 1))
  let previousMonth = ''

  return Array.from({ length: weeks }, (_, index) => {
    const monday = shiftDate(firstMonday, index * 7)
    const month = monday.slice(0, 7)
    const monthLabel = month !== previousMonth ? monthFormat.format(new Date(`${monday}T00:00:00Z`)) : null
    previousMonth = month

    const cells = Array.from({ length: 7 }, (_, offset): HeatCell => {
      const date = shiftDate(monday, offset)
      return { date, isToday: date === today, isFuture: date > today }
    })
    return { cells, monthLabel }
  })
}

export interface DayActivity {
  minutes: number
  sessions: number
  /** Time per skill that day, largest first */
  skills: { skillId: string, minutes: number }[]
}

/** Per-day activity, optionally for a single skill. Days with no practice are absent. */
export function aggregateDays(totals: readonly DailyTotal[], skillId: string | null = null): Map<ISODate, DayActivity> {
  const days = new Map<ISODate, DayActivity>()
  for (const total of totals) {
    if (skillId && total.skillId !== skillId) continue
    const day = days.get(total.date) ?? { minutes: 0, sessions: 0, skills: [] }
    day.minutes += total.minutes
    day.sessions += total.sessions
    day.skills.push({ skillId: total.skillId, minutes: total.minutes })
    days.set(total.date, day)
  }
  for (const day of days.values()) day.skills.sort((a, b) => b.minutes - a.minutes)
  return days
}

export interface HeatmapSummary {
  minutes: number
  sessions: number
  activeDays: number
}

/** Totals for the visible window only (first column's Monday → today). */
export function summarizeWindow(days: ReadonlyMap<ISODate, DayActivity>, today: ISODate, weeks = HEATMAP_WEEKS): HeatmapSummary {
  const from = shiftDate(weekStart(today), -7 * (weeks - 1))
  const summary: HeatmapSummary = { minutes: 0, sessions: 0, activeDays: 0 }
  for (const [date, day] of days) {
    if (date < from || date > today) continue
    summary.minutes += day.minutes
    summary.sessions += day.sessions
    summary.activeDays += 1
  }
  return summary
}

/**
 * Text for one day — used as the accessible name of each cell and in the tooltip,
 * so the information never depends on colour.
 */
export function describeDay(
  date: ISODate,
  today: ISODate,
  activity: DayActivity | undefined,
  skillName: (id: string) => string,
): string {
  const label = formatDayHeading(date, today)
  if (!activity) return `${label}: no practice`
  const perSkill = activity.skills.map(s => `${skillName(s.skillId)} ${formatDuration(s.minutes)}`).join(', ')
  return `${label}: ${formatDuration(activity.minutes)} in ${pluralize(activity.sessions, 'session')} — ${perSkill}`
}
