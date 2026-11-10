<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const description = 'Log practice sessions, track streaks and see your consistency in a heatmap. A personal practice journal for anything you\'re learning — guitar, Spanish, TypeScript and more.'
useSeoMeta({
  title: 'Skills Learning Tracker — See every hour you\'ve invested',
  description,
  ogTitle: 'Skills Learning Tracker',
  ogDescription: description,
  ogType: 'website',
})
</script>

<template>
  <div>
    <LandingHero />
    <LandingShowcase />
    <LandingFeatures />
    <LandingConsistency />
    <LandingCta />
  </div>
</template>
