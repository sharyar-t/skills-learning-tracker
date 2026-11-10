<script setup lang="ts">
import { CircleCheck, Clock, Sparkles, Target, TriangleAlert } from '@lucide/vue'
import type { Nudge, NudgeKind } from '#shared/utils/dashboard'

// "What to practice next". Urgency is carried by the icon and the wording, with the
// accent border as reinforcement only.
withDefaults(defineProps<{ nudge: Nudge, headingLevel?: 2 | 3 }>(), { headingLevel: 2 })
const emit = defineEmits<{ act: [skillId: string] }>()

const ICONS: Record<NudgeKind, Component> = {
  'at-risk': TriangleAlert,
  'behind': Target,
  'idle': Clock,
  'first': Sparkles,
  'on-track': CircleCheck,
}
const BORDERS: Record<NudgeKind, string> = {
  'at-risk': 'border-l-warning',
  'behind': 'border-l-warning',
  'idle': 'border-l-border',
  'first': 'border-l-accent',
  'on-track': 'border-l-success',
}
const ICON_COLORS: Record<NudgeKind, string> = {
  'at-risk': 'text-warning-text',
  'behind': 'text-warning-text',
  'idle': 'text-text-secondary',
  'first': 'text-accent-text',
  'on-track': 'text-success',
}

const headingId = useId()
</script>

<template>
  <section
    :aria-labelledby="headingId"
    class="flex flex-col rounded-xl border border-l-4 border-border-subtle bg-surface p-6 shadow-sm"
    :class="BORDERS[nudge.kind]"
  >
    <p class="flex items-center gap-2 text-sm font-medium text-text-secondary">
      <component :is="ICONS[nudge.kind]" :size="18" :class="ICON_COLORS[nudge.kind]" aria-hidden="true" />
      Next up
    </p>
    <component :is="`h${headingLevel}`" :id="headingId" class="mt-2 text-lg font-medium">
      {{ nudge.title }}
    </component>
    <p class="mt-1 text-text-secondary">
      {{ nudge.body }}
    </p>
    <AppButton v-if="nudge.cta && nudge.skillId" class="mt-5 self-start" @click="emit('act', nudge.skillId)">
      {{ nudge.cta }}
    </AppButton>
  </section>
</template>
