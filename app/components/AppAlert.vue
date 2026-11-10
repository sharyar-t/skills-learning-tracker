<script setup lang="ts">
import { CircleAlert, CircleCheck, TriangleAlert } from '@lucide/vue'

// Icon + text + border carry the meaning, never colour alone.
// Error and warning use role="alert" (assertive); success uses role="status" (polite).
withDefaults(defineProps<{ variant?: 'error' | 'warning' | 'success' }>(), { variant: 'error' })

const ICONS = { error: CircleAlert, warning: TriangleAlert, success: CircleCheck }
const BORDERS = { error: 'border-error', warning: 'border-warning', success: 'border-success' }
const ICON_COLORS = { error: 'text-error', warning: 'text-warning-text', success: 'text-success' }
</script>

<template>
  <div
    :role="variant === 'success' ? 'status' : 'alert'"
    class="flex gap-3 rounded-md border bg-bg-secondary p-3 text-sm text-text-primary"
    :class="BORDERS[variant]"
  >
    <component :is="ICONS[variant]" :size="20" class="mt-0.5 shrink-0" :class="ICON_COLORS[variant]" aria-hidden="true" />
    <div><slot /></div>
  </div>
</template>
