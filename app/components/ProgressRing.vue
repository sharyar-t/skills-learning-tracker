<script setup lang="ts">
// A ring that fills from 0 to `fraction` on mount and animates on every change.
// The value is always also available as text: the `label`/`valueText` for assistive tech,
// and the default slot (centre text) for everyone else.
const props = withDefaults(defineProps<{
  /** 0–1 (clamped) */
  fraction: number
  color: string
  /** Accessible name, e.g. "Spanish weekly goal" */
  label: string
  /** Accessible value, e.g. "3.2 of 5 hours (64%)" */
  valueText: string
  size?: number
  strokeWidth?: number
}>(), { size: 72, strokeWidth: 8 })

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const clamped = computed(() => Math.min(Math.max(props.fraction, 0), 1))

// Start empty so the first paint animates the fill (CSS removes the motion for reduced-motion users)
const shown = ref(0)
onMounted(() => requestAnimationFrame(() => { shown.value = clamped.value }))
watch(clamped, (value) => { shown.value = value })
</script>

<template>
  <div class="relative inline-flex shrink-0 items-center justify-center" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      role="progressbar"
      :aria-label="label"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(clamped * 100)"
      :aria-valuetext="valueText"
    >
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" stroke="var(--color-border-subtle)" :stroke-width="strokeWidth"
      />
      <circle
        :cx="size / 2" :cy="size / 2" :r="radius"
        fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="circumference * (1 - shown)"
        :transform="`rotate(-90 ${size / 2} ${size / 2})`"
        style="transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)"
      />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight" aria-hidden="true">
      <slot />
    </div>
  </div>
</template>
