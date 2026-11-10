<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { GoalType, SkillGoal, SkillWithStats } from '#shared/types/domain'

// Create (no `skill`) or edit (with `skill`). Rendered inside AppDialog with v-if,
// so its state is fresh every time the dialog opens.
const props = defineProps<{ skill?: SkillWithStats | null }>()
const emit = defineEmits<{ saved: [name: string], cancel: [] }>()

const store = useSkillsStore()

const name = ref(props.skill?.name ?? '')
const color = ref(props.skill?.color ?? DEFAULT_SKILL_COLOR)
const goalType = ref<GoalType | 'none'>(props.skill?.goal?.type ?? 'none')
const goalHours = ref(props.skill?.goal ? formatHours(props.skill.goal.targetHours) : '')

const errors = reactive<{ name: string | null, goal: string | null }>({ name: null, goal: null })
const formError = ref<string | null>(null)
const pending = ref(false)
const formEl = useTemplateRef<HTMLFormElement>('formEl')

const isEdit = computed(() => !!props.skill)

const goalOptions = [
  { value: 'none', label: 'No goal' },
  { value: 'weekly', label: 'Per week' },
  { value: 'total', label: 'In total' },
] as const

async function onSubmit() {
  formError.value = null
  errors.name = validateSkillName(name.value)
  errors.goal = goalType.value === 'none' ? null : validateGoalHours(goalHours.value, goalType.value)
  if (errors.name || errors.goal) return focusFirstInvalid(formEl.value)

  const goal: SkillGoal | null = goalType.value === 'none'
    ? null
    : { type: goalType.value, targetHours: parseHours(goalHours.value) }
  const input = { name: name.value.trim(), color: color.value, goal }

  pending.value = true
  const { error } = props.skill
    ? await store.update(props.skill.id, input)
    : await store.create(input)
  pending.value = false

  // On failure keep the dialog open with everything the user typed
  if (error) {
    formError.value = error
    return
  }
  emit('saved', input.name)
}
</script>

<template>
  <form ref="formEl" class="space-y-5" novalidate @submit.prevent="onSubmit">
    <AppAlert v-if="formError">
      {{ formError }}
    </AppAlert>

    <FormField
      v-model="name"
      label="Name"
      autocomplete="off"
      :maxlength="SKILL_NAME_MAX_LENGTH"
      :error="errors.name"
      autofocus
    />

    <fieldset>
      <legend class="mb-1.5 text-sm font-medium">
        Color
      </legend>
      <div class="flex flex-wrap gap-1">
        <label v-for="option in SKILL_COLORS" :key="option.value" class="relative cursor-pointer">
          <input v-model="color" type="radio" name="skill-color" :value="option.value" class="peer sr-only">
          <span
            class="flex size-11 items-center justify-center rounded-full border-2 border-transparent bg-clip-padding p-0.5 peer-checked:border-text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            <span
              class="flex size-full items-center justify-center rounded-full"
              :style="{ backgroundColor: option.value, color: readableTextColor(option.value) }"
            >
              <Check v-if="color === option.value" :size="18" :stroke-width="3" aria-hidden="true" />
            </span>
          </span>
          <span class="sr-only">{{ option.name }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend class="mb-1.5 text-sm font-medium">
        Goal <span class="font-regular text-text-secondary">(optional)</span>
      </legend>
      <div class="grid grid-cols-3 gap-2">
        <label v-for="option in goalOptions" :key="option.value" class="relative cursor-pointer">
          <input v-model="goalType" type="radio" name="goal-type" :value="option.value" class="peer sr-only">
          <span
            class="flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-2 text-sm font-medium hover:bg-bg-tertiary peer-checked:border-accent-solid peer-checked:bg-accent-subtle peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            {{ option.label }}
          </span>
        </label>
      </div>

      <FormField
        v-if="goalType !== 'none'"
        v-model="goalHours"
        class="mt-3"
        :label="goalType === 'weekly' ? 'Hours per week' : 'Total hours'"
        inputmode="decimal"
        autocomplete="off"
        :hint="goalType === 'weekly' ? 'For example 5 or 2.5' : 'For example 100 — your target across all practice'"
        :error="errors.goal"
      />
    </fieldset>

    <div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
      <AppButton variant="secondary" @click="emit('cancel')">
        Cancel
      </AppButton>
      <AppButton type="submit" :loading="pending">
        {{ pending ? 'Saving…' : isEdit ? 'Save changes' : 'Add skill' }}
      </AppButton>
    </div>
  </form>
</template>
