import type { TimerState } from '#shared/utils/timer'

/** How often (in one-second ticks) the "page is still open" heartbeat is saved */
const HEARTBEAT_EVERY_TICKS = 15

/**
 * One practice timer at a time. It lives in localStorage as well as in memory, so it survives
 * navigation, a refresh and a closed browser — and it belongs to whoever started it
 * (an account, or the demo guest), never to the next person on the same device.
 */
export const useTimerStore = defineStore('timer', () => {
  const state = ref<TimerState | null>(null)
  const now = ref(Date.now())
  /** Polite screen-reader message for state changes (never the ticking itself) */
  const announcement = ref('')

  const user = useSupabaseUser()
  const guest = useGuest()
  const owner = computed<string | null>(() => (user.value?.sub as string | undefined) ?? (guest.isGuest.value ? 'guest' : null))

  const elapsed = computed(() => (state.value ? elapsedMs(state.value, now.value) : 0))
  const isRunning = computed(() => state.value?.status === 'running')
  const minutes = computed(() => timerMinutes(elapsed.value))

  function persist() {
    if (!import.meta.client) return
    try {
      if (state.value && owner.value) {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ state: state.value, owner: owner.value, lastSeenAt: Date.now() }))
      }
      else if (!state.value) {
        localStorage.removeItem(TIMER_STORAGE_KEY)
      }
    }
    catch { /* storage blocked: the timer still works for this page view */ }
  }

  // The clock only needs to *redraw* every second — the elapsed time itself comes from timestamps
  let interval: ReturnType<typeof setInterval> | undefined
  let ticks = 0

  function touch() {
    now.value = Date.now()
  }

  function tick() {
    touch()
    if (++ticks % HEARTBEAT_EVERY_TICKS === 0) persist()
  }

  /** Start or stop the redraw interval to match the timer — called synchronously after every change. */
  function syncTicker() {
    if (!import.meta.client) return
    clearInterval(interval)
    interval = state.value?.status === 'running' ? setInterval(tick, 1000) : undefined
  }

  // The store going away (page teardown, tests) must not leave an interval behind
  onScopeDispose(() => clearInterval(interval))

  /** Starts a timer for a skill. False if one already exists or nobody is "in" the app. */
  function start(skillId: string): boolean {
    if (state.value || !owner.value) return false
    const at = Date.now()
    now.value = at
    state.value = startTimer(skillId, at, toISODate())
    syncTicker()
    persist()
    announcement.value = 'Timer started'
    return true
  }

  function pause() {
    if (!state.value || state.value.status === 'paused') return
    const at = Date.now()
    now.value = at
    state.value = pauseTimer(state.value, at)
    syncTicker()
    persist()
    announcement.value = `Timer paused at ${describeElapsed(elapsed.value)}`
  }

  function resume() {
    if (!state.value || state.value.status === 'running') return
    const at = Date.now()
    now.value = at
    state.value = resumeTimer(state.value, at)
    syncTicker()
    persist()
    announcement.value = 'Timer resumed'
  }

  /** Throw the timer away without logging anything. */
  function discard() {
    if (!state.value) return
    state.value = null
    syncTicker()
    persist()
    announcement.value = 'Timer discarded'
  }

  /** The session was logged: the timer has done its job. */
  function finish() {
    state.value = null
    syncTicker()
    persist()
    announcement.value = ''
  }

  /** A deleted skill takes its timer with it. */
  function dropSkill(skillId: string) {
    if (state.value?.skillId === skillId) discard()
  }

  /** Record that the page is still open (also called when it is being hidden or closed). */
  function heartbeat() {
    if (state.value) persist()
  }

  /**
   * Load the saved timer for the current owner. Returns how long the page was away if a running
   * timer was recovered (so the caller can tell a refresh from a long absence).
   */
  function restore(): { awayMs: number } | null {
    if (!import.meta.client) return null
    let stored = null
    try {
      stored = parsePersistedTimer(localStorage.getItem(TIMER_STORAGE_KEY))
    }
    catch { /* storage blocked */ }

    // Not in the app (signed out, not a guest): show nothing, but leave a saved timer for its owner
    if (!owner.value) {
      state.value = null
      syncTicker()
      return null
    }
    if (!stored || stored.owner !== owner.value) {
      state.value = null
      syncTicker()
      if (stored) {
        try {
          localStorage.removeItem(TIMER_STORAGE_KEY) // someone else's timer on a shared device
        }
        catch { /* ignore */ }
      }
      return null
    }

    const at = Date.now()
    now.value = at
    state.value = stored.state
    syncTicker()
    return { awayMs: stored.state.status === 'running' ? Math.max(0, at - stored.lastSeenAt) : 0 }
  }

  return { state, now, owner, elapsed, isRunning, minutes, announcement, start, pause, resume, discard, finish, dropSkill, heartbeat, touch, restore }
})
