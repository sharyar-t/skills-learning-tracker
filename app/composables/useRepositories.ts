import type { Database } from '#shared/types/database.types'

/** An object whose methods all go to whichever target `pick()` returns *at call time*. */
function delegating<T extends object>(pick: () => T): T {
  return new Proxy({} as T, {
    get: (_target, method) => (...args: unknown[]) => (pick() as Record<PropertyKey, (...a: unknown[]) => unknown>)[method]!(...args),
  })
}

/**
 * The stores' data source. Signed-in users talk to Supabase; guests to the in-memory demo database.
 * The choice is made on every call, so entering or leaving guest mode needs no store re-creation.
 */
export function useRepositories() {
  const client = useSupabaseClient<Database>()
  const { isGuest } = useGuest()
  const guestDb = useGuestDatabase()

  const remote = {
    skills: createSkillsRepository(client),
    sessions: createSessionsRepository(client),
  }
  const local = {
    skills: createGuestSkillsRepository(guestDb.get),
    sessions: createGuestSessionsRepository(guestDb.get),
  }

  return {
    skills: delegating(() => (isGuest.value ? local : remote).skills),
    sessions: delegating(() => (isGuest.value ? local : remote).sessions),
  }
}
