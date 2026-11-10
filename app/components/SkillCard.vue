<script setup lang="ts">
import { Pencil, Plus, Target, Timer, Trash2 } from '@lucide/vue'
import type { SkillWithStats } from '#shared/types/domain'

withDefaults(defineProps<{ skill: SkillWithStats, canStartTimer?: boolean }>(), { canStartTimer: false })
const emit = defineEmits<{ edit: [], delete: [], log: [], timer: [] }>()
</script>

<template>
  <article class="flex flex-col rounded-xl border border-border-subtle bg-surface p-5 shadow-sm">
    <header class="flex items-start gap-3">
      <SkillAvatar :name="skill.name" :color="skill.color" />

      <div class="min-w-0 flex-1">
        <h2 class="truncate text-lg font-medium" :title="skill.name">
          <NuxtLink :to="`/skills/${skill.id}`" class="hover:underline focus-visible:underline">
            {{ skill.name }}
          </NuxtLink>
        </h2>
        <p v-if="skill.goal" class="mt-0.5 flex items-center gap-1.5 text-sm text-text-secondary">
          <Target :size="16" class="shrink-0" aria-hidden="true" />
          <span><span class="sr-only">Goal: </span>{{ formatGoal(skill.goal) }}</span>
        </p>
      </div>

      <div class="-mt-1 -mr-2 flex shrink-0">
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          :aria-label="`Edit ${skill.name}`"
          @click="emit('edit')"
        >
          <Pencil :size="18" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-error"
          :aria-label="`Delete ${skill.name}`"
          @click="emit('delete')"
        >
          <Trash2 :size="18" aria-hidden="true" />
        </button>
      </div>
    </header>

    <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
      <div>
        <dt class="text-sm text-text-secondary">
          Time logged
        </dt>
        <dd class="font-heading text-xl font-semibold">
          {{ formatDuration(skill.totalMinutes) }}
        </dd>
      </div>
      <div>
        <dt class="text-sm text-text-secondary">
          Sessions
        </dt>
        <dd class="font-heading text-xl font-semibold">
          {{ skill.sessionCount }}
        </dd>
      </div>
    </dl>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border-subtle pt-3 text-sm">
      <StreakBadge :streak="skill.streak" />
      <div class="flex gap-2">
        <button
          v-if="canStartTimer"
          type="button"
          class="flex size-11 items-center justify-center rounded-md border border-border bg-surface text-text-primary transition-colors hover:bg-bg-tertiary"
          :aria-label="`Start a timer for ${skill.name}`"
          @click="emit('timer')"
        >
          <Timer :size="18" aria-hidden="true" />
        </button>
        <AppButton variant="secondary" class="px-3!" :aria-label="`Log a session for ${skill.name}`" @click="emit('log')">
          <Plus :size="16" aria-hidden="true" />
          Log session
        </AppButton>
      </div>
    </div>
  </article>
</template>
