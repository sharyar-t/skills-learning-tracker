import type { DailyTotal, GoalType, ISODate, SkillGoal, SkillWithStats, StreakInfo } from '../types/domain'
import { daysBetween, daysSinceMonday, weekStart } from './dates'
import { formatHoursFromMinutes } from './format'
import { computeStreak } from './streaks'

// --- Goal progress ----------------------------------------------------------

export interface GoalProgress {
  type: GoalType
  targetHours: number
  doneMinutes: number
  /** 0–1, capped — what the ring fills to */
  fraction: number
  /** Rounded and uncapped, so exceeding the goal reads as 120% */
  percent: number
  met: boolean
  /** Weekly goals only: more than a day's worth short of an even pace (from Wednesday on) */
  behindPace: boolean
}

/**
 * Progress toward a goal from the skill's per-day totals.
 * Weekly goals count the current calendar week (Monday → today); total goals count everything.
 */
export function goalProgress(goal: SkillGoal, skillTotals: readonly DailyTotal[], today: ISODate): GoalProgress {
  const from = goal.type === 'weekly' ? weekStart(today) : null
  let doneMinutes = 0
  for (const total of skillTotals) {
    if (total.date > today) continue
    if (from && total.date < from) continue
    doneMinutes += total.minutes
  }

  const targetMinutes = goal.targetHours * 60
  const ratio = targetMinutes > 0 ? doneMinutes / targetMinutes : 0
  const met = ratio >= 1

  // Day 1 = Monday. Expected pace "through yesterday" is (day - 1) / 7 of the target.
  const elapsedDays = daysSinceMonday(today) + 1
  const behindPace = goal.type === 'weekly' && !met && elapsedDays >= 3
    && doneMinutes < (targetMinutes * (elapsedDays - 1)) / 7

  return {
    type: goal.type,
    targetHours: goal.targetHours,
    doneMinutes,
    fraction: Math.min(ratio, 1),
    percent: Math.round(ratio * 100),
    met,
    behindPace,
  }
}

export function overallStreak(totals: readonly DailyTotal[], today: ISODate): StreakInfo {
  return computeStreak(totals.map(total => total.date), today)
}

// --- Featured skill ---------------------------------------------------------

/**
 * The skill that earns the hero card: longest current streak, then most recently practiced,
 * then most time logged, then oldest. Deterministic, so the dashboard doesn't reshuffle on reload.
 */
export function featuredSkill(skills: readonly SkillWithStats[]): SkillWithStats | null {
  const rank = (a: SkillWithStats, b: SkillWithStats): number =>
    b.streak.current - a.streak.current
    || (b.lastPracticedOn ?? '').localeCompare(a.lastPracticedOn ?? '')
    || b.totalMinutes - a.totalMinutes
    || a.createdAt.localeCompare(b.createdAt)
  return [...skills].sort(rank)[0] ?? null
}

// --- "What to practice next" ------------------------------------------------

export type NudgeKind = 'at-risk' | 'behind' | 'idle' | 'first' | 'on-track'

export interface Nudge {
  kind: NudgeKind
  skillId: string | null
  title: string
  body: string
  /** Button label; null when there's nothing to do */
  cta: string | null
}

/** A skill idle for this long (but not forgotten for more than a month) gets a gentle prod. */
export const IDLE_NUDGE_MIN_DAYS = 5
export const IDLE_NUDGE_MAX_DAYS = 30

/**
 * One suggestion, most urgent first:
 * 1. a streak that will break if nothing is logged today
 * 2. a weekly goal that has fallen behind pace
 * 3. a skill that has gone quiet for 5+ days
 * 4. a skill that's never been practiced
 * 5. otherwise — everything is on track
 */
export function pickNudge(
  skills: readonly SkillWithStats[],
  progress: ReadonlyMap<string, GoalProgress | null>,
  today: ISODate,
): Nudge | null {
  if (skills.length === 0) return null

  const atRisk = skills
    .filter(skill => skill.streak.status === 'at-risk')
    .sort((a, b) => b.streak.current - a.streak.current)[0]
  if (atRisk) {
    return {
      kind: 'at-risk',
      skillId: atRisk.id,
      title: `${atRisk.name}: your ${atRisk.streak.current}-day streak is at risk`,
      body: 'Practice today to keep it going — even a short session counts.',
      cta: `Log ${atRisk.name}`,
    }
  }

  const behind = skills
    .filter(skill => progress.get(skill.id)?.behindPace)
    .sort((a, b) => (progress.get(a.id)!.fraction) - (progress.get(b.id)!.fraction))[0]
  if (behind) {
    const goal = progress.get(behind.id)!
    const left = Math.max(0, goal.targetHours * 60 - goal.doneMinutes)
    return {
      kind: 'behind',
      skillId: behind.id,
      title: `${behind.name} is behind this week's goal`,
      body: `${formatHoursFromMinutes(goal.doneMinutes)} of ${goal.targetHours} h so far — ${formatHoursFromMinutes(left)} h to go.`,
      cta: `Log ${behind.name}`,
    }
  }

  const idle = skills
    .map(skill => ({ skill, days: skill.lastPracticedOn ? daysBetween(skill.lastPracticedOn, today) : -1 }))
    .filter(({ days }) => days >= IDLE_NUDGE_MIN_DAYS && days <= IDLE_NUDGE_MAX_DAYS)
    .sort((a, b) => b.days - a.days)[0]
  if (idle) {
    return {
      kind: 'idle',
      skillId: idle.skill.id,
      title: `It's been ${idle.days} days since you practiced ${idle.skill.name}`,
      body: 'A short session gets you back on track.',
      cta: `Log ${idle.skill.name}`,
    }
  }

  const fresh = skills.find(skill => skill.sessionCount === 0)
  if (fresh) {
    return {
      kind: 'first',
      skillId: fresh.id,
      title: `Ready for your first ${fresh.name} session?`,
      body: 'Logging takes about 15 seconds.',
      cta: `Log ${fresh.name}`,
    }
  }

  return {
    kind: 'on-track',
    skillId: null,
    title: 'You\'re on track',
    body: 'Every streak is safe and your goals are on pace. Nice work.',
    cta: null,
  }
}

/** "Practiced today", "Last practiced yesterday", "Last practiced 5 days ago", "Not practiced yet". */
export function describeLastPractice(lastPracticedOn: ISODate | null, today: ISODate): string {
  if (!lastPracticedOn) return 'Not practiced yet'
  const days = daysBetween(lastPracticedOn, today)
  if (days <= 0) return 'Practiced today'
  if (days === 1) return 'Last practiced yesterday'
  return `Last practiced ${days} days ago`
}
