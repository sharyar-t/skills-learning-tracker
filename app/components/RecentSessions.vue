<script setup lang="ts">
import type { PracticeSession, SkillWithStats } from '#shared/types/domain'

// Read-only peek at the latest sessions; editing and deleting live on /sessions.
defineProps<{
  sessions: PracticeSession[]
  skills: ReadonlyMap<string, SkillWithStats>
  today: string
}>()

const headingId = useId()
</script>

<template>
  <section :aria-labelledby="headingId" class="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
    <div class="flex items-center justify-between gap-4">
      <h2 :id="headingId" class="text-lg font-medium">
        Recent sessions
      </h2>
      <NuxtLink to="/sessions" class="text-sm font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        View all
      </NuxtLink>
    </div>

    <ul v-if="sessions.length" class="mt-4 divide-y divide-border-subtle">
      <li v-for="session in sessions" :key="session.id" class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
        <SkillAvatar :name="skills.get(session.skillId)?.name ?? '?'" :color="skills.get(session.skillId)?.color ?? '#64748B'" size="sm" class="mt-0.5" />
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-baseline gap-x-2">
            <span class="truncate font-medium">{{ skills.get(session.skillId)?.name ?? 'Unknown skill' }}</span>
            <span class="text-text-secondary">{{ formatDuration(session.durationMinutes) }}</span>
          </p>
          <p v-if="session.notes" class="line-clamp-1 text-sm text-text-secondary">
            {{ session.notes }}
          </p>
        </div>
        <p class="shrink-0 text-sm text-text-secondary">
          {{ formatDayHeading(session.date, today) }}
        </p>
      </li>
    </ul>
    <p v-else class="mt-4 text-text-secondary">
      Nothing logged yet. Your latest sessions will show up here.
    </p>
  </section>
</template>
