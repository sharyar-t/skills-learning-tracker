import type { DailyTotal, ISODate, SkillStats } from '../types/domain'
import { computeStreak } from './streaks'

export function groupTotalsBySkill(totals: readonly DailyTotal[]): Map<string, DailyTotal[]> {
  const grouped = new Map<string, DailyTotal[]>()
  for (const total of totals) {
    const list = grouped.get(total.skillId)
    if (list) list.push(total)
    else grouped.set(total.skillId, [total])
  }
  return grouped
}

/** Totals, last practice day and streaks for one skill, from its per-day aggregates. */
export function deriveStats(totals: readonly DailyTotal[], today: ISODate): SkillStats {
  let totalMinutes = 0
  let sessionCount = 0
  let lastPracticedOn: ISODate | null = null

  for (const total of totals) {
    totalMinutes += total.minutes
    sessionCount += total.sessions
    if (lastPracticedOn === null || total.date > lastPracticedOn) lastPracticedOn = total.date
  }

  return {
    totalMinutes,
    sessionCount,
    lastPracticedOn,
    streak: computeStreak(totals.map(total => total.date), today),
  }
}

/**
 * Returns new totals after adding/removing practice on one day of one skill.
 * A day whose session count drops to zero disappears (so it no longer counts toward streaks).
 * Pass negative deltas to undo a session.
 */
export function applyTotalsDelta(
  totals: readonly DailyTotal[],
  skillId: string,
  date: ISODate,
  minutesDelta: number,
  sessionsDelta: number,
): DailyTotal[] {
  const next = [...totals]
  const index = next.findIndex(total => total.skillId === skillId && total.date === date)

  if (index === -1) {
    if (sessionsDelta > 0) next.push({ skillId, date, minutes: minutesDelta, sessions: sessionsDelta })
    return next
  }

  const current = next[index]!
  const sessions = current.sessions + sessionsDelta
  if (sessions <= 0) next.splice(index, 1)
  else next[index] = { ...current, minutes: Math.max(0, current.minutes + minutesDelta), sessions }
  return next
}

/** Collapse raw sessions into one total per skill per day. */
export function totalsFromSessions(
  sessions: readonly { skillId: string, date: ISODate, durationMinutes: number }[],
): DailyTotal[] {
  const byKey = new Map<string, DailyTotal>()
  for (const session of sessions) {
    const key = `${session.skillId}|${session.date}`
    const total = byKey.get(key) ?? { skillId: session.skillId, date: session.date, minutes: 0, sessions: 0 }
    total.minutes += session.durationMinutes
    total.sessions += 1
    byKey.set(key, total)
  }
  return [...byKey.values()]
}
