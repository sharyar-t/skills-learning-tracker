export type SignUpStatus = 'signed-in' | 'confirm-email'

/**
 * Thin wrapper over Supabase Auth. Every method resolves to `{ error }` where `error`
 * is a user-facing message (or null on success) — callers never see raw Supabase errors.
 */
export function useAuth() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  // Production sets NUXT_PUBLIC_SITE_URL; locally it's empty, so links point back at whatever address the app runs on
  const configuredSiteUrl = useRuntimeConfig().public.siteUrl as string
  const origin = (configuredSiteUrl || useRequestURL().origin).replace(/\/+$/, '')

  const isAuthenticated = computed(() => !!user.value)
  /** Email from the JWT claims — the module exposes claims, not the full User object. */
  const email = computed(() => (user.value?.email as string | undefined) ?? null)

  async function signUp(emailValue: string, password: string) {
    const { data, error } = await client.auth.signUp({
      email: emailValue.trim(),
      password,
      options: { emailRedirectTo: `${origin}/confirm` },
    })
    if (error) return { error: describeAuthError(error), status: null }

    // With email confirmation on, no session is returned until the link is opened.
    // Re-registering an existing address also lands here (Supabase returns an obfuscated user),
    // so the UI shows the same message either way and never reveals whether an account exists.
    const status: SignUpStatus = data.session ? 'signed-in' : 'confirm-email'
    return { error: null, status }
  }

  async function signIn(emailValue: string, password: string) {
    const { error } = await client.auth.signInWithPassword({ email: emailValue.trim(), password })
    return { error: error ? describeAuthError(error) : null }
  }

  async function signOut() {
    const { error } = await client.auth.signOut()
    if (error) return { error: 'Couldn\'t sign you out. Check your connection and try again.' }
    useSkillsStore().clear()
    useSessionsStore().clear()
    await navigateTo('/')
    return { error: null }
  }

  async function requestPasswordReset(emailValue: string) {
    const { error } = await client.auth.resetPasswordForEmail(emailValue.trim(), {
      redirectTo: `${origin}/reset-password`,
    })
    return { error: error ? describeAuthError(error) : null }
  }

  async function updatePassword(password: string) {
    const { error } = await client.auth.updateUser({ password })
    return { error: error ? describeAuthError(error) : null }
  }

  return { user, email, isAuthenticated, signUp, signIn, signOut, requestPasswordReset, updatePassword }
}
