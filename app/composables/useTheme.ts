import type { Database } from '#shared/types/database.types'
import type { ThemePreference } from '#shared/types/domain'

/**
 * Light / dark / follow-the-system, remembered on this device and — for signed-in users — in their account.
 *
 * - The device (localStorage) is what applies the theme before first paint, so it is the source of truth here.
 * - A new device with no saved choice inherits the account's; a device that already has one keeps it and
 *   updates the account, so the account always reflects the most recent choice.
 */
export function useTheme() {
  const preference = useState<ThemePreference>('theme-preference', () => 'system')
  /** True once the user has chosen on this device (or adopted their account's choice) */
  const explicit = useState('theme-explicit', () => false)
  const systemDark = usePreferredDark()
  const resolved = computed(() => resolveTheme(preference.value, systemDark.value))

  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const accountId = () => (user.value?.sub as string | undefined) ?? null

  function readStored(): ThemePreference | null {
    try {
      return parseTheme(localStorage.getItem(THEME_STORAGE_KEY))
    }
    catch {
      return null // storage blocked: the theme simply won't be remembered
    }
  }

  /** Pick up whatever is saved on this device (after hydration, and when another tab changes it). */
  function load(options: { apply?: boolean } = {}) {
    const stored = readStored()
    if (!stored) return
    preference.value = stored
    explicit.value = true
    if (options.apply) applyThemeToDocument(document, stored, { animate: true })
  }

  async function pushToAccount(value: ThemePreference) {
    const id = accountId()
    if (!id) return
    // Best effort: the theme already applies locally, so a failed sync must never get in the way
    await client.from('user_preferences').upsert({ user_id: id, theme: value }, { onConflict: 'user_id' }).then(() => {}, () => {})
  }

  /** The user's choice: apply it, remember it here, and (unless it came from the account) save it there. */
  function set(value: ThemePreference, options: { remote?: boolean } = {}) {
    preference.value = value
    explicit.value = true
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    }
    catch { /* not remembered, still applied */ }
    applyThemeToDocument(document, value, { animate: true })
    if (options.remote !== false) void pushToAccount(value)
  }

  /** On sign-in: reconcile this device with the account (see the rules above). */
  async function syncWithAccount() {
    const id = accountId()
    if (!id) return
    const { data, error } = await client.from('user_preferences').select('theme').eq('user_id', id).maybeSingle()
    if (error) return

    const remote = parseTheme(data?.theme)
    if (!explicit.value) {
      if (remote && remote !== 'system') set(remote, { remote: false }) // new device: inherit the account's choice
    }
    else if (remote !== preference.value) {
      await pushToAccount(preference.value) // this device has a choice: the account follows it
    }
  }

  return { preference, resolved, explicit, set, load, syncWithAccount }
}
