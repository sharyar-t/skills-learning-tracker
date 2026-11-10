import type { PracticeSession, SessionInput } from '#shared/types/domain'
import type { SupabaseDb } from './skills-repository'

/** Position in the newest-first list; the next page starts strictly after it. */
export interface SessionCursor {
  date: string
  createdAt: string
}

export interface SessionsPage {
  items: PracticeSession[]
  hasMore: boolean
}

export interface SessionsRepository {
  list: (options: { limit: number, after?: SessionCursor | null, skillId?: string | null }) => Promise<SessionsPage>
  create: (input: SessionInput) => Promise<PracticeSession>
  update: (id: string, input: SessionInput) => Promise<PracticeSession>
  remove: (id: string) => Promise<void>
}

export function createSessionsRepository(client: SupabaseDb): SessionsRepository {
  return {
    async list({ limit, after, skillId }) {
      // Newest first; served by the (user_id, practiced_on desc, created_at desc) index
      let query = client
        .from('sessions')
        .select('*')
        .order('practiced_on', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit + 1) // one extra row tells us whether another page exists

      if (skillId) query = query.eq('skill_id', skillId)
      // Keyset pagination: stable even when new sessions are logged while the user scrolls
      if (after) {
        query = query.or(`practiced_on.lt.${after.date},and(practiced_on.eq.${after.date},created_at.lt.${after.createdAt})`)
      }

      const { data, error } = await query
      if (error) throw new DataError(describeDataError(error, 'load your sessions'))

      return { items: data.slice(0, limit).map(sessionFromRow), hasMore: data.length > limit }
    },

    async create(input) {
      const { data, error } = await client
        .from('sessions')
        .insert(sessionInputToRow(input))
        .select()
        .single()

      if (error) throw new DataError(describeDataError(error, 'save your session'))
      return sessionFromRow(data)
    },

    async update(id, input) {
      const { data, error } = await client
        .from('sessions')
        .update(sessionInputToRow(input))
        .eq('id', id)
        .select()
        .single()

      if (error) throw new DataError(describeDataError(error, 'save your changes'))
      return sessionFromRow(data)
    },

    async remove(id) {
      const { error } = await client.from('sessions').delete().eq('id', id)
      if (error) throw new DataError(describeDataError(error, 'delete this session'))
    },
  }
}
