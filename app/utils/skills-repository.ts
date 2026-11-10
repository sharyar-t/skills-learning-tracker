import type { Database } from '#shared/types/database.types'
import type { DailyTotal, Skill, SkillInput } from '#shared/types/domain'

/**
 * Where skills live. The Supabase implementation below backs signed-in users;
 * guest mode will provide an in-memory implementation with the same shape.
 */
export interface SkillsRepository {
  /** All skills (oldest first) plus per-day practice totals — stats and streaks are derived from those. */
  list: () => Promise<{ skills: Skill[], totals: DailyTotal[] }>
  create: (input: SkillInput) => Promise<Skill>
  update: (id: string, input: SkillInput) => Promise<Skill>
  /** Also removes every session of the skill (database cascade). */
  remove: (id: string) => Promise<void>
}

// ReturnType<typeof useSupabaseClient> would resolve the generic to `unknown`; name the schema explicitly
export type SupabaseDb = ReturnType<typeof useSupabaseClient<Database>>

const PAGE_SIZE = 1000

/**
 * One row per skill per practiced day (aggregated in the database — not raw sessions).
 * PostgREST caps a response at 1000 rows, so page until exhausted to keep the numbers exact.
 */
async function fetchDailyTotals(client: SupabaseDb): Promise<DailyTotal[]> {
  const totals: DailyTotal[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('daily_skill_totals')
      .select('skill_id, practiced_on, total_minutes, session_count')
      .order('practiced_on', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new DataError(describeDataError(error, 'load your skills'))

    for (const row of data) {
      if (!row.skill_id || !row.practiced_on) continue
      totals.push({
        skillId: row.skill_id,
        date: row.practiced_on,
        minutes: row.total_minutes ?? 0,
        sessions: row.session_count ?? 0,
      })
    }
    if (data.length < PAGE_SIZE) return totals
  }
}

export function createSkillsRepository(client: SupabaseDb): SkillsRepository {
  return {
    async list() {
      const [skillsResult, totals] = await Promise.all([
        client.from('skills').select('*').order('created_at', { ascending: true }),
        fetchDailyTotals(client),
      ])

      if (skillsResult.error) throw new DataError(describeDataError(skillsResult.error, 'load your skills'))
      return { skills: skillsResult.data.map(skillFromRow), totals }
    },

    async create(input) {
      const { data, error } = await client
        .from('skills')
        .insert(skillInputToRow(input))
        .select()
        .single()

      if (error) throw new DataError(describeDataError(error, 'save your skill'))
      return skillFromRow(data)
    },

    async update(id, input) {
      const { data, error } = await client
        .from('skills')
        .update(skillInputToRow(input))
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DataError(describeDataError(error, 'save your changes'))
      return skillFromRow(data)
    },

    async remove(id) {
      const { error } = await client.from('skills').delete().eq('id', id)
      if (error) throw new DataError(describeDataError(error, 'delete this skill'))
    },
  }
}
