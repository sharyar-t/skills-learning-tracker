# Brand Kit: Skills Learning Tracker

## Mood & Tone

**Energizing but focused.** The UI feels like a personal coach — motivating without being pushy, celebrating consistency without guilt-tripping gaps. Every screen should make the user feel like their practice time matters.

- Motivating but not aggressive
- Clean but not sterile
- Playful but not childish
- Data-rich but not overwhelming

This is a tool for people who are investing in themselves. It should feel like checking your running stats after a good workout — satisfying, clear, and encouraging you to keep going.

## Design Inspiration

Explore these products for inspiration — they solve similar problems with different design approaches:

- [Duolingo](https://duolingo.com) — Gamified learning with streaks, XP, and daily goals. Draw from: the streak motivation system, the celebratory moments on completion, and the way progress feels tangible and rewarding.
- [Strava](https://strava.com) — Activity tracking for athletes with personal stats and social sharing. Draw from: the clean activity feed, the way personal bests are highlighted, and the balance between data density and readability.
- [Forest](https://forestapp.cc) — Focus timer that grows virtual trees. Draw from: the visual metaphor for consistency, the satisfying completion animations, and the calm-but-motivating aesthetic.
- [GitHub Contribution Graph](https://github.com) — The heatmap calendar that's become iconic for visualizing consistency. Draw from: the information density of the grid, the color scale communication, and how satisfying it is to fill in squares.

There's no single right design for Skills Learning Tracker. These examples show the range of valid approaches — from gamified and playful to minimal and data-focused. If you're going in your own design direction, spend some time exploring other habit and progress tracking apps to build your own reference library before you start building.

The `preview.jpg` in the repo root shows these tokens applied to Skills Learning Tracker's dashboard. Use it as a reference for how the brand kit comes together — it's a concept image, not a pixel-perfect spec.

## Color Palette

### Light Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#FAFAF8` | Main background — warm off-white with a hint of green |
| `--color-bg-secondary` | `#F2F2EE` | Card backgrounds, secondary areas |
| `--color-bg-tertiary` | `#E8E8E3` | Hover states, subtle backgrounds |
| `--color-surface` | `#FFFFFF` | Elevated cards, dashboard widgets |
| `--color-border` | `#DDDDD6` | Borders, dividers |
| `--color-border-subtle` | `#E8E8E2` | Subtle separators |
| `--color-text-primary` | `#1A1D1A` | Headings, primary text — deep near-black with green undertone |
| `--color-text-secondary` | `#4A524A` | Body text, descriptions |
| `--color-text-tertiary` | `#7A837A` | Metadata, timestamps, muted text |
| `--color-accent` | `#059669` | Primary actions, links, active states — emerald green |
| `--color-accent-hover` | `#047857` | Hover on accent elements |
| `--color-accent-subtle` | `#ECFDF5` | Accent backgrounds, selected states |
| `--color-success` | `#16A34A` | Streak active, goal completed, session saved |
| `--color-warning` | `#D97706` | Streak at risk, goal behind pace |
| `--color-error` | `#DC2626` | Errors, destructive actions, streak broken |
| `--color-streak` | `#F59E0B` | Streak flame icon, streak badges — warm amber |
| `--color-progress` | `#059669` | Progress rings, progress bars |
| `--color-heatmap-empty` | `#EAEDE8` | Heatmap days with no practice |
| `--color-heatmap-light` | `#A7F3D0` | Heatmap light activity (<30 min) |
| `--color-heatmap-medium` | `#34D399` | Heatmap moderate activity (30-60 min) |
| `--color-heatmap-heavy` | `#059669` | Heatmap heavy activity (60+ min) |

### Dark Mode

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg-primary` | `#131614` | Main background — deep green-black |
| `--color-bg-secondary` | `#1C201C` | Card backgrounds, secondary areas |
| `--color-bg-tertiary` | `#262B26` | Hover states, subtle backgrounds |
| `--color-surface` | `#1C201C` | Elevated cards, dashboard widgets |
| `--color-border` | `#333A33` | Borders, dividers |
| `--color-border-subtle` | `#262B26` | Subtle separators |
| `--color-text-primary` | `#ECF0EC` | Headings, primary text |
| `--color-text-secondary` | `#A0AAA0` | Body text, descriptions |
| `--color-text-tertiary` | `#6B766B` | Metadata, timestamps, muted text |
| `--color-accent` | `#34D399` | Primary actions, links, active states |
| `--color-accent-hover` | `#6EE7B7` | Hover on accent elements |
| `--color-accent-subtle` | `#1A2E22` | Accent backgrounds, selected states |
| `--color-success` | `#4ADE80` | Streak active, goal completed |
| `--color-warning` | `#FBBF24` | Streak at risk, goal behind pace |
| `--color-error` | `#F87171` | Errors, destructive actions |
| `--color-streak` | `#FBBF24` | Streak flame icon, streak badges |
| `--color-progress` | `#34D399` | Progress rings, progress bars |
| `--color-heatmap-empty` | `#1E231E` | Heatmap days with no practice |
| `--color-heatmap-light` | `#065F46` | Heatmap light activity |
| `--color-heatmap-medium` | `#059669` | Heatmap moderate activity |
| `--color-heatmap-heavy` | `#34D399` | Heatmap heavy activity |

## Typography

### Font Stack

| Usage | Font | Fallback |
|-------|------|----------|
| Headings | `Space Grotesk` | `system-ui, -apple-system, sans-serif` |
| Body / UI | `Inter` | `system-ui, -apple-system, sans-serif` |
| Code (if needed) | `JetBrains Mono` | `'SF Mono', 'Fira Code', monospace` |

Space Grotesk is a modern, geometric sans-serif with distinctive character — techy yet approachable, with proportional spacing that gives headlines a confident, contemporary feel. Inter provides clean, highly legible UI text with excellent support for numbers and data-dense layouts. Together they create a "productivity tool meets personal journal" aesthetic.

### Type Scale

Based on a 1.25 ratio (major third), anchored at 16px body.

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 0.75rem | 400 | 1.45 | Metadata, heatmap tooltips, timestamps |
| `--text-sm` | 0.8125rem | 400 | 1.45 | Secondary text, session details, streak labels |
| `--text-base` | 1rem | 400 | 1.6 | Body text, session notes, UI text |
| `--text-lg` | 1.25rem | 500 | 1.4 | Skill names in cards, section headers |
| `--text-xl` | 1.5625rem | 600 | 1.3 | Page titles, widget headings |
| `--text-2xl` | 1.9375rem | 600 | 1.25 | Dashboard stat callouts, hero subheading |
| `--text-3xl` | 2.4375rem | 700 | 1.2 | Landing page hero heading |

### Line Heights

| Token | Value | Used with |
|-------|-------|-----------|
| `--leading-tight` | 1.2 | `--text-3xl` |
| `--leading-snug` | 1.25 | `--text-2xl` |
| `--leading-normal` | 1.3 | `--text-xl` |
| `--leading-relaxed` | 1.4 | `--text-lg` |
| `--leading-loose` | 1.45 | `--text-xs`, `--text-sm` |
| `--leading-prose` | 1.6 | `--text-base` (body text, session notes) |

The type scale table above shows which line height each text size uses. In `tokens.css`, line heights are independent custom properties — pair them with text sizes as shown, or adjust as needed.

### Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--font-regular` | 400 | Body text, session notes, metadata |
| `--font-medium` | 500 | Skill names, nav items, emphasis |
| `--font-semibold` | 600 | Section headings, buttons, stat labels |
| `--font-bold` | 700 | Hero headings, large stat numbers, strong emphasis |

## Spacing

Based on a 4px base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 0.25rem | Tight gaps, icon padding, heatmap square gaps |
| `--space-2` | 0.5rem | Inline spacing, small gaps, badge padding |
| `--space-3` | 0.75rem | Compact element spacing, skill card gaps |
| `--space-4` | 1rem | Standard element spacing |
| `--space-5` | 1.25rem | Medium section gaps |
| `--space-6` | 1.5rem | Card padding, widget spacing |
| `--space-8` | 2rem | Section spacing |
| `--space-10` | 2.5rem | Large section gaps |
| `--space-12` | 3rem | Major section breaks |
| `--space-16` | 4rem | Page-level spacing |
| `--space-20` | 5rem | Hero spacing, large gaps |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.25rem | Small elements, badges, heatmap squares |
| `--radius-md` | 0.5rem | Buttons, inputs, streak badges |
| `--radius-lg` | 0.75rem | Cards, dashboard widgets, modals |
| `--radius-xl` | 1rem | Large cards, feature sections, stat panels |
| `--radius-full` | 9999rem | Avatars, progress rings, circular indicators |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 3px rgba(26,29,26,0.06)` | Subtle lift, hover states |
| `--shadow-md` | `0 4px 8px -1px rgba(26,29,26,0.08), 0 2px 4px -2px rgba(26,29,26,0.04)` | Dashboard cards, dropdowns |
| `--shadow-lg` | `0 12px 20px -4px rgba(26,29,26,0.12), 0 4px 8px -4px rgba(26,29,26,0.06)` | Modals, session log overlay |

In dark mode, shadow opacities increase for visibility on dark backgrounds:

| Token | Dark Mode Value |
|-------|----------------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 8px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.25)` |
| `--shadow-lg` | `0 12px 20px -4px rgba(0,0,0,0.5), 0 4px 8px -4px rgba(0,0,0,0.3)` |

## Icons & Visual Assets

### Icons

| Recommendation | Alternatives |
|---------------|-------------|
| **Lucide** — Clean, consistent line icons that pair well with the modern, energizing aesthetic. The thin stroke style keeps the UI feeling light and focused. | Phosphor (flexible weights — heavier for more playful feel), Heroicons (Tailwind ecosystem) |

Use icons for navigation, actions (log session, add skill, start timer), streak indicators (flame, calendar), and empty states. Keep sizes consistent — 16px for inline/metadata, 20px for UI actions, 24px for navigation.

### Images

Skills Learning Tracker is data-driven — visual richness comes from progress rings, heatmaps, streaks, and colorful skill cards. Stock photography isn't needed. Your landing page may benefit from a screenshot or illustration showing the populated dashboard.

For skill icons: consider using colored circles with the first letter of each skill name, or simple icons from the icon library (guitar, book, palette, code). Don't require users to upload images — a color + initial is sufficient for visual identity.

### App Favicon

Ship a custom favicon. Consider a stylized progress ring or upward arrow in emerald green. An SVG favicon works across all modern browsers.

## Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--topbar-height` | 3.5rem | Minimal top bar (brand name + avatar) |
| `--content-max-width` | 72rem | Dashboard bento grid |
| `--detail-max-width` | 48rem | Skill detail view, session history |
| `--page-max-width` | 80rem | Overall page container |

## Key Screens for Design Quality

These are the screens where design taste will be most visible. Pay special attention to typography, spacing, and visual hierarchy:

1. **Dashboard / bento grid** — Where users spend 80% of their time. The arrangement of skill cards, heatmap, stats, and session log needs to feel balanced and scannable. The interplay of progress rings, numbers, and color creates the product's personality.
2. **Session logging interaction** — The most frequent action. Whether it's a modal, inline form, or dedicated page, it needs to feel fast, satisfying, and worth doing. The post-log confirmation is a key design moment.
3. **Landing page** — First impression. Progress visualizations (rings, heatmap) should be visible immediately to communicate what the product does. The energizing-but-focused aesthetic should be evident within 2 seconds.

## Quality Spectrum

| Level | What it looks like for Skills Learning Tracker |
|-------|--------------------------------|
| **Adequate** | Skills display with hours and streaks, heatmap renders correctly, session logging works. Consistent spacing and color usage. Looks like a developer's side project — functional but the numbers do most of the talking. |
| **Good** | Dashboard has clear visual hierarchy with a compelling bento layout. Progress rings are well-sized and smoothly rendered. The heatmap feels like a GitHub contribution graph. Streak indicators are motivating. Empty states are considered. Looks like an early-stage productivity app. |
| **Excellent** | The dashboard makes someone say "I want to use this." Progress rings animate smoothly, the heatmap is dense with data and beautifully colored, skill cards have personality through color coding. The session logging flow feels genuinely satisfying — fast, encouraging, and rewarding. The landing page looks like a real product launch. Typography hierarchy between Space Grotesk headings and Inter body creates a distinctive, modern personality. |
