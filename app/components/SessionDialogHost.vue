<script setup lang="ts">
import type { SessionSaved } from '#shared/types/domain'

// Mounted once in the layout. Anything can open it through useSessionDialog().
const dialog = useSessionDialog()
const skills = useSkillsStore()
const toast = useToast()
const guest = useGuest()
const timer = useTimerStore()

const open = computed({
  get: () => dialog.state.value.open,
  set: (isOpen) => { if (!isOpen) dialog.close() },
})

// The form needs the skill list, and the dialog can open on any page — make sure it's loaded
watch(open, (isOpen) => { if (isOpen) skills.ensureLoaded() }, { immediate: true })

function onSaved(result: SessionSaved) {
  const message = sessionToast(result, toISODate())
  // Guests get a single reminder (the first time) that the demo isn't saved
  const hint = guest.consumeHint()
  toast.show(hint ? { ...message, detail: [message.detail, hint].filter(Boolean).join(' · ') } : message)
  // Saved from the timer: it has done its job. (Closing the form instead leaves it paused — nothing is lost.)
  if (dialog.state.value.source === 'timer') timer.finish()
  dialog.close()
}
</script>

<template>
  <AppDialog v-model:open="open" :title="dialog.state.value.session ? 'Edit session' : 'Log a session'">
    <template v-if="open">
      <p v-if="skills.status === 'idle' || skills.status === 'loading'" class="text-text-secondary" role="status">
        Loading your skills…
      </p>

      <div v-else-if="skills.status === 'error'" class="space-y-4">
        <AppAlert>{{ skills.loadError }}</AppAlert>
        <AppButton variant="secondary" @click="skills.load()">
          Try again
        </AppButton>
      </div>

      <div v-else-if="skills.skills.length === 0" class="space-y-4">
        <p class="text-text-secondary">
          Add a skill first, then you can log practice against it.
        </p>
        <AppButton to="/skills" block @click="dialog.close()">
          Add your first skill
        </AppButton>
      </div>

      <SessionForm
        v-else
        :session="dialog.state.value.session"
        :skill-id="dialog.state.value.skillId"
        :prefill="dialog.state.value.prefill"
        @saved="onSaved"
        @cancel="dialog.close()"
      />
    </template>
  </AppDialog>
</template>
