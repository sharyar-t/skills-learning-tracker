import type { DailyTotal, Skill, SkillInput, SkillWithStats } from '#shared/types/domain'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useSkillsStore = defineStore('skills', () => {
  const repository = useRepositories().skills

  const rawSkills = ref<Skill[]>([])
  /** One entry per skill per practiced day. Totals, streaks (and later the heatmap) derive from this. */
  const dailyTotals = ref<DailyTotal[]>([])
  const today = ref(toISODate())
  const status = ref<LoadStatus>('idle')
  const loadError = ref<string | null>(null)

  const totalsBySkill = computed(() => groupTotalsBySkill(dailyTotals.value))

  const skills = computed<SkillWithStats[]>(() =>
    rawSkills.value.map(skill => ({
      ...skill,
      ...deriveStats(totalsBySkill.value.get(skill.id) ?? [], today.value),
    })),
  )

  const byId = computed(() => new Map(skills.value.map(skill => [skill.id, skill])))

  /** The skill practiced most recently — the sensible default in the log form. */
  const mostRecentSkillId = computed(() => {
    let best: SkillWithStats | null = null
    for (const skill of skills.value) {
      if (skill.lastPracticedOn && (!best || skill.lastPracticedOn > best.lastPracticedOn!)) best = skill
    }
    return best?.id ?? null
  })

  /** Streaks depend on the user's local "today", so this only ever runs in the browser. */
  async function load() {
    if (status.value === 'loading') return
    status.value = 'loading'
    loadError.value = null
    try {
      const data = await repository.list()
      rawSkills.value = data.skills
      dailyTotals.value = data.totals
      today.value = toISODate()
      status.value = 'ready'
    }
    catch (error) {
      loadError.value = messageOf(error, 'Couldn\'t load your skills. Please try again.')
      status.value = 'error'
    }
  }

  /** Load on first use, or retry after a failure. Safe to call from anywhere. */
  async function ensureLoaded() {
    if (status.value === 'idle' || status.value === 'error') await load()
  }

  async function create(input: SkillInput): Promise<{ error: string | null, skill?: SkillWithStats }> {
    try {
      const skill = await repository.create(input)
      rawSkills.value = [...rawSkills.value, skill]
      return { error: null, skill: byId.value.get(skill.id) }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t save your skill. Please try again.') }
    }
  }

  async function update(id: string, input: SkillInput): Promise<{ error: string | null }> {
    try {
      const updated = await repository.update(id, input)
      rawSkills.value = rawSkills.value.map(skill => (skill.id === id ? updated : skill))
      return { error: null }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t save your changes. Please try again.') }
    }
  }

  async function remove(id: string): Promise<{ error: string | null }> {
    try {
      await repository.remove(id)
      rawSkills.value = rawSkills.value.filter(skill => skill.id !== id)
      dailyTotals.value = dailyTotals.value.filter(total => total.skillId !== id)
      useSessionsStore().dropSkill(id) // the database cascade removed its sessions too
      useTimerStore().dropSkill(id)
      return { error: null }
    }
    catch (error) {
      return { error: messageOf(error, 'Couldn\'t delete this skill. Please try again.') }
    }
  }

  /** Reflect a logged / edited / deleted session in totals and streaks without refetching. */
  function adjustTotals(skillId: string, date: string, minutes: number, sessions: number) {
    dailyTotals.value = applyTotalsDelta(dailyTotals.value, skillId, date, minutes, sessions)
  }

  /** Drop everything — called on sign out so the next account never sees stale data. */
  function clear() {
    rawSkills.value = []
    dailyTotals.value = []
    status.value = 'idle'
    loadError.value = null
  }

  return { skills, byId, dailyTotals, totalsBySkill, mostRecentSkillId, today, status, loadError, load, ensureLoaded, create, update, remove, adjustTotals, clear }
})
