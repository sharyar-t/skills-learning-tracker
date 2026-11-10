<script setup lang="ts">
import { CalendarDays, Flame, Target, Zap } from '@lucide/vue'

const features = [
  {
    icon: Flame,
    title: 'Streaks that keep you honest',
    text: 'See your current and longest streak for every skill, and overall. A missed day only counts once the day is over — until then, you\'ll see the streak is at risk.',
  },
  {
    icon: Target,
    title: 'Progress you can see',
    text: 'Set a weekly or total-hours goal and watch the ring fill. Skills without a goal still show time logged, sessions and streaks.',
  },
  {
    icon: CalendarDays,
    title: 'A heatmap of your consistency',
    text: 'Months of practice in one glance, filterable by skill. Hover or tap any day for the time, sessions and skills behind it.',
  },
  {
    icon: Zap,
    title: 'Log a session in seconds',
    text: 'Type 45, 1h 30m or 1.5 — it understands. Backfill yesterday, and add notes only when you feel like reflecting.',
  },
]
</script>

<template>
  <section aria-labelledby="features-title" class="py-16 sm:py-20">
    <div class="mx-auto max-w-content px-4 sm:px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="features-title" class="text-2xl font-semibold">
          Built around showing up
        </h2>
        <p class="mt-3 text-text-secondary">
          Learning is a long game and progress is easy to underestimate. Make the invisible work visible.
        </p>
      </div>

      <ul class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="feature in features" :key="feature.title" class="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
          <span class="flex size-11 items-center justify-center rounded-lg bg-accent-subtle text-accent-text">
            <component :is="feature.icon" :size="22" aria-hidden="true" />
          </span>
          <h3 class="mt-4 text-lg font-medium">
            {{ feature.title }}
          </h3>
          <p class="mt-2 text-text-secondary">
            {{ feature.text }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>
