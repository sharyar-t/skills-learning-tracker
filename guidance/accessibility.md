# Accessibility Requirements: Skills Learning Tracker

## WCAG 2.1 AA Compliance Checklist

This checklist covers the accessibility requirements for Skills Learning Tracker. All items are required unless marked as recommended.

### Perceivable

#### Text & Color

- [ ] All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- [ ] Color is never the sole means of conveying information (e.g., streak status uses icons + color, not just color)
- [ ] Progress rings convey their value through text (percentage or hours) in addition to the visual fill
- [ ] Heatmap intensity is distinguishable without relying solely on color — consider opacity, patterns, or text labels in tooltips
- [ ] Streak status (active, at risk, broken) uses icons or text in addition to color (e.g., flame icon for active, warning icon for at risk)
- [ ] Links are distinguishable from surrounding text without relying on color alone (underline or other indicator)

#### Images & Media

- [ ] All decorative elements (card backgrounds, dividers, icons used purely for decoration) use `alt=""` or are CSS-only
- [ ] Skill color indicators have text alternatives — don't rely on the colored circle alone to communicate which skill is which
- [ ] No images of text (use real text for all UI elements including stat callouts and card labels)

#### Structure

- [ ] Proper heading hierarchy (h1 for page title, h2 for dashboard sections, h3 for individual skill cards — no skipped levels)
- [ ] Landmark regions used appropriately (`<nav>` for top bar, `<main>` for dashboard content, `<aside>` for supplementary widgets if applicable)
- [ ] Session lists use `<ul>` / `<li>` for lists of sessions
- [ ] Dashboard cards use appropriate semantic grouping (list of skills, not just floating divs)
- [ ] Page titles are descriptive and unique per view (e.g., "Dashboard — SkillTrack", "Spanish — SkillTrack", "Log Session — SkillTrack")

### Operable

#### Keyboard

- [ ] All interactive elements are reachable via Tab key
- [ ] Focus order follows a logical reading sequence — top bar, then dashboard cards (left-to-right, top-to-bottom), then secondary content
- [ ] Focus is visible on all interactive elements (`:focus-visible` styling)
- [ ] No keyboard traps — users can always Tab away from a component
- [ ] Modal/dialog focus is trapped within the dialog and restored on close (e.g., session log dialog, delete confirmation)
- [ ] Custom keyboard shortcuts (if implemented) don't conflict with assistive technology
- [ ] Skip link provided to bypass top bar and jump to main dashboard content
- [ ] Heatmap is keyboard navigable — arrow keys to move between days, Enter or Space to show tooltip

#### Navigation

- [ ] Current page/section is indicated in navigation (`aria-current="page"`)
- [ ] Clear location indicators provided (e.g., skill name in page title when viewing skill detail)
- [ ] Back button / navigation works predictably — especially from skill detail back to dashboard
- [ ] Multiple ways to reach a skill's detail view (dashboard card, session history link, direct URL)

#### Timing

- [ ] No time limits on interaction (guest session is an exception — document it)
- [ ] Animations respect `prefers-reduced-motion` media query — especially progress ring fills, streak animations, and heatmap transitions
- [ ] If a session timer is implemented, it doesn't auto-submit or auto-discard — the user controls when to save
- [ ] Auto-refresh of dashboard data doesn't disrupt the user's current focus

### Understandable

#### Forms & Input

- [ ] All form fields have visible labels (not just placeholder text) — especially skill name, duration, date, and notes inputs
- [ ] Error messages are specific and associated with the relevant field (via `aria-describedby`)
- [ ] Required fields are indicated both visually and programmatically (`aria-required`)
- [ ] Form submission errors don't clear already-entered data
- [ ] Duration input provides clear format guidance ("Minutes, e.g., 45 or 1h 30m")
- [ ] Date picker is keyboard-accessible and provides clear feedback about the selected date

#### Language & Content

- [ ] Page language is set (`<html lang="en">`)
- [ ] Error messages use plain language, not technical jargon ("Couldn't save your session" not "Database write failed with error 500")
- [ ] Streak and progress terminology is consistent throughout the app

### Robust

#### Assistive Technology

- [ ] Valid, well-structured HTML
- [ ] ARIA attributes used correctly (roles, states, properties)
- [ ] Dynamic content changes announced via `aria-live` regions — especially: session logged confirmation, streak update, timer state changes
- [ ] Custom components (dropdowns, modals, date pickers, duration input) follow ARIA authoring practices
- [ ] Dashboard cards are announced in a meaningful order by screen readers — skill name, key stats, status

#### Interactive Components

- [ ] Dropdown menus (skill selector, sort options) are keyboard accessible and announce their state (expanded/collapsed)
- [ ] Toggle buttons (dark mode, timer start/pause) announce their state (pressed/not pressed)
- [ ] Loading states are announced to screen readers ("Loading your dashboard...", "Saving session...")
- [ ] Delete confirmations are announced and focusable ("Are you sure you want to delete this skill? This will remove all sessions.")
- [ ] Session log form submission announces the result ("Session saved: 45 minutes of Guitar")

## Skills Learning Tracker-Specific Accessibility Considerations

### Progress Rings

- Progress rings must convey their value to screen readers via `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` (e.g., `aria-label="Spanish progress: 75% of goal"`)
- Don't communicate progress only through the visual ring fill — include a text value (percentage, hours) visible to all users
- For SVG-based rings, ensure the SVG has appropriate `role` and text alternative

### Heatmap Calendar

- The heatmap grid is a data visualization — provide a text summary for screen readers (e.g., "Practice heatmap: 45 active days out of 90, most active on weekends")
- Individual day cells should be navigable and announce their data: "March 15: 1 hour 30 minutes — Spanish (45 min), Guitar (45 min)"
- Don't rely on color intensity alone — the tooltip/popup content is essential for accessibility
- Consider providing a "list view" alternative to the heatmap for users who prefer a linear data presentation

### Streak Indicators

- Streak numbers must be announced with context: "Current Guitar streak: 12 days" not just "12"
- Streak status changes (active to at-risk, or at-risk to broken) should be announced via `aria-live` if they change while the user is on the page
- The flame/fire icon for active streaks should have meaningful alt text or be accompanied by "Active streak" text

## Recommended (Beyond AA)

These go beyond minimum compliance and signal strong accessibility awareness:

- [ ] Customizable font size for session notes and statistics
- [ ] High contrast mode option with WCAG AAA ratios
- [ ] Reduced motion mode that eliminates all non-essential animation (ring fills, streak celebrations, heatmap transitions)
- [ ] Screen reader testing with at least one of: VoiceOver (Mac), NVDA (Windows), or TalkBack (Android)
- [ ] Focus-visible styling that integrates with the emerald brand aesthetic — not just a default blue outline
- [ ] Alternative data table view for heatmap data (accessible to users who can't interpret the visual grid)
- [ ] Keyboard shortcut reference accessible via `?` key (if keyboard shortcuts are implemented)

## Testing

Before submission, verify:

1. Navigate the entire app using only the keyboard — add a skill, log a session, browse the heatmap, view skill details
2. Use a screen reader to complete the core tracking workflow
3. Check all pages with a contrast checker tool — pay special attention to the emerald palette, which needs careful contrast management against light backgrounds
4. Test with browser zoom at 200% — dashboard cards should reflow, not overflow
5. Test with `prefers-reduced-motion: reduce` enabled — progress rings and streak animations should be instant, not animated
6. Run an automated audit (Lighthouse, axe, or WAVE)
