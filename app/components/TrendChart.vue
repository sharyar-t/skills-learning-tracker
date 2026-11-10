<script setup lang="ts">
import type { DailyTotal } from '#shared/types/domain'

// Hours practiced per week or per month for one skill, as plain bars.
// Accessibility: the bars are decoration — each one carries its full value as hidden text,
// and the buttons that switch the period say which one is selected.
const props = defineProps<{ totals: DailyTotal[], color: string, today: string, skillName: string }>()

const mode = ref<'weekly' | 'monthly'>('weekly')
const headingId = useId()

const buckets = computed(() => (mode.value === 'weekly' ? weeklyTrend(props.totals, props.today) : monthlyTrend(props.totals, props.today)))
const peak = computed(() => Math.max(...buckets.value.map(bucket => bucket.minutes), 1))
const total = computed(() => buckets.value.reduce((sum, bucket) => sum + bucket.minutes, 0))
const periodWord = computed(() => (mode.value === 'weekly' ? 'Week of' : ''))
const rangeText = computed(() => (mode.value === 'weekly' ? `last ${TREND_WEEKS} weeks` : `last ${TREND_MONTHS} months`))

const OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

// Label every bar for months; every other bar for 12 weeks so labels never collide on a phone
const showLabel = (index: number) => mode.value === 'monthly' || (buckets.value.length - 1 - index) % 2 === 0
</script>

<template>
  <section :aria-labelledby="headingId" class="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 :id="headingId" class="text-lg font-medium">
          Trends
        </h2>
        <p class="text-sm text-text-secondary">
          <template v-if="total > 0">
            {{ formatDuration(total) }} in the {{ rangeText }}
          </template>
          <template v-else>
            No practice in the {{ rangeText }}.
          </template>
        </p>
      </div>

      <div role="group" aria-label="Trend period" class="inline-flex rounded-md border border-border-strong p-0.5">
        <button
          v-for="option in OPTIONS"
          :key="option.value"
          type="button"
          class="min-h-10 rounded px-4 text-sm font-medium transition-colors"
          :class="mode === option.value ? 'bg-accent-solid text-on-accent' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'"
          :aria-pressed="mode === option.value"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <ul class="mt-6 flex h-40 items-end gap-1.5 sm:gap-2" :aria-label="`${skillName} hours per ${mode === 'weekly' ? 'week' : 'month'}`">
      <li v-for="(bucket, index) in buckets" :key="bucket.start" class="flex h-full min-w-0 flex-1 flex-col justify-end">
        <span class="sr-only">{{ periodWord }} {{ bucket.label }}: {{ formatDuration(bucket.minutes) }}, {{ pluralize(bucket.sessions, 'session') }}</span>
        <div aria-hidden="true" class="flex min-h-0 flex-1 items-end">
          <div
            class="w-full rounded-t-sm"
            :class="bucket.minutes === 0 ? 'border-b-2 border-border' : ''"
            :style="bucket.minutes > 0 ? { height: `${Math.max((bucket.minutes / peak) * 100, 4)}%`, backgroundColor: color } : { height: '0' }"
            :title="`${bucket.label}: ${formatDuration(bucket.minutes)}`"
          />
        </div>
        <span aria-hidden="true" class="mt-1.5 h-4 truncate text-center text-xs text-text-secondary">{{ showLabel(index) ? bucket.label : '' }}</span>
      </li>
    </ul>
  </section>
</template>
