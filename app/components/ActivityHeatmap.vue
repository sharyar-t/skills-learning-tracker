<script setup lang="ts">
import type { DailyTotal, Skill } from '#shared/types/domain'

// Six months of practice, one square per day (columns are weeks, Monday first).
//
// Accessibility: every square is a button whose name spells out the day ("Mon, Mar 16: 1h 15m in
// 2 sessions — Spanish 45m, Guitar 30m"), so colour never carries information alone. Only one
// square is in the tab order; arrow keys move between days (roving tabindex).
const props = withDefaults(defineProps<{ totals: DailyTotal[], skills: Skill[], today: string, weeks?: number, headingLevel?: 2 | 3 }>(), { weeks: HEATMAP_WEEKS, headingLevel: 2 })

// 27 weeks → "6 months", 14 weeks → "3 months"
const periodLabel = computed(() => (props.weeks < 8 ? pluralize(props.weeks, 'week') : `${Math.round(props.weeks / 4.35)} months`))

const filter = ref<string | null>(null)
watch(() => props.skills, (list) => {
  if (filter.value && !list.some(skill => skill.id === filter.value)) filter.value = null
})

const columns = computed(() => buildHeatmapColumns(props.today, props.weeks))
const activity = computed(() => aggregateDays(props.totals, filter.value))
const summary = computed(() => summarizeWindow(activity.value, props.today, props.weeks))
const names = computed(() => new Map(props.skills.map(skill => [skill.id, skill.name])))
const nameOf = (id: string) => names.value.get(id) ?? 'Unknown skill'

// Level 0 gets a hairline: the brand's empty colour is almost the card colour, especially in dark mode
const LEVEL_CLASSES = ['bg-heatmap-empty ring-1 ring-inset ring-border-subtle', 'bg-heatmap-light', 'bg-heatmap-medium', 'bg-heatmap-heavy'] as const
const LEGEND = ['No practice', 'Under 30 minutes', '30 to 60 minutes', 'Over an hour']

const labelFor = (date: string) => describeDay(date, props.today, activity.value.get(date), nameOf)
const levelFor = (date: string) => heatLevel(activity.value.get(date)?.minutes ?? 0)

const headingId = useId()
const filterId = useId()
const rootEl = useTemplateRef<HTMLElement>('rootEl')
const scrollerEl = useTemplateRef<HTMLElement>('scrollerEl')

// Most recent weeks are on the right — start scrolled there on narrow screens
onMounted(() => {
  if (scrollerEl.value) scrollerEl.value.scrollLeft = scrollerEl.value.scrollWidth
})

// --- Keyboard: roving tabindex ---------------------------------------------------------------
const firstDate = computed(() => columns.value[0]!.cells[0]!.date)
const focusedDate = ref(props.today)
const cellEls = new Map<string, HTMLElement>()

function setCell(date: string, el: unknown) {
  if (el instanceof HTMLElement) cellEls.set(date, el)
  else cellEls.delete(date)
}

const ARROWS: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }

function onKeydown(event: KeyboardEvent, date: string) {
  if (event.key === 'Escape') return hide(true)
  const delta = ARROWS[event.key]
  if (delta === undefined) return
  event.preventDefault()
  const next = shiftDate(date, delta)
  if (next < firstDate.value || next > props.today) return
  focusedDate.value = next
  nextTick(() => cellEls.get(next)?.focus())
}

// --- Tooltip: hover, focus or tap (tap keeps it open until you tap elsewhere) -----------------
const activeDate = ref<string | null>(null)
const pinned = ref(false)
const position = ref({ x: 0, y: 0 })

function show(date: string) {
  activeDate.value = date
  const cell = cellEls.get(date)
  const root = rootEl.value
  if (!cell || !root) return
  // Measured against the card, not the scroller: the scroller would clip a tooltip that rises above the grid
  const cellRect = cell.getBoundingClientRect()
  const rootRect = root.getBoundingClientRect()
  const half = 120 // the tooltip is up to ~240px wide: keep it inside the card
  const x = Math.min(Math.max(cellRect.left - rootRect.left + cellRect.width / 2, half), Math.max(rootRect.width - half, half))
  position.value = { x, y: cellRect.top - rootRect.top }
}

function hide(force = false) {
  if (pinned.value && !force) return
  activeDate.value = null
  pinned.value = false
}

function onPress(date: string) {
  pinned.value = true
  show(date)
}

onClickOutside(rootEl, () => hide(true))

const tooltip = computed(() => {
  const date = activeDate.value
  if (!date) return null
  return { label: formatDayHeading(date, props.today), activity: activity.value.get(date) }
})
</script>

