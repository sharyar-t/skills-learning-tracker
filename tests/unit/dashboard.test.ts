import { describe, expect, it } from 'vitest'
import sample from '../../data/sample-skills.json'
import type { DailyTotal, SkillWithStats } from '../../shared/types/domain'
import { daysBetween, daysSinceMonday, weekStart } from '../../shared/utils/dates'
import {
  featuredSkill,
  type GoalProgress,
  goalProgress,
  overallStreak,
  pickNudge,
} from '../../shared/utils/dashboard'
import { formatHoursFromMinutes } from '../../shared/utils/format'
import { groupTotalsBySkill, deriveStats } from '../../shared/utils/stats'

// --- helpers ---------------------------------------------------------------------------------
const AS_OF = '2026-03-19' // a Thursday — the date the sample data's README describes

function sampleTotals(): DailyTotal[] {
  const byKey = new Map<string, DailyTotal>()
  for (const s of sample.sessions) {
    const key = `${s.skillId}|${s.date}`
    const total = byKey.get(key) ?? { skillId: s.skillId, date: s.date, minutes: 0, sessions: 0 }
    total.minutes += s.durationMinutes
    total.sessions += 1
    byKey.set(key, total)
  }
  return [...byKey.values()]
}

function sampleSkills(today = AS_OF): SkillWithStats[] {
  const grouped = groupTotalsBySkill(sampleTotals())
  return sample.skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    color: skill.color,
    goal: skill.goal as SkillWithStats['goal'],
    createdAt: skill.createdAt,
    ...deriveStats(grouped.get(skill.id) ?? [], today),
  }))
}

function progressFor(skills: SkillWithStats[], today = AS_OF) {
  const grouped = groupTotalsBySkill(sampleTotals())
  return new Map(skills.map(s => [s.id, s.goal ? goalProgress(s.goal, grouped.get(s.id) ?? [], today) : null]))
}

const total = (date: string, minutes: number, skillId = 'x'): DailyTotal => ({ skillId, date, minutes, sessions: 1 })

// --- tests -----------------------------------------------------------------------------------
describe('week helpers', () => {
  it('weeks start on Monday', () => {
    expect(daysSinceMonday('2026-03-16')).toBe(0) // Monday
    expect(daysSinceMonday('2026-03-19')).toBe(3) // Thursday
    expect(daysSinceMonday('2026-03-22')).toBe(6) // Sunday
    expect(weekStart('2026-03-19')).toBe('2026-03-16')
    expect(weekStart('2026-03-22')).toBe('2026-03-16')
    expect(weekStart('2026-03-16')).toBe('2026-03-16')
    expect(weekStart('2026-01-01')).toBe('2025-12-29')
  })

  it('counts days between dates', () => {
    expect(daysBetween('2026-03-17', '2026-03-19')).toBe(2)
    expect(daysBetween('2026-03-19', '2026-03-19')).toBe(0)
    expect(daysBetween('2026-03-19', '2026-03-17')).toBe(-2)
    expect(daysBetween('2025-12-31', '2026-01-02')).toBe(2)
  })

  it('formats hours from minutes with one decimal', () => {
    expect(formatHoursFromMinutes(195)).toBe('3.3')
    expect(formatHoursFromMinutes(300)).toBe('5')
    expect(formatHoursFromMinutes(0)).toBe('0')
  })
})

