import { describe, expect, it } from 'vitest'
import type { Tables } from '../../shared/types/database.types'
import { contrastRatio, readableTextColor } from '../../shared/utils/color'
import { describeDataError, DataError, messageOf } from '../../shared/utils/data-errors'
import { formatDuration, formatHours, pluralize } from '../../shared/utils/format'
import {
  formatGoal,
  parseHours,
  SKILL_COLORS,
  skillFromRow,
  skillInitial,
  skillInputToRow,
  validateGoalHours,
  validateSkillName,
} from '../../shared/utils/skills'

describe('validateSkillName', () => {
  it('requires a non-blank name', () => {
    expect(validateSkillName('')).toEqual(expect.any(String))
    expect(validateSkillName('   ')).toEqual(expect.any(String))
    expect(validateSkillName(' Guitar ')).toBeNull()
  })

  it('caps the length at 60 characters', () => {
    expect(validateSkillName('a'.repeat(60))).toBeNull()
    expect(validateSkillName('a'.repeat(61))).toMatch(/60/)
  })
})

describe('goal hours', () => {
  it.each([['5', 5], ['2.5', 2.5], ['2,5', 2.5], [' 10 ', 10]])('parses %j', (text, hours) => {
    expect(parseHours(text)).toBe(hours)
  })

  it.each(['', 'abc', '1h', '-3', '1e3', '2..5'])('does not parse %j', (text) => {
    expect(parseHours(text)).toBeNaN()
  })

  it('validates weekly goals against the 168 hours in a week', () => {
    expect(validateGoalHours('5', 'weekly')).toBeNull()
    expect(validateGoalHours('168', 'weekly')).toBeNull()
    expect(validateGoalHours('169', 'weekly')).toMatch(/168/)
  })

  it('validates total goals', () => {
    expect(validateGoalHours('100', 'total')).toBeNull()
    expect(validateGoalHours('10000', 'total')).toBeNull()
    expect(validateGoalHours('10001', 'total')).toEqual(expect.any(String))
  })

  it('rejects empty, zero and non-numeric input with specific messages', () => {
    expect(validateGoalHours('', 'weekly')).toMatch(/per week/)
    expect(validateGoalHours('', 'total')).toMatch(/total/)
    expect(validateGoalHours('0', 'total')).toMatch(/more than 0/)
    expect(validateGoalHours('abc', 'total')).toMatch(/number/)
  })
})

describe('row mapping', () => {
  const row: Tables<'skills'> = {
    id: 'skill-1',
    user_id: 'user-1',
    name: 'Spanish',
    color: '#059669',
    goal_type: 'weekly',
    goal_target_hours: 5,
    created_at: '2025-11-01T10:00:00Z',
    updated_at: '2025-11-01T10:00:00Z',
  }

  it('maps a row with a goal', () => {
    expect(skillFromRow(row)).toEqual({
      id: 'skill-1',
      name: 'Spanish',
      color: '#059669',
      goal: { type: 'weekly', targetHours: 5 },
      createdAt: '2025-11-01T10:00:00Z',
    })
  })

  it('maps a row without a goal to null', () => {
    expect(skillFromRow({ ...row, goal_type: null, goal_target_hours: null }).goal).toBeNull()
  })

  it('writes both goal columns as null so editing can clear a goal', () => {
    expect(skillInputToRow({ name: '  Guitar ', color: '#8B5CF6', goal: null })).toEqual({
      name: 'Guitar',
      color: '#8B5CF6',
      goal_type: null,
      goal_target_hours: null,
    })
  })

  it('writes a goal', () => {
    expect(skillInputToRow({ name: 'Guitar', color: '#8B5CF6', goal: { type: 'total', targetHours: 100 } }))
      .toMatchObject({ goal_type: 'total', goal_target_hours: 100 })
  })
})

describe('display helpers', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(565)).toBe('9h 25m')
  })

  it('formats goals and hours without trailing zeros', () => {
    expect(formatGoal({ type: 'weekly', targetHours: 5 })).toBe('5 h / week')
    expect(formatGoal({ type: 'total', targetHours: 2.5 })).toBe('2.5 h total')
    expect(formatHours(1.25)).toBe('1.25')
    expect(formatHours(5)).toBe('5')
  })

  it('pluralizes', () => {
    expect(pluralize(1, 'session')).toBe('1 session')
    expect(pluralize(0, 'session')).toBe('0 sessions')
    expect(pluralize(14, 'session')).toBe('14 sessions')
  })

  it('takes the avatar initial from the name', () => {
    expect(skillInitial('spanish')).toBe('S')
    expect(skillInitial('  ui design')).toBe('U')
    expect(skillInitial('')).toBe('?')
  })
})

describe('readableTextColor', () => {
  it('picks dark text on light colours and white on dark ones', () => {
    expect(readableTextColor('#FFFFFF')).toBe('#1A1D1A')
    expect(readableTextColor('#EAB308')).toBe('#1A1D1A')
    expect(readableTextColor('#000000')).toBe('#FFFFFF')
    expect(readableTextColor('#3178C6')).toBe('#FFFFFF')
  })

  it('gives every palette colour AA (4.5:1) text for its initial and check mark', () => {
    for (const { value, name } of SKILL_COLORS) {
      expect(contrastRatio(value, readableTextColor(value)), name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('prefers white, then the brand near-black, and only then pure black', () => {
    expect(readableTextColor('#3178C6')).toBe('#FFFFFF') // white reads
    expect(readableTextColor('#EAB308')).toBe('#1A1D1A') // near-black reads
    expect(readableTextColor('#8B5CF6')).toBe('#000000') // white is 4.23:1, near-black falls short: black is the first that passes
  })

  it('computes the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
  })
})

describe('describeDataError', () => {
  it('reports network failures as a connection problem', () => {
    expect(describeDataError({ code: '', message: 'TypeError: Failed to fetch' }, 'save your skill'))
      .toBe('Couldn\'t save your skill. Check your connection and try again.')
  })

  it('reports an expired session', () => {
    expect(describeDataError({ code: 'PGRST301' }, 'load your skills')).toMatch(/Sign in again/)
  })

  it('reports a row deleted elsewhere', () => {
    expect(describeDataError({ code: 'PGRST116' }, 'save your changes')).toMatch(/no longer exists/)
  })

  it('never leaks raw database messages', () => {
    const message = describeDataError({ code: '23514', message: 'new row violates check constraint "skills_name_check"' }, 'save your skill')
    expect(message).toBe('Couldn\'t save your skill. Please try again.')
  })

  it('messageOf passes our errors through and generalises everything else', () => {
    expect(messageOf(new DataError('Specific message.'))).toBe('Specific message.')
    expect(messageOf(new Error('boom: stack trace'))).not.toMatch(/boom/)
  })
})
