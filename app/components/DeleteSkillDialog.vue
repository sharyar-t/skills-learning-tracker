<script setup lang="ts">
import type { SkillWithStats } from '#shared/types/domain'

const props = defineProps<{ skill: SkillWithStats }>()
const emit = defineEmits<{ deleted: [name: string], cancel: [] }>()

const store = useSkillsStore()
</script>

<template>
  <ConfirmDestructive
    confirm-label="Delete skill"
    pending-label="Deleting…"
    cancel-label="Keep skill"
    :action="() => store.remove(skill.id)"
    @done="emit('deleted', props.skill.name)"
    @cancel="emit('cancel')"
  >
    <template v-if="skill.sessionCount > 0">
      This permanently deletes <strong class="text-text-primary">{{ skill.name }}</strong> and its
      {{ pluralize(skill.sessionCount, 'logged session') }} ({{ formatDuration(skill.totalMinutes) }}).
      This can't be undone.
    </template>
    <template v-else>
      This permanently deletes <strong class="text-text-primary">{{ skill.name }}</strong>.
      This can't be undone.
    </template>
  </ConfirmDestructive>
</template>
