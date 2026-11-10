// App-level domain model. Both the Supabase repository and the guest (in-memory)
// repository map their data to these shapes, so UI code never cares where data lives.

/** Local calendar date in `YYYY-MM-DD` format (no timezone). */
export type ISODate = string

export type GoalType = 'weekly' | 'total'

export interface SkillGoal {
  type: GoalType
  targetHours: number
}

export interface Skill {
  id: string
  name: string
  color: string
  goal: SkillGoal | null
  createdAt: string
}

export interface PracticeSession {
  id: string
  skillId: string
  durationMinutes: number
  date: ISODate
  notes: string | null
  createdAt: string
}

export type StreakStatus = 'active' | 'at-risk' | 'none'

export interface StreakInfo {
  /** Consecutive practice days ending today (active) or yesterday (at risk); 0 when broken. */
  current: number
  longest: number
  status: StreakStatus
}

/** Form payload for creating or editing a skill. */
export interface SkillInput {
  name: string
  color: string
  goal: SkillGoal | null
}

export interface SkillStats {
  totalMinutes: number
  sessionCount: number
  lastPracticedOn: ISODate | null
  streak: StreakInfo
}

export type SkillWithStats = Skill & SkillStats

/** Practice aggregated per skill per day — the basis for totals, streaks and (later) the heatmap. */
export interface DailyTotal {
  skillId: string
  date: ISODate
  minutes: number
  sessions: number
}

/** What the log form reports after a successful save — used to build the confirmation toast. */
export interface SessionSaved {
  isEdit: boolean
  skillName: string
  minutes: number
  date: ISODate
  /** The skill's streak before and after this save (null if the skill vanished) */
  before: StreakInfo | null
  after: StreakInfo | null
}

/** Form payload for logging or editing a session. */
export interface SessionInput {
  skillId: string
  durationMinutes: number
  date: ISODate
  notes: string | null
}

export type ThemePreference = 'system' | 'light' | 'dark'

/** Shape of data/sample-skills.json (used to seed guest mode). */
export interface SampleData {
  skills: Skill[]
  sessions: PracticeSession[]
}
