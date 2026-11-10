// The app's own "you must be in" check, replacing the Supabase module's built-in redirect.
// Allowed in: a signed-in user, or a guest exploring the demo.
export default defineNuxtRouteMiddleware((to) => {
  const session = useSupabaseSession()
  const { isGuest } = useGuest()
  if (session.value || isGuest.value) return

  // Remember where they were going; sign in sends them back there
  useSupabaseCookieRedirect().path.value = to.fullPath
  return navigateTo('/login')
})
