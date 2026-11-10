<script setup lang="ts">
import { Plus } from '@lucide/vue'
import type { PracticeSession, SessionInput, SessionSaved } from '#shared/types/domain'

// Log (no `session`) or edit (with `session`). Rendered inside the dialog with v-if,
// so its state is fresh every time the dialog opens.
const props = defineProps<{
  session?: PracticeSession | null
  skillId?: string | null
  /** Start from a timed duration and its date (the user can still change both) */
  prefill?: { minutes: number, date: string } | null
}>()
const emit = defineEmits<{ saved: [result: SessionSaved], cancel: [] }>()

const skills = useSkillsStore()
const sessions = useSessionsStore()

const isEdit = computed(() => !!props.session)
const today = toISODate()
const yesterday = shiftDate(today, -1)

// --- Skill: remember the last one used, otherwise the most recently practiced ---------------
// Synchronous write: this form unmounts right after saving, which could drop a deferred write
const lastSkillId = useLocalStorage('slt-last-skill', '', { flush: 'sync' })

function initialSkillId(): string {
  const known = (id?: string | null) => (id && skills.byId.has(id) ? id : null)
  return known(props.session?.skillId) ?? known(props.skillId) ?? known(lastSkillId.value)
    ?? skills.mostRecentSkillId ?? skills.skills[0]?.id ?? ''
}

const skillId = ref(initialSkillId())

// --- Duration: presets + free text ("45", "1h 30m", "1.5") ----------------------------------
const PRESETS = [
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
] as const

const durationText = ref(
  props.session ? formatDuration(props.session.durationMinutes) : props.prefill ? formatDuration(props.prefill.minutes) : '',
)
const parsed = computed(() => (durationText.value.trim() ? parseDuration(durationText.value) : null))

const durationHint = computed(() => {
  const result = parsed.value
  if (!result?.ok) return 'Minutes (45), hours and minutes (1h 30m), or hours (1.5)'
  const pretty = formatDuration(result.minutes)
  return isLongSession(result.minutes)
    ? `= ${pretty}. That's a long session — double-check it's right.`
    : `= ${pretty}`
})

function isPresetActive(minutes: number) {
  return parsed.value?.ok === true && parsed.value.minutes === minutes
}

// --- Date: Today / Yesterday / pick one (backfilling) --------------------------------------
type DateChoice = 'today' | 'yesterday' | 'other'

const initialDate = props.session?.date ?? props.prefill?.date ?? today
const dateChoice = ref<DateChoice>(initialDate === today ? 'today' : initialDate === yesterday ? 'yesterday' : 'other')
const customDate = ref(initialDate)
const date = computed(() => ({ today, yesterday, other: customDate.value })[dateChoice.value])

const dateOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'other', label: 'Other day' },
] as const

// --- Notes: collapsed unless there already are some ----------------------------------------
const notes = ref(props.session?.notes ?? '')
const notesOpen = ref(!!props.session?.notes)
const notesEl = useTemplateRef<HTMLTextAreaElement>('notesEl')
const notesId = useId()
const notesErrorId = `${notesId}-error`

async function openNotes() {
  notesOpen.value = true
  await nextTick()
  notesEl.value?.focus()
}

// --- Submit ---------------------------------------------------------------------------------
const errors = reactive<{ skill: string | null, duration: string | null, date: string | null, notes: string | null }>({
  skill: null, duration: null, date: null, notes: null,
})
const formError = ref<string | null>(null)
const pending = ref(false)
const duplicateOf = ref<{ minutes: number, skillName: string, dayLabel: string } | null>(null)
const formEl = useTemplateRef<HTMLFormElement>('formEl')
const skillSelectId = useId()
const skillErrorId = `${skillSelectId}-error`

// Changing anything invalidates a pending "log it again?" prompt
watch([skillId, durationText, dateChoice, customDate], () => { duplicateOf.value = null })

async function onSubmit() {
  formError.value = null
  const duration = parseDuration(durationText.value)
  errors.skill = skillId.value && skills.byId.has(skillId.value) ? null : 'Choose a skill.'
  errors.duration = duration.ok ? null : duration.error
  errors.date = validateSessionDate(date.value, today)
  errors.notes = validateNotes(notes.value)
  if (errors.skill || errors.duration || errors.date || errors.notes || !duration.ok) {
    return focusFirstInvalid(formEl.value)
  }

  const input: SessionInput = {
    skillId: skillId.value,
    durationMinutes: duration.minutes,
    date: date.value,
    notes: normalizeNotes(notes.value),
  }

  // Double-tap guard: an identical save moments ago needs a deliberate second click
  if (!isEdit.value && !duplicateOf.value && sessions.isRecentDuplicate(input)) {
    duplicateOf.value = {
      minutes: input.durationMinutes,
      skillName: skills.byId.get(input.skillId)?.name ?? 'this skill',
      dayLabel: formatDayInSentence(input.date, today),
    }
    return
  }

  const before = skills.byId.get(input.skillId)?.streak ?? null
  pending.value = true
  const { error } = props.session
    ? await sessions.update(props.session, input)
    : await sessions.create(input)
  pending.value = false

  // On failure keep the dialog open with everything the user typed
  if (error) {
    formError.value = error
    return
  }

  lastSkillId.value = input.skillId
  const skill = skills.byId.get(input.skillId)
  emit('saved', {
    isEdit: isEdit.value,
    skillName: skill?.name ?? 'your skill',
    minutes: input.durationMinutes,
    date: input.date,
    before,
    after: skill?.streak ?? null,
  })
}

