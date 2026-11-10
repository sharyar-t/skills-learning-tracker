<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md"
    >
      Skip to content
    </a>

    <AppHeader />
    <GuestBanner />

    <main id="main" class="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6">
      <slot />
    </main>

    <GlobalOverlays />
  </div>
</template>
