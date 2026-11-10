<script setup lang="ts">
// The call-to-action buttons, for the three kinds of visitor: signed in, exploring the demo, or new.
const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
</script>

<template>
  <AppButton v-if="isAuthenticated" to="/dashboard" size="lg">
    Open your dashboard
  </AppButton>
  <template v-else-if="isGuest">
    <AppButton to="/signup" size="lg">
      Sign up
    </AppButton>
    <AppButton to="/dashboard" size="lg" variant="secondary">
      Continue the demo
    </AppButton>
  </template>
  <template v-else>
    <AppButton to="/signup" size="lg">
      Sign up
    </AppButton>
    <AppButton to="/guest" size="lg" variant="secondary">
      Try as guest
    </AppButton>
  </template>
</template>
