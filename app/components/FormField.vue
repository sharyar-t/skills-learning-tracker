<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'

const props = withDefaults(defineProps<{
  label: string
  type?: 'text' | 'email' | 'password' | 'date'
  autocomplete?: string
  inputmode?: 'text' | 'decimal' | 'numeric'
  maxlength?: number
  /** Latest allowed value (for `type="date"`) */
  max?: string
  autofocus?: boolean
  error?: string | null
  hint?: string
  required?: boolean
}>(), {
  type: 'text',
  required: true,
})

const model = defineModel<string>({ required: true })

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`

const revealed = ref(false)
const inputType = computed(() => (props.type === 'password' && revealed.value ? 'text' : props.type))
const describedBy = computed(() => [props.error && errorId, props.hint && hintId].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-medium">
      {{ label }}
      <span v-if="!required" class="font-regular text-text-secondary">(optional)</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        v-model="model"
        :type="inputType"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :max="max"
        :autofocus="autofocus"
        :aria-required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :autocapitalize="type === 'email' ? 'none' : undefined"
        :spellcheck="type === 'text' ? undefined : false"
        class="min-h-11 w-full rounded-md border bg-surface px-3 text-base placeholder:text-text-secondary"
        :class="[
          error ? 'border-error' : 'border-border-strong hover:border-text-secondary',
          type === 'password' && 'pr-12',
        ]"
      >

      <button
        v-if="type === 'password'"
        type="button"
        class="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <component :is="revealed ? EyeOff : Eye" :size="20" aria-hidden="true" />
      </button>
    </div>

    <p v-if="hint && !error" :id="hintId" class="mt-1.5 text-sm text-text-secondary">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1.5 text-sm text-error">
      {{ error }}
    </p>
  </div>
</template>
