<script setup lang="ts">
import { Plus, Timer } from '@lucide/vue'
import type { SkillWithStats } from '#shared/types/domain'
import type { GoalProgress } from '#shared/utils/dashboard'

// The hero: the one skill that gets the biggest card. Goal ring when it has a goal,
// otherwise the time logged takes the ring's place — never an empty or broken ring.
const props = withDefaults(defineProps<{
  skill: SkillWithStats
  progress: GoalProgress | null
  today: string
  /** Heading level of the skill name: 2 under the page's h1 (dashboard), 3 inside another section */
  headingLevel?: 2 | 3
  /** Show "Start timer" (only where a timer can actually run, and none is running yet) */
  canStartTimer?: boolean
}>(), { headingLevel: 2, canStartTimer: false })
const emit = defineEmits<{ log: [], timer: [] }>()

const headingId = useId()
const goalCaption = computed(() => {
  const p = props.progress
  if (!p) return null
  const done = `${formatHoursFromMinutes(p.doneMinutes)} of ${p.targetHours} h ${p.type === 'weekly' ? 'this week' : 'in total'}`
  return p.met ? `${done} — goal reached!` : done
})
</script>

<template>
  <section
    :aria-labelledby="headingId"
    class="flex flex-col items-center gap-6 rounded-xl border border-border-subtle bg-surface p-6 shadow-md sm:flex-row sm:p-8 lg:col-span-2"
  >
    <GoalRing
      v-if="progress"
      :skill-name="skill.name"
      :color="skill.color"
      :progress="progress"
      :size="144"
      :stroke-width="12"
    />
    <div
      v-else
      class="flex size-36 shrink-0 flex-col items-center justify-center rounded-full border-[12px] text-center"
      :style="{ borderColor: skill.color }"
    >
      <span class="font-heading text-2xl font-semibold">{{ formatDuration(skill.totalMinutes) }}</span>
      <span class="text-sm text-text-secondary">logged</span>
    </div>

    <div class="min-w-0 flex-1 text-center sm:text-left">
      <p class="text-sm font-medium text-text-secondary">
        Featured skill
      </p>
      <component :is="`h${headingLevel}`" :id="headingId" class="mt-0.5 flex items-center justify-center gap-3 text-2xl font-semibold sm:justify-start">
        <SkillAvatar :name="skill.name" :color="skill.color" size="sm" />
        <NuxtLink :to="`/skills/${skill.id}`" class="truncate hover:underline focus-visible:underline">{{ skill.name }}</NuxtLink>
      </component>

      <p class="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-start">
        <StreakBadge :streak="skill.streak" />
        <span v-if="skill.streak.longest > skill.streak.current" class="text-sm text-text-secondary">
          Best: {{ pluralize(skill.streak.longest, 'day') }}
        </span>
      </p>
      <p v-if="goalCaption" class="mt-1 text-text-secondary">
        {{ goalCaption }}
      </p>

      <dl class="mt-4 flex justify-center gap-8 sm:justify-start">
        <div>
          <dt class="text-sm text-text-secondary">
            Time logged
          </dt>
          <dd class="font-heading text-xl font-semibold">
            {{ formatDuration(skill.totalMinutes) }}
          </dd>
        </div>
        <div>
          <dt class="text-sm text-text-secondary">
            Sessions
          </dt>
          <dd class="font-heading text-xl font-semibold">
            {{ skill.sessionCount }}
          </dd>
        </div>
      </dl>

      <div class="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:justify-start">
        <AppButton @click="emit('log')">
          <Plus :size="20" aria-hidden="true" />
          Log {{ skill.name }}
        </AppButton>
        <AppButton v-if="canStartTimer" variant="secondary" @click="emit('timer')">
          <Timer :size="18" aria-hidden="true" />
          Start timer
        </AppButton>
        <span class="text-sm text-text-secondary">{{ describeLastPractice(skill.lastPracticedOn, today) }}</span>
      </div>
    </div>
  </section>
</template>
