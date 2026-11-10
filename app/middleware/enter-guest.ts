// /guest is a one-click doorway: start the demo and go straight to the dashboard.
export default defineNuxtRouteMiddleware(() => {
  // A real account is already "in" — don't put them in the demo
  if (useSupabaseSession().value) return navigateTo('/dashboard')
  useGuest().enter()
  return navigateTo('/dashboard')
})
