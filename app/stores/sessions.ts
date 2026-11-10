import type { PracticeSession, SessionInput } from '#shared/types/domain'
import type { LoadStatus } from './skills'

const PAGE_SIZE = 25
/** A save of the same skill + length + day inside this window triggers the "log it again?" prompt. */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000

interface RecentLog {
  skillId: string
  minutes: number
  date: string
  at: number
}

export const useSessionsStore = defineStore('sessions', () => {
  const repository = useRepositories().sessions

  const items = ref<PracticeSession[]>([]) // newest first
  const status = ref<LoadStatus>('idle')
  const loadError = ref<string | null>(null)
  const hasMore = ref(false)
  const loadingMore = ref(false)
  const loadMoreError = ref<string | null>(null)
  const filterSkillId = ref<string | null>(null)
  const recentLogs = ref<RecentLog[]>([])

  async function load() {
    if (status.value === 'loading') return
    status.value = 'loading'
    loadError.value = null
    try {
      const page = await repository.list({ limit: PAGE_SIZE, skillId: filterSkillId.value })
      items.value = page.items
      hasMore.value = page.hasMore
      status.value = 'ready'
    }
    catch (error) {
      loadError.value = messageOf(error, 'Couldn\'t load your sessions. Please try again.')
      status.value = 'error'
    }
  }

  async function ensureLoaded() {
    if (status.value === 'idle' || status.value === 'error') await load()
  }

  async function loadMore() {
    const last = items.value.at(-1)
    if (!last || !hasMore.value || loadingMore.value) return
    loadingMore.value = true
    loadMoreError.value = null
    try {
      const page = await repository.list({
        limit: PAGE_SIZE,
        skillId: filterSkillId.value,
        after: { date: last.date, createdAt: last.createdAt },
      })
      items.value = [...items.value, ...page.items]
      hasMore.value = page.hasMore
    }
    catch (error) {
      loadMoreError.value = messageOf(error, 'Couldn\'t load more sessions. Please try again.')
    }
    finally {
      loadingMore.value = false
    }
  }

  async function setFilter(skillId: string | null) {
    if (filterSkillId.value === skillId) return
    filterSkillId.value = skillId
    status.value = 'idle'
    await load()
  }

  /** Put a session where it belongs in the list — unless that spot hasn't been loaded yet. */
  function insertSorted(session: PracticeSession) {
    if (status.value !== 'ready') return
    if (filterSkillId.value && filterSkillId.value !== session.skillId) return

    const last = items.value.at(-1)
    if (hasMore.value && last && compareSessionsNewestFirst(session, last) > 0) return // belongs to a later page

    const index = items.value.findIndex(item => compareSessionsNewestFirst(session, item) < 0)
    const next = [...items.value]
    next.splice(index === -1 ? next.length : index, 0, session)
    items.value = next
  }

  function isRecentDuplicate(input: SessionInput): boolean {
    const now = Date.now()
    return recentLogs.value.some(log =>
      now - log.at < DUPLICATE_WINDOW_MS
      && log.skillId === input.skillId
      && log.minutes === input.durationMinutes
      && log.date === input.date,
    )
  }

  async function create(input: SessionInput): Promise<{ error: string | null, session?: PracticeSession }> {
    try {
      const session = await repository.create(input)
      useSkillsStore().adjustTotals(session.skillId, session.date, session.durationMinutes, 1)
      insertSorted(session)
      recentLogs.value = [
        ...recentLogs.value.filter(log => Date.now() - log.at < DUPLICATE_WINDOW_MS),
        { skillId: session.skillId, minutes: session.durationMinutes, date: session.date, at: Date.now() },
      ]
      return { error: null, session }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t save your session. Check your connection and try again.') }
    }
  }

  async function update(previous: PracticeSession, input: SessionInput): Promise<{ error: string | null, session?: PracticeSession }> {
    try {
      const session = await repository.update(previous.id, input)
      const skills = useSkillsStore()
      // Move the practice from the old skill/day to the new one
      skills.adjustTotals(previous.skillId, previous.date, -previous.durationMinutes, -1)
      skills.adjustTotals(session.skillId, session.date, session.durationMinutes, 1)

      items.value = items.value.filter(item => item.id !== previous.id)
      insertSorted(session)
      return { error: null, session }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t save your changes. Check your connection and try again.') }
    }
  }

  async function remove(session: PracticeSession): Promise<{ error: string | null }> {
    try {
      await repository.remove(session.id)
      useSkillsStore().adjustTotals(session.skillId, session.date, -session.durationMinutes, -1)
      items.value = items.value.filter(item => item.id !== session.id)
      return { error: null }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t delete this session. Check your connection and try again.') }
    }
  }

  /** A skill was deleted: its sessions are gone from the database, so drop them here too. */
  function dropSkill(skillId: string) {
    items.value = items.value.filter(item => item.skillId !== skillId)
    if (filterSkillId.value === skillId) filterSkillId.value = null
  }

  function clear() {
    items.value = []
    status.value = 'idle'
    loadError.value = null
    hasMore.value = false
    loadMoreError.value = null
    filterSkillId.value = null
    recentLogs.value = []
  }

  return {
    items, status, loadError, hasMore, loadingMore, loadMoreError, filterSkillId,
    load, ensureLoaded, loadMore, setFilter, create, update, remove, dropSkill, isRecentDuplicate, clear,
  }
})
