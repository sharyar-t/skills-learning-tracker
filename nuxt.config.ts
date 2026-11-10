import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/fonts'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Skills Learning Tracker',
      meta: [
        { name: 'description', content: 'See every hour you\'ve invested in becoming better. Log practice sessions, track streaks, and visualize your consistency.' },
        { name: 'theme-color', content: '#FAFAF8', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#131614', media: '(prefers-color-scheme: dark)' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  fonts: {
    families: [
      { name: 'Space Grotesk', provider: 'google', weights: [500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  supabase: {
    types: '~~/shared/types/database.types.ts',
    // We run our own route middleware (middleware/require-session.ts): the built-in redirect
    // can't let guests through. Only the redirect-cookie settings are still used.
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      saveRedirectToCookie: true,
    },
  },

  runtimeConfig: {
    public: {
      // Where links in auth emails (confirm, reset password) should point. Leave empty locally:
      // the address of the running app (e.g. http://localhost:3000) is used. Set it in production.
      siteUrl: '',
    },
  },

  routeRules: {
    // The email-confirmation callback exchanges its code in the browser (the module did this for us)
    '/confirm': { ssr: false },
  },

  typescript: {
    strict: true,
  },
})
