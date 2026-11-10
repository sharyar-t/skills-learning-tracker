<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost'
  /** `lg` is for hero-level calls to action */
  size?: 'md' | 'lg'
  /** Renders a NuxtLink instead of a <button> */
  to?: string
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

// Height and padding come from exactly one place (size, or the compact ghost variant) so classes never fight
const sizing = computed(() => {
  if (props.size === 'lg') return 'min-h-12 px-7 text-lg'
  return props.variant === 'ghost' ? 'min-h-11 px-3 sm:px-4' : 'min-h-11 px-5'
})

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
  sizing.value,
  props.block && 'w-full',
  {
    primary: 'bg-accent-solid text-on-accent hover:bg-accent-solid-hover',
    secondary: 'border border-border bg-surface text-text-primary hover:bg-bg-tertiary',
    ghost: 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary aria-[current=page]:bg-bg-tertiary aria-[current=page]:text-text-primary',
  }[props.variant],
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span
      v-if="loading"
      class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
