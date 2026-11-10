<script setup lang="ts">
definePageMeta({ middleware: 'guest-only' })
useSeoMeta({ title: 'Sign in — Skills Learning Tracker' })

const { signIn } = useAuth()
const cookieRedirect = useSupabaseCookieRedirect()

const formEl = useTemplateRef<HTMLFormElement>('formEl')
const email = ref('')
const password = ref('')
const errors = reactive<{ email: string | null, password: string | null }>({ email: null, password: null })
const formError = ref<string | null>(null)
const pending = ref(false)

async function onSubmit() {
  formError.value = null
  errors.email = validateEmail(email.value)
  errors.password = validateCurrentPassword(password.value)
  if (errors.email || errors.password) return focusFirstInvalid(formEl.value)

  pending.value = true
  const { error } = await signIn(email.value, password.value)
  pending.value = false

  // Keep what the user typed on failure so they can fix and retry
  if (error) {
    formError.value = error
    return
  }
  await navigateTo(sanitizeRedirect(cookieRedirect.pluck()))
}
</script>

<template>
  <AuthCard title="Welcome back" description="Sign in to pick up your streak where you left off.">
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

      <div>
        <FormField
          v-model="password"
          label="Password"
          type="password"
          autocomplete="current-password"
          :error="errors.password"
        />
        <p class="mt-2 text-sm">
          <NuxtLink to="/forgot-password" class="text-accent-text underline underline-offset-2 hover:no-underline">
            Forgot your password?
          </NuxtLink>
        </p>
      </div>

      <AppButton type="submit" block :loading="pending">
        {{ pending ? 'Signing in…' : 'Sign in' }}
      </AppButton>
    </form>

    <template #footer>
      New here?
      <NuxtLink to="/signup" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Create an account
      </NuxtLink>
      <span class="mx-1" aria-hidden="true">·</span>
      <NuxtLink to="/guest" class="font-medium text-accent-text underline underline-offset-2 hover:no-underline">
        Try as guest
      </NuxtLink>
    </template>
  </AuthCard>
</template>
