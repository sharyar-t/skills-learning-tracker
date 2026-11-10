<script setup lang="ts">
definePageMeta({ middleware: 'guest-only' })
useSeoMeta({ title: 'Reset password — Skills Learning Tracker' })

const { requestPasswordReset } = useAuth()

const formEl = useTemplateRef<HTMLFormElement>('formEl')
const email = ref('')
const emailError = ref<string | null>(null)
const formError = ref<string | null>(null)
const pending = ref(false)
const sentTo = ref<string | null>(null)

async function onSubmit() {
  formError.value = null
  emailError.value = validateEmail(email.value)
  if (emailError.value) return focusFirstInvalid(formEl.value)

  pending.value = true
  const { error } = await requestPasswordReset(email.value)
  pending.value = false

  if (error) {
    formError.value = error
    return
  }
  sentTo.value = email.value.trim()
}
</script>

<template>
  <AuthCard
    v-if="!sentTo"
    title="Reset your password"
    description="Enter your email and we'll send you a link to choose a new password."
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
        :error="emailError"
      />

      <AppButton type="submit" block :loading="pending">
        {{ pending ? 'Sending…' : 'Send reset link' }}
      </AppButton>
    </form>

    <template #footer>
      <NuxtLink to="/login" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Back to sign in
      </NuxtLink>
    </template>
  </AuthCard>

  <AuthCard v-else title="Check your email">
    <!-- Same wording whether or not the address has an account: never reveal who is registered -->
    <AppAlert variant="success">
      If an account exists for <strong class="break-all">{{ sentTo }}</strong>,
      a password reset link is on its way.
    </AppAlert>

    <template #footer>
      <NuxtLink to="/login" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Back to sign in
      </NuxtLink>
    </template>
  </AuthCard>
</template>
