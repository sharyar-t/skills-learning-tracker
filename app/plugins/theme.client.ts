// The saved theme is already applied by the inline <head> script. This keeps the toggle's state honest
// once the page is hydrated, follows changes made in other tabs, and syncs with the account on sign-in.
export default defineNuxtPlugin({
  name: 'theme',
  setup(nuxtApp) {
    const theme = useTheme()

    // After hydration (not before) so the server-rendered markup and the first client render agree
    nuxtApp.hook('app:mounted', () => theme.load())

    window.addEventListener('storage', (event) => {
      if (event.key === THEME_STORAGE_KEY) theme.load({ apply: true })
    })

    watch(useSupabaseSession(), (session) => {
      if (session) void theme.syncWithAccount()
    }, { immediate: true })
  },
})
