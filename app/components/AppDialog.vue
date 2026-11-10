<script setup lang="ts">
import { X } from '@lucide/vue'

// Native <dialog>: showModal() gives us the focus trap, Esc to close, inert background and
// focus return to the opener for free. Use role="alertdialog" for destructive confirmations.
withDefaults(defineProps<{
  title: string
  description?: string
  role?: 'dialog' | 'alertdialog'
}>(), { role: 'dialog' })

const open = defineModel<boolean>('open', { required: true })

const dialogEl = useTemplateRef<HTMLDialogElement>('dialogEl')
const titleId = useId()
const descriptionId = useId()

watch(open, (isOpen) => {
  const dialog = dialogEl.value
  if (!dialog) return
  if (isOpen && !dialog.open) dialog.showModal()
  else if (!isOpen && dialog.open) dialog.close()
}, { flush: 'post' })

onMounted(() => {
  if (open.value) dialogEl.value?.showModal()
})

// Fires for Esc as well as for our own close()
function onClose() {
  open.value = false
}

// Clicks on the backdrop target the <dialog> itself (the panel inside fills it completely)
function onClick(event: MouseEvent) {
  if (event.target === dialogEl.value) open.value = false
}
</script>

<template>
  <dialog
    ref="dialogEl"
    :role="role"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
    class="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md rounded-xl border border-border-subtle bg-surface p-0 text-text-primary shadow-lg backdrop:bg-black/50"
    @close="onClose"
    @click="onClick"
  >
    <div class="p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h2 :id="titleId" class="text-xl font-semibold">
          {{ title }}
        </h2>
        <button
          type="button"
          class="-mt-2 -mr-3 flex size-11 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Close dialog"
          @click="open = false"
        >
          <X :size="20" aria-hidden="true" />
        </button>
      </div>
      <p v-if="description" :id="descriptionId" class="mt-2 text-text-secondary">
        {{ description }}
      </p>

      <div class="mt-6">
        <slot />
      </div>
    </div>
  </dialog>
</template>
