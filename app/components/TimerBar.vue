<script setup lang="ts">
import { Pause, Play, Square, X } from '@lucide/vue'

// The persistent timer indicator: part of the sticky header, so it is visible on every page for as
// long as a timer exists. State is carried by wording and icons ("timer running" / "timer paused"),
// and the clock is a role="timer" — screen readers can read it on demand without hearing every tick.
const timer = useTimerStore()
const skills = useSkillsStore()
const sessionDialog = useSessionDialog()

// The bar shows the skill's name, wherever in the app the timer is restored
watch(() => !!timer.state, (exists) => {
  if (exists && import.meta.client) skills.ensureLoaded()
}, { immediate: true })

const skill = computed(() => (timer.state ? skills.byId.get(timer.state.skillId) : undefined))
const discardOpen = ref(false)

/** Stop = pause and open the log form with the timed duration. Closing the form keeps the timer (paused). */
function stopAndLog() {
  const current = timer.state
  if (!current) return
  timer.pause()
  sessionDialog.openLog({
    skillId: skill.value ? current.skillId : null,
    prefill: { minutes: timer.minutes, date: current.startedOn },
    source: 'timer',
  })
}

async function discard() {
  timer.discard()
  return { error: null }
}
</script>

<template>
  <div v-if="timer.state" role="region" aria-label="Practice timer" class="border-t border-border-subtle bg-accent-subtle">
    <div class="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-1.5 sm:px-6">
      <p class="flex min-w-0 items-center gap-2">
        <span v-if="timer.isRunning" class="relative flex size-2.5 shrink-0" aria-hidden="true">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span class="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>
        <Pause v-else :size="16" class="shrink-0 text-text-secondary" aria-hidden="true" />
        <span class="truncate font-medium">{{ skill?.name ?? 'Practice' }}</span>
        <span class="shrink-0 text-sm text-text-secondary">{{ timer.isRunning ? 'timer running' : 'timer paused' }}</span>
      </p>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <p role="timer" aria-label="Elapsed practice time" class="font-heading text-xl font-semibold tabular-nums">
          {{ formatElapsed(timer.elapsed) }}
        </p>
        <AppButton variant="secondary" @click="timer.isRunning ? timer.pause() : timer.resume()">
          <component :is="timer.isRunning ? Pause : Play" :size="18" aria-hidden="true" />
          <span class="sr-only sm:not-sr-only">{{ timer.isRunning ? 'Pause' : 'Resume' }}</span>
        </AppButton>
        <AppButton @click="stopAndLog">
          <Square :size="16" aria-hidden="true" />
          Stop &amp; log
        </AppButton>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Discard timer"
          @click="discardOpen = true"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>
    </div>

    <p class="sr-only" role="status">
      {{ timer.announcement }}
    </p>

    <AppDialog v-model:open="discardOpen" role="alertdialog" title="Discard this timer?">
      <ConfirmDestructive
        v-if="discardOpen"
        confirm-label="Discard timer"
        pending-label="Discarding…"
        cancel-label="Keep timer"
        :action="discard"
        @done="discardOpen = false"
        @cancel="discardOpen = false"
      >
        {{ formatElapsed(timer.elapsed) }} of practice won't be logged. To keep it, choose "Stop &amp; log" instead.
      </ConfirmDestructive>
    </AppDialog>
  </div>
</template>
