# Design Challenges

These features require you to make genuine product decisions. There's no single right answer — your solution should reflect your understanding of the users, your design taste, and thoughtful trade-offs.

For each, document your approach and reasoning in your README.

---

## 1. Dashboard & Progress Visualization

**The problem:** The dashboard is the heart of the product — it's where users check in daily, see their progress, and decide what to practice next. But "show some stats" isn't a design. How do you organize skills, streaks, hours, session history, and the heatmap into a layout that feels motivating and scannable? What earns the biggest card? What gets tucked into a corner? The dashboard should make users feel good about their progress without requiring them to dig.

**Suggested approach:** A bento-style grid with asymmetric card sizes works well here — one large "featured skill" card, smaller skill cards, a heatmap section, and a recent sessions list. But there are many valid approaches. Consider what data is most motivating at a glance.

**Design this:**

- What gets the most visual real estate on the dashboard? The featured/most-practiced skill? The overall streak? The heatmap? How do you decide what's "most important"?
- How do you represent progress for each skill? Progress rings, bars, radial charts, numbers, or something else? How do multiple skills coexist visually without competing for attention?
- How does the heatmap integrate with the rest of the dashboard? Is it a prominent card or a supporting element? Does it show all skills combined or can users filter?
- What does the dashboard look like for a new user with 1 skill and 2 sessions vs. a power user with 8 skills and 200 sessions? Both should feel complete, not empty or overwhelming.
- How do you surface "what to practice next"? Is there a nudge based on streaks at risk, skills with no recent sessions, or goals falling behind?

**Questions to consider:**

- Should the dashboard auto-select a "featured" skill (most recently practiced, longest streak, most hours), or should the user pin their focus skill?
- How much session history belongs on the dashboard vs. a dedicated view? 3 entries? 5? Just today's?
- What's the right balance between celebration ("12-day streak!") and information ("47.5 hours total")? Too much celebration feels hollow; too much data feels clinical.
- How does the dashboard change over time — does it look different after 1 week vs. 3 months of use?

---

## 2. Session Logging UX

**The problem:** Session logging is the most frequent interaction in the app. If it's slow, annoying, or requires too many taps, users will stop tracking. But if it's too minimal, the data loses value. The challenge is designing an input flow that captures meaningful data (duration, skill, optional notes) in under 30 seconds — ideally feeling satisfying rather than tedious.

**Suggested approach:** A quick-add flow accessible from the dashboard (not buried in a sub-page) works well. Consider whether a modal, inline form, slide-up panel, or dedicated page is the right interaction pattern. Think about what fields are required vs. optional, and what smart defaults reduce friction.

**Design this:**

- What's the primary entry point for logging a session? A floating action button? A prominent "Log Session" button on the dashboard? An inline form on each skill card? Something else?
- How does the user input duration? A number field in minutes? A slider? Quick presets ("15 min", "30 min", "1 hour")? A combination?
- What happens after a session is logged? A confirmation message? An animation showing the streak extending? An immediate return to the dashboard with updated stats? How do you make the moment feel rewarding?
- How do notes work? Always visible? Expandable? Optional with a subtle "Add notes" link? How much text is reasonable?
- Can users log a session for a previous day (backfilling missed entries)? How does the date picker work without adding friction for the common case (logging today's session)?

**Questions to consider:**

- Should the log form remember the last skill used as a default? What about duration?
- Is there value in a "quick log" (just skill + duration, one tap) vs. a "detailed log" (date, notes, rating)?
- How do you prevent accidental double-logging? If a user logs "30 min Guitar" and immediately hits the button again, what happens?
- Could the timer feature (Stretch) replace manual duration entry entirely, or should both paths coexist?
