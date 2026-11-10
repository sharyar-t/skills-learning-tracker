// In-memory repositories for guest mode. They mirror what the database does for signed-in users
// (newest-first keyset pages, cascade on skill delete, "no longer exists" errors), so the stores and
// every screen behave identically in both modes. Self-contained on purpose: explicit imports only,
// no Nuxt auto-imports, so it can be unit-tested in plain Node.
import type { DailyTotal, PracticeSession, SampleData, SessionInput, Skill, SkillInput } from '#shared/types/domain'
import { buildDemoData } from '#shared/utils/demo-data'
import { DataError } from '#shared/utils/data-errors'
import { compareSessionsNewestFirst } from '#shared/utils/sessions'
import { totalsFromSessions } from '#shared/utils/stats'
import type { SessionsPage, SessionsRepository, SessionCursor } from './sessions-repository'
import type { SkillsRepository } from './skills-repository'

export interface GuestDb {
  skills: Skill[]
  sessions: PracticeSession[]
  nextId: number
}

/** The sample data, moved so its latest practice day is `today` (every streak is alive). */
export function createGuestDb(sample: SampleData, today: string): GuestDb {
  const demo = buildDemoData(sample, today)
  return {
    skills: demo.skills.map(skill => ({ ...skill })),
    sessions: demo.sessions.map(session => ({ ...session })),
    nextId: 1,
  }
}

const MISSING_ITEM = 'That item no longer exists. Reload the page and try again.'
const MISSING_SKILL = 'That skill no longer exists. Reload the page and try again.'

export function createGuestSkillsRepository(getDb: () => Promise<GuestDb>): SkillsRepository {
  return {
    async list() {
      const db = await getDb()
      const totals: DailyTotal[] = totalsFromSessions(db.sessions)
      const skills = [...db.skills].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(skill => ({ ...skill }))
      return { skills, totals }
    },

    async create(input: SkillInput) {
      const db = await getDb()
      const skill: Skill = {
        id: `guest-skill-${db.nextId++}`,
        name: input.name.trim(),
        color: input.color,
        goal: input.goal ? { ...input.goal } : null,
        createdAt: new Date().toISOString(),
      }
      db.skills.push(skill)
      return { ...skill }
    },

    async update(id: string, input: SkillInput) {
      const db = await getDb()
      const index = db.skills.findIndex(skill => skill.id === id)
      if (index === -1) throw new DataError(MISSING_ITEM)
      const updated: Skill = {
        ...db.skills[index]!,
        name: input.name.trim(),
        color: input.color,
        goal: input.goal ? { ...input.goal } : null,
      }
      db.skills[index] = updated
      return { ...updated }
    },

    async remove(id: string) {
      const db = await getDb()
      db.skills = db.skills.filter(skill => skill.id !== id)
      db.sessions = db.sessions.filter(session => session.skillId !== id) // cascade, like the database
    },
  }
}

/** Strictly after `cursor` in a newest-first list. */
function isAfter(session: PracticeSession, cursor: SessionCursor): boolean {
  return session.date < cursor.date || (session.date === cursor.date && session.createdAt < cursor.createdAt)
}

export function createGuestSessionsRepository(getDb: () => Promise<GuestDb>): SessionsRepository {
  return {
    async list({ limit, after, skillId }): Promise<SessionsPage> {
      const db = await getDb()
      const matching = db.sessions
        .filter(session => (!skillId || session.skillId === skillId) && (!after || isAfter(session, after)))
        .sort(compareSessionsNewestFirst)
      return { items: matching.slice(0, limit).map(session => ({ ...session })), hasMore: matching.length > limit }
    },

    async create(input: SessionInput) {
      const db = await getDb()
      if (!db.skills.some(skill => skill.id === input.skillId)) throw new DataError(MISSING_SKILL)
      const session: PracticeSession = {
        id: `guest-session-${db.nextId++}`,
        skillId: input.skillId,
        durationMinutes: input.durationMinutes,
        date: input.date,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      }
      db.sessions.push(session)
      return { ...session }
    },

    async update(id: string, input: SessionInput) {
      const db = await getDb()
      const index = db.sessions.findIndex(session => session.id === id)
      if (index === -1) throw new DataError(MISSING_ITEM)
      if (!db.skills.some(skill => skill.id === input.skillId)) throw new DataError(MISSING_SKILL)
      const updated: PracticeSession = {
        ...db.sessions[index]!,
        skillId: input.skillId,
        durationMinutes: input.durationMinutes,
        date: input.date,
        notes: input.notes,
      }
      db.sessions[index] = updated
      return { ...updated }
    },

    async remove(id: string) {
      const db = await getDb()
      db.sessions = db.sessions.filter(session => session.id !== id)
    },
  }
}
