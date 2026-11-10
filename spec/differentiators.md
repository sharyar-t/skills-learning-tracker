# Differentiators

Differentiators are optional but recommended. Pick 1-2 if you want to push the project further and showcase deeper expertise.

Each one demonstrates a specific skill area and meaningfully changes the user experience. Choose based on your interests and the skills you want to showcase.

Document your choice, implementation approach, and what you learned in your README.

---

## 1. Animated Progress & Micro-Interactions

**Skill area:** Frontend craft / UX polish

Build rich, satisfying micro-interactions that make logging practice and viewing progress feel tactile and rewarding — turning data updates into small moments of delight.

**What to build:**

- Progress rings animate smoothly when values change (fill from previous value to new value with an easing curve)
- Streak counter increments with a subtle "count up" animation when a new session extends the streak
- Heatmap squares fade in on load with a staggered animation (like a wave across the calendar)
- Session log confirmation includes a satisfying visual moment — a checkmark animation, a brief confetti burst, or a streak flame that pulses
- Skill cards have hover/tap interactions: subtle lift, shadow increase, slight scale
- Dashboard cards transition smoothly when data updates (numbers count up/down, not instant swap)
- All animations respect `prefers-reduced-motion` — graceful fallbacks, not broken UI

**Why this is impressive:** Micro-interactions that feel natural and satisfying are one of the hardest frontend skills to execute well. They require understanding of CSS transitions, animation timing, spring physics, and the fine line between "delightful" and "distracting." A skill tracker with satisfying progress animations demonstrates an eye for polish that employers notice immediately.

---

## 2. AI-Powered Practice Insights

**Skill area:** AI integration

Use AI to analyze practice patterns and generate personalized insights, recommendations, and encouragement based on the user's session history.

**What to build:**

- Weekly practice summary — AI generates a natural language summary of the user's week: "You practiced 4 days this week, focusing mostly on Spanish (3h 15m). Your Guitar streak is at risk — you haven't played since Tuesday."
- Practice pattern insights — "You tend to practice more on weekends. Consider adding a short weekday session to build consistency."
- Session reflection prompts — After logging a session, suggest a reflection question relevant to the skill: "What's one thing you learned in today's Spanish session?"
- Streak motivation — When a streak is at risk, generate a personalized nudge: "You're 1 session away from your longest Guitar streak ever. 15 minutes today keeps it alive."
- Skill milestone recognition — "You've now logged 50 hours of TypeScript. That's more than most people invest in a new skill in a year."

**Why this is impressive:** AI integration is a skill employers actively seek. Building it well means handling API costs, latency, caching AI responses, graceful fallbacks when the AI service is unavailable, and UX that makes AI feel like a supportive coach rather than a generic chatbot. The personalization based on real user data is what makes this compelling.

---

## 3. Data Export & Sharing Cards

**Skill area:** Performance / Frontend craft

Generate beautiful, shareable images of practice achievements that users can post to social media — similar to Strava's activity summaries or Spotify Wrapped cards.

**What to build:**

- Generate shareable cards for: weekly practice summary, skill milestone (50h, 100h), streak achievement (30 days, 100 days), monthly recap
- Cards render as downloadable images (Canvas API or server-side image generation)
- Cards include the user's data (hours, streaks, skill names) laid out attractively with progress visualizations
- Multiple card templates/styles — the user can choose their preferred look
- Preview the card in-app before downloading
- Export all session data as CSV or JSON for personal records or migration
- Cards are optimized for social media dimensions (1080x1080 for Instagram, 1200x675 for Twitter/LinkedIn)

**Why this is impressive:** Programmatic image generation is a technically fascinating challenge — it requires understanding of Canvas API or server-side rendering, responsive layout within fixed dimensions, and font rendering. The shareable cards also create the most viral artifact possible — every share markets the developer's project.

---

## 4. Accessibility-First Practice Tracker

**Skill area:** Accessibility

Go beyond WCAG compliance to create a truly inclusive skill tracking experience that works beautifully for all users.

**What to build:**

- Full screen reader experience with proper ARIA landmarks, labels, and live regions for all dynamic content (session logged confirmation, streak updates, timer state changes)
- Reduced motion mode that replaces all animations with instant state changes
- High contrast mode with WCAG AAA contrast ratios
- Customizable font size for comfortable reading of session notes and statistics
- Focus-visible styling that's both functional and aesthetically integrated with the brand
- Keyboard navigation optimized for the tracking workflow: log a session, navigate between skills, and browse history without touching a mouse
- Color-blind safe progress indicators — progress rings and heatmap never rely on color alone (use patterns, labels, or opacity in addition to hue)
- Heatmap with text alternatives — screen readers announce daily practice summaries, not just grid positions
- Accessibility statement page documenting what was implemented and tested

**Why this is impressive:** Accessibility-first development signals care for all users. Going beyond basics into custom preferences, comprehensive ARIA for dynamic data visualizations, and reduced motion demonstrates deep expertise. A heatmap that works for screen reader users is a genuinely hard and interesting problem to solve well.
