import type { PracticeSession } from '#shared/types/domain'

interface SessionDialogState {
  open: boolean
  /** Set when editing an existing session */
  session: PracticeSession | null
  /** Pre-selected skill when logging from a skill card */
  skillId: string | null
  /** Duration and date to start from — set when the form is opened by stopping a timer */
  prefill: { minutes: number, date: string } | null
  /** Where the form was opened from; the timer is cleared once its session is saved */
  source: 'timer' | null
}

/** One shared "log / edit session" dialog, openable from the top bar, skill cards and the session list. */
export function useSessionDialog() {
  const state = useState<SessionDialogState>('session-dialog', () => ({ open: false, session: null, skillId: null, prefill: null, source: null }))

  function openLog(options: { skillId?: string | null, prefill?: { minutes: number, date: string } | null, source?: 'timer' | null } = {}) {
    state.value = { open: true, session: null, skillId: options.skillId ?? null, prefill: options.prefill ?? null, source: options.source ?? null }
  }

  function openEdit(session: PracticeSession) {
    state.value = { open: true, session, skillId: null, prefill: null, source: null }
  }

  function close() {
    state.value = { ...state.value, open: false }
  }

  return { state, openLog, openEdit, close }
}
