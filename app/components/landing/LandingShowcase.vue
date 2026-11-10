<script setup lang="ts">
// The real dashboard components on sample data — so visitors see the product, not a screenshot.
const { isAuthenticated } = useAuth()
const { isGuest } = useGuest()
const inApp = computed(() => isAuthenticated.value || isGuest.value)
const { featured, others, progress, nudge, today } = useDemoDashboard()

// "Log" in a demo card is an invitation to try it
const tryIt = () => navigateTo(inApp.value ? '/dashboard' : '/guest')
</script>

<template>
  <section id="demo" aria-labelledby="demo-title" class="border-y border-border-subtle bg-bg-secondary py-16 sm:py-20">
    <div class="mx-auto max-w-content px-4 sm:px-6">
      <div class="mx-auto max-w-2xl text-center">
        <h2 id="demo-title" class="text-2xl font-semibold">
          Your whole practice, one dashboard
        </h2>
        <p class="mt-3 text-text-secondary">
          Progress rings, streaks, and a nudge for what to practice next — shown here with sample data
          from a learner juggling six skills.
        </p>
      </div>

      <div class="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FeaturedSkillCard
          v-if="featured"
          :heading-level="3"
          :skill="featured"
          :progress="progress.get(featured.id) ?? null"
          :today="today"
          @log="tryIt"
        />
        <NudgeCard v-if="nudge" :nudge="nudge" :heading-level="3" @act="tryIt" />
        <SkillProgressCard
          v-for="skill in others.slice(0, 3)"
          :key="skill.id"
          :skill="skill"
          :progress="progress.get(skill.id) ?? null"
          :today="today"
          @log="tryIt"
        />
      </div>

      <p class="mt-8 text-center">
        <AppButton :to="inApp ? '/dashboard' : '/guest'" variant="secondary" size="lg">
          {{ isAuthenticated ? 'Open your dashboard' : isGuest ? 'Continue the demo' : 'Explore the full demo' }}
        </AppButton>
      </p>
    </div>
  </section>
</template>
