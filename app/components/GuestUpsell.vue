<script setup lang="ts">
import { Check } from '@lucide/vue'

// What signing up unlocks — stated plainly, including that the demo data isn't copied over.
const benefits = [
  'Everything you log is saved — nothing resets when you close the tab.',
  'Pick up on any device, signed in to the same account.',
  'Start with your own skills and goals. The demo data isn\'t carried over.',
]
const headingId = useId()
</script>

<template>
  <section :aria-labelledby="headingId" class="rounded-xl bg-accent-subtle p-6 sm:p-8">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div class="max-w-2xl">
        <h2 :id="headingId" class="text-xl font-semibold">
          Like what you see? Make it yours.
        </h2>
        <p class="mt-2 text-text-secondary">
          You're looking at a demo with sample data — your changes disappear when you leave.
          An account keeps your real practice:
        </p>
        <ul class="mt-4 space-y-2">
          <li v-for="benefit in benefits" :key="benefit" class="flex gap-3">
            <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-accent-text">
              <Check :size="14" :stroke-width="3" aria-hidden="true" />
            </span>
            <span>{{ benefit }}</span>
          </li>
        </ul>
      </div>

      <div class="flex flex-wrap gap-3 lg:shrink-0 lg:flex-col">
        <AppButton to="/signup" size="lg">
          Create an account
        </AppButton>
        <AppButton to="/login" variant="secondary" size="lg">
          I already have one
        </AppButton>
      </div>
    </div>
  </section>
</template>
