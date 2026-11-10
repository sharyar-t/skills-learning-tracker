<script setup lang="ts">
import { Flame, TriangleAlert } from '@lucide/vue'
import type { StreakInfo } from '#shared/types/domain'

// Status is carried by icon + wording, not colour alone:
//   active  → flame + "8-day streak"
//   at risk → warning triangle + "3-day streak · practice today to keep it"
//   none    → dimmed flame + "No active streak"
const props = defineProps<{ streak: StreakInfo }>()

const label = computed(() => {
  const { current, status } = props.streak
  if (status === 'none') return 'No active streak'
  return `${current}-day streak`
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5" :class="streak.status === 'none' ? 'text-text-secondary' : 'text-text-primary'">
    <TriangleAlert v-if="streak.status === 'at-risk'" :size="16" class="shrink-0 text-warning" aria-hidden="true" />
    <Flame
      v-else
      :size="16"
      class="shrink-0"
      :class="streak.status === 'active' ? 'fill-streak text-streak' : 'text-text-tertiary'"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
    <span v-if="streak.status === 'at-risk'" class="text-warning-text">· at risk</span>
  </span>
</template>