describe('goalProgress', () => {
  const weekly = { type: 'weekly', targetHours: 5 } as const

  it('counts only the current calendar week for weekly goals', () => {
    const totals = [total('2026-03-15', 120), total('2026-03-16', 60), total('2026-03-19', 30)] // Sun (last week), Mon, Thu
    const p = goalProgress(weekly, totals, '2026-03-19')
    expect(p.doneMinutes).toBe(90)
    expect(p.percent).toBe(30)
    expect(p.fraction).toBeCloseTo(0.3)
    expect(p.met).toBe(false)
  })

  it('counts everything for total goals', () => {
    const p = goalProgress({ type: 'total', targetHours: 100 }, [total('2025-01-01', 3000), total('2026-03-19', 600)], '2026-03-19')
    expect(p).toMatchObject({ doneMinutes: 3600, percent: 60, met: false, behindPace: false })
  })

  it('caps the ring at 100% but reports the real percentage', () => {
    const p = goalProgress(weekly, [total('2026-03-16', 360)], '2026-03-19')
    expect(p).toMatchObject({ fraction: 1, percent: 120, met: true, behindPace: false })
  })

  it('ignores future dates', () => {
    expect(goalProgress(weekly, [total('2026-03-20', 300)], '2026-03-19').doneMinutes).toBe(0)
  })

  it('is behind pace only from Wednesday, and only by more than a day\'s worth', () => {
    const lateTuesday = goalProgress(weekly, [], '2026-03-17') // Tuesday: too early to judge
    expect(lateTuesday.behindPace).toBe(false)

    // Wednesday: pace through yesterday = 2/7 of 300 min ≈ 85.7 min
    expect(goalProgress(weekly, [total('2026-03-16', 60)], '2026-03-18').behindPace).toBe(true)
    expect(goalProgress(weekly, [total('2026-03-16', 90)], '2026-03-18').behindPace).toBe(false)
  })

  it('never reports total goals as behind pace', () => {
    expect(goalProgress({ type: 'total', targetHours: 100 }, [], '2026-03-19').behindPace).toBe(false)
  })
})

describe('overallStreak', () => {
  it('counts a day if any skill was practiced', () => {
    const totals = [total('2026-03-17', 10, 'a'), total('2026-03-18', 10, 'b'), total('2026-03-19', 10, 'a'), total('2026-03-19', 10, 'b')]
    expect(overallStreak(totals, '2026-03-19')).toEqual({ current: 3, longest: 3, status: 'active' })
  })
})

describe('on the sample data (as of 2026-03-19)', () => {
  const skills = sampleSkills()

  it('features Spanish: tied on streak with Guitar, but more time logged', () => {
    expect(featuredSkill(skills)?.name).toBe('Spanish')
  })

  it('computes an overall streak from every skill', () => {
    const streak = overallStreak(sampleTotals(), AS_OF)
    expect(streak.status).toBe('active')
    expect(streak.current).toBeGreaterThanOrEqual(8)
  })

  it('nudges about TypeScript, the only streak at risk', () => {
    expect(pickNudge(skills, progressFor(skills), AS_OF)).toMatchObject({
      kind: 'at-risk',
      title: 'TypeScript: your 3-day streak is at risk',
      cta: 'Log TypeScript',
    })
  })

  it('computes weekly progress from the real sessions', () => {
    const spanish = skills.find(s => s.name === 'Spanish')!
    const expected = sample.sessions
      .filter(s => s.skillId === spanish.id && s.date >= '2026-03-16' && s.date <= AS_OF)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
    expect(progressFor(skills).get(spanish.id)!.doneMinutes).toBe(expected)
    expect(progressFor(skills).get(skills.find(s => s.name === 'TypeScript')!.id)).toBeNull() // no goal → no ring
  })
})

describe('featuredSkill', () => {
  const skill = (over: Partial<SkillWithStats>): SkillWithStats => ({
    id: 'id', name: 'N', color: '#000000', goal: null, createdAt: '2025-01-01T00:00:00Z',
    totalMinutes: 0, sessionCount: 0, lastPracticedOn: null, streak: { current: 0, longest: 0, status: 'none' }, ...over,
  })

  it('is null without skills', () => {
    expect(featuredSkill([])).toBeNull()
  })

  it('prefers the longer streak, then the more recent practice, then more time, then the older skill', () => {
    const long = skill({ id: 'long', streak: { current: 5, longest: 5, status: 'active' }, lastPracticedOn: '2026-03-01' })
    const recent = skill({ id: 'recent', streak: { current: 2, longest: 2, status: 'active' }, lastPracticedOn: '2026-03-19' })
    expect(featuredSkill([recent, long])?.id).toBe('long')

    const a = skill({ id: 'a', lastPracticedOn: '2026-03-10' })
    const b = skill({ id: 'b', lastPracticedOn: '2026-03-18' })
    expect(featuredSkill([a, b])?.id).toBe('b')

    expect(featuredSkill([skill({ id: 'few', totalMinutes: 10 }), skill({ id: 'many', totalMinutes: 99 })])?.id).toBe('many')
    expect(featuredSkill([skill({ id: 'new', createdAt: '2026-02-01T00:00:00Z' }), skill({ id: 'old' })])?.id).toBe('old')
  })

  it('does not depend on input order', () => {
    const skills = sampleSkills()
    expect(featuredSkill([...skills].reverse())?.id).toBe(featuredSkill(skills)?.id)
  })
})

