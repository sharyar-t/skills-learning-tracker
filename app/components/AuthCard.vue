<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mx-auto w-full max-w-md py-6 sm:py-12">
    <div class="rounded-xl border border-border-subtle bg-surface p-6 shadow-md sm:p-8">
      <h1 class="text-xl font-semibold">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-2 text-text-secondary">
        {{ description }}
      </p>

      <div class="mt-6">
        <slot />
      </div>
    </div>

    <p v-if="$slots.footer" class="mt-6 text-center text-text-secondary">
      <slot name="footer" />
    </p>
  </div>
</template>
