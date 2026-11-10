/**
 * Keeps cached data honest when the data source changes:
 *  - entering or leaving guest mode drops everything in the stores (and the demo database), so a
 *    visitor never sees demo data in a real account, or the other way round;
 *  - signing in ends guest mode for good, so signing out later doesn't drop the user back into the demo.
 */
export function useDataModeSync() {
  const { isGuest, leave } = useGuest()
  const session = useSupabaseSession()
  const guestDb = useGuestDatabase()

  watch(isGuest, () => {
    useSkillsStore().clear()
    useSessionsStore().clear()
    guestDb.reset()
  })

  watch(session, (current) => {
    if (current) leave()
  }, { immediate: true })
}
