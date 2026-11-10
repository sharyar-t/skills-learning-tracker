import type { DailyTotal, ISODate, PracticeSession, SampleData, Skill } from '../types/domain'
import { daysBetween, shiftDate } from './dates'
import { compareSessionsNewestFirst } from './sessions'
import { totalsFromSessions } from './stats'

export interface DemoData {
  skills: Skill[]
  /** Newest first */
  sessions: PracticeSession[]
  totals: DailyTotal[]
}

/**
 * Sample data, moved in time so its most recent practice day is `today`.
 * Every gap, streak and cluster is preserved — the demo's "8-day streak" is alive whenever it's viewed.
 * Used for the landing page showcase and (later) the guest experience.
 */
export function buildDemoData(sample: SampleData, today: ISODate): DemoData {
  const latest = sample.sessions.reduce((max, session) => (session.date > max ? session.date : max), '')
  const offset = latest ? daysBetween(latest, today) : 0

  const sessions = sample.sessions
    .map(session => ({ ...session, date: shiftDate(session.date, offset) }))
    .sort(compareSessionsNewestFirst)

  return { skills: sample.skills, sessions, totals: totalsFromSessions(sessions) }
}
