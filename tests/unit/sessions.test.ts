import { describe, expect, it } from 'vitest'
import type { DailyTotal, PracticeSession } from '../../shared/types/domain'
import type { Tables } from '../../shared/types/database.types'
import { formatDayHeading, isValidISODate, shiftDate } from '../../shared/utils/dates'
import { isLongSession, parseDuration } from '../../shared/utils/duration'
import {
  compareSessionsNewestFirst,
  normalizeNotes,
  sessionToast,
  sessionFromRow,
  sessionInputToRow,
  validateNotes,
  validateSessionDate,
} from '../../shared/utils/sessions'
import { applyTotalsDelta, deriveStats, groupTotalsBySkill } from '../../shared/utils/stats'

const minutesOf = (input: string) => {
  const result = parseDuration(input)
  return result.ok ? result.minutes : result.error
}

describe('parseDuration', () => {
  it.each([
    ['45', 45],
    ['1', 1],
    ['  30  ', 30],
    ['1440', 1440],
  ])('reads a bare whole number as minutes: %j → %i', (input, minutes) => {
    expect(minutesOf(input)).toBe(minutes)
  })

  it.each([
    ['1.5', 90],
    ['0.5', 30],
    ['.25', 15],
    ['2,5', 150],
    ['1.25', 75],
  ])('reads a bare decimal as hours: %j → %i', (input, minutes) => {
    expect(minutesOf(input)).toBe(minutes)
  })

  it.each([
    ['1h 30m', 90],
    ['1h30m', 90],
    ['1H 30M', 90],
    ['2h', 120],
    ['90m', 90],
    ['45 min', 45],
    ['45 minutes', 45],
    ['1 hr 15 mins', 75],
    ['2 hours', 120],
    ['1hour30min', 90],
    ['1.5h', 90],
    ['30m 1h', 90],
    ['0.5h', 30],
  ])('reads unit forms: %j → %i', (input, minutes) => {
    expect(minutesOf(input)).toBe(minutes)
  })

  it.each([
    ['1:30', 90],
    ['0:45', 45],
    ['12:05', 725],
  ])('reads h:mm: %j → %i', (input, minutes) => {
    expect(minutesOf(input)).toBe(minutes)
  })

  it('rounds to whole minutes', () => {
    expect(minutesOf('1.51')).toBe(91)
    expect(minutesOf('0.01')).toBe(1)
  })

  it.each([
    ['', /how long/],
    ['   ', /how long/],
    ['abc', /Couldn't read/],
    ['h', /Couldn't read/],
    ['1h 1h', /Couldn't read/],
    ['5x', /Couldn't read/],
    ['1h 30', /Couldn't read/],
    ['1:75', /Couldn't read/],
    ['-5', /Couldn't read/],
    ['0', /at least 1 minute/],
    ['0m', /at least 1 minute/],
    ['0.001', /at least 1 minute/],
    ['1441', /24 hours/],
    ['25h', /24 hours/],
    ['45.5', /24 hours/],
  ])('rejects %j', (input, message) => {
    expect(minutesOf(input)).toMatch(message)
  })

  it('suggests the "m" suffix when a decimal is read as too many hours', () => {
    expect(minutesOf('45.5')).toMatch(/45m/)
  })

  it('accepts the 24 hour maximum exactly', () => {
    expect(minutesOf('24h')).toBe(1440)
  })

  it('flags (but allows) sessions over 8 hours', () => {
    expect(isLongSession(480)).toBe(false)
    expect(isLongSession(481)).toBe(true)
    expect(parseDuration('9h').ok).toBe(true)
  })
})

describe('session validation', () => {
  const today = '2026-03-19'

  it('accepts today and past dates', () => {
    expect(validateSessionDate('2026-03-19', today)).toBeNull()
    expect(validateSessionDate('2025-01-01', today)).toBeNull()
  })

  it('rejects empty, malformed, impossible and future dates', () => {
    expect(validateSessionDate('', today)).toMatch(/Pick/)
    expect(validateSessionDate('19/03/2026', today)).toMatch(/doesn't look right/)
    expect(validateSessionDate('2026-02-30', today)).toMatch(/doesn't look right/)
    expect(validateSessionDate('2026-03-20', today)).toMatch(/future/)
  })

  it('limits notes to 5000 characters and treats blank notes as null', () => {
    expect(validateNotes('a'.repeat(5000))).toBeNull()
    expect(validateNotes('a'.repeat(5001))).toMatch(/5,000/)
    expect(normalizeNotes('  \n ')).toBeNull()
    expect(normalizeNotes('  Worked on irregular verbs\nand ser/estar ')).toBe('Worked on irregular verbs\nand ser/estar')
  })
})

describe('session mapping and ordering', () => {
  const row: Tables<'sessions'> = {
    id: 's-1',
    user_id: 'u-1',
    skill_id: 'skill-1',
    duration_minutes: 45,
    practiced_on: '2026-03-19',
    notes: null,
    created_at: '2026-03-19T18:30:00Z',
    updated_at: '2026-03-19T18:30:00Z',
  }

  it('maps rows to the domain model', () => {
    expect(sessionFromRow(row)).toEqual({
      id: 's-1',
      skillId: 'skill-1',
      durationMinutes: 45,
      date: '2026-03-19',
      notes: null,
      createdAt: '2026-03-19T18:30:00Z',
    })
  })

  it('maps input to insert columns', () => {
    expect(sessionInputToRow({ skillId: 'skill-1', durationMinutes: 30, date: '2026-03-18', notes: 'Scales' })).toEqual({
      skill_id: 'skill-1',
      duration_minutes: 30,
      practiced_on: '2026-03-18',
      notes: 'Scales',
    })
  })

  it('sorts by practice day, then by when it was logged — newest first', () => {
    const make = (id: string, date: string, createdAt: string): PracticeSession => ({ id, skillId: 'x', durationMinutes: 10, date, notes: null, createdAt })
    const sorted = [
      make('old', '2026-03-10', '2026-03-10T08:00:00Z'),
      make('backfilled', '2026-03-18', '2026-03-19T20:00:00Z'),
      make('today-late', '2026-03-19', '2026-03-19T21:00:00Z'),
      make('today-early', '2026-03-19', '2026-03-19T08:00:00Z'),
    ].sort(compareSessionsNewestFirst).map(s => s.id)
    expect(sorted).toEqual(['today-late', 'today-early', 'backfilled', 'old'])
  })
})

describe('date helpers', () => {
  it('validates calendar dates', () => {
    expect(isValidISODate('2026-03-19')).toBe(true)
    expect(isValidISODate('2024-02-29')).toBe(true)
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-3-9')).toBe(false)
    expect(isValidISODate('')).toBe(false)
  })

  it('shifts days across month, year and leap-day boundaries', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29')
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09')
  })

  it('labels days for the session list', () => {
    const today = '2026-03-19'
    expect(formatDayHeading('2026-03-19', today)).toBe('Today')
    expect(formatDayHeading('2026-03-18', today)).toBe('Yesterday')
    expect(formatDayHeading('2026-03-16', today)).toBe('Mon, Mar 16')
    expect(formatDayHeading('2025-12-31', today)).toBe('Wed, Dec 31, 2025')
  })
})

describe('daily totals', () => {
  const today = '2026-03-19'
  const totals: DailyTotal[] = [
    { skillId: 'guitar', date: '2026-03-17', minutes: 30, sessions: 1 },
    { skillId: 'guitar', date: '2026-03-18', minutes: 45, sessions: 2 },
    { skillId: 'spanish', date: '2026-03-19', minutes: 20, sessions: 1 },
  ]

  it('groups by skill', () => {
    const grouped = groupTotalsBySkill(totals)
    expect(grouped.get('guitar')).toHaveLength(2)
    expect(grouped.get('spanish')).toHaveLength(1)
  })

  it('derives totals and streak', () => {
    expect(deriveStats(totals.slice(0, 2), today)).toEqual({
      totalMinutes: 75,
      sessionCount: 3,
      lastPracticedOn: '2026-03-18',
      streak: { current: 2, longest: 2, status: 'at-risk' },
    })
  })

  it('has empty stats for a skill with no practice', () => {
    expect(deriveStats([], today)).toEqual({
      totalMinutes: 0,
      sessionCount: 0,
      lastPracticedOn: null,
      streak: { current: 0, longest: 0, status: 'none' },
    })
  })

  it('logging today extends the streak and updates totals instantly', () => {
    const guitar = totals.slice(0, 2)
    const after = applyTotalsDelta(guitar, 'guitar', today, 25, 1)
    expect(deriveStats(after, today)).toMatchObject({ totalMinutes: 100, sessionCount: 4, streak: { current: 3, status: 'active' } })
  })

  it('adds to an existing day instead of duplicating it', () => {
    const after = applyTotalsDelta(totals, 'guitar', '2026-03-18', 15, 1)
    expect(after.filter(t => t.skillId === 'guitar' && t.date === '2026-03-18')).toEqual([
      { skillId: 'guitar', date: '2026-03-18', minutes: 60, sessions: 3 },
    ])
  })

  it('removes a day when its last session is deleted, breaking the streak', () => {
    const after = applyTotalsDelta(totals.slice(0, 2), 'guitar', '2026-03-18', -45, -2)
    expect(after).toEqual([{ skillId: 'guitar', date: '2026-03-17', minutes: 30, sessions: 1 }])
    expect(deriveStats(after, today).streak.current).toBe(0)
  })

  it('keeps a day when only one of several sessions is deleted', () => {
    const after = applyTotalsDelta(totals, 'guitar', '2026-03-18', -15, -1)
    expect(after.find(t => t.date === '2026-03-18' && t.skillId === 'guitar')).toEqual({ skillId: 'guitar', date: '2026-03-18', minutes: 30, sessions: 1 })
  })

  it('does not mutate its input', () => {
    const copy = structuredClone(totals)
    applyTotalsDelta(totals, 'guitar', today, 10, 1)
    expect(totals).toEqual(copy)
  })

  it('ignores a removal for a day that has no totals', () => {
    expect(applyTotalsDelta(totals, 'guitar', '2026-01-01', -10, -1)).toEqual(totals)
  })
})

describe('sessionToast', () => {
  const today = '2026-03-19'
  const streak = (current: number, status: 'active' | 'at-risk' | 'none') => ({ current, longest: current, status })
  const base = { isEdit: false, skillName: 'Guitar', minutes: 30, date: today }

  it('celebrates an extended streak', () => {
    expect(sessionToast({ ...base, before: streak(8, 'at-risk'), after: streak(9, 'active') }, today)).toEqual({
      title: '30m of Guitar logged',
      detail: 'Streak extended to 9 days',
      icon: 'flame',
    })
  })

  it('announces a new streak', () => {
    expect(sessionToast({ ...base, before: streak(0, 'none'), after: streak(1, 'active') }, today).detail).toBe('Streak started: 1 day')
  })

  it('does not claim an extension when a second session lands on the same day', () => {
    expect(sessionToast({ ...base, before: streak(9, 'active'), after: streak(9, 'active') }, today).detail).toBe('9-day streak')
  })

  it('says so when a backfilled day leaves the streak at risk', () => {
    const toast = sessionToast({ ...base, date: '2026-03-18', before: streak(0, 'none'), after: streak(1, 'at-risk') }, today)
    expect(toast.detail).toBe('For yesterday · Streak started: 1 day · log today to keep it')
  })

  it('names older backfilled days and shows no streak when there is none', () => {
    const toast = sessionToast({ ...base, date: '2026-03-10', before: streak(0, 'none'), after: streak(0, 'none') }, today)
    expect(toast).toEqual({ title: '30m of Guitar logged', detail: 'For Tue, Mar 10', icon: 'check' })
  })

  it('keeps edits simple', () => {
    expect(sessionToast({ ...base, isEdit: true, before: null, after: null }, today)).toEqual({ title: 'Session updated', icon: 'check' })
  })
})