<template>
  <section ref="rootEl" :aria-labelledby="headingId" class="relative rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <component :is="`h${headingLevel}`" :id="headingId" class="text-lg font-medium">
          Activity
        </component>
        <p class="text-sm text-text-secondary">
          <template v-if="summary.sessions">
            {{ pluralize(summary.sessions, 'session') }} · {{ formatDuration(summary.minutes) }} ·
            {{ pluralize(summary.activeDays, 'active day') }} in the last {{ periodLabel }}
          </template>
          <template v-else>
            Your last {{ periodLabel }} of practice will fill in here as you log sessions.
          </template>
        </p>
      </div>

      <div v-if="skills.length > 1" class="flex items-center gap-2">
        <label :for="filterId" class="text-sm text-text-secondary">Show</label>
        <select
          :id="filterId"
          v-model="filter"
          class="min-h-11 max-w-48 rounded-md border border-border-strong bg-surface px-3 text-base hover:border-text-secondary"
        >
          <option :value="null">
            All skills
          </option>
          <option v-for="skill in skills" :key="skill.id" :value="skill.id">
            {{ skill.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="mt-5 flex gap-2 [--cell:1.25rem] sm:[--cell:1.5rem] lg:[--cell:1.75rem]">
      <!-- Weekday labels stay put while the grid scrolls (cells carry full dates for assistive tech) -->
      <div aria-hidden="true" class="grid shrink-0 gap-1 pt-[calc(1.25rem+0.25rem)] text-xs text-text-secondary" style="grid-template-rows: repeat(7, var(--cell))">
        <span v-for="(day, index) in ['Mon', '', 'Wed', '', 'Fri', '', '']" :key="index" class="flex items-center">{{ day }}</span>
      </div>

      <div ref="scrollerEl" class="min-w-0 flex-1 overflow-x-auto pb-2" @scroll.passive="activeDate && show(activeDate)">
        <div
          role="group"
          :aria-label="`Activity heatmap for the last ${periodLabel}. Use the arrow keys to move between days.`"
          class="relative w-max"
        >
          <!-- Month labels -->
          <div aria-hidden="true" class="grid h-5 gap-1 text-xs text-text-secondary" :style="{ gridTemplateColumns: `repeat(${columns.length}, var(--cell))` }">
            <span v-for="(column, index) in columns" :key="index" class="whitespace-nowrap">{{ column.monthLabel }}</span>
          </div>

          <!-- Days -->
          <div
            class="mt-1 grid grid-flow-col gap-1"
            :style="{ gridTemplateRows: 'repeat(7, var(--cell))', gridAutoColumns: 'var(--cell)' }"
          >
            <template v-for="column in columns" :key="column.cells[0]!.date">
              <template v-for="cell in column.cells" :key="cell.date">
                <!-- Future days: empty and dimmed, not interactive -->
                <div v-if="cell.isFuture" aria-hidden="true" class="size-full rounded-sm border border-dashed border-border opacity-60" />
                <button
                  v-else
                  :ref="(el) => setCell(cell.date, el)"
                  type="button"
                  class="size-full rounded-sm"
                  :class="[LEVEL_CLASSES[levelFor(cell.date)], cell.isToday && 'ring-2 ring-text-primary ring-offset-1 ring-offset-surface']"
                  :tabindex="cell.date === focusedDate ? 0 : -1"
                  :aria-label="labelFor(cell.date)"
                  @focus="focusedDate = cell.date; show(cell.date)"
                  @blur="hide()"
                  @mouseenter="show(cell.date)"
                  @mouseleave="hide()"
                  @click="onPress(cell.date)"
                  @keydown="onKeydown($event, cell.date)"
                />
              </template>
            </template>
          </div>

        </div>
      </div>
    </div>

    <!-- Tooltip: visual aid only — each cell already has the full text as its name -->
    <div
      v-if="tooltip"
      aria-hidden="true"
      class="pointer-events-none absolute z-10 w-max max-w-60 rounded-md bg-text-primary px-3 py-2 text-xs text-bg-primary shadow-lg"
      :style="{ left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-50%, calc(-100% - 0.5rem))' }"
    >
      <p class="font-semibold">
        {{ tooltip.label }}
      </p>
      <template v-if="tooltip.activity">
        <p>{{ formatDuration(tooltip.activity.minutes) }} · {{ pluralize(tooltip.activity.sessions, 'session') }}</p>
        <ul class="mt-1 space-y-0.5">
          <li v-for="entry in tooltip.activity.skills" :key="entry.skillId">
            {{ nameOf(entry.skillId) }} · {{ formatDuration(entry.minutes) }}
          </li>
        </ul>
      </template>
      <p v-else>
        No practice
      </p>
    </div>

    <!-- Legend -->
    <div class="mt-3 flex items-center justify-end gap-2 text-xs text-text-secondary">
      <span>Less</span>
      <ul class="flex gap-1">
        <li v-for="(label, level) in LEGEND" :key="label" class="size-3.5 rounded-sm" :class="LEVEL_CLASSES[level]" :title="label" />
      </ul>
      <span>More</span>
    </div>
  </section>
</template>
