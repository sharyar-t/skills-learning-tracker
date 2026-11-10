<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'

// Decorative preview of the product: a skill with its goal ring, streak and recent activity.
// Purely visual (aria-hidden) — the real, interactive version is the showcase right below.
const { featured, progress, totals, today, nudge } = useDemoDashboard()

const goal = computed(() => (featured.value ? progress.value.get(featured.value.id) ?? null : null))
</script>

<template>
  <div v-if="featured" aria-hidden="true" class="relative mx-auto w-full max-w-md lg:max-w-none">
    <div class="rounded-2xl border border-border-subtle bg-surface p-6 shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div class="flex min-w-0 items-center gap-3">
          <SkillAvatar :name="featured.name" :color="featured.color" size="sm" />
          <span class="truncate font-heading text-lg font-semibold">{{ featured.name }}</span>
        </div>
        <StreakBadge :streak="featured.streak" />
      </div>

      <div class="mt-5 flex items-center gap-5">
        <GoalRing v-if="goal" :skill-name="featured.name" :color="featured.color" :progress="goal" :size="104" :stroke-width="10" />
        <div class="min-w-0">
          <p class="font-heading text-2xl font-semibold">
            {{ formatDuration(featured.totalMinutes) }}
          </p>
          <p class="text-sm text-text-secondary">
            logged · {{ pluralize(featured.sessionCount, 'session') }}
          </p>
          <p v-if="goal" class="mt-1 text-sm text-text-secondary">
            {{ formatHoursFromMinutes(goal.doneMinutes) }} of {{ goal.targetHours }} h this week
          </p>
        </div>
      </div>

      <div class="mt-6">
        <p class="mb-2 text-xs font-medium text-text-secondary">
          Last 14 weeks
        </p>
        <div class="overflow-hidden">
          <!-- Cells shrink with the viewport so all 14 weeks (and today, on the right) always fit the card -->
          <MiniHeatmap :totals="totals" :today="today" :weeks="14" cell="clamp(0.75rem, calc((100vw - 7.5rem) / 14), 1.25rem)" />
        </div>
      </div>
    </div>

    <div
      v-if="nudge"
      class="mt-4 flex items-start gap-3 rounded-xl border border-l-4 border-border-subtle bg-surface p-4 shadow-md lg:absolute lg:-bottom-8 lg:-left-10 lg:mt-0 lg:w-72"
      :class="nudge.kind === 'at-risk' ? 'border-l-warning' : 'border-l-accent'"
    >
      <TriangleAlert v-if="nudge.kind === 'at-risk'" :size="20" class="mt-0.5 shrink-0 text-warning-text" />
      <div class="min-w-0">
        <p class="text-xs font-medium text-text-secondary">
          Next up
        </p>
        <p class="text-sm font-medium">
          {{ nudge.title }}
        </p>
      </div>
    </div>
  </div>
</template>
