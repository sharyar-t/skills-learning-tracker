<script setup lang="ts">
import { Plus, Sprout } from '@lucide/vue'
import type { SkillWithStats } from '#shared/types/domain'

// Signed-in users and demo guests only (see middleware/require-session.ts)
definePageMeta({ middleware: 'require-session' })
useSeoMeta({ title: 'Skills — Skills Learning Tracker' })

const store = useSkillsStore()
const sessionDialog = useSessionDialog()
const timer = useTimerStore()

// Streaks depend on the user's local date, so load in the browser only
onMounted(() => {
  if (store.status === 'idle' || store.status === 'error') store.load()
})

const formOpen = ref(false)
const editing = ref<SkillWithStats | null>(null)
const deleteOpen = ref(false)
const deleting = ref<SkillWithStats | null>(null)

// Polite live-region message for screen readers ("Skill added: Spanish")
const announcement = ref('')

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(skill: SkillWithStats) {
  editing.value = skill
  formOpen.value = true
}

function openDelete(skill: SkillWithStats) {
  deleting.value = skill
  deleteOpen.value = true
}

function onSaved(name: string) {
  announcement.value = editing.value ? `Skill updated: ${name}` : `Skill added: ${name}`
  formOpen.value = false
}

function onDeleted(name: string) {
  announcement.value = `Skill deleted: ${name}`
  deleteOpen.value = false
}

const isLoading = computed(() => store.status === 'idle' || store.status === 'loading')
</script>

<template>
  <div>
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">
          Skills
        </h1>
        <p v-if="store.status === 'ready' && store.skills.length" class="text-text-secondary">
          {{ pluralize(store.skills.length, 'skill') }} you're building
        </p>
      </div>

      <AppButton v-if="store.status === 'ready' && store.skills.length" @click="openCreate">
        <Plus :size="20" aria-hidden="true" />
        Add skill
      </AppButton>
    </header>

    <p class="sr-only" role="status" aria-live="polite">
      {{ announcement }}
    </p>

    <!-- Loading: skeleton cards keep the layout stable (no shift when data arrives) -->
    <div
      v-if="isLoading"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading your skills"
    >
      <div
        v-for="n in 3"
        :key="n"
        class="h-52 animate-pulse rounded-xl border border-border-subtle bg-bg-secondary"
      />
    </div>

    <!-- Error: never a blank screen -->
    <div v-else-if="store.status === 'error'" class="mt-6 max-w-xl space-y-4">
      <AppAlert>
        {{ store.loadError }}
      </AppAlert>
      <AppButton variant="secondary" @click="store.load()">
        Try again
      </AppButton>
    </div>

    <!-- Empty -->
    <section
      v-else-if="store.skills.length === 0"
      class="mt-8 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center"
    >
      <span class="flex size-14 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
        <Sprout :size="28" aria-hidden="true" />
      </span>
      <h2 class="mt-4 text-lg font-medium">
        No skills yet
      </h2>
      <p class="mt-1 max-w-sm text-text-secondary">
        Add your first skill to start tracking your practice.
        Guitar, Spanish, TypeScript — anything you're getting better at.
      </p>
      <AppButton class="mt-6" @click="openCreate">
        <Plus :size="20" aria-hidden="true" />
        Add your first skill
      </AppButton>
    </section>

    <!-- List -->
    <ul v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="skill in store.skills" :key="skill.id" class="contents">
        <SkillCard
          :skill="skill"
          :can-start-timer="!timer.state"
          @timer="timer.start(skill.id)"
          @edit="openEdit(skill)"
          @delete="openDelete(skill)"
          @log="sessionDialog.openLog({ skillId: skill.id })"
        />
      </li>
    </ul>

    <AppDialog
      v-model:open="formOpen"
      :title="editing ? `Edit ${editing.name}` : 'Add a skill'"
      :description="editing ? undefined : 'What are you practicing? You can change any of this later.'"
    >
      <SkillForm v-if="formOpen" :skill="editing" @saved="onSaved" @cancel="formOpen = false" />
    </AppDialog>

    <AppDialog
      v-model:open="deleteOpen"
      role="alertdialog"
      :title="deleting ? `Delete ${deleting.name}?` : 'Delete skill?'"
    >
      <DeleteSkillDialog
        v-if="deleteOpen && deleting"
        :skill="deleting"
        @deleted="onDeleted"
        @cancel="deleteOpen = false"
      />
    </AppDialog>
  </div>
</template>
