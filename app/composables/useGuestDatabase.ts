import type { GuestDb } from '~/utils/guest-repositories'
import type { SampleData } from '#shared/types/domain'

/**
 * The guest's in-memory database. Built on first use — and the sample is imported lazily, so signed-in
 * users never download it. Never created on the server, so it never enters the SSR payload.
 */
export function useGuestDatabase() {
  const state = useState<GuestDb | null>('guest-db', () => null)

  async function get(): Promise<GuestDb> {
    if (!state.value) {
      const { default: sample } = await import('~~/data/sample-skills.json')
      // Two loads can race here; whichever resolves second finds the db already built
      state.value ??= createGuestDb(sample as unknown as SampleData, toISODate())
    }
    return state.value
  }

  function reset() {
    state.value = null
  }

  return { get, reset }
}
