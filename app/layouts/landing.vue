<!-- Full-bleed sections: each landing section sets its own container and background -->
<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md"
    >
      Skip to content
    </a>

    <AppHeader />

    <main id="main" class="flex-1">
      <slot />
    </main>

    <AppFooter />
    <GlobalOverlays />
  </div>
</template>
