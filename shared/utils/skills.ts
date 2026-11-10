import type { Tables, TablesInsert } from '../types/database.types'
import type { GoalType, Skill, SkillGoal, SkillInput } from '../types/domain'

export const SKILL_NAME_MAX_LENGTH = 60
export const WEEKLY_GOAL_MAX_HOURS = 168
export const TOTAL_GOAL_MAX_HOURS = 10_000

/** Curated palette. Names double as accessible labels for the colour picker. */
export const SKILL_COLORS = [
  { value: '#059669', name: 'Emerald' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#0EA5E9', name: 'Sky' },
  { value: '#3178C6', name: 'Blue' },
  { value: '#8B5CF6', name: 'Violet' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#EF4444', name: 'Red' },
  { value: '#F97316', name: 'Orange' },
  { value: '#EAB308', name: 'Amber' },
  { value: '#64748B', name: 'Slate' },
] as const

export const DEFAULT_SKILL_COLOR = SKILL_COLORS[0].value

export function validateSkillName(value: string): string | null {
  const name = value.trim()
  if (!name) return 'Give your skill a name, like "Spanish" or "Guitar".'
  if (name.length > SKILL_NAME_MAX_LENGTH) {
    return `Keep the name under ${SKILL_NAME_MAX_LENGTH} characters.`
  }
  return null
}

/** Accepts "5", "2.5" and "2,5". Returns NaN when the text isn't a plain number. */
export function parseHours(value: string): number {
  const text = value.trim().replace(',', '.')
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN
}

export function validateGoalHours(value: string, type: GoalType): string | null {
  if (!value.trim()) {
    return type === 'weekly' ? 'Enter how many hours per week.' : 'Enter your total hours target.'
  }
  const hours = parseHours(value)
  if (Number.isNaN(hours)) return 'Enter a number, like 5 or 2.5.'
  if (hours <= 0) return 'The goal must be more than 0 hours.'
  if (type === 'weekly' && hours > WEEKLY_GOAL_MAX_HOURS) return 'A week only has 168 hours.'
  if (hours > TOTAL_GOAL_MAX_HOURS) return `Keep the goal under ${TOTAL_GOAL_MAX_HOURS.toLocaleString('en-US')} hours.`
  return null
}

export function formatGoal(goal: SkillGoal): string {
  const hours = Number(goal.targetHours.toFixed(2))
  return goal.type === 'weekly' ? `${hours} h / week` : `${hours} h total`
}

/** First letter (or digit) of the name, for the coloured avatar. */
export function skillInitial(name: string): string {
  return ([...name.trim()][0] ?? '?').toUpperCase()
}

// --- Database mapping -------------------------------------------------------

export function skillFromRow(row: Tables<'skills'>): Skill {
  const goal: SkillGoal | null
    = row.goal_type && row.goal_target_hours != null
      ? { type: row.goal_type as GoalType, targetHours: Number(row.goal_target_hours) }
      : null

  return { id: row.id, name: row.name, color: row.color, goal, createdAt: row.created_at }
}

/** Columns for insert/update. `goal_*` are always sent so editing can clear a goal. */
export function skillInputToRow(input: SkillInput): Pick<TablesInsert<'skills'>, 'name' | 'color' | 'goal_type' | 'goal_target_hours'> {
  return {
    name: input.name.trim(),
    color: input.color,
    goal_type: input.goal?.type ?? null,
    goal_target_hours: input.goal?.targetHours ?? null,
  }
}
