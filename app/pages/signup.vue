<script setup lang="ts">
definePageMeta({ middleware: 'guest-only' })
useSeoMeta({ title: 'Create account — Skills Learning Tracker' })

const { signUp } = useAuth()

const formEl = useTemplateRef<HTMLFormElement>('formEl')
const email = ref('')
const password = ref('')
const errors = reactive<{ email: string | null, password: string | null }>({ email: null, password: null })
const formError = ref<string | null>(null)
const pending = ref(false)
/** Set once the confirmation email has been requested */
const sentTo = ref<string | null>(null)

async function onSubmit() {
  formError.value = null
  errors.email = validateEmail(email.value)
  errors.password = validateNewPassword(password.value)
  if (errors.email || errors.password) return focusFirstInvalid(formEl.value)

  pending.value = true
  const { error, status } = await signUp(email.value, password.value)
  pending.value = false

  if (error) {
    formError.value = error
    return
  }
  if (status === 'signed-in') return navigateTo('/dashboard')
  sentTo.value = email.value.trim()
}
</script>

<template>
  <AuthCard
    v-if="!sentTo"
    title="Create your account"
    description="Save your skills and sessions across devices and keep every streak."
  >
    <form ref="formEl" class="space-y-4" novalidate @submit.prevent="onSubmit">
      <AppAlert v-if="formError">
        {{ formError }}
      </AppAlert>

      <FormField
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="errors.email"
      />

      <FormField
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :hint="`At least ${MIN_PASSWORD_LENGTH} characters.`"
        :error="errors.password"
      />

      <AppButton type="submit" block :loading="pending">
        {{ pending ? 'Creating account…' : 'Create account' }}
      </AppButton>
    </form>

    <template #footer>
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Sign in
      </NuxtLink>
    </template>
  </AuthCard>

  <AuthCard v-else title="Check your email">
    <AppAlert variant="success">
      We sent a confirmation link to <strong class="break-all">{{ sentTo }}</strong>.
      Open it to finish creating your account.
    </AppAlert>
    <p class="mt-4 text-text-secondary">
      Nothing there after a few minutes? Check your spam folder, or
      <button
        type="button"
        class="font-medium text-accent-text underline underline-offset-2 hover:no-underline"
        @click="sentTo = null"
      >
        try a different address
      </button>.
    </p>

    <template #footer>
      <NuxtLink to="/login" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Back to sign in
      </NuxtLink>
    </template>
  </AuthCard>
</template>
