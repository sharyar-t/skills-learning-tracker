<script setup lang="ts">
// Colour + initial is the skill's visual identity. It's decorative (aria-hidden):
// the skill name is always rendered as text next to it.
const props = withDefaults(defineProps<{
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}>(), { size: 'md' })

const textColor = computed(() => readableTextColor(props.color))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-heading font-semibold"
    :class="{ sm: 'size-8 text-sm', md: 'size-10 text-base', lg: 'size-12 text-lg' }[size]"
    :style="{ backgroundColor: color, color: textColor }"
    aria-hidden="true"
  >
    {{ skillInitial(name) }}
  </span>
</template>
