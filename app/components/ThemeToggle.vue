<script setup lang="ts">
import { Monitor, Moon, Sun } from '@lucide/vue'

// Three states, all visible at once: System (follow the OS), Light, Dark.
// Native radio buttons — arrow keys, focus and screen-reader state come for free.
const { preference, set } = useTheme()

const options = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

const name = useId()
</script>

<template>
  <fieldset class="m-0 shrink-0 gap-0.5 rounded-lg border border-border bg-bg-secondary p-0.5">
    <legend class="sr-only">
      Theme
    </legend>
    <div class="flex gap-0.5">
      <label v-for="option in options" :key="option.value" class="relative cursor-pointer">
        <input
          type="radio"
          :name="name"
          :value="option.value"
          :checked="preference === option.value"
          class="peer sr-only"
          @change="set(option.value)"
        >
        <span
          class="flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary peer-checked:bg-accent-subtle peer-checked:text-accent-text peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent sm:size-8"
        >
          <component :is="option.icon" :size="18" aria-hidden="true" />
          <span class="sr-only">{{ option.label }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
