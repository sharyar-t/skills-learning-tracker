<script setup lang="ts">
// Body of a delete confirmation, rendered inside <AppDialog role="alertdialog">.
// Focus starts on the safe "keep" button; the destructive button shows progress and surfaces failures.
const props = defineProps<{
  confirmLabel: string
  pendingLabel: string
  cancelLabel: string
  action: () => Promise<{ error: string | null }>
}>()
const emit = defineEmits<{ done: [], cancel: [] }>()

const pending = ref(false)
const error = ref<string | null>(null)

async function confirm() {
  error.value = null
  pending.value = true
  const result = await props.action()
  pending.value = false

  if (result.error) {
    error.value = result.error
    return
  }
  emit('done')
}
</script>

<template>
  <div class="space-y-4">
    <AppAlert v-if="error">
      {{ error }}
    </AppAlert>

    <p class="text-text-secondary">
      <slot />
    </p>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <AppButton variant="secondary" autofocus @click="emit('cancel')">
        {{ cancelLabel }}
      </AppButton>
      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-error px-5 font-semibold text-white transition-colors hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60 dark:text-bg-primary"
        :disabled="pending"
        :aria-busy="pending || undefined"
        @click="confirm"
      >
        <span
          v-if="pending"
          class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
        {{ pending ? pendingLabel : confirmLabel }}
      </button>
    </div>
  </div>
</template>
