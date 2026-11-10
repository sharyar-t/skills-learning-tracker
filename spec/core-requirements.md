# Core Requirements

These features are organized into two tiers. **Core** gives you a complete, impressive product. **Stretch** takes it to the next level. The remaining features (dashboard & progress visualization, session logging UX) are design challenges where you make the product decisions — see `design-challenges.md`.

Completing Core + a design-it-yourself feature + a differentiator is a strong portfolio piece.

---

# Core

These 9 features form a complete skill tracking app. A fully working product with authentication, guest access, skill management, session logging, streak tracking, and a polished landing page.

---

## 1. Skill Management

Users can create and manage the skills they're tracking.

**Acceptance criteria:**

- Create a new skill with a name (e.g., "Spanish", "Guitar", "TypeScript")
- Optionally assign a color to each skill from a curated palette (for visual differentiation on the dashboard and heatmap)
- Optionally set a weekly or total-hours goal per skill (e.g., "5 hours/week" or "100 hours total")
- Edit skill name, color, and goal after creation
- Delete a skill (with confirmation — this removes all associated sessions)
- Display total hours logged, current streak, and session count per skill
- Handle the "no skills yet" state with helpful guidance ("Add your first skill to start tracking your practice")
- Support at least 10 skills per user without layout or performance issues

---

## 2. Session Logging

Users log individual practice sessions for a skill.

**Acceptance criteria:**

- Log a session with: skill (required), duration in minutes (required), date (defaults to today, can be changed to a past date), and optional notes
- Duration input accepts common formats: "45" (minutes), "1h 30m", or "1.5" (hours) — interpret flexibly
- Validate that duration is positive and reasonable (minimum 1 minute, warn but allow above 8 hours)
- Notes field supports multi-line text for session reflections
- Edit a logged session (change duration, date, notes, or skill)
- Delete a session (with confirmation)
- Sessions display in reverse chronological order (most recent first)
- Logging a session should feel fast — achievable in under 30 seconds from the dashboard
- After logging, the dashboard updates immediately (streaks, hours, heatmap)

---

## 3. Streak Tracking

Automatically calculate and display practice streaks per skill and overall.

**Acceptance criteria:**

- A "streak" is consecutive days with at least one logged session for a given skill
- Display the current streak per skill (e.g., "12-day streak")
- Display the longest streak ever achieved per skill
- Display an overall streak across all skills (any practice on a given day counts)
- Streak resets to 0 if a day is missed (the day with no sessions breaks the chain)
- Handle timezone edge cases — a session logged at 11:55 PM counts for that day, not the next
- Show a visual indicator when a streak is active vs. broken (e.g., flame icon for active, dimmed for broken)
- If a user hasn't practiced today, show the streak as "at risk" rather than immediately broken (it's only broken when the day ends without a session)

---

## 4. Heatmap Calendar

A visual calendar showing practice activity over time, similar to GitHub's contribution graph.

**Acceptance criteria:**

- Visualize practice activity over time, with color intensity based on total practice time per day (a heatmap grid is a common approach, but not the only one)
- Show at least 3 months of history (ideally 6-12 months, scrollable or paginated)
- Color intensity should reflect practice volume — at least 3-4 levels from "no practice" to "heavy practice day." You decide the thresholds
- Hovering or tapping a day shows a tooltip with: date, total time practiced, number of sessions, and which skills
- Support filtering the heatmap by a single skill or showing all skills combined
- Days in the future are visually distinct (dimmed or empty)
- Today is visually highlighted
- The heatmap is responsive — adapts layout for mobile (fewer columns or horizontal scroll)

---

## 5. Responsive Design

The app works well across devices.

**Acceptance criteria:**

- The layout adapts naturally across screen sizes — let your content dictate the breakpoints rather than targeting specific pixel values
- On smaller screens: cards stack vertically, touch-friendly tap targets
- On larger screens: take advantage of the space with multi-column layouts that give skills, stats, and the heatmap room to breathe
- No horizontal scrolling
- Navigation is accessible and usable on all screen sizes (minimal top bar adapts appropriately)
- Progress rings and heatmap squares are legible at all screen sizes
- Session logging is easy on mobile — no fiddly inputs or tiny tap targets
- Touch targets minimum 44x44px on mobile

---

## 6. User Authentication

Secure, personal experience.

**Acceptance criteria:**

- Sign up with email and password
- Sign in / sign out
- Password reset flow
- Persist all user data (skills, sessions, streaks, goals, preferences) per account
- Auth state persists across browser sessions
- Protected routes redirect unauthenticated users to sign-in
- Guest mode allows full exploration without an account (see "Try as Guest" requirements)

---

