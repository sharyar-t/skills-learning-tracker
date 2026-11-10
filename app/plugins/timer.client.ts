/** Longer than this away and we mention that the timer kept running; a plain refresh stays quiet. */
const AWAY_NOTICE_MS = 2 * 60 * 1000

// Brings a saved timer back after a refresh or a closed browser, keeps tabs in step, and makes sure
// the clock is right the moment the page becomes visible again.
export default defineNuxtPlugin({
  name: 'timer',
  dependsOn: ['pinia'],
  setup() {
    const timer = useTimerStore()
    const toast = useToast()

    // Only once hydration has fully finished: the timer bar isn't in the server-rendered HTML, and adding it
    // any earlier (e.g. on app:mounted, while async parts are still hydrating) causes a hydration mismatch.
    onNuxtReady(() => {
      const recovered = timer.restore()
      if (recovered && recovered.awayMs > AWAY_NOTICE_MS) {
        toast.show({
          title: 'Your timer kept running',
          detail: `${formatElapsed(timer.elapsed)} so far. Stop it when you're done — you can adjust the time before saving.`,
          icon: 'check',
        })
      }
    })

    // Signing in, signing out, or entering/leaving the demo changes whose timer applies
    watch(() => timer.owner, () => { timer.restore() })

    // Another tab started, paused or finished the timer
    window.addEventListener('storage', (event) => {
      if (event.key === TIMER_STORAGE_KEY) timer.restore()
    })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') timer.touch()
      else timer.heartbeat()
    })
    window.addEventListener('pagehide', () => timer.heartbeat())
  },
})
