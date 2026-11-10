<script setup lang="ts">
// The enter-guest middleware starts the demo and redirects before this page ever renders.
// This is only what's shown if that redirect is somehow delayed.
definePageMeta({ middleware: 'enter-guest' })
useSeoMeta({ title: 'Starting the demo — Skills Learning Tracker', robots: 'noindex' })
</script>

<template>
  <p class="text-text-secondary" role="status">
    Starting the demo…
  </p>
</template>
