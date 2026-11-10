<script setup lang="ts">
import { Plus, Timer } from '@lucide/vue'
import type { SkillWithStats } from '#shared/types/domain'
import type { GoalProgress } from '#shared/utils/dashboard'

// Compact skill summary for the dashboard grid: ring when there's a goal, otherwise time + sessions.
const props = withDefaults(defineProps<{ skill: SkillWithStats, progress: GoalProgress | null, today: string, canStartTimer?: boolean }>(), { canStartTimer: false })
const emit = defineEmits<{ log: [], timer: [] }>()

const goalCaption = computed(() => {
  const p = props.progress
  if (!p) return null
  return `${formatHoursFromMinutes(p.doneMinutes)} / ${p.targetHours} h ${p.type === 'weekly' ? 'this week' : 'total'}`
})
</script>

<template>
  <article class="flex h-full flex-col rounded-xl border border-border-subtle bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
    <header class="flex items-center gap-3">
      <SkillAvatar :name="skill.name" :color="skill.color" size="sm" />
      <h3 class="min-w-0 flex-1 truncate text-lg font-medium" :title="skill.name">
        <NuxtLink :to="`/skills/${skill.id}`" class="hover:underline focus-visible:underline">
          {{ skill.name }}
        </NuxtLink>
      </h3>
    </header>

    <div class="mt-4 mb-4 flex items-center gap-4">
      <GoalRing v-if="progress" :skill-name="skill.name" :color="skill.color" :progress="progress" />
      <div class="min-w-0">
        <p v-if="goalCaption" class="font-heading text-lg font-semibold">
          {{ goalCaption }}
        </p>
        <p v-else class="font-heading text-lg font-semibold">
          {{ formatDuration(skill.totalMinutes) }}
        </p>
        <p class="text-sm text-text-secondary">
          {{ progress ? `${formatDuration(skill.totalMinutes)} logged · ` : '' }}{{ pluralize(skill.sessionCount, 'session') }}
        </p>
      </div>
    </div>

    <div class="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-3 text-sm">
      <StreakBadge :streak="skill.streak" />
      <div class="flex gap-2">
        <button
          v-if="canStartTimer"
          type="button"
          class="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-primary transition-colors hover:bg-bg-tertiary"
          :aria-label="`Start a timer for ${skill.name}`"
          @click="emit('timer')"
        >
          <Timer :size="18" aria-hidden="true" />
        </button>
        <AppButton variant="secondary" class="px-3!" :aria-label="`Log a session for ${skill.name}`" @click="emit('log')">
          <Plus :size="16" aria-hidden="true" />
          Log
        </AppButton>
      </div>
    </div>
  </article>
</template>
