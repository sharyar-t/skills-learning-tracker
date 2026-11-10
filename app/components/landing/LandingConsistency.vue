<script setup lang="ts">
import { Check } from '@lucide/vue'

// The interactive heatmap on sample data. 14 weeks (about 3 months) is what the sample actually covers.
const { skills, totals, today } = useDemoDashboard()

const points = [
  'Every day is a square — darker means more practice',
  'Filter to a single skill, or see everything together',
  'Hover, tap, or use the arrow keys: each day spells out exactly what you did',
]
</script>

<template>
  <section aria-labelledby="consistency-title" class="border-t border-border-subtle bg-bg-secondary py-16 sm:py-20">
    <div class="mx-auto grid max-w-content grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-14">
      <div class="lg:col-span-2">
        <h2 id="consistency-title" class="text-2xl font-semibold">
          Consistency, visualized
        </h2>
        <p class="mt-3 text-text-secondary">
          The gap between "I've been practicing" and "I can see how much I've practiced" is where motivation dies.
          The heatmap closes it.
        </p>
        <ul class="mt-6 space-y-3">
          <li v-for="point in points" :key="point" class="flex gap-3">
            <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
              <Check :size="14" :stroke-width="3" aria-hidden="true" />
            </span>
            <span>{{ point }}</span>
          </li>
        </ul>
      </div>

      <ActivityHeatmap class="lg:col-span-3" :heading-level="3" :totals="totals" :skills="skills" :today="today" :weeks="14" />
    </div>
  </section>
</template>
