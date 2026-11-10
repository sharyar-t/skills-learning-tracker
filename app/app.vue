<script setup lang="ts">
// Apply a saved light/dark choice before first paint, so there is no flash of the wrong theme
// (see shared/utils/theme.ts). "System" needs nothing: the CSS follows prefers-color-scheme.
useHead({
  script: [{ key: 'theme-init', tagPosition: 'head', innerHTML: themeInitScript() }],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
