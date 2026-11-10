<script setup lang="ts">
// Landing page for the link in the reset email. The Supabase client exchanges the
// `?code=` in the URL for a (recovery) session on load; once `user` is set we can show the form.
// Intentionally NOT guest-only: the recovery session counts as signed in.
useSeoMeta({ title: 'Choose a new password — Skills Learning Tracker' })

const { user, updatePassword } = useAuth()

const formEl = useTemplateRef<HTMLFormElement>('formEl')
const password = ref('')
const passwordError = ref<string | null>(null)
const formError = ref<string | null>(null)
const pending = ref(false)

// Give the code exchange a moment before declaring the link dead
const linkTimedOut = ref(false)
useTimeoutFn(() => { linkTimedOut.value = true }, 6000)

const status = computed<'checking' | 'ready' | 'invalid'>(() => {
  if (user.value) return 'ready'
  return linkTimedOut.value ? 'invalid' : 'checking'
})

async function onSubmit() {
  formError.value = null
  passwordError.value = validateNewPassword(password.value)
  if (passwordError.value) return focusFirstInvalid(formEl.value)

  pending.value = true
  const { error } = await updatePassword(password.value)
  pending.value = false

  if (error) {
    formError.value = error
    return
  }
  await navigateTo('/dashboard')
}
</script>

<template>
  <AuthCard v-if="status === 'checking'" title="Checking your link…">
    <p class="text-text-secondary" role="status">
      One moment while we verify your reset link.
    </p>
  </AuthCard>

  <AuthCard v-else-if="status === 'invalid'" title="This link doesn't work">
    <AppAlert>
      The reset link has expired or was already used. Request a new one to continue.
    </AppAlert>
    <AppButton to="/forgot-password" block class="mt-4">
      Request a new link
    </AppButton>
  </AuthCard>

  <AuthCard v-else title="Choose a new password" description="Pick something you haven't used before.">
    <form ref="formEl" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppAlert v-if="formError">
        {{ formError }}
      </AppAlert>

      <FormField
        v-model="password"
        label="New password"
        type="password"
        autocomplete="new-password"
        :hint="`At least ${MIN_PASSWORD_LENGTH} characters.`"
        :error="passwordError"
      />

      <AppButton type="submit" block :loading="pending">
        {{ pending ? 'Saving…' : 'Save new password' }}
      </AppButton>
    </form>
  </AuthCard>
</template>
