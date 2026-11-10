<script setup lang="ts">
// Things that float above every page: the log-session dialog (signed-in users and demo guests) and toasts.
const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
</script>

<template>
  <SessionDialogHost v-if="isAuthenticated || isGuest" />
  <ToastHost />
</template>
