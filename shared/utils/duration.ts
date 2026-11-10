export const MIN_SESSION_MINUTES = 1
/** Matches the database CHECK (duration_minutes between 1 and 1440). */
export const MAX_SESSION_MINUTES = 24 * 60
/** Above this we ask the user to double-check, but still allow it. */
export const LONG_SESSION_MINUTES = 8 * 60

export type DurationResult
  = | { ok: true, minutes: number }
    | { ok: false, error: string }

const EXAMPLES = 'Try 45, 1h 30m or 1.5.'

const UNIT_MINUTES: Record<string, number> = {
  h: 60, hr: 60, hrs: 60, hour: 60, hours: 60,
  m: 1, min: 1, mins: 1, minute: 1, minutes: 1,
}

/** "1h 30m", "90min", "1hour30min" — each unit at most once. Returns null if it isn't that shape. */
function parseUnits(text: string): number | null {
  const token = /\s*(\d+(?:\.\d+)?)\s*([a-z]+)/y
  const seen = new Set<number>()
  let total = 0
  let position = 0

  while (position < text.length) {
    token.lastIndex = position
    const match = token.exec(text)
    if (!match) return null
    const unit = UNIT_MINUTES[match[2]!]
    if (unit === undefined || seen.has(unit)) return null
    seen.add(unit)
    total += Number(match[1]) * unit
    position = token.lastIndex
  }
  return position > 0 ? total : null
}

/**
 * Flexible duration input → whole minutes.
 *
 *   "45"      → 45 min      (a bare whole number is minutes)
 *   "1.5"     → 90 min      (a bare decimal is hours; "1,5" works too)
 *   "1h 30m"  → 90 min      ("1h", "90m", "2 hrs", "45 minutes", "1h30m" …)
 *   "1:30"    → 90 min
 */
export function parseDuration(input: string): DurationResult {
  const text = input.trim().toLowerCase().replace(',', '.')
  if (!text) return { ok: false, error: `Enter how long you practiced. ${EXAMPLES}` }

  let minutes: number | null
  if (/^\d+$/.test(text)) {
    minutes = Number(text)
  }
  else if (/^\d*\.\d+$/.test(text)) {
    minutes = Number(text) * 60
  }
  else {
    const clock = /^(\d{1,2}):([0-5]\d)$/.exec(text)
    minutes = clock ? Number(clock[1]) * 60 + Number(clock[2]) : parseUnits(text)
  }

  if (minutes === null || Number.isNaN(minutes)) {
    return { ok: false, error: `Couldn't read that. ${EXAMPLES}` }
  }

  minutes = Math.round(minutes)
  if (minutes < MIN_SESSION_MINUTES) return { ok: false, error: 'Sessions must be at least 1 minute.' }
  if (minutes > MAX_SESSION_MINUTES) return { ok: false, error: 'A session can be 24 hours at most. For minutes, add an "m" — like 45m.' }
  return { ok: true, minutes }
}

export function isLongSession(minutes: number): boolean {
  return minutes > LONG_SESSION_MINUTES
}
