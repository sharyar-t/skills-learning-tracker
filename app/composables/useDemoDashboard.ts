import sample from '~~/data/sample-skills.json'
import type { SampleData, SkillWithStats } from '#shared/types/domain'

/**
 * The sample data as a ready-to-render dashboard: skills with stats, goal progress,
 * the featured skill and the "next up" suggestion — all as of today, so streaks are alive.
 * Powers the landing page showcase; guest mode will build on the same data.
 */
export function useDemoDashboard() {
  // Rendered on the server with the server's date and reused verbatim by the client during hydration
  // (no mismatch); once mounted we switch to the visitor's own local date.
  const today = useState('demo-today', () => toISODate())
  onMounted(() => { today.value = toISODate() })

  const data = computed(() => buildDemoData(sample as unknown as SampleData, today.value))
  const totalsBySkill = computed(() => groupTotalsBySkill(data.value.totals))

  const skills = computed<SkillWithStats[]>(() =>
    data.value.skills.map(skill => ({
      ...skill,
      ...deriveStats(totalsBySkill.value.get(skill.id) ?? [], today.value),
    })),
  )

  const progress = computed(() => new Map(skills.value.map(skill => [
    skill.id,
    skill.goal ? goalProgress(skill.goal, totalsBySkill.value.get(skill.id) ?? [], today.value) : null,
  ])))

  const featured = computed(() => featuredSkill(skills.value))
  const others = computed(() => skills.value
    .filter(skill => skill.id !== featured.value?.id)
    .sort((a, b) => (b.lastPracticedOn ?? '').localeCompare(a.lastPracticedOn ?? '') || a.createdAt.localeCompare(b.createdAt)))
  const nudge = computed(() => pickNudge(skills.value, progress.value, today.value))
  const overall = computed(() => overallStreak(data.value.totals, today.value))

  return { today, skills, totals: computed(() => data.value.totals), progress, featured, others, nudge, overall }
}
