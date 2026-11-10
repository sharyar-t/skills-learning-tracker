# Sample Data: Skills & Practice Sessions

## Files

| File | Format | Purpose |
|------|--------|---------|
| `sample-skills.json` | JSON | 6 skills with 47 practice sessions — use for seeding the guest experience |

The file contains 6 skills across different domains with 47 practice sessions spanning approximately 4 months, plus intentional data variations that test robust handling.

## Curated Skills (6 skills)

- **Spanish** — 14 sessions, most consistent practice. Demonstrates daily streaks and varied session types (flashcards, conversation, listening, reading).
- **Guitar** — 11 sessions, regular practice with occasional gaps. Mix of technique work and song learning.
- **TypeScript** — 6 sessions, intermittent practice. Shows a technical skill practiced less frequently with longer deep-dive sessions.
- **Cooking** — 5 sessions, weekly practice. Demonstrates longer session durations typical of hands-on skills.
- **AI Engineering** — 6 sessions, moderate consistency. Technical skill with project-based practice notes covering RAG pipelines, prompt engineering, and agent systems.
- **UI Design** — 5 sessions, newest skill (started February 2026). Shows early-stage progress in a creative-technical skill with notes on typography, color theory, and layout analysis.

These skills were chosen because they span technical, creative, and language domains that resonate with the target audience (developers), represent realistic practice patterns (some skills practiced daily, others weekly), include varied session durations (20-90 minutes), and provide enough data for a compelling heatmap and streak visualization.

## Data Structure

### Skills

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Skill display name |
| `color` | string | Hex color for visual differentiation |
| `goal` | object or null | Optional goal: `{ type: "weekly" | "total", targetHours: number }` |
| `createdAt` | ISO 8601 | When the skill was added |

### Sessions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `skillId` | string | References a skill |
| `durationMinutes` | number | Session length in minutes |
| `date` | YYYY-MM-DD | Practice date (local date, no timezone) |
| `notes` | string or null | Optional session reflection |
| `createdAt` | ISO 8601 | When the session was logged |

## Edge Cases

The sample data includes intentional variations that test robust session handling. These reflect real-world patterns you'll encounter building a practice tracker.

### Data Variations

| Edge Case | Where | What to Handle |
|-----------|-------|----------------|
| **Null notes** | 11 sessions (s-005, s-008, s-011, s-018, s-020, s-024, s-028, s-035, s-040, s-045, s-013) | `notes` is `null` — don't show an empty notes section, gracefully omit |
| **Very long session** | s-029 (90 min TypeScript), s-035 (90 min Cooking), s-039 (90 min AI Engineering) | Sessions over 60 minutes — should work fine but test that heatmap color scale handles heavy days |
| **Very short session** | s-022 (20 min Guitar), s-046 (20 min UI Design) | Short sessions are valid — don't dismiss or deprioritize them visually |
| **Null goal** | TypeScript (skill-3) | `goal` is `null` — skill detail and dashboard should not show goal progress UI for this skill |
| **Multiple sessions same day** | March 19 (Spanish + Guitar + AI Engineering + UI Design = 4 sessions) | Heatmap should aggregate all sessions for the day. Streak counts the day once, not per session |
| **Gaps in practice** | TypeScript has 5-7 day gaps; UI Design has 3-4 day gaps | Streak calculation should correctly identify broken streaks. Heatmap should show empty days clearly |
| **Weekend-heavy practice** | Spanish sessions cluster on weekends in early March | Pattern analysis (if implemented) should detect this |
| **Different goal types** | Spanish: weekly hours, Guitar: total hours, Cooking: weekly hours, AI Engineering: total hours, UI Design: weekly hours | Dashboard and skill detail should handle both goal types with appropriate progress visualization |

### Streak Patterns

| Skill | Current Streak (as of March 19) | Longest Streak | Pattern |
|-------|-------------------------------|----------------|---------|
| Spanish | 8 days (Mar 12-19, with gap on Mar 11) | 8 days | Consistent recent practice |
| Guitar | 8 days (Mar 12-19) | 8 days | Matches Spanish — daily practice burst |
| TypeScript | 3 days (Mar 16-18) | 3 days | Short recent burst after gap |
| Cooking | 0 days (last session Mar 17) | 2 days | Streak broken — 2-day gap |
| AI Engineering | 1 day (Mar 19 only) | 1 day | Sporadic practice |
| UI Design | 2 days (Mar 18-19) | 2 days | New skill, building habit |

### Aggregate Stats

| Metric | Value |
|--------|-------|
| Total sessions | 47 |
| Total hours | ~34 hours |
| Most practiced skill | Spanish (~9.4 hours) |
| Least practiced skill | UI Design (~2.5 hours) |
| Longest individual session | 90 minutes (TypeScript, Cooking, AI Engineering) |
| Shortest individual session | 20 minutes (Guitar, UI Design) |
| Days with practice (unique) | ~28 days across the dataset |

## Using the Sample Data

### For the Guest Experience

Use `sample-skills.json` to seed the guest dashboard. The 6 skills with 47 sessions provide a visually compelling first impression with active streaks, varied progress, and a populated heatmap.

**Recommended approach:**
1. On "Try as Guest", load the sample data into the session
2. Calculate current streaks from the session dates relative to today's date (you may need to shift dates forward to keep streaks "alive" for the demo)
3. Populate the heatmap with the session data — the spread across November 2025 through March 2026 provides good density
4. Show Spanish as the "featured" or most-prominent skill (most hours, longest streak)
5. Show all 6 skills on the dashboard with their respective stats

**Date shifting note:** The sample dates are anchored around March 2026. If you're building at a different time, you may want to shift all dates forward so the "current" streaks are actually current relative to today. A simple offset calculation preserves all the relative patterns (gaps, streaks, clustering) while keeping the data fresh.

### For Development & Testing

The data is designed to exercise common calculation scenarios:

- Streak calculation with gaps and multiple sessions per day
- Heatmap color scaling across varied session durations
- Goal progress with both weekly and total-hours goals
- Aggregate statistics across multiple skills
- Null handling for optional fields (notes, goals)

**Note:** Session dates use the `YYYY-MM-DD` format without timezone information. The `createdAt` timestamps are in UTC. Your app should handle the distinction between "practice date" (local date) and "created timestamp" (precise moment) appropriately.
