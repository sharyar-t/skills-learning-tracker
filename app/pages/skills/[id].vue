<script setup lang="ts">
import { ArrowLeft, CircleCheck, NotebookPen, Pencil, Plus, Target, Timer, Trash2, TrendingUp, TriangleAlert } from '@lucide/vue'
import type { PracticeSession } from '#shared/types/domain'

// Signed-in users and demo guests only (see middleware/require-session.ts)
definePageMeta({ middleware: 'require-session' })

const route = useRoute()
const skills = useSkillsStore()
const sessions = useSessionsStore()
const sessionDialog = useSessionDialog()
const timer = useTimerStore()
const toast = useToast()

const skillId = computed(() => String(route.params.id))
const skill = computed(() => skills.byId.get(skillId.value) ?? null)
const totals = computed(() => skills.totalsBySkill.get(skillId.value) ?? [])
const today = computed(() => skills.today)

useSeoMeta({ title: () => `${skill.value?.name ?? 'Skill'} — Skills Learning Tracker` })

// Dates depend on the user's local day, so load in the browser only
onMounted(async () => {
  await skills.ensureLoaded()
  if (!skill.value) return // not found: nothing to list
  if (sessions.filterSkillId === skillId.value) await sessions.ensureLoaded()
  else await sessions.setFilter(skillId.value)
})

// The session list is shared with the other pages: hand it back unfiltered
onBeforeUnmount(() => sessions.clear())

// Moving between two skills reuses this page, so follow the route
watch(skillId, (id) => {
  if (skills.byId.has(id)) sessions.setFilter(id)
})

const isLoading = computed(() => skills.status === 'idle' || skills.status === 'loading')

const stats = computed(() => {
  const current = skill.value
  if (!current) return []
  return [
    { label: 'Time logged', value: formatDuration(current.totalMinutes) },
    { label: 'Sessions', value: String(current.sessionCount) },
    { label: 'Average session', value: current.sessionCount ? formatDuration(averageSessionMinutes(current.totalMinutes, current.sessionCount)) : '—' },
    { label: 'Longest streak', value: pluralize(current.streak.longest, 'day') },
  ]
})

const progress = computed(() => (skill.value?.goal ? goalProgress(skill.value.goal, totals.value, today.value) : null))
const pace = computed(() => (progress.value ? goalPace(progress.value, totals.value, today.value) : null))

// Group the newest-first list by practice day
const groups = computed(() => {
  const result: { date: string, label: string, items: PracticeSession[] }[] = []
  for (const session of sessions.items) {
    const last = result.at(-1)
    if (last?.date === session.date) last.items.push(session)
    else result.push({ date: session.date, label: formatDayHeading(session.date, today.value), items: [session] })
  }
  return result
})

const historyLoading = computed(() => sessions.status === 'idle' || sessions.status === 'loading')

// --- Dialogs ---------------------------------------------------------------------------------
const announcement = ref('')
const editOpen = ref(false)
const deleteSkillOpen = ref(false)
const deleteSessionOpen = ref(false)
const deletingSession = ref<PracticeSession | null>(null)

function onSaved(name: string) {
  announcement.value = `Skill updated: ${name}`
  editOpen.value = false
}

async function onSkillDeleted(name: string) {
  deleteSkillOpen.value = false
  toast.show({ title: `${name} deleted`, icon: 'check' })
  await navigateTo('/skills')
}

function openDeleteSession(session: PracticeSession) {
  deletingSession.value = session
  deleteSessionOpen.value = true
}

function onSessionDeleted() {
  toast.show({ title: 'Session deleted', icon: 'check' })
  deleteSessionOpen.value = false
}

function describeDeleting(session: PracticeSession) {
  return `${formatDuration(session.durationMinutes)} ${skill.value?.name ?? ''} session from ${formatDayInSentence(session.date, today.value)}`
}
</script>

