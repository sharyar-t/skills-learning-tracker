import type { ISODate } from '../types/domain'
import { isValidISODate } from './dates'
import { MAX_SESSION_MINUTES } from './duration'

export const TIMER_STORAGE_KEY = 'slt-timer'

export type TimerStatus = 'running' | 'paused'

/**
 * A practice timer. Time is derived from timestamps, never counted in ticks, so it stays right
 * through page navigation, throttled background tabs and a closed browser.
 */
export interface TimerState {
  skillId: string
  status: TimerStatus
  /** Time banked from finished (paused) stretches */
  accumulatedMs: number
  /** When the current stretch began (epoch ms); null while paused */
  runningSince: number | null
  /** The user's local date when the timer was started — the session's practice date */
  startedOn: ISODate
}

export function startTimer(skillId: string, now: number, today: ISODate): TimerState {
  return { skillId, status: 'running', accumulatedMs: 0, runningSince: now, startedOn: today }
}

export function elapsedMs(state: TimerState, now: number): number {
  // A clock that jumped backwards must never produce negative time
  const live = state.status === 'running' && state.runningSince !== null ? Math.max(0, now - state.runningSince) : 0
  return state.accumulatedMs + live
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'paused') return state
  return { ...state, status: 'paused', accumulatedMs: elapsedMs(state, now), runningSince: null }
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state
  return { ...state, status: 'running', runningSince: now }
}

/** What goes into the log form: whole minutes, at least 1, at most a day (the form's own limits). */
export function timerMinutes(ms: number): number {
  return Math.min(MAX_SESSION_MINUTES, Math.max(1, Math.round(ms / 60_000)))
}

const pad = (value: number) => String(value).padStart(2, '0')

/** Clock face: "00:07", "12:34", "1:05:09". */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

/** Spoken form for announcements: "less than a minute", "12 minutes", "1 hour 5 minutes". */
export function describeElapsed(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / 60_000)
  if (totalMinutes < 1) return 'less than a minute'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  return parts.join(' ')
}

// --- Persistence ------------------------------------------------------------

export interface PersistedTimer {
  state: TimerState
  /** Whose timer this is (account id, or "guest") — never restored for someone else */
  owner: string
  /** Last time the page was known to be open, to tell a refresh from a long absence */
  lastSeenAt: number
}

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Stored JSON → timer, or null for anything missing, corrupt or inconsistent. */
export function parsePersistedTimer(raw: string | null | undefined): PersistedTimer | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  }
  catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { state, owner, lastSeenAt } = data as Record<string, unknown>
  if (typeof owner !== 'string' || !owner || !isFiniteNumber(lastSeenAt)) return null
  if (typeof state !== 'object' || state === null) return null

  const s = state as Record<string, unknown>
  if (typeof s.skillId !== 'string' || !s.skillId) return null
  if (s.status !== 'running' && s.status !== 'paused') return null
  if (!isFiniteNumber(s.accumulatedMs) || s.accumulatedMs < 0) return null
  if (typeof s.startedOn !== 'string' || !isValidISODate(s.startedOn)) return null
  if (s.status === 'running' ? !isFiniteNumber(s.runningSince) : s.runningSince !== null) return null

  return {
    owner,
    lastSeenAt,
    state: {
      skillId: s.skillId,
      status: s.status,
      accumulatedMs: s.accumulatedMs,
      runningSince: s.runningSince as number | null,
      startedOn: s.startedOn,
    },
  }
}
