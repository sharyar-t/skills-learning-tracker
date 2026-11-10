<script setup lang="ts">
const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
</script>

<template>
  <footer class="border-t border-border-subtle">
    <div class="mx-auto flex max-w-page flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p class="font-heading text-lg font-semibold">
          Skills Learning Tracker
        </p>
        <p class="text-sm text-text-secondary">
          See every hour you've invested in becoming better.
        </p>
      </div>

      <nav aria-label="Footer" class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <template v-if="isAuthenticated">
          <NuxtLink to="/dashboard" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Dashboard
          </NuxtLink>
        </template>
        <template v-else-if="isGuest">
          <NuxtLink to="/dashboard" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Continue the demo
          </NuxtLink>
          <NuxtLink to="/signup" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Sign up
          </NuxtLink>
          <NuxtLink to="/login" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Sign in
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Sign in
          </NuxtLink>
          <NuxtLink to="/signup" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Sign up
          </NuxtLink>
          <NuxtLink to="/guest" class="text-text-secondary underline underline-offset-2 hover:text-text-primary hover:no-underline">
            Try as guest
          </NuxtLink>
        </template>
      </nav>
    </div>
  </footer>
</template>
