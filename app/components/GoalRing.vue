<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { GoalProgress } from '#shared/utils/dashboard'

// A skill's goal as a ring: percentage in the middle, and a caption with the real numbers.
const props = withDefaults(defineProps<{
  skillName: string
  color: string
  progress: GoalProgress
  size?: number
  strokeWidth?: number
}>(), { size: 72, strokeWidth: 8 })

const period = computed(() => (props.progress.type === 'weekly' ? 'this week' : 'in total'))
const caption = computed(() => `${formatHoursFromMinutes(props.progress.doneMinutes)} of ${props.progress.targetHours} h ${period.value}`)
const big = computed(() => props.size >= 100)
</script>

<template>
  <ProgressRing
    :fraction="progress.fraction"
    :color="color"
    :size="size"
    :stroke-width="strokeWidth"
    :label="`${skillName} ${progress.type} goal`"
    :value-text="`${caption} (${progress.percent}%)`"
  >
    <Check v-if="progress.met" :size="big ? 36 : 24" :stroke-width="3" class="text-success" />
    <span v-else class="font-heading font-semibold" :class="big ? 'text-2xl' : 'text-base'">{{ progress.percent }}%</span>
  </ProgressRing>
</template>
