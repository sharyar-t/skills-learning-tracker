<script setup lang="ts">
import type { DailyTotal } from '#shared/types/domain'

// A small, static, decorative activity strip (all skills combined). The interactive,
// accessible version is ActivityHeatmap — this one is only ever shown inside aria-hidden previews.
const props = withDefaults(defineProps<{ totals: DailyTotal[], today: string, weeks?: number, cell?: string }>(), { weeks: 12, cell: '0.875rem' })

const columns = computed(() => buildHeatmapColumns(props.today, props.weeks))
const days = computed(() => aggregateDays(props.totals))

const LEVELS = ['bg-heatmap-empty ring-1 ring-inset ring-border-subtle', 'bg-heatmap-light', 'bg-heatmap-medium', 'bg-heatmap-heavy'] as const
</script>

<template>
  <div class="grid grid-flow-col gap-[3px]" :style="{ gridTemplateRows: `repeat(7, ${cell})`, gridAutoColumns: cell }">
    <template v-for="column in columns" :key="column.cells[0]!.date">
      <div
        v-for="cell in column.cells"
        :key="cell.date"
        class="rounded-[3px]"
        :class="cell.isFuture ? 'border border-dashed border-border opacity-60' : LEVELS[heatLevel(days.get(cell.date)?.minutes ?? 0)]"
      />
    </template>
  </div>
</template>
