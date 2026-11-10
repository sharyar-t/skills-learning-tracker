<script setup lang="ts">
// A slim, calm reminder under the header while exploring the demo. Informative, never blocking.
const { isGuest, leave } = useGuest()

async function exitDemo() {
  leave()
  await navigateTo('/')
}
</script>

<template>
  <div v-if="isGuest" role="region" aria-label="Demo mode" class="border-b border-border-subtle bg-accent-subtle">
    <div class="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5 text-sm sm:px-6">
      <p>
        <strong class="font-semibold">Demo mode</strong>
        <span class="text-text-secondary"> — you're exploring sample data. Changes aren't saved when you leave.</span>
      </p>
      <p class="flex items-center gap-4">
        <NuxtLink to="/signup" class="inline-flex min-h-11 items-center font-semibold text-accent-text underline underline-offset-2 hover:no-underline">
          Sign up to keep your own data
        </NuxtLink>
        <button type="button" class="inline-flex min-h-11 items-center text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline" @click="exitDemo">
          Exit demo
        </button>
      </p>
    </div>
  </div>
</template>
