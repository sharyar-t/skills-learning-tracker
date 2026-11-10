# UI/UX Patterns: Skills Learning Tracker

## Patterns to Follow

### Dashboard & Widget Cards

- The dashboard is a bento-style grid — cards at different sizes based on importance, not a uniform grid
- The most-practiced or most-recently-active skill should get the largest card with a prominent progress ring, total hours, and current streak
- Smaller skill cards show compact stats: skill name, color indicator, hours, and a small progress ring or bar
- Each card should feel self-contained — a user glancing at one card should understand that skill's status without reading others
- Cards should have consistent padding and border radius, with subtle shadows to create depth without heaviness
- Numbers (hours, streaks, sessions) should be the most prominent text in each card — they're what users scan for
- Use the skill's assigned color as an accent within each card (progress ring color, left border, or background tint) to create visual differentiation

### Progress Rings & Visualization

- Progress rings are the primary visual metaphor — use them for skill progress toward goals, daily activity, and overall completion
- Rings should use the accent green (or skill-specific color) on a light gray track
- Show the percentage as a large number inside the ring — the ring is visual, the number is precise
- For skills without a goal, show total hours prominently instead of a ring
- The heatmap calendar should be dense and compact — small squares with color intensity conveying information
- Heatmap tooltips should appear on hover (desktop) and tap (mobile) with useful detail

### Streak Display

- Streaks are the core motivation mechanic — display them prominently with a warm visual treatment (flame icon, amber color)
- Current streak should be visible on the dashboard without scrolling
- "Streak at risk" (no practice today yet) should use a distinct visual state — a dimmed flame, a warning color, or a gentle nudge, not an alarm
- Longest streak should be visible but secondary — it's a historical record, not a daily motivator
- When a streak extends (new session logged), the UI should react with a small celebration (number animates, flame brightens)

### Session Logging

- Session logging must be accessible from the dashboard — not hidden behind navigation
- The log form should default to sensible values: today's date, the most recently practiced skill
- Duration input should accept flexible formats and offer quick presets (15m, 30m, 45m, 1h)
- Notes should be optional and collapsible — visible for users who want them, out of the way for quick loggers
- After logging, return the user to the dashboard with immediately updated stats (optimistic UI)
- The confirmation should feel rewarding — a brief visual acknowledgment that makes logging feel worthwhile, not just a data entry task

### Navigation & Information Architecture

- Minimal top bar with brand name on the left and user avatar on the right — no traditional sidebar or heavy nav
- Navigation between dashboard, skill details, and session history through card interactions and contextual links rather than a global nav menu
- Mobile: simplified top bar, cards stack vertically, session logging accessible via a floating action button or prominent button
- Current location should be obvious — highlight the active skill, use breadcrumbs for skill detail views
- The dashboard is the home base — every navigation path should return there easily

### Loading & Empty States

- Skeleton screens for dashboard cards — match the shape of real cards (ring placeholder, text lines)
- Spinner or progress indicator for session save operations
- Empty skill state: "Add your first skill to start tracking. What are you learning?" — warm and encouraging
- Empty session state for a skill: "No sessions logged yet. Start practicing and log your first session." — actionable, not critical
- Empty heatmap: Show the grid structure with empty/lightest squares — the shape itself communicates "fill me in"
- Error states should be specific: "Couldn't save your session. Check your connection." not "Something went wrong"

### Responsive Behavior

- Dashboard grid adapts fluidly: 3-4 columns on desktop, 2 columns on tablet, single column on mobile
- Progress rings scale proportionally — don't show tiny rings that are hard to read on mobile
- Heatmap adapts for mobile: fewer columns (show recent months), or horizontal scroll with snap points
- Session logging form should be comfortable on mobile — large input fields, prominent save button
- Touch targets minimum 44x44px on mobile — especially heatmap squares, skill cards, and form buttons
- Numbers remain legible across all breakpoints — keep stat callouts large enough to scan at a glance

## Anti-Patterns to Avoid

### Information Overload

- Don't show all sessions for all skills on the dashboard — keep it to 4-5 recent entries with a "View all" link
- Don't display every stat for every skill on the main grid — hours and streak are enough; save detailed stats for the skill detail view
- Don't use more than 2 font sizes in a single card — keep cards visually simple
- Don't make the heatmap the dominant dashboard element — it's supporting context, not the primary information

### Aggressive UI

- Don't shame users for broken streaks — a broken streak is just a reset, not a failure. Avoid red alerts or disappointed messaging
- Don't gate guest features behind sign-up prompts — let guests explore freely, prompt gently
- Don't use modals for routine actions (logging a session should be possible without a full-screen takeover)
- Don't auto-play animations or transitions that distract from scanning the dashboard
- Don't show "upgrade" or "sign up" banners that cover practice data

### Layout Pitfalls

- Consider whether this product really needs a sidebar — a minimal top bar works well for a focused tracker with limited navigation. A sidebar can add weight that a simple product doesn't need
- Don't use horizontal scrolling for the dashboard on mobile (vertical scroll with stacked cards is more natural)
- Don't let the dashboard grid stretch to full page width on ultrawide screens — constrain to a comfortable reading/scanning width
- Don't mix card sizes inconsistently — the bento grid should have a clear visual logic (hero card is biggest, secondary skills are uniform)
- Don't stack more than 6-8 skills on the main dashboard without a "show more" pattern — too many cards creates scroll fatigue

### Performance

- Don't re-render the entire heatmap on every session log — update only the affected day
- Don't fetch full session history on dashboard load — fetch summary data and let users drill into details on demand
- Don't block the dashboard while streak calculations run — show the dashboard immediately with streaks loading asynchronously if needed
- Don't animate progress rings on every scroll into view — animate once on initial load, then hold steady
- Don't render 12 months of heatmap data simultaneously on mobile — paginate or limit the initial view

### Error Handling

- Don't show raw error messages or stack traces to users
- Don't silently fail when a session save fails — tell the user and offer a retry
- Don't let a single broken skill (corrupted data) crash the entire dashboard — handle per-skill errors gracefully
- Don't discard form data on error — if a session save fails, preserve the user's input for retry
