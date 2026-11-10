import type { ISODate, StreakInfo } from '../types/domain'

const MS_PER_DAY = 86_400_000

/** Days since epoch for a `YYYY-MM-DD` date. Uses UTC math, so DST never skews "next day" checks. */
function dayNumber(date: ISODate): number {
  const [year, month, day] = date.split('-').map(Number)
  return Math.round(Date.UTC(year!, month! - 1, day!) / MS_PER_DAY)
}

/**
 * Streak from the set of days with at least one session.
 *
 * - Several sessions on one day count once.
 * - A streak is "active" if the user practiced today, and "at risk" if the last practice was
 *   yesterday (the day isn't over yet — it only breaks once a full day passes with no session).
 * - Anything older, and the current streak is 0 (`none`).
 * - Dates after `today` are ignored.
 *
 * @param dates practice dates (duplicates allowed)
 * @param today the user's local date
 */
export function computeStreak(dates: Iterable<ISODate>, today: ISODate): StreakInfo {
  const todayNumber = dayNumber(today)
  const days = [...new Set([...dates].map(dayNumber))]
    .filter(day => day <= todayNumber)
    .sort((a, b) => a - b)

  if (days.length === 0) return { current: 0, longest: 0, status: 'none' }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1]! + 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const last = days[days.length - 1]!
  if (last < todayNumber - 1) return { current: 0, longest, status: 'none' }

  let current = 1
  for (let i = days.length - 1; i > 0 && days[i] === days[i - 1]! + 1; i--) current++

  return { current, longest, status: last === todayNumber ? 'active' : 'at-risk' }
}