<template>
  <div>
    <NuxtLink
      to="/skills"
      class="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-text-secondary hover:text-text-primary"
    >
      <ArrowLeft :size="16" aria-hidden="true" />
      All skills
    </NuxtLink>

    <p class="sr-only" role="status" aria-live="polite">
      {{ announcement }}
    </p>

    <!-- Loading: skeletons keep the layout stable -->
    <div v-if="isLoading" class="mt-4 space-y-4" aria-busy="true" aria-label="Loading this skill">
      <div class="h-20 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
      <div class="h-28 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
      <div class="h-64 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
    </div>

    <!-- Error: never a blank screen -->
    <div v-else-if="skills.status === 'error'" class="mt-4 max-w-xl space-y-4">
      <AppAlert>{{ skills.loadError }}</AppAlert>
      <AppButton variant="secondary" @click="skills.load()">
        Try again
      </AppButton>
    </div>

    <!-- Unknown id (deleted, or a mistyped link) -->
    <section
      v-else-if="!skill"
      class="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <h1 class="text-lg font-medium">
        We couldn't find that skill
      </h1>
      <p class="mt-1 max-w-sm text-text-secondary">
        It may have been deleted, or the link is out of date.
      </p>
      <AppButton to="/skills" class="mt-6">
        Back to your skills
      </AppButton>
    </section>

    <template v-else>
      <!-- Header: identity and actions -->
      <header class="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <SkillAvatar :name="skill.name" :color="skill.color" size="lg" />
          <div class="min-w-0">
            <h1 class="truncate text-xl font-semibold" :title="skill.name">
              {{ skill.name }}
            </h1>
            <p v-if="skill.goal" class="flex items-center gap-1.5 text-sm text-text-secondary">
              <Target :size="16" class="shrink-0" aria-hidden="true" />
              <span><span class="sr-only">Goal: </span>{{ formatGoal(skill.goal) }}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="!timer.state"
            type="button"
            class="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-primary transition-colors hover:bg-bg-tertiary"
            :aria-label="`Start a timer for ${skill.name}`"
            @click="timer.start(skill.id)"
          >
            <Timer :size="18" aria-hidden="true" />
          </button>
          <AppButton @click="sessionDialog.openLog({ skillId: skill.id })">
            <Plus :size="20" aria-hidden="true" />
            Log session
          </AppButton>
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
            :aria-label="`Edit ${skill.name}`"
            @click="editOpen = true"
          >
            <Pencil :size="18" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-error"
            :aria-label="`Delete ${skill.name}`"
            @click="deleteSkillOpen = true"
          >
            <Trash2 :size="18" aria-hidden="true" />
          </button>
        </div>
      </header>

      <!-- Numbers -->
      <section aria-label="Statistics" class="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm sm:grid-cols-[repeat(4,1fr)_auto] sm:items-start">
        <dl class="contents">
          <div v-for="stat in stats" :key="stat.label">
            <dt class="text-sm text-text-secondary">
              {{ stat.label }}
            </dt>
            <dd class="font-heading text-xl font-semibold">
              {{ stat.value }}
            </dd>
          </div>
        </dl>
        <div class="col-span-2 flex items-center sm:col-span-1 sm:h-full">
          <StreakBadge :streak="skill.streak" />
        </div>
      </section>

      <!-- Goal -->
      <section
        v-if="progress && pace"
        aria-labelledby="goal-heading"
        class="mt-4 flex flex-wrap items-center gap-5 rounded-xl border border-border-subtle bg-surface p-5 shadow-sm"
      >
        <GoalRing :skill-name="skill.name" :color="skill.color" :progress="progress" :size="112" :stroke-width="10" />
        <div class="min-w-0 flex-1">
          <h2 id="goal-heading" class="text-lg font-medium">
            {{ progress.type === 'weekly' ? 'Weekly goal' : 'Total goal' }}
          </h2>
          <p class="font-heading text-lg font-semibold">
            {{ formatHoursFromMinutes(progress.doneMinutes) }} of {{ progress.targetHours }} h
            <span class="text-base font-normal text-text-secondary">{{ progress.type === 'weekly' ? 'this week' : 'in total' }}</span>
          </p>
          <p class="mt-1 flex items-start gap-2 text-sm" :class="pace.kind === 'behind' ? 'text-warning-text' : 'text-text-secondary'">
            <CircleCheck v-if="pace.kind === 'met'" :size="18" class="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <TriangleAlert v-else-if="pace.kind === 'behind'" :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
            <TrendingUp v-else :size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{{ pace.message }}</span>
          </p>
        </div>
      </section>

      <!-- No sessions yet -->
      <section
        v-if="skill.sessionCount === 0"
        class="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
      >
        <span class="flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
          <NotebookPen :size="28" aria-hidden="true" />
        </span>
        <h2 class="mt-4 text-lg font-medium">
          No sessions for {{ skill.name }} yet
        </h2>
        <p class="mt-1 max-w-sm text-text-secondary">
          Log your first session and this page fills in with your streaks, heatmap and weekly trends.
        </p>
        <AppButton class="mt-6" @click="sessionDialog.openLog({ skillId: skill.id })">
          <Plus :size="20" aria-hidden="true" />
          Log a session
        </AppButton>
      </section>

      <template v-else>
        <div class="mt-4 space-y-4">
          <ActivityHeatmap :totals="totals" :skills="[skill]" :today="today" />
          <TrendChart :totals="totals" :color="skill.color" :today="today" :skill-name="skill.name" />
        </div>

        <!-- History -->
        <section aria-labelledby="history-heading" class="mt-8">
          <h2 id="history-heading" class="text-lg font-medium">
            Session history
          </h2>

          <div v-if="historyLoading" class="mt-3 space-y-3" aria-busy="true" aria-label="Loading sessions">
            <div v-for="n in 3" :key="n" class="h-16 animate-pulse rounded-lg border border-border-subtle bg-bg-secondary" />
          </div>

          <div v-else-if="sessions.status === 'error'" class="mt-3 max-w-xl space-y-4">
            <AppAlert>{{ sessions.loadError }}</AppAlert>
            <AppButton variant="secondary" @click="sessions.load()">
              Try again
            </AppButton>
          </div>

          <div v-else class="mt-3 space-y-6">
            <section v-for="group in groups" :key="group.date" :aria-labelledby="`day-${group.date}`">
              <h3 :id="`day-${group.date}`" class="mb-2 text-sm font-semibold text-text-secondary">
                {{ group.label }}
              </h3>
              <ul class="space-y-2">
                <li v-for="session in group.items" :key="session.id">
                  <SessionRow
                    :session="session"
                    :skill="skill"
                    @edit="sessionDialog.openEdit(session)"
                    @delete="openDeleteSession(session)"
                  />
                </li>
              </ul>
            </section>

            <div v-if="sessions.hasMore" class="flex flex-col items-center gap-3">
              <AppAlert v-if="sessions.loadMoreError">
                {{ sessions.loadMoreError }}
              </AppAlert>
              <AppButton variant="secondary" :loading="sessions.loadingMore" @click="sessions.loadMore()">
                {{ sessions.loadingMore ? 'Loading…' : 'Load more sessions' }}
              </AppButton>
            </div>
          </div>
        </section>
      </template>
    </template>

    <AppDialog v-model:open="editOpen" :title="skill ? `Edit ${skill.name}` : 'Edit skill'">
      <SkillForm v-if="editOpen && skill" :skill="skill" @saved="onSaved" @cancel="editOpen = false" />
    </AppDialog>

    <AppDialog v-model:open="deleteSkillOpen" role="alertdialog" :title="skill ? `Delete ${skill.name}?` : 'Delete skill?'">
      <DeleteSkillDialog
        v-if="deleteSkillOpen && skill"
        :skill="skill"
        @deleted="onSkillDeleted"
        @cancel="deleteSkillOpen = false"
      />
    </AppDialog>

    <AppDialog v-model:open="deleteSessionOpen" role="alertdialog" title="Delete this session?">
      <ConfirmDestructive
        v-if="deleteSessionOpen && deletingSession"
        confirm-label="Delete session"
        pending-label="Deleting…"
        cancel-label="Keep session"
        :action="() => sessions.remove(deletingSession!)"
        @done="onSessionDeleted"
        @cancel="deleteSessionOpen = false"
      >
        This permanently deletes your {{ describeDeleting(deletingSession) }}. Your totals and streak will update.
      </ConfirmDestructive>
    </AppDialog>
  </div>
</template>
