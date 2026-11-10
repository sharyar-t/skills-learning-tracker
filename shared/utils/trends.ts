import type { DailyTotal, ISODate } from '../types/domain'
import { daysBetween, shiftDate, weekStart } from './dates'
import type { GoalProgress } from './dashboard'

/** Weeks shown in the weekly trend; the last bar is the current (still unfinished) week. */
export const TREND_WEEKS = 12
/** Months shown in the monthly trend; the last bar is the current month. */
export const TREND_MONTHS = 6
/** How far back "your recent pace" looks when a total goal has no deadline of its own. */
const RECENT_PACE_DAYS = 28

export interface TrendBucket {
  /** First day of the period (a Monday for weeks, the 1st for months) */
  start: ISODate
  /** Short label for the axis: "Mar 16" or "Mar" */
  label: string
  minutes: number
  sessions: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayLabel(date: ISODate): string {
  return `${MONTHS[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`
}

/** Practice per calendar week (Monday → Sunday), oldest first, ending with the week that contains `today`. */
export function weeklyTrend(totals: readonly DailyTotal[], today: ISODate, weeks = TREND_WEEKS): TrendBucket[] {
  const firstWeek = shiftDate(weekStart(today), -7 * (weeks - 1))
  const buckets: TrendBucket[] = Array.from({ length: weeks }, (_, index) => {
    const start = shiftDate(firstWeek, 7 * index)
    return { start, label: dayLabel(start), minutes: 0, sessions: 0 }
  })

  for (const total of totals) {
    if (total.date < firstWeek || total.date > today) continue
    const bucket = buckets[Math.floor(daysBetween(firstWeek, total.date) / 7)]
    if (!bucket) continue
    bucket.minutes += total.minutes
    bucket.sessions += total.sessions
  }
  return buckets
}

/** Practice per calendar month, oldest first, ending with the month that contains `today`. */
export function monthlyTrend(totals: readonly DailyTotal[], today: ISODate, months = TREND_MONTHS): TrendBucket[] {
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7)) - 1 // 0-based

  const buckets: TrendBucket[] = Array.from({ length: months }, (_, index) => {
    const offset = month - (months - 1 - index)
    const bucketYear = year + Math.floor(offset / 12)
    const bucketMonth = ((offset % 12) + 12) % 12
    return {
      start: `${bucketYear}-${String(bucketMonth + 1).padStart(2, '0')}-01`,
      label: MONTHS[bucketMonth]!,
      minutes: 0,
      sessions: 0,
    }
  })

  const byMonth = new Map(buckets.map(bucket => [bucket.start.slice(0, 7), bucket]))
  for (const total of totals) {
    if (total.date > today) continue
    const bucket = byMonth.get(total.date.slice(0, 7))
    if (!bucket) continue
    bucket.minutes += total.minutes
    bucket.sessions += total.sessions
  }
  return buckets
}

/** Mean session length in minutes, rounded; 0 when nothing is logged. */
export function averageSessionMinutes(totalMinutes: number, sessionCount: number): number {
  return sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0
}

export type PaceKind = 'met' | 'on-track' | 'behind' | 'no-data'

export interface GoalPace {
  kind: PaceKind
  /** One plain sentence — the indicator never relies on colour alone */
  message: string
}

/**
 * A pace indicator for a goal.
 *  - Weekly goals: reached, on pace, or behind (the same rule the dashboard nudges use).
 *  - Total goals have no deadline, so pace means "at your last four weeks' rate, you'll get there in about N weeks".
 */
export function goalPace(progress: GoalProgress, totals: readonly DailyTotal[], today: ISODate): GoalPace {
  if (progress.met) {
    return {
      kind: 'met',
      message: progress.type === 'weekly' ? 'Goal reached this week.' : 'Goal reached. Nicely done.',
    }
  }

  if (progress.type === 'weekly') {
    return progress.behindPace
      ? { kind: 'behind', message: 'A little behind an even pace for the week. A longer session catches you up.' }
      : { kind: 'on-track', message: 'On pace for this week.' }
  }

  const from = shiftDate(today, -(RECENT_PACE_DAYS - 1))
  let recentMinutes = 0
  for (const total of totals) {
    if (total.date >= from && total.date <= today) recentMinutes += total.minutes
  }
  if (recentMinutes === 0) {
    return { kind: 'no-data', message: 'Practice this week and a pace estimate will show up here.' }
  }

  const perWeek = recentMinutes / (RECENT_PACE_DAYS / 7)
  const remaining = progress.targetHours * 60 - progress.doneMinutes
  const weeksToGo = Math.max(1, Math.ceil(remaining / perWeek))
  return {
    kind: 'on-track',
    message: `At your pace of the last 4 weeks, about ${weeksToGo === 1 ? '1 more week' : `${weeksToGo} more weeks`} to go.`,
  }
}
