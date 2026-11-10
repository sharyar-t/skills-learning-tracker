# Technical Requirements

This challenge supports two paths: **full-stack** (recommended) and **[frontend-only](#frontend-only-alternative)**. The sections below describe the full-stack approach. If you'd rather skip auth and database work, jump to the Frontend-Only Alternative at the bottom — it explains what changes and what stays the same.

## Database

Use a real database service — not localStorage or in-memory storage.

**Recommended options:** Supabase, Firebase, Neon, PlanetScale, Turso, or equivalent.

**Must store:**

- User accounts and authentication data
- Skills (name, color, weekly/total goal, created date, user ID)
- Practice sessions (skill ID, duration in minutes, date, notes, created/updated timestamps)
- User preferences (theme, dashboard layout preferences)

**Things to think about:**

- How will you calculate streaks efficiently? Counting consecutive days from session data on every dashboard load could be slow with hundreds of sessions. Do you store the current streak as a cached value and update it on each session log, or compute it on demand?
- What happens when a user deletes a skill? Do you cascade-delete all sessions, or soft-delete the skill and keep session history? What does the UI communicate?
- How will you query data for the heatmap? You need daily aggregates (total minutes per day) across 3-12 months. Will you aggregate on read, maintain a daily summary table, or compute client-side?
- How do you handle the "streak at risk" state? The streak isn't broken until the day ends — but "the day" depends on the user's timezone. How do you store and compare dates correctly?
- What indexes do you need? Consider queries by user + skill, user + date range, and user + skill + date range.

## Authentication

Implement real user authentication — not simulated or mocked.

**Required flows:**

- Sign up (email + password minimum)
- Sign in
- Sign out
- Password reset
- Session persistence across browser refreshes

**Recommended:** Use your database provider's built-in auth (Supabase Auth, Firebase Auth) or a dedicated auth service (Clerk, Auth0, NextAuth).

**Guest mode:** Must work without authentication. Guest data is session-scoped and does not persist.

## Deployment

Deploy to a live, publicly accessible URL.

**Recommended platforms:** Vercel, Netlify, Render, Fly.io, or equivalent.

**Requirements:**

- Accessible via HTTPS
- No local-only dependencies (everything works for any visitor)
- Environment variables properly configured (no exposed secrets)
- Reasonable cold start time if using serverless

## Performance Targets

| Metric | Target |
|--------|--------|
| Landing page Time to Interactive | < 2 seconds |
| Dashboard load (after auth) | < 3 seconds |
| Session log save (perceived) | < 1 second |
| Heatmap render (12 months) | < 500ms |
| Scrolling through 100+ sessions | Smooth (60fps, no jank) |
| Layout shift during load | Minimal (use skeletons/placeholders) |

### Lighthouse Benchmarks

Run Lighthouse on your deployed site. Target scores:

| Category | Target |
|----------|--------|
| Performance | > 85 |
| Accessibility | > 90 |
| Best Practices | > 90 |

Include your Lighthouse scores in your README.

## Technology Choice

This challenge is **framework-agnostic**. Use whatever you're most productive with.

**Common choices:**

- Next.js, Nuxt, SvelteKit, Remix, Astro (full-stack frameworks)
- React, Vue, Svelte, Solid (with separate backend)
- Any other approach that meets the requirements

The starter files provide CSS custom properties and a Tailwind v4 config, but neither CSS nor Tailwind is required. Use whatever styling approach you prefer.

## Frontend-Only Alternative

The sections above describe the recommended full-stack approach. If you're focused on frontend development and not ready to implement authentication and a database, you can build a frontend-only version instead. Everything below explains what changes and what stays the same.

**What replaces the database:**

Use localStorage (or IndexedDB for larger datasets) to persist all user data: skills, practice sessions, streaks, goals, and preferences. Be aware that localStorage has a ~5 MB limit per origin and that all data lives in a single browser — there is no cross-device sync.

**What changes in the product experience:**

- No authentication — the app is single-user with no sign-up, sign-in, or password reset flows
- No "guest mode" concept — there is just the app, and everyone who opens it is the user
- The landing page has a single CTA ("Get Started" or "Start Tracking") instead of dual sign-up and guest buttons
- No cross-device sync — switching browsers or clearing storage means starting over
- Pre-loaded sample data becomes the default starting state rather than a guest-specific experience

**What stays the same:**

- All skill management, session logging, streak tracking, and heatmap features
- Dashboard and progress visualization design challenges
- Deployment to a live, publicly accessible URL
- The performance targets listed above

**Tradeoff to consider:**

Both paths produce strong portfolio pieces. The full-stack version demonstrates additional skills (auth flows, database design, protected routes, data modeling), while the frontend-only version lets you focus on UI/UX craft, data visualization, state management, and frontend engineering. Choose the path that matches your current skill level and learning goals.