## 7. Landing Page

The first impression and entry point.

**Acceptance criteria:**

- Hero section with clear, compelling value proposition
- 3-4 feature highlights that communicate what makes the tracker useful (streaks, progress visualization, multi-skill tracking, session logging)
- Dual CTAs: "Sign Up" and "Try as Guest" — both prominent
- Visual showcase of the product — show progress rings, heatmap, or dashboard elements to give visitors a taste
- Responsive design that works well on mobile through desktop
- Visual quality that sets the professional tone for the entire product
- Fast load time (no heavy assets blocking render)

---

## 8. "Try as Guest" Experience

Visitors can explore the full app without creating an account. This is critical for portfolio value — when a hiring manager, colleague, or community member clicks your deployed link, they're not going to create an account. Guest mode is what lets them see your work.

**Acceptance criteria:**

- Single click from landing page enters guest mode
- Dashboard is pre-loaded with 6 skills and 47 practice sessions (see `data/` files)
- Sessions span the last 3-4 months with varied patterns — some skills practiced daily, some intermittently, some recently abandoned
- Guest sees active streaks, total hours, progress rings, and a populated heatmap
- Guest can browse the dashboard, view session history, and explore skill details
- Gentle prompts to sign up to save their data (not aggressive gating)
- Guest data is session-based (not persisted across visits unless they sign up)
- Clear messaging about what signing up unlocks (persistence, syncing, personal data)

---

## 9. Data Persistence

All user data stored in a real database.

**Acceptance criteria:**

- Use a real database service (Supabase, Firebase, Neon, PlanetScale, etc.)
- Store: user accounts, skills (name, color, goal, created date), sessions (skill, duration, date, notes, timestamps), user preferences
- Data persists across sessions and devices for authenticated users
- Efficient queries — don't fetch all sessions when only showing a summary
- Handle concurrent updates gracefully (multiple tabs, optimistic updates)

---

# Stretch

These features take the product to the next level. They build on the Core foundation and are recommended for developers who want to go deeper.

---

## 10. Dark Mode

Support light and dark color schemes.

**Acceptance criteria:**

- Detect system preference via `prefers-color-scheme` and apply automatically
- Manual toggle to override system preference
- Persist the user's choice across sessions
- All UI elements — including progress rings, heatmap squares, and streak indicators — look correct in both modes
- Smooth transition between modes (no flash of wrong theme on load)
- The brand kit provides both light and dark mode tokens — use them

---

## 11. Session Timer

A built-in timer for active practice sessions.

**Acceptance criteria:**

- Start a timer from the dashboard or a skill's detail view
- Timer runs in the foreground with a visible elapsed time display
- Pause and resume the timer
- When stopped, the elapsed time pre-fills the session log form (user can adjust before saving)
- Timer persists if the user navigates to a different page within the app
- Handle the case where the user closes the browser mid-timer — either warn on close or recover the session on return
- Timer state is clearly visible at all times while running (e.g., a persistent indicator in the top bar)

---

## 12. Skill Detail View

A dedicated page for each skill showing its complete history and statistics.

**Acceptance criteria:**

- Display: skill name, color, total hours, current streak, longest streak, total sessions, average session duration
- Show a session history list (reverse chronological) with duration, date, and notes preview
- Show the skill's individual heatmap (filtered to this skill only)
- Show weekly/monthly trends — hours practiced per week over time
- If the skill has a goal, show progress toward it (hours logged vs. target, pace indicator)
- Edit skill settings (name, color, goal) from this view
- Empty state for a skill with no sessions yet

---

## 13. Error Handling & Edge Cases

Gracefully handle unexpected states and edge cases.

**Acceptance criteria:**

- Loading states for dashboard data (skeleton screens or spinners)
- Empty states for all views (no skills, no sessions, no data for heatmap period)
- Handle network errors — don't show a blank screen if the database is temporarily unreachable
- Validate session inputs — prevent negative durations, future dates beyond today, and excessively long sessions
- Handle deletion gracefully — deleting a skill removes associated sessions, with clear confirmation
- Error states are specific and helpful ("Couldn't save your session. Check your connection and try again."), not generic
- Optimistic UI for session logging — show the new session immediately while saving in the background, with rollback on failure

---

## 14. Performance

The app must feel fast and responsive.

**Acceptance criteria:**

- Initial dashboard load completes in under 3 seconds
- Session logging (save) completes in under 1 second (perceived)
- Smooth scrolling through session history with 100+ entries
- Heatmap renders without visible jank, even with 12 months of data
- Time to interactive on landing page under 2 seconds
- No layout shifts during content loading (use skeleton screens or placeholders)
- Progress ring animations are smooth (60fps)
