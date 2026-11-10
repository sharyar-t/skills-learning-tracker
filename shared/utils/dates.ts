/**
 * The user's LOCAL calendar date as `YYYY-MM-DD`.
 * Practice dates are local dates (no timezone), so a session at 11:55 PM counts for that day.
 * Never use `toISOString().slice(0, 10)` for this — it converts to UTC and can shift the day.
 */
export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const pad = (value: number) => String(value).padStart(2, '0')

function parts(value: string): [number, number, number] {
  const [year, month, day] = value.split('-').map(Number)
  return [year!, month!, day!]
}

/** True for a real calendar date in `YYYY-MM-DD` form (rejects 2026-02-30, 2026-13-01, "tomorrow"). */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = parts(value)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Calendar-day arithmetic that ignores timezones and DST: `shiftDate('2026-03-01', -1)` → `'2026-02-28'`. */
export function shiftDate(value: string, days: number): string {
  const [year, month, day] = parts(value)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** "Today", "Yesterday", otherwise "Mon, Mar 16" (with the year when it isn't the current one). */
export function formatDayHeading(date: string, today: string): string {
  if (date === today) return 'Today'
  if (date === shiftDate(today, -1)) return 'Yesterday'
  const [year, month, day] = parts(date)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(date.slice(0, 4) !== today.slice(0, 4) && { year: 'numeric' as const }),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

/** Day for use inside a sentence: "today", "yesterday", or "Mon, Mar 16". */
export function formatDayInSentence(date: string, today: string): string {
  const label = formatDayHeading(date, today)
  return label === 'Today' || label === 'Yesterday' ? label.toLowerCase() : label
}

const MS_PER_DAY = 86_400_000

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = parts(from)
  const [ty, tm, td] = parts(to)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / MS_PER_DAY)
}

/** Days since Monday: Monday → 0 … Sunday → 6. Weeks start on Monday throughout the app. */
export function daysSinceMonday(date: string): number {
  const [year, month, day] = parts(date)
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7
}

/** The Monday on or before `date`. */
export function weekStart(date: string): string {
  return shiftDate(date, -daysSinceMonday(date))
}
