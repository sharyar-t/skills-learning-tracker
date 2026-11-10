import { describe, expect, it } from 'vitest'
import {
  describeElapsed,
  elapsedMs,
  formatElapsed,
  parsePersistedTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  timerMinutes,
} from '../../shared/utils/timer'

const T0 = 1_800_000_000_000
const min = (n: number) => n * 60_000
const sec = (n: number) => n * 1000

describe('timer state machine', () => {
  it('starts running at zero, remembering the skill and the practice date', () => {
    const t = startTimer('guitar', T0, '2026-11-10')
    expect(t).toEqual({ skillId: 'guitar', status: 'running', accumulatedMs: 0, runningSince: T0, startedOn: '2026-11-10' })
    expect(elapsedMs(t, T0)).toBe(0)
  })

  it('measures elapsed time from timestamps, whatever happened in between', () => {
    const t = startTimer('guitar', T0, '2026-11-10')
    expect(elapsedMs(t, T0 + sec(1))).toBe(sec(1))
    expect(elapsedMs(t, T0 + min(90))).toBe(min(90)) // e.g. the tab slept for 90 minutes
  })

  it('pausing banks the time and stops the clock', () => {
    const paused = pauseTimer(startTimer('guitar', T0, '2026-11-10'), T0 + min(10))
    expect(paused).toMatchObject({ status: 'paused', accumulatedMs: min(10), runningSince: null })
    expect(elapsedMs(paused, T0 + min(500))).toBe(min(10))
  })

  it('resuming continues from the banked time, excluding the break', () => {
    const paused = pauseTimer(startTimer('guitar', T0, '2026-11-10'), T0 + min(10))
    const resumed = resumeTimer(paused, T0 + min(25)) // a 15 minute break
    expect(elapsedMs(resumed, T0 + min(30))).toBe(min(15))
  })

  it('adds up several stretches', () => {
    let t = startTimer('guitar', T0, '2026-11-10')
    t = pauseTimer(t, T0 + min(5))
    t = resumeTimer(t, T0 + min(8))
    t = pauseTimer(t, T0 + min(20))
    t = resumeTimer(t, T0 + min(21))
    expect(elapsedMs(t, T0 + min(24))).toBe(min(5 + 12 + 3))
  })

  it('pausing twice or resuming twice changes nothing', () => {
    const running = startTimer('guitar', T0, '2026-11-10')
    expect(resumeTimer(running, T0 + min(3))).toBe(running)
    const paused = pauseTimer(running, T0 + min(5))
    expect(pauseTimer(paused, T0 + min(9))).toBe(paused)
  })

  it('never goes negative if the system clock jumps backwards', () => {
    const t = startTimer('guitar', T0, '2026-11-10')
    expect(elapsedMs(t, T0 - min(30))).toBe(0)
    expect(pauseTimer(t, T0 - min(30)).accumulatedMs).toBe(0)
  })

  it('keeps the start date even when the timer runs past midnight', () => {
    const t = startTimer('guitar', T0, '2026-11-10')
    expect(pauseTimer(t, T0 + min(180)).startedOn).toBe('2026-11-10')
  })

  it('does not mutate the state it is given', () => {
    const t = startTimer('guitar', T0, '2026-11-10')
    const copy = { ...t }
    pauseTimer(t, T0 + min(1))
    expect(t).toEqual(copy)
  })
})

describe('timerMinutes (what the log form is pre-filled with)', () => {
  it.each([
    [0, 1], [sec(20), 1], [sec(89), 1], [sec(90), 2], [min(25), 25], [min(25) + sec(29), 25], [min(25) + sec(31), 26],
  ])('%i ms → %i min', (ms, minutes) => {
    expect(timerMinutes(ms)).toBe(minutes)
  })

  it('caps at 24 hours, the longest session the app accepts', () => {
    expect(timerMinutes(min(60 * 30))).toBe(1440)
  })
})

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'], [999, '00:00'], [sec(7), '00:07'], [sec(59), '00:59'], [min(1), '01:00'], [min(12) + sec(34), '12:34'],
    [min(59) + sec(59), '59:59'], [min(60), '1:00:00'], [min(65) + sec(9), '1:05:09'], [min(60 * 12) + sec(1), '12:00:01'], [-500, '00:00'],
  ])('%i ms → %s', (ms, text) => {
    expect(formatElapsed(ms)).toBe(text)
  })
})

describe('describeElapsed (for screen-reader announcements)', () => {
  it.each([
    [sec(30), 'less than a minute'], [min(1), '1 minute'], [min(12), '12 minutes'], [min(60), '1 hour'], [min(65), '1 hour 5 minutes'], [min(121), '2 hours 1 minute'],
  ])('%i ms → %s', (ms, text) => {
    expect(describeElapsed(ms)).toBe(text)
  })
})

describe('parsePersistedTimer', () => {
  const running = { state: { skillId: 'guitar', status: 'running', accumulatedMs: 1000, runningSince: T0, startedOn: '2026-11-10' }, owner: 'user-1', lastSeenAt: T0 }
  const paused = { state: { skillId: 'guitar', status: 'paused', accumulatedMs: 5000, runningSince: null, startedOn: '2026-11-10' }, owner: 'guest', lastSeenAt: T0 }

  it('reads back what was saved', () => {
    expect(parsePersistedTimer(JSON.stringify(running))).toEqual(running)
    expect(parsePersistedTimer(JSON.stringify(paused))).toEqual(paused)
  })

  it('drops unknown extra fields', () => {
    const parsed = parsePersistedTimer(JSON.stringify({ ...running, evil: 1, state: { ...running.state, extra: true } }))
    expect(parsed).toEqual(running)
  })

  it.each([
    ['nothing', null],
    ['empty string', ''],
    ['not JSON', '{oops'],
    ['a number', '42'],
    ['null', 'null'],
    ['no owner', JSON.stringify({ ...running, owner: '' })],
    ['no heartbeat', JSON.stringify({ ...running, lastSeenAt: 'yesterday' })],
    ['no skill', JSON.stringify({ ...running, state: { ...running.state, skillId: '' } })],
    ['unknown status', JSON.stringify({ ...running, state: { ...running.state, status: 'stopped' } })],
    ['negative time', JSON.stringify({ ...running, state: { ...running.state, accumulatedMs: -5 } })],
    ['NaN time', JSON.stringify({ ...running, state: { ...running.state, accumulatedMs: null } })],
    ['impossible date', JSON.stringify({ ...running, state: { ...running.state, startedOn: '2026-02-30' } })],
    ['running without a start', JSON.stringify({ ...running, state: { ...running.state, runningSince: null } })],
    ['paused but still ticking', JSON.stringify({ ...paused, state: { ...paused.state, runningSince: T0 } })],
  ])('rejects %s', (_name, raw) => {
    expect(parsePersistedTimer(raw)).toBeNull()
  })
})
