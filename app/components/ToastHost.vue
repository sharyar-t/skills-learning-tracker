<script setup lang="ts">
import { Check, Flame, X } from '@lucide/vue'
import type { Toast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

// Each toast removes itself after 6s; hovering or focusing it pauses the countdown
const TIMEOUT_MS = 6000
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function start(toast: Toast) {
  stop(toast.id)
  timers.set(toast.id, setTimeout(() => dismiss(toast.id), TIMEOUT_MS))
}

function stop(id: number) {
  clearTimeout(timers.get(id))
  timers.delete(id)
}

watch(toasts, (list) => {
  for (const toast of list) if (!timers.has(toast.id)) start(toast)
}, { deep: true })

onBeforeUnmount(() => timers.forEach(timer => clearTimeout(timer)))
</script>

<template>
  <!-- The live region stays mounted so screen readers announce each toast as it appears -->
  <div
    role="status"
    aria-live="polite"
    class="pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-2"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto flex items-start gap-3 rounded-lg border border-border bg-surface p-3 pr-1 shadow-lg"
      @mouseenter="stop(toast.id)"
      @mouseleave="start(toast)"
      @focusin="stop(toast.id)"
      @focusout="start(toast)"
    >
      <span
        class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full"
        :class="toast.icon === 'flame' ? 'bg-bg-secondary' : 'bg-accent-subtle text-accent-text'"
        aria-hidden="true"
      >
        <Flame v-if="toast.icon === 'flame'" :size="16" class="fill-streak text-streak" />
        <Check v-else :size="16" :stroke-width="3" />
      </span>

      <div class="min-w-0 flex-1 py-0.5">
        <p class="font-medium">
          {{ toast.title }}
        </p>
        <p v-if="toast.detail" class="text-sm text-text-secondary">
          {{ toast.detail }}
        </p>
      </div>

      <button
        type="button"
        class="flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="Dismiss notification"
        @click="dismiss(toast.id)"
      >
        <X :size="16" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
