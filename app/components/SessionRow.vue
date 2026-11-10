<script setup lang="ts">
import { Pencil, Trash2 } from '@lucide/vue'
import type { PracticeSession, SkillWithStats } from '#shared/types/domain'

defineProps<{ session: PracticeSession, skill?: SkillWithStats }>()
const emit = defineEmits<{ edit: [], delete: [] }>()
</script>

<template>
  <article class="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface p-3 pr-1">
    <SkillAvatar :name="skill?.name ?? '?'" :color="skill?.color ?? '#64748B'" size="sm" class="mt-0.5" />

    <div class="min-w-0 flex-1">
      <h3 class="flex flex-wrap items-baseline gap-x-2">
        <span class="truncate font-medium">{{ skill?.name ?? 'Unknown skill' }}</span>
        <span class="text-text-secondary">{{ formatDuration(session.durationMinutes) }}</span>
      </h3>
      <!-- No notes → no empty block -->
      <p v-if="session.notes" class="mt-1 line-clamp-2 text-sm whitespace-pre-line text-text-secondary">
        {{ session.notes }}
      </p>
    </div>

    <div class="flex shrink-0">
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
        :aria-label="`Edit ${formatDuration(session.durationMinutes)} ${skill?.name ?? ''} session`"
        @click="emit('edit')"
      >
        <Pencil :size="18" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-error"
        :aria-label="`Delete ${formatDuration(session.durationMinutes)} ${skill?.name ?? ''} session`"
        @click="emit('delete')"
      >
        <Trash2 :size="18" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>
