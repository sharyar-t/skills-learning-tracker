// Signed-in users have no business on sign in / sign up — send them to the app.
export default defineNuxtRouteMiddleware(() => {
  const session = useSupabaseSession()
  if (session.value) return navigateTo('/dashboard')
})
