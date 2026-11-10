<script setup lang="ts">
import { Flame } from '@lucide/vue'

const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
</script>

<template>
  <section class="relative isolate overflow-hidden" aria-labelledby="hero-title">
    <!-- Soft accent glow behind the product preview -->
    <div
      class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_85%_0%,var(--color-accent-subtle),transparent)]"
      aria-hidden="true"
    />

    <div class="mx-auto grid max-w-content grid-cols-1 items-center gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-text-secondary">
          <Flame :size="16" class="fill-streak text-streak" aria-hidden="true" />
          Strava for learning
        </p>

        <h1 id="hero-title" class="mt-5 text-3xl font-bold">
          See every hour you've invested in becoming better.
        </h1>

        <p class="mt-4 max-w-xl text-lg text-text-secondary">
          Log practice in seconds, keep your streaks alive, and watch your consistency build —
          for guitar, Spanish, TypeScript, or anything else you're learning.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <LandingActions />
        </div>

        <p v-if="!isAuthenticated && !isGuest" class="mt-4 text-sm text-text-secondary">
          No account needed to look around — the guest demo comes with 6 skills and 47 practice sessions.
        </p>
      </div>

      <LandingHeroVisual />
    </div>
  </section>
</template>
