// Needs Pinia (the stores) and the Supabase session; both are set up by their modules' plugins
export default defineNuxtPlugin({
  name: 'data-mode',
  dependsOn: ['pinia'],
  setup() {
    useDataModeSync()
  },
})
