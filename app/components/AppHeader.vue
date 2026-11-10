<script setup lang="ts">
import { Plus } from '@lucide/vue'

const { isAuthenticated, email, signOut } = useAuth()
const { isGuest } = useGuest()
const sessionDialog = useSessionDialog()

/** Signed in, or exploring the demo: both get the app navigation and the log button */
const inApp = computed(() => isAuthenticated.value || isGuest.value)

const signOutError = ref<string | null>(null)
const signingOut = ref(false)

async function onSignOut() {
  signOutError.value = null
  signingOut.value = true
  const { error } = await signOut()
  signingOut.value = false
  signOutError.value = error
}

// Second-row links: fade the right edge only while there is more to scroll to
const linksEl = useTemplateRef<HTMLElement>('linksEl')
const { arrivedState } = useScroll(linksEl)
const overflowing = ref(false)
useResizeObserver(linksEl, () => {
  const el = linksEl.value
  overflowing.value = !!el && el.scrollWidth > el.clientWidth + 1
})
const fadeEdge = computed(() => overflowing.value && !arrivedState.right)

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/skills', label: 'Skills' },
  { to: '/sessions', label: 'Sessions' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border-subtle bg-bg-primary/90 backdrop-blur">
    <div class="mx-auto flex h-topbar max-w-page items-center justify-between gap-3 px-4 sm:px-6">
      <div class="flex min-w-0 items-center gap-6">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-2 font-heading text-lg font-semibold">
          <!-- Brand mark: the name collapses to the mark alone on narrow screens -->
          <svg viewBox="0 0 32 32" class="size-7 shrink-0" aria-hidden="true">
            <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="5" />
            <circle
              cx="16" cy="16" r="12" fill="none" stroke="var(--color-accent)" stroke-width="5" stroke-linecap="round"
              stroke-dasharray="56.5 75.4" transform="rotate(-90 16 16)"
            />
          </svg>
          <span class="sr-only sm:not-sr-only">Skills Learning Tracker</span>
        </NuxtLink>

        <nav v-if="inApp" class="hidden gap-1 md:flex" aria-label="Main">
          <AppButton v-for="link in links" :key="link.to" :to="link.to" variant="ghost">
            {{ link.label }}
          </AppButton>
        </nav>
      </div>

      <div class="flex shrink-0 items-center gap-1 sm:gap-2">
        <!-- In the app on a small screen the toggle lives in the second row instead -->
        <ThemeToggle :class="inApp ? 'hidden sm:block' : ''" />
        <template v-if="isAuthenticated">
          <AppButton @click="sessionDialog.openLog()">
            <Plus :size="20" aria-hidden="true" />
            Log session
          </AppButton>
          <span v-if="email" class="hidden max-w-40 truncate text-sm text-text-secondary xl:inline">
            {{ email }}
          </span>
          <AppButton variant="ghost" :loading="signingOut" @click="onSignOut">
            Sign out
          </AppButton>
        </template>
        <template v-else-if="isGuest">
          <AppButton @click="sessionDialog.openLog()">
            <Plus :size="20" aria-hidden="true" />
            Log session
          </AppButton>
          <AppButton to="/signup" variant="secondary">
            Sign up
          </AppButton>
        </template>
        <template v-else>
          <AppButton to="/login" variant="ghost">
            Sign in
          </AppButton>
          <AppButton to="/signup" class="hidden sm:inline-flex">
            Sign up
          </AppButton>
        </template>
      </div>
    </div>

    <!-- Small screens: the same links (and the theme toggle) in a second row -->
    <div v-if="inApp" class="flex items-center gap-2 px-4 pb-2 sm:px-6 md:hidden">
      <!-- Compact links so all three usually fit beside the toggle; if not, the edge fades to say "scroll" -->
      <nav
        ref="linksEl"
        class="flex min-w-0 flex-1 gap-1 overflow-x-auto"
        :class="fadeEdge && '[mask-image:linear-gradient(to_right,#000_calc(100%-1.5rem),transparent)]'"
        aria-label="Main"
      >
        <AppButton v-for="link in links" :key="link.to" :to="link.to" variant="ghost" class="px-1.5! text-sm">
          {{ link.label }}
        </AppButton>
      </nav>
      <ThemeToggle class="sm:hidden" />
    </div>

    <TimerBar v-if="inApp" />
  </header>

  <div v-if="signOutError" class="mx-auto w-full max-w-content px-4 pt-4 sm:px-6">
    <AppAlert>{{ signOutError }}</AppAlert>
  </div>
</template>