const submitLabel = computed(() => {
  if (pending.value) return 'Saving…'
  if (duplicateOf.value) return 'Log it again'
  return isEdit.value ? 'Save changes' : 'Log session'
})
</script>

<template>
  <form ref="formEl" class="space-y-5" novalidate @submit.prevent="onSubmit">
    <AppAlert v-if="formError">
      {{ formError }}
    </AppAlert>

    <!-- Skill -->
    <div>
      <label :for="skillSelectId" class="mb-1.5 block text-sm font-medium">Skill</label>
      <select
        :id="skillSelectId"
        v-model="skillId"
        aria-required="true"
        :aria-invalid="errors.skill ? true : undefined"
        :aria-describedby="errors.skill ? skillErrorId : undefined"
        class="min-h-11 w-full rounded-md border bg-surface px-3 text-base"
        :class="errors.skill ? 'border-error' : 'border-border-strong hover:border-text-secondary'"
      >
        <option v-for="skill in skills.skills" :key="skill.id" :value="skill.id">
          {{ skill.name }}
        </option>
      </select>
      <p v-if="errors.skill" :id="skillErrorId" class="mt-1.5 text-sm text-error">
        {{ errors.skill }}
      </p>
    </div>

    <!-- Duration -->
    <div>
      <p v-if="prefill" class="mb-2 text-sm text-text-secondary">
        Your timer recorded {{ formatDuration(prefill.minutes) }}. Adjust it if you took a break.
      </p>
      <FormField
        v-model="durationText"
        label="How long?"
        inputmode="text"
        autocomplete="off"
        :hint="durationHint"
        :error="errors.duration"
        autofocus
      />
      <div role="group" aria-label="Common durations" class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="preset in PRESETS"
          :key="preset.label"
          type="button"
          class="min-h-11 min-w-14 rounded-full border px-4 text-sm font-medium transition-colors"
          :class="isPresetActive(preset.minutes)
            ? 'border-accent-solid bg-accent-subtle font-semibold'
            : 'border-border bg-surface hover:bg-bg-tertiary'"
          :aria-pressed="isPresetActive(preset.minutes)"
          @click="durationText = preset.label; errors.duration = null"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Date -->
    <fieldset>
      <legend class="mb-1.5 text-sm font-medium">
        When?
      </legend>
      <div class="grid grid-cols-3 gap-2">
        <label v-for="option in dateOptions" :key="option.value" class="relative cursor-pointer">
          <input v-model="dateChoice" type="radio" name="session-date" :value="option.value" class="peer sr-only">
          <span
            class="flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-2 text-sm font-medium hover:bg-bg-tertiary peer-checked:border-accent-solid peer-checked:bg-accent-subtle peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            {{ option.label }}
          </span>
        </label>
      </div>
      <FormField
        v-if="dateChoice === 'other'"
        v-model="customDate"
        class="mt-3"
        label="Date"
        type="date"
        :max="today"
        :error="errors.date"
      />
    </fieldset>

    <!-- Notes -->
    <div>
      <button
        v-if="!notesOpen"
        type="button"
        class="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-accent-text hover:underline"
        aria-expanded="false"
        :aria-controls="notesId"
        @click="openNotes"
      >
        <Plus :size="16" aria-hidden="true" />
        Add notes
      </button>
      <div v-else>
        <label :for="notesId" class="mb-1.5 block text-sm font-medium">
          Notes <span class="font-regular text-text-secondary">(optional)</span>
        </label>
        <textarea
          :id="notesId"
          ref="notesEl"
          v-model="notes"
          rows="4"
          placeholder="What did you work on? What clicked, what needs more practice?"
          :aria-invalid="errors.notes ? true : undefined"
          :aria-describedby="errors.notes ? notesErrorId : undefined"
          class="min-h-24 w-full resize-y rounded-md border bg-surface px-3 py-2 text-base placeholder:text-text-secondary"
          :class="errors.notes ? 'border-error' : 'border-border-strong hover:border-text-secondary'"
        />
        <p v-if="notes.length > NOTES_MAX_LENGTH - 500" class="mt-1 text-right text-sm text-text-secondary">
          {{ notes.length.toLocaleString('en-US') }} / {{ NOTES_MAX_LENGTH.toLocaleString('en-US') }}
        </p>
        <p v-if="errors.notes" :id="notesErrorId" class="mt-1.5 text-sm text-error">
          {{ errors.notes }}
        </p>
      </div>
    </div>

    <AppAlert v-if="duplicateOf" variant="warning">
      You just logged {{ formatDuration(duplicateOf.minutes) }} of {{ duplicateOf.skillName }} for {{ duplicateOf.dayLabel }}.
      Save it again as a separate session?
    </AppAlert>

    <div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
      <AppButton variant="secondary" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="pending">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>
