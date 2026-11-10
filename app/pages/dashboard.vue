<script setup lang="ts">
import { Plus, Sprout } from '@lucide/vue'

// Signed-in users and demo guests only (see middleware/require-session.ts)
definePageMeta({ middleware: 'require-session' })
useSeoMeta({ title: 'Dashboard — Skills Learning Tracker' })

const skills = useSkillsStore()
const sessions = useSessionsStore()
const sessionDialog = useSessionDialog()
const { isGuest } = useGuest()
const timer = useTimerStore()

// "Today" and every streak depend on the user's local date, so load in the browser only
onMounted(async () => {
  skills.ensureLoaded()
  // The session list may still be filtered from the /sessions page; the dashboard always shows everything
  if (sessions.filterSkillId) await sessions.setFilter(null)
  else sessions.ensureLoaded()
})

const isLoading = computed(() => skills.status === 'idle' || skills.status === 'loading')
const today = computed(() => skills.today)

const progress = computed(() => new Map(skills.skills.map(skill => [
  skill.id,
  skill.goal ? goalProgress(skill.goal, skills.totalsBySkill.get(skill.id) ?? [], today.value) : null,
])))

const featured = computed(() => featuredSkill(skills.skills))

// Everyone else, most recently practiced first
const others = computed(() => skills.skills
  .filter(skill => skill.id !== featured.value?.id)
  .sort((a, b) => (b.lastPracticedOn ?? '').localeCompare(a.lastPracticedOn ?? '') || a.createdAt.localeCompare(b.createdAt)))

const overall = computed(() => overallStreak(skills.dailyTotals, today.value))
const nudge = computed(() => pickNudge(skills.skills, progress.value, today.value))
const recent = computed(() => sessions.items.slice(0, 5))

const dateLabel = computed(() => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()))

function logFor(skillId: string | null) {
  sessionDialog.openLog({ skillId })
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h1 class="text-xl font-semibold">
          Dashboard
        </h1>
        <p class="text-text-secondary">
          {{ dateLabel }}
        </p>
      </div>

      <!-- Overall streak: any practice on a day counts -->
      <p v-if="!isLoading && skills.skills.length" class="flex items-center gap-2 text-sm">
        <span class="text-text-secondary">Overall</span>
        <StreakBadge :streak="overall" />
        <span v-if="overall.longest > overall.current" class="text-text-secondary">· best {{ pluralize(overall.longest, 'day') }}</span>
      </p>
    </header>

    <!-- Loading: skeletons match the final layout, so nothing jumps -->
    <div v-if="isLoading" class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy="true" aria-label="Loading your dashboard">
      <div class="h-64 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary lg:col-span-2" />
      <div class="h-64 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
      <div v-for="n in 3" :key="n" class="h-44 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary" />
      <div class="h-56 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary lg:col-span-3" />
    </div>

    <!-- Error: never a blank screen -->
    <div v-else-if="skills.status === 'error'" class="mt-6 max-w-xl space-y-4">
      <AppAlert>{{ skills.loadError }}</AppAlert>
      <AppButton variant="secondary" @click="skills.load()">
        Try again
      </AppButton>
    </div>

    <!-- New user: a single clear next step -->
    <section
      v-else-if="skills.skills.length === 0"
      class="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center"
    >
      <span class="flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
        <Sprout :size="28" aria-hidden="true" />
      </span>
      <h2 class="mt-4 text-lg font-medium">
        Welcome! Let's start your first streak
      </h2>
      <p class="mt-1 max-w-md text-text-secondary">
        Add a skill you're learning, log a session, and watch your progress, streaks and activity build up here.
      </p>
      <AppButton to="/skills" class="mt-6">
        <Plus :size="20" aria-hidden="true" />
        Add your first skill
      </AppButton>
    </section>

    <!-- The bento grid -->
    <div v-else class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <FeaturedSkillCard
        v-if="featured"
        :skill="featured"
        :progress="progress.get(featured.id) ?? null"
        :today="today"
        :can-start-timer="!timer.state"
        @log="logFor(featured.id)"
        @timer="timer.start(featured.id)"
      />
      <NudgeCard v-if="nudge" :nudge="nudge" @act="logFor" />

      <!-- Only when there's more than the featured skill -->
      <template v-if="others.length">
        <h2 class="text-lg font-medium lg:col-span-3 lg:-mb-2">
          Your skills
        </h2>
        <SkillProgressCard
          v-for="skill in others"
          :key="skill.id"
          :skill="skill"
          :progress="progress.get(skill.id) ?? null"
          :today="today"
          :can-start-timer="!timer.state"
          @log="logFor(skill.id)"
          @timer="timer.start(skill.id)"
        />
      </template>

      <ActivityHeatmap class="lg:col-span-3" :totals="skills.dailyTotals" :skills="skills.skills" :today="today" />

      <RecentSessions
        v-if="sessions.status === 'ready'"
        class="lg:col-span-3"
        :sessions="recent"
        :skills="skills.byId"
        :today="today"
      />
      <div v-else-if="sessions.status !== 'error'" class="h-40 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary lg:col-span-3" aria-hidden="true" />

      <GuestUpsell v-if="isGuest" class="lg:col-span-3" />
    </div>
  </div>
</template>
