<script setup lang="ts">
// Callback target for the email-confirmation link. The Supabase client exchanges the
// `?code=` for a session on load; when `user` appears we continue to the saved path or dashboard.
useSeoMeta({ title: 'Confirming — Skills Learning Tracker' })

const user = useSupabaseUser()
const cookieRedirect = useSupabaseCookieRedirect()

// Supabase reports a bad/expired link via the query string or the URL hash
const linkError = ref<string | null>(null)
onMounted(() => {
  const params = new URLSearchParams(window.location.search + '&' + window.location.hash.slice(1))
  const code = params.get('error_code')
  if (code || params.get('error')) linkError.value = describeAuthError({ code: code ?? undefined, status: 400 })
})

const timedOut = ref(false)
useTimeoutFn(() => { if (!user.value) timedOut.value = true }, 8000)

watch(user, (value) => {
  if (value) navigateTo(sanitizeRedirect(cookieRedirect.pluck()))
}, { immediate: true })

const failed = computed(() => !!linkError.value || timedOut.value)
</script>

<template>
  <AuthCard v-if="!failed" title="Signing you in…">
    <p class="text-text-secondary" role="status">
      Confirming your email. This only takes a moment.
    </p>
  </AuthCard>

  <AuthCard v-else title="We couldn't confirm your email">
    <AppAlert>
      {{ linkError ?? 'The confirmation link has expired or was already used.' }}
    </AppAlert>
    <p class="mt-4 text-text-secondary">
      If you already confirmed, you can sign in. Otherwise, create the account again to get a fresh link.
    </p>
    <div class="mt-4 flex flex-col gap-3 sm:flex-row">
      <AppButton to="/login" block>
        Sign in
      </AppButton>
      <AppButton to="/signup" variant="secondary" block>
        Sign up again
      </AppButton>
    </div>
  </AuthCard>
</template>
