import type { Tables, TablesInsert } from '../types/database.types'
import type { PracticeSession, SessionInput, SessionSaved } from '../types/domain'
import { formatDayInSentence, isValidISODate } from './dates'
import { formatDuration, pluralize } from './format'

export const NOTES_MAX_LENGTH = 5000

export function validateSessionDate(date: string, today: string): string | null {
  if (!date) return 'Pick the day you practiced.'
  if (!isValidISODate(date)) return 'That date doesn\'t look right.'
  if (date > today) return 'You can\'t log practice for a future date.'
  return null
}

export function validateNotes(notes: string): string | null {
  return notes.length > NOTES_MAX_LENGTH
    ? `Keep notes under ${NOTES_MAX_LENGTH.toLocaleString('en-US')} characters.`
    : null
}

/** Blank notes are stored as null so empty reflections never render. */
export function normalizeNotes(notes: string): string | null {
  const trimmed = notes.trim()
  return trimmed || null
}

/** Newest practice day first; within a day, most recently logged first. */
export function compareSessionsNewestFirst(a: PracticeSession, b: PracticeSession): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  return 0
}

// --- Database mapping -------------------------------------------------------

export function sessionFromRow(row: Tables<'sessions'>): PracticeSession {
  return {
    id: row.id,
    skillId: row.skill_id,
    durationMinutes: row.duration_minutes,
    date: row.practiced_on,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export function sessionInputToRow(input: SessionInput): Pick<TablesInsert<'sessions'>, 'skill_id' | 'duration_minutes' | 'practiced_on' | 'notes'> {
  return {
    skill_id: input.skillId,
    duration_minutes: input.durationMinutes,
    practiced_on: input.date,
    notes: input.notes,
  }
}

// --- Confirmation toast -----------------------------------------------------

export interface SessionToast {
  title: string
  detail?: string
  icon: 'check' | 'flame'
}

/**
 * The "reward moment" after saving: what was logged and what happened to the streak.
 * Wording carries the meaning on its own (the flame icon is decoration).
 */
export function sessionToast(saved: SessionSaved, today: string): SessionToast {
  if (saved.isEdit) return { title: 'Session updated', icon: 'check' }

  const parts: string[] = []
  if (saved.date !== today) parts.push(`For ${formatDayInSentence(saved.date, today)}`)

  const { before, after } = saved
  if (after && after.current > 0) {
    const days = pluralize(after.current, 'day')
    if (!before || before.current === 0) parts.push(`Streak started: ${days}`)
    else if (after.current > before.current) parts.push(`Streak extended to ${days}`)
    else parts.push(`${after.current}-day streak`)
    if (after.status === 'at-risk') parts.push('log today to keep it')
  }

  return {
    title: `${formatDuration(saved.minutes)} of ${saved.skillName} logged`,
    detail: parts.length ? parts.join(' · ') : undefined,
    icon: after && after.current > 0 ? 'flame' : 'check',
  }
}
