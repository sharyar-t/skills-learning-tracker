<script setup lang="ts">
import { NotebookPen, Plus } from '@lucide/vue'
import type { PracticeSession } from '#shared/types/domain'

// Signed-in users and demo guests only (see middleware/require-session.ts)
definePageMeta({ middleware: 'require-session' })
useSeoMeta({ title: 'Sessions — Skills Learning Tracker' })

const skills = useSkillsStore()
const sessions = useSessionsStore()
const sessionDialog = useSessionDialog()
const toast = useToast()

// Dates depend on the user's local day, so load in the browser only
onMounted(() => {
  skills.ensureLoaded()
  sessions.ensureLoaded()
})

const filterId = useId()
const deleteOpen = ref(false)
const deleting = ref<PracticeSession | null>(null)

const isLoading = computed(() => sessions.status === 'idle' || sessions.status === 'loading' || skills.status === 'idle' || skills.status === 'loading')

// Group the newest-first list by practice day
const groups = computed(() => {
  const today = skills.today
  const result: { date: string, label: string, items: PracticeSession[] }[] = []
  for (const session of sessions.items) {
    const last = result.at(-1)
    if (last?.date === session.date) last.items.push(session)
    else result.push({ date: session.date, label: formatDayHeading(session.date, today), items: [session] })
  }
  return result
})

function openDelete(session: PracticeSession) {
  deleting.value = session
  deleteOpen.value = true
}

function onDeleted() {
  toast.show({ title: 'Session deleted', icon: 'check' })
  deleteOpen.value = false
}

function describeDeleting(session: PracticeSession) {
  const skill = skills.byId.get(session.skillId)
  return `${formatDuration(session.durationMinutes)} ${skill?.name ?? ''} session from ${formatDayInSentence(session.date, skills.today)}`
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">
          Sessions
        </h1>
        <p class="text-text-secondary">
          Everything you've practiced, newest first.
        </p>
      </div>

      <div v-if="skills.skills.length" class="flex items-center gap-2">
        <label :for="filterId" class="sr-only">Filter by skill</label>
        <select
          :id="filterId"
          class="min-h-11 max-w-48 rounded-md border border-border-strong bg-surface px-3 text-base hover:border-text-secondary"
          :value="sessions.filterSkillId ?? ''"
          @change="sessions.setFilter(($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">
            All skills
          </option>
          <option v-for="skill in skills.skills" :key="skill.id" :value="skill.id">
            {{ skill.name }}
          </option>
        </select>
        <AppButton @click="sessionDialog.openLog({ skillId: sessions.filterSkillId })">
          <Plus :size="20" aria-hidden="true" />
          Log session
        </AppButton>
      </div>
    </header>

    <!-- Loading: skeleton rows keep the layout stable -->
    <div v-if="isLoading" class="mt-6 space-y-3" aria-busy="true" aria-label="Loading your sessions">
      <div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-lg border border-border-subtle bg-bg-secondary" />
    </div>

    <!-- Errors: never a blank screen -->
    <div v-else-if="sessions.status === 'error' || skills.status === 'error'" class="mt-6 max-w-xl space-y-4">
      <AppAlert>{{ sessions.loadError ?? skills.loadError }}</AppAlert>
      <AppButton variant="secondary" @click="skills.ensureLoaded(); sessions.ensureLoaded()">
        Try again
      </AppButton>
    </div>

    <!-- No skills at all -->
    <section
      v-else-if="skills.skills.length === 0"
      class="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <h2 class="text-lg font-medium">
        Add a skill to start logging
      </h2>
      <p class="mt-1 max-w-sm text-text-secondary">
        Sessions belong to a skill — add the first one you're practicing.
      </p>
      <AppButton to="/skills" class="mt-6">
        Add your first skill
      </AppButton>
    </section>

    <!-- No sessions (yet, or none for this filter) -->
    <section
      v-else-if="sessions.items.length === 0"
      class="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <span class="flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
        <NotebookPen :size="28" aria-hidden="true" />
      </span>
      <h2 class="mt-4 text-lg font-medium">
        {{ sessions.filterSkillId ? 'No sessions for this skill yet' : 'No sessions yet' }}
      </h2>
      <p class="mt-1 max-w-sm text-text-secondary">
        Log your first practice session — it takes about 15 seconds.
      </p>
      <AppButton class="mt-6" @click="sessionDialog.openLog({ skillId: sessions.filterSkillId })">
        <Plus :size="20" aria-hidden="true" />
        Log a session
      </AppButton>
    </section>

    <!-- List -->
    <div v-else class="mt-6 space-y-6">
      <section v-for="group in groups" :key="group.date" :aria-labelledby="`day-${group.date}`">
        <h2 :id="`day-${group.date}`" class="mb-2 text-sm font-semibold text-text-secondary">
          {{ group.label }}
        </h2>
        <ul class="space-y-2">
          <li v-for="session in group.items" :key="session.id">
            <SessionRow
              :session="session"
              :skill="skills.byId.get(session.skillId)"
              @edit="sessionDialog.openEdit(session)"
              @delete="openDelete(session)"
            />
          </li>
        </ul>
      </section>

      <div v-if="sessions.hasMore" class="flex flex-col items-center gap-3">
        <AppAlert v-if="sessions.loadMoreError">
          {{ sessions.loadMoreError }}
        </AppAlert>
        <AppButton variant="secondary" :loading="sessions.loadingMore" @click="sessions.loadMore()">
          {{ sessions.loadingMore ? 'Loading…' : 'Load more sessions' }}
        </AppButton>
      </div>
    </div>

    <AppDialog v-model:open="deleteOpen" role="alertdialog" title="Delete this session?">
      <ConfirmDestructive
        v-if="deleteOpen && deleting"
        confirm-label="Delete session"
        pending-label="Deleting…"
        cancel-label="Keep session"
        :action="() => sessions.remove(deleting!)"
        @done="onDeleted"
        @cancel="deleteOpen = false"
      >
        This permanently deletes your {{ describeDeleting(deleting) }}. Your totals and streak will update.
      </ConfirmDestructive>
    </AppDialog>
  </div>
</template>