describe('pickNudge', () => {
  const stats = (over: Partial<SkillWithStats>): SkillWithStats => ({
    id: 'a', name: 'Guitar', color: '#000000', goal: null, createdAt: '2025-01-01T00:00:00Z',
    totalMinutes: 300, sessionCount: 10, lastPracticedOn: AS_OF, streak: { current: 4, longest: 4, status: 'active' }, ...over,
  })
  const none = new Map<string, GoalProgress | null>()

  it('has nothing to say without skills', () => {
    expect(pickNudge([], none, AS_OF)).toBeNull()
  })

  it('puts the longest at-risk streak first', () => {
    const skills = [
      stats({ id: 'a', name: 'A', streak: { current: 3, longest: 3, status: 'at-risk' } }),
      stats({ id: 'b', name: 'B', streak: { current: 9, longest: 9, status: 'at-risk' } }),
    ]
    expect(pickNudge(skills, none, AS_OF)).toMatchObject({ kind: 'at-risk', skillId: 'b' })
  })

  it('flags a weekly goal that is behind pace and says how much is left', () => {
    const goal = { type: 'weekly', targetHours: 5 } as const
    const progress = new Map([['a', goalProgress(goal, [total('2026-03-16', 60, 'a')], '2026-03-19')]])
    const nudge = pickNudge([stats({ id: 'a', goal })], progress, '2026-03-19')
    expect(nudge).toMatchObject({ kind: 'behind', skillId: 'a', body: '1 of 5 h so far — 4 h to go.' })
  })

  it('suggests a skill that has gone quiet for 5–30 days, the longest-idle first', () => {
    const skills = [
      stats({ id: 'a', name: 'A', lastPracticedOn: '2026-03-12', streak: { current: 0, longest: 2, status: 'none' } }), // 7 days
      stats({ id: 'b', name: 'B', lastPracticedOn: '2026-03-05', streak: { current: 0, longest: 2, status: 'none' } }), // 14 days
    ]
    expect(pickNudge(skills, none, AS_OF)).toMatchObject({ kind: 'idle', skillId: 'b', title: 'It\'s been 14 days since you practiced B' })
  })

  it('leaves long-abandoned skills alone and skips short breaks', () => {
    const abandoned = stats({ lastPracticedOn: '2025-11-01', streak: { current: 0, longest: 2, status: 'none' } })
    const shortBreak = stats({ id: 'b', lastPracticedOn: '2026-03-16', streak: { current: 0, longest: 2, status: 'none' } })
    expect(pickNudge([abandoned, shortBreak], none, AS_OF)?.kind).toBe('on-track')
  })

  it('invites a first session for a skill with none', () => {
    const fresh = stats({ id: 'n', name: 'Cooking', sessionCount: 0, totalMinutes: 0, lastPracticedOn: null, streak: { current: 0, longest: 0, status: 'none' } })
    expect(pickNudge([fresh], none, AS_OF)).toMatchObject({ kind: 'first', skillId: 'n', cta: 'Log Cooking' })
  })

  it('celebrates when everything is fine, without a button', () => {
    expect(pickNudge([stats({})], none, AS_OF)).toMatchObject({ kind: 'on-track', skillId: null, cta: null })
  })
})

describe('describeLastPractice', () => {
  it('reads naturally', async () => {
    const { describeLastPractice } = await import('../../shared/utils/dashboard')
    expect(describeLastPractice(null, AS_OF)).toBe('Not practiced yet')
    expect(describeLastPractice('2026-03-19', AS_OF)).toBe('Practiced today')
    expect(describeLastPractice('2026-03-18', AS_OF)).toBe('Last practiced yesterday')
    expect(describeLastPractice('2026-03-12', AS_OF)).toBe('Last practiced 7 days ago')
  })
})
