import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Pure logic (streaks, duration parsing, date math) runs in node; component tests can opt into `nuxt`
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
